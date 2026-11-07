---
title: Organising a program
summary: As a program grows, the lecture splits it into files - a header (.h) with the structs and prototypes, a .cpp file with the functions, and a separate .cpp file with main for testing. This lesson shows that layout, include guards, how the files are compiled together, and a habit for testing each function.
lectures: Lecture 2, Assignments
goals:
  - Split a program into a header file and source files, as Lecture 2 does
  - Write include guards and know when to use #include "..." or #include <...>
  - Explain the difference between a compile error and a link error
  - Test each function on small, carefully chosen cases
labs: [memory]
---

## From one file to several

Lecture 2 starts with everything in one file:

```text
LinkedList.cpp
	linked list function prototypes
	linked list functions
	main() function
	other functions
```

That works for small programs, but it mixes the reusable part (the list functions) with the part that only uses them (main). The lecture splits it up:

| File | Contains |
|---|---|
| `LinkedList.h` | the struct and the function **prototypes**: what the list can do |
| `LinkedList.cpp` | the function **definitions**: how it does it |
| `TestLinkedList.cpp` | `main()`, which uses and tests the functions |
| `OtherCode.cpp` | any other functions |

All the files are then added to one **project** (in Dev-C++, a .dev file), which compiles them together into one program.

## The header file

```cpp norun
// LinkedList.h
#ifndef LINKEDLIST_H
#define LINKEDLIST_H

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n);
Node * insertAtHead (Node * top, int n);
void printList (Node * top);
bool contains (Node * top, int key);

#endif
```

The header is a list of promises: "these functions exist, and this is how to call them". Any file that wants to use the list includes it.

The three lines starting with `#` are an **include guard**. If a header is included twice in the same file (easy to do when headers include other headers), the struct would be defined twice, which is an error. The first time, `LINKEDLIST_H` is not defined, so the contents are read and the name is defined. The second time the name is already defined, so everything up to `#endif` is skipped. The Assignment 2 header uses the same pattern with `_Assignment2_H`.

## The source files

```cpp norun
// LinkedList.cpp
#include <iostream>
#include "LinkedList.h"
using namespace std;

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}
// ... the other definitions
```

```cpp norun
// TestLinkedList.cpp
#include <iostream>
#include "LinkedList.h"
using namespace std;

int main() {
	Node * top = NULL;
	top = insertAtHead (top, 10);
	printList (top);
	return 0;
}
```

- `#include <iostream>`, with angle brackets: a standard library header.
- `#include "LinkedList.h"`, with quotes: your own header, found next to your files.

From the command line, the files are compiled together like this: `g++ LinkedList.cpp TestLinkedList.cpp -o test`.

:::info
The programs on this site run as a single file, so each example puts the struct, the functions and main together, in that order, like the lecture's one-file version.
:::

## Compile errors and link errors

Building a program happens in two stages, and each has its own kind of error:

| Stage | What it checks | Typical message |
|---|---|---|
| **Compiling** each .cpp file | the code is valid C++ and everything it uses has been declared | "'contains' was not declared in this scope" (missing prototype or #include) |
| **Linking** the files together | every function that is called has a definition somewhere | "undefined reference to 'contains(Node*, int)'" |

An "undefined reference" means the prototype was found, so the call compiled, but no file in the project contains the function's body. Either the definition is missing, its parameter types do not match the prototype, or the .cpp file holding it was not added to the project.

## Testing each function

The point of a separate test file is to try every function on its own before building on it. For each function, choose cases where bugs hide (lesson C5 has the list version):

- the **empty** structure (`top == NULL`, `root == NULL`, size 0);
- **one** element;
- the key at the **start**, at the **end**, and **missing**;
- for a tree: a node with no children, one child, and two children.

Print what you expect next to what you get, so a mismatch stands out:

```cpp example="A small test harness"
#include <iostream>
#include <string>
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

Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}

bool contains (Node * top, int key) {
	for (Node * curr = top; curr != NULL; curr = curr->next)
		if (curr->data == key)
			return true;
	return false;
}

int failures = 0;

void check (string what, bool got, bool expected) {
	cout << (got == expected ? "ok    " : "FAIL  ") << what << endl;
	if (got != expected)
		failures++;
}

int main() {
	Node * empty = NULL;
	Node * one = insertAtHead (NULL, 7);
	Node * three = insertAtHead (insertAtHead (insertAtHead (NULL, 30), 20), 10);

	check ("empty list contains 7", contains (empty, 7), false);
	check ("one-node list contains 7", contains (one, 7), true);
	check ("one-node list contains 8", contains (one, 8), false);
	check ("key in the first node", contains (three, 10), true);
	check ("key in the last node", contains (three, 30), true);
	check ("key missing", contains (three, 25), false);
	cout << failures << " failures" << endl;
	return 0;
}
```

The Code Gym uses exactly this idea: every exercise is checked against a set of small, deliberate tests.

## Style that helps you

- **Names that say what they mean**: `insertSorted`, `numTerminal`, `curr`, `prev`; not `f`, `x2`, `temp2`.
- **One job per function.** If you need "and" to describe it, consider two functions.
- **Indent every block.** Misleading indentation hides bugs such as a loop body that is not what it looks like.
- **Comment the why**, especially the special cases: `// the key is in the first node, so top changes`.

:::remember
- `.h`: structs and prototypes, inside an include guard. `.cpp`: definitions. A separate `.cpp` with main for testing.
- `#include "mine.h"` for your files, `#include <iostream>` for the library.
- "not declared": a compile problem (prototype or #include). "undefined reference": a link problem (the definition is missing or not in the project).
- Test with empty, one element, first, last and missing.
:::

:::teachback
Explain what goes in a header (.h) file and what goes in a .cpp file, what an include guard is for, and what an "undefined reference" error means.
>> The header holds the structs and the function prototypes; the .cpp file holds the function definitions (the bodies).
>> An include guard (`#ifndef`, `#define`, `#endif`) stops the header's contents being read twice in one file.
>> "Undefined reference" is a link error: the prototype was found, so the call compiled, but no compiled file provides a matching definition.
:::

:::quiz
A project builds with the error "undefined reference to `printList(Node*)`". The prototype is in LinkedList.h and main includes it. What is the most likely cause?
- [ ] A missing semicolon in main
- [ ] LinkedList.h has no include guard
- [x] The file with printList's definition is not part of the project, or its definition does not match the prototype
- [ ] printList is called before it is declared
>> "Undefined reference" comes from the linker: the call compiled, because the prototype was found, but no compiled file provides a matching definition.
:::

:::quiz
What do the lines `#ifndef LINKEDLIST_H`, `#define LINKEDLIST_H` and `#endif` do?
- [ ] They make the header run faster
- [x] They stop the header's contents being read twice in the same file, which would define the structs twice
- [ ] They tell the linker where the functions are
- [ ] They are required in every .cpp file
>> On the first include the name is not yet defined, so the contents are read and the name is defined. Any later include of the same header skips everything up to #endif.
:::

:::quiz
Which set of test cases is most likely to find a bug in a function that deletes a key from a linked list?
- [ ] One long list with the key in the middle
- [ ] Ten random lists
- [x] An empty list, a one-node list, the key in the first node, the key in the last node, and a missing key
- [ ] The same list tested twice
>> Most list bugs live at the edges: following NULL in an empty list, forgetting to change top when the first node goes, or running off the end. Each of these cases tests one edge.
:::
