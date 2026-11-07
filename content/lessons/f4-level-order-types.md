---
title: Level order and types of binary trees
summary: Level order visits a tree one level at a time, from left to right, and needs a queue. The course also names three shapes of tree, complete, almost complete and full, and heaps depend on one of them.
lectures: Lecture 10
goals:
  - Give the level order traversal of a tree, and explain why it uses a queue
  - Write levelOrder using a queue of BTNode pointers
  - Decide whether a tree is complete, almost complete or full, using the course's definitions
labs: [traversal]
---

## Level order traversal

Preorder, inorder and postorder all dive down one side of the tree first. **Level order** instead visits the root, then every node on level 1 from left to right, then every node on level 2, and so on.

:::diagram tree 20(17(5(,10),18),30(25,50(45,80)))
The tree from Lecture 10. Level order: 20 17 30 5 18 25 50 10 45 80.
:::

## Why a queue?

When we visit 17, we learn about its children 5 and 18, but we must not visit them yet: 30 (on level 1) comes first. We need to remember them and come back to them **in the order we found them**. First found, first visited: that is exactly what a **queue** does (first in, first out).

The algorithm from the lecture:

```text
initialize a queue, Q
insert the root of the BT in Q
while (Q is not empty) {
	set p = dequeue (Q)
	visit p
	if left (p) is not null
		insert left (p) in Q
	if right (p) is not null
		insert right (p) in Q
}
```

:::trace
Queue (front first) and output for the tree above:
- start: Q = 20
- visit 20, add 17 and 30: Q = 17 30
- visit 17, add 5 and 18: Q = 30 5 18
- visit 30, add 25 and 50: Q = 5 18 25 50
- visit 5, add 10: Q = 18 25 50 10
- visit 18, 25: Q = 50 10
- visit 50, add 45 and 80: Q = 10 45 80
- visit 10, 45, 80: Q is empty, stop.
:::

## In C++

The queue holds pointers to tree nodes, so its nodes have a `BTNode *` field. The queue functions are the ones from Part E, changed to store `BTNode *` instead of `int`.

```cpp example="Level order with a queue"
#include <iostream>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};

struct QNode {
	BTNode * data;
	QNode * next;
};

struct Queue {
	QNode * head;
	QNode * tail;
};

Queue * initQueue () {
	Queue * q = new Queue;
	q->head = NULL;
	q->tail = NULL;
	return q;
}

bool isEmptyQueue (Queue * q) {
	return q->head == NULL;
}

void enqueue (Queue * q, BTNode * data) {
	QNode * newNode = new QNode;
	newNode->data = data;
	newNode->next = NULL;
	if (q->tail == NULL)
		q->head = newNode;
	else
		q->tail->next = newNode;
	q->tail = newNode;
}

BTNode * dequeue (Queue * q) {
	QNode * temp = q->head;
	BTNode * data = temp->data;
	q->head = q->head->next;
	if (q->head == NULL)
		q->tail = NULL;
	delete temp;
	return data;
}

BTNode * createBTNode (int data) {
	BTNode * newNode = new BTNode;
	newNode->data = data;
	newNode->left = NULL;
	newNode->right = NULL;
	return newNode;
}

void levelOrder (BTNode * root) {
	if (root == NULL)
		return;
	Queue * q = initQueue ();
	enqueue (q, root);
	while (!isEmptyQueue (q)) {
		BTNode * p = dequeue (q);
		cout << p->data << " ";
		if (p->left != NULL)
			enqueue (q, p->left);
		if (p->right != NULL)
			enqueue (q, p->right);
	}
	cout << endl;
	delete q;
}

int main() {
	BTNode * root = createBTNode (20);
	root->left = createBTNode (17);
	root->right = createBTNode (30);
	root->left->left = createBTNode (5);
	root->left->right = createBTNode (18);
	root->left->left->right = createBTNode (10);
	root->right->left = createBTNode (25);
	root->right->right = createBTNode (50);
	root->right->right->left = createBTNode (45);
	root->right->right->right = createBTNode (80);
	levelOrder (root);
	return 0;
}
```

The Tree Traversal Lab shows the queue changing at every step. Level order is O(n): every node goes into the queue once and comes out once.

## Three shapes of binary tree

The course names three special shapes. Learn these definitions exactly as written, because other books use the same words differently.

:::def Complete binary tree
1. Every non-leaf node has two non-empty subtrees, **and**
2. All leaves are at the same level.
:::

:::diagram tree 20(17(5,18),30(25,50))
Complete: every level is completely filled.
:::

:::def Almost complete binary tree
1. All levels, except possibly the lowest, are completely filled, **and**
2. The nodes at the lowest level (all leaves) are as far left as possible.
:::

:::diagram tree 20(17(5(2,4),18),30(25,50))
Almost complete: the lowest level has 2 and 4, packed to the left. (Lecture 11 builds this as a BST by inserting 20, 17, 30, 5, 18, 25, 50, 2, 4.)
:::

:::diagram tree 20(17(5,18(2,4)),30(25,50))
Not almost complete: the lowest level has a gap on its left side (5 has no children, but 18 does).
:::

:::def Full binary tree
Every non-leaf node has exactly two non-empty subtrees. (No node has only one child.)
:::

:::diagram tree 20(17,30(25,50))
Full, but not complete (the leaves are on different levels) and not almost complete (level 1 is filled, but the lowest level's nodes are not as far left as possible).
:::

:::remember
- Every complete tree is also full and almost complete.
- A full tree can have leaves on different levels.
- A **heap** (Part H) is always an almost complete binary tree. That is what lets it be stored in an array without gaps.
:::

## Counting nodes in a complete tree

Level k of a complete tree has 2^k nodes (1, 2, 4, 8, ...). So a complete tree of height h has 2^(h+1) − 1 nodes in total, and 2^h of them are leaves. Turned around: a tree with n nodes that is complete (or almost complete) has a height of about log₂ n. That fact is why heaps and balanced BSTs are fast.

:::teachback
Explain how a queue produces level order, and the difference between a complete and an almost complete binary tree.
>> Enqueue the root; then repeatedly dequeue a node, visit it, and enqueue its left child and then its right child.
>> A queue gives nodes back in the order they were added, which is level by level, left to right.
>> Complete: every non-leaf has two subtrees and all leaves are on the same level.
>> Almost complete: every level is full except possibly the lowest, which is filled from the left.
:::

:::quiz
Which of these is true for the tree 20(17(5,18),30)?
- [ ] It is complete
- [x] It is almost complete and full
- [ ] It is almost complete but not full
- [ ] It is full but not almost complete
>> Level 0 and level 1 are completely filled, and the lowest level (5 and 18) is packed to the left, so it is almost complete. Every non-leaf node (20 and 17) has two children, so it is full. It is not complete, because the leaves 5, 18 and 30 are not all on the same level.
:::

:::quiz
What is the level order traversal of 8(3(1,6(4,7)),10(,14(13)))?
- [ ] 8 3 1 6 4 7 10 14 13
- [x] 8 3 10 1 6 14 4 7 13
- [ ] 1 3 4 6 7 8 10 13 14
- [ ] 8 3 10 1 6 4 7 14 13
>> Level 0: 8. Level 1: 3, 10. Level 2: 1, 6 (children of 3) then 14 (right child of 10). Level 3: 4, 7 (children of 6) then 13 (child of 14).
:::

:::quiz
A complete binary tree has height 3. How many nodes does it have?
- [ ] 8
- [ ] 7
- [x] 15
- [ ] 16
>> Levels 0 to 3 hold 1 + 2 + 4 + 8 = 15 nodes, which is 2^(3+1) − 1.
:::
