---
title: Deep dive: stacks, queues and why their order matters
summary: A stack or queue is defined by what it promises (last in first out, or first in first out), not by how it is built. This deep dive separates the abstract data type from its implementations, derives every cost, handles the edge cases that break queues, and shows why the order a structure gives back is what makes recursion, level-order traversal and BFS work.
lectures: COMP 1603 review; used in Lectures 10, 14, 16–17 (deep dive)
goals:
  - Distinguish an abstract data type (its operations and promises) from an implementation
  - Implement stacks and queues with linked lists and arrays, and justify each O(1) cost
  - Handle the edge cases - empty structures, the last node leaving a queue, a full circular array
  - Explain why recursion needs a stack and level-order traversal and BFS need a queue
labs: [stackqueue, traversal]
---

## The promise, not the code

:::def Abstract data type (ADT)
A description of a data type by its **operations** and what they **promise**, without saying how the data is stored.
:::

- **Stack** (last in, first out): `push (x)` adds x; `pop ()` removes and returns the item added **most recently**; `isEmpty ()`.
- **Queue** (first in, first out): `enqueue (x)` adds x at the back; `dequeue ()` removes and returns the item that has waited **longest**; `isEmpty ()`.

The same ADT can have several implementations. Users of a stack only rely on the promise, so you can swap a linked-list stack for an array stack without changing their code. That separation is the idea behind organising code into `.h` and `.cpp` files (Lecture 2).

## Implementations and their costs

:::theorem Every stack and queue operation can be O(1)
With the right implementation, push, pop, enqueue, dequeue and isEmpty each take constant time, whatever the number of items.
:::

| Implementation | push / enqueue | pop / dequeue | Why it is O(1) |
|---|---|---|---|
| Stack on a linked list | insert at head | delete at head | Only `top` changes (Lecture 2's insertAtHead and deleteAtHead) |
| Stack on an array | `A[++topIndex] = x` | `return A[topIndex--]` | One index changes |
| Queue on a linked list with `head` and `tail` | link after `tail` | delete at `head` | Both ends are known directly |
| Queue on a circular array | `A[rear] = x; rear = (rear + 1) % cap` | `x = A[front]; front = (front + 1) % cap` | Indexes wrap round instead of shifting |

:::trap A queue without a tail pointer
With only `head`, enqueue must walk to the last node first: O(n) per enqueue, O(n²) to enqueue n items. The `tail` pointer is what makes it O(1).
:::

## The edge cases that break queues

A linked queue has two pointers to keep consistent:

:::invariant Queue invariant
Either the queue is empty and **both** `head` and `tail` are NULL, or `head` points at the oldest node, `tail` points at the newest, and `tail->next` is NULL.
:::

Two operations need special care to keep it true:

1. **Enqueue into an empty queue:** the new node is both the first and the last, so set **both** `head` and `tail` to it. (Linking after `tail` would follow NULL.)
2. **Dequeue the last node:** after `head = head->next`, the queue is empty and `head` is NULL, but `tail` still points at the node you are about to delete. Set `tail = NULL` too, or the next enqueue links a node onto freed memory.

For a **circular array**, `front == rear` happens both when the queue is empty and when it is full. Keep a `count` of items (or leave one slot always unused) to tell the two apart.

## Why the order matters

The promise is what makes these structures useful. Each application relies on the exact order the structure gives items back.

:::insight Recursion is a stack
Every function call pushes a frame; every return pops one. The most recent call always finishes first: last in, first out. That is why `printListRec` with the print after the call prints in reverse (Part D), and why any recursive algorithm can be rewritten with an explicit stack.
:::

:::insight Level order and BFS need a queue
Level-order traversal (Lecture 10) and breadth-first search (Lectures 16–17) visit nodes in order of their distance from the start. A queue gives that for free. Everything at distance d is enqueued before anything at distance d + 1, and first in, first out means it all comes out first. Use a stack instead and you get a depth-first order.
:::

:::example Evaluating a postfix expression with a stack
In postfix notation the operator comes after its operands: `(5 + (1 + 2) × 4) − 3` is written `5 1 2 + 4 × + 3 −`. Read left to right: push numbers; on an operator, pop two values, apply it, and push the result.

`5` → [5]; `1` → [5 1]; `2` → [5 1 2]; `+` → pop 2 and 1, push 3: [5 3]; `4` → [5 3 4]; `×` → pop 4 and 3, push 12: [5 12]; `+` → push 17: [17]; `3` → [17 3]; `−` → pop 3 and 17, push 17 − 3 = 14: [14]. The answer is 14.

The second value popped is the **left** operand: for `−` that is 17 − 3, not 3 − 17. Postfix is also exactly what a postorder traversal of an expression tree prints (Part F).
:::

## Matching brackets

A string of brackets is balanced when every closer matches the most recent unmatched opener. "Most recent" means last in, first out, so it is a stack problem:

```cpp example="Bracket matching with an array stack"
#include <iostream>
#include <string>
using namespace std;

bool balanced (string s) {
	char stack[100];
	int top = -1;                          // the stack is empty
	for (int i = 0; i < (int) s.length (); i++) {
		char c = s[i];
		if (c == '(' || c == '[' || c == '{') {
			top++;
			stack[top] = c;                // push
		} else if (c == ')' || c == ']' || c == '}') {
			if (top == -1)
				return false;              // a closer with no opener
			char open = stack[top];
			top--;                         // pop
			if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{'))
				return false;              // the wrong kind of closer
		}
	}
	return top == -1;                      // every opener was closed
}

int main () {
	string tests[] = {"(a[b]{c})", "([)]", "((x)", "a)b(", ""};
	for (int i = 0; i < 5; i++)
		cout << "\"" << tests[i] << "\": " << (balanced (tests[i]) ? "balanced" : "not balanced") << endl;
	return 0;
}
```

All three ways to fail are checked: a closer when the stack is empty, a closer of the wrong kind, and openers left over at the end. It makes one pass, so it is O(n).

:::quiz
Push 1, 2, 3 onto a stack, pop once, push 4, then pop everything. In what order do the values come out (including the first pop)?
- [ ] 1 2 3 4
- [ ] 3 2 1 4
- [x] 3 4 2 1
- [ ] 4 3 2 1
>> After pushing 1, 2, 3 the top is 3: the first pop gives 3. Push 4 makes the stack 1 2 4 (top 4). Popping everything gives 4, 2, 1. So the full order is 3, 4, 2, 1.
:::

:::quiz
In a linked queue, dequeue removes the only node: head = head->next; delete the old node. Which line is still needed?
- [x] tail = NULL;
- [ ] head = tail;
- [ ] tail = tail->next;
- [ ] Nothing: head is already NULL, so the queue is empty
>> After removing the last node, head is NULL but tail still points at the deleted node. The invariant needs both to be NULL; otherwise the next enqueue links onto freed memory.
:::

:::predict What does this print? (A circular array queue with room for 4.)
```cpp
#include <iostream>
using namespace std;

int main () {
	int A[4];
	int front = 0, rear = 0, count = 0;
	int ops[] = {10, 20, 30, -1, -1, 40, 50, 60};   // -1 means dequeue
	for (int k = 0; k < 8; k++) {
		if (ops[k] == -1) {
			cout << "out " << A[front] << endl;
			front = (front + 1) % 4;
			count--;
		} else {
			A[rear] = ops[k];
			rear = (rear + 1) % 4;
			count++;
		}
	}
	cout << "front " << front << ", rear " << rear << ", count " << count << endl;
	return 0;
}
```
:::

:::teachback
Explain why breadth-first search uses a queue, and what order it would visit vertices in if it used a stack instead.
>> BFS must visit vertices in order of distance from the source; a queue is first in, first out.
>> Every vertex at distance d is enqueued before any vertex at distance d + 1 (they are discovered from distance-d vertices), so all distance-d vertices come out first.
>> With a stack, the most recently discovered vertex comes out first, so the search dives deep along one branch: a depth-first order.
:::

:::remember
- An ADT is a promise (operations plus order); implementations can change.
- Stack: insert and delete at the head (or one array index): O(1). Queue: head plus tail, or a circular array: O(1).
- Queue edge cases: enqueue into an empty queue sets head and tail; dequeueing the last node sets tail = NULL.
- Recursion is a stack; level order and BFS need a queue.
- Postfix with a stack: the second value popped is the left operand.
:::
