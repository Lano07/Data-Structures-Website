---
title: "Deep dive: thinking recursively, and proving it works"
summary: Recursion stops being magic once you see it as two ideas - a recursive definition of the data (a list is empty, or a head followed by a tail) and an induction proof that the function handles both cases. This deep dive covers designing recursive functions, the call stack, why order of statements changes the output, and how to find the cost with a recurrence.
lectures: Lectures 2–4, 6, 20–21 (deep dive)
goals:
  - Design a recursive function from three questions - base case, smaller problem, combine
  - Prove a recursive function correct by induction on the size of its input
  - Explain the call stack, recursion depth and why a missing base case overflows it
  - Predict output when the print comes before or after the recursive call
  - Write and solve the recurrence for the cost of a recursive function
labs: [recursion]
---

## Recursive data, recursive functions

Lecture 2 offers *another view of a linked list*: a **head** (the first node) and a **tail** (the rest of the list, which is itself a list). A list is therefore either:

- **empty** (`top == NULL`), or
- a **head** followed by a **tail** that is a smaller list.

A recursive function mirrors that definition. Every recursive function in Lectures 2 to 4 answers three questions:

| Question | sizeRec (Lecture 3) | containsRec (Lecture 3) |
|---|---|---|
| 1. What is the answer for the smallest input (base case)? | empty list: 0 | empty list: false |
| 2. How do I get a smaller problem? | the tail: `top->next` | the tail: `top->next` |
| 3. How do I combine the head with the tail's answer? | 1 + size of tail | head matches, or the tail contains it |

## The leap of faith is an induction proof

When you write `return 1 + sizeRec (top->next);` you **trust** that `sizeRec` works on the tail. That trust is exactly the induction hypothesis of a proof.

:::theorem sizeRec is correct
For every list with n nodes, `sizeRec (top)` returns n.
:::

:::proof
By induction on n.
**Base case (n = 0):** the list is empty, so `top == NULL` and the function returns 0.
**Inductive step:** assume sizeRec returns the right answer for every list with n − 1 nodes. A list with n ≥ 1 nodes has a head and a tail of n − 1 nodes. The function returns 1 + sizeRec (tail), which by the hypothesis is 1 + (n − 1) = n.
:::

You never need to trace the whole chain of calls to be sure a recursive function works. Check the base case, and check that the recursive case is right **assuming the smaller call is right**. Then check that every call really is smaller, so the chain reaches the base case.

## The call stack: what actually happens

Each call gets its own **frame** on the call stack, with its own copy of `top`. Calling `sizeRec` on a list of 4 nodes makes 5 calls: one per node and one for the final NULL. They are stacked five deep before the first one returns.

:::insight Depth costs memory
A recursive function on a list of n nodes needs n + 1 frames at its deepest point: **O(n) memory**, where the loop version needs O(1). Without a base case, or when the input never gets smaller, the frames pile up until the stack runs out: **stack overflow**.
:::

## Before or after the call: why order changes the output

Lecture 3 shows two versions of `printListRec`. The only difference is where the `cout` sits:

```cpp example="Print before the call, or after it"
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

void printForward (Node * top) {
	if (top == NULL)
		return;
	cout << top->data << " ";        // print on the way down
	printForward (top->next);
}

void printBackward (Node * top) {
	if (top == NULL)
		return;
	printBackward (top->next);
	cout << top->data << " ";        // print on the way back up
}

int main () {
	Node * top = createNode (250);
	top->next = createNode (23);
	top->next->next = createNode (17);
	top->next->next->next = createNode (4);
	printForward (top);
	cout << endl;
	printBackward (top);
	cout << endl;
	return 0;
}
```

Statements **before** the recursive call run on the way **down** the chain of calls, in list order. Statements **after** it run on the way back **up**, as each call returns, in reverse order. That is how the second version of `printListRec` prints the list backwards without a stack: the call stack *is* the stack.

## Finding the cost: recurrences

Let T(n) be the time a recursive function takes on an input of size n. Write what one call does: a constant amount of work c, plus the recursive calls.

:::example Solving T(n) = T(n − 1) + c by unrolling
For sizeRec, each call does constant work and makes one call on a list one node shorter:
T(n) = T(n − 1) + c = T(n − 2) + 2c = … = T(0) + n·c.
So T(n) is about c·n: **O(n)**.
:::

The same method gives the cost of every recursive algorithm in the course:

| Algorithm | Recurrence | Cost |
|---|---|---|
| sizeRec, printListRec, occursRec (Lecture 3) | T(n) = T(n − 1) + c | O(n) |
| moment, preOrder on a tree (Lecture 6) | T(n) = T(n_L) + T(n_R) + c, with n_L + n_R = n − 1 | O(n): one call per node, plus n + 1 calls on NULL |
| Binary search | T(n) = T(n/2) + c | O(log n): about log₂ n halvings |
| mergeSort (Lectures 20–21) | T(n) = 2T(n/2) + c·n | O(n log n): log₂ n levels, each costing c·n |
| quickSort, worst case (Lecture 21) | T(n) = T(n − 1) + c·n | O(n²): c·(n + (n − 1) + … + 1) |

:::quiz
A recursive function on a list of n nodes does a loop over the whole remaining list, then calls itself on the tail. What is its cost?
- [ ] O(n)
- [ ] O(n log n)
- [x] O(n²)
- [ ] O(2ⁿ)
>> T(n) = T(n − 1) + c·n. Unrolling gives c·(n + (n − 1) + … + 1) = c·n(n + 1)/2, which is O(n²), the same sum as quick sort's worst case.
:::

## Two base cases, and the order of the tests

Some functions need more than one base case. Lecture 3's recursive `getLast` returns `top` when the list is empty **or** has one node (`top->next == NULL`); only longer lists recurse. Lecture 4's `isEqualRec` has five cases, and their **order** matters:

1. both lists empty: true;
2. exactly one is empty: false (test `top1 == NULL || top2 == NULL` **after** case 1);
3. heads differ: false;
4. otherwise: compare the two tails.

If case 2 came first, two empty lists would wrongly be "not equal". And case 3 must come after both NULL checks, because it follows `top1->data`.

:::trap A recursive call whose answer is thrown away
`containsRec (top->next, key);` on its own line calls the function and **discards** the answer; the function then falls off the end without returning anything. Write `return containsRec (top->next, key);`. This is the most common recursion bug in exam scripts.
:::

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

int mystery (int n) {
	if (n <= 1)
		return 1;
	cout << n << " ";
	int r = n * mystery (n - 2);
	cout << "(" << r << ") ";
	return r;
}

int main () {
	int x = mystery (7);
	cout << endl << x << endl;
	return 0;
}
```
:::

:::quiz
`int f (Node * top) { if (top == NULL) return 0; return top->data + f (top->next->next); }` is called on a list of 3 nodes. What happens?
- [ ] It returns the sum of the 1st and 3rd values
- [x] It crashes: on the 3rd node, top->next is NULL, and NULL->next is followed
- [ ] It returns the sum of all three values
- [ ] It loops forever
>> Skipping two nodes per call is fine while two nodes remain. On the 3rd node, top->next is NULL, so evaluating top->next->next follows a NULL pointer. A correct version needs a second base case, top->next == NULL.
:::

:::challenge Write it recursively
Write `Node * removeAll (Node * top, int key)`, which deletes every node holding `key` and returns the new top. Use the three questions: base case (empty list: return NULL); smaller problem (the tail); combine (if the head holds key, delete it and return the cleaned tail; otherwise set `top->next` to the cleaned tail and return top). It is O(n) time and O(n) stack.
:::

:::teachback
Explain how an induction proof shows that a recursive list function is correct, using sizeRec.
>> Base case: for the empty list (n = 0) the function returns 0, which is right.
>> Inductive step: assume it is right for lists of n − 1 nodes; a list of n nodes is a head plus a tail of n − 1, so it returns 1 + (n − 1) = n.
>> Each call is on a shorter list, so the calls always reach the base case.
:::

:::remember
- Three questions: base case, smaller problem, combine.
- Correctness = induction: check the base case, and the recursive case assuming the smaller call works.
- n + 1 calls deep on a list of n nodes: O(n) stack memory.
- Work before the call runs on the way down; work after it runs on the way back up (reverse order).
- Recurrences: T(n−1)+c → O(n); T(n/2)+c → O(log n); 2T(n/2)+cn → O(n log n); T(n−1)+cn → O(n²).
- Always return the recursive call's answer.
:::
