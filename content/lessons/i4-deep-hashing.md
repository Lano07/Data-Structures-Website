---
title: Deep dive: hashing, load factor and clustering
summary: Hashing promises O(1) search, but only under conditions. This deep dive explains what makes a good hash function, how the load factor controls the number of probes, why linear probing clusters, why the course's quadratic probing can only reach half of a 12-location table, why deleted cells need a marker, and how to hash strings without anagrams colliding.
lectures: Lectures 14–15 (deep dive)
goals:
  - State what makes a good hash function, and why the table size matters
  - Use the load factor to estimate probes for chaining and open addressing, and decide when to resize
  - Explain primary and secondary clustering, and why double hashing needs a prime table size
  - Prove that quadratic probing with x + x² steps reaches only half of an even-sized table
  - Explain why deletion uses a deleted marker, and design a better string hash
labs: [hash]
---

## What a hash function must do

Lecture 14 turns a key into a table location with h = key % 12 + 1, giving locations 1 to 12. A good hash function is:

1. **Deterministic:** the same key always gives the same location, or a stored key could never be found again.
2. **Fast:** O(1). Hashing is pointless if computing the location is slow.
3. **Uniform:** keys spread evenly over the table, so few of them collide.

:::insight Why the table size matters
Real keys have patterns. With N = 12, the keys 12, 24, 36 and 48 all land in location 1, and every even key lands in an odd location (key % 12 is even, plus 1). Keys that share a factor with N bunch together. A **prime** table size has no factors to share, so patterned keys spread out. With N = 13, the keys 12, 24, 36 and 48 go to 13, 12, 11 and 10.
:::

## The load factor decides everything

:::def Load factor
α = n / N, the number of stored keys divided by the number of locations. With 9 keys in 12 locations, α = 0.75.
:::

How many probes (locations examined) does a search take? The standard results, assuming a uniform hash function, are:

| Method | Successful search | Unsuccessful search |
|---|---|---|
| Chaining | about 1 + α/2 | about α (the whole chain) |
| Open addressing, ideal probing | about (1/α) ln (1/(1 − α)) | about 1/(1 − α) |
| Linear probing (Knuth) | about ½ (1 + 1/(1 − α)) | about ½ (1 + 1/(1 − α)²) |

Put numbers in to see what they mean:

| α | 1/(1 − α): ideal unsuccessful | Linear probing, unsuccessful |
|---|---|---|
| 0.5 | 2 | 2.5 |
| 0.75 | 4 | 8.5 |
| 0.9 | 10 | 50.5 |

:::theorem The O(1) promise is conditional
Hash table operations take O(1) expected time **if the load factor is kept below a constant** (open addressing is usually kept under about 0.7). As α approaches 1, open addressing degrades towards O(n); chaining degrades gracefully, as O(1 + α).
:::

That is why Lecture 15 says *monitor the hashtable and resize*. **Rehashing** means making a bigger table (about double the size, and prime) and re-inserting every key. The keys move, because h depends on N. One rehash costs O(n), but if the size doubles each time, the total cost averages out to O(1) per insertion.

:::example Lecture 14's keys with linear probing (N = 12)
Insert 52, 33, 84, 43, 16, 59, 31, 23, 61:
- 52 → 5; 33 → 10; 84 → 1; 43 → 8: one probe each.
- 16 → 5 is taken → 6: 2 probes. 59 → 12: 1 probe. 31 → 8 is taken → 9: 2 probes.
- 23 → 12 is taken → 1 (wrap round) is taken → 2: 3 probes. 61 → 2 is taken → 3: 2 probes.

Final table: 1: 84, 2: 23, 3: 61, 5: 52, 6: 16, 8: 43, 9: 31, 10: 33, 12: 59, as on the slides. 14 probes for 9 keys: a successful search averages 14/9 ≈ 1.6 probes, at α = 0.75.
:::

## Clustering: why linear probing gets slow

:::def Primary clustering
With linear probing, occupied locations form **runs** (clusters). A key that hashes **anywhere** into a run lands at its end and makes it longer. Long runs grow faster than short ones (a run of length L catches about L/N of all new keys), so clusters merge and searches slow down.
:::

In the example, locations 1, 2 and 3 became one run after 23 and 61. Any later key that hashes to 1, 2, 3 or 4 joins it.

:::def Secondary clustering
Quadratic probing jumps away, which breaks up runs. But two keys with the **same home location** still follow the **same** probe sequence, so they still pile up behind each other.
:::

**Double hashing** fixes both. The step k = key % (N − 2) + 1 (Lecture 15) depends on the key, so keys with the same home location take different paths.

## Which locations can a probe sequence reach?

This is the question that separates good answers from great ones.

:::theorem Quadratic probing reaches only half of an even-sized table
With the course's rule (on collision number x, move forward x + x² from the current location), every step x + x² = x(x + 1) is **even**. With N = 12, every location tried has the same parity (odd or even) as the home location. A key can therefore fail to be inserted even when half the table is empty.
:::

:::proof
x and x + 1 are consecutive integers, so one of them is even, and x(x + 1) is even. Every location tried is home + (a sum of even numbers), reduced to the range 1 to 12. Subtracting 12 does not change whether a number is odd or even, so every location tried has the home location's parity: at most 6 of the 12.
:::

Double hashing reaches **every** location when the step k and N share no common factor. If N is prime, every step from 1 to N − 1 works, which is why Lecture 15 says *it is generally better to use a prime number for the table size, n*. With N = 13 and N − 2 = 11 (both prime), the step k = key % 11 + 1 is between 1 and 11, and any such step visits all 13 locations.

## Deleting needs a marker

Lecture 14 deletes by storing −1, which means *deleted*, not *empty*. Why not store 0?

:::insight Emptying a cell breaks searches
A search stops at the first **empty** location, because if the key were in the table, insertion would have put it there. Suppose 23 was inserted at 2 after probing 12 and 1. Empty location 1 (delete 84 by storing 0) and a search for 23 starts at 12, moves to 1, finds it empty, and wrongly reports that 23 is not there. The −1 marker keeps the chain intact. Searches treat −1 as occupied and keep going; inserts may reuse it (Lecture 14 puts 71 into location 1).
:::

Many −1 markers make searches long, because they never stop at a marker. Rehashing clears them out.

## Hashing strings

Lecture 15 adds up the character codes. Then **mate**, **meat** and **team** collide: same letters, same sum. Lecture 15 suggests weighting each character by its position, intValue += str[i] × i.

:::trap Weighting by i ignores the first character
With weight i, str[0] is multiplied by 0. **cat** and **bat** then hash the same, and so does every pair of words that differ only in the first letter. Use weight (i + 1), or better, the polynomial (Horner) method: h = h × 31 + str[i] for each character, then location = h % N + 1.
:::

```cpp example="Probes, and two string hashes"
#include <iostream>
#include <string>
using namespace std;

int byPosition (string s) {                // Lecture 15's weighting: str[i] * i
	int v = 0;
	for (int i = 0; i < (int) s.length (); i++)
		v = v + s[i] * i;
	return v;
}

int horner (string s) {                    // polynomial hashing
	int v = 0;
	for (int i = 0; i < (int) s.length (); i++)
		v = (v * 31 + s[i]) % 100003;
	return v;
}

int main () {
	const int N = 12;
	int table[N + 1];
	for (int i = 1; i <= N; i++)
		table[i] = 0;
	int keys[] = {52, 33, 84, 43, 16, 59, 31, 23, 61};
	int total = 0;
	for (int k = 0; k < 9; k++) {
		int loc = keys[k] % N + 1, probes = 1;
		while (table[loc] != 0) {
			loc = loc + 1;
			if (loc > N)
				loc = 1;
			probes++;
		}
		table[loc] = keys[k];
		total = total + probes;
		cout << keys[k] << " -> " << loc << " (" << probes << " probe" << (probes > 1 ? "s" : "") << ")" << endl;
	}
	cout << "average " << total << "/9 probes" << endl;
	cout << "cat " << byPosition ("cat") << ", bat " << byPosition ("bat") << endl;
	cout << "cat " << horner ("cat") << ", bat " << horner ("bat") << endl;
	return 0;
}
```

:::quiz
A table uses linear probing and has α = 0.9. Roughly how many probes does an unsuccessful search take, according to the formula for linear probing?
- [ ] About 2
- [ ] About 10
- [x] About 50
- [ ] Exactly 1, since hashing is O(1)
>> ½ (1 + 1/(1 − 0.9)²) = ½ (1 + 100) ≈ 50. The O(1) promise needs the load factor kept well below 1: at 0.5 it would be 2.5.
:::

:::quiz
With N = 12 and the course's quadratic probing (move forward x + x² on collision x), the key 31 hashes to location 8. Which location can it NEVER be placed in, however full the table is?
- [x] 3
- [ ] 10
- [ ] 4
- [ ] 2
>> Every step x(x + 1) is even, so the locations tried keep the parity of the home location 8: always even. Location 3 is odd and can never be reached. 10, 4 and 2 are all reachable (10 is the first step, 8 + 2).
:::

:::predict What does this print? (Double hashing, N = 13, step k = key % 11 + 1.)
```cpp
#include <iostream>
using namespace std;

int main () {
	const int N = 13;
	int table[N + 1];
	for (int i = 1; i <= N; i++)
		table[i] = 0;
	int keys[] = {27, 40, 53};
	for (int j = 0; j < 3; j++) {
		int key = keys[j];
		int loc = key % N + 1;
		int k = key % (N - 2) + 1;
		while (table[loc] != 0) {
			loc = loc + k;
			while (loc > N)
				loc = loc - N;
		}
		table[loc] = key;
		cout << key << ": home " << key % N + 1 << ", step " << k << ", placed at " << loc << endl;
	}
	return 0;
}
```
:::

:::teachback
Explain why a hash table cannot simply store 0 (empty) in a location when it deletes a key, using linear probing.
>> A search moves along the probe sequence and stops at the first empty location, because an inserted key would have been placed there.
>> If a key in the middle of a probe chain is emptied, a later key that was placed after it becomes unreachable: the search stops early and reports it missing.
>> A deleted marker (−1) lets searches continue past the location while still letting inserts reuse it.
:::

:::remember
- Good hash: deterministic, fast, uniform. Prime table sizes break up patterned keys.
- Load factor α = n/N. Ideal unsuccessful probes ≈ 1/(1 − α); keep α under about 0.7 and rehash by doubling to a prime.
- Linear probing → primary clustering; quadratic → secondary clustering; double hashing avoids both.
- The course's quadratic steps x(x + 1) are even: they reach only half of a 12-location table.
- Delete with −1: searches pass over it, inserts may reuse it.
- String hash: avoid plain sums (anagrams) and weight i (ignores the first letter); use Horner: h = h × 31 + c.
:::
