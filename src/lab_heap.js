/* COMP 2611 Code Lab — Heap Lab: tree view and array view of the same max-heap (or min-heap). */
(function (CL) {
  "use strict";
  var esc = CL.esc;
  var T = CL.tagCode;

  var CODE_MAX = {
    heapify: T(
      "void maxHeapify (MaxHeap * heap, int i) {\n" +
      "\tint left = i * 2;                                   //@lr\n" +
      "\tint right = i * 2 + 1;\n" +
      "\tint largest = i;                                    //@start\n" +
      "\tif (left <= heap->size && heap->A[left] > heap->A[largest])    //@cl\n" +
      "\t\tlargest = left;\n" +
      "\tif (right <= heap->size && heap->A[right] > heap->A[largest])  //@cr\n" +
      "\t\tlargest = right;\n" +
      "\tif (largest != i) {                                 //@test\n" +
      "\t\tint temp = heap->A[i];                          //@swap\n" +
      "\t\theap->A[i] = heap->A[largest];\n" +
      "\t\theap->A[largest] = temp;\n" +
      "\t\tmaxHeapify (heap, largest);                     //@rec\n" +
      "\t}\n" +
      "}                                                       //@done\n" +
      "\n" +
      "void buildMaxHeap (MaxHeap * heap) {\n" +
      "\tfor (int i = heap->size / 2; i >= 1; i = i - 1)    //@build\n" +
      "\t\tmaxHeapify (heap, i);                           //@bcall\n" +
      "}"),
    extract: T(
      "int heapExtractMax (MaxHeap * heap) {\n" +
      "\tint toDelete = heap->A[1];                    //@save\n" +
      "\theap->A[1] = heap->A[heap->size];             //@move\n" +
      "\theap->size = heap->size - 1;                  //@shrink\n" +
      "\tmaxHeapify (heap, 1);                         //@fix\n" +
      "\treturn toDelete;                              //@ret\n" +
      "}"),
    del: T(
      "int deleteMaxHeap (MaxHeap * heap, int i) {\n" +
      "\tint toDelete = heap->A[i];                    //@save\n" +
      "\theap->A[i] = heap->A[heap->size];             //@move\n" +
      "\theap->size = heap->size - 1;                  //@shrink\n" +
      "\tmaxHeapify (heap, i);                         //@fix\n" +
      "\treturn toDelete;                              //@ret\n" +
      "}"),
    insert: T(
      "void insertMaxHeap (MaxHeap * heap, int n) {\n" +
      "\theap->size = heap->size + 1;          // one more, so add 1     //@grow\n" +
      "\theap->A[heap->size] = n;              // insert at end          //@put\n" +
      "\tint i = heap->size;\n" +
      "\twhile (i > 1 && heap->A[i/2] < heap->A[i]) {                   //@loop\n" +
      "\t\tint temp = heap->A[i/2];          // swap with parent       //@swap\n" +
      "\t\theap->A[i/2] = heap->A[i];\n" +
      "\t\theap->A[i] = temp;\n" +
      "\t\ti = i / 2;                        // i is now parent        //@up\n" +
      "\t}\n" +
      "}"),
    increase: T(
      "void increaseKeyMaxHeap (MaxHeap * heap, int i, int key) {\n" +
      "\theap->A[i] = key;                     // change key             //@put\n" +
      "\twhile (i > 1 && heap->A[i/2] < heap->A[i]) {                   //@loop\n" +
      "\t\tint temp = heap->A[i/2];          // swap with parent       //@swap\n" +
      "\t\theap->A[i/2] = heap->A[i];\n" +
      "\t\theap->A[i] = temp;\n" +
      "\t\ti = i / 2;                        // i is now parent        //@up\n" +
      "\t}\n" +
      "}"),
    sort: T(
      "void heapSort (int A[], int numElements) {\n" +
      "\tMaxHeap * heap = initMaxHeapFromArray (A, numElements);   //@init\n" +
      "\tbuildMaxHeap (heap);                                      //@build\n" +
      "\tfor (int i = heap->size; i >= 2; i--) {                   //@loop\n" +
      "\t\tint temp = heap->A[i];                                //@swap\n" +
      "\t\theap->A[i] = heap->A[1];\n" +
      "\t\theap->A[1] = temp;\n" +
      "\t\theap->size = heap->size - 1;                          //@shrink\n" +
      "\t\tmaxHeapify (heap, 1);                                 //@fix\n" +
      "\t}\n" +
      "\tfor (int i = 1; i <= numElements; i++)                    //@copy\n" +
      "\t\tA[i-1] = heap->A[i];\n" +
      "}")
  };
  function toMin(c) {
    return T(untag(c).replace(/Max/g, "Min").replace(/max/g, "min").replace(/largest/g, "smallest")
      .replace(/heap->A\[left\] > /g, "heap->A[left] < ").replace(/heap->A\[right\] > /g, "heap->A[right] < ").replace(/heap->A\[i\/2\] < heap->A\[i\]/g, "heap->A[i/2] > heap->A[i]").replace(/increaseKey/g, "decreaseKey"));
  }
  function untag(c) {
    var lines = c.code.split("\n"), byLine = {};
    Object.keys(c.L).forEach(function (k) { byLine[c.L[k]] = k; });
    return lines.map(function (l, i) { return byLine[i + 1] ? l + "  //@" + byLine[i + 1] : l; }).join("\n");
  }
  var CODE_MIN = {};
  Object.keys(CODE_MAX).forEach(function (k) { CODE_MIN[k] = toMin(CODE_MAX[k]); });
  CL.HEAP_CODE = CODE_MAX;

  CL.Labs.heap = function (host, preset) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Values (A[1], A[2], ...)", '<input type="text" id="hp-vals" class="wide" value="4 1 3 2 16 9 10 14 8 7">'));
    ctl.appendChild(CL.opGroup("Kind", '<select id="hp-kind"><option value="max">Max-heap</option><option value="min">Min-heap</option></select>'));
    ctl.appendChild(CL.opGroup("Start", '<button type="button" class="btn primary" data-op="build">Build heap</button><button type="button" class="btn" data-op="load">Load as is</button><button type="button" class="btn" data-op="sort">Heap sort</button>'));
    ctl.appendChild(CL.opGroup("Index i / value", '<input type="text" id="hp-i" value="1" aria-label="Index i" style="width:4em"><input type="text" id="hp-x" value="20" aria-label="Value" style="width:5em">'));
    ctl.appendChild(CL.opGroup("On the current heap", '<button type="button" class="btn" data-op="extract">Extract top</button><button type="button" class="btn" data-op="insert">Insert value</button><button type="button" class="btn" data-op="increase">Change key at i</button><button type="button" class="btn" data-op="del">Delete at i</button><button type="button" class="btn" data-op="heapify">Heapify at i</button>'));
    host.appendChild(ctl);
    var A = [null], size = 0, isMax = true;
    var player = new CL.Player(host, {
      render: function (f) {
        var hot = new Set(f.hot || []), on = new Set(f.on || []), done = f.sorted || 0;
        var cls = function (i) { return hot.has(i) ? "hot" : on.has(i) ? "on" : i > f.size && i <= f.size + done ? "done" : ""; };
        var tree = CL.drawHeapTree(f.A, f.size, { cls: cls, edgeCls: function (p, c) { return hot.has(p) && hot.has(c) ? "hot" : ""; } });
        var n = Math.max(f.size + done, f.size);
        var arr = CL.drawArray(f.A.map(function (v, i) { return i === 0 ? "" : v; }), { from: 0, to: Math.max(n, 1), cls: function (i) { return i === 0 ? "dim" : i > f.size && i > f.size + done ? "dim" : cls(i); }, tags: f.tags || {} });
        player.stage.innerHTML = '<div class="small muted" style="margin-bottom:4px">Tree view (the number beside each node is its index)</div>' + tree + '<div class="small muted" style="margin:10px 0 4px">Array view (index 0 is not used; size = ' + f.size + ")</div>" + arr;
        player.extra.innerHTML = '<div class="kv"><span>size</span><b>' + f.size + "</b><span>Parent of i</span><b>i / 2</b><span>Children of i</span><b>2i and 2i + 1</b>" + (f.result !== undefined ? "<span>Returned</span><b>" + esc(f.result) + "</b>" : "") + (f.out ? "<span>Sorted so far</span><b>" + esc(f.out) + "</b>" : "") + "</div>";
      }
    });
    function code() { return isMax ? CODE_MAX : CODE_MIN; }
    player.lab = "heap";
    function better(a, b) { return isMax ? a > b : a < b; }
    var word = function () { return isMax ? "largest" : "smallest"; };
    function F(frames, text, line, extra) { frames.push(Object.assign({ text: text, line: line, A: A.slice(), size: size }, extra || {})); }
    function heapify(frames, i, C, depthNote) {
      var l = 2 * i, r = 2 * i + 1, best = i;
      F(frames, "heapify at index " + i + " (value " + A[i] + "). Its children are at " + l + " and " + r + (l > size ? ", which are past the end of the heap, so it is a leaf." : "."), C.lr, { hot: [i], tags: tg(i, l, r) });
      if (l <= size && better(A[l], A[best])) best = l;
      if (r <= size && better(A[r], A[best])) best = r;
      var parts = ["A[" + i + "] = " + A[i]];
      if (l <= size) parts.push("A[" + l + "] = " + A[l]);
      if (r <= size) parts.push("A[" + r + "] = " + A[r]);
      if (l <= size) {
        var cand = [i, l].concat(r <= size ? [r] : []);
        var ties = cand.filter(function (x) { return A[x] === A[best]; }).length;
        var ask = ties === 1 ? CL.askFixed("heapify at index " + i + ": which of these holds the <b>" + word() + "</b> value? (Its index becomes <code>" + word() + "</code>.)",
          cand.map(function (x) { return "A[" + x + "] = " + A[x] + (x === i ? " (i)" : x === l ? " (left)" : " (right)"); }), cand.indexOf(best), { view: { on: [] } }) : null;
        F(frames, "Compare " + parts.join(", ") + ". The " + word() + " is at index " + best + "." + (ties > 1 ? " (When two values tie, the code keeps the first one it found, because it only switches on a strictly " + (isMax ? "larger" : "smaller") + " value.)" : ""), r <= size ? C.cr : C.cl, { hot: [i, l, r].filter(function (x) { return x <= size; }), on: [best], tags: tg(i, l, r), ask: ask });
      }
      if (best !== i) {
        var t = A[i]; A[i] = A[best]; A[best] = t;
        F(frames, "Swap A[" + i + "] and A[" + best + "]: " + A[i] + " moves up, " + A[best] + " moves down.", C.swap, { hot: [i, best] });
        F(frames, "The value that moved down may break the heap property below it, so call heapify on index " + best + ".", C.rec, { on: [best] });
        heapify(frames, best, C);
      } else {
        F(frames, "No swap needed: index " + i + " already holds the " + word() + " of the three. This call is finished.", C.test, { on: [i] });
      }
    }
    function tg(i, l, r) { var t = {}; t[i] = "i"; if (l <= size) t[l] = "L"; if (r <= size) t[r] = "R"; return t; }
    function readVals() { return CL.parseNums(host.querySelector("#hp-vals").value, 31); }
    function load(asIs) {
      isMax = host.querySelector("#hp-kind").value === "max";
      var v = readVals();
      A = [null].concat(v);
      size = v.length;
    }
    function opBuild() {
      load();
      var C = code().heapify.L, frames = [];
      player.setCode((isMax ? "buildMaxHeap" : "buildMinHeap") + " and " + (isMax ? "maxHeapify" : "minHeapify"), code().heapify.code);
      var h0 = Math.floor(size / 2);
      F(frames, "The values are in A[1.." + size + "] but are not yet a heap. Nodes " + (h0 + 1) + " to " + size + " are leaves, and a leaf is already a heap. So start at i = size / 2 = " + h0 + " and work back to 1.", C.build,
        size > 2 ? { ask: CL.mkAsk("There are " + size + " values. At which index does the buildHeap loop <b>start</b>?", "i = " + h0, ["i = 1", "i = " + size, "i = " + (h0 + 1), "i = " + (h0 - 1)], { line: C.build }, "sort") } : {});
      for (var i = Math.floor(size / 2); i >= 1; i--) {
        F(frames, "buildHeap loop: i = " + i + ".", C.bcall, { on: [i] });
        heapify(frames, i, C);
      }
      F(frames, "Done. Every parent is " + (isMax ? "at least as large as" : "no larger than") + " its children. Result: " + A.slice(1, size + 1).join(" "), 0, {});
      player.load(frames);
    }
    function opHeapify() {
      var i = +host.querySelector("#hp-i").value;
      var C = code().heapify.L, frames = [];
      player.setCode(isMax ? "maxHeapify" : "minHeapify", code().heapify.code);
      if (!(i >= 1 && i <= size)) { F(frames, "Type an index from 1 to " + size + ".", 0); return player.load(frames); }
      F(frames, "heapify only works if the subtrees below index " + i + " are already heaps. It then fixes index " + i + " by sinking its value.", C.start, { on: [i] });
      heapify(frames, i, C);
      player.load(frames);
    }
    function opExtract(atI) {
      var c = atI ? code().del : code().extract, C = c.L, frames = [], H = code().heapify.L;
      var i = atI ? +host.querySelector("#hp-i").value : 1;
      player.setCode(atI ? (isMax ? "deleteMaxHeap" : "deleteMinHeap") : (isMax ? "heapExtractMax" : "heapExtractMin"), c.code + "\n\n" + code().heapify.code.split("\n\nvoid build")[0]);
      if (size < 1) { F(frames, "The heap is empty. Check heap->size ≥ 1 before extracting.", C.save); return player.load(frames); }
      if (!(i >= 1 && i <= size)) { F(frames, "Type an index from 1 to " + size + ".", 0); return player.load(frames); }
      var top = A[i];
      F(frames, "Save the value to delete: A[" + i + "] = " + top + (i === 1 ? " (the " + word() + " value is always at the root)." : "."), C.save, { hot: [i] });
      var before = A.slice(), wrong = [];
      [2 * i, 2 * i + 1, size - 1, 1].forEach(function (x) { if (x >= 1 && x <= size && x !== size && x !== i && A[x] !== A[size]) wrong.push("A[" + x + "] = " + A[x]); });
      A[i] = A[size];
      F(frames, "Move the last value, A[" + size + "] = " + A[size] + ", into index " + i + ".", C.move, { hot: [i, size],
        ask: size > 2 && wrong.length ? CL.mkAsk((atI ? "deleteHeap" : "Extract") + ": A[" + i + "] = " + top + " is saved. Which value is moved into index " + i + "?", "A[" + size + "] = " + A[size], wrong, { view: { A: before, hot: [i] } }) : null });
      size--;
      F(frames, "Shrink the heap: size is now " + size + ". The old last slot is no longer part of the heap.", C.shrink, { hot: [i] });
      if (i <= size) {
        F(frames, "The moved value may be too " + (isMax ? "small" : "large") + " for index " + i + ", so heapify there.", C.fix, { on: [i] });
        var offset = c.code.split("\n").length + 2;
        var sub = [];
        heapify(sub, i, H);
        sub.forEach(function (f) { if (f.line) f.line += offset - 1; frames.push(f); });
        // note: the second code block starts after the first plus a blank line
      }
      F(frames, "Return " + top + ".", C.ret, { result: top });
      player.load(frames);
    }
    function bubble(frames, i, C) {
      var bq = function (i2) { var p2 = Math.floor(i2 / 2); return CL.askFixed("A[" + i2 + "] = " + A[i2] + " and its parent A[" + p2 + "] = " + A[p2] + ". What happens next?", ["Swap them: " + A[i2] + " moves up", "Stop: " + A[i2] + " stays at index " + i2], better(A[i2], A[p2]) ? 0 : 1, { view: { hot: [i2, p2], on: [] }, line: C.loop }); };
      while (i > 1 && better(A[i], A[Math.floor(i / 2)])) {
        var p = Math.floor(i / 2);
        F(frames, "A[" + i + "] = " + A[i] + " is " + (isMax ? "larger" : "smaller") + " than its parent A[" + p + "] = " + A[p] + ", so swap them.", C.swap, { hot: [i, p], ask: bq(i) });
        var t = A[i]; A[i] = A[p]; A[p] = t;
        i = p;
        F(frames, "The value moved up to index " + i + ". i is now its index.", C.up, { on: [i] });
      }
      if (i === 1) F(frames, "It reached the root (i = 1), so stop.", C.loop, { on: [i] });
      else F(frames, "A[" + i + "] = " + A[i] + " is not " + (isMax ? "larger" : "smaller") + " than its parent A[" + Math.floor(i / 2) + "] = " + A[Math.floor(i / 2)] + ", so stop. The heap property holds again.", C.loop, { on: [i, Math.floor(i / 2)], ask: bq(i) });
    }
    function opInsert() {
      var x = CL.parseNums(host.querySelector("#hp-x").value)[0];
      var C = code().insert.L, frames = [];
      player.setCode(isMax ? "insertMaxHeap" : "insertMinHeap", code().insert.code);
      if (x === undefined) { F(frames, "Type the value to insert in the value box.", 0); return player.load(frames); }
      size++;
      A[size] = x;
      F(frames, "Increase size to " + size + " and put " + x + " in the new last slot, A[" + size + "]. It is a leaf, but it may be " + (isMax ? "larger" : "smaller") + " than its parent.", C.put, { hot: [size] });
      bubble(frames, size, C);
      player.load(frames);
    }
    function opIncrease() {
      var i = +host.querySelector("#hp-i").value, x = CL.parseNums(host.querySelector("#hp-x").value)[0];
      var C = code().increase.L, frames = [];
      player.setCode(isMax ? "increaseKeyMaxHeap" : "decreaseKeyMinHeap", code().increase.code);
      if (!(i >= 1 && i <= size) || x === undefined) { F(frames, "Type an index from 1 to " + size + " and a new value.", 0); return player.load(frames); }
      if (isMax ? x < A[i] : x > A[i]) {
        F(frames, "The new key " + x + " is " + (isMax ? "smaller" : "larger") + " than the current " + A[i] + ". This function only " + (isMax ? "increases" : "decreases") + " a key, because then the value can only need to move up.", C.put, { hot: [i] });
        return player.load(frames);
      }
      A[i] = x;
      F(frames, "Change A[" + i + "] to " + x + ". The subtree below is still fine, but the value may now be too " + (isMax ? "large" : "small") + " for its parent.", C.put, { hot: [i] });
      bubble(frames, i, C);
      player.load(frames);
    }
    function opSort() {
      load();
      var c = code().sort, C = c.L, frames = [], H = code().heapify.L;
      player.setCode("heapSort (version 2)", c.code + "\n\n" + code().heapify.code);
      var offset = c.code.split("\n").length + 1;
      function sub(fn) { var s = []; fn(s); s.forEach(function (f) { if (f.line) f.line += offset; frames.push(f); }); }
      var n = size;
      F(frames, "Copy the " + n + " values into heap->A[1.." + n + "].", C.init, {});
      sub(function (s) { for (var i = Math.floor(size / 2); i >= 1; i--) heapify(s, i, H); });
      F(frames, "buildHeap is done: the " + word() + " value is at the root.", C.build, {});
      var sorted = 0;
      for (var i = size; i >= 2; i--) {
        var t = A[i]; A[i] = A[1]; A[1] = t;
        F(frames, "Swap the root (" + A[i] + ") with A[" + i + "]. " + A[i] + " is now in its final place.", C.swap, { hot: [1, i], sorted: sorted });
        size--; sorted++;
        F(frames, "Shrink the heap to size " + size + ". Index " + (size + 1) + " is now outside the heap and stays sorted.", C.shrink, { sorted: sorted });
        sub(function (s) { heapify(s, 1, H); s.forEach(function (f) { f.sorted = sorted; }); });
      }
      sorted++;
      var res = A.slice(1, n + 1);
      F(frames, "Finished. The array is sorted in " + (isMax ? "ascending" : "descending") + " order: " + res.join(" "), C.copy, { sorted: sorted, size: 0, out: res.join(" ") });
      size = n;
      player.load(frames);
    }
    ctl.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-op]");
      if (!b) return;
      var op = b.getAttribute("data-op");
      if (op === "build") opBuild();
      if (op === "load") {
        load();
        var frames = [];
        player.setCode("", "");
        F(frames, "Loaded the values as they are. They may not form a heap yet: use Heapify at i, or Build heap.", 0);
        player.load(frames);
      }
      if (op === "sort") opSort();
      if (op === "extract") opExtract(false);
      if (op === "del") opExtract(true);
      if (op === "insert") opInsert();
      if (op === "increase") opIncrease();
      if (op === "heapify") opHeapify();
    });
    host.querySelector("#hp-kind").addEventListener("change", opBuild);
    if (preset && preset.vals) {
      host.querySelector("#hp-vals").value = preset.vals.join(" ");
      host.querySelector("#hp-kind").value = preset.kind || "max";
      if (preset.i) host.querySelector("#hp-i").value = preset.i;
      if (preset.x !== undefined) host.querySelector("#hp-x").value = preset.x;
      var op = preset.op || "build";
      if (op === "build") opBuild();
      else if (op === "sort") opSort();
      else {
        load();
        if (op === "extract") opExtract(false);
        if (op === "del") opExtract(true);
        if (op === "insert") opInsert();
        if (op === "increase") opIncrease();
        if (op === "heapify") opHeapify();
      }
      return player;
    }
    opBuild();
    player.go(player.frames.length - 1);
    player.go(0);
    return player;
  };

  CL.Diagrams.heap = function (args, body) {
    var v = CL.parseNums(args);
    var A = [null].concat(v);
    var html = '<div style="display:grid;gap:8px;justify-items:center">' + CL.drawHeapTree(A, v.length, {}) + CL.drawArray(A.map(function (x, i) { return i === 0 ? "" : x; }), { from: 0, cls: function (i) { return i === 0 ? "dim" : ""; } }) + "</div>";
    var d = document.createElement("div");
    d.innerHTML = html;
    return { svg: d.firstChild, cap: body };
  };
})(CL);
