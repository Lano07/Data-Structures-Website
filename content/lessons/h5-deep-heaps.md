---
title: "Deep dive: heaps, from the array formulas to O(n) buildMaxHeap"
summary: Why are a node's children at 2i and 2i + 1? Why is a heap's height log₂ n? Why does buildMaxHeap start at size/2 and go down to 1, and why is it O(n), not O(n log n)? This deep dive proves the facts behind Lectures 11–14 and turns heap questions into reasoning rather than memorisation.
lectures: Lectures 11–14 (deep dive)
goals:
  - Prove the parent and child formulas for an almost complete tree stored from index 1
  - Show that a heap with n values has height ⌊log₂ n⌋, so maxHeapify, insert and delete are O(log n)
  - Explain maxHeapify's precondition, and why buildMaxHeap starts at size/2 and works downwards
  - Derive the O(n) cost of buildMaxHeap and the O(n log n) cost of heap sort
  - Compare a heap with other structures as a priority queue
labs: [heap]
---

## Why the array works: the index formulas

Lecture 11 stores an almost complete binary tree in an array from **index 1**, level by level and left to right, and uses Parent (i) = ⌊i/2⌋, Left (i) = 2i and Right (i) = 2i + 1.

:::theorem The index formulas
In an almost complete tree stored level by level from index 1, the node at index i has its left child at 2i, its right child at 2i + 1, and its parent at ⌊i/2⌋.
:::

:::proof
Level d holds up to 2^d nodes. Levels 0 to d − 1 hold 1 + 2 + … + 2^(d−1) = 2^d − 1 nodes, so **level d starts at index 2^d**. Take the node at position j on level d (j = 0, 1, …), so i = 2^d + j. The j nodes to its left on level d each have two children, which come before its own children on level d + 1. Level d + 1 starts at 2^(d+1), so its left child is at 2^(d+1) + 2j = 2(2^d + j) = 2i, and its right child is the next index, 2i + 1. Halving 2i or 2i + 1 and rounding down gives i back, which is the parent formula.
:::

Index 0 is left unused because the formulas need it: with the root at 0, its "children" 2 × 0 and 2 × 0 + 1 would be 0 and 1. Some books start at 0 and use children 2i + 1 and 2i + 2, but this course starts at 1.

## Height: why heap operations are O(log n)

:::theorem Heap height
An almost complete tree with n nodes has height ⌊log₂ n⌋.
:::

:::proof
A tree of height h has all levels 0 to h − 1 full, plus at least one node on level h. So 2^h ≤ n ≤ 2^(h+1) − 1 < 2^(h+1). Taking log₂: h ≤ log₂ n < h + 1, so h = ⌊log₂ n⌋.
:::

Every operation that walks one path, down (maxHeapify) or up (insert, increase key), is therefore **O(log n)**. A heap of a million values is only 19 levels deep.

## What the max-heap property implies

:::def The max-heap property (Lecture 11)
A[Parent (i)] ≥ A[i] for every i > 1.
:::

- The **maximum is at A[1]**, so `maximum` is O(1) (Lecture 12).
- **Every path from the root down is non-increasing.**
- The **minimum is at a leaf**, somewhere in A[⌊n/2⌋ + 1 .. n]. But the property says nothing about left against right, so **searching a heap for a key is O(n)**. That is Lecture 14's question *How to find out if a max-heap contains a particular value?*: you have to look everywhere.

## maxHeapify and its precondition

:::invariant maxHeapify's precondition (Lecture 12)
The subtrees rooted at Left (i) and Right (i) are already max-heaps; only A[i] may be smaller than its children.
:::

Under that precondition, swapping A[i] with its **larger** child fixes node i: the larger child is at least as big as the other child and everything beneath both. The only place a problem can remain is where the old A[i] landed, so it recurses there. It moves down one level per call, so it is O(h) = O(log n).

:::trap The smaller child
Swapping with the smaller child puts a value at i that is smaller than the other child, which breaks the property. Always choose the **largest of the three**.
:::

## buildMaxHeap: why size/2, and why downwards

`buildMaxHeap` (Lecture 12) calls `maxHeapify (heap, i)` for i = size/2 down to 1.

- **Why start at size/2?** Node i is a leaf exactly when 2i > size, that is i > size/2. A single node is already a heap, so there is nothing to do for indexes size/2 + 1 to size.
- **Why go downwards?** maxHeapify (i) needs both subtrees of i to be heaps already. Their indexes are larger than i, so working from size/2 down to 1 guarantees they have been heapified first. Going **upwards** breaks the precondition, and the result is not always a heap.

:::theorem buildMaxHeap is O(n)
buildMaxHeap on n values runs in O(n) time, even though it makes about n/2 calls that are each O(log n).
:::

:::proof
A call at a node of height k costs at most c·k. An almost complete tree has at most ⌈n/2^(k+1)⌉ nodes of height k. Adding over all heights:
total ≤ Σₖ (n/2^(k+1)) · c·k = (c·n/2) · Σₖ k/2^k ≤ (c·n/2) · 2 = c·n,
using Σₖ k/2^k = 2. Most nodes are near the bottom, where maxHeapify is cheap; only a few nodes are high enough to cost log n.
:::

The simple bound "n/2 calls × O(log n)" = O(n log n) is **true but not tight**. If an exam asks for an upper bound, both are correct statements; O(n) is the precise one.

## Deleting, inserting and increasing a key

- **deleteMaxHeap (heap, 1)** (Lecture 12): move A[size] to A[1], shrink size, then maxHeapify (heap, 1). It is O(log n). The moved value came from a leaf, so it can only be too small, and moving down fixes it.
- **insertMaxHeap** (Lecture 13): put the new value at A[size + 1], then swap it with its parent while it is larger. The invariant is that the heap is correct everywhere except possibly between the moving value and its parent. It walks one path up: O(log n).
- **increaseKeyMaxHeap** (Lecture 13): a bigger key can only be too big for its position, so it moves up exactly like insert. Insert is really "add −∞ at the end, then increase its key".

:::insight Deleting at an index other than 1
Lecture 12's deleteMaxHeap (heap, i) moves A[size] into A[i] and calls maxHeapify. For i = 1 that is always right. For another i, the value moved in could be **larger** than A[i]'s parent (it came from a different branch), and then it would need to move **up** instead. A fully general delete checks which way to go. The course mostly deletes at index 1, where only moving down is ever needed.
:::

## Heap sort and its cost

Heap sort (Lecture 13): build a max-heap, then repeat n − 1 times: swap A[1] with A[size], shrink size, maxHeapify (1).

:::theorem Heap sort cost
Heap sort is O(n log n) in every case: O(n) to build, plus n − 1 deletions of O(log n) each. It sorts in place, using O(1) extra memory, but it is **not stable**.
:::

Lecture 13's trace on 16 14 10 8 7 9 3 2 4 1 shows the sorted part growing from the right end: after the first step, 16 is in A[10]; after the second, 14 is in A[9]; and so on. A max-heap therefore sorts into **ascending** order.

## Heaps as priority queues (Lecture 14)

| Structure | insert | maximum | extractMax |
|---|---|---|---|
| Unsorted array or list | O(1) | O(n) | O(n) |
| Sorted array | O(n) | O(1) | O(1) from the end |
| Sorted linked list | O(n) | O(1) | O(1) |
| **Max-heap** | **O(log n)** | **O(1)** | **O(log n)** |

The heap is the only structure in the table where nothing costs O(n). That balance is why Dijkstra's algorithm (Part J) uses a min-priority queue built on a min-heap, the mirror image with A[Parent (i)] ≤ A[i].

```cpp example="Checking the max-heap property"
#include <iostream>
using namespace std;

struct MaxHeap {
	int A[1000];
	int size;
};

void maxHeapify (MaxHeap * heap, int i) {
	int left = i * 2, right = i * 2 + 1, largest = i;
	if (left <= heap->size && heap->A[left] > heap->A[largest]) largest = left;
	if (right <= heap->size && heap->A[right] > heap->A[largest]) largest = right;
	if (largest != i) {
		int temp = heap->A[i];
		heap->A[i] = heap->A[largest];
		heap->A[largest] = temp;
		maxHeapify (heap, largest);
	}
}

bool isMaxHeap (MaxHeap * heap) {
	for (int i = 2; i <= heap->size; i++)
		if (heap->A[i / 2] < heap->A[i])
			return false;
	return true;
}

int main () {
	MaxHeap * heap = new MaxHeap;
	int vals[] = {4, 1, 3, 2, 16, 9, 10, 14, 8, 7};    // Lecture 12's array
	heap->size = 10;
	for (int i = 0; i < 10; i++)
		heap->A[i + 1] = vals[i];
	cout << "before: " << (isMaxHeap (heap) ? "a heap" : "not a heap") << endl;
	for (int i = heap->size / 2; i >= 1; i--)
		maxHeapify (heap, i);
	cout << "after buildMaxHeap:";
	for (int i = 1; i <= heap->size; i++)
		cout << " " << heap->A[i];
	cout << endl << "now: " << (isMaxHeap (heap) ? "a heap" : "not a heap") << endl;
	return 0;
}
```

The result, 16 14 10 8 7 9 3 2 4 1, is exactly the heap on Lecture 12's slides.

:::quiz
A max-heap holds 1,000 values. At most how many swaps does inserting one value make?
- [ ] 1,000
- [ ] 500
- [x] 9
- [ ] 1
>> The new value starts at index 1,001 and swaps upwards at most once per level. The heap has height ⌊log₂ 1001⌋ = 9, so there are at most 9 swaps.
:::

:::quiz
Why does buildMaxHeap call maxHeapify from i = size/2 DOWN to 1, rather than from 1 up to size/2?
- [ ] Going down is faster, but both give a heap
- [x] maxHeapify (i) assumes both of i's subtrees are already heaps, and their indexes are bigger than i
- [ ] Indexes above size/2 are not in the array
- [ ] Going up would visit the leaves twice
>> The precondition of maxHeapify is that the children's subtrees are max-heaps. Children have larger indexes, so working downwards from size/2 handles them first. Working upwards can leave the tree not a heap.
:::

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

int main () {
	int A[12] = {0, 16, 14, 10, 8, 7, 9, 3, 2, 4, 1};
	int size = 10;
	int n = 15;
	size = size + 1;
	A[size] = n;
	int i = size;
	int swaps = 0;
	while (i > 1 && A[i / 2] < A[i]) {
		int temp = A[i / 2];
		A[i / 2] = A[i];
		A[i] = temp;
		i = i / 2;
		swaps++;
	}
	for (int k = 1; k <= size; k++)
		cout << A[k] << " ";
	cout << endl << "swaps " << swaps << ", ended at index " << i << endl;
	return 0;
}
```
:::

:::teachback
Explain why buildMaxHeap is O(n) even though it calls an O(log n) function about n/2 times.
>> maxHeapify at a node costs time proportional to that node's height, not the height of the whole tree.
>> About half the nodes are leaves (no work), a quarter have height 1, an eighth height 2, and so on: n Σ k/2^(k+1) work in total.
>> That sum is at most n, so the total is O(n); n/2 × log n is a true but loose upper bound.
:::

:::remember
- From index 1: children 2i and 2i + 1, parent ⌊i/2⌋ (level d starts at 2^d). Height ⌊log₂ n⌋.
- Max at A[1]; leaves are A[n/2 + 1 .. n]; searching a heap is O(n).
- maxHeapify needs both subtrees to be heaps; swap with the largest child; O(log n).
- buildMaxHeap from size/2 down to 1: O(n), with Σ k/2^k = 2.
- Insert and increase key move up; delete at 1 moves down; heap sort is O(n log n), in place, not stable.
:::
