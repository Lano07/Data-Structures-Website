/* COMP 2611 Code Lab — memory diagram: the stack, the heap and every pointer drawn as an arrow. */
(function (CL) {
  "use strict";
  var esc = CL.esc;

  CL.keyOf = function (id, path) { return id + ":" + (path && path.length ? path.join(".") : ""); };
  CL.fakeAddr = function (id) { return 1024 + id * 32; };

  function isPtrV(v) { return v && typeof v === "object" && ("p" in v || ("u" in v && v.ptr) || "lit" in v); }
  function disp(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (v.u) return "?";
    if ("str" in v) return JSON.stringify(v.str);
    if ("p" in v) return v.p === 0 ? "NULL" : "#" + v.p + "/" + (v.path || []).join(".");
    return "";
  }

  // Works out which struct types are list nodes and which are tree nodes, from the field types.
  function classify(structs) {
    var info = {};
    Object.keys(structs || {}).forEach(function (name) {
      var fields = structs[name];
      var self = fields.filter(function (f) { return f[1] === name + "*"; }).map(function (f) { return f[0]; });
      var ti = { name: name, self: self, kind: "plain", fields: fields };
      var lower = self.map(function (s) { return s.toLowerCase(); });
      var parentIdx = lower.findIndex(function (s) { return s === "parent" || s === "up" || s === "p"; });
      var children = self.filter(function (s, i) { return i !== parentIdx && !/^(prev|previous|back)$/i.test(s); });
      if (self.length === 1) { ti.kind = "list"; ti.chain = self[0]; }
      else if (children.length >= 2) { ti.kind = "tree"; ti.children = children.slice(0, 2); ti.parent = parentIdx >= 0 ? self[parentIdx] : null; }
      else if (children.length === 1) { ti.kind = "list"; ti.chain = children[0]; ti.back = self.filter(function (s) { return s !== children[0]; }); }
      var small = fields.length <= 4 && fields.every(function (f) { return !/\[/.test(f[1]); });
      ti.compact = (ti.kind === "list" || ti.kind === "tree") && small;
      info[name] = ti;
    });
    return info;
  }

  function MemViz(host, opts) {
    this.opts = Object.assign({ addresses: false, parents: true }, opts || {});
    this.host = host;
    this.el = document.createElement("div");
    this.el.className = "mv";
    this.el.innerHTML = '<div class="mv-scroll"><div class="mv-canvas"><div class="mv-stack"></div><div class="mv-heap"><div class="mv-heap-area"></div></div><svg class="mv-svg" aria-hidden="true"></svg></div></div>';
    host.appendChild(this.el);
    this.scroll = this.el.querySelector(".mv-scroll");
    this.canvas = this.el.querySelector(".mv-canvas");
    this.stackEl = this.el.querySelector(".mv-stack");
    this.heapEl = this.el.querySelector(".mv-heap-area");
    this.svg = this.el.querySelector(".mv-svg");
    var self = this;
    this.onResize = function () { if (self.snap) self.layoutAndDraw(); };
    if (typeof ResizeObserver !== "undefined") { this.ro = new ResizeObserver(function () { self.onResize(); }); this.ro.observe(this.el); }
  }
  var M = MemViz.prototype;

  M.render = function (snap, prev, structs) {
    this.snap = snap; this.prev = prev; this.structs = structs || this.structs || {};
    this.types = classify(this.structs);
    this.prevVals = prev ? this.collect(prev) : null;
    this.prevHeap = new Set(prev ? prev.heap.map(function (h) { return h.id; }) : []);
    this.renderStack();
    this.renderHeap();
    this.layoutAndDraw();
  };

  // map of key -> display text, for change highlighting
  M.collect = function (snap) {
    var out = new Map();
    function walk(id, path, v) {
      if (v && typeof v === "object" && v.f) { v.f.forEach(function (f) { walk(id, path.concat(f[0]), f[1]); }); return; }
      if (v && typeof v === "object" && v.a) { v.a.forEach(function (x, i) { walk(id, path.concat(i), x); }); return; }
      out.set(CL.keyOf(id, path), disp(v));
    }
    snap.frames.forEach(function (f) { f.vars.forEach(function (v) { if (v.id) walk(v.id, [], v.v); }); });
    snap.globals.forEach(function (v) { if (v.id) walk(v.id, [], v.v); });
    snap.heap.forEach(function (h) { walk(h.id, [], h.v); });
    return out;
  };
  M.changed = function (id, path, v) {
    if (!this.prevVals) return false;
    var k = CL.keyOf(id, path);
    if (!this.prevVals.has(k)) return false;
    return this.prevVals.get(k) !== disp(v);
  };

  // ---- value cells
  M.cell = function (v, id, path, cls) {
    var tgt = ' data-tgt="' + CL.keyOf(id, path) + '"';
    var ch = this.changed(id, path, v) ? " chg" : "";
    if (v && typeof v === "object") {
      if (v.u) return '<span class="mv-v unset' + (v.ptr ? " ptr" : "") + ch + " " + (cls || "") + '"' + tgt + ' title="no value yet (garbage)">?</span>';
      if ("p" in v) {
        if (v.p === 0) return '<span class="mv-v ptr null' + ch + " " + (cls || "") + '"' + tgt + '>NULL</span>';
        if (v.p === -1) return '<span class="mv-v ptr' + ch + '"' + tgt + '>&amp;' + esc(v.b) + "</span>";
        var to = CL.keyOf(v.p, v.path);
        var addr = this.opts.addresses ? '<span class="mv-addr-in">[' + CL.fakeAddr(v.p) + "]</span>" : "";
        return '<span class="mv-v ptr dot' + (v.dead ? " dead" : "") + ch + " " + (cls || "") + '"' + tgt + ' data-to="' + to + '">' + addr + '<i class="mv-dot"></i></span>';
      }
      if ("lit" in v) return '<span class="mv-v str' + ch + '"' + tgt + ">" + esc(JSON.stringify(v.lit)) + "</span>";
      if ("str" in v) return '<span class="mv-v str' + ch + '"' + tgt + ">" + esc(JSON.stringify(v.str)) + "</span>";
      if ("stream" in v) return '<span class="mv-v strm"' + tgt + ">" + esc(v.stream) + (v.file ? " " + esc(JSON.stringify(v.file)) : "") + "</span>";
      if (v.f) return this.structBox(v, id, path, false);
      if (v.a) return this.arrayBox(v, id, path);
    }
    return '<span class="mv-v' + ch + " " + (cls || "") + '"' + tgt + ">" + esc(v) + "</span>";
  };
  M.structBox = function (v, id, path, top) {
    var self = this;
    var rows = v.f.map(function (f) {
      var p = path.concat(f[0]);
      return '<div class="mv-row"><span class="mv-fn">' + esc(f[0]) + "</span>" + self.cell(f[1], id, p) + "</div>";
    }).join("");
    return '<div class="mv-struct"' + (top ? "" : ' data-tgt="' + CL.keyOf(id, path) + '"') + ">" + (top ? "" : '<div class="mv-st">' + esc(v.s) + "</div>") + rows + "</div>";
  };
  M.arrayBox = function (v, id, path) {
    var self = this, a = v.a, n = a.length, show = n;
    if (n > 24) {
      var last = -1;
      for (var i = 0; i < n; i++) if (!(a[i] && a[i].u)) last = i;
      show = Math.min(n, Math.max(8, Math.min(40, last + 2)));
    }
    var cells = "";
    for (var k = 0; k < show; k++) {
      var x = a[k];
      if (v.chars && typeof x === "string") x = x === "'\\0'" ? "\\0" : x.replace(/^'|'$/g, "");
      cells += '<div class="mv-ac"><span class="mv-ai">' + k + "</span>" + self.cell(x, id, path.concat(k)) + "</div>";
    }
    if (show < n) cells += '<div class="mv-ac more"><span class="mv-ai">' + show + "…" + (n - 1) + '</span><span class="mv-v unset">…</span></div>';
    return '<div class="mv-arr' + (a.length && a[0] && a[0].f ? " of-struct" : "") + '" data-tgt="' + CL.keyOf(id, path) + '">' + cells + "</div>";
  };

  // ---- stack column
  M.renderStack = function () {
    var self = this, s = this.snap, html = "";
    if (s.globals && s.globals.length) {
      html += '<div class="mv-frame globals"><div class="mv-fh"><span class="mv-fname">Global variables</span></div>' + s.globals.map(function (v) { return self.varRow(v); }).join("") + "</div>";
    }
    var n = s.frames.length;
    s.frames.forEach(function (f, i) {
      var active = i === n - 1;
      html += '<div class="mv-frame' + (active ? " active" : "") + '" data-fid="' + f.id + '"><div class="mv-fh"><span class="mv-fname">' + esc(f.fn) + '</span><span class="mv-fl">line ' + f.line + "</span></div>" +
        (f.vars.length ? f.vars.map(function (v) { return self.varRow(v); }).join("") : '<div class="mv-empty">no variables yet</div>') + "</div>";
    });
    if (!n) html += '<div class="mv-empty">' + (s.kind === "end" ? "The program has finished." : "") + "</div>";
    this.stackEl.innerHTML = '<div class="mv-h">Stack <span>(local variables)</span></div>' + html;
  };
  M.varRow = function (v) {
    var val;
    if (v.ref) {
      val = '<span class="mv-v ref dot" data-to="' + CL.keyOf(v.ref.p, v.ref.path) + '" data-ref="1" title="reference: another name for the variable it points to"><b>&amp;</b><i class="mv-dot"></i></span>';
    } else val = this.cell(v.v, v.id, []);
    var big = v.v && typeof v.v === "object" && (v.v.f || v.v.a);
    return '<div class="mv-var' + (big ? " big" : "") + (v.st ? " static" : "") + '"' + (v.id ? ' data-tgt="' + CL.keyOf(v.id, []) + '"' : "") + '><span class="mv-name">' + esc(v.name) + '</span><span class="mv-type">' + esc(v.t) + "</span>" + val + "</div>";
  };

  // ---- heap
  M.renderHeap = function () {
    var self = this, s = this.snap;
    this.objs = new Map();
    s.heap.forEach(function (h) { self.objs.set(h.id, h); });
    var html = "";
    s.heap.forEach(function (h) { html += self.heapBox(h); });
    this.heapEl.innerHTML = html || '<div class="mv-empty heap-empty">Nothing on the heap yet. Objects made with <code>new</code> appear here.</div>';
  };
  M.heapBox = function (h) {
    var v = h.v, ti = v && v.s ? this.types[v.s] : null, inner, cls = "mv-obj";
    var isNew = this.prev && !this.prevHeap.has(h.id);
    if (!h.alive) cls += " dead";
    if (isNew) cls += " new";
    if (ti && ti.compact) {
      cls += " compact " + ti.kind;
      inner = this.compactNode(v, h.id, ti);
    } else if (v && v.f) {
      inner = '<div class="mv-st">' + esc(v.s) + "</div>" + this.structBox(v, h.id, [], true);
    } else if (v && v.a) {
      inner = '<div class="mv-st">' + esc(h.t) + "</div>" + this.arrayBox(v, h.id, []);
    } else {
      inner = '<div class="mv-st">' + esc(h.t) + "</div>" + this.cell(v, h.id, []);
    }
    var badge = !h.alive ? '<span class="mv-badge">deleted on line ' + h.fl + "</span>" : "";
    var addr = this.opts.addresses ? '<span class="mv-addr">[' + CL.fakeAddr(h.id) + "]</span>" : "";
    return '<div class="' + cls + '" data-oid="' + h.id + '" data-tgt="' + CL.keyOf(h.id, []) + '">' + inner + addr + badge + "</div>";
  };
  M.compactNode = function (v, id, ti) {
    var self = this;
    var data = v.f.filter(function (f) { return ti.self.indexOf(f[0]) < 0; });
    var ptrs = v.f.filter(function (f) { return ti.self.indexOf(f[0]) >= 0; });
    if (ti.kind === "list") {
      return '<div class="mv-ln">' + data.concat(ptrs).map(function (f) {
        return '<div class="mv-lc"><span class="mv-lf">' + esc(f[0]) + "</span>" + self.cell(f[1], id, [f[0]], f[0] === ti.chain ? "chain" : "") + "</div>";
      }).join("") + "</div>";
    }
    var top = data.map(function (f) { return '<div class="mv-td" title="' + esc(f[0]) + '">' + self.cell(f[1], id, [f[0]]) + "</div>"; }).join("");
    var kids = ti.children.map(function (c) {
      var f = v.f.filter(function (x) { return x[0] === c; })[0];
      return '<div class="mv-tc"><span class="mv-lf">' + esc(c) + "</span>" + self.cell(f[1], id, [c], "child") + "</div>";
    }).join("");
    var par = "";
    if (ti.parent) {
      var pf = v.f.filter(function (x) { return x[0] === ti.parent; })[0];
      par = '<div class="mv-tp">' + this.cell(pf[1], id, [ti.parent], "parent") + "</div>";
    }
    return par + '<div class="mv-tt">' + top + '</div><div class="mv-tk">' + kids + "</div>";
  };

  // ---- layout: lists in rows, trees as trees, the rest in a flow
  M.layoutAndDraw = function () {
    if (!this.snap) return;
    var self = this, heap = this.snap.heap;
    var boxes = new Map();
    this.heapEl.querySelectorAll(".mv-obj").forEach(function (el) {
      boxes.set(+el.getAttribute("data-oid"), { el: el, w: el.offsetWidth, h: el.offsetHeight });
    });
    if (!boxes.size) { this.heapEl.style.width = ""; this.heapEl.style.height = ""; this.drawArrows(); return; }
    var objs = this.objs, types = this.types;
    function ptrTarget(v) { return v && typeof v === "object" && v.p > 0 && (!v.path || !v.path.length) ? v.p : 0; }
    function fieldOf(h, name) { if (!h || !h.v || !h.v.f) return null; for (var i = 0; i < h.v.f.length; i++) if (h.v.f[i][0] === name) return h.v.f[i][1]; return null; }
    // order of first reference from the stack
    var order = new Map(), k = 0;
    function noteRefs(v) {
      if (!v || typeof v !== "object") return;
      if (v.p > 0 && !order.has(v.p)) order.set(v.p, k++);
      if (v.f) v.f.forEach(function (f) { noteRefs(f[1]); });
      if (v.a) v.a.forEach(noteRefs);
    }
    this.snap.globals.forEach(function (v) { noteRefs(v.v); });
    this.snap.frames.forEach(function (f) { f.vars.forEach(function (v) { noteRefs(v.v); if (v.ref) noteRefs({ p: v.ref.p }); }); });
    heap.forEach(function (h) { noteRefs(h.v); });
    function rank(id) { return order.has(id) ? order.get(id) : 1e6 + id; }

    var placed = new Set(), comps = [];
    // trees
    var treeChildOf = new Set();
    heap.forEach(function (h) {
      var ti = h.v && h.v.s ? types[h.v.s] : null;
      if (ti && ti.kind === "tree") ti.children.forEach(function (c) { var t = ptrTarget(fieldOf(h, c)); if (t && objs.has(t)) treeChildOf.add(t); });
    });
    heap.forEach(function (h) {
      var ti = h.v && h.v.s ? types[h.v.s] : null;
      if (ti && ti.kind === "tree" && !treeChildOf.has(h.id)) comps.push({ kind: "tree", root: h.id, rank: rank(h.id) });
    });
    // lists
    var chainOf = new Set();
    heap.forEach(function (h) {
      var ti = h.v && h.v.s ? types[h.v.s] : null;
      if (ti && ti.kind === "list") { var t = ptrTarget(fieldOf(h, ti.chain)); if (t && objs.has(t)) chainOf.add(t); }
    });
    heap.forEach(function (h) {
      var ti = h.v && h.v.s ? types[h.v.s] : null;
      if (ti && ti.kind === "list" && !chainOf.has(h.id)) comps.push({ kind: "list", head: h.id, rank: rank(h.id) });
    });
    comps.sort(function (a, b) { return a.rank - b.rank; });
    var GAP = 38, ROWGAP = 26, LEVEL = 74, PAD = 10;
    var y = PAD, maxX = 0, pos = new Map();
    function chainIds(head) {
      var ids = [], seen = new Set(), cur = head;
      while (cur && objs.has(cur) && !seen.has(cur) && !placed.has(cur)) {
        seen.add(cur); ids.push(cur);
        var h = objs.get(cur), ti = types[h.v.s];
        cur = ptrTarget(fieldOf(h, ti.chain));
      }
      return ids;
    }
    comps.forEach(function (c) {
      if (c.kind === "list") {
        var ids = chainIds(c.head);
        if (!ids.length) return;
        var x = PAD, rowH = 0;
        ids.forEach(function (id) { var b = boxes.get(id); pos.set(id, { x: x, y: y }); placed.add(id); x += b.w + GAP; rowH = Math.max(rowH, b.h); });
        maxX = Math.max(maxX, x - GAP);
        y += rowH + ROWGAP;
      } else {
        var res = self.layoutTree(c.root, boxes, objs, types, placed, ptrTarget, fieldOf);
        if (!res) return;
        res.nodes.forEach(function (n) { pos.set(n.id, { x: PAD + n.x, y: y + n.depth * LEVEL }); placed.add(n.id); });
        maxX = Math.max(maxX, PAD + res.width);
        y += (res.depthMax + 1) * LEVEL - (LEVEL - res.nodeH) + ROWGAP;
      }
    });
    // remaining objects (cycles in lists, arrays, plain structs): flow
    var rest = heap.filter(function (h) { return !placed.has(h.id); }).sort(function (a, b) { return rank(a.id) - rank(b.id); });
    // cycles: chains whose every node is pointed to
    rest.forEach(function (h) {
      if (placed.has(h.id)) return;
      var ti = h.v && h.v.s ? types[h.v.s] : null;
      if (ti && ti.kind === "list") {
        var ids = chainIds(h.id), x = PAD, rowH = 0;
        ids.forEach(function (id) { var b = boxes.get(id); pos.set(id, { x: x, y: y }); placed.add(id); x += b.w + GAP; rowH = Math.max(rowH, b.h); });
        maxX = Math.max(maxX, x - GAP);
        y += rowH + ROWGAP;
      }
    });
    var avail = Math.max(260, this.heapEl.parentNode.clientWidth - 2 * PAD);
    var fx = PAD, rowH2 = 0;
    rest.forEach(function (h) {
      if (placed.has(h.id)) return;
      var b = boxes.get(h.id);
      if (fx > PAD && fx + b.w > avail) { fx = PAD; y += rowH2 + ROWGAP; rowH2 = 0; }
      pos.set(h.id, { x: fx, y: y });
      placed.add(h.id);
      fx += b.w + GAP;
      rowH2 = Math.max(rowH2, b.h);
      maxX = Math.max(maxX, fx - GAP);
    });
    if (rowH2) y += rowH2 + ROWGAP;
    boxes.forEach(function (b, id) {
      var p = pos.get(id) || { x: PAD, y: y };
      b.el.style.left = p.x + "px";
      b.el.style.top = p.y + "px";
    });
    this.heapEl.style.width = (maxX + PAD) + "px";
    this.heapEl.style.height = Math.max(60, y - ROWGAP + PAD) + "px";
    this.drawArrows();
  };

  // tidy-ish tree layout: each subtree gets its own horizontal span; parents are centred over their children
  M.layoutTree = function (rootId, boxes, objs, types, placed, ptrTarget, fieldOf) {
    var seen = new Set(), nodes = [], GAP = 14;
    var nodeW = 0, nodeH = 0;
    function walk(id, depth) {
      if (!id || !objs.has(id) || seen.has(id) || placed.has(id)) return null;
      seen.add(id);
      var h = objs.get(id), ti = types[h.v.s], b = boxes.get(id);
      nodeW = Math.max(nodeW, b.w); nodeH = Math.max(nodeH, b.h);
      var kids = ti.children.map(function (c) { return walk(ptrTarget(fieldOf(h, c)), depth + 1); });
      return { id: id, depth: depth, kids: kids, w: b.w };
    }
    var root = walk(rootId, 0);
    if (!root) return null;
    var slot = Math.round(nodeW * 0.62);
    function width(n) {
      if (!n) return 0;
      var l = width(n.kids[0]), r = width(n.kids[1]);
      if (!n.kids[0] && !n.kids[1]) n.sw = nodeW;
      else n.sw = Math.max(nodeW, (l || slot) + GAP + (r || slot));
      n.lw = l || slot; n.rw = r || slot;
      return n.sw;
    }
    width(root);
    var depthMax = 0;
    function place(n, x0) {
      if (!n) return;
      depthMax = Math.max(depthMax, n.depth);
      var l = n.kids[0], r = n.kids[1];
      if (!l && !r) { n.x = x0 + (n.sw - n.w) / 2; nodes.push(n); return; }
      var span = n.lw + GAP + n.rw, off = x0 + (n.sw - span) / 2;
      place(l, off);
      place(r, off + n.lw + GAP);
      var cl = l ? l.x + l.w / 2 : off + n.lw / 2, cr = r ? r.x + r.w / 2 : off + n.lw + GAP + n.rw / 2;
      n.x = (cl + cr) / 2 - n.w / 2;
      nodes.push(n);
    }
    place(root, 0);
    return { nodes: nodes, width: root.sw, depthMax: depthMax, nodeH: nodeH };
  };

  // ---- arrows
  M.drawArrows = function () {
    var svg = this.svg, canvas = this.canvas;
    var cr = canvas.getBoundingClientRect();
    svg.setAttribute("width", canvas.scrollWidth);
    svg.setAttribute("height", canvas.scrollHeight);
    var defs = '<defs><marker id="mvA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mv-ah"/></marker>' +
      '<marker id="mvAd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mv-ah dead"/></marker>' +
      '<marker id="mvAp" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="mv-ah par"/></marker></defs>';
    var paths = "";
    var self = this;
    var targets = new Map();
    canvas.querySelectorAll("[data-tgt]").forEach(function (el) { if (!targets.has(el.getAttribute("data-tgt"))) targets.set(el.getAttribute("data-tgt"), el); });
    canvas.querySelectorAll("[data-to]").forEach(function (src) {
      var to = src.getAttribute("data-to");
      var isParent = src.classList.contains("parent");
      if (isParent && !self.opts.parents) return;
      var tgt = targets.get(to);
      if (!tgt) {
        var id = to.split(":")[0];
        tgt = targets.get(id + ":");
      }
      if (!tgt) return;
      if (tgt.classList.contains("mv-var") || tgt.classList.contains("mv-obj")) { /* whole box */ }
      var dot = src.querySelector(".mv-dot") || src;
      var a = dot.getBoundingClientRect(), b = tgt.getBoundingClientRect();
      var sx = a.left + a.width / 2 - cr.left + canvas.scrollLeft * 0, sy = a.top + a.height / 2 - cr.top;
      var bx = b.left - cr.left, by = b.top - cr.top, bw = b.width, bh = b.height;
      var dead = src.classList.contains("dead"), ref = src.hasAttribute("data-ref");
      var tx, ty, d;
      var isChild = src.classList.contains("child");
      if (isChild) {
        tx = bx + bw / 2; ty = by;
        d = "M" + sx + "," + sy + " C" + sx + "," + (sy + 26) + " " + tx + "," + (ty - 26) + " " + tx + "," + (ty - 1);
      } else if (isParent) {
        tx = bx + bw / 2; ty = by + bh;
        d = "M" + sx + "," + sy + " C" + (sx - 30) + "," + (sy - 30) + " " + (tx - 20) + "," + (ty + 30) + " " + tx + "," + (ty + 1);
      } else if (bx > sx + 8) {
        tx = bx; ty = Math.min(Math.max(sy, by + 10), by + bh - 10);
        if (src.classList.contains("chain") && Math.abs(ty - sy) < 14) ty = sy;
        var mx = (sx + tx) / 2;
        d = "M" + sx + "," + sy + " C" + mx + "," + sy + " " + mx + "," + ty + " " + (tx - 1) + "," + ty;
      } else if (bx + bw < sx - 8) {
        tx = bx + bw; ty = by + Math.min(bh / 2, 14);
        d = "M" + sx + "," + sy + " C" + (sx + 40) + "," + (sy - 50) + " " + (tx + 40) + "," + (ty - 40) + " " + (tx + 1) + "," + ty;
      } else {
        tx = bx + bw / 2;
        if (by > sy) { ty = by; d = "M" + sx + "," + sy + " C" + (sx + 30) + "," + (sy + 30) + " " + tx + "," + (ty - 30) + " " + tx + "," + (ty - 1); }
        else { ty = by + bh; d = "M" + sx + "," + sy + " C" + (sx + 40) + "," + (sy - 30) + " " + tx + "," + (ty + 30) + " " + tx + "," + (ty + 1); }
      }
      var cls = "mv-arrow" + (dead ? " dead" : "") + (isParent ? " par" : "") + (ref ? " ref" : "");
      var mk = dead ? "mvAd" : isParent ? "mvAp" : "mvA";
      paths += '<path class="' + cls + '" d="' + d + '" marker-end="url(#' + mk + ')"/>';
      if (dead) paths += '<text class="mv-x" x="' + (tx - 4) + '" y="' + (ty - 6) + '">✕</text>';
    });
    svg.innerHTML = defs + paths;
  };
  M.setOpt = function (k, v) { this.opts[k] = v; if (this.snap) this.render(this.snap, this.prev, this.structs); };
  M.destroy = function () { if (this.ro) this.ro.disconnect(); };

  CL.MemViz = MemViz;
  CL.classifyStructs = classify;
})(CL);
