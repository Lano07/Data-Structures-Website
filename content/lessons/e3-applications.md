---
title: Using stacks and queues
summary: A stack reverses order, so it is the tool for "undo the last thing" problems such as printing a list backwards or matching brackets. A queue keeps order, so it is the tool for "handle things in the order they arrived", such as level order traversal and breadth-first search.
lectures: COMP 1603 review; Lectures 10, 14, 16
goals:
  - Print a linked list in reverse using a stack (COMP 1603)
  - Reverse the values of a list with a stack
  - Check that brackets are balanced with a stack
  - Recognise where queues appear in the course (level order, BFS)
labs: [stackqueue, traversal, graph]
---

## Stacks reverse

Push a, b, c and then pop three times: you get c, b, a. Whatever goes into a stack comes out in **reverse order**. A classic COMP 1603 use of this is printing a list backwards without recursion:

1. Traverse the list from the top, pushing each value.
2. Pop the values off the stack and print them.

```cpp example="printListReverse with a stack"
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

void push (Stack * stack, int data) {
	Node * newNode = createNode (data);
	newNode->next = stack->top;
	stack->top = newNode;
}

int pop (Stack * stack) {
	int save = -999;
	if (stack->top != NULL) {
		Node * toDelete = stack->top;
		stack->top = stack->top->next;
		save = toDelete->data;
		delete toDelete;
	}
	return save;
}

void printListReverse (Node * top) {
	Stack * stack = new Stack;
	stack->top = NULL;
	for (Node * curr = top; curr != NULL; curr = curr->next)
		push (stack, curr->data);
	while (stack->top != NULL)
		cout << pop (stack) << " ";
	cout << endl;
	delete stack;
}

int main() {
	Node * top = createNode (250);
	top->next = createNode (23);
	top->next->next = createNode (17);
	top->next->next->next = createNode (4);
	printListReverse (top);
	return 0;
}
```

The lecture's list is 250 → 23 → 17 → 4, and it prints 4 17 23 250. (Part D shows the same job done with recursion. Recursion works because the computer keeps its own stack of function calls.)

## Reversing the values in a list

The lecture's next question: how do you reverse the elements in the list itself? Push every value, then walk the list again from the top, popping a value into each node:

```cpp norun
void reverseValues (Node * top) {
	Stack * stack = initStack ();
	for (Node * curr = top; curr != NULL; curr = curr->next)
		push (stack, curr->data);
	for (Node * curr = top; curr != NULL; curr = curr->next)
		curr->data = pop (stack);
}
```

The nodes stay where they are; only their data changes. (Part C reverses a list by relinking the nodes instead.)

## Balanced brackets

Brackets are balanced when every opening bracket is closed by the matching kind, in the right order: `{[()]}` is balanced, `([)]` is not. The **most recent** unmatched opening bracket must be closed first, which is exactly what a stack gives you.

- Opening bracket: push it.
- Closing bracket: the stack must not be empty, and the popped bracket must be the matching opener.
- At the end, the stack must be empty (nothing left unclosed).

```cpp example="Balanced brackets"
#include <iostream>
#include <string>
using namespace std;

const int MAX = 100;

struct CharStack {
	char A[MAX];
	int count;
};

bool balanced (string s) {
	CharStack st;
	st.count = 0;
	for (int i = 0; i < (int) s.length (); i++) {
		char c = s[i];
		if (c == '(' || c == '[' || c == '{') {
			st.A[st.count] = c;
			st.count++;
		}
		else if (c == ')' || c == ']' || c == '}') {
			if (st.count == 0)
				return false;
			st.count--;
			char open = st.A[st.count];
			if ((c == ')' && open != '(') || (c == ']' && open != '[') || (c == '}' && open != '{'))
				return false;
		}
	}
	return st.count == 0;
}

int main() {
	string tests[] = {"{[()]}", "([)]", "(()", "a[i] = (b + c) * 2;"};
	for (int i = 0; i < 4; i++)
		cout << tests[i] << " -> " << balanced (tests[i]) << endl;
	return 0;
}
```

This stack is an array of chars, the array version from lesson E1.

## Queues keep order

A queue is the right tool when things must be handled **in the order they were discovered**:

- **Level order traversal** of a tree (lesson F4): children are discovered level by level and visited in that order.
- **Breadth-first search** of a graph (Part J): the same idea for graphs, with colours to avoid visiting a vertex twice.
- Any first-come, first-served system: print jobs, customers, messages.

:::teachback
Explain how a stack is used to check that the brackets in a line of code are balanced.
>> Push every opening bracket.
>> For a closing bracket, the stack must not be empty and the bracket on top must be the matching opener; pop it.
>> At the end the stack must be empty (nothing left unclosed).
>> A stack fits because the most recently opened bracket must be the first one closed.
:::

:::quiz
A list holds 1 → 2 → 3. Every value is pushed onto an empty stack in list order, then two values are popped and printed. What is printed?
- [ ] 1 2
- [x] 3 2
- [ ] 2 3
- [ ] 3 1
>> The pushes leave 3 on top, then 2, then 1. Popping twice prints 3 then 2.
:::

:::quiz
Which string does the bracket checker report as balanced?
- [ ] `(]`
- [ ] `(()`
- [x] `[()()]`
- [ ] `)(`
>> In `[()()]` every closing bracket matches the most recent unmatched opening bracket, and nothing is left on the stack at the end.
:::

:::quiz
Which data structure does level order traversal use, and why?
- [ ] A stack, because it reverses the order of the children
- [x] A queue, because nodes must be visited in the order they were discovered
- [ ] A heap, because larger values come first
- [ ] Recursion only, with no extra structure
>> Level order visits a level completely, left to right, before the next one. A queue releases nodes in the order they were added, which is exactly that order.
:::
