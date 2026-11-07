---
title: Graph isomorphism
summary: Two graphs are isomorphic when they are the same graph with the vertices renamed. Invariants such as the number of edges and the degree sequence can prove that two graphs are different; proving that they are the same needs a renaming that maps every edge onto an edge.
lectures: Course outline topic 7.5 (not yet in the notes); builds on Lecture 16
outline: true
goals:
  - Define when two graphs are isomorphic, using a one-to-one mapping of the vertices
  - Use invariants (vertices, edges, degree sequence, triangles) to show two graphs are not isomorphic
  - Check a proposed mapping with two adjacency matrices in O(V²) time
  - Search for a mapping with recursion and explain why the search can take V! steps
labs: [graph]
---

## The same graph, drawn differently

Lecture 16 defines a graph as a pair (V, E): a set of vertices and a set of edges. The *picture* of a graph is not part of it. These two drawings are the same graph:

```
 1 ---- 2            a ---- c
 |      |             \    /
 |      |               ><
 |      |             /    \
 4 ---- 3            b ---- d
```

Both are a cycle of four vertices. Rename 1 → a, 2 → c, 3 → b, 4 → d and every edge on the left becomes an edge on the right: 1–2 becomes a–c, 2–3 becomes c–b, 3–4 becomes b–d, and 4–1 becomes d–a.

**Definition.** Graphs G1 and G2 are **isomorphic** if there is a one-to-one correspondence f from the vertices of G1 to the vertices of G2 such that **(u, v) is an edge of G1 exactly when (f(u), f(v)) is an edge of G2**. The mapping f is called an **isomorphism**.

"Exactly when" matters both ways: edges must map to edges, and non-edges to non-edges.

## Invariants: quick ways to prove "not isomorphic"

Renaming vertices cannot change anything that does not depend on the names. These **invariants** must be equal in isomorphic graphs:

- the number of vertices and the number of edges;
- the **degree sequence**: the list of vertex degrees, sorted (Lecture 16: the degree of a vertex is the number of edges at it);
- for directed graphs, the in-degrees and out-degrees;
- whether the graph is connected, and the number of triangles (cycles of length 3).

If **any** invariant differs, the graphs are **not** isomorphic. But if they all match, that proves nothing yet: two graphs can share a degree sequence and still be different. A cycle of 6 vertices and two separate triangles both have six vertices of degree 2, but one is connected and the other is not.

:::quiz
Graph P has degree sequence 1, 2, 2, 3, 4 and graph Q has degree sequence 2, 2, 2, 3, 3. Both have 5 vertices and 6 edges. What can you conclude?
- [ ] They are isomorphic: same number of vertices and edges
- [x] They are not isomorphic: their degree sequences differ
- [ ] Nothing until you try every renaming
- [ ] They are isomorphic if both are connected
>> A renaming keeps every vertex's degree, so isomorphic graphs have the same sorted degree sequence. These sequences differ, so no isomorphism exists. (Both sum to 12, which is twice the 6 edges, so the edge counts agree, but that is not enough.)
:::

## Checking a mapping with adjacency matrices

With adjacency matrices M1 and M2 (Lecture 16), a proposed mapping is stored as an array: `f[u]` is the vertex of G2 that vertex u of G1 is renamed to. It is an isomorphism when `M1[u][v] == M2[f[u]][f[v]]` for **every** pair u, v. That is V² comparisons: O(V²).

```cpp example="Checking a proposed isomorphism"
#include <iostream>
using namespace std;

const int V = 4;

bool checkMapping (int M1[V][V], int M2[V][V], int f[]) {
	for (int u = 0; u < V; u++)
		for (int v = 0; v < V; v++)
			if (M1[u][v] != M2[f[u]][f[v]])
				return false;
	return true;
}

int main () {
	// G1: the square 1-2, 2-3, 3-4, 4-1 (vertices 1 to 4 stored as 0 to 3)
	int M1[V][V] = {
		{0, 1, 0, 1},
		{1, 0, 1, 0},
		{0, 1, 0, 1},
		{1, 0, 1, 0}
	};
	// G2: a-c, c-b, b-d, d-a (a, b, c, d stored as 0 to 3)
	int M2[V][V] = {
		{0, 0, 1, 1},
		{0, 0, 1, 1},
		{1, 1, 0, 0},
		{1, 1, 0, 0}
	};
	int good[] = {0, 2, 1, 3};             // 1 -> a, 2 -> c, 3 -> b, 4 -> d
	int bad[] = {0, 1, 2, 3};              // 1 -> a, 2 -> b, 3 -> c, 4 -> d
	cout << "1->a 2->c 3->b 4->d: " << (checkMapping (M1, M2, good) ? "isomorphism" : "not an isomorphism") << endl;
	cout << "1->a 2->b 3->c 4->d: " << (checkMapping (M1, M2, bad) ? "isomorphism" : "not an isomorphism") << endl;
	return 0;
}
```

The second mapping fails at the first edge: 1–2 would have to become a–b, and there is no edge a–b.

## Searching for an isomorphism

To prove two graphs **are** isomorphic you must produce a mapping. With no cleverness, try them all: give vertex 0 each possible partner, then vertex 1 each unused partner, and so on. That is a recursive search, and there are V! complete mappings (120 for 5 vertices, 3,628,800 for 10).

A simple improvement prunes early: when vertex u gets partner x, check right away that u's edges to the vertices **already** mapped match x's edges to their partners. A bad start is abandoned before it grows.

Three graphs with 5 vertices and 6 edges, all with degree sequence 2, 2, 2, 3, 3:

- **G1**: the cycle 0–1–2–3–4–0 plus the chord 0–2 (it has one triangle, 0–1–2);
- **G2**: G1 with its vertices renamed;
- **G3**: every vertex of {0, 1} joined to every vertex of {2, 3, 4} (it has no triangle at all).

```cpp example="A recursive search for an isomorphism"
#include <iostream>
using namespace std;

const int V = 5;

int f[V];                                  // f[u]: the partner of vertex u
bool used[V];                              // used[x]: x already has a partner
int tries;

// try to give partners to vertices u, u + 1, ..., V - 1
bool search (int A[V][V], int B[V][V], int u) {
	if (u == V)
		return true;                        // every vertex has a partner
	for (int x = 0; x < V; x++) {
		if (used[x])
			continue;
		tries++;
		bool ok = true;
		for (int w = 0; w < u; w++)          // compare with the vertices already mapped
			if (A[u][w] != B[x][f[w]])
				ok = false;
		if (ok) {
			f[u] = x;
			used[x] = true;
			if (search (A, B, u + 1))
				return true;
			used[x] = false;                 // undo, and try the next partner
		}
	}
	return false;
}

void report (int A[V][V], int B[V][V], char label[]) {
	for (int x = 0; x < V; x++)
		used[x] = false;
	tries = 0;
	cout << label << ": ";
	if (search (A, B, 0)) {
		cout << "isomorphic, f =";
		for (int u = 0; u < V; u++)
			cout << " " << u << "->" << f[u];
	} else
		cout << "not isomorphic";
	cout << " (" << tries << " partners tried)" << endl;
}

int main () {
	int G1[V][V] = {
		{0, 1, 1, 0, 1},
		{1, 0, 1, 0, 0},
		{1, 1, 0, 1, 0},
		{0, 0, 1, 0, 1},
		{1, 0, 0, 1, 0}
	};
	int G2[V][V] = {
		{0, 0, 0, 1, 1},
		{0, 0, 1, 0, 1},
		{0, 1, 0, 1, 0},
		{1, 0, 1, 0, 1},
		{1, 1, 0, 1, 0}
	};
	int G3[V][V] = {
		{0, 0, 1, 1, 1},
		{0, 0, 1, 1, 1},
		{1, 1, 0, 0, 0},
		{1, 1, 0, 0, 0},
		{1, 1, 0, 0, 0}
	};
	char l12[] = "G1 and G2";
	char l13[] = "G1 and G3";
	report (G1, G2, l12);
	report (G1, G3, l13);
	return 0;
}
```

G1 and G3 pass every *counting* test (5 vertices, 6 edges, the same degree sequence), yet no mapping exists: G1 has a triangle and G3 does not. The search has to run out of options to prove it.

**How hard is this in general?** No one knows an algorithm that decides graph isomorphism quickly (in polynomial time) for every pair of graphs, and no one has proved that it is impossible either. In practice, invariants plus a pruned search like this one work well.

:::predict What does this print?
```cpp
#include <iostream>
using namespace std;

int main () {
	int M[4][4] = {
		{0, 1, 1, 1},
		{1, 0, 0, 0},
		{1, 0, 0, 1},
		{1, 0, 1, 0}
	};
	for (int i = 0; i < 4; i++) {
		int deg = 0;
		for (int j = 0; j < 4; j++)
			deg = deg + M[i][j];
		cout << deg << " ";
	}
	cout << endl;
	return 0;
}
```
:::

:::parsons Put checkMapping in order.
bool checkMapping (int M1[V][V], int M2[V][V], int f[]) {
	for (int u = 0; u < V; u++)
		for (int v = 0; v < V; v++)
			if (M1[u][v] != M2[f[u]][f[v]])
				return false;
	return true;
}
~			if (M1[u][v] != M2[u][v])
:::

:::teachback
Explain why equal degree sequences do not prove that two graphs are isomorphic, but different degree sequences do prove that they are not.
>> An isomorphism only renames vertices, so each vertex keeps its degree; isomorphic graphs must have the same sorted degree sequence.
>> So different degree sequences mean no isomorphism can exist.
>> But the degrees do not say how the vertices are joined: a 6-cycle and two triangles both have six vertices of degree 2, yet one is connected and the other is not.
:::

:::remember
- Isomorphic: a one-to-one renaming f with (u, v) an edge exactly when (f(u), f(v)) is an edge.
- Invariants (vertices, edges, degree sequence, triangles, connected) can only prove "not isomorphic".
- Check a mapping: M1[u][v] == M2[f[u]][f[v]] for all u, v: O(V²).
- Find a mapping: recursive search with pruning; up to V! mappings.
:::
