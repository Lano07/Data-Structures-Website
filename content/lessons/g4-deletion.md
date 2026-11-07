---
title: Deleting from a BST
summary: Deleting a key must leave a valid BST. A leaf is simply cut off (Case 1). A node with one subtree is replaced by that subtree (Case 2). A node with two subtrees takes its inorder successor's key, and the successor node is removed instead (Case 3).
lectures: Lectures 8 and 10
goals:
  - Decide which deletion case applies to any node
  - Draw the tree after deleting a key, in every case
  - Write deleteBST with parent pointers, including deleting the root
labs: [bst]
---

## Three cases

To delete a node, find it with `containsBST`, then look at its children.

:::diagram tree 20(17(5(,10),18),30(25,50(45(40(,41)),80)))
The tree from Lecture 10 used for all the examples below.
:::

| Case | The node has | Examples | What to do |
|---|---|---|---|
| 1 | no children (a leaf) | 10, 18, 25, 41, 80 | Set its parent's pointer to it to NULL |
| 2(a) | no left subtree | 5, 40 | Replace it with the root of its **right** subtree |
| 2(b) | no right subtree | 45 | Replace it with the root of its **left** subtree |
| 3 | two subtrees | 17, 20, 30, 50 | Copy in its inorder successor's key, then delete the successor node |

## Case 1: a leaf

Go to the parent of the node and set its left pointer or right pointer (whichever pointed to the node) to `NULL`. Then free the node.

```cpp norun
if (node->left == NULL && node->right == NULL) {
	BTNode * parent = node->parent;
	if (parent->left == node)
		parent->left = NULL;
	else
		parent->right = NULL;
}
```

## Case 2: one subtree

**(a) No left subtree.** Replace the node with the root of its right subtree. Deleting 5: its right subtree is 10, so 17's left pointer now points to 10.

```cpp norun
if (node->left == NULL) {
	BTNode * parent = node->parent;
	if (parent->left == node)
		parent->left = node->right;
	else
		parent->right = node->right;
}
```

**(b) No right subtree.** Replace the node with the root of its left subtree. Deleting 45: its left subtree starts at 40, so 50's left pointer now points to 40.

```cpp norun
if (node->right == NULL) {
	BTNode * parent = node->parent;
	if (parent->left == node)
		parent->left = node->left;
	else
		parent->right = node->left;
}
```

The lecture adds: this works even if 10 (or 40) has children of its own, because the whole subtree moves up one level together. Every key in it was already on the correct side of the parent, so the tree stays a BST.

:::remember
When a node is moved up, its `parent` pointer must change too: `child->parent = parent;`. Forgetting this leaves later successor searches walking up to a deleted node.
:::

## Case 3: two subtrees

A node with two children cannot simply be cut out: its parent has only one pointer to give to two subtrees. Instead, keep the node and change its **key**:

1. Find the **inorder successor**: the minimum of the node's right subtree.
2. Copy the successor's key into the node.
3. Delete the successor node. It is the minimum of a subtree, so it has **no left child**. That makes it Case 1 or Case 2(a), which are easy.

:::steps
Delete 30 from the Lecture 10 tree:
1. 30 has two subtrees, so it is Case 3.
2. Its successor is the minimum of its right subtree: from 50 go left to 45, then to 40. 40 has no left child, so the successor is 40.
3. Copy 40 into the node that held 30.
4. Remove the old 40 node: its right subtree (41) is connected to its parent (45). Then delete it.
:::

:::diagram tree 20(17(5(,10),18),40(25,50(45(41),80)))
After deleting 30: 40 took its place, and 41 moved up under 45. The inorder order is unchanged apart from 30 being gone.
:::

Why does copying the successor keep the BST property? The successor is larger than everything in the left subtree (it is larger than 30), and it is the smallest key in the right subtree, so everything still on the right is larger than it.

## Deleting the root

If the node to delete is the root, it has no parent, so there is no parent pointer to change. Instead, the BST's root itself becomes the replacement subtree (Case 2) or `NULL` (Case 1, a tree with one node). The lecture says: "If the node to be deleted is the root, set the root of the BST to newRoot." That is why `deleteBST` returns the root.

## The whole function

```cpp norun
BTNode * deleteBST (BTNode * root, int key) {
	BTNode * node = containsBST (root, key);
	if (node == NULL)
		return root;
	BTNode * parent = node->parent;

	// Case 1: the node is a leaf
	if (node->left == NULL && node->right == NULL) {
		if (parent == NULL)
			root = NULL;
		else if (parent->left == node)
			parent->left = NULL;
		else
			parent->right = NULL;
		delete node;
		return root;
	}

	// Case 2(a) no left subtree, Case 2(b) no right subtree
	if (node->left == NULL || node->right == NULL) {
		BTNode * child;
		if (node->left == NULL)
			child = node->right;
		else
			child = node->left;
		if (parent == NULL)
			root = child;
		else if (parent->left == node)
			parent->left = child;
		else
			parent->right = child;
		child->parent = parent;
		delete node;
		return root;
	}

	// Case 3: two subtrees
	BTNode * succ = inOrderSuccessor (node);
	node->data = succ->data;
	BTNode * sp = succ->parent;
	if (sp->left == succ)
		sp->left = succ->right;
	else
		sp->right = succ->right;
	if (succ->right != NULL)
		succ->right->parent = sp;
	delete succ;
	return root;
}
```

```cpp example="deleteBST, every case"
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
	BTNode * parent;
};

BTNode * createBTNode (int data) {
	BTNode * newNode = new BTNode;
	newNode->data = data;
	newNode->left = NULL;
	newNode->right = NULL;
	newNode->parent = NULL;
	return newNode;
}

BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL)
		return createBTNode (key);
	if (key < root->data) {
		root->left = insertBST (root->left, key);
		root->left->parent = root;
	}
	else
	if (key > root->data) {
		root->right = insertBST (root->right, key);
		root->right->parent = root;
	}
	return root;
}

BTNode * containsBST (BTNode * root, int key) {
	while (root != NULL && root->data != key)
		root = key < root->data ? root->left : root->right;
	return root;
}

BTNode * minimumBST (BTNode * root) {
	while (root->left != NULL)
		root = root->left;
	return root;
}

BTNode * inOrderSuccessor (BTNode * node) {
	if (node->right != NULL)
		return minimumBST (node->right);
	BTNode * parent = node->parent;
	while (parent != NULL && node == parent->right) {
		node = parent;
		parent = parent->parent;
	}
	return parent;
}

BTNode * deleteBST (BTNode * root, int key) {
	BTNode * node = containsBST (root, key);
	if (node == NULL)
		return root;
	BTNode * parent = node->parent;
	if (node->left == NULL && node->right == NULL) {
		if (parent == NULL)
			root = NULL;
		else if (parent->left == node)
			parent->left = NULL;
		else
			parent->right = NULL;
		delete node;
		return root;
	}
	if (node->left == NULL || node->right == NULL) {
		BTNode * child;
		if (node->left == NULL)
			child = node->right;
		else
			child = node->left;
		if (parent == NULL)
			root = child;
		else if (parent->left == node)
			parent->left = child;
		else
			parent->right = child;
		child->parent = parent;
		delete node;
		return root;
	}
	BTNode * succ = inOrderSuccessor (node);
	node->data = succ->data;
	BTNode * sp = succ->parent;
	if (sp->left == succ)
		sp->left = succ->right;
	else
		sp->right = succ->right;
	if (succ->right != NULL)
		succ->right->parent = sp;
	delete succ;
	return root;
}

void preOrder (BTNode * root) {
	if (root == NULL)
		return;
	cout << root->data << " ";
	preOrder (root->left);
	preOrder (root->right);
}

int main() {
	int keys[] = {20, 17, 30, 5, 18, 25, 50, 10, 45, 80, 40, 41};
	BTNode * root = NULL;
	for (int i = 0; i < 12; i++)
		root = insertBST (root, keys[i]);
	int del[] = {18, 5, 45, 30, 20};
	for (int i = 0; i < 5; i++) {
		root = deleteBST (root, del[i]);
		cout << "delete " << del[i] << ": ";
		preOrder (root);
		cout << endl;
	}
	return 0;
}
```

The program deletes 18 (Case 1), 5 (Case 2(a)), 45 (Case 2(b)), 30 (Case 3) and finally the root 20 (Case 3), printing the preorder traversal after each one. Draw each tree from its preorder to check yourself. The BST Lab's **Delete** button explains each case on any tree you build.

:::teachback
Explain the three cases of deleting a node from a BST, and why in Case 3 it is the successor's right subtree that is connected to the successor's parent.
>> Case 1, a leaf: set the parent's pointer to it to NULL (or root to NULL), then delete it.
>> Case 2, only one subtree: connect that subtree to the node's parent, then delete the node.
>> Case 3, two subtrees: copy the inorder successor's key into the node, then remove the successor.
>> The successor is the smallest key in the right subtree, so it has no left subtree; its right subtree (possibly NULL) takes its place under its parent.
:::

:::quiz
In the Lecture 10 tree, 50 is deleted. Which key replaces it?
- [ ] 45
- [ ] 41
- [x] 80
- [ ] 40
>> 50 has two subtrees (45 and 80), so it is Case 3. Its successor is the minimum of its right subtree. 80 has no left child, so the successor is 80 itself. 80's key is copied into the node, and the old 80 leaf is removed.
:::

:::quiz
Which case applies when deleting 40 from the Lecture 10 tree, and what happens?
- [ ] Case 1: 45's left pointer becomes NULL
- [x] Case 2(a): 41 takes 40's place as the left child of 45
- [ ] Case 2(b): 41 takes 40's place as the right child of 45
- [ ] Case 3: 41 is copied into 40's node
>> 40 has no left subtree and one right child (41), so it is Case 2(a). 40 is the left child of 45, so 45's left pointer is set to 41, and 41's parent becomes 45.
:::

:::quiz
Why does Case 3 always end up deleting a node with no left child?
- [ ] Because the node being deleted is always a leaf
- [x] Because the successor is the minimum of a subtree, and a minimum has no left child
- [ ] Because the right subtree is always empty
- [ ] Because the successor is always the root of the right subtree
>> If the successor had a left child, that child would be smaller and still in the right subtree, so the successor would not be the minimum. With no left child, removing it is Case 1 or Case 2(a).
:::

:::exam
For a deletion question: (1) find the node, (2) count its children to pick the case, (3) for Case 3, find the successor (right once, then left all the way), (4) redraw only the part of the tree that changes.
:::
