---
title: The BST property
summary: A binary search tree keeps every key in order. Everything in a node's left subtree is smaller than it and everything in its right subtree is larger, so a search only ever goes down one path, and an inorder traversal prints the keys sorted.
lectures: Lecture 7
goals:
  - State the BST property and check whether a tree satisfies it
  - Explain why an inorder traversal of a BST is sorted
  - Find the minimum and maximum of a BST by following one side
labs: [bst]
---

## The rule

A **binary search tree** (BST) is a binary tree where, for **every** node:

- every key in its **left** subtree is **smaller** than its key, and
- every key in its **right** subtree is **larger** than its key.

The course's BSTs do not store duplicate keys.

:::diagram tree bst: 10 5 23 3 7 17 41 4 9
The BST from Lecture 7. Check the rule at 5: its left subtree (3, 4) is smaller and its right subtree (7, 9) is larger.
:::

:::mistake
Checking only each node's **children**. The rule is about whole subtrees. In 10(5(3,12),20), the node 5 has a smaller left child and a larger right child, but 12 is in 10's **left** subtree while being larger than 10, so this is **not** a BST.
:::

:::diagram tree 10(5(3,12),20)
Not a BST: 12 is in the left subtree of 10, but 12 > 10.
:::

## Why it is useful: one path down

To find a key, compare it with the root:

- equal: found it;
- smaller: it can only be in the **left** subtree, so ignore the whole right subtree;
- larger: it can only be in the **right** subtree.

Each comparison throws away one whole subtree. A search follows a single path from the root downwards, so it takes at most (height + 1) comparisons. In a well-shaped tree with n nodes the height is about log₂ n, so even a million keys need only about 20 comparisons.

## Inorder gives sorted order

An inorder traversal visits the left subtree, then the root, then the right subtree. In a BST, that is "everything smaller, then this key, then everything larger", at every node. So an **inorder traversal of a BST lists the keys in ascending order**.

```cpp example="Inorder of a BST is sorted"
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

BTNode * createBTNode (int data) {
	BTNode * newNode = new BTNode;
	newNode->data = data;
	newNode->left = NULL;
	newNode->right = NULL;
	return newNode;
}

BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL)
		return createBTNode (key);
	if (key < root->data)
		root->left = insertBST (root->left, key);
	else
	if (key > root->data)
		root->right = insertBST (root->right, key);
	return root;
}

void inOrder (BTNode * root) {
	if (root == NULL)
		return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}

int main() {
	int keys[] = {10, 5, 23, 3, 7, 17, 41, 4, 9};
	BTNode * root = NULL;
	for (int i = 0; i < 9; i++)
		root = insertBST (root, keys[i]);
	inOrder (root);
	cout << endl;
	return 0;
}
```

The keys went in as 10, 5, 23, 3, 7, 17, 41, 4, 9 and come out sorted. (The next lesson explains `insertBST`.) This also gives a quick test: if the inorder traversal of a tree is **not** sorted, the tree is not a BST.

## Minimum and maximum

The smallest key has nothing smaller, so it has no left subtree: keep going left from the root until you cannot. The largest key is found by going right.

```cpp norun
BTNode * minimumBST (BTNode * root) {
	if (root == NULL)
		return NULL;
	while (root->left != NULL)
		root = root->left;
	return root;
}

BTNode * maximumBST (BTNode * root) {
	if (root == NULL)
		return NULL;
	while (root->right != NULL)
		root = root->right;
	return root;
}
```

These return a pointer to the node (or `NULL` for an empty tree), not just the key, because other functions need the node itself.

:::remember
The minimum is the **leftmost** node, not necessarily a leaf: it may have a right child. In the Lecture 7 tree the minimum is 3, which has a right child, 4.
:::

:::teachback
Explain the BST property, and why an inorder traversal of a BST prints the keys in sorted order.
>> Every key in a node's left subtree is smaller than the node's key, and every key in its right subtree is larger.
>> Inorder visits the left subtree, then the node, then the right subtree.
>> So at every node, all the smaller keys are printed before it and all the larger keys after it, which is sorted order.
:::

:::quiz
Which of these is a binary search tree?
- [ ] 15(10(5,20),25)
- [x] 15(10(5,12),25(20,30))
- [ ] 15(10(12,5),25)
- [ ] 15(25(20,30),10(5,12))
>> In the first, 20 is in 15's left subtree. In the third, 12 is the left child of 10. In the fourth, the larger values are on the left. Only the second keeps every left subtree smaller and every right subtree larger.
:::

:::quiz
The inorder traversal of a BST is printed. Which output is possible?
- [ ] `30 20 25 40`
- [x] `5 12 18 40 77`
- [ ] `12 5 18 40`
- [ ] `40 30 20 10`
>> An inorder traversal of a BST is always in ascending order, whatever the shape of the tree.
:::

:::quiz
In the BST 50(30(20,40(35)),70(60,80)), what is the minimum of the right subtree of 30?
- [ ] 30
- [x] 35
- [ ] 40
- [ ] 20
>> The right subtree of 30 is 40 with left child 35. Going left from 40 reaches 35, which has no left child, so 35 is the smallest key in that subtree. (This is exactly how the inorder successor of 30 is found in a later lesson.)
:::
