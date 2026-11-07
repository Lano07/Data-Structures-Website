# Written-answer practice: original questions written for this site in the style of COMP 2611.
# None of these is from a UWI past paper. Code answers are compiled and run with g++ at build time.

=== w-ll-count
topic: lists
type: code
marks: 4
minutes: 6
lessons: c2-traversal
--- question
Write a function `countKey` that returns how many nodes of a linked list hold the value `key`. The list is reached through `top`, using the course's `struct Node { int data; Node * next; }`. Do not change the list.

```cpp
int countKey (Node * top, int key);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Correct header: returns an int and takes Node * top and int key.
1 | Walks the list with a separate pointer (curr) from top while curr != NULL, moving with curr = curr->next.
1 | Compares curr->data with key and adds 1 to a counter that starts at 0.
1 | Returns the counter after the loop, so an empty list gives 0, and the list is not changed.
--- answer
```cpp
int countKey (Node * top, int key) {
	int count = 0;
	Node * curr = top;
	while (curr != NULL) {
		if (curr->data == key)
			count = count + 1;
		curr = curr->next;
	}
	return count;
}
```

Why it is correct: `curr` visits every node exactly once, from `top` to the last node, and the counter increases only when a node holds `key`. An empty list (`top == NULL`) skips the loop and returns 0. Using `curr` instead of moving `top` keeps the caller's list unchanged. Cost: O(n).
--- mistakes
- Moving `top` itself instead of a copy. Inside the function this is harmless for the caller, but it is a bad habit that loses the list when `top` is passed by reference.
- Stopping at `curr->next != NULL`, which skips the last node.
- Returning inside the loop as soon as one match is found, which counts at most one.
--- format
Write the full function with its header. Use the course names (`top`, `curr`). Indent the loop body. One short sentence on the empty list shows the marker you thought about it.
--- check
int main () {
	Node * top = NULL;
	int v[] = {4, 7, 4, 2, 4};
	for (int i = 4; i >= 0; i--) { Node * n = createNode (v[i]); n->next = top; top = n; }
	cout << countKey (top, 4) << " " << countKey (top, 9) << " " << countKey (NULL, 1) << endl;
	return 0;
}
--- expect
3 0 0

=== w-ll-delete
topic: lists
type: code
marks: 6
minutes: 10
lessons: c4-deletion
--- question
Write `deleteKey`, which removes the **first** node holding `key` from a linked list and returns the (possibly new) top of the list. If `key` is not in the list, the list is unchanged. The removed node must be freed.

```cpp
Node * deleteKey (Node * top, int key);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Handles the empty list: returns top (NULL) without following it.
1 | Handles the key in the first node: saves the new top (top->next), deletes the old first node and returns the new top.
1 | Uses prev and curr to search, keeping prev one node behind curr.
1 | Links around the node: prev->next = curr->next.
1 | Frees the removed node with delete (no memory leak).
1 | Leaves the list unchanged and returns top when key is not found.
--- answer
```cpp
Node * deleteKey (Node * top, int key) {
	if (top == NULL)                      // Case 1: empty list
		return top;
	if (top->data == key) {               // Case 2: the key is in the first node
		Node * newTop = top->next;
		delete top;
		return newTop;
	}
	Node * prev = top;                    // Case 3: search the rest
	Node * curr = top->next;
	while (curr != NULL && curr->data != key) {
		prev = curr;
		curr = curr->next;
	}
	if (curr != NULL) {                   // found: link around it, then free it
		prev->next = curr->next;
		delete curr;
	}
	return top;
}
```

The three cases are what the marker looks for. The first node is special because no `prev` comes before it, so the function must return a new top. The `while` condition tests `curr != NULL` **first**, so `curr->data` is never read through NULL.
--- mistakes
- Testing `curr->data != key` before `curr != NULL`, which follows a NULL pointer when the key is missing.
- Deleting the node before linking around it, then reading `curr->next` from freed memory.
- Forgetting to return the new top when the first node is deleted (the caller keeps a dangling pointer).
--- format
Label the cases with short comments, as the lectures do. A marker gives the case marks only when each case is visibly handled, so do not merge them into one clever loop.
--- check
void print (Node * top) { for (Node * c = top; c != NULL; c = c->next) cout << c->data << " "; cout << "| "; }
int main () {
	Node * top = NULL;
	int v[] = {5, 8, 3, 8};
	for (int i = 3; i >= 0; i--) { Node * n = createNode (v[i]); n->next = top; top = n; }
	top = deleteKey (top, 8); print (top);
	top = deleteKey (top, 5); print (top);
	top = deleteKey (top, 42); print (top);
	top = deleteKey (top, 8); top = deleteKey (top, 3); print (top);
	top = deleteKey (top, 1); print (top);
	cout << endl;
	return 0;
}
--- expect
5 3 8 | 3 8 | 3 8 | | | 

=== w-rec-sum
topic: recursion
type: code
marks: 4
minutes: 5
lessons: d2-recursion-lists
--- question
Write a **recursive** function `sumList` that returns the sum of the values in a linked list. Do not use a loop.

```cpp
int sumList (Node * top);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | Base case: an empty list (top == NULL) returns 0.
2 | Recursive case: returns top->data + sumList (top->next).
1 | No loop, and every path returns a value.
--- answer
```cpp
int sumList (Node * top) {
	if (top == NULL)                          // base case: the empty list has sum 0
		return 0;
	return top->data + sumList (top->next);   // this node + the sum of the rest
}
```

Why it works: the sum of a list is its first value plus the sum of the rest of the list, and the rest is a shorter list. Each call moves one node closer to the base case, so the recursion always ends. For 3 → 5 → 2 the calls return 0, then 2, then 7, then 10.
--- mistakes
- Returning `top->data` in the base case, which follows a NULL pointer.
- Calling `sumList (top)` instead of `sumList (top->next)`, which never ends.
- Adding the result to a global variable instead of returning it.
--- format
Write the base case first and label it. One line explaining why the recursion ends earns the confidence of the marker even when the code is short.
--- check
int main () {
	Node * top = NULL;
	int v[] = {3, 5, 2};
	for (int i = 2; i >= 0; i--) { Node * n = createNode (v[i]); n->next = top; top = n; }
	cout << sumList (top) << " " << sumList (NULL) << endl;
	return 0;
}
--- expect
10 0

=== w-rec-trace
topic: recursion
type: trace
marks: 4
minutes: 6
lessons: d1-how-recursion-works
--- question
Consider this function:

```cpp
void show (int n) {
	if (n == 0)
		return;
	cout << n << " ";
	show (n - 1);
	cout << n << " ";
}
```

(a) What does `show (3);` print? (2 marks)
(b) How many calls of `show` are on the stack at the deepest point, and what is `n` in each? (2 marks)
--- rubric
2 | (a) The output is 3 2 1 1 2 3 (1 mark for 3 2 1 before the base case, 1 mark for 1 2 3 after it).
1 | (b) Four calls at the deepest point (show (3), show (2), show (1), show (0)).
1 | (b) Explains that each call waits for the call it made to return, so the second cout runs on the way back, in reverse order.
--- answer
**(a)** `3 2 1 1 2 3 `

Trace: `show (3)` prints 3, then calls `show (2)`, which prints 2 and calls `show (1)`, which prints 1 and calls `show (0)`. `show (0)` returns at once. Now each waiting call finishes its second `cout`: `show (1)` prints 1, `show (2)` prints 2, `show (3)` prints 3.

**(b)** Four calls are on the stack at the deepest point: n = 3, 2, 1 and 0 (top of the stack). Each call keeps its own `n` in its own stack frame, which is why the numbers come back out in reverse order.
--- mistakes
- Writing 3 2 1 0 ... : the base case returns before anything is printed.
- Forgetting the second cout, giving only 3 2 1.
- Saying three calls: the call with n = 0 is a real call with its own frame.
--- format
Show the order of calls as an indented list or a small stack diagram. A trace that shows each call returning is worth marks even if the final line has a slip.

=== w-sq-queue
topic: stacks
type: code
marks: 6
minutes: 9
lessons: e2-queues
--- question
A queue is stored as a linked list with `struct Queue { Node * head; Node * tail; };`. Write `enqueue` (add at the tail) and `dequeue` (remove from the head and return its value, or -999 if the queue is empty).

```cpp
void enqueue (Queue * q, int n);
int dequeue (Queue * q);
```
--- given
#include <iostream>
using namespace std;
struct Node { int data; Node * next; };
struct Queue { Node * head; Node * tail; };
Node * createNode (int n) { Node * newNode = new Node; newNode->data = n; newNode->next = NULL; return newNode; }
--- rubric
1 | enqueue on an empty queue sets both head and tail to the new node.
1 | enqueue otherwise links tail->next to the new node and moves tail to it.
1 | dequeue returns -999 when the queue is empty (head == NULL).
1 | dequeue saves the value and moves head to head->next.
1 | dequeue sets tail to NULL when the queue becomes empty.
1 | dequeue frees the removed node.
--- answer
```cpp
void enqueue (Queue * q, int n) {
	Node * newNode = createNode (n);
	if (q->head == NULL) {          // empty queue: the new node is both ends
		q->head = newNode;
		q->tail = newNode;
	}
	else {
		q->tail->next = newNode;    // link after the last node
		q->tail = newNode;
	}
}

int dequeue (Queue * q) {
	if (q->head == NULL)            // empty queue
		return -999;
	Node * first = q->head;
	int value = first->data;
	q->head = first->next;
	if (q->head == NULL)            // the queue is now empty
		q->tail = NULL;
	delete first;
	return value;
}
```

Both operations are O(1) because the tail pointer gives direct access to the last node.
--- mistakes
- Leaving `tail` pointing at the deleted node after the last dequeue, so the next enqueue writes into freed memory.
- Forgetting the empty-queue case in enqueue, so `q->tail->next` follows NULL.
- Returning `q->head->data` after moving head (the wrong value, or NULL).
--- format
Write each function in full. Comment the empty-queue cases: they carry marks of their own.
--- check
int main () {
	Queue q; q.head = NULL; q.tail = NULL;
	cout << dequeue (&q) << " ";
	enqueue (&q, 1); enqueue (&q, 2);
	cout << dequeue (&q) << " " << dequeue (&q) << " " << dequeue (&q) << " ";
	enqueue (&q, 7);
	cout << dequeue (&q) << " " << (q.tail == NULL) << endl;
	return 0;
}
--- expect
-999 1 2 -999 7 1

=== w-sq-brackets
topic: stacks
type: explain
marks: 4
minutes: 6
lessons: e3-applications
--- question
Explain how a stack is used to check whether the brackets in an expression are balanced. Then show the stack after each bracket for `{[()]}` and say what goes wrong for `([)]`.
--- rubric
1 | Opening brackets are pushed onto the stack.
1 | For a closing bracket: the stack must not be empty, and the popped bracket must be the matching opening bracket.
1 | At the end, the expression is balanced only if the stack is empty.
1 | Correct trace of {[()]} (stack grows to { [ ( and empties) and correct reason for ([)]: ] meets ( on top, a mismatch.
--- answer
**Method.** Read the expression from left to right.

1. An opening bracket `(`, `[` or `{` is pushed.
2. A closing bracket pops the stack. If the stack was empty, or the popped bracket is not the matching opening bracket, the expression is not balanced.
3. At the end, it is balanced only if the stack is empty (no bracket was left open).

**Trace of `{[()]}`** (top of the stack on the right):

| Read | Action | Stack |
|---|---|---|
| { | push | { |
| [ | push | { [ |
| ( | push | { [ ( |
| ) | pop (, matches | { [ |
| ] | pop [, matches | { |
| } | pop {, matches | (empty) |

The stack ends empty, so it is balanced.

**`([)]`**: after `(` and `[` the stack is `( [`. The `)` pops `[`, which does not match, so the expression is not balanced. A stack works because the most recently opened bracket must be closed first (last in, first out).
--- mistakes
- Only counting brackets: `([)]` has equal counts but is not balanced.
- Forgetting the final empty-stack check, so `((` would pass.
--- format
State the three rules, then give the trace as a table. Tables are faster to write and easier to mark than sentences.

=== w-bt-terms
topic: trees
type: explain
marks: 4
minutes: 5
lessons: f1-terminology
--- question
The keys 50, 30, 70, 20, 40, 60, 80, 65 are inserted in this order into an empty BST. For the resulting tree give, using the course's definitions: (a) its moment, (b) its weight, (c) its height, (d) the level of the node holding 65.
--- rubric
1 | (a) Moment = 8 (the number of nodes).
1 | (b) Weight = 4 (the number of leaves: 20, 40, 65 and 80).
1 | (c) Height = 3 (the longest path from the root, 50 → 70 → 60 → 65, has 3 edges).
1 | (d) Level of 65 = 3 (the root is at level 0).
--- answer
The tree is: 50 at the root; 30 (children 20 and 40) on the left; 70 (children 60 and 80) on the right; 65 is the right child of 60.

- **(a) Moment = 8.** The moment is the number of nodes.
- **(b) Weight = 4.** The weight is the number of leaves (terminal nodes): 20, 40, 65 and 80. 60 is not a leaf, because it has a right child.
- **(c) Height = 3.** The height counts edges on the longest root-to-leaf path: 50 → 70 → 60 → 65.
- **(d) Level of 65 = 3.** Levels count edges from the root, and the root is level 0.
--- mistakes
- Counting 60 as a leaf.
- Counting nodes instead of edges for height or level (giving 4).
- Using another book's meaning of weight. In this course, weight means the number of leaves.
--- format
Draw the tree first; every part is read from the drawing. Give each answer with the definition you used, so a marker can award the mark even if your drawing has a slip.

=== w-bt-leaves
topic: trees
type: code
marks: 4
minutes: 5
lessons: f3-tree-code
--- question
Write a recursive function `weight` that returns the number of leaves in a binary tree.

```cpp
int weight (BTNode * root);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; BTNode * parent; };
BTNode * createBTNode (int data) { BTNode * n = new BTNode; n->data = data; n->left = NULL; n->right = NULL; n->parent = NULL; return n; }
--- rubric
1 | An empty tree (root == NULL) returns 0.
1 | A node with no subtrees returns 1.
1 | Otherwise returns weight (root->left) + weight (root->right).
1 | Correct header, no loops needed, every path returns.
--- answer
```cpp
int weight (BTNode * root) {
	if (root == NULL)                                // empty tree: no leaves
		return 0;
	if (root->left == NULL && root->right == NULL)   // a leaf
		return 1;
	return weight (root->left) + weight (root->right);
}
```

Every leaf is counted once, by the call made on it. Every other node only adds up the leaves of its two subtrees. Each node is visited once, so the cost is O(n).
--- mistakes
- Leaving out the NULL case, so a node with one subtree calls `weight (NULL)` and crashes.
- Returning 1 + ... for every node, which counts nodes (the moment) instead of leaves.
--- format
Base cases first, each with a one-word comment. Three short lines are better than one long conditional expression.
--- check
BTNode * ins (BTNode * r, int k) { if (!r) return createBTNode (k); if (k < r->data) r->left = ins (r->left, k); else r->right = ins (r->right, k); return r; }
int main () {
	BTNode * r = NULL;
	int k[] = {50, 30, 70, 20, 40, 60, 80, 65};
	for (int i = 0; i < 8; i++) r = ins (r, k[i]);
	cout << weight (r) << " " << weight (NULL) << endl;
	return 0;
}
--- expect
4 0

=== w-bt-height
topic: trees
type: code
marks: 4
minutes: 5
lessons: f3-tree-code
--- question
Write a recursive function `height` that returns the height of a binary tree, where an empty tree has height -1 and a single node has height 0.

```cpp
int height (BTNode * root);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; BTNode * parent; };
BTNode * createBTNode (int data) { BTNode * n = new BTNode; n->data = data; n->left = NULL; n->right = NULL; n->parent = NULL; return n; }
--- rubric
1 | An empty tree returns -1.
1 | Finds the heights of both subtrees recursively.
1 | Returns 1 + the larger of the two.
1 | A single node therefore gives 0 (follows from the above, with no extra special case needed).
--- answer
```cpp
int height (BTNode * root) {
	if (root == NULL)              // empty tree
		return -1;
	int hl = height (root->left);
	int hr = height (root->right);
	if (hl > hr)
		return 1 + hl;
	return 1 + hr;
}
```

A single node has two empty subtrees of height -1, so it gets 1 + (-1) = 0, as the definition requires. The height is the number of edges on the longest path down, and each level adds one edge.
--- mistakes
- Returning 0 for an empty tree, which makes every height one too big.
- Adding both heights instead of taking the larger one.
- Calling `height` four times (twice for the comparison, twice for the return), which is correct but very slow on large trees.
--- format
Store the two recursive results in variables. It is clearer and avoids repeated calls.
--- check
BTNode * ins (BTNode * r, int k) { if (!r) return createBTNode (k); if (k < r->data) r->left = ins (r->left, k); else r->right = ins (r->right, k); return r; }
int main () {
	BTNode * r = NULL;
	cout << height (r) << " ";
	r = ins (r, 50); cout << height (r) << " ";
	int k[] = {30, 70, 20, 40, 60, 80, 65};
	for (int i = 0; i < 7; i++) r = ins (r, k[i]);
	cout << height (r) << endl;
	return 0;
}
--- expect
-1 0 3

=== w-bt-rebuild
topic: trees
type: trace
marks: 4
minutes: 7
lessons: f2-traversals
--- question
A binary tree has preorder **8 3 1 6 4 7 10 14 13** and inorder **1 3 4 6 7 8 10 13 14**. Draw the tree and give its postorder traversal.
--- rubric
1 | Root is 8 (the first value in preorder); 1 3 4 6 7 form the left subtree and 10 13 14 the right subtree (split by 8 in inorder).
1 | Left subtree: 3 with left child 1 and right child 6; 6 has children 4 and 7.
1 | Right subtree: 10 with right child 14; 14 has left child 13.
1 | Postorder: 1 4 7 6 3 13 14 10 8.
--- answer
**Method.** The first value of the preorder is the root. Find it in the inorder: everything to its left is the left subtree, everything to its right is the right subtree. Repeat for each subtree.

- Root **8**. Inorder splits into left {1 3 4 6 7} and right {10 13 14}.
- Left subtree: the next preorder value is **3**. Its left is {1}, its right is {4 6 7}, whose root is **6** (next in preorder), with children 4 and 7.
- Right subtree: the next preorder value is **10**. Nothing is left of 10 in {10 13 14}, so its right subtree {13 14} has root **14**, with left child 13.

**Postorder (left, right, root): 1 4 7 6 3 13 14 10 8**
--- mistakes
- Taking the root from the inorder instead of the preorder.
- Making 13 a right child of 14: in the inorder 13 comes before 14, so it is on 14's left.
--- format
Draw the tree, then write the traversal. If you show the split at each step, a slip later still earns the method marks.

=== w-bst-delete
topic: bst
type: trace
marks: 5
minutes: 7
lessons: g4-deletion
--- question
The keys 50, 30, 70, 20, 40, 60, 80, 65 are inserted into an empty BST in that order. 50 is then deleted using the lecture's method. (a) Which case of deletion applies? (b) Which node replaces 50, and why? (c) Give the preorder traversal after the deletion. (d) Why does the inorder successor of a node with two subtrees never have a left subtree?
--- rubric
1 | (a) Case 3: the node has two subtrees.
1 | (b) The inorder successor 60 (the smallest key in the right subtree) is copied into the node.
1 | (b/c) 60's right subtree (65) is connected to 60's parent (70) as its left child.
1 | (c) Preorder after deletion: 60 30 20 40 70 65 80.
1 | (d) The successor is the leftmost node of the right subtree; if it had a left child, that child would be smaller and would be the successor instead.
--- answer
**(a)** Case 3, because 50 has two subtrees.

**(b)** Its inorder successor is the smallest key in its right subtree: go right to 70, then left as far as possible, to **60**. 60 is copied into the root. Then the node that held 60 is removed by connecting its **right** subtree (65) to its parent: 65 becomes the left child of 70.

**(c)** Preorder: **60 30 20 40 70 65 80**

**(d)** The successor is found by going left until there is no left child, so it has no left subtree by construction. If it had a left child, that child would be smaller than it, but still larger than the deleted key, so the child would be the successor instead.
--- mistakes
- Using the predecessor (40): the lecture method uses the inorder successor.
- Connecting 65 as 70's right child: the successor was a left child, so its replacement goes on the left.
- Forgetting that 60 had a right subtree, and simply removing 60 (losing 65).
--- format
Draw the tree before and after. Name the case in words, since it carries a mark of its own.

=== w-bst-succ
topic: bst
type: code
marks: 6
minutes: 10
lessons: g3-parent-successor
--- question
Using parent pointers, write `inorderSuccessor`, which returns the node with the next larger key after `node` in a BST, or NULL if `node` holds the largest key.

```cpp
BTNode * inorderSuccessor (BTNode * node);
```
--- given
#include <iostream>
using namespace std;
struct BTNode { int data; BTNode * left; BTNode * right; BTNode * parent; };
BTNode * createBTNode (int data) { BTNode * n = new BTNode; n->data = data; n->left = NULL; n->right = NULL; n->parent = NULL; return n; }
--- rubric
1 | If node has a right subtree, goes to node->right.
1 | ...then follows left pointers to the minimum of that subtree and returns it.
1 | Otherwise climbs using parent pointers.
2 | Keeps climbing while coming up from a right child (child == parent->right), then returns the parent where it stops.
1 | Returns NULL when the root is passed (node was the maximum), without following NULL.
--- answer
```cpp
BTNode * inorderSuccessor (BTNode * node) {
	if (node->right != NULL) {                 // Case 1: the minimum of the right subtree
		BTNode * curr = node->right;
		while (curr->left != NULL)
			curr = curr->left;
		return curr;
	}
	BTNode * child = node;                     // Case 2: climb until we come up from a left child
	BTNode * parent = node->parent;
	while (parent != NULL && child == parent->right) {
		child = parent;
		parent = parent->parent;
	}
	return parent;                             // NULL if node held the largest key
}
```

Why it is correct: if `node` has a right subtree, the next key in sorted order is the smallest key in it. If not, every ancestor reached by coming up from a right child is smaller than `node`. The first ancestor reached from a **left** child is the first one larger than `node`. Cost: O(h).
--- mistakes
- Returning `node->right` itself instead of the leftmost node below it.
- Testing `child == parent->right` before `parent != NULL` (following NULL at the root).
- Returning the parent at once, without climbing: correct only when node is a left child.
--- format
Two labelled cases. The climbing loop's condition is the key line: write it clearly, NULL test first.
--- check
BTNode * ins (BTNode * r, int k) { if (!r) return createBTNode (k); if (k < r->data) { r->left = ins (r->left, k); r->left->parent = r; } else { r->right = ins (r->right, k); r->right->parent = r; } return r; }
BTNode * find (BTNode * r, int k) { while (r && r->data != k) r = k < r->data ? r->left : r->right; return r; }
int main () {
	BTNode * r = NULL;
	int k[] = {50, 30, 70, 20, 40, 60, 80, 65};
	for (int i = 0; i < 8; i++) r = ins (r, k[i]);
	int q[] = {20, 40, 50, 65, 80};
	for (int i = 0; i < 5; i++) { BTNode * s = inorderSuccessor (find (r, q[i])); if (s) cout << s->data << " "; else cout << "NULL "; }
	cout << endl;
	return 0;
}
--- expect
30 50 60 70 NULL 

=== w-bst-perf
topic: bst
type: complexity
marks: 4
minutes: 5
lessons: g5-performance
--- question
Explain why searching a BST with n keys takes about log₂ n comparisons when the tree is well shaped but n comparisons in the worst case. Give an insertion order that produces the worst case for the keys 1 to 5.
--- rubric
1 | A search follows one path from the root, so its cost is the height of the tree, O(h).
1 | A well-shaped tree roughly halves the remaining keys at each level, so h is about log₂ n.
1 | A degenerate tree (each node has one child) has height n − 1, so a search may check all n nodes: O(n).
1 | Inserting in sorted (or reverse sorted) order, such as 1 2 3 4 5, produces the degenerate tree.
--- answer
A search compares the key with one node at each level and then goes left or right, so it follows a single path from the root. Its cost is the height h of the tree: O(h).

- **Well shaped:** each level holds about twice as many nodes as the level above, so n keys fit in about log₂ n levels, and h ≈ log₂ n.
- **Worst case:** if every node has only one child, the tree is a chain of height n − 1, and a search may have to check all n nodes: O(n).

Inserting the keys in sorted order, **1 2 3 4 5**, makes each new key the right child of the previous one: a chain. (5 4 3 2 1 gives a chain to the left.)
--- mistakes
- Saying a BST search is always O(log n): that is true only for a well-shaped tree.
- Saying the cost depends on n directly rather than on the height.
--- format
State the general rule (cost = height), then the two cases. A one-line sketch of the chain makes the worst case obvious.

=== w-heap-build
topic: heaps
type: trace
marks: 5
minutes: 8
lessons: h2-heapify-build
--- question
Run `buildMaxHeap` on the array **5 3 17 10 84 19 6 22 9** (stored from index 1). Show the array after each call of `maxHeapify`.
--- rubric
1 | Starts at index size/2 = 4 and goes down to 1.
1 | maxHeapify(4): 10 swaps with 22 → 5 3 17 22 84 19 6 10 9.
1 | maxHeapify(3): 17 swaps with 19 → 5 3 19 22 84 17 6 10 9.
1 | maxHeapify(2): 3 swaps with 84 → 5 84 19 22 3 17 6 10 9.
1 | maxHeapify(1): 5 sinks past 84, 22 and 10 → final heap 84 22 19 10 3 17 6 5 9.
--- answer
n = 9, so `buildMaxHeap` calls `maxHeapify` for i = 9/2 = 4, 3, 2, 1. Each call swaps A[i] with its larger child until it is at least as large as both children.

| Call | Swaps | Array (index 1 to 9) |
|---|---|---|
| maxHeapify (4) | 10 ↔ 22 | 5 3 17 **22** 84 19 6 **10** 9 |
| maxHeapify (3) | 17 ↔ 19 | 5 3 **19** 22 84 **17** 6 10 9 |
| maxHeapify (2) | 3 ↔ 84 | 5 **84** 19 22 **3** 17 6 10 9 |
| maxHeapify (1) | 5 ↔ 84, 5 ↔ 22, 5 ↔ 10 | **84 22** 19 **10** 3 17 6 **5** 9 |

Final max-heap: **84 22 19 10 3 17 6 5 9**. Check: every parent is at least as large as its children (84 ≥ 22, 19; 22 ≥ 10, 3; 19 ≥ 17, 6; 10 ≥ 5, 9).
--- mistakes
- Starting at index 1 and going up, which does not build a heap.
- Stopping a maxHeapify call after one swap: 5 must keep sinking until both children are smaller.
- Swapping with the first larger child instead of the larger of the two children.
--- format
One row per call, as in the table. Bold or underline the values that moved, so a marker sees each swap at a glance. Finish with a one-line heap check.

=== w-heap-extract
topic: heaps
type: code
marks: 5
minutes: 8
lessons: h3-delete-heapsort
--- question
A max-heap is stored as `struct MaxHeap { int * A; int size; };` with values in `A[1]` to `A[size]`. Using the given `maxHeapify`, write `heapExtractMax`, which removes and returns the largest value, or -999 if the heap is empty.

```cpp
int heapExtractMax (MaxHeap * heap);
```
--- given
#include <iostream>
using namespace std;
struct MaxHeap { int * A; int size; };
void maxHeapify (MaxHeap * heap, int i) {
	int l = 2 * i, r = 2 * i + 1, largest = i;
	if (l <= heap->size && heap->A[l] > heap->A[largest]) largest = l;
	if (r <= heap->size && heap->A[r] > heap->A[largest]) largest = r;
	if (largest != i) { int t = heap->A[i]; heap->A[i] = heap->A[largest]; heap->A[largest] = t; maxHeapify (heap, largest); }
}
--- rubric
1 | Returns -999 when the heap is empty (size < 1).
1 | Saves the maximum, A[1].
1 | Moves the last value A[size] to A[1].
1 | Decreases size by 1.
1 | Calls maxHeapify (heap, 1) and returns the saved maximum.
--- answer
```cpp
int heapExtractMax (MaxHeap * heap) {
	if (heap->size < 1)                       // empty heap
		return -999;
	int max = heap->A[1];                     // the largest value is at the root
	heap->A[1] = heap->A[heap->size];         // move the last value to the root
	heap->size = heap->size - 1;
	maxHeapify (heap, 1);                     // let it sink to its place
	return max;
}
```

Moving the last value to the root keeps the shape (a complete tree filled from the left); `maxHeapify` then restores the heap property along one path, so the cost is O(log n).
--- mistakes
- Calling maxHeapify before decreasing size, so the old last value is compared again.
- Returning `heap->A[1]` at the end (that is the new maximum, not the removed one).
- Shifting every element left by one, which is O(n) and breaks the parent/child layout.
--- format
Comment the four steps. They match the lecture's algorithm one for one, which makes marking easy.
--- check
int main () {
	int data[] = {0, 84, 22, 19, 10, 3, 17, 6, 5, 9};
	MaxHeap h; h.A = data; h.size = 9;
	for (int i = 0; i < 4; i++) cout << heapExtractMax (&h) << " ";
	cout << "| size " << h.size << " | ";
	MaxHeap e; e.A = data; e.size = 0;
	cout << heapExtractMax (&e) << endl;
	return 0;
}
--- expect
84 22 19 17 | size 5 | -999

=== w-heap-why
topic: heaps
type: proof
marks: 4
minutes: 6
lessons: h2-heapify-build
--- question
(a) Why does `buildMaxHeap` start at index size/2 rather than at size? (b) Explain why, when the loop finishes, the whole array is a max-heap.
--- rubric
1 | (a) Indexes size/2 + 1 to size are leaves (their children would be at 2i > size), and a single leaf is already a heap.
1 | (b) States the invariant: before maxHeapify (i), every node with an index greater than i is the root of a max-heap.
1 | (b) Maintenance: both children of i have larger indexes, so they are roots of heaps, which is exactly what maxHeapify (i) needs; afterwards i is a heap root too.
1 | (b) Termination: when the loop ends, i = 0, so node 1 is the root of a max-heap: the whole array.
--- answer
**(a)** Node i has children at 2i and 2i + 1. For i > size/2, 2i > size, so the node has no children: it is a leaf. A tree of one node is already a max-heap, so there is nothing to fix there.

**(b)** Loop invariant: *at the start of each iteration, every node with an index greater than i is the root of a max-heap.*

- **Initialisation:** at the start, i = size/2, and every node above it is a leaf, so the invariant holds.
- **Maintenance:** the children of i have indexes 2i and 2i + 1, both greater than i, so by the invariant they are roots of max-heaps. That is exactly the condition `maxHeapify (i)` needs, and after the call node i is a max-heap root too. Decreasing i keeps the invariant true.
- **Termination:** the loop stops after i = 1, so node 1, the root of the whole array, is the root of a max-heap.
--- mistakes
- Saying it starts at size/2 "to save time" without saying why those nodes are already heaps.
- Describing the swaps instead of giving the invariant.
--- format
Use the three headings (initialisation, maintenance, termination). They are the standard shape of a loop-invariant argument, and markers look for them.

=== w-hash-linear
topic: hashing
type: trace
marks: 5
minutes: 8
lessons: i1-hash-tables
--- question
A hash table has locations 1 to 12 and h(key) = key % 12 + 1, with linear probing. (a) Insert 27, 39, 15, 51, 20, 63, 8 in that order and show the final table. (b) 15 is then deleted and its location marked -1. Show the locations checked when searching for 51, and explain why the search must not stop at the -1.
--- rubric
1 | 27, 39, 15, 51 and 63 all hash to 4; they go to 4, 5, 6, 7 and 8 by probing forward.
1 | 20 goes to 9 (home), and 8 hashes to 9 and goes to 10.
1 | Final table: 4: 27, 5: 39, 6: 15, 7: 51, 8: 63, 9: 20, 10: 8 (others empty).
1 | (b) The search for 51 checks 4, 5, 6 (-1) and 7, and finds 51 at 7.
1 | (b) A deleted location does not stop a search, because a key inserted after it (like 51) may have probed past that location before it was deleted.
--- answer
**(a)** Homes: 27 % 12 + 1 = 4, 39 → 4, 15 → 4, 51 → 4, 20 → 9, 63 → 4, 8 → 9.

| Key | Home | Locations tried | Placed at |
|---|---|---|---|
| 27 | 4 | 4 | 4 |
| 39 | 4 | 4, 5 | 5 |
| 15 | 4 | 4, 5, 6 | 6 |
| 51 | 4 | 4, 5, 6, 7 | 7 |
| 20 | 9 | 9 | 9 |
| 63 | 4 | 4, 5, 6, 7, 8 | 8 |
| 8 | 9 | 9, 10 | 10 |

Final table: **4: 27, 5: 39, 6: 15, 7: 51, 8: 63, 9: 20, 10: 8**, all other locations empty.

**(b)** After deleting 15, location 6 holds -1. Searching for 51 checks **4** (27), **5** (39), **6** (-1, keep going), **7**: found.

When 51 was inserted, it went past location 6 because 15 was there. If the search stopped at the -1, it would wrongly report that 51 is missing. Only an **empty** location (0) proves the key is not in the table.
--- mistakes
- Using key % 12 without the + 1.
- Stopping the search at the deleted location.
- Placing 8 at 9 (20 is already there).
--- format
A table of homes and probes is the clearest answer and lets the marker check each key separately. Write the final table as location: key pairs.

=== w-hash-compare
topic: hashing
type: explain
marks: 4
minutes: 6
lessons: i2-probing, i3-chaining-strings
--- question
Compare linear probing, quadratic probing and chaining as ways of handling collisions. Mention clustering, deletion, and what happens as the table fills up.
--- rubric
1 | Linear probing tries the next location each time; keys that collide form long runs (primary clustering), so searches slow down as the table fills.
1 | Quadratic probing jumps by growing steps (x + x² in the lectures), which breaks up those runs, but it may not reach every location.
1 | Chaining keeps a linked list at each location, so the table never "fills": lists just get longer, and deleting is ordinary list deletion.
1 | Probing tables need a special deleted marker (-1) so that searches do not stop early; all three are O(1) on average and O(n) in the worst case.
--- answer
- **Linear probing.** On a collision, try the next location (wrapping from N to 1). It is simple, but keys that collide sit next to each other and form long runs (*primary clustering*). A new key that lands anywhere in a run must walk to its end, so inserts and searches slow down as the table fills. Deleting needs the -1 marker so that searches do not stop early.
- **Quadratic probing.** After the x-th collision, move forward x + x² locations (2, 6, 12, …). Keys that collide spread out instead of forming one run, so clustering is reduced. The jumps may skip some locations, so an insert can fail even when the table is not completely full. Deletion still needs the -1 marker.
- **Chaining.** Each location holds a linked list, and a new key goes at the head of its list. The table never runs out of room: the lists just get longer. Deleting is an ordinary list deletion, with no marker needed. It uses extra memory for the nodes.

All three give O(1) average time when keys spread evenly, and O(n) in the worst case, when every key collides.
--- mistakes
- Saying chaining has no worst case: if every key collides, the one list holds all n keys.
- Mixing up quadratic probing's step with double hashing's.
--- format
One short paragraph or bullet per method, using the same three points (clustering, deletion, filling up), then one shared sentence on cost. Parallel structure is easy to mark.

=== w-graph-bfs
topic: graphs
type: trace
marks: 5
minutes: 7
lessons: j3-bfs-dfs
--- question
An undirected graph has edges A–B, A–C, B–D, C–D, C–E, D–F and E–F. Adjacency lists are in alphabetical order. Run breadth-first search from A. Give (a) the order in which vertices are visited and (b) the contents of the queue after each vertex is processed.
--- rubric
1 | Starts by colouring A GREY and enqueuing it.
1 | Processing A enqueues B and C (alphabetical), turning them GREY.
1 | Processing B enqueues D; processing C enqueues E (D is already GREY, so it is not enqueued again).
1 | Processing D enqueues F; E and F add nothing new.
1 | Visit order: A B C D E F.
--- answer
A vertex turns GREY when it is enqueued and BLACK when it has been processed, so no vertex enters the queue twice.

| Process | Neighbours (alphabetical) | Newly enqueued | Queue after |
|---|---|---|---|
| (start) | | A | A |
| A | B, C | B, C | B C |
| B | A, D | D | C D |
| C | A, D, E | E (D is already GREY) | D E |
| D | B, C, F | F | E F |
| E | C, F | none | F |
| F | D, E | none | (empty) |

**(a) Visit order: A B C D E F.** BFS visits the vertices in order of their distance from A: A (0), then B and C (1), then D and E (2), then F (3).
--- mistakes
- Enqueuing D twice (from B and from C): a GREY vertex is already waiting in the queue.
- Using a stack, which gives a depth-first order.
--- format
Use the table, one row per processed vertex. Showing the queue each time earns marks even if one row has a slip.

=== w-graph-dijkstra
topic: graphs
type: trace
marks: 6
minutes: 9
lessons: j4-dijkstra
--- question
A directed graph has edges A→B (4), A→C (1), C→B (2), B→D (1), C→D (5), D→E (3) and C→E (8). Run Dijkstra's algorithm from A. Give the order in which vertices are taken from the priority queue and the final cost and parent of every vertex.
--- rubric
1 | Starts with cost A = 0 and all others ∞ (infinity).
1 | Takes A: C becomes 1 (parent A), B becomes 4 (parent A).
1 | Takes C: B improves to 3 (parent C), D becomes 6 (parent C), E becomes 9 (parent C).
1 | Takes B: D improves to 4 (parent B).
1 | Takes D: E improves to 7 (parent D); then takes E.
1 | Order A, C, B, D, E; final costs A 0, C 1, B 3, D 4, E 7 with parents C←A, B←C, D←B, E←D.
--- answer
Each step takes the vertex with the smallest cost and *relaxes* its outgoing edges: if going through it is cheaper, update the neighbour's cost and parent.

| Take | A | B | C | D | E |
|---|---|---|---|---|---|
| start | 0 | ∞ | ∞ | ∞ | ∞ |
| A | **0** | 4 (A) | 1 (A) | ∞ | ∞ |
| C | | 3 (C) | **1** | 6 (C) | 9 (C) |
| B | | **3** | | 4 (B) | 9 (C) |
| D | | | | **4** | 7 (D) |
| E | | | | | **7** |

Order taken: **A, C, B, D, E**. Final costs and parents: **A 0 (none), C 1 (A), B 3 (C), D 4 (B), E 7 (D)**. The shortest path to E is A → C → B → D → E, cost 1 + 2 + 1 + 3 = 7.
--- mistakes
- Fixing B at 4 when A is taken: a cost is final only when the vertex is taken from the queue.
- Taking vertices in alphabetical order instead of by smallest cost.
- Forgetting to update the parent when a cost improves.
--- format
The cost table with the parent in brackets is the standard answer. Bold the value fixed in each row.

=== w-graph-mst
topic: graphs
type: trace
marks: 5
minutes: 7
lessons: j5-mst
--- question
An undirected graph has edges A–B (3), A–C (1), B–C (7), B–D (5), C–D (2), C–E (6) and D–E (4). Use Kruskal's algorithm to find a minimum-cost spanning tree. List each edge in the order considered, say whether it is added or rejected and why, and give the total cost.
--- rubric
1 | Sorts the edges by weight: A–C 1, C–D 2, A–B 3, D–E 4, B–D 5, C–E 6, B–C 7.
1 | Adds A–C, C–D and A–B (each joins two different trees).
1 | Adds D–E (E joins the tree).
1 | Rejects B–D, C–E and B–C because both ends are already in the same tree (each would make a cycle).
1 | Tree edges A–C, C–D, A–B, D–E: 4 edges for 5 vertices, total cost 10.
--- answer
Sort the edges by weight, then add each edge unless its two ends are already in the same tree.

| Edge | Weight | Decision |
|---|---|---|
| A–C | 1 | add |
| C–D | 2 | add |
| A–B | 3 | add |
| D–E | 4 | add (now all 5 vertices are joined) |
| B–D | 5 | reject: B and D are already in the same tree (cycle) |
| C–E | 6 | reject: same tree |
| B–C | 7 | reject: same tree |

Spanning tree: **A–C, C–D, A–B, D–E**, total cost **1 + 2 + 3 + 4 = 10**. A spanning tree of 5 vertices has 5 − 1 = 4 edges, which is a useful check.
--- mistakes
- Adding B–D, which closes the cycle B–A–C–D–B.
- Stopping before checking that the tree has n − 1 edges.
--- format
Use the table. "Reject: same tree" is the reason a marker wants to see for every rejected edge.

=== w-sort-partition
topic: sorting
type: trace
marks: 4
minutes: 6
lessons: k3-quick-sort
--- question
Run the lecture's `partition (A, 1, 7)` on A = **7 2 9 4 1 8 5** (indexes 1 to 7, pivot x = A[7]). Show the array after each exchange and give the value returned.
--- rubric
1 | Pivot x = 5, i starts at 0, j runs from 1 to 6.
1 | Exchanges for j = 2 (value 2), j = 4 (value 4) and j = 5 (value 1): array 2 4 1 7 9 8 5 with i = 3.
1 | Final exchange of A[i + 1] = A[4] with A[7]: array 2 4 1 5 9 8 7.
1 | Returns 4, the pivot's final index; everything left of it is ≤ 5 and everything right of it is > 5.
--- answer
x = A[7] = 5, i = 0. For j = 1 to 6, if A[j] ≤ x then i = i + 1 and A[i] ↔ A[j].

| j | A[j] | ≤ 5? | Action | Array |
|---|---|---|---|---|
| 1 | 7 | no | | 7 2 9 4 1 8 5 |
| 2 | 2 | yes | i = 1; A[1] ↔ A[2] | 2 7 9 4 1 8 5 |
| 3 | 9 | no | | 2 7 9 4 1 8 5 |
| 4 | 4 | yes | i = 2; A[2] ↔ A[4] | 2 4 9 7 1 8 5 |
| 5 | 1 | yes | i = 3; A[3] ↔ A[5] | 2 4 1 7 9 8 5 |
| 6 | 8 | no | | 2 4 1 7 9 8 5 |

Finally A[i + 1] = A[4] ↔ A[7]: **2 4 1 5 9 8 7**. partition returns **4**: the pivot 5 is in its final sorted place, with smaller values to its left and larger to its right.
--- mistakes
- Starting i at 1 instead of p − 1 = 0.
- Forgetting the final exchange with the pivot.
- Returning i instead of i + 1.
--- format
A table with j, A[j], the test and the array after each row, the same layout as the lecture slides.

=== w-sort-compare
topic: sorting
type: complexity
marks: 5
minutes: 6
lessons: k4-sorting-performance
--- question
Give the best-case and worst-case time complexity of insertion sort, merge sort and quick sort (with the lecture's last-element pivot). For each worst case, describe an input that causes it. Which of the three needs extra arrays proportional to n?
--- rubric
1 | Insertion sort: best O(n) on already sorted input, worst O(n²) on reverse-sorted input.
1 | Merge sort: O(n log n) in every case.
1 | Quick sort: O(n log n) best/average, O(n²) worst.
1 | Quick sort's worst case: already sorted (or reverse-sorted) input, where the last-element pivot splits off only one value each time.
1 | Merge sort needs extra arrays of total size about n for merging.
--- answer
| Sort | Best | Worst | Worst-case input |
|---|---|---|---|
| Insertion | O(n) | O(n²) | reverse-sorted: each value moves past all the values before it |
| Merge | O(n log n) | O(n log n) | none: it always splits in half and merges in O(n) per level |
| Quick (last-element pivot) | O(n log n) | O(n²) | already sorted: each partition leaves n − 1 values on one side |

Merge sort is the one that needs extra arrays: `mergeArray` copies the two halves into temporary arrays, about n values in total. Insertion sort and quick sort rearrange values inside A itself.
--- mistakes
- Giving quick sort's average case as its worst case.
- Saying merge sort is O(n²) in the worst case.
- Saying insertion sort's best case is O(n²): on sorted input each value is compared once and stays put.
--- format
A table is the fastest correct answer. Name the input for each worst case: "sorted input" is worth the mark on its own.

=== w-bigo-loops
topic: bigo
type: complexity
marks: 4
minutes: 5
lessons: l1-performance
--- question
Give the big-O of each fragment in terms of n, with a one-line reason.

```cpp
// (a)
for (int i = 0; i < n; i++)
	for (int j = 0; j < 10; j++)
		count++;
// (b)
for (int i = 1; i < n; i = i * 2)
	count++;
// (c)
for (int i = 0; i < n; i++)
	for (int j = i; j < n; j++)
		count++;
```
--- rubric
1 | (a) O(n): the inner loop runs a constant 10 times for each of the n passes.
1 | (b) O(log n): i doubles each time, so the loop runs about log₂ n times.
1 | (c) O(n²): the inner loop runs n + (n − 1) + … + 1 = n(n + 1)/2 times in total.
1 | Reasons are given in terms of how many times the innermost statement runs.
--- answer
- **(a) O(n).** The inner loop always runs 10 times, a constant, so `count++` runs 10n times. Constants are dropped.
- **(b) O(log n).** i takes the values 1, 2, 4, 8, …, doubling each time, so it reaches n after about log₂ n passes.
- **(c) O(n²).** For i = 0 the inner loop runs n times, for i = 1 it runs n − 1 times, and so on down to 1. The total is n(n + 1)/2, which grows like n².
--- mistakes
- Calling (a) O(n²) because it has two nested loops: the inner loop does not depend on n.
- Calling (c) O(n log n): the triangle of passes still adds up to about n²/2.
--- format
One line per part: the answer first, then the count that justifies it. Writing the sum in (c) shows the working.

=== w-proof-insertion
topic: sorting
type: proof
marks: 5
minutes: 8
lessons: k1-simple-sorts
--- question
Insertion sort processes A[2], A[3], …, A[n] in turn, inserting each into the sorted part to its left. State a loop invariant for the outer loop and use it to argue that insertion sort sorts the array.
--- rubric
1 | Invariant: at the start of the pass for index j, A[1..j−1] holds the values originally in A[1..j−1], in sorted order.
1 | Initialisation: for j = 2, A[1..1] is one value, which is sorted.
2 | Maintenance: the pass shifts the larger values of A[1..j−1] one place right and puts the key in the gap, so A[1..j] is sorted and holds the same values.
1 | Termination: the loop ends with j = n + 1, so A[1..n], the whole array, is sorted.
--- answer
**Invariant.** At the start of the pass for index j, the part A[1..j−1] holds the values that were originally in A[1..j−1], in sorted order.

- **Initialisation.** Before the first pass, j = 2, and A[1..1] is a single value, which is trivially sorted.
- **Maintenance.** The pass takes key = A[j] and moves each value of A[1..j−1] that is larger than key one place to the right, then puts key into the gap. The values left of the gap are ≤ key and the values right of it are > key. So A[1..j] is sorted and holds the same values as before. When j increases by 1, the invariant holds again.
- **Termination.** The loop stops when j = n + 1. By the invariant, A[1..n], the whole array, is sorted and holds the original values. So insertion sort is correct.
--- mistakes
- Stating the invariant as "the array is sorted": it must describe the part that is sorted so far.
- Skipping termination, which is the step that gives the final result.
--- format
Write the invariant in one sentence, then use the headings initialisation, maintenance and termination. Short, precise sentences beat long ones in a proof.
