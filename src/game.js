/* COMP 2611 Code Lab — the game layer: XP, levels and ranks, answer combos, daily quests, achievements,
   the header HUD, the combo meter and the Trophy Room. It listens to the activity the rest of the site already
   records (CL.Progress.log), so every lesson check, practice question, lab prediction and exercise counts. */
(function (CL) {
  "use strict";
  var G = CL.Game = {};
  var esc = CL.esc, FX = CL.FX;
  var store = null, g = null, D = null;

  // ---------------------------------------------------------------- levels and ranks
  // total XP needed to reach level L: 0, 120, 360, 720, 1200 ... (each level needs 120 more than the last)
  function xpFor(L) { return 60 * (L - 1) * L; }
  function levelOf(xp) { var L = 1; while (xpFor(L + 1) <= xp) L++; return L; }
  var RANKS = [
    [1, "Null Pointer", "Every journey starts at NULL."],
    [3, "Hello, World", "You have printed your first output."],
    [5, "Pointer Apprentice", "You know where things live in memory."],
    [7, "Node Wrangler", "createNode is second nature."],
    [9, "List Linker", "next, next, next: no node gets lost."],
    [11, "Recursion Ranger", "Base case first, then trust the call."],
    [13, "Tree Climber", "Preorder, inorder, postorder: all yours."],
    [15, "BST Navigator", "Left is smaller, right is bigger."],
    [18, "Heap Hacker", "A[i/2] >= A[i], always."],
    [21, "Hash Slinger", "key % 12 + 1, collisions handled."],
    [24, "Graph Explorer", "WHITE, GREY, BLACK."],
    [27, "Path Finder", "Dijkstra would be proud."],
    [30, "Sort Sorcerer", "n log n is the speed of thought."],
    [35, "Big-O Oracle", "You see the cost of every line."],
    [40, "Data Structures Legend", "Programs = Algorithms + Data Structures."]
  ];
  function rankOf(L) { var r = RANKS[0]; RANKS.forEach(function (x) { if (L >= x[0]) r = x; }); return r; }
  function nextRank(L) { for (var i = 0; i < RANKS.length; i++) if (RANKS[i][0] > L) return RANKS[i]; return null; }
  function mult(c) { return c >= 30 ? 4 : c >= 20 ? 3 : c >= 10 ? 2 : c >= 5 ? 1.5 : 1; }
  G.xpFor = xpFor; G.levelOf = levelOf; G.rankOf = rankOf; G.RANKS = RANKS; G.mult = mult;

  // ---------------------------------------------------------------- achievements
  var ACH = [
    ["first", "✨", "Hello, Memory", "Answer your first question.", 20, function (S) { return S.q >= 1; }],
    ["r10", "🎯", "Warming Up", "Answer 10 questions correctly.", 30, function (S) { return S.r >= 10; }],
    ["r100", "💯", "Century", "Answer 100 questions correctly.", 100, function (S) { return S.r >= 100; }],
    ["r500", "🤖", "The Machine", "Answer 500 questions correctly.", 250, function (S) { return S.r >= 500; }],
    ["r1000", "👑", "Unstoppable", "Answer 1,000 questions correctly.", 500, function (S) { return S.r >= 1000; }],
    ["cb5", "🔥", "On Fire", "Get 5 answers right in a row.", 40, function (S) { return S.bestCombo >= 5; }],
    ["cb10", "☄️", "Blazing", "Get 10 answers right in a row.", 80, function (S) { return S.bestCombo >= 10; }],
    ["cb25", "🌟", "Supernova", "Get 25 answers right in a row.", 200, function (S) { return S.bestCombo >= 25; }],
    ["cb50", "🌌", "Event Horizon", "Get 50 answers right in a row.", 400, function (S) { return S.bestCombo >= 50; }],
    ["l1", "📘", "First Steps", "Complete a lesson.", 30, function (S) { return S.lessons >= 1; }],
    ["l10", "📚", "Bookworm", "Complete 10 lessons.", 100, function (S) { return S.lessons >= 10; }],
    ["l30", "🧠", "Big Brain", "Complete 30 lessons.", 200, function (S) { return S.lessons >= 30; }],
    ["lall", "🏛️", "Completionist", "Complete every lesson.", 600, function (S) { return S.lessonTotal > 0 && S.lessons >= S.lessonTotal; }],
    ["part", "🗺️", "Part Cleared", "Complete every lesson in one part of the course.", 80, function (S) { return S.partsDone >= 1; }],
    ["outline", "🧭", "Off the Map", "Complete a lesson from the course-outline part (Part N).", 60, function (S) { return S.outlineDone >= 1; }],
    ["x1", "💻", "It Compiles!", "Pass a Code Gym exercise.", 40, function (S) { return S.ex >= 1; }],
    ["x10", "⌨️", "Code Monkey", "Pass 10 Code Gym exercises.", 120, function (S) { return S.ex >= 10; }],
    ["x40", "🏋️", "Gym Rat", "Pass 40 Code Gym exercises.", 300, function (S) { return S.ex >= 40; }],
    ["xall", "🦾", "Iron Coder", "Pass every Code Gym exercise.", 800, function (S) { return S.exTotal > 0 && S.ex >= S.exTotal; }],
    ["s3", "📅", "Habit Forming", "Study 3 days in a row.", 50, function (S) { return S.streak >= 3; }],
    ["s7", "🗓️", "Week Warrior", "Study 7 days in a row.", 150, function (S) { return S.streak >= 7; }],
    ["s14", "⚔️", "Fortnight Fighter", "Study 14 days in a row.", 300, function (S) { return S.streak >= 14; }],
    ["s30", "💎", "Unbreakable", "Study 30 days in a row.", 700, function (S) { return S.streak >= 30; }],
    ["lab3", "🔬", "Lab Coat", "Open 3 different labs.", 30, function (S) { return S.labs >= 3; }],
    ["laball", "🧪", "Lab Rat", "Open every lab.", 150, function (S) { return S.labTotal > 0 && S.labs >= S.labTotal; }],
    ["lp25", "🔮", "Predictor", "Make 25 correct predictions in the labs (Your turn mode).", 120, function (S) { return S.lp >= 25; }],
    ["c50", "🃏", "Card Shark", "Review 50 flashcards.", 80, function (S) { return S.c >= 50; }],
    ["w1", "✍️", "Pen Pal", "Finish a written-answer question.", 40, function (S) { return S.w >= 1; }],
    ["pz5", "🧩", "Puzzler", "Solve 5 code puzzles.", 60, function (S) { return S.pz >= 5; }],
    ["exam1", "📝", "Exam Ready", "Finish a mock exam.", 80, function (S) { return S.exams >= 1; }],
    ["exam90", "🏆", "Ace", "Score 90% or more on a mock exam.", 250, function (S) { return S.bestExam >= 0.9; }],
    ["arc1", "🕹️", "Insert Coin", "Play an Arcade game.", 30, function (S) { return S.arcPlays >= 1; }],
    ["arcall", "👾", "Arcade Regular", "Play every Arcade game.", 150, function (S) { return S.arcTotal > 0 && S.arcGames >= S.arcTotal; }],
    ["arc1k", "🚀", "High Scorer", "Score 1,000 points in one Arcade round.", 150, function (S) { return S.arcBest >= 1000; }],
    ["arc3k", "🛸", "Leaderboard Legend", "Score 3,000 points in one Arcade round.", 400, function (S) { return S.arcBest >= 3000; }],
    ["owl", "🦉", "Night Owl", "Answer a question between midnight and 4 a.m.", 30, function (S) { return S.owl; }],
    ["bird", "🐦", "Early Bird", "Answer a question between 5 and 7 a.m.", 30, function (S) { return S.bird; }],
    ["lv5", "⭐", "Rising Star", "Reach level 5.", 0, function (S) { return S.level >= 5; }],
    ["lv10", "🌠", "Double Digits", "Reach level 10.", 0, function (S) { return S.level >= 10; }],
    ["lv20", "🏅", "Elite", "Reach level 20.", 0, function (S) { return S.level >= 20; }],
    ["lv30", "🔱", "Mythic", "Reach level 30.", 0, function (S) { return S.level >= 30; }],
    ["theorist", "🧠", "Theorist", "Complete 3 deep-dive theory lessons.", 120, function (S) { return S.deep >= 3; }],
    ["q1", "🗺️", "Into the Unknown", "Finish your first Quest level.", 40, function (S) { return S.questLv >= 1; }],
    ["q10", "🧭", "Seasoned Explorer", "Finish 10 Quest levels.", 120, function (S) { return S.questLv >= 10; }],
    ["qw1", "🗝️", "Key Fragment", "Finish every level of a Quest chapter.", 150, function (S) { return S.questWorlds >= 1; }],
    ["q3s", "⭐", "Flawless Explorer", "Finish 10 Quest levels with 3 stars.", 200, function (S) { return S.quest3 >= 10; }],
    ["qrel", "🏺", "Relic Hunter", "Find 10 relics in the Quest.", 150, function (S) { return S.relics >= 10; }],
    ["qall", "🏆", "The Lost Index", "Finish every chapter of the Quest.", 1000, function (S) { return S.questWorldTotal > 0 && S.questWorlds >= S.questWorldTotal; }],
    ["professor", "🎓", "Professor", "Complete every deep-dive theory lesson.", 600, function (S) { return S.deepTotal > 0 && S.deep >= S.deepTotal; }],
    ["boss1", "⚔️", "Boss Slayer", "Defeat your first boss.", 100, function (S) { return S.bosses >= 1; }],
    ["boss5", "🛡️", "Raid Leader", "Defeat 5 different topic bosses.", 250, function (S) { return S.topicBosses >= 5; }],
    ["bossall", "🐉", "Dragon Hunter", "Defeat all 11 topic bosses.", 600, function (S) { return S.topicBosses >= 11; }],
    ["flawless", "💠", "Flawless Victory", "Defeat a boss without losing a heart.", 150, function (S) { return S.flawless; }],
    ["final", "🏛️", "Valedictorian", "Defeat the Final Exam boss.", 800, function (S) { return S.finalWon; }],
    ["cards10", "🃏", "Collector", "Collect 10 Algorithm Cards.", 120, function (S) { return S.cards >= 10; }],
    ["cardsall", "🗃️", "Full Deck", "Collect every Algorithm Card.", 600, function (S) { return S.cardTotal > 0 && S.cards >= S.cardTotal; }],
    ["foil1", "✨", "Shiny!", "Earn your first holographic card.", 80, function (S) { return S.foils >= 1; }],
    ["q1", "🎁", "Quest Complete", "Finish all three daily quests in one day.", 50, function (S) { return S.sets >= 1; }],
    ["q7", "🧰", "Questing Hero", "Finish all three daily quests on 7 different days.", 250, function (S) { return S.sets >= 7; }]
  ].map(function (a) { return { id: a[0], icon: a[1], t: a[2], d: a[3], xp: a[4], test: a[5] }; });
  G.ACH = ACH;

  // ---------------------------------------------------------------- daily quests (three a day, the same for the whole day)
  var QUESTS = [
    { id: "r10", k: "r", n: 10, xp: 60, icon: "🎯", t: "Answer 10 questions correctly" },
    { id: "r20", k: "r", n: 20, xp: 100, icon: "🎯", t: "Answer 20 questions correctly" },
    { id: "l1", k: "l", n: 1, xp: 60, icon: "📘", t: "Complete a lesson" },
    { id: "x1", k: "x", n: 1, xp: 80, icon: "💻", t: "Pass a Code Gym exercise" },
    { id: "c10", k: "c", n: 10, xp: 50, icon: "🃏", t: "Review 10 flashcards" },
    { id: "cb5", k: "cb", n: 5, xp: 60, icon: "🔥", t: "Get a 5-answer combo" },
    { id: "cb10", k: "cb", n: 10, xp: 110, icon: "🔥", t: "Get a 10-answer combo" },
    { id: "ap1", k: "ap", n: 1, xp: 40, icon: "🕹️", t: "Play a round in the Arcade" },
    { id: "ap3", k: "ap", n: 3, xp: 80, icon: "🕹️", t: "Play 3 rounds in the Arcade" },
    { id: "lp5", k: "lp", n: 5, xp: 70, icon: "🔬", t: "Make 5 correct predictions in a lab (Your turn)" },
    { id: "xp300", k: "xp", n: 300, xp: 80, icon: "⚡", t: "Earn 300 XP today" },
    { id: "pz2", k: "pz", n: 2, xp: 60, icon: "🧩", t: "Solve 2 code puzzles in lessons" },
    { id: "boss1", k: "boss", n: 1, xp: 120, icon: "⚔️", t: "Defeat a boss in Boss Battles" },
    { id: "dd1", k: "dd", n: 1, xp: 100, icon: "🧠", t: "Complete a deep-dive theory lesson" }
  ];
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function questsFor(day) {
    var r = rng(hashStr("quests:" + day)), pool = QUESTS.slice(), out = [], kinds = {};
    while (out.length < 3 && pool.length) {
      var q = pool.splice(Math.floor(r() * pool.length), 1)[0];
      if (kinds[q.k]) continue;
      kinds[q.k] = 1;
      out.push(q.id);
    }
    return out;
  }
  var questById = {};
  QUESTS.forEach(function (q) { questById[q.id] = q; });

  // ---------------------------------------------------------------- state
  function today() { return CL.Progress.day(); }
  function fresh() { return { v: 1, xp: 0, sound: true, tot: {}, best: {}, ach: {}, arc: {}, labs: {}, seenL: {}, seenW: {}, boss: {}, cards: {}, foils: {}, sets: 0, day: { d: today() }, qd: { d: "", done: {} }, u: Date.now() }; }
  function ensureDay() {
    var d = today();
    if (!g.day || g.day.d !== d) g.day = { d: d };
    if (!g.qd || g.qd.d !== d) g.qd = { d: d, list: questsFor(d), done: {}, chest: 0 };
  }
  function bump(k, n) { g.tot[k] = (g.tot[k] || 0) + (n || 1); g.day[k] = (g.day[k] || 0) + (n || 1); }
  var saveT = 0;
  function save() { g.u = Date.now(); clearTimeout(saveT); saveT = setTimeout(function () { if (CL.save) CL.save(); }, 350); }

  function stats() {
    var done = store.done || {}, lessons = 0, partsDone = 0, outlineDone = 0, lessonTotal = 0;
    var QS = CL.Quest ? CL.Quest.stats() : { levels: 0, worlds: 0, worldTotal: 0, three: 0, relics: 0 };
    D.parts.forEach(function (p) {
      var ids = p.lessons.filter(function (id) { return D.lessons[id]; }), n = ids.filter(function (id) { return done[id]; }).length;
      lessons += n;
      lessonTotal += ids.length;
      if (ids.length && n === ids.length) partsDone++;
      if (p.id === "n") outlineDone += n;
    });
    var ex = Object.keys(store.ex || {}).filter(function (k) { return store.ex[k] && store.ex[k].passed; }).length;
    var bestExam = 0;
    (store.exams || []).forEach(function (e) { if (e.max) bestExam = Math.max(bestExam, e.score / e.max); });
    var arcPlays = 0, arcBest = 0, arcGames = 0;
    Object.keys(g.arc || {}).forEach(function (k) { var a = g.arc[k]; arcPlays += a.plays || 0; arcBest = Math.max(arcBest, a.best || 0); if (a.plays) arcGames++; });
    var L = levelOf(g.xp), deep = 0, deepTotal = 0, bosses = 0, topicBosses = 0, flawless = false;
    Object.keys(D.lessons).forEach(function (id) { if (id.indexOf("-deep-") > 0) { deepTotal++; if (done[id]) deep++; } });
    Object.keys(g.boss || {}).forEach(function (k) { var b = g.boss[k]; if (b && b.wins) { bosses++; if (k !== "final") topicBosses++; if (b.flawless) flawless = true; } });
    return {
      deep: deep, deepTotal: deepTotal, bosses: bosses, topicBosses: topicBosses, flawless: flawless, finalWon: !!(g.boss && g.boss.final && g.boss.final.wins),
      cards: Object.keys(g.cards || {}).length, foils: Object.keys(g.foils || {}).length, cardTotal: (CL.Collection && CL.Collection.cards.length) || 0,
      q: g.tot.q || 0, r: g.tot.r || 0, c: g.tot.c || 0, w: g.tot.w || 0, lp: g.tot.lp || 0, pz: g.tot.pz || 0,
      bestCombo: g.best.combo || 0, lessons: lessons, lessonTotal: lessonTotal, partsDone: partsDone, outlineDone: outlineDone,
      ex: ex, exTotal: D.exercises.length, streak: CL.Progress.streak(), labs: Object.keys(g.labs || {}).length, labTotal: D.labs.length,
      exams: (store.exams || []).length, bestExam: bestExam, arcPlays: arcPlays, arcBest: arcBest, arcGames: arcGames, arcTotal: (CL.Arcade && CL.Arcade.count) || 0,
      owl: !!g.best.owl, bird: !!g.best.bird, level: L, sets: g.sets || 0, xp: g.xp,
      questLv: QS.levels, questWorlds: QS.worlds, questWorldTotal: QS.worldTotal, quest3: QS.three, relics: QS.relics
    };
  }
  G.stats = function () { return stats(); };

  // ---------------------------------------------------------------- XP and levelling up
  var pendingLevel = 0;
  function award(xp, label, o) {
    o = o || {};
    if (!g || !xp) return;
    ensureDay();
    var before = levelOf(g.xp);
    g.xp += Math.round(xp);
    g.day.xp = (g.day.xp || 0) + Math.round(xp);
    var hist = g.hist = g.hist || {}, dkey = today();
    hist[dkey] = (hist[dkey] || 0) + Math.round(xp);
    var hk = Object.keys(hist).sort();
    if (hk.length > 60) hk.slice(0, hk.length - 60).forEach(function (k) { delete hist[k]; });
    var after = levelOf(g.xp);
    if (!o.silent && label !== null) FX.float('<b>+' + Math.round(xp) + "</b> XP" + (label ? "<span>" + esc(label) + "</span>" : ""), "xp" + (o.big ? " big" : "") + (o.cls ? " " + o.cls : ""), o.x, o.y);
    refreshHud(true);
    if (after > before && !o.noLevel) { pendingLevel = Math.max(pendingLevel, after); setTimeout(levelUp, 650); }
    if (!o.noQuest) checkQuests();
    if (!o.noAch) checkAch();
    save();
  }
  G.award = award;
  function levelUp() {
    if (!pendingLevel) return;
    var L = pendingLevel;
    pendingLevel = 0;
    var r = rankOf(L), rankNew = r[0] === L || (rankOf(L - 1)[1] !== r[1]);
    FX.sfx("level");
    FX.celebrate(true);
    FX.overlay('<div class="lu-k">Level up</div><div class="lu-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="lu-bg"/><circle cx="60" cy="60" r="52" class="lu-fg"/></svg><b>' + L + "</b></div>" +
      (rankNew ? '<div class="lu-rank">New rank: <b>' + esc(r[1]) + '</b></div><div class="lu-sub">' + esc(r[2]) + "</div>" : '<div class="lu-rank">' + esc(r[1]) + '</div><div class="lu-sub">' + (xpFor(L + 1) - g.xp).toLocaleString() + " XP to level " + (L + 1) + "</div>"),
      { cls: "levelup", label: "Level " + L, button: "Let's go", ms: 6500 });
  }

  // ---------------------------------------------------------------- answers: combos and XP
  var combo = 0, pendingQ = false, inLab = false, quiet = false;
  // quiet: answers still count (flat XP, no combo, no sound or pop-ups), for marking a whole paper at once
  // and for the diagnostic test, which must not reveal whether each answer was right
  G.quiet = function (on) { quiet = !!on; };
  function answered(ok) {
    ensureDay();
    bump("q");
    if (quiet) { if (ok) bump("r"); award(ok ? 10 : 2, null, { silent: true, noLevel: true }); return; }
    var hr = new Date().getHours();
    if (hr < 4) g.best.owl = 1;
    if (hr >= 5 && hr < 7) g.best.bird = 1;
    if (ok) {
      combo++;
      bump("r");
      if (inLab) bump("lp");
      if (combo > (g.best.combo || 0)) g.best.combo = combo;
      if (combo > (g.day.cb || 0)) g.day.cb = combo;
      var m = mult(combo), xp = Math.round(10 * m);
      FX.sfx("right", combo);
      award(xp, combo >= 2 ? "combo " + combo : "", { cls: m > 1 ? "hot" : "" });
      if (combo === 5 || combo === 10 || combo === 20 || combo === 30 || (combo > 30 && combo % 10 === 0)) {
        var pt = FX.point();
        FX.float("🔥 " + combo + " in a row <span>×" + mult(combo) + " XP</span>", "combo", window.innerWidth / 2, Math.max(120, window.innerHeight * 0.32));
        FX.burst(pt.x, pt.y, 26 + Math.min(combo, 40), { power: 6 });
      }
    } else {
      if (combo >= 5) FX.float("Combo of " + combo + " ended", "lost", undefined, undefined);
      combo = 0;
      FX.sfx("wrong");
      award(2, null, { silent: true });
    }
    comboPill();
  }
  function onLog(kind) {
    if (!g) return;
    if (kind === "q") {
      if (pendingQ) answered(false);
      pendingQ = true;
      Promise.resolve().then(function () { if (pendingQ) { pendingQ = false; answered(false); } });
    } else if (kind === "r") {
      pendingQ = false;
      answered(true);
    } else if (kind === "l") {
      var lid = (location.hash || "").indexOf("#l-") === 0 ? location.hash.slice(3) : "";
      if (lid && g.seenL[lid]) return;
      if (lid) g.seenL[lid] = 1;
      bump("l");
      if (lid.indexOf("-deep-") > 0) bump("dd");
      FX.sfx("chest");
      var p = FX.point();
      FX.burst(p.x, p.y, 60, { power: 8 });
      award(50, "lesson complete", { big: true });
    } else if (kind === "x") {
      bump("x");
      FX.sfx("chest");
      FX.celebrate(false);
      award(80, "exercise passed", { big: true });
    } else if (kind === "c") {
      bump("c");
      award(3, "", { cls: "small" });
    } else if (kind === "w") {
      var wid = (location.hash || "").indexOf("#written-") === 0 ? location.hash.slice(9) : "";
      bump("w");
      if (wid && g.seenW[wid]) { save(); return; }
      if (wid) g.seenW[wid] = 1;
      award(30, "written answer", {});
    }
  }
  // other events from the app: puzzles solved, mock exams finished
  G.event = function (kind, info) {
    if (!g) return;
    ensureDay();
    if (kind === "pz") { bump("pz"); FX.sfx("pop", 3); award(15, "puzzle solved"); }
    else if (kind === "exam") {
      var pct = info && info.max ? info.score / info.max : 0;
      FX.celebrate(pct >= 0.7);
      award(100 + Math.round(150 * pct), "mock exam", { big: true });
    }
  };

  // ---------------------------------------------------------------- achievements
  var achQueue = [], achBusy = false;
  function checkAch(silent) {
    if (CL.Collection) { try { CL.Collection.check(silent); } catch (e) { /* cards are optional */ } }
    var S = stats(), any = false;
    ACH.forEach(function (a) {
      if (g.ach[a.id]) return;
      var ok = false;
      try { ok = !!a.test(S); } catch (e) { ok = false; }
      if (!ok) return;
      g.ach[a.id] = Date.now();
      any = true;
      if (silent) { g.xp += a.xp; return; }
      achQueue.push(a);
    });
    if (any) save();
    if (!achBusy && achQueue.length) showAch();
  }
  function showAch() {
    var a = achQueue.shift();
    if (!a) { achBusy = false; return; }
    achBusy = true;
    FX.sfx("ach");
    FX.toast('<div class="ach-badge">' + a.icon + '</div><div><div class="fx-k">Achievement unlocked</div><b>' + esc(a.t) + "</b><div class=\"fx-d\">" + esc(a.d) + "</div>" + (a.xp ? '<div class="fx-xp">+' + a.xp + " XP</div>" : "") + "</div>", "ach", 5200);
    if (a.xp) award(a.xp, null, { silent: true, noAch: true });
    setTimeout(showAch, 1100);
  }
  G.checkAch = checkAch;

  // ---------------------------------------------------------------- quests
  function questProgress(id) {
    var q = questById[id];
    if (!q) return { q: { t: id, n: 1, xp: 0, icon: "?" }, have: 0, done: false };
    var have = Math.min(q.n, g.day[q.k] || 0);
    return { q: q, have: have, done: !!g.qd.done[id] };
  }
  function checkQuests() {
    ensureDay();
    var changed = false;
    g.qd.list.forEach(function (id) {
      var p = questProgress(id);
      if (!p.done && p.have >= p.q.n) {
        g.qd.done[id] = 1;
        changed = true;
        FX.sfx("ach");
        FX.toast('<div class="ach-badge q">' + p.q.icon + '</div><div><div class="fx-k">Daily quest complete</div><b>' + esc(p.q.t) + '</b><div class="fx-xp">+' + p.q.xp + " XP</div></div>", "quest", 4200);
        award(p.q.xp, null, { silent: true, noQuest: true });
      }
    });
    if (!g.qd.chest && g.qd.list.every(function (id) { return g.qd.done[id]; })) {
      g.qd.chest = 1;
      g.sets = (g.sets || 0) + 1;
      changed = true;
      setTimeout(function () {
        FX.sfx("chest");
        FX.celebrate(true);
        FX.overlay('<div class="chest" aria-hidden="true">🎁</div><div class="lu-k">All daily quests done</div><div class="lu-rank">Bonus: <b>+150 XP</b></div><div class="lu-sub">New quests appear at midnight. Come back tomorrow to keep your streak alive.</div>', { cls: "chest-ov", label: "Daily chest", button: "Collect" });
        award(150, null, { silent: true, noQuest: true });
      }, 900);
    }
    if (changed) { save(); refreshQuestViews(); }
  }
  G.quests = function () { ensureDay(); return g.qd.list.map(questProgress); };
  function questListHtml() {
    return '<ul class="quests">' + G.quests().map(function (p) {
      var pct = Math.round(100 * p.have / p.q.n);
      return '<li class="' + (p.done ? "done" : "") + '"><span class="q-ic" aria-hidden="true">' + p.q.icon + '</span><div class="q-b"><div class="q-t">' + esc(p.q.t) + '</div><div class="q-bar"><i style="width:' + pct + '%"></i></div></div><span class="q-n">' + (p.done ? "✓" : p.have + "/" + p.q.n) + '</span><span class="q-x">+' + p.q.xp + "</span></li>";
    }).join("") + "</ul>";
  }
  G.questListHtml = questListHtml;
  function refreshQuestViews() {
    document.querySelectorAll("[data-quests]").forEach(function (el) { el.innerHTML = questListHtml(); });
  }

  // ---------------------------------------------------------------- arcade results
  G.arcadeResult = function (id, score, title, xpMult) {
    ensureDay();
    var a = g.arc[id] = g.arc[id] || { best: 0, plays: 0 };
    var prev = a.best || 0, isBest = score > prev;
    a.plays++;
    a.last = score;
    a.t = Date.now();
    if (isBest) a.best = score;
    bump("ap");
    CL.Progress.log("a");
    var xp = Math.round(Math.min(300, Math.max(5, Math.round(score / 15))) * (xpMult || 1));
    award(xp, (title || "Arcade") + (isBest ? " · new best" : ""), { big: isBest, x: window.innerWidth / 2, y: window.innerHeight * 0.3 });
    return { best: isBest, prev: prev, xp: xp };
  };
  // ---------------------------------------------------------------- boss battles
  G.bossResult = function (id, r) {
    ensureDay();
    var b = g.boss[id] = g.boss[id] || { wins: 0, tries: 0 };
    b.tries++;
    b.t = Date.now();
    if (!r.won) { save(); return { xp: 0, first: false, cards: [] }; }
    var first = !b.wins;
    b.wins++;
    if (!b.best || r.ms < b.best) b.best = r.ms;
    if (r.flawless) b.flawless = 1;
    bump("boss");
    var before = CL.Collection ? CL.Collection.check(true) : [];
    var xp = (id === "final" ? 600 : 200) + 50 * (r.hearts || 0) + (r.flawless ? 100 : 0) + (first ? 100 : 0);
    award(xp, null, { silent: true });
    checkAch();
    return { xp: xp, first: first, cards: before };
  };
  G.arcadeBest = function (id) { return (g && g.arc[id] && g.arc[id].best) || 0; };
  G.arcadePlays = function (id) { return (g && g.arc[id] && g.arc[id].plays) || 0; };

  // ---------------------------------------------------------------- HUD in the top bar
  var hud = null, sndBtn = null, pill = null;
  // the streak flame, as pixel art
  var FLAME = '<svg viewBox="0 0 8 10" width="16" height="18" shape-rendering="crispEdges" aria-hidden="true"><rect x="3" y="0" width="1" height="1" fill="#ff8a1c"/><rect x="3" y="1" width="1" height="1" fill="#ff8a1c"/><rect x="4" y="1" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="2" width="1" height="1" fill="#ff8a1c"/><rect x="3" y="2" width="1" height="1" fill="#ff8a1c"/><rect x="4" y="2" width="1" height="1" fill="#ff8a1c"/><rect x="6" y="2" width="1" height="1" fill="#ff8a1c"/><rect x="1" y="3" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="3" width="1" height="1" fill="#ff8a1c"/><rect x="3" y="3" width="1" height="1" fill="#ff8a1c"/><rect x="4" y="3" width="1" height="1" fill="#ff8a1c"/><rect x="5" y="3" width="1" height="1" fill="#ff8a1c"/><rect x="1" y="4" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="4" width="1" height="1" fill="#ff8a1c"/><rect x="3" y="4" width="1" height="1" fill="#ffd23f"/><rect x="4" y="4" width="1" height="1" fill="#ff8a1c"/><rect x="5" y="4" width="1" height="1" fill="#ff8a1c"/><rect x="6" y="4" width="1" height="1" fill="#ff8a1c"/><rect x="0" y="5" width="1" height="1" fill="#ff8a1c"/><rect x="1" y="5" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="5" width="1" height="1" fill="#ff8a1c"/><rect x="3" y="5" width="1" height="1" fill="#ffd23f"/><rect x="4" y="5" width="1" height="1" fill="#ffd23f"/><rect x="5" y="5" width="1" height="1" fill="#ff8a1c"/><rect x="6" y="5" width="1" height="1" fill="#ff8a1c"/><rect x="7" y="5" width="1" height="1" fill="#ff8a1c"/><rect x="0" y="6" width="1" height="1" fill="#ff8a1c"/><rect x="1" y="6" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="6" width="1" height="1" fill="#ffd23f"/><rect x="3" y="6" width="1" height="1" fill="#ffd23f"/><rect x="4" y="6" width="1" height="1" fill="#ffd23f"/><rect x="5" y="6" width="1" height="1" fill="#ffd23f"/><rect x="6" y="6" width="1" height="1" fill="#ff8a1c"/><rect x="7" y="6" width="1" height="1" fill="#ff8a1c"/><rect x="0" y="7" width="1" height="1" fill="#ff8a1c"/><rect x="1" y="7" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="7" width="1" height="1" fill="#ffd23f"/><rect x="3" y="7" width="1" height="1" fill="#ffd23f"/><rect x="4" y="7" width="1" height="1" fill="#ffd23f"/><rect x="5" y="7" width="1" height="1" fill="#ffd23f"/><rect x="6" y="7" width="1" height="1" fill="#ff8a1c"/><rect x="7" y="7" width="1" height="1" fill="#ff8a1c"/><rect x="1" y="8" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="8" width="1" height="1" fill="#ffd23f"/><rect x="3" y="8" width="1" height="1" fill="#ffd23f"/><rect x="4" y="8" width="1" height="1" fill="#ffd23f"/><rect x="5" y="8" width="1" height="1" fill="#ffd23f"/><rect x="6" y="8" width="1" height="1" fill="#ff8a1c"/><rect x="2" y="9" width="1" height="1" fill="#ff8a1c"/><rect x="3" y="9" width="1" height="1" fill="#ff8a1c"/><rect x="4" y="9" width="1" height="1" fill="#ff8a1c"/><rect x="5" y="9" width="1" height="1" fill="#ff8a1c"/></svg>';
  var SND_ON = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  var SND_OFF = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 9h4l5-4v14l-5-4H4z"/><path d="m16.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  G.mountHud = function (bar) {
    hud = document.createElement("a");
    hud.className = "hud";
    hud.href = "#trophies";
    hud.innerHTML = '<span class="hud-streak">' + FLAME + '<b>0</b></span><span class="hud-lvl"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" class="r-bg"/><circle cx="20" cy="20" r="16" class="r-fg"/></svg><b>1</b></span><span class="hud-xp"><b>0</b><i>XP</i></span>';
    sndBtn = document.createElement("button");
    sndBtn.type = "button";
    sndBtn.className = "srch-btn hud-snd";
    sndBtn.addEventListener("click", function () {
      g.sound = g.sound === false;
      save();
      paintSound();
      if (g.sound) FX.sfx("right", 3);
    });
    var srch = bar.querySelector(".srch-btn");
    bar.insertBefore(hud, srch);
    bar.insertBefore(sndBtn, srch);
    pill = document.createElement("div");
    pill.className = "combo-pill";
    pill.setAttribute("aria-live", "polite");
    pill.hidden = true;
    document.body.appendChild(pill);
    paintSound();
    refreshHud(false);
  };
  function paintSound() {
    if (!sndBtn) return;
    var on = g.sound !== false;
    sndBtn.innerHTML = on ? SND_ON : SND_OFF;
    sndBtn.setAttribute("aria-label", on ? "Sound effects on (press to mute)" : "Sound effects off (press to turn on)");
    sndBtn.title = on ? "Sound on" : "Sound off";
    sndBtn.classList.toggle("off", !on);
  }
  function refreshHud(anim) {
    if (!hud || !g) return;
    var L = levelOf(g.xp), lo = xpFor(L), hi = xpFor(L + 1), k = (g.xp - lo) / (hi - lo), C = 2 * Math.PI * 16, st = CL.Progress.streak();
    var fg = hud.querySelector(".r-fg");
    fg.style.strokeDasharray = C.toFixed(1);
    fg.style.strokeDashoffset = (C * (1 - k)).toFixed(1);
    var lb = hud.querySelector(".hud-lvl b"), xb = hud.querySelector(".hud-xp b"), sb = hud.querySelector(".hud-streak b");
    if (lb.textContent !== String(L)) lb.textContent = L;
    var oldXp = parseInt(xb.textContent.replace(/[^0-9]/g, ""), 10) || 0;
    if (anim && oldXp !== g.xp) FX.countUp(xb, oldXp, g.xp, 600); else xb.textContent = g.xp.toLocaleString();
    sb.textContent = st;
    var lit = CL.Progress.dayActive(today());
    hud.querySelector(".hud-streak").classList.toggle("lit", lit);
    hud.setAttribute("aria-label", "Level " + L + " (" + rankOf(L)[1] + "), " + g.xp + " XP, " + (hi - g.xp) + " XP to the next level. Study streak " + st + " day" + (st === 1 ? "" : "s") + (lit ? "" : " (study today to keep it)") + ". Open the Trophy Room.");
    hud.title = rankOf(L)[1] + " · " + (hi - g.xp).toLocaleString() + " XP to level " + (L + 1);
    if (anim) { hud.classList.remove("pulse"); void hud.offsetWidth; hud.classList.add("pulse"); }
  }
  G.refreshHud = refreshHud;
  function comboPill() {
    if (!pill) return;
    if (combo < 2) { if (!pill.hidden) { pill.classList.add("out"); setTimeout(function () { if (combo < 2) { pill.hidden = true; pill.classList.remove("out"); } }, 380); } return; }
    pill.hidden = false;
    pill.classList.remove("out");
    var m = mult(combo), next = combo < 5 ? 5 : combo < 10 ? 10 : combo < 20 ? 20 : combo < 30 ? 30 : 0;
    pill.className = "combo-pill" + (m >= 2 ? " hot" : "") + (m >= 3 ? " blaze" : "");
    pill.innerHTML = '<span class="cp-f" aria-hidden="true">🔥</span><b>' + combo + '</b><span class="cp-t">in a row</span><span class="cp-m">×' + m + " XP</span>" + (next ? '<span class="cp-n">' + (next - combo) + " to ×" + mult(next) + "</span>" : "");
    pill.classList.remove("bump"); void pill.offsetWidth; pill.classList.add("bump");
  }

  // ---------------------------------------------------------------- the player card on the home page
  // ---------------------------------------------------------------- pixel icons: a grid of letters, one colour per letter
  function pix(rows, pal, size) {
    var w = rows[0].length, hgt = rows.length, out = "";
    rows.forEach(function (row, y) {
      for (var x = 0; x < w;) {
        var c = row.charAt(x), n = 1;
        while (x + n < w && row.charAt(x + n) === c) n++;
        if (pal[c]) out += '<rect x="' + x + '" y="' + y + '" width="' + n + '" height="1" fill="' + pal[c] + '"/>';
        x += n;
      }
    });
    var px = size || 22;
    return '<svg class="px-ic" viewBox="0 0 ' + w + " " + hgt + '" width="' + px + '" height="' + Math.round(px * hgt / w) + '" shape-rendering="crispEdges" aria-hidden="true">' + out + "</svg>";
  }
  G.pix = pix;
  var IC = G.ICONS = {
    flame: pix(["...o....", "...oo...", "..ooo.o.", ".ooooo..", ".ooyooo.", "oooyyooo", "ooyyyyoo", "ooyyyyoo", ".oyyyyo.", "..oooo.."], { o: "#ff8a1c", y: "#ffd23f" }),
    bolt: pix(["....yyy.", "...yyy..", "..yyy...", ".yyyyyy.", "...yyy..", "..yyy...", ".yyy....", ".yy....."], { y: "#ffd23f" }),
    book: pix([".bbbbbbb.", "bwwwbwwwb", "bwddbwddb", "bwwwbwwwb", "bwddbwddb", "bwwwbwwwb", "bbbbbbbbb", ".BBBBBBB."], { b: "#3d7bf2", B: "#1f4fb0", w: "#f1f2fb", d: "#9aa0c0" }),
    term: pix(["lllllllll", "lkkkkkkkl", "lkgkkkkkl", "lkkgkkkkl", "lkgkkkkkl", "lkkkkgggl", "lkkkkkkkl", "lllllllll"], { l: "#8b91b6", k: "#0c0f20", g: "#5fd38d" }),
    gem: pix(["..ttttt..", ".tTTtTTt.", "tTTtttTTt", ".tTTtTTt.", "..tTTTt..", "...tTt...", "....t...."], { t: "#2fb3a6", T: "#a6f0e8" }),
    medal: pix([".rr...rr.", "..rr.rr..", "...rrr...", "..yyyyy..", ".yyYYYyy.", ".yYYyYYy.", ".yyYYYyy.", "..yyyyy.."], { r: "#ff6b6b", y: "#e0a91c", Y: "#ffd23f" }),
    star: pix(["....y....", "...yyy...", "yyyyyyyyy", ".yyyyyyy.", "..yyyyy..", ".yyy.yyy.", "yy.....yy"], { y: "#ffd23f" }),
    sword: pix([".......ww", "......ww.", ".....ww..", "y...ww...", ".y.ww....", "..yw.....", ".bby.....", "bb..y...."], { w: "#e4e6f6", y: "#e0a91c", b: "#8a5a32" })
  };

  // ---------------------------------------------------------------- the home dashboard's side panel: you, your level, your numbers, today's quests
  G.dashCard = function (o) {
    ensureDay();
    o = o || {};
    var S = stats(), L = levelOf(g.xp), lo = xpFor(L), hi = xpFor(L + 1), pct = Math.round(100 * (g.xp - lo) / (hi - lo)), r = rankOf(L), streak = CL.Progress.streak();
    var QS = CL.Quest ? CL.Quest.stats() : null;
    var tiles = [[IC.flame, streak, streak === 1 ? "day streak" : "day streak"], [IC.bolt, g.xp.toLocaleString(), "total XP"], [IC.book, S.lessons + "/" + S.lessonTotal, "lessons"],
      [IC.term, S.ex + "/" + S.exTotal, "exercises"], [IC.gem, QS ? QS.relics : 0, "relics"], [IC.medal, Object.keys(g.ach).length + "/" + ACH.length, "achievements"]];
    var el = document.createElement("section");
    el.className = "hm-card hm-me";
    el.innerHTML = '<div class="hm-me-top"><a class="hm-av" href="#quest" aria-label="Your explorer">' + (o.avatar || "") + '</a><div class="hm-me-id"><b>' + esc(o.name || "Explorer") + '</b><span>Level ' + L + " · " + esc(r[1]) + "</span></div></div>" +
      '<div class="hm-xp"><div class="xpbar"><i style="width:' + pct + '%"></i></div><span>' + (g.xp - lo).toLocaleString() + " / " + (hi - lo).toLocaleString() + " XP to level " + (L + 1) + "</span></div>" +
      '<div class="hm-stats">' + tiles.map(function (t) { return '<div class="hm-stat">' + t[0] + "<b>" + t[1] + "</b><span>" + t[2] + "</span></div>"; }).join("") + "</div>" +
      '<a class="btn small hm-trophy" href="#trophies">' + IC.star + " Trophy Room</a>";
    var q = document.createElement("section");
    q.className = "hm-card hm-quests";
    q.innerHTML = '<h2 class="hm-h2">Today\'s quests</h2><p class="hm-sub">Reset at midnight. Finish them for bonus XP.</p><div data-quests>' + questListHtml() + "</div>";
    return [el, q];
  };


  // ---------------------------------------------------------------- XP over the last 14 days (a column chart with hover, focus and a table)
  function lastDays(n) {
    var out = [], d = new Date();
    d.setHours(12, 0, 0, 0);
    for (var k = n - 1; k >= 0; k--) {
      var t = new Date(d.getTime() - k * 86400000), key = CL.Progress.day(t);
      out.push({ key: key, date: t, xp: (g.hist && g.hist[key]) || 0 });
    }
    return out;
  }
  function niceMax(v) { var steps = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000]; for (var i = 0; i < steps.length; i++) if (v <= steps[i]) return steps[i]; return Math.ceil(v / 5000) * 5000; }
  function chartSvg(days, W) {
    var H = 190, L = 44, R = 8, T = 22, B = 30, maxV = niceMax(Math.max(50, Math.max.apply(null, days.map(function (x) { return x.xp; })))), band = (W - L - R) / days.length, bw = Math.min(24, band - 6);
    var y = function (v) { return T + (H - T - B) * (1 - v / maxV); };
    var s = '<svg class="xp-chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="XP earned on each of the last 14 days">';
    [0, 0.5, 1].forEach(function (f) { var v = Math.round(maxV * f), yy = y(v); s += '<line class="xc-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + yy + '" y2="' + yy + '"/><text class="xc-tick" x="' + (L - 8) + '" y="' + (yy + 4) + '">' + v.toLocaleString() + "</text>"; });
    days.forEach(function (x, i) {
      var cx = L + band * i + band / 2, top = y(x.xp), h = H - B - top, isToday = i === days.length - 1;
      var label = x.date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
      s += '<g class="xc-col" tabindex="0" data-v="' + x.xp + '" data-d="' + esc(label) + '" aria-label="' + esc(label) + ": " + x.xp + ' XP"><rect class="xc-hit" x="' + (cx - band / 2) + '" y="' + T + '" width="' + band + '" height="' + (H - T - B) + '"/>';
      if (x.xp > 0) {
        var r = Math.min(4, h, bw / 2);
        s += '<path class="xc-bar" d="M' + (cx - bw / 2) + " " + (H - B) + " V" + (top + r) + " Q" + (cx - bw / 2) + " " + top + " " + (cx - bw / 2 + r) + " " + top + " H" + (cx + bw / 2 - r) + " Q" + (cx + bw / 2) + " " + top + " " + (cx + bw / 2) + " " + (top + r) + " V" + (H - B) + ' Z"/>';
      }
      if (isToday) s += '<text class="xc-val" x="' + cx + '" y="' + (top - 6) + '">' + x.xp.toLocaleString() + "</text>";
      s += '<text class="xc-day' + (isToday ? " today" : "") + '" x="' + cx + '" y="' + (H - 10) + '">' + (isToday && band >= 40 ? "Today" : esc(x.date.toLocaleDateString([], { weekday: "narrow" }))) + "</text></g>";
    });
    return s + '<line class="xc-base" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/></svg>';
  }
  function xpChart() {
    var days = lastDays(14), s = chartSvg(days, 640);
    var week = days.slice(7).reduce(function (a, x) { return a + x.xp; }, 0), prev = days.slice(0, 7).reduce(function (a, x) { return a + x.xp; }, 0);
    var diff = week - prev;
    return '<section class="tr-box xc-box"><div class="xc-head"><div><h2>XP over the last 14 days</h2><div class="muted small">Last 7 days: <b class="xc-ink">' + week.toLocaleString() + " XP</b> · the 7 days before: " + prev.toLocaleString() + " XP" +
      (week || prev ? " · " + (diff >= 0 ? "▲ " + diff.toLocaleString() + " more" : "▼ " + (-diff).toLocaleString() + " fewer") + " than the week before" : "") + '</div></div></div><div class="xc-wrap">' + s + '<div class="xc-tip" hidden></div></div>' +
      '<details class="xc-table"><summary>Show the numbers</summary><table><tr><th>Day</th><th>XP</th></tr>' + days.map(function (x) { return "<tr><td>" + esc(x.date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })) + "</td><td>" + x.xp.toLocaleString() + "</td></tr>"; }).join("") + "</table></details></section>";
  }
  function wireChart(root) {
    var wrap = root.querySelector(".xc-wrap");
    if (!wrap) return;
    // draw at the real width, so the text stays the size of the page's text
    var w = Math.round(wrap.clientWidth);
    if (w > 200) { var old = wrap.querySelector(".xp-chart"), tmp = document.createElement("div"); tmp.innerHTML = chartSvg(lastDays(14), w); old.parentNode.replaceChild(tmp.firstChild, old); }
    var tip = wrap.querySelector(".xc-tip");
    function show(col) {
      var r = col.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      tip.textContent = "";
      var v = document.createElement("b"); v.textContent = (+col.getAttribute("data-v")).toLocaleString() + " XP";
      var d = document.createElement("span"); d.textContent = col.getAttribute("data-d");
      tip.appendChild(v); tip.appendChild(d);
      tip.hidden = false;
      tip.style.left = Math.max(0, Math.min(wr.width - 120, r.left - wr.left + r.width / 2 - 60)) + "px";
      tip.style.top = Math.max(0, r.top - wr.top - 6) + "px";
      wrap.querySelectorAll(".xc-col.on").forEach(function (c) { c.classList.remove("on"); });
      col.classList.add("on");
    }
    function hide() { tip.hidden = true; wrap.querySelectorAll(".xc-col.on").forEach(function (c) { c.classList.remove("on"); }); }
    wrap.addEventListener("pointerover", function (e) { var c = e.target.closest(".xc-col"); if (c) show(c); });
    wrap.addEventListener("pointerleave", hide);
    wrap.addEventListener("focusin", function (e) { var c = e.target.closest(".xc-col"); if (c) show(c); });
    wrap.addEventListener("focusout", hide);
  }

  // ---------------------------------------------------------------- the Trophy Room
  function trophies(ui) {
    ensureDay();
    var p = ui.page("trophy-page");
    ui.setTutor("progress", "Trophy Room", function () { var S = stats(); return "Game stats: level " + S.level + ", " + S.xp + " XP, best combo " + S.bestCombo + ", " + Object.keys(g.ach).length + " achievements. " + ui.progressText(); });
    var S = stats(), L = S.level, lo = xpFor(L), hi = xpFor(L + 1), pct = Math.round(100 * (g.xp - lo) / (hi - lo)), r = rankOf(L);
    var got = ACH.filter(function (a) { return g.ach[a.id]; }).length;
    var html = '<div class="eyebrow">Progress</div><h1 class="title">Trophy Room</h1>' +
      '<section class="tr-hero"><div class="tr-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="lu-bg"/><circle cx="60" cy="60" r="52" class="lu-fg" style="stroke-dasharray:326.7;stroke-dashoffset:' + (326.7 * (1 - pct / 100)).toFixed(1) + '"/></svg><b>' + L + '</b><span>level</span></div>' +
      '<div class="tr-who"><div class="pl-k">Rank</div><div class="tr-rank">' + esc(r[1]) + '</div><div class="muted">' + esc(r[2]) + '</div><div class="pl-xp"><div class="xpbar"><i style="width:' + pct + '%"></i></div><span><b class="tr-xp">' + g.xp.toLocaleString() + "</b> XP · " + (hi - g.xp).toLocaleString() + " more to level " + (L + 1) + "</span></div></div></section>" +
      '<div class="tr-stats">' + [["🎯", S.r.toLocaleString(), "correct answers"], ["🔥", S.bestCombo, "best combo"], ["📘", S.lessons + "/" + S.lessonTotal, "lessons"], ["💻", S.ex + "/" + S.exTotal, "exercises passed"],
        ["📅", S.streak, "day streak"], ["🔬", S.lp, "lab predictions right"], ["🕹️", S.arcPlays, "arcade rounds"], ["🎁", S.sets, "quest sets done"]].map(function (x) {
        return '<div class="tr-stat"><span aria-hidden="true">' + x[0] + "</span><b>" + x[1] + "</b><i>" + x[2] + "</i></div>";
      }).join("") + "</div>" +
      xpChart() +
      '<div class="tr-cols"><section class="tr-box"><h2>Today\'s quests</h2><div data-quests>' + questListHtml() + '</div><p class="muted small">Finish all three for a <b>+150 XP</b> chest. Quests change every day at midnight.</p></section>' +
      '<section class="tr-box"><h2>How to earn XP</h2><ul class="tr-how"><li><b>+10</b> each correct answer, anywhere on the site</li><li><b>×1.5 → ×4</b> combo multiplier for answers in a row (5, 10, 20, 30)</li><li><b>+50</b> each lesson completed · <b>+80</b> each exercise passed</li><li><b>+100 to +250</b> each mock exam · <b>+30</b> each written answer</li><li><b>+15</b> each code puzzle · <b>+3</b> each flashcard</li><li><b>Arcade</b> rounds pay XP for points scored · <b>+200 to +800</b> each boss defeated</li><li><b>Achievements</b> and <b>daily quests</b> pay bonus XP</li></ul></section></div>' +
      '<div class="sec-h"><h2>Achievements</h2><span class="muted small">' + got + " of " + ACH.length + " unlocked</span></div>" +
      '<div class="ach-grid">' + ACH.map(function (a) {
        var t = g.ach[a.id];
        return '<div class="ach' + (t ? " got" : "") + '" title="' + esc(a.d) + '"><div class="ach-badge">' + (t ? a.icon : "🔒") + '</div><b>' + esc(a.t) + "</b><span>" + esc(a.d) + "</span>" + (a.xp ? "<i>+" + a.xp + " XP</i>" : "") + (t ? '<em>' + new Date(t).toLocaleDateString([], { day: "numeric", month: "short" }) + "</em>" : "") + "</div>";
      }).join("") + "</div>" +
      '<div class="sec-h"><h2>Rank ladder</h2><span class="muted small">Ranks unlock as you level up</span></div><ol class="ladder">' + RANKS.map(function (x) {
        var state = L >= x[0] ? (rankOf(L)[0] === x[0] ? "now" : "past") : "";
        return '<li class="' + state + '"><span class="ld-l">Lv ' + x[0] + '</span><b>' + esc(x[1]) + "</b><span class=\"muted\">" + esc(x[2]) + "</span></li>";
      }).join("") + "</ol>" +
      '<div class="tr-links btns"><a class="btn" href="#boss">⚔️ Boss Battles · ' + S.topicBosses + "/11 defeated</a><a class=\"btn\" href=\"#collection\">🃏 Algorithm Cards · " + S.cards + "/" + S.cardTotal + "</a></div>" +
      (CL.Arcade ? '<div class="sec-h"><h2>Arcade high scores</h2><a class="btn small" href="#arcade">Play</a></div><div class="tr-arc">' + CL.Arcade.games.map(function (gm) {
        var a = g.arc[gm.id] || {};
        return '<a class="tr-arcg" href="#arcade-' + gm.id + '"><span aria-hidden="true">' + gm.icon + "</span><b>" + esc(gm.title) + "</b><i>" + (a.best ? a.best.toLocaleString() + " pts" : "not played") + "</i></a>";
      }).join("") + "</div>" : "");
    p.innerHTML = html;
    wireChart(p);
    var xb = p.querySelector(".tr-xp");
    FX.countUp(xb, Math.max(0, g.xp - 200), g.xp, 900);
  }

  // ---------------------------------------------------------------- start up
  G.init = function (s) {
    store = s;
    D = window.CODELAB_DATA;
    var first = !store.g;
    store.g = store.g || fresh();
    g = store.g;
    ["tot", "best", "ach", "arc", "labs", "seenL", "seenW", "boss", "cards", "foils"].forEach(function (k) { g[k] = g[k] || {}; });
    if (typeof g.xp !== "number") g.xp = 0;
    ensureDay();
    // credit progress made before the game layer existed, once
    if (first) {
      var S0 = 0;
      Object.keys(store.done || {}).forEach(function (k) { if (store.done[k]) { g.seenL[k] = 1; S0 += 50; } });
      Object.keys(store.ex || {}).forEach(function (k) { if (store.ex[k] && store.ex[k].passed) S0 += 80; });
      Object.keys(store.quiz || {}).forEach(function (k) { if (store.quiz[k].right) S0 += 10; });
      Object.keys(store.train || {}).forEach(function (k) { S0 += 10 * (store.train[k].r || 0); });
      (store.exams || []).forEach(function (e) { S0 += 100 + Math.round(150 * (e.max ? e.score / e.max : 0)); });
      g.xp = S0;
      g.tot.r = Object.keys(store.train || {}).reduce(function (a, k) { return a + (store.train[k].r || 0); }, 0) + Object.keys(store.quiz || {}).filter(function (k) { return store.quiz[k].right; }).length;
      g.tot.q = g.tot.r;
      checkAch(true);
      if (S0 > 0) setTimeout(function () { FX.toast('<div class="ach-badge">🎮</div><div><div class="fx-k">Welcome to the new Code Lab</div><b>Your earlier progress earned ' + g.xp.toLocaleString() + ' XP</b><div class="fx-d">Level ' + levelOf(g.xp) + ": " + esc(rankOf(levelOf(g.xp))[1]) + "</div></div>", "ach", 6500); }, 1200);
      if (CL.save) CL.save();
    }
    // every activity the site records feeds the game
    var orig = CL.Progress.log;
    CL.Progress.log = function (kind) {
      var r = orig.apply(this, arguments);
      try { onLog(kind); } catch (e) { if (window.console) console.error(e); }
      return r;
    };
    // lab "Your turn" answers come through onPractice: mark them so they count as lab predictions
    var op = CL.onPractice;
    if (op) CL.onPractice = function () { inLab = true; try { return op.apply(this, arguments); } finally { inLab = false; } };
    // labs visited
    function seen() {
      var h = (location.hash || "").slice(1);
      if (h.indexOf("lab-") === 0 && D.labs.some(function (l) { return l.id === h.slice(4); }) && !g.labs[h.slice(4)]) { g.labs[h.slice(4)] = 1; save(); checkAch(); }
    }
    window.addEventListener("hashchange", seen);
    seen();
    CL.pages = CL.pages || {};
    CL.pages.trophies = { nav: "progress", draw: trophies };
    // a new day may have started while the page was open
    setInterval(function () { if (g.day.d !== today()) { ensureDay(); refreshHud(false); refreshQuestViews(); } }, 60000);
    setTimeout(function () { checkAch(); }, 1500);
  };
})(CL);
