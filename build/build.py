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
COURSE_FILES = ["dropshipping.md", "ai-mastery.md", "digital-marketing.md", "website-builders.md"]

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
    html_text = re.sub(r"<p>\{\{tool:([\w-]+)\}\}</p>", r'<div class="tool" data-tool="\1"></div>', html_text)
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
    qf = CONTENT / "quizzes" / f"{meta['slug']}.json"
    meta["quiz"] = json.loads(qf.read_text()) if qf.exists() else None
    if meta["quiz"]:
        for k, qs in meta["quiz"]["modules"].items():
            for q in qs:
                assert 0 <= q["a"] < len(q["o"]), (meta["slug"], q["q"])
                assert q.get("day") in next(m["days"] for m in modules if str(m["n"]) == k), (meta["slug"], q["q"])
    return meta




# ---------------------------------------------------------------- products shown as cards

PRODUCTS = [
    {"slug": "dropshipping", "href": "/courses/dropshipping/", "aura": "drop", "icon": "DS", "cat": "business",
     "title": "Dropshipping: Zero to First Sales",
     "desc": "Pick a niche, prove a product, build a Shopify store and run your first ads, one day at a time."},
    {"slug": "ai-mastery", "href": "/courses/ai-mastery/", "aura": "ai", "icon": "AI", "cat": "ai",
     "title": "AI Mastery",
     "desc": "Claude, ChatGPT, Runway, HeyGen, ElevenLabs, AI video, full-stack apps and MCP, explained simply."},
    {"slug": "digital-marketing", "href": "/courses/digital-marketing/", "aura": "mkt", "icon": "DM", "cat": "marketing business",
     "title": "Digital Marketing Agency",
     "desc": "SEO, web scraping, social media, ads, analytics and email, then start and run your own agency."},
    {"slug": "recipe-vault", "href": "/recipe-vault/", "aura": "vault", "icon": "RV", "cat": "food",
     "title": "The Recipe Vault",
     "desc": "Four printable books: Cake Studio, Keto Kitchen, Know Your Food and a 7-day food plan."},
    {"slug": "website-builders", "href": "/templates/", "aura": "web", "icon": "WB", "cat": "web business",
     "title": "Website Templates",
     "desc": "Six ready-made websites to rebrand and publish, plus a 7-day guide to selling redesigns."},
]
AURA = {"drop": "var(--c-drop)", "ai": "var(--c-ai)", "vault": "var(--c-vault)", "web": "var(--c-web)", "mkt": "var(--c-mkt)"}


def product_card(p, meta, progress=None):
    prog = ""
    if progress:
        prog = f'<div class="progress" data-progress="{p["slug"]}" data-total="{progress}"><div class="track"><i></i></div><span>0%</span></div>'
    meta_html = "".join(f'<span class="{"dot" if i else ""}">{m}</span>' for i, m in enumerate(meta))
    find = html.escape((p["title"] + " " + p["desc"] + " " + p["cat"]).lower())
    return f"""<a class="card" href="{p['href']}" data-find="{find}" data-cat="{p['cat']}">
  <div class="cover"><img src="/assets/img/covers/{p['slug']}.webp" alt="" width="1280" height="720" loading="lazy"></div>
  <div class="card-body">
    <div class="card-title"><span class="icon-sq" style="background:{AURA[p['aura']]}">{p['icon']}</span>{html.escape(p['title'])}</div>
    <p class="card-desc">{html.escape(p['desc'])}</p>
    {prog if progress else f'<div class="card-meta">{meta_html}</div>'}
  </div>
</a>"""


# ---------------------------------------------------------------- page shell

def head(title, desc, path, aura="drop"):
    url = SITE + path
    def cur(prefix):
        return ' aria-current="page"' if path.startswith(prefix) else ""
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
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/figtree.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body data-aura="{aura}">
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="SchoolAura home"><span class="mark" aria-hidden="true"></span>schoolaura</a>
    <nav class="nav" id="site-nav" aria-label="Main">
      <a href="/courses/"{cur('/courses/') if path == '/courses/' else ''}>Classroom</a>
      <a href="/courses/dropshipping/"{cur('/courses/dropshipping')}>Dropshipping</a>
      <a href="/courses/ai-mastery/"{cur('/courses/ai-mastery')}>AI Mastery</a>
      <a href="/courses/digital-marketing/"{cur('/courses/digital-marketing')}>Marketing</a>
      <a href="/recipe-vault/"{cur('/recipe-vault')}>Recipe Vault</a>
      <a href="/templates/"{cur('/templates')}{cur('/courses/website-builders')}>Templates</a>
    </nav>
    <div class="head-right">
      <a class="btn sm" href="/courses/">Start learning</a>
      <button class="menu-btn" type="button" data-menu aria-controls="site-nav" aria-expanded="false" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div>
</header>
<main id="main">
"""


SA_META_JS = ""


def foot(extra_js="", pre_js=""):
    return f"""</main>
<footer class="site-foot">
  <div class="wrap">
    <span>© <span data-year>2026</span> SchoolAura</span>
    <nav aria-label="Footer"><a href="/courses/">Classroom</a><a href="/recipe-vault/">Recipe Vault</a><a href="/templates/">Templates</a><a href="/#faq">FAQ</a></nav>
  </div>
</footer>
<script src="/assets/js/site.js"></script>
<script>document.querySelectorAll("[data-year]").forEach(function (e) {{ e.textContent = new Date().getFullYear(); }});</script>
<script>window.SA_META = {SA_META_JS};</script>
{pre_js}
<script src="/assets/js/engage.js"></script>
{extra_js}
</body>
</html>
"""


def fmt_h(h):
    return f"{h:g}"


# ---------------------------------------------------------------- course page

def course_page(c, cover_slug=None):
    days_n = len(c["days"])
    H = c["totalHours"]
    at3, at4 = math.ceil(H / 3), math.ceil(H / 4)
    learn = "".join(f"<li>{md_inline(x)}</li>" for x in c["learn"])
    mods = []
    for m in c["modules"]:
        mh = sum(d["hours"] for d in c["days"] if d["n"] in m["days"])
        items = "".join(f'<li><a href="#day-{d["n"]}"><span>Day {d["n"]}: {html.escape(d["title"])}</span><small>{fmt_h(d["hours"])} h</small></a></li>'
                        for d in c["days"] if d["n"] in m["days"])
        rng = f"{len(m['days'])} lessons" if len(m["days"]) > 1 else "1 lesson"
        mods.append(f'<details class="mod"{" open" if m["n"] == 1 else ""}><summary><span>Module {m["n"]}: {html.escape(m["title"])}</span><small>{rng} · {fmt_h(mh)} h</small></summary><p class="msum">{html.escape(m["summary"])}</p><ol>{items}</ol></details>')
    who = "".join(f"<li>{md_inline(x)}</li>" for x in c["forWho"])
    need = "".join(f"<li>{md_inline(x)}</li>" for x in c["need"])
    data = {"slug": c["slug"], "code": c["code"], "title": c["title"], "days": c["days"], "modules": c["modules"], "quiz": c.get("quiz"),
            "hours": c["totalHours"]}
    nq = len(c["quiz"]["modules"]) if c.get("quiz") else 0
    data_js = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
    cover = cover_slug or c["slug"]
    extra_top = c.get("extraOverview", "")
    icon = {"drop": "DS", "ai": "AI", "web": "WB", "mkt": "DM"}.get(c["aura"], "SA")
    body = f"""
<div class="course-head">
  <div class="wrap">
    <span class="icon-sq">{icon}</span>
    <div class="ch-text"><h1>{html.escape(c['title'])}</h1><p class="sub">{c['code']} · {days_n} lessons · about {fmt_h(H)} hours</p></div>
    <div id="me-chip" class="ch-chip"></div>
  </div>
  <div class="wrap">
    <nav class="tabs" aria-label="Course sections">
      <a href="#day-1" data-view="day" aria-current="false">Classroom</a>
      <a href="#plan" data-view="plan" aria-current="false">Calendar</a>
      {'<a href="#quizzes" data-view="quizzes" aria-current="false">Quizzes</a>' if nq else ''}
      <a href="#about" data-view="about" aria-current="true">About</a>
    </nav>
  </div>
</div>

<div class="wrap">
  <section class="view" id="v-about">
    <div class="two-col">
      <div class="panel panel-pad about">
        {extra_top}
        <div class="block">
          <h2>About this course</h2>
          <p class="muted" style="font-size:1.05rem">{c['lede']}</p>
        </div>
        <div class="block">
          <h2>What you'll be able to do</h2>
          <ul class="learn">{learn}</ul>
        </div>
        <div class="block">
          <h2>Curriculum</h2>
          <p class="muted" style="margin-bottom:14px">{len(c['modules'])} modules · {days_n} lessons · about {fmt_h(H)} hours. Each lesson is one day of about {H / days_n:.1f} hours.</p>
          <div class="mods">{''.join(mods)}</div>
        </div>
        <div class="block" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:24px">
          <div><h2>Who it's for</h2><ul class="bullets">{who}</ul></div>
          <div><h2>What you'll need</h2><ul class="bullets">{need}</ul></div>
        </div>
      </div>
      <aside class="panel side-card sticky">
        <div class="cover"><img src="/assets/img/covers/{cover}.webp" alt="" width="1280" height="720"></div>
        <div class="body">
          <h3>{html.escape(c['title'])}</h3>
          <div class="stat-row"><div><b>{days_n}</b><span>lessons</span></div><div><b>{fmt_h(H)} h</b><span>total</span></div><div><b>{at4}–{at3}</b><span>days</span></div></div>
          <div class="progress" data-course-progress><div class="track"><i></i></div><span>0%</span></div>
          <a class="btn block" id="continue" href="#day-1">Start course</a>
          <a class="btn light block" href="#plan">Set your start date</a>
          <dl class="kv">
            <div><dt>At 3 hours a day</dt><dd>{at3} days</dd></div>
            <div><dt>At 4 hours a day</dt><dd>{at4} days</dd></div>
            <div><dt>Level</dt><dd>{c['level']}</dd></div>
            <div><dt>Completed</dt><dd id="done-count">0 of {days_n}</dd></div>
            {f'<div><dt>Quizzes passed</dt><dd id="quiz-count">0 of {nq}</dd></div>' if nq else ''}
          </dl>
        </div>
      </aside>
    </div>
  </section>

  <section class="view" id="v-day" hidden>
    <div class="two-col left">
      <aside class="panel lesson-nav sticky">
        <div class="top">
          <h3>{html.escape(c['title'])}</h3>
          <div class="progress" data-course-progress><div class="track"><i></i></div><span>0%</span></div>
        </div>
        <div class="jump"><label for="jump" class="muted" style="font-size:.85rem;font-weight:700">Jump to a lesson</label><select id="jump"></select></div>
        <nav class="list" id="lesson-list" aria-label="Lessons"></nav>
      </aside>
      <article class="panel panel-pad" id="lesson"></article>
    </div>
  </section>

  <section class="view" id="v-quizzes" hidden>
    <div class="two-col">
      <div style="display:grid;gap:20px;min-width:0">
        <div class="panel panel-pad">
          <h2 class="vh">Module quizzes</h2>
          <p class="muted" style="margin-top:4px">One short quiz after each module. Pass with 80% or more. Retake as often as you like; questions and answers reshuffle every time.</p>
          <div class="quiz-cards" id="quiz-cards"></div>
        </div>
        <div class="panel panel-pad" id="final-card"></div>
        <div class="panel panel-pad" id="cert-card"></div>
      </div>
      <aside class="panel panel-pad sticky" id="quiz-side"></aside>
    </div>
  </section>

  <section class="view" id="v-quiz" hidden>
    <div class="quiz-wrap">
      <p class="crumb"><a class="link" href="#quizzes">← All quizzes</a></p>
      <div class="panel panel-pad" id="quiz-root"></div>
    </div>
  </section>

  <section class="view" id="v-plan" hidden>
    <div class="two-col">
      <div style="display:grid;gap:20px;min-width:0">
        <div class="panel panel-pad today-card" id="today-card"></div>
        <div class="panel">
          <div class="cal-head"><h3 id="cal-title">Calendar</h3>
            <div class="cal-nav"><button class="icon-btn" type="button" data-cal="prev" aria-label="Previous month">‹</button><button class="btn light sm" type="button" data-cal="today">Today</button><button class="icon-btn" type="button" data-cal="next" aria-label="Next month">›</button></div>
          </div>
          <div class="cal-grid" id="cal-grid"></div>
          <div class="cal-legend"><span><i style="background:var(--aura)"></i>Scheduled</span><span><i style="background:var(--ok)"></i>Done</span><span><i style="background:var(--late)"></i>Behind</span></div>
        </div>
        <div class="panel"><div class="cal-head"><h3>Coming up</h3></div><ol class="agenda" id="agenda"></ol></div>
      </div>
      <aside class="panel panel-pad sticky">
        <form class="form-grid" id="plan-form" onsubmit="return false">
          <div><h3 style="font-size:1.1rem">Your schedule</h3><p class="muted" style="font-size:.9rem;margin-top:4px">Change anything and the calendar updates.</p></div>
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
              <input type="radio" name="pace" id="pc-2" value="2"><label for="pc-2">1 every 2 days</label>
            </div>
          </div>
          <dl class="kv">
            <div><dt>Finish date</dt><dd id="sum-finish">—</dd></div>
            <div><dt>Length</dt><dd id="sum-span">—</dd></div>
            <div><dt>Per study day</dt><dd id="sum-daily">—</dd></div>
          </dl>
          <div class="progress" data-course-progress><div class="track"><i></i></div><span>0%</span></div>
          <p class="muted" style="font-size:.85rem">Progress is saved on this device. <button type="button" class="link" data-reset style="background:none;border:0;padding:0;font:inherit;cursor:pointer">Reset progress</button></p>
        </form>
      </aside>
    </div>
  </section>
</div>
"""
    page = head(f"{c['title']} · SchoolAura", c["metaDescription"], f"/courses/{c['slug']}/", c["aura"])
    return page + body + foot(f'<script>window.COURSE = {data_js};</script>\n<script src="/assets/js/quiz.js"></script>\n<script src="/assets/js/tools.js"></script>\n<script src="/assets/js/course.js"></script>')


# ---------------------------------------------------------------- pages

def vault_numbers():
    from pypdf import PdfReader
    rep, total = {}, 0
    vdir = PUBLIC / "downloads" / "recipe-vault"
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
    return rep


def cards_html(courses, tpl_count, vault, with_progress=False):
    by = {c["slug"]: c for c in courses}
    out = []
    for p in PRODUCTS:
        if p["slug"] in by:
            c = by[p["slug"]]
            meta = [f"{len(c['days'])} lessons", f"{fmt_h(c['totalHours'])} hours", "<b>Free in early access</b>"]
            out.append(product_card(p, meta, len(c["days"]) if with_progress else None))
        elif p["slug"] == "recipe-vault":
            out.append(product_card(p, ["4 PDF books", f"{vault['TOTAL_PAGES']} pages", "<b>Instant download</b>"]))
        else:
            web = by.get("website-builders")
            out.append(product_card(p, [f"{tpl_count} templates", f"{len(web['days'])}-lesson guide" if web else "guide", "<b>Bulk ZIP</b>"]))
    return "\n".join(out)


def home_page(courses, tpl_count, vault):
    by = {c["slug"]: c for c in courses}
    drop, ai, web, mkt = by["dropshipping"], by["ai-mastery"], by["website-builders"], by["digital-marketing"]
    rows = []
    for c, sw in ((drop, "var(--c-drop)"), (ai, "var(--c-ai)"), (mkt, "var(--c-mkt)"), (web, "var(--c-web)")):
        H = c["totalHours"]
        rows.append(f'<tr><td><span class="swatch" style="background:{sw}"></span><a class="link" href="/courses/{c["slug"]}/">{html.escape(c["title"])}</a></td><td>{len(c["days"])}</td><td>{fmt_h(H)} h</td><td>{math.ceil(H/3)} days</td><td>{math.ceil(H/4)} days</td></tr>')
    faq_hours = (f"Dropshipping is {len(drop['days'])} lessons, about {fmt_h(drop['totalHours'])} hours: {math.ceil(drop['totalHours']/4)} days at 4 hours a day or {math.ceil(drop['totalHours']/3)} days at 3 hours a day. "
                 f"AI Mastery is {len(ai['days'])} lessons, about {fmt_h(ai['totalHours'])} hours ({math.ceil(ai['totalHours']/4)}–{math.ceil(ai['totalHours']/3)} days). "
                 f"Digital Marketing Agency is {len(mkt['days'])} lessons, about {fmt_h(mkt['totalHours'])} hours ({math.ceil(mkt['totalHours']/4)}–{math.ceil(mkt['totalHours']/3)} days). "
                 f"The website guide is {len(web['days'])} lessons, about {fmt_h(web['totalHours'])} hours.")
    frag = (CONTENT / "pages" / "home.html").read_text()
    for k, v in {"CARDS": cards_html(courses, tpl_count, vault), "HOURS_ROWS": "".join(rows), "FAQ_HOURS": faq_hours}.items():
        frag = frag.replace("{{" + k + "}}", v)
    page = head("SchoolAura · Learn a skill you can use, one day at a time",
                "Step-by-step courses in dropshipping, AI and web design, plus the Recipe Vault. Daily lessons, real tasks and a calendar that keeps you on track.", "/", "drop")
    return page + frag + foot()


def daily_pool(courses):
    pool = []
    for c in courses:
        if not c.get("quiz"):
            continue
        for qs in c["quiz"]["modules"].values():
            for q in qs:
                pool.append({"q": q["q"], "o": q["o"], "a": q["a"], "why": q["why"], "course": c["title"],
                             "href": f"/courses/{c['slug']}/#day-{q['day']}"})
    vq = json.loads((CONTENT / "quizzes" / "recipe-vault.json").read_text())
    for q in vq["questions"]:
        pool.append({"q": q["q"], "o": q["o"], "a": q["a"], "why": q["why"], "course": "Recipe Vault", "href": "/recipe-vault/#kitchen-quiz"})
    return pool


def js_json(v):
    return json.dumps(v, ensure_ascii=False).replace("</", "<\\/")


def simple_page(fragment_name, title, desc, path, aura, js="", replacements=None, pre_js=""):
    frag = (CONTENT / "pages" / fragment_name).read_text()
    for k, v in (replacements or {}).items():
        frag = frag.replace("{{" + k + "}}", v)
    return head(title, desc, path, aura) + frag + foot(js, pre_js)


def main():
    global SA_META_JS
    courses = [parse_course(CONTENT / f) for f in COURSE_FILES]
    SA_META_JS = js_json({c["slug"]: {"title": c["title"], "href": f"/courses/{c['slug']}/", "days": len(c["days"]),
                                      "modules": [m["days"] for m in c["modules"]]} for c in courses})
    for c in courses:
        out = PUBLIC / "courses" / c["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(course_page(c))
        nq = sum(len(v) for v in c["quiz"]["modules"].values()) if c.get("quiz") else 0
        print(f"  {c['slug']}: {len(c['days'])} days, {c['totalHours']:g} h, {c['figures']} figures, {nq} quiz questions")

    tpls = json.loads((ROOT / "templates-src" / "manifest.json").read_text())
    vault = vault_numbers()

    (PUBLIC / "index.html").write_text(home_page(courses, len(tpls), vault))
    (PUBLIC / "courses" / "index.html").write_text(simple_page(
        "classroom.html", "Classroom · SchoolAura", "All SchoolAura courses and your progress.", "/courses/", "drop",
        replacements={"CARDS": cards_html(courses, len(tpls), vault, with_progress=True)},
        pre_js=f"<script>window.SA_DAILY = {js_json(daily_pool(courses))};</script>"))
    (PUBLIC / "recipe-vault").mkdir(exist_ok=True)
    (PUBLIC / "recipe-vault" / "index.html").write_text(simple_page(
        "vault.html", "The Recipe Vault · SchoolAura",
        "Four downloadable recipe books: Cake Studio, Keto Kitchen, Know Your Food and the Simple & Quick Food Plan. Instant PDF.",
        "/recipe-vault/", "vault",
        f'<script>window.VAULT_QUIZ = {js_json(json.loads((CONTENT / "quizzes" / "recipe-vault.json").read_text()))};</script>\n'
        '<script src="/assets/js/quiz.js"></script>\n<script src="/assets/js/tools.js"></script>\n<script src="/assets/js/vault.js"></script>', vault))

    cards = []
    for t in tpls:
        tags = "".join(f'<span class="tag">{html.escape(x)}</span>' for x in t["tags"])
        cards.append(f"""<article class="card">
  <a class="cover" href="/templates/{t['slug']}/" target="_blank" rel="noopener" aria-label="Open the {html.escape(t['name'])} live preview"><img src="/templates/previews/{t['slug']}.webp" alt="Screenshot of the {html.escape(t['name'])} template" loading="lazy" width="1200" height="750"></a>
  <div class="card-body">
    <div class="card-title">{html.escape(t['name'])}</div>
    <p class="card-desc">{html.escape(t['desc'])}</p>
    <div class="tags">{tags}</div>
    <div class="btn-row"><a class="btn light sm" href="/templates/{t['slug']}/" target="_blank" rel="noopener">Live preview</a><a class="btn sm" href="/downloads/templates/{t['slug']}.zip" download>Download</a></div>
  </div>
</article>""")
    (PUBLIC / "templates").mkdir(exist_ok=True)
    (PUBLIC / "templates" / "index.html").write_text(simple_page(
        "templates.html", "Website Templates · SchoolAura",
        f"{len(tpls)} ready-made website templates in one bulk download, plus a 7-day guide to redesign, publish and sell websites.",
        "/templates/", "web", replacements={"TPL_CARDS": "\n".join(cards), "TPL_COUNT": str(len(tpls))}))
    (PUBLIC / "404.html").write_text(simple_page("404.html", "Page not found · SchoolAura", "This page doesn't exist.", "/404", "drop"))
    print("  home, classroom, recipe vault, templates, 404")


if __name__ == "__main__":
    main()
