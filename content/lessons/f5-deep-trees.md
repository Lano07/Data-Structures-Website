---
title: "Deep dive: binary trees, traversals and tree shapes"
summary: This deep dive turns the binary tree chapters into tools you can use in an exam. It covers the one pattern behind every recursive tree function, why each traversal costs O(n), how to rebuild a tree from two traversals, how traversals of expression trees give prefix, infix and postfix, and precise reasoning about complete, almost complete and full trees.
lectures: Lectures 5, 6, 10 (deep dive)
goals:
  - Write any recursive tree function with one pattern - empty tree, then combine root, left and right
  - Explain why every traversal is O(n) time and uses O(h) stack space
  - Rebuild a binary tree from its preorder and inorder traversals, and explain why preorder plus postorder is not enough
  - Read an expression tree in prefix, infix and postfix notation
  - Decide whether a tree is complete, almost complete or full, and give counterexamples between the types
labs: [traversal]
---

## Definitions you must be able to quote

Lecture 5 defines a binary tree recursively: it is **empty**, or it consists of a **root** and two subtrees, a **left** and a **right**, each of which is a binary tree. Left and right are different: a root with only a left child is a different tree from a root with only a right child.

:::def Measures of a tree (Lecture 5)
- **moment**: the number of nodes. **weight**: the number of leaves.
- **level (depth)** of a node: the number of edges from the root to it; the root is at level 0.
- **height** of a tree: the number of edges on the longest path from the root to a leaf. A single node has height 0, and by convention the empty tree has height −1.
:::

## One pattern for every recursive tree function

Every function in Lecture 6 (`moment`, `numNonTerminal`, `preOrderContains`, `height`) has the same skeleton:

```
result f (BTNode * root) {
	if (root == NULL)
		return <answer for the empty tree>;
	return <combine root->data, f (root->left), f (root->right)>;
}
```

| Function | Empty tree | Combine |
|---|---|---|
| moment | 0 | 1 + left + right |
| sum of values | 0 | root->data + left + right |
| height | −1 | 1 + max (left, right) |
| weight (leaves) | 0 | 1 if the root is a leaf, else left + right |
| contains key | false | root holds key, or left, or right |

:::trap A NULL check that is not first
A function that starts with `if (root->left == NULL && root->right == NULL)` follows `root` before checking it. It crashes as soon as it is called on an empty subtree, which happens at every node with exactly one child. Test `root == NULL` first, then the leaf case.
:::

```cpp example="Three tree functions with one pattern"
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

BTNode * createBTNode (int n) {
	BTNode * newNode = new BTNode;
	newNode->data = n;
	newNode->left = NULL;
	newNode->right = NULL;
	return newNode;
}

int height (BTNode * root) {
	if (root == NULL)
		return -1;
	int hl = height (root->left);
	int hr = height (root->right);
	return 1 + (hl > hr ? hl : hr);
}

int countAtLevel (BTNode * root, int k) {
	if (root == NULL)
		return 0;
	if (k == 0)
		return 1;
	return countAtLevel (root->left, k - 1) + countAtLevel (root->right, k - 1);
}

bool isFull (BTNode * root) {
	if (root == NULL)
		return true;
	if ((root->left == NULL) != (root->right == NULL))
		return false;                         // exactly one child
	return isFull (root->left) && isFull (root->right);
}

int main () {
	// Lecture 6's tree: 10 has children 40 and 25; 40 has left child 30; 25 has children 50 and 20
	BTNode * root = createBTNode (10);
	root->left = createBTNode (40);
	root->right = createBTNode (25);
	root->left->left = createBTNode (30);
	root->right->left = createBTNode (50);
	root->right->right = createBTNode (20);
	cout << "height " << height (root) << endl;
	for (int k = 0; k <= height (root); k++)
		cout << "nodes on level " << k << ": " << countAtLevel (root, k) << endl;
	cout << "full? " << (isFull (root) ? "yes" : "no") << endl;
	return 0;
}
```

## Why every traversal is O(n)

:::theorem Traversal cost
Preorder, inorder and postorder each make exactly one call per node plus one call per NULL pointer: n + (n + 1) = 2n + 1 calls. Each call does O(1) work, so each traversal is O(n). At any moment the calls in progress form a path from the root, so the stack holds at most h + 2 frames: O(h) memory.
:::

What changes between the three is only **when** the root is visited: before both subtrees (preorder), between them (inorder) or after both (postorder). Each order has its use:

- **Preorder** visits a parent before its children: use it to **copy** a tree or print it with indentation.
- **Inorder** visits the left subtree, then the root, then the right: in a BST it gives **sorted order** (Part G).
- **Postorder** visits the children before the parent: use it to **delete** a tree (free the children before their parent) or to **evaluate** an expression.
- **Level order** (Lecture 10) uses a queue to visit level by level. It is also O(n): each node is enqueued and dequeued once.

## Rebuilding a tree from two traversals

This is a favourite exam question. Given the **preorder** and **inorder** traversals of a tree with distinct values, there is exactly one tree that fits.

:::steps The method
1. The **first** value in the preorder is the root.
2. Find it in the inorder: everything to its **left** is the left subtree, everything to its **right** is the right subtree.
3. The left subtree has, say, k values. They are the next k values of the preorder, and the rest of the preorder is the right subtree.
4. Repeat on each subtree.
:::

:::example Lecture 6's tree, rebuilt
Preorder: 10 40 30 25 50 20. Inorder: 30 40 10 50 25 20.
- The root is 10. In the inorder, [30 40] is on its left and [50 25 20] on its right.
- Left subtree: preorder [40 30], inorder [30 40]. Its root is 40, and 30 is on its left: 30 is the left child of 40.
- Right subtree: preorder [25 50 20], inorder [50 25 20]. Its root is 25, with 50 on its left and 20 on its right.
Check with the postorder from the slides: 30 40 50 20 25 10. ✓
:::

:::trap Preorder plus postorder is not enough
A root A with only a **left** child B, and a root A with only a **right** child B, both have preorder A B and postorder B A. Preorder and postorder do not say which side a single child is on. The **inorder** is what separates left from right: B A against A B.
:::

## Expression trees

An arithmetic expression is a binary tree: operators are internal nodes and numbers are leaves. For (3 + 4) × (5 − 2), the root is ×, with left subtree 3 + 4 and right subtree 5 − 2.

| Traversal | Output | Name |
|---|---|---|
| Preorder | × + 3 4 − 5 2 | prefix (Polish) notation |
| Inorder | 3 + 4 × 5 − 2 | infix: it needs brackets to mean the right thing |
| Postorder | 3 4 + 5 2 − × | postfix: evaluate it with a stack (Part E) |

Evaluating the tree is a postorder computation: evaluate both subtrees, then apply the root's operator. (3 + 4) × (5 − 2) = 7 × 3 = 21.

## Complete, almost complete, full: exact definitions (Lecture 10)

:::def The three shapes
- **Complete:** every non-leaf node has two non-empty subtrees, **and** all leaves are at the same level.
- **Almost complete:** every level except possibly the lowest is completely filled, and the nodes on the lowest level are as far left as possible.
- **Full:** every non-leaf node has exactly two non-empty subtrees.
:::

How they relate (exam questions love the counterexamples):

- **Complete → full** and **complete → almost complete**: a complete tree has every level filled.
- **Full does not imply almost complete:** root R with a leaf A on the left and B on the right, where B has two children. Every non-leaf has two children, so it is full, but the lowest level's nodes sit under B, on the right, not as far left as possible.
- **Almost complete does not imply full:** a root with one left child is almost complete (the lowest level is filled from the left) but the root has only one child.

A complete tree of height h has exactly 2^(h+1) − 1 nodes; an almost complete one with n nodes has height ⌊log₂ n⌋. That is why heaps, which are almost complete (Lectures 11–12), have height ⌊log₂ n⌋.

:::quiz
The preorder of a tree is 8 3 1 6 10 14, and its inorder is 1 3 6 8 10 14. What is its postorder?
- [x] 1 6 3 14 10 8
- [ ] 1 3 6 14 10 8
- [ ] 6 1 3 14 10 8
- [ ] 1 6 3 10 14 8
>> The root is 8. The inorder splits into [1 3 6] (left) and [10 14] (right). The left preorder is [3 1 6]: root 3 with children 1 and 6. The right preorder is [10 14]: root 10, and in the inorder 14 comes after 10, so 14 is its right child. Postorder: 1 6 3, then 14 10, then 8.
:::

:::quiz
Which tree is full but NOT almost complete?
- [ ] A single node
- [x] A root whose left child is a leaf and whose right child has two leaf children
- [ ] A root with two leaf children
- [ ] A root with only a left child
>> In the second tree every non-leaf node has two children (full). But the lowest level's two nodes are both under the right child, not as far left as possible, so it is not almost complete. A single node and a root with two leaves are complete (so also full and almost complete); a root with only a left child is almost complete but not full.
:::

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

BTNode * mk (int v, BTNode * l, BTNode * r) {
	BTNode * p = new BTNode;
	p->data = v;
	p->left = l;
	p->right = r;
	return p;
}

void post (BTNode * root) {
	if (root == NULL)
		return;
	post (root->left);
	post (root->right);
	cout << root->data << " ";
}

int weight (BTNode * root) {
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return 1;
	return weight (root->left) + weight (root->right);
}

int main () {
	BTNode * root = mk (1, mk (2, mk (4, NULL, NULL), NULL), mk (3, mk (5, NULL, NULL), mk (6, NULL, NULL)));
	post (root);
	cout << endl << "weight " << weight (root) << endl;
	return 0;
}
```
:::

:::teachback
Explain how to rebuild a binary tree from its preorder and inorder traversals, and why the inorder is essential.
>> The first preorder value is the root; find it in the inorder to split the values into the left subtree (before it) and the right subtree (after it).
>> The sizes of those groups tell you how to split the rest of the preorder; repeat on each subtree.
>> The inorder is essential because it is the only traversal that separates left from right: preorder and postorder cannot tell a lone left child from a lone right child.
:::

:::remember
- One pattern: empty tree first, then combine root, f (left), f (right). Check root == NULL before anything else.
- Each traversal: 2n + 1 calls, O(n) time, O(h) stack. Preorder copies, inorder sorts a BST, postorder deletes and evaluates.
- Preorder + inorder → a unique tree; preorder + postorder → not unique.
- Expression trees: preorder = prefix, inorder = infix (needs brackets), postorder = postfix.
- Complete → full and almost complete; full and almost complete do not imply each other.
:::
