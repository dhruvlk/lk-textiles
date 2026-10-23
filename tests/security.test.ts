import test from "node:test";
import assert from "node:assert/strict";
import { safeNextPath } from "../lib/security/safe-redirect";
import { escapeHtml, toSingleLine } from "../lib/security/html";
import { checkRateLimit, resetRateLimit } from "../lib/security/rate-limit";
import { orIlikeValue } from "../lib/table/pagination";

test("safeNextPath keeps same-origin relative paths", () => {
  assert.equal(safeNextPath("/admin/reset-password"), "/admin/reset-password");
  assert.equal(safeNextPath("/admin/invoices?page=2#top"), "/admin/invoices?page=2#top");
});

test("safeNextPath rejects open-redirect payloads", () => {
  for (const bad of [
    "https://evil.example",
    "//evil.example/path",
    "/\\evil.example",
    "javascript:alert(1)",
    "admin",
    "/admin\n//evil.example",
    "",
    null,
    undefined,
  ]) {
    assert.equal(safeNextPath(bad as string | null | undefined), "/admin", `should reject ${String(bad)}`);
  }
  assert.equal(safeNextPath("//evil.example", "/x"), "/x");
});

test("escapeHtml neutralises markup", () => {
  assert.equal(
    escapeHtml(`<img src=x onerror="alert('x')">&`),
    "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;"
  );
  assert.equal(escapeHtml(null), "");
  assert.equal(toSingleLine("a\r\nBcc: x@y.z"), "a Bcc: x@y.z");
});

test("checkRateLimit blocks after the limit within a window and resets after it", () => {
  resetRateLimit();
  const key = "test:1.2.3.4";
  const t0 = 1_000_000;
  for (let i = 0; i < 3; i++) assert.equal(checkRateLimit(key, 3, 60_000, t0).allowed, true);
  const blocked = checkRateLimit(key, 3, 60_000, t0 + 1000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSeconds, 59);
  assert.equal(checkRateLimit(key, 3, 60_000, t0 + 60_001).allowed, true);
  resetRateLimit();
});

test("orIlikeValue quotes PostgREST or() operands", () => {
  assert.equal(orIlikeValue("  shah "), '"%shah%"');
  // Reserved characters stay inside the quoted value instead of breaking the filter.
  assert.equal(orIlikeValue("Shah, Ltd (A)"), '"%Shah, Ltd (A)%"');
  assert.equal(orIlikeValue('a"b\\c'), '"%a\\"b\\\\c%"');
});
