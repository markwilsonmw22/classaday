#!/usr/bin/env python3
"""Builds the four Recipe Vault PDFs (plus a combined edition) from vault-src/*.md.
Two-pass render so the contents page has correct page numbers.
Run: python3 build/vault.py"""
import re, sys, html, asyncio, io
from pathlib import Path
import markdown
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "vault-src"
OUT = ROOT / "public" / "downloads" / "recipe-vault"
FONTS = (ROOT / "public" / "assets" / "fonts").as_uri()
sys.path.insert(0, str(SRC))
import art  # noqa: E402

VOLUMES = [
    {"slug": "cake-studio", "file": "cake-studio.md", "n": "01", "title": "Cake Studio", "kicker": "Bake, fill, frost and decorate", "c1": "#b4475a", "c2": "#f6dde1", "art": "cover_cake"},
    {"slug": "keto-kitchen", "file": "keto-kitchen.md", "n": "02", "title": "Keto Kitchen", "kicker": "Low-carb cooking, explained", "c1": "#2f6b4f", "c2": "#dcebe2", "art": "cover_keto"},
    {"slug": "know-your-food", "file": "know-your-food.md", "n": "03", "title": "Know Your Food", "kicker": "Labels, nutrients, portions, safety", "c1": "#2f62b8", "c2": "#dde6f6", "art": "cover_know"},
    {"slug": "simple-quick", "file": "simple-quick.md", "n": "04", "title": "Simple & Quick", "kicker": "A 7-day food plan for busy weeks", "c1": "#b45f1d", "c2": "#f5e3d2", "art": "cover_quick"},
]

MD = markdown.Markdown(extensions=["tables", "sane_lists", "attr_list", "md_in_html"])


def md(t):
    MD.reset()
    return MD.convert(t.strip())


def slugify(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def render_recipe(block, idx):
    data, key, buf = {}, None, []
    lines = block.strip("\n").splitlines()
    for line in lines:
        m = re.match(r"^(title|tag|intro|meta|ingredients|method|notes|art):\s*(.*)$", line)
        if m:
            if key:
                data[key] = "\n".join(buf).strip()
            key, buf = m.group(1), [m.group(2)] if m.group(2) else []
        else:
            buf.append(line)
    if key:
        data[key] = "\n".join(buf).strip()
    meta = "".join(f"<span>{html.escape(x.strip())}</span>" for x in data.get("meta", "").split("|") if x.strip())
    ing_html = ""
    for line in data.get("ingredients", "").splitlines():
        line = line.strip()
        if line.startswith("## "):
            ing_html += f"</ul><h5>{html.escape(line[3:])}</h5><ul>"
        elif line.startswith("- "):
            ing_html += f"<li>{md(line[2:])[3:-4]}</li>"
    ing_html = f"<ul>{ing_html}</ul>".replace("<ul></ul>", "")
    steps = [re.sub(r"^\d+\.\s*", "", l.strip()) for l in data.get("method", "").splitlines() if re.match(r"^\s*\d+\.", l)]
    method = "".join(f"<li>{md(s)[3:-4]}</li>" for s in steps)
    notes = md(data["notes"]) if data.get("notes") else ""
    title = data.get("title", "Recipe")
    illo = getattr(art, data["art"])() if data.get("art") else ""
    return f"""<section class="recipe" id="r-{slugify(title)}">
  <div class="r-band"><span>{html.escape(data.get('tag', ''))}</span><span>Recipe {idx:02d}</span></div>
  <h2 class="r-title">{html.escape(title)}</h2>
  {f'<p class="r-intro">{html.escape(data.get("intro", ""))}</p>' if data.get("intro") else ''}
  <div class="r-meta">{meta}</div>
  <div class="r-grid">
    <div class="r-ing"><h4>Ingredients</h4>{ing_html}{illo}</div>
    <div class="r-method"><h4>Method</h4><ol>{method}</ol>{f'<div class="r-notes"><h4>Notes</h4>{notes}</div>' if notes else ''}</div>
  </div>
</section>"""


def render_body(text):
    chapters, toc = [], []
    recipe_i = 0
    parts = re.split(r"^::: recipe\n(.*?)^:::\s*$", text, flags=re.S | re.M)
    out = []
    for i, part in enumerate(parts):
        if i % 2 == 1:
            recipe_i += 1
            out.append(render_recipe(part, recipe_i))
            t = re.search(r"^title:\s*(.+)$", part, re.M).group(1).strip()
            toc.append(("recipe", t, f"r-{slugify(t)}"))
            continue
        # prose: split on chapter headings
        for chunk in re.split(r"(?=^# )", part, flags=re.M):
            if not chunk.strip():
                continue
            m = re.match(r"^# (.+)$", chunk, re.M)
            h = ""
            if m and chunk.startswith("# "):
                title = m.group(1).strip()
                cid = "c-" + slugify(title)
                toc.append(("chapter", title, cid))
                chunk = chunk[m.end():]
                h = f'<header class="chap" id="{cid}"><p class="chap-k">Chapter</p><h1>{html.escape(title)}</h1></header>'
            body = md(chunk)
            body = re.sub(r"<p>\{\{svg:(\w+)(?:\|(.+?))?\}\}</p>",
                          lambda mm: f'<figure class="illo">{getattr(art, mm.group(1))()}{f"<figcaption>{html.escape(mm.group(2))}</figcaption>" if mm.group(2) else ""}</figure>', body)
            body = body.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
            plain = re.sub(r"<[^>]+>", "", body).strip()
            short = " short" if h and len(plain) < 420 and "<table" not in body and "<figure" not in body else ""
            out.append(f'<section class="prose{" first" if h else ""}{short}">{h}{body}</section>')
    return "\n".join(out), toc


CSS = """
@font-face { font-family: "Bodoni Moda"; src: url("FONTS/bodoni-moda.woff2"); font-weight: 400 900; }
@font-face { font-family: "Bodoni Moda"; src: url("FONTS/bodoni-moda-italic.woff2"); font-weight: 400 900; font-style: italic; }
@font-face { font-family: "Schibsted Grotesk"; src: url("FONTS/schibsted-grotesk.woff2"); font-weight: 400 900; }
@font-face { font-family: "Schibsted Grotesk"; src: url("FONTS/schibsted-grotesk-italic.woff2"); font-weight: 400 900; font-style: italic; }
@font-face { font-family: "Martian Mono"; src: url("FONTS/martian-mono.woff2"); font-weight: 100 800; }
:root { --c1: C1; --c2: C2; --ink: #1f1a16; --muted: #6b6259; --line: #ddd5ca; --paper: #ffffff; }
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--paper); color: var(--ink); font: 10.4pt/1.55 "Schibsted Grotesk", Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
h1, h2, h3, h4, h5 { margin: 0; font-weight: 400; break-after: avoid; }
p { margin: 0 0 .7em; orphans: 3; widows: 3; }
.prose { break-before: page; }
.prose:not(.first) { break-before: auto; }
.chap { break-before: page; padding: .2in 0 .25in; border-bottom: 1.5pt solid var(--c1); margin-bottom: .25in; }
.chap-k { font: 600 7.5pt "Martian Mono", monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--c1); margin: 0 0 6pt; }
.chap h1 { font: 400 30pt/1.05 "Bodoni Moda", Georgia, serif; }
.prose h2 { font: 400 17pt/1.15 "Bodoni Moda", Georgia, serif; margin: 1.1em 0 .45em; color: var(--ink); }
.prose h3 { font: 700 11pt "Schibsted Grotesk", sans-serif; margin: 1em 0 .35em; color: var(--c1); }
.prose ul { margin: 0 0 .8em; padding-left: 1.2em; }
.prose ol { margin: 0 0 .8em; padding-left: 1.7em; }
.prose li { margin-bottom: .25em; }
.prose li::marker { color: var(--c1); }
.prose strong { font-weight: 700; }
.prose blockquote { margin: .8em 0; padding: 10pt 14pt; background: var(--c2); border-radius: 6pt; break-inside: avoid; }
.prose blockquote p:last-child { margin: 0; }
.tbl { margin: .6em 0 1em; break-inside: avoid; }
table { width: 100%; border-collapse: collapse; font-size: 9.2pt; }
th { text-align: left; font: 600 7pt "Martian Mono", monospace; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); border-bottom: 1.2pt solid var(--ink); padding: 5pt 6pt 5pt 0; }
td { border-bottom: .6pt solid var(--line); padding: 5pt 8pt 5pt 0; vertical-align: top; }
figure.illo { margin: .6em 0 1em; break-inside: avoid; }
figure.illo svg { width: 100%; height: auto; display: block; }
figcaption { font-size: 8pt; color: var(--muted); margin-top: 4pt; }
.recipe { break-before: page; }
.prose.short + .recipe { break-before: avoid; margin-top: .3in; }
.r-band { display: flex; justify-content: space-between; font: 600 7.5pt "Martian Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--c1); border-bottom: 1.5pt solid var(--c1); padding-bottom: 6pt; }
.r-title { font: 400 27pt/1.05 "Bodoni Moda", Georgia, serif; margin: 14pt 0 8pt; }
.r-intro { color: var(--muted); font-size: 10.6pt; max-width: 34em; }
.r-meta { display: flex; flex-wrap: wrap; gap: 6pt; margin: 8pt 0 16pt; }
.r-meta span { background: var(--c2); color: var(--ink); border-radius: 20pt; padding: 3pt 9pt; font: 500 7.8pt "Martian Mono", monospace; }
.r-grid { display: grid; grid-template-columns: 2.1in 1fr; gap: .32in; }
.r-grid h4 { font: 600 7.5pt "Martian Mono", monospace; letter-spacing: .12em; text-transform: uppercase; color: var(--c1); margin-bottom: 6pt; }
.r-ing ul { list-style: none; padding: 0; margin: 0 0 8pt; }
.r-ing li { padding: 3.5pt 0; border-bottom: .6pt solid var(--line); font-size: 9.6pt; line-height: 1.35; }
.r-ing h5 { font: 700 8.6pt "Schibsted Grotesk", sans-serif; margin: 10pt 0 2pt; }
.r-ing svg { width: 100%; height: auto; margin-top: 10pt; }
.r-method > ol { margin: 0; padding: 0; list-style: none; counter-reset: s; }
.r-method > ol > li { counter-increment: s; position: relative; padding: 0 0 8pt 26pt; break-inside: avoid; }
.r-method > ol > li::before { content: counter(s); position: absolute; left: 0; top: -1pt; width: 17pt; height: 17pt; border-radius: 50%; background: var(--c1); color: #fff; font: 600 8pt/17pt "Martian Mono", monospace; text-align: center; }
.r-notes { margin-top: 10pt; padding: 10pt 12pt; background: var(--c2); border-radius: 6pt; font-size: 9.4pt; break-inside: avoid; }
.r-notes ul { margin: 0; padding-left: 1.1em; }
.r-notes p:last-child { margin: 0; }
.toc { break-after: page; }
.toc h1 { font: 400 30pt "Bodoni Moda", Georgia, serif; margin-bottom: .25in; border-bottom: 1.5pt solid var(--c1); padding-bottom: .15in; }
.toc a { text-decoration: none; color: inherit; display: flex; gap: 8pt; align-items: baseline; }
.toc .tc { font: 400 13pt "Bodoni Moda", Georgia, serif; margin: 9pt 0 3pt; }
.toc .tr { font-size: 9.4pt; color: var(--muted); padding-left: 14pt; margin: 1.5pt 0; }
.toc .dots { flex: 1; border-bottom: .8pt dotted var(--line); transform: translateY(-3pt); }
.toc .pg { font: 500 8.5pt "Martian Mono", monospace; color: var(--ink); }
.cols2 { columns: 2; column-gap: .3in; }
.cols2 li { break-inside: avoid; }
.planner td { height: .5in; }
.lined p { border-bottom: .6pt solid var(--line); height: .32in; margin: 0; }
"""

COVER = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Bodoni Moda"; src: url("FONTS/bodoni-moda.woff2"); font-weight: 400 900; }
@font-face { font-family: "Bodoni Moda"; src: url("FONTS/bodoni-moda-italic.woff2"); font-weight: 400 900; font-style: italic; }
@font-face { font-family: "Schibsted Grotesk"; src: url("FONTS/schibsted-grotesk.woff2"); font-weight: 400 900; }
@font-face { font-family: "Martian Mono"; src: url("FONTS/martian-mono.woff2"); font-weight: 100 800; }
@page { size: Letter; margin: 0; }
html, body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.cv { width: 8.5in; height: 11in; background: C1; color: #fff8ef; position: relative; overflow: hidden; padding: .7in; box-sizing: border-box; display: flex; flex-direction: column; }
.top { display: flex; justify-content: space-between; font: 600 8pt "Martian Mono", monospace; letter-spacing: .16em; text-transform: uppercase; opacity: .85; }
.art { position: absolute; right: -.2in; top: 1.15in; width: 6.1in; opacity: .95; }
.art svg { width: 100%; height: auto; }
.t { position: relative; margin-top: auto; margin-bottom: .45in; }
.t .k { font: italic 400 18pt "Bodoni Moda", serif; opacity: .9; margin-bottom: 6pt; }
.t h1 { font: 400 66pt/0.95 "Bodoni Moda", serif; margin: 0; letter-spacing: -.01em; }
.t p { font: 400 11pt "Schibsted Grotesk", sans-serif; margin: 16pt 0 0; max-width: 4.2in; opacity: .9; }
.foot { position: relative; display: flex; justify-content: space-between; align-items: end; border-top: .8pt solid rgba(255,248,239,.4); padding-top: 12pt; font: 500 8pt "Martian Mono", monospace; letter-spacing: .1em; }
.brand { font: 400 20pt "Bodoni Moda", serif; letter-spacing: 0; }
.brand i { font-style: italic; }
</style></head><body><div class="cv">
<div class="top"><span>The Recipe Vault</span><span>Volume NN</span></div>
<div class="art">ART</div>
<div class="t"><p class="k">The Recipe Vault · Vol. NN</p><h1>TITLE</h1><p>KICKER</p></div>
<div class="foot"><span class="brand">School<i>Aura</i></span><span>SCHOOLAURA.COM · FOD 110</span></div>
</div></body></html>"""


def body_html(vol, inner, toc, pages=None):
    rows = []
    for kind, title, anchor in toc:
        pg = str(pages.get(anchor, "")) if pages else "00"
        cls = "tc" if kind == "chapter" else "tr"
        rows.append(f'<div class="{cls}"><a href="#{anchor}"><span>{html.escape(title)}</span><span class="dots"></span><span class="pg">{pg}</span></a></div>')
    toc_html = f'<section class="toc"><h1>Contents</h1>{"".join(rows)}</section>'
    css = CSS.replace("FONTS", FONTS).replace("C1", vol["c1"]).replace("C2", vol["c2"])
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{vol["title"]}</title><style>{css}</style></head><body>{toc_html}{inner}</body></html>'


FOOTER = """<div style="width:100%;font:7pt 'Martian Mono',monospace;color:#8a8076;padding:0 .7in;display:flex;justify-content:space-between;letter-spacing:.08em;-webkit-print-color-adjust:exact">
<span>THE RECIPE VAULT · VOL. NN · TITLE</span><span class="pageNumber"></span></div>"""


async def render(page, html_str, pdf_opts):
    await page.set_content(html_str, wait_until="load")
    await page.evaluate("document.fonts.ready")
    await page.wait_for_timeout(250)
    return await page.pdf(**pdf_opts)


def find_pages(pdf_bytes, toc, offset):
    reader = PdfReader(io.BytesIO(pdf_bytes))
    texts = [re.sub(r"\s+", " ", (p.extract_text() or "")) for p in reader.pages]
    found = {}
    for kind, title, anchor in toc:
        key = re.sub(r"\s+", " ", title)[:28]
        for i, t in enumerate(texts):
            if i == 0:
                continue  # skip the contents page itself
            if key in t:
                found[anchor] = i + 1 + offset
                break
    return found


async def main():
    from playwright.async_api import async_playwright
    OUT.mkdir(parents=True, exist_ok=True)
    built = []
    async with async_playwright() as p:
        b = await p.chromium.launch()
        page = await b.new_page()
        only = sys.argv[1:]
        for vol in [v for v in VOLUMES if not only or v['slug'] in only]:
            text = (SRC / vol["file"]).read_text()
            inner, toc = render_body(text)
            opts = {"format": "Letter", "print_background": True, "display_header_footer": True,
                    "header_template": "<div></div>",
                    "footer_template": FOOTER.replace("NN", vol["n"]).replace("TITLE", vol["title"].upper()),
                    "margin": {"top": "0.7in", "bottom": "0.75in", "left": "0.7in", "right": "0.7in"}}
            first = await render(page, body_html(vol, inner, toc), opts)
            pages = find_pages(first, toc, offset=0)
            body = await render(page, body_html(vol, inner, toc, pages), opts)
            cover_html = COVER.replace("FONTS", FONTS).replace("C1", vol["c1"]).replace("NN", vol["n"]).replace("TITLE", html.escape(vol["title"])).replace("KICKER", html.escape(vol["kicker"])).replace("ART", getattr(art, vol["art"])())
            cover = await render(page, cover_html, {"format": "Letter", "print_background": True, "margin": {"top": "0", "bottom": "0", "left": "0", "right": "0"}})
            w = PdfWriter()
            for part in (cover, body):
                for pg in PdfReader(io.BytesIO(part)).pages:
                    w.add_page(pg)
            w.add_metadata({"/Title": f"The Recipe Vault · {vol['title']}", "/Author": "SchoolAura", "/Subject": vol["kicker"]})
            out = OUT / f"schoolaura-{vol['slug']}.pdf"
            with open(out, "wb") as f:
                w.write(f)
            missing = [t for k, t, a in toc if a not in pages]
            n = len(PdfReader(out).pages)
            built.append(out)
            print(f"  {out.name}: {n} pages, {out.stat().st_size // 1024} KB" + (f"  ! toc misses: {missing}" if missing else ""))
        await b.close()
    if len(built) < len(VOLUMES):
        return
    w = PdfWriter()
    for f in built:
        for pg in PdfReader(f).pages:
            w.add_page(pg)
    w.add_metadata({"/Title": "The Recipe Vault · Complete Edition", "/Author": "SchoolAura"})
    full = OUT / "schoolaura-recipe-vault-complete.pdf"
    with open(full, "wb") as f:
        w.write(f)
    print(f"  {full.name}: {len(PdfReader(full).pages)} pages, {full.stat().st_size // 1024} KB")


if __name__ == "__main__":
    asyncio.run(main())
