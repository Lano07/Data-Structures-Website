/* COMP 2611 Code Lab — Tree Traversal Lab and BST Lab. */
(function (CL) {
  "use strict";
  var esc = CL.esc;

  // strip //@tag markers from code and map tag -> line number
  CL.tagCode = function (src) {
    var L = {};
    var lines = src.replace(/^\n/, "").split("\n").map(function (l, i) {
      var m = /\s*\/\/@(\w+)\s*$/.exec(l);
      if (m) { L[m[1]] = i + 1; return l.slice(0, m.index); }
      return l;
    });
    return { code: lines.join("\n"), L: L };
  };

  var TRAV_TREES = [
    { name: "Lecture 6, first tree", spec: "10(40(30),25(50,20))" },
    { name: "Lecture 6, second tree", spec: "10(40(30(50),25))" },
    { name: "Lecture 10 tree", spec: "20(17(5(,10),18),30(25,50(45,80)))" },
    { name: "BST with root 15", spec: "15(6(3(2,4),7(,13(9))),18(17,20))" }
  ];
  CL.TRAV_TREES = TRAV_TREES;

  var REC = {
    pre: CL.tagCode("void preOrder (BTNode * root) {      //@head\n\tif (root == NULL)                //@null\n\t\treturn;                      //@ret\n\tcout << root->data << \" \";      //@visit\n\tpreOrder (root->left);           //@left\n\tpreOrder (root->right);          //@right\n}                                    //@end"),
    "in": CL.tagCode("void inOrder (BTNode * root) {       //@head\n\tif (root == NULL)                //@null\n\t\treturn;                      //@ret\n\tinOrder (root->left);            //@left\n\tcout << root->data << \" \";      //@visit\n\tinOrder (root->right);           //@right\n}                                    //@end"),
    post: CL.tagCode("void postOrder (BTNode * root) {     //@head\n\tif (root == NULL)                //@null\n\t\treturn;                      //@ret\n\tpostOrder (root->left);          //@left\n\tpostOrder (root->right);         //@right\n\tcout << root->data << \" \";      //@visit\n}                                    //@end")
  };
  var LEVEL = CL.tagCode("void levelOrder (BTNode * root) {\n\tif (root == NULL)                   //@empty\n\t\treturn;\n\tQueue * q = initQueue ();           //@init\n\tenqueue (q, root);                  //@start\n\twhile (!isEmptyQueue (q)) {         //@loop\n\t\tBTNode * p = dequeue (q);       //@deq\n\t\tcout << p->data << \" \";         //@visit\n\t\tif (p->left != NULL)            //@hasl\n\t\t\tenqueue (q, p->left);       //@enql\n\t\tif (p->right != NULL)           //@hasr\n\t\t\tenqueue (q, p->right);      //@enqr\n\t}                                   //@endloop\n}");
  var FN = { pre: "preOrder", "in": "inOrder", post: "postOrder" };

  function travFrames(root, kind, showNull) {
    var frames = [], out = [], stack = [];
    function F(text, line, cur, extra) {
      frames.push(Object.assign({ text: text, line: line, cur: cur ? cur.id : null, out: out.slice(), stack: stack.slice() }, extra || {}));
    }
    if (kind === "level") {
      var q = [], C = LEVEL.L;
      if (!root) { F("The tree is empty, so nothing is printed.", C.empty, null, { q: [] }); return frames; }
      F("Make an empty queue.", C.init, null, { q: [] });
      q.push(root);
      F("Put the root, " + root.key + ", in the queue.", C.start, root, { q: q.map(k) });
      while (q.length) {
        F("The queue is not empty, so loop again.", C.loop, null, { q: q.map(k) });
        var p = q.shift();
        F("Take " + p.key + " from the front of the queue.", C.deq, p, { q: q.map(k) });
        out.push(p.key);
        F("Visit it: print " + p.key + ".", C.visit, p, { q: q.map(k), visited: true });
        if (p.left) { q.push(p.left); F("Its left child " + p.left.key + " goes to the back of the queue.", C.enql, p.left, { q: q.map(k) }); }
        else F(p.key + " has no left child.", C.hasl, p, { q: q.map(k) });
        if (p.right) { q.push(p.right); F("Its right child " + p.right.key + " goes to the back of the queue.", C.enqr, p.right, { q: q.map(k) }); }
        else F(p.key + " has no right child.", C.hasr, p, { q: q.map(k) });
      }
      F("The queue is empty, so the traversal is finished. Output: <code>" + out.join(" ") + "</code>", C.endloop, null, { q: [] });
      return frames;
    }
    var C2 = REC[kind].L, fn = FN[kind];
    function k(n) { return n.key; }
    function rec(n) {
      if (!n) {
        if (!showNull) return;
        stack.push("NULL");
        F("Call " + fn + "(NULL): this subtree is empty.", C2.null, null);
        F("root is NULL, so return straight away.", C2.ret, null);
        stack.pop();
        return;
      }
      stack.push(n.key);
      F("Call " + fn + "(" + n.key + ").", C2.head, n);
      if (kind === "pre") { out.push(n.key); F("Preorder visits the node <b>before</b> its subtrees: print " + n.key + ".", C2.visit, n, { visited: true }); }
      F("Now traverse the left subtree of " + n.key + (n.left ? " (it starts at " + n.left.key + ")." : " (it is empty)."), C2.left, n);
      rec(n.left);
      if (kind === "in") { out.push(n.key); F("Back at " + n.key + " after its left subtree. Inorder visits it now: print " + n.key + ".", C2.visit, n, { visited: true }); }
      F("Now traverse the right subtree of " + n.key + (n.right ? " (it starts at " + n.right.key + ")." : " (it is empty)."), C2.right, n);
      rec(n.right);
      if (kind === "post") { out.push(n.key); F("Both subtrees of " + n.key + " are done. Postorder visits it last: print " + n.key + ".", C2.visit, n, { visited: true }); }
      F(fn + "(" + n.key + ") is finished and returns to its caller.", C2.end, n);
      stack.pop();
    }
    rec(root);
    frames.push({ text: "Finished. " + fn + " printed <code>" + out.join(" ") + "</code>", line: 0, cur: null, out: out.slice(), stack: [] });
    return frames;
    function k2() { }
  }

  // the keys of a tree in traversal order
  function seqOf(root, kind) {
    var out = [];
    if (kind === "level") {
      var q = root ? [root] : [];
      while (q.length) { var p = q.shift(); out.push(p.key); if (p.left) q.push(p.left); if (p.right) q.push(p.right); }
      return out;
    }
    (function rec(n) {
      if (!n) return;
      if (kind === "pre") out.push(n.key);
      rec(n.left);
      if (kind === "in") out.push(n.key);
      rec(n.right);
      if (kind === "post") out.push(n.key);
    })(root);
    return out;
  }
  CL.travSeq = seqOf;
  // Your turn: just after each key is printed, ask which key is printed next
  function addPrintAsks(frames, root, kind) {
    var visits = [];
    frames.forEach(function (f, i) { if (f.visited) visits.push(i); });
    var seq = seqOf(root, kind);
    var others = ["pre", "in", "post", "level"].filter(function (k) { return k !== kind; }).map(function (k) { return seqOf(root, k); });
    var name = kind === "level" ? "level order" : FN[kind];
    visits.forEach(function (vi, j) {
      var at = j === 0 ? 0 : visits[j - 1] + 1;
      if (at > vi || frames[at].ask) return;
      var printed = seq.slice(0, j), right = seq[j];
      var wrong = [];
      others.forEach(function (o) { if (o[j] !== undefined && o[j] !== right && printed.indexOf(o[j]) < 0) wrong.push(o[j]); });
      wrong = wrong.concat(CL.shuffle(seq.filter(function (k) { return k !== right && printed.indexOf(k) < 0; })));
      var ask = CL.mkAsk(j === 0 ? "Which key does " + name + " print <b>first</b>?" : "Printed so far: <code>" + printed.join(" ") + "</code>. Which key does " + name + " print <b>next</b>?", right, wrong, {}, "sort");
      if (ask.options.length > 1) frames[at].ask = ask;
    });
    return frames;
  }

  CL.Labs.traversal = function (host, preset) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Tree", '<select id="tv-tree">' + TRAV_TREES.map(function (t, i) { return '<option value="' + i + '">' + esc(t.name) + "</option>"; }).join("") + '<option value="bst">BST from my keys</option>' + (preset && preset.spec ? '<option value="custom">From the Trace Trainer</option>' : "") + "</select>"));
    var keysG = CL.opGroup("Keys (inserted in order)", '<input type="text" id="tv-keys" class="wide" value="50 30 70 20 40 60 80">');
    keysG.hidden = true;
    ctl.appendChild(keysG);
    ctl.appendChild(CL.opGroup("Traversal", '<select id="tv-kind"><option value="pre">Preorder</option><option value="in">Inorder</option><option value="post">Postorder</option><option value="level">Level order</option></select>'));
    ctl.appendChild(CL.opGroup("Options", '<label class="small"><input type="checkbox" id="tv-null" checked> Show calls on NULL</label>'));
    ctl.appendChild(CL.opGroup("", '<button type="button" class="btn primary" id="tv-go">Run</button>'));
    host.appendChild(ctl);
    var root;
    var player = new CL.Player(host, {
      render: function (f) {
        var visited = new Set();
        var outKeys = new Set(f.out);
        var onStack = new Set(f.stack);
        player.stage.innerHTML = CL.drawTree(root, {
          cls: function (n) { return n.id === f.cur ? "hot" : outKeys.has(n.key) ? "done" : onStack.has(n.key) ? "on" : ""; },
          minW: 300
        });
        var html = '<div class="kv"><span>Output</span><b>' + (f.out.length ? esc(f.out.join(" ")) : "(nothing yet)") + "</b>";
        if (f.q) html += '<span>Queue (front first)</span><div class="qbox">' + (f.q.length ? f.q.map(function (x, i) { return '<span class="qi' + (i === 0 ? " hot" : "") + '">' + esc(x) + "</span>"; }).join("") : "<span class='muted small'>empty</span>") + "</div>";
        else html += '<span>Call stack</span><div class="qbox">' + (f.stack.length ? f.stack.map(function (x, i) { return '<span class="qi' + (i === f.stack.length - 1 ? " hot" : "") + '">' + esc(x) + "</span>"; }).join("") : "<span class='muted small'>empty</span>") + "</div>";
        player.extra.innerHTML = html + "</div>";
        visited = null;
      }
    });
    player.lab = "traversal";
    function go() {
      var tv = host.querySelector("#tv-tree").value;
      var kind = host.querySelector("#tv-kind").value;
      keysG.hidden = tv !== "bst";
      root = tv === "bst" ? CL.bstFrom(CL.parseNums(host.querySelector("#tv-keys").value, 31)) : tv === "custom" ? CL.parseTreeSpec(preset.spec) : CL.parseTreeSpec(TRAV_TREES[+tv].spec);
      CL.tagTree(root);
      var code = kind === "level" ? LEVEL : REC[kind];
      player.setCode(kind === "level" ? "Level order (uses a queue)" : FN[kind] + " (recursive)", code.code);
      player.load(addPrintAsks(travFrames(root, kind, host.querySelector("#tv-null").checked), root, kind));
    }
    host.querySelector("#tv-go").addEventListener("click", go);
    host.querySelector("#tv-tree").addEventListener("change", go);
    host.querySelector("#tv-kind").addEventListener("change", go);
    host.querySelector("#tv-null").addEventListener("change", go);
    if (preset && preset.spec) { host.querySelector("#tv-tree").value = "custom"; if (preset.kind) host.querySelector("#tv-kind").value = preset.kind; }
    go();
    return player;
  };

  // ---------------------------------------------------------------- BST lab
  var BST = {
    insert: CL.tagCode(
      "BTNode * insertBST (BTNode * root, int key) {\n" +
      "\tif (root == NULL) {                            //@null\n" +
      "\t\tBTNode * newNode = createBTNode (key);      //@new\n" +
      "\t\treturn newNode;                             //@retnew\n" +
      "\t}\n" +
      "\tif (key < root->data) {                        //@lt\n" +
      "\t\troot->left = insertBST (root->left, key);  //@left\n" +
      "\t\troot->left->parent = root;                 //@pl\n" +
      "\t}\n" +
      "\telse\n" +
      "\tif (key > root->data) {                        //@gt\n" +
      "\t\troot->right = insertBST (root->right, key); //@right\n" +
      "\t\troot->right->parent = root;                //@pr\n" +
      "\t}\n" +
      "\treturn root;                                   //@ret\n" +
      "}"),
    search: CL.tagCode(
      "BTNode * containsBST (BTNode * root, int key) {\n" +
      "\tif (root == NULL)                              //@null\n" +
      "\t\treturn NULL;                               //@retnull\n" +
      "\tif (root->data == key)                         //@eq\n" +
      "\t\treturn root;                               //@found\n" +
      "\tif (key < root->data)                          //@lt\n" +
      "\t\treturn containsBST (root->left, key);      //@left\n" +
      "\treturn containsBST (root->right, key);         //@right\n" +
      "}"),
    min: CL.tagCode(
      "BTNode * minimumBST (BTNode * root) {\n" +
      "\tif (root == NULL)                              //@null\n" +
      "\t\treturn NULL;\n" +
      "\twhile (root->left != NULL)                     //@loop\n" +
      "\t\troot = root->left;                         //@step\n" +
      "\treturn root;                                   //@ret\n" +
      "}"),
    max: CL.tagCode(
      "BTNode * maximumBST (BTNode * root) {\n" +
      "\tif (root == NULL)                              //@null\n" +
      "\t\treturn NULL;\n" +
      "\twhile (root->right != NULL)                    //@loop\n" +
      "\t\troot = root->right;                        //@step\n" +
      "\treturn root;                                   //@ret\n" +
      "}"),
    succ: CL.tagCode(
      "BTNode * inOrderSuccessor (BTNode * node) {\n" +
      "\tif (node == NULL)\n" +
      "\t\treturn NULL;\n" +
      "\tif (node->right != NULL)                              //@right\n" +
      "\t\treturn minimumBST (node->right);                  //@min\n" +
      "\tBTNode * parent;\n" +
      "\tparent = node->parent;                                //@par\n" +
      "\twhile (parent != NULL && node == parent->right) {    //@loop\n" +
      "\t\tnode = parent;                                    //@up1\n" +
      "\t\tparent = parent->parent;                          //@up2\n" +
      "\t}\n" +
      "\treturn parent;                                        //@ret\n" +
      "}"),
    pred: CL.tagCode(
      "BTNode * inOrderPredecessor (BTNode * node) {\n" +
      "\tif (node == NULL)\n" +
      "\t\treturn NULL;\n" +
      "\tif (node->left != NULL)                               //@right\n" +
      "\t\treturn maximumBST (node->left);                   //@min\n" +
      "\tBTNode * parent;\n" +
      "\tparent = node->parent;                                //@par\n" +
      "\twhile (parent != NULL && node == parent->left) {     //@loop\n" +
      "\t\tnode = parent;                                    //@up1\n" +
      "\t\tparent = parent->parent;                          //@up2\n" +
      "\t}\n" +
      "\treturn parent;                                        //@ret\n" +
      "}"),
    del: CL.tagCode(
      "BTNode * deleteBST (BTNode * root, int key) {\n" +
      "\tBTNode * node = containsBST (root, key);               //@find\n" +
      "\tif (node == NULL)                                      //@none\n" +
      "\t\treturn root;\n" +
      "\tBTNode * parent = node->parent;                        //@par\n" +
      "\n" +
      "\t// Case 1: the node is a leaf\n" +
      "\tif (node->left == NULL && node->right == NULL) {       //@c1\n" +
      "\t\tif (parent == NULL)                                //@c1root\n" +
      "\t\t\troot = NULL;\n" +
      "\t\telse if (parent->left == node)                     //@c1test\n" +
      "\t\t\tparent->left = NULL;                           //@c1l\n" +
      "\t\telse\n" +
      "\t\t\tparent->right = NULL;                          //@c1r\n" +
      "\t\tdelete node;                                       //@c1del\n" +
      "\t\treturn root;\n" +
      "\t}\n" +
      "\n" +
      "\t// Case 2(a) no left subtree, Case 2(b) no right subtree\n" +
      "\tif (node->left == NULL || node->right == NULL) {       //@c2\n" +
      "\t\tBTNode * child;\n" +
      "\t\tif (node->left == NULL)                            //@c2a\n" +
      "\t\t\tchild = node->right;                           //@c2achild\n" +
      "\t\telse\n" +
      "\t\t\tchild = node->left;                            //@c2bchild\n" +
      "\t\tif (parent == NULL)                                //@c2root\n" +
      "\t\t\troot = child;                                  //@c2newroot\n" +
      "\t\telse if (parent->left == node)                     //@c2test\n" +
      "\t\t\tparent->left = child;                          //@c2l\n" +
      "\t\telse\n" +
      "\t\t\tparent->right = child;                         //@c2r\n" +
      "\t\tchild->parent = parent;                            //@c2par\n" +
      "\t\tdelete node;                                       //@c2del\n" +
      "\t\treturn root;\n" +
      "\t}\n" +
      "\n" +
      "\t// Case 3: two subtrees. Copy the inorder successor's data,\n" +
      "\t// then remove the successor (it has no left subtree).\n" +
      "\tBTNode * succ = inOrderSuccessor (node);               //@c3\n" +
      "\tnode->data = succ->data;                               //@c3copy\n" +
      "\tBTNode * sp = succ->parent;                            //@c3sp\n" +
      "\tif (sp->left == succ)                                  //@c3test\n" +
      "\t\tsp->left = succ->right;                            //@c3l\n" +
      "\telse\n" +
      "\t\tsp->right = succ->right;                           //@c3r\n" +
      "\tif (succ->right != NULL)                               //@c3hasr\n" +
      "\t\tsucc->right->parent = sp;                          //@c3rp\n" +
      "\tdelete succ;                                           //@c3del\n" +
      "\treturn root;\n" +
      "}")
  };
  CL.BST_CODE = BST;

  var BST_PRESETS = [
    { name: "Lecture 10 tree", keys: "20 17 30 5 18 25 50 10 45 80 40 41" },
    { name: "Lecture 7 tree", keys: "10 5 23 3 7 17 41 4 9" },
    { name: "Balanced, 7 keys", keys: "40 20 60 10 30 50 70" },
    { name: "Degenerate (sorted input)", keys: "25 31 39 40 52 55 80" }
  ];

  function findNode(root, key) { var n = root; while (n && n.key !== key) n = key < n.key ? n.left : n.right; return n; }
  function minNode(n) { while (n.left) n = n.left; return n; }
  function maxNode(n) { while (n.right) n = n.right; return n; }

  CL.Labs.bst = function (host, preset) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Start from", '<select id="bst-preset">' + BST_PRESETS.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + "</option>"; }).join("") + '</select><input type="text" id="bst-keys" class="wide" aria-label="Keys to insert"><button type="button" class="btn" id="bst-build">Build</button><button type="button" class="btn" id="bst-steps">Step through the build</button>'));
    ctl.appendChild(CL.opGroup("Key", '<input type="text" id="bst-key" value="30" aria-label="Key" style="width:5.5em">'));
    ctl.appendChild(CL.opGroup("Operation", '<button type="button" class="btn primary" data-op="insert">Insert</button><button type="button" class="btn" data-op="search">Search</button><button type="button" class="btn" data-op="del">Delete</button>' +
      '<button type="button" class="btn" data-op="succ">Successor</button><button type="button" class="btn" data-op="pred">Predecessor</button><button type="button" class="btn" data-op="min">Min</button><button type="button" class="btn" data-op="max">Max</button>'));
    host.appendChild(ctl);
    var root = null;
    var player = new CL.Player(host, {
      render: function (f) {
        var t = f.tree;
        var on = new Set(f.on || []), bad = new Set(f.bad || []), done = new Set(f.done || []);
        player.stage.innerHTML = CL.drawTree(t, {
          minW: 300,
          cls: function (n) { return n.id === f.hot ? "hot" : bad.has(n.id) ? "bad" : done.has(n.id) ? "done" : on.has(n.id) ? "on" : f.ghost === n.id ? "ghost" : ""; },
          edgeCls: function (a, b) { return on.has(a.id) && (on.has(b.id) || b.id === f.hot) ? "on" : ""; },
          tag: function (n) { return n.id === f.hot ? (f.tag || "") : ""; }
        });
        var ino = CL.treeNodes(t).map(function (n) { return n.key; });
        player.extra.innerHTML = '<div class="kv"><span>Inorder</span><b>' + (ino.length ? esc(ino.join(", ")) : "(empty)") + "</b><span>Height</span><b>" + height(t) + "</b>" + (f.result !== undefined ? "<span>Result</span><b>" + esc(f.result) + "</b>" : "") + "</div>";
      }
    });
    player.lab = "bst";
    function height(n) { return n ? 1 + Math.max(height(n.left), height(n.right)) : -1; }
    var WAYS = function (found) { return ["Go left", "Go right", found]; };
    function wayAsk(what, key, n) {
      return CL.askFixed(what + " " + key + ": compare it with " + n.key + ". Which way?", WAYS(what === "Insert" ? "Stop: " + key + " is already in the tree" : "Found it here"), key < n.key ? 0 : key > n.key ? 1 : 2, { view: { result: undefined } });
    }
    function inorderKeys() { return CL.treeNodes(root).map(function (n) { return n.key; }); }
    function snap() { return CL.cloneTree(root, null); }
    function frame(frames, text, line, extra) { frames.push(Object.assign({ text: text, line: line, tree: snap() }, extra || {})); }
    function keyVal() { var k = CL.parseNums(host.querySelector("#bst-key").value)[0]; return k; }

    function build(keysText, silent) {
      var keys = CL.parseNums(keysText, 40);
      root = null;
      keys.forEach(function (k) { root = CL.bstInsert(root, k); });
      CL.tagTree(root);
      player.setCode("insertBST", BST.insert.code);
      var frames = [];
      frame(frames, "Built a BST by inserting " + esc(keys.join(", ")) + " in that order. Choose an operation above.", 0);
      player.load(frames);
    }

    function opInsert(key) {
      var frames = [];
      player.setCode("insertBST", BST.insert.code);
      insertFrames(frames, key);
      player.load(frames);
    }
    // step through inserting every key, starting from an empty tree
    function opBuildSteps(keys) {
      var frames = [];
      root = null;
      player.setCode("insertBST", BST.insert.code);
      frame(frames, "Start with an empty tree and insert " + esc(keys.join(", ")) + " in that order.", 0);
      keys.forEach(function (k) { insertFrames(frames, k); });
      frame(frames, "All " + keys.length + " keys are in. The inorder traversal is sorted: " + esc(CL.treeNodes(root).map(function (x) { return x.key; }).join(" ")) + ".", 0);
      player.load(frames);
    }
    function insertFrames(frames, key) {
      var C = BST.insert.L, path = [];
      var n = root;
      if (!n) {
        frame(frames, "Insert " + key + ": the tree is empty (root is NULL).", C.null);
        root = { key: key, left: null, right: null, parent: null };
        CL.tagTree(root);
        frame(frames, "Create a node for " + key + ". It becomes the root.", C.new, { hot: root.id, done: [root.id] });
        return;
      }
      for (;;) {
        path.push(n.id);
        if (key === n.key) { frame(frames, key + " is already in the tree, so nothing is inserted (a BST has no duplicates).", C.ret, { hot: n.id, on: path, ask: wayAsk("Insert", key, n) }); return; }
        if (key < n.key) {
          frame(frames, key + " &lt; " + n.key + ", so go <b>left</b>.", C.lt, { hot: n.id, on: path, ask: wayAsk("Insert", key, n) });
          if (!n.left) {
            frame(frames, n.key + " has no left child: insertBST(root->left, " + key + ") is called with NULL.", C.left, { hot: n.id, on: path });
            var nn = { key: key, left: null, right: null, parent: n };
            n.left = nn; CL.tagTree(root);
            frame(frames, "Create the node " + key + " and return it.", C.new, { hot: nn.id, on: path, tag: "new" });
            frame(frames, "Back in the call for " + n.key + ": <code>root->left</code> now points to " + key + ", and its parent pointer is set to " + n.key + ".", C.pl, { hot: nn.id, on: path, done: [nn.id] });
            break;
          }
          n = n.left;
        } else {
          frame(frames, key + " &gt; " + n.key + ", so go <b>right</b>.", C.gt, { hot: n.id, on: path, ask: wayAsk("Insert", key, n) });
          if (!n.right) {
            frame(frames, n.key + " has no right child: insertBST(root->right, " + key + ") is called with NULL.", C.right, { hot: n.id, on: path });
            var nr = { key: key, left: null, right: null, parent: n };
            n.right = nr; CL.tagTree(root);
            frame(frames, "Create the node " + key + " and return it.", C.new, { hot: nr.id, on: path, tag: "new" });
            frame(frames, "Back in the call for " + n.key + ": <code>root->right</code> now points to " + key + ", and its parent pointer is set to " + n.key + ".", C.pr, { hot: nr.id, on: path, done: [nr.id] });
            break;
          }
          n = n.right;
        }
      }
      frame(frames, "Each call returns its root, so the tree is reconnected all the way up. The inorder traversal is still sorted.", C.ret, { done: [findNode(root, key).id] });
    }
    function opSearch(key) {
      var C = BST.search.L, frames = [], path = [], n = root;
      player.setCode("containsBST", BST.search.code);
      while (true) {
        if (!n) { frame(frames, "Reached NULL: " + key + " is not in the tree. Return NULL.", C.retnull, { on: path, result: "NULL (not found)" }); break; }
        path.push(n.id);
        if (n.key === key) { frame(frames, "Found " + key + ". Return this node. It took " + path.length + " comparison" + (path.length > 1 ? "s" : "") + ".", C.found, { hot: n.id, on: path, done: [n.id], result: "node " + key, ask: CL.askFixed("Search " + key + ": compare it with " + n.key + ". Which way?", WAYS("Found it here"), 2, { view: { done: [], result: undefined } }) }); break; }
        if (key < n.key) { frame(frames, key + " &lt; " + n.key + ": search the left subtree.", C.left, { hot: n.id, on: path, ask: wayAsk("Search", key, n) }); n = n.left; }
        else { frame(frames, key + " &gt; " + n.key + ": search the right subtree.", C.right, { hot: n.id, on: path, ask: wayAsk("Search", key, n) }); n = n.right; }
      }
      player.load(frames);
    }
    function opMinMax(isMin) {
      var code = isMin ? BST.min : BST.max, C = code.L, frames = [], path = [];
      player.setCode(isMin ? "minimumBST" : "maximumBST", code.code);
      if (!root) { frame(frames, "The tree is empty, so return NULL.", C.null); return player.load(frames); }
      var n = root, first = frames.length;
      while (true) {
        path.push(n.id);
        var nx = isMin ? n.left : n.right;
        if (!nx) { frame(frames, n.key + " has no " + (isMin ? "left" : "right") + " child, so it is the " + (isMin ? "smallest" : "largest") + " key.", C.ret, { hot: n.id, on: path, done: [n.id], result: n.key }); break; }
        frame(frames, "Keep going " + (isMin ? "left" : "right") + " from " + n.key + ".", C.step, { hot: n.id, on: path });
        n = nx;
      }
      var keys = inorderKeys(), ans = isMin ? keys[0] : keys[keys.length - 1];
      var near = [root.key, isMin ? keys[1] : keys[keys.length - 2], isMin ? keys[keys.length - 1] : keys[0]];
      if (keys.length > 1) frames[first].ask = CL.mkAsk("Which key will " + (isMin ? "minimumBST" : "maximumBST") + " return?", ans, near.concat(CL.shuffle(keys.slice())), { view: { hot: null, on: [], done: [], result: undefined } }, "sort");
      player.load(frames);
    }
    function opSucc(key, pred) {
      var code = pred ? BST.pred : BST.succ, C = code.L, frames = [];
      player.setCode(pred ? "inOrderPredecessor" : "inOrderSuccessor", code.code);
      var node = findNode(root, key);
      if (!node) { frame(frames, key + " is not in the tree. Type a key that is in it.", 0); return player.load(frames); }
      var side = pred ? "left" : "right";
      var ks = inorderKeys(), at = ks.indexOf(key), ansK = pred ? ks[at - 1] : ks[at + 1], other = pred ? ks[at + 1] : ks[at - 1];
      var qWrong = [node.parent && node.parent.key, node.right && node.right.key, node.left && node.left.key, other, root.key, ansK === undefined ? null : "none (NULL)"].filter(function (x) { return x !== null && x !== undefined && x !== key; });
      var sAsk = CL.mkAsk("Which key is the inorder " + (pred ? "predecessor" : "successor") + " of " + key + "?", ansK === undefined ? "none (NULL)" : ansK, qWrong.concat(CL.shuffle(ks.filter(function (k) { return k !== key; }))), { view: { hot: node.id, on: [], done: [], result: undefined } }, "sort");
      var sFirst = frames.length;
      var fin = function () { if (sAsk.options.length > 1 && frames[sFirst]) frames[sFirst].ask = sAsk; };
      if (node[side]) {
        frame(frames, key + " has a " + side + " subtree, so the " + (pred ? "predecessor" : "successor") + " is the " + (pred ? "largest" : "smallest") + " key in it.", C.right, { hot: node.id });
        var path = [], n = node[side];
        while (true) {
          path.push(n.id);
          var nx = pred ? n.right : n.left;
          if (!nx) break;
          frame(frames, "Go " + (pred ? "right" : "left") + " from " + n.key + ".", C.min, { hot: n.id, on: path, done: [] });
          n = nx;
        }
        frame(frames, "The " + (pred ? "predecessor" : "successor") + " of " + key + " is <b>" + n.key + "</b>.", C.min, { hot: n.id, on: path, done: [n.id], result: n.key });
        fin();
        return player.load(frames);
      }
      frame(frames, key + " has no " + side + " subtree, so walk up through the parent pointers.", C.par, { hot: node.id });
      var cur = node, par = node.parent, upPath = [node.id];
      while (par && cur === par[side]) {
        frame(frames, cur.key + " is the " + side + " child of " + par.key + ", so keep going up.", C.loop, { hot: par.id, on: upPath });
        cur = par; par = par.parent; upPath.push(cur.id);
      }
      if (par) frame(frames, cur.key + " is the " + (pred ? "right" : "left") + " child of " + par.key + ", so stop. The " + (pred ? "predecessor" : "successor") + " of " + key + " is <b>" + par.key + "</b>.", C.ret, { hot: par.id, on: upPath, done: [par.id], result: par.key });
      else frame(frames, "We walked past the root, so " + key + " is the " + (pred ? "smallest" : "largest") + " key and has no " + (pred ? "predecessor" : "successor") + ". Return NULL.", C.ret, { on: upPath, result: "NULL" });
      fin();
      player.load(frames);
    }
    function relink(parent, node, child) {
      if (!parent) root = child;
      else if (parent.left === node) parent.left = child;
      else parent.right = child;
      if (child) child.parent = parent;
    }
    function opDelete(key) {
      var C = BST.del.L, frames = [];
      player.setCode("deleteBST", BST.del.code);
      var node = findNode(root, key);
      if (!node) { frame(frames, key + " is not in the tree, so containsBST returns NULL and nothing changes.", C.none); return player.load(frames); }
      var path = [], n = root;
      while (n !== node) { path.push(n.id); n = key < n.key ? n.left : n.right; }
      frame(frames, "Find " + key + " with containsBST (" + (path.length + 1) + " comparisons).", C.find, { hot: node.id, on: path });
      var parent = node.parent;
      var CASES = ["Case 1: a leaf (no children)", "Case 2(a): no left subtree", "Case 2(b): no right subtree", "Case 3: two subtrees"];
      var caseAsk = CL.askFixed("deleteBST(" + key + "): which case applies?", CASES, !node.left && !node.right ? 0 : !node.left ? 1 : !node.right ? 2 : 3, { view: { hot: node.id, bad: [], on: [] } });
      caseAsk.wide = true;
      if (!node.left && !node.right) {
        frame(frames, "<b>Case 1:</b> " + key + " is a leaf (no children).", C.c1, { bad: [node.id], ask: caseAsk });
        if (!parent) { root = null; frame(frames, "It is the only node, so the tree becomes empty.", C.c1root, {}); }
        else {
          var isL = parent.left === node;
          frame(frames, "Go to its parent " + parent.key + " and set its " + (isL ? "left" : "right") + " pointer to NULL.", isL ? C.c1l : C.c1r, { hot: parent.id, bad: [node.id] });
          relink(parent, node, null);
        }
        frame(frames, "delete the node. " + key + " is gone and the tree is still a BST.", C.c1del, { done: parent ? [parent.id] : [] });
        return player.load(frames);
      }
      if (!node.left || !node.right) {
        var a = !node.left, child = a ? node.right : node.left;
        frame(frames, "<b>Case 2(" + (a ? "a" : "b") + "):</b> " + key + " has no " + (a ? "left" : "right") + " subtree, so it is replaced by the root of its " + (a ? "right" : "left") + " subtree, " + child.key + ".", a ? C.c2achild : C.c2bchild, { hot: child.id, bad: [node.id], ask: caseAsk });
        if (!parent) frame(frames, key + " was the root, so " + child.key + " becomes the new root.", C.c2newroot, { hot: child.id, bad: [node.id] });
        else frame(frames, "Connect " + parent.key + "'s " + (parent.left === node ? "left" : "right") + " pointer to " + child.key + ", and set " + child.key + "'s parent to " + parent.key + ".", parent.left === node ? C.c2l : C.c2r, { hot: child.id, on: [parent.id], bad: [node.id] });
        relink(parent, node, child);
        frame(frames, "delete the old node. The whole subtree under " + child.key + " moved up one level, still in order.", C.c2del, { done: [child.id] });
        return player.load(frames);
      }
      frame(frames, "<b>Case 3:</b> " + key + " has two subtrees. Find its inorder successor: the smallest key in its right subtree.", C.c3, { hot: node.id, ask: caseAsk });
      var s0 = node.right; while (s0.left) s0 = s0.left;
      var predK = maxNode(node.left).key;
      var repAsk = CL.mkAsk("Case 3: which key will take " + key + "'s place?", s0.key, [predK, node.right.key, node.left.key, root.key !== key ? root.key : null], { view: { hot: node.id, on: [], bad: [] } }, "sort");
      var askAt = frames.length;
      var s = node.right, sp = [node.id];
      while (s.left) { sp.push(s.id); frame(frames, "Go left from " + s.key + ".", C.c3, { hot: s.id, on: sp, bad: [] }); s = s.left; }
      frame(frames, "The successor is <b>" + s.key + "</b>. It has no left subtree (that is why it is the smallest).", C.c3, { hot: s.id, on: sp });
      if (repAsk.options.length > 1) frames[askAt].ask = repAsk;
      var old = node.key;
      node.key = s.key;
      frame(frames, "Copy " + s.key + " into the node that held " + old + ". For a moment " + s.key + " is in the tree twice.", C.c3copy, { hot: node.id, bad: [s.id] });
      var spar = s.parent;
      frame(frames, "Remove the old " + s.key + " node: connect its parent (" + spar.key + ") to its right subtree" + (s.right ? " (" + s.right.key + ")." : ", which is NULL."), spar.left === s ? C.c3l : C.c3r, { hot: spar.id, bad: [s.id] });
      relink(spar, s, s.right);
      frame(frames, "delete the successor node. " + old + " is gone, " + node.key + " took its place, and the inorder order is unchanged.", C.c3del, { done: [node.id] });
      player.load(frames);
    }
    ctl.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.id === "bst-build") return build(host.querySelector("#bst-keys").value);
      if (b.id === "bst-steps") return opBuildSteps(CL.parseNums(host.querySelector("#bst-keys").value, 40));
      var op = b.getAttribute("data-op");
      if (!op) return;
      var key = keyVal();
      if ((op === "insert" || op === "search" || op === "del" || op === "succ" || op === "pred") && key === undefined) { player.say.innerHTML = "Type a whole number in the Key box first."; return; }
      if (op === "insert") opInsert(key);
      if (op === "search") opSearch(key);
      if (op === "del") opDelete(key);
      if (op === "succ") opSucc(key, false);
      if (op === "pred") opSucc(key, true);
      if (op === "min") opMinMax(true);
      if (op === "max") opMinMax(false);
    });
    var presetSel = host.querySelector("#bst-preset");
    presetSel.addEventListener("change", function () { host.querySelector("#bst-keys").value = BST_PRESETS[+presetSel.value].keys; build(BST_PRESETS[+presetSel.value].keys); });
    var startKeys = preset && preset.keys ? preset.keys.join(" ") : BST_PRESETS[0].keys;
    host.querySelector("#bst-keys").value = startKeys;
    build(startKeys);
    if (preset && !preset.op) opBuildSteps(preset.keys);
    if (preset && preset.op) {
      host.querySelector("#bst-key").value = preset.key;
      var ob = host.querySelector('[data-op="' + preset.op + '"]');
      if (ob) ob.click();
    }
    return player;
  };
})(CL);
