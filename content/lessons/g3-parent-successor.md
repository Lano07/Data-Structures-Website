---
title: Parent pointers and the inorder successor
summary: Adding a `parent` pointer to each node lets you walk up the tree. With it you can find a node's depth and its inorder successor (the next key in sorted order), which deletion needs.
lectures: Lecture 8
goals:
  - Add a parent field and keep it correct during insertion
  - Find a node's depth by walking up through parent pointers
  - Find the inorder successor in each of the three cases, by hand and in code
labs: [bst]
---

## A pointer back up

So far, a node only knows its children. Some jobs need to go **up**: "what is above this node?" The lectures add a third pointer:

```cpp norun
struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
	BTNode * parent;
};
```

The root's `parent` is `NULL`. Every other node's `parent` points to the node directly above it.

`createBTNode` must now set `parent` too, and `insertBST` must set it each time it links in a new child:

```cpp norun
BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL)
		return createBTNode (key);         // parent is NULL for now
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
```

The new node is created with `parent == NULL`. When the call returns to the level above, that level's `root` is its parent, so `root->left->parent = root;` sets it. (For children that were already there, it sets the same value again, which does no harm.)

## nodeDepth: walking up

The depth (level) of a node is the number of edges from the root down to it. With parent pointers, count the steps going **up** until there is no parent:

```cpp norun
int nodeDepth (BTNode * node) {
	int branch;
	branch = 0;
	if (node == NULL)
		return -1;
	while (node->parent != NULL) {
		node = node->parent;
		branch++;
	}
	return branch;
}
```

## The inorder successor

The **inorder successor** of a node is the node that comes right after it in an inorder traversal: the next larger key.

:::diagram tree 20(17(5(,10),18),30(25,50(45(40),80)))
The Lecture 8 tree. Inorder: 5, 10, 17, 18, 20, 25, 30, 40, 45, 50, 80. So the successor of 18 is 20, of 25 is 30, and of 30 is 40.
:::

The lecture splits it into three cases.

**Case 1: the node has an empty right subtree and is the left child of its parent y.** The successor is y. (Examples: 25 → 30, 40 → 45, 45 → 50.) An inorder traversal finishes a left subtree and then visits its parent.

**Case 2: the node has a non-empty right subtree.** The successor is the **minimum of the right subtree**: go right once, then left as far as possible. (Examples: 30 → 40, 17 → 18, 20 → 25.)

**Case 3: the node has an empty right subtree and is the right child of its parent.** Its whole subtree is finished, and so is its parent's. Keep going up while you are coming from a **right** child. Stop at the first ancestor you reach from its **left** side: that ancestor is the successor. If you go past the root without that happening, there is no successor: the node holds the largest key. (Examples: 10 → 17, 18 → 20, 80 → none.)

:::trace
Successor of 18: 18 has no right subtree, and it is the right child of 17, so go up to 17. 17 is the left child of 20, so stop: the successor is 20.
:::

## The code

Cases 1 and 3 share one loop: walk up while the node is its parent's right child, then return the parent (which is `NULL` if we walked off the top). This is the lecture's complete version:

```cpp norun
BTNode * inOrderSuccessor (BTNode * node) {
	if (node == NULL)
		return NULL;
	if (node->right != NULL)
		return minimumBST (node->right);     // Case 2
	BTNode * parent;
	parent = node->parent;
	while (parent != NULL && node == parent->right) {
		node = parent;
		parent = parent->parent;
	}
	return parent;                           // Cases 1 and 3
}
```

In Case 1, the loop test fails straight away (the node is a left child), so it returns the parent at once.

```cpp example="nodeDepth and inOrderSuccessor"
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

int nodeDepth (BTNode * node) {
	if (node == NULL)
		return -1;
	int branch = 0;
	while (node->parent != NULL) {
		node = node->parent;
		branch++;
	}
	return branch;
}

BTNode * inOrderSuccessor (BTNode * node) {
	if (node == NULL)
		return NULL;
	if (node->right != NULL)
		return minimumBST (node->right);
	BTNode * parent = node->parent;
	while (parent != NULL && node == parent->right) {
		node = parent;
		parent = parent->parent;
	}
	return parent;
}

int main() {
	int keys[] = {20, 17, 30, 5, 18, 25, 50, 10, 45, 80, 40};
	BTNode * root = NULL;
	for (int i = 0; i < 11; i++)
		root = insertBST (root, keys[i]);
	int asks[] = {18, 25, 30, 10, 80};
	for (int i = 0; i < 5; i++) {
		BTNode * node = containsBST (root, asks[i]);
		BTNode * s = inOrderSuccessor (node);
		cout << asks[i] << " (depth " << nodeDepth (node) << "): successor ";
		if (s == NULL)
			cout << "none" << endl;
		else
			cout << s->data << endl;
	}
	return 0;
}
```

The BST Lab has a **Successor** button that walks through these cases on any tree, and a **Predecessor** button for the mirror image.

## The predecessor is the mirror image

The **inorder predecessor** (the next smaller key) swaps left and right everywhere: if the node has a left subtree, the predecessor is the **maximum** of that left subtree; otherwise walk up while you are coming from a **left** child.

:::parsons Put the lines of inOrderSuccessor in order.
BTNode * inOrderSuccessor (BTNode * node) {
	if (node == NULL)
		return NULL;
	if (node->right != NULL)
		return minimumBST (node->right);
	BTNode * parent;
	parent = node->parent;
	while (parent != NULL && node == parent->right) {
		node = parent;
		parent = parent->parent;
	}
	return parent;
}
~	while (parent != NULL && node == parent->left) {
:::


:::teachback
Explain how to find the inorder successor of a node, both when it has a right subtree and when it does not.
>> With a right subtree: the successor is the minimum of that subtree, so go right once and then left as far as possible.
>> Without one: climb through the parent pointers while you are coming up from a right child.
>> The first parent you reach by coming up from a left child is the successor.
>> If you climb past the root, the node is the maximum and has no successor (NULL).
:::

:::quiz
In the Lecture 8 tree above, which case finds the successor of 10, and what is it?
- [ ] Case 1, and the successor is 5
- [ ] Case 2, and the successor is 17
- [x] Case 3, and the successor is 17
- [ ] Case 3, and there is no successor
>> 10 has no right subtree and is the right child of 5, so it is Case 3: go up to 5. 5 is the left child of 17, so stop there. The successor is 17, which matches the inorder list (5, 10, 17).
:::

:::quiz
Node X has a right child. Where is X's inorder successor?
- [ ] It is X's parent
- [ ] It is X's right child, always
- [x] It is the leftmost node in X's right subtree
- [ ] It is the rightmost node in X's left subtree
>> With a non-empty right subtree (Case 2), the next larger key is the smallest key in that subtree: go right once, then left as far as possible. It is X's right child only when that child has no left subtree.
:::

:::quiz
What does `nodeDepth` return for the node holding 40 in the Lecture 8 tree?
- [ ] 3
- [x] 4
- [ ] 5
- [ ] 2
>> Walking up from 40: 45, 50, 30, 20. That is 4 steps to reach the root, so the depth is 4. It is also the height of this tree, because 40 is the deepest leaf.
:::
