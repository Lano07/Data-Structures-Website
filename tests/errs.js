// Each case: [name, code, expected line, substring of the message]
const CPP = require("./load.js");
const H = "#include <iostream>\nusing namespace std;\nstruct Node { int data; Node * next; };\n";
const cases = [
  ["missing semicolon", H + "int main() {\n  int x = 5\n  cout << x;\n}", 5, "Missing ;"],
  ["undeclared", H + "int main() {\n  int count = 0;\n  cout << cout2;\n}", 6, "has not been declared"],
  ["typo suggestion", H + "int main() {\n  int total = 0;\n  totl = 5;\n}", 6, "Did you mean"],
  ["dot on pointer", H + "int main() {\n  Node * p = new Node;\n  p.data = 5;\n}", 6, "use ->"],
  ["arrow on struct", H + "int main() {\n  Node n;\n  n->data = 5;\n}", 6, "use a dot"],
  ["bad field", H + "int main() {\n  Node * p = new Node;\n  p->nxt = NULL;\n}", 6, "no field called nxt"],
  ["no namespace", "#include <iostream>\nint main() {\n  cout << 5;\n}", 3, "std namespace"],
  ["no include", "using namespace std;\nint main() {\n  cout << 5;\n}", 3, "#include <iostream>"],
  ["called before declared", H + "int main() {\n  f();\n}\nvoid f() {}", 5, "further down"],
  ["wrong arg count", H + "int sq(int x) { return x * x; }\nint main() {\n  cout << sq(1, 2);\n}", 6, "needs 1 argument"],
  ["int to pointer", H + "int main() {\n  Node * p = 5;\n}", 5, "Cannot store the number 5 in a pointer"],
  ["pointer to int", H + "int main() {\n  Node * p = NULL;\n  int x = p;\n}", 6, "Cannot store a pointer"],
  ["string vs char", H + "#include <string>\nint main() {\n  string s = \"abc\";\n  if (s[0] == \"a\") cout << 1;\n}", 7, "single char"],
  ["void in cout", H + "void f() {}\nint main() {\n  cout << f();\n}", 6, "returns void"],
  ["missing return value", H + "int f(int x) { if (x > 0) return 1; }\nint main() {\n  cout << f(-1);\n}", 4, "without returning"],
  ["struct no semicolon", "#include <iostream>\nusing namespace std;\nstruct Node { int data; Node * next; }\nint main() { return 0; }", 3, "must end with };"],
  ["ref needs lvalue", H + "void inc(int & x) { x++; }\nint main() {\n  inc(5);\n}", 6, "must be joined to a variable"],
  ["null deref", H + "int main() {\n  Node * p = NULL;\n  cout << p->data;\n}", 6, "is NULL"],
  ["uninit pointer", H + "int main() {\n  Node * p;\n  p->data = 5;\n}", 6, "has not been given an address"],
  ["uninit variable", H + "int main() {\n  int x;\n  cout << x + 1;\n}", 6, "before it has been given a value"],
  ["uninit field", H + "int main() {\n  Node * p = new Node;\n  p->data = 1;\n  if (p->next == NULL) cout << 1;\n}", 7, "has not been given"],
  ["use after delete", H + "int main() {\n  Node * p = new Node;\n  p->data = 1;\n  delete p;\n  cout << p->data;\n}", 8, "was deleted"],
  ["double delete", H + "int main() {\n  Node * p = new Node;\n  delete p;\n  delete p;\n}", 7, "already deleted"],
  ["delete stack", H + "int main() {\n  int x = 5;\n  int * p = &x;\n  delete p;\n}", 7, "not made with new"],
  ["out of bounds", H + "int main() {\n  int A[5];\n  for (int i = 0; i <= 5; i++) A[i] = i;\n}", 6, "outside the array"],
  ["infinite loop", H + "int main() {\n  int i = 0;\n  while (i < 10) { cout << \"\"; }\n}", 6, "loop that never ends"],
  ["deep recursion", H + "int f(int n) { return f(n + 1); }\nint main() {\n  f(0);\n}", 4, "base case"],
  ["div by zero", H + "int main() {\n  int a = 5, b = 0;\n  cout << a / b;\n}", 6, "Division by zero"],
  ["break outside", H + "int main() {\n  break;\n}", 5, "inside a loop"],
  ["no main", H + "int f() { return 1; }", 1, "no main"],
  ["redeclare", H + "int main() {\n  int x = 1;\n  int x = 2;\n}", 6, "already declared"],
  ["delete[] mismatch", H + "int main() {\n  int * a = new int[5];\n  delete a;\n}", 6, "delete []"],
  ["dangling local", H + "int * f() { int x = 5; return &x; }\nint main() {\n  int * p = f();\n  cout << *p;\n}", 7, "no longer exists"],
  ["string plus int", H + "#include <string>\nint main() {\n  string s = \"a\";\n  s = s + 5;\n}", 7, "to_string"],
  ["unknown type", H + "int main() {\n  node * p = NULL;\n}", 5, "Did you mean Node"],
  ["assign to call", H + "int f() { return 1; }\nint main() {\n  f() = 5;\n}", 6, "must be a variable"],
  ["for commas", H + "int main() {\n  for (int i = 0, i < 5, i++) {}\n}", 5, "semicolons"],
  ["vector", "#include <iostream>\n#include <vector>\nusing namespace std;\nint main() {\n  vector<int> v;\n}", 5, "vector"],
];
let pass = 0;
for (const [name, code, line, sub] of cases) {
  const r = CPP.run(code, { maxSteps: 100000 });
  const ok = r.err && r.err.line === line && (r.err.msg + " " + r.err.hint).includes(sub);
  if (ok) pass++;
  else console.log("FAIL " + name + ": got " + (r.err ? "line " + r.err.line + " " + JSON.stringify(r.err.msg) : "no error, out=" + JSON.stringify(r.out)));
}
console.log(pass + "/" + cases.length + " error cases pass");
