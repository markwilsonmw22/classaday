#!/usr/bin/env python3
"""SchoolAura static site builder.

Reads course sources from content/*.md (JSON front matter + day blocks), figures from
content/figures/*.svg and page fragments from content/pages/*.html, and writes the
finished static site into public/.

Run:  python3 build/build.py
"""
import json, re, math, html, sys
from pathlib import Path
import markdown

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
PUBLIC = ROOT / "public"
SITE = "https://schoolaura.com"
FONTS = ("https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..800;1,6..96,400..800"
         "&family=Schibsted+Grotesk:ital,wght@0,400..800;1,400..700&family=Martian+Mono:wght@300..600&display=swap")
COURSE_FILES = ["dropshipping.md", "ai-mastery.md", "website-builders.md"]
AURA_VAR = {"drop": "var(--a-drop)", "vault": "var(--a-vault)", "ai": "var(--a-ai)", "web": "var(--a-web)"}

MD = markdown.Markdown(extensions=["tables", "fenced_code", "sane_lists", "attr_list"])


def md(text: str) -> str:
    MD.reset()
    return MD.convert(text.strip())


def md_inline(text: str) -> str:
    out = md(text)
    return re.sub(r"^<p>(.*)</p>$", r"\1", out, flags=re.S)


class FigureBank:
    def __init__(self):
        self.count = 0

    def sub(self, html_text: str) -> str:
        def repl(m):
            name, cap = m.group(1).strip(), (m.group(2) or "").strip()
            f = CONTENT / "figures" / f"{name}.svg"
            if not f.exists():
                print(f"  ! missing figure {name}", file=sys.stderr)
                return ""
            self.count += 1
            svg = f.read_text()
            cap_html = f'<figcaption><b>FIG. {self.count:02d}</b>{html.escape(cap)}</figcaption>' if cap else ""
            return f'<figure><div class="fig">{svg}</div>{cap_html}</figure>'
        return re.sub(r"<p>\{\{fig:([\w-]+)(?:\|(.+?))?\}\}</p>", repl, html_text)


def post(html_text: str, figs: FigureBank) -> str:
    html_text = figs.sub(html_text)
    html_text = html_text.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
    return html_text


def parse_minutes(t: str):
    m = re.search(r"\((\d+(?:\.\d+)?)\s*(min|h)\)\s*$", t)
    if not m:
        return t, 0
    val = float(m.group(1)) * (60 if m.group(2) == "h" else 1)
    return t[: m.start()].rstrip(), int(round(val))


def parse_course(path: Path):
    raw = path.read_text()
    fm = re.match(r"^---json\n(.*?)\n---\n", raw, re.S)
    meta = json.loads(fm.group(1))
    body = raw[fm.end():]
    figs = FigureBank()
    modules, days = [], []
    cur_mod, cur_day, cur_sec = None, None, None
    buf = []

    def flush():
        nonlocal buf
        if cur_day is not None and cur_sec:
            cur_day["_raw"][cur_sec] = "\n".join(buf).strip()
        buf = []

    for line in body.splitlines():
        mm = re.match(r"^# M(\d+) \| (.+?) \| (.+)$", line)
        dm = re.match(r"^## D(\d+) \| (.+?) \| ([\d.]+)(?: \| (.+))?$", line)
        sm = re.match(r"^@(goal|lesson|demo|tasks|deliverable|tip)\s*(.*)$", line)
        if mm:
            flush(); cur_sec = None
            cur_mod = {"n": int(mm.group(1)), "title": mm.group(2).strip(), "summary": mm.group(3).strip(), "days": []}
            modules.append(cur_mod)
        elif dm:
            flush(); cur_sec = None
            cur_day = {"n": int(dm.group(1)), "title": dm.group(2).strip(), "hours": float(dm.group(3)),
                       "short": (dm.group(4) or "").strip(), "_raw": {}}
            days.append(cur_day)
            cur_mod["days"].append(cur_day["n"])
        elif sm:
            flush()
            cur_sec = sm.group(1)
            if sm.group(2):
                buf.append(sm.group(2))
        else:
            buf.append(line)
    flush()

    out_days = []
    for d in days:
        r = d.pop("_raw")
        tasks = []
        for line in r.get("tasks", "").splitlines():
            line = line.strip()
            if line.startswith("- "):
                text, mins = parse_minutes(line[2:])
                tasks.append({"html": md_inline(text), "mins": mins})
        task_m = sum(t["mins"] for t in tasks)
        total = int(round(d["hours"] * 60))
        rem = total - task_m
        if rem < 25:
            print(f"  ! {meta['slug']} day {d['n']}: tasks {task_m} min leave only {rem} min for lesson", file=sys.stderr)
            rem = max(rem, 25)
        read = int(round(rem * 0.6 / 5) * 5)
        demo = rem - read
        d.update({
            "goal": r.get("goal", "").strip(),
            "lesson": post(md(r.get("lesson", "")), figs),
            "demo": post(md(r.get("demo", "")), figs) if r.get("demo") else "",
            "tasks": tasks,
            "deliverable": md(r.get("deliverable", "")) if r.get("deliverable") else "",
            "tip": md(r.get("tip", "")) if r.get("tip") else "",
            "split": {"read": read, "demo": demo, "tasks": task_m},
        })
        if not d["short"]:
            d["short"] = d["title"]
        out_days.append(d)
    meta["days"] = out_days
    meta["modules"] = modules
    meta["totalHours"] = sum(d["hours"] for d in out_days)
    meta["figures"] = figs.count
    return meta


# ---------------------------------------------------------------- page shell

def head(title, desc, path, aura="drop", extra=""):
    url = SITE + path
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="SchoolAura">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0d0c0b">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/bodoni-moda.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/schibsted-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="/assets/css/site.css">
<script>try{{var t=localStorage.getItem("sa.theme");if(t)document.documentElement.setAttribute("data-theme",t)}}catch(e){{}}</script>
{extra}
</head>
<body data-aura="{aura}">
<a href="#main" class="sr-skip" style="position:absolute;left:-9999px">Skip to content</a>
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="SchoolAura home">School<i>Aura</i><span class="dot"></span></a>
    <nav class="nav" id="site-nav" aria-label="Main">
      <a href="/#catalogue">Catalogue</a>
      <a href="/courses/dropshipping/"{' aria-current="page"' if path.startswith('/courses/dropshipping') else ''}>Dropshipping</a>
      <a href="/courses/ai-mastery/"{' aria-current="page"' if path.startswith('/courses/ai-mastery') else ''}>AI Mastery</a>
      <a href="/recipe-vault/"{' aria-current="page"' if path.startswith('/recipe-vault') else ''}>Recipe Vault</a>
      <a href="/templates/"{' aria-current="page"' if path.startswith('/templates') or path.startswith('/courses/website') else ''}>Templates</a>
    </nav>
    <div class="head-actions">
      <button class="icon-btn" type="button" data-theme-toggle aria-label="Switch to light mode"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></button>
      <button class="icon-btn menu-btn" type="button" data-menu aria-controls="site-nav" aria-expanded="false" aria-label="Menu"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div>
</header>
<main id="main">
"""


def foot(extra_js=""):
    return f"""</main>
<footer class="site-foot">
  <div class="wrap">
    <div>
      <p class="big">School<i style="color:var(--aura)">Aura</i></p>
      <p style="margin-top:12px;max-width:34ch">A small school for useful skills. Self-paced, plain English, one day at a time.</p>
    </div>
    <div><h5>Programs</h5><ul><li><a href="/courses/dropshipping/">Dropshipping</a></li><li><a href="/courses/ai-mastery/">AI Mastery</a></li><li><a href="/recipe-vault/">Recipe Vault</a></li><li><a href="/templates/">Website templates</a></li></ul></div>
    <div><h5>Learn</h5><ul><li><a href="/#how">How a day works</a></li><li><a href="/courses/website-builders/">Website builder guide</a></li><li><a href="/#faq">Questions</a></li></ul></div>
    <div><h5>Membership</h5><ul><li><a href="/#membership">Opening soon</a></li></ul></div>
    <div class="legal"><span>© <span data-year>2026</span> SchoolAura. All rights reserved.</span><span>London, Ontario, Canada</span></div>
  </div>
</footer>
<script src="/assets/js/site.js"></script>
{extra_js}
</body>
</html>
"""


def fmt_h(h):
    return f"{h:g}"


# ---------------------------------------------------------------- course page

def course_page(c):
    days_n = len(c["days"])
    H = c["totalHours"]
    at3, at4 = math.ceil(H / 3), math.ceil(H / 4)
    learn = "".join(f"<li>{md_inline(x)}</li>" for x in c["learn"])
    mods = []
    for m in c["modules"]:
        mh = sum(d["hours"] for d in c["days"] if d["n"] in m["days"])
        items = "".join(
            f'<li><a href="#day-{d["n"]}"><span class="dn">DAY {d["n"]:02d}</span><span>{html.escape(d["title"])}</span><span class="dh">{fmt_h(d["hours"])} H</span></a></li>'
            for d in c["days"] if d["n"] in m["days"])
        rng = f"Days {m['days'][0]}–{m['days'][-1]}" if len(m["days"]) > 1 else f"Day {m['days'][0]}"
        mods.append(f'<details class="module"{" open" if m["n"] == 1 else ""}><summary><span class="mn">MODULE {m["n"]:02d}</span><span class="mt">{html.escape(m["title"])}</span><span class="mh">{rng} · {fmt_h(mh)} H</span></summary><p class="msum">{html.escape(m["summary"])}</p><ol>{items}</ol></details>')
    who = "".join(f"<li>{md_inline(x)}</li>" for x in c["forWho"])
    need = "".join(f"<li>{md_inline(x)}</li>" for x in c["need"])

    data = {k: c[k] for k in ("slug", "code", "title")}
    data["days"] = c["days"]
    data["modules"] = c["modules"]
    data_js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")

    extra_top = c.get("extraOverview", "")

    body = f"""
<section class="c-hero">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">SchoolAura</a><span>/</span><a href="/#catalogue">Catalogue</a><span>/</span><span style="color:var(--aura)">{c['code']}</span></nav>
    <h1 class="display reveal">{c['titleHtml']}</h1>
    <p class="lede reveal d1">{c['lede']}</p>
    <div class="stats reveal d2">
      <div><b>{days_n}</b><span>daily lessons</span></div>
      <div><b>≈{fmt_h(H)} h</b><span>guided work</span></div>
      <div><b>{at3} days</b><span>at 3 hours a day</span></div>
      <div><b>{at4} days</b><span>at 4 hours a day</span></div>
    </div>
    <nav class="tabs" aria-label="Course sections">
      <a href="#overview" data-view="overview" aria-current="true">Overview</a>
      <a href="#plan" data-view="plan" aria-current="false">Plan &amp; calendar</a>
      <a href="#day-1" data-view="day" aria-current="false">Lessons</a>
    </nav>
  </div>
</section>

<div class="wrap">
  <section class="view" id="v-overview">
    <div class="ov-grid">
      <div>
        {extra_top}
        <div class="ov-block">
          <p class="eyebrow">What you'll be able to do</p>
          <h2 style="margin-top:12px">{html.escape(c['outcome'])}</h2>
          <ul class="learn-list">{learn}</ul>
        </div>
        <div class="ov-block">
          <p class="eyebrow">Curriculum</p>
          <h2 style="margin-top:12px">{len(c['modules'])} modules, {days_n} days</h2>
          <div class="modules">{''.join(mods)}</div>
        </div>
        <div class="ov-block" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:40px">
          <div><p class="eyebrow">Who it's for</p><div class="prose" style="margin-top:14px"><ul>{who}</ul></div></div>
          <div><p class="eyebrow">What you'll need</p><div class="prose" style="margin-top:14px"><ul>{need}</ul></div></div>
        </div>
      </div>
      <aside>
        <div class="side-card">
          <p class="eyebrow">{c['code']}</p>
          <h3 style="margin-top:8px">{html.escape(c['title'])}</h3>
          <dl>
            <div><dt>Daily lessons</dt><dd>{days_n}</dd></div>
            <div><dt>Guided hours</dt><dd>≈ {fmt_h(H)} h</dd></div>
            <div><dt>Average day</dt><dd>{H / days_n:.1f} h</dd></div>
            <div><dt>At 3 h a day</dt><dd>{at3} days</dd></div>
            <div><dt>At 4 h a day</dt><dd>{at4} days</dd></div>
            <div><dt>Level</dt><dd>{c['level']}</dd></div>
            <div><dt>Your progress</dt><dd id="ov-progress">0 of {days_n} days</dd></div>
          </dl>
          <a class="btn aura" id="ov-continue" href="#day-1">Start Day 1 <span class="arr">→</span></a>
          <a class="btn ghost" href="#plan" style="margin-top:10px">Set your start date</a>
        </div>
      </aside>
    </div>
  </section>

  <section class="view" id="v-plan" hidden>
    <div class="plan-grid">
      <form class="form-card" id="plan-form" onsubmit="return false">
        <div><p class="eyebrow">Your schedule</p><h3 style="margin-top:8px">Plan it around your week</h3></div>
        <div class="field"><label for="plan-start">Start date</label><input type="date" id="plan-start" name="start"></div>
        <div class="field"><span class="lbl" id="study-lbl">Study days</span>
          <div class="seg" role="radiogroup" aria-labelledby="study-lbl">
            <input type="radio" name="study" id="sd-all" value="all"><label for="sd-all">Every day</label>
            <input type="radio" name="study" id="sd-ms" value="mon-sat"><label for="sd-ms">Mon–Sat</label>
            <input type="radio" name="study" id="sd-wd" value="weekdays"><label for="sd-wd">Mon–Fri</label>
          </div>
        </div>
        <div class="field"><span class="lbl" id="pace-lbl">Pace</span>
          <div class="seg" role="radiogroup" aria-labelledby="pace-lbl">
            <input type="radio" name="pace" id="pc-1" value="1"><label for="pc-1">1 lesson a day</label>
            <input type="radio" name="pace" id="pc-2" value="2"><label for="pc-2">1 lesson / 2 days</label>
          </div>
        </div>
        <div class="summary-box">
          <div><span>Finish date</span><b id="sum-finish">—</b></div>
          <div><span>Length</span><b id="sum-span">—</b></div>
          <div><span>Daily load</span><b id="sum-daily">—</b></div>
          <div class="progress-line" style="display:grid"><div style="display:flex;justify-content:space-between"><span>Progress</span><b id="sum-progress">—</b></div><div class="bar"><i id="sum-bar" style="width:0%"></i></div></div>
        </div>
        <p class="muted" style="font-size:.82rem">Progress is saved in this browser. <button type="button" class="textlink" data-reset style="background:none;border:0;padding:0;font:inherit;cursor:pointer">Reset progress</button></p>
      </form>
      <div>
        <div class="callout-row" id="today-card" style="display:block"></div>
        <div class="cal" style="margin-top:24px">
          <div class="cal-head"><h3 id="cal-title">—</h3>
            <div class="cal-nav"><button class="icon-btn" type="button" data-cal="prev" aria-label="Previous month">←</button><button class="btn ghost sm" type="button" data-cal="today">Today</button><button class="icon-btn" type="button" data-cal="next" aria-label="Next month">→</button></div>
          </div>
          <div class="cal-grid" id="cal-grid"></div>
          <div class="cal-legend"><span><i style="background:color-mix(in srgb,var(--aura) 40%,transparent)"></i>Scheduled</span><span><i style="background:color-mix(in srgb,var(--ok) 50%,transparent)"></i>Done</span><span><i style="background:color-mix(in srgb,var(--late) 50%,transparent)"></i>Behind</span></div>
        </div>
        <div class="agenda"><h3>Coming up</h3><ol id="agenda-list"></ol></div>
      </div>
    </div>
  </section>

  <section class="view" id="v-day" hidden>
    <div class="reader">
      <aside class="toc" id="toc" aria-label="All lessons"></aside>
      <div style="min-width:0">
        <div class="field toc-select" style="margin-bottom:28px"><label for="toc-jump">Jump to a day</label><select id="toc-jump"></select></div>
        <article id="day-body"></article>
      </div>
    </div>
  </section>
</div>
"""
    page = head(f"{c['title']} · {c['code']} · SchoolAura", c["metaDescription"], f"/courses/{c['slug']}/", c["aura"])
    page += body
    page += foot(f'<script>window.COURSE = {data_js};</script>\n<script src="/assets/js/course.js"></script>')
    return page


# ---------------------------------------------------------------- home + other pages

def home_page(courses, tpl_count):
    by = {c["slug"]: c for c in courses}
    drop, ai, web = by["dropshipping"], by["ai-mastery"], by["website-builders"]
    total_days = sum(len(c["days"]) for c in courses)
    total_hours = sum(c["totalHours"] for c in courses)
    hd = next(d for d in drop["days"] if d["n"] == 8)
    tasks = []
    for i, t in enumerate(hd["tasks"][:4]):
        on = i < 2
        text = re.sub(r"<[^>]+>", "", t["html"])
        if len(text) > 62:
            text = text[:60].rsplit(" ", 1)[0] + "…"
        tasks.append(f'<li class="{"on" if on else ""}"><span class="box">{"✓" if on else ""}</span><span class="t">{html.escape(text)}</span><span class="m">{t["mins"]}m</span></li>')
    rows = []
    for c, sw in ((drop, "var(--a-drop)"), (ai, "var(--a-ai)"), (web, "var(--a-web)")):
        H = c["totalHours"]
        rows.append(f'<tr><td><span class="sw" style="background:{sw}"></span><a href="/courses/{c["slug"]}/">{html.escape(c["title"])}</a></td><td class="big">{len(c["days"])}</td><td class="big">{fmt_h(H)} h</td><td>{math.ceil(H/3)} days</td><td>{math.ceil(H/4)} days</td></tr>')
    rows.append('<tr><td><span class="sw" style="background:var(--a-vault)"></span><a href="/recipe-vault/">Recipe Vault</a></td><td class="big">4</td><td colspan="3" class="muted">Downloadable books. Read and cook at your own pace.</td></tr>')
    faq_hours = (f"Dropshipping is {len(drop['days'])} daily lessons, about {fmt_h(drop['totalHours'])} hours in total: roughly {math.ceil(drop['totalHours']/4)} days at 4 hours a day or {math.ceil(drop['totalHours']/3)} days at 3 hours a day. "
                 f"AI Mastery is {len(ai['days'])} lessons, about {fmt_h(ai['totalHours'])} hours ({math.ceil(ai['totalHours']/4)}–{math.ceil(ai['totalHours']/3)} days). "
                 f"The Website Builders guide is {len(web['days'])} lessons, about {fmt_h(web['totalHours'])} hours.")
    frag = (CONTENT / "pages" / "home.html").read_text()
    rep = {
        "TOTAL_DAYS": str(total_days), "TOTAL_HOURS": fmt_h(total_hours),
        "HERO_DAY_N": f"{hd['n']:02d}", "HERO_DAY_H": fmt_h(hd["hours"]), "HERO_DAY_TITLE": html.escape(hd["title"]),
        "S1": "05", "S2": "06", "S3": "07", "S4": "08", "S5": "09", "S6": "10",
        "HERO_TASKS": "\n".join(tasks), "HERO_PCT": str(round(7 / 30 * 100)),
        "DROP_HOURS": fmt_h(drop["totalHours"]), "AI_HOURS": fmt_h(ai["totalHours"]),
        "TPL_COUNT": str(tpl_count), "HOURS_ROWS": "".join(rows), "FAQ_HOURS": faq_hours,
    }
    for k, v in rep.items():
        frag = frag.replace("{{" + k + "}}", v)
    page = head("SchoolAura · Learn one skill properly, one day at a time",
                "Self-paced programs in dropshipping, AI and web design, plus the Recipe Vault. Day-by-day lessons, real tasks and a calendar that keeps you on track.",
                "/", "drop")
    return page + frag + foot()


def simple_page(fragment_name, title, desc, path, aura, js="", replacements=None):
    frag = (CONTENT / "pages" / fragment_name).read_text()
    for k, v in (replacements or {}).items():
        frag = frag.replace("{{" + k + "}}", v)
    return head(title, desc, path, aura) + frag + foot(js)


def main():
    courses = []
    for f in COURSE_FILES:
        p = CONTENT / f
        if not p.exists():
            print(f"  skip {f} (not written yet)")
            continue
        c = parse_course(p)
        courses.append(c)
        out = PUBLIC / "courses" / c["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(course_page(c))
        print(f"  {c['slug']}: {len(c['days'])} days, {c['totalHours']:g} h, {c['figures']} figures")

    tpl_manifest = ROOT / "templates-src" / "manifest.json"
    tpls = json.loads(tpl_manifest.read_text()) if tpl_manifest.exists() else []

    if len(courses) == 3:
        (PUBLIC / "index.html").write_text(home_page(courses, len(tpls)))
        print("  home")

    if (CONTENT / "pages" / "vault.html").exists():
        out = PUBLIC / "recipe-vault" / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        from pypdf import PdfReader
        rep = {}
        vdir = PUBLIC / "downloads" / "recipe-vault"
        total = 0
        for slug in ("cake-studio", "keto-kitchen", "know-your-food", "simple-quick", "recipe-vault-complete"):
            f = vdir / f"schoolaura-{slug}.pdf"
            n = len(PdfReader(f).pages) if f.exists() else 0
            key = "complete" if slug == "recipe-vault-complete" else slug
            rep[f"P_{key}"] = str(n)
            rep[f"S_{key}"] = f"{max(1, round(f.stat().st_size / 1024))} KB" if f.exists() else ""
            if key != "complete":
                total += n
        rep["TOTAL_PAGES"] = str(total)
        rep["TOTAL_RECIPES"] = str(sum(len(re.findall(r"^::: recipe", (ROOT / "vault-src" / m).read_text(), re.M)) for m in ("cake-studio.md", "keto-kitchen.md", "simple-quick.md")))
        out.write_text(simple_page("vault.html", "The Recipe Vault · FOD 110 · SchoolAura",
                                   "Four downloadable recipe books: Cake Studio, Keto Kitchen, Know Your Food and the Simple & Quick Food Plan. Instant PDF.",
                                   "/recipe-vault/", "vault", '<script src="/assets/js/vault.js"></script>', rep))
        print("  recipe vault")

    if (CONTENT / "pages" / "templates.html").exists() and tpls:
        cards = []
        for t in tpls:
            tags = "".join(f'<span class="chip">{html.escape(x)}</span>' for x in t["tags"])
            cards.append(f"""<article class="tpl">
  <a class="tpl-frame" href="/templates/{t['slug']}/" target="_blank" rel="noopener" aria-label="Open the {html.escape(t['name'])} live preview">
    <div class="chrome"><i></i><i></i><i></i><span>{t['slug']}.html</span></div>
    <div class="vp"><img src="/templates/previews/{t['slug']}.webp" alt="Screenshot of the {html.escape(t['name'])} template" loading="lazy" width="1440" height="900"></div>
  </a>
  <div class="tpl-info">
    <div><h3>{html.escape(t['name'])}</h3><p>{html.escape(t['desc'])}</p><div class="tags">{tags}</div></div>
    <div class="tpl-actions"><a class="btn ghost sm" href="/templates/{t['slug']}/" target="_blank" rel="noopener">Live preview</a><a class="btn sm" href="/downloads/templates/{t['slug']}.zip" download>Download</a></div>
  </div>
</article>""")
        out = PUBLIC / "templates" / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(simple_page("templates.html", "Website Templates · WEB 120 · SchoolAura",
                                   f"{len(tpls)} hand-built website templates in one bulk download, plus a 7-day guide to redesign, publish and sell websites.",
                                   "/templates/", "web", replacements={"TPL_CARDS": "\n".join(cards), "TPL_COUNT": str(len(tpls))}))
        print("  templates")

    if (CONTENT / "pages" / "404.html").exists():
        (PUBLIC / "404.html").write_text(simple_page("404.html", "Page not found · SchoolAura", "This page doesn't exist.", "/404", "ai"))


if __name__ == "__main__":
    main()
