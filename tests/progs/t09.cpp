#include <iostream>
#include <string>
using namespace std;
#define MAX_VERTICES 20

enum Colour {WHITE, GREY, BLACK};

struct Edge { string destID; int weight; Edge * nextEdge; };
struct Vertex { string ID; Edge * firstEdge; Colour colour; int cost; string parent; };
struct Graph { int numVertices; Vertex vertices[MAX_VERTICES]; };

struct QueueNode { int data; QueueNode * next; };
struct Queue { QueueNode * head; QueueNode * tail; };

Queue * initQueue () { Queue * q = new Queue; q->head = NULL; q->tail = NULL; return q; }
bool isEmptyQueue (Queue * q) { return q->head == NULL; }
void enqueue (Queue * q, int data) {
	QueueNode * n = new QueueNode; n->data = data; n->next = NULL;
	if (q->head == NULL) { q->head = n; q->tail = n; }
	else { q->tail->next = n; q->tail = n; }
}
int dequeue (Queue * q) {
	if (q->head == NULL) return -999;
	QueueNode * t = q->head; int d = t->data;
	q->head = q->head->next;
	if (q->head == NULL) q->tail = NULL;
	delete t;
	return d;
}

int indexOf (Graph * g, string id) {
	for (int i = 0; i < g->numVertices; i++) if (g->vertices[i].ID == id) return i;
	return -1;
}
void addVertex (Graph * g, string id) {
	g->vertices[g->numVertices].ID = id;
	g->vertices[g->numVertices].firstEdge = NULL;
	g->numVertices++;
}
void addEdge (Graph * g, string u, string v, int w) {
	int i = indexOf (g, u);
	Edge * e = new Edge; e->destID = v; e->weight = w; e->nextEdge = NULL;
	if (g->vertices[i].firstEdge == NULL) { g->vertices[i].firstEdge = e; return; }
	Edge * curr = g->vertices[i].firstEdge;
	while (curr->nextEdge != NULL) curr = curr->nextEdge;
	curr->nextEdge = e;
}

void BFS (Graph * g, string s) {
	for (int i = 0; i < g->numVertices; i++) g->vertices[i].colour = WHITE;
	Queue * q = initQueue ();
	int si = indexOf (g, s);
	g->vertices[si].colour = GREY;
	enqueue (q, si);
	while (!isEmptyQueue (q)) {
		int u = dequeue (q);
		cout << g->vertices[u].ID << " ";
		Edge * e = g->vertices[u].firstEdge;
		while (e != NULL) {
			int v = indexOf (g, e->destID);
			if (g->vertices[v].colour == WHITE) { g->vertices[v].colour = GREY; enqueue (q, v); }
			e = e->nextEdge;
		}
		g->vertices[u].colour = BLACK;
	}
	cout << endl;
	delete q;
}

void DFSVisit (Graph * g, int u) {
	g->vertices[u].colour = GREY;
	cout << g->vertices[u].ID << " ";
	for (Edge * e = g->vertices[u].firstEdge; e != NULL; e = e->nextEdge) {
		int v = indexOf (g, e->destID);
		if (g->vertices[v].colour == WHITE) DFSVisit (g, v);
	}
	g->vertices[u].colour = BLACK;
}

int main() {
	Graph * g = new Graph;
	g->numVertices = 0;
	string ids[] = {"A", "B", "C", "D", "E", "F", "G"};
	for (int i = 0; i < 7; i++) addVertex (g, ids[i]);
	addEdge (g, "A", "D", 20); addEdge (g, "A", "F", 30);
	addEdge (g, "D", "B", 15); addEdge (g, "D", "G", 40);
	addEdge (g, "F", "E", 25); addEdge (g, "B", "E", 10);
	addEdge (g, "G", "C", 5);
	BFS (g, "A");
	for (int i = 0; i < g->numVertices; i++) g->vertices[i].colour = WHITE;
	DFSVisit (g, 0);
	cout << endl;
	Colour c = GREY;
	cout << c << " " << (c == GREY) << endl;
	return 0;
}
