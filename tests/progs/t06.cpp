#include <iostream>
using namespace std;
const int ROWS = 3;
#define COLS 4
int grid[ROWS][COLS];
int counter = 5;

void fill (int M[][COLS], int r) {
	for (int i = 0; i < r; i++)
		for (int j = 0; j < COLS; j++)
			M[i][j] = i * 10 + j;
}

void swapInts (int & a, int & b) { int t = a; a = b; b = t; }
void bump (int * p) { (*p)++; *p += 10; }
int sumArr (int A[], int n) { int s = 0; for (int i = 0; i < n; i++) s += A[i]; return s; }
int tally () { static int calls = 0; calls++; return calls; }

int main() {
	fill (grid, ROWS);
	for (int i = 0; i < ROWS; i++) { for (int j = 0; j < COLS; j++) cout << grid[i][j] << " "; cout << endl; }
	int B[2][3] = {{1, 2, 3}, {4, 5, 6}};
	int C[2][3] = {1, 2, 3, 4};
	int Z[5] = {0};
	cout << B[1][2] << " " << C[1][0] << C[1][1] << " " << Z[4] << endl;
	int a = 3, b = 9;
	swapInts (a, b);
	cout << a << " " << b << endl;
	bump (&a);
	cout << a << endl;
	int * p = &b;
	*p = 100;
	cout << b << " " << *p << endl;
	int D[] = {5, 6, 7, 8};
	cout << sumArr (D, 4) << " " << sizeof(D) / sizeof(int) << endl;
	int * q = D;
	q++;
	cout << *q << " " << *(q + 2) << " " << q[1] << " " << (q - D) << endl;
	tally (); tally ();
	cout << "tally " << tally () << " counter " << counter << endl;
	int * dyn = new int[5];
	for (int i = 0; i < 5; i++) dyn[i] = i * i;
	cout << dyn[4] << endl;
	delete [] dyn;
	int k = 5;
	k += k -= 3;
	cout << k << endl;
	int x = 7, y = 2;
	cout << x / y << " " << (double) x / y << " " << x % y << " " << (x > y ? x : y) << endl;
	unsigned int u = 0;
	u--;
	cout << u << endl;
	int big = 2147483647;
	big++;
	cout << big << endl;
	char ch = 'z';
	switch (ch) {
		case 'a': cout << "a"; break;
		case 'y': case 'z': cout << "y or z"; break;
		default: cout << "other";
	}
	cout << endl;
	int i = 0;
	do { i += 3; } while (i < 10);
	cout << i << endl;
	return 0;
}
