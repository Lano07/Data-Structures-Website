#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

int main() {
	// Try changing this program, then press Run or Step through.
	Node * top = createNode (10);
	top->next = createNode (20);
	top->next->next = createNode (30);

	int total = 0;
	for (Node * curr = top; curr != NULL; curr = curr->next)
		total = total + curr->data;
	cout << "Total: " << total << endl;
	return 0;
}
