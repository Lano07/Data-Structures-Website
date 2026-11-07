---
title: Pointers and arrays
summary: An array's name acts like the address of its first element, which is why passing an array to a function lets the function change it. Pointer arithmetic moves through an array, and arrays can hold pointers too.
lectures: Lecture 1, COMP 1602 review
goals:
  - Explain why a function can change an array passed to it
  - Use pointer arithmetic (`p + 1`, `*(p + i)`) and know it equals `p[i]`
  - Pass the array's length as a separate parameter
  - Declare and use an array of pointers
labs: [memory]
---

## An array name is an address

For `int A[5]`, the name `A` used in an expression gives the address of `A[0]`. So these are the same:

```cpp norun
int * p = A;        // same as  int * p = &A[0];
```

## Pointer arithmetic

If p points to an element of an array, `p + 1` points to the **next element** (not the next byte: C++ steps by the size of one element). So:

- `*(p + i)` is the element i places after p
- `p[i]` is shorthand for `*(p + i)`, which is why `A[i]` works on a pointer

```cpp example="Pointer arithmetic"
#include <iostream>
using namespace std;

int main() {
	int A[5] = {10, 20, 30, 40, 50};
	int * p = A;
	cout << *p << " " << *(p + 2) << " " << p[4] << endl;
	p = p + 1;
	*p = 99;
	cout << A[1] << " " << p[1] << endl;
	return 0;
}
```

In the step-through, the arrow from p points at one particular cell of the array.

## Passing an array to a function

In a parameter list, `int A[]` really means `int * A`: the function receives the **address** of the first element, not a copy of the array. So the function can change the caller's array:

```cpp example="Arrays are passed by address"
#include <iostream>
using namespace std;

void doubleAll (int A[], int n) {
	for (int i = 0; i < n; i++)
		A[i] = A[i] * 2;
}

int sum (int A[], int n) {
	int total = 0;
	for (int i = 0; i < n; i++)
		total = total + A[i];
	return total;
}

int main() {
	int marks[4] = {3, 5, 7, 9};
	doubleAll (marks, 4);
	cout << marks[0] << " " << marks[3] << " " << sum (marks, 4) << endl;
	return 0;
}
```

:::mistake
Using `sizeof` to find an array's length inside a function. Inside `doubleAll`, `A` is a pointer, so `sizeof(A)` is the size of a pointer (8), not of the array. That is why array functions always take the length as a second parameter, like `int n` here.
:::

## Arrays of pointers

An array can hold pointers. Hashing with chaining (Part I) uses exactly this: each location holds the top of a linked list.

```cpp memory caption="table is an array of three Node pointers. Two locations point to lists; one is NULL."
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

int main() {
	Node * table[3];
	for (int i = 0; i < 3; i++)
		table[i] = NULL;
	table[0] = new Node;
	table[0]->data = 12;
	table[0]->next = NULL;
	table[2] = new Node;
	table[2]->data = 5;
	table[2]->next = table[0];
	cout << table[2]->next->data << endl;
	return 0;
}
```

`Node * table[3];` reads as "table is an array of 3 pointers to Node". Like any local array, its elements start as garbage, so the loop sets them all to NULL first.

## Two-dimensional arrays

A 2D array is an array of rows. When you pass one to a function, every size except the first must be given:

```cpp norun
void printGrid (int M[][4], int rows) {
	for (int i = 0; i < rows; i++) {
		for (int j = 0; j < 4; j++)
			cout << M[i][j] << " ";
		cout << endl;
	}
}
```

:::teachback
Explain how an array's name relates to a pointer, and what `A[i]` means in terms of pointers.
>> The array's name gives the address of its first element.
>> `A[i]` means `*(A + i)`: move i elements along from the start, then follow the address.
>> Pointer arithmetic counts in whole elements, not bytes.
>> An array made with `new int[n]` is used the same way and freed with `delete []`.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

void change (int A[], int n) {
	A[0] = n;
	n = 100;
}

int main() {
	int B[3] = {1, 2, 3};
	int n = 3;
	change (B, n);
	int * p = B + 1;
	cout << B[0] << " " << n << " " << *p << endl;
	return 0;
}
```
- [ ] `1 3 2`
- [x] `3 3 2`
- [ ] `3 100 2`
- [ ] `3 3 1`
>> The array is passed by address, so `A[0] = n;` changes B[0] to 3. n is an ordinary int passed by value, so the function's `n = 100;` changes only its copy. p points to B[1], which is 2.
:::

:::quiz
For `int A[10]; int * p = A;`, which expression is the same as `A[3]`?
- [ ] `*p + 3`
- [x] `*(p + 3)`
- [ ] `p + 3`
- [ ] `&A[3]`
>> `p + 3` is the address of A[3], and `*(p + 3)` follows it. `*p + 3` is A[0] plus 3. `&A[3]` is an address, not a value.
:::
