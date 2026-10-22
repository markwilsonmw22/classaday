#!/usr/bin/env python3
"""Renders the default social share image (public/assets/img/og.jpg, 1200x630): wordmark, headline
and four course covers. Needs the local preview server on :8765 serving public/ (run covers.py first
if the covers changed). Run: python3 build/og.py"""
import asyncio, io
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "assets" / "img" / "og.jpg"
COVERS = ["dropshipping", "ai-mastery", "recipe-vault", "website-builders"]

PAGE = """<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="/assets/css/fonts.css"><link rel="stylesheet" href="/assets/css/site.css">
<style>
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#f7f7f5}
.og{position:relative;width:1200px;height:630px;padding:72px 72px 0;box-sizing:border-box}
.brand{font-size:30px;gap:12px}
.brand .mark{width:32px;height:32px}
.brand .mark::after{inset:7px;background:#f7f7f5}
h1{font-size:64px;line-height:1.08;font-weight:850;letter-spacing:-.035em;margin-top:34px;max-width:960px}
.row{position:absolute;left:72px;right:72px;bottom:64px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.row img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:14px;box-shadow:0 10px 26px rgba(20,20,18,.10);display:block}
</style></head><body>
<div class="og">
  <span class="brand"><span class="mark"></span><span class="wm">class<span>a</span>day</span></span>
  <h1>Learn a skill you can actually use, one day at a time.</h1>
  <div class="row">IMGS</div>
</div></body></html>"""


async def main():
    from playwright.async_api import async_playwright
    imgs = "".join(f'<img src="/assets/img/covers/{c}.webp" alt="">' for c in COVERS)
    html = PAGE.replace("IMGS", imgs)
    tmp = ROOT / "public" / "_og.html"
    tmp.write_text(html)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            page = await b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
            await page.goto("http://localhost:8765/_og.html", wait_until="networkidle")
            await page.evaluate("document.fonts.ready")
            png = await page.screenshot()
            await b.close()
    finally:
        tmp.unlink(missing_ok=True)
    Image.open(io.BytesIO(png)).convert("RGB").save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"  {OUT.relative_to(ROOT)}: {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    asyncio.run(main())
