---
title: "Deep dive: sorting algorithms, invariants and exact costs"
summary: This deep dive explains why each of Lecture 21's six sorts is correct (its loop invariant), counts exactly how many comparisons the simple sorts make, derives merge sort's n log n from its recursion tree, explains quick sort's partition invariant and its O(n²) trap, and compares stability and memory so you can justify which sort to use.
lectures: Lectures 19–21 (deep dive)
goals:
  - State and use the loop invariant of selection, insertion and bubble sort
  - Count the comparisons each simple sort makes in the best and worst cases
  - Derive O(n log n) for merge sort from its recurrence and recursion tree
  - Explain partition's invariant, why quick sort is O(n²) on sorted input, and why its average is O(n log n)
  - Compare all six sorts on time, extra memory and stability, and explain the n log n lower bound
labs: [sort, heap]
---

## Correct because of an invariant

Each simple sort keeps one promise about the part of the array it has finished. That promise is its loop invariant, and it explains both why the sort works and what an exam's "array after pass k" looks like.

:::invariant Selection sort
After pass i (counting from 1), A[0..i−1] holds the i **smallest** values, in sorted order, in their **final** places.
:::

:::invariant Insertion sort
After pass i, A[0..i] holds the values that were **originally** in A[0..i], in sorted order. They are not necessarily in their final places, since later values may still be inserted among them.
:::

:::invariant Bubble sort
After pass p, the p **largest** values are at the end of the array, in sorted order, in their final places.
:::

:::trap Same array, three different "after pass 1"
On 40 46 22 57 31 2 54, after one pass: **selection** swaps the smallest, 2, to the front: 2 46 22 57 31 40 54. **Insertion** sorts the first two values: 40 46 22 57 31 2 54 (no change). **Bubble** carries the largest, 57, to the end: 40 22 46 31 2 54 57. Read the invariant before you answer.
:::

## Counting comparisons exactly

:::theorem Selection sort always makes n(n − 1)/2 comparisons
Pass i scans the n − i unsorted values to find the smallest. In total (n − 1) + (n − 2) + … + 1 = n(n − 1)/2, whatever the input: it is Θ(n²) even on a sorted array.
:::

:::theorem Insertion sort makes between n − 1 and n(n − 1)/2 comparisons
On an already sorted array, each new key is compared once and stays where it is: n − 1 comparisons, **O(n)**. On a reversed array, key i is compared with all i values before it: 1 + 2 + … + (n − 1) = n(n − 1)/2, **O(n²)**. On random input, about n²/4.
:::

Bubble sort as written in Lecture 19 also makes n(n − 1)/2 comparisons. With an early stop (quit when a pass makes no swap), it is O(n) on sorted input. That is why insertion sort is the right choice for an array that is almost sorted.

```cpp example="Counting insertion sort's comparisons"
#include <iostream>
using namespace std;

int insertionSort (int A[], int n) {
	int comparisons = 0;
	for (int i = 1; i < n; i++) {
		int key = A[i];
		int j = i - 1;
		while (j >= 0) {
			comparisons++;
			if (A[j] <= key)
				break;
			A[j + 1] = A[j];
			j = j - 1;
		}
		A[j + 1] = key;
	}
	return comparisons;
}

int main () {
	int sorted[] = {1, 2, 3, 4, 5, 6, 7, 8};
	int reversed[] = {8, 7, 6, 5, 4, 3, 2, 1};
	int mixed[] = {56, 34, 38, 71, 28, 10, 91, 18};
	cout << "sorted:   " << insertionSort (sorted, 8) << " comparisons (n - 1 = 7)" << endl;
	cout << "reversed: " << insertionSort (reversed, 8) << " comparisons (n(n - 1)/2 = 28)" << endl;
	cout << "mixed:    " << insertionSort (mixed, 8) << " comparisons" << endl;
	return 0;
}
```

## Merge sort: where n log n comes from

Lectures 20–21: `mergeSort (A, start, end)` sorts both halves recursively, then `merge`s them. Merging two sorted runs with n values in total takes at most n − 1 comparisons, because each comparison places one value.

:::theorem Merge sort is O(n log n) in every case
T(n) = 2T(n/2) + c·n. Draw the recursion tree: the top level merges n values; the next level has two merges of n/2 values each (n in total); then four merges of n/4. Every level costs c·n, and the size halves until it reaches 1, so there are log₂ n levels. In total, c·n·log₂ n.
:::

Merge sort is **stable** if `merge` takes from the **left** half on a tie (`L[i] <= R[j]`), so equal keys keep their order. It needs **O(n) extra memory** for the copies L and R, so it is not in place. Lecture 20's trace of 38 27 43 3 9 82 10 shows the recursion: `mid = (start + end) / 2` splits 0..6 into 0..3 and 4..6.

## Quick sort: partition's invariant

Lecture 21's `partition (A, p, r)` uses the last value as the pivot, x = A[r], and walks j from p to r − 1 with a boundary i.

:::invariant Partition invariant
At the start of each pass, A[p..i] holds values ≤ x, A[i+1..j−1] holds values > x, A[j..r−1] has not been examined yet, and A[r] = x.
:::

When A[j] ≤ x, it joins the small region: i goes up by one and A[i] swaps with A[j]. When A[j] > x, the large region just grows by one (j moves on). At the end, swapping A[i+1] with A[r] puts the pivot between the two regions, at its **final** sorted position q = i + 1.

:::example Lecture 21's Example #2: 25 90 30 5 60 70 45
x = 45 and i = −1. j = 0: 25 ≤ 45 → i = 0 (it swaps with itself). j = 1: 90 > 45, no change. j = 2: 30 ≤ 45 → i = 1, swap → 25 30 90 5 60 70 45. j = 3: 5 ≤ 45 → i = 2, swap → 25 30 5 90 60 70 45. j = 4 and 5: 60 and 70 > 45, no change. Finally, swap A[3] with A[6] → **25 30 5 45 60 70 90**, and partition returns 3.
:::

:::theorem Quick sort's best, worst and average cases
- **Best case:** every pivot lands in the middle. T(n) = 2T(n/2) + c·n = O(n log n).
- **Worst case:** every pivot is the smallest or largest value. T(n) = T(n − 1) + c·n = O(n²) (Lecture 21).
- **Average case:** over random orders, O(n log n). Most splits are reasonably balanced; even a 9-to-1 split every time still gives O(n log n), just with a bigger constant.
:::

:::trap Sorted input is quick sort's worst case
With the pivot A[r], an array that is **already sorted** makes every partition put all the other values on one side, so it is O(n²). So does an array of **all equal values** with Lecture 21's partition (A[j] ≤ x is always true). Choosing the pivot at random, or as the median of three values, avoids the sorted-input disaster.
:::

Quick sort sorts **in place**: it needs only the recursion stack, O(log n) on average and O(n) in the worst case. It is **not stable**, because the swaps jump values over each other.

## All six sorts side by side

| Sort | Best | Average | Worst | Extra memory | Stable? |
|---|---|---|---|---|---|
| Selection | n² | n² | n² | O(1) | No: a swap can jump an equal key |
| Bubble | n²; n with early stop | n² | n² | O(1) | Yes |
| Insertion | n | n² | n² | O(1) | Yes |
| Merge | n log n | n log n | n log n | O(n) | Yes |
| Quick | n log n | n log n | n² | O(log n) stack | No |
| Heap | n log n | n log n | n log n | O(1) | No |

(All are O(…); Lecture 21's worst-case list is the "Worst" column.)

## Why nothing beats n log n by comparing

:::theorem The comparison lower bound
Any sort that only compares values needs at least log₂(n!) comparisons in the worst case, which is about n log₂ n − 1.44 n: Ω(n log n).
:::

:::proof
Think of the sort as a decision tree: each comparison has two outcomes, and each leaf is one possible ordering of the input. All n! orderings must be different leaves, and a binary tree of height h has at most 2^h leaves, so 2^h ≥ n!, that is h ≥ log₂(n!).
:::

So merge sort and heap sort are optimal among comparison sorts. Counting and radix sort (Part N) beat n log n only because they never compare two keys.

:::quiz
How many comparisons does selection sort make on an array of 10 values that is already sorted?
- [ ] 9
- [ ] 10
- [x] 45
- [ ] 100
>> Selection sort always scans the whole unsorted part: 9 + 8 + … + 1 = 10 × 9 / 2 = 45, sorted input or not. Insertion sort would make only 9.
:::

:::quiz
Which sort is O(n log n) in the worst case, sorts in place with O(1) extra memory, but is not stable?
- [ ] Merge sort
- [ ] Quick sort
- [x] Heap sort
- [ ] Insertion sort
>> Merge sort needs O(n) extra memory; quick sort is O(n²) in the worst case; insertion sort is O(n²). Heap sort is O(n log n) always, in place, and not stable.
:::

:::predict What does this print? (One call to Lecture 21's partition.)
```cpp
#include <iostream>
using namespace std;

int partition (int A[], int p, int r) {
	int x = A[r];
	int i = p - 1;
	for (int j = p; j <= r - 1; j++) {
		if (A[j] <= x) {
			i = i + 1;
			int temp = A[i];
			A[i] = A[j];
			A[j] = temp;
		}
	}
	int temp = A[i + 1];
	A[i + 1] = A[r];
	A[r] = temp;
	return i + 1;
}

int main () {
	int A[] = {30, 65, 10, 75, 55, 90, 60};
	int q = partition (A, 0, 6);
	for (int k = 0; k < 7; k++)
		cout << A[k] << " ";
	cout << endl << "q = " << q << endl;
	return 0;
}
```
:::

:::teachback
Explain why quick sort with the last value as pivot takes O(n²) on an already sorted array, and how to avoid it.
>> On sorted input the pivot A[r] is the largest value, so partition puts every other value on its left and nothing on its right.
>> Each call removes only the pivot: sizes n, n − 1, n − 2, …, and partition costs about n each time, so the total is n + (n − 1) + … + 1 = O(n²).
>> A random pivot (or the median of three values) makes such bad splits very unlikely, giving O(n log n) on average.
:::

:::remember
- Invariants: selection (the i smallest are final), insertion (the first i + 1 are sorted, not final), bubble (the p largest are final at the end).
- Comparisons: selection n(n − 1)/2 always; insertion n − 1 to n(n − 1)/2.
- Merge sort: T(n) = 2T(n/2) + cn → n log₂ n; stable; O(n) extra memory.
- Partition: A[p..i] ≤ x < A[i+1..j−1]; pivot lands at its final index i + 1. Sorted input → O(n²).
- Comparison sorts need Ω(n log n) (decision tree with n! leaves).
:::
