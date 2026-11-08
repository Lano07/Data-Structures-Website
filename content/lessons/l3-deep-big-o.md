---
title: "Deep dive: big-O from first principles"
summary: Big-O is a precise statement, not a vibe. This deep dive gives the formal definition, the rules that follow from it, the loop patterns you will be asked to analyse (including the shrinking loop that looks like n log n but is O(n)), recurrences, best, worst and average cases, and space complexity, so you can justify every cost in the course.
lectures: Lectures 11, 14, 19–21 (deep dive)
goals:
  - State the formal definition of big-O and prove a bound by finding c and n₀
  - Apply the rules (constants, lower-order terms, sums, products, log bases) correctly
  - Analyse loops - single, nested, triangular, halving, n log n and shrinking - by counting iterations
  - Tell best, worst and average cases apart, and count space, including recursion depth
labs: [sort, bst]
---

## The definition

:::def Big-O
f(n) is **O(g(n))** if there are positive constants c and n₀ such that f(n) ≤ c·g(n) for every n ≥ n₀.
:::

In words: from some point on, f grows **no faster** than a constant multiple of g. Big-O is an **upper bound**.

:::example Proving 3n² + 5n + 2 is O(n²)
We want 3n² + 5n + 2 ≤ c·n². Try c = 4: we need n² − 5n − 2 ≥ 0. At n = 6, 36 − 30 − 2 = 4 ≥ 0, and the left side only grows after that. So c = 4 and n₀ = 6 work, and 3n² + 5n + 2 = O(n²). (Any larger c works too, with a smaller n₀.)
:::

Two related symbols are worth knowing: **Ω(g)** is a lower bound (f grows **at least** as fast as g), and **Θ(g)** is a tight bound (both O and Ω). Insertion sort is O(n²), and also O(n³), but O(n³) is useless. When an exam asks for "the big-O", it wants the **tightest** bound, as in Lecture 21's list.

## The rules, and why they hold

| Rule | Example | Why |
|---|---|---|
| Drop constant factors | 5n = O(n) | Choose c = 5 in the definition |
| Keep only the fastest-growing term | n² + 100n + 7 = O(n²) | For n ≥ 1, 100n + 7 ≤ 107n² |
| Sum: steps one after another | O(n) then O(n²) → O(n²) | The bigger term dominates |
| Product: a loop inside a loop | n iterations × O(log n) each → O(n log n) | Multiply the counts |
| The base of a log does not matter | log₂ n = log₁₀ n / log₁₀ 2 | Logs in different bases differ by a constant factor |
| Different inputs stay separate | n values and m edges → O(n + m), not O(n) | You cannot drop m unless you know m ≤ n |

## Counting loops: the patterns

Analysing code means counting how many times the innermost statement runs.

| Pattern | Count | Big-O |
|---|---|---|
| `for (i = 0; i < n; i++)` | n | O(n) |
| Two nested loops, each to n | n × n | O(n²) |
| Inner loop from j = i + 1 to n (selection sort) | (n − 1) + (n − 2) + … + 1 = n(n − 1)/2 | O(n²) |
| `for (i = 1; i < n; i = i * 2)` | about log₂ n | O(log n) |
| A loop to n, with a halving loop inside | n × log₂ n | O(n log n) |
| `for (m = n; m >= 1; m = m / 2)` with an inner loop to m | n + n/2 + n/4 + … < 2n | **O(n)** |
| A loop to n, then a separate loop to n | n + n | O(n) |

:::trap The shrinking loop is O(n), not O(n log n)
An outer loop that runs log n times **does not** make the total n log n if the inner loop shrinks each time. Add up the actual work: n + n/2 + n/4 + … is a geometric series that never reaches 2n. The same idea makes buildMaxHeap O(n) (Part H).
:::

```cpp example="Counting the loop patterns"
#include <iostream>
using namespace std;

long long single (int n) { long long c = 0; for (int i = 0; i < n; i++) c++; return c; }
long long triangle (int n) { long long c = 0; for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) c++; return c; }
long long halving (int n) { long long c = 0; for (int i = 1; i < n; i = i * 2) c++; return c; }
long long nLogN (int n) { long long c = 0; for (int i = 0; i < n; i++) for (int j = 1; j < n; j = j * 2) c++; return c; }
long long shrinking (int n) { long long c = 0; for (int m = n; m >= 1; m = m / 2) for (int j = 0; j < m; j++) c++; return c; }

int main () {
	int sizes[] = {16, 1024};
	for (int s = 0; s < 2; s++) {
		int n = sizes[s];
		cout << "n = " << n << ": single " << single (n) << ", triangle " << triangle (n) << ", halving " << halving (n)
		     << ", n log n " << nLogN (n) << ", shrinking " << shrinking (n) << endl;
	}
	return 0;
}
```

Going from n = 16 to n = 1024 multiplies n by 64. The single loop grows ×64, the triangle about ×4,000 (that is 64²), the halving loop only from 4 to 10, and the shrinking loop ×64, like the single loop, because it is O(n).

## How big the differences really are

| n | log₂ n | n log₂ n | n² | 2ⁿ |
|---|---|---|---|---|
| 10 | 3.3 | 33 | 100 | 1,024 |
| 1,000 | 10 | 10,000 | 1,000,000 | a 302-digit number |
| 1,000,000 | 20 | 20,000,000 | 10¹² | — |

At a billion simple steps a second, sorting a million values with an O(n²) sort takes about 17 minutes; an O(n log n) sort takes 0.02 seconds. That gap is why the course spends three lectures on sorting.

## Recursive code: write a recurrence

For recursive functions, count the work of one call plus the recursive calls (Part D):

| Recurrence | Solution | Example |
|---|---|---|
| T(n) = T(n − 1) + c | O(n) | sizeRec, printListRec |
| T(n) = T(n − 1) + c·n | O(n²) | quick sort's worst case |
| T(n) = T(n/2) + c | O(log n) | binary search, one path down a balanced BST |
| T(n) = 2T(n/2) + c | O(n) | a traversal of a balanced tree |
| T(n) = 2T(n/2) + c·n | O(n log n) | merge sort |

## Best, worst and average cases

:::def Three different questions
- **Worst case:** the most work on any input of size n. It is a guarantee, so it is what "the big-O" usually means.
- **Best case:** the least work on any input of size n. It is rarely useful on its own.
- **Average case:** the expected work over all inputs (or random choices).
:::

| Operation | Best | Average | Worst |
|---|---|---|---|
| Sequential search | O(1): first element | about n/2 → O(n) | O(n) |
| BST search | O(1): at the root | O(log n) for random insertions | O(n): degenerate |
| Insertion sort | O(n): sorted | O(n²) | O(n²) |
| Quick sort | O(n log n) | O(n log n) | O(n²) |
| Hash table search | O(1) | O(1) at a low load factor | O(n): everything collides |

:::trap "Best case" means the best input, not the smallest n
"The best case is n = 1" is wrong: every algorithm is fast when n = 1. The best case is the most favourable **arrangement** of n values, such as a sorted array for insertion sort.
:::

## Space complexity

Space complexity counts the **extra** memory an algorithm needs, beyond its input, as n grows. Recursion counts, because every active call holds a stack frame:

- Reversing a list with a loop: O(1) extra. Printing it backwards with recursion: O(n) stack frames.
- Merge sort: O(n) for the copies. Heap sort: O(1). Quick sort: O(log n) stack on average.
- An adjacency matrix: O(V²). Adjacency lists: O(V + E).

:::quiz
What is the tight big-O of this code? `for (int i = 1; i < n; i = i * 2) for (int j = 0; j < i; j++) count++;`
- [ ] O(log n)
- [x] O(n)
- [ ] O(n log n)
- [ ] O(n²)
>> The inner loop runs i times, and i takes the values 1, 2, 4, … up to just under n. The total 1 + 2 + 4 + … is less than 2n, so it is O(n), even though the outer loop runs log n times.
:::

:::quiz
Function A is O(n²) and function B is O(n log n). Which statement is definitely true?
- [ ] B is faster than A for every n
- [ ] A is faster than B for small n
- [x] For large enough n, B's running time is at most a constant times n log n, which eventually grows slower than n²
- [ ] A and B take the same time when n = 1
>> Big-O describes growth for large n, up to constant factors. It says nothing certain about small n (B could have a huge constant), and nothing exact at any particular n.
:::

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

int main () {
	int n = 32;
	int a = 0, b = 0, c = 0;
	for (int i = 0; i < n; i++)
		for (int j = 0; j < i; j++)
			a++;
	for (int i = n; i > 1; i = i / 2)
		b++;
	for (int i = 0; i < n; i++)
		for (int k = 1; k < n; k = k * 2)
			c++;
	cout << a << " " << b << " " << c << endl;
	return 0;
}
```
:::

:::teachback
Explain how to prove from the definition that 3n² + 5n + 2 is O(n²), and what c and n₀ mean.
>> Big-O means there are constants c and n₀ with f(n) ≤ c·g(n) for every n ≥ n₀.
>> With c = 4, we need 3n² + 5n + 2 ≤ 4n², that is n² − 5n − 2 ≥ 0, which is true from n₀ = 6 on.
>> c absorbs the constant factors, and n₀ lets us ignore small inputs, where lower-order terms can dominate.
:::

:::remember
- f = O(g): f(n) ≤ c·g(n) for all n ≥ n₀. An upper bound; give the tightest one.
- Drop constants and lower-order terms; sums take the larger term, nested loops multiply; log bases do not matter; keep separate inputs (n + m).
- Loops: n; n²; n(n − 1)/2; log n (doubling); n log n; shrinking n + n/2 + … = O(n).
- Recurrences: T(n−1)+c → n; T(n/2)+c → log n; 2T(n/2)+cn → n log n; T(n−1)+cn → n².
- Best case = best input of size n; worst case = the guarantee. Recursion depth counts as space.
:::
