#include <iostream>
#include <string>
using namespace std;

int main() {
	int n;
	cin >> n;
	int A[100];
	for (int i = 0; i < n; i++) cin >> A[i];
	int mx = A[0];
	for (int i = 1; i < n; i++) if (A[i] > mx) mx = A[i];
	cout << "max " << mx << endl;
	string word;
	cin >> word;
	char c;
	cin >> c;
	double d;
	cin >> d;
	cout << word << " " << c << " " << d << endl;
	cin.ignore(100, '\n');
	string line;
	getline(cin, line);
	cout << "line=[" << line << "]" << endl;
	int y;
	cin >> y;
	cout << "fail=" << cin.fail() << " y=" << y << endl;
	return 0;
}
