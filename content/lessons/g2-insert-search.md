---
title: Insert and search
summary: Searching and inserting both follow the BST rule from the root down. Search stops at the key or at NULL; insert attaches a new node at the NULL where the search ended. The order of insertions decides the shape of the tree.
lectures: Lecture 7
goals:
  - Draw the BST produced by any sequence of insertions
  - Write insertBST and containsBST recursively, as in the lectures
  - Count the comparisons a search makes
  - Explain why insertBST returns the root
labs: [bst]
---

## Drawing a BST by hand

To insert a key, start at the root and compare: go left if the key is smaller, right if it is larger. When you reach an empty spot, put the new node there. A new key always becomes a **leaf**.

:::steps
Insert 10, 5, 23, 3, 7, 17, 41, 4, 9 into an empty tree:
1. 10 becomes the root.
2. 5 < 10: left of 10. 23 > 10: right of 10.
3. 3: left of 10, left of 5. 7: left of 10, right of 5.
4. 17: right of 10, left of 23. 41: right of 10, right of 23.
5. 4: left of 10, left of 5, right of 3.
6. 9: left of 10, right of 5, right of 7.
:::

:::diagram tree bst: 10 5 23 3 7 17 41 4 9
The result, as in Lecture 7: "Insert 9 as the right child of 7. Insert 17 as the left child of 23."
:::

## insertBST

The lecture breaks insertion into three cases:

- **Case 1: the tree is empty.** Create the node; it is the root of this (sub)tree. Return its address.
- **Case 2: key < root->data.** Insert into the left subtree, then connect the result to the left of the root.
- **Case 3: key > root->data.** Insert into the right subtree, then connect the result to the right of the root.

```cpp norun
BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL) {
		BTNode * newNode = createBTNode (key);
		return newNode;
	}
	if (key < root->data) {
		root->left = insertBST (root->left, key);
	}
	else
	if (key > root->data) {
		root->right = insertBST (root->right, key);
	}
	return root;
}
```

:::why
Why `root->left = insertBST (root->left, key);`? When the left subtree is empty, `insertBST` creates the new node and returns it, and this assignment links it in as the left child. When the left subtree is not empty, the call returns the same subtree root it was given, so the assignment changes nothing. One line handles both.
:::

Every call returns its own `root`, so the outermost call returns the root of the whole tree. That is why the caller writes `root = insertBST (root, key);`. It matters for the very first insert, when `root` changes from `NULL` to the new node.

If the key is already in the tree, neither `<` nor `>` is true, so nothing is inserted and the tree is returned unchanged.

## containsBST: search that returns the node

```cpp norun
BTNode * containsBST (BTNode * root, int key) {
	if (root == NULL)
		return NULL;
	if (root->data == key)
		return root;
	if (key < root->data)
		return containsBST (root->left, key);
	return containsBST (root->right, key);
}
```

It returns a pointer to the node holding the key, or `NULL` if the key is not in the tree. Returning the node (not just true or false) lets other functions change or delete it.

Both functions can also be written with a loop instead of recursion, because they only ever go down one path:

```cpp norun
BTNode * containsBST (BTNode * root, int key) {
	BTNode * curr = root;
	while (curr != NULL && curr->data != key) {
		if (key < curr->data)
			curr = curr->left;
		else
			curr = curr->right;
	}
	return curr;
}
```

## Try it

```cpp example="insertBST and containsBST"
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
	if (root == NULL) {
		BTNode * newNode = createBTNode (key);
		return newNode;
	}
	if (key < root->data) {
		root->left = insertBST (root->left, key);
	}
	else
	if (key > root->data) {
		root->right = insertBST (root->right, key);
	}
	return root;
}

BTNode * containsBST (BTNode * root, int key) {
	if (root == NULL)
		return NULL;
	if (root->data == key)
		return root;
	if (key < root->data)
		return containsBST (root->left, key);
	return containsBST (root->right, key);
}

int main() {
	int keys[] = {10, 5, 23, 3, 7};
	BTNode * root = NULL;
	for (int i = 0; i < 5; i++)
		root = insertBST (root, keys[i]);
	BTNode * found = containsBST (root, 7);
	if (found != NULL)
		cout << "found " << found->data << endl;
	if (containsBST (root, 8) == NULL)
		cout << "8 is not in the tree" << endl;
	return 0;
}
```

Step through the inserts and watch the call stack grow one frame per level as `insertBST` goes down the tree.

## Order of insertion decides the shape

The same keys inserted in a different order give a different tree.

:::diagram tree bst: 40 20 60 10 30 50 70
40, 20, 60, 10, 30, 50, 70: a balanced tree of height 2.
:::

:::diagram tree bst: 10 20 30 40 50 60 70
The same keys in sorted order: every key goes right, giving a "tree" of height 6 that is really a linked list.
:::

Searching for 70 takes 3 comparisons in the first tree but 7 in the second. The last lesson of this part looks at this in detail.

:::parsons Put the lines of insertBST in order.
BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL) {
		BTNode * newNode = createBTNode (key);
		return newNode;
	}
	if (key < root->data) {
		root->left = insertBST (root->left, key);
	}
	else
	if (key > root->data) {
		root->right = insertBST (root->right, key);
	}
	return root;
}
~		root = insertBST (root->left, key);
:::


:::predict The keys go in this order. What is the preorder traversal of the BST?
```cpp
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
	else if (key > root->data)
		root->right = insertBST (root->right, key);
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
	int keys[] = {40, 25, 60, 30, 10, 50, 35};
	BTNode * root = NULL;
	for (int i = 0; i < 7; i++)
		root = insertBST (root, keys[i]);
	preOrder (root);
	cout << endl;
	return 0;
}
```
:::


:::teachback
Explain how `insertBST` finds where a new key belongs, and why it writes `root->left = insertBST (root->left, key);` instead of just calling it.
>> Compare the key with the root: smaller goes left, larger goes right, and an equal key is ignored.
>> Keep going down until a NULL link is reached; the new node belongs there.
>> The recursive call returns the root of that subtree (the new node, when the subtree was empty), and the assignment links it into its parent.
>> One comparison per level, so insertion costs O(h).
:::

:::quiz
The keys 50, 30, 70, 20, 40, 60, 80, 35 are inserted into an empty BST in that order. What is the parent of 35?
- [ ] 30
- [x] 40
- [ ] 20
- [ ] 60
>> 35 < 50 goes left to 30; 35 > 30 goes right to 40; 35 < 40 goes left, which is empty, so 35 becomes the left child of 40.
:::

:::quiz
How many key comparisons does `containsBST` make to find 9 in the Lecture 7 tree (10, 5, 23, 3, 7, 17, 41, 4, 9)?
- [ ] 2
- [ ] 3
- [x] 4
- [ ] 9
>> It compares with 10 (go left), 5 (go right), 7 (go right), then 9 (found). The path is 10 → 5 → 7 → 9: four nodes, so four comparisons.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct BTNode { int data; BTNode * left; BTNode * right; };

BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL) {
		BTNode * p = new BTNode;
		p->data = key; p->left = NULL; p->right = NULL;
		return p;
	}
	if (key < root->data)
		root->left = insertBST (root->left, key);
	else if (key > root->data)
		root->right = insertBST (root->right, key);
	return root;
}

void preOrder (BTNode * root) {
	if (root == NULL) return;
	cout << root->data << " ";
	preOrder (root->left);
	preOrder (root->right);
}

int main() {
	int keys[] = {25, 15, 40, 10, 20, 35, 15};
	BTNode * root = NULL;
	for (int i = 0; i < 7; i++)
		root = insertBST (root, keys[i]);
	preOrder (root);
	cout << endl;
	return 0;
}
```
- [ ] `10 15 20 25 35 40`
- [x] `25 15 10 20 40 35`
- [ ] `25 15 10 20 40 35 15`
- [ ] `25 15 40 10 20 35`
>> The tree is 25(15(10,20),40(35)). The second 15 is a duplicate, so nothing is inserted. Preorder visits root, left subtree, right subtree: 25 15 10 20 40 35.
:::

:::exam
"Draw the BST after inserting these keys" and "which node is the parent of X" are common. Insert one key at a time, always starting again from the root, and remember that each new key becomes a leaf.
:::
