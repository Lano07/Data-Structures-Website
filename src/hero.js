/* COMP 2611 Code Lab — the home page centrepiece: fifteen values that morph between the course's data structures
   (linked list, BST, max-heap array, graph, hash table with chaining, sorted array), with a pulse that walks each one.
   Canvas 2D only; it pauses when off screen or in a hidden tab and stays still with reduced motion. */
(function (CL) {
  "use strict";
  var VALS = [12, 25, 37, 41, 50, 63, 68, 74, 81, 9, 30, 55, 88, 19, 46];
  var N = VALS.length;
  var COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#60a5fa"];

  // ---------------------------------------------------------------- the layouts (coordinates are 0..1 of the canvas)
  function layouts() {
    var L = [];
    // 1. linked list: a snake of 15 nodes, top -> ... -> NULL
    (function () {
      var pos = [], edges = [], order = [];
      for (var i = 0; i < N; i++) {
        var row = i < 8 ? 0 : 1, col = row === 0 ? i : 14 - i;
        pos.push({ x: 0.08 + col * (0.84 / 7), y: row === 0 ? 0.34 : 0.68, w: 0.072, h: 0.072, r: 1, vis: 1 });
        if (i > 0) edges.push([i - 1, i, "arrow"]);
        order.push(i);
      }
      L.push({ name: "Linked list", sub: "Each node stores the address of the next one: top → … → NULL", pos: pos, edges: edges, order: order });
    })();
    // 2. binary search tree: a perfect BST of the 15 values (inorder gives sorted order)
    (function () {
      var sorted = VALS.map(function (v, i) { return { v: v, i: i }; }).sort(function (a, b) { return a.v - b.v; });
      var pos = new Array(N), edges = [], order = [];
      (function build(lo, hi, d, parent) {
        if (lo > hi) return;
        var mid = (lo + hi) >> 1, id = sorted[mid].i;
        pos[id] = { x: 0.05 + (mid + 0.5) * (0.9 / 15), y: 0.13 + d * 0.245, w: 0.07, h: 0.07, r: 1, vis: 1 };
        if (parent !== null) edges.push([parent, id, "line"]);
        build(lo, mid - 1, d + 1, id);
        order.push(id);
        build(mid + 1, hi, d + 1, id);
      })(0, N - 1, 0, null);
      L.push({ name: "Binary search tree", sub: "Smaller keys to the left, bigger to the right; inorder visits them in order", pos: pos, edges: edges, order: order });
    })();
    // 3. max-heap stored in an array (location 0 not used): children of i are 2i and 2i + 1
    (function () {
      var A = [0].concat(VALS.slice()), n = N;
      function heapify(i) { var l = 2 * i, r = 2 * i + 1, g = i; if (l <= n && A[l] > A[g]) g = l; if (r <= n && A[r] > A[g]) g = r; if (g !== i) { var t = A[i]; A[i] = A[g]; A[g] = t; heapify(g); } }
      for (var i = Math.floor(n / 2); i >= 1; i--) heapify(i);
      var pos = new Array(N), edges = [], order = [], idOf = {};
      for (var k = 1; k <= n; k++) {
        var id = VALS.indexOf(A[k]);
        idOf[k] = id;
        pos[id] = { x: 0.04 + (k - 0.5) * (0.92 / 15), y: 0.7, w: 0.056, h: 0.1, r: 0.18, vis: 1, idx: k };
        order.push(id);
      }
      for (var p = 1; p <= n; p++) { if (2 * p <= n) edges.push([idOf[p], idOf[2 * p], "arc"]); if (2 * p + 1 <= n) edges.push([idOf[p], idOf[2 * p + 1], "arc"]); }
      L.push({ name: "Max-heap in an array", sub: "A[i / 2] ≥ A[i]; the children of location i are 2i and 2i + 1", pos: pos, edges: edges, order: order });
    })();
    // 4. a graph: ten vertices, visited in breadth-first order from the first
    (function () {
      var pos = new Array(N), ring = [0, 3, 6, 9, 12, 1, 4, 7, 10, 13], edges = [], order = [];
      var pts = [[0.5, 0.12], [0.8, 0.26], [0.88, 0.6], [0.66, 0.86], [0.34, 0.86], [0.12, 0.6], [0.2, 0.26], [0.5, 0.42], [0.62, 0.62], [0.38, 0.62]];
      for (var i = 0; i < N; i++) pos[i] = { x: 0.5, y: 0.5, w: 0.07, h: 0.07, r: 1, vis: 0 };
      ring.forEach(function (id, j) { pos[id] = { x: pts[j][0], y: pts[j][1], w: 0.074, h: 0.074, r: 1, vis: 1 }; });
      var E = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], [0, 7], [7, 8], [7, 9], [8, 2], [9, 5], [8, 9], [1, 7], [6, 7]];
      E.forEach(function (e) { edges.push([ring[e[0]], ring[e[1]], "line"]); });
      var adj = {}, seen = {}, q = [ring[0]];
      edges.forEach(function (e) { (adj[e[0]] = adj[e[0]] || []).push(e[1]); (adj[e[1]] = adj[e[1]] || []).push(e[0]); });
      seen[ring[0]] = 1;
      while (q.length) { var u = q.shift(); order.push(u); (adj[u] || []).forEach(function (v) { if (!seen[v]) { seen[v] = 1; q.push(v); } }); }
      L.push({ name: "Graph", sub: "Vertices and edges; breadth-first search visits them level by level", pos: pos, edges: edges, order: order });
    })();
    // 5. hash table with chaining: h = key % 12 + 1, new keys at the front of each chain
    (function () {
      var pos = new Array(N), edges = [], order = [], chains = {};
      VALS.forEach(function (v, id) { var b = v % 12 + 1; (chains[b] = chains[b] || []).unshift(id); });
      for (var b = 1; b <= 12; b++) (chains[b] || []).forEach(function (id, j) {
        pos[id] = { x: 0.26 + j * 0.13, y: 0.06 + (b - 0.5) * (0.88 / 12), w: 0.085, h: 0.058, r: 0.25, vis: 1, bucket: b };
        if (j > 0) edges.push([chains[b][j - 1], id, "arrow"]);
      });
      VALS.forEach(function (v, id) { order.push(id); });
      L.push({ name: "Hash table (chaining)", sub: "h = key % 12 + 1; keys that collide share a linked list", pos: pos, edges: edges, order: order, buckets: true });
    })();
    // 6. sorted: bars in ascending order (merge sort, quick sort, heap sort ...)
    (function () {
      var sorted = VALS.map(function (v, i) { return { v: v, i: i }; }).sort(function (a, b) { return a.v - b.v; }), pos = new Array(N), order = [];
      sorted.forEach(function (s, k) { var h = 0.12 + 0.68 * s.v / 90; pos[s.i] = { x: 0.06 + (k + 0.5) * (0.88 / 15), y: 0.9 - h / 2, w: 0.044, h: h, r: 0.12, vis: 1, bar: 1 }; order.push(s.i); });
      L.push({ name: "Sorted array", sub: "Selection, insertion, bubble: O(n²). Merge and heap sort: O(n log n)", pos: pos, edges: [], order: order });
    })();
    return L;
  }

  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  CL.HeroMorph = function (host) {
    var cv = document.createElement("canvas"), cx = cv.getContext("2d"), L = layouts(), W = 0, H = 0, dpr = 1;
    var label = document.createElement("div");
    label.className = "nx-label";
    label.setAttribute("aria-live", "off");
    var dots = document.createElement("div");
    dots.className = "nx-dots";
    dots.innerHTML = L.map(function (l, i) { return '<button type="button" aria-label="Show ' + l.name + '" data-i="' + i + '"></button>'; }).join("");
    host.appendChild(cv);
    host.appendChild(label);
    host.appendChild(dots);
    var cur = 0, nxt = 0, t0 = 0, phase = "hold", HOLD = 3600, MORPH = 1300, raf = 0, visible = true, stopped = false, pulse0 = 0;
    function setLabel(i) {
      label.innerHTML = "<b>" + L[i].name + "</b><span>" + L[i].sub + "</span>";
      label.classList.remove("in"); void label.offsetWidth; label.classList.add("in");
      dots.querySelectorAll("button").forEach(function (b, j) { b.classList.toggle("on", j === i); });
    }
    function size() {
      var r = host.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(280, r.width); H = Math.max(220, r.height);
      cv.width = W * dpr; cv.height = H * dpr;
      cv.style.width = W + "px"; cv.style.height = H + "px";
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    }
    function light() { var t = document.documentElement.getAttribute("data-theme"); return t === "light" || (!t && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches); }
    function stateAt(now) {
      var k = 0;
      if (phase === "morph") k = ease(Math.min(1, (now - t0) / MORPH));
      return k;
    }
    function rr(x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      cx.beginPath();
      cx.moveTo(x + r, y); cx.lineTo(x + w - r, y); cx.quadraticCurveTo(x + w, y, x + w, y + r);
      cx.lineTo(x + w, y + h - r); cx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      cx.lineTo(x + r, y + h); cx.quadraticCurveTo(x, y + h, x, y + h - r);
      cx.lineTo(x, y + r); cx.quadraticCurveTo(x, y, x + r, y);
      cx.closePath();
    }
    function drawEdges(lay, P, alpha, now, lt) {
      if (alpha <= 0.01) return;
      var hiOrder = lay.order, step = Math.floor((now - pulse0) / 420) % (hiOrder.length + 3);
      lay.edges.forEach(function (e) {
        var a = P[e[0]], b = P[e[1]];
        if (!a || !b) return;
        var on = hiOrder.indexOf(e[1]) <= step - 1 && hiOrder.indexOf(e[0]) <= step - 1;
        cx.save();
        cx.globalAlpha = alpha * (on ? 0.95 : 0.45);
        var grad = cx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, on ? "#22d3ee" : (lt ? "#8b7cf6" : "#6d7bd8"));
        grad.addColorStop(1, on ? "#a78bfa" : (lt ? "#c4b5fd" : "#3f4aa0"));
        cx.strokeStyle = grad;
        cx.lineWidth = on ? 2.6 : 1.6;
        cx.shadowColor = on ? "#22d3ee" : "transparent";
        cx.shadowBlur = on && !lt ? 12 : 0;
        cx.beginPath();
        if (e[2] === "arc") {
          var mx = (a.x + b.x) / 2, dist = Math.abs(b.x - a.x), my = a.y - a.h / 2 - Math.min(H * 0.42, dist * 0.55);
          cx.moveTo(a.x, a.y - a.h / 2);
          cx.quadraticCurveTo(mx, my, b.x, b.y - b.h / 2);
        } else {
          var dx = b.x - a.x, dy = b.y - a.y, L2 = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L2, uy = dy / L2, ra = a.w / 2, rb = b.w / 2 + (e[2] === "arrow" ? 4 : 0);
          cx.moveTo(a.x + ux * ra, a.y + uy * ra);
          cx.lineTo(b.x - ux * rb, b.y - uy * rb);
          if (e[2] === "arrow") {
            var tx = b.x - ux * rb, ty = b.y - uy * rb;
            cx.moveTo(tx, ty); cx.lineTo(tx - ux * 8 - uy * 5, ty - uy * 8 + ux * 5);
            cx.moveTo(tx, ty); cx.lineTo(tx - ux * 8 + uy * 5, ty - uy * 8 - ux * 5);
          }
        }
        cx.stroke();
        cx.restore();
      });
    }
    function draw(now) {
      if (!W) return;
      var lt = light(), k = stateAt(now), A = L[cur], B = L[nxt];
      cx.clearRect(0, 0, W, H);
      var unit = Math.min(W, H * 1.35);
      // positions in pixels, blended between the two layouts
      var P = [];
      for (var i = 0; i < N; i++) {
        var a = A.pos[i], b = B.pos[i], t = phase === "morph" ? k : 0;
        var vis = lerp(a.vis, b.vis, t);
        P.push({ x: lerp(a.x, b.x, t) * W, y: lerp(a.y, b.y, t) * H, w: lerp(a.bar ? a.w * W : a.w * unit, b.bar ? b.w * W : b.w * unit, t), h: lerp(a.bar ? a.h * H : a.h * unit, b.bar ? b.h * H : b.h * unit, t), r: lerp(a.r, b.r, t), vis: vis, idx: t < 0.5 ? a.idx : b.idx, bucket: t < 0.5 ? a.bucket : b.bucket });
      }
      // edges: the old layout fades out in the first half of a morph, the new one fades in during the second
      if (phase === "morph") { drawEdges(A, P, 1 - Math.min(1, k * 2), now, lt); drawEdges(B, P, Math.max(0, k * 2 - 1), now, lt); }
      else drawEdges(A, P, 1, now, lt);
      // hash buckets: the table column
      var bk = phase === "morph" ? (A.buckets ? 1 - k : B.buckets ? k : 0) : (A.buckets ? 1 : 0);
      if (bk > 0.01) {
        cx.save();
        cx.globalAlpha = bk;
        for (var b2 = 1; b2 <= 12; b2++) {
          var y = (0.06 + (b2 - 0.5) * (0.88 / 12)) * H, bw = 0.075 * unit, bh = 0.058 * unit;
          rr(0.12 * W - bw / 2, y - bh / 2, bw, bh, 5);
          cx.strokeStyle = lt ? "rgba(109,74,255,.35)" : "rgba(142,162,255,.35)";
          cx.lineWidth = 1.2;
          cx.stroke();
          cx.fillStyle = lt ? "#6f6a96" : "#8189b3";
          cx.font = "600 " + Math.max(9, Math.round(bh * 0.42)) + "px 'JetBrains Mono', monospace";
          cx.textAlign = "center"; cx.textBaseline = "middle";
          cx.fillText(b2, 0.12 * W, y);
          cx.beginPath(); cx.moveTo(0.12 * W + bw / 2, y); cx.lineTo(0.26 * W - 0.0425 * unit - 4, y);
          cx.strokeStyle = lt ? "rgba(109,74,255,.25)" : "rgba(142,162,255,.25)"; cx.stroke();
        }
        cx.restore();
      }
      // nodes, with the pulse walking the current layout's order
      var lay = phase === "morph" ? (k < 0.5 ? A : B) : A, step = Math.floor((now - pulse0) / 420) % (lay.order.length + 3);
      for (var j = 0; j < N; j++) {
        var p = P[j];
        if (p.vis < 0.02) continue;
        var rank = lay.order.indexOf(j), lit = phase === "hold" && rank >= 0 && rank <= step, head = phase === "hold" && rank === step;
        var col = COLORS[j % COLORS.length], x = p.x - p.w / 2, y2 = p.y - p.h / 2, rad = p.r >= 1 ? Math.min(p.w, p.h) / 2 : Math.max(3, Math.min(p.w, p.h) * p.r);
        cx.save();
        cx.globalAlpha = p.vis;
        var g = cx.createLinearGradient(x, y2, x, y2 + p.h);
        if (lt) { g.addColorStop(0, "#ffffff"); g.addColorStop(1, head ? "#fde68a" : lit ? "#e0f7ff" : "#efeaff"); }
        else { g.addColorStop(0, head ? "#6b4b0c" : lit ? "#0e4c60" : "#1f2a63"); g.addColorStop(1, head ? "#2b1d04" : lit ? "#082230" : "#0b1230"); }
        rr(x, y2, p.w, p.h, rad);
        cx.fillStyle = g;
        cx.shadowColor = head ? "#fbbf24" : lit ? col : "rgba(124,92,255,.6)";
        cx.shadowBlur = lt ? (head ? 14 : 0) : head ? 26 : lit ? 16 : 8;
        cx.fill();
        cx.shadowBlur = 0;
        cx.lineWidth = head ? 2.6 : 1.8;
        cx.strokeStyle = head ? "#fbbf24" : lit ? col : (lt ? "rgba(109,74,255,.55)" : "rgba(142,162,255,.55)");
        cx.stroke();
        cx.fillStyle = lt ? "#1a1640" : "#e9ecff";
        var fs = Math.max(9, Math.round(Math.min(p.w, p.h > p.w * 1.6 ? p.w : p.h) * 0.42));
        cx.font = "700 " + fs + "px 'JetBrains Mono', monospace";
        cx.textAlign = "center";
        cx.textBaseline = "middle";
        var ty = p.h > p.w * 1.6 ? y2 + p.h - fs : p.y;
        cx.fillText(VALS[j], p.x, ty);
        if (p.idx && phase === "hold") { cx.fillStyle = lt ? "#6f6a96" : "#8189b3"; cx.font = "600 " + Math.max(8, fs - 3) + "px 'JetBrains Mono', monospace"; cx.fillText(p.idx, p.x, y2 + p.h + fs * 0.9); }
        cx.restore();
      }
    }
    function tick(now) {
      raf = 0;
      if (stopped) return;
      if (!t0) { t0 = now; pulse0 = now; }
      if (phase === "hold" && now - t0 > HOLD) { phase = "morph"; nxt = (cur + 1) % L.length; t0 = now; }
      else if (phase === "morph" && now - t0 > MORPH) { phase = "hold"; cur = nxt; t0 = now; pulse0 = now; setLabel(cur); }
      draw(now);
      if (visible && !document.hidden && !CL.reduceMotion) raf = requestAnimationFrame(tick);
    }
    function wake() { if (!raf && !stopped && visible && !document.hidden && !CL.reduceMotion) raf = requestAnimationFrame(tick); }
    dots.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var i = +b.getAttribute("data-i");
      if (i === cur && phase === "hold") return;
      if (phase === "morph") cur = nxt;
      nxt = i; phase = "morph"; t0 = performance.now();
      if (CL.reduceMotion) { cur = i; phase = "hold"; setLabel(cur); draw(performance.now()); }
      wake();
    });
    var io = window.IntersectionObserver ? new IntersectionObserver(function (en) { visible = en[0].isIntersecting; wake(); }) : null;
    if (io) io.observe(host);
    var onVis = function () { wake(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", size);
    setLabel(0);
    if (CL.reduceMotion) { cur = 1; setLabel(1); }
    size();
    wake();
    return { destroy: function () { stopped = true; if (raf) cancelAnimationFrame(raf); if (io) io.disconnect(); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("resize", size); } };
  };
})(CL);
