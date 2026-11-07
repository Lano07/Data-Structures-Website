#include <iostream>
using namespace std;

void printArray (int A[], int n) { for (int i = 0; i < n; i++) cout << A[i] << " "; cout << endl; }

void selectionSort (int A[], int n) {
	for (int i = 0; i < n - 1; i++) {
		int smallest = i;
		for (int j = i + 1; j < n; j++) if (A[j] < A[smallest]) smallest = j;
		int t = A[i]; A[i] = A[smallest]; A[smallest] = t;
	}
}
void insertionSort (int A[], int n) {
	for (int i = 1; i < n; i++) {
		int key = A[i]; int j = i - 1;
		while (j >= 0 && A[j] > key) { A[j + 1] = A[j]; j--; }
		A[j + 1] = key;
	}
}
void mergeArray (int A[], int p, int q, int r) {
	int n1 = q - p + 1, n2 = r - q;
	int * L = new int[n1], * R = new int[n2];
	for (int i = 0; i < n1; i++) L[i] = A[p + i];
	for (int j = 0; j < n2; j++) R[j] = A[q + 1 + j];
	int i = 0, j = 0, k = p;
	while (i < n1 && j < n2) { if (L[i] <= R[j]) A[k++] = L[i++]; else A[k++] = R[j++]; }
	while (i < n1) A[k++] = L[i++];
	while (j < n2) A[k++] = R[j++];
	delete [] L; delete [] R;
}
void mergeSort (int A[], int start, int end) {
	if (start < end) {
		int mid = (start + end) / 2;
		mergeSort (A, start, mid);
		mergeSort (A, mid + 1, end);
		mergeArray (A, start, mid, end);
	}
}
int partition (int A[], int p, int r) {
	int x = A[r]; int i = p - 1;
	for (int j = p; j < r; j++) if (A[j] <= x) { i++; int t = A[i]; A[i] = A[j]; A[j] = t; }
	int t = A[i + 1]; A[i + 1] = A[r]; A[r] = t;
	return i + 1;
}
void quickSort (int A[], int p, int r) { if (p < r) { int q = partition (A, p, r); quickSort (A, p, q - 1); quickSort (A, q + 1, r); } }

int main() {
	int a[] = {30, 65, 10, 75, 55, 90, 60};
	int b[] = {30, 65, 10, 75, 55, 90, 60};
	int c[] = {25, 90, 30, 5, 60, 70, 45};
	int d[] = {5, 2, 4, 6, 1, 3};
	partition (a, 0, 6); printArray (a, 7);
	partition (c, 0, 6); printArray (c, 7);
	quickSort (b, 0, 6); printArray (b, 7);
	mergeSort (d, 0, 5); printArray (d, 6);
	int e[] = {9, 8, 7, 6, 5, 4, 3, 2, 1, 0};
	selectionSort (e, 10); printArray (e, 10);
	int f[] = {3, 1, 2};
	insertionSort (f, 3); printArray (f, 3);
	return 0;
}
