/* COMP 2611 Code Lab — the Arcade: short, fast games that drill the exam skills from the lectures.
   This file has the game shell (score, combo, lives or timer, countdown, results), the lobby, and the first three games:
   Big-O Blitz, Traversal Sprint and BST Builder. arcade_games.js adds the heap, hashing and graph games. */
(function (CL) {
  "use strict";
  var esc = CL.esc, FX = CL.FX;
  var A = CL.Arcade = { games: [], byId: {}, count: 0 };
  A.add = function (g) { A.games.push(g); A.byId[g.id] = g; A.count = A.games.length; };

  // ---------------------------------------------------------------- helpers shared by every game
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function distinct(n, lo, hi) { var pool = []; for (var v = lo; v <= hi; v++) pool.push(v); return shuffle(pool).slice(0, n); }
  A.util = { rnd: rnd, shuffle: shuffle, distinct: distinct };
  // drawing width for a game board: the stage width on phones (so nodes stay big enough to tap), at most 640
  A.boardW = function (S) { return Math.round(Math.max(320, Math.min(640, (S.stage.clientWidth || 640) - 28))); };
  // the game of the day earns double XP (the same game for everyone, all day)
  A.featured = function () {
    var d = CL.Progress.day(), h = 0;
    for (var i = 0; i < d.length; i++) h = (h * 31 + d.charCodeAt(i)) >>> 0;
    return A.games.length ? A.games[h % A.games.length].id : null;
  };

  // a binary tree drawn in SVG; nodes: [{id, k, x, y, cls, label}], edges: [[x1, y1, x2, y2, cls]]
  A.treeSvg = function (W, H, nodes, edges, o) {
    o = o || {};
    var r = o.r || 19, s = '<svg class="arc-svg" viewBox="0 0 ' + W + " " + H + '" role="group" aria-label="' + esc(o.label || "tree") + '">';
    (edges || []).forEach(function (e) { s += '<line class="g-edge ' + (e[4] || "") + '" x1="' + e[0] + '" y1="' + e[1] + '" x2="' + e[2] + '" y2="' + e[3] + '"/>'; });
    nodes.forEach(function (n) {
      var click = n.click !== false;
      s += '<g class="g-node ' + (n.cls || "") + (click ? " arc-hit" : "") + '"' + (click ? ' data-k="' + esc(n.id) + '" tabindex="0" role="button" aria-label="' + esc(n.aria || ("node " + n.k)) + '"' : "") + ">" +
        (click ? '<circle class="arc-pad" cx="' + n.x + '" cy="' + n.y + '" r="' + (r + 9) + '"/>' : "") +
        '<circle cx="' + n.x + '" cy="' + n.y + '" r="' + r + '"' + (n.ghost ? ' class="ghost"' : "") + '/><text x="' + n.x + '" y="' + n.y + '">' + esc(n.k === undefined ? "" : n.k) + "</text>" +
        (n.badge !== undefined ? '<g class="arc-badge"><circle cx="' + (n.x + r * 0.8) + '" cy="' + (n.y - r * 0.8) + '" r="9"/><text x="' + (n.x + r * 0.8) + '" y="' + (n.y - r * 0.8) + '">' + esc(n.badge) + "</text></g>" : "") +
        (n.idx !== undefined ? '<text class="g-idx" x="' + (n.x + r + 3) + '" y="' + (n.y - r + 4) + '">' + n.idx + "</text>" : "") + "</g>";
    });
    return s + "</svg>";
  };

  // ---------------------------------------------------------------- the shell every game runs in
  function Shell(host, game, onExit) {
    var self = this;
    this.game = game;
    this.host = host;
    this.score = 0; this.combo = 0; this.bestCombo = 0; this.hits = 0; this.misses = 0; this.round = 1;
    this.lives = game.lives || 0; this.time = game.time || 0; this.timeLeft = this.time; this.over = false; this.timers = [];
    this.review = [];
    host.innerHTML = '<div class="arc-shell" style="--gc:' + (game.color || "#9d8cf0") + '">' +
      '<div class="arc-top"><a class="btn small ghost" href="#arcade">← Arcade</a><div class="arc-title"><span aria-hidden="true">' + game.icon + "</span>" + esc(game.title) + "</div>" +
      '<div class="arc-stats"><div class="arc-st"><i>score</i><b class="as-score">0</b></div><div class="arc-st"><i>combo</i><b class="as-combo">×1</b></div>' +
      (this.lives ? '<div class="arc-st"><i>lives</i><b class="as-lives"></b></div>' : "") + (game.rounds !== false ? '<div class="arc-st"><i>round</i><b class="as-round">1</b></div>' : "") + "</div></div>" +
      (this.time ? '<div class="arc-timer"><i></i><span></span></div>' : "") +
      '<div class="arc-say" aria-live="polite"></div><div class="arc-stage"></div><div class="arc-extra"></div></div>';
    this.el = host.querySelector(".arc-shell");
    this.stage = host.querySelector(".arc-stage");
    this.extra = host.querySelector(".arc-extra");
    this.sayEl = host.querySelector(".arc-say");
    this.paintLives();
    // keyboard: Enter or Space on a focused clickable node clicks it
    this.stage.addEventListener("click", function (e) { if (self.locked) { e.stopPropagation(); e.preventDefault(); } }, true);
    this.stage.addEventListener("keydown", function (e) {
      var t = e.target.closest && e.target.closest("[data-k]");
      if (t && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); t.dispatchEvent(new MouseEvent("click", { bubbles: true })); }
    });
    this.onExit = onExit;
    if (this.time) this.paintTime();
  }
  Shell.prototype.later = function (fn, ms) { var self = this, t = setTimeout(function () { if (!self.over) fn(); }, ms); this.timers.push(t); return t; };
  Shell.prototype.say = function (html, cls) { this.sayEl.className = "arc-say" + (cls ? " " + cls : ""); this.sayEl.innerHTML = html; };
  Shell.prototype.paintLives = function () {
    var b = this.host.querySelector(".as-lives");
    if (!b) return;
    var s = "";
    for (var i = 0; i < (this.game.lives || 0); i++) s += '<span class="heart' + (i < this.lives ? "" : " lost") + '">♥</span>';
    b.innerHTML = s;
  };
  Shell.prototype.paint = function () {
    var sc = this.host.querySelector(".as-score"), cb = this.host.querySelector(".as-combo"), rd = this.host.querySelector(".as-round");
    var old = parseInt(sc.textContent.replace(/[^0-9]/g, ""), 10) || 0;
    if (old !== this.score) FX.countUp(sc, old, this.score, 350);
    cb.textContent = "×" + this.mult().toFixed(this.mult() % 1 ? 1 : 0);
    cb.parentNode.classList.toggle("hot", this.combo >= 5);
    if (rd) rd.textContent = this.round;
  };
  Shell.prototype.mult = function () { return Math.min(3, 1 + Math.floor(this.combo / 3) * 0.25); };
  Shell.prototype.paintTime = function () {
    var bar = this.host.querySelector(".arc-timer i"), lab = this.host.querySelector(".arc-timer span");
    if (!bar) return;
    var k = Math.max(0, this.timeLeft / this.time);
    bar.style.width = (100 * k) + "%";
    bar.parentNode.classList.toggle("low", this.timeLeft <= 10);
    lab.textContent = Math.ceil(Math.max(0, this.timeLeft)) + "s";
  };
  // a right answer: points times the combo multiplier
  Shell.prototype.flash = function (cls) {
    var el = this.el;
    el.classList.remove("shake", "good"); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(this._fl);
    this._fl = setTimeout(function () { el.classList.remove(cls); }, 520);
  };
  Shell.prototype.hit = function (base, label, el) {
    if (this.over || this.locked) return 0;
    this.combo++;
    this.hits++;
    if (this.combo > this.bestCombo) this.bestCombo = this.combo;
    var pts = Math.round(base * this.mult());
    this.score += pts;
    FX.sfx("right", Math.min(this.combo, 14));
    var p = FX.point();
    FX.float("+" + pts + (label ? "<span>" + esc(label) + "</span>" : ""), "xp" + (this.combo >= 5 ? " hot" : ""), p.x, p.y);
    if (this.combo > 0 && this.combo % 5 === 0) { FX.burst(p.x, p.y, 30, { power: 6 }); FX.float("🔥 " + this.combo + " in a row", "combo", window.innerWidth / 2, Math.max(140, window.innerHeight * 0.3)); }
    this.flash("good");
    this.paint();
    return pts;
  };
  Shell.prototype.bonus = function (pts, label) {
    if (this.over || this.locked || !pts) return;
    this.score += pts;
    FX.float("+" + pts + "<span>" + esc(label || "bonus") + "</span>", "xp big", window.innerWidth / 2, Math.max(150, window.innerHeight * 0.35));
    this.paint();
  };
  // a wrong answer: the combo resets, and a life or some time is lost
  Shell.prototype.miss = function (msg, review) {
    if (this.over || this.locked) return;
    this.misses++;
    this.combo = 0;
    FX.sfx("wrong");
    if (review) this.review.push(review);
    this.flash("shake");
    if (msg) this.say(msg, "bad");
    if (this.lives) { this.lives--; this.paintLives(); if (this.lives <= 0) { var self = this; this.locked = true; this.later(function () { self.end("Out of lives"); }, 1500); } }
    if (this.time && this.game.penalty) { this.timeLeft -= this.game.penalty; FX.float("−" + this.game.penalty + "s", "lost", window.innerWidth / 2, 120); this.paintTime(); }
    this.paint();
  };
  Shell.prototype.nextRound = function () { this.round++; this.paint(); FX.sfx("go"); FX.float("Round " + this.round, "combo", window.innerWidth / 2, Math.max(140, window.innerHeight * 0.3)); };
  Shell.prototype.start = function () {
    var self = this, n = 3;
    this.stage.innerHTML = '<div class="arc-count"><b>3</b></div>';
    var b = this.stage.querySelector("b");
    FX.sfx("tick");
    var iv = setInterval(function () {
      n--;
      if (n > 0) { b.textContent = n; b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; FX.sfx("tick"); return; }
      clearInterval(iv);
      b.textContent = "GO!"; b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
      FX.sfx("go");
      setTimeout(function () {
        if (self.over) return;
        self.stage.innerHTML = "";
        self.t0 = Date.now();
        if (self.time) {
          var last = Date.now();
          self.clock = setInterval(function () {
            var now = Date.now();
            self.timeLeft -= (now - last) / 1000;
            last = now;
            self.paintTime();
            if (self.timeLeft <= 5 && Math.ceil(self.timeLeft) !== self._lastTick) { self._lastTick = Math.ceil(self.timeLeft); if (self.timeLeft > 0) FX.sfx("tick"); }
            if (self.timeLeft <= 0) self.end("Time's up");
          }, 100);
        }
        self.game.start(self, A.util);
      }, 450);
    }, 650);
    this.timers.push(iv);
  };
  Shell.prototype.end = function (why) {
    if (this.over) return;
    this.over = true;
    clearInterval(this.clock);
    this.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    if (this.game.stop) try { this.game.stop(this); } catch (e) { /* ignore */ }
    var g = this.game, feat = A.featured() === g.id;
    var res = CL.Game ? CL.Game.arcadeResult(g.id, this.score, g.title, feat ? 2 : 1) : { best: false, prev: 0, xp: 0 };
    FX.sfx(res.best && this.score > 0 ? "level" : "over");
    if (res.best && this.score > 0) FX.celebrate(true);
    var acc = this.hits + this.misses ? Math.round(100 * this.hits / (this.hits + this.misses)) : 0;
    var self = this;
    var ov = document.createElement("div");
    ov.className = "arc-over";
    ov.innerHTML = '<div class="arc-over-in"><div class="lu-k">' + esc(why || "Game over") + '</div><div class="ao-score"><b>0</b><span>points</span></div>' +
      (res.best && this.score > 0 ? '<div class="ao-best">★ New best score!' + (res.prev ? " (was " + res.prev.toLocaleString() + ")" : "") + "</div>" : '<div class="ao-prev">Best: ' + Math.max(res.prev, this.score).toLocaleString() + "</div>") +
      '<div class="ao-grid"><div><b>' + acc + '%</b><i>accuracy</i></div><div><b>' + this.bestCombo + '</b><i>best combo</i></div><div><b>' + this.round + '</b><i>' + (g.rounds === false ? "level" : "round") + '</i></div><div><b>+' + res.xp + "</b><i>XP" + (feat ? " (×2 today)" : "") + "</i></div></div>" +
      (this.review.length ? '<details class="ao-rev" open><summary>Review what you missed (' + this.review.length + ")</summary><ul>" + this.review.slice(0, 12).map(function (r) { return "<li>" + r + "</li>"; }).join("") + "</ul></details>" : "") +
      (g.learn ? '<p class="ao-learn">Practised here: ' + g.learn + "</p>" : "") +
      '<div class="btns"><button type="button" class="btn primary glow ao-again">▶ Play again</button><a class="btn" href="#arcade">All games</a></div></div>';
    this.el.appendChild(ov);
    FX.countUp(ov.querySelector(".ao-score b"), 0, this.score, 900);
    var again = ov.querySelector(".ao-again");
    again.addEventListener("click", function () { if (self.onExit) self.onExit("again"); });
    setTimeout(function () { try { again.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 100);
  };
  Shell.prototype.destroy = function () {
    this.over = true;
    clearInterval(this.clock);
    this.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    if (this.game.stop) try { this.game.stop(this); } catch (e) { /* ignore */ }
  };

  // ---------------------------------------------------------------- pages: the lobby and a game
  function lobby(ui) {
    var p = ui.page("arcade-page");
    ui.setTutor("train", "Arcade", function () { return "The Arcade: timed games that drill exam skills (big-O, traversals, BST insertion, heapify, hashing, Dijkstra, MSTs). " + ui.progressText(); });
    var feat = A.featured();
    p.innerHTML = '<div class="eyebrow">Arcade</div><h1 class="title">The Arcade</h1><p class="lede">Fast rounds that drill the exact skills the exams test, using the algorithms from the lecture notes. Build combos for bigger scores, beat your best, and earn XP. The <b>game of the day</b> pays double XP.</p>' +
      '<a class="boss-banner" href="#boss"><span class="bb-ic" aria-hidden="true">⚔️</span><span><b>Boss Battles</b><i>One boss per topic, fought with real exam questions. Defeat five to face the Final Exam.</i></span><span class="bb-go">Fight ▶</span></a>' +
      '<div class="arc-grid">' + A.games.map(function (g) {
        var best = CL.Game ? CL.Game.arcadeBest(g.id) : 0, plays = CL.Game ? CL.Game.arcadePlays(g.id) : 0;
        return '<a class="arc-card' + (g.id === feat ? " feat" : "") + '" href="#arcade-' + g.id + '" style="--gc:' + (g.color || "#9d8cf0") + '">' + (g.id === feat ? '<span class="arc-feat">Game of the day · ×2 XP</span>' : "") +
          '<span class="arc-ic" aria-hidden="true">' + g.icon + '</span><b>' + esc(g.title) + '</b><span class="arc-tag">' + esc(g.tag) + '</span><span class="arc-d">' + esc(g.desc) + '</span>' +
          '<span class="arc-foot"><span>' + (best ? "Best <b>" + best.toLocaleString() + "</b>" : "Not played yet") + (plays ? " · " + plays + " play" + (plays > 1 ? "s" : "") : "") + '</span><span class="arc-play">Play ▶</span></span></a>';
      }).join("") + "</div>";
  }
  var live = null;
  function play(ui, id) {
    var g = A.byId[id];
    if (!g) return false;
    var p = ui.page("arcade-page arc-play-page");
    ui.setTutor("train", g.title, function () { return "The student is playing " + g.title + " in the Arcade: " + g.desc + " How to play: " + g.how.replace(/<[^>]+>/g, "") + " " + ui.progressText(); });
    var best = CL.Game ? CL.Game.arcadeBest(g.id) : 0, feat = A.featured() === g.id;
    function intro() {
      if (live) { live.destroy(); live = null; }
      p.innerHTML = '<div class="arc-intro" style="--gc:' + (g.color || "#9d8cf0") + '"><div class="crumbs"><a href="#arcade">Arcade</a><span>/</span><span>' + esc(g.title) + '</span></div><div class="arc-intro-ic" aria-hidden="true">' + g.icon + '</div><h1 class="title">' + esc(g.title) + '</h1><div class="arc-tag">' + esc(g.tag) + (feat ? " · <b>Game of the day: ×2 XP</b>" : "") + "</div>" +
        '<div class="arc-how">' + g.how + "</div>" + '<div class="arc-meta">' + (g.time ? "⏱ " + g.time + " seconds" : "") + (g.lives ? "♥ " + g.lives + " lives" : "") + " · 🔥 combos multiply your points" + (best ? " · ★ your best: <b>" + best.toLocaleString() + "</b>" : "") + "</div>" +
        '<div class="btns"><button type="button" class="btn primary glow arc-go">▶ Start</button><a class="btn" href="#arcade">All games</a>' + (g.lesson ? '<a class="btn ghost" href="#l-' + g.lesson + '">Review the lesson first</a>' : "") + "</div></div>";
      var go = p.querySelector(".arc-go");
      go.addEventListener("click", run);
      setTimeout(function () { try { go.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 60);
    }
    function run() {
      p.innerHTML = "";
      live = new Shell(p, g, function (what) { if (what === "again") { live.destroy(); run(); } });
      A.live = live;
      ui.setCurrent({ destroy: function () { if (live) live.destroy(); live = null; } });
      live.start();
    }
    intro();
    ui.setCurrent({ destroy: function () { if (live) live.destroy(); live = null; } });
  }
  CL.pages = CL.pages || {};
  CL.pages.arcade = { nav: "arcade", draw: lobby };
  CL.pages["arcade-"] = { nav: "arcade", draw: play };

  // ================================================================ GAME 1: Big-O Blitz
  // [operation, answer, why, family]  families: n = general, g = graphs, h = height of a tree
  var BIGO = [
    ["Search for a key in an unsorted array of n values", "O(n)", "Every value may have to be checked (on average n/2).", "n"],
    ["Search for a key in a linked list of n nodes", "O(n)", "Lecture 11: on average n/2 nodes must be checked.", "n"],
    ["Insert a node at the head (top) of a linked list", "O(1)", "Lecture 11: constant time, only top changes.", "n"],
    ["Insert a node at the end of a linked list with only a top pointer", "O(n)", "getLast has to walk the whole list first.", "n"],
    ["Delete a given key from a linked list of n nodes", "O(n)", "Search (about n/2 nodes) plus a constant-time unlink.", "n"],
    ["Search a BST of n nodes that has the best (balanced) shape", "O(log n)", "Lecture 11: the best case height is log₂ n.", "n"],
    ["Search a degenerate BST of n nodes", "O(n)", "A degenerate BST is a linked list in disguise: height n.", "n"],
    ["Insert into a BST of n nodes, worst case", "O(n)", "Lecture 11: the worst case is n (a degenerate tree).", "n"],
    ["Insert into a BST of n nodes, best case", "O(log n)", "Lecture 11: the best case is the height, log₂ n.", "n"],
    ["Find the maximum value in a max-heap", "O(1)", "It is always A[1].", "n"],
    ["Delete the maximum from a max-heap (deleteMaxHeap at index 1)", "O(log n)", "Move A[size] to A[1], then maxHeapify walks down one path: the height.", "n"],
    ["Insert a value into a max-heap of n values", "O(log n)", "insertMaxHeap swaps upwards along one path to the root.", "n"],
    ["maxHeapify at the root of a heap of n values", "O(log n)", "It moves down at most the height of an almost complete tree.", "n"],
    ["Find out whether a max-heap contains a given value", "O(n)", "Lecture 14: the heap property does not say which side to search, so check everything.", "n"],
    ["Increase the key of an element in a max-heap", "O(log n)", "The element swaps upwards with its parents: at most the height.", "n"],
    ["Heap sort on n values", "O(n log n)", "Lecture 21: n deletions, each O(log n).", "n"],
    ["Merge sort on n values, worst case", "O(n log n)", "Lecture 21: log n levels of splitting, O(n) merging per level.", "n"],
    ["Quick sort, worst case", "O(n²)", "Lecture 21: a bad pivot splits n into n−1 and 0 every time.", "n"],
    ["Quick sort, average case", "O(n log n)", "Lecture 21: average case O(n log n).", "n"],
    ["Selection sort, worst case", "O(n²)", "Lecture 21: two nested loops over the array.", "n"],
    ["Insertion sort, worst case", "O(n²)", "Lecture 21: a reversed array shifts every value all the way.", "n"],
    ["Bubble sort, worst case", "O(n²)", "Lecture 21: n passes of up to n comparisons.", "n"],
    ["Insertion sort on an array that is already sorted", "O(n)", "Each new value is compared once and stays where it is.", "n"],
    ["Hash table search with few collisions (average case)", "O(1)", "Lecture 14: hashing aims for constant-time search.", "n"],
    ["Hash table search when every key collides (worst case)", "O(n)", "All keys sit on one probe sequence (or one chain).", "n"],
    ["Read A[i] from an array", "O(1)", "The address is computed directly from i.", "n"],
    ["Binary search in a sorted array of n values", "O(log n)", "Each comparison halves what is left.", "n"],
    ["Sequential search in an array of n values", "O(n)", "Check the values one by one.", "n"],
    ["Push onto a stack built on a linked list", "O(1)", "Insert at the top: constant time.", "n"],
    ["Enqueue at the tail of a queue that keeps a tail pointer", "O(1)", "The tail pointer gives the last node directly.", "n"],
    ["Preorder traversal of a binary tree with n nodes", "O(n)", "Every node is visited once.", "n"],
    ["Level order traversal of a binary tree with n nodes", "O(n)", "Each node is enqueued and dequeued once.", "n"],
    ["moment (count the nodes) of a binary tree with n nodes", "O(n)", "One call per node.", "n"],
    ["printListRec on a list of n nodes", "O(n)", "One call per node plus the call with NULL.", "n"],
    ["Merge two sorted linked lists with n nodes in total", "O(n)", "Each call places one node.", "n"],
    ["BFS on a graph with V vertices and E edges (adjacency lists)", "O(V + E)", "Each vertex is dequeued once and each list is scanned once.", "g"],
    ["DFS on a graph with V vertices and E edges (adjacency lists)", "O(V + E)", "Each vertex is visited once and each list is scanned once.", "g"],
    ["Check whether edge (u, v) exists, using an adjacency matrix", "O(1)", "Look at one cell of the matrix.", "g"],
    ["List the edges leaving v, using an adjacency matrix", "O(V)", "Scan v's whole row.", "g"],
    ["Floyd's all-pairs shortest paths on V vertices", "O(V³)", "Three nested loops over the vertices.", "g"],
    ["Dijkstra with a plain array as the priority queue", "O(V²)", "V times: scan for the minimum (O(V)).", "g"],
    ["Kruskal: sort the E edges by weight", "O(E log E)", "Sorting dominates the work.", "g"],
    ["Find the minimum key in a BST of height h", "O(h)", "Go left until there is no left child: at most h steps.", "h"],
    ["Find the inorder successor of a node in a BST of height h", "O(h)", "Down the right subtree or up the parents: at most h steps.", "h"],
    ["Delete a node from a BST of height h", "O(h)", "Find it, maybe find the successor: one path each.", "h"],
    ["Counting sort of n integers in the range 0..k", "O(n + k)", "One pass over the values and one over the counts.", "k"],
    ["Read entry (i, j) of a lower-triangular matrix stored row by row in a 1-D array", "O(1)", "The index i(i+1)/2 + j is computed directly.", "n"]
  ];
  var FAM = { n: ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"], g: ["O(1)", "O(V)", "O(V + E)", "O(V²)", "O(V³)", "O(E log E)"], h: ["O(1)", "O(h)", "O(n²)", "O(h²)"], k: ["O(n)", "O(n + k)", "O(n log n)", "O(k²)"] };
  A.add({
    id: "bigo", title: "Big-O Blitz", icon: "⚡", color: "#ffd23f", tag: "Lectures 11, 14, 21 · performance", time: 60, penalty: 4, rounds: false,
    desc: "60 seconds of rapid-fire: what does each operation cost?",
    how: "<p>An operation appears. Pick its running time before the clock runs out. Answer fast for a speed bonus.</p><p>Right answers build your combo; a wrong answer costs <b>4 seconds</b>. Use the keys <kbd>1</kbd>–<kbd>4</kbd>.</p>",
    learn: "the big-O table from Lectures 11, 14 and 21, plus graphs and the course-outline topics.",
    lesson: "l1-performance",
    start: function (S) {
      var deck = shuffle(BIGO.slice()), i = 0, shown = 0, lock = false, cur = null, keyH;
      function ask() {
        if (S.over) return;
        if (i >= deck.length) { deck = shuffle(BIGO.slice()); i = 0; }
        cur = deck[i++];
        var opts = shuffle(FAM[cur[3]].filter(function (o) { return o !== cur[1]; })).slice(0, 3).concat([cur[1]]);
        shuffle(opts);
        shown = Date.now();
        lock = false;
        S.stage.innerHTML = '<div class="bo-q"><div class="bo-k">What does this cost?</div><div class="bo-op">' + esc(cur[0]) + '</div></div><div class="bo-opts">' + opts.map(function (o, j) {
          return '<button type="button" class="bo-opt" data-o="' + esc(o) + '"><kbd>' + (j + 1) + "</kbd>" + esc(o) + "</button>";
        }).join("") + "</div>";
        S.say("Streak: <b>" + S.combo + "</b>");
      }
      function choose(btn) {
        if (lock || S.over) return;
        lock = true;
        var o = btn.getAttribute("data-o"), ok = o === cur[1], dt = (Date.now() - shown) / 1000;
        S.stage.querySelectorAll(".bo-opt").forEach(function (b) { if (b.getAttribute("data-o") === cur[1]) b.classList.add("right"); });
        if (ok) {
          btn.classList.add("right");
          S.hit(100);
          if (dt < 2.5) S.bonus(50, "fast");
          S.later(ask, 380);
        } else {
          btn.classList.add("wrong");
          S.miss("<b>" + esc(cur[1]) + "</b>: " + esc(cur[2]), "<b>" + esc(cur[0]) + "</b> → " + esc(cur[1]) + ". " + esc(cur[2]));
          S.later(ask, 1700);
        }
      }
      S.hint = function () { return cur ? '.bo-opt[data-o="' + cur[1] + '"]' : null; };
      S.stage.addEventListener("click", function (e) { var b = e.target.closest(".bo-opt"); if (b) choose(b); });
      keyH = function (e) { if (/^[1-4]$/.test(e.key)) { var b = S.stage.querySelectorAll(".bo-opt")[+e.key - 1]; if (b) { e.preventDefault(); choose(b); } } };
      document.addEventListener("keydown", keyH);
      S._keyH = keyH;
      ask();
    },
    stop: function (S) { if (S._keyH) document.removeEventListener("keydown", S._keyH); }
  });

  // ================================================================ GAME 2: Traversal Sprint
  // a random binary tree (not a BST, so inorder is not simply sorted), drawn with x = inorder position
  function randomTree(n, maxDepth) {
    var vals = distinct(n, 1, 99), root = null, count = 0, guard = 0;
    while (count < n && guard++ < 500) {
      var v = vals[count];
      if (!root) { root = { k: v, l: null, r: null, d: 0 }; count++; continue; }
      var cur = root;
      while (true) {
        var goL = Math.random() < 0.5, nxt = goL ? cur.l : cur.r;
        if (!nxt) {
          if (cur.d + 1 > maxDepth) break;
          var node = { k: v, l: null, r: null, d: cur.d + 1 };
          if (goL) cur.l = node; else cur.r = node;
          count++;
          break;
        }
        cur = nxt;
      }
    }
    return root;
  }
  function layout(root, W, H) {
    var list = [], i = 0, depth = 0;
    (function walk(n) { if (!n) return; walk(n.l); n.ix = i++; depth = Math.max(depth, n.d); walk(n.r); })(root);
    var cols = i, dx = (W - 60) / Math.max(1, cols - 1), dy = (H - 60) / Math.max(1, depth);
    (function walk(n) { if (!n) return; n.x = cols === 1 ? W / 2 : 30 + n.ix * dx; n.y = 30 + n.d * dy; list.push(n); walk(n.l); walk(n.r); })(root);
    return list;
  }
  var ORDERS = {
    pre: { name: "Preorder", rule: "Root → Left → Right", f: function (r) { var o = []; (function w(n) { if (!n) return; o.push(n); w(n.l); w(n.r); })(r); return o; } },
    "in": { name: "Inorder", rule: "Left → Root → Right", f: function (r) { var o = []; (function w(n) { if (!n) return; w(n.l); o.push(n); w(n.r); })(r); return o; } },
    post: { name: "Postorder", rule: "Left → Right → Root", f: function (r) { var o = []; (function w(n) { if (!n) return; w(n.l); w(n.r); o.push(n); })(r); return o; } },
    level: { name: "Level order", rule: "Level by level, left to right (a queue)", f: function (r) { var o = [], q = [r]; while (q.length) { var n = q.shift(); o.push(n); if (n.l) q.push(n.l); if (n.r) q.push(n.r); } return o; } }
  };
  A.add({
    id: "trav", title: "Traversal Sprint", icon: "🌳", color: "#5fd38d", tag: "Lectures 5, 6, 10 · traversals", lives: 3,
    desc: "Tap the nodes in preorder, inorder, postorder or level order, against the clock.",
    how: "<p>A binary tree appears with a traversal to perform. Tap the nodes <b>in the order they are visited</b>.</p><p>Finish fast for a time bonus. Each wrong tap costs a life, and the trees grow every round.</p>",
    learn: "the four traversals from Lectures 5, 6 and 10 (preorder, inorder, postorder and level order with a queue).",
    lesson: "f2-traversals",
    start: function (S) {
      var root, list, order, seq, idx, kind, t0, W = 640;
      var kinds = ["pre", "in", "post", "level"];
      function round() {
        if (S.over) return;
        var n = Math.min(4 + S.round, 13), md = n <= 6 ? 3 : 4;
        root = randomTree(n, md);
        kind = S.round <= 4 ? kinds[S.round - 1] : kinds[rnd(0, 3)];
        order = ORDERS[kind];
        seq = order.f(root);
        W = A.boardW(S);
        list = layout(root, W, md >= 4 ? 330 : 280);
        idx = 0;
        t0 = Date.now();
        draw();
        S.say("<b>" + order.name + "</b>: " + order.rule + ". Tap the first node.");
      }
      function draw(flash) {
        var nodes = list.map(function (n) {
          var pos = seq.indexOf(n), visited = pos < idx;
          return { id: n.k, k: n.k, x: n.x, y: n.y, cls: visited ? "done" : flash === n ? "hot" : "", badge: visited ? pos + 1 : undefined, click: !visited };
        });
        var edges = [];
        list.forEach(function (n) { [n.l, n.r].forEach(function (c) { if (c) edges.push([n.x, n.y, c.x, c.y, seq.indexOf(c) < idx && seq.indexOf(n) < idx ? "on" : ""]); }); });
        S.stage.innerHTML = '<div class="tv-head"><span class="chip acc">' + order.name + '</span><span class="muted small">' + order.rule + "</span></div>" + A.treeSvg(W, list.length && list[0] ? (Math.max.apply(null, list.map(function (n) { return n.y; })) + 40) : 300, nodes, edges, { label: order.name + " traversal", r: W < 480 ? 16 : 19 }) +
          '<div class="tv-out"><span class="muted">Output:</span> ' + (idx ? seq.slice(0, idx).map(function (n) { return "<b>" + n.k + "</b>"; }).join(" ") : '<span class="muted">(tap the first node)</span>') + "</div>";
      }
      S.hint = function () { return seq && idx < seq.length ? '[data-k="' + seq[idx].k + '"]' : null; };
      S.stage.addEventListener("click", function (e) {
        var t = e.target.closest("[data-k]");
        if (!t || S.over || !seq) return;
        var k = +t.getAttribute("data-k");
        if (k === seq[idx].k) {
          idx++;
          S.hit(40 + 5 * S.round);
          if (idx === seq.length) {
            var secs = (Date.now() - t0) / 1000, par = seq.length * 2.2, bonus = Math.max(0, Math.round((par - secs) * 20));
            draw();
            S.say("✓ " + order.name + " complete in " + secs.toFixed(1) + "s.", "ok");
            if (bonus) S.bonus(bonus, "speed");
            S.later(function () { S.nextRound(); round(); }, 1100);
          } else { draw(); S.say(order.name + ": " + order.rule + ". " + idx + " of " + seq.length + " visited."); }
        } else {
          var want = seq[idx];
          S.miss("Not " + k + ": the next node in " + order.name.toLowerCase() + " is <b>" + want.k + "</b>.", order.name + " of a tree: after " + (idx ? seq[idx - 1].k : "the start") + " comes <b>" + want.k + "</b>, not " + k + " (" + order.rule + ").");
          draw(want);
          S.later(function () { if (!S.over) draw(); }, 900);
        }
      });
      round();
    }
  });

  // ================================================================ GAME 3: BST Builder
  // fixed slot layout: the node at depth d with position p (0 .. 2^d − 1) sits at x = (p + 0.5) / 2^d of the width
  function bstOf(keys) { var root = null; keys.forEach(function (k) { root = ins(root, k, 0, 0); }); return root; }
  function ins(n, k, d, p) { if (!n) return { k: k, l: null, r: null, d: d, p: p }; if (k < n.k) n.l = ins(n.l, k, d + 1, 2 * p); else if (k > n.k) n.r = ins(n.r, k, d + 1, 2 * p + 1); return n; }
  function height(n) { return n ? 1 + Math.max(height(n.l), height(n.r)) : 0; }
  A.add({
    id: "bst", title: "BST Builder", icon: "🏗️", color: "#57b8ff", tag: "Lectures 7, 8 · insertBST", lives: 3,
    desc: "Keys arrive one by one: tap the empty spot where insertBST puts each one.",
    how: "<p>Each new key must go where <code>insertBST</code> would put it: go <b>left if smaller</b>, <b>right if bigger</b>, until you reach an empty spot.</p><p>Tap the dashed spot. Wrong spots cost a life.</p>",
    learn: "insertBST from Lecture 7: compare at each node, go left or right, and connect the new node to its parent.",
    lesson: "g2-insert-search",
    start: function (S) {
      var keys, root, k, W = 640, H = 290, MAXH = 4;
      function pos(d, p) { return { x: W * (p + 0.5) / Math.pow(2, d), y: 34 + d * ((H - 64) / (MAXH - 1)) }; }
      function round() {
        if (S.over) return;
        var n = Math.min(5 + S.round, 11), tries = 0;
        W = A.boardW(S);
        do { keys = distinct(n, 1, 99); tries++; } while (height(bstOf(keys)) > MAXH && tries < 4000);
        if (height(bstOf(keys)) > MAXH) keys = keys.slice(0, 6);
        root = null; k = 0;
        draw();
      }
      function walk(fn) { (function w(n) { if (!n) return; fn(n); w(n.l); w(n.r); })(root); }
      function target(key) {
        if (!root) return { d: 0, p: 0, path: [] };
        var n = root, path = [];
        while (true) {
          path.push(n.k);
          if (key < n.k) { if (!n.l) return { d: n.d + 1, p: 2 * n.p, path: path }; n = n.l; }
          else { if (!n.r) return { d: n.d + 1, p: 2 * n.p + 1, path: path }; n = n.r; }
        }
      }
      function draw(path, wrongSlot, rightSlot) {
        var nodes = [], edges = [], on = {};
        (path || []).forEach(function (x) { on[x] = 1; });
        walk(function (n) {
          var a = pos(n.d, n.p);
          [["l", 2 * n.p], ["r", 2 * n.p + 1]].forEach(function (c) { if (n[c[0]]) { var b = pos(n.d + 1, c[1]); edges.push([a.x, a.y, b.x, b.y, on[n.k] && on[n[c[0]].k] ? "on" : ""]); } });
          nodes.push({ id: "n" + n.k, k: n.k, x: a.x, y: a.y, cls: on[n.k] ? "on" : "", click: false });
        });
        // the empty spots: every missing child above the depth limit (and the root spot when the tree is empty)
        var slots = [];
        if (!root) slots.push({ d: 0, p: 0 });
        walk(function (n) { if (n.d + 1 < MAXH) { if (!n.l) slots.push({ d: n.d + 1, p: 2 * n.p, par: n }); if (!n.r) slots.push({ d: n.d + 1, p: 2 * n.p + 1, par: n }); } });
        slots.forEach(function (s) {
          var a = pos(s.d, s.p), id = s.d + "-" + s.p;
          if (s.par) { var b = pos(s.par.d, s.par.p); edges.push([b.x, b.y, a.x, a.y, "dim ghost-e"]); }
          nodes.push({ id: id, k: "", x: a.x, y: a.y, cls: "ghost slot" + (wrongSlot === id ? " bad" : "") + (rightSlot === id ? " hot" : ""), ghost: true, aria: "empty spot at depth " + s.d });
        });
        var done = k >= keys.length;
        S.stage.innerHTML = '<div class="bb-head"><div class="bb-next">' + (done ? "Tree complete!" : 'Insert <b>' + keys[k] + "</b>") + '</div><div class="bb-queue">' + keys.slice(k + 1).map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div></div>" +
          A.treeSvg(W, H, nodes, edges, { label: "binary search tree", r: W < 480 ? 15 : 17 });
        if (!done) S.say(root ? "Where does <b>" + keys[k] + "</b> go? Compare it with the root, " + root.k + ", and follow the branches." : "The tree is empty: the first key becomes the root.");
      }
      S.hint = function () { if (!keys || k >= keys.length) return null; var tg = target(keys[k]); return '[data-k="' + tg.d + "-" + tg.p + '"]'; };
      S.stage.addEventListener("click", function (e) {
        var t = e.target.closest("[data-k]");
        if (!t || S.over || k >= keys.length) return;
        var id = t.getAttribute("data-k"), key = keys[k], tg = target(key), want = tg.d + "-" + tg.p;
        if (id === want) {
          root = ins(root, key, 0, 0);
          k++;
          S.hit(50 + 5 * S.round);
          draw(tg.path.concat([key]));
          if (tg.path.length) S.say("✓ " + key + ": " + tg.path.map(function (x) { return key < x ? key + " < " + x + " → left" : key + " > " + x + " → right"; }).join(", ") + ".", "ok");
          if (k >= keys.length) { S.bonus(100 + 20 * S.round, "tree built"); S.later(function () { S.nextRound(); round(); }, 1300); }
          else S.later(function () { if (!S.over) draw(); }, 900);
        } else {
          S.miss("Not there. " + key + " follows: " + tg.path.map(function (x) { return key < x ? "< " + x + " left" : "> " + x + " right"; }).join(", ") + ".", "insertBST(" + key + "): " + (tg.path.length ? tg.path.map(function (x) { return key < x ? key + " < " + x + " → left" : key + " > " + x + " → right"; }).join(", ") : "the empty tree") + ".");
          draw(tg.path, id, want);
          S.later(function () { if (!S.over && k < keys.length) draw(); }, 1300);
        }
      });
      round();
    }
  });
})(CL);
