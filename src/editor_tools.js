/* COMP 2611 Code Lab — editor tools added to CL.Editor: bracket pairs and matching, comment toggling, moving lines,
   tidying indentation, word completion, a symbol bar for phones and tablets, and a shortcut list. */
(function (CL) {
  "use strict";
  var E = CL.Editor.prototype, esc = CL.esc;
  var OPEN = { "(": ")", "[": "]", "{": "}" }, CLOSE = { ")": "(", "]": "[", "}": "{" };
  var coarse = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
  var WORDS = ("int double float char bool void long short unsigned const static struct enum typedef return if else while for do switch case default break continue " +
    "new delete NULL nullptr true false sizeof include iostream string cstring cmath fstream sstream iomanip using namespace std cout cin endl getline " +
    "ifstream ofstream stringstream setw setprecision fixed sqrt pow fabs floor ceil abs min max swap rand srand strlen strcpy strcmp strcat toupper tolower isdigit isalpha main").split(" ");

  // which characters are code, not inside a comment, string or character literal
  function codeMask(v) {
    var m = new Uint8Array(v.length), i = 0, n = v.length;
    while (i < n) {
      var c = v.charAt(i), d = v.charAt(i + 1);
      if (c === "/" && d === "/") { while (i < n && v.charAt(i) !== "\n") i++; continue; }
      if (c === "/" && d === "*") { var e = v.indexOf("*/", i + 2); i = e < 0 ? n : e + 2; continue; }
      if (c === '"' || c === "'") { i++; while (i < n && v.charAt(i) !== c && v.charAt(i) !== "\n") { if (v.charAt(i) === "\\") i++; i++; } i++; continue; }
      m[i] = 1; i++;
    }
    return m;
  }
  CL.codeMask = codeMask;
  function partner(v, i, m) {
    var c = v.charAt(i), depth = 0, j;
    if (OPEN[c]) { for (j = i; j < v.length; j++) { if (!m[j]) continue; if (v.charAt(j) === c) depth++; else if (v.charAt(j) === OPEN[c] && --depth === 0) return j; } }
    else if (CLOSE[c]) { for (j = i; j >= 0; j--) { if (!m[j]) continue; if (v.charAt(j) === c) depth++; else if (v.charAt(j) === CLOSE[c] && --depth === 0) return j; } }
    return -1;
  }
  // wrap the character at text offset idx of root in a span
  function wrapAt(root, idx, cls) {
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), pos = 0, n;
    while ((n = w.nextNode())) {
      var L = n.nodeValue.length;
      if (idx < pos + L) {
        var off = idx - pos, mid = n.splitText(off);
        mid.splitText(1);
        var sp = document.createElement("span");
        sp.className = cls;
        mid.parentNode.replaceChild(sp, mid);
        sp.appendChild(mid);
        return;
      }
      pos += L;
    }
  }
  // re-indent a whole program from its braces. Each open block remembers the indentation of the line that opened it;
  // switch cases sit one level in, and a one-line body after if/for/while/else (without braces) sits one level deeper.
  function tidy(v) {
    var lines = v.split("\n"), out = [], stack = [], pending = 0, parenCont = 0, inBlock = false, lastHead = "", elseAlone = false;
    lines.forEach(function (raw) {
      var line = raw.replace(/^[\t ]+/, "").replace(/[\t ]+$/, "");
      if (inBlock) { out.push(raw.replace(/[\t ]+$/, "")); if (raw.indexOf("*/") >= 0) inBlock = false; return; }
      if (!line) { out.push(""); return; }
      if (line.charAt(0) === "#") { out.push(line); return; }
      var m = codeMask(line), code = "";
      for (var i = 0; i < line.length; i++) code += m[i] ? line.charAt(i) : " ";
      var trimmed = code.replace(/\s+$/, "");
      var lead = 0;
      while (lead < trimmed.length && (trimmed.charAt(lead) === "}" || (lead > 0 && trimmed.charAt(lead) === " " && trimmed.indexOf("}", lead) === lead + 1))) lead += trimmed.charAt(lead) === "}" ? 1 : 1;
      lead = (trimmed.slice(0, lead).match(/\}/g) || []).length;
      var isLabel = /^(case\b[^:]*|default\s*):(?!:)/.test(line);
      // the course writes "else" and "if (...)" on separate lines at the same indentation: keep that style
      if (elseAlone && /^if\b/.test(line)) pending = Math.max(0, pending - 1);
      var ind, top = stack[stack.length - 1];
      if (lead > 0) {
        var f = null;
        for (var k = 0; k < lead && stack.length; k++) f = stack.pop();
        ind = f ? f.base : 0;
        pending = 0;
      } else {
        ind = (top ? top.base + 1 + (top.sw && !isLabel ? 1 : 0) : 0) + (isLabel ? 0 : pending) + parenCont;
      }
      out.push(new Array(Math.max(0, ind) + 1).join("\t") + line);
      var commentOnly = !trimmed.trim();
      // the braces and parentheses after any leading ones
      var parens = 0, seen = 0;
      for (var j = 0; j < trimmed.length; j++) {
        var c = trimmed.charAt(j);
        if (c === "}") { if (seen < lead) { seen++; continue; } if (stack.length) stack.pop(); }
        else if (c === "{") { stack.push({ base: ind, sw: /\bswitch\b/.test(trimmed.slice(0, j)) || (!trimmed.slice(0, j).trim() && lastHead === "switch") }); pending = 0; }
        else if (c === "(") parens++;
        else if (c === ")") parens--;
      }
      if (!commentOnly) {
        parenCont = Math.min(2, Math.max(0, parenCont + parens));
        var head = /^(if|for|while|else|do)\b/.test(line) || /^\}\s*(else|while)\b/.test(line);
        var ends = /[;{}:]$/.test(trimmed);
        if (head && !ends && parenCont === 0) pending = (lead ? 0 : pending) + 1;
        else if (/[;}]$/.test(trimmed) || isLabel) pending = 0;
        lastHead = /^switch\b/.test(line) && !/\{/.test(trimmed) ? "switch" : "";
        elseAlone = /^(\}\s*)?else$/.test(trimmed.trim());
      }
      var bc = line.lastIndexOf("/*");
      if (bc >= 0 && line.indexOf("*/", bc) < 0 && !m[bc] && (bc === 0 || m[bc - 1] || /\s/.test(line.charAt(bc - 1)))) inBlock = true;
    });
    return out.join("\n");
  }
  CL.tidyCpp = tidy;

  CL.edInit = function (ed) {
    var ta = ed.ta;
    ed.bmKey = "";
    function onCaret() { if (document.activeElement === ta) ed.matchBrackets(false); }
    ta.addEventListener("keyup", function (e) { if (/^Arrow|Home|End|Page/.test(e.key)) onCaret(); });
    ta.addEventListener("mouseup", onCaret);
    ta.addEventListener("focus", onCaret);
    ta.addEventListener("blur", function () { setTimeout(function () { if (document.activeElement !== ta) { ed.closeComplete(); ed.clearBrackets(); if (ed.keys) ed.keys.hidden = true; } }, 150); });
    ta.addEventListener("input", function () { ed.updateComplete(); });
    if (coarse && !ed.opts.readOnly) {
      var bar = ed.keys = document.createElement("div");
      bar.className = "ed-keys";
      bar.hidden = true;
      bar.setAttribute("role", "toolbar");
      bar.setAttribute("aria-label", "Symbols");
      ["Tab", "{", "}", "(", ")", "[", "]", ";", "*", "&", "->", "<<", ">>", "\"", "'", "=", "<", ">", "!", "+", "-", "/", "%", "_"].forEach(function (k) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = k === "Tab" ? "⇥" : k;
        b.setAttribute("aria-label", k === "Tab" ? "Tab" : k);
        b.addEventListener("pointerdown", function (e) { e.preventDefault(); });
        b.addEventListener("click", function () {
          if (ta.readOnly) return;
          var s = ta.selectionStart, en = ta.selectionEnd, t = k === "Tab" ? "\t" : k;
          ed.replaceRange(s, en, t);
          ta.selectionStart = ta.selectionEnd = s + t.length;
          ed.refresh(); ed.fire();
        });
        bar.appendChild(b);
      });
      ed.el.insertBefore(bar, ed.el.firstChild);
      ta.addEventListener("focus", function () { bar.hidden = false; });
    }
    if (ed.opts.tools) {
      var tb = document.createElement("div");
      tb.className = "ed-bar";
      tb.innerHTML = '<button type="button" class="btn small ghost" data-tidy>Tidy indentation</button><details class="ed-help"><summary>Keyboard shortcuts</summary><table>' +
        [["Ctrl + Enter", "Run"]].concat(ed.opts.onSubmit ? [["Ctrl + Shift + Enter", "Submit: run every test"]] : []).concat([["Tab / Shift + Tab", "Indent or outdent the selected lines"], ["Ctrl + /", "Turn the selected lines into comments, or back"], ["Alt + ↑ / ↓", "Move the selected lines up or down"], ["Shift + Alt + F", "Tidy the indentation"], ["Tab (when suggestions show)", "Complete the word"], ["Ctrl + Z / Ctrl + Y", "Undo / redo"]])
          .map(function (r) { return "<tr><td><kbd>" + esc(r[0]).replace(/ \+ /g, "</kbd> + <kbd>").replace(/ \/ /g, "</kbd> / <kbd>") + "</kbd></td><td>" + esc(r[1]) + "</td></tr>"; }).join("") +
        '</table><p class="small muted">On a Mac, use Cmd for Ctrl and Option for Alt. Brackets and quotes close themselves; type the closing one to step over it.</p></details>';
      ed.el.parentNode.insertBefore(tb, ed.el.nextSibling);
      tb.querySelector("[data-tidy]").addEventListener("click", function () { ed.tidy(); });
    }
  };

  // ---------------------------------------------------------------- bracket matching
  E.clearBrackets = function () {
    if (!this.bmKey) return;
    this.bmKey = "";
    this.hl.innerHTML = CL.highlight(this.ta.value) + "\n ";
  };
  E.matchBrackets = function (fresh) {
    var ta = this.ta, v = ta.value, s = ta.selectionStart;
    if (s !== ta.selectionEnd || v.length > 60000) { if (!fresh) this.clearBrackets(); return; }
    var m = this.maskFor(v), at = -1;
    if (s > 0 && (OPEN[v.charAt(s - 1)] || CLOSE[v.charAt(s - 1)]) && m[s - 1]) at = s - 1;
    else if (OPEN[v.charAt(s)] || CLOSE[v.charAt(s)]) { if (m[s]) at = s; }
    var key = "";
    var other = at >= 0 ? partner(v, at, m) : -1;
    if (at >= 0) key = at + ":" + other;
    if (!fresh && key === this.bmKey) return;
    if (!fresh && this.bmKey) this.hl.innerHTML = CL.highlight(v) + "\n ";
    this.bmKey = key;
    if (at < 0) return;
    if (other < 0) { wrapAt(this.hl, at, "ed-bx"); return; }
    var a = Math.max(at, other), b = Math.min(at, other);
    wrapAt(this.hl, a, "ed-bm");
    wrapAt(this.hl, b, "ed-bm");
  };
  E.maskFor = function (v) {
    if (this.maskV !== v) { this.maskV = v; this.mask = codeMask(v); }
    return this.mask;
  };
  E.afterRefresh = function () {
    this.bmKey = "";
    if (document.activeElement === this.ta) this.matchBrackets(true);
  };

  // ---------------------------------------------------------------- keys
  E.extKey = function (e) {
    var ta = this.ta, self = this;
    if (this.complete && !this.complete.hidden) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); this.moveComplete(e.key === "ArrowDown" ? 1 : -1); return true; }
      if (e.key === "Tab" && !e.shiftKey) { e.preventDefault(); this.acceptComplete(); return true; }
      if (e.key === "Escape") { e.preventDefault(); this.closeComplete(); return true; }
      if (e.key === "Enter") this.closeComplete();
    }
    if (ta.readOnly) return false;
    var s = ta.selectionStart, en = ta.selectionEnd, v = ta.value, k = e.key;
    var mod = e.ctrlKey || e.metaKey;
    function done(a, b) { ta.selectionStart = a; ta.selectionEnd = b === undefined ? a : b; self.refresh(); self.fire(); return true; }
    if (mod && (k === "/" || e.code === "Slash")) { e.preventDefault(); return this.toggleComment() || true; }
    if (e.altKey && !mod && (k === "ArrowUp" || k === "ArrowDown")) { e.preventDefault(); this.moveLines(k === "ArrowUp" ? -1 : 1); return true; }
    if (e.altKey && e.shiftKey && (k === "F" || k === "f" || e.code === "KeyF")) { e.preventDefault(); this.tidy(); return true; }
    if (mod || e.altKey) return false;
    if (k === "Backspace" && s === en && s > 0) {
      var p = v.charAt(s - 1), n = v.charAt(s);
      if ((OPEN[p] && OPEN[p] === n) || ((p === '"' || p === "'") && n === p)) { e.preventDefault(); this.replaceRange(s - 1, s + 1, ""); return done(s - 1); }
      return false;
    }
    if ((CLOSE[k] || k === '"' || k === "'") && s === en && v.charAt(s) === k) {
      // step over a closing bracket or quote that is already there
      var m = this.maskFor(v);
      if (CLOSE[k] ? partner(v, s, m) >= 0 : true) { e.preventDefault(); return done(s + 1); }
    }
    if (OPEN[k] || k === '"' || k === "'") {
      var close = OPEN[k] || k, ls = v.lastIndexOf("\n", s - 1) + 1, before = v.slice(ls, s), next = v.charAt(en);
      if (s !== en) {
        var sel = v.slice(s, en);
        e.preventDefault();
        this.replaceRange(s, en, k + sel + close);
        return done(s + 1, s + 1 + sel.length);
      }
      if (/\/\//.test(before.replace(/"(\\.|[^"\\])*"/g, ""))) return false;
      if (k === '"' || k === "'") {
        if (/\w/.test(v.charAt(s - 1))) return false;
        var quotes = (before.replace(/\\./g, "").match(new RegExp(k === '"' ? '"' : "'", "g")) || []).length;
        if (quotes % 2 === 1) return false;
      }
      if (next && /[\w"'(]/.test(next)) return false;
      e.preventDefault();
      this.replaceRange(s, en, k + close);
      return done(s + 1);
    }
    return false;
  };
  E.selLines = function () {
    var ta = this.ta, v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    if (en > s && v.charAt(en - 1) === "\n") en--;
    var a = v.lastIndexOf("\n", s - 1) + 1, b = v.indexOf("\n", en);
    if (b < 0) b = v.length;
    return { a: a, b: b, text: v.slice(a, b) };
  };
  E.toggleComment = function () {
    var ta = this.ta, r = this.selLines(), lines = r.text.split("\n"), s = ta.selectionStart, en = ta.selectionEnd;
    var all = lines.every(function (l) { return !l.trim() || /^\s*\/\//.test(l); });
    var minInd = Math.min.apply(null, lines.filter(function (l) { return l.trim(); }).map(function (l) { return /^[\t ]*/.exec(l)[0].length; }).concat([1e9]));
    if (minInd === 1e9) minInd = 0;
    var out = lines.map(function (l) {
      if (!l.trim()) return l;
      return all ? l.replace(/^(\s*)\/\/ ?/, "$1") : l.slice(0, minInd) + "// " + l.slice(minInd);
    }).join("\n");
    this.replaceRange(r.a, r.b, out);
    var delta = out.length - r.text.length;
    ta.selectionStart = s === en ? Math.max(r.a, s + (all ? -Math.min(3, s - r.a) : 3)) : r.a;
    ta.selectionEnd = s === en ? ta.selectionStart : r.b + delta;
    this.refresh(); this.fire();
    return true;
  };
  E.moveLines = function (dir) {
    var ta = this.ta, v = ta.value, r = this.selLines(), s = ta.selectionStart, en = ta.selectionEnd;
    if (dir < 0) {
      if (r.a === 0) return;
      var pa = v.lastIndexOf("\n", r.a - 2) + 1, prev = v.slice(pa, r.a - 1);
      this.replaceRange(pa, r.b, r.text + "\n" + prev);
      ta.selectionStart = s - prev.length - 1; ta.selectionEnd = en - prev.length - 1;
    } else {
      if (r.b >= v.length) return;
      var nb = v.indexOf("\n", r.b + 1); if (nb < 0) nb = v.length;
      var nxt = v.slice(r.b + 1, nb);
      this.replaceRange(r.a, nb, nxt + "\n" + r.text);
      ta.selectionStart = s + nxt.length + 1; ta.selectionEnd = en + nxt.length + 1;
    }
    this.refresh(); this.fire();
  };
  E.tidy = function () {
    var ta = this.ta, v = ta.value, t = tidy(v);
    if (t === v) { if (CL.ui && CL.ui.toast) CL.ui.toast("The indentation is already tidy."); return; }
    var line = v.slice(0, ta.selectionStart).split("\n").length;
    this.replaceRange(0, v.length, t);
    var pos = 0, L = t.split("\n");
    for (var i = 0; i < line - 1 && i < L.length; i++) pos += L[i].length + 1;
    ta.selectionStart = ta.selectionEnd = pos + /^[\t]*/.exec(L[line - 1] || "")[0].length;
    this.refresh(); this.fire();
  };

  // ---------------------------------------------------------------- word completion
  E.updateComplete = function () {
    var ta = this.ta, v = ta.value, s = ta.selectionStart;
    if (ta.readOnly || s !== ta.selectionEnd || coarse) { this.closeComplete(); return; }
    var before = v.slice(Math.max(0, s - 40), s), m = /[A-Za-z_]\w*$/.exec(before);
    if (!m || m[0].length < 2 || /\w/.test(v.charAt(s)) || !this.maskFor(v)[s - 1]) { this.closeComplete(); return; }
    var word = m[0], counts = {};
    var re = /\b[A-Za-z_]\w*\b/g, x;
    while ((x = re.exec(v))) { if (x.index + x[0].length !== s || x.index !== s - word.length) counts[x[0]] = (counts[x[0]] || 0) + 1; }
    var mine = Object.keys(counts).filter(function (w) { return w !== word && w.indexOf(word) === 0 && w.length > word.length; }).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b); });
    var lib = WORDS.filter(function (w) { return w.indexOf(word) === 0 && w !== word && mine.indexOf(w) < 0; });
    var list = mine.concat(lib).slice(0, 7);
    if (!list.length) { this.closeComplete(); return; }
    var box = this.complete;
    if (!box) {
      box = this.complete = document.createElement("div");
      box.className = "ed-complete";
      box.setAttribute("role", "listbox");
      document.body.appendChild(box);
      var self = this;
      box.addEventListener("mousedown", function (e) { e.preventDefault(); var it = e.target.closest("[data-i]"); if (it) { self.compSel = +it.getAttribute("data-i"); self.acceptComplete(); } });
      window.addEventListener("scroll", function () { self.closeComplete(); }, true);
    }
    this.compList = list; this.compWord = word; this.compSel = 0;
    box.innerHTML = list.map(function (w, i) { return '<div role="option" data-i="' + i + '"' + (i === 0 ? ' class="on" aria-selected="true"' : "") + "><b>" + esc(w.slice(0, word.length)) + "</b>" + esc(w.slice(word.length)) + "</div>"; }).join("") + '<div class="ed-ch">Tab to complete · Esc to close</div>';
    // place it under the caret
    var ls = v.lastIndexOf("\n", s - 1) + 1, lineNo = v.slice(0, s).split("\n").length - 1, col = 0, seg = v.slice(ls, s);
    for (var i = 0; i < seg.length; i++) col = seg.charAt(i) === "\t" ? (Math.floor(col / 4) + 1) * 4 : col + 1;
    var cw = this.charW();
    var r = this.codeEl.getBoundingClientRect(), lhpx = CL.lineH();
    var left = r.left + 14 + (col - word.length) * cw, top = r.top + 8 + (lineNo + 1) * lhpx + 2;
    box.style.left = Math.max(4, Math.min(left, window.innerWidth - 220)) + "px";
    box.style.top = (top + 180 > window.innerHeight ? top - lhpx - 4 - Math.min(180, 24 * list.length + 30) : top) + "px";
    box.hidden = false;
  };
  E.charW = function () {
    var probe = document.createElement("span");
    probe.textContent = "0000000000";
    probe.style.visibility = "hidden";
    this.hl.parentNode.appendChild(probe);
    var w = probe.getBoundingClientRect().width / 10;
    probe.remove();
    return w || 8;
  };
  E.moveComplete = function (d) {
    var n = this.compList.length;
    this.compSel = (this.compSel + d + n) % n;
    var self = this;
    this.complete.querySelectorAll("[data-i]").forEach(function (el, i) { el.classList.toggle("on", i === self.compSel); el.setAttribute("aria-selected", i === self.compSel ? "true" : "false"); });
  };
  E.acceptComplete = function () {
    var w = this.compList[this.compSel], ta = this.ta, s = ta.selectionStart;
    this.closeComplete();
    if (!w) return;
    this.replaceRange(s - this.compWord.length, s, w);
    ta.selectionStart = ta.selectionEnd = s - this.compWord.length + w.length;
    this.refresh(); this.fire();
  };
  E.closeComplete = function () { if (this.complete) this.complete.hidden = true; };
})(CL);
