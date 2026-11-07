---
title: Addresses and pointers
summary: Every variable lives at an address in memory. A pointer is a variable that holds an address. With `&` you get an address, and with `*` you follow one.
lectures: Lecture 1
goals:
  - Explain the difference between a variable's value and its address
  - Declare a pointer, give it an address with `&`, and follow it with `*`
  - Predict what a short pointer program prints
  - Use NULL for "points to nothing"
labs: [memory]
---

## Memory is a row of numbered boxes

Think of memory as a long row of boxes, each with a number called its **address**. When you declare `int x = 10;`, the computer picks some boxes for `x`, writes 10 in them, and remembers where they are. The lectures draw addresses in square brackets, like `[1024]`.

So every variable has two things:

- its **value** (what is stored: 10)
- its **address** (where it is stored: [1024])

## Getting an address: &

Putting `&` in front of a variable gives its address. `&x` means "the address of x".

## Pointer variables

A **pointer** is a variable whose value is an address. Its type says what kind of thing lives at that address:

```cpp norun
int * p;       // p can hold the address of an int
Node * top;    // top can hold the address of a Node
```

The `*` in a declaration means "pointer to". Spaces around it do not matter: `int* p`, `int *p` and `int * p` all mean the same thing. The lectures write `int * p`.

## Following a pointer: *

In an expression (not a declaration), `*p` means "the thing that p points to". This is called **dereferencing** p.

```cpp memory caption="p holds the address of x, drawn as an arrow. *p and x are the same box."
#include <iostream>
using namespace std;

int main() {
	int x = 10;
	int * p;
	p = &x;
	*p = 20;
	cout << x << " " << *p << endl;
	return 0;
}
```

Line by line:

- `int * p;` makes a pointer that does not point anywhere useful yet.
- `p = &x;` stores the address of `x` in `p`. Now p points to x.
- `*p = 20;` follows p and stores 20 **there**, so `x` becomes 20.
- `cout << *p` follows p and reads the value there: 20.

:::predict Two pointers, one variable. What does this print?
```cpp
#include <iostream>
using namespace std;

int main() {
	int x = 5;
	int * p = &x;
	int * q = p;
	*q = 8;
	cout << x << " " << *p << endl;
	p = NULL;
	cout << *q << endl;
	return 0;
}
```
:::


:::remember
The same symbol does two jobs. In a **declaration**, `int * p` means "p is a pointer". In an **expression**, `*p` means "follow p". And `&x` means "the address of x".
:::

## Two pointers to one variable

```cpp example="Several names for one box"
#include <iostream>
using namespace std;

int main() {
	int a = 5, b = 7;
	int * p = &a;
	int * q = p;          // q gets a copy of the address in p
	*q = *q + 1;          // changes a
	p = &b;               // p now points to b; q still points to a
	*p = *q * 10;         // b = a * 10
	cout << a << " " << b << endl;
	return 0;
}
```

`q = p` copies the **address**, not the value. Afterwards both point to `a`, so changing `*q` changes `a`. Then `p` is moved to `b`, but `q` still points to `a`.

## NULL: pointing to nothing

`NULL` is a special address that means "no object". Use it to show a pointer is not pointing anywhere yet, and test for it before following a pointer:

```cpp norun
int * p = NULL;
if (p != NULL)
	cout << *p;
```

Following a NULL pointer crashes the program, because there is nothing there. In linked lists and trees, NULL marks "no next node" and "no child".

## Mistakes to avoid

```cpp error
#include <iostream>
using namespace std;

int main() {
	int * p;
	*p = 5;
	cout << *p << endl;
	return 0;
}
```

`p` was declared but never given an address, so it holds a random one. `*p = 5;` would write to an unknown place in memory. Always give a pointer a value (an address with `&`, the result of `new`, another pointer, or NULL) before you follow it.

:::mistake
Mixing up `p = q;` and `*p = *q;`. The first makes p point where q points. The second copies the **value** q points to into the place p points to; the pointers themselves do not change.
:::

:::teachback
Suppose `int x = 5; int * p = &x;`. Explain the difference between `&x`, `p` and `*p`, and what `*p = 9;` does.
>> `&x` is the address of x: where x is in memory.
>> `p` is a pointer variable whose value is that address.
>> `*p` follows the address, so it is x itself.
>> `*p = 9;` changes x to 9 (p itself does not change).
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int main() {
	int x = 3, y = 8;
	int * p = &x;
	int * q = &y;
	*p = *q;
	q = p;
	*q = *q + 1;
	cout << x << " " << y << endl;
	return 0;
}
```
- [ ] `3 9`
- [ ] `8 9`
- [x] `9 8`
- [ ] `9 9`
>> `*p = *q;` copies 8 into x. `q = p;` makes q point to x as well. `*q = *q + 1;` adds 1 to x, giving 9. y was never changed: 8.
:::

:::quiz
After `int a = 4; int * p = &a;`, which expression has the value 4?
- [ ] `p`
- [ ] `&p`
- [x] `*p`
- [ ] `&a`
>> `p` and `&a` are both the address of a. `&p` is the address of the pointer itself. `*p` follows p to a, whose value is 4.
:::
