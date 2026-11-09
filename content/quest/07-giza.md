# world: heap
title: The Pyramid of Priorities
place: Giza, Egypt
when: about 2560 BCE
topic: heaps
parts: h
scene: giza
color: #ffd23f
fragment: The Capstone Key
blurb: Heaps and priority queues: heaps in arrays, maxHeapify, buildMaxHeap, extracting the maximum, heap sort, insert, increase key and min-heaps.

## hp-1 | Stones in rows
goal: Store an almost complete tree in an array and find parents and children by index.
lessons: h1-heap-arrays

@scene Giza, Egypt · the Great Pyramid of Khufu at dawn
@say narrator: The Great Pyramid was built for the pharaoh Khufu around 2560 BCE. At about 146 metres, it was the tallest building made by people for nearly four thousand years.
@say marco: "The tallest stone is always on top." That's not even a riddle. That's just how pyramids work.
@say you: It's how heaps work too. Every stone is at least as big as the stones under it, and the biggest is on top.
@learn A heap lives in an array
A **max-heap** is an **almost complete** binary tree where every node's key is **at least as large as its children's**. So the largest key is always at the **root**.

Because the tree is almost complete (filled level by level, left to right), it fits in an array **with no gaps**. The course numbers the array from **1**:

- The root is `A[1]`.
- The **parent** of `A[i]` is `A[i / 2]` (integer division).
- The **left child** of `A[i]` is `A[2i]`, the **right child** is `A[2i + 1]`.
- With n values, the nodes from index n/2 + 1 to n are all leaves.

The heap property, written with indexes: **A[i / 2] ≥ A[i] for every i from 2 to n.**

```cpp
struct MaxHeap {
	int A[1000];
	int size;        // the heap uses A[1] .. A[size]
};
```

Reading the array level by level gives the tree: `16 14 10 8 7 9 3 2 4 1` has root 16, then 14 and 10 on level 1, then 8 7 9 3, then 2 4 1.
@array kind="index" values="16 14 10 8 7 9 3 2 4 1" i="4" ask="left"
The stones are numbered from 1. Click the **left child** of index 4.
@array kind="index" values="16 14 10 8 7 9 3 2 4 1" i="9" ask="parent"
Now click the **parent** of index 9.
@quiz Which array (starting at A[1]) is a max-heap?
- [ ] 10 12 8 4 5
- [x] 20 15 18 8 10 9
- [ ] 20 15 18 16 10 9
- [ ] 5 4 6 1 2
>> Check every i ≥ 2 against A[i / 2]. In 20 15 18 8 10 9 every parent is larger. In the third, A[4] = 16 is larger than its parent A[2] = 15.
@type A heap has 13 values in A[1..13]. What is the index of the last node that has a child?
= 6
>> 13 / 2 = 6. A[6]'s left child is A[12], and A[7]'s left child would be A[14], past the end. Nodes 7 to 13 are leaves.
@relic merer | The diary of Merer | In 2013, archaeologists at Wadi al-Jarf on the Red Sea found the oldest inscribed papyri known: the logbook of an official named Merer, who led a team carrying limestone blocks by boat to Giza for Khufu's pyramid. They show organised, fed and paid crews, not the slaves of old movies.
@journal
- Max-heap: almost complete, and every parent ≥ its children; the maximum is at A[1]
- Indexes from 1: parent i / 2, left 2i, right 2i + 1
- Nodes n/2 + 1 to n are leaves; the heap property is A[i / 2] ≥ A[i] for i = 2..n

## hp-2 | Sinking a stone
goal: Run maxHeapify and buildMaxHeap by hand.
lessons: h2-heapify-build

@scene The quarry · a block is lowered onto the wrong course
@say marco: Somebody put a small stone on top of two bigger ones. The whole layer is wrong.
@say you: Then it has to sink. Swap it with its bigger child, again and again, until it's in place. That's maxHeapify.
@learn maxHeapify and buildMaxHeap
**maxHeapify(heap, i)** fixes one node whose subtrees are already heaps but which may be smaller than its children: swap it with its **larger** child, then carry on from that child, until it is at least as big as both children (or it is a leaf). It walks one path down: **O(log n)**.

```cpp
void maxHeapify (MaxHeap * heap, int i) {
	int left = 2 * i, right = 2 * i + 1, largest = i;
	if (left <= heap->size && heap->A[left] > heap->A[largest])
		largest = left;
	if (right <= heap->size && heap->A[right] > heap->A[largest])
		largest = right;
	if (largest != i) {
		int t = heap->A[i]; heap->A[i] = heap->A[largest]; heap->A[largest] = t;
		maxHeapify (heap, largest);       // keep sinking
	}
}
```

**buildMaxHeap** turns any array into a heap: call maxHeapify on every node that has children, **from n/2 down to 1** (bottom up, so the subtrees are already heaps when a node is fixed):

```cpp
void buildMaxHeap (MaxHeap * heap) {
	for (int i = heap->size / 2; i >= 1; i--)
		maxHeapify (heap, i);
}
```

Surprisingly, buildMaxHeap is **O(n)**, not O(n log n): most nodes are near the bottom and sink only a little.
@heap kind="heapify" values="4 14 10 8 7 9 3 2 1" i="1"
The small stone 4 sits at the top. Run **maxHeapify(1)**: at each step, choose the swap.
>> 4 sinks past 14 and 8: swap with the larger child each time, and stop when it is bigger than its children or is a leaf.
@heap kind="heapify" values="16 4 10 14 7 9 3 2 8 1" i="2"
The lecture's example: run **maxHeapify(2)** on 16 4 10 14 7 9 3 2 8 1.
@type buildMaxHeap runs on an array of 10 values. At which index does its loop start?
= 5
>> It starts at size / 2 = 10 / 2 = 5, the last node with a child, and goes down to 1.
@quiz Why does buildMaxHeap go from n/2 DOWN to 1, not from 1 up?
- [ ] It is faster to count down
- [x] maxHeapify needs both subtrees of a node to be heaps already, so the lower nodes must be fixed first
- [ ] Index 1 is not part of the heap
- [ ] Going up would skip the leaves
>> maxHeapify only works if the node's subtrees are already heaps. Working bottom up guarantees that.
@code ex="heap-heapify"
Write maxHeapify.
@journal
- maxHeapify(i): swap with the LARGER child until in place; one path down: O(log n)
- buildMaxHeap: maxHeapify from size/2 down to 1 (bottom up): O(n)
- The leaves (n/2 + 1 to n) are heaps already and are skipped

## hp-3 | The capstone
goal: Remove the maximum, delete at an index, and sort with a heap.
lessons: h3-delete-heapsort

@scene The top of the pyramid · the capstone is missing
@say narrator: The Great Pyramid's original pointed capstone, the pyramidion, has never been found.
@say silas: (radio crackle) Looking for something on top? I collected it last night. Come and take it, if you can climb fast enough.
@learn heapExtractMax, delete at i, and heap sort
**heapExtractMax** removes the root (the maximum):

1. Save `A[1]`.
2. Move the **last** value `A[size]` to the root, and shrink size by 1.
3. `maxHeapify(heap, 1)` to sink it into place.

Cost: **O(log n)**.

```cpp
int heapExtractMax (MaxHeap * heap) {
	int max = heap->A[1];
	heap->A[1] = heap->A[heap->size];
	heap->size--;
	maxHeapify (heap, 1);
	return max;
}
```

**Deleting the value at index i** works the same way: move the last value into position i, shrink, and fix it (sink it with maxHeapify, or if it is bigger than its new parent, float it up).

**Heap sort:** build a max-heap, then repeatedly swap the root (the largest) with the last value of the heap, shrink the heap by one, and maxHeapify(1). The largest values collect at the end of the array in sorted order. **O(n log n)**, in place, but not stable.
@heap kind="extract" values="16 14 10 8 7 9 3 2 4 1"
Take the capstone: run **heapExtractMax**. The last value moves to the top; then you sink it.
@predict One pass of heap sort. What does this print?
```cpp
#include <iostream>
using namespace std;

int A[11] = {0, 16, 14, 10, 8, 7, 9, 3, 2, 4, 1};
int n = 10;

void heapify (int i, int size) {
	int l = 2 * i, r = 2 * i + 1, big = i;
	if (l <= size && A[l] > A[big]) big = l;
	if (r <= size && A[r] > A[big]) big = r;
	if (big != i) {
		int t = A[i]; A[i] = A[big]; A[big] = t;
		heapify (big, size);
	}
}

int main() {
	for (int last = n; last >= n - 1; last--) {
		int t = A[1]; A[1] = A[last]; A[last] = t;
		heapify (1, last - 1);
	}
	for (int i = 1; i <= n; i++)
		cout << A[i] << " ";
	cout << endl;
	return 0;
}
```
>> Two passes of heap sort: 16 swaps to the end and 1 sinks (14, 8, 4 move up); then 14 swaps to position 9 and the new root sinks. The two largest values, 14 and 16, are now in place at the end.
@quiz After heapExtractMax on the heap 50 30 40 10 20 35, what is the array?
- [ ] 35 30 40 10 20
- [ ] 40 35 30 10 20
- [x] 40 30 35 10 20
- [ ] 30 40 35 10 20
>> 50 is removed and the last value, 35, goes to the root: 35 30 40 10 20. 35 < 40, so it swaps with 40: 40 30 35 10 20.
@code ex="heap-extract"
Write heapExtractMax.
@journal
- heapExtractMax: save A[1], move A[size] to the root, size--, maxHeapify(1): O(log n)
- Delete at i: move the last value to i, shrink, then sink it or float it up
- Heap sort: build, then swap root with the end, shrink, heapify, repeat: O(n log n), in place, not stable

## hp-4 | Rising stones
goal: Insert into a heap, increase a key, and run a priority queue; know min-heaps.
lessons: h4-insert-priority, h5-deep-heaps

@scene The Valley Temple · the race to the top
@say marco: He's climbing the north face! We take the south. Every time you find a higher ledge, swap up.
@learn Insert, increase key, priority queues and min-heaps
**insertMaxHeap** puts the new value in the next free slot (`A[size + 1]`, the leftmost gap on the bottom level), then **floats it up**: while it is bigger than its parent, swap them. **O(log n)**.

```cpp
void insertMaxHeap (MaxHeap * heap, int key) {
	heap->size++;
	int i = heap->size;
	heap->A[i] = key;
	while (i > 1 && heap->A[i / 2] < heap->A[i]) {
		int t = heap->A[i]; heap->A[i] = heap->A[i / 2]; heap->A[i / 2] = t;
		i = i / 2;
	}
}
```

**increaseKey(i, key)** raises `A[i]` to a bigger key and floats it up the same way.

A **max-priority queue** serves the most important item first. A max-heap gives every operation cheaply:

| Operation | Cost |
|---|---|
| maximum (look at A[1]) | O(1) |
| extractMax | O(log n) |
| insert | O(log n) |
| increaseKey | O(log n) |

Uses: hospital triage, scheduling the next job, the next event in a simulation, and Dijkstra's and Prim's algorithms (with a **min**-priority queue).

A **min-heap** flips every comparison: every parent is **at most** its children, so the **smallest** key is at the root.
@heap kind="insert" values="16 14 10 8 7 9 3 2 4 1" x="15"
Climb! Insert **15** into the heap: it starts in the next free slot, then you decide whether it floats up.
>> 15 starts at index 11 under 7, swaps up past 7 and 14, and stops under 16.
@heap kind="insert" values="1 3 6 5 9 8" x="2" min="1"
This is a **min-heap** (smallest on top). Insert **2**: it floats up while it is SMALLER than its parent.
@quiz Which is the cost of finding the maximum in a max-heap, and of removing it?
- [x] O(1) to find it, O(log n) to remove it
- [ ] O(log n) for both
- [ ] O(n) to find it, O(1) to remove it
- [ ] O(1) for both
>> The maximum is always A[1]. Removing it needs a maxHeapify down one path: O(log n).
@code ex="heap-insert"
Write insertMaxHeap.
@say narrator: You reach the summit first. In a cleft in the top stones, where the capstone once sat, lies a key shaped like a small golden pyramid, and a strip of paper with a column of numbers... and **a cipher**.
@say marco: A cipher? Who uses ciphers anymore?
@say you: Codebreakers. The professor wrote "Bletchley" in the margin. England.
@boss
The Heap Titan always keeps the biggest at the top. Heapify it, or be crushed. Beat it with exam-style heap questions.
@journal
- Insert: put the key in A[size + 1], float it up while bigger than its parent: O(log n)
- increaseKey floats up the same way; extractMax and insert make a max-priority queue
- Min-heap: every parent ≤ its children; the smallest is at the root
