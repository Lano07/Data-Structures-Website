---
title: Graphs in C++
summary: The lecture stores a graph as an array of vertices, where each vertex holds the top of a linked list of its edges. This lesson builds that structure, reads a graph from a file, answers the two key questions (which edges leave v, and is there an edge from u to v), and adds weights and an adjacency matrix.
lectures: Lectures 15–17
goals:
  - Write the Edge, Vertex and Graph structs from the lecture
  - Add vertices and edges, and find a vertex's location with findVertex
  - Read a graph stored in a file in the lecture's format
  - Answer "which edges leave v?" and "is there an edge from u to v?" in code
  - Store weights, and build an adjacency matrix from the lists
labs: [graph, memory]
---

## The structs

The lecture's adjacency list uses three structs:

```cpp norun
struct Edge {                       // a node in the linked list of edges
	string destID;                  // the vertex this edge leads to
	Edge * nextEdge;
};

struct Vertex {
	string ID;                      // the vertex's name, e.g. "A"
	Edge * firstEdge;               // top of the linked list of edges
};

struct Graph {
	int numVertices;
	Vertex vertices[MAX_VERTICES];  // array of vertices, each containing the top of a linked list
};
```

Read it from the outside in. A `Graph` has an array of `Vertex` structs. Each `Vertex` has a name and a pointer, `firstEdge`, which is the **top** of a linked list. Each `Edge` in that list names one destination and points to the next edge. It is the same shape as a chaining hash table (lesson I3): an array whose elements are tops of linked lists.

`MAX_VERTICES` is a constant, for example `#define MAX_VERTICES 20`. The array has room for that many vertices, and `numVertices` says how many are actually in use, in locations 0 to numVertices − 1.

## Building a graph

```cpp norun
Graph * initGraph () {
	Graph * g = new Graph;
	g->numVertices = 0;
	return g;
}

void addVertex (Graph * g, string id) {
	g->vertices[g->numVertices].ID = id;
	g->vertices[g->numVertices].firstEdge = NULL;     // no edges yet
	g->numVertices++;
}

int findVertex (Graph * g, string id) {             // the location of id in the array
	for (int i = 0; i < g->numVertices; i++)
		if (g->vertices[i].ID == id)
			return i;
	return -1;                                      // no such vertex
}

void addEdge (Graph * g, string u, string v) {      // an edge from u to v
	int loc = findVertex (g, u);
	if (loc == -1)
		return;
	Edge * newEdge = new Edge;
	newEdge->destID = v;
	newEdge->nextEdge = NULL;
	if (g->vertices[loc].firstEdge == NULL)
		g->vertices[loc].firstEdge = newEdge;
	else {                                          // add at the end of u's list
		Edge * last = g->vertices[loc].firstEdge;
		while (last->nextEdge != NULL)
			last = last->nextEdge;
		last->nextEdge = newEdge;
	}
}
```

`addEdge` adds at the **end** of the list (insertAtTail, lesson C3) so that each list keeps the edges in the order they were given. Adding at the head would be faster, but the lists would come out backwards, and the order of a list decides the order in which BFS and DFS visit vertices (lesson J3).

`findVertex` turns a name into a location. The edges store names (`destID`), so whenever an algorithm follows an edge, it calls findVertex to find where that vertex lives in the array. The lecture's BFS notes this: "source and loc are locations in the array of vertices in G."

```cpp memory caption="A Graph with three vertices on the heap. Each vertex's firstEdge is the top of its own list of Edge nodes. vertices[3] is not in use yet."
#include <iostream>
#include <string>
using namespace std;

#define MAX_VERTICES 4

struct Edge {
	string destID;
	Edge * nextEdge;
};

struct Vertex {
	string ID;
	Edge * firstEdge;
};

struct Graph {
	int numVertices;
	Vertex vertices[MAX_VERTICES];
};

Graph * initGraph () {
	Graph * g = new Graph;
	g->numVertices = 0;
	return g;
}

void addVertex (Graph * g, string id) {
	g->vertices[g->numVertices].ID = id;
	g->vertices[g->numVertices].firstEdge = NULL;
	g->numVertices++;
}

int findVertex (Graph * g, string id) {
	for (int i = 0; i < g->numVertices; i++)
		if (g->vertices[i].ID == id)
			return i;
	return -1;
}

void addEdge (Graph * g, string u, string v) {
	int loc = findVertex (g, u);
	if (loc == -1)
		return;
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

int main() {
	Graph * g = initGraph ();
	addVertex (g, "A");
	addVertex (g, "B");
	addVertex (g, "C");
	addEdge (g, "A", "B");
	addEdge (g, "A", "C");
	addEdge (g, "C", "B");
	cout << g->numVertices << endl;
	return 0;
}
```

## Storing a graph in a file

Lecture 15 stores a graph in a text file:

```text
6
A B C D E F
A 2 B F
B 2 C E
C 1 D
D 2 A B
E 1 D
F 1 E
```

- Line 1: the number of vertices.
- Line 2: the vertices.
- Then **one row for each vertex**: its name, how many edges leave it, and where they go. "A 2 B F" means A has 2 edges, one to B and one to F.

:::diagram graph file
The graph stored in the file above.
:::

Reading it uses the same `>>` steps as any file (lesson A10). Because each row says how many edges follow, an inner loop reads exactly that many destinations:

```cpp example="Reading a graph from a file" file="graph.txt|6\nA B C D E F\nA 2 B F\nB 2 C E\nC 1 D\nD 2 A B\nE 1 D\nF 1 E\n"
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

#define MAX_VERTICES 20

struct Edge {
	string destID;
	Edge * nextEdge;
};

struct Vertex {
	string ID;
	Edge * firstEdge;
};

struct Graph {
	int numVertices;
	Vertex vertices[MAX_VERTICES];
};

Graph * initGraph () {
	Graph * g = new Graph;
	g->numVertices = 0;
	return g;
}

void addVertex (Graph * g, string id) {
	g->vertices[g->numVertices].ID = id;
	g->vertices[g->numVertices].firstEdge = NULL;
	g->numVertices++;
}

int findVertex (Graph * g, string id) {
	for (int i = 0; i < g->numVertices; i++)
		if (g->vertices[i].ID == id)
			return i;
	return -1;
}

void addEdge (Graph * g, string u, string v) {
	int loc = findVertex (g, u);
	if (loc == -1)
		return;
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
	if (!in.is_open ()) {
		cout << "Cannot open " << fileName << endl;
		return NULL;
	}
	Graph * g = initGraph ();
	int n;
	in >> n;
	for (int i = 0; i < n; i++) {
		string id;
		in >> id;
		addVertex (g, id);
	}
	for (int i = 0; i < n; i++) {
		string u;
		int numEdges;
		in >> u >> numEdges;
		for (int j = 0; j < numEdges; j++) {
			string v;
			in >> v;
			addEdge (g, u, v);
		}
	}
	in.close ();
	return g;
}

void printGraph (Graph * g) {
	for (int i = 0; i < g->numVertices; i++) {
		cout << "[" << g->vertices[i].ID << "]";
		for (Edge * e = g->vertices[i].firstEdge; e != NULL; e = e->nextEdge)
			cout << " -> " << e->destID;
		cout << endl;
	}
}

int main() {
	Graph * g = readGraph ("graph.txt");
	if (g == NULL)
		return 1;
	printGraph (g);
	return 0;
}
```

The file's contents are shown under the program. To try a different graph, press **Open in Playground**, where you can edit the file and run the program again.

## The two questions

The lecture asks two questions about this structure.

**What are the edges leaving vertex v?** Find v's location, then walk its list. The number of steps is the number of edges leaving v, its out-degree.

```cpp norun
void printEdgesLeaving (Graph * g, string v) {
	int loc = findVertex (g, v);
	if (loc == -1)
		return;
	for (Edge * e = g->vertices[loc].firstEdge; e != NULL; e = e->nextEdge)
		cout << v << " -> " << e->destID << endl;
}
```

**Is there an edge from vertex u to vertex v?** Walk u's list looking for v. This is `contains` from lesson C2, on u's list.

```cpp norun
bool hasEdge (Graph * g, string u, string v) {
	int loc = findVertex (g, u);
	if (loc == -1)
		return false;
	for (Edge * e = g->vertices[loc].firstEdge; e != NULL; e = e->nextEdge)
		if (e->destID == v)
			return true;
	return false;
}
```

Some questions are harder for lists. The **in-degree** of v (edges entering v) is not stored anywhere: you must walk **every** vertex's list and count the edges whose `destID` is v. That visits every edge in the graph.

```cpp norun
int inDegree (Graph * g, string v) {
	int count = 0;
	for (int i = 0; i < g->numVertices; i++)
		for (Edge * e = g->vertices[i].firstEdge; e != NULL; e = e->nextEdge)
			if (e->destID == v)
				count++;
	return count;
}
```

## Weights

For a weighted graph, each edge also stores its weight:

```cpp norun
struct Edge {
	string destID;
	int weight;                     // e.g. the distance from this vertex to destID
	Edge * nextEdge;
};
```

`addEdge` gets one more parameter and sets `newEdge->weight`. Nothing else changes.

## An adjacency matrix in C++

The matrix version is a 2D array: `matrix[i][j]` describes the edge from the vertex at location i to the vertex at location j. It can be filled from the lists in one pass over every edge:

```cpp norun
int matrix[MAX_VERTICES][MAX_VERTICES];

for (int i = 0; i < g->numVertices; i++)
	for (int j = 0; j < g->numVertices; j++)
		matrix[i][j] = 0;                           // no edge yet
for (int i = 0; i < g->numVertices; i++)
	for (Edge * e = g->vertices[i].firstEdge; e != NULL; e = e->nextEdge)
		matrix[i][findVertex (g, e->destID)] = 1;   // edge from i to that vertex
```

Now "is there an edge from u to v?" is a single lookup, `matrix[findVertex (g, u)][findVertex (g, v)] == 1`. For a weighted graph, store the weight instead of 1, and use a very large number (for example `const int INF = 999999;`) to stand for ∞, no edge.

```cpp example="Questions about a graph" file="graph.txt|6\nA B C D E F\nA 2 B F\nB 2 C E\nC 1 D\nD 2 A B\nE 1 D\nF 1 E\n"
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

#define MAX_VERTICES 20

struct Edge {
	string destID;
	Edge * nextEdge;
};

struct Vertex {
	string ID;
	Edge * firstEdge;
};

struct Graph {
	int numVertices;
	Vertex vertices[MAX_VERTICES];
};

int findVertex (Graph * g, string id) {
	for (int i = 0; i < g->numVertices; i++)
		if (g->vertices[i].ID == id)
			return i;
	return -1;
}

void addEdge (Graph * g, string u, string v) {
	int loc = findVertex (g, u);
	if (loc == -1)
		return;
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

bool hasEdge (Graph * g, string u, string v) {
	int loc = findVertex (g, u);
	if (loc == -1)
		return false;
	for (Edge * e = g->vertices[loc].firstEdge; e != NULL; e = e->nextEdge)
		if (e->destID == v)
			return true;
	return false;
}

int outDegree (Graph * g, string v) {
	int count = 0;
	int loc = findVertex (g, v);
	for (Edge * e = g->vertices[loc].firstEdge; e != NULL; e = e->nextEdge)
		count++;
	return count;
}

int inDegree (Graph * g, string v) {
	int count = 0;
	for (int i = 0; i < g->numVertices; i++)
		for (Edge * e = g->vertices[i].firstEdge; e != NULL; e = e->nextEdge)
			if (e->destID == v)
				count++;
	return count;
}

int main() {
	Graph * g = readGraph ("graph.txt");
	if (g == NULL)
		return 1;
	cout << "edge A -> F? " << hasEdge (g, "A", "F") << endl;
	cout << "edge F -> A? " << hasEdge (g, "F", "A") << endl;
	for (int i = 0; i < g->numVertices; i++) {
		string v = g->vertices[i].ID;
		cout << v << ": in " << inDegree (g, v) << ", out " << outDegree (g, v) << endl;
	}

	int matrix[MAX_VERTICES][MAX_VERTICES];
	for (int i = 0; i < g->numVertices; i++)
		for (int j = 0; j < g->numVertices; j++)
			matrix[i][j] = 0;
	for (int i = 0; i < g->numVertices; i++)
		for (Edge * e = g->vertices[i].firstEdge; e != NULL; e = e->nextEdge)
			matrix[i][findVertex (g, e->destID)] = 1;

	cout << "  ";
	for (int j = 0; j < g->numVertices; j++)
		cout << " " << g->vertices[j].ID;
	cout << endl;
	for (int i = 0; i < g->numVertices; i++) {
		cout << g->vertices[i].ID << " ";
		for (int j = 0; j < g->numVertices; j++)
			cout << " " << matrix[i][j];
		cout << endl;
	}
	return 0;
}
```

:::teachback
Explain how the `Edge`, `Vertex` and `Graph` structs fit together, and what `findVertex` is for.
>> A Graph holds `numVertices` and an array of Vertex structs.
>> Each Vertex has an ID and `firstEdge`, the top of its own linked list of Edges.
>> Each Edge stores `destID`, the name of the vertex it leads to, and `nextEdge`.
>> Edges store names, so `findVertex` turns a name into that vertex's location in the array before its edges can be followed.
:::

:::quiz
In the lecture's file format, what does the row `C 2 A D` mean?
- [ ] C is the 2nd vertex, and it is connected to A and D
- [x] Two edges leave C: one to A and one to D
- [ ] There are edges from A and D into C
- [ ] C has weight 2
>> Each vertex row gives the vertex, the number of edges leaving it, and then their destinations. So C → A and C → D.
:::

:::quiz
Using adjacency lists, which of these needs the most work for a graph with V vertices and E edges?
- [ ] Listing the edges leaving one vertex
- [ ] Checking whether there is an edge from u to v
- [x] Finding the in-degree of one vertex
- [ ] Finding the out-degree of one vertex
>> Edges are stored with the vertex they **leave**. To count the edges **entering** v, every list must be walked: all E edges. The other three only walk one vertex's list.
:::

:::quiz
Why does `addEdge` in this lesson add each new edge at the end of the list rather than at the top?
- [ ] Adding at the top is not possible with a Vertex struct
- [ ] It is faster
- [x] So that each list keeps its edges in the order given, which decides the order BFS and DFS visit vertices
- [ ] To avoid duplicate edges
>> Adding at the top would reverse each list. The traversals follow the lists in order, so a reversed list changes the traversal's output. (Adding at the top is actually the faster way.)
:::

:::quiz
Edges store `destID`, a name such as "E". What must a traversal do before it can look at vertex E's own edges?
- [ ] Follow `nextEdge` until it reaches E
- [x] Call `findVertex (g, "E")` to get E's location in the vertices array
- [ ] Nothing, `destID` points straight to E's Vertex
- [ ] Read the file again
>> `destID` is only a name. findVertex searches the vertices array for that name and returns its location, and then `g->vertices[loc].firstEdge` gives E's list.
:::
