---
title: Integer sorting in O(n) (counting sort and radix sort)
summary: Every sort in Lectures 19–21 works by comparing values, and no comparison sort can beat about n log₂ n comparisons. When the keys are small integers, counting sort uses them as array indexes instead and sorts in O(n + k); radix sort applies it one digit at a time.
lectures: Course outline topic 1.3 (not yet in the notes); builds on Lectures 19–21
outline: true
goals:
  - Explain why comparison sorts need about n log₂ n comparisons, and how integer sorts avoid comparing
  - Trace and write counting sort, and say why its last loop runs from right to left (stability)
  - Trace and write LSD radix sort, using counting sort on one digit per pass
  - State the costs, O(n + k) and O(d(n + 10)), and when integer sorts are the right choice
labs: [isort, sort]
---

## The limit on comparing

Selection, bubble, insertion, heap, merge and quick sort (Lecture 21) all decide the order by **comparing** two values at a time. There are n! possible orders of n distinct values, and each comparison has two outcomes, so at best it halves the number of orders still possible. To narrow n! orders down to one takes at least log₂(n!) comparisons, which is about **n log₂ n**. That is why merge sort and heap sort, at O(n log n), are as good as comparison sorts can be.

The course outline also asks for **integer sorting algorithms that run in O(n)** on average. They escape the limit by never comparing two keys: they use each key **as an array index**.

## Counting sort

Suppose every key is an integer from 0 to k. Counting sort makes three passes:

1. **Count**: `C[v]` = how many times v appears.
2. **Add up**: replace each count by a running total, so `C[v]` = how many keys are ≤ v. Now `C[v]` is one past the last position where a v belongs.
3. **Place**: walk A from **right to left**; each key v goes to position `C[v] − 1` of the output, and `C[v]` drops by one.

```cpp example="Counting sort"
#include <iostream>
using namespace std;

// sorts A[0..n-1], whose keys are all between 0 and k, into B[0..n-1]
void countingSort (int A[], int B[], int n, int k) {
	int * C = new int[k + 1];
	for (int v = 0; v <= k; v++)
		C[v] = 0;
	for (int i = 0; i < n; i++)
		C[A[i]]++;                                // C[v] = how many times v appears
	for (int v = 1; v <= k; v++)
		C[v] = C[v] + C[v - 1];                   // C[v] = how many keys are <= v
	for (int i = n - 1; i >= 0; i--) {           // right to left keeps equal keys in order
		C[A[i]]--;
		B[C[A[i]]] = A[i];
	}
	delete [] C;
}

int main () {
	int A[] = {2, 5, 3, 0, 2, 3, 0, 3};
	int B[8];
	countingSort (A, B, 8, 5);
	for (int i = 0; i < 8; i++)
		cout << B[i] << " ";
	cout << endl;
	return 0;
}
```

:::trace
A = 2 5 3 0 2 3 0 3, keys 0 to 5. After counting: C = 2 0 2 3 0 1 (two 0s, no 1s, two 2s, three 3s, no 4s, one 5). After adding up: C = 2 2 4 7 7 8. Placing from the right: the last 3 goes to position C[3] − 1 = 6, the 0 before it to position 1, then a 3 to position 5, a 2 to 3, a 0 to 0, a 3 to 4, the 5 to 7 and the first 2 to 2. B = 0 0 2 2 3 3 3 5.
:::

**Cost.** Two loops over the n keys and two over the k + 1 counts: **O(n + k)** time and O(n + k) extra space. When k is about the same size as n (or smaller), that is **O(n)**. When k is huge, it is a bad idea: sorting 100 phone numbers with k = 9,999,999 means a ten-million-cell count array.

**Stability.** A sort is **stable** when equal keys keep their original order. The right-to-left placing loop is what makes counting sort stable: the last 3 in A is placed in the last free 3-slot. Stability does not matter for plain ints, but it is exactly what radix sort relies on.

:::quiz
You must sort 1,000 exam marks, each a whole number from 0 to 100. Which is the best choice?
- [x] Counting sort: O(n + k) with k = 100
- [ ] Counting sort is impossible because some marks repeat
- [ ] Quick sort, because it is O(n log n) in every case
- [ ] Selection sort, because the keys are small
>> The keys are integers in a small range (k = 100), so counting sort takes about 1,000 + 101 steps. Repeats are no problem: that is what the counts are for. Quick sort is O(n²) in its worst case (Lecture 21).
:::

## Radix sort: one digit at a time

When the keys are bigger, say up to 999, sort them **one decimal digit at a time**, starting with the **least significant** digit (the ones), then the tens, then the hundreds. Each pass is a counting sort with k = 9 that looks only at that digit. Because each pass is **stable**, the order from the earlier passes survives among keys with the same digit, so after the last pass the array is fully sorted.

This uses the array from the merge sort example in Lecture 20:

```cpp example="LSD radix sort, pass by pass"
#include <iostream>
using namespace std;

void show (int A[], int n) {
	for (int i = 0; i < n; i++)
		cout << A[i] << " ";
	cout << endl;
}

// one stable counting sort on the digit (A[i] / exp) % 10
void countByDigit (int A[], int n, int exp) {
	int * B = new int[n];
	int C[10];
	for (int d = 0; d < 10; d++)
		C[d] = 0;
	for (int i = 0; i < n; i++)
		C[(A[i] / exp) % 10]++;
	for (int d = 1; d < 10; d++)
		C[d] = C[d] + C[d - 1];
	for (int i = n - 1; i >= 0; i--) {
		int d = (A[i] / exp) % 10;
		C[d]--;
		B[C[d]] = A[i];
	}
	for (int i = 0; i < n; i++)
		A[i] = B[i];
	delete [] B;
}

void radixSort (int A[], int n) {
	int biggest = A[0];
	for (int i = 1; i < n; i++)
		if (A[i] > biggest)
			biggest = A[i];
	for (int exp = 1; biggest / exp > 0; exp = exp * 10) {
		countByDigit (A, n, exp);
		cout << "sorted by the " << (exp == 1 ? "ones" : exp == 10 ? "tens" : "hundreds") << " digit: ";
		show (A, n);
	}
}

int main () {
	int A[] = {56, 34, 38, 71, 28, 10, 91, 18, 22, 75};
	int B[] = {329, 457, 657, 839, 436, 720, 355};
	radixSort (A, 10);
	cout << endl;
	radixSort (B, 7);
	return 0;
}
```

Look at the first array after the ones pass: 71 and 91 both end in 1, and 71 stays in front of 91 because it was in front before. After the tens pass, the keys are in order.

**Cost.** With d digits and base 10, radix sort makes d passes of O(n + 10): **O(d(n + 10))**. For keys of a fixed width, d is a constant, so this is **O(n)**. Sorting a million 6-digit student IDs takes 6 passes.

:::quiz
LSD radix sort (base 10) sorts 500 keys, the largest of which is 7,402. How many counting-sort passes does it make?
- [ ] 2
- [x] 4
- [ ] 10
- [ ] 500
>> One pass per decimal digit of the largest key: 7,402 has four digits (ones, tens, hundreds, thousands), so the loop runs with exp = 1, 10, 100 and 1000.
:::

## Bucket sort, in one paragraph

If the keys are spread **evenly** over a range (say real numbers in [0, 1)), divide the range into n equal **buckets**, drop each key into its bucket (a linked list, as in chaining from Lecture 15), sort each small bucket with insertion sort, and join the buckets. Each bucket holds about one key on average, so the **average** time is O(n). If the keys bunch up in one bucket, it degrades to insertion sort's O(n²).

## Which sort, when?

| Situation | Good choice | Cost |
|---|---|---|
| Any keys you can compare | Merge sort or heap sort | O(n log n) worst case |
| Integers in a small range 0..k | Counting sort | O(n + k) |
| Fixed-width integers (IDs, dates) | Radix sort | O(d(n + 10)) |
| Real numbers spread evenly | Bucket sort | O(n) on average |

:::predict What does this print? (It is one pass of radix sort on the ones digit.)
```cpp
#include <iostream>
using namespace std;

int main () {
	int A[] = {43, 21, 33, 50, 11};
	int B[5];
	int C[10];
	for (int d = 0; d < 10; d++)
		C[d] = 0;
	for (int i = 0; i < 5; i++)
		C[A[i] % 10]++;
	for (int d = 1; d < 10; d++)
		C[d] = C[d] + C[d - 1];
	for (int i = 4; i >= 0; i--) {
		C[A[i] % 10]--;
		B[C[A[i] % 10]] = A[i];
	}
	for (int i = 0; i < 5; i++)
		cout << B[i] << " ";
	cout << endl;
	return 0;
}
```
:::

:::parsons Put the four loops of countingSort in order.
	for (int v = 0; v <= k; v++)
		C[v] = 0;
	for (int i = 0; i < n; i++)
		C[A[i]]++;
	for (int v = 1; v <= k; v++)
		C[v] = C[v] + C[v - 1];
	for (int i = n - 1; i >= 0; i--) {
		C[A[i]]--;
		B[C[A[i]]] = A[i];
	}
~	for (int i = 0; i < n; i++) {
:::

:::teachback
Explain why radix sort must sort by the least significant digit first, and why each pass must be stable.
>> Each pass orders the keys by one digit; the last pass, on the most significant digit, decides the final order.
>> Keys with the same digit in a later pass must keep the order the earlier passes gave them, so each pass must be stable.
>> Going from the least significant digit up means that, after the last pass, keys are ordered by their highest digit first, then by the next one down, and so on: fully sorted.
:::

:::remember
- Comparison sorts need about n log₂ n comparisons; integer sorts use keys as indexes instead.
- Counting sort: count, add up, place from the right. O(n + k); stable.
- Radix sort (LSD): a stable counting sort per digit, ones first. O(d(n + 10)).
- Bucket sort: O(n) on average for evenly spread keys.
:::
