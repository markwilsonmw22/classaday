import { test } from "node:test";
import assert from "node:assert/strict";
import { sign, verify, readCookie, cookieSecret, memberFromRequest } from "../lib/token.js";
import { classify, normalize } from "../lib/gate.js";
import CONFIG from "../lib/site-config.js";
import middleware from "../middleware.js";

const SECRET = "a-very-long-secret-for-the-member-cookie-0123456789";
const now = () => Math.floor(Date.now() / 1000);

test("member cookie: valid, tampered, expired, wrong secret", async () => {
  const tok = await sign({ uid: "u1", plan: "monthly", exp: now() + 60 }, SECRET);
  assert.equal((await verify(tok, SECRET)).uid, "u1");
  const [body, sig] = tok.split(".");
  const forged = Buffer.from(JSON.stringify({ uid: "u2", plan: "lifetime", exp: now() + 9e6 })).toString("base64url");
  assert.equal(await verify(`${forged}.${sig}`, SECRET), null, "payload swap must fail");
  assert.equal(await verify(`${body}.${sig.slice(0, -2)}AA`, SECRET), null, "signature change must fail");
  assert.equal(await verify(tok, SECRET + "x"), null, "other secret must fail");
  assert.equal(await verify(await sign({ uid: "u1", exp: now() - 1 }, SECRET), SECRET), null, "expired must fail");
  assert.equal(await verify(await sign({ uid: "u1" }, SECRET), SECRET), null, "no exp must fail");
  for (const junk of ["", "abc", "a.b.c", ".", "x.", ".y", null, 42]) assert.equal(await verify(junk, SECRET), null);
});

test("cookie secret: explicit secret wins, otherwise derived from the Supabase secret key, otherwise none", async () => {
  assert.equal(await cookieSecret({ MEMBER_COOKIE_SECRET: SECRET }), SECRET);
  const d1 = await cookieSecret({ SUPABASE_SECRET_KEY: "sb_secret_abc" });
  const d2 = await cookieSecret({ SUPABASE_SECRET_KEY: "sb_secret_abc" });
  assert.ok(d1.length >= 40 && d1 === d2 && d1 !== "sb_secret_abc");
  assert.equal(await cookieSecret({ MEMBER_COOKIE_SECRET: "short" }), "");
  assert.equal(await cookieSecret({}), "");
});

test("readCookie picks the right cookie", () => {
  assert.equal(readCookie("a=1; sa_m=xyz.abc; b=2"), "xyz.abc");
  assert.equal(readCookie("xsa_m=1; sa_mm=2"), "");
  assert.equal(readCookie(null), "");
});

const GATE = { freeDays: [1], freePrompts: ["newest-pack", "second-pack"] };

test("gate: lessons, prompts and downloads", () => {
  assert.equal(classify("/courses/ai-mastery/day-1/", GATE), null);
  assert.deepEqual(classify("/courses/ai-mastery/day-2/", GATE), { type: "lesson", target: "/courses/ai-mastery/day-2/preview/" });
  for (const p of ["/courses/ai-mastery/day-2", "/courses/ai-mastery/day-2/index.html", "/courses/ai-mastery/day-2/index",
    "/Courses/AI-Mastery/Day-2/", "/courses//ai-mastery/day-2/", "//courses/ai-mastery/day-2/", "/courses/ai-mastery/day-%32/",
    "/courses/ai-mastery/day-2%2Findex.html", "/courses/ai-mastery/x/../day-2/", "/assets/../courses/ai-mastery/day-2/",
    "/courses/ai-mastery/day-2/preview/../", "/%63ourses/ai-mastery/day-2/", "/courses/ai-mastery/day-2/%2e%2e/day-2/",
    "/courses\\ai-mastery\\day-2\\"]) {
    assert.equal(classify(p, GATE)?.type, "lesson", p);
  }
  assert.equal(classify("/courses/ai-mastery/day-2/preview/", GATE), null);
  assert.equal(classify("/courses/ai-mastery/", GATE), null);
  assert.equal(classify("/courses/ai-mastery/course-data.js", GATE), null);
  assert.equal(classify("/courses/", GATE), null);

  assert.equal(classify("/prompts/", GATE).type, "hub");
  assert.equal(classify("/prompts", GATE).type, "hub");
  assert.equal(classify("/prompts/index.html", GATE).type, "hub");
  assert.equal(classify("/prompts/preview/", GATE), null);
  assert.equal(classify("/prompts/newest-pack/", GATE), null);
  assert.deepEqual(classify("/prompts/old-pack/", GATE), { type: "pack", target: "/prompts/old-pack/preview/" });
  assert.equal(classify("/prompts/old-pack/preview/", GATE), null);

  assert.equal(classify("/downloads/recipe-vault/x.pdf", GATE).type, "download");
  assert.equal(classify("/Downloads/templates/a.zip", GATE).type, "download");
  assert.equal(classify("//downloads/templates/a.zip", GATE).type, "download");
  for (const p of ["/", "/join/", "/recipe-vault/", "/templates/", "/templates/atelier/", "/login/", "/account/"]) assert.equal(classify(p, GATE), null, p);
  assert.equal(normalize("/a//b/../c/%2e/d"), "/a/c/d");
});

test("middleware: does nothing while membership is not live", async () => {
  CONFIG.live = false;
  const r = await middleware(new Request("https://classaday.test/courses/ai-mastery/day-5/"));
  assert.equal(r.headers.get("x-middleware-next"), "1");
});

test("middleware: previews for visitors, full pages for members", async () => {
  CONFIG.live = true;
  CONFIG.gate = { freeDays: [1], freePrompts: ["newest-pack"] };
  process.env.MEMBER_COOKIE_SECRET = SECRET;
  try {
    const visitor = await middleware(new Request("https://classaday.test/courses/ai-mastery/day-5/"));
    assert.equal(visitor.headers.get("x-middleware-rewrite"), "https://classaday.test/courses/ai-mastery/day-5/preview/");

    const free = await middleware(new Request("https://classaday.test/courses/ai-mastery/day-1/"));
    assert.equal(free.headers.get("x-middleware-next"), "1");

    const tok = await sign({ uid: "u1", plan: "monthly", exp: now() + 600 }, SECRET);
    const member = await middleware(new Request("https://classaday.test/courses/ai-mastery/day-5/", { headers: { cookie: `sa_m=${tok}` } }));
    assert.equal(member.headers.get("x-middleware-next"), "1");

    const bad = await middleware(new Request("https://classaday.test/courses/ai-mastery/day-5/", { headers: { cookie: `sa_m=${tok}x` } }));
    assert.ok(bad.headers.get("x-middleware-rewrite"));

    const dl = await middleware(new Request("https://classaday.test/downloads/templates/ember.zip"));
    assert.equal(dl.status, 302);
    assert.equal(dl.headers.get("location"), "https://classaday.test/join/?locked=download");

    const hub = await middleware(new Request("https://classaday.test/prompts/"));
    assert.equal(hub.headers.get("x-middleware-rewrite"), "https://classaday.test/prompts/preview/");
    const hubMember = await middleware(new Request("https://classaday.test/prompts/", { headers: { cookie: `sa_m=${tok}` } }));
    assert.equal(hubMember.headers.get("x-middleware-next"), "1");

    assert.ok(await memberFromRequest(new Request("https://x.test/", { headers: { cookie: `sa_m=${tok}` } })));
  } finally {
    CONFIG.live = false;
  }
});
