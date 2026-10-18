/* SchoolAura interactive lesson tools. Any element with data-tool="name" becomes a live tool.
   SATools.mount(root) is called after a lesson renders; pages without lessons call it on load. */
(function () {
  var uid = 0;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function money(v) { return isFinite(v) ? "$" + v.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"; }
  function money0(v) { return isFinite(v) ? "$" + Math.round(v).toLocaleString("en-CA") : "—"; }
  function num(v, d) { return isFinite(v) ? v.toLocaleString("en-CA", { maximumFractionDigits: d == null ? 2 : d }) : "—"; }
  function pct(v, d) { return isFinite(v) ? num(v, d == null ? 2 : d) + "%" : "—"; }

  function shell(title, sub, body) {
    return '<div class="tool-card"><div class="tool-head"><span class="tool-ic" aria-hidden="true">⚙</span><div><p class="tool-k">Interactive tool</p><h4>' + esc(title) + "</h4>" + (sub ? '<p class="tool-sub">' + esc(sub) + "</p>" : "") + "</div></div>" + body + "</div>";
  }
  function numField(id, label, value, opt) {
    opt = opt || {};
    return '<label class="tf" for="' + id + '"><span>' + esc(label) + '</span><span class="tf-in">' + (opt.pre ? '<i>' + opt.pre + "</i>" : "") +
      '<input type="number" inputmode="decimal" id="' + id + '" value="' + value + '" min="0" step="' + (opt.step || "any") + '">' + (opt.suf ? '<i>' + opt.suf + "</i>" : "") + "</span></label>";
  }
  function textField(id, label, value, opt) {
    opt = opt || {};
    if (opt.area) return '<label class="tf wide" for="' + id + '"><span>' + esc(label) + '</span><textarea id="' + id + '" rows="' + (opt.rows || 2) + '" placeholder="' + esc(opt.ph || "") + '">' + esc(value) + "</textarea></label>";
    return '<label class="tf' + (opt.wide ? " wide" : "") + '" for="' + id + '"><span>' + esc(label) + '</span><input type="text" id="' + id + '" value="' + esc(value) + '" placeholder="' + esc(opt.ph || "") + '" autocomplete="off" spellcheck="false"></label>';
  }
  function out(items) {
    return '<div class="tool-out">' + items.map(function (x) { return '<div class="to' + (x[2] ? " " + x[2] : "") + '"><span>' + esc(x[0]) + "</span><b>" + x[1] + "</b></div>"; }).join("") + "</div>";
  }
  function verdict(kind, text) { return '<p class="verdict-line v-' + kind + '">' + text + "</p>"; }
  function copyBtn(id) { return '<button type="button" class="btn light sm" data-copy="' + id + '">Copy</button>'; }

  function bind(el, ids, calc) {
    var f = function () {
      var v = {};
      ids.forEach(function (k) { var x = el.querySelector("#" + el._p + k); v[k] = x.type === "number" ? parseFloat(x.value) : x.value; });
      el.querySelector(".tool-res").innerHTML = calc(v);
    };
    el.addEventListener("input", f); el.addEventListener("change", f); f();
  }

  var T = {};

  /* ---------- Dropshipping ---------- */
  T.profit = function (el, p) {
    el.innerHTML = shell("Profit and break-even calculator", "Change any number to see what one sale is really worth.",
      '<div class="tool-in">' + numField(p + "price", "Selling price", 34.99, { pre: "$" }) + numField(p + "cost", "Product cost", 8.40, { pre: "$" }) +
      numField(p + "ship", "Shipping cost", 4.20, { pre: "$" }) + numField(p + "fpct", "Payment fee", 2.9, { suf: "%" }) + numField(p + "ffix", "Fixed fee per order", 0.30, { pre: "$" }) + "</div><div class=\"tool-res\"></div>");
    bind(el, ["price", "cost", "ship", "fpct", "ffix"], function (v) {
      var fees = v.price * v.fpct / 100 + v.ffix, landed = v.cost + v.ship, margin = v.price - landed - fees;
      var be = margin > 0 ? v.price / margin : Infinity, mk = v.price / landed;
      var kind = !(margin > 0) ? "bad" : be <= 1.8 ? "ok" : be <= 2.5 ? "warn" : "bad";
      var msg = !(margin > 0) ? "You lose money on every sale before any ads. Raise the price or find a cheaper supplier." :
        be <= 1.8 ? "Healthy. There's room to pay for ads and still profit." :
        be <= 2.5 ? "Tight. Try a bundle, a quantity break or a higher price." : "Too thin for paid ads. Raise the price, bundle, or pick another product.";
      return out([["Fees per order", money(fees)], ["Gross margin", money(margin) + " · " + pct(margin / v.price * 100, 0)], ["Break-even CPA", money(margin), "hl"], ["Break-even ROAS", num(be, 2), "hl"], ["Markup on landed cost", num(mk, 2) + "×", mk < 2.5 ? "warnc" : ""]]) + verdict(kind, msg);
    });
  };

  T.adtest = function (el, p) {
    el.innerHTML = shell("Kill, keep or scale?", "Enter one ad's numbers and get a decision using the course rules.",
      '<div class="tool-in">' + numField(p + "be", "Break-even CPA", 20.73, { pre: "$" }) + numField(p + "spend", "Spent so far", 62, { pre: "$" }) + numField(p + "ctr", "Link CTR", 0.8, { suf: "%" }) +
      numField(p + "atc", "Add to carts", 2, { step: 1 }) + numField(p + "buys", "Purchases", 0, { step: 1 }) + numField(p + "days", "Days running", 3, { step: 1 }) + "</div><div class=\"tool-res\"></div>");
    bind(el, ["be", "spend", "ctr", "atc", "buys", "days"], function (v) {
      var cpa = v.buys > 0 ? v.spend / v.buys : Infinity, x = v.spend / v.be, k, m;
      if (x < 1) { k = "warn"; m = "<b>Too early.</b> Wait until it has spent at least one break-even CPA (" + money(v.be) + ")."; }
      else if (v.buys === 0 && v.atc === 0 && v.ctr < 1) { k = "bad"; m = "<b>Kill it.</b> The hook isn't stopping people (CTR under 1%). Test a new first 3 seconds."; }
      else if (v.buys === 0 && x >= 2) { k = "bad"; m = "<b>Kill it.</b> " + (v.atc > 0 ? "People add to cart but don't buy: check shipping costs, trust and the checkout." : "Two break-even CPAs spent with no sale.") ; }
      else if (v.buys > 0 && cpa > v.be && x >= 3) { k = "bad"; m = "<b>Kill or fix the page and offer.</b> CPA is still above break-even after 3× spend."; }
      else if (v.buys >= 3 && cpa <= v.be && v.days >= 3) { k = "ok"; m = "<b>Scale it.</b> Raise the budget about 20% every 48 hours, and stop if CPA rises above break-even for 2 days."; }
      else { k = "warn"; m = "<b>Keep running.</b> Not enough data yet to decide. Check again tomorrow at the same time."; }
      return out([["Cost per purchase", isFinite(cpa) ? money(cpa) : "no sales yet", isFinite(cpa) && cpa <= v.be ? "okc" : ""], ["Spent vs break-even", num(x, 1) + "×"], ["CTR", pct(v.ctr, 1), v.ctr < 1 ? "warnc" : ""]]) + verdict(k, m);
    });
  };

  /* ---------- AI Mastery ---------- */
  T.prompt = function (el, p) {
    var f = [["role", "Role", "You're a social media copywriter for small food businesses."],
      ["context", "Context", "I run a family bakery in London, Ontario. This week we're launching a pumpkin-spice cinnamon roll, $4.50, weekends in October only."],
      ["task", "Task", "Write 3 Instagram captions for the launch post."],
      ["format", "Format", "Each under 60 words, with 3–5 hashtags at the end."],
      ["constraints", "Constraints", "Warm and a bit playful. Max one exclamation mark. Mention weekends only."],
      ["examples", "Example of the voice", "Saturday mornings smell better here. Fresh sourdough at 8, gone by 11."]];
    el.innerHTML = shell("Prompt builder", "Fill in the six parts. The prompt assembles itself; copy it into Claude or ChatGPT.",
      '<div class="tool-in one">' + f.map(function (x) { return textField(p + x[0], x[1], x[2], { area: true, rows: 2 }); }).join("") + '</div><div class="tool-res"></div>');
    bind(el, f.map(function (x) { return x[0]; }), function (v) {
      var parts = f.filter(function (x) { return (v[x[0]] || "").trim(); });
      var text = parts.map(function (x) { return (x[0] === "examples" ? "Example of the voice: " : x[1] + ": ") + v[x[0]].trim(); }).join("\n");
      var n = parts.length, k = n >= 5 ? "ok" : n >= 3 ? "warn" : "bad";
      return '<div class="tool-copy"><div class="tc-top"><b>Your prompt</b>' + copyBtn(p + "outp") + '</div><pre id="' + p + 'outp">' + esc(text || "Fill in at least the task.") + "</pre></div>" +
        verdict(k, "<b>" + n + " of 6 parts filled.</b> " + (n === 6 ? "A complete brief. Expect a strong first draft." : !(v.context || "").trim() ? "Add context: it's the part that matters most." : "Add the missing parts for a sharper result."));
    });
  };

  T.imgprompt = function (el, p) {
    var f = [["subject", "Subject", "a ceramic coffee cup with latte art"], ["setting", "Setting", "on a worn oak table by a rainy window"], ["style", "Style or medium", "editorial food photography"],
      ["light", "Lighting", "soft natural side light, gentle shadows"], ["camera", "Camera and composition", "50mm, shallow depth of field, cup on the left third"], ["mood", "Mood", "calm, cosy, early morning"]];
    el.innerHTML = shell("Image prompt builder", "Change one part at a time to learn what each one does.",
      '<div class="tool-in">' + f.map(function (x) { return textField(p + x[0], x[1], x[2]); }).join("") +
      '<label class="tf" for="' + p + 'ratio"><span>Aspect ratio</span><select id="' + p + 'ratio"><option>4:5</option><option>1:1</option><option>9:16</option><option>16:9</option><option>3:2</option></select></label></div><div class="tool-res"></div>');
    bind(el, ["subject", "setting", "style", "light", "camera", "mood", "ratio"], function (v) {
      var s = [v.style && v.style + " of " + v.subject, !v.style && v.subject, v.setting, v.light, v.camera, v.mood && v.mood + " mood", v.ratio].filter(Boolean).join(", ");
      s = s.charAt(0).toUpperCase() + s.slice(1) + ".";
      return '<div class="tool-copy"><div class="tc-top"><b>Your image prompt</b>' + copyBtn(p + "outp") + '</div><pre id="' + p + 'outp">' + esc(s) + "</pre></div>";
    });
  };

  /* ---------- Digital Marketing ---------- */
  T.metrics = function (el, p) {
    el.innerHTML = shell("Marketing numbers calculator", "Enter a campaign's results to get every metric, plus lifetime value.",
      '<div class="tool-in">' + numField(p + "spend", "Ad spend", 300, { pre: "$" }) + numField(p + "imp", "Impressions", 60000, { step: 1 }) + numField(p + "clicks", "Clicks", 900, { step: 1 }) +
      numField(p + "conv", "Conversions (customers)", 45, { step: 1 }) + numField(p + "rev", "Revenue from them", 540, { pre: "$" }) + "</div>" +
      '<p class="tool-sub" style="margin-top:14px"><b>Lifetime value</b> (gross profit per customer)</p><div class="tool-in">' +
      numField(p + "aov", "Average order", 12, { pre: "$" }) + numField(p + "freq", "Orders per month", 2) + numField(p + "months", "Months as a customer", 8) + numField(p + "margin", "Gross margin", 65, { suf: "%" }) + '</div><div class="tool-res"></div>');
    bind(el, ["spend", "imp", "clicks", "conv", "rev", "aov", "freq", "months", "margin"], function (v) {
      var cpa = v.spend / v.conv, ltv = v.aov * v.freq * v.months * v.margin / 100, ratio = ltv / cpa;
      return out([["CPM", money(v.spend / v.imp * 1000)], ["CTR", pct(v.clicks / v.imp * 100)], ["CPC", money(v.spend / v.clicks)], ["Conversion rate", pct(v.conv / v.clicks * 100)],
        ["CPA", money(cpa), "hl"], ["ROAS (first purchase)", num(v.rev / v.spend, 2)], ["LTV (gross profit)", money(ltv), "hl"], ["LTV : CAC", num(ratio, 1) + " : 1", ratio >= 3 ? "okc" : "warnc"]]) +
        verdict(ratio >= 3 ? "ok" : ratio >= 1 ? "warn" : "bad", ratio >= 3 ? "Each new customer is worth well over 3× what they cost. Scale it." : ratio >= 1 ? "Profitable over time, but thin. Improve the offer or retention." : "Customers cost more than they're worth. Fix this before spending more.");
    });
  };

  T.pricing = function (el, p) {
    el.innerHTML = shell("Agency capacity planner", "Work backwards from your income goal.",
      '<div class="tool-in">' + numField(p + "goal", "Monthly revenue goal", 8000, { pre: "$" }) + numField(p + "fee", "Average monthly retainer", 1450, { pre: "$" }) +
      numField(p + "hrs", "Hours per client per month", 14) + numField(p + "week", "Hours you can work per week", 20) + '</div><div class="tool-res"></div>');
    bind(el, ["goal", "fee", "hrs", "week"], function (v) {
      var clients = Math.ceil(v.goal / v.fee), month = clients * v.hrs, perWeek = month / 4.33, fits = perWeek <= v.week;
      return out([["Clients needed", num(clients, 0), "hl"], ["Hours a month", num(month, 0)], ["Hours a week", num(perWeek, 1), fits ? "okc" : "warnc"], ["Effective hourly rate", money0(v.fee / v.hrs)]]) +
        verdict(fits ? "ok" : "warn", fits ? "It fits your week. Leave some time for sales and admin." : "It doesn't fit yet. Raise prices, narrow the scope, or plan your first hire.");
    });
  };

  T.serp = function (el, p) {
    el.innerHTML = shell("Google result preview", "Write a title and description and see roughly how they'll look in search.",
      '<div class="tool-in one">' + textField(p + "title", "Title tag", "Emergency Plumber in London, ON · 24/7 · Northfield Plumbing", { wide: true }) +
      textField(p + "url", "Page URL", "https://northfieldplumbing.ca/emergency-plumber/", { wide: true }) +
      textField(p + "desc", "Meta description", "Burst pipe or no hot water? Fixed prices, on-time techs and 400+ five-star reviews. Call 24/7 or book online.", { area: true, rows: 3 }) + '</div><div class="tool-res"></div>');
    bind(el, ["title", "url", "desc"], function (v) {
      var tl = v.title.length, dl = v.desc.length, host = v.url.replace(/^https?:\/\//, "").split("/")[0], path = v.url.replace(/^https?:\/\/[^/]+/, "").split("/").filter(Boolean);
      var t = tl > 60 ? v.title.slice(0, 57).trim() + "…" : v.title, d = dl > 158 ? v.desc.slice(0, 155).trim() + "…" : v.desc;
      var tk = tl === 0 ? "bad" : tl < 30 ? "warn" : tl <= 60 ? "ok" : "warn", dk = dl === 0 ? "bad" : dl < 70 ? "warn" : dl <= 160 ? "ok" : "warn";
      return '<div class="serp"><div class="serp-site"><span class="fav">' + esc((host[0] || "?").toUpperCase()) + "</span><div><b>" + esc(host.replace(/^www\./, "").split(".")[0]) + "</b><small>" + esc(host + (path.length ? " › " + path.join(" › ") : "")) + "</small></div></div>" +
        '<p class="serp-t">' + esc(t || "Your title") + '</p><p class="serp-d">' + esc(d || "Your description") + "</p></div>" +
        out([["Title length", tl + " characters", tk === "ok" ? "okc" : "warnc"], ["Description length", dl + " characters", dk === "ok" ? "okc" : "warnc"]]) +
        verdict(tk === "ok" && dk === "ok" ? "ok" : "warn", (tk === "ok" ? "Title length is good. " : tl > 60 ? "Title may be cut off; aim for 50–60 characters. " : "Title is short; add the benefit or location. ") + (dk === "ok" ? "Description length is good." : dl > 160 ? "Description may be cut off; aim for 150–160 characters." : "Description is short; sell the click."));
    });
  };

  T.engagement = function (el, p) {
    el.innerHTML = shell("Engagement rate calculator", "Compare posts fairly by dividing by reach.",
      '<div class="tool-in">' + numField(p + "likes", "Likes", 410, { step: 1 }) + numField(p + "comments", "Comments", 38, { step: 1 }) + numField(p + "shares", "Shares / sends", 340, { step: 1 }) +
      numField(p + "saves", "Saves", 120, { step: 1 }) + numField(p + "reach", "Reach", 21000, { step: 1 }) + numField(p + "followers", "Followers", 3200, { step: 1 }) + '</div><div class="tool-res"></div>');
    bind(el, ["likes", "comments", "shares", "saves", "reach", "followers"], function (v) {
      var eng = v.likes + v.comments + v.shares + v.saves, byReach = eng / v.reach * 100, byF = eng / v.followers * 100;
      return out([["Total engagements", num(eng, 0)], ["Engagement rate by reach", pct(byReach), "hl"], ["Engagement rate by followers", pct(byF)], ["Shares + saves share", pct((v.shares + v.saves) / eng * 100, 0)]]) +
        verdict(byReach >= 4 ? "ok" : byReach >= 2 ? "warn" : "bad", byReach >= 4 ? "Strong. Work out why this post landed and make more like it." : byReach >= 2 ? "Solid. Test a stronger hook or a save-worthy format." : "Low. Rethink the hook and the reason to watch to the end.");
    });
  };

  T.adsbudget = function (el, p) {
    el.innerHTML = shell("Google Ads budget forecast", "Estimate what a budget can produce before you launch.",
      '<div class="tool-in">' + numField(p + "budget", "Monthly budget", 1500, { pre: "$" }) + numField(p + "cpc", "Average CPC", 9, { pre: "$" }) + numField(p + "cr", "Conversion rate", 12, { suf: "%" }) +
      numField(p + "close", "Close rate", 60, { suf: "%" }) + numField(p + "job", "Average job value", 450, { pre: "$" }) + '</div><div class="tool-res"></div>');
    bind(el, ["budget", "cpc", "cr", "close", "job"], function (v) {
      var clicks = v.budget / v.cpc, leads = clicks * v.cr / 100, jobs = leads * v.close / 100, rev = jobs * v.job, roas = rev / v.budget;
      return out([["Clicks", num(clicks, 0)], ["Leads", num(leads, 0)], ["Cost per lead", money(v.budget / leads)], ["Jobs won", num(jobs, 0)], ["Revenue", money0(rev), "hl"], ["Return on ad spend", num(roas, 1) + "×", roas >= 3 ? "okc" : "warnc"]]) +
        verdict(roas >= 3 ? "ok" : roas >= 1.5 ? "warn" : "bad", "These are estimates. Share them with the client as a range, then replace them with real numbers after month one.");
    });
  };

  T.utm = function (el, p) {
    el.innerHTML = shell("UTM link builder", "Tag every link you control so GA4 knows exactly where visits came from.",
      '<div class="tool-in">' + textField(p + "url", "Page URL", "https://cornergrind.ca/menu/", { wide: true }) + textField(p + "source", "utm_source", "instagram") + textField(p + "medium", "utm_medium", "social") +
      textField(p + "campaign", "utm_campaign", "fall_menu_2026") + textField(p + "content", "utm_content (optional)", "maple_latte_reel") + textField(p + "term", "utm_term (optional)", "") + '</div><div class="tool-res"></div>');
    bind(el, ["url", "source", "medium", "campaign", "content", "term"], function (v) {
      var warn = [];
      ["source", "medium", "campaign"].forEach(function (k) { if (!v[k].trim()) warn.push("utm_" + k + " is required"); });
      ["source", "medium", "campaign", "content", "term"].forEach(function (k) {
        if (/[A-Z]/.test(v[k])) warn.push("utm_" + k + " has capitals (GA4 treats Instagram and instagram as different sources)");
        if (/\s/.test(v[k].trim())) warn.push("utm_" + k + " has spaces; use underscores");
      });
      if (!/^https?:\/\//.test(v.url.trim())) warn.push("the URL should start with https://");
      if (/\s/.test(v.url.trim())) warn.push("the page URL has a space in it");
      var params = ["source", "medium", "campaign", "content", "term"].filter(function (k) { return v[k].trim(); }).map(function (k) { return "utm_" + k + "=" + encodeURIComponent(v[k].trim()); }).join("&");
      var link = v.url.trim() + (params ? (v.url.indexOf("?") === -1 ? "?" : "&") + params : "");
      return '<div class="tool-copy"><div class="tc-top"><b>Your tagged link</b>' + copyBtn(p + "outp") + '</div><pre id="' + p + 'outp">' + esc(link) + "</pre></div>" +
        verdict(warn.length ? "warn" : "ok", warn.length ? "Fix: " + esc(warn.join("; ")) + "." : "Clean and consistent. Add it to the client's UTM sheet.");
    });
  };

  /* ---------- Website Builders ---------- */
  function hex(h) { h = (h || "").trim().replace("#", ""); if (h.length === 3) h = h.split("").map(function (c) { return c + c; }).join(""); return /^[0-9a-f]{6}$/i.test(h) ? h : null; }
  function lum(h) { return [0, 2, 4].map(function (i) { var c = parseInt(h.substr(i, 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }).reduce(function (a, c, i) { return a + c * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  T.contrast = function (el, p) {
    el.innerHTML = shell("Colour contrast checker", "Check that text is readable before you publish.",
      '<div class="tool-in">' +
      '<label class="tf" for="' + p + 'fg"><span>Text colour</span><span class="tf-in"><input type="color" id="' + p + 'fgc" value="#f3e7d6" aria-label="Pick text colour"><input type="text" id="' + p + 'fg" value="#f3e7d6" spellcheck="false"></span></label>' +
      '<label class="tf" for="' + p + 'bg"><span>Background colour</span><span class="tf-in"><input type="color" id="' + p + 'bgc" value="#17110d" aria-label="Pick background colour"><input type="text" id="' + p + 'bg" value="#17110d" spellcheck="false"></span></label>' +
      '</div><div class="tool-res"></div>');
    ["fg", "bg"].forEach(function (k) {
      var c = el.querySelector("#" + p + k + "c"), t = el.querySelector("#" + p + k);
      c.addEventListener("input", function () { t.value = c.value; t.dispatchEvent(new Event("input", { bubbles: true })); });
      t.addEventListener("input", function () { var h = hex(t.value); if (h) c.value = "#" + h; });
    });
    bind(el, ["fg", "bg"], function (v) {
      var a = hex(v.fg), b = hex(v.bg);
      if (!a || !b) return verdict("warn", "Enter colours as hex codes, like #1d1e20.");
      var l1 = lum(a), l2 = lum(b), r = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      function chip(ok, label) { return '<span class="pill ' + (ok ? "ok" : "late") + '">' + (ok ? "Pass" : "Fail") + " · " + label + "</span>"; }
      return '<div class="contrast-demo" style="background:#' + b + ";color:#" + a + '"><b>Book a table tonight</b><span>Body text at normal size should stay easy to read.</span></div>' +
        out([["Contrast ratio", num(r, 2) + " : 1", r >= 4.5 ? "okc" : "warnc"]]) +
        '<div class="chips-row">' + chip(r >= 4.5, "AA body text (4.5)") + chip(r >= 3, "AA large text (3)") + chip(r >= 7, "AAA body text (7)") + "</div>";
    });
  };

  /* ---------- Recipe Vault ---------- */
  var PANS = { "r6": ["6-inch round", Math.PI * 9], "r8": ["8-inch round", Math.PI * 16], "r9": ["9-inch round", Math.PI * 20.25], "r10": ["10-inch round", Math.PI * 25], "r12": ["12-inch round", Math.PI * 36],
    "s8": ["8-inch square", 64], "s9": ["9-inch square", 81], "q913": ["9 × 13 inch rectangle", 117], "l95": ["9 × 5 inch loaf", 45] };
  T.pan = function (el, p) {
    var opts = function (sel) { return Object.keys(PANS).map(function (k) { return '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + PANS[k][0] + "</option>"; }).join(""); };
    el.innerHTML = shell("Cake pan converter", "Recipe written for one pan size? Find out how much batter you need for another.",
      '<div class="tool-in">' +
      '<label class="tf" for="' + p + 'from"><span>Recipe is for</span><select id="' + p + 'from">' + opts("r8") + "</select></label>" +
      numField(p + "fromn", "Number of pans", 2, { step: 1 }) +
      '<label class="tf" for="' + p + 'to"><span>You want to use</span><select id="' + p + 'to">' + opts("r9") + "</select></label>" +
      numField(p + "ton", "Number of pans", 2, { step: 1 }) + '</div><div class="tool-res"></div>');
    bind(el, ["from", "fromn", "to", "ton"], function (v) {
      var a = PANS[v.from][1] * v.fromn, b = PANS[v.to][1] * v.ton, m = b / a;
      var frac = m.toFixed(2);
      return out([["Batter needed", num(m, 2) + "× the recipe", "hl"], ["Original pan area", num(a, 0) + " sq in"], ["New pan area", num(b, 0) + " sq in"]]) +
        verdict(Math.abs(m - 1) < 0.08 ? "ok" : "warn", Math.abs(m - 1) < 0.08 ? "Same amount of batter. Bake as written, checking a few minutes early." :
          "Multiply every ingredient by " + frac + ". " + (m > 1 ? "Deeper or bigger cakes bake longer; check every 5 minutes after the original time." : "Smaller or thinner cakes bake faster; start checking 5–10 minutes early."));
    });
  };

  function mount(root) {
    (root || document).querySelectorAll("[data-tool]").forEach(function (el) {
      if (el._mounted) return;
      var t = T[el.getAttribute("data-tool")];
      if (!t) return;
      el._mounted = true; el._p = "t" + (++uid) + "-"; el.classList.add("tool");
      t(el, el._p);
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var pre = document.getElementById(b.getAttribute("data-copy"));
    var text = pre ? pre.textContent : "";
    var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); };
    var fallback = function () { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected: press Ctrl+C"; };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch (err) { fallback(); }
  });

  window.SATools = { mount: mount };
  mount(document);
})();
