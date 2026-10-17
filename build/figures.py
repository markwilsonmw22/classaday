#!/usr/bin/env python3
"""Generates the course diagrams as theme-aware SVG (classes come from site.css).
Run: python3 build/figures.py"""
from pathlib import Path
from html import escape as e

OUT = Path(__file__).resolve().parent.parent / "content" / "figures"
OUT.mkdir(parents=True, exist_ok=True)

DEFS = ('<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        '<path d="M0 0 10 5 0 10z" class="f-ink3"/></marker>'
        '<marker id="aa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        '<path d="M0 0 10 5 0 10z" class="f-aura"/></marker></defs>')


def svg(w, h, body, label):
    return f'<svg viewBox="0 0 {w} {h}" role="img" aria-label="{e(label)}" xmlns="http://www.w3.org/2000/svg">{DEFS}{body}</svg>'


def box(x, y, w, h, title, sub="", fill="f-panel", stroke="s-line", tcls="t-md f-ink", r=12, align="middle"):
    tx = x + w / 2 if align == "middle" else x + 16
    out = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" class="{fill}"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" class="{stroke}" stroke-width="1.2"/>'
    if sub:
        out += f'<text x="{tx}" y="{y + h / 2 - 4}" text-anchor="{align if align == "middle" else "start"}" class="{tcls}">{e(title)}</text>'
        out += f'<text x="{tx}" y="{y + h / 2 + 16}" text-anchor="{align if align == "middle" else "start"}" class="t-sm f-ink3">{e(sub)}</text>'
    else:
        out += f'<text x="{tx}" y="{y + h / 2 + 5}" text-anchor="{align if align == "middle" else "start"}" class="{tcls}">{e(title)}</text>'
    return out


def arrow(x1, y1, x2, y2, aura=False, dash=False, curve=None):
    cls = "s-aura" if aura else "s-ink"
    mk = "aa" if aura else "ah"
    d = f"M{x1} {y1} L{x2} {y2}" if curve is None else f"M{x1} {y1} Q{curve[0]} {curve[1]} {x2} {y2}"
    da = ' stroke-dasharray="4 5"' if dash else ""
    return f'<path d="{d}" class="{cls}" stroke-width="1.5"{da} marker-end="url(#{mk})"/>'


def text(x, y, s, cls="t-sm f-ink3", anchor="start"):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" class="{cls}">{e(s)}</text>'


figs = {}

# ---------------------------------------------------------------- DROPSHIPPING
b = ""
b += box(30, 120, 170, 70, "Customer", "sees your ad, orders")
b += box(300, 120, 170, 70, "Your store", "Shopify + your brand", fill="f-aura-soft", stroke="s-aura")
b += box(570, 120, 170, 70, "Supplier", "stocks, packs, ships")
b += arrow(200, 140, 298, 140, aura=True)
b += text(249, 128, "pays $34.99", "t-sm f-aura", "middle")
b += arrow(470, 140, 568, 140, aura=True)
b += text(519, 128, "pays $12.60", "t-sm f-aura", "middle")
b += arrow(570, 172, 470, 172)
b += text(519, 192, "tracking number", "t-sm f-ink3", "middle")
b += arrow(470, 172, 202, 172)
b += text(336, 192, "order + tracking emails", "t-sm f-ink3", "middle")
b += f'<path d="M655 190 C 655 290, 115 290, 115 192" class="s-ink" stroke-width="1.5" stroke-dasharray="5 6" marker-end="url(#ah)"/>'
b += text(385, 278, "the parcel goes straight from supplier to customer (5–12 days)", "t-sm f-ink2", "middle")
b += text(30, 50, "MONEY", "t-sm f-aura")
b += '<path d="M90 46 H140" class="s-aura" stroke-width="1.5"/>'
b += text(170, 50, "INFORMATION / GOODS", "t-sm f-ink3")
b += '<path d="M328 46 H378" class="s-ink" stroke-width="1.5"/>'
b += text(30, 86, "You keep the difference: $34.99 − $12.60 − fees − ad cost", "t-md f-ink2")
figs["ds-flow"] = svg(770, 300, b, "How money and products move in dropshipping")

# unit economics stacked bar (scale: $1 = 18px)
parts = [("Product", 8.40, "f-ink3"), ("Shipping", 4.20, "f-ink2"), ("Fees", 1.31, "f-panel2"), ("Ad cost per sale", 12.00, "f-late"), ("Profit", 9.08, "f-ok")]
S = 18.0
x0, y0 = 40, 112
b = text(40, 30, "WHERE $34.99 GOES ON ONE ORDER", "t-sm f-ink3")
x = x0
for name, val, cls in parts:
    w = val * S
    b += f'<rect x="{x:.1f}" y="{y0}" width="{w:.1f}" height="54" class="{cls}"/>'
    b += f'<path d="M{x:.1f} {y0 - 8} V{y0 + 62}" class="s-line" stroke-width="1"/>'
    if w < 40:
        b += f'<path d="M{x + w / 2:.1f} {y0} V{y0 - 22}" class="s-ink" stroke-width="1"/>'
        b += text(x + w / 2, y0 - 28, f"{name.upper()} ${val:.2f}", "t-sm f-ink2", "middle")
    else:
        b += text(x + 6, y0 + 86, name.upper(), "t-sm f-ink3")
        b += text(x + 6, y0 + 108, f"${val:.2f}", "t-md f-ink")
    x += w
b += f'<path d="M{x:.1f} {y0 - 8} V{y0 + 62}" class="s-line" stroke-width="1"/>'
b += f'<rect x="{x0}" y="{y0}" width="{x - x0:.1f}" height="54" class="s-line" stroke-width="1" fill="none"/>'
b += text(x0, 100, "$0", "t-sm f-ink3")
b += text(x, 100, "$34.99", "t-sm f-ink3", "end")
b += text(40, 270, "Gross margin before ads: $21.08 (60%). Break-even ad cost per sale: $21.08.", "t-md f-ink2")
figs["ds-unit"] = svg(720, 290, b, "Unit economics of a $34.99 product")

# niche quadrant
b = ""
L, T, W, H = 90, 30, 560, 300
b += f'<rect x="{L}" y="{T}" width="{W}" height="{H}" class="f-panel"/>'
b += f'<rect x="{L + W / 2}" y="{T}" width="{W / 2}" height="{H / 2}" class="f-aura-soft"/>'
b += f'<path d="M{L} {T + H / 2} H{L + W} M{L + W / 2} {T} V{T + H}" class="s-line" stroke-width="1"/>'
b += f'<rect x="{L}" y="{T}" width="{W}" height="{H}" class="s-line" stroke-width="1" fill="none"/>'
b += text(L + W - 12, T + 24, "SWEET SPOT", "t-sm f-aura", "end")
b += text(L + 12, T + 24, "NICHE HOBBY", "t-sm f-ink3")
b += text(L + 12, T + H - 14, "AVOID", "t-sm f-ink3")
b += text(L + W - 12, T + H - 14, "PRICE WAR", "t-sm f-ink3", "end")
b += text(L + W / 2, T + H + 34, "DEMAND  →  (searches, views, ads running)", "t-sm f-ink2", "middle")
b += f'<text x="34" y="{T + H / 2}" transform="rotate(-90 34 {T + H / 2})" text-anchor="middle" class="t-sm f-ink2">MARGIN POTENTIAL  →</text>'
pts = [("Pet grooming", 0.72, 0.74), ("Posture & desk", 0.64, 0.62), ("Kitchen gadgets", 0.82, 0.38), ("Phone cases", 0.9, 0.16), ("Vintage cameras", 0.22, 0.7), ("Generic socks", 0.4, 0.14)]
for name, dx, dy in pts:
    cx, cy = L + dx * W, T + (1 - dy) * H
    hi = dx > 0.5 and dy > 0.5
    b += f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="7" class="{"f-aura" if hi else "f-ink3"}"/>'
    b += text(cx + 13, cy + 5, name, "t-md f-ink" if hi else "t-md f-ink2")
figs["ds-niche"] = svg(700, 380, b, "Niche quadrant: demand against margin potential")

# research funnel
b = ""
steps = [("100", "product ideas collected", 640), ("30", "pass the winning-product checklist", 520), ("10", "scored and teardown done", 400), ("3", "samples ordered, ads tested", 280), ("1", "product you scale", 160)]
y = 20
for num, lab, w in steps:
    x = 40 + (640 - w) / 2
    last = num == "1"
    b += f'<rect x="{x}" y="{y}" width="{w}" height="46" rx="8" class="{"f-aura" if last else "f-panel2"}"/>'
    b += f'<text x="{x + 18}" y="{y + 31}" class="t-lg {"f-bg" if last else "f-ink"}">{num}</text>'
    b += f'<text x="{x + 64}" y="{y + 29}" class="t-sm {"f-bg" if last else "f-ink2"}">{e(lab.upper())}</text>'
    y += 58
figs["ds-funnel"] = svg(720, 310, b, "Product research funnel from 100 ideas to 1 winner")

# product page anatomy
b = ""
b += '<rect x="30" y="20" width="400" height="520" rx="14" class="f-bg"/><rect x="30" y="20" width="400" height="520" rx="14" class="s-ink" stroke-width="1.2"/>'
b += '<rect x="30" y="20" width="400" height="34" rx="14" class="f-panel"/>'
b += text(50, 42, "ANNOUNCEMENT BAR · FREE SHIPPING OVER $50", "t-sm f-ink3")
b += '<rect x="50" y="70" width="170" height="170" rx="8" class="f-aura-soft"/>'
b += '<rect x="50" y="248" width="38" height="38" rx="5" class="f-panel2"/><rect x="94" y="248" width="38" height="38" rx="5" class="f-panel2"/><rect x="138" y="248" width="38" height="38" rx="5" class="f-panel2"/><rect x="182" y="248" width="38" height="38" rx="5" class="f-panel2"/>'
b += '<rect x="236" y="74" width="170" height="14" rx="3" class="f-ink2"/><rect x="236" y="94" width="120" height="14" rx="3" class="f-ink2"/>'
b += '<rect x="236" y="120" width="90" height="8" rx="3" class="f-warn"/>'
b += '<text x="236" y="156" class="t-lg f-ink">$34.99</text><text x="320" y="156" class="t-sm f-ink3" text-decoration="line-through">$49.99</text>'
for i in range(3):
    b += f'<rect x="236" y="{172 + i * 16}" width="8" height="8" rx="2" class="f-aura"/><rect x="250" y="{172 + i * 16}" width="{130 - i * 20}" height="8" rx="3" class="f-ink3"/>'
b += '<rect x="236" y="226" width="170" height="34" rx="17" class="f-aura"/><text x="321" y="248" text-anchor="middle" class="t-sm f-bg">ADD TO CART</text>'
b += '<rect x="236" y="268" width="170" height="10" rx="3" class="f-panel2"/>'
b += '<rect x="50" y="306" width="356" height="70" rx="8" class="f-panel"/>'
b += '<rect x="50" y="386" width="356" height="56" rx="8" class="f-panel"/>'
b += '<rect x="50" y="452" width="356" height="70" rx="8" class="f-panel"/>'
labels = [(130, "1  Real photos + a short demo GIF"), (110, "2  Benefit-led title + rating (real reviews only)"), (150, "3  Price with an honest compare-at"), (190, "4  Three benefits, not features"), (243, "5  One clear button above the fold"), (273, "6  Delivery window + returns line"), (341, "7  How it works / problem → solution"), (414, "8  Reviews, UGC and guarantee"), (487, "9  FAQ that answers objections")]
for y, lab in labels:
    b += f'<path d="M412 {y} H470" class="s-aura" stroke-width="1" stroke-dasharray="2 3"/><circle cx="470" cy="{y}" r="3" class="f-aura"/>'
    b += text(482, y + 5, lab, "t-md f-ink2")
figs["ds-page"] = svg(820, 560, b, "Anatomy of a product page that converts")

# ad timeline
b = text(30, 34, "A 30-SECOND UGC-STYLE AD", "t-sm f-ink3")
segs = [(0, 3, "Hook", "stop the scroll", True), (3, 8, "Problem", "show the pain", False), (8, 18, "Demo", "product solving it", False), (18, 24, "Proof", "result, reviews", False), (24, 30, "Offer + CTA", "why now", False)]
S = 22
for a, z, t1, t2, hot in segs:
    x = 30 + a * S
    w = (z - a) * S - 4
    b += f'<rect x="{x}" y="56" width="{w}" height="64" rx="8" class="{"f-aura" if hot else "f-panel2"}"/>'
    b += f'<text x="{x + 12}" y="84" class="t-md {"f-bg" if hot else "f-ink"}">{e(t1)}</text>'
    b += f'<text x="{x + 12}" y="104" class="t-sm {"f-bg" if hot else "f-ink3"}">{e(t2)}</text>'
for s in (0, 3, 8, 18, 24, 30):
    x = 30 + s * S
    b += f'<path d="M{x} 126 V134" class="s-ink" stroke-width="1"/>'
    b += text(x, 152, f"{s}s", "t-sm f-ink3", "middle")
b += text(30, 186, "Most viewers decide in the first 1–3 seconds. Write ten hooks for every ad you film.", "t-md f-ink2")
figs["ds-ad"] = svg(720, 200, b, "Structure of a 30-second UGC ad")

# campaign structure
b = ""
b += box(250, 20, 260, 66, "Campaign · Sales", "one product, one country")
for i, (x, nm, sub) in enumerate([(20, "Ad set A", "broad, 18–65+"), (270, "Ad set B", "broad, women 25–55"), (520, "Ad set C", "interest: your niche")]):
    b += arrow(380, 86, x + 110, 136)
    b += box(x, 138, 220, 60, nm, sub + " · $20/day")
    for j in range(3):
        ax = x + j * 74
        b += arrow(x + 110, 198, ax + 34, 246, dash=True)
        b += box(ax, 248, 68, 52, f"Ad {j + 1}", "", fill="f-aura-soft" if j == 0 else "f-panel", stroke="s-line", tcls="t-sm f-ink")
b += text(380, 336, "3 ad sets × 3 creatives = 9 ads. Same product, different angles and hooks.", "t-md f-ink2", "middle")
figs["ds-campaign"] = svg(760, 350, b, "First test campaign structure")

# decision tree
b = ""
b += box(250, 16, 260, 70, "Ad has spent 1× break-even CPA", "e.g. $21 for our product")
b += arrow(320, 86, 150, 130); b += arrow(440, 86, 610, 130)
b += box(30, 132, 240, 64, "No sales, CTR under 1%", "the hook isn't working")
b += box(490, 132, 240, 64, "Has sales or add-to-carts", "keep it running")
b += arrow(150, 196, 150, 236)
b += box(30, 238, 240, 60, "Kill it. Test a new hook.", "", fill="f-panel", tcls="t-md f-late")
b += arrow(610, 196, 520, 236); b += arrow(610, 196, 700, 236)
b += box(400, 238, 200, 70, "CPA under break-even", "after 2–3× spend", fill="f-aura-soft", stroke="s-aura")
b += box(620, 238, 140, 70, "CPA above", "break-even")
b += arrow(500, 308, 500, 346, aura=True)
b += box(400, 348, 200, 52, "Scale +20% / 48h", "", fill="f-panel", tcls="t-md f-ok")
b += arrow(690, 308, 690, 346)
b += box(620, 348, 140, 52, "Fix page / offer", "", fill="f-panel", tcls="t-md f-warn")
figs["ds-decision"] = svg(780, 420, b, "Kill or scale decision tree for a test ad")

# store setup map
b = ""
items = [("Domain", "yourbrand.com"), ("Payments", "Shopify Payments, PayPal"), ("Shipping", "zones + free over $X"), ("Taxes", "registered regions"), ("Policies", "refund, shipping, privacy"), ("Theme", "free theme, your brand")]
b += box(290, 150, 180, 70, "Your Shopify store", "", fill="f-aura-soft", stroke="s-aura")
pos = [(30, 30), (290, 20), (550, 30), (30, 280), (290, 300), (550, 280)]
for (nm, sub), (x, y) in zip(items, pos):
    b += box(x, y, 180, 60, nm, sub)
    b += f'<path d="M{x + 90} {y + 30} L380 185" class="s-line" stroke-width="1.2"/>'
b = b.replace('<rect x="290" y="150"', '<rect x="290" y="150"')
figs["ds-setup"] = svg(760, 380, b, "The six settings every store needs before launch")

# ---------------------------------------------------------------- AI MASTERY
b = ""
b += f'<rect x="20" y="40" width="330" height="290" rx="14" class="f-panel"/><rect x="20" y="40" width="330" height="290" rx="14" class="s-line" stroke-width="1.2"/>'
b += text(40, 70, "CONTEXT WINDOW (what the model can see)", "t-sm f-aura")
rows = [("Instructions", "system prompt, project notes"), ("Files & search results", "PDFs, pages, data"), ("The conversation so far", "every earlier message"), ("Your new message", "the prompt you just wrote")]
for i, (t1, t2) in enumerate(rows):
    b += box(40, 88 + i * 58, 290, 48, t1, t2, fill="f-aura-soft" if i == 3 else "f-panel2", tcls="t-md f-ink", align="start")
b += arrow(350, 185, 418, 185, aura=True)
b += box(420, 140, 150, 90, "The model", "predicts the next token", fill="f-aura-soft", stroke="s-aura")
b += arrow(570, 185, 628, 185, aura=True)
b += box(630, 150, 120, 70, "Answer", "token by token")
b += f'<path d="M690 150 C 690 90, 495 90, 495 138" class="s-ink" stroke-width="1.4" stroke-dasharray="4 5" marker-end="url(#ah)"/>'
b += text(592, 92, "each new token is fed back in", "t-sm f-ink3", "middle")
b += text(420, 290, "No live memory of the world: it only knows its training", "t-md f-ink2")
b += text(420, 312, "data plus whatever you put in the window.", "t-md f-ink2")
figs["ai-llm"] = svg(770, 350, b, "How a large language model produces an answer")

cats = [("Chat assistants", "Claude · ChatGPT · Gemini · Copilot"), ("Research", "Perplexity · deep research modes"), ("Images", "Midjourney · ChatGPT images · Ideogram · Firefly"),
        ("Video", "Higgsfield · Runway · Kling · Veo · Sora"), ("Voice & audio", "ElevenLabs · Suno"), ("Avatars", "HeyGen · Synthesia"),
        ("Build apps", "Claude Code · Cursor · Lovable · Bolt · v0"), ("Backend & hosting", "Supabase · Vercel · GitHub"), ("Automation", "Zapier · Make · n8n · MCP")]
b = ""
for i, (t1, t2) in enumerate(cats):
    x = 20 + (i % 3) * 250
    y = 20 + (i // 3) * 96
    b += box(x, y, 236, 82, t1, t2, fill="f-aura-soft" if i == 0 else "f-panel", tcls="t-md f-ink", align="start")
figs["ai-landscape"] = svg(770, 310, b, "Map of AI tool categories")

parts = [("ROLE", "Who should the AI act as?", "You are a senior e-commerce copywriter."), ("CONTEXT", "What does it need to know?", "We sell a $35 posture corrector to office workers 30–50."),
         ("TASK", "What exactly should it do?", "Write 3 product page headlines."), ("FORMAT", "How should the answer look?", "A numbered list, max 10 words each."),
         ("CONSTRAINTS", "What to avoid or respect?", "No medical claims. Plain English."), ("EXAMPLES", "Show what good looks like", "Like: “Sit taller by Friday.”")]
b = ""
for i, (k, q, ex) in enumerate(parts):
    y = 20 + i * 62
    b += f'<rect x="20" y="{y}" width="150" height="50" rx="8" class="{"f-aura" if i == 2 else "f-panel2"}"/>'
    b += f'<text x="36" y="{y + 30}" class="t-sm {"f-bg" if i == 2 else "f-aura"}">{k}</text>'
    b += f'<text x="190" y="{y + 21}" class="t-sm f-ink3">{e(q.upper())}</text>'
    b += f'<text x="190" y="{y + 42}" class="t-md f-ink">{e(ex)}</text>'
figs["ai-prompt"] = svg(760, 392, b, "The six parts of a strong prompt")

steps = [("Script", "Claude / ChatGPT"), ("Shot list", "6–8 shots"), ("Keyframes", "image model"), ("Animate", "Higgsfield · Kling"), ("Voice", "ElevenLabs"), ("Music + SFX", "Suno · ElevenLabs"), ("Edit", "CapCut"), ("Publish", "9:16 + captions")]
b = ""
for i, (t1, t2) in enumerate(steps):
    x = 20 + (i % 4) * 186
    y = 30 + (i // 4) * 130
    b += box(x, y, 160, 74, t1, t2, fill="f-aura-soft" if i in (3, 4) else "f-panel")
    if i % 4 != 3:
        b += arrow(x + 160, y + 37, x + 184, y + 37)
    b += f'<text x="{x + 10}" y="{y - 8}" class="t-sm f-ink3">{i + 1:02d}</text>'
b += '<path d="M680 104 C 680 140, 100 120, 100 156" class="s-ink" stroke-width="1.4" stroke-dasharray="4 5" marker-end="url(#ah)"/>'
figs["ai-video"] = svg(770, 250, b, "AI video production pipeline in eight steps")

b = ""
b += box(20, 120, 170, 90, "Browser", "Next.js pages, React")
b += box(270, 120, 190, 90, "Server / API", "route handlers, actions", fill="f-aura-soft", stroke="s-aura")
b += box(560, 40, 190, 70, "Database", "Supabase Postgres")
b += box(560, 130, 190, 70, "Auth", "Supabase Auth")
b += box(560, 220, 190, 70, "Storage", "files, images")
b += arrow(190, 155, 268, 155, aura=True); b += arrow(268, 180, 192, 180)
b += text(229, 145, "request", "t-sm f-ink3", "middle"); b += text(229, 200, "JSON", "t-sm f-ink3", "middle")
for y in (75, 165, 255):
    b += arrow(460, 165, 558, y)
b += f'<rect x="20" y="320" width="730" height="54" rx="10" class="f-panel2"/>'
b += text(40, 352, "GitHub repo  →  Vercel builds and hosts it  →  yourapp.com", "t-md f-ink")
figs["ai-stack"] = svg(770, 390, b, "Architecture of a full-stack web app")

b = ""
b += f'<rect x="20" y="40" width="250" height="260" rx="14" class="f-aura-soft"/><rect x="20" y="40" width="250" height="260" rx="14" class="s-aura" stroke-width="1.2"/>'
b += text(40, 70, "HOST APP", "t-sm f-aura")
b += text(40, 96, "Claude, Claude Code, Cursor…", "t-md f-ink")
for i, nm in enumerate(("MCP client", "MCP client", "MCP client")):
    b += box(40, 120 + i * 58, 210, 46, nm, "", fill="f-panel", tcls="t-sm f-ink2")
srv = [("GitHub server", "tools: create_issue…"), ("Google Drive server", "resources: your files"), ("Your own server", "tools: get_orders()")]
for i, (t1, t2) in enumerate(srv):
    y = 116 + i * 58
    b += f'<path d="M250 {y + 27} L438 {y + 27}" class="s-ink" stroke-width="1.4" marker-end="url(#ah)" marker-start="url(#ah)"/>'
    b += box(440, y, 200, 50, t1, t2)
    b += f'<path d="M640 {y + 25} H684" class="s-line" stroke-width="1.2"/>'
    b += f'<rect x="684" y="{y + 10}" width="60" height="30" rx="6" class="f-panel2"/>'
b += text(714, 141, "API", "t-sm f-ink3", "middle"); b += text(714, 199, "files", "t-sm f-ink3", "middle"); b += text(714, 257, "DB", "t-sm f-ink3", "middle")
b += text(345, 100, "MCP (JSON-RPC)", "t-sm f-ink3", "middle")
b += text(20, 336, "One standard plug: any MCP host can use any MCP server's tools, resources and prompts.", "t-md f-ink2")
figs["ai-mcp"] = svg(770, 350, b, "How the Model Context Protocol connects AI apps to tools")

b = ""
loop = [("Draft", 140, 60), ("Review", 360, 210), ("Refine", -80, 210)]
b += box(300, 30, 170, 64, "1  Ask", "clear prompt")
b += box(520, 160, 170, 64, "2  Review", "what's wrong or missing?")
b += box(80, 160, 170, 64, "3  Refine", "say exactly what to change")
b += arrow(470, 70, 600, 158, curve=(590, 70)); b += arrow(520, 200, 252, 200); b += arrow(160, 158, 298, 70, curve=(170, 70))
b += text(385, 280, "Good results come from two or three rounds, not one perfect prompt.", "t-md f-ink2", "middle")
figs["ai-loop"] = svg(770, 300, b, "The ask, review, refine loop")

# ---------------------------------------------------------------- WEB
b = ""
b += f'<rect x="20" y="20" width="250" height="300" rx="12" class="f-panel"/><rect x="20" y="20" width="250" height="300" rx="12" class="s-line" stroke-width="1.2"/>'
b += text(40, 50, "ember/", "t-sm f-aura")
files = [("index.html", "the page"), ("images/", "your photos go here"), ("README.txt", "notes + licence")]
for i, (f, d) in enumerate(files):
    b += text(56, 86 + i * 40, f, "t-md f-ink"); b += text(56, 104 + i * 40, d, "t-sm f-ink3")
b += f'<rect x="40" y="220" width="210" height="80" rx="8" class="f-aura-soft"/>'
b += text(54, 246, ":root {", "t-sm f-ink"); b += text(70, 266, "--accent: #c8553d;", "t-sm f-ink2"); b += text(70, 284, "--font-display: …", "t-sm f-ink2")
b += arrow(270, 260, 338, 260, aura=True)
secs = ["Navigation", "Hero", "About / features", "Menu / services / gallery", "Testimonials (your real ones)", "Contact + map link", "Footer"]
for i, s in enumerate(secs):
    b += box(340, 20 + i * 44, 400, 36, s, "", fill="f-aura-soft" if i == 1 else "f-panel", tcls="t-md f-ink", align="start", r=6)
figs["web-anatomy"] = svg(760, 340, b, "Anatomy of a template: files and page sections")

b = ""
b += box(20, 120, 180, 70, "yourbusiness.com", "bought at a registrar")
b += box(290, 40, 210, 70, "A record  @", "→ host's IP address", fill="f-aura-soft", stroke="s-aura")
b += box(290, 180, 210, 70, "CNAME  www", "→ host's domain", fill="f-aura-soft", stroke="s-aura")
b += box(580, 110, 170, 90, "Vercel / Netlify", "serves your files + HTTPS")
b += arrow(200, 145, 288, 80); b += arrow(200, 165, 288, 212)
b += arrow(500, 75, 578, 140); b += arrow(500, 215, 578, 172)
b += text(385, 290, "Values come from your host's domain screen. Changes take minutes to 48 hours.", "t-md f-ink2", "middle")
figs["web-dns"] = svg(770, 310, b, "How a custom domain points to your website host")


# ---------------------------------------------------------------- DIGITAL MARKETING
import math as _m

# funnel
b = ""
stages = [("Awareness", "Reels, TikTok, ads, PR, creators", "reach, views"),
          ("Interest", "Posts, blog, YouTube, Google search", "engagement, clicks"),
          ("Consideration", "Reviews, case studies, retargeting", "saves, leads"),
          ("Conversion", "Landing pages, Google Ads, offers", "conversion rate, CPA"),
          ("Loyalty", "Email, SMS, reviews, referrals", "repeat rate, LTV")]
for i, (st, ch, kpi) in enumerate(stages):
    w = 400 - i * 60
    x = 70 + (400 - w) / 2
    y = 20 + i * 62
    last = i == len(stages) - 1
    b += f'<rect x="{x}" y="{y}" width="{w}" height="52" rx="8" class="{"f-aura" if last else ("f-aura-soft" if i == 3 else "f-panel2")}"/>'
    b += f'<text x="270" y="{y + 32}" text-anchor="middle" class="t-md {"f-bg" if last else "f-ink"}" font-weight="700">{st}</text>'
    b += f'<path d="M{x + w + 6} {y + 26} H500" class="s-line" stroke-width="1" stroke-dasharray="3 4"/>'
    b += text(510, y + 22, ch, "t-md f-ink")
    b += text(510, y + 42, kpi.upper(), "t-sm f-ink3")
b += '<path d="M102 304 C 44 262, 44 70, 92 40" class="s-aura" stroke-width="1.6" stroke-dasharray="5 5" fill="none" marker-end="url(#aa)"/>'
b += '<text x="34" y="172" transform="rotate(-90 34 172)" text-anchor="middle" class="t-sm f-aura">REFERRALS</text>'
figs["dm-funnel"] = svg(840, 340, b, "Marketing funnel with channels and metrics for each stage")

# how search works
b = ""
steps = [("Crawl", "Googlebot follows links", "Sitemap, internal|links, robots.txt"),
         ("Index", "Reads and stores pages", "noindex tags, canonicals,|thin content"),
         ("Rank", "Picks the best answers", "Relevance, quality,|links, speed"),
         ("Results", "What searchers see", "Titles, snippets,|map pack, AI answers")]
for i, (t1, t2, fix) in enumerate(steps):
    x = 20 + i * 190
    b += box(x, 30, 160, 80, t1, t2, fill="f-aura-soft" if i == 2 else "f-panel", stroke="s-aura" if i == 2 else "s-line")
    if i < 3:
        b += arrow(x + 160, 70, x + 188, 70, aura=True)
    b += text(x + 80, 140, "IF IT BREAKS, CHECK", "t-sm f-ink3", "middle")
    f1, f2 = fix.split("|")
    b += text(x + 80, 162, f1, "t-sm f-ink2", "middle")
    b += text(x + 80, 180, f2, "t-sm f-ink2", "middle")
figs["dm-search"] = svg(780, 196, b, "How search engines crawl, index and rank pages")

# SERP anatomy
b = '<rect x="20" y="10" width="470" height="470" rx="12" class="f-bg"/><rect x="20" y="10" width="470" height="470" rx="12" class="s-ink" stroke-width="1.2"/>'
b += '<rect x="40" y="28" width="430" height="34" rx="17" class="f-panel2"/>'
b += text(58, 50, "emergency plumber london ontario", "t-md f-ink")
rows = []
y = 78
b += f'<rect x="40" y="{y}" width="430" height="58" rx="8" class="f-panel"/><rect x="40" y="{y}" width="430" height="58" rx="8" class="s-line"/>'
b += text(54, y + 20, "Sponsored", "t-sm f-ink3") + f'<rect x="54" y="{y + 30}" width="250" height="9" rx="3" class="f-ink2"/><rect x="54" y="{y + 44}" width="330" height="6" rx="3" class="f-ink3"/>'
rows.append((y + 29, "1  Ads (Google Ads, Local Services Ads)"))
y = 146
b += f'<rect x="40" y="{y}" width="430" height="70" rx="8" class="f-aura-soft"/>'
b += text(54, y + 20, "AI Overview", "t-sm f-aura") + f'<rect x="54" y="{y + 30}" width="380" height="6" rx="3" class="f-ink3"/><rect x="54" y="{y + 42}" width="340" height="6" rx="3" class="f-ink3"/><rect x="54" y="{y + 54}" width="200" height="6" rx="3" class="f-ink3"/>'
rows.append((y + 35, "2  AI answer that cites sources"))
y = 226
b += f'<rect x="40" y="{y}" width="430" height="110" rx="8" class="f-panel"/><rect x="40" y="{y}" width="430" height="110" rx="8" class="s-line"/>'
b += f'<rect x="330" y="{y + 10}" width="130" height="90" rx="6" class="f-panel2"/>'
for k in range(3):
    b += f'<circle cx="{360 + k * 30}" cy="{y + 40 + (k % 2) * 25}" r="6" class="f-aura"/>'
    b += f'<rect x="54" y="{y + 14 + k * 32}" width="160" height="8" rx="3" class="f-ink2"/><text x="54" y="{y + 36 + k * 32}" class="t-sm f-warn">★★★★★</text>'
rows.append((y + 55, "3  Map pack (Google Business Profile)"))
y = 346
b += f'<rect x="54" y="{y}" width="200" height="6" rx="3" class="f-ink3"/>'
b += f'<text x="54" y="{y + 24}" class="t-md f-aura" font-weight="700">Emergency Plumber London ON · 24/7</text>'
b += f'<rect x="54" y="{y + 34}" width="380" height="6" rx="3" class="f-ink3"/><rect x="54" y="{y + 46}" width="300" height="6" rx="3" class="f-ink3"/>'
rows.append((y + 20, "4  Organic result: URL, title tag, description"))
y = 412
for k in range(2):
    b += f'<rect x="40" y="{y + k * 26}" width="430" height="22" rx="5" class="f-panel2"/><rect x="52" y="{y + 8 + k * 26}" width="{220 - k * 40}" height="6" rx="3" class="f-ink3"/>'
rows.append((y + 22, "5  People also ask (questions to answer)"))
for yy, lab in rows:
    b += f'<path d="M476 {yy} H512" class="s-aura" stroke-width="1" stroke-dasharray="2 3"/><circle cx="512" cy="{yy}" r="3" class="f-aura"/>'
    b += text(522, yy + 5, lab, "t-md f-ink2")
figs["dm-serp"] = svg(820, 490, b, "Anatomy of a Google search results page")

# topic cluster
b = ""
lines = [((240, 53), (290, 160)), ((240, 163), (290, 172)), ((240, 273), (290, 184)), ((400, 66), (380, 140)), ((400, 270), (380, 204))]
for (x1, y1), (x2, y2) in lines:
    b += f'<path d="M{x1} {y1} L{x2} {y2}" class="s-ink" stroke-width="1.2"/>'
b += box(290, 140, 180, 64, "Pillar page", "Water heaters in London", fill="f-aura-soft", stroke="s-aura")
b += f'<rect x="560" y="140" width="170" height="64" rx="12" class="f-aura"/>'
b += text(645, 168, "Money page", "t-md f-bg", "middle") + text(645, 188, "/water-heaters/", "t-sm f-bg", "middle")
b += arrow(470, 172, 558, 172, aura=True)
for name, x, y in [("Tankless vs tank", 40, 30), ("What size do I need?", 40, 140), ("Making noise? 6 causes", 40, 250), ("How long do they last?", 300, 20), ("Rent or buy in Ontario?", 300, 270)]:
    b += box(x, y, 200, 46, name, "", fill="f-panel", tcls="t-sm f-ink2", r=8)
b += text(380, 340, "Every cluster links to the pillar and the money page; the pillar links back.", "t-md f-ink2", "middle")
figs["dm-cluster"] = svg(760, 355, b, "Topic cluster with a pillar page, cluster articles and a money page")

# scraping pipeline
b = ""
steps = [("1 Request", "requests.get(url)"), ("2 HTML", "<p class=\"price\">"), ("3 Select", "soup.select(\".price\")"), ("4 Clean", "trim, fix, dedupe"), ("5 Save", "CSV / Google Sheets")]
for i, (t1, t2) in enumerate(steps):
    x = 16 + i * 152
    b += box(x, 30, 132, 76, t1, "", fill="f-aura-soft" if i == 2 else "f-panel", stroke="s-aura" if i == 2 else "s-line", tcls="t-md f-ink")
    b += f'<text x="{x + 66}" y="128" text-anchor="middle" class="t-sm f-ink3" font-family="ui-monospace, Menlo, monospace">{e(t2)}</text>'
    if i < 4:
        b += arrow(x + 132, 68, x + 150, 68, aura=True)
b += text(16, 170, "Rules at every step: robots.txt, terms of service, slow requests, no personal data you don't need.", "t-md f-ink2")
figs["dm-scrape"] = svg(780, 186, b, "The five steps of web scraping")

# content pillars stacked bar (to scale: 6.2 px per percent)
b = text(30, 30, "A TYPICAL MONTHLY MIX", "t-sm f-ink3")
mix = [("Educate", 35, "f-aura", "Tips, how-tos, myths"), ("People", 25, "f-aura-soft", "Team, behind scenes"), ("Proof", 20, "f-panel2", "Reviews, results"), ("Promote", 20, "f-ink3", "Offers, launches")]
x = 30
for name, pct, cls, ex in mix:
    w = pct * 6.2
    b += f'<rect x="{x:.1f}" y="46" width="{w - 3:.1f}" height="56" rx="6" class="{cls}"/>'
    b += f'<text x="{x + 12:.1f}" y="80" class="t-md {"f-bg" if cls in ("f-aura", "f-ink3") else "f-ink"}" font-weight="700">{pct}%</text>'
    b += text(x + 2, 130, name.upper(), "t-sm f-ink")
    b += text(x + 2, 150, ex, "t-sm f-ink3")
    x += w
b += f'<path d="M30 112 V118 M{30 + 620} 112 V118" class="s-line" stroke-width="1"/>'
figs["dm-pillars"] = svg(680, 168, b, "Content pillar mix: educate 35 percent, people 25, proof 20, promote 20")

# tracking flow
b = ""
b += box(20, 40, 170, 80, "UTM link", "?utm_source=instagram", fill="f-panel")
b += box(230, 40, 150, 80, "Visit", "GA4 session + source", fill="f-panel")
b += box(420, 40, 150, 80, "Key event", "lead · call · order", fill="f-aura-soft", stroke="s-aura")
b += box(610, 40, 150, 80, "Dashboard", "Looker Studio", fill="f-aura", stroke="s-aura", tcls="t-md f-bg")
b = b.replace('<text x="685.0" y="96.0" text-anchor="middle" class="t-sm f-ink3">', '<text x="685.0" y="96.0" text-anchor="middle" class="t-sm f-bg">')
b += arrow(190, 80, 228, 80, aura=True) + arrow(380, 80, 418, 80, aura=True) + arrow(570, 80, 608, 80, aura=True)
b += box(400, 170, 190, 64, "Tag Manager", "phone click, form submit", fill="f-panel2")
b += arrow(495, 170, 495, 122)
b += box(610, 170, 150, 64, "Also connect", "Search Console, Ads", fill="f-panel2")
b += arrow(685, 170, 685, 122)
figs["dm-tracking"] = svg(780, 250, b, "Tracking flow from UTM links to GA4 key events to a Looker Studio dashboard")

# client lifecycle
b = ""
nodes = ["Prospect", "Mini audit", "Call + proposal", "Onboard", "Deliver", "Report", "Renew + upsell"]
cx, cy, rx, ry = 380, 175, 280, 130
pos = []
for i, n in enumerate(nodes):
    a = _m.pi + i * (2 * _m.pi / len(nodes))
    pos.append((cx + rx * _m.cos(a), cy + ry * _m.sin(a)))
for i in range(len(nodes)):
    x1, y1 = pos[i]
    x2, y2 = pos[(i + 1) % len(nodes)]
    if i == len(nodes) - 1:
        x2, y2 = pos[4]
    dx, dy = x2 - x1, y2 - y1
    d = (dx * dx + dy * dy) ** 0.5
    sx, sy = x1 + dx / d * 70, y1 + dy / d * 30
    ex, ey = x2 - dx / d * 72, y2 - dy / d * 32
    b += arrow(round(sx), round(sy), round(ex), round(ey), aura=i >= 4, dash=i == len(nodes) - 1 and False)
for i, (x, y) in enumerate(pos):
    hot = i >= 4
    b += box(round(x - 66), round(y - 24), 132, 48, nodes[i], "", fill="f-aura-soft" if hot else "f-panel", stroke="s-aura" if hot else "s-line", tcls="t-sm f-ink", r=10)
b += text(cx, cy - 6, "Retention lives", "t-md f-ink2", "middle") + text(cx, cy + 16, "in the coloured loop", "t-md f-ink2", "middle")
figs["dm-lifecycle"] = svg(760, 350, b, "Agency client lifecycle from prospect to renewal")

for name, s in figs.items():
    (OUT / f"{name}.svg").write_text(s)
print(f"wrote {len(figs)} figures")
