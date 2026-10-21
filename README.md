# SchoolAura

The website for **schoolaura.com**: self-paced courses with day-by-day plans and a progress calendar, a downloadable Recipe Vault, and a website template pack.

## What's on the site

| Page | Path | What it is |
|---|---|---|
| Home | `/` | Discovery page: search, category chips, course cards, how it works, FAQ |
| Classroom | `/courses/` | All courses with progress bars, continue banner, streak, level, badges and a question of the day |
| Dropshipping (COM 130) | `/courses/dropshipping/` | 30 daily lessons, ≈103 h, 9 diagrams |
| AI Mastery (AI 210) | `/courses/ai-mastery/` | 24 daily lessons, ≈82 h, 7 diagrams (includes Runway, HeyGen and Cursor) |
| Digital Marketing Agency (MKT 220) | `/courses/digital-marketing/` | 30 daily lessons, ≈108 h, 8 diagrams |
| Website Builders (WEB 120) | `/courses/website-builders/` | 7-day guide to the template pack |
| Template library | `/templates/` | 6 templates, live previews, single and bulk ZIP downloads |
| Membership | `/join/` | Sales page: $9 a month or $19 once for life (CAD), 30-day money-back guarantee, FAQ, sticky button |
| Viral Prompts | `/prompts/` | Trending AI photo and video prompt packs, one page per pack, subscribe for New badges |
| Recipe Vault (FOD 110) | `/recipe-vault/` | 4 PDF books + a complete edition, pick and download, kitchen quiz, cake pan converter |

Every lesson has its own page at `/courses/<slug>/day-N/` (so Google can index it), and every course page has four tabs: **Classroom** (lesson list with progress on the left, lesson on the right: lesson, worked example, quick check, timed task checklist, check-in and notes, mark as done), **Calendar** (start date, study days, pace, month calendar, what's coming up), **Quizzes** (a quiz per module, a final exam and a certificate) and **About** (outcomes, curriculum, who it's for). Progress is saved in the visitor's browser (`localStorage`) and, for logged-in members, synced to their account.

### Membership: accounts, payments and locked content

Two switches in `MEMBERSHIP` at the top of `build/build.py` control it. Both are off until the outside services are set up (see "Before switching on" below).

- **`accounts`**: shows "Log in" / "Account" in the header and builds `/login/` and `/account/`. Login is by email link or 6-digit code (Supabase Auth), plus Google if it's enabled in Supabase. Logged-in visitors' progress (`sa.course.*`, `sa.engage`, `sa.prompts`, `sa.name`) syncs to the `progress` table with a three-way merge, so two devices combine instead of overwriting.
- **`live`**: locks members-only content and sells the membership through Stripe Checkout. Free for everyone: Day 1 of every course (`free_days`) and the 3 newest Viral Prompts packs (`free_prompts`). Everything else, plus quizzes and the downloads, needs a membership. While `live` is off the site is in early access: everything is free and the buttons say "Start free now".

Prices are in `PRICING` (CAD, before tax): full price $9/month or $19 once; visitors from the countries listed in `lib/pricing.js` see and pay `half` ($5 / $10). The Stripe product and prices are created automatically on the first checkout (lookup keys like `schoolaura_monthly_full_cad_900`), so changing a price here makes a new Stripe price; existing subscribers stay on theirs.

How it fits together:

```
middleware.js           Runs before pages on Vercel. No valid member cookie -> locked lessons and prompt packs are
                        answered with their preview page (same URL), downloads redirect to /join/?locked=download.
lib/gate.js             Which paths are members-only. lib/site-config.js is written by the build (free lists, prices).
lib/token.js            The signed member cookie (sa_m, HMAC, 24 hours, HttpOnly).
api/session.js          POST with the Supabase access token: checks the login, reads the members row, sets/clears sa_m.
api/checkout.js         Starts Stripe Checkout (monthly = subscription, lifetime = one payment) at the visitor's regional price.
api/portal.js           Opens the Stripe customer portal (card, invoices, cancel).
api/geo.js              The visitor's country and prices, for the join page.
api/stripe-webhook.js   Stripe -> members table: checkout completed, subscription changes, full refunds.
public/assets/js/auth.js     Header login state, member cookie refresh, regional prices, progress sync (all pages).
public/assets/js/account.js  /login/ and /account/.   public/assets/js/join.js  Checkout buttons on /join/.
```

Supabase tables (project `mxezkygvkvekhirheblb`, Canada): `members` (one row per paying user, written only by the webhook with the secret key), `progress` (one JSON blob per user, each user can read and write only their own) and `stripe_events` (so each webhook is handled once). Row-level security is on for all three.

Lesson text is never in the public `course-data.js`: each lesson page carries its own (`window.SA_DAY_DATA`), and the middleware decides who gets that page. Locked lessons have a preview at `/courses/<slug>/day-N/preview/` and locked packs at `/prompts/<slug>/preview/`; these are only built when `live` is on.

Environment variables (Vercel → Project → Settings → Environment Variables):

| Name | What it is |
| --- | --- |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_live_...`, or `sk_test_...` on Preview) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint `https://schoolaura.com/api/stripe-webhook/` (keep the trailing slash) |
| `SUPABASE_SECRET_KEY` | Supabase secret key (`sb_secret_...`), used only by the webhook. The member cookie is signed with a key derived from it unless `MEMBER_COOKIE_SECRET` is set |
| `STRIPE_AUTOMATIC_TAX` | `true` once Stripe Tax is set up (origin address and registrations), so tax is added at checkout |
| optional | `MEMBER_COOKIE_SECRET` (32+ characters), `SITE_URL`, `PRICE_CURRENCY`, `STRIPE_TAX_CODE` (default `txcd_20060358`, online courses with written material), `STRIPE_PRICE_<MONTHLY/LIFETIME>_<FULL/HALF>` to use your own price IDs |

Testing: `npm test` runs the server, middleware and merge tests. `SA_LIVE=1 python3 build/build.py` builds a copy with everything switched on, and `FAKE_BACKEND=1 node tests/e2e/server.mjs 8790` serves it locally the way Vercel does (middleware, functions, clean URLs) with an in-memory Supabase and Stripe. Rebuild without `SA_LIVE` before committing, and restart the server after each build.

### Viral Prompts

Each pack is one JSON file in `content/prompts/` (format and rules in `content/prompts/README.md`). The build makes the feed at `/prompts/` and a page per pack. Subscribing is saved on the visitor's device for now (`sa.prompts`): subscribers get a **New** badge on packs posted since their last visit, a count on the Classroom card and a dot on **Prompts** in the menu. A scheduled task checks for new trends and adds packs automatically.

### SEO and search

- One static, crawlable page per lesson and per prompt pack, with its own title, description and canonical URL.
- Structured data (JSON-LD): Organization and WebSite on the home page, Course on course pages, LearningResource on lessons, Article on prompt packs, and breadcrumbs.
- `sitemap.xml` lists every page with a last-modified date (from git). Template demos and downloads send `X-Robots-Tag: noindex` (see `vercel.json`).
- Social images: `public/assets/img/og/*.jpg`, made from the card covers.
- Site search: the search button in the header (or press `/`) searches courses, lessons, prompts, books and templates. The index is `public/assets/js/search-index.js`. The home page search also lists matching lessons and prompts, and `/?q=word` pre-fills it.

### Quizzes, tools and engagement

- **Quizzes:** questions live in `content/quizzes/<slug>.json` (`modules` → list of `{q, o, a, why, day}`, plus `final: {count, pass}`). `a` is the index of the right option; `day` must be a lesson in that module (the build checks both). Options are shuffled every attempt. Module quizzes and the final pass at 80%. The final draws `count` random questions from all modules. The questions tagged with a lesson's `day` also appear in that lesson as a "Quick check". The Recipe Vault has its own kitchen quiz in `content/quizzes/recipe-vault.json`.
- **Certificate:** unlocks when every lesson is marked done and the final is passed. It's drawn in the browser (PNG download, LinkedIn "add to profile" and X share links). It's an honour-system certificate: progress is checked in the browser, not on the server.
- **Interactive tools:** write `{{tool:name}}` on its own line in a lesson. Tools are in `public/assets/js/tools.js`: `profit`, `adtest`, `prompt`, `imgprompt`, `metrics`, `pricing`, `serp`, `engagement`, `adsbudget`, `utm`, `contrast`, `pan` (Recipe Vault).
- **Engagement** (`public/assets/js/engage.js`): daily streak, XP and 8 levels, 12 badges, "continue where you left off" (home and classroom), and a question of the day on the classroom page. It's all worked out from saved progress plus `sa.engage` in `localStorage`.

## How it's built

A static site, no framework. Everything the browser loads is in `public/`, which Vercel serves as-is (`vercel.json` sets `outputDirectory: public`). The membership adds `middleware.js`, a few functions in `api/` and shared code in `lib/` (see above); they need no build step, just `npm install` for `@vercel/functions`, which Vercel does automatically.

```
content/            Course sources (Markdown with JSON front matter), page fragments, diagrams
  dropshipping.md   One file per course (also ai-mastery.md, digital-marketing.md, website-builders.md): "# M1 | Module | summary", "## D1 | Title | hours | short title"
  ai-mastery.md     Sections per day: @goal @lesson @demo @tasks @deliverable @tip
  website-builders.md
  pages/            Home, join, login, account, legal, Recipe Vault, Templates and 404 page bodies
  quizzes/          Quiz questions per course (JSON)
  figures/          Generated SVG diagrams (from build/figures.py)
vault-src/          Recipe Vault book sources (Markdown + recipe blocks) and print illustrations
templates-src/      The six website templates (each a folder with index.html, fonts, images)
build/              Build scripts
public/             The generated website (commit it; Vercel deploys this folder)
api/ lib/ middleware.js   Membership server code (see "Membership" above)
tests/              npm test, plus tests/e2e/server.mjs for running the site locally
```

### Rebuilding after an edit

Requires Python 3 with `markdown`, `pypdf`, `Pillow` and `playwright` (Chromium).

```bash
python3 build/figures.py        # diagrams (only if you change figures.py)
python3 build/vault.py          # Recipe Vault PDFs (only if vault-src changes)
python3 -m http.server 8765 --directory public &   # needed for template screenshots
python3 build/templates.py      # template previews, screenshots and ZIPs (only if templates-src changes)
python3 build/covers.py         # card cover images (only if covers, figures or templates change)
python3 build/build.py          # all HTML pages: run after any content change
```

Task times in lessons are written as `(45 min)` at the end of each task line. The build splits each day's hours into lesson, worked example and task time, and warns if the tasks leave less than 25 minutes for the lesson.

## Before switching on

1. **Domain:** add `schoolaura.com` in Vercel → Project → Domains and set the DNS records Vercel shows. Set up the `support@schoolaura.com` mailbox (or forwarding) used on the legal pages.
2. **Supabase:** Auth → URL Configuration: Site URL `https://schoolaura.com`, redirect URLs `https://schoolaura.com/**` and `https://*-markwilsonmw22s-projects.vercel.app/**`. Auth → SMTP: connect an email sender (the built-in one only sends to your own team). Auth → Email Templates → Magic Link: include both `{{ .ConfirmationURL }}` and `{{ .Token }}` so people can click or type the code. Optional: Auth → Providers → Google. Then set `accounts` to True and rebuild.
3. **Stripe:** add the environment variables above, create the webhook endpoint for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created/updated/deleted/paused/resumed` and `charge.refunded`, turn on the customer portal, and set up Stripe Tax. Then set `live` to True and rebuild.
