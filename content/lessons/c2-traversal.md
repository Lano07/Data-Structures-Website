---
title: Walking through a list
summary: To visit every node, start a pointer at `top` and move it along with `curr = curr->next` until it becomes `NULL`. This one pattern gives you printList, size, contains, sum, getLast and more.
lectures: Lectures 2–3
goals:
  - Write the standard traversal loop from memory
  - Explain why we move a copy of `top` and never `top` itself
  - Write printList, size, contains and getLast
  - Choose between `curr != NULL` and `curr->next != NULL`
labs: [lists, memory]
---

## The traversal pattern

Almost every list function walks through the nodes one at a time. The pattern is always the same:

```cpp norun
Node * curr = top;            // start at the first node
while (curr != NULL) {        // stop after the last node
	// use curr->data here
	curr = curr->next;        // move to the next node
}
```

Read the last line slowly: `curr->next` is the address stored in the current node, so `curr = curr->next` makes `curr` point to the following node. When `curr` is at the last node, its `next` is `NULL`, so `curr` becomes `NULL` and the loop stops.

:::parsons Put the lines of printList in order.
void printList (Node * top) {
	Node * curr = top;
	while (curr != NULL) {
		cout << curr->data << " ";
		curr = curr->next;
	}
	cout << endl;
}
~		curr = top->next;
:::


:::predict This loop stops one node early on purpose. What does it print?
```cpp
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

int main() {
	Node * top = createNode (10);
	top->next = createNode (20);
	top->next->next = createNode (30);
	top->next->next->next = createNode (40);
	Node * curr = top;
	int count = 0;
	while (curr->next != NULL) {
		count++;
		curr = curr->next;
	}
	cout << count << " " << curr->data << endl;
	return 0;
}
```
:::


:::remember
Three parts, every time: **start** at `top`, **test** `curr != NULL`, **move** with `curr = curr->next`.
:::

## printList

```cpp example="printList"
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

int main() {
	Node * top = createNode (10);
	top->next = createNode (20);
	top->next->next = createNode (30);
	printList (top);
	printList (top);
	return 0;
}
```

The list prints twice, because `printList` moved its own pointer `curr`, not `main`'s `top`. Even the parameter `top` inside `printList` is only a copy of `main`'s `top`.

:::mistake
Moving `top` itself in `main`, like `while (top != NULL) top = top->next;`. When the loop ends, `top` is `NULL` and nothing points to the first node any more. The whole list is lost (a memory leak), and later code sees an empty list.
:::

## Counting, searching and adding up

Each of these is the same loop with a different job inside it.

```cpp norun
int size (Node * top) {
	int count = 0;
	Node * curr = top;
	while (curr != NULL) {
		count++;
		curr = curr->next;
	}
	return count;
}

bool contains (Node * top, int key) {
	Node * curr = top;
	while (curr != NULL) {
		if (curr->data == key)
			return true;
		curr = curr->next;
	}
	return false;
}
```

`contains` returns `true` as soon as it finds the key, so it may stop early. It returns `false` only after checking every node.

```cpp example="size, contains and sum"
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

int size (Node * top) {
	int count = 0;
	Node * curr = top;
	while (curr != NULL) {
		count++;
		curr = curr->next;
	}
	return count;
}

bool contains (Node * top, int key) {
	Node * curr = top;
	while (curr != NULL) {
		if (curr->data == key)
			return true;
		curr = curr->next;
	}
	return false;
}

int sum (Node * top) {
	int total = 0;
	for (Node * curr = top; curr != NULL; curr = curr->next)
		total = total + curr->data;
	return total;
}

int main() {
	Node * top = NULL;
	top = insertAtHead (top, 8);
	top = insertAtHead (top, 3);
	top = insertAtHead (top, 5);
	cout << "size " << size (top) << endl;
	cout << "contains 3? " << contains (top, 3) << endl;
	cout << "contains 9? " << contains (top, 9) << endl;
	cout << "sum " << sum (top) << endl;
	return 0;
}
```

`sum` uses a `for` loop. It is exactly the same three parts (start, test, move) written on one line. `cout` prints `true` as 1 and `false` as 0.

All three functions work on an empty list too: `curr` starts as `NULL`, the loop body never runs, and they return 0, `false` and 0.

## getLast: stopping at the last node

To add a node at the end, we first need a pointer to the last node. The lecture's first attempt has a problem:

```cpp norun
Node * getLast (Node * top) {
	Node * last;
	last = top;
	while (last != NULL) {
		last = last->next;
	}
	return last;      // Problem! last is always NULL here
}
```

The loop only stops when `last` is `NULL`, so it walks straight past the last node. The lecture fixes it with a second pointer that stays one step behind:

```cpp norun
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
```

When `last` falls off the end, `previous` is still on the last node. For an empty list both start as `NULL`, so it returns `NULL`.

A shorter version tests the node *after* the current one:

```cpp norun
Node * getLast (Node * top) {
	if (top == NULL)
		return NULL;
	Node * curr = top;
	while (curr->next != NULL)
		curr = curr->next;
	return curr;
}
```

:::remember
- `while (curr != NULL)` visits **every** node and ends with `curr == NULL`.
- `while (curr->next != NULL)` stops **on the last node**. It needs `curr` to be non-NULL first, so check for an empty list before the loop.
:::

## When the loop goes wrong

This program forgets to move `curr`. Run it and read the message.

```cpp error
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

int main() {
	Node * top = new Node;
	top->data = 10;
	top->next = NULL;
	Node * curr = top;
	int count = 0;
	while (curr != NULL) {
		count++;
	}
	cout << count << endl;
	return 0;
}
```

`curr` never changes, so `curr != NULL` stays true forever. Add `curr = curr->next;` inside the loop and run it again.

:::teachback
Explain the traversal pattern, and why `printList` loops while `curr != NULL` rather than while `curr->next != NULL`.
>> Start with `curr = top`, use `curr`, then move with `curr = curr->next`.
>> The loop stops when `curr` becomes NULL, which happens only after the last node has been printed.
>> Testing `curr->next != NULL` would stop on the last node without printing it, and would crash on an empty list.
>> `curr->next != NULL` is the right test only when you want to stop ON the last node (like getLast), after checking the list is not empty.
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
	for (int i = 1; i <= 5; i++)
		top = insertAtHead (top, i);
	int total = 0;
	Node * curr = top;
	while (curr->next != NULL) {
		total = total + curr->data;
		curr = curr->next;
	}
	cout << total << " " << curr->data << endl;
	return 0;
}
```
- [ ] `15 1`
- [x] `14 1`
- [ ] `10 5`
- [ ] `14 5`
>> The list is 5 → 4 → 3 → 2 → 1. The loop stops when `curr` is on the last node (1) without adding it, so the total is 5 + 4 + 3 + 2 = 14, and `curr->data` is 1.
:::

:::quiz
A list has n nodes. How many times does the body of `while (curr != NULL)` run when starting from `top`?
- [ ] n − 1
- [x] n
- [ ] n + 1
- [ ] It depends on the values in the list
>> The body runs once for each node. After the n-th node, `curr` becomes NULL and the test fails. (`while (curr->next != NULL)` runs n − 1 times.)
:::

:::exam
Traversal is O(n): the time grows in step with the number of nodes. `size`, `contains`, `printList` and `getLast` are all O(n). `contains` may stop early, but in the worst case (key missing, or in the last node) it checks all n nodes.
:::
