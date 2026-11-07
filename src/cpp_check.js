/* COMP 2611 Code Lab — C++ subset, part 3: checker. Resolves names, works out types and gives friendly errors before running. */
(function (CPP) {
  "use strict";
  var TY = CPP.TY, ptrTo = CPP.ptrTo, arrOf = CPP.arrOf, typeStr = CPP.typeStr, sameType = CPP.sameType;
  var STREAM_TY = CPP.STREAM_TY, cerr = CPP.cerr;

  function isNum(t) { return CPP.NUM_KINDS.has(t.k); }
  function isInt(t) { return CPP.INT_KINDS.has(t.k); }
  function isPtr(t) { return t.k === "ptr"; }
  function decay(t) { return t.k === "arr" ? ptrTo(t.of) : t; }
  function isErr(t) { return !t || t.k === "err"; }
  function isStrLike(t) { return t.k === "string" || t.k === "lit"; }
  function isCharPtr(t) { t = decay(t); return t.k === "ptr" && (t.to.k === "char" || t.to.k === "uchar"); }
  var RANK = { bool: 1, char: 1, uchar: 1, short: 1, int: 2, enum: 2, null: 4, uint: 3, long: 4, ulong: 5, llong: 6 };
  function arith(a, b) {
    if (a.k === "double" || b.k === "double") return TY.double;
    if (a.k === "float" || b.k === "float") return TY.float;
    var r = Math.max(RANK[a.k] || 2, RANK[b.k] || 2, 2);
    return r === 2 ? TY.int : r === 3 ? TY.uint : r === 4 ? TY.long : r === 5 ? TY.ulong : TY.llong;
  }
  function promote(t) { return (t.k === "float" || t.k === "double") ? t : arith(t, TY.int); }
  CPP.arith = arith; CPP.decay = decay; CPP.isNum = isNum; CPP.isInt = isInt;

  // ---- sizes (matching g++ on 64-bit Linux)
  function sizeOf(t) {
    switch (t.k) {
      case "bool": case "char": case "uchar": return 1;
      case "short": return 2;
      case "int": case "uint": case "float": case "enum": return 4;
      case "long": case "ulong": case "llong": case "double": case "ptr": case "null": case "nullptr": return 8;
      case "string": return 32;
      case "stream": return t.name === "ifstream" ? 520 : t.name === "ofstream" ? 512 : t.ss ? 384 : 272;
      case "arr": return (t.n || 0) * sizeOf(t.of);
      case "struct": return layout(t).size;
      default: return 1;
    }
  }
  function alignOf(t) {
    if (t.k === "arr") return alignOf(t.of);
    if (t.k === "struct") return layout(t).align;
    if (t.k === "string" || t.k === "stream") return 8;
    return Math.min(8, sizeOf(t)) || 1;
  }
  function layout(st) {
    if (st._layout) return st._layout;
    var off = 0, al = 1;
    st.fields.forEach(function (f) {
      var a = alignOf(f.ty), s = sizeOf(f.ty);
      off = Math.ceil(off / a) * a;
      f.offset = off;
      off += s;
      al = Math.max(al, a);
    });
    var size = Math.max(1, Math.ceil(off / al) * al);
    st._layout = { size: size, align: al };
    return st._layout;
  }
  CPP.sizeOf = sizeOf;

  // ---- builtins
  var IO = { header: ["iostream"], std: true };
  var BUILTIN_VALUES = {
    cout: { ty: STREAM_TY.ostream, header: ["iostream"], std: true },
    cin: { ty: STREAM_TY.istream, header: ["iostream"], std: true },
    cerr: { ty: STREAM_TY.ostream, header: ["iostream"], std: true },
    endl: { ty: TY.manip, header: ["iostream", "fstream", "sstream"], std: true },
    fixed: { ty: TY.manip, header: ["iostream", "iomanip", "fstream", "sstream"], std: true },
    scientific: { ty: TY.manip, header: ["iostream", "iomanip", "fstream", "sstream"], std: true },
    left: { ty: TY.manip, header: ["iostream", "iomanip", "fstream", "sstream"], std: true },
    right: { ty: TY.manip, header: ["iostream", "iomanip", "fstream", "sstream"], std: true },
    boolalpha: { ty: TY.manip, header: ["iostream", "fstream", "sstream"], std: true },
    noboolalpha: { ty: TY.manip, header: ["iostream", "fstream", "sstream"], std: true },
    showpoint: { ty: TY.manip, header: ["iostream", "fstream", "sstream"], std: true },
    noshowpoint: { ty: TY.manip, header: ["iostream", "fstream", "sstream"], std: true },
    flush: { ty: TY.manip, header: ["iostream", "fstream", "sstream"], std: true },
    INT_MAX: { ty: TY.int, v: 2147483647 }, INT_MIN: { ty: TY.int, v: -2147483648 }, RAND_MAX: { ty: TY.int, v: 2147483647 },
    LONG_MAX: { ty: TY.long, v: 9223372036854775807 }, UINT_MAX: { ty: TY.uint, v: 4294967295 },
    EXIT_SUCCESS: { ty: TY.int, v: 0 }, EXIT_FAILURE: { ty: TY.int, v: 1 }
  };
  CPP.BUILTIN_VALUES = BUILTIN_VALUES;
  var MATH1 = "sqrt fabs floor ceil round trunc log log10 log2 exp sin cos tan asin acos atan cbrt".split(" ");
  var BUILTIN_FUNCS = new Set(MATH1.concat("pow atan2 fmod hypot abs min max swap rand srand time exit system abort toupper tolower isdigit isalpha isspace isupper islower isalnum ispunct isxdigit to_string stoi stol stod stof atoi atof strlen strcpy strcat strcmp strncpy strncmp getline setw setprecision setfill __liveNodes".split(" ")));
  CPP.BUILTIN_FUNCS = BUILTIN_FUNCS;
  var STD_FUNCS = new Set(MATH1.concat("pow atan2 fmod hypot abs min max swap to_string stoi stol stod stof getline setw setprecision setfill".split(" ")));
  var STRING_METHODS = "length size empty substr find rfind at c_str append push_back pop_back insert erase clear front back replace compare".split(" ");
  var STREAM_METHODS = "open close is_open eof fail good bad clear ignore get peek str getline unget precision".split(" ");
  CPP.STRING_METHODS = STRING_METHODS; CPP.STREAM_METHODS = STREAM_METHODS;

  function Checker(prog) {
    this.prog = prog;
    this.src = prog.src;
    this.warnings = prog.warnings.slice();
    this.globals = new Map();
    this.globalList = [];
    this.funcs = new Map();
    this.includes = new Set(prog.includes.map(function (x) { return x.name.replace(/\.h$/, ""); }));
    this.scopes = [];
    this.fn = null;
    this.loopDepth = 0;
    this.switchDepth = 0;
    this.allFuncNames = new Map();
    this.calledFns = [];
    var self = this;
    prog.items.forEach(function (it) {
      if ((it.k === "func" || it.k === "proto") && !self.allFuncNames.has(it.name)) self.allFuncNames.set(it.name, it);
    });
  }
  var C = Checker.prototype;

  C.text = function (n) { return n && n.s !== undefined && n.z !== undefined ? this.src.slice(n.s, n.z).replace(/\s+/g, " ").trim() : "this"; };
  C.fail = function (msg, at, hint) { throw cerr(msg, at, hint); };
  C.warn = function (msg, at) { this.warnings.push({ line: at ? at.line : 0, msg: msg }); };
  C.hasHeader = function (list) { var self = this; return list.some(function (h) { return self.includes.has(h); }); };

  // ---------------------------------------------------------------- names
  C.lookup = function (name) {
    for (var i = this.scopes.length - 1; i >= 0; i--) {
      var v = this.scopes[i].get(name);
      if (v) return v;
    }
    return this.globals.get(name) || null;
  };
  C.allNames = function () {
    var out = new Set();
    this.scopes.forEach(function (s) { s.forEach(function (_, k) { out.add(k); }); });
    this.globals.forEach(function (_, k) { out.add(k); });
    this.funcs.forEach(function (_, k) { out.add(k); });
    Object.keys(BUILTIN_VALUES).forEach(function (k) { out.add(k); });
    BUILTIN_FUNCS.forEach(function (k) { if (k[0] !== "_") out.add(k); });
    this.prog.structs.forEach(function (_, k) { out.add(k); });
    out.add("NULL");
    return Array.from(out);
  };
  C.suggest = function (name, names) {
    var best = null, bd = 99, lname = name.toLowerCase();
    (names || this.allNames()).forEach(function (n) {
      var d = CPP.editDistance(lname, n.toLowerCase());
      if (n.toLowerCase() === lname) d = 0.5;
      if (d < bd) { bd = d; best = n; }
    });
    var limit = name.length <= 3 ? 1 : name.length <= 6 ? 2 : 3;
    return bd <= limit ? best : null;
  };
  C.undeclared = function (node, name) {
    if (this.allFuncNames.has(name) && !this.funcs.has(name)) {
      var f = this.allFuncNames.get(name);
      this.fail("The function " + name + " is used here, but it is only declared further down (line " + f.line + ").", node,
        "C++ reads from top to bottom. Move " + name + " above the code that uses it, or add a prototype such as  " + this.protoText(f) + "  near the top.");
    }
    var fieldOf = null;
    this.prog.structs.forEach(function (st) { if (st.fmap.has(name)) fieldOf = st; });
    var sug = this.suggest(name);
    var hint = "";
    if (sug) hint = "Did you mean " + sug + "?" + (sug.toLowerCase() === name.toLowerCase() ? " C++ is case-sensitive." : "");
    else if (fieldOf) hint = name + " is a field of " + fieldOf.name + ". You need a " + fieldOf.name + " to get it from, for example  p->" + name + "  or  n." + name + ".";
    else if (name === "nullptr") hint = "Use NULL.";
    else if (name === "string" || name === "cout" || name === "cin" || name === "endl") hint = "Add  using namespace std;  below the #include lines.";
    else hint = "Every variable must be declared (with its type) before it is used, and only exists inside the { } where it was declared.";
    this.fail(name + " has not been declared.", node, hint);
  };
  C.protoText = function (f) {
    var ps = f.params.map(function (p) { return typeStr(p.shown || p.ty) + (p.name ? " " + p.name : ""); }).join(", ");
    return typeStr(f.ret) + " " + f.name + " (" + ps + ");";
  };
  C.checkStdName = function (name, node, qual, info) {
    if (info && info.header && !this.hasHeader(info.header)) {
      this.fail("To use " + name + " you need  #include <" + info.header[0] + ">  at the top of the file.", node);
    }
    if (info && info.std && !qual && !this.prog.usingStd && !this.prog.usingNames.has(name)) {
      this.fail(name + " belongs to the std namespace.", node, "Add the line  using namespace std;  after the #include lines (or write std::" + name + ").");
    }
  };

  C.declare = function (name, info, at) {
    var scope = this.scopes[this.scopes.length - 1];
    var prev = scope.get(name);
    if (prev) {
      if (prev.kind === "param") this.fail("The parameter " + name + " is declared again inside the function.", at, "Use a different name for the new variable, or just use the parameter.");
      this.fail(name + " is already declared in this block (line " + prev.line + ").", at, "Use a different name, or remove the type to assign to the existing variable:  " + name + " = ...;");
    }
    if (this.funcs.has(name) && this.scopes.length === 0) this.fail(name + " is already the name of a function.", at);
    scope.set(name, info);
  };

  // ---------------------------------------------------------------- types
  C.resolveType = function (t, at, opts) {
    opts = opts || {};
    if (t.k === "arr") {
      this.resolveType(t.of, at, { inArray: true });
      if (t.nExpr) {
        var nt = this.ex(t.nExpr);
        if (!isInt(nt)) this.fail("An array size must be a whole number.", t.nExpr);
        var c = this.constEval(t.nExpr);
        if (c !== null) { t.n = c; t.nExpr = null; }
        else if (opts.global) this.fail("A global array's size must be a constant.", t.nExpr, "Use a number or a const int, like  const int SIZE = 100;");
        else t.vla = true;
      }
      if (t.n !== null && t.n <= 0 && !opts.param) this.fail("An array must have at least one element.", at);
      if (t.of.k === "arr" && t.of.n === null) this.fail("Only the first size of a 2D array can be left empty.", at);
      if (t.of.k === "void") this.fail("You cannot have an array of void.", at);
      return t;
    }
    if (t.k === "ptr") { this.resolvePtrTarget(t.to, at); return t; }
    if (t.k === "ref") { this.resolveType(t.to, at, opts); return t; }
    if (t.k === "struct" && !t.complete) {
      this.fail("struct " + t.name + " is used before it is defined.", at, "Define the struct (with all its fields) above this line. A struct can only hold a pointer to its own type, like  Node * next;");
    }
    return t;
  };
  C.resolvePtrTarget = function (t, at) {
    if (t.k === "ptr") return this.resolvePtrTarget(t.to, at);
    if (t.k === "arr") return this.resolveType(t, at, {});
    return t;
  };

  C.constEval = function (e) {
    var self = this;
    switch (e.k) {
      case "num": return e.isFloat ? null : e.v;
      case "chr": return e.v;
      case "bool": return e.v;
      case "un": { var v = self.constEval(e.e); if (v === null) return null; return e.op === "-" ? -v : e.op === "+" ? v : e.op === "!" ? (v ? 0 : 1) : ~v; }
      case "id": {
        var info = self.lookup(e.name);
        if (info && info.kind === "enumc") return info.v;
        if (info && info.isConst && info.cval !== undefined && info.cval !== null) return info.cval;
        if (BUILTIN_VALUES[e.name] && BUILTIN_VALUES[e.name].v !== undefined) return BUILTIN_VALUES[e.name].v;
        return null;
      }
      case "bin": {
        var a = self.constEval(e.a), b = self.constEval(e.b);
        if (a === null || b === null) return null;
        switch (e.op) {
          case "+": return a + b; case "-": return a - b; case "*": return a * b;
          case "/": return b ? Math.trunc(a / b) : null; case "%": return b ? a % b : null;
          case "<<": return a << b; case ">>": return a >> b;
          case "<": return +(a < b); case ">": return +(a > b); case "==": return +(a === b);
        }
        return null;
      }
      case "sizeof": return e.v !== undefined ? e.v : null;
      case "cast": return isInt(e.ty) ? self.constEval(e.e) : null;
    }
    return null;
  };

  // Can a value of type `from` be stored in type `to`? Throws a friendly error if not.
  C.convCheck = function (from, to, node, what) {
    if (isErr(from) || isErr(to)) return;
    var self = this, src = this.text(node), T = typeStr(to), F = typeStr(from);
    function no(msg, hint) { self.fail(msg || ("Cannot convert " + F + " to " + T + (what ? " in this " + what : "") + "."), node, hint); }
    if (to.k === "ref") to = to.to;
    if (from.k === "void") no("This expression has no value (its type is void), so it cannot be used as a " + T + ".", "A void function does not return anything. Make it return a value, or call it on its own line.");
    switch (to.k) {
      case "bool": case "char": case "uchar": case "short": case "int": case "uint": case "long": case "ulong": case "llong": case "float": case "double":
        if (isNum(from)) {
          if (from.k === "enum" || to.k === "bool") return;
          if (isInt(to) && (from.k === "double" || from.k === "float") && what !== "argument") return;
          return;
        }
        if (isPtr(decay(from)) || from.k === "nullptr") {
          if (to.k === "bool") return;
          return no("Cannot store a pointer (" + F + ") in " + T + ".", "A pointer holds an address. To get the value it points to, use * or ->, for example  *p  or  p->data.");
        }
        if (isStrLike(from)) return no("Cannot convert text (" + F + ") to " + T + ".", to.k === "char" ? "A char is written with single quotes, like 'a'." : "To turn text into a number, use stoi(s) for int or stod(s) for double.");
        if (from.k === "struct") return no("Cannot convert a whole " + F + " struct to " + T + ".", "Use one of its fields, for example  " + src + "." + (from.fields[0] ? from.fields[0].name : "field") + ".");
        return no();
      case "enum":
        if (from.k === "enum" && from.name === to.name) return;
        if (isInt(from)) return no("Cannot store a number in the enum type " + T + " without a cast.", "Use one of its named values, or a cast like (" + T + ") n.");
        return no();
      case "ptr": {
        if (from.k === "null" || from.k === "nullptr") return;
        if (from.k === "lit" && (to.to.k === "char")) return;
        if (isInt(from)) {
          if (node && node.k === "num" && node.v === 0) return;
          return no("Cannot store the number " + src + " in a pointer (" + T + ").", "A pointer holds an address. Use NULL for 'no address', or new to make an object.");
        }
        var f = decay(from);
        if (f.k === "ptr") {
          if (sameType(f.to, to.to) || to.to.k === "void") return;
          if (f.to.k === "ptr" && sameType(f.to.to, to.to)) return no("Cannot convert " + F + " to " + T + ": there is one * too many.", "Use *" + src + " to follow the extra pointer.");
          if (to.to.k === "ptr" && sameType(f.to, to.to.to)) return no("Cannot convert " + F + " to " + T + ".", "Did you mean &" + src + "?");
          return no("Cannot convert " + F + " to " + T + ".", "The two pointers point to different types.");
        }
        if (from.k === "struct" && sameType(from, to.to)) return no(src + " is a " + F + " struct, but a pointer (" + T + ") is needed here.", "Use &" + src + " to get its address.");
        if (from.k === "string" && to.to.k === "char") return no("Cannot convert a string to " + T + ".", "Use " + src + ".c_str() to get the characters.");
        return no();
      }
      case "struct":
        if (from.k === "struct" && from.name === to.name) return;
        if (from.k === "ptr" && sameType(from.to, to)) return no(src + " is a pointer (" + F + "), but a " + T + " struct is needed here.", "Use *" + src + " to get the struct it points to.");
        return no();
      case "string":
        if (isStrLike(from) || isCharPtr(from)) return;
        if ((from.k === "char" || isInt(from)) && what === "assignment") return;
        if (from.k === "char") return no("Cannot convert a char to a string here.", "Use double quotes for a string, like \"a\", or write  string(1, c).");
        if (isNum(from)) return no("Cannot convert a number to a string.", "Use to_string(" + src + ").");
        return no();
      case "arr":
        if (to.of.k === "char" && from.k === "lit") return;
        return no("Arrays cannot be copied with =.", "Copy them one element at a time with a loop.");
      case "stream":
        return no("Streams such as " + T + " cannot be copied.", "Pass streams by reference, for example  (" + T + " & in).");
      case "void":
        return no("Cannot use a value as void.");
      case "lit":
        return no();
    }
    if (!sameType(from, to)) no();
  };

  // ---------------------------------------------------------------- program
  C.checkProgram = function () {
    var self = this;
    this.prog.items.forEach(function (it) {
      switch (it.k) {
        case "struct": self.checkStruct(it.st); break;
        case "enum":
          it.en.consts.forEach(function (c) {
            if (self.globals.has(c.name)) self.fail(c.name + " is already declared.", it);
            self.globals.set(c.name, { kind: "enumc", ty: it.en, v: c.v, line: it.line, name: c.name });
          });
          break;
        case "decl": self.checkGlobalDecl(it); break;
        case "proto": self.declareFunc(it, false); break;
        case "func": self.checkFunc(it); break;
      }
    });
    this.prog.stdUses.forEach(function (u) {
      var hdr = u.name === "string" ? ["iostream", "string", "sstream", "fstream"] : /^(ifstream|ofstream|fstream)$/.test(u.name) ? ["fstream"] : /stringstream$/.test(u.name) ? ["sstream"] : ["iostream", "fstream", "sstream"];
      self.checkStdName(u.name, u.tok, u.qual, { std: true, header: hdr });
    });
    var mains = this.funcs.get("main");
    if (!mains) {
      throw new CPP.CppError("compile", "This program has no main function.", 1, 1, "Every C++ program starts running at  int main() { ... }");
    }
    var main = mains[0];
    if (!main.def) this.fail("main is declared but has no body.", main.node);
    this.calledFns.forEach(function (c) {
      if (!c.fn.def) {
        self.fail("The function " + c.fn.name + " is declared (line " + c.fn.line + ") but never written (it has no body).", c.node,
          "Write the function with { } somewhere in the file. Check that the definition's parameter types match the prototype exactly.");
      }
    });
    this.prog.structs.forEach(function (st) { if (st.complete) layout(st); });
    return { main: main, funcs: this.funcs, globals: this.globalList, warnings: this.warnings };
  };

  C.checkStruct = function (st) {
    var self = this;
    st.fields.forEach(function (f) {
      if (f.ty.k === "struct" && f.ty === st) self.fail("struct " + st.name + " cannot contain a " + st.name + " inside itself.", f.tok, "Use a pointer instead:  " + st.name + " * " + f.name + ";");
      if (f.ty.k === "ref") self.fail("Reference fields are not supported.", f.tok);
      if (f.ty.k === "void") self.fail("A field cannot be void.", f.tok);
      self.scopes.push(new Map());
      self.resolveType(f.ty, f.tok, { global: true });
      if (f.init) {
        var it = f.init.k === "init" ? null : self.ex(f.init);
        if (it) self.convCheck(it, f.ty, f.init, "field value");
      }
      self.scopes.pop();
    });
  };

  C.checkGlobalDecl = function (node) {
    var self = this;
    node.decls.forEach(function (d) {
      self.resolveType(d.ty, d.nameTok, { global: true });
      if (d.ty.k === "void") self.fail("A variable cannot be void.", d.nameTok);
      if (self.globals.has(d.name) || self.funcs.has(d.name)) self.fail(d.name + " is already declared.", d.nameTok);
      self.checkInit(d, true);
      var info = { kind: "global", ty: d.ty, isConst: d.isConst, line: d.line, name: d.name, decl: d };
      if (d.isConst && d.init && d.initKind === "=" && isInt(d.ty)) info.cval = self.constEval(d.init);
      d.gi = self.globalList.length;
      self.globalList.push(d);
      self.globals.set(d.name, info);
    });
  };

  C.paramKey = function (params) { return params.map(function (p) { return typeStr(p.ty); }).join(","); };

  C.declareFunc = function (node, isDef) {
    var self = this;
    if (this.globals.has(node.name)) this.fail(node.name + " is already declared as a variable.", node);
    if (BUILTIN_FUNCS.has(node.name) && node.name !== "swap" && node.name !== "max" && node.name !== "min") {
      // students may write their own versions; allow, but user function wins
    }
    node.params.forEach(function (p) {
      if (p.ty.k === "void") self.fail("A parameter cannot be void.", p.tok);
      self.scopes.push(new Map());
      self.resolveType(p.ty, p.tok, { param: true });
      if (p.shown && p.shown.k === "arr") self.resolveType(p.shown, p.tok, { param: true });
      if (p.ty.k === "stream") self.fail("Streams must be passed by reference.", p.tok, "Write  " + typeStr(p.ty) + " & " + (p.name || "in") + "  in the parameter list.");
      self.scopes.pop();
    });
    if (!isDef) node.params.forEach(function (p) { if (p.def) { self.scopes.push(new Map()); self.convCheck(self.ex(p.def), p.ty, p.def, "default value"); self.scopes.pop(); } });
    var key = this.paramKey(node.params);
    var list = this.funcs.get(node.name);
    if (!list) { list = []; this.funcs.set(node.name, list); }
    var existing = null;
    list.forEach(function (f) { if (f.key === key) existing = f; });
    if (existing) {
      if (!sameType(existing.ret, node.ret)) this.fail("The return type of " + node.name + " does not match its earlier declaration on line " + existing.line + ".", node, "The prototype and the function must have the same return type.");
      if (isDef && existing.def) this.fail("The function " + node.name + " is written twice (also on line " + existing.def.line + ").", node, "Remove one of them.");
      if (isDef) {
        node.params.forEach(function (p, i) { if (!p.def && existing.params[i] && existing.params[i].def) p.def = existing.params[i].def; });
        existing.def = node; existing.params = node.params;
      }
      return existing;
    }
    if (node.name === "main" && list.length) this.fail("There can only be one main function.", node);
    var info = { name: node.name, ret: node.ret, params: node.params, key: key, def: isDef ? node : null, line: node.line, node: node };
    list.push(info);
    if (node.name === "main" && node.ret.k !== "int") this.fail("main must return int.", node, "Write  int main()  and end it with  return 0;");
    return info;
  };

  C.checkFunc = function (node) {
    var self = this;
    var info = this.declareFunc(node, true);
    this.fn = { info: info, node: node, slots: 0, ret: node.ret };
    this.scopes.push(new Map());
    node.params.forEach(function (p, i) {
      if (!p.name) return;
      p.slot = self.fn.slots++;
      self.declare(p.name, { kind: "param", ty: p.ty, isConst: p.isConst, line: p.tok.line, name: p.name, slot: p.slot, arrParam: !!(p.shown && p.shown.k === "arr") }, p.tok);
    });
    node.params.forEach(function (p) { if (p.def && p.def.ty === undefined) { var dt = self.ex(p.def); self.convCheck(dt, p.ty, p.def, "default value"); } });
    this.checkBlock(node.body, true);
    this.scopes.pop();
    node.nSlots = this.fn.slots;
    if (node.ret.k !== "void" && node.name !== "main" && !this.returns(node.body)) {
      this.warn("The function " + node.name + " can reach its closing } without returning a value.", { line: node.body.endLine });
    }
    this.fn = null;
  };

  // does this statement always end with return (or never finish)?
  C.returns = function (s) {
    if (!s) return false;
    switch (s.k) {
      case "return": return true;
      case "block": return s.body.some(this.returns, this);
      case "if": return !!s.f && this.returns(s.t) && this.returns(s.f);
      case "while": return s.c.k === "bool" && s.c.v === 1 && !this.hasBreak(s.body);
      case "for": return !s.c && !this.hasBreak(s.body);
      case "do": return this.returns(s.body);
      case "expr": return s.e.k === "call" && (s.e.name === "exit" || s.e.name === "abort");
      case "switch": {
        var hasDefault = s.cases.some(function (c) { return !c.v; });
        if (!hasDefault) return false;
        var self = this;
        return s.cases.every(function (c, i) {
          var body = { k: "block", body: [].concat.apply([], s.cases.slice(i).map(function (x) { return x.body; })) };
          return self.returns(body) && !self.hasBreak(body);
        });
      }
    }
    return false;
  };
  C.hasBreak = function (s) {
    if (!s) return false;
    switch (s.k) {
      case "break": return true;
      case "block": return s.body.some(this.hasBreak, this);
      case "if": return this.hasBreak(s.t) || this.hasBreak(s.f);
      default: return false;
    }
  };

  // ---------------------------------------------------------------- statements
  C.checkBlock = function (b, fnBody) {
    var self = this;
    if (!fnBody) this.scopes.push(new Map());
    b.body.forEach(function (s) { self.stmt(s); });
    if (!fnBody) this.scopes.pop();
  };
  C.cond = function (e, what) {
    var t = this.ex(e);
    if (e.k === "assign" && e.op === "=" && !e.paren) {
      this.warn("The " + what + " uses = (assignment). Did you mean == (comparison)?", e);
    }
    this.boolCheck(t, e, what);
  };
  C.boolCheck = function (t, e, what) {
    if (isErr(t)) return;
    if (isNum(t) || isPtr(decay(t)) || t.k === "stream" || t.k === "nullptr") return;
    if (t.k === "void") this.fail("The " + what + " calls something that returns void, so it has no true/false value.", e);
    if (isStrLike(t)) this.fail("A string cannot be used as a true/false " + what + ".", e, "Compare it, for example  s == \"yes\"  or  s.empty().");
    if (t.k === "struct") this.fail("A whole struct cannot be used as a true/false " + what + ".", e, "Compare one of its fields, or use a pointer and compare it with NULL.");
    this.fail("This " + what + " is not a true/false value.", e);
  };

  C.stmt = function (s) {
    var self = this;
    switch (s.k) {
      case "block": this.checkBlock(s, false); return;
      case "empty": case "using": return;
      case "decl": this.checkLocalDecl(s); return;
      case "expr": {
        var e = s.e;
        this.ex(e);
        if (e.k === "bin" && /^(==|!=|<|>|<=|>=)$/.test(e.op)) this.warn("This comparison does nothing on its own. Did you mean = (assignment)?", e);
        else if (e.k === "id" || e.k === "num") this.warn("This statement does nothing.", e);
        else if (e.k === "bin" && /^[+\-*/%]$/.test(e.op)) this.warn("The result of this calculation is not stored anywhere.", e);
        return;
      }
      case "if":
        this.cond(s.c, "if condition");
        this.scopes.push(new Map()); this.stmt(s.t); this.scopes.pop();
        if (s.f) { this.scopes.push(new Map()); this.stmt(s.f); this.scopes.pop(); }
        return;
      case "while":
        this.cond(s.c, "while condition");
        this.loopDepth++; this.scopes.push(new Map()); this.stmt(s.body); this.scopes.pop(); this.loopDepth--;
        return;
      case "do":
        this.loopDepth++; this.scopes.push(new Map()); this.stmt(s.body); this.scopes.pop(); this.loopDepth--;
        this.cond(s.c, "do-while condition");
        return;
      case "for":
        this.scopes.push(new Map());
        if (s.init) this.stmt(s.init);
        if (s.c) this.cond(s.c, "for loop condition");
        if (s.step) this.ex(s.step);
        this.loopDepth++; this.scopes.push(new Map()); this.stmt(s.body); this.scopes.pop(); this.loopDepth--;
        this.scopes.pop();
        return;
      case "switch": {
        var t = this.ex(s.e);
        if (!isInt(t) && !isErr(t)) this.fail("switch only works with whole numbers, chars and enums, not " + typeStr(t) + ".", s.e, isStrLike(t) ? "For strings, use if / else if with ==." : "");
        var seen = new Map();
        this.switchDepth++;
        this.scopes.push(new Map());
        s.cases.forEach(function (c) {
          if (c.v) {
            var ct = self.ex(c.v);
            if (isStrLike(ct)) self.fail("A case value must be a whole number or a char, not a string.", c.v, "Use single quotes for a char: case 'a':");
            var v = self.constEval(c.v);
            if (v === null) self.fail("A case value must be a constant (a number, a char or an enum value).", c.v);
            if (seen.has(v)) self.fail("The value " + self.text(c.v) + " appears in two cases (also line " + seen.get(v) + ").", c.v);
            seen.set(v, c.line);
            c.cv = v;
          }
          c.body.forEach(function (st) { self.stmt(st); });
        });
        if (s.cases.filter(function (c) { return !c.v; }).length > 1) this.fail("A switch can only have one default.", s);
        this.scopes.pop();
        this.switchDepth--;
        return;
      }
      case "return": {
        var fn = this.fn;
        if (s.e) {
          var rt = this.ex(s.e);
          if (fn.ret.k === "void") {
            if (rt.k !== "void") this.fail("The function " + fn.node.name + " is void, so it cannot return a value.", s.e, "Use  return;  on its own, or change void to the type you want to return.");
          } else {
            this.convCheck(rt, fn.ret, s.e, "return");
            if (fn.ret.k === "ref") this.refBind(s.e, rt, fn.ret.to, "return");
          }
        } else if (fn.ret.k !== "void") {
          this.fail(fn.node.name + " must return a " + typeStr(fn.ret) + " value.", s, "Write  return value;");
        }
        return;
      }
      case "break":
        if (!this.loopDepth && !this.switchDepth) this.fail("break can only be used inside a loop or a switch.", s);
        return;
      case "continue":
        if (!this.loopDepth) this.fail("continue can only be used inside a loop.", s);
        return;
    }
    this.fail("Unknown statement.", s);
  };

  C.checkLocalDecl = function (node) {
    var self = this;
    node.decls.forEach(function (d) {
      self.resolveType(d.ty, d.nameTok, {});
      if (d.ty.k === "void") self.fail("A variable cannot be void.", d.nameTok, "Use a type such as int, double or Node *.");
      if (d.ty.k === "arr" && d.ty.vla && d.init) self.fail("An array whose size is a variable cannot be given starting values.", d.nameTok, "Fill it with a loop after declaring it.");
      self.checkInit(d, false);
      if (d.isConst && !d.init && d.ty.k !== "string") self.fail("The const " + d.name + " must be given a value when it is declared.", d.nameTok);
      if (d.ty.k === "ref" && !d.init) self.fail("The reference " + d.name + " must be joined to a variable when it is declared.", d.nameTok, "For example  int & r = x;");
      d.slot = self.fn.slots++;
      var info = { kind: "local", ty: d.ty, isConst: d.isConst, line: d.line, name: d.name, slot: d.slot, decl: d };
      if (d.isConst && d.init && d.initKind === "=" && isInt(d.ty)) info.cval = self.constEval(d.init);
      self.declare(d.name, info, d.nameTok);
    });
  };

  C.checkInit = function (d, global) {
    var self = this, ty = d.ty;
    if (!d.init) {
      if (ty.k === "arr" && ty.n === null && !ty.vla) self.fail("The array " + d.name + " needs a size, like  " + typeStr(ty.of) + " " + d.name + "[10];", d.nameTok);
      if (ty.k === "stream" && (ty.name === "ifstream" || ty.name === "ofstream" || ty.name === "fstream" || ty.ss)) return;
      return;
    }
    if (d.initKind === "list") return this.checkList(d.init, ty, d);
    if (d.initKind === "ctor") {
      var args = d.init.map(function (a) { return self.ex(a); });
      if (ty.k === "stream") {
        if (ty.file) {
          if (args.length < 1 || args.length > 2) self.fail(ty.name + " takes the file name, like  " + ty.name + " in (\"data.txt\");", d.nameTok);
          if (!isStrLike(args[0]) && !isCharPtr(args[0])) self.fail("The file name must be text.", d.init[0]);
        } else if (ty.ss) {
          if (args.length !== 1 || !isStrLike(args[0])) self.fail("A " + ty.name + " is started with a string, like  istringstream ss (line);", d.nameTok);
        } else self.fail("cin and cout cannot be created.", d.nameTok);
        return;
      }
      if (ty.k === "string") {
        if (args.length === 1) { self.convCheck(args[0], TY.string, d.init[0], "initialisation"); return; }
        if (args.length === 2 && isInt(args[0]) && args[1].k === "char") return;
        self.fail("This way of making a string is not supported.", d.nameTok);
      }
      if (ty.k === "struct") self.fail("struct " + ty.name + " has no constructor, so it cannot be made with ( ).", d.nameTok, "Declare it, then set each field, or use { } with the field values in order.");
      if (ty.k === "ref") { if (args.length !== 1) self.fail("A reference is joined to exactly one variable.", d.nameTok); self.refBind(d.init[0], args[0], ty.to, "initialisation"); return; }
      if (args.length !== 1) self.fail("Expected one starting value in the ( ).", d.nameTok);
      self.convCheck(args[0], ty, d.init[0], "initialisation");
      return;
    }
    var it = this.ex(d.init);
    if (ty.k === "ref") return this.refBind(d.init, it, ty.to, "initialisation");
    if (ty.k === "arr") {
      if ((ty.of.k === "char") && it.k === "lit") {
        var need = d.init.v.length + 1;
        if (ty.n === null) ty.n = need;
        else if (ty.n < need) self.fail("The text \"" + d.init.v + "\" needs " + need + " chars (including the hidden '\\0' at the end), but the array only has " + ty.n + ".", d.init);
        return;
      }
      self.fail("An array is given its starting values with { }, like  int A[3] = {1, 2, 3};", d.init);
    }
    if (ty.k === "stream") self.fail("Streams cannot be copied.", d.init);
    if (ty.k === "string" && (it.k === "char" || (isNum(it) && it.k !== "null"))) {
      self.fail("Cannot start a string with " + (it.k === "char" ? "a char" : "a number") + ".", d.init, it.k === "char" ? "Use double quotes: \"a\" is a string, 'a' is a char." : "Use to_string(n).");
    }
    this.convCheck(it, ty, d.init, "initialisation");
  };

  C.checkList = function (list, ty, d) {
    var self = this;
    if (ty.k === "ref") this.fail("A reference cannot be given a list of values.", list);
    if (ty.k === "arr") {
      var leaf = 0, t = ty;
      var flat = list.items.every(function (x) { return x.k !== "init"; });
      if (ty.of.k === "arr" && flat) {
        // brace elision: int M[2][3] = {1,2,3,4,5,6}
        var inner = 1; t = ty.of;
        while (t.k === "arr") { inner *= t.n; t = t.of; }
        list.items.forEach(function (x) { self.convCheck(self.ex(x), t, x, "array value"); });
        if (ty.n === null) ty.n = Math.max(1, Math.ceil(list.items.length / inner));
        else if (list.items.length > ty.n * inner) self.fail("Too many values: the array holds " + ty.n * inner + ".", list);
        list.flatInner = inner;
        return;
      }
      if (ty.n === null) ty.n = Math.max(1, list.items.length);
      if (list.items.length > ty.n) self.fail("Too many values in { }: the array " + (d && d.name ? d.name + " " : "") + "has room for " + ty.n + ".", list.items[ty.n] || list);
      list.items.forEach(function (x) {
        if (x.k === "init") self.checkList(x, ty.of, null);
        else if (ty.of.k === "arr" && ty.of.of.k === "char" && x.k === "str") self.ex(x);
        else self.convCheck(self.ex(x), ty.of, x, "array value");
      });
      return leaf;
    }
    if (ty.k === "struct") {
      if (list.items.length > ty.fields.length) self.fail(ty.name + " has " + ty.fields.length + " fields, but " + list.items.length + " values were given.", list);
      list.items.forEach(function (x, i) {
        var ft = ty.fields[i].ty;
        if (x.k === "init") self.checkList(x, ft, null);
        else self.convCheck(self.ex(x), ft, x, "field value");
      });
      return;
    }
    if (list.items.length > 1) self.fail("Too many values in { } for a " + typeStr(ty) + ".", list);
    if (list.items.length === 1) {
      if (list.items[0].k === "init") self.fail("Unexpected { } here.", list.items[0]);
      self.convCheck(self.ex(list.items[0]), ty, list.items[0], "initialisation");
    }
  };

  C.refBind = function (e, t, target, what) {
    if (isErr(t)) return;
    if (!e.lv) {
      this.fail("A reference must be joined to a variable, but " + this.text(e) + " is a value, not a variable.", e,
        what === "argument" ? "This parameter has &, so the function can change the caller's variable. Pass a variable here, or remove the & from the parameter." : "");
    }
    if (target.k === "ptr" && (t.k === "arr")) this.fail("An array cannot be passed to a pointer reference parameter.", e);
    if (!sameType(t, target)) {
      this.fail("The reference needs a " + typeStr(target) + " variable, but " + this.text(e) + " is a " + typeStr(t) + ".", e);
    }
  };

  // ---------------------------------------------------------------- expressions
  C.ex = function (e) {
    var t = this.ex1(e);
    e.ty = t;
    return t;
  };

  C.ex1 = function (e) {
    var self = this;
    switch (e.k) {
      case "num": {
        e.lv = false;
        if (e.isFloat) return e.suf && e.suf.indexOf("f") >= 0 ? TY.float : TY.double;
        if (e.suf && e.suf.indexOf("ll") >= 0) return TY.llong;
        if (e.suf && e.suf.indexOf("u") >= 0) return e.suf.indexOf("l") >= 0 ? TY.ulong : TY.uint;
        if (e.suf && e.suf.indexOf("l") >= 0) return TY.long;
        return e.v > 2147483647 ? TY.long : TY.int;
      }
      case "chr": e.lv = false; return TY.char;
      case "str": e.lv = false; return TY.lit;
      case "bool": e.lv = false; return TY.bool;
      case "null": e.lv = false; return TY.null;
      case "nullptr": e.lv = false; return TY.nullptr;
      case "npos": e.lv = false; e.v = -1; return TY.ulong;
      case "iosflag": e.lv = false; return TY.iosflag;
      case "id": return this.exId(e);
      case "assign": return this.exAssign(e);
      case "bin": return this.exBin(e);
      case "logic": {
        var a = this.ex(e.a), b = this.ex(e.b);
        this.boolCheck(a, e.a, "operand of " + e.op);
        this.boolCheck(b, e.b, "operand of " + e.op);
        e.lv = false;
        return TY.bool;
      }
      case "un": {
        var ut = this.ex(e.e);
        e.lv = false;
        if (e.op === "!") { this.boolCheck(ut, e.e, "operand of !"); return TY.bool; }
        if (!isNum(ut)) this.fail("The " + e.op + " sign only works on numbers, not on " + typeStr(ut) + ".", e);
        if (e.op === "~" && !isInt(ut)) this.fail("~ only works on whole numbers.", e);
        return promote(ut);
      }
      case "deref": {
        var dt = this.ex(e.e);
        e.lv = true;
        if (isErr(dt)) return TY.err;
        if (dt.k === "arr") return dt.of;
        if (dt.k !== "ptr") {
          this.fail("* can only follow a pointer, but " + this.text(e.e) + " is a " + typeStr(dt) + ".", e,
            dt.k === "struct" ? "It is already a struct, so use its fields directly with a dot." : "Only use * on variables declared with *, like Node * p.");
        }
        if (dt.to.k === "void") this.fail("Cannot follow a void* pointer.", e);
        if (dt.to.k === "struct" && !dt.to.complete) this.fail("struct " + dt.to.name + " is not defined yet.", e);
        return dt.to;
      }
      case "addr": {
        var at = this.ex(e.e);
        if (!e.e.lv) this.fail("& (address-of) needs a variable, but " + this.text(e.e) + " is just a value.", e);
        e.lv = false;
        return ptrTo(at);
      }
      case "pre": case "post": {
        var pt = this.ex(e.e);
        if (!e.e.lv) this.fail(e.op + " needs a variable to change.", e);
        this.constCheck(e.e);
        if (!isNum(pt) && !isPtr(pt)) this.fail(e.op + " only works on numbers and pointers, not " + typeStr(pt) + ".", e,
          pt.k === "struct" ? "To move along a linked list, write  p = p->next;" : "");
        if (pt.k === "bool") this.fail(e.op + " cannot be used on a bool.", e);
        e.lv = e.k === "pre";
        return pt;
      }
      case "cond": {
        this.cond(e.c, "condition of ? :");
        var ta = this.ex(e.a), tb = this.ex(e.b);
        e.lv = !!(e.a.lv && e.b.lv && sameType(ta, tb));
        if (isNum(ta) && isNum(tb)) return sameType(ta, tb) ? ta : arith(ta, tb);
        if (isPtr(decay(ta)) && (tb.k === "null" || tb.k === "nullptr")) return decay(ta);
        if (isPtr(decay(tb)) && (ta.k === "null" || ta.k === "nullptr")) return decay(tb);
        if (isStrLike(ta) && isStrLike(tb)) return ta.k === "string" || tb.k === "string" ? TY.string : TY.lit;
        if (sameType(decay(ta), decay(tb))) return decay(ta);
        this.fail("The two choices of ? : have different types (" + typeStr(ta) + " and " + typeStr(tb) + ").", e);
      }
      // falls through
      case "comma": this.ex(e.a); var ct = this.ex(e.b); e.lv = e.b.lv; return ct;
      case "call": return this.exCall(e);
      case "method": return this.exMethod(e);
      case "idx": {
        var it = this.ex(e.a), ix = this.ex(e.i);
        e.lv = true;
        if (isErr(it)) return TY.err;
        if (!isInt(ix) && !isErr(ix)) this.fail("An index must be a whole number, but " + this.text(e.i) + " is a " + typeStr(ix) + ".", e.i, ix.k === "double" ? "Convert it with (int) if you really mean to use it as an index." : "");
        if (it.k === "arr") return it.of;
        if (it.k === "ptr") { if (it.to.k === "void") this.fail("Cannot index a void*.", e); return it.to; }
        if (it.k === "string") return TY.char;
        if (it.k === "lit") { e.lv = false; return TY.char; }
        this.fail(this.text(e.a) + " is a " + typeStr(it) + ", so it cannot be used with [ ].", e, "[ ] is for arrays, pointers to arrays, and strings.");
      }
      // falls through
      case "mem": return this.exMember(e);
      case "cast": {
        var ft = this.ex(e.e);
        var to = e.ty0 || e.ty;
        e.ty0 = to;
        this.resolveType(to, e, {});
        e.lv = false;
        if (to.k === "ref") { e.lv = true; return to.to; }
        if (isNum(to) && (isNum(ft) || (isPtr(decay(ft)) && isInt(to) && sizeOfOK(to)))) return to;
        if (isPtr(to) && (isPtr(decay(ft)) || isInt(ft) || ft.k === "nullptr" || ft.k === "lit")) return to;
        if (to.k === "string" && (isStrLike(ft) || isCharPtr(ft))) return to;
        if (to.k === "string" && ft.k === "char") this.fail("Cannot convert a char to a string with a cast.", e, "Use  string(1, c).");
        if (to.k === "void") return to;
        if (sameType(to, ft)) return to;
        this.fail("Cannot convert " + typeStr(ft) + " to " + typeStr(to) + ".", e);
      }
      // falls through
      case "sizeof": {
        var st;
        if (e.ty0 || e.ty) { st = e.ty0 || e.ty; e.ty0 = st; this.resolveType(st, e, {}); }
        else st = this.ex(e.e);
        if (e.e && e.e.k === "id" && st.k === "ptr") {
          var info = this.lookup(e.e.name);
          if (info && info.arrParam) {
            this.warn("sizeof on an array parameter gives the size of a pointer (8), not of the whole array. Pass the array's length as another parameter.", e);
          }
        }
        if (st.k === "arr" && st.vla) this.fail("sizeof cannot be used on an array whose size is a variable.", e);
        e.v = sizeOf(st);
        e.lv = false;
        delete e.ty;
        return TY.ulong;
      }
      case "new": return this.exNew(e);
      case "strctor": {
        var sa = e.args.map(function (a) { return self.ex(a); });
        e.lv = false;
        if (!this.hasHeader(["iostream", "string", "sstream", "fstream"])) this.fail("To use string you need  #include <string>  (or <iostream>).", e);
        if (sa.length === 0) return TY.string;
        if (sa.length === 1) { this.convCheck(sa[0], TY.string, e.args[0], "conversion"); return TY.string; }
        if (sa.length === 2 && isInt(sa[0]) && sa[1].k === "char") return TY.string;
        this.fail("This way of making a string is not supported. Use string(), string(\"text\") or string(count, 'c').", e);
      }
      // falls through
      case "delete": {
        var del = this.ex(e.e);
        e.lv = false;
        if (isErr(del)) return TY.void;
        if (del.k !== "ptr") this.fail("delete needs a pointer (an address that came from new), but " + this.text(e.e) + " is a " + typeStr(del) + ".", e,
          del.k === "struct" ? "Variables that are not made with new are cleaned up automatically. Only delete pointers." : "");
        return TY.void;
      }
      case "init": this.fail("A list in { } cannot be used here.", e);
    }
    this.fail("This kind of expression is not supported (" + e.k + ").", e);
  };
  function sizeOfOK(t) { return t.k === "long" || t.k === "ulong" || t.k === "llong" || t.k === "int"; }

  C.constCheck = function (e) {
    if (e.k === "id") {
      var info = this.lookup(e.name);
      if (info && info.isConst) this.fail(e.name + " is const, so it cannot be changed.", e);
    }
  };

  C.exId = function (e) {
    var name = e.name;
    var info = e.qual ? null : this.lookup(name);
    if (info) {
      if (info.kind === "enumc") { e.res = { kind: "enum", v: info.v }; e.lv = false; return info.ty; }
      e.lv = true;
      if (info.kind === "global") { e.res = { kind: "global", gi: info.decl.gi, name: name }; }
      else e.res = { kind: "local", slot: info.slot, name: name };
      var ty = info.ty;
      e.isRef = ty.k === "ref";
      return ty.k === "ref" ? ty.to : ty;
    }
    var b = BUILTIN_VALUES[name];
    if (b) {
      this.checkStdName(name, e, e.qual, b);
      e.res = { kind: "builtin", name: name };
      e.lv = name === "cin" || name === "cout" || name === "cerr";
      return b.ty;
    }
    if (this.funcs.has(name) || BUILTIN_FUNCS.has(name)) this.fail(name + " is a function. To call it, write " + name + "( ... ) with its arguments.", e);
    if (this.prog.structs.has(name)) this.fail(name + " is a type, not a variable.", e, "To declare a variable of this type, write  " + name + " * p;  or  " + name + " n;");
    this.undeclared(e, name);
  };

  C.exAssign = function (e) {
    var lt = this.ex(e.a), rt = this.ex(e.b);
    e.lv = true;
    if (isErr(lt)) return TY.err;
    if (!e.a.lv) {
      var hint = "";
      if (e.a.k === "call") hint = "A function call gives a value; you cannot assign to it.";
      else if (e.a.k === "num" || e.a.k === "str" || e.a.k === "chr") hint = "Put the variable on the left:  x = " + this.text(e.a) + ";";
      this.fail("The left side of " + e.op + " must be a variable (somewhere to store the value).", e.a, hint);
    }
    this.constCheck(e.a);
    if (lt.k === "arr") this.fail("Arrays cannot be assigned with " + e.op + ".", e, lt.of.k === "char" ? "Use strcpy, or use a string variable instead of a char array." : "Copy the values one element at a time with a loop.");
    if (lt.k === "stream") this.fail("Streams cannot be assigned.", e);
    if (e.op === "=") {
      this.convCheck(rt, lt, e.b, "assignment");
      return lt;
    }
    var op = e.op.slice(0, -1);
    if (lt.k === "string") {
      if (op === "+" && (isStrLike(rt) || rt.k === "char" || isCharPtr(rt))) return lt;
      this.fail("Only += works on strings" + (op === "+" ? ", and only with text or a char" : "") + ".", e, op === "+" && isNum(rt) ? "Use to_string(n) to turn a number into text." : "");
    }
    if (isPtr(lt)) {
      if ((op === "+" || op === "-") && isInt(rt)) return lt;
      this.fail("Only += and -= with a whole number work on pointers.", e);
    }
    if (!isNum(lt) || !isNum(rt)) this.fail("The " + e.op + " operator needs numbers on both sides (here " + typeStr(lt) + " and " + typeStr(rt) + ").", e);
    if ((op === "%" || op === "<<" || op === ">>" || op === "&" || op === "|" || op === "^") && (!isInt(lt) || !isInt(rt))) this.fail(e.op + " only works with whole numbers.", e);
    return lt;
  };

  C.exBin = function (e) {
    var op = e.op;
    var lt = this.ex(e.a), rt = this.ex(e.b);
    e.lv = false;
    if (isErr(lt) || isErr(rt)) return TY.err;
    var L = this.text(e.a), R = this.text(e.b);
    var self = this;
    function bad(msg, hint) { self.fail(msg || ("The " + op + " operator cannot be used with " + typeStr(lt) + " and " + typeStr(rt) + "."), e.opTok || e, hint); }

    if (op === "<<" || op === ">>") {
      if (lt.k === "stream") {
        e.stream = true;
        if (op === "<<") {
          if (!lt.output) bad(L + " is an input stream, so it uses >> (for example  cin >> x).");
          if (rt.k === "void") bad("This calls something that returns void, so there is nothing to print.", "Call the function on its own line instead:  " + R + ";");
          if (rt.k === "struct") bad("cout cannot print a whole " + typeStr(rt) + " struct.", "Print its fields one at a time, for example  cout << " + R + "." + (rt.fields[0] ? rt.fields[0].name : "field"));
          if (rt.k === "stream" || rt.k === "iosflag") bad("This cannot be printed.");
          if (rt.k === "arr" && rt.of.k !== "char") this.warn("Printing an array prints its address, not its values. Use a loop to print each element.", e.b);
          e.ty = lt;
          e.lv = true;
          return lt;
        }
        if (!lt.input) bad(L + " is an output stream, so it uses << (for example  cout << x).");
        if (!e.b.lv) bad(">> needs a variable to store what is read, but " + R + " is not a variable.");
        this.constCheck(e.b);
        if (rt.k === "ptr" || rt.k === "struct" || rt.k === "stream" || rt.k === "enum") bad("Cannot read a " + typeStr(rt) + " with >>.", rt.k === "struct" ? "Read each field separately, for example  cin >> " + R + "." + (rt.fields[0] ? rt.fields[0].name : "field") : "");
        if (rt.k === "arr" && rt.of.k !== "char") bad("Cannot read a whole array with >>. Read one element at a time in a loop.");
        e.lv = true;
        return lt;
      }
      if (rt.k === "stream") bad("The stream must be on the left, like  cout << x  or  cin >> x.");
      if (lt.k === "lit" || lt.k === "string") bad("Did you forget cout? A line that prints must start with  cout <<.");
      if (!isInt(lt) || !isInt(rt)) bad();
      return promote(lt);
    }
    if (op === "+" || op === "-") {
      var dl = decay(lt), dr = decay(rt);
      if (lt.k === "string" || rt.k === "string") {
        if (op === "+" && ((lt.k === "string" && (isStrLike(rt) || rt.k === "char" || isCharPtr(rt))) || (rt.k === "string" && (isStrLike(lt) || lt.k === "char" || isCharPtr(lt))))) return TY.string;
        if (op === "+" && (isNum(lt) || isNum(rt))) bad("You cannot join a string and a number with +.", "Use to_string(n) to turn the number into text, or print them separately with <<.");
        bad("The " + op + " operator does not work on strings" + (op === "-" ? "" : " like this") + ".");
      }
      if (lt.k === "lit" || rt.k === "lit") {
        if (op === "+" && lt.k === "lit" && rt.k === "lit") bad("You cannot join two pieces of quoted text with +.", "Make one of them a string, like  string(\"abc\") + \"def\",  or just write them next to each other.");
        if (op === "+" && (isNum(lt) || isNum(rt))) bad("You cannot join text and a number with +.", "Print them separately:  cout << \"Total: \" << n;  or use to_string(n) with a string.");
        if (op === "+" && (lt.k === "char" || rt.k === "char")) bad("You cannot join quoted text and a char with +.", "Make it a string first, like  string(\"abc\") + c.");
        bad();
      }
      if (isNum(lt) && isNum(rt)) return arith(lt, rt);
      if (isPtr(dl) && isInt(rt)) { if (dl.to.k === "void") bad("Cannot do arithmetic on a void*."); return dl; }
      if (op === "+" && isInt(lt) && isPtr(dr)) return dr;
      if (op === "-" && isPtr(dl) && isPtr(dr)) {
        if (!sameType(dl.to, dr.to)) bad("Can only subtract pointers to the same type.");
        return TY.long;
      }
      if (isPtr(dl) || isPtr(dr)) bad("Cannot " + (op === "+" ? "add" : "subtract") + " " + typeStr(lt) + " and " + typeStr(rt) + ".", dl.k === "ptr" && dl.to.k === "struct" ? "To move to the next node in a list, write  p = p->next;" : "");
      if (lt.k === "struct" || rt.k === "struct") bad("Cannot " + (op === "+" ? "add" : "subtract") + " whole structs. Use their fields.");
      bad();
    }
    if (op === "*" || op === "/" || op === "%") {
      if (!isNum(lt) || !isNum(rt)) bad("The " + op + " operator needs numbers on both sides (here " + typeStr(lt) + " and " + typeStr(rt) + ").", isPtr(decay(lt)) || isPtr(decay(rt)) ? "To get the value a pointer points to, use *p or p->field." : "");
      if (op === "%" && (!isInt(lt) || !isInt(rt))) bad("% (remainder) only works with whole numbers.", "For doubles, use fmod(a, b) from <cmath>.");
      if ((op === "/" || op === "%") && e.b.k === "num" && e.b.v === 0) this.warn("Division by zero.", e.b);
      return arith(lt, rt);
    }
    if (op === "==" || op === "!=" || op === "<" || op === ">" || op === "<=" || op === ">=") {
      var pl = decay(lt), pr = decay(rt);
      if (isNum(lt) && isNum(rt)) {
        if ((lt.k === "null" && !isPtr(pr)) || (rt.k === "null" && !isPtr(pl))) {
          // NULL compared with a number: legal (it's 0) but suspicious
        }
        return TY.bool;
      }
      if (isPtr(pl) || isPtr(pr) || lt.k === "nullptr" || rt.k === "nullptr") {
        var nulls = { null: 1, nullptr: 1 };
        if (isPtr(pl) && isPtr(pr)) {
          if (pl.to.k === "char" && pr.to.k === "char" && (lt.k === "lit" || rt.k === "lit")) bad("Comparing char arrays with " + op + " compares addresses, not text.", "Use strcmp(a, b) == 0, or use string variables.");
          if (!sameType(pl.to, pr.to) && pl.to.k !== "void" && pr.to.k !== "void") bad("Cannot compare " + typeStr(pl) + " with " + typeStr(pr) + ".");
          return TY.bool;
        }
        if ((isPtr(pl) && nulls[rt.k]) || (isPtr(pr) && nulls[lt.k]) || (lt.k === "nullptr" && rt.k === "nullptr")) return TY.bool;
        if ((isPtr(pl) && e.b.k === "num" && e.b.v === 0) || (isPtr(pr) && e.a.k === "num" && e.a.v === 0)) return TY.bool;
        var p = isPtr(pl) ? L : R, o = isPtr(pl) ? rt : lt;
        if (isNum(o)) bad("Cannot compare the pointer " + p + " with a number.", "To compare the value it points to, use *" + p + " or " + p + "->field. To check for the end of a list, compare with NULL.");
        bad("Cannot compare " + typeStr(lt) + " with " + typeStr(rt) + ".");
      }
      if (isStrLike(lt) && isStrLike(rt)) {
        if (lt.k === "lit" && rt.k === "lit") bad("Comparing two pieces of quoted text compares addresses, not text.");
        return TY.bool;
      }
      if ((isStrLike(lt) && rt.k === "char") || (lt.k === "char" && isStrLike(rt))) {
        var chSide = lt.k === "char" ? L : R;
        bad(chSide + " is a single char, but it is being compared with text in double quotes.", "Use single quotes for a char, like 'a'.");
      }
      if ((lt.k === "string" && isNum(rt)) || (isNum(lt) && rt.k === "string")) bad("Cannot compare a string with a number.", "Compare with text in double quotes, or convert with stoi.");
      if (lt.k === "struct" || rt.k === "struct") bad("Whole structs cannot be compared with " + op + ".", "Compare their fields, for example  a.id == b.id.");
      bad();
    }
    if (op === "&" || op === "|" || op === "^") {
      if (!isInt(lt) || !isInt(rt)) bad("The " + op + " operator works on the bits of whole numbers.", op === "&" ? "For 'and' in a condition, use &&." : op === "|" ? "For 'or' in a condition, use ||." : "For powers, use pow(x, y) from <cmath>.");
      if (op === "^") this.warn("^ is bitwise exclusive-or, not 'to the power of'. Use pow(x, y) for powers.", e);
      return lt.k === "bool" && rt.k === "bool" ? TY.bool : arith(lt, rt);
    }
    bad();
  };

  C.exMember = function (e) {
    var ot = this.ex(e.e);
    var name = e.name, L = this.text(e.e);
    if (isErr(ot)) return TY.err;
    var st = null;
    if (e.arrow) {
      if (ot.k === "ptr" && ot.to.k === "struct") st = ot.to;
      else if (ot.k === "struct") this.fail(L + " is a struct, not a pointer, so use a dot:  " + L + "." + name, e.opTok || e, "Use -> only with pointers (variables declared with *).");
      else if (ot.k === "ptr" && ot.to.k === "ptr") this.fail(L + " is a pointer to a pointer, so -> cannot be used on it directly.", e, "Follow it once first:  (*" + L + ")->" + name);
      else if (ot.k === "arr" && ot.of.k === "struct") this.fail(L + " is an array. Pick one element first:  " + L + "[i]." + name, e);
      else this.fail(L + " is a " + typeStr(ot) + ", which has no fields.", e);
    } else {
      if (ot.k === "struct") st = ot;
      else if (ot.k === "ptr" && ot.to.k === "struct") this.fail(L + " is a pointer, so use ->  (" + L + "->" + name + ")  instead of a dot.", e.opTok || e, "A dot is for a struct itself. An arrow is for a pointer to a struct:  p->" + name + "  means  (*p)." + name + ".");
      else if (ot.k === "string" || ot.k === "stream") this.fail(name + " is not a field. If it is a function, call it with brackets: " + L + "." + name + "()", e);
      else if (ot.k === "arr" && ot.of.k === "struct") this.fail(L + " is an array. Pick one element first:  " + L + "[i]." + name, e);
      else this.fail(L + " is a " + typeStr(ot) + ", which has no fields.", e);
    }
    if (!st.complete) this.fail("struct " + st.name + " is not defined yet.", e);
    var f = st.fmap.get(name);
    if (!f) {
      var names = st.fields.map(function (x) { return x.name; });
      var sug = this.suggest(name, names);
      this.fail(st.name + " has no field called " + name + ".", e.nameTok || e, (sug ? "Did you mean " + sug + "? " : "") + "The fields of " + st.name + " are: " + names.join(", ") + ".");
    }
    e.field = f;
    e.lv = e.arrow ? true : !!e.e.lv;
    if (!e.arrow && !e.e.lv) e.lv = true;
    return f.ty;
  };

  C.exNew = function (e) {
    var self = this;
    var ty = e.ty0 || e.ty;
    e.ty0 = ty;
    delete e.ty;
    this.resolveType(ty, e, {});
    if (ty.k === "void") this.fail("Cannot use new with void.", e);
    if (ty.k === "struct" && !ty.complete) this.fail("struct " + ty.name + " is not defined yet.", e);
    if (e.n) {
      var nt = this.ex(e.n);
      if (!isInt(nt)) this.fail("The size in new [] must be a whole number.", e.n);
    }
    if (e.init && e.init.length) {
      if (e.arr) {
        e.init.forEach(function (x) { self.convCheck(self.ex(x), ty, x, "array value"); });
      } else if (ty.k === "struct") {
        this.fail("struct " + ty.name + " has no constructor, so values cannot be passed in ( ).", e, "Write  p = new " + ty.name + ";  and then set each field, like the createNode function does.");
      } else {
        if (e.init.length > 1) this.fail("Only one starting value can go in the ( ).", e);
        this.convCheck(this.ex(e.init[0]), ty, e.init[0], "initialisation");
      }
    }
    e.lv = false;
    return ptrTo(ty);
  };

  C.exCall = function (e) {
    var self = this, name = e.name;
    var argTys = e.args.map(function (a) { return self.ex(a); });
    e.lv = false;
    var local = e.qual ? null : this.lookup(name);
    if (local && local.kind !== "enumc") this.fail(name + " is a variable, not a function, so it cannot be called with ( ).", e, local.ty.k === "struct" ? "" : "");
    var list = e.qual ? null : this.funcs.get(name);
    if (list) {
      var fn = this.pickOverload(e, list, argTys);
      e.fn = fn;
      this.calledFns.push({ fn: fn, node: e });
      fn.params.forEach(function (p, i) {
        if (i >= e.args.length) return;
        var a = e.args[i];
        if (p.ty.k === "ref") {
          if (p.isConst && !a.lv) { self.convCheck(argTys[i], p.ty.to, a, "argument"); return; }
          self.refBind(a, argTys[i], p.ty.to, "argument");
        } else {
          self.argConv(argTys[i], p, a, fn);
        }
      });
      var rt = fn.ret;
      if (rt.k === "ref") { e.lv = true; return rt.to; }
      return rt;
    }
    if (BUILTIN_FUNCS.has(name)) return this.builtinCall(e, argTys);
    if (this.prog.structs.has(name)) this.fail(name + " is a struct type, so it cannot be called like a function.", e, "Use  new " + name + "  to make one on the heap, or declare a variable:  " + name + " n;");
    if (this.allFuncNames.has(name)) this.undeclared(e, name);
    var sug = this.suggest(name, Array.from(this.funcs.keys()).concat(Array.from(BUILTIN_FUNCS)).filter(function (n) { return n[0] !== "_"; }));
    var LIB = { sort: "algorithm", reverse: "algorithm", fill: "algorithm", copy: "algorithm", count: "algorithm", unique: "algorithm", binary_search: "algorithm", lower_bound: "algorithm", upper_bound: "algorithm", min_element: "algorithm", max_element: "algorithm", next_permutation: "algorithm", accumulate: "numeric", iota: "numeric", memset: "cstring", memcpy: "cstring", qsort: "cstdlib", malloc: "cstdlib", calloc: "cstdlib", realloc: "cstdlib", free: "cstdlib", printf: "cstdio", scanf: "cstdio", puts: "cstdio", getchar: "cstdio", putchar: "cstdio", sprintf: "cstdio", fopen: "cstdio" };
    if (LIB[name] && !this.allFuncNames.has(name)) this.fail(name + " (from <" + LIB[name] + ">) is not supported by this runner.", e, /alloc|free/.test(name) ? "Use new and delete, as the course does." : /printf|scanf|puts|get|putchar|fopen/.test(name) ? "Use cin and cout (and ifstream or ofstream for files)." : "Write the loop yourself. In COMP 2611 that is usually the point of the exercise.");
    this.fail("There is no function called " + name + ".", e, sug ? "Did you mean " + sug + "?" : "Functions must be written (or have a prototype) above the place where they are called.");
  };
  C.argConv = function (at, p, a, fn) {
    var pt = p.ty;
    if (pt.k === "ptr" && at.k === "arr" && pt.to.k === "arr" && at.of.k === "arr" && at.of.n !== pt.to.n) {
      this.fail("The array's second size (" + at.of.n + ") does not match the parameter's (" + pt.to.n + ").", a);
    }
    if (pt.k === "stream") this.fail("Streams must be passed by reference.", a);
    if (pt.k === "ptr" && at.k === "struct" && sameType(at, pt.to)) {
      this.fail(fn.name + " expects a pointer (" + typeStr(pt) + "), but " + this.text(a) + " is a " + typeStr(at) + " struct.", a, "Pass its address with &" + this.text(a) + ", or pass the pointer variable instead.");
    }
    this.convCheck(at, pt, a, "argument");
  };
  C.pickOverload = function (e, list, argTys) {
    var n = e.args.length, self = this;
    var fits = list.filter(function (f) {
      var min = f.params.filter(function (p) { return !p.def; }).length;
      return n >= min && n <= f.params.length;
    });
    if (!fits.length) {
      var f0 = list[0];
      var min0 = f0.params.filter(function (p) { return !p.def; }).length;
      var want = min0 === f0.params.length ? String(min0) : min0 + " to " + f0.params.length;
      this.fail(e.name + " needs " + want + " argument" + (want === "1" ? "" : "s") + ", but this call gives " + n + ".", e,
        "Its parameters are: " + (f0.params.length ? f0.params.map(function (p) { return typeStr(p.shown || p.ty) + " " + (p.name || ""); }).join(", ") : "(none)") + ".");
    }
    if (fits.length === 1) return fits[0];
    var best = null, bestScore = -1;
    fits.forEach(function (f) {
      var score = 0;
      f.params.forEach(function (p, i) {
        if (i >= n) return;
        var pt = p.ty.k === "ref" ? p.ty.to : p.ty, at = argTys[i];
        if (sameType(pt, at)) score += 3;
        else if (sameType(pt, decay(at))) score += 2;
        else if (isNum(pt) && isNum(at)) score += 1;
        else if (pt.k === "string" && at.k === "lit") score += 2;
      });
      if (score > bestScore) { bestScore = score; best = f; }
    });
    return best;
  };

  C.builtinCall = function (e, at) {
    var self = this, name = e.name, n = at.length, A = e.args;
    function need(k, msg) {
      if (typeof k === "number" ? n !== k : (n < k[0] || n > k[1])) {
        var want = typeof k === "number" ? k : k[0] + " to " + k[1];
        self.fail(name + " needs " + want + " argument" + (want === 1 ? "" : "s") + ", but " + n + " " + (n === 1 ? "was" : "were") + " given.", e, msg || "");
      }
    }
    function num(i) { if (!isNum(at[i]) && !isErr(at[i])) self.fail("Argument " + (i + 1) + " of " + name + " must be a number, not " + typeStr(at[i]) + ".", A[i]); }
    function str(i) { if (!isStrLike(at[i]) && !isCharPtr(at[i]) && !isErr(at[i])) self.fail("Argument " + (i + 1) + " of " + name + " must be text.", A[i]); }
    function cstr(i) { if (!isCharPtr(at[i]) && at[i].k !== "lit" && !isErr(at[i])) self.fail("Argument " + (i + 1) + " of " + name + " must be a char array.", A[i], at[i].k === "string" ? "For string variables use =, +, == and .length() instead." : ""); }
    if (STD_FUNCS.has(name)) this.checkStdName(name, e, e.qual, { std: true, header: name === "setw" || name === "setprecision" || name === "setfill" ? ["iomanip"] : null });
    e.builtin = name;
    if (MATH1.indexOf(name) >= 0) { need(1); num(0); return name === "abs" ? promote(at[0]) : TY.double; }
    switch (name) {
      case "pow": case "atan2": case "fmod": case "hypot": need(2); num(0); num(1); return TY.double;
      case "abs": need(1); num(0); return at[0].k === "double" || at[0].k === "float" ? TY.double : promote(at[0]);
      case "min": case "max":
        need(2); num(0); num(1);
        if (!sameType(at[0], at[1])) {
          this.fail(name + " needs both values to have the same type, but here they are " + typeStr(at[0]) + " and " + typeStr(at[1]) + ".", e, "Convert one of them, for example  " + name + "((double) a, b).");
        }
        return at[0];
      case "swap":
        need(2);
        if (!A[0].lv || !A[1].lv) this.fail("swap needs two variables.", e);
        if (!sameType(at[0], at[1])) this.fail("swap needs two variables of the same type, but here they are " + typeStr(at[0]) + " and " + typeStr(at[1]) + ".", e);
        return TY.void;
      case "rand": need(0); return TY.int;
      case "srand": need(1); num(0); return TY.void;
      case "time": need(1); return TY.long;
      case "exit": need(1); num(0); return TY.void;
      case "abort": need(0); return TY.void;
      case "system": need(1); return TY.int;
      case "toupper": case "tolower": need(1); num(0); return TY.int;
      case "isdigit": case "isalpha": case "isspace": case "isupper": case "islower": case "isalnum": case "ispunct": case "isxdigit": need(1); num(0); return TY.int;
      case "to_string": need(1); num(0); this.checkStdName(name, e, e.qual, { std: true }); return TY.string;
      case "stoi": case "stol": case "stod": case "stof":
        need(1); if (at[0].k !== "string" && at[0].k !== "lit") this.fail(name + " needs a string.", A[0]);
        return name === "stoi" ? TY.int : name === "stol" ? TY.long : TY.double;
      case "atoi": case "atof": need(1); cstr(0); return name === "atoi" ? TY.int : TY.double;
      case "strlen": need(1); cstr(0); return TY.ulong;
      case "strcpy": case "strcat": need(2); cstr(0); cstr(1); if (!isCharPtr(at[0])) this.fail("The first argument of " + name + " must be a char array that can be changed.", A[0]); return decay(at[0]);
      case "strncpy": need(3); cstr(0); cstr(1); num(2); return decay(at[0]);
      case "strcmp": need(2); cstr(0); cstr(1); return TY.int;
      case "strncmp": need(3); cstr(0); cstr(1); num(2); return TY.int;
      case "getline":
        need([2, 3]);
        if (at[0].k !== "stream" || !at[0].input) this.fail("The first argument of getline must be an input stream, like cin or an ifstream.", A[0]);
        if (at[1].k !== "string" || !A[1].lv) this.fail("The second argument of getline must be a string variable.", A[1], at[1].k === "arr" ? "For char arrays use  cin.getline(arr, size)." : "");
        if (n === 3 && at[2].k !== "char") this.fail("The third argument of getline must be a char, like ','.", A[2]);
        e.lv = true;
        return at[0];
      case "setw": case "setprecision": need(1); num(0); return TY.manip;
      case "setfill": need(1); if (at[0].k !== "char") this.fail("setfill needs a char, like setfill('0').", A[0]); return TY.manip;
      case "__liveNodes": need(0); return TY.int;
    }
    this.fail("Unknown function " + name + ".", e);
  };

  C.exMethod = function (e) {
    var self = this;
    var ot = this.ex(e.obj);
    var at = e.args.map(function (a) { return self.ex(a); });
    var n = at.length, name = e.name, L = this.text(e.obj);
    e.lv = false;
    if (isErr(ot)) return TY.err;
    if (e.arrow) {
      if (ot.k !== "ptr") this.fail(L + " is not a pointer, so use a dot:  " + L + "." + name + "()", e);
      ot = ot.to;
    } else if (ot.k === "ptr" && (ot.to.k === "string" || ot.to.k === "stream")) {
      this.fail(L + " is a pointer, so use  " + L + "->" + name + "()", e);
    }
    function need(a, b) {
      if (n < a || n > (b === undefined ? a : b)) self.fail(name + "() needs " + (b === undefined || b === a ? a : a + " to " + b) + " argument" + ((b === undefined ? a : b) === 1 ? "" : "s") + " here, but " + n + " " + (n === 1 ? "was" : "were") + " given.", e);
    }
    function int(i) { if (!isInt(at[i])) self.fail("Argument " + (i + 1) + " of " + name + "() must be a whole number.", e.args[i]); }
    if (ot.k === "string") {
      e.recv = "string";
      switch (name) {
        case "length": case "size": need(0); return TY.ulong;
        case "empty": need(0); return TY.bool;
        case "substr": need(1, 2); int(0); if (n > 1) int(1); return TY.string;
        case "find": case "rfind": need(1, 2); if (!isStrLike(at[0]) && at[0].k !== "char") this.fail(name + "() looks for text or a char.", e.args[0]); if (n > 1) int(1); return TY.ulong;
        case "at": need(1); int(0); e.lv = !!e.obj.lv; return TY.char;
        case "c_str": need(0); return TY.lit;
        case "append": need(1); if (!isStrLike(at[0])) this.fail("append() needs text.", e.args[0]); return TY.string;
        case "push_back": need(1); if (at[0].k !== "char") this.fail("push_back() needs a char.", e.args[0]); return TY.void;
        case "pop_back": case "clear": need(0); return TY.void;
        case "insert": need(2); int(0); if (!isStrLike(at[1])) this.fail("insert() needs a position and text.", e.args[1]); return TY.string;
        case "erase": need(0, 2); if (n > 0) int(0); if (n > 1) int(1); return TY.string;
        case "front": case "back": need(0); e.lv = !!e.obj.lv; return TY.char;
        case "replace": need(3); int(0); int(1); if (!isStrLike(at[2])) this.fail("replace() needs text as its third argument.", e.args[2]); return TY.string;
        case "compare": need(1); if (!isStrLike(at[0])) this.fail("compare() needs text.", e.args[0]); return TY.int;
      }
      var sug = this.suggest(name, CPP.STRING_METHODS);
      this.fail("A string has no function called " + name + "().", e, sug ? "Did you mean " + sug + "()?" : "Common ones are length(), substr(), find() and empty().");
    }
    if (ot.k === "stream") {
      e.recv = "stream";
      switch (name) {
        case "open":
          if (!ot.file) this.fail(typeStr(ot) + " cannot open files. Use an ifstream or ofstream.", e);
          need(1, 2); if (!isStrLike(at[0]) && !isCharPtr(at[0])) this.fail("open() needs the file name.", e.args[0]);
          return TY.void;
        case "close": need(0); return TY.void;
        case "is_open": need(0); if (!ot.file) this.fail("is_open() is only for file streams.", e); return TY.bool;
        case "eof": case "fail": case "good": case "bad": need(0); return TY.bool;
        case "clear": need(0); return TY.void;
        case "ignore": need(0, 2); return ot;
        case "get":
          if (!ot.input) this.fail("get() is for input streams.", e);
          need(0, 1);
          if (n === 1) { if (at[0].k !== "char" || !e.args[0].lv) this.fail("get() needs a char variable.", e.args[0]); e.lv = true; return ot; }
          return TY.int;
        case "peek": need(0); return TY.int;
        case "precision": need(0, 1); if (n) int(0); return TY.long;
        case "unget": need(0); return ot;
        case "str":
          if (!ot.ss) this.fail("str() is only for string streams.", e);
          need(0, 1); return n ? TY.void : TY.string;
        case "getline":
          need(2, 3);
          if (!isCharPtr(at[0])) this.fail("This getline() needs a char array. For a string variable use  getline(" + L + ", s).", e.args[0]);
          int(1);
          return ot;
      }
      var sug2 = this.suggest(name, CPP.STREAM_METHODS);
      this.fail("A " + typeStr(ot) + " has no function called " + name + "().", e, sug2 ? "Did you mean " + sug2 + "()?" : "");
    }
    if (ot.k === "struct") this.fail("struct " + ot.name + " has no functions inside it.", e, "Call a normal function and pass the struct, for example  " + name + "(" + L + ").");
    if (ot.k === "ptr" && ot.to.k === "struct") this.fail(L + " is a pointer to a " + ot.to.name + ", which has no functions inside it.", e, "Call a normal function and pass the pointer, for example  " + name + "(" + L + ").");
    this.fail(L + " is a " + typeStr(ot) + ", which has no functions.", e);
  };

  CPP.check = function (prog) {
    var c = new Checker(prog);
    var r = c.checkProgram();
    prog.fns = r.funcs;
    prog.main = r.main;
    prog.globalDecls = r.globals;
    prog.warnings = r.warnings;
    return r.warnings;
  };
  CPP.Checker = Checker;
})(CPP);
