---
title: Loops
summary: Loops repeat statements. while repeats as long as a condition is true, for is a while loop with its counter built in, and do-while always runs at least once. Most loops follow a handful of patterns - count, add up, search, and read until a sentinel.
lectures: COMP 1602/1603 review
goals:
  - Write while, for and do-while loops, and trace them by hand
  - Use the counting, summing, searching and sentinel patterns
  - Write nested loops and count how many times the inner loop runs
  - Use break and continue, and avoid off-by-one and infinite loops
labs: [memory]
---

## while

```cpp norun
while (condition) {
	// the body: repeated as long as the condition is true
}
```

The condition is checked **before** each pass. If it is false at the start, the body never runs. Something in the body must eventually make the condition false, or the loop never ends.

```cpp example="Counting with while"
#include <iostream>
using namespace std;

int main() {
	int i = 1;
	while (i <= 5) {
		cout << i << " ";
		i++;
	}
	cout << endl << "after the loop, i is " << i << endl;
	return 0;
}
```

When i reaches 6 the test `i <= 5` fails and the loop stops, so i is 6 afterwards. Step through it and watch i change.

## for

A counting loop has three parts: start the counter, test it, and update it. `for` puts all three on one line:

```cpp norun
for (int i = 0; i < n; i++) {
	// runs with i = 0, 1, 2, ..., n - 1
}
```

It means exactly the same as:

```cpp norun
int i = 0;
while (i < n) {
	// body
	i++;
}
```

`for (int i = 0; i < n; i++)` runs **n times**, with i from 0 to n − 1. This is the standard loop over an array of n elements (lesson A7). A counter declared inside the `for` only exists inside the loop.

## do-while

```cpp norun
do {
	// body
} while (condition);
```

The test comes **after** the body, so the body always runs at least once. It suits "ask, then check the answer" input loops. Note the semicolon after the condition.

## Four loop patterns

Almost every loop you will write is one of these:

```cpp example="Count, sum, search and sentinel" stdin="12 7 30 7 -1"
#include <iostream>
using namespace std;

int main() {
	// sentinel: read numbers until -1 (the sentinel) is entered
	int value;
	int count = 0, sum = 0, sevens = 0;
	cin >> value;
	while (value != -1) {
		count++;                      // count
		sum = sum + value;            // sum
		if (value == 7)
			sevens++;                 // count the ones that match
		cin >> value;                 // read the next value at the END of the body
	}
	cout << count << " values, total " << sum << ", " << sevens << " sevens" << endl;

	// search: stop as soon as the answer is known
	int n = 91;
	int divisor = 2;
	while (divisor < n && n % divisor != 0)
		divisor++;
	if (divisor < n)
		cout << n << " is divisible by " << divisor << endl;
	else
		cout << n << " is prime" << endl;
	return 0;
}
```

The sentinel loop reads the first value **before** the loop and each next value at the **end** of the body. That way the sentinel (−1) is tested before it can be counted.

You will see the same patterns in every data structure: a list traversal is a loop that runs while `curr != NULL`; `contains` is a search loop; `size` is a counting loop.

## Nested loops

A loop inside a loop runs the whole inner loop once for **every** pass of the outer loop:

```cpp example="A nested loop"
#include <iostream>
using namespace std;

int main() {
	int steps = 0;
	for (int row = 1; row <= 4; row++) {
		for (int col = 1; col <= row; col++) {
			cout << "* ";
			steps++;
		}
		cout << endl;
	}
	cout << steps << " stars" << endl;
	return 0;
}
```

The inner loop runs 1, then 2, then 3, then 4 times: 10 stars in total. With n rows that is 1 + 2 + … + n = n(n + 1)/2, which grows like n². That count is exactly why selection, bubble and insertion sort are O(n²) (lessons K1 and L1).

## break and continue

- `break` leaves the loop immediately.
- `continue` skips the rest of this pass and goes on to the next one (in a `for` loop, the update still happens).

```cpp norun
for (int i = 0; i < n; i++) {
	if (A[i] < 0)
		continue;           // skip negative values
	if (A[i] == key)
		break;              // found it: stop looking
	...
}
```

## Two classic mistakes

**Off by one.** `for (int i = 0; i <= n; i++)` runs n + 1 times, and with an array of n elements, `A[n]` is outside the array. Check the first and last values your counter takes.

**The loop that never ends.** If nothing in the body moves towards making the condition false, the loop runs forever:

```cpp error
#include <iostream>
using namespace std;

int main() {
	int i = 0;
	while (i < 5)
		cout << i << endl;      // i never changes
	return 0;
}
```

Without braces, only the **first** statement after `while (…)` is the body. Here that is the `cout`, so i never increases. This site stops runaway programs and tells you why.

:::predict What does this program print?
```cpp
#include <iostream>
using namespace std;

int main() {
	for (int i = 1; i <= 3; i++) {
		for (int j = 1; j <= i; j++)
			cout << j;
		cout << " ";
	}
	cout << endl;
	return 0;
}
```
:::


:::remember
- `while`: test first. `do-while`: body first, at least once.
- `for (int i = 0; i < n; i++)` runs n times, i = 0 to n − 1.
- Sentinel loop: read before the loop, and again at the end of the body.
- A loop inside a loop multiplies the work.
:::

:::teachback
Explain how a sentinel loop works, and why it reads one value before the loop and the next value at the end of the loop body.
>> It keeps reading values until a special value (the sentinel, such as -1) is read.
>> Reading before the loop means the condition can test the very first value.
>> Reading at the end of the body means each new value is tested before it is used.
>> So the sentinel is never counted or added to the total.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int main() {
	int total = 0;
	for (int i = 1; i <= 10; i++) {
		if (i % 3 == 0)
			continue;
		if (i > 7)
			break;
		total += i;
	}
	cout << total << endl;
	return 0;
}
```
- [ ] `55`
- [ ] `28`
- [x] `19`
- [ ] `22`
>> It skips multiples of 3 (3 and 6) and stops when i reaches 8. It adds 1 + 2 + 4 + 5 + 7 = 19.
:::

:::quiz
How many times does `cout` run?
```cpp norun
for (int i = 0; i < 5; i++)
	for (int j = 0; j < 4; j++)
		cout << i * j;
```
- [ ] 9
- [x] 20
- [ ] 25
- [ ] 16
>> The inner loop runs 4 times for each of the 5 outer passes: 5 × 4 = 20.
:::

:::quiz
What is the value of k after this loop?
```cpp norun
int k = 1;
while (k < 100)
	k = k * 3;
```
- [ ] 81
- [x] 243
- [ ] 100
- [ ] 99
>> k takes the values 1, 3, 9, 27, 81, 243. At 81 the test is still true, so k becomes 243, and then 243 < 100 is false.
:::
