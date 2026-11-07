---
title: References and parameters
summary: A reference parameter (type &) is another name for the caller's own variable, so the function can change it. Use references to change arguments, to return more than one result, and with const to pass big values without copying. The same idea gives Node * & top in the list lessons.
lectures: COMP 1602/1603 review, Lecture 1
goals:
  - Explain the difference between pass by value and pass by reference
  - Write swap and other functions that change their arguments
  - Return several results through reference parameters
  - Use const references for large values such as strings and structs
  - Read Node * & top correctly
labs: [memory]
---

## The problem

Lesson A5 showed that a normal parameter is a copy. So this swap does nothing to the caller's variables:

```cpp norun
void swapValues (int a, int b) {     // a and b are copies
	int temp = a;
	a = b;
	b = temp;                        // only the copies are swapped
}
```

## Reference parameters

Put `&` after the type, and the parameter becomes a **reference**: not a new box, but **another name for the caller's variable**.

```cpp memory at="6" caption="a and b are not boxes of their own: they are other names for main's x and y (drawn with dashed outlines)."
#include <iostream>
using namespace std;

void swapValues (int & a, int & b) {
	int temp = a;
	a = b;
	b = temp;
}

int main() {
	int x = 1, y = 2;
	swapValues (x, y);
	cout << x << " " << y << endl;
	return 0;
}
```

Inside swapValues, every use of `a` is really a use of main's `x`. This program prints `2 1`. This is **pass by reference**.

The argument for a reference parameter must be a variable (something with a box). `swapValues (x, 5)` is a compile error: there is no box called 5 to change.

## Returning more than one result

`return` sends back one value. Reference parameters let a function fill in several:

```cpp example="Several results through references"
#include <iostream>
using namespace std;

void minMax (int A[], int n, int & smallest, int & largest) {
	smallest = A[0];
	largest = A[0];
	for (int i = 1; i < n; i++) {
		if (A[i] < smallest)
			smallest = A[i];
		if (A[i] > largest)
			largest = A[i];
	}
}

void divide (int a, int b, int & quotient, int & remainder) {
	quotient = a / b;
	remainder = a % b;
}

int main() {
	int A[] = {12, 5, 41, 9, 23};
	int lo, hi;
	minMax (A, 5, lo, hi);
	cout << "smallest " << lo << ", largest " << hi << endl;

	int q, r;
	divide (17, 5, q, r);
	cout << "17 / 5 = " << q << " remainder " << r << endl;
	return 0;
}
```

`lo` and `hi` have no values before the call; the function fills them in.

## const references: no copy, no changes

Passing a big value by value copies all of it (every character of a long string, every field of a struct). A reference avoids the copy. Adding `const` promises that the function will not change it:

```cpp norun
void printStudent (const Student & s) {   // no copy, and s cannot be changed here
	cout << s.name << " " << s.id << endl;
}
```

A rule of thumb:

| You want to | Parameter |
|---|---|
| pass a small value (int, double, char, a pointer) | by value: `int n` |
| change the caller's variable | by reference: `int & n` |
| pass a large value (string, struct) without changing it | const reference: `const string & s` |

## References and pointers

A reference and a pointer both let a function reach the caller's variable, in different ways (Part B):

| | Reference `int & r` | Pointer `int * p` |
|---|---|---|
| What it is | another name for a variable | a variable holding an address |
| Using the value | `r` | `*p` |
| Can it be NULL? | no | yes |
| Can it later refer to something else? | no | yes, assign a new address |

## Node * & top

The list lessons use a parameter written `Node * & top`. Read it from the right: `top` is a **reference** (`&`) to a **Node pointer** (`Node *`). So it is another name for the caller's own `top` variable, and the function can change where the caller's list starts:

```cpp norun
void insertAtHead (Node * & top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	top = newNode;                  // changes main's top directly
}
```

Without the `&`, `top` would be a copy of main's pointer: the function could change the nodes it points to, but not main's `top` itself. Lesson C4 compares this with the other way, returning the new top.

:::predict One parameter is a copy and one is a reference. What does this print?
```cpp
#include <iostream>
using namespace std;

void addTen (int x, int & y) {
	x = x + 10;
	y = y + 10;
}

int main() {
	int a = 1, b = 2;
	addTen (a, b);
	cout << a << " " << b << endl;
	return 0;
}
```
:::


:::remember
- `int n`: a copy. Changes stay inside the function.
- `int & n`: another name for the caller's variable. Changes are seen by the caller.
- `const string & s`: no copy, and no changes allowed.
- `Node * & top`: the caller's own top pointer, so the function can move it.
:::

:::teachback
Explain the difference between `void f (int n)` and `void f (int & n)`, and what a parameter written `Node * & top` lets a function do.
>> With `int n` the function gets a copy, so its changes stay inside the function.
>> With `int & n` the parameter is another name for the caller's variable, so changes are seen by the caller.
>> The argument for a reference parameter must be a variable, not a value like 5 or x + 1.
>> `Node * & top` is a reference to the caller's pointer, so the function can make the caller's `top` point to a different first node.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

void f (int a, int & b) {
	a = a + 1;
	b = b + 1;
}

int main() {
	int x = 10, y = 20;
	f (x, y);
	f (y, x);
	cout << x << " " << y << endl;
	return 0;
}
```
- [ ] `10 20`
- [x] `11 21`
- [ ] `12 22`
- [ ] `11 22`
>> In each call only the second argument is a reference. `f (x, y)` adds 1 to y (21). `f (y, x)` adds 1 to x (11). The copies changed by `a = a + 1` are thrown away.
:::

:::quiz
`void triple (int & n)` is declared. Which call does **not** compile?
- [ ] `triple (count);`
- [ ] `triple (A[2]);`
- [x] `triple (count + 1);`
- [ ] `triple (p->data);` where p is a Node pointer
>> A reference must refer to a variable that can be changed. `count + 1` is just a value with no box of its own. An array element and a struct field are real variables, so they are fine.
:::

:::quiz
A function must make the caller's list start at a new node. Which parameter allows `top = newNode;` inside it to change the caller's list?
- [ ] `Node * top`
- [x] `Node * & top`
- [ ] `Node top`
- [ ] `const Node * top`
>> `Node * & top` is a reference to the caller's pointer, so assigning to it changes the caller's top. With `Node * top`, the function only changes its own copy.
:::
