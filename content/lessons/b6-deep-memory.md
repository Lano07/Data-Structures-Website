---
title: Deep dive: the memory model behind every data structure
summary: Every list, tree and graph in this course is built from heap memory joined by pointers. This deep dive explains exactly where memory lives, how long it lives, what copying a pointer really does, and why so many functions in the notes return the new top instead of changing it.
lectures: Lectures 1–2 (deep dive)
goals:
  - Explain the difference between stack (automatic) and heap (dynamic) memory, and the lifetime of each
  - Predict what happens when a pointer is copied, passed to a function, or deleted
  - Explain why insertAtHead must return the new top, and give the two other ways to change the caller's pointer
  - Spot memory leaks, dangling pointers and NULL dereferences in exam code
labs: [memory, lists]
---

## Two places to keep data

Every variable in a running C++ program lives in one of two places.

:::def The stack (automatic memory)
Each function call gets a **frame** on the call stack holding its parameters and local variables. The frame is created when the function is called and **destroyed when it returns**. Its size is fixed when the program is compiled.
:::

:::def The heap (dynamic memory)
Memory you ask for while the program runs, with `new`. It stays allocated **until you `delete` it**, however many functions return in the meantime. Only a pointer tells you where it is.
:::

Data structures need the heap for two reasons:

1. **The size is not known in advance.** A linked list grows one node at a time; you cannot declare the right number of variables before the program runs.
2. **Nodes must outlive the function that made them.** `createNode` (Lecture 1) makes a node and returns. Its local variable `newNode` is destroyed, but the Node itself survives on the heap, and the caller holds its address.

:::theorem The lifetime rule
A local variable stops existing when its function returns. A heap object made with `new` exists until `delete` is applied to its address, and no longer.
:::

So returning the address of a **local** variable is always a bug: the caller receives the address of a frame that no longer exists. Returning the address of a **heap** object (as `createNode` does) is exactly right.

## A pointer is just an address

Lecture 1 draws addresses in square brackets: a node at [2560] with `next = [1152]`. That picture is the whole truth: a pointer variable holds a **number**, the address of something else.

Three consequences follow, and exam questions test all three.

- **Copying a pointer copies the address, not the object.** After `p = q;`, `p` and `q` point at the **same** node. This is called **aliasing**: `p->data = 5;` changes what `q->data` shows.
- **Comparing pointers compares addresses.** `p == q` asks "same node?", not "same data?".
- **`p->data` means `(*p).data`.** Follow the address, then take the field (Lecture 1 shows both forms).

:::trap Declaring several pointers
`Node * a, b;` declares **a** as a pointer but **b** as a whole Node, because the `*` belongs to the name, not the type. Lecture 2 writes `Node * node1, * node2, * node3, * node4;` with a `*` before every name for exactly this reason.
:::

## Pointers are passed by value

When you pass a pointer to a function, the function receives a **copy of the address**. It can change the node the address points to, but changing its own copy of the pointer does not change the caller's pointer.

That is why Lecture 2's list functions have the shape `Node * insertAtHead (Node * top, int n)` and are called as `top = insertAtHead (top, n);`. The function cannot move the caller's `top`, so it **returns** the new top and the caller stores it.

There are three ways to let a function change the caller's top:

| Way | Signature | Call |
|---|---|---|
| Return the new top (the notes' style) | `Node * insertAtHead (Node * top, int n)` | `top = insertAtHead (top, n);` |
| Reference to a pointer | `void insertAtHead (Node * & top, int n)` | `insertAtHead (top, n);` |
| Pointer to a pointer | `void insertAtHead (Node ** top, int n)` | `insertAtHead (&top, n);` |

```cpp example="Why insertAtHead returns the new top"
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

// changes only its own copy of top: the caller's list never changes
void insertBroken (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	top = newNode;
}

// the notes' style: return the new top
Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}

// a reference to the caller's pointer
void insertByRef (Node * & top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	top = newNode;
}

int size (Node * top) {
	int count = 0;
	while (top != NULL) {
		count++;
		top = top->next;
	}
	return count;
}

int main () {
	Node * top = NULL;
	insertBroken (top, 10);
	cout << "after insertBroken: size " << size (top) << endl;
	top = insertAtHead (top, 20);
	cout << "after insertAtHead: size " << size (top) << endl;
	insertByRef (top, 30);
	cout << "after insertByRef:  size " << size (top) << ", first value " << top->data << endl;
	return 0;
}
```

`insertBroken` really did make a node, linked it in front of the list, and then lost it: its `top` was a copy, so the caller never learned the address. The node is still on the heap with no pointer to it. That is a **memory leak**.

:::quiz
What does this print? `void clear (Node * top) { top = NULL; }` is called as `clear (top);` on a list of 3 nodes, then the program prints `size (top)`.
- [ ] 0, because clear sets top to NULL
- [x] 3, because clear only changed its own copy of top
- [ ] It crashes, because top is NULL
- [ ] 3, but all three nodes have been deleted
>> The parameter is a copy of the caller's address. Setting the copy to NULL leaves the caller's top pointing at the first node, so the list still has 3 nodes. Nothing was deleted either.
:::

## NULL, leaks and dangling pointers

Three mistakes account for most crashes in data structure code.

:::def NULL
A pointer value that points at nothing. **Following** a NULL pointer (`p->data`, `p->next`) crashes the program. Every loop that walks a structure must check for NULL before it follows a pointer.
:::

:::def Memory leak
Heap memory that can no longer be reached because the last pointer to it was overwritten or went out of scope. It stays allocated until the program ends.
:::

:::def Dangling pointer
A pointer that still holds the address of memory that has been deleted. Following it is undefined behaviour: it may seem to work, print garbage, or crash.
:::

Deleting the first node of a list shows all three dangers at once:

```
Node * deleteAtHead (Node * top) {
	if (top == NULL)            // 1. an empty list has nothing to delete
		return NULL;
	Node * old = top;           // 2. remember the node before moving top
	top = top->next;            // 3. move top past it
	delete old;                 // 4. only now free it
	return top;
}
```

- Skip step 1 and `top->next` follows NULL on an empty list.
- Do step 4 before step 3 and `top->next` reads freed memory: a dangling pointer.
- Skip step 4 and the old node leaks.

:::insight Draw the boxes
Every pointer operation is one of two things: **change which box an arrow points at** (assigning a pointer), or **change what is inside a box** (assigning through `->`). If you draw the boxes and arrows from Lecture 1, with addresses, and update them one line at a time, you cannot get a pointer question wrong.
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
	Node * p = new Node;
	p->data = 10;
	p->next = NULL;
	Node * q = p;
	q->data = 20;
	Node * r = new Node;
	r->data = 30;
	r->next = p;
	p = r;
	cout << p->data << " " << q->data << " " << p->next->data << endl;
	cout << (p->next == q) << endl;
	return 0;
}
```
:::

:::quiz
After `Node * p = new Node; Node * q = p; delete q;`, which statement is true?
- [ ] p is NULL, because the node was deleted
- [x] p still holds the old address, so it is now a dangling pointer
- [ ] p still points at a valid node, because only q was deleted
- [ ] The program cannot compile, because p and q point at the same node
>> delete frees the node at that address; it does not change any pointer variable. p and q both still hold the old address, and both are dangling. Setting them to NULL after the delete is good practice.
:::

:::trap The order of two lines
In `newNode->next = top; top = newNode;` the order matters. Swap the two lines and newNode points at itself: the rest of the list is lost (a leak) and every traversal loops forever.
:::

## Exam technique for pointer questions

1. Write every pointer variable as a box, and every node as a box with `data` and `next`.
2. Give each node a made-up address, as the lectures do.
3. Execute one line at a time; for each line ask: *does this change an arrow, or the contents of a box?*
4. At the end, check: is any node unreachable (a leak)? Is any pointer holding a deleted address (dangling)?

:::teachback
Explain why `void insertAtHead (Node * top, int n)` cannot add a node to the caller's list when it sets `top = newNode;`, and give two ways to fix it.
>> The pointer parameter is passed by value: the function gets a copy of the caller's address.
>> Changing the copy (top = newNode) does not change the caller's pointer, so the caller never sees the new node, which leaks.
>> Fix it by returning the new top and assigning it (top = insertAtHead (top, n)), or by taking a reference to the pointer (Node * & top), or a pointer to the pointer (Node ** top).
:::

:::remember
- Stack memory dies when its function returns; heap memory lives until delete.
- A pointer holds an address: copying it creates an alias, not a new node.
- Pointers are passed by value: return the new top, or pass Node * & / Node **.
- Before following a pointer, check for NULL; save a node before moving past it; delete it last.
- `Node * a, b;` makes only a a pointer.
:::
