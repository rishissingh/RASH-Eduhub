/**
 * Code Arena - 5 Standard DSA Challenges Data & Seed Definition
 */

const CODE_CHALLENGES_SEED = [
  {
    id: "CA001",
    code_id: "CA001",
    title: "Two Sum",
    difficulty: "Easy",
    topic: ["Array", "Hashing"],
    category: "Array · Hashing",
    constraints: [
      "2 <= n <= 100000",
      "-1000000000 <= arr[i] <= 1000000000",
      "-2000000000 <= target <= 2000000000",
      "Exactly one valid pair exists"
    ],
    description: "Given an array of integers and a target value, find the indices of two distinct elements whose sum equals the target. Return the indices in increasing order. Exactly one valid pair exists.",
    input_format: "First line: n. Second line: n integers. Third line: target.",
    output_format: "Print the two zero-based indices in increasing order.",
    sample_test_cases: [
      { input: "4\n2 7 11 15\n9", output: "0 1" },
      { input: "3\n3 2 4\n6", output: "1 2" }
    ],
    hidden_test_cases: [
      { input: "2\n3 3\n6", output: "0 1" },
      { input: "5\n1 5 9 3 12\n21", output: "2 4" },
      { input: "4\n0 4 3 0\n0", output: "0 3" },
      { input: "6\n-5 -2 7 11 4 8\n3", output: "0 5" },
      { input: "5\n1000000000 -1000000000 4 6 8\n0", output: "0 1" }
    ],
    starter_code: {
      python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    
    seen = {}
    for i, val in enumerate(arr):
        diff = target - val
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[val] = i

if __name__ == '__main__':
    solve()`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    const target = parseInt(input[n + 1], 10);

    const map = new Map();
    for (let i = 0; i < n; i++) {
        const diff = target - arr[i];
        if (map.has(diff)) {
            console.log(\`\${map.get(diff)} \${i}\`);
            return;
        }
        map.set(arr[i], i);
    }
}

solve();`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int target = sc.nextInt();

        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < n; i++) {
            int diff = target - arr[i];
            if (map.containsKey(diff)) {
                System.out.println(map.get(diff) + " " + i);
                return;
            }
            map.put(arr[i], i);
        }
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int target;
    cin >> target;

    unordered_map<int, int> mp;
    for (int i = 0; i < n; i++) {
        int diff = target - arr[i];
        if (mp.count(diff)) {
            cout << mp[diff] << " " << i << "\\n";
            return 0;
        }
        mp[arr[i]] = i;
    }
    return 0;
}`
    },
    supported_languages: ["python", "java", "cpp", "javascript"],
    points: 100
  },

  {
    id: "CA002",
    code_id: "CA002",
    title: "Binary Search",
    difficulty: "Easy",
    topic: ["Array", "Binary Search"],
    category: "Array · Binary Search",
    constraints: [
      "1 <= n <= 100000",
      "-1000000000 <= arr[i] <= 1000000000",
      "Array is sorted in strictly increasing order"
    ],
    description: "Given a sorted array of distinct integers and a target, return the zero-based index of the target. If the target is absent, return -1.",
    input_format: "First line: n. Second line: n sorted integers. Third line: target.",
    output_format: "Print the zero-based index or -1.",
    sample_test_cases: [
      { input: "5\n1 3 5 7 9\n7", output: "3" },
      { input: "5\n1 3 5 7 9\n4", output: "-1" }
    ],
    hidden_test_cases: [
      { input: "1\n42\n42", output: "0" },
      { input: "1\n42\n10", output: "-1" },
      { input: "6\n-20 -10 0 10 20 30\n-20", output: "0" },
      { input: "6\n-20 -10 0 10 20 30\n30", output: "5" },
      { input: "8\n2 4 6 8 10 12 14 16\n12", output: "5" }
    ],
    starter_code: {
      python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]
    target = int(input_data[n+1])
    
    left, right = 0, n - 1
    ans = -1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            ans = mid
            break
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    print(ans)

if __name__ == '__main__':
    solve()`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    const target = parseInt(input[n + 1], 10);

    let left = 0, right = n - 1;
    let ans = -1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            ans = mid;
            break;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    console.log(ans);
}

solve();`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextInt();
        int target = sc.nextInt();

        int left = 0, right = n - 1;
        int ans = -1;
        while (left <= right) {
            int mid = left + (right - left) / 2;
            if (arr[mid] == target) {
                ans = mid;
                break;
            } else if (arr[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        System.out.println(ans);
    }
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    int target;
    cin >> target;

    int left = 0, right = n - 1;
    int ans = -1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            ans = mid;
            break;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    cout << ans << "\\n";
    return 0;
}`
    },
    supported_languages: ["python", "java", "cpp", "javascript"],
    points: 100
  },

  {
    id: "CA003",
    code_id: "CA003",
    title: "Maximum Subarray Sum",
    difficulty: "Medium",
    topic: ["Array", "Dynamic Programming", "Kadane Algorithm"],
    category: "Array · Dynamic Programming",
    constraints: [
      "1 <= n <= 200000",
      "-1000000000 <= arr[i] <= 1000000000"
    ],
    description: "Find the maximum sum of any non-empty contiguous subarray. The array can contain positive, negative, and zero values.",
    input_format: "First line: n. Second line: n integers.",
    output_format: "Print the maximum sum of a non-empty contiguous subarray.",
    sample_test_cases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6" },
      { input: "5\n1 2 3 4 5", output: "15" }
    ],
    hidden_test_cases: [
      { input: "4\n-8 -3 -6 -2", output: "-2" },
      { input: "5\n-1 -2 0 -4 -5", output: "0" },
      { input: "5\n5 -2 3 4 -1", output: "10" },
      { input: "6\n-2 -3 4 -1 -2 5", output: "6" },
      { input: "3\n1000000000 1000000000 1000000000", output: "3000000000" }
    ],
    starter_code: {
      python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]
    
    max_so_far = arr[0]
    curr_max = arr[0]
    for i in range(1, n):
        curr_max = max(arr[i], curr_max + arr[i])
        max_so_far = max(max_so_far, curr_max)
    print(max_so_far)

if __name__ == '__main__':
    solve()`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 2) return;
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);

    let maxSoFar = BigInt(arr[0]);
    let currMax = BigInt(arr[0]);

    for (let i = 1; i < n; i++) {
        const val = BigInt(arr[i]);
        currMax = val > (currMax + val) ? val : (currMax + val);
        if (currMax > maxSoFar) maxSoFar = currMax;
    }
    console.log(maxSoFar.toString());
}

solve();`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextLong();

        long maxSoFar = arr[0];
        long currMax = arr[0];
        for (int i = 1; i < n; i++) {
            currMax = Math.max(arr[i], currMax + arr[i]);
            maxSoFar = Math.max(maxSoFar, currMax);
        }
        System.out.println(maxSoFar);
    }
}`,
      cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];

    long long max_so_far = arr[0];
    long long curr_max = arr[0];
    for (int i = 1; i < n; i++) {
        curr_max = max(arr[i], curr_max + arr[i]);
        max_so_far = max(max_so_far, curr_max);
    }
    cout << max_so_far << "\\n";
    return 0;
}`
    },
    supported_languages: ["python", "java", "cpp", "javascript"],
    points: 200
  },

  {
    id: "CA004",
    code_id: "CA004",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: ["String", "Stack"],
    category: "String · Stack",
    constraints: [
      "1 <= length(s) <= 100000",
      "s contains only (, ), [, ], {, }"
    ],
    description: "Given a string containing only (), [], and {}, determine whether every opening bracket is closed by the correct type of bracket in the correct order.",
    input_format: "One line containing a bracket string.",
    output_format: "Print YES if valid, otherwise NO.",
    sample_test_cases: [
      { input: "()[]{}", output: "YES" },
      { input: "([)]", output: "NO" }
    ],
    hidden_test_cases: [
      { input: "(", output: "NO" },
      { input: "((()))", output: "YES" },
      { input: "{[()]}", output: "YES" },
      { input: "(((", output: "NO" },
      { input: "]", output: "NO" },
      { input: "(){[()]}[]", output: "YES" }
    ],
    starter_code: {
      python: `import sys

def solve():
    s = sys.stdin.read().strip()
    if not s:
        return
    stack = []
    mapping = {')': '(', ']': '[', '}': '{'}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                print("NO")
                return
        else:
            stack.append(char)
    print("YES" if not stack else "NO")

if __name__ == '__main__':
    solve()`,
      javascript: `const fs = require('fs');

function solve() {
    const s = fs.readFileSync(0, 'utf-8').trim();
    if (!s) return;
    const stack = [];
    const map = { ')': '(', ']': '[', '}': '{' };
    for (let char of s) {
        if (map[char]) {
            const top = stack.length ? stack.pop() : '#';
            if (map[char] !== top) {
                console.log('NO');
                return;
            }
        } else {
            stack.push(char);
        }
    }
    console.log(stack.length === 0 ? 'YES' : 'NO');
}

solve();`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next().trim();

        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) {
                    System.out.println("NO");
                    return;
                }
                char top = stack.pop();
                if ((c == ')' && top != '(') ||
                    (c == ']' && top != '[') ||
                    (c == '}' && top != '{')) {
                    System.out.println("NO");
                    return;
                }
            }
        }
        System.out.println(stack.isEmpty() ? "YES" : "NO");
    }
}`,
      cpp: `#include <iostream>
#include <string>
#include <stack>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    string s;
    if (!(cin >> s)) return 0;
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) {
                cout << "NO\\n";
                return 0;
            }
            char top = st.top();
            st.pop();
            if ((c == ')' && top != '(') ||
                (c == ']' && top != '[') ||
                (c == '}' && top != '{')) {
                cout << "NO\\n";
                return 0;
            }
        }
    }
    cout << (st.empty() ? "YES" : "NO") << "\\n";
    return 0;
}`
    },
    supported_languages: ["python", "java", "cpp", "javascript"],
    points: 100
  },

  {
    id: "CA005",
    code_id: "CA005",
    title: "Rotate Array Right by K",
    difficulty: "Medium",
    topic: ["Array", "In-place Algorithms"],
    category: "Array · In-place Algorithms",
    constraints: [
      "1 <= n <= 100000",
      "-1000000000 <= arr[i] <= 1000000000",
      "0 <= k <= 1000000000"
    ],
    description: "Rotate an array to the right by k positions. Elements moved beyond the end wrap around to the beginning.",
    input_format: "First line: n. Second line: n integers. Third line: k.",
    output_format: "Print the rotated array as space-separated integers.",
    sample_test_cases: [
      { input: "5\n1 2 3 4 5\n2", output: "4 5 1 2 3" },
      { input: "4\n1 2 3 4\n0", output: "1 2 3 4" }
    ],
    hidden_test_cases: [
      { input: "1\n7\n100", output: "7" },
      { input: "5\n1 2 3 4 5\n5", output: "1 2 3 4 5" },
      { input: "6\n10 20 30 40 50 60\n1", output: "60 10 20 30 40 50" },
      { input: "5\n1 2 3 4 5\n7", output: "4 5 1 2 3" },
      { input: "4\n-1 -2 -3 -4\n3", output: "-2 -3 -4 -1" },
      { input: "5\n1 2 3 4 5\n1000000000", output: "1 2 3 4 5" }
    ],
    starter_code: {
      python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    arr = [int(x) for x in input_data[1:n+1]]
    k = int(input_data[n+1]) % n
    
    rotated = arr[n-k:] + arr[:n-k]
    print(*(rotated))

if __name__ == '__main__':
    solve()`,
      javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length < 3) return;
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    const k = parseInt(input[n + 1], 10) % n;

    const rotated = [...arr.slice(n - k), ...arr.slice(0, n - k)];
    console.log(rotated.join(' '));
}

solve();`,
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        long[] arr = new long[n];
        for (int i = 0; i < n; i++) arr[i] = sc.nextLong();
        long kVal = sc.nextLong();
        int k = (int)(kVal % n);

        long[] res = new long[n];
        for (int i = 0; i < n; i++) {
            res[(i + k) % n] = arr[i];
        }
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) {
            sb.append(res[i]).append(i == n - 1 ? "" : " ");
        }
        System.out.println(sb.toString());
    }
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    long long kVal;
    cin >> kVal;
    int k = kVal % n;

    vector<long long> res(n);
    for (int i = 0; i < n; i++) {
        res[(i + k) % n] = arr[i];
    }
    for (int i = 0; i < n; i++) {
        cout << res[i] << (i == n - 1 ? "" : " ");
    }
    cout << "\\n";
    return 0;
}`
    },
    supported_languages: ["python", "java", "cpp", "javascript"],
    points: 200
  }
];

module.exports = { CODE_CHALLENGES_SEED };
