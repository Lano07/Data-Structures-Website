---
title: Functions
summary: A function packages a job under a name. It receives values through its parameters, does its work with its own local variables, and can send one value back with return. Each call gets a fresh frame on the call stack, which disappears when the call ends.
lectures: COMP 1602/1603 review
goals:
  - Define and call functions with parameters and a return value
  - Write prototypes so that functions can be used before their definitions
  - Explain pass by value, local variables and scope
  - Describe what happens on the call stack during a call
labs: [memory, recursion]
---

## Defining and calling a function

```cpp norun
int square (int n) {        // return type, name, parameter list
	return n * n;           // send a value back to the caller
}
```

- `int` before the name is the **return type**: the kind of value the function gives back.
- `(int n)` is the **parameter list**: the values the function receives.
- `return` ends the function and hands the value back.

A **call** gives the function its arguments and uses the value that comes back:

```cpp example="Functions with parameters and return values"
#include <iostream>
using namespace std;

int square (int n) {
	return n * n;
}

double average (int a, int b) {
	return (a + b) / 2.0;
}

bool isEven (int n) {
	return n % 2 == 0;
}

void printLine (int length) {           // void: returns nothing
	for (int i = 0; i < length; i++)
		cout << "-";
	cout << endl;
}

int main() {
	int x = square (7);
	cout << x << " " << square (x) << endl;
	cout << average (3, 4) << endl;
	if (isEven (10))
		cout << "10 is even" << endl;
	printLine (12);
	return 0;
}
```

A `void` function returns no value; it is called for what it does (here, printing). It can still use `return;` on its own to finish early.

## Why functions?

- **One job, one name.** `insertAtHead (top, 5)` says what is happening; the five lines inside it say how.
- **Write once, use many times.** createNode is called for every new node.
- **Test pieces separately.** A small function can be checked on its own before it is used inside something bigger.

Every data structure in this course is a set of functions around a struct: createNode, insertBST, maxHeapify, enqueue, findVertex.

## Prototypes

The compiler reads a file from top to bottom, and a function must be declared before it is called. If main comes first, give a **prototype** (the header line with a semicolon) at the top:

```cpp norun
int square (int n);         // prototype: "this function exists"

int main() {
	cout << square (5) << endl;
	return 0;
}

int square (int n) {        // definition, later in the file
	return n * n;
}
```

The lecture keeps all the prototypes for a structure together in a header file (lesson A11).

## Parameters are copies

An ordinary parameter is a **new variable** that starts with a **copy** of the argument's value. Changing the parameter does not change the caller's variable:

```cpp memory at="6" caption="Inside addTen: n is addTen's own copy. Changing it will not change main's score."
#include <iostream>
using namespace std;

void addTen (int n) {
	n = n + 10;
	cout << "inside: " << n << endl;
}

int main() {
	int score = 50;
	addTen (score);
	cout << "after: " << score << endl;
	return 0;
}
```

This is **pass by value**. It prints "inside: 60" and then "after: 50". To let a function change the caller's variable, pass it by reference (lesson A6) or pass a pointer (Part B). It is also why a list function that changes `top` must **return** the new top, or take `Node * & top` (lesson C4).

## Local variables and scope

Variables declared inside a function are **local** to it. They are created when the call starts and destroyed when it ends, and no other function can see them. Two functions may both have a variable called `i`; they are different boxes.

More generally, a variable exists only inside the `{ }` block where it is declared, from its declaration to the closing brace. That stretch of code is its **scope**.

A **global** variable is declared outside every function and can be used by all of them. Globals make it hard to see which function changed what, so use them only for constants such as `const int N = 12;`.

## What happens during a call

1. The arguments are worked out.
2. A new **frame** is pushed on the call stack, holding the parameters (initialised with the arguments) and the local variables.
3. The function's statements run.
4. `return` hands back the value; the frame is popped, and every local variable in it disappears.
5. The caller continues from where it left off, using the returned value.

Press **Step through** on the first example on this page and watch the frames appear and disappear in the Memory view. Recursion (Part D) is this same process, with a function calling itself.

:::mistake
Returning the address of a local variable: after the call, its frame is gone, so the address points at memory that no longer belongs to anything (a dangling pointer, lesson B4). Memory that must outlive the call has to be made with `new`.
:::

:::teachback
Explain what happens on the call stack when main calls a function with an int argument, and why changing that parameter inside the function does not change main's variable.
>> The call pushes a new frame holding the function's parameters and local variables.
>> A normal parameter is a new variable that starts with a copy of the argument's value (pass by value).
>> The function changes only its own copy; main's variable is in a different frame.
>> When the function returns, its frame is popped and its local variables disappear.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int twice (int n) {
	n = n * 2;
	return n;
}

int main() {
	int a = 5;
	int b = twice (a);
	cout << a << " " << b << " " << twice (twice (b)) << endl;
	return 0;
}
```
- [ ] `10 10 40`
- [x] `5 10 40`
- [ ] `5 10 20`
- [ ] `10 20 40`
>> `twice (a)` doubles its own copy, so a stays 5 and b gets 10. `twice (twice (10))` is twice (20), which is 40.
:::

:::quiz
Which line is a correct prototype for a function that takes a Node pointer and an int and returns a bool?
- [x] `bool contains (Node * top, int key);`
- [ ] `contains (Node * top, int key) bool;`
- [ ] `bool contains (Node * top, int key)`
- [ ] `bool contains (top, key);`
>> A prototype is the function's header (return type, name, parameter types) followed by a semicolon. Without the semicolon it would start a definition, and the parameter types cannot be left out.
:::

:::quiz
When does a local variable of a function stop existing?
- [ ] When the program ends
- [ ] When main returns
- [x] When the call that created it returns
- [ ] When it is set to 0
>> Each call's local variables live in that call's frame on the stack. When the call returns, the frame is popped and its variables are gone. The next call gets fresh ones.
:::
