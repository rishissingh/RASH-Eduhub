/**
 * Online Judge Regression Test Suite
 * Tests all 12 regression scenarios specified in requirements:
 * 1. Empty source code
 * 2. Default starter template without implementation
 * 3. Code that compiles but prints nothing
 * 4. Code that prints sample output hardcoded (fails hidden tests)
 * 5. Code that passes sample tests but fails a hidden test
 * 6. Code with a compilation error
 * 7. Code with a runtime error
 * 8. Code that exceeds the time limit (TLE)
 * 9. Genuinely correct solution that passes all test cases (Accepted, 100/100)
 * 10. Execution service failure (Judge Error, 0 points)
 * 11. Repeated submission of the same code (no duplicate XP)
 * 12. Attempts to forge score or Accepted verdict in API request
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), override: true });
const assert = require('assert');
const path = require('path');
const express = require('express');
const { supabase } = require('../supabaseHelper');
const codeRouter = require('../routes/code');

let testsPassed = 0;
let testsFailed = 0;

function logTest(testName, passed, details = '') {
   if (passed) {
      testsPassed++;
      console.log(`  ✅ [PASS] ${testName}`);
   } else {
      testsFailed++;
      console.error(`  ❌ [FAIL] ${testName} - ${details}`);
   }
}

async function runRegressionSuite() {
   console.log('\n======================================================');
   console.log('🧪 Starting Online Judge Regression Test Suite');
   console.log('======================================================\n');

   // 1. Get test challenge [CA001] Two Sum
   const { data: challenges } = await supabase
      .from('code_challenges')
      .select('*')
      .ilike('title', '%CA001%');

   if (!challenges || challenges.length === 0) {
      console.error('❌ Could not find CA001 Two Sum in database to run tests.');
      process.exit(1);
   }

   const challenge = challenges[0];
   const pId = challenge.code_id || challenge.id;

   // Mock mockUser for protected route simulation
   const mockUser = {
      id: 'b2fef5ae-abe2-4945-a9d6-1d2691e2acd9',
      name: 'Judge Test Runner',
      role: 'student',
      xp: 250,
      coins: 50
   };

   // Helper to directly invoke the /submit route logic
   async function submitCodePayload(payload) {
      return new Promise((resolve) => {
         const req = {
            body: payload,
            user: mockUser
         };
         const res = {
            status(code) {
               this._statusCode = code;
               return this;
            },
            json(data) {
               resolve({ status: this._statusCode || 200, data });
            }
         };
         const next = (err) => {
            resolve({ status: 500, error: err });
         };

         // Find route handler for /submit
         const submitRoute = codeRouter.stack.find(s => s.route && s.route.path === '/submit' && s.route.methods.post);
         if (!submitRoute) {
            throw new Error('Cannot find /submit route in code router');
         }
         // Call the inner handler (skip middleware in direct test)
         const handler = submitRoute.route.stack[submitRoute.route.stack.length - 1].handle;
         handler(req, res, next);
      });
   }

   // Helper to directly invoke /run route
   async function runCodePayload(payload) {
      return new Promise((resolve) => {
         const req = {
            body: payload,
            user: mockUser
         };
         const res = {
            status(code) {
               this._statusCode = code;
               return this;
            },
            json(data) {
               resolve({ status: this._statusCode || 200, data });
            }
         };
         const next = (err) => {
            resolve({ status: 500, error: err });
         };

         const runRoute = codeRouter.stack.find(s => s.route && s.route.path === '/run' && s.route.methods.post);
         const handler = runRoute.route.stack[runRoute.route.stack.length - 1].handle;
         handler(req, res, next);
      });
   }

   // --------------------------------------------------------------------------
   // Test 1: Empty source code (Python, JS, Java)
   // --------------------------------------------------------------------------
   console.log('--- Case 1: Empty Source Code ---');
   for (const lang of ['python', 'javascript', 'java']) {
      const res = await submitCodePayload({ challengeId: pId, language: lang, code: '   \n  \t  ' });
      const sub = res.data.submission;
      logTest(`Empty source code in ${lang} receives 0 points and 'Empty Submission'`,
         sub && sub.score === 0 && sub.status === 'Empty Submission',
         `Got status=${sub ? sub.status : null}, score=${sub ? sub.score : null}`
      );
   }

   // --------------------------------------------------------------------------
   // Test 2: Default starter template without an implementation
   // --------------------------------------------------------------------------
   console.log('\n--- Case 2: Starter Template Without Implementation ---');
   const pyStarter = `def main():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    main()`;
   const jsStarter = `const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\n// Write your solution here`;
   const javaStarter = `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Write your solution here\n        sc.close();\n    }\n}`;

   for (const [lang, code] of [['python', pyStarter], ['javascript', jsStarter], ['java', javaStarter]]) {
      const res = await submitCodePayload({ challengeId: pId, language: lang, code });
      const sub = res.data.submission;
      logTest(`Unchanged starter template in ${lang} receives 0 points and 'Invalid Submission'`,
         sub && sub.score === 0 && sub.status === 'Invalid Submission',
         `Got status=${sub ? sub.status : null}, score=${sub ? sub.score : null}`
      );
   }

   // --------------------------------------------------------------------------
   // Test 3: Code that compiles but prints nothing
   // --------------------------------------------------------------------------
   console.log('\n--- Case 3: Code That Compiles But Prints Nothing ---');
   const pySilent = `import sys\ndata = sys.stdin.read()`;
   const resSilent = await submitCodePayload({ challengeId: pId, language: 'python', code: pySilent });
   const subSilent = resSilent.data.submission;
   logTest(`Silent code that prints nothing gets 'Wrong Answer' with 0 score`,
      subSilent && subSilent.score === 0 && subSilent.status === 'Wrong Answer',
      `Got status=${subSilent ? subSilent.status : null}, score=${subSilent ? subSilent.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 4: Code that prints the sample output hardcoded
   // --------------------------------------------------------------------------
   console.log('\n--- Case 4: Code That Only Prints Sample Output (Fails Hidden Tests) ---');
   const pyFakeSample = `import sys\n# Only works for sample 1\nprint("0 1")`;
   const resFakeSample = await submitCodePayload({ challengeId: pId, language: 'python', code: pyFakeSample });
   const subFakeSample = resFakeSample.data.submission;
   logTest(`Hardcoded output fails hidden tests and receives 'Wrong Answer' (Never 'Accepted')`,
      subFakeSample && subFakeSample.status === 'Wrong Answer' && subFakeSample.score < 100,
      `Got status=${subFakeSample ? subFakeSample.status : null}, score=${subFakeSample ? subFakeSample.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 5: Code that passes sample tests but fails a hidden test
   // --------------------------------------------------------------------------
   console.log('\n--- Case 5: Passes Sample Tests But Fails Hidden Test ---');
   // Code that handles small n <= 4 correctly but breaks on larger input
   const pyPartial = `import sys
data = sys.stdin.read().split()
n = int(data[0])
arr = [int(x) for x in data[1:n+1]]
target = int(data[n+1])
if n <= 4:
    for i in range(n):
        for j in range(i + 1, n):
            if arr[i] + arr[j] == target:
                print(f"{i} {j}")
                sys.exit(0)
else:
    print("0 0") # Incorrect for n > 4
`;
   const resPartial = await submitCodePayload({ challengeId: pId, language: 'python', code: pyPartial });
   const subPartial = resPartial.data.submission;
   logTest(`Partial solution failing hidden tests receives 'Wrong Answer' and is NOT Accepted`,
      subPartial && subPartial.status === 'Wrong Answer' && subPartial.score < 100,
      `Got status=${subPartial ? subPartial.status : null}, score=${subPartial ? subPartial.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 6: Code with compilation error
   // --------------------------------------------------------------------------
   console.log('\n--- Case 6: Compilation Error ---');
   const pySyntaxErr = `def broken_syntax(:\n    return 42`;
   const resCompErr = await submitCodePayload({ challengeId: pId, language: 'python', code: pySyntaxErr });
   const subCompErr = resCompErr.data.submission;
   logTest(`Syntax error returns 'Compilation Error' with 0 score`,
      subCompErr && subCompErr.score === 0 && subCompErr.status === 'Compilation Error',
      `Got status=${subCompErr ? subCompErr.status : null}, score=${subCompErr ? subCompErr.score : null}`
   );

   const jsSyntaxErr = `const x = ;;;`;
   const resJsCompErr = await submitCodePayload({ challengeId: pId, language: 'javascript', code: jsSyntaxErr });
   const subJsCompErr = resJsCompErr.data.submission;
   logTest(`JavaScript syntax error returns 'Compilation Error' with 0 score`,
      subJsCompErr && subJsCompErr.score === 0 && subJsCompErr.status === 'Compilation Error',
      `Got status=${subJsCompErr ? subJsCompErr.status : null}, score=${subJsCompErr ? subJsCompErr.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 7: Code with runtime error
   // --------------------------------------------------------------------------
   console.log('\n--- Case 7: Runtime Error ---');
   const pyRuntimeErr = `import sys\nraw = sys.stdin.read().split()\nx = 1 / 0\n`;
   const resRtErr = await submitCodePayload({ challengeId: pId, language: 'python', code: pyRuntimeErr });
   const subRtErr = resRtErr.data.submission;
   logTest(`ZeroDivisionError returns 'Runtime Error' with 0 score`,
      subRtErr && subRtErr.score === 0 && subRtErr.status === 'Runtime Error',
      `Got status=${subRtErr ? subRtErr.status : null}, score=${subRtErr ? subRtErr.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 8: Code that exceeds time limit
   // --------------------------------------------------------------------------
   console.log('\n--- Case 8: Time Limit Exceeded (TLE) ---');
   const jsTimeout = `const fs = require('fs'); const input = fs.readFileSync(0, 'utf8'); while (true) {}`;
   const resTle = await submitCodePayload({ challengeId: pId, language: 'javascript', code: jsTimeout });
   const subTle = resTle.data.submission;
   logTest(`Infinite loop in JavaScript returns 'Time Limit Exceeded' with 0 score`,
      subTle && subTle.score === 0 && subTle.status === 'Time Limit Exceeded',
      `Got status=${subTle ? subTle.status : null}, score=${subTle ? subTle.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 9: Genuinely correct solution that passes all required test cases
   // --------------------------------------------------------------------------
   console.log('\n--- Case 9: Genuinely Correct Solution (Accepted 100/100) ---');
   const pyCorrect = `import sys

def solve():
    raw = sys.stdin.read().split()
    if not raw:
        return
    n = int(raw[0])
    nums = [int(x) for x in raw[1:n+1]]
    target = int(raw[n+1])
    
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            print(f"{seen[diff]} {i}")
            return
        seen[num] = i

if __name__ == '__main__':
    solve()
`;
   const resCorrectPy = await submitCodePayload({ challengeId: pId, language: 'python', code: pyCorrect });
   const subCorrectPy = resCorrectPy.data.submission;
   logTest(`Correct Python solution receives 'Accepted' with 100/100 score`,
      subCorrectPy && subCorrectPy.status === 'Accepted' && subCorrectPy.score === 100 && subCorrectPy.passedTests === subCorrectPy.totalTests,
      `Got status=${subCorrectPy ? subCorrectPy.status : null}, score=${subCorrectPy ? subCorrectPy.score : null}, passed=${subCorrectPy ? subCorrectPy.passedTests : null}/${subCorrectPy ? subCorrectPy.totalTests : null}`
   );

   const jsCorrect = `const fs = require('fs');

function solve() {
    const raw = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);
    if (!raw || raw.length < 2) return;
    const n = parseInt(raw[0], 10);
    const nums = [];
    for (let i = 1; i <= n; i++) {
        nums.push(parseInt(raw[i], 10));
    }
    const target = parseInt(raw[n + 1], 10);
    
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) {
            console.log(seen.get(diff) + ' ' + i);
            return;
        }
        seen.set(nums[i], i);
    }
}
solve();
`;
   const resCorrectJs = await submitCodePayload({ challengeId: pId, language: 'javascript', code: jsCorrect });
   const subCorrectJs = resCorrectJs.data.submission;
   logTest(`Correct JavaScript solution receives 'Accepted' with 100/100 score`,
      subCorrectJs && subCorrectJs.status === 'Accepted' && subCorrectJs.score === 100,
      `Got status=${subCorrectJs ? subCorrectJs.status : null}, score=${subCorrectJs ? subCorrectPy.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 10: Execution service failure (Judge Error)
   // --------------------------------------------------------------------------
   console.log('\n--- Case 10: Execution Service Failure Handling ---');
   // Submitting with unsupported runtime or simulating infrastructure failure
   const resUnsupported = await submitCodePayload({ challengeId: pId, language: 'ruby', code: 'puts "hello"' });
   const subUnsupported = resUnsupported.data.submission;
   logTest(`Unsupported language or compiler failure returns 'Judge Error' with 0 points`,
      subUnsupported && subUnsupported.score === 0 && subUnsupported.status === 'Judge Error',
      `Got status=${subUnsupported ? subUnsupported.status : null}, score=${subUnsupported ? subUnsupported.score : null}`
   );

   // --------------------------------------------------------------------------
   // Test 11: Repeated submission of the same code (No duplicate points)
   // --------------------------------------------------------------------------
   console.log('\n--- Case 11: Repeated Submission of Solved Problem ---');
   const { data: userBefore } = await supabase.from('users').select('xp, coins').eq('id', mockUser.id).single();
   const xpBefore = userBefore ? userBefore.xp : 0;

   // Submit correct code a second time
   await submitCodePayload({ challengeId: pId, language: 'python', code: pyCorrect });
   const { data: userAfter } = await supabase.from('users').select('xp, coins').eq('id', mockUser.id).single();
   const xpAfter = userAfter ? userAfter.xp : 0;

   logTest(`Repeated Accepted submission does NOT duplicate user XP`,
      xpAfter === xpBefore,
      `XP before=${xpBefore}, XP after=${xpAfter}`
   );

   // --------------------------------------------------------------------------
   // Test 12: Attempts to forge score or Accepted verdict in API request
   // --------------------------------------------------------------------------
   console.log('\n--- Case 12: Anti-Tampering (Server Ignores Forged Score / Verdict) ---');
   const forgedPayload = {
      challengeId: pId,
      language: 'python',
      code: 'print("wrong")',
      status: 'Accepted',
      score: 100,
      passed_tests: 10,
      total_tests: 10
   };
   const resForged = await submitCodePayload(forgedPayload);
   const subForged = resForged.data.submission;
   logTest(`API rejects client-sent status/score and calculates real verdict ('Wrong Answer', <100)`,
      subForged && subForged.status === 'Wrong Answer' && subForged.score < 100,
      `Got status=${subForged ? subForged.status : null}, score=${subForged ? subForged.score : null}`
   );

   // Cleanup any test submissions created during regression run
   await supabase.from('submissions').delete().eq('user_id', mockUser.id);

   console.log('\n======================================================');
   console.log(`📊 Test Summary: ${testsPassed} Passed | ${testsFailed} Failed`);
   console.log('======================================================\n');

   if (testsFailed > 0) {
      process.exit(1);
   }
}

runRegressionSuite().catch((err) => {
   console.error('💥 Fatal error in regression runner:', err);
   process.exit(1);
});
