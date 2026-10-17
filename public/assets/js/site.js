/* SchoolAura — shared site behaviour: theme, mobile nav, toast */
(function () {
  var root = document.documentElement;
  var KEY = "sa.theme";

  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var saved = store(KEY);
  if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (t) {
      var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
      root.setAttribute("data-theme", next);
      store(KEY, next);
      t.setAttribute("aria-label", next === "light" ? "Switch to dark mode" : "Switch to light mode");
    }
    var m = e.target.closest("[data-menu]");
    if (m) {
      var nav = document.getElementById("site-nav");
      var open = nav.classList.toggle("open");
      m.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (e.target.closest("#site-nav a")) {
      var n = document.getElementById("site-nav");
      if (n) n.classList.remove("open");
    }
  });

  window.SA = window.SA || {};
  window.SA.store = store;
  window.SA.toast = function (msg) {
    var el = document.getElementById("toast");
    if (!el) { el = document.createElement("div"); el.id = "toast"; el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 2600);
  };

  var y = document.querySelectorAll("[data-year]");
  for (var i = 0; i < y.length; i++) y[i].textContent = new Date().getFullYear();
})();
