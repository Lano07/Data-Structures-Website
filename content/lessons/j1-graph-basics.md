---
title: Graph basics
summary: A graph is a set of vertices joined by edges. Edges can have a direction and a weight. A graph is stored either as an adjacency matrix (a table of which vertex connects to which) or as adjacency lists (one linked list of neighbours per vertex).
lectures: Lectures 15–17
goals:
  - Use the vocabulary - vertex, edge, directed, undirected, weighted, degree, path, strongly connected
  - Work out in-degrees, out-degrees and path lengths from a picture
  - Draw the adjacency matrix and adjacency lists of a graph
  - Choose between the two representations for a given question
labs: [graph]
---

## What is a graph?

From the lecture: a **graph** is a pair (V, E), where V is a finite set and E is a binary relation on V.

- Each element of V is a **vertex** (or node).
- Each element of E is an **edge**: a pair of vertices that are connected.

Trees and linked lists are special graphs. In a graph there is no root, no "first" node, and any vertex may connect to any other, including in a loop back to where you started.

Graphs model anything made of things and connections between them:

- **A friendship graph**: people are vertices, friendships are edges. It is **undirected**: if Bob is a friend of Sally, then Sally is a friend of Bob.
- **A road network**: towns are vertices, roads are edges, and the length of each road is the edge's **weight**.

## Directed and undirected

In an **undirected** graph, an edge {u, v} connects u and v both ways. In a **directed** graph, an edge (u, v) goes **from** u **to** v only, and is drawn as an arrow.

:::diagram graph und
An undirected graph (Lecture 16). The edge between C and D can be followed in either direction.
:::

:::diagram graph rep
A directed graph (Lecture 16). There is an edge from A to D, but no edge from D back to A.
:::

## Degree

For a **directed** graph, the lecture defines:

- the **in-degree** of a vertex: the number of edges entering it;
- the **out-degree**: the number of edges leaving it;
- the **degree**: in-degree + out-degree.

In the directed graph above:

| Vertex | Edges entering | In-degree | Edges leaving | Out-degree | Degree |
|---|---|---|---|---|---|
| A | none | 0 | A→D, A→G | 2 | 2 |
| D | A→D | 1 | D→B, D→E, D→F, D→G | 4 | 5 |
| G | A→G, C→G, D→G, E→G | 4 | none | 0 | 4 |

In an undirected graph, the degree of a vertex is simply the number of edges touching it. In the undirected graph above, D has degree 4 (C, E, F and G).

## Paths and connectivity

If you can get from vertex u to vertex v by following edges, there is a **path** from u to v. The **length** of the path is the number of edges in it.

In the directed graph: A → D → F → C is a path of length 3 from A to C. There is no path from B to anywhere: B has no edges leaving it.

A directed graph is **strongly connected** if there is a path between any two vertices, in both directions. The directed graph above is not: nothing can be reached from B or from G.

## Weighted graphs

In a **weighted** graph every edge carries a number, its weight: a distance, a cost or a time. This directed, weighted graph is used for Dijkstra's algorithm in lesson J4:

:::diagram graph dj
The weighted directed graph from Lectures 16 and 17. The edge from A to D has weight 20.
:::

## The adjacency matrix

An **adjacency matrix** is a table with one row and one column per vertex. The entry in row u, column v says whether there is an edge from u to v: 1 if there is, 0 if there is not. Here is the matrix for the undirected graph:

| | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| **A** | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| **B** | 1 | 0 | 1 | 0 | 0 | 0 | 0 |
| **C** | 0 | 1 | 0 | 1 | 1 | 0 | 0 |
| **D** | 0 | 0 | 1 | 0 | 1 | 1 | 1 |
| **E** | 0 | 0 | 1 | 1 | 0 | 1 | 0 |
| **F** | 0 | 0 | 0 | 1 | 1 | 0 | 0 |
| **G** | 0 | 0 | 0 | 1 | 0 | 0 | 0 |

Two things to notice:

- For an **undirected** graph the matrix is symmetric: row u, column v equals row v, column u, because each edge works both ways.
- Adding up a row gives that vertex's degree. Row D has four 1s.

For a **weighted** graph, the entry holds the weight. A missing edge is written ∞ (no way through), and the diagonal is 0 (it costs nothing to stay where you are). The first rows of the weighted graph's matrix:

| | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| **A** | 0 | ∞ | ∞ | 20 | ∞ | ∞ | 75 |
| **D** | ∞ | 40 | ∞ | 0 | 35 | 10 | 45 |
| **F** | ∞ | 5 | 15 | ∞ | 40 | 0 | ∞ |

## Adjacency lists

An **adjacency list** keeps, for every vertex, a linked list of the vertices its edges lead to. The lists for the directed graph above:

```text
[A] -> D -> G
[B] ->
[C] -> E -> G
[D] -> B -> E -> F -> G
[E] -> B -> G
[F] -> B -> C -> E
[G] ->
```

B and G have empty lists: no edges leave them. The length of a vertex's list is its out-degree.

The lecture asks "Where have I seen this before?" An array where each element holds the top of a linked list is exactly **hashing with chaining** (lesson I3), and the structure from Assignment 1. Lesson J2 builds it in C++.

## Which representation?

The lecture's two questions decide it:

| Question | Adjacency matrix | Adjacency list |
|---|---|---|
| Is there an edge from u to v? | look at one entry: O(1) | walk u's list: up to out-degree(u) steps |
| What are the edges leaving v? | scan v's whole row: V steps | walk v's list: exactly its edges |
| Memory | V × V entries, even with few edges | one entry per vertex plus one node per edge |

Most real graphs have far fewer edges than V × V (a town has a few roads, not roads to every other town), so adjacency lists save a lot of memory. BFS, DFS and Dijkstra all ask "what are the edges leaving v?" over and over, which is what lists do best.

:::remember
- Directed edge (u, v): from u to v only. Undirected: both ways.
- In-degree = edges entering, out-degree = edges leaving, degree = in + out.
- Path length = number of edges.
- Matrix: row u, column v. List: one linked list of destinations per vertex.
:::

:::teachback
Explain the difference between an adjacency list and an adjacency matrix, and when each one is the better choice.
>> A matrix is a V × V table: entry [u][v] says whether there is an edge from u to v (or holds its weight).
>> An adjacency list keeps, for each vertex, a linked list of the vertices its edges lead to.
>> A matrix answers "is there an edge from u to v?" in one step but always uses V × V space.
>> Lists use space only for the vertices and edges that exist, and are better for "which edges leave v?" and for graphs with few edges.
:::

:::quiz
In the directed graph above, what are the in-degree and out-degree of E?
- [ ] in-degree 2, out-degree 3
- [x] in-degree 3, out-degree 2
- [ ] in-degree 2, out-degree 2
- [ ] in-degree 5, out-degree 0
>> Edges entering E: C→E, D→E and F→E, so the in-degree is 3. Edges leaving E: E→B and E→G, so the out-degree is 2.
:::

:::quiz
In the undirected graph, what is the length of the shortest path from A to G?
- [ ] 2
- [ ] 3
- [x] 4
- [ ] 7
>> A–B–C–D–G uses 4 edges. A only connects to B, B only continues to C, and G only connects to D, so no shorter path exists.
:::

:::quiz
A graph has 1,000 vertices and 3,000 edges. Roughly how many entries does its adjacency matrix have?
- [ ] 3,000
- [ ] 4,000
- [x] 1,000,000
- [ ] 6,000
>> A matrix always has V × V entries: 1,000 × 1,000 = 1,000,000, almost all of them 0. Adjacency lists would need about 1,000 vertices plus 3,000 edge nodes.
:::

:::quiz
Which statement about an **undirected** graph's adjacency matrix is always true?
- [ ] Every entry on the diagonal is 1
- [x] The entry in row u, column v equals the entry in row v, column u
- [ ] Each row adds up to the same total
- [ ] It has fewer entries than the adjacency list
>> Every undirected edge works both ways, so it is recorded in both places: the matrix is symmetric. Row totals are the degrees, which can differ.
:::
