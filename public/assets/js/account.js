/* /login/ and /account/ pages. Needs auth.js (window.SAAuth). */
(function () {
  var A = window.SAAuth, CFG = window.SA_CONFIG || {};
  if (!A) return;
  function $(s) { return document.querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function param(k) { return new URLSearchParams(location.search).get(k); }
  function toast(m) { if (window.SA && SA.toast) SA.toast(m); }
  function safeNext(p) { return p && /^\/(?![\/\\])/.test(p) && !/^\/(login|account)\//.test(p) ? p : ""; }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return iso; } }

  /* ================================================================ login */
  if ($("#login-root")) {
    window.SA_NO_SYNC_RELOAD = true; // we leave this page as soon as the login is done
    var form = $("#email-form"), emailIn = $("#login-email"), alertBox = $("#login-alert");
    var lastEmail = "";
    var next = safeNext(param("next"));
    if (next) { try { localStorage.setItem("sa.next", JSON.stringify({ p: next, at: Date.now() })); } catch (e) {} }
    else {
      try { var sn = JSON.parse(localStorage.getItem("sa.next") || "null"); if (sn && Date.now() - sn.at < 3 * 36e5) next = safeNext(sn.p); } catch (e) {}
    }

    var show = function (view) {
      ["#login-form-view", "#login-sent-view", "#login-done-view"].forEach(function (v) { $(v).hidden = v !== view; });
    };
    var say = function (msg, kind) {
      alertBox.hidden = !msg;
      alertBox.className = "auth-alert" + (kind ? " " + kind : "");
      alertBox.textContent = msg || "";
    };
    var busy = function (btn, on, label) {
      if (!btn) return;
      if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || "One moment…"; btn.disabled = true; }
      else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
    };
    var friendly = function (err) {
      var m = (err && (err.message || err.error_description || err.msg)) || "";
      if (/after \d+ seconds|rate limit|too many/i.test(m)) return "Please wait a minute before asking for another email.";
      if (/expired|invalid|otp/i.test(m)) return "That code has expired or isn't right. Ask for a new email and try again.";
      if (/email.*invalid|valid email/i.test(m)) return "That email address doesn't look right.";
      if (/fetch|network|load/i.test(m)) return "We couldn't reach the sign-in service. Check your connection and try again.";
      return "Something went wrong. Please try again.";
    };

    var finish = function () {
      show("#login-done-view");
      $("#done-msg").textContent = "One moment while we load your account…";
      try { localStorage.removeItem("sa.next"); } catch (e) {}
      A.refresh().catch(function () {})
        .then(function () { return A.sync(true).catch(function () {}); })
        .then(function () { location.replace(next || "/courses/"); });
    };

    // A link from an email that has expired or was already used comes back with an error in the address.
    var hash = new URLSearchParams(location.hash.replace(/^#/, ""));
    if (hash.get("error") || hash.get("error_description")) {
      say("That sign-in link has expired or was already used. Enter your email and we'll send a new one.", "warn");
      history.replaceState(null, "", location.pathname + location.search);
    }

    A.client().then(function (sb) {
      return sb.auth.getSession().then(function (r) {
        if (r && r.data && r.data.session) return finish();
        show("#login-form-view");
        emailIn.focus();
      });
    }).catch(function (e) { show("#login-form-view"); say(friendly(e), "warn"); });

    // Show "Continue with Google" only when Google sign-in is switched on in Supabase.
    fetch(CFG.supabaseUrl + "/auth/v1/settings", { headers: { apikey: CFG.supabaseKey } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (s) { if (s && s.external && s.external.google) $("#google-wrap").hidden = false; })
      .catch(function () {});

    var redirectTo = location.origin + "/login/" + (next ? "?next=" + encodeURIComponent(next) : "");
    var sendLink = function (email, btn) {
      busy(btn, true, "Sending…");
      say("");
      return A.client().then(function (sb) {
        return sb.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirectTo, shouldCreateUser: true } });
      }).then(function (r) {
        busy(btn, false);
        if (r.error) { say(friendly(r.error), "warn"); return false; }
        lastEmail = email;
        $("#sent-to").textContent = email;
        show("#login-sent-view");
        return true;
      }).catch(function (e) { busy(btn, false); say(friendly(e), "warn"); return false; });
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (emailIn.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say("Please enter your email address.", "warn"); emailIn.focus(); return; }
      sendLink(email, form.querySelector("button[type=submit]"));
    });

    $("#code-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var code = ($("#login-code").value || "").replace(/\D/g, "");
      var btn = e.target.querySelector("button[type=submit]");
      if (code.length < 6) { toast("Enter the code from the email."); return; }
      busy(btn, true, "Checking…");
      A.client().then(function (sb) { return sb.auth.verifyOtp({ email: lastEmail, token: code, type: "email" }); })
        .then(function (r) {
          busy(btn, false);
          if (r.error || !r.data || !r.data.session) { toast(friendly(r.error || {})); return; }
          finish();
        }).catch(function (err) { busy(btn, false); toast(friendly(err)); });
    });

    document.addEventListener("click", function (e) {
      if (e.target.closest("[data-resend]")) { sendLink(lastEmail, e.target.closest("[data-resend]")).then(function (ok) { if (ok) toast("We sent you a new email."); }); }
      if (e.target.closest("[data-change-email]")) { show("#login-form-view"); emailIn.value = ""; emailIn.focus(); }
      if (e.target.closest("[data-google]")) {
        A.client().then(function (sb) { return sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo } }); })
          .then(function (r) { if (r && r.error) say(friendly(r.error), "warn"); })
          .catch(function (err) { say(friendly(err), "warn"); });
      }
    });
    return;
  }

  /* ================================================================ account */
  if (!$("#acct-root")) return;
  var banner = $("#acct-banner");
  function setBanner(html, kind) { banner.hidden = !html; banner.className = "join-banner" + (kind ? " " + kind : ""); banner.innerHTML = html || ""; }

  function planName(rec) { return rec.plan === "lifetime" ? "Lifetime membership" : rec.plan === "monthly" ? "Monthly membership" : "Membership"; }
  var STATUS = { active: ["Active", "ok"], trialing: ["Active", "ok"], past_due: ["Payment due", "late"], canceled: ["Ended", ""],
                 unpaid: ["Unpaid", "late"], refunded: ["Refunded", ""], incomplete: ["Not finished", "late"], incomplete_expired: ["Not finished", ""], paused: ["Paused", ""] };

  function memberCard(rec) {
    var el = $("#acct-member");
    if (!CFG.live) {
      el.innerHTML = '<h2>Membership</h2><p class="muted">Everything on SchoolAura is free during early access, so there\'s nothing to buy yet. ' +
        "Your progress is saved to this account, so it's waiting for you on any device.</p>" +
        '<div class="acct-actions"><a class="btn" href="/courses/">Go to the Classroom</a></div>';
      return;
    }
    if (rec && rec.m) {
      var st = STATUS[rec.status] || ["Active", "ok"];
      var line = rec.plan === "lifetime" ? "Paid once. Yours for good." :
        rec.renews ? (rec.cancel ? "Ends on " + fmtDate(rec.renews) + ". You won't be charged again." : "Renews on " + fmtDate(rec.renews) + ".") : "";
      el.innerHTML = '<div class="acct-head"><h2>' + esc(planName(rec)) + '</h2><span class="pill ' + st[1] + '">' + st[0] + "</span></div>" +
        '<p class="muted">' + esc(line) + "</p>" +
        (rec.status === "past_due" ? '<p class="acct-warn">Your last payment didn\'t go through. Update your card in billing to keep your access.</p>' : "") +
        '<div class="acct-actions"><a class="btn" href="/courses/">Go to the Classroom</a>' +
        (rec.billing ? '<button class="btn light" type="button" data-portal>Manage billing</button>' : "") +
        (rec.plan === "monthly" ? '<a class="btn light" href="/join/?plan=lifetime">Switch to lifetime</a>' : "") + "</div>" +
        (rec.billing ? '<p class="muted small">' + (rec.plan === "lifetime" ? "See your receipts in billing." : "Update your card, download invoices or cancel in billing.") +
          ' Refunds: <a class="link" href="/refunds/">see our policy</a>.</p>' : "");
      return;
    }
    var ended = rec && rec.status && rec.status !== "none";
    el.innerHTML = '<h2>Membership</h2><p class="muted">' +
      (ended ? "Your membership has ended. Join again any time to pick up where you left off; your progress is still here." :
        "You don't have a membership yet. Day 1 of every course and the newest Viral Prompts are free.") + "</p>" +
      '<div class="acct-actions"><a class="btn color" href="/join/#pricing">See plans</a>' +
      (rec && rec.billing ? '<button class="btn light" type="button" data-portal>Billing history</button>' : "") + "</div>";
  }

  function syncLine() {
    var t = A.lastSync();
    var when = t ? new Date(t).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "";
    $("#sync-status").textContent = t ? "Saved to your account. Last synced " + when + (/\.$/.test(when) ? "" : ".") : "Your progress will be saved to your account.";
  }

  function render(rec) {
    $("#acct-loading").hidden = true;
    if (!rec) { $("#acct-out").hidden = false; $("#acct-in").hidden = true; return; }
    $("#acct-out").hidden = true;
    $("#acct-in").hidden = false;
    $("#acct-email").textContent = rec.email || "—";
    memberCard(rec);
    syncLine();
  }

  window.SA_NO_SYNC_RELOAD = true;
  var checkout = param("checkout");
  if (!A.loggedIn()) { render(null); return; }
  if (checkout === "success") setBanner("<b>Payment received.</b> Setting up your membership…", "info");
  A.refresh().then(function (rec) {
    render(rec);
    if (checkout !== "success" || !rec) return;
    if (rec.m) { setBanner("<b>You're in.</b> Every course, download and prompt pack is unlocked. <a class=\"link\" href=\"/courses/\">Start learning →</a>", "ok"); return; }
    // The payment confirmation from Stripe can take a few seconds to reach us.
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      A.refresh().then(function (r) {
        if (r && r.m) {
          clearInterval(timer);
          render(r);
          setBanner("<b>You're in.</b> Every course, download and prompt pack is unlocked. <a class=\"link\" href=\"/courses/\">Start learning →</a>", "ok");
        } else if (tries >= 15) {
          clearInterval(timer);
          setBanner("Your payment went through, but your membership is taking longer than usual to switch on. Refresh this page in a minute. If it still says no membership, email <a class=\"link\" href=\"mailto:" + esc(CFG.supportEmail || "") + "\">" + esc(CFG.supportEmail || "support") + "</a> and we'll sort it out.", "warn");
        }
      }).catch(function () {});
    }, 2000);
  }).catch(function () { render(A.member()); });
  if (checkout) history.replaceState(null, "", location.pathname);

  document.addEventListener("click", function (e) {
    var b;
    if ((b = e.target.closest("[data-portal]"))) {
      b.disabled = true;
      A.session().then(function (s) {
        if (!s) throw new Error("no session");
        return fetch("/api/portal/", { method: "POST", headers: { authorization: "Bearer " + s.access_token } });
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.url) { location.href = j.url; return; }
        b.disabled = false;
        toast(j && j.error === "no_billing" ? "There's no billing history on this account yet." : "Billing isn't available right now. Please try again in a minute.");
      }).catch(function () { b.disabled = false; toast("Billing isn't available right now. Please try again in a minute."); });
    }
    if ((b = e.target.closest("[data-sync-now]"))) {
      b.disabled = true;
      A.sync(true).then(function () { syncLine(); toast("Progress synced."); }, function () { toast("Couldn't sync just now. We'll try again automatically."); })
        .then(function () { b.disabled = false; });
    }
    if ((b = e.target.closest("[data-logout]"))) {
      b.disabled = true;
      b.textContent = "Logging out…";
      A.signOut().then(function () { location.replace("/"); });
    }
  });
})();
