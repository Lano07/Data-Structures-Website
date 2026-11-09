/* COMP 2611 Code Lab — program labs: Memory Visualizer, Linked List Lab, Stack and Queue Lab, Recursion Lab. */
(function (CL) {
  "use strict";
  var esc = CL.esc;

  var INC = "#include <iostream>\nusing namespace std;\n\n";
  var NODE = "struct Node {\n\tint data;\n\tNode * next;\n};\n\n";
  var CREATE = "Node * createNode (int n) {\n\tNode * newNode;\n\tnewNode = new Node;\n\tnewNode->data = n;\n\tnewNode->next = NULL;\n\treturn newNode;\n}\n\n";
  var PRINT = "void printList (Node * top) {\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tcout << curr->data << \" \";\n\t\tcurr = curr->next;\n\t}\n\tcout << endl;\n}\n\n";
  var BUILD = "// makes a list from an array, with A[0] at the top\nNode * buildList (int A[], int n) {\n\tNode * top = NULL;\n\tfor (int i = n - 1; i >= 0; i--) {\n\t\tNode * newNode = createNode (A[i]);\n\t\tnewNode->next = top;\n\t\ttop = newNode;\n\t}\n\treturn top;\n}\n\n";
  var BTNODE = "struct BTNode {\n\tint data;\n\tBTNode * left;\n\tBTNode * right;\n\tBTNode * parent;\n};\n\n";
  var CREATEBT = "BTNode * createBTNode (int data) {\n\tBTNode * newNode = new BTNode;\n\tnewNode->data = data;\n\tnewNode->left = NULL;\n\tnewNode->right = NULL;\n\tnewNode->parent = NULL;\n\treturn newNode;\n}\n\n";

  var S = [];
  function add(group, id, title, about, code, opts) { S.push(Object.assign({ group: group, id: id, title: title, about: about, code: code }, opts || {})); }

  // ---------------------------------------------------------------- pointers
  add("Pointers", "addr", "A variable and its address",
    "p holds the address of x, so *p is another name for x. Changing *p changes x.",
    INC + "int main() {\n\tint x = 10;\n\tint * p;\n\tp = &x;\n\tcout << x << \" \" << *p << endl;\n\t*p = 20;\n\tcout << x << \" \" << *p << endl;\n\tint y = *p + 5;\n\tp = &y;\n\t*p = *p * 2;\n\tcout << x << \" \" << y << endl;\n\treturn 0;\n}\n");
  add("Pointers", "account", "A pointer to a struct (Lecture 1)",
    "ma holds the address of an Account made with new. The arrow -> reaches a field through the pointer.",
    INC + "struct Account {\n\tint accNumber;\n\tchar accType;\n\tdouble balance;\n};\n\nint main() {\n\tAccount account;\n\taccount.accNumber = 1001;\n\taccount.accType = 'S';\n\taccount.balance = 250.75;\n\n\tAccount * ma;\n\tma = new Account;\n\tma->accNumber = 2002;\n\tma->accType = 'C';\n\tma->balance = account.balance * 2;\n\tcout << ma->accNumber << \" \" << ma->balance << endl;\n\tdelete ma;\n\tma = NULL;\n\treturn 0;\n}\n");
  add("Pointers", "newdel", "new, delete and NULL",
    "new makes an int on the heap and returns its address. delete frees it. Setting the pointer to NULL afterwards avoids a dangling pointer.",
    INC + "int main() {\n\tint * p = new int;\n\t*p = 42;\n\tint * q = p;\n\t*q = *q + 1;\n\tcout << *p << endl;\n\tdelete p;\n\tp = NULL;\n\tq = NULL;\n\treturn 0;\n}\n");
  add("Pointers", "dangle", "A dangling pointer (crashes on purpose)",
    "After delete p, q still holds the old address. Using it is an error. Step to the end to see the error message.",
    INC + NODE + "int main() {\n\tNode * p = new Node;\n\tp->data = 5;\n\tp->next = NULL;\n\tNode * q = p;\n\tdelete p;\n\tp = NULL;\n\tcout << q->data << endl;\n\treturn 0;\n}\n");
  add("Pointers", "leak", "A memory leak",
    "The second new overwrites the only pointer to the first node, so that node can never be deleted.",
    INC + NODE + CREATE + "int main() {\n\tNode * p = createNode (1);\n\tp = createNode (2);\n\tcout << p->data << endl;\n\tdelete p;\n\treturn 0;\n}\n");
  add("Pointers", "params", "Pass by value, by reference and by pointer",
    "byValue changes its own copy. byRef and byPtr change the caller's variable.",
    INC + "void byValue (int n) {\n\tn = n + 100;\n}\n\nvoid byRef (int & n) {\n\tn = n + 100;\n}\n\nvoid byPtr (int * p) {\n\t*p = *p + 100;\n}\n\nint main() {\n\tint a = 1, b = 2, c = 3;\n\tbyValue (a);\n\tbyRef (b);\n\tbyPtr (&c);\n\tcout << a << \" \" << b << \" \" << c << endl;\n\treturn 0;\n}\n");
  add("Pointers", "arrays", "Arrays and pointers",
    "An array name works like the address of element 0. p + 1 points to the next element.",
    INC + "int sumArray (int A[], int n) {\n\tint total = 0;\n\tfor (int i = 0; i < n; i++)\n\t\ttotal = total + A[i];\n\treturn total;\n}\n\nint main() {\n\tint A[5] = {3, 1, 4, 1, 5};\n\tint * p = A;\n\tp = p + 2;\n\t*p = 9;\n\tcout << sumArray (A, 5) << endl;\n\treturn 0;\n}\n");
  add("Pointers", "dynarr", "A dynamic array with new []",
    "new int[n] makes n ints on the heap at run time. Free it with delete [].",
    INC + "int main() {\n\tint n = 5;\n\tint * A = new int[n];\n\tfor (int i = 0; i < n; i++)\n\t\tA[i] = i * i;\n\tfor (int i = 0; i < n; i++)\n\t\tcout << A[i] << \" \";\n\tcout << endl;\n\tdelete [] A;\n\tA = NULL;\n\treturn 0;\n}\n");
  add("Pointers", "structcopy", "Copying a struct vs copying a pointer",
    "a = b copies every field (two separate structs). q = p copies only the address (one node, two pointers).",
    INC + NODE + "int main() {\n\tNode a, b;\n\tb.data = 7;\n\tb.next = NULL;\n\ta = b;\n\ta.data = 8;\n\n\tNode * p = new Node;\n\tp->data = 7;\n\tp->next = NULL;\n\tNode * q = p;\n\tq->data = 8;\n\tcout << b.data << \" \" << p->data << endl;\n\tdelete p;\n\treturn 0;\n}\n");

  // ---------------------------------------------------------------- linked lists
  add("Pointers", "deepcopy", "Shallow copy vs deep copy of a list",
    "copying top copies only the pointer, so both names share the same nodes (a shallow copy). copyList makes new nodes (a deep copy), so changing one list no longer changes the other.",
    INC + NODE + CREATE + "Node * copyList (Node * top) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tNode * newNode = createNode (top->data);\n\tnewNode->next = copyList (top->next);\n\treturn newNode;\n}\n\n" +
    "int main() {\n\tNode * top = createNode (1);\n\ttop->next = createNode (2);\n\tNode * shallow = top;\n\tNode * deep = copyList (top);\n\ttop->data = 99;\n\tcout << shallow->data << \" \" << deep->data << endl;\n\treturn 0;\n}\n");
  add("Pointers", "owner", "Ownership: exactly one delete per new",
    "Two pointers hold the same node, but only one of them may delete it. After the owner deletes it, the other pointer is dangling, so it is set to NULL. Handing the node to a new owner means the old pointer lets go (= NULL).",
    INC + NODE + CREATE + "int main() {\n\tNode * owner = createNode (5);\n\tNode * viewer = owner;\n\tcout << viewer->data << endl;\n\tNode * newOwner = owner;\n\towner = NULL;\n\tdelete newOwner;\n\tnewOwner = NULL;\n\tviewer = NULL;\n\tcout << \"freed once, no dangling pointers left\" << endl;\n\treturn 0;\n}\n");
  add("Linked lists", "build", "Build a list with insertAtHead",
    "Each new node is linked in front of the old top, so the list ends up in reverse order of insertion.",
    INC + NODE + CREATE + "Node * insertAtHead (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tnewNode->next = top;\n\treturn newNode;\n}\n\n" + PRINT + "int main() {\n\tNode * top = NULL;\n\ttop = insertAtHead (top, 30);\n\ttop = insertAtHead (top, 20);\n\ttop = insertAtHead (top, 10);\n\tprintList (top);\n\treturn 0;\n}\n");
  add("Linked lists", "tail", "insertAtTail with getLast",
    "getLast walks to the last node. The new node is linked after it.",
    INC + NODE + CREATE + "Node * getLast (Node * top) {\n\tNode * last;\n\tNode * previous;\n\tlast = previous = top;\n\twhile (last != NULL) {\n\t\tprevious = last;\n\t\tlast = last->next;\n\t}\n\treturn previous;\n}\n\nNode * insertAtTail (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tif (top == NULL)\n\t\treturn newNode;\n\tNode * lastNode = getLast (top);\n\tlastNode->next = newNode;\n\treturn top;\n}\n\n" + PRINT + "int main() {\n\tNode * top = NULL;\n\ttop = insertAtTail (top, 10);\n\ttop = insertAtTail (top, 20);\n\ttop = insertAtTail (top, 30);\n\tprintList (top);\n\treturn 0;\n}\n");
  add("Linked lists", "middle", "Delete a node from the middle",
    "prev stops at the node before the one to delete, then skips over it.",
    INC + NODE + CREATE + BUILD + PRINT + "Node * deleteKey (Node * top, int key) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tif (top->data == key) {\n\t\tNode * temp = top;\n\t\ttop = top->next;\n\t\tdelete temp;\n\t\treturn top;\n\t}\n\tNode * prev = top;\n\tNode * curr = top->next;\n\twhile (curr != NULL && curr->data != key) {\n\t\tprev = curr;\n\t\tcurr = curr->next;\n\t}\n\tif (curr != NULL) {\n\t\tprev->next = curr->next;\n\t\tdelete curr;\n\t}\n\treturn top;\n}\n\nint main() {\n\tint A[] = {10, 20, 30, 40};\n\tNode * top = buildList (A, 4);\n\ttop = deleteKey (top, 30);\n\tprintList (top);\n\treturn 0;\n}\n", { startAt: "deleteKey" });
  add("Linked lists", "reverse", "Reverse a list in place",
    "Three pointers walk along the list, turning each next arrow around.",
    INC + NODE + CREATE + BUILD + PRINT + "Node * reverse (Node * top) {\n\tNode * prev = NULL;\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tNode * nextNode = curr->next;\n\t\tcurr->next = prev;\n\t\tprev = curr;\n\t\tcurr = nextNode;\n\t}\n\treturn prev;\n}\n\nint main() {\n\tint A[] = {10, 20, 30, 40};\n\tNode * top = buildList (A, 4);\n\ttop = reverse (top);\n\tprintList (top);\n\treturn 0;\n}\n", { startAt: "reverse" });
  add("Linked lists", "destroy", "Delete every node",
    "Save top->next before deleting top, or the rest of the list is lost.",
    INC + NODE + CREATE + BUILD + "Node * deleteList (Node * top) {\n\twhile (top != NULL) {\n\t\tNode * temp = top;\n\t\ttop = top->next;\n\t\tdelete temp;\n\t}\n\treturn NULL;\n}\n\nint main() {\n\tint A[] = {10, 20, 30};\n\tNode * top = buildList (A, 3);\n\ttop = deleteList (top);\n\treturn 0;\n}\n", { startAt: "deleteList" });
  add("Linked lists", "refptr", "Changing top with Node * &",
    "top is passed by reference, so the function can change main's top directly instead of returning it.",
    INC + NODE + CREATE + "void insertAtHead (Node * & top, int n) {\n\tNode * newNode = createNode (n);\n\tnewNode->next = top;\n\ttop = newNode;\n}\n\nint main() {\n\tNode * top = NULL;\n\tinsertAtHead (top, 20);\n\tinsertAtHead (top, 10);\n\tcout << top->data << \" \" << top->next->data << endl;\n\treturn 0;\n}\n");

  // ---------------------------------------------------------------- stacks and queues
  add("Linked lists", "doubly", "A doubly linked list (supplementary)",
    "Every node has prev and next, so the list can be walked both ways and a node can be unlinked without searching for the node before it.",
    INC + "struct DNode {\n\tint data;\n\tDNode * prev;\n\tDNode * next;\n};\n\nDNode * createDNode (int n) {\n\tDNode * newNode = new DNode;\n\tnewNode->data = n;\n\tnewNode->prev = NULL;\n\tnewNode->next = NULL;\n\treturn newNode;\n}\n\n" +
    "int main() {\n\tDNode * head = createDNode (10);\n\tDNode * mid = createDNode (20);\n\tDNode * tail = createDNode (30);\n\thead->next = mid; mid->prev = head;\n\tmid->next = tail; tail->prev = mid;\n\tmid->prev->next = mid->next;\n\tmid->next->prev = mid->prev;\n\tdelete mid;\n\tmid = NULL;\n\tfor (DNode * c = tail; c != NULL; c = c->prev)\n\t\tcout << c->data << \" \";\n\tcout << endl;\n\tdelete head;\n\tdelete tail;\n\treturn 0;\n}\n");
  add("Stacks and queues", "stack", "A stack as a linked list (COMP 1603)",
    "push and pop both work at the top, so the last value pushed is the first popped (LIFO).",
    INC + NODE + "struct Stack {\n\tNode * top;\n};\n\nStack * initStack () {\n\tStack * s = new Stack;\n\ts->top = NULL;\n\treturn s;\n}\n\nbool isEmpty (Stack * s) {\n\treturn s->top == NULL;\n}\n\nvoid push (Stack * s, int data) {\n\tNode * newNode = new Node;\n\tnewNode->data = data;\n\tnewNode->next = s->top;\n\ts->top = newNode;\n}\n\nint pop (Stack * s) {\n\tif (isEmpty (s))\n\t\treturn -999;\n\tNode * temp = s->top;\n\tint data = temp->data;\n\ts->top = s->top->next;\n\tdelete temp;\n\treturn data;\n}\n\nint main() {\n\tStack * s = initStack ();\n\tpush (s, 10);\n\tpush (s, 20);\n\tpush (s, 30);\n\tcout << pop (s) << \" \";\n\tcout << pop (s) << endl;\n\treturn 0;\n}\n");
  add("Stacks and queues", "queue", "A queue with head and tail",
    "enqueue adds at the tail, dequeue removes from the head, so values leave in the order they came (FIFO).",
    INC + NODE + "struct Queue {\n\tNode * head;\n\tNode * tail;\n};\n\nQueue * initQueue () {\n\tQueue * q = new Queue;\n\tq->head = NULL;\n\tq->tail = NULL;\n\treturn q;\n}\n\nvoid enqueue (Queue * q, int data) {\n\tNode * newNode = new Node;\n\tnewNode->data = data;\n\tnewNode->next = NULL;\n\tif (q->tail == NULL) {\n\t\tq->head = newNode;\n\t\tq->tail = newNode;\n\t}\n\telse {\n\t\tq->tail->next = newNode;\n\t\tq->tail = newNode;\n\t}\n}\n\nint dequeue (Queue * q) {\n\tif (q->head == NULL)\n\t\treturn -999;\n\tNode * temp = q->head;\n\tint data = temp->data;\n\tq->head = q->head->next;\n\tif (q->head == NULL)\n\t\tq->tail = NULL;\n\tdelete temp;\n\treturn data;\n}\n\nint main() {\n\tQueue * q = initQueue ();\n\tenqueue (q, 10);\n\tenqueue (q, 20);\n\tenqueue (q, 30);\n\tcout << dequeue (q) << \" \";\n\tcout << dequeue (q) << endl;\n\treturn 0;\n}\n");

  // ---------------------------------------------------------------- recursion
  add("Recursion", "fact", "factorial (n)",
    "Each call waits for the call below it. Open the Call tree tab to see the chain of calls and their return values.",
    INC + "int factorial (int n) {\n\tif (n <= 1)\n\t\treturn 1;\n\treturn n * factorial (n - 1);\n}\n\nint main() {\n\tcout << factorial (4) << endl;\n\treturn 0;\n}\n", { calls: true });
  add("Recursion", "fib", "fibonacci (n): a recursion tree",
    "Each call makes two more calls, so the calls form a tree. Notice how fib(2) is worked out more than once.",
    INC + "int fib (int n) {\n\tif (n <= 1)\n\t\treturn n;\n\treturn fib (n - 1) + fib (n - 2);\n}\n\nint main() {\n\tcout << fib (5) << endl;\n\treturn 0;\n}\n", { calls: true });
  add("Recursion", "printrec", "printListRec and printing in reverse",
    "Printing before the recursive call gives the list in order. Printing after it gives the list backwards.",
    INC + NODE + CREATE + BUILD + "void printListRec (Node * top) {\n\tif (top == NULL)\n\t\treturn;\n\tcout << top->data << \" \";\n\tprintListRec (top->next);\n}\n\nvoid printReverse (Node * top) {\n\tif (top == NULL)\n\t\treturn;\n\tprintReverse (top->next);\n\tcout << top->data << \" \";\n}\n\nint main() {\n\tint A[] = {10, 20, 30};\n\tNode * top = buildList (A, 3);\n\tprintListRec (top);\n\tcout << endl;\n\tprintReverse (top);\n\tcout << endl;\n\treturn 0;\n}\n", { calls: true, startAt: "printListRec" });
  add("Recursion", "sumrec", "Sum of an array, recursively",
    "sumRec(A, n) adds the last element to the sum of the first n - 1 elements.",
    INC + "int sumRec (int A[], int n) {\n\tif (n == 0)\n\t\treturn 0;\n\treturn A[n - 1] + sumRec (A, n - 1);\n}\n\nint main() {\n\tint A[] = {4, 7, 1, 8};\n\tcout << sumRec (A, 4) << endl;\n\treturn 0;\n}\n", { calls: true });

  // ---------------------------------------------------------------- trees, heaps, hashing, graphs
  add("Trees, heaps, hashing, graphs", "btree", "Build a binary tree by hand",
    "Each BTNode has two child pointers. Here the tree is linked up one pointer at a time.",
    INC + BTNODE + CREATEBT + "int main() {\n\tBTNode * root = createBTNode (10);\n\troot->left = createBTNode (40);\n\troot->right = createBTNode (25);\n\troot->left->left = createBTNode (30);\n\troot->right->left = createBTNode (50);\n\troot->right->right = createBTNode (20);\n\tcout << root->left->left->data << endl;\n\treturn 0;\n}\n");
  add("Trees, heaps, hashing, graphs", "bstins", "insertBST with parent pointers",
    "Each insert follows the BST rule down from the root and links the new node to its parent.",
    INC + BTNODE + CREATEBT + "BTNode * insertBST (BTNode * root, int key) {\n\tif (root == NULL)\n\t\treturn createBTNode (key);\n\tif (key < root->data) {\n\t\troot->left = insertBST (root->left, key);\n\t\troot->left->parent = root;\n\t}\n\telse\n\tif (key > root->data) {\n\t\troot->right = insertBST (root->right, key);\n\t\troot->right->parent = root;\n\t}\n\treturn root;\n}\n\nvoid inOrder (BTNode * root) {\n\tif (root == NULL)\n\t\treturn;\n\tinOrder (root->left);\n\tcout << root->data << \" \";\n\tinOrder (root->right);\n}\n\nint main() {\n\tint keys[] = {20, 17, 30, 5, 18, 25};\n\tBTNode * root = NULL;\n\tfor (int i = 0; i < 6; i++)\n\t\troot = insertBST (root, keys[i]);\n\tinOrder (root);\n\tcout << endl;\n\treturn 0;\n}\n");
  add("Trees, heaps, hashing, graphs", "heaparr", "A max-heap stored in an array",
    "The heap is just an array inside a struct. Children of i are at 2i and 2i + 1. Location 0 is not used.",
    INC + "struct MaxHeap {\n\tint A [20];\n\tint size;\n};\n\nvoid insertMaxHeap (MaxHeap * heap, int n) {\n\theap->size = heap->size + 1;\n\theap->A[heap->size] = n;\n\tint i = heap->size;\n\twhile (i > 1 && heap->A[i/2] < heap->A[i]) {\n\t\tint temp = heap->A[i/2];\n\t\theap->A[i/2] = heap->A[i];\n\t\theap->A[i] = temp;\n\t\ti = i / 2;\n\t}\n}\n\nint main() {\n\tMaxHeap * heap = new MaxHeap;\n\theap->size = 0;\n\tint values[] = {10, 40, 20, 50, 30};\n\tfor (int i = 0; i < 5; i++)\n\t\tinsertMaxHeap (heap, values[i]);\n\tfor (int i = 1; i <= heap->size; i++)\n\t\tcout << heap->A[i] << \" \";\n\tcout << endl;\n\tdelete heap;\n\treturn 0;\n}\n");
  add("Trees, heaps, hashing, graphs", "chain", "Hashing with chaining",
    "table is an array of list tops. Keys that hash to the same location share a linked list.",
    INC + NODE + "const int N = 12;\n\nint hashKey (int key) {\n\treturn key % N + 1;\n}\n\nvoid insertKey (Node * table[], int key) {\n\tint loc = hashKey (key);\n\tNode * newNode = new Node;\n\tnewNode->data = key;\n\tnewNode->next = table[loc];\n\ttable[loc] = newNode;\n}\n\nint main() {\n\tNode * table[N + 1];\n\tfor (int i = 0; i <= N; i++)\n\t\ttable[i] = NULL;\n\tint keys[] = {39, 25, 26, 60, 37};\n\tfor (int i = 0; i < 5; i++)\n\t\tinsertKey (table, keys[i]);\n\tcout << table[2]->data << \" \" << table[2]->next->data << endl;\n\treturn 0;\n}\n");
  add("Trees, heaps, hashing, graphs", "graph", "A graph as adjacency lists (Lecture 16)",
    "Each Vertex holds the top of a linked list of Edges. This is the Graph struct from the slides.",
    INC + "#define MAX_VERTICES 10\n\nstruct Edge {\n\tstring destID;\n\tEdge * nextEdge;\n};\n\nstruct Vertex {\n\tstring ID;\n\tEdge * firstEdge;\n};\n\nstruct Graph {\n\tint numVertices;\n\tVertex vertices[MAX_VERTICES];\n};\n\nvoid addEdge (Graph * g, int u, string v) {\n\tEdge * e = new Edge;\n\te->destID = v;\n\te->nextEdge = g->vertices[u].firstEdge;\n\tg->vertices[u].firstEdge = e;\n}\n\nint main() {\n\tGraph * g = new Graph;\n\tg->numVertices = 3;\n\tstring ids[] = {\"A\", \"B\", \"C\"};\n\tfor (int i = 0; i < 3; i++) {\n\t\tg->vertices[i].ID = ids[i];\n\t\tg->vertices[i].firstEdge = NULL;\n\t}\n\taddEdge (g, 0, \"C\");\n\taddEdge (g, 0, \"B\");\n\taddEdge (g, 1, \"C\");\n\tcout << g->vertices[0].firstEdge->destID << endl;\n\treturn 0;\n}\n");
  CL.MemScenarios = S;

  // ---------------------------------------------------------------- shared UI
  function startIndex(res, fn) {
    if (!fn || !res.calls) return 0;
    for (var i = 0; i < res.calls.length; i++) if (res.calls[i].fn === fn) return res.calls[i].s;
    return 0;
  }
  function vizBlock(main, prog, title) {
    var box = document.createElement("div");
    box.className = "plab-main";
    var about = document.createElement("p");
    about.className = "plab-about";
    about.innerHTML = prog.about ? CL.inline(prog.about) : "";
    box.appendChild(about);
    var bar = document.createElement("div");
    bar.className = "btns";
    bar.innerHTML = '<button type="button" class="btn small" data-a="edit">✎ Change the values (edit this program)</button><button type="button" class="btn small ghost" data-a="play">Open in Playground</button>';
    box.appendChild(bar);
    var edHost = document.createElement("div");
    edHost.hidden = true;
    box.appendChild(edHost);
    var vh = document.createElement("div");
    box.appendChild(vh);
    main.appendChild(box);
    var viz = new CL.Visualizer(vh);
    var ed = null;
    function load(code) {
      var r = viz.load(code, { stdin: prog.stdin || "" });
      if (r && r.compiled && r.snaps && prog.startAt) viz.go(startIndex(r, prog.startAt));
      if (prog.calls) { var t = viz.el.querySelector('.tab[data-t="calls"]'); if (t) t.click(); }
    }
    load(prog.code);
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      if (b.getAttribute("data-a") === "edit") {
        edHost.hidden = !edHost.hidden;
        if (!ed) {
          ed = new CL.Editor(edHost, { value: prog.code, label: "Edit the program", onRun: function () { load(ed.getValue()); } });
          var b2 = document.createElement("div");
          b2.className = "btns";
          b2.style.marginTop = "8px";
          b2.innerHTML = '<button type="button" class="btn primary small">Visualize my version</button><button type="button" class="btn small ghost">Reset</button>';
          b2.children[0].addEventListener("click", function () { load(ed.getValue()); });
          b2.children[1].addEventListener("click", function () { ed.setValue(prog.code); load(prog.code); });
          edHost.appendChild(b2);
        }
        b.textContent = edHost.hidden ? "✎ Change the values (edit this program)" : "Hide the editor";
      }
      if (b.getAttribute("data-a") === "play") {
        CL.toPlayground(ed ? ed.getValue() : prog.code, prog.stdin || "", {}, title || prog.title || "lab program");
      }
    });
    return { viz: viz, destroy: function () { viz.destroy(); } };
  }

  function programLab(host, groups, opts) {
    opts = opts || {};
    var wrap = document.createElement("div");
    wrap.className = "plab";
    var list = document.createElement("nav");
    list.className = "plab-list";
    list.setAttribute("aria-label", "Programs");
    var main = document.createElement("div");
    main.className = "plab-main";
    wrap.appendChild(list);
    wrap.appendChild(main);
    if (opts.controls) host.appendChild(opts.controls);
    host.appendChild(wrap);
    var items = [];
    groups.forEach(function (g) {
      var d = document.createElement("div");
      d.innerHTML = "<h4>" + esc(g.title) + "</h4>";
      g.items.forEach(function (it) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = it.title;
        b.addEventListener("click", function () { select(it, b); });
        d.appendChild(b);
        items.push({ it: it, b: b });
      });
      list.appendChild(d);
    });
    var cur = null, curItem = null;
    function select(it, b) {
      if (cur) cur.destroy();
      main.innerHTML = "";
      items.forEach(function (x) { x.b.classList.toggle("on", x.b === b); });
      curItem = it;
      var prog = typeof it.make === "function" ? it.make() : it;
      cur = vizBlock(main, prog);
    }
    if (items.length) select(items[0].it, items[0].b);
    return { destroy: function () { if (cur) cur.destroy(); }, refresh: function () { var x = items.filter(function (y) { return y.it === curItem; })[0]; if (x) select(x.it, x.b); } };
  }

  function grouped(filter) {
    var groups = [];
    S.forEach(function (s) {
      if (filter && filter.indexOf(s.group) < 0) return;
      var g = groups.filter(function (x) { return x.title === s.group; })[0];
      if (!g) { g = { title: s.group, items: [] }; groups.push(g); }
      g.items.push(s);
    });
    return groups;
  }
  CL.Labs.memory = function (host) { return programLab(host, grouped()); };
  CL.Labs.recursion = function (host) { return programLab(host, grouped(["Recursion"])); };

  // ---------------------------------------------------------------- linked list lab: programs built from your values
  var LIST_OPS = [
    { id: "insertAtHead", title: "insertAtHead (top, x)", needsX: true, fn: "Node * insertAtHead (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tnewNode->next = top;\n\treturn newNode;\n}\n\n", call: "top = insertAtHead (top, X);" },
    { id: "insertAtTail", title: "insertAtTail (top, x)", needsX: true, fn: "Node * getLast (Node * top) {\n\tNode * last;\n\tNode * previous;\n\tlast = previous = top;\n\twhile (last != NULL) {\n\t\tprevious = last;\n\t\tlast = last->next;\n\t}\n\treturn previous;\n}\n\nNode * insertAtTail (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tif (top == NULL)\n\t\treturn newNode;\n\tNode * lastNode = getLast (top);\n\tlastNode->next = newNode;\n\treturn top;\n}\n\n", call: "top = insertAtTail (top, X);" },
    { id: "insertSorted", title: "insertSorted (top, x)", needsX: true, sorted: true, fn: "Node * insertSorted (Node * top, int n) {\n\tNode * newNode = createNode (n);\n\tif (top == NULL || n < top->data) {\n\t\tnewNode->next = top;\n\t\treturn newNode;\n\t}\n\tNode * curr = top;\n\twhile (curr->next != NULL && curr->next->data < n)\n\t\tcurr = curr->next;\n\tnewNode->next = curr->next;\n\tcurr->next = newNode;\n\treturn top;\n}\n\n", call: "top = insertSorted (top, X);" },
    { id: "deleteAtHead", title: "deleteAtHead (top)", fn: "Node * deleteAtHead (Node * top) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tNode * temp = top;\n\ttop = top->next;\n\tdelete temp;\n\treturn top;\n}\n\n", call: "top = deleteAtHead (top);" },
    { id: "deleteKey", title: "deleteKey (top, x)", needsX: true, fn: "Node * deleteKey (Node * top, int key) {\n\tif (top == NULL)\n\t\treturn NULL;\n\tif (top->data == key) {\n\t\tNode * temp = top;\n\t\ttop = top->next;\n\t\tdelete temp;\n\t\treturn top;\n\t}\n\tNode * prev = top;\n\tNode * curr = top->next;\n\twhile (curr != NULL && curr->data != key) {\n\t\tprev = curr;\n\t\tcurr = curr->next;\n\t}\n\tif (curr != NULL) {\n\t\tprev->next = curr->next;\n\t\tdelete curr;\n\t}\n\treturn top;\n}\n\n", call: "top = deleteKey (top, X);" },
    { id: "contains", title: "contains (top, x)", needsX: true, fn: "bool contains (Node * top, int key) {\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tif (curr->data == key)\n\t\t\treturn true;\n\t\tcurr = curr->next;\n\t}\n\treturn false;\n}\n\n", call: "cout << contains (top, X) << endl;" },
    { id: "size", title: "size (top)", fn: "int size (Node * top) {\n\tint count = 0;\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tcount++;\n\t\tcurr = curr->next;\n\t}\n\treturn count;\n}\n\n", call: "cout << size (top) << endl;" },
    { id: "reverse", title: "reverse (top)", fn: "Node * reverse (Node * top) {\n\tNode * prev = NULL;\n\tNode * curr = top;\n\twhile (curr != NULL) {\n\t\tNode * nextNode = curr->next;\n\t\tcurr->next = prev;\n\t\tprev = curr;\n\t\tcurr = nextNode;\n\t}\n\treturn prev;\n}\n\n", call: "top = reverse (top);" },
    { id: "mergeSorted", title: "mergeSorted (top, top2)", needsB: true, sorted: true, fn: "Node * mergeSorted (Node * a, Node * b) {\n\tif (a == NULL)\n\t\treturn b;\n\tif (b == NULL)\n\t\treturn a;\n\tif (a->data <= b->data) {\n\t\ta->next = mergeSorted (a->next, b);\n\t\treturn a;\n\t}\n\tb->next = mergeSorted (a, b->next);\n\treturn b;\n}\n\n", call: "top = mergeSorted (top, top2);" }
  ];
  CL.LIST_OPS = LIST_OPS;
  function arrDecl(name, vals) { return vals.length ? "\tint " + name + "[] = {" + vals.join(", ") + "};\n" : ""; }
  CL.listProgram = function (op, vals, x, vals2) {
    if (op.sorted) { vals = vals.slice().sort(function (a, b) { return a - b; }); vals2 = (vals2 || []).slice().sort(function (a, b) { return a - b; }); }
    var main = "int main() {\n" + arrDecl("A", vals) + "\tNode * top = " + (vals.length ? "buildList (A, " + vals.length + ")" : "NULL") + ";\n";
    if (op.needsB) main += arrDecl("B", vals2) + "\tNode * top2 = " + (vals2.length ? "buildList (B, " + vals2.length + ")" : "NULL") + ";\n";
    main += "\tprintList (top);\n\t" + op.call.replace("X", String(x)) + "\n\tprintList (top);\n\treturn 0;\n}\n";
    return INC + NODE + CREATE + BUILD + PRINT + op.fn + main;
  };
  CL.Labs.lists = function (host) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.innerHTML = "";
    ctl.appendChild(CL.opGroup("List values (top first)", '<input type="text" id="ll-vals" class="wide" value="10 20 30 40">'));
    ctl.appendChild(CL.opGroup("x", '<input type="text" id="ll-x" value="25" style="width:5em" aria-label="x">'));
    var g2 = CL.opGroup("Second list (for merge)", '<input type="text" id="ll-b" value="15 35 45">');
    ctl.appendChild(g2);
    ctl.appendChild(CL.opGroup("", '<button type="button" class="btn primary" id="ll-go">Visualize</button>'));
    var lab;
    var groups = [{ title: "Operations", items: LIST_OPS.map(function (op) {
      return { title: op.title, make: function () {
        var vals = CL.parseNums(host.querySelector("#ll-vals").value, 12), x = CL.parseNums(host.querySelector("#ll-x").value)[0];
        if (x === undefined) x = 25;
        var vals2 = CL.parseNums(host.querySelector("#ll-b").value, 12);
        return { about: (op.sorted ? "This operation needs sorted lists, so your values are sorted first. " : "") + "The program builds your list, then calls `" + op.id + "`. It starts at that call; step back to see the list being built.", code: CL.listProgram(op, vals, x, vals2), startAt: op.id };
      } };
    }) }];
    lab = programLab(host, groups, { controls: ctl });
    ctl.querySelector("#ll-go").addEventListener("click", function () { lab.refresh(); });
    return lab;
  };

  // ---------------------------------------------------------------- stack and queue lab
  var STACK_FNS = S.filter(function (s) { return s.id === "stack"; })[0].code.split("int main()")[0];
  var QUEUE_FNS = S.filter(function (s) { return s.id === "queue"; })[0].code.split("int main()")[0];
  CL.sqProgram = function (kind, ops) {
    var body = "";
    if (kind === "stack") {
      body = "int main() {\n\tStack * s = initStack ();\n";
      ops.forEach(function (o) { body += o.op === "push" ? "\tpush (s, " + o.v + ");\n" : "\tcout << pop (s) << \" \";\n"; });
      return STACK_FNS + body + "\tcout << endl;\n\treturn 0;\n}\n";
    }
    body = "int main() {\n\tQueue * q = initQueue ();\n";
    ops.forEach(function (o) { body += o.op === "push" ? "\tenqueue (q, " + o.v + ");\n" : "\tcout << dequeue (q) << \" \";\n"; });
    return QUEUE_FNS + body + "\tcout << endl;\n\treturn 0;\n}\n";
  };
  CL.parseOps = function (text) {
    var out = [];
    String(text).toLowerCase().split(/[,;\n]+/).forEach(function (part) {
      var m = /(push|enqueue|add|pop|dequeue|remove)\s*\(?\s*(-?\d+)?/.exec(part.trim());
      if (!m) return;
      if (/push|enqueue|add/.test(m[1])) { if (m[2] !== undefined) out.push({ op: "push", v: +m[2] }); }
      else out.push({ op: "pop" });
    });
    return out.slice(0, 24);
  };
  CL.Labs.stackqueue = function (host) {
    var ctl = document.createElement("div");
    ctl.className = "lab-ctl";
    ctl.appendChild(CL.opGroup("Operations, in order", '<input type="text" id="sq-ops" class="wide" value="push 10, push 20, pop, push 30, pop, pop" style="width:24em">'));
    ctl.appendChild(CL.opGroup("", '<button type="button" class="btn primary" id="sq-go">Visualize</button>'));
    var lab;
    function make(kind) {
      return function () {
        var ops = CL.parseOps(host.querySelector("#sq-ops").value);
        if (!ops.length) ops = [{ op: "push", v: 10 }, { op: "pop" }];
        return { about: kind === "stack" ? "**push** adds a node at the top and **pop** removes the top node (LIFO). For a stack, pop and dequeue mean the same thing in your list." : "**enqueue** adds at the tail and **dequeue** removes at the head (FIFO). push in your list means enqueue, pop means dequeue.", code: CL.sqProgram(kind, ops) };
      };
    }
    lab = programLab(host, [{ title: "Structures", items: [{ title: "Stack (linked list)", make: make("stack") }, { title: "Queue (head and tail)", make: make("queue") }] }], { controls: ctl });
    ctl.querySelector("#sq-go").addEventListener("click", function () { lab.refresh(); });
    return lab;
  };
})(CL);
