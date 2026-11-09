# world: bst
title: The Archive of the Indies
place: Seville, Spain
when: founded 1785
topic: bst
parts: g, m
scene: seville
color: #ff9a3c
fragment: The Archive Key
blurb: Binary search trees: the BST property, insert, search, min and max, parent pointers, successor and predecessor, deletion, performance, and AVL trees.

## bst-1 | The catalogue rule
goal: State the BST property and see why inorder gives sorted order.
lessons: g1-bst-property

@scene Seville, Spain · the Archivo General de Indias
@say narrator: In 1785, King Charles III gathered the records of Spain's empire in the Americas into one building in Seville: the Archive of the Indies. Today it holds around 80 million pages, from Columbus's time to the 1800s. Trinidad's own Spanish records are among them: the island was Spanish until the British captured it in 1797.
@say marco: Eighty million pages. How does anyone find anything?
@say you: The professor's note says the archive's oldest catalogue is a tree. Every drawer sends you left for smaller numbers and right for bigger ones.
@learn The binary search tree property
A **binary search tree** (BST) is a binary tree where, for **every** node:

- every key in its **left** subtree is **smaller** than its key, and
- every key in its **right** subtree is **larger**.

(The course's BSTs have no duplicate keys.)

It is not enough for each node to be bigger than its left **child**: the rule covers the **whole** subtree. In the tree 50 → left 30 → right 60, 60 is bigger than its parent 30, but it is in 50's left subtree and bigger than 50: **not** a BST.

Because of the rule, an **inorder** traversal (left, node, right) visits the keys in **ascending order**. That is the quickest way to check a BST on paper: write the inorder sequence and see if it is sorted.

```cpp
struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
	BTNode * parent;     // the lectures add this for successor and delete
};
```
@quiz tree="50(30(20,60),70)" Is this a binary search tree?
- [ ] Yes: every node is bigger than its left child and smaller than its right child
- [x] No: 60 is in 50's left subtree, but it is bigger than 50
- [ ] No: 20 should be on the right of 30
- [ ] Yes, because the root is the middle value
>> The rule is about whole subtrees. 60 sits under 50 on the left, so it must be smaller than 50. The inorder sequence 20 30 60 50 70 is not sorted, which proves it.
@tree tree="40(20(10,30),60(50,70))" kind="in"
Prove this catalogue is a BST: click the keys in **inorder**. They should come out sorted.
@type What is the inorder traversal of the BST built by inserting 8, 3, 10, 1, 6 (in that order)? Type the keys separated by spaces.
= 1 3 6 8 10
>> Inorder of any BST is sorted, whatever order the keys were inserted in.
@relic archive | The Casa Lonja | The Archive of the Indies is housed in the Casa Lonja, Seville's old merchants' exchange, built in the late 1500s so traders would stop doing business on the cathedral steps. It became a UNESCO World Heritage Site in 1987, together with the cathedral and the Alcázar palace.
@journal
- BST: every key in a node's left subtree is smaller, every key in its right subtree is larger
- The rule covers whole subtrees, not just children
- Inorder traversal of a BST is sorted: the quick check on paper

## bst-2 | Filing new documents
goal: Insert into a BST, search it, and find the minimum and maximum.
lessons: g2-insert-search

@scene The reading room · a librarian hands you a stack of new folders
@say marco: Each new folder needs a drawer. Where does 35 go?
@learn insertBST, containsBST, minimum and maximum
**Search** compares at each node and goes one way: smaller left, bigger right. It follows **one path** from the root, so it takes at most height + 1 comparisons.

```cpp
BTNode * containsBST (BTNode * root, int key) {
	if (root == NULL)
		return NULL;                         // fell off: not here
	if (root->data == key)
		return root;
	if (key < root->data)
		return containsBST (root->left, key);
	return containsBST (root->right, key);
}
```

**Insert** searches for the key and puts it where the search falls off the tree. A new key always becomes a **leaf**:

```cpp
BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL)
		return createBTNode (key);           // the empty spot: the new leaf
	if (key < root->data) {
		root->left = insertBST (root->left, key);
		root->left->parent = root;
	}
	else if (key > root->data) {
		root->right = insertBST (root->right, key);
		root->right->parent = root;
	}
	return root;                             // a duplicate changes nothing
}
```

**Minimum**: keep going **left** until there is no left child. **Maximum**: keep going right.
@tree tree="40(20(10,30),60(50,70))" kind="insert" key="35"
File folder **35**: click the empty spot (+) where insertBST puts it.
>> 35 < 40 goes left to 20; 35 > 20 goes right to 30; 35 > 30 goes right, and 30's right is empty. 35 becomes 30's right child.
@tree tree="40(20(10,30(,35)),60(50,70))" kind="path" key="50"
Find folder **50**: click the nodes on the search path, from the root.
@tree tree="40(20(10,30(,35)),60(50,70))" kind="path" key="33"
Search for **33**: click the path. (It is not in the catalogue: follow the comparisons until you would fall off.)
>> 33 < 40 left, 33 > 20 right, 33 > 30 right to 35, 33 < 35 left: empty. Not found after 4 comparisons.
@quiz How do you find the smallest key in a BST?
- [ ] It is always the root
- [ ] Check every node
- [x] Follow left children from the root until a node has no left child
- [ ] Follow right children to the end
>> Everything smaller is always to the left, so the leftmost node is the minimum.
@code ex="bst-min-max"
Write minimumBST and maximumBST.
@journal
- Search follows one path: smaller left, bigger right; at most height + 1 comparisons
- Insert searches, then hangs the new key where the search fell off: it is always a new leaf
- Minimum: keep going left. Maximum: keep going right

## bst-3 | Who comes next?
goal: Find the inorder successor and predecessor, with and without a right subtree.
lessons: g3-parent-successor

@scene The map room · folders numbered in sequence
@say you: The professor's note: "After 1785, the next record." We need the folder that comes right after it in order.
@say marco: The inorder successor. The next key in sorted order.
@learn The inorder successor (and predecessor)
The **inorder successor** of a node is the next key in sorted order. Two cases:

1. The node **has a right subtree**: the successor is the **minimum of the right subtree** (go right once, then left as far as possible).
2. It has **no** right subtree: walk **up** using the parent pointers until you come up from a **left** child. That parent is the successor. If you reach the root without that happening, the node is the maximum and has no successor.

```cpp
BTNode * inOrderSuccessor (BTNode * node) {
	if (node == NULL)
		return NULL;
	if (node->right != NULL)
		return minimumBST (node->right);       // case 1
	BTNode * parent = node->parent;
	while (parent != NULL && node == parent->right) {
		node = parent;                         // still coming up from the right
		parent = parent->parent;
	}
	return parent;                             // case 2 (NULL: no successor)
}
```

The **predecessor** is the mirror image: the maximum of the left subtree, or walk up until you come up from a right child.
@tree tree="20(10(5,15(12,18)),30(25,40))" kind="succ" key="10"
10 has a right subtree. Click its **inorder successor**.
>> Go right to 15, then left as far as possible: 12. The smallest key larger than 10.
@tree tree="20(10(5,15(12,18)),30(25,40))" kind="succ" key="18"
18 has no right subtree. Click its successor (walk up until you come from a left child).
>> 18 is 15's right child, 15 is 10's right child, and 10 is 20's LEFT child: the successor is 20.
@tree tree="20(10(5,15(12,18)),30(25,40))" kind="pred" key="25"
Now the mirror image: click the inorder **predecessor** of 25.
>> 25 has no left subtree, and it is 30's left child; 30 is 20's right child, so coming up from a right child at 20: the predecessor is 20.
@code ex="bst-successor"
Write inOrderSuccessor with parent pointers.
@journal
- Successor with a right subtree: the minimum of the right subtree
- Without one: walk up until you come up from a LEFT child; that parent is the successor
- Predecessor is the mirror: the maximum of the left subtree, or come up from a RIGHT child

## bst-4 | Removing a document
goal: Delete from a BST in all three cases.
lessons: g4-deletion

@scene The archive's back stacks · Silas has slipped in a forged folder
@say silas: (a note pinned to a shelf) *I left you a forgery somewhere in the catalogue. Remove it without wrecking the order, if you can.*
@learn Deleting: three cases
After a delete the tree must still be a BST.

| Case | The node has | What to do |
|---|---|---|
| 1 | no children (a leaf) | cut it off: its parent's pointer becomes NULL |
| 2 | one subtree | replace it with that subtree (the child moves up) |
| 3 | two subtrees | copy its **inorder successor's** key into it, then delete the successor node instead |

In case 3 the successor is the minimum of the right subtree, so it has **no left child**: deleting it is case 1 or case 2, which are easy. Copying the successor keeps the BST property: it is larger than everything on the left and the smallest thing on the right.

Example: delete 30 from the tree 20 → (17, 30 → (25, 50 → (45 → 40, 80))). 30 has two subtrees (case 3). Its successor is the minimum of its right subtree: 50 → 45 → 40. Copy 40 into the node, then delete the old 40, a leaf.

When a child moves up (case 2), fix its parent pointer too.
@quiz tree="20(17(5,18),30(25,50(45(40),80)))" Delete 30. Which key ends up where 30 was?
- [ ] 25, its left child
- [x] 40, its inorder successor
- [ ] 50, its right child
- [ ] 45
>> 30 has two subtrees: case 3. The successor is the minimum of the right subtree: from 50 go left to 45, then to 40. 40 replaces 30, and the old 40 (a leaf) is removed.
@quiz tree="20(17(5,18),30(25,50(45(40),80)))" Delete 45. What happens?
- [ ] 45 is cut off with 40 still attached
- [x] Case 2: 45 has one subtree (40), so 40 moves up into 45's place
- [ ] Case 3: copy in the successor
- [ ] Nothing: 45 cannot be deleted
>> 45 has exactly one child, 40, so 50's left pointer now points to 40 (and 40's parent becomes 50).
@type tree="15(6(3,7(,13(9))),18(17,20))" Delete 6 from this BST, then write the new preorder traversal.
= 15 7 3 13 9 18 17 20
>> 6 has two subtrees: case 3. Its successor is the minimum of its right subtree (7, which has no left child). Copy 7 into the node, then delete the old 7 (case 2: 13 moves up). Preorder: 15 7 3 13 9 18 17 20.
@lab id="bst" preset='{"keys": [15, 6, 18, 3, 7, 17, 20, 13, 9], "op": "del", "key": 6}'
Watch the same deletion step by step in the BST Lab, then try deleting other keys of your own.
@journal
- Case 1 (leaf): cut it off. Case 2 (one subtree): the child moves up
- Case 3 (two subtrees): copy the inorder successor's key in, then delete the successor (it has no left child)
- When a node moves up, fix its parent pointer

## bst-5 | The endless corridor
goal: Explain why BST operations cost O(height), and when that becomes O(n).
lessons: g5-performance, g6-deep-bst

@scene A corridor of shelves stretching into the dark
@say marco: Why is this corridor so long? It's just one shelf after another, all in a line.
@say you: Someone filed the folders in sorted order. The tree degenerated into a list.
@learn Performance: it all depends on the height
Search, insert and delete each follow **one path** from the root, so they cost **O(h)**, where h is the tree's height.

- A **balanced** BST with n keys has height about **log₂ n**: 1,000,000 keys in about 20 levels. Operations are **O(log n)**.
- A **degenerate** BST is a chain: every node has one child. Inserting keys **in sorted order** (or reverse sorted) builds one: inserting 1, 2, 3, …, n gives height n − 1. Operations become **O(n)**, no better than a linked list.

The **shape depends on the insertion order**: the same keys can give a bushy tree or a chain. The best height possible for n nodes is ⌊log₂ n⌋.
@type You insert 10, 20, 30, 40, 50, 60, 70 into an empty BST, in that order. What is its height?
= 6
>> Each key is bigger than all before it, so each becomes the right child of the last: a chain of 7 nodes, height 6.
@quiz Which insertion order of 1 to 7 gives the shortest BST?
- [ ] 1 2 3 4 5 6 7
- [x] 4 2 6 1 3 5 7
- [ ] 7 6 5 4 3 2 1
- [ ] 1 7 2 6 3 5 4
>> 4 2 6 1 3 5 7 puts the middle key first, then the middles of each half: a complete tree of height 2. Sorted orders give a chain of height 6.
@quiz A BST holds n keys. What is the worst-case cost of searching it?
- [ ] O(1)
- [ ] O(log n)
- [x] O(n)
- [ ] O(n log n)
>> In the worst case (a degenerate tree) the search walks a chain of n nodes. O(log n) is only guaranteed when the tree is kept balanced.
@journal
- BST search, insert and delete are O(h)
- Balanced: h ≈ log₂ n, so O(log n). Degenerate (sorted inserts): h = n − 1, so O(n)
- The shape depends on the insertion order

## bst-6 | Self-balancing shelves
goal: Keep a BST balanced with AVL rotations.
lessons: m4-avl-trees

@scene The archive's restoration workshop
@say narrator: A conservator is re-shelving a collapsed bookcase. Every time one side gets two books taller than the other, she rotates a section.
@learn AVL trees (beyond the notes)
An **AVL tree** is a BST that rebalances itself after every insert and delete. Each node has a **balance factor**:

**balance = height(left subtree) − height(right subtree)**, and it must stay −1, 0 or +1.

After an insert, walk back up; at the **first** node whose balance becomes +2 or −2, apply a **rotation**:

| Case | New key went into | Fix |
|---|---|---|
| LL | the left child's left subtree | one right rotation |
| RR | the right child's right subtree | one left rotation |
| LR | the left child's right subtree | left rotation on the child, then right rotation |
| RL | the right child's left subtree | right rotation on the child, then left rotation |

A rotation is a local rewiring of three nodes that keeps the BST order. Because the height stays O(log n), every operation is **O(log n) guaranteed**, even for sorted input.
@quiz Insert 10, 20, 30 into an empty AVL tree. After 30, node 10 has balance −2. Which case and fix?
- [ ] LL: rotate right
- [x] RR: rotate left at 10, so 20 becomes the root
- [ ] LR: double rotation
- [ ] No rotation is needed
>> 30 went into the right child's right subtree: RR. A single left rotation makes 20 the root with children 10 and 30.
@quiz Insert 30, 10, 20 into an empty AVL tree. Which rotation fixes it?
- [ ] A single right rotation at 30
- [ ] A single left rotation at 30
- [x] LR: rotate left at 10, then right at 30, so 20 becomes the root
- [ ] None
>> 20 went into the left child's right subtree: the LR case needs two rotations. Result: 20 with children 10 and 30.
@lab id="avl" preset='{"keys": [10, 20, 30, 40, 50, 25]}'
Watch an AVL tree stay balanced in the AVL Lab, then insert your own keys (try a sorted run).
@say narrator: Behind the restored bookcase, an old drawer slides open: a key engraved with a shelf mark, and a sketch of three pyramids under a desert sun. Beneath it, the professor's handwriting: **"Giza. The tallest stone is always on top. — C.R."**
@say marco: Egypt. Of course it's Egypt.
@boss
The Degenerate stretches the catalogue into a corridor: a BST fed sorted keys until it became a list. Beat it with exam-style BST questions.
@journal
- AVL: balance = height(left) − height(right) must stay −1, 0 or +1
- Fix the first unbalanced node on the way up with LL, RR, LR or RL rotations
- AVL operations are O(log n) guaranteed, even for sorted input
