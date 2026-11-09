/* COMP 2611 Code Lab — syntax highlighting and a small code editor. */
var CL = typeof CL !== "undefined" ? CL : {};
(function (CL) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  CL.esc = esc;

  var KW = new Set("if else while do for return break continue switch case default new delete true false sizeof using namespace nullptr NULL struct class enum typedef const static public private template typename this goto".split(" "));
  var TYPES = new Set("int long short unsigned signed char bool float double void string ifstream ofstream fstream istream ostream stringstream istringstream ostringstream size_t".split(" "));
  var STD = new Set("cout cin endl cerr setw setprecision fixed left right setfill boolalpha getline main".split(" "));
  var TOKEN = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(^[ \t]*#[^\n]*)|("(?:[^"\\\n]|\\.)*"?)|('(?:[^'\\\n]|\\.)*'?)|(\b\d+\.?\d*(?:[eE][+-]?\d+)?[fFuUlL]*\b|\.\d+)|([A-Za-z_]\w*)|([^\w\s])/gm;

  // Returns highlighted HTML for C++ source. structNames: optional set of user type names.
  CL.highlight = function (code, structNames) {
    var names = structNames || new Set();
    if (!structNames) {
      var re = /\b(?:struct|class|enum)\s+([A-Za-z_]\w*)/g, m;
      while ((m = re.exec(code))) names.add(m[1]);
    }
    var out = "", last = 0, mm;
    TOKEN.lastIndex = 0;
    while ((mm = TOKEN.exec(code))) {
      if (mm.index > last) out += esc(code.slice(last, mm.index));
      var t = mm[0], cls = null;
      if (mm[1]) cls = "c";
      else if (mm[2]) cls = "pp";
      else if (mm[3] || mm[4]) cls = "s";
      else if (mm[5]) cls = "n";
      else if (mm[6]) {
        if (KW.has(t)) cls = "k";
        else if (TYPES.has(t) || names.has(t)) cls = "t";
        else if (STD.has(t)) cls = "b";
        else if (/^\s*\(/.test(code.slice(TOKEN.lastIndex, TOKEN.lastIndex + 3))) cls = "f";
      } else if (mm[7]) cls = /[-+*/%=<>!&|^~?:]/.test(t) ? "o" : null;
      out += cls ? '<span class="h-' + cls + '">' + esc(t) + "</span>" : esc(t);
      last = TOKEN.lastIndex;
      if (mm[0].length === 0) TOKEN.lastIndex++;
    }
    out += esc(code.slice(last));
    return out;
  };

  // Highlight then split into lines, keeping spans balanced on each line.
  CL.highlightLines = function (code) {
    var html = CL.highlight(code);
    var lines = [], cur = "", open = [];
    var re = /(<span class="[^"]*">)|(<\/span>)|(\n)|([^<\n]+)/g, m;
    while ((m = re.exec(html))) {
      if (m[1]) { open.push(m[1]); cur += m[1]; }
      else if (m[2]) { open.pop(); cur += m[2]; }
      else if (m[3]) {
        cur += "</span>".repeat(open.length);
        lines.push(cur);
        cur = open.join("");
      } else cur += m[4];
    }
    lines.push(cur);
    return lines;
  };

  // Static code block with line numbers.
  CL.codeBlock = function (code, opts) {
    opts = opts || {};
    var pre = document.createElement("pre");
    pre.className = "code" + (opts.cls ? " " + opts.cls : "");
    var lines = CL.highlightLines(code.replace(/\s+$/, ""));
    var start = opts.start || 1;
    pre.innerHTML = '<code style="counter-reset: ln ' + (start - 1) + '">' + lines.map(function (l, i) {
      var cls = "ln";
      if (opts.marks && opts.marks[i + start]) cls += " " + opts.marks[i + start];
      return '<span class="' + cls + '">' + (l || " ") + "</span>";
    }).join("\n") + "</code>";
    return pre;
  };

  // the line height follows the text size setting (settings.js sets CL.edLineH)
  function lh() { return CL.edLineH || 20; }
  CL.lineH = lh;

  function Editor(host, opts) {
    opts = opts || {};
    var self = this;
    this.opts = opts;
    this.host = host;
    this.el = document.createElement("div");
    this.el.className = "ed" + (opts.cls ? " " + opts.cls : "");
    this.el.innerHTML = '<div class="ed-scroll"><div class="ed-gutter" aria-hidden="true"></div><div class="ed-code"><div class="ed-marks"></div><pre class="ed-hl" aria-hidden="true"><code></code></pre>' +
      '<textarea class="ed-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" aria-label="' + esc(opts.label || "C++ code editor") + '"></textarea></div></div>';
    host.appendChild(this.el);
    this.scroll = this.el.querySelector(".ed-scroll");
    this.gutter = this.el.querySelector(".ed-gutter");
    this.codeEl = this.el.querySelector(".ed-code");
    this.marksEl = this.el.querySelector(".ed-marks");
    this.hl = this.el.querySelector(".ed-hl code");
    this.ta = this.el.querySelector(".ed-ta");
    if (opts.id) this.ta.id = opts.id;
    if (opts.maxHeight) this.scroll.style.maxHeight = opts.maxHeight;
    if (opts.minLines) this.scroll.style.minHeight = (opts.minLines * lh() + 16) + "px";
    this.marks = [];
    this.listeners = [];
    this.ta.addEventListener("input", function () { self.refresh(); self.fire(); });
    this.ta.addEventListener("keydown", function (e) { self.onKey(e); });
    this.ta.addEventListener("focus", function () { self.el.classList.add("focus"); });
    this.ta.addEventListener("blur", function () { self.el.classList.remove("focus"); });
    if (opts.readOnly) this.setReadOnly(true);
    this.setValue(opts.value || "");
    watchSize(this);
    // A click in the empty space below the last line (or anywhere the typing layer does not reach yet) still
    // focuses the editor; below the code it puts the cursor at the end, as desktop editors do.
    this.scroll.addEventListener("mousedown", function (e) {
      if (e.target === self.ta || e.button !== 0) return;
      if (e.target.closest && e.target.closest(".ed-gutter")) return;
      self.fit();
      e.preventDefault();
      self.focus();
      if (e.clientY >= self.ta.getBoundingClientRect().bottom - 4 && !self.ta.readOnly) {
        var end = self.ta.value.length;
        self.ta.setSelectionRange(end, end);
      }
    });
    if (CL.edInit) CL.edInit(this);
  }
  Editor.prototype.fire = function () {
    var v = this.getValue();
    this.listeners.forEach(function (f) { f(v); });
    if (this.opts.onChange) this.opts.onChange(v);
  };
  Editor.prototype.onChange = function (f) { this.listeners.push(f); };
  Editor.prototype.getValue = function () { return this.ta.value; };
  Editor.prototype.setValue = function (v) {
    this.ta.value = v.replace(/\r\n?/g, "\n");
    this.refresh();
  };
  Editor.prototype.setLang = function (lang) { this.opts.lang = lang; this.refresh(); };
  Editor.prototype.setReadOnly = function (b) {
    this.ta.readOnly = !!b;
    this.el.classList.toggle("ro", !!b);
  };
  Editor.prototype.focus = function () { try { this.ta.focus({ preventScroll: true }); } catch (e) { this.ta.focus(); } };
  Editor.prototype.refresh = function () {
    var v = this.ta.value;
    var n = v.split("\n").length;
    this.hl.innerHTML = (this.opts.lang === "text" ? esc(v) : CL.highlight(v)) + "\n ";
    if (this.lineCount !== n) {
      var g = "";
      for (var i = 1; i <= n; i++) g += "<span>" + i + "</span>";
      this.gutter.innerHTML = g;
      this.lineCount = n;
    }
    var h = n * lh() + 16;
    this.ta.style.height = h + "px";
    this.codeEl.style.height = h + "px";
    this.fit();
    this.drawMarks();
    if (this.afterRefresh) this.afterRefresh();
  };
  // The typing layer (a transparent textarea) must cover the whole code area, or clicks land on the coloured copy
  // underneath and the keyboard never reaches the editor. Its width comes from the page layout, which reads 0 while
  // the editor is not on screen yet (pages build their editors before attaching them, and some sit in closed
  // panels), so it is measured again whenever the editor's size changes. The stylesheet also keeps it at least as
  // wide as the visible area.
  Editor.prototype.fit = function () {
    var vis = this.scroll.clientWidth - this.gutter.offsetWidth;
    if (vis <= 0) return;
    var w = Math.max(this.hl.parentNode.scrollWidth, vis);
    if (Math.abs((this.fitW || 0) - w) < 1) return;
    this.fitW = w;
    this.ta.style.width = w + "px";
  };
  function watchSize(ed) {
    if (!window.ResizeObserver) return;
    var queued = false;
    // one observer per editor, so a removed editor is garbage collected with its observer
    new ResizeObserver(function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; ed.fit(); });
    }).observe(ed.el);
  }
  Editor.prototype.onKey = function (e) {
    var ta = this.ta;
    if (this.extKey && this.extKey(e)) return;
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (e.shiftKey && this.opts.onSubmit) this.opts.onSubmit();
      else if (this.opts.onRun) this.opts.onRun();
      return;
    }
    if (ta.readOnly) return;
    var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
    if (e.key === "Tab") {
      e.preventDefault();
      var ls = v.lastIndexOf("\n", s - 1) + 1;
      if (s !== en && v.slice(s, en).indexOf("\n") >= 0) {
        var block = v.slice(ls, en);
        var nb = e.shiftKey ? block.replace(/^(\t| {1,4})/gm, "") : block.replace(/^/gm, "\t");
        this.replaceRange(ls, en, nb);
        ta.selectionStart = ls;
        ta.selectionEnd = ls + nb.length;
      } else if (e.shiftKey) {
        var line = v.slice(ls);
        var m = /^(\t| {1,4})/.exec(line);
        if (m) { this.replaceRange(ls, ls + m[0].length, ""); ta.selectionStart = ta.selectionEnd = Math.max(ls, s - m[0].length); }
      } else {
        this.replaceRange(s, en, "\t");
        ta.selectionStart = ta.selectionEnd = s + 1;
      }
      this.refresh(); this.fire();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      var lineStart = v.lastIndexOf("\n", s - 1) + 1;
      var indent = /^[\t ]*/.exec(v.slice(lineStart, s))[0];
      var before = v.slice(lineStart, s).trim();
      var after = v.slice(en, v.indexOf("\n", en) < 0 ? v.length : v.indexOf("\n", en)).trim();
      var ins = "\n" + indent;
      if (/\{$/.test(before)) {
        ins += "\t";
        if (/^\}/.test(after)) {
          this.replaceRange(s, en, ins + "\n" + indent);
          ta.selectionStart = ta.selectionEnd = s + ins.length;
          this.refresh(); this.fire();
          return;
        }
      }
      this.replaceRange(s, en, ins);
      ta.selectionStart = ta.selectionEnd = s + ins.length;
      this.refresh(); this.fire();
      return;
    }
    if (e.key === "}" && s === en) {
      var ls2 = v.lastIndexOf("\n", s - 1) + 1;
      var pre = v.slice(ls2, s);
      if (/^[\t ]+$/.test(pre)) {
        var np = pre.replace(/(\t| {1,4})$/, "");
        this.replaceRange(ls2, s, np + "}");
        ta.selectionStart = ta.selectionEnd = ls2 + np.length + 1;
        e.preventDefault();
        this.refresh(); this.fire();
      }
    }
  };
  Editor.prototype.replaceRange = function (a, b, text) {
    var ta = this.ta;
    ta.focus();
    ta.setSelectionRange(a, b);
    var ok = false;
    try { ok = document.execCommand && document.execCommand("insertText", false, text); } catch (e) { ok = false; }
    if (!ok) ta.value = ta.value.slice(0, a) + text + ta.value.slice(b);
  };
  // cls: "err" | "cur" | "prev" | "warn"
  Editor.prototype.mark = function (line, cls, title) {
    this.marks.push({ line: line, cls: cls, title: title || "" });
    this.drawMarks();
  };
  Editor.prototype.clearMarks = function (cls) {
    this.marks = cls ? this.marks.filter(function (m) { return m.cls !== cls; }) : [];
    this.drawMarks();
  };
  Editor.prototype.drawMarks = function () {
    var html = "", gl = this.gutter.children;
    for (var i = 0; i < gl.length; i++) gl[i].className = "";
    this.marks.forEach(function (m) {
      html += '<div class="ed-mark ' + m.cls + '" style="top:' + (8 + (m.line - 1) * lh()) + 'px;height:' + lh() + 'px" title="' + esc(m.title) + '"></div>';
      if (gl[m.line - 1]) gl[m.line - 1].className = "g-" + m.cls;
    });
    this.marksEl.innerHTML = html;
  };
  Editor.prototype.revealLine = function (line) {
    var top = 8 + (line - 1) * lh(), sc = this.scroll;
    if (sc.scrollHeight <= sc.clientHeight + 2) {
      return;
    }
    if (top < sc.scrollTop + 10 || top > sc.scrollTop + sc.clientHeight - 40) sc.scrollTop = Math.max(0, top - sc.clientHeight / 3);
  };
  CL.Editor = Editor;
})(CL);
