---
title: Collisions and probing
summary: Linear probing makes keys pile up in long runs called clusters. Quadratic probing jumps further after each collision (x + x²), and double hashing jumps by a step that depends on the key, so keys that collide go different ways. Search and delete follow the same jumps.
lectures: Lecture 15
goals:
  - Explain clustering, the weakness of linear probing
  - Insert with quadratic probing, moving x + x² locations after the x-th collision
  - Insert with double hashing, moving k = key % (n − 2) + 1 locations
  - Explain why k must never be 0 and why prime table sizes are better
  - Search and delete in any probing table by retracing the insert's path
labs: [hash]
---

## The trouble with linear probing: clusters

Look at the linear probing table from lesson I1:

:::diagram hash linear 12
52 33 84 43 16 59 31 23 61
Linear probing: locations 1, 2, 3 form one run, and 8, 9, 10 another.
:::

Any new key that hashes to 12, 1, 2 or 3 has to walk to the end of the run before it finds a space, and then it makes the run one longer. Long runs catch more keys, so they grow even faster, and they merge with their neighbours. These runs are called **clusters**, and every search that lands in one is slow.

The cure is to stop stepping to the very next location after a collision. Jump somewhere else. The lecture lists four ways to resolve collisions:

- Linear probing (location = location + 1)
- Chaining (lesson I3)
- **Quadratic probing**
- **Linear probing with double hashing**

## Quadratic probing

From the lecture: suppose an incoming key collides with another at location loc. Instead of going forward by 1, go forward by **ax + bx²**, where a and b are constants and x is 1 for the first collision, 2 if there is a second collision, 3 for a third, and so on. With a = 1 and b = 1 the jump is **x + x²**:

| Collision number x | Move forward x + x² |
|---|---|
| 1 | 1 + 1 = 2 |
| 2 | 2 + 4 = 6 |
| 3 | 3 + 9 = 12 |
| 4 | 4 + 16 = 20 |

Each jump starts from the location where the collision just happened. When the count passes 12, wrap around by subtracting 12 (as many times as needed).

The lecture's example, with the same keys as Lecture 14:

- 52 → 5, 33 → 10, 84 → 1 and 43 → 8, with no collisions.
- 16 hashes to 5, which holds 52. First collision, x = 1: move 2 → **7**.
- 59 hashes to 12. Empty.
- 31 hashes to 8, which holds 43. First collision: move 2 → 10, which holds 33. Second collision, x = 2: move 6 → 16. Past 12, so 16 − 12 = **4**.
- 23 hashes to 12, which holds 59. First collision: move 2 → 14, and 14 − 12 = **2**.
- 61 hashes to 2, which holds 23. Move 2 → 4 (31). Move 6 → 10 (33). The slide stops here; carrying on with the same rule: x = 3, move 12 → 22 − 12 = 10 (a whole lap, back to 33). x = 4, move 20 → 30 − 12 − 12 = **6**, which is empty.

:::diagram hash quad 12
52 33 84 43 16 59 31 23 61
The same keys with quadratic probing (Lecture 15). Compare where 16, 31 and 61 ended up.
:::

### Half the table can be out of reach

There is a catch. x + x² = x(x + 1), and one of two neighbouring numbers is always even, so **every jump is an even number of locations**. In a table of 12 locations, an even jump from an even location lands on an even location, and from an odd location on an odd one.

So a key that hashes to an even location can **only ever try even locations**. In the table above, locations 2, 4, 6, 8, 10 and 12 are all full. Insert 13: it hashes to 13 % 12 + 1 = 2, and every jump keeps it on even locations. It can never reach the empty locations 3, 9 and 11, so the insert fails while a quarter of the table is still free. (Linear probing would have found location 3 at once.)

Quadratic probing breaks up clusters, but it does not promise to try every location. Keep the table well below full (lesson I3 covers resizing).

## Linear probing with double hashing

From the lecture: instead of going forward by 1, go forward by **k, where k varies with the key**. It is generally better to use a prime number for the table size n. If (n − 2) is also a prime number, k can be found with

**k = key % (n − 2) + 1**

Each key gets its own step size. Two keys that collide at the same home location usually have different steps, so they head off in different directions instead of queueing up in one run.

The lecture's example uses the 12-location table holding 52, 33, 84 and 43, then inserts 16:

- 16 hashes to 5, which holds 52.
- The slide calculates **k = 16 % 10 = 6** and moves forward 6 locations, so 16 goes to **11**.
- Using the formula exactly as written, k = 16 % 10 + 1 = 7, and 16 would go to 5 + 7 = **12**.

:::warn
The slide's worked example leaves out the + 1 from its own formula. In a test, use the formula the question gives you, and write the arithmetic out ("k = 16 % 10 + 1 = 7"), so the marker can follow your steps whichever version is expected. The Hashing Lab can run both versions.
:::

### Why the + 1?

Without it, k can be 0. With n = 12, key 20 gives 20 % 10 = 0: a step of 0 tries the **same** location again and again, forever. Adding 1 makes every step between 1 and n − 2.

### Why a prime table size?

Take n = 12 and k = 6, starting from location 5: 5 → 11 → 17 − 12 = 5 → 11 → … Only **two** locations are ever tried. If both are full, the insert never finishes, even with ten empty locations elsewhere. This happens because 6 and 12 share a factor.

When n is prime, no step from 1 to n − 1 shares a factor with n, so the probes visit **every** location before coming back to the start. That is why the lecture recommends a prime n, and n − 2 prime as well, so that the steps spread out nicely.

## The three methods side by side

Insert 14, 27, 40 and 53 into an empty table with n = 13 locations (h = key % 13 + 1; double hashing uses k = key % 11 + 1, and 13 and 11 are both prime). All four keys hash to location 2:

| Key | Linear probing | Quadratic probing | Double hashing |
|---|---|---|---|
| 14 | 2 | 2 | 2 |
| 27 | 2 → 3 | 2 → 4 | k = 6: 2 → 8 |
| 40 | 2 → 3 → 4 | 2 → 4 → 10 | k = 8: 2 → 10 |
| 53 | 2 → 3 → 4 → 5 | 2 → 4 → 10 → 9 | k = 10: 2 → 12 |

Linear probing builds a cluster at 2, 3, 4, 5, and each new key collides once more than the last. Double hashing sends each key its own way, so none of them collides more than once.

```cpp example="Linear, quadratic and double hashing compared"
#include <iostream>
#include <string>
using namespace std;

const int N = 13;
const int EMPTY = 0;

int hashKey (int key) {
	return key % N + 1;
}

int wrap (int loc) {
	while (loc > N)
		loc = loc - N;
	return loc;
}

// method 1 = linear probing, 2 = quadratic probing, 3 = double hashing
int insertKey (int table[], int key, int method) {
	int loc = hashKey (key);
	int x = 0;
	cout << key << ": " << loc;
	while (table[loc] != EMPTY) {
		x++;
		if (x == 20) {
			cout << " ... gave up" << endl;
			return -1;
		}
		if (method == 1)
			loc = wrap (loc + 1);
		else if (method == 2)
			loc = wrap (loc + x + x * x);
		else
			loc = wrap (loc + key % (N - 2) + 1);
		cout << " -> " << loc;
	}
	table[loc] = key;
	cout << endl;
	return loc;
}

int main() {
	int keys[] = {14, 27, 40, 53};
	string names[] = {"", "Linear probing", "Quadratic probing", "Double hashing"};
	for (int method = 1; method <= 3; method++) {
		int table[N + 1];
		for (int i = 0; i <= N; i++)
			table[i] = EMPTY;
		cout << names[method] << endl;
		for (int i = 0; i < 4; i++)
			insertKey (table, keys[i], method);
	}
	return 0;
}
```

Change the keys or N and run it again. Try N = 12 with the keys 5, 11, 65 (and change the 4 in the last loop to 3). 65 hashes to 6 and its step is k = 65 % 10 + 1 = 6, so double hashing only ever tries locations 6 and 12, which 5 and 11 have filled. It gives up, even though ten locations are empty.

## Searching and deleting

Nothing new is needed. A search computes the home location and then follows **exactly the same jumps** an insert of that key would make:

- it stops when it finds the key,
- it stops at an **empty** location (the key would have been put there, so it is not in the table),
- and it gives up after a fixed number of tries.

Deleting stores −1, exactly as in linear probing: searches go past −1, and inserts may reuse it. Only the rule for the next location changes from method to method.

:::remember
After the x-th collision, move forward:
- **linear probing**: 1
- **quadratic probing**: x + x² (2, 6, 12, 20, …), each jump from where the last one landed
- **double hashing**: k = key % (n − 2) + 1, the same step every time for that key

Always wrap past n back to the start, and show your arithmetic.
:::

:::teachback
Explain how linear probing, quadratic probing and double hashing each choose the next location after a collision, and why the last two are used.
>> Linear probing tries the next location (+1), wrapping from N back to 1.
>> Quadratic probing moves x + x² from the current location after the x-th collision: 2, then 6, then 12, ...
>> Double hashing moves by a step that depends on the key, k = key % (N - 2) + 1, every time.
>> Linear probing builds long clusters; the other two spread colliding keys out.
:::

:::quiz
With quadratic probing (x + x²), a key has collided three times. How many locations does it move forward after the third collision?
- [ ] 3
- [ ] 9
- [x] 12
- [ ] 20
>> x = 3, so it moves 3 + 3² = 3 + 9 = 12. The moves so far were 2, then 6, then 12.
:::

:::quiz
A 12-location table uses quadratic probing (x + x²). A key hashes to location 3, which is full. Which location can this key **never** try?
- [ ] 5
- [ ] 9
- [ ] 11
- [x] 4
>> Every jump x + x² is even, so starting from the odd location 3 the key only ever lands on odd locations (5, 11, 9, 1, …). An even location such as 4 is out of its reach.
:::

:::quiz
A table has n = 13 locations and uses double hashing with k = key % (n − 2) + 1. What is the step size k for the key 30?
- [ ] 4
- [ ] 8
- [x] 9
- [ ] 5
>> n − 2 = 11, and 30 % 11 = 8 (30 = 2 × 11 + 8), so k = 8 + 1 = 9.
:::

:::quiz
Why does the double hashing formula add 1 in k = key % (n − 2) + 1?
- [ ] To make k a prime number
- [x] So that k is never 0; a step of 0 would try the same location forever
- [ ] So that location 0 is never used
- [ ] It makes the table circular
>> key % (n − 2) is 0 whenever the key is a multiple of n − 2. A step of 0 never moves, so the insert would loop forever. Adding 1 makes the step at least 1.
:::
