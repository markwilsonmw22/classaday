/* POST /api/stripe-webhook/  (called by Stripe; the URL needs the trailing slash)
   Keeps the members table in step with Stripe. Events handled:
     checkout.session.completed / async_payment_succeeded  -> monthly or lifetime membership starts
     customer.subscription.created / updated / deleted / paused / resumed -> monthly status and renewal date
     charge.refunded (full refund of a lifetime payment) -> lifetime access ends
   Subscription state is always re-read from Stripe, so events arriving out of order are harmless. */
import {
  json, fail, verifyStripeSignature, stripe, adminRest, adminMemberBy, upsertMember, isActive, idOf,
} from "../lib/server.js";

const LIVE_SUB = ["active", "trialing", "past_due"];

function iso(sec) {
  return sec ? new Date(sec * 1000).toISOString() : null;
}

async function applySubscription(sub, uidHint) {
  const customer = idOf(sub.customer);
  let uid = (sub.metadata && sub.metadata.user_id) || uidHint;
  if (!uid) {
    const byCustomer = await adminMemberBy("stripe_customer_id", customer);
    uid = byCustomer && byCustomer.user_id;
  }
  if (!uid) { console.warn("webhook: subscription with no Class a Day user", sub.id); return; }

  const existing = await adminMemberBy("user_id", uid);
  // Lifetime access always wins over subscription changes (for example the old monthly plan being cancelled).
  if (existing && existing.plan === "lifetime" && existing.status === "active") return;
  // An older subscription ending must not overwrite a newer one that is still running.
  if (existing && existing.stripe_subscription_id && existing.stripe_subscription_id !== sub.id &&
      isActive(existing) && !LIVE_SUB.includes(sub.status)) return;

  const item = sub.items && sub.items.data && sub.items.data[0];
  const end = sub.current_period_end || (item && item.current_period_end);
  await upsertMember({
    user_id: uid,
    plan: "monthly",
    status: sub.status,
    current_period_end: iso(end),
    cancel_at_period_end: !!(sub.cancel_at_period_end || sub.cancel_at),
    stripe_subscription_id: sub.id,
    stripe_customer_id: customer,
    price_tier: (sub.metadata && sub.metadata.tier) || undefined,
    country: (sub.metadata && sub.metadata.country) || undefined,
  });
}

async function freshSubscription(subOrId) {
  const id = idOf(subOrId);
  try { return await stripe("GET", `/subscriptions/${id}`); } catch (e) {
    if (typeof subOrId === "object") return subOrId; // fall back to the copy in the event
    throw e;
  }
}

async function onCheckout(s) {
  const uid = (s.metadata && s.metadata.user_id) || s.client_reference_id;
  if (!uid) return; // not a Class a Day membership checkout
  const base = {
    user_id: uid,
    email: (s.customer_details && s.customer_details.email) || s.customer_email || undefined,
    stripe_customer_id: idOf(s.customer),
    price_tier: (s.metadata && s.metadata.tier) || undefined,
    country: (s.metadata && s.metadata.country) || (s.customer_details && s.customer_details.address && s.customer_details.address.country) || undefined,
  };

  if (s.mode === "payment") {
    if (s.payment_status !== "paid") return; // bank payments finish later with async_payment_succeeded
    const before = await adminMemberBy("user_id", uid);
    await upsertMember({
      ...base, plan: "lifetime", status: "active", current_period_end: null, cancel_at_period_end: false,
      stripe_payment_intent_id: idOf(s.payment_intent),
    });
    // Upgraded from monthly: stop the subscription so they are not charged again.
    if (before && before.plan === "monthly" && before.stripe_subscription_id && LIVE_SUB.includes(before.status)) {
      try { await stripe("DELETE", `/subscriptions/${before.stripe_subscription_id}`); } catch (e) {
        console.error("webhook: could not cancel old monthly plan", before.stripe_subscription_id, e.message);
      }
    }
    return;
  }

  if (s.mode === "subscription" && s.subscription) {
    const sub = await freshSubscription(s.subscription);
    const before = await adminMemberBy("user_id", uid);
    if (before && before.plan === "lifetime" && before.status === "active") return;
    await upsertMember(base);
    await applySubscription(sub, uid);
  }
}

async function onRefund(charge) {
  if (!charge.refunded) return; // partial refunds keep access
  const pi = idOf(charge.payment_intent);
  const row = await adminMemberBy("stripe_payment_intent_id", pi);
  if (row && row.plan === "lifetime") await upsertMember({ user_id: row.user_id, status: "refunded" });
}

async function handle(event) {
  const obj = event.data && event.data.object;
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      return onCheckout(obj);
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
    case "customer.subscription.paused":
    case "customer.subscription.resumed":
      return applySubscription(await freshSubscription(obj));
    case "charge.refunded":
      return onRefund(obj);
    default:
      return null;
  }
}

export async function POST(request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) { console.error("webhook: STRIPE_WEBHOOK_SECRET is not set"); return fail(500, "not_configured"); }
  const payload = await request.text();
  if (!(await verifyStripeSignature(payload, request.headers.get("stripe-signature"), secret))) return fail(400, "bad_signature");

  let event;
  try { event = JSON.parse(payload); } catch (e) { return fail(400, "bad_json"); }
  try {
    const seen = await adminRest("GET", `stripe_events?id=eq.${encodeURIComponent(event.id)}&select=id`);
    if (seen && seen.length) return json({ received: true, duplicate: true });
    await handle(event);
    await adminRest("POST", "stripe_events", { id: event.id, type: event.type }, "resolution=ignore-duplicates,return=minimal");
  } catch (e) {
    console.error("webhook: failed", event.type, event.id, e.message);
    return fail(500, "handler_failed"); // Stripe retries for up to three days
  }
  return json({ received: true });
}
