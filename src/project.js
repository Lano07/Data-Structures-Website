/* COMP 2611 Code Lab — projects for the IDE: file types, the linker that joins several .cpp and .h files into one program
   (like g++ main.cpp list.cpp), project storage in the browser (IndexedDB, with fallbacks), zip files in and out,
   and the starter templates. */
(function (CL) {
  "use strict";
  var P = CL.Project = {};

  // ---------------------------------------------------------------- file types
  var KINDS = {
    cpp: { exts: ["cpp", "cc", "cxx", "c++", "c"], label: "C++ source", icon: "C++", lang: "cpp" },
    h: { exts: ["h", "hpp", "hh", "hxx", "inl"], label: "C++ header", icon: "H", lang: "cpp" },
    txt: { exts: ["txt", "text", "log", "out"], label: "Text", icon: "TXT", lang: "text" },
    data: { exts: ["in", "dat", "data", "input"], label: "Input data", icon: "IN", lang: "text" },
    csv: { exts: ["csv", "tsv"], label: "Table (CSV)", icon: "CSV", lang: "csv" },
    md: { exts: ["md", "markdown"], label: "Notes (Markdown)", icon: "MD", lang: "md" },
    json: { exts: ["json"], label: "JSON", icon: "{}", lang: "text" },
    web: { exts: ["html", "htm", "css", "js", "xml", "svg"], label: "Web file", icon: "</>", lang: "text" },
    py: { exts: ["py", "java", "sh", "bat", "rb", "go", "rs", "ts"], label: "Other code (view only)", icon: "SRC", lang: "text" },
    image: { exts: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "ico"], label: "Image", icon: "IMG", lang: "image" }
  };
  var EXT = {};
  Object.keys(KINDS).forEach(function (k) { KINDS[k].exts.forEach(function (e) { EXT[e] = k; }); });
  P.KINDS = KINDS;
  P.ext = function (path) { var m = /\.([^./\\]+)$/.exec(path || ""); return m ? m[1].toLowerCase() : ""; };
  P.kindOf = function (path) {
    var e = P.ext(path);
    if (EXT[e]) return EXT[e];
    if (/(^|\/)(makefile|readme|license)$/i.test(path)) return "txt";
    return e ? "other" : "txt";
  };
  P.isImage = function (path) { return P.kindOf(path) === "image"; };
  P.isSource = function (path) { return P.kindOf(path) === "cpp"; };
  P.isText = function (path) { return P.kindOf(path) !== "image"; };
  P.base = function (path) { return String(path).split("/").pop(); };
  P.dir = function (path) { var i = String(path).lastIndexOf("/"); return i < 0 ? "" : path.slice(0, i); };
  // tidy a path typed by a person: forward slashes, no leading ./ or /, no .. outside the project
  P.clean = function (path) {
    var parts = [];
    String(path || "").replace(/\\/g, "/").split("/").forEach(function (s) {
      s = s.trim();
      if (!s || s === ".") return;
      if (s === "..") { parts.pop(); return; }
      parts.push(s.replace(/[\u0000-\u001f<>:"|?*]/g, "_"));
    });
    return parts.join("/");
  };
  P.join = function (dir, rel) { return P.clean((dir ? dir + "/" : "") + rel); };
  P.hasMain = function (text) { return /\bint\s+main\s*\(/.test(String(text || "").replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "")); };

  // comments become spaces (newlines kept), so directives inside comments are ignored
  function blankComments(src) {
    var out = "", i = 0, n = src.length;
    while (i < n) {
      var c = src.charAt(i), d = src.charAt(i + 1);
      if (c === "/" && d === "/") { while (i < n && src.charAt(i) !== "\n") { out += " "; i++; } continue; }
      if (c === "/" && d === "*") { out += "  "; i += 2; while (i < n && !(src.charAt(i) === "*" && src.charAt(i + 1) === "/")) { out += src.charAt(i) === "\n" ? "\n" : " "; i++; } if (i < n) { out += "  "; i += 2; } continue; }
      if (c === '"' || c === "'") { var q = c; out += c; i++; while (i < n && src.charAt(i) !== q && src.charAt(i) !== "\n") { if (src.charAt(i) === "\\") { out += src.charAt(i); i++; } out += src.charAt(i) || ""; i++; } if (i < n && src.charAt(i) === q) { out += q; i++; } continue; }
      out += c; i++;
    }
    return out;
  }
  P.blankComments = blankComments;

  // ---------------------------------------------------------------- the linker
  // files: {path: text}; units: the .cpp files to compile, in order. Quoted #includes are pasted in (each header once, like
  // #pragma once: the program is compiled as one unit, which is what separate compilation plus linking gives for headers
  // of declarations), #ifdef / #ifndef / #if 0 / #else / #endif are honoured, and every line remembers where it came from.
  P.link = function (files, units) {
    var out = [], map = [], included = {}, defined = Object.create(null), error = null;
    function lineOf(f, l, text) { out.push(text); map.push({ f: f, l: l }); }
    function resolve(name, fromDir) {
      var a = P.join(fromDir, name);
      if (files[a] !== undefined) return a;
      var b = P.clean(name);
      if (files[b] !== undefined) return b;
      // last chance: a unique file with that name anywhere in the project
      var base = P.base(b), hits = Object.keys(files).filter(function (p) { return P.base(p) === base; });
      return hits.length === 1 ? hits[0] : null;
    }
    function evalIf(expr) {
      var e = expr.replace(/\/\/.*$/, "").trim();
      e = e.replace(/defined\s*\(\s*(\w+)\s*\)|defined\s+(\w+)/g, function (_, a, b) { return defined[a || b] ? "1" : "0"; });
      if (/^!?\s*[01]$/.test(e)) return e.charAt(0) === "!" ? e.slice(-1) === "0" : e === "1";
      if (/^\d+$/.test(e)) return +e !== 0;
      return true;
    }
    function emit(path, depth) {
      if (error) return;
      if (depth > 24) { error = { file: path, line: 1, msg: "#include is nested too deeply. Two headers probably include each other." }; return; }
      var text = String(files[path]).replace(/\r\n?/g, "\n");
      var lines = text.split("\n"), plain = blankComments(text).split("\n");
      var cond = [];
      for (var i = 0; i < lines.length && !error; i++) {
        var L = lines[i];
        var active = cond.every(function (c) { return c.on; });
        var m = /^\s*#\s*(\w+)\s*(.*)$/.exec(plain[i] || "");
        if (!m) { lineOf(path, i + 1, active ? L : ""); continue; }
        var dir = m[1], rest = m[2].trim();
        if (dir === "ifdef" || dir === "ifndef" || dir === "if") {
          var name = rest.split(/\s+/)[0];
          var ok = dir === "ifdef" ? !!defined[name] : dir === "ifndef" ? !defined[name] : evalIf(rest);
          cond.push({ on: active && ok, taken: ok, parent: active });
          lineOf(path, i + 1, ""); continue;
        }
        if (dir === "elif") { var top = cond[cond.length - 1]; if (top) { var ok2 = !top.taken && evalIf(rest); top.on = top.parent && ok2; top.taken = top.taken || ok2; } lineOf(path, i + 1, ""); continue; }
        if (dir === "else") { var t2 = cond[cond.length - 1]; if (t2) { t2.on = t2.parent && !t2.taken; t2.taken = true; } lineOf(path, i + 1, ""); continue; }
        if (dir === "endif") { cond.pop(); lineOf(path, i + 1, ""); continue; }
        if (!active) { lineOf(path, i + 1, ""); continue; }
        if (dir === "define") { var dn = /^([A-Za-z_]\w*)/.exec(rest); if (dn) defined[dn[1]] = true; lineOf(path, i + 1, L); continue; }
        if (dir === "undef") { delete defined[rest.split(/\s+/)[0]]; lineOf(path, i + 1, L); continue; }
        if (dir === "pragma") { if (/^once\b/.test(rest)) included[path] = true; lineOf(path, i + 1, ""); continue; }
        if (dir === "include") {
          var q = /^"([^"]+)"/.exec(rest);
          if (!q) { lineOf(path, i + 1, L); continue; }
          var target = resolve(q[1], P.dir(path));
          if (!target) {
            if (/^(iostream|string|cstring|cmath|fstream|sstream|iomanip|cstdlib|cstddef|ctime|cctype|climits|vector|algorithm)$/.test(q[1])) { lineOf(path, i + 1, L.replace(/"([^"]+)"/, "<$1>")); continue; }
            error = { file: path, line: i + 1, col: L.indexOf('"') + 1, msg: q[1] + ": No such file or directory", hint: "There is no file called " + q[1] + " in this project. Create it in the file list, or check the spelling (file names are case-sensitive)." };
            break;
          }
          if (!P.isText(target)) { error = { file: path, line: i + 1, msg: q[1] + " is not a text file, so it cannot be included." }; break; }
          lineOf(path, i + 1, "");
          if (included[target]) continue;
          included[target] = true;
          emit(target, depth + 1);
          continue;
        }
        lineOf(path, i + 1, L);
      }
    }
    units.forEach(function (u) { if (!error) emit(u, 0); });
    return { src: out.join("\n"), map: map, error: error, units: units.slice() };
  };
  // where a line of the joined program came from
  P.where = function (linked, line) {
    var m = linked && linked.map[(line || 1) - 1];
    return m ? { file: m.f, line: m.l } : { file: linked && linked.units[0], line: line || 0 };
  };
  // which .cpp files make up the program when Run is pressed: every .cpp when there is exactly one main();
  // with several mains, the open file (if it has main) plus the .cpp files without a main
  P.unitsFor = function (files, active) {
    var srcs = Object.keys(files).filter(function (p) { return P.isSource(p); }).sort(function (a, b) { return a.split("/").length - b.split("/").length || a.localeCompare(b); });
    var mains = srcs.filter(function (p) { return P.hasMain(files[p]); });
    if (!mains.length) return { units: srcs, main: null, why: "none" };
    var main = mains.length === 1 ? mains[0] : (mains.indexOf(active) >= 0 ? active : null);
    if (!main) return { units: [], main: null, why: "many", mains: mains };
    var rest = srcs.filter(function (p) { return !P.hasMain(files[p]); });
    return { units: [main].concat(rest), main: main, why: mains.length > 1 ? "picked" : "one", mains: mains };
  };

  // ---------------------------------------------------------------- storage: IndexedDB, then localStorage, then memory
  var DBNAME = "comp2611-ide", STORE = "kv", LSP = "comp2611-ide:";
  var mem = {}, dbp = null;
  function idb() {
    if (dbp) return dbp;
    dbp = new Promise(function (resolve) {
      try {
        if (!window.indexedDB) return resolve(null);
        var rq = indexedDB.open(DBNAME, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore(STORE); };
        rq.onsuccess = function () { resolve(rq.result); };
        rq.onerror = function () { resolve(null); };
        rq.onblocked = function () { resolve(null); };
      } catch (e) { resolve(null); }
    });
    return dbp;
  }
  function tx(db, mode, fn) {
    return new Promise(function (resolve) {
      try {
        var t = db.transaction(STORE, mode), st = t.objectStore(STORE), r = fn(st);
        t.oncomplete = function () { resolve(r && r.result !== undefined ? r.result : r ? r.result : undefined); };
        t.onerror = t.onabort = function () { resolve(undefined); };
      } catch (e) { resolve(undefined); }
    });
  }
  P.store = {
    get: function (k) {
      return idb().then(function (db) {
        if (db) return tx(db, "readonly", function (st) { return st.get(k); });
        try { var s = localStorage.getItem(LSP + k); return s ? JSON.parse(s) : mem[k]; } catch (e) { return mem[k]; }
      });
    },
    set: function (k, v) {
      return idb().then(function (db) {
        if (db) return tx(db, "readwrite", function (st) { return st.put(v, k); }).then(function () { return true; });
        try { localStorage.setItem(LSP + k, JSON.stringify(v)); return true; } catch (e) { mem[k] = v; return false; }
      });
    },
    del: function (k) {
      return idb().then(function (db) {
        if (db) return tx(db, "readwrite", function (st) { return st.delete(k); });
        try { localStorage.removeItem(LSP + k); } catch (e) { /* ignore */ }
        delete mem[k];
      });
    }
  };

  // ---------------------------------------------------------------- zip files (read and write), CRC-32
  var CRC = null;
  function crc32(u8) {
    if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    var x = 0xffffffff;
    for (var i = 0; i < u8.length; i++) x = CRC[(x ^ u8[i]) & 255] ^ (x >>> 8);
    return (x ^ 0xffffffff) >>> 0;
  }
  P.crc32 = crc32;
  function streamBytes(u8, Kind, fmt) {
    var s = new Blob([u8]).stream().pipeThrough(new Kind(fmt));
    return new Response(s).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  var canInflate = typeof DecompressionStream !== "undefined", canDeflate = typeof CompressionStream !== "undefined";
  // returns Promise<[{path, bytes}]>
  P.unzip = function (buf) {
    var u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    var eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 66000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return Promise.reject(new Error("This is not a zip file (or it is damaged)."));
    var count = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true), entries = [];
    var dec = new TextDecoder("utf-8");
    for (var e = 0; e < count; e++) {
      if (dv.getUint32(off, true) !== 0x02014b50) break;
      var method = dv.getUint16(off + 10, true), csize = dv.getUint32(off + 20, true), nlen = dv.getUint16(off + 28, true);
      var xlen = dv.getUint16(off + 30, true), clen = dv.getUint16(off + 32, true), lho = dv.getUint32(off + 42, true);
      var name = dec.decode(u8.subarray(off + 46, off + 46 + nlen));
      off += 46 + nlen + xlen + clen;
      if (/\/$/.test(name) || /(^|\/)(__MACOSX|\.DS_Store)/.test(name)) continue;
      var lnlen = dv.getUint16(lho + 26, true), lxlen = dv.getUint16(lho + 28, true), start = lho + 30 + lnlen + lxlen;
      entries.push({ path: name, method: method, data: u8.subarray(start, start + csize) });
    }
    return Promise.all(entries.map(function (en) {
      if (en.method === 0) return Promise.resolve({ path: en.path, bytes: en.data });
      if (en.method === 8 && canInflate) return streamBytes(en.data, DecompressionStream, "deflate-raw").then(function (b) { return { path: en.path, bytes: b }; }, function () { return { path: en.path, bytes: null, bad: "could not be unpacked" }; });
      return Promise.resolve({ path: en.path, bytes: null, bad: "uses a compression method this browser cannot unpack" });
    }));
  };
  // files: {path: string | Uint8Array} -> Promise<Blob>
  P.zip = function (files) {
    var enc = new TextEncoder(), names = Object.keys(files).sort();
    var now = new Date(), dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1), dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    return Promise.all(names.map(function (n) {
      var raw = typeof files[n] === "string" ? enc.encode(files[n]) : files[n];
      var crc = crc32(raw);
      if (!canDeflate || raw.length < 64) return Promise.resolve({ n: n, raw: raw, data: raw, crc: crc, method: 0 });
      return streamBytes(raw, CompressionStream, "deflate-raw").then(function (d) { return d.length < raw.length ? { n: n, raw: raw, data: d, crc: crc, method: 8 } : { n: n, raw: raw, data: raw, crc: crc, method: 0 }; },
        function () { return { n: n, raw: raw, data: raw, crc: crc, method: 0 }; });
    })).then(function (items) {
      var parts = [], central = [], offset = 0;
      items.forEach(function (it) {
        var name = enc.encode(it.n);
        var h = new DataView(new ArrayBuffer(30));
        h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, it.method, true);
        h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true); h.setUint32(14, it.crc, true);
        h.setUint32(18, it.data.length, true); h.setUint32(22, it.raw.length, true); h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
        parts.push(new Uint8Array(h.buffer), name, it.data);
        var c = new DataView(new ArrayBuffer(46));
        c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(10, it.method, true);
        c.setUint16(12, dosTime, true); c.setUint16(14, dosDate, true); c.setUint32(16, it.crc, true); c.setUint32(20, it.data.length, true);
        c.setUint32(24, it.raw.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
        central.push(new Uint8Array(c.buffer), name);
        offset += 30 + name.length + it.data.length;
      });
      var cdSize = central.reduce(function (s, x) { return s + x.length; }, 0);
      var end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, 0x06054b50, true); end.setUint16(8, items.length, true); end.setUint16(10, items.length, true);
      end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
      return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]), { type: "application/zip" });
    });
  };

  // ---------------------------------------------------------------- bytes to project files
  var MAX_TEXT = 3 * 1024 * 1024, MAX_IMAGE = 2 * 1024 * 1024;
  P.MAX_TEXT = MAX_TEXT;
  function looksBinary(u8) {
    var n = Math.min(u8.length, 8000), odd = 0;
    for (var i = 0; i < n; i++) { var c = u8[i]; if (c === 0) return true; if (c < 9 || (c > 13 && c < 32)) odd++; }
    return n > 0 && odd / n > 0.1;
  }
  function b64(u8) {
    var s = "", CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return btoa(s);
  }
  var MIME = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", bmp: "image/bmp", ico: "image/x-icon", svg: "image/svg+xml" };
  // -> {text} | {data: "data:..."} | {skip: reason}
  P.fromBytes = function (path, u8) {
    if (!u8) return { skip: "could not be read" };
    if (P.isImage(path)) {
      if (u8.length > MAX_IMAGE) return { skip: "is an image larger than 2 MB" };
      return { data: "data:" + (MIME[P.ext(path)] || "application/octet-stream") + ";base64," + b64(u8) };
    }
    if (looksBinary(u8)) return { skip: "is not a text file (programs, documents and archives cannot be opened here)" };
    if (u8.length > MAX_TEXT) return { skip: "is larger than 3 MB" };
    var t = new TextDecoder("utf-8").decode(u8);
    if (t.charCodeAt(0) === 0xfeff) t = t.slice(1);
    return { text: t.replace(/\r\n?/g, "\n") };
  };
  P.toBytes = function (content) {
    if (typeof content === "string" && /^data:[^;,]+;base64,/.test(content)) {
      var bin = atob(content.slice(content.indexOf(",") + 1)), u8 = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8;
    }
    return content;
  };

  // ---------------------------------------------------------------- templates
  var HELLO = "#include <iostream>\nusing namespace std;\n\nint main() {\n\tcout << \"Hello, COMP 2611!\" << endl;\n\treturn 0;\n}\n";
  P.TEMPLATES = [
    { id: "hello", title: "Empty program", blurb: "One main.cpp that prints a line.", files: { "main.cpp": HELLO } },
    { id: "interactive", title: "Interactive menu", blurb: "A menu loop that reads your choices with cin, like a real console app.", files: {
      "main.cpp": "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n\tstring name;\n\tcout << \"What is your name? \";\n\tgetline (cin, name);\n\tcout << \"Welcome, \" << name << \"!\" << endl;\n\n\tint choice = 0, total = 0;\n\twhile (choice != 3) {\n\t\tcout << \"\\n1. Add a number\\n2. Show the total\\n3. Quit\\nChoice: \";\n\t\tif (!(cin >> choice)) break;\n\t\tif (choice == 1) {\n\t\t\tint x;\n\t\t\tcout << \"Number: \";\n\t\t\tcin >> x;\n\t\t\ttotal = total + x;\n\t\t}\n\t\telse if (choice == 2)\n\t\t\tcout << \"Total so far: \" << total << endl;\n\t}\n\tcout << \"Goodbye, \" << name << \".\" << endl;\n\treturn 0;\n}\n" } },
    { id: "list", title: "Linked list project", blurb: "main.cpp, LinkedList.h and LinkedList.cpp: the course's Node, createNode and list functions, split over files.", files: {
      "LinkedList.h": "#ifndef LINKEDLIST_H\n#define LINKEDLIST_H\n\nstruct Node {\n\tint data;\n\tNode * next;\n};\n\nNode * createNode (int n);\nNode * insertAtHead (Node * top, int n);\nNode * insertAtTail (Node * top, int n);\nvoid printList (Node * top);\nint size (Node * top);\nNode * deleteKey (Node * top, int key);\n\n#endif\n",
      "LinkedList.cpp": "#include <iostream>\n#include \"LinkedList.h\"\nusing namespace std;\n\nNode * createNode (int n) {\n\tNode * newNode = new Node;\n\tnewNode->data = n;\n\tnewNode->next = NULL;\n\treturn newNode;\n}\n\nNode * insertAtHead (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tnewNode->next = top;\n\treturn newNode;\n}\n\nNode * insertAtTail (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tif (top == NULL)\n\t\treturn newNode;\n\tNode * curr = top;\n\twhile (curr->next != NULL)\n\t\tcurr = curr->next;\n\tcurr->next = newNode;\n\treturn top;\n}\n\nvoid printList (Node * top) {\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tcout << curr->data << \" \";\n\t\tcurr = curr->next;\n\t}\n\tcout << endl;\n}\n\nint size (Node * top) {\n\tint count = 0;\n\tfor (Node * curr = top; curr != NULL; curr = curr->next)\n\t\tcount++;\n\treturn count;\n}\n\nNode * deleteKey (Node * top, int key) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tif (top->data == key) {\n\t\tNode * temp = top;\n\t\ttop = top->next;\n\t\tdelete temp;\n\t\treturn top;\n\t}\n\tNode * prev = top;\n\tNode * curr = top->next;\n\twhile (curr != NULL && curr->data != key) {\n\t\tprev = curr;\n\t\tcurr = curr->next;\n\t}\n\tif (curr != NULL) {\n\t\tprev->next = curr->next;\n\t\tdelete curr;\n\t}\n\treturn top;\n}\n",
      "main.cpp": "#include <iostream>\n#include \"LinkedList.h\"\nusing namespace std;\n\nint main() {\n\tNode * top = NULL;\n\tint n, x;\n\tcout << \"How many values? \";\n\tcin >> n;\n\tfor (int i = 0; i < n; i++) {\n\t\tcout << \"Value \" << i + 1 << \": \";\n\t\tcin >> x;\n\t\ttop = insertAtTail (top, x);\n\t}\n\tcout << \"Your list: \";\n\tprintList (top);\n\tcout << \"It has \" << size (top) << \" nodes.\" << endl;\n\tcout << \"Delete which value? \";\n\tcin >> x;\n\ttop = deleteKey (top, x);\n\tprintList (top);\n\treturn 0;\n}\n" } },
    { id: "bst", title: "Binary search tree", blurb: "BST.h and BST.cpp with insert, search and the three traversals; main.cpp reads keys from you.", files: {
      "BST.h": "#ifndef BST_H\n#define BST_H\n\nstruct BTNode {\n\tint data;\n\tBTNode * left;\n\tBTNode * right;\n};\n\nBTNode * insertBST (BTNode * root, int key);\nBTNode * containsBST (BTNode * root, int key);\nvoid preOrder (BTNode * root);\nvoid inOrder (BTNode * root);\nvoid postOrder (BTNode * root);\nint height (BTNode * root);\n\n#endif\n",
      "BST.cpp": "#include <iostream>\n#include \"BST.h\"\nusing namespace std;\n\nBTNode * insertBST (BTNode * root, int key) {\n\tif (root == NULL) {\n\t\tBTNode * p = new BTNode;\n\t\tp->data = key;\n\t\tp->left = p->right = NULL;\n\t\treturn p;\n\t}\n\tif (key < root->data)\n\t\troot->left = insertBST (root->left, key);\n\telse if (key > root->data)\n\t\troot->right = insertBST (root->right, key);\n\treturn root;\n}\n\nBTNode * containsBST (BTNode * root, int key) {\n\tif (root == NULL || root->data == key)\n\t\treturn root;\n\tif (key < root->data)\n\t\treturn containsBST (root->left, key);\n\treturn containsBST (root->right, key);\n}\n\nvoid preOrder (BTNode * root) {\n\tif (root == NULL) return;\n\tcout << root->data << \" \";\n\tpreOrder (root->left);\n\tpreOrder (root->right);\n}\n\nvoid inOrder (BTNode * root) {\n\tif (root == NULL) return;\n\tinOrder (root->left);\n\tcout << root->data << \" \";\n\tinOrder (root->right);\n}\n\nvoid postOrder (BTNode * root) {\n\tif (root == NULL) return;\n\tpostOrder (root->left);\n\tpostOrder (root->right);\n\tcout << root->data << \" \";\n}\n\nint height (BTNode * root) {\n\tif (root == NULL) return -1;\n\tint l = height (root->left), r = height (root->right);\n\treturn 1 + (l > r ? l : r);\n}\n",
      "main.cpp": "#include <iostream>\n#include \"BST.h\"\nusing namespace std;\n\nint main() {\n\tBTNode * root = NULL;\n\tint key;\n\tcout << \"Type keys to insert, then press Ctrl+D (or the EOF button) to finish:\" << endl;\n\twhile (cin >> key)\n\t\troot = insertBST (root, key);\n\tcout << \"Preorder:  \"; preOrder (root); cout << endl;\n\tcout << \"Inorder:   \"; inOrder (root); cout << endl;\n\tcout << \"Postorder: \"; postOrder (root); cout << endl;\n\tcout << \"Height: \" << height (root) << endl;\n\treturn 0;\n}\n" } },
    { id: "files", title: "Read and write files", blurb: "Reads scores from scores.txt with ifstream and writes report.txt with ofstream.", files: {
      "scores.txt": "Asha 78\nBrandon 91\nChen 64\nDarnell 85\nEmma 72\n",
      "main.cpp": "#include <iostream>\n#include <fstream>\n#include <string>\nusing namespace std;\n\nint main() {\n\tifstream in (\"scores.txt\");\n\tif (!in.is_open()) {\n\t\tcout << \"Cannot open scores.txt\" << endl;\n\t\treturn 1;\n\t}\n\tofstream out (\"report.txt\");\n\tstring name;\n\tint score, count = 0, total = 0, best = -1;\n\tstring bestName;\n\twhile (in >> name >> score) {\n\t\tcount++;\n\t\ttotal = total + score;\n\t\tif (score > best) { best = score; bestName = name; }\n\t\tout << name << \": \" << (score >= 70 ? \"pass\" : \"resit\") << endl;\n\t}\n\tin.close();\n\tout << \"Average: \" << (double) total / count << endl;\n\tout.close();\n\tcout << \"Read \" << count << \" students. Best: \" << bestName << \" (\" << best << \").\" << endl;\n\tcout << \"Open report.txt in the file list to see what was written.\" << endl;\n\treturn 0;\n}\n" } },
    { id: "graph", title: "Graph from a file", blurb: "Builds an adjacency list from graph.txt and runs breadth-first search.", files: {
      "graph.txt": "6\nA B F\nB C E\nC D\nD A B\nE D\nF E\n",
      "main.cpp": "#include <iostream>\n#include <fstream>\n#include <sstream>\n#include <string>\nusing namespace std;\n\nconst int MAX = 26;\n\nstruct Graph {\n\tint n;\n\tbool adj[MAX][MAX];\n};\n\nint main() {\n\tifstream in (\"graph.txt\");\n\tGraph g;\n\tin >> g.n;\n\tfor (int i = 0; i < MAX; i++)\n\t\tfor (int j = 0; j < MAX; j++)\n\t\t\tg.adj[i][j] = false;\n\tstring line;\n\tgetline (in, line);\n\twhile (getline (in, line)) {\n\t\tistringstream words (line);\n\t\tchar u, v;\n\t\twords >> u;\n\t\twhile (words >> v)\n\t\t\tg.adj[u - 'A'][v - 'A'] = true;\n\t}\n\t// breadth-first search from A, using an array as the queue\n\tint queue[MAX], head = 0, tail = 0;\n\tbool seen[MAX] = {false};\n\tqueue[tail++] = 0;\n\tseen[0] = true;\n\tcout << \"BFS from A:\";\n\twhile (head < tail) {\n\t\tint u = queue[head++];\n\t\tcout << \" \" << (char) ('A' + u);\n\t\tfor (int v = 0; v < g.n; v++)\n\t\t\tif (g.adj[u][v] && !seen[v]) {\n\t\t\t\tseen[v] = true;\n\t\t\t\tqueue[tail++] = v;\n\t\t\t}\n\t}\n\tcout << endl;\n\treturn 0;\n}\n" } },
    { id: "stack", title: "Stack and queue", blurb: "Stack.h / Queue.h with linked-list stacks and queues and a bracket checker you can type into.", files: {
      "Stack.h": "#ifndef STACK_H\n#define STACK_H\n\nstruct StackNode {\n\tchar data;\n\tStackNode * next;\n};\n\nstruct Stack {\n\tStackNode * top;\n};\n\nStack * initStack ();\nbool isEmpty (Stack * s);\nvoid push (Stack * s, char c);\nchar pop (Stack * s);\n\n#endif\n",
      "Stack.cpp": "#include \"Stack.h\"\n#include <cstddef>\n\nStack * initStack () {\n\tStack * s = new Stack;\n\ts->top = NULL;\n\treturn s;\n}\n\nbool isEmpty (Stack * s) {\n\treturn s->top == NULL;\n}\n\nvoid push (Stack * s, char c) {\n\tStackNode * p = new StackNode;\n\tp->data = c;\n\tp->next = s->top;\n\ts->top = p;\n}\n\nchar pop (Stack * s) {\n\tif (isEmpty (s))\n\t\treturn '\\0';\n\tStackNode * p = s->top;\n\tchar c = p->data;\n\ts->top = p->next;\n\tdelete p;\n\treturn c;\n}\n",
      "main.cpp": "#include <iostream>\n#include <string>\n#include \"Stack.h\"\nusing namespace std;\n\nbool matches (char open, char close) {\n\treturn (open == '(' && close == ')') || (open == '[' && close == ']') || (open == '{' && close == '}');\n}\n\nbool balanced (string text) {\n\tStack * s = initStack ();\n\tfor (int i = 0; i < (int) text.length(); i++) {\n\t\tchar c = text[i];\n\t\tif (c == '(' || c == '[' || c == '{')\n\t\t\tpush (s, c);\n\t\telse if (c == ')' || c == ']' || c == '}') {\n\t\t\tif (isEmpty (s) || !matches (pop (s), c))\n\t\t\t\treturn false;\n\t\t}\n\t}\n\treturn isEmpty (s);\n}\n\nint main() {\n\tstring line;\n\tcout << \"Type a line with brackets (Ctrl+D to stop):\" << endl;\n\twhile (getline (cin, line))\n\t\tcout << (balanced (line) ? \"  balanced\" : \"  NOT balanced\") << endl;\n\treturn 0;\n}\n" } }
  ];
  P.HELLO = HELLO;
  P.newId = function () { return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  P.make = function (name, files) {
    var paths = Object.keys(files || {});
    var first = paths.filter(function (p) { return P.hasMain(files[p]); })[0] || paths[0] || null;
    return { id: P.newId(), name: name || "Untitled project", files: Object.assign({}, files || {}), folders: [], open: first ? [first] : [], active: first, input: "", created: Date.now(), updated: Date.now() };
  };
})(CL);
