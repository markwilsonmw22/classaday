# Viral Prompts: how packs work

Each file in this folder is one **prompt pack**: one trend, ready to copy. The build turns them into `/prompts/` (the feed) and `/prompts/<slug>/` (one page per pack). Newest first.

## File name and format

`YYYY-MM-DD-<slug>.json`, for example `2026-10-18-y2k-halloween-flash.json`.

```json
{
  "slug": "y2k-halloween-flash",
  "title": "Y2K Halloween flash photo",
  "published": "2026-10-18T07:30:00Z",
  "kind": "image",
  "tools": ["ChatGPT", "Gemini"],
  "summary": "One sentence for cards and search results (under 160 characters).",
  "why": "Why it's trending right now, in one or two plain sentences. Only say what you actually found.",
  "steps": ["What to do first", "What to do next"],
  "prompts": [
    {"label": "Main prompt", "text": "The full prompt..."},
    {"label": "Variation: ...", "text": "..."}
  ],
  "tips": ["Short practical tip", "Another tip"],
  "tags": ["halloween", "selfie", "retro"]
}
```

- `kind` is one of `image`, `video`, `text`, `voice`.
- `published` is UTC. Subscribers see a **New** badge on packs published since their last visit.
- `slug` must be unique, lowercase, words joined by hyphens.
- 2–4 prompts per pack, 2–4 tips, 2–5 tags.

## Rules for every pack

- **Original writing.** Never copy another site's prompt text. Describe the look in your own words.
- **No real people** except the user's own photo, or friends and family who have agreed. Never celebrities, public figures or politicians.
- **No copying a living artist's or studio's style by name, and no brand characters, logos or trademarks.** Describe the visual qualities instead (lighting, colours, era, camera).
- **Nothing sexual, hateful, violent, political, medical or financial.** Nothing that tricks people (fake news, fake receipts, fake reviews, deepfakes).
- **Plain English, short sentences, Canadian spelling.** Where a trend suits small businesses, add a business variation.
- **Only trends with real evidence** from this week or month (articles, platform posts, tool announcements). Skip anything you can't confirm.
- **Don't repeat** a trend that already has a pack unless there's a genuinely new twist; then link the idea in `why`.
