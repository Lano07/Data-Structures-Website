---
title: Matrices with special properties
summary: An n × n matrix normally needs n² cells. When most entries are zero, or half of them repeat the other half, you can store only the entries that matter in a 1-D array and still reach any entry in O(1) time with an index formula.
lectures: Course outline topic 8 (Lecture 1 lists it; not yet in the notes)
outline: true
goals:
  - Store lower-triangular, upper-triangular and symmetric matrices in a 1-D array of n(n + 1)/2 values
  - Work out the 1-D index of entry (i, j) with a formula, and explain where the formula comes from
  - Store a tridiagonal (band) matrix in 3n − 2 values
  - Represent a sparse matrix as (row, column, value) triplets and say when it saves memory
labs: [matrix]
---

## Why store a matrix differently?

Lecture 1 lists *matrices with special properties* among the data structures this course covers, and the course outline asks you to store and manipulate *symmetric, triangular, band and sparse* matrices efficiently.

A plain `int M[100][100]` uses 10,000 cells. But many real matrices have a **pattern**:

- half of the entries are always zero (a **triangular** matrix);
- half of the entries copy the other half (a **symmetric** matrix, like the adjacency matrix of an undirected graph in Lecture 16);
- only the entries near the diagonal can be non-zero (a **band** matrix);
- almost every entry is zero, with no pattern at all (a **sparse** matrix).

The idea is always the same: keep only the entries that can be non-zero, packed into a 1-D array, and use a formula to find where entry (i, j) lives. In this lesson rows and columns are numbered from **0**, as in C++ arrays.

## Lower-triangular matrices

A matrix is **lower triangular** when every entry above the main diagonal is zero: `M[i][j] == 0` whenever `j > i`.

```
row 0:  a  0  0  0
row 1:  b  c  0  0
row 2:  d  e  f  0
row 3:  g  h  i  j
```

Row 0 has 1 entry worth keeping, row 1 has 2, row 2 has 3, and so on. For an n × n matrix that is 1 + 2 + … + n = **n(n + 1)/2** values instead of n². Store them **row by row** in a 1-D array `L`:

```
L:   a  b  c  d  e  f  g  h  i  j
     0  1  2  3  4  5  6  7  8  9
```

Where does row i start? Before it come rows 0 to i − 1, holding 1 + 2 + … + i = i(i + 1)/2 values. Entry (i, j) is j places further along, so:

**index(i, j) = i(i + 1)/2 + j**, for j ≤ i.

Check: entry (3, 1) is `h`. 3 × 4 / 2 + 1 = 7, and `L[7]` is `h`.

```cpp example="Lower-triangular matrix stored in a 1-D array"
#include <iostream>
using namespace std;

const int N = 4;

int lowerIndex (int i, int j) {
	return i * (i + 1) / 2 + j;
}

int getLower (int L[], int i, int j) {
	if (j > i)
		return 0;                         // above the diagonal: always zero
	return L[lowerIndex (i, j)];
}

void setLower (int L[], int i, int j, int value) {
	if (j <= i)
		L[lowerIndex (i, j)] = value;
}

int main () {
	int L[N * (N + 1) / 2];                // 10 cells instead of 16
	int next = 1;
	for (int i = 0; i < N; i++)
		for (int j = 0; j <= i; j++) {
			setLower (L, i, j, next);
			next++;
		}
	for (int i = 0; i < N; i++) {
		for (int j = 0; j < N; j++)
			cout << getLower (L, i, j) << " ";
		cout << endl;
	}
	cout << "(3, 1) is stored at index " << lowerIndex (3, 1) << endl;
	return 0;
}
```

Reading or writing any entry is O(1): one multiplication, one division and one addition. Only the memory changes: n(n + 1)/2 instead of n².

## Upper-triangular matrices

An **upper-triangular** matrix has zeros *below* the diagonal: `M[i][j] == 0` whenever `i > j`. The easiest trick is to store it **column by column**: column j holds j + 1 values (rows 0 to j), so it is the lower-triangular formula with i and j swapped:

**index(i, j) = j(j + 1)/2 + i**, for i ≤ j.

## Symmetric matrices

A matrix is **symmetric** when `M[i][j] == M[j][i]` for every i and j. The adjacency matrix of an **undirected** graph (Lecture 16) is symmetric: if A is joined to B, then B is joined to A. So is a table of road distances between towns.

Store only the lower triangle. To read entry (i, j) with j > i, read (j, i) instead:

```cpp example="A symmetric matrix: store half, read all"
#include <iostream>
using namespace std;

int lowerIndex (int i, int j) {
	return i * (i + 1) / 2 + j;
}

int getSym (int S[], int i, int j) {
	if (j > i) {                           // above the diagonal: use the mirror entry
		int t = i;
		i = j;
		j = t;
	}
	return S[lowerIndex (i, j)];
}

int main () {
	// the undirected graph A-B, B-C, C-D, A-D as a symmetric adjacency matrix (lower triangle only)
	//          (0,0) (1,0) (1,1) (2,0) (2,1) (2,2) (3,0) (3,1) (3,2) (3,3)
	int S[] = {  0,    1,    0,    0,    1,    0,    1,    0,    1,    0 };
	char name[] = {'A', 'B', 'C', 'D'};
	for (int i = 0; i < 4; i++) {
		cout << name[i] << ":";
		for (int j = 0; j < 4; j++)
			cout << " " << getSym (S, i, j);
		cout << endl;
	}
	return 0;
}
```

:::quiz
A lower-triangular 5 × 5 matrix is stored row by row in a 1-D array, with rows and columns numbered from 0. At which index is entry (4, 2)?
- [ ] 10
- [x] 12
- [ ] 14
- [ ] 22
>> Rows 0 to 3 hold 1 + 2 + 3 + 4 = 10 values, so row 4 starts at index 4 × 5 / 2 = 10. Entry (4, 2) is 2 further on: 10 + 2 = 12.
:::

## Band matrices: the tridiagonal case

In a **band** matrix, only the entries close to the main diagonal can be non-zero. The most common one is **tridiagonal**: `M[i][j]` can be non-zero only when |i − j| ≤ 1, that is on the main diagonal and the diagonals just above and below it.

```
a b 0 0 0
c d e 0 0
0 f g h 0
0 0 i j k
0 0 0 l m
```

Row 0 has 2 entries, the last row has 2, and every other row has 3: **3n − 2** values in all. Store them row by row. For i ≥ 1, the rows before row i hold 2 + 3(i − 1) = 3i − 1 values, so row i starts at index 3i − 1, and its first entry is in column i − 1. Entry (i, j) is therefore at (3i − 1) + (j − (i − 1)), which simplifies to one formula (row 0, starting at index 0 with column 0, fits it too):

**index(i, j) = 2i + j**, for |i − j| ≤ 1.

Check: entry (2, 3) is `h`, the 8th value (index 7): 2 × 2 + 3 = 7.

```cpp
#include <iostream>
using namespace std;

const int N = 5;

int bandIndex (int i, int j) {
	return 2 * i + j;
}

int getBand (int B[], int i, int j) {
	if (i - j > 1 || j - i > 1)
		return 0;                         // outside the band
	return B[bandIndex (i, j)];
}

int main () {
	int B[3 * N - 2];                      // 13 cells instead of 25
	for (int k = 0; k < 3 * N - 2; k++)
		B[k] = k + 1;
	for (int i = 0; i < N; i++) {
		for (int j = 0; j < N; j++)
			cout << getBand (B, i, j) << "\t";
		cout << endl;
	}
	return 0;
}
```

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

int lowerIndex (int i, int j) {
	return i * (i + 1) / 2 + j;
}

int bandIndex (int i, int j) {
	return 2 * i + j;
}

int main () {
	cout << lowerIndex (2, 2) << " " << lowerIndex (3, 0) << endl;
	cout << bandIndex (1, 0) << " " << bandIndex (4, 4) << endl;
	return 0;
}
```
:::

## Sparse matrices

A **sparse** matrix is mostly zeros, with the non-zero entries anywhere. Think of a 1,000 × 1,000 matrix of who has emailed whom in a company: a million cells, but perhaps only 8,000 non-zero.

Store only the non-zero entries, each as a **triplet** (row, column, value), in an array of structs, sorted by row and then by column (the order a row-by-row scan meets them):

```cpp example="Sparse matrix as triplets"
#include <iostream>
using namespace std;

struct Term {
	int row;
	int col;
	int value;
};

const int ROWS = 4;
const int COLS = 5;

// copy the non-zero entries of M into T (row by row); returns how many there are
int toTriplets (int M[ROWS][COLS], Term T[]) {
	int t = 0;
	for (int i = 0; i < ROWS; i++)
		for (int j = 0; j < COLS; j++)
			if (M[i][j] != 0) {
				T[t].row = i;
				T[t].col = j;
				T[t].value = M[i][j];
				t++;
			}
	return t;
}

int getSparse (Term T[], int t, int i, int j) {
	for (int k = 0; k < t; k++)
		if (T[k].row == i && T[k].col == j)
			return T[k].value;
	return 0;                             // not stored, so it is zero
}

int main () {
	int M[ROWS][COLS] = {
		{0, 0, 3, 0, 0},
		{0, 0, 0, 0, 0},
		{7, 0, 0, 0, 1},
		{0, 0, 0, 9, 0}
	};
	Term T[ROWS * COLS];
	int t = toTriplets (M, T);
	cout << t << " non-zero entries:" << endl;
	for (int k = 0; k < t; k++)
		cout << "(" << T[k].row << ", " << T[k].col << ", " << T[k].value << ")" << endl;
	cout << "M[2][4] = " << getSparse (T, t, 2, 4) << ", M[1][1] = " << getSparse (T, t, 1, 1) << endl;
	return 0;
}
```

**Does it save memory?** Each triplet costs 3 ints. With t non-zero entries in an r × c matrix, triplets win when 3t < rc, that is when fewer than a third of the entries are non-zero. The email matrix needs 24,000 ints instead of 1,000,000.

**The price:** finding entry (i, j) now means searching the triplets: O(t) with a scan, or O(log t) with a binary search, because the triplets are sorted by (row, column).

:::quiz
A 200 × 300 matrix has 15,000 non-zero entries. Is the triplet representation smaller than the plain 2-D array?
- [ ] Yes: any matrix with zeros in it is smaller as triplets
- [x] Yes: 45,000 ints instead of 60,000
- [ ] No: 45,000 ints is more than 15,000
- [ ] No: triplets always need more memory
>> The plain array needs 200 × 300 = 60,000 ints. The triplets need 3 × 15,000 = 45,000, so they still win, but only just: a quarter of the entries are non-zero, and the break-even point is a third.
:::

## Summary

| Matrix | Entries kept (n × n) | Where (i, j) lives |
|---|---|---|
| Lower triangular | n(n + 1)/2 | i(i + 1)/2 + j, for j ≤ i |
| Upper triangular | n(n + 1)/2 | j(j + 1)/2 + i, for i ≤ j |
| Symmetric | n(n + 1)/2 | the lower formula, after swapping so that j ≤ i |
| Tridiagonal | 3n − 2 | 2i + j, when i and j differ by at most 1 |
| Sparse (t non-zeros) | 3t | search the triplets |

Try them in the [Matrix Lab](#lab-matrix): click any cell and watch the formula find it in the 1-D array.

:::parsons Put the lines of getLower in order.
int getLower (int L[], int i, int j) {
	if (j > i)
		return 0;
	return L[lowerIndex (i, j)];
}
~	if (i > j)
~	return L[i * j];
:::

:::teachback
Explain where the formula i(i + 1)/2 + j comes from for a lower-triangular matrix stored row by row.
>> Row k of a lower-triangular matrix holds k + 1 values (columns 0 to k).
>> The rows before row i hold 1 + 2 + … + i = i(i + 1)/2 values, so row i starts at that index.
>> Entry (i, j) is j places into its row, so its index is i(i + 1)/2 + j.
:::

:::remember
- Triangular and symmetric: n(n + 1)/2 values; (i, j) at i(i + 1)/2 + j (lower, row by row).
- Symmetric: store one triangle; swap i and j if (i, j) is in the other half.
- Tridiagonal: 3n − 2 values; (i, j) at 2i + j.
- Sparse: (row, column, value) triplets; worth it when under a third of the entries are non-zero.
:::
