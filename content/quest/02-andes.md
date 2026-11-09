# world: lists
title: The Chasqui Road
place: Cusco, Peru
when: 1500s
topic: lists
parts: c, m
scene: andes
color: #6fe08a
fragment: The Cord Key
blurb: Linked lists: nodes, top, traversal, insertion, deletion, reversing and merging, plus doubly linked and circular lists.

## ll-1 | Relay stations
goal: Build a linked list from nodes, a top pointer and NULL.
lessons: c1-building

@scene Cusco, Peru · 3,400 metres up · the air is thin
@say marco: I can't breathe and you want to talk data structures?
@say you: The professor's note said "the cords remember". She means the khipu: the Inca recorded numbers with knots on strings. And the roads. Look at this.
@say narrator: The Inca road system, the Qhapaq Ñan, ran for thousands of kilometres. Messages travelled by **chasquis**: relay runners. Each runner knew only one thing: where the next station was.
@say prof: (from her journal) *A chasqui road is a linked list. Each station holds a message and knows only the way to the next station. You cannot jump to station 7: you must run there from the first.*
@learn Nodes, top and NULL
A **linked list** is a chain of **nodes** on the heap. Each node holds a value and the **address of the next node**:

```cpp
struct Node {
	int data;
	Node * next;
};
```

- **top** (also called head) holds the address of the **first** node. It is the only way into the list.
- The last node's `next` is **NULL**: that is how you know the list has ended.
- An empty list is just `top == NULL`.

```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

int main() {
	Node * top = createNode (10);          // the first station
	top->next = createNode (20);           // the second
	top->next->next = createNode (30);     // the third
	cout << top->data << " " << top->next->data << " " << top->next->next->data << endl;
	return 0;
}
```

Compared with an array: a list grows and shrinks one node at a time and can insert in the middle without shifting anything, but reaching the k-th node means walking k steps from top (no `A[k]`).
@say pip: Squawk! Last next is NULL! Last next is NULL!
@listsim list="10 20" vars="p=30*" goal="10 20 30"
The relay has two stations, 10 and 20. A new station p (30) has been built. Link it on at the end of the road.
p->next = NULL;
top->next->next = p;
~ top = p;
~ p->next = top;
>> The last node is `top->next` (20), so its next must hold p's address. p's own next is already NULL.
@quiz In a linked list, how do you know you have reached the last node?
- [ ] Its data is 0
- [x] Its next is NULL
- [ ] It is the node top points to
- [ ] You count to the list's size
>> The last node's next pointer is NULL. top points to the first node.
@quiz Which is true of a linked list but not of an array?
- [ ] You can read the k-th element in one step
- [x] You can insert a node in the middle without shifting the others
- [ ] Its elements sit next to each other in memory
- [ ] Its size is fixed when it is made
>> Inserting into a list only rewires two pointers. Arrays give instant indexing but must shift elements to insert.
@relic khipu | A khipu | The Inca had no written script, yet they ran an empire of millions. They recorded numbers (census counts, tribute, stores) on khipus: cords with knots, often in base 10, hanging from a main cord. The record-keepers who could read them were called khipukamayuq.
@journal
- A node holds `data` and `next`; top points to the first node; the last `next` is NULL
- An empty list is `top == NULL`
- Lists grow node by node and insert without shifting, but reaching the k-th node takes k steps

## ll-2 | Running the road
goal: Traverse a list with curr to print, count, search and find the last node.
lessons: c2-traversal

@scene The road to Machu Picchu · stone steps into the clouds
@say marco: So to get to the fifth station, a runner has to start at the first and go station by station.
@say you: That's traversal. Every list function starts the same way.
@learn The traversal loop
Every list walk uses a pointer, usually called **curr**, that starts at top and moves along:

```cpp
void printList (Node * top) {
	Node * curr = top;
	while (curr != NULL) {        // stop when we fall off the end
		cout << curr->data << " ";
		curr = curr->next;        // move to the next node
	}
	cout << endl;
}

int size (Node * top) {
	int count = 0;
	Node * curr = top;
	while (curr != NULL) {
		count++;
		curr = curr->next;
	}
	return count;
}
```

`contains` returns true as soon as it finds the key. **getLast** must stop **on** the last node, not after it, so its test is different:

```cpp
Node * getLast (Node * top) {
	if (top == NULL)
		return NULL;              // an empty list has no last node
	Node * curr = top;
	while (curr->next != NULL)    // stop ON the last node
		curr = curr->next;
	return curr;
}
```

With `while (curr != NULL)` getLast would run one node too far and return NULL. That is the lecture's favourite trap.
@listsim list="5 8 13 21" vars="curr=5" goal="5 8 13 21" at="curr=21"
Be the getLast loop: move curr until it rests ON the last station (21). Do not fall off the end.
curr = curr->next;
curr = curr->next;
curr = curr->next;
~ curr = NULL;
~ curr = top;
>> Three moves take curr from 5 to 21. One more would set curr to NULL: off the end of the road.
@predict What does this print?
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * p = new Node;
	p->data = n;
	p->next = NULL;
	return p;
}

int main() {
	Node * top = createNode (4);
	top->next = createNode (9);
	top->next->next = createNode (2);
	int count = 0, total = 0;
	Node * curr = top;
	while (curr != NULL) {
		count++;
		total = total + curr->data;
		curr = curr->next;
	}
	cout << count << " " << total << endl;
	return 0;
}
```
>> The loop visits 4, 9 and 2: three nodes, total 15.
@fill Finish contains: it returns true if key is somewhere in the list.
```cpp
bool contains (Node * top, int key) {
	Node * curr = top;
	while (curr [[!= NULL]]) {
		if (curr->data == key)
			return [[true]];
		curr = [[curr->next]];
	}
	return [[false]];
}
```
>> Walk until curr falls off the end; return true the moment the key matches; if the loop ends, the key is not there.
@quiz What does getLast return if its loop is `while (curr != NULL) curr = curr->next;` and then `return curr;`?
- [ ] The last node
- [x] NULL, every time
- [ ] The first node
- [ ] It crashes on an empty list only
>> That loop only stops when curr is NULL, so it always returns NULL: one step too far. Test `curr->next != NULL` instead.
@code ex="list-size"
The khipukamayuq need a node counter. Write size.
@journal
- Traverse with `curr = top; while (curr != NULL) { ...; curr = curr->next; }`
- getLast stops ON the last node: `while (curr->next != NULL)` (and handle an empty list first)
- contains returns true the moment it finds the key, false after the loop

## ll-3 | New stations
goal: Insert at the head, at the tail and in sorted order, in the right order of steps.
lessons: c3-insertion

@scene A collapsed bridge over the Apurímac gorge
@say marco: The rope bridge is down. The road continues on the other side. We need to rebuild the link without dropping the rest of the road into the gorge.
@say pip: Squawk! Link the new node FIRST! Link the new node FIRST!
@learn Insertion: the order of the steps is everything
**At the head** (the new node becomes the first):

```cpp
Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;      // 1. the new node points to the old first node
	return newNode;           // 2. it becomes the new top (the caller writes top = ...)
}
```

**At the tail**: find the last node with getLast, then `last->next = newNode;`. If the list is empty, the new node is the whole list.

**In the middle**, after a node curr:

```cpp
newNode->next = curr->next;   // 1. hold on to the rest of the road
curr->next = newNode;         // 2. then connect curr to the new node
```

If you do step 2 first, `curr->next` no longer holds the rest of the list: those nodes are **lost**.

**In sorted order** (`insertSorted`), there are cases to handle, the way the lectures list them:
1. The list is empty, or n is smaller than the first value: insert at the head.
2. Otherwise walk curr until `curr->next` is NULL or `curr->next->data >= n`, then insert after curr.
@listsim list="10 20 40" vars="curr=20 newNode=30*" goal="10 20 30 40"
Rebuild the bridge: insert newNode (30) after curr (20). Get the order right, or the rest of the road falls into the gorge.
newNode->next = curr->next;
curr->next = newNode;
~ curr = newNode;
~ newNode->next = top;
>> First newNode->next takes curr's old next (40), then curr->next points to newNode. The other order loses 40.
@listsim list="20 30" vars="newNode=10*" goal="10 20 30"
Insert at the head: newNode (10) must become the first station.
newNode->next = top;
top = newNode;
~ top->next = newNode;
~ newNode = top;
>> Point the new node at the old first node, then move top to it. Moving top first would lose 20 and 30.
@order Put insertAtTail together (the lecture's version).
Node * insertAtTail (Node * top, int n) {
	Node * newNode = createNode (n);
	if (top == NULL)
		return newNode;
	Node * lastNode = getLast (top);
	lastNode->next = newNode;
	return top;
}
~ 	top = newNode;
>> An empty list becomes just the new node. Otherwise the new node hangs off the last node, and top does not change.
@quiz insertSorted is called with n = 5 on the list 8 → 12 → 20. Which case applies?
- [x] n is smaller than the first value, so the new node goes at the head
- [ ] Walk to the end and insert at the tail
- [ ] Insert between 8 and 12
- [ ] The list is empty
>> 5 < 8, the first value, so 5 becomes the new first node, exactly like insertAtHead.
@code ex="list-insert-sorted"
A runner needs stations kept in order of distance. Write insertSorted.
@journal
- Insert at the head: `newNode->next = top;` then `top = newNode;`
- Insert after curr: `newNode->next = curr->next;` FIRST, then `curr->next = newNode;`
- insertAtTail: an empty list becomes the new node; otherwise `getLast(top)->next = newNode;`
- insertSorted cases: empty or smaller than the first (head), otherwise walk to the gap

## ll-4 | Closing a station
goal: Delete the first node and a node with a given key, with no leaks and no crashes.
lessons: c4-deletion

@scene Night camp · Silas's men have been seen on the trail
@say marco: Somebody tampered with the relay. One station's sending fake messages. We need to cut it out of the road.
@learn Deleting a node: prev and curr
**Delete the first node:**

```cpp
Node * deleteAtHead (Node * top) {
	if (top == NULL)
		return NULL;
	Node * temp = top;        // remember it, so we can delete it
	top = top->next;          // the second node becomes the first
	delete temp;
	return top;
}
```

**Delete the node holding key** needs the node **before** it, because that node's next must skip over the deleted one. Walk two pointers, **prev** and **curr**:

```cpp
Node * deleteKey (Node * top, int key) {
	if (top == NULL)                 // case 1: empty list
		return NULL;
	if (top->data == key)            // case 2: the key is first
		return deleteAtHead (top);
	Node * prev = top;
	Node * curr = top->next;
	while (curr != NULL && curr->data != key) {
		prev = curr;
		curr = curr->next;
	}
	if (curr != NULL) {              // case 3: found in the middle or at the end
		prev->next = curr->next;     // bypass curr
		delete curr;                 // then free it
	}
	return top;                      // case 4: not found, nothing changes
}
```

Order matters again: bypass first, delete second. And the test `curr != NULL &&` comes **before** `curr->data`, so a missing key never follows NULL.
@listsim list="10 20 30 40" vars="prev=20 curr=30" goal="10 20 40" freed="1"
Cut out the fake station: curr (30) must be removed from the road AND freed, with no leak and no dangling access.
prev->next = curr->next;
delete curr;
~ curr = curr->next;
~ prev->next = NULL;
>> Bypass curr first so the road goes 20 → 40, then delete it. Deleting first would make `curr->next` a dangling access.
@listsim list="7 14 21" vars="temp=7" goal="14 21" freed="1"
deleteAtHead: temp already points to the first node. Make 14 the first node and free the old one.
top = top->next;
delete temp;
~ delete top;
~ top = NULL;
>> Move top to the second node, then delete the old first node through temp.
@quiz Why must the loop test be `curr != NULL && curr->data != key`, in that order?
- [ ] It is faster that way
- [x] If curr is NULL, the second test is skipped, so NULL is never followed
- [ ] The compiler requires NULL checks first
- [ ] Either order works
>> `&&` stops as soon as the left side is false. With the order reversed, a missing key would make the loop read `NULL->data` and crash.
@predict deleteKey on a list, three times. What does it print?
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * p = new Node;
	p->data = n;
	p->next = NULL;
	return p;
}

Node * deleteKey (Node * top, int key) {
	if (top == NULL)
		return NULL;
	if (top->data == key) {
		Node * temp = top;
		top = top->next;
		delete temp;
		return top;
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

void printList (Node * top) {
	for (Node * c = top; c != NULL; c = c->next)
		cout << c->data << " ";
	cout << endl;
}

int main() {
	Node * top = createNode (3);
	top->next = createNode (6);
	top->next->next = createNode (9);
	top = deleteKey (top, 6);
	printList (top);
	top = deleteKey (top, 3);
	printList (top);
	top = deleteKey (top, 5);
	printList (top);
	return 0;
}
```
>> 6 is in the middle (bypassed), 3 is first (top moves on), and 5 is not there, so nothing changes.
@code ex="list-delete-key"
Write deleteKey yourself, with every case.
@journal
- deleteAtHead: save top in temp, move top on, delete temp
- deleteKey walks prev and curr; bypass with `prev->next = curr->next;` THEN `delete curr;`
- Cases: empty list, key first, key later, key missing
- `curr != NULL && curr->data != key`: the NULL test must come first

## ll-5 | Comparing records
goal: Compare two lists, reverse a list in place, and merge two sorted lists.
lessons: c5-more-ops

@scene The Temple of the Sun · Qorikancha, Cusco
@say narrator: The Spanish built a church on top of the Inca Temple of the Sun, the Qorikancha, but its curved stone walls survived earthquakes that toppled the newer buildings.
@say you: The professor's note is carved into the stone in tiny numbers. But it's written backwards.
@say marco: Then we reverse it. Can you reverse a linked list without making a new one?
@learn isEqual, reverse and merge
**isEqual** walks two lists side by side; they are equal only if every pair of values matches and both end at the same time:

```cpp
bool isEqual (Node * a, Node * b) {
	while (a != NULL && b != NULL) {
		if (a->data != b->data)
			return false;
		a = a->next;
		b = b->next;
	}
	return a == NULL && b == NULL;   // both finished together?
}
```

**reverse** flips every next pointer in one pass, using three pointers:

```cpp
Node * reverse (Node * top) {
	Node * prev = NULL;
	Node * curr = top;
	while (curr != NULL) {
		Node * nextNode = curr->next;   // 1. remember the rest
		curr->next = prev;              // 2. flip this node's arrow
		prev = curr;                    // 3. step prev forward
		curr = nextNode;                // 4. step curr forward
	}
	return prev;                        // the old last node is the new top
}
```

**Merging two sorted lists** repeatedly takes the smaller front node. The lecture writes it recursively:

```cpp
Node * mergeSorted (Node * a, Node * b) {
	if (a == NULL) return b;
	if (b == NULL) return a;
	if (a->data <= b->data) {
		a->next = mergeSorted (a->next, b);
		return a;
	}
	b->next = mergeSorted (a, b->next);
	return b;
}
```
@listsim list="1 2 3" vars="prev=NULL curr=1 nextNode=NULL" goal="3 2 1" at="curr=NULL"
Be the reverse loop. Each pass: remember the rest, flip the arrow, step prev, step curr. When curr reaches NULL, move top to prev.
nextNode = curr->next;
curr->next = prev;
prev = curr;
curr = nextNode;
nextNode = curr->next;
curr->next = prev;
prev = curr;
curr = nextNode;
nextNode = curr->next;
curr->next = prev;
prev = curr;
curr = nextNode;
top = prev;
~ top = curr;
~ curr->next = nextNode;
>> Four statements per node, three nodes, then top = prev: the old last node (3) is the new first.
@predict What does this print? (Two lists compared with isEqual.)
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * make (int a, int b, int c, int n) {
	int v[3] = {a, b, c};
	Node * top = NULL;
	for (int i = n - 1; i >= 0; i--) {
		Node * p = new Node;
		p->data = v[i];
		p->next = top;
		top = p;
	}
	return top;
}

bool isEqual (Node * a, Node * b) {
	while (a != NULL && b != NULL) {
		if (a->data != b->data)
			return false;
		a = a->next;
		b = b->next;
	}
	return a == NULL && b == NULL;
}

int main() {
	Node * x = make (1, 2, 3, 3);
	Node * y = make (1, 2, 3, 3);
	Node * z = make (1, 2, 0, 2);
	cout << isEqual (x, y) << " " << isEqual (x, z) << " " << isEqual (z, z) << endl;
	return 0;
}
```
>> x and y hold 1 2 3. z is 1 2 (shorter), so x and z differ: the loop ends with x not finished. Any list equals itself. cout prints true as 1 and false as 0.
@quiz The merge of the sorted lists 2 → 5 → 9 and 3 → 4 → 10 is:
- [ ] 2 → 3 → 5 → 4 → 9 → 10
- [x] 2 → 3 → 4 → 5 → 9 → 10
- [ ] 2 → 5 → 9 → 3 → 4 → 10
- [ ] 3 → 4 → 10 → 2 → 5 → 9
>> Merging always takes the smaller of the two fronts, so the result is sorted.
@code ex="list-reverse"
Write reverse with prev, curr and nextNode.
@journal
- isEqual: walk both lists together; equal only if all values match and both end together
- reverse: `nextNode = curr->next; curr->next = prev; prev = curr; curr = nextNode;` then return prev
- Merging sorted lists takes the smaller front each time (recursively in the lecture)

## ll-6 | Roads that loop back
goal: Know doubly linked and circular lists, and what each is for.
lessons: m1-doubly-circular, c6-deep-lists

@scene The Inca road's last station · a circle of stones
@say marco: This station has two paths: one forward, one back. And the last stone points back to the first.
@learn Doubly linked and circular lists (beyond the notes)
A **doubly linked list** node has two pointers: **next** and **prev**:

```cpp
struct DNode {
	int data;
	DNode * prev;
	DNode * next;
};
```

- You can walk both ways, and delete a node when you only have a pointer to it (its prev is right there).
- Every insert and delete must fix **twice as many** pointers. Inserting x after p: `x->next = p->next; x->prev = p; if (p->next != NULL) p->next->prev = x; p->next = x;`

A **circular list**: the last node's next points back to the **first** node instead of NULL. There is no NULL to stop at, so a traversal stops when it gets **back to where it started**:

```cpp
Node * curr = top;
do {
	cout << curr->data << " ";
	curr = curr->next;
} while (curr != top);
```

Circular lists suit things that go round and round: players taking turns, a round-robin scheduler, a music playlist on repeat. A `while (curr != NULL)` loop on a circular list never ends.
@quiz What goes wrong if you traverse a circular list with `while (curr != NULL)`?
- [ ] It skips the first node
- [x] It never stops, because no next is ever NULL
- [ ] It crashes on the last node
- [ ] Nothing: it works the same
>> In a circular list the last node points back to the first, so curr never becomes NULL. Stop when curr gets back to top.
@quiz In a doubly linked list, which pointers change when you delete a middle node x?
- [ ] Only x->prev->next
- [x] x->prev->next and x->next->prev
- [ ] Only x->next->prev
- [ ] top only
>> The node before x must skip forward over it, and the node after x must skip back over it: two pointers.
@type In a circular list 4 → 7 → 1 → (back to 4), start at 7 and take 5 steps along next. Which value are you on?
= 4
>> From 7: step 1 is 1, step 2 is 4, step 3 is 7, step 4 is 1, step 5 is 4. Every 3 steps you are back where you started, and 5 = 3 + 2.
@say narrator: In the circle of stones, a knotted cord: the khipu the professor described. Its knots spell, in base 10, a year: **1785**. And a word scratched beside it: **SEVILLA**.
@say marco: Seville, Spain? We're crossing the Atlantic now?
@say you: First, there's a temple in Mexico on her list. The cord has a pyramid drawn on it.
@boss
The Endless Chain blocks the road: a list whose last next was never set to NULL. Defeat it with exam-style list questions.
@journal
- Doubly linked: `prev` and `next`; walk both ways; inserts and deletes fix two links each
- Circular: the last node points back to the first; stop when you return to the start
- `while (curr != NULL)` never ends on a circular list
