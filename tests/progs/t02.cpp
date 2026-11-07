#include <iostream>
#include <iomanip>
#include <cmath>
#include <string>
using namespace std;

int main() {
	double vals[] = {0, 1, -1, 0.5, 1.5, 2.5, 3.14159265358979, 100000, 1000000, 123456789, 0.0001, 0.00001, 1e20, 1.0/3, 2.0/3, 1e-10, 123.456, 99.995, 0.1+0.2, -0.0};
	int n = sizeof(vals) / sizeof(vals[0]);
	for (int i = 0; i < n; i++) cout << vals[i] << " ";
	cout << endl;
	cout << setprecision(10);
	for (int i = 0; i < n; i++) cout << vals[i] << " ";
	cout << endl;
	cout << fixed << setprecision(2);
	for (int i = 0; i < n; i++) cout << vals[i] << " ";
	cout << endl;
	cout << setprecision(0) << 0.5 << " " << 1.5 << " " << 2.5 << " " << 3.5 << endl;
	cout << setprecision(3) << 2.675 << " " << 1.0005 << " " << 0.0625 << endl;
	cout << setw(8) << 3.14159 << "|" << left << setw(8) << 42 << "|" << right << setw(6) << "ab" << "|" << endl;
	cout << setfill('0') << setw(5) << 42 << setfill(' ') << endl;
	float f = 0.1f;
	cout << setprecision(6) << f << " " << f * 3 << endl;
	cout.precision(4);
	cout << sqrt(2.0) << " " << pow(2, 10) << " " << abs(-5) << " " << fabs(-2.5) << endl;
	cout << to_string(3.5) << " " << to_string(42) << " " << to_string(-7) << endl;
	return 0;
}
