/* SchoolAura course engine: classroom (lessons), calendar, quizzes, certificate and progress.
   Progress lives in this browser (localStorage) until accounts arrive with membership. */
(function () {
  var C = window.COURSE;
  if (!C) return;
  var KEY = "sa.course." + C.slug;
  var DAY_MS = 86400000;
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  var QZ = C.quiz || null;
  var MODQ = QZ ? QZ.modules : {};
  var FINAL = QZ && QZ.final ? QZ.final : { count: 15, pass: 80 };
  /* Each lesson has its own page (/courses/<slug>/day-N/); calendar, quizzes and about live on the course page. */
  var PAGE_DAY = window.SA_DAY || null;
  /* Lesson text is not in course-data.js: each lesson page brings its own (SA_DAY_DATA). Locked previews
     (SA_LOCKED) have none, so only the lesson list and progress are drawn there. */
  var LOCKED = !!window.SA_LOCKED;
  if (PAGE_DAY && window.SA_DAY_DATA) {
    C.days.forEach(function (d) { if (d.n === PAGE_DAY) Object.keys(window.SA_DAY_DATA).forEach(function (k) { d[k] = window.SA_DAY_DATA[k]; }); });
  }
  var CFG = window.SA_CONFIG || {};
  function member() { return !CFG.live || !!(window.SAAuth && SAAuth.isMember()); }
  function lockedDay(n) { return !member() && (CFG.freeDays || [1]).indexOf(n) === -1; }
  var LOCK_SVG = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  function quizLock() {
    var next = encodeURIComponent(location.pathname + location.hash);
    return '<div class="lock-card"><span class="lock-ic" aria-hidden="true">' + LOCK_SVG.replace(/width="10" height="10"/, 'width="22" height="22"') + "</span>" +
      "<h2>Quizzes are for members</h2><p>Module quizzes, the final exam and your certificate come with a membership, along with every lesson in every course.</p>" +
      '<div class="lock-actions"><a class="btn color lg" href="/join/">See plans</a><a class="btn light lg" href="/login/?next=' + next + '">Log in</a></div></div>';
  }
  var IDX = /\/index\.html$/.test(location.pathname) ? "index.html" : "";
  var BASE = location.pathname.replace(/day-\d+\/(index\.html)?$/, "").replace(/index\.html$/, "");
  function dayHref(n) { return BASE + "day-" + n + "/" + IDX; }
  function homeHref(h) { return BASE + IDX + (h ? "#" + h : ""); }
  var CUR_DAY = null;
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function engage(fn) { if (window.SAEngage) SAEngage[fn].apply(null, Array.prototype.slice.call(arguments, 1)); }

  /* ---------- state ---------- */
  function load() {
    var s = null;
    try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { s = null; }
    s = s || {};
    return { start: s.start || null, study: s.study || "all", pace: s.pace || 1, done: s.done || [], tasks: s.tasks || {},
      quiz: s.quiz || {}, notes: s.notes || {}, feel: s.feel || {}, certDate: s.certDate || null };
  }
  var S = load();
  function save() {
    if (!S.start) S.start = iso(today());
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  }
  function getName() { try { return localStorage.getItem("sa.name") || ""; } catch (e) { return ""; } }
  function setName(v) { try { localStorage.setItem("sa.name", v); } catch (e) {} }

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

  /* ---------- quiz helpers ---------- */
  function modQs(mn) { return MODQ[String(mn)] || []; }
  function hasQuiz(mn) { return modQs(mn).length > 0; }
  function qRes(id) { return S.quiz[id] || null; }
  function quizModules() { return C.modules.filter(function (m) { return hasQuiz(m.n); }); }
  function passedCount() { return quizModules().filter(function (m) { var r = qRes("m" + m.n); return r && r.passed; }).length; }
  function allLessonsDone() { return C.days.every(function (d) { return isDone(d.n); }); }
  function certReady() { var f = qRes("final"); return allLessonsDone() && !!(f && f.passed); }
  function quizPill(id) {
    var r = qRes(id);
    if (!r) return '<span class="pill">Not started</span>';
    return r.passed ? '<span class="pill ok">Passed · ' + r.best + "%</span>" : '<span class="pill late">Best ' + r.best + "%</span>";
  }
  function allQuestions() { var out = []; Object.keys(MODQ).forEach(function (k) { out = out.concat(MODQ[k]); }); return out; }

  /* ---------- shared bits ---------- */
  function syncProgress() {
    document.querySelectorAll("[data-course-progress]").forEach(function (el) {
      el.querySelector("i").style.width = pct() + "%";
      el.querySelector("span").textContent = pct() + "%";
    });
    var n = nextUp();
    var tab = document.querySelector('.tabs a[data-view="day"]');
    if (tab) tab.href = dayHref(n ? n.n : 1);
    var cont = $("#continue");
    if (cont) {
      if (!S.done.length) { cont.textContent = "Start course"; cont.href = dayHref(1); }
      else if (n) { cont.textContent = "Continue · Day " + n.n; cont.href = dayHref(n.n); }
      else { cont.textContent = "Review the course"; cont.href = dayHref(1); }
    }
    var dc = $("#done-count"); if (dc) dc.textContent = S.done.length + " of " + C.days.length;
    var qc = $("#quiz-count"); if (qc) qc.textContent = passedCount() + " of " + quizModules().length;
  }

  /* ---------- routing ---------- */
  var views = { about: $("#v-about"), plan: $("#v-plan"), quizzes: $("#v-quizzes"), quiz: $("#v-quiz") };
  var calMonth = null;
  var BASE_TITLE = document.title;
  function route() {
    var h = (location.hash || "").replace("#", "");
    var md = /^day-(\d+)$/.exec(h);
    if (md) { location.replace(dayHref(+md[1])); return; }          // old #day-N links
    if (PAGE_DAY) {
      if (/^(plan|quizzes|certificate|about|quiz-(m\d+|final))$/.test(h)) { location.replace(homeHref(h)); return; }
      if (LOCKED) { renderNav(PAGE_DAY); syncProgress(); return; }
      renderDay(PAGE_DAY);
      syncProgress();
      return;
    }
    var q = /^quiz-(m\d+|final)$/.exec(h);
    var which = h === "plan" ? "plan" : (h === "quizzes" || h === "certificate") && QZ ? "quizzes" : q && QZ ? "quiz" : "about";
    Object.keys(views).forEach(function (k) { if (views[k]) views[k].hidden = k !== which; });
    var tabView = which === "quiz" ? "quizzes" : which;
    document.querySelectorAll(".tabs a").forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("data-view") === tabView ? "true" : "false"); });
    if (which === "plan") renderPlan();
    if (which === "quizzes") renderQuizzes();
    if (which === "quiz") renderQuiz(q[1]);
    if (which === "about") document.title = BASE_TITLE;
    syncProgress();
    if (h === "certificate") { var cc = $("#cert-card"); if (cc) setTimeout(function () { cc.scrollIntoView({ block: "start" }); }, 0); }
    else if (which !== "about" || h) window.scrollTo(0, 0);
  }

  /* ---------- classroom ---------- */
  function renderNav(current) {
    var html = "", opts = "";
    C.modules.forEach(function (m) {
      html += '<p class="mtitle">' + esc(m.title) + "</p>";
      m.days.forEach(function (n) {
        var d = dayByN(n), lk = lockedDay(n) && !isDone(n);
        html += '<a href="' + dayHref(n) + '" class="' + (isDone(n) ? "done" : lk ? "locked" : "") + '" aria-current="' + (n === current ? "true" : "false") + '"><span class="ck">' + (isDone(n) ? "✓" : lk ? LOCK_SVG : "") + "</span><span>Day " + n + ": " + esc(d.title) + (lk ? '<span class="sr-only"> (members)</span>' : "") + "</span></a>";
        opts += '<option value="' + dayHref(n) + '"' + (n === current ? " selected" : "") + ">" + (isDone(n) ? "✓ " : lk ? "🔒 " : "") + "Day " + n + ": " + esc(d.title) + "</option>";
      });
      if (hasQuiz(m.n)) {
        var r = qRes("m" + m.n);
        html += '<a href="' + homeHref("quiz-m" + m.n) + '" class="qlink' + (r && r.passed ? " done" : "") + '"><span class="ck">' + (r && r.passed ? "✓" : "?") + "</span><span>Module " + m.n + " quiz" + (r ? ' <small>' + (r.passed ? "passed" : "best " + r.best + "%") + "</small>" : "") + "</span></a>";
        opts += '<option value="' + homeHref("quiz-m" + m.n) + '">' + (r && r.passed ? "✓ " : "") + "Module " + m.n + " quiz</option>";
      }
    });
    if (QZ) {
      html += '<p class="mtitle">Finish</p><a href="' + homeHref("quizzes") + '" class="qlink' + (certReady() ? " done" : "") + '"><span class="ck">' + (certReady() ? "✓" : "★") + "</span><span>Final exam and certificate</span></a>";
      opts += '<option value="' + homeHref("quizzes") + '">Final exam and certificate</option>';
    }
    $("#lesson-list").innerHTML = html;
    var cur = $('#lesson-list a[aria-current="true"]');
    if (cur) { var box = $("#lesson-list"); var top = cur.offsetTop - box.offsetTop; if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - 60) box.scrollTop = top - 80; }
    $("#jump").innerHTML = opts;
  }

  function doneToggle(n) {
    return '<button type="button" class="done-toggle' + (isDone(n) ? " on" : "") + '" data-toggle="' + n + '" aria-pressed="' + isDone(n) + '"><span class="ck">' + (isDone(n) ? "✓" : "") + "</span>" + (isDone(n) ? "Completed" : "Mark as done") + "</button>";
  }

  /* Quick check: the quiz questions written for this lesson, answered inline. */
  var checkState = {};
  function quickCheck(n, m) {
    var qs = modQs(m.n).filter(function (q) { return q.day === n; }).slice(0, 2);
    if (!qs.length) return "";
    checkState = { n: n, qs: qs.map(function (q) { return { q: q, order: SAQuiz.shuffle(q.o.map(function (_, i) { return i; })) }; }) };
    return checkState.qs.map(function (it, qi) {
      return '<div class="qc" data-qc="' + qi + '"><p class="qc-q">' + esc(it.q.q) + '</p><div class="quiz-opts">' +
        it.order.map(function (oi, k) { return '<button type="button" class="quiz-opt" data-qc-oi="' + oi + '"><span class="key">' + "ABCD"[k] + '</span><span class="txt">' + esc(it.q.o[oi]) + "</span></button>"; }).join("") +
        '</div><div class="qc-fb" aria-live="polite"></div></div>';
    }).join("");
  }

  var FEEL = [["lost", "😕", "Lost"], ["ok", "🙂", "Getting there"], ["great", "😎", "Nailed it"]];
  function feelMsg(k, m, lastOfMod) {
    if (k === "lost") return "That's normal with a new topic. Re-read the worked example, then try the first task again. Your notes below are a good place to write down what's unclear.";
    if (k === "ok") return "Good. Do the tasks before you move on: that's where it sticks.";
    return "Brilliant. Mark the lesson as done to keep your streak going." + (lastOfMod && hasQuiz(m.n) ? ' <a class="link" href="' + homeHref("quiz-m" + m.n) + '">Ready for the Module ' + m.n + " quiz? →</a>" : "");
  }

  function renderDay(n) {
    var d = dayByN(n);
    if (!d) { location.replace(homeHref("about")); return; }
    CUR_DAY = n;
    var sc = schedule(), m = modOf(n), st = status(n, sc);
    var stTxt = { done: "Completed", now: "Today", late: "Behind schedule", upcoming: "Scheduled" }[st];
    var sp = d.split, tot = sp.read + sp.demo + sp.tasks;
    var lastOfMod = m.days[m.days.length - 1] === n;
    var tasks = d.tasks.map(function (t, i) {
      var k = n + "-" + i, id = "t-" + k;
      return '<li><label for="' + id + '"><input type="checkbox" id="' + id + '" data-k="' + k + '"' + (S.tasks[k] ? " checked" : "") + '><span class="tx">' + t.html + "</span>" + (t.mins ? '<span class="mins">' + t.mins + " min</span>" : "<span></span>") + "</label></li>";
    }).join("");
    var prev = dayByN(n - 1), next = dayByN(n + 1), pi = 0;
    function part(icon, title, inner, cls) { return '<section class="part' + (cls ? " " + cls : "") + '"><h2 class="part-h"><span class="pi">' + icon + "</span>" + title + "</h2>" + inner + "</section>"; }
    var qc = QZ && window.SAQuiz ? quickCheck(n, m) : "";
    var mq = "";
    if (lastOfMod && hasQuiz(m.n)) {
      var r = qRes("m" + m.n);
      mq = '<div class="mq-cta"><span class="mq-ic" aria-hidden="true">🧠</span><div><p class="k">End of Module ' + m.n + "</p><h4>" + esc(m.title) + " quiz</h4><p class=\"muted\">" + modQs(m.n).length + " questions · pass mark 80% · about " + Math.max(3, Math.ceil(modQs(m.n).length / 2)) + " minutes</p></div>" +
        '<div class="mq-r">' + quizPill("m" + m.n) + '<a class="btn color" href="' + homeHref("quiz-m" + m.n) + '">' + (r ? (r.passed ? "Retake quiz" : "Try again") : "Take the quiz") + "</a></div></div>";
    }
    var feel = S.feel[n];
    var checkin = '<div class="checkin"><p class="ci-q">How did today go?</p><div class="feel" role="group" aria-label="How did today go?">' +
      FEEL.map(function (f) { return '<button type="button" class="feel-btn" data-feel="' + f[0] + '" aria-pressed="' + (feel === f[0]) + '"><span aria-hidden="true">' + f[1] + "</span>" + f[2] + "</button>"; }).join("") +
      '</div><p class="feel-msg" aria-live="polite">' + (feel ? feelMsg(feel, m, lastOfMod) : "") + "</p>" +
      '<label class="notes-l" for="lesson-notes">Your notes <span class="muted" id="notes-status">Saved on this device</span></label>' +
      '<textarea id="lesson-notes" data-n="' + n + '" rows="4" placeholder="Key ideas, numbers to remember, questions to look into…">' + esc(S.notes[n] || "") + "</textarea></div>";

    $("#lesson").innerHTML =
      '<div class="lesson-top"><div><p class="crumb">' + esc(m.title) + " · Day " + n + " of " + C.days.length + "</p><h1>" + esc(d.title) + "</h1></div>" + doneToggle(n) + "</div>" +
      '<div class="meta-chips"><span class="mchip">' + d.hours + ' hours</span><span class="mchip st-' + st + '">' + stTxt + " · " + esc(sc[n].map(function (x) { return fmt(x); }).join(" + ")) + "</span></div>" +
      '<p class="goal">' + esc(d.goal) + "</p>" +
      '<div class="time-bar" aria-hidden="true"><i style="flex:' + sp.read + ';background:#c9c7c1"></i><i style="flex:' + sp.demo + ';background:#e3e1db"></i><i style="flex:' + sp.tasks + ';background:var(--aura)"></i></div>' +
      '<div class="time-key"><span><i style="background:#c9c7c1"></i>Lesson ' + sp.read + ' min</span><span><i style="background:#e3e1db"></i>Example ' + sp.demo + ' min</span><span><i style="background:var(--aura)"></i>Tasks ' + sp.tasks + " min</span><span>≈ " + (tot / 60).toFixed(1).replace(".0", "") + " h total</span></div>" +
      part(++pi, "Lesson", '<div class="prose">' + d.lesson + "</div>") +
      (d.demo ? part(++pi, "Worked example", '<div class="demo-box"><div class="prose">' + d.demo + "</div></div>") : "") +
      (qc ? part(++pi, "Quick check", '<p class="muted qc-intro">Answer from memory. It takes a minute and helps the lesson stick.</p>' + qc) : "") +
      part(++pi, "Today's tasks", '<ul class="tasks">' + tasks + "</ul>") +
      (d.deliverable ? part("✓", "By tonight you'll have", '<div class="deliver"><div class="prose">' + d.deliverable + "</div></div>") : "") +
      (d.tip ? part("★", "Tip", '<div class="prose">' + d.tip + "</div>") : "") +
      (mq ? '<section class="part">' + mq + "</section>" : "") +
      part("✎", "Check in", checkin) +
      '<div class="lesson-foot">' + (prev ? '<a class="btn light" href="' + dayHref(prev.n) + '">← Previous</a>' : "<span></span>") +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' + doneToggle(n) + (next ? '<a class="btn" href="' + dayHref(next.n) + '">Next lesson →</a>' : QZ ? '<a class="btn" href="' + homeHref("quizzes") + '">Final exam →</a>' : '<a class="btn" href="' + homeHref("plan") + '">Back to calendar</a>') + "</div></div>";
    renderNav(n);
    if (window.SATools) SATools.mount($("#lesson"));
    document.title = d.title + " · " + C.title + " Day " + n + " · SchoolAura";
    var abs = dayHref(n); try { abs = new URL(abs, location.href).href; } catch (e) {}
    engage("setLast", { slug: C.slug, title: C.title, day: n, dayTitle: d.title, href: abs });
  }

  /* ---------- quizzes ---------- */
  function renderQuizzes() {
    var mods = quizModules();
    $("#quiz-cards").innerHTML = (member() ? "" : '<p class="quiz-lock-note">' + LOCK_SVG + ' Quizzes, the final exam and certificates are for members. <a class="link" href="/join/">See plans</a></p>') + mods.map(function (m) {
      var r = qRes("m" + m.n), done = m.days.filter(isDone).length;
      return '<div class="qcard' + (r && r.passed ? " passed" : "") + '"><div class="qcard-n">' + (r && r.passed ? "✓" : m.n) + "</div>" +
        '<div class="qcard-b"><p class="k">Module ' + m.n + " · " + modQs(m.n).length + " questions</p><h3>" + esc(m.title) + "</h3>" +
        '<p class="muted">Lessons done: ' + done + " of " + m.days.length + (r ? " · " + r.attempts + (r.attempts === 1 ? " attempt" : " attempts") : "") + "</p></div>" +
        '<div class="qcard-r">' + quizPill("m" + m.n) + '<a class="btn ' + (r && r.passed ? "light" : "") + ' sm" href="#quiz-m' + m.n + '">' + (r ? (r.passed ? "Retake" : "Try again") : "Start") + "</a></div></div>";
    }).join("");

    var f = qRes("final"), pc = passedCount(), total = allQuestions().length, cnt = Math.min(FINAL.count, total);
    $("#final-card").innerHTML =
      '<div class="final-top"><div><p class="k">Final exam</p><h2 class="vh">' + esc(C.title) + " final</h2>" +
      '<p class="muted" style="margin-top:4px">' + cnt + " questions picked at random from all " + mods.length + " modules. Pass mark " + FINAL.pass + "%. A new mix every attempt.</p></div>" + quizPill("final") + "</div>" +
      (pc < mods.length ? '<p class="hint-line">Tip: pass the module quizzes first. You\'ve passed ' + pc + " of " + mods.length + ".</p>" : '<p class="hint-line ok">All module quizzes passed. You\'re ready.</p>') +
      '<div class="btn-row"><a class="btn color" href="#quiz-final">' + (f ? (f.passed ? "Retake the final" : "Try the final again") : "Start the final exam") + "</a></div>";

    renderCert();

    var s = window.SAEngage ? SAEngage.stats() : null;
    $("#quiz-side").innerHTML = '<h3 style="font-size:1.1rem">Your scores</h3>' +
      '<dl class="kv" style="margin-top:10px"><div><dt>Module quizzes passed</dt><dd>' + pc + " of " + mods.length + "</dd></div>" +
      "<div><dt>Final exam</dt><dd>" + (f ? (f.passed ? "Passed · " : "Best ") + f.best + "%" : "Not taken") + "</dd></div>" +
      "<div><dt>Lessons done</dt><dd>" + S.done.length + " of " + C.days.length + "</dd></div>" +
      (s ? "<div><dt>Level</dt><dd>" + s.level + " · " + esc(s.levelName) + "</dd></div><div><dt>Streak</dt><dd>🔥 " + s.streak + (s.streak === 1 ? " day" : " days") + "</dd></div>" : "") + "</dl>" +
      '<p class="muted" style="font-size:.88rem;margin-top:12px">Each quiz you pass earns 50 XP, a perfect score earns 25 more, and passing the final earns 150.</p>';
  }

  function renderQuiz(id) {
    var isFinal = id === "final", mn = isFinal ? null : +id.slice(1);
    var root = $("#quiz-root");
    if (!isFinal && !hasQuiz(mn)) { location.hash = "#quizzes"; return; }
    if (!member()) { root.innerHTML = quizLock(); return; }
    var m = isFinal ? null : C.modules.filter(function (x) { return x.n === mn; })[0];
    var qs = isFinal ? SAQuiz.shuffle(allQuestions()).slice(0, Math.min(FINAL.count, allQuestions().length)) : modQs(mn);
    var nextMod = isFinal ? null : C.modules.filter(function (x) { return x.n === mn + 1; })[0];
    document.title = (isFinal ? "Final exam" : "Module " + mn + " quiz") + " · " + C.title + " · SchoolAura";
    SAQuiz.run(root, {
      title: isFinal ? C.title + " final exam" : "Module " + mn + ": " + m.title,
      questions: qs, pass: isFinal ? FINAL.pass : 80, shuffleQuestions: !isFinal,
      review: function (q) { var d = dayByN(q.day); return d ? { href: dayHref(d.n), label: "Review Day " + d.n + ": " + d.title } : null; },
      onFinish: function (res) {
        var prev = S.quiz[id] || { best: 0, attempts: 0, passed: false };
        S.quiz[id] = { best: Math.max(prev.best, res.pct), last: res.pct, attempts: prev.attempts + 1, passed: prev.passed || res.passed };
        if (certReady() && !S.certDate) S.certDate = iso(today());
        save(); syncProgress();
        engage("touch");
      },
      backHref: "#quizzes", backLabel: "All quizzes",
      extraActions: function (res) {
        if (!res.passed) return "";
        if (isFinal) return certReady() ? '<a class="btn color" href="#certificate">Get your certificate</a>' : "";
        return nextMod ? '<a class="btn color" href="' + dayHref(nextMod.days[0]) + '">Start Module ' + nextMod.n + " →</a>" : '<a class="btn color" href="#quiz-final">Take the final exam →</a>';
      }
    });
  }

  /* ---------- certificate ---------- */
  function certId(name) {
    var s = C.slug + "|" + name.trim().toLowerCase() + "|" + (S.certDate || ""), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return "SA-" + C.code.replace(/\s+/g, "") + "-" + h.toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
  }
  function renderCert() {
    var el = $("#cert-card"), ready = certReady(), f = qRes("final"), name = getName();
    var lessonsOk = allLessonsDone(), finalOk = !!(f && f.passed);
    el.innerHTML =
      '<div class="final-top"><div><p class="k">Certificate</p><h2 class="vh">Certificate of completion</h2>' +
      '<p class="muted" style="margin-top:4px">' + (ready ? "You've earned it. Add your name, download it and share it." : "Finish every lesson and pass the final exam to unlock your certificate.") + "</p></div>" +
      (ready ? '<span class="pill ok">Unlocked</span>' : '<span class="pill">Locked</span>') + "</div>" +
      '<ul class="req"><li class="' + (lessonsOk ? "ok" : "") + '"><span class="ck">' + (lessonsOk ? "✓" : "") + "</span>All " + C.days.length + " lessons marked done <small>" + S.done.length + " of " + C.days.length + "</small></li>" +
      '<li class="' + (finalOk ? "ok" : "") + '"><span class="ck">' + (finalOk ? "✓" : "") + "</span>Final exam passed <small>" + (f ? "best " + f.best + "%" : "not taken yet") + "</small></li></ul>" +
      (ready ? '<div class="field" style="margin-top:16px"><label for="cert-name">Name on the certificate</label><input type="text" id="cert-name" class="text-in" maxlength="48" autocomplete="name" placeholder="Your full name" value="' + esc(name) + '"></div>' : "") +
      '<div class="cert-frame' + (ready ? "" : " locked") + '"><canvas id="cert-canvas" width="1600" height="1131" aria-label="Certificate preview"></canvas>' + (ready ? "" : '<span class="lock" aria-hidden="true">🔒</span>') + "</div>" +
      (ready ? '<div class="btn-row"><button type="button" class="btn" id="cert-dl">Download PNG</button>' +
        '<a class="btn light" id="cert-li" target="_blank" rel="noopener">Add to LinkedIn</a><a class="btn light" id="cert-x" target="_blank" rel="noopener">Share on X</a></div>' : "");
    drawCert();
  }

  function fitFont(ctx, text, weight, size, max) {
    do { ctx.font = weight + " " + size + "px Figtree, system-ui, sans-serif"; size -= 2; } while (ctx.measureText(text).width > max && size > 20);
  }
  function drawCert() {
    var cv = $("#cert-canvas"); if (!cv) return;
    var ready = certReady(), nameIn = $("#cert-name");
    var name = (nameIn ? nameIn.value : getName()).trim() || "Your name";
    var f = qRes("final"), aura = getComputedStyle(document.body).getPropertyValue("--aura").trim() || "#1d1e20";
    var go = function () {
      var x = cv.getContext("2d"), W = cv.width, H = cv.height, cx = W / 2;
      x.clearRect(0, 0, W, H);
      x.fillStyle = "#fffdf9"; x.fillRect(0, 0, W, H);
      x.strokeStyle = "#e7e5e0"; x.lineWidth = 2; x.strokeRect(36, 36, W - 72, H - 72);
      x.strokeStyle = aura; x.lineWidth = 3; x.strokeRect(54, 54, W - 108, H - 108);
      x.fillStyle = aura; x.fillRect(54, 54, W - 108, 10);
      // brand
      var bx = 120, by = 150, cols = ["#e2702a", "#3462e0", "#2b8a57", "#d24660"];
      cols.forEach(function (c, i) { x.beginPath(); x.moveTo(bx, by); x.arc(bx, by, 22, -Math.PI / 2 + i * Math.PI / 2, -Math.PI / 2 + (i + 1) * Math.PI / 2); x.closePath(); x.fillStyle = c; x.fill(); });
      x.beginPath(); x.arc(bx, by, 11, 0, Math.PI * 2); x.fillStyle = "#fffdf9"; x.fill();
      x.fillStyle = "#1d1e20"; x.font = "800 36px Figtree, system-ui, sans-serif"; x.textAlign = "left"; x.textBaseline = "middle"; x.fillText("schoolaura", bx + 36, by + 1);
      x.textAlign = "right"; x.fillStyle = "#6c6e73"; x.font = "700 24px Figtree, system-ui, sans-serif"; x.fillText(C.code, W - 120, by + 1);
      // body
      x.textAlign = "center"; x.textBaseline = "alphabetic";
      x.fillStyle = aura; x.font = "800 26px Figtree, system-ui, sans-serif";
      if ("letterSpacing" in x) x.letterSpacing = "8px";
      x.fillText("CERTIFICATE OF COMPLETION", cx, 330);
      if ("letterSpacing" in x) x.letterSpacing = "0px";
      x.fillStyle = "#6c6e73"; x.font = "500 30px Figtree, system-ui, sans-serif"; x.fillText("This certifies that", cx, 420);
      x.fillStyle = name === "Your name" ? "#b9b7b1" : "#1d1e20"; fitFont(x, name, "800", 92, 1200); x.fillText(name, cx, 535);
      x.strokeStyle = "#d8d5ce"; x.lineWidth = 2; x.beginPath(); x.moveTo(cx - 420, 580); x.lineTo(cx + 420, 580); x.stroke();
      x.fillStyle = "#6c6e73"; x.font = "500 30px Figtree, system-ui, sans-serif"; x.fillText("has completed the course", cx, 650);
      x.fillStyle = "#1d1e20"; fitFont(x, C.title, "800", 58, 1250); x.fillText(C.title, cx, 735);
      x.fillStyle = "#45474c"; x.font = "500 28px Figtree, system-ui, sans-serif";
      x.fillText(C.days.length + " lessons · about " + C.hours + " hours" + (f && f.passed ? " · final exam " + f.best + "%" : ""), cx, 800);
      // footer
      var date = S.certDate ? parse(S.certDate) : today(), fy = 965;
      x.textAlign = "left"; x.fillStyle = "#9b9da2"; x.font = "700 20px Figtree, system-ui, sans-serif"; x.fillText("DATE", 160, fy - 40);
      x.fillStyle = "#1d1e20"; x.font = "700 30px Figtree, system-ui, sans-serif"; x.fillText(fmt(date, { year: "numeric", month: "long", day: "numeric" }), 160, fy);
      x.textAlign = "right"; x.fillStyle = "#9b9da2"; x.font = "700 20px Figtree, system-ui, sans-serif"; x.fillText("CERTIFICATE ID", W - 160, fy - 40);
      x.fillStyle = "#1d1e20"; x.font = "700 30px Figtree, system-ui, sans-serif"; x.fillText(ready ? certId(name) : "—", W - 160, fy);
      // seal
      x.beginPath(); x.arc(cx, fy - 30, 74, 0, Math.PI * 2); x.fillStyle = aura; x.fill();
      x.beginPath(); x.arc(cx, fy - 30, 62, 0, Math.PI * 2); x.strokeStyle = "rgba(255,255,255,.7)"; x.lineWidth = 2; x.stroke();
      x.fillStyle = "#fff"; x.textAlign = "center"; x.font = "800 40px Figtree, system-ui, sans-serif"; x.fillText("✓", cx, fy - 30);
      x.font = "800 15px Figtree, system-ui, sans-serif"; x.fillText("COMPLETED", cx, fy + 2);
      x.fillStyle = "#9b9da2"; x.font = "600 20px Figtree, system-ui, sans-serif"; x.fillText("schoolaura.com", cx, H - 82);
      updateShare(name);
    };
    if (document.fonts && document.fonts.load) document.fonts.load("800 40px Figtree").then(go, go); else go();
  }
  function updateShare(name) {
    var li = $("#cert-li"), xs = $("#cert-x"); if (!li) return;
    var d = S.certDate ? parse(S.certDate) : today(), url = "https://schoolaura.com/courses/" + C.slug + "/";
    li.href = "https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=" + encodeURIComponent(C.title) + "&organizationName=SchoolAura&issueYear=" + d.getFullYear() + "&issueMonth=" + (d.getMonth() + 1) + "&certUrl=" + encodeURIComponent(url) + "&certId=" + encodeURIComponent(certId(name));
    xs.href = "https://x.com/intent/tweet?text=" + encodeURIComponent("I just finished " + C.title + " on SchoolAura: " + C.days.length + " lessons, about " + C.hours + " hours, and the final exam. ") + "&url=" + encodeURIComponent(url);
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
      tc.innerHTML = '<p class="k">Today · ' + esc(fmt(t, { weekday: "long", month: "long", day: "numeric" })) + '</p><h3>Day ' + td.n + ": " + esc(td.title) + '</h3><p class="muted">' + esc(td.goal) + '</p><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"><a class="btn color" href="' + dayHref(td.n) + '">' + (isDone(td.n) ? "Review lesson" : "Open today's lesson") + "</a>" + (nx && nx.n < td.n ? '<a class="btn light" href="' + dayHref(nx.n) + '">Catch up: Day ' + nx.n + "</a>" : "") + "</div>";
    } else if (start > t) {
      tc.innerHTML = '<p class="k">Starts ' + esc(fmt(start, { weekday: "long", month: "long", day: "numeric" })) + '</p><h3>Your first lesson is ready when you are.</h3><div><a class="btn light" href="' + dayHref(1) + '">Preview Day 1</a></div>';
    } else if (!nx) {
      tc.innerHTML = '<p class="k">Finished</p><h3>You completed every lesson in this course.</h3>' + (QZ ? '<div><a class="btn color" href="#quizzes">' + (certReady() ? "View your certificate" : "Take the final exam") + "</a></div>" : "");
    } else {
      tc.innerHTML = '<p class="k">Rest day</p><h3>Nothing scheduled today.</h3><p class="muted">Next up: Day ' + nx.n + ": " + esc(nx.title) + '</p><div><a class="btn light" href="' + dayHref(nx.n) + '">Get ahead</a></div>';
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
        return '<a class="cal-task' + c + '" href="' + dayHref(it.d.n) + '" title="Day ' + it.d.n + ": " + esc(it.d.title) + '"><b><span class="dw">Day </span>' + it.d.n + (it.part ? " · " + it.part + "/2" : "") + '</b><span class="tt">' + esc(it.d.short || it.d.title) + "</span></a>";
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
      return '<li><a href="' + dayHref(d.n) + '"><span class="ad">' + esc(fmt(sc[d.n][0])) + '</span><span class="at">Day ' + d.n + ": " + esc(d.title) + "<small>" + d.hours + " h · " + esc(modOf(d.n).title) + '</small></span><span class="pill ' + cls[st] + '">' + lbl[st] + "</span></a></li>";
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
      if (cb.checked) engage("touch");
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
    if (e.target.id === "jump") location.href = e.target.value;
  });

  var noteTimer = null;
  document.addEventListener("input", function (e) {
    if (e.target.id === "lesson-notes") {
      var ta = e.target, n = +ta.getAttribute("data-n"), stEl = $("#notes-status");
      if (stEl) stEl.textContent = "Saving…";
      clearTimeout(noteTimer);
      noteTimer = setTimeout(function () {
        var v = ta.value;
        if (v.trim()) S.notes[n] = v; else delete S.notes[n];
        save();
        if (stEl) stEl.textContent = "Saved";
        if (v.trim().length >= 10) engage("touch");
      }, 600);
    }
    if (e.target.id === "cert-name") { setName(e.target.value.trim()); drawCert(); }
  });

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-toggle]");
    if (b) {
      var n = +b.getAttribute("data-toggle");
      if (isDone(n)) S.done = S.done.filter(function (x) { return x !== n; });
      else {
        S.done.push(n);
        var nx = nextUp(), m = modOf(n);
        var modDone = m.days.every(isDone), r = qRes("m" + m.n);
        if (certReady() && !S.certDate) S.certDate = iso(today());
        SA.toast(!nx ? (QZ ? "Every lesson done. Time for the final exam." : "You finished the whole course. Well done.") :
          modDone && hasQuiz(m.n) && !(r && r.passed) ? "Module " + m.n + " complete. Take the quiz to lock it in." : "Day " + n + " done. Next up: Day " + nx.n + ".");
      }
      save();
      document.querySelectorAll('[data-toggle="' + n + '"]').forEach(function (el) { el.outerHTML = doneToggle(n); });
      renderNav(n); syncProgress();
      engage("touch");
      return;
    }
    var fb = e.target.closest("[data-feel]");
    if (fb) {
      var dn = CUR_DAY, k = fb.getAttribute("data-feel"), md = modOf(dn);
      if (!dn || !md) return;
      S.feel[dn] = k; save();
      document.querySelectorAll("[data-feel]").forEach(function (x) { x.setAttribute("aria-pressed", x === fb ? "true" : "false"); });
      var msg = $(".feel-msg"); if (msg) msg.innerHTML = feelMsg(k, md, md.days[md.days.length - 1] === dn);
      engage("touch");
      return;
    }
    var qo = e.target.closest("[data-qc-oi]");
    if (qo) {
      var box = qo.closest("[data-qc]"), it = checkState.qs && checkState.qs[+box.getAttribute("data-qc")];
      if (!it || box.getAttribute("data-answered")) return;
      var oi = +qo.getAttribute("data-qc-oi"), right = oi === it.q.a;
      box.setAttribute("data-answered", "1");
      box.querySelectorAll("[data-qc-oi]").forEach(function (o) {
        var v = +o.getAttribute("data-qc-oi"); o.disabled = true;
        o.classList.add(v === it.q.a ? "right" : v === oi ? "wrong" : "dim");
      });
      box.querySelector(".qc-fb").innerHTML = '<div class="fb ' + (right ? "ok" : "no") + '"><p class="verdict">' + (right ? "Correct" : "Not quite. The answer is " + esc(it.q.o[it.q.a]) + ".") + "</p><p>" + esc(it.q.why) + "</p></div>";
      return;
    }
    var dl = e.target.closest("#cert-dl");
    if (dl) {
      var cv = $("#cert-canvas"), nm = ($("#cert-name") || {}).value || "";
      if (!nm.trim()) { SA.toast("Add your name first."); var ni = $("#cert-name"); if (ni) ni.focus(); return; }
      var a = document.createElement("a");
      a.download = "schoolaura-certificate-" + C.slug + ".png";
      a.href = cv.toDataURL("image/png");
      document.body.appendChild(a); a.click(); a.remove();
      SA.toast("Certificate downloaded.");
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
      S = { start: iso(today()), study: S.study, pace: S.pace, done: [], tasks: {}, quiz: {}, notes: S.notes, feel: {}, certDate: null };  // notes are kept
      save(); calMonth = null; renderPlan(); syncProgress();
      engage("renderAll");
      SA.toast("Progress cleared. Your plan now starts today.");
    }
  });

  window.addEventListener("hashchange", route);
  route();
})();
