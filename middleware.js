/* Members-only content (Vercel Routing Middleware).
   When membership is live (MEMBERSHIP in build/build.py), visitors without a valid member cookie get:
     /courses/<slug>/day-N/   -> the lesson preview (Day 1 of every course stays free)
     /prompts/  and  /prompts/<slug>/  -> previews with the prompt text locked (the newest packs stay free)
     /downloads/...           -> sent to /join/?locked=download
   Previews are served at the same URL (a rewrite), so links, canonical URLs and search results don't change.
   The free lists come from lib/site-config.js, which build/build.py writes. */
import { next, rewrite } from "@vercel/functions/middleware";
import CONFIG from "./lib/site-config.js";
import { memberFromRequest } from "./lib/token.js";
import { classify } from "./lib/gate.js";

export const config = {
  matcher: ["/((?!assets/|api/|_vercel/|favicon|robots\\.txt|sitemap\\.xml).*)"],
};

export default async function middleware(request) {
  if (!CONFIG.live) return next();
  const url = new URL(request.url);
  const kind = classify(url.pathname);
  if (!kind) return next();
  if (await memberFromRequest(request)) return next();
  if (kind.type === "download") return Response.redirect(new URL(kind.target, url), 302);
  return rewrite(new URL(kind.target, url));
}
