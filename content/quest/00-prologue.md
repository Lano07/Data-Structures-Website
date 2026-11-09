# world: prologue
title: The Empty Office
place: St. Augustine, Trinidad
when: Today
topic:
parts: a
scene: office
color: #ffd23f
fragment: The Professor's Journal
blurb: C++ foundations: programs, variables, decisions, loops, functions, arrays, strings, structs and files. Everything the rest of the quest is built on.

## p-1 | A note on the screen
goal: Write and read a complete C++ program.
lessons: a1-first-program

@scene UWI St. Augustine · Computer Science building · 9:58 a.m.
@say you: Office hours with Professor Ramdeen at ten. I'm early for once…
@say narrator: The door is open. Papers cover the floor, the desk drawers hang out, and the professor is nowhere to be seen.
@say pip: Squawk! Hello, World! Hello, World!
@say you: A parrot? You must be Pip. The professor talks about you in every lecture.
@say pip: Squawk! Compile first! Compile first!
@say narrator: A sticky note on the monitor says: *"If I am not here, run this. Tell no one but my best student."* Below it, a short program is open in the editor.
@learn What every C++ program needs
Every program you write in this course has the same skeleton. Read it line by line:

```cpp
#include <iostream>          // brings in cout and cin
using namespace std;         // so we can write cout instead of std::cout

int main() {                 // the program starts running here
	cout << "Port Royal" << endl;   // print, then end the line
	return 0;                // 0 tells the system "finished normally"
}
```

- `#include <iostream>` gives you **cout** (output) and **cin** (input). Without it, `cout` is unknown and the program does not compile.
- `int main()` is where running starts. Every program has exactly one.
- `cout << something` sends something to the screen. You can chain: `cout << "a" << 5 << endl;`
- `endl` ends the line (so does `"\n"`).
- Every **statement** ends with a **semicolon** `;`. A `{ }` block groups statements.
- `//` starts a comment: the compiler ignores the rest of the line.

Press **Run** on the program above. You can edit it and run it again.
@predict What does the professor's program print?
```cpp
#include <iostream>
using namespace std;

int main() {
	cout << "Find ";
	cout << "the" << endl;
	cout << "Lost Index" << endl;
	return 0;
}
```
>> `cout << "Find "` does not end the line, so "the" is printed on the same line. `endl` is what moves to the next line.
@say you: "Find the Lost Index"? Like the legend in her lecture on the history of computing?
@say pip: Squawk! Missing semicolon! Missing semicolon!
@fill The professor left a second program, but some of it got smudged. Fill in the gaps so it compiles and prints `Day 1`.
```cpp
#include <[[iostream]]>
using namespace std;

int [[main]]() {
	[[cout]] << "Day " << 1 << endl[[;]]
	return 0;
}
```
>> Four things every program needs: the iostream header, a main function, cout to print, and a semicolon after each statement.
@order Put the lines of a working program in order.
#include <iostream>
using namespace std;
int main() {
	cout << "Kiskadee" << endl;
	return 0;
}
~ int main();
>> The include comes first, then the using line, then main's header, its body, and the closing brace. `int main();` with a semicolon is a declaration, not the start of the function.
@quiz What does `return 0;` at the end of main mean?
- [ ] The program prints 0
- [x] The program tells the operating system it finished normally
- [ ] The program starts again from the top
- [ ] The program deletes its variables
>> main returns an int to whoever started the program. 0 means "no problem". It prints nothing.
@relic sticky-note | The professor's sticky note | A yellow sticky note in the professor's handwriting: "Every great record-keeper left an index. Find the keepers, find the keys." On the back: a hand-drawn compass whose needle points not north but at a tiny box labelled 0x7ffd.
@journal
- Every program: `#include <iostream>`, `using namespace std;`, one `int main() { ... return 0; }`
- `cout << a << b << endl;` prints; nothing moves to a new line without `endl` or `"\n"`
- Every statement ends with `;`. A missing semicolon is the most common compile error.

## p-2 | Coordinates in the drawer
goal: Store values in variables and do arithmetic, including / and %.
lessons: a2-variables

@scene The same office · 10:20 a.m.
@say marco: Yo! Is this Professor Ramdeen's office? Oh. Oh no. Somebody really turned this place upside down.
@say you: Who are you?
@say marco: Marco Baptiste. Captain of the *Kiskadee*, best boat in Chaguaramas, and her student, about a hundred years ago. She messaged me last night: "If I vanish, help whoever runs my program." I'm guessing that's you, {name}.
@say pip: Squawk! Captain! Captain!
@say marco: And she left this: a program that works out where to sail. Let's read it.
@learn Variables and types
A **variable** is a named box in memory that holds one value of one **type**.

| Type | Holds | Example |
|---|---|---|
| `int` | whole numbers | `int day = 7;` |
| `double` | numbers with a decimal point | `double lat = 17.93;` |
| `char` | one character, in single quotes | `char grade = 'A';` |
| `bool` | `true` or `false` | `bool found = false;` |
| `string` | text, in double quotes (`#include <string>`) | `string ship = "Kiskadee";` |

**Integer division** throws away the fraction: `17 / 5` is `3`. The **remainder** operator `%` gives what is left over: `17 % 5` is `2`. You will use both all through this course: heaps find a parent with `i / 2`, and hash tables pick a location with `key % 12 + 1`.

If either side is a `double`, `/` keeps the fraction: `17.0 / 5` is `3.4`, and so is `(double) 17 / 5` (the cast turns 17 into 17.0 first).

```cpp
#include <iostream>
using namespace std;

int main() {
	int a = 17, b = 5;
	cout << a / b << " " << a % b << endl;     // 3 2
	cout << (double) a / b << endl;            // 3.4
	a = a + 1;                                 // a is now 18
	a++;                                       // and now 19
	cout << a << endl;
	return 0;
}
```
@type What is `29 % 12 + 1`? (This is exactly how the lecture's hash function picks a table location.)
= 6
>> 29 = 2 × 12 + 5, so 29 % 12 is 5, and 5 + 1 = 6.
@predict The professor's navigation program. What does it print?
```cpp
#include <iostream>
using namespace std;

int main() {
	int legs = 47;
	int knots = 6;
	int hours = legs / knots;
	int left = legs % knots;
	double exact = (double) legs / knots;
	cout << hours << " hours, " << left << " miles over" << endl;
	cout << exact << endl;
	return 0;
}
```
>> 47 / 6 is 7 (the fraction is dropped), 47 % 6 is 5, and with the cast the division keeps its fraction: 7.83333 (cout shows 6 significant digits).
@quiz Which line stores the letter J in a variable correctly?
- [ ] `char c = "J";`
- [x] `char c = 'J';`
- [ ] `string c = 'J';`
- [ ] `char c = J;`
>> A char literal uses single quotes. Double quotes make a string literal, and a bare J is read as a variable name.
@match Match each type to what it holds.
int = a whole number, like 2611
double = a number with a fractional part, like 17.93
char = one character, like 'A'
bool = true or false
string = text, like "Port Royal"
>> Pick the type for the values the variable will hold.
@say marco: Seven hours and change... and the heading she wrote points west-northwest. Jamaica. Port Royal.
@say you: Port Royal... the pirate town that sank?
@say marco: Same one. Pack light. We'll need the rest of her clues first.
@journal
- A variable has a type and holds one value: `int`, `double`, `char`, `bool`, `string`
- Integer division drops the fraction (`17 / 5 == 3`); `%` is the remainder (`17 % 5 == 2`)
- `(double) a / b` keeps the fraction. `key % 12 + 1` and `i / 2` come back in hashing and heaps.

## p-3 | The combination lock
goal: Make decisions with if and repeat work with loops.
lessons: a3-decisions, a4-loops

@scene The filing cabinet · a keypad lock with a tiny screen
@say narrator: The professor's filing cabinet has an electronic lock. Its screen shows a short program and the words: **ENTER WHAT IT PRINTS**.
@learn Decisions and loops
**if / else** picks one of two paths:

```cpp
if (temperature > 30)
	cout << "hot";
else if (temperature > 20)
	cout << "warm";
else
	cout << "cool";
```

Comparisons: `==` (equal; one `=` is assignment!), `!=`, `<`, `<=`, `>`, `>=`. Combine them with `&&` (and), `||` (or), `!` (not).

**Loops** repeat:

```cpp
int i = 1;
while (i <= 3) {          // test first, then the body
	cout << i << " ";
	i++;
}
for (int k = 0; k < 3; k++)      // start; test; step
	cout << k << " ";
```

A `for` loop is a `while` loop with the start, the test and the step on one line. A `do { ... } while (test);` loop always runs its body at least once.

**Trace a loop on paper** by writing down every variable after every pass. Most loop bugs are *off by one*: `<` versus `<=`.
@predict The lock's program. What does it print?
```cpp
#include <iostream>
using namespace std;

int main() {
	int code = 0;
	for (int i = 1; i <= 4; i++) {
		if (i % 2 == 0)
			code = code * 10 + i;
	}
	cout << code << endl;
	return 0;
}
```
>> Only the even values of i (2 and 4) change code: 0 × 10 + 2 = 2, then 2 × 10 + 4 = 24.
@say pip: Squawk! Off by one! Off by one!
@quiz How many times does this loop print "dig"? `for (int i = 0; i <= 5; i++) cout << "dig";`
- [ ] 5
- [x] 6
- [ ] 4
- [ ] It never stops
>> i takes the values 0, 1, 2, 3, 4 and 5: six passes. `i < 5` would give five.
@fill Finish the loop so it prints `5 4 3 2 1` (counting down).
```cpp
#include <iostream>
using namespace std;

int main() {
	for (int i = [[5]]; i >= [[1]]; [[i--|i = i - 1|--i|i-=1|i -= 1]])
		cout << i << " ";
	cout << endl;
	return 0;
}
```
>> Start at 5, keep going while i is at least 1, and step down by one each pass.
@type What does `(7 > 3) && (2 == 3)` evaluate to? (true or false)
= false | 0
>> `&&` is true only when both sides are true. 2 == 3 is false, so the whole thing is false.
@say narrator: *Click.* The drawer slides open. Inside: a USB drive labelled **TOOLKIT** and an old brass compass.
@journal
- `if / else if / else` picks one path; `==` compares, `=` assigns
- `while (test)`, `for (start; test; step)`, `do { } while (test);` (runs at least once)
- Trace loops in a table; watch for off-by-one errors (`<` vs `<=`)

## p-4 | The professor's toolkit
goal: Write functions and know when to pass by value or by reference.
lessons: a5-functions, a6-references

@scene Back at the desk · the TOOLKIT drive
@say marco: Her toolkit is full of little functions. She always said: "Write it once, call it everywhere."
@learn Functions, parameters and references
A **function** packages work you can call by name. It has a return type, a name, parameters and a body:

```cpp
int square (int n) {      // takes an int, gives back an int
	return n * n;
}
```

**Pass by value** (the default) gives the function a **copy**. Changing the copy does not change the caller's variable.

**Pass by reference** (`&` after the type) gives the function **another name for the caller's variable**. Changes go straight through:

```cpp
void addOne (int x) { x = x + 1; }        // changes a copy: useless
void addOneRef (int & x) { x = x + 1; }   // changes the caller's variable
```

A **prototype** (`int square (int n);`) announces a function before its body appears, so code above the body can call it. A `void` function returns nothing. Variables made inside a function are **local**: they disappear when it returns.
@predict What does this print? (Watch the `&`.)
```cpp
#include <iostream>
using namespace std;

void swapCopy (int a, int b) {
	int t = a; a = b; b = t;
}

void swapRef (int & a, int & b) {
	int t = a; a = b; b = t;
}

int main() {
	int x = 3, y = 8;
	swapCopy (x, y);
	cout << x << " " << y << endl;
	swapRef (x, y);
	cout << x << " " << y << endl;
	return 0;
}
```
>> swapCopy swaps its own copies and throws them away, so x and y are unchanged. swapRef's parameters are other names for x and y, so they really swap.
@quiz Why does `swapCopy` not swap the caller's variables?
- [ ] Because it returns void
- [x] Because a and b are copies of x and y
- [ ] Because t is a local variable
- [ ] Because ints cannot be swapped
>> Passing by value copies the arguments. The swap happens, but only to the copies.
@fill Make this function change the caller's variable, so `fuel` becomes 50.
```cpp
#include <iostream>
using namespace std;

void refuel (int [[&]] tank) {
	tank = 50;
}

int main() {
	int fuel = 10;
	refuel (fuel);
	cout << fuel << endl;
	return 0;
}
```
>> With `int & tank`, tank is another name for fuel, so the assignment changes fuel.
@order Put this function together. It returns the larger of two ints.
int larger (int a, int b) {
	if (a > b)
		return a;
	return b;
}
~ return a > b;
>> The header, the test, the return for each case, and the closing brace. `return a > b;` would return true or false, not the larger value.
@journal
- A function: return type, name, parameters, body; `return` gives back a value
- Pass by value copies; pass by reference (`int & x`) changes the caller's variable
- Prototypes let you call a function before its body; locals vanish when the function returns

## p-5 | Rows of clues
goal: Use arrays and strings, and know why a function can change an array.
lessons: a7-arrays, a8-strings

@scene The professor's whiteboard · a grid of numbers
@say you: There's a row of numbers on the whiteboard: 4, 8, 15, 16, 23, 42. And she circled the biggest one.
@learn Arrays and strings
An **array** is a row of boxes of the same type, numbered from **0**:

```cpp
int A[6] = {4, 8, 15, 16, 23, 42};
cout << A[0];      // 4, the first
cout << A[5];      // 42, the last: index n - 1
```

- Valid indexes are `0` to `n - 1`. `A[6]` is **outside** the array: C++ does not stop you, and the program reads or wrecks memory that is not yours.
- The size is fixed when the array is made.
- An array is passed to a function as the **address of its first element**, so the function works on the caller's array, not a copy. That is why sorting functions can sort your array in place.
- A 2-D array has rows and columns: `int grid[3][4];` and `grid[r][c]`.

A **string** (from `<string>`) is text you can index like an array: `s.length()`, `s[0]`, `s + "!"`, and `==` to compare. A **C-string** is a char array that ends with `'\0'`.
@predict The whiteboard program. What does it print?
```cpp
#include <iostream>
using namespace std;

int biggest (int A[], int n) {
	int best = A[0];
	for (int i = 1; i < n; i++)
		if (A[i] > best)
			best = A[i];
	return best;
}

void doubleAll (int A[], int n) {
	for (int i = 0; i < n; i++)
		A[i] = A[i] * 2;
}

int main() {
	int A[6] = {4, 8, 15, 16, 23, 42};
	cout << biggest (A, 6) << endl;
	doubleAll (A, 3);
	cout << A[0] << " " << A[2] << " " << A[3] << endl;
	return 0;
}
```
>> biggest scans the array keeping the largest so far: 42. doubleAll changes the caller's array (arrays are passed by address), but only the first 3 elements: 8, 30, and A[3] stays 16.
@type The array `int T[10];` has how many valid indexes, and what is the last one? Type the last valid index.
= 9
>> Indexes run from 0 to n − 1, so the last valid index of a 10-element array is 9.
@quiz What is wrong with `for (int i = 0; i <= n; i++) total += A[i];`?
- [ ] Nothing
- [x] It reads A[n], one place past the end of the array
- [ ] It skips A[0]
- [ ] total is never changed
>> With `<=` the last pass uses i = n, which is outside the array. Use `i < n`.
@predict Strings can be indexed and joined. What does this print?
```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
	string place = "Jamaica";
	cout << place.length() << " " << place[0] << place[6] << endl;
	string clue = place + "!";
	cout << clue << endl;
	return 0;
}
```
>> "Jamaica" has 7 characters, at indexes 0 to 6: J and a. + joins strings.
@journal
- Arrays index from 0 to n − 1; going past the end is undefined behaviour
- Arrays are passed by address: a function can change the caller's array
- `string`: `length()`, `s[i]`, `+`, `==`; C-strings end with `'\0'`

## p-6 | The field kit
goal: Group data with structs and read and write files.
lessons: a9-structs, a10-files

@scene Chaguaramas · aboard the Kiskadee · sunset
@say marco: Last stop before we sail. Her toolkit has a file called `expedition.txt`. And she kept her records in **structs**.
@learn Structs and files
A **struct** groups related values under one name. Each value is a **field**:

```cpp
struct Clue {
	string place;
	int year;
};

Clue c;
c.place = "Port Royal";      // the dot reaches a field
c.year = 1692;
Clue list[3];                // an array of structs
```

Later in the course, a struct can also hold a **pointer to another struct** of the same kind. That one idea builds linked lists, trees and graphs.

**Files** (`#include <fstream>`): `ofstream` writes, `ifstream` reads, with the same `<<` and `>>` as cout and cin.

```cpp
ofstream out ("log.txt");
out << "Port Royal " << 1692 << endl;
out.close();

ifstream in ("log.txt");
string place; int year;
while (in >> place >> year)     // stops when a read fails (the end of the file)
	cout << place << " " << year << endl;
in.close();
```

`while (in >> x)` is the standard way to read until the end of a file.
@predict The professor's expedition log. The program writes a file and then reads it back. What does it print?
```cpp
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

struct Clue {
	string place;
	int year;
};

int main() {
	ofstream out ("expedition.txt");
	out << "PortRoyal 1692" << endl;
	out << "Cusco 1533" << endl;
	out << "Seville 1785" << endl;
	out.close();

	Clue c[3];
	int n = 0;
	ifstream in ("expedition.txt");
	while (n < 3 && in >> c[n].place >> c[n].year)
		n++;
	in.close();

	int oldest = 0;
	for (int i = 1; i < n; i++)
		if (c[i].year < c[oldest].year)
			oldest = i;
	cout << n << " clues, oldest: " << c[oldest].place << endl;
	return 0;
}
```
>> Three lines are read into three structs. The smallest year is 1533, at index 1: Cusco.
@quiz What does the dot do in `c.year = 1692;`?
- [x] It picks the field year inside the struct c
- [ ] It multiplies c by year
- [ ] It ends the statement
- [ ] It calls a function called year
>> The dot reaches a field of a struct variable. (For a pointer to a struct you will soon use `->` instead.)
@fill Read numbers from the file until it ends.
```cpp
#include <iostream>
#include <fstream>
using namespace std;

int main() {
	ofstream out ("depths.txt");
	out << "12 30 7" << endl;
	out.close();
	ifstream in ("depths.txt");
	int d, total = 0;
	while (in [[>>]] d)
		total = total + d;
	cout << total << endl;
	return 0;
}
```
>> `in >> d` reads the next number and is false when there is nothing left, which ends the loop.
@say narrator: In the professor's file, under the three places, one more line: **"The first key sleeps where the city sank. Find the watch that stopped."**
@say marco: The sunken city. Port Royal. We sail at dawn, {name}.
@say pip: Squawk! Pointers ahead! Pointers ahead!
@journal
- A struct groups fields: `c.place`, `c.year`; arrays of structs hold records
- `ofstream` writes and `ifstream` reads with `<<` and `>>`; close files when done
- `while (in >> x)` reads until the end of the file
