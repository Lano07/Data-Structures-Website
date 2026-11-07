#include <iostream>
#include <cstdlib>
using namespace std;

struct BTNode {
	int data;
	BTNode * left;
	BTNode * right;
	BTNode * parent;
};

BTNode * createBTNode (int data) {
	BTNode * newNode = new BTNode;
	newNode->data = data;
	newNode->left = NULL;
	newNode->right = NULL;
	newNode->parent = NULL;
	return newNode;
}

BTNode * insertBST (BTNode * root, int key) {
	if (root == NULL) return createBTNode (key);
	if (key < root->data) {
		root->left = insertBST (root->left, key);
		root->left->parent = root;
	} else {
		root->right = insertBST (root->right, key);
		root->right->parent = root;
	}
	return root;
}

void inOrder (BTNode * root) {
	if (root == NULL) return;
	inOrder (root->left);
	cout << root->data << " ";
	inOrder (root->right);
}

BTNode * containsBST (BTNode * root, int key) {
	if (root == NULL) return NULL;
	if (root->data == key) return root;
	if (key < root->data) return containsBST (root->left, key);
	return containsBST (root->right, key);
}

BTNode * minBST (BTNode * root) { while (root->left != NULL) root = root->left; return root; }

BTNode * inOrderSuccessor (BTNode * node) {
	if (node->right != NULL) return minBST (node->right);
	BTNode * p = node->parent;
	while (p != NULL && node == p->right) { node = p; p = p->parent; }
	return p;
}

int height (BTNode * root) {
	if (root == NULL) return -1;
	int l = height (root->left), r = height (root->right);
	return 1 + (l > r ? l : r);
}

void destroy (BTNode * root) { if (root == NULL) return; destroy (root->left); destroy (root->right); delete root; }

int main() {
	int keys[] = {20, 17, 30, 5, 18, 25, 40, 10, 41};
	BTNode * root = NULL;
	for (int i = 0; i < 9; i++) root = insertBST (root, keys[i]);
	inOrder (root);
	cout << endl << "height " << height (root) << endl;
	BTNode * n = containsBST (root, 18);
	cout << "succ of 18: " << inOrderSuccessor (n)->data << endl;
	BTNode * m = containsBST (root, 10);
	cout << "succ of 10: " << inOrderSuccessor (m)->data << endl;
	cout << "find 99: " << (containsBST (root, 99) == NULL ? "none" : "found") << endl;
	srand (42);
	cout << rand () % 100 << " " << rand () % 100 << " " << rand () << endl;
	srand (1);
	cout << rand () << endl;
	destroy (root);
	return 0;
}
