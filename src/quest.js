/* COMP 2611 Code Lab — Quest: "The Lost Index", a 16-bit story campaign. Each topic is a chapter (a world) set in a
   real place in history; each subtopic is a level. Levels are a story you play: dialogue, journal pages that teach,
   and challenges you must solve with your hands (click the traversal, rewire the pointers, sift the heap, write the
   code). Mistakes cost hearts (and stars), never progress. Relics carry real history; the journal keeps your notes. */
(function (CL) {
  "use strict";
  var Q = CL.Quest = {}, esc = CL.esc, A = CL.QArt, QW = CL.QW;
  var D = null, WORLDS = [], LV = {}, ORDER = [];

  var WHO = {
    you: { name: null, spr: "you" }, marco: { name: "Marco", spr: "marco" }, pip: { name: "Pip", spr: "pip" },
    prof: { name: "Prof. Ramdeen", spr: "prof" }, silas: { name: "Silas Crane", spr: "silas" }, narrator: { name: "Journal", spr: "narrator" }
  };
  var TASK_LABEL = { quiz: "Choose", type: "Answer", predict: "Predict the output", order: "Put it in order", fill: "Fill the gaps", match: "Match them", tree: "Tree puzzle",
    graph: "Map puzzle", array: "Array puzzle", heap: "Heap puzzle", sort: "You are the algorithm", listsim: "Rewire the pointers", code: "Coding challenge" };

  function st() {
    var s = CL.store;
    s.quest = s.quest || {};
    var q = s.quest;
    q.lv = q.lv || {}; q.relics = q.relics || {}; q.bonus = q.bonus || {}; q.look = q.look || {}; q.frag = q.frag || {};
    return q;
  }
  Q.state = st;
  function init() {
    if (D) return;
    D = window.CODELAB_DATA;
    WORLDS = (D.quest && D.quest.worlds) || [];
    WORLDS.forEach(function (w, wi) { w.index = wi; w.levels.forEach(function (l, li) { l.world = w; l.index = li; LV[l.id] = l; ORDER.push(l); }); });
  }
  Q.worlds = function () { init(); return WORLDS; };
  Q.level = function (id) { init(); return LV[id]; };
  function youName() { return st().name || "Explorer"; }
  function youPal() { return A.youPal(st().look); }
  function portrait(who, scale) {
    var w = WHO[who] || WHO.narrator;
    return A.img(w.spr, { scale: scale || 4, pal: who === "you" ? youPal() : null });
  }
  function nameOf(who) { return who === "you" ? youName() : (WHO[who] || WHO.narrator).name; }
  function lvDone(id) { var x = st().lv[id]; return !!(x && x.done); }
  function starsOf(id) { var x = st().lv[id]; return x && x.stars ? x.stars : 0; }
  function worldProgress(w) {
    var done = w.levels.filter(function (l) { return lvDone(l.id); }).length;
    return { done: done, total: w.levels.length, stars: w.levels.reduce(function (s, l) { return s + starsOf(l.id); }, 0) };
  }
  Q.worldProgress = worldProgress;
  // the player's name and colours (for the home page)
  Q.you = function () { return { name: youName(), pal: youPal(), named: !!st().name }; };
  function nextLevel() {
    init();
    var last = st().last && LV[st().last];
    if (last) { var i = ORDER.indexOf(last); for (var k = i; k < ORDER.length; k++) if (!lvDone(ORDER[k].id)) return ORDER[k]; }
    for (var j = 0; j < ORDER.length; j++) if (!lvDone(ORDER[j].id)) return ORDER[j];
    return null;
  }
  Q.nextLevel = nextLevel;
  Q.stats = function () {
    init();
    var s = st(), done = ORDER.filter(function (l) { return lvDone(l.id); });
    return { levels: done.length, total: ORDER.length, three: done.filter(function (l) { return starsOf(l.id) >= 3; }).length,
      worlds: WORLDS.filter(function (w) { var p = worldProgress(w); return p.total && p.done === p.total; }).length, worldTotal: WORLDS.length,
      relics: Object.keys(s.relics).length, stars: done.reduce(function (t, l) { return t + starsOf(l.id); }, 0) };
  };
  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  // ---------------------------------------------------------------- the explorer: name and look
  function setupDialog(onDone) {
    var s = st(), look = Object.assign({ skin: "b", outfit: "khaki", hat: "brown" }, s.look);
    var m = h("div", "modal px-modal");
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    m.setAttribute("aria-label", "Your explorer");
    function opts(kind, map) { return Object.keys(map).map(function (k) { return '<button type="button" class="px-swatch" data-k="' + kind + '" data-v="' + k + '" style="--sw:' + map[k][0] + '" aria-label="' + kind + " " + k + '"></button>'; }).join(""); }
    var box = h("div", "modal-in px-panel qs-setup",
      '<div class="qs-top"><div class="qs-prev"></div><div><div class="px-kicker">Your explorer</div><h3 class="px-h">Who is joining the expedition?</h3>' +
      '<label class="px-lbl">Name<input type="text" class="px-in" maxlength="18" value="' + esc(s.name || "") + '" placeholder="Explorer"></label></div></div>' +
      '<div class="qs-row"><span>Skin</span><div>' + opts("skin", A.SKINS) + '</div></div><div class="qs-row"><span>Outfit</span><div>' + opts("outfit", A.OUTFITS) + '</div></div><div class="qs-row"><span>Hat</span><div>' + opts("hat", A.HATS) + "</div></div>" +
      '<div class="qs-foot"><button type="button" class="px-btn primary" data-go>Begin the adventure ▶</button></div>');
    m.appendChild(box);
    document.body.appendChild(m);
    var prev = box.querySelector(".qs-prev"), inp = box.querySelector("input");
    function draw() {
      prev.innerHTML = A.img("you", { scale: 6, pal: A.youPal(look) });
      box.querySelectorAll(".px-swatch").forEach(function (b) { b.classList.toggle("on", look[b.getAttribute("data-k")] === b.getAttribute("data-v")); });
    }
    draw();
    box.addEventListener("click", function (e) {
      var sw = e.target.closest(".px-swatch");
      if (sw) { look[sw.getAttribute("data-k")] = sw.getAttribute("data-v"); draw(); return; }
      if (e.target.closest("[data-go]")) finish();
    });
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") finish(); });
    function finish() { s.name = inp.value.trim().slice(0, 18) || "Explorer"; s.look = look; CL.save(); m.remove(); if (onDone) onDone(); }
    setTimeout(function () { inp.focus(); }, 40);
  }
  Q.setup = setupDialog;

  // ---------------------------------------------------------------- the map
  function hub(ui) {
    init();
    var p = ui.page("quest-page");
    ui.setTutor("home", "Quest: The Lost Index", function () { var s = Q.stats(); return "The student is on the Quest map (a story campaign through the course). Levels finished: " + s.levels + " of " + s.total + ". " + ui.progressText(); });
    var s = st(), stats = Q.stats(), nx = nextLevel();
    var head = h("section", "qh-hero px-panel");
    head.innerHTML = '<img class="qh-scene" src="' + A.panorama("night") + '" alt="" aria-hidden="true"><div class="qh-in">' +
      '<div class="px-kicker">Quest · a 16-bit story through COMP 2611</div><h1 class="px-title">The Lost Index</h1>' +
      '<p class="qh-lede">Professor Ramdeen has vanished, and her field journal points to a treasure hidden by the record-keepers of history. Every chapter is a real place and a data structure. You do not read about them: you <b>use</b> them to get through.</p>' +
      '<div class="qh-me"><span class="qh-av">' + A.img("you", { scale: 4, pal: youPal() }) + '</span><div><b>' + esc(youName()) + '</b><div class="small">' + stats.levels + " of " + stats.total + " levels · " + stats.stars + " ★ · " + stats.relics + " relics · " + stats.worlds + " of " + stats.worldTotal + ' key fragments</div></div><button type="button" class="px-btn small ghost" data-setup>Change explorer</button></div>' +
      '<div class="qh-acts">' + (nx ? '<a class="px-btn primary big" href="#quest-' + nx.id + '">' + (stats.levels ? "Continue: " : "Start: ") + esc(nx.title) + " ▶</a>" : '<span class="px-badge">Every level complete. You found the Lost Index!</span>') +
      '<a class="px-btn" href="#journal">' + A.img("journal", { scale: 2 }) + " Journal</a></div></div>";
    p.appendChild(head);
    head.querySelector("[data-setup]").addEventListener("click", function () { setupDialog(function () { ui.route(); }); });
    var map = h("div", "qmap");
    WORLDS.forEach(function (w, wi) {
      var pr = worldProgress(w), full = pr.done === pr.total;
      var card = h("section", "qw-world px-panel" + (full ? " full" : ""));
      card.style.setProperty("--wc", w.color || "#ffd23f");
      card.id = "qw-" + w.id;
      var boss = w.topic && CL.Boss && CL.Boss.byId[w.topic] ? CL.Boss.byId[w.topic] : null, bossWon = boss && CL.Boss.state(boss.id).wins;
      card.innerHTML = '<div class="qw-banner"><img src="' + A.scene(w.scene) + '" alt="" aria-hidden="true"><div class="qw-bt"><span class="px-kicker">Chapter ' + wi + " · " + esc(w.place) + (w.when ? " · " + esc(w.when) : "") + '</span><h2 class="px-h">' + esc(w.title) + '</h2><p>' + esc(w.blurb || "") + "</p></div>" +
        '<div class="qw-prog"><span>' + pr.done + "/" + pr.total + '</span><span class="qw-stars">' + pr.stars + " ★</span>" + (full ? '<span class="qw-frag" title="' + esc(w.fragment || "Key fragment") + '">' + A.img("key", { scale: 2 }) + "</span>" : "") + "</div></div>";
      var path = h("div", "qw-path");
      w.levels.forEach(function (l, li) {
        var done = lvDone(l.id), stars = starsOf(l.id), isNext = nx && nx.id === l.id;
        var a = h("a", "qn" + (done ? " done" : "") + (isNext ? " next" : "") + (!done && !isNext && li > 0 && !lvDone(w.levels[li - 1].id) ? " later" : ""));
        a.href = "#quest-" + l.id;
        a.style.setProperty("--x", ["10%", "34%", "58%", "78%", "54%", "30%"][li % 6]);
        a.innerHTML = '<span class="qn-dot">' + (done ? "✓" : li + 1) + '</span><span class="qn-t"><b>' + esc(l.title) + '</b><small>' + (done ? "★★★".slice(0, stars) + "☆☆☆".slice(stars) : isNext ? "Next" : esc(l.goal || "")) + "</small></span>";
        path.appendChild(a);
      });
      if (boss) {
        var bb = h("a", "qn boss" + (bossWon ? " done" : ""));
        bb.href = "#boss-" + boss.id;
        bb.style.setProperty("--x", "44%");
        bb.innerHTML = '<span class="qn-dot">' + (bossWon ? "✓" : esc(boss.icon)) + '</span><span class="qn-t"><b>Boss: ' + esc(boss.name) + "</b><small>" + (bossWon ? "Defeated" : "Exam-style questions") + "</small></span>";
        path.appendChild(bb);
      }
      card.appendChild(path);
      map.appendChild(card);
    });
    p.appendChild(map);
    if (!s.name) setTimeout(function () { setupDialog(function () { ui.route(); }); }, 250);
    if (nx && location.hash === "#quest") { var tgt = p.querySelector("#qw-" + nx.world.id); if (tgt && Q.stats().levels) setTimeout(function () { tgt.scrollIntoView({ block: "start" }); }, 60); }
  }

  // ---------------------------------------------------------------- a level
  function level(ui, id) {
    init();
    var L = LV[id];
    if (!L) return false;
    var w = L.world, s = st();
    s.last = id;
    CL.save();
    var p = ui.page("quest-level");
    ui.setTutor("lesson", "Quest: " + L.title, function () {
      var cur = feed.lastElementChild;
      return "The student is playing a Quest level (a story level that teaches through challenges): \"" + L.title + "\" in the chapter \"" + w.title + "\" (" + w.place + "). Goal: " + (L.goal || "") +
        "\nWhat is on screen now: " + (cur ? CL.Tutor.clip(cur.innerText || "", 2500) : "the start of the level") + "\nIf the student asks for help with a challenge, give hints, not the answer.";
    });
    var mistakes = 0, i = -1, beats = L.beats, solved = true, destroyers = [], relicsFound = [], journal = [], finished = false;
    p.innerHTML = '<div class="ql-top px-panel"><a class="px-btn small" href="#quest">◀ Map</a><div class="ql-tt"><span class="px-kicker">Chapter ' + w.index + " · " + esc(w.title) + '</span><b>' + esc(L.title) + '</b></div><div class="ql-hearts" aria-label="Hearts"></div><div class="ql-bar"><i></i></div></div>' +
      '<div class="ql-scene px-panel"><img src="' + A.scene(w.scene) + '" alt="' + esc(w.place) + '"><div class="ql-goal"><span class="px-kicker">Level ' + (L.index + 1) + " of " + w.levels.length + "</span>" + (L.goal ? "<b>" + esc(L.goal) + "</b>" : "") + "</div></div>" +
      '<div class="ql-feed" aria-live="polite"></div><div class="ql-foot"><button type="button" class="px-btn primary big ql-next">Continue ▶</button><span class="small muted ql-keys">Enter or Space to continue</span></div>';
    var feed = p.querySelector(".ql-feed"), nextBtn = p.querySelector(".ql-next"), heartsEl = p.querySelector(".ql-hearts"), barEl = p.querySelector(".ql-bar i");
    function hearts() {
      var left = Math.max(0, 3 - mistakes);
      heartsEl.innerHTML = [0, 1, 2].map(function (k) { return '<span class="ql-heart' + (k < left ? "" : " lost") + '">' + A.img("heart", { scale: 2 }) + "</span>"; }).join("");
    }
    hearts();
    function setNext(on, label) { nextBtn.disabled = !on; nextBtn.textContent = label || "Continue ▶"; }
    function progress() { barEl.style.width = Math.round(100 * Math.max(0, i + 1) / beats.length) + "%"; }
    function ctxFor(card) {
      var fbEl = card.querySelector(".qb-fb");
      function show(html, cls) { fbEl.className = "qb-fb" + (cls ? " " + cls : ""); fbEl.innerHTML = html || ""; }
      return {
        ok: function (msg) {
          if (card.classList.contains("solved")) { if (msg) show(msg, "ok"); return; }
          card.classList.add("solved");
          if (msg) show((card.classList.contains("task") ? "<b>✓ Nice.</b> " : "") + msg, "ok");
          if (card.classList.contains("task")) { CL.Progress.log("q"); CL.Progress.log("r"); if (CL.FX) CL.FX.sfx("right", 1); }
          solved = true;
          setNext(true);
          setTimeout(function () { if (document.body.contains(nextBtn)) nextBtn.focus({ preventScroll: true }); }, 30);
        },
        miss: function (msg) {
          mistakes++;
          hearts();
          heartsEl.classList.remove("hit"); void heartsEl.offsetWidth; heartsEl.classList.add("hit");
          show("<b>✗</b> " + (msg || "Not quite."), "bad");
          CL.Progress.log("q");
          if (mistakes === 3) pipSays("Squawk! Out of hearts, but keep going: you can't fail a level, you just earn fewer stars. Use the hints.");
        },
        note: function (msg) { show(msg, "note"); },
        bonus: function (key, xp, label) { if (!s.bonus[key]) { s.bonus[key] = 1; CL.save(); if (CL.Game) CL.Game.award(xp, label); } },
        onDestroy: function (f) { destroyers.push(f); }
      };
    }
    function pipSays(text) {
      var c = h("div", "qb say pip-aside", '<div class="qb-por">' + portrait("pip", 3) + '</div><div class="qb-bub"><b>Pip</b><p>' + esc(text) + "</p></div>");
      feed.appendChild(c);
    }
    function typewrite(el, html) {
      if (CL.reduceMotion) { el.innerHTML = html; return function () {}; }
      el.innerHTML = html;
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), texts = [], n;
      while ((n = walker.nextNode())) { texts.push({ n: n, t: n.nodeValue }); n.nodeValue = ""; }
      var ti = 0, ci = 0, timer = setInterval(step, 14), stopped = false;
      function step() {
        for (var k = 0; k < 3; k++) {
          if (ti >= texts.length) { clearInterval(timer); stopped = true; return; }
          var x = texts[ti];
          x.n.nodeValue = x.t.slice(0, ++ci);
          if (ci >= x.t.length) { ti++; ci = 0; }
        }
      }
      return function finish() { if (stopped) return false; clearInterval(timer); stopped = true; texts.forEach(function (x) { x.n.nodeValue = x.t; }); return true; };
    }
    var skipTyping = null;
    function render(b) {
      var card;
      if (b.t === "say") {
        var you = b.who === "you";
        card = h("div", "qb say" + (you ? " me" : "") + " who-" + b.who, '<div class="qb-por">' + portrait(b.who, 3) + '</div><div class="qb-bub"><b>' + esc(nameOf(b.who)) + "</b><p></p></div>");
        feed.appendChild(card);
        skipTyping = typewrite(card.querySelector("p"), CL.inline(b.text.replace(/\{name\}/g, youName())));
        card.addEventListener("click", function () { if (skipTyping && skipTyping()) return; if (feed.lastElementChild === card && !nextBtn.disabled) advance(); });
        return;
      }
      if (b.t === "scene") { card = h("div", "qb scene", '<span class="px-kicker">' + esc(b.text) + "</span>"); feed.appendChild(card); return; }
      if (b.t === "learn") {
        card = h("div", "qb learn px-paper", '<div class="qb-lh">' + A.img("journal", { scale: 2 }) + "<span>" + esc(b.title || "From the journal") + "</span></div>");
        var body = CL.renderMd(b.md.replace(/\{name\}/g, youName()), CL.mdHooks ? CL.mdHooks({ where: "the Quest" }) : {});
        card.appendChild(body);
        feed.appendChild(card);
        return;
      }
      if (b.t === "relic") {
        card = h("div", "qb relic", '<button type="button" class="px-btn ghost qb-glint">' + A.img("relic", { scale: 2 }) + " Something glints nearby… look closer</button>");
        feed.appendChild(card);
        card.querySelector("button").addEventListener("click", function () {
          card.innerHTML = '<div class="qb-relic px-paper">' + A.img("relic", { scale: 4 }) + '<div><span class="px-kicker">Relic found</span><b>' + esc(b.title) + "</b>" + CL.renderMd(b.text).outerHTML + "</div></div>";
          if (!s.relics[b.id]) { s.relics[b.id] = Date.now(); CL.save(); if (CL.Game) CL.Game.award(25, "relic found"); if (CL.FX) CL.FX.sfx("chest"); }
          relicsFound.push(b);
        });
        return;
      }
      if (b.t === "boss") {
        var boss = CL.Boss && CL.Boss.byId[b.boss || w.topic];
        card = h("div", "qb boss px-panel", '<div class="qb-bossh"><span class="qb-bossic">' + (boss ? esc(boss.icon) : "⚔") + '</span><div><span class="px-kicker">Boss battle</span><b>' + esc(boss ? boss.name : "The boss") + "</b><p>" + CL.inline(b.text || (boss ? boss.lore : "")) + '</p></div></div><a class="px-btn primary" href="#boss-' + esc(boss ? boss.id : "") + '">Fight the boss ⚔</a> <span class="small muted">or finish the level first: the boss waits on the map.</span>');
        feed.appendChild(card);
        return;
      }
      // challenges and extras
      var task = !!TASK_LABEL[b.t];
      card = h("div", "qb " + (task ? "task" : "extra") + " qb-" + b.t, (task ? '<div class="qb-th"><span class="px-kicker">' + esc(b.label || TASK_LABEL[b.t]) + "</span></div>" : "") + '<div class="qb-body"></div><div class="qb-fb" aria-live="polite"></div>');
      card._b = b;
      feed.appendChild(card);
      var ctx = ctxFor(card);
      if (task) { solved = false; setNext(false, "Solve it to continue"); }
      try { (QW[b.t] || function (host) { host.innerHTML = '<p class="muted">Unknown challenge type ' + esc(b.t) + "</p>"; ctx.ok(""); })(card.querySelector(".qb-body"), b, ctx); }
      catch (e) { if (CL.debug) console.error(e); card.querySelector(".qb-body").innerHTML = '<p class="muted">This challenge could not start (' + esc(e.message) + ").</p>"; ctx.ok(""); }
    }
    function advance() {
      if (finished) return;
      if (skipTyping && skipTyping()) return;
      if (!solved) return;
      i++;
      // journal notes are collected, not shown
      while (i < beats.length && beats[i].t === "journal") { journal = journal.concat(beats[i].items); i++; }
      progress();
      if (i >= beats.length) { complete(); return; }
      setNext(true);
      render(beats[i]);
      var last = feed.lastElementChild;
      if (last) { last.classList.add("enter"); setTimeout(function () { last.scrollIntoView({ behavior: "smooth", block: last.offsetHeight > window.innerHeight * 0.7 ? "start" : "center" }); }, 20); }
    }
    nextBtn.addEventListener("click", advance);
    function onKey(e) {
      if (!document.body.contains(p)) return;
      if (e.target.closest("input, textarea, select, .ed, [contenteditable], .modal")) return;
      if ((e.key === "Enter" || e.key === " ") && !nextBtn.disabled) { if (e.target.closest("button, a") && e.target !== nextBtn) return; e.preventDefault(); advance(); }
    }
    document.addEventListener("keydown", onKey);
    function complete() {
      finished = true;
      var stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1;
      var rec = s.lv[id] = s.lv[id] || {}, first = !rec.done, better = stars > (rec.stars || 0);
      rec.done = true; rec.stars = Math.max(rec.stars || 0, stars); rec.n = (rec.n || 0) + 1; rec.t = Date.now();
      if (journal.length) rec.notes = journal;
      var wp = worldProgress(w), fragNew = wp.done === wp.total && !s.frag[w.id];
      if (fragNew) s.frag[w.id] = Date.now();
      CL.save();
      var xp = first ? 40 + 10 * stars : better ? 20 : 10;
      if (CL.Game) CL.Game.award(xp, first ? "level complete" : "level replayed", { big: first });
      if (CL.FX) { CL.FX.sfx("chest"); CL.FX.celebrate(stars === 3); }
      if (CL.Game && CL.Game.checkAch) CL.Game.checkAch();
      var idx = ORDER.indexOf(L), nx = ORDER[idx + 1];
      setNext(false, "Level complete");
      var end = h("div", "qb done-card px-panel");
      end.innerHTML = '<div class="px-kicker">Level complete</div><div class="qd-stars">' + [0, 1, 2].map(function (k) { return '<span class="' + (k < stars ? "on" : "") + '" style="--d:' + k * 0.18 + 's">' + A.img("star", { scale: 3 }) + "</span>"; }).join("") + "</div>" +
        '<p class="qd-sum">' + (mistakes === 0 ? "Flawless: no mistakes." : mistakes + " mistake" + (mistakes > 1 ? "s" : "") + ". Replay it any time for 3 stars.") + " <b>+" + xp + " XP</b>" + (relicsFound.length ? " · " + relicsFound.length + " relic" + (relicsFound.length > 1 ? "s" : "") + " found" : "") + "</p>" +
        (journal.length ? '<div class="qd-notes px-paper"><div class="qb-lh">' + A.img("journal", { scale: 2 }) + "<span>Added to your journal</span></div><ul>" + journal.map(function (t) { return "<li>" + CL.inline(t) + "</li>"; }).join("") + "</ul></div>" : "") +
        (fragNew ? '<div class="qd-frag">' + A.img("key", { scale: 4 }) + "<div><span class=\"px-kicker\">Key fragment found</span><b>" + esc(w.fragment || "A key fragment") + "</b><p>Chapter complete! " + (w.topic ? "The chapter boss is waiting on the map if you want to test yourself with exam-style questions." : "") + "</p></div></div>" : "") +
        '<div class="qd-acts">' + (nx ? '<a class="px-btn primary big" href="#quest-' + nx.id + '">Next: ' + esc(nx.title) + " ▶</a>" : "") + '<a class="px-btn" href="#quest">Map</a><button type="button" class="px-btn ghost" data-replay>Replay</button>' +
        (L.lessons && L.lessons.length ? L.lessons.filter(function (x) { return D.lessons[x]; }).map(function (x) { return '<a class="px-btn ghost small" href="#l-' + x + '">Deep dive: ' + esc(D.lessons[x].title) + "</a>"; }).join("") : "") + "</div>";
      feed.appendChild(end);
      end.querySelector("[data-replay]").addEventListener("click", function () { ui.route(); });
      setTimeout(function () { end.scrollIntoView({ behavior: "smooth", block: "center" }); }, 30);
      if (fragNew && CL.FX) setTimeout(function () { CL.FX.overlay('<div class="qd-ov">' + A.img("key", { scale: 6 }) + '</div><div class="lu-k">Key fragment</div><div class="lu-rank"><b>' + esc(w.fragment || "Key fragment") + '</b></div><div class="lu-sub">Chapter ' + w.index + ": " + esc(w.title) + " complete.</div>", { cls: "levelup", label: "Key fragment", button: "Onward" }); }, 900);
    }
    ui.setCurrent({ destroy: function () { document.removeEventListener("keydown", onKey); destroyers.forEach(function (f) { try { f(); } catch (e) { /* ignore */ } }); } });
    advance();
  }

  // ---------------------------------------------------------------- the journal: your notes and relics, chapter by chapter
  function journalPage(ui) {
    init();
    var p = ui.page("quest-journal");
    ui.setTutor("ref", "Quest journal", function () { return "The student's Quest journal: notes from finished levels and relics with history notes."; });
    var s = st();
    var html = '<div class="crumbs"><a href="#quest">Quest</a><span>/</span><span>Journal</span></div><div class="px-kicker">Field journal</div><h1 class="px-title small">' + esc(youName()) + "'s journal</h1>" +
      '<p class="lede">Every level you finish adds its key points here, so this is your revision summary for the whole course. Relics you find keep their history notes.</p>';
    WORLDS.forEach(function (w, wi) {
      var lvls = w.levels;
      html += '<section class="qj-ch px-paper"><h2 class="px-h">Chapter ' + wi + ": " + esc(w.title) + ' <small>' + esc(w.place) + "</small></h2>";
      lvls.forEach(function (l) {
        var rec = s.lv[l.id], notes = (rec && rec.notes) || (rec && rec.done ? l.notes : null);
        html += '<div class="qj-l"><h3>' + esc(l.title) + (rec && rec.done ? ' <span class="qj-st">' + "★★★".slice(0, rec.stars) + "</span>" : "") + "</h3>" +
          (rec && rec.done && notes && notes.length ? "<ul>" + notes.map(function (t) { return "<li>" + CL.inline(t) + "</li>"; }).join("") + "</ul>" : '<p class="muted small">' + (rec && rec.done ? "No notes." : "Not explored yet. <a href=\"#quest-" + l.id + "\">Play this level</a>.") + "</p>");
        (l.relics || []).forEach(function (r) {
          if (s.relics[r.id]) html += '<div class="qj-relic">' + A.img("relic", { scale: 2 }) + "<div><b>" + esc(r.title) + "</b> " + CL.inline(r.text.replace(/\n+/g, " ")) + "</div></div>";
        });
        html += "</div>";
      });
      html += "</section>";
    });
    p.innerHTML = html;
  }

  CL.pages = CL.pages || {};
  CL.pages.quest = { nav: "quest", draw: hub };
  CL.pages["quest-"] = { nav: "quest", draw: function (ui, id) { return level(ui, id); } };
  CL.pages.journal = { nav: "quest", draw: journalPage };
})(CL);
