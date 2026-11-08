---
title: Deep dive: binary search trees, proved
summary: Why does an inorder traversal of a BST come out sorted? Why is the inorder successor where the lectures say it is? Why does deleting with the successor keep the BST property? This deep dive proves each claim from Lectures 6–11, shows how insertion order decides the shape, and turns the deletion cases into reasoning rather than memorisation.
lectures: Lectures 6–11 (deep dive)
goals:
  - Prove that an inorder traversal of a BST visits the keys in ascending order
  - Explain why search and insert are correct and cost O(h), and how insertion order decides h
  - Justify both cases of the inorder successor, and the predecessor by symmetry
  - Explain why Case 3 deletion with the successor keeps the BST property, including the special case where the successor is the node's right child
labs: [bst, avl]
---

## The property, precisely

:::def The binary-search-tree property (Lectures 6–7)
For every node x: every key y in x's **left** subtree has y ≤ x, and every key y in x's **right** subtree has y ≥ x. (The course's examples use distinct keys, and `insertBST` ignores a duplicate.)
:::

Lecture 7's trap example (5 at the root, with 3 deep in the right subtree) shows that the property is about **whole subtrees**, not just a node and its children. Each parent-child pair can look fine while the tree is still not a BST.

## Why inorder gives sorted order

:::theorem Inorder of a BST is sorted
An inorder traversal of a BST visits its keys in ascending order.
:::

:::proof
By structural induction (Part N).
**Empty tree:** it visits nothing, which is trivially sorted.
**Tree with root x and subtrees L and R:** by the induction hypothesis, inorder (L) lists L's keys in ascending order, and so does inorder (R). Inorder of the whole tree lists inorder (L), then x, then inorder (R). Every key in L is ≤ x and every key in R is ≥ x, so joining the three lists keeps them in ascending order.
:::

The converse is also true: if the inorder traversal of a binary tree is sorted, the tree is a BST. That gives a simple test for "is this a BST?": do an inorder traversal and check that each key is at least the one before.

## Search and insert: one path from the root

:::invariant Search invariant
If the key is anywhere in the tree, it is in the subtree rooted at the current node.
:::

At each node, `key < root->data` rules out the whole right subtree (everything there is larger) and `key > root->data` rules out the left. So the invariant survives each step down. The search either finds the key or reaches NULL, an empty subtree that by the invariant cannot contain it.

`insertBST` (Lecture 7) follows the same path and puts the new node where the search fell off the tree. So **a new node is always a leaf**, and the existing nodes never move.

:::theorem Cost of search and insert
Both follow one path from the root, doing O(1) work per level: O(h) time, where h is the height of the tree.
:::

Everything therefore depends on h, and h depends on the **order of insertion**:

| Insertion order | Shape | Height |
|---|---|---|
| Sorted, like Lecture 8's 25, 31, 39, 40, 52, 55, 80 | Degenerate: a linked list | n − 1 |
| Zig-zag, like Lecture 8's 25, 90, 62, 78, 70, 74 | Also degenerate: one child per node | n − 1 |
| Middle key first, then the middles of each half | Balanced | ⌊log₂ n⌋ |
| Random order | Close to balanced on average | about 1.39 log₂ n |

Lecture 11's *best case is h = log₂ n, worst case is n* is exactly this table. The supplementary AVL tree lesson shows how to keep h at O(log n) whatever the order.

```cpp example="Insertion order decides the height"
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL) {
		BTNode * newNode = new BTNode;
		newNode->data = key;
		newNode->left = NULL;
		newNode->right = NULL;
		return newNode;
	}
	if (key < root->data)
		root->left = insertBST (root->left, key);
	else if (key > root->data)
		root->right = insertBST (root->right, key);
	return root;
}

int height (BTNode * root) {
	if (root == NULL)
		return -1;
	int hl = height (root->left), hr = height (root->right);
	return 1 + (hl > hr ? hl : hr);
}

void inOrder (BTNode * root) {
	if (root == NULL)
		return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}

int main () {
	int sorted[] = {25, 31, 39, 40, 52, 55, 80};
	int balanced[] = {40, 31, 55, 25, 39, 52, 80};
	BTNode * a = NULL;
	BTNode * b = NULL;
	for (int i = 0; i < 7; i++) {
		a = insertBST (a, sorted[i]);
		b = insertBST (b, balanced[i]);
	}
	inOrder (a); cout << " height " << height (a) << endl;
	inOrder (b); cout << " height " << height (b) << endl;
	return 0;
}
```

The same seven keys and the same sorted inorder, but heights of 6 and 2. A search in the first tree can take 7 comparisons; in the second, at most 3.

## The inorder successor, justified

The successor of x is the next key after x in sorted order. The lectures split it into two cases.

:::theorem Successor, case 1: x has a right subtree
The successor of x is the **minimum of x's right subtree**: go right once, then left as far as possible.
:::

:::proof
Every key larger than x that comes right after x in inorder is in x's right subtree: the right subtree is listed immediately after x. Its smallest key is the first one listed, and the smallest key of a BST is its leftmost node.
:::

:::theorem Successor, case 2: x has no right subtree
Walk up from x until you move up from a **left** child. The parent you reach is the successor. If you reach the root without ever doing so, x is the maximum and has no successor.
:::

:::proof
While x is a right child, its parent p is smaller than everything in its right subtree, so p was listed **before** x and cannot be its successor. The first time the walk moves up from a left child into node y, x is the largest key in y's left subtree. Inorder lists y immediately after its left subtree, so y comes right after x.
:::

That is exactly Lecture 8's code: `while (parent != NULL && node == parent->right) { node = parent; parent = parent->parent; } return parent;`. Lecture 8's examples check it: the successor of 10 is 17 (10 is a right child, and 5 is a left child of 17), and the successor of 80 does not exist.

The **predecessor** is the mirror image. Use the maximum of the left subtree, or walk up until you move up from a **right** child.

## Deletion, and why Case 3 is safe

Lecture 8's three cases:

1. **A leaf:** set the parent's pointer to NULL.
2. **One subtree:** replace the node with the root of its only subtree. Everything in that subtree was already on the correct side of the parent, so the property holds.
3. **Two subtrees:** copy the successor's key into the node, then delete the successor.

:::theorem Case 3 keeps the BST property
After copying the successor's key s into node x and removing the successor's node, the tree is still a BST.
:::

:::proof
**s is larger than everything in x's left subtree**, because s is larger than x. **s is smaller than everything left in x's right subtree**, because s was its minimum. So s fits exactly where x was. And the successor's node has **no left child** (it is a minimum), so removing it is Case 1 or Case 2, which never needs a third case.
:::

:::trap When the successor is the right child
If x's right child has no left child, the successor **is** x's right child. Its parent is x itself, so the general code `parent->left = succ->right` would be wrong. Lecture 8 handles it: `if (parent == node) node->right = succ->right; else parent->left = succ->right;`.
:::

:::example Deleting 30 (Lectures 8–10)
The tree holds 20 (root), 17, 30, 5, 18, 25, 50, 10, 45, 80, 40. Node 30 has two subtrees, so this is Case 3. Its successor is the minimum of the right subtree (rooted at 50): go left to 45, then 40, which has no left child. Copy 40 into the node that held 30. The original 40 is a left child of 45 with no children, so remove it (Case 1). Inorder is still sorted: 5 10 17 18 20 25 40 45 50 80.
:::

:::quiz
In the Lecture 8 tree (20; 17, 30; 5, 18, 25, 50; 10, 45, 80; 40), what is the inorder successor of 25?
- [ ] 20
- [x] 30
- [ ] 40
- [ ] It has none
>> 25 has no right subtree (Case 2). It is the left child of 30, so walking up moves up from a left child at once: the successor is 30.
:::

:::quiz
Which insertion order gives the tallest BST?
- [ ] 50, 30, 70, 20, 40, 60, 80
- [ ] 40, 20, 60, 10, 30, 50, 70
- [x] 10, 70, 20, 60, 30, 50, 40
- [ ] 30, 10, 50, 20, 40, 60, 70
>> 10, 70, 20, 60, 30, 50, 40 zig-zags: each key falls between the two before it, so every node gets exactly one child and the tree is a path of height 6. The first two orders are perfectly balanced (height 2).
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

BTNode * ins (BTNode * root, int key) {
	if (root == NULL) {
		BTNode * p = new BTNode;
		p->data = key;
		p->left = NULL;
		p->right = NULL;
		return p;
	}
	if (key < root->data) root->left = ins (root->left, key);
	else if (key > root->data) root->right = ins (root->right, key);
	return root;
}

int depthOf (BTNode * root, int key) {
	int d = 0;
	while (root != NULL && root->data != key) {
		root = key < root->data ? root->left : root->right;
		d++;
	}
	return root == NULL ? -1 : d;
}

int main () {
	int keys[] = {50, 30, 70, 20, 40, 60, 80, 35};
	BTNode * root = NULL;
	for (int i = 0; i < 8; i++)
		root = ins (root, keys[i]);
	cout << depthOf (root, 35) << " " << depthOf (root, 80) << " " << depthOf (root, 65) << endl;
	return 0;
}
```
:::

:::teachback
Explain why Case 3 deletion copies the inorder successor into the node, and why removing the successor's original node is always easy.
>> The successor is larger than every key in the left subtree (it is larger than the deleted key) and smaller than everything else in the right subtree (it was that subtree's minimum), so it fits exactly in the deleted node's place.
>> The successor is a minimum, so it has no left child.
>> Removing a node with no left child is Case 1 (a leaf) or Case 2 (only a right subtree).
:::

:::remember
- The BST property is about whole subtrees. Inorder sorted ⇔ BST (proved by structural induction).
- Search and insert follow one path: O(h). New nodes are always leaves. Sorted input → height n − 1.
- Successor: the minimum of the right subtree, or walk up until you come from a left child. Predecessor: the mirror image.
- Case 3: copy the successor, then delete it (it has no left child). If the successor is the right child, set node->right = succ->right.
:::
