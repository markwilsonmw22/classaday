/* Signed membership cookie (sa_m). Works in the Edge middleware and in Node functions (Web Crypto).
   Format: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload part)). */

const enc = new TextEncoder();
const dec = new TextDecoder();

export const COOKIE = "sa_m";
export const MAX_AGE = 60 * 60 * 24; // 24 hours: the browser refreshes it from /api/session/ before then

function b64urlFromBytes(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesFromB64url(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const keys = new Map();
function hmacKey(secret) {
  if (!keys.has(secret)) {
    keys.set(secret, crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]));
  }
  return keys.get(secret);
}

/** The secret that signs member cookies. MEMBER_COOKIE_SECRET wins; otherwise one is derived from the Supabase secret key. */
export async function cookieSecret(env = process.env) {
  if (env.MEMBER_COOKIE_SECRET && env.MEMBER_COOKIE_SECRET.length >= 32) return env.MEMBER_COOKIE_SECRET;
  if (env.SUPABASE_SECRET_KEY) {
    const sig = await crypto.subtle.sign("HMAC", await hmacKey(env.SUPABASE_SECRET_KEY), enc.encode("schoolaura member cookie v1"));
    return b64urlFromBytes(new Uint8Array(sig));
  }
  return "";
}

export async function sign(payload, secret) {
  if (!secret) throw new Error("No cookie secret");
  const body = b64urlFromBytes(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body));
  return body + "." + b64urlFromBytes(new Uint8Array(sig));
}

/** Returns the payload when the signature is valid and it has not expired, otherwise null. */
export async function verify(token, secret, now = Date.now()) {
  if (!token || !secret || typeof token !== "string") return null;
  const dot = token.indexOf(".");
  if (dot < 1 || dot !== token.lastIndexOf(".")) return null;
  const body = token.slice(0, dot);
  let sig;
  try { sig = bytesFromB64url(token.slice(dot + 1)); } catch (e) { return null; }
  const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), sig, enc.encode(body));
  if (!ok) return null;
  let payload;
  try { payload = JSON.parse(dec.decode(bytesFromB64url(body))); } catch (e) { return null; }
  if (!payload || typeof payload.exp !== "number" || payload.exp * 1000 <= now) return null;
  return payload;
}

export function readCookie(header, name = COOKIE) {
  if (!header) return "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return "";
}

export function setCookieHeader(value, maxAge = MAX_AGE, secure = true) {
  return `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export function clearCookieHeader(secure = true) {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

/** Is this request from a paying member? Used by the middleware. */
export async function memberFromRequest(request, env = process.env) {
  const token = readCookie(request.headers.get("cookie"));
  if (!token) return null;
  return verify(token, await cookieSecret(env));
}
