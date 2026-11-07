---
title: Hash tables
summary: A hash table works out where a key belongs from the key itself, so a search goes straight to the right location instead of looking through everything. When two keys want the same location (a collision), linear probing tries the next location.
lectures: Lectures 14–15
goals:
  - Explain why hashing can search in constant time when arrays, lists and trees cannot
  - Compute h = key % 12 + 1 and place keys in a table with locations 1 to 12
  - Say what a collision is, and resolve it with linear probing in a circular table
  - Search a linear-probing table, and know exactly when to stop
  - Delete with a "deleted" marker, and explain why the location cannot just be emptied
labs: [hash]
---

## Can a search take constant time?

Lecture 14 lists how long a search takes in each structure so far:

| Structure | Search |
|---|---|
| Arrays | O(n) |
| Linked lists | O(n) |
| Binary trees | O(n) |
| Binary search trees | O(log₂ n) |
| Heaps | O(n) |

Every one of these **looks for** the key, comparing keys until it finds the right one. Then the lecture asks: "Is it possible to have a data structure where searching for a key takes O(1) or constant time?"

The idea of hashing: **work out** where a key is stored from the key itself. Then a search does not look around; it goes straight to that location.

## The hash function

A **hash function**, h, converts a key to a valid location in an array. When an array is used this way, it is called a **hashtable**. The lecture's table has locations 1 to 12 and uses

**h = key % 12 + 1**

- `key % 12` is the remainder when the key is divided by 12, so it is between 0 and 11.
- Adding 1 moves that into the range 1 to 12. (Location 0 is not used, just as in a heap.)

Where will 52 go? 52 = 4 × 12 + 4, so 52 % 12 = 4, and h = 4 + 1 = **5**. Location 5 is empty, so 52 is placed there.

:::diagram hash linear 12
52
An empty table with locations 1 to 12, after inserting 52.
:::

The table must start out with a value that means **empty** in every location. If the keys are positive integers, 0 can be used.

The next three keys go straight into empty locations:

| Key | key % 12 + 1 | Location |
|---|---|---|
| 33 | 33 % 12 + 1 = 9 + 1 | 10 |
| 84 | 84 % 12 + 1 = 0 + 1 | 1 |
| 43 | 43 % 12 + 1 = 7 + 1 | 8 |

## Collisions

Now insert 16: 16 % 12 + 1 = 5. But location 5 already holds 52. Two different keys hash to the same location. This is a **collision**.

Collisions cannot be avoided. There are far more possible keys than locations (16, 28, 40, 52 and 64 all hash to 5), so some keys must share a home location. Every hash table needs a rule for where the second key goes. The lecture lists four rules:

- **Linear probing** (this lesson)
- Chaining (lesson I3)
- Quadratic probing, and linear probing with double hashing (lesson I2)

## Linear probing

**Linear probing**: if the location is taken, try the next one (location = location + 1), and keep going until you find an empty location.

- 16 hashes to 5, which is taken. Try 6: empty. **16 goes to 6.**
- 59 hashes to 59 % 12 + 1 = 12. Empty, so 59 goes to 12.
- 31 hashes to 31 % 12 + 1 = 8, which holds 43. Collision! Try 9: empty. **31 goes to 9.**
- 23 hashes to 23 % 12 + 1 = 12, which holds 59. The next location after 12 is... there is no 13. The table is treated as **circular**, so after 12 comes 1. Location 1 holds 84, so try 2: empty. **23 goes to 2.**
- 61 hashes to 61 % 12 + 1 = 2, which now holds 23. Try 3: empty. **61 goes to 3.**

:::diagram hash linear 12
52 33 84 43 16 59 31 23 61
The table after inserting 52, 33, 84, 43, 16, 59, 31, 23 and 61 with linear probing (Lecture 14).
:::

:::exam
For an insertion question, write the arithmetic for every key, like "31 → 8 (43) → 9". Each arrow is one collision. It keeps your work checkable, and a mistake early on is easy to spot.
:::

## Inserting, in C++

The table is an array of `N + 1` ints, so that locations 1 to N exist (location 0 is wasted). The constants name the special values:

```cpp norun
const int N = 12;           // locations 1 to N
const int EMPTY = 0;
const int DELETED = -1;

int hashKey (int key) {
	return key % N + 1;
}

int insertKey (int table[], int key) {
	int loc = hashKey (key);
	int tries = 1;
	while (table[loc] != EMPTY && table[loc] != DELETED) {
		if (tries == N)
			return -1;              // every location is full
		loc = loc + 1;
		if (loc > N)
			loc = 1;                // the table is circular
		tries++;
	}
	table[loc] = key;
	return loc;                     // where the key was placed
}
```

The `tries` counter stops the loop once every location has been tried. Without it, inserting into a full table would loop forever. (The `DELETED` test is explained below.)

## Searching

A search must follow the **same path** the key followed when it was inserted. Search for 23:

- 23 hashes to 12. Location 12 is occupied, but not by 23.
- Try 1. Occupied, but not by 23.
- Try 2. Location 2 contains 23: **found**.

How do we know the table does **not** contain a key? The lecture's example: suppose 13 had been stored in location 2 instead of 23, and we search for 23:

- 12 holds 59, 1 holds 84, 2 holds 13, 3 holds 61: occupied, but not by 23.
- Try 4. It is **empty**. Stop: 23 is not in the table.

Why can we stop at an empty location? If 23 had been inserted, it would have walked this same path and taken the first empty location it met, which is location 4. Location 4 is still empty, so 23 was never inserted.

```cpp norun
int searchKey (int table[], int key) {
	int loc = hashKey (key);
	int tries = 1;
	while (table[loc] != EMPTY) {
		if (table[loc] == key)
			return loc;             // found
		if (tries == N)
			return -1;              // checked every location
		loc = loc + 1;
		if (loc > N)
			loc = 1;
		tries++;
	}
	return -1;                      // reached an empty location: not found
}
```

A search stops in one of three ways: it finds the key, it reaches an empty location, or it has checked all N locations.

## Deleting

Once a key is found, it is deleted by storing a value that means **deleted**. If the keys are positive integers, −1 can be used. The lecture deletes 84, so location 1 becomes −1.

Why not just put 0 (empty) there? Search for 23 again. It hashes to 12, and must pass through location 1 to reach location 2. If location 1 were **empty**, the search would stop at 1 and report "not found", even though 23 is sitting in location 2.

So the lecture gives two rules for a deleted location:

- **When searching**, a deleted location is treated as if it holds a valid key: keep going past it.
- **When inserting**, a key can go in the first empty location **or** the first deleted location. For example, 71 hashes to 71 % 12 + 1 = 12 (holds 59), then tries 1, which is deleted, so **71 goes to location 1**.

That is why `insertKey` stops at `DELETED` but `searchKey` does not (its loop only stops at `EMPTY`).

```cpp norun
bool deleteKey (int table[], int key) {
	int loc = searchKey (table, key);
	if (loc == -1)
		return false;              // not in the table
	table[loc] = DELETED;
	return true;
}
```

## The whole table

```cpp example="Hashing with linear probing (Lecture 14)"
#include <iostream>
#include <iomanip>
using namespace std;

const int N = 12;
const int EMPTY = 0;
const int DELETED = -1;

int hashKey (int key) {
	return key % N + 1;
}

int insertKey (int table[], int key) {
	int loc = hashKey (key);
	int tries = 1;
	while (table[loc] != EMPTY && table[loc] != DELETED) {
		if (tries == N)
			return -1;
		loc = loc + 1;
		if (loc > N)
			loc = 1;
		tries++;
	}
	table[loc] = key;
	return loc;
}

int searchKey (int table[], int key) {
	int loc = hashKey (key);
	int tries = 1;
	while (table[loc] != EMPTY) {
		if (table[loc] == key)
			return loc;
		if (tries == N)
			return -1;
		loc = loc + 1;
		if (loc > N)
			loc = 1;
		tries++;
	}
	return -1;
}

bool deleteKey (int table[], int key) {
	int loc = searchKey (table, key);
	if (loc == -1)
		return false;
	table[loc] = DELETED;
	return true;
}

void showTable (int table[]) {
	for (int i = 1; i <= N; i++)
		cout << setw (4) << i;
	cout << endl;
	for (int i = 1; i <= N; i++) {
		if (table[i] == EMPTY)
			cout << setw (4) << ".";
		else
			cout << setw (4) << table[i];
	}
	cout << endl;
}

int main() {
	int table[N + 1];
	for (int i = 0; i <= N; i++)
		table[i] = EMPTY;

	int keys[] = {52, 33, 84, 43, 16, 59, 31, 23, 61};
	for (int i = 0; i < 9; i++) {
		int loc = insertKey (table, keys[i]);
		cout << keys[i] << " hashes to " << hashKey (keys[i]) << ", placed in " << loc << endl;
	}
	showTable (table);

	cout << "search 23: " << searchKey (table, 23) << endl;
	cout << "search 35: " << searchKey (table, 35) << endl;
	deleteKey (table, 84);
	cout << "after deleting 84, search 23: " << searchKey (table, 23) << endl;
	cout << "71 placed in " << insertKey (table, 71) << endl;
	showTable (table);
	return 0;
}
```

Try the same keys in the [Hashing Lab](#lab-hash), which shows every collision and every probe.

:::parsons Put the lines of insertKey (linear probing) in order.
int insertKey (int table[], int key) {
	int loc = hashKey (key);
	int tries = 1;
	while (table[loc] != EMPTY && table[loc] != DELETED) {
		if (tries == N)
			return -1;
		loc = loc + 1;
		if (loc > N)
			loc = 1;
		tries++;
	}
	table[loc] = key;
	return loc;
}
~		loc = hashKey (loc + 1);
:::


:::predict Linear probing with h = key % 7 + 1. Where does each key go?
```cpp
#include <iostream>
using namespace std;

const int N = 7;
const int EMPTY = 0;

int insertKey (int table[], int key) {
	int loc = key % N + 1;
	while (table[loc] != EMPTY) {
		loc = loc + 1;
		if (loc > N)
			loc = 1;
	}
	table[loc] = key;
	return loc;
}

int main() {
	int table[N + 1];
	for (int i = 0; i <= N; i++)
		table[i] = EMPTY;
	int keys[] = {15, 22, 8, 13, 20};
	for (int i = 0; i < 5; i++)
		cout << keys[i] << " -> " << insertKey (table, keys[i]) << endl;
	return 0;
}
```
:::


:::remember
- h = key % N + 1 gives locations 1 to N.
- Collision: the home location is taken. Linear probing tries location + 1, wrapping from N back to 1.
- Search stops at the key, at an **empty** location, or after N tries.
- Delete stores −1. Searches go **past** −1; inserts may **reuse** −1.
:::

:::teachback
Explain why deleting a key from a linear-probing table stores -1 in its location instead of 0 (empty).
>> A search stops at an empty (0) location, because a key that had been inserted would have been put there.
>> A key inserted later may have probed past the location that is now being deleted.
>> If the location became 0, a search for that key would stop too early and wrongly report "not found".
>> -1 tells a search to keep going, while an insert may reuse the location.
:::

:::quiz
With h = key % 12 + 1, which location does 100 hash to?
- [ ] 4
- [x] 5
- [ ] 8
- [ ] 9
>> 100 = 8 × 12 + 4, so 100 % 12 = 4, and 4 + 1 = 5.
:::

:::quiz
Using the final table from the lecture (84, 23, 61, empty, 52, 16, empty, 43, 31, 33, empty, 59 in locations 1 to 12), where does linear probing put 35?
- [ ] 12
- [ ] 1
- [x] 4
- [ ] 7
>> 35 % 12 + 1 = 12, which holds 59. Then 1 (84), 2 (23), 3 (61) are taken, and 4 is empty. Four collisions, and 35 goes to 4.
:::

:::quiz
In the same table, a search for 47 is made. 47 is not in the table. At which location does the search stop?
- [ ] 12
- [ ] 1
- [x] 4
- [ ] It checks all 12 locations
>> 47 % 12 + 1 = 12. Locations 12, 1, 2 and 3 are occupied by other keys; location 4 is empty, so the search stops there and reports "not found".
:::

:::quiz
Why does deleting a key store −1 in its location instead of 0?
- [ ] −1 uses less memory
- [ ] So that the location can never be used again
- [x] A 0 (empty) would make later searches stop early, missing keys that were placed after this location
- [ ] Because 0 could be a valid key
>> Searches stop at an empty location. A key such as 23 may have passed through the deleted location when it was inserted, so a search for it must be able to continue past that location. −1 says "keep going" to a search, and "free" to an insert.
:::
