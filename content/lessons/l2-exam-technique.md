---
title: Exam technique
summary: How to turn what you know into marks. A time plan for Coursework Exam 1, a routine for every kind of multiple-choice question, the algorithm shapes you must recognise on sight, and a method for writing correct code on paper.
lectures: All lectures
goals:
  - Plan your 50 minutes so every question gets a fair attempt
  - Handle "which statements are true" questions by judging each statement on its own
  - Recognise the course's algorithms from the shape of their code
  - Spot the one-word traps that turn a right answer into a wrong one
  - Write a function on paper with the case method from the lectures
labs: [bst, heap]
---

## Coursework Exam 1 at a glance

| | Coursework Exam 1 |
|---|---|
| When | Tuesday 27 October 2026, 8:30 to 9:20 am (50 minutes), TLC E |
| Questions | 28 multiple choice |
| Marks | 14 questions × 1 mark + 14 questions × 2 marks = 42 |
| Suggested time | 1 minute per 1-mark question, 2 minutes per 2-mark question: 42 minutes |
| Topics | Linked lists 2, Binary trees 5, **BSTs 10**, **Heaps 7**, Performance 4 |

BSTs and heaps are 17 of the 28 questions. If you have one more hour to study, spend it there.

## A plan for the 50 minutes

1. **Write your student ID on both documents first.** The question paper and the answer sheet are separate, and each goes into its own box at the end.
2. **First pass (about 35 minutes).** Answer every question you can do quickly. When a question will clearly take longer than its time (1 or 2 minutes), put a mark beside it, make your best guess on the answer sheet, and move on.
3. **Second pass (about 10 minutes).** Go back to the marked questions. Now you can spend the spare time where it is needed.
4. **Last 5 minutes.** Check that every question has exactly one answer on the answer sheet, in the right row.

:::tip
Never leave a blank. A guess between two options you could not separate is right half the time; a blank is never right.
:::

## Read the question twice

Most wrong answers in this course come from one misread word, not from not knowing the topic. Read the question once for the idea and once for the details. Underline the words that change the answer:

| Watch for | Why it matters |
|---|---|
| left / right | a successor is found in the **right** subtree; a predecessor in the **left** |
| level / height / depth | levels and depth count edges from the root (root = level 0); height counts edges down to the deepest leaf; an empty tree has height −1 |
| moment / weight | moment = number of nodes; weight = number of leaves |
| complete / almost complete / full | three different definitions (lesson F4) |
| max-heap / min-heap | is the largest or the smallest at the root? |
| index 0 unused | heap children are 2i and 2i + 1 only when the root is at 1 |
| best / worst / average case | a BST search is O(log n) for a well-shaped tree but O(n) in the worst case |
| inserted "in the order" | the order of insertion decides a BST's shape |
| NOT / EXCEPT | the question wants the false statement |

## "Which of the statements are true?"

These 2-mark questions list statements (i), (ii), (iii) and offer combinations. Do not read the combinations first. Instead:

1. Judge **each statement on its own**. Write T or F next to it. Look for the one word that could make it false.
2. Then cross out every option that contains a statement you marked F, or leaves out one you marked T.
3. Usually only one option survives. If you are unsure about one statement, the others often decide the answer anyway.

:::info Sample 2-mark question (from the exam information sheet)
Which of the following is true about deleting a node from a BST?

- (i) If the node contains no subtrees, simply set its parent pointer to null.
- (ii) If the node contains only one subtree (left or right), connect that subtree to the parent of the node.
- (iii) If the node contains two subtrees, copy the contents of the inorder successor to the node and then connect the left subtree of the inorder successor to the parent of the inorder successor.

A. I, II and III · B. I and II only · C. I and III only · D. II and III only
:::

Judge each statement:

- (i) T: a leaf is removed by setting the parent's pointer to it to NULL (Case 1).
- (ii) T: that is Cases 2(a) and 2(b).
- (iii) **F**, because of one word. The inorder successor is the minimum of the right subtree, so it has **no left subtree**. It is its **right** subtree that is connected to the successor's parent.

Every option with III is out (A, C, D), which leaves **B**. Notice that even if you were unsure about (i), knowing (iii) is false is enough to choose B.

## Draw it, then trace it

For any question about a specific tree, heap or list, draw it on the question paper, large and neat:

- **Tree**: draw it, and redraw it after each change (each insert or delete).
- **Heap**: draw the array with its indexes **and** the tree. Parent of i is i/2, children are 2i and 2i + 1.
- **Linked list**: boxes and arrows. Cross out an arrow when a pointer changes, and draw the new one.
- **Code**: a small table with one column per variable. Add a row each time a variable changes.

Questions that list a sequence of operations ("insert 50, 30, 70, then delete 30") are pure tracing. They are worth 2 marks because they are long, not because they are hard. Be neat and you will get them.

## Know the algorithms by their shape

Code questions often show an algorithm without its name, like the sample question on the information sheet. Recognise it, and the question becomes "what does this algorithm do on this input?"

| If the code looks like… | it is… | lesson |
|---|---|---|
| `return 1 + f (left) + f (right)`, 0 for NULL | moment (count the nodes) | F3 |
| returns 1 for a node with no children, else `f (left) + f (right)` | numTerminal (count the leaves) | F3 |
| `1 + ` the bigger of `f (left)` and `f (right)`, −1 for NULL | height | F3 |
| a queue: dequeue a node, enqueue its children | level order traversal | F4 |
| `if (key < root->data) go left else go right` | BST search or insert | G2 |
| `while (p->left != NULL) p = p->left` | minimum of a subtree | G2 |
| right subtree exists → its minimum; otherwise climb `while (y != NULL && x == y->right)` | inorder successor | G3 |
| `largest = i`, compare with `2i` and `2i + 1`, swap, call again on the child | maxHeapify | H2 |
| `for (i = size / 2; i >= 1; i--) maxHeapify (...)` | buildMaxHeap | H2 |
| swap `A[1]` with `A[size]`, `size--`, maxHeapify at 1 | extract max (and heap sort's step) | H3 |
| `while (i > 1 && A[i/2] < A[i])` swap, `i = i / 2` | insert or increase key (move up) | H4 |

The exam's sample 2-mark question is the successor algorithm. Given a node with a right subtree, it returns the leftmost node of that subtree. Given a node with no right subtree, it climbs until it arrives from a left child, and returns that parent (or NULL if it climbs past the root: the node was the maximum).

## Performance questions

The four performance questions come from the big-O table in lesson L1. Three habits:

- Ask **which case**: best, worst or average. Without a word saying otherwise, assume the worst case.
- Ask **which shape**: a BST is O(log n) only when it is well shaped; a degenerate BST (sorted insertions) is O(n).
- Ask **what is being done**: "find the maximum" in a max-heap is O(1) (it is A[1]), but "delete the maximum" is O(log n), and "search for a value" in a heap is O(n).

## When a question seems wrong

The information sheet says: if you believe a question has an error, flag it with a short note on the answer sheet. Flagged questions take time to evaluate, so first read it again slowly. Most "errors" are a misread word. If it still looks wrong, choose the best answer **and** write your note.

## Writing code on paper: the case method

Later exams and assignments ask you to write functions. The lectures always solve a function the same way, and so should you:

1. **List the cases first**, in words, like the slides do: "(1) the list is empty → return NULL. (2) the key is at the head → … (3) otherwise → …".
2. **Handle NULL first.** Every function that follows pointers starts with the empty case. Then `top->data`, `root->left` and friends are safe.
3. **Draw before and after.** For any pointer change, draw the structure before and after, and number the arrows in the order you change them. Ask: "after this line, can I still reach every node I need?"
4. **Write the code**, one case at a time, in the same order as your list.
5. **Trace it on small inputs**: the empty structure, one element, the key at the start, the key at the end, the key missing.
6. **Check the endings.** Does every path return a value? Is a changed `top` or `root` returned and stored by the caller? Does every `new` have a matching `delete`?

:::remember
Under pressure, do not invent a new way. Write the shape you practised (traversal loop, recursive tree recipe, heap index arithmetic) and fill in the one line that is different.
:::

:::teachback
Explain your method for answering a "which of the statements are true?" question.
>> Judge each statement on its own and mark it T or F, looking for the one word that could make it false.
>> Then cross out every option that includes a false statement or leaves out a true one.
>> Usually only one option survives, and knowing one statement for sure can be enough.
:::

:::quiz
Sample 1-mark question: which of the following operations takes place in constant time, O(1)?
- [ ] Inserting an element in a binary search tree
- [ ] Deleting an element from an array
- [x] Finding the biggest element in a max-heap
- [ ] Searching for an element in a binary tree
>> The biggest element of a max-heap is always at the root, A[1], so finding it takes one step. BST insertion is O(h), deleting from an array shifts elements (O(n)), and searching a binary tree may visit every node (O(n)).
:::

:::quiz
You have 50 minutes. Fourteen questions are worth 1 mark and fourteen are worth 2 marks. If you spend 1 minute on each 1-mark question and 2 minutes on each 2-mark question, how many minutes are left over?
- [ ] 0
- [ ] 4
- [x] 8
- [ ] 14
>> 14 × 1 + 14 × 2 = 42 minutes of work, leaving 8 minutes for the second pass and the final check.
:::

:::quiz
Which line is the trap? "To find the inorder successor of a node with a right subtree, go to the right child, then follow left pointers until reaching a node with no left child. If the node has no right subtree, climb until you come up from a right child; that parent is the successor."
- [ ] "go to the right child"
- [ ] "follow left pointers"
- [x] "climb until you come up from a right child"
- [ ] There is no trap
>> You climb **while** you are coming up from a right child, and stop when you arrive from a **left** child. That parent is the successor. One swapped word makes the statement false.
:::

:::quiz
A question says: "The keys 10, 20, 30, 40, 50 are inserted into an empty BST in that order. What is the worst-case number of comparisons to search this tree?" What is the best first step?
- [ ] Use the formula log₂ n
- [x] Draw the tree from the insertions
- [ ] Assume the tree is balanced
- [ ] Count the keys
>> The insertion order decides the shape. Drawing it shows a chain leaning right (height 4), so a search can take 5 comparisons, not log₂ 5.
:::
