#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
using namespace std;
// FILE data.txt
// 10 20 30
// 40 50
// FILE names.txt
// Alice 90
// Bob 75
// Cara 82

struct Student { string name; int mark; };

int main() {
	ifstream in;
	in.open("data.txt");
	if (!in.is_open()) { cout << "cannot open" << endl; return 1; }
	int x, total = 0, count = 0;
	in >> x;
	while (!in.eof()) { total += x; count++; in >> x; }
	cout << "eof loop: " << total << " " << count << endl;
	in.close();
	ifstream in2("data.txt");
	total = 0; count = 0;
	while (in2 >> x) { total += x; count++; }
	cout << "extract loop: " << total << " " << count << endl;
	ifstream f("names.txt");
	Student s[10];
	int n = 0;
	while (f >> s[n].name >> s[n].mark) n++;
	for (int i = 0; i < n; i++) cout << s[i].name << ":" << s[i].mark << " ";
	cout << endl;
	ifstream g("names.txt");
	string line;
	while (getline(g, line)) {
		istringstream ss(line);
		string nm; int mk;
		ss >> nm >> mk;
		cout << "[" << nm << "|" << mk * 2 << "]";
	}
	cout << endl;
	ifstream missing("nope.txt");
	if (!missing) cout << "missing ok" << endl;
	ofstream out("out.txt");
	out << "hello " << 42 << endl;
	out.close();
	ifstream back("out.txt");
	getline(back, line);
	cout << "read back: " << line << endl;
	stringstream st;
	st << 3.5 << " " << 7;
	double d; int k;
	st >> d >> k;
	cout << d + k << " " << st.str() << endl;
	return 0;
}
