---
title: Performance and big-O
summary: Big-O describes how the number of steps grows as the input grows. Learn to read it from code (loops, halving, recursion), and learn the cost of every operation on every structure in the course, all in one table.
lectures: Lectures 11, 14, 19–21
goals:
  - Explain what O(1), O(log n), O(n), O(n log n) and O(n²) mean in plain words
  - Work out the big-O of a loop or a recursive function
  - State the best and worst case of every list, tree, heap, hashing and sorting operation
labs: [bst, sort]
---

## Counting steps, not seconds

Different computers run at different speeds, so we do not measure time in seconds. Instead we ask: **if the input gets bigger, how many more steps does the code take?** The input size is called **n** (the number of nodes, keys or array values).

Big-O keeps only the part that grows fastest and ignores constant factors:

- 3n + 5 steps is **O(n)**: doubling n roughly doubles the work.
- n²/2 + n is **O(n²)**: doubling n roughly multiplies the work by 4.
- 7 steps, whatever n is, is **O(1)**: constant time.

## The common growth rates

| Big-O | Name | n = 1 000 | Typical code |
|---|---|---|---|
| O(1) | constant | 1 | insertAtHead, maximum of a heap, A[i] |
| O(log n) | logarithmic | about 10 | search a well-shaped BST, heap insert or extract |
| O(n) | linear | 1 000 | one loop over a list or array |
| O(n log n) | "n log n" | about 10 000 | merge sort, heap sort |
| O(n²) | quadratic | 1 000 000 | a loop inside a loop: selection, bubble, insertion sort |

## Where log n comes from

**log₂ n is the number of times you can halve n before reaching 1.** Halving 1 000 takes about 10 steps; halving a million takes about 20. Any algorithm that throws away half of what is left at each step is O(log n):

- each comparison in a well-shaped BST discards a whole subtree (about half the tree);
- a heap's height is log₂ n, and insert or extract moves one level per step.

## Reading big-O from code

```cpp example="Counting the steps of loops"
#include <iostream>
using namespace std;

int main() {
	int n = 100;
	int one = 0, two = 0, half = 0;
	for (int i = 0; i < n; i++)
		one++;                          // runs n times: O(n)
	for (int i = 0; i < n; i++)
		for (int j = 0; j < n; j++)
			two++;                      // runs n * n times: O(n squared)
	for (int k = n; k > 1; k = k / 2)
		half++;                         // halves each time: O(log n)
	cout << one << " " << two << " " << half << endl;
	return 0;
}
```

Rules of thumb:

- One loop over n items: **O(n)**.
- A loop inside a loop, each over n items: **O(n²)**. (Even if the inner loop runs fewer times, like j from i + 1 to n, the total n(n − 1)/2 is still O(n²).)
- A loop that halves (or doubles) its counter: **O(log n)**.
- Two loops one **after** the other: add them, O(n) + O(n) = O(n).
- A recursive function that visits every node of a list or tree once: **O(n)**.
- A recursive function that goes down one path of a tree: **O(h)**, the height.

## Best, average and worst case

The same operation can be fast or slow depending on the data. `contains` on a list is O(1) if the key is in the first node (best case), but O(n) if it is missing (worst case). On average it checks about n/2 nodes, which is still O(n). Exam questions usually ask for the **worst case** unless they say otherwise.

## The whole course in one table

| Structure | Operation | Best | Worst |
|---|---|---|---|
| Array (unsorted) | access A[i] | O(1) | O(1) |
| | search | O(1) | O(n) |
| | insert or delete in the middle | O(1) | O(n), shifting |
| Linked list | insert at head, delete at head | O(1) | O(1) |
| | insert at tail (no tail pointer) | O(n) | O(n) |
| | search, delete a key | O(1) | O(n) (n/2 on average) |
| Binary tree | search (preOrderContains) | O(1) | O(n) |
| | any traversal | O(n) | O(n) |
| BST (height h) | search, insert, delete | O(h) = O(log n) for a well-shaped tree | O(n), degenerate tree |
| | minimum, maximum, successor | O(h) | O(n) |
| Max-heap | maximum | O(1) | O(1) |
| | insert, extractMax, increaseKey, maxHeapify | O(log n) | O(log n) |
| | buildMaxHeap | O(n) | O(n) (at most n/2 heapify calls) |
| | search for a value | O(1) | O(n) |
| Hash table | insert, search, delete | O(1) | O(n), when many keys collide |

| Sort | Best | Average | Worst |
|---|---|---|---|
| Selection sort | O(n²) | O(n²) | O(n²) |
| Bubble sort | O(n²) | O(n²) | O(n²) |
| Insertion sort | O(n), already sorted | O(n²) | O(n²) |
| Heap sort | O(n log n) | O(n log n) | O(n log n) |
| Merge sort | O(n log n) | O(n log n) | O(n log n) |
| Quick sort | O(n log n) | O(n log n) | O(n²) |

:::remember
The lecture's summary for **search**: arrays O(n), linked lists O(n), binary trees O(n), binary search trees O(log₂ n), heaps O(n), and the motivation for hashing: "Is it possible to have a data structure where searching for a key takes O(1) or constant time?"
:::

:::teachback
Explain how you work out the big-O of a piece of code, and give the big-O of searching an array, a BST and a heap.
>> Find the loop or path that does the work, count how many times it runs in terms of n, and keep only the fastest-growing part.
>> One loop over n items is O(n), a loop inside a loop O(n²), and halving each time O(log n).
>> Searching an array or a heap is O(n).
>> Searching a BST is O(h): about log2 n when well shaped, n in the worst case.
:::

:::quiz
What is the big-O of this function, where n is the number of nodes?
```cpp norun
int f (Node * top) {
	int count = 0;
	for (Node * p = top; p != NULL; p = p->next)
		for (Node * q = p; q != NULL; q = q->next)
			count++;
	return count;
}
```
- [ ] O(n)
- [x] O(n²)
- [ ] O(n log n)
- [ ] O(log n)
>> For each node p, the inner loop walks from p to the end: n + (n − 1) + ... + 1 = n(n + 1)/2 steps in total, which is O(n²).
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int main() {
	int count = 0;
	for (int k = 64; k >= 1; k = k / 2)
		count++;
	cout << count << endl;
	return 0;
}
```
- [ ] 6
- [x] 7
- [ ] 32
- [ ] 64
>> k takes the values 64, 32, 16, 8, 4, 2, 1: seven values. log₂ 64 = 6 halvings, plus the first pass.
:::

:::quiz
A BST was built by inserting 1, 2, 3, ..., n in order. What is the worst-case cost of searching it?
- [ ] O(1)
- [ ] O(log n)
- [x] O(n)
- [ ] O(n²)
>> Sorted input makes a degenerate tree with height n − 1, so a search can pass every node.
:::

:::quiz
Which operation is O(1) on its data structure?
- [ ] Inserting at the tail of a linked list with only a top pointer
- [ ] Extracting the maximum from a max-heap
- [x] Inserting at the head of a linked list
- [ ] Searching a binary search tree
>> insertAtHead does the same three steps however long the list is. Inserting at the tail must first walk to the end (O(n)), extractMax is O(log n), and BST search is O(h).
:::

:::exam
For a performance question: (1) find the loop or the path that does the work, (2) count how many times it runs in terms of n (or h), (3) keep only the fastest-growing part. Learn the table above; the exam's four performance questions come straight from it.
:::
