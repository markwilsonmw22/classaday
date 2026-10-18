/* SchoolAura quiz runner.
   SAQuiz.run(root, {
     title, questions: [{q, o: [..4], a, why, day?|book?}], pass: 80,
     shuffleQuestions: bool,
     review(q) -> {href, label} | null,   // link back to the lesson that teaches it
     onFinish(result),                    // {score, total, pct, passed, missed: [q]}
     backHref, backLabel, extraActions(result) -> html
   }) */
(function () {
  var current = null;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function run(root, o) {
    var pass = o.pass || 80;
    var items = (o.shuffleQuestions ? shuffle(o.questions) : o.questions).map(function (q) {
      return { q: q, order: shuffle(q.o.map(function (_, i) { return i; })), chosen: null };
    });
    var i = 0, score = 0;
    var token = {};
    current = token;

    function reviewHtml(q) {
      var r = o.review ? o.review(q) : null;
      if (!r) return "";
      return r.href ? '<a class="link" href="' + r.href + '">' + esc(r.label) + " →</a>" : '<span class="muted">' + esc(r.label) + "</span>";
    }

    function show() {
      var it = items[i], q = it.q;
      root.innerHTML =
        '<div class="quiz">' +
          '<div class="quiz-top"><span class="quiz-title">' + esc(o.title) + '</span><span class="quiz-count">' + (i + 1) + " / " + items.length + "</span></div>" +
          '<div class="quiz-bar" aria-hidden="true"><i style="width:' + Math.round(i / items.length * 100) + '%"></i></div>' +
          '<h3 class="quiz-q" tabindex="-1">' + esc(q.q) + "</h3>" +
          '<div class="quiz-opts" role="group" aria-label="Answers">' +
            it.order.map(function (oi, k) {
              return '<button type="button" class="quiz-opt" data-oi="' + oi + '"><span class="key">' + "ABCD"[k] + "</span><span class=\"txt\">" + esc(q.o[oi]) + "</span></button>";
            }).join("") +
          "</div>" +
          '<div class="quiz-fb" aria-live="polite"></div>' +
          '<p class="quiz-hint">Tip: press A–D to answer and Enter to continue.</p>' +
        "</div>";
      var h = root.querySelector(".quiz-q"); if (h && root.getBoundingClientRect().top < 0) h.focus();
    }

    function choose(oi) {
      var it = items[i], q = it.q;
      if (it.chosen !== null) return;
      it.chosen = oi;
      var right = oi === q.a;
      if (right) score++;
      root.querySelectorAll(".quiz-opt").forEach(function (b) {
        var bi = +b.getAttribute("data-oi");
        b.disabled = true;
        if (bi === q.a) b.classList.add("right");
        else if (bi === oi) b.classList.add("wrong");
        else b.classList.add("dim");
      });
      var last = i === items.length - 1;
      root.querySelector(".quiz-fb").innerHTML =
        '<div class="fb ' + (right ? "ok" : "no") + '">' +
          '<p class="verdict">' + (right ? "Correct" : "Not quite. The answer is " + esc(q.o[q.a]) + ".") + "</p>" +
          "<p>" + esc(q.why) + "</p>" +
          (right ? "" : '<p class="rv">' + reviewHtml(q) + "</p>") +
        "</div>" +
        '<button type="button" class="btn" data-next>' + (last ? "See my results" : "Next question →") + "</button>";
      var nb = root.querySelector("[data-next]"); if (nb) nb.focus({ preventScroll: true });
    }

    function finish() {
      var total = items.length, pct = Math.round(score / total * 100), passed = pct >= pass;
      var missed = items.filter(function (it) { return it.chosen !== it.q.a; }).map(function (it) { return it.q; });
      var result = { score: score, total: total, pct: pct, passed: passed, missed: missed };
      if (o.onFinish) o.onFinish(result);
      var msg = pct === 100 ? "Perfect score. You know this inside out." : passed ? "Passed. Nicely done." : "Not yet. Review the lessons below and try again; questions and answers reshuffle each time.";
      root.innerHTML =
        '<div class="quiz quiz-done' + (passed ? " passed" : "") + '">' +
          (passed ? '<div class="confetti" aria-hidden="true">' + new Array(18).join("<i></i>") + "</div>" : "") +
          '<div class="score-ring" style="--p:' + pct + '"><b>' + pct + "%</b><span>" + score + " of " + total + "</span></div>" +
          "<h3>" + (passed ? "You passed " : "Keep going: ") + esc(o.title) + "</h3>" +
          '<p class="muted">' + msg + " Pass mark: " + pass + "%.</p>" +
          (missed.length ? '<div class="missed"><h4>Worth another look</h4><ul>' + missed.map(function (q) { return "<li><span>" + esc(q.q) + "</span>" + reviewHtml(q) + "</li>"; }).join("") + "</ul></div>" : "") +
          '<div class="quiz-actions"><button type="button" class="btn light" data-retake>Retake</button>' +
            (o.backHref ? '<a class="btn" href="' + o.backHref + '">' + esc(o.backLabel || "Back") + "</a>" : "") +
            (o.extraActions ? o.extraActions(result) : "") +
          "</div>" +
        "</div>";
    }

    root.onclick = function (e) {
      if (current !== token) return;
      var opt = e.target.closest(".quiz-opt");
      if (opt) return choose(+opt.getAttribute("data-oi"));
      if (e.target.closest("[data-next]")) { if (i < items.length - 1) { i++; show(); } else finish(); return; }
      if (e.target.closest("[data-retake]")) run(root, o);
    };
    document.onkeydown = function (e) {
      if (current !== token || !root.offsetParent || e.target.matches("input, textarea, select")) return;
      var k = e.key.toLowerCase(), idx = "abcd".indexOf(k);
      if (idx === -1 && "1234".indexOf(k) !== -1) idx = +k - 1;
      if (idx !== -1 && items[i] && items[i].chosen === null && root.querySelector(".quiz-opts")) {
        var btn = root.querySelectorAll(".quiz-opt")[idx]; if (btn) { e.preventDefault(); btn.click(); }
      } else if (k === "enter") {
        var nb = root.querySelector("[data-next]"); if (nb) { e.preventDefault(); nb.click(); }
      }
    };
    show();
  }

  window.SAQuiz = { run: run, shuffle: shuffle };
})();
