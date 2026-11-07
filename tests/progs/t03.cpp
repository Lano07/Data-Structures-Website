#include <iostream>
#include <string>
using namespace std;

int main() {
	string s = "Hello, World";
	cout << s.length() << " " << s.size() << " " << s.substr(7) << " " << s.substr(0, 5) << endl;
	cout << s.find("World") << " " << s.find('o') << " " << s.find('o', 5) << " " << s.rfind('o') << endl;
	if (s.find("xyz") == string::npos) cout << "not found" << endl;
	string t = s;
	t[0] = 'J';
	t += "!";
	t += '?';
	cout << t << " " << s << endl;
	string u = s + " and " + t;
	cout << u << endl;
	cout << (s < t) << (s == "Hello, World") << (s != t) << endl;
	for (int i = 0; i < (int) s.length(); i++) if (s[i] >= 'a' && s[i] <= 'z') s[i] = s[i] - 32;
	cout << s << endl;
	char c = 'A';
	c++;
	cout << c << " " << (int) c << " " << c + 1 << " " << (char) (c + 1) << endl;
	string w;
	w.push_back('x');
	w.append("yz");
	w.insert(0, ">>");
	cout << w << " " << w.empty() << " " << string().empty() << endl;
	w.erase(0, 2);
	cout << w << " " << w.at(1) << " " << w.front() << w.back() << endl;
	string num = "123";
	cout << stoi(num) + 1 << " " << stod("2.5") * 2 << endl;
	char name[20] = "Bob";
	cout << name << " " << name[0] << endl;
	bool b = true;
	cout << b << " " << boolalpha << b << " " << false << endl;
	return 0;
}
