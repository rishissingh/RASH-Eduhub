/**
 * RASH EduHub - Smart Code Grader Service (Online Judge Client Service)
 * Handles code grader challenges, test case evaluations, compilations, scores, and submissions.
 */

const DEFAULT_CODE_ARENA_CHALLENGES = [
  {
    id: "CA001",
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
    inputFormat: "First line: n. Second line: n integers. Third line: target.",
    outputFormat: "Print the two zero-based indices in increasing order.",
    sampleTestCases: [
      { input: "4\n2 7 11 15\n9", output: "0 1", expected: "0 1" },
      { input: "3\n3 2 4\n6", output: "1 2", expected: "1 2" }
    ],
    starterCode: {},
    supportedLanguages: ["python", "java", "cpp", "javascript"],
    points: 100
  },
  {
    id: "CA002",
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
    inputFormat: "First line: n. Second line: n sorted integers. Third line: target.",
    outputFormat: "Print the zero-based index or -1.",
    sampleTestCases: [
      { input: "5\n1 3 5 7 9\n7", output: "3", expected: "3" },
      { input: "5\n1 3 5 7 9\n4", output: "-1", expected: "-1" }
    ],
    starterCode: {},
    supportedLanguages: ["python", "java", "cpp", "javascript"],
    points: 100
  },
  {
    id: "CA003",
    title: "Maximum Subarray Sum",
    difficulty: "Medium",
    topic: ["Array", "Dynamic Programming", "Kadane Algorithm"],
    category: "Array · Dynamic Programming",
    constraints: [
      "1 <= n <= 200000",
      "-1000000000 <= arr[i] <= 1000000000"
    ],
    description: "Find the maximum sum of any non-empty contiguous subarray. The array can contain positive, negative, and zero values.",
    inputFormat: "First line: n. Second line: n integers.",
    outputFormat: "Print the maximum sum of a non-empty contiguous subarray.",
    sampleTestCases: [
      { input: "9\n-2 1 -3 4 -1 2 1 -5 4", output: "6", expected: "6" },
      { input: "5\n1 2 3 4 5", output: "15", expected: "15" }
    ],
    starterCode: {},
    supportedLanguages: ["python", "java", "cpp", "javascript"],
    points: 200
  },
  {
    id: "CA004",
    title: "Valid Parentheses",
    difficulty: "Easy",
    topic: ["String", "Stack"],
    category: "String · Stack",
    constraints: [
      "1 <= length(s) <= 100000",
      "s contains only (, ), [, ], {, }"
    ],
    description: "Given a string containing only (), [], and {}, determine whether every opening bracket is closed by the correct type of bracket in the correct order.",
    inputFormat: "One line containing a bracket string.",
    outputFormat: "Print YES if valid, otherwise NO.",
    sampleTestCases: [
      { input: "()[]{}", output: "YES", expected: "YES" },
      { input: "([)]", output: "NO", expected: "NO" }
    ],
    starterCode: {},
    supportedLanguages: ["python", "java", "cpp", "javascript"],
    points: 100
  },
  {
    id: "CA005",
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
    inputFormat: "First line: n. Second line: n integers. Third line: k.",
    outputFormat: "Print the rotated array as space-separated integers.",
    sampleTestCases: [
      { input: "5\n1 2 3 4 5\n2", output: "4 5 1 2 3", expected: "4 5 1 2 3" },
      { input: "4\n1 2 3 4\n0", output: "1 2 3 4", expected: "1 2 3 4" }
    ],
    starterCode: {},
    supportedLanguages: ["python", "java", "cpp", "javascript"],
    points: 200
  }
];

const CodeGraderService = {
   DEFAULT_CHALLENGES: DEFAULT_CODE_ARENA_CHALLENGES,

   /**
    * Get coding challenges from backend or fallback
    */
   async getChallenges() {
      try {
         if (window.EduHubDB) {
            const data = await EduHubDB.api('/code/challenges');
            if (data && data.success && Array.isArray(data.challenges) && data.challenges.length > 0) {
               return data.challenges;
            }
         }
         return this.DEFAULT_CHALLENGES;
      } catch (err) {
         console.warn('Failed to fetch remote challenges, using local default:', err);
         return this.DEFAULT_CHALLENGES;
      }
   },

   /**
    * Get single challenge by ID
    */
   async getChallengeById(id) {
      const challenges = await this.getChallenges();
      return challenges.find(c => String(c.id) === String(id) || String(c._id) === String(id) || String(c.codeId) === String(id)) || challenges[0];
   },

   /**
    * Run code inside Online Judge backend
    */
   async runCode(challengeId, lang, code) {
      try {
         if (window.EduHubDB) {
            const res = await EduHubDB.api('/code/run', {
               method: 'POST',
               body: { challengeId, language: lang, code }
            });
            if (res && res.success) return res;
         }
         return {
            success: false,
            status: 'Judge Error',
            score: 0,
            maxScore: 100,
            logs: [
               '[Code Arena Judge] Failed to reach Online Judge server.',
               '[Code Arena Judge] Verdict: Judge Error | Score: 0/100'
            ],
            testResults: []
         };
      } catch (err) {
         return {
            success: false,
            status: 'Judge Error',
            score: 0,
            maxScore: 100,
            logs: [
               '[Code Arena Judge] Execution service error.',
               `[Code Arena Judge] ${err.message || 'Server connection failed.'}`,
               '[Code Arena Judge] Verdict: Judge Error | Score: 0/100'
            ],
            testResults: []
         };
      }
   },

   /**
    * Submit grading challenge solutions
    */
   async submitCode(challengeId, lang, code) {
      try {
         if (window.EduHubDB) {
            const data = await EduHubDB.api('/code/submit', {
               method: 'POST',
               body: { challengeId, language: lang, code }
            });
            if (data && data.success && data.submission) {
               return data;
            }
         }
         return {
            success: false,
            status: 'Judge Error',
            submission: {
               score: 0,
               maxScore: 100,
               status: 'Judge Error',
               output: 'Execution service unavailable.'
            },
            runResult: {
               status: 'Judge Error',
               score: 0,
               maxScore: 100,
               logs: ['[Code Arena Judge] Verdict: Judge Error | Score: 0/100'],
               testResults: []
            }
         };
      } catch (err) {
         return {
            success: false,
            status: 'Judge Error',
            submission: {
               score: 0,
               maxScore: 100,
               status: 'Judge Error',
               output: err.message || 'Unable to connect to Online Judge backend.'
            },
            runResult: {
               status: 'Judge Error',
               score: 0,
               maxScore: 100,
               logs: [
                  '[Code Arena Judge] Execution service connection failed.',
                  `[Code Arena Judge] ${err.message || 'Connection refused.'}`,
                  '[Code Arena Judge] Verdict: Judge Error | Score: 0/100'
               ],
               testResults: []
            }
         };
      }
   },

   async getSubmissions(challengeId) {
      try {
         if (window.EduHubDB) {
            const data = await EduHubDB.api(`/code/submissions?challengeId=${encodeURIComponent(challengeId)}`);
            return data.success && Array.isArray(data.submissions) ? data.submissions : [];
         }
         return [];
      } catch (err) {
         console.warn('Failed to load submission history:', err);
         return [];
      }
   }
};

window.CodeGraderService = CodeGraderService;
