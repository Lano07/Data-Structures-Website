---
title: new and delete
summary: Local variables live on the stack and disappear when their function ends. Objects made with `new` live on the heap and stay until you `delete` them. That is what lets a function build a node and hand it back.
lectures: Lecture 1
goals:
  - Explain the difference between the stack and the heap
  - Use new and delete for single objects, and new [] and delete [] for arrays
  - Explain why a function may return a pointer from new but not the address of a local variable
  - Recognise a memory leak
labs: [memory]
---

## Two kinds of memory

| | The stack | The heap |
|---|---|---|
| What lives there | local variables and parameters | objects made with `new` |
| Created | when the function is called (or the block is entered) | when `new` runs |
| Destroyed | automatically, when the function returns | only when you call `delete` |
| How you reach it | by the variable's name | only through a pointer |

Each function call gets its own **frame** on the stack holding its variables. When the function returns, the frame is removed, and those variables are gone.

## new

`new Type` asks for a new object on the heap and gives back its **address**. You must store that address in a pointer, because a heap object has no name.

```cpp norun
int * p = new int;       // a new int on the heap; its value is garbage
*p = 42;

Node * n = new Node;     // a new Node; its fields are garbage
n->data = 5;
n->next = NULL;
```

## delete

`delete p;` gives the object p points to back to the heap. The pointer `p` itself still exists (it is on the stack) and still holds the old address, but that address is no longer yours. Set it to NULL if you will keep using the variable.

```cpp example="new, delete and NULL"
#include <iostream>
using namespace std;

int main() {
	int * p = new int;
	*p = 42;
	int * q = p;
	*q = *q + 1;
	cout << *p << endl;
	delete p;
	p = NULL;
	q = NULL;
	return 0;
}
```

Step through it: `new` makes a box appear on the heap, both `p` and `q` point to it, and `delete` removes it.

## Why createNode works

```cpp memory caption="createNode has returned. Its local variable newNode is gone, but the Node it made is still on the heap, and main's p points to it."
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
	Node * p = createNode (7);
	cout << p->data << endl;
	delete p;
	return 0;
}
```

The node outlives the function that made it. That is exactly what we need for lists and trees: build nodes in a function, keep using them afterwards.

## Returning the address of a local variable is a bug

```cpp error
#include <iostream>
using namespace std;

int * makeNumber () {
	int x = 99;
	return &x;
}

int main() {
	int * p = makeNumber ();
	cout << *p << endl;
	return 0;
}
```

`x` lives in `makeNumber`'s frame, which is destroyed when the function returns. `p` ends up pointing at memory that no longer belongs to anything. Use `new` for anything that must outlive its function.

## Arrays on the heap: new [] and delete []

A normal array needs its size when you write the program. `new int[n]` makes an array whose size is decided while the program runs:

```cpp example="A dynamic array" stdin="6"
#include <iostream>
using namespace std;

int main() {
	int n;
	cin >> n;
	int * A = new int[n];
	for (int i = 0; i < n; i++)
		A[i] = i * i;
	for (int i = 0; i < n; i++)
		cout << A[i] << " ";
	cout << endl;
	delete [] A;
	return 0;
}
```

The program reads n from the keyboard input below it. `A[i]` works on the pointer exactly as on a normal array. Memory from `new []` must be freed with `delete []`, not plain `delete`.

## Memory leaks

A **memory leak** happens when you lose the last pointer to a heap object without deleting it. The object stays on the heap, using memory, but nothing can ever reach it again.

```cpp norun
Node * p = createNode (1);
p = createNode (2);        // the node holding 1 is now unreachable: leaked
```

The step-through shows how many objects were never deleted when the program ends. Small programs that leak still run correctly, but long-running programs that leak slowly run out of memory.

:::remember
- Every `new` needs exactly one `delete`; every `new []` needs exactly one `delete []`.
- Delete a node only when nothing will use it again.
- Never return the address of a local variable.
:::

:::teachback
Explain why `createNode` can safely return the address of the node it made, but a function must never return the address of one of its own local variables.
>> `new` makes the node on the heap, where it stays until it is deleted, even after the function returns.
>> The local pointer `newNode` disappears at the return, but its value (the node's address) has been handed back to the caller.
>> A local variable lives in the function's frame, which is destroyed when the function returns, so its address would point at memory that no longer belongs to anything (a dangling pointer).
:::

:::quiz
Which variable still exists after `f` returns?
```cpp norun
Node * f () {
	int count = 3;
	Node * p = new Node;
	p->data = count;
	p->next = NULL;
	return p;
}
```
- [ ] `count`
- [ ] the pointer variable `p`
- [x] the Node that `p` pointed to
- [ ] nothing: everything in f is destroyed
>> `count` and `p` are local variables on f's stack frame, so they disappear. The Node was made with `new`, so it stays on the heap until someone deletes it. The caller receives its address.
:::

:::quiz
What is wrong with this code?
```cpp norun
int * A = new int[10];
// ... use A ...
delete A;
```
- [ ] Nothing
- [ ] `new int[10]` should be `new int(10)`
- [x] Memory from `new []` must be freed with `delete [] A;`
- [ ] A must be set to NULL before delete
>> Arrays made with `new []` must be freed with `delete []`. Plain `delete` on an array is a mistake (undefined behaviour), and this runner reports it as an error.
:::
