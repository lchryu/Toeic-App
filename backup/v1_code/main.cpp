#include <bits/stdc++.h>

#define FOR(i, a, b) for (int i = a; i <= b; i++)
#define all(x) x.begin(), x.end()
#define ll long long
#define X first
#define Y second

using namespace std;

int power(int base, int exponent) {
    if (exponent == 0) return 1;
    int result = power(base, exponent / 2);
    if (exponent % 2 == 0) return (result * result) % 10;
    else return (result * result * base) % 10;
}
int main() {
    int a, b; cin >> a >> b;
    cout << power(a, b) << endl;
}