---
title: Floyd's algorithm (all-pairs shortest paths)
summary: Dijkstra finds the shortest paths from one source. Floyd's algorithm finds the shortest path between every pair of vertices at once, with three nested loops over the adjacency matrix: allow one more vertex as a stopping point each time round.
lectures: Course outline topic 7.3 (not yet in the notes); builds on Lectures 16–17
outline: true
goals:
  - Explain the difference between single-source (Dijkstra) and all-pairs (Floyd) shortest paths
  - Run Floyd's algorithm by hand on an adjacency matrix, one intermediate vertex at a time
  - Write floyd in C++ with a 2-D array, and recover a path from a via matrix
  - State its cost, O(V³) time and O(V²) space, and when it beats running Dijkstra V times
labs: [floyd, graph]
---

## One source, or every pair?

Lecture 17's Dijkstra algorithm answers: *what is the cheapest way from A to every other vertex?* It is a **single-source** shortest path algorithm, and the lecture mentions that there are others.

Sometimes you need the cheapest path between **every pair** of vertices: a table of driving times between all towns, or the delay between every pair of routers in a network. The course outline names **Floyd's algorithm** for this (it is also called the Floyd–Warshall algorithm).

Floyd works straight on the **weighted adjacency matrix** from Lecture 16, where `dist[i][j]` is the weight of edge (i, j), 0 on the diagonal, and ∞ where there is no edge.

## The idea: allow one more stopping point each round

Number the vertices 0 to V − 1. Floyd makes V passes over the matrix. After pass k, `dist[i][j]` holds the cost of the cheapest path from i to j that only **stops at** vertices 0 to k on the way (the start and end can be anything).

Pass k asks one question for every pair (i, j): *is it cheaper to go from i to k, then from k to j?*

```
if (dist[i][k] + dist[k][j] < dist[i][j])
	dist[i][j] = dist[i][k] + dist[k][j];
```

When all V passes are done, every vertex is allowed as a stopping point, so `dist[i][j]` is the true shortest distance.

Why can pass k use the matrix it is changing? Paths into and out of k never get shorter by going through k itself, so `dist[i][k]` and `dist[k][j]` do not change during pass k.

## Watching it work

Here is a small graph with four vertices:

```
edges:  A→B 3   A→D 7   B→A 8   B→C 2   C→A 5   C→D 1   D→A 2
```

The program prints the matrix before the first pass and after each pass. Watch the ∞ entries disappear and other entries shrink as more stopping points are allowed:

```cpp example="Floyd's algorithm, pass by pass"
#include <iostream>
using namespace std;

const int V = 4;
const int INF = 9999;                    // stands for infinity: no edge

void show (int dist[V][V], char name[]) {
	cout << "   ";
	for (int j = 0; j < V; j++)
		cout << " " << name[j] << "  ";
	cout << endl;
	for (int i = 0; i < V; i++) {
		cout << name[i] << "  ";
		for (int j = 0; j < V; j++) {
			if (dist[i][j] == INF)
				cout << " inf";
			else if (dist[i][j] < 10)
				cout << "   " << dist[i][j];
			else
				cout << "  " << dist[i][j];
		}
		cout << endl;
	}
}

int main () {
	char name[] = {'A', 'B', 'C', 'D'};
	int dist[V][V] = {
		{   0,   3, INF,   7 },
		{   8,   0,   2, INF },
		{   5, INF,   0,   1 },
		{   2, INF, INF,   0 }
	};
	cout << "Before any pass (direct edges only):" << endl;
	show (dist, name);
	for (int k = 0; k < V; k++) {
		for (int i = 0; i < V; i++)
			for (int j = 0; j < V; j++)
				if (dist[i][k] != INF && dist[k][j] != INF && dist[i][k] + dist[k][j] < dist[i][j])
					dist[i][j] = dist[i][k] + dist[k][j];
		cout << "After allowing stops at " << name[k] << ":" << endl;
		show (dist, name);
	}
	return 0;
}
```

:::trace
Pass A (k = A): B can now reach D through A: 8 + 7 = 15, better than ∞. C reaches B through A: 5 + 3 = 8. D reaches B through A: 2 + 3 = 5.
Pass B: A reaches C through B: 3 + 2 = 5. D reaches C through B: 5 + 2 = 7.
Pass C: A to D through C costs 5 + 1 = 6, better than the direct 7. B to A through C: 2 + 5 = 7 beats 8; B to D: 2 + 1 = 3 beats 15.
Pass D: B to A through D: 3 + 2 = 5. C to A: 1 + 2 = 3. C to B: 1 + 5 = 6. Done: every entry is now a shortest distance.
:::

## Floyd on the Lecture 17 graph, with paths

To print the paths and not just their costs, keep a second matrix: `via[i][j]` records the stopping point k that last improved `dist[i][j]` (or −1 if the best route is the direct edge). A path from i to j is then *the path from i to via[i][j], followed by the path from via[i][j] to j*: a recursive function prints it.

This is the weighted graph from Lectures 16 and 17. Row A of the answer matches Dijkstra's table from Lecture 17 exactly, and Floyd gives every other row as well:

```cpp example="Floyd on the Lecture 17 graph"
#include <iostream>
using namespace std;

const int V = 7;
const int INF = 9999;

void floyd (int dist[V][V], int via[V][V]) {
	for (int i = 0; i < V; i++)
		for (int j = 0; j < V; j++)
			via[i][j] = -1;
	for (int k = 0; k < V; k++)
		for (int i = 0; i < V; i++)
			for (int j = 0; j < V; j++)
				if (dist[i][k] != INF && dist[k][j] != INF && dist[i][k] + dist[k][j] < dist[i][j]) {
					dist[i][j] = dist[i][k] + dist[k][j];
					via[i][j] = k;
				}
}

// prints the vertices strictly between i and j on the shortest path
void printStops (int via[V][V], char name[], int i, int j) {
	int k = via[i][j];
	if (k == -1)
		return;
	printStops (via, name, i, k);
	cout << name[k] << " -> ";
	printStops (via, name, k, j);
}

int main () {
	char name[] = {'A', 'B', 'C', 'D', 'E', 'F', 'G'};
	int dist[V][V] = {
		{   0, INF, INF,  20, INF, INF,  75 },     // A
		{ INF,   0, INF, INF, INF, INF, INF },     // B
		{ INF, INF,   0, INF,   5, INF,  25 },     // C
		{ INF,  40, INF,   0,  35,  10,  45 },     // D
		{ INF, INF, INF, INF,   0, INF,  10 },     // E
		{ INF,   5,  15, INF,  40,   0, INF },     // F
		{ INF, INF, INF, INF, INF, INF,   0 }      // G
	};
	int via[V][V];
	floyd (dist, via);
	for (int j = 1; j < V; j++) {
		cout << "A to " << name[j] << ": cost " << dist[0][j] << ", path A -> ";
		printStops (via, name, 0, j);
		cout << name[j] << endl;
	}
	cout << "D to G: cost " << dist[3][6] << ", path D -> ";
	printStops (via, name, 3, 6);
	cout << "G" << endl;
	cout << "G to A: " << (dist[6][0] == INF ? "no path" : "a path") << endl;
	return 0;
}
```

The last line is a reminder that the graph is **directed**: no edges leave G, so G cannot reach anything.

:::quiz
After Floyd's algorithm finishes, what is dist[3][6] for the Lecture 17 graph (the cheapest way from D to G)?
- [ ] 45: the direct edge D → G
- [ ] 45: D → E → G (35 + 10)
- [x] 40: D → F → C → E → G (10 + 15 + 5 + 10)
- [ ] 50: D → F → C → G (10 + 15 + 25)
>> The direct edge and D → E → G both cost 45, and D → F → C → G costs 50. Going D → F → C → E → G costs 10 + 15 + 5 + 10 = 40, the cheapest. It is also why A → G costs 20 + 40 = 60 in Dijkstra's table.
:::

## How much does it cost?

The three loops each run V times, and the body is O(1), so Floyd takes **O(V³)** time. It needs the V × V matrix (and the via matrix): **O(V²)** space.

How does that compare with Dijkstra? With a plain array as the priority queue, Dijkstra from one source is O(V²), so running it from all V sources is also O(V³). Floyd is far shorter to write, and it also works when some edge weights are **negative**, as long as there is no cycle of negative total weight. Dijkstra assumes the weights are non-negative, as Lecture 17 says.

| | Dijkstra (Lecture 17) | Floyd |
|---|---|---|
| Answers | One source to every vertex | Every pair of vertices |
| Works on | Adjacency lists or matrix | The adjacency matrix |
| Time | O(V²) with an array | O(V³) |
| Negative weights | No | Yes, without negative cycles |

:::predict What does this print? (INF stands for no edge.)
```cpp
#include <iostream>
using namespace std;

const int INF = 9999;

int main () {
	int d[3][3] = {
		{   0,   4,  11 },
		{ INF,   0,   2 },
		{   3, INF,   0 }
	};
	for (int k = 0; k < 3; k++)
		for (int i = 0; i < 3; i++)
			for (int j = 0; j < 3; j++)
				if (d[i][k] != INF && d[k][j] != INF && d[i][k] + d[k][j] < d[i][j])
					d[i][j] = d[i][k] + d[k][j];
	cout << d[0][2] << " " << d[1][0] << " " << d[2][1] << endl;
	return 0;
}
```
:::

:::parsons Put the heart of Floyd's algorithm in order.
	for (int k = 0; k < V; k++)
		for (int i = 0; i < V; i++)
			for (int j = 0; j < V; j++)
				if (dist[i][k] != INF && dist[k][j] != INF && dist[i][k] + dist[k][j] < dist[i][j]) {
					dist[i][j] = dist[i][k] + dist[k][j];
					via[i][j] = k;
				}
~				if (dist[i][j] + dist[j][k] < dist[i][k]) {
:::

:::teachback
Explain what dist[i][j] means after pass k of Floyd's algorithm, and why the k loop must be the outermost loop.
>> After pass k, dist[i][j] is the cost of the cheapest path from i to j that only stops at vertices 0 to k on the way.
>> Pass k checks, for every pair, whether going through k is cheaper: dist[i][k] + dist[k][j] < dist[i][j].
>> k must be outermost because pass k relies on every pair already being correct for stops 0 to k − 1.
:::

:::remember
- All pairs: V passes; pass k lets paths stop at vertex k: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]).
- k outside, then i, then j. O(V³) time, O(V²) space.
- via[i][j] = k remembers the stop; print the path recursively.
- Handles negative weights (no negative cycles); Dijkstra does not.
:::
