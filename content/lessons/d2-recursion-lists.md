---
title: Recursion on linked lists
summary: A list is either empty, or a head node followed by a smaller list (the tail). So a recursive list function handles the empty list, deals with the head, and lets a recursive call deal with the tail. This lesson writes every recursive list function from Lectures 2–4.
lectures: Lectures 2–4
goals:
  - See a list as "empty, or a head plus a tail" and find the tail with top->next
  - Write printListRec, and print a list backwards by moving one line
  - Write sizeRec, occursRec, containsRec and getLast recursively, with their cases
  - Write isEqualRec, insertSortedRec and the recursive merge
  - Use the pattern top->next = f (top->next) to change a list recursively
labs: [recursion, lists]
---

## A list contains a smaller list

Look at any list from its first node. What follows the first node is also a list, just one node shorter:

:::diagram list 250 23 17 4
The list 250 → 23 → 17 → 4. Its **head** is 250. Its **tail**, starting at `top->next`, is the list 23 → 17 → 4.
:::

So every list is one of two things:

1. **Empty**: `top == NULL`. This is the base case.
2. **A head and a tail**: the head is `top->data`, and the tail is the list starting at `top->next`.

That gives the shape of every recursive list function in the lectures: handle the empty list, deal with the head, and pass `top->next` to a recursive call for the tail. Each call gets a list one node shorter, so the calls always reach NULL.

## printListRec

Lecture 2's cases:

- (1) `top` is NULL: the list is empty. Do nothing and return.
- (2) `top` is not NULL: (a) display the value at the head, (b) call the function recursively with the tail.

```cpp norun
void printListRec (Node * top) {
	if (top == NULL)
		return;
	cout << top->data << endl;
	printListRec (top->next);
}
```

:::trace
printListRec(250…) prints 250 and calls with the tail → prints 23 and calls → prints 17 and calls → prints 4 and calls printListRec(NULL), which just returns. Output: 250, 23, 17, 4.
:::

### Printing backwards: move one line

Lecture 3's "new version" swaps the last two lines:

```cpp norun
void printListRec (Node * top) {
	if (top == NULL)
		return;
	printListRec (top->next);        // print the whole tail first...
	cout << top->data << endl;       // ...then the head
}
```

Now each call prints its head only **after** the rest of the list has been printed. The deepest call (the node holding 4) prints first, so the output is 4, 17, 23, 250. This is the "work after the call runs on the way back up" rule from lesson D1.

## sizeRec

Cases from Lecture 3:

- (1) Empty list: return 0.
- (2) Not empty: (a) the head is 1 node, (b) find the size of the tail recursively, (c) add them.

```cpp norun
int sizeRec (Node * top) {
	if (top == NULL)
		return 0;
	return 1 + sizeRec (top->next);
}
```

:::trace
For 250 → 23 → 17 → 4 the recursion tree is a chain: sizeRec(NULL) returns 0, then the calls return 1 + 0 = 1, 1 + 1 = 2, 1 + 2 = 3 and finally 1 + 3 = 4.
:::

## occursRec and containsRec

occursRec counts how many nodes hold `key`. If the head holds the key, add 1 to the count for the tail; otherwise add 0.

```cpp norun
int occursRec (Node * top, int key) {
	if (top == NULL)
		return 0;
	if (top->data == key)
		return 1 + occursRec (top->next, key);
	return occursRec (top->next, key);
}
```

containsRec answers yes or no, so it can stop as soon as it finds the key:

```cpp norun
bool containsRec (Node * top, int key) {
	if (top == NULL)
		return false;
	if (top->data == key)
		return true;
	return containsRec (top->next, key);
}
```

Notice the two base cases in containsRec: the empty list (the key is not here) and a matching head (found it, stop).

## getLast, recursively

Lecture 3 starts from a buggy loop: walking until `last == NULL` always returns NULL, because it walks off the end. The recursive version uses three cases:

- (1) `top` is NULL: the list is empty. Return `top` (NULL).
- (2) `top->next` is NULL: the list has one node, and it is the last. Return `top`.
- (3) Otherwise: find the last node of the tail recursively and return it.

```cpp norun
Node * getLast (Node * top) {
	if (top == NULL || top->next == NULL)
		return top;
	return getLast (top->next);
}
```

The lecture combines cases (1) and (2) with `||`. The order matters: `top == NULL` is tested first, so `top->next` is only read when `top` is a real node.

## Trying them out

```cpp example="Recursive list functions from Lectures 2 and 3"
#include <iostream>
using namespace std;

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

void printListRec (Node * top) {
	if (top == NULL)
		return;
	cout << top->data << " ";
	printListRec (top->next);
}

void printReverse (Node * top) {
	if (top == NULL)
		return;
	printReverse (top->next);
	cout << top->data << " ";
}

int sizeRec (Node * top) {
	if (top == NULL)
		return 0;
	return 1 + sizeRec (top->next);
}

int occursRec (Node * top, int key) {
	if (top == NULL)
		return 0;
	if (top->data == key)
		return 1 + occursRec (top->next, key);
	return occursRec (top->next, key);
}

bool containsRec (Node * top, int key) {
	if (top == NULL)
		return false;
	if (top->data == key)
		return true;
	return containsRec (top->next, key);
}

Node * getLast (Node * top) {
	if (top == NULL || top->next == NULL)
		return top;
	return getLast (top->next);
}

int main() {
	Node * top = createNode (250);
	top->next = createNode (23);
	top->next->next = createNode (17);
	top->next->next->next = createNode (23);
	printListRec (top);
	cout << endl;
	printReverse (top);
	cout << endl;
	cout << "size: " << sizeRec (top) << endl;
	cout << "23 occurs " << occursRec (top, 23) << " times" << endl;
	cout << "contains 17? " << containsRec (top, 17) << endl;
	cout << "contains 99? " << containsRec (top, 99) << endl;
	cout << "last: " << getLast (top)->data << endl;
	return 0;
}
```

Step through it and open the **Call tree** tab: each list function makes one call per node, so its tree is a single chain.

## isEqualRec: two lists at once

Lecture 4 compares two lists with five cases:

1. Both lists are empty: return true.
2. Only the second is empty: return false.
3. Only the first is empty: return false.
4. The heads differ: return false.
5. The heads are equal: return isEqual (tail of top1, tail of top2).

```cpp norun
bool isEqualRec (Node * top1, Node * top2) {
	if (top1 == NULL && top2 == NULL)
		return true;
	if (top1 == NULL || top2 == NULL)
		return false;
	if (top1->data != top2->data)
		return false;
	return isEqualRec (top1->next, top2->next);
}
```

The order of the tests is the whole trick. Once "both NULL" has been ruled out, "either NULL" means exactly one list ran out first, so the lists have different lengths. And only after both NULL tests is it safe to read `top1->data` and `top2->data`.

## Changing a list recursively

Printing and counting only read the list. To **change** it, a recursive function returns the (possibly new) top of the list it was given, and the caller stores that answer in its own `next` field.

### insertSortedRec

Lecture 4's two cases:

1. The list is empty, or `n` is smaller than the head: the new node goes in front. Return it as the new top.
2. Otherwise `n` belongs somewhere in the tail. Insert it into the tail recursively, reconnect the tail, and return `top` (unchanged).

```cpp norun
Node * insertSortedRec (Node * top, int n) {
	if (top == NULL || n < top->data) {
		Node * newNode = createNode (n);
		newNode->next = top;
		return newNode;              // new top
	}
	top->next = insertSortedRec (top->next, n);
	return top;                      // top unchanged
}
```

The line `top->next = insertSortedRec (top->next, n);` says: "insert into my tail, and whatever the top of my tail is now, link to it." Most calls return the same tail top they were given, so most of these assignments change nothing. Exactly one call (the one where case 1 happens) returns a new node, and the call above it links that node in.

:::why
Why must the result be stored? If you write only `insertSortedRec (top->next, n);`, the new node is created and correctly points into the list, but no node points **to** it. It is unreachable: lost from the list and leaked.
:::

### Merging two sorted lists

Lecture 3's cases:

- top2 is NULL: the second list is empty. Return top1.
- top1 is NULL: the first list is empty. Return top2.
- head of top1 ≤ head of top2: merge the tail of top1 with top2, attach the result to top1, and return top1.
- head of top1 > head of top2: merge top1 with the tail of top2, attach the result to top2, and return top2.

```cpp norun
Node * mergeRec (Node * top1, Node * top2) {
	if (top2 == NULL)
		return top1;
	if (top1 == NULL)
		return top2;
	if (top1->data <= top2->data) {
		top1->next = mergeRec (top1->next, top2);
		return top1;
	}
	top2->next = mergeRec (top1, top2->next);
	return top2;
}
```

Each call picks the smaller head, so the smallest value comes first, and links it to the merge of everything that is left. No new nodes are made: the existing nodes are relinked into one sorted list.

### The same pattern deletes

The pattern `top->next = f (top->next); return top;` works for any change in the middle of a list. Here it deletes the first node holding `key`:

```cpp norun
Node * deleteKeyRec (Node * top, int key) {
	if (top == NULL)
		return NULL;                     // key not found
	if (top->data == key) {
		Node * rest = top->next;
		delete top;
		return rest;                     // the tail replaces the deleted node
	}
	top->next = deleteKeyRec (top->next, key);
	return top;
}
```

Compare this with the loop version in lesson C4: there is no `prev` pointer and no special case for deleting the first node. The caller's `next` field (or `top` in main) plays the part of `prev`.

```cpp example="insertSortedRec, mergeRec and deleteKeyRec"
#include <iostream>
using namespace std;

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

void printListRec (Node * top) {
	if (top == NULL) {
		cout << endl;
		return;
	}
	cout << top->data << " ";
	printListRec (top->next);
}

Node * insertSortedRec (Node * top, int n) {
	if (top == NULL || n < top->data) {
		Node * newNode = createNode (n);
		newNode->next = top;
		return newNode;
	}
	top->next = insertSortedRec (top->next, n);
	return top;
}

Node * mergeRec (Node * top1, Node * top2) {
	if (top2 == NULL)
		return top1;
	if (top1 == NULL)
		return top2;
	if (top1->data <= top2->data) {
		top1->next = mergeRec (top1->next, top2);
		return top1;
	}
	top2->next = mergeRec (top1, top2->next);
	return top2;
}

Node * deleteKeyRec (Node * top, int key) {
	if (top == NULL)
		return NULL;
	if (top->data == key) {
		Node * rest = top->next;
		delete top;
		return rest;
	}
	top->next = deleteKeyRec (top->next, key);
	return top;
}

int main() {
	Node * a = NULL;
	a = insertSortedRec (a, 20);
	a = insertSortedRec (a, 5);
	a = insertSortedRec (a, 30);
	a = insertSortedRec (a, 10);
	printListRec (a);

	Node * b = NULL;
	b = insertSortedRec (b, 15);
	b = insertSortedRec (b, 4);
	printListRec (b);

	Node * merged = mergeRec (a, b);
	printListRec (merged);

	merged = deleteKeyRec (merged, 4);
	merged = deleteKeyRec (merged, 20);
	printListRec (merged);
	return 0;
}
```

:::parsons Put the lines of sizeRec in order.
int sizeRec (Node * top) {
	if (top == NULL)
		return 0;
	return 1 + sizeRec (top->next);
}
~	return sizeRec (top->next);
:::


:::remember
A recursive function that reads a list returns an answer (a count, true or false, a node). A recursive function that changes a list returns the top of the changed list, and every caller stores it: `top->next = f (top->next)`, and in main, `top = f (top)`.
:::

:::teachback
Explain why moving one line makes `printListRec` print the list backwards.
>> In the backwards version the recursive call on `top->next` comes before the `cout`.
>> So each call prints its own value only after the whole rest of the list has been printed.
>> The deepest call (the last node) prints first, and the waiting calls print as they finish, in reverse order.
:::

:::quiz
The list is 3 → 8 → 1. What does this print?
```cpp check
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

void show (Node * top) {
	if (top == NULL)
		return;
	show (top->next);
	cout << top->data << " ";
	if (top->next != NULL)
		show (top->next->next);
}

int main() {
	Node * c = new Node; c->data = 1; c->next = NULL;
	Node * b = new Node; b->data = 8; b->next = c;
	Node * a = new Node; a->data = 3; a->next = b;
	show (a);
	cout << endl;
	return 0;
}
```
- [ ] `1 8 3`
- [x] `1 8 3 1`
- [ ] `3 8 1`
- [ ] `1 8 1 3`
>> show(3…) first calls show(8…), which calls show(1…), which prints 1. Back in show(8…): print 8, then show(8's next's next) is show(NULL), nothing. Back in show(3…): print 3, then show(3's next's next) is show(1…), which prints 1. Output: 1 8 3 1.
:::

:::quiz
In isEqualRec, why is `if (top1 == NULL && top2 == NULL)` tested before `if (top1 == NULL || top2 == NULL)`?
- [ ] It is faster
- [x] Otherwise two empty lists would make the `||` test true and return false, even though they are equal
- [ ] Because `&&` must always come before `||`
- [ ] The order does not matter
>> Two empty lists are equal. If the `||` test came first, it would be true for them and return false. Testing "both empty" first leaves the `||` test to catch only the case where exactly one list has run out.
:::

:::quiz
Someone writes insertSortedRec's last two lines as `insertSortedRec (top->next, n); return top;`. What happens when 25 is inserted into 10 → 20 → 30?
- [ ] It works the same way
- [ ] The program crashes
- [x] The list is still 10 → 20 → 30; the new node points to 30 but nothing points to it
- [ ] 25 is inserted at the front
>> The call that reaches 30 creates the node 25 → 30 and returns it, but the call holding 20 throws the answer away instead of storing it in `20->next`. The new node is unreachable, and its memory is leaked.
:::

:::quiz
Which recursive call can make getLast run forever (or crash) on a non-empty list?
- [ ] `return getLast (top->next);`
- [x] `return getLast (top);`
- [ ] Both are fine
- [ ] Neither, getLast is not recursive
>> `getLast (top)` passes the same list again, so the problem never gets smaller and the base case is never reached. Passing `top->next` makes the list one node shorter each time.
:::
