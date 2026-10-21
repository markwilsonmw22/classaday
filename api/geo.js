/* GET /api/geo/  ->  { country, currency, tier, monthly, lifetime }
   The prices this visitor will pay, based on the country Vercel detects from their IP. */
import { json } from "../lib/server.js";
import { countryOf, tierFor, priceFor } from "../lib/pricing.js";

export async function GET(request) {
  const country = countryOf(request);
  return json({ country, ...priceFor(tierFor(country)) });
}
