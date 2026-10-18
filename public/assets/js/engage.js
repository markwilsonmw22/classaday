/* SchoolAura engagement: streaks, XP, levels, badges, "continue where you left off", question of the day.
   Everything is derived from progress saved in this browser (sa.course.*) plus a small activity log (sa.engage).
   window.SA_META = {slug: {title, href, days, modules: [[day,...], ...]}} is injected by the build. */
(function () {
  var KEY = "sa.engage";
  var META = window.SA_META || {};
  var LEVELS = [[0, "Newcomer"], [100, "Starter"], [300, "Learner"], [600, "Builder"], [1000, "Achiever"], [1500, "Pro"], [2200, "Expert"], [3000, "Master"]];
  var BADGES = [
    { id: "first-lesson", icon: "🎯", name: "First step", how: "Complete your first lesson", test: function (s) { return s.lessons >= 1; } },
    { id: "streak-3", icon: "🔥", name: "On a roll", how: "Learn 3 days in a row", test: function (s) { return s.bestStreak >= 3; } },
    { id: "streak-7", icon: "⚡", name: "Week warrior", how: "Learn 7 days in a row", test: function (s) { return s.bestStreak >= 7; } },
    { id: "quiz-pass", icon: "🧠", name: "Quiz whiz", how: "Pass any module quiz", test: function (s) { return s.quizPass >= 1; } },
    { id: "quiz-perfect", icon: "💯", name: "Perfect score", how: "Score 100% on any quiz", test: function (s) { return s.perfect >= 1; } },
    { id: "module-done", icon: "🧩", name: "Module master", how: "Finish every lesson in a module", test: function (s) { return s.modulesDone >= 1; } },
    { id: "tasks-50", icon: "✅", name: "Doer", how: "Tick off 50 tasks", test: function (s) { return s.tasks >= 50; } },
    { id: "notes-5", icon: "✍️", name: "Note taker", how: "Write notes on 5 lessons", test: function (s) { return s.notes >= 5; } },
    { id: "explorer", icon: "🧭", name: "Explorer", how: "Complete lessons in 3 different courses", test: function (s) { return s.coursesStarted >= 3; } },
    { id: "kitchen-pro", icon: "🍰", name: "Kitchen pro", how: "Pass the Recipe Vault kitchen quiz", test: function (s) { return s.kitchen; } },
    { id: "final-pass", icon: "🎓", name: "Exam ready", how: "Pass a final exam", test: function (s) { return s.finals >= 1; } },
    { id: "graduate", icon: "🏆", name: "Graduate", how: "Finish a whole course and its final exam", test: function (s) { return s.coursesDone >= 1; } }
  ];

  function read(k, fallback) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? fallback : v; } catch (e) { return fallback; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function today() { return iso(new Date()); }
  function addDays(s, n) { var p = s.split("-"); return iso(new Date(+p[0], +p[1] - 1, +p[2] + n)); }

  function state() { var e = read(KEY, {}); e.activity = e.activity || []; e.badges = e.badges || {}; e.daily = e.daily || {}; return e; }

  function courses() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("sa.course.") === 0) out[k.slice(10)] = read(k, {}) || {};
      }
    } catch (e) {}
    return out;
  }

  function streaks(activity) {
    var set = {}; activity.forEach(function (d) { set[d] = 1; });
    var t = today(), cur = 0, d = set[t] ? t : addDays(t, -1);
    while (set[d]) { cur++; d = addDays(d, -1); }
    var best = 0, run = 0, sorted = Object.keys(set).sort(), prev = null;
    sorted.forEach(function (x) { run = prev && addDays(prev, 1) === x ? run + 1 : 1; best = Math.max(best, run); prev = x; });
    return { current: cur, best: Math.max(best, cur), activeToday: !!set[t] };
  }

  function stats() {
    var c = courses(), e = state();
    var s = { lessons: 0, tasks: 0, quizPass: 0, perfect: 0, finals: 0, notes: 0, modulesDone: 0, coursesStarted: 0, coursesDone: 0, kitchen: false, daily: Object.keys(e.daily).filter(function (k) { return e.daily[k] && e.daily[k].right; }).length };
    Object.keys(c).forEach(function (slug) {
      var st = c[slug] || {}, done = st.done || [], q = st.quiz || {}, m = META[slug];
      s.lessons += done.length;
      if (done.length) s.coursesStarted++;
      s.tasks += Object.keys(st.tasks || {}).length;
      Object.keys(st.notes || {}).forEach(function (k) { if ((st.notes[k] || "").trim().length >= 10) s.notes++; });
      Object.keys(q).forEach(function (k) {
        if (!q[k]) return;
        if (q[k].passed) { if (k === "final") s.finals++; else s.quizPass++; }
        if (q[k].best === 100) s.perfect++;
      });
      if (slug === "recipe-vault" && q.vault && q.vault.passed) s.kitchen = true;
      if (m) {
        m.modules.forEach(function (days) { if (days.length && days.every(function (d) { return done.indexOf(d) !== -1; })) s.modulesDone++; });
        if (done.length >= m.days && q.final && q.final.passed) s.coursesDone++;
      }
    });
    var st = streaks(e.activity);
    s.streak = st.current; s.bestStreak = st.best; s.activeToday = st.activeToday;
    s.xp = s.lessons * 20 + s.tasks * 2 + s.quizPass * 50 + s.perfect * 25 + s.finals * 150 + s.notes * 5 + s.daily * 10 + s.modulesDone * 30;
    var lv = 0; LEVELS.forEach(function (l, i) { if (s.xp >= l[0]) lv = i; });
    s.level = lv + 1; s.levelName = LEVELS[lv][1];
    s.levelFloor = LEVELS[lv][0]; s.levelNext = LEVELS[lv + 1] ? LEVELS[lv + 1][0] : null;
    return s;
  }

  /* Record activity for today and announce any newly earned badges. */
  function touch() {
    var e = state(), t = today();
    if (e.activity.indexOf(t) === -1) { e.activity.push(t); e.activity = e.activity.slice(-120); }
    write(KEY, e);
    var s = stats();
    var fresh = BADGES.filter(function (b) { return b.test(s) && !e.badges[b.id]; });
    fresh.forEach(function (b) { e.badges[b.id] = t; });
    write(KEY, e);
    if (fresh.length && window.SA && SA.toast) {
      SA.toast(fresh.length === 1 ? fresh[0].icon + " Badge unlocked: " + fresh[0].name : "🏅 " + fresh.length + " badges unlocked: " + fresh.map(function (b) { return b.name; }).join(", "));
    }
    renderAll();
  }

  function setLast(info) { var e = state(); e.last = info; e.last.ts = Date.now(); write(KEY, e); }

  /* ---------- renderers ---------- */
  function levelBar(s) {
    var pct = s.levelNext ? Math.round((s.xp - s.levelFloor) / (s.levelNext - s.levelFloor) * 100) : 100;
    return '<div class="lv"><div class="lv-top"><b>Level ' + s.level + " · " + s.levelName + "</b><span>" + s.xp + " XP" + (s.levelNext ? " · " + (s.levelNext - s.xp) + " to level " + (s.level + 1) : "") + "</span></div>" +
      '<div class="track"><i style="width:' + pct + '%"></i></div></div>';
  }

  function renderPanel(el) {
    var s = stats(), e = state();
    var earned = BADGES.filter(function (b) { return e.badges[b.id] || b.test(s); }).length;
    el.innerHTML =
      '<div class="me-grid">' +
        '<div class="me-stat"><span class="me-ic">🔥</span><div><b>' + (s.streak ? s.streak + "-day streak" : "No streak yet") + "</b><span>" + (s.activeToday ? "You've learned today. See you tomorrow!" : s.streak ? "Do one lesson or quiz today to keep it going." : "Complete a lesson today to start a streak.") + "</span></div></div>" +
        '<div class="me-stat">' + levelBar(s) + "</div>" +
        '<div class="me-stat"><span class="me-ic">🏅</span><div><b>' + earned + " of " + BADGES.length + " badges</b><span>" + s.lessons + " lessons · " + (s.quizPass + s.finals) + " quizzes passed · " + s.tasks + " tasks</span></div></div>" +
      "</div>" +
      '<div class="badges" role="list">' + BADGES.map(function (b) {
        var got = !!(e.badges[b.id] || b.test(s));
        return '<div class="badge' + (got ? " got" : "") + '" role="listitem" title="' + esc(b.how) + '"><span class="bi" aria-hidden="true">' + b.icon + "</span><b>" + esc(b.name) + "</b><small>" + (got ? "Earned" : esc(b.how)) + "</small></div>";
      }).join("") + "</div>";
  }

  function renderContinue(el) {
    var e = state();
    if (!e.last || !e.last.href) { el.hidden = true; return; }
    el.hidden = false;
    var s = stats();
    el.innerHTML = '<div class="continue"><div><p class="k">Continue where you left off</p><p class="t">' + esc(e.last.title) + " · Day " + e.last.day + ": " + esc(e.last.dayTitle) + "</p></div>" +
      '<div class="continue-r">' + (s.streak ? '<span class="pill now">🔥 ' + s.streak + "-day streak</span>" : "") + '<a class="btn" href="' + esc(e.last.href) + '">Continue</a></div></div>';
  }

  function renderChip(el) {
    var s = stats();
    el.innerHTML = '<span class="me-chip" title="Your streak and level"><span>🔥 ' + s.streak + "</span><span>Lv " + s.level + "</span><span>" + s.xp + " XP</span></span>";
  }

  /* Question of the day: one question from every course's quizzes, the same for everyone on a given day. */
  function renderDaily(el) {
    var pool = window.SA_DAILY || [];
    if (!pool.length) return;
    var t = today(), seed = 0;
    for (var i = 0; i < t.length; i++) seed = (seed * 31 + t.charCodeAt(i)) >>> 0;
    var q = pool[seed % pool.length], e = state(), answered = e.daily[t];
    function draw(choice) {
      var done = choice != null;
      el.innerHTML = '<div class="daily"><div class="daily-top"><p class="k">Question of the day · +10 XP</p><span class="pill">' + esc(q.course) + "</span></div>" +
        '<h3>' + esc(q.q) + "</h3>" +
        '<div class="quiz-opts">' + q.o.map(function (opt, k) {
          var cls = done ? (k === q.a ? " right" : k === choice ? " wrong" : " dim") : "";
          return '<button type="button" class="quiz-opt' + cls + '" data-k="' + k + '"' + (done ? " disabled" : "") + '><span class="key">' + "ABCD"[k] + '</span><span class="txt">' + esc(opt) + "</span></button>";
        }).join("") + "</div>" +
        (done ? '<div class="fb ' + (choice === q.a ? "ok" : "no") + '"><p class="verdict">' + (choice === q.a ? "Correct! +10 XP" : "Not quite. Come back tomorrow for a new one.") + "</p><p>" + esc(q.why) + '</p><p class="rv"><a class="link" href="' + esc(q.href) + '">Learn more in ' + esc(q.course) + " →</a></p></div>" : "") +
        "</div>";
    }
    draw(answered ? answered.choice : null);
    el.onclick = function (ev) {
      var b = ev.target.closest(".quiz-opt"); if (!b || b.disabled) return;
      var k = +b.getAttribute("data-k"), st = state();
      if (st.daily[t]) return;
      st.daily[t] = { choice: k, right: k === q.a };  // XP is only counted for right answers
      write(KEY, st);
      draw(k);
      touch();
    };
  }

  function renderAll() {
    var p = document.getElementById("engage-panel"); if (p) renderPanel(p);
    var c = document.getElementById("continue-banner"); if (c) renderContinue(c);
    var m = document.getElementById("me-chip"); if (m) renderChip(m);
  }

  window.SAEngage = { stats: stats, touch: touch, setLast: setLast, renderAll: renderAll, badges: BADGES };
  renderAll();
  var d = document.getElementById("daily-q"); if (d) renderDaily(d);
})();
