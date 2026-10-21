/* POST /api/session/  (Authorization: Bearer <Supabase access token>)
   Checks the user with Supabase, reads their membership and sets or clears the signed member cookie
   that unlocks members-only pages. DELETE clears the cookie (used on log out). */
import {
  json, fail, bearer, isSecure, getUser, getMemberRow, summary, memberCookieHeader, clearCookieHeader,
} from "../lib/server.js";

export async function POST(request) {
  const secure = isSecure(request);
  const token = bearer(request);
  let user = null;
  try { user = await getUser(token); } catch (e) {
    console.error("session: auth check failed", e.message);
    return fail(502, "auth_unavailable");
  }
  if (!user) return json({ user: null, member: false }, 401, { "set-cookie": clearCookieHeader(secure) });

  let row = null;
  try { row = await getMemberRow(token, user.id); } catch (e) {
    console.error("session: members read failed", e.message);
    return fail(502, "db_unavailable");
  }
  const s = summary(row);
  const headers = {};
  if (s.member) {
    const cookie = await memberCookieHeader(user.id, row.plan, secure);
    if (cookie) headers["set-cookie"] = cookie;
    else { console.error("session: no cookie secret configured"); s.cookie = false; }
  } else {
    headers["set-cookie"] = clearCookieHeader(secure);
  }
  return json({ user: { id: user.id, email: user.email }, ...s }, 200, headers);
}

export async function DELETE(request) {
  return json({ ok: true }, 200, { "set-cookie": clearCookieHeader(isSecure(request)) });
}
