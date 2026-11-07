---
title: Inserting nodes
summary: Inserting means changing two pointers in the right order. At the head it is instant; at the tail you must walk to the end first; in a sorted list you must find the node just before the new one.
lectures: Lectures 2–4
goals:
  - Write insertAtTail using getLast
  - Write insertSorted and handle every case, including the empty list
  - Explain why `newNode->next` must be set before the old node's `next`
labs: [lists, memory]
---

## Two pointers change, and the order matters

Every insertion links a new node between two places: something before it, and something after it. Two pointers change:

1. The **new node's** `next` must point to whatever comes after it.
2. Whatever comes **before** it (either `top` or a node's `next`) must point to the new node.

Always do step 1 first. If you overwrite the "before" pointer first, you lose the address of everything after it.

## insertAtTail

To add at the end, find the last node with `getLast` and point its `next` at the new node. An empty list is a special case, because there is no last node: the new node simply becomes the whole list.

```cpp norun
Node * insertAtTail (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL)
		return newNode;
	Node * lastNode = getLast (top);
	lastNode->next = newNode;
	return top;
}
```

Here step 1 is already done: `createNode` set `newNode->next` to `NULL`, which is right for a new last node.

```cpp example="insertAtTail"
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

Node * getLast (Node * top) {
	Node * last;
	Node * previous;
	last = previous = top;
	while (last != NULL) {
		previous = last;
		last = last->next;
	}
	return previous;
}

Node * insertAtTail (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL)
		return newNode;
	Node * lastNode = getLast (top);
	lastNode->next = newNode;
	return top;
}

void printList (Node * top) {
	for (Node * curr = top; curr != NULL; curr = curr->next)
		cout << curr->data << " ";
	cout << endl;
}

int main() {
	Node * top = NULL;
	top = insertAtTail (top, 10);
	top = insertAtTail (top, 20);
	top = insertAtTail (top, 30);
	printList (top);
	return 0;
}
```

Values inserted at the tail keep their order: 10, 20, 30.

:::why
Why return `top` at the end? The caller writes `top = insertAtTail (top, n);`. When the list was not empty, `top` does not change, so returning it unchanged is correct. When it was empty, the new node is returned and becomes `top`. One calling pattern works for both cases.
:::

:::exam
insertAtHead is O(1): it does the same few steps no matter how long the list is. insertAtTail is O(n) here, because `getLast` walks the whole list. (Keeping an extra `tail` pointer makes it O(1), as a queue does in Part E.)
:::

## insertSorted

In a list kept in ascending order, a new value must go just before the first value that is larger. There are two cases.

**Case 1: the new node becomes the first node.** This happens when the list is empty, or when the new value is smaller than the first value. Then `top` itself must change.

**Case 2: the new node goes after some node `curr`.** Walk `curr` along while the *next* value is still smaller than the new value. Then link the new node in after `curr`.

```cpp norun
Node * insertSorted (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL || n < top->data) {        // Case 1
		newNode->next = top;
		return newNode;
	}
	Node * curr = top;                          // Case 2
	while (curr->next != NULL && curr->next->data < n)
		curr = curr->next;
	newNode->next = curr->next;                 // step 1
	curr->next = newNode;                       // step 2
	return top;
}
```

The loop test has two parts joined by `&&`. The first part, `curr->next != NULL`, stops at the last node. The second part is only checked when the first is true, so `curr->next->data` never follows a NULL pointer. This "check for NULL first" order matters.

```cpp memory at="25" caption="Inserting 25 into 10 → 20 → 30: curr has stopped at 20, and line 25 is about to link 25 in."
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

Node * insertSorted (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL || n < top->data) {
		newNode->next = top;
		return newNode;
	}
	Node * curr = top;
	while (curr->next != NULL && curr->next->data < n)
		curr = curr->next;
	newNode->next = curr->next;
	curr->next = newNode;
	return top;
}

int main() {
	Node * top = NULL;
	top = insertSorted (top, 30);
	top = insertSorted (top, 10);
	top = insertSorted (top, 20);
	top = insertSorted (top, 25);
	for (Node * p = top; p != NULL; p = p->next)
		cout << p->data << " ";
	cout << endl;
	return 0;
}
```

Use **Step through it** to watch all four calls: 30 goes into the empty list (Case 1), 10 goes in front (Case 1), 20 goes in the middle (Case 2), and 25 goes between 20 and 30 (Case 2).

:::mistake
Writing the two link steps the other way round:

`curr->next = newNode;` then `newNode->next = curr->next;`

After the first line, `curr->next` already *is* `newNode`, so the second line makes the new node point to itself. Everything that used to come after `curr` is lost.
:::

:::parsons Put the lines of insertAtTail in order.
Node * insertAtTail (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL)
		return newNode;
	Node * lastNode = getLast (top);
	lastNode->next = newNode;
	return top;
}
~	newNode->next = top;
:::


:::teachback
Explain the two cases of `insertSorted`, and why in the second case `newNode->next = curr->next;` must come before `curr->next = newNode;`.
>> Case 1: the list is empty or n is smaller than the first value, so the new node goes in front and becomes the new top.
>> Case 2: walk to `curr`, the last node whose value is smaller than n, and link the new node in after it.
>> `newNode->next = curr->next;` first, so the new node holds on to the rest of the list.
>> If `curr->next = newNode;` ran first, the address of the rest of the list would be lost.
:::

:::quiz
`curr` points to the node holding 20 in the list 10 → 20 → 30, and `newNode` holds 25 with `next == NULL`. Which pair of lines links 25 between 20 and 30?
- [ ] `curr->next = newNode;` then `newNode->next = curr->next;`
- [x] `newNode->next = curr->next;` then `curr->next = newNode;`
- [ ] `newNode->next = curr;` then `curr->next = newNode;`
- [ ] `curr = newNode;` then `newNode->next = curr->next;`
>> First copy the address of 30 (held in `curr->next`) into the new node, then point 20 at the new node. The other orders either make a loop or lose the rest of the list.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct Node { int data; Node * next; };

Node * insertSorted (Node * top, int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	if (top == NULL || n < top->data) {
		newNode->next = top;
		return newNode;
	}
	Node * curr = top;
	while (curr->next != NULL && curr->next->data < n)
		curr = curr->next;
	newNode->next = curr->next;
	curr->next = newNode;
	return top;
}

int main() {
	int values[] = {40, 15, 60, 15, 5};
	Node * top = NULL;
	for (int i = 0; i < 5; i++)
		top = insertSorted (top, values[i]);
	for (Node * p = top; p != NULL; p = p->next)
		cout << p->data << " ";
	cout << endl;
	return 0;
}
```
- [ ] `60 40 15 15 5`
- [x] `5 15 15 40 60`
- [ ] `5 15 40 60`
- [ ] `40 15 60 15 5`
>> insertSorted keeps the list in ascending order, and it does not skip duplicates: the second 15 is placed next to the first one.
:::

## Inserting after a given node

Sometimes you already have a pointer to a node and want a new node right after it. It is the same two steps as Case 2, without the search:

```cpp norun
void insertAfter (Node * node, int n) {
	Node * newNode = createNode (n);
	newNode->next = node->next;
	node->next = newNode;
}
```

This is O(1). The searching is what usually costs time, not the linking.
