"""Print illustrations for the Recipe Vault (inline SVG with explicit colours)."""

INK = "#1f1a16"
MUTED = "#8a8076"
LINE = "#d9d0c4"
PAPER = "#fffdf9"
CREAM = "#f3ebdf"


def _svg(w, h, body):
    return f'<svg viewBox="0 0 {w} {h}" xmlns="http://www.w3.org/2000/svg" font-family="Schibsted Grotesk, Arial, sans-serif">{body}</svg>'


def _t(x, y, s, size=11, fill=INK, anchor="start", weight=400, mono=False):
    fam = ' font-family="Martian Mono, monospace"' if mono else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}"{fam}>{s}</text>'


# ------------------------------------------------------------------ covers (light strokes on colour)
def cover_cake():
    c = "#fff8ef"
    b = ""
    b += f'<ellipse cx="300" cy="470" rx="250" ry="34" fill="none" stroke="{c}" stroke-opacity=".5" stroke-width="2"/>'
    b += f'<path d="M80 470 L120 440 L480 440 L520 470" fill="none" stroke="{c}" stroke-width="2"/>'
    b += f'<rect x="150" y="300" width="300" height="140" rx="8" fill="{c}" fill-opacity=".12" stroke="{c}" stroke-width="2"/>'
    for y in (340, 380, 410):
        b += f'<line x1="150" y1="{y}" x2="450" y2="{y}" stroke="{c}" stroke-opacity=".55" stroke-width="1.5" stroke-dasharray="6 6"/>'
    b += f'<path d="M150 312 Q150 300 162 300 L438 300 Q450 300 450 312 L450 330 Q440 330 437 352 Q434 366 428 352 Q424 330 410 334 L390 334 Q380 334 378 362 Q376 376 370 362 Q366 334 350 334 L300 334 Q288 334 286 366 Q284 380 278 366 Q274 334 260 334 L230 334 Q218 334 216 352 Q214 362 208 352 Q204 334 190 334 L170 334 Q160 334 158 348 Q156 356 152 348 Z" fill="{c}" fill-opacity=".9"/>'
    b += f'<rect x="200" y="210" width="200" height="90" rx="6" fill="{c}" fill-opacity=".12" stroke="{c}" stroke-width="2"/>'
    for x in (230, 270, 310, 350, 380):
        b += f'<circle cx="{x}" cy="222" r="10" fill="none" stroke="{c}" stroke-width="2"/>'
    b += f'<rect x="296" y="150" width="8" height="58" rx="3" fill="{c}"/>'
    b += f'<path d="M300 110 C286 128 290 146 300 146 C310 146 314 128 300 110Z" fill="{c}"/>'
    return _svg(600, 520, b)


def cover_keto():
    c = "#fff8ef"
    b = f'<circle cx="300" cy="270" r="210" fill="none" stroke="{c}" stroke-width="2"/>'
    b += f'<circle cx="300" cy="270" r="170" fill="{c}" fill-opacity=".1" stroke="{c}" stroke-opacity=".5" stroke-width="1.5"/>'
    b += f'<path d="M300 270 L300 100 A170 170 0 1 1 152 353 Z" fill="{c}" fill-opacity=".85"/>'
    b += f'<path d="M300 270 L152 353 A170 170 0 0 1 248 108 Z" fill="{c}" fill-opacity=".45"/>'
    b += f'<path d="M300 270 L248 108 A170 170 0 0 1 300 100 Z" fill="{c}" fill-opacity=".2"/>'
    b += _t(380, 300, "FAT", 18, c, weight=600, mono=True).replace(f'fill="{c}"', 'fill="#2f6b4f"')
    b += _t(190, 260, "PROTEIN", 14, c, weight=600, mono=True)
    return _svg(600, 520, b)


def cover_know():
    c = "#fff8ef"
    b = f'<rect x="120" y="80" width="340" height="420" rx="6" fill="{c}" fill-opacity=".1" stroke="{c}" stroke-width="2"/>'
    b += _t(144, 130, "Nutrition Facts", 26, c, weight=700)
    b += f'<line x1="144" y1="146" x2="436" y2="146" stroke="{c}" stroke-width="6"/>'
    rows = ["Calories", "Fat", "Carbohydrate", "Fibre", "Sugars", "Protein", "Sodium"]
    for i, r in enumerate(rows):
        y = 186 + i * 40
        b += _t(144, y, r, 16, c, weight=600 if i == 0 else 400)
        b += f'<rect x="{330 + (i * 13) % 50}" y="{y - 13}" width="{70 - (i * 13) % 50}" height="12" rx="3" fill="{c}" fill-opacity=".5"/>'
        b += f'<line x1="144" y1="{y + 14}" x2="436" y2="{y + 14}" stroke="{c}" stroke-opacity=".45" stroke-width="1.2"/>'
    return _svg(600, 560, b)


def cover_quick():
    c = "#fff8ef"
    b = ""
    days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    for i, d in enumerate(days):
        x = 60 + (i % 4) * 128
        y = 90 + (i // 4) * 170
        b += f'<rect x="{x}" y="{y}" width="112" height="150" rx="10" fill="{c}" fill-opacity="{.85 if i == 0 else .12}" stroke="{c}" stroke-width="1.6"/>'
        b += _t(x + 14, y + 28, d, 12, "#b45f1d" if i == 0 else c, weight=600, mono=True)
        for k in range(3):
            b += f'<rect x="{x + 14}" y="{y + 48 + k * 30}" width="{84 - k * 14}" height="9" rx="4" fill="{"#b45f1d" if i == 0 else c}" fill-opacity="{.6 if i == 0 else .5}"/>'
    b += f'<circle cx="508" cy="330" r="40" fill="none" stroke="{c}" stroke-width="2"/><path d="M508 302 V330 L526 342" stroke="{c}" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    return _svg(600, 460, b)


# ------------------------------------------------------------------ cake
def cake_layers():
    b = ""
    x0, w = 70, 330
    b += f'<rect x="30" y="252" width="410" height="10" rx="3" fill="{LINE}"/>'
    b += f'<rect x="{x0 - 14}" y="74" width="{w + 28}" height="178" rx="8" fill="#f7eee6" stroke="{INK}" stroke-width="1.2"/>'
    b += f'<rect x="{x0 - 6}" y="82" width="{w + 12}" height="170" rx="5" fill="#fbf3ec"/>'
    layers = [(200, 52, "#e9d2b5"), (190, 10, "#c9586d"), (138, 52, "#e9d2b5"), (128, 10, "#c9586d"), (88, 40, "#e9d2b5")]
    for y, h, col in layers:
        b += f'<rect x="{x0}" y="{y}" width="{w}" height="{h}" fill="{col}"/>'
    for y in (190, 128):
        b += f'<rect x="{x0}" y="{y}" width="16" height="10" fill="#fbf3ec" stroke="{INK}" stroke-width=".6"/>'
        b += f'<rect x="{x0 + w - 16}" y="{y}" width="16" height="10" fill="#fbf3ec" stroke="{INK}" stroke-width=".6"/>'
    targets = [(78, "Final coat, smoothed with a scraper"), (85, "Crumb coat underneath, chilled first"), (108, "Top layer, cut side down for a flat top"), (133, "Filling inside a buttercream dam"), (164, "Cake layer, levelled"), (195, "Filling"), (226, "Bottom layer on a dab of frosting")]
    lx = x0 + w + 40
    for i, (ty, s) in enumerate(targets):
        ly = 70 + i * 30
        tx = x0 + w + (14 if ty < 90 else 0) - (8 if i == 1 else 0)
        b += f'<path d="M{tx} {ty} L{lx - 8} {ly}" stroke="{MUTED}" stroke-width=".8" fill="none"/><circle cx="{tx}" cy="{ty}" r="2.2" fill="{INK}"/>'
        b += _t(lx, ly + 4, s, 10.5, INK)
    b += _t(30, 284, "CAKE BOARD: SAME SIZE AS THE CAKE FOR STACKING, 2 IN WIDER FOR DISPLAY", 8.5, MUTED, mono=True)
    return _svg(720, 296, b)


def piping_tips():
    tips = [
        ("Round #12", "dots, pearls, writing, borders", "round"),
        ("Open star 1M", "rosettes, swirls, cupcakes", "open"),
        ("Closed star 2D", "drop flowers, deep ridges", "closed"),
        ("Petal #104", "ruffles, roses, swags", "petal"),
        ("Leaf #352", "leaves for flowers", "leaf"),
        ("French star 6B", "soft ridged swirls", "french"),
    ]
    b = ""
    for i, (name, use, kind) in enumerate(tips):
        x = 20 + (i % 3) * 236
        y = 16 + (i // 3) * 130
        cx, cy = x + 46, y + 46
        b += f'<circle cx="{cx}" cy="{cy}" r="38" fill="{CREAM}" stroke="{INK}" stroke-width="1.2"/>'
        if kind == "round":
            b += f'<circle cx="{cx}" cy="{cy}" r="13" fill="{PAPER}" stroke="{INK}" stroke-width="1.4"/>'
        elif kind in ("open", "closed", "french"):
            n = 8 if kind == "open" else (7 if kind == "closed" else 10)
            ro, ri = (20, 10) if kind == "open" else ((18, 6) if kind == "closed" else (19, 15))
            import math
            pts = []
            for k in range(n * 2):
                r = ro if k % 2 == 0 else ri
                a = math.pi * k / n - math.pi / 2
                pts.append(f"{cx + r * math.cos(a):.1f},{cy + r * math.sin(a):.1f}")
            b += f'<polygon points="{" ".join(pts)}" fill="{PAPER}" stroke="{INK}" stroke-width="1.4"/>'
        elif kind == "petal":
            b += f'<path d="M{cx - 18} {cy + 8} Q{cx} {cy - 6} {cx + 18} {cy - 14}" stroke="{INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M{cx - 18} {cy + 8} Q{cx} {cy - 6} {cx + 18} {cy - 14}" stroke="{PAPER}" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
        elif kind == "leaf":
            b += f'<path d="M{cx - 18} {cy} L{cx} {cy - 9} L{cx + 18} {cy} L{cx} {cy + 9} Z" fill="{PAPER}" stroke="{INK}" stroke-width="1.4"/>'
        b += _t(x + 98, y + 38, name, 12, INK, weight=700)
        b += _t(x + 98, y + 56, use, 9.5, MUTED)
    return _svg(720, 272, b)


def tiers():
    b = f'<rect x="60" y="300" width="400" height="10" rx="3" fill="{LINE}"/>'
    b += f'<rect x="90" y="190" width="340" height="110" rx="6" fill="#f2e6d8" stroke="{INK}" stroke-width="1.2"/>'
    b += f'<rect x="160" y="184" width="200" height="6" fill="{MUTED}"/>'
    b += f'<rect x="170" y="94" width="180" height="90" rx="6" fill="#f2e6d8" stroke="{INK}" stroke-width="1.2"/>'
    for x in (180, 230, 290, 340):
        b += f'<rect x="{x - 4}" y="192" width="8" height="106" fill="#c9586d" fill-opacity=".85"/>'
    b += f'<rect x="256" y="70" width="8" height="232" fill="{INK}" fill-opacity=".55"/>'
    notes = [(80, "Optional centre dowel through both tiers, for transport"), (140, "Top tier sits on its own cake board"), (188, "Board the same size as the top tier"), (240, "4–6 dowels cut to the exact height of the bottom tier"), (300, "Bottom tier on a sturdy drum, 2–4 in wider")]
    for y, s in notes:
        b += f'<line x1="440" y1="{y}" x2="470" y2="{y}" stroke="{MUTED}" stroke-width=".8"/>'
        b += _t(476, y + 4, s, 10.5, INK)
    return _svg(760, 320, b)


def tool_icon(kind, x, y):
    s = f'stroke="{INK}" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"'
    if kind == "turntable":
        return f'<g transform="translate({x} {y})"><ellipse cx="30" cy="16" rx="28" ry="8" {s}/><path d="M2 16 v4 a28 8 0 0 0 56 0 v-4" {s}/><path d="M24 26 v10 M36 26 v10 M16 38 h28" {s}/></g>'
    if kind == "offset":
        return f'<g transform="translate({x} {y})"><path d="M6 36 L22 28 L28 20 L56 6" {s}/><rect x="0" y="32" width="14" height="8" rx="2" transform="rotate(-25 7 36)" {s}/></g>'
    if kind == "scraper":
        return f'<g transform="translate({x} {y})"><rect x="8" y="4" width="44" height="34" rx="4" {s}/><path d="M8 30 H52" {s}/></g>'
    if kind == "leveler":
        return f'<g transform="translate({x} {y})"><path d="M6 38 V6 M54 38 V6 M6 22 H54" {s}/><path d="M6 22 l3 -2 l3 2 l3 -2 l3 2 l3 -2 l3 2 l3 -2 l3 2 l3 -2 l3 2 l3 -2 l3 2 l3 -2 l3 2 l3 -2" {s}/></g>'
    if kind == "bag":
        return f'<g transform="translate({x} {y})"><path d="M10 4 H50 L34 32 H26 Z" {s}/><path d="M26 32 L28 40 H32 L34 32" {s}/></g>'
    if kind == "tips":
        return f'<g transform="translate({x} {y})"><path d="M8 34 L14 8 H24 L30 34 Z M34 34 L40 8 H50 L56 34 Z" {s}/><path d="M17 8 l2 -4 l2 4 M43 8 l2 -4 l2 4" {s}/></g>'
    if kind == "board":
        return f'<g transform="translate({x} {y})"><ellipse cx="30" cy="22" rx="26" ry="14" {s}/><ellipse cx="30" cy="22" rx="18" ry="9" {s} stroke-dasharray="3 3"/></g>'
    if kind == "dowel":
        return f'<g transform="translate({x} {y})"><path d="M10 6 V38 M22 6 V38 M34 6 V38 M46 6 V38" {s} stroke-width="3"/></g>'
    if kind == "pans":
        return f'<g transform="translate({x} {y})"><ellipse cx="30" cy="12" rx="26" ry="7" {s}/><path d="M4 12 V28 a26 7 0 0 0 52 0 V12" {s}/></g>'
    if kind == "scale":
        return f'<g transform="translate({x} {y})"><rect x="6" y="14" width="48" height="24" rx="4" {s}/><rect x="16" y="20" width="22" height="9" rx="2" {s}/><ellipse cx="30" cy="10" rx="20" ry="4" {s}/></g>'
    if kind == "thermo":
        return f'<g transform="translate({x} {y})"><rect x="14" y="6" width="32" height="32" rx="6" {s}/><circle cx="30" cy="22" r="10" {s}/><path d="M30 22 L36 16" {s}/></g>'
    if kind == "smoother":
        return f'<g transform="translate({x} {y})"><rect x="8" y="22" width="44" height="14" rx="4" {s}/><path d="M22 22 Q30 6 38 22" {s}/></g>'
    if kind == "mixer":
        return f'<g transform="translate({x} {y})"><path d="M10 38 H52 M16 38 V30 H46 V38 M20 30 Q20 18 31 18 Q42 18 42 30 M30 18 V6 H50 V14" {s}/></g>'
    if kind == "spatula":
        return f'<g transform="translate({x} {y})"><path d="M30 4 V22" {s} stroke-width="3"/><path d="M20 22 H40 V34 Q30 42 20 34 Z" {s}/></g>'
    if kind == "rack":
        return f'<g transform="translate({x} {y})"><rect x="6" y="8" width="48" height="28" rx="3" {s}/><path d="M6 15 H54 M6 22 H54 M6 29 H54 M18 8 V36 M30 8 V36 M42 8 V36" {s} stroke-width="1"/></g>'
    if kind == "colour":
        return f'<g transform="translate({x} {y})"><path d="M14 14 h12 v22 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2z M34 14 h12 v22 a2 2 0 0 1 -2 2 h-8 a2 2 0 0 1 -2 -2z M17 14 V8 h6 v6 M37 14 V8 h6 v6" {s}/></g>'
    return ""


def tools_grid():
    items = [("turntable", "Turntable"), ("offset", "Offset spatula"), ("scraper", "Bench scraper"), ("leveler", "Cake leveler"),
             ("bag", "Piping bags"), ("tips", "Piping tips + coupler"), ("board", "Cake boards"), ("dowel", "Dowels / straws"),
             ("pans", "Straight-sided pans"), ("scale", "Digital scale"), ("thermo", "Oven thermometer"), ("smoother", "Fondant smoother"),
             ("mixer", "Stand or hand mixer"), ("spatula", "Silicone spatula"), ("rack", "Cooling rack"), ("colour", "Gel colours")]
    b = ""
    for i, (k, label) in enumerate(items):
        x = 10 + (i % 4) * 180
        y = 10 + (i // 4) * 96
        b += f'<rect x="{x}" y="{y}" width="168" height="84" rx="8" fill="{CREAM}"/>'
        b += tool_icon(k, x + 54, y + 6)
        b += _t(x + 84, y + 70, label, 10.5, INK, "middle", 600)
    return _svg(730, 396, b)


# ------------------------------------------------------------------ keto
def keto_split():
    import math
    b = ""
    cx, cy, r = 120, 120, 100
    segs = [(.72, "#2f6b4f", "Fat ~70–75%"), (.22, "#7fae93", "Protein ~20%"), (.06, "#c9dccf", "Carbs ~5–10%")]
    a0 = -math.pi / 2
    for frac, col, lab in segs:
        a1 = a0 + frac * 2 * math.pi
        large = 1 if frac > .5 else 0
        b += f'<path d="M{cx} {cy} L{cx + r * math.cos(a0):.1f} {cy + r * math.sin(a0):.1f} A{r} {r} 0 {large} 1 {cx + r * math.cos(a1):.1f} {cy + r * math.sin(a1):.1f} Z" fill="{col}" stroke="{PAPER}" stroke-width="2"/>'
        a0 = a1
    for i, (frac, col, lab) in enumerate(segs):
        y = 70 + i * 40
        b += f'<rect x="260" y="{y - 13}" width="16" height="16" rx="3" fill="{col}"/>'
        b += _t(286, y, lab, 13, INK, weight=600)
    b += _t(260, 200, "Typical split of daily calories. Many people", 10.5, MUTED)
    b += _t(260, 216, "simply keep net carbs under 20–50 g a day.", 10.5, MUTED)
    return _svg(560, 240, b)


# ------------------------------------------------------------------ know your food
def balanced_plate():
    b = f'<circle cx="150" cy="140" r="120" fill="{CREAM}" stroke="{INK}" stroke-width="1.4"/>'
    b += f'<circle cx="150" cy="140" r="104" fill="#ffffff" stroke="{LINE}" stroke-width="1"/>'
    b += f'<path d="M150 140 L150 36 A104 104 0 0 0 150 244 Z" fill="#9fc79a"/>'
    b += f'<path d="M150 140 L150 36 A104 104 0 0 1 254 140 Z" fill="#e7b46b"/>'
    b += f'<path d="M150 140 L254 140 A104 104 0 0 1 150 244 Z" fill="#d9826c"/>'
    b += _t(96, 146, "Vegetables", 12, INK, "middle", 700) + _t(96, 162, "& fruits", 12, INK, "middle", 700)
    b += _t(196, 104, "Whole", 11, INK, "middle", 700) + _t(196, 118, "grains", 11, INK, "middle", 700)
    b += _t(196, 182, "Protein", 11, INK, "middle", 700) + _t(196, 196, "foods", 11, INK, "middle", 700)
    b += f'<rect x="300" y="60" width="30" height="80" rx="8" fill="#dde6f6" stroke="{INK}" stroke-width="1.2"/>'
    b += _t(315, 160, "Water", 11, INK, "middle", 700)
    rows = [("½ plate", "vegetables and fruits"), ("¼ plate", "whole-grain foods"), ("¼ plate", "protein foods"), ("Drink", "water most of the time")]
    for i, (a, s) in enumerate(rows):
        b += _t(370, 80 + i * 34, a, 13, "#2f62b8", weight=700)
        b += _t(440, 80 + i * 34, s, 12, INK)
    return _svg(660, 270, b)


def hand_portions():
    items = [("Palm", "Protein", "meat, fish, tofu", "palm"), ("Fist", "Carbs", "rice, pasta, cereal", "fist"), ("Cupped hand", "Fruit, snacks", "berries, nuts (½ hand)", "cup"), ("Thumb", "Fats", "butter, oil, nut butter", "thumb"), ("Two hands", "Vegetables", "salad, cooked veg", "two")]
    b = ""
    for i, (h, g, ex, kind) in enumerate(items):
        x = 14 + i * 140
        b += f'<rect x="{x}" y="10" width="128" height="170" rx="10" fill="{CREAM}"/>'
        cx, cy = x + 64, 70
        st = f'fill="#ffffff" stroke="{INK}" stroke-width="1.4"'
        if kind == "palm":
            b += f'<rect x="{cx - 24}" y="{cy - 30}" width="48" height="58" rx="18" {st}/>'
        elif kind == "fist":
            b += f'<circle cx="{cx}" cy="{cy}" r="28" {st}/><path d="M{cx - 18} {cy - 6} H{cx + 18} M{cx - 18} {cy + 6} H{cx + 18}" stroke="{LINE}" stroke-width="1.2"/>'
        elif kind == "cup":
            b += f'<path d="M{cx - 32} {cy - 6} Q{cx} {cy + 44} {cx + 32} {cy - 6} Z" {st}/>'
        elif kind == "thumb":
            b += f'<rect x="{cx - 9}" y="{cy - 30}" width="18" height="56" rx="9" {st}/>'
        else:
            b += f'<path d="M{cx - 44} {cy - 4} Q{cx - 22} {cy + 40} {cx} {cy - 4} Z" {st}/><path d="M{cx} {cy - 4} Q{cx + 22} {cy + 40} {cx + 44} {cy - 4} Z" {st}/>'
        b += _t(cx, 130, h, 12, INK, "middle", 700)
        b += _t(cx, 148, g, 11, "#2f62b8", "middle", 700)
        b += _t(cx, 166, ex, 9, MUTED, "middle")
    return _svg(720, 190, b)


def danger_zone():
    b = f'<rect x="120" y="20" width="44" height="260" rx="22" fill="#ffffff" stroke="{INK}" stroke-width="1.4"/>'
    b += f'<circle cx="142" cy="292" r="30" fill="#d9826c" stroke="{INK}" stroke-width="1.4"/>'
    b += f'<rect x="132" y="120" width="20" height="160" fill="#d9826c"/>'
    zones = [(30, 92, "#e9b9a9", "Hot holding: 60°C / 140°F and above", "Keep hot food hot"), (92, 200, "#f6d9a6", "DANGER ZONE: 4–60°C / 40–140°F", "Bacteria multiply fast; limit to 2 hours"), (200, 260, "#c9dcef", "Fridge: 4°C / 40°F or colder", "Freezer: −18°C / 0°F")]
    for y0, y1, col, a, s in zones:
        b += f'<rect x="200" y="{y0}" width="440" height="{y1 - y0 - 4}" rx="6" fill="{col}"/>'
        b += _t(216, y0 + (y1 - y0) / 2 - 2, a, 12.5, INK, weight=700)
        b += _t(216, y0 + (y1 - y0) / 2 + 16, s, 10.5, INK)
        b += f'<line x1="164" y1="{y0 + 2}" x2="196" y2="{y0 + 2}" stroke="{MUTED}" stroke-width="1"/>'
    return _svg(660, 330, b)


def label_anatomy():
    b = f'<rect x="20" y="10" width="260" height="380" fill="#ffffff" stroke="{INK}" stroke-width="2"/>'
    b += _t(32, 44, "Nutrition Facts", 22, INK, weight=800) + _t(32, 64, "Valeur nutritive", 13, INK, weight=600)
    b += _t(32, 86, "Per 1 cup (250 mL)", 11, INK)
    b += f'<line x1="32" y1="96" x2="268" y2="96" stroke="{INK}" stroke-width="1.2"/>'
    b += _t(32, 124, "Calories 220", 18, INK, weight=800) + _t(268, 108, "% Daily Value*", 9, INK, "end", 700)
    b += f'<line x1="32" y1="134" x2="268" y2="134" stroke="{INK}" stroke-width="4"/>'
    rows = [("Fat 9 g", "12 %"), ("  Saturated 5 g + Trans 0.2 g", "26 %"), ("Carbohydrate 26 g", ""), ("  Fibre 1 g", "4 %"), ("  Sugars 12 g", "12 %"), ("Protein 9 g", ""), ("Cholesterol 25 mg", ""), ("Sodium 430 mg", "19 %"), ("Potassium 350 mg", "7 %"), ("Calcium 290 mg", "22 %"), ("Iron 1 mg", "6 %")]
    for i, (a, p) in enumerate(rows):
        y = 156 + i * 20
        b += _t(32, y, a.replace("  ", " "), 11, INK, weight=700 if not a.startswith("  ") else 400)
        b += _t(268, y, p, 11, INK, "end", 700)
        b += f'<line x1="32" y1="{y + 6}" x2="268" y2="{y + 6}" stroke="{LINE}" stroke-width=".8"/>'
    b += _t(32, 380, "*5% or less is a little, 15% or more is a lot", 8.5, INK)
    notes = [(86, "1  Serving size: all numbers are for this amount"), (124, "2  Calories per serving"), (148, "3  % Daily Value: quick way to judge more or less"), (226, "4  Get less: saturated fat, sugars, sodium"), (332, "5  Get more: fibre, potassium, calcium, iron"), (380, "6  The 5% / 15% rule of thumb")]
    for y, s in notes:
        b += f'<line x1="284" y1="{y - 4}" x2="320" y2="{y - 4}" stroke="#2f62b8" stroke-width="1"/>'
        b += _t(326, y, s, 11.5, INK)
    return _svg(700, 400, b)
