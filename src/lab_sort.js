/* COMP 2611 Code Lab — Sorting Lab: selection, bubble, insertion, merge, quick and heap sort on your own array. */
(function (CL) {
  "use strict";
  var esc = CL.esc, T = CL.tagCode;

  var CODE = {
    selection: T(
      "void selectionSort (int A[], int n) {\n" +
      "\tfor (int i = 0; i < n - 1; i++) {                 //@outer\n" +
      "\t\tint smallest = i;                             //@init\n" +
      "\t\tfor (int j = i + 1; j < n; j++)               //@inner\n" +
      "\t\t\tif (A[j] < A[smallest])                   //@cmp\n" +
      "\t\t\t\tsmallest = j;                         //@new\n" +
      "\t\tint temp = A[i];                              //@swap\n" +
      "\t\tA[i] = A[smallest];\n" +
      "\t\tA[smallest] = temp;\n" +
      "\t}\n" +
      "}"),
    bubble: T(
      "void bubbleSort (int A[], int n) {\n" +
      "\tfor (int i = 0; i < n - 1; i++)                   //@outer\n" +
      "\t\tfor (int j = 0; j < n - 1 - i; j++)           //@inner\n" +
      "\t\t\tif (A[j] > A[j + 1]) {                    //@cmp\n" +
      "\t\t\t\tint temp = A[j];                      //@swap\n" +
      "\t\t\t\tA[j] = A[j + 1];\n" +
      "\t\t\t\tA[j + 1] = temp;\n" +
      "\t\t\t}\n" +
      "}"),
    insertion: T(
      "void insertionSort (int A[], int n) {\n" +
      "\tfor (int i = 1; i < n; i++) {                     //@outer\n" +
      "\t\tint key = A[i];                               //@key\n" +
      "\t\tint j = i - 1;\n" +
      "\t\twhile (j >= 0 && A[j] > key) {                //@cmp\n" +
      "\t\t\tA[j + 1] = A[j];                          //@shift\n" +
      "\t\t\tj = j - 1;\n" +
      "\t\t}\n" +
      "\t\tA[j + 1] = key;                               //@place\n" +
      "\t}\n" +
      "}"),
    merge: T(
      "void mergeSort (int A[], int start, int end) {\n" +
      "\tint mid;\n" +
      "\tif (start < end) {                                //@test\n" +
      "\t\tmid = (start + end) / 2;                      //@mid\n" +
      "\t\tmergeSort (A, start, mid);                    //@left\n" +
      "\t\tmergeSort (A, mid + 1, end);                  //@right\n" +
      "\t\tmergeArray (A, start, mid, end);              //@merge\n" +
      "\t}\n" +
      "}\n\n" +
      "void mergeArray (int A[], int p, int q, int r) {\n" +
      "\tint n1 = q - p + 1, n2 = r - q;\n" +
      "\tint * L = new int[n1];                            // copy of A[p..q]\n" +
      "\tint * R = new int[n2];                            // copy of A[q+1..r]\n" +
      "\tfor (int i = 0; i < n1; i++) L[i] = A[p + i];\n" +
      "\tfor (int j = 0; j < n2; j++) R[j] = A[q + 1 + j];   //@copy\n" +
      "\tint i = 0, j = 0, k = p;\n" +
      "\twhile (i < n1 && j < n2) {                        //@mloop\n" +
      "\t\tif (L[i] <= R[j]) A[k++] = L[i++];            //@takeL\n" +
      "\t\telse A[k++] = R[j++];                         //@takeR\n" +
      "\t}\n" +
      "\twhile (i < n1) A[k++] = L[i++];                  //@restL\n" +
      "\twhile (j < n2) A[k++] = R[j++];                  //@restR\n" +
      "\tdelete [] L;\n" +
      "\tdelete [] R;\n" +
      "}"),
    quick: T(
      "void quickSort (int A[], int p, int r) {\n" +
      "\tint q;\n" +
      "\tif (p < r) {                                      //@test\n" +
      "\t\tq = partition (A, p, r);                      //@part\n" +
      "\t\tquickSort (A, p, q - 1);                      //@left\n" +
      "\t\tquickSort (A, q + 1, r);                      //@right\n" +
      "\t}\n" +
      "}\n\n" +
      "int partition (int A[], int p, int r) {\n" +
      "\tint x = A[r];                                     // the pivot   //@pivot\n" +
      "\tint i = p - 1;\n" +
      "\tfor (int j = p; j <= r - 1; j++) {                //@loop\n" +
      "\t\tif (A[j] <= x) {                              //@cmp\n" +
      "\t\t\ti = i + 1;                                //@inc\n" +
      "\t\t\tint temp = A[i];  A[i] = A[j];  A[j] = temp;   //@swap\n" +
      "\t\t}\n" +
      "\t}\n" +
      "\tint temp = A[i + 1];  A[i + 1] = A[r];  A[r] = temp;   //@final\n" +
      "\treturn i + 1;                                     //@ret\n" +
      "}")
  };
  CL.SORT_CODE = CODE;
  var PRESETS = [
    { name: "Lecture 20 merge sort example", v: "38 27 43 3 9 82 10" },
    { name: "Lecture 20: ten values", v: "56 34 38 71 28 10 91 18 22 75" },
    { name: "Partition example 1", v: "30 65 10 75 55 90 60" },
    { name: "Partition example 2", v: "25 90 30 5 60 70 45" },
    { name: "Heap example", v: "4 1 3 2 16 9 10 14 8 7" },
    { name: "Reverse order (worst case)", v: "9 8 7 6 5 4 3 2 1" },
    { name: "Already sorted", v: "1 2 3 4 5 6 7 8 9" }
  ];
  var BIG = {
    selection: "O(n²) always (it compares every pair, even if sorted).",
    bubble: "O(n²) worst and average case.",
    insertion: "O(n²) worst case, but only O(n) if the array is already sorted.",
    merge: "O(n log n) in every case. Needs extra space for L and R.",
    quick: "O(n log n) on average, O(n²) in the worst case (for example, already sorted input with the last value as pivot).",
    heap: "O(n log n) in every case."
  };

  CL.Labs.sort = function (host, preset) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Algorithm", '<select id="so-alg"><option value="selection">Selection sort</option><option value="bubble">Bubble sort</option><option value="insertion">Insertion sort</option><option value="merge">Merge sort</option><option value="quick">Quick sort</option><option value="heap">Heap sort</option></select>'));
    ctl.appendChild(CL.opGroup("Array", '<select id="so-pre">' + PRESETS.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + "</option>"; }).join("") + '</select><input type="text" id="so-v" class="wide" aria-label="Array values">'));
    var qg = CL.opGroup("Quick sort", '<label class="small"><input type="checkbox" id="so-one"> Only one call to partition (A, 0, n − 1)</label>');
    ctl.appendChild(qg);
    ctl.appendChild(CL.opGroup("", '<button type="button" class="btn primary" id="so-go">Sort</button><button type="button" class="btn" id="so-rand">Random values</button>'));
    host.appendChild(ctl);
    var alg;
    // ---- Your turn helpers
    function sw2(a, i, j) { var t = a[i]; a[i] = a[j]; a[j] = t; return a; }
    function arrAsk(q, right, wrongs, extra) {
      // fall back on "one wrong swap" arrays when the usual mistakes give the same result
      var n2 = right.length, fb = n2 > 1 ? [sw2(right.slice(), 0, 1), sw2(right.slice(), n2 - 2, n2 - 1), sw2(right.slice(), 0, n2 - 1)] : [];
      var ask = CL.mkAsk(q, right.join(" "), wrongs.concat(fb).filter(Boolean).map(function (w) { return w.join(" "); }), Object.assign({ wide: true }, extra || {}));
      return ask.options.length > 1 ? ask : null;
    }
    function bubblePass(a0, last) { var a = a0.slice(); for (var j = 0; j < last; j++) if (a[j] > a[j + 1]) sw2(a, j, j + 1); return a; }
    function partitionOf(a0, p, r, mode) {
      var a = a0.slice(), x = a[r], i = p - 1;
      for (var j = p; j <= r - 1; j++) if (a[j] <= x) { i++; sw2(a, i, j); }
      if (mode === "noswap") return a;
      if (mode === "ati") { if (i >= p) sw2(a, i, r); return a; }
      sw2(a, i + 1, r);
      return a;
    }
    function heapBuilt(vals, byInsert) {
      var H = [null], n = vals.length;
      function down(H, i, size) { for (;;) { var l = 2 * i, r = l + 1, b = i; if (l <= size && H[l] > H[b]) b = l; if (r <= size && H[r] > H[b]) b = r; if (b === i) return; sw2(H, i, b); i = b; } }
      if (byInsert) { vals.forEach(function (v) { H.push(v); var i = H.length - 1; while (i > 1 && H[i >> 1] < H[i]) { sw2(H, i, i >> 1); i >>= 1; } }); return H.slice(1); }
      H = [null].concat(vals);
      for (var i = Math.floor(n / 2); i >= 1; i--) down(H, i, n);
      return H.slice(1);
    }
    var player = new CL.Player(host, {
      render: function (f) {
        var A = f.A, hot = new Set(f.hot || []), on = new Set(f.on || []), done = new Set(f.done || []), dim = f.range;
        var html = CL.drawArray(A, {
          tags: f.tags || {}, cw: 42,
          cls: function (i) { return hot.has(i) ? "hot" : on.has(i) ? "on" : done.has(i) ? "done" : dim && (i < dim[0] || i > dim[1]) ? "dim" : ""; }
        });
        if (f.tree) html += '<div class="small muted" style="margin:12px 0 4px">Split and merge picture (like the slides): the highlighted box is the current call</div>' + f.tree;
        if (f.heap) html += '<div class="small muted" style="margin:12px 0 4px">The same array as a heap (indexes 1 to size)</div>' + f.heap;
        player.stage.innerHTML = html;
        player.extra.innerHTML = '<div class="kv"><span>Comparisons</span><b>' + f.cmp + "</b><span>" + (alg === "merge" ? "Writes" : alg === "insertion" ? "Shifts" : "Swaps") + "</span><b>" + f.sw + "</b><span>Big-O</span><span>" + esc(BIG[alg]) + "</span>" + (f.L ? "<span>L</span><b>" + f.L.join(" ") + "</b><span>R</span><b>" + f.R.join(" ") + "</b>" : "") + "</div>";
      }
    });
    player.lab = "sort";
    function run() {
      alg = host.querySelector("#so-alg").value;
      qg.hidden = alg !== "quick";
      var A = CL.parseNums(host.querySelector("#so-v").value, 16);
      if (!A.length) A = [5, 2, 4, 6, 1, 3];
      var frames = [], cmp = 0, sw = 0, n = A.length;
      function F(text, line, extra) { frames.push(Object.assign({ text: text, line: line, A: A.slice(), cmp: cmp, sw: sw }, extra || {})); }
      function swap(i, j) { var t = A[i]; A[i] = A[j]; A[j] = t; sw++; }
      var C, sortedFrom;
      if (alg === "selection") {
        C = CODE.selection.L;
        player.setCode("Selection sort", CODE.selection.code);
        F("Selection sort: on each pass, find the smallest value in the unsorted part and swap it to the front.", C.outer);
        var done = [];
        for (var i = 0; i < n - 1; i++) {
          var sm = i;
          var mi = i, fs = -1;
          for (var z = i + 1; z < n; z++) { if (A[z] < A[mi]) mi = z; if (fs < 0 && A[z] < A[i]) fs = z; }
          var ins = A.slice(), mv = ins.splice(mi, 1)[0];
          ins.splice(i, 0, mv);
          var selAsk = arrAsk("Selection sort, pass " + (i + 1) + ": what will the array be after this pass?", sw2(A.slice(), i, mi), [fs >= 0 ? sw2(A.slice(), i, fs) : null, ins, bubblePass(A, n - 1), sw2(A.slice(), i, n - 1), A.slice()]);
          F("Pass " + (i + 1) + ": assume A[" + i + "] = " + A[i] + " is the smallest of A[" + i + ".." + (n - 1) + "].", C.init, { hot: [i], done: done.slice(), tags: { [i]: "i" }, ask: selAsk });
          for (var j = i + 1; j < n; j++) {
            cmp++;
            var t = {}; t[i] = "i"; t[j] = "j"; t[sm] = (t[sm] ? t[sm] + "," : "") + "min";
            if (A[j] < A[sm]) { sm = j; F("A[" + j + "] = " + A[j] + " is smaller than the smallest so far, so smallest = " + j + ".", C.new, { hot: [j], on: [sm], done: done.slice(), tags: t }); }
            else F("Compare A[" + j + "] = " + A[j] + " with the smallest so far, " + A[sm] + ": no change.", C.cmp, { hot: [j], on: [sm], done: done.slice(), tags: t });
          }
          swap(i, sm);
          done.push(i);
          F("Swap A[" + i + "] and A[" + sm + "]. Now A[0.." + i + "] is sorted and final.", C.swap, { on: [i, sm], done: done.slice() });
        }
        done.push(n - 1);
        F("The last value is already in place. Sorted: " + A.join(" "), C.outer, { done: done.slice() });
      } else if (alg === "bubble") {
        C = CODE.bubble.L;
        player.setCode("Bubble sort", CODE.bubble.code);
        F("Bubble sort: compare neighbours and swap them if they are out of order. Each pass bubbles the largest remaining value to the end.", C.outer);
        var dn = [];
        for (var p = 0; p < n - 1; p++) {
          var startA = A.slice(), at0 = frames.length;
          for (var q = 0; q < n - 1 - p; q++) {
            cmp++;
            if (A[q] > A[q + 1]) { swap(q, q + 1); F("Pass " + (p + 1) + ": A[" + q + "] &gt; A[" + (q + 1) + "], so swap them.", C.swap, { hot: [q, q + 1], done: dn.slice() }); }
            else F("Pass " + (p + 1) + ": A[" + q + "] = " + A[q] + " and A[" + (q + 1) + "] = " + A[q + 1] + " are in order.", C.cmp, { on: [q, q + 1], done: dn.slice() });
          }
          var oneSwap = startA.slice();
          for (var z2 = 0; z2 < n - 1 - p; z2++) if (oneSwap[z2] > oneSwap[z2 + 1]) { sw2(oneSwap, z2, z2 + 1); break; }
          var back = startA.slice();
          for (var z3 = n - 2; z3 >= 0; z3--) if (back[z3] > back[z3 + 1]) sw2(back, z3, z3 + 1);
          var srt = startA.slice().sort(function (a, b) { return a - b; });
          var bAsk = arrAsk("Bubble sort, pass " + (p + 1) + ": what will the array be at the end of this pass?", A, [oneSwap, back, srt, startA]);
          if (bAsk && frames[at0]) { bAsk.view = { A: startA, hot: [], on: [] }; bAsk.line = C.outer; frames[at0].ask = bAsk; }
          dn.push(n - 1 - p);
          F("End of pass " + (p + 1) + ": " + A[n - 1 - p] + " is in its final place.", C.outer, { done: dn.slice() });
        }
        dn.push(0);
        F("Sorted: " + A.join(" "), C.outer, { done: dn.slice() });
      } else if (alg === "insertion") {
        C = CODE.insertion.L;
        player.setCode("Insertion sort", CODE.insertion.code);
        F("Insertion sort: A[0] on its own is sorted. Take each next value and slide it left into its place in the sorted part.", C.outer, { done: [0] });
        for (var a = 1; a < n; a++) {
          var key = A[a], b = a - 1;
          var sortedPart = []; for (var s = 0; s < a; s++) sortedPart.push(s);
          var tgt = a; while (tgt > 0 && A[tgt - 1] > key) tgt--;
          var expI = A.slice(); expI.splice(a, 1); expI.splice(tgt, 0, key);
          var front = A.slice(); front.splice(a, 1); front.unshift(key);
          var iAsk = arrAsk("Insertion sort, pass " + a + " (key = " + key + "): what will the array be after this pass?", expI, [sw2(A.slice(), a, a - 1), sw2(A.slice(), a, tgt), front, A.slice()]);
          F("Pass " + a + ": key = A[" + a + "] = " + key + ". Insert it into the sorted part A[0.." + (a - 1) + "].", C.key, { hot: [a], done: sortedPart, tags: { [a]: "key" }, ask: iAsk });
          while (b >= 0) {
            cmp++;
            if (A[b] > key) {
              A[b + 1] = A[b]; sw++;
              F("A[" + b + "] = " + A[b] + " &gt; " + key + ", so shift it one place right.", C.shift, { hot: [b + 1], on: [b], done: sortedPart });
              b--;
            } else { F("A[" + b + "] = " + A[b] + " is not bigger than " + key + ", so stop.", C.cmp, { on: [b], done: sortedPart }); break; }
          }
          A[b + 1] = key;
          sortedPart.push(a);
          F("Put the key " + key + " in A[" + (b + 1) + "]. A[0.." + a + "] is now sorted.", C.place, { hot: [b + 1], done: sortedPart });
        }
        F("Sorted: " + A.join(" "), C.outer, { done: A.map(function (_, i) { return i; }) });
      } else if (alg === "merge") {
        C = CODE.merge.L;
        player.setCode("Merge sort", CODE.merge.code);
        var nodes = [];
        (function build(st, en, d) { var nd = { s: st, e: en, d: d, vals: A.slice(st, en + 1) }; nodes.push(nd); if (st < en) { var m = Math.floor((st + en) / 2); build(st, m, d + 1); build(m + 1, en, d + 1); } })(0, n - 1, 0);
        var depth = 0; nodes.forEach(function (x) { depth = Math.max(depth, x.d); });
        function tree(active, phase) {
          var cw = 26, gapX = 10, rowH = 46;
          var W = n * cw + (n) * gapX + 20, H = (depth + 1) * rowH + 10;
          var svg = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">';
          nodes.forEach(function (nd) {
            var x0 = 10 + nd.s * (cw + gapX) + (nd.e - nd.s) * 0, y = 6 + nd.d * rowH;
            var isA = active && nd.s === active[0] && nd.e === active[1];
            nd.vals.forEach(function (v, k) {
              var x = x0 + k * cw + (nd.s + k - nd.s) * 0;
              svg += '<g class="g-cell ' + (isA ? (phase === "merge" ? "done" : "hot") : "") + '"><rect x="' + x + '" y="' + y + '" width="' + cw + '" height="26"/><text x="' + (x + cw / 2) + '" y="' + (y + 13) + '" style="font-size:11.5px">' + v + "</text></g>";
            });
          });
          return svg + "</svg>";
        }
        function setVals(st, en) { nodes.forEach(function (nd) { if (nd.s === st && nd.e === en) nd.vals = A.slice(st, en + 1); }); }
        F("Merge sort splits the array in half again and again until each piece has one value, then merges the pieces back in sorted order.", C.test, { tree: tree(null) });
        (function ms(st, en) {
          if (st >= en) { F("mergeSort (A, " + st + ", " + en + "): start ≥ end, so this piece has one value and is already sorted.", C.test, { range: [st, en], tree: tree([st, en]) }); return; }
          var m = Math.floor((st + en) / 2);
          var midAsk = CL.mkAsk("mergeSort (A, " + st + ", " + en + "): what is mid = (start + end) / 2?", m, [Math.ceil((st + en) / 2), Math.floor((en - st) / 2), st + en, m - 1], { line: C.test }, "sort");
          F("mergeSort (A, " + st + ", " + en + "): mid = (" + st + " + " + en + ") / 2 = " + m + ". Sort A[" + st + ".." + m + "], then A[" + (m + 1) + ".." + en + "].", C.mid, { range: [st, en], tree: tree([st, en]), ask: midAsk.options.length > 1 ? midAsk : null });
          ms(st, m);
          ms(m + 1, en);
          var L = A.slice(st, m + 1), R = A.slice(m + 1, en + 1), i = 0, j = 0, k = st;
          F("mergeArray (A, " + st + ", " + m + ", " + en + "): copy the two sorted halves into L and R, then merge them back.", C.copy, { range: [st, en], tree: tree([st, en]), L: L, R: R });
          while (i < L.length && j < R.length) {
            cmp++; sw++;
            var takeL = L[i] <= R[j], before = A.slice();
            var mAsk = CL.mkAsk("Merging. Still to copy, L: <b>" + L.slice(i).join(" ") + "</b> and R: <b>" + R.slice(j).join(" ") + "</b>. Which value is copied into A[" + k + "]?", takeL ? L[i] : R[j], [takeL ? R[j] : L[i], L[i + 1], R[j + 1]], { view: { A: before, hot: [k] } }, "sort");
            if (mAsk.options.length < 2) mAsk = null;
            if (L[i] <= R[j]) { A[k] = L[i]; F("L[" + i + "] = " + L[i] + " ≤ R[" + j + "] = " + R[j] + ": copy " + L[i] + " into A[" + k + "].", C.takeL, { hot: [k], range: [st, en], tree: tree([st, en]), L: L, R: R, ask: mAsk }); i++; }
            else { A[k] = R[j]; F("R[" + j + "] = " + R[j] + " &lt; L[" + i + "] = " + L[i] + ": copy " + R[j] + " into A[" + k + "].", C.takeR, { hot: [k], range: [st, en], tree: tree([st, en]), L: L, R: R, ask: mAsk }); j++; }
            k++;
          }
          while (i < L.length) { A[k] = L[i]; sw++; F("Copy the rest of L: " + L[i] + " into A[" + k + "].", C.restL, { hot: [k], range: [st, en], tree: tree([st, en]), L: L, R: R }); i++; k++; }
          while (j < R.length) { A[k] = R[j]; sw++; F("Copy the rest of R: " + R[j] + " into A[" + k + "].", C.restR, { hot: [k], range: [st, en], tree: tree([st, en]), L: L, R: R }); j++; k++; }
          setVals(st, en);
          F("A[" + st + ".." + en + "] is now sorted: " + A.slice(st, en + 1).join(" "), C.merge, { on: range(st, en), range: [st, en], tree: tree([st, en], "merge") });
        })(0, n - 1);
        F("Sorted: " + A.join(" "), 0, { done: range(0, n - 1), tree: tree(null) });
      } else if (alg === "quick") {
        C = CODE.quick.L;
        var one = host.querySelector("#so-one").checked;
        player.setCode(one ? "partition" : "Quick sort", CODE.quick.code);
        var fixed = [];
        var part = function (p, r) {
          var x = A[r], i = p - 1;
          var sub = function (a) { return a.slice(p, r + 1); };
          var le = sub(A).slice(0, -1).filter(function (v) { return v <= x; }), gt = sub(A).slice(0, -1).filter(function (v) { return v > x; });
          var pAsk = arrAsk("partition (A, " + p + ", " + r + ") with pivot x = A[" + r + "] = " + x + ": what will A[" + p + ".." + r + "] be afterwards?", sub(partitionOf(A, p, r)),
            [le.concat([x], gt), sub(partitionOf(A, p, r, "noswap")), sub(partitionOf(A, p, r, "ati")), sub(A).sort(function (a, b) { return a - b; }), sub(A)]);
          F("partition (A, " + p + ", " + r + "): the pivot is x = A[" + r + "] = " + x + ". i starts at p − 1 = " + i + ".", C.pivot, { hot: [r], range: [p, r], done: fixed.slice(), tags: tags(p, r, i, p, r), ask: pAsk });
          for (var j = p; j <= r - 1; j++) {
            cmp++;
            if (A[j] <= x) {
              i++;
              if (i !== j) { swap(i, j); }
              F("A[" + j + "] = " + A[i] + " ≤ " + x + ": increase i to " + i + (i !== j ? " and swap A[" + i + "] with A[" + j + "]" : " (A[i] and A[j] are the same element, so nothing moves)") + ".", C.swap, { hot: [i, j], range: [p, r], done: fixed.slice(), tags: tags(p, r, i, j, r) });
            } else F("A[" + j + "] = " + A[j] + " &gt; " + x + ": i stays at " + i + ".", C.cmp, { on: [j], range: [p, r], done: fixed.slice(), tags: tags(p, r, i, j, r) });
          }
          swap(i + 1, r);
          fixed.push(i + 1);
          F("Swap A[i + 1] = A[" + (i + 1) + "] with the pivot A[" + r + "]. The pivot " + x + " is now in its final place, q = " + (i + 1) + ": everything left of it is ≤ " + x + ", everything right of it is larger.", C.final, { hot: [i + 1], range: [p, r], done: fixed.slice(), tags: { [i + 1]: "q" } });
          return i + 1;
        };
        if (one) {
          part(0, n - 1);
          F("After one partition: " + A.join(" "), C.ret, { done: fixed.slice() });
        } else {
          (function qs(p, r) {
            if (p < r) {
              F("quickSort (A, " + p + ", " + r + ").", C.part, { range: [p, r], done: fixed.slice() });
              var q2 = part(p, r);
              qs(p, q2 - 1);
              qs(q2 + 1, r);
            } else if (p === r) { fixed.push(p); F("quickSort (A, " + p + ", " + r + "): one value, already in place.", C.test, { range: [p, r], done: fixed.slice() }); }
          })(0, n - 1);
          F("Sorted: " + A.join(" "), 0, { done: range(0, n - 1) });
        }
      } else {
        var hc = CL.HEAP_CODE.sort;
        player.setCode("Heap sort (version 2)", hc.code);
        C = hc.L;
        var H = [null].concat(A), size = n;
        function sync() { A = H.slice(1); }
        function hframe(text, line, extra) { sync(); frames.push(Object.assign({ text: text, line: line, A: A.slice(), cmp: cmp, sw: sw, heap: CL.drawHeapTree(H, size, { cls: function (i) { return extra && extra.hh && extra.hh.indexOf(i) >= 0 ? "hot" : ""; } }) }, extra || {})); }
        function heapify(i) {
          var l = 2 * i, r = 2 * i + 1, big = i;
          if (l <= size) { cmp++; if (H[l] > H[big]) big = l; }
          if (r <= size) { cmp++; if (H[r] > H[big]) big = r; }
          if (big !== i) { var t = H[i]; H[i] = H[big]; H[big] = t; sw++; hframe("maxHeapify: swap heap index " + i + " with " + big + ".", C.fix, { hot: [i - 1, big - 1], hh: [i, big], done: range(size, n - 1) }); heapify(big); }
        }
        var hAsk = arrAsk("Heap sort starts with buildMaxHeap. What will the array be after it?", heapBuilt(A, false), [heapBuilt(A, true), A.slice().sort(function (a, b) { return b - a; }), A.slice(), A.slice().sort(function (a, b) { return a - b; })]);
        hframe("Copy the values into a heap (indexes 1 to " + n + ").", C.init, { ask: hAsk });
        for (var hi = Math.floor(size / 2); hi >= 1; hi--) heapify(hi);
        hframe("buildMaxHeap is done: the largest value, " + H[1] + ", is at the root.", C.build, { hh: [1] });
        for (var e = size; e >= 2; e--) {
          var tt = H[e]; H[e] = H[1]; H[1] = tt; sw++;
          size--;
          hframe("Swap the root with heap index " + e + ": " + H[e] + " is now in its final place. The heap shrinks to size " + size + ".", C.swap, { on: [e - 1], done: range(e - 1, n - 1) });
          heapify(1);
        }
        hframe("Sorted: " + H.slice(1).join(" "), C.copy, { done: range(0, n - 1) });
      }
      player.load(frames);
    }
    function range(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }
    function tags(p, r, i, j, rr) { var t = {}; t[p] = "p"; t[r] = (t[r] ? t[r] + " " : "") + "r"; if (i >= p) t[i] = (t[i] ? t[i] + " " : "") + "i"; if (j <= rr && j >= p) t[j] = (t[j] ? t[j] + " " : "") + "j"; return t; }
    var pre = host.querySelector("#so-pre");
    pre.addEventListener("change", function () { host.querySelector("#so-v").value = PRESETS[+pre.value].v; run(); });
    host.querySelector("#so-alg").addEventListener("change", run);
    host.querySelector("#so-one").addEventListener("change", run);
    host.querySelector("#so-go").addEventListener("click", run);
    host.querySelector("#so-rand").addEventListener("click", function () {
      var v = []; for (var i = 0; i < 9; i++) v.push(1 + Math.floor(Math.random() * 99));
      host.querySelector("#so-v").value = v.join(" ");
      run();
    });
    host.querySelector("#so-v").value = preset && preset.values ? preset.values.join(" ") : PRESETS[0].v;
    if (preset && preset.alg) host.querySelector("#so-alg").value = preset.alg;
    if (preset && preset.one) host.querySelector("#so-one").checked = true;
    run();
    return player;
  };
})(CL);
