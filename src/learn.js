/* COMP 2611 Code Lab — adaptive learning: the concept map, mastery estimates, spaced-repetition scheduling,
   flashcard decks, learning paths and the diagnostic test. Pages that use these live in app.js. */
(function (CL) {
  "use strict";
  var L = CL.Learn = {};
  function S() { return CL.store; }
  var DAY = 86400000;

  // ---------------------------------------------------------------- the concept map
  // [id, title, topic, lessons, question generators, prerequisite concepts]
  var C = [
    ["cpp.basics", "C++ basics: types, decisions, loops, functions", "cpp", ["a1-first-program", "a2-variables", "a3-decisions", "a4-loops", "a5-functions"], [], []],
    ["cpp.refs", "References and pass-by-reference", "cpp", ["a6-references"], [], ["cpp.basics"]],
    ["cpp.arrays", "Arrays, strings, structs and files", "cpp", ["a7-arrays", "a8-strings", "a9-structs", "a10-files", "a11-organizing"], [], ["cpp.basics"]],
    ["cpp.ptr", "Pointers: addresses, & and *", "cpp", ["b1-addresses", "b2-pointers-structs", "b5-pointers-arrays"], ["cpp-ptr"], ["cpp.arrays"]],
    ["cpp.mem", "new, delete and memory errors", "cpp", ["b3-new-delete", "b4-pitfalls"], [], ["cpp.ptr"]],
    ["list.build", "Building a list and insertAtHead", "lists", ["c1-building"], [], ["cpp.mem"]],
    ["list.trav", "Traversing a list", "lists", ["c2-traversal"], ["ll-code"], ["list.build"]],
    ["list.insert", "List operations: insert and delete", "lists", ["c3-insertion", "c4-deletion"], ["ll-ops"], ["list.trav"]],
    ["list.more", "More list operations", "lists", ["c5-more-ops"], ["facts-lists", "classic-lists"], ["list.trav"]],
    ["rec.basics", "How recursion works", "recursion", ["d1-how-recursion-works"], ["rec-trace"], ["cpp.basics"]],
    ["rec.lists", "Recursion on lists and arrays", "recursion", ["d2-recursion-lists", "d3-recursion-arrays"], [], ["rec.basics", "list.trav"]],
    ["sq.stack", "Stacks and queues", "stacks", ["e1-stacks", "e2-queues"], ["sq-ops", "facts-stacks"], ["list.build"]],
    ["sq.apps", "Using stacks and queues", "stacks", ["e3-applications"], ["sq-brackets"], ["sq.stack"]],
    ["tree.terms", "Tree terms: moment, weight, height, level", "trees", ["f1-terminology"], ["bt-props", "facts-trees", "classic-trees"], ["rec.basics"]],
    ["tree.trav", "Preorder, inorder and postorder", "trees", ["f2-traversals"], ["bt-trav", "bt-rebuild"], ["tree.terms"]],
    ["tree.code", "Recursive tree functions", "trees", ["f3-tree-code"], ["bt-code"], ["tree.trav", "rec.basics"]],
    ["tree.shape", "Level order and tree shapes", "trees", ["f4-level-order-types"], ["bt-shape"], ["tree.terms", "sq.stack"]],
    ["bst.prop", "The BST property", "bst", ["g1-bst-property"], ["bst-valid", "bst-order", "facts-bst", "classic-bst"], ["tree.trav"]],
    ["bst.insert", "BST insert and search", "bst", ["g2-insert-search"], ["bst-build", "bst-search"], ["bst.prop"]],
    ["bst.succ", "Parent pointers and the inorder successor", "bst", ["g3-parent-successor"], ["bst-succ"], ["bst.insert"]],
    ["bst.delete", "Deleting from a BST", "bst", ["g4-deletion"], ["bst-delete"], ["bst.succ"]],
    ["bst.perf", "BST shapes and performance", "bst", ["g5-performance"], [], ["bst.insert"]],
    ["heap.array", "Heaps stored in arrays", "heaps", ["h1-heap-arrays"], ["heap-index", "heap-check", "facts-heaps", "classic-heaps"], ["tree.shape"]],
    ["heap.build", "maxHeapify and buildMaxHeap", "heaps", ["h2-heapify-build"], ["heap-build", "heap-heapify"], ["heap.array"]],
    ["heap.extract", "Extracting the maximum and heap sort", "heaps", ["h3-delete-heapsort"], ["heap-extract", "heap-sort"], ["heap.build"]],
    ["heap.insert", "Insert, increase key and priority queues", "heaps", ["h4-insert-priority"], ["heap-insert", "heap-increase"], ["heap.array"]],
    ["hash.basic", "Hash tables and linear probing", "hashing", ["i1-hash-tables"], ["hash-search", "facts-hashing"], ["cpp.arrays"]],
    ["hash.probe", "Quadratic probing and double hashing", "hashing", ["i2-probing"], ["hash-insert", "hash-step"], ["hash.basic"]],
    ["hash.chain", "Chaining and string keys", "hashing", ["i3-chaining-strings"], ["hash-chain"], ["hash.basic", "list.build"]],
    ["graph.basics", "Graph terms and representations", "graphs", ["j1-graph-basics", "j2-graph-code"], ["graph-degree", "facts-graphs"], []],
    ["graph.trav", "Breadth-first and depth-first search", "graphs", ["j3-bfs-dfs"], ["graph-trav"], ["graph.basics", "sq.stack"]],
    ["graph.dijkstra", "Dijkstra's shortest paths", "graphs", ["j4-dijkstra"], ["graph-dijkstra"], ["graph.trav"]],
    ["graph.mst", "Minimum-cost spanning trees", "graphs", ["j5-mst"], ["graph-mst"], ["graph.basics"]],
    ["sort.simple", "Selection, bubble and insertion sort", "sorting", ["k1-simple-sorts"], ["sort-pass", "sort-which"], ["cpp.arrays"]],
    ["sort.merge", "Merge sort", "sorting", ["k2-merge-sort"], ["sort-merge"], ["rec.lists"]],
    ["sort.quick", "Quick sort and partition", "sorting", ["k3-quick-sort"], ["sort-partition"], ["rec.lists"]],
    ["sort.perf", "Comparing the sorts", "sorting", ["k4-sorting-performance"], ["facts-sorting"], ["sort.simple", "sort.merge", "sort.quick"]],
    ["bigo.code", "Big-O of code", "bigo", ["l1-performance"], ["bigo-code"], ["cpp.basics"]],
    ["bigo.ops", "The cost of each operation", "bigo", ["l2-exam-technique"], ["bigo-ops", "bigo-which", "facts-bigo", "classic-bigo"], ["bigo.code"]]
  ];
  L.concepts = C.map(function (c) { return { id: c[0], title: c[1], topic: c[2], lessons: c[3], gens: c[4], pre: c[5] }; });
  // null-prototype maps: ids can come from imported or synced progress, so "__proto__" must not find anything
  L.byId = Object.create(null);
  var byLesson = Object.create(null), byGen = Object.create(null);
  L.concepts.forEach(function (c) {
    L.byId[c.id] = c;
    c.lessons.forEach(function (l) { if (!byLesson[l]) byLesson[l] = c.id; });
    c.gens.forEach(function (g) { if (!byGen[g]) byGen[g] = c.id; });
  });
  // supplementary lessons (outside the lecture notes) attach to a concept of their own topic when they say so
  L.addLesson = function (lessonId, conceptId) { if (!byLesson[lessonId] && L.byId[conceptId]) { byLesson[lessonId] = conceptId; L.byId[conceptId].lessons.push(lessonId); } };
  L.forLesson = function (lid) { return byLesson[lid] || null; };
  // supplementary lessons count towards the concept they extend
  L.addLesson("m1-doubly-circular", "list.more");
  L.addLesson("m2-circular-queue", "sq.stack");
  L.addLesson("m3-binary-search", "bigo.code");
  // course-outline lessons count towards the concept they build on
  L.addLesson("n1-special-matrices", "cpp.arrays");
  L.addLesson("n2-floyd", "graph.dijkstra");
  L.addLesson("n3-graph-isomorphism", "graph.basics");
  L.addLesson("n4-integer-sorting", "sort.perf");
  L.addLesson("n5-trees-proofs", "tree.shape");
  // the deep-dive theory lessons count towards their part's main concept
  L.addLesson("b6-deep-memory", "cpp.mem");
  L.addLesson("c6-deep-lists", "list.insert");
  L.addLesson("d4-deep-recursion", "rec.basics");
  L.addLesson("e4-deep-stacks-queues", "sq.apps");
  L.addLesson("f5-deep-trees", "tree.trav");
  L.addLesson("g6-deep-bst", "bst.succ");
  L.addLesson("h5-deep-heaps", "heap.build");
  L.addLesson("i4-deep-hashing", "hash.probe");
  L.addLesson("j6-deep-graphs", "graph.dijkstra");
  L.addLesson("k5-deep-sorting", "sort.quick");
  L.addLesson("l3-deep-big-o", "bigo.code");
  L.addLesson("m4-avl-trees", "bst.perf");
  L.forGen = function (g) { return byGen[g] || null; };
  L.forQuestion = function (q) {
    if (!q) return null;
    if (q.gen === "hash-insert" && q.lab && q.lab.preset && q.lab.preset.method === "linear") return "hash.basic";
    if (q.gen === "cpp-ptr" && (q.ptrIndex === 1 || q.ptrIndex === 4)) return "cpp.refs";
    if (q.gen === "classic") {
      var it = CL.Train.bank().filter(function (x) { return x.id === q.seed; })[0], tp = it && CL.Train.CLASSIC_TOPIC[it.topic];
      return tp ? L.forGen("classic-" + tp) : null;
    }
    return L.forGen(q.gen) || (q.topic ? (L.topicConcepts(q.topic)[0] || null) : null);
  };
  L.topicConcepts = function (topic) { return L.concepts.filter(function (c) { return c.topic === topic; }).map(function (c) { return c.id; }); };
  // the labs' "Your turn" predictions count as evidence for these concepts
  L.forLab = { memory: "cpp.mem", lists: "list.insert", stackqueue: "sq.stack", recursion: "rec.basics", traversal: "tree.trav", bst: "bst.insert", heap: "heap.build", hash: "hash.probe", graph: "graph.trav", sort: "sort.simple", avl: "bst.perf" };

  // question difficulty, 1 (warm-up) to 3 (exam's hardest), by generator
  var LEVEL = {
    "bt-props": 1, "bt-trav": 1, "bst-search": 1, "heap-index": 1, "heap-check": 1, "hash-step": 1, "graph-degree": 1, "sort-pass": 1, "bigo-code": 1, "bigo-ops": 1, "bigo-which": 1,
    "ll-ops": 1, "sq-ops": 1, "sq-brackets": 1, "cpp-ptr": 1, "rec-trace": 2,
    "bst-build": 2, "bst-succ": 2, "heap-build": 2, "heap-insert": 2, "heap-heapify": 2, "hash-insert": 2, "hash-chain": 2, "graph-trav": 2, "sort-which": 2, "ll-code": 2, "bt-code": 2, "bt-shape": 2,
    "bst-valid": 2, "sort-merge": 2, "heap-increase": 2,
    "bst-delete": 3, "bst-order": 3, "bt-rebuild": 3, "heap-extract": 2, "heap-sort": 3, "hash-search": 3, "graph-dijkstra": 3, "graph-mst": 3, "sort-partition": 3
  };
  L.level = function (genId) { return LEVEL[genId] || 2; };
  // a question's level: hand-written mock questions are Core at 1 mark and Exam-hard at 2 marks
  L.levelOf = function (q) { return q.gen === "classic" || /^classic-/.test(q.gen) ? (q.marks > 1 ? 3 : 2) : L.level(q.gen); };
  L.LEVEL_NAME = ["", "Warm-up", "Core", "Exam-hard"];

  // ---------------------------------------------------------------- mastery
  // each concept keeps {n: evidence, s: estimate 0..1, t: last practised}; recent answers count more than old ones
  L.record = function (cid, ok, w) {
    if (!cid || !L.byId[cid]) return;
    w = w || 1;
    var cm = S().cm = S().cm || {}, x = cm[cid] = cm[cid] || { n: 0, s: 0, t: 0 };
    var a = Math.min(0.6, w * Math.max(0.12, 1 / (x.n + 2)));
    x.s = Math.round((x.s + a * ((ok ? 1 : 0) - x.s)) * 1000) / 1000;
    x.n = Math.round((x.n + w) * 10) / 10;
    x.t = Date.now();
  };
  L.mastery = function (cid) {
    var x = (S().cm || {})[cid];
    if (!x || !x.n) return { n: 0, s: 0, t: 0, label: "Not started", cls: "m0", pct: 0 };
    var stale = Date.now() - x.t > 14 * DAY;
    var lv = x.s < 0.4 ? ["Shaky", "m1"] : x.s < 0.65 ? ["Learning", "m2"] : x.s < 0.85 || x.n < 4 ? ["Good", "m3"] : ["Strong", "m4"];
    return { n: x.n, s: x.s, t: x.t, label: lv[0], cls: lv[1], pct: Math.round(x.s * 100), stale: stale && x.s >= 0.65 };
  };
  // how much each concept needs practice now: weak, little evidence, not seen lately, or a prerequisite of a weak one
  L.need = function (cid) {
    var m = L.mastery(cid), c = L.byId[cid];
    var v = 1 - (m.n ? m.s : 0.45);
    if (m.n < 3) v += 0.25;
    if (m.t && Date.now() - m.t > 7 * DAY) v += 0.15;
    var weakPre = c.pre.filter(function (p) { var pm = L.mastery(p); return pm.n >= 2 && pm.s < 0.4; });
    if (weakPre.length) v -= 0.3;
    return v;
  };
  // a prerequisite chain to fix first: the weakest prerequisite that has been tried and is shaky
  L.weakPrereq = function (cid, seen) {
    seen = seen || {};
    var c = L.byId[cid];
    if (!c || seen[cid]) return null;
    seen[cid] = 1;
    for (var i = 0; i < c.pre.length; i++) {
      var p = c.pre[i], pm = L.mastery(p);
      var deeper = L.weakPrereq(p, seen);
      if (deeper) return deeper;
      if (pm.n >= 2 && pm.s < 0.5) return p;
    }
    return null;
  };
  L.practiseable = function (cid) { var c = L.byId[cid]; return c && c.gens.some(function (g) { return CL.Train && CL.Train.byId[g]; }); };
  // choose a generator for a concept at a level that suits the student's mastery
  L.genFor = function (cid, rnd) {
    rnd = rnd || Math.random;
    var c = L.byId[cid];
    var gens = c.gens.filter(function (g) { return CL.Train.byId[g]; });
    if (!gens.length) return null;
    var m = L.mastery(cid), want = !m.n || m.s < 0.5 ? 1 : m.s < 0.8 ? 2 : 3;
    var scored = gens.map(function (g) { var lv = L.level(g); return { g: g, d: Math.abs(lv - want) + (/^facts-|^classic-/.test(g) ? 0.6 : 0) + rnd() * 0.9 }; });
    scored.sort(function (a, b) { return a.d - b.d; });
    return scored[0].g;
  };
  // the adaptive pick: one of the three concepts that need it most
  L.pickConcept = function (rnd, topic) {
    rnd = rnd || Math.random;
    var list = L.concepts.filter(function (c) { return (!topic || c.topic === topic) && L.practiseable(c.id); }).map(function (c) { return { c: c.id, v: L.need(c.id) + rnd() * 0.25 }; });
    list.sort(function (a, b) { return b.v - a.v; });
    var top = list.slice(0, 3);
    return top.length ? top[Math.floor(rnd() * top.length)].c : null;
  };

  // ---------------------------------------------------------------- spaced repetition (a simplified SM-2)
  // grades: 0 Again, 1 Hard, 2 Good, 3 Easy. A study day starts at 4 am, so late-night reviews count for the same day.
  function dayStart(t) { var d = new Date(t); d.setHours(4, 0, 0, 0); if (d.getTime() > t) d.setDate(d.getDate() - 1); return d.getTime(); }
  L.dayStart = dayStart;
  L.srs = function () { return S().srs = S().srs || {}; };
  L.add = function (id, kind, ref, extra) {
    var srs = L.srs();
    if (srs[id]) { if (extra && extra.due0) { srs[id].due = Math.min(srs[id].due, Date.now()); srs[id].u = Date.now(); } return srs[id]; }
    srs[id] = Object.assign({ k: kind, ref: ref, due: Date.now(), iv: 0, ef: 2.5, reps: 0, lapses: 0, u: Date.now() }, extra || {});
    delete srs[id].due0;
    return srs[id];
  };
  function next(it, g, now) {
    var r = { iv: it.iv || 0, ef: it.ef || 2.5, reps: it.reps || 0, lapses: it.lapses || 0 };
    if (g === 0) { r.reps = 0; r.lapses++; r.iv = 0; r.ef = Math.max(1.3, r.ef - 0.2); r.due = now + 10 * 60000; return r; }
    r.reps++;
    if (r.reps === 1) r.iv = g === 3 ? 4 : 1;
    else if (r.reps === 2) r.iv = g === 1 ? 2 : g === 2 ? 3 : 7;
    else r.iv = Math.max(r.iv + 1, Math.round(r.iv * r.ef * (g === 1 ? 0.6 : g === 3 ? 1.3 : 1)));
    var q = g + 2;
    r.ef = Math.max(1.3, Math.round((r.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))) * 100) / 100);
    r.iv = Math.min(r.iv, 180);
    r.due = dayStart(now) + r.iv * DAY;
    return r;
  }
  L.preview = function (it, g) {
    var r = next(it, g, Date.now());
    if (g === 0) return "10 min";
    return r.iv === 1 ? "1 day" : r.iv < 31 ? r.iv + " days" : Math.round(r.iv / 30) + " mo";
  };
  L.grade = function (id, g) {
    var it = L.srs()[id];
    if (!it) return null;
    Object.assign(it, next(it, g, Date.now()));
    it.u = Date.now();
    it.seen = (it.seen || 0) + 1;
    return it;
  };
  L.remove = function (id) { delete L.srs()[id]; };
  L.due = function (kind, at) {
    at = at || Date.now();
    var srs = L.srs();
    return Object.keys(srs).filter(function (id) { var it = srs[id]; return it.due <= at && (!kind || it.k === kind); }).map(function (id) { return Object.assign({ id: id }, srs[id]); }).sort(function (a, b) { return a.due - b.due; });
  };
  L.counts = function () {
    var srs = L.srs(), now = Date.now(), dueQ = 0, dueC = 0, learned = 0, total = 0;
    Object.keys(srs).forEach(function (id) { var it = srs[id]; total++; if (it.due <= now) { if (it.k === "card") dueC++; else dueQ++; } if (it.k === "card" && it.reps >= 2) learned++; });
    return { dueQ: dueQ, dueC: dueC, due: dueQ + dueC, learned: learned, total: total };
  };

  // record one answered practice question: mastery, and the review queue
  L.qid = function (q) { return "q:" + q.gen + ":" + q.seed; };
  L.recordQuestion = function (q, ok, w) {
    var cid = L.forQuestion(q);
    L.record(cid, ok, w || 1);
    var id = L.qid(q), srs = L.srs();
    if (srs[id]) L.grade(id, ok ? 2 : 0);
    else if (!ok) L.add(id, "q", { g: q.gen, s: q.seed, c: cid, t: q.title });
  };
  L.makeReview = function (it) {
    if (!it || !it.ref) return null;
    return it.ref.g === "classic" ? CL.Train.makeClassic(it.ref.s) : CL.Train.make(it.ref.g, it.ref.s);
  };
  // move the old "mistakes" list into the review queue (once)
  L.migrate = function () {
    var st = S();
    if (st.srsMigrated) return;
    (st.miss || []).forEach(function (m) { L.add("q:" + m.g + ":" + m.s, "q", { g: m.g, s: m.s, c: m.g === "classic" ? null : L.forGen(m.g) }); });
    st.srsMigrated = 1;
  };

  // ---------------------------------------------------------------- flashcards
  var cardCache = null;
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40); }
  L.cards = function () {
    if (cardCache) return cardCache;
    var D = window.CODELAB_DATA, out = [];
    var topicOfLesson = function (lid) { var c = L.forLesson(lid); return c ? L.byId[c].topic : "cpp"; };
    (D.glossary || []).forEach(function (g) {
      out.push({ id: "g:" + slug(g.term), deck: topicOfLesson(g.lesson), kind: "term", front: g.term, back: g.def, lesson: g.lesson, section: g.section || null });
    });
    ((CL.Train && CL.Train.OPS) || []).forEach(function (o, i) {
      out.push({ id: "o:" + i, deck: "bigo", kind: "cost", front: o[0], back: o[1], lesson: "l1-performance", section: null });
    });
    Object.keys(D.lessons).forEach(function (lid) {
      var md = D.lessons[lid].md, m = /^:::remember[^\n]*\n([\s\S]*?)^:::\s*$/m.exec(md);
      if (m) out.push({ id: "r:" + lid, deck: topicOfLesson(lid), kind: "summary", front: D.lessons[lid].title, back: m[1].trim(), lesson: lid, section: null });
      var pm = /^:::parsons[^\n]*\n([\s\S]*?)^:::\s*$/m.exec(md);
      if (pm) {
        var lines = pm[1].split("\n").filter(function (l) { return l.trim() && l[0] !== "~"; });
        out.push({ id: "p:" + lid, deck: topicOfLesson(lid), kind: "code", front: lines[0].replace(/\s*\{\s*$/, ""), back: lines.join("\n"), lesson: lid, section: null });
      }
    });
    cardCache = out;
    return out;
  };
  L.cardById = function (id) { var c = L.cards(); for (var i = 0; i < c.length; i++) if (c[i].id === id) return c[i]; return null; };
  L.newToday = function () { var d = CL.Progress.day(), a = (S().act || {})[d]; return (a && a.nc) || 0; };

  // ---------------------------------------------------------------- learning paths
  // step kinds: lesson, practice (a concept to "Good"), exam (a paper), cards (a deck reviewed), lab, gym (exercises passed in a topic), diag
  function lessonsOfPart(part) {
    var D = window.CODELAB_DATA, pt = (D.parts || []).filter(function (x) { return x.id === part; })[0];
    return pt ? pt.lessons.filter(function (k) { return D.lessons[k] && !D.lessons[k].supp; }) : [];
  }
  L.stepDone = function (st) {
    var s = S();
    if (st.k === "lesson") return !!(s.done || {})[st.id];
    if (st.k === "practice") { var m = L.mastery(st.c); return m.n >= (st.n || 5) && m.s >= (st.s || 0.65); }
    if (st.k === "exam") return (s.exams || []).some(function (e) { return e.paper === st.paper && (!st.min || e.score / e.max >= st.min); });
    if (st.k === "cards") { var srs = L.srs(); return L.cards().filter(function (c) { return !st.deck || c.deck === st.deck; }).filter(function (c) { return srs[c.id] && srs[c.id].reps >= 1; }).length >= (st.n || 10); }
    if (st.k === "lab") return ((s.lab || {})[st.id] || {}).n >= (st.n || 5);
    if (st.k === "gym") { var D = window.CODELAB_DATA; return D.exercises.filter(function (e) { return e.topic === st.topic && s.ex && s.ex[e.id] && s.ex[e.id].passed; }).length >= (st.n || 1); }
    if (st.k === "diag") return (s.diag || []).length > 0;
    if (st.k === "written") return Object.keys(s.wr || {}).filter(function (k) { return s.wr[k] && s.wr[k].done; }).length >= (st.n || 1);
    if (st.k === "wq") { var w = (s.wr || {})[st.id]; return !!(w && w.done); }
    if (st.k === "cw2") { var a = ((s.cw2 || {}).att || {})[st.paper]; return !!a && (!st.min || a.best / 40 >= st.min); }
    return false;
  };
  var PART_TOPIC = { b: "cpp", c: "lists", d: "recursion", e: "stacks", f: "trees", g: "bst", h: "heaps", i: "hashing", j: "graphs", k: "sorting", l: "bigo" };
  var GYM_TOPIC = { a: "basics", b: "pointers", c: "linked-lists", d: "recursion", e: "stacks-queues", f: "binary-trees", g: "bst", h: "heaps", i: "hashing", j: "graphs", k: "sorting", n: "outline" };
  function partSteps(part) {
    var steps = lessonsOfPart(part).map(function (id) { return { k: "lesson", id: id }; });
    var topic = PART_TOPIC[part];
    if (topic) L.topicConcepts(topic).filter(L.practiseable).forEach(function (c) { steps.push({ k: "practice", c: c, n: 5, s: 0.65 }); });
    if (GYM_TOPIC[part]) steps.push({ k: "gym", topic: GYM_TOPIC[part], n: 2 });
    return steps;
  }
  L.examDate = function () { var g = S().goal || {}; var t = g.exam ? new Date(g.exam) : new Date(2026, 11, 15, 13, 0); return isNaN(t.getTime()) ? new Date(2026, 11, 15, 13, 0) : t; };
  L.paths = function () {
    var D = window.CODELAB_DATA, parts = (D.parts || []).map(function (p) { return p.id; });
    var beginner = { id: "beginner", title: "Learn the course from the start", sub: "For a first pass through everything", desc: "Every lesson in order, each part followed by practice on its concepts and two Code Gym exercises. Steps tick themselves off as you work.",
      groups: parts.filter(function (p) { return lessonsOfPart(p).length; }).map(function (p) { var part = D.parts.filter(function (x) { return x.id === p; })[0]; return { title: "Part " + p.toUpperCase() + ": " + (part ? part.title : ""), steps: partSteps(p) }; }) };
    // Coursework Exam #2 (Tuesday 17 November 2026, 9:00 am): one area a day, weighted by its marks, then the mock papers
    var W = function (id) { return { k: "wq", id: id }; };
    var cwDays = [
      ["Linked lists", "Question 1 is about 9 marks on linked lists, stacks and queues. Write each list function on paper first, then check it.", ["c2-traversal", "c3-insertion", "c4-deletion", "c5-more-ops"], ["lists"], [W("w-ll-count"), W("w-ll-delete"), { k: "gym", topic: "linked-lists", n: 2 }]],
      ["Stacks and queues: using them", "You will not have to write a stack or a queue, but you may have to use one: a queue in a level-order traversal, a stack to reverse values or check brackets. The online lab today (Week 11) reviews past-paper questions.", ["e1-stacks", "e2-queues", "e3-applications"], ["stacks"], [W("w-sq-brackets"), { k: "lab", id: "stackqueue", n: 5 }]],
      ["Binary trees", "Question 2 is about 11 marks on binary trees and BSTs: the terms, the traversals, level order with a queue, rebuilding a tree from two traversals, and recursive tree functions.", ["f1-terminology", "f2-traversals", "f3-tree-code", "f4-level-order-types"], ["trees"], [W("w-bt-terms"), W("w-bt-rebuild"), W("w-bt-height"), W("w-bt-leaves"), { k: "lab", id: "traversal", n: 8 }]],
      ["Binary search trees", "Insert, search, delete in all three cases, the inorder successor with parent pointers, and why a degenerate tree is slow.", ["g1-bst-property", "g2-insert-search", "g3-parent-successor", "g4-deletion", "g5-performance"], ["bst"], [W("w-bst-delete"), W("w-bst-succ"), W("w-bst-perf"), { k: "lab", id: "bst", n: 8 }]],
      ["Heaps and priority queues", "Question 3 is about 10 marks: the array layout, maxHeapify, buildMaxHeap, extract, insert, increase key, heap sort and the priority-queue operations with their running times.", ["h1-heap-arrays", "h2-heapify-build", "h3-delete-heapsort", "h4-insert-priority"], ["heaps"], [W("w-heap-build"), W("w-heap-extract"), W("w-heap-why"), { k: "lab", id: "heap", n: 8 }]],
      ["Hashing, graphs and performance", "Question 4: about 7 marks on hashing and graphs and 3 on performance. Probe sequences, BFS and DFS orders, Dijkstra's table, and big-O with a reason.", ["i1-hash-tables", "i2-probing", "i3-chaining-strings", "j1-graph-basics", "j3-bfs-dfs", "j4-dijkstra", "l1-performance"], ["hashing", "graphs", "bigo"], [W("w-hash-linear"), W("w-graph-bfs"), W("w-graph-dijkstra"), W("w-bigo-loops"), { k: "exam", paper: "cw2drill" }]],
      ["Mock papers under exam conditions", "Sit a paper in 90 minutes, mark it honestly against its scheme, then go back to the area where you lost the most marks.", [], [], [{ k: "cw2", paper: "A" }, { k: "cw2", paper: "B" }]],
      ["The last paper, then rest", "The exam is tomorrow, 9:00 to 10:30 am, in the JFK Auditorium. Sit the last paper in the morning, look again at what you got wrong, and get a good night's sleep.", [], [], [{ k: "cw2", paper: "C" }, { k: "cards", deck: "trees", n: 8 }, { k: "cards", deck: "heaps", n: 8 }]]
    ];
    var cwStart = new Date(2026, 10, 9);
    var cw2 = { id: "cw2", title: "Coursework Exam #2 in eight days", sub: "Tuesday 17 November, 9:00 am, JFK Auditorium", desc: "A day-by-day plan for the second coursework exam (4 short-answer questions, 40 marks): one area of the course outline a day, weighted by its marks, then the three mock papers in the exam's format.",
      groups: cwDays.map(function (d, i) {
        var from = new Date(cwStart.getFullYear(), cwStart.getMonth(), cwStart.getDate() + i), to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
        var steps = d[2].filter(function (id) { return D.lessons[id]; }).map(function (id) { return { k: "lesson", id: id }; });
        d[3].forEach(function (t) { L.topicConcepts(t).filter(L.practiseable).forEach(function (c) { steps.push({ k: "practice", c: c, n: 5, s: 0.65 }); }); });
        return { title: from.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) + ": " + d[0], note: d[1], steps: steps.concat(d[4]), from: from.getTime(), to: to.getTime(), nowLabel: "today" };
      }) };
    var ex = L.examDate(), weeks = [];
    var plan = [
      ["Diagnose, then fix the foundations", [{ k: "diag" }, { k: "practice", c: "cpp.ptr" }, { k: "practice", c: "list.trav" }, { k: "practice", c: "list.insert" }, { k: "practice", c: "rec.basics" }, { k: "practice", c: "sq.stack" }, { k: "cards", deck: "cpp", n: 10 }, { k: "cards", deck: "lists", n: 8 }]],
      ["Trees and binary search trees", [{ k: "practice", c: "tree.terms" }, { k: "practice", c: "tree.trav" }, { k: "practice", c: "tree.code" }, { k: "practice", c: "tree.shape" }, { k: "practice", c: "bst.prop" }, { k: "practice", c: "bst.insert" }, { k: "practice", c: "bst.succ" }, { k: "practice", c: "bst.delete" }, { k: "exam", paper: "cw1" }]],
      ["Heaps and hashing", [{ k: "practice", c: "heap.array" }, { k: "practice", c: "heap.build" }, { k: "practice", c: "heap.extract" }, { k: "practice", c: "heap.insert" }, { k: "practice", c: "hash.basic" }, { k: "practice", c: "hash.probe" }, { k: "practice", c: "hash.chain" }, { k: "cards", deck: "heaps", n: 8 }]],
      ["Graphs, sorting and big-O", [{ k: "practice", c: "graph.basics" }, { k: "practice", c: "graph.trav" }, { k: "practice", c: "graph.dijkstra" }, { k: "practice", c: "graph.mst" }, { k: "practice", c: "sort.simple" }, { k: "practice", c: "sort.merge" }, { k: "practice", c: "sort.quick" }, { k: "practice", c: "bigo.code" }, { k: "practice", c: "bigo.ops" }, { k: "exam", paper: "second" }]],
      ["Exam conditions", [{ k: "exam", paper: "all" }, { k: "exam", paper: "all", min: 0.7 }, { k: "written", n: 3 }, { k: "exam", paper: "paperC" }, { k: "exam", paper: "paperD" }, { k: "cards", n: 60 }]]
    ];
    plan.forEach(function (w, i) {
      var start = new Date(ex.getTime() - (plan.length - i) * 7 * DAY), end = new Date(ex.getTime() - (plan.length - i - 1) * 7 * DAY - DAY);
      weeks.push({ title: "Week " + (i + 1) + " (" + start.toLocaleDateString([], { day: "numeric", month: "short" }) + " – " + end.toLocaleDateString([], { day: "numeric", month: "short" }) + "): " + w[0], steps: w[1], from: start.getTime(), to: end.getTime() + DAY });
    });
    var fin = { id: "final", title: "Final exam revision", sub: "Five weeks to " + ex.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }), desc: "A week-by-week plan ending on your exam date: diagnose, revise each topic until it is Good, then sit full papers under time. Change the date on the Progress page if it moves.", groups: weeks };
    var adv = { id: "advanced", title: "Beyond the course", sub: "Supplementary topics and harder practice", desc: "Topics that are not in the COMP 2611 lecture notes (marked Supplementary wherever they appear), plus the hardest exercises and written answers.",
      groups: [
        { title: "Supplementary lessons", steps: Object.keys(D.lessons).filter(function (k) { return D.lessons[k].supp; }).sort().map(function (id) { return { k: "lesson", id: id }; }) },
        { title: "Hard practice", steps: [{ k: "gym", topic: "bst", n: 4 }, { k: "gym", topic: "heaps", n: 3 }, { k: "gym", topic: "graphs", n: 3 }, { k: "gym", topic: "sorting", n: 3 }, { k: "written", n: 5 }, { k: "exam", paper: "paperD", min: 0.8 }] }
      ].filter(function (g) { return g.steps.length; }) };
    // steps that need a page this build does not have are left out rather than shown as impossible
    var wids = {};
    (D.written || []).forEach(function (q) { wids[q.id] = 1; });
    [fin, cw2, beginner, adv].forEach(function (p) { p.groups.forEach(function (g) { g.steps = g.steps.filter(function (s) { return (s.k !== "written" && s.k !== "wq") || (CL.pages && CL.pages.written && (s.k !== "wq" || wids[s.id])); }); }); });
    return [fin, cw2, beginner, adv];
  };

  // ---------------------------------------------------------------- the diagnostic test
  L.DIAG = ["cpp.ptr", "cpp.refs", "list.trav", "list.insert", "rec.basics", "sq.stack", "tree.terms", "tree.trav", "tree.code", "bst.prop", "bst.insert", "bst.succ", "bst.delete",
    "heap.array", "heap.build", "heap.extract", "hash.basic", "hash.probe", "graph.trav", "graph.dijkstra", "graph.mst", "sort.simple", "sort.quick", "bigo.code"];
  L.diagPlan = function () {
    return L.DIAG.filter(L.practiseable).map(function (cid) {
      var c = L.byId[cid], gens = c.gens.filter(function (g) { return CL.Train.byId[g] && !/^facts-|^classic-/.test(g); });
      if (!gens.length) gens = c.gens.filter(function (g) { return CL.Train.byId[g]; });
      gens.sort(function (a, b) { return L.level(a) - L.level(b); });
      return { c: cid, g: gens[0], s: CL.Train.newSeed() };
    });
  };
})(CL);
