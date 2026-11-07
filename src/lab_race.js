/* COMP 2611 Code Lab — sorting race: run several sorts side by side on the same input, one comparison or write
   at a time, with live counters. The sorts follow the lecture versions (bubble sort without an early exit, quick
   sort with the last value as pivot, heap sort from index 1). Added under the Sorting Lab. */
(function (CL) {
  "use strict";
  var esc = CL.esc;
  // each sort records a step at every comparison and every write, with the array as it is after that step
  function recorder(A) {
    var steps = [], cmp = 0, wr = 0;
    return {
      A: A,
      cmp: function (i, j) { cmp++; steps.push({ A: A.slice(), hot: [i, j], cmp: cmp, wr: wr, k: "c" }); },
      swap: function (i, j) { var t = A[i]; A[i] = A[j]; A[j] = t; wr += 2; steps.push({ A: A.slice(), hot: [i, j], cmp: cmp, wr: wr, k: "w" }); },
      set: function (i, v) { A[i] = v; wr++; steps.push({ A: A.slice(), hot: [i], cmp: cmp, wr: wr, k: "w" }); },
      done: function () { steps.push({ A: A.slice(), hot: [], cmp: cmp, wr: wr, k: "d" }); return steps; }
    };
  }
  var SORTS = {
    selection: { name: "Selection", run: function (A) { var R = recorder(A), n = A.length; for (var i = 0; i < n - 1; i++) { var s = i; for (var j = i + 1; j < n; j++) { R.cmp(j, s); if (A[j] < A[s]) s = j; } if (s !== i) R.swap(i, s); } return R.done(); } },
    bubble: { name: "Bubble", run: function (A) { var R = recorder(A), n = A.length; for (var p = 0; p < n - 1; p++) for (var j = 0; j < n - 1 - p; j++) { R.cmp(j, j + 1); if (A[j] > A[j + 1]) R.swap(j, j + 1); } return R.done(); } },
    insertion: { name: "Insertion", run: function (A) { var R = recorder(A), n = A.length; for (var i = 1; i < n; i++) { var key = A[i], j = i - 1; while (j >= 0) { R.cmp(j, j + 1); if (A[j] > key) { R.set(j + 1, A[j]); j--; } else break; } R.set(j + 1, key); } return R.done(); } },
    merge: { name: "Merge", run: function (A) {
      var R = recorder(A);
      (function ms(lo, hi) {
        if (lo >= hi) return;
        var mid = Math.floor((lo + hi) / 2);
        ms(lo, mid); ms(mid + 1, hi);
        var L = A.slice(lo, mid + 1), Rt = A.slice(mid + 1, hi + 1), i = 0, j = 0, k = lo;
        while (i < L.length && j < Rt.length) { R.cmp(lo + i, mid + 1 + j); if (L[i] <= Rt[j]) R.set(k++, L[i++]); else R.set(k++, Rt[j++]); }
        while (i < L.length) R.set(k++, L[i++]);
        while (j < Rt.length) R.set(k++, Rt[j++]);
      })(0, A.length - 1);
      return R.done();
    } },
    quick: { name: "Quick", run: function (A) {
      var R = recorder(A);
      (function qs(p, r) {
        if (p >= r) return;
        var x = A[r], i = p - 1;
        for (var j = p; j < r; j++) { R.cmp(j, r); if (A[j] <= x) { i++; if (i !== j) R.swap(i, j); } }
        if (i + 1 !== r) R.swap(i + 1, r);
        qs(p, i); qs(i + 2, r);
      })(0, A.length - 1);
      return R.done();
    } },
    heap: { name: "Heap", run: function (A) {
      // the lecture's heap starts at index 1; here index i of the heap is A[i - 1]
      var R = recorder(A), n = A.length;
      function down(i, size) {
        for (;;) {
          var l = 2 * i, r = l + 1, b = i;
          if (l <= size) { R.cmp(l - 1, b - 1); if (A[l - 1] > A[b - 1]) b = l; }
          if (r <= size) { R.cmp(r - 1, b - 1); if (A[r - 1] > A[b - 1]) b = r; }
          if (b === i) return;
          R.swap(i - 1, b - 1);
          i = b;
        }
      }
      for (var i = Math.floor(n / 2); i >= 1; i--) down(i, n);
      for (var size = n; size > 1; size--) { R.swap(0, size - 1); down(1, size - 1); }
      return R.done();
    } }
  };
  CL.SORTS_RACE = SORTS;
  var INPUTS = { random: "Random", sorted: "Already sorted", reversed: "Reversed", nearly: "Nearly sorted", few: "Few distinct values" };
  function makeInput(kind, n) {
    var a = [], i;
    for (i = 0; i < n; i++) a.push(1 + Math.floor(Math.random() * 99));
    if (kind === "sorted") a.sort(function (x, y) { return x - y; });
    if (kind === "reversed") a.sort(function (x, y) { return y - x; });
    if (kind === "nearly") { a.sort(function (x, y) { return x - y; }); for (i = 0; i < Math.max(1, Math.floor(n / 10)); i++) { var p = Math.floor(Math.random() * (n - 1)); var t = a[p]; a[p] = a[p + 1]; a[p + 1] = t; } }
    if (kind === "few") a = a.map(function (v) { return 10 + 20 * (v % 4); });
    return a;
  }
  function bars(A, hot, max, done) {
    var n = A.length, W = 300, H = 110, bw = W / n, s = "";
    var hs = {};
    (hot || []).forEach(function (i) { hs[i] = 1; });
    A.forEach(function (v, i) {
      var h = Math.max(2, Math.round((H - 4) * v / max));
      s += '<rect x="' + (i * bw + 0.5).toFixed(1) + '" y="' + (H - h) + '" width="' + Math.max(1, bw - 1).toFixed(1) + '" height="' + h + '" class="' + (done ? "rb-done" : hs[i] ? "rb-hot" : "rb") + '"/>';
    });
    return '<svg class="race-svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="' + (done ? "sorted" : "array") + '">' + s + "</svg>";
  }

  CL.sortRace = function (box) {
    box.className = "race";
    var chosen = ["insertion", "merge", "quick"], kind = "random", n = 24, input = makeInput(kind, n), runs = [], t = 0, timer = null;
    box.innerHTML = "<h2>Race the sorts</h2><p class=\"small muted\">The same array, sorted by several algorithms at once: each tick is one comparison, one swap or one write. Try an already sorted or reversed array to see each algorithm's best and worst cases.</p>" +
      '<div class="race-ctl"><div class="race-algs" role="group" aria-label="Algorithms">' + Object.keys(SORTS).map(function (k) { return '<label><input type="checkbox" value="' + k + '"' + (chosen.indexOf(k) >= 0 ? " checked" : "") + "> " + SORTS[k].name + "</label>"; }).join("") + "</div>" +
      '<label>Input <select class="race-kind">' + Object.keys(INPUTS).map(function (k) { return '<option value="' + k + '">' + INPUTS[k] + "</option>"; }).join("") + "</select></label>" +
      '<label>Size <select class="race-n">' + [8, 16, 24, 32, 40].map(function (v) { return "<option" + (v === n ? " selected" : "") + ">" + v + "</option>"; }).join("") + "</select></label>" +
      '<button type="button" class="btn small" data-r="new">New array</button></div>' +
      '<div class="race-grid"></div>' +
      '<div class="race-play"><button type="button" class="btn primary" data-r="play">Start</button><button type="button" class="btn" data-r="step">Step</button><button type="button" class="btn ghost" data-r="end">Finish</button><button type="button" class="btn ghost" data-r="reset">Reset</button>' +
      '<select class="race-speed" aria-label="Speed"><option value="140">Slow</option><option value="45" selected>Normal</option><option value="8">Fast</option></select><span class="race-t small muted"></span></div>' +
      '<div class="race-res small" aria-live="polite"></div>';
    var grid = box.querySelector(".race-grid"), tEl = box.querySelector(".race-t"), resEl = box.querySelector(".race-res"), playB = box.querySelector('[data-r="play"]');
    function prepare() {
      stop();
      t = 0;
      runs = chosen.map(function (k) { return { k: k, steps: SORTS[k].run(input.slice()) }; });
      draw();
    }
    function maxT() { return runs.reduce(function (m, r) { return Math.max(m, r.steps.length - 1); }, 0); }
    function draw() {
      var max = input.reduce(function (m, v) { return Math.max(m, v); }, 1);
      grid.innerHTML = runs.map(function (r) {
        var i = Math.min(t, r.steps.length - 1), s = r.steps[i], fin = t >= r.steps.length - 1;
        return '<div class="race-cell' + (fin ? " fin" : "") + '"><div class="race-h"><b>' + esc(SORTS[r.k].name) + '</b><span class="small">' + (fin ? "done" : "") + "</span></div>" + bars(s.A, s.hot, max, fin) +
          '<div class="race-c small"><span>' + s.cmp + " comparisons</span><span>" + s.wr + " writes</span></div></div>";
      }).join("") || '<p class="muted">Pick at least one algorithm.</p>';
      tEl.textContent = "tick " + t + " of " + maxT();
      if (runs.length && t >= maxT()) {
        var order = runs.slice().sort(function (a, b) { return a.steps.length - b.steps.length; });
        resEl.innerHTML = "<b>Finishing order</b> (fewest steps first): " + order.map(function (r, k) { var last = r.steps[r.steps.length - 1]; return (k + 1) + ". " + esc(SORTS[r.k].name) + " (" + last.cmp + " comparisons, " + last.wr + " writes)"; }).join("; ") + ".";
      } else resEl.textContent = "";
    }
    function tick() { if (t >= maxT()) { stop(); return; } t++; draw(); timer = setTimeout(tick, +box.querySelector(".race-speed").value); }
    function stop() { if (timer) clearTimeout(timer); timer = null; playB.textContent = "Start"; }
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-r]");
      if (!b) return;
      var a = b.getAttribute("data-r");
      if (a === "play") { if (timer) stop(); else { if (t >= maxT()) t = 0; playB.textContent = "Pause"; tick(); } }
      if (a === "step") { stop(); if (t < maxT()) { t++; draw(); } }
      if (a === "end") { stop(); t = maxT(); draw(); }
      if (a === "reset") { stop(); t = 0; draw(); }
      if (a === "new") { input = makeInput(kind, n); prepare(); }
    });
    box.addEventListener("change", function (e) {
      if (e.target.matches(".race-algs input")) { chosen = Array.prototype.slice.call(box.querySelectorAll(".race-algs input:checked")).map(function (x) { return x.value; }); prepare(); }
      if (e.target.matches(".race-kind")) { kind = e.target.value; input = makeInput(kind, n); prepare(); }
      if (e.target.matches(".race-n")) { n = +e.target.value; input = makeInput(kind, n); prepare(); }
    });
    prepare();
    return { destroy: stop };
  };
  // put the race under the Sorting Lab
  var labSort = CL.Labs.sort;
  if (labSort) CL.Labs.sort = function (host, preset) {
    var pl = labSort(host, preset);
    var box = document.createElement("section");
    host.appendChild(box);
    var race = CL.sortRace(box);
    if (pl) { var d = pl.destroy; pl.destroy = function () { if (d) d.call(pl); race.destroy(); }; }
    return pl;
  };
})(CL);
