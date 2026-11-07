#include <iostream>
using namespace std;

struct MaxHeap {
	int A [1000];
	int size;
};

void maxHeapify (MaxHeap * heap, int i) {
	int left = i * 2;
	int right = i * 2 + 1;
	int largest = i;
	if (left <= heap->size && heap->A[left] > heap->A[largest]) largest = left;
	if (right <= heap->size && heap->A[right] > heap->A[largest]) largest = right;
	if (largest != i) {
		int temp = heap->A[i];
		heap->A[i] = heap->A[largest];
		heap->A[largest] = temp;
		maxHeapify (heap, largest);
	}
}

void buildMaxHeap (MaxHeap * heap) {
	for (int i = heap->size / 2; i >= 1; i--) maxHeapify (heap, i);
}

int heapExtractMax (MaxHeap * heap) {
	if (heap->size == 0) return -1;
	int max = heap->A[1];
	heap->A[1] = heap->A[heap->size];
	heap->size--;
	maxHeapify (heap, 1);
	return max;
}

void insertMaxHeap (MaxHeap * heap, int n) {
	heap->size++;
	int i = heap->size;
	heap->A[i] = n;
	while (i > 1 && heap->A[i / 2] < heap->A[i]) {
		int t = heap->A[i]; heap->A[i] = heap->A[i / 2]; heap->A[i / 2] = t;
		i = i / 2;
	}
}

const int N = 12;
int hashKey (int key) { return key % N + 1; }

int main() {
	int vals[] = {4, 1, 3, 2, 16, 9, 10, 14, 8, 7};
	MaxHeap * heap = new MaxHeap;
	heap->size = 0;
	for (int i = 0; i < 10; i++) heap->A[i + 1] = vals[i];
	heap->size = 10;
	buildMaxHeap (heap);
	for (int i = 1; i <= heap->size; i++) cout << heap->A[i] << " ";
	cout << endl;
	cout << heapExtractMax (heap) << " " << heapExtractMax (heap) << endl;
	insertMaxHeap (heap, 15);
	for (int i = 1; i <= heap->size; i++) cout << heap->A[i] << " ";
	cout << endl;
	delete heap;
	int table[N + 1];
	for (int i = 1; i <= N; i++) table[i] = 0;
	int keys[] = {52, 33, 84, 43, 16, 59, 31, 23, 61};
	for (int k = 0; k < 9; k++) {
		int loc = hashKey (keys[k]);
		while (table[loc] != 0) { loc++; if (loc > N) loc = 1; }
		table[loc] = keys[k];
	}
	for (int i = 1; i <= N; i++) { if (table[i] == 0) cout << "_ "; else cout << table[i] << " "; }
	cout << endl;
	return 0;
}
