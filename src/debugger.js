/* COMP 2611 Code Lab — debugger tools for the step-by-step visualizer: breakpoints, step over / into / out, continue,
   the call stack, recent lines, an inspector with each variable's history and each object's lifetime and references,
   and leak detection at every step. Everything is computed from the recorded run, so it can also step backwards. */
(function (CL) {
  "use strict";
  var V = CL.Visualizer.prototype, esc = CL.esc;

  function depth(s) { return s ? s.frames.length : 0; }
  function topId(s) { var f = s && s.frames[s.frames.length - 1]; return f ? f.id : null; }
  // every pointer inside a value: plain pointers, struct fields and array elements
  function pointers(v, path, out) {
    if (!v || typeof v !== "object") return out;
    if ("p" in v && v.p > 0) out.push({ id: v.p, path: path, dead: !!v.dead });
    if (v.f) v.f.forEach(function (f) { pointers(f[1], path.concat([f[0]]), out); });
    if (v.a) v.a.forEach(function (x, i) { pointers(x, path.concat(["[" + i + "]"]), out); });
    return out;
  }
  function pathText(base, path) { return path.reduce(function (a, p) { return p.charAt(0) === "[" ? a + p : a + "." + p; }, base); }
  // what can still be reached from the stack and the globals; anything else that is alive has leaked
  V.reach = function (s) {
    var seen = {}, byId = {}, q = [];
    s.heap.forEach(function (h) { byId[h.id] = h; });
    function root(v) { pointers(v, [], []).forEach(function (p) { q.push(p.id); }); }
    s.frames.forEach(function (f) { f.vars.forEach(function (v) { root(v.v); if (v.ref && v.ref.p) q.push(v.ref.p); }); });
    s.globals.forEach(function (v) { root(v.v); });
    while (q.length) {
      var id = q.pop();
      if (seen[id]) continue;
      seen[id] = 1;
      var h = byId[id];
      if (h) pointers(h.v, [], []).forEach(function (p) { if (!seen[p.id]) q.push(p.id); });
    }
    return { seen: seen, leaked: s.heap.filter(function (h) { return h.alive && !seen[h.id]; }) };
  };
  // the names that point at object id right now
  V.referrers = function (s, id) {
    var out = [], self = this;
    s.frames.forEach(function (f) {
      f.vars.forEach(function (v) {
        pointers(v.v, [], []).forEach(function (p) { if (p.id === id) out.push(pathText(v.name, p.path) + " (in " + f.fn + ")"); });
        if (v.ref && v.ref.p === id) out.push(v.name + " (a reference, in " + f.fn + ")");
      });
    });
    s.globals.forEach(function (v) { pointers(v.v, [], []).forEach(function (p) { if (p.id === id) out.push(pathText(v.name, p.path) + " (global)"); }); });
    s.heap.forEach(function (h) {
      pointers(h.v, [], []).forEach(function (p) { if (p.id === id) out.push("a field of " + self.objName(s, h.id, []) + " (" + (p.path.join(".").replace(/\.\[/g, "[") || "value") + ")"); });
    });
    return out;
  };

  CL.vizInit = function (viz) {
    if (viz.opts.compact) return;
    var el = viz.el, ctl = el.querySelector(".viz-ctl");
    viz.bps = {};
    var dbg = document.createElement("div");
    dbg.className = "viz-dbg";
    dbg.setAttribute("role", "group");
    dbg.setAttribute("aria-label", "Debugger");
    dbg.innerHTML = '<button type="button" class="btn small" data-d="over" title="Step over (F10): run this line, including any function it calls, and stop at the next line here">Step over</button>' +
      '<button type="button" class="btn small" data-d="into" title="Step into (F11): go inside the function this line calls">Step into</button>' +
      '<button type="button" class="btn small" data-d="out" title="Step out (Shift+F11): finish this function and stop where it returns">Step out</button>' +
      '<button type="button" class="btn small" data-d="cont" title="Continue (F8): run to the next breakpoint, error or the end">Continue ▶▶</button>' +
      '<button type="button" class="btn small" data-d="back" title="Run backwards to the previous breakpoint">◀◀ Back</button>' +
      '<button type="button" class="btn small ghost" data-d="bp" title="Breakpoint on the current line (F9). You can also click a line number.">● Breakpoint</button>';
    ctl.parentNode.insertBefore(dbg, ctl.nextSibling);
    var info = document.createElement("div");
    info.className = "viz-dinfo";
    dbg.parentNode.insertBefore(info, dbg.nextSibling);
    viz.dinfo = info;
    var insp = document.createElement("div");
    insp.className = "viz-insp";
    insp.hidden = true;
    insp.setAttribute("aria-live", "polite");
    el.insertBefore(insp, el.querySelector(".viz-mem"));
    viz.insp = insp;
    viz.inspTarget = null;
    dbg.addEventListener("click", function (e) { var b = e.target.closest("[data-d]"); if (b) viz.debugAct(b.getAttribute("data-d")); });
    info.addEventListener("click", function (e) {
      var j = e.target.closest("[data-go]"), fr = e.target.closest("[data-fline]");
      if (j) { viz.stop(); viz.go(+j.getAttribute("data-go")); }
      if (fr) viz.showFrameLine(+fr.getAttribute("data-fline"));
    });
    el.querySelector(".viz-code").addEventListener("click", function (e) {
      var ln = e.target.closest(".ln");
      if (!ln || !viz.lineEls) return;
      var r = ln.getBoundingClientRect();
      if (e.clientX - r.left > 64) return;
      var idx = Array.prototype.indexOf.call(viz.lineEls, ln);
      if (idx >= 0) viz.toggleBp(idx + 1);
    });
    viz.memEl.addEventListener("click", function (e) {
      var o = e.target.closest(".mv-obj"), v = e.target.closest(".mv-var");
      if (o && o.hasAttribute("data-oid")) { viz.inspect({ obj: +o.getAttribute("data-oid") }); return; }
      if (v) {
        var fr = v.closest(".mv-frame"), name = v.querySelector(".mv-name");
        viz.inspect({ fid: fr && fr.hasAttribute("data-fid") ? +fr.getAttribute("data-fid") : "g", name: name ? name.textContent : "", vid: v.hasAttribute("data-tgt") ? +v.getAttribute("data-tgt").split(":")[0] : null });
      }
    });
    insp.addEventListener("click", function (e) {
      var j = e.target.closest("[data-go]");
      if (j) { viz.stop(); viz.go(+j.getAttribute("data-go")); return; }
      if (e.target.closest("[data-close]")) { insp.hidden = true; viz.inspTarget = null; }
    });
    el.addEventListener("keydown", function (e) {
      if (e.target.closest("input[type=text], textarea, select")) return;
      var k = e.key;
      if (k === "F10") { e.preventDefault(); viz.debugAct("over"); }
      else if (k === "F11") { e.preventDefault(); viz.debugAct(e.shiftKey ? "out" : "into"); }
      else if (k === "F8") { e.preventDefault(); viz.debugAct("cont"); }
      else if (k === "F9") { e.preventDefault(); viz.debugAct("bp"); }
    });
  };

  V.debugAct = function (a) {
    if (!this.n) return;
    this.stop();
    var i = this.i, s = this.snaps[i], n = this.n, j, d = depth(s);
    if (a === "bp") { if (s.line) this.toggleBp(s.line); return; }
    if (a === "into") j = i + 1;
    else if (a === "over") { for (j = i + 1; j < n && depth(this.snaps[j]) > d; j++); }
    else if (a === "out") {
      var fid = topId(s);
      for (j = i + 1; j < n; j++) { var t = this.snaps[j]; if ((t.kind === "return" && topId(t) === fid) || depth(t) < d || t.kind === "error") break; }
      if (s.kind === "return") { for (j = i + 1; j < n && depth(this.snaps[j]) >= d; j++); }
    } else if (a === "cont" || a === "back") {
      var dir = a === "cont" ? 1 : -1, line = s.line, bp = this.bps;
      j = i + dir;
      while (j >= 0 && j < n && this.snaps[j].line === line && this.snaps[j].kind === "step") j += dir;
      for (; j >= 0 && j < n; j += dir) { var u = this.snaps[j]; if ((u.kind === "step" && bp[u.line]) || u.kind === "error") break; }
      if (!Object.keys(bp).length && this.dinfo) this.flash("No breakpoints yet: click a line number to add one. " + (dir > 0 ? "Running to the end." : "Going back to the start."));
    }
    var from = i;
    this.go(Math.max(0, Math.min(n - 1, j)));
    if (a !== "into" && this.i - from > 1) this.jumpFrom = from; else this.jumpFrom = null;
    this.drawDebug();
  };
  V.flash = function (msg) { this.flashMsg = msg; };
  V.toggleBp = function (line) {
    if (this.bps[line]) delete this.bps[line]; else this.bps[line] = 1;
    this.markBps();
    this.drawDebug();
  };
  V.markBps = function () {
    var L = this.lineEls || [], bp = this.bps || {};
    for (var k = 0; k < L.length; k++) L[k].classList.toggle("bp", !!bp[k + 1]);
  };
  V.showFrameLine = function (line) {
    var L = this.lineEls;
    for (var k = 0; k < L.length; k++) L[k].classList.remove("l-frame");
    if (L[line - 1]) { L[line - 1].classList.add("l-frame"); var cb = this.codeBox, top = L[line - 1].offsetTop; if (top < cb.scrollTop || top > cb.scrollTop + cb.clientHeight - 30) cb.scrollTop = Math.max(0, top - cb.clientHeight / 3); }
  };
  V.afterLoad = function () {
    if (!this.bps) return;
    // keep breakpoints that still fit the program
    var n = this.lineEls ? this.lineEls.length : 0, bp = this.bps;
    Object.keys(bp).forEach(function (l) { if (+l > n) delete bp[l]; });
    this.markBps();
    this.inspTarget = null;
    if (this.insp) this.insp.hidden = true;
  };
  V.afterGo = function () {
    if (!this.bps) return;
    this.markBps();
    this.drawDebug();
    this.markLeaks();
    if (this.inspTarget) this.inspect(this.inspTarget, true);
  };
  V.markLeaks = function () {
    var s = this.snaps[this.i], r = this.reach(s);
    this.leakNow = r.leaked;
    if (this.memEl.hidden) return;
    r.leaked.forEach(function (h) {
      var o = this.memEl.querySelector('.mv-obj[data-oid="' + h.id + '"]');
      if (o && !o.classList.contains("leak")) { o.classList.add("leak"); o.insertAdjacentHTML("beforeend", '<span class="mv-badge leak">leaked: nothing points here</span>'); }
    }, this);
  };
  V.drawDebug = function () {
    if (!this.dinfo || !this.n) { if (this.dinfo) this.dinfo.innerHTML = ""; return; }
    var s = this.snaps[this.i], self = this, html = "";
    // the call stack, innermost first
    var fr = s.frames.slice().reverse();
    html += '<div class="vd-row"><span class="vd-k">Call stack</span><span class="vd-stack">' + fr.map(function (f, k) {
      return '<button type="button" class="vd-fr' + (k === 0 ? " on" : "") + '" data-fline="' + f.line + '" title="Show line ' + f.line + ' in the code">' + esc(f.fn) + " <span>line " + f.line + "</span></button>";
    }).join('<span class="vd-arr" aria-hidden="true">←</span>') + "</span></div>";
    // recent lines
    var from = Math.max(0, this.i - 9), lines = [];
    for (var j = from; j <= this.i; j++) lines.push(j);
    html += '<div class="vd-row"><span class="vd-k">Lines run</span><span class="vd-hist">' + (from > 0 ? "… " : "") + lines.map(function (j) {
      var t = self.snaps[j];
      return '<button type="button" class="vd-ln' + (j === self.i ? " on" : "") + (t.kind === "call" ? " call" : t.kind === "return" ? " ret" : "") + '" data-go="' + j + '" title="Step ' + (j + 1) + (t.kind === "call" ? ": call" : t.kind === "return" ? ": return" : "") + '">' + (t.line || "·") + "</button>";
    }).join("") + "</span></div>";
    var nb = Object.keys(this.bps).length;
    html += '<div class="vd-row small muted">' + (nb ? "Breakpoints on line" + (nb > 1 ? "s " : " ") + Object.keys(this.bps).sort(function (a, b) { return a - b; }).join(", ") + "." : "Click a line number to set a breakpoint, then Continue runs to it.") +
      (this.leakNow && this.leakNow.length ? ' <b class="vd-leak">' + this.leakNow.length + " object" + (this.leakNow.length > 1 ? "s have" : " has") + " leaked</b> (alive, but nothing points to " + (this.leakNow.length > 1 ? "them" : "it") + ")." : "") + "</div>";
    if (this.jumpFrom !== null && this.jumpFrom !== undefined && this.snaps[this.jumpFrom]) {
      var ch = this.diff(this.snaps[this.jumpFrom], s);
      html += '<div class="vd-row vd-diff"><span class="vd-k">Since step ' + (this.jumpFrom + 1) + "</span><span>" + (ch.length ? ch.slice(0, 8).map(esc).join("; ") + (ch.length > 8 ? "; and " + (ch.length - 8) + " more" : "") : "no variable changed") + "</span></div>";
    }
    if (this.flashMsg) { html += '<div class="vd-row small vd-flash">' + esc(this.flashMsg) + "</div>"; this.flashMsg = null; }
    this.dinfo.innerHTML = html;
  };
  // what changed between two steps, as short sentences
  V.diff = function (a, b) {
    var A = this.flat(a), B = this.flat(b), out = [];
    B.forEach(function (x, k) {
      var y = A.get(k);
      if (!y) { if (!x.heap) out.push(x.name + " = " + x.text + " (new)"); return; }
      if (y.text !== x.text) out.push(x.name + ": " + (y.text || "?") + " → " + (x.text || "?"));
    });
    var ah = {}, bh = {};
    a.heap.forEach(function (h) { if (h.alive) ah[h.id] = 1; });
    b.heap.forEach(function (h) { if (h.alive) bh[h.id] = 1; });
    var made = Object.keys(bh).filter(function (k) { return !ah[k]; }).length, freed = Object.keys(ah).filter(function (k) { return !bh[k]; }).length;
    if (made) out.unshift(made + " object" + (made > 1 ? "s" : "") + " made with new");
    if (freed) out.unshift(freed + " object" + (freed > 1 ? "s" : "") + " deleted");
    return out;
  };

  // ---------------------------------------------------------------- the inspector
  V.findVar = function (s, t) {
    var hit = null;
    var lists = s.frames.map(function (f) { return { f: f, vars: f.vars }; }).concat([{ f: { fn: "(globals)", id: "g" }, vars: s.globals }]);
    lists.forEach(function (L) {
      L.vars.forEach(function (v) {
        if (hit) return;
        if (t.vid && v.id === t.vid) hit = { v: v, f: L.f };
        else if (!t.vid && L.f.id === t.fid && v.name === t.name) hit = { v: v, f: L.f };
      });
    });
    return hit;
  };
  V.inspect = function (t, quiet) {
    var s = this.snaps[this.i], self = this, html = "";
    this.inspTarget = t;
    if (t.obj) {
      var h = null;
      s.heap.forEach(function (x) { if (x.id === t.obj) h = x; });
      if (!h) { html = '<p class="small muted">That object no longer exists at this step (it was deleted and nothing points to it).</p>'; }
      else {
        var refs = this.referrers(s, h.id), leaked = h.alive && !this.reach(s).seen[h.id];
        html = '<h3>' + esc(this.objName(s, h.id, []).replace(/^an? /, "").replace(/^the /, "")) + " <span class=\"chip\">" + esc(h.t) + "</span></h3>" +
          "<dl>" +
          "<dt>Address</dt><dd>" + CL.fakeAddr(h.id) + ' <span class="muted small">(made up for display; real addresses change every run)</span></dd>' +
          "<dt>Made</dt><dd>with <code>new" + (h.arr ? " []" : "") + "</code> on line " + h.line + ' <button type="button" class="linkbtn" data-go="' + this.firstStepWith(h.id) + '">go there</button></dd>' +
          "<dt>Lifetime</dt><dd>" + (h.alive ? (leaked ? '<b class="vd-leak">Leaked.</b> It is still allocated, but no pointer reaches it any more, so the program can never delete it.' : "Still allocated. It lives until something deletes it; leaving a function does not free it.") :
            '<b class="vd-bad">Deleted on line ' + h.fl + ".</b> Any pointer that still holds its address is <i>dangling</i>: using it is undefined behaviour.") + "</dd>" +
          "<dt>Pointed to by</dt><dd>" + (refs.length ? refs.map(esc).join("<br>") : "nothing") + "</dd>" +
          (h.v && h.v.f ? "<dt>Fields</dt><dd>" + h.v.f.map(function (f) { return "<code>" + esc(f[0]) + "</code> = " + esc(self.pv(s, f[1]) || self.valText(f[1])); }).join("<br>") + "</dd>" : "") +
          "</dl>";
      }
    } else {
      var hit = this.findVar(s, t);
      if (!hit) html = '<p class="small muted">' + esc(t.name) + " does not exist at this step (its function has returned, or it has not been declared yet).</p>";
      else {
        var v = hit.v, val = v.ref ? "a reference to " + this.objName(s, v.ref.p, v.ref.path) : (this.pv(s, v.v) || this.valText(v.v));
        var note = "";
        if (v.v && typeof v.v === "object" && "p" in v.v) {
          if (v.v.p === 0) note = "This pointer is <b>NULL</b>: it points at nothing. Following it (<code>*" + esc(v.name) + "</code> or <code>" + esc(v.name) + "-&gt;</code>) is an error.";
          else if (v.v.dead) note = '<b class="vd-bad">Dangling pointer.</b> It still holds the address of memory that was deleted, so using it is undefined behaviour. After <code>delete ' + esc(v.name) + ";</code> it is good practice to write <code>" + esc(v.name) + " = NULL;</code>.";
          else if (v.v.p > 0) note = "Following it reaches " + esc(this.objName(s, v.v.p, v.v.path)) + ".";
        } else if (v.v && typeof v.v === "object" && v.v.u) note = "It has no value yet (garbage): reading it before giving it a value is an error.";
        html = "<h3><code>" + esc(v.name) + '</code> <span class="chip">' + esc(v.t) + "</span> <span class=\"muted small\">in " + esc(hit.f.fn) + "</span></h3>" +
          "<dl><dt>Now</dt><dd>" + esc(val) + "</dd>" + (note ? "<dt>Note</dt><dd>" + note + "</dd>" : "") + "</dl>" + this.history(t);
      }
    }
    this.insp.innerHTML = '<div class="vi-h"><b>Inspector</b> <span class="small muted">step ' + (this.i + 1) + '</span><button type="button" class="btn small ghost" data-close aria-label="Close the inspector">×</button></div>' + html;
    this.insp.hidden = false;
  };
  V.valText = function (v) {
    if (!v || typeof v !== "object") return String(v);
    if ("str" in v) return JSON.stringify(v.str);
    if (v.a) return "[" + v.a.slice(0, 12).map(this.valText, this).join(", ") + (v.a.length > 12 ? ", …" : "") + "]";
    if (v.f) return "{" + v.f.map(function (f) { return f[0] + ": " + this.valText(f[1]); }, this).join(", ") + "}";
    if ("v" in v) return String(v.v);
    if ("t" in v) return String(v.t);
    return JSON.stringify(v).slice(0, 40);
  };
  V.firstStepWith = function (id) {
    for (var j = 0; j < this.n; j++) if (this.snaps[j].heap.some(function (h) { return h.id === id; })) return Math.max(0, j - 1);
    return this.i;
  };
  // every change of one variable over the whole run
  V.history = function (t) {
    var self = this, rows = [], last = null, seen = false;
    for (var j = 0; j < this.n; j++) {
      var s = this.snaps[j], hit = this.findVar(s, t);
      if (!hit) { if (seen && last !== null) { rows.push({ j: j, text: "(gone: its function returned)", line: s.line }); last = null; } continue; }
      seen = true;
      var v = hit.v, txt = v.ref ? "reference to " + this.objName(s, v.ref.p, v.ref.path) : (this.pv(s, v.v) || this.valText(v.v));
      if (txt !== last) { rows.push({ j: j, text: txt, line: this.snaps[Math.max(0, j - 1)].line }); last = txt; }
      if (rows.length > 60) break;
    }
    if (!rows.length) return "";
    return '<div class="vi-hist"><b>History</b> <span class="small muted">(every change in the whole run; click to jump)</span><ol>' + rows.map(function (r) {
      return '<li' + (r.j <= self.i && (rows.filter(function (x) { return x.j <= self.i; }).slice(-1)[0] === r) ? ' class="on"' : "") + '><button type="button" class="linkbtn" data-go="' + r.j + '">step ' + (r.j + 1) + "</button>" + (r.line ? ' <span class="muted">after line ' + r.line + "</span>" : "") + ": " + esc(r.text) + "</li>";
    }).join("") + "</ol></div>";
  };
})(CL);
