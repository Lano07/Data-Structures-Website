# world: sq
title: The Silver Locks
place: Panama Canal
when: 1904–1914
topic: stacks
parts: e, m
scene: panama
color: #5b8cff
fragment: The Lock Key
blurb: Stacks and queues: LIFO and FIFO, built from linked lists and arrays, circular queues, and what they are used for.

## sq-1 | Crates in the hold
goal: Use a stack: push, pop, peek and isEmpty, and build one from a linked list.
lessons: e1-stacks

@scene Colón, Panama · the Atlantic entrance to the canal
@say marco: The Panama Canal. Eighty-two kilometres, ocean to ocean. They lift whole ships 26 metres up into Gatún Lake with water.
@say narrator: The United States built the canal from 1904 to 1914, after a French attempt in the 1880s collapsed. Tens of thousands of workers came from the Caribbean, many from Barbados and Jamaica. They were paid on the "Silver Roll", in silver, while white American workers were paid in gold.
@say you: The professor's jade disc said "the silver locks". The answer is here somewhere.
@say marco: First we load the Kiskadee. Crates go in the hold, and the last one in is the first one out.
@learn The stack: last in, first out (LIFO)
A **stack** only lets you work at one end, the **top**:

- `push(x)`: put x on top.
- `pop()`: take the top value off and return it.
- `peek()` (or top): look at the top value without removing it.
- `isEmpty()`: true when there is nothing on it.

The last value pushed is the first popped: **LIFO**. Push 1, 2, 3 and pops return 3, 2, 1.

**Built from a linked list**, the top of the stack is the first node. Push is insertAtHead, pop is deleteAtHead, both O(1):

```cpp
struct Stack {
	Node * top;
};

void push (Stack * s, int data) {
	Node * newNode = createNode (data);
	newNode->next = s->top;
	s->top = newNode;
}

int pop (Stack * s) {
	if (s->top == NULL)
		return -999;               // empty: nothing to pop
	Node * toDelete = s->top;
	int save = toDelete->data;
	s->top = s->top->next;
	delete toDelete;
	return save;
}
```

**Built from an array**, keep an index `top` of the last used slot: push does `A[++top] = x`, pop does `return A[top--]`. It is just as fast, but the array can be full.
@predict Loading and unloading the hold. What does this print?
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

struct Stack {
	Node * top;
};

void push (Stack * s, int data) {
	Node * n = new Node;
	n->data = data;
	n->next = s->top;
	s->top = n;
}

int pop (Stack * s) {
	if (s->top == NULL)
		return -999;
	Node * t = s->top;
	int v = t->data;
	s->top = t->next;
	delete t;
	return v;
}

int main() {
	Stack s;
	s.top = NULL;
	push (&s, 4);
	push (&s, 7);
	cout << pop (&s) << " ";
	push (&s, 1);
	push (&s, 9);
	cout << pop (&s) << " " << pop (&s) << " ";
	cout << pop (&s) << " " << pop (&s) << endl;
	return 0;
}
```
>> 7 was pushed last, so it pops first. Then 9 and 1 pop (last in, first out), then 4, and the stack is empty, so the last pop returns -999.
@listsim list="7 4" vars="newNode=9*" goal="9 7 4"
push(9) on a linked stack: the new crate goes on top.
newNode->next = top;
top = newNode;
~ top->next = newNode;
>> A push is an insertAtHead: point the new node at the old top, then move top to it.
@listsim list="9 7 4" vars="toDelete=9" goal="7 4" freed="1"
pop(): take the top crate off. toDelete already points at it.
top = top->next;
delete toDelete;
~ delete top;
>> A pop is a deleteAtHead: move top down one node, then free the old top.
@quiz Push A, push B, pop, push C, pop, pop. What order were the values popped in?
- [ ] A, B, C
- [x] B, C, A
- [ ] C, B, A
- [ ] B, A, C
>> After pushing A and B, pop gives B. Push C, pop gives C. Then only A is left.
@code ex="stack-push-pop"
Write push and pop for a linked stack.
@journal
- Stack = LIFO: push, pop, peek, isEmpty, all at the top
- Linked stack: push is insertAtHead, pop is deleteAtHead: O(1)
- Array stack: an index top; push `A[++top] = x`, pop `A[top--]`; it can be full

## sq-2 | Ships at the locks
goal: Use a queue: enqueue at the tail, dequeue at the head, and handle the empty case.
lessons: e2-queues

@scene Gatún Locks · ships waiting in line
@say marco: Look at the line of ships. First to arrive, first through the locks. Nobody jumps the queue at Gatún.
@say narrator: Small electric locomotives called "mules" run on rails along the lock walls, holding each ship steady with cables as the water raises it.
@learn The queue: first in, first out (FIFO)
A **queue** adds at one end and removes from the other:

- `enqueue(x)`: add x at the **tail** (the back).
- `dequeue()`: remove and return the value at the **head** (the front).
- `isEmpty()`: true when the queue has nothing in it.

**Built from a linked list**, keep two pointers, **head** and **tail**, so both operations are O(1):

```cpp
struct Queue {
	Node * head;
	Node * tail;
};

void enqueue (Queue * q, int data) {
	Node * newNode = createNode (data);
	if (q->tail == NULL) {          // empty queue: the node is both ends
		q->head = newNode;
		q->tail = newNode;
	}
	else {
		q->tail->next = newNode;    // hang it off the old tail
		q->tail = newNode;
	}
}

int dequeue (Queue * q) {
	if (q->head == NULL)
		return -999;
	Node * toDelete = q->head;
	int save = toDelete->data;
	q->head = q->head->next;
	if (q->head == NULL)            // the queue just became empty
		q->tail = NULL;             // so tail must not point at the deleted node
	delete toDelete;
	return save;
}
```

The two traps: an **empty** queue on enqueue (both head and tail change) and the **last** dequeue (tail must become NULL, or it dangles).
@listsim list="12 30" head="head" vars="tail=30 newNode=45*" goal="12 30 45" at="tail=45"
enqueue(45): the new ship joins the back of the line. Keep tail pointing at the last ship.
tail->next = newNode;
tail = newNode;
~ head = newNode;
~ newNode->next = head;
>> Hang the new node off the old tail, then move tail to it. head does not change.
@predict Ships through the locks. What does this print?
```cpp
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

void enqueue (Queue * q, int data) {
	Node * n = new Node;
	n->data = data;
	n->next = NULL;
	if (q->tail == NULL) { q->head = n; q->tail = n; }
	else { q->tail->next = n; q->tail = n; }
}

int dequeue (Queue * q) {
	if (q->head == NULL)
		return -999;
	Node * t = q->head;
	int v = t->data;
	q->head = t->next;
	if (q->head == NULL)
		q->tail = NULL;
	delete t;
	return v;
}

int main() {
	Queue q;
	q.head = q.tail = NULL;
	enqueue (&q, 5);
	enqueue (&q, 8);
	enqueue (&q, 2);
	cout << dequeue (&q) << " ";
	enqueue (&q, 6);
	cout << dequeue (&q) << " " << dequeue (&q) << " " << dequeue (&q) << " ";
	cout << (q.tail == NULL ? "empty" : "not empty") << endl;
	return 0;
}
```
>> First in, first out: 5, then 8 and 2, then 6. The last dequeue empties the queue, so tail is set back to NULL.
@quiz In dequeue, why set `tail = NULL` when head becomes NULL?
- [ ] To free the tail node's memory
- [x] Otherwise tail still points at the node that was just deleted (a dangling pointer)
- [ ] Because enqueue checks head, not tail
- [ ] It is not needed
>> When the last node is removed, tail still holds its address. The next enqueue checks `tail == NULL`, and would hang the new node off deleted memory.
@code ex="queue-enqueue-dequeue"
Write enqueue and dequeue with head and tail.
@journal
- Queue = FIFO: enqueue at the tail, dequeue at the head
- Linked queue keeps head and tail: both operations O(1)
- Enqueue on empty sets head and tail; the last dequeue must reset tail to NULL

## sq-3 | Signals and brackets
goal: Use stacks for brackets and reversing, and queues for level order and BFS.
lessons: e3-applications

@scene The control tower at Miraflores · a panel of signal lamps
@say marco: The lock controllers send nested signals: open gate, open valve, close valve, close gate. If they don't close in the right order, the water floods out.
@say you: Nested open-close pairs. That's bracket matching. A stack problem.
@learn What stacks and queues are for
**Balanced brackets with a stack.** Scan left to right:

1. An **opening** bracket `( [ {`: push it.
2. A **closing** bracket: the stack must not be empty, and the popped bracket must **match** it.
3. At the end, the stack must be **empty** (nothing left unclosed).

`{ [ ( ) ] }` is balanced. `( ]` fails at step 2 (mismatch). `( (` fails at step 3. `)` fails at step 2 (empty stack).

**Other stack jobs:** reversing anything (push it all, pop it all), undo in an editor, the **call stack** that makes recursion work, and evaluating postfix expressions (`3 4 + 2 *`: push numbers; an operator pops two, applies itself and pushes the result).

**Queue jobs:** anything served in arrival order: printer jobs, ships at locks, customers. In this course, a queue drives **level order traversal** of a tree and **breadth-first search** of a graph.
@quiz Which string is balanced?
- [ ] `( [ ) ]`
- [x] `[ ( ) { } ]`
- [ ] `( ( )`
- [ ] `] [`
>> In `[ ( ) { } ]` every closing bracket matches the most recent unclosed opening one, and nothing is left open. `( [ ) ]` pops `[` for `)`: a mismatch.
@type Scan `{ ( [ ] ) ( ` with the bracket algorithm. How many brackets are still on the stack at the end?
= 2
>> `{` push, `(` push, `[` push, `]` pops `[`, `)` pops `(`, `(` push. Left on the stack: `{` and `(`. Two unclosed brackets: not balanced.
@predict Evaluating postfix with a stack. What does this print?
```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
	int stack[10], top = -1;
	string tokens[7] = {"3", "4", "+", "2", "*", "7", "-"};
	for (int i = 0; i < 7; i++) {
		string t = tokens[i];
		if (t == "+" || t == "-" || t == "*") {
			int b = stack[top--];
			int a = stack[top--];
			int r = t == "+" ? a + b : t == "-" ? a - b : a * b;
			stack[++top] = r;
		}
		else
			stack[++top] = t[0] - '0';
	}
	cout << stack[top] << endl;
	return 0;
}
```
>> 3 4 + gives 7; 7 2 * gives 14; 14 7 − gives 7. The order matters for −: the second pop is the left operand.
@quiz Which traversal of a tree uses a queue?
- [ ] Preorder
- [ ] Inorder
- [x] Level order
- [ ] Postorder
>> Level order visits a node, then enqueues its children, so nodes come out level by level. The recursive traversals use the call stack instead.
@code ex="balanced-brackets"
Write the bracket checker the lock controllers need.
@journal
- Balanced brackets: push openers; a closer must match the popped opener; the stack must end empty
- Stacks: reversing, undo, the call stack, postfix evaluation
- Queues: arrival-order service, level order traversal, breadth-first search

## sq-4 | The ring of mules
goal: Run a queue in a circular array with head and tail indexes.
lessons: m2-circular-queue, e4-deep-stacks-queues

@scene Pedro Miguel Locks · the mules circle back along their track
@say marco: Watch the mules. When one reaches the end of the wall, it doesn't vanish: it goes round and comes back to the start.
@learn A queue in a circular array (beyond the notes)
A queue in an ordinary array has a problem: dequeue moves the head forward, so the front of the array fills with dead slots. The fix is to **wrap around**: after the last slot comes slot 0 again.

```cpp
const int N = 5;
int Q[N];
int head = 0, tail = 0, count = 0;   // tail = where the next value goes

void enqueue (int x) {
	if (count == N) return;          // full
	Q[tail] = x;
	tail = (tail + 1) % N;           // wrap around
	count++;
}

int dequeue () {
	if (count == 0) return -999;     // empty
	int x = Q[head];
	head = (head + 1) % N;
	count--;
	return x;
}
```

`% N` is what makes it circular: from index 4 (the last of 5), `(4 + 1) % 5` is 0. Keeping a **count** is the easiest way to tell **full** (count == N) from **empty** (count == 0), because in both cases head == tail.
@type A circular queue of size N = 5 has tail = 4. After one more enqueue, what is tail?
= 0
>> tail = (4 + 1) % 5 = 0: it wraps around to the start.
@predict What does this print?
```cpp
#include <iostream>
using namespace std;

const int N = 4;
int Q[N];
int head = 0, tail = 0, cnt = 0;

void enqueue (int x) {
	if (cnt == N) { cout << "full "; return; }
	Q[tail] = x;
	tail = (tail + 1) % N;
	cnt++;
}

int dequeue () {
	if (cnt == 0) return -1;
	int x = Q[head];
	head = (head + 1) % N;
	cnt--;
	return x;
}

int main() {
	enqueue (1); enqueue (2); enqueue (3);
	cout << dequeue () << " " << dequeue () << " ";
	enqueue (4); enqueue (5); enqueue (6); enqueue (7);
	cout << "head=" << head << " tail=" << tail << " " << dequeue () << endl;
	return 0;
}
```
>> After 1, 2, 3 and two dequeues, head = 2 and tail = 3. Enqueue 4, 5 and 6 (tail wraps 3 → 0 → 1 → 2) fills the 4 slots; 7 finds it full. head = 2, tail = 2, and the next dequeue is 3.
@quiz In a circular queue, head == tail can mean two things. What are they?
- [x] The queue is empty, or the queue is full
- [ ] The queue has one item, or two items
- [ ] The head and tail nodes are the same node
- [ ] Nothing: head == tail is impossible
>> When the queue fills up, tail wraps round to meet head; when it empties, head catches up with tail. A count (or one slot always left empty) tells them apart.
@say narrator: At the last lock, set into the wall where the mules turn, is a bronze plaque. Behind it, wrapped in waxed cloth: a key shaped like a lock gate, and a carving of a giant tree with a cave at its roots.
@say marco: A tree with a cave... the professor wrote about the Taíno. The ceiba tree. Hispaniola.
@say you: Trees. Finally.
@boss
The Queue Keeper guards the locks: first in, first out, and woe to whoever forgets the tail. Beat it with exam-style stack and queue questions.
@journal
- A circular array queue wraps with `(i + 1) % N`
- head == tail when empty AND when full: keep a count to tell them apart
- No shifting needed: enqueue and dequeue are O(1)
