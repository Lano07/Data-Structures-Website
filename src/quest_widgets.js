/* COMP 2611 Code Lab — Quest widgets: the interactive challenges inside story levels. Each one draws itself into a
   host and reports through ctx: ctx.ok(msg) when solved, ctx.miss(msg) for a mistake (costs a heart), ctx.note(msg)
   for a neutral message. Nothing here is read-only: you click the traversal, rewire the pointers, sift the heap,
   probe the table, pick the swaps, and write the code. */
(function (CL) {
  "use strict";
  var QW = CL.QW = {}, esc = CL.esc;

  function h(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function norm(s) { return String(s == null ? "" : s).toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "").replace(/[.;]$/, ""); }
  function nums(s) { return String(s || "").split(/[\s,]+/).filter(Boolean).map(function (x) { return isNaN(+x) ? x : +x; }); }
  function fb(host) { var f = h("div", "qw-fb"); f.setAttribute("aria-live", "polite"); host.appendChild(f); return f; }
  function say(f, msg, kind) { f.className = "qw-fb" + (kind ? " " + kind : ""); f.innerHTML = msg || ""; }
  QW.norm = norm;

  // ---------------------------------------------------------------- multiple choice
  // a picture for a question: a tree, a graph or an array (not clickable)
  function figure(wrap, b) {
    if (b.tree || b.level || b.keys) { var st0 = h("div", "qt-stage qfig"); st0.innerHTML = drawTreeSvg(CL.tagTree(treeFrom(b)), {}).svg; wrap.appendChild(st0); }
    else if (b.spec) { var g0 = h("div", "qg-stage stage qfig"); g0.innerHTML = CL.drawGraph(graphOf(b), { label: function () { return ""; } }); wrap.appendChild(g0); }
    else if (b.values) { var a0 = h("div", "qa-stage qfig"); a0.innerHTML = cells(nums(b.values), { base: b.base === undefined ? 0 : +b.base }); wrap.appendChild(a0); }
  }
  QW.quiz = function (host, b, ctx) {
    var wrap = h("div", "qw qw-quiz");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    figure(wrap, b);
    if (b.code) wrap.appendChild(CL.codeBlock(b.code));
    var opts = h("div", "qw-opts");
    var order = b.keepOrder ? b.opts.map(function (_, i) { return i; }) : shuffle(b.opts.map(function (_, i) { return i; }));
    order.forEach(function (i, k) {
      var o = b.opts[i], btn = h("button", "qw-opt", '<span class="qw-key">' + String.fromCharCode(65 + k) + "</span><span>" + CL.inline(o.text.replace(/⏎/g, "↵")) + "</span>");
      btn.type = "button";
      btn.addEventListener("click", function () {
        if (wrap.classList.contains("solved") || btn.disabled) return;
        if (o.right) {
          btn.classList.add("right");
          wrap.classList.add("solved");
          opts.querySelectorAll(".qw-opt").forEach(function (x) { x.disabled = true; });
          ctx.ok(b.expl ? CL.inline(b.expl) : "Right!");
        } else {
          btn.classList.add("wrong");
          btn.disabled = true;
          ctx.miss(o.why ? CL.inline(o.why) : "Not that one. Read the question again and try another answer.");
        }
      });
      opts.appendChild(btn);
    });
    wrap.appendChild(opts);
    host.appendChild(wrap);
    wrap.addEventListener("keydown", function (e) { if (/^[1-6a-f]$/i.test(e.key)) { var idx = /\d/.test(e.key) ? +e.key - 1 : e.key.toLowerCase().charCodeAt(0) - 97, bt = opts.children[idx]; if (bt) bt.click(); } });
  };

  // ---------------------------------------------------------------- typed answer
  function answerMatches(given, answers) {
    var g = norm(given);
    return answers.some(function (a) {
      var w = norm(a);
      if (g === w) return true;
      if (g.replace(/\s/g, "") === w.replace(/\s/g, "")) return true;
      if (!isNaN(parseFloat(g)) && !isNaN(parseFloat(w)) && /^-?[\d.]+$/.test(g) && /^-?[\d.]+$/.test(w)) return Math.abs(parseFloat(g) - parseFloat(w)) < 1e-9;
      return false;
    });
  }
  QW.answerMatches = answerMatches;
  QW.type = function (host, b, ctx) {
    var wrap = h("div", "qw qw-type");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    figure(wrap, b);
    if (b.code) wrap.appendChild(CL.codeBlock(b.code));
    var row = h("div", "qw-row", '<input type="text" class="qw-in" spellcheck="false" autocomplete="off" aria-label="Your answer"><button type="button" class="px-btn primary">Check</button>');
    wrap.appendChild(row);
    var inp = row.querySelector("input"), btn = row.querySelector("button"), misses = 0;
    function check() {
      if (wrap.classList.contains("solved")) return;
      var v = inp.value;
      if (!v.trim()) { inp.focus(); return; }
      if (answerMatches(v, b.answers)) {
        wrap.classList.add("solved"); inp.disabled = true; btn.disabled = true;
        ctx.ok((b.expl ? CL.inline(b.expl) : "Right!"));
      } else {
        misses++;
        inp.classList.add("shake"); setTimeout(function () { inp.classList.remove("shake"); }, 400);
        ctx.miss("Not quite." + (misses >= 2 ? ' <button type="button" class="px-btn small" data-show>Show me</button>' : " Try again."));
        var sh = host.parentNode && host.parentNode.querySelector("[data-show]");
        if (sh) sh.addEventListener("click", function () { inp.value = b.answers[0]; wrap.classList.add("solved"); inp.disabled = true; btn.disabled = true; ctx.ok("The answer is <b>" + esc(b.answers[0]) + "</b>. " + (b.expl ? CL.inline(b.expl) : "")); });
      }
    }
    btn.addEventListener("click", check);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); check(); } });
    host.appendChild(wrap);
    setTimeout(function () { try { inp.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50);
  };

  // ---------------------------------------------------------------- predict the output
  function outNorm(s) { return String(s || "").replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n").replace(/^\n+|\n+$/g, ""); }
  QW.predict = function (host, b, ctx) {
    var wrap = h("div", "qw qw-predict");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "What does this program print?")));
    var ed = new CL.Editor(wrap, { value: b.code, label: "The program", readOnly: true });
    ed.scroll.style.maxHeight = "420px";
    var lines = (b.expect || "").split("\n").length;
    var ta = h("textarea", "qw-ta");
    ta.rows = Math.max(1, Math.min(8, lines));
    ta.spellcheck = false;
    ta.setAttribute("aria-label", "What it prints");
    ta.placeholder = lines > 1 ? "Type the output, one line per line" : "Type the output";
    wrap.appendChild(ta);
    var bar = h("div", "qw-row", '<button type="button" class="px-btn primary" data-a="check">Check</button><button type="button" class="px-btn small ghost" data-a="run" hidden>▶ Run it</button>');
    wrap.appendChild(bar);
    var runBox = h("div", "run");
    wrap.appendChild(runBox);
    var misses = 0, term = null;
    function reveal() { bar.querySelector('[data-a="run"]').hidden = false; ed.setReadOnly(false); ed.el.classList.add("qw-edit-ok"); }
    bar.addEventListener("click", function (e) {
      var x = e.target.closest("[data-a]");
      if (!x) return;
      if (x.getAttribute("data-a") === "run") { CL.runInTerminal(runBox, ed, { getTerm: function () { return term; }, setTerm: function (t) { term = t; } }); return; }
      if (wrap.classList.contains("solved")) return;
      var got = outNorm(ta.value), want = outNorm(b.expect);
      if (!ta.value.trim()) { ta.focus(); return; }
      if (got === want || got.replace(/\s+/g, " ") === want.replace(/\s+/g, " ")) {
        wrap.classList.add("solved"); ta.disabled = true; x.disabled = true; reveal();
        ctx.ok("Exactly right. " + (b.expl ? CL.inline(b.expl) : "") + " <span class='small'>Now change the code and press ▶ Run it to experiment.</span>");
      } else if (got.replace(/\s+/g, "") === want.replace(/\s+/g, "")) {
        wrap.classList.add("solved"); ta.disabled = true; x.disabled = true; reveal();
        ctx.ok("The values are right (only the spacing differs: it prints <code>" + esc(b.expect).replace(/\n/g, "↵") + "</code>). " + (b.expl ? CL.inline(b.expl) : ""));
      } else {
        misses++;
        var gl = got.split("\n"), wl = want.split("\n"), k = 0;
        while (k < gl.length && k < wl.length && gl[k] === wl[k]) k++;
        ctx.miss((wl.length > 1 ? (k ? "The first " + k + " line" + (k > 1 ? "s are" : " is") + " right; line " + (k + 1) + " is not." : "The first line is not right.") : "Not quite.") + (misses >= 2 ? ' <button type="button" class="px-btn small" data-reveal>Show me the output</button>' : " Trace it again, one line at a time."));
        var rv = host.parentNode && host.parentNode.querySelector("[data-reveal]");
        if (rv) rv.addEventListener("click", function () { ta.value = b.expect; wrap.classList.add("solved"); ta.disabled = true; reveal(); ctx.ok("It prints:<pre class='qw-pre'>" + esc(b.expect) + "</pre>" + (b.expl ? CL.inline(b.expl) : "")); });
      }
    });
    host.appendChild(wrap);
  };

  // ---------------------------------------------------------------- put the lines in order
  QW.order = function (host, b, ctx) {
    var wrap = h("div", "qw qw-order");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "Put these in the right order.")));
    var items = b.lines.map(function (t, i) { return { t: t, i: i, good: true }; }).concat((b.distract || []).map(function (t) { return { t: t, i: -1, good: false }; }));
    var pool = shuffle(items), ans = [];
    var cols = h("div", "qw-ord");
    var poolEl = h("div", "qw-pool"), ansEl = h("ol", "qw-ans");
    cols.appendChild(h("div", "qw-ord-h", "Pick from here"));
    cols.appendChild(h("div", "qw-ord-h", "Your order"));
    cols.appendChild(poolEl); cols.appendChild(ansEl);
    wrap.appendChild(cols);
    var bar = h("div", "qw-row", '<button type="button" class="px-btn primary" data-a="check">Check</button><button type="button" class="px-btn small ghost" data-a="clear">Start again</button>');
    wrap.appendChild(bar);
    var code = b.code;
    function line(it) { return code ? '<code class="qw-code">' + esc(it.t) + "</code>" : CL.inline(it.t); }
    function draw() {
      poolEl.innerHTML = ""; ansEl.innerHTML = "";
      pool.forEach(function (it) { var x = h("button", "qw-chip", line(it)); x.type = "button"; x.addEventListener("click", function () { if (wrap.classList.contains("solved")) return; pool.splice(pool.indexOf(it), 1); ans.push(it); draw(); }); poolEl.appendChild(x); });
      ans.forEach(function (it, k) { var li = h("li"), x = h("button", "qw-chip on", line(it)); x.type = "button"; x.addEventListener("click", function () { if (wrap.classList.contains("solved")) return; ans.splice(k, 1); pool.push(it); draw(); }); li.appendChild(x); ansEl.appendChild(li); });
      if (!pool.length) poolEl.innerHTML = '<span class="small muted">All placed.</span>';
      if (!ans.length) ansEl.innerHTML = '<li class="small muted qw-empty">Tap the lines in the order they should run.</li>';
    }
    draw();
    bar.addEventListener("click", function (e) {
      var x = e.target.closest("[data-a]");
      if (!x || wrap.classList.contains("solved")) return;
      if (x.getAttribute("data-a") === "clear") { pool = shuffle(items); ans = []; draw(); return; }
      var need = b.lines.length;
      if (ans.length < need) { ctx.note("Place all " + need + " lines first" + ((b.distract || []).length ? " (some lines are not needed at all)" : "") + "."); return; }
      var bad = -1;
      for (var k = 0; k < ans.length; k++) if (!ans[k].good || ans[k].i !== k) { bad = k; break; }
      if (bad < 0 && ans.length === need) {
        wrap.classList.add("solved");
        ansEl.querySelectorAll(".qw-chip").forEach(function (c) { c.classList.add("right"); });
        ctx.ok(b.expl ? CL.inline(b.expl) : "That's the right order.");
      } else {
        var chip = ansEl.querySelectorAll(".qw-chip")[bad];
        if (chip) { chip.classList.add("wrong"); setTimeout(function () { chip.classList.remove("wrong"); }, 900); }
        ctx.miss(!ans[bad].good ? "Line " + (bad + 1) + " does not belong in this code at all." : "Line " + (bad + 1) + " is in the wrong place. Everything before it is right.");
      }
    });
    host.appendChild(wrap);
  };

  // ---------------------------------------------------------------- fill in the blanks
  QW.fill = function (host, b, ctx) {
    var wrap = h("div", "qw qw-fill");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "Fill in the blanks.")));
    var pre = h("pre", "code qw-fillcode");
    var blanks = [], re = /\[\[(.+?)\]\](?!\])/g, last = 0, m, src = b.code, html = "";
    while ((m = re.exec(src))) {
      html += CL.highlight(src.slice(last, m.index));
      var alts = m[1].split("|").map(function (x) { return x.trim(); });
      var w = Math.max(3, Math.max.apply(null, alts.map(function (x) { return x.length; })) + 1);
      html += '<input type="text" class="qw-blank" data-b="' + blanks.length + '" style="width:' + w + 'ch" spellcheck="false" autocomplete="off" aria-label="Blank ' + (blanks.length + 1) + '">';
      blanks.push(alts);
      last = re.lastIndex;
    }
    html += CL.highlight(src.slice(last));
    pre.innerHTML = "<code>" + html + "</code>";
    wrap.appendChild(pre);
    var bar = h("div", "qw-row", '<button type="button" class="px-btn primary">Check</button>');
    wrap.appendChild(bar);
    var misses = 0;
    function check() {
      if (wrap.classList.contains("solved")) return;
      var ins = pre.querySelectorAll(".qw-blank"), bad = 0;
      ins.forEach(function (inp, i) {
        var g = inp.value.replace(/\s+/g, ""), ok = blanks[i].some(function (a) { return a.replace(/\s+/g, "") === g; });
        inp.classList.toggle("bad", !ok); inp.classList.toggle("good", ok);
        if (!ok) bad++;
      });
      if (!bad) { wrap.classList.add("solved"); ins.forEach(function (x) { x.disabled = true; }); ctx.ok(b.expl ? CL.inline(b.expl) : "All blanks are right."); }
      else {
        misses++;
        ctx.miss(bad + " blank" + (bad > 1 ? "s are" : " is") + " not right yet (marked in red)." + (misses >= 2 ? ' <button type="button" class="px-btn small" data-fillshow>Show me</button>' : ""));
        var sb = host.parentNode && host.parentNode.querySelector("[data-fillshow]");
        if (sb) sb.addEventListener("click", function () { ins.forEach(function (inp, i) { inp.value = blanks[i][0]; inp.classList.add("good"); inp.classList.remove("bad"); inp.disabled = true; }); wrap.classList.add("solved"); ctx.ok(b.expl ? CL.inline(b.expl) : "Here is the code."); });
      }
    }
    bar.querySelector("button").addEventListener("click", check);
    pre.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var ins = pre.querySelectorAll(".qw-blank"), i = +e.target.getAttribute("data-b"); if (ins[i + 1]) ins[i + 1].focus(); else check(); } });
    host.appendChild(wrap);
  };

  // ---------------------------------------------------------------- match terms to meanings
  QW.match = function (host, b, ctx) {
    var wrap = h("div", "qw qw-match");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "Match each term to its meaning.")));
    var L = shuffle(b.pairs.map(function (p, i) { return { t: p[0], i: i }; })), R = shuffle(b.pairs.map(function (p, i) { return { t: p[1], i: i }; }));
    var grid = h("div", "qw-matchgrid"), left = h("div", "qw-mcol"), right = h("div", "qw-mcol"), pick = null, done = 0;
    L.forEach(function (x) { var bt = h("button", "qw-chip", CL.inline(x.t)); bt.type = "button"; bt.dataset.i = x.i; bt.dataset.side = "l"; left.appendChild(bt); });
    R.forEach(function (x) { var bt = h("button", "qw-chip", CL.inline(x.t)); bt.type = "button"; bt.dataset.i = x.i; bt.dataset.side = "r"; right.appendChild(bt); });
    grid.appendChild(left); grid.appendChild(right);
    wrap.appendChild(grid);
    grid.addEventListener("click", function (e) {
      var bt = e.target.closest(".qw-chip");
      if (!bt || bt.classList.contains("right")) return;
      if (!pick || pick.dataset.side === bt.dataset.side) { if (pick) pick.classList.remove("on"); pick = bt; bt.classList.add("on"); return; }
      if (pick.dataset.i === bt.dataset.i) {
        pick.classList.remove("on"); pick.classList.add("right"); bt.classList.add("right"); pick.disabled = bt.disabled = true;
        done++;
        pick = null;
        if (done === b.pairs.length) ctx.ok(b.expl ? CL.inline(b.expl) : "All matched.");
        else ctx.note("Matched " + done + " of " + b.pairs.length + ".");
      } else {
        var a = pick; a.classList.remove("on"); a.classList.add("wrong"); bt.classList.add("wrong");
        setTimeout(function () { a.classList.remove("wrong"); bt.classList.remove("wrong"); }, 700);
        pick = null;
        ctx.miss("Those two do not go together.");
      }
    });
    host.appendChild(wrap);
  };

  // ---------------------------------------------------------------- binary trees you click
  function treeFrom(b) {
    if (b.level) return CL.treeFromLevel(b.level).root;
    if (b.keys) return CL.bstFrom(nums(b.keys));
    return CL.parseTreeSpec(b.tree || "1");
  }
  function travOrder(root, kind) {
    var out = [];
    if (kind === "level") { var q = [root]; while (q.length) { var n = q.shift(); if (!n) continue; out.push(n); q.push(n.left, n.right); } return out; }
    (function w(n) { if (!n) return; if (kind === "pre") out.push(n); w(n.left); if (kind === "in") out.push(n); w(n.right); if (kind === "post") out.push(n); })(root);
    return out;
  }
  // draws a tree; slots: show empty child positions (for "where does the new key go?")
  function drawTreeSvg(root, o) {
    o = o || {};
    var nodes = [], i = 0, maxD = 0, DX = 44, DY = 58, PAD = 24, R = 16;
    (function w(n, d, parent, side) {
      if (!n) { if (o.slots && parent) { nodes.push({ slot: true, parent: parent, side: side, x: PAD + (i++) * DX * 0.62, y: PAD + d * DY, d: d }); maxD = Math.max(maxD, d); } return; }
      var me = { n: n, d: d };
      w(n.left, d + 1, n, "left");
      me.x = PAD + (i++) * DX * (o.slots ? 0.62 : 1); me.y = PAD + d * DY; nodes.push(me); n._q = me;
      maxD = Math.max(maxD, d);
      w(n.right, d + 1, n, "right");
    })(root, 0, null, null);
    var wpx = Math.max(PAD * 2, nodes.reduce(function (m, x) { return Math.max(m, x.x); }, 0) + PAD), hpx = PAD * 2 + maxD * DY;
    var s = '<svg class="qt-svg" viewBox="0 0 ' + wpx + " " + hpx + '" width="' + wpx + '" height="' + hpx + '" role="img" aria-label="' + esc(o.label || "a binary tree") + '">';
    nodes.forEach(function (x) {
      var par = x.slot ? x.parent._q : null;
      if (x.slot) { s += '<line class="qt-e slot" x1="' + par.x + '" y1="' + par.y + '" x2="' + x.x + '" y2="' + x.y + '"/>'; return; }
      ["left", "right"].forEach(function (side) { var c = x.n[side]; if (c && c._q) s += '<line class="qt-e" x1="' + x.x + '" y1="' + x.y + '" x2="' + c._q.x + '" y2="' + c._q.y + '"/>'; });
    });
    nodes.forEach(function (x, k) {
      if (x.slot) { s += '<g class="qt-slot" data-slot="' + k + '" tabindex="0" role="button" aria-label="empty ' + x.side + " child of " + esc(x.parent.key) + '"><rect x="' + (x.x - 9) + '" y="' + (x.y - 9) + '" width="18" height="18"/><text x="' + x.x + '" y="' + (x.y + 1) + '">+</text></g>'; return; }
      var cls = o.cls ? o.cls(x.n) : "";
      s += '<g class="qt-n ' + cls + '" data-k="' + esc(x.n.id || "") + '" tabindex="0" role="button" aria-label="node ' + esc(x.n.key) + '"><rect x="' + (x.x - R) + '" y="' + (x.y - R) + '" width="' + 2 * R + '" height="' + 2 * R + '" rx="5"/><text x="' + x.x + '" y="' + (x.y + 1) + '">' + esc(x.n.key) + "</text>" +
        (o.badge && o.badge(x.n) ? '<text class="qt-badge" x="' + (x.x + R - 2) + '" y="' + (x.y - R + 2) + '">' + o.badge(x.n) + "</text>" : "") + "</g>";
    });
    return { svg: s + "</svg>", nodes: nodes };
  }
  QW.drawTreeSvg = drawTreeSvg;
  QW.tree = function (host, b, ctx) {
    var root = CL.tagTree(treeFrom(b)), kind = b.kind || "pre";
    var wrap = h("div", "qw qw-tree");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    var stage = h("div", "qt-stage");
    wrap.appendChild(stage);
    var status = h("div", "qw-seq");
    wrap.appendChild(status);
    var all = CL.treeNodes(root), clicked = [], done = false, slotsMode = kind === "insert", wrongAt = 0;
    var expect = null, setGoal = null, key = b.key !== undefined ? (isNaN(+b.key) ? b.key : +b.key) : null;
    var NAMES = { pre: "preorder", "in": "inorder", post: "postorder", level: "level order" };
    if (NAMES[kind]) expect = travOrder(root, kind);
    else if (kind === "leaves") setGoal = all.filter(function (n) { return !n.left && !n.right; });
    else if (kind === "internal") setGoal = all.filter(function (n) { return n.left || n.right; });
    else if (kind === "onechild") setGoal = all.filter(function (n) { return !n.left !== !n.right; });
    else if (kind === "path") { expect = []; var x = root; while (x) { expect.push(x); if (key === x.key) break; x = key < x.key ? x.left : x.right; } }
    else if (kind === "succ" || kind === "pred") {
      var ino = travOrder(root, "in"), at = -1;
      ino.forEach(function (n, k) { if (n.key === key) at = k; });
      var target = ino[at + (kind === "succ" ? 1 : -1)];
      expect = target ? [target] : [];
    }
    function draw() {
      var r = drawTreeSvg(root, {
        slots: slotsMode,
        cls: function (n) { return (clicked.indexOf(n) >= 0 ? "on" : "") + (key !== null && n.key === key && (kind === "succ" || kind === "pred") ? " mark" : ""); },
        badge: function (n) { var k = clicked.indexOf(n); return k >= 0 && expect ? String(k + 1) : ""; }
      });
      stage.innerHTML = r.svg;
      draw.nodes = r.nodes;
      status.innerHTML = expect && NAMES[kind] ? "<span>Visited:</span> <b>" + (clicked.map(function (n) { return esc(n.key); }).join(" ") || "…") + "</b>" :
        setGoal ? "<span>Found " + clicked.length + " of " + setGoal.length + "</span>" : kind === "path" ? "<span>Path:</span> <b>" + (clicked.map(function (n) { return esc(n.key); }).join(" → ") || "…") + "</b>" : "";
    }
    draw();
    function hintFor(next) {
      if (kind === "pre") return "Preorder: visit a node first, then its whole left subtree, then its right subtree.";
      if (kind === "in") return "Inorder: the whole left subtree first, then the node, then the right subtree.";
      if (kind === "post") return "Postorder: both subtrees first, the node last.";
      if (kind === "level") return "Level order: level by level, left to right (a queue).";
      if (kind === "path") return "At each node, compare " + esc(key) + " with its key: smaller goes left, bigger goes right.";
      return "";
    }
    stage.addEventListener("click", function (e) {
      if (done) return;
      var slot = e.target.closest(".qt-slot");
      if (slot && slotsMode) {
        var sl = draw.nodes[+slot.getAttribute("data-slot")], x2 = root, par = null, side = null;
        while (x2) { par = x2; side = key < x2.key ? "left" : "right"; x2 = x2[side]; }
        if (sl.parent === par && sl.side === side) {
          par[side] = CL.tagTree({ key: key, left: null, right: null });
          slotsMode = false; done = true; clicked = [par[side]];
          draw();
          ctx.ok(b.expl ? CL.inline(b.expl) : esc(key) + " goes there: the comparisons lead to that empty spot, and a new key always becomes a leaf.");
        } else {
          slot.classList.add("bad"); setTimeout(function () { slot.classList.remove("bad"); }, 600);
          ctx.miss("Not there. Start at the root " + esc(root.key) + " and compare " + esc(key) + " at each node: smaller goes left, bigger goes right, until you reach an empty spot.");
        }
        return;
      }
      var g = e.target.closest(".qt-n");
      if (!g || slotsMode) return;
      var node = all.filter(function (n) { return n.id === g.getAttribute("data-k"); })[0];
      if (!node || clicked.indexOf(node) >= 0) return;
      if (setGoal) {
        if (setGoal.indexOf(node) >= 0) { clicked.push(node); draw(); if (clicked.length === setGoal.length) { done = true; ctx.ok(b.expl ? CL.inline(b.expl) : "Found them all."); } }
        else { g.classList.add("bad"); setTimeout(function () { g.classList.remove("bad"); }, 600); ctx.miss(kind === "leaves" ? esc(node.key) + " has a child, so it is not a leaf." : kind === "internal" ? esc(node.key) + " has no children: it is a leaf." : esc(node.key) + " does not have exactly one child."); }
        return;
      }
      var want = expect[clicked.length];
      if (node === want) {
        clicked.push(node); wrongAt = 0; draw();
        if (clicked.length === expect.length) {
          done = true;
          var tail = kind === "path" && key !== null && expect.length && expect[expect.length - 1].key !== key ? " The next step would be NULL, so " + esc(key) + " is not in the tree." : "";
          ctx.ok((NAMES[kind] ? "That is the " + NAMES[kind] + ": <b>" + expect.map(function (n) { return esc(n.key); }).join(" ") + "</b>. " : "") + tail + (b.expl ? " " + CL.inline(b.expl) : ""));
        }
      } else {
        wrongAt++;
        g.classList.add("bad"); setTimeout(function () { g.classList.remove("bad"); }, 600);
        if (kind === "succ" || kind === "pred") { ctx.miss("Not that one. The inorder " + (kind === "succ" ? "successor is the next" : "predecessor is the previous") + " key in sorted (inorder) order."); return; }
        ctx.miss("Not next. " + hintFor(want) + (wrongAt >= 3 ? " The next one is <b>" + esc(want.key) + "</b>." : ""));
      }
    });
    stage.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { var t = e.target.closest(".qt-n, .qt-slot"); if (t) { e.preventDefault(); t.dispatchEvent(new MouseEvent("click", { bubbles: true })); } } });
    host.appendChild(wrap);
  };

  // ---------------------------------------------------------------- graphs you click
  function graphOf(b) { return CL.parseGraphSpec(String(b.spec || "").replace(/;\s*/g, "\n"), { directed: b.directed === "1" || b.directed === "true" || b.directed === true, weighted: b.weighted ? b.weighted !== "0" : undefined }); }
  function bfsOrder(g, s) { var seen = {}, out = [], Q = [s]; seen[s] = 1; while (Q.length) { var u = Q.shift(); out.push(u); g.adj[u].forEach(function (v) { if (!seen[v]) { seen[v] = 1; Q.push(v); } }); } return out; }
  function dfsOrder(g, s, all) { var seen = {}, out = []; function vis(u) { seen[u] = 1; out.push(u); g.adj[u].forEach(function (v) { if (!seen[v]) vis(v); }); } vis(s); if (all) g.V.forEach(function (v) { if (!seen[v]) vis(v); }); return out; }
  function wt(g, u, v) { for (var i = 0; i < g.E.length; i++) { var e = g.E[i]; if ((e[0] === u && e[1] === v) || (!g.directed && e[0] === v && e[1] === u)) return e[2]; } return Infinity; }
  function dijkstraOrder(g, s) {
    var cost = {}, done = {}, out = [];
    g.V.forEach(function (v) { cost[v] = Infinity; }); cost[s] = 0;
    for (;;) {
      var u = null;
      g.V.forEach(function (v) { if (!done[v] && cost[v] < Infinity && (u === null || cost[v] < cost[u] || (cost[v] === cost[u] && v < u))) u = v; });
      if (u === null) break;
      done[u] = 1; out.push(u);
      g.adj[u].forEach(function (v) { var c = cost[u] + wt(g, u, v); if (c < cost[v]) cost[v] = c; });
    }
    return { order: out, cost: cost };
  }
  function primOrder(g, s) {
    var used = [s], tree = [], total = 0;
    while (used.length < g.V.length) {
      var best = null;
      g.E.forEach(function (e) { var a = used.indexOf(e[0]) >= 0, c = used.indexOf(e[1]) >= 0; if (a !== c && (!best || e[2] < best[2])) best = e; });
      if (!best) break;
      var nv = used.indexOf(best[0]) >= 0 ? best[1] : best[0];
      used.push(nv); tree.push(best); total += best[2];
    }
    return { order: used, tree: tree, total: total };
  }
  function kruskalOrder(g) {
    var comp = {}, tree = [], total = 0;
    g.V.forEach(function (v) { comp[v] = v; });
    function find(v) { while (comp[v] !== v) v = comp[v]; return v; }
    g.E.slice().sort(function (a, b) { return a[2] - b[2] || (a[0] + a[1] < b[0] + b[1] ? -1 : 1); }).forEach(function (e) { if (find(e[0]) !== find(e[1])) { comp[find(e[0])] = find(e[1]); tree.push(e); total += e[2]; } });
    return { tree: tree, total: total };
  }
  QW.graphAlgos = { bfs: bfsOrder, dfs: dfsOrder, dijkstra: dijkstraOrder, prim: primOrder, kruskal: kruskalOrder };
  QW.graph = function (host, b, ctx) {
    var g = graphOf(b), kind = b.kind || "bfs", s = b.start || g.V[0];
    var wrap = h("div", "qw qw-graph");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    var stage = h("div", "qg-stage stage");
    wrap.appendChild(stage);
    var status = h("div", "qw-seq");
    wrap.appendChild(status);
    var picked = [], done = false, wrongAt = 0, expect = [], edgesMode = kind === "kruskal", extra = null;
    if (kind === "bfs") expect = bfsOrder(g, s);
    else if (kind === "dfs") expect = dfsOrder(g, s, b.all === "1");
    else if (kind === "dijkstra") { extra = dijkstraOrder(g, s); expect = extra.order; }
    else if (kind === "prim") { extra = primOrder(g, s); expect = extra.order; }
    else if (kind === "kruskal") { extra = kruskalOrder(g); expect = extra.tree; }
    var edgeBox = null;
    if (edgesMode) {
      edgeBox = h("div", "qg-edges");
      g.E.slice().sort(function (a, b2) { return a[2] - b2[2]; }).forEach(function (e) { var bt = h("button", "qw-chip", esc(e[0]) + "–" + esc(e[1]) + " <b>" + e[2] + "</b>"); bt.type = "button"; bt._e = e; edgeBox.appendChild(bt); });
      wrap.appendChild(edgeBox);
    }
    function treeEdges() { if (kind === "kruskal") return picked; if (kind === "prim") return extra.tree.slice(0, Math.max(0, picked.length - 1)); return []; }
    function draw() {
      var te = treeEdges();
      stage.innerHTML = CL.drawGraph(g, {
        nodeCls: function (v) { return picked.indexOf(v) >= 0 ? "done" : v === s && kind !== "kruskal" ? "on" : ""; },
        edgeCls: function (e) { return te.some(function (t) { return (t[0] === e[0] && t[1] === e[1]) || (t[0] === e[1] && t[1] === e[0]); }) ? "on" : ""; },
        label: function (v) { var k = picked.indexOf(v); return k >= 0 && !edgesMode ? "#" + (k + 1) : ""; }
      });
      status.innerHTML = edgesMode ? "<span>Tree edges:</span> <b>" + (picked.map(function (e) { return e[0] + "–" + e[1]; }).join(", ") || "…") + "</b> · cost " + picked.reduce(function (t, e) { return t + e[2]; }, 0) :
        "<span>Order:</span> <b>" + (picked.join(" ") || "…") + "</b>";
    }
    draw();
    var HINT = { bfs: "BFS takes the vertex at the front of the queue; a vertex joins the back of the queue when it is first discovered (neighbours in alphabetical order).", dfs: "DFS goes as deep as it can: from the vertex it just visited, it goes to the first unvisited neighbour (alphabetical order), and backs up only when there is none.",
      dijkstra: "Dijkstra always finalises the unvisited vertex with the lowest cost so far.", prim: "Prim adds the cheapest edge from a used vertex to an unused one; that edge's unused end joins next." };
    stage.addEventListener("click", function (e) {
      if (done || edgesMode) return;
      var node = e.target.closest(".g-node[data-v]");
      if (!node) return;
      var v = node.getAttribute("data-v");
      if (picked.indexOf(v) >= 0) return;
      var want = expect[picked.length];
      if (v === want) {
        picked.push(v); wrongAt = 0; draw();
        if (picked.length === expect.length) {
          done = true;
          var msg = kind === "dijkstra" ? "Finalised in this order: <b>" + expect.join(" ") + "</b>. Costs: " + expect.map(function (x) { return x + " " + extra.cost[x]; }).join(", ") + "." :
            kind === "prim" ? "Prim's tree: " + extra.tree.map(function (t) { return t[0] + "–" + t[1] + " (" + t[2] + ")"; }).join(", ") + ". Total cost <b>" + extra.total + "</b>." : "Order: <b>" + expect.join(" ") + "</b>." + (expect.length < g.V.length ? " (" + g.V.filter(function (x) { return expect.indexOf(x) < 0; }).join(", ") + " cannot be reached from " + s + ".)" : "");
          ctx.ok(msg + (b.expl ? " " + CL.inline(b.expl) : ""));
        }
      } else {
        wrongAt++;
        node.classList.add("bad"); setTimeout(function () { node.classList.remove("bad"); }, 600);
        ctx.miss("Not next. " + (HINT[kind] || "") + (wrongAt >= 3 ? " The next one is <b>" + esc(want) + "</b>." : ""));
      }
    });
    if (edgeBox) edgeBox.addEventListener("click", function (e) {
      var bt = e.target.closest(".qw-chip");
      if (!bt || done || bt.disabled) return;
      var want = expect[picked.length];
      if (bt._e === want) {
        picked.push(bt._e); bt.classList.add("right"); bt.disabled = true; wrongAt = 0; draw();
        if (picked.length === expect.length) { done = true; ctx.ok("Kruskal's tree has " + expect.length + " edges (V − 1) and costs <b>" + extra.total + "</b>." + (b.expl ? " " + CL.inline(b.expl) : "")); }
      } else {
        wrongAt++;
        var cyc = (function () { var comp = {}; g.V.forEach(function (v) { comp[v] = v; }); function f(v) { while (comp[v] !== v) v = comp[v]; return v; } picked.forEach(function (t) { comp[f(t[0])] = f(t[1]); }); return f(bt._e[0]) === f(bt._e[1]); })();
        bt.classList.add("wrong"); setTimeout(function () { bt.classList.remove("wrong"); }, 700);
        ctx.miss(cyc ? bt._e[0] + " and " + bt._e[1] + " are already connected by your tree: that edge would make a cycle." : "Kruskal takes the cheapest edge that does not make a cycle." + (wrongAt >= 3 ? " Next: <b>" + want[0] + "–" + want[1] + "</b>." : ""));
      }
    });
    host.appendChild(wrap);
  };

  // ---------------------------------------------------------------- arrays: hashing, binary search, heap index
  function cells(vals, o) {
    o = o || {};
    var base = o.base || 0;
    return '<div class="qa-row">' + vals.map(function (v, i) {
      var cls = o.cls ? o.cls(i) : "";
      return '<button type="button" class="qa-c ' + cls + '" data-i="' + i + '" aria-label="index ' + (i + base) + (v !== null && v !== "" ? ", " + esc(Array.isArray(v) ? v.join(" ") : v) : ", empty") + '"><b>' + (v === null || v === undefined ? "" : Array.isArray(v) ? v.map(esc).join("<br>") : esc(v)) + "</b><i>" + (i + base) + "</i></button>";
    }).join("") + "</div>";
  }
  QW.array = function (host, b, ctx) {
    var kind = b.kind || "hash", wrap = h("div", "qw qw-array");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    var stage = h("div", "qa-stage");
    wrap.appendChild(stage);
    var info = h("div", "qw-seq");
    wrap.appendChild(info);
    host.appendChild(wrap);
    if (kind === "hash") {
      var N = +(b.n || b.N || 11), base = b.base === undefined ? 1 : +b.base, keys = nums(b.keys), method = b.method || "linear";
      var T = [];
      for (var i = 0; i < N; i++) T.push(method === "chain" ? [] : null);
      var k = 0, misses = 0;
      function home(key) { return key % N + base; }
      function wrapLoc(l) { while (l > N - 1 + base) l -= N; return l; }
      function target(key) {
        var loc = home(key), x = 0, path = [loc];
        if (method === "chain") return { loc: loc, path: path };
        while (T[loc - base] !== null && x < 3 * N) {
          x++;
          loc = method === "linear" ? wrapLoc(loc + 1) : method === "quad" ? wrapLoc(loc + x + x * x) : wrapLoc(loc + key % (N - 2) + 1);
          path.push(loc);
        }
        return { loc: loc, path: path };
      }
      function hf() { return method === "double" ? "h = key % " + N + (base ? " + 1" : "") + ", step = key % " + (N - 2) + " + 1" : "h = key % " + N + (base ? " + 1" : ""); }
      function draw(hot) { stage.innerHTML = cells(T.map(function (v) { return method === "chain" ? (v.length ? v : null) : v; }), { base: base, cls: function (j) { return hot && hot.indexOf(j + base) >= 0 ? "hot" : T[j] !== null && (method !== "chain" || T[j].length) ? "full" : ""; } }); }
      function prompt() {
        if (k >= keys.length) { info.innerHTML = "Table: " + T.map(function (v) { return method === "chain" ? "[" + v.join(" ") + "]" : v === null ? "_" : v; }).join(" "); ctx.ok(b.expl ? CL.inline(b.expl) : "All keys are in."); return; }
        info.innerHTML = "<span>" + esc(hf()) + " · " + { linear: "linear probing", quad: "quadratic probing (move x + x²)", double: "double hashing", chain: "chaining" }[method] + "</span> · Insert <b>" + keys[k] + "</b>: click its location.";
      }
      draw(); prompt();
      stage.addEventListener("click", function (e) {
        var c = e.target.closest(".qa-c");
        if (!c || k >= keys.length) return;
        var key = keys[k], t = target(key), at = +c.getAttribute("data-i") + base;
        if (at === t.loc) {
          if (method === "chain") T[at - base].push(key); else T[at - base] = key;
          var steps = t.path.length > 1 ? key + " % " + N + (base ? " + 1" : "") + " = " + t.path[0] + " (taken), then " + t.path.slice(1).join(" → ") : key + " % " + N + (base ? " + 1" : "") + " = " + t.loc;
          k++; misses = 0; draw([at]);
          ctx.note("✓ " + steps + ".");
          prompt();
        } else {
          misses++;
          c.classList.add("bad"); setTimeout(function () { c.classList.remove("bad"); }, 600);
          ctx.miss("Not there. Start at h(" + key + ") = " + key + " % " + N + (base ? " + 1" : "") + " = " + t.path[0] + (t.path.length > 1 ? ", which is taken: keep " + (method === "linear" ? "moving one place" : method === "quad" ? "jumping x + x² after the x-th collision" : "jumping by the step") + "." : ".") + (misses >= 3 ? " The key goes to <b>" + t.loc + "</b>." : ""));
        }
      });
      return;
    }
    if (kind === "binsearch") {
      var A = nums(b.values), key = +b.key, lo = 0, hi = A.length - 1, seen = [], miss2 = 0;
      function draw2() {
        stage.innerHTML = cells(A, { cls: function (j) { return seen.indexOf(j) >= 0 ? "dim" : j < lo || j > hi ? "out" : "in"; } });
        info.innerHTML = lo <= hi ? "<span>Looking for <b>" + key + "</b> between index " + lo + " and " + hi + ".</span> Click the middle element (mid = (low + high) / 2, rounded down)." : "";
      }
      draw2();
      stage.addEventListener("click", function (e) {
        var c = e.target.closest(".qa-c");
        if (!c || lo > hi) return;
        var j = +c.getAttribute("data-i"), mid = Math.floor((lo + hi) / 2);
        if (j !== mid) { miss2++; c.classList.add("bad"); setTimeout(function () { c.classList.remove("bad"); }, 600); ctx.miss("mid = (" + lo + " + " + hi + ") / 2 = " + mid + " (integer division)." + (miss2 >= 2 ? " Click index " + mid + "." : "")); return; }
        seen.push(mid);
        if (A[mid] === key) { lo = hi + 1; stage.innerHTML = cells(A, { cls: function (x) { return x === mid ? "hot" : seen.indexOf(x) >= 0 ? "dim" : "out"; } }); info.innerHTML = ""; ctx.ok("Found " + key + " at index " + mid + " after " + seen.length + " comparison" + (seen.length > 1 ? "s" : "") + ". " + (b.expl ? CL.inline(b.expl) : "")); return; }
        if (key < A[mid]) hi = mid - 1; else lo = mid + 1;
        ctx.note(A[mid] + (key < A[mid] ? " > " : " < ") + key + ", so search the " + (key < A[mid] ? "left" : "right") + " half.");
        draw2();
        if (lo > hi) ctx.ok("low passed high, so " + key + " is not in the array (" + seen.length + " comparisons). " + (b.expl ? CL.inline(b.expl) : ""));
      });
      return;
    }
    if (kind === "index") {
      // a 1-based heap array: click the parent, left child or right child of index i
      var V = nums(b.values), i0 = +b.i, ask = b.ask || "parent", base3 = 1;
      var want = ask === "parent" ? Math.floor(i0 / 2) : ask === "left" ? 2 * i0 : 2 * i0 + 1;
      stage.innerHTML = cells(V, { base: base3, cls: function (j) { return j + 1 === i0 ? "hot" : ""; } });
      info.innerHTML = "Index " + i0 + " holds <b>" + V[i0 - 1] + "</b>. Click its <b>" + (ask === "parent" ? "parent" : ask + " child") + "</b>.";
      stage.addEventListener("click", function (e) {
        var c = e.target.closest(".qa-c");
        if (!c || wrap.classList.contains("solved")) return;
        var at = +c.getAttribute("data-i") + 1;
        if (at === want) { wrap.classList.add("solved"); c.classList.add("hot2"); ctx.ok((ask === "parent" ? "parent(i) = i / 2 = " + i0 + " / 2 = " : ask === "left" ? "left(i) = 2i = " : "right(i) = 2i + 1 = ") + want + "." + (b.expl ? " " + CL.inline(b.expl) : "")); }
        else { c.classList.add("bad"); setTimeout(function () { c.classList.remove("bad"); }, 600); ctx.miss("With the array starting at index 1: parent i / 2 (rounded down), left child 2i, right child 2i + 1."); }
      });
    }
  };

  // ---------------------------------------------------------------- heaps: you do the swaps
  QW.heap = function (host, b, ctx) {
    var A = [null].concat(nums(b.values)), kind = b.kind || "heapify", isMin = b.min === "1";
    var wrap = h("div", "qw qw-heap");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    var stage = h("div", "qh-stage");
    wrap.appendChild(stage);
    var info = h("div", "qw-seq");
    wrap.appendChild(info);
    var btns = h("div", "qw-row");
    wrap.appendChild(btns);
    host.appendChild(wrap);
    var n = A.length - 1, cur = +b.i || 1, phase = kind, misses = 0, finished = false;
    function better(x, y) { return isMin ? x < y : x > y; }
    function treeOf() { function mk(i) { return i > n ? null : { key: A[i], idx: i, id: "h" + i, left: mk(2 * i), right: mk(2 * i + 1) }; } return mk(1); }
    function draw(hot) {
      var r = drawTreeSvg(treeOf(), { cls: function (x) { return x.idx === cur && !finished ? "on" : hot && hot.indexOf(x.idx) >= 0 ? "mark" : ""; }, badge: function (x) { return String(x.idx); } });
      stage.innerHTML = '<div class="qh-tree">' + r.svg + "</div>" + cells(A.slice(1, n + 1), { base: 1, cls: function (j) { return j + 1 === cur && !finished ? "hot" : hot && hot.indexOf(j + 1) >= 0 ? "hot2" : ""; } });
    }
    function siftChoice() {
      var l = 2 * cur, r = 2 * cur + 1, best = cur;
      if (l <= n && better(A[l], A[best])) best = l;
      if (r <= n && better(A[r], A[best])) best = r;
      return best;
    }
    function askDown() {
      var l = 2 * cur, r = 2 * cur + 1;
      if (l > n) { done("Index " + cur + " has no children: " + (phase === "extract" ? "the heap is fixed." : "maxHeapify stops.")); return; }
      info.innerHTML = "maxHeapify at index <b>" + cur + "</b> (" + A[cur] + "): children " + (l <= n ? A[l] + " (index " + l + ")" : "none") + (r <= n ? " and " + A[r] + " (index " + r + ")" : "") + ". What does it do?";
      btns.innerHTML = "";
      [[l, "Swap with " + A[l] + " (index " + l + ")"], r <= n ? [r, "Swap with " + A[r] + " (index " + r + ")"] : null, [cur, "No swap: the heap property holds here"]].filter(Boolean).forEach(function (o) {
        var bt = h("button", "px-btn", esc(o[1])); bt.type = "button";
        bt.addEventListener("click", function () {
          var want = siftChoice();
          if (o[0] !== want) { misses++; ctx.miss(want === cur ? A[cur] + " is " + (isMin ? "smaller" : "at least as big as") + " its children, so nothing moves." : "Swap with the " + (isMin ? "smaller" : "larger") + " child, and only if it is " + (isMin ? "smaller" : "larger") + " than " + A[cur] + "." + (misses >= 3 ? " Here: swap with index " + want + "." : "")); return; }
          if (want === cur) { done(A[cur] + " is in place: maxHeapify stops."); return; }
          var t = A[cur]; A[cur] = A[want]; A[want] = t;
          ctx.note("Swap " + A[want] + " and " + A[cur] + "; carry on at index " + want + ".");
          cur = want; draw([cur]); askDown();
        });
        btns.appendChild(bt);
      });
    }
    function askUp() {
      var p = Math.floor(cur / 2);
      if (cur === 1) { done(A[1] + " reached the root."); return; }
      info.innerHTML = "The new value " + A[cur] + " is at index <b>" + cur + "</b>; its parent is " + A[p] + " (index " + p + "). What happens?";
      btns.innerHTML = "";
      [["up", "Swap with the parent"], ["stop", "Stop: it is in place"]].forEach(function (o) {
        var bt = h("button", "px-btn", esc(o[1])); bt.type = "button";
        bt.addEventListener("click", function () {
          var should = better(A[cur], A[p]) ? "up" : "stop";
          if (o[0] !== should) { ctx.miss(should === "up" ? A[cur] + " is " + (isMin ? "smaller" : "bigger") + " than its parent " + A[p] + ", so it must move up." : A[p] + " is " + (isMin ? "smaller" : "at least as big") + ", so the heap property holds: stop."); return; }
          if (should === "stop") { done(A[cur] + " stays at index " + cur + "."); return; }
          var t = A[cur]; A[cur] = A[p]; A[p] = t; cur = p; draw([cur]); ctx.note("Swapped: " + A[cur] + " moves up to index " + cur + "."); askUp();
        });
        btns.appendChild(bt);
      });
    }
    function done(msg) { finished = true; btns.innerHTML = ""; info.innerHTML = "Heap: <b>" + A.slice(1, n + 1).join(" ") + "</b>"; draw(); ctx.ok(msg + " " + (b.expl ? CL.inline(b.expl) : "")); }
    if (kind === "insert") { A.push(+b.x); n++; cur = n; draw([n]); ctx.note(b.x + " goes in the next free place, index " + n + " (the bottom level, leftmost gap)."); askUp(); }
    else if (kind === "extract") {
      var max = A[1]; A[1] = A[n]; A.pop(); n--; cur = 1;
      draw([1]); ctx.note("The " + (isMin ? "minimum" : "maximum") + " " + max + " is removed; the last value " + A[1] + " moves to the root. Now heapify from the root.");
      phase = "extract"; askDown();
    } else { draw(); askDown(); }
  };

  // ---------------------------------------------------------------- sorting: you are the algorithm
  QW.sort = function (host, b, ctx) {
    var A = nums(b.values), alg = b.alg || "bubble", passes = +(b.passes || A.length - 1);
    var wrap = h("div", "qw qw-sort");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    var stage = h("div", "qa-stage"), info = h("div", "qw-seq"), btns = h("div", "qw-row");
    wrap.appendChild(stage); wrap.appendChild(info); wrap.appendChild(btns);
    host.appendChild(wrap);
    var hot = [], sortedFrom = A.length, sortedTo = 0, misses = 0, finished = false;
    function draw(extraCls) { stage.innerHTML = cells(A, { cls: function (j) { return hot.indexOf(j) >= 0 ? "hot" : extraCls ? extraCls(j) : ""; } }); }
    function finish(msg) { finished = true; btns.innerHTML = ""; hot = []; draw(function () { return "full"; }); info.innerHTML = "Array: <b>" + A.join(" ") + "</b>"; ctx.ok(msg + (b.expl ? " " + CL.inline(b.expl) : "")); }
    function choose(opts, onPick) {
      btns.innerHTML = "";
      opts.forEach(function (o) { var bt = h("button", "px-btn", esc(o.label)); bt.type = "button"; bt.addEventListener("click", function () { onPick(o.v); }); btns.appendChild(bt); });
    }
    if (alg === "bubble") {
      var i = 0, j = 0;
      var step = function () {
        if (j >= A.length - 1 - i) { i++; j = 0; ctx.note("Pass " + i + " done: the largest unsorted value has bubbled to index " + (A.length - i) + "."); }
        if (i >= passes || i >= A.length - 1) { finish("After " + i + " pass" + (i > 1 ? "es" : "") + ": " + A.join(" ") + "."); return; }
        hot = [j, j + 1];
        draw(function (x) { return x >= A.length - i ? "full" : ""; });
        info.innerHTML = "Pass " + (i + 1) + ": compare A[" + j + "] = " + A[j] + " and A[" + (j + 1) + "] = " + A[j + 1] + ".";
        choose([{ label: "Swap them", v: 1 }, { label: "Leave them", v: 0 }], function (v) {
          var should = A[j] > A[j + 1] ? 1 : 0;
          if (v !== should) { misses++; ctx.miss(should ? A[j] + " > " + A[j + 1] + ", so they swap." : A[j] + " ≤ " + A[j + 1] + ", so they stay."); return; }
          if (should) { var t = A[j]; A[j] = A[j + 1]; A[j + 1] = t; }
          j++; step();
        });
      };
      step();
    } else if (alg === "selection") {
      var si = 0;
      var sstep = function () {
        if (si >= passes || si >= A.length - 1) { finish("After " + si + " pass" + (si > 1 ? "es" : "") + ": " + A.join(" ") + "."); return; }
        hot = [si]; btns.innerHTML = "";
        draw(function (x) { return x < si ? "full" : ""; });
        info.innerHTML = "Pass " + (si + 1) + ": click the <b>smallest</b> value from index " + si + " to the end. It will swap into index " + si + ".";
      };
      stage.addEventListener("click", function (e) {
        var c = e.target.closest(".qa-c");
        if (!c || finished) return;
        var at = +c.getAttribute("data-i"), m = si;
        for (var k = si + 1; k < A.length; k++) if (A[k] < A[m]) m = k;
        if (at < si) return;
        if (at !== m) { ctx.miss(A[at] + " is not the smallest of " + A.slice(si).join(", ") + "."); return; }
        var t = A[si]; A[si] = A[m]; A[m] = t;
        ctx.note(m === si ? A[si] + " is already in place." : "Swap " + A[si] + " into index " + si + ".");
        si++; sstep();
      });
      sstep();
    } else if (alg === "insertion") {
      var ii = 1;
      var istep = function () {
        if (ii > passes || ii >= A.length) { finish("After inserting " + (ii - 1) + " value" + (ii > 2 ? "s" : "") + ": " + A.join(" ") + "."); return; }
        hot = [ii];
        draw(function (x) { return x < ii ? "full" : ""; });
        info.innerHTML = "Insert <b>" + A[ii] + "</b> (index " + ii + ") into the sorted part A[0.." + (ii - 1) + "]: click the index where it ends up.";
      };
      stage.addEventListener("click", function (e) {
        var c = e.target.closest(".qa-c");
        if (!c || finished) return;
        var at = +c.getAttribute("data-i");
        if (at > ii) return;
        var key = A[ii], j2 = ii - 1;
        while (j2 >= 0 && A[j2] > key) j2--;
        var want = j2 + 1;
        if (at !== want) { ctx.miss("Larger values shift right; " + key + " stops after the first value that is not bigger than it (or at index 0)."); return; }
        A.splice(ii, 1); A.splice(want, 0, key);
        ctx.note(want === ii ? key + " stays where it is." : key + " moves to index " + want + "; the bigger values shift one place right.");
        ii++; istep();
      });
      istep();
    } else if (alg === "partition") {
      var p = 0, r = A.length - 1, x = A[r], pi = p - 1, pj = p;
      var pstep = function () {
        if (pj > r - 1) {
          var t = A[pi + 1]; A[pi + 1] = A[r]; A[r] = t;
          finish("Finally swap the pivot " + x + " into index " + (pi + 1) + ": q = " + (pi + 1) + ". Everything left of it is ≤ " + x + ", everything right of it is bigger.");
          return;
        }
        hot = [pj];
        draw(function (k) { return k === r ? "piv" : k <= pi ? "full" : k < pj ? "dim" : ""; });
        info.innerHTML = "Pivot x = A[" + r + "] = <b>" + x + "</b>, i = " + pi + ", j = " + pj + ": A[j] = " + A[pj] + ". What happens?";
        choose([{ label: "A[j] ≤ x: i++ and swap A[i], A[j]", v: 1 }, { label: "A[j] > x: just move on", v: 0 }], function (v) {
          var should = A[pj] <= x ? 1 : 0;
          if (v !== should) { ctx.miss(A[pj] + (should ? " ≤ " : " > ") + x + "."); return; }
          if (should) { pi++; var t2 = A[pi]; A[pi] = A[pj]; A[pj] = t2; ctx.note("i becomes " + pi + "; swap A[" + pi + "] and A[" + pj + "]."); }
          pj++; pstep();
        });
      };
      pstep();
    } else if (alg === "merge") {
      var parts = String(b.values).split("|"), L = nums(parts[0]), R = nums(parts[1] || ""), out = [];
      var mdraw = function () {
        stage.innerHTML = '<div class="qm-runs"><div><span class="small muted">Left</span>' + cells(L) + '</div><div><span class="small muted">Right</span>' + cells(R) + '</div><div><span class="small muted">Merged</span>' + cells(out.length ? out : [""]) + "</div></div>";
        info.innerHTML = L.length && R.length ? "Click the value that goes next into the merged array (compare the two fronts)." : "";
      };
      stage.addEventListener("click", function (e) {
        var c = e.target.closest(".qa-c");
        if (!c || finished) return;
        var runEl = c.closest(".qm-runs > div"), which = runEl === stage.querySelector(".qm-runs").children[0] ? "L" : runEl === stage.querySelector(".qm-runs").children[1] ? "R" : null;
        if (!which || +c.getAttribute("data-i") !== 0) { ctx.note("Only the front of each run can go next."); return; }
        var want = L[0] <= R[0] ? "L" : "R";
        if (which !== want) { ctx.miss("Take the smaller front: " + Math.min(L[0], R[0]) + " (on a tie, take the left one: that keeps merge sort stable)."); return; }
        out.push((which === "L" ? L : R).shift());
        if (!L.length || !R.length) { out = out.concat(L, R); L = []; R = []; mdraw(); finish("One run is empty, so the rest of the other is copied: " + out.join(" ") + "."); return; }
        mdraw();
      });
      mdraw();
    }
  };

  // ---------------------------------------------------------------- linked lists: rewire the pointers yourself
  // b.list "10 20 30" (top points at the first), b.vars "curr=20 newNode=25*" (* = a new node not in the list yet),
  // b.goal "10 20 25 30", b.palette (lines): statements to choose from
  QW.listsim = function (host, b, ctx) {
    var wrap = h("div", "qw qw-list");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "")));
    var HEAD = b.head || "top";
    var init = function () {
      var st = { nodes: {}, vars: {}, nid: 0, freed: {} };
      var prev = null;
      nums(b.list).forEach(function (v) { var id = "n" + (st.nid++); st.nodes[id] = { v: v, next: null }; if (prev) st.nodes[prev].next = id; else st.vars[HEAD] = id; prev = id; });
      if (!st.vars[HEAD]) st.vars[HEAD] = null;
      String(b.vars || "").split(/\s+/).filter(Boolean).forEach(function (pair) {
        var m = /^(\w+)=(\S+)$/.exec(pair);
        if (!m) return;
        if (m[2] === "NULL") { st.vars[m[1]] = null; return; }
        if (/\*$/.test(m[2])) { var id = "n" + (st.nid++); st.nodes[id] = { v: +m[2].slice(0, -1), next: null }; st.vars[m[1]] = id; return; }
        var val = +m[2], found = null;
        Object.keys(st.nodes).forEach(function (k) { if (st.nodes[k].v === val && !found) found = k; });
        st.vars[m[1]] = found;
      });
      return st;
    };
    var S = init(), hist = [], prog = [];
    var stage = h("div", "ql-stage"), code = h("pre", "code ql-prog"), pal = h("div", "ql-pal"), bar = h("div", "qw-row", '<button type="button" class="px-btn small" data-a="undo">↶ Undo</button><button type="button" class="px-btn small ghost" data-a="reset">Reset</button>');
    wrap.appendChild(stage);
    wrap.appendChild(h("div", "ql-h", "Your code so far"));
    wrap.appendChild(code);
    wrap.appendChild(h("div", "ql-h", "Click a statement to run it"));
    wrap.appendChild(pal);
    wrap.appendChild(bar);
    host.appendChild(wrap);
    var lines = (b.palette || []).filter(function (x, i, a) { return a.indexOf(x) === i; });
    var order = shuffle(lines);
    order.forEach(function (ln) { var bt = h("button", "qw-chip ql-stmt", '<code>' + esc(ln) + "</code>"); bt.type = "button"; bt._ln = ln; pal.appendChild(bt); });
    function reach(st) {
      var seen = {};
      Object.keys(st.vars).forEach(function (k) { var x = st.vars[k], guard = 0; while (x && !seen[x] && guard++ < 50) { seen[x] = 1; x = st.freed[x] ? null : st.nodes[x].next; } });
      return seen;
    }
    function listFromTop(st) { var out = [], x = st.vars[HEAD], guard = 0; while (x && guard++ < 30) { if (st.freed[x]) { out.push("✗"); break; } out.push(st.nodes[x].v); x = st.nodes[x].next; } return out; }
    function draw(lostIds) {
      var r = reach(S), ids = Object.keys(S.nodes).filter(function (k) { return !S.freed[k]; });
      // lay the nodes out in list order from top, then the others
      var order2 = [], x = S.vars[HEAD], guard = 0;
      while (x && order2.indexOf(x) < 0 && guard++ < 30) { if (!S.freed[x]) order2.push(x); x = S.freed[x] ? null : S.nodes[x].next; }
      ids.forEach(function (k) { if (order2.indexOf(k) < 0) order2.push(k); });
      var W2 = 92, pos = {};
      order2.forEach(function (k, i) { pos[k] = { x: 24 + i * W2, y: 70 }; });
      var w = 48 + order2.length * W2, hpx = 150;
      var svg = '<svg class="ql-svg" viewBox="0 0 ' + w + " " + hpx + '" width="' + w + '" height="' + hpx + '" role="img" aria-label="the linked list"><defs><marker id="qlA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="ql-ah"/></marker></defs>';
      order2.forEach(function (k) {
        var nd = S.nodes[k], p = pos[k], lost = !r[k];
        svg += '<g class="ql-node' + (lost ? " lost" : "") + '"><rect x="' + p.x + '" y="' + p.y + '" width="40" height="30"/><rect class="nx" x="' + (p.x + 40) + '" y="' + p.y + '" width="18" height="30"/><text x="' + (p.x + 20) + '" y="' + (p.y + 16) + '">' + esc(nd.v) + "</text></g>";
        if (nd.next && pos[nd.next]) {
          var q = pos[nd.next];
          if (q.x > p.x) svg += '<path class="ql-arrow" d="M' + (p.x + 49) + "," + (p.y + 15) + " L" + (q.x - 2) + "," + (q.y + 15) + '" marker-end="url(#qlA)"/>';
          else svg += '<path class="ql-arrow back" d="M' + (p.x + 49) + "," + (p.y + 30) + " C" + (p.x + 49) + "," + (p.y + 70) + " " + (q.x + 20) + "," + (q.y + 70) + " " + (q.x + 20) + "," + (q.y + 32) + '" marker-end="url(#qlA)"/>';
        } else if (!nd.next) svg += '<text class="ql-null" x="' + (p.x + 49) + '" y="' + (p.y + 19) + '">∅</text>';
      });
      // pointer variables above their nodes
      var stack = {};
      Object.keys(S.vars).forEach(function (vname) {
        var t = S.vars[vname];
        if (!t || !pos[t]) return;
        var p = pos[t], n = stack[t] = (stack[t] || 0) + 1;
        svg += '<g class="ql-var' + (vname === HEAD ? " top" : "") + '"><text x="' + (p.x + 20) + '" y="' + (p.y - 32 + (n - 1) * -14 + 8) + '">' + esc(vname) + '</text><path class="ql-arrow v" d="M' + (p.x + 20) + "," + (p.y - 18) + " L" + (p.x + 20) + "," + (p.y - 3) + '" marker-end="url(#qlA)"/></g>';
      });
      svg += "</svg>";
      var nulls = Object.keys(S.vars).filter(function (k) { return S.vars[k] === null; });
      stage.innerHTML = svg + (nulls.length ? '<div class="small muted ql-nulls">' + nulls.map(esc).join(", ") + " = NULL</div>" : "");
      code.innerHTML = prog.length ? prog.map(function (l) { return CL.highlight(l); }).join("\n") : '<span class="muted">// nothing yet</span>';
    }
    function lv(st, expr) {
      // returns {get(), set(v), desc} for "x" or "x->next" or "x->next->next"
      var parts = expr.split("->");
      var base = parts[0].trim();
      if (!(base in st.vars)) throw new Error(base + " is not a pointer here.");
      var obj = null, field = null, id = st.vars[base];
      for (var i = 1; i < parts.length; i++) {
        if (id === null) throw new Error((i === 1 ? base : parts.slice(0, i).join("->")) + " is NULL, so it has no next.");
        if (st.freed[id]) throw new Error(parts.slice(0, i).join("->") + " points to a deleted node (a dangling pointer).");
        obj = id; field = parts[i].trim();
        if (field !== "next") throw new Error("Only next can be followed here.");
        if (i < parts.length - 1) id = st.nodes[id].next;
      }
      if (obj === null) return { get: function () { return st.vars[base]; }, set: function (v) { st.vars[base] = v; } };
      return { get: function () { return st.nodes[obj].next; }, set: function (v) { st.nodes[obj].next = v; } };
    }
    function exec(st, ln) {
      var m;
      if ((m = /^delete\s+(\w+)\s*;$/.exec(ln))) {
        var id = st.vars[m[1]];
        if (id === null) return;
        if (st.freed[id]) throw new Error("That node was already deleted (deleting twice crashes the program).");
        st.freed[id] = 1;
        return;
      }
      if ((m = /^(.+?)\s*=\s*(.+?)\s*;$/.exec(ln))) {
        var rhs = m[2].trim(), val;
        if (rhs === "NULL" || rhs === "nullptr") val = null;
        else val = lv(st, rhs).get();
        lv(st, m[1].trim()).set(val);
        return;
      }
      throw new Error("Cannot run " + ln);
    }
    function clone(st) { return JSON.parse(JSON.stringify(st)); }
    function check() {
      var got = listFromTop(S).join(" "), want = String(b.goal).trim();
      var r = reach(S), lost = Object.keys(S.nodes).filter(function (k) { return !S.freed[k] && !r[k]; });
      if (lost.length) {
        ctx.miss("A node is lost: nothing points to " + lost.map(function (k) { return S.nodes[k].v; }).join(", ") + " any more, so it can never be reached (or deleted): a memory leak, and the rest of the list after it is gone too. Undo and change the order of the statements.");
        return;
      }
      // optional: where pointers must end up, like at="curr=30 prev=20" (NULL allowed)
      var atOk = String(b.at || "").split(/\s+/).filter(Boolean).every(function (pair) {
        var m2 = /^(\w+)=(\S+)$/.exec(pair);
        if (!m2) return true;
        var id2 = S.vars[m2[1]];
        return m2[2] === "NULL" ? id2 === null || id2 === undefined : id2 && !S.freed[id2] && String(S.nodes[id2].v) === m2[2];
      });
      if (got === want && atOk && (!b.freed || Object.keys(S.freed).length >= +b.freed)) { pal.querySelectorAll("button").forEach(function (x) { x.disabled = true; }); wrap.classList.add("solved"); ctx.ok("The list is now <b>" + got.split(" ").join(" → ") + "</b>." + (b.expl ? " " + CL.inline(b.expl) : "")); }
    }
    pal.addEventListener("click", function (e) {
      var bt = e.target.closest(".ql-stmt");
      if (!bt || wrap.classList.contains("solved")) return;
      var before = clone(S);
      try { exec(S, bt._ln); }
      catch (err) { S = before; ctx.miss(esc(err.message)); return; }
      hist.push(before); prog.push(bt._ln);
      draw();
      check();
    });
    bar.addEventListener("click", function (e) {
      var x = e.target.closest("[data-a]");
      if (!x || wrap.classList.contains("solved")) return;
      if (x.getAttribute("data-a") === "undo" && hist.length) { S = hist.pop(); prog.pop(); draw(); }
      if (x.getAttribute("data-a") === "reset") { S = init(); hist = []; prog = []; draw(); }
    });
    draw();
  };

  // ---------------------------------------------------------------- a Code Gym exercise inside the story
  QW.code = function (host, b, ctx) {
    var D = window.CODELAB_DATA, e = D.exercises.filter(function (x) { return x.id === b.ex; })[0];
    if (!e) { host.appendChild(h("p", "muted", "This challenge is not available.")); ctx.ok(""); return; }
    var store = CL.store, st = store.ex[e.id] = store.ex[e.id] || {};
    var wrap = h("div", "qw qw-code");
    var head = h("div", "qw-codeh", '<b>' + esc(e.title) + '</b><span class="small muted">A real coding challenge: write it, then run the tests. It counts in the Code Gym too.</span>');
    wrap.appendChild(head);
    var pr = h("div", "qw-codep");
    pr.appendChild(CL.renderMd(e.prompt));
    wrap.appendChild(pr);
    var ed = new CL.Editor(wrap, { value: st.code || e.code, label: "Your code for " + e.title, tools: true, onRun: function () { run(); } });
    ed.onChange(function (v) { st.code = v; CL.save(); });
    var bar = h("div", "qw-row", '<button type="button" class="px-btn primary" data-a="run">▶ Run the tests</button><button type="button" class="px-btn small ghost" data-a="hint">Hint</button><button type="button" class="px-btn small ghost" data-a="sol" hidden>Show the model solution</button><a class="px-btn small ghost" href="#ex-' + esc(e.id) + '">Open in the Code Gym</a>');
    wrap.appendChild(bar);
    var res = h("div", "qw-tests");
    wrap.appendChild(res);
    host.appendChild(wrap);
    var runner = CL.Runner.create(), fails = 0, hints = 0;
    ctx.onDestroy(function () { runner.destroy(); });
    function norm2(s) { return String(s || "").replace(/\r/g, "").split("\n").map(function (l) { return l.replace(/\s+$/, ""); }).join("\n").replace(/\n+$/, ""); }
    function run() {
      var code = ed.getValue();
      res.innerHTML = '<div class="small muted"><i class="t-spin"></i> Running ' + e.tests.length + " tests…</div>";
      var jobs = e.tests.map(function (t) { return { src: CL.assemble(e, code, t), opts: { stdin: t.stdin || "", maxSteps: 2000000 } }; }), got = [];
      runner.batch(jobs, {
        onResult: function (i, r) { got[i] = r; if (i === 0 && !r.compiled) { runner.stop(true); show(); } },
        onDone: show
      });
      function show() {
        if (show.done) return;
        show.done = true;
        res.innerHTML = "";
        if (got[0] && !got[0].compiled) { fails++; res.appendChild(h("div", "errbox", "<b>It does not compile" + (got[0].err.line ? " (line " + got[0].err.line + ")" : "") + ".</b> " + esc(got[0].err.msg) + (got[0].err.hint ? '<div class="hint">' + esc(got[0].err.hint) + "</div>" : ""))); if (got[0].err.line) ed.mark(got[0].err.line, "err", got[0].err.msg); ctx.miss("Fix the compile error first."); after(); return; }
        var pass = 0;
        e.tests.forEach(function (t, i) {
          var r = got[i], ok = r && r.compiled && !r.err && norm2(r.out) === norm2(t.expect);
          if (ok) pass++;
          var row = h("div", "qw-test " + (ok ? "pass" : "fail"), (ok ? "✓ " : "✗ ") + esc(t.hidden ? "Hidden test: " + t.name : t.name));
          if (!ok && !t.hidden) row.appendChild(h("div", "qw-test-d", "Expected <code>" + esc((t.expect || "").slice(0, 160)) + "</code>, got <code>" + esc(((r && r.out) || (r && r.err ? r.err.msg : "")).slice(0, 160)) + "</code>"));
          res.appendChild(row);
        });
        if (pass === e.tests.length) {
          if (!st.passed) { st.passed = true; CL.save(); CL.Progress.log("x"); }
          bar.querySelector('[data-a="sol"]').hidden = false;
          ctx.ok("All " + pass + " tests pass. " + (e.explain ? CL.inline(e.explain.split("\n")[0]) : ""));
        } else { fails++; ctx.miss(pass + " of " + e.tests.length + " tests pass. Read the failing test, fix the code, and run again."); after(); }
      }
    }
    function after() { if (fails >= 2) bar.querySelector('[data-a="sol"]').hidden = false; }
    bar.addEventListener("click", function (ev) {
      var x = ev.target.closest("[data-a]");
      if (!x) return;
      var a = x.getAttribute("data-a");
      if (a === "run") run();
      if (a === "hint") { if (hints < e.hints.length) { var hb = h("div", "qw-hint"); hb.appendChild(CL.renderMd("**Hint " + (hints + 1) + ".** " + e.hints[hints])); res.parentNode.insertBefore(hb, res); hints++; } if (hints >= e.hints.length) x.disabled = true; }
      if (a === "sol") { var sb = h("div", "qw-sol"); sb.appendChild(h("div", "ql-h", "Model solution")); sb.appendChild(CL.codeBlock(e.solutionPart || e.solution)); wrap.appendChild(sb); x.hidden = true; if (!wrap.classList.contains("passed")) { wrap.classList.add("passed"); ctx.ok("Study the model solution, then try writing it again from memory in the Code Gym."); } }
    });
  };

  // ---------------------------------------------------------------- optional extras: a lab with your values, stepping through memory
  QW.openLab = function (id, preset, title) {
    if (!CL.Labs || !CL.Labs[id]) return;
    var m = h("div", "modal quest-lab");
    m.setAttribute("role", "dialog");
    m.setAttribute("aria-modal", "true");
    var D = window.CODELAB_DATA, lab = D.labs.filter(function (l) { return l.id === id; })[0] || { title: id, intro: "" };
    var inner = h("div", "modal-in", '<div class="modal-h"><h3>' + esc(title || lab.title) + '</h3><button type="button" class="px-btn small" data-close>Close</button></div><p class="small muted">Change the values in the controls, run it, and step through. Close this window to go back to the story.</p>');
    m.appendChild(inner);
    var host = h("div", "lab");
    inner.appendChild(host);
    document.body.appendChild(m);
    document.body.style.overflow = "hidden";
    var inst = null;
    try { inst = CL.Labs[id](host, preset || null); } catch (e) { host.innerHTML = '<p class="muted">The lab could not open.</p>'; }
    function close() { try { if (inst && inst.stop) inst.stop(); if (inst && inst.destroy) inst.destroy(); } catch (e) { /* ignore */ } m.remove(); document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    document.addEventListener("keydown", onKey);
    m.addEventListener("click", function (e) { if (e.target === m || e.target.closest("[data-close]")) close(); });
  };
  QW.lab = function (host, b, ctx) {
    var preset = null;
    try { preset = b.preset ? JSON.parse(b.preset) : null; } catch (e) { preset = null; }
    var wrap = h("div", "qw qw-labbtn");
    wrap.innerHTML = '<div class="qw-q">' + CL.inline(b.q || "Try it with your own values.") + '</div><button type="button" class="px-btn primary">🔬 Open the lab with your own values</button>';
    wrap.querySelector("button").addEventListener("click", function () { QW.openLab(b.id, preset); ctx.bonus("lab:" + b.id, 5, "explored a lab"); });
    host.appendChild(wrap);
    ctx.ok("");
  };
  QW.memory = function (host, b, ctx) {
    var wrap = h("div", "qw qw-mem");
    wrap.appendChild(h("div", "qw-q", CL.inline(b.q || "Step through it and watch memory.")));
    var ed = new CL.Editor(wrap, { value: b.code, label: "Program" });
    ed.scroll.style.maxHeight = "360px";
    var bar = h("div", "qw-row", '<button type="button" class="px-btn primary" data-a="viz">👣 Step through it</button><button type="button" class="px-btn small" data-a="run">▶ Run</button>');
    wrap.appendChild(bar);
    var out = h("div", "run"), term = null;
    wrap.appendChild(out);
    bar.addEventListener("click", function (e) {
      var x = e.target.closest("[data-a]");
      if (!x) return;
      if (x.getAttribute("data-a") === "viz") { CL.openViz(ed.getValue(), { title: b.title || "Step through the program", stdin: b.stdin || "" }); ctx.bonus("mem:" + (b.title || "x"), 3, "stepped through memory"); }
      else CL.runInTerminal(out, ed, { stdin: b.stdin || "", getTerm: function () { return term; }, setTerm: function (t) { term = t; } });
    });
    host.appendChild(wrap);
    ctx.ok("");
  };
})(CL);
