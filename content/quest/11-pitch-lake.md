# world: vault
title: The Pitch Lake Vault
place: La Brea, Trinidad
when: Today
topic: bigo
parts: l, n
scene: pitch
color: #ff5d8f
fragment: The Lost Index
blurb: The finale: big-O analysis, the cost of every structure in the course, special matrices, trees in proofs, and the final test.

## v-1 | Measuring the climb
goal: Find the big-O of code by counting how the work grows.
lessons: l3-deep-big-o, l1-performance

@scene La Brea, southern Trinidad · the Pitch Lake at dusk
@say narrator: The Pitch Lake is the largest natural deposit of asphalt in the world, about 40 hectares of black pitch. In 1595, the English explorer Sir Walter Raleigh stopped here and used its pitch to caulk the seams of his ships.
@say marco: Home. And look: a black yacht, stuck halfway across the lake. The pitch got it.
@say silas: (shouting) Don't just stand there! Help me!
@say you: We'll come back for you. First, the vault.
@say narrator: At the lake's edge, an iron door is set into the ground, covered in dials. The first dial reads: **HOW FAST DOES IT GROW?**
@learn Big-O: how the work grows
**Big-O** describes how an algorithm's running time **grows** as the input size n grows. It keeps only the **fastest-growing term** and drops constants: 3n² + 5n + 2 is **O(n²)**, because for big n the n² term swamps the rest.

The common classes, from fastest to slowest:

| Big-O | Name | Example |
|---|---|---|
| O(1) | constant | read A[i]; insert at the head of a list; hash lookup (average) |
| O(log n) | logarithmic | binary search; balanced BST search; heap insert |
| O(n) | linear | traverse a list; sequential search |
| O(n log n) | linearithmic | merge sort; heap sort |
| O(n²) | quadratic | selection, bubble, insertion sort; nested loops over all pairs |
| O(2ⁿ) | exponential | naive recursive Fibonacci |

**Counting loops:**

- One loop that runs n times: **O(n)**.
- Two **nested** loops, each n times: **O(n²)**. (Inner loop `j < i`? Still about n²/2: O(n²).)
- A loop that **halves** (or doubles) its variable each time: **O(log n)**.
- A halving loop inside an n loop: **O(n log n)**.
- Loops one **after** another add up: O(n) + O(n²) = O(n²).
@quiz What is the big-O of this code?
```cpp
for (int i = 0; i < n; i++)
	for (int j = 0; j < n; j++)
		count++;
```
- [ ] O(n)
- [x] O(n²)
- [ ] O(2n)
- [ ] O(n log n)
>> The inner loop runs n times for each of the n passes of the outer loop: n × n.
@quiz What is the big-O of this code?
```cpp
for (int i = n; i > 1; i = i / 2)
	count++;
```
- [ ] O(n)
- [ ] O(n²)
- [x] O(log n)
- [ ] O(1)
>> i halves each pass: n, n/2, n/4, … reaches 1 after about log₂ n passes.
@type What is the big-O of f(n) = 4n³ + 100n² + 7? Type it like O(n^3) or O(n³).
= O(n^3) | O(n³) | n^3 | n³ | O(n*n*n)
>> Keep the fastest-growing term and drop its constant: n³.
@quiz Which code is O(n log n)?
- [ ] Two loops one after the other, each n times
- [x] A loop n times containing a loop that halves its variable
- [ ] Three nested loops, each n times
- [ ] A loop that halves its variable
>> n passes of an O(log n) inner loop: n log n. Loops in sequence add (O(n)), three nested give O(n³), one halving loop is O(log n).
@relic raleigh | Raleigh's pitch | In 1595, Sir Walter Raleigh visited the Pitch Lake while searching for the legendary city of gold, El Dorado. He found no gold, but he noted that the pitch was excellent for sealing ships' hulls. Today the lake's asphalt has paved roads around the world.
@journal
- Big-O keeps the fastest-growing term and drops constants: 3n² + 5n + 2 is O(n²)
- O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ)
- One loop n: O(n); nested: O(n²); halving: O(log n); sequential loops add

## v-2 | The cost of every tool
goal: Know the cost of every operation of every structure in the course.
lessons: l1-performance

@scene The second dial · a table of structures, half rubbed away
@say marco: The dial wants every cost in the course. Every structure we used on the way.
@learn The whole course in one table
| Structure | Operation | Cost |
|---|---|---|
| Array | read/write A[i] | O(1) |
| Sorted array | binary search | O(log n) |
| Linked list | insert/delete at the head | O(1) |
| Linked list | search, insert at the tail (no tail pointer), delete a key | O(n) |
| Stack / queue (linked) | push, pop, enqueue, dequeue | O(1) |
| BST | search, insert, delete | O(h): O(log n) balanced, O(n) degenerate |
| AVL tree | search, insert, delete | O(log n) guaranteed |
| Max-heap | find max | O(1) |
| Max-heap | insert, extractMax, increaseKey, maxHeapify | O(log n) |
| Max-heap | buildMaxHeap | O(n) |
| Hash table | search, insert, delete | O(1) average, O(n) worst |
| Graph (lists) | BFS, DFS | O(V + E) |
| Graph | Dijkstra (array) | O(V²) |
| Graph | Floyd | O(V³) |
| Sorting | selection, bubble, insertion | O(n²) worst |
| Sorting | merge, heap | O(n log n) |
| Sorting | quick | O(n log n) average, O(n²) worst |
| Sorting | counting, radix | O(n + k), O(d(n + 10)) |

Remember the **conditions**: BST costs depend on the height, hash costs on the load factor and hash function, quick sort's on the pivot.
@match Match each operation to its cost.
search a balanced BST = O(log n)
find the maximum in a max-heap = O(1)
insert at the head of a linked list = O(1)
buildMaxHeap = O(n)
Floyd's algorithm = O(V³)
search a degenerate BST = O(n)
>> The table is the course's backbone: every exam has questions like these.
@quiz Which operation is O(1) on average but O(n) in the worst case?
- [ ] Inserting into a max-heap
- [x] Searching a hash table
- [ ] Searching a balanced BST
- [ ] Popping a stack
>> With a good hash function a search looks at a few locations; if all keys collide, it degrades to a list search.
@quiz You need the largest item over and over, with new items arriving all the time. Which structure is best?
- [ ] A sorted array
- [ ] A linked list
- [x] A max-heap (a max-priority queue)
- [ ] A hash table
>> A max-heap gives the maximum in O(1) and inserts or removes it in O(log n). A sorted array needs O(n) to insert.
@journal
- Know the table: list O(1) at the head, O(n) to search; heap O(1) max, O(log n) insert/extract, O(n) build
- BST O(h); hash O(1) average, O(n) worst; BFS/DFS O(V + E); Floyd O(V³)
- Always state the condition (height, load factor, pivot) with the cost

## v-3 | The grid lock
goal: Store triangular, symmetric, band and sparse matrices compactly and find any entry.
lessons: n1-special-matrices

@scene The third lock · a grid of 25 tiles, most of them blank
@say you: The grid is mostly zeros. The professor's notes say: "Don't store what you can compute."
@learn Special matrices (course outline topic 8)
An n × n matrix normally needs n² cells. When most entries are zero (or repeat others), store only the ones that matter in a **1-D array**, with a formula to find any entry in O(1). Rows and columns are numbered from **0**.

**Lower triangular** (zeros above the diagonal, j ≤ i kept): store row by row. Rows 0 to i − 1 hold 1 + 2 + … + i = i(i + 1)/2 values, so

**index(i, j) = i(i + 1)/2 + j** (for j ≤ i). Total stored: n(n + 1)/2.

**Upper triangular**: store column by column; the same formula with i and j swapped: **index(i, j) = j(j + 1)/2 + i** (for i ≤ j).

**Symmetric** (`M[i][j] == M[j][i]`): store only the lower triangle; to read (i, j) with j > i, read (j, i) instead.

**Tridiagonal** (band; non-zero only where |i − j| ≤ 1): 3n − 2 values, and **index(i, j) = 2i + j**.

**Sparse** (mostly zeros, no pattern): store a list of **(row, column, value) triplets** for the non-zero entries. Worth it when fewer than about a third of the entries are non-zero (3 numbers per triplet).
@type A lower-triangular 6 × 6 matrix is stored row by row (from 0). At which index is entry (4, 2)?
= 12
>> Rows 0 to 3 hold 1 + 2 + 3 + 4 = 10 values (4 × 5 / 2), so row 4 starts at index 10, and (4, 2) is at 10 + 2 = 12.
@type How many values does a tridiagonal 10 × 10 matrix need to store?
= 28
>> 3n − 2 = 3 × 10 − 2 = 28: two in the first and last rows, three in each of the eight others.
@quiz A symmetric matrix is stored as its lower triangle. How do you read M[1][3]?
- [ ] It is 0, because it is above the diagonal
- [x] Read M[3][1] instead, which is stored
- [ ] Use index(1, 3) = 1 × 2 / 2 + 3
- [ ] It cannot be read
>> Above the diagonal, a symmetric matrix mirrors the lower half: M[1][3] = M[3][1].
@lab id="matrix"
Pack a matrix yourself in the Matrix Lab: click any cell to see its index formula, or type your own matrix.
@code ex="outline-lower-index"
Write the packed lower-triangle index function.
@journal
- Lower triangular, row by row: index(i, j) = i(i + 1)/2 + j; n(n + 1)/2 values
- Upper (column by column): j(j + 1)/2 + i. Symmetric: store the lower half, swap i and j above it
- Tridiagonal: 3n − 2 values, index 2i + j. Sparse: (row, column, value) triplets

## v-4 | The keeper's proof
goal: Prove facts about trees by structural induction, and use them to count.
lessons: n5-trees-proofs

@scene The fourth lock · a stone tablet with an unfinished proof
@say narrator: The tablet reads: *"A binary tree with n nodes has n + 1 empty pointers. Prove it, and the door is yours."*
@learn Structural induction on binary trees
A binary tree is either **empty**, or **a root with two subtrees**, L and R. To prove something about **every** binary tree, follow that shape, exactly like writing a recursive function:

1. **Base case**: prove it for the empty tree.
2. **Inductive step**: assume it is true for L and for R (the **induction hypothesis**), and prove it for the whole tree.

**Claim: a binary tree with n nodes has n + 1 NULL pointers** (counting root itself when the tree is empty).

- Base case: the empty tree has n = 0 nodes and 1 NULL pointer (root). 0 + 1 = 1. ✓
- Step: the tree has a root with subtrees L (n_L nodes) and R (n_R nodes), so n = n_L + n_R + 1. By the hypothesis, L has n_L + 1 NULL pointers and R has n_R + 1. The root's left and right pointers are the roots of L and R, already counted. Total: (n_L + 1) + (n_R + 1) = n + 1. ✓

**Uses:** `moment` makes one call per node and one per NULL pointer: n + (n + 1) = **2n + 1** calls. Other facts proved the same way: a **full** binary tree with i internal nodes has **i + 1 leaves**; level k holds at most **2^k** nodes; a tree of height h has at most **2^(h+1) − 1** nodes, so a tree with n nodes has height at least **log₂(n + 1) − 1**.
@order Put the proof's steps in order.
Base case: the empty tree has 0 nodes and 1 NULL pointer, and 0 + 1 = 1.
Inductive step: take a tree with root and subtrees L and R, with n = n_L + n_R + 1.
Assume L has n_L + 1 NULL pointers and R has n_R + 1 (the induction hypothesis).
The root's two pointers are the roots of L and R, so they are already counted.
Total: (n_L + 1) + (n_R + 1) = n + 1, which proves the claim.
~ Assume every tree has n + 1 NULL pointers, so this one does too.
>> Base case, then the step: split the tree, apply the hypothesis to both subtrees, combine. The distractor assumes what it is trying to prove.
@type A binary tree has 20 nodes. How many calls does the recursive moment function make on it, counting the first?
= 41
>> One call per node (20) plus one per NULL pointer (n + 1 = 21): 41 = 2n + 1.
@type A full binary tree has 9 internal (branch) nodes. How many leaves does it have?
= 10
>> In a full binary tree, leaves = internal nodes + 1, proved by structural induction.
@code ex="outline-count-nulls"
Count the NULL pointers in a tree, and check the n + 1 claim on real trees.
@journal
- Structural induction: base case (empty tree), then assume for L and R and prove for the whole tree
- n nodes ⇒ n + 1 NULL pointers, so moment makes 2n + 1 calls
- Full tree: leaves = internal + 1; level k ≤ 2^k nodes; height ≥ log₂(n + 1) − 1

## v-5 | The Lost Index
goal: Open the vault: one final challenge from every chapter.
lessons: l2-exam-technique

@scene The vault door swings open · inside, by lamplight, a familiar figure
@say prof: {name}! You made it. And Marco, you old pirate. I knew my best student would read the clues.
@say marco: Professor! We thought... why did you hide?
@say prof: Silas Crane wanted the Lost Index to sell it. I hid the keys where only someone who truly understood them could follow. Every keeper of records in history built the same ideas we teach: lists like the chasquis' road, trees like the archive, tables like Bletchley's pigeonholes.
@say you: So where's the Index?
@say prof: One last lock. It asks one question from every chapter. Answer them all.
@tree tree="50(30(20,40),70(60,80))" kind="post"
**Trees**: click the postorder.
@array kind="hash" n="11" keys="22 33 14" method="linear" base="0"
**Hashing**: a table of 11 slots numbered 0 to 10, h = key % 11, linear probing. Place the three keys.
>> 22 and 33 both hash to 0: 33 probes to 1. 14 % 11 = 3.
@heap kind="heapify" values="3 9 8 4 7 1" i="1"
**Heaps**: run maxHeapify at the root.
@graph spec="A B; A C; B D; C D; D E" kind="bfs" start="A"
**Graphs**: BFS from A (neighbours in alphabetical order).
@quiz **Sorting**: which sort is O(n²) on an already sorted array when it uses the last value as the pivot?
- [x] Quick sort
- [ ] Merge sort
- [ ] Heap sort
- [ ] Insertion sort
>> A sorted array makes the last-value pivot the maximum every time: the worst case.
@listsim list="5 9" vars="newNode=7*" goal="5 7 9"
**Linked lists**: insert 7 between 5 and 9.
newNode->next = top->next;
top->next = newNode;
~ top = newNode;
>> Hold on to 9 first, then link 5 to the new node.
@say narrator: The last dial clicks. The back wall slides away, and the lamplight falls on shelves and shelves of journals, cords, tablets, cards and scrolls: the records of every keeper you met on the way. At the centre, a single leather book: **INDEX**.
@say prof: Here it is. The Lost Index is not gold, {name}. It is the method. How to organise anything so that it can be found again. You carried it in your head the whole way.
@say marco: And Silas?
@say narrator: Outside, the coast guard is hauling a very sticky Silas Crane off his yacht. Pitch, it turns out, is excellent at keeping things where they are.
@say pip: Squawk! Programs equal algorithms plus data structures! Squawk!
@say prof: Now go and pass that exam. You have everything you need.
@boss boss="final"
The Final Exam: every topic of the course, fifteen hits, no mercy. Defeat five chapter bosses on the map to unlock it.
@journal
- Exam technique: read the definitions the question uses (height in edges, locations 1..N)
- Trace on paper with a table; check edge cases (empty, one node, first, last, missing)
- Programs = algorithms + data structures: you now know both
