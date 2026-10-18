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
| Viral Prompts | `/prompts/` | Trending AI photo and video prompt packs, one page per pack, subscribe for New badges |
| Recipe Vault (FOD 110) | `/recipe-vault/` | 4 PDF books + a complete edition, pick and download, kitchen quiz, cake pan converter |

Every lesson has its own page at `/courses/<slug>/day-N/` (so Google can index it), and every course page has four tabs: **Classroom** (lesson list with progress on the left, lesson on the right: lesson, worked example, quick check, timed task checklist, check-in and notes, mark as done), **Calendar** (start date, study days, pace, month calendar, what's coming up), **Quizzes** (a quiz per module, a final exam and a certificate) and **About** (outcomes, curriculum, who it's for). Progress is saved in the visitor's browser (`localStorage`) until accounts arrive with the subscription.

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
- **Certificate:** unlocks when every lesson is marked done and the final is passed. It's drawn in the browser (PNG download, LinkedIn "add to profile" and X share links). Until accounts exist it's an honour-system certificate.
- **Interactive tools:** write `{{tool:name}}` on its own line in a lesson. Tools are in `public/assets/js/tools.js`: `profit`, `adtest`, `prompt`, `imgprompt`, `metrics`, `pricing`, `serp`, `engagement`, `adsbudget`, `utm`, `contrast`, `pan` (Recipe Vault).
- **Engagement** (`public/assets/js/engage.js`): daily streak, XP and 8 levels, 12 badges, "continue where you left off" (home and classroom), and a question of the day on the classroom page. It's all worked out from saved progress plus `sa.engage` in `localStorage`.

## How it's built

A static site, no framework. Everything the browser loads is in `public/`, which Vercel serves as-is (`vercel.json` sets `outputDirectory: public`).

```
content/            Course sources (Markdown with JSON front matter), page fragments, diagrams
  dropshipping.md   One file per course (also ai-mastery.md, digital-marketing.md, website-builders.md): "# M1 | Module | summary", "## D1 | Title | hours | short title"
  ai-mastery.md     Sections per day: @goal @lesson @demo @tasks @deliverable @tip
  website-builders.md
  pages/            Home, Recipe Vault, Templates and 404 page bodies
  quizzes/          Quiz questions per course (JSON)
  figures/          Generated SVG diagrams (from build/figures.py)
vault-src/          Recipe Vault book sources (Markdown + recipe blocks) and print illustrations
templates-src/      The six website templates (each a folder with index.html, fonts, images)
build/              Build scripts
public/             The generated website (commit it; Vercel deploys this folder)
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

## Next steps

- **Subscription:** add Supabase Auth + Stripe, move progress from `localStorage` to a `progress` table, and gate lessons and downloads.
- **Domain:** add `schoolaura.com` in Vercel → Project → Domains and set the DNS records Vercel shows.
- **Contact and legal:** add a contact email, privacy policy and terms before taking payments.
