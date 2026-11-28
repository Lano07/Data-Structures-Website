# Whole-course revision papers for the final exam: original questions written for this site, in the short-answer style of the
# coursework exams (4 questions, 40 marks, 90 minutes). The official final exam's format may differ. None is from a UWI past paper.
# Q1 pointers, recursion and linked lists (10), Q2 trees, BSTs and heaps (10), Q3 hashing and graphs (10), Q4 sorting, searching
# and performance (10). Each part is a block; parts with the same paper and q form one question. Code answers are compiled and run
# with g++ at build time, and every trace was checked by a script that follows the course's algorithms.
# area: core, trees, hashgraph, sortperf

=== fin-1-1a
paper: F1
q: 1
part: a
area: core
topic: cpp
type: trace
marks: 3
minutes: 6
lessons: b1-addresses
--- stem
This question uses pointers, recursion and the course's linked list node, `struct Node { int data; Node * next; };`, with `createNode (n)` returning a new node that holds `n` and points to `NULL`.
--- question
What does this code print? Explain each change.

```cpp
int a = 5, b = 8;
int * p = &a;
int * q = &b;
*p = *q + 2;
q = p;
*q = *q * 3;
cout << a << " " << b << " " << *p << " " << *q << endl;
```
--- rubric
1 | *p = *q + 2 writes through p, so a becomes 8 + 2 = 10.
1 | q = p makes q point to a as well, so *q = *q * 3 makes a 30, and b is never changed (8).
1 | Output: 30 8 30 30 (both *p and *q are a).
--- answer
| Line | What changes |
|---|---|
| `int * p = &a;` `int * q = &b;` | p points to a, q points to b |
| `*p = *q + 2;` | the value p points to (a) becomes the value q points to (b, 8) plus 2: **a = 10** |
| `q = p;` | q now holds the same address as p: **both point to a**; b is untouched |
| `*q = *q * 3;` | a becomes 10 × 3: **a = 30** |

Output: **30 8 30 30**. `*p` and `*q` both name a, so they both print 30.
--- mistakes
- Thinking `q = p` copies the value (making b 10): it copies the **address**, so q now points to a.
- Changing b in the last line: after `q = p`, `*q` is a.
--- format
A short table with one row per line, saying what each pointer points to and which variable changes, then the output.

=== fin-1-1b
paper: F1
q: 1
part: b
area: core
topic: recursion
type: code
marks: 3
minutes: 7
lessons: d2-recursion-lists
--- question
Write a **recursive** function `countEven` that returns how many nodes of a linked list hold an even value. Do not use a loop.

```cpp
int countEven (Node * top);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Base case: an empty list (top == NULL) returns 0.
1 | Recursive case calls countEven on the rest of the list (top->next), with no loop.
1 | Adds 1 only when top->data is even (top->data % 2 == 0).
--- answer
```cpp
int countEven (Node * top) {
	if (top == NULL)
		return 0;
	if (top->data % 2 == 0)
		return 1 + countEven (top->next);
	return countEven (top->next);
}
```

A list is a first node followed by a smaller list. The count for the whole list is the count for the rest of it, plus 1 if the first value is even. The empty list is the base case that stops the recursion. Cost: one call per node, O(n).
--- mistakes
- No base case, or testing `top->next == NULL` first, which follows a NULL pointer on an empty list.
- Writing a while loop: the question asks for recursion.
- Forgetting to return the recursive call's result.
--- format
Base case first, then the recursive case. Name the "rest of the list" in a comment: it shows you know why recursion works here.
--- check
int main () {
	int v[] = {4, 7, 10, 3, 8};
	Node * top = NULL;
	for (int i = 4; i >= 0; i--) { Node * x = createNode (v[i]); x->next = top; top = x; }
	cout << countEven (top) << " " << countEven (NULL) << " " << countEven (createNode (5)) << endl;
	return 0;
}
--- expect
3 0 0

=== fin-1-1c
paper: F1
q: 1
part: c
area: core
topic: recursion
type: trace
marks: 4
minutes: 8
lessons: d1-how-recursion-works
--- question
```cpp
int mystery (int n) {
	if (n <= 1)
		return 1;
	return mystery (n - 1) + mystery (n - 2);
}
```

(i) What does `mystery (5)` return? (ii) How many calls of `mystery` are made in total when `main` calls `mystery (5)` (count that first call too)? (iii) Why does this function become very slow as n grows?
--- rubric
1 | The base cases: mystery(0) and mystery(1) both return 1 (n <= 1).
1 | (i) mystery(5) = 8: the values for n = 0 to 5 are 1, 1, 2, 3, 5, 8.
1 | (ii) 15 calls in total (from a recursion tree, or calls(n) = 1 + calls(n − 1) + calls(n − 2) with calls(0) = calls(1) = 1).
1 | (iii) The same values are worked out again and again (mystery(3) twice, mystery(2) three times), so the number of calls grows exponentially.
--- answer
**(i) 8.** Working up from the base cases: mystery(0) = 1, mystery(1) = 1, mystery(2) = 1 + 1 = 2, mystery(3) = 2 + 1 = 3, mystery(4) = 3 + 2 = 5, mystery(5) = 5 + 3 = **8**.

**(ii) 15 calls.** Each call with n ≥ 2 makes two more. Counting the call itself: calls(0) = calls(1) = 1, calls(2) = 1 + 1 + 1 = 3, calls(3) = 1 + 3 + 1 = 5, calls(4) = 1 + 5 + 3 = 9, calls(5) = 1 + 9 + 5 = **15**. A recursion tree with mystery(5) at the root has 15 nodes.

**(iii)** The two calls repeat each other's work: mystery(5) calls mystery(4) and mystery(3), but mystery(4) calls mystery(3) again, and so on down. The tree almost doubles with each step up in n, so the number of calls grows **exponentially**. (A loop that keeps the last two values would be O(n).)
--- mistakes
- Stopping at mystery(1) and forgetting that mystery(0) is also called (from mystery(2)).
- Counting only the calls that are not base cases.
--- format
Show the values from n = 0 up, and either the recursion tree or the calls formula. One sentence for (iii) naming the repeated work.

=== fin-1-2a
paper: F1
q: 2
part: a
area: trees
topic: bst
type: trace
marks: 3
minutes: 6
lessons: g2-insert-search, f1-terminology, f4-level-order-types
--- stem
This question uses binary trees, binary search trees and max-heaps stored in an array from index 1, as in the course: `struct BTNode { int data; BTNode * left; BTNode * right; };` and `struct MaxHeap { int A [100]; int size; };`.
--- question
The keys **30, 15, 45, 10, 20, 40, 50, 18, 25** are inserted in that order into an empty BST. Give its **level order** traversal, its **height**, and its **weight** (number of leaves).
--- rubric
1 | The tree (30 at the root; 15 and 45; 10, 20, 40, 50; 18 and 25 under 20), with level order 30 15 45 10 20 40 50 18 25.
1 | Height 3: the longest path from the root to a leaf, 30 → 15 → 20 → 18, has 3 edges.
1 | Weight 5: the leaves are 10, 18, 25, 40 and 50.
--- answer
:::diagram tree bst:30 15 45 10 20 40 50 18 25
The BST.
:::

- **Level order** (level by level, left to right): 30 15 45 10 20 40 50 18 25.
- **Height 3**: height counts edges on the longest root-to-leaf path, 30 → 15 → 20 → 18 (or → 25).
- **Weight 5**: the leaves are 10, 18, 25, 40 and 50.
--- mistakes
- Counting nodes on the path (4) instead of edges (3).
- Giving the preorder (30 15 10 20 18 25 45 40 50) instead of the level order.
--- format
Draw the tree, then give the three answers, each labelled.

=== fin-1-2b
paper: F1
q: 2
part: b
area: trees
topic: trees
type: code
marks: 3
minutes: 6
lessons: f3-tree-code
--- question
Write a **recursive** function `sumLeaves` that returns the sum of the values held in the **leaves** of a binary tree (0 for an empty tree).

```cpp
int sumLeaves (BTNode * root);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; };
BTNode * createBTNode (int data) { BTNode * newNode = new BTNode; newNode->data = data; newNode->left = NULL; newNode->right = NULL; return newNode; }
BTNode * insertBST (BTNode * root, int key) { if (root == NULL) return createBTNode (key); if (key < root->data) root->left = insertBST (root->left, key); else if (key > root->data) root->right = insertBST (root->right, key); return root; }
--- rubric
1 | An empty tree returns 0.
1 | A leaf (both children NULL) returns its own data.
1 | Any other node returns sumLeaves of the left subtree plus sumLeaves of the right subtree.
--- answer
```cpp
int sumLeaves (BTNode * root) {
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return root->data;
	return sumLeaves (root->left) + sumLeaves (root->right);
}
```

Only leaves contribute their values; inner nodes just add up what their subtrees return. Each node is visited once: O(n). For the tree in part (a) it returns 10 + 18 + 25 + 40 + 50 = 143.
--- mistakes
- Adding `root->data` for every node (that sums the whole tree).
- Testing for a leaf before checking for NULL, which follows a NULL pointer.
--- format
Three cases in order: empty, leaf, other. Write the leaf test with both children in full.
--- check
int main () {
	BTNode * root = NULL;
	int keys[] = {30, 15, 45, 10, 20, 40, 50, 18, 25};
	for (int i = 0; i < 9; i++)
		root = insertBST (root, keys[i]);
	cout << sumLeaves (root) << " " << sumLeaves (createBTNode (7)) << " " << sumLeaves (NULL) << endl;
	return 0;
}
--- expect
143 7 0

=== fin-1-2c
paper: F1
q: 2
part: c
area: trees
topic: heaps
type: trace
marks: 4
minutes: 8
lessons: h4-insert-priority
--- question
Starting from an **empty** max-heap, `insertMaxHeap` is called with **40, 25, 60, 10, 35, 70**, in that order. Show the array after each insertion.
--- rubric
1 | 40, then 40 25 (25 is smaller than its parent, so no swap).
1 | 60 climbs to the root: 60 25 40; then 10 joins at index 4: 60 25 40 10.
1 | 35 swaps with its parent 25: 60 35 40 10 25.
1 | 70 swaps with 40, then with 60: 70 35 60 10 25 40.
--- answer
| Insert | Placed at | Swaps (with the parent at i / 2) | Array afterwards |
|---|---|---|---|
| 40 | 1 | none | 40 |
| 25 | 2 | 25 < 40: none | 40 25 |
| 60 | 3 | 60 > 40: swap | 60 25 40 |
| 10 | 4 | 10 < 25: none | 60 25 40 10 |
| 35 | 5 | 35 > 25: swap; 35 < 60: stop | 60 35 40 10 25 |
| 70 | 6 | 70 > 40: swap; 70 > 60: swap | 70 35 60 10 25 40 |

:::diagram heap 70 35 60 10 25 40
The max-heap after all six insertions.
:::
--- mistakes
- Putting each new value at the root and pushing others down.
- Comparing the new value with its sibling instead of its parent.
--- format
One row per insertion, with where it starts, each swap, and the array afterwards.

=== fin-1-3a
paper: F1
q: 3
part: a
area: hashgraph
topic: hashing
type: trace
marks: 3
minutes: 6
lessons: i3-chaining-strings
--- question
A hash table has locations 1 to 7, uses **h(key) = key % 7 + 1**, and resolves collisions by **chaining**, adding each new key at the **top** of its location's list, as in the course. Insert **15, 22, 8, 11, 29, 4** in that order. Draw the table, and say how many keys are compared when searching for **15**.
--- rubric
1 | 15, 22, 8 and 29 hash to location 2; 11 and 4 hash to location 5.
1 | Each new key goes at the top of its list: location 2 holds 29, 8, 22, 15 (in that order) and location 5 holds 4, 11.
1 | Searching for 15 compares 4 keys (29, 8, 22, then 15): it was inserted first, so it is at the end of its list.
--- answer
15 % 7 = 1, 22 % 7 = 1, 8 % 7 = 1 and 29 % 7 = 1, so all four go to location **2**; 11 % 7 = 4 and 4 % 7 = 4 go to location **5**. Each insert is an insertAtHead on that location's list.

:::diagram hash chain 7
15 22 8 11 29 4
The table: location 2 holds 29 → 8 → 22 → 15, and location 5 holds 4 → 11.
:::

A search for 15 goes to location 2 and walks its list: 29, 8, 22, **15**: **4 comparisons**.
--- mistakes
- Adding new keys at the end of the list: the course adds them at the top.
- Using linear probing (moving to the next location) instead of chaining.
--- format
Draw each location with its list as boxes and arrows, newest first, then state the search count.

=== fin-1-3b
paper: F1
q: 3
part: b
area: hashgraph
topic: graphs
type: trace
marks: 4
minutes: 8
lessons: j5-mst
--- question
An undirected weighted graph has the edges A–B (4), A–C (2), B–C (5), B–D (10), C–E (3), C–F (9), D–E (6), D–F (11) and E–F (8). Use **Prim's algorithm**, starting from A, to find a minimum-cost spanning tree. Give the edges in the order they are added, and the total cost.
--- rubric
1 | Starts with A–C (2), the cheapest edge leaving A.
1 | Then C–E (3), then A–B (4): each time the cheapest edge with one end used and the other unused.
1 | Then E–D (6) and E–F (8). B–C (5) is never taken: once B and C are both used it would make a cycle.
1 | Total cost 23, with 5 edges for 6 vertices.
--- answer
| Used | Edges from used to unused | Cheapest |
|---|---|---|
| {A} | A–B 4, A–C 2 | **A–C 2** |
| {A, C} | A–B 4, B–C 5, C–E 3, C–F 9 | **C–E 3** |
| {A, C, E} | A–B 4, B–C 5, C–F 9, D–E 6, E–F 8 | **A–B 4** |
| {A, B, C, E} | B–D 10, C–F 9, D–E 6, E–F 8 | **E–D 6** |
| {A, B, C, D, E} | C–F 9, D–F 11, E–F 8 | **E–F 8** |

Edges added: A–C, C–E, A–B, E–D, E–F. Total cost 2 + 3 + 4 + 6 + 8 = **23**. Kruskal's algorithm gives the same tree here, because all the weights are different.
--- mistakes
- Taking the cheapest edge anywhere in the graph (that is Kruskal's rule, not Prim's).
- Adding B–C (5): both ends are already in the tree, so it would close a cycle.
--- format
A table with the used set, the candidate edges and the one chosen at each step, then the total.

=== fin-1-3c
paper: F1
q: 3
part: c
area: hashgraph
topic: graphs
type: trace
marks: 3
minutes: 5
lessons: j1-graph-basics, j2-graph-code
--- question
A directed graph has the edges A→B, A→D, B→C, C→A, C→D and D→B. (i) Write its **adjacency matrix**, with rows and columns in alphabetical order. (ii) Give the **out-degree** and the **in-degree** of each vertex.
--- rubric
1 | Rows A and B of the matrix: A: 0 1 0 1 and B: 0 0 1 0.
1 | Rows C and D: C: 1 0 0 1 and D: 0 1 0 0.
1 | Out-degrees (row sums) A 2, B 1, C 2, D 1; in-degrees (column sums) A 1, B 2, C 1, D 2.
--- answer
Row u, column v holds 1 when there is an edge u→v:

| | A | B | C | D |
|---|---|---|---|---|
| **A** | 0 | 1 | 0 | 1 |
| **B** | 0 | 0 | 1 | 0 |
| **C** | 1 | 0 | 0 | 1 |
| **D** | 0 | 1 | 0 | 0 |

| Vertex | A | B | C | D |
|---|---|---|---|---|
| out-degree (edges leaving: the row's sum) | 2 | 1 | 2 | 1 |
| in-degree (edges arriving: the column's sum) | 1 | 2 | 1 | 2 |

The matrix is not symmetric because the graph is directed.
--- mistakes
- Filling in both u→v and v→u, as for an undirected graph.
- Swapping in-degree and out-degree.
--- format
Label the rows and columns. Say which way an entry is read (row → column).

=== fin-1-4a
paper: F1
q: 4
part: a
area: sortperf
topic: sorting
type: trace
marks: 4
minutes: 8
lessons: k1-simple-sorts
--- stem
This question uses the course's sorting and searching functions on arrays.
--- question
The course's `insertionSort` sorts **29 10 14 37 13** (n = 5). Show the array after each pass of the outer loop (i = 1 to 4).
--- rubric
1 | After i = 1: 10 29 14 37 13 (29 shifts right for the key 10).
1 | After i = 2: 10 14 29 37 13.
1 | After i = 3: 10 14 29 37 13 (37 is already larger than 29: nothing moves).
1 | After i = 4: 10 13 14 29 37 (37, 29 and 14 shift right for the key 13).
--- answer
| Pass | key = A[i] | Shifted right | Array afterwards |
|---|---|---|---|
| i = 1 | 10 | 29 | 10 29 14 37 13 |
| i = 2 | 14 | 29 | 10 14 29 37 13 |
| i = 3 | 37 | none | 10 14 29 37 13 |
| i = 4 | 13 | 37, 29, 14 | 10 13 14 29 37 |

Before pass i, A[0..i−1] is sorted; the pass inserts A[i] into it by shifting every larger value one place right.
--- mistakes
- Swapping the key with the smallest value further on (that is selection sort).
- Skipping pass 3 because nothing moved: it still counts as a pass.
--- format
One row per pass with the key and the whole array.

=== fin-1-4b
paper: F1
q: 4
part: b
area: sortperf
topic: sorting
type: trace
marks: 3
minutes: 6
lessons: k2-merge-sort
--- question
In merge sort, `mergeArray` merges the sorted halves **L = 5 12 19 30** and **R = 7 8 25 40**. (i) Give the merged array and the number of times `L[i] <= R[j]` is tested. (ii) Why does `mergeArray` need the two loops after its main loop?
--- rubric
1 | The merged array is 5 7 8 12 19 25 30 40.
1 | 7 comparisons: after 30 is copied, L is used up and 40 is copied without a comparison.
1 | (ii) One half always runs out first; the loops copy what is left of the other half, which is already sorted and larger than everything copied so far.
--- answer
| Compare | Smaller is copied |
|---|---|
| 5 vs 7 | 5 |
| 12 vs 7 | 7 |
| 12 vs 8 | 8 |
| 12 vs 25 | 12 |
| 19 vs 25 | 19 |
| 30 vs 25 | 25 |
| 30 vs 40 | 30 |
| L is empty | 40 (copied by the loop for R) |

**(i)** 5 7 8 12 19 25 30 40, after **7** comparisons.

**(ii)** The main loop stops as soon as either half is empty. The values left in the other half are still sorted and larger than everything already written, so the two loops copy them across. Only one of them runs.
--- mistakes
- Counting a comparison for 40: no test is made once L is empty.
- Saying the final loops sort the leftovers: they are already in order.
--- format
A small table of the comparisons, then the two answers labelled (i) and (ii).

=== fin-1-4c
paper: F1
q: 4
part: c
area: sortperf
topic: bigo
type: complexity
marks: 3
minutes: 5
lessons: k4-sorting-performance, m3-binary-search
--- question
Give the big-O of each, with a one-line reason.

(i) Insertion sort on an array of n values that is **already sorted**.

(ii) Quick sort (with the course's partition, pivot A[r]) on an array of n values that is **already sorted**.

(iii) Binary search for a key in a sorted array of n values, in the worst case.
--- rubric
1 | (i) O(n): every while loop test fails at once, so there are only n − 1 comparisons.
1 | (ii) O(n²): every partition leaves the pivot at the end, so the parts have sizes n − 1 and 0 each time.
1 | (iii) O(log n): each comparison halves the part of the array still to search.
--- answer
- **(i) O(n).** Each key is already larger than the value before it, so the while loop stops after one comparison: n − 1 comparisons in total.
- **(ii) O(n²).** The pivot A[r] is the largest value, so partition puts it last and recurses on n − 1 values, then n − 2, … : n + (n − 1) + … + 1 steps.
- **(iii) O(log n).** After k comparisons, about n / 2^k values remain, so at most about log₂ n + 1 comparisons are needed.
--- mistakes
- Giving O(n log n) for (ii): that is quick sort's average, not this worst case.
- Giving O(n²) for (i): sorted input is insertion sort's best case.
--- format
Big-O first, then the reason that makes it true.

=== fin-2-1a
paper: F2
q: 1
part: a
area: core
topic: cpp
type: explain
marks: 3
minutes: 5
lessons: b4-pitfalls
--- stem
This question uses pointers, recursion and the course's linked list node, `struct Node { int data; Node * next; };`, with `createNode (n)`.
--- question
Each fragment has one mistake. Name it and say what goes wrong.

```cpp
// (i)
Node * p = createNode (4);
delete p;
cout << p->data;

// (ii)
Node * p = createNode (4);
p = createNode (9);

// (iii)
Node * p = NULL;
p->data = 7;
```
--- rubric
1 | (i) A dangling pointer: p is used after delete, so it reads memory that no longer belongs to the program.
1 | (ii) A memory leak: the node holding 4 can no longer be reached, so it can never be deleted.
1 | (iii) Following a NULL pointer: there is no node at NULL, and the program crashes.
--- answer
- **(i) Dangling pointer.** After `delete p`, the node's memory is returned to the system, but p still holds the old address. Using `p->data` is undefined behaviour: it may print rubbish, seem to work, or crash. Set `p = NULL` after deleting, and do not use it.
- **(ii) Memory leak.** The only pointer to the first node (holding 4) is overwritten, so that node can never be reached or deleted again. Delete it first, or keep another pointer to it.
- **(iii) NULL pointer.** p points to no node, so `p->data` follows a NULL pointer and the program crashes. Check `p != NULL` before following it.
--- mistakes
- Saying (i) is fine because the value is "still there": using freed memory is never safe.
- Missing that (ii) loses the first node: nothing is wrong with the second line on its own.
--- format
For each fragment: the name of the mistake, what happens, and the one-line fix.

=== fin-2-1b
paper: F2
q: 1
part: b
area: core
topic: lists
type: code
marks: 4
minutes: 9
lessons: c5-more-ops
--- question
Write a function `reverseList` that reverses a linked list **by changing its pointers** (no new nodes) and returns the new top.

```cpp
Node * reverseList (Node * top);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Uses three pointers: prev (starting at NULL), curr (starting at top) and next.
1 | Saves curr->next in next before changing curr->next.
1 | Points curr->next at prev, then moves prev to curr and curr to next.
1 | Returns prev, the old last node; an empty or one-node list works too.
--- answer
```cpp
Node * reverseList (Node * top) {
	Node * prev = NULL;
	Node * curr = top;
	while (curr != NULL) {
		Node * next = curr->next;
		curr->next = prev;
		prev = curr;
		curr = next;
	}
	return prev;
}
```

Each step turns one arrow around: `curr->next` stops pointing forward and points back to `prev`. `next` must be saved first, or the rest of the list would be lost. When `curr` falls off the end, `prev` is the old last node, which is the new top. One pass: O(n), with no new nodes.
--- mistakes
- Changing `curr->next` before saving it: the rest of the list is lost.
- Returning `top`, which is now the last node.
- Making a reversed copy with `createNode`, when the question asks for the pointers to change.
--- format
Name the three pointers as the course does. A small drawing of one step (three boxes and their arrows) earns method marks if the code slips.
--- check
void printList (Node * top) { if (top == NULL) { cout << "(empty)" << endl; return; } for (Node * c = top; c != NULL; c = c->next) cout << c->data << " "; cout << endl; }
int main () {
	Node * top = createNode (1);
	top->next = createNode (2);
	top->next->next = createNode (3);
	top->next->next->next = createNode (4);
	printList (reverseList (top));
	printList (reverseList (createNode (9)));
	printList (reverseList (NULL));
	return 0;
}
--- expect
4 3 2 1
9
(empty)

=== fin-2-1c
paper: F2
q: 1
part: c
area: core
topic: recursion
type: trace
marks: 3
minutes: 6
lessons: d2-recursion-lists, d1-how-recursion-works
--- question
```cpp
void show (Node * top) {
	if (top == NULL)
		return;
	show (top->next);
	cout << top->data << " ";
}
```

(i) What does `show` print for the list 3 → 6 → 9? (ii) Using the calls that wait on the call stack, explain why the values come out in that order. (iii) What would it print if the `cout` line came **before** the recursive call?
--- rubric
1 | (i) 9 6 3.
1 | (ii) Each call calls show on the rest of the list before printing; the calls wait on the stack (3, then 6, then 9), and print as they return, last first.
1 | (iii) 3 6 9: printing before the call prints each value on the way down.
--- answer
**(i) 9 6 3.**

**(ii)** show(3) cannot print until show(6) returns; show(6) waits for show(9); show(9) waits for show(NULL), which returns at once. Then the waiting calls finish in reverse order: show(9) prints 9, show(6) prints 6, show(3) prints 3. The printing is done **after** the recursive call, on the way back up.

**(iii) 3 6 9.** With the `cout` first, each call prints its value before going on to the rest of the list, so the values come out in list order.
--- mistakes
- Answering 3 6 9 for (i): the recursive call comes before the print.
- Thinking the base case prints something: it just returns.
--- format
The output first, then two or three sentences that name the waiting calls in order.

=== fin-2-2a
paper: F2
q: 2
part: a
area: trees
topic: bst
type: trace
marks: 4
minutes: 8
lessons: g2-insert-search, g4-deletion
--- stem
This question uses binary trees, BSTs and max-heaps stored from index 1, as in the course.
--- question
The keys **60, 35, 80, 20, 45, 70, 90, 40, 50, 75** are inserted in that order into an empty BST. (i) Draw the tree. (ii) 60 is then deleted with the course's `deleteBST` (a node with two children is replaced by its inorder successor). Give the **preorder** traversal of the tree afterwards.
--- rubric
1 | The BST is correct (60; 35 and 80; 20, 45, 70, 90; 40 and 50 under 45; 75 right of 70).
1 | 60's inorder successor is 70, the smallest key in its right subtree, and it takes 60's place.
1 | 70's old node had one child, 75, which moves up to become 80's left child.
1 | Preorder afterwards: 70 35 20 45 40 50 80 75 90.
--- answer
:::diagram tree bst:60 35 80 20 45 70 90 40 50 75
The BST after the insertions.
:::

60 has two children, so its key is replaced by its **inorder successor**: go right to 80, then left as far as possible, to **70** (it has no left child). 70 is copied into the root. 70's old node has one child, 75, which takes that node's place as 80's left child.

:::diagram tree 70(35(20,45(40,50)),80(75,90))
After deleting 60.
:::

Preorder: **70 35 20 45 40 50 80 75 90**.
--- mistakes
- Removing 70's old node and losing 75 with it.
- Using the predecessor (50) when the course uses the successor.
--- format
Draw both trees, name the successor and how you found it, then give the preorder.

=== fin-2-2b
paper: F2
q: 2
part: b
area: trees
topic: heaps
type: trace
marks: 3
minutes: 6
lessons: h2-heapify-build, h3-delete-heapsort
--- question
Run `buildMaxHeap` on **3 9 2 8 7 5** (size 6) and give the max-heap. Then give the whole array after the **first** step of heap sort (`heap->A[i] = heapExtractMax (heap);` with i = 6).
--- rubric
1 | buildMaxHeap starts at i = size / 2 = 3: 2 swaps with 5, giving 3 9 5 8 7 2; i = 2 changes nothing.
1 | At i = 1, 3 sinks below 9 and then below 8: the max-heap is 9 8 5 3 7 2.
1 | After the first heap sort step: 8 7 5 3 2 9.
--- answer
| buildMaxHeap call | What happens | Array afterwards |
|---|---|---|
| i = 3 | 2 vs its child 5: swap | 3 9 **5** 8 7 **2** |
| i = 2 | 9 vs 8 and 7: no change | 3 9 5 8 7 2 |
| i = 1 | 3 vs 9 and 5: swap with 9; then 3 vs 8 and 7: swap with 8 | **9 8** 5 **3** 7 2 |

Max-heap: **9 8 5 3 7 2**.

First heap sort step: heapExtractMax saves 9, moves the last value 2 to the root (size 5), and maxHeapify sinks it below 8, then below 7: 8 7 5 3 2. The 9 is stored in A[6]: **8 7 5 3 2 9**.
--- mistakes
- Starting buildMaxHeap at i = 1.
- Forgetting that heap sort stores the extracted 9 at the end of the array.
--- format
A table for buildMaxHeap, then the array after the heap sort step with the sorted part marked.

=== fin-2-2c
paper: F2
q: 2
part: c
area: trees
topic: trees
type: explain
marks: 3
minutes: 6
lessons: f4-level-order-types
--- question
Using the course's definitions, say whether each tree is **full**, **complete** and **almost complete**.

:::diagram tree 20(10,30)
Tree (i).
:::

:::diagram tree 20(10(5,12),30)
Tree (ii).
:::

:::diagram tree 20(10(5),30(25,35))
Tree (iii).
:::
--- rubric
1 | (i) Full, complete and almost complete.
1 | (ii) Full and almost complete, but not complete (its leaves are on two different levels).
1 | (iii) None of the three: 10 has only one child (not full), and the lowest level has a gap where 10's right child should be (not almost complete).
--- answer
The course's definitions: **full**: every non-leaf node has exactly two children. **Complete**: full, and every leaf is on the same level. **Almost complete**: every level except perhaps the lowest is completely filled, and the nodes on the lowest level are as far left as possible.

- **(i)** Full, complete and almost complete: the root has two children, and both leaves are on level 1.
- **(ii)** Full (20 and 10 both have two children) and almost complete (level 1 is full, and 5 and 12 are as far left as possible), but **not complete**: 30 is a leaf on level 1 while 5 and 12 are on level 2.
- **(iii)** None: 10 has only a left child, so it is not full (or complete); on the lowest level the place for 10's right child is empty while 25 and 35 come after it, so the nodes are not as far left as possible.
--- mistakes
- Calling (ii) complete: in the course, complete means every leaf on the same level.
- Calling (iii) almost complete because levels 0 and 1 are full: the lowest level must also have no gaps on its left.
--- format
For each tree, all three answers, each with its reason in a few words.

=== fin-2-3a
paper: F2
q: 3
part: a
area: hashgraph
topic: graphs
type: trace
marks: 4
minutes: 8
lessons: j5-mst
--- question
An undirected weighted graph has the edges A–B (7), A–D (5), B–C (8), B–D (9), B–E (6), C–E (4), D–E (15), D–F (10) and E–F (11). Use **Kruskal's algorithm** to find a minimum-cost spanning tree. For each edge, in the order Kruskal considers it, say whether it is added or skipped, and give the total cost.
--- rubric
1 | Considers the edges by increasing weight, and adds C–E (4), A–D (5) and B–E (6), each joining two different trees.
1 | Adds A–B (7), which joins the trees {A, D} and {B, C, E}.
1 | Skips B–C (8) and B–D (9) (both ends are already in the same tree: a cycle), then adds D–F (10).
1 | Total cost 32 with 5 edges; E–F (11) and D–E (15) are skipped.
--- answer
| Edge (sorted) | Same tree already? | Action | Trees afterwards |
|---|---|---|---|
| C–E 4 | no | add | {C,E} {A} {B} {D} {F} |
| A–D 5 | no | add | {C,E} {A,D} {B} {F} |
| B–E 6 | no | add | {B,C,E} {A,D} {F} |
| A–B 7 | no | add | {A,B,C,D,E} {F} |
| B–C 8 | yes | skip (cycle) | |
| B–D 9 | yes | skip (cycle) | |
| D–F 10 | no | add | {A,B,C,D,E,F} |
| E–F 11 | yes | skip | |
| D–E 15 | yes | skip | |

The spanning tree has the edges C–E, A–D, B–E, A–B and D–F (5 edges for 6 vertices), with total cost 4 + 5 + 6 + 7 + 10 = **32**.
--- mistakes
- Adding an edge whose ends are already connected, which makes a cycle.
- Growing one tree from a start vertex (that is Prim's algorithm).
--- format
A table with every edge in sorted order and the trees after each step, then the total.

=== fin-2-3b
paper: F2
q: 3
part: b
area: hashgraph
topic: hashing
type: trace
marks: 3
minutes: 6
lessons: i1-hash-tables, i2-probing
--- question
A hash table has locations 1 to 10, uses **h(key) = key % 10 + 1** with **linear probing**, and, as in the course, deleting a key stores **−1** in its location. (i) Insert **34, 44, 54, 17** and give the table. (ii) Then 44 is deleted. Which locations are examined when searching for **54**, and why must the search not stop at the −1? (iii) Then **64** is inserted. Where does it go?
--- rubric
1 | (i) 34 at 5, 44 at 6, 54 at 7, 17 at 8.
1 | (ii) Locations 5, 6 and 7: the search passes the −1 at 6, because 54 was placed past 44's old location when 44 was there.
1 | (iii) 64 hashes to 5 (taken), then reuses the −1 at location 6.
--- answer
**(i)** 34, 44 and 54 all hash to 4 + 1 = 5: 34 takes 5, 44 moves on to 6, 54 to 7. 17 hashes to 7 + 1 = 8. Table: 5: 34, 6: 44, 7: 54, 8: 17.

**(ii)** Deleting 44 stores −1 at location 6. A search for 54 starts at 5 (34), passes 6 (−1) and finds 54 at 7: **5, 6, 7**. If the search stopped at the −1, it would wrongly report that 54 is missing, because 54 was placed beyond 6 while 44 was still there. A −1 means "something was here: keep looking"; only a truly empty location ends a search.

**(iii)** 64 hashes to 5 (taken), then 6 holds −1, which an insert may reuse: 64 goes to **6**.
--- mistakes
- Emptying location 6 completely when 44 is deleted, which breaks the search for 54.
- Putting 64 at 9, after the keys, instead of reusing the −1.
--- format
Show the table after each step, and give the reason for (ii) in one sentence.

=== fin-2-3c
paper: F2
q: 3
part: c
area: hashgraph
topic: graphs
type: trace
marks: 3
minutes: 6
lessons: j3-bfs-dfs
--- question
An undirected graph has the edges A–B, A–E, B–C, C–F, D–E, D–G and E–F. Its adjacency lists are in alphabetical order. Run a **breadth-first** search from A. Give the order the vertices are visited, the number of edges from A to each vertex, and each vertex's parent (the vertex it was discovered from).
--- rubric
1 | The order is A B E C D F G.
1 | Distances: A 0, B 1, E 1, C 2, D 2, F 2, G 3.
1 | Parents: B and E from A, C from B, D and F from E, and G from D.
--- answer
Adjacency lists: A: B E · B: A C · C: B F · D: E G · E: A D F · F: C E · G: D

| Taken off the queue | Newly discovered (distance, parent) | Queue afterwards |
|---|---|---|
| A (0) | B (1, A), E (1, A) | B E |
| B (1) | C (2, B) | E C |
| E (1) | D (2, E), F (2, E) | C D F |
| C (2) | none (F is already GREY) | D F |
| D (2) | G (3, D) | F G |
| F (2) | none | G |
| G (3) | none | (empty) |

Order: **A B E C D F G**. Because BFS visits vertices in waves of increasing distance, each vertex's distance is the fewest edges from A, and following the parents back gives a shortest path (for example G ← D ← E ← A).
--- mistakes
- Giving F the parent C: F is discovered from E first, because E leaves the queue before C.
- Visiting G before F: G is 3 edges from A and F only 2, so F's wave comes first.
--- format
Write the adjacency lists, then a table of the queue with each vertex's distance and parent.

=== fin-2-4a
paper: F2
q: 4
part: a
area: sortperf
topic: sorting
type: trace
marks: 4
minutes: 8
lessons: k3-quick-sort
--- stem
This question uses the course's sorting and searching functions on arrays.
--- question
Run the course's `partition (A, 1, 8)` on **A = 6 11 3 9 2 14 7 8** (indexes 1 to 8; the pivot is x = A[8] = 8). Show the array after each exchange, the final array, and the value `partition` returns.
--- rubric
1 | The pivot is 8; at j = 1, 6 ≤ 8, so i becomes 1 and 6 is exchanged with itself.
1 | 3, 2 and 7 join the small region (exchanged with 11, 11 and 9): 6 3 2 7 11 14 9 8.
1 | Finally the pivot is exchanged with A[5]: 6 3 2 7 8 14 9 11.
1 | It returns 5: everything before index 5 is at most 8, and everything after it is larger.
--- answer
| j | A[j] ≤ 8? | i | Exchange | Array afterwards |
|---|---|---|---|---|
| 1 | 6, yes | 1 | A[1] with A[1] | 6 11 3 9 2 14 7 8 |
| 2 | 11, no | 1 | | |
| 3 | 3, yes | 2 | A[2] with A[3] | 6 **3 11** 9 2 14 7 8 |
| 4 | 9, no | 2 | | |
| 5 | 2, yes | 3 | A[3] with A[5] | 6 3 **2** 9 **11** 14 7 8 |
| 6 | 14, no | 3 | | |
| 7 | 7, yes | 4 | A[4] with A[7] | 6 3 2 **7** 11 14 **9** 8 |
| end | | | pivot: A[5] with A[8] | 6 3 2 7 **8** 14 9 **11** |

Returns **5**. The pivot 8 is now in its final sorted place, with smaller values before it and larger values after it.
--- mistakes
- Exchanging when A[j] > x: only values ≤ the pivot move into the small region.
- Exchanging the pivot with A[i] instead of A[i + 1].
--- format
A table with j, the test, i and each exchange, then the final array and the return value.

=== fin-2-4b
paper: F2
q: 4
part: b
area: sortperf
topic: sorting
type: trace
marks: 3
minutes: 6
lessons: m3-binary-search
--- question
**A = 4 9 15 21 30 37 42 50 56 63 71** (indexes 0 to 10). Using the course's `binarySearch`, give lo, hi and mid at each step when searching for (i) **56** and (ii) **20**, and what each search returns.
--- rubric
1 | (i) mid = 5 (37), then lo = 6 and mid = 8 (56): returns 8.
1 | (ii) mid = 5 (37), then mid = 2 (15), then mid = 3 (21).
1 | (ii) then lo = 3 is greater than hi = 2, so the search stops and returns −1: 20 is not in the array.
--- answer
**(i) 56**

| lo | hi | mid | A[mid] | Next |
|---|---|---|---|---|
| 0 | 10 | 5 | 37 | 56 > 37: lo = 6 |
| 6 | 10 | 8 | 56 | found: return **8** |

**(ii) 20**

| lo | hi | mid | A[mid] | Next |
|---|---|---|---|---|
| 0 | 10 | 5 | 37 | 20 < 37: hi = 4 |
| 0 | 4 | 2 | 15 | 20 > 15: lo = 3 |
| 3 | 4 | 3 | 21 | 20 < 21: hi = 2 |
| 3 | 2 | | | lo > hi: return **−1** |
--- mistakes
- Rounding mid up: the course uses integer division, so (0 + 4) / 2 = 2 and (3 + 4) / 2 = 3.
- Stopping when lo == hi: the loop runs while lo <= hi, so that part is still searched.
--- format
A table of lo, hi, mid and A[mid] for each search, then the value returned.

=== fin-2-4c
paper: F2
q: 4
part: c
area: sortperf
topic: bigo
type: complexity
marks: 3
minutes: 5
lessons: k4-sorting-performance, m3-binary-search
--- question
Give the big-O of each, with a one-line reason.

(i) Selection sort on an array of n values that is **already sorted**.

(ii) Merge sort on any array of n values.

(iii) Sequential search for a key in an **unsorted** array of n values, in the worst case.
--- rubric
1 | (i) O(n²): the inner loop always scans to the end, giving n(n − 1) / 2 comparisons whatever the input.
1 | (ii) O(n log n): there are about log₂ n levels of splitting, and each level merges n values in total.
1 | (iii) O(n): the key may be the last value or missing, so every value is checked.
--- answer
- **(i) O(n²).** Selection sort looks for the smallest remaining value by scanning to the end on every pass, even when the array is sorted: (n − 1) + (n − 2) + … + 1 = n(n − 1) / 2 comparisons.
- **(ii) O(n log n).** The array is halved about log₂ n times, and at each level of the recursion the merges handle all n values. This is the same in the best, average and worst cases.
- **(iii) O(n).** With no order to use, a search must compare the key with every value until it is found; in the worst case it is last or not there at all.
--- mistakes
- Giving O(n) for (i): sorted input only helps insertion sort (and bubble sort with the early stop).
- Giving O(log n) for (iii): that needs a sorted array (binary search).
--- format
Big-O first, then the reason.

=== fin-3-1a
paper: F3
q: 1
part: a
area: core
topic: cpp
type: trace
marks: 3
minutes: 6
lessons: b2-pointers-structs, b3-new-delete
--- stem
This question uses pointers, recursion and the course's linked list node, `struct Node { int data; Node * next; };`, with `createNode (n)` returning a new node that holds `n` and points to `NULL`.
--- question
(i) What does this code print? Draw the nodes and their links.

```cpp
Node * a = createNode (4);
Node * b = createNode (9);
Node * c = createNode (2);
a->next = c;
c->next = b;
b->data = a->data + c->data;
for (Node * p = a; p != NULL; p = p->next)
	cout << p->data << " ";
```

(ii) The next two lines are `delete c;` and then `cout << a->next->data;`. What is wrong with them, and how would you remove the node holding 2 safely?
--- rubric
1 | The links: a → c → b, so the loop visits a, then c, then b.
1 | b->data becomes 4 + 2 = 6, so the output is 4 2 6.
1 | (ii) After delete c, a->next still holds c's old address (a dangling pointer), so a->next->data reads memory that is no longer the program's. Fix: a->next = c->next first, then delete c.
--- answer
**(i)** `a->next = c` and `c->next = b` link the three nodes in the order **a → c → b**, and b's `next` is still NULL. Then `b->data = a->data + c->data` makes b hold 4 + 2 = 6. The loop follows the `next` links from a: a (4) → c (2) → b (6) → NULL.

Output: **4 2 6**.

**(ii)** `delete c` gives c's node back to the heap, but `a->next` still holds its address: a **dangling pointer**. `a->next->data` reads memory that no longer belongs to the program, so the result is undefined (it may print rubbish or 2, or crash). Unlink the node first, then delete it:

```cpp
a->next = c->next;     // a now points to b
delete c;
```

The list is then 4 → 6.
--- mistakes
- Printing in the order the nodes were created (4 9 2): the loop follows the `next` links, not the order of creation.
- Forgetting that b's value changed to 6 before the loop.
- Thinking `delete c` also changes `a->next`: delete never changes any other pointer.
--- format
Draw the three boxes with their arrows, then the output. For (ii), name the problem (a dangling pointer) and give the two lines in the right order.

=== fin-3-1b
paper: F3
q: 1
part: b
area: core
topic: lists
type: code
marks: 4
minutes: 9
lessons: c4-deletion, c5-more-ops
--- question
A linked list is sorted in ascending order, so equal values sit next to each other. Write a function `removeDuplicates` that deletes every node holding the same value as the node before it (freeing each one), so that each value appears once. It returns the top of the list.

```cpp
Node * removeDuplicates (Node * top);
```

For example, 3 → 3 → 5 → 7 → 7 → 7 → 9 becomes 3 → 5 → 7 → 9.
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Walks the list with a pointer and stops when it, or the node after it, is NULL, so an empty or one-node list is safe.
1 | Compares each node's data with the data of the node after it.
1 | On a match: links the node past the duplicate, then deletes the duplicate, and stays on the same node (there may be more copies).
1 | Otherwise moves on to the next node; returns top (the first node is never deleted).
--- answer
```cpp
Node * removeDuplicates (Node * top) {
	Node * curr = top;
	while (curr != NULL && curr->next != NULL) {
		if (curr->data == curr->next->data) {
			Node * dup = curr->next;
			curr->next = dup->next;
			delete dup;
		}
		else
			curr = curr->next;
	}
	return top;
}
```

The list is sorted, so every copy of a value comes straight after the first one. curr stays on the first copy and deletes the copies after it one at a time; only when the next value is different does it move on. The duplicate is unlinked before it is deleted, so the rest of the list is never lost. One pass: O(n).
--- mistakes
- Moving curr on after a deletion: with three 7s in a row, the third would be missed.
- Deleting the node before linking past it, which loses the rest of the list.
- Testing `curr->next->data` without first checking that `curr->next` is not NULL.
--- format
Draw the list before and after one deletion (three boxes) to show which pointer changes, then write the code.
--- check
void printList (Node * top) { if (top == NULL) { cout << "(empty)" << endl; return; } for (Node * c = top; c != NULL; c = c->next) cout << c->data << " "; cout << endl; }
Node * build (int v[], int n) { Node * top = NULL; for (int i = n - 1; i >= 0; i--) { Node * x = createNode (v[i]); x->next = top; top = x; } return top; }
int main () {
	int a[] = {3, 3, 5, 7, 7, 7, 9};
	int b[] = {4, 4, 4};
	printList (removeDuplicates (build (a, 7)));
	printList (removeDuplicates (build (b, 3)));
	printList (removeDuplicates (NULL));
	return 0;
}
--- expect
3 5 7 9
4
(empty)

=== fin-3-1c
paper: F3
q: 1
part: c
area: core
topic: recursion
type: trace
marks: 3
minutes: 6
lessons: d3-recursion-arrays, d1-how-recursion-works
--- question
```cpp
int big (int A[], int lo, int hi) {
	if (lo == hi)
		return A[lo];
	int mid = (lo + hi) / 2;
	int x = big (A, lo, mid);
	int y = big (A, mid + 1, hi);
	if (x > y)
		return x;
	return y;
}
```

`A` holds **4 9 2 7 5** and `main` calls `big (A, 0, 4)`. (i) What does it return? (ii) How many calls of `big` are made in total (count the first call too)? List them as (lo, hi) in the order they start. (iii) What is the big-O of `big` on n values, and why?
--- rubric
1 | (i) 9, the largest value: each call returns the larger of the answers for its two halves.
1 | (ii) 9 calls: (0, 4), (0, 2), (0, 1), (0, 0), (1, 1), (2, 2), (3, 4), (3, 3), (4, 4).
1 | (iii) O(n): there is one call for each of the n single values and n − 1 calls that split, 2n − 1 calls in all, each doing a constant amount of work.
--- answer
**(i) 9.** A range with one value returns that value. Every other call splits its range at mid and returns the larger of the two answers, so the answer for the whole array is its largest value.

**(ii) 9 calls**, in this order (each call finishes its left half before it starts its right half):

| Call (lo, hi) | mid | Returns |
|---|---|---|
| (0, 4) | 2 | the larger of 9 and 7: **9** |
| (0, 2) | 1 | the larger of 9 and 2: 9 |
| (0, 1) | 0 | the larger of 4 and 9: 9 |
| (0, 0) | | 4 |
| (1, 1) | | 9 |
| (2, 2) | | 2 |
| (3, 4) | 3 | the larger of 7 and 5: 7 |
| (3, 3) | | 7 |
| (4, 4) | | 5 |

**(iii) O(n).** Every value ends up in a call of its own (n calls), and n − 1 calls split a range, so there are 2n − 1 calls: 9 for n = 5. Each call does a constant amount of work besides its recursive calls, so the total is O(n), the same as a loop.
--- mistakes
- Counting only the calls that split (4), or only the one-value calls (5).
- Saying O(log n) because the range halves: halving only sets the depth; both halves are still visited, so every value is looked at.
--- format
A table of the calls in the order they start, with what each returns, then one sentence for the big-O.

=== fin-3-2a
paper: F3
q: 2
part: a
area: trees
topic: trees
type: trace
marks: 3
minutes: 6
lessons: f2-traversals
--- stem
This question uses binary trees and max-heaps stored in an array from index 1, as in the course: `struct BTNode { int data; BTNode * left; BTNode * right; };` and `struct MaxHeap { int A [100]; int size; };`.
--- question
A binary tree with the nodes A to H has the **inorder** traversal D G B A E C H F and the **postorder** traversal G D B E H F C A. Draw the tree, and give its **preorder** traversal.
--- rubric
1 | The root is A, the last value of the postorder; in the inorder, D G B is its left subtree and E C H F its right subtree.
1 | The tree: B is A's left child, with left child D, and G is D's right child; C is A's right child, with children E and F, and H is F's left child.
1 | Preorder: A B D G C E F H.
--- answer
Postorder visits the root **last**, and inorder puts the root **between** its two subtrees. So, again and again:

1. The last value of the postorder, **A**, is the root. In the inorder, D G B is left of A and E C H F is right of it.
2. Left subtree: inorder D G B, postorder G D B. Its root is **B** (the last); D G is on B's left and nothing is on its right. In D G (postorder G D) the root is **D**, and G comes after D in the inorder, so **G is D's right child**.
3. Right subtree: inorder E C H F, postorder E H F C. Its root is **C**; E is its left subtree and H F its right. In H F (postorder H F) the root is **F**, and H comes before F in the inorder, so **H is F's left child**.

:::diagram tree A(B(D(,G)),C(E,F(H)))
The tree rebuilt from its inorder and postorder.
:::

Preorder (root, left, right): **A B D G C E F H**.
--- mistakes
- Taking the first value of the postorder as the root: postorder visits the root last.
- Making G D's left child: G comes after D in the inorder, so it is on D's right.
--- format
Show each split (the root, then its left and right parts), draw the tree, and check it by writing out its inorder again.

=== fin-3-2b
paper: F3
q: 2
part: b
area: trees
topic: trees
type: code
marks: 3
minutes: 6
lessons: f1-terminology, f3-tree-code
--- question
The **level** of a node is the number of edges from the root to it, so the root is at level 0. Write a **recursive** function `countAtLevel` that returns how many nodes of a binary tree are at level `k`.

```cpp
int countAtLevel (BTNode * root, int k);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; };
BTNode * createBTNode (int data) { BTNode * newNode = new BTNode; newNode->data = data; newNode->left = NULL; newNode->right = NULL; return newNode; }
BTNode * insertBST (BTNode * root, int key) { if (root == NULL) return createBTNode (key); if (key < root->data) root->left = insertBST (root->left, key); else if (key > root->data) root->right = insertBST (root->right, key); return root; }
--- rubric
1 | An empty tree returns 0, whatever k is.
1 | When k is 0, the root itself is the only node at that level: return 1.
1 | Otherwise the nodes at level k are the nodes at level k − 1 of the two subtrees: return the sum of the two calls with k − 1.
--- answer
```cpp
int countAtLevel (BTNode * root, int k) {
	if (root == NULL)
		return 0;
	if (k == 0)
		return 1;
	return countAtLevel (root->left, k - 1) + countAtLevel (root->right, k - 1);
}
```

A node at level k of the whole tree is at level k − 1 of its root's left or right subtree, so each call asks its subtrees about one level less. The calls stop at level 0 or at an empty tree, so only the top k + 1 levels are visited. For the BST built from 30 15 45 10 20 40 50 18 25, levels 0 to 3 hold 1, 2, 4 and 2 nodes.
--- mistakes
- Testing `k == 0` before testing for NULL: an empty subtree would be counted as a node.
- Passing k, not k − 1, to the children, so the level never goes down.
- Counting the leaves instead of the nodes at one level.
--- format
Two base cases first (empty, then k == 0), then the recursive case, with a comment saying why it is k − 1.
--- check
int main () {
	BTNode * root = NULL;
	int keys[] = {30, 15, 45, 10, 20, 40, 50, 18, 25};
	for (int i = 0; i < 9; i++)
		root = insertBST (root, keys[i]);
	for (int k = 0; k <= 4; k++)
		cout << countAtLevel (root, k) << " ";
	cout << countAtLevel (NULL, 0) << endl;
	return 0;
}
--- expect
1 2 4 2 0 0

=== fin-3-2c
paper: F3
q: 2
part: c
area: trees
topic: heaps
type: trace
marks: 4
minutes: 9
lessons: h4-insert-priority, h3-delete-heapsort
--- question
A max-priority queue is kept as a max-heap in an array from index 1: insert uses the course's `insertMaxHeap`, and extractMax uses `heapExtractMax`. Starting from an **empty** queue, these run in order:

insert 20, insert 35, insert 10, insert 30, **extractMax**, insert 50, insert 25, **extractMax**, **extractMax**

Give the value each extractMax returns, and the array after each extractMax.
--- rubric
1 | Before the first extractMax the heap is 35 30 10 20 (35 climbs above 20; 30 swaps with 20).
1 | The first extractMax returns 35 and leaves 30 20 10 (20 moves to the root and swaps with 30).
1 | 50 climbs to the root and 25 stays at index 5: 50 30 10 20 25. The second extractMax returns 50 and leaves 30 25 10 20.
1 | The third extractMax returns 30 and leaves 25 20 10.
--- answer
| Operation | What happens | Array afterwards |
|---|---|---|
| insert 20 | placed at index 1 | 20 |
| insert 35 | 35 > 20: swap | 35 20 |
| insert 10 | 10 < 35: stays at index 3 | 35 20 10 |
| insert 30 | index 4; 30 > 20: swap; 30 < 35: stop | 35 30 10 20 |
| **extractMax** | returns **35**; 20 moves to the root and swaps with its larger child, 30 | **30 20 10** |
| insert 50 | index 4; 50 > 20: swap; 50 > 30: swap | 50 30 10 20 |
| insert 25 | index 5; 25 < 30: stays | 50 30 10 20 25 |
| **extractMax** | returns **50**; 25 moves to the root and swaps with 30; 25 > 20, so it stops | **30 25 10 20** |
| **extractMax** | returns **30**; 20 moves to the root and swaps with 25 | **25 20 10** |

The values come out as 35, 50 and 30. A priority queue always serves the largest value present, not the oldest: 50 arrived after the first extractMax, and it still left next.
--- mistakes
- Moving every value along one place after an extractMax, as in an ordinary queue: the heap moves its last value to the root and lets it sink.
- Comparing a sinking value with only one child: maxHeapify compares it with both and swaps it with the larger.
--- format
One row per operation, with its swaps, and the array after each extractMax clearly marked.

=== fin-3-3a
paper: F3
q: 3
part: a
area: hashgraph
topic: hashing
type: trace
marks: 3
minutes: 6
lessons: i3-chaining-strings
--- question
As in the lecture, a string is hashed by adding up its character codes, and its location in a table with locations 1 to 11 is **sum % 11 + 1**. The codes you need are a 97, b 98, n 110 and t 116.

(i) Give the location of **ant**, **tan**, **bat** and **tab**.

(ii) What problem do these four words show, and why must it always happen with this method?

(iii) The lecture's fix adds `str[i] * i` instead of `str[i]` (i starts at 0). Give the new locations of **ant** and **tan**.
--- rubric
1 | (i) ant and tan: 97 + 110 + 116 = 323, location 323 % 11 + 1 = 5; bat and tab: 98 + 97 + 116 = 311, location 4.
1 | (ii) Anagrams (the same letters in a different order) always have the same sum, so they always collide.
1 | (iii) ant: 0 × 97 + 1 × 110 + 2 × 116 = 342, location 2; tan: 0 × 116 + 1 × 97 + 2 × 110 = 317, location 10. They no longer collide.
--- answer
**(i)**

| Word | Sum of the codes | sum % 11 + 1 |
|---|---|---|
| ant | 97 + 110 + 116 = 323 | 323 % 11 = 4, so **5** |
| tan | 116 + 97 + 110 = 323 | **5** |
| bat | 98 + 97 + 116 = 311 | 311 % 11 = 3, so **4** |
| tab | 116 + 97 + 98 = 311 | **4** |

**(ii)** ant and tan collide, and so do bat and tab. Addition gives the same total in any order, so words made of the same letters (anagrams) always get the same sum and **always collide**, however big the table is.

**(iii)** Weighting each code by its position makes the order of the letters matter:

- ant: 0 × 97 + 1 × 110 + 2 × 116 = 342, and 342 % 11 + 1 = **2**
- tan: 0 × 116 + 1 × 97 + 2 × 110 = 317, and 317 % 11 + 1 = **10**

They no longer collide. (The first letter is multiplied by 0, so words that differ only in their first letter still collide; weighting by i + 1 fixes that.)
--- mistakes
- Forgetting the + 1: the locations run from 1 to 11.
- In (iii), multiplying the first letter by 1: the lecture's i starts at 0.
--- format
A table with each word's sum and location, then one sentence for (ii), then the two weighted sums with their working.

=== fin-3-3b
paper: F3
q: 3
part: b
area: hashgraph
topic: graphs
type: trace
marks: 4
minutes: 9
lessons: j4-dijkstra
--- question
An **undirected** weighted graph has the edges A–B (7), A–C (2), B–C (3), B–D (4), C–D (8), C–E (5), D–E (1), D–F (6) and E–F (9). Run **Dijkstra's algorithm** from A. Give the order in which the vertices are taken off the priority queue, the final cost and parent of every vertex, and the cheapest path from A to F.
--- rubric
1 | The order taken off: A, C, B, E, D, F.
1 | The final costs: A 0, C 2, B 5, E 7, D 8, F 14.
1 | The parents: C ← A, B ← C, E ← C, D ← E, F ← D. B's cost falls from 7 to 5 (through C), and D's from 10 to 9 to 8, as cheaper paths are found.
1 | The cheapest path to F is A → C → E → D → F, costing 2 + 5 + 1 + 6 = 14 (read back from F through the parents).
--- answer
Each step takes the vertex with the smallest cost still on the queue (its cost is then final) and relaxes its edges in alphabetical order:

| Taken off | Its cost | Edges relaxed: new cost (parent) |
|---|---|---|
| A | 0 | B 7 (A), C 2 (A) |
| C | 2 | B 2 + 3 = 5 < 7 (C); D 10 (C); E 7 (C) |
| B | 5 | D 5 + 4 = 9 < 10 (B) |
| E | 7 | D 7 + 1 = 8 < 9 (E); F 16 (E) |
| D | 8 | F 8 + 6 = 14 < 16 (D) |
| F | 14 | nothing left to improve |

| Vertex | A | B | C | D | E | F |
|---|---|---|---|---|---|---|
| cost | 0 | 5 | 2 | 8 | 7 | 14 |
| parent | nil | C | A | E | C | D |

Read backwards through the parents, F ← D ← E ← C ← A, so the cheapest path is **A → C → E → D → F**, costing 2 + 5 + 1 + 6 = **14**. A route with fewer edges is dearer: A → B → D → F costs 7 + 4 + 6 = 17.
--- mistakes
- Treating a cost as final when it is first set: D's cost was 10, then 9, then 8.
- Taking the vertices off in alphabetical order instead of by smallest cost.
- Forgetting that an undirected edge works in both directions (C–B gives B a cheaper path through C).
--- format
A table with one row per vertex taken off, then the table of costs and parents, then the path read back through the parents.

=== fin-3-3c
paper: F3
q: 3
part: c
area: hashgraph
topic: graphs
type: explain
marks: 3
minutes: 6
lessons: j2-graph-code, j1-graph-basics
--- question
(i) Write the **adjacency lists** of the graph in part (b), each list in alphabetical order, writing each entry as the neighbour and the weight (for example B7).

(ii) A different undirected graph has 1,000 vertices and 3,000 edges. How many entries does its adjacency matrix have, and how many list nodes do its adjacency lists need? Which takes less memory here, and why?
--- rubric
1 | The lists for A, B and C: A: B7 C2; B: A7 C3 D4; C: A2 B3 D8 E5.
1 | The lists for D, E and F: D: B4 C8 E1 F6; E: C5 D1 F9; F: D6 E9. Every undirected edge appears in the lists of both its ends (18 entries for 9 edges).
1 | (ii) The matrix has 1,000 × 1,000 = 1,000,000 entries; the lists need 2 × 3,000 = 6,000 nodes. The lists are far smaller: their memory grows with V + E, the matrix's with V², and this graph is sparse.
--- answer
**(i)**

| Vertex | Adjacency list |
|---|---|
| A | B7 → C2 |
| B | A7 → C3 → D4 |
| C | A2 → B3 → D8 → E5 |
| D | B4 → C8 → E1 → F6 |
| E | C5 → D1 → F9 |
| F | D6 → E9 |

Each undirected edge, such as B–D (4), is stored twice: as D4 in B's list and as B4 in D's. So 9 edges give 18 list nodes.

**(ii)** A matrix always has V × V entries: 1,000 × 1,000 = **1,000,000**, almost all of them 0. The lists hold one node for each end of each edge: 2 × 3,000 = **6,000** nodes (plus 1,000 list heads). The lists take far less memory, O(V + E) against O(V²), because the graph is **sparse**: it has few edges compared with V². A matrix is worth it for a dense graph, or when "is there an edge from u to v?" must be answered in O(1).
--- mistakes
- Storing each undirected edge only once.
- Saying the matrix is smaller because it has no pointers: its size does not depend on the number of edges at all.
--- format
One list per vertex, in alphabetical order, then the two counts with the formula used for each.

=== fin-3-4a
paper: F3
q: 4
part: a
area: sortperf
topic: sorting
type: trace
marks: 3
minutes: 6
lessons: k1-simple-sorts
--- stem
This question uses the course's sorting functions on arrays, with locations starting at 0.
--- question
The course's `selectionSort` sorts **35 12 48 7 26** (n = 5). (i) Show the array after each pass of the outer loop (i = 0 to 3). (ii) How many times is `A[j] < A[smallest]` tested in total, and would that number change if the array were already sorted?
--- rubric
1 | i = 0: the smallest value, 7, is swapped into location 0: 7 12 48 35 26. i = 1: 12 is already the smallest of the rest, so the array is unchanged.
1 | i = 2: 26 is swapped with 48: 7 12 26 35 48. i = 3: 35 stays where it is: 7 12 26 35 48.
1 | (ii) 4 + 3 + 2 + 1 = 10 tests, n(n − 1)/2. The number is the same for any input, even a sorted one, because the inner loop always scans to the end.
--- answer
| Pass | Smallest of A[i..4] | Swap | Array afterwards |
|---|---|---|---|
| i = 0 | 7 (location 3) | 35 and 7 | **7** 12 48 35 26 |
| i = 1 | 12 (location 1) | with itself | **7 12** 48 35 26 |
| i = 2 | 26 (location 4) | 48 and 26 | **7 12 26** 35 48 |
| i = 3 | 35 (location 3) | with itself | **7 12 26 35** 48 |

**(ii)** Pass i tests every value after location i: 4 + 3 + 2 + 1 = **10** tests, which is n(n − 1)/2 for n = 5. The inner loop always runs to the end of the array, so an already sorted array still needs all 10: selection sort is O(n²) even in its best case.
--- mistakes
- Shifting values along, as insertion sort does: selection sort makes one swap per pass.
- Stopping early because the array looks sorted after pass i = 2: the course's code always makes n − 1 passes.
--- format
One row per pass with the smallest value found, the swap and the whole array, with the sorted part marked.

=== fin-3-4b
paper: F3
q: 4
part: b
area: sortperf
topic: sorting
type: trace
marks: 4
minutes: 8
lessons: k2-merge-sort
--- question
The course's `mergeSort` is called as `mergeSort (A, 0, 7)` on **42 17 8 33 25 4 50 12**. List the calls of `mergeArray (A, p, q, r)` **in the order they happen**, with the whole array after each one. How many calls of `mergeArray` are there?
--- rubric
1 | The first three merges: (0, 0, 1) gives 17 42 8 33 …; (2, 2, 3) leaves 8 33 in place; (0, 1, 3) gives 8 17 33 42 25 4 50 12.
1 | The left half is completely sorted before the right half is split; then (4, 4, 5) gives 4 25 and (6, 6, 7) gives 12 50.
1 | (4, 5, 7) gives 8 17 33 42 4 12 25 50, and the last merge, (0, 3, 7), gives 4 8 12 17 25 33 42 50.
1 | 7 calls of mergeArray: one for every call of mergeSort on two or more values, which is n − 1 for n = 8.
--- answer
| Order | mergeArray (A, p, q, r) | Merges | Array afterwards |
|---|---|---|---|
| 1 | (0, 0, 1) | 42 with 17 | **17 42** 8 33 25 4 50 12 |
| 2 | (2, 2, 3) | 8 with 33 | 17 42 **8 33** 25 4 50 12 |
| 3 | (0, 1, 3) | 17 42 with 8 33 | **8 17 33 42** 25 4 50 12 |
| 4 | (4, 4, 5) | 25 with 4 | 8 17 33 42 **4 25** 50 12 |
| 5 | (6, 6, 7) | 50 with 12 | 8 17 33 42 4 25 **12 50** |
| 6 | (4, 5, 7) | 4 25 with 12 50 | 8 17 33 42 **4 12 25 50** |
| 7 | (0, 3, 7) | 8 17 33 42 with 4 12 25 50 | **4 8 12 17 25 33 42 50** |

The recursion finishes the whole left half (merges 1 to 3) before it even splits the right half, because `mergeSort (A, start, mid)` runs to the end before `mergeSort (A, mid+1, end)` starts. There are **7** calls of mergeArray: every call of mergeSort on two or more values makes exactly one, and for n = 8 there are n − 1 = 7 such calls.
--- mistakes
- Doing all the merges of one size first, level by level: that is not the order the recursion runs in.
- Leaving out merge 2 because 8 and 33 are already in order: the call still happens.
--- format
One row per mergeArray call, in order, with p, q and r and the whole array.

=== fin-3-4c
paper: F3
q: 4
part: c
area: sortperf
topic: bigo
type: complexity
marks: 3
minutes: 6
lessons: l1-performance, l3-deep-big-o
--- question
For each fragment, give the value of `count` at the end when **n = 16**, and the big-O in terms of n, with a reason. `count` starts at 0.

(i)

```cpp
for (int i = 1; i < n; i = i * 2)
	for (int j = 0; j < n; j++)
		count++;
```

(ii)

```cpp
for (int i = 0; i < n; i++)
	for (int j = i; j < n; j++)
		count++;
```

(iii)

```cpp
int k = n;
while (k > 1) {
	k = k / 2;
	count++;
}
```
--- rubric
1 | (i) 64: i takes the values 1, 2, 4 and 8 (log₂ 16 = 4 times) and the inner loop runs 16 times for each: O(n log n).
1 | (ii) 136: the inner loop runs 16, 15, …, 1 times, n(n + 1)/2 = 136 in all: O(n²).
1 | (iii) 4: k goes 16, 8, 4, 2, 1, halving each time: O(log n).
--- answer
- **(i) 64, O(n log n).** i doubles each time: 1, 2, 4, 8, and then 16 ends the loop. That is log₂ n = 4 outer passes, and each one runs the inner loop n = 16 times: 4 × 16 = 64.
- **(ii) 136, O(n²).** When i = 0 the inner loop runs 16 times, when i = 1 it runs 15 times, and so on down to 1: 16 + 15 + … + 1 = n(n + 1)/2 = 136. That is about n²/2, and the constant is dropped: O(n²).
- **(iii) 4, O(log n).** Each pass halves k: 16 → 8 → 4 → 2 → 1, and the loop stops when k reaches 1. A loop that halves its variable runs about log₂ n times.
--- mistakes
- Calling (i) O(n²) because it has two nested loops: its outer loop runs only about log n times.
- Calling (ii) O(n) or O(n log n) because the inner loop gets shorter: the total is still about n²/2.
--- format
The count for n = 16 first, then the big-O, then the reason in one sentence.

=== fin-4-1a
paper: F4
q: 1
part: a
area: core
topic: cpp
type: trace
marks: 3
minutes: 6
lessons: b5-pointers-arrays
--- stem
This question uses pointers, recursion and the course's linked list node, `struct Node { int data; Node * next; };`, with `createNode (n)` returning a new node that holds `n` and points to `NULL`.
--- question
What does this code print? Say what p and q point to after each line.

```cpp
int A[] = {10, 20, 30, 40, 50};
int * p = A;
int * q = &A[3];
p = p + 1;
*p = *q - *A;
q--;
*q = *(p + 2) / 10;
cout << A[1] << " " << A[2] << " " << A[3] << " " << q - p << endl;
```
--- rubric
1 | p = p + 1 moves p to A[1] (one element on, not one byte); *p = *q − *A sets A[1] = 40 − 10 = 30.
1 | q-- moves q back to A[2]; *(p + 2) is A[3], which is 40, so A[2] = 40 / 10 = 4.
1 | Output: 30 4 40 1. q − p is the number of elements between the two pointers: 2 − 1 = 1.
--- answer
| Line | p points to | q points to | What changes |
|---|---|---|---|
| `int * p = A;` and `int * q = &A[3];` | A[0] | A[3] | nothing yet |
| `p = p + 1;` | **A[1]** | A[3] | p moves one element on |
| `*p = *q - *A;` | A[1] | A[3] | A[1] = A[3] − A[0] = 40 − 10 = **30** |
| `q--;` | A[1] | **A[2]** | q moves one element back |
| `*q = *(p + 2) / 10;` | A[1] | A[2] | p + 2 is A[3], so A[2] = 40 / 10 = **4** |

Output: **30 4 40 1**. `*A` is A[0], because an array's name is the address of its first element. `q - p` counts **elements**, not bytes: q is at index 2 and p at index 1, so q − p = 1.
--- mistakes
- Reading `p = p + 1` as adding 1 to the value p points to: it moves the pointer.
- Giving q − p in bytes (4 or 8): subtracting two pointers counts elements.
--- format
A table with one row per line, showing where p and q point and which element changes, then the output.

=== fin-4-1b
paper: F4
q: 1
part: b
area: core
topic: lists
type: code
marks: 4
minutes: 9
lessons: c4-deletion, c3-insertion
--- question
Write a function `moveLastToFront` that moves the **last** node of a linked list to the front, by changing pointers (no new nodes), and returns the new top. An empty list, or a list with one node, is returned unchanged.

```cpp
Node * moveLastToFront (Node * top);
```

For example, 1 → 2 → 3 → 4 → 5 becomes 5 → 1 → 2 → 3 → 4.
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | An empty list or a one-node list is returned as it is, tested before any next pointer is followed.
1 | Walks to the last node, keeping a pointer to the node before it (prev).
1 | The node before the last becomes the new last node: prev->next = NULL.
1 | The old last node points to the old top and is returned as the new top.
--- answer
```cpp
Node * moveLastToFront (Node * top) {
	if (top == NULL || top->next == NULL)
		return top;
	Node * prev = NULL;
	Node * curr = top;
	while (curr->next != NULL) {
		prev = curr;
		curr = curr->next;
	}
	prev->next = NULL;
	curr->next = top;
	return curr;
}
```

As in deleting the last node, this needs the node **before** the last one, so prev follows one step behind curr. When curr reaches the last node, two pointers change: `prev->next = NULL` cuts the last node off, and `curr->next = top` puts it in front. One walk along the list: O(n).
--- mistakes
- Forgetting `prev->next = NULL`: the list becomes a loop (5 → 1 → 2 → 3 → 4 → 5 → …).
- Returning top instead of the old last node.
- Not handling a one-node list first: prev would still be NULL at `prev->next`.
--- format
Handle the small cases first, then draw the list before and after, marking the two pointers that change.
--- check
void printList (Node * top) { if (top == NULL) { cout << "(empty)" << endl; return; } for (Node * c = top; c != NULL; c = c->next) cout << c->data << " "; cout << endl; }
Node * build (int v[], int n) { Node * top = NULL; for (int i = n - 1; i >= 0; i--) { Node * x = createNode (v[i]); x->next = top; top = x; } return top; }
int main () {
	int a[] = {1, 2, 3, 4, 5};
	int b[] = {8, 9};
	printList (moveLastToFront (build (a, 5)));
	printList (moveLastToFront (build (b, 2)));
	printList (moveLastToFront (createNode (7)));
	printList (moveLastToFront (NULL));
	return 0;
}
--- expect
5 1 2 3 4
9 8
7
(empty)

=== fin-4-1c
paper: F4
q: 1
part: c
area: core
topic: recursion
type: trace
marks: 3
minutes: 6
lessons: d1-how-recursion-works, d4-deep-recursion
--- question
```cpp
int power (int x, int n) {
	if (n == 0)
		return 1;
	int half = power (x, n / 2);
	if (n % 2 == 0)
		return half * half;
	return half * half * x;
}
```

(i) `main` calls `power (2, 13)`. List the calls in the order they start (by their n), and the value each returns. (ii) What is the big-O of `power (x, n)` in terms of n, and why? (iii) A simpler version returns `x * power (x, n - 1)`, with the same base case. How many calls does it make for n = 13?
--- rubric
1 | (i) The calls have n = 13, 6, 3, 1 and 0 (5 calls); on the way back they return 1, 2, 8, 64 and 8192.
1 | (ii) O(log n): n is halved at each call, so there are about log₂ n + 2 calls, each doing a constant amount of work.
1 | (iii) 14 calls (n = 13 down to 0): that version is O(n).
--- answer
**(i)** Each call waits for `power (x, n / 2)` (integer division), squares the answer, and multiplies by x once more when n is odd:

| Call | n / 2 | Returns |
|---|---|---|
| power (2, 13) | 6 | 64 × 64 × 2 = **8192** (13 is odd) |
| power (2, 6) | 3 | 8 × 8 = 64 |
| power (2, 3) | 1 | 2 × 2 × 2 = 8 (3 is odd) |
| power (2, 1) | 0 | 1 × 1 × 2 = 2 (1 is odd) |
| power (2, 0) | | 1 (the base case) |

That is 5 calls, and 8192 = 2¹³.

**(ii) O(log n).** n is halved at every call (13, 6, 3, 1, 0), so there are about log₂ n + 2 calls, and each does a constant amount of work besides its one recursive call. Keeping the answer in `half` matters: `power (x, n / 2) * power (x, n / 2)` would make two calls each time and lose the speed-up.

**(iii) 14 calls** (n = 13, 12, …, 1, 0): one call for each value of n, so that version is O(n).
--- mistakes
- Treating 13 / 2 as 6.5: integer division drops the fraction, so it is 6.
- Forgetting the extra × x when n is odd.
--- format
A table of the calls going down and their values coming back up, then the big-O with the halving named.

=== fin-4-2a
paper: F4
q: 2
part: a
area: trees
topic: bst
type: trace
marks: 4
minutes: 9
lessons: g2-insert-search, g4-deletion
--- stem
This question uses binary trees, binary search trees and max-heaps stored in an array from index 1, as in the course: `struct BTNode { int data; BTNode * left; BTNode * right; };` and `struct MaxHeap { int A [100]; int size; };`.
--- question
The keys **50, 30, 70, 20, 40, 60, 80, 35, 45, 65** are inserted in that order into an empty BST.

(i) Which keys are compared when searching for **45**, and when searching for **62**?

(ii) Then **30** is deleted, and then **50**, as in the course (a node with two children takes its inorder successor's key). Give the level order of the tree after each deletion.
--- rubric
1 | (i) 45 is compared with 50, 30, 40 and 45 (found). 62 is compared with 50, 70, 60 and 65, and then the search reaches an empty subtree, so 62 is not in the tree.
1 | Deleting 30 (two children): its inorder successor is 35, the smallest key in its right subtree; 35 is copied into 30's node and the leaf 35 is removed.
1 | Level order after deleting 30: 50 35 70 20 40 60 80 45 65.
1 | Deleting 50: its successor is 60 (from 70 go left to 60, which has no left child); 60 is copied up and its node is replaced by its right child, 65. Level order: 60 35 70 20 40 65 80 45.
--- answer
:::diagram tree bst:50 30 70 20 40 60 80 35 45 65
The BST before any deletion.
:::

**(i)** A search compares the key with each node on its path, going left when the key is smaller and right when it is larger:

- **45**: 50 (smaller, go left), 30 (larger, go right), 40 (larger, go right), **45**: found after 4 comparisons.
- **62**: 50 (larger, go right), 70 (smaller, go left), 60 (larger, go right), 65 (smaller, go left). The left subtree of 65 is empty, so **62 is not in the tree**.

**(ii)** Delete 30: it has two children (Case 3). Its inorder successor is the minimum of its right subtree: from 40 go left to **35**, which has no left child. Copy 35 into 30's node, then remove the leaf 35 (Case 1).

:::diagram tree 50(35(20,40(,45)),70(60(,65),80))
After deleting 30.
:::

Level order: **50 35 70 20 40 60 80 45 65**.

Delete 50, the root, which has two children: its successor is the minimum of the right subtree, so from 70 go left to **60**, which has no left child. Copy 60 into the root, then remove the old 60 node. It has one child, 65, which takes its place (Case 2).

:::diagram tree 60(35(20,40(,45)),70(65,80))
After deleting 50.
:::

Level order: **60 35 70 20 40 65 80 45**.
--- mistakes
- Using the largest key of the left subtree (the predecessor): the course uses the inorder successor.
- Removing the successor's node together with its child 65: the child moves up into its place.
--- format
Draw the tree after each deletion, name the successor, then write the level order.

=== fin-4-2b
paper: F4
q: 2
part: b
area: trees
topic: trees
type: code
marks: 3
minutes: 6
lessons: f3-tree-code
--- question
Write a **recursive** function `mirror` that turns a binary tree into its mirror image: at every node, the left and right subtrees swap places.

```cpp
void mirror (BTNode * root);
```

Mirroring a BST makes its inorder traversal come out from the largest key to the smallest.
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; };
BTNode * createBTNode (int data) { BTNode * newNode = new BTNode; newNode->data = data; newNode->left = NULL; newNode->right = NULL; return newNode; }
BTNode * insertBST (BTNode * root, int key) { if (root == NULL) return createBTNode (key); if (key < root->data) root->left = insertBST (root->left, key); else if (key > root->data) root->right = insertBST (root->right, key); return root; }
--- rubric
1 | An empty tree: nothing to do, so return.
1 | Swaps the node's left and right pointers, using a temporary pointer.
1 | Mirrors both subtrees with recursive calls (before or after the swap).
--- answer
```cpp
void mirror (BTNode * root) {
	if (root == NULL)
		return;
	BTNode * temp = root->left;
	root->left = root->right;
	root->right = temp;
	mirror (root->left);
	mirror (root->right);
}
```

Every node swaps its own two pointers, and the recursion makes every subtree do the same, so the whole tree is reflected. Each node is visited once: O(n). For the BST built from 50 30 70 20 40 60 80, the inorder afterwards is 80 70 60 50 40 30 20 and the preorder is 50 70 80 60 30 40 20.
--- mistakes
- Swapping the two children's data instead of the pointers: their subtrees stay where they were.
- Writing `root->left = root->right; root->right = root->left;` without a temporary: both pointers end up at the same subtree.
--- format
The base case first, then the three-line swap with a temporary pointer, then the two recursive calls.
--- check
void inorder (BTNode * root) { if (root == NULL) return; inorder (root->left); cout << root->data << " "; inorder (root->right); }
void preorder (BTNode * root) { if (root == NULL) return; cout << root->data << " "; preorder (root->left); preorder (root->right); }
int main () {
	BTNode * root = NULL;
	int keys[] = {50, 30, 70, 20, 40, 60, 80};
	for (int i = 0; i < 7; i++)
		root = insertBST (root, keys[i]);
	mirror (root);
	inorder (root);
	cout << endl;
	preorder (root);
	cout << endl;
	mirror (NULL);
	cout << "done" << endl;
	return 0;
}
--- expect
80 70 60 50 40 30 20
50 70 80 60 30 40 20
done

=== fin-4-2c
paper: F4
q: 2
part: c
area: trees
topic: heaps
type: trace
marks: 3
minutes: 6
lessons: h2-heapify-build, h1-heap-arrays
--- question
A heap of size 8 is stored from index 1 as **15 40 30 25 35 10 20 5**. Only the root breaks the max-heap property. (i) Show the array after `maxHeapify (heap, 1)`, saying which values are swapped at each step. (ii) Why does maxHeapify take O(log n) time on a heap of n values?
--- rubric
1 | 15 is swapped with its larger child, 40 (index 2): 40 15 30 25 35 10 20 5.
1 | At index 2, 15 is swapped with its larger child, 35 (index 5). Index 5 has no children (10 and 11 are past size 8), so it stops: 40 35 30 25 15 10 20 5.
1 | (ii) Each swap moves the value down one level, and a heap of n values has height ⌊log₂ n⌋ (3 for n = 8), so there are at most about log₂ n swaps.
--- answer
| At index | Value | Children (index: value) | Larger child | Array afterwards |
|---|---|---|---|---|
| 1 | 15 | 2: 40, 3: 30 | 40 | 40 **15** 30 25 35 10 20 5 |
| 2 | 15 | 4: 25, 5: 35 | 35 | 40 35 30 25 **15** 10 20 5 |
| 5 | 15 | 10 and 11 are past the end | none | stop |

:::diagram heap 40 35 30 25 15 10 20 5
The max-heap after maxHeapify (heap, 1).
:::

**(ii)** maxHeapify only ever moves one value down, one level per swap, and it stops at a leaf at the latest. A heap is an almost complete tree, so its height is ⌊log₂ n⌋: for n = 8, three levels below the root. So it makes at most that many swaps: **O(log n)**.
--- mistakes
- Swapping with the first child that is larger than the value: at index 2, 25 is larger than 15, but maxHeapify swaps with the larger child, 35.
- Looking at index 10 although the heap holds only 8 values: maxHeapify tests `left <= heap->size` first.
--- format
One row per step with the children compared, then the final array.

=== fin-4-3a
paper: F4
q: 3
part: a
area: hashgraph
topic: hashing
type: trace
marks: 3
minutes: 6
lessons: i2-probing, i1-hash-tables
--- question
A hash table has locations 1 to 11 and uses **h(key) = key % 11 + 1** with **linear probing** (try the next location, wrapping from 11 to 1).

(i) Insert **27, 49, 13, 38, 21, 32** in that order and show the table.

(ii) What is the load factor?

(iii) On average, how many locations does a successful search examine, over these six keys?
--- rubric
1 | 27 goes to 6; 49 also hashes to 6, so it goes to 7; 13 goes to 3; 38 hashes to 6 and moves past 6 and 7 to 8.
1 | 21 goes to 11; 32 also hashes to 11, which is taken, so it wraps around to 1.
1 | (ii) The load factor is 6 / 11 ≈ 0.55. (iii) (1 + 2 + 1 + 3 + 1 + 2) / 6 = 10 / 6 ≈ 1.67 locations.
--- answer
| Key | key % 11 + 1 | Locations tried | Stored at |
|---|---|---|---|
| 27 | 6 | 6 | 6 |
| 49 | 6 | 6, 7 | 7 |
| 13 | 3 | 3 | 3 |
| 38 | 6 | 6, 7, 8 | 8 |
| 21 | 11 | 11 | 11 |
| 32 | 11 | 11, 1 | 1 |

:::diagram hash linear 11
27 49 13 38 21 32
The table after the six insertions: 32 wrapped around from 11 to 1.
:::

**(ii)** The load factor is keys ÷ locations = 6 / 11 ≈ **0.55**.

**(iii)** A successful search retraces the key's insertion, so it examines the same locations: 1, 2, 1, 3, 1 and 2. On average that is (1 + 2 + 1 + 3 + 1 + 2) / 6 = 10 / 6 ≈ **1.67** locations. As the load factor grows, the clusters grow, and this average rises.
--- mistakes
- Putting 32 at location 12: there is no 12, so the probe wraps around to 1.
- Writing the load factor as 11 / 6: it is the number of keys divided by the number of locations, at most 1 for open addressing.
--- format
A table of the locations tried for each key, then the final table, then the two numbers with their working.

=== fin-4-3b
paper: F4
q: 3
part: b
area: hashgraph
topic: graphs
type: trace
marks: 4
minutes: 9
lessons: j3-bfs-dfs
--- question
An **undirected** graph has the edges A–B, A–D, B–C, B–E, D–E, D–F and E–G. Its adjacency lists are in alphabetical order. Run the course's **depth-first search** from A. Give (i) the order in which the vertices are visited (turn GREY), (ii) the order in which they turn BLACK, and (iii) the edges of the depth-first tree.
--- rubric
1 | (i) A B C E D F G.
1 | C turns BLACK first: its only neighbour, B, is GREY, so the search backs up to B and goes on to E.
1 | (ii) BLACK order: C F D G E B A.
1 | (iii) Tree edges: A–B, B–C, B–E, E–D, D–F and E–G (6 edges joining 7 vertices). A–D is not one: when D looks at A, A is already GREY.
--- answer
The adjacency lists are A: B D; B: A C E; C: B; D: A E F; E: B D G; F: D; G: E.

| Call | Visits | What happens |
|---|---|---|
| dfTraverse(A) | **A** | B is WHITE: call |
| dfTraverse(B) | **B** | A is GREY; C is WHITE: call |
| dfTraverse(C) | **C** | its only neighbour, B, is GREY: **C turns BLACK**, back to B |
| (back in B) | | E is WHITE: call |
| dfTraverse(E) | **E** | B is GREY; D is WHITE: call |
| dfTraverse(D) | **D** | A and E are GREY; F is WHITE: call |
| dfTraverse(F) | **F** | D is GREY: **F turns BLACK**; back in D, nothing is left: **D turns BLACK** |
| (back in E) | | G is WHITE: call |
| dfTraverse(G) | **G** | E is GREY: **G turns BLACK**; then **E** and **B turn BLACK** |
| (back in A) | | D is BLACK: **A turns BLACK** |

- **(i)** Visited: **A B C E D F G**.
- **(ii)** Turned BLACK: **C F D G E B A**.
- **(iii)** The tree edges join each call to the call it made: **A–B, B–C, B–E, E–D, D–F, E–G**, 6 edges joining all 7 vertices. A–D is not a tree edge: when D looks at A, A is already GREY.
--- mistakes
- Visiting D straight after B or C because A–D is an edge: depth-first search follows B's branch to its end first.
- Turning a vertex BLACK as soon as it is visited: it turns BLACK only when all its neighbours have been looked at.
--- format
A table of the calls with each neighbour's colour when it is looked at, then the two orders and the tree edges.

=== fin-4-3c
paper: F4
q: 3
part: c
area: hashgraph
topic: graphs
type: explain
marks: 3
minutes: 5
lessons: j1-graph-basics
--- question
(i) An undirected graph has 7 vertices and 10 edges. What do the degrees of all its vertices add up to, and why?

(ii) Can an undirected graph have five vertices with the degrees 3, 3, 2, 2 and 1? Explain.

(iii) A directed graph has the edges A→B, B→C, C→A and C→D. Is it strongly connected? Explain.
--- rubric
1 | (i) 20: every edge touches two vertices and adds 1 to the degree of each, so the degrees add up to 2 × 10.
1 | (ii) No: 3 + 3 + 2 + 2 + 1 = 11 is odd, but the sum of the degrees is always twice the number of edges, an even number.
1 | (iii) No: D has no edges leaving it, so there is no path from D to A, B or C (although A, B and C can all reach each other and D).
--- answer
- **(i) 20.** Each edge has two ends, and each end adds 1 to the degree of the vertex it touches. So every edge adds 2 to the total, and 10 edges give **2 × 10 = 20**, however they are arranged.
- **(ii) No.** The degrees would add up to 3 + 3 + 2 + 2 + 1 = **11**, an odd number. By (i), the total is always twice the number of edges, so it must be even. No such graph exists.
- **(iii) No.** Strongly connected means there is a path between any two vertices in **both** directions. A → B → C → A is a cycle, and C → D reaches D, but D has no edges leaving it, so nothing can be reached **from** D.
--- mistakes
- In (i), answering 10: each edge counts once at each of its two ends.
- In (iii), answering yes because every vertex can be reached from A: the paths must exist in both directions.
--- format
Start each answer with the result (a number, yes or no), then the one fact that proves it.

=== fin-4-4a
paper: F4
q: 4
part: a
area: sortperf
topic: sorting
type: trace
marks: 4
minutes: 9
lessons: k3-quick-sort
--- stem
This question uses the course's sorting functions on arrays, with locations starting at 0.
--- question
The course's `quickSort` is called as `quickSort (A, 0, 6)` on **45 12 78 33 59 21 40**. For every call of `partition`, give p, r, the pivot, the array afterwards and the value returned. How many times is `partition` called?
--- rubric
1 | partition (A, 0, 6), pivot 40: 12, 33 and 21 are moved into the small region, giving 12 33 21 40 59 78 45; it returns 3.
1 | partition (A, 0, 2), pivot 21: gives 12 21 33 40 59 78 45 and returns 1. The parts (0, 0) and (2, 2) have one value, so they are not partitioned.
1 | partition (A, 4, 6), pivot 45: 59 and 78 are both larger, so 45 moves to location 4: 12 21 33 40 45 78 59, returns 4. Then partition (A, 5, 6), pivot 59: 12 21 33 40 45 59 78, returns 5.
1 | partition is called 4 times: only for parts with two or more values (p < r).
--- answer
| Call | Pivot A[r] | Array afterwards | Returns q |
|---|---|---|---|
| partition (A, 0, 6) | 40 | 12 33 21 **40** 59 78 45 | 3 |
| partition (A, 0, 2) | 21 | 12 **21** 33 40 59 78 45 | 1 |
| partition (A, 4, 6) | 45 | 12 21 33 40 **45** 78 59 | 4 |
| partition (A, 5, 6) | 59 | 12 21 33 40 45 **59** 78 | 5 |

In the first call, j walks from 0 to 5. 12, 33 and 21 are ≤ 40, so each is exchanged into the small region (i becomes 0, then 1, then 2), while 45, 78 and 59 stay in the big region. Finally the pivot is exchanged with A[3], the first big value, which puts it in its final place.

After each partition, quickSort calls itself on (p, q − 1) and (q + 1, r). The calls on (0, 0), (2, 2), (4, 3), (5, 4) and (6, 6) have fewer than two values, so `p < r` is false and they do nothing. **partition is called 4 times**, and the result is 12 21 33 40 45 59 78.
--- mistakes
- Choosing the first value as the pivot: the course's partition uses the last value, A[r].
- Partitioning parts with one value, or none: quickSort calls partition only when p < r.
--- format
One row per partition call: p and r, the pivot, the whole array afterwards, and q.

=== fin-4-4b
paper: F4
q: 4
part: b
area: sortperf
topic: sorting
type: trace
marks: 3
minutes: 6
lessons: k1-simple-sorts
--- question
The course's `bubbleSort` sorts **31 12 45 7 23** (n = 5). (i) Show the array after each pass of the outer loop (i = 0 to 3), and how many swaps each pass makes. (ii) The array is sorted after pass i = 2. Why does the course's code still make pass i = 3?
--- rubric
1 | i = 0: 12 31 7 23 45 (3 swaps, carrying 45 to the end); i = 1: 12 7 23 31 45 (2 swaps).
1 | i = 2: 7 12 23 31 45 (1 swap); i = 3: no swaps. 6 swaps in all.
1 | (ii) The course's bubbleSort never checks for a pass without swaps: its loops always make n − 1 passes and n(n − 1)/2 = 10 comparisons.
--- answer
| Pass | Comparisons | Swaps | Array afterwards |
|---|---|---|---|
| i = 0 | j = 0 to 3 | 31 and 12, 45 and 7, 45 and 23 | 12 31 7 23 **45** |
| i = 1 | j = 0 to 2 | 31 and 7, 31 and 23 | 12 7 23 **31 45** |
| i = 2 | j = 0 to 1 | 12 and 7 | 7 12 **23 31 45** |
| i = 3 | j = 0 | none | **7 12 23 31 45** |

**(ii)** Both loops have fixed counts: i runs from 0 to n − 2 whatever happens, so the code makes all n − 1 = 4 passes and 4 + 3 + 2 + 1 = 10 comparisons, even though pass i = 3 swaps nothing. A version that stopped after a pass with no swaps would be O(n) on a sorted array; the course's version is O(n²) on every input.
--- mistakes
- Carrying the smallest value to the front: each pass of bubble sort carries the largest remaining value to the end.
- Comparing all the way to the end on every pass: pass i stops at j = n − 2 − i, because the last i values are already in place.
--- format
One row per pass with each swap and the whole array, with the values already in place marked.

=== fin-4-4c
paper: F4
q: 4
part: c
area: sortperf
topic: sorting
type: explain
marks: 3
minutes: 5
lessons: k4-sorting-performance
--- question
Name the best sort from the course for each situation, and give the reason.

(i) An array that is already nearly sorted: only a few values are out of place.

(ii) The sort must be O(n log n) even in the worst case, and there is no room for a second array.

(iii) Large arrays of random values, where the fastest average time matters most.
--- rubric
1 | (i) Insertion sort: each value shifts only a few places, so it does close to n steps (O(n) on a sorted array).
1 | (ii) Heap sort: it is O(n log n) in every case and sorts in place (merge sort is O(n log n) but needs extra arrays; quick sort's worst case is O(n²)).
1 | (iii) Quick sort: O(n log n) on average, with a simple inner loop and no extra arrays; its O(n²) worst case is rare on random data.
--- answer
- **(i) Insertion sort.** Its inner loop stops as soon as the value is in place, so a nearly sorted array needs only a few shifts: close to O(n). Selection sort would still make n(n − 1)/2 comparisons.
- **(ii) Heap sort.** Like merge sort it is O(n log n) in every case, but it sorts inside the array, while mergeArray needs the extra arrays L and R. Quick sort is in place too, but its worst case is O(n²).
- **(iii) Quick sort.** On random data it is O(n log n) on average and usually the fastest in practice: its partition loop is simple and it needs no extra arrays. Its O(n²) worst case (for example, on sorted input) is rare when the values are random.
--- mistakes
- Choosing merge sort for (ii): it is O(n log n), but it needs extra arrays for merging.
- Choosing quick sort for (ii): its worst case is O(n²).
--- format
The name of the sort, then the fact about its cost or memory that makes it the right choice.
