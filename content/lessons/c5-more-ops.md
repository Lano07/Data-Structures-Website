---
title: More list operations
summary: Counting, comparing, joining, copying and reversing lists. Each one is the traversal pattern plus careful pointer changes, and each one has an edge case you must check.
lectures: Lectures 2–4
goals:
  - Write occurs, isEqual, concatenate and copyList
  - Reverse a list in place with three pointers
  - Test every list function on the empty list and on a one-node list
  - Compare lists with arrays for speed
labs: [lists]
---

## A checklist for every list function

Before you call a list function finished, trace it on these four lists:

| Test list | What often goes wrong |
|---|---|
| empty (`top == NULL`) | following `top->next` or `top->data` crashes |
| one node | loops that use `curr->next` start in the wrong place |
| the key in the first node | `top` must change, but the code only changes `prev->next` |
| the key in the last node, or missing | loops run off the end |

## occurs: how many times a key appears

```cpp norun
int occurs (Node * top, int key) {
	int count = 0;
	Node * curr = top;
	while (curr != NULL) {
		if (curr->data == key)
			count++;
		curr = curr->next;
	}
	return count;
}
```

Unlike `contains`, this cannot stop early, because a later node might hold the key again.

## isEqual: comparing two lists

Two lists are equal if they have the same values in the same order and the same length. Walk both lists in step:

```cpp norun
bool isEqual (Node * top1, Node * top2) {
	Node * p = top1;
	Node * q = top2;
	while (p != NULL && q != NULL) {
		if (p->data != q->data)
			return false;
		p = p->next;
		q = q->next;
	}
	return p == NULL && q == NULL;
}
```

The last line checks that both lists ended together. If one list is longer, one pointer is still non-NULL and the answer is `false`.

## concatenate: joining one list onto another

Point the last node of the first list at the first node of the second.

```cpp norun
Node * concatenate (Node * top1, Node * top2) {
	if (top1 == NULL)
		return top2;
	Node * last = top1;
	while (last->next != NULL)
		last = last->next;
	last->next = top2;
	return top1;
}
```

No nodes are copied: afterwards, the second list's nodes are shared. Deleting through one list would leave the other one dangling, so after joining, only use the joined list.

## copyList: making new nodes

To get an independent copy, make a new node for every value, adding each one at the tail. A `tail` pointer avoids walking to the end every time.

```cpp norun
Node * copyList (Node * top) {
	Node * newTop = NULL;
	Node * tail = NULL;
	for (Node * curr = top; curr != NULL; curr = curr->next) {
		Node * newNode = createNode (curr->data);
		if (newTop == NULL)
			newTop = newNode;
		else
			tail->next = newNode;
		tail = newNode;
	}
	return newTop;
}
```

Writing `Node * copy = top;` would *not* copy anything. It makes a second pointer to the same first node.

## reverse: turning every arrow around

Reversing in place means changing every `next` to point backwards. Three pointers walk along together:

- `prev`: the part already reversed (starts as `NULL`)
- `curr`: the node being turned around
- `nextNode`: saves where the rest of the list is, before `curr->next` is overwritten

```cpp example="Reverse a list"
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

Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}

void printList (Node * top) {
	for (Node * curr = top; curr != NULL; curr = curr->next)
		cout << curr->data << " ";
	cout << endl;
}

Node * reverse (Node * top) {
	Node * prev = NULL;
	Node * curr = top;
	while (curr != NULL) {
		Node * nextNode = curr->next;
		curr->next = prev;
		prev = curr;
		curr = nextNode;
	}
	return prev;
}

int main() {
	Node * top = NULL;
	for (int i = 4; i >= 1; i--)
		top = insertAtHead (top, i * 10);
	printList (top);
	top = reverse (top);
	printList (top);
	return 0;
}
```

When the loop ends, `curr` is `NULL` and `prev` is on the old last node, which is the new first node. That is why the function returns `prev`.

:::trace
For 10 → 20 → 30: after the first pass, 10 points to NULL. After the second, 20 points to 10. After the third, 30 points to 20. `prev` is 30, the new top.
:::

:::mistake
Leaving out `nextNode`. After `curr->next = prev;`, the address of the rest of the list is gone, so the loop cannot move on.
:::

## Lists or arrays?

| Operation | Array (n values) | Linked list (n nodes) |
|---|---|---|
| Get the k-th value | O(1): `A[k]` | O(k): walk k steps |
| Insert or delete at the front | O(n): shift everything | O(1) |
| Insert or delete at the end | O(1) if there is room | O(n) to find the end (O(1) with a tail pointer) |
| Search for a value | O(n) | O(n) (n/2 on average) |
| Grow beyond the starting size | not possible for a normal array | always possible |

:::exam
The lectures ask: how long does each list operation take? Search: about n/2 nodes on average, so O(n). Insert at the head: constant time, O(1). Insert at the end: depends on n, O(n). Delete: search (n/2) plus a constant amount of work, so O(n).
:::

:::teachback
Explain how `reverse` turns every arrow around using three pointers, without losing the rest of the list.
>> `prev` starts at NULL and `curr` starts at `top`.
>> Save `nextNode = curr->next` before changing anything, so the rest of the list is not lost.
>> Point `curr->next` back at `prev`, then move both along: `prev = curr; curr = nextNode;`.
>> When `curr` becomes NULL, `prev` is the old last node, which is the new top.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct Node { int data; Node * next; };

Node * insertAtHead (Node * top, int n) {
	Node * p = new Node;
	p->data = n;
	p->next = top;
	return p;
}

int main() {
	Node * top = NULL;
	for (int i = 1; i <= 4; i++)
		top = insertAtHead (top, i);
	Node * prev = NULL;
	Node * curr = top;
	int steps = 0;
	while (curr != NULL && steps < 2) {
		Node * nextNode = curr->next;
		curr->next = prev;
		prev = curr;
		curr = nextNode;
		steps++;
	}
	cout << prev->data << " " << prev->next->data << " " << curr->data << endl;
	return 0;
}
```
- [ ] `4 3 2`
- [x] `3 4 2`
- [ ] `3 2 1`
- [ ] `4 3 1`
>> The list is 4 → 3 → 2 → 1. After two passes of the reverse loop, 3 points back to 4 (so `prev` is 3 and `prev->next` is 4), and `curr` is on 2, the first node not yet reversed.
:::

:::quiz
Which line makes `b` an independent copy of the list starting at `a`?
- [ ] `Node * b = a;`
- [ ] `Node * b = new Node; *b = *a;`
- [x] `Node * b = copyList (a);`
- [ ] `Node * b = a->next;`
>> `Node * b = a;` copies only the address, so both pointers share the same nodes. `*b = *a` copies one node, but its `next` still points into `a`'s list. Only a function that makes a new node for every value gives an independent copy.
:::
