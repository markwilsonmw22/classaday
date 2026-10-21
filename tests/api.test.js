import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { makeBackend, setEnv, req, ENV } from "./fake.js";
import { signStripePayload, verifyStripeSignature, formEncode, isActive } from "../lib/server.js";
import { verify } from "../lib/token.js";
import * as session from "../api/session.js";
import * as checkout from "../api/checkout.js";
import * as portal from "../api/portal.js";
import * as geo from "../api/geo.js";
import * as webhook from "../api/stripe-webhook.js";

let B;
beforeEach(() => { setEnv(); B = makeBackend(); B.install(); });

const SITE = "https://schoolaura.test";
const cookieOf = (r) => (r.headers.get("set-cookie") || "").split(";")[0].replace(/^sa_m=/, "");

async function sendEvent(event, secret = ENV.STRIPE_WEBHOOK_SECRET) {
  const payload = JSON.stringify(event);
  const sig = await signStripePayload(payload, secret);
  return webhook.POST(new Request(`${SITE}/api/stripe-webhook/`, { method: "POST", headers: { "stripe-signature": sig }, body: payload }));
}
let evn = 0;
const ev = (type, object) => ({ id: `evt_${++evn}`, type, data: { object } });

/* ---------------------------------------------------------------- helpers */

test("form encoding matches Stripe's format", () => {
  const pairs = formEncode({ a: 1, line_items: [{ price: "p", quantity: 1 }], meta: { x: "y" }, skip: undefined, lk: ["k1"] });
  assert.deepEqual(pairs, [["a", "1"], ["line_items[0][price]", "p"], ["line_items[0][quantity]", "1"], ["meta[x]", "y"], ["lk[0]", "k1"]]);
});

test("Stripe signature: good, wrong secret, stale, malformed", async () => {
  const body = '{"id":"evt_1"}';
  assert.ok(await verifyStripeSignature(body, await signStripePayload(body, "whsec_a"), "whsec_a"));
  assert.ok(!(await verifyStripeSignature(body, await signStripePayload(body, "whsec_b"), "whsec_a")));
  assert.ok(!(await verifyStripeSignature(body + " ", await signStripePayload(body, "whsec_a"), "whsec_a")));
  const old = Math.floor(Date.now() / 1000) - 3600;
  assert.ok(!(await verifyStripeSignature(body, await signStripePayload(body, "whsec_a", old), "whsec_a")));
  assert.ok(!(await verifyStripeSignature(body, "t=abc,v1=zz", "whsec_a")));
  assert.ok(!(await verifyStripeSignature(body, "", "whsec_a")));
  // Stripe sends several v1 signatures while a secret is being rolled
  const good = await signStripePayload(body, "whsec_a");
  const t = good.split(",")[0];
  assert.ok(await verifyStripeSignature(body, `${t},v1=deadbeef,${good.split(",")[1]}`, "whsec_a"));
});

test("who counts as a member", () => {
  assert.ok(isActive({ plan: "lifetime", status: "active" }));
  assert.ok(!isActive({ plan: "lifetime", status: "refunded" }));
  for (const s of ["active", "trialing", "past_due"]) assert.ok(isActive({ plan: "monthly", status: s }), s);
  for (const s of ["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", "none"]) assert.ok(!isActive({ plan: "monthly", status: s }), s);
  assert.ok(!isActive(null));
  assert.ok(!isActive({ plan: null, status: "none" }));
});

/* ---------------------------------------------------------------- /api/session/ and /api/geo/ */

test("session: logged-out token gets 401 and the cookie cleared", async () => {
  const r = await session.POST(req(`${SITE}/api/session/`, { method: "POST", token: "nope" }));
  assert.equal(r.status, 401);
  assert.match(r.headers.get("set-cookie"), /^sa_m=; .*Max-Age=0/);
  assert.equal((await session.POST(req(`${SITE}/api/session/`, { method: "POST" }))).status, 401);
});

test("session: non-member gets no cookie, member gets a signed 24h cookie", async () => {
  B.addUser("tok1", "u1", "a@test.com");
  let r = await session.POST(req(`${SITE}/api/session/`, { method: "POST", token: "tok1" }));
  let j = await r.json();
  assert.equal(r.status, 200);
  assert.equal(j.member, false);
  assert.equal(j.user.email, "a@test.com");
  assert.match(r.headers.get("set-cookie"), /Max-Age=0/);
  assert.equal(r.headers.get("cache-control"), "private, no-store");

  B.db.members.push({ user_id: "u1", plan: "monthly", status: "active", current_period_end: "2026-12-01T00:00:00Z", stripe_customer_id: "cus_1" });
  r = await session.POST(req(`${SITE}/api/session/`, { method: "POST", token: "tok1" }));
  j = await r.json();
  assert.equal(j.member, true);
  assert.equal(j.plan, "monthly");
  assert.equal(j.billing, true);
  const sc = r.headers.get("set-cookie");
  assert.match(sc, /HttpOnly/);
  assert.match(sc, /Secure/);
  assert.match(sc, /SameSite=Lax/);
  assert.match(sc, /Max-Age=86400/);
  const payload = await verify(cookieOf(r), ENV.MEMBER_COOKIE_SECRET);
  assert.equal(payload.uid, "u1");
});

test("session: a user can't read someone else's membership", async () => {
  B.addUser("tok1", "u1", "a@test.com");
  B.db.members.push({ user_id: "u2", plan: "lifetime", status: "active" });
  const j = await (await session.POST(req(`${SITE}/api/session/`, { method: "POST", token: "tok1" }))).json();
  assert.equal(j.member, false);
});

test("session: DELETE clears the cookie", async () => {
  const r = await session.DELETE(req(`${SITE}/api/session/`, { method: "DELETE" }));
  assert.match(r.headers.get("set-cookie"), /Max-Age=0/);
});

test("geo: half price for listed countries, full otherwise", async () => {
  let j = await (await geo.GET(req(`${SITE}/api/geo/`, { headers: { "x-vercel-ip-country": "IN" } }))).json();
  assert.deepEqual(j, { country: "IN", currency: "cad", tier: "half", monthly: 5, lifetime: 10 });
  j = await (await geo.GET(req(`${SITE}/api/geo/`, { headers: { "x-vercel-ip-country": "CA" } }))).json();
  assert.equal(j.tier, "full");
  assert.equal(j.monthly, 9);
  j = await (await geo.GET(req(`${SITE}/api/geo/`))).json();
  assert.equal(j.tier, "full");
  assert.equal(j.country, "");
});

/* ---------------------------------------------------------------- /api/checkout/ */

test("checkout: needs a login and a known plan", async () => {
  assert.equal((await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", body: { plan: "monthly" } }))).status, 401);
  B.addUser("tok1", "u1", "a@test.com");
  assert.equal((await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "tok1", body: { plan: "weekly" } }))).status, 400);
  delete process.env.STRIPE_SECRET_KEY;
  assert.equal((await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "tok1", body: { plan: "monthly" } }))).status, 503);
});

test("checkout: monthly, Canada: creates product and price once, then a subscription session", async () => {
  B.addUser("tok1", "u1", "a@test.com");
  const r = await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "tok1", body: { plan: "monthly" }, headers: { "x-vercel-ip-country": "CA" } }));
  const j = await r.json();
  assert.equal(r.status, 200, JSON.stringify(j));
  assert.match(j.url, /^https:\/\/checkout\.stripe\.test\//);
  const prod = B.stripe.products.get("schoolaura_membership");
  assert.equal(prod.tax_code, "txcd_20060358");
  const price = B.stripe.prices[0];
  assert.equal(price.lookup_key, "schoolaura_monthly_full_cad_900");
  assert.equal(price.unit_amount, 900);
  assert.equal(price["recurring[interval]"], "month");
  assert.equal(price.tax_behavior, "exclusive");
  const p = B.stripe.sessions[0].params;
  assert.equal(p.mode, "subscription");
  assert.equal(p["line_items[0][price]"], price.id);
  assert.equal(p.customer_email, "a@test.com");
  assert.equal(p.client_reference_id, "u1");
  assert.equal(p["subscription_data[metadata][user_id]"], "u1");
  assert.equal(p["metadata[tier]"], "full");
  assert.equal(p["metadata[country]"], "CA");
  assert.equal(p.success_url, `${SITE}/account/?checkout=success`);
  assert.equal(p.cancel_url, `${SITE}/join/?checkout=cancel`);
  assert.equal(p["automatic_tax[enabled]"], undefined, "tax stays off until STRIPE_AUTOMATIC_TAX=true");

  // A second checkout reuses the price.
  await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "tok1", body: { plan: "monthly" }, headers: { "x-vercel-ip-country": "CA" } }));
  assert.equal(B.stripe.prices.length, 1);
});

test("checkout: lifetime from India uses the half price, tax on, existing customer reused", async () => {
  process.env.STRIPE_AUTOMATIC_TAX = "true";
  B.addUser("tok2", "u2", "b@test.com");
  B.db.members.push({ user_id: "u2", plan: "monthly", status: "canceled", stripe_customer_id: "cus_9" });
  const r = await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "tok2", body: { plan: "lifetime" }, headers: { "x-vercel-ip-country": "IN" } }));
  assert.equal(r.status, 200);
  const price = B.stripe.prices.find((x) => x.lookup_key === "schoolaura_lifetime_half_cad_1000");
  assert.ok(price && !price["recurring[interval]"]);
  const p = B.stripe.sessions.at(-1).params;
  assert.equal(p.mode, "payment");
  assert.equal(p.customer, "cus_9");
  assert.equal(p.customer_email, undefined);
  assert.equal(p["automatic_tax[enabled]"], "true");
  assert.equal(p["customer_update[address]"], "auto");
  assert.equal(p["payment_intent_data[metadata][user_id]"], "u2");
  assert.equal(p["metadata[tier]"], "half");
});

test("checkout: lifetime without a customer asks Stripe to create one", async () => {
  B.addUser("tok3", "u3", "c@test.com");
  await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "tok3", body: { plan: "lifetime" } }));
  assert.equal(B.stripe.sessions.at(-1).params.customer_creation, "always");
});

test("checkout: members aren't charged twice; monthly members may switch to lifetime", async () => {
  B.addUser("t", "u1", "a@test.com");
  B.db.members.push({ user_id: "u1", plan: "lifetime", status: "active" });
  for (const plan of ["monthly", "lifetime"]) {
    const j = await (await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "t", body: { plan } }))).json();
    assert.deepEqual(j, { already: true, url: "/account/" });
  }
  B.db.members[0] = { user_id: "u1", plan: "monthly", status: "active", stripe_customer_id: "cus_1" };
  assert.equal((await (await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "t", body: { plan: "monthly" } }))).json()).already, true);
  const j = await (await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "t", body: { plan: "lifetime" } }))).json();
  assert.match(j.url, /checkout\.stripe\.test/);
});

test("checkout: a price id in the environment overrides the lookup", async () => {
  process.env.STRIPE_PRICE_MONTHLY_FULL = "price_from_env";
  B.addUser("t", "u1", "a@test.com");
  await checkout.POST(req(`${SITE}/api/checkout/`, { method: "POST", token: "t", body: { plan: "monthly" }, headers: { "x-vercel-ip-country": "US" } }));
  assert.equal(B.stripe.sessions.at(-1).params["line_items[0][price]"], "price_from_env");
  assert.equal(B.stripe.prices.length, 0);
});

/* ---------------------------------------------------------------- /api/portal/ */

test("portal: only for logged-in users with billing", async () => {
  assert.equal((await portal.POST(req(`${SITE}/api/portal/`, { method: "POST" }))).status, 401);
  B.addUser("t", "u1", "a@test.com");
  assert.equal((await portal.POST(req(`${SITE}/api/portal/`, { method: "POST", token: "t" }))).status, 404);
  B.db.members.push({ user_id: "u1", plan: "monthly", status: "active", stripe_customer_id: "cus_1" });
  const r = await portal.POST(req(`${SITE}/api/portal/`, { method: "POST", token: "t" }));
  assert.equal((await r.json()).url, "https://billing.stripe.test/p_1");
  assert.deepEqual(B.stripe.portal[0], { customer: "cus_1", return_url: `${SITE}/account/` });
});

/* ---------------------------------------------------------------- /api/stripe-webhook/ */

test("webhook: rejects bad signatures and needs its secret", async () => {
  const r = await sendEvent(ev("checkout.session.completed", {}), "whsec_wrong");
  assert.equal(r.status, 400);
  delete process.env.STRIPE_WEBHOOK_SECRET;
  assert.equal((await sendEvent(ev("x", {}))).status, 500);
});

function subObj(id, status, extra = {}) {
  return { id, object: "subscription", status, customer: "cus_1", cancel_at_period_end: false,
           metadata: { user_id: "u1", tier: "full", country: "CA" },
           items: { data: [{ current_period_end: 1798761600 }] }, ...extra };
}

test("webhook: monthly checkout -> active member; renewal date from the subscription item", async () => {
  B.stripe.subs.set("sub_1", subObj("sub_1", "active"));
  const r = await sendEvent(ev("checkout.session.completed", {
    id: "cs_1", mode: "subscription", payment_status: "paid", subscription: "sub_1", customer: "cus_1", client_reference_id: "u1",
    metadata: { user_id: "u1", plan: "monthly", tier: "full", country: "CA" }, customer_details: { email: "a@test.com" },
  }));
  assert.equal(r.status, 200);
  const m = B.member("u1");
  assert.equal(m.plan, "monthly");
  assert.equal(m.status, "active");
  assert.equal(m.email, "a@test.com");
  assert.equal(m.stripe_customer_id, "cus_1");
  assert.equal(m.stripe_subscription_id, "sub_1");
  assert.equal(m.current_period_end, new Date(1798761600 * 1000).toISOString());
  assert.ok(isActive(m));
});

test("webhook: events out of order, duplicates, cancellation and ending", async () => {
  // subscription.created can arrive before checkout.session.completed
  B.stripe.subs.set("sub_1", subObj("sub_1", "active"));
  await sendEvent(ev("customer.subscription.created", subObj("sub_1", "incomplete")));
  assert.equal(B.member("u1").status, "active", "re-reads the subscription from Stripe instead of trusting the event copy");

  const dup = ev("customer.subscription.updated", subObj("sub_1", "active"));
  await sendEvent(dup);
  const again = await sendEvent(dup);
  assert.equal((await again.json()).duplicate, true);

  B.stripe.subs.get("sub_1").cancel_at_period_end = true;
  await sendEvent(ev("customer.subscription.updated", subObj("sub_1", "active")));
  assert.equal(B.member("u1").cancel_at_period_end, true);
  assert.ok(isActive(B.member("u1")));

  B.stripe.subs.get("sub_1").status = "canceled";
  await sendEvent(ev("customer.subscription.deleted", subObj("sub_1", "canceled")));
  assert.equal(B.member("u1").status, "canceled");
  assert.ok(!isActive(B.member("u1")));
});

test("webhook: past_due keeps access; unpaid ends it", async () => {
  B.stripe.subs.set("sub_1", subObj("sub_1", "past_due"));
  await sendEvent(ev("customer.subscription.updated", subObj("sub_1", "past_due")));
  assert.ok(isActive(B.member("u1")));
  B.stripe.subs.get("sub_1").status = "unpaid";
  await sendEvent(ev("customer.subscription.updated", subObj("sub_1", "unpaid")));
  assert.ok(!isActive(B.member("u1")));
});

test("webhook: upgrading to lifetime cancels the monthly plan and lifetime survives the cancellation event", async () => {
  B.stripe.subs.set("sub_1", subObj("sub_1", "active"));
  await sendEvent(ev("customer.subscription.updated", subObj("sub_1", "active")));
  await sendEvent(ev("checkout.session.completed", {
    id: "cs_2", mode: "payment", payment_status: "paid", payment_intent: "pi_1", customer: "cus_1",
    metadata: { user_id: "u1", plan: "lifetime", tier: "full", country: "CA" }, customer_details: { email: "a@test.com" },
  }));
  let m = B.member("u1");
  assert.equal(m.plan, "lifetime");
  assert.equal(m.status, "active");
  assert.equal(m.stripe_payment_intent_id, "pi_1");
  assert.deepEqual(B.stripe.deleted, ["sub_1"]);
  await sendEvent(ev("customer.subscription.deleted", subObj("sub_1", "canceled")));
  m = B.member("u1");
  assert.equal(m.plan, "lifetime");
  assert.equal(m.status, "active");
});

test("webhook: bank payments wait for async_payment_succeeded", async () => {
  const s = { id: "cs_3", mode: "payment", payment_status: "unpaid", payment_intent: "pi_3", customer: "cus_3", metadata: { user_id: "u3", plan: "lifetime" } };
  await sendEvent(ev("checkout.session.completed", s));
  assert.equal(B.member("u3"), null);
  await sendEvent(ev("checkout.session.async_payment_succeeded", { ...s, payment_status: "paid" }));
  assert.equal(B.member("u3").status, "active");
});

test("webhook: a full refund ends lifetime access; a partial refund doesn't", async () => {
  B.db.members.push({ user_id: "u4", plan: "lifetime", status: "active", stripe_payment_intent_id: "pi_4" });
  await sendEvent(ev("charge.refunded", { id: "ch_1", payment_intent: "pi_4", refunded: false, amount_refunded: 100 }));
  assert.equal(B.member("u4").status, "active");
  await sendEvent(ev("charge.refunded", { id: "ch_1", payment_intent: "pi_4", refunded: true }));
  assert.equal(B.member("u4").status, "refunded");
  assert.ok(!isActive(B.member("u4")));
});

test("webhook: ignores other checkouts and unknown events", async () => {
  assert.equal((await sendEvent(ev("checkout.session.completed", { id: "cs_x", mode: "payment", payment_status: "paid" }))).status, 200);
  assert.equal((await sendEvent(ev("invoice.paid", { id: "in_1" }))).status, 200);
  assert.equal(B.db.members.length, 0);
});

test("webhook: an old subscription ending doesn't cancel a newer one", async () => {
  B.stripe.subs.set("sub_new", subObj("sub_new", "active"));
  await sendEvent(ev("customer.subscription.updated", subObj("sub_new", "active")));
  B.stripe.subs.set("sub_old", subObj("sub_old", "canceled"));
  await sendEvent(ev("customer.subscription.deleted", subObj("sub_old", "canceled")));
  assert.equal(B.member("u1").stripe_subscription_id, "sub_new");
  assert.equal(B.member("u1").status, "active");
});

test("webhook: a database failure returns 500 so Stripe retries, and the event isn't marked done", async () => {
  delete process.env.SUPABASE_SECRET_KEY;
  const e = ev("charge.refunded", { id: "ch_9", payment_intent: "pi_9", refunded: true });
  assert.equal((await sendEvent(e)).status, 500);
  setEnv();
  assert.equal((await sendEvent(e)).status, 200);
  assert.equal(B.db.stripe_events.length, 1);
});
