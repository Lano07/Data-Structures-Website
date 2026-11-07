# Cross-checks algorithm questions against the lecture's C++ code run in the interpreter (BST delete, heaps,
# hashing, sorting), and graph questions against separate JavaScript implementations.
import asyncio, json, sys
from playwright.async_api import async_playwright
N = int(sys.argv[1]) if len(sys.argv) > 1 else 80
JS = r"""
(N) => {
  const T = CL.Train, res = {};
  const HDR = "#include <iostream>\nusing namespace std;\n\n";
  const note = (gid, ok, info) => { const r = res[gid] = res[gid] || { n: 0, bad: [] }; r.n++; if (!ok) r.bad.push(info); };
  const run = src => { const r = CPP.run(src, { maxSteps: 3000000 }); return r.ok ? T.norm(r.out) : "ERROR " + JSON.stringify(r.err).slice(0, 200); };
  const seedOf = i => (i * 3266489917 + 99) >>> 0;
  // ---- BST delete, with the lab's (lecture) code
  const B = CL.BST_CODE;
  const BTP = "struct BTNode {\n\tint data;\n\tBTNode * left;\n\tBTNode * right;\n\tBTNode * parent;\n};\n\nBTNode * createBTNode (int data) {\n\tBTNode * n = new BTNode;\n\tn->data = data;\n\tn->left = NULL;\n\tn->right = NULL;\n\tn->parent = NULL;\n\treturn n;\n}\n\n";
  const PRE = "void pre (BTNode * r) {\n\tif (r == NULL)\n\t\treturn;\n\tcout << r->data << \" \";\n\tpre (r->left);\n\tpre (r->right);\n}\n\nvoid level (BTNode * r) {\n\tBTNode * Q[100];\n\tint h = 0, t = 0;\n\tif (r != NULL)\n\t\tQ[t++] = r;\n\twhile (h < t) {\n\t\tBTNode * p = Q[h++];\n\t\tcout << p->data << \" \";\n\t\tif (p->left != NULL)\n\t\t\tQ[t++] = p->left;\n\t\tif (p->right != NULL)\n\t\t\tQ[t++] = p->right;\n\t}\n}\n\n";
  for (let i = 0; i < N; i++) {
    const q = T.make("bst-delete", seedOf(i));
    const spec = /^BST: (.*)\. Delete (\d+)\.$/.exec(q.ctx), root = CL.parseTreeSpec(spec[1]), key = +spec[2];
    const keys = T.tree.seq(root, "pre"), kind = /preorder/.test(q.text.replace(/<[^>]*>/g, "")) ? "pre" : "level";
    const src = HDR + BTP + B.insert.code + "\n\n" + B.search.code + "\n\n" + B.min.code + "\n\n" + B.succ.code + "\n\n" + B.del.code + "\n\n" + PRE +
      "int main () {\n\tBTNode * root = NULL;\n" + keys.map(k => "\troot = insertBST (root, " + k + ");\n").join("") + "\troot = deleteBST (root, " + key + ");\n\t" + kind + " (root);\n\tcout << endl;\n\treturn 0;\n}\n";
    const got = run(src);
    note("bst-delete", got === T.norm(q.answer), { want: q.answer, got });
  }
  // ---- heaps, with the lab's (lecture) max-heap code; min-heaps are checked as max-heaps of negated values
  const H = CL.HEAP_CODE;
  const HS = "struct MaxHeap {\n\tint A [1000];\n\tint size;\n};\n\nMaxHeap * initMaxHeapFromArray (int A[], int numElements) {\n\tMaxHeap * heap = new MaxHeap;\n\tfor (int i = 0; i < numElements; i++)\n\t\theap->A[i + 1] = A[i];\n\theap->size = numElements;\n\treturn heap;\n}\n\n";
  const show = "\tfor (int i = 1; i <= heap->size; i++)\n\t\tcout << heap->A[i] << \" \";\n\tcout << endl;\n";
  const heapProg = (vals, body, showAll) => HDR + HS + H.heapify.code + "\n\n" + H.extract.code + "\n\n" + H.insert.code + "\n\n" + H.increase.code + "\n\nint main () {\n\tint V[] = {" + vals.join(", ") + "};\n\tMaxHeap * heap = initMaxHeapFromArray (V, " + vals.length + ");\n" + body + (showAll ? "\tfor (int i = 1; i <= " + vals.length + "; i++)\n\t\tcout << heap->A[i] << \" \";\n\tcout << endl;\n" : show) + "\treturn 0;\n}\n";
  const nums = s => s.match(/-?\d+/g).map(Number);
  for (let i = 0; i < N; i++) {
    let q = T.make("heap-build", seedOf(i));
    let vals = nums(/= (.*), build/.exec(q.ctx)[1]), isMin = /buildMin/.test(q.ctx);
    let got = run(heapProg(isMin ? vals.map(v => -v) : vals, "\tbuildMaxHeap (heap);\n"));
    if (isMin && !/ERROR/.test(got)) got = got.split(" ").map(v => -v).join(" ");
    note("heap-build", got === T.norm(q.answer), { want: q.answer, got });
    q = T.make("heap-insert", seedOf(i));
    let m = /= (.*)\. Insert (\d+)/.exec(q.ctx);
    got = run(heapProg(nums(m[1]), "\tinsertMaxHeap (heap, " + m[2] + ");\n"));
    note("heap-insert", got === T.norm(q.answer), { want: q.answer, got });
    q = T.make("heap-extract", seedOf(i));
    m = /(Max|Min)-heap A\[1\.\.\d+\] = (.*)\. Extract/.exec(q.ctx);
    vals = nums(m[2]); isMin = m[1] === "Min";
    got = run(heapProg(isMin ? vals.map(v => -v) : vals, "\theapExtractMax (heap);\n"));
    if (isMin && !/ERROR/.test(got)) got = got.split(" ").map(v => -v).join(" ");
    note("heap-extract", got === T.norm(q.answer), { want: q.answer, got });
    q = T.make("heap-increase", seedOf(i));
    m = /Max-heap (.*)\. increaseKey at index (\d+) to (\d+)/.exec(q.ctx);
    got = run(heapProg(nums(m[1]), "\tincreaseKeyMaxHeap (heap, " + m[2] + ", " + m[3] + ");\n"));
    note("heap-increase", got === T.norm(q.answer), { want: q.answer, got });
    q = T.make("heap-heapify", seedOf(i));
    m = /= (.*)\. maxHeapify\((\d+)\)/.exec(q.ctx);
    got = run(heapProg(nums(m[1]), "\tmaxHeapify (heap, " + m[2] + ");\n"));
    note("heap-heapify", got === T.norm(q.answer), { want: q.answer, got });
    q = T.make("heap-sort", seedOf(i));
    m = /A = (.*), heap sort, after (\d+) passes/.exec(q.ctx);
    vals = nums(m[1]);
    const k = +m[2];
    got = run(heapProg(vals, "\tbuildMaxHeap (heap);\n\tint n = heap->size;\n\tfor (int i = heap->size; i >= 2 && i > n - " + k + "; i--) {\n\t\tint temp = heap->A[i];\n\t\theap->A[i] = heap->A[1];\n\t\theap->A[1] = temp;\n\t\theap->size = heap->size - 1;\n\t\tmaxHeapify (heap, 1);\n\t}\n", true));
    note("heap-sort", got === T.norm(q.answer), { want: q.answer, got });
  }
  // ---- hashing, with C++ written from the lab's code
  const HC = (N, method, keys, target) => HDR + "const int N = " + N + ";\n\nint insertKey (int table[], int key) {\n\tint loc = key % N + 1;\n\tint x = 0;\n\tint k = key % (N - 2) + 1;\n\tint tries = 0;\n\twhile (table[loc] != 0 && tries < 3 * N) {\n\t\tx = x + 1;\n\t\ttries++;\n" +
    (method === "linear" ? "\t\tloc = loc + 1;\n\t\tif (loc > N)\n\t\t\tloc = 1;\n" : method === "quad" ? "\t\tloc = loc + x + x * x;\n\t\twhile (loc > N)\n\t\t\tloc = loc - N;\n" : "\t\tloc = loc + k;\n\t\twhile (loc > N)\n\t\t\tloc = loc - N;\n") +
    "\t}\n\ttable[loc] = key;\n\treturn loc;\n}\n\nint main () {\n\tint table[N + 1];\n\tfor (int i = 0; i <= N; i++)\n\t\ttable[i] = 0;\n\tint where = -1;\n" + keys.map(k => "\t" + (k === target ? "where = " : "") + "insertKey (table, " + k + ");\n").join("") + "\tcout << where << endl;\n\treturn 0;\n}\n";
  for (let i = 0; i < N; i++) {
    const q = T.make("hash-insert", seedOf(i));
    const m = /N = (\d+), h = key % N \+ 1, (\w+), keys (.*)\. Where is (\d+)\?/.exec(q.ctx);
    const got = run(HC(+m[1], m[2], nums(m[3]), +m[4]));
    note("hash-insert", got === T.norm(q.answer), { want: q.answer, got });
  }
  // ---- sorting passes, partition and merge with the lecture's code
  const SC = CL.SORT_CODE;
  const passProg = (alg, A, k) => {
    const n = A.length;
    const body = alg === "selection" ? "\tfor (int i = 0; i < n - 1 && i < K; i++) {\n\t\tint smallest = i;\n\t\tfor (int j = i + 1; j < n; j++)\n\t\t\tif (A[j] < A[smallest])\n\t\t\t\tsmallest = j;\n\t\tint temp = A[i];\n\t\tA[i] = A[smallest];\n\t\tA[smallest] = temp;\n\t}\n" :
      alg === "bubble" ? "\tfor (int i = 0; i < n - 1 && i < K; i++)\n\t\tfor (int j = 0; j < n - 1 - i; j++)\n\t\t\tif (A[j] > A[j + 1]) {\n\t\t\t\tint temp = A[j];\n\t\t\t\tA[j] = A[j + 1];\n\t\t\t\tA[j + 1] = temp;\n\t\t\t}\n" :
      "\tfor (int i = 1; i < n && i <= K; i++) {\n\t\tint key = A[i];\n\t\tint j = i - 1;\n\t\twhile (j >= 0 && A[j] > key) {\n\t\t\tA[j + 1] = A[j];\n\t\t\tj = j - 1;\n\t\t}\n\t\tA[j + 1] = key;\n\t}\n";
    return HDR + "int main () {\n\tint A[] = {" + A.join(", ") + "};\n\tint n = " + n + ", K = " + k + ";\n" + body + "\tfor (int i = 0; i < n; i++)\n\t\tcout << A[i] << \" \";\n\tcout << endl;\n\treturn 0;\n}\n";
  };
  for (let i = 0; i < N; i++) {
    let q = T.make("sort-pass", seedOf(i));
    let m = /^(\w+) sort on (.*), after pass (\d+)$/.exec(q.ctx);
    let got = run(passProg(m[1], nums(m[2]), +m[3]));
    note("sort-pass", got === T.norm(q.answer), { want: q.answer, got });
    q = T.make("sort-partition", seedOf(i));
    m = /partition on (.*), pivot/.exec(q.ctx);
    const A = nums(m[1]);
    const part = SC.quick.code.split("\n\nint partition")[1];
    got = run(HDR + "int partition" + part + "\n\nint main () {\n\tint A[] = {" + A.join(", ") + "};\n\tpartition (A, 0, " + (A.length - 1) + ");\n\tfor (int i = 0; i < " + A.length + "; i++)\n\t\tcout << A[i] << \" \";\n\tcout << endl;\n\treturn 0;\n}\n");
    note("sort-partition", got === T.norm(q.answer), { want: q.answer, got });
    q = T.make("sort-merge", seedOf(i));
    if (q.type === "seq") {
      m = /mergeSort on (.*), after (\d+) merges/.exec(q.ctx);
      const M = nums(m[1]), k = +m[2];
      const ms = SC.merge.code.replace("mergeArray (A, start, mid, end);", "mergeArray (A, start, mid, end);\n\t\tcount++;\n\t\tif (count == STOP) {\n\t\t\tfor (int i = 0; i < SIZE; i++)\n\t\t\t\tcout << A[i] << \" \";\n\t\t\tcout << endl;\n\t\t}");
      const parts = ms.split("\n\nvoid mergeArray");
      got = run(HDR + "int count = 0;\nconst int STOP = " + k + ";\nconst int SIZE = " + M.length + ";\n\nvoid mergeArray" + parts[1] + "\n\n" + parts[0] + "\n\nint main () {\n\tint A[] = {" + M.join(", ") + "};\n\tmergeSort (A, 0, " + (M.length - 1) + ");\n\treturn 0;\n}\n");
      note("sort-merge", got === T.norm(q.answer), { want: q.answer, got });
    }
  }
  // ---- graphs: separate implementations
  for (let i = 0; i < N; i++) {
    const q = T.make("graph-trav", seedOf(i)), g = q.lab.preset.graph, s = q.lab.preset.start;
    let order = [];
    if (q.lab.preset.alg === "bfs") { const seen = new Set([s]), Q = [s]; while (Q.length) { const u = Q.shift(); order.push(u); for (const v of [...g.adj[u]].sort()) if (!seen.has(v)) { seen.add(v); Q.push(v); } } }
    else { const seen = new Set(); const go = u => { seen.add(u); order.push(u); for (const v of [...g.adj[u]].sort()) if (!seen.has(v)) go(v); }; go(s); }
    note("graph-trav", order.join(" ") === T.norm(q.answer), { want: q.answer, got: order.join(" ") });
    const d = T.make("graph-dijkstra", seedOf(i)), G = d.lab.preset.graph;
    const dist = {}; G.V.forEach(v => dist[v] = Infinity); dist.A = 0;
    for (let it = 0; it < G.V.length; it++) G.E.forEach(e => { if (dist[e[0]] + e[2] < dist[e[1]]) dist[e[1]] = dist[e[0]] + e[2]; });
    if (d.type === "num") { const x = /to <b>(\w)<\/b>\?/.exec(d.text)[1]; note("graph-dijkstra", String(dist[x]) === d.answer, { want: d.answer, got: dist[x] }); }
    const k = T.make("graph-mst", seedOf(i));
    if (k.type === "num") {
      const E = k.lab.preset.graph.E.slice().sort((a, b) => a[2] - b[2]), V = k.lab.preset.graph.V, par = {}; V.forEach(v => par[v] = v);
      const f = v => par[v] === v ? v : (par[v] = f(par[v])); let tot = 0;
      E.forEach(e => { const a = f(e[0]), b = f(e[1]); if (a !== b) { par[a] = b; tot += e[2]; } });
      note("graph-mst", String(tot) === k.answer, { want: k.answer, got: tot });
    }
  }
  return res;
}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto("file:///home/claude/codelab/dist/COMP2611-Code-Lab.html#home")
        await pg.wait_for_timeout(500)
        res = await pg.evaluate(JS, N)
        await b.close()
    for gid, r in res.items():
        print(f"{gid:16s} {r['n']:4d} checked, {len(r['bad'])} mismatches")
        for x in r["bad"][:3]: print("    ", json.dumps(x)[:300])
asyncio.run(main())
