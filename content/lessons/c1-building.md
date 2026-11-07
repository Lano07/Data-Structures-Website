---
title: Building a linked list
summary: A linked list is a chain of nodes made with `new`. Each node holds a value and the address of the next node, and a pointer called `top` holds the address of the first one.
lectures: Lectures 1–2
goals:
  - Explain what a node is and why `next` is a pointer
  - Write `createNode` and use it to build a list by hand
  - Write `insertAtHead` and predict the order it produces
  - Draw the list after any sequence of operations
labs: [lists, memory]
---

## Why not just use an array?

An array is one block of memory with a fixed size. That causes two problems:

- You must choose the size before you know how many values will come.
- To put a value in the middle, every value after it must shift one place to make room.

A **linked list** avoids both. Each value lives in its own small block, called a **node**, made with `new` while the program runs. The nodes do not have to sit next to each other in memory. Each node simply remembers where the next one is.

## The node

A node holds two things: the value (`data`), and the address of the next node (`next`). This is the struct from the lectures:

```cpp
struct Node {
	int data;
	Node * next;
};
```

`next` has type `Node *`: a pointer to a Node. That is what links one node to the next. The last node has no next node, so its `next` is `NULL`. `NULL` is how the program knows the list has ended.

:::diagram list 10 20 30
A list of three nodes. `top` holds the address of the first node, each `next` holds the address of the following node, and the last `next` is NULL.
:::

The list itself is just one pointer to its first node. The lectures call it `top`. An empty list is `top == NULL`.

## createNode

Every time we need a node, we do the same three things: ask for memory with `new`, store the value, and set `next` to `NULL`. So the lectures put this in a function:

```cpp
Node * createNode (int n) {
	Node * newNode;
	newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}
```

- `new Node` makes a Node on the **heap** and gives back its address.
- `newNode->data` means "the `data` field of the node that `newNode` points to". The arrow `->` is how you reach a field through a pointer.
- The function returns the address, so the caller can link the node into a list.

:::mistake
Forgetting `newNode->next = NULL;`. A new node's fields hold garbage until you set them, so `next` would point to a random place. The first loop that walks the list would follow it and crash. Always set every field straight after `new`.
:::

## Building a list by hand

Here we make three nodes and link them one at a time. Step through it and watch each arrow appear.

```cpp memory caption="Memory just before main returns. top reaches 10, then 20, then 30, then NULL."
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode;
	newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

int main() {
	Node * top = createNode (10);
	top->next = createNode (20);
	top->next->next = createNode (30);
	cout << top->data << " " << top->next->data << " " << top->next->next->data << endl;
	return 0;
}
```

Read `top->next->next` from left to right: start at `top` (the node with 10), follow its `next` (the node with 20), then follow that node's `next` (the node with 30).

Writing `->next->next->next` gets messy fast. In the next lesson we use a loop instead.

## insertAtHead

The quickest place to add a node is the front, because `top` already points there. Two links must change:

1. The new node's `next` must point to the old first node (the current `top`).
2. `top` must point to the new node.

```cpp norun
Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}
```

The function cannot change the caller's `top` (it only has a copy), so it **returns** the new first node and the caller stores it: `top = insertAtHead (top, 5);`

:::why
The order of the two steps matters. If you set `top = newNode` first, you lose the only pointer to the old list, and `newNode->next = top` would then point the node at itself.
:::

```cpp example="Build a list with insertAtHead"
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode;
	newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}

int main() {
	Node * top = NULL;
	top = insertAtHead (top, 30);
	top = insertAtHead (top, 20);
	top = insertAtHead (top, 10);
	cout << top->data << " " << top->next->data << " " << top->next->next->data << endl;
	return 0;
}
```

Notice that we inserted 30 first, yet it ends up last. Inserting at the head always **reverses** the order in which values arrive.

It also works when the list is empty: if `top` is `NULL`, the new node's `next` becomes `NULL`, which is exactly right for a list with one node.

:::parsons Put the lines of insertAtHead in order.
Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}
~	top->next = newNode;
:::


:::teachback
Explain why `insertAtHead` works even when the list is empty, and why it returns the new top instead of just changing `top`.
>> `newNode->next = top;` copies whatever top holds; for an empty list that is NULL, which is exactly right for a one-node list.
>> The new node is now the first node, so the list must start at it.
>> The function's `top` parameter is a copy of main's `top`, so changing it would not change main's variable.
>> So it returns the new node, and the caller stores it: `top = insertAtHead (top, n);`.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct Node { int data; Node * next; };

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

int main() {
	Node * top = NULL;
	for (int i = 1; i <= 4; i++)
		top = insertAtHead (top, i * 5);
	cout << top->data << " " << top->next->next->data << endl;
	return 0;
}
```
- [ ] `5 15`
- [x] `20 10`
- [ ] `20 15`
- [ ] `5 10`
>> The values 5, 10, 15, 20 are inserted at the head in that order, so the list is 20 → 15 → 10 → 5. `top->data` is 20, and two steps along (`top->next->next`) is 10.
:::

## What happens in memory

Every Node made with `new` lives on the **heap**. It stays there until the program deletes it, even after the function that made it returns. That is why `createNode` can return the address safely.

The pointer variables (`top`, `newNode`) live on the **stack**, inside their function's frame. When `createNode` returns, its `newNode` variable disappears, but the node it pointed to stays on the heap.

:::exam
A common question gives you a few lines of list code and asks what the list looks like afterwards. Draw boxes for the nodes and arrows for the pointers, and update the drawing one line at a time. Do not try to do it in your head.
:::

:::quiz
After `top = insertAtHead (top, 7);` runs on an empty list, which statement is true?
- [ ] `top` is still `NULL`, because the list was empty
- [x] `top` points to a node holding 7, and that node's `next` is `NULL`
- [ ] `top` points to a node holding 7, and that node's `next` points to itself
- [ ] The program crashes, because `top` was `NULL`
>> With `top == NULL`, the line `newNode->next = top;` copies NULL into `next`. The function returns the new node and the caller stores it in `top`. Nothing ever follows the NULL pointer, so there is no crash.
:::
