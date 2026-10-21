/* POST /api/portal/  (Authorization: Bearer <token>)  ->  { url }
   Opens Stripe's customer portal so members can update their card, see invoices or cancel. */
import { json, fail, bearer, getUser, getMemberRow, siteUrl, stripe, stripeReady } from "../lib/server.js";

export async function POST(request) {
  const token = bearer(request);
  let user;
  try { user = await getUser(token); } catch (e) { return fail(502, "auth_unavailable"); }
  if (!user) return fail(401, "login_required");
  if (!stripeReady()) return fail(503, "payments_not_ready");

  let row;
  try { row = await getMemberRow(token, user.id); } catch (e) { return fail(502, "db_unavailable"); }
  if (!row || !row.stripe_customer_id) return fail(404, "no_billing");

  try {
    const s = await stripe("POST", "/billing_portal/sessions", {
      customer: row.stripe_customer_id,
      return_url: `${siteUrl(request)}/account/`,
    });
    return json({ url: s.url });
  } catch (e) {
    console.error("portal: stripe error", e.status, e.message);
    return fail(502, "stripe_error");
  }
}
