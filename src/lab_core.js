/* COMP 2611 Code Lab — shared pieces for the algorithm labs: the step player, tree layout and drawing, small diagrams. */
(function (CL) {
  "use strict";
  var esc = CL.esc;
  CL.Labs = CL.Labs || {};
  CL.Diagrams = CL.Diagrams || {};

  CL.parseNums = function (s, max) {
    var out = String(s || "").split(/[\s,;]+/).filter(Boolean).map(Number).filter(function (x) { return isFinite(x) && Math.abs(x) < 1e9; }).map(Math.trunc);
    return max ? out.slice(0, max) : out;
  };

  // a labelled group of controls
  CL.opGroup = function (label, html) {
    var g = document.createElement("div");
    g.className = "grp";
    g.innerHTML = "<span>" + esc(label) + "</span><div class='btns'>" + html + "</div>";
    return g;
  };

  // ---------------------------------------------------------------- step player
  function Player(host, opts) {
    this.opts = opts || {};
    var el = this.el = document.createElement("div");
    el.className = "lab-split";
    el.innerHTML = '<div class="player"><div class="pmode" hidden><div class="seg" role="group" aria-label="Lab mode"><button type="button" data-m="watch">Watch</button><button type="button" data-m="you">Your turn</button></div><span class="pscore"></span></div>' +
      '<div class="stage" tabindex="0" aria-label="Drawing"></div><div class="player-say" aria-live="polite"></div><div class="player-tutor tutor-only"></div>' +
      '<div class="viz-ctl"><button type="button" class="btn icon" data-a="first" aria-label="Go to the start">⏮</button><button type="button" class="btn icon" data-a="prev" aria-label="Step back">◀</button>' +
      '<button type="button" class="btn primary" data-a="next">Next ▶</button><button type="button" class="btn icon" data-a="last" aria-label="Go to the end">⏭</button><button type="button" class="btn" data-a="play">Play</button>' +
      '<select class="viz-speed" aria-label="Playback speed"><option value="1100">Slow</option><option value="600" selected>Normal</option><option value="220">Fast</option></select></div>' +
      '<div class="viz-range"><input type="range" min="0" max="0" value="0" aria-label="Step"><span class="viz-count"></span></div></div>' +
      '<div class="player-side"><div class="player-code-h"></div><div class="player-code"></div><div class="player-extra"></div></div>';
    host.appendChild(el);
    this.stage = el.querySelector(".stage");
    this.say = el.querySelector(".player-say");
    this.codeH = el.querySelector(".player-code-h");
    this.codeEl = el.querySelector(".player-code");
    this.extra = el.querySelector(".player-extra");
    this.range = el.querySelector("input[type=range]");
    this.count = el.querySelector(".viz-count");
    this.frames = [];
    this.i = 0;
    this.ans = {};
    CL.lastPlayer = this;
    this.modeEl = el.querySelector(".pmode");
    this.scoreEl = el.querySelector(".pscore");
    try { this.mode = localStorage.getItem("comp2611-labmode") === "you" ? "you" : "watch"; } catch (e) { this.mode = "watch"; }
    var self = this;
    this.modeEl.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-m]");
      if (!b) return;
      self.setMode(b.getAttribute("data-m"));
    });
    el.querySelector(".player-say").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-ans], button[data-show]");
      if (!b) return;
      if (b.hasAttribute("data-show")) self.answer(-1);
      else self.answer(+b.getAttribute("data-ans"));
    });
    if (CL.Tutor) {
      el.querySelector(".player-tutor").appendChild(CL.Tutor.button("Ask the tutor about this step", function () {
        CL.Tutor.ask("Explain this step of the lab.", { content: "I'm in the lab, looking at this step.\n\n" + self.tutorContext() + "\n\nExplain what happens at this step and why the algorithm does it here. Then tell me what will happen next." });
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
      if (a === "last") self.go(self.frames.length - 1);
    });
    this.range.addEventListener("input", function () { self.stop(); self.go(+self.range.value); });
    el.addEventListener("keydown", function (e) {
      if (e.target.closest("input[type=text], textarea, select")) return;
      if (self.pending() && /^[1-6]$/.test(e.key)) { e.preventDefault(); self.answer(+e.key - 1); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); self.stop(); if (!self.pending()) self.go(self.i + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); self.stop(); self.go(self.i - 1); }
    });
  }
  Player.prototype.setCode = function (title, code) {
    this.codeH.textContent = title || "";
    this.code = code;
    this.codeEl.innerHTML = "";
    if (code) {
      this.pre = CL.codeBlock(code);
      this.codeEl.appendChild(this.pre);
      this.lineEls = this.pre.querySelectorAll(".ln");
    } else { this.pre = null; this.lineEls = []; }
  };
  Player.prototype.load = function (frames, at) {
    this.stop();
    this.frames = frames && frames.length ? frames : [{ text: "Nothing to show." }];
    this.ans = {};
    this.asks = this.frames.filter(function (f) { return f.ask; }).length;
    this.modeEl.hidden = !this.asks && !this.lab;
    this.range.max = this.frames.length - 1;
    this.drawMode();
    this.go(at === undefined ? 0 : at === "last" ? this.frames.length - 1 : at);
  };
  // "Your turn": frames may carry ask = {q, options, answer, view, line}; the student predicts before the step is shown
  Player.prototype.setMode = function (m) {
    this.mode = m === "you" ? "you" : "watch";
    try { localStorage.setItem("comp2611-labmode", this.mode); } catch (e) { /* ignore */ }
    this.stop();
    this.drawMode();
    if (this.mode === "you") {
      // jump back to the first unanswered question at or before here
      for (var k = 0; k <= this.i; k++) if (this.frames[k].ask && !this.ans[k]) { this.go(k); return; }
    }
    this.go(this.i);
  };
  Player.prototype.pending = function () {
    var f = this.frames[this.i];
    return this.mode === "you" && f && f.ask && !this.ans[this.i];
  };
  Player.prototype.drawMode = function () {
    var self = this;
    this.modeEl.querySelectorAll("[data-m]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-m") === self.mode); });
    var vals = Object.keys(this.ans).map(function (k) { return self.ans[k]; });
    var right = vals.filter(function (a) { return a.ok; }).length;
    this.scoreEl.innerHTML = this.mode !== "you" ? "Switch to <b>Your turn</b> to predict each step yourself." :
      !this.asks ? "No questions in this run. Choose an operation above, then predict each step." :
      vals.length ? "Your predictions: <b>" + right + "</b> right of " + vals.length + (vals.length < this.asks ? " · " + (this.asks - vals.length) + " to go" : " · all done") :
      "Predict each step before it happens. " + this.asks + " question" + (this.asks === 1 ? "" : "s") + " in this run.";
  };
  // c = index of the chosen option, or -1 for "Show me"
  Player.prototype.answer = function (c) {
    var f = this.frames[this.i];
    if (!this.pending() || (c >= 0 && !f.ask.options[c])) return;
    var ok = c === f.ask.answer;
    this.ans[this.i] = { c: c, ok: ok, skipped: c < 0 };
    if (CL.onPractice) { try { CL.onPractice(ok, this.lab || "", c < 0); } catch (e) { /* ignore */ } }
    this.drawMode();
    this.go(this.i);
    var fb = this.say.querySelector(".ask-fb");
    if (fb && fb.focus) fb.focus({ preventScroll: true });
  };
  Player.prototype.go = function (i) {
    i = Math.max(0, Math.min(this.frames.length - 1, i));
    // in Your turn mode, moving forward stops at the first question not yet answered
    if (this.mode === "you" && i > this.i) {
      for (var u = this.i; u < i; u++) if (this.frames[u].ask && !this.ans[u]) { i = u; break; }
    }
    this.i = i;
    var f = this.frames[i];
    this.range.value = i;
    this.count.textContent = "Step " + (i + 1) + " of " + this.frames.length;
    var ask = this.mode === "you" && f.ask ? f.ask : null, pend = ask && !this.ans[i];
    var nextBtn = this.el.querySelector('[data-a="next"]');
    if (nextBtn) nextBtn.disabled = !!pend;
    if (pend) {
      this.say.innerHTML = '<div class="ask"><div class="ask-q"><span class="ask-k">Your turn</span>' + ask.q + '</div><div class="ask-opts' + (ask.wide ? " wide" : "") + '">' +
        ask.options.map(function (o, k) { return '<button type="button" class="ask-opt" data-ans="' + k + '"><span class="mk">' + (k + 1) + "</span><span>" + o + "</span></button>"; }).join("") +
        '</div><div class="ask-foot"><span class="small muted">Pick an answer (or press 1–' + ask.options.length + ').</span><button type="button" class="btn small ghost" data-show="1">Show me</button></div></div>';
    } else if (ask && this.ans[i]) {
      var a = this.ans[i], right = ask.options[ask.answer];
      this.say.innerHTML = '<div class="ask-fb ' + (a.ok ? "ok" : a.skipped ? "skip" : "bad") + '" tabindex="-1">' + (a.ok ? "<b>✓ Right.</b> " + right : a.skipped ? "<b>Answer:</b> " + right : "<b>✗ Not quite.</b> The answer is " + right + ". You chose " + ask.options[a.c] + ".") + "</div>" + (f.text || "");
      if (!a.ok && CL.Tutor) {
        var self1 = this, chosen = a.c >= 0 ? CL.textOf(this.say.querySelector(".ask-fb")) : "";
        var tb = CL.Tutor.button(a.skipped ? "Ask the tutor how to work this out" : "Why? Ask the tutor", function () {
          var div = document.createElement("div");
          div.innerHTML = ask.q;
          CL.Tutor.ask(a.skipped ? "How do I work this step out?" : "Why was my prediction wrong?", { content: "I'm practising in the lab in Your turn mode, where I predict each step before it happens.\n\n" + self1.tutorContext() + "\n\nThe question was: " + CL.textOf(div) + "\nThe options were: " + ask.options.map(function (o, k) { var d = document.createElement("div"); d.innerHTML = o; return (k + 1) + ") " + CL.textOf(d); }).join("; ") + "\n" + (a.skipped ? "I didn't know, so I pressed Show me." : chosen) + "\n\nExplain how to work out the right answer from the rule the algorithm follows" + (a.skipped ? "" : ", and where my thinking probably went wrong") + ". Keep it short." });
        }, "ask-why");
        this.say.querySelector(".ask-fb").appendChild(tb);
      }
    } else this.say.innerHTML = f.text || "";
    var shown = pend && ask.view ? Object.assign({}, f, ask.view) : f;
    if (this.lineEls) {
      var ls = this.lineEls;
      for (var k = 0; k < ls.length; k++) ls[k].classList.remove("l-cur");
      var lines = pend ? (ask.line !== undefined ? (ask.line ? [ask.line] : []) : (i > 0 && this.frames[i - 1].line ? [this.frames[i - 1].line] : [])) : (f.lines || (f.line ? [f.line] : []));
      lines.forEach(function (n) { if (ls[n - 1]) ls[n - 1].classList.add("l-cur"); });
      if (lines.length && ls[lines[0] - 1]) {
        var box = this.codeEl, le = ls[lines[0] - 1];
        if (box.scrollHeight > box.clientHeight) {
          var top = le.offsetTop;
          if (top < box.scrollTop + 10 || top > box.scrollTop + box.clientHeight - 30) box.scrollTop = Math.max(0, top - box.clientHeight / 3);
        }
      }
    }
    if (this.opts.render) this.opts.render(shown, i, this);
  };
  // plain-text summary for the tutor
  Player.prototype.tutorContext = function () {
    function txt(el) { return CL.textOf(el); }
    var s = "Algorithm shown: " + (this.codeH.textContent || "(none)") + "\n";
    if (this.code) s += "Its code:\n" + CL.numbered(this.code) + "\n";
    var f = this.frames[this.i] || {};
    var lines = f.lines || (f.line ? [f.line] : []);
    s += "Step " + (this.i + 1) + " of " + this.frames.length + (lines.length ? " (code line " + lines.join(", ") + ")" : "") + ": " + txt(this.say) + "\n";
    var data = txt(this.extra);
    if (data) s += "Also on screen: " + data + "\n";
    if (this.opts.describe) { try { s += this.opts.describe(f) + "\n"; } catch (e) { /* ignore */ } }
    return s;
  };
  Player.prototype.togglePlay = function () {
    if (this.timer) return this.stop();
    var self = this, btn = this.el.querySelector('[data-a="play"]');
    if (this.i >= this.frames.length - 1) this.go(0);
    btn.textContent = "Pause";
    btn.classList.add("on");
    var tick = function () {
      if (self.i >= self.frames.length - 1 || self.pending()) return self.stop();
      self.go(self.i + 1);
      self.timer = setTimeout(tick, +self.el.querySelector(".viz-speed").value);
    };
    this.timer = setTimeout(tick, 80);
  };
  Player.prototype.stop = function () {
    clearTimeout(this.timer);
    this.timer = null;
    var btn = this.el.querySelector('[data-a="play"]');
    if (btn) { btn.textContent = "Play"; btn.classList.remove("on"); }
  };
  Player.prototype.destroy = function () { this.stop(); };
  CL.Player = Player;
  // build a multiple-choice "Your turn" question; the right answer is mixed in with up to 3 distinct wrong ones
  // order: "sort" (numbers ascending, else text), "keep" (right answer first) or default (shuffled)
  CL.mkAsk = function (q, right, wrong, extra, order) {
    var opts = [String(right)];
    (wrong || []).forEach(function (w) { if (w === null || w === undefined) return; w = String(w); if (opts.indexOf(w) < 0 && opts.length < 4) opts.push(w); });
    if (order === "sort") {
      // by the first number in each option; options without a number go last
      var n = function (o) { var m = /-?\d+/.exec(o.replace(/<[^>]*>/g, "")); return m ? +m[0] : Infinity; };
      opts.sort(function (a, b) { return n(a) !== n(b) ? (n(a) < n(b) ? -1 : 1) : a < b ? -1 : a > b ? 1 : 0; });
    } else if (order !== "keep") CL.shuffle(opts);
    return Object.assign({ q: q, options: opts, answer: opts.indexOf(String(right)) }, extra || {});
  };
  // a question whose options keep a fixed order (for example Left / Right, or Case 1 to Case 3)
  CL.askFixed = function (q, options, answer, extra) {
    return Object.assign({ q: q, options: options.map(String), answer: answer }, extra || {});
  };
  CL.shuffle = function (a) {
    for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; }
    return a;
  };

  // ---------------------------------------------------------------- trees (key/left/right objects)
  CL.parseTreeSpec = function (spec) {
    var s = spec.replace(/\s+/g, ""), i = 0;
    function node() {
      if (i >= s.length || s[i] === "," || s[i] === ")") return null;
      var m = /^-?[^(),]+/.exec(s.slice(i));
      if (!m) return null;
      i += m[0].length;
      var n = { key: isNaN(+m[0]) ? m[0] : +m[0], left: null, right: null };
      if (s[i] === "(") {
        i++;
        n.left = node();
        if (s[i] === ",") { i++; n.right = node(); }
        if (s[i] === ")") i++;
      }
      return n;
    }
    return node();
  };
  CL.bstInsert = function (root, key) {
    var n = { key: key, left: null, right: null, parent: null };
    if (!root) return n;
    var cur = root;
    for (;;) {
      if (key < cur.key) { if (!cur.left) { cur.left = n; n.parent = cur; break; } cur = cur.left; }
      else if (key > cur.key) { if (!cur.right) { cur.right = n; n.parent = cur; break; } cur = cur.right; }
      else break;
    }
    return root;
  };
  CL.bstFrom = function (keys) { var r = null; keys.forEach(function (k) { r = CL.bstInsert(r, k); }); return r; };
  CL.cloneTree = function (n, parent) {
    if (!n) return null;
    var c = { key: n.key, left: null, right: null, parent: parent || null, id: n.id };
    c.left = CL.cloneTree(n.left, c);
    c.right = CL.cloneTree(n.right, c);
    return c;
  };
  CL.treeNodes = function (root) { var out = []; (function w(n) { if (!n) return; w(n.left); out.push(n); w(n.right); })(root); return out; };
  var tid = 1;
  CL.tagTree = function (root) { CL.treeNodes(root).forEach(function (n) { if (!n.id) n.id = "t" + (tid++); }); return root; };

  // in-order x, depth y
  CL.layoutTree = function (root, opts) {
    opts = opts || {};
    var dx = opts.dx || 46, dy = opts.dy || 62, r = opts.r || 17, pad = opts.pad || 26;
    var i = 0, maxD = 0;
    (function w(n, d) {
      if (!n) return;
      w(n.left, d + 1);
      n.x = pad + i * dx; n.y = pad + d * dy; n.depth = d; i++;
      maxD = Math.max(maxD, d);
      w(n.right, d + 1);
    })(root, 0);
    return { width: Math.max(2 * pad, pad * 2 + (i - 1) * dx), height: pad * 2 + maxD * dy, r: r };
  };
  // cls(n) -> class string; label(n) -> small text under node; extra svg string
  CL.drawTree = function (root, opts) {
    opts = opts || {};
    var L = CL.layoutTree(root, opts), r = L.r;
    var w = Math.max(L.width, opts.minW || 0), hgt = L.height + (opts.below || 14);
    var nodes = CL.treeNodes(root);
    var s = '<svg width="' + w + '" height="' + hgt + '" viewBox="0 0 ' + w + " " + hgt + '" role="img" aria-label="' + esc(opts.aria || "binary tree") + '">';
    nodes.forEach(function (n) {
      [n.left, n.right].forEach(function (c) {
        if (!c) return;
        var ec = opts.edgeCls ? opts.edgeCls(n, c) : "";
        s += '<line class="g-edge ' + ec + '" x1="' + n.x + '" y1="' + n.y + '" x2="' + c.x + '" y2="' + c.y + '"/>';
      });
    });
    nodes.forEach(function (n) {
      var c = opts.cls ? opts.cls(n) : "";
      s += '<g class="g-node ' + c + '"><circle cx="' + n.x + '" cy="' + n.y + '" r="' + r + '"/><text x="' + n.x + '" y="' + n.y + '">' + esc(n.key) + "</text></g>";
      var lb = opts.label ? opts.label(n) : "";
      if (lb) s += '<text class="g-lbl" x="' + n.x + '" y="' + (n.y + r + 13) + '">' + esc(lb) + "</text>";
      var tag = opts.tag ? opts.tag(n) : "";
      if (tag) s += '<text class="g-tag" x="' + n.x + '" y="' + (n.y - r - 6) + '">' + esc(tag) + "</text>";
    });
    if (!nodes.length) s += '<text class="g-lbl" x="' + (w / 2) + '" y="40">(empty tree: root is NULL)</text>';
    return s + (opts.extra || "") + "</svg>";
  };

  // complete binary tree from a 1-based array (heap) laid out by index
  CL.drawHeapTree = function (A, n, opts) {
    opts = opts || {};
    var levels = n ? Math.floor(Math.log2(n)) + 1 : 1;
    var leafSlots = Math.pow(2, levels - 1);
    var dx = opts.dx || 44, dy = opts.dy || 60, r = opts.r || 17, pad = 24;
    var w = Math.max(pad * 2 + leafSlots * dx, 120), hgt = pad * 2 + (levels - 1) * dy + 16;
    function pos(i) {
      var lv = Math.floor(Math.log2(i)), first = Math.pow(2, lv), k = i - first, count = first;
      var span = (w - 2 * pad);
      return { x: pad + (k + .5) * span / count, y: pad + lv * dy };
    }
    var s = '<svg width="' + w + '" height="' + hgt + '" viewBox="0 0 ' + w + " " + hgt + '" role="img" aria-label="heap drawn as a tree">';
    for (var i = 2; i <= n; i++) {
      var a = pos(Math.floor(i / 2)), b = pos(i);
      var ec = opts.edgeCls ? opts.edgeCls(Math.floor(i / 2), i) : "";
      s += '<line class="g-edge ' + ec + '" x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '"/>';
    }
    for (i = 1; i <= n; i++) {
      var p = pos(i), c = opts.cls ? opts.cls(i) : "";
      s += '<g class="g-node ' + c + '"><circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '"/><text x="' + p.x + '" y="' + p.y + '">' + esc(A[i]) + '</text></g><text class="g-idx" x="' + (p.x + r + 2) + '" y="' + (p.y - r + 2) + '">' + i + "</text>";
    }
    if (!n) s += '<text class="g-lbl" x="' + (w / 2) + '" y="40">(empty heap)</text>';
    return s + "</svg>";
  };

  // row of array cells. opts: cls(i), label(i), from (first index), tags {i: text}
  CL.drawArray = function (A, opts) {
    opts = opts || {};
    var from = opts.from || 0, to = opts.to === undefined ? A.length - 1 : opts.to;
    var cw = opts.cw || 40, ch = 34, pad = 12, top = opts.tags ? 22 : 8;
    var n = to - from + 1;
    var w = pad * 2 + n * cw, hgt = top + ch + 22 + (opts.below || 0);
    var s = '<svg width="' + w + '" height="' + hgt + '" viewBox="0 0 ' + w + " " + hgt + '" role="img" aria-label="' + esc(opts.aria || "array") + '">';
    for (var i = from; i <= to; i++) {
      var x = pad + (i - from) * cw, c = opts.cls ? opts.cls(i) : "";
      var v = A[i] === undefined || A[i] === null ? "" : A[i];
      s += '<g class="g-cell ' + c + '"><rect x="' + x + '" y="' + top + '" width="' + cw + '" height="' + ch + '"/><text x="' + (x + cw / 2) + '" y="' + (top + ch / 2) + '">' + esc(v) + '</text></g><text class="g-idx" x="' + (x + cw / 2) + '" y="' + (top + ch + 14) + '">' + i + "</text>";
      if (opts.tags && opts.tags[i]) s += '<text class="g-tag" x="' + (x + cw / 2) + '" y="' + (top - 7) + '">' + esc(opts.tags[i]) + "</text>";
    }
    return s + (opts.extra || "") + "</svg>";
  };

  // ---------------------------------------------------------------- lesson diagrams
  function svgEl(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstChild; }
  CL.svgEl = svgEl;
  CL.Diagrams.tree = function (args, body) {
    var root;
    if (/^bst:/.test(args)) root = CL.bstFrom(CL.parseNums(args.slice(4)));
    else root = CL.parseTreeSpec(args);
    return { svg: svgEl(CL.drawTree(root, {})), cap: body };
  };
  CL.Diagrams.array = function (args, body) {
    var A = args.split(/\s+/).filter(Boolean).map(function (x) { return x === "_" ? "" : x; });
    var from = 0;
    if (A[0] === "from1") { A.shift(); A.unshift(""); from = 1; }
    return { svg: svgEl(CL.drawArray(A, { from: from })), cap: body };
  };
  CL.Diagrams.list = function (args, body) {
    var vals = args.split(/\s+/).filter(Boolean);
    var cw = 44, gap = 34, pad = 14, top = 30, hgt = 92;
    var w = pad * 2 + vals.length * (2 * cw + gap) + 50;
    var s = '<svg width="' + w + '" height="' + hgt + '" viewBox="0 0 ' + w + " " + hgt + '" role="img" aria-label="linked list">';
    s += '<text class="g-tag" x="' + (pad + cw / 2) + '" y="14">top</text><line class="g-edge on" x1="' + (pad + cw / 2) + '" y1="18" x2="' + (pad + cw / 2) + '" y2="' + (top - 2) + '"/>';
    vals.forEach(function (v, i) {
      var x = pad + i * (2 * cw + gap);
      s += '<g class="g-cell"><rect x="' + x + '" y="' + top + '" width="' + cw + '" height="32"/><text x="' + (x + cw / 2) + '" y="' + (top + 16) + '">' + esc(v) + '</text></g><g class="g-cell"><rect x="' + (x + cw) + '" y="' + top + '" width="' + cw + '" height="32"/></g>';
      s += '<text class="g-idx" x="' + (x + cw / 2) + '" y="' + (top + 46) + '">data</text><text class="g-idx" x="' + (x + cw * 1.5) + '" y="' + (top + 46) + '">next</text>';
      var sx = x + cw * 1.5, sy = top + 16;
      if (i < vals.length - 1) s += '<circle cx="' + sx + '" cy="' + sy + '" r="4" fill="currentColor" class="g-tag"/><line class="g-edge on" x1="' + sx + '" y1="' + sy + '" x2="' + (x + 2 * cw + gap - 3) + '" y2="' + sy + '" marker-end="url(#dArr)"/>';
      else s += '<text class="g-cell" x="' + sx + '" y="' + (sy + 1) + '" style="font-family:var(--f-code);font-size:10px;text-anchor:middle;dominant-baseline:central;fill:var(--muted)">NULL</text>';
    });
    s += '<defs><marker id="dArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="mv-ah"/></marker></defs>';
    return { svg: svgEl(s + "</svg>"), cap: body };
  };

  // general tree (any number of children): spec like A(B(E,F),C,D(G(H,I,J)))
  CL.Diagrams.gtree = function (args, body) {
    var s = args.replace(/\s+/g, ""), i = 0;
    function node() {
      var m = /^[^(),]+/.exec(s.slice(i));
      if (!m) return null;
      i += m[0].length;
      var n = { key: m[0], kids: [] };
      if (s[i] === "(") {
        i++;
        while (i < s.length && s[i] !== ")") { var c = node(); if (c) n.kids.push(c); if (s[i] === ",") i++; else if (s[i] !== ")") break; }
        i++;
      }
      return n;
    }
    var root = node(), slot = 0, nodes = [], maxD = 0, dx = 52, dy = 62, pad = 26, r = 17;
    (function place(n, d) {
      n.d = d; maxD = Math.max(maxD, d);
      if (!n.kids.length) n.x = pad + (slot++) * dx;
      else { n.kids.forEach(function (k) { place(k, d + 1); }); n.x = (n.kids[0].x + n.kids[n.kids.length - 1].x) / 2; }
      n.y = pad + d * dy;
      nodes.push(n);
    })(root, 0);
    var w = pad * 2 + (slot - 1) * dx, h = pad * 2 + maxD * dy;
    var out = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="tree">';
    nodes.forEach(function (n) { n.kids.forEach(function (k) { out += '<line class="g-edge" x1="' + n.x + '" y1="' + n.y + '" x2="' + k.x + '" y2="' + k.y + '"/>'; }); });
    nodes.forEach(function (n) { out += '<g class="g-node"><circle cx="' + n.x + '" cy="' + n.y + '" r="' + r + '"/><text x="' + n.x + '" y="' + n.y + '">' + esc(n.key) + "</text></g>"; });
    return { svg: svgEl(out + "</svg>"), cap: body };
  };

  // ---------------------------------------------------------------- lab thumbnails
  CL.labThumb = function (id) {
    var t = {
      memory: '<svg viewBox="0 0 260 120"><rect x="18" y="22" width="70" height="76" rx="6" class="th-box"/><text x="53" y="40" class="th-t">main</text><rect x="28" y="50" width="50" height="18" rx="3" class="th-cell"/><circle cx="66" cy="59" r="4" class="th-dot"/><path d="M70 59 C110 59 110 45 140 45" class="th-arr"/><rect x="140" y="32" width="36" height="26" rx="3" class="th-cell"/><rect x="176" y="32" width="26" height="26" rx="3" class="th-cell"/><circle cx="189" cy="45" r="4" class="th-dot"/><path d="M193 45 C215 45 210 80 225 80" class="th-arr"/><rect x="200" y="70" width="40" height="22" rx="3" class="th-cell"/></svg>',
      lists: '<svg viewBox="0 0 260 120"><g class="th-row">' + [0, 1, 2, 3].map(function (i) { var x = 14 + i * 62; return '<rect x="' + x + '" y="46" width="28" height="26" class="th-cell"/><rect x="' + (x + 28) + '" y="46" width="18" height="26" class="th-cell"/>' + (i < 3 ? '<path d="M' + (x + 37) + ' 59 L' + (x + 60) + ' 59" class="th-arr"/>' : ""); }).join("") + "</g></svg>",
      stackqueue: '<svg viewBox="0 0 260 120"><g>' + [0, 1, 2, 3].map(function (i) { return '<rect x="34" y="' + (20 + i * 22) + '" width="60" height="18" rx="3" class="th-cell' + (i === 0 ? " hot" : "") + '"/>'; }).join("") + [0, 1, 2, 3, 4].map(function (i) { return '<rect x="' + (130 + i * 24) + '" y="52" width="20" height="20" rx="3" class="th-cell' + (i === 0 ? " hot" : "") + '"/>'; }).join("") + "</g></svg>",
      recursion: '<svg viewBox="0 0 260 120"><g>' + [[130, 16], [80, 50], [180, 50], [55, 86], [105, 86]].map(function (p, i) { return '<rect x="' + (p[0] - 26) + '" y="' + p[1] + '" width="52" height="20" rx="5" class="th-cell' + (i === 3 ? " hot" : "") + '"/>'; }).join("") + '<path d="M130 36 L80 50 M130 36 L180 50 M80 70 L55 86 M80 70 L105 86" class="th-line"/></g></svg>',
      traversal: treeThumb([3]), bst: treeThumb([1, 4]), avl: treeThumb([0, 2]),
      heap: '<svg viewBox="0 0 260 120">' + [16, 14, 10, 8, 7, 9, 3].map(function (v, i) { return '<rect x="' + (20 + i * 31) + '" y="80" width="29" height="24" class="th-cell' + (i === 0 ? " hot" : "") + '"/>'; }).join("") + '<circle cx="130" cy="22" r="10" class="th-node hot"/><circle cx="95" cy="50" r="10" class="th-node"/><circle cx="165" cy="50" r="10" class="th-node"/><path d="M130 32 L95 40 M130 32 L165 40" class="th-line"/></svg>',
      hash: '<svg viewBox="0 0 260 120">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<rect x="40" y="' + (8 + i * 18) + '" width="70" height="16" class="th-cell' + (i === 2 ? " hot" : "") + '"/><text x="30" y="' + (20 + i * 18) + '" class="th-i">' + (i + 1) + "</text>"; }).join("") + '<path d="M150 44 C130 44 125 44 112 44" class="th-arr"/><rect x="150" y="34" width="60" height="20" rx="4" class="th-cell"/></svg>',
      graph: '<svg viewBox="0 0 260 120"><path d="M60 30 L130 60 L200 28 M60 30 L80 95 L130 60 L190 95" class="th-line"/>' + [[60, 30], [130, 60], [200, 28], [80, 95], [190, 95]].map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" class="th-node' + (i === 1 ? " hot" : "") + '"/>'; }).join("") + "</svg>",
      sort: '<svg viewBox="0 0 260 120">' + [5, 2, 8, 3, 9, 4, 7, 1, 6].map(function (v, i) { return '<rect x="' + (24 + i * 24) + '" y="' + (104 - v * 10) + '" width="18" height="' + (v * 10) + '" rx="2" class="th-cell' + (i === 4 ? " hot" : "") + '"/>'; }).join("") + "</svg>"
    };
    return t[id] || "";
  };
  function treeThumb(hot) {
    var pts = [[130, 18], [80, 52], [180, 52], [55, 90], [105, 90], [155, 90], [205, 90]];
    return '<svg viewBox="0 0 260 120"><path d="M130 18 L80 52 L55 90 M80 52 L105 90 M130 18 L180 52 L155 90 M180 52 L205 90" class="th-line"/>' + pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" class="th-node' + (hot.indexOf(i) >= 0 ? " hot" : "") + '"/>'; }).join("") + "</svg>";
  }
})(CL);
