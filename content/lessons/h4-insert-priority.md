---
title: Insert, increase key and priority queues
summary: A new value goes in the first free slot at the end, then swaps with its parent until the parent is larger. Increasing a key moves a value up the same way. With these, a heap becomes a priority queue that always gives you the most important item first.
lectures: Lectures 13–14
goals:
  - Trace insertMaxHeap and increaseKeyMaxHeap by hand
  - Explain why a new value goes at index size + 1
  - List the max-priority queue operations and the heap function behind each
  - State the running time of every heap operation
labs: [heap]
---

## insertMaxHeap: bubbling up

The heap must stay almost complete, so the only place a new node can go is the next free slot: index **size + 1**, the leftmost gap on the lowest level. It may be larger than its parent, so it moves **up**: while it is larger than its parent, swap them.

```cpp norun
void insertMaxHeap (MaxHeap * heap, int n) {
	heap->size = heap->size + 1;         // one more, so add 1
	heap->A[heap->size] = n;             // insert at end
	int i = heap->size;
	while (i > 1 && heap->A[i/2] < heap->A[i]) {
		int temp = heap->A[i/2];         // swap with parent
		heap->A[i/2] = heap->A[i];
		heap->A[i] = temp;
		i = i / 2;                       // i is now parent
	}
}
```

The test `i > 1` stops at the root, which has no parent.

:::steps
Insert 20 into 16 14 10 8 7 9 3 2 4 1:
1. size becomes 11 and A[11] = 20.
2. Parent of 11 is 5 (value 7). 7 < 20, swap: 20 is now at 5.
3. Parent of 5 is 2 (value 14). 14 < 20, swap: 20 is now at 2.
4. Parent of 2 is 1 (value 16). 16 < 20, swap: 20 is now at 1. i = 1, so stop.
Result: 20 16 10 8 14 9 3 2 4 1 7.
:::

:::diagram heap 20 16 10 8 14 9 3 2 4 1 7
After inserting 20: it climbed all the way to the root.
:::

If instead 12 were inserted into 16 14 10 8 7 9 3 2 4 1, it would swap with 7 at index 5 and then stop below 14, giving 16 14 10 8 12 9 3 2 4 1 7 (the lecture's other picture).

Each swap moves up one level, so insert is **O(log n)**.

## increaseKeyMaxHeap

Making a value **larger** can only break the heap property with its **parent**, never with its children (they were already smaller than the old value). So the fix is the same climb:

```cpp norun
void increaseKeyMaxHeap (MaxHeap * heap, int i, int key) {
	heap->A[i] = key;                    // change key
	while (i > 1 && heap->A[i/2] < heap->A[i]) {
		int temp = heap->A[i/2];         // swap with parent
		heap->A[i/2] = heap->A[i];
		heap->A[i] = temp;
		i = i / 2;                       // i is now parent
	}
}
```

The lecture notes that insert "could be rewritten using increaseKeyMaxHeap": add a new slot at the end with a very small value, then increase it to n.

```cpp example="insertMaxHeap and increaseKeyMaxHeap"
#include <iostream>
using namespace std;

struct MaxHeap {
	int A [1000];
	int size;
};

void insertMaxHeap (MaxHeap * heap, int n) {
	heap->size = heap->size + 1;
	heap->A[heap->size] = n;
	int i = heap->size;
	while (i > 1 && heap->A[i/2] < heap->A[i]) {
		int temp = heap->A[i/2];
		heap->A[i/2] = heap->A[i];
		heap->A[i] = temp;
		i = i / 2;
	}
}

void increaseKeyMaxHeap (MaxHeap * heap, int i, int key) {
	heap->A[i] = key;
	while (i > 1 && heap->A[i/2] < heap->A[i]) {
		int temp = heap->A[i/2];
		heap->A[i/2] = heap->A[i];
		heap->A[i] = temp;
		i = i / 2;
	}
}

void printHeap (MaxHeap * heap) {
	for (int i = 1; i <= heap->size; i++)
		cout << heap->A[i] << " ";
	cout << endl;
}

int main() {
	MaxHeap * heap = new MaxHeap;
	heap->size = 0;
	int values[] = {16, 14, 10, 8, 7, 9, 3, 2, 4, 1};
	for (int i = 0; i < 10; i++)
		insertMaxHeap (heap, values[i]);
	printHeap (heap);
	increaseKeyMaxHeap (heap, 9, 15);
	printHeap (heap);
	insertMaxHeap (heap, 20);
	printHeap (heap);
	delete heap;
	return 0;
}
```

Inserting the values one at a time is another way to build a heap. It is O(n log n), and it can give a different (but still valid) heap from buildMaxHeap.

:::mistake
Using increaseKeyMaxHeap to make a key **smaller**. A smaller value may now be smaller than its children, and the loop only looks upwards. To decrease a key in a max-heap, store it and call maxHeapify at that index instead.
:::

## Priority queues

A **max-priority queue** keeps a set of items, each with a key (its priority), and supports:

| Operation | Meaning | Heap function | Time |
|---|---|---|---|
| insert (S, x) | add x | insertMaxHeap | O(log n) |
| maximum (S) | look at the largest | return A[1] | O(1) |
| extractMax (S) | remove and return the largest | heapExtractMax | O(log n) |
| increaseKey (S, x, k) | raise x's key to k | increaseKeyMaxHeap | O(log n) |

The lectures build it directly on a max-heap:

```cpp norun
struct MaxPriorityQueue {
	MaxHeap * heap;
};

void insert (MaxPriorityQueue * mpq, int x);
int maximum (MaxPriorityQueue * mpq);
int extractMax (MaxPriorityQueue * mpq);
void increaseKey (MaxPriorityQueue * mpq, int x, int key);
```

Each function just passes `mpq->heap` to the matching heap function. A **min-priority queue** uses a min-heap and offers minimum, extractMin and decreaseKey. Dijkstra's shortest path algorithm (Part J) uses one to pick the closest vertex each time.

:::parsons Put the lines of insertMaxHeap in order.
void insertMaxHeap (MaxHeap * heap, int n) {
	heap->size = heap->size + 1;
	heap->A[heap->size] = n;
	int i = heap->size;
	while (i > 1 && heap->A[i/2] < heap->A[i]) {
		int temp = heap->A[i/2];
		heap->A[i/2] = heap->A[i];
		heap->A[i] = temp;
		i = i / 2;
	}
}
~	while (i > 1 && heap->A[i/2] > heap->A[i]) {
:::


:::remember
Why not a sorted list? Inserting into a sorted list is O(n). A heap makes both insert and extractMax O(log n), and maximum O(1).
:::

:::teachback
Explain how a new key is inserted into a max-heap, and why it moves up instead of down.
>> Increase size and put the key at A[size], the next free place, which keeps the tree almost complete.
>> The only place the heap property can now be broken is between the new key and its parent.
>> While its parent (at i / 2) is smaller, swap them and move up: i = i / 2.
>> At most one swap per level, so insertion is O(log n); a max-priority queue's insert and increaseKey work this way.
:::

:::quiz
5 is inserted into the max-heap 9 7 8 3 4 6. What is the result?
- [x] 9 7 8 3 4 6 5
- [ ] 9 7 8 3 4 5 6
- [ ] 9 7 5 3 4 6 8
- [ ] 9 8 7 3 4 6 5
>> 5 goes to index 7. Its parent is index 3, holding 8. 8 is not smaller than 5, so the loop stops at once and nothing moves.
:::

:::quiz
In the max-heap 30 20 25 10 15 18 22, A[4] (10) is increased to 35. What is the result?
- [x] 35 30 25 20 15 18 22
- [ ] 30 35 25 20 15 18 22
- [ ] 35 20 25 30 15 18 22
- [ ] 35 30 22 20 15 18 25
>> 35 at index 4 is larger than its parent at 2 (20): swap, giving 30 35 25 20 15 18 22. At index 2 it is larger than its parent at 1 (30): swap, giving 35 30 25 20 15 18 22. It is now the root.
:::

:::quiz
Which heap operation is O(1)?
- [ ] insert
- [ ] extractMax
- [x] maximum
- [ ] increaseKey
>> The maximum of a max-heap is always A[1], so reading it takes constant time. The others move a value up or down the tree: O(log n).
:::

:::exam
Every heap operation is one of two moves. A value that may be **too small** for its place sinks with maxHeapify (extract, delete, build). A value that may be **too large** climbs with the parent loop (insert, increase key). Decide which, then trace it.
:::
