---
title: Breadth-first and depth-first search
summary: Breadth-first search visits a graph in waves, nearest vertices first, using a queue. Depth-first search follows one path as far as it can before backing up, using recursion. Both colour each vertex WHITE, GREY or BLACK so that no vertex is visited twice.
lectures: Lectures 16–17
goals:
  - Explain the WHITE, GREY and BLACK colours
  - Trace breadth-first search with its queue, and get the lecture's answers
  - Trace depth-first search with its recursive calls, and get the lecture's answers
  - Write both traversals in C++ on the lecture's Graph struct
  - Say what each search is good for
labs: [graph]
---

## The graph and the colours

Both lectures traverse this directed graph:

:::diagram graph g1
The graph from Lectures 16 and 17. Its adjacency lists are A: D F G, B: A, C: B E, D: B E, E: B, F: E G, G: C.
:::

Unlike a tree, a graph can have cycles (A → D → B → A) and many routes to the same vertex. A traversal must remember which vertices it has already reached, or it would go round in circles. The lecture gives every vertex a **colour**:

| Colour | Meaning |
|---|---|
| **WHITE** | not discovered yet |
| **GREY** | discovered, but not finished (its edges are still being looked at, or it is waiting in the queue) |
| **BLACK** | finished: every edge leaving it has been examined |

Every vertex starts WHITE. Only WHITE vertices are ever added to the search. That single test is what stops a vertex being visited twice.

## Breadth-first search

The lecture's algorithm:

```text
breadthFirstTraversal (G, source, visited):
	for each vertex u in the set of vertices in G
		u.colour = WHITE
	G.vertices[source].colour = GREY
	create an empty set visited
	Q = initQueue ()
	enqueue (Q, source)
	while Q is not empty
		u = dequeue (Q)
		add u to visited
		for each v in the adjacency list of u
			loc = findVertex (G, v)
			if G.vertices[loc].colour == WHITE
				G.vertices[loc].colour = GREY
				enqueue (Q, loc)
		u.colour = BLACK
```

The queue (lesson E2) is the heart of it. Vertices leave the queue in the order they were discovered, so the search spreads out in waves: first the source, then everything one edge away, then everything two edges away, and so on. It works exactly like level order traversal of a tree (lesson F4), plus the colour test.

Starting from A:

| Take from queue | Its edges | Newly GREY, added to the queue | Queue afterwards |
|---|---|---|---|
| A | D, F, G | D, F, G | D F G |
| D | B, E | B, E | F G B E |
| F | E, G | none: both are already GREY | G B E |
| G | C | C | B E C |
| B | A | none: A is BLACK | E C |
| E | B | none: B is BLACK | C |
| C | B, E | none | empty |

The vertices in the order they were taken from the queue: **A D F G B E C**, the lecture's breadth-first traversal.

:::parsons Put the lines of dfTraverse in order.
void dfTraverse (Graph * g, int u) {
	cout << g->vertices[u].ID << " ";
	g->vertices[u].colour = GREY;
	for (Edge * e = g->vertices[u].firstEdge; e != NULL; e = e->nextEdge) {
		int v = findVertex (g, e->destID);
		if (g->vertices[v].colour == WHITE)
			dfTraverse (g, v);
	}
	g->vertices[u].colour = BLACK;
}
~			dfTraverse (g, u);
:::


:::remember
BFS visits vertices in order of their distance (number of edges) from the source: A at distance 0; D, F, G at distance 1; B, E, C at distance 2. So BFS finds the path with the **fewest edges** from the source to every reachable vertex.
:::

Lecture 17's second example:

:::diagram graph g3
BFS example 2 (Lecture 17). Adjacency lists: A: B C D, B: E F, C: G, D: C G, F: B, G: F.
:::

From A: take A (add B, C, D), take B (add E, F), take C (add G), take D (C and G are already GREY), then E, F and G add nothing new. Breadth-first traversal: **A B C D E F G**.

## Depth-first search

The lecture's algorithm:

```text
depthFirstTraversal (G):
	for each vertex u in the set of vertices in G (V)
		u.colour = WHITE
	create an empty set visited
	for each vertex u in the set of vertices in G (V)
		if u.colour == WHITE
			dfTraverse (G, u, visited)

dfTraverse (G, u, visited):
	add u to visited
	u.colour = GREY
	for each v in the adjacency list of u
		if v.colour == WHITE
			dfTraverse (G, v, visited)
	u.colour = BLACK
```

Depth-first search goes **deep** first. The moment it finds a WHITE neighbour, it calls itself on that neighbour, before looking at any of the current vertex's other edges. Only when a vertex has no WHITE neighbours left does it turn BLACK and return, letting the caller carry on with its next edge. The recursion's call stack (lesson D1) remembers the way back.

On the same graph, starting with A:

| Call | Visit | What happens |
|---|---|---|
| dfTraverse(A) | **A** | first edge D is WHITE → call |
| dfTraverse(D) | **D** | first edge B is WHITE → call |
| dfTraverse(B) | **B** | its only edge, A, is GREY → B is BLACK, return to D |
| (back in D) | | next edge E is WHITE → call |
| dfTraverse(E) | **E** | its edge B is BLACK → E is BLACK, return; D is finished, BLACK, return to A |
| (back in A) | | next edge F is WHITE → call |
| dfTraverse(F) | **F** | E is BLACK; G is WHITE → call |
| dfTraverse(G) | **G** | C is WHITE → call |
| dfTraverse(C) | **C** | B and E are BLACK → C, then G, then F turn BLACK |
| (back in A) | | last edge G is BLACK → A is BLACK, done |

Depth-first traversal: **A D B E F G C**, the lecture's answer.

The outer loop in depthFirstTraversal matters when some vertices cannot be reached from the first one. After dfTraverse(A) returns, the loop checks every other vertex, and any that is still WHITE starts a new search. In this graph everything is reachable from A, so nothing else happens.

:::exam
For a traversal question, write the adjacency lists first (in alphabetical order unless told otherwise). For BFS, keep the queue written out and cross off each vertex as it leaves. For DFS, keep a list of the calls that are waiting, like a stack, and always continue with the most recent one.
:::

## Both searches in C++

The Vertex struct gets a `colour` field. The queue is the COMP 1603 queue from Part E, holding vertex **locations** (ints), as the lecture's note says: "source and loc are locations in the array of vertices in G."

```cpp example="BFS and DFS on the Lecture 16 graph" file="graph.txt|7\nA B C D E F G\nA 3 D F G\nB 1 A\nC 2 B E\nD 2 B E\nE 1 B\nF 2 E G\nG 1 C\n"
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

#define MAX_VERTICES 20

const int WHITE = 0;
const int GREY = 1;
const int BLACK = 2;

struct Edge {
	string destID;
	Edge * nextEdge;
};

struct Vertex {
	string ID;
	int colour;
	Edge * firstEdge;
};

struct Graph {
	int numVertices;
	Vertex vertices[MAX_VERTICES];
};

// ---- a queue of ints (COMP 1603, Part E)
struct Node {
	int data;
	Node * next;
};

struct Queue {
	Node * head;
	Node * tail;
};

Queue * initQueue () {
	Queue * q = new Queue;
	q->head = NULL;
	q->tail = NULL;
	return q;
}

bool isEmptyQueue (Queue * q) {
	return q->head == NULL;
}

void enqueue (Queue * q, int data) {
	Node * newNode = new Node;
	newNode->data = data;
	newNode->next = NULL;
	if (q->tail == NULL) {
		q->head = newNode;
		q->tail = newNode;
	}
	else {
		q->tail->next = newNode;
		q->tail = newNode;
	}
}

int dequeue (Queue * q) {
	if (q->head == NULL)
		return -999;
	Node * toDelete = q->head;
	int save = toDelete->data;
	q->head = q->head->next;
	if (q->head == NULL)
		q->tail = NULL;
	delete toDelete;
	return save;
}

// ---- the graph
int findVertex (Graph * g, string id) {
	for (int i = 0; i < g->numVertices; i++)
		if (g->vertices[i].ID == id)
			return i;
	return -1;
}

void addEdge (Graph * g, string u, string v) {
	int loc = findVertex (g, u);
	Edge * newEdge = new Edge;
	newEdge->destID = v;
	newEdge->nextEdge = NULL;
	if (g->vertices[loc].firstEdge == NULL)
		g->vertices[loc].firstEdge = newEdge;
	else {
		Edge * last = g->vertices[loc].firstEdge;
		while (last->nextEdge != NULL)
			last = last->nextEdge;
		last->nextEdge = newEdge;
	}
}

Graph * readGraph (string fileName) {
	ifstream in;
	in.open (fileName.c_str ());
	if (!in.is_open ())
		return NULL;
	Graph * g = new Graph;
	in >> g->numVertices;
	for (int i = 0; i < g->numVertices; i++) {
		in >> g->vertices[i].ID;
		g->vertices[i].firstEdge = NULL;
	}
	for (int i = 0; i < g->numVertices; i++) {
		string u, v;
		int numEdges;
		in >> u >> numEdges;
		for (int j = 0; j < numEdges; j++) {
			in >> v;
			addEdge (g, u, v);
		}
	}
	in.close ();
	return g;
}

// ---- breadth-first search
void breadthFirstTraversal (Graph * g, int source) {
	for (int i = 0; i < g->numVertices; i++)
		g->vertices[i].colour = WHITE;
	g->vertices[source].colour = GREY;
	Queue * q = initQueue ();
	enqueue (q, source);
	while (!isEmptyQueue (q)) {
		int u = dequeue (q);
		cout << g->vertices[u].ID << " ";
		for (Edge * e = g->vertices[u].firstEdge; e != NULL; e = e->nextEdge) {
			int loc = findVertex (g, e->destID);
			if (g->vertices[loc].colour == WHITE) {
				g->vertices[loc].colour = GREY;
				enqueue (q, loc);
			}
		}
		g->vertices[u].colour = BLACK;
	}
	cout << endl;
	delete q;
}

// ---- depth-first search
void dfTraverse (Graph * g, int u) {
	cout << g->vertices[u].ID << " ";
	g->vertices[u].colour = GREY;
	for (Edge * e = g->vertices[u].firstEdge; e != NULL; e = e->nextEdge) {
		int v = findVertex (g, e->destID);
		if (g->vertices[v].colour == WHITE)
			dfTraverse (g, v);
	}
	g->vertices[u].colour = BLACK;
}

void depthFirstTraversal (Graph * g) {
	for (int i = 0; i < g->numVertices; i++)
		g->vertices[i].colour = WHITE;
	for (int i = 0; i < g->numVertices; i++)
		if (g->vertices[i].colour == WHITE)
			dfTraverse (g, i);
	cout << endl;
}

int main() {
	Graph * g = readGraph ("graph.txt");
	if (g == NULL)
		return 1;
	cout << "Breadth-first: ";
	breadthFirstTraversal (g, findVertex (g, "A"));
	cout << "Depth-first:   ";
	depthFirstTraversal (g);
	return 0;
}
```

Press **Step through**, jump to the end, and open the **Call tree** tab. With **Only recursive calls** ticked, it shows just the dfTraverse calls, and they form the depth-first tree: A calls D and F, D calls B and E, F calls G, and G calls C. Each call's second argument is the vertex's location in the array (0 is A, 1 is B, and so on).

## Which search, when?

| | Breadth-first | Depth-first |
|---|---|---|
| Tool that remembers what to do next | a queue | recursion (the call stack) |
| Order | nearest vertices first, in waves | one path as deep as possible, then back up |
| Good for | the path with the fewest edges; anything "level by level" | exploring every route; detecting cycles; visiting everything |
| Cost with adjacency lists | each vertex queued once, each edge examined once | each vertex called once, each edge examined once |

Both examine every edge once, so each takes time proportional to V + E when looking up a vertex's location is quick. (The `findVertex` above searches the whole array, so this version is slower on big graphs.)

Try other start vertices and the second example graph in the [Graph Lab](#lab-graph), which colours each vertex as it changes and shows the queue.

:::teachback
Explain how breadth-first search and depth-first search each decide which vertex to visit next, and what the WHITE, GREY and BLACK colours mean.
>> BFS uses a queue, so vertices are visited in the order they were discovered: nearest first, in waves.
>> DFS uses recursion: it follows the first unvisited neighbour as deep as it can, then backs up.
>> WHITE means not yet discovered, GREY means discovered but not finished, BLACK means finished.
>> Only WHITE vertices are added, so no vertex is visited twice.
:::

:::quiz
In BFS on the Lecture 16 graph from A, what is in the queue (front first) just after D has been taken off the queue and its edges examined?
- [ ] D F G
- [x] F G B E
- [ ] B E F G
- [ ] F G B E C
>> After A the queue is D F G. Taking D adds its WHITE neighbours B and E at the back, giving F G B E.
:::

:::quiz
What is the breadth-first traversal of the Lecture 16 graph starting from **B**?
- [ ] B A D B E F G C
- [ ] B A D E F G C
- [x] B A D F G E C
- [ ] B A D F G C E
>> B's only edge leads to A. A adds D, F, G. D adds E (B is BLACK). F adds nothing new (E and G are GREY). G adds C. Order of leaving the queue: B A D F G E C.
:::

:::quiz
What is the depth-first traversal of Lecture 17's second graph (A: B C D, B: E F, C: G, D: C G, F: B, G: F), starting with A?
- [ ] A B C D E F G
- [x] A B E F C G D
- [ ] A B E F G C D
- [ ] A D G F B E C
>> A calls B; B calls E (no edges), then F (its edge to B is GREY). Back in A, C is WHITE: C calls G (its edge to F is BLACK). Back in A, D is WHITE: its edges lead to C and G, both BLACK. Order: A B E F C G D.
:::

:::quiz
During BFS, what does it mean for a vertex to be GREY?
- [ ] It has never been seen
- [x] It has been discovered and put in the queue, but its edges have not all been examined
- [ ] It has been removed from the graph
- [ ] All of its edges have been examined
>> WHITE is undiscovered, BLACK is finished. GREY marks a vertex that is waiting in the queue or being processed, so it is never added to the queue a second time.
:::
