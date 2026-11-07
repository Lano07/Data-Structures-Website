/* COMP 2611 Code Lab — C++ subset, part 2: types and parser (tokens -> syntax tree). */
(function (CPP) {
  "use strict";
  var cerr = CPP.cerr;

  var TY = {
    void: { k: "void" }, bool: { k: "bool" }, char: { k: "char" }, uchar: { k: "uchar" }, short: { k: "short" },
    int: { k: "int" }, uint: { k: "uint" }, long: { k: "long" }, ulong: { k: "ulong" }, llong: { k: "llong" },
    float: { k: "float" }, double: { k: "double" }, string: { k: "string" },
    null: { k: "null" }, nullptr: { k: "nullptr" }, lit: { k: "lit" }, manip: { k: "manip" }, err: { k: "err" }, iosflag: { k: "iosflag" }
  };
  function ptrTo(t) { return { k: "ptr", to: t }; }
  function arrOf(t, n, nExpr) { return { k: "arr", of: t, n: n === undefined ? null : n, nExpr: nExpr || null }; }
  function refTo(t) { return { k: "ref", to: t }; }
  var STREAM_TYPES = {
    istream: { input: true }, ostream: { output: true }, ifstream: { input: true, file: true }, ofstream: { output: true, file: true },
    fstream: { input: true, output: true, file: true }, stringstream: { input: true, output: true, ss: true },
    istringstream: { input: true, ss: true }, ostringstream: { output: true, ss: true }
  };
  var STREAM_TY = {};
  Object.keys(STREAM_TYPES).forEach(function (n) {
    STREAM_TY[n] = Object.assign({ k: "stream", name: n }, STREAM_TYPES[n]);
  });
  var UNSUPPORTED_TEMPLATES = new Set(["vector", "map", "list", "stack", "queue", "set", "pair", "deque", "unordered_map", "unordered_set", "priority_queue", "array", "multimap", "multiset", "tuple", "unique_ptr", "shared_ptr"]);
  var TYPE_KWS = new Set(["const", "constexpr", "static", "unsigned", "signed", "long", "short", "int", "char", "bool", "float", "double", "void", "struct", "class", "enum", "union", "auto", "volatile", "register", "extern", "inline"]);
  var INT_KINDS = new Set(["bool", "char", "uchar", "short", "int", "uint", "long", "ulong", "llong", "enum", "null"]);
  var NUM_KINDS = new Set(["bool", "char", "uchar", "short", "int", "uint", "long", "ulong", "llong", "float", "double", "enum", "null"]);

  function typeStr(t) {
    if (!t) return "?";
    switch (t.k) {
      case "uint": return "unsigned int";
      case "ulong": return "unsigned long";
      case "llong": return "long long";
      case "uchar": return "unsigned char";
      case "ptr":
        if (t.to.k === "arr") return typeStr(t.to.of) + " (*)[" + (t.to.n === null ? "" : t.to.n) + "]";
        return typeStr(t.to) + "*";
      case "arr": {
        var dims = "", b = t;
        while (b.k === "arr") { dims += "[" + (b.n === null ? "" : b.n) + "]"; b = b.of; }
        return typeStr(b) + dims;
      }
      case "ref": return typeStr(t.to) + "&";
      case "struct": case "enum": return t.name;
      case "stream": return t.name;
      case "lit": return "string literal";
      case "null": return "NULL";
      case "nullptr": return "nullptr";
      case "manip": return "stream manipulator";
      case "iosflag": return "ios flag";
      case "err": return "?";
      default: return t.k;
    }
  }
  function sameType(a, b) {
    if (a === b) return true;
    if (!a || !b || a.k !== b.k) return false;
    if (a.k === "ptr") return sameType(a.to, b.to);
    if (a.k === "arr") return (a.n === b.n || a.n === null || b.n === null) && sameType(a.of, b.of);
    if (a.k === "ref") return sameType(a.to, b.to);
    if (a.k === "struct" || a.k === "enum") return a.name === b.name;
    if (a.k === "stream") return a.name === b.name;
    return true;
  }
  CPP.TY = TY; CPP.ptrTo = ptrTo; CPP.arrOf = arrOf; CPP.refTo = refTo; CPP.typeStr = typeStr; CPP.sameType = sameType;
  CPP.STREAM_TY = STREAM_TY; CPP.UNSUPPORTED_TEMPLATES = UNSUPPORTED_TEMPLATES; CPP.TYPE_KWS = TYPE_KWS;
  CPP.INT_KINDS = INT_KINDS; CPP.NUM_KINDS = NUM_KINDS;

  var BIN_PREC = { "||": 1, "&&": 2, "|": 3, "^": 4, "&": 5, "==": 6, "!=": 6, "<": 7, ">": 7, "<=": 7, ">=": 7, "<<": 8, ">>": 8, "+": 9, "-": 9, "*": 10, "/": 10, "%": 10 };
  var ASSIGN_OPS = new Set(["=", "+=", "-=", "*=", "/=", "%=", "<<=", ">>=", "&=", "|=", "^="]);

  function Parser(lx) {
    this.toks = lx.toks;
    this.i = 0;
    this.structs = new Map();
    this.typedefs = new Map();
    this.enums = new Map();
    this.enumConsts = new Map();
    this.items = [];
    this.usingStd = 0;
    this.usingNames = new Set();
    this.stdUses = [];
    this.warnings = [];
  }
  var P = Parser.prototype;

  P.peek = function (o) { var j = this.i + (o || 0); return this.toks[j < this.toks.length ? j : this.toks.length - 1]; };
  P.next = function () { var t = this.toks[this.i]; if (this.i < this.toks.length - 1) this.i++; return t; };
  P.prev = function () { return this.toks[Math.max(0, this.i - 1)]; };
  P.is = function (v, o) { var t = this.peek(o); return (t.k === "op" || t.k === "kw") && t.v === v; };
  P.accept = function (v) { return this.is(v) ? this.next() : null; };
  P.fail = function (msg, tok, hint) { throw cerr(msg, tok || this.peek(), hint); };
  P.desc = function (t) {
    if (t.k === "eof") return "the end of the file";
    if (t.k === "str") return "a string";
    if (t.k === "num") return "the number " + t.text;
    return "'" + t.v + "'";
  };
  P.expect = function (v, where) {
    if (this.is(v)) return this.next();
    var t = this.peek();
    var msg = "Expected '" + v + "'" + (where ? " " + where : "") + " but found " + this.desc(t) + ".";
    var hint = "";
    if (v === ")") hint = "Check that every ( has a matching ).";
    if (v === "]") hint = "Check that every [ has a matching ].";
    if (v === "(" && where && /after (if|while|for|switch)/.test(where)) hint = "The condition must be in brackets, like  if (x > 0)";
    if (t.k === "eof") return this.fail(msg, t, "The file ended too early. Is a } or ) missing?");
    return this.fail(msg, t, hint);
  };
  P.expectSemi = function (what) {
    if (this.accept(";")) return;
    var p = this.prev(), t = this.peek();
    var msg = "Missing ; at the end of " + (what || "this statement") + ".";
    var hint = "Every statement in C++ ends with a semicolon.";
    if (t.k === "id" || t.k === "kw" || t.k === "num" || t.k === "str") {
      if (p.line === t.line && p.k !== "op") {
        msg = "Expected ; or an operator before " + this.desc(t) + ".";
        hint = "Two values are next to each other with nothing between them. Is an operator (like << or +) or a ; missing?";
        throw cerr(msg, t, hint);
      }
    }
    if (t.k === "op" && t.v === "}") hint = "Add a ; before the }.";
    throw cerr(msg, { line: p.line, col: p.col + (p.e - p.s), s: p.e, e: p.e }, hint);
  };

  P.namedType = function (tok, o) {
    var name = tok.v;
    if (UNSUPPORTED_TEMPLATES.has(name) && this.is("<", o + 1)) {
      this.fail("This code uses " + name + "<...>, which this runner does not support.", tok,
        "COMP 2611 builds its own structures (linked lists, trees, heaps, arrays), so write it with structs, pointers and arrays.");
    }
    if (this.structs.has(name)) return this.structs.get(name);
    if (this.typedefs.has(name)) return this.typedefs.get(name);
    if (this.enums.has(name)) return this.enums.get(name);
    if (name === "string") return TY.string;
    if (STREAM_TY[name]) return STREAM_TY[name];
    if (name === "size_t") return TY.ulong;
    return null;
  };
  P.isTypeStart = function (o) {
    o = o || 0;
    var t = this.peek(o);
    if (t.k === "kw") return TYPE_KWS.has(t.v);
    if (t.k !== "id") return false;
    if (t.v === "std" && this.is("::", o + 1)) {
      var t2 = this.peek(o + 2);
      return t2.k === "id" && (this.isTypeName(t2.v) || (UNSUPPORTED_TEMPLATES.has(t2.v) && this.is("<", o + 3)));
    }
    if (UNSUPPORTED_TEMPLATES.has(t.v) && this.is("<", o + 1)) return true;
    return this.isTypeName(t.v);
  };
  P.isTypeName = function (n) {
    return this.structs.has(n) || this.typedefs.has(n) || this.enums.has(n) || n === "string" || !!STREAM_TY[n] || n === "size_t";
  };

  // Parses declaration specifiers. Returns null if no type is here.
  P.parseTypeSpec = function () {
    var start = this.peek();
    var isConst = false, isStatic = false, sign = null, longs = 0, short = false, sawInt = false, base = null, any = false;
    for (;;) {
      var t = this.peek();
      if (t.k === "kw") {
        var v = t.v;
        if (v === "const" || v === "constexpr") { isConst = true; this.next(); any = true; continue; }
        if (v === "static") { isStatic = true; this.next(); any = true; continue; }
        if (v === "inline" || v === "extern" || v === "register" || v === "volatile") { this.next(); continue; }
        if (v === "unsigned" || v === "signed") { if (sign) this.fail("Two signed/unsigned words in one type.", t); sign = v; this.next(); any = true; continue; }
        if (v === "long") { longs++; this.next(); any = true; continue; }
        if (v === "short") { short = true; this.next(); any = true; continue; }
        if (v === "int") { if (sawInt || (base && base !== TY.int)) this.fail("This declaration has two types.", t); sawInt = true; this.next(); any = true; continue; }
        if (v === "char" || v === "bool" || v === "float" || v === "double" || v === "void") {
          if (base || sawInt) this.fail("This declaration has two types (" + typeStr(base || TY.int) + " and " + v + ").", t);
          base = TY[v]; this.next(); any = true; continue;
        }
        if (v === "struct" || v === "class" || v === "enum" || v === "union") {
          if (base) this.fail("This declaration has two types.", t);
          this.next();
          var nt = this.peek();
          if (nt.k !== "id") this.fail("Expected a name after " + v + ".", nt);
          this.next();
          if (v === "enum") {
            base = this.enums.get(nt.v);
            if (!base) this.fail("There is no enum called " + nt.v + ".", nt);
          } else if (v === "union") {
            this.fail("unions are not supported here.", t);
          } else {
            base = this.structs.get(nt.v);
            if (!base) { base = { k: "struct", name: nt.v, fields: [], fmap: new Map(), complete: false, line: nt.line }; this.structs.set(nt.v, base); }
          }
          any = true;
          continue;
        }
        if (v === "auto") this.fail("auto is not supported here.", t, "Write the actual type, for example int, double or Node *.");
        break;
      }
      if (t.k === "id" && !base && !sawInt && !sign && !longs && !short) {
        var o = 0, nameTok = t, qual = false;
        if (t.v === "std" && this.is("::", 1)) { nameTok = this.peek(2); o = 2; qual = true; }
        if (nameTok.k === "id") {
          var nty = this.namedType(nameTok, o);
          if (nty) {
            if (nty === TY.string || nty.k === "stream") this.stdUses.push({ name: nameTok.v, tok: nameTok, qual: qual });
            this.i += o + 1;
            base = nty;
            any = true;
            continue;
          }
        }
      }
      break;
    }
    if (!any) return null;
    var ty = base;
    if (!base || base === TY.int) {
      if (!sawInt && !sign && !longs && !short && !base) {
        this.fail("Expected a type after " + (isConst ? "const" : "static") + ".", this.peek(), "For example: const int SIZE = 10;");
      }
      if (short) ty = TY.short;
      else if (longs >= 2) ty = sign === "unsigned" ? TY.ulong : TY.llong;
      else if (longs === 1) ty = sign === "unsigned" ? TY.ulong : TY.long;
      else ty = sign === "unsigned" ? TY.uint : TY.int;
    } else if (base === TY.char) {
      if (longs || short) this.fail("char cannot be long or short.", start);
      ty = sign === "unsigned" ? TY.uchar : TY.char;
    } else if (base === TY.double) {
      if (sign || short || longs > 1) this.fail("This combination of type words is not valid.", start);
      ty = TY.double;
    } else if (sign || longs || short) {
      this.fail("unsigned, long and short only go with whole-number types.", start);
    }
    return { ty: ty, isConst: isConst, isStatic: isStatic, tok: start };
  };

  // declarator: stars, optional &, name, array dimensions
  P.parseDeclarator = function (base, opts) {
    opts = opts || {};
    var ty = base, startTok = this.peek();
    while (this.is("*")) { this.next(); ty = ptrTo(ty); while (this.accept("const")) { /* const pointer */ } }
    var isRef = false;
    if (this.is("&")) { this.next(); isRef = true; }
    else if (this.is("&&")) this.fail("&& (rvalue references) are not used in this course.", this.peek());
    if (isRef && this.is("*")) this.fail("Write the * before the &, like  Node * & top.", this.peek());
    var nameTok = null;
    var t = this.peek();
    if (t.k === "id") {
      if (this.is("::", 1)) this.fail("Member functions like " + t.v + "::" + this.peek(2).v + " are not supported here.", t, "Write normal functions that take a struct or pointer as a parameter.");
      nameTok = this.next();
    } else if (!opts.abstract) {
      if (t.k === "kw" && t.v === "operator") this.fail("Operator overloading (operator +, operator << and so on) is not supported here.", t, "Write a normal function instead, such as add (a, b).");
      if (t.k === "kw") this.fail("'" + t.v + "' is a C++ keyword, so it cannot be used as a name.", t, "Choose a different name.");
      if (t.k === "op" && t.v === "(") this.fail("Function pointers and declarations like (*name) are not supported here.", t);
      this.fail("Expected a name in this declaration but found " + this.desc(t) + ".", t);
    }
    var dims = [];
    while (this.is("[")) {
      var lb = this.next();
      if (this.is("]")) { this.next(); dims.push(null); continue; }
      var e = this.parseExpr();
      this.expect("]");
      dims.push(e);
      if (!lb) break;
    }
    for (var k = dims.length - 1; k >= 0; k--) {
      var d = dims[k];
      if (d === null) ty = arrOf(ty, null, null);
      else if (d.k === "num" && !d.isFloat) ty = arrOf(ty, d.v, null);
      else ty = arrOf(ty, null, d);
    }
    if (isRef) ty = refTo(ty);
    return { ty: ty, name: nameTok ? nameTok.v : null, nameTok: nameTok, tok: startTok };
  };

  function mk(k, tok, props) {
    var n = props || {};
    n.k = k;
    n.line = tok.line; n.col = tok.col; n.s = tok.s; n.z = tok.e;
    return n;
  }
  P.fin = function (n) { var p = this.prev(); if (p && p.e > n.z) n.z = p.e; return n; };

  // ------------------------------------------------------------ top level
  P.parseProgram = function () {
    while (this.peek().k !== "eof") {
      if (this.accept(";")) continue;
      var it = this.parseTopLevel();
      if (it) this.items.push(it);
    }
    return this.items;
  };

  P.parseUsing = function () {
    var u = this.next();
    if (this.accept("namespace")) {
      var ns = this.next();
      if (ns.v !== "std") this.fail("Only  using namespace std;  is supported.", ns);
      this.expectSemi("using namespace std");
      if (!this.usingStd) this.usingStd = u.line;
      return null;
    }
    var t = this.next();
    if (t.v === "std" && this.accept("::")) {
      var nm = this.next();
      this.usingNames.add(nm.v);
      this.expectSemi();
      return null;
    }
    this.fail("Only  using namespace std;  is supported.", u);
  };

  P.parseTopLevel = function () {
    var t = this.peek();
    if (this.is("using")) return this.parseUsing();
    if ((this.is("struct") || this.is("class")) && this.peek(1).k === "id" && (this.is("{", 2) || this.is(";", 2) || this.is(":", 2))) return this.parseStructDef(false);
    if (this.is("enum") && ((this.peek(1).k === "id" && this.is("{", 2)) || this.is("{", 1) || this.is("class", 1))) return this.parseEnumDef();
    if (this.is("typedef")) return this.parseTypedef();
    if (this.is("template")) this.fail("Templates are not supported here.", t);
    if (this.is("namespace")) this.fail("Declaring namespaces is not supported here.", t);
    if (this.isTypeStart()) {
      var spec = this.parseTypeSpec();
      if (this.is(";")) { this.next(); return null; }
      var d = this.parseDeclarator(spec.ty, {});
      if (this.is("(")) return this.parseFunctionRest(spec, d);
      var decl = this.parseDeclRest(spec, d, true);
      this.expectSemi("this declaration");
      return decl;
    }
    if (t.k === "id" && this.is("(", 1)) {
      this.fail("The function " + t.v + " needs a return type.", t, "Write the type before the name, for example  void " + t.v + " (...)  or  int " + t.v + " (...).");
    }
    if (t.k === "id" && (this.peek(1).k === "id" || this.is("*", 1))) {
      this.fail("Unknown type '" + t.v + "'.", t, "Types must be declared before they are used. Check the spelling (C++ is case-sensitive) and that the struct is defined above this line.");
    }
    if (t.k === "op" && t.v === "}") this.fail("This } does not match any {.", t, "There may be one } too many above this line.");
    this.fail("Expected a function or a declaration here but found " + this.desc(t) + ".", t, "Statements must go inside a function such as main.");
  };

  P.parseFunctionRest = function (spec, d) {
    if (d.ty.k === "arr") this.fail("A function cannot return an array.", d.nameTok);
    var params = this.parseParams();
    var fn = mk("func", d.nameTok || d.tok, { name: d.name, ret: d.ty, params: params, body: null, isStatic: spec.isStatic, typeTok: spec.tok });
    if (this.is("const")) this.fail("const after the parameter list is only for member functions.", this.peek());
    if (this.is("{")) {
      fn.body = this.parseBlock();
      fn.endLine = this.prev().line;
    } else {
      this.expectSemi("the function prototype");
      fn.k = "proto";
    }
    return fn;
  };

  P.parseParams = function () {
    this.expect("(");
    var ps = [];
    if (this.accept(")")) return ps;
    if (this.is("void") && this.is(")", 1)) { this.next(); this.next(); return ps; }
    for (;;) {
      var t = this.peek();
      if (this.is("...")) this.fail("Variable numbers of arguments (...) are not supported.", t);
      var spec = this.parseTypeSpec();
      if (!spec) {
        if (t.k === "id" && (this.peek(1).k === "id" || this.is("*", 1) || this.is("&", 1))) this.fail("Unknown type '" + t.v + "' in this parameter.", t, "Check the spelling (C++ is case-sensitive) and that the type is declared above.");
        this.fail("Expected a parameter (a type and a name) but found " + this.desc(t) + ".", t, "Each parameter needs a type, like  int n  or  Node * top.");
      }
      var d = this.parseDeclarator(spec.ty, { abstract: true });
      var ty = d.ty, shown = d.ty;
      if (ty.k === "arr") ty = ptrTo(ty.of);
      var def = null;
      if (this.accept("=")) def = this.parseAssign();
      ps.push({ name: d.name, ty: ty, shown: shown, tok: d.nameTok || spec.tok, isConst: spec.isConst, def: def });
      if (this.accept(",")) continue;
      this.expect(")", "after the parameters");
      return ps;
    }
  };

  P.parseStructDef = function (fromTypedef) {
    var kw = this.next();
    var nameTok = this.peek().k === "id" ? this.next() : null;
    var name = nameTok ? nameTok.v : "(unnamed struct)";
    var st = nameTok ? this.structs.get(name) : null;
    if (!st) {
      st = { k: "struct", name: name, fields: [], fmap: new Map(), complete: false, line: (nameTok || kw).line };
      if (nameTok) this.structs.set(name, st);
    }
    if (!fromTypedef && this.accept(";")) return null;
    if (this.is(":")) this.fail("Inheritance is not supported here.", this.peek());
    if (st.complete) this.fail("struct " + name + " is defined twice.", nameTok);
    var lb = this.expect("{", "to start the struct");
    while (!this.is("}")) {
      var t = this.peek();
      if (t.k === "eof") this.fail("The { of struct " + name + " (line " + lb.line + ") is never closed.", lb, "End the struct with };");
      if (this.is("public") || this.is("private") || this.is("protected")) { this.next(); this.expect(":"); continue; }
      if (t.k === "id" && t.v === name && this.is("(", 1)) this.fail("Constructors are not supported here.", t, "Use a function such as createNode that does new and fills in each field.");
      if (this.is("~")) this.fail("Destructors are not supported here.", t);
      var spec = this.parseTypeSpec();
      if (!spec) {
        if (t.k === "id") this.fail("Unknown type '" + t.v + "' in struct " + name + ".", t, "Check the spelling. If it is another struct, define that struct above this one.");
        this.fail("Expected a field (a type and a name) in struct " + name + " but found " + this.desc(t) + ".", t);
      }
      for (;;) {
        var d = this.parseDeclarator(spec.ty, {});
        if (this.is("(")) this.fail("Functions inside a struct are not supported here.", d.nameTok, "Write a normal function that takes the struct (or a pointer to it) as a parameter, like the lecture code does.");
        var init = null;
        if (this.accept("=")) init = this.is("{") ? this.parseInitList() : this.parseAssign();
        if (st.fmap.has(d.name)) this.fail("struct " + name + " already has a field called " + d.name + ".", d.nameTok);
        var f = { name: d.name, ty: d.ty, init: init, line: d.nameTok.line, tok: d.nameTok };
        st.fields.push(f);
        st.fmap.set(d.name, f);
        if (this.accept(",")) continue;
        break;
      }
      this.expectSemi("this field");
    }
    var rb = this.next();
    st.complete = true;
    var node = mk("struct", kw, { st: st });
    if (fromTypedef) return node;
    if (this.is(";")) { this.next(); return node; }
    if (this.peek().k === "id") {
      this.items.push(node);
      var spec2 = { ty: st, isConst: false, isStatic: false, tok: rb };
      var d2 = this.parseDeclarator(st, {});
      var decl = this.parseDeclRest(spec2, d2, true);
      this.expectSemi();
      return decl;
    }
    this.fail("A struct definition must end with };  (a semicolon after the closing brace).", rb, "Add a ; right after the } on line " + rb.line + ".");
  };

  P.parseEnumDef = function () {
    var kw = this.next();
    if (this.is("class")) this.fail("enum class is not supported here. Use a plain enum.", this.peek());
    var nameTok = this.peek().k === "id" ? this.next() : null;
    var en = { k: "enum", name: nameTok ? nameTok.v : "enum", consts: [] };
    if (nameTok) this.enums.set(nameTok.v, en);
    this.expect("{", "to start the enum");
    var val = 0;
    while (!this.is("}")) {
      var ct = this.next();
      if (ct.k !== "id") this.fail("Expected a name in the enum but found " + this.desc(ct) + ".", ct);
      if (this.accept("=")) {
        var e = this.parseCond();
        val = this.constValue(e);
        if (val === null) this.fail("An enum value must be a constant number.", e);
      }
      if (this.enumConsts.has(ct.v)) this.fail(ct.v + " is already used in another enum.", ct);
      en.consts.push({ name: ct.v, v: val });
      this.enumConsts.set(ct.v, { en: en, v: val, tok: ct });
      val++;
      if (!this.accept(",")) break;
    }
    this.expect("}", "to close the enum");
    var node = mk("enum", kw, { en: en });
    if (this.peek().k === "id") {
      this.items.push(node);
      var d = this.parseDeclarator(en, {});
      var decl = this.parseDeclRest({ ty: en, tok: kw }, d, true);
      this.expectSemi();
      return decl;
    }
    this.expectSemi("the enum (enums end with };)");
    return node;
  };

  P.constValue = function (e) {
    if (e.k === "num" && !e.isFloat) return e.v;
    if (e.k === "chr") return e.v;
    if (e.k === "un" && e.op === "-") { var v = this.constValue(e.e); return v === null ? null : -v; }
    if (e.k === "id" && this.enumConsts.has(e.name)) return this.enumConsts.get(e.name).v;
    if (e.k === "bin") {
      var a = this.constValue(e.a), b = this.constValue(e.b);
      if (a === null || b === null) return null;
      switch (e.op) { case "+": return a + b; case "-": return a - b; case "*": return a * b; case "/": return b ? Math.trunc(a / b) : null; case "%": return b ? a % b : null; case "<<": return a << b; }
    }
    return null;
  };

  P.parseTypedef = function () {
    var kw = this.next();
    var ty;
    if (this.is("struct") && (this.is("{", 1) || (this.peek(1).k === "id" && this.is("{", 2)))) {
      var sn = this.parseStructDef(true);
      this.items.push(sn);
      ty = sn.st;
    } else {
      var spec = this.parseTypeSpec();
      if (!spec) this.fail("Expected a type after typedef.", this.peek());
      ty = spec.ty;
    }
    var d = this.parseDeclarator(ty, {});
    this.typedefs.set(d.name, d.ty);
    if (ty.k === "struct" && ty.name === "(unnamed struct)") ty.name = d.name;
    this.expectSemi("the typedef");
    return null;
  };

  // ------------------------------------------------------------ declarations
  P.parseDecl = function () {
    var spec = this.parseTypeSpec();
    var d = this.parseDeclarator(spec.ty, {});
    return this.parseDeclRest(spec, d, false);
  };
  P.parseDeclRest = function (spec, d, global) {
    var decls = [];
    for (;;) {
      if (this.is("(") && d.name && global) this.fail("Unexpected ( here.", this.peek());
      var init = null, initKind = null;
      if (this.accept("=")) {
        if (this.is("{")) { init = this.parseInitList(); initKind = "list"; }
        else { init = this.parseAssign(); initKind = "="; }
      } else if (this.is("(")) {
        var lp = this.next();
        if (this.is(")")) {
          this.fail(d.name + "() with empty brackets declares a function, not a variable.", lp, "Remove the () to make a variable:  " + typeStr(d.ty) + " " + d.name + ";");
        }
        var args = [];
        do { args.push(this.parseAssign()); } while (this.accept(","));
        this.expect(")", "after the values");
        init = args; initKind = "ctor";
      } else if (this.is("{")) {
        init = this.parseInitList(); initKind = "list";
      }
      var nt = d.nameTok || d.tok;
      decls.push({ name: d.name, nameTok: nt, ty: d.ty, init: init, initKind: initKind, isConst: !!spec.isConst, isStatic: !!spec.isStatic, line: nt.line, col: nt.col, s: nt.s, z: this.prev().e });
      if (this.accept(",")) {
        d = this.parseDeclarator(spec.ty, {});
        continue;
      }
      break;
    }
    var n = mk("decl", spec.tok, { decls: decls, global: global });
    return this.fin(n);
  };
  P.parseInitList = function () {
    var lb = this.expect("{");
    var items = [];
    while (!this.is("}")) {
      items.push(this.is("{") ? this.parseInitList() : this.parseAssign());
      if (!this.accept(",")) break;
    }
    this.expect("}", "to close the list of values");
    return this.fin(mk("init", lb, { items: items }));
  };

  // ------------------------------------------------------------ statements
  P.parseBlock = function () {
    var lb = this.expect("{");
    var body = [];
    while (!this.is("}")) {
      if (this.peek().k === "eof") this.fail("The { on line " + lb.line + " is never closed with a }.", lb, "Check that every { has a matching }.");
      body.push(this.parseStatement());
    }
    var rb = this.next();
    var b = mk("block", lb, { body: body, endLine: rb.line });
    return this.fin(b);
  };

  P.isDeclStart = function () {
    if (!this.isTypeStart(0)) return false;
    var t = this.peek();
    // functional casts such as int(x) or string("a") at the start of an expression statement
    if (this.is("(", 1) && (t.k === "kw" || t.v === "string")) return false;
    return true;
  };

  P.parseStatement = function () {
    var t = this.peek();
    if (t.k === "op") {
      if (t.v === "{") return this.parseBlock();
      if (t.v === ";") { this.next(); return mk("empty", t); }
    }
    if (t.k === "kw") {
      switch (t.v) {
        case "if": return this.parseIf();
        case "while": {
          this.next();
          this.expect("(", "after while");
          var c = this.parseExpr();
          this.expect(")", "to close the while condition");
          if (this.is(";")) this.warnings.push({ line: this.peek().line, msg: "The ; right after while (...) is an empty loop body. The loop will repeat nothing (and may never end)." });
          var body = this.parseStatement();
          return this.fin(mk("while", t, { c: c, body: body }));
        }
        case "do": {
          this.next();
          var b2 = this.parseStatement();
          if (!this.is("while")) this.fail("A do loop must end with  while (condition);", this.peek());
          var wt = this.next();
          this.expect("(", "after while");
          var c2 = this.parseExpr();
          this.expect(")", "to close the condition");
          this.expectSemi("the do-while loop");
          return this.fin(mk("do", t, { body: b2, c: c2, cline: wt.line }));
        }
        case "for": return this.parseFor();
        case "switch": return this.parseSwitch();
        case "return": {
          this.next();
          var e = null;
          if (!this.is(";")) e = this.parseExpr();
          this.expectSemi("the return statement");
          return this.fin(mk("return", t, { e: e }));
        }
        case "break": this.next(); this.expectSemi("break"); return mk("break", t);
        case "continue": this.next(); this.expectSemi("continue"); return mk("continue", t);
        case "case": case "default": this.fail(t.v + " can only be used inside a switch.", t);
        // falls through
        case "else": this.fail("This else has no matching if.", t, "Check the braces before it. A ; right after  if (...)  also ends the if early.");
        // falls through
        case "struct": case "class":
          if (this.peek(1).k === "id" && this.is("{", 2)) this.fail("Define structs outside of functions, above main.", t);
          break;
        case "using": this.parseUsing(); return mk("empty", t);
        case "typedef": this.fail("Put typedefs outside of functions, above main.", t);
        // falls through
        case "goto": this.fail("goto is not used in this course.", t);
        // falls through
        case "try": case "throw": case "catch": this.fail("Exceptions (try/throw/catch) are not supported here.", t);
      }
    }
    if (this.isDeclStart()) {
      var d = this.parseDecl();
      this.expectSemi("this declaration");
      return d;
    }
    if (t.k === "id" && this.peek(1).k === "id" && !this.isTypeName(t.v)) {
      var after = this.peek(2);
      if ((after.k === "op" && (after.v === ";" || after.v === "=" || after.v === "[" || after.v === "," || after.v === "(")))
        this.fail("Unknown type '" + t.v + "'.", t, this.typeHint(t.v));
    }
    if (t.k === "id" && this.is("*", 1) && this.peek(2).k === "id" && (this.is("=", 3) || this.is(";", 3)) && !this.isTypeName(t.v) && /^[A-Z]/.test(t.v)) {
      this.fail("Unknown type '" + t.v + "'.", t, this.typeHint(t.v));
    }
    var ex = this.parseExpr();
    this.expectSemi();
    return this.fin(mk("expr", t, { e: ex }));
  };
  P.typeHint = function (name) {
    var best = null, bd = 99;
    var names = Array.from(this.structs.keys()).concat(Array.from(this.typedefs.keys()), ["string", "int", "double", "char", "bool"]);
    names.forEach(function (n) { var d = CPP.editDistance(n.toLowerCase(), name.toLowerCase()); if (d < bd) { bd = d; best = n; } });
    if (best && bd <= 2) return "Did you mean " + best + "? C++ is case-sensitive.";
    if (name === "String") return "In C++ the type is string (lower case), from #include <string>.";
    return "Types must be declared before they are used. Check the spelling, and that the struct is defined above this line.";
  };

  P.parseIf = function () {
    var t = this.next();
    this.expect("(", "after if");
    var c = this.parseExpr();
    this.expect(")", "to close the if condition");
    if (this.is(";")) this.warnings.push({ line: this.peek().line, msg: "The ; right after if (...) ends the if, so the next statement always runs." });
    var th = this.parseStatement();
    var el = null;
    if (this.accept("else")) el = this.parseStatement();
    return this.fin(mk("if", t, { c: c, t: th, f: el }));
  };

  P.parseFor = function () {
    var t = this.next();
    this.expect("(", "after for");
    var init = null;
    if (this.accept(";")) init = null;
    else {
      if (this.isDeclStart()) init = this.parseDecl();
      else init = mk("expr", this.peek(), { e: this.parseExpr() });
      if (this.is(":")) this.fail("Range-based for loops (for (x : list)) are not supported here.", this.peek(), "Use a normal counting loop:  for (int i = 0; i < n; i++)");
      if (!this.is(";")) this.fail("Expected ; after the first part of the for loop. The three parts of a for loop are separated by semicolons.", this.peek(), "Write it like  for (int i = 0; i < n; i++)");
      this.next();
    }
    var c = null;
    if (!this.is(";")) c = this.parseExpr();
    if (!this.is(";")) this.fail("Expected ; after the condition of the for loop.", this.peek(), "Write it like  for (int i = 0; i < n; i++)");
    this.next();
    var step = null;
    if (!this.is(")")) step = this.parseExpr();
    this.expect(")", "to close the for loop header");
    if (this.is(";")) this.warnings.push({ line: this.peek().line, msg: "The ; right after for (...) is an empty loop body, so the loop repeats nothing." });
    var body = this.parseStatement();
    return this.fin(mk("for", t, { init: init, c: c, step: step, body: body }));
  };

  P.parseSwitch = function () {
    var t = this.next();
    this.expect("(", "after switch");
    var e = this.parseExpr();
    this.expect(")", "to close the switch value");
    var lb = this.expect("{", "to start the switch");
    var cases = [], cur = null;
    while (!this.is("}")) {
      var ct = this.peek();
      if (ct.k === "eof") this.fail("The { of this switch (line " + lb.line + ") is never closed.", lb);
      if (this.is("case")) {
        this.next();
        var v = this.parseCond();
        this.expect(":", "after the case value");
        cur = { v: v, body: [], line: ct.line };
        cases.push(cur);
        continue;
      }
      if (this.is("default")) {
        this.next();
        this.expect(":", "after default");
        cur = { v: null, body: [], line: ct.line };
        cases.push(cur);
        continue;
      }
      if (!cur) this.fail("Statements in a switch must come after a case label.", ct);
      cur.body.push(this.parseStatement());
    }
    this.next();
    return this.fin(mk("switch", t, { e: e, cases: cases }));
  };

  // ------------------------------------------------------------ expressions
  P.parseExpr = function () {
    var e = this.parseAssign();
    while (this.is(",")) {
      var t = this.next();
      var b = this.parseAssign();
      e = this.fin(mk("comma", t, { a: e, b: b }));
      e.line = e.a.line; e.col = e.a.col; e.s = e.a.s;
    }
    return e;
  };
  P.parseAssign = function () {
    var a = this.parseCond();
    var t = this.peek();
    if (t.k === "op" && ASSIGN_OPS.has(t.v)) {
      this.next();
      var b = this.parseAssign();
      var n = mk("assign", t, { op: t.v, a: a, b: b });
      n.line = a.line; n.col = a.col; n.s = a.s; n.opTok = t;
      return this.fin(n);
    }
    if (t.k === "op" && t.v === "=" ) return a;
    return a;
  };
  P.parseCond = function () {
    var c = this.parseBin(1);
    if (this.is("?")) {
      var q = this.next();
      var a = this.parseExpr();
      this.expect(":", "in the ? : expression");
      var b = this.parseAssign();
      var n = mk("cond", q, { c: c, a: a, b: b });
      n.line = c.line; n.col = c.col; n.s = c.s;
      return this.fin(n);
    }
    return c;
  };
  P.parseBin = function (minPrec) {
    var a = this.parseUnary();
    for (;;) {
      var t = this.peek();
      if (t.k !== "op") break;
      var p = BIN_PREC[t.v];
      if (!p || p < minPrec) break;
      this.next();
      var b = this.parseBin(p + 1);
      var n = mk(t.v === "&&" || t.v === "||" ? "logic" : "bin", t, { op: t.v, a: a, b: b });
      n.line = a.line; n.col = a.col; n.s = a.s; n.opTok = t;
      a = this.fin(n);
    }
    return a;
  };
  P.parseCastType = function () {
    var spec = this.parseTypeSpec();
    var ty = spec.ty;
    while (this.is("*")) { this.next(); ty = ptrTo(ty); }
    if (this.is("&")) { this.next(); ty = refTo(ty); }
    return ty;
  };
  P.parseUnary = function () {
    var t = this.peek();
    if (t.k === "op") {
      switch (t.v) {
        case "!": case "~": case "-": case "+":
          this.next();
          return this.fin(mk("un", t, { op: t.v, e: this.parseUnary() }));
        case "*":
          this.next();
          return this.fin(mk("deref", t, { e: this.parseUnary() }));
        case "&":
          this.next();
          return this.fin(mk("addr", t, { e: this.parseUnary() }));
        case "++": case "--":
          this.next();
          return this.fin(mk("pre", t, { op: t.v, e: this.parseUnary() }));
        case "(":
          if (this.isTypeStart(1)) {
            // a C-style cast is "(type)" followed by a value; "(string ("a") < s)" is a bracketed expression instead
            var save = this.i;
            this.next();
            var ty = null;
            try { ty = this.parseCastType(); } catch (ex) { ty = null; }
            if (ty && this.is(")")) {
              this.next();
              var e = this.parseUnary();
              return this.fin(mk("cast", t, { ty: ty, e: e, style: "c" }));
            }
            this.i = save;
          }
          break;
      }
    } else if (t.k === "kw") {
      if (t.v === "sizeof") {
        this.next();
        if (this.is("(") && this.isTypeStart(1)) {
          this.next();
          var sty = this.parseCastType();
          var dims = [];
          while (this.accept("[")) { var dn = this.parseExpr(); this.expect("]"); dims.push(dn); }
          for (var q = dims.length - 1; q >= 0; q--) sty = arrOf(sty, dims[q].k === "num" ? dims[q].v : null, dims[q].k === "num" ? null : dims[q]);
          this.expect(")");
          return this.fin(mk("sizeof", t, { ty: sty }));
        }
        return this.fin(mk("sizeof", t, { e: this.parseUnary() }));
      }
      if (t.v === "new") return this.parseNew();
      if (t.v === "delete") {
        this.next();
        var arr = false;
        if (this.is("[")) { this.next(); this.expect("]", "in delete []"); arr = true; }
        return this.fin(mk("delete", t, { e: this.parseUnary(), arr: arr }));
      }
    }
    return this.parsePostfix();
  };
  P.parseNew = function () {
    var t = this.next();
    if (this.is("(")) this.fail("Write the type right after new, like  new Node  or  new int[10].", this.peek());
    var spec = this.parseTypeSpec();
    if (!spec) {
      var nt = this.peek();
      if (nt.k === "id") this.fail("Unknown type '" + nt.v + "' after new.", nt, this.typeHint(nt.v));
      this.fail("Expected a type after new.", nt, "For example:  new Node  or  new int[n]");
    }
    var ty = spec.ty;
    while (this.is("*")) { this.next(); ty = ptrTo(ty); }
    var n = null, isArr = false, inner = [];
    if (this.is("[")) {
      this.next();
      if (this.is("]")) this.fail("new [] needs a size, like  new int[10].", this.peek());
      n = this.parseExpr();
      this.expect("]", "after the array size");
      isArr = true;
      while (this.is("[")) {
        this.next();
        var d = this.parseExpr();
        this.expect("]");
        if (d.k !== "num") this.fail("Only the first size in new T[n][m] can be a variable.", d);
        inner.push(d.v);
      }
      for (var k = inner.length - 1; k >= 0; k--) ty = arrOf(ty, inner[k]);
    }
    var init = null, zero = false;
    if (this.is("(")) {
      this.next();
      if (this.is(")")) { zero = true; init = []; }
      else { init = []; do { init.push(this.parseAssign()); } while (this.accept(",")); }
      this.expect(")", "after the starting value");
    } else if (this.is("{")) {
      var il = this.parseInitList();
      init = il.items; zero = true;
      if (!init.length) init = [];
    }
    return this.fin(mk("new", t, { ty: ty, n: n, arr: isArr, init: init, zero: zero }));
  };
  P.parsePostfix = function () {
    var e = this.parsePrimary();
    for (;;) {
      var t = this.peek();
      if (t.k !== "op") break;
      if (t.v === "[") {
        this.next();
        var i = this.parseExpr();
        this.expect("]", "to close the index");
        var n = mk("idx", t, { a: e, i: i });
        n.line = e.line; n.col = e.col; n.s = e.s; n.bt = t;
        e = this.fin(n);
        continue;
      }
      if (t.v === "(") {
        if (e.k !== "id") this.fail("Only named functions can be called here. Function pointers and calling the result of an expression are not supported.", t, "Call the function by its name, for example twice (4).");
        this.next();
        var args = [];
        if (!this.is(")")) { do { args.push(this.parseAssign()); } while (this.accept(",")); }
        this.expect(")", "to close the call to " + e.name);
        var c = mk("call", e, { name: e.name, qual: e.qual, args: args, nameTok: e });
        c.line = e.line; c.col = e.col; c.s = e.s;
        e = this.fin(c);
        continue;
      }
      if (t.v === "." || t.v === "->") {
        this.next();
        var nt = this.peek();
        if (nt.k !== "id") {
          if (nt.k === "kw") this.fail("'" + nt.v + "' is a keyword, not a field name.", nt);
          this.fail("Expected a field name after " + t.v + ".", nt);
        }
        this.next();
        if (this.is("(")) {
          this.next();
          var margs = [];
          if (!this.is(")")) { do { margs.push(this.parseAssign()); } while (this.accept(",")); }
          this.expect(")", "to close the call to " + nt.v);
          var m = mk("method", nt, { obj: e, name: nt.v, args: margs, arrow: t.v === "->", opTok: t });
          m.line = e.line; m.col = e.col; m.s = e.s;
          e = this.fin(m);
        } else {
          var mm = mk("mem", nt, { e: e, name: nt.v, arrow: t.v === "->", nameTok: nt, opTok: t });
          mm.line = e.line; mm.col = e.col; mm.s = e.s;
          e = this.fin(mm);
        }
        continue;
      }
      if (t.v === "++" || t.v === "--") {
        this.next();
        var p = mk("post", t, { op: t.v, e: e });
        p.line = e.line; p.col = e.col; p.s = e.s;
        e = this.fin(p);
        continue;
      }
      break;
    }
    return e;
  };
  P.parsePrimary = function () {
    var t = this.peek();
    switch (t.k) {
      case "num": {
        this.next();
        return mk("num", t, { v: t.v, isFloat: t.isFloat, suf: t.suf, text: t.text });
      }
      case "chr": this.next(); return mk("chr", t, { v: t.v });
      case "str": {
        this.next();
        var s = t.v;
        while (this.peek().k === "str") s += this.next().v;
        return this.fin(mk("str", t, { v: s }));
      }
      case "id": {
        this.next();
        if (t.v === "NULL") return mk("null", t);
        if (t.v === "string" && this.is("(")) return this.parseStrCtor(t);
        if (t.v === "std" && this.is("::")) {
          this.next();
          var nt = this.next();
          if (nt.k !== "id") this.fail("Expected a name after std::", nt);
          var q = mk("id", t, { name: nt.v, qual: true });
          q.z = nt.e;
          return this.scopeTail(q);
        }
        if (this.is("::")) {
          var c2 = this.next();
          var mt = this.next();
          if ((t.v === "string") && mt.v === "npos") return this.fin(mk("npos", t));
          if ((t.v === "ios" || t.v === "ios_base") && /^(app|in|out|trunc|ate|binary)$/.test(mt.v)) return this.fin(mk("iosflag", t, { v: mt.v }));
          this.fail("The :: operator is only supported for std:: names and string::npos.", c2);
        }
        return mk("id", t, { name: t.v });
      }
      case "kw": {
        if (t.v === "true" || t.v === "false") { this.next(); return mk("bool", t, { v: t.v === "true" ? 1 : 0 }); }
        if (t.v === "nullptr") { this.next(); return mk("nullptr", t); }
        if (t.v === "this") this.fail("this is only for member functions, which are not used here.", t);
        if (t.v === "static_cast" || t.v === "const_cast" || t.v === "reinterpret_cast" || t.v === "dynamic_cast") {
          this.next();
          this.expect("<", "after " + t.v);
          var ty = this.parseCastType();
          this.expect(">", "after the type");
          this.expect("(");
          var e = this.parseExpr();
          this.expect(")");
          return this.fin(mk("cast", t, { ty: ty, e: e, style: "static" }));
        }
        if (/^(int|double|float|char|bool|long|short|unsigned)$/.test(t.v) && (this.is("(", 1) || this.is("long", 1) || this.is("int", 1))) {
          var fty = this.parseTypeSpec().ty;
          this.expect("(");
          var fe = this.parseExpr();
          this.expect(")");
          return this.fin(mk("cast", t, { ty: fty, e: fe, style: "func" }));
        }
        if (TYPE_KWS.has(t.v)) this.fail("A type (" + t.v + ") cannot be used here.", t, "Declarations go at the start of a statement, for example  int x = 5;");
        this.fail("'" + t.v + "' cannot be used here.", t);
      }
      // falls through
      case "op": {
        if (t.v === "(") {
          this.next();
          var pe = this.parseExpr();
          this.expect(")", "to close the bracket");
          pe.paren = true;
          return pe;
        }
        if (t.v === "{") this.fail("A list in { } can only be used to give a starting value in a declaration.", t);
        if (t.v === ";" ) this.fail("Expected a value before ;", t);
        if (t.v === ")" ) this.fail("Expected a value before )", t);
        if (t.v === "[") this.fail("Lambdas ([ ] ( ) { }) are not supported here.", t, "Write a normal function instead.");
        this.fail("Expected a value but found '" + t.v + "'.", t);
      }
      // falls through
      case "eof": this.fail("The file ended in the middle of a statement.", t, "Is a ; or } missing?");
    }
    this.fail("Unexpected " + this.desc(t) + ".", t);
  };
  P.parseStrCtor = function (t) {
    this.expect("(");
    var args = [];
    if (!this.is(")")) { do { args.push(this.parseAssign()); } while (this.accept(",")); }
    this.expect(")", "after the values");
    return this.fin(mk("strctor", t, { args: args }));
  };
  P.scopeTail = function (q) {
    if (q.name === "string" && this.is("::") ) {
      this.next();
      var mt = this.next();
      if (mt.v === "npos") return this.fin(mk("npos", q));
      this.fail("Only string::npos is supported.", mt);
    }
    if (q.name === "string" && this.is("(")) return this.parseStrCtor(q);
    if (CPP.UNSUPPORTED_TEMPLATES.has(q.name)) this.fail("std::" + q.name + " is not supported here.", q, "COMP 2611 builds its own structures with structs, pointers and arrays.");
    return q;
  };

  function editDistance(a, b) {
    var m = a.length, n = b.length, d = [];
    for (var i = 0; i <= m; i++) { d.push([i]); }
    for (var j = 1; j <= n; j++) d[0][j] = j;
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[m][n];
  }
  CPP.editDistance = editDistance;

  CPP.parse = function (src) {
    var lx = CPP.lex(src);
    var p = new Parser(lx);
    p.parseProgram();
    return {
      items: p.items, structs: p.structs, typedefs: p.typedefs, enums: p.enums, enumConsts: p.enumConsts,
      usingStd: p.usingStd, usingNames: p.usingNames, stdUses: p.stdUses, includes: lx.includes, macros: lx.macros,
      warnings: p.warnings, src: src, text: lx.text
    };
  };
  CPP.Parser = Parser;
})(CPP);
