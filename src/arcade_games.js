/* COMP 2611 Code Lab — Arcade games 4 to 7: Heap Hero (maxHeapify, buildMaxHeap, deleteMaxHeap), Hash Dash (linear and
   quadratic probing, double hashing, chaining with h = key % N + 1), Dijkstra Dash and MST Rush (Kruskal and Prim).
   Every rule follows the lecture code exactly; the first round of each graph game uses the graph from the slides. */
(function (CL) {
  "use strict";
  var esc = CL.esc, A = CL.Arcade, U = A.util, rnd = U.rnd, shuffle = U.shuffle, distinct = U.distinct;

  // ================================================================ GAME 4: Heap Hero
  A.add({
    id: "heap", title: "Heap Hero", icon: "⛰️", color: "#f472b6", tag: "Lectures 12, 13 · maxHeapify", lives: 3,
    desc: "Run buildMaxHeap and deleteMaxHeap by hand: pick every swap maxHeapify makes.",
    how: "<p>You are <code>maxHeapify</code>. At the glowing node, compare it with its children: tap the <b>larger child</b> to swap, or tap <b>No swap</b> if the node is already the largest.</p><p>First build the max-heap (i from size/2 down to 1), then delete the maximum a few times. Wrong choices cost a life.</p>",
    learn: "maxHeapify, buildMaxHeap (i from heap->size / 2 down to 1) and deleteMaxHeap from Lectures 12 and 13.",
    lesson: "h2-heapify-build",
    start: function (S) {
      var Ar, size, phase, i, cur, extracts, out, W = 640, H = 250;
      function pos(ix) { var d = Math.floor(Math.log2(ix)), p = ix - Math.pow(2, d); return { x: W * (p + 0.5) / Math.pow(2, d), y: 30 + d * 62 }; }
      function round() {
        if (S.over) return;
        var n = Math.min(6 + S.round, 15);
        W = A.boardW(S);
        Ar = [0].concat(distinct(n, 1, 99));
        size = n; phase = "build"; i = Math.floor(size / 2); cur = i; extracts = S.round < 3 ? 2 : 3; out = [];
        S.say("<b>buildMaxHeap</b>: call maxHeapify(heap, i) for i = " + i + " down to 1.");
        settle();
      }
      function largestOf(c) {
        var l = 2 * c, r = 2 * c + 1, lg = c;
        if (l <= size && Ar[l] > Ar[lg]) lg = l;
        if (r <= size && Ar[r] > Ar[lg]) lg = r;
        return lg;
      }
      // skip leaves: maxHeapify on a leaf does nothing
      function settle() {
        if (S.over) return;
        while (true) {
          if (2 * cur > size) {
            if (phase === "build") {
              i--;
              if (i < 1) { buildDone(); return; }
              cur = i;
              continue;
            } else { extractDone(); return; }
          }
          break;
        }
        draw();
      }
      function buildDone() {
        S.bonus(80 + 10 * S.round, "max-heap built");
        S.say("✓ Max-heap built. Now <b>deleteMaxHeap(heap, 1)</b>: the maximum leaves, A[size] moves to A[1], then maxHeapify(heap, 1).", "ok");
        phase = "extract";
        S.later(extractStart, 1400);
      }
      function extractStart() {
        if (S.over) return;
        if (extracts <= 0 || size <= 1) { S.later(function () { S.nextRound(); round(); }, 300); return; }
        extracts--;
        var top = Ar[1];
        out.push(top);
        Ar[1] = Ar[size];
        size--;
        cur = 1;
        S.say("deleteMaxHeap: removed <b>" + top + "</b>; A[" + (size + 1) + "] moved to A[1]. maxHeapify(heap, 1).");
        settle();
      }
      function extractDone() {
        draw();
        S.later(extractStart, 700);
      }
      function draw(flash) {
        var nodes = [], edges = [], lg = largestOf(cur);
        for (var ix = 1; ix <= size; ix++) {
          var a = pos(ix);
          if (2 * ix <= size) { var b = pos(2 * ix); edges.push([a.x, a.y, b.x, b.y, ix === cur && 2 * ix <= size ? "on" : ""]); }
          if (2 * ix + 1 <= size) { var c = pos(2 * ix + 1); edges.push([a.x, a.y, c.x, c.y, ix === cur ? "on" : ""]); }
          var cls = ix === cur ? "hot" : (ix === 2 * cur || ix === 2 * cur + 1) ? "on" : (phase === "build" && ix > i) || (phase === "extract" && ix !== cur) ? "" : "";
          if (flash && flash.indexOf(ix) >= 0) cls = "done";
          nodes.push({ id: String(ix), k: Ar[ix], x: a.x, y: a.y, cls: cls, idx: ix, aria: "index " + ix + ", value " + Ar[ix] });
        }
        var arr = '<div class="hh-arr">';
        for (var j = 1; j <= size; j++) arr += '<div class="hh-c' + (j === cur ? " hot" : (j === 2 * cur || j === 2 * cur + 1) ? " on" : "") + '"><b>' + Ar[j] + "</b><i>" + j + "</i></div>";
        arr += "</div>";
        S.stage.innerHTML = '<div class="tv-head"><span class="chip acc">' + (phase === "build" ? "buildMaxHeap · maxHeapify(heap, " + i + ")" : "deleteMaxHeap · maxHeapify(heap, 1)") + '</span><span class="muted small">size = ' + size + (out.length ? " · deleted: " + out.join(", ") : "") + "</span></div>" +
          A.treeSvg(W, H, nodes, edges, { label: "max-heap", r: W < 480 ? 15 : 18 }) + arr + '<div class="btns hh-btns"><button type="button" class="btn hh-no">No swap: A[' + cur + "] = " + Ar[cur] + " is the largest</button></div>";
        if (!flash) S.say("At index <b>" + cur + "</b> (value " + Ar[cur] + "): children " + [2 * cur, 2 * cur + 1].filter(function (x) { return x <= size; }).map(function (x) { return "A[" + x + "] = " + Ar[x]; }).join(" and ") + ". Which is the largest of the three?");
        void lg;
      }
      function choose(ix) {
        var lg = largestOf(cur), want = lg === cur ? "none" : String(lg);
        if (String(ix) === want) {
          S.hit(40 + 5 * S.round);
          if (want === "none") {
            draw([cur]);
            S.say("✓ A[" + cur + "] = " + Ar[cur] + " is already the largest: maxHeapify stops.", "ok");
            if (phase === "build") { i--; if (i < 1) { buildDone(); return; } cur = i; S.later(settle, 450); }
            else { S.later(extractDone, 450); }
            return;
          }
          var t = Ar[cur]; Ar[cur] = Ar[lg]; Ar[lg] = t;
          var was = cur;
          cur = lg;
          draw([was, lg]);
          S.say("✓ Swap A[" + was + "] and A[" + lg + "], then maxHeapify(heap, " + lg + ").", "ok");
          FX().sfx("pop", 2);
          S.later(settle, 520);
        } else {
          var why = want === "none" ? "A[" + cur + "] = " + Ar[cur] + " is already larger than its children: no swap." : "the largest of the three is A[" + lg + "] = " + Ar[lg] + ".";
          S.miss("Not quite: " + why, "maxHeapify at index " + cur + " (value " + Ar[cur] + "): " + why);
          draw();
        }
      }
      S.hint = function () { var lg = largestOf(cur); return lg === cur ? ".hh-no" : '[data-k="' + lg + '"]'; };
      S.stage.addEventListener("click", function (e) {
        if (S.over) return;
        if (e.target.closest(".hh-no")) { choose("none"); return; }
        var t = e.target.closest("[data-k]");
        if (!t) return;
        var ix = +t.getAttribute("data-k");
        if (ix === cur) { choose("none"); return; }
        choose(ix);
      });
      round();
    }
  });
  function FX() { return CL.FX; }

  // ================================================================ GAME 5: Hash Dash
  var METHODS = {
    linear: { name: "Linear probing", N: 12, rule: "h = key % 12 + 1. On a collision, try the next location (12 wraps round to 1)." },
    quad: { name: "Quadratic probing", N: 12, rule: "h = key % 12 + 1. On collision number x, move forward x + x² from where you are (2, then 6, then 12 ...)." },
    dbl: { name: "Double hashing", N: 13, rule: "h = key % 13 + 1 and step k = key % 11 + 1. On each collision, move forward k." },
    chain: { name: "Chaining", N: 12, rule: "h = key % 12 + 1. The key joins the linked list at that location (at the front)." }
  };
  function probe(T, N, m, key) {
    var loc = key % N + 1, path = [loc], x = 0, step = key % (N - 2) + 1;
    if (m === "chain") return { loc: loc, path: path };
    var tries = 0;
    while (T[loc] !== 0) {
      x++; tries++;
      if (tries > 3 * N) return null;
      if (m === "linear") loc = loc + 1;
      else if (m === "quad") loc = loc + x + x * x;
      else loc = loc + step;
      while (loc > N) loc -= N;
      path.push(loc);
    }
    return { loc: loc, path: path, step: step };
  }
  A.add({
    id: "hash", title: "Hash Dash", icon: "#️⃣", color: "#a78bfa", tag: "Lectures 14, 15 · hashing", lives: 3,
    desc: "Where does each key land? Linear, quadratic, double hashing and chaining.",
    how: "<p>A key arrives. Work out <code>h = key % N + 1</code>, follow the collision rule, and tap the location where the key <b>ends up</b>.</p><p>Each round uses a different method from Lectures 14 and 15. More collisions = more points. Wrong taps cost a life.</p>",
    learn: "h = key % 12 + 1 from Lecture 14, and linear probing, quadratic probing (x + x²), double hashing and chaining from Lecture 15.",
    lesson: "i2-probing",
    start: function (S) {
      var order = ["linear", "quad", "dbl", "chain"], m, N, T, C, keys, k, busy;
      function round() {
        if (S.over) return;
        m = S.round <= 4 ? order[S.round - 1] : order[rnd(0, 3)];
        N = METHODS[m].N;
        T = []; C = [];
        for (var j = 0; j <= N; j++) { T.push(0); C.push([]); }
        var want = Math.min(6 + Math.floor(S.round / 2), 9), pool = shuffle(distinct(40, 10, 99));
        keys = [];
        var sim = T.slice();
        pool.forEach(function (key) {
          if (keys.length >= want) return;
          var pr = probe(sim, N, m, key);
          if (!pr || pr.path.length > 6) return;
          keys.push(key);
          if (m !== "chain") sim[pr.loc] = key;
        });
        k = 0; busy = false;
        draw();
      }
      function draw(path, hot, bad) {
        var cells = "";
        for (var j = 1; j <= N; j++) {
          var cls = (path && path.indexOf(j) >= 0 ? " on" : "") + (hot === j ? " hot" : "") + (bad === j ? " bad" : "");
          cells += '<button type="button" class="hd-c' + cls + '" data-k="' + j + '" aria-label="location ' + j + (T[j] ? ", holds " + T[j] : ", empty") + '"><i>' + j + "</i><b>" + (m === "chain" ? "" : T[j] || "") + "</b>" +
            (m === "chain" ? '<span class="hd-chain">' + C[j].map(function (x) { return "<em>" + x + "</em>"; }).join("") + "</span>" : "") + "</button>";
        }
        var done = k >= keys.length;
        S.stage.innerHTML = '<div class="tv-head"><span class="chip acc">' + METHODS[m].name + '</span><span class="muted small">' + METHODS[m].rule + "</span></div>" +
          '<div class="bb-head"><div class="bb-next">' + (done ? "Table full for this round!" : "Insert <b>" + keys[k] + "</b>") + '</div><div class="bb-queue">' + keys.slice(k + 1).map(function (x) { return "<span>" + x + "</span>"; }).join("") + "</div></div>" +
          '<div class="hd-grid' + (m === "chain" ? " chain" : "") + '" style="--n:' + N + '">' + cells + "</div>";
      }
      function explain(key, pr) {
        var s = "h(" + key + ") = " + key + " % " + N + " + 1 = <b>" + pr.path[0] + "</b>";
        if (m === "dbl" && pr.path.length > 1) s += "; k = " + key + " % " + (N - 2) + " + 1 = " + pr.step;
        for (var j = 1; j < pr.path.length; j++) s += " → " + (m === "quad" ? "(x = " + j + ", +" + (j + j * j) + ") " : "") + "<b>" + pr.path[j] + "</b>";
        return s + (pr.path.length > 1 ? " (" + (pr.path.length - 1) + " collision" + (pr.path.length > 2 ? "s" : "") + ")" : "");
      }
      S.hint = function () { return keys && k < keys.length && !busy ? '[data-k="' + probe(T, N, m, keys[k]).loc + '"]' : null; };
      S.stage.addEventListener("click", function (e) {
        var t = e.target.closest("[data-k]");
        if (!t || S.over || busy || k >= keys.length) return;
        var at = +t.getAttribute("data-k"), key = keys[k], pr = probe(T, N, m, key);
        busy = true;
        if (at === pr.loc) {
          S.hit(40 + 15 * (pr.path.length - 1));
          var step = 0;
          (function anim() {
            if (S.over) return;
            draw(pr.path.slice(0, step + 1), pr.path[step]);
            if (step < pr.path.length - 1) { step++; CL.FX.sfx("tick"); S.later(anim, 150); return; }
            if (m === "chain") C[pr.loc].unshift(key); else T[pr.loc] = key;
            k++;
            S.say("✓ " + explain(key, pr), "ok");
            S.later(function () {
              busy = false;
              draw();
              if (k >= keys.length) { S.bonus(90 + 15 * S.round, "round clear"); busy = true; S.later(function () { S.nextRound(); round(); }, 900); }
            }, 380);
          })();
        } else {
          S.miss("Not " + at + ". " + explain(key, pr) + ".", METHODS[m].name + ": " + explain(key, pr) + ".");
          draw(pr.path, pr.loc, at);
          S.later(function () { busy = false; if (!S.over) draw(); }, 1700);
        }
      });
      round();
    }
  });

  // ================================================================ shared graph drawing for the graph games
  var LECT_DJ = { pos: { A: [2, 0], D: [1, 1], G: [4, 1], B: [0, 2], E: [2.6, 2], F: [1.2, 3], C: [3.2, 3] },
    edges: [["A", "D", 20], ["A", "G", 75], ["D", "B", 40], ["D", "E", 35], ["D", "F", 10], ["D", "G", 45], ["F", "B", 5], ["F", "C", 15], ["F", "E", 40], ["C", "E", 5], ["C", "G", 25], ["E", "G", 10]] };
  var LECT_K = { pos: { A: [1, 0], E: [3, 0], B: [0, 1.5], C: [1.8, 1.6], D: [3.2, 1.5] }, edges: [["A", "B", 1], ["D", "E", 2], ["B", "C", 3], ["C", "D", 4], ["A", "E", 5], ["A", "C", 7], ["A", "D", 10]] };
  var LECT_P = { pos: { A: [0, 1], B: [1, 0], D: [2.3, 0], C: [1.6, 1.2], E: [3.6, 1.2], F: [2.7, 2.2], G: [1, 2.4] },
    edges: [["B", "D", 5], ["A", "B", 6], ["C", "F", 9], ["E", "F", 10], ["B", "C", 11], ["F", "G", 12], ["A", "G", 15], ["C", "D", 17], ["D", "E", 22], ["C", "G", 25]] };
  function place(pos, W, H) {
    var xs = [], ys = [], out = {};
    Object.keys(pos).forEach(function (v) { xs.push(pos[v][0]); ys.push(pos[v][1]); });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    Object.keys(pos).forEach(function (v) { out[v] = { x: 40 + (W - 80) * (x1 > x0 ? (pos[v][0] - x0) / (x1 - x0) : 0.5), y: 36 + (H - 72) * (y1 > y0 ? (pos[v][1] - y0) / (y1 - y0) : 0.5) }; });
    return out;
  }
  // a random graph: vertices A.. on a jittered grid, a random spanning tree plus extra short edges, distinct weights
  function randomGraph(n, directed, extra) {
    var names = "ABCDEFGH".slice(0, n).split(""), pos = {}, cells = shuffle([[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0.5, 2], [1.5, 2], [2.5, 2]]).slice(0, n);
    names.forEach(function (v, i) { pos[v] = [cells[i][0] + (Math.random() - 0.5) * 0.35, cells[i][1] + (Math.random() - 0.5) * 0.3]; });
    var w = shuffle(distinct(30, 1, 40)), wi = 0, edges = [], have = {};
    function d2(a, b) { var dx = pos[a][0] - pos[b][0], dy = pos[a][1] - pos[b][1]; return dx * dx + dy * dy; }
    function add(a, b) { var key = a < b ? a + b : b + a; if (have[key] || a === b) return false; have[key] = 1; edges.push([a, b, w[wi++]]); return true; }
    var inT = [names[0]];
    names.slice(1).forEach(function (v) {
      var best = inT.slice().sort(function (x, y) { return d2(v, x) - d2(v, y); })[rnd(0, Math.min(1, inT.length - 1))];
      if (directed) add(best, v); else add(best, v);
      inT.push(v);
    });
    var pairs = [];
    names.forEach(function (a) { names.forEach(function (b) { if (a < b) pairs.push([a, b, d2(a, b)]); }); });
    pairs.sort(function (x, y) { return x[2] - y[2]; });
    var added = 0;
    pairs.forEach(function (p) { if (added >= extra) return; if (Math.random() < 0.6 && add(directed && Math.random() < 0.5 ? p[1] : p[0], directed && Math.random() < 0.5 ? p[0] : p[1])) added++; });
    return { pos: pos, edges: edges };
  }
  function graphSvg(G, P, W, H, o) {
    var r = 19, s = '<svg class="arc-svg" viewBox="0 0 ' + W + " " + H + '" role="group" aria-label="' + esc(o.label || "graph") + '"><defs><marker id="arcArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>';
    // three layers, so that a weight label is never covered by another edge's click area:
    // the wide invisible click areas, then the visible lines, then the labels (which are clickable too)
    var pads = "", lines = "", labels = "";
    G.edges.forEach(function (e, ix) {
      var a = P[e[0]], b = P[e[1]], dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
      var x1 = a.x + ux * r, y1 = a.y + uy * r, x2 = b.x - ux * (r + (o.directed ? 3 : 0)), y2 = b.y - uy * (r + (o.directed ? 3 : 0));
      var cls = (o.edgeCls && o.edgeCls(e, ix)) || "", mx = (a.x + b.x) / 2 - uy * 11, my = (a.y + b.y) / 2 + ux * 11;
      var click = o.edgeClick && !(o.edgeOff && o.edgeOff(e, ix)), k = ' data-k="e' + ix + '"';
      if (click) pads += '<line class="ge-pad arc-hit"' + k + ' x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
      lines += '<g class="ge ' + cls + '"><line class="g-edge ' + cls + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' + (o.directed ? ' marker-end="url(#arcArr)"' : "") + "/></g>";
      labels += '<g class="ge-w ' + cls + (click ? " arc-hit" : "") + '"' + (click ? k + ' tabindex="0" role="button" aria-label="edge ' + e[0] + " " + e[1] + ", weight " + e[2] + '"' : "") + '><rect x="' + (mx - 13) + '" y="' + (my - 10) + '" width="26" height="20" rx="6"/><text x="' + mx + '" y="' + my + '">' + e[2] + "</text></g>";
    });
    s += pads + lines + labels;
    Object.keys(P).sort().forEach(function (v) {
      var c = (o.nodeCls && o.nodeCls(v)) || "", click = o.nodeClick && (!o.canClick || o.canClick(v));
      s += '<g class="g-node ' + c + (click ? " arc-hit" : "") + '"' + (click ? ' data-k="' + v + '" tabindex="0" role="button" aria-label="vertex ' + v + '"' : "") + ">" + (click ? '<circle class="arc-pad" cx="' + P[v].x + '" cy="' + P[v].y + '" r="' + (r + 8) + '"/>' : "") +
        '<circle cx="' + P[v].x + '" cy="' + P[v].y + '" r="' + r + '"/><text x="' + P[v].x + '" y="' + P[v].y + '">' + v + "</text></g>";
    });
    return s + "</svg>";
  }

  // ================================================================ GAME 6: Dijkstra Dash
  A.add({
    id: "dijkstra", title: "Dijkstra Dash", icon: "🧭", color: "#22d3ee", tag: "Lecture 17 · shortest paths", lives: 3,
    desc: "You are the min-priority queue: pick the vertex Dijkstra takes off next.",
    how: "<p>Dijkstra takes the vertex with the <b>smallest current cost</b> off the min-priority queue, then relaxes the edges leaving it. Tap that vertex each time; the costs update automatically.</p><p>Round 1 is the graph from Lecture 17. Finish with the cost question for a bonus.</p>",
    learn: "Dijkstra's algorithm from Lecture 17: the cost and parent table, the min-priority queue and edge relaxation.",
    lesson: "j4-dijkstra",
    start: function (S) {
      var G, P, V, cost, par, done, last, busy, W = 640, H = 330, phase, quizRight = null;
      S.hint = function () {
        if (busy) return null;
        if (phase === "quiz") return '.dj-q .bo-opt[data-o="' + quizRight + '"]';
        if (phase !== "pick") return null;
        var m = minLeft(), v = V.filter(function (x) { return !done[x] && cost[x] === m; })[0];
        return v ? '[data-k="' + v + '"]' : null;
      };
      function round() {
        if (S.over) return;
        G = S.round === 1 ? LECT_DJ : randomGraph(Math.min(5 + S.round, 8), true, 3 + S.round);
        W = A.boardW(S);
        P = place(G.pos, W, H);
        V = Object.keys(G.pos).sort();
        cost = {}; par = {}; done = {};
        V.forEach(function (v) { cost[v] = Infinity; par[v] = "nil"; });
        cost.A = 0;
        last = {}; busy = false; phase = "pick";
        draw();
        S.say("Every vertex starts on the queue; A has cost 0. Which vertex comes off first?");
      }
      function minLeft() { var m = Infinity; V.forEach(function (v) { if (!done[v] && cost[v] < m) m = cost[v]; }); return m; }
      function table() {
        return '<table class="dj-t"><tr><th>vertex</th>' + V.map(function (v) { return "<th class='" + (done[v] ? "dn" : "") + "'>" + v + "</th>"; }).join("") + "</tr>" +
          "<tr><th>parent</th>" + V.map(function (v) { return "<td class='" + (last[v] ? "chg" : "") + "'>" + par[v] + "</td>"; }).join("") + "</tr>" +
          "<tr><th>cost</th>" + V.map(function (v) { return "<td class='" + (last[v] ? "chg" : "") + (done[v] ? " dn" : "") + "'>" + (cost[v] === Infinity ? "∞" : cost[v]) + "</td>"; }).join("") + "</tr></table>";
      }
      function draw(hot) {
        S.stage.innerHTML = '<div class="tv-head"><span class="chip acc">Dijkstra from A</span><span class="muted small">Black = taken off the queue. Tap the next vertex.</span></div>' +
          graphSvg(G, P, W, H, { directed: true, label: "weighted directed graph", nodeClick: phase === "pick", canClick: function (v) { return !done[v]; },
            nodeCls: function (v) { return done[v] ? "black" : v === hot ? "hot" : last[v] ? "on" : ""; },
            edgeCls: function (e) { return par[e[1]] === e[0] && done[e[1]] ? "on" : ""; } }) + table() + '<div class="dj-q"></div>';
      }
      function finish() {
        phase = "quiz";
        var targets = V.filter(function (v) { return v !== "A" && cost[v] < Infinity; });
        if (!targets.length) { S.later(function () { S.nextRound(); round(); }, 800); return; }
        var t = targets[rnd(0, targets.length - 1)], path = [t];
        while (par[path[0]] !== "nil") path.unshift(par[path[0]]);
        var right = path.join(" → "), opts = [right];
        quizRight = right;
        // wrong options: other real paths in the graph that end at t
        var alts = [];
        (function dfs(v, p, seen) { if (alts.length > 20) return; if (v === t && p.length > 1) { alts.push(p.join(" → ")); return; } G.edges.forEach(function (e) { if (e[0] === v && !seen[e[1]]) { seen[e[1]] = 1; dfs(e[1], p.concat([e[1]]), seen); seen[e[1]] = 0; } }); })("A", ["A"], { A: 1 });
        shuffle(alts).forEach(function (a) { if (opts.length < 4 && opts.indexOf(a) < 0) opts.push(a); });
        shuffle(opts);
        draw();
        var q = S.stage.querySelector(".dj-q");
        q.innerHTML = '<div class="bo-k">Bonus: use the parent row. What is the shortest path from A to ' + t + " (cost " + cost[t] + ")?</div><div class=\"bo-opts\">" + opts.map(function (o) { return '<button type="button" class="bo-opt" data-o="' + esc(o) + '">' + esc(o) + "</button>"; }).join("") + "</div>";
        S.say("✓ The queue is empty. Read a path from the table: follow the parents back from the end.", "ok");
        q.addEventListener("click", function (e) {
          var b = e.target.closest(".bo-opt");
          if (!b || phase !== "quiz") return;
          phase = "wait";
          q.querySelectorAll(".bo-opt").forEach(function (x) { if (x.getAttribute("data-o") === right) x.classList.add("right"); });
          if (b.getAttribute("data-o") === right) { b.classList.add("right"); S.hit(80); S.bonus(60 + 20 * S.round, "path found"); }
          else { b.classList.add("wrong"); S.miss("The path is " + right + ": follow parent links back from " + t + ".", "Path to " + t + ": " + right + " (follow the parents back from " + t + ")."); }
          S.later(function () { S.nextRound(); round(); }, 1500);
        });
      }
      S.stage.addEventListener("click", function (e) {
        var t = e.target.closest("[data-k]");
        if (!t || S.over || busy || phase !== "pick") return;
        var v = t.getAttribute("data-k"), m = minLeft();
        if (done[v]) return;
        if (m === Infinity) { finish(); return; }
        if (cost[v] === m) {
          busy = true;
          done[v] = true;
          last = {};
          var notes = [];
          G.edges.filter(function (e) { return e[0] === v; }).sort(function (a, b) { return a[1] < b[1] ? -1 : 1; }).forEach(function (e) {
            if (done[e[1]]) return;
            var nc = cost[v] + e[2];
            if (nc < cost[e[1]]) { notes.push(e[1] + ": " + (cost[e[1]] === Infinity ? "∞" : cost[e[1]]) + " → <b>" + nc + "</b>"); cost[e[1]] = nc; par[e[1]] = v; last[e[1]] = 1; }
            else notes.push(e[1] + ": " + cost[v] + " + " + e[2] + " = " + nc + " is not lower");
          });
          S.hit(50 + 5 * S.round);
          draw(v);
          S.say("✓ " + v + " (cost " + cost[v] + ") comes off. " + (notes.length ? "Relax: " + notes.join("; ") + "." : "No edges leave " + v + " to unfinished vertices."), "ok");
          S.later(function () {
            busy = false;
            if (minLeft() === Infinity) finish(); else draw();
          }, 900);
        } else {
          var best = V.filter(function (x) { return !done[x] && cost[x] === m; });
          S.miss(v + " has cost " + (cost[v] === Infinity ? "∞" : cost[v]) + ", but " + best.join(" or ") + " has a lower cost: " + m + ".", "Dijkstra takes the smallest cost next: " + best.join(" or ") + " (" + m + "), not " + v + " (" + (cost[v] === Infinity ? "∞" : cost[v]) + ").");
          draw(best[0]);
          S.later(function () { if (!S.over) draw(); }, 1000);
        }
      });
      round();
    }
  });

  // ================================================================ GAME 7: MST Rush (Kruskal and Prim)
  A.add({
    id: "mst", title: "MST Rush", icon: "🕸️", color: "#34d399", tag: "Lecture 19 · Kruskal and Prim", lives: 3,
    desc: "Build minimum-cost spanning trees edge by edge with Kruskal's and Prim's algorithms.",
    how: "<p><b>Kruskal</b>: always take the cheapest edge that joins two different trees (skip edges that make a cycle).</p><p><b>Prim</b>: start at A and always take the cheapest edge from a used vertex to an unused one.</p><p>Tap the edges in the order the algorithm takes them. Rounds 1 and 2 use the graphs from Lecture 19.</p>",
    learn: "Kruskal's and Prim's minimum-cost spanning tree algorithms from Lecture 19 (n − 1 edges, no cycles, minimum total weight).",
    lesson: "j5-mst",
    start: function (S) {
      var G, P, V, mode, taken, comp, used, total, busy, W = 640, H = 320;
      function round() {
        if (S.over) return;
        mode = S.round % 2 === 1 ? "kruskal" : "prim";
        G = S.round === 1 ? LECT_K : S.round === 2 ? LECT_P : randomGraph(Math.min(4 + Math.ceil(S.round / 2), 8), false, 3 + Math.floor(S.round / 2));
        W = A.boardW(S);
        P = place(G.pos, W, H);
        V = Object.keys(G.pos).sort();
        taken = {}; comp = {}; used = { A: 1 }; total = 0; busy = false;
        V.forEach(function (v) { comp[v] = v; });
        draw();
        S.say(mode === "kruskal" ? "<b>Kruskal</b>: every vertex starts as its own tree. Tap the cheapest edge that joins two different trees." : "<b>Prim</b>: used vertices = {A}. Tap the cheapest edge from a used vertex to an unused one.");
      }
      function find(v) { while (comp[v] !== v) v = comp[v]; return v; }
      function candidates() {
        var c = [];
        G.edges.forEach(function (e, ix) {
          if (taken[ix]) return;
          if (mode === "kruskal" ? find(e[0]) !== find(e[1]) : (!!used[e[0]] !== !!used[e[1]])) c.push(ix);
        });
        var m = Infinity;
        c.forEach(function (ix) { m = Math.min(m, G.edges[ix][2]); });
        return { list: c, min: m, best: c.filter(function (ix) { return G.edges[ix][2] === m; }) };
      }
      function draw(flash) {
        var n = Object.keys(taken).length;
        S.stage.innerHTML = '<div class="tv-head"><span class="chip acc">' + (mode === "kruskal" ? "Kruskal's algorithm" : "Prim's algorithm (from A)") + '</span><span class="muted small">' + n + " of " + (V.length - 1) + " edges · total cost " + total + "</span></div>" +
          graphSvg(G, P, W, H, { directed: false, label: "weighted undirected graph", edgeClick: true, edgeOff: function (e, ix) { return !!taken[ix]; },
            nodeCls: function (v) { return mode === "prim" ? (used[v] ? "done" : "") : ""; },
            edgeCls: function (e, ix) { return taken[ix] ? "on mst" : flash === ix ? "hot" : ""; } }) +
          '<div class="mst-list">' + (mode === "kruskal" ? "Edges by weight: " + G.edges.map(function (e, ix) { return { e: e, ix: ix }; }).sort(function (a, b) { return a.e[2] - b.e[2]; }).map(function (x) {
            var st = taken[x.ix] ? "tk" : find(x.e[0]) === find(x.e[1]) ? "cy" : "";
            return '<span class="' + st + '">(' + x.e[0] + ", " + x.e[1] + ", " + x.e[2] + ")</span>";
          }).join(" ") : "Used vertices: {" + V.filter(function (v) { return used[v]; }).join(", ") + "} · unused: {" + V.filter(function (v) { return !used[v]; }).join(", ") + "}") + "</div>";
      }
      S.hint = function () { if (busy) return null; var c = candidates(); return c.best.length ? '[data-k="e' + c.best[0] + '"]' : null; };
      S.stage.addEventListener("click", function (e) {
        var t = e.target.closest("[data-k]");
        if (!t || S.over || busy) return;
        var ix = +t.getAttribute("data-k").slice(1);
        if (taken[ix]) return;
        var ed = G.edges[ix], c = candidates();
        if (c.best.indexOf(ix) >= 0) {
          taken[ix] = true;
          total += ed[2];
          if (mode === "kruskal") comp[find(ed[0])] = find(ed[1]); else { used[ed[0]] = 1; used[ed[1]] = 1; }
          S.hit(50 + 5 * S.round);
          draw();
          var n = Object.keys(taken).length;
          if (n === V.length - 1) {
            S.say("✓ Spanning tree complete: " + n + " edges (n − 1), minimum cost <b>" + total + "</b>.", "ok");
            S.bonus(100 + 20 * S.round, "MST cost " + total);
            busy = true;
            S.later(function () { S.nextRound(); round(); }, 1500);
          } else S.say("✓ (" + ed[0] + ", " + ed[1] + ", " + ed[2] + ") taken. Total so far: " + total + ".", "ok");
        } else {
          var why;
          if (mode === "kruskal" && find(ed[0]) === find(ed[1])) why = ed[0] + " and " + ed[1] + " are already in the same tree: this edge makes a cycle.";
          else if (mode === "prim" && used[ed[0]] && used[ed[1]]) why = "both ends are already used: this edge makes a cycle.";
          else if (mode === "prim" && !used[ed[0]] && !used[ed[1]]) why = "neither end is used yet: Prim only grows from the used vertices.";
          else { var b = G.edges[c.best[0]]; why = "(" + b[0] + ", " + b[1] + ", " + b[2] + ") is cheaper."; }
          S.miss("Not (" + ed[0] + ", " + ed[1] + ", " + ed[2] + "): " + why, (mode === "kruskal" ? "Kruskal" : "Prim") + ": (" + ed[0] + ", " + ed[1] + ", " + ed[2] + ") was wrong because " + why);
          draw(c.best[0]);
          S.later(function () { if (!S.over) draw(); }, 1100);
        }
      });
      round();
    }
  });
})(CL);
