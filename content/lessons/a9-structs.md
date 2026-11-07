---
title: Structs
summary: A struct groups related values of different types under one name, such as a student's name, ID and GPA. You reach each field with a dot. Structs can be copied, stored in arrays, nested inside each other and passed to functions, and every data structure in this course is built from them.
lectures: COMP 1602/1603 review, Lecture 1
goals:
  - Define a struct and declare, initialise and use struct variables
  - Store structs in arrays and search them
  - Nest one struct inside another
  - Pass structs to functions by value and by reference, and return them
  - Recognise the course's structs - Node, BTNode, MaxHeap and Graph
labs: [memory]
---

## Grouping values

A student has a name, an ID number and a GPA. Three separate variables would work for one student, but a program with many students quickly loses track of which name goes with which ID. A **struct** groups them:

```cpp norun
struct Student {        // defines a new type called Student
	string name;        // the fields (or members)
	int id;
	double gpa;
};                      // note the semicolon
```

The definition creates a **type**, like int or string; it does not create any students yet. Variables of the type are declared as usual, and each field is reached with a **dot**:

```cpp memory caption="One Student variable is one box divided into three fields."
#include <iostream>
#include <string>
using namespace std;

struct Student {
	string name;
	int id;
	double gpa;
};

int main() {
	Student s;
	s.name = "Kezia";
	s.id = 816030000;
	s.gpa = 3.6;
	Student t = {"Ravi", 816030001, 3.2};
	cout << s.name << " and " << t.name << endl;
	return 0;
}
```

- `Student t = {"Ravi", 816030001, 3.2};` sets the fields in the order they are defined.
- Each field is an ordinary variable: `s.gpa = s.gpa + 0.1;` and `cin >> s.id;` both work.

## Copying and comparing

Assignment copies **every** field: after `t = s;`, t holds its own copy of s's name, id and gpa. Changing t afterwards does not change s.

Structs cannot be compared with `==` as a whole. Compare the fields that matter, for example `if (s.id == t.id)`.

## Arrays of structs

An array of structs is a table: one struct per row.

```cpp example="An array of structs"
#include <iostream>
#include <string>
using namespace std;

struct Student {
	string name;
	int id;
	double gpa;
};

int findById (Student list[], int n, int id) {     // location, or -1
	for (int i = 0; i < n; i++)
		if (list[i].id == id)
			return i;
	return -1;
}

int main() {
	Student list[4] = {
		{"Kezia", 1001, 3.6},
		{"Ravi", 1002, 3.2},
		{"Mei", 1003, 3.9},
		{"Andre", 1004, 2.8}
	};
	int best = 0;
	for (int i = 1; i < 4; i++)
		if (list[i].gpa > list[best].gpa)
			best = i;
	cout << "Highest GPA: " << list[best].name << " (" << list[best].gpa << ")" << endl;

	int where = findById (list, 4, 1002);
	if (where != -1)
		cout << list[where].name << " has ID 1002" << endl;
	return 0;
}
```

`list[i].gpa` is read from the left: element i of the array, then its gpa field.

## Structs inside structs

A field can itself be a struct:

```cpp norun
struct Date {
	int day;
	int month;
	int year;
};

struct Student {
	string name;
	int id;
	Date born;              // a whole Date inside each Student
};

Student s;
s.born.year = 2005;         // the year field of the born field of s
```

Assignment 2's `Course` struct sits inside each BST node in the same way.

## Structs and functions

A struct can be passed and returned like any other value. Remember the rules from lesson A6:

```cpp example="Structs as parameters and return values"
#include <iostream>
#include <string>
using namespace std;

struct Point {
	int x;
	int y;
};

Point makePoint (int x, int y) {           // returns a whole struct
	Point p;
	p.x = x;
	p.y = y;
	return p;
}

void moveRight (Point & p, int distance) {   // by reference: changes the caller's Point
	p.x = p.x + distance;
}

void print (const Point & p) {              // const reference: no copy, no changes
	cout << "(" << p.x << ", " << p.y << ")" << endl;
}

int main() {
	Point a = makePoint (2, 3);
	moveRight (a, 5);
	print (a);
	return 0;
}
```

## The course's structs

Every structure in the course is a struct, often holding pointers to other structs:

| Struct | Fields | Lesson |
|---|---|---|
| `Node` | `int data; Node * next;` | C1 |
| `BTNode` | `int data; BTNode * left; BTNode * right; BTNode * parent;` | F1, G3 |
| `Stack`, `Queue` | `Node * top;` / `Node * head; Node * tail;` | E1, E2 |
| `MaxHeap` | `int A[MAX_SIZE]; int size;` | H1 |
| `Graph` | `int numVertices; Vertex vertices[MAX_VERTICES];` | J2 |

A struct may contain a pointer to its own type (`Node * next` inside Node), but not a whole copy of itself, which would never end. That one rule is what makes linked lists and trees possible.

When you have a **pointer** to a struct, the fields are reached with `->` instead of a dot: `p->data` means `(*p).data`. Lesson B2 explains why.

:::remember
- `struct Name { fields };` defines a type. Do not forget the final semicolon.
- `variable.field` reaches a field; `array[i].field` a field of an array element; `pointer->field` a field through a pointer.
- Assignment copies every field. Compare field by field.
- Pass large structs as `const Type &`, and as `Type &` to change them.
:::

:::teachback
Explain why a `Node` struct may contain `Node * next;` but not `Node next;`, and what `p->data` means when `p` is a pointer to a Node.
>> A pointer only stores an address, which has a fixed size.
>> A whole Node inside a Node would need another Node inside that one, and so on forever: it would have no fixed size.
>> `p->data` means `(*p).data`: follow the pointer to the struct, then take its `data` field.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct Box {
	int width;
	int height;
};

void grow (Box b) {
	b.width = b.width * 2;
}

void shrink (Box & b) {
	b.height = b.height / 2;
}

int main() {
	Box a = {10, 8};
	Box c = a;
	c.width = 3;
	grow (a);
	shrink (a);
	cout << a.width << " " << a.height << " " << c.width << endl;
	return 0;
}
```
- [ ] `20 4 3`
- [x] `10 4 3`
- [ ] `10 8 10`
- [ ] `3 4 3`
>> `c = a` makes a separate copy, so changing c.width leaves a alone. grow receives a copy, so a.width stays 10. shrink receives a reference, so a.height becomes 4.
:::

:::quiz
`Student list[50];` holds students, and each Student has a field `Date born` with a field `year`. How do you get the birth year of the fourth student?
- [ ] `list.born.year[3]`
- [ ] `list[4].born.year`
- [x] `list[3].born.year`
- [ ] `list[3].year.born`
>> The fourth element has index 3. Then `.born` picks its Date field, and `.year` picks the year inside that Date.
:::

:::quiz
Why can a Node struct contain `Node * next;` but not `Node next;`?
- [ ] Structs cannot contain other structs
- [x] A pointer is just an address of fixed size, but a whole Node inside a Node would need another Node inside that, forever
- [ ] `next` is a reserved word
- [ ] It can contain both
>> A field of type Node would make every Node contain a Node, which contains a Node, and so on: infinite size. A pointer only stores where another Node is, so its size is fixed.
:::
