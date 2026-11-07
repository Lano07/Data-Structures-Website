---
title: Minimum spanning trees
summary: A minimum-cost spanning tree connects every vertex of a connected, undirected, weighted graph using the cheapest possible set of edges, with no cycles. Kruskal's algorithm adds the cheapest edges that join separate trees; Prim's algorithm grows one tree from a start vertex.
lectures: Lecture 19
goals:
  - Define a minimum-cost spanning tree and say how many edges it has
  - Run Kruskal's algorithm by sorting the edges and skipping any edge that would make a cycle
  - Run Prim's algorithm with the used and unused sets
  - Get the lecture's answers, including the minimum cost of 53
  - Write both algorithms in C++
labs: [graph]
---

## What is a minimum-cost spanning tree?

From the lecture: a **minimum-cost spanning tree** (MST) is a subset of the edges of a **connected, undirected, edge-weighted** graph that

- connects all the vertices together,
- without any cycles,
- with the minimum possible total edge weight.

It is the most economical way to connect a set of vertices: think of laying cable between towns, where each edge is a possible cable and its weight is the cost.

A spanning tree of a graph with n vertices has precisely **n − 1 edges**. Fewer, and some vertex would be left out; more, and there would be a cycle (a cycle always contains an edge you could remove while keeping everything connected).

## Kruskal's algorithm

From the lecture:

1. For each vertex v, create a tree consisting of v only.
2. Sort the edges by non-decreasing weight (smallest first).
3. For each edge (u, v) in that order: if u and v belong to **different trees**, connect them with the edge (u, v).

An edge whose two ends are already in the same tree is skipped: adding it would make a cycle.

:::diagram graph k1
Kruskal's example from Lecture 19, with edges (A,B,1), (D,E,2), (B,C,3), (C,D,4), (A,E,5), (A,C,7), (A,D,10).
:::

| Edge (sorted) | Trees before | Same tree? | Action |
|---|---|---|---|
| (A, B, 1) | {A} {B} {C} {D} {E} | no | **add** → {A,B} {C} {D} {E} |
| (D, E, 2) | {A,B} {C} {D} {E} | no | **add** → {A,B} {C} {D,E} |
| (B, C, 3) | {A,B} {C} {D,E} | no | **add** → {A,B,C} {D,E} |
| (C, D, 4) | {A,B,C} {D,E} | no | **add** → {A,B,C,D,E} |
| (A, E, 5) | one tree | yes | skip: A–E would close a cycle |
| (A, C, 7) | one tree | yes | skip |
| (A, D, 10) | one tree | yes | skip |

The MST is {(A,B), (D,E), (B,C), (C,D)}: 4 edges for 5 vertices, total weight 1 + 2 + 3 + 4 = **10**. Once n − 1 edges have been added, every remaining edge will be skipped, so you may stop there.

Kruskal's algorithm grows **many small trees** at once, which merge into one. At the start of the table above, (D, E) was added even though neither end touched the A–B tree.

## Prim's algorithm

Prim's algorithm grows **one** tree, starting from one vertex. It keeps two sets:

- **Used** vertices: already in the tree.
- **Unused** vertices: not yet in the tree.

At each step, pick the **cheapest edge with one end in used and the other in unused**. Add that edge to the tree and move its unused end into the used set. Stop when unused is empty.

:::diagram graph p1
Prim's example from Lecture 19. Edges: (B,D,5), (A,B,6), (C,F,9), (E,F,10), (B,C,11), (F,G,12), (A,G,15), (C,D,17), (D,E,22), (C,G,25).
:::

Starting from A:

| Used | Edges from used to unused | Cheapest | Set of edges |
|---|---|---|---|
| {A} | A–B 6, A–G 15 | **(A B 6)** | (A B 6) |
| {A, B} | A–G 15, B–C 11, B–D 5 | **(B D 5)** | + (B D 5) |
| {A, B, D} | A–G 15, B–C 11, C–D 17, D–E 22 | **(B C 11)** | + (B C 11) |
| {A, B, C, D} | A–G 15, C–F 9, C–G 25, D–E 22 | **(C F 9)** | + (C F 9) |
| {A, B, C, D, F} | A–G 15, C–G 25, D–E 22, E–F 10, F–G 12 | **(F E 10)** | + (F E 10) |
| {A, B, C, D, E, F} | A–G 15, C–G 25, F–G 12 | **(F G 12)** | + (F G 12) |
| {A, B, C, D, E, F, G} | unused is empty | | done |

Minimum cost = 6 + 5 + 11 + 9 + 10 + 12 = **53**, with 6 edges for 7 vertices.

Notice that a cheap edge is not taken until one of its ends is in the tree: C–F (9) is cheaper than B–C (11), but it could not be chosen until C was used.

:::tip
Kruskal on the same graph gives the same tree. Sorted edges: B–D 5, A–B 6, C–F 9, E–F 10, B–C 11, F–G 12 are all added (each joins two different trees), giving the same total of 53. When all the weights are different, the MST is unique, so both algorithms must find it.
:::

## Kruskal or Prim?

| | Kruskal | Prim |
|---|---|---|
| Starts with | every vertex as its own tree | one start vertex |
| Each step | the cheapest edge overall that joins two different trees | the cheapest edge leaving the tree |
| Main work | sorting the edges | finding the cheapest edge out of the used set |
| In between | a forest of separate trees | always one connected tree |

## Both algorithms in C++

The graph is stored as a list of edges, which is what Kruskal needs anyway. Vertices are the letters A to G, so a vertex's number is `letter - 'A'`.

Kruskal keeps `tree[v]`, the number of the tree that v belongs to. At the start, `tree[v] = v` (every vertex is its own tree). Joining two trees relabels every vertex of one tree with the other tree's number.

Prim keeps `used[v]`, and on each step scans every edge for the cheapest one with exactly one end used.

```cpp example="Kruskal and Prim (Lecture 19)"
#include <iostream>
using namespace std;

struct WEdge {
	char u;
	char v;
	int weight;
};

void sortEdges (WEdge edges[], int m) {          // insertion sort by weight
	for (int i = 1; i < m; i++) {
		WEdge key = edges[i];
		int j = i - 1;
		while (j >= 0 && edges[j].weight > key.weight) {
			edges[j + 1] = edges[j];
			j--;
		}
		edges[j + 1] = key;
	}
}

void kruskal (WEdge edges[], int m, int n) {
	int tree[26];
	for (int v = 0; v < n; v++)
		tree[v] = v;                                // each vertex is its own tree
	sortEdges (edges, m);
	int total = 0;
	for (int i = 0; i < m; i++) {
		int a = edges[i].u - 'A';
		int b = edges[i].v - 'A';
		if (tree[a] != tree[b]) {                   // different trees: connect them
			cout << "(" << edges[i].u << ", " << edges[i].v << ", " << edges[i].weight << ") ";
			total = total + edges[i].weight;
			int oldTree = tree[b];
			for (int v = 0; v < n; v++)
				if (tree[v] == oldTree)
					tree[v] = tree[a];
		}
	}
	cout << endl << "Kruskal minimum cost = " << total << endl;
}

void prim (WEdge edges[], int m, int n, char start) {
	bool used[26];
	for (int v = 0; v < n; v++)
		used[v] = false;
	used[start - 'A'] = true;
	int total = 0;
	for (int step = 1; step < n; step++) {          // n - 1 edges to add
		int best = -1;
		for (int i = 0; i < m; i++) {
			bool uUsed = used[edges[i].u - 'A'];
			bool vUsed = used[edges[i].v - 'A'];
			if (uUsed != vUsed)                     // one end used, the other unused
				if (best == -1 || edges[i].weight < edges[best].weight)
					best = i;
		}
		if (best == -1)
			break;                                  // the graph is not connected
		char from = edges[best].u, to = edges[best].v;
		if (used[to - 'A']) {                       // write the edge as (used end, new end)
			from = edges[best].v;
			to = edges[best].u;
		}
		cout << "(" << from << " " << to << " " << edges[best].weight << ") ";
		total = total + edges[best].weight;
		used[to - 'A'] = true;
	}
	cout << endl << "Prim minimum cost = " << total << endl;
}

int main() {
	WEdge k1[] = {{'A','B',1}, {'D','E',2}, {'B','C',3}, {'C','D',4}, {'A','E',5}, {'A','C',7}, {'A','D',10}};
	kruskal (k1, 7, 5);

	WEdge p1[] = {{'B','D',5}, {'A','B',6}, {'C','F',9}, {'E','F',10}, {'B','C',11},
	              {'F','G',12}, {'A','G',15}, {'C','D',17}, {'D','E',22}, {'C','G',25}};
	prim (p1, 10, 7, 'A');
	kruskal (p1, 10, 7);
	return 0;
}
```

Run both algorithms step by step on these graphs in the [Graph Lab](#lab-graph). Kruskal dims each skipped edge; Prim shows the used set growing.

:::remember
- An MST of n vertices has exactly **n − 1** edges and no cycles.
- **Kruskal**: sort all edges; add each one whose ends are in different trees; skip the rest.
- **Prim**: from a start vertex, keep adding the cheapest edge from a used vertex to an unused one.
- Lecture answers: Kruskal example total 10; Prim example minimum cost **53**.
:::

:::teachback
Explain how Kruskal's algorithm and Prim's algorithm each build a minimum-cost spanning tree.
>> Both add cheap edges without ever making a cycle, and finish with n - 1 edges for n vertices.
>> Kruskal sorts all the edges and adds an edge only when its two ends are in different trees, joining those trees.
>> Prim starts from one vertex and repeatedly adds the cheapest edge from a used vertex to an unused one.
>> Kruskal grows several trees that join up; Prim always grows a single tree.
:::

:::quiz
A connected graph has 9 vertices and 20 edges. How many edges are in its minimum-cost spanning tree?
- [ ] 9
- [x] 8
- [ ] 20
- [ ] 19
>> A spanning tree of n vertices always has n − 1 edges, whatever the number of edges in the graph: 9 − 1 = 8.
:::

:::quiz
In Kruskal's example, why is the edge (A, E, 5) not added?
- [ ] Its weight is too large
- [ ] E has already been used twice
- [x] After (C, D, 4), A and E are already in the same tree, so (A, E) would make a cycle
- [ ] Kruskal only uses edges that touch A once
>> By then the tree is A–B–C–D–E. A and E are connected already, so adding A–E would close the cycle A–B–C–D–E–A.
:::

:::quiz
In Prim's example starting from A, the used set is {A, B, D}. Which edge is added next?
- [ ] (C F 9)
- [ ] (A G 15)
- [x] (B C 11)
- [ ] (D E 22)
>> Only edges from {A, B, D} to an unused vertex count: A–G 15, B–C 11, C–D 17 and D–E 22. The cheapest is B–C (11). C–F (9) does not touch the used set yet.
:::

:::quiz
Which statement is true?
- [ ] Prim's algorithm sorts all the edges first
- [ ] Kruskal's algorithm always keeps a single connected tree
- [x] Kruskal's algorithm may build several separate trees that later join
- [ ] Both algorithms need a start vertex
>> Kruskal starts with every vertex as its own tree and joins trees as it adds edges, so in between there can be several trees. Prim grows one tree from a start vertex and does not sort.
:::
