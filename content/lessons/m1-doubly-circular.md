---
title: Doubly linked and circular lists
summary: A doubly linked list gives every node a prev pointer as well as next, so a node can be removed in O(1) and the list can be walked both ways. A circular list joins the last node back to the first, so one pointer to the last node reaches both ends.
lectures: Supplementary (not in the lecture notes)
supp: true
goals:
  - Write the DNode struct and keep both prev and next correct when inserting and deleting
  - Delete a node in O(1) when you already have a pointer to it
  - Traverse a circular list without looping forever
  - Compare singly, doubly and circular lists by cost and memory
labs: [memory]
---

## Doubly linked lists

The course's lists are **singly linked**: each node knows only the node after it. To delete a node you need the node *before* it, which is why deletion walks with `prev` and `curr`. A **doubly linked list** stores both links in every node:

```cpp norun
struct DNode {
	int data;
	DNode * prev;      // the node before (NULL for the first node)
	DNode * next;      // the node after (NULL for the last node)
};
```

Two pointers are kept for the whole list: `head` (the first node) and `tail` (the last node). Every change must keep **both directions** consistent: if `a->next == b` then `b->prev == a`.

## Inserting at the head

Four pointers can change: the new node's two links, the old first node's `prev`, and `head` itself (plus `tail` when the list was empty).

```cpp example="A doubly linked list, walked both ways"
#include <iostream>
using namespace std;

struct DNode {
	int data;
	DNode * prev;
	DNode * next;
};

struct DList {
	DNode * head;
	DNode * tail;
};

DNode * createDNode (int n) {
	DNode * newNode = new DNode;
	newNode->data = n;
	newNode->prev = NULL;
	newNode->next = NULL;
	return newNode;
}

void insertAtHead (DList * L, int n) {
	DNode * newNode = createDNode (n);
	newNode->next = L->head;
	if (L->head != NULL)
		L->head->prev = newNode;    // the old first node now has a node before it
	else
		L->tail = newNode;          // the list was empty: the new node is also the last
	L->head = newNode;
}

// remove a node we already have a pointer to: O(1), no search needed
void deleteNode (DList * L, DNode * x) {
	if (x->prev != NULL)
		x->prev->next = x->next;
	else
		L->head = x->next;          // x was the first node
	if (x->next != NULL)
		x->next->prev = x->prev;
	else
		L->tail = x->prev;          // x was the last node
	delete x;
}

int main () {
	DList L;
	L.head = NULL;
	L.tail = NULL;
	for (int i = 1; i <= 4; i++)
		insertAtHead (&L, i * 10);
	DNode * second = L.head->next;  // the node holding 30
	deleteNode (&L, second);
	cout << "forwards: ";
	for (DNode * c = L.head; c != NULL; c = c->next)
		cout << c->data << " ";
	cout << endl << "backwards: ";
	for (DNode * c = L.tail; c != NULL; c = c->prev)
		cout << c->data << " ";
	cout << endl;
	return 0;
}
```

Step through `deleteNode` in the visualizer. Each `if` handles one end of the list; in the middle, the two neighbours are simply linked to each other, in O(1). In a singly linked list the same deletion costs O(n), because finding the node before x needs a walk from the top.

:::quiz
In a doubly linked list, x is a middle node. Which two assignments unlink it?
- [ ] x->next = x->prev; x->prev = x->next;
- [x] x->prev->next = x->next; x->next->prev = x->prev;
- [ ] x->prev = NULL; x->next = NULL;
- [ ] x->prev->prev = x->next; x->next->next = x->prev;
>> The node before x must now point forward past x, and the node after x must point back past x. Changing x's own pointers does not change the list at all.
:::

## Circular lists

In a **circular** singly linked list, the last node's `next` points back to the first node instead of NULL. Keeping one pointer, `last`, to the last node gives both ends at once: the first node is `last->next`.

- Insert at the head: link the new node after `last`. O(1).
- Insert at the tail: the same, then move `last` to the new node. O(1).
- Traverse: there is no NULL to stop at, so stop when you are back where you started. A `do … while` loop visits the starting node first and then tests.

```cpp example="A circular list with a last pointer"
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

// returns the new last node
Node * insertAtTail (Node * last, int n) {
	Node * newNode = createNode (n);
	if (last == NULL) {
		newNode->next = newNode;    // one node: it points to itself
		return newNode;
	}
	newNode->next = last->next;     // the new node points to the first node
	last->next = newNode;
	return newNode;                 // it is now the last node
}

void printCircular (Node * last) {
	if (last == NULL)
		return;
	Node * curr = last->next;       // the first node
	do {
		cout << curr->data << " ";
		curr = curr->next;
	} while (curr != last->next);   // stop when we are back at the first node
	cout << endl;
}

int main () {
	Node * last = NULL;
	for (int i = 1; i <= 5; i++)
		last = insertAtTail (last, i);
	printCircular (last);
	cout << "first " << last->next->data << ", last " << last->data << endl;
	return 0;
}
```

:::predict A list goes round and round. What does this print?
```cpp
#include <iostream>
using namespace std;

struct Node { int data; Node * next; };

int main () {
	Node * a = new Node, * b = new Node, * c = new Node;
	a->data = 1; b->data = 2; c->data = 3;
	a->next = b; b->next = c; c->next = a;
	Node * p = a;
	for (int i = 0; i < 7; i++) {
		cout << p->data << " ";
		p = p->next;
	}
	cout << endl;
	delete a; delete b; delete c;
	return 0;
}
```
:::

## Choosing a list

| | Singly linked | Doubly linked | Circular (with last) |
|---|---|---|---|
| Pointers per node | 1 | 2 | 1 |
| Insert at head | O(1) | O(1) | O(1) |
| Insert at tail | O(n), or O(1) with a tail pointer | O(1) with tail | O(1) |
| Delete a node you point to | O(n): needs the node before | O(1) | O(n) |
| Walk backwards | no | yes | no |
| End of the list | next == NULL | next == NULL | back at the start |

Doubly linked lists cost one extra pointer per node and more pointer updates per operation. They are worth it when nodes are removed from the middle often, or the list must be walked both ways (an editor's undo list, a music playlist with previous and next).

## Common mistakes

- **Updating only one direction.** After an insert or delete, check every link both ways: `a->next == b` exactly when `b->prev == a`.
- **Forgetting the ends.** Deleting the first or last node of a doubly linked list must update `head` or `tail`.
- **Looping forever on a circular list.** A `while (curr != NULL)` loop never ends, because there is no NULL. Stop when you return to the start.
- **Losing the circle.** Inserting into an empty circular list must make the node point to itself.

:::parsons Put the lines of deleteNode (for a doubly linked list) in order.
void deleteNode (DList * L, DNode * x) {
	if (x->prev != NULL)
		x->prev->next = x->next;
	else
		L->head = x->next;
	if (x->next != NULL)
		x->next->prev = x->prev;
	else
		L->tail = x->prev;
	delete x;
}
~	x->next = NULL;
:::

:::teachback
Explain why deleting a node you already have a pointer to is O(1) in a doubly linked list but O(n) in a singly linked list.
>> To unlink a node, the node before it must be changed to point past it.
>> In a doubly linked list the node before is x->prev, available at once, so the deletion changes a fixed number of pointers: O(1).
>> In a singly linked list there is no prev pointer, so we must walk from top to find the node before x, which can take n steps: O(n).
:::

:::remember
- Doubly linked: every node has prev and next; keep both directions consistent, and update head/tail at the ends.
- Delete a known node in O(1): x->prev->next = x->next; x->next->prev = x->prev (with the end cases).
- Circular: the last node points to the first; a last pointer reaches both ends; traverse with do-while until back at the start.
:::
