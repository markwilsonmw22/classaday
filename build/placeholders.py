#!/usr/bin/env python3
"""Generates soft, defocused 'photographic' placeholder images for each template,
so templates look finished until buyers drop in their own photos (same file names).
Run: python3 build/placeholders.py"""
import random, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent / "templates-src"

PALETTES = {
    "ember":     {"base": [(28, 18, 14), (58, 30, 18)], "lights": [(255, 150, 70), (230, 90, 40), (255, 205, 140), (140, 60, 30)]},
    "northline": {"base": [(232, 236, 245), (200, 210, 235)], "lights": [(60, 90, 220), (120, 160, 255), (255, 255, 255), (170, 190, 240)]},
    "atelier":   {"base": [(30, 30, 28), (90, 88, 82)], "lights": [(235, 230, 220), (180, 175, 165), (120, 115, 105), (250, 248, 240)]},
    "haven":     {"base": [(210, 205, 190), (150, 160, 140)], "lights": [(250, 240, 220), (120, 140, 110), (200, 170, 130), (90, 105, 85)]},
    "pulse":     {"base": [(12, 12, 14), (30, 22, 24)], "lights": [(255, 77, 46), (255, 140, 90), (240, 240, 240), (120, 30, 20)]},
    "keystone":  {"base": [(40, 50, 60), (95, 110, 120)], "lights": [(245, 170, 60), (220, 225, 230), (150, 165, 175), (60, 75, 90)]},
}

SHOTS = {
    "ember": ["hero", "dish-1", "dish-2", "dish-3", "room"],
    "northline": ["hero"],
    "atelier": ["work-1", "work-2", "work-3", "work-4", "studio"],
    "haven": ["hero", "home-1", "home-2", "home-3", "agent"],
    "pulse": ["hero", "class-1", "class-2", "class-3", "coach"],
    "keystone": ["hero", "before", "after", "job-1", "job-2"],
}


def grad(w, h, a, b, angle=90):
    y = np.linspace(0, 1, h)[:, None]
    x = np.linspace(0, 1, w)[None, :]
    t = (np.cos(math.radians(angle)) * x + np.sin(math.radians(angle)) * y)
    t = (t - t.min()) / (t.max() - t.min())
    img = np.zeros((h, w, 3))
    for i in range(3):
        img[..., i] = a[i] * (1 - t) + b[i] * t
    return Image.fromarray(img.astype("uint8"))


def make(name, shot, seed, size=(1600, 1000)):
    rnd = random.Random(seed)
    pal = PALETTES[name]
    w, h = size
    img = grad(w, h, pal["base"][0], pal["base"][1], rnd.choice([60, 90, 120, 160]))
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    style = seed % 3
    if style == 0:  # bokeh
        for _ in range(rnd.randint(14, 26)):
            r = rnd.randint(30, 170)
            x, y = rnd.randint(-50, w + 50), rnd.randint(-50, h + 50)
            c = rnd.choice(pal["lights"])
            d.ellipse([x - r, y - r, x + r, y + r], fill=c + (rnd.randint(40, 140),))
        layer = layer.filter(ImageFilter.GaussianBlur(rnd.randint(14, 30)))
    elif style == 1:  # window light / shafts
        for _ in range(rnd.randint(3, 5)):
            c = rnd.choice(pal["lights"])
            x = rnd.randint(0, w)
            pw = rnd.randint(120, 380)
            poly = [(x, -50), (x + pw, -50), (x + pw + rnd.randint(150, 400), h + 50), (x + rnd.randint(150, 400), h + 50)]
            d.polygon(poly, fill=c + (rnd.randint(50, 120),))
        layer = layer.filter(ImageFilter.GaussianBlur(rnd.randint(40, 70)))
    else:  # soft forms
        for _ in range(rnd.randint(5, 8)):
            c = rnd.choice(pal["lights"])
            x, y = rnd.randint(0, w), rnd.randint(0, h)
            rx, ry = rnd.randint(200, 700), rnd.randint(120, 400)
            d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=c + (rnd.randint(70, 170),))
        layer = layer.filter(ImageFilter.GaussianBlur(rnd.randint(60, 110)))
    img = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    arr = np.asarray(img).astype("float32")
    # vignette
    yy, xx = np.mgrid[0:h, 0:w]
    v = 1 - 0.35 * (((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    arr *= np.clip(v, 0.55, 1)[..., None]
    # grain
    arr += np.random.default_rng(seed).normal(0, 7, arr.shape)
    img = Image.fromarray(np.clip(arr, 0, 255).astype("uint8"))
    out = ROOT / name / "images" / f"{shot}.jpg"
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, quality=78, optimize=True, progressive=True)


if __name__ == "__main__":
    n = 0
    for name, shots in SHOTS.items():
        for i, s in enumerate(shots):
            make(name, s, seed=sum(map(ord, name)) + i * 7 + 3, size=(1600, 1000) if s in ("hero", "room", "studio") else (1200, 1200))
            n += 1
    print("images:", n)
