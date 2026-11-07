---
title: Strings and characters
summary: A char is a single character stored as a small number (its character code). A string is a sequence of chars with useful operations - length, indexing, joining, comparing, substr and find. Reading a whole line needs getline. Older C-style strings are char arrays ending in '\0'.
lectures: COMP 1602/1603 review, Lecture 15
goals:
  - Use character codes and char arithmetic, and the cctype functions
  - Index, join, compare and search strings
  - Read a word with cin >> and a whole line with getline, and mix them safely
  - Loop over the characters of a string
  - Work with C-style strings that end in '\0'
labs: [memory]
---

## Characters are numbers

A `char` holds one character, written in single quotes: `'A'`, `'z'`, `'7'`, `' '`. Inside the computer it is stored as a number, its **character code** (ASCII):

| Characters | Codes |
|---|---|
| `'0'` to `'9'` | 48 to 57 |
| `'A'` to `'Z'` | 65 to 90 |
| `'a'` to `'z'` | 97 to 122 |
| space `' '` | 32 |

The letters and digits are in order, so arithmetic on chars is meaningful:

```cpp example="Character arithmetic"
#include <iostream>
#include <cctype>
using namespace std;

int main() {
	char c = 'C';
	cout << (int) c << endl;                  // its code: 67
	cout << (char) (c + 1) << endl;           // the next letter: D
	cout << c - 'A' << endl;                  // its position in the alphabet: 2
	char d = '7';
	cout << d - '0' << endl;                  // the digit's value: 7
	cout << (char) toupper ('q') << (char) tolower ('Q') << endl;
	if (isdigit (d) && isalpha (c))
		cout << "digit and letter" << endl;
	return 0;
}
```

- `d - '0'` turns the **character** '7' into the **number** 7. Useful when reading digits one at a time.
- `<cctype>` provides tests such as `isdigit`, `isalpha`, `isupper`, `islower`, `isspace`, and conversions `toupper` and `tolower`. The tests return nonzero for true, so use them in conditions rather than printing them.

The string hash functions in lesson I3 add up these codes: `intValue = intValue + str[i];`.

## Strings

A `string` (from `#include <string>`) holds a sequence of characters, written in double quotes.

```cpp example="String operations"
#include <iostream>
#include <string>
using namespace std;

int main() {
	string s = "Data Structures";
	cout << s.length () << endl;              // number of characters: 15
	cout << s[0] << s[5] << endl;             // characters by index: D and S
	string t = s + " in C++";                 // joining (concatenation)
	cout << t << endl;
	cout << s.substr (5, 6) << endl;          // 6 characters starting at index 5
	cout << s.find ("Struct") << endl;        // index where it starts: 5
	if (s.find ("Java") == string::npos)
		cout << "no Java here" << endl;
	s[0] = 'd';                               // strings can be changed
	cout << s << endl;
	cout << (string ("apple") < string ("banana")) << " " << (s == "data Structures") << endl;
	return 0;
}
```

| Operation | Meaning |
|---|---|
| `s.length ()` or `s.size ()` | the number of characters |
| `s[i]` | the character at index i (0 to length − 1) |
| `s + t`, `s += t` | joining |
| `s == t`, `s < t` | comparison: equal, or comes first in dictionary order (by character codes) |
| `s.substr (start, count)` | count characters starting at index start |
| `s.find (t)` | the index where t first appears, or `string::npos` if it does not |

:::mistake
Comparison is by character codes, and every capital letter comes before every small letter: `"Zebra" < "apple"` is true. Convert both to the same case first when the case should not matter.
:::

## Reading words and lines

`cin >> s` reads **one word**: it skips spaces, then stops at the next space or new line. To read a whole line, spaces included, use `getline`:

```cpp example="cin >> and getline" stdin="20\nAnn Marie Joseph\n"
#include <iostream>
#include <string>
using namespace std;

int main() {
	int age;
	string fullName;
	cin >> age;
	cin.ignore ();                // skip the new line left behind after the number
	getline (cin, fullName);
	cout << fullName << " is " << age << endl;
	return 0;
}
```

`cin >> age` reads 20 but leaves the new line after it waiting. Without `cin.ignore ()`, getline would read that empty remainder of the line and finish at once, so fullName would be empty. Whenever a `getline` follows a `>>`, skip the leftover new line first.

## Looping over the characters

A string is used like an array of chars:

```cpp example="Counting and changing characters"
#include <iostream>
#include <string>
#include <cctype>
using namespace std;

int countVowels (string s) {
	int count = 0;
	for (int i = 0; i < (int) s.length (); i++) {
		char c = tolower (s[i]);
		if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u')
			count++;
	}
	return count;
}

bool isPalindrome (string s) {
	int lo = 0, hi = s.length () - 1;
	while (lo < hi) {
		if (s[lo] != s[hi])
			return false;
		lo++;
		hi--;
	}
	return true;
}

int main() {
	cout << countVowels ("Binary Search Tree") << endl;
	cout << isPalindrome ("racecar") << " " << isPalindrome ("heap") << endl;
	string word = "linked";
	for (int i = 0; i < (int) word.length (); i++)
		word[i] = toupper (word[i]);
	cout << word << endl;
	return 0;
}
```

`s.length ()` gives an unsigned number, so the loop compares against `(int) s.length ()` to keep both sides as ints.

## C-style strings

Before the string type existed, text was stored in a **char array** that ends with the special character `'\0'` (the null character, code 0). Many older functions, and the lecture's hashing loop, still use this form:

```cpp example="A C-style string"
#include <iostream>
#include <cstring>
using namespace std;

int main() {
	char word[20] = "team";               // 't' 'e' 'a' 'm' '\0', and the rest unused
	int i = 0, total = 0;
	while (word[i] != '\0') {             // the lecture's loop: stop at the null character
		total = total + word[i];
		i++;
	}
	cout << i << " characters, codes add up to " << total << endl;
	cout << strlen (word) << endl;        // also counts up to the '\0'
	char copy[20];
	strcpy (copy, word);                  // copy a C-string
	cout << strcmp (copy, word) << endl;  // 0 means equal
	return 0;
}
```

- The array needs one extra box for the `'\0'`: "team" takes 5 chars.
- `strlen`, `strcpy` and `strcmp` come from `<cstring>`. `strcmp` returns 0 when the strings are equal (not true!).
- A `string` can be turned into a C-string with `s.c_str ()`, which is how `ifstream.open` received file names in older C++ (lesson J2).

:::remember
- A char is a number: `'A'` is 65, `'a'` is 97, `'0'` is 48. `c - '0'` gives a digit's value.
- `s.length ()`, `s[i]`, `+`, `==`, `<`, `substr`, `find` and `string::npos`.
- `cin >>` reads a word; `getline (cin, s)` reads a line. Use `cin.ignore ()` between them.
- C-strings end with `'\0'`.
:::

:::teachback
Explain why `cin >> n;` followed by `getline (cin, name);` usually leaves `name` empty, and how to fix it.
>> `cin >> n` reads the number but leaves the newline typed after it waiting in the input.
>> `getline` reads up to the next newline, which is already there, so it reads an empty line.
>> Calling `cin.ignore ();` first skips the leftover newline.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
#include <string>
using namespace std;

int main() {
	string s = "hashing";
	cout << s.length () << " " << s.substr (2, 3) << " " << s.find ("in") << endl;
	return 0;
}
```
- [ ] `7 ash 4`
- [x] `7 shi 4`
- [ ] `8 shi 5`
- [ ] `7 shi 5`
>> "hashing" has 7 characters: h(0) a(1) s(2) h(3) i(4) n(5) g(6). substr (2, 3) takes s, h, i. "in" starts at index 4.
:::

:::quiz
`char c = '5';` Which expression gives the **number** 5?
- [ ] `(int) c`
- [x] `c - '0'`
- [ ] `c - 0`
- [ ] `c + '0'`
>> '5' is stored as code 53 and '0' as 48, so c - '0' is 53 − 48 = 5. `(int) c` and `c - 0` both give 53.
:::

:::quiz
A program does `cin >> n;` and then `getline (cin, name);`, and name always comes out empty. Why?
- [ ] getline cannot read after cin
- [x] `cin >> n` leaves the new line in the input, and getline reads the rest of that line, which is empty
- [ ] name must be a char array
- [ ] getline only reads one word
>> getline reads up to the next new line. The new line typed after the number is still waiting, so getline stops immediately. Calling `cin.ignore ()` first skips it.
:::
