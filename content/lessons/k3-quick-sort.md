---
title: Quick sort
summary: Quick sort also divides and conquers, but does its work before the recursive calls. partition picks a pivot (the last value) and rearranges the array so that smaller values are on its left and larger ones on its right. Then each side is sorted recursively. O(n log n) on average, but O(n²) in the worst case.
lectures: Lectures 20–21
goals:
  - State what partition (A, p, r) achieves and what it returns
  - Trace partition with i and j exactly as in the lecture's examples
  - Write quickSort and partition in C++
  - Explain the average case O(n log n) and the worst case O(n²)
labs: [sort, recursion]
---

## The idea

From the lecture: suppose the portion of the array A between p and r needs to be sorted. Find an index **q** and reorganise the elements so that:

- all elements to the **left** of q are smaller than A[q],
- all elements to the **right** of q are greater than A[q].

This is achieved by a **partition** algorithm. For the lecture's array:

| | p | | | | | | r |
|---|---|---|---|---|---|---|---|
| before | 30 | 65 | 10 | 75 | 55 | 90 | 60 |
| after partition | 30 | 10 | 55 | **60** | 65 | 90 | 75 |

After partitioning, 60 is in its **final** position (q = 3): everything smaller is on its left and everything bigger on its right, even though neither side is sorted yet. So only the two sides still need sorting, and they can be sorted separately:

```cpp norun
void quickSort (int A[], int p, int r) {
	int q;
	if (p < r) {
		q = partition (A, p, r);
		quickSort (A, p, q-1);
		quickSort (A, q+1, r);
	}
}
```

Like merge sort, this is "divide and conquer". The difference: merge sort splits without looking and does its work **after** the recursive calls (merging). Quick sort does its work **before** them (partitioning), and needs no merge at all.

## How partition works

The **pivot** is the last value, x = A[r]. The index j walks from p to r − 1 looking at each value once, and i marks the end of the "small" region:

```cpp norun
int partition (int A[], int p, int r) {
	int x = A[r];                       // the pivot
	int i = p - 1;                      // end of the region of values <= x (empty so far)
	for (int j = p; j <= r - 1; j++) {
		if (A[j] <= x) {                // A[j] belongs in the small region
			i = i + 1;
			int temp = A[i];            // exchange A[i] with A[j]
			A[i] = A[j];
			A[j] = temp;
		}
	}
	int temp = A[i + 1];                // put the pivot between the two regions
	A[i + 1] = A[r];
	A[r] = temp;
	return i + 1;                       // q, the pivot's final location
}
```

At every moment the array is in four regions:

| A[p] … A[i] | A[i+1] … A[j−1] | A[j] … A[r−1] | A[r] |
|---|---|---|---|
| values ≤ pivot | values > pivot | not looked at yet | the pivot |

When A[j] ≤ x, it belongs in the small region: i moves up one, and A[j] is exchanged with A[i], the first value of the big region. When A[j] > x, nothing moves; the big region just grows by including it. At the end, the pivot is exchanged with A[i + 1], the first big value, which puts it between the two regions.

## The lecture's Example #2

partition (A, 0, 6) on 25 90 30 5 60 70 45. The pivot is x = 45, and i starts at p − 1 = −1.

| Pass | j | A[j] | A[j] ≤ 45? | Action | Array afterwards | i |
|---|---|---|---|---|---|---|
| 1 | 0 | 25 | yes | i = 0; exchange A[0] with A[0] | 25 90 30 5 60 70 45 | 0 |
| 2 | 1 | 90 | no | no change to i | 25 90 30 5 60 70 45 | 0 |
| 3 | 2 | 30 | yes | i = 1; exchange A[1] with A[2] | 25 30 90 5 60 70 45 | 1 |
| 4 | 3 | 5 | yes | i = 2; exchange A[2] with A[3] | 25 30 5 90 60 70 45 | 2 |
| 5 | 4 | 60 | no | no change | 25 30 5 90 60 70 45 | 2 |
| 6 | 5 | 70 | no | no change | 25 30 5 90 60 70 45 | 2 |
| end | | | | exchange A[i+1] = A[3] with A[r] | 25 30 5 **45** 60 70 90 | |

partition returns **i + 1 = 3**. The result matches the lecture: 25 30 5 45 60 70 90, with q = 3.

The lecture's first example works the same way: partition on 30 65 10 75 55 90 60 (pivot 60) moves 10 and 55 into the small region and returns q = 3, giving 30 10 55 60 65 90 75.

:::exam
For a partition question, write the array once, then one new row for every pass in which i changes. Mark i and j above the row. Remember that i starts at **p − 1**, and that the last step swaps the pivot with A[i + 1], not with A[i].
:::

## The whole sort

```cpp example="Quick sort with the lecture's partition"
#include <iostream>
using namespace std;

void show (int A[], int n) {
	for (int i = 0; i < n; i++)
		cout << A[i] << " ";
	cout << endl;
}

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

void quickSort (int A[], int p, int r) {
	int q;
	if (p < r) {
		q = partition (A, p, r);
		cout << "partition (A, " << p << ", " << r << ") returns " << q << ": ";
		for (int k = p; k <= r; k++)
			cout << A[k] << " ";
		cout << endl;
		quickSort (A, p, q-1);
		quickSort (A, q+1, r);
	}
}

int main() {
	int A[] = {25, 90, 30, 5, 60, 70, 45};
	quickSort (A, 0, 6);
	show (A, 7);

	int B[] = {30, 65, 10, 75, 55, 90, 60};
	cout << "partition on B returns " << partition (B, 0, 6) << ": ";
	show (B, 7);
	return 0;
}
```

Open the **Call tree** tab when stepping through: each quickSort call has two children, the parts to the left and right of its pivot.

## How fast is it?

**Average case: O(n log n).** If each pivot lands near the middle of its part, the parts halve at each level, just like merge sort: about log₂ n levels, each doing about n comparisons in its partitions.

**Worst case: O(n²).** If each pivot is the largest (or smallest) value of its part, partition only peels off one value: the parts have sizes n − 1, n − 2, …, 1. The comparisons add up to (n − 1) + (n − 2) + … + 1 = n(n − 1)/2. With the last value as pivot, this happens on an array that is **already sorted**, or sorted backwards.

Lecture 21 sums it up: quick sort's worst case is O(n²), its average case O(n log n). In practice it is usually the fastest of the sorts, because its inner loop is so simple and it sorts in place (no L and R arrays as in merge sort).

:::parsons Put the lines of partition in order.
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
~	int i = p;
:::


:::remember
- partition (A, p, r): pivot x = A[r], i = p − 1; for j = p to r − 1, if A[j] ≤ x then i++ and exchange A[i] with A[j]; finally exchange A[i+1] with A[r] and return i + 1.
- After partition, the pivot is in its final place, smaller values on its left, larger on its right.
- quickSort: partition, then sort the left part (p to q − 1) and the right part (q + 1 to r).
- Average O(n log n); worst O(n²), for example on already sorted input.
:::

:::teachback
Explain what `partition` does, and why quick sort can slow down to O(n²).
>> partition uses the pivot A[r] and rearranges A[p..r] so values less than or equal to the pivot are on its left and larger values on its right, then returns the pivot's final index q.
>> quickSort then sorts p..q-1 and q+1..r.
>> If the pivot is always the largest or smallest value (for example on sorted input), each partition removes only one value.
>> Then the calls are n deep with n, n - 1, ... comparisons: O(n²). With balanced splits it is O(n log n).
:::

:::quiz
What does partition (A, 0, 6) do to 8 3 9 1 7 4 6?
- [x] 3 1 4 6 7 9 8, and it returns 3
- [ ] 3 1 4 6 8 7 9, and it returns 3
- [ ] 1 3 4 6 7 8 9, and it returns 3
- [ ] 3 1 4 8 7 9 6, and it returns 2
>> Pivot 6. 3 (j = 1), 1 (j = 3) and 4 (j = 5) are ≤ 6, so each is swapped into the small region at locations 0, 1 and 2: 3 1 4 8 7 9 6. Finally the pivot is exchanged with A[3] = 8, giving 3 1 4 6 7 9 8, and partition returns 3. The right side is not sorted yet; that is the recursive calls' job.
:::

:::quiz
In the lecture's Example #2 (25 90 30 5 60 70 45), what is the value of i after pass 4 (j = 3)?
- [ ] 3
- [x] 2
- [ ] 1
- [ ] −1
>> i starts at −1 and goes up once for each value ≤ 45: 25 (pass 1), 30 (pass 3) and 5 (pass 4). Three increases from −1 give 2.
:::

:::quiz
The global `comparisons` adds up the comparisons made by partition. What does this print?
```cpp check
#include <iostream>
using namespace std;

int comparisons = 0;

int partition (int A[], int p, int r) {
	int x = A[r];
	int i = p - 1;
	for (int j = p; j <= r - 1; j++) {
		comparisons++;
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

void quickSort (int A[], int p, int r) {
	if (p < r) {
		int q = partition (A, p, r);
		quickSort (A, p, q - 1);
		quickSort (A, q + 1, r);
	}
}

int main() {
	int A[] = {1, 2, 3, 4, 5, 6};
	quickSort (A, 0, 5);
	cout << comparisons << endl;
	return 0;
}
```
- [ ] `6`
- [ ] `9`
- [x] `15`
- [ ] `36`
>> The array is already sorted, so every pivot is the largest value of its part and q = r every time. The parts have sizes 6, 5, 4, 3, 2, making 5 + 4 + 3 + 2 + 1 = 15 comparisons: n(n − 1)/2, the O(n²) worst case.
:::

:::quiz
Which statement about quick sort and merge sort is true?
- [ ] Both are O(n log n) in the worst case
- [x] Quick sort does its work before its recursive calls (partition); merge sort does its work after them (merge)
- [ ] Quick sort needs extra arrays L and R
- [ ] Merge sort chooses a pivot
>> Quick sort partitions first and then recurses, and needs no merge. Merge sort recurses first and then merges, which needs the extra arrays. Only merge sort is O(n log n) in the worst case.
:::
