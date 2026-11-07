---
title: Writing tree functions
summary: Almost every tree function has the same shape. Handle the empty tree, then combine the answers for the left and right subtrees with the root. Learn the shape once and you can write moment, numTerminal, height, contains and the rest.
lectures: Lectures 5–6
goals:
  - Use the "empty tree, then combine the subtrees" recipe for any tree function
  - Write moment, numTerminal, numOneChild, height and preOrderContains
  - Trace a recursive tree function with the call tree
  - Delete a whole tree in the right order
labs: [traversal, recursion]
---

## The recipe

A binary tree is either empty, or a root with a left subtree and a right subtree. So a function on a tree only has to answer two questions:

1. **What is the answer for an empty tree?** (`root == NULL`)
2. **If I already had the answers for the left and right subtrees, how would I combine them with the root?**

The recursive calls supply the subtree answers. You never have to think about more than one node at a time.

## moment: the number of nodes

- Empty tree: 0 nodes.
- Otherwise: 1 (the root) + the nodes on the left + the nodes on the right.

```cpp norun
int moment (BTNode * root) {
	if (root == NULL)
		return 0;
	return (1 + moment (root->left) + moment (root->right));
}
```

## numTerminal: the number of leaves (the weight)

- Empty tree: 0 leaves.
- The root is a leaf (no children): 1.
- Otherwise: the leaves on the left + the leaves on the right. The root is not a leaf, so it adds nothing.

```cpp norun
int numTerminal (BTNode * root) {
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return 1;
	return (numTerminal (root->left) + numTerminal (root->right));
}
```

The middle case is a second base case. Without it, a leaf would return 0 + 0 = 0 and nothing would ever be counted.

## numNonTerminal: the branch nodes

Lecture 6 also asks for the opposite count: the **non-terminal** nodes, meaning every node that is not a leaf.

- Empty tree: 0.
- The root is a leaf: 0 (a leaf is terminal, so it is not counted).
- Otherwise: 1 for the root, plus the non-terminal nodes on the left, plus those on the right.

```cpp norun
int numNonTerminal (BTNode * root) {
	if (root == NULL)
		return 0;                   // tree is empty
	if (root->left == NULL && root->right == NULL)
		return 0;                   // root has no children: it is a leaf
	return (1 + numNonTerminal (root->left) + numNonTerminal (root->right));
}
```

For the first tree of Lecture 6, 10(40(30),25(50,20)), the non-terminal nodes are 10, 40 and 25: the answer is 3. Check: moment = numTerminal + numNonTerminal, because every node is either a leaf or not. Here 6 = 3 + 3.

## numOneChild: nodes with exactly one child

```cpp norun
int numOneChild (BTNode * root) {
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return 0;
	if (root->left == NULL)
		return 1 + numOneChild (root->right);
	else
	if (root->right == NULL)
		return 1 + numOneChild (root->left);
	else
		return (numOneChild (root->left) + numOneChild (root->right));
}
```

This is the lecture's code. A node with only a right child counts 1 and continues on the right; a node with two children counts nothing itself and adds both sides.

## height

The height is the number of edges on the longest path from the root to a leaf.

- Empty tree: −1. (Then a single node gets 1 + max(−1, −1) = 0, which is correct.)
- Otherwise: 1 + the bigger of the two subtree heights.

```cpp norun
int height (BTNode * root) {
	int leftHeight;
	int rightHeight;
	if (root == NULL)
		return -1;                       // tree is empty
	leftHeight = height (root->left);
	rightHeight = height (root->right);
	if (leftHeight > rightHeight)
		return 1 + leftHeight;
	else
		return 1 + rightHeight;
}
```

## Trying them out

```cpp example="moment, numTerminal, numOneChild, height"
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

int moment (BTNode * root) {
	if (root == NULL)
		return 0;
	return (1 + moment (root->left) + moment (root->right));
}

int numTerminal (BTNode * root) {
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return 1;
	return (numTerminal (root->left) + numTerminal (root->right));
}

int numOneChild (BTNode * root) {
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return 0;
	if (root->left == NULL)
		return 1 + numOneChild (root->right);
	else
	if (root->right == NULL)
		return 1 + numOneChild (root->left);
	else
		return (numOneChild (root->left) + numOneChild (root->right));
}

int height (BTNode * root) {
	if (root == NULL)
		return -1;
	int leftHeight = height (root->left);
	int rightHeight = height (root->right);
	if (leftHeight > rightHeight)
		return 1 + leftHeight;
	else
		return 1 + rightHeight;
}

int main() {
	BTNode * root = createBTNode (20);
	root->left = createBTNode (17);
	root->right = createBTNode (30);
	root->left->left = createBTNode (5);
	root->left->right = createBTNode (18);
	root->left->left->right = createBTNode (10);
	root->right->right = createBTNode (50);
	cout << "moment " << moment (root) << endl;
	cout << "weight " << numTerminal (root) << endl;
	cout << "one child " << numOneChild (root) << endl;
	cout << "height " << height (root) << endl;
	return 0;
}
```

:::diagram tree 20(17(5(,10),18),30(,50))
The tree built above: 7 nodes, 3 leaves (10, 18, 50), 2 nodes with one child (5 and 30), height 3.
:::

Step through `height` with the **Call tree** tab open. Each box shows a call and, once it finishes, the value it returned. The leaves return 0 and each NULL child returns −1.

## preOrderContains: searching a binary tree

In a general binary tree the key could be anywhere, so we may have to look everywhere. The lecture's version searches in preorder: the root first, then the left subtree, and only if the key was not found there, the right subtree.

```cpp norun
bool preOrderContains (BTNode * root, int n) {
	if (root == NULL)
		return false;
	if (root->data == n)
		return true;
	bool found = preOrderContains (root->left, n);
	if (!found)
		return preOrderContains (root->right, n);
	return true;
}
```

In the worst case (the key is missing) it visits every node, so it is O(n). A binary *search* tree (Part G) can do much better, because its values are arranged in order.

## Deleting a whole tree

To free a tree, both subtrees must be deleted before their root, because the root holds the only pointers to them. That is a **postorder** traversal:

```cpp norun
void deleteTree (BTNode * root) {
	if (root == NULL)
		return;
	deleteTree (root->left);
	deleteTree (root->right);
	delete root;
}
```

:::mistake
Deleting the root first (preorder), then calling `deleteTree (root->left)`. After `delete root;`, reading `root->left` uses freed memory.
:::

:::parsons Put the lines of height in order.
int height (BTNode * root) {
	int leftHeight;
	int rightHeight;
	if (root == NULL)
		return -1;
	leftHeight = height (root->left);
	rightHeight = height (root->right);
	if (leftHeight > rightHeight)
		return 1 + leftHeight;
	else
		return 1 + rightHeight;
}
~		return 1 + leftHeight + rightHeight;
:::


:::teachback
Explain the recipe for writing a recursive tree function, using `height` as the example.
>> First handle the empty tree (`root == NULL`) and return its answer; for height that is -1.
>> Trust the recursive calls to give the right answers for the left and right subtrees.
>> Combine them with the root: height is 1 + the larger of the two subtree heights.
>> Each node is visited once, so the function is O(n).
:::

:::quiz
What does this function return for the tree 20(17(5(,10),18),30(,50)) drawn above?
```cpp norun
int mystery (BTNode * root) {
	if (root == NULL)
		return 0;
	if (root->left != NULL && root->right != NULL)
		return 1 + mystery (root->left) + mystery (root->right);
	return mystery (root->left) + mystery (root->right);
}
```
- [ ] 1
- [x] 2
- [ ] 4
- [ ] 7
>> It counts nodes with **two** children. Only 20 (children 17 and 30) and 17 (children 5 and 18) have two children. 5 and 30 have one child each, and the leaves have none.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct BTNode { int data; BTNode * left; BTNode * right; };

BTNode * n (int d, BTNode * l, BTNode * r) {
	BTNode * p = new BTNode;
	p->data = d; p->left = l; p->right = r;
	return p;
}

int f (BTNode * root) {
	if (root == NULL)
		return 0;
	int a = f (root->left);
	int b = f (root->right);
	if (a > b)
		return root->data + a;
	return root->data + b;
}

int main() {
	BTNode * root = n (5, n (3, n (8, NULL, NULL), n (1, NULL, NULL)), n (4, NULL, n (6, NULL, NULL)));
	cout << f (root) << endl;
	return 0;
}
```
- [ ] 15
- [x] 16
- [ ] 27
- [ ] 21
>> `f` returns the largest sum along any path from the root down to a leaf. The paths are 5+3+8 = 16, 5+3+1 = 9 and 5+4+6 = 15, so the answer is 16.
:::

:::exam
When an exam asks you to "write a recursive function" on a tree, write the base case first (`if (root == NULL) return ...;`), then ask what to do with the answers from `root->left` and `root->right`. Check your function on a single leaf before you hand it in.
:::
