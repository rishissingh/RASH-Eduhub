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
    starter_code: {},
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
    starter_code: {},
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
    starter_code: {},
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
    starter_code: {},
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
    starter_code: {},
    supported_languages: ["python", "java", "cpp", "javascript"],
    points: 200
  }
];

module.exports = { CODE_CHALLENGES_SEED };
