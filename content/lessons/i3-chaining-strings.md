---
title: Chaining and string keys
summary: With chaining, each location of the table holds a linked list of every key that hashes there, so a collision never pushes a key somewhere else. Strings are hashed by first turning their characters into a number. And a table that gets too full must be made bigger.
lectures: Lectures 14–15
goals:
  - Insert, search and delete with chaining, using an array of list tops
  - Trace the lecture's chaining example and draw the lists
  - Hash a string by adding its character codes, and explain why anagrams collide
  - Explain the weighted string hash and its weak spot
  - Explain load factor, resizing, and the best and worst case cost of hashing
labs: [hash, memory]
---

## One list per location

**Chaining**: all keys that hash to the same location are held on a linked list. The table is now an array of list tops (`Node *`), all NULL at the start. A new key is added at the **top** of its location's list, which is insertAtHead from lesson C1.

The lecture's example uses h = key % 12 + 1 and inserts 39, 25, 26, 60, 37, 75, 13, 73:

| Key | key % 12 + 1 | List at that location afterwards (top first) |
|---|---|---|
| 39 | 3 + 1 = 4 | 39 |
| 25 | 1 + 1 = 2 | 25 |
| 26 | 2 + 1 = 3 | 26 |
| 60 | 0 + 1 = 1 | 60 |
| 37 | 1 + 1 = 2 | 37 → 25 |
| 75 | 3 + 1 = 4 | 75 → 39 |
| 13 | 1 + 1 = 2 | 13 → 37 → 25 |
| 73 | 1 + 1 = 2 | 73 → 13 → 37 → 25 |

:::diagram hash chain 12
39 25 26 60 37 75 13 73
Chaining with the lecture's keys. Four keys hash to location 2, and the newest is at the top of the list.
:::

Compare this with probing:

- A key **always stays at its home location**. There is no probing and no wrapping around.
- The table **never fills up**: a list can always grow by one more node.
- **Deleting** just removes a node from one list. No −1 marker is needed, because no search ever has to pass through another key's location.

## Chaining in C++

```cpp norun
struct Node {
	int data;
	Node * next;
};

const int N = 12;

int hashKey (int key) {
	return key % N + 1;
}

void insertKey (Node * table[], int key) {
	int loc = hashKey (key);
	Node * newNode = new Node;
	newNode->data = key;
	newNode->next = table[loc];      // the old top of the list comes after it
	table[loc] = newNode;            // the new node is the new top
}
```

`Node * table[N + 1]` is an array of pointers. Each element is the `top` of one list, so `table[loc]` is used exactly as `top` was in Part C.

```cpp memory caption="The table is an array of 13 pointers on the stack (location 0 is not used). Each one is the top of a list on the heap, or NULL."
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

const int N = 12;

int hashKey (int key) {
	return key % N + 1;
}

void insertKey (Node * table[], int key) {
	int loc = hashKey (key);
	Node * newNode = new Node;
	newNode->data = key;
	newNode->next = table[loc];
	table[loc] = newNode;
}

int main() {
	Node * table[N + 1];
	for (int i = 0; i <= N; i++)
		table[i] = NULL;
	int keys[] = {39, 25, 26, 60, 37, 75, 13, 73};
	for (int i = 0; i < 8; i++)
		insertKey (table, keys[i]);
	cout << table[2]->data << endl;
	return 0;
}
```

## Searching and deleting

A search hashes the key, then walks **one list**, the list at that location, exactly like `contains` in lesson C2. Keys that hashed elsewhere are never looked at.

```cpp norun
bool searchKey (Node * table[], int key) {
	Node * curr = table[hashKey (key)];
	while (curr != NULL) {
		if (curr->data == key)
			return true;
		curr = curr->next;
	}
	return false;
}
```

Deleting is lesson C4's deleteKey applied to one list. Because the list's top lives in `table[loc]`, the result is stored back there:

```cpp norun
Node * deleteFromList (Node * top, int key) {
	if (top == NULL)
		return NULL;
	if (top->data == key) {             // the key is in the first node
		Node * rest = top->next;
		delete top;
		return rest;
	}
	Node * prev = top;
	Node * curr = top->next;
	while (curr != NULL && curr->data != key) {
		prev = curr;
		curr = curr->next;
	}
	if (curr != NULL) {
		prev->next = curr->next;
		delete curr;
	}
	return top;
}

void deleteKey (Node * table[], int key) {
	int loc = hashKey (key);
	table[loc] = deleteFromList (table[loc], key);
}
```

```cpp example="Chaining: insert, search and delete"
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

const int N = 12;

int hashKey (int key) {
	return key % N + 1;
}

void insertKey (Node * table[], int key) {
	int loc = hashKey (key);
	Node * newNode = new Node;
	newNode->data = key;
	newNode->next = table[loc];
	table[loc] = newNode;
}

bool searchKey (Node * table[], int key) {
	Node * curr = table[hashKey (key)];
	while (curr != NULL) {
		if (curr->data == key)
			return true;
		curr = curr->next;
	}
	return false;
}

Node * deleteFromList (Node * top, int key) {
	if (top == NULL)
		return NULL;
	if (top->data == key) {
		Node * rest = top->next;
		delete top;
		return rest;
	}
	Node * prev = top;
	Node * curr = top->next;
	while (curr != NULL && curr->data != key) {
		prev = curr;
		curr = curr->next;
	}
	if (curr != NULL) {
		prev->next = curr->next;
		delete curr;
	}
	return top;
}

void deleteKey (Node * table[], int key) {
	int loc = hashKey (key);
	table[loc] = deleteFromList (table[loc], key);
}

void showTable (Node * table[]) {
	for (int i = 1; i <= N; i++) {
		if (table[i] == NULL)
			continue;
		cout << i << ":";
		for (Node * curr = table[i]; curr != NULL; curr = curr->next)
			cout << " " << curr->data;
		cout << endl;
	}
}

int main() {
	Node * table[N + 1];
	for (int i = 0; i <= N; i++)
		table[i] = NULL;
	int keys[] = {39, 25, 26, 60, 37, 75, 13, 73};
	for (int i = 0; i < 8; i++)
		insertKey (table, keys[i]);
	showTable (table);
	cout << "contains 37? " << searchKey (table, 37) << endl;
	cout << "contains 49? " << searchKey (table, 49) << endl;
	deleteKey (table, 37);
	deleteKey (table, 73);
	cout << "after deleting 37 and 73:" << endl;
	showTable (table);
	return 0;
}
```

## String keys

The lecture asks: what do we do with non-numeric keys, such as strings? Turn the string into a number first, then use `% n + 1` as before.

Every character is stored as a number, its character code: `'a'` is 97, `'b'` is 98, …, `'A'` is 65, and a space is 32 (lesson A8). The lecture adds up the codes:

```cpp norun
int i, intValue;
i = intValue = 0;
while (str[i] != '\0') {
	intValue = intValue + str[i];
	i++;
}
location = intValue % n + 1;
```

The loop stops at `'\0'`, the null character that marks the end of the string.

**The problem**: words that have the same letters hash to the same location. "mate", "meat" and "team" contain the same four letters, so their codes add up to the same total (109 + 97 + 116 + 101 = 423), and all three land in 423 % 12 + 1 = **4**. Anagrams always collide.

**The lecture's fix**: assign a weight to each character depending on its position:

```cpp norun
intValue = intValue + str[i] * i;
```

Now the same letter counts differently in different positions, so "mate", "meat" and "team" get different totals.

:::warn
In this version `i` starts at 0, so the **first** character is multiplied by 0 and makes no difference at all. "mate", "date" and "gate" still collide, because they differ only in the first letter. Weighting by `(i + 1)` instead fixes that.
:::

```cpp example="Hashing strings"
#include <iostream>
#include <iomanip>
#include <string>
using namespace std;

int hashSum (string str, int n) {
	int i, intValue;
	i = intValue = 0;
	while (str[i] != '\0') {
		intValue = intValue + str[i];
		i++;
	}
	return intValue % n + 1;
}

int hashWeighted (string str, int n) {
	int i, intValue;
	i = intValue = 0;
	while (str[i] != '\0') {
		intValue = intValue + str[i] * i;
		i++;
	}
	return intValue % n + 1;
}

int main() {
	string words[] = {"mate", "meat", "team", "date", "gate"};
	cout << "word   sum  weighted" << endl;
	for (int w = 0; w < 5; w++)
		cout << words[w] << setw (5) << hashSum (words[w], 12) << setw (10) << hashWeighted (words[w], 12) << endl;
	return 0;
}
```

## When the table runs out of space

The lecture's answer to "what if the hashtable runs out of space?" is: **monitor the hashtable and resize** it.

The number to watch is the **load factor**: the number of keys stored divided by the number of locations.

- With **probing**, every key takes a location, so the load factor can never pass 1. Long before it reaches 1, the clusters get long and every operation slows down (and quadratic probing may fail to find a free location at all, lesson I2).
- With **chaining**, the load factor can pass 1. It is the average length of a list, so it tells you how long a search takes on average.

To resize, make a bigger table (roughly twice the size, and a prime number) and **insert every key again**. The keys cannot simply be copied to the same locations, because the location depends on n: 52 % 12 + 1 = 5, but 52 % 23 + 1 = 7.

## How fast is hashing?

| Operation | Average case (keys spread out) | Worst case (every key collides) |
|---|---|---|
| insert | O(1) | O(n) |
| search | O(1) | O(n) |
| delete | O(1) | O(n) |

In the worst case every key hashes to the same location, and the table behaves like one linked list (chaining) or one long cluster (probing). A hash function that spreads the keys evenly, and a load factor kept low by resizing, keep the average case at O(1). That is the answer to the lecture's question: **yes**, with hashing a search can take constant time, on average.

One thing hashing gives up: the keys are scattered, so there is no quick way to list them in order. A BST does that with an inorder traversal.

:::teachback
Explain how chaining deals with collisions, and why adding up character codes is a weak hash function for strings.
>> Each location holds a linked list, and every key that hashes there is inserted at the head of that list.
>> A search hashes the key and walks only that one list.
>> Adding the codes gives the same total for words with the same letters (mate, meat, team), so they always collide.
>> Weighting each character by its position (`str[i] * i`) separates them.
:::

:::quiz
After the lecture's chaining example (39, 25, 26, 60, 37, 75, 13, 73 with h = key % 12 + 1), 49 is inserted. What is the list at location 2, from the top?
- [ ] 25 37 13 73 49
- [x] 49 73 13 37 25
- [ ] 73 13 37 25 49
- [ ] 49 25 37 13 73
>> 49 % 12 + 1 = 1 + 1 = 2. New keys go at the top of the list, so 49 comes before 73, 13, 37 and 25.
:::

:::quiz
With the sum-of-characters hash, which word always hashes to the same location as "stop"?
- [ ] "step"
- [x] "pots"
- [ ] "stops"
- [ ] "top"
>> "pots" has exactly the same letters as "stop", so the character codes add up to the same total, whatever n is. The other words have different letters.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
#include <string>
using namespace std;

int hashWeighted (string str, int n) {
	int i, intValue;
	i = intValue = 0;
	while (str[i] != '\0') {
		intValue = intValue + str[i] * i;
		i++;
	}
	return intValue % n + 1;
}

int main() {
	cout << hashWeighted ("dog", 12) << " " << hashWeighted ("god", 12) << endl;
	return 0;
}
```
- [ ] `3 3`
- [x] `6 12`
- [ ] `12 6`
- [ ] `7 1`
>> 'd' = 100, 'o' = 111, 'g' = 103. "dog": 100×0 + 111×1 + 103×2 = 317, and 317 % 12 = 5, so 6. "god": 103×0 + 111×1 + 100×2 = 311, and 311 % 12 = 11, so 12. Without weights both would total 314.
:::

:::quiz
A table with 12 locations is resized to 23 locations. Why must every key be inserted again rather than copied to the same location?
- [ ] The new table uses chaining
- [x] The location depends on n, so most keys belong somewhere else in the new table
- [ ] Copying would create duplicates
- [ ] Deleted (−1) markers cannot be copied
>> h = key % n + 1 changes when n changes. For example 52 belongs in location 5 of the old table but location 7 of the new one. A search in the new table would look in the new location.
:::
