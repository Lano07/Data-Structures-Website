# world: ptr
title: The Sunken City
place: Port Royal, Jamaica
when: 1692
topic: cpp
parts: b
scene: harbor
color: #41e0d0
fragment: The Harbour Key
blurb: Pointers and dynamic memory: addresses, *, ->, new and delete, and the mistakes that sink programs.

## ptr-1 | Every building has an address
goal: Find a variable's address with & and follow a pointer with *.
lessons: b1-addresses

@scene Kingston Harbour, Jamaica · the Kiskadee drops anchor off Port Royal
@say marco: There she is. Port Royal. Three hundred years ago this was the richest, rowdiest town in the Caribbean.
@say narrator: On 7 June 1692, just before noon, an earthquake shook the town and about two-thirds of it slid into the harbour. Thousands died. Divers still map the streets under the water.
@say you: And the professor thinks a key is down there?
@say marco: Her journal has a drawing: the old town as a grid of numbered lots, like a map. Look.
@learn Memory is a town of numbered lots
Your program's memory is like Port Royal's street plan: a long row of **boxes**, and every box has a number, its **address**. A variable lives in some box.

- `&x` means **the address of x** (which box it lives in).
- A **pointer** is a variable that holds an address: `int * p;` reads "p is a pointer to an int".
- `p = &x;` stores x's address in p. Now p **points to** x.
- `*p` means **the box p points to**. Reading `*p` reads x; writing `*p = 9;` changes x.
- `NULL` (or `nullptr`) is the address that means **nowhere**. A pointer that does not point anywhere yet should be set to NULL.

```cpp
#include <iostream>
using namespace std;

int main() {
	int x = 5;
	int * p = &x;     // p holds the address of x
	cout << *p << endl;   // 5: follow the pointer
	*p = 9;           // change the box p points to...
	cout << x << endl;    // ...which IS x: prints 9
	return 0;
}
```

The `*` means two different things: in a **declaration** (`int * p`) it says "p is a pointer"; in an **expression** (`*p`) it says "follow p".
@say pip: Squawk! Ampersand: address of! Star: follow it!
@quiz If `int x = 7;` lives at address 0x1000, what is `&x`?
- [ ] 7
- [x] 0x1000
- [ ] The value stored at 0x1000 plus 7
- [ ] NULL
>> `&x` is the address of x, not its value. The value 7 is what you get from x (or from `*p` when p holds 0x1000).
@predict Marco's dive log. What does it print?
```cpp
#include <iostream>
using namespace std;

int main() {
	int depth = 10;
	int * p = &depth;
	*p = *p + 5;
	cout << depth << endl;
	int * q = p;
	*q = 40;
	cout << depth << " " << *p << endl;
	return 0;
}
```
>> p points to depth, so `*p = *p + 5` makes depth 15. q is a copy of p (the same address), so `*q = 40` also changes depth, and *p reads 40 too.
@match Match each piece of pointer syntax to its meaning.
&x = the address of the variable x
int * p; = declare p as a pointer to an int
*p = the box that p points to
p = &x; = make p point to x
NULL = an address that points nowhere
>> & gives an address, * in a declaration makes a pointer, * in an expression follows one.
@type After `int a = 3; int * p = &a; *p = *p * 4;` what is the value of a?
= 12
>> p points to a, so `*p * 4` is 12 and it is stored back into a.
@relic watch | The 11:43 watch | When underwater archaeologists explored Port Royal's sunken streets in 1959, they recovered a pocket watch, made in Amsterdam around 1686, whose hands had stopped at 11:43: the moment, people say, that the earthquake struck on 7 June 1692.
@journal
- Memory is boxes with addresses; `&x` is the address of x
- `int * p = &x;` makes p point to x; `*p` follows the pointer (read or write x)
- Copying a pointer copies the address: two pointers can point to the same box
- `NULL` means "points nowhere"

## ptr-2 | Two maps, one building
goal: Use pointers to structs with -> and see how two pointers share one object.
lessons: b2-pointers-structs

@scene Underwater · the old Thames Street, 12 metres down
@say marco: Visibility's bad. Stay close and read me the lot numbers off her map.
@say you: Her map uses structs: every lot has a number and a description. And she draws arrows between lots.
@learn Pointers to structs, and the arrow ->
When a pointer points to a **struct**, you reach a field with the arrow `->`:

```cpp
struct Lot {
	int number;
	string owner;
};

Lot a;
a.number = 12;          // a is a struct: use the dot
Lot * p = &a;
p->number = 13;         // p is a pointer: use the arrow
(*p).number = 14;       // the same thing, written the long way
```

`p->number` means `(*p).number`: follow p, then take the field. The brackets matter: `*p.number` would try to take `.number` of p first, which does not compile.

The arrow is how you will walk every structure in this course. The **Node** of a linked list is a struct that contains a pointer to another Node:

```cpp
struct Node {
	int data;
	Node * next;    // the address of the next Node, or NULL
};
```
@predict Two maps point to the same lot. What does this print?
```cpp
#include <iostream>
#include <string>
using namespace std;

struct Lot {
	int number;
	string owner;
};

int main() {
	Lot a;
	a.number = 12;
	a.owner = "Morgan";
	Lot * m1 = &a;
	Lot * m2 = m1;
	m2->owner = "Lewis";
	m1->number = m1->number + 1;
	cout << a.number << " " << a.owner << endl;
	cout << m2->number << " " << m1->owner << endl;
	return 0;
}
```
>> m1 and m2 hold the same address, so they are two ways to reach the one struct a. Every change through either pointer changes a.
@fill Complete the code so it prints `25`.
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

int main() {
	Node n;
	Node * p = [[&n]];
	p[[->]]data = 25;
	cout << n.data << endl;
	return 0;
}
```
>> p must hold the address of n, and a pointer to a struct reaches its field with ->.
@quiz `p` is a pointer to a struct with a field `x`. Which line does NOT compile?
- [ ] `p->x = 1;`
- [ ] `(*p).x = 1;`
- [x] `*p.x = 1;`
- [ ] `int y = p->x;`
>> `.` binds tighter than `*`, so `*p.x` means `*(p.x)`, and a pointer has no field x. Use `p->x` or `(*p).x`.
@say narrator: Your torch catches a brick doorway with a number carved above it: **12**. The lot on the professor's map.
@journal
- `p->field` follows p and takes a field: it means `(*p).field`
- Two pointers with the same address reach the same object: a change through one shows through the other
- A Node holds data and `Node * next`: a pointer to another Node

## ptr-3 | Building on new land
goal: Make objects that outlive their function with new, and free them with delete.
lessons: b3-new-delete

@scene Back aboard · drying off · the professor's notes on "the heap"
@say marco: She writes that Port Royal was built on a sand spit, and people kept adding land. "Like the heap," she says. What's the heap?
@learn The stack, the heap, new and delete
Local variables live on the **stack**: each function call gets a frame, and the frame (with all its variables) disappears when the function returns.

Some data must **outlive** the function that made it, or its size is only known while running. That data goes on the **heap**:

- `new Node` makes a Node on the heap and returns **its address**.
- `delete p;` frees the object p points to. The memory goes back to the system.
- `new int[n]` makes an array of n ints on the heap; free it with `delete [] p;` (with the brackets).

```cpp
Node * createNode (int n) {
	Node * newNode = new Node;    // on the heap: survives the return
	newNode->data = n;
	newNode->next = NULL;
	return newNode;               // the address is handed back
}
```

The pointer `newNode` is a local variable and disappears at the return, but the **Node** it points to stays on the heap, and the caller now holds its address. Objects made with `new` live until **you** delete them. Nothing deletes them for you.

A new object's fields hold **garbage** until you set them, which is why `createNode` sets `next = NULL` straight away.
@order Put createNode back together.
Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}
~ Node newNode;
~ delete newNode;
>> Make the node on the heap, fill in both fields, and return its address. A local `Node newNode;` would vanish at the return, and deleting it would throw away what you just built.
@predict A dynamic array whose size is decided while the program runs. What does it print?
```cpp
#include <iostream>
using namespace std;

int main() {
	int n = 4;
	int * depths = new int[n];
	for (int i = 0; i < n; i++)
		depths[i] = (i + 1) * 3;
	int total = 0;
	for (int i = 0; i < n; i++)
		total = total + depths[i];
	cout << depths[n - 1] << " " << total << endl;
	delete [] depths;
	return 0;
}
```
>> The array holds 3, 6, 9, 12. The last one is 12 and the total is 30. `delete []` frees the whole array.
@quiz Which pair is right?
- [ ] `new int[10]` is freed with `delete p;`
- [x] `new int[10]` is freed with `delete [] p;`
- [ ] Heap objects are freed automatically when the function returns
- [ ] `new` returns the object itself, not its address
>> Arrays from `new []` need `delete []`. Nothing on the heap is freed automatically, and new always returns an address.
@code ex="ptr-make-pair"
The professor's notes end with a small exercise: build two nodes on the heap and link them. Write it, then run the tests.
@journal
- Locals live on the stack and vanish when their function returns
- `new` makes an object on the heap and returns its address; it lives until you `delete` it
- `new int[n]` pairs with `delete [] p;`
- Set every field of a new node (especially `next = NULL`): new fields hold garbage

## ptr-4 | The earthquake
goal: Recognise dangling pointers, memory leaks and NULL dereferences, and avoid them.
lessons: b4-pitfalls, b6-deep-memory

@scene Night · a sleek black yacht slides up beside the Kiskadee
@say silas: Good evening. Silas Crane. I collect... rare things. And I believe you are looking for something of the professor's.
@say marco: We're looking for a friend. Move your boat.
@say silas: Careful, captain. Port Royal teaches a lesson: build carelessly, and the ground swallows everything. Goodnight.
@say you: Who was THAT?
@say pip: Squawk! Dangling pointer! Dangling pointer!
@learn Four ways to sink a program
**1. The dangling pointer.** After `delete p;` the object is gone, but p still holds its old address, like a map to a building that sank in the earthquake. Using `*p` or `p->data` afterwards is a bug that may crash, or worse, seem to work.

```cpp
delete p;
p = NULL;      // good habit: now everyone can see p points nowhere
```

Any **other** pointer that held the same address dangles too: setting p to NULL does not fix q.

**2. The memory leak.** If you lose the last pointer to a heap object, nobody can ever reach it or delete it:

```cpp
Node * p = new Node;
p = new Node;      // the first Node is now lost forever: a leak
```

**3. Following NULL.** `p->data` when p is NULL crashes. Check first: `if (p != NULL)`. In list code, `while (curr != NULL)` exists for exactly this reason.

**4. The uninitialised pointer.** `Node * p;` without a value holds a random address. Give every pointer a value when you declare it: an address, or NULL.

Also: never `delete` the same object twice, and never `delete` something that did not come from `new`.
@quiz `Node * p = new Node; Node * q = p; delete p; p = NULL;` What is q now?
- [ ] NULL, because p was set to NULL
- [x] A dangling pointer: it still holds the address of the deleted node
- [ ] A pointer to a new copy of the node
- [ ] A memory leak
>> Setting p to NULL changes p only. q still holds the old address of memory that has been freed. Using q now is a bug.
@quiz Which code leaks memory?
- [ ] `Node * p = new Node; delete p;`
- [x] `Node * p = new Node; p = NULL;`
- [ ] `Node * p = NULL; p = new Node; delete p;`
- [ ] `int x = 5; int * p = &x;`
>> Setting p to NULL throws away the only address of the node, so it can never be deleted. (The last one makes nothing on the heap.)
@memory Step through this program and watch the heap: one node leaks, and one pointer dangles. Find both in the memory drawing.
```cpp
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

int main() {
	Node * a = new Node;
	a->data = 1;
	a->next = NULL;
	Node * b = new Node;
	b->data = 2;
	b->next = NULL;
	Node * c = b;
	b = a;
	delete a;
	a = NULL;
	cout << c->data << endl;
	return 0;
}
```
@type In the program above, `b = a;` overwrites b. After `delete a;`, which variable is left dangling? Type its name.
= b
>> b was set to a's address, and that node was deleted. a was then set to NULL, but b still holds the old address. (c is fine: it points to the node with 2, which is never deleted, so that node leaks at the end.)
@journal
- Dangling pointer: holds the address of deleted memory. After `delete p;` write `p = NULL;`
- Memory leak: the last pointer to a heap object is lost, so it can never be deleted
- Check `p != NULL` before `p->...`; give every pointer a value when you declare it
- Never delete twice, never delete what did not come from new

## ptr-5 | Streets in a row
goal: Connect pointers and arrays: A[i] is *(A + i).
lessons: b5-pointers-arrays

@scene Dawn · the dive team surfaces with a corroded iron box
@say marco: The box has a row of tumblers, numbered 0 to 4. Her note says: "Turn each one by the amount at its address."
@learn Pointers and arrays are close cousins
An array's name, used in an expression, becomes the **address of its first element**. So a pointer can walk an array:

```cpp
int A[5] = {10, 20, 30, 40, 50};
int * p = A;        // the same as p = &A[0];
cout << *p;         // 10
cout << *(p + 2);   // 30: two elements further on
cout << p[3];       // 40: indexing works on pointers too
```

- `A[i]` means `*(A + i)`. Adding 1 to a pointer moves it **one element** on (4 bytes for an int, not 1).
- That is why passing an array to a function passes its address: the function can change the caller's array.
- An array parameter `int A[]` is really a pointer `int * A`, so the function cannot know the array's size: pass n as well.
@predict The tumbler box. What does it print?
```cpp
#include <iostream>
using namespace std;

int main() {
	int T[5] = {3, 1, 4, 1, 5};
	int * p = T;
	cout << *p << " " << *(p + 2) << " " << p[4] << endl;
	p = p + 1;
	*p = 9;
	cout << T[1] << " " << p[1] << endl;
	return 0;
}
```
>> p starts at T[0]. After `p = p + 1`, p points to T[1], so `*p = 9` changes T[1], and p[1] is T[2], which is 4.
@fill Make the function change the caller's array, so it prints `2 4 6`.
```cpp
#include <iostream>
using namespace std;

void doubleAll (int [[*]] A, int n) {
	for (int i = 0; i < n; i++)
		[[A[i]|*(A + i)|*(A+i)]] = A[i] * 2;
}

int main() {
	int V[3] = {1, 2, 3};
	doubleAll (V, 3);
	cout << V[0] << " " << V[1] << " " << V[2] << endl;
	return 0;
}
```
>> `int * A` (or `int A[]`) receives the address of V's first element, so writing A[i] writes V[i].
@quiz Why do functions that take an array usually take its size n too?
- [x] Because inside the function the array is just a pointer, so its length is not known
- [ ] Because C++ copies the array and needs to know how much to copy
- [ ] Because arrays cannot be indexed inside functions
- [ ] Because n is the address of the array
>> An array parameter is a pointer to the first element. The pointer does not record how many elements follow, so the caller must say.
@say narrator: Five clicks. The lid rises. Inside, wrapped in oilcloth: a brass key shaped like a harbour, and a note in the professor's hand. **"Cusco. The cords remember. — C.R."**
@say marco: Cusco, Peru. The Inca capital. Pack warm clothes, {name}: we're going up the Andes.
@say silas: (from the yacht, through a loudhailer) Enjoy the climb!
@boss
The Dangling Pointer haunts the sunken streets. Beat it with exam-style questions on pointers and memory.
@journal
- An array name is the address of its first element: `int * p = A;`
- `A[i]` is `*(A + i)`; pointer + 1 moves one element on
- Array parameters are pointers, so functions change the caller's array and need n passed in
