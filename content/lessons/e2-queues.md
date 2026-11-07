---
title: Queues
summary: A queue adds at one end (the tail) and removes from the other (the head), so values leave in the order they arrived (FIFO). Keeping both a head and a tail pointer makes both operations O(1).
lectures: COMP 1603 review; used in Lectures 10, 16 and 17
goals:
  - Explain FIFO and predict a sequence of enqueues and dequeues
  - Write the Queue struct, enqueue and dequeue with head and tail pointers
  - Handle the two edge cases - enqueue into an empty queue, and dequeue of the last node
labs: [stackqueue, memory]
---

## First in, first out

A **queue** works like a line at a bank: people join at the back and are served from the front. The first value added is the first removed: **FIFO** (First In, First Out).

| Operation | What it does |
|---|---|
| `initQueue` | creates and returns an empty queue |
| `isEmpty` | returns true if there are no elements |
| `enqueue` | inserts an element at the end (tail) of the queue |
| `dequeue` | removes the element at the front (head) of the queue |

:::trace
enqueue 10, enqueue 20, enqueue 15, dequeue, enqueue 30, dequeue: the dequeues return 10, then 20. The queue holds 15, 30 (front first).
:::

## Two pointers: head and tail

Removing from the front of a linked list is easy (deleteAtHead). Adding at the end normally means walking the whole list, which is O(n). A queue avoids that walk by remembering where the end is:

```cpp norun
struct Queue {
	Node * head;      // the front: dequeue removes here
	Node * tail;      // the back: enqueue adds here
};
```

- **initQueue** sets `queue->head` and `queue->tail` to NULL.
- **isEmpty** returns true if `queue->head` is NULL.

## enqueue

```cpp norun
void enqueue (Queue * queue, int data) {
	Node * newNode = createNode (data);
	if (queue->tail == NULL) {          // the queue is empty
		queue->head = newNode;
		queue->tail = newNode;
	}
	else {
		queue->tail->next = newNode;    // link after the last node
		queue->tail = newNode;          // the new node is the new tail
	}
}
```

When the queue is empty there is no last node to link after, so the new node becomes both the head and the tail.

## dequeue

```cpp norun
int dequeue (Queue * queue) {
	if (queue->head == NULL)
		return -999;                    // empty
	Node * toDelete = queue->head;
	int save = toDelete->data;
	queue->head = queue->head->next;
	if (queue->head == NULL)            // we removed the last node
		queue->tail = NULL;
	delete toDelete;
	return save;
}
```

:::why
Why reset `tail` when the last node goes? After that node is deleted, `tail` would still hold its address: a dangling pointer. The next enqueue would test `queue->tail == NULL`, find it is not NULL, and write into the deleted node. Setting tail to NULL keeps head and tail agreeing that the queue is empty.
:::

```cpp example="A queue with head and tail"
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

struct Queue {
	Node * head;
	Node * tail;
};

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

Queue * initQueue () {
	Queue * queue = new Queue;
	queue->head = NULL;
	queue->tail = NULL;
	return queue;
}

bool isEmpty (Queue * queue) {
	return queue->head == NULL;
}

void enqueue (Queue * queue, int data) {
	Node * newNode = createNode (data);
	if (queue->tail == NULL) {
		queue->head = newNode;
		queue->tail = newNode;
	}
	else {
		queue->tail->next = newNode;
		queue->tail = newNode;
	}
}

int dequeue (Queue * queue) {
	if (queue->head == NULL)
		return -999;
	Node * toDelete = queue->head;
	int save = toDelete->data;
	queue->head = queue->head->next;
	if (queue->head == NULL)
		queue->tail = NULL;
	delete toDelete;
	return save;
}

int main() {
	Queue * q = initQueue ();
	enqueue (q, 10);
	enqueue (q, 20);
	enqueue (q, 30);
	cout << dequeue (q) << " ";
	enqueue (q, 40);
	while (!isEmpty (q))
		cout << dequeue (q) << " ";
	cout << endl;
	enqueue (q, 50);
	cout << dequeue (q) << endl;
	return 0;
}
```

The last two lines empty the queue and then use it again. That only works because dequeue reset `tail` to NULL. Both operations are **O(1)**.

:::parsons Put the lines of enqueue in order.
void enqueue (Queue * queue, int data) {
	Node * newNode = createNode (data);
	if (queue->tail == NULL) {
		queue->head = newNode;
		queue->tail = newNode;
	}
	else {
		queue->tail->next = newNode;
		queue->tail = newNode;
	}
}
~		queue->head = queue->tail;
:::


:::teachback
Explain why a queue keeps both a head and a tail pointer, and what must happen to `tail` when the last node is dequeued.
>> enqueue adds at the tail; without a tail pointer it would have to walk the whole list (O(n)).
>> dequeue removes at the head, so both operations are O(1).
>> When the queue becomes empty, `tail` must be set to NULL too, or it would point at a deleted node.
>> Enqueue into an empty queue must make both head and tail point to the new node.
:::

:::quiz
Starting with an empty queue: enqueue 4, enqueue 9, dequeue, enqueue 1, enqueue 6, dequeue. What is in the queue, front first?
- [ ] 9 1 6
- [x] 1 6
- [ ] 4 1
- [ ] 6 1
>> After 4, 9 and a dequeue (removes 4): [9]. Then [9, 1, 6]. The second dequeue removes 9, leaving 1, 6.
:::

:::quiz
Why does `dequeue` set `tail` to NULL when it removes the last remaining node?
- [ ] To free the node's memory
- [x] So that head and tail both say the queue is empty; otherwise tail would still point at a deleted node
- [ ] Because enqueue never uses tail
- [ ] It is not needed
>> After the last node is deleted, a non-NULL tail is a dangling pointer. The next enqueue would see tail != NULL and write into freed memory.
:::

:::quiz
Which change would make enqueue O(n) instead of O(1)?
- [ ] Making dequeue return -999 when empty
- [ ] Storing doubles instead of ints
- [x] Removing the tail pointer, so enqueue must walk to the last node each time
- [ ] Adding at the tail and removing at the head
>> Without a tail pointer, enqueue would have to find the end of the list first, which takes time proportional to its length.
:::
