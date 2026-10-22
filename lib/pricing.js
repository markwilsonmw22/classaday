/* Regional pricing. Visitors from these countries (ISO 3166-1 alpha-2, from Vercel's
   x-vercel-ip-country header) see and pay the "half" prices; everyone else pays "full".
   Amounts live in PRICING in build/build.py and reach the server through lib/site-config.js. */
import CONFIG from "./site-config.js";

export const HALF_TIER = new Set([
  // South and Central Asia
  "IN", "PK", "BD", "LK", "NP", "BT", "AF", "UZ", "KG", "TJ",
  // South-East Asia and the Pacific
  "PH", "ID", "VN", "KH", "LA", "MM", "TL", "MN", "PG", "SB", "VU", "KI", "TO", "WS", "FM", "MH", "TV", "FJ",
  // Middle East and North Africa
  "EG", "MA", "TN", "DZ", "LY", "YE", "LB", "JO", "IQ", "PS",
  // Sub-Saharan Africa
  "NG", "GH", "KE", "UG", "TZ", "RW", "BI", "ET", "ER", "DJ", "SO", "SD", "SS", "CD", "CG", "CM", "CF", "TD",
  "GA", "GQ", "ST", "AO", "ZM", "ZW", "MW", "MZ", "MG", "KM", "NA", "BW", "ZA", "LS", "SZ",
  "SN", "GM", "GN", "GW", "SL", "LR", "CI", "BF", "ML", "NE", "MR", "TG", "BJ", "CV",
  // Latin America and the Caribbean
  "MX", "GT", "HN", "SV", "NI", "BZ", "HT", "DO", "JM", "CO", "VE", "EC", "PE", "BO", "PY", "AR", "BR", "GY", "SR",
  // Eastern Europe and the Caucasus
  "UA", "MD", "AM", "GE", "AZ",
]);

export function tierFor(country) {
  return HALF_TIER.has(String(country || "").toUpperCase()) ? "half" : "full";
}

export function countryOf(request) {
  const c = (request.headers.get("x-vercel-ip-country") || "").toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : "";
}

/** { currency, tier, monthly, lifetime } in whole currency units, for display. */
export function priceFor(tier) {
  const t = CONFIG.prices[tier] || CONFIG.prices.full;
  return { currency: CONFIG.currency, tier: CONFIG.prices[tier] ? tier : "full", monthly: t.monthly, lifetime: t.lifetime };
}

/** Stripe price lookup key. Currency and amount are part of it, so changing a price in build.py
    makes a new Stripe price on the next checkout instead of reusing the old one. */
export function lookupKey(plan, tier, currency, cents) {
  return `classaday_${plan}_${tier}_${String(currency).toLowerCase()}_${cents}`;
}
