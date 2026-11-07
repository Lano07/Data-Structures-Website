## How to use this page

Every pattern from the lessons in one place, in the same style as the lecture code. Use the contents list to jump to a structure. Each section links to the lesson that explains it. For the full explanation of any line, go back to that lesson; this page is for revising and for checking a detail quickly.

## C++ essentials

```cpp norun
#include <iostream>        // cin, cout
#include <fstream>         // ifstream, ofstream
#include <string>          // string
#include <iomanip>         // setw, setprecision, fixed
using namespace std;

const int MAX = 100;       // a constant

int main() {
	int n = 0;             // always give variables a starting value
	double x = 2.5;
	char c = 'A';          // single quotes: one character
	string s = "text";     // double quotes: a string
	bool ok = true;
	return 0;
}
```

| Topic | Remember | Lesson |
|---|---|---|
| Integer division | `17 / 5` is 3; `17 % 5` is 2; `17 / 5.0` is 3.4; `(double) a / b` | [A2](#l-a2-variables) |
| Conditions | `==` compares, `=` assigns; `&&` stops at the first false, `\|\|` at the first true | [A3](#l-a3-decisions) |
| Loops | `for (int i = 0; i < n; i++)` runs n times; read with `while (cin >> x)` | [A4](#l-a4-loops) |
| Parameters | `int n` copy; `int & n` the caller's variable; `const string & s` no copy, no change | [A5](#l-a5-functions), [A6](#l-a6-references) |
| Arrays | indexes 0 to n − 1; pass the size too; functions can change the caller's array | [A7](#l-a7-arrays) |
| Strings | `s.length ()`, `s[i]`, `s + t`, `s.substr (i, k)`, `s.find (t)`, `getline (cin, s)` | [A8](#l-a8-strings) |
| Structs | `s.field`; `list[i].field`; `p->field` through a pointer | [A9](#l-a9-structs) |
| Files | `ifstream in ("f.txt"); if (!in.is_open ()) …; while (in >> x) …; in.close ();` | [A10](#l-a10-files) |

## Pointers and dynamic memory

| Write | Meaning |
|---|---|
| `int * p;` | p can hold the address of an int |
| `p = &x;` | p points to x |
| `*p` | the value p points to (dereference) |
| `p->data` | the field data of the struct p points to, the same as `(*p).data` |
| `p = new Node;` | make a Node on the heap; p points to it |
| `delete p;` | give it back. p is now dangling: do not use it |
| `int * A = new int[n];` … `delete [] A;` | a dynamic array |
| `NULL` | points to nothing. Following it crashes |

Mistakes to avoid ([B4](#l-b4-pitfalls)): following NULL; using memory after `delete`; deleting twice; losing the last pointer to a node (a leak); returning the address of a local variable.

## Linked lists

```cpp norun
struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

void printList (Node * top) {                     // the traversal pattern
	Node * curr = top;
	while (curr != NULL) {
		cout << curr->data << " ";
		curr = curr->next;
	}
	cout << endl;
}

Node * insertAtHead (Node * top, int n) {         // O(1)
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}

Node * insertSorted (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL || n < top->data) {           // new first node
		newNode->next = top;
		return newNode;
	}
	Node * curr = top;
	while (curr->next != NULL && curr->next->data < n)
		curr = curr->next;
	newNode->next = curr->next;                   // link the new node first...
	curr->next = newNode;                         // ...then point to it
	return top;
}

Node * deleteKey (Node * top, int key) {
	if (top == NULL)
		return NULL;
	if (top->data == key) {                       // deleting the first node
		Node * temp = top;
		top = top->next;
		delete temp;
		return top;
	}
	Node * prev = top;
	Node * curr = top->next;
	while (curr != NULL && curr->data != key) {
		prev = curr;
		curr = curr->next;
	}
	if (curr != NULL) {
		prev->next = curr->next;                  // unlink, then free
		delete curr;
	}
	return top;
}

Node * reverse (Node * top) {                     // three pointers
	Node * prev = NULL;
	Node * curr = top;
	while (curr != NULL) {
		Node * nextNode = curr->next;
		curr->next = prev;
		prev = curr;
		curr = nextNode;
	}
	return prev;
}
```

- A function that may change the first node **returns the new top**, and the caller writes `top = f (top, …);`. Or it takes `Node * & top` ([C4](#l-c4-deletion)).
- Test every list function on: empty, one node, key first, key last, key missing ([C5](#l-c5-more-ops)).

## Recursion

1. **Base case**: the smallest problem, answered directly (`top == NULL`, `root == NULL`, `m == n`, `n == 0`).
2. **Recursive case**: call on a smaller problem (`top->next`, `root->left`, `m + 1`, `n − 1`) and build the answer from it.
3. Work **before** the call runs on the way down; work **after** it runs on the way back up, in reverse order.

```cpp norun
int sizeRec (Node * top) {                        // a list: head + smaller list
	if (top == NULL)
		return 0;
	return 1 + sizeRec (top->next);
}

Node * insertSortedRec (Node * top, int n) {      // changing a list: reconnect the tail
	if (top == NULL || n < top->data) {
		Node * newNode = createNode (n);
		newNode->next = top;
		return newNode;
	}
	top->next = insertSortedRec (top->next, n);
	return top;
}

void printArrayRec (int a[], int m, int n) {      // an array: a[m] .. a[n-1]
	if (m < 0 || m >= n)
		return;
	cout << a[m] << endl;
	printArrayRec (a, m+1, n);
}
```

Lessons: [D1](#l-d1-how-recursion-works), [D2](#l-d2-recursion-lists), [D3](#l-d3-recursion-arrays).

## Stacks and queues

| | Stack (LIFO) | Queue (FIFO) |
|---|---|---|
| Struct | `struct Stack { Node * top; };` | `struct Queue { Node * head; Node * tail; };` |
| Add | push = insertAtHead | enqueue at the tail |
| Remove | pop = deleteAtHead, returns −999 when empty | dequeue at the head, returns −999 when empty |
| Cost | O(1) both | O(1) both, because of the tail pointer |
| Edge cases | pop on an empty stack | enqueue into an empty queue (head = tail = newNode); dequeue of the last node (set tail = NULL) |
| Used for | reversing, matching brackets, undo, recursion's call stack | level order traversal, BFS |

Lessons: [E1](#l-e1-stacks), [E2](#l-e2-queues), [E3](#l-e3-applications).

## Binary trees

```cpp norun
struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
	BTNode * parent;                  // used by BSTs (Lectures 8 and 10)
};

void preOrder (BTNode * root) {       // root, left, right
	if (root == NULL)
		return;
	cout << root->data << " ";
	preOrder (root->left);
	preOrder (root->right);
}
// inOrder: left, root, right.   postOrder: left, right, root.

int moment (BTNode * root) {          // number of nodes
	if (root == NULL)
		return 0;
	return 1 + moment (root->left) + moment (root->right);
}

int numTerminal (BTNode * root) {     // number of leaves (the weight)
	if (root == NULL)
		return 0;
	if (root->left == NULL && root->right == NULL)
		return 1;
	return numTerminal (root->left) + numTerminal (root->right);
}

int height (BTNode * root) {          // edges on the longest path down; empty tree -1
	if (root == NULL)
		return -1;
	int leftHeight = height (root->left);
	int rightHeight = height (root->right);
	if (leftHeight > rightHeight)
		return 1 + leftHeight;
	return 1 + rightHeight;
}
```

| Term | Meaning |
|---|---|
| moment | number of nodes |
| weight | number of leaves |
| leaf (terminal node) | a node with no children; a branch (nonterminal) node has at least one |
| level / depth | number of edges from the root; the root is level 0 |
| height | number of edges on the longest path from the root down to a leaf; an empty tree has height −1 |
| complete | every non-leaf has two subtrees **and** all leaves are on the same level |
| almost complete | every level is full except possibly the lowest, which is filled from the left |
| full | every non-leaf has exactly two subtrees |

**Level order** uses a queue: enqueue the root; repeatedly dequeue a node, visit it, enqueue its left then right child.

Lessons: [F1](#l-f1-terminology) to [F4](#l-f4-level-order-types).

## Binary search trees

Every key in the left subtree is smaller than the node's key, and every key in the right subtree is larger. An **inorder traversal prints the keys in sorted order**.

```cpp norun
BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL)
		return createBTNode (key);
	if (key < root->data) {
		root->left = insertBST (root->left, key);
		root->left->parent = root;
	}
	else
	if (key > root->data) {
		root->right = insertBST (root->right, key);
		root->right->parent = root;
	}
	return root;
}

BTNode * containsBST (BTNode * root, int key) {
	if (root == NULL)
		return NULL;
	if (root->data == key)
		return root;
	if (key < root->data)
		return containsBST (root->left, key);
	return containsBST (root->right, key);
}

BTNode * minimumBST (BTNode * root) {        // keep going left (maximum: keep going right)
	while (root->left != NULL)
		root = root->left;
	return root;
}

BTNode * inOrderSuccessor (BTNode * node) {
	if (node == NULL)
		return NULL;
	if (node->right != NULL)
		return minimumBST (node->right);     // Case 2: leftmost node of the right subtree
	BTNode * parent = node->parent;
	while (parent != NULL && node == parent->right) {
		node = parent;                        // climb while coming up from a right child
		parent = parent->parent;
	}
	return parent;                            // Cases 1 and 3 (NULL: node was the maximum)
}
```

**Deletion** ([G4](#l-g4-deletion)):

| Case | The node has | Do this |
|---|---|---|
| 1 | no subtrees (a leaf) | set the parent's pointer to it to NULL (or root = NULL) |
| 2(a) | only a right subtree | connect the right subtree to the node's parent |
| 2(b) | only a left subtree | connect the left subtree to the node's parent |
| 3 | two subtrees | copy the inorder successor's key into the node, then remove the successor, connecting the successor's **right** subtree to the successor's parent (it has no left subtree) |

**Cost**: search, insert and delete take O(h). h is about log₂ n for a well-shaped tree but n − 1 for a degenerate one (keys inserted in sorted order), so the worst case is O(n) ([G5](#l-g5-performance)).

## Heaps and priority queues

The heap is stored in an array **from index 1** (index 0 unused):

| | Index |
|---|---|
| Parent of i | i / 2 |
| Left child of i | 2i |
| Right child of i | 2i + 1 |
| Last non-leaf | size / 2 |

Max-heap property: `A[Parent(i)] >= A[i]`, so the maximum is A[1]. A heap is an almost complete binary tree, so its height is about log₂ n.

```cpp norun
struct MaxHeap {
	int A[MAX_SIZE];
	int size;
};

void maxHeapify (MaxHeap * heap, int i) {               // move A[i] down: O(log n)
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

void buildMaxHeap (MaxHeap * heap) {                     // O(n)
	for (int i = (heap->size / 2); i >= 1; i = i - 1)
		maxHeapify (heap, i);
}

int heapExtractMax (MaxHeap * heap) {                    // O(log n)
	int toDelete = heap->A[1];
	heap->A[1] = heap->A[heap->size];                    // last value to the root
	heap->size = heap->size - 1;
	maxHeapify (heap, 1);
	return toDelete;
}

void insertMaxHeap (MaxHeap * heap, int n) {             // O(log n): add at the end, move up
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

- **increaseKey (i, key)**: set A[i] = key, then move it up with the same loop as insert.
- **Heap sort**: buildMaxHeap, then repeatedly swap A[1] with A[size], shrink the heap by one and maxHeapify (A, 1). O(n log n) in every case.
- **Max-priority queue**: `struct MaxPriorityQueue { MaxHeap * heap; };` with insert, maximum (A[1], O(1)), extractMax and increaseKey.
- Lecture example: buildMaxHeap on 4 1 3 2 16 9 10 14 8 7 gives 16 14 10 8 7 9 3 2 4 1.

Lessons: [H1](#l-h1-heap-arrays) to [H4](#l-h4-insert-priority).

## Hashing

Table with locations 1 to N: **h = key % N + 1**. Empty locations hold 0; deleted ones hold −1.

| Collision rule | Next location after the x-th collision |
|---|---|
| Linear probing | location + 1 (after N comes 1) |
| Quadratic probing | location + (x + x²): jumps of 2, 6, 12, 20, … from where the last jump landed |
| Double hashing | location + k, with k = key % (N − 2) + 1 (the slide's example uses 16 % 10 = 6) |
| Chaining | no probing: insert at the top of the linked list at location h |

- **Search**: follow the same path as an insert; stop at the key, at an **empty** location, or after N tries. A **deleted** (−1) location does not stop a search.
- **Insert**: the first empty **or deleted** location.
- **Strings**: add the character codes, `intValue += str[i]` (anagrams collide), or weight them, `intValue += str[i] * i`; then `intValue % n + 1`.
- **Cost**: O(1) on average; O(n) in the worst case (every key collides). Keep the load factor low; resize by re-inserting every key.
- Lecture keys: 52 33 84 43 16 59 31 23 61 (linear: 84 23 61 · 52 16 · 43 31 33 · 59); chaining 39 25 26 60 37 75 13 73 (location 2: 73 13 37 25).

Lessons: [I1](#l-i1-hash-tables), [I2](#l-i2-probing), [I3](#l-i3-chaining-strings).

## Graphs

```cpp norun
struct Edge {
	string destID;
	Edge * nextEdge;
};

struct Vertex {
	string ID;
	Edge * firstEdge;          // top of this vertex's list of edges
};

struct Graph {
	int numVertices;
	Vertex vertices[MAX_VERTICES];
};
```

| Algorithm | Uses | Steps |
|---|---|---|
| BFS | a queue, colours | source GREY, enqueue it. Repeat: dequeue u, visit it; every WHITE neighbour becomes GREY and is enqueued; u becomes BLACK |
| DFS | recursion, colours | dfTraverse (u): visit u, make it GREY; call dfTraverse on every WHITE neighbour in list order; make u BLACK. The outer loop starts a new search from every vertex still WHITE |
| Dijkstra | cost, parent, min-priority queue | costs ∞ except the source (0). Repeatedly take the cheapest vertex u off the queue; for each edge (u, v), if u.cost + w < v.cost then v.cost = u.cost + w and v.parent = u. Weights must not be negative |
| Kruskal | sorted edges | every vertex its own tree; take edges smallest first; add an edge only if its ends are in different trees |
| Prim | used / unused sets | from a start vertex, repeatedly add the cheapest edge from a used vertex to an unused one |

Lecture answers: Lecture 16 graph BFS from A **A D F G B E C**, DFS **A D B E F G C**; Lecture 17 BFS example 2 **A B C D E F G**; Dijkstra from A: costs B 35, C 45, D 20, E 50, F 30, G 60 (parents F, F, A, C, D, E); Kruskal example total 10; Prim example minimum cost **53**. A spanning tree of n vertices has n − 1 edges.

Lessons: [J1](#l-j1-graph-basics) to [J5](#l-j5-mst).

## Sorting

```cpp norun
void insertionSort (int A[], int n) {
	for (int i = 1; i < n; i++) {
		int key = A[i];
		int j = i - 1;
		while (j >= 0 && A[j] > key) {
			A[j + 1] = A[j];
			j = j - 1;
		}
		A[j + 1] = key;
	}
}

void mergeSort (int A[], int start, int end) {
	int mid;
	if (start < end) {
		mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid+1, end);
		mergeArray (A, start, mid, end);      // merge A[start..mid] and A[mid+1..end]
	}
}

int partition (int A[], int p, int r) {
	int x = A[r];                             // pivot
	int i = p - 1;
	for (int j = p; j <= r - 1; j++) {
		if (A[j] <= x) {
			i = i + 1;
			int temp = A[i]; A[i] = A[j]; A[j] = temp;
		}
	}
	int temp = A[i + 1]; A[i + 1] = A[r]; A[r] = temp;
	return i + 1;
}

void quickSort (int A[], int p, int r) {
	int q;
	if (p < r) {
		q = partition (A, p, r);
		quickSort (A, p, q-1);
		quickSort (A, q+1, r);
	}
}
```

- **Selection**: swap the smallest of the rest to the front. **Bubble**: swap neighbours that are out of order; the largest reaches the end each pass.
- partition on 30 65 10 75 55 90 60 gives 30 10 55 **60** 65 90 75 (q = 3); on 25 90 30 5 60 70 45 gives 25 30 5 **45** 60 70 90 (q = 3).

Lessons: [K1](#l-k1-simple-sorts) to [K4](#l-k4-sorting-performance).

## Big-O at a glance

| Structure | Operation | Best | Worst |
|---|---|---|---|
| Array | access A[i] | O(1) | O(1) |
| | search (unsorted) | O(1) | O(n) |
| | binary search (sorted) | O(1) | O(log n) |
| | insert or delete in the middle | O(1) | O(n) |
| Linked list | insert or delete at the head | O(1) | O(1) |
| | insert at the tail (top pointer only) | O(n) | O(n) |
| | search, delete a key | O(1) | O(n) |
| Stack / queue | push, pop, enqueue, dequeue | O(1) | O(1) |
| Binary tree | search, any traversal | O(1) / O(n) | O(n) |
| BST (height h) | search, insert, delete, min, max, successor | O(h), O(log n) when well shaped | O(n) |
| Max-heap | maximum | O(1) | O(1) |
| | insert, extractMax, increaseKey, maxHeapify | O(1) | O(log n) |
| | buildMaxHeap | O(n) | O(n) |
| | search for a value | O(1) | O(n) |
| Hash table | insert, search, delete | O(1) | O(n) |
| Graph (lists) | BFS, DFS | O(V + E) | O(V + E) |

| Sort | Best | Average | Worst | Extra memory |
|---|---|---|---|---|
| Selection | O(n²) | O(n²) | O(n²) | none |
| Bubble | O(n²) (O(n) with the early stop) | O(n²) | O(n²) | none |
| Insertion | O(n) | O(n²) | O(n²) | none |
| Heap | O(n log n) | O(n log n) | O(n log n) | none |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) |
| Quick | O(n log n) | O(n log n) | O(n²) | none (plus the call stack) |

The lecture's search summary: arrays O(n), linked lists O(n), binary trees O(n), BSTs O(log₂ n), heaps O(n), hashing O(1) on average. More in [L1](#l-l1-performance).

## Choosing a data structure

The cost of each operation, side by side. n is the number of values, h the height of a tree.

| Structure | Get the i-th value | Search | Insert | Delete | Extra memory | Good for |
|---|---|---|---|---|---|---|
| Array (unsorted) | O(1) | O(n) | O(1) at the end | O(n) (shifting) | none | fast access by index |
| Sorted array | O(1) | O(log n) (binary search) | O(n) | O(n) | none | many searches, few changes |
| Singly linked list | O(n) | O(n) | O(1) at the head | O(1) at the head, O(n) for a key | one pointer per node | frequent inserts at the front |
| Doubly linked list* | O(n) | O(n) | O(1) at either end | O(1) for a node you point to | two pointers per node | removing from the middle |
| Stack | top only | – | O(1) push | O(1) pop | one pointer per node | undo, brackets, recursion |
| Queue | front only | – | O(1) enqueue | O(1) dequeue | one pointer per node (or a fixed array*) | waiting lines, BFS |
| BST | – | O(h): O(log n) to O(n) | O(h) | O(h) | two or three pointers per node | sorted data that changes |
| AVL tree* | – | O(log n) worst case | O(log n) | O(log n) | plus a height per node | guaranteed fast search |
| Max-heap | max in O(1) | O(n) | O(log n) | O(log n) for the max | none (an array) | priority queues, heap sort |
| Hash table | – | O(1) average, O(n) worst | O(1) average | O(1) average | spare slots or chain nodes | lookup by key |

\* Supplementary: not in the lecture notes. See [Beyond the notes](#learn).

| Graph representation | Memory | Is there an edge u→v? | Visit all neighbours of u |
|---|---|---|---|
| Adjacency matrix | O(V²) | O(1) | O(V) |
| Adjacency lists | O(V + E) | O(degree of u) | O(degree of u) |

Use a matrix for dense graphs (many edges) and lists for sparse graphs, which is most graphs in practice.

## Common errors and how to fix them

| What you see | Likely cause | Fix |
|---|---|---|
| Crash at a line with `->` | following a NULL pointer (`curr->data` when `curr` is NULL) | test `curr != NULL` first, and handle the empty structure |
| Strange large numbers | a variable used before it was given a value | initialise every variable when you declare it |
| The last node or element is skipped | the loop stops one early (`curr->next != NULL`, `i < n - 1`) | check the loop's last pass by hand |
| The program never stops | the loop variable never moves (`curr = curr->next` missing) | make every pass move closer to the end |
| The list is lost after an insert or delete | `top` overwritten before the old value was saved | save the pointer you still need in a temporary first |
| Crash or nonsense after `delete` | a dangling pointer: memory used after it was freed | set the pointer to NULL after `delete`, and update every pointer to that node |
| "deleted twice" | two pointers to one node, both deleted | decide which pointer owns the node; only the owner deletes |
| Memory grows, objects never freed | a leak: the last pointer to a node was overwritten | delete before you lose the pointer, or keep one owner |
| Wrong answer from division | integer division (`7 / 2` is 3) | make one side a double: `7 / 2.0` |
| A condition is always true | `=` (assignment) instead of `==` (comparison) | use `==` in conditions |
| Recursion never ends | no base case, or the call does not get smaller | check the base case and that each call moves towards it |
| Heap off by one | children of i at 2i and 2i + 1 only when the heap starts at index 1 | keep A[0] unused, as the lectures do |
| Hash location 0 or past N | `key % N` used where the lectures use `key % N + 1` | locations run from 1 to N |

## A method for debugging

1. **Shrink it.** Find the smallest input that goes wrong: an empty structure, one value, two values.
2. **Predict, then watch.** Before you run, write down what each variable should be. Then step through in the visualizer (Step over, Step into, breakpoints) and stop at the first line where reality differs from your prediction. That line, or the line before it, holds the bug.
3. **Draw the pointers.** For lists and trees, draw boxes and arrows for each step. The inspector shows what points to each object, and whether anything has leaked.
4. **Check the edges.** Most bugs live at the first node, the last node, the empty structure, or the node being deleted.
5. **Change one thing at a time,** then run every test again, not just the one that failed.

## Recursion templates

```cpp norun
// a list: the base case is the empty list
int f (Node * top) {
	if (top == NULL)
		return 0;                          // answer for the empty list
	return combine (top->data, f (top->next));
}

// a binary tree: the base case is the empty tree; combine both subtrees
int g (BTNode * root) {
	if (root == NULL)
		return 0;
	return combine (root->data, g (root->left), g (root->right));
}

// an array: work on A[0..n-1] by shrinking n
int h (int A[], int n) {
	if (n == 0)
		return 0;
	return combine (A[n - 1], h (A, n - 1));
}

// divide and conquer (merge sort): split, solve both halves, merge
void solve (int A[], int lo, int hi) {
	if (lo >= hi)
		return;                            // one value (or none) is already solved
	int mid = (lo + hi) / 2;
	solve (A, lo, mid);
	solve (A, mid + 1, hi);
	merge (A, lo, mid, hi);
}
```

## The standard library equivalents (beyond the course)

COMP 2611 builds every structure by hand, which is what its tests and exams ask for. Outside the course, C++'s standard library provides ready-made versions. They are listed here for reference; the runner on this site does not support them (see [C++ support](#cpp)).

| Course structure | Standard library | Notes |
|---|---|---|
| Dynamic array (`new int[n]`) | `std::vector<int>` | grows by itself; `v[i]` is O(1) |
| Singly / doubly linked list | `std::forward_list`, `std::list` | |
| Stack | `std::stack<int>` | push, pop, top |
| Queue | `std::queue<int>` | push (enqueue), pop (dequeue), front |
| Max priority queue (heap) | `std::priority_queue<int>` | a max-heap by default |
| Balanced BST | `std::set`, `std::map` | usually red-black trees: O(log n) operations |
| Hash table (chaining) | `std::unordered_set`, `std::unordered_map` | O(1) average |
| Sorting | `std::sort` | O(n log n) |

## Supplementary topics at a glance

| Topic | Key idea | Lesson |
|---|---|---|
| Doubly linked list | prev and next in every node; delete a known node in O(1) | [Doubly linked and circular lists](#l-m1-doubly-circular) |
| Circular list | last node points to the first; a `last` pointer reaches both ends | [Doubly linked and circular lists](#l-m1-doubly-circular) |
| Circular array queue | head and tail move with `(i + 1) % MAX`; a count tells full from empty | [Circular queues in arrays](#l-m2-circular-queue) |
| Binary search | sorted array; halve the range each step; O(log n) | [Binary search](#l-m3-binary-search) |
| AVL tree | every node balanced (−1, 0, +1); rotations after insert; O(log n) worst case | [AVL trees](#l-m4-avl-trees), [AVL Tree Lab](#lab-avl) |

## Exam tips

See the [exam review](#exam-review) for answer formats, writing C++ by hand and planning your time, and practise with [written answers](#written) that are marked against a scheme.
