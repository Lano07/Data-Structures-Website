---
title: How fast is a BST?
summary: Every BST operation walks one path from the root, so its cost depends on the height h. A well-shaped tree has h close to log₂ n, which is very fast. A degenerate tree has h = n − 1, which is no better than a linked list.
lectures: Lectures 8 and 11
goals:
  - Explain why insert, search and delete cost about h steps
  - Work out the height of the best and worst BSTs for n keys
  - Recognise a degenerate BST and the insertion orders that cause it
  - Compare BSTs with linked lists and arrays
labs: [bst]
---

## Everything depends on the height

Search, insert and delete all start at the root and move down one level per comparison. The longest possible walk is from the root to the deepest leaf: h + 1 nodes, where h is the height of the tree. So each operation takes **O(h)** time.

The lecture puts it this way: the best case to insert, search or delete is **h**; the worst case is **n**; and the best case for h is **log₂ n**.

## The best shape

A tree is as short as possible when every level is full. A complete tree of height h holds 2^(h+1) − 1 nodes, so n nodes need a height of only about log₂ n.

| n (keys) | best height ≈ log₂ n | comparisons, best shape | comparisons, worst shape |
|---|---|---|---|
| 15 | 3 | 4 | 15 |
| 1 000 | 9 | 10 | 1 000 |
| 1 000 000 | 19 | 20 | 1 000 000 |

## The worst shape: a degenerate BST

Lecture 8 inserts 25, 31, 39, 40, 52, 55, 80, in that order. Each key is larger than every key before it, so each one goes to the right of the previous one:

:::diagram tree bst: 25 31 39 40 52 55 80
A degenerate BST: every node has only a right child. Its height is n − 1 = 6.
:::

This tree is really a linked list with extra NULL pointers. Searching for 80 compares with all 7 keys. **Sorted (or reverse-sorted) input produces a degenerate BST.**

```cpp example="Comparisons: balanced vs degenerate"
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL) {
		BTNode * p = new BTNode;
		p->data = key;
		p->left = NULL;
		p->right = NULL;
		return p;
	}
	if (key < root->data)
		root->left = insertBST (root->left, key);
	else if (key > root->data)
		root->right = insertBST (root->right, key);
	return root;
}

int comparisons (BTNode * root, int key) {
	int count = 0;
	while (root != NULL) {
		count++;
		if (key == root->data)
			return count;
		if (key < root->data)
			root = root->left;
		else
			root = root->right;
	}
	return count;
}

int height (BTNode * root) {
	if (root == NULL)
		return -1;
	int l = height (root->left), r = height (root->right);
	return 1 + (l > r ? l : r);
}

int main() {
	BTNode * good = NULL;
	BTNode * bad = NULL;
	int order[] = {64, 32, 96, 16, 48, 80, 112, 8, 24, 40, 56, 72, 88, 104, 120};
	for (int i = 0; i < 15; i++)
		good = insertBST (good, order[i]);
	for (int k = 8; k <= 120; k = k + 8)
		bad = insertBST (bad, k);
	cout << "height: " << height (good) << " vs " << height (bad) << endl;
	cout << "find 120: " << comparisons (good, 120) << " vs " << comparisons (bad, 120) << " comparisons" << endl;
	cout << "find 8:   " << comparisons (good, 8) << " vs " << comparisons (bad, 8) << " comparisons" << endl;
	return 0;
}
```

Both trees hold the same 15 keys. Only the insertion order differs.

## Comparing the structures

| Search for a key | Cost |
|---|---|
| Unsorted array | O(n) |
| Linked list | O(n) |
| Binary tree (not a BST) | O(n): the key could be anywhere |
| Binary search tree | O(h): O(log₂ n) when well-shaped, O(n) when degenerate |
| Heap | O(n): the heap order does not tell you which way to go |

:::remember
"A BST is O(log n)" is only true when the tree is well shaped. The honest answer is **O(h)**, and h can be anywhere from about log₂ n up to n − 1.
:::

## Keeping trees short

Inserting keys in random order usually gives a tree of height close to log₂ n. There are also self-balancing BSTs (AVL trees, red-black trees) that rearrange nodes to keep the height near log₂ n after every insert. They are beyond this course, but they explain why real libraries can promise O(log n).

:::teachback
Explain why searching a BST can be O(log n) or O(n), depending on the order in which its keys were inserted.
>> A search follows one path from the root, so it costs O(h), the height of the tree.
>> In a well-shaped tree each level holds about twice as many nodes as the one above, so h is about log2 n.
>> If the keys are inserted in sorted order, every node has only one child, the tree is a chain, and h is n - 1.
>> So the worst case is O(n), no better than a linked list.
:::

:::quiz
A BST holds 1 023 keys and is complete. At most how many comparisons does a search need?
- [ ] 9
- [x] 10
- [ ] 511
- [ ] 1 023
>> A complete tree with 1 023 = 2^10 − 1 nodes has height 9, so the longest path has 10 nodes. A search compares with at most one node per level: 10 comparisons.
:::

:::quiz
Which insertion order produces a degenerate BST?
- [ ] 40, 20, 60, 10, 30
- [x] 60, 50, 40, 30, 20
- [ ] 30, 20, 40, 10, 50
- [ ] 40, 60, 20, 50, 30
>> Keys in decreasing order each go to the left of the previous key, giving a single left-leaning chain of height 4. Sorted or reverse-sorted input always does this.
:::

:::quiz
In the worst case, how long does it take to insert a key into a BST with n nodes?
- [ ] O(1)
- [ ] O(log n)
- [x] O(n)
- [ ] O(n log n)
>> In a degenerate tree the height is n − 1, so the walk down to the insertion point passes every node. O(log n) is only the best case.
:::

:::exam
Performance questions usually ask for the best or worst case of an operation. For a BST, write down h first, then say what h is in that case: about log₂ n for the best (complete) tree, n − 1 for a degenerate one.
:::
