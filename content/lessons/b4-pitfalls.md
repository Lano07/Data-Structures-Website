---
title: Pointer pitfalls
summary: Five mistakes cause almost every pointer crash - following NULL, following a pointer that was never set, using memory after delete, deleting twice, and losing the only pointer to something. Learn to spot each one before it happens.
lectures: Lectures 1–4
goals:
  - Name and recognise the five classic pointer mistakes
  - Read the runner's error messages and find the faulty line
  - Use defensive checks (`p != NULL`) in the right places
labs: [memory]
---

## Why pointer bugs are nasty

On a real computer, a pointer mistake often does not stop the program straight away. It may print garbage, crash somewhere else later, or appear to work until the exam marker runs it with different data. This runner checks every pointer access and stops at the exact line, with an explanation. Run each example below and read the message.

## 1. Following a NULL pointer

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
	cout << top->next->data << endl;
	return 0;
}
```

`top->next` is NULL, so `top->next->data` follows NULL. **Fix:** check first, for example `if (top->next != NULL)`, or write loops that stop when the pointer becomes NULL.

## 2. Following a pointer that was never set

```cpp error
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

int main() {
	Node * p = new Node;
	p->data = 1;
	Node * q = p->next;
	cout << q->data << endl;
	return 0;
}
```

`p->next` was never given a value, so it holds a random address. **Fix:** set every field straight after `new` (createNode sets `next = NULL` for this reason).

## 3. Using memory after delete (a dangling pointer)

```cpp error
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * deleteAtHead (Node * top) {
	Node * temp = top;
	delete temp;
	top = top->next;
	return top;
}

int main() {
	Node * top = new Node;
	top->data = 1;
	top->next = NULL;
	top = deleteAtHead (top);
	return 0;
}
```

The node is deleted before `top->next` is read. **Fix:** move `top` first, then delete the saved pointer (`temp`).

## 4. Deleting twice

```cpp error
#include <iostream>
using namespace std;

int main() {
	int * p = new int;
	int * q = p;
	delete p;
	delete q;
	return 0;
}
```

`p` and `q` point to the same object, so deleting through both frees it twice. **Fix:** decide which pointer "owns" the object, delete only through that one, and set it to NULL afterwards (deleting NULL is safe and does nothing).

## 5. Losing the only pointer (a memory leak)

```cpp example="A leak, shown in the step-through"
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
	top = NULL;
	cout << "the node is still on the heap" << endl;
	return 0;
}
```

This one does not crash, but the node can never be deleted now. **Fix:** delete the node (or keep a pointer to it) before you overwrite the last pointer to it. Step through it to see the node left behind at the end.

:::remember
Before writing `p->field`, ask: **can p be NULL here? Was p ever given a value? Has its node been deleted?** If any answer is "maybe", add a check or reorder the code.
:::

:::teachback
Name three pointer mistakes that crash or corrupt programs, and explain how to avoid each one.
>> Following a NULL pointer (`p->data` when p is NULL): check for NULL first.
>> Using memory after it was deleted (a dangling pointer): do not use the pointer again, and set it to NULL after `delete`.
>> Losing the last pointer to a node (a memory leak): keep a pointer to every node until you delete it.
>> Deleting the same memory twice, or deleting memory that was not made with `new`.
:::

:::quiz
Which line causes a problem?
```cpp norun
Node * a = new Node;      // line 1
a->data = 5;              // line 2
a->next = NULL;           // line 3
Node * b = a;             // line 4
delete a;                 // line 5
cout << b->data;          // line 6
```
- [ ] line 4, because two pointers cannot hold the same address
- [ ] line 5, because a is still in use
- [x] line 6, because b points to a node that was deleted
- [ ] none of them
>> Line 4 is fine: it just copies the address. Line 5 frees the node. Line 6 then reads through b, which still holds the old address: b is a dangling pointer.
:::

:::quiz
Which loop safely visits every node of a list, including an empty list?
- [ ] `while (curr->next != NULL) curr = curr->next;`
- [x] `while (curr != NULL) curr = curr->next;`
- [ ] `do { curr = curr->next; } while (curr != NULL);`
- [ ] `while (curr->data != 0) curr = curr->next;`
>> Only the second checks curr before following it. The first and third follow curr even when it is NULL (an empty list), and the fourth never tests for NULL at all.
:::
