/* Recipe Vault: pick books and download them */
(function () {
  var base = "/downloads/recipe-vault/classaday-";
  var boxes = Array.prototype.slice.call(document.querySelectorAll(".pick input"));
  var label = document.getElementById("vault-count");
  var btn = document.getElementById("vault-dl");
  if (!btn) return;
  function chosen() { return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; }); }
  function update() {
    var n = chosen().length;
    label.textContent = n === 4 ? "All 4 books selected" : n === 0 ? "Choose at least one book" : n + (n === 1 ? " book" : " books") + " selected";
    btn.disabled = n === 0;
  }
  /* The server sends PDFs as attachments, so a plain link click downloads them. When membership is live,
     non-members are sent to the join page instead (the server would redirect them there anyway). */
  function fetchFile(slug) {
    var a = document.createElement("a");
    a.href = base + slug + ".pdf";
    document.body.appendChild(a); a.click(); a.remove();
  }
  function locked() { return !!(window.SA_CONFIG && SA_CONFIG.live) && !(window.SAAuth && SAAuth.isMember()); }
  boxes.forEach(function (b) { b.addEventListener("change", update); });
  btn.addEventListener("click", function () {
    var list = chosen();
    if (!list.length) return;
    if (locked()) { location.href = "/join/?locked=download"; return; }
    if (list.length === 4) { fetchFile("recipe-vault-complete"); SA.toast("Downloading the Complete Edition."); return; }
    list.forEach(function (slug, i) { setTimeout(function () { fetchFile(slug); }, i * 700); });
    SA.toast(list.length === 1 ? "Your download has started." : "Downloading " + list.length + " PDFs. Allow multiple downloads if your browser asks.");
  });
  update();
})();

/* Recipe Vault: kitchen quiz (results saved with the rest of your progress) */
(function () {
  var Q = window.VAULT_QUIZ, root = document.getElementById("vault-quiz");
  if (!Q || !root || !window.SAQuiz) return;
  var KEY = "sa.course.recipe-vault";
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } }
  function intro() {
    var r = (load().quiz || {}).vault;
    root.innerHTML = '<div class="quiz-intro"><span class="qi-ic" aria-hidden="true">🍰</span><div><p class="k">' + Q.questions.length + " questions · pass mark " + Q.pass + "%</p>" +
      "<h3>" + Q.title + "</h3><p class=\"muted\">Baking, keto, nutrition labels and food safety. Pass to earn the Kitchen pro badge.</p>" +
      (r ? '<p class="qi-best">' + (r.passed ? '<span class="pill ok">Passed</span> ' : "") + "Best score " + r.best + "% · " + r.attempts + (r.attempts === 1 ? " attempt" : " attempts") + "</p>" : "") +
      '<button type="button" class="btn" data-start-quiz>' + (r ? "Take it again" : "Start the quiz") + "</button></div></div>";
  }
  root.addEventListener("click", function (e) {
    if (!e.target.closest("[data-start-quiz]")) return;
    SAQuiz.run(root, {
      title: Q.title, questions: Q.questions, pass: Q.pass, shuffleQuestions: true,
      review: function (q) { return q.book ? { label: "Covered in " + q.book } : null; },
      onFinish: function (res) {
        var s = load(); s.quiz = s.quiz || {};
        var prev = s.quiz.vault || { best: 0, attempts: 0, passed: false };
        s.quiz.vault = { best: Math.max(prev.best, res.pct), last: res.pct, attempts: prev.attempts + 1, passed: prev.passed || res.passed };
        try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (err) {}
        if (window.SAEngage) SAEngage.touch();
      }
    });
    root.scrollIntoView({ block: "start", behavior: "smooth" });
  });
  intro();
})();
