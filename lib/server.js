/* Shared helpers for the /api functions: responses, Supabase (auth, user-scoped reads, admin writes),
   Stripe REST calls and webhook signatures. No npm dependencies: everything uses fetch and Web Crypto. */
import CONFIG from "./site-config.js";
import { cookieSecret, sign, setCookieHeader, clearCookieHeader, MAX_AGE } from "./token.js";

const enc = new TextEncoder();

/* ---------------------------------------------------------------- responses */

export function json(data, status = 200, headers = {}) {
  const h = new Headers({ "content-type": "application/json; charset=utf-8", "cache-control": "private, no-store" });
  for (const [k, v] of Object.entries(headers)) {
    if (v == null) continue;
    if (Array.isArray(v)) v.forEach((x) => h.append(k, x)); else h.set(k, v);
  }
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function fail(status, error, extra = {}) {
  return json({ error, ...extra }, status);
}

export function bearer(request) {
  const m = /^Bearer\s+(\S+)$/i.exec(request.headers.get("authorization") || "");
  return m ? m[1] : "";
}

/** Secure cookies everywhere except plain-http local testing. */
export function isSecure(request) {
  return !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(request.url);
}

export function siteUrl(request) {
  const env = (process.env.SITE_URL || "").replace(/\/$/, "");
  return env || new URL(request.url).origin;
}

export async function readJson(request) {
  try { return await request.json(); } catch (e) { return {}; }
}

/* ---------------------------------------------------------------- Supabase */

export function supabaseUrl() {
  return (process.env.SUPABASE_URL || CONFIG.supabaseUrl).replace(/\/$/, "");
}

export function publishableKey() {
  return process.env.SUPABASE_PUBLISHABLE_KEY || CONFIG.supabaseKey;
}

/** The signed-in user for a Supabase access token, checked with Supabase Auth (so logged-out tokens fail). */
export async function getUser(token) {
  if (!token) return null;
  const r = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { apikey: publishableKey(), authorization: `Bearer ${token}` },
  });
  if (r.status === 401 || r.status === 403) return null;
  if (!r.ok) throw new Error(`auth ${r.status}`);
  const u = await r.json();
  return u && u.id ? u : null;
}

/** The user's own members row, read with their token so row-level security applies. */
export async function getMemberRow(token, uid) {
  const r = await fetch(`${supabaseUrl()}/rest/v1/members?user_id=eq.${encodeURIComponent(uid)}&select=*`, {
    headers: { apikey: publishableKey(), authorization: `Bearer ${token}`, accept: "application/json" },
  });
  if (!r.ok) throw new Error(`members read ${r.status}`);
  const rows = await r.json();
  return rows[0] || null;
}

function adminHeaders(extra = {}) {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY is not set");
  const h = { apikey: key, "content-type": "application/json", accept: "application/json", ...extra };
  // New sb_secret_ keys go in the apikey header only; legacy service_role keys are JWTs and also go in Authorization.
  if (!key.startsWith("sb_")) h.authorization = `Bearer ${key}`;
  return h;
}

export async function adminRest(method, path, body, prefer) {
  const r = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    method,
    headers: adminHeaders(prefer ? { prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`supabase ${method} ${path.split("?")[0]} ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

export async function adminMemberBy(field, value) {
  if (!value) return null;
  const rows = await adminRest("GET", `members?${field}=eq.${encodeURIComponent(value)}&select=*&limit=1`);
  return rows[0] || null;
}

/** Insert or update a members row. Only the keys present in `row` change on update. */
export async function upsertMember(row) {
  const clean = Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));
  const rows = await adminRest("POST", "members?on_conflict=user_id", clean, "resolution=merge-duplicates,return=representation");
  return rows && rows[0];
}

/* ---------------------------------------------------------------- membership */

const MONTHLY_OK = ["active", "trialing", "past_due"];

/** Lifetime members keep access until refunded; monthly members while Stripe says the subscription is
    active, trialing or past due (Stripe is still retrying the card). */
export function isActive(row) {
  if (!row) return false;
  if (row.plan === "lifetime") return row.status === "active";
  if (row.plan === "monthly") return MONTHLY_OK.includes(row.status);
  return false;
}

export function summary(row) {
  return {
    member: isActive(row),
    plan: row ? row.plan || null : null,
    status: row ? row.status : "none",
    renews: row && row.plan === "monthly" ? row.current_period_end : null,
    cancelAtPeriodEnd: !!(row && row.cancel_at_period_end),
    billing: !!(row && row.stripe_customer_id),
  };
}

export async function memberCookieHeader(uid, plan, secure) {
  const secret = await cookieSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return setCookieHeader(await sign({ uid, plan, exp }, secret), MAX_AGE, secure);
}

export { clearCookieHeader };

/* ---------------------------------------------------------------- Stripe */

export function stripeReady() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function currency() {
  return (process.env.PRICE_CURRENCY || CONFIG.currency || "cad").toLowerCase();
}

export function taxEnabled() {
  return String(process.env.STRIPE_AUTOMATIC_TAX || "").toLowerCase() === "true";
}

/** Stripe's form encoding: nested objects become a[b][c]=v and arrays a[0]=v. */
export function formEncode(obj, prefix = "", out = []) {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item && typeof item === "object") formEncode(item, `${key}[${i}]`, out);
        else out.push([`${key}[${i}]`, String(item)]);
      });
    } else if (typeof v === "object") formEncode(v, key, out);
    else out.push([key, String(v)]);
  }
  return out;
}

export async function stripe(method, path, params) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw Object.assign(new Error("STRIPE_SECRET_KEY is not set"), { status: 503 });
  const base = (process.env.STRIPE_API_BASE || "https://api.stripe.com").replace(/\/$/, "");
  const qs = new URLSearchParams(formEncode(params)).toString();
  let url = `${base}/v1${path}`;
  let body;
  if (method === "GET" || method === "DELETE") { if (qs) url += (url.includes("?") ? "&" : "?") + qs; }
  else body = qs;
  const r = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = data && data.error ? data.error : {};
    throw Object.assign(new Error(err.message || `Stripe ${r.status}`), { status: r.status, code: err.code, type: err.type });
  }
  return data;
}

function hex(buf) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}

/** Checks the Stripe-Signature header: HMAC-SHA256 of "t.payload", within `tolerance` seconds. */
export async function verifyStripeSignature(payload, header, secret, tolerance = 300, now = Date.now()) {
  if (!header || !secret) return false;
  let t = "";
  const v1 = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1.push(v);
  }
  if (!/^\d+$/.test(t) || !v1.length) return false;
  if (Math.abs(now / 1000 - Number(t)) > tolerance) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)));
  return v1.some((s) => sameString(s, expected));
}

/** Builds a Stripe-Signature header (used by the tests). */
export async function signStripePayload(payload, secret, t = Math.floor(Date.now() / 1000)) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return `t=${t},v1=${hex(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)))}`;
}

export function idOf(x) {
  return typeof x === "string" ? x : x && x.id ? x.id : undefined;
}
