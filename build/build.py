#!/usr/bin/env python3
"""Class a Day static site builder.

Reads course sources from content/*.md (JSON front matter + day blocks), figures from
content/figures/*.svg and page fragments from content/pages/*.html, and writes the
finished static site into public/.

Run:  python3 build/build.py
"""
import json, re, math, html, os, sys, hashlib, subprocess, datetime, urllib.parse, shutil
from pathlib import Path
import markdown

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"
PUBLIC = ROOT / "public"
SITE = "https://classaday.com"
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
     "desc": "Claude, ChatGPT, Cursor, Runway, HeyGen, ElevenLabs, AI video, full-stack apps and MCP, explained simply."},
    {"slug": "viral-prompts", "href": "/prompts/", "aura": "vp", "icon": "VP", "cat": "ai marketing",
     "title": "Viral Prompts",
     "desc": "Copy-ready prompts for the AI photo and video trends people are sharing right now. New packs as trends appear."},
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
AURA = {"drop": "var(--c-drop)", "ai": "var(--c-ai)", "vault": "var(--c-vault)", "web": "var(--c-web)", "mkt": "var(--c-mkt)", "vp": "var(--c-vp)"}
ICON = {"drop": "DS", "ai": "AI", "web": "WB", "mkt": "DM", "vp": "VP"}

# Membership pricing (shown on /join/ and the home page). Prices are in CAD and exclude sales tax.
# "half" is what visitors from lower-income countries pay (the country list is in lib/pricing.js).
# Stripe prices are created automatically from these numbers on the first checkout.
PRICING = {"currency": "CAD", "monthly": 9, "lifetime": 19, "guarantee_days": 30,
           "half": {"monthly": 5, "lifetime": 10}}

# Membership switches.
#   accounts: show "Log in" / "Account" and save progress to the member's account (needs Supabase email set up).
#   live:     lock members-only content and sell memberships through Stripe (needs accounts and the Stripe keys).
# While live is False the site is in early access: everything is free and the buttons say "Start free now".
# Free for everyone when live: these lesson days of every course, and the newest N Viral Prompts packs.
MEMBERSHIP = {"accounts": False, "live": False, "free_days": [1], "free_prompts": 3}
# For test builds only: SA_ACCOUNTS=1 / SA_LIVE=1 python3 build/build.py (live also switches accounts on).
if os.environ.get("SA_ACCOUNTS") in ("0", "1"):
    MEMBERSHIP["accounts"] = os.environ["SA_ACCOUNTS"] == "1"
if os.environ.get("SA_LIVE") in ("0", "1"):
    MEMBERSHIP["live"] = os.environ["SA_LIVE"] == "1"
    MEMBERSHIP["accounts"] = MEMBERSHIP["accounts"] or MEMBERSHIP["live"]
SUPABASE = {"url": "https://mxezkygvkvekhirheblb.supabase.co", "key": "sb_publishable_yGeteIMzk6eXJCcrcEYRXw_JuRRBXyq"}
SUPPORT_EMAIL = "support@classaday.com"
assert MEMBERSHIP["accounts"] or not MEMBERSHIP["live"], "live membership needs accounts"


def live():
    return MEMBERSHIP["live"]


def accounts():
    return MEMBERSHIP["accounts"]


def free_day(n):
    return not live() or n in MEMBERSHIP["free_days"]


def money(n):
    return f"${n:g}"


# Search-friendly page titles for the course pages (the visible course name stays the same).
SEO_TITLES = {
    "dropshipping": "Dropshipping Course: Shopify Store to First Sales in 30 Days",
    "ai-mastery": "AI Course: Claude, ChatGPT, Cursor, Runway and HeyGen in 24 Days",
    "digital-marketing": "Digital Marketing Course: SEO, Social Media, Ads and Your Own Agency",
    "website-builders": "Website Templates Guide: Rebrand, Publish and Sell Websites in 7 Days",
}
ORG = {"@type": "Organization", "name": "Class a Day", "url": SITE + "/"}
KIND_LABEL = {"image": "Image", "video": "Video", "text": "Text", "voice": "Voice"}


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", " ", s or "")).replace("\xa0", " ")


def squash(s):
    return re.sub(r"\s+", " ", s).strip()


def iso_dur(hours):
    h = int(hours); m = int(round((hours - h) * 60))
    return f"PT{h}H" + (f"{m}M" if m else "")


def git_date(*paths):
    """Last commit date (YYYY-MM-DD) of the given source files, for sitemap lastmod."""
    try:
        out = subprocess.run(["git", "-C", str(ROOT), "log", "-1", "--format=%cs", "--", *[str(p) for p in paths]],
                             capture_output=True, text=True, timeout=10).stdout.strip()
        return out or datetime.date.today().isoformat()
    except Exception:
        return datetime.date.today().isoformat()


def short_hash(text):
    return hashlib.md5(text.encode()).hexdigest()[:8]


def product_card(p, meta, progress=None, badge=False):
    prog = ""
    if progress:
        prog = f'<div class="progress" data-progress="{p["slug"]}" data-total="{progress}"><div class="track"><i></i></div><span>0%</span></div>'
    meta_html = "".join(f'<span class="{"dot" if i else ""}">{m}</span>' for i, m in enumerate(meta))
    find = html.escape((p["title"] + " " + p["desc"] + " " + p["cat"]).lower())
    badge_html = '<span class="vp-badge" data-prompts-badge hidden></span>' if badge else ""
    return f"""<a class="card" href="{p['href']}" data-find="{find}" data-cat="{p['cat']}">
  <div class="cover"><img src="/assets/img/covers/{p['slug']}.webp" alt="" width="1280" height="720" loading="lazy"></div>
  <div class="card-body">
    <div class="card-title"><span class="icon-sq" style="background:{AURA[p['aura']]}">{p['icon']}</span>{html.escape(p['title'])}{badge_html}</div>
    <p class="card-desc">{html.escape(p['desc'])}</p>
    {prog if progress else f'<div class="card-meta">{meta_html}</div>'}
  </div>
</a>"""


# ---------------------------------------------------------------- page shell

SEARCH_ICON = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'


def head(title, desc, path, aura="drop", og_image=None, og_type="website", jsonld=None, noindex=False):
    url = SITE + path
    img = SITE + (og_image or "/assets/img/og.jpg")
    def cur(prefix):
        return ' aria-current="page"' if path.startswith(prefix) else ""
    ld = ""
    if jsonld:
        for block in jsonld:
            block = dict({"@context": "https://schema.org"}, **block)
            ld += '<script type="application/ld+json">' + json.dumps(block, ensure_ascii=False).replace("</", "<\\/") + "</script>\n"
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
{'<meta name="robots" content="noindex">' if noindex else f'<link rel="canonical" href="{url}">'}
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Class a Day">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{img}">
<meta property="og:locale" content="en_CA">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/assets/fonts/figtree.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/fonts.css">
<link rel="stylesheet" href="/assets/css/site.css">
{ld}</head>
<body data-aura="{aura}">
<header class="site-head">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Class a Day home"><span class="mark" aria-hidden="true"></span><span class="wm">class<span>a</span>day</span></a>
    <nav class="nav" id="site-nav" aria-label="Main">
      <a href="/courses/"{cur('/courses/') if path == '/courses/' else ''}>Classroom</a>
      <a href="/courses/dropshipping/"{cur('/courses/dropshipping')}>Dropshipping</a>
      <a href="/courses/ai-mastery/"{cur('/courses/ai-mastery')}>AI Mastery</a>
      <a href="/prompts/" data-nav-prompts{cur('/prompts')}>Prompts</a>
      <a href="/courses/digital-marketing/"{cur('/courses/digital-marketing')}>Marketing</a>
      <a href="/recipe-vault/"{cur('/recipe-vault')}>Recipe Vault</a>
      <a href="/templates/"{cur('/templates')}{cur('/courses/website-builders')}>Templates</a>
      {'<a class="nav-acct" href="/login/" data-auth-link>Log in</a>' if accounts() else ''}
      {'<a class="nav-acct" href="/join/" data-join-link>Join</a>' if live() else ''}
    </nav>
    <div class="head-right">
      <button class="search-btn" type="button" data-search-open aria-label="Search Class a Day">{SEARCH_ICON}<span>Search</span><kbd>/</kbd></button>
      {'<a class="head-link" href="/login/" data-auth-link>Log in</a>' if accounts() else ''}
      <a class="btn sm start-btn" href="/join/" data-join-link>Join</a>
      <button class="menu-btn" type="button" data-menu aria-controls="site-nav" aria-expanded="false" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
    </div>
  </div>
</header>
<main id="main">
"""


SA_META_JS = "{}"
SA_PROMPTS_JS = "{}"
ASSET_V = {}


def asset(path):
    """URL for a file in public/ with a content hash, so browsers pick up new versions straight away."""
    if path not in ASSET_V:
        f = PUBLIC / path.lstrip("/")
        ASSET_V[path] = short_hash(f.read_text()) if f.exists() else "0"
    return f"{path}?v={ASSET_V[path]}"


def client_config():
    """window.SA_CONFIG: public settings the browser scripts need (no secrets)."""
    return {"supabaseUrl": SUPABASE["url"], "supabaseKey": SUPABASE["key"], "accounts": accounts(), "live": live(),
            "freeDays": MEMBERSHIP["free_days"], "currency": PRICING["currency"], "supportEmail": SUPPORT_EMAIL,
            "supabaseJs": asset("/assets/js/vendor/supabase.js")}


def foot(extra_js="", pre_js=""):
    auth_js = f'<script src="{asset("/assets/js/auth.js")}"></script>\n' if accounts() else ""
    return f"""</main>
<footer class="site-foot">
  <div class="wrap">
    <span>© <span data-year>2026</span> Class a Day</span>
    <nav aria-label="Footer"><a href="/courses/">Classroom</a><a href="/join/">Pricing</a><a href="/prompts/">Viral Prompts</a><a href="/recipe-vault/">Recipe Vault</a><a href="/templates/">Templates</a><a href="/#faq">FAQ</a><a href="/terms/">Terms</a><a href="/privacy/">Privacy</a><a href="/refunds/">Refunds</a></nav>
  </div>
</footer>
<script>window.SA_META = {SA_META_JS}; window.SA_PROMPTS = {SA_PROMPTS_JS}; window.SA_CONFIG = {js_json(client_config())};</script>
<script src="/assets/js/site.js"></script>
{auth_js}<script>document.querySelectorAll("[data-year]").forEach(function (e) {{ e.textContent = new Date().getFullYear(); }});</script>
{pre_js}
<script src="/assets/js/engage.js"></script>
{extra_js}
</body>
</html>
"""


def fmt_h(h):
    return f"{h:g}"


def crumbs_ld(items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": name, "item": SITE + url} for i, (name, url) in enumerate(items)]}


# ---------------------------------------------------------------- course pages

def course_head(c, title_tag, tabs_current, base_href):
    days_n, H = len(c["days"]), c["totalHours"]
    nq = len(c["quiz"]["modules"]) if c.get("quiz") else 0
    def tab(view, href, label):
        return f'<a href="{href}" data-view="{view}" aria-current="{"true" if view == tabs_current else "false"}">{label}</a>'
    title = f'<{title_tag} class="ch-title">{html.escape(c["title"])}</{title_tag}>'
    if title_tag == "p":
        title = f'<p class="ch-title"><a href="{base_href}">{html.escape(c["title"])}</a></p>'
    return f"""
<div class="course-head">
  <div class="wrap">
    <span class="icon-sq">{ICON.get(c['aura'], 'CD')}</span>
    <div class="ch-text">{title}<p class="sub">{c['code']} · {days_n} lessons · about {fmt_h(H)} hours</p></div>
    <div id="me-chip" class="ch-chip"></div>
  </div>
  <div class="wrap">
    <nav class="tabs" aria-label="Course sections">
      {tab("day", base_href + "day-1/", "Classroom")}
      {tab("plan", base_href + "#plan", "Calendar")}
      {tab("quizzes", base_href + "#quizzes", "Quizzes") if nq else ""}
      {tab("about", base_href + "#about", "About")}
    </nav>
  </div>
</div>
"""


def course_page(c, data_src):
    slug, base = c["slug"], f"/courses/{c['slug']}/"
    days_n = len(c["days"])
    H = c["totalHours"]
    at3, at4 = math.ceil(H / 3), math.ceil(H / 4)
    learn = "".join(f"<li>{md_inline(x)}</li>" for x in c["learn"])
    mods = []
    for m in c["modules"]:
        mh = sum(d["hours"] for d in c["days"] if d["n"] in m["days"])
        items = "".join(f'<li><a href="{base}day-{d["n"]}/"><span>Day {d["n"]}: {html.escape(d["title"])}</span><small>{fmt_h(d["hours"])} h</small></a></li>'
                        for d in c["days"] if d["n"] in m["days"])
        rng = f"{len(m['days'])} lessons" if len(m["days"]) > 1 else "1 lesson"
        mods.append(f'<details class="mod"{" open" if m["n"] == 1 else ""}><summary><span>Module {m["n"]}: {html.escape(m["title"])}</span><small>{rng} · {fmt_h(mh)} h</small></summary><p class="msum">{html.escape(m["summary"])}</p><ol>{items}</ol></details>')
    who = "".join(f"<li>{md_inline(x)}</li>" for x in c["forWho"])
    need = "".join(f"<li>{md_inline(x)}</li>" for x in c["need"])
    nq = len(c["quiz"]["modules"]) if c.get("quiz") else 0
    extra_top = c.get("extraOverview", "")
    body = course_head(c, "h1", "about", base) + f"""
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
        <div class="cover"><img src="/assets/img/covers/{slug}.webp" alt="" width="1280" height="720"></div>
        <div class="body">
          <h3>{html.escape(c['title'])}</h3>
          <div class="stat-row"><div><b>{days_n}</b><span>lessons</span></div><div><b>{fmt_h(H)} h</b><span>total</span></div><div><b>{at4}–{at3}</b><span>days</span></div></div>
          <div class="progress" data-course-progress><div class="track"><i></i></div><span>0%</span></div>
          <a class="btn block" id="continue" href="{base}day-1/">Start course</a>
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
          <p class="muted" style="font-size:.85rem">{"Progress is saved on this device and to your account when you're logged in." if accounts() else "Progress is saved on this device."} <button type="button" class="link" data-reset style="background:none;border:0;padding:0;font:inherit;cursor:pointer">Reset progress</button></p>
        </form>
      </aside>
    </div>
  </section>
</div>
"""
    ld = [{"@type": "Course", "name": c["title"], "description": squash(strip_tags(c["lede"])), "url": SITE + base,
           "provider": ORG, "inLanguage": "en", "educationalLevel": c["level"], "timeRequired": iso_dur(H),
           "isAccessibleForFree": not live(),
           "teaches": [squash(strip_tags(md_inline(x))) for x in c["learn"]],
           "syllabusSections": [{"@type": "Syllabus", "name": m["title"], "description": m["summary"]} for m in c["modules"]],
           "hasCourseInstance": [{"@type": "CourseInstance", "courseMode": "Online",
                                  "courseWorkload": iso_dur(H / days_n)}],
           "offers": [{"@type": "Offer", "category": "Subscription", "price": PRICING["monthly"], "priceCurrency": PRICING["currency"],
                       "url": SITE + "/join/"}] if live() else
                     [{"@type": "Offer", "category": "Free", "price": 0, "priceCurrency": PRICING["currency"]}]},
          crumbs_ld([("Home", "/"), ("Classroom", "/courses/"), (c["title"], base)])]
    page = head(f"{SEO_TITLES.get(slug, c['title'])} · Class a Day", c["metaDescription"], base, c["aura"],
                og_image=f"/assets/img/og/{slug}.jpg", jsonld=ld)
    return page + body + foot(f'<script src="{data_src}"></script>\n<script src="/assets/js/quiz.js"></script>\n<script src="/assets/js/course.js"></script>')


def lesson_page(c, d, data_src):
    slug, n, base = c["slug"], d["n"], f"/courses/{c['slug']}/"
    m = next(m for m in c["modules"] if n in m["days"])
    days = c["days"]
    i = days.index(d)
    prev, nxt = (days[i - 1] if i else None), (days[i + 1] if i + 1 < len(days) else None)
    side = ""
    for mod in c["modules"]:
        side += f'<p class="mtitle">{html.escape(mod["title"])}</p>'
        for k in mod["days"]:
            dk = next(x for x in days if x["n"] == k)
            side += f'<a href="{base}day-{k}/" aria-current="{"true" if k == n else "false"}"><span class="ck"></span><span>Day {k}: {html.escape(dk["title"])}</span></a>'
    sp = d["split"]
    tot = sp["read"] + sp["demo"] + sp["tasks"]
    tasks = "".join(f'<li><label for="t-{n}-{j}"><input type="checkbox" id="t-{n}-{j}" data-k="{n}-{j}"><span class="tx">{t["html"]}</span>'
                    + (f'<span class="mins">{t["mins"]} min</span>' if t["mins"] else "<span></span>") + "</label></li>" for j, t in enumerate(d["tasks"]))
    pi = 0
    def part(icon, title, inner):
        return f'<section class="part"><h2 class="part-h"><span class="pi">{icon}</span>{title}</h2>{inner}</section>'
    parts = part(1, "Lesson", f'<div class="prose">{d["lesson"]}</div>')
    pi = 1
    if d["demo"]:
        pi += 1; parts += part(pi, "Worked example", f'<div class="demo-box"><div class="prose">{d["demo"]}</div></div>')
    pi += 1; parts += part(pi, "Today's tasks", f'<ul class="tasks">{tasks}</ul>')
    if d["deliverable"]:
        parts += part("✓", "By tonight you'll have", f'<div class="deliver"><div class="prose">{d["deliverable"]}</div></div>')
    if d["tip"]:
        parts += part("★", "Tip", f'<div class="prose">{d["tip"]}</div>')
    foot_nav = (f'<a class="btn light" href="{base}day-{prev["n"]}/">← Previous</a>' if prev else "<span></span>") + \
               (f'<a class="btn" href="{base}day-{nxt["n"]}/">Next lesson →</a>' if nxt else f'<a class="btn" href="{base}#quizzes">Final exam →</a>')
    lesson = f"""<div class="lesson-top"><div><p class="crumb">{html.escape(m['title'])} · Day {n} of {len(days)}</p><h1>{html.escape(d['title'])}</h1></div></div>
<div class="meta-chips"><span class="mchip">{fmt_h(d['hours'])} hours</span></div>
<p class="goal">{html.escape(d['goal'])}</p>
<div class="time-key"><span>Lesson {sp['read']} min</span><span>Example {sp['demo']} min</span><span>Tasks {sp['tasks']} min</span><span>≈ {tot / 60:.1f} h total</span></div>
{parts}
<div class="lesson-foot">{foot_nav}</div>"""
    body = course_head(c, "p", "day", base) + f"""
<div class="wrap">
  <section class="view" id="v-day">
    <div class="two-col left">
      <aside class="panel lesson-nav sticky">
        <div class="top">
          <p class="ln-title"><a href="{base}">{html.escape(c['title'])}</a></p>
          <div class="progress" data-course-progress><div class="track"><i></i></div><span>0%</span></div>
        </div>
        <div class="jump"><label for="jump" class="muted" style="font-size:.85rem;font-weight:700">Jump to a lesson</label><select id="jump"></select></div>
        <nav class="list" id="lesson-list" aria-label="Lessons">{side}</nav>
      </aside>
      <article class="panel panel-pad" id="lesson">{lesson}</article>
    </div>
  </section>
</div>
"""
    day_data = {k: d[k] for k in DAY_CONTENT_KEYS}
    return lesson_shell(c, d, body, data_src, f"window.SA_DAY = {n}; window.SA_DAY_DATA = {js_json(day_data)};")


# Lesson fields that only members get. They live in each lesson page (which the middleware locks),
# not in the public course-data.js.
DAY_CONTENT_KEYS = ["lesson", "demo", "tasks", "deliverable", "tip"]


def lesson_shell(c, d, body, data_src, inline_js):
    slug, n, base = c["slug"], d["n"], f"/courses/{c['slug']}/"
    url = f"{base}day-{n}/"
    title = f"{d['title']} · {c['title']} Day {n} · Class a Day"
    ld = [{"@type": "LearningResource", "name": d["title"], "description": d["goal"], "url": SITE + url,
           "learningResourceType": "Lesson", "educationalLevel": c["level"], "timeRequired": iso_dur(d["hours"]),
           "inLanguage": "en", "isAccessibleForFree": free_day(n), "publisher": ORG,
           "isPartOf": {"@type": "Course", "name": c["title"], "url": SITE + base, "provider": ORG}},
          crumbs_ld([("Home", "/"), ("Classroom", "/courses/"), (c["title"], base), (f"Day {n}", url)])]
    page = head(title, d["goal"], url, c["aura"], og_image=f"/assets/img/og/{slug}.jpg", og_type="article", jsonld=ld)
    return page + body + foot(f'<script>{inline_js}</script>\n<script src="{data_src}"></script>\n'
                              f'<script src="{asset("/assets/js/quiz.js")}"></script>\n<script src="{asset("/assets/js/tools.js")}"></script>\n'
                              f'<script src="{asset("/assets/js/course.js")}"></script>')


def first_paragraphs(html_text, words=90):
    """The opening paragraphs of a lesson, about `words` long, for the preview."""
    out, count = [], 0
    for m in re.finditer(r"<p>(.*?)</p>", html_text, re.S):
        out.append(m.group(0))
        count += len(strip_tags(m.group(1)).split())
        if count >= words or len(out) >= 4:
            break
    return "".join(out)


def lock_card(title, text, login_next, extra=""):
    nxt = urllib.parse.quote(login_next, safe="/")
    return f"""<div class="lock-card">
  <span class="lock-ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>
  <h2>{title}</h2>
  <p>{text}</p>
  <div class="lock-actions"><a class="btn color lg" href="/join/"><span>Join from <span data-price="monthly">{money(PRICING['monthly'])}</span>/month</span></a><a class="btn light lg" href="/login/?next={nxt}">Log in</a></div>
  {extra}
</div>"""


def lesson_preview_page(c, d, data_src):
    """What visitors without a membership see at a locked lesson's URL (served by middleware.js)."""
    slug, n, base = c["slug"], d["n"], f"/courses/{c['slug']}/"
    m = next(m for m in c["modules"] if n in m["days"])
    days = c["days"]
    side = ""
    for mod in c["modules"]:
        side += f'<p class="mtitle">{html.escape(mod["title"])}</p>'
        for k in mod["days"]:
            dk = next(x for x in days if x["n"] == k)
            side += f'<a href="{base}day-{k}/" aria-current="{"true" if k == n else "false"}"><span class="ck"></span><span>Day {k}: {html.escape(dk["title"])}</span></a>'
    sp = d["split"]
    tot = sp["read"] + sp["demo"] + sp["tasks"]
    heads = [squash(strip_tags(h)) for h in re.findall(r"<h3[^>]*>(.*?)</h3>", d["lesson"], re.S)][:6]
    inside = [f"<li><b>Lesson</b> · {sp['read']} min" + (f": {html.escape(', '.join(heads))}" if heads else "") + "</li>"]
    if d["demo"]:
        inside.append(f"<li><b>Worked example</b> · {sp['demo']} min</li>")
    inside.append(f"<li><b>{len(d['tasks'])} timed tasks</b> · {sp['tasks']} min, with a checklist that saves your progress</li>")
    if d["deliverable"]:
        inside.append("<li><b>By tonight you'll have</b> · a finished result to show for the day</li>")
    free_n = MEMBERSHIP["free_days"][0]
    text = (f"Day {n} of {html.escape(c['title'])} is for members. Join to read the full lesson and do the tasks, "
            "with every other course, the Recipe Vault, website templates and Viral Prompts included.")
    extra = f'<p class="lock-free">Day {free_n} of every course is free. <a class="link" href="{base}day-{free_n}/">Start Day {free_n} →</a></p>'
    lesson = f"""<div class="lesson-top"><div><p class="crumb">{html.escape(m['title'])} · Day {n} of {len(days)}</p><h1>{html.escape(d['title'])}</h1></div><span class="pill lock-pill">Members</span></div>
<div class="meta-chips"><span class="mchip">{fmt_h(d['hours'])} hours</span></div>
<p class="goal">{html.escape(d['goal'])}</p>
<div class="time-key"><span>Lesson {sp['read']} min</span><span>Example {sp['demo']} min</span><span>Tasks {sp['tasks']} min</span><span>≈ {tot / 60:.1f} h total</span></div>
<section class="part"><h2 class="part-h"><span class="pi">1</span>Lesson</h2><div class="prose teaser">{first_paragraphs(d['lesson'])}</div></section>
{lock_card("Keep going with a membership", text, f"{base}day-{n}/", extra)}
<section class="part"><h2 class="part-h"><span class="pi">✓</span>What's in this lesson</h2><ul class="inside-list">{''.join(inside)}</ul></section>"""
    body = course_head(c, "p", "day", base) + f"""
<div class="wrap">
  <section class="view" id="v-day">
    <div class="two-col left">
      <aside class="panel lesson-nav sticky">
        <div class="top">
          <p class="ln-title"><a href="{base}">{html.escape(c['title'])}</a></p>
          <div class="progress" data-course-progress><div class="track"><i></i></div><span>0%</span></div>
        </div>
        <div class="jump"><label for="jump" class="muted" style="font-size:.85rem;font-weight:700">Jump to a lesson</label><select id="jump"></select></div>
        <nav class="list" id="lesson-list" aria-label="Lessons">{side}</nav>
      </aside>
      <article class="panel panel-pad" id="lesson-locked">{lesson}</article>
    </div>
  </section>
</div>
"""
    return lesson_shell(c, d, body, data_src, f"window.SA_DAY = {n}; window.SA_LOCKED = true;")


# ---------------------------------------------------------------- viral prompts

PACK_KEYS = ["slug", "title", "published", "kind", "tools", "summary", "why", "steps", "prompts", "tips", "tags"]


def load_prompts():
    packs, seen = [], set()
    for f in sorted((CONTENT / "prompts").glob("*.json")):
        p = json.loads(f.read_text())
        missing = [k for k in PACK_KEYS if k not in p]
        assert not missing, (f.name, missing)
        assert re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", p["slug"]), (f.name, p["slug"])
        assert p["slug"] not in seen, ("duplicate slug", p["slug"])
        assert p["kind"] in KIND_LABEL, (f.name, p["kind"])
        assert p["prompts"] and all(x.get("label") and x.get("text") for x in p["prompts"]), f.name
        datetime.datetime.fromisoformat(p["published"].replace("Z", "+00:00"))
        seen.add(p["slug"])
        p["_file"] = f
        packs.append(p)
    packs.sort(key=lambda p: p["published"], reverse=True)
    return packs


def pack_date(p, fmt="%b %-d, %Y"):
    return datetime.datetime.fromisoformat(p["published"].replace("Z", "+00:00")).strftime(fmt)


def prompt_block(pr, uid):
    return (f'<div class="pblock"><div class="pb-top"><b>{html.escape(pr["label"])}</b>'
            f'<button type="button" class="btn light sm" data-copy="{uid}">Copy</button></div>'
            f'<pre id="{uid}">{html.escape(pr["text"])}</pre></div>')


def pack_meta(p):
    return (f'<div class="pc-top"><span class="pill kind kind-{p["kind"]}">{KIND_LABEL[p["kind"]]}</span>'
            f'<time datetime="{p["published"]}">{pack_date(p)}</time><span class="new-badge" hidden>New</span></div>')


def free_packs(packs):
    """Slugs of the packs everyone can read when membership is live (the newest few)."""
    return [p["slug"] for p in packs[:MEMBERSHIP["free_prompts"]]]


def locked_prompt_block(pr):
    words = pr["text"].split()
    tease = " ".join(words[:9]) + ("…" if len(words) > 9 else "")
    return (f'<div class="pblock locked"><div class="pb-top"><b>{html.escape(pr["label"])}</b>'
            f'<span class="pill lock-pill">Members</span></div>'
            f'<pre aria-hidden="true">{html.escape(tease)}</pre></div>')


def prompts_hub(packs, locked=False):
    """The Viral Prompts feed. locked=True is the version for visitors without a membership:
    every pack is listed, but only the newest few show their prompt text."""
    cards = []
    free = set(free_packs(packs)) if locked else None
    for p in packs:
        find = html.escape(" ".join([p["title"], p["summary"], " ".join(p["tags"]), " ".join(p["tools"]), p["kind"]]).lower())
        more = len(p["prompts"]) - 1
        is_locked = locked and p["slug"] not in free
        block = locked_prompt_block(p["prompts"][0]) if is_locked else prompt_block(p["prompts"][0], 'p-' + p['slug'] + '-0')
        free_tag = '<span class="pill ok free-pill">Free</span>' if locked and not is_locked else ""
        cards.append(f"""<article class="pcard" data-kind="{p['kind']}" data-published="{p['published']}" data-find="{find}">
  {pack_meta(p).replace('</div>', free_tag + '</div>', 1) if free_tag else pack_meta(p)}
  <h2 class="pc-title"><a href="/prompts/{p['slug']}/">{html.escape(p['title'])}</a></h2>
  <p class="pc-sum">{html.escape(p['summary'])}</p>
  <div class="tags">{''.join(f'<span class="tag">{html.escape(t)}</span>' for t in p['tools'])}</div>
  {block}
  <a class="link" href="/prompts/{p['slug']}/">{("See the pack" if is_locked else (f"{more} more prompt{'s' if more != 1 else ''}, steps and tips" if more else "Steps and tips"))} →</a>
</article>""")
    kinds = [k for k in KIND_LABEL if any(p["kind"] == k for p in packs)]
    chips = '<button class="chip-btn" type="button" data-vp-kind="all" aria-pressed="true">All</button>' + "".join(
        f'<button class="chip-btn" type="button" data-vp-kind="{k}" aria-pressed="false">{KIND_LABEL[k]}</button>' for k in kinds)
    latest = pack_date(packs[0]) if packs else "—"
    free_line = (f' The {MEMBERSHIP["free_prompts"]} newest packs are free for everyone; members get every pack.' if live() else "")
    body = f"""
<section class="wrap page-head vp-head">
  <h1>Viral Prompts</h1>
  <p>Copy-ready prompts for the AI photo and video trends people are sharing right now. New packs land here as trends appear, with steps, variations and tips for each one.{free_line}</p>
  <div class="actions"><button class="btn" type="button" data-sub>Subscribe</button><span class="vp-meta">{len(packs)} prompt packs · updated {latest}</span></div>
</section>
<div class="wrap"><p class="vp-note" data-sub-note></p></div>
<section class="wrap" style="margin-top:16px" aria-label="Prompt packs">
  <div class="vp-tools">
    <div class="chips" role="group" aria-label="Filter by type">{chips}</div>
    <div class="search vp-search">{SEARCH_ICON}<input type="search" id="vp-find" placeholder="Search prompts, e.g. halloween, pets, headshot" aria-label="Search prompts" autocomplete="off"></div>
  </div>
  <div class="pfeed" id="pfeed">
{chr(10).join(cards)}
  </div>
  <p class="empty-note" id="vp-empty" hidden>No prompts match that search yet.</p>
  {lock_card("Every pack, as soon as it drops", "Members can copy every prompt in every pack, old and new, plus all the courses, the Recipe Vault and website templates.", "/prompts/") if locked else ""}
  <div class="note-card" style="margin-top:28px"><b>How it works:</b> we check for new AI trends several times a day and post a pack when one is worth trying. Results vary between tools and runs, so make a few versions and keep the best. Only use photos of yourself, or of people who have agreed. Want to get better at the tools? <a class="link" href="/courses/ai-mastery/">AI Mastery</a> teaches prompting, images and video step by step.</div>
</section>
"""
    ld = [{"@type": "CollectionPage", "name": "Viral Prompts", "url": SITE + "/prompts/", "publisher": ORG,
           "description": "Copy-ready prompts for trending AI photo and video ideas, updated as trends appear.",
           "mainEntity": {"@type": "ItemList", "itemListElement": [
               {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/prompts/{p['slug']}/", "name": p["title"]} for i, p in enumerate(packs)]}},
          crumbs_ld([("Home", "/"), ("Viral Prompts", "/prompts/")])]
    page = head("Viral AI Prompts: Trending Photo and Video Prompts to Copy · Class a Day",
                "Copy-ready prompts for the AI photo and video trends people are sharing right now, for ChatGPT, Gemini, Runway, Kling, Veo and more. New packs as trends appear.",
                "/prompts/", "vp", og_image="/assets/img/og/viral-prompts.jpg", jsonld=ld)
    return page + body + foot(f'<script src="{asset("/assets/js/prompts.js")}"></script>')


def prompt_page(p, packs, locked=False):
    """One pack. locked=True is the preview for visitors without a membership (prompt text hidden)."""
    steps = "".join(f"<li>{html.escape(s)}</li>" for s in p["steps"])
    tips = "".join(f"<li>{html.escape(s)}</li>" for s in p["tips"])
    if locked:
        blocks = "".join(locked_prompt_block(pr) for pr in p["prompts"]) + lock_card(
            "Copy these prompts with a membership",
            f"This pack has {len(p['prompts'])} prompt{'s' if len(p['prompts']) != 1 else ''}. Members can copy every prompt in every pack, "
            "plus all the courses, the Recipe Vault and website templates.",
            f"/prompts/{p['slug']}/",
            f'<p class="lock-free">The {MEMBERSHIP["free_prompts"]} newest packs are free. <a class="link" href="/prompts/">See them →</a></p>')
    else:
        blocks = "".join(prompt_block(pr, f"p-{p['slug']}-{i}") for i, pr in enumerate(p["prompts"]))
    others = [x for x in packs if x["slug"] != p["slug"]][:5]
    latest = "".join(f'<li><a href="/prompts/{x["slug"]}/"><span>{html.escape(x["title"])}</span><small>{KIND_LABEL[x["kind"]]} · {pack_date(x, "%b %-d")}</small></a></li>' for x in others)
    tools = ", ".join(p["tools"][:3])
    body = f"""
<nav class="wrap crumbs" aria-label="Breadcrumb"><a href="/prompts/">Viral Prompts</a><span aria-hidden="true">›</span><span>{html.escape(p['title'])}</span></nav>
<section class="wrap pack" data-published="{p['published']}">
  <div class="two-col">
    <article class="panel panel-pad pack-main">
      {pack_meta(p)}
      <h1>{html.escape(p['title'])}</h1>
      <p class="lead">{html.escape(p['summary'])}</p>
      <div class="tags">{''.join(f'<span class="tag">{html.escape(t)}</span>' for t in p['tools'])}</div>
      <h2>Why it's trending</h2>
      <p>{html.escape(p['why'])}</p>
      <h2>How to use it</h2>
      <ol class="steps-list">{steps}</ol>
      <h2>Prompts</h2>
      <div class="pblocks">{blocks}</div>
      <h2>Tips</h2>
      <ul class="bullets">{tips}</ul>
      <p class="muted small-note">Results vary between tools and runs. Make a few versions and keep the best. Only use photos of yourself, or of people who have agreed, and label AI content where the platform asks.</p>
    </article>
    <aside class="panel panel-pad sticky pack-side">
      <h3>Get new drops</h3>
      <p class="muted">Subscribe and you'll see a <b>New</b> badge and a dot in the menu whenever fresh prompts land.</p>
      <button class="btn block" type="button" data-sub>Subscribe</button>
      <h3 style="margin-top:22px">Latest prompts</h3>
      <ul class="latest">{latest}</ul>
      <a class="btn light block" href="/prompts/">All prompts</a>
    </aside>
  </div>
</section>
"""
    url = f"/prompts/{p['slug']}/"
    ld = [{"@type": "Article", "headline": p["title"], "description": p["summary"], "url": SITE + url,
           "datePublished": p["published"], "dateModified": p["published"], "author": ORG, "publisher": ORG,
           "image": SITE + "/assets/img/og/viral-prompts.jpg", "keywords": ", ".join(p["tags"] + p["tools"]),
           "isPartOf": {"@type": "CollectionPage", "name": "Viral Prompts", "url": SITE + "/prompts/"}},
          crumbs_ld([("Home", "/"), ("Viral Prompts", "/prompts/"), (p["title"], url)])]
    if live():
        ld[0]["isAccessibleForFree"] = p["slug"] in free_packs(packs)
    page = head(f"{p['title']} prompt ({tools}) · Viral Prompts · Class a Day", p["summary"], url, "vp",
                og_image="/assets/img/og/viral-prompts.jpg", og_type="article", jsonld=ld)
    return page + body + foot(f'<script src="{asset("/assets/js/prompts.js")}"></script>')


# ---------------------------------------------------------------- search index, sitemap, social images

def heads_and_terms(html_text):
    hs = re.findall(r"<h[34][^>]*>(.*?)</h[34]>", html_text, re.S)
    st = re.findall(r"<strong>(.*?)</strong>", html_text, re.S)
    words = [squash(strip_tags(x)) for x in hs + st]
    out, seen = [], set()
    for w in words:
        k = w.lower()
        if w and k not in seen and len(w) < 80:
            seen.add(k); out.append(w)
    return " · ".join(out)


def search_index(courses, packs, tpls):
    idx = []
    for c in courses:
        idx.append({"k": "Course", "t": c["title"], "s": f"{len(c['days'])} lessons · about {fmt_h(c['totalHours'])} hours",
                    "u": f"courses/{c['slug']}/", "x": squash(strip_tags(c["lede"]) + " " + " ".join(m["title"] for m in c["modules"]))})
        for d in c["days"]:
            idx.append({"k": "Lesson", "t": f"Day {d['n']}: {d['title']}", "s": c["title"], "u": f"courses/{c['slug']}/day-{d['n']}/",
                        "x": squash(d["goal"] + " " + heads_and_terms(d["lesson"] + d["demo"]))})
    idx.append({"k": "Page", "t": "Viral Prompts", "s": f"{len(packs)} prompt packs", "u": "prompts/",
                "x": "trending ai prompts viral photo video chatgpt gemini runway kling veo"})
    for p in packs:
        idx.append({"k": "Prompt", "t": p["title"], "s": f"{KIND_LABEL[p['kind']]} · {', '.join(p['tools'][:3])}", "u": f"prompts/{p['slug']}/",
                    "x": squash(" ".join([p["summary"], " ".join(p["tags"]), " ".join(p["tools"])]))})
    vault_frag = (CONTENT / "pages" / "vault.html").read_text()
    for title, desc, items in re.findall(r'<div class="card-title">(.*?)</div>\s*<p class="card-desc">(.*?)</p>\s*<ul class="inside">(.*?)</ul>', vault_frag, re.S):
        idx.append({"k": "Book", "t": squash(strip_tags(title)), "s": "Recipe Vault PDF", "u": "recipe-vault/",
                    "x": squash(strip_tags(desc + " " + items))})
    idx.append({"k": "Page", "t": "The Recipe Vault", "s": "4 PDF books", "u": "recipe-vault/", "x": "recipes cake keto nutrition food plan kitchen quiz pan converter"})
    for t in tpls:
        idx.append({"k": "Template", "t": t["name"], "s": ", ".join(t["tags"]), "u": "templates/", "x": t["desc"]})
    idx.append({"k": "Page", "t": "Classroom", "s": "Your courses and progress", "u": "courses/", "x": "progress streak badges level question of the day"})
    idx.append({"k": "Page", "t": "Pricing and membership", "s": f"{money(PRICING['monthly'])} a month or {money(PRICING['lifetime'])} for life", "u": "join/",
                "x": "price pricing cost membership subscribe subscription lifetime monthly refund guarantee join buy"})
    idx.append({"k": "Page", "t": "Refund Policy", "s": f"{PRICING['guarantee_days']}-day money-back guarantee", "u": "refunds/",
                "x": "refund money back guarantee cancel cancellation chargeback"})
    idx.append({"k": "Page", "t": "Terms of Service", "s": "Membership, payment and content rules", "u": "terms/",
                "x": "terms conditions rules license licence templates lifetime cancel"})
    idx.append({"k": "Page", "t": "Privacy Policy", "s": "What we collect and your choices", "u": "privacy/",
                "x": "privacy data cookies delete account personal information"})
    if accounts():
        idx.append({"k": "Page", "t": "Log in", "s": "Your account, membership and saved progress", "u": "login/",
                    "x": "login log in sign in account member membership billing progress sync"})
    return idx


def write_og_images():
    from PIL import Image
    out = PUBLIC / "assets" / "img" / "og"
    out.mkdir(parents=True, exist_ok=True)
    for src in (PUBLIC / "assets" / "img" / "covers").glob("*.webp"):
        if src.stem.startswith("book-"):
            continue
        dst = out / f"{src.stem}.jpg"
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            continue
        im = Image.open(src).convert("RGB").resize((1200, 675), Image.LANCZOS)
        im.crop((0, 22, 1200, 652)).save(dst, "JPEG", quality=86, optimize=True, progressive=True)


def write_sitemap(entries):
    rows = "\n".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{d}</lastmod></url>" for u, d in entries)
    (PUBLIC / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{rows}\n</urlset>\n')


# ---------------------------------------------------------------- pages

def vault_numbers():
    from pypdf import PdfReader
    rep, total = {}, 0
    vdir = PUBLIC / "downloads" / "recipe-vault"
    for slug in ("cake-studio", "keto-kitchen", "know-your-food", "simple-quick", "recipe-vault-complete"):
        f = vdir / f"classaday-{slug}.pdf"
        n = len(PdfReader(f).pages) if f.exists() else 0
        key = "complete" if slug == "recipe-vault-complete" else slug
        rep[f"P_{key}"] = str(n)
        rep[f"S_{key}"] = f"{max(1, round(f.stat().st_size / 1024))} KB" if f.exists() else ""
        if key != "complete":
            total += n
    rep["TOTAL_PAGES"] = str(total)
    rep["TOTAL_RECIPES"] = str(sum(len(re.findall(r"^::: recipe", (ROOT / "vault-src" / m).read_text(), re.M)) for m in ("cake-studio.md", "keto-kitchen.md", "simple-quick.md")))
    return rep


def cards_html(courses, tpl_count, vault, packs, with_progress=False):
    by = {c["slug"]: c for c in courses}
    out = []
    for p in PRODUCTS:
        if p["slug"] in by:
            c = by[p["slug"]]
            meta = [f"{len(c['days'])} lessons", f"{fmt_h(c['totalHours'])} hours",
                    f"<b>Day {MEMBERSHIP['free_days'][0]} free</b>" if live() else "<b>Free in early access</b>"]
            out.append(product_card(p, meta, len(c["days"]) if with_progress else None))
        elif p["slug"] == "viral-prompts":
            out.append(product_card(p, [f"{len(packs)} prompt packs", "New as trends appear",
                                        f"<b>{MEMBERSHIP['free_prompts']} newest free</b>" if live() else "<b>Free in early access</b>"], badge=True))
        elif p["slug"] == "recipe-vault":
            out.append(product_card(p, ["4 PDF books", f"{vault['TOTAL_PAGES']} pages", "<b>Instant download</b>"]))
        else:
            web = by.get("website-builders")
            out.append(product_card(p, [f"{tpl_count} templates", f"{len(web['days'])}-lesson guide" if web else "guide", "<b>Bulk ZIP</b>"]))
    return "\n".join(out)


def home_page(courses, tpl_count, vault, packs):
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
    early = not live()
    pm, pl = price_spans()
    price_line = (f"{pm} a month or {pl} once for life, with a {PRICING['guarantee_days']}-day money-back guarantee."
                  + (" Free during early access." if early else f" Day {MEMBERSHIP['free_days'][0]} of every course is free."))
    hero_note = "Free while we're in early access." if early else f"Day {MEMBERSHIP['free_days'][0]} of every course is free."
    for k, v in {"CARDS": cards_html(courses, tpl_count, vault, packs), "HOURS_ROWS": "".join(rows), "FAQ_HOURS": faq_hours,
                 "PRICE_LINE": price_line, "HERO_NOTE": hero_note,
                 "PRICE_MONTHLY": pm, "PRICE_LIFETIME": pl}.items():
        frag = frag.replace("{{" + k + "}}", v)
    assert "{{" not in frag, re.findall(r"\{\{\w+\}\}", frag)
    ld = [dict(ORG, description="Step-by-step online courses in AI, digital marketing and dropshipping, plus trending AI prompts and recipe books."),
          {"@type": "WebSite", "name": "Class a Day", "url": SITE + "/",
           "potentialAction": {"@type": "SearchAction", "target": SITE + "/?q={search_term_string}", "query-input": "required name=search_term_string"}}]
    page = head("Class a Day · Online courses in AI, digital marketing and dropshipping",
                "Step-by-step online courses in AI (Claude, ChatGPT, Cursor, Runway), digital marketing and dropshipping, plus trending AI prompts, recipe books and website templates. Daily lessons, real tasks and a calendar.",
                "/", "drop", jsonld=ld)
    return page + frag + foot()


def price_spans():
    """Monthly and lifetime prices for page copy. When membership is live they are wrapped so the browser
    can show the visitor's regional price (see auth.js); the plain number stays for search engines."""
    mo, life = money(PRICING["monthly"]), money(PRICING["lifetime"])
    if not live():
        return mo, life
    return f'<span data-price="monthly">{mo}</span>', f'<span data-price="lifetime">{life}</span>'


def join_page(courses, packs, tpls, vault):
    P = PRICING
    early = not live()
    days = P["guarantee_days"]
    mo, life = price_spans()
    free_n = MEMBERSHIP["free_days"][0]
    lessons = sum(len(c["days"]) for c in courses)
    hours = int(sum(c["totalHours"] for c in courses))
    quiz_q = sum(sum(len(v) for v in c["quiz"]["modules"].values()) for c in courses if c.get("quiz")) + \
        len(json.loads((CONTENT / "quizzes" / "recipe-vault.json").read_text())["questions"])
    by = {c["slug"]: c for c in courses}
    picks = [("ai-mastery", 15), ("dropshipping", 2), ("digital-marketing", 6), ("website-builders", 3)]
    samples = []
    for slug, n in picks:
        c = by.get(slug)
        d = next((x for x in c["days"] if x["n"] == n), None) if c else None
        if not d:
            continue
        goal = d["goal"] if len(d["goal"]) < 150 else d["goal"][:147].rsplit(" ", 1)[0] + "…"
        samples.append(f'<a class="sample" href="/courses/{slug}/day-{n}/"><span class="sm-k">{html.escape(c["title"])} · Day {n}</span>'
                       f'<b>{html.escape(d["title"])}</b><span class="sm-g">{html.escape(goal)}</span><span class="link">Open the lesson →</span></a>')
    if packs:
        p = packs[0]
        samples.append(f'<a class="sample" href="/prompts/{p["slug"]}/"><span class="sm-k">Viral Prompts · {pack_date(p, "%b %-d")}</span>'
                       f'<b>{html.escape(p["title"])}</b><span class="sm-g">{html.escape(p["summary"])}</span><span class="link">See the prompts →</span></a>')
    rep_map = {
        "MONTHLY": mo, "LIFETIME": life, "DAYS": str(days), "LESSONS": str(lessons), "HOURS": str(hours),
        "QUIZ_Q": str(quiz_q), "PACKS": str(len(packs)), "BOOK_PAGES": vault["TOTAL_PAGES"], "TEMPLATES": str(len(tpls)),
        "COURSES": str(len(courses)),
        "CARDS": cards_html(courses, len(tpls), vault, packs), "SAMPLES": "\n".join(samples),
        "CTA_MAIN_HREF": "/courses/" if early else "/join/?plan=lifetime",
        "CTA_MAIN_LABEL": "Start free now" if early else f"<span>Get lifetime access · {life}</span>",
        "CTA_MAIN_SHORT": "Start free" if early else "Get lifetime access",
        "CTA_MONTHLY_HREF": "/courses/" if early else "/join/?plan=monthly",
        "CTA_MONTHLY_LABEL": "Start free now" if early else f"<span>Start monthly · {mo}</span>",
        "CTA_LIFETIME_HREF": "/courses/" if early else "/join/?plan=lifetime",
        "CTA_LIFETIME_LABEL": "Start free now" if early else f"<span>Get lifetime access · {life}</span>",
        "FINE_PRINT": (f"Free during early access. No card needed. Membership opens soon at {mo} a month or {life} for life." if early
                       else f"Prices in CAD plus applicable tax. {days}-day money-back guarantee. Day {free_n} of every course is free."),
        "EARLY_KICKER": '<p class="jh-kicker">Early access: everything is free right now</p>' if early else "",
        "EARLY_NOTE": (f'<p class="early-note"><b>Early access:</b> every course, download and prompt pack is free while we finish building accounts. '
                       f'These are the prices when membership opens. No card needed today.</p>') if early else "",
        "EARLY_FAQ": (f'<details open><summary>Is everything really free right now?</summary><p>Yes. While we\'re in early access every course, download and prompt pack is open, with no card needed. '
                      f'When membership opens, it will be {mo} a month or {life} once for life.</p></details>') if early else
                     (f'<details><summary>Can I try it before I pay?</summary><p>Yes. Day {free_n} of every course and the {MEMBERSHIP["free_prompts"]} newest Viral Prompts packs are free, '
                      f'with no card needed. Open any other lesson to see what it covers before you join.</p></details>'
                      f'<details><summary>How do I log in?</summary><p>With your email: we send you a sign-in link, so there\'s no password to remember. '
                      f'Your membership and progress follow you to any device.</p></details>'
                      f'<details><summary>Why is the price different for me?</summary><p>Prices are set by region, so people in countries where incomes are lower pay less. '
                      f'You\'ll see the price for your region on this page and at checkout.</p></details>'),
    }
    frag = (CONTENT / "pages" / "join.html").read_text()
    for k, v in rep_map.items():
        frag = frag.replace("{{" + k + "}}", v)
    assert "{{" not in frag, re.findall(r"\{\{\w+\}\}", frag)
    faq = re.findall(r"<details[^>]*><summary>(.*?)</summary><p>(.*?)</p></details>", frag, re.S)
    ld = [{"@type": "WebPage", "name": "Class a Day membership and pricing", "url": SITE + "/join/", "publisher": ORG},
          {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": squash(strip_tags(q)),
                                               "acceptedAnswer": {"@type": "Answer", "text": squash(strip_tags(a))}} for q, a in faq]},
          crumbs_ld([("Home", "/"), ("Pricing", "/join/")])]
    pmo, plife = money(P["monthly"]), money(P["lifetime"])
    title = f"Class a Day Membership: Every Course for {pmo} a Month or {plife} for Life"
    desc = (f"One membership for every Class a Day course ({lessons} daily lessons in AI, digital marketing and dropshipping), the Recipe Vault, "
            f"{len(tpls)} website templates and Viral Prompts. {pmo} a month or {plife} once, with a {days}-day money-back guarantee.")
    return head(title, desc, "/join/", "drop", jsonld=ld) + frag + foot(f'<script src="{asset("/assets/js/join.js")}"></script>' if live() else "")


def daily_pool(courses):
    pool = []
    for c in courses:
        if not c.get("quiz"):
            continue
        for qs in c["quiz"]["modules"].values():
            for q in qs:
                pool.append({"q": q["q"], "o": q["o"], "a": q["a"], "why": q["why"], "course": c["title"],
                             "href": f"/courses/{c['slug']}/day-{q['day']}/"})
    vq = json.loads((CONTENT / "quizzes" / "recipe-vault.json").read_text())
    for q in vq["questions"]:
        pool.append({"q": q["q"], "o": q["o"], "a": q["a"], "why": q["why"], "course": "Recipe Vault", "href": "/recipe-vault/#kitchen-quiz"})
    return pool


def js_json(v):
    return json.dumps(v, ensure_ascii=False).replace("</", "<\\/")


LEGAL_PAGES = [
    ("terms", "Terms of Service · Class a Day", "The rules for using Class a Day and the Class a Day membership: accounts, payment, cancelling, refunds and content use."),
    ("privacy", "Privacy Policy · Class a Day", "What Class a Day collects, why, who helps run the service, and your choices. No advertising cookies, no selling your data."),
    ("refunds", "Refund Policy: 30-Day Money-Back Guarantee · Class a Day", "How the Class a Day 30-day money-back guarantee works for monthly and lifetime memberships, and how to ask for a refund."),
]


def write_account_pages():
    """Legal pages (always), and the login and account pages (when accounts are on). Returns sitemap rows."""
    rep = {"SUPPORT_EMAIL": SUPPORT_EMAIL, "DAYS": str(PRICING["guarantee_days"]), "MONTHLY": money(PRICING["monthly"]),
           "LIFETIME": money(PRICING["lifetime"]), "CURRENCY": PRICING["currency"]}
    rows = []
    for slug, title, desc in LEGAL_PAGES:
        src = CONTENT / "pages" / f"{slug}.html"
        updated = git_date(src)
        page = simple_page(f"{slug}.html", title, desc, f"/{slug}/", "drop",
                           replacements=dict(rep, UPDATED=datetime.date.fromisoformat(updated).strftime("%B %-d, %Y")))
        assert "{{" not in page, (slug, re.findall(r"\{\{\w+\}\}", page))
        (PUBLIC / slug).mkdir(exist_ok=True)
        (PUBLIC / slug / "index.html").write_text(page)
        rows.append((f"/{slug}/", updated))
    pages = {"login": ("Log in · Class a Day", "Log in to Class a Day with your email. No password needed."),
             "account": ("Your account · Class a Day", "Your Class a Day membership, billing and saved progress.")}
    for slug, (title, desc) in pages.items():
        d = PUBLIC / slug
        if not accounts():
            if d.exists():
                shutil.rmtree(d)
            continue
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(simple_page(f"{slug}.html", title, desc, f"/{slug}/", "drop",
                                                  js=f'<script src="{asset("/assets/js/account.js")}"></script>',
                                                  replacements=rep, noindex=True))
    return rows


def write_site_config(packs):
    """lib/site-config.js: the settings the server code and middleware need (no secrets)."""
    cfg = {"supabaseUrl": SUPABASE["url"], "supabaseKey": SUPABASE["key"], "currency": PRICING["currency"].lower(),
           "prices": {"full": {"monthly": PRICING["monthly"], "lifetime": PRICING["lifetime"]}, "half": PRICING["half"]},
           "accounts": accounts(), "live": live(),
           "gate": {"freeDays": MEMBERSHIP["free_days"], "freePrompts": free_packs(packs)}}
    (ROOT / "lib" / "site-config.js").write_text(
        "/* Written by build/build.py from PRICING and MEMBERSHIP. Don't edit by hand; run the build. */\n"
        "export default " + json.dumps(cfg, indent=2) + ";\n")


def simple_page(fragment_name, title, desc, path, aura, js="", replacements=None, pre_js="", **head_kw):
    frag = (CONTENT / "pages" / fragment_name).read_text()
    for k, v in (replacements or {}).items():
        frag = frag.replace("{{" + k + "}}", v)
    return head(title, desc, path, aura, **head_kw) + frag + foot(js, pre_js)


def main():
    global SA_META_JS, SA_PROMPTS_JS
    courses = [parse_course(CONTENT / f) for f in COURSE_FILES]
    packs = load_prompts()
    SA_META_JS = js_json({c["slug"]: {"title": c["title"], "href": f"/courses/{c['slug']}/", "days": len(c["days"]),
                                      "modules": [m["days"] for m in c["modules"]]} for c in courses})
    SA_PROMPTS_JS = js_json({"count": len(packs), "dates": [p["published"] for p in packs]})
    sitemap = [("/", git_date(CONTENT / "pages" / "home.html")), ("/courses/", git_date(CONTENT / "pages" / "classroom.html"))]

    for c in courses:
        slug = c["slug"]
        cdir = PUBLIC / "courses" / slug
        cdir.mkdir(parents=True, exist_ok=True)
        # Public course data: titles, goals and timings for the calendar and lesson list. Lesson text is not
        # in here; each lesson page carries its own (see DAY_CONTENT_KEYS).
        pub_days = [{k: v for k, v in d.items() if k not in DAY_CONTENT_KEYS} for d in c["days"]]
        data = {"slug": slug, "code": c["code"], "title": c["title"], "days": pub_days, "modules": c["modules"],
                "quiz": c.get("quiz"), "hours": c["totalHours"]}
        data_js = "window.COURSE = " + js_json(data) + ";\n"
        (cdir / "course-data.js").write_text(data_js)
        data_src = f"/courses/{slug}/course-data.js?v={short_hash(data_js)}"
        (cdir / "index.html").write_text(course_page(c, data_src))
        src_date = git_date(CONTENT / f"{slug}.md", CONTENT / "quizzes" / f"{slug}.json")
        sitemap.append((f"/courses/{slug}/", src_date))
        keep = set()
        for d in c["days"]:
            ddir = cdir / f"day-{d['n']}"
            ddir.mkdir(exist_ok=True)
            (ddir / "index.html").write_text(lesson_page(c, d, data_src))
            if not free_day(d["n"]):
                (ddir / "preview").mkdir(exist_ok=True)
                (ddir / "preview" / "index.html").write_text(lesson_preview_page(c, d, data_src))
            elif (ddir / "preview").exists():
                shutil.rmtree(ddir / "preview")
            keep.add(ddir.name)
            sitemap.append((f"/courses/{slug}/day-{d['n']}/", src_date))
        for old in cdir.glob("day-*"):
            if old.is_dir() and old.name not in keep:
                shutil.rmtree(old)
        nq = sum(len(v) for v in c["quiz"]["modules"].values()) if c.get("quiz") else 0
        print(f"  {slug}: {len(c['days'])} days, {c['totalHours']:g} h, {c['figures']} figures, {nq} quiz questions")

    tpls = json.loads((ROOT / "templates-src" / "manifest.json").read_text())
    vault = vault_numbers()

    (PUBLIC / "index.html").write_text(home_page(courses, len(tpls), vault, packs))
    (PUBLIC / "courses" / "index.html").write_text(simple_page(
        "classroom.html", "Classroom: All Courses and Your Progress · Class a Day", "All Class a Day courses, your progress, streaks and badges, and a question of the day.", "/courses/", "drop",
        replacements={"CARDS": cards_html(courses, len(tpls), vault, packs, with_progress=True),
                      "SAVED_NOTE": "Progress, streaks and badges are saved on this device, and to your account when you log in." if accounts()
                      else "Progress, streaks and badges are saved on this device."},
        pre_js=f"<script>window.SA_DAILY = {js_json(daily_pool(courses))};</script>"))
    (PUBLIC / "recipe-vault").mkdir(exist_ok=True)
    (PUBLIC / "recipe-vault" / "index.html").write_text(simple_page(
        "vault.html", "The Recipe Vault: Cake, Keto and Meal Plan PDF Recipe Books · Class a Day",
        "Four downloadable recipe books: Cake Studio, Keto Kitchen, Know Your Food and the Simple & Quick Food Plan. Instant PDF, grams and cups, °C and °F.",
        "/recipe-vault/", "vault",
        f'<script>window.VAULT_QUIZ = {js_json(json.loads((CONTENT / "quizzes" / "recipe-vault.json").read_text()))};</script>\n'
        '<script src="/assets/js/quiz.js"></script>\n<script src="/assets/js/tools.js"></script>\n<script src="/assets/js/vault.js"></script>', vault,
        og_image="/assets/img/og/recipe-vault.jpg"))
    sitemap.append(("/recipe-vault/", git_date(CONTENT / "pages" / "vault.html", ROOT / "vault-src")))

    # Viral Prompts
    pdir = PUBLIC / "prompts"
    pdir.mkdir(exist_ok=True)
    (pdir / "index.html").write_text(prompts_hub(packs))
    assert all(p["slug"] != "preview" for p in packs), "a pack slug cannot be 'preview'"
    if live():
        (pdir / "preview").mkdir(exist_ok=True)
        (pdir / "preview" / "index.html").write_text(prompts_hub(packs, locked=True))
    sitemap.append(("/prompts/", packs[0]["published"][:10] if packs else git_date(CONTENT / "prompts")))
    keep = {"preview"} if live() else set()
    free = set(free_packs(packs))
    for p in packs:
        d = pdir / p["slug"]
        d.mkdir(exist_ok=True)
        (d / "index.html").write_text(prompt_page(p, packs))
        if live() and p["slug"] not in free:
            (d / "preview").mkdir(exist_ok=True)
            (d / "preview" / "index.html").write_text(prompt_page(p, packs, locked=True))
        elif (d / "preview").exists():
            shutil.rmtree(d / "preview")
        keep.add(p["slug"])
        sitemap.append((f"/prompts/{p['slug']}/", p["published"][:10]))
    for old in pdir.iterdir():
        if old.is_dir() and old.name not in keep:
            shutil.rmtree(old)

    cards = []
    for t in tpls:
        tags = "".join(f'<span class="tag">{html.escape(x)}</span>' for x in t["tags"])
        cards.append(f"""<article class="card">
  <a class="cover" href="/templates/{t['slug']}/" target="_blank" rel="noopener" aria-label="Open the {html.escape(t['name'])} live preview"><img src="/templates/previews/{t['slug']}.webp" alt="Screenshot of the {html.escape(t['name'])} template" loading="lazy" width="1200" height="750"></a>
  <div class="card-body">
    <div class="card-title">{html.escape(t['name'])}</div>
    <p class="card-desc">{html.escape(t['desc'])}</p>
    <div class="tags">{tags}</div>
    <div class="btn-row"><a class="btn light sm" href="/templates/{t['slug']}/" target="_blank" rel="noopener">Live preview</a><a class="btn sm" href="/downloads/templates/{t['slug']}.zip">Download</a></div>
  </div>
</article>""")
    (PUBLIC / "templates").mkdir(exist_ok=True)
    (PUBLIC / "templates" / "index.html").write_text(simple_page(
        "templates.html", "Website Templates: 6 Free HTML Templates to Rebrand and Sell · Class a Day",
        f"{len(tpls)} ready-made website templates in one bulk download, plus a 7-day guide to redesign, publish and sell websites.",
        "/templates/", "web", replacements={"TPL_CARDS": "\n".join(cards), "TPL_COUNT": str(len(tpls))},
        og_image="/assets/img/og/website-builders.jpg"))
    sitemap.append(("/templates/", git_date(CONTENT / "pages" / "templates.html", ROOT / "templates-src")))
    (PUBLIC / "join").mkdir(exist_ok=True)
    (PUBLIC / "join" / "index.html").write_text(join_page(courses, packs, tpls, vault))
    sitemap.append(("/join/", git_date(CONTENT / "pages" / "join.html", ROOT / "build" / "build.py")))
    (PUBLIC / "404.html").write_text(simple_page("404.html", "Page not found · Class a Day", "This page doesn't exist.", "/404", "drop", noindex=True))
    sitemap += write_account_pages()
    write_site_config(packs)

    idx = search_index(courses, packs, tpls)
    (PUBLIC / "assets" / "js" / "search-index.js").write_text("window.SA_SEARCH = " + js_json(idx) + ";\n")
    write_sitemap(sitemap)
    write_og_images()
    print(f"  home, classroom, recipe vault, templates, 404, {len(packs)} prompt packs, {len(idx)} search entries, {len(sitemap)} sitemap URLs")


if __name__ == "__main__":
    main()
