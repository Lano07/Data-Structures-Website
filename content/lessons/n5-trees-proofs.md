---
title: Trees in proofs and counting (structural induction)
summary: A binary tree is defined recursively, so facts about all binary trees can be proved the same way a recursive function is written - a base case for the empty tree and a step that assumes the fact for both subtrees. This gives the n + 1 NULL pointers, the leaves of full trees, the log₂ n height of the best BST, and a way to count tree shapes.
lectures: Course outline learning outcome 6 (not yet in the notes); builds on Lectures 5, 6, 10 and 11
outline: true
goals:
  - Write a proof by structural induction on binary trees, with a base case and an inductive step
  - Prove that a binary tree with n nodes has n + 1 NULL pointers, and use it to count recursive calls
  - Prove that a full binary tree with i internal nodes has i + 1 leaves
  - Explain why a binary tree with n nodes has height at least log₂(n + 1) − 1, and count tree shapes
labs: [traversal]
---

## A recursive definition gives a recursive proof

Lecture 5 defines a binary tree recursively: it **is empty**, or it **consists of a root and two subtrees, a left and a right, each of which is a binary tree**.

Every recursive tree function in Lecture 6 (moment, numNonTerminal, preOrderContains) follows that definition: one case for the empty tree, and one case that trusts the recursive calls on the two subtrees.

**Structural induction** is the same shape, used to *prove* something about every binary tree:

1. **Base case:** prove the claim for the empty tree.
2. **Inductive step:** take a tree with a root and subtrees L and R. **Assume** the claim is true for L and for R (the *induction hypothesis*), and prove it for the whole tree.

Since every binary tree is built from the empty tree by that one rule, the claim then holds for all of them. The outline lists this as a learning outcome: show how trees appear in *proof techniques (structural induction) and counting*.

## Claim 1: n nodes means n + 1 NULL pointers

Count the NULL pointers in a tree, including `root` itself when the tree is empty. **Claim:** a binary tree with n nodes has exactly **n + 1** NULL pointers.

- **Base case.** The empty tree has 0 nodes and one NULL pointer (`root == NULL`). 0 + 1 = 1. ✓
- **Inductive step.** The tree has a root with subtrees L (n_L nodes) and R (n_R nodes), so n = n_L + n_R + 1. By the induction hypothesis, L contains n_L + 1 NULL pointers and R contains n_R + 1. The root's own pointers are `root->left` and `root->right`, and each one *is* the root pointer of L or R, so they are already counted. In total: (n_L + 1) + (n_R + 1) = (n_L + n_R + 1) + 1 = **n + 1**. ✓

**So what?** It counts work. `moment` (Lecture 6) makes one call for every node and one for every NULL pointer it reaches: n + (n + 1) = **2n + 1 calls**. That is the size of its recursion tree.

```cpp example="Counting NULL pointers and calls"
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

int calls = 0;

int moment (BTNode * root) {
	calls++;
	if (root == NULL)
		return 0;
	return 1 + moment (root->left) + moment (root->right);
}

int countNulls (BTNode * root) {
	if (root == NULL)
		return 1;
	return countNulls (root->left) + countNulls (root->right);
}

int main () {
	// the tree built in Lecture 6: 10 with left child 40; 40 has children 30 and 25; 30 has left child 50
	BTNode * root = createBTNode (10);
	root->left = createBTNode (40);
	root->left->left = createBTNode (30);
	root->left->right = createBTNode (25);
	root->left->left->left = createBTNode (50);
	int n = moment (root);
	cout << "nodes: " << n << endl;
	cout << "NULL pointers: " << countNulls (root) << " (n + 1 = " << n + 1 << ")" << endl;
	cout << "calls made by moment: " << calls << " (2n + 1 = " << 2 * n + 1 << ")" << endl;
	return 0;
}
```

:::quiz
A binary tree has 12 nodes. How many of its left and right pointers (not counting root) are NULL?
- [ ] 11
- [x] 13
- [ ] 24
- [ ] It depends on the shape
>> By Claim 1 there are n + 1 = 13 NULL pointers whatever the shape. The tree is not empty, so root is not one of them: all 13 are left or right pointers. (12 nodes have 24 pointers in all; the other 11 point to the 11 nodes that are not the root.)
:::

## Claim 2: a full binary tree with i internal nodes has i + 1 leaves

Lecture 10: a binary tree is **full** when every non-leaf node has exactly two non-empty subtrees. Full trees are built by a slightly different rule: a single node is full, and a root whose two subtrees are both full trees is full.

**Claim:** a full binary tree with i internal (non-terminal) nodes has **i + 1 leaves**, so it has **2i + 1 nodes** in all (always an odd number).

- **Base case.** A single node: i = 0 internal nodes and 1 leaf. ✓
- **Inductive step.** A root with full subtrees L and R. By the hypothesis, L has i_L internal nodes and i_L + 1 leaves, and R has i_R internal nodes and i_R + 1 leaves. The whole tree has i = i_L + i_R + 1 internal nodes (the root is internal), and its leaves are the leaves of L and R: (i_L + 1) + (i_R + 1) = (i_L + i_R + 1) + 1 = **i + 1**. ✓

In Lecture 5's words: in a full tree, the **weight** (leaves) is one more than the number of non-terminal nodes that `numNonTerminal` counts.

## Claim 3: how short can a tree be?

**Claim:** level k of a binary tree holds at most **2^k** nodes. Level 0 holds only the root (2⁰ = 1), and each node on level k has at most two children on level k + 1, so level k + 1 holds at most 2 × 2^k = 2^(k+1). (This is ordinary induction on k.)

Adding up levels 0 to h: a tree of height h has at most 1 + 2 + 4 + … + 2^h = **2^(h+1) − 1** nodes. Turn it round: if a tree has n nodes, then n ≤ 2^(h+1) − 1, so

**h ≥ log₂(n + 1) − 1.**

This is where Lecture 11's *the best case for h is log₂ n* comes from: no BST with n nodes can be shorter, so no search can need fewer comparisons in its worst case. A **complete** tree (Lecture 10) reaches the bound exactly, and an **almost complete** tree, like every heap (Lectures 11–12), has height ⌊log₂ n⌋.

:::quiz
What is the smallest possible height of a binary tree with 1,000 nodes?
- [ ] 8
- [x] 9
- [ ] 10
- [ ] 999
>> A tree of height h holds at most 2^(h+1) − 1 nodes. Height 8 holds at most 511, too few; height 9 holds up to 1,023, enough. So the minimum height is 9. The maximum is 999 (a degenerate tree, Lecture 8).
:::

## Counting tree shapes

How many differently shaped binary trees have n nodes? Count by the size of the left subtree. If the left subtree has i nodes, the right one has n − 1 − i, and any left shape can go with any right shape:

T(0) = 1 (the empty tree), and T(n) = T(0)·T(n − 1) + T(1)·T(n − 2) + … + T(n − 1)·T(0).

This gives 1, 1, 2, 5, 14, 42, 132, … (the **Catalan numbers**). The same numbers count the BSTs that can hold the keys 1 to n: each shape can be filled in exactly one way so that inorder gives 1, 2, …, n (Lecture 7).

```cpp example="Counting binary tree shapes"
#include <iostream>
using namespace std;

int main () {
	long long T[16];
	T[0] = 1;
	for (int n = 1; n <= 15; n++) {
		T[n] = 0;
		for (int i = 0; i < n; i++)             // i nodes on the left, n - 1 - i on the right
			T[n] = T[n] + T[i] * T[n - 1 - i];
	}
	for (int n = 0; n <= 15; n++)
		cout << "T(" << n << ") = " << T[n] << endl;
	return 0;
}
```

The counts grow fast: 15 nodes already have almost ten million shapes. That is one reason the *order* of insertions decides how good a BST is.

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

int leaves (int internal) {
	return internal + 1;
}

int maxNodes (int h) {
	int total = 0, level = 1;
	for (int k = 0; k <= h; k++) {
		total = total + level;
		level = level * 2;
	}
	return total;
}

int main () {
	cout << leaves (6) << " " << maxNodes (3) << " " << maxNodes (0) << endl;
	return 0;
}
```
:::

:::parsons Put countNulls in order.
int countNulls (BTNode * root) {
	if (root == NULL)
		return 1;
	return countNulls (root->left) + countNulls (root->right);
}
~		return 0;
:::

:::teachback
Describe the two parts of a proof by structural induction on binary trees, and explain how they match a recursive tree function such as moment.
>> Base case: prove the claim for the empty tree, just as moment returns 0 when root is NULL.
>> Inductive step: assume the claim for the left and right subtrees and prove it for the tree with a root, just as moment trusts its two recursive calls and adds 1.
>> Every binary tree is built from empty trees by that one rule, so the claim holds for every tree.
:::

:::remember
- Structural induction: base case (empty tree), step (assume for L and R, prove for the whole tree).
- n nodes → n + 1 NULL pointers → moment makes 2n + 1 calls.
- Full tree: i internal nodes → i + 1 leaves, 2i + 1 nodes.
- Level k ≤ 2^k nodes; height h ≤ 2^(h+1) − 1 nodes; so h ≥ log₂(n + 1) − 1.
- Shapes with n nodes: 1, 1, 2, 5, 14, 42 … (Catalan).
:::
