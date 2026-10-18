# SchoolAura — notes for Claude

Static site for schoolaura.com. No local dev environment: changes are made by Claude, pushed to GitHub, and Vercel deploys `public/` automatically.

## Rules
- Edit sources, not generated HTML: courses in `content/*.md`, pages in `content/pages/*.html`, books in `vault-src/*.md`, templates in `templates-src/*/index.html`. Then run the matching script in `build/` and commit `public/` too.
- Design: light, simple, Skool-style (off-white canvas, white cards, Figtree). Tokens live at the top of `public/assets/css/site.css`, with one colour per course (drop orange, ai blue, mkt purple, vault rose, web green) used only for covers, icons and progress. Keep new UI on those tokens.
- Card covers are rendered by `build/covers.py` (needs the local server on :8765). Fonts are self-hosted in `public/assets/fonts`.
- Never show the owner's personal details (name, address, email, phone, other businesses) anywhere on the site or in downloads. The brand is SchoolAura.
- Never invent reviews, testimonials, student numbers or results. Sample reviews exist only inside templates and are labelled as samples.
- Course content: plain English, short sentences, Canadian context where relevant, task lines end with `(N min)`.
- Subscription is not built yet: all content is open. Progress is in `localStorage` under `sa.course.<slug>` (`done`, `tasks`, `quiz`, `notes`, `feel`, `certDate`); streaks, badges and the daily question are in `sa.engage`, the certificate name in `sa.name`.
- Quizzes are in `content/quizzes/<slug>.json`. Every question needs a `why` and a `day` inside its module; keep them answerable from the lesson text. Lesson tools are `{{tool:name}}` lines, defined in `public/assets/js/tools.js`; example numbers in a tool should match the lesson's worked example.
