/* A fake Supabase + Stripe behind globalThis.fetch, for testing the /api functions without the network. */
export const ENV = {
  SUPABASE_URL: "https://sb.test",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
  SUPABASE_SECRET_KEY: "sb_secret_test",
  STRIPE_SECRET_KEY: "sk_test_123",
  STRIPE_API_BASE: "https://stripe.test",
  STRIPE_WEBHOOK_SECRET: "whsec_test",
  MEMBER_COOKIE_SECRET: "test-cookie-secret-that-is-long-enough-123",
  SITE_URL: "https://classaday.test",
};

export function setEnv(extra = {}) {
  for (const k of ["STRIPE_AUTOMATIC_TAX", "PRICE_CURRENCY", "STRIPE_PRICE_MONTHLY_FULL"]) delete process.env[k];
  Object.assign(process.env, ENV, extra);
}

function parseForm(body) {
  const out = {};
  for (const [k, v] of new URLSearchParams(body || "")) out[k] = v;
  return out;
}

export function makeBackend() {
  const db = { members: [], stripe_events: [], progress: [] };
  const users = new Map(); // access token -> user
  const stripe = { products: new Map(), prices: [], subs: new Map(), sessions: [], portal: [], deleted: [] };
  const calls = [];
  const otps = [];
  let n = 0;
  const pgNow = () => new Date().toISOString().replace("Z", `${String(++n % 1000).padStart(3, "0")}+00:00`);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

  function sessionFor(email) {
    let user = [...users.values()].find((u) => u.email === email);
    if (!user) user = { id: `00000000-0000-4000-8000-${String(users.size + 1).padStart(12, "0")}`, email };
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: user.id, email, role: "authenticated", aud: "authenticated", exp, n: ++n })}.sig`;
    users.set(token, user);
    return { access_token: token, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: `rt:${email}`,
             user: { id: user.id, aud: "authenticated", role: "authenticated", email, app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-10-01T00:00:00Z" } };
  }

  function filterRows(rows, params) {
    return rows.filter((r) => {
      for (const [k, v] of params) {
        if (["select", "limit", "on_conflict"].includes(k)) continue;
        if (!v.startsWith("eq.")) continue;
        if (String(r[k]) !== v.slice(3)) return false;
      }
      return true;
    });
  }

  async function handler(url, init = {}) {
    const u = new URL(url);
    const method = (init.method || "GET").toUpperCase();
    const headers = new Headers(init.headers || {});
    calls.push({ method, url: u.href, headers, body: init.body });
    const res = (status, body) => new Response(body === undefined ? "" : JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

    if (u.origin === ENV.SUPABASE_URL) {
      if (u.pathname === "/auth/v1/settings") return res(200, { external: { email: true, google: false } });
      if (u.pathname === "/auth/v1/otp" && method === "POST") { otps.push(JSON.parse(init.body || "{}")); return res(200, {}); }
      if (u.pathname === "/auth/v1/verify" && method === "POST") {
        const b = JSON.parse(init.body || "{}");
        if (b.token !== "123456") return res(403, { code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" });
        return res(200, sessionFor(b.email));
      }
      if (u.pathname === "/auth/v1/token" && method === "POST") {
        const b = JSON.parse(init.body || "{}");
        return b.refresh_token ? res(200, sessionFor(String(b.refresh_token).replace(/^rt:/, ""))) : res(400, {});
      }
      if (u.pathname === "/auth/v1/logout") return new Response(null, { status: 204 });
      if (u.pathname === "/auth/v1/user") {
        const tok = (headers.get("authorization") || "").replace(/^Bearer /, "");
        const user = users.get(tok);
        return user ? res(200, user) : res(401, { msg: "invalid JWT" });
      }
      const table = u.pathname.replace("/rest/v1/", "");
      const isAdmin = headers.get("apikey") === ENV.SUPABASE_SECRET_KEY;
      let rows = db[table];
      if (!rows) return res(404, {});
      if (!isAdmin) {
        // row-level security: a user only sees their own rows, and may only write their own progress
        const user = users.get((headers.get("authorization") || "").replace(/^Bearer /, ""));
        if (!user) return res(401, {});
        rows = rows.filter((r) => r.user_id === user.id);
        if (method !== "GET" && table !== "progress") return res(403, {});
        if (table === "progress" && method === "POST") {
          const row = JSON.parse(init.body);
          if (row.user_id !== user.id) return res(403, {});
          if (db.progress.some((r) => r.user_id === row.user_id)) return res(409, { code: "23505" });
          const fresh = { ...row, updated_at: pgNow() };
          db.progress.push(fresh);
          return res(201, [fresh]);
        }
        if (table === "progress" && method === "PATCH") {
          const hit = filterRows(rows, u.searchParams);
          hit.forEach((r) => Object.assign(r, JSON.parse(init.body), { updated_at: pgNow() }));
          return res(200, hit);
        }
      }
      if (method === "GET") {
        const out = filterRows(rows, u.searchParams);
        const limit = Number(u.searchParams.get("limit") || 0);
        return res(200, limit ? out.slice(0, limit) : out);
      }
      if (method === "POST") {
        const row = JSON.parse(init.body);
        const prefer = headers.get("prefer") || "";
        const key = u.searchParams.get("on_conflict") || (table === "stripe_events" ? "id" : "user_id");
        const found = db[table].find((r) => r[key] === row[key]);
        if (found) {
          if (prefer.includes("ignore-duplicates")) return res(201, []);
          if (prefer.includes("merge-duplicates")) { Object.assign(found, row, { updated_at: new Date().toISOString() }); return res(201, [found]); }
          return res(409, { code: "23505" });
        }
        const fresh = { ...(table === "members" ? { status: "none", cancel_at_period_end: false } : {}), ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        db[table].push(fresh);
        return res(201, [fresh]);
      }
    }

    if (u.origin === ENV.STRIPE_API_BASE) {
      if (headers.get("authorization") !== `Bearer ${ENV.STRIPE_SECRET_KEY}`) return res(401, { error: { message: "bad key" } });
      const p = u.pathname.replace(/^\/v1/, "");
      const f = parseForm(init.body);
      let m;
      if ((m = /^\/products\/(.+)$/.exec(p)) && method === "GET") {
        return stripe.products.has(m[1]) ? res(200, stripe.products.get(m[1])) : res(404, { error: { message: "No such product", code: "resource_missing" } });
      }
      if (p === "/products" && method === "POST") {
        if (stripe.products.has(f.id)) return res(400, { error: { message: "exists", code: "resource_already_exists" } });
        stripe.products.set(f.id, { id: f.id, name: f.name, tax_code: f.tax_code });
        return res(200, stripe.products.get(f.id));
      }
      if (p === "/prices" && method === "GET") {
        const key = u.searchParams.get("lookup_keys[0]");
        return res(200, { data: stripe.prices.filter((x) => x.lookup_key === key && x.active) });
      }
      if (p === "/prices" && method === "POST") {
        const price = { id: `price_${++n}`, active: true, ...f, unit_amount: Number(f.unit_amount) };
        stripe.prices.push(price);
        return res(200, price);
      }
      if (p === "/checkout/sessions" && method === "POST") {
        const s = { id: `cs_${++n}`, url: `https://checkout.stripe.test/cs_${n}`, params: f };
        stripe.sessions.push(s);
        return res(200, s);
      }
      if (p === "/billing_portal/sessions" && method === "POST") {
        stripe.portal.push(f);
        return res(200, { url: "https://billing.stripe.test/p_1" });
      }
      if ((m = /^\/subscriptions\/(.+)$/.exec(p))) {
        const sub = stripe.subs.get(m[1]);
        if (!sub) return res(404, { error: { message: "No such subscription" } });
        if (method === "DELETE") { sub.status = "canceled"; stripe.deleted.push(sub.id); return res(200, sub); }
        return res(200, sub);
      }
    }
    return res(599, { error: { message: `fake backend: no route for ${method} ${u.href}` } });
  }

  return {
    db, users, stripe, calls, otps, handler,
    install() { globalThis.fetch = handler; },
    addUser(token, id, email) { const u = { id, email }; users.set(token, u); return u; },
    member(uid) { return db.members.find((r) => r.user_id === uid) || null; },
  };
}

export function req(url, { method = "GET", token, body, headers = {}, cookie } = {}) {
  const h = new Headers(headers);
  if (token) h.set("authorization", `Bearer ${token}`);
  if (cookie) h.set("cookie", cookie);
  if (body !== undefined && typeof body !== "string") { h.set("content-type", "application/json"); body = JSON.stringify(body); }
  return new Request(url, { method, headers: h, body });
}
