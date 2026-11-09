# world: bt
title: The World Tree
place: Hispaniola, the Caribbean
when: before 1492
topic: trees
parts: f
scene: ceiba
color: #6fe08a
fragment: The Ceiba Key
blurb: Binary trees: terminology, preorder, inorder and postorder, recursive tree functions, level order, tree shapes, and rebuilding a tree from its traversals.

## bt-1 | Roots and branches
goal: Name every part of a tree and measure moment, weight, level and height.
lessons: f1-terminology

@scene Hispaniola · a cave mouth beneath a giant ceiba tree
@say narrator: The Taíno lived across the Greater Antilles for centuries before Columbus arrived in 1492. The ceiba, the silk-cotton tree, was sacred to many peoples of the Caribbean and Central America: its roots reach down to the underworld, its branches up to the sky.
@say marco: That tree must be five hundred years old. And the cave under it... the professor marked it on her map.
@say you: The cave splits in two, then each tunnel splits in two again. It's shaped exactly like the tree above it.
@say prof: (journal) *Every chamber has at most two tunnels going deeper: a left and a right. A binary tree. Learn its words before you go in, or you will be lost in the dark.*
@learn The words of trees
A **tree** stores data in a hierarchy. A **binary tree** is a tree where every node has **at most two children**, called **left** and **right**.

| Word | Meaning |
|---|---|
| root | the top node (it has no parent) |
| parent, child | a node and a node directly below it |
| siblings | children of the same parent |
| leaf (terminal node) | a node with no children |
| branch node (non-terminal) | a node with at least one child |
| degree of a node | how many children it has (0, 1 or 2 in a binary tree) |
| **moment** | the number of nodes in the tree |
| **weight** | the number of leaves |
| **level** (depth) of a node | the number of **edges** from the root to it; the root is level 0 |
| **height** of a tree | the number of **edges** on the longest root-to-leaf path |
| subtree | a node and everything below it |

Height and level count **edges**, not nodes. One node alone has height 0; the **empty** tree has height **−1**.

```cpp
struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};
```
@tree tree="10(40(30),25(50,20))" kind="leaves"
Mark the dead ends: click every **leaf** in the cave map.
>> 30, 50 and 20 have no children. So the weight of this tree is 3.
@type tree="10(40(30),25(50,20))" What is the height of the tree you just explored? (Count edges on the longest root-to-leaf path.)
= 2
>> The longest paths, like 10 → 40 → 30, have 2 edges. Three levels (0, 1, 2) means height 2.
@match Match each word to its meaning, the way COMP 2611 defines them.
moment = the number of nodes in the tree
weight = the number of leaves
level of a node = edges on the path from the root to it
height = edges on the longest path from the root to a leaf
degree = the number of children a node has
>> Moment counts nodes, weight counts leaves, and both level and height count edges.
@quiz A binary tree has exactly one node. What are its moment, weight and height?
- [x] moment 1, weight 1, height 0
- [ ] moment 1, weight 0, height 1
- [ ] moment 1, weight 1, height 1
- [ ] moment 0, weight 0, height −1
>> One node: moment 1. It has no children, so it is a leaf: weight 1. No edges: height 0.
@relic words | Taíno words in English | Several everyday English words came from the Taíno language through Spanish: hammock (hamaca), canoe (canoa), hurricane (huracán), barbecue (barbacoa) and savanna (zabana). The Taíno were among the first peoples of the Americas the Spanish met in 1492.
@journal
- Binary tree: each node has at most two children (left and right)
- Moment = number of nodes; weight = number of leaves
- Level and height count EDGES; the root is level 0; one node has height 0; the empty tree has height −1

## bt-2 | Three ways through the caves
goal: Work out preorder, inorder and postorder traversals by hand.
lessons: f2-traversals

@scene Inside the cave · torchlight on painted walls
@say marco: The walls are covered in paintings. Faces, birds, turtles... the zemís.
@say you: The professor wrote that the paintings must be read in three different orders to get three different numbers.
@learn Preorder, inorder, postorder
A **traversal** visits every node once. The three recursive traversals differ only in **when the node itself is visited**:

```cpp
void preOrder (BTNode * root) {      // node, left, right
	if (root == NULL) return;
	cout << root->data << " ";
	preOrder (root->left);
	preOrder (root->right);
}

void inOrder (BTNode * root) {       // left, node, right
	if (root == NULL) return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}

void postOrder (BTNode * root) {     // left, right, node
	if (root == NULL) return;
	postOrder (root->left);
	postOrder (root->right);
	cout << root->data << " ";
}
```

**Working one out by hand:** apply the rule at the root, and treat each subtree as a smaller tree with the same rule. For the tree 10 with children 40 (child 30) and 25 (children 50 and 20):

- Preorder: 10, then all of the left subtree (40 30), then the right (25 50 20): **10 40 30 25 50 20**
- Inorder: left subtree (30 40), then 10, then right (50 25 20): **30 40 10 50 25 20**
- Postorder: left (30 40), right (50 20 25), then 10: **30 40 50 20 25 10**

A trick: walk around the outside of the tree, counter-clockwise from the root. Preorder lists each node when you pass its **left** side, inorder when you pass **under** it, postorder when you pass its **right** side.
@tree tree="20(17(5(,10),18),30(25,50(45,80)))" kind="pre"
The first painting: click the nodes in **preorder** (node, left, right).
@tree tree="20(17(5(,10),18),30(25,50(45,80)))" kind="in"
The second painting: the same tree in **inorder** (left, node, right).
>> This tree is a BST, so inorder visits the keys in sorted order. That is no coincidence (next chapter).
@tree tree="20(17(5(,10),18),30(25,50(45,80)))" kind="post"
The third painting: **postorder** (left, right, node). The root comes last.
@quiz Which traversal always visits the root first?
- [x] Preorder
- [ ] Inorder
- [ ] Postorder
- [ ] None of them
>> Preorder visits the node before its subtrees, so the root comes first. Postorder visits it last.
@lab id="traversal"
Try a tree of your own: type any tree in the lab (level order with gaps, brackets, or two traversals) and watch each traversal step by step.
@journal
- Preorder: node, left, right (root first). Inorder: left, node, right. Postorder: left, right, node (root last)
- Work them out recursively: the same rule at every subtree
- Walk around the tree: pre = left side, in = underneath, post = right side

## bt-3 | The keeper's code
goal: Write recursive tree functions: moment, numTerminal, numOneChild, height and search.
lessons: f3-tree-code

@scene A chamber with a carved stone zemí
@say narrator: A three-pointed stone zemí sits in a niche. Around it, the professor has chalked a list of functions.
@say you: She's asking for the tree's measurements, computed by code. Every one is recursive.
@learn Recursive tree functions
A binary tree is either **empty** (NULL) or **a root with a left subtree and a right subtree**. So nearly every tree function is recursive, with the empty tree as the base case:

```cpp
int moment (BTNode * root) {               // number of nodes
	if (root == NULL)
		return 0;
	return 1 + moment (root->left) + moment (root->right);
}

int numTerminal (BTNode * root) {          // number of leaves (the weight)
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return 1;
	return numTerminal (root->left) + numTerminal (root->right);
}

int height (BTNode * root) {               // edges on the longest path
	if (root == NULL)
		return -1;                         // so a single node gets -1 + 1 = 0
	int l = height (root->left), r = height (root->right);
	return 1 + (l > r ? l : r);
}

bool contains (BTNode * root, int key) {   // search ANY binary tree
	if (root == NULL)
		return false;
	if (root->data == key)
		return true;
	return contains (root->left, key) || contains (root->right, key);
}
```

numOneChild counts nodes with exactly one child: `(root->left == NULL) != (root->right == NULL)` is true exactly then.
@predict The zemí's measurements. What does this print?
```cpp
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

BTNode * mk (int d, BTNode * l, BTNode * r) {
	BTNode * n = new BTNode;
	n->data = d; n->left = l; n->right = r;
	return n;
}

int moment (BTNode * t) { return t == NULL ? 0 : 1 + moment (t->left) + moment (t->right); }
int leaves (BTNode * t) {
	if (t == NULL) return 0;
	if (t->left == NULL && t->right == NULL) return 1;
	return leaves (t->left) + leaves (t->right);
}
int height (BTNode * t) {
	if (t == NULL) return -1;
	int l = height (t->left), r = height (t->right);
	return 1 + (l > r ? l : r);
}
int sum (BTNode * t) { return t == NULL ? 0 : t->data + sum (t->left) + sum (t->right); }

int main() {
	BTNode * root = mk (8, mk (3, mk (1, NULL, NULL), NULL), mk (6, mk (4, NULL, NULL), mk (7, NULL, mk (2, NULL, NULL))));
	cout << moment (root) << " " << leaves (root) << " " << height (root) << " " << sum (root) << endl;
	return 0;
}
```
>> Nodes: 8 3 1 6 4 7 2 (7 of them). Leaves: 1, 4 and 2. The longest path is 8 → 6 → 7 → 2: height 3. The sum is 31.
@fill Finish numTerminal.
```cpp
int numTerminal (BTNode * root) {
	if (root == NULL)
		return [[0]];
	if (root->left == NULL [[&&]] root->right == NULL)
		return [[1]];
	return numTerminal (root->[[left]]) + numTerminal (root->[[right]]);
}
```
>> An empty tree has no leaves; a node with no children is one leaf; otherwise add the leaves of both subtrees.
@quiz Why does height return −1 for an empty tree?
- [ ] Because an empty tree is an error
- [x] So a single node, 1 + max(−1, −1), comes out as height 0
- [ ] Because −1 means "not found"
- [ ] It should return 0
>> With −1 for empty, every node's height is 1 more than its taller child. A leaf gets 1 + (−1) = 0, matching "height counts edges".
@code ex="tree-height"
Write height, counting edges.
@journal
- Tree functions: base case `root == NULL`, then combine the results of both subtrees
- moment = 1 + moment(left) + moment(right); leaves count nodes with no children
- height(NULL) = −1, height = 1 + max(height(left), height(right))
- Searching a general binary tree must check both subtrees

## bt-4 | Level by level
goal: Traverse a tree level by level with a queue, and tell complete, almost complete and full trees apart.
lessons: f4-level-order-types

@scene The cave widens into a vast hall, layer upon layer of ledges
@say marco: It's like a staircase going down. One level at a time.
@learn Level order, and the three shapes
**Level order** visits the root, then every node on level 1 from left to right, then level 2, and so on. It needs a **queue**:

```cpp
void levelOrder (BTNode * root) {
	if (root == NULL) return;
	Queue * q = initQueue ();
	enqueue (q, root);
	while (!isEmptyQueue (q)) {
		BTNode * p = dequeue (q);
		cout << p->data << " ";
		if (p->left != NULL) enqueue (q, p->left);
		if (p->right != NULL) enqueue (q, p->right);
	}
}
```

Each node's children join the back of the queue, so a whole level is printed before the next one starts.

**Three shapes the course names:**

- **Complete**: every non-leaf has two children and all leaves are on the same level (every level is completely full).
- **Almost complete**: every level is full except possibly the lowest, and the lowest level's nodes are packed as far **left** as possible.
- **Full**: every node has 0 or 2 children (no node has exactly one child).

Every complete tree is also full and almost complete. A **heap** is always almost complete, which is why it fits in an array with no gaps.
@tree tree="20(17(5(2,4),18),30(25,50))" kind="level"
Click the nodes in **level order**: top to bottom, left to right on each level.
@quiz tree="20(17(5(2,4),18),30(25,50))" Which best describes this tree?
- [ ] Complete
- [x] Almost complete and full
- [ ] Full but not almost complete
- [ ] None of the three
>> Levels 0 to 2 are completely filled and the lowest level (2 and 4) is packed to the left: almost complete. Every node has 0 or 2 children: full. Not complete, because the leaves are on two different levels.
@quiz tree="10(5(3,8),12(,15))" Which best describes this tree?
- [ ] Complete
- [ ] Almost complete
- [ ] Full
- [x] None of the three
>> 12 has only a right child, so it is not full; and the lowest level has a gap on the left (under 12's left), so it is not almost complete either.
@type A complete binary tree has height 3. How many nodes does it have?
= 15
>> Level k has 2^k nodes: 1 + 2 + 4 + 8 = 15, which is 2^(h+1) − 1.
@journal
- Level order uses a queue: dequeue a node, print it, enqueue its children
- Complete: every level full. Almost complete: full except the lowest, packed left. Full: no node has one child
- A complete tree of height h has 2^(h+1) − 1 nodes; a heap is almost complete

## bt-5 | Rebuilding the map
goal: Rebuild a tree from two traversals, and know which pairs are enough.
lessons: f5-deep-trees

@scene The deepest chamber · the map is in pieces
@say silas: Ah. You found the chamber. Unfortunately, I found it first, and I took the liberty of scrambling the professor's map.
@say marco: What did you do?
@say silas: I kept two lists of the chambers: the order you meet them going in, and the order from left to right. Good luck rebuilding the cave from those.
@say you: Preorder and inorder. That's enough to rebuild it exactly.
@learn Two traversals rebuild a tree
**Preorder + inorder** (with all keys different) give exactly one tree:

1. The **first** key in preorder is the **root**.
2. Find the root in the inorder sequence. Everything to its **left** is the left subtree; everything to its **right** is the right subtree.
3. Repeat for each subtree, taking the next keys from preorder.

Example: preorder **A** B D E C F, inorder D B E **A** F C. The root is A. Inorder puts D B E on the left and F C on the right. In the left part, preorder's next key B is the root, with D on its left and E on its right. In the right part, C is the root with F on its left.

**Postorder + inorder** works the same way, but the root is the **last** key of postorder.

**Preorder + postorder** is **not** enough in general: if a node has one child, you cannot tell whether it is a left or a right child. (Preorder 1 2 and postorder 2 1 fit both 1 with left child 2 and 1 with right child 2.)
@type Preorder is `A B D E C F` and inorder is `D B E A F C`. What is the postorder?
= D E B F C A
>> The rebuilt tree is A with left child B (children D, E) and right child C (left child F). Postorder: left subtree D E B, right subtree F C, then A.
@quiz Preorder: 5 3 2 4 8 9. Inorder: 2 3 4 5 8 9. Which keys are in the root's LEFT subtree?
- [x] 2, 3 and 4
- [ ] 3 and 2
- [ ] 8 and 9
- [ ] 3 only
>> The root is 5 (first in preorder). In the inorder sequence, everything left of 5 (2 3 4) is the left subtree.
@quiz Why are preorder and postorder together NOT always enough to rebuild a tree?
- [ ] They might list the keys in different amounts
- [x] A node with one child could have it on the left or the right, and both trees give the same two sequences
- [ ] Postorder does not include the root
- [ ] They are always enough
>> Inorder is what tells left from right: a key before the root in inorder is on the left. Without it, a single child's side is ambiguous.
@lab id="traversal" preset='{"pre": "A B D E C F", "in": "D B E A F C", "kind": "post"}'
Rebuild it yourself: in the lab, choose My own tree, then Preorder + inorder, and type Silas's two lists. The lab draws the tree.
@say narrator: The tree takes shape on the cave wall. At the spot where the deepest chamber should be, there is a carved niche, and in it, a key shaped like the ceiba, and a scroll stamped with a royal seal: **ARCHIVO GENERAL DE INDIAS · SEVILLA**.
@say marco: Seville. The archive of the whole Spanish empire.
@say you: And an archive that big must have an index. A sorted one.
@boss
The Rootless Tree scrambles traversals. Only preorder and inorder together can rebuild it. Beat it with exam-style tree questions.
@journal
- Preorder + inorder (distinct keys) rebuild a tree: preorder's first key is the root; inorder splits left from right
- Postorder + inorder also works (the root is postorder's last key)
- Preorder + postorder is not enough when a node has one child
