---
title: Deleting from a heap and heap sort
summary: To remove the maximum, move the last value to the root, shrink the heap, and heapify the root. Doing that repeatedly, and storing each maximum in the slot that was just freed, sorts the array in place: heap sort.
lectures: Lecture 13
goals:
  - Trace heapExtractMax and deleteMaxHeap step by step
  - Predict the output of deleting every value from a heap
  - Trace heap sort (both lecture versions) and state its running time
labs: [heap, sort]
---

## heapExtractMax: removing the largest value

The maximum is at index 1, but we cannot leave a hole there: the tree must stay almost complete. So:

1. Save A[1] (the value to return).
2. Move the **last** value, A[size], into index 1.
3. Shrink the heap: `size = size - 1`.
4. The moved value is probably too small for the root, so call `maxHeapify (heap, 1)`.

```cpp norun
int heapExtractMax (MaxHeap * heap) {
	int toDelete = heap->A[1];
	heap->A[1] = heap->A[heap->size];
	heap->size = heap->size - 1;
	maxHeapify (heap, 1);
	return toDelete;
}
```

Taking the **last** value is what keeps the shape almost complete: the only node that disappears is the last leaf. The caller must make sure `heap->size ≥ 1` first.

:::steps
heapExtractMax on 16 14 10 8 7 9 3 2 4 1:
1. Save 16. Move the last value, 1, to index 1: 1 14 10 8 7 9 3 2 4 (size 9).
2. maxHeapify(heap, 1): 1 vs 14 and 10, swap with 14. Then 1 vs 8 and 7, swap with 8. Then 1 vs 2 and 4, swap with 4.
3. Result: 14 8 10 4 7 9 3 2 1. Return 16.
:::

Each extract is one move and one maxHeapify: **O(log n)**.

## deleteMaxHeap: removing the value at any index i

The lecture uses the same idea for any index:

```cpp norun
int deleteMaxHeap (MaxHeap * heap, int i) {
	int toDelete = heap->A[i];
	heap->A[i] = heap->A[heap->size];
	heap->size = heap->size - 1;
	maxHeapify (heap, i);
	return toDelete;
}
```

`heapExtractMax` is just `deleteMaxHeap (heap, 1)`.

:::warn
maxHeapify only moves a value **down**. If the last value happens to be **larger** than the parent of i, it would need to move **up** instead, and this function would leave the heap broken. A fully general delete checks both directions. For index 1 (the root) the problem cannot happen, because the root has no parent.
:::

## Deleting every value

Lecture 13 asks: what does this print for the heap 16 14 10 8 7 9 3 2 4 1?

```cpp norun
void deleteAllMaxHeap (MaxHeap * heap) {
	int deleted;
	for (int i = heap->size; i >= 1; i--) {
		deleted = heapExtractMax (heap);
		cout << deleted << endl;
	}
}
```

Each extract removes the largest value still in the heap, so the values come out in **descending order**: 16, 14, 10, 9, 8, 7, 4, 3, 2, 1.

## Heap sort, version 1

Notice that when the heap shrinks from size to size − 1, location `size` is no longer part of the heap, but it is still in the array. Store the extracted maximum there:

```cpp norun
void deleteAllMaxHeap (MaxHeap * heap) {
	for (int i = heap->size; i >= 1; i--)
		heap->A[i] = heapExtractMax (heap);
}
```

The largest value lands at the end, the next largest just before it, and so on, so the array ends up in **ascending** order. Putting it together, with the lecture's helper that copies an ordinary array (from index 0) into a heap (from index 1):

```cpp norun
MaxHeap * initMaxHeapFromArray (int A[], int numElements) {
	MaxHeap * heap;
	heap = new MaxHeap;
	for (int i = 0; i < numElements; i++) {
		heap->A[i + 1] = A[i];
	}
	heap->size = numElements;
	return heap;
}

void heapSort (int A[], int numElements) {
	MaxHeap * heap = initMaxHeapFromArray (A, numElements);
	buildMaxHeap (heap);
	deleteAllMaxHeap (heap);
	for (int i = 1; i <= numElements; i++)
		A[i - 1] = heap->A[i];
}
```

:::why
The lecture asks: "Can we use `i <= heap->size` in the last loop?" No. After deleteAllMaxHeap, `heap->size` is 0, so that loop would copy nothing. The original count, `numElements`, must be used.
:::

## Heap sort, version 2

Version 2 does the extract by hand: swap the root with the last value in the heap, shrink, heapify.

```cpp example="Heap sort (version 2)"
#include <iostream>
using namespace std;

struct MaxHeap {
	int A [1000];
	int size;
};

void maxHeapify (MaxHeap * heap, int i) {
	int left = i * 2;
	int right = i * 2 + 1;
	int largest = i;
	if (left <= heap->size && heap->A[left] > heap->A[largest])
		largest = left;
	if (right <= heap->size && heap->A[right] > heap->A[largest])
		largest = right;
	if (largest != i) {
		int temp = heap->A[i];
		heap->A[i] = heap->A[largest];
		heap->A[largest] = temp;
		maxHeapify (heap, largest);
	}
}

void buildMaxHeap (MaxHeap * heap) {
	for (int i = (heap->size / 2); i >= 1; i = i - 1)
		maxHeapify (heap, i);
}

MaxHeap * initMaxHeapFromArray (int A[], int numElements) {
	MaxHeap * heap = new MaxHeap;
	for (int i = 0; i < numElements; i++)
		heap->A[i + 1] = A[i];
	heap->size = numElements;
	return heap;
}

void heapSort (int A[], int numElements) {
	MaxHeap * heap = initMaxHeapFromArray (A, numElements);
	buildMaxHeap (heap);
	for (int i = heap->size; i >= 2; i--) {
		int temp = heap->A[i];
		heap->A[i] = heap->A[1];
		heap->A[1] = temp;
		heap->size = heap->size - 1;
		maxHeapify (heap, 1);
	}
	for (int i = 1; i <= numElements; i++)
		A[i - 1] = heap->A[i];
	delete heap;
}

int main() {
	int A[] = {4, 1, 3, 2, 16, 9, 10, 14, 8, 7};
	heapSort (A, 10);
	for (int i = 0; i < 10; i++)
		cout << A[i] << " ";
	cout << endl;
	return 0;
}
```

The Sorting Lab and the Heap Lab both animate this, showing the sorted part growing at the end of the array.

## Running time

buildMaxHeap is at most O(n log n), and then there are n − 1 extracts, each O(log n). So heap sort is **O(n log n)** in every case, best, average and worst.

:::teachback
Explain how `heapExtractMax` removes the largest value from a max-heap, and how heap sort uses the same step to sort an array.
>> Save A[1], the maximum.
>> Move the last value A[size] into A[1] and decrease size.
>> Call maxHeapify (heap, 1) to move that value down and restore the heap: O(log n).
>> Heap sort builds a max-heap, then repeatedly puts the root at the end of the shrinking heap, which gives ascending order in O(n log n).
:::

:::quiz
What is the heap after one heapExtractMax on 20 15 18 9 12 10?
- [ ] 15 18 9 12 10
- [x] 18 15 10 9 12
- [ ] 18 15 9 12 10
- [ ] 18 12 15 9 10
>> Move the last value (10) to the root: 10 15 18 9 12 (size 5). maxHeapify(1): 10 vs 15 and 18, swap with 18 (index 3): 18 15 10 9 12. Index 3 has no children within size 5, so stop.
:::

:::quiz
`deleteAllMaxHeap` (the version that prints) runs on the max-heap 9 7 8 3 5 1. What does it print, one value per line?
- [ ] 9 7 8 3 5 1
- [ ] 1 3 5 7 8 9
- [x] 9 8 7 5 3 1
- [ ] 9 8 7 3 5 1
>> Every extract returns the largest value left in the heap, so the output is always in descending order, whatever the layout of the array.
:::

:::quiz
After buildMaxHeap, heap sort (version 2) swaps A[1] with A[size] and shrinks the heap. After the first swap on 16 14 10 8 7 9 3 2 4 1, which value is in its final sorted position?
- [ ] 1, at index 1
- [x] 16, at index 10
- [ ] 14, at index 10
- [ ] 16, at index 1
>> The root (16) is swapped with A[10]. Index 10 is then outside the heap, so 16 stays there for good: it is the largest value, and the sorted array ends with it.
:::
