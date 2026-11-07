---
title: How recursion works
summary: A recursive function solves a problem by calling itself on a smaller version of the same problem, until the problem is small enough to answer directly. Every call gets its own copy of the variables, kept in a stack of frames.
lectures: Lectures 2–4
goals:
  - Name the two parts of every recursive function - the base case and the recursive case
  - Trace a recursive call by hand, and draw its recursion tree
  - Explain what the call stack holds while recursion runs
  - Predict the output when work happens before or after the recursive call
  - Write a recursive function with three questions
labs: [recursion, memory]
---

## A function that calls itself

Some problems contain a smaller copy of themselves. Take 4! ("4 factorial"):

- 4! = 4 × 3 × 2 × 1
- and 3 × 2 × 1 is just 3!, so **4! = 4 × 3!**

To work out 4!, you work out 3! and multiply by 4. To work out 3!, you work out 2!, and so on, until you reach 1! = 1, which you simply know.

A function that does this calls itself. That is **recursion**. Every recursive function has two parts:

- **Base case**: the problem is small enough to answer directly. No call is made.
- **Recursive case**: call the function on a smaller problem, then use its answer.

```cpp norun
int factorial (int n) {
	if (n <= 1)                          // base case: 1! is 1
		return 1;
	return n * factorial (n - 1);        // recursive case: n! = n * (n-1)!
}
```

## Following the calls

:::trace
factorial(4) needs factorial(3) → factorial(3) needs factorial(2) → factorial(2) needs factorial(1) → factorial(1) is the base case and returns 1. Then the waiting calls finish in reverse order: factorial(2) returns 2 × 1 = 2, factorial(3) returns 3 × 2 = 6, factorial(4) returns 4 × 6 = 24.
:::

Notice the two directions:

1. **Going down**: each call stops at `factorial (n - 1)` and waits. Nothing is multiplied yet.
2. **Coming back up**: the base case returns, and each waiting call finishes its multiplication, newest first.

## Every call gets its own variables

How can four different values of `n` exist at once? Each call gets a fresh **frame**: a block of memory holding that call's own parameters and local variables. Here is memory at the moment the base case is reached:

```cpp memory at="6" caption="factorial(1) is about to return 1. Four frames of factorial exist at once, each with its own n. The older calls are paused, waiting."
#include <iostream>
using namespace std;

int factorial (int n) {
	if (n <= 1)
		return 1;
	return n * factorial (n - 1);
}

int main() {
	cout << factorial (4) << endl;
	return 0;
}
```

The frames form a **stack** (lesson E1). A call pushes a new frame on top. A return pops the top frame off, and the call underneath carries on from where it stopped. The last call made is the first to finish, which is exactly why the answers come back in reverse order.

:::predict Work before the call and after it. What does f (3) print?
```cpp
#include <iostream>
using namespace std;

void f (int n) {
	if (n == 0)
		return;
	cout << n << " ";
	f (n - 1);
	cout << n << " ";
}

int main() {
	f (3);
	cout << endl;
	return 0;
}
```
:::


:::remember
Changing `n` inside one call does not change `n` in any other call. Each frame has its own copy, just like two calls to any ordinary function.
:::

## Recursion trees

The lectures draw a **recursion tree**: each call is a box, and the calls it makes hang below it. For factorial the tree is a single chain, because each call makes one call. When a function makes two calls, the tree branches:

```cpp example="fib: a function that makes two calls"
#include <iostream>
using namespace std;

int fib (int n) {
	if (n <= 1)
		return n;
	return fib (n - 1) + fib (n - 2);
}

int main() {
	cout << fib (4) << endl;
	return 0;
}
```

Press **Step through** and open the **Call tree** tab. fib(4) calls fib(3) and fib(2); fib(3) calls fib(2) and fib(1); and so on down to the base cases. Count the boxes: 9 calls to get one answer, and fib(2) is worked out twice. A recursion tree shows you how much work a recursive function really does.

## Work before the call, or after it

Code placed **before** the recursive call runs on the way down. Code placed **after** it runs on the way back up, newest call first. The same three lines in a different order give opposite outputs:

```cpp example="Printing before and after the call"
#include <iostream>
using namespace std;

void countDown (int n) {
	if (n == 0)
		return;
	cout << n << " ";        // before the call: runs on the way down
	countDown (n - 1);
}

void countUp (int n) {
	if (n == 0)
		return;
	countUp (n - 1);
	cout << n << " ";        // after the call: runs on the way back up
}

int main() {
	countDown (3);
	cout << endl;
	countUp (3);
	cout << endl;
	return 0;
}
```

countUp(3) cannot print 3 until countUp(2) has finished, and countUp(2) cannot print 2 until countUp(1) has finished. So 1 is printed first. Lecture 3 uses this same trick to print a linked list backwards (lesson D2).

## When the base case is missing

Without a base case, nothing ever stops the calls. Each call adds a frame, and the stack eventually runs out of room. This is a **stack overflow**, and the program crashes (g++ programs usually report "Segmentation fault").

```cpp error
#include <iostream>
using namespace std;

int factorial (int n) {
	return n * factorial (n - 1);    // no base case: the calls never stop
}

int main() {
	cout << factorial (4) << endl;
	return 0;
}
```

The same thing happens when the base case exists but is never reached, for example `factorial (n)` calling `factorial (n)` (the problem never gets smaller), or `factorial (-1)` with a base case of `n == 1` (n moves away from it).

:::mistake
Every recursive call must move **closer** to a base case: `n - 1` towards 0, `top->next` towards NULL, `root->left` towards an empty tree. If you cannot say which base case a call is moving towards, the function is wrong.
:::

## Writing a recursive function: three questions

1. **What is the smallest case, and what is its answer?** That is the base case.
2. **How do I make the problem smaller?** For a number, `n - 1`. For a list, the tail `top->next`. For a tree, the subtrees. For an array, one fewer element.
3. **If the smaller call gives the right answer, how do I build my answer from it?** That is the recursive case.

In question 3, **trust** the smaller call. Do not trace inside it; assume it works and only think about one step. This is not cheating: if the base case is right and each step is right, every call is right (the same idea as proof by induction).

Example: xⁿ (x to the power n).

1. Smallest case: n = 0, and x⁰ = 1.
2. Smaller problem: xⁿ⁻¹.
3. Build the answer: xⁿ = x × xⁿ⁻¹.

```cpp example="power, written with the three questions"
#include <iostream>
using namespace std;

int power (int x, int n) {
	if (n == 0)
		return 1;
	return x * power (x, n - 1);
}

int main() {
	cout << power (2, 10) << endl;
	cout << power (3, 4) << endl;
	cout << power (7, 0) << endl;
	return 0;
}
```

## Recursion or a loop?

Anything recursion can do, a loop can also do. Recursion is the natural choice when the data itself is recursive: a list is a node followed by a smaller list, and a tree is a root with two smaller trees. That is why so much of this course is written recursively.

The cost: each call uses a frame, so a recursion that goes n calls deep needs memory for n frames. A loop reuses the same variables. For very long lists, the loop version is the safer one.

:::teachback
Explain the two parts every recursive function needs, and what happens on the call stack while `factorial (3)` runs.
>> A base case: a problem small enough to answer without another call.
>> A recursive case: call the function on a smaller problem, then use its answer.
>> Each call gets its own frame with its own n; each call waits for the one it made.
>> factorial(3) calls factorial(2), which calls factorial(1); that returns 1, then 2 × 1 = 2 and 3 × 2 = 6 come back in reverse order as the frames are popped.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int f (int n) {
	if (n <= 0)
		return 0;
	return n + f (n - 2);
}

int main() {
	cout << f (7) << endl;
	return 0;
}
```
- [ ] `28`
- [x] `16`
- [ ] `15`
- [ ] `7`
>> f(7) = 7 + f(5) = 7 + 5 + f(3) = 7 + 5 + 3 + f(1) = 7 + 5 + 3 + 1 + f(−1). f(−1) is a base case (n ≤ 0) and returns 0, so the total is 16.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

void g (int n) {
	if (n == 0)
		return;
	cout << n;
	g (n - 1);
	cout << n;
}

int main() {
	g (3);
	cout << endl;
	return 0;
}
```
- [ ] `321321`
- [ ] `123321`
- [x] `321123`
- [ ] `333222111`
>> The first `cout` runs on the way down: 3, 2, 1. The second runs on the way back up, newest call first: 1, 2, 3. Together: 321123.
:::

:::quiz
`factorial (5)` from this lesson is called from main. When the base case is reached, how many frames of factorial are on the stack?
- [ ] 1
- [ ] 4
- [x] 5
- [ ] 6
>> One frame per call: factorial(5), (4), (3), (2) and (1). main's frame is also there, but it is not a factorial frame.
:::

:::quiz
What is wrong with this function?
```cpp norun
int sum (int n) {
	if (n == 0)
		return 0;
	return n + sum (n);
}
```
- [ ] The base case should return 1
- [ ] It should use a loop instead
- [x] The recursive call does not make the problem smaller, so the base case is never reached
- [ ] Nothing, it returns 0 + 1 + … + n
>> `sum (n)` calls `sum (n)` again with the same n. The calls never get closer to 0, so the stack overflows. It should be `sum (n - 1)`.
:::
