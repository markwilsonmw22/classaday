/* Serves the site locally the way Vercel does: static files from public/ (clean URLs, trailing slashes),
   middleware.js in front of pages, and the functions in api/.

     FAKE_BACKEND=1 node tests/e2e/server.mjs 8790
       In-memory Supabase and Stripe (see tests/fake.js). Extra routes for browser tests:
         /__fake/sb/<path>     the fake Supabase over HTTP (point the browser's Supabase calls here)
         GET  /__fake/state    the fake database and Stripe calls, as JSON
         POST /__fake/event    { type, object } -> signed and sent to /api/stripe-webhook/

   Build first with SA_LIVE=1 python3 build/build.py to see members-only content locked. */
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.argv[2] || 8790);
const ORIGIN = `http://127.0.0.1:${PORT}`;

let backend = null;
if (process.env.FAKE_BACKEND === "1") {
  const fake = await import("../fake.js");
  fake.setEnv({ SITE_URL: ORIGIN });
  backend = fake.makeBackend();
  backend.install();
}
const { default: middleware, config: mwConfig } = await import("../../middleware.js");
const { signStripePayload } = await import("../../lib/server.js");
const MATCH = new RegExp(`^${mwConfig.matcher[0]}$`);

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png",
  ".woff2": "font/woff2", ".pdf": "application/pdf", ".zip": "application/zip", ".xml": "application/xml", ".txt": "text/plain" };

async function sendWeb(res, r) {
  const headers = {};
  r.headers.forEach((v, k) => { if (k !== "set-cookie") headers[k] = v; });
  const cookies = r.headers.getSetCookie ? r.headers.getSetCookie() : [];
  if (cookies.length) headers["set-cookie"] = cookies;
  res.writeHead(r.status, headers);
  res.end(Buffer.from(await r.arrayBuffer()));
}

async function serveStatic(res, pathname, status = 200) {
  let p;
  try { p = decodeURIComponent(pathname); } catch (e) { p = pathname; }
  let file = path.join(PUBLIC, p);
  if (!file.startsWith(PUBLIC)) { res.writeHead(400).end(); return; }
  try {
    const st = await stat(file);
    if (st.isDirectory()) {
      if (!p.endsWith("/")) { res.writeHead(308, { location: p + "/" }).end(); return; }
      file = path.join(file, "index.html");
    }
    await stat(file);
  } catch (e) {
    try { await stat(file.replace(/\/$/, "") + ".html"); file = file.replace(/\/$/, "") + ".html"; }
    catch (e2) { const nf = await readFile(path.join(PUBLIC, "404.html")); res.writeHead(404, { "content-type": TYPES[".html"] }).end(nf); return; }
  }
  const headers = { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "public, max-age=0, must-revalidate" };
  if (p.startsWith("/downloads/")) headers["content-disposition"] = "attachment";
  res.writeHead(status, headers).end(await readFile(file));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, ORIGIN);
    const body = ["GET", "HEAD"].includes(req.method) ? undefined : await readBody(req);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
    if (!headers.has("x-vercel-ip-country") && process.env.FAKE_COUNTRY) headers.set("x-vercel-ip-country", process.env.FAKE_COUNTRY);
    const request = new Request(url, { method: req.method, headers, body });

    if (backend && url.pathname.startsWith("/__fake/")) {
      if (url.pathname.startsWith("/__fake/sb/")) {
        const target = "https://sb.test/" + url.pathname.slice("/__fake/sb/".length) + url.search;
        return sendWeb(res, await backend.handler(target, { method: req.method, headers, body: body && body.length ? body.toString() : undefined }));
      }
      if (url.pathname === "/__fake/state") {
        res.writeHead(200, { "content-type": "application/json" });
        return res.end(JSON.stringify({ db: backend.db, sessions: backend.stripe.sessions, prices: backend.stripe.prices, otps: backend.otps }));
      }
      if (url.pathname === "/__fake/event" && req.method === "POST") {
        const { type, object } = JSON.parse(body.toString());
        if (object && object.object === "subscription") backend.stripe.subs.set(object.id, object);
        const payload = JSON.stringify({ id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`, type, data: { object } });
        const wh = await import("../../api/stripe-webhook.js");
        return sendWeb(res, await wh.POST(new Request(`${ORIGIN}/api/stripe-webhook/`, {
          method: "POST", headers: { "stripe-signature": await signStripePayload(payload, process.env.STRIPE_WEBHOOK_SECRET) }, body: payload })));
      }
    }

    const api = /^\/api\/([a-z-]+)\/?$/.exec(url.pathname);
    if (api) {
      let mod;
      try { mod = await import(`../../api/${api[1]}.js`); } catch (e) { res.writeHead(404).end(); return; }
      const fn = mod[req.method];
      if (!fn) { res.writeHead(405).end(); return; }
      return sendWeb(res, await fn(request));
    }

    if (MATCH.test(url.pathname)) {
      const r = await middleware(request);
      const rw = r.headers.get("x-middleware-rewrite");
      if (rw) return serveStatic(res, new URL(rw).pathname);
      if (!r.headers.get("x-middleware-next")) return sendWeb(res, r);
    }
    return serveStatic(res, url.pathname);
  } catch (e) {
    console.error(e);
    res.writeHead(500).end(String(e && e.stack));
  }
});

server.listen(PORT, "127.0.0.1", () => console.log(`SchoolAura on ${ORIGIN}${backend ? " (fake Supabase and Stripe)" : ""}`));
