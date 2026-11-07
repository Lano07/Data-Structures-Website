---
title: Merge sort
summary: Merge sort divides and conquers. It sorts the first half, sorts the second half, then merges the two sorted halves into one. Splitting in half again and again gives log n levels, and each level does n steps of merging, so it is O(n log n) in every case.
lectures: Lectures 20–21
goals:
  - Merge two sorted parts of an array with mergeArray (A, p, q, r)
  - Write the lecture's recursive mergeSort (A, start, end)
  - Trace the lecture's example 38 27 43 3 9 82 10 call by call
  - Explain why merge sort is O(n log n) in every case, and what it costs in memory
labs: [sort, recursion]
---

## Divide and conquer

The lecture describes merge sort in three lines:

```text
Mergesort (A, lengthA) {
	sort the first half of A
	sort the second half of A
	merge the sorted halves
}
```

How are the halves sorted? With merge sort itself: this is recursion (Part D). Each half is split in half again, and again, until a part has only one value. A single value is already sorted, so that is the base case.

## Merging two sorted halves

Lecture 20's example: after sorting each half of a 10-value array separately, the array is

| 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 28 | 34 | 38 | 56 | 71 | 10 | 18 | 22 | 75 | 91 |

From the lecture: `mergeArray (int A[], int p, int q, int r)` accepts a single array A. The values from location **p to q** are in sorted order, and the values from **q + 1 to r** are also in sorted order, but the values from p to r are not. Here p = 0, q = 4 and r = 9.

To merge, copy the two halves out into L and R, then repeatedly take the **smaller of the two front values** and write it back into A:

| L (front first) | R (front first) | Compare | Write to A |
|---|---|---|---|
| 28 34 38 56 71 | 10 18 22 75 91 | 28 vs 10 | 10 |
| 28 34 38 56 71 | 18 22 75 91 | 28 vs 18 | 18 |
| 28 34 38 56 71 | 22 75 91 | 28 vs 22 | 22 |
| 28 34 38 56 71 | 75 91 | 28 vs 75 | 28 |
| 34 38 56 71 | 75 91 | 34 vs 75 | 34 |
| 38 56 71 | 75 91 | 38 vs 75 | 38 |
| 56 71 | 75 91 | 56 vs 75 | 56 |
| 71 | 75 91 | 71 vs 75 | 71 |
| (empty) | 75 91 | L is used up | 75, then 91 |

Result: 10 18 22 28 34 38 56 71 75 91. Every comparison writes one value, so merging n values takes at most n − 1 comparisons: **O(n)**.

```cpp norun
void mergeArray (int A[], int p, int q, int r) {
	int n1 = q - p + 1;                 // size of A[p..q]
	int n2 = r - q;                     // size of A[q+1..r]
	int * L = new int[n1];
	int * R = new int[n2];
	for (int i = 0; i < n1; i++)
		L[i] = A[p + i];
	for (int j = 0; j < n2; j++)
		R[j] = A[q + 1 + j];
	int i = 0, j = 0, k = p;
	while (i < n1 && j < n2) {          // both halves still have values
		if (L[i] <= R[j]) {
			A[k] = L[i];
			i++;
		}
		else {
			A[k] = R[j];
			j++;
		}
		k++;
	}
	while (i < n1) {                    // copy whatever is left in L
		A[k] = L[i];
		i++;
		k++;
	}
	while (j < n2) {                    // or in R (only one of these loops runs)
		A[k] = R[j];
		j++;
		k++;
	}
	delete [] L;
	delete [] R;
}
```

The two `while` loops at the end are needed because one half always runs out first; the other half's remaining values are already in order and larger than everything written so far.

## The recursive function

The lecture's mergeSort sorts the part of A from `start` to `end`:

```cpp norun
void mergeSort (int A[], int start, int end) {
	int mid;
	if (start < end) {
		mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid+1, end);
		mergeArray (A, start, mid, end);
	}
}
```

- **Base case**: `start < end` is false when the part has one value (start == end). It is already sorted, so the call does nothing. The lecture's trace says the call "terminates!"
- **Recursive case**: split at `mid`, sort each half, merge. (The lecture calls the merge step `merge (A, start, mid, end)`; it is the mergeArray above.)

## The lecture's example: 38 27 43 3 9 82 10

| Call | mid | What happens | Part afterwards |
|---|---|---|---|
| mergeSort (A, 0, 6) | 3 | sort 0–3, sort 4–6, then merge (A, 0, 3, 6) | |
| mergeSort (A, 0, 3) | 1 | sort 0–1, sort 2–3, then merge (A, 0, 1, 3) | |
| mergeSort (A, 0, 1) | 0 | calls on (0, 0) and (1, 1) terminate; merge (A, 0, 0, 1) | 27 38 |
| mergeSort (A, 2, 3) | 2 | calls on (2, 2) and (3, 3) terminate; merge (A, 2, 2, 3) | 3 43 |
| back in (0, 3) | | merge (A, 0, 1, 3) | 3 27 38 43 |
| mergeSort (A, 4, 6) | 5 | sort 4–5, sort 6–6, then merge (A, 4, 5, 6) | |
| mergeSort (A, 4, 5) | 4 | calls on (4, 4) and (5, 5) terminate; merge (A, 4, 4, 5) | 9 82 |
| back in (4, 6) | | (6, 6) terminates; merge (A, 4, 5, 6) | 9 10 82 |
| back in (0, 6) | | merge (A, 0, 3, 6) | 3 9 10 27 38 43 82 |

Notice the order: the whole **left** half is completely sorted before the right half is even split. That is the order the recursive calls run in.

```cpp example="Merge sort, showing every merge"
#include <iostream>
using namespace std;

void show (int A[], int from, int to) {
	for (int i = from; i <= to; i++)
		cout << A[i] << " ";
}

void mergeArray (int A[], int p, int q, int r) {
	int n1 = q - p + 1;
	int n2 = r - q;
	int * L = new int[n1];
	int * R = new int[n2];
	for (int i = 0; i < n1; i++)
		L[i] = A[p + i];
	for (int j = 0; j < n2; j++)
		R[j] = A[q + 1 + j];
	int i = 0, j = 0, k = p;
	while (i < n1 && j < n2) {
		if (L[i] <= R[j]) {
			A[k] = L[i];
			i++;
		}
		else {
			A[k] = R[j];
			j++;
		}
		k++;
	}
	while (i < n1) {
		A[k] = L[i];
		i++;
		k++;
	}
	while (j < n2) {
		A[k] = R[j];
		j++;
		k++;
	}
	delete [] L;
	delete [] R;
}

void mergeSort (int A[], int start, int end) {
	int mid;
	if (start < end) {
		mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid+1, end);
		mergeArray (A, start, mid, end);
		cout << "merge (A, " << start << ", " << mid << ", " << end << "): ";
		show (A, start, end);
		cout << endl;
	}
}

int main() {
	int A[] = {38, 27, 43, 3, 9, 82, 10};
	mergeSort (A, 0, 6);
	show (A, 0, 6);
	cout << endl;
	return 0;
}
```

Press **Step through** and open the **Call tree** tab: it is the lecture's split-and-merge picture. Each box is one call on one part of the array, and each call's two children are its two halves.

## Why O(n log n), in every case

Look at the call tree level by level:

- Each level splits every part in half, so after about **log₂ n** levels the parts have one value each. (7 values: 7 → 4 and 3 → 2, 2, 2 and 1 → single values, 3 levels.)
- On each level, the merges together handle every value once: **n** steps per level.

Total: n steps on each of log₂ n levels, **O(n log n)**. Merge sort always splits in the middle, whatever the values are, so this is the best, average and worst case alike.

The price is memory: mergeArray copies values into the extra arrays L and R, so merge sort needs extra space proportional to n. Selection, bubble, insertion, heap and quick sort all sort **in place**, inside the original array.

:::parsons Put the lines of mergeSort in order.
void mergeSort (int A[], int start, int end) {
	int mid;
	if (start < end) {
		mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid+1, end);
		mergeArray (A, start, mid, end);
	}
}
~		mergeSort (A, mid, end);
:::


:::remember
- Merge sort: sort the left half, sort the right half, merge.
- Base case: a part with one value (start == end).
- mergeArray (A, p, q, r): A[p..q] and A[q+1..r] are each sorted; repeatedly take the smaller front value.
- O(n log n) in every case, but needs extra memory for merging.
:::

:::teachback
Explain how merge sort sorts an array, and why it is O(n log n) whatever the input.
>> Split the range in half, sort each half recursively, then merge the two sorted halves.
>> Merging repeatedly takes the smaller of the two front values, so merging n values is O(n).
>> Halving the range again and again gives about log2 n levels of calls.
>> Each level merges n values in total, so the work is about n log n in every case (and it needs extra arrays).
:::

:::quiz
mergeArray is called with p = 0, q = 2, r = 5 on the array 4 9 12 | 1 10 15. How many values have been written back into A when the left part (4 9 12) is used up?
- [ ] 3
- [ ] 4
- [x] 5
- [ ] 6
>> 1 (from R), 4, 9 (from L), 10 (from R), 12 (from L): five writes, and L is now empty. The last value, 15, is copied by the final loop.
:::

:::quiz
In the lecture's example, which merge happens **third**?
- [ ] merge (A, 4, 4, 5)
- [x] merge (A, 0, 1, 3)
- [ ] merge (A, 0, 3, 6)
- [ ] merge (A, 2, 2, 3)
>> The order is merge (A, 0, 0, 1), then merge (A, 2, 2, 3), then merge (A, 0, 1, 3). The left half is finished before the right half is touched.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int calls = 0;

void mergeSort (int A[], int start, int end) {
	calls++;
	if (start < end) {
		int mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid + 1, end);
	}
}

int main() {
	int A[8] = {0};
	mergeSort (A, 0, 7);
	cout << calls << endl;
	return 0;
}
```
- [ ] `8`
- [x] `15`
- [ ] `16`
- [ ] `7`
>> There is one call for each part: 1 part of 8, 2 of 4, 4 of 2 and 8 of 1. 1 + 2 + 4 + 8 = 15. (The merging is left out here; only the calls are counted.)
:::

:::quiz
Why is merge sort O(n log n) even on its worst input?
- [ ] Because it never compares two values twice
- [x] It always splits exactly in the middle, so there are about log n levels, and each level merges n values
- [ ] Because merging is O(1)
- [ ] Because it sorts in place
>> The split point does not depend on the values, so every input gives the same log₂ n levels of calls, and every level does about n steps of merging.
:::
