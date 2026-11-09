/* COMP 2611 Code Lab — Graph Lab: BFS, DFS, Dijkstra, Kruskal and Prim on the graphs from the slides. */
(function (CL) {
  "use strict";
  var esc = CL.esc, T = CL.tagCode;

  var GRAPHS = {
    g1: { name: "Lecture 16: BFS and DFS graph", directed: true, pos: { A: [0, 0], D: [1, 0], B: [2, 0], F: [0, 1], E: [1, 1], C: [2, 1], G: [1, 2] },
      adj: { A: ["D", "F", "G"], B: ["A"], C: ["B", "E"], D: ["B", "E"], E: ["B"], F: ["E", "G"], G: ["C"] } },
    g3: { name: "Lecture 17: BFS example 2", directed: true, pos: { A: [1.5, 0], B: [0.4, 1], C: [1.5, 1], D: [2.6, 1], E: [0, 2], F: [0.9, 2], G: [2.1, 2] },
      adj: { A: ["B", "C", "D"], B: ["E", "F"], C: ["G"], D: ["C", "G"], E: [], F: ["B"], G: ["F"] } },
    dj: { name: "Lecture 17: Dijkstra graph (weighted, directed)", directed: true, weighted: true, pos: { A: [2, 0], D: [1, 1], G: [4, 1], B: [0, 2], E: [2.6, 2], F: [1.2, 3], C: [3.2, 3] },
      edges: [["A", "D", 20], ["A", "G", 75], ["D", "B", 40], ["D", "E", 35], ["D", "F", 10], ["D", "G", 45], ["F", "B", 5], ["F", "C", 15], ["F", "E", 40], ["C", "E", 5], ["C", "G", 25], ["E", "G", 10]] },
    k1: { name: "Lecture 19: Kruskal example (weights 1 to 10)", directed: false, weighted: true, pos: { A: [1, 0], E: [3, 0], B: [0, 1.5], C: [1.8, 1.6], D: [3.2, 1.5] },
      edges: [["A", "B", 1], ["D", "E", 2], ["B", "C", 3], ["C", "D", 4], ["A", "E", 5], ["A", "C", 7], ["A", "D", 10]] },
    p1: { name: "Lecture 19: Prim example (minimum cost 53)", directed: false, weighted: true, pos: { A: [0, 1], B: [1, 0], D: [2.3, 0], C: [1.6, 1.2], E: [3.6, 1.2], F: [2.7, 2.2], G: [1, 2.4] },
      edges: [["B", "D", 5], ["A", "B", 6], ["C", "F", 9], ["E", "F", 10], ["B", "C", 11], ["F", "G", 12], ["A", "G", 15], ["C", "D", 17], ["D", "E", 22], ["C", "G", 25]] },
    rep: { name: "Lecture 16: adjacency list example", directed: true, pos: { A: [0, 0], D: [1.2, 0.4], G: [2.4, 0], B: [0.2, 1.6], E: [1.4, 1.6], C: [2.6, 1.4], F: [1.3, 2.6] },
      adj: { A: ["D", "G"], B: [], C: ["E", "G"], D: ["B", "E", "F", "G"], E: ["B", "G"], F: ["B", "C", "E"], G: [] } },
    und: { name: "Lecture 16: adjacency matrix example (undirected)", directed: false, pos: { A: [0, 0], B: [1, 0], C: [2, 0.4], D: [2.6, 1.4], E: [1.6, 1.6], F: [2.2, 2.5], G: [3.6, 1.6] },
      edges: [["A", "B"], ["B", "C"], ["C", "D"], ["C", "E"], ["D", "E"], ["D", "F"], ["D", "G"], ["E", "F"]] },
    file: { name: "Lecture 15: graph stored in a file", directed: true, pos: { D: [1, 0], A: [2, 0.6], B: [0, 1], F: [2, 1.8], C: [0, 2.2], E: [1, 2.6] },
      adj: { A: ["B", "F"], B: ["C", "E"], C: ["D"], D: ["A", "B"], E: ["D"], F: ["E"] } }
  };
  // normalise: every graph gets V (sorted ids), E (edge list u, v, w) and adjacency lists in order
  Object.keys(GRAPHS).forEach(function (k) {
    var g = GRAPHS[k];
    g.id = k;
    g.V = Object.keys(g.pos).sort();
    if (g.adj) { g.E = []; g.V.forEach(function (u) { (g.adj[u] || []).forEach(function (v) { g.E.push([u, v, 1]); }); }); }
    else {
      g.E = g.edges.map(function (e) { return [e[0], e[1], e[2] === undefined ? 1 : e[2]]; });
      g.adj = {};
      g.V.forEach(function (u) { g.adj[u] = []; });
      g.E.forEach(function (e) { g.adj[e[0]].push(e[1]); if (!g.directed) g.adj[e[1]].push(e[0]); });
      g.V.forEach(function (u) { g.adj[u].sort(); });
    }
  });
  CL.GRAPHS = GRAPHS;

  // ---- your own graph: "A B 4" per line (weight optional), "A->B" for one-way, a lone name for a vertex with no edges
  var EDGE_RE = /^([A-Za-z0-9_]{1,4})\s*(->|→|<->|--|-|\s)\s*([A-Za-z0-9_]{1,4})(?:\s*[:=,]?\s*(-?\d+(?:\.\d+)?))?$/;
  CL.parseGraphSpec = function (text, o) {
    o = o || {};
    var V = [], seenV = {}, E = [], errors = [], arrows = false, anyW = false;
    function addV(v) { if (!seenV[v]) { seenV[v] = 1; V.push(v); } }
    String(text || "").split(/\n|;/).forEach(function (line, li) {
      line = line.replace(/\/\/.*$|#.*$/, "").trim();
      if (!line) return;
      // "A: B C D" lists A's neighbours (an adjacency list)
      var al = /^([A-Za-z0-9_]{1,4})\s*:\s*(.*)$/.exec(line);
      if (al && !/^-?\d/.test(al[2].trim())) {
        addV(al[1]);
        al[2].split(/[\s,]+/).filter(Boolean).forEach(function (tok) {
          var m2 = /^([A-Za-z0-9_]{1,4})(?:\((-?\d+(?:\.\d+)?)\))?$/.exec(tok);
          if (!m2) { errors.push("Line " + (li + 1) + ": cannot read " + tok); return; }
          addV(m2[1]); if (m2[2] !== undefined) anyW = true;
          E.push([al[1], m2[1], m2[2] === undefined ? 1 : +m2[2], m2[2] !== undefined]);
        });
        arrows = true;
        return;
      }
      line.split(/\s*,\s*(?=[A-Za-z0-9_]{1,4}\s*(?:->|→|<->|--|-|\s)\s*[A-Za-z0-9_])/).forEach(function (item) {
        item = item.trim();
        if (/^[A-Za-z0-9_]{1,4}$/.test(item)) { addV(item); return; }
        var m = EDGE_RE.exec(item);
        if (!m) { errors.push("Line " + (li + 1) + ": cannot read \"" + item + "\" (write it like  A B 4  or  A->B 4)"); return; }
        if (m[2] === "->" || m[2] === "→") arrows = true;
        addV(m[1]); addV(m[3]);
        if (m[4] !== undefined) anyW = true;
        var w = m[4] === undefined ? 1 : +m[4];
        E.push([m[1], m[3], w, m[4] !== undefined]);
        if (m[2] === "<->") E.push([m[3], m[1], w, m[4] !== undefined]);
      });
    });
    if (V.length > 26) errors.push("Up to 26 vertices, please (this graph has " + V.length + ").");
    if (E.length > 90) errors.push("Up to 90 edges, please.");
    var directed = o.directed === undefined ? arrows : !!o.directed;
    // undirected: A B and B A are the same edge; keep the first
    if (!directed) {
      var key = {};
      E = E.filter(function (e) { var k = e[0] < e[1] ? e[0] + "|" + e[1] : e[1] + "|" + e[0]; if (key[k] || e[0] === e[1]) return false; key[k] = 1; return true; });
    } else {
      var k2 = {};
      E = E.filter(function (e) { var k = e[0] + "|" + e[1]; if (k2[k]) return false; k2[k] = 1; return true; });
    }
    var g = { id: "custom", name: o.name || "My own graph", directed: directed, weighted: o.weighted === undefined ? anyW : !!o.weighted, V: V.slice().sort(natural), E: E.map(function (e) { return [e[0], e[1], e[2]]; }), errors: errors };
    g.adj = {};
    g.V.forEach(function (u) { g.adj[u] = []; });
    g.E.forEach(function (e) { g.adj[e[0]].push(e[1]); if (!g.directed) g.adj[e[1]].push(e[0]); });
    if (o.alpha !== false) g.V.forEach(function (u) { g.adj[u].sort(natural); });
    g.pos = o.pos && g.V.every(function (v) { return o.pos[v]; }) ? o.pos : CL.graphLayout(g);
    return g;
  };
  function natural(a, b) { return a.length - b.length || (a < b ? -1 : a > b ? 1 : 0); }
  // vertices on a circle (in drawGraph's grid units), in name order
  CL.graphLayout = function (g) {
    var n = g.V.length, pos = {}, R = Math.max(120, Math.min(260, 40 * n));
    g.V.forEach(function (v, i) {
      var t = -Math.PI / 2 + 2 * Math.PI * i / Math.max(1, n);
      pos[v] = [(R + R * Math.cos(t)) / 112, (R + R * Math.sin(t)) / 88 * 0.86];
    });
    return pos;
  };
  CL.graphToSpec = function (g) {
    var lines = [], used = {};
    g.E.forEach(function (e) { used[e[0]] = used[e[1]] = 1; lines.push(e[0] + (g.directed ? "->" : " ") + e[1] + (g.weighted ? " " + e[2] : "")); });
    g.V.forEach(function (v) { if (!used[v]) lines.push(v); });
    return lines.join("\n");
  };
  CL.randomGraphSpec = function (n, directed, weighted) {
    var V = "ABCDEFGHIJ".slice(0, n).split(""), lines = [], have = {};
    function r(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
    function add(a, b) { var k = directed ? a + b : [a, b].sort().join(""); if (a === b || have[k]) return; have[k] = 1; lines.push(a + (directed ? "->" : " ") + b + (weighted ? " " + r(1, 20) : "")); }
    for (var i = 1; i < n; i++) add(V[r(0, i - 1)], V[i]);
    for (var k = 0; k < n; k++) add(V[r(0, n - 1)], V[r(0, n - 1)]);
    return lines.join("\n");
  };
  // drag the vertices of a graph drawn by drawGraph; onMove() redraws
  CL.dragGraph = function (stage, getG, onMove) {
    var drag = null;
    stage.addEventListener("pointerdown", function (e) {
      var node = e.target.closest(".g-node[data-v]");
      var svg = stage.querySelector("svg");
      if (!node || !svg) return;
      e.preventDefault();
      drag = { v: node.getAttribute("data-v"), svg: svg };
      stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var g = getG(), svg = stage.querySelector("svg");
      if (!g || !svg || !g.pos[drag.v]) return;
      var pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var m = svg.getScreenCTM();
      if (!m) return;
      var q = pt.matrixTransform(m.inverse());
      g.pos[drag.v] = [Math.max(0, (q.x - 36) / 112), Math.max(0, (q.y - 36) / 88)];
      onMove();
    });
    function end() { if (drag) { drag = null; if (getG()) CL.saveGraphPos && CL.saveGraphPos(getG()); } }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
  };

  function weight(g, u, v) {
    for (var i = 0; i < g.E.length; i++) {
      var e = g.E[i];
      if ((e[0] === u && e[1] === v) || (!g.directed && e[0] === v && e[1] === u)) return e[2];
    }
    return null;
  }

  // ---- drawing
  function drawGraph(g, f) {
    f = f || {};
    var SX = 112, SY = 88, PAD = 36, R = 18;
    var maxX = 0, maxY = 0;
    g.V.forEach(function (v) { maxX = Math.max(maxX, g.pos[v][0]); maxY = Math.max(maxY, g.pos[v][1]); });
    var w = PAD * 2 + maxX * SX, h = PAD * 2 + maxY * SY;
    function P(v) { return [PAD + g.pos[v][0] * SX, PAD + g.pos[v][1] * SY]; }
    var s = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + esc(g.name) + '"><defs><marker id="gA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="mv-ah"/></marker></defs>';
    var edgeCls = f.edgeCls || function () { return ""; };
    g.E.forEach(function (e) {
      var a = P(e[0]), b = P(e[1]);
      var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
      var ux = dx / L, uy = dy / L;
      // curve if the reverse edge exists or the line passes too close to another vertex
      var bend = 0;
      if (g.directed && g.E.some(function (x) { return x[0] === e[1] && x[1] === e[0]; })) bend = 22;
      g.V.forEach(function (v) {
        if (v === e[0] || v === e[1]) return;
        var p = P(v), t = ((p[0] - a[0]) * ux + (p[1] - a[1]) * uy);
        if (t > 0 && t < L) { var d = Math.abs((p[0] - a[0]) * uy - (p[1] - a[1]) * ux); if (d < R + 6) bend = Math.max(bend, 34); }
      });
      var sx = a[0] + ux * R, sy = a[1] + uy * R, tx = b[0] - ux * (R + 2), ty = b[1] - uy * (R + 2);
      var mx = (a[0] + b[0]) / 2 - uy * bend, my = (a[1] + b[1]) / 2 + ux * bend;
      var cls = "g-edge " + edgeCls(e);
      var d = bend ? "M" + sx + "," + sy + " Q" + mx + "," + my + " " + tx + "," + ty : "M" + sx + "," + sy + " L" + tx + "," + ty;
      s += '<path class="' + cls + '" d="' + d + '"' + (g.directed ? ' marker-end="url(#gA)"' : "") + "/>";
      if (g.weighted) {
        var lx = bend ? (sx + 2 * mx + tx) / 4 : (a[0] + b[0]) / 2, ly = bend ? (sy + 2 * my + ty) / 4 : (a[1] + b[1]) / 2;
        s += '<text class="g-w" x="' + (lx - uy * 9) + '" y="' + (ly + ux * 9) + '">' + e[2] + "</text>";
      }
    });
    g.V.forEach(function (v) {
      var p = P(v), c = f.nodeCls ? f.nodeCls(v) : "";
      s += '<g class="g-node ' + c + '" data-v="' + esc(v) + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '"/><text x="' + p[0] + '" y="' + p[1] + '">' + esc(v) + "</text></g>";
      var lb = f.label ? f.label(v) : "";
      if (lb) s += '<text class="g-tag" x="' + p[0] + '" y="' + (p[1] - R - 6) + '">' + esc(lb) + "</text>";
    });
    return s + "</svg>";
  }
  CL.drawGraph = drawGraph;

  function adjListHtml(g) {
    return '<div class="small" style="font-family:var(--f-code);line-height:1.7">' + g.V.map(function (u) {
      return "[" + u + "]" + g.adj[u].map(function (v) { return " → " + v + (g.weighted ? "(" + weight(g, u, v) + ")" : ""); }).join("");
    }).join("<br>") + "</div>";
  }
  function matrixHtml(g) {
    var s = '<table class="lab-tbl"><tr><th></th>' + g.V.map(function (v) { return "<th>" + v + "</th>"; }).join("") + "</tr>";
    g.V.forEach(function (u) {
      s += "<tr><th>" + u + "</th>" + g.V.map(function (v) {
        var w = weight(g, u, v);
        return "<td>" + (g.weighted ? (u === v ? 0 : w === null ? "∞" : w) : (w === null ? 0 : 1)) + "</td>";
      }).join("") + "</tr>";
    });
    return s + "</table>";
  }
  CL.graphAdjList = adjListHtml;
  CL.graphMatrix = matrixHtml;

  var CODE = {
    bfs: T(
      "void breadthFirstTraversal (Graph * g, int source) {\n" +
      "\tfor (int i = 0; i < g->numVertices; i++)\n" +
      "\t\tg->vertices[i].colour = WHITE;                //@init\n" +
      "\tg->vertices[source].colour = GREY;                //@grey\n" +
      "\tQueue * q = initQueue ();\n" +
      "\tenqueue (q, source);                              //@enq\n" +
      "\twhile (!isEmptyQueue (q)) {                       //@loop\n" +
      "\t\tint u = dequeue (q);                          //@deq\n" +
      "\t\tcout << g->vertices[u].ID << \" \";             //@visit\n" +
      "\t\tEdge * e = g->vertices[u].firstEdge;\n" +
      "\t\twhile (e != NULL) {\n" +
      "\t\t\tint loc = findVertex (g, e->destID);      //@find\n" +
      "\t\t\tif (g->vertices[loc].colour == WHITE) {   //@white\n" +
      "\t\t\t\tg->vertices[loc].colour = GREY;       //@mark\n" +
      "\t\t\t\tenqueue (q, loc);                     //@enq2\n" +
      "\t\t\t}\n" +
      "\t\t\te = e->nextEdge;\n" +
      "\t\t}\n" +
      "\t\tg->vertices[u].colour = BLACK;                //@black\n" +
      "\t}\n" +
      "}"),
    dfs: T(
      "void dfTraverse (Graph * g, int u) {\n" +
      "\tg->vertices[u].colour = GREY;                     //@grey\n" +
      "\tcout << g->vertices[u].ID << \" \";                 //@visit\n" +
      "\tEdge * e = g->vertices[u].firstEdge;\n" +
      "\twhile (e != NULL) {\n" +
      "\t\tint v = findVertex (g, e->destID);            //@find\n" +
      "\t\tif (g->vertices[v].colour == WHITE)           //@white\n" +
      "\t\t\tdfTraverse (g, v);                        //@rec\n" +
      "\t\te = e->nextEdge;\n" +
      "\t}\n" +
      "\tg->vertices[u].colour = BLACK;                    //@black\n" +
      "}\n\n" +
      "void depthFirstTraversal (Graph * g) {\n" +
      "\tfor (int i = 0; i < g->numVertices; i++)\n" +
      "\t\tg->vertices[i].colour = WHITE;                //@init\n" +
      "\tfor (int i = 0; i < g->numVertices; i++)          //@outer\n" +
      "\t\tif (g->vertices[i].colour == WHITE)\n" +
      "\t\t\tdfTraverse (g, i);                        //@start\n" +
      "}"),
    dijkstra: T(
      "dijkstra (G, source):\n" +
      "\tfor each vertex v:\n" +
      "\t\tv.cost = ∞;  v.parent = nil                   //@init\n" +
      "\tsource.cost = 0\n" +
      "\tQ = min-priority queue of all vertices, by cost  //@q\n" +
      "\twhile Q is not empty:                            //@loop\n" +
      "\t\tu = extractMin (Q)                            //@min\n" +
      "\t\tfor each edge (u, v) leaving u:               //@edge\n" +
      "\t\t\tif u.cost + weight(u, v) < v.cost:        //@test\n" +
      "\t\t\t\tv.cost = u.cost + weight(u, v)        //@relax\n" +
      "\t\t\t\tv.parent = u"),
    kruskal: T(
      "kruskal (G):\n" +
      "\tfor each vertex v:\n" +
      "\t\tmake a tree containing only v                 //@init\n" +
      "\tsort the edges by weight, smallest first          //@sort\n" +
      "\tfor each edge (u, v) in that order:               //@loop\n" +
      "\t\tif u and v are in different trees:            //@test\n" +
      "\t\t\tadd (u, v) to the spanning tree           //@add\n" +
      "\t\t\tjoin the two trees into one\n" +
      "\t\telse\n" +
      "\t\t\tskip (u, v): it would make a cycle        //@skip"),
    prim: T(
      "prim (G, start):\n" +
      "\tused = { start };  unused = all other vertices   //@init\n" +
      "\twhile unused is not empty:                       //@loop\n" +
      "\t\tfind the cheapest edge (u, v) with u in used\n" +
      "\t\t\tand v in unused                         //@pick\n" +
      "\t\tadd (u, v) to the spanning tree               //@add\n" +
      "\t\tmove v from unused to used                    //@move")
  };

  CL.Labs.graph = function (host, preset) {
    if (preset && preset.graph) {
      var pg = JSON.parse(JSON.stringify(preset.graph));
      pg.id = "trainer";
      pg.name = "From the Trace Trainer";
      GRAPHS.trainer = pg;
    }
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Algorithm", '<select id="gr-alg"><option value="bfs">Breadth-first search</option><option value="dfs">Depth-first search</option><option value="dijkstra">Dijkstra shortest paths</option><option value="kruskal">Kruskal (min spanning tree)</option><option value="prim">Prim (min spanning tree)</option></select>'));
    ctl.appendChild(CL.opGroup("Graph", '<select id="gr-g"></select><button type="button" class="btn small ghost" id="gr-edit" title="Copy this graph into the editor and change it">✎ Edit this graph</button>'));
    ctl.appendChild(CL.opGroup("Start vertex", '<select id="gr-s"></select>'));
    ctl.appendChild(CL.opGroup("", '<button type="button" class="btn primary" id="gr-go">Run</button><label class="small"><input type="checkbox" id="gr-rep"> Show adjacency list and matrix</label>'));
    host.appendChild(ctl);
    // your own graph
    var LSK = "comp2611-graph-custom", saved = {};
    try { saved = JSON.parse(localStorage.getItem(LSK) || "{}") || {}; } catch (e) { saved = {}; }
    var cus = document.createElement("div");
    cus.className = "lab-custom gr-custom";
    cus.hidden = true;
    cus.innerHTML = '<div class="lc-h"><b>My own graph</b><span class="small muted">One edge per line: <code>A B 4</code> (the weight is optional), <code>A-&gt;B 4</code> for a one-way edge, <code>A: B C D</code> for A\'s adjacency list, or a single name for a vertex with no edges. Drag the vertices to move them.</span></div>' +
      '<div class="lc-row"><textarea id="gr-spec" rows="6" spellcheck="false" aria-label="Edges of your graph"></textarea>' +
      '<div class="lc-opts"><label class="small"><input type="checkbox" id="gr-dir"> Directed (one-way edges)</label><label class="small"><input type="checkbox" id="gr-wt"> Weighted</label><label class="small"><input type="checkbox" id="gr-abc" checked> Visit neighbours in alphabetical order</label>' +
      '<div class="btns"><button type="button" class="btn small primary" id="gr-draw">Draw and run</button><button type="button" class="btn small" id="gr-rand">Random graph</button><button type="button" class="btn small ghost" id="gr-lay">Tidy layout</button></div></div></div><div class="lc-msg small" aria-live="polite"></div>';
    host.appendChild(cus);
    var specEl = cus.querySelector("#gr-spec"), dirEl = cus.querySelector("#gr-dir"), wtEl = cus.querySelector("#gr-wt"), abcEl = cus.querySelector("#gr-abc"), msgEl = cus.querySelector(".lc-msg");
    specEl.value = saved.spec || "A B 4\nA C 2\nB C 5\nB D 10\nC E 3\nE D 4\nD F 11";
    dirEl.checked = !!saved.directed;
    wtEl.checked = saved.weighted !== undefined ? !!saved.weighted : true;
    abcEl.checked = saved.alpha !== false;
    function buildCustom(keepPos) {
      var old = GRAPHS.custom;
      var cg = CL.parseGraphSpec(specEl.value, { directed: dirEl.checked, weighted: wtEl.checked, alpha: abcEl.checked, pos: keepPos && old ? old.pos : saved.pos });
      if (!cg.V.length) { msgEl.innerHTML = '<span class="bad">Type at least one edge, like  A B 4.</span>'; return false; }
      msgEl.innerHTML = (cg.errors.length ? '<span class="bad">' + cg.errors.slice(0, 3).map(esc).join("<br>") + "</span><br>" : "") + cg.V.length + " vertices, " + cg.E.length + " edges" + (cg.directed ? " (directed)" : "") + ".";
      GRAPHS.custom = cg;
      saved = { spec: specEl.value, directed: dirEl.checked, weighted: wtEl.checked, alpha: abcEl.checked, pos: cg.pos };
      try { localStorage.setItem(LSK, JSON.stringify(saved)); } catch (e) { /* ignore */ }
      return true;
    }
    CL.saveGraphPos = function (gg) { if (gg.id === "custom") { saved.pos = gg.pos; try { localStorage.setItem(LSK, JSON.stringify(saved)); } catch (e) { /* ignore */ } } };
    buildCustom(false);
    var g;
    var player = new CL.Player(host, {
      render: function (f) {
        player.stage.innerHTML = drawGraph(g, {
          nodeCls: function (v) { return f.hot === v ? "hot" : f.colour ? (f.colour[v] === "BLACK" ? "black" : f.colour[v] === "GREY" ? "grey" : "") : f.used && f.used.indexOf(v) >= 0 ? "on" : f.done && f.done.indexOf(v) >= 0 ? "done" : ""; },
          edgeCls: function (e) {
            var k1 = e[0] + e[1], k2 = e[1] + e[0];
            if (f.hotEdge && (f.hotEdge === k1 || (!g.directed && f.hotEdge === k2))) return "hot";
            if (f.tree && (f.tree.indexOf(k1) >= 0 || (!g.directed && f.tree.indexOf(k2) >= 0))) return "on";
            if (f.skipped && (f.skipped.indexOf(k1) >= 0 || f.skipped.indexOf(k2) >= 0)) return "dim";
            return "";
          },
          label: function (v) { return f.cost ? (f.cost[v] === Infinity ? "∞" : String(f.cost[v])) : ""; }
        });
        var html = f.panel || "";
        if (host.querySelector("#gr-rep").checked) html += '<div class="player-code-h" style="margin-top:10px">Adjacency list</div>' + adjListHtml(g) + '<div class="player-code-h" style="margin-top:10px">Adjacency matrix</div><div style="overflow-x:auto">' + matrixHtml(g) + "</div>";
        player.extra.innerHTML = html;
      }
    });
    player.lab = "graph";
    var algSel = host.querySelector("#gr-alg"), gSel = host.querySelector("#gr-g"), sSel = host.querySelector("#gr-s");
    // ---- Your turn: the order a traversal visits the vertices
    function bfsOrder(src) {
      var seen = {}, out = [], Q = [src];
      seen[src] = 1;
      while (Q.length) { var u = Q.shift(); out.push(u); g.adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; Q.push(v); } }); }
      return out;
    }
    function dfsOrder(starts) {
      var seen = {}, out = [];
      function vis(u) { seen[u] = 1; out.push(u); g.adj[u].forEach(function (v) { if (!seen[v]) vis(v); }); }
      starts.forEach(function (v) { if (!seen[v]) vis(v); });
      return out;
    }
    // just after each vertex is printed, ask which vertex is printed next
    function addVisitAsks(frames, name, other) {
      var visits = [];
      frames.forEach(function (f, i) { if (f.visit) visits.push(i); });
      var seq = visits.map(function (i) { return frames[i].hot; });
      visits.forEach(function (vi, j) {
        if (j === 0) return;
        var at = visits[j - 1] + 1, prev = frames[visits[j - 1]];
        if (at > vi) return;
        var printed = seq.slice(0, j), right = seq[j], wrong = [];
        if (other[j] && other[j] !== right && printed.indexOf(other[j]) < 0) wrong.push(other[j]);
        g.adj[prev.hot].forEach(function (v) { if (printed.indexOf(v) < 0) wrong.push(v); });
        wrong = wrong.concat(CL.shuffle(g.V.filter(function (v) { return printed.indexOf(v) < 0; })));
        var ask = CL.mkAsk("Printed so far: <b>" + printed.join(" ") + "</b>. Which vertex does " + name + " print <b>next</b>?", right, wrong.filter(function (v) { return v !== right; }), { view: { colour: prev.colour, panel: prev.panel, hot: prev.hot, hotEdge: null } }, "sort");
        if (ask.options.length > 1) frames[at].ask = ask;
      });
      return frames;
    }
    function graphsFor(alg) {
      var t = GRAPHS.trainer, extra = [];
      if (t && (alg === "dijkstra" ? t.weighted && t.directed : alg === "kruskal" || alg === "prim" ? t.weighted && !t.directed : true)) extra = ["trainer"];
      if (alg === "dijkstra") return extra.concat(["dj"]);
      if (alg === "kruskal" || alg === "prim") return extra.concat(["p1", "k1"]);
      return extra.concat(["g1", "g3", "rep", "file", "und", "dj"]);
    }
    function fillGraphs() {
      var alg = algSel.value, ids = graphsFor(alg).concat(["custom"]), cur = gSel.value;
      gSel.innerHTML = ids.map(function (id) { return '<option value="' + id + '">' + (id === "custom" ? "✎ My own graph" : esc(GRAPHS[id].name)) + "</option>"; }).join("");
      if (ids.indexOf(cur) >= 0) gSel.value = cur;
      fillStarts();
    }
    function fillStarts() {
      var gg = GRAPHS[gSel.value], cur = sSel.value;
      cus.hidden = gSel.value !== "custom";
      host.querySelector("#gr-edit").hidden = gSel.value === "custom";
      sSel.innerHTML = gg.V.map(function (v) { return '<option value="' + v + '">' + v + "</option>"; }).join("");
      sSel.value = gg.V.indexOf(cur) >= 0 ? cur : gg.V[0];
      sSel.parentNode.parentNode.hidden = algSel.value === "kruskal";
    }
    // what the chosen algorithm needs from your graph: Dijkstra needs weights of 0 or more; Kruskal and Prim use undirected edges
    function fitFor(alg, gg) {
      if (gg.id !== "custom") return { g: gg };
      if (alg === "dijkstra" && gg.E.some(function (e) { return e[2] < 0; })) return { err: "Dijkstra's algorithm needs every weight to be 0 or more: with a negative edge, a vertex it has finished could later get cheaper. Change the negative weights." };
      if ((alg === "kruskal" || alg === "prim") && gg.directed) {
        var und = CL.parseGraphSpec(CL.graphToSpec(Object.assign({}, gg, { directed: false })).replace(/->/g, " "), { directed: false, weighted: gg.weighted, alpha: abcEl.checked, pos: gg.pos });
        return { g: und, note: "Spanning trees are for undirected graphs, so your edges are used without their directions." };
      }
      if ((alg === "kruskal" || alg === "prim" || alg === "dijkstra") && !gg.weighted) return { g: gg, note: "Your graph has no weights, so every edge costs 1." };
      return { g: gg };
    }
    function colourPanel(colour, extra) {
      return '<div class="kv">' + extra + "<span>Colours</span><span class='small'>" + g.V.map(function (v) { return v + ": " + colour[v].toLowerCase(); }).join(", ") + "</span></div>";
    }
    function q(arr) { return '<div class="qbox">' + (arr.length ? arr.map(function (x, i) { return '<span class="qi' + (i === 0 ? " hot" : "") + '">' + esc(x) + "</span>"; }).join("") : "<span class='muted small'>empty</span>") + "</div>"; }
    function runBFS(src) {
      var C = CODE.bfs.L, frames = [], colour = {}, out = [], Q = [];
      g.V.forEach(function (v) { colour[v] = "WHITE"; });
      function F(text, line, extra) { frames.push(Object.assign({ text: text, line: line, colour: Object.assign({}, colour), panel: colourPanel(colour, "<span>Queue</span>" + q(Q) + "<span>Output</span><b>" + (out.join(" ") || "(nothing yet)") + "</b>") }, extra || {})); }
      F("Every vertex starts WHITE (not discovered yet).", C.init);
      colour[src] = "GREY"; Q.push(src);
      F("Colour the source " + src + " GREY (discovered) and put it in the queue.", C.enq, { hot: src });
      while (Q.length) {
        var u = Q.shift();
        F("Take " + u + " from the front of the queue.", C.deq, { hot: u });
        out.push(u);
        F("Visit " + u + ": print it.", C.visit, { hot: u, visit: true });
        g.adj[u].forEach(function (v) {
          if (colour[v] === "WHITE") {
            colour[v] = "GREY"; Q.push(v);
            F("Edge " + u + " → " + v + ": " + v + " is WHITE, so colour it GREY and add it to the back of the queue.", C.enq2, { hot: v, hotEdge: u + v });
          } else F("Edge " + u + " → " + v + ": " + v + " is already " + colour[v] + ", so ignore it.", C.white, { hot: u, hotEdge: u + v });
        });
        colour[u] = "BLACK";
        F("All edges leaving " + u + " are done: colour it BLACK.", C.black, { hot: u });
      }
      F("The queue is empty. Breadth-first traversal: <b>" + out.join(" ") + "</b>" + (out.length < g.V.length ? " (some vertices cannot be reached from " + src + ")" : ""), C.loop);
      return addVisitAsks(frames, "BFS", dfsOrder([src]));
    }
    function runDFS(start) {
      var C = CODE.dfs.L, frames = [], colour = {}, out = [], stack = [];
      g.V.forEach(function (v) { colour[v] = "WHITE"; });
      function F(text, line, extra) { frames.push(Object.assign({ text: text, line: line, colour: Object.assign({}, colour), panel: colourPanel(colour, "<span>Call stack</span>" + q(stack.slice().reverse()) + "<span>Output</span><b>" + (out.join(" ") || "(nothing yet)") + "</b>") }, extra || {})); }
      F("Every vertex starts WHITE.", C.init);
      function visit(u) {
        stack.push(u);
        colour[u] = "GREY";
        F("dfTraverse(" + u + "): colour " + u + " GREY.", C.grey, { hot: u });
        out.push(u);
        F("Visit " + u + ": print it.", C.visit, { hot: u, visit: true });
        g.adj[u].forEach(function (v) {
          if (colour[v] === "WHITE") {
            F("Edge " + u + " → " + v + ": " + v + " is WHITE, so go deeper: call dfTraverse(" + v + ").", C.rec, { hot: v, hotEdge: u + v });
            visit(v);
            F("Back in dfTraverse(" + u + ").", C.find, { hot: u });
          } else F("Edge " + u + " → " + v + ": " + v + " is " + colour[v] + ", so skip it.", C.white, { hot: u, hotEdge: u + v });
        });
        colour[u] = "BLACK";
        F("Finished every edge of " + u + ": colour it BLACK and return.", C.black, { hot: u });
        stack.pop();
      }
      var outer = start ? [start].concat(g.V.filter(function (v) { return v !== start; })) : g.V;
      outer.forEach(function (v, k) {
        if (colour[v] === "WHITE") {
          F(k === 0 && start && start !== g.V[0] ? "Start with dfTraverse(" + v + ")." : "The outer loop finds " + v + " still WHITE, so start dfTraverse(" + v + ").", C.start, { hot: v });
          visit(v);
        }
      });
      F("Depth-first traversal: <b>" + out.join(" ") + "</b>", C.outer);
      return addVisitAsks(frames, "DFS", bfsOrder(start || g.V[0]));
    }
    function table(cost, parent, hotV) {
      return '<div style="overflow-x:auto"><table class="lab-tbl"><tr><th>vertex</th>' + g.V.map(function (v) { return "<th>" + v + "</th>"; }).join("") + "</tr><tr><th>parent</th>" +
        g.V.map(function (v) { return '<td class="' + (v === hotV ? "hot" : "") + '">' + (parent[v] || "nil") + "</td>"; }).join("") + "</tr><tr><th>cost</th>" +
        g.V.map(function (v) { return '<td class="' + (v === hotV ? "hot" : "") + '">' + (cost[v] === Infinity ? "∞" : cost[v]) + "</td>"; }).join("") + "</tr></table></div>";
    }
    function runDijkstra(src) {
      var C = CODE.dijkstra.L, frames = [], cost = {}, parent = {}, Q = g.V.slice(), done = [];
      g.V.forEach(function (v) { cost[v] = Infinity; parent[v] = null; });
      cost[src] = 0;
      function order() { return Q.slice().sort(function (a, b) { return cost[a] - cost[b] || (a < b ? -1 : 1); }); }
      function F(text, line, extra, hotV) { frames.push(Object.assign({ text: text, line: line, cost: Object.assign({}, cost), done: done.slice(), bare: table(cost, parent, hotV), panel: table(cost, parent, hotV) + '<div class="kv" style="margin-top:8px"><span>Min-priority queue</span>' + q(order().map(function (v) { return v + " (" + (cost[v] === Infinity ? "∞" : cost[v]) + ")"; })) + "</div>" }, extra || {})); }
      function inf(c) { return c === Infinity ? "∞" : String(c); }
      var taken = 0;
      F("Every cost starts at ∞ and every parent at nil, except the source " + src + ", whose cost is 0. All vertices go in the min-priority queue.", C.init, { hot: src }, src);
      while (Q.length) {
        var u = order()[0];
        Q.splice(Q.indexOf(u), 1);
        if (cost[u] === Infinity) { F(u + " has cost ∞: it cannot be reached from " + src + ".", C.min, { hot: u }); done.push(u); continue; }
        var pf = frames[frames.length - 1], rest = order().filter(function (v) { return cost[v] !== Infinity; });
        var mAsk = taken > 0 && Q.length ? CL.mkAsk("Which vertex does extractMin take off the queue next?", u, rest.slice(0, 3).concat(pf.hot && pf.hot !== u ? [pf.hot] : []).concat(CL.shuffle(Q.slice())), { view: { panel: '<div class="small muted" style="margin-bottom:6px">The queue is hidden: work it out from the costs.</div>' + pf.bare, hot: null, hotEdge: null, cost: pf.cost, done: done.slice() } }, "sort") : null;
        taken++;
        F("Take " + u + " off the queue: it has the lowest cost (" + cost[u] + "). Its cost is now final.", C.min, { hot: u, ask: mAsk }, u);
        // edges leaving u: in an undirected graph an edge stored as (v, u) leaves u too
        var edges = g.E.filter(function (e) { return e[0] === u || (!g.directed && e[1] === u); }).map(function (e) { return e[0] === u ? e : [u, e[0], e[2]]; }).sort(function (a, b) { return a[1] < b[1] ? -1 : 1; });
        if (!edges.length) F("There are no edges leaving " + u + ".", C.edge, { hot: u });
        edges.forEach(function (e) {
          var v = e[1], nc = cost[u] + e[2], pf2 = frames[frames.length - 1];
          var rAsk = done.indexOf(v) < 0 ? CL.mkAsk("Edge (" + u + ", " + v + ") has weight " + e[2] + ", and " + u + "'s cost is " + cost[u] + ". What is " + v + "'s cost after this edge is checked?", inf(Math.min(nc, cost[v])), [inf(nc), inf(cost[v]), String(e[2]), String(cost[u])], { view: { cost: pf2.cost, panel: pf2.panel, hot: v, hotEdge: u + v } }, "sort") : null;
          if (rAsk && rAsk.options.length < 2) rAsk = null;
          if (nc < cost[v]) {
            var old = cost[v];
            cost[v] = nc; parent[v] = u;
            F("Edge (" + u + ", " + v + "): " + cost[u] + " + " + e[2] + " = " + nc + ", lower than " + (old === Infinity ? "∞" : old) + ". Update " + v + ": cost " + nc + ", parent " + u + ".", C.relax, { hot: v, hotEdge: u + v, ask: rAsk }, v);
          } else F("Edge (" + u + ", " + v + "): " + cost[u] + " + " + e[2] + " = " + nc + ", not lower than " + cost[v] + ". Leave " + v + " as it is.", C.test, { hot: v, hotEdge: u + v, ask: rAsk }, v);
        });
        done.push(u);
      }
      var paths = g.V.filter(function (v) { return v !== src && cost[v] !== Infinity; }).map(function (v) {
        var p = [], x = v;
        while (x) { p.unshift(x); x = parent[x]; }
        return "Cost to " + v + ": " + cost[v] + ", path " + p.join(" → ");
      });
      var tree = g.V.filter(function (v) { return parent[v]; }).map(function (v) { return parent[v] + v; });
      F("The queue is empty, so the algorithm stops. Follow the parents back from each vertex to get its path.<br>" + paths.join("<br>"), C.loop, { tree: tree });
      return frames;
    }
    function edgeListHtml(list, state) {
      return '<table class="lab-tbl"><tr><th>edge</th><th>weight</th><th></th></tr>' + list.map(function (e, i) {
        var st = state[i] || "";
        return '<tr><td class="' + (st === "hot" ? "hot" : st === "add" ? "done" : "") + '">(' + e[0] + ", " + e[1] + ')</td><td>' + e[2] + "</td><td class='small'>" + (st === "add" ? "added" : st === "skip" ? "skipped: cycle" : st === "hot" ? "checking" : "") + "</td></tr>";
      }).join("") + "</table>";
    }
    function runKruskal() {
      var C = CODE.kruskal.L, frames = [];
      var list = g.E.slice().sort(function (a, b) { return a[2] - b[2]; });
      var tree = [], skipped = [], state = {}, total = 0;
      var comp = {};
      g.V.forEach(function (v) { comp[v] = v; });
      function find(v) { while (comp[v] !== v) v = comp[v]; return v; }
      function sets() { var m = {}; g.V.forEach(function (v) { var r = find(v); (m[r] = m[r] || []).push(v); }); return Object.keys(m).map(function (k) { return "{" + m[k].join(", ") + "}"; }).join(" "); }
      function F(text, line, extra) { frames.push(Object.assign({ text: text, line: line, tree: tree.slice(), skipped: skipped.slice(), panel: '<div class="kv"><span>Trees</span><b>' + sets() + "</b><span>Total cost</span><b>" + total + "</b></div>" + edgeListHtml(list, Object.assign({}, state)) }, extra || {})); }
      F("Each vertex starts as its own tree.", C.init);
      F("Sort the edges by weight, smallest first (the table on the right).", C.sort);
      list.forEach(function (e, i) {
        state[i] = "hot";
        F("", 0);
        var pre = frames.pop();
        var kAsk = CL.askFixed("Next edge in the sorted list: (" + e[0] + ", " + e[1] + ", " + e[2] + "). Add it or skip it?", ["Add it to the tree", "Skip it: it would make a cycle"], find(e[0]) !== find(e[1]) ? 0 : 1, { view: { tree: pre.tree, skipped: pre.skipped, panel: pre.panel, hotEdge: e[0] + e[1] }, line: C.test });
        if (find(e[0]) !== find(e[1])) {
          comp[find(e[0])] = find(e[1]);
          tree.push(e[0] + e[1]); total += e[2]; state[i] = "add";
          F("(" + e[0] + ", " + e[1] + ", " + e[2] + "): " + e[0] + " and " + e[1] + " are in different trees, so add the edge and join the trees.", C.add, { hotEdge: e[0] + e[1], ask: kAsk });
        } else {
          skipped.push(e[0] + e[1]); state[i] = "skip";
          F("(" + e[0] + ", " + e[1] + ", " + e[2] + "): " + e[0] + " and " + e[1] + " are already in the same tree, so this edge would make a cycle. Skip it.", C.skip, { hotEdge: e[0] + e[1], ask: kAsk });
        }
      });
      F("Done. The spanning tree has " + tree.length + " edges (n − 1 = " + (g.V.length - 1) + ") and its minimum cost is <b>" + total + "</b>.", C.loop);
      return frames;
    }
    function runPrim(start) {
      var C = CODE.prim.L, frames = [], used = [start], unused = g.V.filter(function (v) { return v !== start; }), tree = [], chosen = [], total = 0;
      function F(text, line, extra) { frames.push(Object.assign({ text: text, line: line, used: used.slice(), tree: tree.slice(), panel: '<div class="kv"><span>Used</span><b>{' + used.join(", ") + "}</b><span>Unused</span><b>{" + unused.join(", ") + "}</b><span>Edges chosen</span><b>" + (chosen.join(" ") || "none yet") + "</b><span>Total cost</span><b>" + total + "</b></div>" }, extra || {})); }
      F("Start with " + start + " in the used set. Every other vertex is unused.", C.init, { hot: start });
      while (unused.length) {
        var best = null;
        g.E.forEach(function (e) {
          var a = e[0], b = e[1];
          var ok = (used.indexOf(a) >= 0 && unused.indexOf(b) >= 0) || (used.indexOf(b) >= 0 && unused.indexOf(a) >= 0);
          if (ok && (!best || e[2] < best[2])) best = e;
        });
        if (!best) { F("No edge reaches the unused vertices: the graph is not connected.", C.pick); break; }
        var nv = used.indexOf(best[0]) >= 0 ? best[1] : best[0], from = nv === best[1] ? best[0] : best[1];
        var crossing = g.E.filter(function (e) { return (used.indexOf(e[0]) >= 0) !== (used.indexOf(e[1]) >= 0); });
        var cands = crossing.map(function (e) { return "(" + e[0] + " " + e[1] + " " + e[2] + ")"; });
        var lab = function (e) { var a = used.indexOf(e[0]) >= 0 ? e[0] : e[1], b = a === e[0] ? e[1] : e[0]; return "(" + a + " " + b + " " + e[2] + ")"; };
        var outside = g.E.filter(function (e) { return used.indexOf(e[0]) < 0 && used.indexOf(e[1]) < 0; }).sort(function (a, b) { return a[2] - b[2]; });
        var inside = g.E.filter(function (e) { return used.indexOf(e[0]) >= 0 && used.indexOf(e[1]) >= 0 && tree.indexOf(e[0] + e[1]) < 0; });
        var others = crossing.filter(function (e) { return e !== best; }).sort(function (a, b) { return a[2] - b[2]; });
        var pAsk = CL.mkAsk("Used: {" + used.join(", ") + "}. Which edge does Prim add next?", lab(best), [outside[0] ? "(" + outside[0][0] + " " + outside[0][1] + " " + outside[0][2] + ")" : null, others[0] ? lab(others[0]) : null, inside[0] ? "(" + inside[0][0] + " " + inside[0][1] + " " + inside[0][2] + ")" : null, others[1] ? lab(others[1]) : null], { view: { hotEdge: null } }, "sort");
        F("Edges from used to unused vertices: " + cands.join(", ") + ". The cheapest is (" + from + " " + nv + " " + best[2] + ").", C.pick, { hotEdge: best[0] + best[1], ask: pAsk.options.length > 1 ? pAsk : null });
        tree.push(best[0] + best[1]); chosen.push("(" + from + " " + nv + " " + best[2] + ")"); total += best[2];
        used.push(nv); unused.splice(unused.indexOf(nv), 1);
        F("Add it to the spanning tree and move " + nv + " to the used set.", C.move, { hot: nv });
      }
      F("Every vertex is used. Minimum cost = <b>" + total + "</b>.", C.loop);
      return frames;
    }
    function go() {
      var alg = algSel.value, s = sSel.value;
      if (gSel.value === "custom" && !buildCustom(true)) return;
      var fit = fitFor(alg, GRAPHS[gSel.value]);
      if (fit.err) { msgEl.innerHTML = '<span class="bad">' + esc(fit.err) + "</span>"; return; }
      if (fit.note) msgEl.innerHTML += " " + esc(fit.note);
      g = fit.g;
      if (g.V.indexOf(s) < 0) s = g.V[0];
      var code = CODE[alg];
      player.setCode({ bfs: "Breadth-first search", dfs: "Depth-first search", dijkstra: "Dijkstra's algorithm", kruskal: "Kruskal's algorithm", prim: "Prim's algorithm" }[alg], code.code);
      var frames = alg === "bfs" ? runBFS(s) : alg === "dfs" ? runDFS(s) : alg === "dijkstra" ? runDijkstra(s) : alg === "kruskal" ? runKruskal() : runPrim(s);
      player.load(frames);
    }
    cus.querySelector("#gr-draw").addEventListener("click", function () { if (buildCustom(true)) { fillStarts(); go(); } });
    cus.querySelector("#gr-rand").addEventListener("click", function () { var al = algSel.value; specEl.value = CL.randomGraphSpec(6 + Math.floor(Math.random() * 3), al === "kruskal" || al === "prim" ? false : al === "dijkstra" ? true : dirEl.checked, al === "dijkstra" || al === "kruskal" || al === "prim" || wtEl.checked); if (al === "dijkstra") { dirEl.checked = true; wtEl.checked = true; } if (al === "kruskal" || al === "prim") { dirEl.checked = false; wtEl.checked = true; } saved.pos = null; buildCustom(false); fillStarts(); go(); });
    cus.querySelector("#gr-lay").addEventListener("click", function () { if (GRAPHS.custom) { GRAPHS.custom.pos = CL.graphLayout(GRAPHS.custom); CL.saveGraphPos(GRAPHS.custom); go(); } });
    [dirEl, wtEl, abcEl].forEach(function (x) { x.addEventListener("change", function () { if (buildCustom(true)) { fillStarts(); go(); } }); });
    specEl.addEventListener("keydown", function (e) { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (buildCustom(true)) { fillStarts(); go(); } } });
    host.querySelector("#gr-edit").addEventListener("click", function () {
      var gg = GRAPHS[gSel.value];
      specEl.value = CL.graphToSpec(gg);
      dirEl.checked = !!gg.directed; wtEl.checked = !!gg.weighted;
      saved.pos = JSON.parse(JSON.stringify(gg.pos));
      buildCustom(false);
      gSel.value = "custom";
      fillStarts(); go();
      specEl.focus();
    });
    CL.dragGraph(player.stage, function () { return g && g.id === "custom" ? GRAPHS.custom : g; }, function () { if (g && g.id !== "custom") { /* lecture graphs can be moved for this visit */ } player.go(player.i); });
    algSel.addEventListener("change", function () { fillGraphs(); go(); });
    gSel.addEventListener("change", function () { fillStarts(); go(); });
    sSel.addEventListener("change", go);
    host.querySelector("#gr-go").addEventListener("click", go);
    host.querySelector("#gr-rep").addEventListener("change", function () { player.go(player.i); });
    if (preset && preset.alg) algSel.value = preset.alg;
    fillGraphs();
    if (preset && preset.graph) { gSel.value = "trainer"; fillStarts(); if (preset.start) sSel.value = preset.start; }
    if (preset && preset.spec) { specEl.value = preset.spec; if (preset.directed !== undefined) dirEl.checked = !!preset.directed; if (preset.weighted !== undefined) wtEl.checked = !!preset.weighted; saved.pos = null; buildCustom(false); gSel.value = "custom"; fillStarts(); if (preset.start) sSel.value = preset.start; }
    go();
    return player;
  };

  CL.Diagrams.graph = function (args, body) {
    var g = GRAPHS[args.trim()];
    var d = document.createElement("div");
    d.innerHTML = drawGraph(g, {});
    return { svg: d.firstChild, cap: body || g.name };
  };
})(CL);
