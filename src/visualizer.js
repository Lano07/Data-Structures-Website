/* COMP 2611 Code Lab — the step-by-step visualizer: code, controls, explanation, output, memory and call tree. */
(function (CL) {
  "use strict";
  var esc = CL.esc;

  CL.runTrace = function (code, opts) {
    return CPP.run(code, Object.assign({ trace: true, maxSnaps: 2500, maxSteps: 400000 }, opts || {}));
  };

  function Visualizer(host, opts) {
    this.opts = opts || {};
    this.host = host;
    var el = this.el = document.createElement("div");
    el.className = "viz";
    el.innerHTML =
      '<div class="viz-top">' +
      '<div class="viz-code"><pre class="code viz-pre"><code></code></pre></div>' +
      '<div class="viz-side">' +
      '<div class="viz-ctl" role="group" aria-label="Step controls">' +
      '<button type="button" class="btn icon" data-a="first" title="Go to the start" aria-label="Go to the start">⏮</button>' +
      '<button type="button" class="btn icon" data-a="prev" title="Step back (←)" aria-label="Step back">◀</button>' +
      '<button type="button" class="btn primary" data-a="next" title="Step forward (→)">Next ▶</button>' +
      '<button type="button" class="btn icon" data-a="last" title="Go to the end" aria-label="Go to the end">⏭</button>' +
      '<button type="button" class="btn" data-a="play">Play</button>' +
      '<select class="viz-speed" aria-label="Playback speed"><option value="900">Slow</option><option value="450" selected>Normal</option><option value="160">Fast</option></select>' +
      "</div>" +
      '<div class="viz-range"><input type="range" min="0" max="0" value="0" aria-label="Step"><span class="viz-count"></span></div>' +
      '<div class="viz-say" aria-live="polite"></div><div class="viz-tutor tutor-only"></div>' +
      '<div class="viz-out"><div class="viz-oh">Output</div><pre class="viz-o"></pre></div>' +
      "</div></div>" +
      '<div class="viz-tabs" role="tablist"><button type="button" class="tab on" data-t="mem" role="tab">Memory</button><button type="button" class="tab" data-t="calls" role="tab">Call tree</button>' +
      '<span class="viz-opts"><label><input type="checkbox" class="opt-addr"> Show addresses</label><label><input type="checkbox" class="opt-par" checked> Parent links</label></span></div>' +
      '<div class="viz-mem"></div><div class="viz-calls" hidden></div>';
    host.appendChild(el);
    this.pre = el.querySelector(".viz-pre code");
    this.codeBox = el.querySelector(".viz-code");
    this.range = el.querySelector("input[type=range]");
    this.count = el.querySelector(".viz-count");
    this.say = el.querySelector(".viz-say");
    this.outEl = el.querySelector(".viz-o");
    this.memEl = el.querySelector(".viz-mem");
    this.callsEl = el.querySelector(".viz-calls");
    this.mv = new CL.MemViz(this.memEl, {});
    var self = this;
    if (CL.Tutor) {
      el.querySelector(".viz-tutor").appendChild(CL.Tutor.button("Ask the tutor about this step", function () {
        var s = self.snaps && self.snaps[self.i];
        var where = s && s.line ? " (line " + s.line + ")" : "";
        CL.Tutor.ask("Explain what is happening at this step" + where + ".", {
          content: "I'm stepping through this program in the memory visualizer.\n\nPROGRAM:\n" + CL.numbered(self.code || "") +
            "\n\nWHERE I AM:\n" + self.tutorContext() +
            "\n\nExplain what is happening at this step and why, in simple steps. Say what changes in memory (stack frames, heap objects, pointers) and what will happen next."
        });
      }));
    }
    el.querySelector(".viz-ctl").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "play") return self.togglePlay();
      self.stop();
      if (a === "first") self.go(0);
      if (a === "prev") self.go(self.i - 1);
      if (a === "next") self.go(self.i + 1);
      if (a === "last") self.go(self.n - 1);
    });
    this.range.addEventListener("input", function () { self.stop(); self.go(+self.range.value); });
    el.querySelector(".viz-tabs").addEventListener("click", function (e) {
      var t = e.target.closest(".tab");
      if (!t) return;
      el.querySelectorAll(".viz-tabs .tab").forEach(function (x) { x.classList.toggle("on", x === t); });
      var calls = t.getAttribute("data-t") === "calls";
      self.memEl.hidden = calls;
      self.callsEl.hidden = !calls;
      if (calls) self.renderCalls(); else self.mv.layoutAndDraw();
    });
    el.querySelector(".opt-addr").addEventListener("change", function (e) { self.mv.setOpt("addresses", e.target.checked); });
    el.querySelector(".opt-par").addEventListener("change", function (e) { self.mv.setOpt("parents", e.target.checked); });
    el.addEventListener("keydown", function (e) {
      if (e.target.closest("input[type=text], textarea, select")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); self.stop(); self.go(self.i + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); self.stop(); self.go(self.i - 1); }
    });
    el.tabIndex = -1;
    if (CL.vizInit) CL.vizInit(this);
  }
  var V = Visualizer.prototype;

  V.load = function (code, opts) {
    opts = opts || {};
    this.stop();
    this.code = code;
    var r = this.res = CL.runTrace(code, opts);
    var lines = CL.highlightLines(code.replace(/\s+$/, ""));
    this.pre.innerHTML = lines.map(function (l) { return '<span class="ln">' + (l || " ") + "</span>"; }).join("\n");
    this.lineEls = this.pre.querySelectorAll(".ln");
    if (this.afterLoad) this.afterLoad();
    if (!r.compiled) {
      this.n = 0;
      this.el.classList.add("no-run");
      this.say.innerHTML = '<div class="say-err"><b>This program does not compile' + (r.err.line ? " (line " + r.err.line + ")" : "") + ".</b> " + esc(r.err.msg) + (r.err.hint ? '<div class="hint">' + esc(r.err.hint) + "</div>" : "") + "</div>";
      if (r.err.line && this.lineEls[r.err.line - 1]) this.lineEls[r.err.line - 1].classList.add("l-err");
      this.outEl.textContent = "";
      this.range.max = 0;
      this.count.textContent = "";
      this.memEl.innerHTML = "";
      return r;
    }
    this.el.classList.remove("no-run");
    this.snaps = r.snaps || [];
    this.n = this.snaps.length;
    this.range.max = Math.max(0, this.n - 1);
    this.i = -1;
    this.go(opts.at !== undefined ? opts.at : 0);
    return r;
  };

  V.go = function (i) {
    if (!this.n) return;
    i = Math.max(0, Math.min(this.n - 1, i));
    var prevI = this.i;
    this.i = i;
    var s = this.snaps[i], p = i > 0 ? this.snaps[i - 1] : null;
    this.range.value = i;
    this.count.textContent = "Step " + (i + 1) + " of " + this.n + (this.res.snapLimit && i === this.n - 1 ? " (recording stopped here)" : "");
    // code lines
    var L = this.lineEls;
    for (var k = 0; k < L.length; k++) L[k].className = "ln";
    if (p && p.line && L[p.line - 1] && p.line !== s.line) L[p.line - 1].classList.add("l-prev");
    if (s.line && L[s.line - 1]) {
      L[s.line - 1].classList.add(s.kind === "error" ? "l-err" : s.kind === "end" ? "l-end" : "l-cur");
      var cb = this.codeBox, le = L[s.line - 1];
      var top = le.offsetTop, h = cb.clientHeight;
      if (top < cb.scrollTop + 20 || top > cb.scrollTop + h - 40) cb.scrollTop = Math.max(0, top - h / 3);
    }
    // output
    var out = this.res.out.slice(0, s.out);
    var prevOut = p ? p.out : 0;
    this.outEl.innerHTML = esc(out.slice(0, prevOut)) + (s.out > prevOut ? '<mark>' + esc(out.slice(prevOut)) + "</mark>" : "") + (s.kind === "error" ? "" : "");
    this.outEl.scrollTop = this.outEl.scrollHeight;
    // explanation
    this.say.innerHTML = this.describe(s, p);
    // memory
    if (!this.memEl.hidden) this.mv.render(s, p, this.res.structs);
    else this.mvStale = true;
    if (!this.callsEl.hidden) this.renderCalls();
    if (this.afterGo) this.afterGo();
    if (this.opts.onStep) this.opts.onStep(i, s);
    CL.activeViz = this;
    if (prevI === -1 && this.mvStale) this.mvStale = false;
  };

  V.togglePlay = function () {
    if (this.timer) return this.stop();
    var self = this;
    if (this.i >= this.n - 1) this.go(0);
    var btn = this.el.querySelector('[data-a="play"]');
    btn.textContent = "Pause";
    btn.classList.add("on");
    var tick = function () {
      if (self.i >= self.n - 1) return self.stop();
      self.go(self.i + 1);
      self.timer = setTimeout(tick, +self.el.querySelector(".viz-speed").value);
    };
    this.timer = setTimeout(tick, 60);
  };
  V.stop = function () {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    var btn = this.el.querySelector('[data-a="play"]');
    if (btn) { btn.textContent = "Play"; btn.classList.remove("on"); }
  };

  // ---- explanations
  V.objName = function (snap, id, path) {
    var h = null;
    for (var i = 0; i < snap.heap.length; i++) if (snap.heap[i].id === id) { h = snap.heap[i]; break; }
    if (!h) {
      var vname = null;
      snap.frames.concat([{ vars: snap.globals }]).forEach(function (f) { f.vars.forEach(function (v) { if (v.id === id) vname = v.name; }); });
      return vname ? "the variable " + vname + (path && path.length ? "[" + path.join("][") + "]" : "") : "an object";
    }
    var t = h.t, v = h.v;
    if (path && path.length) return "element [" + path.join("][") + "] of a new " + t;
    if (v && v.f && v.f.length && typeof v.f[0][1] === "string") return "the " + t + " holding " + v.f[0][1];
    return "a " + t;
  };
  V.pv = function (snap, v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (v.u) return "garbage";
    if ("str" in v) return JSON.stringify(v.str);
    if ("lit" in v) return JSON.stringify(v.lit);
    if ("p" in v) {
      if (v.p === 0) return "NULL";
      if (v.p === -1) return "&" + v.b;
      return "points to " + this.objName(snap, v.p, v.path) + (v.dead ? " (deleted!)" : "");
    }
    if (v.f) return "{" + v.f.map(function (f) { return f[0]; }).join(", ") + "}";
    if (v.a) return "array";
    return "";
  };
  // plain-text summary of the current step, for the tutor
  V.tutorContext = function () {
    if (!this.n) return "The program does not compile. " + (this.say ? this.say.textContent.trim() : "");
    var self = this, s = this.snaps[this.i], lines = [];
    lines.push("Step " + (this.i + 1) + " of " + this.n + (s.line ? ", line " + s.line + " is next to run" : "") + ".");
    lines.push("The visualizer's explanation: " + CL.textOf(this.say));
    s.frames.forEach(function (f) {
      lines.push("Stack frame " + f.fn + ": " + (f.vars.map(function (v) { return v.name + " = " + (v.ref ? "(reference)" : self.pv(s, v.v)); }).join(", ") || "(no variables yet)"));
    });
    var fields = new Map();
    this.flat(s).forEach(function (x) { if (x.heap) { if (!fields.has(x.heap.id)) fields.set(x.heap.id, []); fields.get(x.heap.id).push(x.name + " = " + x.text); } });
    s.heap.forEach(function (h) {
      var desc = (fields.get(h.id) || []).slice(0, 12).join(", ");
      if (!desc && h.v && typeof h.v === "object" && !h.v.f && !h.v.a) desc = "value = " + self.pv(s, h.v);
      lines.push("Heap object (" + h.t + (h.alive ? "" : ", deleted") + "): " + (desc || "(no value yet)"));
    });
    lines.push("Output so far: " + JSON.stringify(this.res.out.slice(0, s.out)));
    return lines.join("\n");
  };
  V.flat = function (snap) {
    var self = this, out = new Map();
    function add(owner, name, v) {
      if (v && typeof v === "object" && (v.f || v.a)) return;
      out.set(owner + "\u0000" + name, { name: name, v: v, text: self.pv(snap, v) });
    }
    snap.frames.forEach(function (f) { f.vars.forEach(function (v) { if (!v.ref) add("f" + f.id, v.name, v.v); }); });
    snap.globals.forEach(function (v) { add("g", v.name, v.v); });
    snap.heap.forEach(function (h) {
      if (h.v && h.v.f) h.v.f.forEach(function (f) { if (!(f[1] && typeof f[1] === "object" && (f[1].f || f[1].a))) out.set("h" + h.id + "\u0000" + f[0], { name: f[0], v: f[1], heap: h, text: self.pv(snap, f[1]) }); });
      if (h.v && h.v.f) h.v.f.forEach(function (f) {
        if (f[1] && f[1].a) f[1].a.forEach(function (x, i) { out.set("h" + h.id + "\u0000" + f[0] + "[" + i + "]", { name: f[0] + "[" + i + "]", v: x, heap: h, text: self.pv(snap, x) }); });
      });
      if (h.v && h.v.a) h.v.a.forEach(function (x, i) { out.set("h" + h.id + "\u0000[" + i + "]", { name: "[" + i + "]", v: x, heap: h, text: self.pv(snap, x) }); });
    });
    snap.frames.forEach(function (f) { f.vars.forEach(function (v) { if (v.v && v.v.a && !v.v.chars) v.v.a.forEach(function (x, i) { out.set("f" + f.id + "\u0000" + v.name + "[" + i + "]", { name: v.name + "[" + i + "]", v: x, text: self.pv(snap, x) }); }); }); });
    return out;
  };
  V.describe = function (s, p) {
    var self = this, parts = [];
    if (s.kind === "error") {
      return '<div class="say-err"><b>Error on line ' + s.line + ":</b> " + esc(s.msg) + (s.hint ? '<div class="hint">' + esc(s.hint) + "</div>" : "") + "</div>";
    }
    var head = "";
    if (s.kind === "call") {
      var top = s.frames[s.frames.length - 1];
      var args = top.vars.map(function (v) { return v.name + " = " + (v.ref ? "(reference)" : self.pv(s, v.v)); });
      head = "<b>Call " + esc(top.fn) + "</b>" + (args.length ? " with " + esc(args.join(", ")) : "") + ". A new frame for " + esc(top.fn) + " goes on the stack.";
    } else if (s.kind === "return") {
      head = "<b>" + esc(s.fn) + " is finished</b>" + (s.ret !== null && s.ret !== undefined ? " and returns <code>" + esc(s.ret) + "</code>" : "") + ". Its frame and its local variables are about to disappear.";
    } else if (s.kind === "end") {
      var leaks = s.heap.filter(function (h) { return h.alive; }).length;
      head = "<b>The program has finished.</b>" + (s.exit !== undefined ? " exit(" + s.exit + ") was called." : "") +
        (leaks ? " " + leaks + " object" + (leaks > 1 ? "s were" : " was") + " never deleted (a memory leak), so " + (leaks > 1 ? "they are" : "it is") + " still on the heap." : " Every object made with new was deleted.");
    } else {
      head = "Next to run: <b>line " + s.line + "</b>.";
    }
    if (p) {
      var a = this.flat(p), b = this.flat(s), changes = [];
      b.forEach(function (x, k) {
        var y = a.get(k);
        if (y && y.text !== x.text) changes.push((x.heap ? "<code>" + esc(x.heap.t) + "</code> field " : "") + "<code>" + esc(x.name) + "</code>: " + esc(y.text) + " → <b>" + esc(x.text) + "</b>");
      });
      var newVars = [];
      var prevIds = new Set();
      p.frames.forEach(function (f) { f.vars.forEach(function (v) { prevIds.add(f.id + ":" + v.name); }); });
      s.frames.forEach(function (f) {
        if (s.kind === "call" && f === s.frames[s.frames.length - 1]) return;
        f.vars.forEach(function (v) { if (!prevIds.has(f.id + ":" + v.name)) newVars.push("<code>" + esc(v.name) + "</code> = " + esc(v.ref ? "(reference)" : self.pv(s, v.v))); });
      });
      var ph = new Map(); p.heap.forEach(function (h) { ph.set(h.id, h); });
      s.heap.forEach(function (h) {
        var old = ph.get(h.id);
        if (!old) parts.push("<span class='say-new'>new</span> made a " + esc(h.t) + " on the heap.");
        else if (old.alive && !h.alive) parts.push("<span class='say-del'>delete</span> freed the " + esc(h.t) + ". Any pointer still holding its address is now dangling.");
      });
      p.heap.forEach(function (h) { if (h.alive && !s.heap.some(function (x) { return x.id === h.id; })) parts.push("<span class='say-del'>delete</span> freed the " + esc(h.t) + "."); });
      if (newVars.length) parts.push("New variable" + (newVars.length > 1 ? "s" : "") + ": " + newVars.join(", ") + ".");
      if (changes.length) parts.push("Changed: " + changes.slice(0, 5).join("; ") + (changes.length > 5 ? "; and " + (changes.length - 5) + " more" : "") + ".");
      if (s.out > p.out) parts.push("Printed: <code>" + esc(JSON.stringify(this.res.out.slice(p.out, s.out))).replace(/\\n/g, "↵") + "</code>");
      var lastLine = p.line;
      if (parts.length && lastLine && s.kind !== "call") parts.unshift("Line " + lastLine + " ran.");
    }
    return '<div class="say-head">' + head + "</div>" + (parts.length ? '<div class="say-body">' + parts.join(" ") + "</div>" : "");
  };

  // ---- call tree
  V.renderCalls = function () {
    var calls = this.res.calls || [], i = this.i;
    var started = calls.filter(function (c) { return c.s <= i; });
    if (!started.length) { this.callsEl.innerHTML = '<p class="muted">No function calls yet.</p>'; return; }
    var self = this;
    // functions that call themselves (directly or through others), worked out once for the whole run
    if (!this.recFns || this.recFor !== calls) {
      var all = new Map(), rec = new Set();
      calls.forEach(function (c) { all.set(c.id, c); });
      calls.forEach(function (c) {
        for (var p = all.get(c.parent); p; p = all.get(p.parent)) if (p.fn === c.fn) { rec.add(c.fn); break; }
      });
      this.recFns = rec;
      this.recFor = calls;
    }
    var recFns = this.recFns;
    var byId = new Map();
    started.forEach(function (c) { byId.set(c.id, { c: c, kids: [] }); });
    var roots = [];
    started.forEach(function (c) { var n = byId.get(c.id); var par = byId.get(c.parent); if (par) par.kids.push(n); else roots.push(n); });
    // optionally hide calls to helper functions that are not recursive and lead to no recursive call
    var canHide = recFns.size > 0, hidden = 0, hiddenNames = new Set();
    if (canHide && this.hideHelpers !== false) {
      var prune = function (n) {
        n.kids = n.kids.filter(function (k) {
          prune(k);
          var keep = recFns.has(k.c.fn) || k.kids.length > 0;
          if (!keep) { hidden++; hiddenNames.add(k.c.fn); (function cnt(x) { x.kids.forEach(function (y) { hidden++; cnt(y); }); })(k); }
          return keep;
        });
      };
      roots.forEach(prune);
    }
    // focus: the main call's most recent child subtree, plus counts of earlier ones
    var root = roots[roots.length - 1];
    var shown = root, note = "";
    if (root && root.c.fn === "main" && root.kids.length > 1) {
      var last = root.kids[root.kids.length - 1];
      note = "Showing main's latest call. Earlier calls from main: " + root.kids.slice(0, -1).map(function (k) { return k.c.fn + "(" + k.c.args + ")"; }).slice(-6).join(", ") + (root.kids.length > 7 ? " and more" : "") + ".";
      shown = { c: root.c, kids: [last] };
    }
    var count = 0;
    (function cnt(n) { count++; n.kids.forEach(cnt); })(shown);
    if (count > 160) { this.callsEl.innerHTML = '<p class="muted">This step involves ' + count + " calls, which is too many to draw clearly. Step back to an earlier point to see the tree as it grows.</p>"; return; }
    // layout: leaves take consecutive slots
    var slotW = 0, nodes = [], maxDepth = 0;
    function label(n) {
      var c = n.c;
      var done = c.e >= 0 && c.e <= i;
      return c.fn + "(" + c.args + ")" + (done && c.ret !== null ? " → " + c.ret : "");
    }
    (function measure(n) { slotW = Math.max(slotW, label(n).length * 7.2 + 22); n.kids.forEach(measure); })(shown);
    slotW = Math.min(Math.max(slotW, 70), 220);
    var nextSlot = 0;
    function place(n, d) {
      maxDepth = Math.max(maxDepth, d);
      n.d = d;
      if (!n.kids.length) { n.x = nextSlot++ * (slotW + 12); }
      else { n.kids.forEach(function (k) { place(k, d + 1); }); n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2; }
      nodes.push(n);
    }
    place(shown, 0);
    var W = nextSlot * (slotW + 12) + 10, H = (maxDepth + 1) * 64 + 10;
    var svg = '<svg class="ct" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">';
    nodes.forEach(function (n) {
      n.kids.forEach(function (k) {
        svg += '<line class="ct-e" x1="' + (n.x + slotW / 2 + 5) + '" y1="' + (n.d * 64 + 36) + '" x2="' + (k.x + slotW / 2 + 5) + '" y2="' + (k.d * 64 + 8) + '"/>';
      });
    });
    nodes.forEach(function (n) {
      var c = n.c, done = c.e >= 0 && c.e <= i, active = !done;
      var cls = "ct-n" + (done ? " done" : "") + (active ? " active" : "");
      svg += '<g class="' + cls + '"><rect x="' + (n.x + 5) + '" y="' + (n.d * 64 + 8) + '" width="' + slotW + '" height="28" rx="6"/><text x="' + (n.x + 5 + slotW / 2) + '" y="' + (n.d * 64 + 26) + '">' + esc(label(n)) + "</text></g>";
    });
    svg += "</svg>";
    var toggle = canHide ? '<label class="ct-opt"><input type="checkbox" class="ct-hide"' + (this.hideHelpers !== false ? " checked" : "") + "> Only recursive calls</label>" : "";
    var hideNote = hidden ? (note ? " " : "") + "Hiding " + hidden + " call" + (hidden > 1 ? "s" : "") + " to helper functions (" + Array.from(hiddenNames).slice(0, 4).join(", ") + (hiddenNames.size > 4 ? ", …" : "") + ")." : "";
    this.callsEl.innerHTML = '<div class="ct-legend"><span class="ct-key active"></span> still running <span class="ct-key done"></span> finished (→ returned value)' + toggle + "</div>" + (note || hideNote ? '<p class="muted small">' + esc(note + hideNote) + "</p>" : "") + '<div class="ct-wrap">' + svg + "</div>";
    var cb = this.callsEl.querySelector(".ct-hide");
    if (cb) cb.addEventListener("change", function () { self.hideHelpers = cb.checked; self.renderCalls(); });
  };

  V.destroy = function () { this.stop(); this.mv.destroy(); if (CL.activeViz === this) CL.activeViz = null; };
  CL.Visualizer = Visualizer;
})(CL);
