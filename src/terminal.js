/* COMP 2611 Code Lab — the terminal. Shows a program's output as it runs; when the program reads cin, a cursor appears
   right where the program is waiting and you type the line, like a real console. Ctrl+C stops, Ctrl+D ends the input,
   Ctrl+L clears. Compile errors are printed the way g++ prints them (file:line:column: error, the line, a caret) and
   clicking one jumps to the code. With a shell, the idle prompt takes commands (the IDE provides them). */
(function (CL) {
  "use strict";
  var esc = CL.esc;

  function Terminal(host, opts) {
    var self = this;
    this.opts = opts = opts || {};
    this.runner = CL.Runner.create();
    var el = this.el = document.createElement("div");
    el.className = "term" + (opts.cls ? " " + opts.cls : "");
    el.innerHTML = '<div class="term-bar"><span class="term-dots" aria-hidden="true"><i></i><i></i><i></i></span><span class="term-title">' + esc(opts.title || "Terminal") + '</span>' +
      '<span class="term-status" aria-live="polite"></span><span class="term-acts">' +
      '<button type="button" class="term-btn stop" data-a="stop" title="Stop the program (Ctrl+C)" hidden>■ Stop</button>' +
      '<button type="button" class="term-btn" data-a="eof" title="End of input: cin gets nothing more (Ctrl+D)" hidden>EOF</button>' +
      '<button type="button" class="term-btn" data-a="copy" title="Copy everything in the terminal">Copy</button>' +
      '<button type="button" class="term-btn" data-a="clear" title="Clear the terminal (Ctrl+L)">Clear</button></span></div>' +
      '<div class="term-body" tabindex="-1"><div class="term-out" role="log" aria-label="Terminal output"></div></div>';
    host.appendChild(el);
    this.body = el.querySelector(".term-body");
    this.out = el.querySelector(".term-out");
    this.status = el.querySelector(".term-status");
    this.btnStop = el.querySelector('[data-a="stop"]');
    this.btnEof = el.querySelector('[data-a="eof"]');
    if (opts.height) this.body.style.height = opts.height;
    this.history = [];
    this.hpos = 0;
    this.session = null;
    this.input = null;
    el.querySelector(".term-acts").addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      var a = b.getAttribute("data-a");
      if (a === "stop") self.stop();
      if (a === "eof") self.eof();
      if (a === "clear") { self.clear(); self.idle(); }
      if (a === "copy") self.copy();
    });
    // clicking anywhere in the terminal (but not on a link or button, and not while selecting text) focuses the input
    this.body.addEventListener("mouseup", function (e) {
      if (e.target.closest("a, button, input")) return;
      var sel = window.getSelection && window.getSelection();
      if (sel && String(sel).length) return;
      self.focus();
    });
    this.body.addEventListener("click", function (e) {
      var loc = e.target.closest("[data-loc]");
      if (loc && self.opts.onLocate) { e.preventDefault(); var p = loc.getAttribute("data-loc").split(":"); self.opts.onLocate(p.slice(0, -1).join(":"), +p[p.length - 1]); }
    });
    el.addEventListener("keydown", function (e) { self.onKey(e); });
    if (opts.welcome) this.print(opts.welcome, "t-dim");
    this.idle();
  }
  var TP = Terminal.prototype;

  // ---------------------------------------------------------------- printing
  TP.scroll = function () {
    var b = this.body;
    if (this.stick !== false) b.scrollTop = b.scrollHeight;
  };
  TP.node = function (text, cls) {
    var s = document.createElement("span");
    if (cls) s.className = cls;
    s.textContent = text;
    return s;
  };
  TP.print = function (text, cls) {
    this.removeInput();
    this.out.appendChild(this.node(String(text) + (/\n$/.test(text) ? "" : "\n"), cls));
    this.trim();
    this.scroll();
  };
  TP.printHtml = function (html, cls) {
    this.removeInput();
    // a block starts on its own line anyway: drop the newline that ends the text before it, so no empty line appears
    var last = this.lastNode();
    if (last && last.nodeType === 1 && last.tagName === "SPAN" && /\n$/.test(last.textContent)) last.textContent = last.textContent.slice(0, -1);
    var d = document.createElement("div");
    d.className = "t-block" + (cls ? " " + cls : "");
    d.innerHTML = html;
    this.out.appendChild(d);
    this.trim();
    this.scroll();
    return d;
  };
  TP.append = function (text, cls) {
    if (!text) return;
    var last = this.out.lastChild;
    if (last && last.nodeType === 1 && last.tagName === "SPAN" && (last.className || "") === (cls || "") && !last.hasAttribute("data-keep")) last.textContent += text;
    else this.out.appendChild(this.node(text, cls));
  };
  // keep the terminal from growing without end (a program that prints a million lines)
  TP.trim = function () {
    var n = this.out.childNodes.length;
    if (n > 4000) { for (var i = 0; i < n - 3000; i++) this.out.removeChild(this.out.firstChild); this.out.insertBefore(this.node("… (older lines removed)\n", "t-dim"), this.out.firstChild); }
  };
  TP.lastNode = function () { var n = this.out.lastChild; while (n && n.nodeType === 8) n = n.previousSibling; return n; };
  TP.ensureNewline = function () {
    var n = this.lastNode();
    if (n && n.nodeType === 1 && n.tagName === "SPAN" && n.textContent && !/\n$/.test(n.textContent)) this.append("\n", "");
  };
  TP.clear = function () { this.removeInput(); this.out.innerHTML = ""; };
  TP.text = function () { return this.out.innerText || this.out.textContent || ""; };
  TP.copy = function () {
    var t = this.text(), self = this;
    function done() { self.flash("Copied"); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, function () { self.flash("Could not copy"); });
    else { var ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (e) { /* ignore */ } ta.remove(); }
  };
  TP.flash = function (msg) {
    var s = this.status, old = s.innerHTML;
    s.textContent = msg;
    setTimeout(function () { if (s.textContent === msg) s.innerHTML = old; }, 1200);
  };
  TP.setStatus = function (html, cls) { this.status.innerHTML = html || ""; this.status.className = "term-status" + (cls ? " " + cls : ""); };
  TP.focus = function () { if (this.input) { try { this.input.focus({ preventScroll: true }); } catch (e) { this.input.focus(); } } else this.body.focus({ preventScroll: true }); };
  TP.busy = function () { return !!this.session; };

  // ---------------------------------------------------------------- the input line
  TP.removeInput = function () {
    if (this.inputWrap) {
      // remember that the person was typing here, so the next input line keeps the keyboard
      if (this.input && document.activeElement === this.input) this.keepFocus = true;
      this.inputWrap.remove(); this.inputWrap = null; this.input = null;
    }
  };
  TP.makeInput = function (kind, promptText, onEnter) {
    var self = this;
    this.removeInput();
    var wrap = document.createElement("span");
    wrap.className = "t-inwrap " + kind;
    if (promptText) wrap.appendChild(this.node(promptText, "t-prompt"));
    var inp = document.createElement("input");
    inp.type = "text";
    inp.className = "t-in";
    inp.spellcheck = false;
    inp.autocomplete = "off";
    inp.setAttribute("autocapitalize", "off");
    inp.setAttribute("autocorrect", "off");
    inp.setAttribute("enterkeyhint", "send");
    inp.setAttribute("aria-label", kind === "stdin" ? "Type the program's input and press Enter" : "Type a command and press Enter");
    function size() { inp.style.width = Math.max(2, inp.value.length + 2) + "ch"; }
    inp.addEventListener("input", size);
    inp.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var v = inp.value;
        // a pasted block of several lines arrives as one value with no newlines in an <input>; handled in paste below
        onEnter(v);
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        var H = kind === "stdin" ? (self.inHistory = self.inHistory || []) : self.history;
        if (!H.length) return;
        e.preventDefault();
        if (self.hkind !== kind) { self.hkind = kind; self.hpos = H.length; }
        self.hpos = Math.max(0, Math.min(H.length, self.hpos + (e.key === "ArrowUp" ? -1 : 1)));
        inp.value = H[self.hpos] || "";
        size();
      }
    });
    inp.addEventListener("paste", function (e) {
      var t = (e.clipboardData || window.clipboardData).getData("text");
      if (t && /\n/.test(t)) {
        e.preventDefault();
        var lines = t.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
        lines[0] = inp.value + lines[0];
        if (kind === "stdin" && self.session) self.sendLines(lines);
        else onEnter(lines[0]);
      }
    });
    wrap.appendChild(inp);
    this.out.appendChild(wrap);
    this.inputWrap = wrap;
    this.input = inp;
    size();
    this.scroll();
    var want = this.keepFocus || (kind === "stdin" ? this.wantFocus !== false : this.opts.autofocus !== false);
    this.keepFocus = false;
    if (want) this.focus();
    return inp;
  };

  // the idle state: a shell prompt, or a quiet hint
  TP.idle = function () {
    var self = this;
    this.btnStop.hidden = true;
    this.btnEof.hidden = true;
    if (this.opts.shell) {
      var pr = typeof this.opts.prompt === "function" ? this.opts.prompt() : (this.opts.prompt || "$ ");
      this.makeInput("shell", pr, function (line) {
        self.removeInput();
        self.append(pr, "t-prompt");
        self.append(line + "\n", "t-cmdline");
        if (line.trim()) { self.history.push(line); if (self.history.length > 100) self.history.shift(); }
        self.hpos = self.history.length;
        var r = self.opts.onCommand ? self.opts.onCommand(line.trim(), self) : null;
        if (!self.session) {
          if (r && typeof r.then === "function") r.then(function () { if (!self.session) self.idle(); });
          else self.idle();
        }
      });
    } else if (!this.session) this.removeInput();
  };

  TP.onKey = function (e) {
    var k = e.key.toLowerCase();
    if (e.ctrlKey && !e.altKey && !e.metaKey) {
      if (k === "c") {
        var sel = window.getSelection && String(window.getSelection());
        if (sel) return;   // copying text
        if (this.session) { e.preventDefault(); this.stop(); }
        else if (this.input) { e.preventDefault(); this.append((this.input.value || "") + "^C\n", "t-dim"); this.input.value = ""; this.idle(); }
      } else if (k === "d") { if (this.session) { e.preventDefault(); this.eof(); } }
      else if (k === "l") { e.preventDefault(); this.clear(); if (this.session && this.session.waiting) this.askLine(); else this.idle(); }
    }
  };

  // ---------------------------------------------------------------- running a program
  // o: { src, files, cmd, prepared: [lines], linked, onDone(res, session), title }
  TP.exec = function (o) {
    var self = this;
    if (this.session) this.stop(true);
    this.removeInput();
    this.ensureNewline();
    var s = this.session = {
      o: o, lines: (o.prepared || []).slice(), eof: false, now: Math.floor(Date.now() / 1000),
      shownOut: 0, shownEcho: 0, out: "", echoes: [], errs: [], t0: Date.now(), runs: 0, waiting: false, steps: 0
    };
    if (o.cmd) { this.append((typeof this.opts.prompt === "function" ? this.opts.prompt() : this.opts.prompt || "$ "), "t-prompt"); this.append(o.cmd + "\n", "t-cmdline"); }
    s.mark = document.createComment("run");
    this.out.appendChild(s.mark);
    this.wantFocus = o.focus !== false;
    this.start();
  };
  TP.start = function () {
    var self = this, s = this.session;
    if (!s) return;
    s.runs++;
    s.waiting = false;
    s.acc = "";
    s.accEcho = [];
    s.accErr = [];
    this.btnStop.hidden = false;
    this.btnEof.hidden = true;
    this.setStatus('<i class="t-spin" aria-hidden="true"></i> running', "run");
    var started = Date.now();
    var opts = { stdinLines: s.lines, stdinEOF: s.eof, files: s.o.files || {}, now: s.now };
    if (s.o.maxSteps) opts.maxSteps = s.o.maxSteps;
    this.runner.run(s.o.src, opts, {
      onOut: function (chunk, info) {
        if (self.session !== s) return;
        s.acc += chunk || "";
        if (info.echoes) s.accEcho = s.accEcho.concat(info.echoes);
        s.steps = info.steps;
        self.setStatus('<i class="t-spin" aria-hidden="true"></i> running · ' + fmtSteps(info.steps) + " steps · " + fmtMs(Date.now() - started), "run");
        self.catchUp(s.acc, s.accEcho, null);
      },
      onDone: function (res) {
        if (self.session !== s) return;
        self.finish(res);
      }
    });
  };
  function fmtSteps(n) { return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n); }
  function fmtMs(ms) { return ms < 1000 ? ms + " ms" : (ms / 1000).toFixed(ms < 10000 ? 2 : 1) + " s"; }
  CL.fmtMs = fmtMs;
  // show whatever part of out / echoes is not on screen yet. A replay re-sends the output from the start: it matches what
  // is already shown, so only the new part is added. If it ever differs (a program that behaves differently each run),
  // the program's output is redrawn.
  TP.catchUp = function (out, echoes, errs) {
    var s = this.session;
    if (errs) s.errs = errs;
    if (out.length < s.shownOut && echoes.length <= s.shownEcho) return;
    if (s.out.slice(0, Math.min(s.shownOut, out.length)) !== out.slice(0, Math.min(s.shownOut, out.length))) return this.redraw(out, echoes);
    s.out = out;
    s.echoes = echoes;
    this.removeInput();
    var guard = 0;
    while (guard++ < 100000) {
      var ne = s.echoes[s.shownEcho];
      var stop = ne ? Math.min(ne.at, s.out.length) : s.out.length;
      if (stop > s.shownOut) { this.appendOut(s.out.slice(s.shownOut, stop), s.shownOut); s.shownOut = stop; }
      if (ne && ne.at <= s.shownOut) {
        if (!ne.shown) this.append(ne.text + "\n", "t-echo");
        s.shownEcho++;
        continue;
      }
      break;
    }
    this.trim();
    this.scroll();
  };
  TP.appendOut = function (text, from) {
    var s = this.session, errs = s.errs || [], pos = from, end = from + text.length;
    for (var i = 0; i < errs.length && pos < end; i++) {
      var r = errs[i];
      if (r[1] <= pos || r[0] >= end) continue;
      if (r[0] > pos) { this.append(text.slice(pos - from, r[0] - from), ""); pos = r[0]; }
      var e2 = Math.min(r[1], end);
      this.append(text.slice(pos - from, e2 - from), "t-err");
      pos = e2;
    }
    if (pos < end) this.append(text.slice(pos - from), "");
  };
  TP.redraw = function (out, echoes) {
    var s = this.session;
    // drop what this program printed so far, keep everything before it
    if (s.mark && s.mark.parentNode === this.out) { while (s.mark.nextSibling) this.out.removeChild(s.mark.nextSibling); }
    s.shownOut = 0; s.shownEcho = 0; s.out = ""; s.echoes = [];
    this.catchUp(out, echoes.map(function (e) { return { at: e.at, text: e.text }; }), null);
  };
  TP.finish = function (res) {
    var self = this, s = this.session;
    var o = s.o;
    if (!res.compiled) {
      this.session = null;
      this.btnStop.hidden = true;
      this.setStatus("compile error", "bad");
      this.compileError(res.err, o);
      if (o.onDone) o.onDone(res, s);
      this.idle();
      return;
    }
    this.catchUp(res.out || "", res.echoes || [], res.errRanges || []);
    if (res.needInput && !res.err) { s.waiting = true; this.askLine(); return; }
    // finished
    this.session = null;
    this.btnStop.hidden = true;
    this.btnEof.hidden = true;
    var ms = Date.now() - s.t0;
    if (s.out && !/\n$/.test(s.out)) this.append("\n", "");
    if (res.err) {
      this.runtimeError(res.err, o, res);
      this.setStatus(res.err.kind === "limit" ? "stopped" : "runtime error", "bad");
    } else {
      var leak = res.leaks ? ' · <span class="t-warnc">' + res.leaks + " object" + (res.leaks > 1 ? "s" : "") + " never deleted</span>" : "";
      this.printHtml('<span class="t-exit ' + (res.exitCode ? "bad" : "ok") + '">Process finished with exit code ' + res.exitCode + "</span>" + '<span class="t-dim"> · ' + fmtMs(ms) + " · " + fmtSteps(res.steps || 0) + " steps" + (s.runs > 1 ? " · " + s.lines.length + " line" + (s.lines.length === 1 ? "" : "s") + " typed" : "") + "</span>" + leak, "t-status");
      this.setStatus("exit " + res.exitCode + " · " + fmtMs(ms), res.exitCode ? "bad" : "ok");
    }
    (res.warnings || []).slice(0, 4).forEach(function (w) { self.warning(w, o); });
    if (o.onDone) o.onDone(res, s);
    this.idle();
  };
  TP.askLine = function () {
    var self = this, s = this.session;
    if (!s) return;
    this.btnEof.hidden = false;
    this.setStatus('<i class="t-blink" aria-hidden="true"></i> waiting for input', "wait");
    this.makeInput("stdin", "", function (v) { self.sendLines([v]); });
  };
  TP.sendLines = function (lines) {
    var s = this.session;
    if (!s) return;
    this.removeInput();
    var self = this;
    lines.forEach(function (v) {
      s.lines.push(v);
      self.inHistory = self.inHistory || [];
      if (v.trim()) self.inHistory.push(v);
    });
    this.hpos = (this.inHistory || []).length;
    // show the first typed line straight away, where the program is waiting; the replay places any others
    var first = { at: s.out.length, text: lines[0], shown: true };
    this.append(lines[0] + "\n", "t-echo");
    s.echoes = s.echoes.concat([first]);
    s.shownEcho = s.echoes.length;
    this.scroll();
    this.start();
  };
  TP.eof = function () {
    var s = this.session;
    if (!s) return;
    this.removeInput();
    this.append("^D\n", "t-dim");
    s.eof = true;
    this.start();
  };
  TP.stop = function (quiet) {
    var s = this.session;
    if (!s) return;
    this.runner.stop(true);
    this.session = null;
    this.removeInput();
    this.btnStop.hidden = true;
    this.btnEof.hidden = true;
    if (!quiet) {
      if (s.out && !/\n$/.test(s.out)) this.append("\n", "");
      this.append("^C\n", "t-dim");
      this.printHtml('<span class="t-exit bad">Stopped</span><span class="t-dim"> · you stopped the program after ' + fmtMs(Date.now() - s.t0) + (s.steps ? " · " + fmtSteps(s.steps) + " steps" : "") + "</span>", "t-status");
      this.setStatus("stopped", "bad");
      if (s.o.onDone) s.o.onDone({ stopped: true, compiled: true, out: s.out }, s);
    }
    this.idle();
  };

  // ---------------------------------------------------------------- errors, the g++ way
  function where(o, line) {
    if (o.linked) return CL.Project.where(o.linked, line);
    return { file: o.file || "main.cpp", line: line };
  }
  TP.loc = function (file, line, col) {
    return '<a href="#" class="t-loc" data-loc="' + esc(file + ":" + line) + '">' + esc(file) + ":" + line + (col ? ":" + col : "") + "</a>";
  };
  TP.srcLine = function (o, w) {
    var text = o.files && o.files[w.file] !== undefined ? o.files[w.file] : o.linked ? null : o.src;
    if (text == null) return "";
    var L = String(text).split("\n")[w.line - 1];
    return L === undefined ? "" : L;
  };
  TP.excerpt = function (o, w, col, len) {
    var L = this.srcLine(o, w);
    if (!L.trim()) return "";
    var n = String(w.line);
    var html = '<div class="t-src"><span class="t-ln">' + esc(n) + " | </span>" + esc(L.replace(/\t/g, "    ")) + "</div>";
    if (col) {
      var before = L.slice(0, col - 1).replace(/\t/g, "    ");
      html += '<div class="t-src"><span class="t-ln">' + " ".repeat(n.length) + " | </span>" + " ".repeat(before.length) + '<span class="t-caret">^' + "~".repeat(Math.max(0, Math.min((len || 1) - 1, 40))) + "</span></div>";
    }
    return html;
  };
  TP.compileError = function (err, o) {
    var w = err.file ? { file: err.file, line: err.line } : where(o, err.line);
    var col = err.col || 0, len = err.z && err.s !== undefined ? err.z - err.s : 1;
    var html = '<div class="t-gcc">' + (w.line ? this.loc(w.file, w.line, col) + ": " : "") + '<span class="t-errw">error:</span> ' + esc(err.msg) + "</div>" + this.excerpt(o, w, col, len) +
      (err.hint ? '<div class="t-hint"><b>hint:</b> ' + esc(err.hint) + "</div>" : "") +
      (/not supported|does not support|not available here/.test(err.msg) ? '<div class="t-hint">This runner covers the C++ used in COMP 2611, not all of C++. <a href="#cpp">See what it supports</a>.</div>' : "") +
      '<div class="t-dim">compilation terminated: 1 error</div>';
    var d = this.printHtml(html, "t-errblock");
    this.explainBtn(d, err, o, "compile error");
    if (this.opts.onError) this.opts.onError(w, err, "compile");
  };
  TP.runtimeError = function (err, o, res) {
    var w = where(o, err.line);
    var title = err.kind === "limit" ? "Stopped" : "Runtime error";
    var html = '<div class="t-gcc"><span class="t-errw">' + title + "</span>" + (w.line ? " at " + this.loc(w.file, w.line) : "") + ": " + esc(err.msg) + "</div>" + this.excerpt(o, w, 0) +
      (err.hint ? '<div class="t-hint"><b>hint:</b> ' + esc(err.hint) + "</div>" : "") +
      '<div class="t-dim">Process ended' + (err.kind === "limit" ? " by the runner" : " with an error (a real program would crash here, often with no message)") + " · " + fmtSteps(res.steps || 0) + " steps</div>";
    var d = this.printHtml(html, "t-errblock");
    this.explainBtn(d, err, o, err.kind === "limit" ? "problem" : "runtime error");
    if (this.opts.onError) this.opts.onError(w, err, "runtime");
  };
  TP.warning = function (wn, o) {
    var w = where(o, wn.line);
    this.printHtml((w.line ? this.loc(w.file, w.line) + ": " : "") + '<span class="t-warnw">warning:</span> ' + esc(wn.msg), "t-warnblock");
    if (this.opts.onError) this.opts.onError(w, wn, "warning");
  };
  TP.explainBtn = function (host, err, o, kind) {
    if (!CL.explainErrorRow) return;
    var w = where(o, err.line), text = o.files && o.files[w.file] !== undefined ? o.files[w.file] : o.src;
    var row = CL.explainErrorRow(text, { line: w.line, msg: err.msg, hint: err.hint }, kind);
    if (row) host.appendChild(row);
  };
  TP.destroy = function () { this.runner.destroy(); this.session = null; };
  CL.Terminal = Terminal;
})(CL);
