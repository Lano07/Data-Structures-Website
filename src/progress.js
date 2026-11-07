/* COMP 2611 Code Lab — keeping progress safe: merging two copies, backup files, rolling local backups,
   sync to the viewer's private storage on their account, and a daily activity log. */
(function (CL) {
  "use strict";
  var P = CL.Progress = { state: "local", last: 0, err: "", listeners: [] };
  var store = null, saveLocal = null, KEY = "", BKEY = "";
  var APP_ID = "comp2611-codelab";

  function day(t) { var d = t ? new Date(t) : new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  P.day = day;
  function isObj(x) { return x && typeof x === "object" && !Array.isArray(x); }
  function clone(x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); }

  // ---------------------------------------------------------------- merging two copies of the progress
  // Field by field, so nothing earned on one device is lost on the other. Counts never add up twice:
  // where two copies disagree on a counter, the larger one wins.
  function byKey(a, b, pick) {
    var out = {};
    Object.keys(a || {}).forEach(function (k) { out[k] = a[k]; });
    Object.keys(b || {}).forEach(function (k) { out[k] = k in out ? pick(out[k], b[k]) : b[k]; });
    return out;
  }
  var newer = function (x, y) { return ((y && y.t) || 0) > ((x && x.t) || 0) ? y : x; };
  var newerU = function (x, y) { return ((y && y.u) || 0) > ((x && x.u) || 0) ? y : x; };
  var biggerN = function (x, y) { return ((y && y.n) || 0) > ((x && x.n) || 0) ? y : x; };
  function listBy(a, b, key, sortKey, cap) {
    var m = {};
    (a || []).concat(b || []).forEach(function (x) { if (!x) return; var k = key(x); if (!m[k] || (x[sortKey] || 0) > (m[k][sortKey] || 0)) m[k] = x; });
    return Object.keys(m).map(function (k) { return m[k]; }).sort(function (x, y) { return (y[sortKey] || 0) - (x[sortKey] || 0); }).slice(0, cap);
  }
  // the game layer (XP, achievements, arcade scores): nothing earned on either device is lost
  function mergeGame(a, b) {
    if (!a) return clone(b);
    if (!b) return clone(a);
    var n = (b.u || 0) > (a.u || 0) ? b : a, M = clone(n);
    var maxNum = function (x, y) { return typeof x === "number" && typeof y === "number" ? Math.max(x, y) : (x || y); };
    M.xp = Math.max(a.xp || 0, b.xp || 0);
    M.sets = Math.max(a.sets || 0, b.sets || 0);
    M.tot = byKey(a.tot, b.tot, maxNum);
    M.best = byKey(a.best, b.best, maxNum);
    M.hist = byKey(a.hist, b.hist, maxNum);
    M.ach = byKey(a.ach, b.ach, function (x, y) { return Math.min(x || Infinity, y || Infinity); });
    ["labs", "seenL", "seenW"].forEach(function (k) { M[k] = byKey(a[k], b[k], function () { return 1; }); });
    M.arc = byKey(a.arc, b.arc, function (x, y) { return { best: Math.max(x.best || 0, y.best || 0), plays: Math.max(x.plays || 0, y.plays || 0), last: (y.t || 0) > (x.t || 0) ? y.last : x.last, t: Math.max(x.t || 0, y.t || 0) }; });
    if (a.day && b.day && a.day.d === b.day.d) M.day = byKey(a.day, b.day, maxNum);
    if (a.qd && b.qd && a.qd.d === b.qd.d) { M.qd = clone(n.qd); M.qd.done = byKey(a.qd.done, b.qd.done, function () { return 1; }); M.qd.chest = Math.max(a.qd.chest || 0, b.qd.chest || 0); }
    return M;
  }
  P.merge = function (L, R) {
    L = L || {}; R = R || {};
    var M = {};
    Object.keys(R).forEach(function (k) { M[k] = clone(R[k]); });
    Object.keys(L).forEach(function (k) { M[k] = clone(L[k]); });
    M.done = byKey(L.done, R.done, function () { return true; });
    M.ex = byKey(L.ex, R.ex, function (x, y) {
      var c = newer(x, y), o = c === x ? y : x, r = Object.assign({}, o || {}, c || {});
      r.passed = !!((x && x.passed) || (y && y.passed));
      r.tried = !!((x && x.tried) || (y && y.tried) || r.passed);
      return r;
    });
    M.quiz = byKey(L.quiz, R.quiz, function (x, y) { return ((y && y.t) || Infinity) < ((x && x.t) || Infinity) ? y : x; });
    M.tb = byKey(L.tb, R.tb, newer);
    M.lab = byKey(L.lab, R.lab, biggerN);
    M.train = byKey(L.train, R.train, biggerN);
    M.cm = byKey(L.cm, R.cm, function (x, y) { return ((y && y.n) || 0) > ((x && x.n) || 0) ? y : ((y && y.n) === (x && x.n) ? newer(x, y) : x); });
    M.srs = byKey(L.srs, R.srs, newerU);
    M.bm = byKey(L.bm, R.bm, newer);
    M.pz = byKey(L.pz, R.pz, function (x, y) { return { ok: !!((x && x.ok) || (y && y.ok)), tries: Math.max((x && x.tries) || 0, (y && y.tries) || 0), t: Math.max((x && x.t) || 0, (y && y.t) || 0) }; });
    M.act = byKey(L.act, R.act, function (x, y) { var o = {}; Object.keys(x || {}).concat(Object.keys(y || {})).forEach(function (f) { o[f] = Math.max((x && x[f]) || 0, (y && y[f]) || 0); }); return o; });
    M.paths = byKey(L.paths, R.paths, function (x, y) { return byKey(x, y, function (a, b) { return a || b; }); });
    M.miss = listBy(L.miss, R.miss, function (x) { return x.g + ":" + x.s; }, "t", 60);
    M.exams = listBy(L.exams, R.exams, function (x) { return String(x.date); }, "date", 40);
    M.diag = listBy(L.diag, R.diag, function (x) { return String(x.date); }, "date", 10);
    M.wr = byKey(L.wr, R.wr, newer);
    if (L.examLast || R.examLast) M.examLast = ((R.examLast && R.examLast.date) || 0) > ((L.examLast && L.examLast.date) || 0) ? clone(R.examLast) : clone(L.examLast);
    if (L.g || R.g) M.g = mergeGame(L.g, R.g);
    ["play", "examNow", "trainPref", "goal", "path"].forEach(function (k) { M[k] = L[k] !== undefined && L[k] !== null ? clone(L[k]) : clone(R[k]); });
    return M;
  };
  function sameData(a, b) { try { return JSON.stringify(a) === JSON.stringify(b); } catch (e) { return false; } }
  // copy a merged object into the live store object, which the rest of the app holds a reference to
  function adopt(M) {
    Object.keys(store).forEach(function (k) { if (!(k in M)) delete store[k]; });
    Object.keys(M).forEach(function (k) { store[k] = M[k]; });
  }

  // ---------------------------------------------------------------- attach, local backups, storage health
  P.attach = function (s, sv, key) {
    store = s; saveLocal = sv; KEY = key; BKEY = key + "-backups";
    P.rollBackup(false);
  };
  P.backups = function () { try { return JSON.parse(localStorage.getItem(BKEY) || "[]"); } catch (e) { return []; } };
  // keep up to 3 copies of the progress in this browser, at most one per day (or one more when forced)
  P.rollBackup = function (force) {
    if (!store) return;
    try {
      var list = P.backups(), now = Date.now();
      if (!force && list.length && now - list[0].t < 20 * 3600 * 1000) return;
      var data = JSON.stringify(store);
      if (data.length < 40) return;
      list.unshift({ t: now, data: data });
      localStorage.setItem(BKEY, JSON.stringify(list.slice(0, 3)));
    } catch (e) { /* storage full: the main copy matters more */ }
  };
  P.restoreBackup = function (i) {
    var b = P.backups()[i];
    if (!b) return false;
    var obj = JSON.parse(b.data);
    P.rollBackup(true);
    adopt(Object.assign({}, obj));
    saveLocal();
    return true;
  };
  P.storageOk = (function () { try { var k = "__cl_test"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; } catch (e) { return false; } })();

  // ---------------------------------------------------------------- daily activity
  // a = activity kind: q (question answered), r (right), l (lesson done), x (exercise passed), c (card reviewed), w (written answer)
  P.log = function (kind, n) {
    if (!store) return;
    var d = day(), act = store.act = store.act || {}, today = act[d] = act[d] || {};
    today[kind] = (today[kind] || 0) + (n || 1);
    var keys = Object.keys(act).sort();
    if (keys.length > 400) keys.slice(0, keys.length - 400).forEach(function (k) { delete act[k]; });
  };
  // active minutes: a minute counts when the page was used (a click, a key or a scroll) during it
  var lastBeat = 0;
  function beat() {
    var now = Date.now();
    if (now - lastBeat < 60000 || !store || document.hidden) return;
    lastBeat = now;
    P.log("m", 1);
    if (saveLocal) saveLocal(true);
  }
  ["click", "keydown", "scroll", "touchstart"].forEach(function (ev) { window.addEventListener(ev, beat, { passive: true, capture: true }); });
  P.dayActive = function (d) { var a = store && store.act && store.act[d]; return !!a && ((a.q || 0) + (a.l || 0) + (a.x || 0) + (a.c || 0) + (a.w || 0) + (a.a || 0) > 0 || (a.m || 0) >= 5); };
  P.streak = function () {
    var n = 0, t = new Date();
    if (!P.dayActive(day(t))) t.setDate(t.getDate() - 1);
    while (P.dayActive(day(t))) { n++; t.setDate(t.getDate() - 1); }
    return n;
  };

  // ---------------------------------------------------------------- backup files
  P.exportObject = function () { return { app: APP_ID, format: 1, exported: new Date().toISOString(), progress: store }; };
  P.exportText = function () { return JSON.stringify(P.exportObject()); };
  P.exportFile = function () {
    var name = "comp2611-code-lab-progress-" + day() + ".json", text = JSON.stringify(P.exportObject(), null, 1);
    if (!window.claude || !window.claude.use) {
      // hosted outside claude.ai (for example on GitHub Pages): an ordinary browser download
      try {
        var url = URL.createObjectURL(new Blob([text], { type: "application/json" })), a = document.createElement("a");
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        return Promise.resolve({ ok: true });
      } catch (e) { return Promise.reject({ code: "unavailable" }); }
    }
    return window.claude.use("downloads").then(function (dl) {
      if (!dl) throw { code: "unavailable" };
      return dl.save({ filename: name, data: text });
    });
  };
  // returns {ok, msg}; mode "merge" keeps everything from both, "replace" uses only the file
  P.importText = function (text, mode) {
    var obj;
    try { obj = JSON.parse(String(text).trim()); } catch (e) { return { ok: false, msg: "That is not a backup: it is not valid JSON." }; }
    if (!obj || obj.app !== APP_ID || !isObj(obj.progress)) return { ok: false, msg: "That file is not a COMP 2611 Code Lab backup." };
    var incoming = obj.progress;
    var fieldsOk = ["done", "ex", "quiz", "train"].every(function (k) { return incoming[k] === undefined || isObj(incoming[k]); });
    if (!fieldsOk) return { ok: false, msg: "The backup looks damaged, so nothing was changed." };
    P.rollBackup(true);
    adopt(mode === "replace" ? clone(incoming) : P.merge(store, incoming));
    saveLocal();
    P.fire();
    return { ok: true, msg: mode === "replace" ? "Your progress was replaced with the backup from " + (obj.exported || "the file").slice(0, 10) + "." : "The backup was merged with your progress. Nothing was lost." };
  };
  P.reset = function () {
    P.rollBackup(true);
    adopt({});
    saveLocal();
    P.fire();
  };

  // ---------------------------------------------------------------- sync to the viewer's own private storage
  var docRef = null, writing = false, again = false, timer = null, lastSent = "";
  P.on = function (f) { P.listeners.push(f); };
  P.fire = function () { P.listeners.forEach(function (f) { try { f(P); } catch (e) { /* ignore */ } }); };
  function setState(s, err) { P.state = s; P.err = err || ""; P.fire(); }
  // the synced copy leaves out code drafts if the whole thing would not fit in one document
  function payload() {
    var data = JSON.parse(JSON.stringify(store));
    var text = JSON.stringify(data);
    if (text.length > 220000) {
      delete data.play;
      Object.keys(data.ex || {}).forEach(function (k) { if (data.ex[k]) delete data.ex[k].code; });
      delete data.examLast;
      text = JSON.stringify(data);
      P.trimmed = true;
    } else P.trimmed = false;
    return { app: APP_ID, format: 1, saved: Date.now(), data: text };
  }
  function write() {
    if (!docRef) return;
    if (writing) { again = true; return; }
    var body = payload();
    if (body.data === lastSent) return;
    writing = true;
    setState("saving");
    docRef.set(body).then(function () {
      lastSent = body.data;
      P.last = Date.now();
      writing = false;
      setState("on");
      if (again) { again = false; write(); }
    }, function (e) {
      writing = false;
      var code = e && e.code;
      if (code === "unavailable" && !again) { again = true; setTimeout(function () { again = false; write(); }, 1500 + Math.random() * 1500); setState("on"); return; }
      setState(code === "quota_exceeded" ? "error" : code === "revoked" || code === "not_granted" ? "off" : "error", code === "quota_exceeded" ? "The synced copy is full." : "Could not save the synced copy (" + (code || "error") + "). Your progress is still saved in this browser.");
    });
  }
  P.changed = function () {
    if (!docRef) return;
    clearTimeout(timer);
    timer = setTimeout(write, 2500);
  };
  P.flush = function () { if (docRef) { clearTimeout(timer); write(); } };
  document.addEventListener("visibilitychange", function () { if (document.hidden) P.flush(); });
  // onMerged(changed): called after the account copy is merged in
  P.startSync = function (onMerged) {
    if (!store || !window.claude || !window.claude.use) { setState("unavailable"); return; }
    setState("connecting");
    var to = setTimeout(function () { if (P.state === "connecting") setState("unavailable", "Sync did not answer."); }, 12000);
    Promise.all([window.claude.use("db"), window.claude.use("user")]).then(function (caps) {
      var db = caps[0], user = caps[1];
      if (!db || !user) { clearTimeout(to); setState("unavailable"); return null; }
      return user.id().then(function (id) {
        if (!id) { clearTimeout(to); setState("unavailable", "Sign in to keep a copy on your account."); return null; }
        docRef = db.collection("data/users/" + id).doc("codelab");
        return docRef.get().then(function (snap) {
          clearTimeout(to);
          var changed = false;
          if (snap.exists) {
            var body = snap.data() || {}, remote = null;
            try { remote = body.app === APP_ID ? JSON.parse(body.data) : null; } catch (e) { remote = null; }
            if (remote) {
              var merged = P.merge(store, remote);
              if (!sameData(merged, store)) { P.rollBackup(true); adopt(merged); saveLocal(true); changed = true; }
              lastSent = body.data;
            }
          }
          P.last = Date.now();
          setState("on");
          write();
          if (onMerged) onMerged(changed);
          return null;
        });
      });
    }).catch(function (e) {
      clearTimeout(to);
      docRef = null;
      setState(e && (e.code === "not_granted" || e.code === "revoked") ? "off" : "error", "Sync is not available right now (" + ((e && e.code) || "error") + "). Your progress is saved in this browser.");
    });
  };
})(CL);
