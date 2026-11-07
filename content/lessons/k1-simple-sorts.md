---
title: Selection, bubble and insertion sort
summary: Three simple ways to sort an array, each built from a loop inside a loop. Selection sort picks the smallest remaining value, bubble sort swaps neighbours that are out of order, and insertion sort slides each new value into place. All three are O(n²) in the worst case.
lectures: Lectures 19–21
goals:
  - Trace selection, bubble and insertion sort pass by pass
  - Write all three in C++
  - Count their comparisons and explain why each is O(n²) in the worst case
  - Explain why insertion sort is fast on an array that is already sorted
labs: [sort]
---

## The sorting problem

**Sorting** puts the values of an array in ascending order (smallest first). Lecture 21 lists six algorithms:

- selection sort, bubble sort and insertion sort (this lesson),
- heap sort (lesson H3), merge sort (K2) and quick sort (K3).

All three sorts in this lesson split the array into a **sorted part** and an **unsorted part**, and each pass of the outer loop makes the sorted part one value bigger. They differ in how they choose that value and where they put it.

The examples use the array 29 10 14 37 13.

## Selection sort

**Idea**: find the smallest value in the unsorted part and swap it to the front of the unsorted part.

| Pass | Smallest of the unsorted part | Array afterwards (sorted part in bold) |
|---|---|---|
| start | | 29 10 14 37 13 |
| i = 0 | 10, swap with 29 | **10** 29 14 37 13 |
| i = 1 | 13, swap with 29 | **10 13** 14 37 29 |
| i = 2 | 14, already in place | **10 13 14** 37 29 |
| i = 3 | 29, swap with 37 | **10 13 14 29** 37 |

After n − 1 passes the last value must be the largest, so it is already in place.

```cpp norun
void selectionSort (int A[], int n) {
	for (int i = 0; i < n - 1; i++) {
		int smallest = i;                        // location of the smallest so far
		for (int j = i + 1; j < n; j++)
			if (A[j] < A[smallest])
				smallest = j;
		int temp = A[i];                         // swap it into location i
		A[i] = A[smallest];
		A[smallest] = temp;
	}
}
```

**Cost.** Pass i compares the values after location i, so the comparisons are (n − 1) + (n − 2) + … + 1 = **n(n − 1)/2**. That is O(n²), and it is the same for every input, even one that is already sorted, because the inner loop always scans to the end. It makes at most n − 1 swaps.

## Bubble sort

**Idea**: walk along the array comparing each pair of neighbours, and swap any pair that is out of order. Each pass carries the largest remaining value to the end, like a bubble rising.

Pass 1 on 29 10 14 37 13:

- 29 > 10: swap → 10 29 14 37 13
- 29 > 14: swap → 10 14 29 37 13
- 29 < 37: leave → 10 14 29 37 13
- 37 > 13: swap → 10 14 29 13 **37**

37, the largest, has reached the end. Pass 2 gives 10 14 13 **29 37**, pass 3 gives 10 13 **14 29 37**, and pass 4 finds nothing to swap.

```cpp norun
void bubbleSort (int A[], int n) {
	for (int i = 0; i < n - 1; i++)
		for (int j = 0; j < n - 1 - i; j++)      // the last i values are already in place
			if (A[j] > A[j + 1]) {
				int temp = A[j];
				A[j] = A[j + 1];
				A[j + 1] = temp;
			}
}
```

**Cost.** Also n(n − 1)/2 comparisons, so **O(n²)**, and it can make that many swaps too (a reversed array swaps on every comparison).

:::tip
A common improvement: if a whole pass makes no swaps, the array is sorted and the loop can stop. With that check, an already sorted array takes one pass, O(n). Without it, bubble sort always does all n − 1 passes.
:::

## Insertion sort

**Idea**: like sorting a hand of cards. Take the next value (the **key**) and slide it left into its place among the sorted values, shifting larger values one place right to make room.

| Insert | Sorted part before | What happens | Array afterwards |
|---|---|---|---|
| 10 | 29 | 29 > 10 shifts right | **10 29** 14 37 13 |
| 14 | 10 29 | 29 shifts right; 10 < 14 stops | **10 14 29** 37 13 |
| 37 | 10 14 29 | 29 < 37 stops at once | **10 14 29 37** 13 |
| 13 | 10 14 29 37 | 37, 29 and 14 shift right; 10 < 13 stops | **10 13 14 29 37** |

```cpp norun
void insertionSort (int A[], int n) {
	for (int i = 1; i < n; i++) {
		int key = A[i];                          // the value to insert
		int j = i - 1;
		while (j >= 0 && A[j] > key) {           // shift larger values one place right
			A[j + 1] = A[j];
			j = j - 1;
		}
		A[j + 1] = key;                          // drop the key into the gap
	}
}
```

The test `j >= 0` comes first so that `A[j]` is never read when j has run off the front of the array (the same "check first" idea as `curr != NULL` in a list).

**Cost.** In the worst case (a reversed array) each key moves all the way to the front: 1 + 2 + … + (n − 1) = n(n − 1)/2 shifts, **O(n²)**. But on an array that is **already sorted**, every while loop stops after one comparison, so the whole sort takes n − 1 comparisons: **O(n)**. Insertion sort is very fast on arrays that are nearly sorted.

## All three, counted

```cpp example="Counting comparisons"
#include <iostream>
#include <string>
using namespace std;

int comparisons = 0;

void selectionSort (int A[], int n) {
	for (int i = 0; i < n - 1; i++) {
		int smallest = i;
		for (int j = i + 1; j < n; j++) {
			comparisons++;
			if (A[j] < A[smallest])
				smallest = j;
		}
		int temp = A[i];
		A[i] = A[smallest];
		A[smallest] = temp;
	}
}

void bubbleSort (int A[], int n) {
	for (int i = 0; i < n - 1; i++)
		for (int j = 0; j < n - 1 - i; j++) {
			comparisons++;
			if (A[j] > A[j + 1]) {
				int temp = A[j];
				A[j] = A[j + 1];
				A[j + 1] = temp;
			}
		}
}

void insertionSort (int A[], int n) {
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
}

void fill (int A[], int n, int kind) {           // 0 = sorted, 1 = reversed
	for (int i = 0; i < n; i++)
		A[i] = (kind == 0) ? i : n - i;
}

int main() {
	const int n = 20;
	int A[n];
	string kinds[] = {"sorted  ", "reversed"};
	for (int kind = 0; kind < 2; kind++) {
		cout << kinds[kind] << ":";
		fill (A, n, kind);
		comparisons = 0;
		selectionSort (A, n);
		cout << "  selection " << comparisons;
		fill (A, n, kind);
		comparisons = 0;
		bubbleSort (A, n);
		cout << "  bubble " << comparisons;
		fill (A, n, kind);
		comparisons = 0;
		insertionSort (A, n);
		cout << "  insertion " << comparisons << endl;
	}
	return 0;
}
```

With n = 20, n(n − 1)/2 = 190. Selection and bubble sort make 190 comparisons whatever the order. Insertion sort makes 190 on the reversed array but only 19 (n − 1) on the sorted one. Change n to 40 and run it again: the 190s become 780, about four times as many, which is what O(n²) means.

Watch each pass in the [Sorting Lab](#lab-sort), which counts the comparisons and swaps as it goes.

:::parsons Put the lines of insertionSort in order.
void insertionSort (int A[], int n) {
	for (int i = 1; i < n; i++) {
		int key = A[i];
		int j = i - 1;
		while (j >= 0 && A[j] > key) {
			A[j + 1] = A[j];
			j = j - 1;
		}
		A[j + 1] = key;
	}
}
~			A[j] = A[j + 1];
:::


:::predict Selection sort prints the array after each pass. Predict all three lines.
```cpp
#include <iostream>
using namespace std;

void show (int A[], int n) {
	for (int i = 0; i < n; i++)
		cout << A[i] << " ";
	cout << endl;
}

int main() {
	int A[] = {7, 3, 9, 1};
	int n = 4;
	for (int i = 0; i < n - 1; i++) {
		int smallest = i;
		for (int j = i + 1; j < n; j++)
			if (A[j] < A[smallest])
				smallest = j;
		int temp = A[i];
		A[i] = A[smallest];
		A[smallest] = temp;
		show (A, n);
	}
	return 0;
}
```
:::


:::remember
- **Selection**: find the smallest of the rest, swap it to the front. Always n(n − 1)/2 comparisons.
- **Bubble**: swap neighbours that are out of order; each pass moves the largest to the end.
- **Insertion**: slide the next key left into the sorted part. O(n²) worst, **O(n) if already sorted**.
- All three: **O(n²)** in the worst case (Lecture 21).
:::

:::teachback
Explain how insertion sort works, and why it is fast on an array that is already sorted.
>> The front of the array is kept sorted.
>> Each new key is taken out, larger values are shifted one place right, and the key is dropped into the gap.
>> On a sorted array each key is already larger than its left neighbour, so the inner loop stops after one comparison.
>> That is n - 1 comparisons, O(n), while the worst case (a reversed array) is O(n²).
:::

:::quiz
Selection sort is run on 5 2 4 6 1 3. What is the array after the first **three** passes of the outer loop?
- [ ] 1 2 4 6 5 3
- [x] 1 2 3 6 5 4
- [ ] 1 2 3 4 5 6
- [ ] 2 4 5 1 3 6
>> Pass 1 swaps the smallest, 1, with 5: 1 2 4 6 5 3. Pass 2 finds 2 already in place. Pass 3 swaps the smallest of 4 6 5 3, which is 3, with 4: 1 2 3 6 5 4.
:::

:::quiz
Bubble sort is run on 5 2 4 6 1 3. What is the array after the **first** pass?
- [x] 2 4 5 1 3 6
- [ ] 2 5 4 6 1 3
- [ ] 1 2 4 5 3 6
- [ ] 2 4 5 6 1 3
>> 5 and 2 swap, 5 and 4 swap, 5 and 6 stay, 6 and 1 swap, 6 and 3 swap. The largest value, 6, ends up at the end: 2 4 5 1 3 6.
:::

:::quiz
Insertion sort is run on 5 2 4 6 1 3. What is the array after the keys at locations 1, 2 and 3 have been inserted?
- [ ] 1 2 4 5 6 3
- [ ] 2 4 5 1 3 6
- [x] 2 4 5 6 1 3
- [ ] 1 2 3 6 5 4
>> Insert 2: 2 5 4 6 1 3. Insert 4: 2 4 5 6 1 3. Insert 6: it is bigger than 5, so it stays: 2 4 5 6 1 3. The 1 and 3 have not been touched yet.
:::

:::quiz
An array of 10 values is **already sorted**. Which sort makes the fewest comparisons on it (using the code in this lesson)?
- [ ] Selection sort
- [ ] Bubble sort
- [x] Insertion sort
- [ ] They all make 45
>> Insertion sort compares each key once with its left neighbour and stops: 9 comparisons. Selection and bubble sort (without the early-stop check) still make 10 × 9 / 2 = 45.
:::
