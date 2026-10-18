/* SchoolAura — shared behaviour: menu, toast, copy buttons, card progress, discovery filters,
   site-wide search, and the "new prompts" dot for Viral Prompts subscribers. */
(function () {
  window.SA = window.SA || {};
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function read(k, f) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? f : v; } catch (e) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  /* Where the site root is, worked out from this script's own address, so links work in previews too. */
  var me = document.querySelector('script[src*="assets/js/site.js"]');
  var meSrc = me ? me.src : "/assets/js/site.js";
  SA.root = meSrc.replace(/assets\/js\/site\.js.*$/, "");
  SA.preview = me ? me.getAttribute("src").charAt(0) !== "/" : false;
  SA.url = function (u) { return SA.root + u + (SA.preview && /\/$/.test(u) ? "index.html" : ""); };

  document.addEventListener("click", function (e) {
    var m = e.target.closest("[data-menu]");
    if (m) {
      var nav = document.getElementById("site-nav");
      var open = nav.classList.toggle("open");
      m.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (e.target.closest("#site-nav a")) document.getElementById("site-nav").classList.remove("open");
  });

  SA.toast = function (msg) {
    var el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  };

  /* Copy buttons: <button data-copy="id-of-element"> */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var pre = document.getElementById(b.getAttribute("data-copy"));
    if (!pre) return;
    var label = b.textContent;
    var done = function () {
      b.textContent = "Copied"; setTimeout(function () { b.textContent = label; }, 1500);
      if (b.closest(".pblock")) {
        var st = read("sa.prompts", {}); st.copies = (st.copies || 0) + 1; write("sa.prompts", st);
        if (window.SAEngage) SAEngage.touch();
      }
    };
    var fallback = function () { var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected: press Ctrl+C"; };
    try { navigator.clipboard.writeText(pre.textContent).then(done, fallback); } catch (err) { fallback(); }
  });

  /* Progress bars on course cards: <div class="progress" data-progress="slug" data-total="30"> */
  document.querySelectorAll("[data-progress]").forEach(function (el) {
    var s = read("sa.course." + el.getAttribute("data-progress"), null), done = s && s.done ? s.done.length : 0;
    var pct = Math.round(done / (+el.getAttribute("data-total") || 1) * 100);
    var bar = el.querySelector("i"); if (bar) bar.style.width = pct + "%";
    var lbl = el.querySelector("span"); if (lbl) lbl.textContent = pct + "%";
  });

  /* Viral Prompts: count of packs newer than the subscriber's last visit. */
  SA.newPrompts = function () {
    var st = read("sa.prompts", {}), P = window.SA_PROMPTS || { dates: [] };
    if (!st.sub) return -1;
    var seen = st.seen || st.subAt || "";
    return (P.dates || []).filter(function (d) { return !seen || d > seen; }).length;
  };
  SA.renderPromptBadges = function () {
    var n = SA.newPrompts();
    document.querySelectorAll("[data-nav-prompts]").forEach(function (a) {
      var dot = a.querySelector(".ndot");
      if (n > 0 && !/\/prompts\//.test(location.pathname)) { if (!dot) { dot = document.createElement("span"); dot.className = "ndot"; a.appendChild(dot); } dot.title = n + " new"; }
      else if (dot) dot.remove();
    });
    document.querySelectorAll("[data-prompts-badge]").forEach(function (b) {
      b.hidden = false;
      b.className = "vp-badge" + (n > 0 ? " on" : "");
      b.textContent = n > 0 ? n + " new" : n === 0 ? "Subscribed" : "Subscribe";
    });
  };
  SA.renderPromptBadges();

  /* ---------- Site-wide search ---------- */
  var IDX = null, loading = null;
  function loadIndex(cb) {
    if (IDX) return cb(IDX);
    if (window.SA_SEARCH) { IDX = window.SA_SEARCH; return cb(IDX); }
    if (!loading) {
      loading = [];
      var s = document.createElement("script");
      s.src = meSrc.replace("site.js", "search-index.js");
      s.onload = function () { IDX = window.SA_SEARCH || []; loading.forEach(function (f) { f(IDX); }); };
      document.head.appendChild(s);
    }
    loading.push(cb);
  }
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  SA.search = function (q, list, limit) {
    var words = norm(q).split(/[^a-z0-9+#.]+/).filter(function (w) { return w.length > 1 || /\d/.test(w); });
    if (!words.length) return [];
    var out = [];
    list.forEach(function (it) {
      var t = norm(it.t), s = norm(it.s), x = norm(it.x), score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i], hit = 0;
        if (t.indexOf(w) !== -1) hit += t.indexOf(w) === 0 || t.indexOf(" " + w) !== -1 ? 12 : 8;
        if (x.indexOf(w) !== -1) hit += 3;
        if (s.indexOf(w) !== -1) hit += 2;
        if (!hit) return;
        score += hit;
      }
      score += { Course: 6, Page: 4, Prompt: 2, Lesson: 1 }[it.k] || 0;
      out.push({ it: it, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score; });
    return out.slice(0, limit || 30).map(function (o) { return o.it; });
  };
  function resultHtml(it, i) {
    return '<a class="sd-item" href="' + esc(SA.url(it.u)) + '" data-i="' + i + '"><span class="sd-k k-' + it.k.toLowerCase() + '">' + it.k + "</span><span class=\"sd-t\"><b>" + esc(it.t) + "</b><small>" + esc(it.s) + "</small></span></a>";
  }

  var dlg = null, active = -1;
  function openSearch(prefill) {
    if (!dlg) {
      dlg = document.createElement("div");
      dlg.className = "sd"; dlg.hidden = true;
      dlg.innerHTML = '<div class="sd-box" role="dialog" aria-modal="true" aria-label="Search SchoolAura">' +
        '<div class="sd-in"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>' +
        '<input type="search" id="sd-q" placeholder="Search lessons, courses and prompts" autocomplete="off" aria-label="Search"><button type="button" class="sd-x" data-sd-close aria-label="Close search">Esc</button></div>' +
        '<div class="sd-res" id="sd-res" role="listbox"></div></div>';
      document.body.appendChild(dlg);
      var input = dlg.querySelector("#sd-q");
      input.addEventListener("input", function () { draw(input.value); });
      input.addEventListener("keydown", function (e) {
        var items = dlg.querySelectorAll(".sd-item");
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          active = Math.max(0, Math.min(items.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
          items.forEach(function (x, i) { x.classList.toggle("on", i === active); });
          if (items[active]) items[active].scrollIntoView({ block: "nearest" });
        } else if (e.key === "Enter") {
          var go = items[active >= 0 ? active : 0]; if (go) { e.preventDefault(); location.href = go.href; }
        }
      });
      dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-sd-close]")) closeSearch(); });
    }
    dlg.hidden = false;
    document.documentElement.classList.add("sd-open");
    var q = dlg.querySelector("#sd-q");
    if (prefill != null) q.value = prefill;
    q.focus(); q.select();
    draw(q.value);
  }
  function closeSearch() { if (dlg) { dlg.hidden = true; document.documentElement.classList.remove("sd-open"); } }
  function draw(q) {
    var box = dlg.querySelector("#sd-res");
    active = -1;
    if (!q.trim()) { box.innerHTML = '<p class="sd-hint">Try <b>Runway</b>, <b>SEO</b>, <b>Shopify</b>, <b>keto</b> or <b>halloween</b>.</p>'; return; }
    box.innerHTML = '<p class="sd-hint">Searching…</p>';
    loadIndex(function (list) {
      if (dlg.querySelector("#sd-q").value !== q) return;
      var res = SA.search(q, list, 40);
      box.innerHTML = res.length ? res.map(resultHtml).join("") : '<p class="sd-hint">Nothing found for “' + esc(q) + '”. Try a shorter word.</p>';
    });
  }
  document.addEventListener("click", function (e) { if (e.target.closest("[data-search-open]")) { e.preventDefault(); openSearch(); } });
  document.addEventListener("keydown", function (e) {
    var typing = e.target.matches && e.target.matches("input, textarea, select, [contenteditable]");
    if ((e.key === "/" && !typing) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) { e.preventDefault(); openSearch(); }
    else if (e.key === "Escape" && dlg && !dlg.hidden) closeSearch();
  });

  /* ---------- Home: discovery search + category chips (also searches lessons and prompts) ---------- */
  var search = document.getElementById("find");
  var chips = document.querySelectorAll(".chip-btn[data-cat]");
  var cards = document.querySelectorAll("[data-find]");
  var more = document.getElementById("find-results");
  var cat = "all";
  function filter() {
    var q = (search && search.value || "").trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (cat === "all" || c.getAttribute("data-cat").indexOf(cat) !== -1) && (!q || c.getAttribute("data-find").indexOf(q) !== -1);
      c.hidden = !ok; if (ok) shown++;
    });
    var empty = document.getElementById("no-results");
    if (!more) { if (empty) empty.hidden = shown > 0; return; }
    if (q.length < 2) { more.hidden = true; if (empty) empty.hidden = true; return; }
    loadIndex(function (list) {
      if ((search.value || "").trim().toLowerCase() !== q) return;
      var res = SA.search(q, list.filter(function (it) { return it.k === "Lesson" || it.k === "Prompt" || it.k === "Book" || it.k === "Template"; }), 8);
      more.hidden = !res.length;
      more.innerHTML = res.length ? '<h2 class="fr-h">In lessons and prompts</h2><div class="fr-list">' + res.map(resultHtml).join("") + "</div>" : "";
      if (empty) empty.hidden = shown > 0 || res.length > 0;
    });
  }
  if (search) {
    search.addEventListener("input", filter);
    var qp = (location.search.match(/[?&]q=([^&]*)/) || [])[1];
    if (qp) { search.value = decodeURIComponent(qp.replace(/\+/g, " ")); filter(); }
  }
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      cat = b.getAttribute("data-cat");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      filter();
    });
  });
})();
