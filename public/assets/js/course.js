/* SchoolAura course engine: schedule, calendar, day reader, progress.
   Progress lives in this browser (localStorage) until accounts arrive with membership. */
(function () {
  var C = window.COURSE;
  if (!C) return;
  var KEY = "sa.course." + C.slug;
  var DAY_MS = 86400000;
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  /* ---------- state ---------- */
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { s = null; }
    return s || { start: null, study: "all", pace: 1, done: [], tasks: {} };
  }
  var S = load();
  if (!S.done) S.done = [];
  if (!S.tasks) S.tasks = {};
  function save() {
    if (!S.start) S.start = iso(today());
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }

  /* ---------- dates ---------- */
  function today() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(s) { var p = (s || "").split("-"); if (p.length !== 3) return today(); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function same(a, b) { return a && b && a.getTime() === b.getTime(); }
  function fmt(d, opts) { return d.toLocaleDateString("en-CA", opts || { weekday: "short", month: "short", day: "numeric" }); }
  function isStudy(d) {
    var w = d.getDay();
    if (S.study === "weekdays") return w >= 1 && w <= 5;
    if (S.study === "mon-sat") return w !== 0;
    return true;
  }

  /* lesson n -> list of dates */
  function schedule() {
    var start = S.start ? parse(S.start) : today();
    var out = {}, d = start, slot = 0, guard = 0;
    var need = C.days.length * S.pace;
    var slots = [];
    while (slots.length < need && guard < 2000) {
      if (isStudy(d)) slots.push(d);
      d = addDays(d, 1); guard++;
    }
    C.days.forEach(function (day, i) {
      out[day.n] = slots.slice(i * S.pace, i * S.pace + S.pace);
    });
    return out;
  }
  function isDone(n) { return S.done.indexOf(n) !== -1; }
  function status(n, sched) {
    if (isDone(n)) return "done";
    var dates = sched[n], t = today();
    if (!dates || !dates.length) return "upcoming";
    var last = dates[dates.length - 1];
    if (dates.some(function (x) { return same(x, t); })) return "now";
    if (last < t) return "late";
    return "upcoming";
  }
  function dayByN(n) { for (var i = 0; i < C.days.length; i++) if (C.days[i].n === n) return C.days[i]; return null; }
  function modOf(n) { for (var i = 0; i < C.modules.length; i++) if (C.modules[i].days.indexOf(n) !== -1) return C.modules[i]; return null; }
  function nextUp() { for (var i = 0; i < C.days.length; i++) if (!isDone(C.days[i].n)) return C.days[i]; return null; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  /* ---------- routing ---------- */
  var views = { overview: $("#v-overview"), plan: $("#v-plan"), day: $("#v-day") };
  function $(s) { return document.querySelector(s); }
  var calMonth = null;

  function route() {
    var h = (location.hash || "").replace("#", "");
    var m = /^day-(\d+)$/.exec(h);
    var which = m ? "day" : (h === "plan" ? "plan" : "overview");
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== which; });
    document.querySelectorAll(".tabs a").forEach(function (a) {
      a.setAttribute("aria-current", a.getAttribute("data-view") === which ? "true" : "false");
    });
    if (which !== "overview") {
      var tabs = document.querySelector(".tabs");
      var y = tabs.getBoundingClientRect().top + window.scrollY - 70;
      if (window.scrollY < y - 40 || which === "plan") window.scrollTo(0, y);
    }
    if (which === "plan") renderPlan();
    if (which === "day") renderDay(+m[1]);
    if (which === "overview") renderOverviewBits();
  }

  /* ---------- overview extras ---------- */
  function renderOverviewBits() {
    var n = nextUp();
    var btn = $("#ov-continue");
    if (btn) {
      if (S.done.length && n) { btn.textContent = "Continue · Day " + n.n; btn.href = "#day-" + n.n; }
      else if (!n) { btn.textContent = "Course complete · review"; btn.href = "#day-1"; }
    }
    var pr = $("#ov-progress");
    if (pr) pr.textContent = S.done.length + " of " + C.days.length + " days";
  }

  /* ---------- plan ---------- */
  function renderPlan() {
    var sched = schedule();
    var start = S.start ? parse(S.start) : today();
    var lastDates = sched[C.days[C.days.length - 1].n];
    var finish = lastDates[lastDates.length - 1];
    var form = $("#plan-form");
    form.start.value = iso(start);
    form.querySelector('input[name="study"][value="' + S.study + '"]').checked = true;
    form.querySelector('input[name="pace"][value="' + S.pace + '"]').checked = true;

    var totalH = C.days.reduce(function (a, d) { return a + d.hours; }, 0);
    var perDay = totalH / C.days.length / S.pace;
    $("#sum-finish").textContent = fmt(finish, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    $("#sum-span").textContent = Math.round((finish - start) / DAY_MS) + 1 + " calendar days";
    $("#sum-daily").textContent = "≈ " + perDay.toFixed(1).replace(".0", "") + " h per study day";
    var pct = Math.round(S.done.length / C.days.length * 100);
    $("#sum-progress").textContent = S.done.length + " / " + C.days.length + " days · " + pct + "%";
    $("#sum-bar").style.width = pct + "%";

    // today card
    var t = today(), todayDay = null;
    C.days.forEach(function (d) { if (sched[d.n].some(function (x) { return same(x, t); })) todayDay = d; });
    var tc = $("#today-card");
    var nx = nextUp();
    if (todayDay) {
      var part = S.pace > 1 ? (same(sched[todayDay.n][0], t) ? " · part 1 of 2" : " · part 2 of 2") : "";
      tc.innerHTML = '<p class="eyebrow">Today · ' + esc(fmt(t, { weekday: "long", month: "long", day: "numeric" })) + part + '</p>' +
        '<h3 style="font-family:var(--f-display);font-size:1.6rem;line-height:1.15;margin-top:10px">Day ' + todayDay.n + ': ' + esc(todayDay.title) + '</h3>' +
        '<p class="muted" style="margin-top:8px">' + esc(todayDay.goal) + '</p>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><a class="btn aura sm" href="#day-' + todayDay.n + '">' + (isDone(todayDay.n) ? "Review today's lesson" : "Open today's lesson") + ' <span class="arr">→</span></a>' +
        (nx && nx.n < todayDay.n ? '<a class="btn ghost sm" href="#day-' + nx.n + '">Catch up: Day ' + nx.n + '</a>' : "") + '</div>';
    } else if (start > t) {
      tc.innerHTML = '<p class="eyebrow">Starts ' + esc(fmt(start, { weekday: "long", month: "long", day: "numeric" })) + '</p><h3 style="font-family:var(--f-display);font-size:1.6rem;margin-top:10px">Your first lesson is ready when you are.</h3><div style="margin-top:16px"><a class="btn aura sm" href="#day-1">Preview Day 1 <span class="arr">→</span></a></div>';
    } else if (!nx) {
      tc.innerHTML = '<p class="eyebrow">Finished</p><h3 style="font-family:var(--f-display);font-size:1.6rem;margin-top:10px">You completed every day of this course.</h3>';
    } else {
      tc.innerHTML = '<p class="eyebrow">Rest day · ' + esc(fmt(t, { weekday: "long", month: "long", day: "numeric" })) + '</p><h3 style="font-family:var(--f-display);font-size:1.6rem;margin-top:10px">Nothing scheduled today.</h3><p class="muted" style="margin-top:8px">Next up is Day ' + nx.n + ': ' + esc(nx.title) + '.</p><div style="margin-top:16px"><a class="btn ghost sm" href="#day-' + nx.n + '">Get ahead</a></div>';
    }

    if (!calMonth) {
      var anchor = t < start ? start : (t > finish ? finish : t);
      calMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    }
    renderCalendar(sched);
    renderAgenda(sched);
  }

  function renderCalendar(sched) {
    var byDate = {};
    C.days.forEach(function (d) {
      sched[d.n].forEach(function (x, i) {
        var k = iso(x);
        (byDate[k] = byDate[k] || []).push({ d: d, part: sched[d.n].length > 1 ? i + 1 : 0 });
      });
    });
    $("#cal-title").textContent = MONTHS[calMonth.getMonth()] + " " + calMonth.getFullYear();
    var grid = $("#cal-grid");
    var html = DOW.map(function (w) { return '<div class="cal-dow">' + w + "</div>"; }).join("");
    var first = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
    var startCell = addDays(first, -first.getDay());
    var t = today();
    for (var i = 0; i < 42; i++) {
      var d = addDays(startCell, i);
      if (i >= 35 && d.getMonth() !== calMonth.getMonth()) break;
      var cls = "cal-cell" + (d.getMonth() !== calMonth.getMonth() ? " out" : "") + (same(d, t) ? " is-today" : "");
      var items = (byDate[iso(d)] || []).map(function (it) {
        var st = status(it.d.n, sched);
        var c = st === "done" ? " done" : (st === "late" ? " late" : "");
        return '<a class="cal-task' + c + '" href="#day-' + it.d.n + '" title="Day ' + it.d.n + ": " + esc(it.d.title) + '"><b><span class="dw">DAY </span>' + it.d.n + (it.part ? " · " + it.part + "/2" : "") + '</b><span class="tt">' + esc(it.d.short || it.d.title) + "</span></a>";
      }).join("");
      html += '<div class="' + cls + '"><span class="num">' + d.getDate() + "</span>" + items + "</div>";
    }
    grid.innerHTML = html;
  }

  function renderAgenda(sched) {
    var t = today();
    var list = C.days.filter(function (d) {
      var dates = sched[d.n];
      var last = dates[dates.length - 1];
      return last >= addDays(t, -2) || (!isDone(d.n) && last < t);
    });
    var late = list.filter(function (d) { return status(d.n, sched) === "late"; });
    var rest = list.filter(function (d) { return status(d.n, sched) !== "late"; }).slice(0, 7);
    var items = late.concat(rest);
    var lbl = { done: "Done", now: "Today", late: "Behind", upcoming: "Upcoming" };
    var cls = { done: "ok", now: "now", late: "late", upcoming: "" };
    $("#agenda-list").innerHTML = items.map(function (d) {
      var st = status(d.n, sched);
      return '<li><a href="#day-' + d.n + '"><span class="ad">' + esc(fmt(sched[d.n][0])) + '</span><span class="at">Day ' + d.n + ": " + esc(d.title) + "<small>" + d.hours + " h · " + esc(modOf(d.n).title) + '</small></span><span class="pill ' + cls[st] + '">' + lbl[st] + "</span></a></li>";
    }).join("") || '<li style="padding:14px 0;color:var(--fg-3)">Nothing scheduled in the next few days.</li>';
  }

  /* ---------- day reader ---------- */
  function renderToc(current) {
    var html = "";
    C.modules.forEach(function (m) {
      html += '<p class="tm">Module ' + m.n + " · " + esc(m.title) + "</p>";
      m.days.forEach(function (n) {
        var d = dayByN(n);
        html += '<a href="#day-' + n + '" class="' + (isDone(n) ? "done" : "") + '" aria-current="' + (n === current ? "true" : "false") + '"><span class="st">' + (isDone(n) ? "✓" : "") + "</span><span>" + n + ". " + esc(d.title) + "</span></a>";
      });
    });
    $("#toc").innerHTML = html;
    var sel = $("#toc-jump");
    if (sel) {
      sel.innerHTML = C.days.map(function (d) { return '<option value="' + d.n + '"' + (d.n === current ? " selected" : "") + ">Day " + d.n + " · " + esc(d.title) + (isDone(d.n) ? " ✓" : "") + "</option>"; }).join("");
    }
  }

  function renderDay(n) {
    var d = dayByN(n);
    if (!d) { location.hash = "#overview"; return; }
    var sched = schedule();
    var m = modOf(n);
    var dates = sched[n];
    var st = status(n, sched);
    var stLabel = { done: "Completed", now: "Scheduled today", late: "Behind schedule", upcoming: "Scheduled" }[st];
    var dateText = dates.map(function (x) { return fmt(x); }).join(" + ");
    var split = d.split;
    var tot = split.read + split.demo + split.tasks;

    var tasksHtml = d.tasks.map(function (t, i) {
      var id = "t-" + n + "-" + i;
      var k = n + "-" + i;
      return '<li><label for="' + id + '"><input type="checkbox" id="' + id + '" data-k="' + k + '"' + (S.tasks[k] ? " checked" : "") + '><span class="tx">' + t.html + (t.mins ? "<em>" + t.mins + " min</em>" : "") + "</span></label></li>";
    }).join("");

    var prev = n > 1 ? dayByN(n - 1) : null, next = dayByN(n + 1);

    var html =
      '<header class="day-head">' +
        '<div class="meta-row"><span class="chip"><span class="d"></span>Module ' + m.n + " · " + esc(m.title) + '</span><span class="chip">Day ' + n + " of " + C.days.length + '</span><span class="chip">' + d.hours + ' h</span><span class="chip">' + stLabel + " · " + esc(dateText) + "</span></div>" +
        "<h2>" + esc(d.title) + "</h2>" +
        '<p class="goal">' + esc(d.goal) + "</p>" +
        '<div class="time-split" aria-hidden="true"><i style="flex:' + split.read + ';background:var(--fg-2)"></i><i style="flex:' + split.demo + ';background:var(--fg-3)"></i><i style="flex:' + split.tasks + ';background:var(--aura)"></i></div>' +
        '<div class="time-key"><span><i style="background:var(--fg-2)"></i>Lesson ' + split.read + ' min</span><span><i style="background:var(--fg-3)"></i>Worked example ' + split.demo + ' min</span><span><i style="background:var(--aura)"></i>Tasks ' + split.tasks + " min</span><span>Total ≈ " + (tot / 60).toFixed(1).replace(".0", "") + " h</span></div>" +
      "</header>" +
      '<section class="part"><div class="part-label"><span class="eyebrow">The lesson</span></div><div class="prose">' + d.lesson + "</div></section>" +
      (d.demo ? '<section class="part"><div class="part-label"><span class="eyebrow">Worked example</span></div><div class="demo"><div class="prose">' + d.demo + "</div></div></section>" : "") +
      '<section class="part"><div class="part-label"><span class="eyebrow">Today\'s tasks</span></div><ul class="tasks">' + tasksHtml + "</ul></section>" +
      (d.deliverable ? '<section class="part"><div class="part-label"><span class="eyebrow">By tonight you\'ll have</span></div><div class="deliver"><span class="ic" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg></span><div class="prose">' + d.deliverable + "</div></div></section>" : "") +
      (d.tip ? '<section class="part"><div class="part-label"><span class="eyebrow">From experience</span></div><div class="prose">' + d.tip + "</div></section>" : "") +
      '<footer class="day-foot">' +
        '<div id="done-wrap">' + doneButton(n) + "</div>" +
        '<div class="pn">' + (prev ? '<a class="btn ghost sm" href="#day-' + prev.n + '">← Day ' + prev.n + "</a>" : "") + (next ? '<a class="btn sm" href="#day-' + next.n + '">Day ' + next.n + ': ' + esc(next.short || next.title) + ' <span class="arr">→</span></a>' : '<a class="btn sm" href="#plan">Back to plan</a>') + "</div>" +
      "</footer>";

    $("#day-body").innerHTML = html;
    renderToc(n);
    document.title = "Day " + n + ": " + d.title + " · " + C.title + " · SchoolAura";
    var top = document.getElementById("v-day").getBoundingClientRect().top + window.scrollY - 90;
    if (window.scrollY > top) window.scrollTo(0, top);
  }

  function doneButton(n) {
    return isDone(n)
      ? '<span class="done-flag">✓ Day ' + n + ' complete</span> <button class="btn ghost sm" type="button" data-undo="' + n + '" style="margin-left:10px">Mark as not done</button>'
      : '<button class="btn aura" type="button" data-done="' + n + '">Mark day ' + n + " complete</button>";
  }

  /* ---------- events ---------- */
  document.addEventListener("change", function (e) {
    var cb = e.target.closest(".tasks input[type=checkbox]");
    if (cb) {
      var k = cb.getAttribute("data-k");
      if (cb.checked) S.tasks[k] = 1; else delete S.tasks[k];
      save();
      var n = +k.split("-")[0];
      var d = dayByN(n);
      var all = d.tasks.every(function (_, i) { return S.tasks[n + "-" + i]; });
      if (all && !isDone(n)) SA.toast("All tasks ticked. Mark the day complete when you're happy with it.");
      return;
    }
    var f = e.target.closest("#plan-form");
    if (f) {
      S.start = f.start.value || iso(today());
      S.study = f.querySelector('input[name="study"]:checked').value;
      S.pace = +f.querySelector('input[name="pace"]:checked').value;
      save();
      calMonth = null;
      renderPlan();
      SA.toast("Plan updated. Your calendar has been recalculated.");
    }
    if (e.target.id === "toc-jump") location.hash = "#day-" + e.target.value;
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-done]");
    if (b) {
      var n = +b.getAttribute("data-done");
      if (!isDone(n)) S.done.push(n);
      save();
      $("#done-wrap").innerHTML = doneButton(n);
      renderToc(n);
      var nx = nextUp();
      SA.toast(nx ? "Day " + n + " done. Next: Day " + nx.n + "." : "That's the whole course. Well done.");
      return;
    }
    var u = e.target.closest("[data-undo]");
    if (u) {
      var m = +u.getAttribute("data-undo");
      S.done = S.done.filter(function (x) { return x !== m; });
      save();
      $("#done-wrap").innerHTML = doneButton(m);
      renderToc(m);
      return;
    }
    var nav = e.target.closest("[data-cal]");
    if (nav) {
      var dir = nav.getAttribute("data-cal");
      if (dir === "today") { var t = today(); calMonth = new Date(t.getFullYear(), t.getMonth(), 1); }
      else calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + (dir === "next" ? 1 : -1), 1);
      renderCalendar(schedule());
      return;
    }
    if (e.target.closest("[data-reset]")) {
      var r = e.target.closest("[data-reset]");
      if (r.getAttribute("data-armed") !== "1") {
        r.setAttribute("data-armed", "1");
        r.textContent = "Tap again to erase progress";
        setTimeout(function () { r.removeAttribute("data-armed"); r.textContent = "Reset progress"; }, 4000);
        return;
      }
      S = { start: iso(today()), study: S.study, pace: S.pace, done: [], tasks: {} };
      save();
      calMonth = null;
      renderPlan();
      SA.toast("Progress cleared. Your plan now starts today.");
    }
  });

  window.addEventListener("hashchange", route);
  route();
})();
