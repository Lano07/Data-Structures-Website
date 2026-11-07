---
title: Sequential and binary search
summary: Sequential search checks the values one by one, O(n), and works on any array. In a sorted array, binary search compares the key with the middle value and throws away the half that cannot contain it. Each step halves what is left, so it needs about log₂ n comparisons instead of n.
lectures: Course outline topic 2 (not yet in the notes)
outline: true
goals:
  - Write sequential search and say what it costs in the best, average and worst cases
  - Write iterative and recursive binary search on a sorted array
  - State the loop invariant and use it to explain why binary search is correct
  - Show that binary search takes O(log n) steps, and avoid the classic off-by-one mistakes
labs: [sort]
---

## Sequential search

The simplest search checks the values **one by one** until it finds the key or runs out of values. It works on **any** array, sorted or not, and on a linked list it is exactly `contains` from Lecture 3.

```cpp example="Sequential search"
#include <iostream>
using namespace std;

// returns the index of key in A[0..n-1], or -1 if it is not there
int sequentialSearch (int A[], int n, int key) {
	for (int i = 0; i < n; i++)
		if (A[i] == key)
			return i;
	return -1;
}

int main () {
	int A[] = {52, 33, 84, 43, 16, 59, 31};
	cout << sequentialSearch (A, 7, 16) << " " << sequentialSearch (A, 7, 52) << " " << sequentialSearch (A, 7, 99) << endl;
	return 0;
}
```

**Cost.** Best case: the key is first, 1 comparison. Worst case: the key is last or missing, n comparisons. On average, when the key is there, about n/2 comparisons (the same analysis as searching a linked list in Lecture 11). All of that is **O(n)**.

If the array is **sorted**, you can do much better.

## The idea

Sequential search learns very little from each comparison: only whether that one value is the key. If the array is **sorted**, one comparison tells you much more. Compare the key with the middle value:

- equal: found;
- key smaller: it can only be in the left half;
- key larger: it can only be in the right half.

Each comparison throws away half of what is left. This is the same idea as searching a well-shaped BST, but in an array.

## The code

```cpp example="Binary search, iterative and recursive"
#include <iostream>
using namespace std;

// returns the index of key in A[0..n-1] (sorted ascending), or -1
int binarySearch (int A[], int n, int key) {
	int lo = 0, hi = n - 1;
	while (lo <= hi) {                    // the part still to search is A[lo..hi]
		int mid = (lo + hi) / 2;
		if (A[mid] == key)
			return mid;
		if (key < A[mid])
			hi = mid - 1;                 // only the left half can hold key
		else
			lo = mid + 1;                 // only the right half can hold key
	}
	return -1;                            // A[lo..hi] is empty: key is not there
}

int binarySearchRec (int A[], int lo, int hi, int key) {
	if (lo > hi)                          // base case: nothing left to search
		return -1;
	int mid = (lo + hi) / 2;
	if (A[mid] == key)
		return mid;
	if (key < A[mid])
		return binarySearchRec (A, lo, mid - 1, key);
	return binarySearchRec (A, mid + 1, hi, key);
}

int main () {
	int A[] = {3, 8, 15, 21, 30, 42, 57, 66, 71};
	int n = 9;
	cout << binarySearch (A, n, 57) << " " << binarySearch (A, n, 3) << " " << binarySearch (A, n, 20) << endl;
	cout << binarySearchRec (A, 0, n - 1, 71) << " " << binarySearchRec (A, 0, n - 1, 1) << endl;
	return 0;
}
```

:::trace
Search for 57 in 3 8 15 21 30 42 57 66 71 (indexes 0 to 8). lo = 0, hi = 8, mid = 4: A[4] = 30 < 57, so lo = 5. lo = 5, hi = 8, mid = 6: A[6] = 57. Found at index 6 after 2 comparisons. A linear search would have needed 7.
:::

## Why it is correct

**Loop invariant:** *if key is anywhere in the array, it is in A[lo..hi].*

- **Initialisation:** lo = 0 and hi = n − 1 cover the whole array.
- **Maintenance:** if key < A[mid], then, because the array is sorted, key is smaller than everything from A[mid] onwards, so it can only be in A[lo..mid−1]; setting hi = mid − 1 keeps the invariant. The other side is the mirror image.
- **Termination:** each pass either returns or makes A[lo..hi] smaller, so the loop ends. If it ends because lo > hi, the range is empty, and by the invariant key is not in the array, so returning −1 is right.

## Why it is O(log n)

After one comparison at most n/2 values are left, after two n/4, after k comparisons n/2^k. The search must stop by the time n/2^k < 1, that is after about log₂ n + 1 comparisons. For a million values that is about 20 comparisons, instead of up to a million for a linear search.

| n | Linear search, worst case | Binary search, worst case |
|---|---|---|
| 8 | 8 | 4 |
| 1,000 | 1,000 | 10 |
| 1,000,000 | 1,000,000 | 20 |

The price is that the array must be sorted first, which costs O(n log n) (see [Sorting performance](#l-k4-sorting-performance)). Sorting once pays off when you search many times.

:::quiz
How many comparisons with A[mid] does binary search make, at most, on a sorted array of 31 values?
- [ ] 31
- [ ] 16
- [x] 5
- [ ] 15
>> Each comparison leaves at most half (rounded down) of the remaining values: 31 → 15 → 7 → 3 → 1 → 0. The fifth comparison is the last one that can find the key, so at most 5.
:::

:::predict Which indexes does the search look at?
```cpp
#include <iostream>
using namespace std;

int main () {
	int A[] = {2, 5, 9, 14, 20, 27, 33, 40};
	int key = 33, lo = 0, hi = 7;
	while (lo <= hi) {
		int mid = (lo + hi) / 2;
		cout << mid << " ";
		if (A[mid] == key) break;
		if (key < A[mid]) hi = mid - 1;
		else lo = mid + 1;
	}
	cout << endl;
	return 0;
}
```
:::

## Common mistakes

- **Searching an unsorted array.** Binary search is only correct when the array is sorted; on unsorted data it can miss keys that are there.
- **`while (lo < hi)`** instead of `lo <= hi`: when one value is left (lo == hi) it is never checked.
- **`hi = mid` or `lo = mid`** instead of mid − 1 or mid + 1: when lo and hi are next to each other, mid can equal lo and the loop never ends.
- **Forgetting that the recursive version must return** the recursive call's result.

:::parsons Put the lines of the iterative binary search in order.
int binarySearch (int A[], int n, int key) {
	int lo = 0, hi = n - 1;
	while (lo <= hi) {
		int mid = (lo + hi) / 2;
		if (A[mid] == key)
			return mid;
		if (key < A[mid])
			hi = mid - 1;
		else
			lo = mid + 1;
	}
	return -1;
}
~	while (lo < hi) {
:::

:::teachback
Explain why binary search needs a sorted array, and why it takes about log₂ n comparisons.
>> Comparing with the middle value tells us which half could hold the key only because the array is sorted: everything left of mid is smaller and everything right of it is larger.
>> Each comparison discards half of the remaining values.
>> After k comparisons about n/2^k values are left, so it stops after about log₂ n comparisons.
:::

:::remember
- Sequential search: any array, one by one, O(n) (about n/2 comparisons on average).
- Binary search: sorted array only. Compare with A[mid]; keep A[lo..hi] as the part that could hold the key.
- while (lo <= hi); hi = mid − 1 or lo = mid + 1; return −1 when the range is empty.
- About log₂ n comparisons: 20 for a million values.
:::
