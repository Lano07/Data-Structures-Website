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
