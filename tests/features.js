// The C++ feature matrix: one small program per feature.
//   expect "match":  the interpreter's output must equal g++'s output exactly (g++ -std=c++17).
//   expect "reject": the interpreter must refuse to run it with a compile-time message (never run it wrongly).
//   expect "catch":  undefined behaviour or a runaway program: the interpreter must stop with a runtime error
//                    and an explanation. g++ is not compared, because undefined behaviour has no right answer.
// node tests/features.js            runs every case and prints a report
// node tests/features.js --json F   also writes the results to F (the build turns them into the Supported C++ page)
const M = (s) => "#include <iostream>\nusing namespace std;\n\n" + s;
const CASES = [
  // ---------------------------------------------------------------- values, types and arithmetic
  { id: "int-div", group: "Types and arithmetic", title: "Integer division and % (also with negatives)", expect: "match", src: M("int main () {\n\tcout << 7 / 2 << \" \" << -7 / 2 << \" \" << 7 % 3 << \" \" << -7 % 3 << endl;\n\treturn 0;\n}") },
  { id: "double-print", group: "Types and arithmetic", title: "Printing doubles (6 significant digits by default)", expect: "match", src: M("int main () {\n\tdouble a = 10.0 / 3, b = 2.5, c = 1e10, d = 100;\n\tcout << a << \" \" << b << \" \" << c << \" \" << d << endl;\n\treturn 0;\n}") },
  { id: "iomanip", group: "Types and arithmetic", title: "fixed, setprecision and setw", expect: "match", src: "#include <iostream>\n#include <iomanip>\nusing namespace std;\n\nint main () {\n\tcout << fixed << setprecision(2) << 3.14159 << endl;\n\tcout << setw(6) << 42 << \"|\" << endl;\n\treturn 0;\n}" },
  { id: "char-arith", group: "Types and arithmetic", title: "char arithmetic and casts", expect: "match", src: M("int main () {\n\tchar c = 'A';\n\tc = c + 2;\n\tcout << c << \" \" << (int) c << \" \" << (char) (c + 1) << \" \" << static_cast<int>('a') << endl;\n\treturn 0;\n}") },
  { id: "int-overflow", group: "Types and arithmetic", title: "int wraps around at 32 bits; long long does not", expect: "match", src: M("int main () {\n\tunsigned int u = 0;\n\tu = u - 1;\n\tlong long big = 2147483647LL * 2;\n\tcout << u << \" \" << big << endl;\n\treturn 0;\n}") },
  { id: "bool-print", group: "Types and arithmetic", title: "bool prints as 1 or 0; comparisons and && ||", expect: "match", src: M("int main () {\n\tbool t = 3 > 2, f = !t;\n\tcout << t << \" \" << f << \" \" << (t && f) << \" \" << (t || f) << endl;\n\treturn 0;\n}") },
  { id: "compound-ops", group: "Types and arithmetic", title: "++, --, +=, *=, %= and the ternary operator", expect: "match", src: M("int main () {\n\tint a = 5, b = a++, c = ++a;\n\ta += 3; a *= 2; a %= 7;\n\tcout << a << \" \" << b << \" \" << c << \" \" << (a > 3 ? \"big\" : \"small\") << endl;\n\treturn 0;\n}") },
  { id: "bitwise", group: "Types and arithmetic", title: "Bitwise operators and shifts", expect: "match", src: M("int main () {\n\tint x = 12;\n\tcout << (x & 10) << \" \" << (x | 3) << \" \" << (x ^ 5) << \" \" << (x << 2) << \" \" << (x >> 1) << endl;\n\treturn 0;\n}") },
  { id: "const-define", group: "Types and arithmetic", title: "const variables, #define constants, typedef and enum", expect: "match", src: "#include <iostream>\nusing namespace std;\n#define MAX 5\nconst int SIZE = 3;\ntypedef int Number;\nenum Colour { RED, GREEN = 4, BLUE };\n\nint main () {\n\tNumber n = MAX * SIZE;\n\tColour c = BLUE;\n\tcout << n << \" \" << c << \" \" << RED << endl;\n\treturn 0;\n}" },
  { id: "cmath", group: "Types and arithmetic", title: "<cmath>: sqrt, pow, fabs, floor, ceil", expect: "match", src: "#include <iostream>\n#include <cmath>\nusing namespace std;\n\nint main () {\n\tcout << sqrt(16.0) << \" \" << pow(2, 10) << \" \" << fabs(-2.5) << \" \" << floor(2.7) << \" \" << ceil(2.1) << endl;\n\treturn 0;\n}" },
  // ---------------------------------------------------------------- control flow
  { id: "switch", group: "Control flow", title: "switch with fall-through, break and default", expect: "match", src: M("int main () {\n\tfor (int i = 1; i <= 3; i++) {\n\t\tswitch (i) {\n\t\t\tcase 1: cout << \"one \";\n\t\t\tcase 2: cout << \"two \"; break;\n\t\t\tdefault: cout << \"other \";\n\t\t}\n\t}\n\tcout << endl;\n\treturn 0;\n}") },
  { id: "loops", group: "Control flow", title: "while, do-while, for, break and continue", expect: "match", src: M("int main () {\n\tint i = 0;\n\twhile (i < 3) i++;\n\tdo { i--; } while (i > 10);\n\tfor (int j = 0; j < 10; j++) {\n\t\tif (j % 2 == 0) continue;\n\t\tif (j > 7) break;\n\t\tcout << j << \" \";\n\t}\n\tcout << i << endl;\n\treturn 0;\n}") },
  { id: "nested-loops", group: "Control flow", title: "Nested loops", expect: "match", src: M("int main () {\n\tfor (int i = 1; i <= 3; i++) {\n\t\tfor (int j = 1; j <= i; j++)\n\t\t\tcout << i * j << \" \";\n\t\tcout << endl;\n\t}\n\treturn 0;\n}") },
  // ---------------------------------------------------------------- functions
  { id: "pass-modes", group: "Functions", title: "Pass by value, by reference and by pointer", expect: "match", src: M("void f (int a, int & b, int * c) {\n\ta = 1; b = 2; *c = 3;\n}\n\nint main () {\n\tint x = 0, y = 0, z = 0;\n\tf (x, y, &z);\n\tcout << x << \" \" << y << \" \" << z << endl;\n\treturn 0;\n}") },
  { id: "const-ref", group: "Functions", title: "const reference parameters", expect: "match", src: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint count (const string & s, char c) {\n\tint n = 0;\n\tfor (int i = 0; i < s.length(); i++)\n\t\tif (s[i] == c) n++;\n\treturn n;\n}\n\nint main () {\n\tcout << count (\"banana\", 'a') << endl;\n\treturn 0;\n}" },
  { id: "overload", group: "Functions", title: "Function overloading", expect: "match", src: M("int twice (int x) { return x * 2; }\ndouble twice (double x) { return x * 2.5; }\n\nint main () {\n\tcout << twice (3) << \" \" << twice (2.0) << endl;\n\treturn 0;\n}") },
  { id: "default-args", group: "Functions", title: "Default arguments", expect: "match", src: M("int add (int a, int b = 10) { return a + b; }\n\nint main () {\n\tcout << add (1) << \" \" << add (1, 2) << endl;\n\treturn 0;\n}") },
  { id: "recursion", group: "Functions", title: "Recursion (factorial and Fibonacci)", expect: "match", src: M("int fact (int n) {\n\tif (n <= 1) return 1;\n\treturn n * fact (n - 1);\n}\nint fib (int n) { return n < 2 ? n : fib (n - 1) + fib (n - 2); }\n\nint main () {\n\tcout << fact (10) << \" \" << fib (15) << endl;\n\treturn 0;\n}") },
  { id: "globals-static", group: "Functions", title: "Global variables and static local variables", expect: "match", src: M("int calls = 0;\nint counter () {\n\tstatic int n = 0;\n\tn++; calls++;\n\treturn n;\n}\n\nint main () {\n\tcounter (); counter ();\n\tcout << counter () << \" \" << calls << endl;\n\treturn 0;\n}") },
  { id: "prototypes", group: "Functions", title: "Function prototypes declared before main", expect: "match", src: M("int square (int x);\n\nint main () {\n\tcout << square (7) << endl;\n\treturn 0;\n}\n\nint square (int x) { return x * x; }") },
  // ---------------------------------------------------------------- arrays and strings
  { id: "arrays", group: "Arrays and strings", title: "Arrays, initialiser lists and passing an array to a function", expect: "match", src: M("int sum (int A[], int n) {\n\tint s = 0;\n\tfor (int i = 0; i < n; i++) s += A[i];\n\treturn s;\n}\n\nint main () {\n\tint A[5] = {3, 1, 4};\n\tcout << sum (A, 5) << \" \" << A[4] << endl;\n\treturn 0;\n}") },
  { id: "arrays-2d", group: "Arrays and strings", title: "Two-dimensional arrays", expect: "match", src: M("int main () {\n\tint G[2][3] = {{1, 2, 3}, {4, 5, 6}};\n\tint t = 0;\n\tfor (int r = 0; r < 2; r++)\n\t\tfor (int c = 0; c < 3; c++)\n\t\t\tt += G[r][c] * (r + 1);\n\tcout << t << endl;\n\treturn 0;\n}") },
  { id: "string-ops", group: "Arrays and strings", title: "std::string: +, ==, <, length, substr, find, [] and at", expect: "match", src: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main () {\n\tstring s = \"data\", t = s + \" structures\";\n\tcout << t << \" \" << t.length() << \" \" << t.substr(5, 6) << \" \" << t.find(\"struct\") << \" \" << t[0] << t.at(1) << \" \" << (s < t) << (s == \"data\") << endl;\n\treturn 0;\n}" },
  { id: "c-strings", group: "Arrays and strings", title: "C strings: char arrays, strlen, strcpy and strcmp", expect: "match", src: "#include <iostream>\n#include <cstring>\nusing namespace std;\n\nint main () {\n\tchar a[20] = \"tree\", b[20];\n\tstrcpy (b, a);\n\tstrcat (b, \"s\");\n\tcout << strlen (b) << \" \" << b << \" \" << (strcmp (a, b) < 0) << endl;\n\treturn 0;\n}" },
  { id: "getline-ss", group: "Arrays and strings", title: "getline and stringstream", expect: "match", stdin: "10 20 30\n", src: "#include <iostream>\n#include <sstream>\n#include <string>\nusing namespace std;\n\nint main () {\n\tstring line;\n\tgetline (cin, line);\n\tstringstream ss (line);\n\tint x, total = 0;\n\twhile (ss >> x) total += x;\n\tcout << total << endl;\n\treturn 0;\n}" },
  // ---------------------------------------------------------------- pointers and dynamic memory
  { id: "ptr-basics", group: "Pointers and memory", title: "& and *, pointer assignment and pointers to pointers", expect: "match", src: M("int main () {\n\tint x = 5, y = 9;\n\tint * p = &x;\n\tint ** pp = &p;\n\t*p = 7;\n\t*pp = &y;\n\t*p = *p + 1;\n\tcout << x << \" \" << y << \" \" << **pp << endl;\n\treturn 0;\n}") },
  { id: "ptr-arith", group: "Pointers and memory", title: "Pointer arithmetic over an array", expect: "match", src: M("int main () {\n\tint A[4] = {10, 20, 30, 40};\n\tint * p = A;\n\tp = p + 2;\n\tcout << *p << \" \" << *(A + 1) << \" \" << p[1] << \" \" << (p - A) << endl;\n\treturn 0;\n}") },
  { id: "new-delete", group: "Pointers and memory", title: "new and delete, NULL and nullptr", expect: "match", src: M("int main () {\n\tint * p = new int;\n\t*p = 42;\n\tcout << *p << endl;\n\tdelete p;\n\tp = NULL;\n\tint * q = nullptr;\n\tcout << (p == NULL) << (q == nullptr) << endl;\n\treturn 0;\n}") },
  { id: "new-array", group: "Pointers and memory", title: "new[] and delete[]: a dynamic array", expect: "match", src: M("int main () {\n\tint n = 5;\n\tint * A = new int[n];\n\tfor (int i = 0; i < n; i++) A[i] = i * i;\n\tcout << A[n - 1] << endl;\n\tdelete [] A;\n\treturn 0;\n}") },
  { id: "dynamic-2d", group: "Pointers and memory", title: "A dynamic 2D array (array of pointers)", expect: "match", src: M("int main () {\n\tint ** G = new int * [3];\n\tfor (int i = 0; i < 3; i++) {\n\t\tG[i] = new int[3];\n\t\tfor (int j = 0; j < 3; j++) G[i][j] = i + j;\n\t}\n\tcout << G[2][2] << endl;\n\tfor (int i = 0; i < 3; i++) delete [] G[i];\n\tdelete [] G;\n\treturn 0;\n}") },
  { id: "linked-list", group: "Pointers and memory", title: "Structs with pointers: a linked list", expect: "match", src: M("struct Node {\n\tint data;\n\tNode * next;\n};\n\nint main () {\n\tNode * top = NULL;\n\tfor (int i = 1; i <= 3; i++) {\n\t\tNode * n = new Node;\n\t\tn->data = i;\n\t\tn->next = top;\n\t\ttop = n;\n\t}\n\tfor (Node * c = top; c != NULL; c = c->next) cout << c->data << \" \";\n\tcout << endl;\n\twhile (top != NULL) { Node * t = top; top = top->next; delete t; }\n\treturn 0;\n}") },
  { id: "ref-to-ptr", group: "Pointers and memory", title: "A reference to a pointer (Node * & top)", expect: "match", src: M("struct Node { int data; Node * next; };\n\nvoid push (Node * & top, int v) {\n\tNode * n = new Node;\n\tn->data = v;\n\tn->next = top;\n\ttop = n;\n}\n\nint main () {\n\tNode * top = NULL;\n\tpush (top, 1); push (top, 2);\n\tcout << top->data << top->next->data << endl;\n\tdelete top->next; delete top;\n\treturn 0;\n}") },
  // ---------------------------------------------------------------- structs
  { id: "struct-copy", group: "Structs", title: "Struct assignment copies every field (a shallow copy)", expect: "match", src: M("struct Box { int n; int * p; };\n\nint main () {\n\tint v = 1;\n\tBox a = {5, &v};\n\tBox b = a;\n\tb.n = 6;\n\t*b.p = 9;\n\tcout << a.n << \" \" << b.n << \" \" << *a.p << endl;\n\treturn 0;\n}") },
  { id: "struct-nested", group: "Structs", title: "Nested structs, arrays of structs, returning a struct", expect: "match", src: M("struct Point { int x, y; };\nstruct Line { Point a, b; };\n\nPoint mid (Line L) {\n\tPoint m;\n\tm.x = (L.a.x + L.b.x) / 2;\n\tm.y = (L.a.y + L.b.y) / 2;\n\treturn m;\n}\n\nint main () {\n\tLine ls[2] = {{{0, 0}, {4, 6}}, {{2, 2}, {2, 8}}};\n\tPoint m = mid (ls[1]);\n\tcout << m.x << \",\" << m.y << endl;\n\treturn 0;\n}") },
  // ---------------------------------------------------------------- input and files
  { id: "cin", group: "Input and files", title: "cin >> for numbers and words, reading until the input ends", expect: "match", stdin: "3 apples 4 pears\n", src: "#include <iostream>\n#include <string>\nusing namespace std;\n\nint main () {\n\tint n, total = 0;\n\tstring w;\n\twhile (cin >> n >> w) total += n;\n\tcout << total << endl;\n\treturn 0;\n}" },
  { id: "files", group: "Input and files", title: "ifstream and ofstream (files kept in the page)", expect: "match", files: { "in.txt": "5\n7\n" }, src: "#include <iostream>\n#include <fstream>\nusing namespace std;\n\nint main () {\n\tifstream in (\"in.txt\");\n\tofstream out (\"out.txt\");\n\tint a, b;\n\tin >> a >> b;\n\tout << a + b << endl;\n\tout.close ();\n\tifstream back (\"out.txt\");\n\tint c;\n\tback >> c;\n\tcout << c << endl;\n\treturn 0;\n}" },
  // ---------------------------------------------------------------- runtime checks (undefined behaviour is stopped and explained)
  { id: "null-deref", group: "Errors caught while running", title: "Following a NULL pointer", expect: "catch", src: M("struct Node { int data; Node * next; };\n\nint main () {\n\tNode * p = NULL;\n\tcout << p->data << endl;\n\treturn 0;\n}") },
  { id: "use-after-free", group: "Errors caught while running", title: "Using memory after delete (a dangling pointer)", expect: "catch", src: M("int main () {\n\tint * p = new int;\n\t*p = 1;\n\tdelete p;\n\tcout << *p << endl;\n\treturn 0;\n}") },
  { id: "double-delete", group: "Errors caught while running", title: "Deleting the same memory twice", expect: "catch", src: M("int main () {\n\tint * p = new int;\n\tdelete p;\n\tdelete p;\n\treturn 0;\n}") },
  { id: "delete-mismatch", group: "Errors caught while running", title: "delete on memory made with new[]", expect: "catch", src: M("int main () {\n\tint * A = new int[4];\n\tdelete A;\n\treturn 0;\n}") },
  { id: "out-of-bounds", group: "Errors caught while running", title: "An array index past the end", expect: "catch", src: M("int main () {\n\tint A[3] = {1, 2, 3};\n\tint s = 0;\n\tfor (int i = 0; i <= 3; i++) s += A[i];\n\tcout << s << endl;\n\treturn 0;\n}") },
  { id: "uninit", group: "Errors caught while running", title: "Using a variable before giving it a value", expect: "catch", src: M("int main () {\n\tint total;\n\tfor (int i = 0; i < 3; i++) total += i;\n\tcout << total << endl;\n\treturn 0;\n}") },
  { id: "div-zero", group: "Errors caught while running", title: "Integer division by zero", expect: "catch", src: M("int main () {\n\tint a = 5, b = 0;\n\tcout << a / b << endl;\n\treturn 0;\n}") },
  { id: "infinite-loop", group: "Errors caught while running", title: "A loop that never ends", expect: "catch", src: M("int main () {\n\tint i = 0;\n\twhile (i < 10) { }\n\treturn 0;\n}") },
  { id: "deep-recursion", group: "Errors caught while running", title: "Recursion with no base case", expect: "catch", src: M("int f (int n) { return f (n + 1); }\n\nint main () {\n\tcout << f (0) << endl;\n\treturn 0;\n}") },
  // ---------------------------------------------------------------- not supported: refused with a message, never run wrongly
  { id: "class-methods", group: "Not supported (refused with a message)", title: "Classes and structs with member functions", expect: "reject", src: M("class Counter {\npublic:\n\tint n;\n\tvoid add () { n++; }\n};\n\nint main () {\n\tCounter c;\n\tc.n = 0;\n\tc.add ();\n\tcout << c.n << endl;\n\treturn 0;\n}") },
  { id: "constructors", group: "Not supported (refused with a message)", title: "Constructors and destructors", expect: "reject", src: M("struct Node {\n\tint data;\n\tNode * next;\n\tNode (int d) { data = d; next = NULL; }\n};\n\nint main () {\n\tNode * n = new Node (5);\n\tcout << n->data << endl;\n\treturn 0;\n}") },
  { id: "templates", group: "Not supported (refused with a message)", title: "Templates", expect: "reject", src: M("template <typename T>\nT biggest (T a, T b) { return a > b ? a : b; }\n\nint main () {\n\tcout << biggest (3, 4) << endl;\n\treturn 0;\n}") },
  { id: "stl-vector", group: "Not supported (refused with a message)", title: "STL containers (vector, stack, queue, map …)", expect: "reject", src: "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main () {\n\tvector<int> v;\n\tv.push_back (3);\n\tcout << v.size () << endl;\n\treturn 0;\n}" },
  { id: "auto", group: "Not supported (refused with a message)", title: "auto", expect: "reject", src: M("int main () {\n\tauto x = 5;\n\tcout << x << endl;\n\treturn 0;\n}") },
  { id: "range-for", group: "Not supported (refused with a message)", title: "Range-based for loops", expect: "reject", src: M("int main () {\n\tint A[3] = {1, 2, 3};\n\tfor (int x : A) cout << x;\n\tcout << endl;\n\treturn 0;\n}") },
  { id: "exceptions", group: "Not supported (refused with a message)", title: "Exceptions (try, throw, catch)", expect: "reject", src: M("int main () {\n\ttry { throw 5; }\n\tcatch (int e) { cout << e << endl; }\n\treturn 0;\n}") },
  { id: "inheritance", group: "Not supported (refused with a message)", title: "Inheritance", expect: "reject", src: M("struct A { int x; };\nstruct B : A { int y; };\n\nint main () {\n\tB b;\n\tb.x = 1;\n\tcout << b.x << endl;\n\treturn 0;\n}") },
  { id: "lambda", group: "Not supported (refused with a message)", title: "Lambdas", expect: "reject", src: M("int main () {\n\tint k = 2;\n\tint r = [k] (int x) { return x * k; } (5);\n\tcout << r << endl;\n\treturn 0;\n}") },
  { id: "operator-overload", group: "Not supported (refused with a message)", title: "Operator overloading", expect: "reject", src: M("struct P { int x; };\nP operator + (P a, P b) { P r; r.x = a.x + b.x; return r; }\n\nint main () {\n\tP a = {1}, b = {2};\n\tcout << (a + b).x << endl;\n\treturn 0;\n}") },
  { id: "fn-pointer", group: "Not supported (refused with a message)", title: "Function pointers", expect: "reject", src: M("int twice (int x) { return 2 * x; }\n\nint main () {\n\tint (*f) (int) = twice;\n\tcout << f (4) << endl;\n\treturn 0;\n}") },
  { id: "macro-params", group: "Not supported (refused with a message)", title: "Macros with parameters", expect: "reject", src: "#include <iostream>\nusing namespace std;\n#define SQUARE(x) ((x) * (x))\n\nint main () {\n\tcout << SQUARE(4) << endl;\n\treturn 0;\n}" },
  { id: "lib-sort", group: "Not supported (refused with a message)", title: "Library algorithms such as sort, and C functions such as printf and malloc", expect: "reject", src: "#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nint main () {\n\tint A[3] = {3, 1, 2};\n\tsort (A, A + 3);\n\tcout << A[0] << endl;\n\treturn 0;\n}" },
  { id: "namespaces", group: "Not supported (refused with a message)", title: "Declaring your own namespaces", expect: "reject", src: M("namespace geo { int k = 3; }\n\nint main () {\n\tcout << geo::k << endl;\n\treturn 0;\n}") }
];
module.exports = CASES;

if (require.main === module) {
  const CPP = require("./load.js");
  const fs = require("fs"), path = require("path"), cp = require("child_process");
  const tmp = "/tmp/claude-0/featuretest";
  fs.mkdirSync(tmp, { recursive: true });
  const results = [];
  let bad = 0;
  for (const c of CASES) {
    const r = CPP.run(c.src, { stdin: c.stdin || "", files: c.files || {}, maxSteps: 2000000 });
    const res = { id: c.id, group: c.group, title: c.title, expect: c.expect, src: c.src, ok: false, out: r.out, msg: r.err ? r.err.msg : "", kind: r.err ? r.err.kind : "", line: r.err ? r.err.line : null };
    if (c.expect === "match") {
      for (const [n, t] of Object.entries(c.files || {})) fs.writeFileSync(path.join(tmp, n), t);
      const src = path.join(tmp, c.id + ".cpp"), exe = path.join(tmp, c.id + ".out");
      fs.writeFileSync(src, c.src);
      let g = "";
      try {
        cp.execFileSync("g++", ["-std=c++17", "-O0", "-w", "-o", exe, src], { stdio: "pipe" });
        g = cp.execFileSync(exe, { input: c.stdin || "", cwd: tmp, stdio: ["pipe", "pipe", "pipe"], timeout: 5000 }).toString();
      } catch (e) { g = "[g++ failed] " + String(e.stderr || e.message).slice(0, 200); }
      res.gpp = g;
      res.ok = !r.err && r.out === g;
    } else if (c.expect === "reject") {
      res.ok = !r.compiled && !!r.err && r.out === "";
    } else if (c.expect === "catch") {
      res.ok = r.compiled !== false && !!r.err && r.err.kind !== "compile";
    }
    if (!res.ok) bad++;
    console.log((res.ok ? "ok   " : "FAIL ") + c.expect.padEnd(7) + c.id.padEnd(18) + (res.ok ? "" : " out=" + JSON.stringify(r.out).slice(0, 80) + (res.gpp !== undefined ? " g++=" + JSON.stringify(res.gpp).slice(0, 80) : "")) + (res.msg ? "  [" + res.kind + "] " + res.msg.slice(0, 110) : ""));
    results.push(res);
  }
  console.log("\n" + (CASES.length - bad) + " of " + CASES.length + " behave as documented");
  const j = process.argv.indexOf("--json");
  if (j > 0) fs.writeFileSync(process.argv[j + 1], JSON.stringify({ generated: new Date().toISOString().slice(0, 10), compiler: (() => { try { return cp.execFileSync("g++", ["--version"]).toString().split("\n")[0]; } catch (e) { return "g++"; } })(), cases: results }, null, 1));
  process.exit(bad ? 1 : 0);
}
