# Adds code puzzles (:::parsons) and predict-the-output blocks (:::predict) to lessons.
# Puzzle lines are copied from the lesson's own code (trailing comments removed); the build checks they still match.
import re, os
FENCE_RE = re.compile(r"^```(\w*)([^\n]*)\n(.*?)^```\s*$", re.M | re.S)
L = "content/lessons/%s.md"
PUZ = [
 ("c1-building", "Node * insertAtHead (Node * top, int n)", "Put the lines of insertAtHead in order.", ["\ttop->next = newNode;"]),
 ("c2-traversal", "void printList (Node * top)", "Put the lines of printList in order.", ["\t\tcurr = top->next;"]),
 ("c3-insertion", "Node * insertAtTail (Node * top, int n)", "Put the lines of insertAtTail in order.", ["\tnewNode->next = top;"]),
 ("c4-deletion", "Node * deleteAtHead (Node * top)", "Put the lines of deleteAtHead in order.", ["\tdelete top;"]),
 ("d2-recursion-lists", "int sizeRec (Node * top)", "Put the lines of sizeRec in order.", ["\treturn sizeRec (top->next);"]),
 ("e1-stacks", "int pop (Stack * stack)", "Put the lines of pop in order.", ["\t\tstack->top = toDelete;"]),
 ("e2-queues", "void enqueue (Queue * queue, int data)", "Put the lines of enqueue in order.", ["\t\tqueue->head = queue->tail;"]),
 ("f2-traversals", "void inOrder (BTNode * root)", "Put the lines of inOrder in order.", ["\tinOrder (root);"]),
 ("f3-tree-code", "int height (BTNode * root)", "Put the lines of height in order.", ["\t\treturn 1 + leftHeight + rightHeight;"]),
 ("g2-insert-search", "BTNode * insertBST (BTNode * root, int key)", "Put the lines of insertBST in order.", ["\t\troot = insertBST (root->left, key);"]),
 ("g3-parent-successor", "BTNode * inOrderSuccessor (BTNode * node)", "Put the lines of inOrderSuccessor in order.", ["\twhile (parent != NULL && node == parent->left) {"]),
 ("h2-heapify-build", "void maxHeapify (MaxHeap * heap, int i)", "Put the lines of maxHeapify in order.", ["\t\tmaxHeapify (heap, i);"]),
 ("h4-insert-priority", "void insertMaxHeap (MaxHeap * heap, int n)", "Put the lines of insertMaxHeap in order.", ["\twhile (i > 1 && heap->A[i/2] > heap->A[i]) {"]),
 ("i1-hash-tables", "int insertKey (int table[], int key)", "Put the lines of insertKey (linear probing) in order.", ["\t\tloc = hashKey (loc + 1);"]),
 ("j3-bfs-dfs", "void dfTraverse (Graph * g, int u)", "Put the lines of dfTraverse in order.", ["\t\t\tdfTraverse (g, u);"]),
 ("k1-simple-sorts", "void insertionSort (int A[], int n)", "Put the lines of insertionSort in order.", ["\t\t\tA[j] = A[j + 1];"]),
 ("k2-merge-sort", "void mergeSort (int A[], int start, int end)", "Put the lines of mergeSort in order.", ["\t\tmergeSort (A, mid, end);"]),
 ("k3-quick-sort", "int partition (int A[], int p, int r)", "Put the lines of partition in order.", ["\tint i = p;"]),
]
HDR = "#include <iostream>\nusing namespace std;\n\n"
NODE = "struct Node {\n\tint data;\n\tNode * next;\n};\n\nNode * createNode (int n) {\n\tNode * newNode = new Node;\n\tnewNode->data = n;\n\tnewNode->next = NULL;\n\treturn newNode;\n}\n\n"
BT = "struct BTNode {\n\tint data;\n\tBTNode * left;\n\tBTNode * right;\n};\n\nBTNode * createBTNode (int data) {\n\tBTNode * newNode = new BTNode;\n\tnewNode->data = data;\n\tnewNode->left = NULL;\n\tnewNode->right = NULL;\n\treturn newNode;\n}\n\n"
PRED = [
 ("a4-loops", "What does this program print?", HDR + "int main() {\n\tfor (int i = 1; i <= 3; i++) {\n\t\tfor (int j = 1; j <= i; j++)\n\t\t\tcout << j;\n\t\tcout << \" \";\n\t}\n\tcout << endl;\n\treturn 0;\n}\n"),
 ("a6-references", "One parameter is a copy and one is a reference. What does this print?", HDR + "void addTen (int x, int & y) {\n\tx = x + 10;\n\ty = y + 10;\n}\n\nint main() {\n\tint a = 1, b = 2;\n\taddTen (a, b);\n\tcout << a << \" \" << b << endl;\n\treturn 0;\n}\n"),
 ("b1-addresses", "Two pointers, one variable. What does this print?", HDR + "int main() {\n\tint x = 5;\n\tint * p = &x;\n\tint * q = p;\n\t*q = 8;\n\tcout << x << \" \" << *p << endl;\n\tp = NULL;\n\tcout << *q << endl;\n\treturn 0;\n}\n"),
 ("c2-traversal", "This loop stops one node early on purpose. What does it print?", HDR + NODE + "int main() {\n\tNode * top = createNode (10);\n\ttop->next = createNode (20);\n\ttop->next->next = createNode (30);\n\ttop->next->next->next = createNode (40);\n\tNode * curr = top;\n\tint count = 0;\n\twhile (curr->next != NULL) {\n\t\tcount++;\n\t\tcurr = curr->next;\n\t}\n\tcout << count << \" \" << curr->data << endl;\n\treturn 0;\n}\n"),
 ("d1-how-recursion-works", "Work before the call and after it. What does f (3) print?", HDR + "void f (int n) {\n\tif (n == 0)\n\t\treturn;\n\tcout << n << \" \";\n\tf (n - 1);\n\tcout << n << \" \";\n}\n\nint main() {\n\tf (3);\n\tcout << endl;\n\treturn 0;\n}\n"),
 ("d3-recursion-arrays", "What does this recursive function return?", HDR + "int f (int A[], int n) {\n\tif (n == 0)\n\t\treturn 0;\n\tif (A[n - 1] % 2 == 0)\n\t\treturn A[n - 1] + f (A, n - 1);\n\treturn f (A, n - 1);\n}\n\nint main() {\n\tint A[] = {3, 8, 5, 6, 2};\n\tcout << f (A, 5) << endl;\n\treturn 0;\n}\n"),
 ("f2-traversals", "Predict both lines before you run it.", HDR + BT + "void preOrder (BTNode * root) {\n\tif (root == NULL)\n\t\treturn;\n\tcout << root->data << \" \";\n\tpreOrder (root->left);\n\tpreOrder (root->right);\n}\n\nvoid postOrder (BTNode * root) {\n\tif (root == NULL)\n\t\treturn;\n\tpostOrder (root->left);\n\tpostOrder (root->right);\n\tcout << root->data << \" \";\n}\n\nint main() {\n\tBTNode * root = createBTNode (1);\n\troot->left = createBTNode (2);\n\troot->right = createBTNode (3);\n\troot->left->right = createBTNode (4);\n\troot->right->left = createBTNode (5);\n\tpreOrder (root);\n\tcout << endl;\n\tpostOrder (root);\n\tcout << endl;\n\treturn 0;\n}\n"),
 ("g2-insert-search", "The keys go in this order. What is the preorder traversal of the BST?", HDR + BT + "BTNode * insertBST (BTNode * root, int key) {\n\tif (root == NULL)\n\t\treturn createBTNode (key);\n\tif (key < root->data)\n\t\troot->left = insertBST (root->left, key);\n\telse if (key > root->data)\n\t\troot->right = insertBST (root->right, key);\n\treturn root;\n}\n\nvoid preOrder (BTNode * root) {\n\tif (root == NULL)\n\t\treturn;\n\tcout << root->data << \" \";\n\tpreOrder (root->left);\n\tpreOrder (root->right);\n}\n\nint main() {\n\tint keys[] = {40, 25, 60, 30, 10, 50, 35};\n\tBTNode * root = NULL;\n\tfor (int i = 0; i < 7; i++)\n\t\troot = insertBST (root, keys[i]);\n\tpreOrder (root);\n\tcout << endl;\n\treturn 0;\n}\n"),
 ("h2-heapify-build", "Predict the array after buildMaxHeap.", HDR + "struct MaxHeap {\n\tint A [100];\n\tint size;\n};\n\nvoid maxHeapify (MaxHeap * heap, int i) {\n\tint left = i * 2;\n\tint right = i * 2 + 1;\n\tint largest = i;\n\tif (left <= heap->size && heap->A[left] > heap->A[largest])\n\t\tlargest = left;\n\tif (right <= heap->size && heap->A[right] > heap->A[largest])\n\t\tlargest = right;\n\tif (largest != i) {\n\t\tint temp = heap->A[i];\n\t\theap->A[i] = heap->A[largest];\n\t\theap->A[largest] = temp;\n\t\tmaxHeapify (heap, largest);\n\t}\n}\n\nvoid buildMaxHeap (MaxHeap * heap) {\n\tfor (int i = heap->size / 2; i >= 1; i = i - 1)\n\t\tmaxHeapify (heap, i);\n}\n\nint main() {\n\tint values[] = {3, 9, 2, 1, 4, 5};\n\tMaxHeap * heap = new MaxHeap;\n\theap->size = 6;\n\tfor (int i = 0; i < 6; i++)\n\t\theap->A[i + 1] = values[i];\n\tbuildMaxHeap (heap);\n\tfor (int i = 1; i <= heap->size; i++)\n\t\tcout << heap->A[i] << \" \";\n\tcout << endl;\n\treturn 0;\n}\n"),
 ("i1-hash-tables", "Linear probing with h = key % 7 + 1. Where does each key go?", HDR + "const int N = 7;\nconst int EMPTY = 0;\n\nint insertKey (int table[], int key) {\n\tint loc = key % N + 1;\n\twhile (table[loc] != EMPTY) {\n\t\tloc = loc + 1;\n\t\tif (loc > N)\n\t\t\tloc = 1;\n\t}\n\ttable[loc] = key;\n\treturn loc;\n}\n\nint main() {\n\tint table[N + 1];\n\tfor (int i = 0; i <= N; i++)\n\t\ttable[i] = EMPTY;\n\tint keys[] = {15, 22, 8, 13, 20};\n\tfor (int i = 0; i < 5; i++)\n\t\tcout << keys[i] << \" -> \" << insertKey (table, keys[i]) << endl;\n\treturn 0;\n}\n"),
 ("k1-simple-sorts", "Selection sort prints the array after each pass. Predict all three lines.", HDR + "void show (int A[], int n) {\n\tfor (int i = 0; i < n; i++)\n\t\tcout << A[i] << \" \";\n\tcout << endl;\n}\n\nint main() {\n\tint A[] = {7, 3, 9, 1};\n\tint n = 4;\n\tfor (int i = 0; i < n - 1; i++) {\n\t\tint smallest = i;\n\t\tfor (int j = i + 1; j < n; j++)\n\t\t\tif (A[j] < A[smallest])\n\t\t\t\tsmallest = j;\n\t\tint temp = A[i];\n\t\tA[i] = A[smallest];\n\t\tA[smallest] = temp;\n\t\tshow (A, n);\n\t}\n\treturn 0;\n}\n"),
]
def strip_comment(l):
    return re.sub(r"\s*//.*$", "", l).rstrip()
def insert_block(lid, block):
    p = L % lid
    s = open(p).read()
    if block.split("\n")[0] in s and block in s:
        return False
    for marker in ("\n:::remember", "\n:::teachback", "\n:::quiz"):
        i = s.find(marker)
        if i >= 0:
            s = s[:i] + "\n" + block + "\n" + s[i:]
            open(p, "w").write(s)
            return True
    s = s.rstrip() + "\n\n" + block + "\n"
    open(p, "w").write(s)
    return True
for lid, sig, title, bad in PUZ:
    body = open(L % lid).read()
    if ":::parsons" in body:
        continue
    code = None
    for m in FENCE_RE.finditer(body):
        c = m.group(3)
        i = c.find(sig)
        if i >= 0:
            rest = c[i:]
            end = re.search(r"^\}", rest, re.M)
            code = rest[:end.end()]
            break
    assert code, (lid, sig)
    lines = [strip_comment(l) for l in code.split("\n") if l.strip()]
    block = ":::parsons " + title + "\n" + "\n".join(lines) + "\n" + "\n".join("~" + b for b in bad) + "\n:::\n"
    insert_block(lid, block)
for lid, title, prog in PRED:
    body = open(L % lid).read()
    if ":::predict" in body:
        continue
    block = ":::predict " + title + "\n```cpp\n" + prog.rstrip("\n") + "\n```\n:::\n"
    insert_block(lid, block)
print("done")
