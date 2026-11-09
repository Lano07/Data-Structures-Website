# world: hash
title: The Codebreakers' Pigeonholes
place: Bletchley Park, England
when: 1939–1945
topic: hashing
parts: i
scene: bletchley
color: #ff5d8f
fragment: The Cipher Key
blurb: Hashing: hash tables and hash functions, collisions, linear and quadratic probing, double hashing, chaining, string keys, searching and deleting.

## hs-1 | A hole for every message
goal: Hash keys into a table with h = key % N + 1, and see collisions happen.
lessons: i1-hash-tables

@scene Bletchley Park, Buckinghamshire · a winter night in 1941 (in the professor's journal)
@say narrator: During the Second World War, thousands of people worked in secret at Bletchley Park, most of them women, breaking enemy codes. Alan Turing helped design the Bombe machines; in 1944, Colossus, one of the first programmable electronic computers, was running here.
@say marco: The cipher from Giza leads here? To a museum?
@say you: The professor's notes say the codebreakers kept huge card indexes so they could find any name in seconds. Not by searching. By computing where the card must be.
@learn Hash tables: compute the location
Searching a list or an unbalanced tree takes up to O(n) steps. A **hash table** finds a key in about **one** step: a **hash function** turns the key straight into a table **location**.

The lectures use a table with locations **1 to N** and the hash function

**h(key) = key % N + 1**

For N = 12: key 52 goes to 52 % 12 + 1 = 4 + 1 = **5**; key 33 goes to 33 % 12 + 1 = **10**.

A **collision** happens when two keys hash to the **same** location: 16 % 12 + 1 = 5, but 52 is already there. Collisions cannot be avoided completely (there are more possible keys than locations), so every hash table needs a **collision resolution** strategy: probing (this level and the next) or chaining.

A good hash function is fast and spreads keys evenly. Using a **prime** table size helps keys spread out. The **load factor** λ = (keys stored) / N tells you how full the table is; the fuller it is, the more collisions.
@array kind="hash" n="12" keys="52 33 84 43 59" method="linear"
File the first five cards: h = key % 12 + 1. Click where each key goes. (No collisions yet.)
@type With h = key % 12 + 1, where does the key 76 go?
= 5
>> 76 = 6 × 12 + 4, so 76 % 12 = 4 and h = 5.
@quiz Two different keys hash to the same location. What is that called?
- [ ] An overflow
- [x] A collision
- [ ] A probe
- [ ] A load factor
>> A collision. The table must then find somewhere else for the second key (probing) or keep a list at that location (chaining).
@relic colossus | Colossus | Colossus, designed by the engineer Tommy Flowers, began work at Bletchley Park in early 1944, reading enemy teleprinter messages from paper tape at about 5,000 characters a second. Ten were built; their existence stayed secret for decades after the war.
@journal
- A hash function computes a key's location: the lecture's h(key) = key % N + 1 (locations 1..N)
- A collision: two keys, one location. Every table needs a way to resolve them
- Load factor λ = keys / N; prime table sizes spread keys better

## hs-2 | When holes are full
goal: Resolve collisions with linear probing, quadratic probing and double hashing.
lessons: i2-probing

@scene Hut 8 · rows of wooden pigeonholes
@say marco: This hole's taken. Where does the card go now?
@say you: That depends which probing rule the codebreakers used. The professor lists three.
@learn Three ways to probe
When a key's location is taken, **probe**: try other locations in a fixed order until one is empty.

**Linear probing**: try the **next** location, then the next, wrapping from N back to 1.
Simple, but keys pile up in long runs (**primary clustering**), and every key that lands in a run makes it longer.

**Quadratic probing** (the lecture's version): after the x-th collision, move **x + x²** forward from where you are: 2, then 6, then 12, then 20 … (wrapping past N by subtracting N). Keys jump away from clusters faster. Not every location may be reachable, so keep the table well under full.

**Double hashing**: the step depends on the key: **step = key % (N − 2) + 1**, and each probe moves that many locations. Keys that collide at the same place usually have **different steps**, so they go different ways. The step can never be 0 (that is why + 1), and with N and N − 2 both prime every location is reachable.

The lecture keys for N = 12: 52, 33, 84, 43, 16, 59, 31, 23, 61.
@array kind="hash" n="12" keys="52 33 84 43 16 59 31 23 61" method="linear"
**Linear probing**, the lecture's nine keys. When a location is taken, move one place on (after 12 comes 1).
>> The final table: 84 23 61 _ 52 16 _ 43 31 33 _ 59. Notice the cluster forming around 1, 2 and 3.
@array kind="hash" n="12" keys="52 33 84 43 16 59 31 23 61" method="quad"
The same keys with **quadratic probing**: after the x-th collision move x + x² (2, then 6, then 12, then 20) from where you are.
>> 31 goes 8 → 10 → 4; 61 goes 2 → 4 → 10 → 10 → 6. Compare where 16, 31 and 61 ended up with linear probing.
@array kind="hash" n="13" keys="14 27 40 53" method="double"
**Double hashing**, N = 13, step = key % 11 + 1. All four keys hash to location 2. Follow each key's own step.
>> 14 takes 2. 27 (step 6) goes to 8, 40 (step 8) to 10, 53 (step 10) to 12: the same home, four different paths.
@quiz What problem does quadratic probing (and double hashing) reduce compared with linear probing?
- [x] Primary clustering: long runs of filled locations that keep growing
- [ ] Collisions: they never happen any more
- [ ] The need for a hash function
- [ ] The table having to be prime
>> Linear probing fills neighbouring locations, so runs grow and every key landing in one makes it longer. Jumping further spreads the keys out.
@code ex="hash-quadratic"
Write insert with the lecture's quadratic probing.
@journal
- Linear probing: next location, wrapping; simple but causes primary clustering
- Quadratic (lecture): after the x-th collision move x + x² from where you are (2, 6, 12, 20, …)
- Double hashing: step = key % (N − 2) + 1, so colliding keys take different paths

## hs-3 | Chains and names
goal: Resolve collisions with chaining, and hash string keys.
lessons: i3-chaining-strings

@scene The card index room · each drawer holds a little stack of cards
@say marco: These drawers don't overflow into the next one. They just hold more cards.
@learn Chaining, and keys that are words
**Chaining** keeps a **linked list at every location**. A key is added to the list at its home location, so the table never "fills up": a location just gets a longer chain.

```cpp
Node * table[N + 1];            // locations 1..N, each the top of a chain
void insertChain (int key) {
	int loc = key % N + 1;
	table[loc] = insertAtHead (table[loc], key);   // or at the tail
}
```

Search hashes to the location and walks its chain. With a good hash function and load factor λ, chains average λ nodes: O(1 + λ). The worst case (every key in one chain) is O(n).

**String keys** must become numbers first. A simple way: add up the character codes. A better way weights each position, so anagrams like "STOP" and "POTS" do not always collide:

```cpp
int hashString (string s, int N) {
	int h = 0;
	for (int i = 0; i < (int) s.length(); i++)
		h = (h * 31 + s[i]) % N;      // weight each position
	return h + 1;
}
```
@array kind="hash" n="7" keys="10 22 31 4 15 28 17" method="chain"
**Chaining**, N = 7, h = key % 7 + 1. Click each key's home location; colliding keys join that location's chain.
>> 31 and 17 join 10 at location 4, and 15 joins 22 at location 2. Nothing ever probes elsewhere.
@predict Hashing names. What does this print?
```cpp
#include <iostream>
#include <string>
using namespace std;

int sumHash (string s, int N) {
	int total = 0;
	for (int i = 0; i < (int) s.length(); i++)
		total = total + s[i];
	return total % N + 1;
}

int main() {
	cout << sumHash ("CAT", 12) << " " << sumHash ("ACT", 12) << " " << sumHash ("DOG", 12) << endl;
	return 0;
}
```
>> 'C' + 'A' + 'T' = 67 + 65 + 84 = 216, and 216 % 12 = 0, so h = 1. ACT has the same letters, so the same sum: an anagram collision. DOG is 68 + 79 + 71 = 218, so h = 3.
@quiz With chaining, what happens when more keys are inserted than there are locations?
- [ ] The table is full and the insert fails
- [x] The chains get longer; nothing fails, but searches slow down
- [ ] Keys are moved to the next location
- [ ] The hash function changes
>> Chaining has no "full": each location's list just grows. The load factor can go above 1.
@code ex="hash-chain"
Write insert and search for a chained table.
@journal
- Chaining: a linked list at each location; insert into the home location's chain
- Average search O(1 + λ) with a good hash function; worst case O(n)
- Strings: turn characters into a number; weighting positions avoids anagram collisions

## hs-4 | Finding and forgetting
goal: Search a probing table, delete safely, and know the costs.
lessons: i4-deep-hashing

@scene Hut 6 · a card has been removed, and now a search fails
@say silas: (a note left in a drawer) *I removed one card from your precious table. Now try finding the cards that came after it.*
@say you: He emptied a slot in a probing table. That breaks every search that used to probe past it!
@learn Search and delete follow the same path as insert
**Searching** a probing table repeats the insert's probes: start at h(key); if the location holds the key, found; if it holds a different key, probe on; if it is **empty**, stop: the key is **not** in the table (if it were, insert would have put it here).

**Deleting** is the trap. If you simply empty a location, a later search may stop there too early and miss keys that probed **past** it when they were inserted. The fix: mark the slot **deleted** (a "tombstone"). Searches treat a deleted slot as "keep probing"; inserts may reuse it.

With chaining, deletion is easy: remove the node from its chain.

**Costs**, with a good hash function and a table that is not too full:

| | average | worst |
|---|---|---|
| search, insert, delete | O(1) | O(n) |

The worst case happens when many keys collide. Keep the load factor low (resize and rehash when it grows), and pick a good hash function.
@quiz The table (linear probing, h = key % 12 + 1) has 52 at location 5 and 16 at location 6 (16 also hashed to 5). Someone deletes 52 by making location 5 empty. What goes wrong?
- [ ] Nothing: 16 is still at location 6
- [x] A search for 16 starts at 5, finds it empty and stops: "not found", although 16 is in the table
- [ ] 16 moves back to location 5 automatically
- [ ] The table must be rebuilt from scratch
>> Search stops at the first empty location. Marking 5 as deleted (not empty) tells searches to keep going.
@type A probing table search starts at the key's home location and probes on. At what kind of location does an unsuccessful search stop? Type one word.
= empty | an empty location | an empty one | empty location
>> An empty location proves the key is absent, because insert would have used it.
@quiz What is the average cost of searching a hash table with a good hash function and a low load factor?
- [x] O(1)
- [ ] O(log n)
- [ ] O(n)
- [ ] O(n log n)
>> Each search looks at a small, constant number of locations on average. The worst case is O(n), when keys all collide.
@code ex="hash-search"
Write search for a probing table.
@say narrator: You rebuild the index with tombstones, and the missing card's position lights up. The card itself is a telegram, dated 1871: **"CABLE LANDED. ISLANDS LINKED. THE BRIDGES OF KÖNIGSBERG HOLD THE PATTERN."**
@say marco: A telegram about undersea cables... and a city with bridges.
@say you: Graphs. Euler's bridges. The professor saved the best for nearly last.
@boss
The Collision sends every key to the same location. Probe your way past it with exam-style hashing questions.
@journal
- Search repeats the insert's probes and stops at the key or at an EMPTY location
- Deleting from a probing table: mark the slot deleted (tombstone), never just empty it
- Hashing is O(1) on average and O(n) in the worst case; keep the load factor low
