---
title: Arrays
summary: An array is a row of boxes of the same type under one name, numbered from 0. Its size is fixed when it is declared. Loops walk through it, functions receive its address (so they can change it), and an index outside 0 to n − 1 is a serious bug. Two-dimensional arrays are tables of rows and columns.
lectures: COMP 1602/1603 review
goals:
  - Declare, initialise and loop over an array
  - Pass an array to a function together with its size
  - Find the sum, largest value and location of a key in an array
  - Explain why a function can change the caller's array
  - Use a two-dimensional array as a table
labs: [memory]
---

## A row of boxes

```cpp norun
int A[5];                           // five ints: A[0], A[1], A[2], A[3], A[4]
int B[5] = {10, 20, 30, 40, 50};    // with starting values
int C[] = {3, 1, 4};                // size worked out from the list: 3
int D[100] = {0};                   // all 100 set to 0
```

- The elements are numbered from **0**, so an array of n elements has indexes **0 to n − 1**.
- `A[i]` is an ordinary variable: you can assign to it, print it, and pass it to functions.
- The size must be fixed when the program is compiled, for example a constant: `const int MAX = 100; int A[MAX];`. For a size only known while the program runs, use `new int[n]` (lesson B3).

```cpp memory caption="An array is one block of neighbouring boxes. The small numbers are the indexes."
#include <iostream>
using namespace std;

int main() {
	int marks[5] = {72, 85, 64, 90, 58};
	marks[2] = 70;
	int total = 0;
	for (int i = 0; i < 5; i++)
		total = total + marks[i];
	cout << total << endl;
	return 0;
}
```

## The standard loop

```cpp norun
for (int i = 0; i < n; i++)
	// use A[i]
```

i starts at 0 and stops **before** n, so every index 0 to n − 1 is visited exactly once.

## Arrays and functions

A function that works on an array needs the array **and** its size, because the array does not carry its size with it:

```cpp example="Array functions"
#include <iostream>
using namespace std;

int sum (int A[], int n) {
	int total = 0;
	for (int i = 0; i < n; i++)
		total += A[i];
	return total;
}

int largest (int A[], int n) {
	int best = A[0];                 // start with the first element, not with 0
	for (int i = 1; i < n; i++)
		if (A[i] > best)
			best = A[i];
	return best;
}

int find (int A[], int n, int key) { // location of key, or -1
	for (int i = 0; i < n; i++)
		if (A[i] == key)
			return i;
	return -1;
}

void doubleAll (int A[], int n) {
	for (int i = 0; i < n; i++)
		A[i] = A[i] * 2;
}

int main() {
	int A[] = {4, -2, 9, 7, 3};
	cout << "sum " << sum (A, 5) << ", largest " << largest (A, 5) << endl;
	cout << "9 is at " << find (A, 5, 9) << ", 8 is at " << find (A, 5, 8) << endl;
	doubleAll (A, 5);
	for (int i = 0; i < 5; i++)
		cout << A[i] << " ";
	cout << endl;
	return 0;
}
```

Two things to notice:

- `largest` starts with `A[0]`, not with 0. Starting at 0 would give the wrong answer for an array of negative numbers.
- `doubleAll` changes **main's** array. Arrays are not copied when passed. The parameter `int A[]` receives the **address** of the first element (lesson B5), so the function works on the caller's boxes. This is different from int parameters, which are copies.

`find` is a **linear search**: it may check every element, so it is O(n). If the array is sorted, binary search (lesson D3) is much faster.

## Staying inside the array

C++ does **not** check indexes. `A[5]` in an array of 5 elements reads or writes whatever memory comes next: maybe another variable, maybe nothing the program owns. A real program might print rubbish, crash, or quietly corrupt another variable. This site stops and explains instead:

```cpp error
#include <iostream>
using namespace std;

int main() {
	int A[5] = {1, 2, 3, 4, 5};
	int total = 0;
	for (int i = 0; i <= 5; i++)     // <= runs one step too far
		total += A[i];
	cout << total << endl;
	return 0;
}
```

## Inserting and deleting means shifting

An array cannot grow or shrink, and its elements must stay next to each other. To insert in the middle of a sorted array, every later element must shift one place right; to delete, every later element shifts left. That is O(n) work, and it is the reason linked lists exist (lesson C1).

```cpp norun
// insert key into sorted A[0..n-1], which has room for one more
int i = n - 1;
while (i >= 0 && A[i] > key) {
	A[i + 1] = A[i];                 // shift right
	i--;
}
A[i + 1] = key;
n++;
```

This loop is also the heart of insertion sort (lesson K1).

## Two-dimensional arrays

A 2D array is a table: the first index picks the **row**, the second the **column**.

```cpp example="A 2D array: marks for 3 students in 4 tests"
#include <iostream>
using namespace std;

const int STUDENTS = 3;
const int TESTS = 4;

int main() {
	int marks[STUDENTS][TESTS] = {
		{70, 82, 65, 90},
		{55, 61, 72, 48},
		{88, 79, 94, 85}
	};
	for (int s = 0; s < STUDENTS; s++) {
		int total = 0;
		for (int t = 0; t < TESTS; t++)
			total += marks[s][t];
		cout << "student " << s << ": total " << total << ", average " << total / (double) TESTS << endl;
	}
	return 0;
}
```

An adjacency matrix for a graph (lesson J1) is a 2D array: `matrix[i][j]` describes the edge from vertex i to vertex j. When a 2D array is passed to a function, the number of columns must be given: `void print (int m[][TESTS], int rows)`.

:::remember
- n elements → indexes 0 to n − 1. Loop with `i < n`.
- Pass the size along with the array.
- A function receives the array's address, so it can change the caller's array.
- An index outside 0 to n − 1 is a bug that C++ does not catch for you.
:::

:::teachback
Explain why a function can change the caller's array even though it cannot change the caller's int variables, and why you must also pass the array's size.
>> An array parameter receives the address of the first element, not a copy of the elements.
>> So the function reads and writes the caller's own boxes.
>> The array does not carry its size with it, so the function needs `n` to know where to stop.
>> Valid indexes are 0 to n - 1, and C++ does not stop you going past the end.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

void mystery (int A[], int n) {
	for (int i = 0; i < n / 2; i++) {
		int temp = A[i];
		A[i] = A[n - 1 - i];
		A[n - 1 - i] = temp;
	}
}

int main() {
	int A[] = {1, 2, 3, 4, 5};
	mystery (A, 5);
	for (int i = 0; i < 5; i++)
		cout << A[i];
	cout << endl;
	return 0;
}
```
- [ ] `12345`
- [x] `54321`
- [ ] `52341`
- [ ] `15342`
>> mystery swaps A[0] with A[4] and A[1] with A[3] (n / 2 = 2 passes); the middle element stays. The array is reversed, and because the function received main's array, main sees the change.
:::

:::quiz
An array is declared `int A[10];`. Which loop visits every element exactly once?
- [ ] `for (int i = 1; i <= 10; i++)`
- [x] `for (int i = 0; i < 10; i++)`
- [ ] `for (int i = 0; i <= 10; i++)`
- [ ] `for (int i = 1; i < 10; i++)`
>> The indexes are 0 to 9. The first loop misses A[0] and goes out of bounds at A[10]; the third reaches A[10]; the last misses A[0].
:::

:::quiz
`int largest (int A[], int n)` starts with `int best = 0;` instead of `int best = A[0];`. For which array does it give the wrong answer?
- [ ] 3 8 1
- [ ] 0 0 0
- [x] -4 -9 -2
- [ ] 5
>> Every value in -4 -9 -2 is less than 0, so best stays 0 and the function returns 0, which is not even in the array. Starting with A[0] always starts with a real element.
:::
