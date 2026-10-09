import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = (requestUrl.searchParams.get('type') ?? 'recovery') as 'recovery' | 'email';
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const next = requestUrl.searchParams.get('next') ?? '/admin';

  // Handle Supabase error redirect
  if (error) {
    const targetUrl = new URL(
      next.startsWith('/admin/reset-password') ? '/admin/reset-password' : '/admin/login',
      requestUrl.origin
    );
    targetUrl.searchParams.set('error', error);
    if (errorDescription) {
      targetUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(targetUrl);
  }

  // Handle token_hash verification (works cross-browser without requiring PKCE verifier)
  if (tokenHash) {
    const supabase = await createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === 'recovery' ? 'recovery' : 'email',
    });

    if (verifyError) {
      const targetUrl = new URL(
        next.startsWith('/admin/reset-password') ? '/admin/reset-password' : '/admin/login',
        requestUrl.origin
      );
      targetUrl.searchParams.set('error', 'invalid_token');
      targetUrl.searchParams.set('error_description', verifyError.message);
      return NextResponse.redirect(targetUrl);
    }

    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  // Handle PKCE code exchange
  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      const targetUrl = new URL(
        next.startsWith('/admin/reset-password') ? '/admin/reset-password' : '/admin/login',
        requestUrl.origin
      );
      targetUrl.searchParams.set('error', 'invalid_grant');
      targetUrl.searchParams.set('error_description', exchangeError.message);
      return NextResponse.redirect(targetUrl);
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  if (isLocalEnv) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } else if (forwardedHost) {
    return NextResponse.redirect(new URL(next, `https://${forwardedHost}`));
  } else {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }
}
