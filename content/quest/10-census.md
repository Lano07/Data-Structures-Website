# world: sort
title: The Clockwork Census
place: Washington, D.C. (in the professor's journal)
when: 1890
topic: sorting
parts: k, n
scene: census
color: #ffd23f
fragment: The Census Key
blurb: Searching and sorting: sequential and binary search, selection, bubble and insertion sort, merge sort, quick sort, heap sort, and counting and radix sort.

## so-1 | Searching the ledgers
goal: Search with sequential search and binary search, and compare their costs.
lessons: m3-binary-search

@scene The museum of computing machines · a wooden cabinet full of dials
@say narrator: The 1880 United States census took about eight years to count by hand. For 1890, Herman Hollerith's electric tabulating machine read holes punched in cards, and the basic count was done in about a year. His company later became part of IBM.
@say marco: The telegram led here. The professor's last clue is somewhere in these punched cards.
@say you: Thousands of cards. If they're in order, we can search them fast.
@learn Sequential search and binary search
**Sequential search** checks the elements one by one from the start:

```cpp
int sequentialSearch (int A[], int n, int key) {
	for (int i = 0; i < n; i++)
		if (A[i] == key)
			return i;          // found: its index
	return -1;                 // not there
}
```

Best case 1 comparison (the key is first), worst case **n** (last, or missing), average about n / 2: **O(n)**. It works on any array, sorted or not.

**Binary search** needs a **sorted** array. Look at the middle: if the key is smaller, keep only the left half; if bigger, only the right half. Each comparison halves what is left:

```cpp
int binarySearch (int A[], int n, int key) {
	int lo = 0, hi = n - 1;
	while (lo <= hi) {
		int mid = (lo + hi) / 2;
		if (A[mid] == key) return mid;
		if (key < A[mid]) hi = mid - 1;
		else lo = mid + 1;
	}
	return -1;                 // lo passed hi: not there
}
```

At most about **log₂ n + 1** comparisons: **O(log n)**. A million sorted values need at most 20.
@array kind="binsearch" values="4 9 15 22 31 38 46 57 63 71 88" key="57"
Find card **57** with binary search: click the middle card each time (mid = (low + high) / 2, rounded down).
@array kind="binsearch" values="4 9 15 22 31 38 46 57 63 71 88" key="20"
Now search for **20**, which is not there. Keep halving until low passes high.
@type At most how many comparisons does binary search need to search a sorted array of 1,000 values? (Hint: 2¹⁰ = 1,024.)
= 10
>> Each comparison halves the range: 1,000 → 500 → 250 → … → 1 takes about 10 halvings.
@quiz When is sequential search the only choice?
- [ ] When the array is very large
- [x] When the array is not sorted
- [ ] When the key is near the middle
- [ ] Never: binary search always works
>> Binary search depends on the order to throw half away. On unsorted data, every element must be checked.
@relic card | A punched card | Hollerith's cards were about the size of the old US dollar bill. Each hole stood for a fact about one person (age group, sex, place of birth...). The machine sorted cards into bins one column at a time: the same idea as radix sort, digit by digit.
@journal
- Sequential search: O(n), works on unsorted data
- Binary search: sorted data only; halve the range each step: O(log n)
- mid = (lo + hi) / 2; not found when lo > hi

## so-2 | The simple sorters
goal: Trace selection, bubble and insertion sort, and count their work.
lessons: k1-simple-sorts

@scene The sorting hall · three old machines, three different ways
@say marco: Three machines, three ways to sort the same deck. Which one's best?
@say you: For small decks, none of them is great. But we need to know exactly how each one moves the cards.
@learn Selection, bubble and insertion sort
**Selection sort**: for each position i, find the **smallest** value from i to the end and swap it into position i.

```cpp
for (int i = 0; i < n - 1; i++) {
	int smallest = i;
	for (int j = i + 1; j < n; j++)
		if (A[j] < A[smallest])
			smallest = j;
	swap A[i] and A[smallest];
}
```

Always n(n − 1)/2 comparisons, at most n − 1 swaps. **O(n²)** for every input.

**Bubble sort**: compare neighbours `A[j]` and `A[j + 1]` along the array, swapping them when they are out of order. After pass i, the largest unsorted value has "bubbled" to the end. O(n²); with an early stop (no swaps in a pass means sorted), an already sorted array takes only one pass: O(n).

**Insertion sort**: grow a sorted part on the left. Take the next value (the **key**), shift the larger values in the sorted part one place right, and drop the key into the gap.

```cpp
for (int i = 1; i < n; i++) {
	int key = A[i];
	int j = i - 1;
	while (j >= 0 && A[j] > key) {
		A[j + 1] = A[j];
		j = j - 1;
	}
	A[j + 1] = key;
}
```

O(n²) in the worst case (reverse order), but **O(n)** on sorted or nearly sorted data, which makes it great for small or almost-sorted arrays. Bubble and insertion sort are **stable** (equal keys keep their order); the lecture's selection sort is not.
@sort alg="bubble" values="5 1 4 2 8" passes="1"
Be **bubble sort**: do one full pass. At each pair, swap or leave them.
>> After one pass: 1 4 2 5 8. The largest value, 8, is at the end (it was already there), and 5 bubbled up to just before it.
@sort alg="selection" values="29 10 14 37 13" passes="2"
Be **selection sort** for two passes: each pass, click the smallest value in the unsorted part.
>> Pass 1 swaps 10 into index 0; pass 2 swaps 13 into index 1: 10 13 14 37 29.
@sort alg="insertion" values="8 3 5 1 9" passes="3"
Be **insertion sort**: insert the next three values into the sorted part on the left.
>> 3 goes before 8; 5 goes between 3 and 8; 1 goes all the way to the front: 1 3 5 8 9.
@quiz Which simple sort runs in O(n) time on an array that is already sorted?
- [ ] Selection sort
- [x] Insertion sort
- [ ] All three
- [ ] None of them
>> Insertion sort's inner loop stops at once when each key is already bigger than the value before it. Selection sort always scans the rest of the array.
@code ex="sort-insertion"
Write insertion sort.
@journal
- Selection: swap the smallest remaining value into place; always n(n − 1)/2 comparisons
- Bubble: swap out-of-order neighbours; the largest bubbles to the end each pass
- Insertion: shift larger values right, drop the key in; O(n) on sorted data
- All three are O(n²) in the worst case

## so-3 | Divide the cards
goal: Merge sort: split, sort the halves recursively, merge them.
lessons: k2-merge-sort

@scene A mechanical card splitter · two trays, then one
@say narrator: In 1945, the mathematician John von Neumann wrote down merge sort, one of the first programs for a stored-program computer.
@learn Merge sort
**Merge sort** divides and conquers:

1. **Split** the array into two halves.
2. **Sort** each half recursively (a half of one element is already sorted: the base case).
3. **Merge** the two sorted halves into one sorted array.

```cpp
void mergeSort (int A[], int start, int end) {
	if (start < end) {
		int mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid + 1, end);
		mergeArray (A, start, mid, end);
	}
}
```

**Merging** compares the fronts of the two sorted halves and copies the smaller one into a temporary array, until one half runs out; then the rest of the other half is copied. Taking from the left half on a tie keeps merge sort **stable**.

The recursion tree has about log₂ n levels, and each level does O(n) work merging: **O(n log n)** in every case. The cost: an extra array of n elements for merging.
@sort alg="merge" values="2 5 9 | 1 4 6 8"
Merge the two sorted trays: click the smaller front card each time.
>> 1 2 4 5 6 8 9. The right tray runs out after 8, so the 9 left in the other tray is copied in without another comparison.
@predict The recursive splits. What does this print?
```cpp
#include <iostream>
using namespace std;

int depth = 0;

void split (int start, int end) {
	for (int i = 0; i < depth; i++)
		cout << "  ";
	cout << start << ".." << end << endl;
	if (start < end) {
		int mid = (start + end) / 2;
		depth++;
		split (start, mid);
		split (mid + 1, end);
		depth--;
	}
}

int main() {
	split (0, 3);
	return 0;
}
```
>> mergeSort's calls on 4 elements: 0..3 splits into 0..1 and 2..3, and each of those into single elements. The indentation shows the recursion tree.
@quiz What is merge sort's running time on an array that is already sorted?
- [ ] O(n)
- [x] O(n log n)
- [ ] O(n²)
- [ ] O(log n)
>> Merge sort always splits all the way down and merges every level, whatever the order: O(n log n) in the best, average and worst case.
@code ex="sort-merge-array"
Write mergeArray, the merging step.
@journal
- Merge sort: split in half, sort each half recursively, merge
- Merging takes the smaller front; ties from the left keep it stable
- O(n log n) always, but needs an extra array of size n

## so-4 | The pivot
goal: Partition an array and trace quick sort, including its worst case.
lessons: k3-quick-sort

@scene The fastest machine in the hall · it picks one card and splits the deck around it
@say narrator: Tony Hoare invented quick sort in 1959, as a young visiting student in Moscow, while working on sorting words for a machine translation project.
@learn Quick sort and partition
**Quick sort** also divides and conquers, but does its work **before** the recursive calls:

1. **Partition**: pick a **pivot** (the lecture uses the **last** value) and rearrange so everything ≤ pivot is on its left and everything bigger on its right. The pivot is now in its **final** place, q.
2. Sort the left part and the right part recursively. No merge needed.

```cpp
int partition (int A[], int p, int r) {
	int x = A[r];                 // the pivot
	int i = p - 1;                // the end of the "≤ x" region
	for (int j = p; j <= r - 1; j++) {
		if (A[j] <= x) {
			i = i + 1;
			swap A[i] and A[j];
		}
	}
	swap A[i + 1] and A[r];       // the pivot goes between the regions
	return i + 1;
}
```

**Cost**: if partition splits roughly in half, O(n log n), which is the **average**. The **worst** case is when the pivot is always the largest or smallest value: an **already sorted** array with a last-value pivot splits n into n − 1 and 0 every time, giving **O(n²)**. Quick sort sorts in place and is usually the fastest in practice; it is not stable.
@sort alg="partition" values="30 65 10 75 55 90 60"
The lecture's array. Be **partition**: pivot x = 60 (the last value). At each j, does A[j] join the small region?
>> 30, 10 and 55 are ≤ 60 and move left; finally 60 swaps into index 3: 30 10 55 60 65 90 75, q = 3.
@quiz Quick sort (last value as pivot) is given an array that is already sorted. What is its running time?
- [ ] O(n)
- [ ] O(n log n)
- [x] O(n²)
- [ ] O(log n)
>> The pivot is always the largest value, so each partition only peels off one element: n + (n − 1) + … = O(n²).
@type After the partition you just did, which value is guaranteed to be in its final sorted position?
= 60 | the pivot | pivot | A[q] | A[3]
>> The pivot, 60, is at q = 3 for good: everything smaller is on its left and everything bigger on its right, and no value ever crosses it again.
@code ex="sort-partition"
Write partition.
@journal
- Partition (pivot = last value): j scans; values ≤ x swap into the left region; the pivot lands at q = i + 1
- Quick sort: partition, then sort both sides; no merge
- Average O(n log n); worst O(n²) on sorted input (last-value pivot); in place, not stable

## so-5 | The tabulator's trick
goal: Compare all the sorts, and sort integers in O(n) with counting and radix sort.
lessons: k4-sorting-performance, n4-integer-sorting, k5-deep-sorting

@scene Hollerith's sorting box · cards drop into numbered bins
@say silas: (from the doorway) Cards, bins, machines. While you play with antiques, I'm already at the Pitch Lake.
@say marco: Then let's finish this fast.
@learn Comparing the sorts, and sorting without comparing
| Sort | Best | Average | Worst | Stable | Extra space |
|---|---|---|---|---|---|
| Selection | O(n²) | O(n²) | O(n²) | no | O(1) |
| Bubble (with early stop) | O(n) | O(n²) | O(n²) | yes | O(1) |
| Insertion | O(n) | O(n²) | O(n²) | yes | O(1) |
| Merge | O(n log n) | O(n log n) | O(n log n) | yes | O(n) |
| Quick | O(n log n) | O(n log n) | O(n²) | no | O(log n) stack |
| Heap | O(n log n) | O(n log n) | O(n log n) | no | O(1) |

Any sort that works by **comparing** keys needs at least about n log₂ n comparisons in the worst case. Merge sort and heap sort reach that bound.

**Integer sorting** beats it by not comparing at all (course outline topic 1.3):

**Counting sort** (keys 0 to k): count how many times each key appears in C, add the counts up so C[v] says how many keys are ≤ v, then place each key, scanning A from **right to left**, at position C[A[i]] − 1 (and decrease that count). **O(n + k)**, and stable.

**Radix sort** (LSD): run a **stable** counting sort on the **ones** digit, then the **tens**, then the hundreds… With d digits: **O(d(n + 10))**. Hollerith's machine sorted cards exactly like this, one column per pass.
@quiz Which sort is O(n log n) in the worst case AND sorts in place (O(1) extra space)?
- [ ] Merge sort
- [ ] Quick sort
- [x] Heap sort
- [ ] Insertion sort
>> Merge sort needs an extra array; quick sort can degrade to O(n²). Heap sort is O(n log n) always, in place.
@type Radix sort (ones digit first) is sorting 170 45 75 90 802 24 2 66. After the first pass (by the ones digit), which key comes first?
= 170
>> Ones digits: 170→0, 90→0, 802→2, 2→2, 24→4, 45→5, 75→5, 66→6. Keys with digit 0 come first, in their original order (stable): 170, then 90.
@lab id="isort"
Watch counting sort and radix sort in the Integer Sort Lab, then try your own keys.
@quiz Why must radix sort use a STABLE sort for each digit?
- [ ] Stable sorts are faster
- [x] So the order from earlier (lower) digits is kept when later digits are equal
- [ ] Counting sort is the only sort that works on digits
- [ ] It does not need to
>> When two keys have the same tens digit, the ones-digit pass already put them in the right order. A stable sort keeps that order.
@code ex="outline-counting-sort"
Write counting sort.
@say narrator: The last card drops into the last bin. Its holes spell out co-ordinates: 10.23° N, 61.63° W. The Pitch Lake. And a line in the professor's hand: **"I am waiting at the vault. Bring every key. — C.R."**
@say you: She's alive! She's at the vault!
@say marco: Then we sail home. All of us.
@boss
The Chaos Shuffler deals arrays in the worst order for quick sort, and laughs. Beat it with exam-style sorting questions.
@journal
- Comparison sorts need about n log n comparisons; merge and heap sort reach it
- Counting sort O(n + k): count, add up, place right to left (stable)
- Radix sort: stable counting sort per digit, ones first: O(d(n + 10))
