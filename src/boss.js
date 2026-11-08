/* COMP 2611 Code Lab — Boss Battles and the Algorithm Card collection.
   A boss per Trace Trainer topic (plus the Final Exam): you hit it with right answers to fresh exam-style questions,
   it hits back when you miss (and shows the worked solution). Cards are collectible revision cards, unlocked by the
   deep-dive lessons and by bosses; doing both makes a card holographic. */
(function (CL) {
  "use strict";
  var esc = CL.esc, FX = CL.FX;
  var B = CL.Boss = {};

  // ---------------------------------------------------------------- the bosses
  var BOSSES = [
    { id: "cpp", topic: "cpp", name: "The Dangling Pointer", icon: "👻", color: "#a78bfa", hp: 6, lesson: "b6-deep-memory", lore: "It lives in freed memory and crashes anyone who follows it." },
    { id: "lists", topic: "lists", name: "The Endless Chain", icon: "⛓️", color: "#22d3ee", hp: 6, lesson: "c6-deep-lists", lore: "A list whose last next was never set to NULL. It never ends." },
    { id: "recursion", topic: "recursion", name: "The Stack Overflow", icon: "🌀", color: "#f472b6", hp: 6, lesson: "d4-deep-recursion", lore: "Born from a recursion with no base case, it grows until the stack runs out." },
    { id: "stacks", topic: "stacks", name: "The Queue Keeper", icon: "🗝️", color: "#34d399", hp: 6, lesson: "e4-deep-stacks-queues", lore: "It guards the line: first in, first out, and woe to whoever forgets the tail." },
    { id: "trees", topic: "trees", name: "The Rootless Tree", icon: "🌲", color: "#34d399", hp: 7, lesson: "f5-deep-trees", lore: "It scrambles traversals. Only preorder and inorder together can rebuild it." },
    { id: "bst", topic: "bst", name: "The Degenerate", icon: "🐍", color: "#22d3ee", hp: 7, lesson: "g6-deep-bst", lore: "A BST fed sorted keys until it stretched into a list of height n − 1." },
    { id: "heaps", topic: "heaps", name: "The Heap Titan", icon: "⛰️", color: "#f472b6", hp: 7, lesson: "h5-deep-heaps", lore: "It always keeps the biggest at the top. Heapify it, or be crushed." },
    { id: "hashing", topic: "hashing", name: "The Collision", icon: "💥", color: "#fbbf24", hp: 7, lesson: "i4-deep-hashing", lore: "Every key it touches lands in the same location. Probe your way past it." },
    { id: "graphs", topic: "graphs", name: "The Labyrinth", icon: "🕸️", color: "#a78bfa", hp: 8, lesson: "j6-deep-graphs", lore: "A maze of weighted edges. Only BFS, DFS and Dijkstra find the way out." },
    { id: "sorting", topic: "sorting", name: "The Chaos Shuffler", icon: "🃏", color: "#60a5fa", hp: 8, lesson: "k5-deep-sorting", lore: "It deals arrays in the worst order for quick sort, and laughs." },
    { id: "bigo", topic: "bigo", name: "The Exponential", icon: "📈", color: "#fbbf24", hp: 8, lesson: "l3-deep-big-o", lore: "It grows like 2ⁿ. Measure every operation, or it will outgrow you." },
    { id: "final", topic: null, name: "The Final Exam", icon: "🎓", color: "#f43f5e", hp: 15, requires: 5, lore: "Every topic of the course, fifteen hits, no mercy. Defeat five bosses to unlock it." }
  ];
  B.list = BOSSES;
  B.byId = {};
  BOSSES.forEach(function (b) { B.byId[b.id] = b; });
  function gstate() { return (CL.store && CL.store.g) || {}; }
  function bstate(id) { var g = gstate(); return (g.boss && g.boss[id]) || {}; }
  B.state = bstate;
  B.defeated = function () { return BOSSES.filter(function (b) { return b.id !== "final" && bstate(b.id).wins; }).length; };
  function fmtTime(ms) { var s = Math.round(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }

  // a fresh question for the boss's topic (the Final Exam picks a random topic each time), never the same generator twice in a row
  function nextQuestion(b, lastGen) {
    var TR = CL.Train;
    var topic = b.topic || TR.topics[Math.floor(Math.random() * TR.topics.length)].id;
    var gens = TR.gens.filter(function (g) { return g.topic === topic; });
    if (!gens.length) gens = TR.gens;
    var pool = gens.filter(function (g) { return g.id !== lastGen; });
    if (!pool.length) pool = gens;
    for (var tries = 0; tries < 6; tries++) {
      var g = pool[Math.floor(Math.random() * pool.length)];
      try { var q = TR.make(g.id); if (q && q.mcq && q.mcq.options && q.mcq.options.length > 1) return q; } catch (e) { /* try another */ }
    }
    return null;
  }

  // ---------------------------------------------------------------- the lobby
  function lobby(ui) {
    var p = ui.page("boss-page");
    ui.setTutor("train", "Boss Battles", function () { return "Boss Battles: the student fights a boss per topic with exam-style questions. " + ui.progressText(); });
    var n = B.defeated();
    p.innerHTML = '<div class="crumbs"><a href="#arcade">Arcade</a><span>/</span><span>Boss Battles</span></div><div class="eyebrow">Arcade</div><h1 class="title">Boss Battles</h1>' +
      '<p class="lede">Each boss guards one topic. Hit it with right answers to fresh exam-style questions; answer in under 20 seconds for a <b>critical hit</b>. Miss, and it strikes back, but you get the worked solution. Defeat bosses to unlock and polish your <a href="#collection">Algorithm Cards</a>.</p>' +
      '<div class="boss-prog"><div class="xpbar"><i style="width:' + Math.round(100 * n / 11) + '%"></i></div><span><b>' + n + "</b> of 11 topic bosses defeated" + (n >= 5 ? " · the Final Exam is unlocked" : " · " + (5 - n) + " more to unlock the Final Exam") + "</span></div>" +
      '<div class="boss-grid">' + BOSSES.map(function (b) {
        var st = bstate(b.id), locked = b.requires && n < b.requires;
        return '<a class="boss-card' + (locked ? " locked" : "") + (st.wins ? " won" : "") + (b.id === "final" ? " final" : "") + '" href="#boss-' + b.id + '" style="--bc:' + b.color + '">' +
          '<span class="boss-orb" aria-hidden="true">' + (locked ? "🔒" : b.icon) + "</span><b>" + esc(b.name) + '</b><span class="boss-topic">' + esc(b.topic ? CL.Train.topicById[b.topic].title : "Every topic") + " · " + b.hp + " HP</span>" +
          '<span class="boss-st">' + (locked ? "Defeat " + b.requires + " bosses to unlock" : st.wins ? "✓ Defeated" + (st.wins > 1 ? " ×" + st.wins : "") + (st.flawless ? " · 💠 flawless" : "") + (st.best ? " · best " + fmtTime(st.best) : "") : "Not defeated yet") + "</span></a>";
      }).join("") + "</div>";
  }

  // ---------------------------------------------------------------- a battle
  var live = null;
  function battle(ui, id) {
    var b = B.byId[id];
    if (!b) return false;
    var p = ui.page("boss-page boss-fight");
    var locked = b.requires && B.defeated() < b.requires;
    ui.setTutor("train", b.name, function () { return "The student is fighting the boss '" + b.name + "' (" + (b.topic || "all topics") + ") with Trace Trainer questions. " + ui.progressText(); });
    function stop() { if (live) { clearInterval(live.timer); live.over = true; } live = null; }
    ui.setCurrent({ destroy: stop });
    function intro() {
      stop();
      var st = bstate(b.id);
      p.innerHTML = '<div class="crumbs"><a href="#arcade">Arcade</a><span>/</span><a href="#boss">Boss Battles</a><span>/</span><span>' + esc(b.name) + "</span></div>" +
        '<div class="bi-wrap" style="--bc:' + b.color + '"><div class="bi-orb" aria-hidden="true">' + (locked ? "🔒" : b.icon) + '</div><h1 class="title">' + esc(b.name) + '</h1><p class="bi-lore">' + esc(b.lore) + "</p>" +
        (locked ? '<p class="bi-rules">Defeat ' + b.requires + " topic bosses first. You have defeated " + B.defeated() + '.</p><div class="btns"><a class="btn primary" href="#boss">Choose a boss</a></div>' :
          '<div class="bi-rules"><span>❤️ 3 hearts</span><span>💀 ' + b.hp + " HP</span><span>⏱ " + (b.id === "final" ? 75 : 90) + " s per question</span><span>⚡ under 20 s = critical hit (2 damage)</span></div>" +
          (st.wins ? '<p class="muted">Defeated ' + st.wins + " time" + (st.wins > 1 ? "s" : "") + (st.best ? ", best time " + fmtTime(st.best) : "") + (st.flawless ? ", flawless 💠" : "") + ".</p>" : "") +
          '<div class="btns"><button type="button" class="btn primary glow bi-go">⚔️ Fight</button><a class="btn" href="#boss">All bosses</a>' + (b.lesson ? '<a class="btn ghost" href="#l-' + b.lesson + '">Study the deep dive first</a>' : "") + "</div>") + "</div>";
      var go = p.querySelector(".bi-go");
      if (go) { go.addEventListener("click", fight); setTimeout(function () { try { go.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50); }
    }
    function fight() {
      stop();
      var S = live = { hp: b.hp, hearts: 3, n: 0, right: 0, t0: Date.now(), lastGen: null, over: false, timer: 0, qT0: 0, limit: b.id === "final" ? 75 : 90, answered: false };
      p.innerHTML = '<div class="bf" style="--bc:' + b.color + '"><div class="bf-top"><div class="bf-boss"><span class="bf-orb" aria-hidden="true">' + b.icon + '</span><div class="bf-who"><b>' + esc(b.name) + '</b><div class="bf-hp" aria-label="Boss health"></div></div></div>' +
        '<div class="bf-me"><div class="bf-hearts" aria-label="Your hearts"></div><div class="bf-timer"><i></i><span></span></div></div></div><div class="bf-say" aria-live="polite"></div><div class="bf-q"></div><div class="bf-res"></div></div>';
      var hpEl = p.querySelector(".bf-hp"), heartsEl = p.querySelector(".bf-hearts"), qEl = p.querySelector(".bf-q"), resEl = p.querySelector(".bf-res"), sayEl = p.querySelector(".bf-say"), bossEl = p.querySelector(".bf-boss"), tBar = p.querySelector(".bf-timer i"), tLab = p.querySelector(".bf-timer span");
      function paint() {
        var segs = "";
        for (var k = 0; k < b.hp; k++) segs += "<i" + (k < S.hp ? "" : ' class="gone"') + "></i>";
        hpEl.innerHTML = segs + "<span>" + Math.max(0, S.hp) + " / " + b.hp + "</span>";
        heartsEl.innerHTML = [0, 1, 2].map(function (k) { return '<span class="heart' + (k < S.hearts ? "" : " lost") + '">♥</span>'; }).join("");
      }
      function tick() {
        if (S.over || S.answered) return;
        var left = S.limit - (Date.now() - S.qT0) / 1000;
        tBar.style.width = Math.max(0, 100 * left / S.limit) + "%";
        tBar.parentNode.classList.toggle("low", left <= 15);
        tLab.textContent = Math.max(0, Math.ceil(left)) + "s";
        if (left <= 0) resolve(false, null, true);
      }
      function ask() {
        if (S.over) return;
        var q = nextQuestion(b, S.lastGen);
        if (!q) { sayEl.textContent = "No questions available."; return; }
        S.lastGen = q.gen; S.q = q; S.n++; S.answered = false;
        qEl.innerHTML = "";
        resEl.innerHTML = "";
        sayEl.innerHTML = "Question " + S.n + ": answer to strike. <b>Under 20 s</b> is a critical hit.";
        ui.renderQuestion(q, qEl, { mcq: true, quiet: true, focus: false, onAnswer: function (ok, qq, shown, given) { resolve(ok && !shown, given, false); } });
        S.qT0 = Date.now();
        clearInterval(S.timer);
        S.timer = setInterval(tick, 200);
        tick();
      }
      function resolve(ok, given, timeout) {
        if (S.over || S.answered) return;
        S.answered = true;
        clearInterval(S.timer);
        var q = S.q, secs = (Date.now() - S.qT0) / 1000;
        qEl.querySelectorAll("button, input").forEach(function (x) { x.disabled = true; });
        qEl.querySelectorAll(".quiz-opt").forEach(function (x, i) { if (i === q.mcq.answer) x.classList.add("right"); else if (i === given) x.classList.add("wrong"); });
        if (ui.recordTrain) ui.recordTrain(q, ok);
        if (ok) {
          var crit = secs < 20, dmg = crit ? 2 : 1;
          S.hp -= dmg;
          S.right++;
          paint();
          bossEl.classList.remove("hit"); void bossEl.offsetWidth; bossEl.classList.add("hit");
          FX.float((crit ? "CRITICAL! " : "") + "−" + dmg + " HP", "combo" + (crit ? "" : " small-hit"), bossEl.getBoundingClientRect().left + 60, bossEl.getBoundingClientRect().top + 40);
          FX.sfx(crit ? "chest" : "pop", 4);
          if (crit) FX.burst(bossEl.getBoundingClientRect().left + 40, bossEl.getBoundingClientRect().top + 30, 40, { colors: [b.color, "#fde68a", "#ffffff"] });
          resEl.innerHTML = '<div class="bf-hitmsg ok"><b>' + (crit ? "⚡ Critical hit!" : "✓ Hit!") + "</b> " + (crit ? "Answered in " + secs.toFixed(0) + " s: 2 damage." : "1 damage. Answer in under 20 s for a critical hit.") + "</div>";
          if (S.hp <= 0) { S.over = true; setTimeout(victory, 900); return; }
          setTimeout(ask, 1300);
        } else {
          S.hearts--;
          paint();
          var root = p.querySelector(".bf");
          root.classList.remove("struck"); void root.offsetWidth; root.classList.add("struck");
          bossEl.classList.remove("attack"); void bossEl.offsetWidth; bossEl.classList.add("attack");
          FX.sfx("wrong");
          var right = q.mcq.options[q.mcq.answer];
          resEl.innerHTML = '<div class="bf-hitmsg bad"><b>' + (timeout ? "⏱ Time's up!" : "💢 " + esc(b.name) + " strikes!") + "</b> The answer was " + right + ". −1 ❤️</div>" +
            '<details class="bf-sol" open><summary>Worked solution</summary><ol>' + (q.steps || []).map(function (s2) { return "<li>" + s2 + "</li>"; }).join("") + "</ol></details>" +
            '<div class="btns"><button type="button" class="btn primary bf-next">' + (S.hearts <= 0 ? "See the result" : "Continue the fight") + "</button></div>";
          var nb = resEl.querySelector(".bf-next");
          nb.addEventListener("click", function () { if (S.hearts <= 0) { S.over = true; defeat(); } else ask(); });
          try { nb.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
        }
      }
      function victory() {
        var ms = Date.now() - S.t0, flawless = S.hearts === 3;
        var res = CL.Game && CL.Game.bossResult ? CL.Game.bossResult(b.id, { won: true, ms: ms, hearts: S.hearts, flawless: flawless, right: S.right, n: S.n }) : { xp: 0, first: false, cards: [] };
        FX.sfx("level");
        FX.celebrate(true);
        FX.overlay('<div class="lu-k">Boss defeated</div><div class="chest" aria-hidden="true">' + b.icon + '</div><div class="lu-rank"><b>' + esc(b.name) + "</b> falls!</div>" +
          '<div class="lu-sub">' + S.right + " of " + S.n + " right · " + fmtTime(ms) + " · " + S.hearts + " ❤️ left" + (flawless ? " · <b>FLAWLESS 💠</b>" : "") + "</div>" +
          '<div class="lu-rank">+' + res.xp + " XP</div>" + (res.cards && res.cards.length ? '<div class="lu-sub">New card' + (res.cards.length > 1 ? "s" : "") + ": " + res.cards.map(esc).join(", ") + "</div>" : ""),
          { cls: "levelup", label: "Boss defeated", button: "Claim loot", onClose: function () { intro(); } });
      }
      function defeat() {
        if (CL.Game && CL.Game.bossResult) CL.Game.bossResult(b.id, { won: false, ms: Date.now() - S.t0, hearts: 0, right: S.right, n: S.n });
        FX.sfx("over");
        resEl.innerHTML = "";
        qEl.innerHTML = '<div class="bf-lost"><div class="bi-orb" aria-hidden="true">💀</div><h2>Defeated</h2><p>' + esc(b.name) + " survives with " + S.hp + " HP. You got " + S.right + " of " + S.n + " right.</p>" +
          (b.lesson ? '<p>Every miss is now in your review queue. Study <a href="#l-' + b.lesson + '">the deep dive</a>, then come back stronger.</p>' : "") +
          '<div class="btns"><button type="button" class="btn primary bf-again">⚔️ Try again</button><a class="btn" href="#boss">All bosses</a></div></div>';
        qEl.querySelector(".bf-again").addEventListener("click", fight);
      }
      B.liveHint = function () { return S.q && !S.answered ? S.q.mcq.answer : null; };
      paint();
      ask();
    }
    intro();
  }
  CL.pages = CL.pages || {};
  CL.pages.boss = { nav: "arcade", draw: lobby };
  CL.pages["boss-"] = { nav: "arcade", draw: battle };

  // ================================================================ THE ALGORITHM CARDS
  // unlock: any one condition; foil: every condition. "l:" a lesson completed, "b:" a boss defeated, "bf:" a boss defeated flawlessly
  var CARDS = [
    { id: "pointer", name: "Pointer", kind: "Concept", icon: "👉", rarity: "common", stats: ["Holds an address", "p->x means (*p).x", "NULL points nowhere"], power: "Links nodes anywhere on the heap.", weak: "Dangling after delete; following NULL crashes.", unlock: ["l:b6-deep-memory", "b:cpp"], foil: ["l:b6-deep-memory", "b:cpp"] },
    { id: "list", name: "Linked List", kind: "Data structure", icon: "⛓️", rarity: "common", stats: ["Search O(n)", "Insert at head O(1)", "Insert at tail O(n)"], power: "Grows one node at a time; O(1) at the head.", weak: "No random access: reading item i is O(n).", unlock: ["l:c6-deep-lists", "b:lists"], foil: ["l:c6-deep-lists", "b:lists"] },
    { id: "recursion", name: "Recursion", kind: "Technique", icon: "🌀", rarity: "rare", stats: ["Base case + smaller problem", "Depth O(n) on a list", "Proved by induction"], power: "Mirrors recursive data: a list is a head plus a tail.", weak: "No base case → stack overflow; forget to return the call → wrong answer.", unlock: ["l:d4-deep-recursion", "b:recursion"], foil: ["l:d4-deep-recursion", "b:recursion"] },
    { id: "stack", name: "Stack", kind: "Data structure", icon: "🥞", rarity: "common", stats: ["push O(1)", "pop O(1)", "Last in, first out"], power: "Reverses order; powers recursion, undo and bracket matching.", weak: "Popping an empty stack.", unlock: ["l:e4-deep-stacks-queues", "b:stacks"], foil: ["l:e4-deep-stacks-queues", "b:stacks"] },
    { id: "queue", name: "Queue", kind: "Data structure", icon: "🚶", rarity: "common", stats: ["enqueue O(1) with a tail", "dequeue O(1)", "First in, first out"], power: "Keeps order of arrival: level order and BFS.", weak: "Dequeue the last node and forget tail = NULL.", unlock: ["l:e4-deep-stacks-queues", "b:stacks"], foil: ["l:e4-deep-stacks-queues", "b:stacks"] },
    { id: "btree", name: "Binary Tree", kind: "Data structure", icon: "🌳", rarity: "rare", stats: ["Traversals O(n)", "n nodes → n + 1 NULLs", "h ≥ log₂(n + 1) − 1"], power: "Hierarchies; expression trees give prefix, infix, postfix.", weak: "Preorder + postorder cannot rebuild it.", unlock: ["l:f5-deep-trees", "b:trees"], foil: ["l:f5-deep-trees", "b:trees"] },
    { id: "bst", name: "Binary Search Tree", kind: "Data structure", icon: "🔎", rarity: "rare", stats: ["Search O(h)", "Insert O(h)", "Inorder = sorted"], power: "Sorted order for free; successor in O(h).", weak: "Sorted insertions make it degenerate: O(n).", unlock: ["l:g6-deep-bst", "b:bst"], foil: ["l:g6-deep-bst", "b:bst"] },
    { id: "avl", name: "AVL Tree", kind: "Data structure", icon: "⚖️", rarity: "epic", stats: ["Height O(log n), always", "Search O(log n)", "Rotations on insert"], power: "A BST that rebalances itself.", weak: "More code: heights and four rotation cases.", unlock: ["l:m4-avl-trees"], foil: ["l:m4-avl-trees", "b:bst"] },
    { id: "heap", name: "Max-Heap", kind: "Data structure", icon: "⛰️", rarity: "rare", stats: ["Maximum O(1)", "Insert, extract O(log n)", "buildMaxHeap O(n)"], power: "Children at 2i and 2i + 1: a tree in an array.", weak: "Searching for a key is O(n).", unlock: ["l:h5-deep-heaps", "b:heaps"], foil: ["l:h5-deep-heaps", "b:heaps"] },
    { id: "pq", name: "Priority Queue", kind: "Data structure", icon: "👑", rarity: "epic", stats: ["insert O(log n)", "maximum O(1)", "extractMax O(log n)"], power: "Always serves the most important item; drives Dijkstra.", weak: "No fast search or ordered listing.", unlock: ["b:heaps"], foil: ["b:heaps", "l:h4-insert-priority"] },
    { id: "hash", name: "Hash Table", kind: "Data structure", icon: "#️⃣", rarity: "epic", stats: ["Search O(1) average", "h = key % N + 1", "Keep α under 0.7"], power: "Constant-time search, insert and delete.", weak: "Worst case O(n); clustering; no order.", unlock: ["l:i4-deep-hashing", "b:hashing"], foil: ["l:i4-deep-hashing", "b:hashing"] },
    { id: "chain", name: "Chaining", kind: "Technique", icon: "🔗", rarity: "rare", stats: ["Average chain length α", "Never full", "New keys at the front"], power: "Collisions just share a list.", weak: "Extra memory for every node.", unlock: ["l:i3-chaining-strings", "b:hashing"], foil: ["l:i3-chaining-strings", "b:hashing"] },
    { id: "graph", name: "Graph", kind: "Data structure", icon: "🕸️", rarity: "rare", stats: ["Matrix O(V²) memory", "Lists O(V + E)", "Σ degrees = 2|E|"], power: "Models roads, networks and friendships.", weak: "The wrong representation makes every algorithm slow.", unlock: ["l:j6-deep-graphs", "b:graphs"], foil: ["l:j6-deep-graphs", "b:graphs"] },
    { id: "bfs", name: "Breadth-First Search", kind: "Algorithm", icon: "🌊", rarity: "rare", stats: ["O(V + E)", "Uses a queue", "Visits in distance order"], power: "Shortest paths when counting edges.", weak: "Mark GREY on enqueue, or vertices repeat.", unlock: ["l:j3-bfs-dfs", "b:graphs"], foil: ["l:j3-bfs-dfs", "b:graphs"] },
    { id: "dfs", name: "Depth-First Search", kind: "Algorithm", icon: "🕳️", rarity: "rare", stats: ["O(V + E)", "Uses the call stack", "GREY neighbour = cycle"], power: "Explores deep; finds cycles.", weak: "Recursion depth up to V.", unlock: ["l:j3-bfs-dfs", "b:graphs"], foil: ["l:j3-bfs-dfs", "b:graphs"] },
    { id: "dijkstra", name: "Dijkstra", kind: "Algorithm", icon: "🧭", rarity: "epic", stats: ["O(V²) with an array", "Min-priority queue", "Finished = final"], power: "Shortest weighted paths from one source.", weak: "Breaks on negative edges.", unlock: ["l:j4-dijkstra", "b:graphs"], foil: ["l:j4-dijkstra", "b:graphs", "l:j6-deep-graphs"] },
    { id: "kruskal", name: "Kruskal", kind: "Algorithm", icon: "🪓", rarity: "epic", stats: ["O(E log E)", "Cheapest safe edge", "V − 1 edges"], power: "The cut property makes every choice safe.", weak: "Must detect cycles (same tree).", unlock: ["l:j5-mst", "b:graphs"], foil: ["l:j5-mst", "b:graphs", "l:j6-deep-graphs"] },
    { id: "prim", name: "Prim", kind: "Algorithm", icon: "🌱", rarity: "epic", stats: ["O(V²) with arrays", "Grows one tree", "Lightest edge out"], power: "Builds an MST from a single start vertex.", weak: "Only for connected undirected graphs.", unlock: ["l:j5-mst", "b:graphs"], foil: ["l:j5-mst", "b:graphs", "l:j6-deep-graphs"] },
    { id: "floyd", name: "Floyd", kind: "Algorithm", icon: "🗺️", rarity: "epic", stats: ["O(V³)", "All pairs at once", "k outermost"], power: "Every shortest path; negative edges are fine.", weak: "V³ is slow for big graphs.", unlock: ["l:n2-floyd"], foil: ["l:n2-floyd", "b:graphs"] },
    { id: "selection", name: "Selection Sort", kind: "Algorithm", icon: "👆", rarity: "common", stats: ["Always n(n − 1)/2 comparisons", "n − 1 swaps", "In place"], power: "Few swaps.", weak: "O(n²) even on sorted input; not stable.", unlock: ["l:k1-simple-sorts", "b:sorting"], foil: ["l:k1-simple-sorts", "b:sorting"] },
    { id: "insertion", name: "Insertion Sort", kind: "Algorithm", icon: "🃏", rarity: "common", stats: ["Best O(n)", "Worst O(n²)", "Stable"], power: "Lightning fast on almost sorted input.", weak: "Reversed input: n(n − 1)/2 comparisons.", unlock: ["l:k1-simple-sorts", "b:sorting"], foil: ["l:k1-simple-sorts", "b:sorting"] },
    { id: "merge", name: "Merge Sort", kind: "Algorithm", icon: "🔀", rarity: "epic", stats: ["O(n log n) always", "Stable", "O(n) extra memory"], power: "2T(n/2) + n: guaranteed n log n.", weak: "Not in place.", unlock: ["l:k2-merge-sort", "b:sorting"], foil: ["l:k2-merge-sort", "b:sorting", "l:k5-deep-sorting"] },
    { id: "quick", name: "Quick Sort", kind: "Algorithm", icon: "⚡", rarity: "epic", stats: ["Average O(n log n)", "Worst O(n²)", "In place"], power: "Fast in practice; the pivot lands in its final place.", weak: "Sorted input with the last pivot: O(n²); not stable.", unlock: ["l:k3-quick-sort", "b:sorting"], foil: ["l:k3-quick-sort", "b:sorting", "l:k5-deep-sorting"] },
    { id: "heapsort", name: "Heap Sort", kind: "Algorithm", icon: "🏔️", rarity: "epic", stats: ["O(n log n) always", "In place", "Not stable"], power: "Guaranteed n log n with O(1) memory.", weak: "Not stable.", unlock: ["l:h3-delete-heapsort", "b:heaps"], foil: ["l:h3-delete-heapsort", "b:heaps", "b:sorting"] },
    { id: "counting", name: "Counting Sort", kind: "Algorithm", icon: "🔢", rarity: "rare", stats: ["O(n + k)", "No comparisons", "Stable"], power: "Beats n log n by using keys as indexes.", weak: "A huge key range k wastes memory.", unlock: ["l:n4-integer-sorting"], foil: ["l:n4-integer-sorting", "b:sorting"] },
    { id: "bigo", name: "Big-O", kind: "Concept", icon: "📈", rarity: "legendary", stats: ["f ≤ c·g for n ≥ n₀", "Loops multiply", "log base irrelevant"], power: "Predicts how any algorithm scales.", weak: "Ignores constants: small inputs can surprise you.", unlock: ["l:l3-deep-big-o", "b:bigo"], foil: ["l:l3-deep-big-o", "bf:bigo"] },
    { id: "final", name: "The Final Exam", kind: "Legend", icon: "🎓", rarity: "legendary", stats: ["Every topic", "15 HP", "No mercy"], power: "Proof that you know the whole course.", weak: "None left.", unlock: ["b:final"], foil: ["bf:final"] }
  ];
  function cond(c) {
    var store = CL.store || {}, i = c.indexOf(":"), k = c.slice(0, i), v = c.slice(i + 1);
    if (k === "l") return !!(store.done && store.done[v]);
    if (k === "b") return !!bstate(v).wins;
    if (k === "bf") return !!bstate(v).flawless;
    return false;
  }
  var C = CL.Collection = { cards: CARDS };
  C.unlocked = function (card) { return card.unlock.some(cond); };
  C.foiled = function (card) { return card.foil.every(cond); };
  // mark newly earned cards (with a toast unless silent); returns the names of new cards
  C.check = function (silent) {
    var g = gstate();
    if (!g) return [];
    g.cards = g.cards || {};
    g.foils = g.foils || {};
    var fresh = [];
    CARDS.forEach(function (card) {
      if (!g.cards[card.id] && C.unlocked(card)) {
        g.cards[card.id] = Date.now();
        fresh.push(card.name);
        if (!silent) FX.toast('<div class="ach-badge card-' + card.rarity + '">' + card.icon + '</div><div><div class="fx-k">New ' + card.rarity + ' card</div><b>' + esc(card.name) + '</b><div class="fx-d">' + esc(card.power) + "</div></div>", "ach", 5200);
      }
      if (!g.foils[card.id] && C.foiled(card)) {
        g.foils[card.id] = Date.now();
        if (!silent) FX.toast('<div class="ach-badge card-holo">' + card.icon + '</div><div><div class="fx-k">Holographic upgrade</div><b>' + esc(card.name) + '</b><div class="fx-d">You mastered it both ways.</div></div>', "ach", 5200);
      }
    });
    return fresh;
  };
  function hint(card) {
    var D = window.CODELAB_DATA, out = card.unlock.map(function (c) {
      var i = c.indexOf(":"), k = c.slice(0, i), v = c.slice(i + 1);
      if (k === "l") return "complete “" + (D.lessons[v] ? D.lessons[v].title : v) + "”";
      if (k === "b") return "defeat " + (B.byId[v] ? B.byId[v].name : v);
      return "defeat " + (B.byId[v] ? B.byId[v].name : v) + " flawlessly";
    });
    return "Unlock: " + out.join(", or ");
  }
  function collection(ui) {
    var p = ui.page("cards-page");
    ui.setTutor("progress", "Algorithm Cards", function () { return "The Algorithm Card collection: revision cards unlocked by deep dives and bosses. " + ui.progressText(); });
    C.check(false);
    var g = gstate(), got = CARDS.filter(function (c) { return g.cards && g.cards[c.id]; }).length, holo = CARDS.filter(function (c) { return g.foils && g.foils[c.id]; }).length;
    p.innerHTML = '<div class="eyebrow">Collection</div><h1 class="title">Algorithm Cards</h1><p class="lede">Every card is a revision card: tap it to flip it and read its power and its weakness (the exam trap). Unlock a card with its deep-dive lesson <b>or</b> its boss; do <b>both</b> and it turns holographic.</p>' +
      '<div class="boss-prog"><div class="xpbar"><i style="width:' + Math.round(100 * got / CARDS.length) + '%"></i></div><span><b>' + got + "</b> of " + CARDS.length + " cards · <b>" + holo + "</b> holographic</span></div>" +
      '<div class="acard-grid">' + CARDS.map(function (card) {
        var have = g.cards && g.cards[card.id], foil = g.foils && g.foils[card.id];
        if (!have) return '<div class="acard locked r-' + card.rarity + '"><div class="acard-in"><div class="acard-front"><span class="acard-icon" aria-hidden="true">❔</span><b>' + esc(card.name) + '</b><span class="acard-kind">' + esc(card.rarity) + '</span><span class="acard-hint">' + esc(hint(card)) + "</span></div></div></div>";
        return '<button type="button" class="acard r-' + card.rarity + (foil ? " foil" : "") + '" aria-pressed="false" aria-label="' + esc(card.name) + ' card: tap to flip"><div class="acard-in"><div class="acard-front"><span class="acard-rar">' + esc(card.rarity) + (foil ? " · holo" : "") + '</span><span class="acard-icon" aria-hidden="true">' + card.icon + "</span><b>" + esc(card.name) + '</b><span class="acard-kind">' + esc(card.kind) + '</span><ul class="acard-stats">' + card.stats.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>" +
          '<div class="acard-back"><span class="acard-rar">' + esc(card.name) + '</span><div class="acard-sec"><i>Power</i><p>' + esc(card.power) + '</p></div><div class="acard-sec weak"><i>Weakness · exam trap</i><p>' + esc(card.weak) + "</p></div></div></div></button>";
      }).join("") + "</div>";
    p.querySelector(".acard-grid").addEventListener("click", function (e) {
      var c = e.target.closest("button.acard");
      if (!c) return;
      var on = !c.classList.contains("flipped");
      c.classList.toggle("flipped", on);
      c.setAttribute("aria-pressed", on ? "true" : "false");
      FX.sfx("tick");
    });
  }
  CL.pages.collection = { nav: "progress", draw: collection };
})(CL);
