---
title: Deep dive: graphs, searches and greedy algorithms, proved
summary: Why does breadth-first search find shortest paths? Why is Dijkstra's greedy choice safe, and why do negative edges break it? Why do Kruskal and Prim always build a minimum spanning tree? This deep dive gives the counting facts, the invariants and the proofs behind Lectures 16, 17 and 19, plus the exam traps that catch most students.
lectures: Lectures 15–17, 19 (deep dive)
goals:
  - Use the handshake lemma and edge counts to reason about degrees and choose a representation
  - Explain the WHITE/GREY/BLACK invariant and why BFS and DFS are O(V + E)
  - Prove that BFS visits vertices in order of distance, and when DFS finds a cycle
  - Explain why Dijkstra's greedy choice is correct with non-negative weights, and break it with a negative edge
  - Justify Kruskal's and Prim's algorithms with the cut property, and tell a spanning tree from a shortest-path tree
labs: [graph, floyd]
---

## Counting facts you can use

Lecture 16: a graph is a pair (V, E). In a **directed** graph, a vertex has an **in-degree** (edges entering it) and an **out-degree** (edges leaving it), and its degree is their sum. In an **undirected** graph, the degree is the number of edges touching the vertex.

:::theorem The handshake lemma
In an undirected graph, the degrees add up to 2|E|. In a directed graph, the in-degrees add up to |E|, and so do the out-degrees.
:::

:::proof
An undirected edge (u, v) adds 1 to the degree of u and 1 to the degree of v: 2 per edge. A directed edge adds 1 to one out-degree and 1 to one in-degree.
:::

Two consequences come up in exams. An undirected graph always has an **even number of vertices with odd degree**, because the total is even. And a graph can have at most V(V − 1)/2 undirected edges, or V(V − 1) directed ones (no self-loops). A graph with close to that many edges is **dense**; one with far fewer is **sparse**.

| | Adjacency matrix | Adjacency list (Lecture 16's Graph struct) |
|---|---|---|
| Memory | O(V²) | O(V + E) |
| Is there an edge (u, v)? | O(1): look at one cell | O(degree of u): scan u's list |
| List the edges leaving v | O(V): scan the whole row | O(degree of v) |
| Best for | Dense graphs, frequent edge tests | Sparse graphs, traversals |

These are Lecture 16's two questions: *What are the edges leaving vertex v?* and *Is there an edge from vertex u to vertex v?* Each representation makes one of them cheap.

## The colour invariant and the O(V + E) bound

:::invariant WHITE, GREY, BLACK (Lectures 16–17)
**WHITE**: not discovered yet. **GREY**: discovered, but its edges are not all explored (in BFS, it is in the queue). **BLACK**: all of its edges have been explored. A vertex only ever changes WHITE → GREY → BLACK.
:::

:::theorem BFS and DFS are O(V + E) with adjacency lists
Each vertex turns GREY at most once, so it is enqueued (BFS) or gets a recursive call (DFS) at most once: O(V). Each vertex's adjacency list is scanned once, when it is processed, and the lists hold E entries in total: O(E).
:::

:::trap Mark when you enqueue, not when you dequeue
BFS colours a vertex GREY **as it is enqueued** (Lecture 16's `if colour == WHITE: colour = GREY; enqueue`). If it is only marked when dequeued, a vertex reachable from several queued vertices is enqueued several times, which repeats work and breaks the O(V + E) bound.
:::

## BFS finds shortest paths (counting edges)

:::theorem BFS visits vertices in order of distance
BFS dequeues all vertices at distance d from the source before any vertex at distance d + 1. The path through each vertex's discoverer (its BFS-tree parent) is a path with the fewest possible edges.
:::

:::proof
By induction on d. The queue starts with the source alone (distance 0). Suppose the queue holds the vertices at distance d, in some order, followed only by vertices at distance d + 1. Dequeuing a distance-d vertex can only enqueue WHITE neighbours, and they are at distance d + 1: no less, or they would already have been discovered; no more, since they are one edge away. So the queue keeps its shape: distance d, then distance d + 1. The first time a vertex is reached is therefore along a shortest path.
:::

So BFS answers *what is the fewest number of edges from A to every vertex?* in O(V + E) time. Dijkstra is only needed when the edges have **weights**.

```cpp example="BFS order and distances on Lecture 16's graph"
#include <iostream>
using namespace std;

const int V = 7;

int main () {
	char name[] = {'A', 'B', 'C', 'D', 'E', 'F', 'G'};
	// Lecture 16's directed graph, neighbours in alphabetical order (-1 ends a list)
	int adj[V][4] = {
		{3, 5, 6, -1},     // A: D F G
		{0, -1},           // B: A
		{1, 4, -1},        // C: B E
		{1, 4, -1},        // D: B E
		{1, -1},           // E: B
		{4, 6, -1},        // F: E G
		{2, -1}            // G: C
	};
	int dist[V];
	bool grey[V];
	for (int v = 0; v < V; v++) {
		dist[v] = -1;
		grey[v] = false;
	}
	int queue[V], front = 0, rear = 0;
	queue[rear++] = 0;                     // enqueue the source A
	grey[0] = true;
	dist[0] = 0;
	cout << "BFS order:";
	while (front < rear) {
		int u = queue[front++];            // dequeue
		cout << " " << name[u];
		for (int k = 0; adj[u][k] != -1; k++) {
			int v = adj[u][k];
			if (!grey[v]) {                // WHITE: discover it now
				grey[v] = true;
				dist[v] = dist[u] + 1;
				queue[rear++] = v;
			}
		}
	}
	cout << endl << "edges from A:";
	for (int v = 0; v < V; v++)
		cout << " " << name[v] << "=" << dist[v];
	int outSum = 0, inSum = 0, inDeg[V] = {0, 0, 0, 0, 0, 0, 0};
	for (int u = 0; u < V; u++)
		for (int k = 0; adj[u][k] != -1; k++) {
			outSum++;
			inDeg[adj[u][k]]++;
		}
	for (int v = 0; v < V; v++)
		inSum = inSum + inDeg[v];
	cout << endl << "sum of out-degrees " << outSum << ", sum of in-degrees " << inSum << endl;
	return 0;
}
```

The order matches the slides: A D F G B E C. Both degree sums are 12, the number of edges, as the handshake lemma says.

## DFS and cycles

DFS (Lecture 16) recurses into the first WHITE neighbour before looking at the others: it uses the **call stack** where BFS uses a queue. `depthFirstTraversal` loops over **every** vertex and starts a new search from each one still WHITE, so it covers graphs that are not connected (or not reachable from one source).

:::theorem A grey neighbour means a cycle
In a directed graph, if DFS at vertex u finds an edge u → v where v is **GREY**, the graph has a cycle.
:::

:::proof
The GREY vertices are exactly the ones whose recursive calls are still running: the path of calls from the start down to u. So v is an ancestor of u on that path, there is a path v → … → u, and the edge u → v closes it into a cycle.
:::

## Dijkstra: why the greedy choice is safe

Lecture 17 repeatedly takes the vertex with the smallest current cost off the min-priority queue and relaxes its edges: if cost[u] + w(u, v) < cost[v], update cost[v] and parent[v].

:::theorem Dijkstra's invariant (non-negative weights)
When a vertex u is taken off the queue, cost[u] is the length of the shortest path from the source to u, and it never changes again.
:::

:::proof
Suppose u is the first vertex taken off with a cost that is too high, and look at a truly shortest path to u. That path leaves the set of finished vertices somewhere: let y be the first vertex on it that is not finished, and x the finished vertex before it. When x was finished, the edge x → y was relaxed, so cost[y] ≤ the true distance to y. The rest of the path from y to u has weight ≥ 0, so the true distance to y ≤ the true distance to u < cost[u]. Then cost[y] < cost[u], and the queue would have chosen y, not u. That contradicts the choice, so no such u exists.
:::

The proof used "the rest of the path has weight ≥ 0". With a negative edge that step fails, and so does the algorithm. Lecture 17 notes that Dijkstra *assumes that the edge weights are non-negative*.

:::example Breaking Dijkstra with one negative edge
Edges: A → B (2), A → C (3), C → B (−2). Dijkstra takes A off (cost 0), sets B = 2 and C = 3, and takes B off next with cost 2, which it treats as final. But A → C → B costs 3 + (−2) = 1. Floyd's algorithm (Part N) handles negative edges as long as there is no negative cycle.
:::

**Cost:** with a plain array as the queue, Dijkstra is V extractions of O(V) each, plus E relaxations: **O(V²)**. With the binary min-heap of Lecture 14 it becomes O((V + E) log V), which is faster for sparse graphs.

## Kruskal and Prim: the cut property

Lecture 19: a minimum-cost spanning tree connects all V vertices without cycles at the least total weight, and has exactly **V − 1 edges**. That is true of every tree: start from V separate vertices; each edge that does not make a cycle joins two pieces into one; V − 1 edges are needed to reach a single piece.

:::theorem The cut property
Split the vertices into two groups (a **cut**). If edge e is the lightest edge with one end in each group, then e belongs to a minimum spanning tree.
:::

:::proof
Take an MST T that does not contain e = (u, v). Adding e to T makes a cycle, and that cycle must cross the cut at least twice: once along e, and once along some other edge f. Swap them: T − f + e is still a spanning tree, and since w(e) ≤ w(f), it costs no more than T. So it is also an MST, and it contains e.
:::

- **Kruskal** looks at the edges in increasing order and takes an edge when its ends are in **different trees**. That edge is the lightest one crossing the cut between its tree and the rest, so the cut property says it is safe. Edges whose ends are in the same tree would make a cycle and are skipped. Sorting costs **O(E log E)**.
- **Prim** grows one tree from a start vertex and always takes the lightest edge from a **used** vertex to an **unused** one: the lightest edge across the cut (used, unused), so it is safe. With arrays it is **O(V²)**.

If all the weights are different, the MST is **unique**, so Kruskal and Prim must find the same tree. Both of Lecture 19's examples check out: Kruskal's costs 1 + 2 + 3 + 4 = 10, and Prim's costs 53.

:::trap A minimum spanning tree is not a shortest-path tree
Triangle A–B (1), B–C (1), A–C (1.5). The MST is {A–B, B–C}, with cost 2. But the shortest path from A to C is the direct edge (1.5 < 1 + 1), so Dijkstra's tree from A is {A–B, A–C}, with cost 2.5. An MST minimises the **total** weight; Dijkstra minimises the path **from one source** to each vertex.
:::

:::quiz
An undirected graph has 9 vertices with degrees 3, 3, 2, 2, 2, 4, 4, 1, x. Which value of x is possible?
- [ ] 2
- [x] 1
- [ ] 4
- [ ] 6
>> The degrees must add up to 2|E|, an even number. 3 + 3 + 2 + 2 + 2 + 4 + 4 + 1 = 21, so x must be odd. Of the options, only 1 is odd.
:::

:::quiz
In Dijkstra's algorithm with non-negative weights, vertex u has just been taken off the min-priority queue with cost 35. What can you conclude?
- [ ] cost[u] may still drop when its neighbours are processed
- [x] 35 is the shortest distance from the source to u, and it will not change
- [ ] Every vertex still in the queue has cost at most 35
- [ ] u has no edges with weight less than 35
>> That is Dijkstra's invariant: a vertex taken off the queue is finished. Every vertex still in the queue has cost ≥ 35 (not ≤), because the queue always gives the smallest.
:::

:::predict What does this print? (Kruskal's order on Lecture 19's first example.)
```cpp
#include <iostream>
using namespace std;

int comp[5];

int findRoot (int v) {
	while (comp[v] != v)
		v = comp[v];
	return v;
}

int main () {
	char name[] = {'A', 'B', 'C', 'D', 'E'};
	// edges already sorted by weight: (A,B,1) (D,E,2) (B,C,3) (C,D,4) (A,E,5) (A,C,7) (A,D,10)
	int u[] = {0, 3, 1, 2, 0, 0, 0};
	int v[] = {1, 4, 2, 3, 4, 2, 3};
	int w[] = {1, 2, 3, 4, 5, 7, 10};
	for (int i = 0; i < 5; i++)
		comp[i] = i;
	int total = 0, taken = 0;
	for (int e = 0; e < 7; e++) {
		int ru = findRoot (u[e]), rv = findRoot (v[e]);
		if (ru != rv) {
			comp[ru] = rv;
			total = total + w[e];
			taken++;
			cout << "take (" << name[u[e]] << ", " << name[v[e]] << ", " << w[e] << ")" << endl;
		} else
			cout << "skip (" << name[u[e]] << ", " << name[v[e]] << ", " << w[e] << "): cycle" << endl;
	}
	cout << taken << " edges, total " << total << endl;
	return 0;
}
```
:::

:::teachback
Explain why Dijkstra's algorithm can treat a vertex's cost as final when it leaves the queue, and exactly where a negative edge breaks the argument.
>> The queue gives the unfinished vertex u with the smallest cost. Any other path to u must leave the finished vertices through some unfinished vertex y with cost[y] ≥ cost[u].
>> With non-negative weights, the rest of that path cannot make it shorter, so no path beats cost[u].
>> A negative edge could make the rest of the path reduce the total, so a path through a vertex with a larger cost could end up cheaper.
:::

:::remember
- Handshake: Σ degrees = 2|E| (undirected); Σ in = Σ out = |E| (directed). Matrix O(V²) memory, list O(V + E).
- Colours: WHITE → GREY (discovered) → BLACK (done); mark GREY on enqueue. BFS and DFS: O(V + E).
- BFS visits in order of distance: shortest paths in edges. DFS: an edge to a GREY vertex means a cycle (directed).
- Dijkstra: a vertex taken off the queue is final if no weight is negative; O(V²) with arrays.
- Cut property → Kruskal (O(E log E)) and Prim (O(V²)) are correct; an MST has V − 1 edges; MST ≠ shortest-path tree.
:::
