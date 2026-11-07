---
title: Circular queues in arrays
summary: A queue can live in a fixed-size array. Instead of shifting values, the head and tail positions move forward and wrap around to the start with % (a ring), so enqueue and dequeue are both O(1).
lectures: Supplementary (not in the lecture notes)
supp: true
goals:
  - Explain why a plain array queue wastes space or time, and how wrapping around fixes it
  - Write enqueue and dequeue for a circular array queue using % MAX
  - Tell a full queue from an empty one
  - Compare array and linked-list queues
labs: [stackqueue]
---

## The problem with a plain array

The course builds queues from linked lists ([Queues](#l-e2-queues)). A queue can also be stored in an array of size MAX, with `head` (the position of the front value) and `tail` (where the next value goes).

If dequeue moved every value one place left, it would cost O(n). If instead `head` just moves forward, the front of the array is left empty: after MAX enqueues the tail reaches the end, and the queue says it is full even when most of it is free.

## Wrapping around

The fix is to treat the array as a ring: after position MAX − 1 comes position 0 again. Moving forward one place is

```cpp norun
i = (i + 1) % MAX;      // MAX - 1 wraps around to 0
```

Both ends move forward the same way, so neither operation ever shifts values: both are O(1).

| Field | Meaning |
|---|---|
| `head` | position of the front value (the next to leave) |
| `tail` | position where the next enqueued value goes |
| `count` | how many values are in the queue |

With `head == tail` the queue could be completely empty or completely full, so the code keeps `count` to tell the two apart. (Another common method leaves one slot always empty, so that `head == tail` can only mean empty.)

```cpp example="A circular queue that wraps around"
#include <iostream>
using namespace std;

const int MAX = 4;

struct CQueue {
	int data[MAX];
	int head;          // front value
	int tail;          // where the next value goes
	int count;         // values in the queue
};

void initQueue (CQueue * q) {
	q->head = 0;
	q->tail = 0;
	q->count = 0;
}

bool enqueue (CQueue * q, int n) {
	if (q->count == MAX)
		return false;                    // full
	q->data[q->tail] = n;
	q->tail = (q->tail + 1) % MAX;       // move forward, wrapping to 0
	q->count++;
	return true;
}

int dequeue (CQueue * q) {
	if (q->count == 0)
		return -999;                     // empty, as in the course's queues
	int value = q->data[q->head];
	q->head = (q->head + 1) % MAX;
	q->count--;
	return value;
}

int main () {
	CQueue q;
	initQueue (&q);
	for (int i = 1; i <= 4; i++)
		enqueue (&q, i * 10);
	cout << "full? " << !enqueue (&q, 50) << endl;
	cout << dequeue (&q) << " " << dequeue (&q) << endl;
	enqueue (&q, 50);                    // goes into position 0: it wrapped around
	enqueue (&q, 60);
	cout << "head " << q.head << ", tail " << q.tail << endl;
	while (q.count > 0)
		cout << dequeue (&q) << " ";
	cout << endl;
	return 0;
}
```

:::trace
MAX = 4. Enqueue 10, 20, 30, 40: positions 0 to 3 fill up and tail wraps to 0, with count = 4 (full). Dequeue twice: 10 and 20 leave and head moves to 2. Enqueue 50 and 60: they go into positions 0 and 1, and tail is now 2. The queue in order is 30, 40, 50, 60, even though 50 and 60 sit at the start of the array.
:::

:::quiz
MAX = 5, head = 3 and count = 4. Where does the next enqueued value go?
- [ ] Position 7
- [x] Position 2
- [ ] Position 4
- [ ] Nowhere: the queue is full
>> The values occupy 4 positions starting at 3: positions 3, 4, 0 and 1. So tail = (3 + 4) % 5 = 2, and the next value goes to position 2. With count = 4 < 5 the queue is not full.
:::

:::predict The queue wraps around twice. What does this print?
```cpp
#include <iostream>
using namespace std;

const int MAX = 3;
struct CQueue { int data[MAX]; int head; int tail; int count; };

bool enqueue (CQueue * q, int n) {
	if (q->count == MAX) return false;
	q->data[q->tail] = n;
	q->tail = (q->tail + 1) % MAX;
	q->count++;
	return true;
}
int dequeue (CQueue * q) {
	if (q->count == 0) return -999;
	int v = q->data[q->head];
	q->head = (q->head + 1) % MAX;
	q->count--;
	return v;
}

int main () {
	CQueue q;
	q.head = 0; q.tail = 0; q.count = 0;
	for (int i = 1; i <= 7; i++) {
		enqueue (&q, i);
		if (i % 2 == 0)
			cout << dequeue (&q) << " ";
	}
	cout << "| head " << q.head << " tail " << q.tail << " count " << q.count << endl;
	return 0;
}
```
:::

## Array or linked list?

| | Circular array queue | Linked-list queue (course) |
|---|---|---|
| enqueue / dequeue | O(1) | O(1) with head and tail pointers |
| Size limit | fixed at MAX | grows until memory runs out |
| Memory per value | just the value | the value plus a next pointer, and a new/delete per value |
| Can be full | yes | no |

Circular arrays are common when the size limit is known, such as a keyboard buffer or a network packet queue. Linked queues suit sizes that vary a lot.

## Common mistakes

- **Not wrapping.** Writing `tail++` instead of `tail = (tail + 1) % MAX` runs off the end of the array.
- **Confusing full and empty.** With only `head` and `tail`, `head == tail` is ambiguous; keep a count (or leave one slot empty).
- **Computing the length as tail − head.** After wrapping, tail can be smaller than head. Use count, or (tail − head + MAX) % MAX when one slot is kept empty.

:::teachback
Explain how a circular array queue makes both enqueue and dequeue O(1), and how it tells a full queue from an empty one.
>> head and tail move forward with (i + 1) % MAX, wrapping from the last position back to 0, so no values are ever shifted.
>> Each operation changes one array cell and a few integers, so it takes constant time.
>> When head == tail the queue may be empty or full, so a count of values (or one always-empty slot) tells them apart.
:::

:::remember
- Move forward with i = (i + 1) % MAX: the array becomes a ring.
- enqueue writes at tail and moves tail; dequeue reads at head and moves head. Both O(1).
- head == tail is ambiguous: keep count (count == 0 empty, count == MAX full).
:::
