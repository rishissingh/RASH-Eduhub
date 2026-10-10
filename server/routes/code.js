/**
 * Code Challenge Routes — Online Judge Execution Engine (v2.0)
 * Integrated with Supabase PostgreSQL Database & Stdin/Stdout Evaluation
 */

const express = require('express');
const router = express.Router();
const { supabase, formatCodeChallenge, formatSubmission } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');
const vm = require('vm');
const { execSync } = require('child_process');

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Output Normalizer (Ignores trailing/leading whitespace and collapses internal spaces)
 */
function normalizeOutput(str) {
   if (str === null || str === undefined) return '';
   return String(str)
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.trim().replace(/\s+/g, ' '))
      .filter(line => line.length > 0)
      .join('\n');
}

/**
 * Validates submitted source code before execution.
 * Rejects empty, whitespace-only, comment-only, and boilerplate/starter template code.
 */
function validateSourceCode(language, code) {
   if (!code || typeof code !== 'string') {
      return { valid: false, status: 'Empty Submission', message: 'No source code provided.' };
   }

   const raw = code.trim();
   if (raw.length === 0) {
      return { valid: false, status: 'Empty Submission', message: 'Source code cannot be empty.' };
   }

   const lang = (language || 'python').toLowerCase();

   // Strip comments and check if code remains
   let stripped = raw;
   if (lang === 'python' || lang === 'py') {
      // Remove multi-line docstrings: '''...''' or """..."""
      stripped = stripped.replace(/'''[\s\S]*?'''/g, '').replace(/"""[\s\S]*?"""/g, '');
      // Remove single-line comments: #...
      stripped = stripped.replace(/#.*$/gm, '');
   } else {
      // Remove multi-line comments: /* ... */
      stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, '');
      // Remove single-line comments: // ...
      stripped = stripped.replace(/\/\/.*$/gm, '');
   }

   const noWhitespace = stripped.replace(/\s+/g, '');
   if (noWhitespace.length === 0) {
      return { valid: false, status: 'Empty Submission', message: 'Submitted code contains only comments or whitespace.' };
   }

   // Language-specific boilerplate & placeholder detection
   if (lang === 'python' || lang === 'py') {
      const pyClean = stripped
         .replace(/\bdef\s+[a-zA-Z0-9_]+\s*\([^)]*\)\s*:/g, '')
         .replace(/\bif\s+__name__\s*==\s*["']__main__["']\s*:\s*[a-zA-Z0-9_]+\(\)/g, '')
         .replace(/\bpass\b/g, '')
         .replace(/\breturn\b/g, '')
         .replace(/\.{3}/g, '')
         .trim();

      if (!pyClean || pyClean.length === 0) {
         return { valid: false, status: 'Invalid Submission', message: 'Default starter template submitted without implementation.' };
      }
   } else if (lang === 'java') {
      const javaClean = stripped
         .replace(/import\s+[a-zA-Z0-9_.*]+;/g, '')
         .replace(/public\s+class\s+[A-Za-z0-9_]+\s*\{/g, '')
         .replace(/public\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*[a-zA-Z0-9_]+\s*\)\s*\{/g, '')
         .replace(/Scanner\s+[a-zA-Z0-9_]+\s*=\s*new\s+Scanner\s*\(\s*System\.in\s*\)\s*;/g, '')
         .replace(/[a-zA-Z0-9_]+\.close\s*\(\s*\)\s*;/g, '')
         .replace(/return\s*;/g, '')
         .replace(/[\{\}\s]/g, '')
         .trim();

      if (!javaClean || javaClean.length === 0) {
         return { valid: false, status: 'Invalid Submission', message: 'Default starter template submitted without implementation.' };
      }
   } else if (lang === 'cpp' || lang === 'c++') {
      const cppClean = stripped
         .replace(/#include\s*[<"][^>"]+[>"]/g, '')
         .replace(/using\s+namespace\s+std\s*;/g, '')
         .replace(/int\s+main\s*\(\s*\)\s*\{/g, '')
         .replace(/return\s+0\s*;/g, '')
         .replace(/return\s*;/g, '')
         .replace(/[\{\}\s]/g, '')
         .trim();

      if (!cppClean || cppClean.length === 0) {
         return { valid: false, status: 'Invalid Submission', message: 'Default starter template submitted without implementation.' };
      }
   } else if (lang === 'javascript' || lang === 'js') {
      const jsClean = stripped
         .replace(/(const|let|var)\s+fs\s*=\s*require\s*\(\s*['"]fs['"]\s*\)\s*;/g, '')
         .replace(/(const|let|var)\s+input\s*=\s*fs\.readFileSync\s*\(\s*0\s*,\s*['"]utf8['"]\s*\)\.trim\(\)\s*;/g, '')
         .replace(/process\.exit\s*\(\s*0\s*\)\s*;/g, '')
         .replace(/[\{\}\s]/g, '')
         .trim();

      if (!jsClean || jsClean.length === 0) {
         return { valid: false, status: 'Invalid Submission', message: 'Default starter template submitted without implementation.' };
      }
   }

   // Catch unedited placeholder markers
   if ((raw.includes('Write your solution here') || raw.includes('TODO')) && raw.length < 120) {
      return { valid: false, status: 'Invalid Submission', message: 'Starter placeholder not replaced with solution logic.' };
   }

   return { valid: true };
}

function runJsUserCode(code, inputStr) {
   let logs = [];
   const customConsole = {
      log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
      error: (...args) => logs.push(args.join(' ')),
      warn: (...args) => logs.push(args.join(' '))
   };

   const mockFs = {
      readFileSync: (fd, encoding) => inputStr
   };

   const sandbox = {
      console: customConsole,
      require: (moduleName) => {
         if (moduleName === 'fs') return mockFs;
         throw new Error(`Module '${moduleName}' is not allowed in online judge sandbox.`);
      },
      Buffer,
      process: {
         stdin: { read: () => inputStr },
         stdout: { write: (data) => logs.push(data) },
         exit: () => {}
      },
      Map, Set, BigInt, Array, Object, Math, parseInt, parseFloat, String, Number, Boolean, ArrayBuffer
   };

   try {
      const context = vm.createContext(sandbox);
      let script;
      try {
         script = new vm.Script(code, { timeout: 3000 });
      } catch (compileErr) {
         const err = new Error(compileErr.message);
         err.verdict = 'Compilation Error';
         throw err;
      }
      script.runInContext(context, { timeout: 3000 });
      return logs.join('\n');
   } catch (err) {
      if (err.verdict) throw err;
      if (err.message && (err.message.includes('timed out') || err.message.includes('ETIMEDOUT'))) {
         const timeoutErr = new Error('Execution timed out (3000ms)');
         timeoutErr.verdict = 'Time Limit Exceeded';
         throw timeoutErr;
      }
      const rtErr = new Error(err.message || 'JavaScript runtime error');
      rtErr.verdict = 'Runtime Error';
      throw rtErr;
   }
}

function runPythonUserCode(code, inputStr) {
   const tmpDir = os.tmpdir();
   const fileId = `py_${Date.now()}_${Math.random().toString(36).substring(7)}`;
   const scriptPath = path.join(tmpDir, `${fileId}.py`);

   fs.writeFileSync(scriptPath, code, 'utf8');
   try {
      const output = execSync(`python "${scriptPath}"`, {
         input: inputStr,
         timeout: 4000,
         encoding: 'utf-8',
         stdio: ['pipe', 'pipe', 'pipe']
      });
      return output;
   } catch (err) {
      const stderr = (err.stderr ? err.stderr.toString() : err.message) || '';

      if (err.code === 'ETIMEDOUT' || err.message.includes('ETIMEDOUT') || (err.status === null && err.signal === 'SIGTERM')) {
         const e = new Error('Execution timed out (4000ms)');
         e.verdict = 'Time Limit Exceeded';
         throw e;
      }

      if (err.message.includes('is not recognized') || err.message.includes('cannot find') || err.message.includes('not found')) {
         const e = new Error('Python runtime unavailable on judge host.');
         e.verdict = 'Judge Error';
         throw e;
      }

      if (stderr.includes('SyntaxError') || stderr.includes('IndentationError') || stderr.includes('TabError')) {
         const e = new Error(stderr.trim());
         e.verdict = 'Compilation Error';
         throw e;
      }

      const e = new Error(stderr.trim() || 'Python runtime error');
      e.verdict = 'Runtime Error';
      throw e;
   } finally {
      try {
         if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
      } catch (_) {}
   }
}

function runJavaUserCode(code, inputStr) {
   const tmpDir = os.tmpdir();
   const dirName = `java_${Date.now()}_${Math.random().toString(36).substring(7)}`;
   const workDir = path.join(tmpDir, dirName);

   fs.mkdirSync(workDir, { recursive: true });

   let className = 'Main';
   const match = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
   if (match && match[1]) {
      className = match[1];
   }

   const javaPath = path.join(workDir, `${className}.java`);
   fs.writeFileSync(javaPath, code, 'utf8');

   try {
      // 1. Compile with javac
      try {
         execSync(`javac "${javaPath}"`, {
            cwd: workDir,
            timeout: 6000,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
         });
      } catch (compileErr) {
         const stderr = (compileErr.stderr ? compileErr.stderr.toString() : compileErr.message) || '';
         if (compileErr.code === 'ETIMEDOUT' || compileErr.message.includes('ETIMEDOUT')) {
            const e = new Error('Compilation timed out');
            e.verdict = 'Time Limit Exceeded';
            throw e;
         }
         if (compileErr.message.includes('is not recognized') || compileErr.message.includes('cannot find')) {
            const e = new Error('Java compiler (javac) unavailable on judge host.');
            e.verdict = 'Judge Error';
            throw e;
         }
         const e = new Error(stderr.trim() || 'Java compilation error');
         e.verdict = 'Compilation Error';
         throw e;
      }

      // 2. Run with java
      try {
         const output = execSync(`java -cp . ${className}`, {
            cwd: workDir,
            input: inputStr,
            timeout: 4000,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
         });
         return output;
      } catch (runErr) {
         const stderr = (runErr.stderr ? runErr.stderr.toString() : runErr.message) || '';
         if (runErr.code === 'ETIMEDOUT' || runErr.message.includes('ETIMEDOUT')) {
            const e = new Error('Execution timed out (4000ms)');
            e.verdict = 'Time Limit Exceeded';
            throw e;
         }
         if (runErr.message.includes('is not recognized') || runErr.message.includes('cannot find')) {
            const e = new Error('Java runtime (java) unavailable on judge host.');
            e.verdict = 'Judge Error';
            throw e;
         }
         const e = new Error(stderr.trim() || 'Java runtime error');
         e.verdict = 'Runtime Error';
         throw e;
      }
   } finally {
      try {
         fs.rmSync(workDir, { recursive: true, force: true });
      } catch (_) {}
   }
}

function runCppUserCode(code, inputStr) {
   const tmpDir = os.tmpdir();
   const binId = `cpp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
   const srcPath = path.join(tmpDir, `${binId}.cpp`);
   const exePath = path.join(tmpDir, `${binId}.exe`);

   fs.writeFileSync(srcPath, code, 'utf8');

   try {
      // 1. Compile with g++
      try {
         execSync(`g++ -O2 "${srcPath}" -o "${exePath}"`, {
            timeout: 6000,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
         });
      } catch (compileErr) {
         const stderr = (compileErr.stderr ? compileErr.stderr.toString() : compileErr.message) || '';
         if (compileErr.code === 'ETIMEDOUT' || compileErr.message.includes('ETIMEDOUT')) {
            const e = new Error('Compilation timed out');
            e.verdict = 'Time Limit Exceeded';
            throw e;
         }
         if (compileErr.message.includes('is not recognized') || compileErr.message.includes('cannot find') || compileErr.message.includes('not found')) {
            const e = new Error('C++ compiler (g++) is not available on judge host.');
            e.verdict = 'Judge Error';
            throw e;
         }
         const e = new Error(stderr.trim() || 'C++ compilation error');
         e.verdict = 'Compilation Error';
         throw e;
      }

      // 2. Execute compiled binary
      try {
         const output = execSync(`"${exePath}"`, {
            input: inputStr,
            timeout: 3000,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe']
         });
         return output;
      } catch (runErr) {
         const stderr = (runErr.stderr ? runErr.stderr.toString() : runErr.message) || '';
         if (runErr.code === 'ETIMEDOUT' || runErr.message.includes('ETIMEDOUT')) {
            const e = new Error('Execution timed out (3000ms)');
            e.verdict = 'Time Limit Exceeded';
            throw e;
         }
         const e = new Error(stderr.trim() || 'C++ runtime error');
         e.verdict = 'Runtime Error';
         throw e;
      }
   } finally {
      try { if (fs.existsSync(srcPath)) fs.unlinkSync(srcPath); } catch (_) {}
      try { if (fs.existsSync(exePath)) fs.unlinkSync(exePath); } catch (_) {}
   }
}

/**
 * Execute User Solution against Stdin and Return Stdout with Error Categorization
 */
function executeTestCase(language, code, inputStr, expectedOutput) {
   const normalizedExpected = normalizeOutput(expectedOutput);
   const lang = (language || 'python').toLowerCase();

   let actualOutput = '';
   let passed = false;
   let verdict = null;
   let error = null;

   try {
      if (lang === 'javascript' || lang === 'js') {
         actualOutput = runJsUserCode(code, inputStr);
      } else if (lang === 'python' || lang === 'py') {
         actualOutput = runPythonUserCode(code, inputStr);
      } else if (lang === 'java') {
         actualOutput = runJavaUserCode(code, inputStr);
      } else if (lang === 'cpp' || lang === 'c++') {
         actualOutput = runCppUserCode(code, inputStr);
      } else {
         const e = new Error(`Unsupported language '${language}'`);
         e.verdict = 'Judge Error';
         throw e;
      }

      const normalizedActual = normalizeOutput(actualOutput);
      passed = (normalizedActual === normalizedExpected);
      if (!passed) {
         verdict = 'Wrong Answer';
      }
   } catch (err) {
      error = err.message;
      actualOutput = err.message;
      passed = false;
      verdict = err.verdict || 'Runtime Error';
   }

   return {
      output: actualOutput,
      passed,
      verdict,
      error
   };
}

// GET /api/code/challenges — List all challenges (SECURITY: Excludes hidden_test_cases)
router.get('/challenges', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('code_challenges')
         .select('*')
         .order('created_at', { ascending: false });

      if (error) throw error;

      const challenges = (data || []).map(formatCodeChallenge);
      res.json({ success: true, count: challenges.length, challenges });
   } catch (err) {
      next(err);
   }
});

// Helper: Resolve challenge record by UUID or by title tag (e.g. CA001)
async function getChallengeRecord(identifier) {
   if (!identifier) return null;
   const idStr = String(identifier).trim();
   const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idStr);

   if (isUuid) {
      const { data } = await supabase.from('code_challenges').select('*').eq('id', idStr);
      if (data && data.length > 0) return data[0];
   }

   const { data: titleMatch } = await supabase.from('code_challenges').select('*').ilike('title', `%${idStr}%`);
   if (titleMatch && titleMatch.length > 0) return titleMatch[0];

   return null;
}

// Helper: Extract sample and hidden test cases regardless of schema format
function getChallengeTestCases(raw) {
   let sampleCases = [];
   let hiddenCases = [];

   if (Array.isArray(raw.sample_test_cases) && raw.sample_test_cases.length > 0) {
      sampleCases = raw.sample_test_cases;
   }
   if (Array.isArray(raw.hidden_test_cases) && raw.hidden_test_cases.length > 0) {
      hiddenCases = raw.hidden_test_cases;
   }

   if (sampleCases.length === 0 && hiddenCases.length === 0 && Array.isArray(raw.test_cases)) {
      sampleCases = raw.test_cases.filter(t => !t.isHidden);
      hiddenCases = raw.test_cases.filter(t => t.isHidden);
   }

   return { sampleCases, hiddenCases };
}

// GET /api/code/challenges/:id — Get single challenge (SECURITY: Excludes hidden_test_cases)
router.get('/challenges/:id', async (req, res, next) => {
   try {
      const raw = await getChallengeRecord(req.params.id);
      if (!raw) {
         return res.status(404).json({ success: false, message: 'Challenge not found.' });
      }

      const challenge = formatCodeChallenge(raw);
      res.json({ success: true, challenge });
   } catch (err) {
      next(err);
   }
});

// POST /api/code/run — Test code submission against sample & hidden test cases
router.post('/run', protect, async (req, res, next) => {
   try {
      const { challengeId, language, code } = req.body;

      // 1. Validate source code
      const validation = validateSourceCode(language, code);
      if (!validation.valid) {
         return res.json({
            success: true,
            status: validation.status,
            score: 0,
            maxScore: 100,
            logs: [
               `[Code Arena Judge] Validation: ${validation.message}`,
               `[Code Arena Judge] Verdict: ${validation.status} | Score: 0/100`
            ],
            testResults: [],
            compilationError: null
         });
      }

      // 2. Fetch challenge
      const raw = await getChallengeRecord(challengeId);
      if (!raw) {
         return res.status(404).json({ success: false, message: 'Challenge not found.' });
      }

      const maxPoints = raw.points || 100;
      const { sampleCases, hiddenCases } = getChallengeTestCases(raw);
      const totalCount = sampleCases.length + hiddenCases.length;

      const logs = [
         `[Code Arena Judge] Initializing ${(language || 'Python').toUpperCase()} execution environment...`,
         `[Code Arena Judge] Running ${totalCount} test cases...`
      ];

      const testResults = [];
      let passedCount = 0;
      let fatalVerdict = null;
      let compilationDetails = null;

      // Evaluate Sample Cases
      for (const tc of sampleCases) {
         const evalRes = executeTestCase(language, code, tc.input, tc.output);
         if (evalRes.passed) {
            passedCount++;
         } else if (evalRes.verdict && !fatalVerdict) {
            if (evalRes.verdict === 'Judge Error' || evalRes.verdict === 'Compilation Error' || evalRes.verdict === 'Time Limit Exceeded' || evalRes.verdict === 'Runtime Error') {
               fatalVerdict = evalRes.verdict;
               if (evalRes.verdict === 'Compilation Error') compilationDetails = evalRes.error;
            }
         }

         testResults.push({
            input: tc.input,
            expected: tc.output,
            output: evalRes.output,
            passed: evalRes.passed,
            verdict: evalRes.verdict,
            error: evalRes.error,
            isHidden: false
         });

         if (fatalVerdict === 'Compilation Error' || fatalVerdict === 'Judge Error' || fatalVerdict === 'Time Limit Exceeded') break;
      }

      // Evaluate Hidden Cases (SECURITY: Input/output strictly omitted)
      if (fatalVerdict !== 'Compilation Error' && fatalVerdict !== 'Judge Error' && fatalVerdict !== 'Time Limit Exceeded') {
         for (const tc of hiddenCases) {
            const evalRes = executeTestCase(language, code, tc.input, tc.output);
            if (evalRes.passed) {
               passedCount++;
            } else if (evalRes.verdict && !fatalVerdict) {
               if (evalRes.verdict === 'Judge Error' || evalRes.verdict === 'Compilation Error' || evalRes.verdict === 'Time Limit Exceeded' || evalRes.verdict === 'Runtime Error') {
                  fatalVerdict = evalRes.verdict;
               }
            }

            testResults.push({
               passed: evalRes.passed,
               verdict: evalRes.verdict,
               isHidden: true
            });

            if (fatalVerdict === 'Compilation Error' || fatalVerdict === 'Judge Error' || fatalVerdict === 'Time Limit Exceeded') break;
         }
      }

      // Overall status and score
      let overallStatus;
      let score;

      if (fatalVerdict) {
         overallStatus = fatalVerdict;
         score = 0;
      } else if (totalCount > 0 && passedCount === totalCount) {
         overallStatus = 'Accepted';
         score = maxPoints;
      } else {
         overallStatus = 'Wrong Answer';
         score = totalCount > 0 ? Math.round((passedCount / totalCount) * maxPoints) : 0;
      }

      logs.push(`[Code Arena Judge] Execution finished: ${passedCount}/${totalCount} Test Cases Passed.`);
      logs.push(`[Code Arena Judge] Verdict: ${overallStatus} | Score: ${score}/${maxPoints}`);

      res.json({
         success: true,
         status: overallStatus,
         score,
         maxScore: maxPoints,
         logs,
         testResults,
         compilationError: compilationDetails
      });
   } catch (err) {
      next(err);
   }
});

// POST /api/code/submit — Submit code solution to Online Judge
router.post('/submit', protect, async (req, res, next) => {
   try {
      const { challengeId, language, code } = req.body;
      const user = req.user;

      // 1. Fetch challenge
      const raw = await getChallengeRecord(challengeId);
      if (!raw) {
         return res.status(404).json({ success: false, message: 'Challenge not found.' });
      }

      const match = (raw.title || '').match(/\[(CA\d+)\]/i);
      const pId = match ? match[1] : (raw.code_id || raw.id);
      const maxPoints = raw.points || 100;
      const { sampleCases, hiddenCases } = getChallengeTestCases(raw);
      const totalCount = sampleCases.length + hiddenCases.length;
      const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user && user.id);

      // 2. Validate source code before execution
      const validation = validateSourceCode(language, code);
      if (!validation.valid) {
         // Persist failed submission with 0 points
         const { data: subRaw } = await supabase
            .from('submissions')
            .insert([{
               challenge_id: raw.id,
               user_id: isUserUuid ? user.id : null,
               language: language || 'python',
               code: code || '',
               status: validation.status,
               result: {
                  passed: 0,
                  total: totalCount,
                  score: 0,
                  maxScore: maxPoints,
                  output: validation.message
               }
            }])
            .select()
            .single();

         const submission = subRaw ? formatSubmission(subRaw) : {
            id: 'sub_invalid',
            userId: user.id,
            challengeId: pId,
            language: language || 'python',
            code: code || '',
            status: validation.status,
            score: 0,
            maxScore: maxPoints,
            passedTests: 0,
            totalTests: totalCount,
            output: validation.message
         };
         submission.challengeId = pId;

         return res.json({
            success: true,
            submission,
            runResult: {
               status: validation.status,
               testResults: [],
               score: 0,
               maxScore: maxPoints,
               logs: [`[Code Arena Judge] Verdict: ${validation.status} | Score: 0/100`],
               compilationError: null
            }
         });
      }

      const testResults = [];
      let passedCount = 0;
      let fatalVerdict = null;
      let compilationDetails = null;

      // 3. Evaluate Sample Cases
      for (const tc of sampleCases) {
         const evalRes = executeTestCase(language, code, tc.input, tc.output);
         if (evalRes.passed) {
            passedCount++;
         } else if (evalRes.verdict && !fatalVerdict) {
            if (evalRes.verdict === 'Judge Error' || evalRes.verdict === 'Compilation Error' || evalRes.verdict === 'Time Limit Exceeded' || evalRes.verdict === 'Runtime Error') {
               fatalVerdict = evalRes.verdict;
               if (evalRes.verdict === 'Compilation Error') compilationDetails = evalRes.error;
            }
         }

         testResults.push({
            input: tc.input,
            expected: tc.output,
            output: evalRes.output,
            passed: evalRes.passed,
            verdict: evalRes.verdict,
            error: evalRes.error,
            isHidden: false
         });

         if (fatalVerdict === 'Compilation Error' || fatalVerdict === 'Judge Error' || fatalVerdict === 'Time Limit Exceeded') break;
      }

      // 4. Evaluate Hidden Cases (SECURITY: Input/output strictly omitted)
      if (fatalVerdict !== 'Compilation Error' && fatalVerdict !== 'Judge Error' && fatalVerdict !== 'Time Limit Exceeded') {
         for (const tc of hiddenCases) {
            const evalRes = executeTestCase(language, code, tc.input, tc.output);
            if (evalRes.passed) {
               passedCount++;
            } else if (evalRes.verdict && !fatalVerdict) {
               if (evalRes.verdict === 'Judge Error' || evalRes.verdict === 'Compilation Error' || evalRes.verdict === 'Time Limit Exceeded' || evalRes.verdict === 'Runtime Error') {
                  fatalVerdict = evalRes.verdict;
               }
            }

            testResults.push({
               passed: evalRes.passed,
               verdict: evalRes.verdict,
               isHidden: true
            });

            if (fatalVerdict === 'Compilation Error' || fatalVerdict === 'Judge Error' || fatalVerdict === 'Time Limit Exceeded') break;
         }
      }

      // 5. Calculate Final Verdict & Score
      let overallStatus;
      let score;

      if (fatalVerdict) {
         overallStatus = fatalVerdict;
         score = 0;
      } else if (totalCount > 0 && passedCount === totalCount) {
         overallStatus = 'Accepted';
         score = maxPoints;
      } else {
         overallStatus = 'Wrong Answer';
         score = totalCount > 0 ? Math.round((passedCount / totalCount) * maxPoints) : 0;
      }

      const isPassed = overallStatus === 'Accepted' && passedCount === totalCount && totalCount > 0;

      // 6. Persist Submission Record in Supabase
      const { data: subRaw, error: subError } = await supabase
         .from('submissions')
         .insert([{
            challenge_id: raw.id,
            user_id: isUserUuid ? user.id : null,
            language: language || 'python',
            code: code || '',
            status: overallStatus,
            result: {
               passed: passedCount,
               total: totalCount,
               score: score,
               maxScore: maxPoints,
               output: isPassed 
                  ? 'All test cases passed successfully!' 
                  : `${passedCount}/${totalCount} test cases passed. Verdict: ${overallStatus}`
            }
         }])
         .select()
         .single();

      if (subError || !subRaw) throw subError || new Error('Failed to record submission');

      // 7. Gamification Award (XP / Coins) — Deduplicated: awarded only once per problem
      if (isPassed && isUserUuid) {
         const { data: priorAccepted } = await supabase
            .from('submissions')
            .select('id')
            .eq('user_id', user.id)
            .eq('challenge_id', raw.id)
            .eq('status', 'Accepted')
            .neq('id', subRaw.id);

         if (!priorAccepted || priorAccepted.length === 0) {
            const currentXp = user.xp || 250;
            const currentCoins = user.coins || 50;
            await supabase
               .from('users')
               .update({
                  xp: currentXp + 200,
                  coins: currentCoins + 20
               })
               .eq('id', user.id);
         }
      }

      const submission = formatSubmission(subRaw);
      submission.challengeId = pId;
      submission.score = score;
      submission.maxScore = maxPoints;

      res.json({
         success: true,
         submission,
         runResult: {
            status: overallStatus,
            testResults,
            score,
            maxScore: maxPoints,
            logs: [
               `[Code Arena Judge] Execution finished: ${passedCount}/${totalCount} test cases passed.`,
               `[Code Arena Judge] Verdict: ${overallStatus} | Score: ${score}/${maxPoints}`
            ],
            compilationError: compilationDetails
         }
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/code/submissions — Get current user's submissions
router.get('/submissions', protect, async (req, res, next) => {
   try {
      const { challengeId } = req.query;
      const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.user && req.user.id);
      
      let reqQuery = supabase
         .from('submissions')
         .select('*');

      if (isUserUuid) {
         reqQuery = reqQuery.eq('user_id', req.user.id);
      }

      if (challengeId) {
         const raw = await getChallengeRecord(challengeId);
         if (raw) {
            reqQuery = reqQuery.eq('challenge_id', raw.id);
         }
      }

      const { data, error } = await reqQuery.order('created_at', { ascending: false });
      if (error) throw error;

      const submissions = (data || []).map(s => {
         const formatted = formatSubmission(s);
         formatted.language = s.language || 'python';
         return formatted;
      });

      res.json({ success: true, submissions });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
