/* COMP 2611 Code Lab — Hashing Lab: linear probing, quadratic probing, double hashing and chaining (locations 1 to N). */
(function (CL) {
  "use strict";
  var esc = CL.esc, T = CL.tagCode;

  var CODE = {
    linear: T(
      "int hash (int key) {\n" +
      "\treturn key % N + 1;                           //@h\n" +
      "}\n\n" +
      "void insertKey (int table[], int key) {\n" +
      "\tint loc = hash (key);                         //@start\n" +
      "\twhile (table[loc] != EMPTY && table[loc] != DELETED) {   //@loop\n" +
      "\t\tloc = loc + 1;                            //@next\n" +
      "\t\tif (loc > N)                              //@wrap\n" +
      "\t\t\tloc = 1;\n" +
      "\t}\n" +
      "\ttable[loc] = key;                             //@put\n" +
      "}"),
    quad: T(
      "int hash (int key) {\n" +
      "\treturn key % N + 1;                           //@h\n" +
      "}\n\n" +
      "void insertKey (int table[], int key) {\n" +
      "\tint loc = hash (key);                         //@start\n" +
      "\tint x = 0;                                    // number of collisions so far\n" +
      "\twhile (table[loc] != EMPTY && table[loc] != DELETED) {   //@loop\n" +
      "\t\tx = x + 1;\n" +
      "\t\tloc = loc + x + x * x;                    //@next\n" +
      "\t\twhile (loc > N)                           //@wrap\n" +
      "\t\t\tloc = loc - N;\n" +
      "\t}\n" +
      "\ttable[loc] = key;                             //@put\n" +
      "}"),
    "double": T(
      "int hash (int key) {\n" +
      "\treturn key % N + 1;                           //@h\n" +
      "}\n\n" +
      "void insertKey (int table[], int key) {\n" +
      "\tint loc = hash (key);                         //@start\n" +
      "\tint k = key % (N - 2) + 1;                    // step size depends on the key   //@k\n" +
      "\twhile (table[loc] != EMPTY && table[loc] != DELETED) {   //@loop\n" +
      "\t\tloc = loc + k;                            //@next\n" +
      "\t\tif (loc > N)                              //@wrap\n" +
      "\t\t\tloc = loc - N;\n" +
      "\t}\n" +
      "\ttable[loc] = key;                             //@put\n" +
      "}"),
    chain: T(
      "struct Node {\n\tint data;\n\tNode * next;\n};\n\n" +
      "int hash (int key) {\n" +
      "\treturn key % N + 1;                           //@h\n" +
      "}\n\n" +
      "void insertKey (Node * table[], int key) {\n" +
      "\tint loc = hash (key);                         //@start\n" +
      "\tNode * newNode = new Node;                    //@new\n" +
      "\tnewNode->data = key;\n" +
      "\tnewNode->next = table[loc];                   // put it at the top of the list   //@link\n" +
      "\ttable[loc] = newNode;                         //@put\n" +
      "}"),
    search: T(
      "int searchKey (int table[], int key) {\n" +
      "\tint loc = hash (key);                         //@start\n" +
      "\tint tries = 0;\n" +
      "\twhile (table[loc] != EMPTY && tries < N) {   // DELETED does not stop the search   //@loop\n" +
      "\t\tif (table[loc] == key)                    //@test\n" +
      "\t\t\treturn loc;                           //@found\n" +
      "\t\tloc = next location (same rule as insertKey);   //@next\n" +
      "\t\ttries++;\n" +
      "\t}\n" +
      "\treturn -1;                                    // not in the table   //@notfound\n" +
      "}"),
    chainSearch: T(
      "Node * searchKey (Node * table[], int key) {\n" +
      "\tint loc = hash (key);                         //@start\n" +
      "\tNode * curr = table[loc];\n" +
      "\twhile (curr != NULL) {                       //@loop\n" +
      "\t\tif (curr->data == key)                    //@test\n" +
      "\t\t\treturn curr;                          //@found\n" +
      "\t\tcurr = curr->next;                        //@next\n" +
      "\t}\n" +
      "\treturn NULL;                                  //@notfound\n" +
      "}")
  };
  var PRESETS = [
    { name: "Lecture 14 keys (probing)", keys: "52 33 84 43 16 59 31 23 61", method: "linear" },
    { name: "Lecture 14 keys (chaining)", keys: "39 25 26 60 37 75 13 73", method: "chain" },
    { name: "Lecture 15 quadratic example", keys: "52 33 84 43 16 59 31 23 61", method: "quad" },
    { name: "Lecture 15 double hashing example", keys: "52 33 84 43 16", method: "double" }
  ];

  function Table(N, method, variant) {
    this.N = N; this.method = method; this.variant = variant;
    this.t = new Array(N + 1).fill(0);
    this.c = []; for (var i = 0; i <= N; i++) this.c.push([]);
  }
  Table.prototype.clone = function () {
    var x = new Table(this.N, this.method, this.variant);
    x.t = this.t.slice();
    x.c = this.c.map(function (l) { return l.slice(); });
    return x;
  };
  Table.prototype.h = function (k) { return k % this.N + 1; };
  Table.prototype.step = function (k) { return this.variant === "slide" ? k % (this.N - 2) : k % (this.N - 2) + 1; };

  function draw(tb, f) {
    var N = tb.N, rowH = 30, top = 8, w = tb.method === "chain" ? 520 : 240;
    var maxLen = 0;
    if (tb.method === "chain") tb.c.forEach(function (l) { maxLen = Math.max(maxLen, l.length); });
    if (tb.method === "chain") w = Math.max(300, 120 + maxLen * 74 + 40);
    var hgt = top + N * rowH + 10;
    var s = '<svg width="' + w + '" height="' + hgt + '" viewBox="0 0 ' + w + " " + hgt + '" role="img" aria-label="hash table">';
    var probe = new Set(f.probe || []);
    for (var i = 1; i <= N; i++) {
      var y = top + (i - 1) * rowH;
      var cls = i === f.hot ? "hot" : probe.has(i) ? "on" : i === f.done ? "done" : "";
      s += '<text class="g-idx" x="22" y="' + (y + rowH / 2 + 4) + '" style="font-size:12px">' + i + "</text>";
      if (tb.method === "chain") {
        s += '<g class="g-cell ' + cls + '"><rect x="40" y="' + (y + 3) + '" width="44" height="' + (rowH - 6) + '"/>' + (tb.c[i].length ? "" : '<text x="62" y="' + (y + rowH / 2) + '" style="font-size:10px;fill:var(--muted)">NULL</text>') + "</g>";
        var x = 84;
        tb.c[i].forEach(function (k, j) {
          var nx = 110 + j * 74;
          s += '<line class="g-edge on" x1="' + (j === 0 ? 62 : x - 10) + '" y1="' + (y + rowH / 2) + '" x2="' + (nx - 2) + '" y2="' + (y + rowH / 2) + '"/>';
          var ncls = f.node && f.node[0] === i && f.node[1] === j ? "hot" : "";
          s += '<g class="g-cell ' + ncls + '"><rect x="' + nx + '" y="' + (y + 3) + '" width="36" height="' + (rowH - 6) + '"/><text x="' + (nx + 18) + '" y="' + (y + rowH / 2) + '">' + esc(k) + '</text></g><g class="g-cell"><rect x="' + (nx + 36) + '" y="' + (y + 3) + '" width="18" height="' + (rowH - 6) + '"/></g>';
          x = nx + 64;
        });
      } else {
        var v = tb.t[i];
        s += '<g class="g-cell ' + cls + '"><rect x="40" y="' + (y + 3) + '" width="70" height="' + (rowH - 6) + '"/><text x="75" y="' + (y + rowH / 2) + '">' + (v === 0 ? "" : v === -1 ? "−1" : esc(v)) + "</text></g>";
        if (v === -1) s += '<text class="g-lbl" x="150" y="' + (y + rowH / 2 + 4) + '">deleted</text>';
        if (i === f.hot && f.note) s += '<text class="g-tag" x="122" y="' + (y + rowH / 2 + 4) + '" style="text-anchor:start">' + esc(f.note) + "</text>";
      }
    }
    return s + "</svg>";
  }
  CL.drawHashTable = function (keys, N, method) {
    var tb = new Table(N, method || "linear", "formula");
    keys.forEach(function (k) { insertQuiet(tb, k); });
    return draw(tb, {});
  };
  function nextLoc(tb, loc, x, key) {
    if (tb.method === "linear") { loc++; if (loc > tb.N) loc = 1; return loc; }
    if (tb.method === "quad") { loc = loc + x + x * x; while (loc > tb.N) loc -= tb.N; return loc; }
    loc = loc + tb.step(key); while (loc > tb.N) loc -= tb.N; return loc;
  }
  function insertQuiet(tb, k) {
    var loc = tb.h(k);
    if (tb.method === "chain") { tb.c[loc].unshift(k); return true; }
    var x = 0, tries = 0;
    while (tb.t[loc] !== 0 && tb.t[loc] !== -1) { x++; tries++; if (tries > 3 * tb.N) return false; loc = nextLoc(tb, loc, x, k); }
    tb.t[loc] = k;
    return true;
  }

  CL.Labs.hash = function (host, preset) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Example", '<select id="hs-preset">' + PRESETS.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + "</option>"; }).join("") + "</select>"));
    ctl.appendChild(CL.opGroup("Method", '<select id="hs-method"><option value="linear">Linear probing</option><option value="quad">Quadratic probing (x + x²)</option><option value="double">Double hashing</option><option value="chain">Chaining</option></select>'));
    ctl.appendChild(CL.opGroup("N (locations 1..N)", '<input type="text" id="hs-n" value="12" style="width:4em" aria-label="Table size">'));
    var varG = CL.opGroup("Double hashing step k", '<select id="hs-var"><option value="formula">k = key % (N − 2) + 1</option><option value="slide">k = key % (N − 2), as in the slide example</option></select>');
    ctl.appendChild(varG);
    ctl.appendChild(CL.opGroup("Keys", '<input type="text" id="hs-keys" class="wide"><button type="button" class="btn primary" id="hs-all">Insert all</button>'));
    ctl.appendChild(CL.opGroup("One key", '<input type="text" id="hs-key" value="71" style="width:5em" aria-label="Key"><button type="button" class="btn" data-op="ins">Insert</button><button type="button" class="btn" data-op="find">Search</button><button type="button" class="btn" data-op="del">Delete</button>'));
    host.appendChild(ctl);
    var tb;
    var player = new CL.Player(host, {
      render: function (f) {
        player.stage.innerHTML = draw(f.tb, f);
        var load = f.tb.method === "chain" ? f.tb.c.reduce(function (a, l) { return a + l.length; }, 0) : f.tb.t.filter(function (v, i) { return i > 0 && v > 0; }).length;
        player.extra.innerHTML = '<div class="kv"><span>Hash function</span><b>h = key % ' + f.tb.N + " + 1</b>" + (f.tb.method === "double" ? "<span>Step</span><b>" + (f.tb.variant === "slide" ? "k = key % " + (f.tb.N - 2) : "k = key % " + (f.tb.N - 2) + " + 1") + "</b>" : "") + "<span>Keys stored</span><b>" + load + "</b><span>Load factor</span><b>" + (load / f.tb.N).toFixed(2) + "</b>" + (f.result !== undefined ? "<span>Result</span><b>" + esc(f.result) + "</b>" : "") + "</div>";
      }
    });
    function F(frames, text, line, extra) { frames.push(Object.assign({ text: text, line: line, tb: tb.clone() }, extra || {})); }
    player.lab = "hash";
    // ---- Your turn questions
    function wrapN(v) { var N = tb.N; return ((v - 1) % N + N) % N + 1; }
    function hAsk(k) {
      var N = tb.N, loc = tb.h(k);
      return CL.mkAsk("h(" + k + ") = " + k + " % " + N + " + 1. Which location is that?", loc, [k % N, wrapN(loc + 1), Math.floor(k / N) + 1, wrapN(loc - 1)], { view: { hot: null, done: null, node: null, result: undefined } }, "sort");
    }
    function stepAsk(k) {
      var N = tb.N, st = tb.step(k), alt = tb.variant === "slide" ? k % (N - 2) + 1 : k % (N - 2);
      return CL.mkAsk("Double hashing: what is the step size k for the key " + k + "? (" + (tb.variant === "slide" ? "k = key % " + (N - 2) : "k = key % (N − 2) + 1 = key % " + (N - 2) + " + 1") + ")", st, [alt, k % N + 1, k % (N - 1) + 1, st + 2], {}, "sort");
    }
    function nextAsk(old, loc, x, k, home, msg) {
      var N = tb.N, raw = tb.method === "linear" ? old + 1 : tb.method === "quad" ? old + x + x * x : old + tb.step(k), w = [];
      if (raw > N) w.push(raw);
      if (tb.method === "linear") w.push(wrapN(old + 2), wrapN(old - 1), 1);
      else if (tb.method === "quad") w.push(wrapN(old + x * x), wrapN(home + x + x * x), wrapN(old + 1), wrapN(old + 2 * x));
      else { var alt = tb.variant === "slide" ? k % (N - 2) + 1 : k % (N - 2); if (alt > 0) w.push(wrapN(old + alt)); w.push(wrapN(old + 1), wrapN(home + 2 * tb.step(k))); }
      w.push(wrapN(loc + 1), wrapN(loc - 1), wrapN(loc + 2));
      w = w.filter(function (v) { return v !== loc; });
      return CL.mkAsk(msg + (tb.method === "quad" ? " This is collision number x = " + x + "." : "") + " Which location is tried next?", loc, w, { view: { hot: old } }, "sort");
    }
    function readN() { var n = CL.parseNums(host.querySelector("#hs-n").value)[0]; return n >= 3 && n <= 40 ? n : 12; }
    function reset() {
      var m = host.querySelector("#hs-method").value;
      varG.hidden = m !== "double";
      tb = new Table(readN(), m, host.querySelector("#hs-var").value);
      player.setCode(m === "chain" ? "Chaining" : m === "quad" ? "Quadratic probing" : m === "double" ? "Linear probing with double hashing" : "Linear probing", CODE[m].code);
    }
    function insertFrames(frames, k) {
      var C = CODE[tb.method].L;
      var loc = tb.h(k);
      F(frames, "Insert " + k + ": h(" + k + ") = " + k + " % " + tb.N + " + 1 = <b>" + loc + "</b>.", C.start, { hot: loc, ask: hAsk(k) });
      if (tb.method === "chain") {
        F(frames, "Make a new node for " + k + ".", C.new, { hot: loc });
        var had = tb.c[loc].slice(), prevTb = frames[frames.length - 1].tb;
        tb.c[loc].unshift(k);
        F(frames, "Link it in at the top of the list at location " + loc + (tb.c[loc].length > 1 ? ". The keys already there move one place along the list." : "."), C.put, { hot: loc, node: [loc, 0],
          ask: had.length ? CL.askFixed("Location " + loc + " already holds the list " + had.join(" → ") + ". Where does the new node for " + k + " go?", ["At the top (front) of the list", "At the end of the list", "In sorted order"], 0, { view: { tb: prevTb, node: null } }) : null });
        return;
      }
      if (tb.method === "double") F(frames, "Its step size is k = " + k + " % " + (tb.N - 2) + (tb.variant === "slide" ? "" : " + 1") + " = <b>" + tb.step(k) + "</b>.", C.k, { hot: loc, ask: stepAsk(k) });
      var x = 0, probe = [], tries = 0, home = loc;
      while (tb.t[loc] !== 0 && tb.t[loc] !== -1) {
        x++; tries++;
        probe.push(loc);
        if (tries > 3 * tb.N) { F(frames, "Gave up after " + tries + " tries: no free location can be reached. " + (tb.method === "quad" ? "Quadratic probing does not always visit every location." : "The table is full."), C.loop, { probe: probe }); return; }
        var old = loc;
        loc = nextLoc(tb, loc, x, k);
        var how = tb.method === "linear" ? "try the next location" : tb.method === "quad" ? "this is collision x = " + x + ", so move forward x + x² = " + x + " + " + (x * x) + " = " + (x + x * x) : "move forward k = " + tb.step(k);
        F(frames, "Location " + old + " holds " + tb.t[old] + ": collision. " + how.charAt(0).toUpperCase() + how.slice(1) + (tb.method === "linear" && old === tb.N ? " (the table is circular, so after " + tb.N + " comes 1)" : "") + " → location <b>" + loc + "</b>.", C.next, { hot: loc, probe: probe.slice(),
          ask: tries <= tb.N ? nextAsk(old, loc, x, k, home, "Insert " + k + ": location " + old + " holds " + tb.t[old] + ", a collision.") : null });
      }
      tb.t[loc] = k;
      F(frames, "Location " + loc + " is " + (probe.length ? "free" : "empty") + ", so " + k + " goes there" + (probe.length ? " after " + probe.length + " collision" + (probe.length > 1 ? "s" : "") : "") + ".", C.put, { done: loc, probe: probe });
    }
    function all() {
      reset();
      var keys = CL.parseNums(host.querySelector("#hs-keys").value, 40).filter(function (k) { return k > 0; });
      var frames = [];
      F(frames, "An empty table with locations 1 to " + tb.N + ". " + (tb.method === "chain" ? "Each location holds the top of a linked list (NULL when empty)." : "0 means the location is empty."), 0);
      keys.forEach(function (k) { insertFrames(frames, k); });
      F(frames, "All keys inserted.", 0);
      player.load(frames);
    }
    function one(op) {
      var k = CL.parseNums(host.querySelector("#hs-key").value)[0];
      var frames = [];
      if (!(k > 0)) { F(frames, "Type a positive whole number as the key.", 0); return player.load(frames); }
      if (op === "ins") { player.setCode(player.codeH.textContent, CODE[tb.method].code); insertFrames(frames, k); return player.load(frames); }
      var chain = tb.method === "chain";
      var code = chain ? CODE.chainSearch : CODE.search, C = code.L;
      player.setCode(op === "del" ? "Delete = search, then mark the location" : "Search", code.code);
      var loc = tb.h(k);
      F(frames, (op === "del" ? "Delete " : "Search for ") + k + ": h(" + k + ") = " + k + " % " + tb.N + " + 1 = <b>" + loc + "</b>.", C.start, { hot: loc, ask: hAsk(k) });
      if (chain) {
        var list = tb.c[loc];
        for (var j = 0; j < list.length; j++) {
          if (list[j] === k) {
            F(frames, "Node " + (j + 1) + " of the list at location " + loc + " holds " + k + ". Found.", C.found, { hot: loc, node: [loc, j], result: "found at location " + loc });
            if (op === "del") { list.splice(j, 1); F(frames, "Unlink the node and delete it. The list stays connected.", 0, { hot: loc, result: "deleted" }); }
            return player.load(frames);
          }
          F(frames, "Node " + (j + 1) + " holds " + list[j] + ", not " + k + ". Move to the next node.", C.next, { hot: loc, node: [loc, j] });
        }
        F(frames, "Reached NULL at the end of the list: " + k + " is not in the table.", C.notfound, { hot: loc, result: "not found" });
        return player.load(frames);
      }
      var x = 0, tries = 0, probe = [];
      while (tb.t[loc] !== 0 && tries < tb.N) {
        if (tb.t[loc] === k) {
          F(frames, "Location " + loc + " holds " + k + ". Found.", C.found, { done: loc, probe: probe, result: "location " + loc });
          if (op === "del") {
            var tb0 = tb.clone();
            tb.t[loc] = -1;
            F(frames, "Mark location " + loc + " as deleted with −1 (not 0). If it became empty, a later search for a key that collided here would stop too early.", 0, { hot: loc, result: "deleted",
              ask: CL.askFixed("Found " + k + " at location " + loc + ". What is stored there to delete it?", ["−1, a deleted marker", "0, so the location is empty", "Nothing: move the next key back into it"], 0, { view: { tb: tb0, result: undefined }, wide: true }) });
          }
          return player.load(frames);
        }
        probe.push(loc);
        x++; tries++;
        var old = loc;
        loc = nextLoc(tb, loc, x, k);
        var sk = tb.t[old] === -1 ? CL.askFixed("Location " + old + " holds −1 (a deleted key). What does the search for " + k + " do?", ["Keep going: −1 does not stop a search", "Stop: " + k + " is not in the table"], 0, { view: { hot: old }, wide: true }) : nextAsk(old, loc, x, k, tb.h(k), "Search for " + k + ": location " + old + " holds " + tb.t[old] + ", not " + k + ".");
        F(frames, "Location " + old + " holds " + (tb.t[old] === -1 ? "−1 (deleted), which does not stop a search" : tb.t[old]) + ", not " + k + ". Try location " + loc + ".", C.next, { hot: loc, probe: probe.slice(), ask: sk });
      }
      F(frames, tries >= tb.N ? "Checked " + tb.N + " locations without finding it." : "Location " + loc + " is empty, so " + k + " cannot be further along: it is not in the table.", C.notfound, { hot: loc, probe: probe, result: "not found (-1)",
        ask: tries < tb.N ? CL.askFixed("Location " + loc + " is empty (0). What does the search for " + k + " do?", ["Stop: " + k + " is not in the table", "Keep going to the next location"], 0, { view: { result: undefined }, wide: true }) : null });
      player.load(frames);
    }
    var pre = host.querySelector("#hs-preset");
    function usePreset() {
      var p = PRESETS[+pre.value];
      host.querySelector("#hs-keys").value = p.keys;
      host.querySelector("#hs-method").value = p.method;
      if (p.method === "double") host.querySelector("#hs-var").value = "slide";
      all();
    }
    pre.addEventListener("change", usePreset);
    host.querySelector("#hs-method").addEventListener("change", all);
    host.querySelector("#hs-var").addEventListener("change", all);
    host.querySelector("#hs-n").addEventListener("change", all);
    host.querySelector("#hs-all").addEventListener("click", all);
    ctl.addEventListener("click", function (e) { var b = e.target.closest("button[data-op]"); if (b) one(b.getAttribute("data-op")); });
    if (preset && preset.keys) {
      host.querySelector("#hs-keys").value = preset.keys.join(" ");
      host.querySelector("#hs-method").value = preset.method || "linear";
      host.querySelector("#hs-n").value = preset.N || 12;
      host.querySelector("#hs-var").value = "formula";
      all();
      if (preset.op) { host.querySelector("#hs-key").value = preset.key; one(preset.op); }
      return player;
    }
    usePreset();
    return player;
  };

  CL.Diagrams.hash = function (args, body) {
    var a = args.split(/\s+/);
    var method = a[0] || "linear", N = +a[1] || 12;
    var lines = (body || "").split("\n");
    var keys = CL.parseNums(lines[0]);
    var cap = lines.slice(1).join(" ").trim();
    var d = document.createElement("div");
    d.innerHTML = CL.drawHashTable(keys, N, method);
    return { svg: d.firstChild, cap: cap };
  };
})(CL);
