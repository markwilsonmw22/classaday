/* Class a Day accounts: login state in the header, the member cookie, regional prices and progress sync.
   Loaded on every page when accounts are switched on (MEMBERSHIP in build/build.py).
   Supabase's sign-in library is only downloaded when someone is logged in or on the login page.

   Membership: /api/session/ checks the login with Supabase and sets a signed, HttpOnly cookie (sa_m)
   that unlocks members-only pages for 24 hours. This script refreshes it about twice a day and keeps
   a copy of the answer in localStorage (sa.member) for the page's buttons; the cookie is what counts.

   Progress: the sa.course.*, sa.engage, sa.prompts and sa.name keys are merged with the copy in the
   member's account (Supabase table "progress"). The merge is three-way against the last synced copy
   (sa.sync), so ticks, notes and quiz scores from different devices combine instead of overwriting. */
(function () {
  var CFG = window.SA_CONFIG || {};
  if (!CFG.accounts || !CFG.supabaseUrl) return;
  var REF = (/^https:\/\/([^.]+)\./.exec(CFG.supabaseUrl) || [])[1] || "";
  var SB_KEY = "sb-" + REF + "-auth-token";
  var HOUR = 36e5;
  var SYNC_RE = /^sa\.(course\..+|engage|prompts|name)$/;
  function noop() {}

  /* ---------- storage ---------- */
  function raw(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function read(k, f) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? f : v; } catch (e) { return f; } }
  function write(k, v) { try { localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v)); } catch (e) {} }
  function del(k) { try { localStorage.removeItem(k); } catch (e) {} }

  function hasSession() { return !!raw(SB_KEY); }
  function memberRec() { var m = read("sa.member", null); return m && m.uid ? m : null; }
  function isMember() { var m = memberRec(); return !!(m && m.m && hasSession()); }

  /* ---------- Supabase client (loaded on demand) ---------- */
  var clientP = null;
  function client() {
    if (clientP) return clientP;
    clientP = new Promise(function (resolve, reject) {
      function make() {
        try {
          resolve(window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
            auth: { persistSession: true, autoRefreshToken: true, flowType: "implicit",
                    detectSessionInUrl: /^\/login\/?$/.test(location.pathname) }
          }));
        } catch (e) { reject(e); }
      }
      if (window.supabase && window.supabase.createClient) return make();
      var s = document.createElement("script");
      s.src = CFG.supabaseJs || "/assets/js/vendor/supabase.js";
      s.async = true;
      s.onload = make;
      s.onerror = function () { clientP = null; reject(new Error("sign-in library failed to load")); };
      document.head.appendChild(s);
    });
    return clientP;
  }

  var TOKEN = null;
  /** The current Supabase session (refreshed if needed), or null. force skips the quick "is anyone logged in" check. */
  function session(force) {
    if (!force && !hasSession()) return Promise.resolve(null);
    return client().then(function (sb) { return sb.auth.getSession(); }).then(function (r) {
      var s = r && r.data ? r.data.session : null;
      TOKEN = s ? { uid: s.user && s.user.id, exp: (s.expires_at || 0) * 1000 } : null;
      return s;
    });
  }

  /* ---------- membership ---------- */
  var refreshing = null;
  function clearMember() { del("sa.member"); }
  function refresh() {
    if (refreshing) return refreshing;
    refreshing = session().then(function (s) {
      if (!s) { clearMember(); paint(); return null; }
      return fetch("/api/session/", { method: "POST", credentials: "same-origin", cache: "no-store",
                                      headers: { authorization: "Bearer " + s.access_token } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { status: r.status, j: j }; }); })
        .then(function (res) {
          if (res.status === 401) {
            // The login is no longer valid (for example it was ended on another device).
            return client().then(function (sb) { return sb.auth.signOut({ scope: "local" }); }).catch(noop)
              .then(function () { clearMember(); paint(); return null; });
          }
          if (res.status !== 200 || !res.j.user) return memberRec(); // keep what we knew during a hiccup
          var j = res.j;
          var rec = { uid: j.user.id, email: j.user.email, m: !!j.member, plan: j.plan, status: j.status, renews: j.renews,
                      cancel: !!j.cancelAtPeriodEnd, billing: !!j.billing, cookie: j.cookie !== false, at: Date.now() };
          write("sa.member", rec);
          paint();
          return rec;
        });
    }).then(function (x) { refreshing = null; return x; }, function (e) { refreshing = null; throw e; });
    return refreshing;
  }

  function loginHref() {
    var p = location.pathname;
    if (/^\/(login|account)\//.test(p)) return "/login/";
    return "/login/?next=" + encodeURIComponent(p + location.search);
  }

  function paint() {
    var logged = hasSession(), mem = isMember();
    document.querySelectorAll("[data-auth-link]").forEach(function (a) {
      a.textContent = logged ? "Account" : "Log in";
      a.setAttribute("href", logged ? "/account/" : loginHref());
    });
    if (CFG.live) document.querySelectorAll("[data-join-link]").forEach(function (a) { a.hidden = mem; });
    document.documentElement.classList.toggle("sa-member", mem);
    document.documentElement.classList.toggle("sa-logged-in", logged);
  }

  function reloadOnce() {
    var key = "sa.reload:" + location.pathname, last = 0;
    try { last = +sessionStorage.getItem(key) || 0; } catch (e) {}
    if (Date.now() - last < 20000) return;
    try { sessionStorage.setItem(key, String(Date.now())); } catch (e) {}
    location.reload();
  }

  /* ---------- regional prices ---------- */
  function fmtPrice(n) { return "$" + (n % 1 ? n.toFixed(2) : String(n)); }
  function regionName(code) {
    try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code); } catch (e) { return code; }
  }
  function prices() {
    var els = document.querySelectorAll("[data-price]");
    if (!CFG.live || !els.length) return;
    var cached = null;
    try { cached = JSON.parse(sessionStorage.getItem("sa.geo") || "null"); } catch (e) {}
    (cached ? Promise.resolve(cached) : fetch("/api/geo/", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }))
      .then(function (g) {
        if (!g || !g.tier) return;
        try { sessionStorage.setItem("sa.geo", JSON.stringify(g)); } catch (e) {}
        if (g.tier === "full") return;
        els.forEach(function (el) { var k = el.getAttribute("data-price"); if (typeof g[k] === "number") el.textContent = fmtPrice(g[k]); });
        var note = document.getElementById("region-note");
        if (note) {
          note.hidden = false;
          note.textContent = "Prices shown are for " + (g.country ? regionName(g.country) : "your region") + ", in Canadian dollars. You'll pay the same at checkout.";
        }
      }).catch(noop);
  }

  /* ---------- progress sync ---------- */
  function decode(s) {
    if (s && (s.charAt(0) === "{" || s.charAt(0) === "[")) { try { return JSON.parse(s); } catch (e) {} }
    return s;
  }
  function localData() {
    var o = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (SYNC_RE.test(k)) o[k] = decode(localStorage.getItem(k));
      }
    } catch (e) {}
    return o;
  }
  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    return JSON.stringify(v === undefined ? null : v);
  }
  function same(a, b) { return stable(a) === stable(b); }
  function isObj(v) { return !!v && typeof v === "object" && !Array.isArray(v); }
  function flat(a) { return a.every(function (x) { return x === null || typeof x !== "object"; }); }
  function has(a, x) { return a.indexOf(x) !== -1; }
  var MAX_KEYS = { best: 1, attempts: 1 };

  /** Three-way merge of local (l) and remote (r) against the last synced copy (b, may be undefined). */
  function merge3(l, r, b) {
    if (l === undefined) return r;
    if (r === undefined) return l;
    if (Array.isArray(l) && Array.isArray(r) && flat(l) && flat(r)) {
      var base = Array.isArray(b) && flat(b) ? b : null, out = [];
      l.concat(r).forEach(function (x) {
        if (has(out, x)) return;
        if (base && has(base, x) && (!has(l, x) || !has(r, x))) return; // removed on one side since the last sync
        out.push(x);
      });
      return out;
    }
    if (isObj(l) && isObj(r)) {
      var o = {}, bo = isObj(b) ? b : {};
      Object.keys(l).concat(Object.keys(r).filter(function (k) { return !(k in l); })).forEach(function (k) {
        var inL = k in l, inR = k in r;
        if (inL && inR) {
          if (MAX_KEYS[k] && typeof l[k] === "number" && typeof r[k] === "number") o[k] = Math.max(l[k], r[k]);
          else if (k === "passed" && typeof l[k] === "boolean" && typeof r[k] === "boolean") o[k] = l[k] || r[k];
          else o[k] = merge3(l[k], r[k], bo[k]);
          return;
        }
        var v = inL ? l[k] : r[k];
        if (k in bo && same(v, bo[k])) return; // unchanged here and deleted on the other side
        o[k] = v;
      });
      return o;
    }
    if (same(l, r)) return l;
    if (b !== undefined && same(l, b)) return r;
    return l;
  }

  function rest(method, path, body, token, prefer) {
    var h = { apikey: CFG.supabaseKey, authorization: "Bearer " + token, accept: "application/json" };
    if (body !== undefined) h["content-type"] = "application/json";
    if (prefer) h.prefer = prefer;
    return fetch(CFG.supabaseUrl + "/rest/v1/" + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) })
      .then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) {}
          return { status: r.status, ok: r.ok, data: j };
        });
      });
  }

  function applyLocal(merged, local) {
    Object.keys(merged).forEach(function (k) { if (!same(merged[k], local[k])) write(k, merged[k]); });
    Object.keys(local).forEach(function (k) { if (!(k in merged)) del(k); });
  }

  function afterLocalChange() {
    if (window.SA_NO_SYNC_RELOAD) return;
    var a = document.activeElement;
    if (a && /^(TEXTAREA|INPUT|SELECT)$/.test(a.tagName)) return;
    reloadOnce();
  }

  var syncing = null;
  function sync(force, attempt) {
    if (syncing && !attempt) return syncing;
    var run = session().then(function (s) {
      if (!s) return null;
      var uid = s.user.id, st = read("sa.sync", null), mine = st && st.uid === uid;
      var local = localData();
      if (!force && mine && Date.now() - (st.pulled || 0) < 60000 && stable(local) === st.h) return null;
      return rest("GET", "progress?user_id=eq." + uid + "&select=data,updated_at", undefined, s.access_token).then(function (got) {
        if (!got.ok) throw new Error("progress read " + got.status);
        var row = got.data && got.data[0], remote = (row && row.data) || {};
        var merged = merge3(local, remote, mine ? st.base : undefined);
        var localChanged = !same(merged, local), remoteChanged = !same(merged, remote);
        var save = !remoteChanged ? Promise.resolve({ ok: true, data: [1] }) : row
          ? rest("PATCH", "progress?user_id=eq." + uid + "&updated_at=eq." + encodeURIComponent(row.updated_at), { data: merged }, s.access_token, "return=representation")
          : rest("POST", "progress", { user_id: uid, data: merged }, s.access_token, "return=representation");
        return save.then(function (res) {
          var clash = res.status === 409 || (res.ok && Array.isArray(res.data) && !res.data.length);
          if (clash) {
            if ((attempt || 0) < 2) return sync(true, (attempt || 0) + 1); // another device saved first: merge again
            throw new Error("progress save conflict");
          }
          if (!res.ok) throw new Error("progress save " + res.status);
          if (localChanged) applyLocal(merged, local);
          write("sa.sync", { uid: uid, base: merged, h: stable(merged), pulled: Date.now() });
          return { localChanged: localChanged, remoteChanged: remoteChanged };
        });
      });
    });
    if (attempt) return run;
    syncing = run.then(function (res) {
      syncing = null;
      if (res && res.localChanged) afterLocalChange();
      return res;
    }, function (e) { syncing = null; throw e; });
    return syncing;
  }

  function checkLocal() {
    var st = read("sa.sync", null);
    if (st && TOKEN && st.uid === TOKEN.uid && stable(localData()) !== st.h) sync(true).catch(noop);
  }

  function signOut() {
    var synced = false;
    return sync(true).then(function () { synced = true; }, noop)
      .then(function () { return client(); })
      .then(function (sb) { return sb.auth.signOut({ scope: "local" }); })
      .catch(noop)
      .then(function () { return fetch("/api/session/", { method: "DELETE", credentials: "same-origin" }).catch(noop); })
      .then(function () {
        // Progress is safe in the account, so take it off this device (it could be a shared computer).
        if (synced) Object.keys(localData()).forEach(del);
        del("sa.member"); del("sa.sync"); del(SB_KEY);
        paint();
      });
  }

  window.SAAuth = {
    config: CFG, loggedIn: hasSession, isMember: isMember, member: memberRec,
    client: client, session: session, refresh: refresh, sync: sync, signOut: signOut, paint: paint,
    lastSync: function () { var st = read("sa.sync", null); return st && st.pulled ? st.pulled : 0; },
    _merge3: merge3, _stable: stable
  };

  /* ---------- start ---------- */
  paint();
  prices();
  if (hasSession()) {
    var m = memberRec();
    var stale = !m || Date.now() - (m.at || 0) > (m.m ? 12 : 3) * HOUR;
    if (window.SA_LOCKED && CFG.live && m && m.m) stale = true; // a member was shown a preview: the cookie needs renewing
    (stale ? refresh() : Promise.resolve(m)).then(function (rec) {
      if (window.SA_LOCKED && CFG.live && rec && rec.m && rec.cookie) reloadOnce();
    }).catch(noop);
    if (!window.SA_NO_AUTO_SYNC) setTimeout(function () { sync().catch(noop); }, 300);
    setInterval(function () { if (document.visibilityState === "visible") checkLocal(); }, 15000);
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") checkLocal(); });
  } else if (raw("sa.member")) {
    clearMember();
    paint();
  }
})();
