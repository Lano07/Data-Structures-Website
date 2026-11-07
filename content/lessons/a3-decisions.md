---
title: Making decisions
summary: if and else let a program choose which statements to run, based on a condition that is true or false. Conditions are built from comparisons joined with && (and), || (or) and ! (not). The order of a && test matters, because the second part is skipped when the first is false.
lectures: COMP 1602/1603 review
goals:
  - Write if, if-else and else-if chains
  - Build conditions with comparisons and &&, || and !
  - Use short-circuit evaluation to guard against NULL, as every list function does
  - Use switch and the ? : operator
  - Avoid the = versus == mistake
labs: [memory]
---

## if and else

```cpp norun
if (condition) {
	// runs only when the condition is true
}
else {
	// runs only when it is false
}
```

The condition goes in brackets. The `else` part is optional. When a branch has only one statement the braces may be left out, as the lecture code often does, but braces never hurt.

```cpp example="if, else if, else" stdin="73"
#include <iostream>
using namespace std;

int main() {
	int mark;
	cin >> mark;
	if (mark >= 80)
		cout << "A" << endl;
	else if (mark >= 70)
		cout << "B" << endl;
	else if (mark >= 60)
		cout << "C" << endl;
	else
		cout << "F" << endl;
	return 0;
}
```

An **else-if chain** is checked from the top, and only the **first** true branch runs. A mark of 73 fails `>= 80`, passes `>= 70`, prints B, and skips everything below, even though 73 is also `>= 60`. The order of the tests matters.

## Comparisons

| Operator | Meaning |
|---|---|
| `==` | equal to |
| `!=` | not equal to |
| `<`, `<=` | less than, less than or equal to |
| `>`, `>=` | greater than, greater than or equal to |

A comparison gives a `bool`: true or false. Printed with cout, true shows as 1 and false as 0.

:::mistake
`if (x = 3)` **assigns** 3 to x, and then treats 3 as true, so the branch always runs and x is changed. Comparison is `==`. This site warns you when a condition contains a single `=`.
:::

## Combining conditions

| Operator | Meaning | True when |
|---|---|---|
| `&&` | and | both sides are true |
| `\|\|` | or | at least one side is true |
| `!` | not | the condition is false |

```cpp norun
if (mark >= 0 && mark <= 100)        // mark is in range
if (day == 6 || day == 7)            // weekend
if (!found)                          // found is false
```

:::mistake
`if (0 <= mark <= 100)` does not do what it looks like. C++ works out `0 <= mark` first (giving 0 or 1), then checks whether that 0 or 1 is `<= 100`, which is always true. Write two comparisons joined by `&&`.
:::

## Short-circuit evaluation

C++ works out `&&` and `||` from left to right and **stops as soon as the answer is known**:

- `A && B`: if A is false, the answer is false, so **B is never evaluated**.
- `A || B`: if A is true, the answer is true, so B is never evaluated.

This is not a detail. It is what makes linked-list and tree code safe:

```cpp norun
while (curr != NULL && curr->data != key)
	curr = curr->next;
```

When `curr` becomes NULL, the first test is false, and `curr->data` is **never read**. Swap the two tests and the program reads through a NULL pointer and crashes. Lessons C2, C3 and G3 all depend on this order.

```cpp example="Short-circuit in action"
#include <iostream>
using namespace std;

bool check (int n) {
	cout << "(checked " << n << ") ";
	return n > 0;
}

int main() {
	if (check (-1) && check (5))
		cout << "both";
	cout << endl;
	if (check (3) || check (7))
		cout << "at least one";
	cout << endl;
	return 0;
}
```

The second `check` is never called in either line: the first result was enough.

## switch

When one value is compared against several constants, `switch` is tidier than a long else-if chain:

```cpp example="switch with a menu choice" stdin="2"
#include <iostream>
using namespace std;

int main() {
	int choice;
	cin >> choice;
	switch (choice) {
		case 1:
			cout << "Insert" << endl;
			break;
		case 2:
			cout << "Delete" << endl;
			break;
		case 3:
		case 4:
			cout << "Search" << endl;
			break;
		default:
			cout << "Unknown choice" << endl;
	}
	return 0;
}
```

- Execution jumps to the matching `case` and runs until a `break`.
- Without `break` it "falls through" into the next case. Above, 3 and 4 share one branch on purpose.
- `default` runs when no case matches.
- switch only works with whole-number values (int, char), not strings or doubles.

Assignment menus (like Assignment 2's numbered commands) are often a switch inside a loop.

## The ? : operator

`condition ? valueIfTrue : valueIfFalse` chooses between two values in a single expression:

```cpp norun
int bigger = (a > b) ? a : b;
cout << (count == 1 ? "item" : "items");
```

Use it for small choices of a value; use if-else for choosing between actions.

:::remember
- An else-if chain runs only the **first** true branch.
- `==` compares, `=` assigns.
- `&&` stops at the first false, `||` at the first true. Put the NULL check **first**.
- switch needs a `break` at the end of each case.
:::

:::teachback
Explain why `while (curr != NULL && curr->data != key)` is safe, but the same test with the two parts swapped can crash.
>> `&&` is worked out from left to right and stops as soon as one part is false (short-circuit evaluation).
>> When `curr` is NULL, `curr != NULL` is false, so `curr->data` is never read.
>> Swapped, `curr->data` would be read first, following a NULL pointer, which crashes.
>> So the NULL check always goes first.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int main() {
	int x = 15;
	if (x > 10)
		cout << "A";
	if (x > 5)
		cout << "B";
	else if (x > 12)
		cout << "C";
	else
		cout << "D";
	cout << endl;
	return 0;
}
```
- [ ] `A`
- [x] `AB`
- [ ] `ABC`
- [ ] `AC`
>> The first `if` stands alone and prints A. The second statement is a separate if-else chain: `x > 5` is true, so B is printed and the rest of that chain (C and D) is skipped.
:::

:::quiz
`p` is a pointer that may be NULL. Which condition is safe?
- [ ] `if (p->data == 5 && p != NULL)`
- [x] `if (p != NULL && p->data == 5)`
- [ ] `if (p->data == 5 || p == NULL)`
- [ ] All three are safe
>> `&&` stops as soon as the left side is false. With the NULL test first, `p->data` is only read when p is a real node. The other two read `p->data` before checking p.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int main() {
	int n = 2;
	switch (n) {
		case 1:
			cout << "one ";
		case 2:
			cout << "two ";
		case 3:
			cout << "three ";
			break;
		case 4:
			cout << "four ";
	}
	cout << endl;
	return 0;
}
```
- [ ] `two`
- [x] `two three`
- [ ] `two three four`
- [ ] `one two three`
>> Execution jumps to case 2 and prints "two". There is no break, so it falls through into case 3 and prints "three", then stops at the break.
:::
