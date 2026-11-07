---
title: Reading and writing files
summary: An ifstream reads from a file with the same >> and getline you use with cin, and an ofstream writes to a file with the same << you use with cout. Always check that the file opened, and loop with while (in >> x), which stops exactly at the end of the data.
lectures: COMP 1602/1603 review, Lectures 15–16
goals:
  - Open a file for reading or writing, and check that it opened
  - Read values until the end of the file with while (in >> x)
  - Explain why while (!in.eof ()) reads the last value twice
  - Read records into an array of structs
  - Write results to a file
labs: [memory]
---

## Streams

`cin` and `cout` are **streams**: values flow in from the keyboard and out to the screen. A file works the same way with a file stream, from `#include <fstream>`:

| Stream type | Direction | Used like |
|---|---|---|
| `ifstream` | input: reads from a file | `cin` |
| `ofstream` | output: writes to a file | `cout` |

## Reading a file

```cpp example="Reading numbers until the end of the file" file="marks.txt|72 85 64\n90 58\n"
#include <iostream>
#include <fstream>
using namespace std;

int main() {
	ifstream in;
	in.open ("marks.txt");
	if (!in.is_open ()) {
		cout << "Error: could not open marks.txt" << endl;
		return 1;
	}
	int mark, count = 0, total = 0;
	while (in >> mark) {
		count++;
		total += mark;
	}
	in.close ();
	cout << count << " marks, average " << (double) total / count << endl;
	return 0;
}
```

The file's contents are shown under the program.

1. **Open** the file. `ifstream in ("marks.txt");` opens it in one step, too.
2. **Check** that it opened. A misspelt name or a file in the wrong folder fails silently otherwise, and every read after that fails.
3. **Read** with `>>`, exactly as with cin. Spaces and new lines between values do not matter.
4. **Close** the file when you are done.

`while (in >> mark)` reads a value and then tests whether the read worked. When there is nothing left, the read fails, the test is false, and the loop stops: no extra pass, no special cases.

## The eof trap

`in.eof ()` only becomes true **after** a read has tried to go past the end. So this common loop runs once too often:

```cpp example="The eof trap" file="nums.txt|5 10 15\n"
#include <iostream>
#include <fstream>
using namespace std;

int main() {
	ifstream in ("nums.txt");
	int x, count = 0, total = 0;
	while (!in.eof ()) {
		in >> x;
		count++;
		total += x;
	}
	cout << "read " << count << " values, total " << total << endl;
	return 0;
}
```

The file holds 3 numbers but the loop counts 4. After reading 15 the stream has not yet seen the end (the new line after 15 is still there), so eof is false and the loop runs again. That read fails, x keeps its old value 15, and 15 is added a second time. Loop with `while (in >> x)` instead.

## Reading records

Files often hold one record per line. If every record has the same layout, read it field by field into a struct:

```cpp example="Reading records into an array of structs" file="students.txt|1001 Kezia 3.6\n1002 Ravi 3.2\n1003 Mei 3.9\n"
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

struct Student {
	int id;
	string name;
	double gpa;
};

const int MAX = 100;

int readStudents (string fileName, Student list[]) {   // returns how many were read
	ifstream in;
	in.open (fileName.c_str ());
	if (!in.is_open ())
		return 0;
	int n = 0;
	while (n < MAX && in >> list[n].id >> list[n].name >> list[n].gpa)
		n++;
	in.close ();
	return n;
}

int main() {
	Student list[MAX];
	int n = readStudents ("students.txt", list);
	for (int i = 0; i < n; i++)
		cout << list[i].name << " (" << list[i].id << "): " << list[i].gpa << endl;
	return 0;
}
```

The test `n < MAX` stops the loop before the array overflows, even if the file is longer than expected. Because `&&` short-circuits, no read is attempted once the array is full.

When the number of records comes first in the file, read it and loop exactly that many times. The graph files in lessons J2 to J4 work this way: the first line says how many vertices there are, and each row says how many edges follow.

To read whole lines (for example names with spaces), use `getline (in, line)`, just as with cin (lesson A8).

## Writing a file

```cpp example="Writing a file, then reading it back"
#include <iostream>
#include <fstream>
using namespace std;

int main() {
	ofstream out;
	out.open ("squares.txt");
	for (int i = 1; i <= 5; i++)
		out << i << " " << i * i << endl;
	out.close ();

	ifstream in ("squares.txt");
	int n, sq;
	while (in >> n >> sq)
		cout << n << " squared is " << sq << endl;
	in.close ();
	return 0;
}
```

Opening an ofstream **creates** the file, or **empties** it if it already exists. After you run this, a panel under the output shows what was written to squares.txt.

:::remember
- `#include <fstream>`; `ifstream` to read, `ofstream` to write.
- Check `is_open ()` before reading.
- Read until the end with `while (in >> x)`, not `while (!in.eof ())`.
- Close files when you are done.
:::

:::teachback
Explain why `while (!in.eof ())` processes the last value twice, and why `while (in >> x)` does not.
>> `eof ()` only becomes true after a read has tried to go past the end of the file.
>> After the last value is read, eof is still false, so the loop runs once more; that read fails and `x` keeps its old value, which is used again.
>> `while (in >> x)` reads first and then tests whether the read worked, so it stops exactly when there is no more data.
:::

:::quiz
A file contains `3 8 1`. What does this print?
```cpp norun
ifstream in ("data.txt");
int x, total = 0;
while (in >> x)
	total = total + x;
cout << total << endl;
```
- [x] 12
- [ ] 13
- [ ] 13, because the last value is read twice
- [ ] 0
>> The loop reads 3, 8 and 1, and the fourth read fails, ending the loop without adding anything. Total: 12.
:::

:::quiz
The same file is read with `while (!in.eof ()) { in >> x; total = total + x; }`. What is the total?
- [ ] 12
- [x] 13
- [ ] 11
- [ ] The program crashes
>> After reading 1 the end has not been detected yet, so the loop runs once more. That read fails and x keeps the value 1, which is added again: 3 + 8 + 1 + 1 = 13.
:::

:::quiz
A program opens "Data.txt" but the file is called "data.txt", and there is no is_open check. What happens?
- [ ] The compiler reports the wrong name
- [ ] C++ finds the file anyway
- [x] The open fails silently, and every read from the stream fails, so the program works with no data
- [ ] The program creates the file
>> An ifstream that fails to open does not stop the program. Reads from it simply fail. Checking `is_open ()` turns a mysterious wrong answer into a clear message.
:::
