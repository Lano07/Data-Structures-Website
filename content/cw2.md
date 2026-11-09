# Coursework Exam #2 mock papers: original questions written for this site, in the format of the COMP 2611 Coursework Exam #2
# outline (4 short-answer questions, 40 marks, 90 minutes): Q1 linked lists, stacks and queues (9), Q2 binary trees and BSTs (11),
# Q3 heaps and priority queues (10), Q4 hashing and graphs (7) plus performance analysis (3). None is from a UWI past paper.
# Each part is a block; parts with the same paper and q form one question. Code answers are compiled and run with g++ at build time,
# and every trace was checked by a script that follows the course's algorithms.
# area: lsq (lists, stacks, queues), trees, heaps, hashgraph, perf

=== cw2-a1a
paper: A
q: 1
part: a
area: lsq
topic: lists
type: code
marks: 4
minutes: 9
lessons: c3-insertion
--- stem
A linked list of integers uses the course's node, and the list is reached through the pointer `top`:

```cpp
struct Node {
	int data;
	Node * next;
};
```

You may use `createNode (n)`, which returns a new node holding `n` with `next` set to `NULL`.
--- question
Write a function `insertAtTail` that adds a new node holding `n` at the **end** of the list and returns the (possibly new) top of the list. It must work for an empty list.

```cpp
Node * insertAtTail (Node * top, int n);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Creates the new node holding n (with createNode), so its next is NULL.
1 | Empty list (top == NULL): returns the new node, which becomes the top.
1 | Otherwise walks a separate pointer to the last node, moving while curr->next != NULL.
1 | Links the last node to the new node (curr->next = newNode) and returns top.
--- answer
```cpp
Node * insertAtTail (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL)
		return newNode;
	Node * curr = top;
	while (curr->next != NULL)
		curr = curr->next;
	curr->next = newNode;
	return top;
}
```

The empty list is the only case where `top` changes, which is why the function returns the top and the caller writes `top = insertAtTail (top, n);`. The loop stops **on** the last node (its `next` is `NULL`), so that node's `next` can point to the new node. Cost: O(n), because the whole list is walked.
--- mistakes
- Looping while `curr != NULL`: `curr` falls off the end, and `curr->next = newNode` follows a NULL pointer.
- Forgetting the empty list, so `top->next` is followed when `top` is NULL.
- Returning `newNode` in every case, which loses the rest of the list.
--- format
Write the whole function with its header. Handle the empty list first, in its own `if`, so the marker sees it.
--- check
void printList (Node * top) { for (Node * c = top; c != NULL; c = c->next) cout << c->data << " "; cout << endl; }
int main () {
	Node * top = NULL;
	top = insertAtTail (top, 5);
	printList (top);
	top = insertAtTail (top, 7);
	top = insertAtTail (top, 9);
	printList (top);
	return 0;
}
--- expect
5
5 7 9

=== cw2-a1b
paper: A
q: 1
part: b
area: lsq
topic: stacks
type: trace
marks: 3
minutes: 7
lessons: e1-stacks, e2-queues
--- question
`s` is an empty stack and `q` an empty queue of integers, using the course's functions (`push`, `pop`, `enqueue`, `dequeue`, `isEmpty`). What does this code print? Show the stack and the queue after each line.

```cpp
push (s, 4);
push (s, 9);
enqueue (q, 6);
enqueue (q, pop (s));
push (s, 2);
push (s, dequeue (q));
enqueue (q, pop (s));
cout << pop (s) << " ";
while (!isEmpty (q))
	cout << dequeue (q) << " ";
```
--- rubric
1 | The first value printed is 2: after the moves the stack holds 4 2 (2 on top).
1 | Then 9 and 6, in that order: the queue gives values back in the order they joined it.
1 | Shows the stack and queue after each line (ending with 4 still on the stack and the queue empty).
--- answer
Output: **2 9 6**

| Line | Stack (top on the right) | Queue (front on the left) |
|---|---|---|
| push (s, 4); push (s, 9); | 4 9 | (empty) |
| enqueue (q, 6); | 4 9 | 6 |
| enqueue (q, pop (s)); pop gives 9 | 4 | 6 9 |
| push (s, 2); | 4 2 | 6 9 |
| push (s, dequeue (q)); dequeue gives 6 | 4 2 6 | 9 |
| enqueue (q, pop (s)); pop gives 6 | 4 2 | 9 6 |
| cout << pop (s); prints **2** | 4 | 9 6 |
| the loop prints **9** then **6** | 4 | (empty) |

A stack gives back the most recent value (LIFO); a queue gives back the oldest (FIFO).
--- mistakes
- Treating the queue like a stack, and printing 6 before 9.
- Losing track of which value `pop` or `dequeue` hands to the outer call.
--- format
A table with one row per line and two columns (stack, queue) is the fastest way to earn the working mark. Mark which end is the top or front.

=== cw2-a1c
paper: A
q: 1
part: c
area: lsq
topic: stacks
type: code
marks: 2
minutes: 5
lessons: e3-applications
--- question
Using a stack, write `printReverse`, which prints the values of the list from the **last** node to the first, without recursion. Use the course's stack functions; you do not need to write them:

```cpp
Stack * initStack ();
void push (Stack * stack, int data);
int pop (Stack * stack);
bool isEmpty (Stack * stack);

void printReverse (Node * top);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
struct Stack { Node * top; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
Stack * initStack () { Stack * stack = new Stack; stack->top = NULL; return stack; }
bool isEmpty (Stack * stack) { return stack->top == NULL; }
void push (Stack * stack, int data) { Node * newNode = createNode (data); newNode->next = stack->top; stack->top = newNode; }
int pop (Stack * stack) { if (stack->top == NULL) return -999; Node * toDelete = stack->top; stack->top = toDelete->next; int save = toDelete->data; delete toDelete; return save; }
--- rubric
1 | Walks the list from top, pushing every value onto a stack made with initStack.
1 | Then pops and prints until the stack is empty, so the values come out last first.
--- answer
```cpp
void printReverse (Node * top) {
	Stack * s = initStack ();
	Node * curr = top;
	while (curr != NULL) {
		push (s, curr->data);
		curr = curr->next;
	}
	while (!isEmpty (s))
		cout << pop (s) << " ";
	cout << endl;
}
```

The last value pushed is the first popped, so a stack reverses the order. Both loops are O(n).
--- mistakes
- Popping inside the first loop, which prints the list in its original order.
- Writing the stack functions again: the question gives them, and the time is better spent on the loops.
--- format
Two short loops, one to push and one to pop. Using the given function names exactly shows you know the stack's interface.
--- check
int main () {
	Node * top = createNode (3);
	top->next = createNode (8);
	top->next->next = createNode (1);
	printReverse (top);
	return 0;
}
--- expect
1 8 3

=== cw2-a2a
paper: A
q: 2
part: a
area: trees
topic: bst
type: trace
marks: 3
minutes: 6
lessons: g2-insert-search
--- stem
The keys **45, 20, 60, 10, 30, 55, 75, 25, 35, 50** are inserted, in that order, into an empty binary search tree using the course's `insertBST`. The tree uses the course's node:

```cpp
struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
};
```
--- question
Draw the BST after all ten insertions.
--- rubric
1 | 45 is the root, with 20 as its left child and 60 as its right child.
1 | 10 and 30 are the children of 20; 55 and 75 are the children of 60.
1 | 25 and 35 are the children of 30, and 50 is the left child of 55.
--- answer
:::diagram tree 45(20(10,30(25,35)),60(55(50),75))
The BST after inserting 45, 20, 60, 10, 30, 55, 75, 25, 35, 50.
:::

Each key starts at the root and goes left when it is smaller, right when it is larger, until it finds an empty place. For example, 50: right of 45, left of 60, left of 55.
--- mistakes
- Comparing a new key only with the root, then attaching it to the first empty child.
- Putting 50 to the right of 55 (50 is smaller than 55, so it goes left).
--- format
Draw the circles level by level with straight lines to their children. Keep left children clearly to the left: a sloppy drawing can lose the mark for a correct tree.

=== cw2-a2b
paper: A
q: 2
part: b
area: trees
topic: trees
type: trace
marks: 3
minutes: 6
lessons: f2-traversals
--- question
Give the **preorder**, **inorder** and **postorder** traversals of the tree from part (a).
--- rubric
1 | Preorder: 45 20 10 30 25 35 60 55 50 75.
1 | Inorder: 10 20 25 30 35 45 50 55 60 75 (sorted, as it must be for a BST).
1 | Postorder: 10 25 35 30 20 50 55 75 60 45.
--- answer
- **Preorder** (root, left, right): 45 20 10 30 25 35 60 55 50 75
- **Inorder** (left, root, right): 10 20 25 30 35 45 50 55 60 75
- **Postorder** (left, right, root): 10 25 35 30 20 50 55 75 60 45

A quick check: the inorder of a BST is always the keys in ascending order, the preorder starts with the root, and the postorder ends with it.
--- mistakes
- Writing the level order (45 20 60 10 30 55 75 ...) as the preorder.
- In postorder, writing 30 before its children 25 and 35.
--- format
Label each list with its name and separate the keys with spaces. Use the inorder-is-sorted check before moving on.

=== cw2-a2c
paper: A
q: 2
part: c
area: trees
topic: bst
type: trace
marks: 2
minutes: 4
lessons: g4-deletion
--- question
45 is now deleted with the course's `deleteBST`, which replaces a node that has two children with its **inorder successor**. Which key takes 45's place, what happens to the node that held that key, and what does the tree look like afterwards?
--- rubric
1 | 50, the inorder successor (the smallest key in 45's right subtree: right to 60, then left as far as possible), takes 45's place at the root.
1 | 50's old node is a leaf, so it is simply removed: 55 is left with no children, and the rest of the tree is unchanged.
--- answer
45 has two children, so its key is replaced by its inorder successor, the smallest key in its right subtree: from 60 go left to 55, then left to **50**, which has no left child. 50 is copied into the root, and 50's old node (a leaf, the left child of 55) is deleted.

:::diagram tree 50(20(10,30(25,35)),60(55,75))
After deleting 45.
:::
--- mistakes
- Using 35 (the inorder predecessor) when the question names the successor.
- Moving 60 up to the root, which leaves 55 and 50 on the wrong side or lost.
--- format
Name the successor and say how you found it in one line, then draw the new tree. A drawing alone, with no reason, risks losing the first mark.

=== cw2-a2d
paper: A
q: 2
part: d
area: trees
topic: bst
type: code
marks: 3
minutes: 7
lessons: g2-insert-search, f3-tree-code
--- question
Write a **recursive** function `countGreater` that returns how many keys in a BST are greater than `x`. Use the BST property so that a subtree which cannot hold such keys is not visited.

```cpp
int countGreater (BTNode * root, int x);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; };
BTNode * createBTNode (int data) { BTNode * newNode = new BTNode; newNode->data = data; newNode->left = NULL; newNode->right = NULL; return newNode; }
BTNode * insertBST (BTNode * root, int key) { if (root == NULL) return createBTNode (key); if (key < root->data) root->left = insertBST (root->left, key); else if (key > root->data) root->right = insertBST (root->right, key); return root; }
--- rubric
1 | Base case: an empty tree (root == NULL) returns 0.
1 | When root->data > x: counts the root (1) plus the results for both subtrees.
1 | Otherwise visits only the right subtree, because every key on the left is smaller still.
--- answer
```cpp
int countGreater (BTNode * root, int x) {
	if (root == NULL)
		return 0;
	if (root->data > x)
		return 1 + countGreater (root->left, x) + countGreater (root->right, x);
	return countGreater (root->right, x);
}
```

When `root->data <= x`, every key in the left subtree is smaller than `root->data`, so none of them can be greater than `x`; only the right subtree can contribute. On the tree from part (a), `countGreater (root, 30)` is 6 (35, 45, 50, 55, 60, 75).
--- mistakes
- Visiting both subtrees in every case. The answer is still right, but the question asks you to use the BST property, so one mark is lost.
- Going left when `root->data <= x`, which skips the keys that should be counted.
--- format
Base case first, then the two cases. A one-line comment saying why the left subtree is skipped shows the marker you used the BST property on purpose.
--- check
int main () {
	BTNode * root = NULL;
	int keys[] = {45, 20, 60, 10, 30, 55, 75, 25, 35, 50};
	for (int i = 0; i < 10; i++)
		root = insertBST (root, keys[i]);
	cout << countGreater (root, 30) << " " << countGreater (root, 45) << " " << countGreater (root, 100) << " " << countGreater (root, 0) << endl;
	return 0;
}
--- expect
6 4 0 10

=== cw2-a3a
paper: A
q: 3
part: a
area: heaps
topic: heaps
type: trace
marks: 4
minutes: 9
lessons: h2-heapify-build
--- stem
Max-heaps are stored in an array from index 1, as in the course:

```cpp
struct MaxHeap {
	int A [100];
	int size;
};
```
--- question
Run `buildMaxHeap` on the array **4 10 3 5 1 8 9 2 6 7** (A[1] to A[10], size 10). Show the array after each call of `maxHeapify`.
--- rubric
1 | Calls maxHeapify for i = 5, 4, 3, 2, 1 (starting at size / 2 and working down to 1).
1 | After i = 5: 4 10 3 5 7 8 9 2 6 1, and after i = 4: 4 10 3 6 7 8 9 2 5 1.
1 | After i = 3: 4 10 9 6 7 8 3 2 5 1, and i = 2 changes nothing (10 is larger than 6 and 7).
1 | After i = 1: 4 swaps with 10, then with 7, giving the max-heap 10 7 9 6 4 8 3 2 5 1.
--- answer
`buildMaxHeap` calls `maxHeapify (heap, i)` for i = size / 2 = 5 down to 1. Nodes after index 5 are leaves, which are already heaps.

| Call | What happens | Array afterwards |
|---|---|---|
| i = 5 | 1 vs its child 7: swap | 4 10 3 5 **7** 8 9 2 6 **1** |
| i = 4 | 5 vs 2 and 6: swap with 6 | 4 10 3 **6** 7 8 9 2 **5** 1 |
| i = 3 | 3 vs 8 and 9: swap with 9 | 4 10 **9** 6 7 8 **3** 2 5 1 |
| i = 2 | 10 vs 6 and 7: no change | 4 10 9 6 7 8 3 2 5 1 |
| i = 1 | 4 vs 10 and 9: swap with 10; then 4 vs 6 and 7: swap with 7; then 4 vs 1: stop | **10 7** 9 6 **4** 8 3 2 5 1 |

:::diagram heap 10 7 9 6 4 8 3 2 5 1
The max-heap after buildMaxHeap.
:::
--- mistakes
- Starting at i = 1 instead of size / 2: building from the top does not give a heap.
- Stopping after the first swap at i = 1: maxHeapify keeps going until the value is larger than both its children.
- Swapping with the first larger child instead of the **largest** child.
--- format
A table with one row per call and the full array in each row is easy to mark. Bold or underline the values that moved.

=== cw2-a3b
paper: A
q: 3
part: b
area: heaps
topic: heaps
type: trace
marks: 3
minutes: 6
lessons: h3-delete-heapsort
--- question
On the max-heap from part (a), `heapExtractMax` is called **twice**. Give the value each call returns and the array after each call.
--- rubric
1 | The first call returns 10, moves the last value (1) to A[1] and reduces the size to 9.
1 | After the first call: 9 7 8 6 4 1 3 2 5 (1 sinks below 9, then below 8).
1 | The second call returns 9 and leaves 8 7 5 6 4 1 3 2.
--- answer
**First call**: save 10. Move A[10] = 1 to A[1], size = 9: 1 7 9 6 4 8 3 2 5. `maxHeapify (heap, 1)`: 1 swaps with 9 (the larger child), then with 8. Result: **9 7 8 6 4 1 3 2 5**. Returns **10**.

**Second call**: save 9. Move A[9] = 5 to A[1], size = 8: 5 7 8 6 4 1 3 2. `maxHeapify (heap, 1)`: 5 swaps with 8, then 5 is larger than 1 and 3, so it stops. Result: **8 7 5 6 4 1 3 2**. Returns **9**.
--- mistakes
- Moving the larger child up into the hole at A[1] instead of moving the last value there: the tree stops being almost complete.
- Forgetting to reduce the size, so the old last value is still counted.
--- format
For each call, write the value returned, the array just after the move, and the array after maxHeapify.

=== cw2-a3c
paper: A
q: 3
part: c
area: heaps
topic: heaps
type: code
marks: 3
minutes: 7
lessons: h4-insert-priority
--- question
Write the course's function `insertMaxHeap`, which adds the value `n` to a max-heap.

```cpp
void insertMaxHeap (MaxHeap * heap, int n);
```
--- given
#include <iostream>
using namespace std;
struct MaxHeap { int A [100]; int size; };
--- rubric
1 | Increases size by 1 and stores n at A[size], the next free place.
1 | Loops while i > 1 and the parent A[i/2] is smaller than A[i], swapping the two values.
1 | Moves i to i / 2 after each swap, so the value climbs until it is in place or at the root.
--- answer
```cpp
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
```

The new value goes at index size + 1, the only place that keeps the tree almost complete. It can be larger than its parent, so it climbs (bubbles up) one level per swap: O(log n).
--- mistakes
- Testing `i > 0` or forgetting the bound: at i = 1 the "parent" is A[0], which is not part of the heap.
- Calling maxHeapify on the new value: maxHeapify only moves values down.
--- format
Write the swap with a temporary variable, in full. Name `i` and the parent index `i/2` clearly.
--- check
int main () {
	MaxHeap * heap = new MaxHeap;
	heap->size = 0;
	int v[] = {5, 9, 3, 12, 7};
	for (int k = 0; k < 5; k++)
		insertMaxHeap (heap, v[k]);
	for (int i = 1; i <= heap->size; i++)
		cout << heap->A[i] << " ";
	cout << endl;
	return 0;
}
--- expect
12 9 3 5 7

=== cw2-a4a
paper: A
q: 4
part: a
area: hashgraph
topic: hashing
type: trace
marks: 4
minutes: 8
lessons: i2-probing
--- question
A hash table has locations 1 to 12 and uses **h(key) = key % 12 + 1** with **quadratic probing**: after the x-th collision, move forward x + x² locations from where that collision happened, wrapping past 12. Insert **38, 26, 61, 50, 17, 73** in that order and show the final table.
--- rubric
1 | Home locations: 38, 26 and 50 hash to 3; 61 and 73 hash to 2; 17 hashes to 6.
1 | 26 collides at 3, moves 2 and lands at 5.
1 | 50 collides at 3 (move 2 to 5) and again at 5 (move 6), landing at 11.
1 | 73 collides at 2 and moves 2 to 4. Final table: 2: 61, 3: 38, 4: 73, 5: 26, 6: 17, 11: 50.
--- answer
| Key | key % 12 + 1 | Probes | Placed at |
|---|---|---|---|
| 38 | 2 + 1 = 3 | 3 empty | 3 |
| 26 | 2 + 1 = 3 | 3 taken (x = 1, move 2) → 5 | 5 |
| 61 | 1 + 1 = 2 | 2 empty | 2 |
| 50 | 2 + 1 = 3 | 3 taken → 5 taken (x = 2, move 6) → 11 | 11 |
| 17 | 5 + 1 = 6 | 6 empty | 6 |
| 73 | 1 + 1 = 2 | 2 taken (x = 1, move 2) → 4 | 4 |

:::diagram hash quad 12
38 26 61 50 17 73
The final table.
:::
--- mistakes
- Moving x + x² from the **home** location every time, instead of from the location of the latest collision.
- Moving 1 after each collision (that is linear probing).
--- format
One row per key: its home location, each probe, and where it lands. Then the final table with every location numbered.

=== cw2-a4b
paper: A
q: 4
part: b
area: hashgraph
topic: graphs
type: trace
marks: 3
minutes: 6
lessons: j3-bfs-dfs
--- question
An undirected graph has the edges A–B, A–E, B–C, B–E, C–D, D–E, D–F and E–F. Its adjacency lists are in alphabetical order. Give the **breadth-first** traversal starting at A, and show the queue after each vertex is taken off it.
--- rubric
1 | Writes the adjacency lists and visits A first, then B and E (A's neighbours, in alphabetical order).
1 | The traversal is A B E C D F: C comes from B before D and F come from E.
1 | Shows the queue after each removal, and no vertex joins the queue twice (E is not added again from B).
--- answer
Adjacency lists: A: B E · B: A C E · C: B D · D: C E F · E: A B D F · F: D E

| Taken off the queue | WHITE neighbours added | Queue afterwards |
|---|---|---|
| A | B, E | B E |
| B | C (A and E are no longer WHITE) | E C |
| E | D, F | C D F |
| C | none (D is already GREY) | D F |
| D | none | F |
| F | none | (empty) |

Breadth-first traversal: **A B E C D F**.
--- mistakes
- Adding E again when B is processed: only WHITE vertices join the queue.
- Following one path as deep as possible (that is depth-first search).
--- format
Write the adjacency lists first, then a table with the vertex taken off and the queue after each step.

=== cw2-a4c
paper: A
q: 4
part: c
area: perf
topic: bigo
type: complexity
marks: 3
minutes: 5
lessons: l1-performance
--- question
Give the worst-case big-O of each, with a one-line reason.

(i) Searching for a key in a BST with n keys.

(ii) `heapExtractMax` on a max-heap holding n values.

(iii) This code:

```cpp
for (int i = 1; i < n; i = i * 2)
	for (int j = 0; j < n; j++)
		count++;
```
--- rubric
1 | (i) O(n): in a degenerate BST (for example, keys inserted in sorted order) the tree is a chain of height n − 1.
1 | (ii) O(log n): maxHeapify moves the value down one level per swap, and an almost complete tree has height about log₂ n.
1 | (iii) O(n log n): i doubles, so the outer loop runs about log₂ n times, and the inner loop runs n times for each.
--- answer
- **(i) O(n).** The worst case is a degenerate BST: if the keys arrive in sorted order, every node has one child and a search may visit all n nodes. (A well-shaped BST gives O(log n), but the question asks for the worst case.)
- **(ii) O(log n).** One move to the root, then maxHeapify sinks the value at most one level per swap, and the heap's height is about log₂ n.
- **(iii) O(n log n).** The outer loop runs for i = 1, 2, 4, 8, … below n: about log₂ n times. Each time, the inner loop runs n times.
--- mistakes
- Giving O(log n) for (i): that is the best (well-shaped) case, not the worst.
- Calling (iii) O(n²) because there are two loops: the outer loop doubles i, so it runs only log₂ n times.
--- format
Write the big-O first, then one short reason. Mention "degenerate" or "sorted input" for (i): it is what the marker looks for.

=== cw2-b1a
paper: B
q: 1
part: a
area: lsq
topic: lists
type: code
marks: 4
minutes: 9
lessons: c4-deletion
--- stem
A linked list of integers uses the course's `struct Node { int data; Node * next; };` and is reached through `top`. A queue of integers is the course's linked queue, `struct Queue { Node * head; Node * tail; };`.
--- question
Write a function `deleteLast` that deletes the **last** node of the list (freeing its memory) and returns the top of the list. It must work for an empty list and for a list with one node.

```cpp
Node * deleteLast (Node * top);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | An empty list returns NULL without following any pointer.
1 | A list with one node: deletes that node and returns NULL.
1 | Otherwise stops on the second-last node, for example moving while curr->next->next != NULL.
1 | Deletes the last node, sets the second-last node's next to NULL, and returns top.
--- answer
```cpp
Node * deleteLast (Node * top) {
	if (top == NULL)
		return NULL;
	if (top->next == NULL) {
		delete top;
		return NULL;
	}
	Node * curr = top;
	while (curr->next->next != NULL)
		curr = curr->next;
	delete curr->next;
	curr->next = NULL;
	return top;
}
```

To remove the last node you need the node **before** it, because that node's `next` must become `NULL`. The loop stops when `curr->next` is the last node. The one-node list is special: there is no node before the last, and the list becomes empty, so the top changes. Cost: O(n).
--- mistakes
- Walking to the last node itself, then deleting it: the node before still points at freed memory.
- Missing the one-node case: `curr->next->next` follows a NULL pointer.
- Not setting `curr->next = NULL` after the delete (a dangling pointer).
--- format
Handle the two special cases first, each in its own `if`, then the general case. Write `delete` explicitly: the question asks for the memory to be freed.
--- check
void printList (Node * top) { if (top == NULL) { cout << "(empty)" << endl; return; } for (Node * c = top; c != NULL; c = c->next) cout << c->data << " "; cout << endl; }
int main () {
	Node * top = createNode (1);
	top->next = createNode (2);
	top->next->next = createNode (3);
	top = deleteLast (top);
	printList (top);
	top = deleteLast (top);
	printList (top);
	top = deleteLast (top);
	printList (top);
	top = deleteLast (top);
	printList (top);
	return 0;
}
--- expect
1 2
1
(empty)
(empty)

=== cw2-b1b
paper: B
q: 1
part: b
area: lsq
topic: stacks
type: trace
marks: 3
minutes: 6
lessons: e3-applications
--- question
The course checks brackets with a stack: an opening bracket is pushed; a closing bracket pops the stack and must match the bracket popped; at the end the stack must be empty. Show the stack after each character of

**{ ( [ ] ) ( ] }**

and say whether the brackets are balanced, and why.
--- rubric
1 | { ( [ are pushed; ] pops [ and ) pops (, so after the fifth character the stack holds just {.
1 | The next ( is pushed, then ] pops ( — the brackets do not match.
1 | Not balanced: a closing bracket must match the most recent unclosed opening bracket, and ] does not match (.
--- answer
| Character | Action | Stack (top on the right) |
|---|---|---|
| { | push | { |
| ( | push | { ( |
| [ | push | { ( [ |
| ] | pop [, matches | { ( |
| ) | pop (, matches | { |
| ( | push | { ( |
| ] | pop (, **does not match** ] | stop |

**Not balanced.** When ] arrives, the most recent unclosed bracket is (, and ] cannot close it. The checker stops there (the final } is never read).
--- mistakes
- Only counting brackets: there are as many openers as closers, but the order is wrong.
- Carrying on after the mismatch as if nothing happened.
--- format
A three-column table (character, action, stack) earns the working marks. End with one sentence that states the result and the reason.

=== cw2-b1c
paper: B
q: 1
part: c
area: lsq
topic: stacks
type: explain
marks: 2
minutes: 4
lessons: e2-queues
--- question
The course's linked queue keeps two pointers, `head` and `tail`.

(i) Why does `enqueue` add at the tail while `dequeue` removes from the head?

(ii) What would `enqueue` cost if the queue kept only `head`, and why?
--- rubric
1 | (i) A queue is first in, first out: new values join at the tail and the oldest leaves at the head, and both ends take O(1) time with the two pointers.
1 | (ii) O(n): without tail, each enqueue would have to walk from head to the last node first.
--- answer
**(i)** A queue serves values in the order they arrived (FIFO). Adding at the tail and removing at the head keeps that order. Removing at the head is O(1) because `head->next` is the new head; removing at the tail would need the node before the tail, which a singly linked list cannot reach quickly.

**(ii) O(n).** With only `head`, every enqueue would walk the whole list to find the last node before linking the new one. The `tail` pointer makes it O(1).
--- mistakes
- Saying a queue is LIFO.
- Saying enqueue would be O(1) anyway: something has to find the end of the list.
--- format
Two short answers labelled (i) and (ii). Use the words FIFO, O(1) and O(n): they are what the marks are for.

=== cw2-b2a
paper: B
q: 2
part: a
area: trees
topic: trees
type: trace
marks: 3
minutes: 7
lessons: f2-traversals
--- stem
A binary tree (not a BST) has the preorder traversal **A B D E G C F H I** and the inorder traversal **D B G E A C H F I**.
--- question
Draw the tree and give its **postorder** traversal.
--- rubric
1 | A is the root (first in preorder); in the inorder it splits D B G E (left subtree) from C H F I (right subtree).
1 | The left subtree is B with children D and E, and G is the left child of E.
1 | The right subtree is C with only a right child F, whose children are H and I; postorder D G E B H I F C A.
--- answer
The first key of the preorder is the root: **A**. In the inorder, everything left of A is in the left subtree (D B G E) and everything right of it is in the right subtree (C H F I). Repeat on each side: in the left part, preorder gives B next, so B is that subtree's root, with D on its left and G E on its right (E is the root there, with G on its left). In the right part, C comes next, nothing is left of C in the inorder, so C has only a right subtree, rooted at F with H and I.

:::diagram tree A(B(D,E(G)),C(,F(H,I)))
The tree.
:::

Postorder (left, right, root): **D G E B H I F C A**.
--- mistakes
- Using the inorder's first key as the root.
- Putting F as C's left child: nothing comes before C in its part of the inorder, so C has no left subtree.
--- format
Draw the tree, then write the postorder. One line on how you used the root to split the inorder earns method marks even if a branch goes wrong.

=== cw2-b2b
paper: B
q: 2
part: b
area: trees
topic: trees
type: trace
marks: 2
minutes: 4
lessons: f4-level-order-types
--- question
The course's `levelOrder` prints the tree from part (a) using a queue of `BTNode` pointers. Give the order it prints the nodes, and the contents of the queue just after E has been taken off and its children added.
--- rubric
1 | The order is A B C D E F G H I.
1 | The queue after E is processed holds F G (front first).
--- answer
Printed order: **A B C D E F G H I**.

| Taken off | Children added | Queue afterwards |
|---|---|---|
| A | B, C | B C |
| B | D, E | C D E |
| C | F | D E F |
| D | none | E F |
| E | G | **F G** |
| F | H, I | G H I |

Then G, H and I come off in turn. A queue keeps each level in order, left to right, before the next level.
--- mistakes
- Using a stack: the order would no longer go level by level.
- Writing the queue before E's child is added (F only).
--- format
Give the order on one line, then the queue with its front marked.

=== cw2-b2c
paper: B
q: 2
part: c
area: trees
topic: trees
type: code
marks: 3
minutes: 7
lessons: f3-tree-code
--- question
Write a **recursive** function `countOneChild` that returns how many nodes of a binary tree have **exactly one** child.

```cpp
int countOneChild (BTNode * root);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; };
BTNode * createBTNode (int data) { BTNode * newNode = new BTNode; newNode->data = data; newNode->left = NULL; newNode->right = NULL; return newNode; }
--- rubric
1 | Base case: an empty tree returns 0.
1 | Counts the current node when exactly one of its children is NULL (one present, one missing).
1 | Adds the results of the recursive calls on both subtrees.
--- answer
```cpp
int countOneChild (BTNode * root) {
	if (root == NULL)
		return 0;
	int here = 0;
	if ((root->left == NULL && root->right != NULL) || (root->left != NULL && root->right == NULL))
		here = 1;
	return here + countOneChild (root->left) + countOneChild (root->right);
}
```

Each node is visited once, so the function is O(n). In the tree from part (a), C (only a right child) and E (only a left child) are counted: the answer is 2.
--- mistakes
- Testing `root->left == NULL || root->right == NULL`, which also counts leaves.
- Returning 1 as soon as a one-child node is found, without counting the subtrees.
--- format
Write the condition for "exactly one child" in full, with brackets around each half, so the marker can read it at a glance.
--- check
int main () {
	BTNode * root = createBTNode (1);
	root->left = createBTNode (2);
	root->right = createBTNode (3);
	root->left->left = createBTNode (4);
	root->left->right = createBTNode (5);
	root->left->right->left = createBTNode (7);
	root->right->right = createBTNode (6);
	root->right->right->left = createBTNode (8);
	root->right->right->right = createBTNode (9);
	BTNode * chain = createBTNode (1);
	chain->right = createBTNode (2);
	chain->right->right = createBTNode (3);
	cout << countOneChild (root) << " " << countOneChild (chain) << " " << countOneChild (createBTNode (5)) << " " << countOneChild (NULL) << endl;
	return 0;
}
--- expect
2 2 0 0

=== cw2-b2d
paper: B
q: 2
part: d
area: trees
topic: bst
type: trace
marks: 3
minutes: 6
lessons: g3-parent-successor
--- question
The keys 40, 20, 60, 10, 30, 50, 70, 25, 35 are inserted in that order into an empty BST whose nodes also have **parent** pointers. Using the course's `inorderSuccessor`, give the successor of (i) 30, (ii) 35 and (iii) 70, and say which rule gives each answer.
--- rubric
1 | (i) 35: 30 has a right subtree, so the successor is the minimum of that subtree.
1 | (ii) 40: 35 has no right subtree, so go up through the parents (35 → 30 → 20) until coming up from a left child; 20 is 40's left child, so the answer is 40.
1 | (iii) none (NULL): 70 is the largest key; going up never comes from a left child.
--- answer
:::diagram tree 40(20(10,30(25,35)),60(50,70))
The BST.
:::

- **(i) 35.** Rule 1: when the node has a right subtree, the successor is the smallest key in it: go right once (to 35), then left as far as possible (35 has no left child).
- **(ii) 40.** Rule 2: with no right subtree, climb the parent pointers until you arrive from a **left** child. 35 is 30's right child, 30 is 20's right child, and 20 is 40's left child, so the successor is 40.
- **(iii) None.** 70 has no right subtree; climbing from 70 to 60 to 40 always arrives from a right child and reaches the root's parent (NULL). 70 is the largest key, so it has no successor.
--- mistakes
- Giving the parent as the successor of 35 (30 is smaller than 35).
- Looking in the left subtree for the successor.
--- format
For each node, name the rule (right subtree, or climb the parents) and then the answer.

=== cw2-b3a
paper: B
q: 3
part: a
area: heaps
topic: heaps
type: explain
marks: 2
minutes: 4
lessons: h1-heap-arrays
--- stem
Max-heaps are stored in an array from index 1, as in the course: `struct MaxHeap { int A [100]; int size; };`
--- question
(i) Where are the parent and the two children of the node at A[i]?

(ii) Why must the tree be almost complete for this way of storing it to work?
--- rubric
1 | (i) The parent is at A[i/2] (integer division) and the children are at A[2i] and A[2i + 1].
1 | (ii) An almost complete tree fills A[1] to A[size] level by level with no gaps, so every node has an index and the formulas always find the right node.
--- answer
**(i)** Parent: **A[i / 2]** (integer division, so A[7]'s parent is A[3]). Left child: **A[2i]**. Right child: **A[2i + 1]**. A child index greater than size means that child does not exist.

**(ii)** In an almost complete tree, every level is full except perhaps the lowest, which is filled from the left. Its nodes, read level by level, fill A[1] to A[size] with **no gaps**, which is exactly what makes the index formulas work. A gap in the tree would leave an empty array place, and the formulas would point at the wrong nodes or at nothing.
--- mistakes
- Giving the formulas for an array that starts at index 0 (children at 2i + 1 and 2i + 2): the course stores heaps from index 1.
- Saying "the tree must be complete": the course's complete tree has every level full, which is stronger than needed.
--- format
Write the three formulas, then one or two sentences for (ii) using the words "no gaps".

=== cw2-b3b
paper: B
q: 3
part: b
area: heaps
topic: heaps
type: trace
marks: 3
minutes: 6
lessons: h4-insert-priority
--- question
`insertMaxHeap` adds **85** to the max-heap **90 70 80 30 60 75 20 10 25** (size 9). Show the array after each swap.
--- rubric
1 | 85 is first stored at A[10] (size + 1).
1 | It swaps with 60 (its parent, A[5]) and then with 70 (A[2]).
1 | It stops below 90, giving 90 85 80 30 70 75 20 10 25 60.
--- answer
Size becomes 10 and A[10] = 85: 90 70 80 30 60 75 20 10 25 **85**.

| Step | Compare | Array afterwards |
|---|---|---|
| i = 10 | parent A[5] = 60 < 85: swap | 90 70 80 30 **85** 75 20 10 25 **60** |
| i = 5 | parent A[2] = 70 < 85: swap | 90 **85** 80 30 **70** 75 20 10 25 60 |
| i = 2 | parent A[1] = 90 > 85: stop | 90 85 80 30 70 75 20 10 25 60 |
--- mistakes
- Comparing with a child instead of the parent (i / 2).
- Putting 85 in A[1] and pushing everything down.
--- format
One row per comparison, with the index i, the parent, and the array after the swap.

=== cw2-b3c
paper: B
q: 3
part: c
area: heaps
topic: heaps
type: trace
marks: 2
minutes: 4
lessons: h4-insert-priority
--- question
Then `increaseKeyMaxHeap (heap, 9, 95)` is called on the heap from part (b). Show the final array.
--- rubric
1 | A[9] (25) becomes 95 and climbs past 30, 85 and 90: three swaps up to the root.
1 | Final array: 95 90 80 85 70 75 20 10 30 60.
--- answer
A[9] = 25 becomes 95. Its parent A[4] = 30 is smaller: swap. Then A[2] = 85 is smaller: swap. Then A[1] = 90 is smaller: swap. 95 is now the root.

Final array: **95 90 80 85 70 75 20 10 30 60**.

A larger key can only break the heap property with its parent, so increaseKey climbs exactly like insert.
--- mistakes
- Calling maxHeapify at index 9: a larger value must move up, not down.
- Changing A[9] but forgetting that 30 moves down into index 9.
--- format
List each swap (which values change places), then the final array.

=== cw2-b3d
paper: B
q: 3
part: d
area: heaps
topic: heaps
type: trace
marks: 3
minutes: 6
lessons: h3-delete-heapsort
--- question
Heap sort stores each value extracted by `heapExtractMax` in the place the heap has just given up (`heap->A[i] = heapExtractMax (heap);` for i = size down to 1). Starting with the max-heap **9 7 8 3 5 6** (size 6), show the whole array after each of the **first three** steps.
--- rubric
1 | After step 1: 8 7 6 3 5 9 (9 is stored at A[6]).
1 | After step 2: 7 5 6 3 8 9.
1 | After step 3: 6 5 3 7 8 9 (the sorted part grows from the right).
--- answer
| Step | What happens | Array afterwards |
|---|---|---|
| 1 | extract 9; 6 moves to the root and sinks below 8; store 9 in A[6] | 8 7 6 3 5 **9** |
| 2 | extract 8; 5 moves to the root and sinks below 7; store 8 in A[5] | 7 5 6 3 **8 9** |
| 3 | extract 7; 3 moves to the root and sinks below 6; store 7 in A[4] | 6 5 3 **7 8 9** |

After every step the largest remaining value joins the sorted part at the end, so the array finishes in ascending order. Each step is O(log n), and heap sort is O(n log n).
--- mistakes
- Forgetting to re-heapify after moving the last heap value to the root.
- Writing the extracted values in a new array instead of in place.
--- format
A table with one row per step, the full array each time, and the sorted part underlined or in bold.

=== cw2-b4a
paper: B
q: 4
part: a
area: hashgraph
topic: hashing
type: trace
marks: 4
minutes: 8
lessons: i2-probing
--- question
A hash table has locations 1 to 13 and uses **h(key) = key % 13 + 1**. Collisions are resolved by **double hashing**: after each collision move forward **k = key % 11 + 1** locations, wrapping past 13. Insert **18, 41, 31, 70, 44** in that order and show the final table.
--- rubric
1 | Home locations: 18, 31, 70 and 44 all hash to 6; 41 hashes to 3.
1 | 31: k = 10, so 6 → 3 (taken by 41) → 13.
1 | 70: k = 5, so 6 → 11; 44: k = 1, so 6 → 7.
1 | Final table: 3: 41, 6: 18, 7: 44, 11: 70, 13: 31, showing that keys colliding at 6 take different jumps.
--- answer
| Key | key % 13 + 1 | k = key % 11 + 1 | Probes | Placed at |
|---|---|---|---|---|
| 18 | 5 + 1 = 6 | | 6 empty | 6 |
| 41 | 2 + 1 = 3 | | 3 empty | 3 |
| 31 | 5 + 1 = 6 | 9 + 1 = 10 | 6 taken → 16 − 13 = 3 taken → 13 | 13 |
| 70 | 5 + 1 = 6 | 4 + 1 = 5 | 6 taken → 11 | 11 |
| 44 | 5 + 1 = 6 | 0 + 1 = 1 | 6 taken → 7 | 7 |

:::diagram hash double 13
18 41 31 70 44
The final table.
:::

Four keys share the home location 6, but each has its own step k, so they spread out instead of forming one cluster. k = key % (n − 2) + 1 is never 0, so a probe always moves.
--- mistakes
- Using the same step (1) for every key, which is linear probing.
- Forgetting the + 1 in k, so 44 would get a step of 0 and never move.
--- format
A table with columns for the home location, the step k, the probes and the final place, then the whole table.

=== cw2-b4b
paper: B
q: 4
part: b
area: hashgraph
topic: graphs
type: trace
marks: 3
minutes: 6
lessons: j3-bfs-dfs
--- question
A directed graph has the edges A→B, A→C, B→D, C→B, C→E, D→A, D→E and E→F. Its adjacency lists are in alphabetical order. Give the **depth-first** traversal starting at A, and the order in which the vertices turn BLACK.
--- rubric
1 | Goes deep first: A → B → D → E → F before backing up to try A's next edge.
1 | Depth-first traversal: A B D E F C.
1 | Order of turning BLACK: F E D B C A.
--- answer
Adjacency lists: A: B C · B: D · C: B E · D: A E · E: F · F: none

- dfTraverse(A) visits **A**; its first edge B is WHITE.
- dfTraverse(B) visits **B**; D is WHITE.
- dfTraverse(D) visits **D**; A is GREY, so skip it; E is WHITE.
- dfTraverse(E) visits **E**; F is WHITE.
- dfTraverse(F) visits **F**; no edges, so F turns BLACK. Then E, D and B turn BLACK as the calls return.
- Back in A, its next edge C is WHITE: dfTraverse(C) visits **C**; B and E are BLACK, so C turns BLACK, then A.

Depth-first traversal: **A B D E F C**. Turning BLACK: **F E D B C A**.
--- mistakes
- Visiting C straight after B, as breadth-first search would.
- Following the edge D→A back to A: A is GREY, so it is not visited again.
--- format
Write the adjacency lists, then the calls in order (a list of the waiting calls works like a stack). Give both orders clearly labelled.

=== cw2-b4c
paper: B
q: 4
part: c
area: perf
topic: bigo
type: complexity
marks: 3
minutes: 5
lessons: l1-performance
--- question
Give the worst-case big-O of each, with a one-line reason.

(i) Inserting a key into a hash table that holds n keys and uses linear probing.

(ii) Finding the largest value in a max-heap of n values.

(iii) This code:

```cpp
for (int i = 0; i < n; i++)
	for (int j = i; j < n; j++)
		count++;
```
--- rubric
1 | (i) O(n): when many keys collide, the probes walk past almost every occupied location.
1 | (ii) O(1): the largest value is always A[1].
1 | (iii) O(n²): n + (n − 1) + … + 1 = n(n + 1) / 2 iterations.
--- answer
- **(i) O(n).** Usually a hash table insert takes O(1), but in the worst case most keys collide and the probes must step past almost every occupied location (long clusters).
- **(ii) O(1).** The heap property puts the maximum at the root, A[1]; reading it does not change the heap.
- **(iii) O(n²).** The inner loop runs n times when i = 0, then n − 1, …, then once: n(n + 1) / 2 in total, which grows like n².
--- mistakes
- Giving O(1) for (i): that is the usual case, not the worst.
- Giving O(log n) for (ii): only removing the maximum needs maxHeapify.
--- format
Big-O first, then the reason. For (iii), writing the sum n + (n − 1) + … + 1 shows the marker where n² comes from.

=== cw2-c1a
paper: C
q: 1
part: a
area: lsq
topic: lists
type: code
marks: 4
minutes: 9
lessons: c4-deletion
--- stem
A linked list of integers uses the course's `struct Node { int data; Node * next; };` and is reached through `top`.
--- question
Write a function `removeAll` that deletes **every** node holding `key` (freeing each one) and returns the top of the list. The list may become empty.

```cpp
Node * removeAll (Node * top, int key);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Removes matching nodes at the front with a loop (not just once), moving top forward each time.
1 | Handles a list that becomes empty (returns NULL) without following a NULL pointer.
1 | For the rest, checks curr->next->data and unlinks a match with curr->next = toDelete->next, without moving curr after a deletion.
1 | Deletes every removed node and returns the (possibly new) top.
--- answer
```cpp
Node * removeAll (Node * top, int key) {
	while (top != NULL && top->data == key) {
		Node * toDelete = top;
		top = top->next;
		delete toDelete;
	}
	if (top == NULL)
		return NULL;
	Node * curr = top;
	while (curr->next != NULL) {
		if (curr->next->data == key) {
			Node * toDelete = curr->next;
			curr->next = toDelete->next;
			delete toDelete;
		}
		else
			curr = curr->next;
	}
	return top;
}
```

Matches at the front change `top`, and there may be several in a row, so they need their own loop. After that, `curr` always holds a value that stays, and the function looks one node ahead: a match is unlinked from `curr`, and `curr` moves only when the next node is kept, so two matches in a row are both removed. One pass: O(n).
--- mistakes
- Removing only the first match at the front with an `if` instead of a `while`.
- Moving `curr` forward after a deletion, which skips the node that was just pulled up.
- Unlinking nodes without deleting them (a memory leak), when the question asks for each to be freed.
--- format
Write the front case and the general case as two separate parts, each with a short comment. Use `toDelete` for the node being freed, as the course does.
--- check
void printList (Node * top) { if (top == NULL) { cout << "(empty)" << endl; return; } for (Node * c = top; c != NULL; c = c->next) cout << c->data << " "; cout << endl; }
Node * fromArray (int v[], int n) { Node * top = NULL; for (int i = n - 1; i >= 0; i--) { Node * x = createNode (v[i]); x->next = top; top = x; } return top; }
int main () {
	int a[] = {4, 4, 1, 4, 2, 4};
	int b[] = {4, 4};
	int c[] = {1, 2, 3};
	printList (removeAll (fromArray (a, 6), 4));
	printList (removeAll (fromArray (b, 2), 4));
	printList (removeAll (fromArray (c, 3), 5));
	return 0;
}
--- expect
1 2
(empty)
1 2 3

=== cw2-c1b
paper: C
q: 1
part: b
area: lsq
topic: stacks
type: trace
marks: 3
minutes: 6
lessons: e1-stacks, e2-queues
--- question
The first k values of a queue can be reversed with a stack in three phases:

1. dequeue k values and push each one onto the stack;
2. pop every value from the stack and enqueue it;
3. dequeue the remaining (size − k) values from the front and enqueue each at the back.

Show the queue and the stack after each phase for the queue **1 2 3 4 5** (1 at the front) and k = 3.
--- rubric
1 | After phase 1: the stack holds 3 2 1 (3 on top) and the queue holds 4 5.
1 | After phase 2: the queue is 4 5 3 2 1 and the stack is empty.
1 | After phase 3: 4 and 5 move to the back, giving 3 2 1 4 5.
--- answer
| After | Stack (top first) | Queue (front first) |
|---|---|---|
| phase 1 (dequeue 1, 2, 3 and push) | 3 2 1 | 4 5 |
| phase 2 (pop and enqueue) | (empty) | 4 5 3 2 1 |
| phase 3 (move 2 values to the back) | (empty) | **3 2 1 4 5** |

The stack reverses the three values (last in, first out); the queue keeps everything else in order (first in, first out).
--- mistakes
- Popping in the order the values were pushed (1, 2, 3), which does not reverse them.
- Forgetting phase 3, leaving the reversed values at the back.
--- format
A table with a row per phase and the front of the queue and top of the stack marked.

=== cw2-c1c
paper: C
q: 1
part: c
area: lsq
topic: stacks
type: explain
marks: 2
minutes: 4
lessons: e3-applications
--- question
Say whether a **stack** or a **queue** fits each job better, with a reason:

(i) the Undo command in a text editor;

(ii) documents sent to a shared printer.
--- rubric
1 | (i) A stack: Undo must reverse the most recent action first (last in, first out).
1 | (ii) A queue: documents should print in the order they were sent (first in, first out).
--- answer
**(i) Stack.** Each action is pushed as it happens; Undo pops the **most recent** one first, then the one before it (LIFO).

**(ii) Queue.** Print jobs are served fairly, in the order they arrive: the first document sent is the first printed (FIFO).
--- mistakes
- Naming the structure without a reason: the reason (LIFO or FIFO, most recent or oldest first) carries the mark.
--- format
Name the structure first, then one sentence with "most recent first" (stack) or "in order of arrival" (queue).

=== cw2-c2a
paper: C
q: 2
part: a
area: trees
topic: trees
type: explain
marks: 2
minutes: 4
lessons: f1-terminology
--- stem
Binary trees use the course's node, `struct BTNode { int data; BTNode * left; BTNode * right; };`, and the course's definitions of height (edges on the longest path from the root to a leaf; one node has height 0).
--- question
(i) What are the **moment** and the **weight** of a binary tree?

(ii) What are the smallest and the largest possible heights of a binary tree with **15** nodes?
--- rubric
1 | (i) The moment is the number of nodes; the weight is the number of leaves.
1 | (ii) Smallest height 3 (levels 0 to 3 hold 1 + 2 + 4 + 8 = 15 nodes); largest height 14 (every node has one child, a chain).
--- answer
**(i)** The **moment** is the number of nodes in the tree. The **weight** is the number of leaves (nodes with no children).

**(ii)** Smallest height **3**: a tree whose levels 0, 1, 2 and 3 are all full holds 1 + 2 + 4 + 8 = 15 nodes, so 15 nodes fit in 4 levels. Largest height **14**: when every node has exactly one child, the 15 nodes form a chain with 14 edges.
--- mistakes
- Counting nodes instead of edges for the height (giving 4 and 15).
- Mixing up moment and weight.
--- format
Two short labelled answers. For (ii), show the sum 1 + 2 + 4 + 8.

=== cw2-c2b
paper: C
q: 2
part: b
area: trees
topic: bst
type: trace
marks: 4
minutes: 9
lessons: g2-insert-search, g4-deletion
--- question
Insert **52, 26, 78, 13, 39, 65, 91, 33, 45, 70** in that order into an empty BST. Then delete **26** and then **65** with the course's `deleteBST` (a node with two children is replaced by its inorder successor). Draw the tree after the insertions and after each deletion.
--- rubric
1 | The BST after the insertions is correct (52 root; 26 and 78; 13, 39, 65, 91; 33 and 45 under 39; 70 right of 65).
1 | Deleting 26 (two children): 33, its inorder successor (the smallest key in its right subtree), takes its place.
1 | 33's old node, a leaf, is removed, so 39 keeps only its right child 45.
1 | Deleting 65 (one child): its child 70 moves up to become 78's left child.
--- answer
:::diagram tree bst:52 26 78 13 39 65 91 33 45 70
After the insertions.
:::

**Delete 26.** It has two children, so its key is replaced by its inorder successor: in its right subtree go to 39, then left as far as possible, to **33**. 33 is copied into 26's node, and 33's old node (a leaf) is deleted.

:::diagram tree 52(33(13,39(,45)),78(65(,70),91))
After deleting 26.
:::

**Delete 65.** It has one child, 70, which takes its place as 78's left child.

:::diagram tree 52(33(13,39(,45)),78(70,91))
After deleting 65.
:::
--- mistakes
- Replacing 26 with 39 (its right child) instead of its successor 33.
- Leaving 33 in two places after copying it up.
- Treating 65 as a node with two children.
--- format
Three clear drawings, each labelled. For each deletion, write which case applies (no child, one child, two children) before drawing.

=== cw2-c2c
paper: C
q: 2
part: c
area: trees
topic: bst
type: trace
marks: 2
minutes: 4
lessons: g3-parent-successor
--- question
In the **final** tree from part (b), give the inorder successor of **45** and of **52**.
--- rubric
1 | 45 → 52: 45 has no right subtree, so climb the parents (45 → 39 → 33) until coming up from a left child; 33 is 52's left child.
1 | 52 → 70: 52 has a right subtree, and its smallest key is 70 (right to 78, then left).
--- answer
- **45 → 52.** 45 has no right subtree. Climb: 45 is 39's right child, 39 is 33's right child, and 33 is 52's **left** child, so the successor is 52.
- **52 → 70.** 52 has a right subtree: go right to 78, then left as far as possible: 70.

A check: the inorder of the final tree is 13 33 39 45 52 70 78 91, and each answer is the next key in that list.
--- mistakes
- Answering 39 for 45: 39 is smaller than 45, so it cannot be the successor.
- Answering 78 for 52, without going left in the right subtree.
--- format
Name the rule used for each node, then the answer. The inorder list is a quick way to check yourself.

=== cw2-c2d
paper: C
q: 2
part: d
area: trees
topic: bst
type: code
marks: 3
minutes: 6
lessons: f2-traversals, g2-insert-search
--- question
Write a **recursive** function `printDescending` that prints the keys of a BST from the **largest** to the smallest.

```cpp
void printDescending (BTNode * root);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; };
BTNode * createBTNode (int data) { BTNode * newNode = new BTNode; newNode->data = data; newNode->left = NULL; newNode->right = NULL; return newNode; }
BTNode * insertBST (BTNode * root, int key) { if (root == NULL) return createBTNode (key); if (key < root->data) root->left = insertBST (root->left, key); else if (key > root->data) root->right = insertBST (root->right, key); return root; }
--- rubric
1 | Base case: returns at once when root is NULL.
1 | Visits the right subtree first, then prints the root's key.
1 | Then visits the left subtree (an inorder traversal in reverse).
--- answer
```cpp
void printDescending (BTNode * root) {
	if (root == NULL)
		return;
	printDescending (root->right);
	cout << root->data << " ";
	printDescending (root->left);
}
```

Inorder (left, root, right) prints a BST in ascending order. Swapping the two subtrees (right, root, left) prints it in descending order. Each node is visited once: O(n).
--- mistakes
- Printing the root before the right subtree (that is a preorder-style order, not sorted).
- Using an inorder traversal and hoping to reverse the output.
--- format
Three lines in the body after the base case, in the order right, root, left.
--- check
int main () {
	BTNode * root = NULL;
	int keys[] = {52, 26, 78, 13, 39, 65, 91, 33, 45, 70};
	for (int i = 0; i < 10; i++)
		root = insertBST (root, keys[i]);
	printDescending (root);
	cout << endl;
	return 0;
}
--- expect
91 78 70 65 52 45 39 33 26 13

=== cw2-c3a
paper: C
q: 3
part: a
area: heaps
topic: heaps
type: trace
marks: 3
minutes: 6
lessons: h2-heapify-build
--- stem
Max-heaps are stored in an array from index 1, as in the course: `struct MaxHeap { int A [100]; int size; };`
--- question
`maxHeapify (heap, 1)` is called on **3 18 15 9 12 10 7 4 6** (size 9). Only the root breaks the max-heap property. Show the array after each swap.
--- rubric
1 | 3 swaps with 18, the larger of its children 18 and 15.
1 | Then 3 swaps with 12, the larger of 9 and 12.
1 | 3 is now at index 5, a leaf, so it stops: 18 12 15 9 3 10 7 4 6.
--- answer
| i | Compare A[i] with its children | Array afterwards |
|---|---|---|
| 1 | 3 vs 18 and 15: swap with 18 | **18 3** 15 9 12 10 7 4 6 |
| 2 | 3 vs 9 and 12: swap with 12 | 18 **12** 15 9 **3** 10 7 4 6 |
| 5 | children would be A[10] and A[11], beyond size 9: stop | 18 12 15 9 3 10 7 4 6 |

maxHeapify always swaps with the **larger** child, so the new parent is larger than both of its children.
--- mistakes
- Swapping with 15 (the right child) because it is checked last.
- Stopping after one swap.
--- format
One row per level, naming the two children and which one is larger.

=== cw2-c3b
paper: C
q: 3
part: b
area: heaps
topic: heaps
type: explain
marks: 2
minutes: 4
lessons: h1-heap-arrays
--- question
Is **50 40 45 35 42 30 20 10 36** (A[1] to A[9]) a max-heap? If not, say where the max-heap property fails and why.
--- rubric
1 | No: A[2] = 40 is smaller than its child A[5] = 42.
1 | A[4] = 35 is also smaller than its child A[9] = 36 (the children of A[i] are A[2i] and A[2i + 1]).
--- answer
**No.** The children of A[i] are A[2i] and A[2i + 1], and in a max-heap every parent must be at least as large as its children.

- A[2] = 40 has children A[4] = 35 and A[5] = **42**: 42 > 40, so the property fails at index 2.
- A[4] = 35 has children A[8] = 10 and A[9] = **36**: 36 > 35, so it fails at index 4 too.

(A[1] = 50 and A[3] = 45 are fine.)
--- mistakes
- Checking only that A[1] is the largest value.
- Comparing neighbours in the array (A[i] with A[i + 1]) instead of parents with children.
--- format
State yes or no first, then each failing parent with its index, its value and the larger child.

=== cw2-c3c
paper: C
q: 3
part: c
area: heaps
topic: heaps
type: trace
marks: 2
minutes: 4
lessons: h3-delete-heapsort
--- question
The course's `deleteMaxHeap (heap, 2)` is called on the max-heap **60 50 40 30 45 35 20 10 25** (size 9). What value does it return, and what is the array afterwards?
--- rubric
1 | Returns 50; the last value (25) moves into A[2] and the size becomes 8.
1 | 25 sinks below 45 (the larger of 30 and 45): 60 45 40 30 25 35 20 10.
--- answer
`deleteMaxHeap` saves A[2] = **50**, moves the last value A[9] = 25 into A[2], and sets size = 8: 60 25 40 30 45 35 20 10. Then `maxHeapify (heap, 2)`: 25 is smaller than its children 30 and 45, so it swaps with 45. At index 5 it has no children left (A[10] is beyond size 8), so it stops.

Result: **60 45 40 30 25 35 20 10**. Returns **50**.
--- mistakes
- Moving A[3] or a child up into the hole instead of the last value.
- Forgetting to reduce the size to 8.
--- format
Write the value returned, the array after the move, and the array after maxHeapify.

=== cw2-c3d
paper: C
q: 3
part: d
area: heaps
topic: heaps
type: explain
marks: 3
minutes: 5
lessons: h4-insert-priority
--- question
A max-priority queue is built on a max-heap. For each operation, name the heap function or step that performs it and give its running time:

(i) insert a new value; (ii) look at the highest-priority value; (iii) remove the highest-priority value.
--- rubric
1 | (i) insertMaxHeap: O(log n).
1 | (ii) read A[1], the maximum: O(1).
1 | (iii) heapExtractMax: O(log n).
--- answer
| Priority queue operation | Heap function | Running time |
|---|---|---|
| (i) insert a value | insertMaxHeap (put it at A[size + 1] and bubble up) | O(log n) |
| (ii) look at the highest priority | read A[1] (the maximum) | O(1) |
| (iii) remove the highest priority | heapExtractMax (move the last value to A[1], maxHeapify) | O(log n) |

The O(log n) operations move a value along one path of the tree, whose length is the height, about log₂ n.
--- mistakes
- Saying a priority queue is a queue that serves values in arrival order: it serves the highest priority first.
- Giving O(n) for insert (that would be an unsorted or sorted array).
--- format
A three-column table (operation, function, time) is the clearest layout.

=== cw2-c4a
paper: C
q: 4
part: a
area: hashgraph
topic: hashing
type: trace
marks: 4
minutes: 8
lessons: i1-hash-tables, i2-probing
--- question
A hash table has locations 1 to 12 and uses **h(key) = key % 12 + 1** with **linear probing** (try the next location, wrapping from 12 to 1). Insert **22, 46, 34, 59, 47, 11** in that order and show the final table. Then say how many locations are examined when searching for **11**.
--- rubric
1 | 22 goes to its home location 11, and 46 (home 11) moves on to 12.
1 | 34 (home 11) wraps from 12 to 1, and 59 (home 12) goes to 2.
1 | 47 goes to 3 and 11 goes to 4: final table 1: 34, 2: 59, 3: 47, 4: 11, 11: 22, 12: 46.
1 | Searching for 11 examines 5 locations (12, 1, 2, 3, 4): every key in one cluster makes its neighbours slow.
--- answer
| Key | key % 12 + 1 | Probes | Placed at |
|---|---|---|---|
| 22 | 10 + 1 = 11 | 11 | 11 |
| 46 | 10 + 1 = 11 | 11, 12 | 12 |
| 34 | 10 + 1 = 11 | 11, 12, 1 | 1 |
| 59 | 11 + 1 = 12 | 12, 1, 2 | 2 |
| 47 | 11 + 1 = 12 | 12, 1, 2, 3 | 3 |
| 11 | 11 + 1 = 12 | 12, 1, 2, 3, 4 | 4 |

:::diagram hash linear 12
22 46 34 59 47 11
The final table.
:::

A search for 11 follows the same path as its insert: 12, 1, 2, 3, then finds 11 at 4: **5 locations**. The keys have formed one long run (a cluster) across 11, 12, 1, 2, 3, 4, which is why linear probing slows down as the table fills.
--- mistakes
- Not wrapping from 12 back to 1.
- Counting the search as 1 because 11 "belongs" at 12: a search must follow the probes until it finds the key or an empty location.
--- format
One row per key with its home location and every probe, then the final table, then the search count with the locations listed.

=== cw2-c4b
paper: C
q: 4
part: b
area: hashgraph
topic: graphs
type: trace
marks: 3
minutes: 6
lessons: j4-dijkstra
--- question
A directed graph has the edges A→B (6), A→C (2), C→B (3), B→D (1), C→D (7), C→E (5) and D→E (1). Run **Dijkstra's algorithm** from A. Give the order in which the vertices are taken off the priority queue, the final cost and parent of every vertex, and the cheapest path to E.
--- rubric
1 | Vertices leave the queue in the order A C B D E.
1 | Final table: B 5 (parent C), C 2 (A), D 6 (B), E 7 (C).
1 | Cheapest path to E: A → C → E, cost 7. D → E also gives 7, which is not lower, so E keeps parent C.
--- answer
| Taken off Q | Edge | New cost | Compared with | Result |
|---|---|---|---|---|
| A (0) | A→B | 0 + 6 = 6 | ∞ | B: 6, parent A |
| | A→C | 0 + 2 = 2 | ∞ | C: 2, parent A |
| C (2) | C→B | 2 + 3 = 5 | 6 | B: 5, parent C |
| | C→D | 2 + 7 = 9 | ∞ | D: 9, parent C |
| | C→E | 2 + 5 = 7 | ∞ | E: 7, parent C |
| B (5) | B→D | 5 + 1 = 6 | 9 | D: 6, parent B |
| D (6) | D→E | 6 + 1 = 7 | 7 | not lower: no change |
| E (7) | | | | |

| Vertex | A | B | C | D | E |
|---|---|---|---|---|---|
| cost | 0 | 5 | 2 | 6 | 7 |
| parent | nil | C | A | B | C |

Cheapest path to E, read back through the parents: E ← C ← A, so **A → C → E** with cost **7**.
--- mistakes
- Updating E to parent D when the new cost is only equal: Dijkstra changes a vertex only when the new path is cheaper.
- Taking vertices off in alphabetical order instead of cheapest first.
--- format
A trace table with one row per edge examined, then the final cost and parent table, then the path.

=== cw2-c4c
paper: C
q: 4
part: c
area: perf
topic: bigo
type: complexity
marks: 3
minutes: 5
lessons: l1-performance, g5-performance
--- question
Give the worst-case big-O of each, with a one-line reason.

(i) Inserting at the tail of a linked list that keeps only a `top` pointer.

(ii) Building a BST by inserting n keys that arrive in increasing order.

(iii) This code:

```cpp
int i = n;
while (i > 1) {
	i = i / 2;
	count++;
}
```
--- rubric
1 | (i) O(n): the list must be walked to the last node first.
1 | (ii) O(n²): the tree becomes a chain, so the k-th insert walks k − 1 nodes: 0 + 1 + … + (n − 1) = n(n − 1) / 2.
1 | (iii) O(log n): i is halved each time, so the loop runs about log₂ n times.
--- answer
- **(i) O(n).** With only `top`, insertAtTail walks every node to reach the last one before linking the new node.
- **(ii) O(n²).** Increasing keys always go right, so the BST is a chain. The k-th insert walks past the k − 1 keys already there: 0 + 1 + 2 + … + (n − 1) = n(n − 1) / 2 steps.
- **(iii) O(log n).** i goes n, n/2, n/4, … and stops at 1, about log₂ n halvings.
--- mistakes
- Giving O(n log n) for (ii), which is the cost for a well-shaped tree, not sorted input.
- Giving O(n) for (iii) because "there is a loop".
--- format
Big-O first, then the reason. For (ii) the sum of the walk lengths is what earns the mark.
