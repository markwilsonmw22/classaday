/* POST /api/checkout/  { plan: "monthly" | "lifetime" }  (Authorization: Bearer <token>)  ->  { url }
   Starts a Stripe Checkout session for the signed-in user at the price for their region.
   Prices are found by lookup key and created on first use, so nothing needs setting up in Stripe by hand. */
import CONFIG from "../lib/site-config.js";
import {
  json, fail, bearer, readJson, getUser, getMemberRow, isActive, siteUrl, stripe, stripeReady, currency, taxEnabled,
} from "../lib/server.js";
import { countryOf, tierFor, lookupKey } from "../lib/pricing.js";

const PRODUCT_ID = "classaday_membership";
// "On demand Online Courses - written material content (viewable or viewable and downloadable)".
const TAX_CODE = process.env.STRIPE_TAX_CODE || "txcd_20060358";
const priceCache = new Map();

async function ensureProduct() {
  try { await stripe("GET", `/products/${PRODUCT_ID}`); return; } catch (e) { if (e.status !== 404) throw e; }
  try {
    await stripe("POST", "/products", {
      id: PRODUCT_ID,
      name: "Class a Day membership",
      description: "Every Class a Day course, the Recipe Vault, website templates and Viral Prompts.",
      tax_code: TAX_CODE,
    });
  } catch (e) { if (e.code !== "resource_already_exists") throw e; }
}

async function findPrice(key) {
  const r = await stripe("GET", "/prices", { lookup_keys: [key], active: "true", limit: 1 });
  return r.data && r.data.length ? r.data[0].id : null;
}

async function priceId(plan, tier) {
  const override = process.env[`STRIPE_PRICE_${plan.toUpperCase()}_${tier.toUpperCase()}`];
  if (override) return override;
  const cur = currency();
  const cents = Math.round(CONFIG.prices[tier][plan] * 100);
  const key = lookupKey(plan, tier, cur, cents);
  if (priceCache.has(key)) return priceCache.get(key);
  let id = await findPrice(key);
  if (!id) {
    await ensureProduct();
    try {
      const p = await stripe("POST", "/prices", {
        product: PRODUCT_ID, currency: cur, unit_amount: cents, lookup_key: key, tax_behavior: "exclusive",
        nickname: `${plan === "monthly" ? "Monthly" : "Lifetime"} (${tier})`,
        recurring: plan === "monthly" ? { interval: "month" } : undefined,
        metadata: { plan, tier },
      });
      id = p.id;
    } catch (e) {
      id = await findPrice(key); // another request created it first
      if (!id) throw e;
    }
  }
  priceCache.set(key, id);
  return id;
}

export async function POST(request) {
  const token = bearer(request);
  let user;
  try { user = await getUser(token); } catch (e) { return fail(502, "auth_unavailable"); }
  if (!user) return fail(401, "login_required");
  if (!stripeReady()) return fail(503, "payments_not_ready");

  const body = await readJson(request);
  const plan = body.plan === "lifetime" || body.plan === "monthly" ? body.plan : null;
  if (!plan) return fail(400, "bad_plan");

  let row;
  try { row = await getMemberRow(token, user.id); } catch (e) { return fail(502, "db_unavailable"); }
  // Already a member: lifetime members never pay again; monthly members can only upgrade to lifetime.
  if (isActive(row) && (row.plan === "lifetime" || plan === "monthly")) return json({ already: true, url: "/account/" });

  const country = countryOf(request);
  const tier = tierFor(country);
  const site = siteUrl(request);
  const meta = { user_id: user.id, plan, tier, country };
  try {
    const params = {
      mode: plan === "monthly" ? "subscription" : "payment",
      line_items: [{ price: await priceId(plan, tier), quantity: 1 }],
      success_url: `${site}/account/?checkout=success`,
      cancel_url: `${site}/join/?checkout=cancel`,
      client_reference_id: user.id,
      metadata: meta,
      allow_promotion_codes: "true",
      locale: "auto",
    };
    if (plan === "monthly") params.subscription_data = { metadata: meta };
    else params.payment_intent_data = { metadata: meta };
    if (taxEnabled()) params.automatic_tax = { enabled: "true" };
    if (row && row.stripe_customer_id) {
      params.customer = row.stripe_customer_id;
      if (taxEnabled()) params.customer_update = { address: "auto", name: "auto" };
    } else {
      params.customer_email = user.email;
      if (plan === "lifetime") params.customer_creation = "always";
    }
    const s = await stripe("POST", "/checkout/sessions", params);
    return json({ url: s.url });
  } catch (e) {
    console.error("checkout: stripe error", e.status, e.code, e.message);
    return fail(502, "stripe_error");
  }
}
