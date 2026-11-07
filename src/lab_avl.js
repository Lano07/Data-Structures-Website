/* COMP 2611 Code Lab — the AVL Tree Lab (supplementary): insert keys and watch each comparison, height update,
   balance factor, imbalance and rotation, step by step, with "Your turn" predictions. */
(function (CL) {
  "use strict";
  var esc = CL.esc;
  var CODE = [
    "AVLNode * insertAVL (AVLNode * root, int key) {",
    "\tif (root == NULL)",
    "\t\treturn createAVLNode (key);",
    "\tif (key < root->data)",
    "\t\troot->left = insertAVL (root->left, key);",
    "\telse if (key > root->data)",
    "\t\troot->right = insertAVL (root->right, key);",
    "\telse",
    "\t\treturn root;",
    "\tupdateHeight (root);",
    "\tint bf = balance (root);",
    "\tif (bf > 1 && key < root->left->data)        // Left-Left",
    "\t\treturn rotateRight (root);",
    "\tif (bf < -1 && key > root->right->data)      // Right-Right",
    "\t\treturn rotateLeft (root);",
    "\tif (bf > 1 && key > root->left->data) {      // Left-Right",
    "\t\troot->left = rotateLeft (root->left);",
    "\t\treturn rotateRight (root);",
    "\t}",
    "\tif (bf < -1 && key < root->right->data) {    // Right-Left",
    "\t\troot->right = rotateRight (root->right);",
    "\t\treturn rotateLeft (root);",
    "\t}",
    "\treturn root;",
    "}"
  ].join("\n");
  var PRESETS = [
    { name: "The lesson's example", keys: "10 20 30 40 50 25" },
    { name: "Sorted keys 1 to 7 (a plain BST would be a chain)", keys: "1 2 3 4 5 6 7" },
    { name: "Left-Right zig-zag", keys: "30 10 20" },
    { name: "Right-Left zig-zag", keys: "10 30 20" },
    { name: "A longer mix", keys: "50 20 70 10 30 25 27 26 80 90" }
  ];
  var CASES = ["Left-Left: rotate right at it", "Right-Right: rotate left at it", "Left-Right: rotate left at its left child, then right at it", "Right-Left: rotate right at its right child, then left at it"];
  var nid = 1;
  function h(n) { return n ? n.h : -1; }
  function upd(n) { n.h = 1 + Math.max(h(n.left), h(n.right)); }
  function bf(n) { return h(n.left) - h(n.right); }
  function clone(n) { if (!n) return null; return { id: n.id, key: n.key, h: n.h, left: clone(n.left), right: clone(n.right) }; }
  function nodes(n, out) { out = out || []; if (n) { nodes(n.left, out); out.push(n); nodes(n.right, out); } return out; }
  function sign(v) { return v > 0 ? "+" + v : v < 0 ? "−" + (-v) : "0"; }

  CL.Labs.avl = function (host, preset) {
    var root = null;
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Start from", '<select id="avl-preset">' + PRESETS.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + "</option>"; }).join("") + '</select><input type="text" id="avl-keys" class="wide" aria-label="Keys to insert"><button type="button" class="btn primary" id="avl-steps">Step through the inserts</button>'));
    ctl.appendChild(CL.opGroup("Then insert", '<input type="text" id="avl-key" value="35" aria-label="Key" style="width:5.5em"><button type="button" class="btn" id="avl-ins">Insert</button><button type="button" class="btn ghost" id="avl-rand">Random key</button>'));
    host.appendChild(ctl);
    var player = new CL.Player(host, {
      render: function (f) {
        var tags = f.tags || {}, on = new Set(f.on || []), bad = new Set(f.bad || []), rot = new Set(f.rot || []);
        player.stage.innerHTML = CL.drawTree(f.tree, {
          minW: 300, pad: 36,
          cls: function (n) { return n.id === f.hot ? "hot" : bad.has(n.id) ? "bad" : rot.has(n.id) ? "done" : on.has(n.id) ? "on" : ""; },
          edgeCls: function (a, b) { return on.has(a.id) && (on.has(b.id) || b.id === f.hot) ? "on" : ""; },
          tag: function (n) { return tags[n.id] || ""; },
          label: function (n) { return f.showH ? "h" + n.h : ""; },
          aria: "AVL tree"
        });
        var all = nodes(f.tree), n = all.length;
        player.extra.innerHTML = '<div class="kv"><span>Nodes</span><b>' + n + "</b><span>Height</span><b>" + h(f.tree) + "</b>" + (n ? "<span>log₂ n</span><b>" + (Math.log(n) / Math.LN2).toFixed(2) + "</b>" : "") +
          "<span>Inorder</span><b>" + (n ? esc(all.map(function (x) { return x.key; }).join(", ")) : "(empty)") + "</b></div>" +
          '<p class="small muted">Numbers above the nodes are balance factors: height of the left subtree minus height of the right. Every node must stay between −1 and +1.</p>';
      }
    });
    player.lab = "avl";
    player.setCode("insertAVL", CODE);
    function bfTags(t, only) {
      var tags = {};
      nodes(t).forEach(function (n) { if (!only || only[n.id]) tags[n.id] = sign(bf(n)); });
      return tags;
    }
    function frame(frames, text, line, extra) { var t = clone(root); frames.push(Object.assign({ text: text, line: line, tree: t, tags: bfTags(t) }, extra || {})); }
    function replace(parent, old, nw) { if (!parent) root = nw; else if (parent.left === old) parent.left = nw; else parent.right = nw; }
    function rotR(y) { var x = y.left; y.left = x.right; x.right = y; upd(y); upd(x); return x; }
    function rotL(x) { var y = x.right; x.right = y.left; y.left = x; upd(x); upd(y); return y; }

    function insertFrames(frames, key) {
      var path = [], cur = root;
      if (!root) {
        root = { id: "a" + (nid++), key: key, h: 0, left: null, right: null };
        frame(frames, "The tree is empty, so " + key + " becomes the root, a single node with height 0.", 3, { hot: root.id });
        return;
      }
      frame(frames, "Insert <b>" + key + "</b>. First, insert it exactly as in a plain BST, starting at the root.", 1, { on: [] });
      while (cur) {
        var way = key < cur.key ? 0 : key > cur.key ? 1 : 2;
        frame(frames, key + (way === 0 ? " &lt; " : way === 1 ? " &gt; " : " = ") + cur.key + ": " + (way === 0 ? "go left." : way === 1 ? "go right." : "it is already in the tree, so it is ignored."), way === 0 ? 5 : way === 1 ? 7 : 9,
          { hot: cur.id, on: path.map(function (x) { return x.id; }), ask: CL.askFixed("Insert " + key + ": compare it with " + cur.key + ". Which way?", ["Go left", "Go right", "Stop: " + key + " is already in the tree"], way) });
        if (way === 2) return;
        path.push(cur);
        cur = way === 0 ? cur.left : cur.right;
      }
      var parent = path[path.length - 1], leaf = { id: "a" + (nid++), key: key, h: 0, left: null, right: null };
      if (key < parent.key) parent.left = leaf; else parent.right = leaf;
      frame(frames, key + " becomes a new leaf (height 0). Now the calls return one by one, back up the path, and each node checks its balance.", 3, { hot: leaf.id, on: path.map(function (x) { return x.id; }) });
      for (var i = path.length - 1; i >= 0; i--) {
        var z = path[i], oldH = z.h;
        upd(z);
        var b = bf(z), seen = {};
        path.slice(i).forEach(function (x) { seen[x.id] = 1; });
        seen[leaf.id] = 1;
        if (Math.abs(b) <= 1) {
          frame(frames, "Back at " + z.key + ": height " + (oldH === z.h ? "stays " : "becomes ") + z.h + ", balance factor " + h(z.left) + " − (" + h(z.right) + ") = " + sign(b) + ". Balanced." + (oldH === z.h ? " Its height did not change, so nothing above it can have become unbalanced." : ""), 11,
            { hot: z.id, on: path.slice(0, i).map(function (x) { return x.id; }), showH: true });
          if (oldH === z.h) break;
          continue;
        }
        var cs = b > 1 ? (key < z.left.key ? 0 : 2) : (key > z.right.key ? 1 : 3);
        var child = b > 1 ? z.left : z.right;
        frame(frames, "Back at " + z.key + ": balance factor " + h(z.left) + " − (" + h(z.right) + ") = <b>" + sign(b) + "</b>, so " + z.key + " is unbalanced. " + key + " went into the " + (cs === 0 || cs === 3 ? "left" : "right") + " subtree of " + z.key + "'s " + (b > 1 ? "left" : "right") + " child " + child.key + ".", [12, 14, 16, 20][cs],
          { bad: [z.id], hot: null, rot: [child.id], showH: true, ask: CL.askFixed(z.key + " has balance factor " + sign(b) + ". " + key + " went below its " + (b > 1 ? "left" : "right") + " child " + child.key + ". Which case is it?", CASES, cs, { wide: true }) });
        var p = path[i - 1] || null, nr;
        if (cs === 0) {
          nr = rotR(z); replace(p, z, nr);
          frame(frames, "<b>Left-Left:</b> rotate right at " + z.key + ". Its left child " + nr.key + " moves up; " + z.key + " becomes " + nr.key + "'s right child, and " + nr.key + "'s old right subtree moves across to be " + z.key + "'s left subtree.", 13, { rot: [nr.id, z.id], showH: true });
        } else if (cs === 1) {
          nr = rotL(z); replace(p, z, nr);
          frame(frames, "<b>Right-Right:</b> rotate left at " + z.key + ". Its right child " + nr.key + " moves up; " + z.key + " becomes " + nr.key + "'s left child, and " + nr.key + "'s old left subtree moves across to be " + z.key + "'s right subtree.", 15, { rot: [nr.id, z.id], showH: true });
        } else if (cs === 2) {
          var c1 = z.left; z.left = rotL(c1);
          frame(frames, "<b>Left-Right</b>, first step: rotate left at " + c1.key + ". Now the long path is a straight line on the left (a Left-Left shape).", 17, { rot: [z.left.id, c1.id], bad: [z.id], showH: true });
          nr = rotR(z); replace(p, z, nr);
          frame(frames, "Second step: rotate right at " + z.key + ". " + nr.key + " moves up to the top of this subtree, with " + nr.left.key + " and " + nr.right.key + " as its children.", 18, { rot: [nr.id, nr.left.id, nr.right.id], showH: true });
        } else {
          var c2 = z.right; z.right = rotR(c2);
          frame(frames, "<b>Right-Left</b>, first step: rotate right at " + c2.key + ". Now the long path is a straight line on the right (a Right-Right shape).", 21, { rot: [z.right.id, c2.id], bad: [z.id], showH: true });
          nr = rotL(z); replace(p, z, nr);
          frame(frames, "Second step: rotate left at " + z.key + ". " + nr.key + " moves up to the top of this subtree, with " + nr.left.key + " and " + nr.right.key + " as its children.", 22, { rot: [nr.id, nr.left.id, nr.right.id], showH: true });
        }
        frame(frames, "Balanced again. This subtree is back to the height it had before the insert (" + nr.h + "), so no node above it needs to change. The inorder order is unchanged: rotations never break the BST property.", 24, { rot: [nr.id], showH: true });
        for (var k = i - 1; k >= 0; k--) upd(path[k]);
        return;
      }
    }
    function load(keys, fromEmpty) {
      var frames = [];
      if (fromEmpty) root = null;
      frame(frames, fromEmpty ? "Start with an empty AVL tree and insert " + esc(keys.join(", ")) + " in that order. In Your turn mode you predict each step." : "Insert " + esc(keys.join(", ")) + ".", 0);
      keys.forEach(function (k) { insertFrames(frames, k); });
      frame(frames, "Done. Height " + h(root) + " for " + nodes(root).length + " nodes" + (nodes(root).length > 1 ? " (log₂ n ≈ " + (Math.log(nodes(root).length) / Math.LN2).toFixed(1) + ")" : "") + ". Every balance factor is −1, 0 or +1.", 0, { showH: true });
      player.load(frames);
    }
    var sel = host.querySelector("#avl-preset"), keysIn = host.querySelector("#avl-keys");
    sel.addEventListener("change", function () { keysIn.value = PRESETS[+sel.value].keys; load(CL.parseNums(keysIn.value, 31), true); });
    host.querySelector("#avl-steps").addEventListener("click", function () {
      var ks = CL.parseNums(keysIn.value, 31);
      if (!ks.length) { keysIn.focus(); return; }
      load(ks, true);
    });
    host.querySelector("#avl-ins").addEventListener("click", function () {
      var k = CL.parseNums(host.querySelector("#avl-key").value)[0];
      if (k === undefined) return;
      if (nodes(root).length >= 31) { load([], true); }
      load([k], false);
    });
    host.querySelector("#avl-rand").addEventListener("click", function () {
      var have = nodes(root).map(function (n) { return n.key; }), k;
      do { k = 1 + Math.floor(Math.random() * 99); } while (have.indexOf(k) >= 0 && have.length < 90);
      host.querySelector("#avl-key").value = k;
      load([k], false);
    });
    var start = preset && preset.keys ? preset.keys.join(" ") : PRESETS[0].keys;
    keysIn.value = start;
    load(CL.parseNums(start, 31), true);
    return player;
  };
})(CL);
