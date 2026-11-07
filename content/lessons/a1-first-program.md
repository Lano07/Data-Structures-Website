---
title: Your first C++ program
summary: Every C++ program has the same frame - #include lines, using namespace std, and a main function whose statements run from top to bottom. cout prints, and the compiler checks your code before anything runs.
lectures: COMP 1602/1603 review
goals:
  - Name every part of a minimal C++ program and say what it does
  - Print text and numbers with cout, endl and \n
  - Write comments
  - Read a compiler error and fix it
labs: [memory]
---

## The smallest useful program

```cpp example="Hello"
#include <iostream>
using namespace std;

int main() {
	cout << "Hello, COMP 2611!" << endl;
	return 0;
}
```

Press **Run**. Line by line:

| Line | What it does |
|---|---|
| `#include <iostream>` | brings in the input/output library, which provides `cout` and `cin` |
| `using namespace std;` | lets you write `cout` instead of `std::cout` (the library's names live in a "namespace" called std) |
| `int main() {` | starts the **main function**. Every program starts running here |
| `cout << "Hello…" << endl;` | prints the text, then ends the line |
| `return 0;` | ends main and tells the operating system the program finished normally (0 means "no error") |
| `}` | closes main |

Every statement ends with a **semicolon**. The curly braces `{ }` group statements into a block; here, the body of main.

## Printing with cout

`cout` is the screen. The `<<` operator sends a value to it, and you can chain as many as you like:

```cpp example="cout and endl"
#include <iostream>
using namespace std;

int main() {
	cout << "Two plus three is " << 2 + 3 << endl;
	cout << "No line break here, ";
	cout << "so this continues the same line." << endl;
	cout << "A\nB\n";
	cout << "Tab\tseparated" << endl;
	return 0;
}
```

- Text in double quotes is printed exactly as written. `2 + 3` without quotes is worked out first, so 5 is printed.
- `endl` ends the line. The character `\n` inside a string does the same.
- `\t` is a tab. A backslash starts an **escape sequence**: `\"` prints a double quote, and `\\` prints a backslash.

## Statements run in order

The computer runs main's statements one at a time, from the top down, unless a decision or a loop (lessons A3 and A4) says otherwise. Press **Step through** on any example on this site to watch the highlighted line move down, one statement at a time.

## Comments

Comments are notes for people. The compiler ignores them.

```cpp norun
// A comment that runs to the end of the line.

/* A comment that can
   cover several lines. */

int count = 0;   // comments often explain why a line is there
```

Good comments explain **why**, not what: the code already says what it does.

## When the compiler says no

Before a program runs, the **compiler** checks that it is valid C++. If it is not, nothing runs and you get an error with a line number. This program has a mistake on purpose. Run it, read the message, then fix it and run it again:

```cpp error
#include <iostream>
using namespace std;

int main() {
	cout << "Line one" << endl
	cout << "Line two" << endl;
	return 0;
}
```

The first `cout` line is missing its semicolon. The compiler reports this kind of mistake when it reaches the next line. It cannot know a statement has ended until it sees something that cannot belong to it.

:::tip
Fix the **first** error message first. One mistake (a missing `;` or `}`) can confuse the compiler about everything after it, so later messages often disappear once the first is fixed.
:::

## Three kinds of mistakes

| Kind | When it shows up | Example |
|---|---|---|
| **Compile error** | before the program runs | a missing `;`, a misspelt name, a missing `#include` |
| **Runtime error** | while it runs, and it crashes | dividing by zero, following a NULL pointer |
| **Logic error** | it runs and finishes, but the answer is wrong | adding when you meant to multiply, `<` instead of `<=` |

The compiler only catches the first kind. The other two are found by testing: running the program and checking its output against what you expected.

:::teachback
In your own words, explain what each line of the smallest C++ program does (`#include <iostream>`, `using namespace std;`, `int main() {`, `return 0;`), and why a missing semicolon is reported on the line after it.
>> `#include <iostream>` brings in the input/output library that provides `cin` and `cout`.
>> `using namespace std;` lets you write `cout` instead of `std::cout`.
>> The program starts running at `main`, and its statements run from top to bottom.
>> `return 0;` ends main and tells the operating system the program finished normally.
>> The compiler only knows a statement has ended when it sees something that cannot belong to it, so the error shows up on the next line.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

int main() {
	cout << "1 + 1 = " << 1 + 1 << endl;
	cout << "done";
	cout << "!" << endl;
	return 0;
}
```
- [ ] `1 + 1 = 1 + 1⏎done⏎!`
- [x] `1 + 1 = 2⏎done!`
- [ ] `2⏎done!`
- [ ] `1 + 1 = 2 done !`
>> The text in quotes is printed as written, `1 + 1` outside quotes is worked out to 2, and "done" has no `endl` after it, so "!" continues on the same line.
:::

:::quiz
A program forgets `using namespace std;`. What happens?
- [ ] It runs, but prints nothing
- [x] It does not compile: `cout` and `endl` are unknown unless written as `std::cout` and `std::endl`
- [ ] It crashes when it reaches cout
- [ ] Nothing changes
>> The library's names live in the std namespace. Without `using namespace std;` the compiler only finds them by their full names, so `cout` on its own is an error.
:::

:::quiz
A program compiles and runs to the end, but prints the wrong total. What kind of mistake is this?
- [ ] A compile error
- [ ] A runtime error
- [x] A logic error
- [ ] A syntax error
>> The program is valid C++ and does not crash, so the compiler and the computer are both happy. The steps themselves are wrong, which is a logic error, found by testing.
:::
