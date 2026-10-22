#!/usr/bin/env python3
"""Builds a relative-path copy of public/ for a private Claude artifact preview.
Absolute links (/x/) become relative file links (x/index.html) so every page works
inside the preview. Output: the folder given as the first argument."""
import re, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PUB = ROOT / "public"
OUT = Path(sys.argv[1])
if OUT.exists():
    shutil.rmtree(OUT)
shutil.copytree(PUB, OUT, ignore=shutil.ignore_patterns("downloads", "robots.txt", "sitemap.xml", "404.html"))
shutil.copytree(PUB / "downloads" / "recipe-vault", OUT / "downloads" / "recipe-vault")


def rel(from_file: Path, target: str) -> str:
    path, _, frag = target.partition("#")
    if path.endswith("/") or path == "":
        path = path + "index.html"
    depth = len(from_file.relative_to(OUT).parts) - 1
    r = "../" * depth + path.lstrip("/")
    return r + ("#" + frag if frag else "")


for f in OUT.rglob("*.html"):
    s = f.read_text()
    s = re.sub(r'(href|src)="(/[^"]*)"', lambda m: f'{m.group(1)}="{rel(f, m.group(2))}"', s)
    s = re.sub(r'(href|src)="(#[^"]*)"', lambda m: m.group(0), s)
    s = re.sub(r'"href": "(/[^"]*)"', lambda m: f'"href": "{rel(f, m.group(1))}"', s)  # SA_DAILY / SA_META links
    s = s.replace(' download>', ' target="_blank" rel="noopener">')
    f.write_text(s)

css = OUT / "assets" / "css" / "fonts.css"
css.write_text(css.read_text().replace('url("/assets/fonts/', 'url("../fonts/'))
js = OUT / "assets" / "js" / "vault.js"
js.write_text(js.read_text().replace('"/downloads/recipe-vault/classaday-"', '"../downloads/recipe-vault/classaday-"'))

# Entry page: the artifact host supplies doctype/html/head/body, so unwrap index.html.
idx = OUT / "index.html"
s = idx.read_text()
head = re.search(r"<head>(.*?)</head>", s, re.S).group(1)
body_tag = re.search(r"<body([^>]*)>", s).group(1)
body = re.search(r"<body[^>]*>(.*)</body>", s, re.S).group(1)
head = re.sub(r'<meta charset[^>]*>\s*|<meta name="viewport"[^>]*>\s*', "", head)
title = re.search(r"<title>.*?</title>", head).group(0)
head = head.replace(title, "")
aura = re.search(r'data-aura="(\w+)"', body_tag).group(1)
entry = f'''{title.replace("Class a Day · Learn one skill properly, one day at a time", "Class a Day")}
<meta name="claude:viewport-fit-sides" content="cover">
{head}
<script>document.body.setAttribute("data-aura", "{aura}");</script>
{body}'''
idx.write_text(entry)
files = [p for p in OUT.rglob("*") if p.is_file()]
print(len(files), "files", sum(p.stat().st_size for p in files) // 1024, "KB")
