#!/usr/bin/env python3
"""Screenshot helper for local QA. Usage:
  python3 build/shot.py OUTDIR url[@width][#fullpage] ...
Optional env JS='...' runs a script before capture."""
import sys, os, asyncio
from playwright.async_api import async_playwright


async def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for i, spec in enumerate(sys.argv[2:]):
            full = spec.endswith("!")
            spec = spec.rstrip("!")
            url, _, w = spec.partition("@")
            w = int(w or 1440)
            ctx = await b.new_context(viewport={"width": w, "height": 900 if w > 600 else 844}, device_scale_factor=1)
            page = await ctx.new_page()
            errs = []
            page.on("pageerror", lambda e: errs.append(str(e)))
            page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
            await page.goto(url, wait_until="networkidle")
            if os.environ.get("JS"):
                await page.evaluate(os.environ["JS"])
                await page.wait_for_timeout(300)
            await page.wait_for_timeout(900)
            sw = await page.evaluate("document.documentElement.scrollWidth")
            f = os.path.join(out, f"{i:02d}.png")
            await page.screenshot(path=f, full_page=full)
            print(f, url, w, "scrollWidth", sw, "ERR:" if errs else "", "; ".join(errs[:3]))
            await ctx.close()
        await b.close()

asyncio.run(main())
