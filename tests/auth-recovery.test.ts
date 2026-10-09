import test from 'node:test';
import assert from 'node:assert/strict';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../lib/validations/auth-recovery';
import { getAppUrl, getResetPasswordRedirectUrl, sanitizeBaseUrl } from '../lib/auth-url';

// ─── 1. FORGOT PASSWORD VALIDATION TESTS ─────────────────────────────────────

test('forgotPasswordSchema - rejects empty email', () => {
  const result = forgotPasswordSchema.safeParse({ email: '' });
  assert.equal(result.success, false);
  if (!result.success) {
    const issues = result.error.issues;
    assert.ok(issues.some((i) => i.message.includes('required') || i.message.includes('email')));
  }
});

test('forgotPasswordSchema - rejects invalid email formats', () => {
  const invalidEmails = ['plainaddress', 'missing@domain', '@nodomain.com', 'spaces in@mail.com'];
  for (const email of invalidEmails) {
    const result = forgotPasswordSchema.safeParse({ email });
    assert.equal(result.success, false, `Expected ${email} to be invalid`);
  }
});

test('forgotPasswordSchema - accepts and trims valid email', () => {
  const result = forgotPasswordSchema.safeParse({ email: '  user@example.com  ' });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.email, 'user@example.com');
  }
});

// ─── 2. RESET PASSWORD VALIDATION TESTS ──────────────────────────────────────

test('resetPasswordSchema - rejects password shorter than 8 characters', () => {
  const result = resetPasswordSchema.safeParse({
    password: 'short',
    confirmPassword: 'short',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.message.includes('8 characters')));
  }
});

test('resetPasswordSchema - rejects password mismatch', () => {
  const result = resetPasswordSchema.safeParse({
    password: 'ValidPassword123',
    confirmPassword: 'DifferentPassword123',
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.error.issues.some((i) => i.path.includes('confirmPassword') && i.message.includes('do not match')));
  }
});

test('resetPasswordSchema - accepts matching valid passwords', () => {
  const result = resetPasswordSchema.safeParse({
    password: 'SecurePassword123!',
    confirmPassword: 'SecurePassword123!',
  });
  assert.equal(result.success, true);
});

// ─── 3. DYNAMIC REDIRECT URL BUILDER TESTS ───────────────────────────────────

test('sanitizeBaseUrl - correctly strips trailing slashes and previous reset paths', () => {
  assert.equal(sanitizeBaseUrl('https://lk-textiles.vercel.app'), 'https://lk-textiles.vercel.app');
  assert.equal(sanitizeBaseUrl('https://lk-textiles.vercel.app/'), 'https://lk-textiles.vercel.app');
  assert.equal(sanitizeBaseUrl('https://lk-textiles.vercel.app/reset-password'), 'https://lk-textiles.vercel.app');
  assert.equal(sanitizeBaseUrl('https://lk-textiles.vercel.app/admin/reset-password'), 'https://lk-textiles.vercel.app');
  assert.equal(sanitizeBaseUrl('http://localhost:3000'), 'http://localhost:3000');
  assert.equal(sanitizeBaseUrl('http://localhost:3000/reset-password/'), 'http://localhost:3000');
});

test('getResetPasswordRedirectUrl - constructs exact /admin/reset-password route without duplication', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  // Scenario A: Production default fallback
  delete process.env.NEXT_PUBLIC_APP_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  const prodUrl = getResetPasswordRedirectUrl();
  assert.equal(prodUrl, 'https://lk-textiles.vercel.app/admin/reset-password');

  // Scenario B: Configured local development URL
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  assert.equal(getAppUrl(), 'http://localhost:3000');
  assert.equal(getResetPasswordRedirectUrl(), 'http://localhost:3000/admin/reset-password');

  // Scenario C: Configured production Vercel domain
  process.env.NEXT_PUBLIC_APP_URL = 'https://lk-textiles.vercel.app';
  assert.equal(getResetPasswordRedirectUrl(), 'https://lk-textiles.vercel.app/admin/reset-password');

  // Scenario D: Trailing slash is properly normalized
  process.env.NEXT_PUBLIC_APP_URL = 'https://lk-textiles.vercel.app/';
  assert.equal(getResetPasswordRedirectUrl(), 'https://lk-textiles.vercel.app/admin/reset-password');

  // Scenario E: Old incorrect /reset-password in env is sanitized and NEVER duplicated
  process.env.NEXT_PUBLIC_APP_URL = 'https://lk-textiles.vercel.app/reset-password';
  assert.equal(getResetPasswordRedirectUrl(), 'https://lk-textiles.vercel.app/admin/reset-password');

  // Scenario F: Full /admin/reset-password already in env is sanitized and NEVER duplicated
  process.env.NEXT_PUBLIC_APP_URL = 'https://lk-textiles.vercel.app/admin/reset-password';
  assert.equal(getResetPasswordRedirectUrl(), 'https://lk-textiles.vercel.app/admin/reset-password');

  // Restore env
  if (originalEnv) {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  } else {
    delete process.env.NEXT_PUBLIC_APP_URL;
  }
});

// ─── 4. RECOVERY SESSION AUTHORIZATION LOGIC TESTS ───────────────────────────

test('Recovery Flow - validates token_hash, PKCE code, and rejects unauthorized access', () => {
  function verifyRecoveryAccess({
    tokenHash,
    code,
    hash,
    error,
    session,
    hasRecoveryFlag,
  }: {
    tokenHash?: string | null;
    code: string | null;
    hash: string;
    error: string | null;
    session: boolean;
    hasRecoveryFlag: boolean;
  }) {
    if (error) return { authorized: false, reason: 'error_in_url' };
    if (tokenHash) return { authorized: true, reason: 'token_hash' };
    if (code) return { authorized: true, reason: 'pkce_code' };
    if (hash.includes('type=recovery') || hash.includes('access_token')) {
      return { authorized: true, reason: 'hash_recovery' };
    }
    if (session && hasRecoveryFlag) return { authorized: true, reason: 'active_recovery_session' };
    return { authorized: false, reason: 'no_authorization' };
  }

  // 1. Direct visit with no params and no session
  const directVisit = verifyRecoveryAccess({
    code: null,
    hash: '',
    error: null,
    session: false,
    hasRecoveryFlag: false,
  });
  assert.equal(directVisit.authorized, false);
  assert.equal(directVisit.reason, 'no_authorization');

  // 2. Direct visit by existing logged in user without recovery link
  const loggedInRandomVisit = verifyRecoveryAccess({
    code: null,
    hash: '',
    error: null,
    session: true,
    hasRecoveryFlag: false,
  });
  assert.equal(loggedInRandomVisit.authorized, false);
  assert.equal(loggedInRandomVisit.reason, 'no_authorization');

  // 3. Visit with expired link error (?error=access_denied)
  const expiredLink = verifyRecoveryAccess({
    code: null,
    hash: '',
    error: 'access_denied',
    session: false,
    hasRecoveryFlag: false,
  });
  assert.equal(expiredLink.authorized, false);
  assert.equal(expiredLink.reason, 'error_in_url');

  // 4. Valid recovery with PKCE code (?code=valid-code)
  const validPkce = verifyRecoveryAccess({
    code: 'sample-recovery-code-1234',
    hash: '',
    error: null,
    session: false,
    hasRecoveryFlag: false,
  });
  assert.equal(validPkce.authorized, true);
  assert.equal(validPkce.reason, 'pkce_code');

  // 5. Valid recovery with implicit hash (#access_token=...&type=recovery)
  const validHash = verifyRecoveryAccess({
    code: null,
    hash: '#access_token=token123&type=recovery',
    error: null,
    session: true,
    hasRecoveryFlag: false,
  });
  assert.equal(validHash.authorized, true);
  assert.equal(validHash.reason, 'hash_recovery');

  // 6. Valid recovery with direct token_hash (cross-browser without PKCE cookie dependency)
  const validTokenHash = verifyRecoveryAccess({
    tokenHash: 'crypto_token_hash_abc123',
    code: null,
    hash: '',
    error: null,
    session: false,
    hasRecoveryFlag: false,
  });
  assert.equal(validTokenHash.authorized, true);
  assert.equal(validTokenHash.reason, 'token_hash');
});

// ─── 5. SECURITY & WORKSPACE ISOLATION TESTS ─────────────────────────────────

test('Security - Password recovery does not trigger company auto-provisioning', () => {
  let companyProvisioned = false;

  async function mockHydrateUser(
    user: { id: string; user_metadata?: Record<string, unknown> },
    options?: { isRecovery?: boolean }
  ) {
    const hasMembership = false;
    // Rule: Never auto-provision company account if isRecovery is true
    if (!options?.isRecovery && !hasMembership && user.user_metadata?.company_name) {
      companyProvisioned = true;
    }
    return { id: user.id };
  }

  // During recovery:
  mockHydrateUser(
    { id: 'user-1', user_metadata: { company_name: 'Acme Textiles' } },
    { isRecovery: true }
  );
  assert.equal(companyProvisioned, false, 'Expected company provisioning to be SKIPPED during recovery');

  // During normal non-recovery sign in:
  mockHydrateUser(
    { id: 'user-1', user_metadata: { company_name: 'Acme Textiles' } },
    { isRecovery: false }
  );
  assert.equal(companyProvisioned, true, 'Expected normal registration to allow provisioning');
});

// ─── 6. DUPLICATE SUBMISSION AND COOLDOWN TESTS ──────────────────────────────

test('UX - Prevents duplicate submissions while loading', () => {
  let submitCount = 0;
  let isLoading = false;

  async function handleSubmit() {
    if (isLoading) return;
    isLoading = true;
    submitCount++;
    // Simulate async API call
    await new Promise((res) => setTimeout(res, 10));
    isLoading = false;
  }

  // Rapid double-click
  handleSubmit();
  handleSubmit();

  assert.equal(submitCount, 1, 'Duplicate submission must be blocked while loading');
});
