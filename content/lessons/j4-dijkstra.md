---
title: Dijkstra's shortest paths
summary: Dijkstra's algorithm finds the cheapest path from one source vertex to every other vertex of a weighted graph whose weights are not negative. It keeps a cost and a parent for every vertex, repeatedly takes the cheapest unfinished vertex, and checks whether its edges give cheaper paths.
lectures: Lecture 17
goals:
  - Set up the cost and parent table, and the min-priority queue
  - Trace the algorithm one vertex at a time and keep the table correct
  - Read every shortest path out of the finished parent table
  - Explain why the weights must not be negative
  - Write Dijkstra's algorithm in C++
labs: [graph]
---

## The problem

From the lecture: Dijkstra's algorithm can be used to find the **shortest path from a source vertex** (for example A) **to every other vertex** in the graph. "Shortest" means the smallest total weight. The algorithm assumes that the edge weights are **non-negative**.

:::diagram graph dj
The weighted directed graph from Lecture 17. Source: A.
:::

Notice that the cheapest path is not always the one with the fewest edges. A → G costs 75, but A → D → F → C → E → G, with five edges, costs only 20 + 10 + 15 + 5 + 10 = 60.

## What the algorithm keeps

For every vertex V:

- **V.cost**: the cost of the cheapest path from A to V **found so far**.
- **V.parent**: the vertex just before V on that path.

At the start, A's cost is 0 (it costs nothing to stay at A), every other cost is ∞ (no path found yet), and every parent is nil:

| vertex | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| parent | nil | nil | nil | nil | nil | nil | nil |
| cost | 0 | ∞ | ∞ | ∞ | ∞ | ∞ | ∞ |

A **min-priority queue**, Q, holds the vertices ordered by their current cost. At the start every vertex is placed on Q, and A, with a cost of 0, is at the top. (A min-priority queue is like the max-priority queue of lesson H4, with the smallest key on top.)

## The loop

Repeat until Q is empty:

1. Take the vertex u with the **smallest cost** off Q.
2. Consider every edge (u, v) leaving u, in alphabetical order. The edge gives a path to v costing **u.cost + weight(u, v)**.
3. If that is **lower** than v's current cost, update v.cost to it and set **v.parent = u**. Otherwise leave v as it is.

Step 3 is often called **relaxing** the edge: the edge is a possible shortcut, and you keep it only if it really is cheaper.

## The lecture's trace

| Take off Q | Edge | New path cost | Compared with | Result |
|---|---|---|---|---|
| A (cost 0) | A → D | 0 + 20 = 20 | ∞ | D: cost 20, parent A |
| | A → G | 0 + 75 = 75 | ∞ | G: cost 75, parent A |
| D (20) | D → B | 20 + 40 = 60 | ∞ | B: cost 60, parent D |
| | D → E | 20 + 35 = 55 | ∞ | E: cost 55, parent D |
| | D → F | 20 + 10 = 30 | ∞ | F: cost 30, parent D |
| | D → G | 20 + 45 = 65 | 75 | G: cost 65, parent D |
| F (30) | F → B | 30 + 5 = 35 | 60 | B: cost 35, parent F |
| | F → C | 30 + 15 = 45 | ∞ | C: cost 45, parent F |
| | F → E | 30 + 40 = 70 | 55 | higher: E stays as it is |
| B (35) | none | | | no edges leave B |
| C (45) | C → E | 45 + 5 = 50 | 55 | E: cost 50, parent C |
| | C → G | 45 + 25 = 70 | 65 | higher: G stays as it is |
| E (50) | E → G | 50 + 10 = 60 | 65 | G: cost 60, parent E |
| G (60) | none | | | Q is empty: done |

Each time, the vertex taken off Q is the one with the smallest cost **among those still on Q**. After A, that was D (20, the only finite cost), then F (30), B (35), C (45), E (50) and G (60).

The final table:

| vertex | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| parent | nil | F | F | A | C | D | E |
| cost | 0 | 35 | 45 | 20 | 50 | 30 | 60 |

## Reading the paths from the table

The lecture asks: given the table, how do we get the paths? Start at the destination and follow the parents back to A, then read the result backwards. For G:

- G's parent is E, E's parent is C, C's parent is F, F's parent is D, D's parent is A, and A's parent is nil (the source).
- Backwards that is G ← E ← C ← F ← D ← A, so the path is **A → D → F → C → E → G**, cost 60.

| Destination | Cost | Path |
|---|---|---|
| B | 35 | A → D → F → B |
| C | 45 | A → D → F → C |
| D | 20 | A → D |
| E | 50 | A → D → F → C → E |
| F | 30 | A → D → F |
| G | 60 | A → D → F → C → E → G |

## Why it works, and why weights must not be negative

When a vertex u is taken off Q, its cost is **final**. Every other vertex still on Q costs at least as much as u, and since no weight is negative, any path that detours through one of them can only cost the same or more. So no cheaper path to u can turn up later.

A negative weight breaks that argument: a detour could **reduce** the cost after u has already been finished, and the table would be wrong. For graphs with negative weights there are other algorithms, such as the Bellman-Ford algorithm that the lecture mentions. Dijkstra's algorithm is an example of a **single-source** shortest path algorithm.

## Dijkstra's algorithm in C++

Each Vertex gets `cost`, `parent` (a location, or −1 for nil) and `inQueue`. To keep the code short, Q is just the set of vertices whose `inQueue` is true, and "take the smallest off Q" scans them all for the smallest cost. (With a min-heap, from Part H, that step would be O(log V) instead of V.)

The file format adds a weight after each destination: `D 4 B 40 E 35 F 10 G 45` means D has 4 edges: to B with weight 40, to E with 35, and so on.

```cpp example="Dijkstra on the Lecture 17 graph" file="weighted.txt|7\nA B C D E F G\nA 2 D 20 G 75\nB 0\nC 2 E 5 G 25\nD 4 B 40 E 35 F 10 G 45\nE 1 G 10\nF 3 B 5 C 15 E 40\nG 0\n"
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

#define MAX_VERTICES 20
const int INF = 999999;          // stands for infinity

struct Edge {
	string destID;
	int weight;
	Edge * nextEdge;
};

struct Vertex {
	string ID;
	Edge * firstEdge;
	int cost;
	int parent;                  // location of the parent, -1 for nil
	bool inQueue;
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

void addEdge (Graph * g, string u, string v, int w) {
	int loc = findVertex (g, u);
	Edge * newEdge = new Edge;
	newEdge->destID = v;
	newEdge->weight = w;
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
		int numEdges, w;
		in >> u >> numEdges;
		for (int j = 0; j < numEdges; j++) {
			in >> v >> w;
			addEdge (g, u, v, w);
		}
	}
	in.close ();
	return g;
}

void dijkstra (Graph * g, int source) {
	for (int i = 0; i < g->numVertices; i++) {
		g->vertices[i].cost = INF;
		g->vertices[i].parent = -1;
		g->vertices[i].inQueue = true;
	}
	g->vertices[source].cost = 0;
	for (int round = 0; round < g->numVertices; round++) {
		int u = -1;                                  // u = extractMin (Q)
		for (int i = 0; i < g->numVertices; i++)
			if (g->vertices[i].inQueue && (u == -1 || g->vertices[i].cost < g->vertices[u].cost))
				u = i;
		g->vertices[u].inQueue = false;
		if (g->vertices[u].cost == INF)
			continue;                                // u cannot be reached at all
		for (Edge * e = g->vertices[u].firstEdge; e != NULL; e = e->nextEdge) {
			int v = findVertex (g, e->destID);
			int newCost = g->vertices[u].cost + e->weight;
			if (newCost < g->vertices[v].cost) {     // a cheaper path to v, through u
				g->vertices[v].cost = newCost;
				g->vertices[v].parent = u;
			}
		}
	}
}

void printPath (Graph * g, int v) {                  // the path from the source to v
	if (g->vertices[v].parent != -1) {
		printPath (g, g->vertices[v].parent);        // print the path to v's parent first
		cout << " -> ";
	}
	cout << g->vertices[v].ID;
}

int main() {
	Graph * g = readGraph ("weighted.txt");
	if (g == NULL)
		return 1;
	int source = findVertex (g, "A");
	dijkstra (g, source);
	for (int v = 0; v < g->numVertices; v++) {
		if (v == source)
			continue;
		cout << "Cost to " << g->vertices[v].ID << ": " << g->vertices[v].cost << ", Path: ";
		printPath (g, v);
		cout << endl;
	}
	return 0;
}
```

`printPath` uses the "work after the call" trick from lesson D1: it prints the path to the parent first, then the vertex itself, so the parents, which are found backwards, come out forwards.

Watch the same trace in the [Graph Lab](#lab-graph): choose Dijkstra, and the cost of each vertex is written above it as the algorithm runs.

:::remember
- Start: source cost 0, every other cost ∞, every parent nil.
- Take the **cheapest** vertex still on the queue. Its cost is now final.
- For each edge (u, v): if u.cost + weight < v.cost, then v.cost = u.cost + weight and v.parent = u.
- Path: follow parents back from the destination, then reverse.
:::

:::teachback
Explain one round of Dijkstra's algorithm, and how the finished parent table gives the shortest path to a vertex.
>> Take the vertex u with the smallest cost still in the queue; its cost is now final.
>> For each edge (u, v): if u.cost + weight < v.cost, set v.cost to that new cost and v.parent = u.
>> Repeat until the queue is empty (the weights must not be negative).
>> For a path, follow the parents back from the destination to the source, then read them in reverse.
:::

:::quiz
After A and D have been taken off the queue (and D's edges processed), what are the costs of B, E, F and G?
- [ ] B 40, E 35, F 10, G 45
- [x] B 60, E 55, F 30, G 65
- [ ] B 60, E 55, F 30, G 75
- [ ] B 35, E 50, F 30, G 60
>> Through D (cost 20): B = 20 + 40 = 60, E = 20 + 35 = 55, F = 20 + 10 = 30, and G = 20 + 45 = 65, which beats its old cost of 75.
:::

:::quiz
In the lecture's run, in which order are the vertices taken off the min-priority queue?
- [ ] A D G B E F C
- [ ] A B C D E F G
- [x] A D F B C E G
- [ ] A D F C B E G
>> Each time, the cheapest vertex left: A (0), D (20), F (30), B (35), C (45), E (50), G (60).
:::

:::quiz
A finished table has these parents: B ← nil (B is the source), C ← B, D ← F, E ← C, F ← E. What is the path from B to D?
- [ ] B → D
- [ ] D → F → E → C → B
- [x] B → C → E → F → D
- [ ] B → F → D
>> Follow parents back from D: D ← F ← E ← C ← B. Reversed, the path is B → C → E → F → D.
:::

:::quiz
Why does Dijkstra's algorithm require weights that are not negative?
- [ ] Negative numbers cannot be stored in the table
- [ ] The priority queue cannot hold negative keys
- [x] A vertex's cost is treated as final when it leaves the queue; a negative edge found later could still make it cheaper
- [ ] Paths with negative weights are always longer
>> The algorithm never revisits a finished vertex. With non-negative weights no later detour can be cheaper, but a negative weight could lower a cost after it was finalised, leaving a wrong answer.
:::
