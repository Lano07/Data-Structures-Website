---
title: Pointers to structs
summary: A pointer can hold the address of a whole struct. To reach a field through the pointer, use the arrow `->`. Knowing when to use `.` and when to use `->` is half of linked list and tree code.
lectures: Lecture 1
goals:
  - Choose correctly between `.` and `->`
  - Explain that `p->field` means `(*p).field`
  - Allocate a struct with new and fill in its fields
labs: [memory]
---

## A struct variable and a struct pointer

The lecture starts from the Account struct from COMP 1602:

```cpp norun
struct Account {
	int accNumber;
	char accType;
	double balance;
};
```

A **normal variable** holds the fields themselves. You reach a field with a dot:

```cpp norun
Account account;
account.balance = 250.75;
```

A **pointer** holds only the address of an Account. To reach a field through it, use the arrow:

```cpp norun
Account * ma;
ma = new Account;
ma->balance = 501.50;
```

## . versus ->

| You have | Write | Meaning |
|---|---|---|
| a struct (`Account account;`) | `account.balance` | the balance field of this struct |
| a pointer (`Account * ma;`) | `ma->balance` | the balance field of the struct **ma points to** |

`ma->balance` is shorthand for `(*ma).balance`: follow the pointer, then take the field. The brackets are needed, because `*ma.balance` would mean `*(ma.balance)`, which is wrong.

```cpp memory caption="account is a struct on the stack. ma is a pointer on the stack; the Account it points to is on the heap."
#include <iostream>
using namespace std;

struct Account {
	int accNumber;
	char accType;
	double balance;
};

int main() {
	Account account;
	account.accNumber = 1001;
	account.accType = 'S';
	account.balance = 250.75;

	Account * ma;
	ma = new Account;
	ma->accNumber = 2002;
	ma->accType = 'C';
	(*ma).balance = account.balance * 2;
	cout << ma->accNumber << " " << ma->accType << " " << ma->balance << endl;
	delete ma;
	return 0;
}
```

## The runner tells you which one you need

If you use the wrong one, the error message says which to use. Try it:

```cpp error
#include <iostream>
using namespace std;

struct Node {
	int data;
	Node * next;
};

int main() {
	Node * p = new Node;
	p.data = 5;
	return 0;
}
```

Change `p.data` to `p->data` and run it again.

## Chains of arrows

In linked lists you will often see several arrows in a row, such as `top->next->data`. Read from left to right: `top->next` is a pointer (the address of the second node), so `->data` follows it and takes the data of the second node. Every arrow follows one pointer.

:::remember
- `->` only after a **pointer**. `.` only after a **struct**.
- After `p = new Node;`, every field holds garbage until you assign it.
- `p->next->data` is only safe if both `p` and `p->next` are not NULL.
:::

:::teachback
Explain step by step what `p->balance = 100;` does when `p` points to an Account struct, and why `p.balance` would not compile.
>> `p` holds the address of an Account.
>> `->` follows that address to the Account and then selects its `balance` field; it means `(*p).balance`.
>> So the Account's balance becomes 100.
>> `p.balance` is wrong because the dot needs a struct, and `p` is a pointer.
:::

:::quiz
`Node * p` points to a node. Which expression means the same as `p->next`?
- [ ] `*p.next`
- [x] `(*p).next`
- [ ] `*(p.next)`
- [ ] `&p.next`
>> `p->next` follows p and then takes the next field: `(*p).next`. Without brackets, `*p.next` is read as `*(p.next)`, which is an error because p is not a struct.
:::

:::quiz
What does this print?
```cpp check
#include <iostream>
using namespace std;

struct Point { int x; int y; };

int main() {
	Point a;
	a.x = 1;
	a.y = 2;
	Point * p = &a;
	p->x = p->y + 10;
	Point b = a;
	b.y = 99;
	cout << a.x << " " << a.y << " " << b.x << endl;
	return 0;
}
```
- [x] `12 2 12`
- [ ] `12 99 12`
- [ ] `1 2 12`
- [ ] `12 2 1`
>> p points to a, so `p->x = p->y + 10;` sets a.x to 12. `Point b = a;` copies every field into a separate struct, so changing b.y does not change a.
:::
