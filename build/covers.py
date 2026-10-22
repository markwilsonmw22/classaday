#!/usr/bin/env python3
"""Renders the 16:9 cover images used on cards (public/assets/img/covers/*.webp).
Uses real product material: lesson diagrams, template screenshots and the PDF book covers.
Needs the local preview server on :8765 serving public/. Run: python3 build/covers.py"""
import asyncio, subprocess, shutil
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
OUT = PUB / "assets" / "img" / "covers"
TMP = PUB / "_covers"
OUT.mkdir(parents=True, exist_ok=True)
TMP.mkdir(exist_ok=True)

BOOKS = [("cake-studio", "#b4475a"), ("keto-kitchen", "#2f6b4f"), ("know-your-food", "#2f62b8"), ("simple-quick", "#b45f1d")]

# Render the first page of each PDF to an image.
for slug, _ in BOOKS:
    pdf = PUB / "downloads" / "recipe-vault" / f"classaday-{slug}.pdf"
    subprocess.run(["pdftoppm", "-f", "1", "-l", "1", "-r", "90", "-png", "-singlefile", str(pdf), str(TMP / f"book-{slug}")], check=True)

BASE = """<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/assets/css/fonts.css"><link rel="stylesheet" href="/assets/css/site.css"><style>
html,body{margin:0;width:1280px;height:720px;overflow:hidden;background:#fff}
.cv{width:1280px;height:720px;position:relative;overflow:hidden;display:grid;grid-template-columns:520px 1fr;align-items:center;padding:0 0 0 76px;box-sizing:border-box}
.tx h2{font-size:76px;line-height:1.02;font-weight:850;letter-spacing:-.035em;color:#1d1e20}
.tx p{font-size:28px;font-weight:600;color:#45474c;margin-top:20px;line-height:1.3}
.tx .k{display:inline-block;font-size:22px;font-weight:800;padding:8px 16px;border-radius:999px;color:#fff;margin-bottom:26px}
.shot{position:relative;height:100%}
.fig{position:absolute;left:40px;top:120px;width:760px;background:#fff;border-radius:20px;box-shadow:0 30px 60px rgba(20,20,18,.14);padding:34px}
.fig svg{width:100%;height:auto;display:block}
</style></head><body data-aura="AURA">BODY</body></html>"""


def course_cover(aura, bg, kcol, kicker, title, sub, figure):
    svg = (ROOT / "content" / "figures" / f"{figure}.svg").read_text()
    body = f'<div class="cv" style="background:{bg}"><div class="tx"><span class="k" style="background:{kcol}">{kicker}</span><h2>{title}</h2><p>{sub}</p></div><div class="shot"><div class="fig">{svg}</div></div></div>'
    return BASE.replace("AURA", aura).replace("BODY", body)


pages = {
    "dropshipping": course_cover("drop", "#fff1e6", "#e2702a", "30-day plan", "Dropshipping", "Zero to first sales,<br>one day at a time", "ds-unit"),
    "ai-mastery": course_cover("ai", "#e8eefe", "#3462e0", "24-day plan", "AI Mastery", "Claude, ChatGPT, AI video,<br>apps and MCP", "ai-prompt"),
    "digital-marketing": course_cover("mkt", "#f0eafd", "#7646d6", "30-day plan", "Digital Marketing", "SEO, social, ads,<br>and your own agency", "dm-serp"),
}

# Templates: a fan of real template screenshots.
shots = "".join(
    f'<img src="/templates/previews/{s}.webp" style="position:absolute;width:640px;border-radius:14px;box-shadow:0 24px 50px rgba(20,20,18,.18);left:{l}px;top:{t}px;transform:rotate({r}deg)">'
    for s, l, t, r in (("haven", 690, 60, 4), ("pulse", 600, 260, -3), ("ember", 540, 130, -1)))
pages["website-builders"] = BASE.replace("AURA", "web").replace("BODY",
    f'<div class="cv" style="background:#e4f4ea;display:block"><div class="tx" style="position:absolute;left:76px;top:190px;width:470px;z-index:2"><span class="k" style="background:#2b8a57">6 templates</span><h2>Website Templates</h2><p>Rebrand, publish,<br>sell redesigns</p></div>{shots}</div>')

# Recipe Vault: the four real book covers fanned out.
books = "".join(
    f'<img src="/_covers/book-{s}.png" style="position:absolute;height:520px;border-radius:6px;box-shadow:0 26px 50px rgba(20,20,18,.25);left:{l}px;top:{t}px;transform:rotate({r}deg)">'
    for (s, _), l, t, r in zip(BOOKS, (560, 690, 820, 950), (130, 110, 120, 140), (-8, -3, 2, 7)))
pages["recipe-vault"] = BASE.replace("AURA", "vault").replace("BODY",
    f'<div class="cv" style="background:#fde8ec;display:block"><div class="tx" style="position:absolute;left:76px;top:200px;width:440px"><span class="k" style="background:#d24660">4 PDF books</span><h2>The Recipe Vault</h2><p>Cakes, keto, nutrition<br>and a 7-day plan</p></div>{books}</div>')

# One cover per book for the vault cards.
for slug, col in BOOKS:
    pages[f"book-{slug}"] = BASE.replace("AURA", "vault").replace("BODY",
        f'<div class="cv" style="background:{col}22;display:grid;grid-template-columns:1fr;place-items:center;padding:0"><img src="/_covers/book-{slug}.png" style="height:600px;border-radius:6px;box-shadow:0 30px 60px rgba(20,20,18,.28);transform:rotate(-3deg)"></div>')

# Viral Prompts: a stack of real-looking prompt cards.
def vp_card(kind, title, text, left, top, rot):
    return (f'<div class="pcard" style="position:absolute;width:560px;left:{left}px;top:{top}px;transform:rotate({rot}deg);box-shadow:0 26px 50px rgba(20,20,18,.16)">'
            f'<div class="pc-top"><span class="pill kind kind-{kind.lower()}">{kind}</span><span>New today</span></div>'
            f'<div class="pc-title" style="font-size:1.35rem">{title}</div>'
            f'<div class="pblock"><div class="pb-top"><b>Main prompt</b><span class="btn light sm">Copy</span></div><pre style="font-size:1rem;max-height:none">{text}</pre></div></div>')
cards = (vp_card("Video", "Your pet as a TV news anchor", "The dog looks into the camera, tilts its head, then nods seriously as if reading the news. Slow push in, 6 seconds.", 690, 40, 5)
         + vp_card("Video", "Maple taffy on snow ASMR", "Extreme close-up: hot amber maple syrup pours in a slow, glossy ribbon onto fresh snow…", 610, 300, -4)
         + vp_card("Image", "Y2K Halloween flash photo", "Use my attached photo. Keep my face exactly as it is. Recreate it as a candid photo from around 2003…", 560, 150, -1))
pages["viral-prompts"] = BASE.replace("AURA", "vp").replace("BODY",
    f'<div class="cv" style="background:#fdf2dc;display:block"><div class="tx" style="position:absolute;left:76px;top:190px;width:470px;z-index:2"><span class="k" style="background:#d4870a">New as trends appear</span><h2>Viral Prompts</h2><p>Trending AI photo and<br>video prompts to copy</p></div>{cards}</div>')

# Render only the covers named on the command line, if any (e.g. python3 build/covers.py viral-prompts).
import sys
if sys.argv[1:]:
    pages = {k: v for k, v in pages.items() if k in sys.argv[1:]}

for name, h in pages.items():
    (TMP / f"{name}.html").write_text(h)


async def shoot():
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1280, "height": 720})
        for name in pages:
            await pg.goto(f"http://localhost:8765/_covers/{name}.html", wait_until="networkidle")
            await pg.wait_for_timeout(300)
            png = TMP / f"{name}-shot.png"
            await pg.screenshot(path=str(png))
            Image.open(png).convert("RGB").save(OUT / f"{name}.webp", quality=84, method=6)
        await b.close()

asyncio.run(shoot())
shutil.rmtree(TMP)
for f in sorted(OUT.glob("*.webp")):
    print(f"  {f.name}: {f.stat().st_size // 1024} KB")
