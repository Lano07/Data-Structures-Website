---
title: Recursion on arrays
summary: An array becomes a smaller problem when you look at fewer of its elements, by moving the start index forward, moving the end back, or cutting the range in half. printArrayRec from Lecture 4 moves the start; binary search cuts in half.
lectures: Lecture 4
goals:
  - Describe part of an array with indexes m to n - 1, and know when that range is empty
  - Write printArrayRec and its base case (Lecture 4)
  - Write recursive sum, maximum and in-place reverse
  - Write recursive binary search and explain why it makes so few calls
  - Explain why every call sees the same array
labs: [recursion, memory]
---

## A smaller array: fewer indexes

A list gets smaller by following `top->next`. An array cannot get smaller, but the **part you look at** can. Lecture 4 describes that part with two indexes:

- `m`: the first index to look at
- `n`: one past the last index, so the elements are `a[m]`, `a[m+1]`, …, `a[n-1]`

:::diagram array 250 23 17 4
`printArrayRec (a, 0, 4)` works on indexes 0 to 3, the whole array. Its recursive call works on 1 to 3, then 2 to 3, then just 3, then nothing.
:::

The range is **empty** when `m == n`: there are no elements from m up to n − 1. That is the array's version of `top == NULL`.

## printArrayRec

Lecture 4's function displays `a[m]` to `a[n-1]`:

```cpp norun
void printArrayRec (int a[], int m, int n) {
	if (m == n)
		return;
	cout << a[m] << endl;
	printArrayRec (a, m+1, n);
}
```

It has the same shape as printListRec: if there is nothing left, return; otherwise print the first element and let the recursive call print the rest. `m+1` plays the part of `top->next`.

:::trace
printArrayRec(a, 0, 4) prints 250 and calls with m = 1 → prints 23, calls with m = 2 → prints 17, calls with m = 3 → prints 4, calls with m = 4. Now m == n: no more elements, return.
:::

The lecture then makes the base case safer:

```cpp norun
void printArrayRec (int a[], int m, int n) {
	if (m < 0 || m >= n)
		return;
	cout << a[m] << endl;
	printArrayRec (a, m+1, n);
}
```

With `m == n`, a call like `printArrayRec (a, 5, 4)` would skip past n, never meet the base case, and read past the end of the array. With `m >= n` it stops at once, and `m < 0` guards against a negative start index.

## Every call sees the same array

An array parameter does not copy the array. `int a[]` receives the **address** of the first element (lesson B5), so every call's `a` points to main's one array. The indexes `m` and `n`, on the other hand, are ordinary ints, and each frame has its own.

```cpp memory at="7" caption="The base case of printArrayRec: five frames, each with its own m and n, and every a points to the same array in main."
#include <iostream>
using namespace std;

void printArrayRec (int a[], int m, int n) {
	if (m < 0 || m >= n)
		return;
	cout << a[m] << endl;
	printArrayRec (a, m+1, n);
}

int main() {
	int a[] = {250, 23, 17, 4};
	printArrayRec (a, 0, 4);
	return 0;
}
```

So when a recursive function **changes** an element, every other call (and main) sees the change. That is what makes in-place recursion, like the reverse below, possible.

## Adding up the elements

Using the three questions from lesson D1:

1. Smallest case: an empty range (m == n). Its sum is 0.
2. Smaller problem: the range from m + 1.
3. Build the answer: `a[m]` plus the sum of the rest.

```cpp norun
int sumRec (int a[], int m, int n) {
	if (m >= n)
		return 0;
	return a[m] + sumRec (a, m+1, n);
}
```

## The largest element

An empty range has no largest element, so here the smallest case is **one** element, which is the largest by itself:

```cpp norun
int maxRec (int a[], int m, int n) {
	if (m == n - 1)                     // one element left
		return a[m];
	int restMax = maxRec (a, m+1, n);   // the largest of a[m+1..n-1]
	if (a[m] > restMax)
		return a[m];
	return restMax;
}
```

Store the recursive answer in a variable. Writing `maxRec (a, m+1, n)` twice, once in the test and again in the return, would make two calls for every one call, and the number of calls would double at every level.

## Reversing in place: shrink from both ends

To reverse `a[lo..hi]`: swap the two end elements, then reverse what is between them. The range shrinks by one at each end.

```cpp norun
void reverseRec (int a[], int lo, int hi) {
	if (lo >= hi)              // zero or one element left: nothing to swap
		return;
	int temp = a[lo];
	a[lo] = a[hi];
	a[hi] = temp;
	reverseRec (a, lo + 1, hi - 1);
}
```

Here `lo` and `hi` are both included (it is called as `reverseRec (a, 0, size - 1)`). With an odd number of elements, `lo` and `hi` meet at the middle element (`lo == hi`); with an even number, they cross (`lo > hi`). The test `lo >= hi` stops both.

## Cutting the problem in half: binary search

If the array is **sorted**, you can find a key without looking at most of the elements. Compare the key with the middle element:

- equal: found it
- smaller: it can only be in the left half
- larger: it can only be in the right half

```cpp norun
int binarySearchRec (int a[], int key, int lo, int hi) {
	if (lo > hi)
		return -1;                                   // empty range: not found
	int mid = (lo + hi) / 2;
	if (a[mid] == key)
		return mid;
	if (key < a[mid])
		return binarySearchRec (a, key, lo, mid - 1);   // left half
	return binarySearchRec (a, key, mid + 1, hi);       // right half
}
```

Each call throws away half of what is left. 1,000 elements become 500, 250, 125, … 1, so about 10 calls are enough, where checking every element could take 1,000. The number of calls grows like **log₂ n**. Searching a balanced BST (lesson G2) works the same way: each comparison discards a whole subtree.

## Trying them out

```cpp example="Recursion on arrays"
#include <iostream>
using namespace std;

void printArrayRec (int a[], int m, int n) {
	if (m < 0 || m >= n)
		return;
	cout << a[m] << " ";
	printArrayRec (a, m+1, n);
}

int sumRec (int a[], int m, int n) {
	if (m >= n)
		return 0;
	return a[m] + sumRec (a, m+1, n);
}

int maxRec (int a[], int m, int n) {
	if (m == n - 1)
		return a[m];
	int restMax = maxRec (a, m+1, n);
	if (a[m] > restMax)
		return a[m];
	return restMax;
}

void reverseRec (int a[], int lo, int hi) {
	if (lo >= hi)
		return;
	int temp = a[lo];
	a[lo] = a[hi];
	a[hi] = temp;
	reverseRec (a, lo + 1, hi - 1);
}

int binarySearchRec (int a[], int key, int lo, int hi) {
	if (lo > hi)
		return -1;
	int mid = (lo + hi) / 2;
	if (a[mid] == key)
		return mid;
	if (key < a[mid])
		return binarySearchRec (a, key, lo, mid - 1);
	return binarySearchRec (a, key, mid + 1, hi);
}

int main() {
	int a[] = {250, 23, 17, 4};
	printArrayRec (a, 0, 4);
	cout << endl;
	printArrayRec (a, 1, 3);
	cout << endl;
	cout << "sum: " << sumRec (a, 0, 4) << endl;
	cout << "max: " << maxRec (a, 0, 4) << endl;
	reverseRec (a, 0, 3);
	printArrayRec (a, 0, 4);
	cout << endl;

	int sorted[] = {3, 8, 15, 21, 30, 42, 57, 61};
	cout << "21 is at index " << binarySearchRec (sorted, 21, 0, 7) << endl;
	cout << "40 gives " << binarySearchRec (sorted, 40, 0, 7) << endl;
	return 0;
}
```

Open the **Call tree** tab for binary search: one chain of only a few calls, because each call makes at most one more.

:::predict What does this recursive function return?
```cpp
#include <iostream>
using namespace std;

int f (int A[], int n) {
	if (n == 0)
		return 0;
	if (A[n - 1] % 2 == 0)
		return A[n - 1] + f (A, n - 1);
	return f (A, n - 1);
}

int main() {
	int A[] = {3, 8, 5, 6, 2};
	cout << f (A, 5) << endl;
	return 0;
}
```
:::


:::teachback
Explain how `printArrayRec (a, m, n)` makes the problem smaller each time, and why it stops when `m == n` (or `m >= n`).
>> It prints `a[m]`, then calls itself with `m + 1`, so each call handles one element and passes on the rest.
>> The range `a[m]` to `a[n-1]` gets one element shorter with every call.
>> When `m == n` the range is empty, so there is nothing left to print and the call returns.
>> `m >= n` also stops a call that starts past the end.
:::

:::quiz
`a` holds 250 23 17 4. What does `printArrayRec (a, 1, 3)` display (Lecture 4's version)?
- [ ] 250 23 17
- [x] 23 17
- [ ] 23 17 4
- [ ] 17 4
>> It displays a[m] to a[n−1], so a[1] and a[2]: 23 and 17. Index 3 is n, which is one past the end of the range.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int mystery (int a[], int m, int n) {
	if (m >= n)
		return 0;
	if (a[m] % 2 == 0)
		return 1 + mystery (a, m + 1, n);
	return mystery (a, m + 1, n);
}

int main() {
	int a[] = {6, 3, 8, 10, 7, 2};
	cout << mystery (a, 1, 5) << endl;
	return 0;
}
```
- [ ] `4`
- [x] `2`
- [ ] `3`
- [ ] `0`
>> mystery counts the even numbers in a[1..4], which are 3, 8, 10 and 7. Only 8 and 10 are even, so it prints 2. The 6 at index 0 and the 2 at index 5 are outside the range.
:::

:::quiz
The global `calls` counts how many times binarySearchRec runs. What does this print?
```cpp check
#include <iostream>
using namespace std;

int calls = 0;

int binarySearchRec (int a[], int key, int lo, int hi) {
	calls++;
	if (lo > hi)
		return -1;
	int mid = (lo + hi) / 2;
	if (a[mid] == key)
		return mid;
	if (key < a[mid])
		return binarySearchRec (a, key, lo, mid - 1);
	return binarySearchRec (a, key, mid + 1, hi);
}

int main() {
	int a[] = {3, 8, 15, 21, 30, 42, 57, 61};
	int where = binarySearchRec (a, 99, 0, 7);
	cout << where << " " << calls << endl;
	return 0;
}
```
- [ ] `-1 8`
- [ ] `-1 3`
- [ ] `-1 4`
- [x] `-1 5`
>> 99 is bigger than everything, so every call goes right. The calls on indexes 0–7 (mid 3), 4–7 (mid 5), 6–7 (mid 6) and 7–7 (mid 7) each compare and move right. The fifth call has lo = 8 and hi = 7, an empty range, so it returns −1. Five calls instead of checking all 8 elements; for 1,000 elements it would be about 11.
:::

:::quiz
reverseRec is called as `reverseRec (a, 0, 4)` on an array of 5 elements. How many swaps does it make?
- [ ] 5
- [ ] 4
- [ ] 3
- [x] 2
>> It swaps a[0] with a[4], then a[1] with a[3]. The next call has lo = 2 and hi = 2: one element left, which is already in place, so it stops.
:::
