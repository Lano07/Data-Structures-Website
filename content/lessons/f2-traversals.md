---
title: Tree traversals
summary: A traversal visits every node exactly once. Preorder visits the root first, inorder visits it between its subtrees, and postorder visits it last. Each one is three lines of recursive code.
lectures: Lectures 5–6
goals:
  - Give the preorder, inorder and postorder traversals of any binary tree by hand
  - Write the three recursive traversal functions from memory
  - Use the "walk around the tree" method to check your answers quickly
labs: [traversal]
---

## Three orders that matter

A traversal must visit the root, everything in the left subtree, and everything in the right subtree. There are six ways to order those three parts. The course always does **left before right**, which leaves three orders, named by **where the root goes**:

| Traversal | Order | For the tree A(B, C) |
|---|---|---|
| **Preorder** | Root, Left, Right | A B C |
| **Inorder** | Left, Root, Right | B A C |
| **Postorder** | Left, Right, Root | B C A |

:::diagram tree A(B,C)
The smallest example: root A with left child B and right child C.
:::

The rule applies at **every** node, not just the root. When you "do the left subtree", you do it with the same order inside it.

## Working one out by hand

Take this tree from Lecture 5:

:::diagram tree C(E(F,B),G(,N))
C is the root. G has an empty left subtree and a right child N.
:::

**Preorder** (root, left, right): visit C. Then all of C's left subtree in preorder: E, then F, then B. Then C's right subtree in preorder: G, then (empty left) N.
Result: **C E F B G N**

**Inorder** (left, root, right): first all of C's left subtree in inorder: F, E, B. Then C. Then the right subtree in inorder: (empty) G, N.
Result: **F E B C G N**

**Postorder** (left, right, root): left subtree in postorder: F, B, E. Right subtree in postorder: N, G. Then C last.
Result: **F B E N G C**

:::tip
A quick check: draw a line that walks around the outside of the tree, starting left of the root and keeping the tree on your right. Every node gets passed three times: on its **left** side, **underneath** it, and on its **right** side.
- Preorder lists each node when you pass its left side.
- Inorder lists each node when you pass underneath it.
- Postorder lists each node when you pass its right side.
:::

## The code

The definition of a binary tree is recursive, so the code is too. Each function has one base case (the empty tree) and does the three parts in its own order. This is the lecture solution:

```cpp norun
void preOrder (BTNode * root) {
	if (root == NULL)
		return;
	cout << root->data << " ";
	preOrder (root->left);
	preOrder (root->right);
}

void inOrder (BTNode * root) {
	if (root == NULL)
		return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}

void postOrder (BTNode * root) {
	if (root == NULL)
		return;
	postOrder (root->left);
	postOrder (root->right);
	cout << root->data << " ";
}
```

The three functions are identical except for **where the `cout` line is**. That is the whole difference between the traversals.

```cpp example="Preorder, inorder and postorder"
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

void preOrder (BTNode * root) {
	if (root == NULL)
		return;
	cout << root->data << " ";
	preOrder (root->left);
	preOrder (root->right);
}

void inOrder (BTNode * root) {
	if (root == NULL)
		return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}

void postOrder (BTNode * root) {
	if (root == NULL)
		return;
	postOrder (root->left);
	postOrder (root->right);
	cout << root->data << " ";
}

int main() {
	BTNode * root = createBTNode (10);
	root->left = createBTNode (40);
	root->right = createBTNode (25);
	root->left->left = createBTNode (30);
	root->right->left = createBTNode (50);
	root->right->right = createBTNode (20);
	cout << "Preorder:  "; preOrder (root); cout << endl;
	cout << "Inorder:   "; inOrder (root); cout << endl;
	cout << "Postorder: "; postOrder (root); cout << endl;
	return 0;
}
```

:::diagram tree 10(40(30),25(50,20))
The first tree from Lecture 6. The output above matches the lecture's answers.
:::

The lecture's answers for this tree:

| Traversal | Order |
|---|---|
| Preorder | 10 40 30 25 50 20 |
| Inorder | 30 40 10 50 25 20 |
| Postorder | 30 40 50 20 25 10 |

Step through the program and open the **Call tree** tab: you can see preOrder(10) call preOrder(40), which calls preOrder(30), which calls preOrder on two NULL children and returns.

## How the recursion unfolds

When `inOrder(10)` runs, it cannot print 10 until `inOrder(40)` has finished, and `inOrder(40)` cannot print 40 until `inOrder(30)` has finished. Each call waits on the call stack. The deepest calls (on `NULL`) return first, and the printing happens as the calls finish in order.

For a tree with n nodes, each traversal makes one call per node plus one call per NULL child, about 2n + 1 calls, and does a constant amount of work in each. So every traversal is **O(n)**.

:::parsons Put the lines of inOrder in order.
void inOrder (BTNode * root) {
	if (root == NULL)
		return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}
~	inOrder (root);
:::


:::predict Predict both lines before you run it.
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

void preOrder (BTNode * root) {
	if (root == NULL)
		return;
	cout << root->data << " ";
	preOrder (root->left);
	preOrder (root->right);
}

void postOrder (BTNode * root) {
	if (root == NULL)
		return;
	postOrder (root->left);
	postOrder (root->right);
	cout << root->data << " ";
}

int main() {
	BTNode * root = createBTNode (1);
	root->left = createBTNode (2);
	root->right = createBTNode (3);
	root->left->right = createBTNode (4);
	root->right->left = createBTNode (5);
	preOrder (root);
	cout << endl;
	postOrder (root);
	cout << endl;
	return 0;
}
```
:::


:::teachback
Using a tree whose root is A with left child B and right child C, explain how preorder, inorder and postorder differ.
>> All three visit the whole left subtree before the right subtree.
>> Preorder visits the root first: A B C.
>> Inorder visits the root between its subtrees: B A C.
>> Postorder visits the root last: B C A.
:::

:::quiz
What does this print? The tree is the second one from Lecture 6.
```cpp check
#include <iostream>
using namespace std;

struct BTNode { int data; BTNode * left; BTNode * right; };

BTNode * n (int d, BTNode * l, BTNode * r) {
	BTNode * p = new BTNode;
	p->data = d; p->left = l; p->right = r;
	return p;
}

void inOrder (BTNode * root) {
	if (root == NULL) return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}

int main() {
	BTNode * root = n (10, n (40, n (30, n (50, NULL, NULL), NULL), n (25, NULL, NULL)), NULL);
	inOrder (root);
	cout << endl;
	return 0;
}
```
- [ ] `10 40 30 50 25`
- [x] `50 30 40 25 10`
- [ ] `50 30 25 40 10`
- [ ] `30 50 40 25 10`
>> 10's only child is its left child 40. 40 has left child 30 and right child 25, and 30 has left child 50. Inorder goes as far left as possible first (50), then 30, then 40, then 40's right subtree (25), and the root 10 comes last because its right subtree is empty.
:::

:::quiz
Which traversal of a tree always visits the root **last**?
- [ ] Preorder
- [ ] Inorder
- [x] Postorder
- [ ] Level order
>> Postorder is Left, Right, Root. It finishes both subtrees before visiting the root. This is the order you need when deleting a tree: delete the children before their parent.
:::

:::quiz
The preorder traversal of a binary tree is 8 3 1 6 10 and its inorder traversal is 1 3 6 8 10. What is its postorder traversal?
- [x] `1 6 3 10 8`
- [ ] `1 3 6 10 8`
- [ ] `10 6 1 3 8`
- [ ] `6 1 3 10 8`
>> Preorder starts with the root, 8. In the inorder list, everything before 8 (1 3 6) is the left subtree and everything after it (10) is the right subtree. The left subtree's preorder is 3 1 6, so its root is 3 with children 1 and 6. Postorder: left subtree (1 6 3), right subtree (10), root (8).
:::

:::exam
Traversal questions are quick marks if you are systematic. Write the tree down, apply the rule at every node, and use the walk-around check before you choose an answer.
:::
