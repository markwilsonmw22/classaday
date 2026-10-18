/* Viral Prompts: subscribe, "New" badges since your last visit, and filters on the feed.
   Subscription is saved on this device for now (sa.prompts); it becomes a membership perk when accounts arrive. */
(function () {
  var KEY = "sa.prompts";
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "null") || {}; } catch (e) { return {}; } }
  function write(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) {} }
  function nowIso() { return new Date().toISOString().replace(/\.\d+Z$/, "Z"); }
  var st = read();
  var seenBefore = st.seen || st.subAt || "";
  var isHub = !!document.getElementById("pfeed");

  function drawSub() {
    document.querySelectorAll("[data-sub]").forEach(function (b) {
      b.textContent = st.sub ? "Subscribed ✓" : "Subscribe";
      b.classList.toggle("light", !!st.sub);
      b.setAttribute("aria-pressed", st.sub ? "true" : "false");
    });
    var note = document.querySelector("[data-sub-note]");
    if (note) {
      var fresh = st.sub ? document.querySelectorAll(".pcard.is-new").length : 0;
      note.innerHTML = !st.sub ? "<b>Subscribe</b> to get a <b>New</b> badge here and a dot in the menu whenever fresh prompts drop. Free while we're in early access." :
        fresh ? "<b>" + fresh + " new</b> since your last visit. They're marked below." : "You're subscribed. New packs will be marked here and with a dot in the menu.";
      note.classList.toggle("on", !!st.sub);
    }
    if (window.SA && SA.renderPromptBadges) SA.renderPromptBadges();
  }

  function markNew() {
    if (!st.sub) return;
    document.querySelectorAll("[data-published]").forEach(function (el) {
      var isNew = !!seenBefore && el.getAttribute("data-published") > seenBefore;
      el.classList.toggle("is-new", isNew);
      var b = el.querySelector(".new-badge"); if (b) b.hidden = !isNew;
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-sub]");
    if (!b) return;
    st = read();
    if (st.sub) { st.sub = false; write(st); SA.toast("Unsubscribed. You can subscribe again any time."); }
    else { st.sub = true; st.subAt = nowIso(); st.seen = st.subAt; write(st); SA.toast("Subscribed. New prompt packs will show a New badge and a dot in the menu."); if (window.SAEngage) SAEngage.touch(); }
    seenBefore = st.seen || st.subAt;
    markNew(); drawSub();
  });

  /* Feed filters */
  var find = document.getElementById("vp-find"), kind = "all";
  var cards = document.querySelectorAll(".pcard");
  function filter() {
    var q = (find && find.value || "").trim().toLowerCase(), shown = 0;
    cards.forEach(function (c) {
      var ok = (kind === "all" || c.getAttribute("data-kind") === kind) && (!q || c.getAttribute("data-find").indexOf(q) !== -1);
      c.hidden = !ok; if (ok) shown++;
    });
    var empty = document.getElementById("vp-empty"); if (empty) empty.hidden = shown > 0;
  }
  if (find) find.addEventListener("input", filter);
  document.querySelectorAll("[data-vp-kind]").forEach(function (b) {
    b.addEventListener("click", function () {
      kind = b.getAttribute("data-vp-kind");
      document.querySelectorAll("[data-vp-kind]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      filter();
    });
  });

  markNew();
  drawSub();
  /* Visiting the feed counts as having seen everything on it. */
  if (isHub && st.sub) { st.seen = nowIso(); write(st); if (window.SA && SA.renderPromptBadges) SA.renderPromptBadges(); }
})();
