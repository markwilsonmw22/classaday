/* /join/ when membership is live: buttons start Stripe Checkout for the signed-in visitor.
   Not logged in -> /login/?next=/join/?plan=...  -> back here, and checkout starts automatically. */
(function () {
  var A = window.SAAuth, CFG = window.SA_CONFIG || {};
  if (!CFG.live) return;
  window.SA_NO_SYNC_RELOAD = true; // never reload this page under someone heading to checkout
  var q = new URLSearchParams(location.search);
  var banner = document.getElementById("join-banner");
  function setBanner(html, kind) { if (!banner) return; banner.hidden = !html; banner.className = "join-banner" + (kind ? " " + kind : ""); banner.innerHTML = html; }
  function toast(m) { if (window.SA && SA.toast) SA.toast(m); }

  var locked = q.get("locked");
  if (locked) setBanner("<b>That's for members.</b> Join below to unlock every lesson, download and prompt pack." +
    (A && A.loggedIn() ? "" : ' Already a member? <a class="link" href="/login/?next=' + encodeURIComponent(document.referrer && document.referrer.indexOf(location.origin) === 0 ? new URL(document.referrer).pathname : "/courses/") + '">Log in</a>.'), "info");
  if (q.get("checkout") === "cancel") setBanner("Checkout was cancelled and you haven't been charged. You can pick a plan again whenever you're ready.", "info");

  var veil = null;
  function busy(on, text) {
    if (on && !veil) {
      veil = document.createElement("div");
      veil.className = "busy-veil";
      veil.setAttribute("role", "status");
      veil.innerHTML = '<div class="busy-box"><span class="spin" aria-hidden="true"></span><span class="busy-t"></span></div>';
      document.body.appendChild(veil);
    }
    if (veil) { veil.hidden = !on; veil.querySelector(".busy-t").textContent = text || ""; }
  }

  function planFrom(s) { var m = /[?&]plan=(monthly|lifetime)\b/.exec(s || ""); return m ? m[1] : null; }
  function loginFor(plan) { location.href = "/login/?next=" + encodeURIComponent("/join/?plan=" + plan); }

  function start(plan) {
    if (!A || !A.loggedIn()) return loginFor(plan);
    var m = A.member();
    if (A.isMember() && m && (m.plan === "lifetime" || plan === "monthly")) { location.href = "/account/"; return; }
    busy(true, "Taking you to secure checkout…");
    A.session().then(function (s) {
      if (!s) { busy(false); return loginFor(plan); }
      return fetch("/api/checkout/", {
        method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + s.access_token },
        body: JSON.stringify({ plan: plan })
      }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.j && res.j.url) { location.href = res.j.url; return; }
          busy(false);
          if (res.status === 401) return loginFor(plan);
          toast(res.status === 503 ? "Payments open very soon. Please check back shortly." : "Checkout isn't available right now. Please try again in a minute.");
        });
    }).catch(function () { busy(false); toast("Something went wrong. Please try again."); });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href");
    if (!/^\/join\/\?plan=/.test(href)) return;
    var plan = planFrom(href);
    if (!plan) return;
    e.preventDefault();
    start(plan);
  });

  // Back from logging in with a plan picked: go straight to checkout.
  var picked = planFrom(location.search);
  if (picked) {
    history.replaceState(null, "", location.pathname + location.hash);
    if (A && A.loggedIn()) start(picked);
  }
  window.addEventListener("pageshow", function (e) { if (e.persisted) busy(false); });
})();
