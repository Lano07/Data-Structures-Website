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

Node * insertAtHead (Node * top, int n) {
	Node * newNode = createNode (n);
	newNode->next = top;
	return newNode;
}

int main() {
	Node * top = NULL;
	top = insertAtHead (top, 30);
	top = insertAtHead (top, 20);
	top = insertAtHead (top, 10);
	Node * curr = top;
	while (curr != NULL) {
		cout << curr->data << " ";
		curr = curr->next;
	}
	cout << endl;
	return 0;
}
