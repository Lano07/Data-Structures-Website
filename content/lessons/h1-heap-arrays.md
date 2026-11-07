---
title: Heaps stored in arrays
summary: A max-heap is an almost complete binary tree where every parent is at least as large as its children, so the largest value is always at the root. Because the tree has no gaps, it is stored in an ordinary array, and parent and children are found with arithmetic.
lectures: Lectures 11–12, 14
goals:
  - State the max-heap property and the min-heap property
  - Convert between the tree drawing and the array, in both directions
  - Use Parent(i) = i / 2, Left(i) = 2i and Right(i) = 2i + 1
  - Explain why location 0 is not used, and what `size` means
labs: [heap]
---

## What a heap is

A **max-heap** is a binary tree with two properties:

1. **Shape:** it is an **almost complete** binary tree (every level full except possibly the lowest, which is filled from the left).
2. **Order (the max-heap property):** every node's value is **greater than or equal to** its children's values. Written with array indexes: **A[Parent(i)] ≥ A[i]**.

So the largest value is always at the root. Unlike a BST, there is no rule about left versus right: a left child can be smaller or larger than its sibling.

:::diagram heap 16 14 10 8 7 9 3 2 4 1
The max-heap from the lectures, as a tree and as an array. The small numbers beside the nodes are array indexes.
:::

## From tree to array

Number the nodes level by level, left to right, starting at **1** for the root. Each node's number is its index in the array. Because the tree is almost complete, the numbers have no gaps, so every array location 1 to n is used.

| Index i | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| A[i] | 16 | 14 | 10 | 8 | 7 | 9 | 3 | 2 | 4 | 1 |

## Moving around with arithmetic

With the root at index 1, the family of node i is:

- **Parent(i) = i / 2** (integer division, so 5 / 2 = 2; the slides write this as floor (i/2), which means the same thing)
- **Left(i) = 2i**
- **Right(i) = 2i + 1**

Check it on the heap: node 2 (value 14) has children at 4 and 5 (values 8 and 7), and its parent is at 2 / 2 = 1 (value 16). Node 5 has its parent at 5 / 2 = 2.

:::why
Why start at 1 and leave location 0 unused? With the root at 1, the formulas are the simple ones above. (With the root at 0 they become 2i + 1, 2i + 2 and (i − 1) / 2, which are easier to get wrong.) The lectures leave A[0] empty.
:::

A child index larger than the number of values means that child does not exist. In a heap with 10 values, node 5 has a left child at 10 but no right child (11 > 10). Nodes 6 to 10 have no children at all: in any heap of n values, **the leaves are at indexes n / 2 + 1 up to n**.

## The struct

```cpp norun
struct MaxHeap {
	int A [1000];
	int size;
};

MaxHeap * heap;
```

`A` has room for many values, but only `A[1]` to `A[size]` are part of the heap. `size` is the number of values currently in it. Everything from `A[size + 1]` on is ignored, even if old values are still stored there.

Finding the maximum is now trivial:

```cpp norun
int maximum (MaxHeap * heap) {
	return heap->A[1];
}
```

That is **O(1)**, the main reason heaps exist. (The caller must make sure the heap is not empty, `heap->size ≥ 1`.)

```cpp example="Moving around a heap with i / 2, 2i, 2i + 1"
#include <iostream>
using namespace std;

struct MaxHeap {
	int A [1000];
	int size;
};

int main() {
	int values[] = {16, 14, 10, 8, 7, 9, 3, 2, 4, 1};
	MaxHeap * heap = new MaxHeap;
	for (int i = 0; i < 10; i++)
		heap->A[i + 1] = values[i];
	heap->size = 10;
	cout << "maximum: " << heap->A[1] << endl;
	int i = 5;
	cout << "node " << i << " holds " << heap->A[i] << ", its parent holds " << heap->A[i / 2] << endl;
	cout << "its left child holds " << heap->A[2 * i] << endl;
	if (2 * i + 1 > heap->size)
		cout << "it has no right child" << endl;
	cout << "the leaves are at " << heap->size / 2 + 1 << " to " << heap->size << endl;
	delete heap;
	return 0;
}
```

## Min-heaps

A **min-heap** reverses the order rule: **A[Parent(i)] ≤ A[i]**, so the smallest value is at the root.

:::diagram heap 1 2 5 4 7 9 10 8 16
The min-heap from Lecture 14. The smallest value is at index 1. The largest value is somewhere among the leaves.
:::

## A heap is not a sorted array

The heap property only compares parents with children. Siblings and cousins can be in any order, so the array is usually **not** sorted, and an inorder traversal of a heap means nothing. Searching a heap for a given value is therefore **O(n)**: the heap order cannot tell you which side to look on.

:::mistake
Thinking the second largest value must be at index 2. It is one of the root's children, at index 2 **or** 3. In the heap above, the second largest is 14 at index 2, but the heap 16 10 14 ... is also valid, with 14 at index 3.
:::

:::teachback
Explain how a max-heap is stored in an array, how to find a node's parent and children, and where the largest value is.
>> A heap is an almost complete binary tree, so its nodes fit in an array level by level, left to right, starting at index 1 (index 0 is not used).
>> The parent of index i is i / 2 (integer division).
>> The children of index i are 2i and 2i + 1.
>> Every parent is at least as large as its children, so the largest value is at A[1].
:::

:::quiz
In the max-heap 16 14 10 8 7 9 3 2 4 1, what is the parent of the value 9, and what are its children?
- [ ] Parent 14; children 2 and 4
- [x] Parent 10; no children
- [ ] Parent 16; children 3 and 2
- [ ] Parent 10; children 4 and 1
>> 9 is at index 6. Its parent is at 6 / 2 = 3, which holds 10. Its children would be at 12 and 13, but the heap only has 10 values, so 9 is a leaf.
:::

:::quiz
Which array (from index 1) is a valid max-heap?
- [ ] 10 8 9 7 9 3
- [x] 20 15 18 9 15 18 4
- [ ] 20 15 18 16 4
- [ ] 5 10 15 20
>> Check A[i / 2] ≥ A[i] for every i ≥ 2. In the first, A[5] = 9 > A[2] = 8. In the third, A[4] = 16 > A[2] = 15. The fourth is a min-heap. In the second, every parent is at least as large as its children (equal values are allowed).
:::

:::quiz
A max-heap holds 20 values. Which indexes hold leaves?
- [ ] 1 to 10
- [x] 11 to 20
- [ ] 10 to 20
- [ ] 16 to 20
>> Node i has a left child only if 2i ≤ 20, that is i ≤ 10. So nodes 11 to 20 (= n / 2 + 1 to n) have no children.
:::

:::exam
Heap questions often give an array and ask about the tree, or the other way round. Write the indexes above the values, then use i / 2, 2i and 2i + 1. Remember the heap starts at index 1.
:::
