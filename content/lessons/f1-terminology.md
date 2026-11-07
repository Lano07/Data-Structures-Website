---
title: Tree terminology
summary: A tree stores data in a hierarchy instead of a line. Learn the words the course uses (root, leaf, moment, weight, level, height) and the BTNode struct that every tree program is built from.
lectures: Lecture 5
goals:
  - Use the course's words for parts of a tree, exactly as the exam does
  - Work out the moment, weight, level of a node and height of a tree
  - Say what makes a tree a binary tree, and why left and right are different
  - Write the BTNode struct and createBTNode
labs: [traversal, memory]
---

## From a line to a hierarchy

A linked list is a line: each node has at most one node after it. A **tree** lets a node have several nodes below it. That shape fits data that branches: folders inside folders, a family tree, or (as we will see) values kept in sorted order so they can be found quickly.

## The words for the parts

The course uses this example tree.

:::diagram gtree A(B(E,F),C,D(G(H,I,J)))
The example tree from Lecture 5. It is not a binary tree, because A and G each have three children.
:::

In words: **A** has children B, C and D. **B** has children E and F. **D** has one child, G. **G** has children H, I and J.

| Word | Meaning | In the example |
|---|---|---|
| node | one element of the tree | A, B, C, ... J |
| root | the only node with no parent; the top | A |
| parent / child | a node directly above / below another | B is the parent of E; E is a child of B |
| siblings | children of the same parent | B, C and D |
| terminal node (leaf) | a node with no children (degree 0) | E, F, C, H, I, J |
| branch node | a nonterminal node: it has at least one child | A, B, D, G |
| degree of a node | the number of children it has | degree(A) = 3, degree(D) = 1 |
| edge | a link from a parent to a child | (G, J) |

## Counting things in a tree

The course gives these measurements names. Learn them exactly.

| Name | Definition | Example tree |
|---|---|---|
| **moment** | the number of nodes in the tree | 10 |
| **weight** | the number of leaves | 6 |
| **level** (or **depth**) of a node | the number of edges on the path from the root to it. The root is at level 0 | depth(C) = 1, depth(H) = 3 |
| **height** of a tree | the number of edges on the longest path from the root to a leaf | 3 |

:::remember
Height and depth count **edges**, not nodes. A tree with only a root has height 0. The empty tree has height −1 (the lecture code returns −1 for an empty tree so that the formula works for every tree).
:::

## Binary trees

A **binary tree** is either:

- **empty**, or
- a **root** and two subtrees, a **left** subtree and a **right** subtree, each of which is itself a binary tree.

Either subtree may be empty. Because the two sides have names, a root with a left child is a different tree from a root with a right child, even if the values are the same.

:::diagram tree A(B)
A has a left child B.
:::

:::diagram tree A(,B)
A has a right child B. This is a different binary tree.
:::

The definition is **recursive**: a binary tree is made of smaller binary trees. That is why almost every tree function in this course is written with recursion.

## A node in C++

A binary tree node holds its data and two pointers, one for each subtree. An empty subtree is a `NULL` pointer, just as `NULL` ends a linked list.

```cpp norun
struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};
```

Compare it with a list node: a list node has one link (`next`); a tree node has two (`left` and `right`). Later lessons add a third pointer, `parent`, which points back up.

```cpp norun
BTNode * createBTNode (int data) {
	BTNode * newNode;
	newNode = new BTNode;
	newNode->data = data;
	newNode->left = NULL;
	newNode->right = NULL;
	return newNode;
}
```

## Building a tree by hand

```cpp memory caption="Each BTNode is on the heap. A NULL child pointer is shown as ∅."
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

BTNode * createBTNode (int data) {
	BTNode * newNode;
	newNode = new BTNode;
	newNode->data = data;
	newNode->left = NULL;
	newNode->right = NULL;
	return newNode;
}

int main() {
	BTNode * root = createBTNode (10);
	root->left = createBTNode (40);
	root->right = createBTNode (25);
	root->left->left = createBTNode (30);
	root->right->left = createBTNode (50);
	root->right->right = createBTNode (20);
	cout << root->right->left->data << endl;
	return 0;
}
```

This is the first tree from Lecture 6, which the next lesson uses for traversals.

:::diagram tree 10(40(30),25(50,20))
The same tree, drawn as a tree. Its moment is 6, its weight is 3 (30, 50, 20) and its height is 2.
:::

:::teachback
Explain the difference between the level of a node and the height of a tree, and what the moment and the weight of a tree are.
>> The level (depth) of a node is the number of edges from the root to it; the root is level 0.
>> The height is the number of edges on the longest path from the root down to a leaf; one node has height 0 and an empty tree has height -1.
>> The moment is the number of nodes.
>> The weight is the number of leaves (terminal nodes).
:::

:::quiz
For the tree just above (10 at the root), which statement is true?
- [ ] Its height is 3, because there are 3 levels
- [x] Its height is 2, and the level of 50 is 2
- [ ] 40 is a terminal node
- [ ] Its weight is 6
>> Height counts edges on the longest root-to-leaf path (10 → 25 → 50 has 2 edges). Three levels (0, 1, 2) means height 2. 40 has a child (30), so it is a branch node. The weight is the number of leaves: 30, 50 and 20, so 3.
:::

:::quiz
A binary tree has only one node. What are its moment, weight and height?
- [x] moment 1, weight 1, height 0
- [ ] moment 1, weight 0, height 1
- [ ] moment 1, weight 1, height 1
- [ ] moment 0, weight 0, height −1
>> One node means moment 1. It has no children, so it is a leaf: weight 1. The longest root-to-leaf path has no edges: height 0. (Height −1 is for the empty tree.)
:::

:::exam
Read the question's definitions carefully. In this course, **height counts edges**, the root is at **level 0**, **moment** means number of nodes and **weight** means number of leaves. Some books count height in nodes, which gives an answer one bigger.
:::
