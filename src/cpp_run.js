/* COMP 2611 Code Lab — C++ subset, part 4: the runtime. Runs the checked syntax tree with a real model of the stack and the heap. */
(function (CPP) {
  "use strict";
  var TY = CPP.TY, typeStr = CPP.typeStr, CppError = CPP.CppError, arrOf = CPP.arrOf;
  var BRK = 1, CONT = 2, RET = 3;

  function Obj(id, kind, ty, name) {
    this.id = id; this.kind = kind; this.ty = ty; this.name = name || "";
    this.v = undefined; this.alive = true; this.line = 0; this.freedLine = 0; this.arrNew = false;
  }
  function Ptr(o, p) { this.o = o; this.p = p; }
  CPP.Ptr = Ptr; CPP.Obj = Obj;

  function Stream(kind, name) {
    this.kind = kind; this.name = name; this.buf = ""; this.pos = 0;
    this.fail = false; this.eof = false; this.bad = false; this.isOpen = false; this.file = null; this.append = false;
    this.width = 0; this.prec = 6; this.fixed = false; this.sci = false; this.left = false; this.fill = " "; this.boolalpha = false; this.showpoint = false;
  }
  function ExitSignal(code) { this.code = code; }

  function clone(v) {
    if (v === null || typeof v !== "object" || v instanceof Ptr || v instanceof Stream) return v;
    if (Array.isArray(v)) { var a = new Array(v.length); for (var i = 0; i < v.length; i++) a[i] = clone(v[i]); return a; }
    var o = {};
    for (var k in v) o[k] = clone(v[k]);
    return o;
  }
  function pathEq(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }
  function getAt(o, p) { var v = o.v; for (var i = 0; i < p.length; i++) v = v[p[i]]; return v; }
  function isIdx(x) { return typeof x === "number"; }

  // ---------------------------------------------------------------- number formatting (matches glibc printf)
  var DV = new DataView(new ArrayBuffer(8));
  function exactDecimal(x) {
    DV.setFloat64(0, x);
    var hi = DV.getUint32(0), lo = DV.getUint32(4);
    var eb = (hi >>> 20) & 0x7ff;
    var mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    var e2;
    if (eb === 0) e2 = -1074; else { mant |= 1n << 52n; e2 = eb - 1075; }
    if (e2 >= 0) return { int: (mant << BigInt(e2)).toString(), frac: "" };
    var k = -e2;
    var s = (mant * (5n ** BigInt(k))).toString();
    if (s.length < k + 1) s = "0".repeat(k + 1 - s.length) + s;
    return { int: s.slice(0, s.length - k), frac: s.slice(s.length - k).replace(/0+$/, "") };
  }
  function incDigits(D) {
    var a = D.split(""), i = a.length - 1;
    while (i >= 0) { if (a[i] === "9") { a[i] = "0"; i--; } else { a[i] = String(+a[i] + 1); break; } }
    return (i < 0 ? "1" : "") + a.join("");
  }
  function special(x) { return isNaN(x) ? "nan" : x < 0 ? "-inf" : "inf"; }
  function fmtF(x, p) {
    if (!isFinite(x)) return special(x);
    var neg = x < 0 || Object.is(x, -0), a = Math.abs(x);
    var d = exactDecimal(a);
    var keep = (d.frac.slice(0, p) + "0".repeat(p)).slice(0, p), rest = d.frac.slice(p);
    var D = d.int + keep;
    var up = false;
    if (rest.length) { if (rest[0] > "5") up = true; else if (rest[0] === "5") up = rest.length > 1 || (+D[D.length - 1]) % 2 === 1; }
    if (up) D = incDigits(D);
    var ip = D.slice(0, D.length - p) || "0";
    return (neg ? "-" : "") + ip + (p > 0 ? "." + D.slice(D.length - p) : "");
  }
  function sigDigits(a) {
    var d = exactDecimal(a);
    var all = d.int + d.frac, lead = 0;
    while (lead < all.length - 1 && all[lead] === "0") lead++;
    return { digits: all.slice(lead), exp: d.int.length - lead - 1 };
  }
  function roundSig(digits, n) {
    if (digits.length <= n) return { d: digits + "0".repeat(n - digits.length), carry: 0 };
    var keep = digits.slice(0, n), rest = digits.slice(n);
    var up = rest[0] > "5" || (rest[0] === "5" && (/[1-9]/.test(rest.slice(1)) || (+keep[n - 1]) % 2 === 1));
    if (!up) return { d: keep, carry: 0 };
    var inc = incDigits(keep);
    if (inc.length > n) return { d: inc.slice(0, n), carry: 1 };
    return { d: inc, carry: 0 };
  }
  function fmtE(x, p, keepZeros) {
    if (!isFinite(x)) return special(x);
    var neg = x < 0 || Object.is(x, -0), a = Math.abs(x);
    var mant, X;
    if (a === 0) { mant = "0".repeat(p + 1); X = 0; }
    else { var sd = sigDigits(a); var r = roundSig(sd.digits, p + 1); mant = r.d; X = sd.exp + r.carry; }
    var m = mant[0] + (p > 0 ? "." + mant.slice(1) : "");
    if (keepZeros === false && m.indexOf(".") >= 0) m = m.replace(/\.?0+$/, "");
    return (neg ? "-" : "") + m + "e" + (X < 0 ? "-" : "+") + (Math.abs(X) < 10 ? "0" : "") + Math.abs(X);
  }
  function fmtG(x, prec, showpoint) {
    if (!isFinite(x)) return special(x);
    var P = prec === 0 ? 1 : prec;
    var neg = x < 0 || Object.is(x, -0), a = Math.abs(x);
    if (a === 0) return (neg ? "-" : "") + (showpoint ? "0." + "0".repeat(P - 1) : "0");
    var sd = sigDigits(a);
    var r = roundSig(sd.digits, P);
    var X = sd.exp + r.carry;
    var s;
    if (X < -4 || X >= P) {
      s = r.d[0] + (P > 1 ? "." + r.d.slice(1) : "");
      if (!showpoint && s.indexOf(".") >= 0) s = s.replace(/\.?0+$/, "");
      s += "e" + (X < 0 ? "-" : "+") + (Math.abs(X) < 10 ? "0" : "") + Math.abs(X);
    } else {
      if (X >= 0) s = r.d.slice(0, X + 1) + (P - 1 - X > 0 ? "." + r.d.slice(X + 1) : "");
      else s = "0." + "0".repeat(-X - 1) + r.d;
      if (!showpoint && s.indexOf(".") >= 0) s = s.replace(/\.?0+$/, "");
    }
    return (neg ? "-" : "") + s;
  }
  CPP.fmtG = fmtG; CPP.fmtF = fmtF; CPP.fmtE = fmtE;

  function charText(c) {
    c &= 255;
    if (c === 10) return "'\\n'";
    if (c === 9) return "'\\t'";
    if (c === 0) return "'\\0'";
    if (c === 39) return "'\\''";
    if (c === 92) return "'\\\\'";
    if (c < 32 || c === 127) return "'\\x" + c.toString(16) + "'";
    return "'" + String.fromCharCode(c) + "'";
  }
  function u64(v) { return v < 0 ? (BigInt(Math.trunc(v)) + (1n << 64n)).toString() : String(v); }

  // ---------------------------------------------------------------- glibc rand()
  function GlibcRand(seed) { this.seed(seed === undefined ? 1 : seed); }
  GlibcRand.prototype.seed = function (seed) {
    var r = new Int32Array(344);
    seed = seed >>> 0;
    if (seed === 0) seed = 1;
    r[0] = seed | 0;
    for (var i = 1; i < 31; i++) {
      var hi = Math.floor(r[i - 1] / 127773), lo = r[i - 1] % 127773;
      var word = 16807 * lo - 2836 * hi;
      if (word < 0) word += 2147483647;
      r[i] = word;
    }
    for (i = 31; i < 34; i++) r[i] = r[i - 31];
    for (i = 34; i < 344; i++) r[i] = (r[i - 31] + r[i - 3]) | 0;
    this.r = Array.prototype.slice.call(r);
  };
  GlibcRand.prototype.next = function () {
    var r = this.r, n = r.length;
    var v = (r[n - 31] + r[n - 3]) | 0;
    r.push(v);
    if (r.length > 2000) this.r = r.slice(r.length - 64);
    return v >>> 1;
  };
  CPP.GlibcRand = GlibcRand;

  // ---------------------------------------------------------------- runtime
  function Runtime(prog, opts) {
    opts = opts || {};
    this.prog = prog;
    this.src = prog.src;
    this.opts = opts;
    this.outParts = [];
    this.outLen = 0;
    this.maxOut = opts.maxOut || 200000;
    this.steps = 0;
    this.maxSteps = opts.maxSteps || 5000000;
    this.trace = !!opts.trace;
    this.snaps = [];
    this.maxSnaps = opts.maxSnaps || 2500;
    this.snapLimit = false;
    this.calls = [];
    this.frames = [];
    this.frame = null;
    this.nid = 1;
    this.heap = [];
    this.liveHeap = 0;
    this.globals = [];
    this.files = Object.assign({}, opts.files || {});
    this.depth = 0;
    this.maxDepth = opts.maxDepth || CPP.maxCallDepth();
    this.line = 0;
    this.rng = new GlibcRand(1);
    this.callSeq = 0;
    this.started = false;
    this.streams = [];
    this.cin = new Stream("cin", "cin");
    this.cin.buf = opts.stdin || "";
    this.cin.isOpen = true;
    this.cout = new Stream("cout", "cout");
    this.cout.isOpen = true;
    this.cerr = new Stream("cout", "cerr");
    this.cerr.isOpen = true;
    this.builtinObjs = {};
    var self = this;
    [["cin", this.cin, CPP.STREAM_TY.istream], ["cout", this.cout, CPP.STREAM_TY.ostream], ["cerr", this.cerr, CPP.STREAM_TY.ostream]].forEach(function (x) {
      var o = new Obj(0, "b", x[2], x[0]);
      o.v = x[1];
      self.builtinObjs[x[0]] = o;
    });
  }
  var R = Runtime.prototype;

  R.text = function (n) { return n && n.s !== undefined ? this.src.slice(n.s, n.z).replace(/\s+/g, " ").trim() : "this"; };
  R.err = function (msg, node, hint, kind) {
    var line = node && node.line ? node.line : this.line;
    var e = new CppError(kind || "runtime", msg, line, node ? node.col : 0, hint || "");
    if (node && node.s !== undefined) { e.s = node.s; e.z = node.z; }
    return e;
  };

  // ---------------------------------------------------------------- values
  R.defVal = function (ty, zero) {
    switch (ty.k) {
      case "string": return "";
      case "struct": return this.makeStruct(ty, zero);
      case "arr": {
        var n = ty.n, a = new Array(n);
        for (var i = 0; i < n; i++) a[i] = this.defVal(ty.of, zero);
        return a;
      }
      case "stream": { var st = new Stream(ty.ss ? "ss" : ty.name, ty.name); if (ty.ss) st.isOpen = true; return st; }
      case "ptr": return zero ? null : undefined;
      default: return zero ? 0 : undefined;
    }
  };
  R.makeStruct = function (ty, zero) {
    var o = {};
    for (var i = 0; i < ty.fields.length; i++) {
      var f = ty.fields[i];
      o[f.name] = f.init ? (f.init.k === "init" ? this.listValue(f.init, f.ty) : this.conv(this.ev(f.init), f.init.ty, f.ty)) : this.defVal(f.ty, zero);
    }
    return o;
  };
  R.numOf = function (v, ty) {
    if (typeof v === "number") return v;
    if (v === null) return 0;
    if (v === undefined) return 0;
    if (v instanceof Ptr) return this.addr(v);
    if (typeof v === "boolean") return v ? 1 : 0;
    return 0;
  };
  R.addr = function (p) {
    if (p === null) return 0;
    if (typeof p === "string") return 0x400000;
    var base = 0x1000 + p.o.id * 0x40, off = 0;
    var t = p.o.ty;
    for (var i = 0; i < p.p.length; i++) {
      var k = p.p[i];
      if (isIdx(k)) { off += k * CPP.sizeOf(t.of); t = t.of; }
      else { var f = t.fmap.get(k); off += f.offset || 0; t = f.ty; }
    }
    return base + off;
  };
  R.conv = function (v, from, to) {
    if (to.k === "ref") to = to.to;
    switch (to.k) {
      case "int": return Math.trunc(this.numOf(v, from)) | 0;
      case "uint": return Math.trunc(this.numOf(v, from)) >>> 0;
      case "short": return (Math.trunc(this.numOf(v, from)) << 16) >> 16;
      case "char": return (Math.trunc(this.numOf(v, from)) << 24) >> 24;
      case "uchar": return Math.trunc(this.numOf(v, from)) & 255;
      case "bool": return this.truthy(v, from) ? 1 : 0;
      case "long": case "llong": case "ulong": {
        var n = this.numOf(v, from);
        return isFinite(n) ? Math.trunc(n) : 0;
      }
      case "float": return Math.fround(this.numOf(v, from));
      case "double": return this.numOf(v, from);
      case "enum": return Math.trunc(this.numOf(v, from)) | 0;
      case "ptr":
        if (v === null || v === undefined || v === 0 || from.k === "null" || from.k === "nullptr") return v === undefined ? undefined : null;
        return v;
      case "string":
        if (typeof v === "string") return v;
        if (v instanceof Ptr) return this.readCStr(v, null);
        if (typeof v === "number") return String.fromCharCode(v & 255);
        return v;
      default: return v;
    }
  };
  R.truthy = function (v, ty) {
    if (ty && ty.k === "stream") return !(v.fail || v.bad);
    if (v === null || v === undefined) return false;
    if (typeof v === "number") return v !== 0;
    return true;
  };
  R.strOf = function (v, ty) {
    if (typeof v === "string") return v;
    if (ty.k === "char" || ty.k === "uchar") return String.fromCharCode(v & 255);
    if (v instanceof Ptr) return this.readCStr(v, null);
    return String(v);
  };

  // ---------------------------------------------------------------- memory access
  R.deadAccess = function (o, node) {
    if (o.kind === "h") {
      throw this.err("This " + (o.ty.k === "struct" ? o.ty.name : "memory") + " was deleted (on line " + o.freedLine + "), so it cannot be used any more.", node,
        "The pointer still holds the old address, but the memory is gone: it is a dangling pointer. After  delete p;  set  p = NULL;  and never use another pointer that pointed to the same place.");
    }
    throw this.err("This points to " + (o.name ? "the variable " + o.name : "a variable") + ", which no longer exists.", node,
      "Local variables disappear when their function returns (or their { } block ends). Use new for anything that must last longer.");
  };
  R.uninit = function (node) {
    var t = node.ty, name = this.text(node);
    if (t && t.k === "ptr") {
      throw this.err("The pointer " + name + " has not been given an address yet.", node,
        "An uninitialised pointer holds a random address. Set it first, with new, with NULL, or by copying another pointer" + (node.k === "mem" ? ". After  p = new Node;  every field holds garbage until you set it, e.g.  p->next = NULL;" : "."));
    }
    if (node.k === "mem") {
      throw this.err(name + " has not been given a value yet.", node, "After new, every field holds garbage until you set it. Give each field a value straight after creating the node.");
    }
    if (node.k === "idx") throw this.err(name + " has not been given a value yet.", node, "Array elements start with garbage values unless you give the array starting values (like = {0}) or fill it with a loop.");
    throw this.err(name + " is used before it has been given a value.", node, "Give it a starting value where it is declared, for example  int " + name + " = 0;");
  };
  R.nullDeref = function (ptrNode, node) {
    var name = this.text(ptrNode);
    var what = node.k === "mem" ? name + "->" + node.name : node.k === "idx" ? name + "[...]" : "*" + name;
    throw this.err(name + " is NULL, so " + what + " does not exist.", node,
      "A NULL pointer points to nothing. Check  if (" + name + " != NULL)  before following it" + (node.k === "mem" && node.name === "next" ? ". The last node of a list has next == NULL, so loops usually stop when the pointer becomes NULL." : "."));
  };
  R.load = function (l, node) {
    var o = l.o;
    if (!o.alive) this.deadAccess(o, node);
    var p = l.p, v = o.v;
    for (var i = 0; i < p.length; i++) v = v[p[i]];
    if (l.si !== undefined) {
      if (l.si < 0 || l.si > v.length) throw this.err("Index " + l.si + " is outside the string " + this.text(node.a || node) + " (its length is " + v.length + ").", node, "Valid positions are 0 to length() - 1.");
      return l.si === v.length ? 0 : (v.charCodeAt(l.si) << 24) >> 24;
    }
    var ty = node.ty;
    if (ty && ty.k === "arr") return new Ptr(o, p.concat(0));
    if (v === undefined) this.uninit(node);
    return v;
  };
  R.loadRaw = function (l) {
    var v = l.o.v;
    for (var i = 0; i < l.p.length; i++) v = v[l.p[i]];
    return v;
  };
  R.store = function (l, v, ty, node) {
    var o = l.o;
    if (!o.alive) this.deadAccess(o, node);
    if (ty && (ty.k === "struct" || ty.k === "arr")) v = clone(v);
    var p = l.p;
    if (l.si !== undefined) {
      var s = getAt(o, p);
      if (l.si < 0 || l.si >= s.length) throw this.err("Index " + l.si + " is outside the string (its length is " + s.length + ").", node, "Valid positions are 0 to length() - 1. To add characters, use += or push_back.");
      var ns = s.slice(0, l.si) + String.fromCharCode(v & 255) + s.slice(l.si + 1);
      this.storePath(o, p, ns);
      return;
    }
    this.storePath(o, p, v);
  };
  R.storePath = function (o, p, v) {
    if (!p.length) { o.v = v; return; }
    var c = o.v;
    for (var i = 0; i < p.length - 1; i++) c = c[p[i]];
    c[p[p.length - 1]] = v;
  };
  R.tempLv = function (v, ty) {
    var o = new Obj(this.nid++, "t", ty, "");
    o.v = (ty.k === "struct" || ty.k === "arr") ? clone(v) : v;
    return { o: o, p: [] };
  };
  // pointer + index -> lvalue of the element
  R.ptrElem = function (ptr, i, ptrNode, node) {
    if (ptr === null) this.nullDeref(ptrNode, node);
    if (ptr === undefined) this.uninit(ptrNode);
    if (typeof ptr === "string") {
      var t = this.tempLv(ptr, TY.string);
      return { o: t.o, p: [], si: i };
    }
    var o = ptr.o;
    if (!o.alive) this.deadAccess(o, node);
    var p = ptr.p, n = p.length;
    if (n && isIdx(p[n - 1])) {
      var arr = getAt(o, p.slice(0, n - 1));
      var k = p[n - 1] + i;
      if (k < 0 || k >= arr.length) {
        throw this.err("Index " + k + " is outside the array (valid indexes are 0 to " + (arr.length - 1) + ").", node,
          "The array has " + arr.length + " elements. Check the loop condition: with n elements, use  i < n, not  i <= n.");
      }
      return { o: o, p: p.slice(0, n - 1).concat(k) };
    }
    if (i !== 0) throw this.err("This pointer does not point into an array, so [" + i + "] or +" + i + " goes to memory that is not yours.", node);
    return { o: o, p: p };
  };
  R.ptrAdd = function (ptr, n, node) {
    if (ptr === null) throw this.err("Cannot do arithmetic on a NULL pointer.", node);
    if (ptr === undefined) this.uninit(node);
    if (n === 0) return ptr;
    var p = ptr.p, L = p.length;
    if (!L || !isIdx(p[L - 1])) throw this.err("Pointer arithmetic (+ or -) only works on pointers into an array.", node, "To move along a linked list, use  p = p->next;");
    var arr = getAt(ptr.o, p.slice(0, L - 1));
    var k = p[L - 1] + n;
    if (k < 0 || k > arr.length) throw this.err("This pointer moved outside its array (to position " + k + " of " + arr.length + ").", node);
    return new Ptr(ptr.o, p.slice(0, L - 1).concat(k));
  };
  R.ptrEq = function (a, b) {
    if (a === null || a === undefined || b === null || b === undefined) return (a === null || a === undefined) && (b === null || b === undefined) ? a === b || (a == null && b == null) : false;
    if (typeof a === "string" || typeof b === "string") return a === b;
    return a.o === b.o && pathEq(a.p, b.p);
  };
  R.ptrCmp = function (a, b) {
    var x = a === null ? 0 : this.addr(a), y = b === null ? 0 : this.addr(b);
    return x < y ? -1 : x > y ? 1 : 0;
  };
  R.readCStr = function (ptr, node) {
    if (typeof ptr === "string") return ptr;
    if (ptr === null) throw this.err("This char pointer is NULL.", node);
    var o = ptr.o, p = ptr.p, L = p.length;
    if (!o.alive) this.deadAccess(o, node);
    if (!L || !isIdx(p[L - 1])) return String.fromCharCode(getAt(o, p) & 255);
    var arr = getAt(o, p.slice(0, L - 1)), s = "";
    for (var k = p[L - 1]; k < arr.length; k++) {
      var c = arr[k];
      if (c === undefined) throw this.err("This char array has no '\\0' at the end of its text.", node, "Text in a char array must end with the '\\0' character.");
      if (c === 0) return s;
      s += String.fromCharCode(c & 255);
    }
    throw this.err("This char array has no '\\0' at the end of its text.", node, "The array is too small for its text, or the text was never finished with '\\0'.");
  };
  R.writeCStr = function (ptr, s, node) {
    if (ptr === null) throw this.err("This char pointer is NULL.", node);
    var o = ptr.o, p = ptr.p, L = p.length;
    var arr = getAt(o, p.slice(0, L - 1)), start = p[L - 1];
    if (start + s.length + 1 > arr.length) throw this.err("The text \"" + s + "\" (" + (s.length + 1) + " chars including '\\0') does not fit in this char array (room for " + (arr.length - start) + ").", node, "Make the array bigger.");
    for (var i = 0; i < s.length; i++) arr[start + i] = (s.charCodeAt(i) << 24) >> 24;
    arr[start + s.length] = 0;
  };

  // ---------------------------------------------------------------- lvalues
  R.lv = function (e) {
    switch (e.k) {
      case "id": return this.lvId(e);
      case "deref": {
        if (e.e.ty.k === "arr") { var b = this.lv(e.e); return this.ptrElem(new Ptr(b.o, b.p.concat(0)), 0, e.e, e); }
        return this.ptrElem(this.ev(e.e), 0, e.e, e);
      }
      case "idx": return this.lvIdx(e);
      case "mem": return this.lvMem(e);
      case "assign": this.evAssign(e); return this.lastLv;
      case "pre": this.evIncDec(e, true); return this.lastLv;
      case "cond": return this.truthy(this.ev(e.c), e.c.ty) ? this.lv(e.a) : this.lv(e.b);
      case "comma": this.ev(e.a); return this.lv(e.b);
      case "call": { var r = this.evCall(e, true); return r; }
      case "method": return this.methodLv(e);
      case "bin": return this.tempLv(this.ev(e), e.ty);
      case "cast": if (e.ty0 && e.ty0.k === "ref") return this.lv(e.e); break;
    }
    return this.tempLv(this.ev(e), e.ty);
  };
  R.lvId = function (e) {
    var r = e.res, ent;
    if (r.kind === "local") ent = this.frame.slots[r.slot];
    else if (r.kind === "global") ent = this.globals[r.gi];
    else if (r.kind === "builtin") return { o: this.builtinObjs[r.name], p: [] };
    else return this.tempLv(r.v, e.ty);
    if (!ent) throw this.err(e.name + " is not available here.", e);
    if (ent.ref) return ent.ref;
    return { o: ent.o, p: [] };
  };
  R.lvIdx = function (e) {
    var at = e.a.ty;
    if (at.k === "string" || at.k === "lit") {
      var sl = e.a.lv ? this.lv(e.a) : this.tempLv(this.ev(e.a), TY.string);
      var si = this.numOf(this.ev(e.i));
      return { o: sl.o, p: sl.p, si: si };
    }
    if (at.k === "arr") {
      var base = this.lv(e.a);
      var i = this.numOf(this.ev(e.i));
      if (!base.o.alive) this.deadAccess(base.o, e);
      var arr = this.loadRaw(base);
      if (i < 0 || i >= arr.length || i !== Math.trunc(i)) {
        throw this.err("Index " + i + " is outside the array " + this.text(e.a) + " (valid indexes are 0 to " + (arr.length - 1) + ").", e,
          "This array has " + arr.length + " elements, numbered 0 to " + (arr.length - 1) + ". With n elements, loop with  i < n, not  i <= n.");
      }
      return { o: base.o, p: base.p.concat(i) };
    }
    var ptr = this.ev(e.a);
    var j = this.numOf(this.ev(e.i));
    return this.ptrElem(ptr, j, e.a, e);
  };
  R.lvMem = function (e) {
    var base;
    if (e.arrow) base = this.ptrElem(this.ev(e.e), 0, e.e, e);
    else base = e.e.lv ? this.lv(e.e) : this.tempLv(this.ev(e.e), e.e.ty);
    if (!base.o.alive) this.deadAccess(base.o, e);
    return { o: base.o, p: base.p.concat(e.name) };
  };

  // ---------------------------------------------------------------- expressions
  R.ev = function (e) {
    switch (e.k) {
      case "num": case "chr": case "str": case "bool": return e.v;
      case "null": case "nullptr": return null;
      case "npos": return -1;
      case "iosflag": return e.v;
      case "id": return this.evId(e);
      case "assign": return this.evAssign(e);
      case "bin": return this.evBin(e);
      case "logic": return this.evLogic(e);
      case "un": return this.evUn(e);
      case "deref": case "idx": case "mem": return this.load(this.lv(e), e);
      case "addr": return this.evAddr(e);
      case "pre": return this.evIncDec(e, true);
      case "post": return this.evIncDec(e, false);
      case "cond": return this.truthy(this.ev(e.c), e.c.ty) ? this.conv(this.ev(e.a), e.a.ty, e.ty) : this.conv(this.ev(e.b), e.b.ty, e.ty);
      case "comma": this.ev(e.a); return this.ev(e.b);
      case "call": return this.evCall(e, false);
      case "method": return this.evMethod(e);
      case "cast": return this.evCast(e);
      case "sizeof": return e.v;
      case "new": return this.evNew(e);
      case "delete": return this.evDelete(e);
      case "strctor": {
        if (!e.args.length) return "";
        if (e.args.length === 2) return String.fromCharCode(this.numOf(this.ev(e.args[1])) & 255).repeat(Math.max(0, this.numOf(this.ev(e.args[0]))));
        return this.conv(this.ev(e.args[0]), e.args[0].ty, TY.string);
      }
    }
    throw this.err("Cannot run this expression (" + e.k + ").", e);
  };
  R.evId = function (e) {
    var r = e.res;
    if (r.kind === "enum") return r.v;
    if (r.kind === "builtin") {
      var b = CPP.BUILTIN_VALUES[r.name];
      if (b.ty.k === "manip") return { m: r.name };
      if (b.ty.k === "stream") return this.builtinObjs[r.name].v;
      return b.v;
    }
    return this.load(this.lvId(e), e);
  };
  R.evAssign = function (e) {
    var at = e.a.ty;
    if (e.op === "=") {
      var v = this.ev(e.b);
      var l = this.lv(e.a);
      var cv = this.conv(v, e.b.ty, at);
      if (cv === undefined && e.b.ty.k !== "struct") this.uninit(e.b);
      this.store(l, cv, at, e);
      this.lastLv = l;
      return cv;
    }
    var r = this.ev(e.b);
    var l2 = this.lv(e.a);
    var cur = this.load(l2, e.a);
    var op = e.op.slice(0, -1), res;
    if (at.k === "string") res = cur + this.strOf(r, e.b.ty);
    else if (at.k === "ptr") res = this.ptrAdd(cur, op === "+" ? this.numOf(r) : -this.numOf(r), e);
    else res = this.conv(this.arith(op, cur, r, at, e.b.ty, CPP.arith(at, e.b.ty), e), CPP.arith(at, e.b.ty), at);
    this.store(l2, res, at, e);
    this.lastLv = l2;
    return res;
  };
  R.arith = function (op, a, b, at, bt, rt, node) {
    var x = this.numOf(a, at), y = this.numOf(b, bt);
    switch (rt.k) {
      case "double": case "float": {
        var r = op === "+" ? x + y : op === "-" ? x - y : op === "*" ? x * y : op === "/" ? x / y : x % y;
        return rt.k === "float" ? Math.fround(r) : r;
      }
      case "int": case "uint": {
        var q;
        if (op === "/" || op === "%") {
          if (y === 0) throw this.err("Division by zero.", node, "Dividing a whole number by 0 crashes the program. Check the divisor first.");
          q = op === "/" ? Math.trunc(x / y) : x % y;
        } else if (op === "*") q = rt.k === "int" ? Math.imul(x, y) : Math.imul(x, y) >>> 0;
        else if (op === "<<") q = x << (y & 31);
        else if (op === ">>") q = rt.k === "uint" ? x >>> (y & 31) : x >> (y & 31);
        else if (op === "&") q = x & y;
        else if (op === "|") q = x | y;
        else if (op === "^") q = x ^ y;
        else q = op === "+" ? x + y : x - y;
        return rt.k === "int" ? q | 0 : q >>> 0;
      }
      default: {
        if ((op === "/" || op === "%") && y === 0) throw this.err("Division by zero.", node);
        switch (op) {
          case "+": return x + y; case "-": return x - y; case "*": return x * y;
          case "/": return Math.trunc(x / y); case "%": return x % y;
          case "<<": return x * Math.pow(2, y); case ">>": return Math.floor(x / Math.pow(2, y));
          case "&": return Number(BigInt(x) & BigInt(y)); case "|": return Number(BigInt(x) | BigInt(y)); case "^": return Number(BigInt(x) ^ BigInt(y));
        }
      }
    }
    return 0;
  };
  R.evBin = function (e) {
    if (e.stream) return this.evStream(e);
    var op = e.op;
    var a = this.ev(e.a), b = this.ev(e.b);
    var at = e.a.ty, bt = e.b.ty, rt = e.ty;
    switch (op) {
      case "+": case "-":
        if (rt.k === "string") return this.strOf(a, at) + this.strOf(b, bt);
        if (rt.k === "ptr") {
          if (at.k === "ptr" || at.k === "arr") return this.ptrAdd(a, op === "+" ? this.numOf(b) : -this.numOf(b), e);
          return this.ptrAdd(b, this.numOf(a), e);
        }
        if ((at.k === "ptr" || at.k === "arr") && (bt.k === "ptr" || bt.k === "arr")) {
          if (a === null || b === null || a.o !== b.o) throw this.err("Subtracting pointers only works for two pointers into the same array.", e);
          return a.p[a.p.length - 1] - b.p[b.p.length - 1];
        }
        return this.arith(op, a, b, at, bt, rt, e);
      case "*": case "/": case "%": case "<<": case ">>": case "&": case "|": case "^":
        if (rt.k === "bool") { var x = this.numOf(a), y = this.numOf(b); return op === "&" ? x & y : op === "|" ? x | y : x ^ y; }
        return this.arith(op, a, b, at, bt, rt, e);
    }
    // comparisons
    var pa = at.k === "ptr" || at.k === "arr" || at.k === "nullptr", pb = bt.k === "ptr" || bt.k === "arr" || bt.k === "nullptr";
    var c;
    if (pa || pb) {
      if ((at.k === "lit" || bt.k === "lit") && !(pa && pb)) { c = 0; }
      if (op === "==" || op === "!=") { var eq = this.ptrEq(pa ? a : (a === 0 ? null : a), pb ? b : (b === 0 ? null : b)); return (op === "==") === eq ? 1 : 0; }
      c = this.ptrCmp(pa ? a : null, pb ? b : null);
    } else if ((at.k === "string" || at.k === "lit") && (bt.k === "string" || bt.k === "lit")) {
      var s1 = this.strOf(a, at), s2 = this.strOf(b, bt);
      c = s1 < s2 ? -1 : s1 > s2 ? 1 : 0;
    } else {
      var n1 = this.numOf(a, at), n2 = this.numOf(b, bt);
      if (at.k === "uint" || bt.k === "uint" || at.k === "ulong" || bt.k === "ulong") {
        if ((at.k === "ulong" || bt.k === "ulong")) { if (n1 < 0) n1 += 18446744073709551616; if (n2 < 0) n2 += 18446744073709551616; }
        else { n1 = n1 >>> 0; n2 = n2 >>> 0; }
      }
      if (op === "==") return n1 === n2 ? 1 : 0;
      if (op === "!=") return n1 !== n2 ? 1 : 0;
      c = n1 < n2 ? -1 : n1 > n2 ? 1 : (n1 === n2 ? 0 : NaN);
    }
    switch (op) {
      case "==": return c === 0 ? 1 : 0;
      case "!=": return c !== 0 ? 1 : 0;
      case "<": return c < 0 ? 1 : 0;
      case ">": return c > 0 ? 1 : 0;
      case "<=": return c <= 0 ? 1 : 0;
      case ">=": return c >= 0 ? 1 : 0;
    }
    return 0;
  };
  R.evLogic = function (e) {
    var a = this.truthy(this.ev(e.a), e.a.ty);
    if (e.op === "&&") return a && this.truthy(this.ev(e.b), e.b.ty) ? 1 : 0;
    return a || this.truthy(this.ev(e.b), e.b.ty) ? 1 : 0;
  };
  R.evUn = function (e) {
    var v = this.ev(e.e);
    if (e.op === "!") return this.truthy(v, e.e.ty) ? 0 : 1;
    var x = this.numOf(v, e.e.ty);
    if (e.op === "~") return e.ty.k === "int" ? ~x : -x - 1;
    if (e.op === "-") return e.ty.k === "int" ? (-x) | 0 : e.ty.k === "uint" ? (-x) >>> 0 : -x;
    return x;
  };
  R.evAddr = function (e) {
    if (e.e.k === "id" && e.e.res.kind === "builtin") return new Ptr(this.builtinObjs[e.e.name], []);
    var l = this.lv(e.e);
    if (l.si !== undefined) throw this.err("Taking the address of one character inside a string is not supported here.", e);
    if (!l.o.alive) this.deadAccess(l.o, e);
    return new Ptr(l.o, l.p);
  };
  R.evIncDec = function (e, pre) {
    var l = this.lv(e.e);
    var v = this.load(l, e.e);
    var t = e.e.ty, d = e.op === "++" ? 1 : -1, nv;
    if (t.k === "ptr") nv = this.ptrAdd(v, d, e);
    else nv = this.conv(v + d, TY.double, t);
    this.store(l, nv, t, e);
    this.lastLv = l;
    return pre ? nv : v;
  };
  R.evCast = function (e) {
    var to = e.ty0, v = this.ev(e.e), ft = e.e.ty;
    if (to.k === "ref") return v;
    if (to.k === "ptr") {
      if (CPP.isInt(ft)) { if (this.numOf(v) === 0) return null; throw this.err("Turning a number into a pointer is not supported here.", e); }
      return v;
    }
    if (to.k === "void") return undefined;
    if (to.k === "string") return this.conv(v, ft, to);
    return this.conv(v, ft, to);
  };
  R.evNew = function (e) {
    var ty = e.ty0;
    var o = new Obj(this.nid++, "h", ty, "");
    o.line = this.line;
    if (e.arr) {
      var n = this.numOf(this.ev(e.n));
      if (n < 0) throw this.err("new [] was asked for " + n + " elements; the size cannot be negative.", e);
      if (n > 2000000) throw this.err("new [] was asked for " + n + " elements, which is too many for this runner.", e);
      o.ty = arrOf(ty, n);
      o.arrNew = true;
      var a = new Array(n);
      for (var i = 0; i < n; i++) a[i] = this.defVal(ty, e.zero);
      if (e.init && e.init.length) {
        if (e.init.length > n) throw this.err("More starting values than elements in new [].", e);
        for (var j = 0; j < e.init.length; j++) a[j] = this.conv(this.ev(e.init[j]), e.init[j].ty, ty);
      }
      o.v = a;
      this.heap.push(o);
      this.liveHeap++;
      return new Ptr(o, [0]);
    }
    if (e.init && e.init.length) o.v = this.conv(this.ev(e.init[0]), e.init[0].ty, ty);
    else o.v = this.defVal(ty, e.zero);
    this.heap.push(o);
    this.liveHeap++;
    return new Ptr(o, []);
  };
  R.evDelete = function (e) {
    var v = this.ev(e.e);
    var name = this.text(e.e);
    if (v === null) return undefined;
    if (typeof v === "string") throw this.err("delete can only free memory that came from new.", e);
    var o = v.o;
    if (o.kind !== "h") {
      throw this.err(name + " points to " + (o.name ? "the variable " + o.name : "memory") + " that was not made with new, so it cannot be deleted.", e,
        "Only use delete on addresses that came from new. Ordinary variables are cleaned up automatically.");
    }
    if (!o.alive) {
      throw this.err("This memory was already deleted on line " + o.freedLine + ". Deleting it twice crashes the program.", e,
        "After  delete " + name + ";  set  " + name + " = NULL;  (deleting NULL is safe), and make sure no other pointer deletes the same node.");
    }
    if (o.arrNew) {
      if (!(v.p.length === 1 && v.p[0] === 0)) throw this.err("delete [] must be given the address of the first element, exactly as new [] returned it.", e);
      if (!e.arr) throw this.err(name + " was made with new [], so it must be freed with  delete [] " + name + ";", e);
    } else {
      if (v.p.length) throw this.err("delete must be given the address that new returned, not the address of a field.", e);
      if (e.arr) throw this.err(name + " was made with new (not new []), so free it with  delete " + name + ";  (no []).", e);
    }
    o.alive = false;
    o.freedLine = e.line || this.line;
    this.liveHeap--;
    return undefined;
  };

  // ---------------------------------------------------------------- calls
  R.evCall = function (e, wantLv) {
    if (e.builtin) return this.callBuiltin(e);
    var fn = e.fn, def = fn.def;
    var params = def.params, args = [];
    for (var i = 0; i < params.length; i++) {
      var p = params[i];
      var a = i < e.args.length ? e.args[i] : p.def;
      if (p.ty.k === "ref") {
        if (a.lv) args.push({ ref: this.lv(a) });
        else args.push({ ref: this.tempLv(this.conv(this.ev(a), a.ty, p.ty.to), p.ty.to) });
      } else {
        var v = this.ev(a);
        if (v === undefined && a.ty.k !== "struct") this.uninit(a);
        args.push({ v: this.conv(v, a.ty, p.ty) });
      }
    }
    var r = this.invoke(def, args, e);
    if (def.ret.k === "ref") return wantLv ? r : this.load(r, e);
    if (wantLv) return this.tempLv(r, def.ret);
    return r;
  };
  R.invoke = function (def, args, callNode) {
    if (this.depth >= this.maxDepth) {
      throw this.err("Too many function calls inside each other (more than " + this.maxDepth + ").", callNode || def, "This usually means a recursive function never reaches its base case. Check that every recursive call moves closer to the base case (for example p->next, n - 1, root->left).", "limit");
    }
    var f = { def: def, name: def.name, slots: new Array(def.nSlots || 0), live: [], line: def.line, id: ++this.callSeq, retLine: 0 };
    for (var i = 0; i < def.params.length; i++) {
      var p = def.params[i];
      if (!p.name) continue;
      var ent;
      if (args[i].ref) ent = { name: p.name, ref: args[i].ref, ty: p.ty.to, isRef: true };
      else {
        var o = new Obj(this.nid++, "s", p.ty, p.name);
        o.v = (p.ty.k === "struct") ? clone(args[i].v) : args[i].v;
        o.line = def.line;
        ent = { name: p.name, o: o, ty: p.ty };
      }
      f.slots[p.slot] = ent;
      f.live.push(p.slot);
    }
    var caller = this.frame;
    this.frames.push(f);
    this.frame = f;
    this.depth++;
    var rec = null;
    if (this.trace && this.started) {
      rec = { id: f.id, parent: caller ? caller.id : 0, fn: def.name, args: this.argText(f), depth: this.depth, s: this.snaps.length, e: -1, ret: null, line: callNode ? callNode.line : def.line };
      this.calls.push(rec);
      this.snap("call", def.line);
    }
    var sig = this.execBody(def.body);
    var ret;
    if (sig === RET) ret = this.retVal;
    else {
      f.line = def.body.endLine;
      if (def.ret.k !== "void" && def.name !== "main") {
        throw this.err("The function " + def.name + " reached its closing } without returning a value.", { line: def.body.endLine, col: 1 },
          "Every path through a non-void function must end with  return value;. Check the paths through each if / else.");
      }
      if (def.name === "main") ret = 0;
    }
    this.retVal = undefined;
    if (rec) {
      rec.ret = def.ret.k === "void" ? null : this.retText(ret, def.ret);
      this.snap("return", f.retLine || def.body.endLine, { ret: rec.ret, fn: def.name });
      rec.e = this.snaps.length - 1;
    }
    for (var k = 0; k < f.live.length; k++) { var en = f.slots[f.live[k]]; if (en && en.o && !en.isStatic) en.o.alive = false; }
    this.frames.pop();
    this.frame = caller;
    this.depth--;
    return ret;
  };
  R.argText = function (f) {
    var self = this;
    return f.def.params.filter(function (p) { return p.name; }).map(function (p) {
      var ent = f.slots[p.slot];
      if (ent.isRef) return "&" + (ent.ref.o.name || "?");
      return self.shortVal(ent.o.v, p.ty);
    }).join(", ");
  };
  R.retText = function (v, ty) {
    if (ty.k === "ref") return "ref";
    return this.shortVal(v, ty);
  };
  R.shortVal = function (v, ty) {
    if (v === undefined) return "?";
    switch (ty.k) {
      case "ptr":
        if (v === null) return "NULL";
        if (typeof v === "string") return JSON.stringify(v);
        if (v.o.ty.k === "struct" && v.p.length === 0) {
          var st = v.o.ty, f0 = st.fields[0];
          if (f0 && v.o.v && (CPP.isNum(f0.ty) || f0.ty.k === "string")) { var fv = v.o.v[f0.name]; return "→" + (fv === undefined ? "?" : this.scalarText(fv, f0.ty)); }
        }
        return "→#" + v.o.id;
      case "string": return JSON.stringify(v);
      case "struct": return ty.name;
      case "arr": return "array";
      case "stream": return ty.name;
      default: return this.scalarText(v, ty);
    }
  };
  R.scalarText = function (v, ty) {
    switch (ty.k) {
      case "char": case "uchar": return charText(v);
      case "bool": return v ? "true" : "false";
      case "float": case "double": return fmtG(v, 6, false);
      case "ulong": return u64(v);
      case "string": return JSON.stringify(v);
      case "enum": {
        var name = null;
        ty.consts.forEach(function (c) { if (c.v === v && name === null) name = c.name; });
        return name || String(v);
      }
      default: return String(v);
    }
  };

  // ---------------------------------------------------------------- statements
  R.step = function (node) {
    if (++this.steps > this.maxSteps) {
      throw this.err("The program was stopped after " + this.maxSteps.toLocaleString("en-US") + " steps. It is probably stuck in a loop that never ends.", node,
        "Check that the loop's condition eventually becomes false: for a list,  p = p->next;  must be inside the loop; for a counter,  i++.", "limit");
    }
    this.line = node.line;
    if (this.frame) this.frame.line = node.line;
    if (this.trace && this.started) this.snap("step", node.line);
  };
  R.exec = function (s) {
    switch (s.k) {
      case "expr": this.step(s); this.ev(s.e); return 0;
      case "decl": this.step(s); this.execDecl(s); return 0;
      case "block": return this.execBlock(s);
      case "if": return this.execIf(s);
      case "while": return this.execWhile(s);
      case "do": return this.execDo(s);
      case "for": return this.execFor(s);
      case "switch": return this.execSwitch(s);
      case "return": return this.execReturn(s);
      case "break": this.step(s); return BRK;
      case "continue": this.step(s); return CONT;
      case "empty": case "using": return 0;
    }
    throw this.err("Cannot run this statement.", s);
  };
  R.endScope = function (mark) {
    var f = this.frame, live = f.live;
    for (var i = mark; i < live.length; i++) { var en = f.slots[live[i]]; if (en && en.o && !en.isStatic) en.o.alive = false; }
    live.length = mark;
  };
  R.execBody = function (b) {
    var body = b.body;
    for (var i = 0; i < body.length; i++) {
      var sig = this.exec(body[i]);
      if (sig) return sig;
    }
    return 0;
  };
  R.execBlock = function (b) {
    var mark = this.frame.live.length;
    var sig = this.execBody(b);
    this.endScope(mark);
    return sig;
  };
  R.execScoped = function (s) {
    if (s.k === "block") return this.execBlock(s);
    var mark = this.frame.live.length;
    var sig = this.exec(s);
    this.endScope(mark);
    return sig;
  };
  R.cond = function (e) { return this.truthy(this.ev(e), e.ty); };
  R.execIf = function (s) {
    this.step(s);
    if (this.cond(s.c)) return this.execScoped(s.t);
    if (s.f) return this.execScoped(s.f);
    return 0;
  };
  R.execWhile = function (s) {
    for (;;) {
      this.step(s);
      if (!this.cond(s.c)) return 0;
      var sig = this.execScoped(s.body);
      if (sig === BRK) return 0;
      if (sig === RET) return sig;
    }
  };
  R.execDo = function (s) {
    for (;;) {
      var sig = this.execScoped(s.body);
      if (sig === BRK) return 0;
      if (sig === RET) return sig;
      this.step({ line: s.cline || s.line, col: s.col });
      if (!this.cond(s.c)) return 0;
    }
  };
  R.execFor = function (s) {
    var mark = this.frame.live.length;
    var sig = 0;
    if (s.init) {
      if (s.init.k === "decl") { this.step(s); this.execDecl(s.init); }
      else { this.step(s); this.ev(s.init.e); }
    }
    for (;;) {
      if (s.c) {
        this.step(s);
        if (!this.cond(s.c)) break;
      }
      sig = this.execScoped(s.body);
      if (sig === BRK) { sig = 0; break; }
      if (sig === RET) break;
      sig = 0;
      if (s.step) { this.step(s); this.ev(s.step); }
      else if (!s.c) this.step(s);
    }
    this.endScope(mark);
    return sig;
  };
  R.execSwitch = function (s) {
    this.step(s);
    var v = this.numOf(this.ev(s.e));
    var start = -1, def = -1;
    for (var i = 0; i < s.cases.length; i++) {
      var c = s.cases[i];
      if (c.v === null) def = i;
      else if (c.cv === v) { start = i; break; }
    }
    if (start < 0) start = def;
    if (start < 0) return 0;
    var mark = this.frame.live.length;
    var sig = 0;
    outer:
    for (var j = start; j < s.cases.length; j++) {
      var body = s.cases[j].body;
      for (var k = 0; k < body.length; k++) {
        sig = this.exec(body[k]);
        if (sig) break outer;
      }
    }
    this.endScope(mark);
    if (sig === BRK) return 0;
    return sig;
  };
  R.execReturn = function (s) {
    this.step(s);
    var f = this.frame, ret = f.def.ret;
    f.retLine = s.line;
    if (s.e) {
      if (ret.k === "ref") this.retVal = this.lv(s.e);
      else if (ret.k === "void") { this.ev(s.e); this.retVal = undefined; }
      else {
        var v = this.ev(s.e);
        if (v === undefined && s.e.ty.k !== "struct") this.uninit(s.e);
        this.retVal = this.conv(v, s.e.ty, ret);
        if (ret.k === "struct") this.retVal = clone(this.retVal);
      }
    } else this.retVal = undefined;
    return RET;
  };
  R.instType = function (ty) {
    if (ty.k === "arr") {
      var of = this.instType(ty.of);
      if (ty.vla) {
        var n = this.numOf(this.ev(ty.nExpr));
        if (n <= 0) throw this.err("An array size must be at least 1, but here it is " + n + ".", ty.nExpr);
        if (n > 2000000) throw this.err("This array is too big for this runner (" + n + " elements).", ty.nExpr);
        return arrOf(of, n);
      }
      if (of !== ty.of) return arrOf(of, ty.n);
    }
    return ty;
  };
  R.execDecl = function (s) {
    var f = this.frame;
    for (var i = 0; i < s.decls.length; i++) {
      var d = s.decls[i];
      if (d.isStatic) {
        if (!d.staticEnt) {
          var so = new Obj(this.nid++, "g", d.ty, d.name);
          so.line = d.line;
          so.v = this.defVal(d.ty, true);
          d.staticEnt = { name: d.name, o: so, ty: d.ty, isStatic: true };
          if (d.init) so.v = this.initValue(d, d.ty, so);
        }
        f.slots[d.slot] = d.staticEnt;
        f.live.push(d.slot);
        continue;
      }
      if (d.ty.k === "ref") {
        var target = d.initKind === "ctor" ? d.init[0] : d.init;
        var l = target.lv ? this.lv(target) : this.tempLv(this.conv(this.ev(target), target.ty, d.ty.to), d.ty.to);
        f.slots[d.slot] = { name: d.name, ref: l, ty: d.ty.to, isRef: true };
        f.live.push(d.slot);
        continue;
      }
      var ty = this.instType(d.ty);
      var o = new Obj(this.nid++, "s", ty, d.name);
      o.line = d.line;
      o.v = this.initValue(d, ty, o);
      f.slots[d.slot] = { name: d.name, o: o, ty: ty };
      f.live.push(d.slot);
    }
  };
  R.initValue = function (d, ty, o, global) {
    if (!d.init) {
      if (global) return this.defVal(ty, true);
      return this.defVal(ty, false);
    }
    if (d.initKind === "list") return this.listValue(d.init, ty);
    if (d.initKind === "ctor") {
      if (ty.k === "stream") {
        var st = new Stream(ty.ss ? "ss" : ty.name, ty.name);
        if (ty.file) this.openFile(st, this.strOf(this.ev(d.init[0]), d.init[0].ty), d.init[1] ? this.ev(d.init[1]) : null, ty);
        else { st.buf = this.strOf(this.ev(d.init[0]), d.init[0].ty); st.isOpen = true; }
        return st;
      }
      if (ty.k === "string" && d.init.length === 2) {
        var cnt = this.numOf(this.ev(d.init[0])), ch = this.ev(d.init[1]);
        return String.fromCharCode(ch & 255).repeat(Math.max(0, cnt));
      }
      var a = d.init[0];
      var v0 = this.ev(a);
      if (v0 === undefined && a.ty.k !== "struct") this.uninit(a);
      return this.conv(v0, a.ty, ty);
    }
    if (ty.k === "arr" && d.init.k === "str") {
      var arr = this.defVal(ty, true), s = d.init.v;
      for (var i = 0; i < s.length; i++) arr[i] = (s.charCodeAt(i) << 24) >> 24;
      return arr;
    }
    var v = this.ev(d.init);
    if (v === undefined && d.init.ty.k !== "struct") this.uninit(d.init);
    v = this.conv(v, d.init.ty, ty);
    return (ty.k === "struct") ? clone(v) : v;
  };
  R.listValue = function (list, ty) {
    var self = this;
    if (ty.k === "arr") {
      var a = this.defVal(ty, true);
      if (list.flatInner) {
        var leafTy = ty;
        while (leafTy.k === "arr") leafTy = leafTy.of;
        var flat = [];
        (function collect(x) { if (Array.isArray(x)) x.forEach(function (y, i) { if (Array.isArray(y)) collect(y); else flat.push([x, i]); }); })(a);
        list.items.forEach(function (it, i) { var slot = flat[i]; slot[0][slot[1]] = self.conv(self.ev(it), it.ty, leafTy); });
        return a;
      }
      list.items.forEach(function (it, i) {
        if (it.k === "init") a[i] = self.listValue(it, ty.of);
        else if (ty.of.k === "arr" && it.k === "str") { var s = it.v; for (var j = 0; j < s.length; j++) a[i][j] = s.charCodeAt(j); }
        else a[i] = self.conv(self.ev(it), it.ty, ty.of);
      });
      return a;
    }
    if (ty.k === "struct") {
      var o = this.makeStruct(ty, true);
      list.items.forEach(function (it, i) {
        var f = ty.fields[i];
        o[f.name] = it.k === "init" ? self.listValue(it, f.ty) : clone(self.conv(self.ev(it), it.ty, f.ty));
      });
      return o;
    }
    if (!list.items.length) return this.defVal(ty, true);
    return this.conv(this.ev(list.items[0]), list.items[0].ty, ty);
  };

  // ---------------------------------------------------------------- streams
  R.emit = function (s, text) {
    if (s.kind === "cout") {
      this.outParts.push(text);
      this.outLen += text.length;
      if (this.outLen > this.maxOut) throw this.err("The program printed too much output (more than " + this.maxOut.toLocaleString("en-US") + " characters), so it was stopped.", null, "This usually means a loop that never ends.", "limit");
    } else {
      if (!s.isOpen) { s.bad = true; s.fail = true; return; }
      s.buf += text;
    }
  };
  R.evStream = function (e) {
    var s = this.ev(e.a);
    if (e.op === "<<") {
      var v = this.ev(e.b);
      this.write(s, v, e.b.ty, e.b);
      return s;
    }
    var l = this.lv(e.b);
    this.read(s, l, e.b.ty, e.b);
    return s;
  };
  R.write = function (s, v, ty, node) {
    if (ty.k === "manip") { this.manip(s, v); return; }
    if (v === undefined && ty.k !== "struct") this.uninit(node);
    var t;
    switch (ty.k) {
      case "bool": t = s.boolalpha ? (v ? "true" : "false") : (v ? "1" : "0"); break;
      case "char": case "uchar": t = String.fromCharCode(v & 255); break;
      case "float": case "double": t = s.fixed && s.sci ? v.toString(16) : s.fixed ? fmtF(v, s.prec) : s.sci ? fmtE(v, s.prec, true) : fmtG(v, s.prec, s.showpoint); break;
      case "string": case "lit": t = v; break;
      case "ulong": t = u64(v); break;
      case "uint": t = String(v >>> 0); break;
      case "null": t = "0"; break;
      case "nullptr": t = "nullptr"; break;
      case "ptr": case "arr":
        if (typeof v === "string") t = v;
        else if (CPP.decay(ty).to.k === "char" || CPP.decay(ty).to.k === "uchar") t = this.readCStr(v, node);
        else t = v === null ? "0" : "0x" + this.addr(v).toString(16);
        break;
      case "enum": t = String(v); break;
      default: t = String(v);
    }
    if (s.width > 0) {
      if (t.length < s.width) {
        var pad = s.fill.repeat(s.width - t.length);
        t = s.left ? t + pad : pad + t;
      }
      s.width = 0;
    }
    this.emit(s, t);
  };
  R.manip = function (s, m) {
    switch (m.m) {
      case "endl": this.emit(s, "\n"); break;
      case "flush": break;
      case "fixed": s.fixed = true; s.sci = false; break;
      case "scientific": s.sci = true; s.fixed = false; break;
      case "left": s.left = true; break;
      case "right": s.left = false; break;
      case "boolalpha": s.boolalpha = true; break;
      case "noboolalpha": s.boolalpha = false; break;
      case "showpoint": s.showpoint = true; break;
      case "noshowpoint": s.showpoint = false; break;
      case "setw": s.width = m.n; break;
      case "setprecision": s.prec = m.n; break;
      case "setfill": s.fill = String.fromCharCode(m.n & 255); break;
    }
  };
  function isWs(c) { return c === 32 || (c >= 9 && c <= 13); }
  R.skipWs = function (s) {
    while (s.pos < s.buf.length && isWs(s.buf.charCodeAt(s.pos))) s.pos++;
    if (s.pos >= s.buf.length) { s.eof = true; s.fail = true; return false; }
    return true;
  };
  R.read = function (s, l, ty, node) {
    if (s.kind === "cout" || (!s.isOpen && s.kind !== "cin")) { s.fail = true; return; }
    if (s.fail || s.eof || s.bad) { s.fail = true; return; }
    if (!this.skipWs(s)) return;
    var buf = s.buf, start = s.pos, m;
    var rest = buf.slice(start);
    switch (ty.k) {
      case "char": case "uchar":
        this.store(l, (buf.charCodeAt(s.pos) << 24) >> 24, ty, node);
        s.pos++;
        return;
      case "string":
        m = /^\S+/.exec(rest);
        s.pos += m[0].length;
        if (s.pos >= buf.length) s.eof = true;
        this.store(l, m[0], ty, node);
        return;
      case "arr": case "ptr": {
        m = /^\S+/.exec(rest);
        s.pos += m[0].length;
        if (s.pos >= buf.length) s.eof = true;
        var lvArr = ty.k === "arr" ? new Ptr(l.o, l.p.concat(0)) : this.load(l, node);
        this.writeCStr(lvArr, m[0], node);
        return;
      }
      case "float": case "double": {
        m = /^[+-]?((\d+\.?\d*|\.\d+)([eE][+-]?\d+)?|inf(inity)?|nan)/i.exec(rest);
        if (!m || /^[+-]?\.?$/.test(m[0])) { s.fail = true; this.store(l, 0, ty, node); return; }
        s.pos += m[0].length;
        if (s.pos >= buf.length) s.eof = true;
        this.store(l, this.conv(parseFloat(m[0]), TY.double, ty), ty, node);
        return;
      }
      default: {
        m = /^[+-]?\d+/.exec(rest);
        if (!m) { s.fail = true; this.store(l, 0, ty, node); return; }
        s.pos += m[0].length;
        if (s.pos >= buf.length) s.eof = true;
        var n = Number(m[0]);
        var lim = { int: [-2147483648, 2147483647], short: [-32768, 32767], bool: [0, 1], uint: [0, 4294967295] }[ty.k];
        if (ty.k === "bool" && n !== 0 && n !== 1) { s.fail = true; this.store(l, 1, ty, node); return; }
        if (lim && (n < lim[0] || n > lim[1])) { s.fail = true; this.store(l, n < lim[0] ? lim[0] : lim[1], ty, node); return; }
        this.store(l, ty.k === "enum" ? n | 0 : n, ty, node);
      }
    }
  };
  R.getline = function (s, l, delim, node) {
    if (s.kind === "cout" || s.fail || s.eof || s.bad || (!s.isOpen && s.kind !== "cin")) { s.fail = true; return s; }
    var buf = s.buf;
    if (s.pos >= buf.length) { s.eof = true; s.fail = true; this.store(l, "", TY.string, node); return s; }
    var j = buf.indexOf(delim, s.pos);
    var text;
    if (j < 0) { text = buf.slice(s.pos); s.pos = buf.length; s.eof = true; }
    else { text = buf.slice(s.pos, j); s.pos = j + 1; }
    this.store(l, text, TY.string, node);
    return s;
  };
  R.openFile = function (s, name, mode, ty) {
    s.file = name;
    s.fail = false; s.eof = false; s.bad = false;
    var wantOut = ty.name === "ofstream" || (ty.name === "fstream" && mode && mode !== "in");
    if (wantOut) {
      s.isOpen = true;
      s.append = mode === "app";
      s.buf = s.append && this.files[name] !== undefined ? this.files[name] : "";
      this.files[name] = s.buf;
      if (this.streams.indexOf(s) < 0) this.streams.push(s);
      s.kind = "ofile";
      return;
    }
    if (this.files[name] === undefined) { s.isOpen = false; s.fail = true; return; }
    s.isOpen = true;
    s.buf = this.files[name];
    s.pos = 0;
    s.kind = "ifile";
  };
  R.closeFile = function (s) {
    if (s.kind === "ofile" && s.isOpen) this.files[s.file] = s.buf;
    if (!s.isOpen) s.fail = true;
    s.isOpen = false;
  };

  R.methodLv = function (e) {
    if (e.recv === "string" && (e.name === "at" || e.name === "front" || e.name === "back")) {
      var l = this.strLv(e);
      var s = this.load(l, { ty: TY.string, k: "x", line: e.line });
      var i = e.name === "at" ? this.numOf(this.ev(e.args[0])) : e.name === "front" ? 0 : s.length - 1;
      if (i < 0 || i >= s.length) throw this.err(e.name + "(): position " + i + " is outside the string (its length is " + s.length + ").", e, "This throws an out_of_range exception in C++, which ends the program.");
      return { o: l.o, p: l.p, si: i };
    }
    if (e.recv === "stream") { this.evMethod(e); return this.lv(e.obj); }
    return this.tempLv(this.evMethod(e), e.ty);
  };
  R.strLv = function (e) {
    if (e.arrow) return this.ptrElem(this.ev(e.obj), 0, e.obj, e);
    return e.obj.lv ? this.lv(e.obj) : this.tempLv(this.ev(e.obj), TY.string);
  };
  R.evMethod = function (e) {
    var self = this, A = e.args;
    function arg(i) { return self.ev(A[i]); }
    function num(i) { return self.numOf(self.ev(A[i])); }
    if (e.recv === "string") {
      var l = this.strLv(e);
      var s = this.load(l, { ty: TY.string, k: "x", line: e.line, s: e.s, z: e.z });
      var set = function (v) { self.store(l, v, TY.string, e); };
      switch (e.name) {
        case "length": case "size": return s.length;
        case "empty": return s.length ? 0 : 1;
        case "substr": {
          var pos = num(0), len = A.length > 1 ? num(1) : -1;
          if (pos > s.length || pos < 0) throw this.err("substr(" + pos + ", ...): the start position is past the end of the string (its length is " + s.length + ").", e, "This throws an out_of_range exception in C++, which ends the program.");
          return len < 0 ? s.slice(pos) : s.substr(pos, len);
        }
        case "find": case "rfind": {
          var what = A[0].ty.k === "char" ? String.fromCharCode(num(0) & 255) : this.strOf(arg(0), A[0].ty);
          if (e.name === "find") return s.indexOf(what, A.length > 1 ? num(1) : 0);
          return A.length > 1 ? s.lastIndexOf(what, num(1)) : s.lastIndexOf(what);
        }
        case "at": case "front": case "back": return this.load(this.methodLv(e), { ty: TY.char, k: "x", line: e.line });
        case "c_str": return s;
        case "append": { var ns = s + this.strOf(arg(0), A[0].ty); set(ns); return ns; }
        case "push_back": set(s + String.fromCharCode(num(0) & 255)); return undefined;
        case "pop_back": if (!s.length) throw this.err("pop_back() on an empty string.", e); set(s.slice(0, -1)); return undefined;
        case "clear": set(""); return undefined;
        case "insert": { var p = num(0); if (p > s.length) throw this.err("insert(): position " + p + " is past the end of the string.", e); var r = s.slice(0, p) + this.strOf(arg(1), A[1].ty) + s.slice(p); set(r); return r; }
        case "erase": {
          var ep = A.length ? num(0) : 0, el = A.length > 1 ? num(1) : -1;
          if (ep > s.length) throw this.err("erase(): position " + ep + " is past the end of the string.", e);
          var r2 = s.slice(0, ep) + (el < 0 ? "" : s.slice(ep + el));
          set(r2); return r2;
        }
        case "replace": {
          var rp = num(0), rl = num(1);
          if (rp > s.length) throw this.err("replace(): position " + rp + " is past the end of the string.", e);
          var r3 = s.slice(0, rp) + this.strOf(arg(2), A[2].ty) + s.slice(rp + rl);
          set(r3); return r3;
        }
        case "compare": { var o = this.strOf(arg(0), A[0].ty); return s < o ? -1 : s > o ? 1 : 0; }
      }
    }
    if (e.recv === "stream") {
      var st = e.arrow ? this.load(this.ptrElem(this.ev(e.obj), 0, e.obj, e), { ty: e.obj.ty.to, k: "x" }) : this.ev(e.obj);
      var ty = e.arrow ? e.obj.ty.to : e.obj.ty;
      switch (e.name) {
        case "open": this.openFile(st, this.strOf(arg(0), A[0].ty), A.length > 1 ? arg(1) : null, ty); return undefined;
        case "close": this.closeFile(st); return undefined;
        case "is_open": return st.isOpen ? 1 : 0;
        case "eof": return st.eof ? 1 : 0;
        case "fail": return st.fail || st.bad ? 1 : 0;
        case "bad": return st.bad ? 1 : 0;
        case "good": return !st.fail && !st.eof && !st.bad ? 1 : 0;
        case "clear": st.fail = false; st.eof = false; st.bad = false; return undefined;
        case "ignore": {
          var n = A.length ? num(0) : 1, delim = A.length > 1 ? num(1) : -1;
          if (st.fail || st.eof) { st.fail = true; return st; }
          for (var k = 0; k < n; k++) {
            if (st.pos >= st.buf.length) { st.eof = true; break; }
            var c = st.buf.charCodeAt(st.pos++);
            if (c === delim) break;
          }
          return st;
        }
        case "get": {
          if (st.fail || st.eof) { st.fail = true; return A.length ? st : -1; }
          if (st.pos >= st.buf.length) { st.eof = true; st.fail = true; return A.length ? st : -1; }
          var ch = st.buf.charCodeAt(st.pos++);
          if (A.length) { this.store(this.lv(A[0]), (ch << 24) >> 24, TY.char, e); return st; }
          return ch;
        }
        case "peek": {
          if (st.fail || st.eof) return -1;
          if (st.pos >= st.buf.length) { st.eof = true; return -1; }
          return st.buf.charCodeAt(st.pos);
        }
        case "unget": if (st.pos > 0) st.pos--; st.eof = false; return st;
        case "precision": { var old = st.prec; if (A.length) st.prec = num(0); return old; }
        case "str":
          if (A.length) { st.buf = this.strOf(arg(0), A[0].ty); st.pos = 0; st.fail = st.eof = false; return undefined; }
          return st.buf;
        case "getline": {
          var dst = this.ev(A[0]), max = num(1), dl = A.length > 2 ? num(2) : 10;
          if (st.fail || st.eof) { st.fail = true; return st; }
          var j = st.buf.indexOf(String.fromCharCode(dl), st.pos), txt;
          if (j < 0) { txt = st.buf.slice(st.pos); st.pos = st.buf.length; st.eof = true; if (!txt.length) st.fail = true; }
          else { txt = st.buf.slice(st.pos, j); st.pos = j + 1; }
          if (txt.length > max - 1) { txt = txt.slice(0, max - 1); st.fail = true; }
          this.writeCStr(dst, txt, e);
          return st;
        }
      }
    }
    throw this.err("Cannot run " + e.name + "().", e);
  };

  // ---------------------------------------------------------------- builtin functions
  function parseIntPrefix(s) { var m = /^\s*([+-]?\d+)/.exec(s); return m ? Number(m[1]) : null; }
  function parseFloatPrefix(s) { var m = /^\s*([+-]?((\d+\.?\d*|\.\d+)([eE][+-]?\d+)?))/.exec(s); return m ? parseFloat(m[1]) : null; }
  R.callBuiltin = function (e) {
    var self = this, A = e.args, name = e.builtin;
    function num(i) { var v = self.ev(A[i]); if (v === undefined) self.uninit(A[i]); return self.numOf(v, A[i].ty); }
    function str(i) { return self.strOf(self.ev(A[i]), A[i].ty); }
    switch (name) {
      case "sqrt": return Math.sqrt(num(0));
      case "fabs": return Math.abs(num(0));
      case "floor": return Math.floor(num(0));
      case "ceil": return Math.ceil(num(0));
      case "round": { var x = num(0); return x < 0 ? -Math.round(-x) : Math.round(x); }
      case "trunc": return Math.trunc(num(0));
      case "log": return Math.log(num(0));
      case "log10": return Math.log10(num(0));
      case "log2": return Math.log2(num(0));
      case "exp": return Math.exp(num(0));
      case "sin": return Math.sin(num(0)); case "cos": return Math.cos(num(0)); case "tan": return Math.tan(num(0));
      case "asin": return Math.asin(num(0)); case "acos": return Math.acos(num(0)); case "atan": return Math.atan(num(0));
      case "cbrt": return Math.cbrt(num(0));
      case "pow": return Math.pow(num(0), num(1));
      case "atan2": return Math.atan2(num(0), num(1));
      case "fmod": return num(0) % num(1);
      case "hypot": return Math.hypot(num(0), num(1));
      case "abs": { var a = num(0); var r = Math.abs(a); return e.ty.k === "int" ? r | 0 : r; }
      case "min": case "max": {
        var p = this.ev(A[0]), q = this.ev(A[1]);
        if (p === undefined) this.uninit(A[0]);
        if (q === undefined) this.uninit(A[1]);
        if (name === "max") return p < q ? q : p;
        return q < p ? q : p;
      }
      case "swap": {
        var l1 = this.lv(A[0]), l2 = this.lv(A[1]);
        var v1 = this.load(l1, A[0]), v2 = this.load(l2, A[1]);
        if (A[0].ty.k === "struct") { v1 = clone(v1); v2 = clone(v2); }
        this.store(l1, v2, A[0].ty, e);
        this.store(l2, v1, A[1].ty, e);
        return undefined;
      }
      case "rand": return this.rng.next();
      case "srand": this.rng.seed(num(0)); return undefined;
      case "time": if (A.length) this.ev(A[0]); return Math.floor(Date.now() / 1000);
      case "exit": throw new ExitSignal(num(0));
      case "abort": throw this.err("The program called abort().", e);
      case "system": return 0;
      case "toupper": { var c = num(0); return c >= 97 && c <= 122 ? c - 32 : c; }
      case "tolower": { var c2 = num(0); return c2 >= 65 && c2 <= 90 ? c2 + 32 : c2; }
      case "isdigit": { var d = num(0); return d >= 48 && d <= 57 ? 2048 : 0; }
      case "isalpha": { var h = num(0); return (h >= 65 && h <= 90) || (h >= 97 && h <= 122) ? 1024 : 0; }
      case "isspace": { var w = num(0); return w === 32 || (w >= 9 && w <= 13) ? 8192 : 0; }
      case "isupper": { var u = num(0); return u >= 65 && u <= 90 ? 256 : 0; }
      case "islower": { var lo = num(0); return lo >= 97 && lo <= 122 ? 512 : 0; }
      case "isalnum": { var an = num(0); return (an >= 48 && an <= 57) || (an >= 65 && an <= 90) || (an >= 97 && an <= 122) ? 8 : 0; }
      case "ispunct": { var pu = num(0); return pu > 32 && pu < 127 && !((pu >= 48 && pu <= 57) || (pu >= 65 && pu <= 90) || (pu >= 97 && pu <= 122)) ? 4 : 0; }
      case "isxdigit": { var xd = num(0); return (xd >= 48 && xd <= 57) || (xd >= 65 && xd <= 70) || (xd >= 97 && xd <= 102) ? 4096 : 0; }
      case "to_string": {
        var tv = num(0), tt = A[0].ty;
        if (tt.k === "double" || tt.k === "float") return fmtF(tv, 6);
        if (tt.k === "ulong") return u64(tv);
        return String(tv);
      }
      case "stoi": case "stol": {
        var si = parseIntPrefix(str(0));
        if (si === null) throw this.err(name + "(\"" + str(0) + "\"): there is no number at the start of this text.", e, "In C++ this throws an invalid_argument exception, which ends the program.");
        if (name === "stoi" && (si > 2147483647 || si < -2147483648)) throw this.err("stoi: the number is too big for an int.", e);
        return si;
      }
      case "stod": case "stof": {
        var sd = parseFloatPrefix(str(0));
        if (sd === null) throw this.err(name + "(\"" + str(0) + "\"): there is no number at the start of this text.", e, "In C++ this throws an invalid_argument exception, which ends the program.");
        return name === "stof" ? Math.fround(sd) : sd;
      }
      case "atoi": { var ai = parseIntPrefix(this.readCStr(this.ev(A[0]), A[0])); return ai === null ? 0 : ai | 0; }
      case "atof": { var af = parseFloatPrefix(this.readCStr(this.ev(A[0]), A[0])); return af === null ? 0 : af; }
      case "strlen": return this.readCStr(this.ev(A[0]), A[0]).length;
      case "strcpy": { var dst = this.ev(A[0]); this.writeCStr(dst, this.readCStr(this.ev(A[1]), A[1]), e); return dst; }
      case "strncpy": {
        var d2 = this.ev(A[0]), src = this.readCStr(this.ev(A[1]), A[1]), n = num(2);
        var arr = getAt(d2.o, d2.p.slice(0, -1)), st = d2.p[d2.p.length - 1];
        for (var i = 0; i < n; i++) {
          if (st + i >= arr.length) throw this.err("strncpy writes past the end of the array.", e);
          arr[st + i] = i < src.length ? src.charCodeAt(i) : 0;
        }
        return d2;
      }
      case "strcat": { var d3 = this.ev(A[0]); this.writeCStr(d3, this.readCStr(d3, A[0]) + this.readCStr(this.ev(A[1]), A[1]), e); return d3; }
      case "strcmp": case "strncmp": {
        var s1 = this.readCStr(this.ev(A[0]), A[0]), s2 = this.readCStr(this.ev(A[1]), A[1]);
        if (name === "strncmp") { var nn = num(2); s1 = s1.slice(0, nn); s2 = s2.slice(0, nn); }
        for (var k = 0; k < Math.max(s1.length, s2.length); k++) {
          var c1 = k < s1.length ? s1.charCodeAt(k) : 0, c3 = k < s2.length ? s2.charCodeAt(k) : 0;
          if (c1 !== c3) return c1 - c3;
        }
        return 0;
      }
      case "getline": {
        var s = this.ev(A[0]);
        var l = this.lv(A[1]);
        var delim = A.length > 2 ? String.fromCharCode(num(2) & 255) : "\n";
        return this.getline(s, l, delim, e);
      }
      case "setw": return { m: "setw", n: num(0) };
      case "setprecision": return { m: "setprecision", n: num(0) };
      case "setfill": return { m: "setfill", n: num(0) };
      case "__liveNodes": return this.liveHeap;
    }
    throw this.err("Cannot run " + name + "().", e);
  };

  // ---------------------------------------------------------------- snapshots (for the visualizer)
  R.snap = function (kind, line, extra) {
    if (this.snaps.length >= this.maxSnaps) { this.snapLimit = true; return; }
    var self = this;
    this.refd = new Set();
    var frames = this.frames.map(function (f) {
      return { fn: f.name, id: f.id, line: f.line, vars: f.live.map(function (sl) { return self.svar(f.slots[sl]); }) };
    });
    var globals = this.globalEnts ? this.globalEnts.map(function (g) { return self.svar(g); }) : [];
    var heap = [];
    for (var i = 0; i < this.heap.length; i++) {
      var o = this.heap[i];
      if (o.alive) heap.push(this.sobj(o));
    }
    // dead heap objects that are still pointed at (dangling pointers)
    var added = true, seen = new Set();
    while (added) {
      added = false;
      this.refd.forEach(function (o) {
        if (!o.alive && o.kind === "h" && !seen.has(o)) { seen.add(o); heap.push(self.sobj(o)); added = true; }
      });
    }
    heap.sort(function (a, b) { return a.id - b.id; });
    var sn = { i: this.snaps.length, kind: kind, line: line, out: this.outLen, frames: frames, globals: globals, heap: heap, step: this.steps };
    if (extra) for (var k in extra) sn[k] = extra[k];
    this.snaps.push(sn);
    this.refd = null;
  };
  R.svar = function (ent) {
    if (ent.isRef) {
      var r = ent.ref;
      if (r.o.kind !== "b") this.refd.add(r.o);
      var tv;
      try { tv = this.sval(this.loadRaw(r), ent.ty); } catch (e) { tv = { u: 1 }; }
      return { name: ent.name, t: typeStr(ent.ty) + " &", ref: { p: r.o.id, path: r.p, si: r.si }, v: tv };
    }
    return { name: ent.name, t: typeStr(ent.ty), id: ent.o.id, v: this.sval(ent.o.v, ent.o.ty), st: ent.isStatic ? 1 : 0 };
  };
  R.sobj = function (o) {
    return { id: o.id, t: typeStr(o.ty), v: this.sval(o.v, o.ty), alive: o.alive ? 1 : 0, arr: o.arrNew ? 1 : 0, line: o.line, fl: o.freedLine };
  };
  R.sval = function (v, ty) {
    switch (ty.k) {
      case "struct": {
        var f = [];
        for (var i = 0; i < ty.fields.length; i++) { var fd = ty.fields[i]; f.push([fd.name, this.sval(v[fd.name], fd.ty)]); }
        return { s: ty.name, f: f };
      }
      case "arr": {
        var a = new Array(v.length);
        for (var j = 0; j < v.length; j++) a[j] = this.sval(v[j], ty.of);
        var chars = (ty.of.k === "char");
        return chars ? { a: a, chars: 1 } : { a: a };
      }
      case "ptr":
        if (v === undefined) return { u: 1, ptr: 1 };
        if (v === null) return { p: 0 };
        if (typeof v === "string") return { lit: v };
        if (v.o.kind === "b") return { p: -1, b: v.o.name };
        this.refd.add(v.o);
        return { p: v.o.id, path: v.p, dead: v.o.alive ? 0 : 1 };
      case "string": return { str: v };
      case "stream": return { stream: ty.name, file: v && v.file ? v.file : undefined };
      default:
        if (v === undefined) return { u: 1 };
        return this.scalarText(v, ty);
    }
  };

  // ---------------------------------------------------------------- program
  R.run = function () {
    var prog = this.prog, self = this;
    var res = { ok: true, out: "", err: null, warnings: prog.warnings || [], steps: 0, snaps: null, calls: null, leaks: 0, exitCode: 0, compiled: true, files: null, snapLimit: false };
    try {
      this.globalEnts = [];
      var gframe = { def: { name: "(globals)", params: [], ret: TY.void }, name: "(globals)", slots: [], live: [], line: 0, id: 0 };
      this.frame = gframe;
      prog.globalDecls.forEach(function (d) {
        var o = new Obj(self.nid++, "g", d.ty, d.name);
        o.line = d.line;
        self.line = d.line;
        o.v = self.initValue(d, d.ty, o, true);
        var ent = { name: d.name, o: o, ty: d.ty };
        self.globals[d.gi] = ent;
        self.globalEnts.push(ent);
      });
      this.frame = null;
      this.started = true;
      var main = prog.main.def;
      var args = main.params.map(function (p, i) { return { v: i === 0 ? 1 : null }; });
      var ret = this.invoke(main, args, null);
      res.exitCode = ret | 0;
      if (this.trace) this.snap("end", main.body.endLine);
    } catch (ex) {
      if (ex instanceof ExitSignal) {
        res.exitCode = ex.code;
        if (this.trace) this.snap("end", this.line, { exit: ex.code });
      } else {
        var err = ex;
        if (ex instanceof RangeError || (ex && ex.name === "RangeError" && /call stack/i.test(ex.message || ""))) {
          err = this.err("Too many function calls inside each other (the call stack ran out of room).", { line: this.line }, "This usually means a recursive function never reaches its base case.", "limit");
        } else if (!(ex instanceof CppError)) {
          err = this.err("The runner hit an internal problem: " + (ex && ex.message ? ex.message : ex), { line: this.line }, "Please report the program that caused this.", "internal");
          if (typeof console !== "undefined" && CPP.debug) console.error(ex);
        }
        res.ok = false;
        res.err = err.toJSON ? err.toJSON() : err;
        if (this.trace) { this.snaps.length = Math.min(this.snaps.length, this.maxSnaps); this.maxSnaps++; this.snap("error", err.line, { msg: err.msg, hint: err.hint }); }
      }
    }
    this.streams.forEach(function (s) { if (s.kind === "ofile" && s.isOpen) self.files[s.file] = s.buf; });
    res.out = this.outParts.join("");
    res.steps = this.steps;
    res.leaks = this.heap.filter(function (o) { return o.alive; }).length;
    res.files = this.files;
    if (this.trace) {
      res.snaps = this.snaps; res.calls = this.calls; res.snapLimit = this.snapLimit;
      res.structs = {};
      prog.structs.forEach(function (st, name) { if (st.complete) res.structs[name] = st.fields.map(function (f) { return [f.name, typeStr(f.ty)]; }); });
    }
    return res;
  };

  var probed = null;
  CPP.maxCallDepth = function () {
    if (probed === null) {
      var d = 0;
      var f = function () { d++; f(); };
      try { f(); } catch (e) { /* stack full */ }
      probed = d;
    }
    return Math.max(150, Math.min(3000, Math.floor(probed / 17)));
  };

  CPP.compile = function (src) {
    var prog = CPP.parse(src);
    CPP.check(prog);
    return prog;
  };
  CPP.run = function (src, opts) {
    opts = opts || {};
    var prog;
    try {
      prog = CPP.compile(src);
    } catch (ex) {
      if (!(ex instanceof CppError)) {
        if (typeof console !== "undefined" && CPP.debug) console.error(ex);
        ex = new CppError("internal", "The checker hit an internal problem: " + (ex && ex.message ? ex.message : ex), 0, 0, "");
      }
      return { ok: false, out: "", err: ex.toJSON(), warnings: [], steps: 0, snaps: null, calls: null, leaks: 0, exitCode: 1, compiled: false, files: opts.files || {} };
    }
    var rt = new Runtime(prog, opts);
    return rt.run();
  };
  CPP.Runtime = Runtime;
  CPP.charText = charText;
})(CPP);
