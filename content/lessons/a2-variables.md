---
title: Variables, types and expressions
summary: A variable is a named box in memory that holds one value of one type. This lesson covers the basic types, giving variables values, arithmetic (including the integer division trap), mixing types, constants, and reading input with cin.
lectures: COMP 1602/1603 review
goals:
  - Declare variables of type int, double, char, bool and string, and give them starting values
  - Predict the result of arithmetic, including integer division and %
  - Convert between int and double with a cast
  - Read input with cin
  - Avoid using a variable before it has a value
labs: [memory]
---

## Variables are named boxes

A **variable** is a named place in memory that holds one value. Before you use a variable you **declare** it, giving its type and its name:

```cpp norun
int count;              // declares count: a box that can hold one whole number
count = 10;             // assignment: put 10 in the box
int total = 0;          // declare and give a starting value in one step
```

`=` means "store the value on the right in the variable on the left". It is not a question about equality; that is `==` (lesson A3).

```cpp memory caption="Each variable is a box in main's frame. Its type decides what kind of value fits in it."
#include <iostream>
#include <string>
using namespace std;

int main() {
	int age = 19;
	double gpa = 3.45;
	char grade = 'A';
	bool passed = true;
	string name = "Kezia";
	age = age + 1;
	cout << name << " " << age << endl;
	return 0;
}
```

## The basic types

| Type | Holds | Examples |
|---|---|---|
| `int` | whole numbers, about ±2.1 billion | `0`, `42`, `-7` |
| `double` | numbers with a decimal part | `3.14`, `-0.5`, `2.0` |
| `char` | a single character, in single quotes | `'A'`, `'7'`, `' '` |
| `bool` | `true` or `false` | `true` |
| `string` | text, in double quotes (needs `#include <string>`) | `"hello"`, `""` |

Names may contain letters, digits and `_`, must not start with a digit, and are case sensitive (`total` and `Total` are different variables). Choose names that say what the value means.

## Arithmetic

| Operator | Meaning | `17 ? 5` gives |
|---|---|---|
| `+` | add | 22 |
| `-` | subtract | 12 |
| `*` | multiply | 85 |
| `/` | divide | **3** (with two ints) |
| `%` | remainder (modulus) | 2 |

**Integer division**: when both values are ints, `/` throws away the decimal part. 17 / 5 is 3, not 3.4. `%` gives what is left over: 17 = 3 × 5 + 2, so 17 % 5 is 2. You have already used both: `i / 2` finds a heap parent, and `key % 12 + 1` is a hash function.

If **either** value is a double, the division keeps the decimals: `17 / 5.0` is 3.4.

```cpp example="Arithmetic and integer division"
#include <iostream>
using namespace std;

int main() {
	int a = 17, b = 5;
	cout << a / b << " remainder " << a % b << endl;
	cout << a / 5.0 << endl;
	cout << (double) a / b << endl;
	cout << 1 / 2 * 10 << " but " << 10 * 1 / 2 << endl;
	cout << 2 + 3 * 4 << " and " << (2 + 3) * 4 << endl;
	return 0;
}
```

- `(double) a` is a **cast**: it converts a to a double for this calculation, so the division keeps its decimals. `static_cast<double> (a)` means the same.
- `1 / 2 * 10` is 0: `1 / 2` is worked out first, and integer division makes it 0.
- `*`, `/` and `%` happen before `+` and `-`, as in maths. Use brackets whenever you are unsure.

:::mistake
`double average = total / count;` with two ints still does integer division, **then** stores the result in a double. If total is 7 and count is 2, average becomes 3, not 3.5. Cast first: `(double) total / count`.
:::

## Changing a variable

```cpp norun
count = count + 1;      // add 1 to count
count += 5;             // the same as count = count + 5   (also -=, *=, /=, %=)
count++;                // add 1    (count-- subtracts 1)
```

The right side is worked out first, using the **old** value, and then the result is stored. So `count = count + 1` is not a contradiction: it means "the new count is the old count plus 1".

## Constants

A value that must never change gets `const`:

```cpp norun
const int MAX = 100;
const double PI = 3.14159;
```

Changing a const is a compile error, which protects you from accidents. Constants are usually written in CAPITALS, like `MAX_VERTICES` in lesson J2.

## Reading input with cin

`cin` is the keyboard. `>>` reads the next value from it and stores it in a variable, skipping spaces and new lines first:

```cpp example="Reading input" stdin="3 4.5 Marcus"
#include <iostream>
#include <string>
using namespace std;

int main() {
	int quantity;
	double price;
	string name;
	cout << "Quantity, price and name: ";
	cin >> quantity >> price >> name;
	cout << endl << name << " owes $" << quantity * price << endl;
	return 0;
}
```

The keyboard input for this example is shown under it. `cin >> name` reads one word: it stops at a space. Lesson A8 shows how to read a whole line.

## A variable must have a value before it is used

A declared variable has **no** sensible value until you give it one. In C++ its box simply contains whatever was left in that memory. This site stops the program and tells you:

```cpp error
#include <iostream>
using namespace std;

int main() {
	int total;
	total = total + 5;      // total has no value yet
	cout << total << endl;
	return 0;
}
```

The fix is to start it at 0: `int total = 0;`. Many list and tree bugs are this same mistake with a pointer, such as a `next` field that was never set to NULL.

:::remember
- Declare before use: `type name = value;`
- int / int throws away the decimals; `%` is the remainder.
- Cast with `(double) x` when you need decimals from ints.
- Always give a variable a starting value.
:::

:::teachback
Explain why `double average = total / count;` gives the wrong answer when `total` is 7 and `count` is 2 (both ints), and how to fix it.
>> Both values are ints, so `/` does integer division and throws away the decimal part: 7 / 2 is 3.
>> The result is only turned into a double after the division, so the lost .5 cannot come back.
>> Fix it by converting before dividing: `(double) total / count` gives 3.5.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int main() {
	int x = 20, y = 6;
	cout << x / y << " " << x % y << " " << x / 8.0 << endl;
	return 0;
}
```
- [ ] `3.33333 2 2.5`
- [x] `3 2 2.5`
- [ ] `3 0 2`
- [ ] `3 2 2`
>> 20 / 6 with two ints is 3; 20 = 3 × 6 + 2, so the remainder is 2; 20 / 8.0 involves a double, so it is 2.5.
:::

:::quiz
`int total = 7, count = 2;` Which expression gives 3.5?
- [ ] `total / count`
- [ ] `(double) (total / count)`
- [x] `(double) total / count`
- [ ] `total / count * 1.0`
>> Only the third converts **before** dividing, so the division is 7.0 / 2 = 3.5. In the others, `total / count` is integer division and gives 3 first; converting 3 to a double afterwards cannot bring the .5 back.
:::

:::quiz
What is the value of n after these lines run?
```cpp norun
int n = 5;
n += 3;
n++;
n = n * 2;
```
- [ ] 16
- [ ] 17
- [x] 18
- [ ] 20
>> n starts at 5. `n += 3` makes it 8, `n++` makes it 9, and `n = n * 2` uses the old value 9 to store 18.
:::
