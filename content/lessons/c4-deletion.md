---
title: Deleting nodes
summary: To delete a node, first make the list skip over it, then free it with `delete`. Keep a pointer to the node before it, never use a node after deleting it, and delete every node before you lose the list.
lectures: Lectures 2–4
goals:
  - Write deleteAtHead and deleteKey (with prev and curr)
  - Delete a whole list without losing nodes
  - Recognise dangling pointers and memory leaks
  - Use `Node * &` to let a function change the caller's `top`
labs: [lists, memory]
---

## Deleting is "skip over, then free"

Removing a node takes two steps, in this order:

1. **Unlink it.** Change the pointer that leads to the node (either `top` or the previous node's `next`) so that it skips over the node.
2. **Free it.** Call `delete` on the node, so its memory goes back to the heap.

If you only unlink, the node is still using memory that nothing can reach: a **memory leak**. If you free it while something still points to it, that pointer is now **dangling**: it holds an address of memory you no longer own.

## deleteAtHead

The first node is the easiest to remove, because `top` points straight at it.

```cpp norun
Node * deleteAtHead (Node * top) {
	if (top == NULL)
		return NULL;
	Node * temp = top;
	top = top->next;
	delete temp;
	return top;
}
```

`temp` keeps hold of the old first node. Then `top` moves to the second node (unlink), and only then is `temp` deleted (free). The function returns the new `top`, so the caller writes `top = deleteAtHead (top);`.

:::mistake
Deleting first and moving after:

```cpp norun
delete top;
top = top->next;     // reads a field of a node that no longer exists
```

After `delete top;`, the node is gone, so `top->next` is a read from freed memory. Save what you need *before* you delete.
:::

## deleteKey: removing a node from anywhere

To unlink a node in the middle, you need the node **before** it, because that node's `next` is the pointer that must change. So two pointers walk together: `prev` one step behind `curr`.

```cpp norun
Node * deleteKey (Node * top, int key) {
	if (top == NULL)
		return NULL;
	if (top->data == key) {                 // the first node is the one to delete
		Node * temp = top;
		top = top->next;
		delete temp;
		return top;
	}
	Node * prev = top;
	Node * curr = top->next;
	while (curr != NULL && curr->data != key) {
		prev = curr;
		curr = curr->next;
	}
	if (curr != NULL) {                     // found it: prev is the node before it
		prev->next = curr->next;            // unlink
		delete curr;                        // free
	}
	return top;
}
```

There are three situations to think through, and the code handles each:

- **The key is in the first node.** There is no node before it, so `top` itself must move. This is the same as deleteAtHead.
- **The key is further along.** The loop stops with `curr` on it and `prev` just before it.
- **The key is not there.** The loop runs until `curr` is `NULL`, and nothing is changed.

```cpp example="deleteKey"
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

Node * deleteKey (Node * top, int key) {
	if (top == NULL)
		return NULL;
	if (top->data == key) {
		Node * temp = top;
		top = top->next;
		delete temp;
		return top;
	}
	Node * prev = top;
	Node * curr = top->next;
	while (curr != NULL && curr->data != key) {
		prev = curr;
		curr = curr->next;
	}
	if (curr != NULL) {
		prev->next = curr->next;
		delete curr;
	}
	return top;
}

int main() {
	Node * top = NULL;
	for (int i = 5; i >= 1; i--)
		top = insertAtHead (top, i * 10);
	printList (top);
	top = deleteKey (top, 30);
	printList (top);
	top = deleteKey (top, 10);
	printList (top);
	top = deleteKey (top, 99);
	printList (top);
	return 0;
}
```

Step through it and watch the arrow from 20 jump over 30 before 30 disappears.

## Deleting the whole list

When you are finished with a list, every node must be deleted. The trick is the same as deleteAtHead: save where the rest of the list is before deleting the current node.

```cpp norun
Node * deleteList (Node * top) {
	while (top != NULL) {
		Node * temp = top;
		top = top->next;
		delete temp;
	}
	return NULL;
}
```

`top = deleteList (top);` leaves `top` as `NULL`, which correctly means "empty list".

## Mistakes that crash programs

This program deletes a node and then uses another pointer that still holds its address.

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
	delete top;
	top = NULL;
	cout << curr->data << endl;
	return 0;
}
```

Setting `top = NULL` did not help `curr`. Every pointer that held that address is now dangling. On a real computer this might print garbage, crash, or seem to work, which is why such bugs are hard to find. The runner here stops at the exact line.

:::parsons Put the lines of deleteAtHead in order.
Node * deleteAtHead (Node * top) {
	if (top == NULL)
		return NULL;
	Node * temp = top;
	top = top->next;
	delete temp;
	return top;
}
~	delete top;
:::


:::remember
- After `delete p;`, never use `*p` or `p->field` again.
- Setting `p = NULL;` after deleting protects `p`, but not other pointers to the same node.
- Every `new` needs exactly one `delete`. Two deletes of the same node crash; zero deletes leak.
:::

## Changing top through a reference: Node * &

The lecture functions return the new `top`. Another way is to pass `top` **by reference**, so the function changes the caller's variable directly:

```cpp example="Node * & top"
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

void deleteAtHead (Node * & top) {
	if (top == NULL)
		return;
	Node * temp = top;
	top = top->next;
	delete temp;
}

void insertAtHead (Node * & top, int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = top;
	top = newNode;
}

int main() {
	Node * top = NULL;
	insertAtHead (top, 30);
	insertAtHead (top, 20);
	insertAtHead (top, 10);
	deleteAtHead (top);
	cout << top->data << endl;
	return 0;
}
```

`Node * & top` reads as "a reference to a Node pointer". Inside the function, `top` is another name for `main`'s `top`, so `top = top->next;` moves `main`'s pointer. In the step-through, the reference is drawn as a dashed arrow to `main`'s variable.

:::teachback
Explain how `deleteKey` removes a node from the middle of a list, and why deleting the first node needs its own case.
>> Walk with two pointers, `prev` and `curr`, until `curr` holds the key.
>> Unlink it with `prev->next = curr->next;`, then `delete curr;`.
>> The first node has no `prev`, and removing it changes where the list starts.
>> So that case moves `top` to `top->next`, deletes the old first node, and returns the new top.
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

Node * deleteAtHead (Node * top) {
	if (top == NULL) return NULL;
	Node * temp = top;
	top = top->next;
	delete temp;
	return top;
}

int main() {
	Node * top = NULL;
	top = insertAtHead (top, 1);
	top = insertAtHead (top, 2);
	top = deleteAtHead (top);
	top = insertAtHead (top, 3);
	top = insertAtHead (top, 4);
	top = deleteAtHead (top);
	for (Node * p = top; p != NULL; p = p->next)
		cout << p->data << " ";
	cout << endl;
	return 0;
}
```
- [ ] `4 3 1`
- [x] `3 1`
- [ ] `1 3`
- [ ] `3 2 1`
>> 1 then 2 at the head gives 2 → 1. Deleting the head removes 2. Adding 3 and 4 gives 4 → 3 → 1. Deleting the head removes 4, leaving 3 → 1.
:::

:::quiz
In deleteKey, why do we keep a `prev` pointer?
- [ ] To count how many nodes we have passed
- [ ] Because `curr` cannot be deleted without it
- [x] Because the node before the deleted one must change its `next` to skip over it
- [ ] So that we can walk the list backwards
>> A singly linked list only has forward links. The only pointer that leads to `curr` is `prev->next`, so `prev` is needed to write `prev->next = curr->next;`.
:::

:::exam
Deleting the first node is O(1). Deleting a given key is O(n): the search takes up to n steps, and the unlink-and-free part is constant time. The lectures put it as "search (n/2 on average) + delete (constant)".
:::
