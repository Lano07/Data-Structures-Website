/* COMP 2611 Code Lab — Trace Trainer, part 2: hashing, graphs, sorting, big-O, linked lists, recursion,
   stacks and queues, C++ and pointers, and "which statements are true" questions in the exam's I / II / III style. */
(function (CL) {
  "use strict";
  var T = CL.Train, esc = CL.esc, add = T.add, seqMore = T.seqMore, numMore = T.numMore, code = T.code;
  function b(s) { return "<b>" + esc(s) + "</b>"; }

  // ---------------------------------------------------------------- hashing (locations 1 to N)
  function hashRun(keys, N, method, hplus) {
    var t = new Array(N + 1).fill(0), where = {}, lines = [], h0 = hplus === false ? 0 : 1;
    keys.forEach(function (k) {
      var loc = k % N + h0, x = 0, path = [loc], tries = 0, line = k + ": h = " + k + " % " + N + (h0 ? " + 1" : "") + " = " + loc;
      var step = k % (N - 2) + 1;
      while (t[loc] !== 0 && tries < 3 * N) {
        x++; tries++;
        var old = loc;
        if (method === "linear") { loc++; if (loc > N - 1 + h0) loc = h0; }
        else if (method === "quad") { loc = loc + x + x * x; while (loc > N - 1 + h0) loc -= N; }
        else { loc = loc + step; while (loc > N - 1 + h0) loc -= N; }
        line += "; " + old + " is full (holds " + t[old] + ")" + (method === "quad" ? ", collision " + x + ": move " + (x + x * x) : method === "double" ? ", move k = " + step : ", next") + " → " + loc;
        path.push(loc);
      }
      if (t[loc] !== 0) { lines.push(line + "; gave up."); where[k] = null; return; }
      t[loc] = k; where[k] = loc;
      lines.push(line + (path.length > 1 ? "; it goes in " + loc + "." : ": empty, it goes there."));
    });
    return { t: t, where: where, lines: lines };
  }
  T.hashRun = hashRun;
  var METHOD = { linear: "linear probing", quad: "quadratic probing (move x + x² after the x-th collision)", "double": "linear probing with double hashing, step k = key % (N − 2) + 1" };
  // keys that collide on purpose: several keys share a home location
  function collidingKeys(r, n, N) {
    var homes = [], keys = [], guard = 0;
    while (keys.length < n && guard++ < 500) {
      var home = homes.length && r.chance(0.5) ? r.pick(homes) : r.int(0, N - 1);
      var k = N * r.int(1, Math.floor(99 / N)) + home;
      if (k < 10 || k > 99 || keys.indexOf(k) >= 0) continue;
      keys.push(k);
      if (homes.indexOf(home) < 0) homes.push(home);
    }
    return keys;
  }
  function tableFig(t, N) {
    return '<div class="tq-fig">' + CL.drawArray(t.map(function (v, i) { return i === 0 ? "" : v === 0 ? "" : v === -1 ? "−1" : v; }), { from: 1, to: N, cw: 38 }) + "</div>";
  }
  add({ id: "hash-insert", topic: "hashing", title: "Where does the key go?", marks: 2, make: function (r) {
    var method = r.pick(["linear", "linear", "quad", "double"]), N = method === "double" ? r.pick([7, 13]) : r.pick([7, 10, 11, 12, 13]);
    var keys, R, target;
    for (var t = 0; t < 100; t++) {
      keys = collidingKeys(r, r.int(5, Math.min(8, N - 2)), N);
      R = hashRun(keys, N, method);
      var hit = keys.filter(function (k) { return R.where[k] !== null && R.where[k] !== k % N + 1; });
      if (hit.length && keys.every(function (k) { return R.where[k] !== null; })) { target = hit[hit.length - 1]; break; }
    }
    var others = ["linear", "quad", "double"].filter(function (m) { return m !== method; }).map(function (m) { return hashRun(keys, N, m).where[target]; });
    var noPlus = hashRun(keys, N, method, false).where[target];
    return {
      text: "A table has locations 1 to " + N + " and h(key) = key % " + N + " + 1. Collisions use " + METHOD[method] + ". These keys are inserted in order: " + code(keys.join(", ")) + ". At which location does " + b(target) + " end up?",
      fig: tableFig(new Array(N + 1).fill(0), N), ctx: "N = " + N + ", h = key % N + 1, " + method + ", keys " + keys.join(", ") + ". Where is " + target + "?",
      type: "num", answer: String(R.where[target]), wrong: [{ v: target % N + 1, why: "That is " + target + "'s home location, h(" + target + ") = " + (target % N + 1) + ". It was already taken when " + target + " arrived, so it moved on." }].concat(others.map(function (w, i) { return { v: w, why: "That is where " + METHOD[["linear", "quad", "double"].filter(function (m) { return m !== method; })[i]] + " would put it. This table uses " + METHOD[method] + "." }; }), [{ v: noPlus, why: "That forgets the + 1: locations run from 1 to " + N + ", so h(key) = key % " + N + " + 1." }]), more: numMore(R.where[target], 1),
      hint: "Insert every key in order: a key's place depends on the keys already in the table.",
      steps: [R.lines.join("<br>"), "The final table:" + tableFig(R.t, N), b(target) + " is at location " + b(R.where[target]) + "."],
      lab: { id: "hash", preset: { keys: keys, method: method, N: N } }
    };
  } });

  add({ id: "hash-search", topic: "hashing", title: "Searching a probing table", marks: 2, make: function (r) {
    var N = r.pick([10, 11, 12, 13]), keys, R, target, found, del = null;
    for (var t = 0; t < 200; t++) {
      keys = collidingKeys(r, r.int(5, 8), N);
      R = hashRun(keys, N, "linear");
      if (keys.some(function (k) { return R.where[k] === null; })) continue;
      found = r.chance(0.6);
      if (found) { var c = keys.filter(function (k) { return R.where[k] !== k % N + 1; }); if (!c.length) continue; target = r.pick(c); }
      else {
        var homes = keys.map(function (k) { return k % N; }), h = r.pick(homes), cand = [];
        for (var m = 1; m <= Math.floor(99 / N); m++) { var v = N * m + h; if (v >= 10 && v <= 99 && keys.indexOf(v) < 0) cand.push(v); }
        if (!cand.length) continue;
        target = r.pick(cand);
      }
      break;
    }
    // sometimes a key on the target's probe path was deleted (marked −1)
    var tb = R.t.slice(), loc = target % N + 1, path = [];
    while (tb[loc] !== 0 && path.length < N) { path.push(loc); if (tb[loc] === target) break; loc = loc === N ? 1 : loc + 1; }
    if (tb[loc] === 0) path.push(loc);
    var delCands = path.filter(function (l) { return tb[l] > 0 && tb[l] !== target; });
    if (delCands.length && r.chance(0.5)) { del = r.pick(delCands); tb[del] = -1; }
    var probes = path.length;
    var steps = path.map(function (l) { return "Location " + l + ": " + (tb[l] === 0 ? "empty, so stop: " + target + " is not in the table." : tb[l] === target ? "holds " + target + ". Found." : tb[l] === -1 ? "−1 (deleted). A search does not stop at −1, so keep going." : "holds " + tb[l] + ", not " + target + ". Next."); });
    var stopAtDel = del ? path.indexOf(del) + 1 : null;
    return {
      text: "This table uses linear probing with h(key) = key % " + N + " + 1 (locations 1 to " + N + ", empty = blank" + (del ? ", −1 = deleted" : "") + "). How many locations does a search for " + b(target) + " look at, counting the location where it finds the key or the empty location where it stops?",
      fig: tableFig(tb, N), ctx: "Linear probing, N = " + N + ", table " + tb.slice(1).map(function (v, i) { return (i + 1) + ":" + (v || "empty"); }).join(" ") + ". Search for " + target,
      type: "num", answer: String(probes), wrong: [probes - 1, probes + 1, stopAtDel, 1], more: numMore(probes, 1),
      hint: "Start at h(key) and step forward one location at a time. Stop at the key or at an empty location; −1 does not stop a search.",
      steps: ["h(" + target + ") = " + target + " % " + N + " + 1 = " + (target % N + 1) + ".", steps.join("<br>"), "That is " + b(probes) + " location" + (probes === 1 ? "" : "s") + "."],
      lab: { id: "hash", preset: { keys: keys, method: "linear", N: N, op: "find", key: target } }
    };
  } });

  add({ id: "hash-chain", topic: "hashing", title: "Chaining", marks: 1, make: function (r) {
    var N = r.pick([5, 7, 8, 10]), keys = [], L;
    for (var t = 0; t < 100; t++) {
      keys = collidingKeys(r, r.int(6, 8), N);
      var counts = {};
      keys.forEach(function (k) { var l = k % N + 1; counts[l] = (counts[l] || 0) + 1; });
      var big = Object.keys(counts).filter(function (l) { return counts[l] >= 3; });
      if (big.length) { L = +r.pick(big); break; }
    }
    if (!L) L = keys[0] % N + 1;
    var inL = keys.filter(function (k) { return k % N + 1 === L; }), ans = inL.slice().reverse();
    return {
      text: "A hash table with chaining has locations 1 to " + N + " and h(key) = key % " + N + " + 1. Each new key is put at the <b>top</b> of its location's list. After inserting " + code(keys.join(", ")) + ", what is the list at location " + L + ", from the top?",
      ctx: "Chaining, N = " + N + ", keys " + keys.join(", ") + ", list at " + L,
      type: "seq", answer: ans.join(" "), wrong: [inL.join(" "), inL.slice().sort(function (a, c) { return a - c; }).join(" "), inL.slice().sort(function (a, c) { return c - a; }).join(" ")], more: seqMore(ans),
      hint: "Find every key with h(key) = " + L + ". Each one goes on top of the ones before it, so the last one inserted is first.",
      steps: ["Keys that hash to " + L + ", in insertion order: " + inL.map(function (k) { return k + " (" + k + " % " + N + " + 1 = " + L + ")"; }).join(", ") + ".", "Each is put at the top, so the list reads in reverse insertion order: " + b(ans.join(" → ")) + "."],
      lab: { id: "hash", preset: { keys: keys, method: "chain", N: N } }
    };
  } });

  add({ id: "hash-step", topic: "hashing", title: "Probe arithmetic", marks: 1, make: function (r) {
    var kind = r.int(0, 2), N = r.pick([7, 11, 13, 17]), k = r.int(20, 99);
    if (kind === 0) {
      var st = k % (N - 2) + 1;
      return { text: "Double hashing in a table of N = " + N + " locations uses the step k = key % (N − 2) + 1. What is the step for the key " + b(k) + "?", ctx: "N = " + N + ", key " + k,
        type: "num", answer: String(st), wrong: [k % (N - 2), k % N + 1, k % (N - 1) + 1], more: numMore(st, 1), hint: "N − 2 = " + (N - 2) + ".",
        steps: [k + " % " + (N - 2) + " = " + (k % (N - 2)) + " (" + k + " = " + Math.floor(k / (N - 2)) + " × " + (N - 2) + " + " + (k % (N - 2)) + "), so k = " + (k % (N - 2)) + " + 1 = " + b(st) + "."] };
    }
    if (kind === 1) {
      var x = r.int(1, 4), loc = r.int(1, N), raw = loc + x + x * x, nl = raw; while (nl > N) nl -= N;
      return { text: "Quadratic probing (move x + x² after the x-th collision) in a table with locations 1 to " + N + ". A key has just had collision number " + b(x) + " at location " + b(loc) + ". Which location does it try next?", ctx: "N = " + N + ", collision " + x + " at " + loc,
        type: "num", answer: String(nl), wrong: [raw > N ? raw : null, ((loc + x * x - 1) % N) + 1, ((loc + 2 * x - 1) % N) + 1, (loc % N) + 1], more: numMore(nl, 1), hint: "Move x + x² from the location where the collision happened, then wrap past N.",
        steps: ["x + x² = " + x + " + " + (x * x) + " = " + (x + x * x) + ". " + loc + " + " + (x + x * x) + " = " + raw + (raw > N ? ", past " + N + ", so subtract " + N + " until it fits: " + nl : "") + ". The next location is " + b(nl) + "."] };
    }
    var h = k % N + 1;
    return { text: "With h(key) = key % " + N + " + 1, which location does the key " + b(k) + " hash to?", ctx: "N = " + N + ", key " + k,
      type: "num", answer: String(h), wrong: [k % N, Math.floor(k / N) + 1, h % N + 1], more: numMore(h, 1), hint: "% gives the remainder after division.",
      steps: [k + " = " + Math.floor(k / N) + " × " + N + " + " + (k % N) + ", so " + k + " % " + N + " = " + (k % N) + " and h = " + (k % N) + " + 1 = " + b(h) + "."] };
  } });

  // ---------------------------------------------------------------- graphs
  var LAYOUT = {
    5: [[1, 0], [2.1, 0.75], [1.7, 2], [0.3, 2], [-0.1, 0.75]],
    6: [[0.6, 0], [1.9, 0], [2.5, 1.05], [1.9, 2.1], [0.6, 2.1], [0, 1.05]],
    7: [[0.6, 0], [1.9, 0], [2.5, 1.05], [1.9, 2.1], [0.6, 2.1], [0, 1.05], [1.25, 1.05]]
  };
  // a random graph on A, B, C, ...; every vertex reachable from the first letter's spot when "reach" is set
  function randGraph(r, n, opts) {
    var V = "ABCDEFG".slice(0, n).split(""), slots = r.shuffle(LAYOUT[n].slice()), pos = {};
    V.forEach(function (v, i) { pos[v] = [slots[i][0] + 0.15, slots[i][1]]; });
    var E = [], has = {};
    function addE(u, v, w) { if (u === v || has[u + v] || has[v + u]) return false; has[u + v] = 1; E.push([u, v, w]); return true; }
    var wts = opts.weighted ? r.shuffle(Array.apply(null, { length: 30 }).map(function (_, i) { return i + 1; })) : null, wi = 0;
    var W = function () { return opts.weighted ? (opts.distinct ? wts[wi++] : r.int(1, 20)) : 1; };
    var start = opts.start || V[0], order = r.shuffle(V.filter(function (v) { return v !== start; })), inTree = [start];
    order.forEach(function (v) { var u = r.pick(inTree); addE(u, v, W()); inTree.push(v); });
    var extra = opts.extra || r.int(2, 4), guard = 0;
    while (extra > 0 && guard++ < 100) { if (addE(r.pick(V), r.pick(V), W())) extra--; }
    var g = { name: "Trainer graph", directed: !!opts.directed, weighted: !!opts.weighted, pos: pos, V: V.slice(), E: E, adj: {} };
    V.forEach(function (u) { g.adj[u] = []; });
    E.forEach(function (e) { g.adj[e[0]].push(e[1]); if (!g.directed) g.adj[e[1]].push(e[0]); });
    V.forEach(function (u) { g.adj[u].sort(); });
    return g;
  }
  T.randGraph = randGraph;
  function wOf(g, u, v) { for (var i = 0; i < g.E.length; i++) { var e = g.E[i]; if ((e[0] === u && e[1] === v) || (!g.directed && e[0] === v && e[1] === u)) return e[2]; } return null; }
  function graphFig(g) { return '<div class="tq-fig">' + CL.drawGraph(g, {}) + "</div>"; }
  function adjText(g) { return '<div class="tq-adj">' + g.V.map(function (u) { return "<div><b>" + u + "</b>: " + (g.adj[u].map(function (v) { return v + (g.weighted ? "(" + wOf(g, u, v) + ")" : ""); }).join(", ") || "–") + "</div>"; }).join("") + "</div>"; }
  function graphCtx(g) { return (g.directed ? "Directed" : "Undirected") + (g.weighted ? ", weighted" : "") + " graph. Edges: " + g.E.map(function (e) { return e[0] + (g.directed ? "→" : "–") + e[1] + (g.weighted ? " (" + e[2] + ")" : ""); }).join(", "); }
  function bfs(g, s, log) {
    var seen = {}, out = [], Q = [s]; seen[s] = 1;
    while (Q.length) {
      var u = Q.shift(), added = [];
      out.push(u);
      g.adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; Q.push(v); added.push(v); } });
      if (log) log.push("Take " + u + " from the queue and print it. " + (added.length ? "Add its undiscovered neighbours " + added.join(", ") + "." : "No new neighbours.") + " Queue: " + (Q.join(" ") || "empty"));
    }
    return out;
  }
  function dfs(g, s, log) {
    var seen = {}, out = [];
    (function vis(u, from) {
      seen[u] = 1; out.push(u);
      if (log) log.push((from ? "From " + from + ", go to " : "Start at ") + u + " and print it.");
      g.adj[u].forEach(function (v) { if (!seen[v]) vis(v, u); });
      if (log && from) log.push("Every neighbour of " + u + " is done: back to " + from + ".");
    })(s, null);
    return out;
  }
  function stackOrder(g, s) { var seen = {}, out = [], S = [s]; while (S.length) { var u = S.pop(); if (seen[u]) continue; seen[u] = 1; out.push(u); g.adj[u].slice().reverse().forEach(function (v) { if (!seen[v]) S.push(v); }); } return out; }
  T.graph = { bfs: bfs, dfs: dfs };
  add({ id: "graph-trav", topic: "graphs", title: "BFS and DFS order", marks: 2, make: function (r) {
    var n = r.int(5, 7), directed = r.chance(0.6), g = randGraph(r, n, { directed: directed, start: "A" }), alg = r.pick(["bfs", "dfs"]);
    var s = g.V[0], log = [], ans = alg === "bfs" ? bfs(g, s, log) : dfs(g, s, log);
    var other = alg === "bfs" ? dfs(g, s) : bfs(g, s);
    var revG = JSON.parse(JSON.stringify(g)); revG.V.forEach(function (u) { revG.adj[u].reverse(); });
    return {
      text: "Run " + (alg === "bfs" ? "<b>breadth-first</b>" : "<b>depth-first</b>") + " search on this " + (directed ? "directed" : "undirected") + " graph, starting at " + b(s) + ". Each vertex's neighbours are taken in alphabetical order. In what order are the vertices visited (printed)?",
      fig: graphFig(g) + adjText(g), ctx: graphCtx(g) + ". Start at " + s,
      type: "seq", answer: ans.join(" "), wrong: [{ v: other.join(" "), why: "That is the " + (alg === "bfs" ? "depth-first" : "breadth-first") + " order. " + (alg === "bfs" ? "BFS uses a queue: it finishes all neighbours of a vertex before going deeper." : "DFS goes as deep as it can along the first neighbour before backing up.") },
        { v: g.V.join(" "), why: "That is the vertices in alphabetical order. The search order depends on the edges, not the names." },
        { v: stackOrder(g, s).join(" "), why: "That uses a stack that pops vertices before they are fully explored, which is not the lecture's recursive DFS or queue-based BFS." },
        { v: (alg === "bfs" ? bfs(revG, s) : dfs(revG, s)).join(" "), why: "That takes the neighbours in reverse order. Process them in adjacency-list order (alphabetical here)." }], more: seqMore(ans),
      hint: alg === "bfs" ? "BFS uses a queue: take the front vertex, print it, add its undiscovered neighbours to the back." : "DFS goes as deep as it can: from each vertex, go to its first undiscovered neighbour, and back up only when there is none.",
      steps: [log.join("<br>"), "Order: " + b(ans.join(" "))],
      lab: { id: "graph", preset: { alg: alg, graph: g, start: s } }
    };
  } });

  function dijkstra(g, s) {
    var cost = {}, par = {}, done = {}, order = [], log = [], ties = false;
    g.V.forEach(function (v) { cost[v] = Infinity; par[v] = null; });
    cost[s] = 0;
    for (;;) {
      var u = null;
      g.V.forEach(function (v) { if (!done[v] && cost[v] < Infinity && (u === null || cost[v] < cost[u])) u = v; });
      if (u === null) break;
      g.V.forEach(function (v) { if (!done[v] && v !== u && cost[v] === cost[u]) ties = true; });
      done[u] = 1; order.push(u);
      var ch = [];
      g.E.forEach(function (e) {
        if (e[0] !== u) return;
        var v = e[1], nc = cost[u] + e[2];
        if (!done[v] && nc === cost[v]) ties = true;
        if (nc < cost[v]) { ch.push(v + ": " + (cost[v] === Infinity ? "∞" : cost[v]) + " → " + nc); cost[v] = nc; par[v] = u; }
      });
      log.push("Take " + u + " (cost " + cost[u] + "). " + (ch.length ? "Update " + ch.join(", ") + "." : "No costs go down."));
    }
    return { cost: cost, par: par, order: order, log: log, ties: ties };
  }
  T.dijkstra = dijkstra;
  add({ id: "graph-dijkstra", topic: "graphs", title: "Dijkstra's algorithm", marks: 2, make: function (r) {
    var g, D, n;
    for (var t = 0; t < 200; t++) {
      n = r.int(5, 6);
      g = randGraph(r, n, { directed: true, weighted: true, start: "A", extra: r.int(3, 5) });
      D = dijkstra(g, "A");
      if (!D.ties && D.order.length === n) break;
    }
    var kind = r.pick(["cost", "cost", "order", "parent"]), others = g.V.filter(function (v) { return v !== "A"; });
    var x = r.pick(others.filter(function (v) { return D.par[v] !== "A" || kind !== "parent"; }).concat(others).slice(0, 4));
    var direct = wOf(g, "A", x), hops = (function () { var p = bfs(g, "A"); return p; })();
    var fewest = (function () { var prev = {}, Q = ["A"], seen = { A: 1 }; while (Q.length) { var u = Q.shift(); g.adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; prev[v] = u; Q.push(v); } }); } var c = 0, y = x; while (prev[y]) { c += wOf(g, prev[y], y); y = prev[y]; } return c; })();
    var common = { fig: graphFig(g), ctx: graphCtx(g) + ". Source A.", hint: "Take the cheapest vertex still in the queue; its cost is now final. Then for each edge (u, v) leaving it, if cost(u) + weight < cost(v), lower cost(v) and set parent(v) = u.",
      steps: ["Start: cost(A) = 0, every other cost ∞.", D.log.join("<br>")], lab: { id: "graph", preset: { alg: "dijkstra", graph: g, start: "A" } } };
    if (kind === "order") return Object.assign(common, {
      text: "Run Dijkstra's algorithm from " + b("A") + ". In what order are the vertices taken off the priority queue?",
      type: "seq", answer: D.order.join(" "), wrong: [{ v: hops.join(" "), why: "That is the breadth-first order (fewest edges first). Dijkstra takes the vertex with the smallest total cost so far." },
        { v: g.V.join(" "), why: "That is alphabetical order. Dijkstra takes the cheapest vertex still in the queue each time." },
        { v: g.V.slice().sort(function (a, c) { return (wOf(g, "A", a) || 99) - (wOf(g, "A", c) || 99); }).join(" "), why: "That orders vertices by their direct edge from A. Costs change as cheaper paths through other vertices are found." }], more: seqMore(D.order),
      steps: common.steps.concat(["Order: " + b(D.order.join(" "))]) });
    if (kind === "parent") return Object.assign(common, {
      text: "Run Dijkstra's algorithm from " + b("A") + ". On the shortest path to " + b(x) + ", which vertex comes just before " + x + " (its parent)?",
      type: "text", answer: D.par[x], wrong: g.V.filter(function (v) { return v !== x && v !== D.par[x] && (wOf(g, v, x) !== null || v === "A"); }), more: function (rr) { return rr.pick(g.V.filter(function (v) { return v !== x; })); },
      steps: common.steps.concat(["parent(" + x + ") = " + b(D.par[x]) + ": the last vertex that lowered its cost."]) });
    var path = [], y = x; while (y) { path.unshift(y); y = D.par[y]; }
    return Object.assign(common, {
      text: "Run Dijkstra's algorithm from " + b("A") + ". What is the cost of the shortest path from A to " + b(x) + "?",
      type: "num", answer: String(D.cost[x]), wrong: [direct, fewest, D.cost[x] + r.int(1, 5)], more: numMore(D.cost[x], 1),
      steps: common.steps.concat(["The cheapest path is " + path.join(" → ") + " with cost " + b(D.cost[x]) + "."]) });
  } });

  function kruskal(g) {
    var comp = {}, tree = [], skipped = [], total = 0, log = [];
    g.V.forEach(function (v) { comp[v] = v; });
    function f(v) { while (comp[v] !== v) v = comp[v]; return v; }
    g.E.slice().sort(function (a, c) { return a[2] - c[2]; }).forEach(function (e) {
      if (f(e[0]) !== f(e[1])) { comp[f(e[0])] = f(e[1]); tree.push(e); total += e[2]; log.push(ed(e) + ": different trees, add it."); }
      else { skipped.push(e); log.push(ed(e) + ": same tree, skip it (it would make a cycle)."); }
    });
    return { tree: tree, skipped: skipped, total: total, log: log };
  }
  function prim(g, s) {
    var used = [s], tree = [], total = 0, log = [];
    while (used.length < g.V.length) {
      var best = null;
      g.E.forEach(function (e) { if ((used.indexOf(e[0]) >= 0) !== (used.indexOf(e[1]) >= 0) && (!best || e[2] < best[2])) best = e; });
      if (!best) break;
      var nv = used.indexOf(best[0]) >= 0 ? best[1] : best[0], from = nv === best[1] ? best[0] : best[1];
      tree.push([from, nv, best[2]]); total += best[2]; used.push(nv);
      log.push("Cheapest edge from {" + used.slice(0, -1).join(", ") + "} to an unused vertex: (" + from + ", " + nv + ", " + best[2] + "). Add " + nv + ".");
    }
    return { tree: tree, used: used, total: total, log: log };
  }
  function ed(e) { return "(" + e[0] + ", " + e[1] + ", " + e[2] + ")"; }
  T.mst = { kruskal: kruskal, prim: prim };
  add({ id: "graph-mst", topic: "graphs", title: "Minimum spanning trees", marks: 2, make: function (r) {
    var n = r.int(5, 6), g = randGraph(r, n, { weighted: true, distinct: true, extra: r.int(3, 4) }), K = kruskal(g), s = r.pick(g.V), P = prim(g, s);
    var kind = r.pick(["total", "korder", "porder", "notin"]);
    var sorted = g.E.slice().sort(function (a, c) { return a[2] - c[2]; });
    var naive = sorted.slice(0, n - 1).reduce(function (a, e) { return a + e[2]; }, 0);
    var common = { fig: graphFig(g), ctx: graphCtx(g), hint: "Kruskal: edges from cheapest up, skipping any that joins two vertices already in the same tree. Prim: from the start vertex, always add the cheapest edge from a used vertex to an unused one." };
    if (kind === "total") return Object.assign(common, {
      text: "What is the total weight of a minimum-cost spanning tree of this graph?",
      type: "num", answer: String(K.total), wrong: [naive, K.total + K.skipped[0][2] - K.tree[K.tree.length - 1][2], g.E.reduce(function (a, e) { return a + e[2]; }, 0)], more: numMore(K.total, 1),
      steps: ["Kruskal: sort the edges and add each one that joins two different trees.", K.log.join("<br>"), "The tree has " + (n - 1) + " edges with total " + b(K.total) + "."],
      lab: { id: "graph", preset: { alg: "kruskal", graph: g } } });
    if (kind === "porder") return Object.assign(common, {
      text: "Run Prim's algorithm starting at " + b(s) + ". In what order are the vertices added to the used set (starting with " + s + ")?",
      type: "seq", answer: P.used.join(" "), wrong: [bfs(g, s).join(" "), [s].concat(g.V.filter(function (v) { return v !== s; })).join(" "), dfs(g, s).join(" ")], more: seqMore(P.used),
      steps: [P.log.join("<br>"), "Order: " + b(P.used.join(" ")) + " (total cost " + P.total + ")."],
      lab: { id: "graph", preset: { alg: "prim", graph: g, start: s } } });
    if (kind === "notin") {
      var notIn = r.pick(K.skipped), opts = r.shuffle([notIn].concat(r.shuffle(K.tree.slice()).slice(0, 3)));
      return Object.assign(common, {
        text: "Which of these edges is <b>not</b> in the minimum-cost spanning tree?", type: "choice", options: opts.map(ed), answer: opts.indexOf(notIn),
        steps: [K.log.join("<br>"), ed(notIn) + " is skipped: when Kruskal reaches it, its two ends are already joined by cheaper edges."],
        lab: { id: "graph", preset: { alg: "kruskal", graph: g } } });
    }
    var orig = function (e) { for (var i = 0; i < g.E.length; i++) { var x = g.E[i]; if ((x[0] === e[0] && x[1] === e[1]) || (x[0] === e[1] && x[1] === e[0])) return x; } return e; };
    var right = K.tree.map(ed).join(" "), wrongs = [sorted.slice(0, n - 1).map(ed).join(" "), P.tree.map(function (e) { return ed(orig(e)); }).join(" "), K.tree.slice(0, -1).concat([K.skipped[0]]).map(ed).join(" ")];
    var seen = {}, opts2 = [right];
    seen[right] = 1;
    wrongs.forEach(function (w) { if (!seen[w]) { seen[w] = 1; opts2.push(w); } });
    while (opts2.length < 4) { var sh = r.shuffle(K.tree.slice()).map(ed).join(" "); if (!seen[sh]) { seen[sh] = 1; opts2.push(sh); } }
    r.shuffle(opts2);
    return Object.assign(common, {
      text: "In what order does <b>Kruskal's</b> algorithm add edges to the spanning tree?", type: "choice", options: opts2, answer: opts2.indexOf(right), wide: true,
      steps: [K.log.join("<br>"), "Edges added, in order: " + b(right)],
      lab: { id: "graph", preset: { alg: "kruskal", graph: g } } });
  } });

  add({ id: "graph-degree", topic: "graphs", title: "Degrees and adjacency", marks: 1, make: function (r) {
    var n = r.int(5, 6), g = randGraph(r, n, { directed: true, extra: r.int(3, 5) }), x = r.pick(g.V);
    var inD = g.E.filter(function (e) { return e[1] === x; }).length, outD = g.adj[x].length, kind = r.pick(["in", "out", "deg"]);
    var ans = kind === "in" ? inD : kind === "out" ? outD : inD + outD;
    var showList = r.chance(0.5);
    return {
      lab: { id: "graph", preset: { alg: "bfs", graph: g, start: x } },
      text: "In this directed graph, what is the <b>" + (kind === "in" ? "in-degree" : kind === "out" ? "out-degree" : "degree") + "</b> of " + b(x) + "?",
      fig: showList ? '<div class="small muted">Adjacency lists:</div>' + adjText(g) : graphFig(g), ctx: graphCtx(g),
      type: "num", answer: String(ans), wrong: [kind === "in" ? outD : inD, kind === "deg" ? Math.max(inD, outD) : inD + outD, ans + 1], more: numMore(ans),
      hint: "In-degree: edges coming in. Out-degree: edges going out. Degree: in + out.",
      steps: ["Edges into " + x + ": " + (g.E.filter(function (e) { return e[1] === x; }).map(function (e) { return e[0] + "→" + x; }).join(", ") || "none") + " (in-degree " + inD + "). Edges out of " + x + ": " + (g.adj[x].map(function (v) { return x + "→" + v; }).join(", ") || "none") + " (out-degree " + outD + ").", "So the answer is " + b(ans) + "."]
    };
  } });

  // ---------------------------------------------------------------- sorting
  function sortPasses(alg, A0) {
    var A = A0.slice(), n = A.length, passes = [];
    if (alg === "selection") for (var i = 0; i < n - 1; i++) { var m = i; for (var j = i + 1; j < n; j++) if (A[j] < A[m]) m = j; var t = A[i]; A[i] = A[m]; A[m] = t; passes.push(A.slice()); }
    if (alg === "bubble") for (var p = 0; p < n - 1; p++) { for (var q = 0; q < n - 1 - p; q++) if (A[q] > A[q + 1]) { var t2 = A[q]; A[q] = A[q + 1]; A[q + 1] = t2; } passes.push(A.slice()); }
    if (alg === "insertion") for (var a = 1; a < n; a++) { var key = A[a], c = a - 1; while (c >= 0 && A[c] > key) { A[c + 1] = A[c]; c--; } A[c + 1] = key; passes.push(A.slice()); }
    return passes;
  }
  T.sortPasses = sortPasses;
  var SORT_NAME = { selection: "selection sort", bubble: "bubble sort", insertion: "insertion sort" };
  var SORT_RULE = {
    selection: "Selection sort: pass i finds the smallest value in A[i..n−1] and swaps it into A[i].",
    bubble: "Bubble sort: each pass compares neighbours from the left and swaps any pair that is out of order, so the largest remaining value ends at the right.",
    insertion: "Insertion sort: pass i takes key = A[i] and shifts the larger values of A[0..i−1] one place right, then puts the key in the gap."
  };
  add({ id: "sort-pass", topic: "sorting", title: "Array after a pass", marks: 1, make: function (r) {
    var alg = r.pick(["selection", "bubble", "insertion"]), n = r.int(6, 8), A = r.distinct(n, 1, 99), k = r.int(1, 3);
    var P = sortPasses(alg, A), ans = P[k - 1];
    var wrong = ["selection", "bubble", "insertion"].filter(function (x) { return x !== alg; }).map(function (x) { return sortPasses(x, A)[k - 1].join(" "); });
    wrong.push((P[k] || P[k - 1]).join(" "), k > 1 ? P[k - 2].join(" ") : A.join(" "));
    return {
      text: "The lecture's <b>" + SORT_NAME[alg] + "</b> sorts " + code(A.join(" ")) + " into ascending order. What is the array after pass " + b(k) + "?",
      ctx: SORT_NAME[alg] + " on " + A.join(" ") + ", after pass " + k,
      type: "seq", answer: ans.join(" "), wrong: wrong, more: seqMore(ans),
      hint: SORT_RULE[alg],
      steps: [SORT_RULE[alg], P.slice(0, k).map(function (x, i) { return "After pass " + (i + 1) + ": " + code(x.join(" ")); }).join("<br>"), "Answer: " + b(ans.join(" "))],
      lab: { id: "sort", preset: { alg: alg, values: A } }
    };
  } });

  function partition(A0, log) {
    var A = A0.slice(), r = A.length - 1, x = A[r], i = -1;
    for (var j = 0; j < r; j++) {
      if (A[j] <= x) { i++; var t = A[i]; A[i] = A[j]; A[j] = t; if (log) log.push("j = " + j + ": " + A[i] + " ≤ " + x + ", so i = " + i + (i !== j ? " and swap A[" + i + "] with A[" + j + "]" : "") + ": " + code(A.join(" "))); }
      else if (log) log.push("j = " + j + ": " + A[j] + " &gt; " + x + ", i stays " + i + ".");
    }
    var t2 = A[i + 1]; A[i + 1] = A[r]; A[r] = t2;
    if (log) log.push("Finally swap A[i + 1] = A[" + (i + 1) + "] with the pivot: " + code(A.join(" ")) + ". q = " + (i + 1) + ".");
    return { A: A, q: i + 1 };
  }
  T.partition = partition;
  add({ id: "sort-partition", topic: "sorting", title: "Quick sort's partition", marks: 2, make: function (r) {
    var n = r.int(6, 8), A = r.distinct(n, 1, 99), x = A[n - 1];
    var lo = A.filter(function (v) { return v < x; }).length;
    if (lo === 0 || lo === n - 1) { var mid = A.slice(0, -1).sort(function (a, c) { return a - c; })[Math.floor(n / 2)]; A[A.indexOf(mid)] = x; A[n - 1] = mid; x = mid; }
    var log = [], P = partition(A, log);
    var le = A.slice(0, -1).filter(function (v) { return v <= x; }), gt = A.slice(0, -1).filter(function (v) { return v > x; });
    var noSwap = A.slice(), ii = -1; for (var j = 0; j < n - 1; j++) if (noSwap[j] <= x) { ii++; var t = noSwap[ii]; noSwap[ii] = noSwap[j]; noSwap[j] = t; }
    var atI = noSwap.slice(); if (ii >= 0) { var t3 = atI[ii]; atI[ii] = atI[n - 1]; atI[n - 1] = t3; }
    return {
      text: "Call the lecture's <b>partition (A, 0, " + (n - 1) + ")</b> on " + code(A.join(" ")) + " (the pivot is the last value, " + x + "). What is the array afterwards?",
      ctx: "partition on " + A.join(" ") + ", pivot " + x,
      type: "seq", answer: P.A.join(" "), wrong: [{ v: le.concat([x], gt).join(" "), why: "That keeps each side in its original order. partition swaps values as it goes, so the order inside each side changes: trace i and j step by step." },
        { v: noSwap.join(" "), why: "That forgets the final step: swap A[i + 1] with the pivot A[r]." },
        { v: atI.join(" "), why: "That swaps the pivot with A[i] instead of A[i + 1]." },
        { v: A.slice().sort(function (a, c) { return a - c; }).join(" "), why: "That is the array fully sorted. One partition only puts the pivot in its final place, with smaller values left and larger values right." }], more: seqMore(P.A),
      hint: "x = A[r]; i = p − 1. For j = p to r − 1: if A[j] ≤ x, increase i and swap A[i] with A[j]. Finally swap A[i + 1] with A[r].",
      steps: ["x = " + x + ", i = −1.", log.join("<br>"), "Answer: " + b(P.A.join(" "))],
      lab: { id: "sort", preset: { alg: "quick", values: A, one: true } }
    };
  } });

  function mergeCalls(A0) {
    var A = A0.slice(), calls = [];
    (function ms(s, e) {
      if (s >= e) return;
      var m = Math.floor((s + e) / 2);
      ms(s, m); ms(m + 1, e);
      var L = A.slice(s, m + 1), R = A.slice(m + 1, e + 1), i = 0, j = 0, k = s;
      while (i < L.length && j < R.length) A[k++] = L[i] <= R[j] ? L[i++] : R[j++];
      while (i < L.length) A[k++] = L[i++];
      while (j < R.length) A[k++] = R[j++];
      calls.push({ p: s, q: m, r: e, A: A.slice() });
    })(0, A.length - 1);
    return calls;
  }
  T.mergeCalls = mergeCalls;
  add({ id: "sort-merge", topic: "sorting", title: "Merge sort's merges", marks: 2, make: function (r) {
    var n = r.int(6, 8), A = r.distinct(n, 1, 99), C = mergeCalls(A), k = r.int(2, Math.min(5, C.length - 1));
    var sig = function (c) { return "merge (A, " + c.p + ", " + c.q + ", " + c.r + ")"; };
    var list = C.map(function (c, i) { return (i + 1) + ". " + sig(c) + " → " + code(c.A.join(" ")); }).join("<br>");
    if (r.chance(0.5)) {
      var opts = [C[k - 1]].concat(r.shuffle(C.filter(function (_, i) { return i !== k - 1; })).slice(0, 3));
      r.shuffle(opts);
      return {
        text: "mergeSort (A, 0, " + (n - 1) + ") runs on " + code(A.join(" ")) + ". Which call to merge happens " + b(["", "first", "second", "third", "fourth", "fifth"][k]) + "?",
        ctx: "mergeSort on " + A.join(" "), type: "choice", options: opts.map(sig), answer: opts.indexOf(C[k - 1]),
        hint: "mergeSort finishes the whole left half (all its merges) before it starts on the right half.",
        steps: ["The merges happen in this order:<br>" + list],
        lab: { id: "sort", preset: { alg: "merge", values: A } }
      };
    }
    var ans = C[k - 1].A;
    return {
      text: "mergeSort (A, 0, " + (n - 1) + ") runs on " + code(A.join(" ")) + ". What is the array after the first " + b(k) + " calls to merge?",
      ctx: "mergeSort on " + A.join(" ") + ", after " + k + " merges",
      type: "seq", answer: ans.join(" "), wrong: [C[k].A.join(" "), C[k - 2] ? C[k - 2].A.join(" ") : A.join(" "), A.slice().sort(function (a, c) { return a - c; }).join(" ")], more: seqMore(ans),
      hint: "Split in half again and again; merges happen bottom-up, left half first.",
      steps: ["The merges happen in this order:<br>" + list, "After " + k + " merges: " + b(ans.join(" "))],
      lab: { id: "sort", preset: { alg: "merge", values: A } }
    };
  } });

  add({ id: "sort-which", topic: "sorting", title: "Which sort is it?", marks: 1, make: function (r) {
    var algs = ["selection", "bubble", "insertion"], alg, A, P, ok = false;
    for (var t = 0; t < 200 && !ok; t++) {
      A = r.distinct(r.int(6, 7), 1, 99); alg = r.pick(algs); P = sortPasses(alg, A);
      var me = P[0].join(" ") + "|" + P[1].join(" ");
      ok = algs.every(function (x) { if (x === alg) return true; var Q = sortPasses(x, A); return Q[0].join(" ") + "|" + Q[1].join(" ") !== me; });
    }
    var opts = ["Selection sort", "Bubble sort", "Insertion sort", "Merge sort"], ans = { selection: 0, bubble: 1, insertion: 2 }[alg];
    return {
      text: "An algorithm sorts " + code(A.join(" ")) + ". After its first pass the array is " + code(P[0].join(" ")) + ", and after the second pass " + code(P[1].join(" ")) + ". Which algorithm is it?",
      ctx: "Passes of a sort on " + A.join(" "),
      type: "choice", options: opts, answer: ans,
      hint: "Selection puts the smallest at the front. Bubble moves the largest to the end. Insertion keeps the front part sorted and leaves the rest alone.",
      steps: [SORT_RULE[alg], "Selection would give " + code(sortPasses("selection", A)[0].join(" ")) + ", bubble " + code(sortPasses("bubble", A)[0].join(" ")) + ", insertion " + code(sortPasses("insertion", A)[0].join(" ")) + " after one pass. Only " + SORT_NAME[alg] + " matches both passes."],
      lab: { id: "sort", preset: { alg: alg, values: A } }
    };
  } });

  // ---------------------------------------------------------------- big-O
  var CLASSES = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(n³)"];
  function classOpts(r, right) {
    var i = CLASSES.indexOf(right), near = [i - 1, i + 1, i - 2, i + 2].filter(function (k) { return k >= 0 && k < CLASSES.length; }).map(function (k) { return CLASSES[k]; });
    var opts = [right].concat(near.slice(0, 2), r.shuffle(CLASSES.filter(function (c) { return c !== right && near.slice(0, 2).indexOf(c) < 0; })).slice(0, 1));
    opts.sort(function (a, c) { return CLASSES.indexOf(a) - CLASSES.indexOf(c); });
    return opts;
  }
  var LOOPS = [
    ["for (int i = 0; i < n; i++)\n\tsum = sum + A[i];", "O(n)", "One loop that runs n times."],
    ["for (int i = 0; i < n; i++)\n\tfor (int j = 0; j < n; j++)\n\t\tcount++;", "O(n²)", "A loop inside a loop: n × n steps."],
    ["for (int i = 0; i < n; i++)\n\tfor (int j = i + 1; j < n; j++)\n\t\tif (A[j] < A[i])\n\t\t\tcount++;", "O(n²)", "The inner loop runs n − 1, n − 2, ..., 1 times: n(n − 1)/2 in total, which is still O(n²)."],
    ["for (int k = n; k > 1; k = k / 2)\n\tcount++;", "O(log n)", "k is halved each time, so the loop runs about log₂ n times."],
    ["for (int i = 1; i < n; i = i * 2)\n\tcount++;", "O(log n)", "i doubles each time, so it reaches n after about log₂ n steps."],
    ["for (int i = 0; i < n; i++)\n\tfor (int k = n; k > 1; k = k / 2)\n\t\tcount++;", "O(n log n)", "n passes of the outer loop, each with a halving loop of log₂ n steps."],
    ["for (int i = 0; i < n; i++)\n\tsum = sum + A[i];\nfor (int j = 0; j < n; j++)\n\tcount = count + A[j];", "O(n)", "Two loops one after the other: n + n = 2n steps, which is O(n)."],
    ["for (int i = 0; i < n; i++)\n\tfor (int j = 0; j < 10; j++)\n\t\tcount++;", "O(n)", "The inner loop always runs 10 times, whatever n is: 10n steps is O(n)."],
    ["int first = A[0];\nint last = A[n - 1];\nint middle = A[n / 2];", "O(1)", "No loop: the same few steps for any n."],
    ["for (int i = 0; i < n; i++)\n\tfor (int j = 0; j < n; j++)\n\t\tfor (int k = 0; k < n; k++)\n\t\t\tcount++;", "O(n³)", "Three nested loops over n: n × n × n."],
    ["for (int i = 0; i < n * n; i++)\n\tcount++;", "O(n²)", "One loop, but it runs n × n times."],
    ["Node * curr = top;\nwhile (curr != NULL) {\n\tcount++;\n\tcurr = curr->next;\n}", "O(n)", "It visits each of the n nodes once."],
    ["int j = 0;\nfor (int i = 0; i < n; i++)\n\twhile (j < n)\n\t\tj++;", "O(n)", "j is never reset, so the inner while loop runs n times in total, not n times per pass: n + n steps."],
    ["int lo = 0, hi = n - 1;\nwhile (lo <= hi) {\n\tint mid = (lo + hi) / 2;\n\tif (A[mid] == key)\n\t\tbreak;\n\tif (A[mid] < key)\n\t\tlo = mid + 1;\n\telse\n\t\thi = mid - 1;\n}", "O(log n)", "Each step throws away half of what is left (binary search)."]
  ];
  add({ id: "bigo-code", topic: "bigo", title: "Big-O of code", marks: 1, make: function (r) {
    var L = r.pick(LOOPS), opts = classOpts(r, L[1]);
    return { text: "What is the big-O of this code, where n is the number of values?", code: L[0], ctx: L[0],
      type: "choice", options: opts, answer: opts.indexOf(L[1]),
      hint: "Count how many times the innermost statement runs as n grows, and keep the fastest-growing part.",
      steps: [L[2] + " So the answer is " + b(L[1]) + "."] };
  } });
  var OPS = [
    ["Find the maximum value in a max-heap of n values", "O(1)"], ["Insert a value into a max-heap of n values", "O(log n)"], ["heapExtractMax on a max-heap of n values", "O(log n)"],
    ["buildMaxHeap on n values", "O(n)"], ["Search for a value in a max-heap of n values", "O(n)"], ["Search for a key in a BST with n nodes, in the worst case", "O(n)"],
    ["Search for a key in a well-shaped (balanced) BST with n nodes", "O(log n)"], ["insertAtHead on a linked list of n nodes", "O(1)"],
    ["insertAtTail on a linked list of n nodes with no tail pointer", "O(n)"], ["Search an unsorted array of n values", "O(n)"], ["Read A[i] from an array", "O(1)"],
    ["Traverse a binary tree of n nodes in preorder", "O(n)"], ["Heap sort on n values", "O(n log n)"], ["Merge sort on n values", "O(n log n)"],
    ["Quick sort on n values, in the worst case", "O(n²)"], ["Insertion sort on n values that are already sorted", "O(n)"], ["Selection sort on n values that are already sorted", "O(n²)"],
    ["Search a hash table that has few collisions", "O(1)"], ["Search a hash table where every key has collided", "O(n)"], ["push or pop on a stack built on a linked list", "O(1)"],
    ["enqueue on a queue with head and tail pointers", "O(1)"], ["Delete the first node of a linked list", "O(1)"], ["Delete a key from a linked list of n nodes, in the worst case", "O(n)"],
    ["mergeArray on two sorted halves holding n values in total", "O(n)"], ["partition on n values", "O(n)"], ["maxHeapify on a heap of n values", "O(log n)"],
    ["Quick sort on n values, on average", "O(n log n)"], ["Bubble sort (the lecture's version) on n values that are already sorted", "O(n²)"]
  ];
  T.OPS = OPS;
  add({ id: "bigo-ops", topic: "bigo", title: "Cost of an operation", marks: 1, make: function (r) {
    var o = r.pick(OPS), opts = classOpts(r, o[1]).filter(function (c) { return c !== "O(n³)"; });
    if (opts.length < 4) { var extra = CLASSES.filter(function (c) { return opts.indexOf(c) < 0 && c !== "O(n³)"; }); opts.push(extra[0]); opts.sort(function (a, c) { return CLASSES.indexOf(a) - CLASSES.indexOf(c); }); }
    return { text: "What is the time complexity of this operation? " + b(o[0]) + ".", ctx: o[0], type: "choice", options: opts, answer: opts.indexOf(o[1]),
      hint: "Think about what the operation must touch: one spot, one path down a tree (height), or everything.",
      steps: [o[0] + " is " + b(o[1]) + ". (See the table in lesson L1.)"] };
  } });
  add({ id: "bigo-which", topic: "bigo", title: "Which one is constant time?", marks: 1, make: function (r) {
    var target = r.pick(["O(1)", "O(1)", "O(log n)", "O(n)"]), yes = OPS.filter(function (o) { return o[1] === target; }), no = OPS.filter(function (o) { return o[1] !== target; });
    var right = r.pick(yes), opts = r.shuffle([right].concat(r.shuffle(no.slice()).slice(0, 3)));
    var words = { "O(1)": "in constant time (O(1))", "O(log n)": "in O(log n) time", "O(n)": "in O(n) time" };
    return { text: "Which of the following operations takes place " + words[target] + "?", ctx: "Options: " + opts.map(function (o) { return o[0]; }).join("; "),
      type: "choice", options: opts.map(function (o) { return o[0]; }), answer: opts.indexOf(right),
      hint: "Work out each option's cost separately, then pick the one that matches.",
      steps: opts.map(function (o) { return o[0] + ": " + o[1] + (o === right ? " ✓" : ""); })
    };
  } });

  // ---------------------------------------------------------------- linked lists
  function listFig(vals) { var d = CL.Diagrams.list(vals.join(" "), ""); return '<div class="tq-fig">' + (d.svg ? d.svg.outerHTML : "") + "</div>"; }
  add({ id: "ll-ops", topic: "lists", title: "List operations", marks: 1, make: function (r) {
    var L = [], lines = ["Node * top = NULL;"], states = [], ops = r.int(5, 7), allHead = [], noDel = [];
    for (var i = 0; i < ops; i++) {
      var v, kind = L.length < 2 ? r.pick(["head", "tail"]) : r.pick(["head", "head", "tail", "tail", "delhead", "delkey"]);
      if (kind === "head" || kind === "tail") {
        do { v = r.int(1, 30); } while (L.indexOf(v) >= 0 || noDel.indexOf(v) >= 0);
        if (kind === "head") L.unshift(v); else L.push(v);
        allHead.unshift(v); noDel[kind === "head" ? "unshift" : "push"](v);
        lines.push("top = insertAt" + (kind === "head" ? "Head" : "Tail") + " (top, " + v + ");");
      } else if (kind === "delhead") { L.shift(); lines.push("top = deleteAtHead (top);"); }
      else { v = r.pick(L); L.splice(L.indexOf(v), 1); lines.push("top = deleteKey (top, " + v + ");"); }
      states.push(lines[lines.length - 1] + " → " + (L.join(" → ") || "empty"));
    }
    if (!L.length) { L.push(7); lines.push("top = insertAtHead (top, 7);"); states.push("top = insertAtHead (top, 7); → 7"); noDel.unshift(7); allHead.unshift(7); }
    lines.push("printList (top);");
    return {
      text: "What does this code print? (insertAtHead, insertAtTail, deleteAtHead and deleteKey are the lecture's functions.)",
      code: lines.join("\n"), ctx: lines.join("\n"),
      type: "seq", answer: L.join(" "), wrong: [L.slice().reverse().join(" "), noDel.join(" "), allHead.filter(function (x) { return L.indexOf(x) >= 0; }).join(" ")], more: seqMore(L),
      hint: "insertAtHead puts the new node first; insertAtTail puts it last. Track the list after every line.",
      steps: states.concat(["printList prints " + b(L.join(" ")) + "."])
    };
  } });

  var LIST_FN = [
    { code: "int f (Node * top) {\n\tint count = 0;\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tif (curr->data > top->data)\n\t\t\tcount++;\n\t\tcurr = curr->next;\n\t}\n\treturn count;\n}", call: "f (top)",
      val: function (L) { return L.filter(function (v) { return v > L[0]; }).length; }, say: "It counts the values larger than the first value.", alt: function (L) { return [L.filter(function (v) { return v >= L[0]; }).length, L.filter(function (v) { return v < L[0]; }).length]; } },
    { code: "int f (Node * top) {\n\tNode * curr = top;\n\twhile (curr->next != NULL)\n\t\tcurr = curr->next;\n\treturn curr->data;\n}", call: "f (top)",
      val: function (L) { return L[L.length - 1]; }, say: "The loop stops at the node whose next is NULL: the last node.", alt: function (L) { return [L[L.length - 2], L[0]]; } },
    { code: "void f (Node * top) {\n\tNode * curr = top;\n\twhile (curr != NULL && curr->next != NULL) {\n\t\tcout << curr->data << \" \";\n\t\tcurr = curr->next->next;\n\t}\n}", call: "f (top)", out: true,
      val: function (L) { var o = []; for (var i = 0; i < L.length && i + 1 < L.length; i += 2) o.push(L[i]); return o.join(" "); }, say: "It prints every second value, starting with the first, but it stops as soon as curr has no next node, so a last node in an odd position is not printed.",
      alt: function (L) { var o = [], p = []; for (var i = 0; i < L.length; i += 2) o.push(L[i]); for (var j = 1; j < L.length; j += 2) p.push(L[j]); return [o.join(" "), p.join(" ")]; } },
    { code: "int f (Node * top, int key) {\n\tint pos = 0;\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tif (curr->data == key)\n\t\t\treturn pos;\n\t\tpos++;\n\t\tcurr = curr->next;\n\t}\n\treturn -1;\n}", call: "f (top, KEY)", key: true,
      val: function (L, k) { return L.indexOf(k); }, say: "It returns the position of the key (the first node is position 0), or −1 if it is not there.", alt: function (L, k) { var i = L.indexOf(k); return i < 0 ? [L.length, 0] : [i + 1, i - 1]; } },
    { code: "Node * f (Node * top) {\n\tif (top == NULL || top->next == NULL)\n\t\treturn top;\n\tNode * second = top->next;\n\ttop->next = second->next;\n\tsecond->next = top;\n\treturn second;\n}", call: "top = f (top);\nprintList (top);", out: true,
      val: function (L) { var c = L.slice(); var t = c[0]; c[0] = c[1]; c[1] = t; return c.join(" "); }, say: "It swaps the first two nodes by relinking them, and returns the new first node.", alt: function (L) { return [L.join(" "), L.slice(1).join(" "), [L[1]].concat(L.slice(2)).join(" ")]; } },
    { code: "void f (Node * top) {\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tif (curr->data % 2 == 0)\n\t\t\tcurr->data = curr->data / 2;\n\t\tcurr = curr->next;\n\t}\n}", call: "f (top);\nprintList (top);", out: true,
      val: function (L) { return L.map(function (v) { return v % 2 === 0 ? v / 2 : v; }).join(" "); }, say: "It halves every even value and leaves the odd ones.", alt: function (L) { return [L.map(function (v) { return v % 2 ? Math.floor(v / 2) : v; }).join(" "), L.map(function (v) { return Math.floor(v / 2); }).join(" ")]; } },
    { code: "Node * f (Node * top) {\n\tNode * prev = NULL;\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tNode * next = curr->next;\n\t\tcurr->next = prev;\n\t\tprev = curr;\n\t\tcurr = next;\n\t}\n\treturn prev;\n}", call: "top = f (top);\nprintList (top);", out: true,
      val: function (L) { return L.slice().reverse().join(" "); }, say: "It turns every next pointer around, so the list is reversed.", alt: function (L) { return [L.join(" "), [L[L.length - 1]].join(" ")]; } }
  ];
  T.LIST_FN = LIST_FN;
  add({ id: "ll-code", topic: "lists", title: "Trace a list function", marks: 2, make: function (r) {
    var n = r.int(5, 7), L = r.distinct(n, 1, 40), k = r.int(0, LIST_FN.length - 1), F = LIST_FN[k];
    var key = F.key ? (r.chance(0.7) ? r.pick(L) : (function () { var v; do { v = r.int(1, 40); } while (L.indexOf(v) >= 0); return v; })()) : null;
    var v = F.val(L, key), call = F.call.replace("KEY", key);
    return {
      text: "top points to the list shown. What " + (F.out ? "is printed by" : "does this return:") + " " + code(call.replace(/\n/g, " ")) + "?",
      fig: listFig(L), code: F.code, ctx: "List: " + L.join(" → ") + "\nFunction:\n" + F.code + "\nCall: " + call, fnIndex: k, key: key, list: L,
      type: F.out ? "seq" : "num", answer: String(v), wrong: F.alt(L, key).map(String), more: F.out ? seqMore(String(v).split(" ")) : numMore(+v, -1),
      hint: "Follow curr node by node, writing down what each line changes.",
      steps: [F.say, "For " + code(L.join(" → ")) + " that gives " + b(String(v)) + "."]
    };
  } });

  // ---------------------------------------------------------------- recursion
  var REC = [
    { make: function (r) { var n = r.int(100, 9999); return { p: { n: n }, code: "int f (int n) {\n\tif (n == 0)\n\t\treturn 0;\n\treturn n % 10 + f (n / 10);\n}", call: "f (" + n + ")",
      val: String(String(n).split("").reduce(function (a, d) { return a + +d; }, 0)), alt: [String(n % 10), String(String(n).split("").reduce(function (a, d) { return a + +d; }, 0) - n % 10), String(String(n).length)],
      say: "Each call adds the last digit (n % 10) and recurses on the rest (n / 10), so it adds up the digits of " + n + "." }; } },
    { make: function (r) { var n = r.int(3, 4), a = [], c = []; for (var i = n; i >= 1; i--) a.push(i); for (var j = 1; j <= n; j++) c.push(j);
      return { p: { n: n }, out: true, code: "void f (int n) {\n\tif (n == 0)\n\t\treturn;\n\tcout << n << \" \";\n\tf (n - 1);\n\tcout << n << \" \";\n}", call: "f (" + n + ")",
        val: a.concat(c).join(" "), alt: [a.concat(a).join(" "), c.concat(a).join(" "), a.join(" ")],
        say: "Each call prints n on the way down, then again on the way back up after the inner call returns: " + a.join(" ") + " going down, " + c.join(" ") + " coming back." }; } },
    { make: function (r) { var n = r.int(5, 11), v = 0; for (var k = n; k > 1; k -= 2) v += k; v += (n % 2 ? 1 : 0); return { p: { n: n }, code: "int f (int n) {\n\tif (n <= 1)\n\t\treturn n;\n\treturn n + f (n - 2);\n}", call: "f (" + n + ")",
      val: String(v + (n % 2 ? 0 : 0)), alt: [String(n * (n + 1) / 2), String(v - (n % 2 ? 1 : 0) + (n % 2 ? 0 : 1)), String(v + n)],
      say: "It adds n, n − 2, n − 4, ... until n ≤ 1, then adds that last n (0 or 1)." }; } },
    { make: function (r) { var a = r.int(20, 99), bb = r.int(10, 60), g = function (x, y) { return y === 0 ? x : g(y, x % y); }, steps = [], x = a, y = bb; while (y) { steps.push("f (" + x + ", " + y + ")"); var t = x % y; x = y; y = t; } steps.push("f (" + x + ", 0) returns " + x);
      return { p: {}, code: "int f (int a, int b) {\n\tif (b == 0)\n\t\treturn a;\n\treturn f (b, a % b);\n}", call: "f (" + a + ", " + bb + ")",
        val: String(g(a, bb)), alt: [String(a % bb), String(bb), String(Math.min(a, bb) % Math.max(1, g(a, bb) + 1))], say: "The calls are " + steps.join(" → ") + "." }; } },
    { make: function (r) { var bse = r.int(2, 3), e = r.int(3, 5); return { p: {}, code: "int f (int b, int e) {\n\tif (e == 0)\n\t\treturn 1;\n\treturn b * f (b, e - 1);\n}", call: "f (" + bse + ", " + e + ")",
      val: String(Math.pow(bse, e)), alt: [String(bse * e), String(Math.pow(bse, e - 1)), String(Math.pow(bse, e + 1))], say: "f (b, e) multiplies b by itself e times: " + bse + "^" + e + " = " + Math.pow(bse, e) + "." }; } },
    { make: function (r) { var n = r.int(4, 6), calls = function (k) { return k < 2 ? 1 : 1 + calls(k - 1) + calls(k - 2); };
      return { p: {}, code: "int calls = 0;\n\nint f (int n) {\n\tcalls++;\n\tif (n < 2)\n\t\treturn n;\n\treturn f (n - 1) + f (n - 2);\n}", call: "f (" + n + ")", ask: "How many times is f called (what is <code>calls</code> afterwards) when main calls " + code("f (" + n + ")") + "?",
        val: String(calls(n)), alt: [String(n), String(calls(n - 1)), String(2 * n - 1), String(Math.pow(2, n))], say: "Each call with n ≥ 2 makes two more calls. calls(n) = 1 + calls(n − 1) + calls(n − 2), with calls(0) = calls(1) = 1: so calls(" + n + ") = " + calls(n) + "." }; } },
    { make: function (r) { var n = r.int(5, 29), bin = n.toString(2); return { p: {}, out: true, code: "void f (int n) {\n\tif (n == 0)\n\t\treturn;\n\tf (n / 2);\n\tcout << n % 2;\n}", call: "f (" + n + ")",
      val: bin, alt: [bin.split("").reverse().join(""), String(n % 2), (n * 2).toString(2)], say: "It recurses first and prints after, so the remainders come out in reverse order of calculation: " + n + " in binary is " + bin + "." }; } }
  ];
  T.REC = REC;
  add({ id: "rec-trace", topic: "recursion", title: "Trace a recursive function", marks: 1, make: function (r) {
    var k = r.int(0, REC.length - 1), Q = REC[k].make(r);
    return {
      text: Q.ask || "What " + (Q.out ? "does " + code(Q.call) + " print" : "does " + code(Q.call) + " return") + "?",
      code: Q.code, ctx: Q.code + "\nCall: " + Q.call, recIndex: k, call: Q.call,
      type: Q.out ? "seq" : "num", answer: Q.val, wrong: Q.alt, nospace: Q.out && Q.val.indexOf(" ") < 0,
      more: Q.out ? (Q.val.indexOf(" ") >= 0 ? seqMore(Q.val.split(" ")) : function (rr) { var c = Q.val.split(""), i = rr.int(0, c.length - 1); c[i] = c[i] === "1" ? "0" : "1"; return c.join(""); }) : numMore(+Q.val),
      hint: "Write each call on its own line with its parameter values; work out the base case, then return back up.",
      steps: [Q.say, "Answer: " + b(Q.val)]
    };
  } });

  // ---------------------------------------------------------------- stacks and queues
  add({ id: "sq-ops", topic: "stacks", title: "Stack and queue operations", marks: 1, make: function (r) {
    var stack = r.chance(0.5), ds = [], out = [], other = [], ds2 = [], lines = [stack ? "Stack * s = initStack ();" : "Queue * q = initQueue ();"], used = {}, states = [];
    var n = r.int(6, 8);
    for (var i = 0; i < n; i++) {
      if (ds.length && r.chance(0.35)) {
        out.push(stack ? ds.pop() : ds.shift()); other.push(stack ? ds2.shift() : ds2.pop());
        lines.push("cout << " + (stack ? "pop (s)" : "dequeue (q)") + " << \" \";");
      } else {
        var v; do { v = r.int(1, 20); } while (used[v]); used[v] = 1;
        ds.push(v); ds2.push(v);
        lines.push(stack ? "push (s, " + v + ");" : "enqueue (q, " + v + ");");
      }
      states.push(lines[lines.length - 1] + " → " + (stack ? "stack (top last): " : "queue (front first): ") + (ds.join(" ") || "empty"));
    }
    lines.push(stack ? "while (!isEmpty (s))\n\tcout << pop (s) << \" \";" : "while (!isEmpty (q))\n\tcout << dequeue (q) << \" \";");
    var rest = stack ? ds.slice().reverse() : ds.slice(), rest2 = stack ? ds2.slice() : ds2.slice().reverse();
    var ans = out.concat(rest);
    return {
      text: "What does this code print? (The functions are the lecture's " + (stack ? "stack" : "queue") + " functions.)", code: lines.join("\n"), ctx: lines.join("\n"),
      type: "seq", answer: ans.join(" "), wrong: [other.concat(rest2).join(" "), out.concat(ds).join(" "), out.join(" ")], more: seqMore(ans),
      hint: stack ? "A stack is last in, first out: pop takes the value pushed most recently." : "A queue is first in, first out: dequeue takes the value that has waited longest.",
      steps: states.concat(["The final loop " + (stack ? "pops" : "dequeues") + " what is left: " + (rest.join(" ") || "nothing") + ".", "Printed: " + b(ans.join(" "))])
    };
  } });

  add({ id: "sq-brackets", topic: "stacks", title: "Balanced brackets", marks: 1, make: function (r) {
    var P = ["()", "[]", "{}"];
    function bal(n) { if (n <= 0) return ""; var p = r.pick(P), inner = r.int(0, n - 1); return p[0] + bal(inner) + p[1] + bal(n - 1 - inner); }
    function isBal(s) { var st = []; for (var i = 0; i < s.length; i++) { var c = s[i]; if ("([{".indexOf(c) >= 0) st.push(c); else { var o = st.pop(); if (!o || "([{".indexOf(o) !== ")]}".indexOf(c)) return false; } } return !st.length; }
    var good = bal(r.int(3, 5)), bad = [], guard = 0;
    while (bad.length < 3 && guard++ < 300) {
      var s = good.split(""), k = r.int(0, 2);
      if (k === 0) { var i = r.int(0, s.length - 2); var t = s[i]; s[i] = s[i + 1]; s[i + 1] = t; }
      else if (k === 1) { var j = r.int(0, s.length - 1); var c = s[j]; var map = { "(": "[", "[": "{", "{": "(", ")": "]", "]": "}", "}": ")" }; s[j] = map[c]; }
      else s.splice(r.int(0, s.length - 1), 1);
      var w = s.join("");
      if (!isBal(w) && bad.indexOf(w) < 0 && w !== good) bad.push(w);
    }
    var opts = r.shuffle([good].concat(bad));
    return { text: "Which of these strings has <b>balanced</b> brackets?", ctx: "Options: " + opts.join("  "), type: "choice", options: opts.map(function (o) { return "<code>" + esc(o) + "</code>"; }), answer: opts.indexOf(good),
      hint: "Push every opening bracket. Each closing bracket must match the bracket on top of the stack. The stack must be empty at the end.",
      steps: ["Run the stack check on " + code(good) + ": every closing bracket matches the most recent unmatched opener, and nothing is left on the stack, so it is balanced.", "Each of the others either closes with the wrong kind of bracket, closes when the stack is empty, or leaves an opener on the stack."] };
  } });

  // ---------------------------------------------------------------- C++ and pointers
  var PTR = [
    function (r) { var a = r.int(2, 9), bb = r.int(2, 9), c = r.int(1, 5);
      return { code: "int a = " + a + ", b = " + bb + ";\nint * p = &a;\nint * q = &b;\n*p = *q + " + c + ";\nq = p;\n*q = *q * 2;\ncout << a << \" \" << b << endl;",
        val: ((bb + c) * 2) + " " + bb, alt: [(bb + c) + " " + ((bb + c) * 2), (bb + c) + " " + (bb * 2), a + " " + bb],
        say: "*p = *q + " + c + " sets a to " + (bb + c) + ". Then q = p makes q point to a as well, so *q = *q * 2 doubles a to " + ((bb + c) * 2) + ". b is never changed." }; },
    function (r) { var a = r.int(2, 9), bb = r.int(2, 9), c = r.int(5, 20);
      return { code: "void f (int x, int & y) {\n\tx = x + " + c + ";\n\ty = y + x;\n}\n\nint main () {\n\tint a = " + a + ", b = " + bb + ";\n\tf (a, b);\n\tcout << a << \" \" << b << endl;\n\treturn 0;\n}", full: true,
        val: a + " " + (bb + a + c), alt: [(a + c) + " " + (bb + a + c), a + " " + bb, a + " " + (bb + a)],
        say: "x is a copy of a, so changing x does not change a (" + a + "). y is a reference to b, so y = y + x changes b to " + bb + " + " + (a + c) + " = " + (bb + a + c) + "." }; },
    function (r) { var v = r.distinct(5, 1, 30), k = r.int(31, 60);
      return { code: "int A[5] = {" + v.join(", ") + "};\nint * p = A + 1;\n*(p + 2) = " + k + ";\np++;\ncout << *p << \" \" << A[3] << endl;",
        val: v[2] + " " + k, alt: [v[1] + " " + k, k + " " + v[3], v[2] + " " + v[3]],
        say: "p starts at A[1], so p + 2 is A[3]: A[3] becomes " + k + ". Then p++ moves p to A[2], which holds " + v[2] + "." }; },
    function (r) { var a = r.int(2, 9), bb = r.int(10, 30), c = r.int(31, 50);
      return { code: "Node * n1 = createNode (" + a + ");\nNode * n2 = n1;\nn2->data = " + bb + ";\nn2 = createNode (" + c + ");\ncout << n1->data << \" \" << n2->data << endl;",
        val: bb + " " + c, alt: [a + " " + c, c + " " + c, bb + " " + bb],
        say: "n2 = n1 copies the address, so both point to the same node: n2->data = " + bb + " changes that node. Then n2 points to a brand-new node holding " + c + "; n1 still points to the first node." }; },
    function (r) { var a = r.int(2, 9), bb = r.int(2, 9);
      return { code: "int x = " + a + ";\nint & r = x;\nint y = r;\nr = r + " + bb + ";\ny = y * 2;\ncout << x << \" \" << y << endl;",
        val: (a + bb) + " " + (2 * a), alt: [(a + bb) + " " + (2 * (a + bb)), a + " " + (2 * a), (2 * a) + " " + (2 * a)],
        say: "r is another name for x, so r = r + " + bb + " makes x " + (a + bb) + ". y was a copy taken before that (" + a + "), and is then doubled to " + (2 * a) + "." }; },
    function (r) { var a = r.int(2, 9), bb = r.int(10, 20);
      return { code: "void f (int * p, int * q) {\n\tint t = *p;\n\t*p = *q;\n\tq = p;\n\t*q = t + 1;\n}\n\nint main () {\n\tint a = " + a + ", b = " + bb + ";\n\tf (&a, &b);\n\tcout << a << \" \" << b << endl;\n\treturn 0;\n}", full: true,
        val: (a + 1) + " " + bb, alt: [bb + " " + (a + 1), bb + " " + a, (a + 1) + " " + (a + 1)],
        say: "t = " + a + ". *p = *q copies " + bb + " into a. Then q = p only changes the local pointer q, so it now points to a too, and *q = t + 1 sets a to " + (a + 1) + ". b is still " + bb + "." }; },
    function (r) { var v = r.distinct(4, 1, 20);
      var res = v.map(function (x, i) { return x + i; });
      return { code: "void f (int A[], int n) {\n\tfor (int i = 0; i < n; i++)\n\t\tA[i] = A[i] + i;\n}\n\nint main () {\n\tint A[4] = {" + v.join(", ") + "};\n\tf (A, 4);\n\tcout << A[0] << \" \" << A[3] << endl;\n\treturn 0;\n}", full: true,
        val: res[0] + " " + res[3], alt: [v[0] + " " + v[3], (v[0] + 1) + " " + (v[3] + 4), res[0] + " " + v[3]],
        say: "An array is passed by its address, so f changes main's array: A[0] = " + v[0] + " + 0 = " + res[0] + " and A[3] = " + v[3] + " + 3 = " + res[3] + "." }; }
  ];
  T.PTR = PTR;
  add({ id: "cpp-ptr", topic: "cpp", title: "Pointers and references", marks: 1, make: function (r) {
    var k = r.int(0, PTR.length - 1), Q = PTR[k](r);
    return {
      text: "What does this code print?", code: Q.code, ctx: Q.code, ptrIndex: k, full: !!Q.full,
      type: "seq", answer: Q.val, wrong: Q.alt, more: seqMore(Q.val.split(" ")),
      hint: "Draw a box for each variable. A pointer holds an arrow to a box; a reference is another name for the same box.",
      steps: [Q.say, "Printed: " + b(Q.val)]
    };
  } });

  // ---------------------------------------------------------------- statements, the exam's I / II / III style
  var FACTS = {
    bst: { t: ["An inorder traversal of a BST visits the keys in ascending order.", "A new key is always inserted as a leaf.", "The smallest key is found by following left pointers from the root until a node has no left child.", "If a node has a right subtree, its inorder successor is the smallest key in that right subtree.", "When a node with two subtrees is deleted, its inorder successor has no left subtree.", "Inserting n keys in ascending order produces a tree of height n − 1.", "If the node to delete has no subtrees, its parent's pointer to it is simply set to NULL.", "Every key in the left subtree of a node is smaller than the node's key."],
      f: ["A preorder traversal of a BST visits the keys in ascending order.", "The largest key in a BST is always a leaf.", "The inorder successor of a node is always its right child.", "Searching a BST with n nodes takes O(log n) time even in the worst case.", "Inserting the same keys in a different order always gives the same BST.", "When a node with two subtrees is deleted, its left subtree takes its place.", "Every key in the right subtree of a node is smaller than the node's key.", "A new key can be inserted as the new root of a non-empty BST."] },
    heaps: { t: ["In a max-heap, the largest value is always at index 1.", "The children of A[i] are A[2i] and A[2i + 1].", "A heap is an almost complete binary tree.", "buildMaxHeap calls maxHeapify for i from n / 2 down to 1.", "Inserting into a heap of n values takes O(log n) time.", "In a max-heap, every node is at least as large as each of its children.", "heapExtractMax moves the last value to the root and then calls maxHeapify(1).", "Heap sort runs in O(n log n) time in every case."],
      f: ["In a max-heap, the smallest value is always at index n.", "The parent of A[i] is A[i − 1].", "A max-heap is always sorted in descending order.", "Searching for any value in a heap takes O(log n) time.", "buildMaxHeap calls maxHeapify for i from 1 up to n / 2.", "A new value is inserted at the root and then sinks down.", "maxHeapify swaps a node with its smaller child.", "In a max-heap, the left child is always larger than the right child."] },
    trees: { t: ["A tree with only a root has height 0.", "A full binary tree has no node with exactly one child.", "Level order traversal uses a queue.", "The weight of a tree is its number of leaves.", "Every complete binary tree is also almost complete.", "The root is at level 0.", "A complete binary tree of height h has 2^(h+1) − 1 nodes.", "A root with only a left child is a different binary tree from a root with only a right child."],
      f: ["The height of a tree counts the nodes on the longest path from the root to a leaf.", "Every full binary tree is complete.", "Level order traversal uses a stack.", "The moment of a tree is its number of leaves.", "Preorder visits the left subtree before the root.", "Every almost complete binary tree is full.", "Postorder visits the root first.", "The root is at level 1."] },
    lists: { t: ["insertAtHead takes O(1) time.", "The last node's next pointer is NULL.", "Without a tail pointer, insertAtTail must walk the whole list.", "A linked list can grow while the program runs, by creating nodes with new.", "To visit every node, a loop follows next pointers until it reaches NULL.", "deleteAtHead must delete the old first node, or its memory leaks."],
      f: ["A linked list gives access to its i-th node in O(1) time.", "insertAtHead must walk to the end of the list first.", "Deleting a node from a linked list shifts every later node.", "The first node's next pointer is NULL.", "After delete p, the pointer p is automatically set to NULL.", "insertAtTail is O(1) on a list with no tail pointer."] },
    hashing: { t: ["With h(key) = key % N + 1, the locations run from 1 to N.", "Linear probing tries the next location after a collision, wrapping from N back to 1.", "Quadratic probing moves x + x² locations after the x-th collision.", "In double hashing, the step size depends on the key.", "A deleted key is marked with −1 so that searches do not stop there.", "With chaining, keys that hash to the same location are kept in a linked list.", "Linear probing tends to build long runs of full locations (clusters)."],
      f: ["Deleting a key sets its location back to empty (0).", "Quadratic probing always visits every location of the table.", "In double hashing, every key uses the same step size.", "With chaining, the table can never hold more keys than it has locations.", "A search stops as soon as it reaches a location marked −1.", "Searching a hash table is O(1) however many keys collide."] },
    graphs: { t: ["Breadth-first search uses a queue.", "In a directed graph, the degree of a vertex is its in-degree plus its out-degree.", "An undirected graph's adjacency matrix is symmetric.", "A spanning tree of a connected graph with n vertices has n − 1 edges.", "Kruskal's algorithm skips an edge whose two ends are already in the same tree.", "Dijkstra's algorithm takes the vertex with the lowest cost off the queue next.", "Prim's algorithm grows a single tree from a start vertex."],
      f: ["Depth-first search uses a queue.", "Kruskal's algorithm always keeps a single connected tree.", "An adjacency matrix uses less memory than adjacency lists for a graph with few edges.", "Prim's algorithm sorts all the edges first.", "A spanning tree of n vertices has n edges.", "Dijkstra's algorithm takes vertices off the queue in alphabetical order."] },
    sorting: { t: ["Merge sort is O(n log n) in every case.", "Insertion sort is O(n) on an array that is already sorted.", "Selection sort makes the same number of comparisons whatever the input order.", "The lecture's partition uses the last value, A[r], as the pivot.", "Merge sort needs extra memory for the arrays L and R.", "Quick sort is O(n²) in its worst case.", "After each pass of bubble sort, the largest remaining value is in its final place."],
      f: ["Quick sort is O(n log n) in every case.", "Merge sort sorts in place, with no extra arrays.", "Selection sort is O(n) on an array that is already sorted.", "After partition, the values left of the pivot are sorted.", "Heap sort is O(n²) in its worst case.", "The first pass of insertion sort moves the smallest value to the front."] },
    stacks: { t: ["A stack is last in, first out.", "A queue is first in, first out.", "push on a stack built on a linked list is insertAtHead.", "With head and tail pointers, enqueue and dequeue both take O(1) time.", "A stack can check whether brackets are balanced."],
      f: ["A queue removes the value that was added most recently.", "pop removes the node at the end of the list (the bottom of the stack).", "enqueue adds the new node at the head of the queue.", "Level order traversal of a tree uses a stack."] },
    bigo: { t: ["O(n log n) grows more slowly than O(n²).", "A loop that halves n each time runs about log₂ n times.", "Two loops one after the other, each over n items, take O(n) time in total.", "A loop inside a loop, each over n items, takes O(n²) time."],
      f: ["O(log n) grows faster than O(n).", "Two loops one after the other, each over n items, take O(n²) time.", "A loop that doubles its counter until it reaches n runs O(n) times.", "n²/2 + n is O(n)."] }
  };
  T.FACTS = FACTS;
  // ---------------------------------------------------------------- the hand-written mock exam papers (CW1 style)
  var CLASSIC_TOPIC = { LL: "lists", BT: "trees", BST: "bst", HEAP: "heaps", PERF: "bigo" };
  T.CLASSIC_TOPIC = CLASSIC_TOPIC;
  function inl(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>"); }
  function paras(s) { return String(s || "").split(/\n\n+/).filter(Boolean).map(function (p) { return inl(p).replace(/\n/g, "<br>"); }); }
  function classicFig(f) {
    if (!f) return "";
    var cap = f.cap ? '<div class="small muted">' + esc(f.cap) + "</div>" : "";
    if (f.t === "tree") return '<div class="tq-fig">' + CL.drawTree(CL.parseTreeSpec(f.s), { minW: 0 }) + "</div>" + cap;
    if (f.t === "trees") return '<div class="tq-row">' + f.items.map(function (it) { return '<div><div class="small muted">' + esc(it.label) + '</div><div class="tq-mini">' + CL.drawTree(CL.parseTreeSpec(it.s), { dx: 34, dy: 50, r: 14, pad: 20 }) + "</div></div>"; }).join("") + "</div>" + cap;
    if (f.t === "heap") return T.heapFig([null].concat(f.a)) + cap;
    if (f.t === "list") return listFig(f.a) + cap;
    if (f.t === "lists") return f.items.map(function (it) { return '<div class="small muted">' + esc(it.label) + "</div>" + listFig(it.a); }).join("") + cap;
    return "";
  }
  function figText(f) {
    if (!f) return "";
    if (f.t === "tree") return "Tree (key(left,right)): " + f.s;
    if (f.t === "trees") return f.items.map(function (it) { return it.label + " " + it.s; }).join("; ");
    if (f.t === "heap") return "Heap array A[1..n]: " + f.a.join(" ");
    if (f.t === "list") return "List: " + f.a.join(" → ");
    if (f.t === "lists") return f.items.map(function (it) { return it.label + ": " + it.a.join(" → "); }).join("; ");
    return "";
  }
  T.classic = function (it) {
    var text = paras(it.stem).join("<br><br>");
    if (it.st) text += '<div class="tq-roman">' + it.st.map(function (x, i) { return "<div><b>" + ROMAN[i] + ".</b> " + inl(x) + "</div>"; }).join("") + "</div>";
    var steps = paras(it.exp);
    if (it.efig) steps.push(classicFig(it.efig));
    if (it.trap) steps.push("<b>Trap to avoid:</b> " + inl(it.trap));
    steps.push('<span class="muted">Where it is taught: ' + esc(it.src) + "</span>");
    var opts = it.opts.map(inl);
    return { classicId: it.id, topic: CLASSIC_TOPIC[it.topic], marks: it.marks, title: "Mock paper " + (it.exam === "X" ? "extra" : it.exam) + ", question " + it.n,
      text: text, code: it.code || null, fig: classicFig(it.fig), ctx: [it.stem, it.st ? it.st.map(function (x, i) { return ROMAN[i] + ". " + x; }).join("\n") : "", figText(it.fig)].filter(Boolean).join("\n"),
      type: "choice", options: opts, answer: it.ans, wide: true, steps: steps, mcq: { options: opts, answer: it.ans } };
  };
  T.bank = function () { var D = window.CODELAB_DATA; return (D && D.mock) || []; };
  T.makeClassic = function (id) { var it = T.bank().filter(function (x) { return x.id === id; })[0]; if (!it) return null; var q = T.classic(it); q.gen = "classic"; q.seed = id; return q; };
  Object.keys(CLASSIC_TOPIC).forEach(function (k) {
    add({ id: "classic-" + CLASSIC_TOPIC[k], topic: CLASSIC_TOPIC[k], title: "From the mock papers", marks: 2, make: function (r) {
      var pool = T.bank().filter(function (x) { return x.topic === k; });
      return T.classic(r.pick(pool));
    } });
  });

  var ROMAN = ["I", "II", "III"], SETS = [[1, 1, 1], [1, 1, 0], [1, 0, 1], [0, 1, 1]], SET_TXT = ["I, II, and III", "I and II only", "I and III only", "II and III only"];
  Object.keys(FACTS).forEach(function (topic) {
    add({ id: "facts-" + topic, topic: topic, title: "Which statements are true?", marks: 2, make: function (r) {
      var F = FACTS[topic];
      if (r.chance(0.35)) {
        // one true statement among three false ones (or the reverse)
        var wantTrue = r.chance(0.7), right = r.pick(wantTrue ? F.t : F.f), rest = r.shuffle((wantTrue ? F.f : F.t).slice()).slice(0, 3), opts = r.shuffle([right].concat(rest));
        return { text: "Which of the following is <b>" + (wantTrue ? "true" : "false") + "</b>?", ctx: "Options: " + opts.join(" / "), type: "choice", options: opts, answer: opts.indexOf(right), marks: 1, wide: true,
          hint: "Check each statement on its own, against the lecture's definitions.",
          steps: opts.map(function (o) { return (F.t.indexOf(o) >= 0 ? "True: " : "False: ") + esc(o); }) };
      }
      var set = r.int(0, 3), tt = r.shuffle(F.t.slice()), ff = r.shuffle(F.f.slice()), st = SETS[set].map(function (v) { return v ? tt.pop() : ff.pop(); });
      return {
        text: "Which of the following is true?<div class=\"tq-roman\">" + st.map(function (s, i) { return "<div><b>" + ROMAN[i] + ".</b> " + esc(s) + "</div>"; }).join("") + "</div>",
        ctx: st.map(function (s, i) { return ROMAN[i] + ". " + s; }).join("\n"), type: "choice", options: SET_TXT.slice(), answer: set,
        hint: "Decide each statement separately, then pick the option that lists exactly the true ones.",
        steps: st.map(function (s, i) { return ROMAN[i] + " is " + (SETS[set][i] ? "true" : "false") + ": " + esc(s); }).concat(["So the answer is " + b(SET_TXT[set]) + "."])
      };
    } });
  });

  // ---------------------------------------------------------------- "try it with your own values"
  // a complete program for each code-tracing question (the same programs dev/trainer_verify.py checks), so the student
  // can run it, change the values and run it again; and a lab preset for the questions that are about a picture
  var HDR = "#include <iostream>\nusing namespace std;\n\n";
  var NODE = "struct Node {\n\tint data;\n\tNode * next;\n};\n\nNode * createNode (int n) {\n\tNode * newNode = new Node;\n\tnewNode->data = n;\n\tnewNode->next = NULL;\n\treturn newNode;\n}\n\nvoid printList (Node * top) {\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tcout << curr->data << \" \";\n\t\tcurr = curr->next;\n\t}\n\tcout << endl;\n}\n\n";
  var LISTOPS = "Node * insertAtHead (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tnewNode->next = top;\n\treturn newNode;\n}\n\nNode * insertAtTail (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tif (top == NULL)\n\t\treturn newNode;\n\tNode * curr = top;\n\twhile (curr->next != NULL)\n\t\tcurr = curr->next;\n\tcurr->next = newNode;\n\treturn top;\n}\n\nNode * deleteAtHead (Node * top) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tNode * next = top->next;\n\tdelete top;\n\treturn next;\n}\n\nNode * deleteKey (Node * top, int key) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tif (top->data == key) {\n\t\tNode * next = top->next;\n\t\tdelete top;\n\t\treturn next;\n\t}\n\tNode * prev = top;\n\tNode * curr = top->next;\n\twhile (curr != NULL && curr->data != key) {\n\t\tprev = curr;\n\t\tcurr = curr->next;\n\t}\n\tif (curr != NULL) {\n\t\tprev->next = curr->next;\n\t\tdelete curr;\n\t}\n\treturn top;\n}\n\n";
  var STACK = "struct Stack {\n\tNode * top;\n};\n\nStack * initStack () {\n\tStack * s = new Stack;\n\ts->top = NULL;\n\treturn s;\n}\n\nbool isEmpty (Stack * stack) {\n\treturn stack->top == NULL;\n}\n\nvoid push (Stack * stack, int data) {\n\tNode * newNode = createNode (data);\n\tnewNode->next = stack->top;\n\tstack->top = newNode;\n}\n\nint pop (Stack * stack) {\n\tint save = -999;\n\tif (stack->top != NULL) {\n\t\tNode * toDelete = stack->top;\n\t\tstack->top = stack->top->next;\n\t\tsave = toDelete->data;\n\t\tdelete toDelete;\n\t}\n\treturn save;\n}\n\n";
  var QUEUE = "struct Queue {\n\tNode * head;\n\tNode * tail;\n};\n\nQueue * initQueue () {\n\tQueue * q = new Queue;\n\tq->head = NULL;\n\tq->tail = NULL;\n\treturn q;\n}\n\nbool isEmpty (Queue * queue) {\n\treturn queue->head == NULL;\n}\n\nvoid enqueue (Queue * queue, int data) {\n\tNode * newNode = createNode (data);\n\tif (queue->tail == NULL) {\n\t\tqueue->head = newNode;\n\t\tqueue->tail = newNode;\n\t}\n\telse {\n\t\tqueue->tail->next = newNode;\n\t\tqueue->tail = newNode;\n\t}\n}\n\nint dequeue (Queue * queue) {\n\tif (queue->head == NULL)\n\t\treturn -999;\n\tNode * toDelete = queue->head;\n\tint save = toDelete->data;\n\tqueue->head = queue->head->next;\n\tif (queue->head == NULL)\n\t\tqueue->tail = NULL;\n\tdelete toDelete;\n\treturn save;\n}\n\n";
  var BT = "struct BTNode {\n\tint data;\n\tBTNode * left;\n\tBTNode * right;\n};\n\nBTNode * createBTNode (int data) {\n\tBTNode * n = new BTNode;\n\tn->data = data;\n\tn->left = NULL;\n\tn->right = NULL;\n\treturn n;\n}\n\n";
  function buildTree(spec) {
    var root = CL.parseTreeSpec(spec), k = 0, lines = [];
    (function w(n, name) {
      if (n.left) { var c = "n" + (++k); lines.push("\tBTNode * " + c + " = createBTNode (" + n.left.key + ");"); lines.push("\t" + name + "->left = " + c + ";"); w(n.left, c); }
      if (n.right) { var c2 = "n" + (++k); lines.push("\tBTNode * " + c2 + " = createBTNode (" + n.right.key + ");"); lines.push("\t" + name + "->right = " + c2 + ";"); w(n.right, c2); }
    })(root, "root");
    return "\t// the tree from the question: change the keys or the shape here\n\tBTNode * root = createBTNode (" + root.key + ");\n" + lines.join("\n") + "\n";
  }
  function indent(code) { return "\t" + code.replace(/\n/g, "\n\t"); }
  CL.Train.program = function (q) {
    var T = CL.Train;
    try {
      if (q.gen === "bt-code" && T.TREE_FN && q.fnIndex !== undefined) {
        var F = T.TREE_FN[q.fnIndex], spec = /^Tree: (.*)$/m.exec(q.ctx)[1];
        return HDR + BT + F.code + "\n\nint main () {\n" + buildTree(spec) + "\n" + (F.out ? "\t" + F.call + ";\n\tcout << endl;\n" : "\tcout << " + F.call + " << endl;\n") + "\treturn 0;\n}\n";
      }
      if (q.gen === "ll-code" && T.LIST_FN && q.fnIndex !== undefined && q.list) {
        var G = T.LIST_FN[q.fnIndex], L = q.list, call = G.call.replace("KEY", q.key);
        var mk = "\t// the list from the question: change the values here\n\tint values[] = {" + L.join(", ") + "};\n\tint n = " + L.length + ";\n\tNode * top = createNode (values[0]);\n\tNode * last = top;\n\tfor (int i = 1; i < n; i++) {\n\t\tlast->next = createNode (values[i]);\n\t\tlast = last->next;\n\t}\n\tprintList (top);\n";
        return HDR + NODE + G.code + "\n\nint main () {\n" + mk + (G.out ? "\t" + call.replace(/\n/g, "\n\t") + (/;$/.test(call) ? "" : ";") + "\n\tcout << endl;\n" : "\tcout << " + call + " << endl;\n") + "\treturn 0;\n}\n";
      }
      if (q.gen === "ll-ops") return HDR + NODE + LISTOPS + "int main () {\n" + indent(q.code) + "\n\treturn 0;\n}\n";
      if (q.gen === "rec-trace" && q.call) {
        var callLine = q.recIndex === 5 ? "\t" + q.call + ";\n\tcout << calls << endl;\n" : /void f/.test(q.code) ? "\t" + q.call + ";\n\tcout << endl;\n" : "\tcout << " + q.call + " << endl;\n";
        return HDR + q.code + "\n\nint main () {\n\t// change the argument and run it again\n" + callLine + "\treturn 0;\n}\n";
      }
      if (q.gen === "cpp-ptr") return q.full ? HDR + q.code + "\n" : HDR + NODE + "int main () {\n" + indent(q.code) + "\n\treturn 0;\n}\n";
      if (q.gen === "sq-ops") return HDR + NODE + (/Stack/.test(q.code) ? STACK : QUEUE) + "int main () {\n" + indent(q.code) + "\n\tcout << endl;\n\treturn 0;\n}\n";
    } catch (e) { return null; }
    return null;
  };
  CL.Train.labFor = function (q) {
    if (q.lab) return q.lab;
    var m;
    if (/^(bt-props|bt-shape|bt-code)$/.test(q.gen) && (m = /^Tree: (.*)$/m.exec(q.ctx || ""))) return { id: "traversal", preset: { spec: m[1], kind: "level" } };
    if (q.gen === "heap-check" && q.options) return { id: "heap", preset: { vals: String(q.options[q.answer]).split(/\s+/).map(Number), kind: "max", op: "build" } };
    if (q.gen === "hash-step" && (m = /N = (\d+), key (\d+)/.exec(q.ctx || ""))) return { id: "hash", preset: { keys: [+m[2]], method: /Double/.test(q.text) ? "double" : /quadratic/i.test(q.text) ? "quad" : "linear", N: +m[1] } };
    return null;
  };
})(CL);
