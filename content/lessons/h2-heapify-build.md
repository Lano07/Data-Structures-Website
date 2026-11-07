---
title: maxHeapify and buildMaxHeap
summary: maxHeapify fixes one node whose value is too small by swapping it down with its larger child until it fits. buildMaxHeap turns any array into a heap by calling maxHeapify on every non-leaf, from the last one back to the root.
lectures: Lecture 12
goals:
  - Trace maxHeapify by hand, swap by swap
  - Explain why maxHeapify needs both subtrees to be heaps already
  - Trace buildMaxHeap and explain why it starts at size / 2
  - Write both functions in C++
labs: [heap]
---

## maxHeapify: sinking a value into place

Suppose node i holds a value that may be smaller than its children, but **both of its subtrees are already max-heaps**. maxHeapify repairs the heap at i:

1. Look at A[i], A[left] and A[right] (only the children that exist), and find the index of the **largest** of the three.
2. If the largest is i itself, stop: node i is fine.
3. Otherwise, swap A[i] with the largest child, then call maxHeapify on that child's index, because the small value moved down and might be too small there as well.

:::diagram heap 16 4 10 14 7 9 3 2 8 1
Before maxHeapify(heap, 2): the value 4 at index 2 is smaller than its children 14 and 7. Both of its subtrees are heaps.
:::

:::steps
maxHeapify(heap, 2):
1. Compare A[2] = 4, A[4] = 14, A[5] = 7. The largest is 14 at index 4. Swap A[2] and A[4].
2. Now 4 is at index 4. maxHeapify(heap, 4): compare A[4] = 4, A[8] = 2, A[9] = 8. The largest is 8 at index 9. Swap.
3. Now 4 is at index 9, a leaf. maxHeapify(heap, 9) finds no children and stops.
:::

:::diagram heap 16 14 10 8 7 9 3 2 4 1
After maxHeapify(heap, 2): 16 14 10 8 7 9 3 2 4 1 is a max-heap.
:::

## The code

The lecture gives the steps in words ("largest = index of largest of heap->A[i], heap->A[left], heap->A[right]"). In C++:

```cpp norun
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
```

The tests `left <= heap->size` and `right <= heap->size` check that the child exists. Without them, the function would compare with values beyond the end of the heap.

:::parsons Put the lines of maxHeapify in order.
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
~		maxHeapify (heap, i);
:::


:::predict Predict the array after buildMaxHeap.
```cpp
#include <iostream>
using namespace std;

struct MaxHeap {
	int A [100];
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
	for (int i = heap->size / 2; i >= 1; i = i - 1)
		maxHeapify (heap, i);
}

int main() {
	int values[] = {3, 9, 2, 1, 4, 5};
	MaxHeap * heap = new MaxHeap;
	heap->size = 6;
	for (int i = 0; i < 6; i++)
		heap->A[i + 1] = values[i];
	buildMaxHeap (heap);
	for (int i = 1; i <= heap->size; i++)
		cout << heap->A[i] << " ";
	cout << endl;
	return 0;
}
```
:::


:::remember
maxHeapify only moves a value **down**, and only works if the subtrees below i are already heaps. It cannot fix a node whose subtrees are out of order. (Lecture 13 shows a node that cannot be heapified because "its left subtree is not a max-heap".)
:::

Each swap moves the value down one level, so maxHeapify does at most (height) swaps: **O(log n)**.

## buildMaxHeap: making a heap from any array

Start with any values in A[1..n]. The leaves (indexes n / 2 + 1 to n) are already tiny heaps of one node. So work **backwards** from the last non-leaf, n / 2, to the root, calling maxHeapify on each. By the time you reach node i, both of its subtrees have already been made into heaps, which is exactly what maxHeapify needs.

```cpp norun
void buildMaxHeap (MaxHeap * heap) {
	for (int i = (heap->size / 2); i >= 1; i = i - 1)
		maxHeapify (heap, i);
}
```

:::mistake
Looping forwards, from 1 up to size / 2. When maxHeapify runs at the root first, the subtrees below are not yet heaps, so the result is usually not a heap. The order (last non-leaf back to the root) is what makes it work.
:::

## The lecture example

Lecture 12 calls buildMaxHeap on 4 1 3 2 16 9 10 14 8 7. Run it here, then open the Heap Lab to watch every comparison.

```cpp example="buildMaxHeap on the Lecture 12 array"
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

void printHeap (MaxHeap * heap) {
	for (int i = 1; i <= heap->size; i++)
		cout << heap->A[i] << " ";
	cout << endl;
}

int main() {
	int values[] = {4, 1, 3, 2, 16, 9, 10, 14, 8, 7};
	MaxHeap * heap = new MaxHeap;
	for (int i = 0; i < 10; i++)
		heap->A[i + 1] = values[i];
	heap->size = 10;
	printHeap (heap);
	buildMaxHeap (heap);
	printHeap (heap);
	delete heap;
	return 0;
}
```

:::trace
buildMaxHeap on 4 1 3 2 16 9 10 14 8 7 (size 10, so i goes 5, 4, 3, 2, 1):
- i = 5: 16 vs its child 7. No swap.
- i = 4: 2 vs 14 and 8. Swap with 14: 4 1 3 14 16 9 10 2 8 7.
- i = 3: 3 vs 9 and 10. Swap with 10: 4 1 10 14 16 9 3 2 8 7.
- i = 2: 1 vs 14 and 16. Swap with 16, then 1 vs 7 at index 10: swap. 4 16 10 14 7 9 3 2 8 1.
- i = 1: 4 vs 16 and 10. Swap with 16; then 4 vs 14 and 7: swap with 14; then 4 vs 2 and 8: swap with 8. Result: 16 14 10 8 7 9 3 2 4 1.
:::

## How much work?

buildMaxHeap calls maxHeapify n / 2 times, and each call is O(log n), so it is at most **O(n log n)**. (A more careful count shows it is actually O(n), because most calls are near the bottom where the trees are short.)

:::teachback
Explain what `maxHeapify (heap, i)` does, and why `buildMaxHeap` starts at `size / 2` and works backwards to 1.
>> maxHeapify assumes the two subtrees of i are already heaps.
>> It swaps A[i] with its larger child while a child is larger, so the value moves down until the heap property holds.
>> Every index after size / 2 is a leaf, and a leaf is already a heap.
>> Working from size / 2 down to 1 means both subtrees of a node are heaps by the time it is heapified.
:::

:::quiz
What is the array after `maxHeapify (heap, 1)` on the heap 3 9 8 5 6 7 (size 6)?
- [ ] 9 3 8 5 6 7
- [x] 9 6 8 5 3 7
- [ ] 9 8 3 5 6 7
- [ ] 9 6 8 3 5 7
>> At index 1, 3 is compared with 9 and 8: swap with 9 (index 2), giving 9 3 8 5 6 7. At index 2, 3 is compared with A[4] = 5 and A[5] = 6: swap with 6 (index 5), giving 9 6 8 5 3 7. Index 5 is a leaf, so it stops.
:::

:::quiz
buildMaxHeap is called on a heap of size 13. Which index does its loop start at?
- [ ] 13
- [ ] 7
- [x] 6
- [ ] 1
>> It starts at size / 2 = 13 / 2 = 6 (integer division). Index 6 is the last node with a child (its left child is 12, and 13 is the right child of 6).
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct MaxHeap { int A [100]; int size; };

void maxHeapify (MaxHeap * heap, int i) {
	int left = i * 2, right = i * 2 + 1, largest = i;
	if (left <= heap->size && heap->A[left] > heap->A[largest]) largest = left;
	if (right <= heap->size && heap->A[right] > heap->A[largest]) largest = right;
	if (largest != i) {
		int temp = heap->A[i]; heap->A[i] = heap->A[largest]; heap->A[largest] = temp;
		maxHeapify (heap, largest);
	}
}

int main() {
	MaxHeap h;
	int v[] = {5, 13, 2, 25, 7, 17, 20};
	for (int i = 0; i < 7; i++) h.A[i + 1] = v[i];
	h.size = 7;
	for (int i = h.size / 2; i >= 1; i--) maxHeapify (&h, i);
	for (int i = 1; i <= h.size; i++) cout << h.A[i] << " ";
	cout << endl;
	return 0;
}
```
- [ ] `25 20 17 13 7 5 2`
- [x] `25 13 20 5 7 17 2`
- [ ] `25 13 20 7 5 17 2`
- [ ] `25 20 13 5 7 17 2`
>> i = 3: 2 vs 17 and 20, swap with 20 → 5 13 20 25 7 17 2. i = 2: 13 vs 25 and 7, swap with 25 → 5 25 20 13 7 17 2. i = 1: 5 vs 25 and 20, swap with 25 → 25 5 20 13 7 17 2; then 5 vs 13 and 7, swap with 13 → 25 13 20 5 7 17 2.
:::
