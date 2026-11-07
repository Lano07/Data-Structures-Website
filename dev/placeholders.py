import os
T = {
"a1-first-program":"Your first C++ program","a2-variables":"Variables, types and expressions","a3-decisions":"Making decisions","a4-loops":"Loops","a5-functions":"Functions","a6-references":"References and parameters","a7-arrays":"Arrays","a8-strings":"Strings and characters","a9-structs":"Structs","a10-files":"Reading and writing files","a11-organizing":"Organising a program",
"b1-addresses":"Addresses and pointers","b2-pointers-structs":"Pointers to structs","b3-new-delete":"new and delete","b4-pitfalls":"Pointer pitfalls","b5-pointers-arrays":"Pointers and arrays",
"c1-building":"Building a linked list","c2-traversal":"Walking through a list","c3-insertion":"Inserting nodes","c4-deletion":"Deleting nodes","c5-more-ops":"More list operations",
"d1-how-recursion-works":"How recursion works","d2-recursion-lists":"Recursion on linked lists","d3-recursion-arrays":"Recursion on arrays",
"e1-stacks":"Stacks","e2-queues":"Queues","e3-applications":"Using stacks and queues",
"f1-terminology":"Tree terminology","f2-traversals":"Tree traversals","f3-tree-code":"Writing tree functions","f4-level-order-types":"Level order and types of binary trees",
"g1-bst-property":"The BST property","g2-insert-search":"Insert and search","g3-parent-successor":"Parent pointers and the inorder successor","g4-deletion":"Deleting from a BST","g5-performance":"How fast is a BST?",
"h1-heap-arrays":"Heaps stored in arrays","h2-heapify-build":"maxHeapify and buildMaxHeap","h3-delete-heapsort":"Deleting from a heap and heap sort","h4-insert-priority":"Insert, increase key and priority queues",
"i1-hash-tables":"Hash tables","i2-probing":"Collisions and probing","i3-chaining-strings":"Chaining and string keys",
"j1-graph-basics":"Graph basics","j2-graph-code":"Graphs in C++","j3-bfs-dfs":"Breadth-first and depth-first search","j4-dijkstra":"Dijkstra's shortest paths","j5-mst":"Minimum spanning trees",
"k1-simple-sorts":"Selection, bubble and insertion sort","k2-merge-sort":"Merge sort","k3-quick-sort":"Quick sort","k4-sorting-performance":"Comparing the sorts",
"l1-performance":"Performance and big-O","l2-exam-technique":"Writing code under exam conditions"}
d = os.path.join(os.path.dirname(__file__), "..", "content", "lessons")
n = 0
for k, t in T.items():
    p = os.path.join(d, k + ".md")
    if not os.path.exists(p):
        open(p, "w").write("---\ntitle: %s\nsummary: This lesson is being written.\n---\nThis lesson is being written. Come back soon.\n" % t)
        n += 1
print("placeholders written:", n)
