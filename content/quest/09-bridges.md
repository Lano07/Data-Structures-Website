# world: graph
title: Bridges and Cables
place: Königsberg and the Caribbean Sea
when: 1736 · 1870s
topic: graphs
parts: j, n
scene: bridges
color: #41e0d0
fragment: The Cable Key
blurb: Graphs: terminology, adjacency matrices and lists, breadth-first and depth-first search, Dijkstra, Kruskal and Prim, Floyd's all-pairs algorithm and graph isomorphism.

## gr-1 | Seven bridges
goal: Use the words of graphs and see why Euler's bridges could not all be crossed once.
lessons: j1-graph-basics

@scene Königsberg, Prussia · 1736 (in the professor's journal)
@say narrator: Königsberg (today Kaliningrad, in Russia) was built on both banks of the river Pregel and on two islands, joined by seven bridges. Its people wondered: could you walk through the city crossing every bridge exactly once?
@say narrator: In 1736 the mathematician Leonhard Euler proved it was impossible, and in doing so invented a new kind of mathematics: **graph theory**.
@say prof: (journal) *Euler threw away everything but the land and the bridges: four dots and seven lines. The shape of the connections was all that mattered.*
@learn The words of graphs
A **graph** is a set of **vertices** (nodes) joined by **edges**.

| Word | Meaning |
|---|---|
| adjacent | two vertices joined by an edge |
| undirected / directed | edges go both ways / have a direction (u → v) |
| weighted | each edge has a number (a cost, distance or time) |
| degree | edges at a vertex; in a directed graph, **in-degree** (edges in) and **out-degree** (edges out) |
| path | a sequence of vertices, each joined to the next by an edge |
| simple path | a path that does not repeat a vertex |
| cycle | a path that starts and ends at the same vertex |
| connected | every vertex can reach every other (undirected) |

Euler's insight: a walk that crosses every edge exactly once (an **Euler path**) is only possible if **0 or 2** vertices have an **odd** degree (you must leave every vertex you enter, except at the start and the end). Königsberg's four land masses had degrees 5, 3, 3 and 3: all four odd. Impossible.
@match Match each word to its meaning.
directed graph = every edge has a direction, u → v
weighted graph = every edge carries a number, like a distance
in-degree = the number of edges coming into a vertex
cycle = a path that starts and ends at the same vertex
connected = every vertex can reach every other vertex
>> These are the words the exam uses. Degree in a directed graph splits into in-degree and out-degree.
@type spec="A->B; A->C; B->C; C->A; D->C" In this directed graph, what is the in-degree of C?
= 3
>> Edges into C: A → C, B → C and D → C. (Its out-degree is 1: C → A.)
@quiz Königsberg's land masses had degrees 5, 3, 3 and 3. Why was the walk impossible?
- [ ] There were too many bridges
- [x] More than two vertices had an odd degree
- [ ] The graph was not connected
- [ ] The graph had a cycle
>> A walk using every edge once needs 0 or 2 vertices of odd degree. Königsberg had 4.
@relic euler | Euler's 1736 paper | Euler presented his solution to the Academy in St. Petersburg in 1736, in a paper titled "Solutio problematis ad geometriam situs pertinentis" ("The solution of a problem relating to the geometry of position"). It is counted as the first paper of graph theory.
@journal
- A graph is vertices joined by edges: directed or undirected, weighted or not
- Degree; in-degree and out-degree for directed graphs; paths, simple paths, cycles, connected
- An Euler path (every edge once) needs 0 or 2 vertices of odd degree

## gr-2 | Charting the islands
goal: Store a graph as an adjacency matrix or adjacency lists, and know the trade-offs.
lessons: j2-graph-code

@scene The Kiskadee · back in the Caribbean, charting the islands
@say marco: The 1871 telegram: "Cable landed. Islands linked." In the 1870s they laid telegraph cables under the sea between the islands. The professor drew the network.
@say you: Then we need to store it. Two ways: a matrix, or lists.
@learn Adjacency matrix and adjacency lists
**Adjacency matrix**: a V × V table; `M[u][v]` is 1 (or the edge's weight) if there is an edge u → v, else 0 (or ∞ for a weighted graph). For an undirected graph the matrix is **symmetric**.

- Is there an edge u → v? **O(1)**: just look.
- Space: **O(V²)**, even when there are few edges.

**Adjacency lists**: for each vertex, a linked list of its neighbours. The lecture's structs:

```cpp
struct Edge {
	string destID;        // the vertex this edge leads to
	Edge * nextEdge;
};

struct Vertex {
	string ID;
	Edge * firstEdge;     // the top of this vertex's edge list
};

struct Graph {
	int numVertices;
	Vertex vertices[MAX_VERTICES];
};
```

- Space: **O(V + E)**: good for **sparse** graphs (few edges).
- Listing u's neighbours takes time proportional to how many it has; checking one particular edge means walking u's list.

A graph can also be read from a **file**: for example, one line per vertex with its neighbours: `A B F` means edges A → B and A → F.
@quiz spec="A B; A C; B C; C D" This undirected graph is stored as an adjacency matrix with rows and columns in the order A B C D. What is row C?
- [ ] 0 0 0 1
- [x] 1 1 0 1
- [ ] 1 1 1 1
- [ ] 0 1 0 1
>> C is adjacent to A, B and D (and not to itself): 1 1 0 1. Because the graph is undirected, column C is the same.
@quiz A graph has 1,000 vertices and 3,000 edges. Which representation uses far less memory?
- [ ] The adjacency matrix
- [x] Adjacency lists
- [ ] They use the same
- [ ] It depends on the weights
>> A matrix needs 1,000 × 1,000 = 1,000,000 entries; lists need about V + E = 4,000 entries (twice the edges if undirected). Sparse graphs suit lists.
@type A directed graph has 8 vertices. How many entries does its adjacency matrix have?
= 64
>> V × V = 8 × 8 = 64, whatever the number of edges.
@lab id="graph" preset='{"alg": "bfs", "spec": "A B\nA C\nB C\nC D", "directed": false, "weighted": false}'
Open the Graph Lab with this network, tick "Show adjacency list and matrix", then add your own islands and cables.
@journal
- Matrix: V × V, edge test O(1), space O(V²); symmetric for undirected graphs
- Lists: each vertex's neighbours in a linked list; space O(V + E): best for sparse graphs
- The lecture's Graph: an array of Vertex, each with the top of an Edge list (firstEdge, nextEdge)

## gr-3 | Exploring the caves
goal: Run breadth-first and depth-first search with the WHITE, GREY and BLACK colours.
lessons: j3-bfs-dfs

@scene Dominica · a cave system under the rainforest
@say marco: The cable station's records are in a cave network. Every chamber links to others.
@say you: Then we explore it properly. Breadth first, or depth first.
@learn BFS and DFS
Both searches colour the vertices: **WHITE** = not discovered yet, **GREY** = discovered but not finished, **BLACK** = finished. Neighbours are taken in **alphabetical order** (the order of the adjacency lists in the lectures).

**Breadth-first search (BFS)** uses a **queue**: it visits the start, then everything one edge away, then two edges away, and so on.

```text
colour every vertex WHITE
colour the source GREY; enqueue it
while the queue is not empty:
	u = dequeue; visit u
	for each neighbour v of u:
		if v is WHITE: colour v GREY; enqueue v
	colour u BLACK
```

**Depth-first search (DFS)** goes as **deep** as possible, then backs up. It is naturally **recursive** (the call stack is its stack):

```text
dfTraverse (u):
	colour u GREY; visit u
	for each neighbour v of u:
		if v is WHITE: dfTraverse (v)
	colour u BLACK
```

The lecture's depthFirstTraversal calls dfTraverse on every vertex that is still WHITE, so vertices the start cannot reach are visited too. Both searches take **O(V + E)** with adjacency lists.
@graph spec="A: D F G; B: A; C: B E; D: B E; E: B; F: E G; G: C" kind="bfs" start="A"
The Lecture 16 cave map (directed). Click the chambers in **BFS** order from A.
>> A, then its neighbours D F G, then the chambers they discover: B E (from D), C (from G).
@graph spec="A: D F G; B: A; C: B E; D: B E; E: B; F: E G; G: C" kind="dfs" start="A"
The same map. Now click the chambers in **DFS** order from A: always go deeper first.
>> A → D → B (B's only neighbour, A, is GREY) → back to D → E → back to A → F → G → C.
@quiz Which data structure does BFS use to decide what to visit next?
- [x] A queue
- [ ] A stack
- [ ] A priority queue
- [ ] A hash table
>> BFS is level by level, so it needs first in, first out: a queue. DFS uses a stack (usually the call stack, through recursion).
@code ex="graph-bfs"
Write breadth-first traversal.
@journal
- WHITE = undiscovered, GREY = discovered, BLACK = finished; neighbours in alphabetical order
- BFS uses a queue: visits by distance (number of edges) from the start
- DFS goes deep first (recursion = a stack); both are O(V + E) with adjacency lists

## gr-4 | The shortest crossing
goal: Find shortest paths with Dijkstra's algorithm.
lessons: j4-dijkstra

@scene Port of Spain · a storm is coming, and Silas has a head start
@say silas: (radio) I know where the last fragment is. The Pitch Lake, captain. I'll be there by morning. Can you sail faster than a man with a map?
@say marco: We can if we take the shortest route. Each line on the chart is hours of sailing.
@learn Dijkstra's shortest paths
**Dijkstra's algorithm** finds the cheapest path from a source to every vertex, when every weight is **0 or more**.

1. Every vertex starts with cost ∞, except the source (cost 0).
2. Repeatedly take the **unfinished vertex with the lowest cost** (a min-priority queue). Its cost is now **final**.
3. **Relax** each edge u → v leaving it: if `cost(u) + w(u, v) < cost(v)`, lower cost(v) and set parent(v) = u.
4. Stop when every reachable vertex is finished. Follow the parents back to read each path.

Why is a finished cost final? Every other unfinished vertex costs at least as much, and with no negative edges, going through it can only add more. That is exactly why **negative weights break Dijkstra**.

Cost: O(V²) with a simple array; O((V + E) log V) with a heap.
@graph spec="T G 9; T B 14; G V 6; G B 12; V B 7; V L 4; B L 8; L M 3; B M 11" kind="dijkstra" start="T"
Sail from Trinidad (T). Click the islands in the order Dijkstra **finalises** them (lowest cost first). G Grenada, V St Vincent, B Barbados, L St Lucia, M Martinique.
>> T 0, G 9, B 14, V 15, L 19, M 22. B is reached at 14 directly, cheaper than 9 + 12 through G.
@quiz Why must every edge weight be 0 or more for Dijkstra's algorithm?
- [ ] Negative numbers do not fit in the cost table
- [x] Once a vertex is finished its cost is never revisited, but a negative edge found later could make it cheaper
- [ ] The priority queue cannot store negative numbers
- [ ] It is only a convention
>> Dijkstra fixes the cheapest unfinished vertex for good. A later negative edge could have offered a cheaper route to it.
@type In the chart above, what is the cheapest cost from T to L?
= 19
>> T → G → V → L costs 9 + 6 + 4 = 19. Through B it would be 14 + 8 = 22.
@code ex="graph-dijkstra"
Write Dijkstra's algorithm.
@journal
- Dijkstra: take the cheapest unfinished vertex; its cost is final; relax its edges
- Relax: if cost(u) + w(u, v) < cost(v), update cost(v) and parent(v)
- Needs weights ≥ 0; O(V²) with an array, O((V + E) log V) with a heap

## gr-5 | Laying the cables
goal: Build a minimum spanning tree with Kruskal's and Prim's algorithms.
lessons: j5-mst

@scene The cable company's old map · a broken network
@say marco: The professor's note: "Relink the islands with the least cable, and the vault's map appears."
@learn Minimum spanning trees
A **spanning tree** of a connected, undirected graph uses **V − 1** edges to connect every vertex, with no cycles. A **minimum** spanning tree (MST) has the smallest total weight.

**Kruskal's algorithm**: sort the edges by weight, smallest first. Take each edge in turn: if its two ends are in **different trees**, add it (joining the trees); if they are already connected, **skip** it (it would make a cycle). Stop at V − 1 edges.

**Prim's algorithm**: grow one tree from a start vertex. Keep a **used** set; repeatedly add the **cheapest edge from a used vertex to an unused one**, and move that vertex to used.

Both give a minimum spanning tree (the same total cost; the edges can differ when weights tie). Kruskal thinks about edges, Prim about vertices.
@graph spec="T G 9; T B 14; G V 6; G B 12; V B 7; V L 4; B L 8; L M 3; B M 11" kind="kruskal"
**Kruskal**: click the cables in the order Kruskal adds them. Skip any cable that would close a loop.
>> L–M 3, V–L 4, G–V 6, V–B 7, then B–L 8 is skipped (B and L are already joined), then T–G 9. Total 29.
@graph spec="T G 9; T B 14; G V 6; G B 12; V B 7; V L 4; B L 8; L M 3; B M 11" kind="prim" start="T"
**Prim** from T: click the islands in the order they join the tree.
>> T, then G (9), V (6), L (4), B (7), M (3): the same total, 29.
@quiz A connected graph has 12 vertices. How many edges does any spanning tree of it have?
- [ ] 12
- [x] 11
- [ ] 66
- [ ] It depends on the weights
>> A tree on V vertices always has V − 1 edges.
@code ex="mst-kruskal"
Write Kruskal's algorithm.
@journal
- A spanning tree connects all V vertices with V − 1 edges and no cycle; an MST has the least total weight
- Kruskal: edges smallest first; add unless it joins two vertices already connected
- Prim: grow from a start; add the cheapest edge from used to unused

## gr-6 | Every route at once
goal: Compute all-pairs shortest paths with Floyd's algorithm and test graphs for isomorphism.
lessons: n2-floyd, n3-graph-isomorphism, j6-deep-graphs

@scene The cable map is complete · two old charts on the table
@say you: Two charts. One from the cable company, one from the professor. Different labels. Are they the same network?
@learn Floyd's algorithm and isomorphism (course outline)
**Floyd's algorithm** finds the shortest distance between **every pair** of vertices at once, on the weighted adjacency matrix (∞ where there is no edge, 0 on the diagonal):

```cpp
for (int k = 0; k < V; k++)
	for (int i = 0; i < V; i++)
		for (int j = 0; j < V; j++)
			if (dist[i][k] + dist[k][j] < dist[i][j])
				dist[i][j] = dist[i][k] + dist[k][j];
```

Pass k asks: "is it cheaper to go from i to j by stopping at k?" After pass k, every path may use vertices 0..k as stops. It runs in **O(V³)**, handles negative edges (but not negative cycles), and gives the whole table in one go.

**Isomorphism**: two graphs are **isomorphic** if one is the other with the vertices renamed: there is a one-to-one mapping of vertices such that u–v is an edge in the first exactly when map(u)–map(v) is an edge in the second.

To show two graphs are **not** isomorphic, find an **invariant** that differs: the number of vertices, the number of edges, the degree sequence (the degrees sorted), the number of cycles of a given length, connectedness. To show they **are**, give the mapping and check every edge.
@type spec="A->B 3; A->D 7; B->A 8; B->C 2; C->A 5; C->D 1; D->A 2" After Floyd's algorithm finishes on this graph, what is the shortest distance from D to C?
= 7
>> D's only edge goes to A (2); from A the cheapest way to C is A → B → C (3 + 2). Total 7.
@lab id="floyd"
Watch Floyd fill the table pass by pass, then type a graph of your own under "My own graph".
@quiz Graph 1: edges A–B, B–C, C–A, C–D. Graph 2: edges P–Q, Q–R, R–S, S–P. Are they isomorphic?
- [ ] Yes: both have 4 vertices and 4 edges
- [x] No: their degree sequences differ (3, 2, 2, 1 against 2, 2, 2, 2)
- [ ] Yes: both contain a cycle
- [ ] It cannot be decided
>> Same counts are not enough. Graph 1 has a vertex of degree 3 (C) and one of degree 1 (D); every vertex of graph 2 has degree 2. An isomorphism preserves degrees.
@code ex="outline-check-mapping"
Write the check: is this mapping an isomorphism?
@say narrator: You lay the two charts over each other: renamed, but the same network. Where the cable lines cross on both maps, the professor has drawn a tiny lake. Beside it: **LA BREA**.
@say marco: The Pitch Lake. Back home in Trinidad. The whole quest led us home, {name}.
@say you: But there's one more stop on the way. The telegram mentioned a census machine.
@boss
The Labyrinth: a maze of weighted edges. Only BFS, DFS and Dijkstra find the way out. Beat it with exam-style graph questions.
@journal
- Floyd: triple loop over k, i, j; dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]); O(V³), all pairs
- Isomorphic: a renaming that preserves every edge
- To disprove isomorphism, find a differing invariant: counts, degree sequence, cycles, connectedness
