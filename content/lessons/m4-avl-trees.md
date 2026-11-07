---
title: AVL trees: balanced BSTs
summary: An AVL tree is a BST that keeps every node balanced, so its height stays about log₂ n and search, insert and delete stay O(log n) even in the worst case. Rotations restore the balance after an insert.
lectures: Supplementary (not in the lecture notes)
supp: true
goals:
  - State the AVL balance condition using the course's height (an empty tree has height -1)
  - Compute balance factors and find the first unbalanced node after an insert
  - Perform the four rebalancing cases with single and double rotations
  - Explain why an AVL tree's height is O(log n), so its operations are O(log n) in the worst case
labs: [bst]
---

## Why balance matters

In a plain BST, search, insert and delete cost O(h), where h is the height (see [BST shapes and performance](#l-g5-performance)). Inserting keys in sorted order builds a chain of height n − 1, so every operation becomes O(n). A **balanced** BST changes its shape as keys arrive, so that the height stays close to log₂ n whatever the insertion order.

The AVL tree (named after Adelson-Velsky and Landis, 1962) was the first such tree, and it is the one most courses teach.

## The balance condition

Using the course's definition of height (edges on the longest path down; an empty tree has height −1):

- The **balance factor** of a node is bf = height(left subtree) − height(right subtree).
- A BST is an **AVL tree** when **every** node has bf = −1, 0 or +1.

| Balance factor | Meaning |
|---|---|
| +1 | the left subtree is one level taller |
| 0 | both subtrees have the same height |
| −1 | the right subtree is one level taller |
| +2 or −2 | unbalanced: must be fixed |

The condition is checked at **every** node, not only at the root. A root with bf = 0 can sit above a badly unbalanced subtree.

:::quiz
A node's left subtree has height 2 and its right subtree is empty. What is its balance factor, and is it balanced?
- [ ] 2, balanced
- [x] 3, unbalanced
- [ ] 1, balanced
- [ ] −3, unbalanced
>> The empty right subtree has height −1, so bf = 2 − (−1) = 3. Anything outside −1..+1 is unbalanced.
:::

## Rotations

A **rotation** changes the shape of a small part of the tree in O(1) time, by moving three pointers, while keeping the BST order: the inorder traversal is the same before and after.

**Right rotation at y** (used when the left side is too tall). x is y's left child; x's right subtree T2 moves across to become y's left subtree:

```text
        y                x
       / \              / \
      x   T3    →     T1   y
     / \                  / \
   T1   T2              T2   T3
```

Inorder before: T1 x T2 y T3. Inorder after: T1 x T2 y T3. The order is unchanged, so the result is still a BST. A **left rotation** is the mirror image.

## The four cases after an insert

Insert the key as in a normal BST. Then, walking back up towards the root, update each node's height. At the **first** node z whose balance factor becomes +2 or −2, look at which grandchild the new key went under:

| Case | Where the new key went | Fix |
|---|---|---|
| Left-Left | left subtree of z's left child | right rotation at z |
| Right-Right | right subtree of z's right child | left rotation at z |
| Left-Right | right subtree of z's left child | left rotation at the left child, then right rotation at z |
| Right-Left | left subtree of z's right child | right rotation at the right child, then left rotation at z |

After that one single or double rotation, the subtree has the same height it had before the insert, so nothing above it needs fixing.

:::trace
Insert 10, 20, 30 into an empty AVL tree. After 30, node 10 has bf = −1 − 1 = −2 (its right side is two levels taller). 30 went into the right subtree of 10's right child: Right-Right. A left rotation at 10 makes 20 the root, with 10 on the left and 30 on the right.
:::

## The code

Each node stores its own height, so balance factors cost O(1) to compute.

```cpp example="AVL insertion with rotations"
#include <iostream>
using namespace std;

struct AVLNode {
	int data;
	AVLNode * left;
	AVLNode * right;
	int height;                 // edges on the longest path down; a single node has height 0
};

AVLNode * createAVLNode (int data) {
	AVLNode * newNode = new AVLNode;
	newNode->data = data;
	newNode->left = NULL;
	newNode->right = NULL;
	newNode->height = 0;
	return newNode;
}

int height (AVLNode * node) {
	if (node == NULL)
		return -1;                  // the course's height of an empty tree
	return node->height;
}

void updateHeight (AVLNode * node) {
	int hl = height (node->left), hr = height (node->right);
	node->height = 1 + (hl > hr ? hl : hr);
}

int balance (AVLNode * node) {
	return height (node->left) - height (node->right);
}

AVLNode * rotateRight (AVLNode * y) {
	AVLNode * x = y->left;
	y->left = x->right;             // T2 moves across
	x->right = y;
	updateHeight (y);               // y is now below x, so update it first
	updateHeight (x);
	return x;                       // x is the new root of this subtree
}

AVLNode * rotateLeft (AVLNode * x) {
	AVLNode * y = x->right;
	x->right = y->left;
	y->left = x;
	updateHeight (x);
	updateHeight (y);
	return y;
}

AVLNode * insertAVL (AVLNode * root, int key) {
	if (root == NULL)
		return createAVLNode (key);
	if (key < root->data)
		root->left = insertAVL (root->left, key);
	else if (key > root->data)
		root->right = insertAVL (root->right, key);
	else
		return root;                // duplicates are ignored, as in the course's BSTs
	updateHeight (root);
	int bf = balance (root);
	if (bf > 1 && key < root->left->data)        // Left-Left
		return rotateRight (root);
	if (bf < -1 && key > root->right->data)      // Right-Right
		return rotateLeft (root);
	if (bf > 1 && key > root->left->data) {      // Left-Right
		root->left = rotateLeft (root->left);
		return rotateRight (root);
	}
	if (bf < -1 && key < root->right->data) {    // Right-Left
		root->right = rotateRight (root->right);
		return rotateLeft (root);
	}
	return root;
}

void preorder (AVLNode * root) {
	if (root == NULL)
		return;
	cout << root->data << "(h" << root->height << ") ";
	preorder (root->left);
	preorder (root->right);
}

int main () {
	int keys[] = {10, 20, 30, 40, 50, 25};
	AVLNode * root = NULL;
	for (int i = 0; i < 6; i++) {
		root = insertAVL (root, keys[i]);
		cout << "after " << keys[i] << ": ";
		preorder (root);
		cout << endl;
	}
	return 0;
}
```

Step through it and watch the rotations happen:

- Inserting **30** makes 10 unbalanced (bf = −2, Right-Right): a left rotation at 10 makes 20 the root.
- Inserting **50** makes 30 unbalanced (Right-Right): a left rotation at 30 lifts 40 into its place.
- Inserting **25** makes the root 20 unbalanced (bf = 0 − 2 = −2). 25 went into the *left* subtree of 20's right child 40: Right-Left. A right rotation at 40, then a left rotation at 20, makes 30 the new root: preorder 30 20 10 25 40 50.

:::predict Sorted keys would make a plain BST a chain. What does the AVL tree look like after inserting 1 to 7 in order?
```cpp
#include <iostream>
using namespace std;

struct AVLNode { int data; AVLNode * left; AVLNode * right; int height; };

AVLNode * createAVLNode (int d) { AVLNode * n = new AVLNode; n->data = d; n->left = NULL; n->right = NULL; n->height = 0; return n; }
int height (AVLNode * n) { return n == NULL ? -1 : n->height; }
void updateHeight (AVLNode * n) { int a = height (n->left), b = height (n->right); n->height = 1 + (a > b ? a : b); }
AVLNode * rotateRight (AVLNode * y) { AVLNode * x = y->left; y->left = x->right; x->right = y; updateHeight (y); updateHeight (x); return x; }
AVLNode * rotateLeft (AVLNode * x) { AVLNode * y = x->right; x->right = y->left; y->left = x; updateHeight (x); updateHeight (y); return y; }

AVLNode * insertAVL (AVLNode * r, int k) {
	if (r == NULL) return createAVLNode (k);
	if (k < r->data) r->left = insertAVL (r->left, k);
	else if (k > r->data) r->right = insertAVL (r->right, k);
	else return r;
	updateHeight (r);
	int bf = height (r->left) - height (r->right);
	if (bf > 1 && k < r->left->data) return rotateRight (r);
	if (bf < -1 && k > r->right->data) return rotateLeft (r);
	if (bf > 1) { r->left = rotateLeft (r->left); return rotateRight (r); }
	if (bf < -1) { r->right = rotateRight (r->right); return rotateLeft (r); }
	return r;
}

void preorder (AVLNode * r) { if (r == NULL) return; cout << r->data << " "; preorder (r->left); preorder (r->right); }

int main () {
	AVLNode * root = NULL;
	for (int k = 1; k <= 7; k++)
		root = insertAVL (root, k);
	preorder (root);
	cout << "height " << height (root) << endl;
	return 0;
}
```
:::

## Why the height is O(log n)

Let N(h) be the **fewest** nodes an AVL tree of height h can have. The sparsest such tree has a root, one subtree of height h − 1 and the other of height h − 2 (the most lopsided the balance condition allows):

N(h) = N(h − 1) + N(h − 2) + 1, with N(0) = 1 and N(1) = 2.

This grows like the Fibonacci numbers, which grow exponentially: N(h) is at least about 1.6^h. So a tree with n nodes has 1.6^h ≤ n, which gives h ≤ about 1.44 log₂ n. The height is O(log n), and so are search, insert and delete, **in the worst case**, not only on average.

| | Plain BST | AVL tree |
|---|---|---|
| Search | O(h): O(log n) if lucky, O(n) worst | O(log n) worst case |
| Insert | O(h) | O(log n), plus at most one single or double rotation |
| Delete | O(h) | O(log n), but may rotate at several nodes up the path |
| Extra memory | none | a height (or balance factor) in each node |

## Common mistakes

- **Checking only the root.** Every node must satisfy −1 ≤ bf ≤ 1.
- **Using a height of 0 for an empty subtree.** With the course's definition an empty subtree has height −1; mixing conventions gives wrong balance factors.
- **Updating heights in the wrong order after a rotation.** The node that moves down must be updated first, because the new subtree root's height depends on it.
- **Fixing the wrong node.** Rebalance at the *first* unbalanced node on the way back up from the new leaf, not at the root.
- **Using a single rotation for a Left-Right (or Right-Left) case.** A single rotation just moves the imbalance to the other side; the zig-zag needs a double rotation.

:::quiz
Keys 30, 10, 20 are inserted into an empty AVL tree. Which fix is applied, and what is the root afterwards?
- [ ] Right rotation at 30; root 10
- [ ] Left rotation at 10; root 30
- [x] Left rotation at 10, then right rotation at 30; root 20
- [ ] No rotation; root 30
>> After 20, node 30 has bf = 1 − (−1) = 2, and 20 went into the right subtree of 30's left child 10: Left-Right. Rotate left at 10 (20 moves above 10), then right at 30. 20 becomes the root with 10 and 30 as children.
:::

:::quiz
Why does a rotation keep the tree a valid BST?
- [ ] It sorts the keys again
- [x] It changes the shape but not the inorder sequence of the keys
- [ ] It only moves leaves
- [ ] It swaps keys between nodes
>> In a right rotation, T1 < x < T2 < y < T3 before and after. Only three pointers change, and the left-to-right order of all keys is the same.
:::

:::parsons Put the lines of rotateRight in order.
AVLNode * rotateRight (AVLNode * y) {
	AVLNode * x = y->left;
	y->left = x->right;
	x->right = y;
	updateHeight (y);
	updateHeight (x);
	return x;
}
~	y->right = x->left;
:::

:::teachback
Explain what makes a BST an AVL tree, and why that keeps search O(log n) even when keys arrive in sorted order.
>> Every node's balance factor, the height of its left subtree minus the height of its right subtree, must be −1, 0 or +1.
>> After each insert the heights are updated on the way back up, and the first unbalanced node is fixed with a single or double rotation.
>> Rotations keep the BST order (the inorder sequence does not change).
>> The balance condition forces the height to stay about 1.44 log₂ n, so a search follows a path of O(log n) nodes.
:::

:::remember
- AVL: every node has bf = height(left) − height(right) in {−1, 0, +1}; an empty subtree has height −1.
- After an insert, fix the first unbalanced node on the way up: LL → rotate right; RR → rotate left; LR → left then right; RL → right then left.
- A rotation is O(1) and keeps the inorder order.
- Height ≤ about 1.44 log₂ n, so search, insert and delete are O(log n) in the worst case.
:::
