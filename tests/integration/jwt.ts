import crypto from "node:crypto";

/** HS256 JWT for the local PostgREST test server. */
export function signJwt(payload: Record<string, unknown>, secret: string): string {
  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = enc({ alg: "HS256", typ: "JWT" });
  const body = enc({ exp: Math.floor(Date.now() / 1000) + 3600, ...payload });
  const sig = crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}
