/* COMP 2611 Code Lab — Trace Trainer: exam-style questions made from random data, each with a worked solution.
   Part 1: the question engine, binary trees, binary search trees and heaps. */
(function (CL) {
  "use strict";
  var esc = CL.esc;
  var T = CL.Train = { gens: [], byId: Object.create(null) };

  // ---------------------------------------------------------------- seeded random numbers
  // the same seed always gives the same question, so a question can be rebuilt later from (generator, seed)
  function RNG(seed) {
    var a = seed >>> 0;
    var r = function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = function (lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); };
    r.pick = function (a) { return a[Math.floor(r() * a.length)]; };
    r.chance = function (p) { return r() < p; };
    r.shuffle = function (a) { for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)); var t = a[k]; a[k] = a[j]; a[j] = t; } return a; };
    r.distinct = function (n, lo, hi) { var seen = {}, out = [], guard = 0; while (out.length < n && guard++ < 10000) { var v = r.int(lo, hi); if (!seen[v]) { seen[v] = 1; out.push(v); } } return out; };
    return r;
  }
  T.RNG = RNG;
  T.newSeed = function () { return (Math.random() * 4294967296) >>> 0; };

  T.topics = [
    { id: "cpp", title: "C++ and pointers", part: "b" },
    { id: "lists", title: "Linked lists", part: "c" },
    { id: "recursion", title: "Recursion", part: "d" },
    { id: "stacks", title: "Stacks and queues", part: "e" },
    { id: "trees", title: "Binary trees", part: "f" },
    { id: "bst", title: "Binary search trees", part: "g" },
    { id: "heaps", title: "Heaps", part: "h" },
    { id: "hashing", title: "Hashing", part: "i" },
    { id: "graphs", title: "Graphs", part: "j" },
    { id: "sorting", title: "Sorting", part: "k" },
    { id: "bigo", title: "Performance (big-O)", part: "l" }
  ];
  T.topicById = Object.create(null);
  T.topics.forEach(function (t) { T.topicById[t.id] = t; });

  function add(g) { T.gens.push(g); T.byId[g.id] = g; }
  T.add = add;

  // typed answers: "10, 20 -> 30" and "10 20 30" are the same; null / none / nil all mean NULL
  T.norm = function (s) {
    return String(s === undefined || s === null ? "" : s).replace(/<[^>]*>/g, " ").replace(/->|→|,|;|\|/g, " ").replace(/[()\[\]{}]/g, " ")
      .trim().split(/\s+/).filter(Boolean).map(function (t) {
        t = t.toUpperCase();
        return t === "NONE" || t === "NIL" || t === "NULLPTR" ? "NULL" : t === "–" || t === "—" || t === "_" ? "-" : t;
      }).join(" ");
  };

  // build one question from a generator and a seed
  T.make = function (genId, seed) {
    var g = T.byId[genId];
    if (!g) return null;
    if (seed === undefined) seed = T.newSeed();
    var r = RNG(seed);
    var q = g.make(r);
    q.gen = g.id; q.seed = seed; q.topic = g.topic; q.title = q.title || g.title;
    q.marks = q.marks || g.marks || 1;
    finalize(q, RNG(seed ^ 0x5bd1e995));
    return q;
  };
  // multiple-choice version: the right answer plus up to three wrong answers from common mistakes
  function finalize(q, r) {
    if (q.type === "choice") { q.mcq = { options: q.options, answer: q.answer }; return q; }
    var right = String(q.answer), seen = {}, opts = [right], rightK = T.norm(right);
    seen[rightK] = 1;
    // a wrong answer can carry the mistake that produces it: { v: value, why: "..." }
    function push(w) {
      var why = null;
      if (w && typeof w === "object" && "v" in w) { why = w.why; w = w.v; }
      if (w === null || w === undefined) return;
      w = String(w);
      var k = T.norm(w);
      if (!k) return;
      if (why && k !== rightK && !(q.why && q.why[k])) (q.why = q.why || {})[k] = why;
      if (opts.length >= 4 || seen[k]) return;
      seen[k] = 1;
      opts.push(w);
    }
    (q.wrong || []).forEach(push);
    var guard = 0;
    while (opts.length < 4 && q.more && guard++ < 60) push(q.more(r));
    if (q.type === "num" && opts.every(function (o) { return /^-?\d+$/.test(o); })) opts.sort(function (a, b) { return a - b; });
    else r.shuffle(opts);
    q.mcq = { options: opts, answer: opts.indexOf(right) };
    return q;
  }
  T.finalize = finalize;

  // ---------------------------------------------------------------- shared helpers
  function seqMore(seq) {
    // a plausible wrong sequence: two neighbours swapped, or one value moved
    return function (r) {
      var a = seq.slice();
      if (a.length < 2) return null;
      if (r.chance(0.6)) { var i = r.int(0, a.length - 2); var t = a[i]; a[i] = a[i + 1]; a[i + 1] = t; }
      else { var from = r.int(0, a.length - 1), v = a.splice(from, 1)[0]; a.splice(r.int(0, a.length), 0, v); }
      return a.join(" ");
    };
  }
  function numMore(ans, lo) {
    return function (r) { var v = ans + r.pick([-2, -1, 1, 2, 3]); return v >= (lo === undefined ? 0 : lo) ? v : null; };
  }
  T.seqMore = seqMore;
  T.numMore = numMore;
  function code(s) { return "<code>" + esc(s) + "</code>"; }
  T.code = code;
  function b(s) { return "<b>" + esc(s) + "</b>"; }

  // ---------------------------------------------------------------- trees
  function node(k) { return { key: k, left: null, right: null, parent: null }; }
  function height(n) { return n ? 1 + Math.max(height(n.left), height(n.right)) : -1; }
  function count(n) { return n ? 1 + count(n.left) + count(n.right) : 0; }
  function nodesPre(n, out) { out = out || []; if (n) { out.push(n); nodesPre(n.left, out); nodesPre(n.right, out); } return out; }
  function spec(n) {
    if (!n) return "";
    if (!n.left && !n.right) return String(n.key);
    return n.key + "(" + spec(n.left) + (n.right ? "," + spec(n.right) : "") + ")";
  }
  function clone(n, p) { if (!n) return null; var c = node(n.key); c.parent = p || null; c.left = clone(n.left, c); c.right = clone(n.right, c); return c; }
  function mirror(n) { if (!n) return null; var c = node(n.key); c.left = mirror(n.right); c.right = mirror(n.left); return c; }
  function find(n, k) { while (n && n.key !== k) n = k < n.key ? n.left : n.right; return n; }
  function findAny(n, k) { if (!n) return null; if (n.key === k) return n; return findAny(n.left, k) || findAny(n.right, k); }
  function setParents(n, p) { if (!n) return n; n.parent = p || null; setParents(n.left, n); setParents(n.right, n); return n; }
  function seq(root, kind) { return CL.travSeq(root, kind); }
  function depthOf(root, target) { var d = 0, found = -1; (function w(n, k) { if (!n) return; if (n === target) found = k; w(n.left, k + 1); w(n.right, k + 1); })(root, 0); return found; }
  T.tree = { node: node, height: height, count: count, spec: spec, clone: clone, mirror: mirror, find: find, seq: seq, setParents: setParents };

  // a random binary tree with n nodes and height at most maxH (2 to 4 keeps the drawing small)
  function randTree(r, n, keys, maxH) {
    maxH = maxH || 4;
    for (var tries = 0; tries < 200; tries++) {
      var root = node(keys[0]), all = [root];
      for (var i = 1; i < n; i++) {
        var slots = [];
        all.forEach(function (x) { if (!x.left) slots.push([x, "left"]); if (!x.right) slots.push([x, "right"]); });
        var s = r.pick(slots), nn = node(keys[i]);
        s[0][s[1]] = nn;
        nn.parent = s[0];
        all.push(nn);
      }
      var h = height(root);
      if (h <= maxH && h >= 2) return root;
    }
    return root;
  }
  function keysFor(r, n) { return r.distinct(n, 1, 99); }
  // a BST from random keys whose height is between 2 and maxH
  function randBST(r, n, maxH) {
    for (var t = 0; t < 200; t++) {
      var keys = r.distinct(n, 1, 99), root = CL.bstFrom(keys), h = height(root);
      if (h <= (maxH || 4) && h >= 2) return { keys: keys, root: setParents(root) };
    }
    return { keys: keys, root: setParents(root) };
  }
  T.randTree = randTree;
  T.randBST = randBST;
  function treeFig(root, opts) { return '<div class="tq-fig">' + CL.drawTree(root, Object.assign({ minW: 0 }, opts || {})) + "</div>"; }
  function smallTree(root) { return CL.drawTree(root, { dx: 30, dy: 46, r: 13, pad: 18, below: 6 }); }
  T.treeFig = treeFig;

  var TRAV = { pre: "preorder", "in": "inorder", post: "postorder", level: "level order" };
  var RULE = {
    pre: "Preorder: visit the node, then its left subtree, then its right subtree (root, left, right).",
    "in": "Inorder: the left subtree, then the node, then the right subtree (left, root, right).",
    post: "Postorder: the left subtree, then the right subtree, then the node (left, right, root).",
    level: "Level order: the root, then every node on level 1 from left to right, then level 2, and so on (a queue does this)."
  };
  // "10 [40 [30]] [25 [50] [20]]": each bracket is a subtree, traversed by the same rule
  function brackets(n, kind) {
    if (!n) return "";
    var L = n.left ? "[" + brackets(n.left, kind) + "]" : "", R = n.right ? "[" + brackets(n.right, kind) + "]" : "";
    var parts = kind === "pre" ? [n.key, L, R] : kind === "in" ? [L, n.key, R] : [L, R, n.key];
    return parts.filter(function (x) { return x !== ""; }).join(" ");
  }
  function levels(root) {
    var out = [];
    (function w(n, d) { if (!n) return; (out[d] = out[d] || []); w(n.left, d + 1); w(n.right, d + 1); })(root, 0);
    var q = root ? [[root, 0]] : [];
    out = [];
    while (q.length) { var x = q.shift(); (out[x[1]] = out[x[1]] || []).push(x[0].key); if (x[0].left) q.push([x[0].left, x[1] + 1]); if (x[0].right) q.push([x[0].right, x[1] + 1]); }
    return out;
  }
  function travSteps(root, kind) {
    if (kind === "level") return levels(root).map(function (l, d) { return "Level " + d + ": " + l.join(" "); }).join("<br>");
    return "Split the tree into subtrees. Each [ ] is a subtree, traversed with the same rule:<br>" + code(brackets(root, kind));
  }
  T.RULE = RULE;
  T.TRAV = TRAV;

  // ---- binary trees
  add({ id: "bt-trav", topic: "trees", title: "Traverse a binary tree", marks: 1, make: function (r) {
    var n = r.int(6, 9), root = randTree(r, n, keysFor(r, n)), kind = r.pick(["pre", "in", "post", "level"]);
    var s = seq(root, kind);
    var wrong = ["pre", "in", "post", "level"].filter(function (k) { return k !== kind; }).map(function (k) { return seq(root, k).join(" "); });
    wrong.unshift(seq(mirror(root), kind).join(" "));
    return {
      text: "What is the <b>" + TRAV[kind] + "</b> traversal of this binary tree?",
      fig: treeFig(root), ctx: "The binary tree, written as key(left,right): " + spec(root),
      type: "seq", answer: s.join(" "), wrong: r.shuffle(wrong), more: seqMore(s),
      hint: RULE[kind],
      steps: [RULE[kind], travSteps(root, kind), "Answer: " + b(s.join(" "))],
      lab: { id: "traversal", preset: { spec: spec(root), kind: kind } }
    };
  } });

  add({ id: "bt-props", topic: "trees", title: "Tree measurements", marks: 1, make: function (r) {
    var n = r.int(7, 10), root = randTree(r, n, keysFor(r, n)), all = nodesPre(root);
    var leaves = all.filter(function (x) { return !x.left && !x.right; }), branch = all.filter(function (x) { return x.left || x.right; });
    var h = height(root), kind = r.pick(["moment", "weight", "height", "depth", "degree", "branch", "parent"]);
    var x = r.pick(all.slice(1)), dx = depthOf(root, x), deg = (x.left ? 1 : 0) + (x.right ? 1 : 0);
    var Q = {
      moment: ["What is the <b>moment</b> of this tree?", n, [n - 1, n + 1, leaves.length], "The moment is the number of nodes. Count them: " + all.map(function (y) { return y.key; }).join(", ") + ", so the moment is " + n + "."],
      weight: ["What is the <b>weight</b> of this tree?", leaves.length, [branch.length, leaves.length + 1, n], "The weight is the number of leaves (nodes with no children): " + leaves.map(function (y) { return y.key; }).join(", ") + ". There are " + leaves.length + "."],
      height: ["What is the <b>height</b> of this tree?", h, [h + 1, h - 1, n], "The height is the number of edges on the longest path from the root down to a leaf. The deepest leaf is " + h + " edges below the root, so the height is " + h + ". (Counting nodes instead of edges would give " + (h + 1) + ".)"],
      depth: ["What is the <b>level</b> (depth) of the node " + x.key + "?", dx, [dx + 1, dx - 1, h - dx], "The level of a node is the number of edges from the root to it. The root is at level 0. From " + root.key + " down to " + x.key + " takes " + dx + " edge" + (dx === 1 ? "" : "s") + "."],
      degree: ["What is the <b>degree</b> of the node " + x.key + "?", deg, [0, 1, 2, 3].filter(function (v) { return v !== deg; }), "The degree of a node is the number of children it has. " + x.key + " has " + (deg === 0 ? "no children" : deg === 1 ? "one child (" + (x.left || x.right).key + ")" : "two children (" + x.left.key + " and " + x.right.key + ")") + ", so its degree is " + deg + "."],
      branch: ["How many <b>branch</b> (nonterminal) nodes does this tree have?", branch.length, [leaves.length, branch.length + 1, branch.length - 1], "A branch node has at least one child: " + branch.map(function (y) { return y.key; }).join(", ") + ". That makes " + branch.length + "."],
      parent: ["Which node is the <b>parent</b> of " + x.key + "?", x.parent.key, [x.parent.parent ? x.parent.parent.key : null, x.left ? x.left.key : null, x.right ? x.right.key : null, (x.parent.left === x ? x.parent.right : x.parent.left) ? (x.parent.left === x ? x.parent.right : x.parent.left).key : null, root.key], "The parent is the node directly above " + x.key + ", joined to it by one edge: " + x.parent.key + "."]
    }[kind];
    return {
      text: Q[0], fig: treeFig(root), ctx: "Tree: " + spec(root), type: "num", answer: String(Q[1]), wrong: Q[2],
      more: kind === "parent" ? function (rr) { return rr.pick(all).key; } : numMore(Q[1]),
      hint: "Height and level count edges, not nodes. Moment = number of nodes, weight = number of leaves.",
      steps: [Q[3]]
    };
  } });

  // the course's three shapes: complete, almost complete, full
  function isFull(n) { if (!n) return true; if (!n.left !== !n.right) return false; return isFull(n.left) && isFull(n.right); }
  function isComplete(n) { var h = height(n); return isFull(n) && count(n) === Math.pow(2, h + 1) - 1; }
  function isAlmost(root) {
    var maxPos = 0, cnt = 0;
    (function w(x, p) { if (!x) return; cnt++; maxPos = Math.max(maxPos, p); w(x.left, 2 * p); w(x.right, 2 * p + 1); })(root, 1);
    return maxPos === cnt;
  }
  T.isFull = isFull; T.isComplete = isComplete; T.isAlmost = isAlmost;
  function heapShape(n, keys) {
    var nodes = [null];
    for (var i = 1; i <= n; i++) { nodes.push(node(keys[i - 1])); if (i > 1) { var p = nodes[i >> 1]; if (i % 2 === 0) p.left = nodes[i]; else p.right = nodes[i]; } }
    return nodes[1];
  }
  var SHAPES = ["It is complete", "It is almost complete and full, but not complete", "It is almost complete but not full", "It is full but not almost complete", "It is neither full nor almost complete"];
  function shapeOf(root) { return isComplete(root) ? 0 : isAlmost(root) && isFull(root) ? 1 : isAlmost(root) ? 2 : isFull(root) ? 3 : 4; }
  add({ id: "bt-shape", topic: "trees", title: "Complete, almost complete or full?", marks: 2, make: function (r) {
    var want = r.int(0, 4), root = null, n;
    for (var t = 0; t < 300 && !root; t++) {
      if (want === 0) { n = r.pick([7, 15]); root = heapShape(n, keysFor(r, n)); }
      else if (want === 1) { n = r.pick([9, 11, 13]); root = heapShape(n, keysFor(r, n)); }
      else if (want === 2) { n = r.pick([6, 8, 10, 12]); root = heapShape(n, keysFor(r, n)); }
      else {
        n = r.int(5, 9);
        var cand = want === 3 ? fullTree(r, n % 2 ? n : n + 1) : randTree(r, n, keysFor(r, n));
        if (shapeOf(cand) === want && height(cand) <= 4) root = cand;
      }
      if (root && shapeOf(root) !== want) root = null;
    }
    if (!root) root = CL.parseTreeSpec(["40(20(10,30),60(50,70))", "40(20(10,30),60(50,70(65,80)))", "40(20(10,30),60(50))", "40(20,60(50,70))", "40(20(,30),60(50))"][want]);
    var others = r.shuffle([0, 1, 2, 3, 4].filter(function (k) { return k !== want; })).slice(0, 3);
    var opts = r.shuffle([want].concat(others));
    var why = [
      "Every non-leaf node has two children and all the leaves are on the same level, so it is complete (and therefore also full and almost complete).",
      "Every level except the lowest is full and the lowest level is packed to the left, so it is almost complete. Every non-leaf node has two children, so it is full. The leaves are not all on one level, so it is not complete.",
      "Every level except the lowest is full and the lowest level is packed to the left, so it is almost complete. But one node has only one child, so it is not full.",
      "Every non-leaf node has two children, so it is full. But a level above the lowest has a gap, or the lowest level is not packed to the left, so it is not almost complete.",
      "Some node has only one child, so it is not full. The levels also have a gap (or the lowest level is not packed left), so it is not almost complete either."
    ];
    return {
      text: "Which statement about this binary tree is true?", fig: treeFig(root), ctx: "Tree: " + spec(root),
      type: "choice", options: opts.map(function (k) { return SHAPES[k]; }), answer: opts.indexOf(want),
      hint: "Complete: every non-leaf has two subtrees and all leaves are on the same level. Almost complete: every level full except possibly the lowest, which is filled from the left. Full: no node has exactly one child.",
      steps: [why[want]]
    };
  } });
  function fullTree(r, n) {
    var keys = keysFor(r, n), root = node(keys[0]), leaves = [root], k = 1;
    while (k + 1 < n) {
      var lf = leaves.splice(r.int(0, leaves.length - 1), 1)[0];
      lf.left = node(keys[k++]); lf.right = node(keys[k++]);
      leaves.push(lf.left, lf.right);
    }
    return root;
  }

  add({ id: "bt-rebuild", topic: "trees", title: "Rebuild a tree from two traversals", marks: 2, make: function (r) {
    var n = r.int(6, 8), root = randTree(r, n, keysFor(r, n)), pre = seq(root, "pre"), ino = seq(root, "in"), post = seq(root, "post");
    var steps = [];
    (function rec(preS, inS) {
      if (inS.length <= 1) return;
      var k = preS[0], at = inS.indexOf(k), L = inS.slice(0, at), R = inS.slice(at + 1);
      steps.push("Root " + b(k) + " (first in the preorder of this part). Left of it in the inorder: " + (L.length ? code(L.join(" ")) : "nothing") + ". Right of it: " + (R.length ? code(R.join(" ")) : "nothing") + ".");
      rec(preS.slice(1, 1 + L.length), L);
      rec(preS.slice(1 + L.length), R);
    })(pre, ino);
    var swapped = clone(root);
    var t = swapped.left; swapped.left = swapped.right; swapped.right = t;
    return {
      text: "A binary tree has preorder " + code(pre.join(" ")) + " and inorder " + code(ino.join(" ")) + ". What is its <b>postorder</b>?",
      ctx: "Preorder " + pre.join(" ") + ", inorder " + ino.join(" ") + ". The tree is " + spec(root),
      type: "seq", answer: post.join(" "), wrong: [{ v: pre.slice().reverse().join(" "), why: "That is the preorder written backwards. Postorder does put the root last, but each subtree is still visited left first: rebuild the tree, then traverse it." },
        { v: seq(swapped, "post").join(" "), why: "That visits the right subtree before the left one. Postorder is left, right, root." },
        { v: seq(root, "level").join(" "), why: "That is the level order (row by row), not postorder." },
        { v: ino.slice().reverse().join(" "), why: "That is the inorder written backwards, which is not a traversal order of this tree." }], more: seqMore(post),
      hint: "The preorder's first key is the root. In the inorder, everything before the root is the left subtree and everything after it is the right subtree.",
      steps: steps.concat(["So the tree is:" + treeFig(root), "Its postorder (left, right, root) is " + b(post.join(" ")) + "."]),
      lab: { id: "traversal", preset: { spec: spec(root), kind: "post" } }
    };
  } });

  // recursive tree functions: the code is shown, the answer is worked out here (and checked against the interpreter by dev tests)
  var TREE_FN = [
    { code: "int f (BTNode * root) {\n\tif (root == NULL)\n\t\treturn 0;\n\tif (root->left == NULL && root->right == NULL)\n\t\treturn root->data;\n\treturn f (root->left) + f (root->right);\n}", call: "f (root)",
      val: function (t) { var s = 0; nodesPre(t).forEach(function (x) { if (!x.left && !x.right) s += x.key; }); return s; },
      say: "It adds up the data in the leaves.", alt: function (t) { var s = 0; nodesPre(t).forEach(function (x) { s += x.key; }); return [s]; } },
    { code: "int f (BTNode * root) {\n\tif (root == NULL)\n\t\treturn 0;\n\tint here = 0;\n\tif (root->left != NULL && root->right != NULL)\n\t\there = 1;\n\treturn here + f (root->left) + f (root->right);\n}", call: "f (root)",
      val: function (t) { return nodesPre(t).filter(function (x) { return x.left && x.right; }).length; },
      say: "It counts the nodes that have two children.", alt: function (t) { var all = nodesPre(t); return [all.filter(function (x) { return x.left || x.right; }).length, all.filter(function (x) { return !x.left && !x.right; }).length]; } },
    { code: "int f (BTNode * root) {\n\tif (root == NULL)\n\t\treturn -1;\n\tint a = f (root->left);\n\tint b = f (root->right);\n\tif (a > b)\n\t\treturn a + 1;\n\treturn b + 1;\n}", call: "f (root)",
      val: function (t) { return height(t); }, say: "It works out the height of the tree (an empty tree gives −1, a single node gives 0).", alt: function (t) { return [height(t) + 1, count(t)]; } },
    { code: "int f (BTNode * root) {\n\tif (root == NULL)\n\t\treturn 0;\n\treturn root->data + f (root->left);\n}", call: "f (root)",
      val: function (t) { var s = 0; for (var x = t; x; x = x.left) s += x.key; return s; },
      say: "It only ever goes left, so it adds the data on the path from the root down the left edge.", alt: function (t) { var s = 0; for (var x = t; x; x = x.right) s += x.key; return [s, t.key]; } },
    { code: "int f (BTNode * root, int level) {\n\tif (root == NULL)\n\t\treturn 0;\n\tif (level == 0)\n\t\treturn 1;\n\treturn f (root->left, level - 1) + f (root->right, level - 1);\n}", call: "f (root, 2)",
      val: function (t) { return (levels(t)[2] || []).length; }, say: "It counts the nodes on level 2 (two edges below the root).", alt: function (t) { var L = levels(t); return [(L[1] || []).length, (L[3] || []).length, (L[2] || []).length + (L[1] || []).length]; } },
    { code: "int f (BTNode * root) {\n\tif (root == NULL)\n\t\treturn 0;\n\tint m = root->data;\n\tint a = f (root->left);\n\tint b = f (root->right);\n\tif (a > m)\n\t\tm = a;\n\tif (b > m)\n\t\tm = b;\n\treturn m;\n}", call: "f (root)",
      val: function (t) { return Math.max.apply(null, nodesPre(t).map(function (x) { return x.key; })); }, say: "It returns the largest data value in the tree.", alt: function (t) { return [t.key, Math.min.apply(null, nodesPre(t).map(function (x) { return x.key; }))]; } },
    { code: "void f (BTNode * root) {\n\tif (root == NULL)\n\t\treturn;\n\tf (root->right);\n\tcout << root->data << \" \";\n\tf (root->left);\n}", call: "f (root)", out: true,
      val: function (t) { return seq(t, "in").slice().reverse().join(" "); }, say: "It is inorder with the two sides swapped: right subtree, node, left subtree.", alt: function (t) { return [seq(t, "in").join(" "), seq(t, "pre").join(" "), seq(mirror(t), "pre").join(" ")]; } },
    { code: "int f (BTNode * root) {\n\tif (root == NULL)\n\t\treturn 0;\n\tif (root->data % 2 == 0)\n\t\treturn 1 + f (root->left) + f (root->right);\n\treturn f (root->left) + f (root->right);\n}", call: "f (root)",
      val: function (t) { return nodesPre(t).filter(function (x) { return x.key % 2 === 0; }).length; }, say: "It counts the nodes whose data is even.", alt: function (t) { var all = nodesPre(t); return [all.filter(function (x) { return x.key % 2; }).length, all.length]; } }
  ];
  T.TREE_FN = TREE_FN;
  add({ id: "bt-code", topic: "trees", title: "Trace a recursive tree function", marks: 2, make: function (r) {
    var n = r.int(6, 8), root = randTree(r, n, keysFor(r, n)), k = r.int(0, TREE_FN.length - 1), F = TREE_FN[k], v = F.val(root);
    return {
      text: (F.out ? "What does " + code(F.call) + " print" : "What does " + code(F.call) + " return") + " for this tree?",
      fig: treeFig(root), code: F.code, ctx: "Tree: " + spec(root) + "\nFunction:\n" + F.code, fnIndex: k,
      type: F.out ? "seq" : "num", answer: String(v), wrong: F.alt(root).map(String), more: F.out ? seqMore(String(v).split(" ")) : numMore(+v),
      hint: "Work out what the function does on a small subtree first, then apply it to the whole tree.",
      steps: [F.say, "For this tree that gives " + b(String(v)) + "."]
    };
  } });

  // ---- binary search trees
  function insertSteps(keys) {
    var root = null, lines = [];
    keys.forEach(function (k) {
      if (!root) { root = node(k); lines.push(k + " becomes the root."); return; }
      var x = root, path = [];
      for (;;) {
        if (k < x.key) { path.push(k + " &lt; " + x.key + " left"); if (!x.left) { x.left = node(k); x.left.parent = x; lines.push(k + ": " + path.join(", ") + ". It becomes the left child of " + x.key + "."); break; } x = x.left; }
        else { path.push(k + " &gt; " + x.key + " right"); if (!x.right) { x.right = node(k); x.right.parent = x; lines.push(k + ": " + path.join(", ") + ". It becomes the right child of " + x.key + "."); break; } x = x.right; }
      }
    });
    return lines;
  }
  T.insertSteps = insertSteps;
  add({ id: "bst-build", topic: "bst", title: "Build a BST from insertions", marks: 2, make: function (r) {
    var n = r.int(7, 9), B = randBST(r, n, 4), root = B.root, keys = B.keys;
    var kind = r.pick(["pre", "pre", "post", "level", "height", "leaves"]);
    var common = {
      text: "These keys are inserted, in this order, into an empty binary search tree: " + code(keys.join(", ")) + ". ",
      ctx: "Keys inserted in order: " + keys.join(", ") + ". The resulting BST is " + spec(root),
      hint: "Each key starts at the root and goes left if it is smaller, right if it is larger, until it reaches an empty spot. It always becomes a leaf.",
      lab: { id: "bst", preset: { keys: keys } }
    };
    var steps = insertSteps(keys).map(function (l) { return l; });
    var stepsHtml = ["Insert the keys one at a time:<br>" + steps.join("<br>"), "The finished tree:" + treeFig(root)];
    if (kind === "height" || kind === "leaves") {
      var lv = nodesPre(root).filter(function (x) { return !x.left && !x.right; }), h = height(root);
      var ans = kind === "height" ? h : lv.length;
      return Object.assign(common, {
        text: common.text + (kind === "height" ? "What is the <b>height</b> of the tree?" : "How many <b>leaves</b> does the tree have?"),
        type: "num", answer: String(ans), wrong: kind === "height" ? [h + 1, h - 1, n - 1] : [lv.length + 1, lv.length - 1, n - lv.length], more: numMore(ans),
        steps: stepsHtml.concat([kind === "height" ? "The longest path from the root to a leaf has " + h + " edges, so the height is " + h + "." : "The leaves are " + lv.map(function (x) { return x.key; }).join(", ") + ": " + lv.length + " of them."])
      });
    }
    var s = seq(root, kind), sorted = keys.slice().sort(function (a, c) { return a - c; });
    // the last key put on the wrong side: a typical slip
    var slip = CL.bstFrom(keys.slice(0, -1)), lastK = keys[keys.length - 1], p = slip, slipOk = false;
    while (p) { var nx = lastK < p.key ? p.left : p.right; if (!nx) break; p = nx; }
    if (p && lastK < p.key && !p.right) { p.right = node(lastK); slipOk = true; }
    else if (p && lastK > p.key && !p.left) { p.left = node(lastK); slipOk = true; }
    return Object.assign(common, {
      text: common.text + "What is the <b>" + TRAV[kind] + "</b> traversal of the tree?",
      type: "seq", answer: s.join(" "), wrong: [{ v: keys.join(" "), why: "That is the order the keys were inserted. Build the tree first, then traverse it." },
        { v: sorted.join(" "), why: "That is the keys in ascending order, which is the inorder traversal of a BST, not the " + TRAV[kind] + " traversal." },
        slipOk ? { v: seq(slip, kind).join(" "), why: "That tree has the last key on the wrong side. Compare a new key with every node on its path from the root, going left when it is smaller." } : null,
        { v: seq(root, kind === "pre" ? "level" : "pre").join(" "), why: kind === "pre" ? "That is the level order. Preorder visits a whole left subtree before the right one." : "That is the preorder (root, left, right)." },
        { v: seq(root, kind === "post" ? "pre" : "post").join(" "), why: kind === "post" ? "That is the preorder. Postorder puts the root last." : "That is the postorder (left, right, root)." }], more: seqMore(s),
      steps: stepsHtml.concat([RULE[kind], travSteps(root, kind), "Answer: " + b(s.join(" "))])
    });
  } });

  // the lecture's deleteBST on a copy of the tree; mode "pred" uses the inorder predecessor instead (a common mistake)
  function bstDelete(root, key, mode) {
    root = clone(root);
    var x = find(root, key);
    if (!x) return root;
    function relink(par, old, child) {
      if (!par) root = child; else if (par.left === old) par.left = child; else par.right = child;
      if (child) child.parent = par;
    }
    if (!x.left && !x.right) { relink(x.parent, x, null); return root; }
    if (!x.left || !x.right) { relink(x.parent, x, x.left || x.right); return root; }
    if (mode === "pred") { var p = x.left; while (p.right) p = p.right; x.key = p.key; relink(p.parent, p, p.left); return root; }
    var s = x.right; while (s.left) s = s.left;
    x.key = s.key;
    if (mode === "nocut") return root;
    relink(s.parent, s, s.right);
    return root;
  }
  T.bstDelete = bstDelete;
  add({ id: "bst-delete", topic: "bst", title: "Delete from a BST", marks: 2, make: function (r) {
    var B = randBST(r, r.int(8, 10), 4), root = B.root, all = nodesPre(root);
    var want = r.pick([1, 2, 3, 3, 3]);
    var pickFrom = all.filter(function (x) { return want === 1 ? !x.left && !x.right : want === 2 ? (!x.left) !== (!x.right) : x.left && x.right; });
    if (!pickFrom.length) pickFrom = all.filter(function (x) { return x.left && x.right; });
    var x = r.pick(pickFrom), key = x.key, cs = !x.left && !x.right ? 1 : x.left && x.right ? 3 : 2;
    var after = bstDelete(root, key), kind = r.chance(0.7) ? "pre" : "level", ans = seq(after, kind);
    var removed = seq(root, kind).filter(function (k) { return k !== key; });
    var subtreeGone = clone(root), sx = find(subtreeGone, key);
    if (sx.parent) { if (sx.parent.left === sx) sx.parent.left = null; else sx.parent.right = null; }
    var steps = [];
    if (cs === 1) steps.push("<b>Case 1:</b> " + key + " is a leaf, so its parent " + x.parent.key + " simply stops pointing to it.");
    else if (cs === 2) steps.push("<b>Case 2(" + (x.left ? "b" : "a") + "):</b> " + key + " has only a " + (x.left ? "left" : "right") + " subtree (rooted at " + (x.left || x.right).key + "). That subtree moves up to take " + key + "'s place" + (x.parent ? ", connected to " + x.parent.key : " as the new root") + ".");
    else {
      var s = x.right; while (s.left) s = s.left;
      steps.push("<b>Case 3:</b> " + key + " has two subtrees. Its inorder successor is the smallest key in its right subtree: go right to " + x.right.key + ", then left as far as possible, reaching " + b(s.key) + ".");
      steps.push("Copy " + s.key + " into the node that held " + key + ", then remove the old " + s.key + " node by connecting its parent (" + s.parent.key + (s.parent === x ? ", which is the node being changed" : "") + ") to its right subtree" + (s.right ? " (" + s.right.key + ")" : " (NULL)") + ".");
    }
    steps.push("The tree after the deletion:" + treeFig(after));
    steps.push("Its " + TRAV[kind] + " traversal: " + b(ans.join(" ")) + ".");
    return {
      text: "Delete " + b(key) + " from this binary search tree using the lecture's method (Case 3 uses the <b>inorder successor</b>). What is the " + TRAV[kind] + " traversal afterwards?",
      fig: treeFig(root), ctx: "BST: " + spec(root) + ". Delete " + key + ".",
      type: "seq", answer: ans.join(" "), wrong: [{ v: seq(bstDelete(root, key, "pred"), kind).join(" "), why: "That uses the inorder predecessor (the largest key on the left). The lecture's method copies the inorder successor, the smallest key in the right subtree." },
        { v: removed.join(" "), why: "That just crosses " + key + " out of the old traversal. Deleting changes the shape of the tree, so draw the tree after the deletion and traverse it again." },
        { v: seq(bstDelete(root, key, "nocut"), kind).join(" "), why: "That copies the successor's key but never removes the old successor node, so its key appears twice." },
        { v: seq(subtreeGone, kind).join(" "), why: "That removes " + key + "'s whole subtree. Only one node is deleted: its subtrees stay in the tree." }], more: seqMore(ans),
      hint: "Case 1: a leaf is removed. Case 2: a node with one subtree is replaced by that subtree. Case 3: copy the inorder successor's key in, then remove the successor (it has no left subtree).",
      steps: steps,
      lab: { id: "bst", preset: { keys: seq(root, "pre"), op: "del", key: key } }
    };
  } });

  var SUCC_ALG = "if right(x) is not null {\n\tp = right(x)\n\twhile left(p) is not null\n\t\tp = left(p)\n\treturn p\n}\nelse {\n\ty = parent(x)\n\twhile y is not null and x == right(y) {\n\t\tx = y\n\t\ty = parent(y)\n\t}\n\treturn y\n}";
  add({ id: "bst-succ", topic: "bst", title: "Inorder successor and predecessor", marks: 2, make: function (r) {
    var B = randBST(r, r.int(8, 10), 4), root = B.root, all = nodesPre(root), ino = seq(root, "in");
    var x = r.pick(all), pred = r.chance(0.3), at = ino.indexOf(x.key), ans = pred ? ino[at - 1] : ino[at + 1];
    var ansS = ans === undefined ? "NULL" : String(ans), useAlg = !pred && r.chance(0.5);
    var side = pred ? "left" : "right", steps = [];
    if (x[side]) {
      var p = x[side], path = [p.key];
      while (pred ? p.right : p.left) { p = pred ? p.right : p.left; path.push(p.key); }
      steps.push(x.key + " has a " + side + " subtree, so the " + (pred ? "predecessor" : "successor") + " is the " + (pred ? "largest" : "smallest") + " key in it: go " + side + " to " + x[side].key + ", then " + (pred ? "right" : "left") + " as far as possible: " + path.join(" → ") + ".");
    } else {
      var c = x, y = x.parent, up = [];
      while (y && c === y[side]) { up.push(c.key + " is the " + side + " child of " + y.key + ", so go up"); c = y; y = y.parent; }
      steps.push(x.key + " has no " + side + " subtree, so walk up the parent pointers. " + (up.length ? up.join("; ") + ". " : "") + (y ? c.key + " is the " + (pred ? "right" : "left") + " child of " + y.key + ", so stop there." : "We walked past the root, so there is no " + (pred ? "predecessor" : "successor") + ": the answer is NULL."));
    }
    steps.push("Check with the inorder traversal: " + code(ino.join(" ")) + ". The key " + (pred ? "before" : "after") + " " + x.key + " is " + b(ansS) + ".");
    var wrong = [x.parent ? x.parent.key : null, x.right ? x.right.key : null, x.left ? x.left.key : null, pred ? ino[at + 1] : ino[at - 1], ansS === "NULL" ? root.key : "NULL"];
    var label = useAlg ? function (v) { return v === "NULL" || v === undefined || v === null ? "null" : "The node containing " + v; } : function (v) { return v === undefined || v === null ? null : String(v); };
    return {
      text: useAlg ? "Consider this algorithm. What does it return if it is given the node containing " + b(x.key) + " of the binary search tree below?" : "What is the inorder <b>" + (pred ? "predecessor" : "successor") + "</b> of " + b(x.key) + " in this binary search tree? (Write NULL if there is none.)",
      code: useAlg ? SUCC_ALG : null, codeLang: "text", fig: treeFig(root), ctx: "BST: " + spec(root) + ". Node: " + x.key,
      type: "text", answer: label(ansS), wrong: wrong.filter(function (v) { return v !== undefined && v !== null; }).map(function (v) { return label(String(v)); }),
      more: function (rr) { return label(String(rr.pick(ino))); },
      hint: "Successor: if there is a right subtree, take its smallest key; otherwise go up until you arrive from a left child.",
      steps: steps,
      lab: { id: "bst", preset: { keys: seq(root, "pre"), op: pred ? "pred" : "succ", key: x.key } }
    };
  } });

  add({ id: "bst-search", topic: "bst", title: "Search path in a BST", marks: 1, make: function (r) {
    var B = randBST(r, r.int(8, 10), 4), root = B.root, ino = seq(root, "in"), present = r.chance(0.6), key;
    if (present) key = r.pick(ino);
    else { do { key = r.int(1, 99); } while (ino.indexOf(key) >= 0); }
    var path = [], x = root;
    while (x) { path.push(x.key); if (x.key === key) break; x = key < x.key ? x.left : x.right; }
    var asCount = r.chance(0.35);
    var steps = path.map(function (k, i) { return k === key ? "Compare with " + k + ": found." : "Compare with " + k + ": " + key + (key < k ? " &lt; " : " &gt; ") + k + ", go " + (key < k ? "left" : "right") + (i === path.length - 1 ? ", which is NULL: " + key + " is not in the tree." : "."); });
    var other = root.left && root.right ? seq(key < root.key ? root.right : root.left, "pre").slice(0, path.length - 1) : [];
    return {
      text: asCount ? "How many nodes are compared with the key when searching for " + b(key) + " in this BST?" : "Which keys are compared, in order, when searching for " + b(key) + " in this BST?",
      fig: treeFig(root), ctx: "BST: " + spec(root) + ". Search for " + key,
      type: asCount ? "num" : "seq", answer: asCount ? String(path.length) : path.join(" "),
      wrong: asCount ? [path.length + 1, path.length - 1, height(root) + 1] : [[root.key].concat(other).join(" "), ino.slice(0, Math.max(2, ino.indexOf(key) + 1)).join(" "), path.slice(1).join(" "), seq(root, "pre").slice(0, path.length).join(" ")],
      more: asCount ? numMore(path.length, 1) : seqMore(path),
      hint: "Start at the root. Smaller: go left. Larger: go right. Stop when you find the key or reach NULL.",
      steps: steps,
      lab: { id: "bst", preset: { keys: B.keys, op: "search", key: key } }
    };
  } });

  function randomOrder(root, r) {
    var out = [], frontier = [root];
    while (frontier.length) { var i = r.int(0, frontier.length - 1), x = frontier.splice(i, 1)[0]; out.push(x.key); if (x.left) frontier.push(x.left); if (x.right) frontier.push(x.right); }
    return out;
  }
  add({ id: "bst-order", topic: "bst", title: "Which insertion order makes this BST?", marks: 2, make: function (r) {
    var B = randBST(r, r.int(6, 7), 3), root = B.root, target = spec(root);
    var right = randomOrder(root, r), cands = [seq(root, "in"), seq(root, "post"), seq(root, "level").slice().reverse(), seq(root, "in").slice().reverse()];
    for (var t = 0; t < 30; t++) { var c = right.slice(), i = r.int(0, c.length - 2), j = r.int(i + 1, c.length - 1), tt = c[i]; c[i] = c[j]; c[j] = tt; cands.push(c); }
    var wrong = [], seen = {};
    seen[right.join(" ")] = 1;
    cands.forEach(function (c) { var k = c.join(" "); if (wrong.length < 3 && !seen[k] && spec(CL.bstFrom(c)) !== target) { seen[k] = 1; wrong.push(c); } });
    var opts = r.shuffle([right].concat(wrong));
    return {
      text: "Inserting which sequence of keys into an empty BST produces this tree?", fig: treeFig(root), ctx: "BST: " + target,
      type: "choice", options: opts.map(function (o) { return o.join(", "); }), answer: opts.indexOf(right), wide: true,
      hint: "A key must be inserted after every one of its ancestors (the root first). Check each option by inserting it.",
      steps: ["Every node must come after all of its ancestors, because a key can only hang below keys that are already in the tree. So the root, " + root.key + ", must come first.", "Inserting " + right.join(", ") + " gives the tree shown. Each of the other orders puts some key in a different place (try them in the BST Lab)."],
      lab: { id: "bst", preset: { keys: right } }
    };
  } });

  function isBST(n, lo, hi) { if (!n) return true; if ((lo !== null && n.key <= lo) || (hi !== null && n.key >= hi)) return false; return isBST(n.left, lo, n.key) && isBST(n.right, n.key, hi); }
  T.isBST = function (n) { return isBST(n, null, null); };
  add({ id: "bst-valid", topic: "bst", title: "Spot the binary search tree", marks: 2, make: function (r) {
    var B = randBST(r, r.int(6, 7), 3), root = B.root, keys = seq(root, "in"), bad = [], guard = 0;
    while (bad.length < 3 && guard++ < 400) {
      var c = clone(root), all = nodesPre(c), x = r.pick(all.slice(1)), v = r.int(1, 99);
      if (keys.indexOf(v) >= 0) continue;
      x.key = v;
      var p = x.parent, local = (p.left === x ? v < p.key : v > p.key) && (!x.left || x.left.key < v) && (!x.right || x.right.key > v);
      if (!local && r.chance(0.7)) continue;
      if (isBST(c, null, null)) continue;
      var sp = spec(c);
      if (bad.some(function (o) { return spec(o) === sp; })) continue;
      bad.push(c);
    }
    var opts = r.shuffle([root].concat(bad));
    return {
      text: "Which of these is a binary search tree?",
      ctx: "Options: " + opts.map(function (o, i) { return (i + 1) + ") " + spec(o); }).join("; "),
      type: "choice", options: opts.map(function (o) { return '<div class="tq-mini">' + smallTree(o) + "</div>"; }), answer: opts.indexOf(root), grid: true,
      hint: "Every key in a node's left subtree must be smaller than it, and every key in its right subtree larger: not just its children, the whole subtree.",
      steps: ["Check each node against <b>all</b> its ancestors, not only its parent. A key deep in the left subtree of the root must still be smaller than the root.", "Only this tree passes that test everywhere. Its inorder traversal is sorted: " + code(seq(root, "in").join(" ")) + ". In each of the others, some key sits on the wrong side of an ancestor, so its inorder traversal is not sorted."]
    };
  } });

  // ---------------------------------------------------------------- heaps (index 1 to n)
  function heapify(A, i, n, isMax, log) {
    for (;;) {
      var l = 2 * i, rr = l + 1, best = i;
      if (l <= n && (isMax ? A[l] > A[best] : A[l] < A[best])) best = l;
      if (rr <= n && (isMax ? A[rr] > A[best] : A[rr] < A[best])) best = rr;
      if (best === i) { if (log) log.push("heapify(" + i + "): " + (l > n ? "A[" + i + "] = " + A[i] + " is a leaf (no children). Stop." : "A[" + i + "] = " + A[i] + " is already " + (isMax ? "at least as large as" : "no larger than") + " its children. Stop.")); return A; }
      if (log) log.push("heapify(" + i + "): the " + (isMax ? "largest" : "smallest") + " of A[" + i + "] = " + A[i] + (l <= n ? ", A[" + l + "] = " + A[l] : "") + (rr <= n ? ", A[" + rr + "] = " + A[rr] : "") + " is at " + best + ". Swap A[" + i + "] and A[" + best + "].");
      var t = A[i]; A[i] = A[best]; A[best] = t;
      i = best;
    }
  }
  function build(vals, isMax, log) { var A = [null].concat(vals), n = vals.length; for (var i = Math.floor(n / 2); i >= 1; i--) heapify(A, i, n, isMax, log); return A; }
  function insertHeap(A0, x, isMax, log) {
    var A = A0.slice(); A.push(x); var i = A.length - 1;
    if (log) log.push("Put " + x + " at the end, A[" + i + "].");
    while (i > 1 && (isMax ? A[i >> 1] < A[i] : A[i >> 1] > A[i])) {
      if (log) log.push("A[" + i + "] = " + A[i] + " is " + (isMax ? "larger" : "smaller") + " than its parent A[" + (i >> 1) + "] = " + A[i >> 1] + ": swap.");
      var t = A[i]; A[i] = A[i >> 1]; A[i >> 1] = t; i >>= 1;
    }
    if (log) log.push(i === 1 ? "It reached the root. Stop." : "A[" + i + "] = " + A[i] + " is not " + (isMax ? "larger" : "smaller") + " than its parent A[" + (i >> 1) + "] = " + A[i >> 1] + ". Stop.");
    return A;
  }
  function extract(A0, isMax, log) {
    var A = A0.slice(), n = A.length - 1, top = A[1];
    if (log) log.push("Save the root, " + top + ". Move the last value, A[" + n + "] = " + A[n] + ", to A[1], and shrink the heap to " + (n - 1) + " values.");
    A[1] = A[n]; A.pop();
    heapify(A, 1, n - 1, isMax, log);
    return A;
  }
  function isHeap(A, isMax) { for (var i = 2; i < A.length; i++) if (isMax ? A[i >> 1] < A[i] : A[i >> 1] > A[i]) return false; return true; }
  T.heap = { heapify: heapify, build: build, insert: insertHeap, extract: extract, isHeap: isHeap };
  function arr(A) { return A.slice(1).join(" "); }
  function heapFig(A) { var n = A.length - 1; return '<div class="tq-fig tq-row">' + CL.drawArray(A.map(function (v, i) { return i === 0 ? "" : v; }), { from: 1, to: n }) + CL.drawHeapTree(A, n, { dx: 38, dy: 52 }) + "</div>"; }
  T.heapFig = heapFig;

  add({ id: "heap-build", topic: "heaps", title: "buildHeap", marks: 2, make: function (r) {
    var n = r.int(7, 10), vals = r.distinct(n, 1, 60), isMax = r.chance(0.75), log = [], A = build(vals, isMax, log);
    var ins = [null]; vals.forEach(function (v) { ins = insertHeap(ins, v, isMax); });
    var up = [null].concat(vals); for (var i = 1; i <= Math.floor(n / 2); i++) heapify(up, i, n, isMax);
    var once = [null].concat(vals); heapify(once, 1, n, isMax);
    var srt = vals.slice().sort(function (a, c) { return isMax ? c - a : a - c; });
    var word = isMax ? "Max" : "Min";
    return {
      text: "These values are in A[1.." + n + "]: " + code(vals.join(" ")) + ". What is the array after <b>build" + word + "Heap</b>?",
      fig: '<div class="tq-fig">' + CL.drawArray([""].concat(vals), { from: 1, to: n }) + "</div>", ctx: "A[1.." + n + "] = " + vals.join(" ") + ", build" + word + "Heap",
      type: "seq", answer: arr(A), wrong: [{ v: arr(ins), why: "That inserts the values one at a time, moving each up. build" + word + "Heap instead calls heapify from n/2 down to 1, which can give a different (equally valid) heap." },
        { v: arr(up), why: "That calls heapify from 1 up to n/2. build" + word + "Heap goes the other way, from n/2 down to 1, so that both subtrees are already heaps when a node is fixed." },
        { v: arr(once), why: "That calls heapify only once, at the root. build" + word + "Heap calls it for every index from n/2 down to 1." },
        { v: srt.join(" "), why: "That is the values in sorted order. A heap only needs each parent to beat its children; it is not fully sorted." }], more: seqMore(A.slice(1)),
      hint: "buildHeap calls heapify on i = n / 2, n / 2 − 1, ..., 1: from the last non-leaf back to the root.",
      steps: ["n = " + n + ", so start at i = " + n + " / 2 = " + Math.floor(n / 2) + " and work back to 1.", log.join("<br>"), "Result: " + b(arr(A)) + heapFig(A)],
      lab: { id: "heap", preset: { vals: vals, kind: isMax ? "max" : "min", op: "build" } }
    };
  } });

  function randHeap(r, n, isMax) { return build(r.distinct(n, 1, 60), isMax); }
  add({ id: "heap-insert", topic: "heaps", title: "Insert into a heap", marks: 2, make: function (r) {
    var n = r.int(6, 9), A = randHeap(r, n, true), x;
    do { x = r.int(10, 80); } while (A.indexOf(x) >= 0);
    var log = [], R = insertHeap(A, x, true, log);
    var noBubble = A.concat([x]), one = A.concat([x]), last = one.length - 1;
    if (one[last >> 1] < x) { one[last] = one[last >> 1]; one[last >> 1] = x; }
    var top = A.slice(); top.splice(1, 0, x);
    return {
      text: "Insert " + b(x) + " into this max-heap with insertMaxHeap. What is the array afterwards?",
      fig: heapFig(A), ctx: "Max-heap A[1.." + n + "] = " + arr(A) + ". Insert " + x,
      type: "seq", answer: arr(R), wrong: [{ v: arr(noBubble), why: "That puts " + x + " at the end and stops. It must keep moving up while its parent is smaller." },
        { v: arr(one), why: "That moves " + x + " up only one level. Keep comparing with the new parent until the parent is larger or " + x + " reaches the root." },
        { v: arr(top), why: "That puts " + x + " at the root and shifts everything along, which breaks the parent/child positions. A new key starts at A[size + 1] and moves up." },
        { v: arr(build(A.slice(1).concat([x]), true)), why: "That rebuilds the whole heap with buildMaxHeap. Insert only moves the new key up its own path." }], more: seqMore(R.slice(1)),
      hint: "Put the new value in the next free slot (the end), then swap it with its parent while it is larger.",
      steps: [log.join("<br>"), "Result: " + b(arr(R)) + heapFig(R)],
      lab: { id: "heap", preset: { vals: A.slice(1), kind: "max", op: "insert", x: x } }
    };
  } });

  add({ id: "heap-extract", topic: "heaps", title: "Extract the maximum", marks: 2, make: function (r) {
    var n = r.int(7, 10), isMax = r.chance(0.8), A = randHeap(r, n, isMax), log = [], R = extract(A, isMax, log);
    var shift = [null].concat(A.slice(2));
    var noFix = A.slice(); noFix[1] = noFix[n]; noFix.pop();
    var wrongChild = A.slice(); wrongChild[1] = wrongChild[n]; wrongChild.pop(); heapify(wrongChild, 1, n - 1, !isMax);
    // promoting the better child into the hole, then putting the last value there
    var hole = A.slice(), i = 1, last = hole[n]; hole.pop();
    for (;;) { var l = 2 * i, rr = l + 1, m = n - 1; if (l > m) break; var c = rr <= m && (isMax ? hole[rr] > hole[l] : hole[rr] < hole[l]) ? rr : l; hole[i] = hole[c]; i = c; }
    hole[i] = last;
    if (i === n) hole = noFix;
    var word = isMax ? "Max" : "Min";
    return {
      text: "Call <b>heapExtract" + word + "</b> on this " + word.toLowerCase() + "-heap. What is the array afterwards?",
      fig: heapFig(A), ctx: word + "-heap A[1.." + n + "] = " + arr(A) + ". Extract the root.",
      type: "seq", answer: arr(R), wrong: [{ v: arr(shift), why: "That shifts every value one place left. heapExtract moves the LAST value to A[1], then lets it sink." },
        { v: arr(noFix), why: "That moves the last value to the root but never calls heapify, so the root may be smaller than its children." },
        { v: arr(wrongChild), why: "That swaps with the wrong child. In a " + word.toLowerCase() + "-heap, swap with the " + (isMax ? "larger" : "smaller") + " child." },
        { v: arr(hole), why: "That moves the best child up into the hole all the way down, then drops the last value at the bottom. The lecture's method puts the last value at the root and lets it sink only as far as needed." }], more: seqMore(R.slice(1)),
      hint: "Save A[1], move the last value to A[1], shrink the heap by one, then heapify(1).",
      steps: [log.join("<br>"), "Result: " + b(arr(R)) + " (and " + A[1] + " is returned)." + heapFig(R)],
      lab: { id: "heap", preset: { vals: A.slice(1), kind: isMax ? "max" : "min", op: "extract" } }
    };
  } });

  add({ id: "heap-sort", topic: "heaps", title: "Heap sort, a few passes in", marks: 2, make: function (r) {
    var n = r.int(6, 8), vals = r.distinct(n, 1, 60), k = r.int(1, 3), A = build(vals, true), log = ["After buildMaxHeap: " + code(arr(A))];
    var size = n, noFix = A.slice(), sz2 = n;
    for (var it = 0; it < k; it++) {
      var t = A[1]; A[1] = A[size]; A[size] = t; size--;
      heapify(A, 1, size, true);
      log.push("Pass " + (it + 1) + ": swap A[1] with A[" + (size + 1) + "], so " + A[size + 1] + " is in its final place; the heap shrinks to " + size + "; heapify(1) gives " + code(arr(A)) + ".");
      var t2 = noFix[1]; noFix[1] = noFix[sz2]; noFix[sz2] = t2; sz2--;
    }
    var more1 = A.slice(), s3 = size; if (s3 >= 2) { var t3 = more1[1]; more1[1] = more1[s3]; more1[s3] = t3; s3--; heapify(more1, 1, s3, true); }
    var raw = [null].concat(vals); for (var it2 = 0, s4 = n; it2 < k; it2++) { var t4 = raw[1]; raw[1] = raw[s4]; raw[s4] = t4; s4--; heapify(raw, 1, s4, true); }
    return {
      text: "Heap sort (version 2) runs on A[1.." + n + "] = " + code(vals.join(" ")) + ". It builds a max-heap, then each pass of its loop swaps A[1] with the last value of the heap, shrinks the heap and calls heapify(1). What is the array after <b>" + k + " pass" + (k > 1 ? "es" : "") + "</b> of the loop?",
      ctx: "A = " + vals.join(" ") + ", heap sort, after " + k + " passes",
      type: "seq", answer: arr(A), wrong: [arr(noFix), arr(more1), arr(raw), vals.slice().sort(function (a, c) { return a - c; }).join(" ")], more: seqMore(A.slice(1)),
      hint: "First buildMaxHeap. Then each pass: swap the root with the last heap value, shrink the heap, heapify(1).",
      steps: log.concat(["Answer: " + b(arr(A))]),
      lab: { id: "heap", preset: { vals: vals, kind: "max", op: "sort" } }
    };
  } });

  add({ id: "heap-check", topic: "heaps", title: "Which array is a max-heap?", marks: 1, make: function (r) {
    var n = r.int(7, 9), A = randHeap(r, n, true), bad = [], seen = {}, guard = 0;
    seen[arr(A)] = 1;
    while (bad.length < 3 && guard++ < 200) {
      var c, kind = r.int(0, 3);
      if (kind === 0) { c = A.slice(); var i = r.int(2, n); var t = c[i]; c[i] = c[i >> 1]; c[i >> 1] = t; }
      else if (kind === 1) c = build(A.slice(1), false);
      else if (kind === 2) c = [null].concat(A.slice(1).sort(function (a, b2) { return a - b2; }));
      else { c = A.slice(); var x = r.int(2, n), y = r.int(2, n); var t2 = c[x]; c[x] = c[y]; c[y] = t2; }
      if (isHeap(c, true) || seen[arr(c)]) continue;
      seen[arr(c)] = 1;
      bad.push(c);
    }
    var opts = r.shuffle([A].concat(bad));
    return {
      text: "Which of these arrays (A[1], A[2], ...) is a <b>max-heap</b>?", ctx: "Options: " + opts.map(arr).join(" | "),
      type: "choice", options: opts.map(arr), answer: opts.indexOf(A), wide: true,
      hint: "Check every parent: A[i / 2] must be at least A[i] for every i from 2 to n.",
      steps: ["In a max-heap every parent is at least as large as its children: A[i / 2] ≥ A[i] for every i ≥ 2.", "Only " + code(arr(A)) + " passes that test at every index." + heapFig(A), "Each of the others has a child larger than its parent somewhere."]
    };
  } });

  add({ id: "heap-index", topic: "heaps", title: "Heap index arithmetic", marks: 1, make: function (r) {
    var kind = r.int(0, 4), i = r.int(3, 40), n = r.int(9, 60), lg = Math.floor(Math.log2(n));
    var Q = [
      ["A heap is stored in A[1..n]. What is the index of the <b>parent</b> of A[" + i + "]?", Math.floor(i / 2), [Math.floor((i - 1) / 2), Math.ceil(i / 2) + (i % 2 ? 0 : 1), 2 * i], "The parent of index i is i / 2 (integer division): " + i + " / 2 = " + Math.floor(i / 2) + "."],
      ["A heap is stored in A[1..n]. What is the index of the <b>right child</b> of A[" + i + "]?", 2 * i + 1, [2 * i, 2 * i + 2, i + 1], "The children of index i are 2i (left) and 2i + 1 (right): 2 × " + i + " + 1 = " + (2 * i + 1) + "."],
      ["A heap has " + n + " values in A[1.." + n + "]. buildHeap starts heapify at which index?", Math.floor(n / 2), [Math.floor(n / 2) + 1, n, Math.ceil(n / 2) - (n % 2 ? 0 : 1) || 1], "Nodes after n / 2 are leaves, so the last node with a child is n / 2 = " + Math.floor(n / 2) + "."],
      ["How many <b>leaves</b> does a heap with " + n + " values have?", n - Math.floor(n / 2), [Math.floor(n / 2), Math.floor(n / 2) + 2, lg + 1], "Indexes 1 to n / 2 = " + Math.floor(n / 2) + " have children; the rest, " + (Math.floor(n / 2) + 1) + " to " + n + ", are leaves: " + (n - Math.floor(n / 2)) + " of them."],
      ["What is the <b>height</b> of a heap with " + n + " values?", lg, [lg + 1, lg - 1, Math.floor(n / 2)], "A heap is almost complete, so its height is ⌊log₂ n⌋: 2^" + lg + " = " + Math.pow(2, lg) + " ≤ " + n + " < " + Math.pow(2, lg + 1) + ", so the height is " + lg + "."]
    ][kind];
    return {
      text: Q[0], ctx: Q[0].replace(/<[^>]*>/g, ""), type: "num", answer: String(Q[1]), wrong: Q[2], more: numMore(Q[1], 1),
      hint: "For index i (starting at 1): parent i / 2, left child 2i, right child 2i + 1.", steps: [Q[3]]
    };
  } });

  add({ id: "heap-increase", topic: "heaps", title: "Increase a key", marks: 2, make: function (r) {
    var n = r.int(7, 10), A = randHeap(r, n, true), i = r.int(Math.floor(n / 2) + 1, n), x;
    do { x = r.int(A[i] + 5, 90); } while (A.indexOf(x) >= 0);
    var B0 = A.slice(); B0[i] = x;
    var log = ["Change A[" + i + "] from " + A[i] + " to " + x + "."], B = B0.slice(), j = i;
    while (j > 1 && B[j >> 1] < B[j]) { log.push("A[" + j + "] = " + B[j] + " is larger than its parent A[" + (j >> 1) + "] = " + B[j >> 1] + ": swap."); var t = B[j]; B[j] = B[j >> 1]; B[j >> 1] = t; j >>= 1; }
    log.push(j === 1 ? "It reached the root. Stop." : "Its parent is larger now. Stop.");
    var down = B0.slice(); heapify(down, i, n, true);
    var rebuilt = build(B0.slice(1), true);
    return {
      text: "Call increaseKeyMaxHeap to change A[" + i + "] to " + b(x) + " in this max-heap. What is the array afterwards?",
      fig: heapFig(A), ctx: "Max-heap " + arr(A) + ". increaseKey at index " + i + " to " + x,
      type: "seq", answer: arr(B), wrong: [arr(B0), arr(down), arr(rebuilt)], more: seqMore(B.slice(1)),
      hint: "A larger key can only be too large for its parent, so it moves up, exactly like insert.",
      steps: [log.join("<br>"), "Result: " + b(arr(B))],
      lab: { id: "heap", preset: { vals: A.slice(1), kind: "max", op: "increase", i: i, x: x } }
    };
  } });

  add({ id: "heap-heapify", topic: "heaps", title: "One call to maxHeapify", marks: 1, make: function (r) {
    var n = r.int(7, 10), A = build(r.distinct(n, 10, 70), true), i = r.int(1, Math.max(1, Math.floor(n / 2) - 1));
    var small = A.slice(); small[i] = r.int(1, 9);
    var log = [], R = small.slice(); heapify(R, i, n, true, log);
    var oneSwap = small.slice(), l = 2 * i, rr = l + 1, best = i;
    if (l <= n && oneSwap[l] > oneSwap[best]) best = l; if (rr <= n && oneSwap[rr] > oneSwap[best]) best = rr;
    var t = oneSwap[i]; oneSwap[i] = oneSwap[best]; oneSwap[best] = t;
    var leftOnly = small.slice(), j = i;
    while (2 * j <= n && leftOnly[2 * j] > leftOnly[j]) { var t2 = leftOnly[j]; leftOnly[j] = leftOnly[2 * j]; leftOnly[2 * j] = t2; j = 2 * j; }
    return {
      text: "In this array, the subtrees below index " + i + " are max-heaps, but A[" + i + "] = " + small[i] + " is too small. What is the array after <b>maxHeapify(" + i + ")</b>?",
      fig: heapFig(small), ctx: "A[1.." + n + "] = " + arr(small) + ". maxHeapify(" + i + ")",
      type: "seq", answer: arr(R), wrong: [arr(oneSwap), arr(leftOnly), arr(build(small.slice(1), true))], more: seqMore(R.slice(1)),
      hint: "Swap with the larger child, then keep going from where the value landed, until it is larger than both children.",
      steps: [log.join("<br>"), "Result: " + b(arr(R))],
      lab: { id: "heap", preset: { vals: small.slice(1), kind: "max", op: "heapify", i: i, load: true } }
    };
  } });
})(CL);
