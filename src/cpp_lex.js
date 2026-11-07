/* COMP 2611 Code Lab — C++ subset, part 1: errors, preprocessor and lexer. */
var CPP = typeof CPP !== "undefined" ? CPP : {};
(function (CPP) {
  "use strict";

  // kind: "compile" (found before running) | "runtime" (found while running) | "limit" (too many steps, too deep)
  function CppError(kind, msg, line, col, hint, extra) {
    this.kind = kind;
    this.msg = msg;
    this.line = line || 0;
    this.col = col || 0;
    this.hint = hint || "";
    if (extra) for (var k in extra) this[k] = extra[k];
  }
  CppError.prototype.toJSON = function () {
    return { kind: this.kind, msg: this.msg, line: this.line, col: this.col, hint: this.hint, s: this.s, z: this.z };
  };
  CPP.CppError = CppError;

  function cerr(msg, at, hint) {
    return new CppError("compile", msg, at ? at.line : 0, at ? at.col : 0, hint, at ? { s: at.s, z: at.e !== undefined ? at.e : at.z } : null);
  }
  CPP.cerr = cerr;

  // Replace comments with spaces (keeping newlines) so offsets and line numbers stay the same.
  function blankComments(src) {
    var out = [], i = 0, n = src.length, line = 1;
    while (i < n) {
      var c = src[i];
      if (c === "\n") { line++; out.push(c); i++; continue; }
      if (c === '"' || c === "'") {
        var j = i + 1;
        while (j < n && src[j] !== c && src[j] !== "\n") { if (src[j] === "\\") j++; j++; }
        out.push(src.slice(i, Math.min(j + 1, n)));
        if (src[j] === "\n") { out.pop(); out.push(src.slice(i, j)); i = j; continue; }
        i = j + 1;
        continue;
      }
      if (c === "/" && src[i + 1] === "/") {
        var k = i;
        while (k < n && src[k] !== "\n") k++;
        out.push(" ".repeat(k - i));
        i = k;
        continue;
      }
      if (c === "/" && src[i + 1] === "*") {
        var e = src.indexOf("*/", i + 2);
        if (e < 0) throw new CppError("compile", "This /* comment is never closed with */.", line, 1, "Add */ where the comment should end.");
        var chunk = src.slice(i, e + 2);
        out.push(chunk.replace(/[^\n]/g, " "));
        line += (chunk.match(/\n/g) || []).length;
        i = e + 2;
        continue;
      }
      out.push(c);
      i++;
    }
    return out.join("");
  }

  function preprocess(src) {
    var text = blankComments(src.replace(/\r\n?/g, "\n"));
    var lines = text.split("\n");
    var includes = [], macros = Object.create(null);
    var offset = 0;
    for (var li = 0; li < lines.length; li++) {
      var L = lines[li];
      var m = /^(\s*)#\s*(\w*)(.*)$/.exec(L);
      if (m) {
        var dir = m[2], rest = m[3].trim();
        if (dir === "include") {
          var im = /^([<"])\s*([\w./+-]+)\s*([>"])/.exec(rest);
          if (!im) throw new CppError("compile", "This #include line is not written correctly.", li + 1, m[1].length + 1, "Write it like this:  #include <iostream>");
          includes.push({ name: im[2], line: li + 1, quoted: im[1] === '"' });
        } else if (dir === "define") {
          var dm = /^([A-Za-z_]\w*)(\()?\s*(.*)$/.exec(rest);
          if (!dm) throw new CppError("compile", "#define needs a name.", li + 1, 1, "For example:  #define SIZE 100");
          if (dm[2]) throw new CppError("compile", "Macros with parameters, like #define SQUARE(x) ..., are not supported here.", li + 1, 1, "Write a normal function instead.");
          var valueStart = L.indexOf(dm[3], L.indexOf(dm[1]) + dm[1].length);
          macros[dm[1]] = { text: dm[3], line: li + 1, start: offset + (valueStart < 0 ? L.length : valueStart) };
        } else if (dir === "undef") {
          delete macros[rest.split(/\s+/)[0]];
        } else if (/^(ifndef|ifdef|endif|pragma|if|else|elif|error|warning)$/.test(dir)) {
          // include guards and pragmas: nothing to do for a single file
        } else {
          throw new CppError("compile", "Unknown preprocessor line #" + dir + ".", li + 1, 1, "Only #include and #define are used in this course.");
        }
        lines[li] = " ".repeat(L.length);
      }
      offset += L.length + 1;
    }
    return { text: lines.join("\n"), includes: includes, macros: macros };
  }

  var KEYWORDS = new Set(("int long short unsigned signed char bool float double void struct class enum union typedef const static if else while do for return " +
    "break continue switch case default new delete true false sizeof using namespace nullptr auto public private protected template typename this goto inline " +
    "extern register volatile operator friend virtual static_cast const_cast reinterpret_cast dynamic_cast try catch throw constexpr").split(" "));
  CPP.KEYWORDS = KEYWORDS;
  var OPS = ["<<=", ">>=", "...", "->", "++", "--", "<<", ">>", "<=", ">=", "==", "!=", "&&", "||", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", "::",
    "+", "-", "*", "/", "%", "=", "<", ">", "!", "&", "|", "^", "~", "?", ":", ";", ",", ".", "(", ")", "[", "]", "{", "}"];

  var ESC = { n: 10, t: 9, r: 13, "0": 0, "\\": 92, "'": 39, '"': 34, a: 7, b: 8, f: 12, v: 11, "?": 63 };

  // Read one (possibly escaped) character at src[i]; returns [code, nextIndex].
  function readChar(src, i, line, col) {
    var c = src[i];
    if (c !== "\\") return [src.charCodeAt(i), i + 1];
    var d = src[i + 1];
    if (d === "x") {
      var m = /^[0-9a-fA-F]+/.exec(src.slice(i + 2));
      if (!m) throw new CppError("compile", "\\x must be followed by hex digits.", line, col);
      return [parseInt(m[0], 16) & 255, i + 2 + m[0].length];
    }
    if (/[0-7]/.test(d)) {
      var o = /^[0-7]{1,3}/.exec(src.slice(i + 1))[0];
      return [parseInt(o, 8) & 255, i + 1 + o.length];
    }
    if (d in ESC) return [ESC[d], i + 2];
    throw new CppError("compile", "Unknown escape sequence \\" + d + ".", line, col, "Common ones are \\n (new line), \\t (tab), \\\\ (backslash), \\' and \\\".");
  }

  function lexRaw(text, base) {
    // base: {line, col} for macro bodies; tokens keep real offsets when base is absent
    var toks = [], i = 0, n = text.length, line = 1, lineStart = 0;
    while (i < n) {
      var c = text[i];
      if (c === "\n") { line++; i++; lineStart = i; continue; }
      if (c === " " || c === "\t" || c === "\r" || c === "\f" || c === "\v") { i++; continue; }
      var col = i - lineStart + 1, start = i, tok = null;
      if (/[A-Za-z_]/.test(c)) {
        var j = i + 1;
        while (j < n && /[\w]/.test(text[j])) j++;
        var w = text.slice(i, j);
        tok = { k: KEYWORDS.has(w) ? "kw" : "id", v: w };
        i = j;
      } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(text[i + 1] || ""))) {
        var mm, val, isFloat = false, suf = "";
        if ((mm = /^0[xX][0-9a-fA-F]+/.exec(text.slice(i)))) {
          val = parseInt(mm[0], 16);
          i += mm[0].length;
        } else {
          mm = /^(\d*\.?\d*)([eE][+-]?\d+)?/.exec(text.slice(i));
          var body = mm[0];
          if (body.indexOf(".") >= 0 || /[eE]/.test(body)) { isFloat = true; val = parseFloat(body); }
          else if (/^0[0-7]+$/.test(body)) val = parseInt(body, 8);
          else if (/^0\d+$/.test(body)) throw new CppError("compile", "A number starting with 0 is octal (base 8), so " + body + " is not valid.", line, col, "Remove the leading 0.");
          else val = Number(body);
          i += body.length;
        }
        var sm = /^[uUlLfF]+/.exec(text.slice(i));
        if (sm) { suf = sm[0].toLowerCase(); i += sm[0].length; }
        if (/[A-Za-z_]/.test(text[i] || "")) throw new CppError("compile", "A name cannot start with a digit: " + text.slice(start, i + 1) + "...", line, col, "Names must start with a letter or _.");
        tok = { k: "num", v: val, isFloat: isFloat, suf: suf, text: text.slice(start, i) };
        if (suf.indexOf("f") >= 0 && !isFloat) throw new CppError("compile", "The suffix f only goes on decimal numbers, like 2.5f.", line, col);
      } else if (c === "'") {
        if (text[i + 1] === "'") throw new CppError("compile", "Empty character literal ''.", line, col, "A char holds exactly one character, like 'a' or ' '.");
        if (text[i + 1] === "\n" || i + 1 >= n) throw new CppError("compile", "This character literal is missing its closing '.", line, col);
        var r = readChar(text, i + 1, line, col);
        if (text[r[1]] !== "'") {
          var close = text.indexOf("'", r[1]);
          var nl = text.indexOf("\n", r[1]);
          if (close > 0 && (nl < 0 || close < nl)) throw new CppError("compile", "A char holds one character, but " + text.slice(i, close + 1) + " has more than one.", line, col, "Use double quotes for text: \"" + text.slice(i + 1, close) + "\" is a string.");
          throw new CppError("compile", "This character literal is missing its closing '.", line, col);
        }
        tok = { k: "chr", v: r[0] };
        i = r[1] + 1;
      } else if (c === '"') {
        var s = [], q = i + 1;
        while (true) {
          if (q >= n || text[q] === "\n") throw new CppError("compile", "This string is missing its closing \".", line, col, "Every string must start and end on the same line with a \".");
          if (text[q] === '"') break;
          var rc = readChar(text, q, line, col);
          s.push(rc[0]);
          q = rc[1];
        }
        tok = { k: "str", v: String.fromCharCode.apply(null, s) };
        i = q + 1;
      } else {
        for (var oi = 0; oi < OPS.length; oi++) {
          var op = OPS[oi];
          if (text.startsWith(op, i)) { tok = { k: "op", v: op }; i += op.length; break; }
        }
        if (!tok) {
          var what = c === "#" ? "A # must be at the start of a line (#include, #define)." : "Unexpected character " + JSON.stringify(c) + ".";
          throw new CppError("compile", what, line, col);
        }
      }
      tok.line = line; tok.col = col; tok.s = start; tok.e = i;
      toks.push(tok);
    }
    return toks;
  }

  function lex(src) {
    var pp = preprocess(src);
    var raw = lexRaw(pp.text);
    var macroToks = Object.create(null);
    for (var name in pp.macros) macroToks[name] = lexRaw(pp.macros[name].text);
    var out = [];
    function expand(tok, depth, active) {
      if (tok.k === "id" && macroToks[tok.v] && !active[tok.v] && depth < 20) {
        var inner = Object.assign({}, active);
        inner[tok.v] = 1;
        macroToks[tok.v].forEach(function (mt) {
          var t2 = Object.assign({}, mt, { line: tok.line, col: tok.col, s: tok.s, e: tok.e, macro: tok.v });
          expand(t2, depth + 1, inner);
        });
        return;
      }
      out.push(tok);
    }
    raw.forEach(function (t) { expand(t, 0, {}); });
    var last = raw.length ? raw[raw.length - 1] : { line: 1, col: 1, e: 0 };
    var lines = pp.text.split("\n");
    out.push({ k: "eof", v: "end of file", line: lines.length, col: (lines[lines.length - 1] || "").length + 1, s: pp.text.length, e: pp.text.length, after: last });
    return { toks: out, includes: pp.includes, macros: pp.macros, text: pp.text };
  }

  CPP.preprocess = preprocess;
  CPP.lex = lex;
  CPP.lexRaw = lexRaw;
})(CPP);
