# world: rec
title: The Pyramid Within
place: Chichén Itzá, Mexico
when: 9th–12th century
topic: recursion
parts: d
scene: chichen
color: #ff9a3c
fragment: The Serpent Key
blurb: Recursion: base cases, recursive cases, the call stack, recursion trees, and recursive list and array functions.

## rec-1 | The temple inside the temple
goal: Write a recursive function with a base case and a recursive case.
lessons: d1-how-recursion-works

@scene Yucatán Peninsula, Mexico · El Castillo, the Temple of Kukulcán
@say marco: Ninety-one steps on each side. Four sides. Plus the platform on top.
@say you: 4 × 91 + 1 = 365. One for every day of the year.
@say narrator: In the 1930s, archaeologists found an older pyramid hidden inside El Castillo. In 2016, scans found a third, smaller one inside that. A pyramid inside a pyramid inside a pyramid.
@say prof: (journal) *To open the outer temple, you must open the one inside it, and to open that, the one inside that, until you reach one so small it simply opens. That is recursion.*
@learn Recursion: a function that calls itself
A **recursive** function solves a problem by solving a **smaller copy** of the same problem. Every recursive function needs two parts:

1. A **base case**: a problem so small the answer is known straight away. No recursive call.
2. A **recursive case**: break the problem into a smaller one, call the function on it, and use the answer.

```cpp
int factorial (int n) {
	if (n <= 1)                       // base case
		return 1;
	return n * factorial (n - 1);     // recursive case: a smaller n
}
```

`factorial(4)` = 4 × `factorial(3)` = 4 × 3 × `factorial(2)` = 4 × 3 × 2 × `factorial(1)` = 4 × 3 × 2 × 1 = 24.

**How it really runs: the call stack.** Each call gets its own **frame** on the stack, with its own copy of n. `factorial(4)` waits while `factorial(3)` runs, which waits while `factorial(2)` runs, and so on. When the base case returns, the frames return one by one, **last in, first out**, each finishing its multiplication.

Every recursive call must move **towards the base case**. If it never gets there, the stack fills up: a **stack overflow**.
@order Put the recursive sum 1 + 2 + … + n together.
int sumTo (int n) {
	if (n == 0)
		return 0;
	return n + sumTo (n - 1);
}
~ 	return sumTo (n);
~ 	return n + sumTo (n + 1);
>> Base case first (the sum up to 0 is 0), then the recursive case on a smaller n. `sumTo(n)` would never shrink, and `n + 1` moves away from the base case.
@predict The temple's mechanism. What does this print?
```cpp
#include <iostream>
using namespace std;

int power (int base, int exp) {
	if (exp == 0)
		return 1;
	return base * power (base, exp - 1);
}

int main() {
	cout << power (2, 5) << " " << power (3, 3) << " " << power (7, 0) << endl;
	return 0;
}
```
>> power(2, 5) is 2 × 2 × 2 × 2 × 2 = 32, power(3, 3) = 27, and anything to the power 0 is the base case: 1.
@memory Step through factorial(4) and watch the frames pile up on the stack, then come back down.
```cpp
#include <iostream>
using namespace std;

int factorial (int n) {
	if (n <= 1)
		return 1;
	int rest = factorial (n - 1);
	return n * rest;
}

int main() {
	int f = factorial (4);
	cout << f << endl;
	return 0;
}
```
@type How many calls does `factorial(5)` make in total, counting the first one?
= 5
>> factorial(5), (4), (3), (2) and (1): five calls. factorial(1) is the base case and makes no call.
@quiz What happens if a recursive function has no base case?
- [ ] It returns 0
- [ ] The compiler refuses it
- [x] It calls itself forever, until the stack runs out (a stack overflow)
- [ ] It runs once and stops
>> Without a base case nothing stops the calls. Each one adds a frame to the stack until there is no room left.
@relic jaguar | The red jaguar throne | Inside the hidden inner pyramid, the 1930s excavators found a stone throne carved as a jaguar, painted red, with spots of inlaid jade and eyes of jade. It had been sealed in the dark for about a thousand years.
@journal
- Recursion = base case (answer known, no call) + recursive case (a smaller version of the problem)
- Each call gets its own frame on the call stack; they return last in, first out
- Every call must move towards the base case, or the stack overflows

## rec-2 | Tracing the descent
goal: Trace recursive calls, and predict what prints before and after the call.
lessons: d1-how-recursion-works, d4-deep-recursion

@scene The inner staircase · narrow, steep, dark
@say marco: Down we go. And then back up the same way.
@say you: That's the trick of tracing: some work happens on the way down, some on the way back up.
@learn Before the call, or after it?
Where you put the work decides the **order**:

```cpp
void down (int n) {
	if (n == 0) return;
	cout << n << " ";      // BEFORE the call: on the way down
	down (n - 1);
}

void up (int n) {
	if (n == 0) return;
	up (n - 1);
	cout << n << " ";      // AFTER the call: on the way back up
}
```

`down(3)` prints `3 2 1`. `up(3)` prints `1 2 3`: each call waits for the smaller one to finish before printing, so the smallest prints first.

A **recursion tree** draws each call as a box with its calls underneath. For a function that calls itself twice (like Fibonacci), the tree branches, and the number of calls can explode:

`fib(n) = fib(n - 1) + fib(n - 2)`, with `fib(0) = 0` and `fib(1) = 1`. fib(5) makes **15** calls; fib(30) makes over 2.6 million.
@predict What does this print?
```cpp
#include <iostream>
using namespace std;

void glyph (int n) {
	if (n == 0)
		return;
	cout << n << " ";
	glyph (n - 1);
	cout << n << " ";
}

int main() {
	glyph (3);
	cout << endl;
	return 0;
}
```
>> Each call prints n on the way down AND on the way back up: 3 2 1 on the way down, then 1 2 3 as the calls return.
@predict Converting to binary with recursion. What does this print?
```cpp
#include <iostream>
using namespace std;

void binary (int n) {
	if (n < 2) {
		cout << n;
		return;
	}
	binary (n / 2);
	cout << n % 2;
}

int main() {
	binary (13);
	cout << endl;
	return 0;
}
```
>> 13 → 6 rem 1, 6 → 3 rem 0, 3 → 1 rem 1, and 1 is the base case. The remainders print after the calls return, so in reverse order: 1101.
@type How many calls does `fib(4)` make in total (fib(n) = fib(n-1) + fib(n-2), with fib(0) and fib(1) as base cases)?
= 9
>> fib(4) calls fib(3) and fib(2). fib(3) makes 5 calls (itself, fib(2) with its two calls, and fib(1)); fib(2) makes 3. Total 1 + 5 + 3 = 9.
@quiz `void f(int n) { if (n == 0) return; f(n - 1); cout << n; }` What does f(4) print?
- [ ] 4321
- [x] 1234
- [ ] 4
- [ ] 0
>> The print is after the recursive call, so it happens on the way back up: the deepest call (n = 1) prints first.
@journal
- Work before the recursive call happens on the way down; work after it happens on the way back up
- Printing after the call reverses the order (binary digits come out right)
- A recursion tree shows every call; two calls per level (Fibonacci) can explode exponentially

## rec-3 | Recursive roads
goal: Write list functions recursively: print, size, occurs, getLast, insertSorted.
lessons: d2-recursion-lists

@scene A carved frieze · a row of serpents, each biting the tail of the next
@say you: Each serpent holds the next one. It's a linked list.
@say marco: And you're going to tell me lists are recursive too.
@learn A list is a node followed by a smaller list
Every list is either **empty** (NULL) or **a node followed by a shorter list** (`top->next`). That is a recursive definition, so list functions write themselves recursively:

```cpp
void printListRec (Node * top) {
	if (top == NULL)               // base case: the empty list
		return;
	cout << top->data << " ";
	printListRec (top->next);      // the rest of the list
}

int sizeRec (Node * top) {
	if (top == NULL)
		return 0;
	return 1 + sizeRec (top->next);
}

int occursRec (Node * top, int key) {
	if (top == NULL)
		return 0;
	return (top->data == key ? 1 : 0) + occursRec (top->next, key);
}

Node * getLastRec (Node * top) {
	if (top == NULL || top->next == NULL)   // empty, or this IS the last node
		return top;
	return getLastRec (top->next);
}
```

**insertSorted, recursively** (the lecture's version): if the list is empty or n belongs before the first node, the new node goes here; otherwise insert into the rest and reattach:

```cpp
Node * insertSortedRec (Node * top, int n) {
	if (top == NULL || n < top->data) {
		Node * newNode = createNode (n);
		newNode->next = top;
		return newNode;
	}
	top->next = insertSortedRec (top->next, n);
	return top;
}
```

**Two lists at once.** isEqual, recursively: two empty lists are equal; if only one is empty, or the first values differ, they are not; otherwise compare the rests:

```cpp
bool isEqualRec (Node * a, Node * b) {
	if (a == NULL && b == NULL) return true;
	if (a == NULL || b == NULL) return false;
	if (a->data != b->data) return false;
	return isEqualRec (a->next, b->next);
}
```

Moving the print in printListRec to **after** the recursive call prints the list **backwards**.
@fill Finish sizeRec.
```cpp
int sizeRec (Node * top) {
	if (top == [[NULL]])
		return [[0]];
	return [[1]] + sizeRec ([[top->next]]);
}
```
>> An empty list has size 0; otherwise one node plus the size of the rest.
@predict Printing a list backwards with recursion. What does this print?
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

void printBack (Node * top) {
	if (top == NULL)
		return;
	printBack (top->next);
	cout << top->data << " ";
}

int count (Node * top, int key) {
	if (top == NULL)
		return 0;
	return (top->data == key ? 1 : 0) + count (top->next, key);
}

int main() {
	Node c = {5, NULL};
	Node b = {3, &c};
	Node a = {5, &b};
	printBack (&a);
	cout << endl << count (&a, 5) << endl;
	return 0;
}
```
>> printBack prints each node after the rest of the list has been printed: 5 3 5 backwards is 5 3 5 (it is a palindrome!). 5 occurs twice.
@quiz What is the base case of getLastRec?
- [ ] top == NULL only
- [x] top == NULL, or top->next == NULL (this node is the last one)
- [ ] top->data == 0
- [ ] There is no base case: it loops
>> If the list is empty there is no last node (return NULL); if top->next is NULL, top itself is the last node.
@code ex="rec-occurs"
Write occursRec: how many times does key appear in the list?
@journal
- A list is empty (NULL) or a node followed by a smaller list: recursion fits perfectly
- Base case: `top == NULL`. Recursive case: work on `top`, recurse on `top->next`
- getLastRec stops when `top->next == NULL`; insertSortedRec returns the new top of each sublist

## rec-4 | Glyph rows
goal: Recurse over arrays with an index, and solve the Tower of Hanoi.
lessons: d3-recursion-arrays

@scene The Great Ball Court · stone rings high on the walls
@say marco: Rows of carved glyphs on the walls. Hundreds of them.
@say you: Then we read them with recursion. One glyph, then the rest of the row.
@learn Recursion on arrays: carry the index
An array has no "rest of the list" pointer, so recursive array functions carry an **index** (or a range):

```cpp
void printArrayRec (int A[], int i, int n) {
	if (i == n)                  // base case: past the end
		return;
	cout << A[i] << " ";
	printArrayRec (A, i + 1, n); // the rest of the array
}

int sumRange (int A[], int lo, int hi) {   // sum of A[lo..hi]
	if (lo > hi)
		return 0;
	return A[lo] + sumRange (A, lo + 1, hi);
}
```

**Binary search**, recursively: look at the middle; if the key is smaller, search the left half, else the right half. Each call halves the range, so it takes O(log n) calls.

```cpp
int binarySearch (int A[], int lo, int hi, int key) {
	if (lo > hi)
		return -1;                          // not found
	int mid = (lo + hi) / 2;
	if (A[mid] == key) return mid;
	if (key < A[mid]) return binarySearch (A, lo, mid - 1, key);
	return binarySearch (A, mid + 1, hi, key);
}
```

**The Tower of Hanoi**: move n disks from peg A to peg C, one at a time, never a big disk on a small one. Recursively: move n − 1 disks out of the way to B, move the biggest to C, then move the n − 1 disks from B onto it. It takes **2ⁿ − 1** moves.
@predict What does this print?
```cpp
#include <iostream>
using namespace std;

int maxRec (int A[], int n) {
	if (n == 1)
		return A[0];
	int rest = maxRec (A, n - 1);
	return A[n - 1] > rest ? A[n - 1] : rest;
}

int sumRange (int A[], int lo, int hi) {
	if (lo > hi)
		return 0;
	return A[lo] + sumRange (A, lo + 1, hi);
}

int main() {
	int G[6] = {7, 2, 9, 4, 1, 6};
	cout << maxRec (G, 6) << " " << sumRange (G, 1, 3) << endl;
	return 0;
}
```
>> maxRec compares the last element with the max of the rest: 9. sumRange adds G[1] + G[2] + G[3] = 2 + 9 + 4 = 15.
@array kind="binsearch" values="3 8 12 19 24 31 40 52 67" key="40"
The glyphs are in order. Find 40 with binary search: click the middle element at each step.
@order The moves that take 2 disks from peg A to peg C (using B).
Move the small disk from A to B
Move the big disk from A to C
Move the small disk from B to C
~ Move the big disk from A to B
>> Move the n − 1 = 1 small disk out of the way, move the big one, then put the small one back on top. 2² − 1 = 3 moves.
@type How many moves does the Tower of Hanoi take with 5 disks?
= 31
>> 2⁵ − 1 = 31. Each extra disk doubles the moves and adds one.
@code ex="rec-binary-search"
Write recursive binary search.
@journal
- Array recursion carries an index or a range: base case past the end (`i == n` or `lo > hi`)
- Binary search halves the range each call: O(log n)
- Tower of Hanoi: move n − 1 aside, move the biggest, move n − 1 back: 2ⁿ − 1 moves

## rec-5 | When recursion goes wrong
goal: Spot missing base cases and exploding calls, and know when to use a loop instead.
lessons: d4-deep-recursion

@scene Equinox · sunset on El Castillo
@say narrator: Twice a year, at the equinoxes, the setting sun throws triangles of light down the northern staircase: a serpent of light slithering down to the carved serpent head at the bottom.
@say silas: Beautiful, isn't it? I let you do the hard work. Now hand me the serpent key.
@say marco: You again! How did you get here?
@say silas: I followed the trail of your mistakes. Your friend's journal warns about recursion with no way out. I've set a little trap below.
@learn Three ways recursion fails
**1. No base case, or a base case it never reaches.** `int f(int n) { return n + f(n - 1); }` has no base case. `f(n)` with a base case of `n == 0` but called with `n - 2` from an odd number skips past 0 forever. Both end in a **stack overflow**.

**2. Not getting smaller.** `return f(n);` or `f(n + 1)` towards a base case at 0 never arrives.

**3. Doing the same work over and over.** The naive Fibonacci recomputes the same values exponentially many times: O(2ⁿ) calls. A loop does it in O(n):

```cpp
int fibLoop (int n) {
	int a = 0, b = 1;
	for (int i = 0; i < n; i++) {
		int t = a + b;
		a = b;
		b = t;
	}
	return a;
}
```

**Recursion or a loop?** Recursion is natural for things that are recursive in shape (trees, divide and conquer like merge sort and quick sort, backtracking). A loop is better when there is one simple chain of steps and the recursion would be very deep, because each call costs stack space.

Run this program: it has no base case, and the runner stops it when the stack runs out.

```cpp
#include <iostream>
using namespace std;

int countdown (int n) {
	cout << n << " ";
	return countdown (n - 1);   // no base case!
}

int main() {
	countdown (3);
	return 0;
}
```
@quiz `int f(int n) { if (n == 0) return 0; return 1 + f(n - 2); }` What happens with f(5)?
- [ ] It returns 3
- [ ] It returns 2
- [x] It never reaches 0 (5, 3, 1, −1, …): a stack overflow
- [ ] It returns 0
>> Stepping down by 2 from an odd number skips over 0. The base case should be `n <= 0`.
@quiz Why is the recursive fib(40) so slow?
- [ ] Recursion is always slow in C++
- [x] It recomputes the same smaller values again and again: about 2ⁿ calls
- [ ] It runs out of memory
- [ ] The base case is wrong
>> fib(40) calls fib(39) and fib(38); fib(39) calls fib(38) again, and so on. The work roughly doubles with each n. A loop needs only n steps.
@fill Fix the trap: give `countdown` a base case so countdown(3) prints `3 2 1` and stops.
```cpp
#include <iostream>
using namespace std;

void countdown (int n) {
	if (n [[== 0|<= 0|< 1]])
		return;
	cout << n << " ";
	countdown (n - 1);
}

int main() {
	countdown (3);
	cout << endl;
	return 0;
}
```
>> Stop when n reaches 0. Each call moves one step closer, so the base case is always reached.
@say narrator: The trap disarms with a soft click. A stone slides away beneath the serpent's head, revealing a jade disc carved with a ship and three words: **THE SILVER LOCKS**.
@say you: Silver locks... the Panama Canal! Workers there were paid in silver.
@say marco: And Silas?
@say pip: Squawk! Stack overflow! Stack overflow!
@say narrator: Below, Silas is trapped in an endless spiral staircase of his own making, going round and round. By the time he finds the way out, the Kiskadee is gone.
@boss
The Stack Overflow rises from the pyramid's depths: a recursion with no base case. Beat it with exam-style recursion questions.
@journal
- Missing or unreachable base case → stack overflow; every call must get closer
- Naive Fibonacci is O(2ⁿ) because it repeats work; a loop is O(n)
- Use recursion for recursive shapes (trees, divide and conquer); loops for long simple chains
