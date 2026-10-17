#!/usr/bin/env python3
"""Packages the website templates: live previews, screenshots, per-template ZIPs and the bulk pack.
Needs the local preview server on :8765 serving public/ for screenshots.
Run: python3 build/templates.py"""
import json, shutil, zipfile, asyncio
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "templates-src"
PUB = ROOT / "public"

TEMPLATES = [
    {"slug": "ember", "name": "Ember", "desc": "A warm, dark site for restaurants, cafés and bars. Menu with prices, story, gallery, hours and booking.", "tags": ["Restaurant", "Café", "Dark"]},
    {"slug": "northline", "name": "Northline", "desc": "A clean product site for software and online services. Email signup, product screen, features, pricing and FAQ.", "tags": ["SaaS", "Startup", "Light"]},
    {"slug": "atelier", "name": "Atelier", "desc": "An editorial portfolio for designers, photographers and studios. Big type, project grid and index, services.", "tags": ["Portfolio", "Studio", "Editorial"]},
    {"slug": "haven", "name": "Haven", "desc": "A calm site for real estate agents. Home search, listing cards, agent profile, neighbourhoods and valuation form.", "tags": ["Real estate", "Agent", "Light"]},
    {"slug": "pulse", "name": "Pulse", "desc": "A bold site for gyms and fitness studios. Classes, a weekly schedule you can edit, memberships and coaches.", "tags": ["Fitness", "Gym", "Dark"]},
    {"slug": "keystone", "name": "Keystone", "desc": "A trustworthy site for contractors and trades. Quote form, services, before and after, process and service areas.", "tags": ["Trades", "Contractor", "Lead gen"]},
]

LICENSE = """SchoolAura Website Templates — Licence

You may:
  - Use these templates for your own websites.
  - Use them for unlimited client projects, paid or unpaid.
  - Edit, combine and redesign them in any way.

You may not:
  - Resell, share or give away the templates themselves as templates or as part of a template pack.
  - Claim the original templates as your own design work for sale as templates.

Fonts are included under the SIL Open Font License (free for commercial use).
Placeholder images are abstract and may be used freely, but you should replace them with your own photos.
Sample business names, addresses, phone numbers (555 numbers) and reviews are fictional examples.
Only publish real reviews from your own customers.

© SchoolAura. schoolaura.com
"""

README = """{name} — SchoolAura website template
====================================

WHAT'S INSIDE
  index.html   The whole website: content, styles and a tiny bit of script.
  fonts/       Self-hosted fonts, so the site works anywhere with no setup.
  images/      Placeholder photos. Replace them with yours, keeping the same file names.

QUICK START (10 minutes)
  1. Unzip the folder.
  2. Open index.html in a code editor (VS Code is free).
  3. Near the top, find the block that starts with  /* ===== EDIT ME: brand ===== */
     Change the colours and fonts there. The whole site updates.
  4. Search the file for the sample business name and replace text section by section.
  5. Drop your photos into images/ using the same file names (or change the src="" paths).
  6. Open index.html in your browser to check, then publish (see the SchoolAura guide, Day 6).

IMAGES USED BY THIS TEMPLATE
{images}

TIPS
  - Phone links use tel:+1XXXXXXXXXX. Replace the 555 sample numbers with real ones.
  - Forms are demo-only. Day 5 of the guide shows how to make them send you emails.
  - Replace sample reviews with real ones from your customers, or remove the section.

Full 7-day guide: https://schoolaura.com/courses/website-builders/
"""

START = """SchoolAura Website Template Pack
===============================

{count} complete website templates, one folder each:

{list}

Each folder has its own README.txt. Start with the 7-day guide:
https://schoolaura.com/courses/website-builders/

Licence: see LICENSE.txt. Use them for yourself and for unlimited client projects.
"""


def zip_dir(zf, folder: Path, arc_prefix: str):
    for f in sorted(folder.rglob("*")):
        if f.is_file():
            zf.write(f, f"{arc_prefix}/{f.relative_to(folder)}")


async def screenshots():
    from playwright.async_api import async_playwright
    out = PUB / "templates" / "previews"
    out.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for t in TEMPLATES:
            ctx = await b.new_context(viewport={"width": 1440, "height": 900})
            page = await ctx.new_page()
            await page.goto(f"http://localhost:8765/templates/{t['slug']}/", wait_until="networkidle")
            await page.wait_for_timeout(500)
            png = out / f"{t['slug']}.png"
            await page.screenshot(path=str(png))
            mob = out / f"{t['slug']}-mobile.png"
            await page.set_viewport_size({"width": 390, "height": 844})
            await page.wait_for_timeout(300)
            await page.screenshot(path=str(mob))
            await ctx.close()
        await b.close()
    from PIL import Image
    for t in TEMPLATES:
        for suffix in ("", "-mobile"):
            png = out / f"{t['slug']}{suffix}.png"
            im = Image.open(png).convert("RGB")
            if not suffix:
                im = im.resize((1200, 750), Image.LANCZOS)
            im.save(out / f"{t['slug']}{suffix}.webp", quality=82, method=6)
            png.unlink()


def main():
    dl = PUB / "downloads" / "templates"
    dl.mkdir(parents=True, exist_ok=True)
    for t in TEMPLATES:
        src = SRC / t["slug"]
        imgs = "\n".join(f"  images/{p.name}" for p in sorted((src / "images").glob("*.jpg")))
        (src / "README.txt").write_text(README.format(name=t["name"], images=imgs))
        (src / "LICENSE.txt").write_text(LICENSE)
        dest = PUB / "templates" / t["slug"]
        if dest.exists():
            shutil.rmtree(dest)
        shutil.copytree(src, dest, ignore=shutil.ignore_patterns("README.txt", "LICENSE.txt"))
        with zipfile.ZipFile(dl / f"{t['slug']}.zip", "w", zipfile.ZIP_DEFLATED) as zf:
            zip_dir(zf, src, f"schoolaura-{t['slug']}")
    with zipfile.ZipFile(dl / "schoolaura-template-pack.zip", "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("schoolaura-template-pack/START-HERE.txt", START.format(count=len(TEMPLATES), list="\n".join(f"  {t['slug']}/  {t['name']}: {t['desc']}" for t in TEMPLATES)))
        zf.writestr("schoolaura-template-pack/LICENSE.txt", LICENSE)
        for t in TEMPLATES:
            zip_dir(zf, SRC / t["slug"], f"schoolaura-template-pack/{t['slug']}")
    (SRC / "manifest.json").write_text(json.dumps(TEMPLATES, indent=2))
    asyncio.run(screenshots())
    for f in sorted(dl.glob("*.zip")):
        print(f"  {f.name}: {f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
