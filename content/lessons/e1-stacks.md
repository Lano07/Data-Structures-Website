---
title: Stacks
summary: A stack only lets you add and remove at one end, the top, so the last value in is the first value out (LIFO). Built on a linked list, push is insertAtHead and pop is deleteAtHead.
lectures: Lecture 9
goals:
  - Explain LIFO and predict the result of a sequence of pushes and pops
  - Write the Stack struct, initStack, isEmpty, push and pop from Lecture 9
  - Implement a stack with an array and know its limits
labs: [stackqueue, memory]
---

## Last in, first out

A **stack** is like a pile of plates: you put a plate on the top and you take a plate from the top. The last value added is the first one removed: **LIFO** (Last In, First Out).

A stack provides four operations:

| Operation | What it does |
|---|---|
| `initStack` | creates and returns an empty stack |
| `isEmpty` | returns true if there are no elements |
| `push` | puts an element on the top |
| `pop` | removes the element on the top (and returns it) |

:::trace
push 10, push 20, push 15, pop, push 30, pop, pop: the pops return 15, then 30, then 20. 10 is still in the stack.
:::

## A stack built on a linked list

The lecture keeps the list's `top` pointer inside a `Stack` struct, so a stack can be passed around as one thing:

```cpp norun
struct Node {
	int data;
	Node * next;
};

struct Stack {
	Node * top;
};
```

- **initStack** sets `stack->top` to NULL.
- **isEmpty** returns true if `stack->top` is NULL.
- **push** inserts a new element at the top of the linked list (insertAtHead).
- **pop** removes the element at the top of the linked list (deleteAtHead).

```cpp norun
void push (Stack * stack, int data) {
	Node * newNode;
	newNode = createNode (data);
	newNode->next = stack->top;
	stack->top = newNode;
}

int pop (Stack * stack) {
	Node * toDelete;
	int save = -999;
	if (stack->top != NULL) {
		toDelete = stack->top;
		stack->top = (stack->top)->next;
		save = toDelete->data;
		delete toDelete;
	}
	return save;
}
```

The lecture asks: "Will push work if the list is initially empty?" Yes: `newNode->next` becomes NULL, which is right for a one-node list. `pop` on an empty stack does nothing and returns -999, a value that signals "empty".

```cpp example="A linked-list stack"
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

struct Stack {
	Node * top;
};

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

Stack * initStack () {
	Stack * stack = new Stack;
	stack->top = NULL;
	return stack;
}

bool isEmpty (Stack * stack) {
	return stack->top == NULL;
}

void push (Stack * stack, int data) {
	Node * newNode;
	newNode = createNode (data);
	newNode->next = stack->top;
	stack->top = newNode;
}

int pop (Stack * stack) {
	Node * toDelete;
	int save = -999;
	if (stack->top != NULL) {
		toDelete = stack->top;
		stack->top = (stack->top)->next;
		save = toDelete->data;
		delete toDelete;
	}
	return save;
}

int main() {
	Stack * s = initStack ();
	push (s, 10);
	push (s, 20);
	push (s, 30);
	cout << pop (s) << " ";
	push (s, 40);
	while (!isEmpty (s))
		cout << pop (s) << " ";
	cout << endl;
	cout << pop (s) << endl;
	return 0;
}
```

Both push and pop work at the head of the list, so both are **O(1)**.

:::mistake
In pop, deleting before saving: `delete toDelete;` then `save = toDelete->data;` reads a deleted node. Save the data first.
:::

## A stack built on an array

The lecture notes that a stack "can be implemented using an array" too. Keep the values in `A[0..count-1]`, with the top at the end:

```cpp norun
const int MAX = 100;

struct ArrayStack {
	int A[MAX];
	int count;          // number of values; the top is A[count - 1]
};

void push (ArrayStack * s, int data) {
	if (s->count == MAX)
		return;                     // full: nothing can be added
	s->A[s->count] = data;
	s->count++;
}

int pop (ArrayStack * s) {
	if (s->count == 0)
		return -999;                // empty
	s->count--;
	return s->A[s->count];
}
```

Also O(1) for both, but the array can become **full**. A linked-list stack only runs out when the whole heap does.

:::parsons Put the lines of pop in order.
int pop (Stack * stack) {
	Node * toDelete;
	int save = -999;
	if (stack->top != NULL) {
		toDelete = stack->top;
		stack->top = (stack->top)->next;
		save = toDelete->data;
		delete toDelete;
	}
	return save;
}
~		stack->top = toDelete;
:::


:::teachback
Explain why `push` and `pop` on a linked-list stack are both O(1), what LIFO means, and what `pop` returns when the stack is empty.
>> push is insertAtHead and pop is deleteAtHead: both only touch the top node.
>> No traversal is needed, so the work is the same however many nodes there are.
>> LIFO: the last value pushed is the first one popped.
>> pop on an empty stack returns the special value -999 instead of crashing.
:::

:::quiz
Starting with an empty stack: push 5, push 8, pop, push 2, push 7, pop, pop. What is left in the stack, from top to bottom?
- [ ] 2 5
- [x] 5
- [ ] 8 5
- [ ] 7 2 5
>> After push 5, push 8, pop (removes 8): [5]. push 2, push 7: [7, 2, 5] from the top. pop removes 7, pop removes 2. Only 5 is left.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct Node { int data; Node * next; };
struct Stack { Node * top; };

void push (Stack * s, int d) {
	Node * n = new Node;
	n->data = d;
	n->next = s->top;
	s->top = n;
}

int pop (Stack * s) {
	if (s->top == NULL) return -999;
	Node * t = s->top;
	int d = t->data;
	s->top = t->next;
	delete t;
	return d;
}

int main() {
	Stack s;
	s.top = NULL;
	for (int i = 1; i <= 4; i++)
		push (&s, i * i);
	pop (&s);
	cout << pop (&s) + pop (&s) << " " << pop (&s) << " " << pop (&s) << endl;
	return 0;
}
```
- [ ] `16 1 -999`
- [x] `13 1 -999`
- [ ] `5 9 -999`
- [ ] `25 1 0`
>> Pushed 1, 4, 9, 16. The first pop removes 16. Then 9 + 4 = 13, then 1, and the stack is empty, so the last pop returns -999.
:::

:::exam
For "what is left in the stack" questions, write the stack as a column and cross values off the top. Remember an empty pop returns the special value (here -999), it does not crash.
:::
