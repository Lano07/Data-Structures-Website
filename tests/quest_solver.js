// The Quest play-through test injects this into the page: it solves the last unsolved challenge using the level data.
// In-page solver for the last unsolved quest challenge. Returns a description, or null when nothing to solve.
window.__qsolve = async function () {
  const cards = [...document.querySelectorAll(".qb.task:not(.solved)")];
  const card = cards[cards.length - 1];
  if (!card) return null;
  const b = card._b, W = CL.QW;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const click = (el) => el && el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const T = b.t;
  if (T === "quiz") { const want = b.opts.find(o => o.right).text; const d = document.createElement("div"); d.innerHTML = CL.inline(want.replace(/⏎/g, "↵")); for (const o of card.querySelectorAll(".qw-opt")) { const txt = o.querySelector("span:last-child").textContent; if (txt === d.textContent) { click(o); return "quiz"; } } return "quiz: option not found"; }
  if (T === "type") { card.querySelector(".qw-in").value = b.answers[0]; click(card.querySelector(".qw-row button")); return "type"; }
  if (T === "predict") { card.querySelector(".qw-ta").value = b.expect; click(card.querySelector('[data-a="check"]')); return "predict"; }
  if (T === "order") { for (const line of b.lines) { const chips = [...card.querySelectorAll(".qw-pool .qw-chip")]; const el = chips.find(c => c.textContent.trim() === line.trim() || c.textContent.trim() === line.replace(/\t/g, "").trim()); if (!el) return "order: line not found " + line; click(el); await sleep(5); } click(card.querySelector('[data-a="check"]')); return "order"; }
  if (T === "fill") { const re = /\[\[(.+?)\]\](?!\])/g; let m, i = 0; const ins = card.querySelectorAll(".qw-blank"); while ((m = re.exec(b.code))) { ins[i++].value = m[1].split("|")[0].trim(); } click(card.querySelector(".qw-row button")); return "fill"; }
  if (T === "match") {
    const tx = (s) => { const d = document.createElement("div"); d.innerHTML = CL.inline(s); return d.textContent; };
    for (const [a, c] of b.pairs) {
      const L = [...card.querySelectorAll('.qw-chip[data-side="l"]')].find(x => x.textContent === tx(a) && !x.classList.contains("right"));
      const R = [...card.querySelectorAll('.qw-chip[data-side="r"]')].find(x => x.textContent === tx(c) && !x.classList.contains("right"));
      click(L); click(R); await sleep(5);
    }
    return "match";
  }
  if (T === "tree") {
    // recompute the expected clicks from the widget's own drawing
    const kind = b.kind || "pre";
    const root = b.level ? CL.treeFromLevel(b.level).root : b.keys ? CL.bstFrom(b.keys.split(/[\s,]+/).filter(Boolean).map(Number)) : CL.parseTreeSpec(b.tree);
    const key = b.key !== undefined ? (isNaN(+b.key) ? b.key : +b.key) : null;
    const seqKeys = (kind) => { const out = []; if (kind === "level") { const q = [root]; while (q.length) { const n = q.shift(); if (!n) continue; out.push(n.key); q.push(n.left, n.right); } return out; } (function w(n) { if (!n) return; if (kind === "pre") out.push(n.key); w(n.left); if (kind === "in") out.push(n.key); w(n.right); if (kind === "post") out.push(n.key); })(root); return out; };
    const all = []; (function w(n) { if (!n) return; all.push(n); w(n.left); w(n.right); })(root);
    let keys = [];
    if (["pre", "in", "post", "level"].includes(kind)) keys = seqKeys(kind);
    else if (kind === "leaves") keys = all.filter(n => !n.left && !n.right).map(n => n.key);
    else if (kind === "internal") keys = all.filter(n => n.left || n.right).map(n => n.key);
    else if (kind === "onechild") keys = all.filter(n => !n.left !== !n.right).map(n => n.key);
    else if (kind === "path") { let x = root; while (x) { keys.push(x.key); if (x.key === key) break; x = key < x.key ? x.left : x.right; } }
    else if (kind === "succ" || kind === "pred") { const ino = seqKeys("in"); const at = ino.indexOf(key); keys = [ino[at + (kind === "succ" ? 1 : -1)]]; }
    else if (kind === "insert") {
      // find the slot: walk the tree
      let x = root, par = null, side = null; while (x) { par = x; side = key < x.key ? "left" : "right"; x = x[side]; }
      const slots = [...card.querySelectorAll(".qt-slot")];
      const el = slots.find(s => s.getAttribute("aria-label") === "empty " + side + " child of " + par.key);
      click(el); return "tree insert";
    }
    for (const k of keys) { const el = [...card.querySelectorAll(".qt-n")].find(g => g.getAttribute("aria-label") === "node " + k && !g.classList.contains("on")); if (!el) return "tree: node not found " + k; click(el); await sleep(5); }
    return "tree " + kind;
  }
  if (T === "graph") {
    const g = CL.parseGraphSpec(String(b.spec || "").replace(/;\s*/g, "\n"), { directed: b.directed === "1" || b.directed === "true", weighted: b.weighted ? b.weighted !== "0" : undefined });
    const kind = b.kind || "bfs", s = b.start || g.V[0], A = W.graphAlgos;
    if (kind === "kruskal") { const t = A.kruskal(g).tree; for (const e of t) { const el = [...card.querySelectorAll(".qg-edges .qw-chip")].find(c => c._e[0] === e[0] && c._e[1] === e[1] && c._e[2] === e[2]); click(el); await sleep(5); } return "kruskal"; }
    const order = kind === "bfs" ? A.bfs(g, s) : kind === "dfs" ? A.dfs(g, s, b.all === "1") : kind === "dijkstra" ? A.dijkstra(g, s).order : A.prim(g, s).order;
    for (const v of order) { const el = card.querySelector('.g-node[data-v="' + v + '"]'); click(el); await sleep(5); }
    return "graph " + kind;
  }
  if (T === "array") {
    const kind = b.kind || "hash";
    if (kind === "hash") {
      const N = +(b.n || b.N || 11), base = b.base === undefined ? 1 : +b.base, keys = b.keys.split(/[\s,]+/).filter(Boolean).map(Number), method = b.method || "linear";
      const Tb = Array(N).fill(null).map(() => method === "chain" ? [] : null);
      const wrap = (l) => { while (l > N - 1 + base) l -= N; return l; };
      for (const key of keys) {
        let loc = key % N + base, x = 0;
        if (method !== "chain") while (Tb[loc - base] !== null) { x++; loc = method === "linear" ? wrap(loc + 1) : method === "quad" ? wrap(loc + x + x * x) : wrap(loc + key % (N - 2) + 1); }
        if (method === "chain") Tb[loc - base].push(key); else Tb[loc - base] = key;
        click(card.querySelector('.qa-c[data-i="' + (loc - base) + '"]')); await sleep(5);
      }
      return "hash";
    }
    if (kind === "binsearch") { const A = b.values.split(/[\s,]+/).map(Number), key = +b.key; let lo = 0, hi = A.length - 1; while (lo <= hi) { const mid = Math.floor((lo + hi) / 2); click(card.querySelector('.qa-c[data-i="' + mid + '"]')); await sleep(5); if (A[mid] === key) break; if (key < A[mid]) hi = mid - 1; else lo = mid + 1; } return "binsearch"; }
    if (kind === "index") { const i0 = +b.i, ask = b.ask || "parent"; const want = ask === "parent" ? Math.floor(i0 / 2) : ask === "left" ? 2 * i0 : 2 * i0 + 1; click(card.querySelector('.qa-c[data-i="' + (want - 1) + '"]')); return "index"; }
  }
  if (T === "heap") {
    // press the right button until done: the button text says what it does; compute with the same rules
    for (let guard = 0; guard < 60 && !card.classList.contains("solved"); guard++) {
      const btns = [...card.querySelectorAll(".qw-row .px-btn")];
      if (!btns.length) break;
      const info = card.querySelector(".qw-seq").textContent;
      const arr = [...card.querySelectorAll(".qa-c b")].map(x => +x.textContent);
      const A = [null].concat(arr), isMin = b.min === "1", better = (x, y) => isMin ? x < y : x > y;
      let m = /index (\d+)/.exec(info), cur = m ? +m[1] : 1;
      if (/maxHeapify at index/.test(info)) {
        const n = arr.length, l = 2 * cur, r = 2 * cur + 1; let best = cur;
        if (l <= n && better(A[l], A[best])) best = l; if (r <= n && better(A[r], A[best])) best = r;
        const el = best === cur ? btns.find(x => /No swap/.test(x.textContent)) : btns.find(x => x.textContent.indexOf("(index " + best + ")") >= 0);
        click(el);
      } else {
        const mm = /is at index (\d+); its parent is (-?\d+)/.exec(info), c2 = +mm[1], pv = +mm[2];
        click(better(A[c2], pv) ? btns.find(x => /Swap/.test(x.textContent)) : btns.find(x => /Stop/.test(x.textContent)));
      }
      await sleep(5);
    }
    return "heap";
  }
  if (T === "sort") {
    for (let guard = 0; guard < 300 && !card.classList.contains("solved"); guard++) {
      const arr = [...card.querySelectorAll(".qa-c b")].map(x => x.textContent === "" ? null : +x.textContent);
      const info = card.querySelector(".qw-seq").textContent;
      const btns = [...card.querySelectorAll(".qw-row .px-btn")];
      const alg = b.alg || "bubble";
      if (alg === "bubble") { const m = /A\[(\d+)\] = (-?\d+) and A\[(\d+)\] = (-?\d+)/.exec(info); click(+m[2] > +m[4] ? btns[0] : btns[1]); }
      else if (alg === "partition") { const m = /x = A\[\d+\] = (-?\d+).*A\[j\] = (-?\d+)/.exec(info); click(+m[2] <= +m[1] ? btns[0] : btns[1]); }
      else if (alg === "selection") { const m = /from index (\d+)/.exec(info), si = +m[1]; let mi = si; for (let k = si + 1; k < arr.length; k++) if (arr[k] < arr[mi]) mi = k; click(card.querySelector('.qa-c[data-i="' + mi + '"]')); }
      else if (alg === "insertion") { const m = /Insert (-?\d+) \(index (\d+)\)/.exec(info), key = +m[1], ii = +m[2]; let j = ii - 1; while (j >= 0 && arr[j] > key) j--; click(card.querySelector('.qa-c[data-i="' + (j + 1) + '"]')); }
      else if (alg === "merge") { const runs = card.querySelectorAll(".qm-runs > div"); const L = runs[0].querySelector(".qa-c"), R = runs[1].querySelector(".qa-c"); const lv = +L.querySelector("b").textContent, rv = +R.querySelector("b").textContent; click(lv <= rv ? L : R); }
      await sleep(5);
    }
    return "sort";
  }
  if (T === "listsim") { for (const ln of b.solution) { const el = [...card.querySelectorAll(".ql-stmt")].find(x => x._ln === ln); click(el); await sleep(5); } return "listsim"; }
  if (T === "code") {
    const e = CODELAB_DATA.exercises.find(x => x.id === b.ex);
    const ta = card.querySelector(".ed-ta"); ta.value = e.solution; ta.dispatchEvent(new Event("input"));
    click(card.querySelector('[data-a="run"]'));
    for (let k = 0; k < 100 && !card.classList.contains("solved"); k++) await sleep(50);
    return "code";
  }
  return "unknown " + T;
};
