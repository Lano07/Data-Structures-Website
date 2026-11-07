#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

Node * createNode (int n) {
	Node * newNode;
	newNode = new Node;
	newNode->data = n;
	newNode->next = NULL;
	return newNode;
}

void printList (Node * top) {
	Node * curr = top;
	while (curr != NULL) {
		cout << curr->data << " ";
		curr = curr->next;
	}
	cout << endl;
}

Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}

int length (Node * top) {
	if (top == NULL) return 0;
	return 1 + length (top->next);
}

int main() {
	Node * top = NULL;
	for (int i = 1; i <= 5; i++)
		top = insertAtHead (top, i * 10);
	printList (top);
	cout << "Length: " << length (top) << endl;
	double avg = 0;
	Node * p = top;
	int sum = 0;
	while (p != NULL) { sum += p->data; p = p->next; }
	avg = (double) sum / length (top);
	cout << "Average: " << avg << endl;
	cout << 7 / 2 << " " << 7 % 3 << " " << -7 / 2 << " " << 1.0 / 3 << endl;
	while (top != NULL) { Node * t = top; top = top->next; delete t; }
	return 0;
}
