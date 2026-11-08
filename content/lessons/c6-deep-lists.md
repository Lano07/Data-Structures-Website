---
title: "Deep dive: linked lists, invariants and costs"
summary: Every list operation is correct for one reason - it keeps the list invariant true. This deep dive teaches you to reason with invariants and loop invariants, to enumerate the cases an operation must handle, and to derive (not memorise) the cost of every operation in the notes.
lectures: Lectures 1–4, 11 (deep dive)
goals:
  - State the linked list invariant and check that an operation restores it
  - Use a loop invariant to explain why a traversal is correct and where it stops
  - List the cases an insertion or deletion must handle, and write each one
  - Derive the costs from Lecture 11, including why a search checks about n/2 nodes on average
labs: [lists, memory]
---

## The invariant every list function protects

:::invariant The list invariant
Either `top == NULL` (the list is empty), or `top` holds the address of the first node, and following `next` pointers from it visits **every node exactly once** and ends at a node whose `next` is NULL.
:::

An operation is correct when, assuming the invariant holds before it runs, it **still holds afterwards** and the list contains the right values. Thinking this way turns "does my code work?" into a checklist:

- Does `top` still point at the first node (or NULL if the list is now empty)?
- Is every node still reachable, with none skipped and none lost (no leak)?
- Does the last node's `next` equal NULL (no cycle)?

## Loop invariants: why a traversal works

Lecture 2's `printList` walks the list with a pointer:

```
Node * curr = top;
while (curr != NULL) {
	cout << curr->data << endl;
	curr = curr->next;
}
```

:::invariant Traversal loop invariant
At the start of each pass, `curr` points at the first node not yet printed (or is NULL), and every node before it has been printed exactly once.
:::

- **It starts true:** before the loop nothing is printed and `curr = top`.
- **Each pass keeps it true:** print `curr`'s node, then move `curr` to the next one.
- **When the loop ends**, `curr == NULL`, so by the invariant every node has been printed. The loop must end, because each pass moves one node along a finite list.

The same argument works for `size`, `contains` and `occurs` (Lecture 3); only what happens to each node changes.

:::trap The loop that runs one node too far
Lecture 3's first `getLast` uses `while (last != NULL) last = last->next;` and returns NULL every time: the loop only stops **after** it leaves the last node. To stop **at** the last node, test `last->next != NULL`, which needs a non-empty list, so handle `top == NULL` first. Lecture 3 also shows the other fix: keep a `previous` pointer one node behind.
:::

## Cases: the shape of every insertion and deletion

Most list bugs are a missing case. Before writing an operation, list the situations that need different code.

:::example insertSorted (Lecture 4), case by case
**Case 1: the new node becomes the first node.** This happens when the list is empty **or** the new key is smaller than `top->data`. Code: `newNode->next = top; return newNode;` (it works for the empty list too, since `top` is NULL).

**Case 2: the new node goes after some node `previous`.** Find `previous`, the last node whose data is smaller than the key. Code: `newNode->next = previous->next; previous->next = newNode; return top;`

The order of the two lines in case 2 matters: link the new node to the rest of the list **first**, then attach it to `previous`. Done the other way round, `previous->next` is overwritten before it is copied, and everything after `previous` is lost.
:::

Deletion has the same two shapes: deleting the **first** node (top moves) and deleting a node **after** `previous` (`previous->next = curr->next; delete curr;`). A third situation is the key not being in the list at all, which must leave everything unchanged.

## Deriving the costs (Lecture 11)

Lecture 11 states the costs. Here is where they come from.

:::theorem Average cost of a successful search
If the key is equally likely to be in any of the n positions, a sequential search makes (n + 1)/2 comparisons on average, which is about n/2, and the search is O(n).
:::

:::proof
If the key is in position k (counting from 1), the search makes k comparisons. Each position has probability 1/n, so the average is (1 + 2 + … + n)/n = (n(n + 1)/2)/n = (n + 1)/2.
:::

An **unsuccessful** search always checks all n nodes. That is n comparisons, also O(n).

| Operation | Cost | Why |
|---|---|---|
| Insert at head | O(1) | Two pointer assignments, whatever n is |
| Insert at tail, with only `top` | O(n) | `getLast` walks all n nodes first |
| Insert at tail, with a `tail` pointer | O(1) | The last node is known; this is the queue of Part E |
| Search | O(n) | (n + 1)/2 on average if found, n if not |
| Delete a given key | O(n) | Search (about n/2) plus an O(1) unlink |
| Insert in sorted order | O(n) | Finding `previous` walks up to n nodes |

### Lists against arrays

| | Array | Linked list |
|---|---|---|
| Read element i | O(1): the address is computed | O(n): walk i nodes |
| Insert or delete at the front | O(n): shift everything | O(1) |
| Size | Fixed when created | Grows one node at a time |
| Memory per value | Just the value | The value plus a `next` pointer |

Neither is better everywhere. That is the point of the course: choose the structure that makes **your** most frequent operation cheap.

## Reversing a list: an invariant in action

Reversing a list in place is a classic exam question. Three pointers do it: `prev` (the part already reversed), `curr` (the next node to move) and `after` (so the rest of the list is not lost).

:::invariant Reversal loop invariant
`prev` is the top of the nodes already reversed, and `curr` is the top of the nodes still in their original order. Together they hold every node.
:::

```cpp example="Reversing a linked list in place"
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

void printList (Node * top) {
	Node * curr = top;
	while (curr != NULL) {
		cout << curr->data << " ";
		curr = curr->next;
	}
	cout << endl;
}

Node * reverse (Node * top) {
	Node * prev = NULL;
	Node * curr = top;
	while (curr != NULL) {
		Node * after = curr->next;    // save the rest of the list
		curr->next = prev;            // turn this node around
		prev = curr;                  // the reversed part grows by one
		curr = after;                 // the original part shrinks by one
	}
	return prev;                      // prev is the new top
}

int main () {
	Node * top = createNode (10);
	top->next = createNode (20);
	top->next->next = createNode (30);
	top->next->next->next = createNode (40);
	printList (top);
	top = reverse (top);
	printList (top);
	return 0;
}
```

At the start, `prev` is NULL (nothing is reversed yet) and `curr = top`. Each pass moves one node from the original part to the reversed part. When `curr` is NULL, every node is in the reversed part, and `prev` is its top. It is O(n) time and uses O(1) extra memory.

:::quiz
In `reverse`, what goes wrong if the line `Node * after = curr->next;` is removed and the last line of the loop becomes `curr = curr->next;`?
- [ ] Nothing: curr->next still points at the rest of the list
- [x] After curr->next = prev, curr->next points backwards, so the loop loses the rest of the list
- [ ] It reverses the list but leaks one node
- [ ] It crashes on an empty list only
>> curr->next = prev overwrites the only pointer to the rest of the list. curr = curr->next then moves curr to prev, the part already reversed, so the remaining nodes are lost. Saving after first is what keeps them.
:::

:::quiz
A list has 1,000 nodes, and each key is equally likely to be searched for. About how many nodes does a successful sequential search check on average?
- [ ] 10
- [ ] 1,000
- [x] 500
- [ ] 250
>> The average is (n + 1)/2 = 1,001/2 ≈ 500 comparisons (Lecture 11's "on average n/2 nodes"). Only an unsuccessful search checks all 1,000.
:::

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

int main () {
	Node * a = new Node;
	Node * b = new Node;
	Node * c = new Node;
	a->data = 1; b->data = 2; c->data = 3;
	a->next = b; b->next = c; c->next = NULL;
	Node * top = a;
	Node * previous = a;
	Node * newNode = new Node;
	newNode->data = 9;
	newNode->next = previous->next;
	previous->next = newNode;
	for (Node * p = top; p != NULL; p = p->next)
		cout << p->data << " ";
	cout << endl;
	return 0;
}
```
:::

:::trap Checking curr->next when curr can be NULL
`while (curr->next != NULL)` crashes if `curr` itself is NULL (an empty list). Always ask: can this pointer be NULL here? If so, test it first: `while (curr != NULL && curr->data < key)`. The `&&` stops before the second test when the first is false.
:::

:::teachback
Explain how a loop invariant shows that printList prints every node exactly once, and why the loop must end.
>> Invariant: at the start of each pass, curr points at the first node not yet printed, and every node before it has been printed once.
>> It holds at the start (curr = top, nothing printed), and each pass prints curr's node and moves curr one node on, so it stays true.
>> The loop ends because each pass moves one node along a finite list; when curr is NULL the invariant says every node was printed.
:::

:::remember
- List invariant: top is NULL or the first node; every node reachable once; last next is NULL.
- Loop invariant: curr points at the first unprocessed node; true at start, kept by each pass, gives the result at the end.
- Insertions and deletions: first node versus after previous; link the new node to the rest first.
- Search: (n + 1)/2 on average if found, n if not. Head O(1), tail O(n) without a tail pointer.
- Reverse with prev, curr and a saved next: O(n) time, O(1) extra memory.
:::
