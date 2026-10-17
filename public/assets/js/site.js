/* SchoolAura — shared behaviour: mobile menu, toast, course progress on cards, discovery filters */
(function () {
  document.addEventListener("click", function (e) {
    var m = e.target.closest("[data-menu]");
    if (m) {
      var nav = document.getElementById("site-nav");
      var open = nav.classList.toggle("open");
      m.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (e.target.closest("#site-nav a")) document.getElementById("site-nav").classList.remove("open");
  });

  window.SA = window.SA || {};
  window.SA.toast = function (msg) {
    var el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  };

  /* Progress bars on course cards: <div class="progress" data-progress="slug" data-total="30"> */
  document.querySelectorAll("[data-progress]").forEach(function (el) {
    var done = 0;
    try { var s = JSON.parse(localStorage.getItem("sa.course." + el.getAttribute("data-progress")) || "null"); done = s && s.done ? s.done.length : 0; } catch (e) {}
    var pct = Math.round(done / (+el.getAttribute("data-total") || 1) * 100);
    var bar = el.querySelector("i"); if (bar) bar.style.width = pct + "%";
    var lbl = el.querySelector("span"); if (lbl) lbl.textContent = pct + "%";
  });

  /* Discovery search + category chips */
  var search = document.getElementById("find");
  var chips = document.querySelectorAll(".chip-btn");
  var cards = document.querySelectorAll("[data-find]");
  var cat = "all";
  function filter() {
    var q = (search && search.value || "").trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (cat === "all" || c.getAttribute("data-cat").indexOf(cat) !== -1) && (!q || c.getAttribute("data-find").indexOf(q) !== -1);
      c.hidden = !ok; if (ok) shown++;
    });
    var empty = document.getElementById("no-results"); if (empty) empty.hidden = shown > 0;
  }
  if (search) search.addEventListener("input", filter);
  chips.forEach(function (b) {
    b.addEventListener("click", function () {
      cat = b.getAttribute("data-cat");
      chips.forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      filter();
    });
  });
})();
