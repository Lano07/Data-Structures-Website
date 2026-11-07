/* COMP 2611 Code Lab — labs for the course-outline topics: the Matrix Lab (triangular, symmetric, band and sparse
   storage), the Floyd Lab (all-pairs shortest paths) and the Integer Sort Lab (counting sort and radix sort).
   All three use the shared step player, so Watch and Your turn work as in the other labs. */
(function (CL) {
  "use strict";
  var esc = CL.esc, T = CL.tagCode;
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  // ================================================================ MATRIX LAB
  var MX = {
    lower: { name: "Lower triangular", stores: function (i, j) { return j <= i; }, idx: function (i, j) { return i * (i + 1) / 2 + j; }, count: function (n) { return n * (n + 1) / 2; },
      formula: function (i, j) { return i + "(" + i + " + 1)/2 + " + j + " = " + (i * (i + 1) / 2) + " + " + j; },
      code: T("int lowerIndex (int i, int j) {\n\treturn i * (i + 1) / 2 + j;              //@idx\n}\n\nvoid pack (int M[N][N], int L[]) {\n\tfor (int i = 0; i < N; i++)               //@row\n\t\tfor (int j = 0; j <= i; j++)          //@col\n\t\t\tL[lowerIndex (i, j)] = M[i][j];   //@store\n}"),
      order: function (n) { var o = []; for (var i = 0; i < n; i++) for (var j = 0; j <= i; j++) o.push([i, j]); return o; } },
    upper: { name: "Upper triangular", stores: function (i, j) { return i <= j; }, idx: function (i, j) { return j * (j + 1) / 2 + i; }, count: function (n) { return n * (n + 1) / 2; },
      formula: function (i, j) { return j + "(" + j + " + 1)/2 + " + i + " = " + (j * (j + 1) / 2) + " + " + i; },
      code: T("int upperIndex (int i, int j) {\n\treturn j * (j + 1) / 2 + i;              //@idx\n}\n\nvoid pack (int M[N][N], int U[]) {\n\tfor (int j = 0; j < N; j++)               //@row\n\t\tfor (int i = 0; i <= j; i++)          //@col\n\t\t\tU[upperIndex (i, j)] = M[i][j];   //@store\n}"),
      order: function (n) { var o = []; for (var j = 0; j < n; j++) for (var i = 0; i <= j; i++) o.push([i, j]); return o; } },
    sym: { name: "Symmetric", stores: function (i, j) { return j <= i; }, idx: function (i, j) { if (j > i) { var t = i; i = j; j = t; } return i * (i + 1) / 2 + j; }, count: function (n) { return n * (n + 1) / 2; },
      formula: function (i, j) { if (j > i) { var t = i; i = j; j = t; } return "(" + i + ", " + j + ") after swapping: " + i + "(" + i + " + 1)/2 + " + j + " = " + (i * (i + 1) / 2) + " + " + j; },
      code: T("int getSym (int S[], int i, int j) {\n\tif (j > i) {                              //@swap\n\t\tint t = i;\n\t\ti = j;\n\t\tj = t;\n\t}\n\treturn S[i * (i + 1) / 2 + j];            //@idx\n}\n\nvoid pack (int M[N][N], int S[]) {\n\tfor (int i = 0; i < N; i++)               //@row\n\t\tfor (int j = 0; j <= i; j++)          //@col\n\t\t\tS[i * (i + 1) / 2 + j] = M[i][j]; //@store\n}"),
      order: function (n) { var o = []; for (var i = 0; i < n; i++) for (var j = 0; j <= i; j++) o.push([i, j]); return o; } },
    band: { name: "Tridiagonal (band)", stores: function (i, j) { return Math.abs(i - j) <= 1; }, idx: function (i, j) { return 2 * i + j; }, count: function (n) { return 3 * n - 2; },
      formula: function (i, j) { return "2 × " + i + " + " + j; },
      code: T("int bandIndex (int i, int j) {\n\treturn 2 * i + j;                         //@idx\n}\n\nvoid pack (int M[N][N], int B[]) {\n\tfor (int i = 0; i < N; i++)               //@row\n\t\tfor (int j = i - 1; j <= i + 1; j++)  //@col\n\t\t\tif (j >= 0 && j < N)\n\t\t\t\tB[bandIndex (i, j)] = M[i][j]; //@store\n}"),
      order: function (n) { var o = []; for (var i = 0; i < n; i++) for (var j = i - 1; j <= i + 1; j++) if (j >= 0 && j < n) o.push([i, j]); return o; } },
    sparse: { name: "Sparse (triplets)", stores: null, count: null,
      code: T("int toTriplets (int M[R][C], Term T[]) {\n\tint t = 0;\n\tfor (int i = 0; i < R; i++)               //@row\n\t\tfor (int j = 0; j < C; j++)           //@col\n\t\t\tif (M[i][j] != 0) {               //@test\n\t\t\t\tT[t].row = i;                 //@store\n\t\t\t\tT[t].col = j;\n\t\t\t\tT[t].value = M[i][j];\n\t\t\t\tt++;\n\t\t\t}\n\treturn t;\n}") }
  };
  function matrixOf(kind, n) {
    var M = [];
    for (var i = 0; i < n; i++) { M.push([]); for (var j = 0; j < n; j++) M[i].push(0); }
    if (kind === "sparse") {
      var cells = Math.max(3, Math.round(n * n * 0.18));
      while (cells > 0) { var a = rnd(0, n - 1), b = rnd(0, n - 1); if (!M[a][b]) { M[a][b] = rnd(1, 9); cells--; } }
      return M;
    }
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
      if (kind === "sym") { if (j <= i) { M[i][j] = rnd(1, 9); M[j][i] = M[i][j]; } }
      else if (MX[kind].stores(i, j)) M[i][j] = rnd(1, 9);
    }
    return M;
  }
  CL.Labs.matrix = function (host, preset) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Matrix", '<select id="mx-kind"><option value="lower">Lower triangular</option><option value="upper">Upper triangular</option><option value="sym">Symmetric</option><option value="band">Tridiagonal (band)</option><option value="sparse">Sparse (triplets)</option></select>'));
    ctl.appendChild(CL.opGroup("Size n", '<select id="mx-n"><option>3</option><option>4</option><option selected>5</option><option>6</option><option>7</option><option>8</option></select>'));
    ctl.appendChild(CL.opGroup("", '<button type="button" class="btn primary" id="mx-go">Pack it</button><button type="button" class="btn" id="mx-new">New values</button>'));
    host.appendChild(ctl);
    var kind = "lower", n = 5, M = matrixOf("lower", 5), pick = null;
    var player = new CL.Player(host, {
      render: function (f) { draw(f); },
      describe: function () { return "Matrix kind: " + MX[kind].name + ", n = " + n + "."; }
    });
    player.lab = "matrix";
    function slotsOf() { if (kind === "sparse") return []; return MX[kind].order(n); }
    function draw(f) {
      var cur = f.cell, filled = f.filled || 0, order = slotsOf(), store = [];
      if (kind !== "sparse") { var total = MX[kind].count(n); for (var s = 0; s < total; s++) store.push(null); order.slice(0, filled).forEach(function (c) { store[MX[kind].idx(c[0], c[1])] = M[c[0]][c[1]]; }); }
      var html = '<div class="mx-wrap"><table class="mx-grid" role="grid" aria-label="the matrix"><tr><th></th>' + M[0].map(function (_, j) { return "<th>" + j + "</th>"; }).join("") + "</tr>";
      for (var i = 0; i < n; i++) {
        html += "<tr><th>" + i + "</th>";
        for (var j = 0; j < n; j++) {
          var kept = kind === "sparse" ? M[i][j] !== 0 : MX[kind].stores(i, j), mirror = kind === "sym" && j > i;
          var cls = kept ? "kept" : mirror ? "mirror" : "zero";
          if (cur && cur[0] === i && cur[1] === j) cls += " hot";
          if (pick && pick[0] === i && pick[1] === j) cls += " pick";
          if (pick && kind === "sym" && pick[0] === j && pick[1] === i && j !== i) cls += " pick2";
          html += '<td><button type="button" class="mx-c ' + cls + '" data-i="' + i + '" data-j="' + j + '" aria-label="row ' + i + ", column " + j + ", value " + M[i][j] + '">' + M[i][j] + "</button></td>";
        }
        html += "</tr>";
      }
      html += "</table>";
      if (kind === "sparse") {
        var trip = f.trip || [];
        html += '<div class="mx-side"><div class="small muted">Triplets (row, column, value): ' + trip.length + " stored, " + 3 * trip.length + " ints instead of " + n * n + '</div><div class="mx-trip">' +
          trip.map(function (t, k) { return '<div class="' + (k === trip.length - 1 && f.cell ? "hot" : "") + '"><i>' + k + "</i>(" + t[0] + ", " + t[1] + ", " + t[2] + ")</div>"; }).join("") + "</div></div>";
      } else {
        var hotIdx = cur && !f.hideSlot ? MX[kind].idx(cur[0], cur[1]) : -1, pickIdx = pick ? MX[kind].idx(pick[0], pick[1]) : -1;
        html += '<div class="mx-side"><div class="small muted">1-D array: ' + store.length + " cells instead of " + n * n + '</div><div class="mx-arr">' + store.map(function (v, k) {
          return '<div class="' + (k === hotIdx ? "hot" : k === pickIdx ? "pick" : v !== null ? "done" : "") + '"><b>' + (v === null ? "" : v) + "</b><i>" + k + "</i></div>";
        }).join("") + "</div></div>";
      }
      player.stage.innerHTML = html + "</div>";
      var info = "";
      if (pick) {
        var pi = pick[0], pj = pick[1];
        if (kind === "sparse") info = M[pi][pj] ? "M[" + pi + "][" + pj + "] = " + M[pi][pj] + " is stored as a triplet; finding it means searching the triplets." : "M[" + pi + "][" + pj + "] is 0: it is not stored at all.";
        else if (!MX[kind].stores(pi, pj) && !(kind === "sym")) info = "M[" + pi + "][" + pj + "] is outside the stored part, so it is always 0 and takes no memory.";
        else info = "M[" + pi + "][" + pj + "] lives at index <b>" + MX[kind].idx(pi, pj) + "</b>: " + MX[kind].formula(pi, pj) + ".";
      }
      player.extra.innerHTML = '<div class="kv"><span>Kind</span><b>' + esc(MX[kind].name) + "</b><span>Plain array</span><b>" + n * n + " cells</b>" + (kind !== "sparse" ? "<span>Packed</span><b>" + MX[kind].count(n) + " cells</b>" : "") + "</div>" +
        '<p class="small mx-pick">' + (info || "Click any cell of the matrix to see where it is stored.") + "</p>";
    }
    player.stage.addEventListener("click", function (e) {
      var b = e.target.closest(".mx-c");
      if (!b) return;
      pick = [+b.getAttribute("data-i"), +b.getAttribute("data-j")];
      player.go(player.i);
    });
    function run() {
      kind = host.querySelector("#mx-kind").value;
      n = +host.querySelector("#mx-n").value;
      pick = null;
      var C = MX[kind].code.L, frames = [];
      player.setCode(kind === "sparse" ? "toTriplets" : "Packing a " + MX[kind].name.toLowerCase() + " matrix", MX[kind].code.code);
      if (kind === "sparse") {
        var trip = [];
        frames.push({ text: "A sparse matrix is mostly zeros, with no pattern. Scan it row by row and keep a (row, column, value) triplet for each non-zero entry.", line: C.row, trip: [] });
        for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) if (M[i][j]) {
          var ask = trip.length % 2 === 0 ? CL.mkAsk("The scan reaches the next non-zero entry. Which triplet is added?", "(" + i + ", " + j + ", " + M[i][j] + ")", ["(" + j + ", " + i + ", " + M[i][j] + ")", "(" + i + ", " + j + ", " + trip.length + ")", "(" + (i + 1) + ", " + j + ", " + M[i][j] + ")"], { view: { cell: null, trip: trip.slice() } }) : null;
          trip.push([i, j, M[i][j]]);
          frames.push({ text: "M[" + i + "][" + j + "] = " + M[i][j] + " is non-zero: add the triplet (" + i + ", " + j + ", " + M[i][j] + ") at T[" + (trip.length - 1) + "].", line: C.store, cell: [i, j], trip: trip.slice(), ask: ask });
        }
        frames.push({ text: trip.length + " triplets: " + 3 * trip.length + " ints instead of " + n * n + ". " + (3 * trip.length < n * n ? "That saves memory, because fewer than a third of the entries are non-zero." : "That does not save memory: a third or more of the entries are non-zero."), line: C.row, trip: trip.slice() });
      } else {
        var order = MX[kind].order(n), mk = MX[kind];
        frames.push({ text: mk.name + ": only " + mk.count(n) + " of the " + n * n + " entries can be non-zero" + (kind === "sym" ? " or different (the upper half mirrors the lower half)" : "") + ". Pack them " + (kind === "upper" ? "column by column" : "row by row") + " into a 1-D array.", line: C.row, filled: 0 });
        order.forEach(function (c, k) {
          var i2 = c[0], j2 = c[1], at = mk.idx(i2, j2), ask = null;
          if (k > 0 && k % 3 === 1) {
            var wrong = [i2 * n + j2, j2 * (j2 + 1) / 2 + i2, i2 * (i2 - 1) / 2 + j2, at + 1, at - 1].filter(function (x) { return x >= 0 && x !== at; });
            ask = CL.mkAsk("At which index of the 1-D array does M[" + i2 + "][" + j2 + "] go?", at, wrong, { view: { cell: c, filled: k, hideSlot: true } }, "sort");
          }
          frames.push({ text: "M[" + i2 + "][" + j2 + "] = " + M[i2][j2] + " goes to index " + at + ": " + mk.formula(i2, j2) + " = " + at + ".", line: C.store, cell: c, filled: k + 1, ask: ask });
        });
        frames.push({ text: "Packed: " + mk.count(n) + " cells instead of " + n * n + ". Any entry can still be read in O(1) time with the formula. Click a cell to check one.", line: C.idx, filled: order.length });
      }
      player.load(frames);
    }
    host.querySelector("#mx-go").addEventListener("click", run);
    host.querySelector("#mx-kind").addEventListener("change", function () { M = matrixOf(host.querySelector("#mx-kind").value, +host.querySelector("#mx-n").value); run(); });
    host.querySelector("#mx-n").addEventListener("change", function () { M = matrixOf(host.querySelector("#mx-kind").value, +host.querySelector("#mx-n").value); run(); });
    host.querySelector("#mx-new").addEventListener("click", function () { M = matrixOf(host.querySelector("#mx-kind").value, +host.querySelector("#mx-n").value); run(); });
    run();
    return player;
  };

  // ================================================================ FLOYD LAB
  var INF = Infinity;
  var FGRAPHS = [
    { name: "Lectures 16–17 weighted graph", V: ["A", "B", "C", "D", "E", "F", "G"], pos: { A: [2, 0], D: [1, 1], G: [4, 1], B: [0, 2], E: [2.6, 2], F: [1.2, 3], C: [3.2, 3] },
      E: [["A", "D", 20], ["A", "G", 75], ["D", "B", 40], ["D", "E", 35], ["D", "F", 10], ["D", "G", 45], ["F", "B", 5], ["F", "C", 15], ["F", "E", 40], ["C", "E", 5], ["C", "G", 25], ["E", "G", 10]] },
    { name: "Lesson example (4 vertices)", V: ["A", "B", "C", "D"], pos: { A: [0, 0], B: [2, 0], C: [2, 2], D: [0, 2] },
      E: [["A", "B", 3], ["A", "D", 7], ["B", "A", 8], ["B", "C", 2], ["C", "A", 5], ["C", "D", 1], ["D", "A", 2]] },
    { name: "Random graph (5 vertices)", random: true }
  ];
  function randomFloydGraph() {
    var V = ["A", "B", "C", "D", "E"], pos = { A: [1, 0], B: [2.2, 0.7], C: [1.8, 2], D: [0.2, 2], E: [-0.2, 0.7] }, E = [], have = {};
    V.forEach(function (u, i) { var v = V[(i + 1) % 5]; E.push([u, v, rnd(1, 9)]); have[u + v] = 1; });
    for (var k = 0; k < 4; k++) { var a = V[rnd(0, 4)], b = V[rnd(0, 4)]; if (a !== b && !have[a + b] && !have[b + a]) { E.push([a, b, rnd(2, 15)]); have[a + b] = 1; } }
    return { name: "Random", V: V, pos: pos, E: E };
  }
  var FCODE = T("void floyd (int dist[V][V]) {\n\tfor (int k = 0; k < V; k++)                     //@k\n\t\tfor (int i = 0; i < V; i++)                 //@i\n\t\t\tfor (int j = 0; j < V; j++)             //@j\n\t\t\t\tif (dist[i][k] + dist[k][j] < dist[i][j])   //@test\n\t\t\t\t\tdist[i][j] = dist[i][k] + dist[k][j]; //@set\n}");
  function fmt(x) { return x === INF ? "∞" : String(x); }
  CL.Labs.floyd = function (host) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Graph", '<select id="fl-g">' + FGRAPHS.map(function (g, i) { return '<option value="' + i + '">' + esc(g.name) + "</option>"; }).join("") + "</select>"));
    ctl.appendChild(CL.opGroup("", '<button type="button" class="btn primary" id="fl-go">Run Floyd</button>'));
    host.appendChild(ctl);
    var G;
    var player = new CL.Player(host, {
      render: function (f) {
        var V = G.V, n = V.length, d = f.d;
        var html = '<div class="fl-wrap"><table class="fl-m"><tr><th></th>' + V.map(function (v, j) { return "<th class='" + (f.k === j ? "kk" : "") + "'>" + v + "</th>"; }).join("") + "</tr>";
        for (var i = 0; i < n; i++) {
          html += "<tr><th class='" + (f.k === i ? "kk" : "") + "'>" + V[i] + "</th>";
          for (var j = 0; j < n; j++) {
            var cls = (f.k === i || f.k === j ? "kline " : "") + (f.cell && f.cell[0] === i && f.cell[1] === j ? "hot " : "") + (f.cell && ((f.cell[0] === i && f.k === j) || (f.k === i && f.cell[1] === j)) ? "on " : "") + (f.changed && f.changed[i + "," + j] ? "chg " : "") + (d[i][j] === INF ? "inf" : "");
            html += '<td class="' + cls + '">' + fmt(d[i][j]) + "</td>";
          }
          html += "</tr>";
        }
        html += "</table>" + graphSvg(f) + "</div>";
        player.stage.innerHTML = html;
        player.extra.innerHTML = '<div class="kv"><span>Pass</span><b>' + (f.k === undefined ? "not started" : "k = " + V[f.k] + " (" + (f.k + 1) + " of " + n + ")") + "</b><span>Updates so far</span><b>" + (f.ups || 0) + "</b><span>Cost</span><span>O(V³) = " + n + "³ = " + n * n * n + " checks</span></div>";
      },
      describe: function (f) { return "Floyd's algorithm on " + G.name + ". Current pass k = " + (f.k === undefined ? "none" : G.V[f.k]) + "."; }
    });
    player.lab = "floyd";
    function graphSvg(f) {
      var W = 300, H = 220, xs = [], ys = [];
      G.V.forEach(function (v) { xs.push(G.pos[v][0]); ys.push(G.pos[v][1]); });
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys), P = {};
      G.V.forEach(function (v) { P[v] = { x: 26 + (W - 52) * (G.pos[v][0] - x0) / (x1 - x0 || 1), y: 22 + (H - 44) * (G.pos[v][1] - y0) / (y1 - y0 || 1) }; });
      var hi = {}, kv = f.k !== undefined ? G.V[f.k] : null;
      if (f.cell) { hi[G.V[f.cell[0]]] = "on"; hi[G.V[f.cell[1]]] = "on"; }
      if (kv) hi[kv] = "hot";
      var s = '<svg class="fl-g" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="the graph"><defs><marker id="flArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="currentColor"/></marker></defs>';
      G.E.forEach(function (e) {
        var a = P[e[0]], b = P[e[1]], dx = b.x - a.x, dy = b.y - a.y, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, r = 13;
        var onPath = f.cell && kv && ((e[0] === G.V[f.cell[0]] && e[1] === kv) || (e[0] === kv && e[1] === G.V[f.cell[1]]));
        s += '<line class="g-edge ' + (onPath ? "hot" : "") + '" x1="' + (a.x + ux * r) + '" y1="' + (a.y + uy * r) + '" x2="' + (b.x - ux * (r + 3)) + '" y2="' + (b.y - uy * (r + 3)) + '" marker-end="url(#flArr)"/>' +
          '<text class="fl-w" x="' + ((a.x + b.x) / 2 - uy * 9) + '" y="' + ((a.y + b.y) / 2 + ux * 9) + '">' + e[2] + "</text>";
      });
      G.V.forEach(function (v) { s += '<g class="g-node ' + (hi[v] || "") + '"><circle cx="' + P[v].x + '" cy="' + P[v].y + '" r="13"/><text x="' + P[v].x + '" y="' + P[v].y + '">' + v + "</text></g>"; });
      return s + "</svg>";
    }
    function run() {
      var gi = +host.querySelector("#fl-g").value;
      G = FGRAPHS[gi].random ? randomFloydGraph() : FGRAPHS[gi];
      var V = G.V, n = V.length, at = {}, d = [], C = FCODE.L, frames = [], ups = 0;
      V.forEach(function (v, i) { at[v] = i; });
      for (var i = 0; i < n; i++) { d.push([]); for (var j = 0; j < n; j++) d[i].push(i === j ? 0 : INF); }
      G.E.forEach(function (e) { d[at[e[0]]][at[e[1]]] = e[2]; });
      player.setCode("Floyd's algorithm", FCODE.code);
      function snap() { return d.map(function (r) { return r.slice(); }); }
      frames.push({ text: "Start with the weighted adjacency matrix: the edge weights, 0 on the diagonal and ∞ where there is no edge. Each pass k allows paths to stop at one more vertex.", line: C.k, d: snap(), ups: 0 });
      for (var k = 0; k < n; k++) {
        var changed = {}, passUps = 0;
        frames.push({ text: "Pass " + (k + 1) + ": now paths may also stop at <b>" + V[k] + "</b>. For every pair (i, j), check dist[i][" + V[k] + "] + dist[" + V[k] + "][j] &lt; dist[i][j]. Row and column " + V[k] + " do not change in this pass.", line: C.k, d: snap(), k: k, ups: ups });
        for (i = 0; i < n; i++) for (j = 0; j < n; j++) {
          if (i === k || j === k || i === j) continue;
          var via = d[i][k] + d[k][j];
          if (via < d[i][j]) {
            var old = d[i][j], ask = null;
            if (ups % 2 === 0) {
              var wrong = [old === INF ? d[i][k] : old, d[i][k], d[k][j], via + d[k][j]].filter(function (x) { return x !== via && x !== INF; });
              ask = CL.mkAsk("Pass " + V[k] + ": dist[" + V[i] + "][" + V[k] + "] = " + fmt(d[i][k]) + " and dist[" + V[k] + "][" + V[j] + "] = " + fmt(d[k][j]) + ". What does dist[" + V[i] + "][" + V[j] + "] (now " + fmt(old) + ") become?", via, wrong.concat([old === INF ? "∞ (no change)" : old + " (no change)"]), { view: { cell: [i, j], d: snap(), changed: Object.assign({}, changed) } }, "sort");
            }
            d[i][j] = via;
            changed[i + "," + j] = 1;
            ups++; passUps++;
            frames.push({ text: V[i] + " → " + V[k] + " → " + V[j] + ": " + fmt(d[i][k]) + " + " + fmt(d[k][j]) + " = <b>" + via + "</b>, cheaper than " + fmt(old) + ", so dist[" + V[i] + "][" + V[j] + "] = " + via + ".", line: C.set, d: snap(), k: k, cell: [i, j], changed: Object.assign({}, changed), ups: ups, ask: ask });
          }
        }
        frames.push({ text: "End of pass " + (k + 1) + " (stops at " + V[k] + " allowed): " + (passUps ? passUps + " entr" + (passUps === 1 ? "y" : "ies") + " improved." : "nothing improved."), line: C.k, d: snap(), k: k, changed: changed, ups: ups });
      }
      frames.push({ text: "Done: every vertex is now allowed as a stop, so every entry is a shortest distance. Row " + V[0] + " is what Dijkstra from " + V[0] + " would give; Floyd gives every row at once.", line: C.k, d: snap(), ups: ups });
      player.load(frames);
    }
    host.querySelector("#fl-go").addEventListener("click", run);
    host.querySelector("#fl-g").addEventListener("change", run);
    run();
    return player;
  };

  // ================================================================ INTEGER SORT LAB
  var ICODE = {
    count: T("void countingSort (int A[], int B[], int n, int k) {\n\tint * C = new int[k + 1];\n\tfor (int v = 0; v <= k; v++)\n\t\tC[v] = 0;\n\tfor (int i = 0; i < n; i++)\n\t\tC[A[i]]++;                           //@count\n\tfor (int v = 1; v <= k; v++)\n\t\tC[v] = C[v] + C[v - 1];              //@sum\n\tfor (int i = n - 1; i >= 0; i--) {\n\t\tC[A[i]]--;                           //@place\n\t\tB[C[A[i]]] = A[i];\n\t}\n\tdelete [] C;\n}"),
    radix: T("void radixSort (int A[], int n) {\n\tint biggest = A[0];\n\tfor (int i = 1; i < n; i++)\n\t\tif (A[i] > biggest)\n\t\t\tbiggest = A[i];\n\tfor (int exp = 1; biggest / exp > 0; exp = exp * 10)   //@pass\n\t\tcountByDigit (A, n, exp);       // stable counting sort on one digit   //@digit\n}")
  };
  CL.Labs.isort = function (host) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Algorithm", '<select id="is-alg"><option value="count">Counting sort (keys 0..9)</option><option value="radix">Radix sort (LSD, base 10)</option></select>'));
    ctl.appendChild(CL.opGroup("Keys", '<input type="text" id="is-v" class="wide" aria-label="Keys"><button type="button" class="btn primary" id="is-go">Sort</button><button type="button" class="btn" id="is-rand">Random keys</button>'));
    host.appendChild(ctl);
    var alg = "count";
    var player = new CL.Player(host, {
      render: function (f) {
        var html = '<div class="is-rows"><div class="is-lab">A</div><div class="is-row">' + f.A.map(function (v, i) { return '<div class="' + (f.ai === i ? "hot" : f.adone && f.adone[i] ? "dim" : "") + '"><b>' + v + "</b><i>" + i + "</i></div>"; }).join("") + "</div>";
        if (f.C) html += '<div class="is-lab">C (counts' + (f.sum ? ", added up" : "") + ')</div><div class="is-row c">' + f.C.map(function (v, i) { return '<div class="' + (f.ci === i ? "hot" : "") + '"><b>' + v + "</b><i>" + i + "</i></div>"; }).join("") + "</div>";
        if (f.B) html += '<div class="is-lab">B (output)</div><div class="is-row">' + f.B.map(function (v, i) { return '<div class="' + (f.bi === i ? "hot" : v !== null ? "done" : "") + '"><b>' + (v === null ? "" : v) + "</b><i>" + i + "</i></div>"; }).join("") + "</div>";
        if (f.buckets) html += '<div class="is-lab">Buckets by the ' + f.dname + ' digit</div><div class="is-buckets">' + f.buckets.map(function (bk, d) { return '<div class="' + (f.bd === d ? "hot" : "") + '"><i>' + d + "</i>" + bk.map(function (v) { return "<b>" + v + "</b>"; }).join("") + "</div>"; }).join("") + "</div>";
        player.stage.innerHTML = html + "</div>";
        player.extra.innerHTML = '<div class="kv"><span>Algorithm</span><b>' + (alg === "count" ? "Counting sort" : "Radix sort") + "</b><span>Comparisons</span><b>0 (keys are used as indexes)</b><span>Cost</span><span>" + (alg === "count" ? "O(n + k)" : "O(d(n + 10))") + "</span></div>";
      }
    });
    player.lab = "isort";
    function run() {
      alg = host.querySelector("#is-alg").value;
      var A = CL.parseNums(host.querySelector("#is-v").value, 14).map(function (x) { return Math.abs(x); });
      if (!A.length) A = alg === "count" ? [2, 5, 3, 0, 2, 3, 0, 3] : [56, 34, 38, 71, 28, 10, 91, 18, 22, 75];
      if (alg === "count") A = A.map(function (x) { return x % 10; });
      host.querySelector("#is-v").value = A.join(" ");
      var frames = [], n = A.length;
      if (alg === "count") {
        var L = ICODE.count.L, k = 9, Cc = [], B = [], j;
        for (j = 0; j <= k; j++) Cc.push(0);
        for (j = 0; j < n; j++) B.push(null);
        player.setCode("Counting sort", ICODE.count.code);
        frames.push({ text: "Counting sort for keys 0 to " + k + ": first count how many times each key appears.", line: L.count, A: A.slice(), C: Cc.slice() });
        A.forEach(function (v, i) { Cc[v]++; frames.push({ text: "A[" + i + "] = " + v + ": C[" + v + "] becomes " + Cc[v] + ".", line: L.count, A: A.slice(), C: Cc.slice(), ai: i, ci: v }); });
        for (j = 1; j <= k; j++) {
          var before = Cc[j];
          var ask = j % 3 === 1 ? CL.mkAsk("Adding up: C[" + j + "] = C[" + j + "] + C[" + (j - 1) + "] = " + before + " + " + Cc[j - 1] + ". What is the new C[" + j + "]?", before + Cc[j - 1], [before, Cc[j - 1], before + Cc[j - 1] + 1], { view: { ci: j } }, "sort") : null;
          Cc[j] += Cc[j - 1];
          frames.push({ text: "Add up: C[" + j + "] = " + before + " + " + Cc[j - 1] + " = " + Cc[j] + " keys are ≤ " + j + ".", line: L.sum, A: A.slice(), C: Cc.slice(), ci: j, sum: true, ask: ask });
        }
        var done = {};
        for (var i = n - 1; i >= 0; i--) {
          var v = A[i], pos = Cc[v] - 1;
          var ask2 = (n - 1 - i) % 2 === 0 ? CL.mkAsk("Placing from the right: A[" + i + "] = " + v + " and C[" + v + "] = " + Cc[v] + ". At which index of B does it go?", pos, [Cc[v], pos - 1, v, i].filter(function (x) { return x >= 0 && x < n; }), { view: { ai: i, ci: v } }, "sort") : null;
          Cc[v]--;
          B[pos] = v;
          done[i] = 1;
          frames.push({ text: "A[" + i + "] = " + v + ": C[" + v + "] drops to " + Cc[v] + ", so B[" + pos + "] = " + v + ".", line: L.place, A: A.slice(), C: Cc.slice(), B: B.slice(), ai: i, ci: v, bi: pos, adone: Object.assign({}, done), sum: true, ask: ask2 });
        }
        frames.push({ text: "Sorted, with no comparisons: " + B.join(" ") + ". Equal keys kept their order (stable), because A was read from right to left.", line: L.place, A: A.slice(), B: B.slice() });
      } else {
        var R = ICODE.radix.L, biggest = Math.max.apply(null, A), names = ["ones", "tens", "hundreds", "thousands", "ten-thousands"];
        player.setCode("Radix sort (LSD)", ICODE.radix.code);
        frames.push({ text: "Radix sort: the biggest key is " + biggest + ", so there is one pass per digit, starting with the ones.", line: R.pass, A: A.slice() });
        for (var exp = 1, p = 0; Math.floor(biggest / exp) > 0; exp *= 10, p++) {
          var bk = [];
          for (var d = 0; d < 10; d++) bk.push([]);
          var start = A.slice();
          A.forEach(function (key, ix) {
            var dg = Math.floor(key / exp) % 10, other = Math.floor(key / (exp === 1 ? 10 : exp / 10)) % 10;
            var ask3 = ix % 3 === 0 ? CL.mkAsk("Which bucket does " + key + " go into (its " + names[p] + " digit)?", dg, [other, (dg + 1) % 10, (dg + 9) % 10, Math.floor(key / (exp * 10)) % 10], { view: { ai: ix, bd: -1, buckets: bk.map(function (b) { return b.slice(); }) } }, "sort") : null;
            bk[dg].push(key);
            frames.push({ text: key + " has " + names[p] + " digit " + dg + ": it joins the end of bucket " + dg + ".", line: R.digit, A: start, ai: ix, buckets: bk.map(function (b) { return b.slice(); }), bd: dg, dname: names[p], ask: ask3 });
          });
          A = [].concat.apply([], bk);
          var passAsk = null;
          frames.push({ text: "Collect the buckets in order 0 to 9: " + A.join(" ") + ". Within each bucket the order from before is kept (stable).", line: R.pass, A: A.slice(), buckets: bk.map(function (b) { return b.slice(); }), dname: names[p], ask: passAsk });
        }
        frames.push({ text: "Sorted after " + String(biggest).length + " pass" + (String(biggest).length > 1 ? "es" : "") + ": " + A.join(" ") + ".", line: R.pass, A: A.slice() });
      }
      player.load(frames);
    }
    host.querySelector("#is-go").addEventListener("click", run);
    host.querySelector("#is-alg").addEventListener("change", function () { host.querySelector("#is-v").value = ""; run(); });
    host.querySelector("#is-rand").addEventListener("click", function () {
      var a = host.querySelector("#is-alg").value, out = [];
      for (var i = 0; i < 9; i++) out.push(a === "count" ? rnd(0, 9) : rnd(1, 999));
      host.querySelector("#is-v").value = out.join(" ");
      run();
    });
    run();
    return player;
  };

  // ---------------------------------------------------------------- thumbnails on the Labs page
  var prevThumb = CL.labThumb;
  CL.labThumb = function (id) {
    if (id === "matrix") {
      var s = '<svg viewBox="0 0 260 120">';
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) s += '<rect x="' + (20 + j * 22) + '" y="' + (14 + i * 22) + '" width="20" height="20" rx="3" class="th-cell' + (j <= i ? (i === 3 && j === 1 ? " hot" : "") : " th-dim") + '"/>';
      for (var k = 0; k < 10; k++) s += '<rect x="' + (126 + (k % 5) * 25) + '" y="' + (36 + Math.floor(k / 5) * 26) + '" width="22" height="22" rx="3" class="th-cell' + (k === 7 ? " hot" : "") + '"/>';
      return s + '<path d="M86 69 C110 69 105 76 128 76" class="th-arr"/></svg>';
    }
    if (id === "floyd") {
      var t = '<svg viewBox="0 0 260 120">';
      for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) t += '<rect x="' + (70 + b * 30) + '" y="' + (8 + a * 26) + '" width="28" height="24" rx="3" class="th-cell' + (a === 1 && b === 3 ? " hot" : a === 2 || b === 2 ? " th-k" : "") + '"/>';
      return t + "</svg>";
    }
    if (id === "isort") {
      var u = '<svg viewBox="0 0 260 120">';
      for (var c = 0; c < 10; c++) u += '<rect x="' + (12 + c * 24) + '" y="' + (96 - [2, 0, 2, 3, 0, 1, 0, 1, 2, 1][c] * 22) + '" width="20" height="' + ([2, 0, 2, 3, 0, 1, 0, 1, 2, 1][c] * 22 || 2) + '" rx="3" class="th-cell' + (c === 3 ? " hot" : "") + '"/>';
      return u + "</svg>";
    }
    return prevThumb ? prevThumb(id) : "";
  };
})(CL);
