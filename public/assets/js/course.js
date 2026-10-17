/* SchoolAura course engine: classroom (lessons), calendar and progress.
   Progress lives in this browser (localStorage) until accounts arrive with membership. */
(function () {
  var C = window.COURSE;
  if (!C) return;
  var KEY = "sa.course." + C.slug;
  var DAY_MS = 86400000;
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- state ---------- */
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { s = null; }
    s = s || {};
    return { start: s.start || null, study: s.study || "all", pace: s.pace || 1, done: s.done || [], tasks: s.tasks || {} };
  }
  var S = load();
  function save() {
    if (!S.start) S.start = iso(today());
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  /* ---------- dates & schedule ---------- */
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(s) { var p = (s || "").split("-"); return p.length === 3 ? new Date(+p[0], +p[1] - 1, +p[2]) : today(); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function same(a, b) { return a && b && a.getTime() === b.getTime(); }
  function fmt(d, o) { return d.toLocaleDateString("en-CA", o || { weekday: "short", month: "short", day: "numeric" }); }
  function isStudy(d) { var w = d.getDay(); return S.study === "weekdays" ? (w >= 1 && w <= 5) : S.study === "mon-sat" ? w !== 0 : true; }
  function schedule() {
    var d = S.start ? parse(S.start) : today(), slots = [], guard = 0, need = C.days.length * S.pace, out = {};
    while (slots.length < need && guard++ < 2000) { if (isStudy(d)) slots.push(d); d = addDays(d, 1); }
    C.days.forEach(function (day, i) { out[day.n] = slots.slice(i * S.pace, i * S.pace + S.pace); });
    return out;
  }
  function isDone(n) { return S.done.indexOf(n) !== -1; }
  function status(n, sc) {
    if (isDone(n)) return "done";
    var ds = sc[n], t = today();
    if (ds.some(function (x) { return same(x, t); })) return "now";
    return ds[ds.length - 1] < t ? "late" : "upcoming";
  }
  function dayByN(n) { for (var i = 0; i < C.days.length; i++) if (C.days[i].n === n) return C.days[i]; return null; }
  function modOf(n) { for (var i = 0; i < C.modules.length; i++) if (C.modules[i].days.indexOf(n) !== -1) return C.modules[i]; return null; }
  function nextUp() { for (var i = 0; i < C.days.length; i++) if (!isDone(C.days[i].n)) return C.days[i]; return null; }
  function pct() { return Math.round(S.done.length / C.days.length * 100); }

  /* ---------- shared bits ---------- */
  function syncProgress() {
    document.querySelectorAll("[data-course-progress]").forEach(function (el) {
      el.querySelector("i").style.width = pct() + "%";
      el.querySelector("span").textContent = pct() + "%";
    });
    var n = nextUp();
    var tab = document.querySelector('.tabs a[data-view="day"]');
    if (tab) tab.href = "#day-" + (n ? n.n : 1);
    var cont = $("#continue");
    if (cont) {
      if (!S.done.length) { cont.textContent = "Start course"; cont.href = "#day-1"; }
      else if (n) { cont.textContent = "Continue · Day " + n.n; cont.href = "#day-" + n.n; }
      else { cont.textContent = "Review the course"; cont.href = "#day-1"; }
    }
    var dc = $("#done-count"); if (dc) dc.textContent = S.done.length + " of " + C.days.length;
  }

  /* ---------- routing ---------- */
  var views = { about: $("#v-about"), plan: $("#v-plan"), day: $("#v-day") };
  var calMonth = null;
  function route() {
    var h = (location.hash || "").replace("#", "");
    var m = /^day-(\d+)$/.exec(h);
    var which = m ? "day" : h === "plan" ? "plan" : "about";
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== which; });
    document.querySelectorAll(".tabs a").forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("data-view") === which ? "true" : "false"); });
    if (which === "plan") renderPlan();
    if (which === "day") renderDay(+m[1]);
    syncProgress();
    if (which !== "about" || h) window.scrollTo(0, 0);
  }

  /* ---------- classroom ---------- */
  function renderNav(current) {
    var html = "";
    C.modules.forEach(function (m) {
      html += '<p class="mtitle">' + esc(m.title) + "</p>";
      m.days.forEach(function (n) {
        var d = dayByN(n);
        html += '<a href="#day-' + n + '" class="' + (isDone(n) ? "done" : "") + '" aria-current="' + (n === current ? "true" : "false") + '"><span class="ck">' + (isDone(n) ? "✓" : "") + "</span><span>Day " + n + ": " + esc(d.title) + "</span></a>";
      });
    });
    $("#lesson-list").innerHTML = html;
    var cur = $('#lesson-list a[aria-current="true"]');
    if (cur) { var box = $("#lesson-list"); var top = cur.offsetTop - box.offsetTop; if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 60) box.scrollTop = top - 80; }
    $("#jump").innerHTML = C.days.map(function (d) { return '<option value="' + d.n + '"' + (d.n === current ? " selected" : "") + ">" + (isDone(d.n) ? "✓ " : "") + "Day " + d.n + ": " + esc(d.title) + "</option>"; }).join("");
  }

  function doneToggle(n) {
    return '<button type="button" class="done-toggle' + (isDone(n) ? " on" : "") + '" data-toggle="' + n + '" aria-pressed="' + isDone(n) + '"><span class="ck">' + (isDone(n) ? "✓" : "") + "</span>" + (isDone(n) ? "Completed" : "Mark as done") + "</button>";
  }

  function renderDay(n) {
    var d = dayByN(n);
    if (!d) { location.hash = "#about"; return; }
    var sc = schedule(), m = modOf(n), st = status(n, sc);
    var stTxt = { done: "Completed", now: "Today", late: "Behind schedule", upcoming: "Scheduled" }[st];
    var sp = d.split, tot = sp.read + sp.demo + sp.tasks;
    var tasks = d.tasks.map(function (t, i) {
      var k = n + "-" + i, id = "t-" + k;
      return '<li><label for="' + id + '"><input type="checkbox" id="' + id + '" data-k="' + k + '"' + (S.tasks[k] ? " checked" : "") + '><span class="tx">' + t.html + "</span>" + (t.mins ? '<span class="mins">' + t.mins + " min</span>" : "<span></span>") + "</label></li>";
    }).join("");
    var prev = dayByN(n - 1), next = dayByN(n + 1);
    $("#lesson").innerHTML =
      '<div class="lesson-top"><div><p class="crumb">' + esc(m.title) + " · Day " + n + " of " + C.days.length + "</p><h2>" + esc(d.title) + "</h2></div>" + doneToggle(n) + "</div>" +
      '<div class="meta-chips"><span class="mchip">' + d.hours + ' hours</span><span class="mchip st-' + st + '">' + stTxt + " · " + esc(sc[n].map(function (x) { return fmt(x); }).join(" + ")) + "</span></div>" +
      '<p class="goal">' + esc(d.goal) + "</p>" +
      '<div class="time-bar" aria-hidden="true"><i style="flex:' + sp.read + ';background:#c9c7c1"></i><i style="flex:' + sp.demo + ';background:#e3e1db"></i><i style="flex:' + sp.tasks + ';background:var(--aura)"></i></div>' +
      '<div class="time-key"><span><i style="background:#c9c7c1"></i>Lesson ' + sp.read + ' min</span><span><i style="background:#e3e1db"></i>Example ' + sp.demo + ' min</span><span><i style="background:var(--aura)"></i>Tasks ' + sp.tasks + " min</span><span>≈ " + (tot / 60).toFixed(1).replace(".0", "") + " h total</span></div>" +
      '<section class="part"><h3 class="part-h"><span class="pi">1</span>Lesson</h3><div class="prose">' + d.lesson + "</div></section>" +
      (d.demo ? '<section class="part"><h3 class="part-h"><span class="pi">2</span>Worked example</h3><div class="demo-box"><div class="prose">' + d.demo + "</div></div></section>" : "") +
      '<section class="part"><h3 class="part-h"><span class="pi">' + (d.demo ? 3 : 2) + "</span>Today's tasks</h3><ul class=\"tasks\">" + tasks + "</ul></section>" +
      (d.deliverable ? '<section class="part"><h3 class="part-h"><span class="pi">✓</span>By tonight you\'ll have</h3><div class="deliver"><div class="prose">' + d.deliverable + "</div></div></section>" : "") +
      (d.tip ? '<section class="part"><h3 class="part-h"><span class="pi">★</span>Tip</h3><div class="prose">' + d.tip + "</div></section>" : "") +
      '<div class="lesson-foot">' + (prev ? '<a class="btn light" href="#day-' + prev.n + '">← Previous</a>' : "<span></span>") +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + doneToggle(n) + (next ? '<a class="btn" href="#day-' + next.n + '">Next lesson →</a>' : '<a class="btn" href="#plan">Back to calendar</a>') + "</div></div>";
    renderNav(n);
    document.title = "Day " + n + ": " + d.title + " · " + C.title + " · SchoolAura";
  }

  /* ---------- calendar ---------- */
  function renderPlan() {
    var sc = schedule(), start = S.start ? parse(S.start) : today(), t = today();
    var last = sc[C.days[C.days.length - 1].n], finish = last[last.length - 1];
    var f = $("#plan-form");
    f.start.value = iso(start);
    f.querySelector('input[name="study"][value="' + S.study + '"]').checked = true;
    f.querySelector('input[name="pace"][value="' + S.pace + '"]').checked = true;
    var totalH = C.days.reduce(function (a, d) { return a + d.hours; }, 0);
    $("#sum-finish").textContent = fmt(finish, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    $("#sum-span").textContent = Math.round((finish - start) / DAY_MS) + 1 + " days";
    $("#sum-daily").textContent = "≈ " + (totalH / C.days.length / S.pace).toFixed(1).replace(".0", "") + " h";

    var td = null; C.days.forEach(function (d) { if (sc[d.n].some(function (x) { return same(x, t); })) td = d; });
    var nx = nextUp(), tc = $("#today-card");
    if (td) {
      tc.innerHTML = '<p class="k">Today · ' + esc(fmt(t, { weekday: "long", month: "long", day: "numeric" })) + '</p><h3>Day ' + td.n + ": " + esc(td.title) + '</h3><p class="muted">' + esc(td.goal) + '</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><a class="btn color" href="#day-' + td.n + '">' + (isDone(td.n) ? "Review lesson" : "Open today's lesson") + "</a>" + (nx && nx.n < td.n ? '<a class="btn light" href="#day-' + nx.n + '">Catch up: Day ' + nx.n + "</a>" : "") + "</div>";
    } else if (start > t) {
      tc.innerHTML = '<p class="k">Starts ' + esc(fmt(start, { weekday: "long", month: "long", day: "numeric" })) + '</p><h3>Your first lesson is ready when you are.</h3><div><a class="btn light" href="#day-1">Preview Day 1</a></div>';
    } else if (!nx) {
      tc.innerHTML = '<p class="k">Finished</p><h3>You completed every lesson in this course.</h3>';
    } else {
      tc.innerHTML = '<p class="k">Rest day</p><h3>Nothing scheduled today.</h3><p class="muted">Next up: Day ' + nx.n + ": " + esc(nx.title) + '</p><div><a class="btn light" href="#day-' + nx.n + '">Get ahead</a></div>';
    }
    if (!calMonth) { var a = t < start ? start : t > finish ? finish : t; calMonth = new Date(a.getFullYear(), a.getMonth(), 1); }
    renderCalendar(sc);
    renderAgenda(sc);
  }

  function renderCalendar(sc) {
    var by = {};
    C.days.forEach(function (d) { sc[d.n].forEach(function (x, i) { (by[iso(x)] = by[iso(x)] || []).push({ d: d, part: sc[d.n].length > 1 ? i + 1 : 0 }); }); });
    $("#cal-title").textContent = MONTHS[calMonth.getMonth()] + " " + calMonth.getFullYear();
    var html = DOW.map(function (w) { return '<div class="cal-dow">' + w + "</div>"; }).join("");
    var first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1), s0 = addDays(first, -first.getDay()), t = today();
    for (var i = 0; i < 42; i++) {
      var d = addDays(s0, i);
      if (i >= 35 && d.getMonth() !== calMonth.getMonth()) break;
      var items = (by[iso(d)] || []).map(function (it) {
        var st = status(it.d.n, sc), c = st === "done" ? " done" : st === "late" ? " late" : "";
        return '<a class="cal-task' + c + '" href="#day-' + it.d.n + '" title="Day ' + it.d.n + ": " + esc(it.d.title) + '"><b><span class="dw">Day </span>' + it.d.n + (it.part ? " · " + it.part + "/2" : "") + '</b><span class="tt">' + esc(it.d.short || it.d.title) + "</span></a>";
      }).join("");
      html += '<div class="cal-cell' + (d.getMonth() !== calMonth.getMonth() ? " out" : "") + (same(d, t) ? " is-today" : "") + '"><span class="num">' + d.getDate() + "</span>" + items + "</div>";
    }
    $("#cal-grid").innerHTML = html;
  }

  function renderAgenda(sc) {
    var t = today();
    var list = C.days.filter(function (d) { var l = sc[d.n][sc[d.n].length - 1]; return l >= addDays(t, -1) || (!isDone(d.n) && l < t); });
    var late = list.filter(function (d) { return status(d.n, sc) === "late"; });
    var items = late.concat(list.filter(function (d) { return status(d.n, sc) !== "late"; }).slice(0, 6));
    var lbl = { done: "Done", now: "Today", late: "Behind", upcoming: "Upcoming" }, cls = { done: "ok", now: "now", late: "late", upcoming: "" };
    $("#agenda").innerHTML = items.map(function (d) {
      var st = status(d.n, sc);
      return '<li><a href="#day-' + d.n + '"><span class="ad">' + esc(fmt(sc[d.n][0])) + '</span><span class="at">Day ' + d.n + ": " + esc(d.title) + "<small>" + d.hours + " h · " + esc(modOf(d.n).title) + '</small></span><span class="pill ' + cls[st] + '">' + lbl[st] + "</span></a></li>";
    }).join("") || '<li style="padding:14px 16px;color:var(--muted)">Nothing scheduled in the next few days.</li>';
  }

  /* ---------- events ---------- */
  document.addEventListener("change", function (e) {
    var cb = e.target.closest(".tasks input");
    if (cb) {
      var k = cb.getAttribute("data-k");
      if (cb.checked) S.tasks[k] = 1; else delete S.tasks[k];
      save();
      var n = +k.split("-")[0], d = dayByN(n);
      if (!isDone(n) && d.tasks.every(function (_, i) { return S.tasks[n + "-" + i]; })) SA.toast("All tasks ticked. Mark the lesson as done when you're happy with it.");
      return;
    }
    var f = e.target.closest("#plan-form");
    if (f) {
      S.start = f.start.value || iso(today());
      S.study = f.querySelector('input[name="study"]:checked').value;
      S.pace = +f.querySelector('input[name="pace"]:checked').value;
      save(); calMonth = null; renderPlan();
      SA.toast("Calendar updated.");
    }
    if (e.target.id === "jump") location.hash = "#day-" + e.target.value;
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-toggle]");
    if (b) {
      var n = +b.getAttribute("data-toggle");
      if (isDone(n)) S.done = S.done.filter(function (x) { return x !== n; });
      else { S.done.push(n); var nx = nextUp(); SA.toast(nx ? "Day " + n + " done. Next up: Day " + nx.n + "." : "You finished the whole course. Well done."); }
      save();
      document.querySelectorAll('[data-toggle="' + n + '"]').forEach(function (el) { el.outerHTML = doneToggle(n); });
      renderNav(n); syncProgress();
      return;
    }
    var nav = e.target.closest("[data-cal]");
    if (nav) {
      var dir = nav.getAttribute("data-cal"), t = today();
      calMonth = dir === "today" ? new Date(t.getFullYear(), t.getMonth(), 1) : new Date(calMonth.getFullYear(), calMonth.getMonth() + (dir === "next" ? 1 : -1), 1);
      renderCalendar(schedule());
      return;
    }
    var r = e.target.closest("[data-reset]");
    if (r) {
      if (r.getAttribute("data-armed") !== "1") {
        r.setAttribute("data-armed", "1"); r.textContent = "Tap again to erase progress";
        setTimeout(function () { r.removeAttribute("data-armed"); r.textContent = "Reset progress"; }, 4000);
        return;
      }
      S = { start: iso(today()), study: S.study, pace: S.pace, done: [], tasks: {} };
      save(); calMonth = null; renderPlan(); syncProgress();
      SA.toast("Progress cleared. Your plan now starts today.");
    }
  });

  window.addEventListener("hashchange", route);
  route();
})();
