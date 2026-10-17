# SchoolAura

The website for **schoolaura.com**: self-paced courses with day-by-day plans and a progress calendar, a downloadable Recipe Vault, and a website template pack.

## What's on the site

| Page | Path | What it is |
|---|---|---|
| Home | `/` | Discovery page: search, category chips, course cards, how it works, FAQ |
| Classroom | `/courses/` | All courses as cards with progress bars |
| Dropshipping (COM 130) | `/courses/dropshipping/` | 30 daily lessons, ≈103 h, 9 diagrams |
| AI Mastery (AI 210) | `/courses/ai-mastery/` | 21 daily lessons, ≈72 h, 7 diagrams |
| Digital Marketing Agency (MKT 220) | `/courses/digital-marketing/` | 30 daily lessons, ≈108 h, 8 diagrams |
| Website Builders (WEB 120) | `/courses/website-builders/` | 7-day guide to the template pack |
| Template library | `/templates/` | 6 templates, live previews, single and bulk ZIP downloads |
| Recipe Vault (FOD 110) | `/recipe-vault/` | 4 PDF books + a complete edition, pick and download |

Every course page has three tabs: **Classroom** (lesson list with progress on the left, lesson on the right: lesson, worked example, timed task checklist, mark as done), **Calendar** (start date, study days, pace, month calendar, what's coming up) and **About** (outcomes, curriculum, who it's for). Progress is saved in the visitor's browser (`localStorage`) until accounts arrive with the subscription.

## How it's built

A static site, no framework. Everything the browser loads is in `public/`, which Vercel serves as-is (`vercel.json` sets `outputDirectory: public`).

```
content/            Course sources (Markdown with JSON front matter), page fragments, diagrams
  dropshipping.md   One file per course (also ai-mastery.md, digital-marketing.md, website-builders.md): "# M1 | Module | summary", "## D1 | Title | hours | short title"
  ai-mastery.md     Sections per day: @goal @lesson @demo @tasks @deliverable @tip
  website-builders.md
  pages/            Home, Recipe Vault, Templates and 404 page bodies
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
