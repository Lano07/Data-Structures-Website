---
title: Comparing the sorts
summary: Lecture 21 compares all six sorts. Selection, bubble and insertion sort are O(n²); heap sort and merge sort are O(n log n) in every case; quick sort is O(n log n) on average but O(n²) in the worst case. This lesson puts them side by side and races them.
lectures: Lectures 19–21
goals:
  - State the best, average and worst case of all six sorts
  - Explain where each O(n²) and O(n log n) comes from
  - Read the results of a sorting experiment and recognise the growth rates
  - Choose a suitable sort for a situation
labs: [sort, heap]
---

## Lecture 21's summary

| Sort | Worst case | Notes |
|---|---|---|
| Selection sort | O(n²) | always n(n − 1)/2 comparisons, even if already sorted |
| Insertion sort | O(n²) | O(n) on an array that is already sorted |
| Bubble sort | O(n²) | O(n) when sorted, if it stops after a pass with no swaps |
| Heap sort | O(n log n) | in every case |
| Merge sort | O(n log n) | in every case; needs extra arrays for merging |
| Quick sort | O(n²) | **average case O(n log n)**; worst case on sorted input |

## Where the growth rates come from

**O(n²): a loop inside a loop.** Selection, bubble and insertion sort each run an inner loop for every position of an outer loop. The inner loop shrinks by one each time, so the work is (n − 1) + (n − 2) + … + 1 = n(n − 1)/2, which grows like n². Doubling n makes the work **about four times** as big.

**O(n log n): log n levels of n work.** The three fast sorts each get a log n from halving:

- **Merge sort** splits the array in half again and again, giving about log₂ n levels of calls, and the merges on each level handle n values (lesson K2).
- **Quick sort** does the same when its pivots land near the middle of each part (lesson K3). When they land at the ends, the levels become n deep and it slows to O(n²).
- **Heap sort** builds a heap, then extracts the maximum n − 1 times. Each extract moves a value down the heap's height, which is log₂ n (lesson H3).

Doubling n makes n log n work a little more than twice as big. For large n, the difference is enormous:

| n | n² (selection sort, roughly) | n log₂ n (merge sort, roughly) |
|---|---|---|
| 100 | 10,000 | 700 |
| 1,000 | 1,000,000 | 10,000 |
| 1,000,000 | 1,000,000,000,000 | 20,000,000 |

## Let the race begin

Lecture 21 ends with "Experiments with sorting algorithms. Let the race begin!" Here is a race you can run. Each sort gets its own copy of the same random values, and every comparison between two values is counted.

```cpp example="The sorting race"
#include <iostream>
#include <iomanip>
#include <cstdlib>
using namespace std;

long comparisons = 0;

bool less_ (int a, int b) {          // every comparison goes through here
	comparisons++;
	return a < b;
}

void selectionSort (int A[], int n) {
	for (int i = 0; i < n - 1; i++) {
		int smallest = i;
		for (int j = i + 1; j < n; j++)
			if (less_ (A[j], A[smallest]))
				smallest = j;
		int temp = A[i]; A[i] = A[smallest]; A[smallest] = temp;
	}
}

void bubbleSort (int A[], int n) {
	for (int i = 0; i < n - 1; i++)
		for (int j = 0; j < n - 1 - i; j++)
			if (less_ (A[j + 1], A[j])) {
				int temp = A[j]; A[j] = A[j + 1]; A[j + 1] = temp;
			}
}

void insertionSort (int A[], int n) {
	for (int i = 1; i < n; i++) {
		int key = A[i];
		int j = i - 1;
		while (j >= 0 && less_ (key, A[j])) {
			A[j + 1] = A[j];
			j--;
		}
		A[j + 1] = key;
	}
}

void mergeArray (int A[], int p, int q, int r) {
	int n1 = q - p + 1, n2 = r - q;
	int * L = new int[n1];
	int * R = new int[n2];
	for (int i = 0; i < n1; i++) L[i] = A[p + i];
	for (int j = 0; j < n2; j++) R[j] = A[q + 1 + j];
	int i = 0, j = 0, k = p;
	while (i < n1 && j < n2) {
		if (!less_ (R[j], L[i])) A[k++] = L[i++];
		else A[k++] = R[j++];
	}
	while (i < n1) A[k++] = L[i++];
	while (j < n2) A[k++] = R[j++];
	delete [] L;
	delete [] R;
}

void mergeSort (int A[], int start, int end) {
	if (start < end) {
		int mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid + 1, end);
		mergeArray (A, start, mid, end);
	}
}

int partition (int A[], int p, int r) {
	int x = A[r];
	int i = p - 1;
	for (int j = p; j <= r - 1; j++)
		if (!less_ (x, A[j])) {          // A[j] <= x
			i++;
			int temp = A[i]; A[i] = A[j]; A[j] = temp;
		}
	int temp = A[i + 1]; A[i + 1] = A[r]; A[r] = temp;
	return i + 1;
}

void quickSort (int A[], int p, int r) {
	if (p < r) {
		int q = partition (A, p, r);
		quickSort (A, p, q - 1);
		quickSort (A, q + 1, r);
	}
}

void maxHeapify (int A[], int size, int i) {      // the heap is A[1..size]
	int l = 2 * i, r = 2 * i + 1, largest = i;
	if (l <= size && less_ (A[largest], A[l])) largest = l;
	if (r <= size && less_ (A[largest], A[r])) largest = r;
	if (largest != i) {
		int temp = A[i]; A[i] = A[largest]; A[largest] = temp;
		maxHeapify (A, size, largest);
	}
}

void heapSort (int A[], int n) {                  // sorts A[1..n]
	for (int i = n / 2; i >= 1; i--)
		maxHeapify (A, n, i);
	for (int size = n; size >= 2; size--) {
		int temp = A[1]; A[1] = A[size]; A[size] = temp;
		maxHeapify (A, size - 1, 1);
	}
}

int main() {
	srand (2611);
	cout << "     n  selection  bubble  insertion   merge   quick    heap" << endl;
	for (int n = 25; n <= 100; n = n * 2) {
		int data[101], A[101];
		for (int i = 0; i < n; i++)
			data[i] = rand () % 1000;
		cout << setw (6) << n;
		for (int s = 0; s < 6; s++) {
			for (int i = 0; i < n; i++)
				A[i] = data[i];
			comparisons = 0;
			if (s == 0) selectionSort (A, n);
			if (s == 1) bubbleSort (A, n);
			if (s == 2) insertionSort (A, n);
			if (s == 3) mergeSort (A, 0, n - 1);
			if (s == 4) quickSort (A, 0, n - 1);
			if (s == 5) {
				for (int i = n; i >= 1; i--)      // heap sort uses locations 1 to n
					A[i] = A[i - 1];
				heapSort (A, n);
			}
			cout << setw (s == 0 || s == 2 ? 11 : 8) << comparisons;
		}
		cout << endl;
	}
	return 0;
}
```

Read down each column as n doubles from 25 to 50 to 100:

- selection and bubble sort grow by about **4 times** each step: n² behaviour;
- insertion sort makes about half as many comparisons as they do on random data, but still grows about 4 times;
- merge, quick and heap sort grow by only about **2.5 times**: n log n behaviour (a little more than doubling).

Change the values to be already sorted (`data[i] = i;`) and run it again: insertion sort becomes the fastest of all, and quick sort becomes as slow as selection sort.

## Which sort when?

| Situation | Good choice | Why |
|---|---|---|
| A small array, or one that is nearly sorted | insertion sort | very little work when values are almost in place; simple code |
| You need a guaranteed O(n log n) | merge sort or heap sort | no bad inputs |
| Memory is tight | heap sort or quick sort | they sort in place; merge sort needs extra arrays |
| General use, fastest on average | quick sort | simple inner loop, in place; its worst case is rare on random data |
| Teaching, or a handful of values | selection or bubble sort | easiest to write correctly |

:::remember
- **O(n²)**: selection, bubble, insertion (worst case). Insertion sort is O(n) on sorted input.
- **O(n log n) always**: merge sort and heap sort.
- **Quick sort**: O(n log n) on average, O(n²) worst case.
- n² comes from a loop inside a loop; n log n comes from about log n levels of n work each.
:::

:::teachback
Explain where the n² of selection sort and the n log n of merge sort come from.
>> Selection sort scans the rest of the array for each position: (n - 1) + (n - 2) + ... + 1 = n(n - 1)/2 comparisons.
>> That is a loop inside a loop, so doubling n makes the work about four times bigger.
>> Merge sort halves the array about log2 n times and merges n values at each level.
>> So it does about n log n work, and doubling n only slightly more than doubles it.
:::

:::quiz
Which sort is O(n log n) in its average case but O(n²) in its worst case?
- [ ] Merge sort
- [ ] Heap sort
- [x] Quick sort
- [ ] Insertion sort
>> Quick sort's work depends on where the pivots land. Near the middle gives log n levels; at the ends (for example on sorted input) gives n levels and n(n − 1)/2 comparisons.
:::

:::quiz
A sort takes 1 second on 10,000 values. Roughly how long would an O(n²) sort take on 20,000 values?
- [ ] 2 seconds
- [x] 4 seconds
- [ ] 1.4 seconds
- [ ] 20 seconds
>> Doubling n multiplies n² by 2² = 4. An O(n log n) sort would take only a little over 2 seconds.
:::

:::quiz
Which sort needs extra memory proportional to n to do its work?
- [ ] Heap sort
- [ ] Quick sort
- [x] Merge sort
- [ ] Insertion sort
>> mergeArray copies the two halves into the arrays L and R before merging them back. The other sorts only swap or shift values inside the original array.
:::

:::quiz
An array is already sorted, and it is sorted again. Which sort (as written in these lessons) does the **least** work?
- [ ] Selection sort
- [x] Insertion sort
- [ ] Quick sort
- [ ] Heap sort
>> Insertion sort makes one comparison per value, n − 1 in total. Selection sort still makes n(n − 1)/2, quick sort hits its worst case of n(n − 1)/2, and heap sort still does O(n log n) work.
:::
