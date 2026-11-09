#!/usr/bin/env python3
"""Build COMP 2611 Code Lab: validate content against g++ and the JS interpreter, then bundle one HTML file."""
import json, os, re, subprocess, sys, hashlib, shutil, random

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
CONTENT = os.path.join(ROOT, "content")
BUILD = os.path.join(ROOT, "build")
DIST = os.path.join(ROOT, "dist")
os.makedirs(BUILD, exist_ok=True)
os.makedirs(DIST, exist_ok=True)
QUICK = "--quick" in sys.argv          # skip g++ validation
ERRORS = []

def err(msg):
    ERRORS.append(msg)
    print("ERROR:", msg)

# ---------------------------------------------------------------- course structure
PARTS = [
    {"id": "a", "title": "C++ foundations", "lectures": "COMP 1602/1603 review", "topics": ["basics", "functions", "arrays", "structs", "files"],
     "blurb": "Everything the data structures build on: programs, variables, decisions, loops, functions, references, arrays, strings, structs and files.",
     "lessons": ["a1-first-program", "a2-variables", "a3-decisions", "a4-loops", "a5-functions", "a6-references", "a7-arrays", "a8-strings", "a9-structs", "a10-files", "a11-organizing"]},
    {"id": "b", "title": "Pointers and dynamic memory", "lectures": "Lecture 1", "topics": ["pointers"],
     "blurb": "Addresses, pointer variables, new and delete, the heap, and the mistakes that crash programs.",
     "lessons": ["b1-addresses", "b2-pointers-structs", "b3-new-delete", "b4-pitfalls", "b5-pointers-arrays", "b6-deep-memory"]},
    {"id": "c", "title": "Linked lists", "lectures": "Lectures 1–4", "topics": ["linked-lists"],
     "blurb": "Nodes, top, createNode, traversal, insertion, deletion and the classic list operations.",
     "lessons": ["c1-building", "c2-traversal", "c3-insertion", "c4-deletion", "c5-more-ops", "c6-deep-lists"]},
    {"id": "d", "title": "Recursion", "lectures": "Lectures 2–4", "topics": ["recursion"],
     "blurb": "Base cases, recursive cases, recursion trees, and recursive list and array functions.",
     "lessons": ["d1-how-recursion-works", "d2-recursion-lists", "d3-recursion-arrays", "d4-deep-recursion"]},
    {"id": "e", "title": "Stacks and queues", "lectures": "COMP 1603 review", "topics": ["stacks-queues"],
     "blurb": "LIFO and FIFO, implemented with linked lists and arrays, and what they are used for.",
     "lessons": ["e1-stacks", "e2-queues", "e3-applications", "e4-deep-stacks-queues"]},
    {"id": "f", "title": "Binary trees", "lectures": "Lectures 5, 6, 10", "topics": ["binary-trees"],
     "blurb": "Tree terminology, BTNode, traversals, recursive tree functions, level order and tree types.",
     "lessons": ["f1-terminology", "f2-traversals", "f3-tree-code", "f4-level-order-types", "f5-deep-trees"]},
    {"id": "g", "title": "Binary search trees", "lectures": "Lectures 6–8, 10, 11", "topics": ["bst"],
     "blurb": "The BST property, insert, search, min and max, parent pointers, successor, deletion and performance.",
     "lessons": ["g1-bst-property", "g2-insert-search", "g3-parent-successor", "g4-deletion", "g5-performance", "g6-deep-bst"]},
    {"id": "h", "title": "Heaps and priority queues", "lectures": "Lectures 11–14", "topics": ["heaps"],
     "blurb": "Heaps stored in arrays, maxHeapify, buildMaxHeap, extract, insert, increase key, heap sort and priority queues.",
     "lessons": ["h1-heap-arrays", "h2-heapify-build", "h3-delete-heapsort", "h4-insert-priority", "h5-deep-heaps"]},
    {"id": "i", "title": "Hashing", "lectures": "Lectures 14–15", "topics": ["hashing"],
     "blurb": "Hash functions, collisions, linear and quadratic probing, double hashing, chaining and string keys.",
     "lessons": ["i1-hash-tables", "i2-probing", "i3-chaining-strings", "i4-deep-hashing"]},
    {"id": "j", "title": "Graphs", "lectures": "Lectures 15–17, 19", "topics": ["graphs"],
     "blurb": "Terminology, adjacency lists and matrices, the Graph structs, BFS, DFS, Dijkstra, Kruskal and Prim.",
     "lessons": ["j1-graph-basics", "j2-graph-code", "j3-bfs-dfs", "j4-dijkstra", "j5-mst", "j6-deep-graphs"]},
    {"id": "k", "title": "Sorting", "lectures": "Lectures 19–21", "topics": ["sorting"],
     "blurb": "Selection, bubble and insertion sort, merge sort, quick sort with partition, heap sort and their performance.",
     "lessons": ["k1-simple-sorts", "k2-merge-sort", "k3-quick-sort", "k4-sorting-performance", "k5-deep-sorting"]},
    {"id": "l", "title": "Exam toolkit", "lectures": "All lectures", "topics": [],
     "blurb": "Big-O for every structure in one place, and a method for writing correct code on paper under time pressure.",
     "lessons": ["l1-performance", "l2-exam-technique", "l3-deep-big-o"]},
    {"id": "n", "title": "Course outline topics", "lectures": "Course outline (not yet in the notes)", "topics": ["outline"],
     "blurb": "Topics the COMP 2611 course outline lists that the lecture notes have not reached yet: sequential and binary search, special matrices, Floyd's algorithm, graph isomorphism, integer sorting and trees in proofs.",
     "lessons": ["m3-binary-search", "n1-special-matrices", "n2-floyd", "n3-graph-isomorphism", "n4-integer-sorting", "n5-trees-proofs"]},
    {"id": "m", "title": "Beyond the notes", "lectures": "Supplementary", "topics": [], "supp": True,
     "blurb": "Topics that are in neither the lecture notes nor the course outline, but deepen what they teach: doubly linked and circular lists, circular array queues and AVL trees.",
     "lessons": ["m1-doubly-circular", "m2-circular-queue", "m4-avl-trees"]},
]
TOPICS = [
    {"id": "basics", "title": "C++ basics"}, {"id": "functions", "title": "Functions and references"}, {"id": "arrays", "title": "Arrays and strings"},
    {"id": "structs", "title": "Structs and files"}, {"id": "pointers", "title": "Pointers"}, {"id": "linked-lists", "title": "Linked lists"},
    {"id": "recursion", "title": "Recursion"}, {"id": "stacks-queues", "title": "Stacks and queues"}, {"id": "binary-trees", "title": "Binary trees"},
    {"id": "bst", "title": "Binary search trees"}, {"id": "heaps", "title": "Heaps"}, {"id": "hashing", "title": "Hashing"},
    {"id": "graphs", "title": "Graphs"}, {"id": "sorting", "title": "Sorting"}, {"id": "outline", "title": "Course outline extras"},
]
LABS = [
    {"id": "memory", "title": "Memory Visualizer", "lectures": "Lectures 1–17", "blurb": "Step through real C++ and watch the stack, the heap and every pointer.",
     "intro": "Pick a program on the left (or edit one) and step through it. Variables live on the stack; objects made with new live on the heap; every pointer is drawn as an arrow to what it points at."},
    {"id": "lists", "title": "Linked List Lab", "lectures": "Lectures 1–4", "blurb": "Insert, delete, reverse and merge, with your own values.",
     "intro": "Choose an operation, type your own list values, and watch each pointer change in the real course code."},
    {"id": "stackqueue", "title": "Stack and Queue Lab", "lectures": "COMP 1603 review", "blurb": "Type a sequence of push, pop, enqueue and dequeue operations.",
     "intro": "Write a sequence like push 10, push 20, pop and see exactly which node is added or removed, and why the order is LIFO or FIFO."},
    {"id": "recursion", "title": "Recursion Lab", "lectures": "Lectures 2–4", "blurb": "See the call stack grow and shrink, and the recursion tree.",
     "intro": "Each call gets its own frame on the stack. Open the Call tree tab to see the recursion tree from the lectures, with each call's return value."},
    {"id": "traversal", "title": "Tree Traversal Lab", "lectures": "Lectures 5, 6, 10", "blurb": "Preorder, inorder, postorder and level order, one visit at a time.",
     "intro": "Watch the recursive calls (or the queue, for level order) decide which node is printed next. Try predicting the full output before you start."},
    {"id": "bst", "title": "BST Lab", "lectures": "Lectures 6–8, 10", "blurb": "Insert, search, delete (Cases 1, 2, 3), successor and predecessor.",
     "intro": "Every operation is shown as a path of comparisons from the root. Deletion explains which case applies and highlights the code for that case."},
    {"id": "heap", "title": "Heap Lab", "lectures": "Lectures 11–14", "blurb": "Tree view and array view together: heapify, build, extract, insert, sort.",
     "intro": "The tree and the array are the same data. Watch both change together, and follow maxHeapify's comparisons and swaps line by line."},
    {"id": "hash", "title": "Hashing Lab", "lectures": "Lectures 14–15", "blurb": "Linear and quadratic probing, double hashing and chaining, with the lecture keys.",
     "intro": "Insert, search and delete keys in a table with locations 1 to N. Every collision shows the arithmetic for the next location."},
    {"id": "graph", "title": "Graph Lab", "lectures": "Lectures 15–17, 19", "blurb": "BFS, DFS, Dijkstra, Kruskal and Prim on the graphs from the slides.",
     "intro": "The same graphs and answers as the lecture slides. Watch the WHITE/GREY/BLACK colours, the queue, Dijkstra's cost table and the growing spanning trees."},
    {"id": "avl", "title": "AVL Tree Lab", "lectures": "Supplementary (not in the notes)", "blurb": "Insert keys and watch heights, balance factors and rotations keep a BST balanced.",
     "intro": "An AVL tree is a BST that rebalances itself. Insert keys and follow each comparison, each height update on the way back up, and the rotation that fixes the first unbalanced node. In Your turn mode, predict the direction and the rotation case first."},
    {"id": "matrix", "title": "Matrix Lab", "lectures": "Course outline topic 8", "blurb": "Triangular, symmetric, band and sparse matrices: click a cell and find it in the 1-D array.",
     "intro": "Pick a kind of matrix. Only the cells that can be non-zero are stored, packed into a 1-D array. Click any cell to see the index formula find it, or switch to Your turn and work out the index yourself."},
    {"id": "floyd", "title": "Floyd Lab", "lectures": "Course outline topic 7.3", "blurb": "All-pairs shortest paths: watch the distance matrix shrink one stopping point at a time.",
     "intro": "Floyd's algorithm runs on the adjacency matrix. On pass k, every pair (i, j) checks whether stopping at vertex k is cheaper: dist[i][k] + dist[k][j] < dist[i][j]. The first graph is the weighted graph from Lectures 16 and 17."},
    {"id": "isort", "title": "Integer Sort Lab", "lectures": "Course outline topic 1.3", "blurb": "Counting sort and radix sort: no comparisons, just counting.",
     "intro": "Counting sort counts each key, adds the counts up, then places the keys from right to left. Radix sort runs a stable counting sort on each digit, ones first."},
    {"id": "sort", "title": "Sorting Lab", "lectures": "Lectures 19–21", "blurb": "Six sorts on the lecture arrays, with counts of comparisons and swaps.",
     "intro": "Compare how each algorithm moves the values. Merge sort shows its split-and-merge picture from the slides; quick sort shows partition's p, i, j and r."},
]

QUEST_JS = ["quest_art.js", "quest_widgets.js", "quest.js"]   # the Quest engine, its widgets and its pixel art

# ---------------------------------------------------------------- helpers
def sha(s):
    return hashlib.sha1(s.encode()).hexdigest()[:12]

GPP_PRELUDE = r"""
#include <cstdlib>
#include <new>
static long __allocs_live = 0;
void* operator new(std::size_t n) { __allocs_live++; void* p = std::malloc(n ? n : 1); if (!p) throw std::bad_alloc(); return p; }
void* operator new[](std::size_t n) { __allocs_live++; void* p = std::malloc(n ? n : 1); if (!p) throw std::bad_alloc(); return p; }
void operator delete(void* p) noexcept { if (p) { __allocs_live--; std::free(p); } }
void operator delete[](void* p) noexcept { if (p) { __allocs_live--; std::free(p); } }
void operator delete(void* p, std::size_t) noexcept { if (p) { __allocs_live--; std::free(p); } }
void operator delete[](void* p, std::size_t) noexcept { if (p) { __allocs_live--; std::free(p); } }
int __liveNodes() { return (int)__allocs_live; }
"""

def gpp_run(code, stdin="", files=None, tag="prog"):
    """Compile with g++ and run. Returns (ok, stdout, error_text)."""
    if QUICK:
        return None
    h = sha(code + "\x00" + stdin + json.dumps(files or {}, sort_keys=True))
    d = os.path.join(BUILD, "gpp", h)
    cache = os.path.join(d, "result.json")
    if os.path.exists(cache):
        r = json.load(open(cache))
        return r["ok"], r["out"], r["err"]
    os.makedirs(d, exist_ok=True)
    src = os.path.join(d, "main.cpp")
    pre = GPP_PRELUDE if "__liveNodes" in code else ""
    open(src, "w").write(pre + code)
    for name, content in (files or {}).items():
        open(os.path.join(d, name), "w").write(content)
    exe = os.path.join(d, "a.out")
    c = subprocess.run(["g++", "-std=c++17", "-O0", "-w", "-o", exe, src], capture_output=True, text=True)
    if c.returncode != 0:
        res = (False, "", "COMPILE: " + c.stderr[:1500])
    else:
        try:
            r = subprocess.run([exe], input=stdin, capture_output=True, text=True, cwd=d, timeout=10)
            res = (r.returncode == 0, r.stdout, "" if r.returncode == 0 else "EXIT %d %s" % (r.returncode, r.stderr[:300]))
        except subprocess.TimeoutExpired:
            res = (False, "", "TIMEOUT")
    json.dump({"ok": res[0], "out": res[1], "err": res[2]}, open(cache, "w"))
    return res

def interp_batch(jobs):
    """Run many programs through the JS interpreter in one node process. jobs: list of dicts {code, stdin, files, trace}."""
    path = os.path.join(BUILD, "jobs.json")
    json.dump(jobs, open(path, "w"))
    runner = os.path.join(BUILD, "runjobs.js")
    open(runner, "w").write("""
const CPP = require(%s);
const jobs = require(%s);
const out = jobs.map((j) => {
  const r = CPP.run(j.code, { stdin: j.stdin || "", files: j.files || {}, trace: !!j.trace, maxSnaps: 3000 });
  return { out: r.out, err: r.err, compiled: r.compiled, snaps: r.snaps ? r.snaps.length : 0, warnings: r.warnings || [] };
});
process.stdout.write(JSON.stringify(out));
""" % (json.dumps(os.path.join(ROOT, "tests", "load.js")), json.dumps(path)))
    r = subprocess.run(["node", "--stack-size=4000", runner], capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr[:3000])
        raise SystemExit("interpreter batch failed")
    return json.loads(r.stdout)

def norm(s):
    return "\n".join(l.rstrip() for l in (s or "").replace("\r", "").split("\n")).rstrip("\n")

# ---------------------------------------------------------------- lessons
def parse_front(text):
    meta, body = {}, text
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if m:
        body = m.group(2)
        key = None
        for line in m.group(1).split("\n"):
            if re.match(r"^\s+-\s+", line) and key:
                meta.setdefault(key, []).append(line.strip()[2:].strip())
                continue
            mm = re.match(r"^(\w+):\s*(.*)$", line)
            if mm:
                key = mm.group(1)
                v = mm.group(2).strip()
                if v.startswith("[") and v.endswith("]"):
                    meta[key] = [x.strip() for x in v[1:-1].split(",") if x.strip()]
                elif v:
                    meta[key] = v
                else:
                    meta[key] = []
    return meta, body

FENCE_RE = re.compile(r"^```(\w*)([^\n]*)\n(.*?)^```\s*$", re.M | re.S)

def attrs_of(s):
    out = {}
    for m in re.finditer(r'(\w[\w-]*)(?:="([^"]*)")?', s):
        out[m.group(1)] = True if m.group(2) is None else m.group(2)
    return out

def files_of(attr):
    files = {}
    if not isinstance(attr, str):
        return files
    for spec in attr.split("||"):
        if "|" in spec:
            name, content = spec.split("|", 1)
            files[name] = content.replace("\\n", "\n")
    return files

def load_lessons():
    lessons = {}
    checks = []  # (where, code, stdin, expected or None)
    for part in PARTS:
        for lid in part["lessons"]:
            p = os.path.join(CONTENT, "lessons", lid + ".md")
            if not os.path.exists(p):
                err("missing lesson file " + lid)
                continue
            meta, body = parse_front(open(p).read())
            lessons[lid] = {"title": meta.get("title", lid), "summary": meta.get("summary", ""), "lectures": meta.get("lectures", ""),
                            "goals": meta.get("goals", []), "labs": meta.get("labs", []), "md": body}
            if meta.get("summary", "") == "This lesson is being written.":
                lessons[lid]["soon"] = True
            if str(meta.get("supp", "")).lower() == "true":
                lessons[lid]["supp"] = True
            if str(meta.get("outline", "")).lower() == "true":
                lessons[lid]["outline"] = True
            # collect runnable programs
            for m in FENCE_RE.finditer(body):
                lang, attr_s, code = m.group(1), m.group(2), m.group(3)
                a = attrs_of(attr_s)
                if lang in ("cpp", "") and re.search(r"\bint\s+main\s*\(", code) and not a.get("norun") and not a.get("error"):
                    stdin = a.get("stdin", "").replace("\\n", "\n") if isinstance(a.get("stdin"), str) else ""
                    checks.append(("lesson " + lid, code, stdin, None, a))
                if a.get("error") and re.search(r"\bint\s+main\s*\(", code):
                    checks.append(("lesson " + lid + " (expected error)", code, "", "ERROR", a))
            # explain-it-back blocks need a question and key points
            for tm in re.finditer(r"^:::teachback[^\n]*\n(.*?)^:::\s*$", body, re.M | re.S):
                tb = tm.group(1)
                if ">>" not in tb or not [l for l in tb.split("\n") if l.strip() and not l.startswith(">>")]:
                    err("an explain-it-back block in %s needs a question and >> key points" % lid)
            # code puzzles: every line of the answer must be real code from this lesson
            lesson_code = set()
            for fm2 in FENCE_RE.finditer(body):
                for ln in fm2.group(3).split("\n"):
                    t = re.sub(r"\s*//.*$", "", ln).strip()
                    if t:
                        lesson_code.add(re.sub(r"\s+", " ", t))
            for pm in re.finditer(r"^:::parsons[^\n]*\n(.*?)^:::\s*$", body, re.M | re.S):
                good = [l for l in pm.group(1).split("\n") if l.strip() and not l.startswith("~")]
                if len(good) < 3:
                    err("a code puzzle in %s needs at least 3 lines" % lid)
                for l in good:
                    if re.sub(r"\s+", " ", l.strip()) not in lesson_code:
                        err("a code puzzle in %s has a line that is not in the lesson's code: %s" % (lid, l.strip()))
            for pm in re.finditer(r"^:::predict[^\n]*\n(.*?)^:::\s*$", body, re.M | re.S):
                if not FENCE_RE.search(pm.group(1)) or not re.search(r"\bint\s+main\s*\(", pm.group(1)):
                    err("a predict block in %s needs a complete program in a ```cpp fence" % lid)
            # quizzes with checked code
            for qm in re.finditer(r"^:::quiz[^\n]*\n(.*?)^:::\s*$", body, re.M | re.S):
                q = qm.group(1)
                opts = [l[6:].strip() for l in q.split("\n") if l.startswith("- [x] ") or l.startswith("- [ ] ")]
                if sum(1 for l in q.split("\n") if l.startswith("- [x] ")) != 1:
                    err("a quiz in %s needs exactly one [x] option" % lid)
                if len(set(opts)) != len(opts):
                    err("a quiz in %s has two identical options" % lid)
                if ">>" not in q:
                    err("a quiz in %s has no explanation (>>)" % lid)
                fm = FENCE_RE.search(q)
                if fm and "check" in attrs_of(fm.group(2)):
                    right = [l for l in q.split("\n") if l.startswith("- [x] ")]
                    if len(right) != 1:
                        err("quiz in %s needs exactly one correct option" % lid)
                        continue
                    exp = right[0][6:].strip().strip("`").replace("⏎", "\n")
                    checks.append(("quiz in " + lid, fm.group(3), "", exp, attrs_of(fm.group(2))))
    return lessons, checks

# ---------------------------------------------------------------- exercises
HARNESS = {
    "list": r"""Node * __make (int a[], int n) {
    Node * top = NULL;
    Node * last = NULL;
    for (int i = 0; i < n; i++) {
        Node * p = new Node;
        p->data = a[i];
        p->next = NULL;
        if (top == NULL) top = p;
        else last->next = p;
        last = p;
    }
    return top;
}

void __show (Node * top) {
    if (top == NULL) { cout << "(empty)" << endl; return; }
    int guard = 0;
    while (top != NULL && guard < 100) {
        cout << top->data;
        if (top->next != NULL) cout << " -> ";
        top = top->next;
        guard++;
    }
    if (top != NULL) cout << " -> ... (the list never ends: is there a loop?)";
    cout << endl;
}""",
    "btree": r"""BTNode * __n (int v, BTNode * l, BTNode * r) {
    BTNode * p = new BTNode;
    p->data = v;
    p->left = l;
    p->right = r;
    return p;
}

void __pre (BTNode * root) {
    if (root == NULL) return;
    cout << root->data << " ";
    __pre (root->left);
    __pre (root->right);
}

void __in (BTNode * root) {
    if (root == NULL) return;
    __in (root->left);
    cout << root->data << " ";
    __in (root->right);
}""",
    "bst": r"""BTNode * __ins (BTNode * root, int key) {
    if (root == NULL) {
        BTNode * p = new BTNode;
        p->data = key;
        p->left = NULL;
        p->right = NULL;
        p->parent = NULL;
        return p;
    }
    if (key < root->data) { root->left = __ins (root->left, key); root->left->parent = root; }
    else if (key > root->data) { root->right = __ins (root->right, key); root->right->parent = root; }
    return root;
}

BTNode * __build (int a[], int n) {
    BTNode * root = NULL;
    for (int i = 0; i < n; i++) root = __ins (root, a[i]);
    return root;
}

BTNode * __find (BTNode * root, int key) {
    while (root != NULL && root->data != key)
        root = key < root->data ? root->left : root->right;
    return root;
}

void __pre (BTNode * root) {
    if (root == NULL) return;
    cout << root->data << " ";
    __pre (root->left);
    __pre (root->right);
}

void __in (BTNode * root) {
    if (root == NULL) return;
    __in (root->left);
    cout << root->data << " ";
    __in (root->right);
}

bool __parentsOK (BTNode * root, BTNode * parent) {
    if (root == NULL) return true;
    if (root->parent != parent) return false;
    return __parentsOK (root->left, root) && __parentsOK (root->right, root);
}""",
    "heap": r"""void __showHeap (MaxHeap * heap) {
    cout << "size " << heap->size << ":";
    for (int i = 1; i <= heap->size; i++) cout << " " << heap->A[i];
    cout << endl;
}

MaxHeap * __heap (int a[], int n) {
    MaxHeap * heap = new MaxHeap;
    for (int i = 0; i < n; i++) heap->A[i + 1] = a[i];
    heap->size = n;
    return heap;
}""",
    "array": r"""void __showArr (int A[], int n) {
    for (int i = 0; i < n; i++) {
        if (i > 0) cout << " ";
        cout << A[i];
    }
    cout << endl;
}""",
    "table": r"""void __showTable (int table[]) {
    for (int i = 1; i <= N; i++) {
        if (table[i] == 0) cout << "_";
        else cout << table[i];
        if (i < N) cout << " ";
    }
    cout << endl;
}""",
}

def parse_exercises():
    exs = []
    files = sorted(f for f in os.listdir(os.path.join(CONTENT, "exercises")) if f.endswith(".txt"))
    for fn in files:
        text = open(os.path.join(CONTENT, "exercises", fn)).read()
        for chunk in re.split(r"^=== ", text, flags=re.M)[1:]:
            lines = chunk.split("\n")
            ex = {"id": lines[0].strip(), "tests": [], "hints": [], "harnessNames": []}
            i = 1
            while i < len(lines) and not lines[i].startswith("--- "):
                m = re.match(r"^(\w+):\s*(.*)$", lines[i])
                if m:
                    ex[m.group(1)] = m.group(2).strip()
                i += 1
            sec, buf = None, []
            def flush():
                if sec is None:
                    return
                body = "\n".join(buf).strip("\n")
                if sec.startswith("random:"):
                    ex.setdefault("random", []).append({"name": sec[7:].strip(), "tpl": body.rstrip()})
                elif sec.startswith("test (hidden):") or sec.startswith("test:"):
                    hidden = sec.startswith("test (hidden):")
                    name = sec[len("test (hidden):"):].strip() if hidden else sec[5:].strip()
                    stdin = ""
                    mm = re.match(r"^(.*?)\s*\[stdin=(.*)\]$", name)
                    if mm:
                        name, stdin = mm.group(1), mm.group(2).replace("\\n", "\n")
                    ex["tests"].append({"name": name, "main": body.rstrip(), "stdin": stdin})
                    if hidden:
                        ex["tests"][-1]["hidden"] = True
                elif sec == "hint":
                    ex["hints"].append(body)
                elif sec.startswith("harness"):
                    names = sec[len("harness"):].strip(": ").split()
                    ex["harnessNames"] += names
                    if body.strip():
                        ex.setdefault("harnessExtra", "")
                        ex["harnessExtra"] += body + "\n\n"
                else:
                    ex[sec] = body
            while i < len(lines):
                l = lines[i]
                if l.startswith("--- "):
                    flush()
                    sec, buf = l[4:].strip(), []
                else:
                    buf.append(l)
                i += 1
            flush()
            ex["level"] = int(ex.get("level", "2"))
            ex["lessons"] = [x.strip() for x in ex.get("lessons", "").split(",") if x.strip()]
            harness = "\n\n".join(HARNESS[n] for n in ex["harnessNames"])
            if ex.get("harnessExtra"):
                harness = (harness + "\n\n" if harness else "") + ex["harnessExtra"].strip()
            ex["harness"] = harness
            given = ex.get("given", "").rstrip()
            ex["code"] = (given + "\n\n" if given else "") + ex.get("starter", "").rstrip() + "\n"
            ex["solutionPart"] = ex.get("solution", "").rstrip()
            ex["solution"] = (given + "\n\n" if given else "") + ex.get("solution", "").rstrip() + "\n"
            for k in ("title", "topic", "prompt"):
                if not ex.get(k):
                    err("exercise %s is missing %s" % (ex["id"], k))
            if not ex["tests"]:
                err("exercise %s has no tests" % ex["id"])
            exs.append(ex)
    return exs

def assemble(ex, code, test):
    body = "\n".join("    " + l for l in test["main"].rstrip().split("\n"))
    return code.rstrip() + "\n\n" + (ex["harness"].rstrip() + "\n\n" if ex["harness"] else "") + "int main() {\n" + body + "\n    return 0;\n}\n"

# ---------------------------------------------------------------- main
def lesson_headings(lessons, lid):
    return [re.sub(r"`", "", m.group(1)).strip() for m in re.finditer(r"^##+ (.+)$", lessons[lid]["md"], re.M)]

def check_ref(lessons, lid, section, where):
    if lid not in lessons:
        err("%s: unknown lesson %s" % (where, lid))
    elif section and section not in lesson_headings(lessons, lid):
        err("%s: lesson %s has no section '%s'" % (where, lid, section))

def load_lectures(lessons):
    lec = json.load(open(os.path.join(CONTENT, "lectures.json")))
    lab_ids = {l["id"] for l in LABS}
    for L in lec:
        for ref in L["lessons"]:
            check_ref(lessons, ref[0], ref[1] if len(ref) > 1 else None, "Lecture " + L["n"])
        for lab in L.get("labs", []):
            if lab not in lab_ids:
                err("Lecture %s: unknown lab %s" % (L["n"], lab))
    return lec

def load_glossary(lessons):
    g = json.load(open(os.path.join(CONTENT, "glossary.json")))
    seen = set()
    for t in g:
        if t["term"].lower() in seen:
            err("glossary: duplicate term " + t["term"])
        seen.add(t["term"].lower())
        check_ref(lessons, t["lesson"], t.get("section"), "glossary '%s'" % t["term"])
    return sorted(g, key=lambda t: t["term"].lower().lstrip("(").replace("o(", "o("))

def load_mock():
    """The hand-written mock exam papers (A to D, plus extra questions): checked here so a broken entry fails the build."""
    qs = json.load(open(os.path.join(CONTENT, "mockbank.json")))
    ids = set()
    for q in qs:
        if q["id"] in ids:
            err("mock bank: duplicate id " + q["id"])
        ids.add(q["id"])
        if q["topic"] not in ("LL", "BT", "BST", "HEAP", "PERF"):
            err("mock bank %s: unknown topic %s" % (q["id"], q["topic"]))
        if len(q["opts"]) < 2 or not (0 <= q["ans"] < len(q["opts"])):
            err("mock bank %s: bad options or answer" % q["id"])
        if q["marks"] not in (1, 2):
            err("mock bank %s: marks must be 1 or 2" % q["id"])
        for k in ("fig", "efig"):
            f = q.get(k)
            if f and f["t"] not in ("tree", "trees", "heap", "list", "lists"):
                err("mock bank %s: unknown figure %s" % (q["id"], f["t"]))
    for ex in "ABCD":
        paper = [q for q in qs if q["exam"] == ex]
        if len(paper) != 28 or sum(q["marks"] for q in paper) != 42:
            err("mock paper %s should have 28 questions and 42 marks (has %d, %d)" % (ex, len(paper), sum(q["marks"] for q in paper)))
    return qs

WRITTEN_TOPICS = ("cpp", "lists", "recursion", "stacks", "trees", "bst", "heaps", "hashing", "graphs", "sorting", "bigo")
WRITTEN_TYPES = ("code", "trace", "explain", "complexity", "proof", "design")
def load_written(lessons):
    """Written-answer practice: original questions with marking schemes. Code answers are compiled with g++ and run by the interpreter."""
    path = os.path.join(CONTENT, "written.md")
    if not os.path.exists(path):
        return []
    text = "\n".join(l for l in open(path).read().split("\n") if not l.startswith("# "))
    out, jobs = [], []
    for block in re.split(r"^=== ", text, flags=re.M)[1:]:
        head, _, rest = block.partition("\n--- ")
        lines = head.split("\n")
        q = {"id": lines[0].strip()}
        for l in lines[1:]:
            if ":" in l:
                k, v = l.split(":", 1)
                q[k.strip()] = v.strip()
        secs = {}
        for part in re.split(r"^--- ", "--- " + rest, flags=re.M)[1:]:
            name, _, body = part.partition("\n")
            secs[name.strip()] = body.rstrip("\n")
        qid = q["id"]
        for k in ("question", "rubric", "answer"):
            if k not in secs:
                err("written %s: missing --- %s" % (qid, k))
        rubric = []
        for l in secs.get("rubric", "").split("\n"):
            if not l.strip():
                continue
            m = re.match(r"^(\d+)\s*\|\s*(.+)$", l)
            if not m:
                err("written %s: bad rubric line %r" % (qid, l))
                continue
            rubric.append({"pts": int(m.group(1)), "text": m.group(2).strip()})
        marks = int(q.get("marks", "0"))
        if sum(r["pts"] for r in rubric) != marks:
            err("written %s: rubric adds up to %d, but marks is %d" % (qid, sum(r["pts"] for r in rubric), marks))
        if q.get("topic") not in WRITTEN_TOPICS:
            err("written %s: unknown topic %s" % (qid, q.get("topic")))
        if q.get("type") not in WRITTEN_TYPES:
            err("written %s: unknown type %s" % (qid, q.get("type")))
        les = [x.strip() for x in q.get("lessons", "").split(",") if x.strip()]
        for lid in les:
            if lid not in lessons:
                err("written %s: unknown lesson %s" % (qid, lid))
        if "check" in secs:
            m = re.search(r"```cpp\n(.*?)```", secs["answer"], re.S)
            if not m:
                err("written %s: a check needs a ```cpp block in the answer" % qid)
            else:
                prog = secs.get("given", "") + "\n\n" + m.group(1) + "\n" + secs["check"] + "\n"
                want = secs.get("expect", "")
                g = gpp_run(prog, tag=qid)
                if g is not None and (not g[0] or norm(g[1]) != norm(want)):
                    err("written %s: g++ gives %r (%s), expected %r" % (qid, g[1], g[2], want))
                jobs.append((qid, prog, want))
        out.append({"id": qid, "topic": q["topic"], "type": q["type"], "marks": marks, "minutes": int(q.get("minutes", "5")), "lessons": les,
                    "q": secs.get("question", ""), "rubric": rubric, "answer": secs.get("answer", ""), "given": secs.get("given", ""),
                    "mistakes": [l[2:].strip() for l in secs.get("mistakes", "").split("\n") if l.startswith("- ")], "format": secs.get("format", ""),
                    "check": secs.get("check", ""), "expect": secs.get("expect", "")})
    if jobs:
        res = interp_batch([{"code": j[1]} for j in jobs])
        for (qid, prog, want), r in zip(jobs, res):
            if r["err"] or norm(r["out"]) != norm(want):
                err("written %s: the interpreter gives %r %s, expected %r" % (qid, r["out"], r["err"], want))
    return out

# ---- random test templates: $VALS(n,lo,hi) $KEYS(n,lo,hi) $SORTED(n,lo,hi) $INT(lo,hi) $N() $PICK(); n may be a range a-b.
# The browser expands them with the same rules (app.js expandRandom); keep the two in step.
def hash_seed(s):
    return int(hashlib.md5(s.encode()).hexdigest()[:8], 16)
def expand_random(tpl, rnd):
    state = {"n": 0, "vals": []}
    def count(spec):
        if "-" in spec.strip()[1:]:
            a, b = spec.strip().split("-", 1)
            return rnd.randint(int(a), int(b))
        return int(spec)
    def sub(m):
        kind, args = m.group(1), [x.strip() for x in m.group(2).split(",") if x.strip()]
        if kind in ("VALS", "KEYS", "SORTED"):
            n, lo, hi = count(args[0]), int(args[1]), int(args[2])
            if kind == "VALS":
                vals = [rnd.randint(lo, hi) for _ in range(n)]
            else:
                pool = list(range(lo, hi + 1))
                rnd.shuffle(pool)
                vals = pool[:n]
                if kind == "SORTED":
                    vals.sort()
            state["n"], state["vals"] = n, vals
            return ", ".join(str(v) for v in vals)
        if kind == "INT":
            return str(rnd.randint(int(args[0]), int(args[1])))
        if kind == "N":
            return str(state["n"])
        if kind == "PICK":
            return str(rnd.choice(state["vals"])) if state["vals"] else "0"
        raise ValueError("unknown placeholder " + kind)
    return re.sub(r"\$(VALS|KEYS|SORTED|INT|N|PICK)\(([^)]*)\)", sub, tpl)

def load_cpp_support():
    """The C++ feature matrix (tests/features.js --json), checked against g++. Re-run it when the interpreter changes."""
    path = os.path.join(CONTENT, "cpp_support.json")
    if not os.path.exists(path):
        err("content/cpp_support.json is missing: run  node tests/features.js --json content/cpp_support.json")
        return None
    j = json.load(open(path))
    bad = [c["id"] for c in j["cases"] if not c["ok"]]
    if bad:
        err("C++ feature matrix has cases that do not behave as documented: " + ", ".join(bad))
    keep = ("id", "group", "title", "expect", "src", "out", "msg", "kind", "ok")
    return {"generated": j["generated"], "compiler": j["compiler"], "cases": [{k: c.get(k) for k in keep} for c in j["cases"]]}

# ---------------------------------------------------------------- the Quest (content/quest/*.md)
QUEST_WHO = {"you", "marco", "pip", "prof", "silas", "narrator"}
QUEST_TASKS = {"quiz", "type", "predict", "order", "fill", "match", "tree", "graph", "array", "heap", "sort", "listsim", "code"}
QUEST_KINDS = {"say", "scene", "learn", "relic", "journal", "boss", "lab", "memory"} | QUEST_TASKS
BEAT_RE = re.compile(r"^@([a-z]+)\b[ \t]*(.*)$")

def q_attrs(s):
    attrs = {}
    def take(m):
        attrs[m.group(1)] = m.group(2) if m.group(2) is not None else m.group(3)
        return ""
    rest = re.sub(r"(\w+)=(?:\"([^\"]*)\"|'([^']*)')", take, s)
    return attrs, rest.strip()

def q_split_fence(body):
    """-> (text lines outside fences, [code blocks])"""
    out, codes, buf, inside = [], [], [], False
    for l in body:
        if re.match(r"^```", l):
            if inside:
                codes.append("\n".join(buf)); buf = []; inside = False
            else:
                inside = True
            continue
        (buf if inside else out).append(l)
    if inside:
        codes.append("\n".join(buf))
    return out, codes

def q_beat(kind, head, body, where):
    attrs, rest = q_attrs(head)
    b = {"t": kind}
    b.update({k: v for k, v in attrs.items() if k not in ("t",)})
    text, codes = q_split_fence(body)
    for l in text:
        if re.match(r"^\s*\w+=(\"[^\"]*\"|'[^']*')\s*$", l):
            err("%s: the attribute line %r must be on the @%s line itself" % (where, l.strip(), kind))
    expl = " ".join(l[2:].strip() for l in text if l.startswith(">>"))
    plain = [l for l in text if not l.startswith(">>")]
    if expl:
        b["expl"] = expl
    if kind == "say":
        m = re.match(r"^(\w+):\s*(.*)$", rest)
        if not m or m.group(1) not in QUEST_WHO:
            err("%s: @say needs a speaker (%s), like  @say marco: Hello" % (where, ", ".join(sorted(QUEST_WHO))))
            return None
        b["who"] = m.group(1)
        b["text"] = " ".join([m.group(2)] + [l.strip() for l in plain if l.strip()]).strip()
    elif kind == "scene":
        b["text"] = " ".join([rest] + [l.strip() for l in plain if l.strip()]).strip()
    elif kind == "learn":
        b["title"] = rest
        b["md"] = "\n".join(body).strip()
    elif kind == "quiz":
        q, opts = [], []
        for l in plain:
            mo = re.match(r"^- \[( |x)\]\s+(.*)$", l)
            if mo:
                opts.append({"text": mo.group(2).strip(), "right": mo.group(1) == "x"})
            elif re.match(r"^\s+\?\s", l) and opts:
                opts[-1]["why"] = l.strip()[2:].strip()
            elif l.strip() and not opts:
                q.append(l.strip())
        b["q"] = " ".join(([rest] if rest else []) + q)
        b["opts"] = opts
        if codes:
            b["code"] = codes[0]
        if sum(1 for o in opts if o["right"]) != 1 or len(opts) < 2:
            err("%s: a quiz needs 2 or more options and exactly one [x]" % where)
        if len(set(o["text"] for o in opts)) != len(opts):
            err("%s: a quiz has two identical options" % where)
    elif kind == "type":
        q = [l.strip() for l in plain if l.strip() and not l.startswith("= ")]
        ans = []
        for l in plain:
            if l.startswith("= "):
                ans += [a.strip() for a in l[2:].split(" | ") if a.strip()]
        b["q"] = " ".join(([rest] if rest else []) + q)
        b["answers"] = ans
        if codes:
            b["code"] = codes[0]
        if not ans:
            err("%s: @type needs at least one  = answer  line" % where)
    elif kind in ("predict", "memory"):
        b["q"] = " ".join(([rest] if rest else []) + [l.strip() for l in plain if l.strip()])
        if not codes:
            err("%s: @%s needs a ```cpp program" % (where, kind))
            return None
        b["code"] = codes[0]
    elif kind == "order":
        b["q"] = rest
        b["lines"] = [l.rstrip() for l in plain if l.strip() and not l.startswith("~")]
        b["distract"] = [l[1:].strip() for l in plain if l.startswith("~")]
        if len(b["lines"]) < 2:
            err("%s: @order needs at least 2 lines" % where)
    elif kind == "fill":
        b["q"] = " ".join(([rest] if rest else []) + [l.strip() for l in plain if l.strip()])
        if not codes or "[[" not in codes[0]:
            err("%s: @fill needs a ```cpp block with [[answer]] blanks" % where)
            return None
        b["code"] = codes[0]
    elif kind == "match":
        b["q"] = rest
        b["pairs"] = [[x.strip() for x in l.split(" = ", 1)] for l in plain if " = " in l]
        if len(b["pairs"]) < 2:
            err("%s: @match needs at least 2  term = meaning  lines" % where)
    elif kind == "listsim":
        b["q"] = " ".join(([rest] if rest else []) + [l.strip() for l in plain if l.strip() and not l.strip().endswith(";")])
        good = [l.strip() for l in plain if l.strip().endswith(";") and not l.startswith("~")]
        bad = [l[1:].strip() for l in plain if l.startswith("~") and l.strip().endswith(";")]
        b["solution"] = good
        b["palette"] = good + bad
        for k in ("list", "goal"):
            if k not in attrs:
                err("%s: @listsim needs %s=\"...\"" % (where, k))
    elif kind == "relic":
        parts = [x.strip() for x in rest.split("|", 2)]
        if len(parts) < 3:
            err("%s: @relic needs  id | title | text" % where)
            return None
        b["id"], b["title"] = parts[0], parts[1]
        b["text"] = " ".join([parts[2]] + [l.strip() for l in plain if l.strip()])
    elif kind == "journal":
        b["items"] = [l.strip()[2:].strip() for l in plain if l.strip().startswith("- ")]
    elif kind == "boss":
        b["text"] = " ".join(([rest] if rest else []) + [l.strip() for l in plain if l.strip()])
    else:
        b["q"] = " ".join(([rest] if rest else []) + [l.strip() for l in plain if l.strip()])
        if codes:
            b["code"] = codes[0]
    return b

def load_quest(lessons, ex_ids):
    qdir = os.path.join(CONTENT, "quest")
    worlds, jobs, relic_ids, level_ids = [], [], set(), set()
    if not os.path.isdir(qdir):
        return {"worlds": []}, jobs
    lab_ids = {l["id"] for l in LABS}
    for fn in sorted(f for f in os.listdir(qdir) if f.endswith(".md")):
        text = open(os.path.join(qdir, fn)).read()
        for wchunk in re.split(r"^# world:\s*", text, flags=re.M)[1:]:
            wlines = wchunk.split("\n")
            w = {"id": wlines[0].strip(), "levels": []}
            i = 1
            while i < len(wlines) and not wlines[i].startswith("## "):
                m = re.match(r"^(\w+):\s*(.*)$", wlines[i])
                if m:
                    w[m.group(1)] = m.group(2).strip()
                i += 1
            for lchunk in re.split(r"^## ", "\n".join(wlines[i:]), flags=re.M)[1:]:
                llines = lchunk.split("\n")
                hm = re.match(r"^(\S+)\s*\|\s*(.+)$", llines[0].strip())
                if not hm:
                    err("quest %s: a level heading must be  ## id | Title  (got %r)" % (fn, llines[0]))
                    continue
                lv = {"id": hm.group(1), "title": hm.group(2).strip(), "beats": []}
                if lv["id"] in level_ids:
                    err("quest: duplicate level id " + lv["id"])
                level_ids.add(lv["id"])
                j = 1
                while j < len(llines) and not BEAT_RE.match(llines[j]):
                    m = re.match(r"^(\w+):\s*(.*)$", llines[j])
                    if m:
                        lv[m.group(1)] = m.group(2).strip()
                    j += 1
                lv["lessons"] = [x.strip() for x in lv.get("lessons", "").split(",") if x.strip()]
                for lid in lv["lessons"]:
                    if lid not in lessons:
                        err("quest level %s: unknown lesson %s" % (lv["id"], lid))
                cur, body, inside = None, [], False
                def flush():
                    if cur is None:
                        return
                    where = "quest level %s, @%s" % (lv["id"], cur[0])
                    if cur[0] not in QUEST_KINDS:
                        err("%s: unknown beat type" % where)
                        return
                    b = q_beat(cur[0], cur[1], body, where)
                    if b is not None:
                        lv["beats"].append(b)
                for l in llines[j:]:
                    if re.match(r"^```", l):
                        inside = not inside
                    m = None if inside else BEAT_RE.match(l)
                    if m:
                        flush()
                        cur, body = (m.group(1), m.group(2)), []
                    else:
                        body.append(l)
                flush()
                # checks
                for b in lv["beats"]:
                    where = "quest level %s, @%s" % (lv["id"], b["t"])
                    if b["t"] == "predict":
                        jobs.append((where, b, b["code"]))
                    if b["t"] == "fill" and re.search(r"\bint\s+main\s*\(", b["code"]):
                        sol = re.sub(r"\[\[(.+?)\]\](?!\])", lambda m: m.group(1).split("|")[0].strip(), b["code"])
                        jobs.append((where + " (solution)", None, sol))
                    if b["t"] == "code" and b.get("ex") not in ex_ids:
                        err("%s: unknown exercise %s" % (where, b.get("ex")))
                    if b["t"] == "lab":
                        if b.get("id") not in lab_ids:
                            err("%s: unknown lab %s" % (where, b.get("id")))
                        if b.get("preset"):
                            try:
                                json.loads(b["preset"])
                            except Exception as e:
                                err("%s: preset is not valid JSON (%s)" % (where, e))
                    if b["t"] == "relic":
                        if b["id"] in relic_ids:
                            err("quest: duplicate relic id " + b["id"])
                        relic_ids.add(b["id"])
                    if b["t"] == "tree" and b.get("kind", "pre") not in ("pre", "in", "post", "level", "leaves", "internal", "onechild", "path", "insert", "succ", "pred"):
                        err("%s: unknown tree kind %s" % (where, b.get("kind")))
                    if b["t"] == "graph" and b.get("kind", "bfs") not in ("bfs", "dfs", "dijkstra", "prim", "kruskal"):
                        err("%s: unknown graph kind %s" % (where, b.get("kind")))
                    if b["t"] == "array" and b.get("kind", "hash") not in ("hash", "binsearch", "index"):
                        err("%s: unknown array kind %s" % (where, b.get("kind")))
                    if b["t"] == "heap" and b.get("kind", "heapify") not in ("heapify", "insert", "extract"):
                        err("%s: unknown heap kind %s" % (where, b.get("kind")))
                    if b["t"] == "sort" and b.get("alg", "bubble") not in ("bubble", "selection", "insertion", "partition", "merge"):
                        err("%s: unknown sort %s" % (where, b.get("alg")))
                lv["notes"] = [x for b in lv["beats"] if b["t"] == "journal" for x in b["items"]]
                lv["relics"] = [{"id": b["id"], "title": b["title"], "text": b["text"]} for b in lv["beats"] if b["t"] == "relic"]
                if not any(b["t"] in QUEST_TASKS for b in lv["beats"]):
                    err("quest level %s has no challenge" % lv["id"])
                w["levels"].append(lv)
            worlds.append(w)
    return {"worlds": worlds}, jobs


def main():
    lessons, checks = load_lessons()
    exs = parse_exercises()
    ids = set()
    for e in exs:
        if e["id"] in ids:
            err("duplicate exercise id " + e["id"])
        ids.add(e["id"])
        for l in e["lessons"]:
            if l not in lessons:
                err("exercise %s refers to unknown lesson %s" % (e["id"], l))
        if e.get("topic") not in [t["id"] for t in TOPICS]:
            err("exercise %s has unknown topic %s" % (e["id"], e.get("topic")))
    for lid, l in lessons.items():
        for lab in l["labs"]:
            if lab not in [x["id"] for x in LABS]:
                err("lesson %s refers to unknown lab %s" % (lid, lab))
        for m in re.finditer(r"\]\(#([\w-]+)\)", l["md"]):
            tok = m.group(1)
            ok = tok in ("home", "learn", "lab", "gym", "play", "ref") or (tok.startswith("l-") and tok[2:] in lessons) or (tok.startswith("lab-") and tok[4:] in [x["id"] for x in LABS]) or (tok.startswith("ex-") and tok[3:] in ids)
            if not ok:
                err("lesson %s links to unknown #%s" % (lid, tok))

    # ---- interpreter + g++ validation
    jobs, meta = [], []
    for where, code, stdin, expected, a in checks:
        jobs.append({"code": code, "stdin": stdin, "files": files_of(a.get("file")), "trace": bool(a.get("memory"))})
        meta.append(("lesson", where, code, stdin, expected, a))
    for e in exs:
        for t in e["tests"]:
            jobs.append({"code": assemble(e, e["solution"], t), "stdin": t.get("stdin", "")})
            meta.append(("exsol", e, t))
        # random tests: three fixed expansions of each template, checked against g++ like the fixed tests
        for rt in e.get("random", []):
            for seed in (1, 2, 3):
                body = expand_random(rt["tpl"], random.Random(hash_seed(e["id"] + rt["name"]) + seed))
                jobs.append({"code": assemble(e, e["solution"], {"main": body}), "stdin": ""})
                meta.append(("exrand", e, rt, body))
        for t in e["tests"]:
            jobs.append({"code": assemble(e, e["code"], t), "stdin": t.get("stdin", "")})
            meta.append(("exstart", e, t))
    quest, qjobs = load_quest(lessons, ids)
    for where, b, code in qjobs:
        jobs.append({"code": code, "stdin": ""})
        meta.append(("quest", where, b, code))
    if not QUICK:
        fr = subprocess.run(["node", "--stack-size=4000", os.path.join(ROOT, "tests", "features.js"), "--json", os.path.join(CONTENT, "cpp_support.json")], capture_output=True, text=True)
        print("C++ feature matrix: " + (fr.stdout.strip().split("\n")[-1] if fr.stdout.strip() else "no output"))
        if fr.returncode != 0:
            err("C++ feature matrix failed:\n" + fr.stdout[-2500:] + fr.stderr[-500:])
    print("running %d programs through the interpreter..." % len(jobs))
    res = interp_batch(jobs)
    starter_pass = {}
    for job, m, r in zip(jobs, meta, res):
        if m[0] == "lesson":
            _, where, code, stdin, expected, a = m
            if expected == "ERROR":
                if not r["err"]:
                    err("%s: expected an error but the program ran" % where)
                continue
            if r["err"] and not a.get("crash"):
                err("%s: interpreter error %s on line %s\n%s" % (where, r["err"]["msg"], r["err"]["line"], code[:400]))
                continue
            g = gpp_run(code, stdin, files_of(a.get("file")))
            if g is not None:
                ok, gout, gerr = g
                if (not ok and not a.get("crash")) or norm(gout) != norm(r["out"]):
                    err("%s: g++ and interpreter differ\n  g++: %r %s\n  int: %r\n%s" % (where, gout[:300], gerr[:300], r["out"][:300], code[:300]))
                if expected is not None and norm(gout).replace("\n", " ").strip() != norm(expected).replace("\n", " ").strip():
                    err("%s: quiz answer %r but the program prints %r" % (where, expected, gout))
        elif m[0] == "quest":
            _, where, b, code = m
            if r["err"] or not r.get("compiled", True):
                err("%s: the program fails in the interpreter: %s" % (where, r["err"]))
                continue
            g = gpp_run(code)
            if g is not None:
                ok, gout, gerr = g
                if not ok or norm(gout) != norm(r["out"]):
                    err("%s: g++ and the interpreter differ (%s)\n  g++: %r\n  int: %r" % (where, gerr[:300], gout[:200], r["out"][:200]))
            if b is not None:
                b["expect"] = norm(r["out"])
        elif m[0] == "exrand":
            _, e, rt, body = m
            if r["err"] or not r.get("compiled", True):
                err("exercise %s / random test %r: the solution fails in the interpreter: %s\n%s" % (e["id"], rt["name"], r["err"], body))
                continue
            g = gpp_run(job["code"])
            if g is None:
                continue
            ok, gout, gerr = g
            if not ok or norm(gout) != norm(r["out"]):
                err("exercise %s / random test %r: g++ and the interpreter differ (%s)\n  g++: %r\n  int: %r\n%s" % (e["id"], rt["name"], gerr[:300], gout[:200], r["out"][:200], body))
        elif m[0] == "exsol":
            _, e, t = m
            if r["err"]:
                err("exercise %s / %s: solution fails in the interpreter: %s (line %s)" % (e["id"], t["name"], r["err"]["msg"], r["err"]["line"]))
                continue
            g = gpp_run(job["code"], t.get("stdin", ""))
            if g is None:
                t["expect"] = r["out"]
                continue
            ok, gout, gerr = g
            if not ok:
                err("exercise %s / %s: solution fails under g++: %s" % (e["id"], t["name"], gerr[:600]))
            if norm(gout) != norm(r["out"]):
                err("exercise %s / %s: g++ and interpreter differ\n  g++: %r\n  int: %r" % (e["id"], t["name"], gout[:300], r["out"][:300]))
            t["expect"] = norm(gout)
        elif m[0] == "exstart":
            _, e, t = m
            if r["err"] and r["err"]["kind"] == "compile":
                err("exercise %s: starter code does not compile: %s (line %s)" % (e["id"], r["err"]["msg"], r["err"]["line"]))
            passed = (not r["err"]) and norm(r["out"]) == norm(t.get("expect", "\x00"))
            starter_pass.setdefault(e["id"], []).append(passed)
    for eid, lst in starter_pass.items():
        if lst and all(lst):
            err("exercise %s: the starter code already passes every test" % eid)

    # ---- data
    examples = []
    for lid in [l for p in PARTS for l in p["lessons"]]:
        if lid not in lessons:
            continue
        n = 0
        for m in FENCE_RE.finditer(lessons[lid]["md"]):
            code = m.group(3)
            a = attrs_of(m.group(2))
            if re.search(r"\bint\s+main\s*\(", code) and a.get("example"):
                examples.append({"title": a["example"] if isinstance(a["example"], str) else lessons[lid]["title"], "code": code, "stdin": (a.get("stdin") or "").replace("\\n", "\n") if isinstance(a.get("stdin"), str) else ""})
                n += 1
    hero = open(os.path.join(CONTENT, "hero.cpp")).read()
    play = open(os.path.join(CONTENT, "playground.cpp")).read()
    data = {
        "parts": PARTS, "topics": TOPICS, "labs": LABS, "lessons": lessons,
        "exercises": [{k: e[k] for k in ("id", "title", "topic", "level", "lecture", "blurb", "prompt", "code", "solution", "solutionPart", "harness", "tests", "hints", "explain", "lessons", "random") if k in e} for e in exs],
        "ref": open(os.path.join(CONTENT, "reference.md")).read(),
        "examples": examples, "heroCode": hero, "playStart": play,
        "mock": load_mock(),
        "lectures": load_lectures(lessons), "glossary": load_glossary(lessons),
        "cppSupport": load_cpp_support(), "cppStats": {"programs": len(jobs), "gpp": not QUICK},
        "written": load_written(lessons),
        "quest": quest,
    }
    for e in data["exercises"]:
        for t in e["tests"]:
            t.setdefault("expect", "")
            if not t.get("stdin"):
                t.pop("stdin", None)

    # ---- bundle
    css_files = ["style.css", "game.css", "ide.css", "quest.css", "home.css", "theme.css"]
    css = "\n".join(open(os.path.join(SRC, f)).read() for f in css_files if os.path.exists(os.path.join(SRC, f)))
    # the interpreter has its own <script id="cpp-core">: the runner builds its Web Worker from that element's text
    core_files = ["cpp_lex.js", "cpp_parse.js", "cpp_check.js", "cpp_run.js"]
    core = "\n".join(open(os.path.join(SRC, f)).read() for f in core_files)
    js_files = ["editor.js", "editor_tools.js", "settings.js", "md.js", "tutor.js", "runner.js", "project.js", "terminal.js", "workspace.js", "ide.js", "memviz.js", "visualizer.js", "debugger.js",
                "lab_core.js", "lab_tree.js", "lab_avl.js", "lab_heap.js", "lab_hash.js", "lab_graph.js", "lab_sort.js", "lab_extra.js", "lab_race.js", "lab_mem.js", "trainer.js", "trainer2.js", "progress.js", "fx.js", "game.js", "arcade.js", "arcade_games.js", "boss.js", "learn.js", "pages_learn.js", "pages_ref.js", "pages_exam.js"]
    js_files += [f for f in QUEST_JS if os.path.exists(os.path.join(SRC, f))]
    js = "\n".join(open(os.path.join(SRC, f)).read() for f in js_files)
    for f in core_files + js_files:
        if "</script" in open(os.path.join(SRC, f)).read().lower():
            err("%s contains </script, which would end the page's script early" % f)
    app = open(os.path.join(SRC, "app.js")).read()
    data_js = "window.CODELAB_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";"
    head = ('<title>COMP 2611 Code Lab</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
            '<meta name="description" content="Learn COMP 2611 data structures in C++: lessons, a memory visualizer, algorithm labs, an arcade of exam-skill games, XP and achievements, and auto-tested coding exercises.">\n'
            '<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500;600;700&family=Martian+Mono:wght@500;600&family=Pixelify+Sans:wght@400;500;600;700&family=Press+Start+2P&family=Space+Grotesk:wght@500;600;700&display=swap">\n')
    body = ("<style>\n" + css + "\n</style>\n"
            '<div id="app"></div>\n'
            '<script id="cpp-core">\n' + core + "\n</script>\n"
            "<script>\n" + js + "\n</script>\n"
            "<script>\n" + data_js + "\n</script>\n"
            "<script>\n" + app + "\n</script>\n")
    page = head + body
    open(os.path.join(DIST, "index.html"), "w").write(page)
    standalone = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
                  + head + "<style>[hidden]{display:none!important}</style>\n</head>\n<body>\n" + body + "</body>\n</html>\n")
    open(os.path.join(DIST, "COMP2611-Code-Lab.html"), "w").write(standalone)
    # the same standalone page in docs/, so GitHub Pages can serve the site straight from the repository
    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
    open(os.path.join(ROOT, "docs", "index.html"), "w").write(standalone)
    print("lessons: %d, exercises: %d (%d tests), examples: %d, quest: %d chapters, %d levels, size: %.0f KB" % (len(lessons), len(exs), sum(len(e["tests"]) for e in exs), len(examples), len(quest["worlds"]), sum(len(w["levels"]) for w in quest["worlds"]), len(page) / 1024))
    if ERRORS:
        print("\n%d PROBLEMS" % len(ERRORS))
        sys.exit(1)
    print("OK")

if __name__ == "__main__":
    main()
