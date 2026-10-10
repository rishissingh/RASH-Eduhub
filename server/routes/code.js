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
 * Output Normalizer (Ignores trailing/leading whitespace and collapses spaces)
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
         return require(moduleName);
      },
      Buffer,
      process: {
         stdin: { read: () => inputStr },
         stdout: { write: (data) => logs.push(data) }
      },
      Map, Set, BigInt, Array, Object, Math, parseInt, parseFloat, String, Number, Boolean, ArrayBuffer
   };

   const context = vm.createContext(sandbox);
   const script = new vm.Script(code, { timeout: 3000 });
   script.runInContext(context);

   return logs.join('\n');
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
      const stderr = err.stderr ? err.stderr.toString() : err.message;
      throw new Error(stderr || 'Python execution error');
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
      execSync(`javac "${javaPath}"`, {
         cwd: workDir,
         timeout: 6000,
         encoding: 'utf-8',
         stdio: ['pipe', 'pipe', 'pipe']
      });

      const output = execSync(`java -cp . ${className}`, {
         cwd: workDir,
         input: inputStr,
         timeout: 4000,
         encoding: 'utf-8',
         stdio: ['pipe', 'pipe', 'pipe']
      });

      return output;
   } catch (err) {
      const stderr = err.stderr ? err.stderr.toString() : err.message;
      throw new Error(stderr || 'Java compilation or execution error');
   } finally {
      try {
         fs.rmSync(workDir, { recursive: true, force: true });
      } catch (_) {}
   }
}

function runCppOrFallbackSolver(problemId, language, code, inputStr) {
   const cleanCode = (code || '').trim();
   if (!cleanCode || cleanCode.includes('Write your solution here') || cleanCode.includes('TODO') || cleanCode.length < 40) {
      return '';
   }

   // Attempt execution with g++ if available
   try {
      const tmpDir = os.tmpdir();
      const binId = `cpp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const srcPath = path.join(tmpDir, `${binId}.cpp`);
      const exePath = path.join(tmpDir, `${binId}.exe`);
      fs.writeFileSync(srcPath, code, 'utf8');

      try {
         execSync(`g++ -O2 "${srcPath}" -o "${exePath}"`, { timeout: 5000, stdio: ['pipe', 'pipe', 'pipe'] });
         const output = execSync(`"${exePath}"`, { input: inputStr, timeout: 3000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
         return output;
      } finally {
         try { if (fs.existsSync(srcPath)) fs.unlinkSync(srcPath); } catch (_) {}
         try { if (fs.existsSync(exePath)) fs.unlinkSync(exePath); } catch (_) {}
      }
   } catch (gppErr) {
      if (gppErr.message.includes('not recognized') || gppErr.message.includes('cannot find')) {
         return 'C++ execution requires g++ compiler on host system. Please test using Python, Java, or JavaScript.';
      }
      throw gppErr;
   }
}

/**
 * Execute User Solution against Stdin and Return Stdout
 */
function evaluateSubmission(language, code, inputStr, expectedOutput, problemId) {
   const normalizedExpected = normalizeOutput(expectedOutput);
   let actualOutput = '';
   let passed = false;
   let error = null;

   try {
      const lang = (language || 'javascript').toLowerCase();

      if (lang === 'javascript' || lang === 'js') {
         actualOutput = runJsUserCode(code, inputStr);
      } else if (lang === 'python' || lang === 'py') {
         actualOutput = runPythonUserCode(code, inputStr);
      } else if (lang === 'java') {
         actualOutput = runJavaUserCode(code, inputStr);
      } else {
         actualOutput = runCppOrFallbackSolver(problemId, language, code, inputStr);
      }

      const normalizedActual = normalizeOutput(actualOutput);
      passed = (normalizedActual === normalizedExpected);
   } catch (err) {
      error = err.message;
      passed = false;
      actualOutput = err.message;
   }

   return {
      output: actualOutput,
      passed,
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

      // formatCodeChallenge intentionally strips hidden_test_cases
      const challenges = (data || []).map(formatCodeChallenge);
      res.json({ success: true, count: challenges.length, challenges });
   } catch (err) {
      next(err);
   }
});

// GET /api/code/challenges/:id — Get single challenge (SECURITY: Excludes hidden_test_cases)
router.get('/challenges/:id', async (req, res, next) => {
   try {
      const idParam = req.params.id;
      let reqQuery = supabase
         .from('code_challenges')
         .select('*')
         .or(`id.eq.${idParam},code_id.eq.${idParam}`);

      const { data, error } = await reqQuery;

      if (error || !data || data.length === 0) {
         return res.status(404).json({ success: false, message: 'Challenge not found.' });
      }

      const challenge = formatCodeChallenge(data[0]);
      res.json({ success: true, challenge });
   } catch (err) {
      next(err);
   }
});

// POST /api/code/run — Test code submission against sample & hidden test cases
router.post('/run', protect, async (req, res, next) => {
   try {
      const { challengeId, language, code } = req.body;

      // Fetch raw record from DB including hidden_test_cases (kept on server)
      const { data: rawList } = await supabase
         .from('code_challenges')
         .select('*')
         .or(`id.eq.${challengeId},code_id.eq.${challengeId}`);

      if (!rawList || rawList.length === 0) {
         return res.status(404).json({ success: false, message: 'Challenge not found.' });
      }

      const raw = rawList[0];
      const pId = raw.code_id || raw.id;

      const sampleCases = Array.isArray(raw.sample_test_cases) ? raw.sample_test_cases : [];
      const hiddenCases = Array.isArray(raw.hidden_test_cases) ? raw.hidden_test_cases : [];

      const logs = [
         `[Code Arena Judge] Initializing ${language || 'Python'} execution sandbox...`,
         `[Code Arena Judge] Input stdin loaded. Running test cases...`,
      ];

      const testResults = [];
      let passedCount = 0;

      // 1. Evaluate Sample Test Cases (Returned with input & expected output)
      sampleCases.forEach((tc, idx) => {
         const evalRes = evaluateSubmission(language, code, tc.input, tc.output, pId);
         if (evalRes.passed) passedCount++;

         testResults.push({
            input: tc.input,
            expected: tc.output,
            output: evalRes.output,
            passed: evalRes.passed,
            error: evalRes.error,
            isHidden: false
         });
      });

      // 2. Evaluate Hidden Test Cases (SECURITY: Input and Expected output strictly OMITTED)
      hiddenCases.forEach((tc, idx) => {
         const evalRes = evaluateSubmission(language, code, tc.input, tc.output, pId);
         if (evalRes.passed) passedCount++;

         testResults.push({
            passed: evalRes.passed,
            isHidden: true
         });
      });

      const totalCount = sampleCases.length + hiddenCases.length;
      const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

      logs.push(`[Code Arena Judge] Execution finished: ${passedCount}/${totalCount} Test Cases Passed.`);

      res.json({
         success: true,
         logs,
         testResults,
         score,
         compilationError: null
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

      const { data: rawList } = await supabase
         .from('code_challenges')
         .select('*')
         .or(`id.eq.${challengeId},code_id.eq.${challengeId}`);

      if (!rawList || rawList.length === 0) {
         return res.status(404).json({ success: false, message: 'Challenge not found.' });
      }

      const raw = rawList[0];
      const pId = raw.code_id || raw.id;

      const sampleCases = Array.isArray(raw.sample_test_cases) ? raw.sample_test_cases : [];
      const hiddenCases = Array.isArray(raw.hidden_test_cases) ? raw.hidden_test_cases : [];

      const testResults = [];
      let passedCount = 0;

      // Evaluate Sample Cases
      sampleCases.forEach((tc) => {
         const evalRes = evaluateSubmission(language, code, tc.input, tc.output, pId);
         if (evalRes.passed) passedCount++;
         testResults.push({
            input: tc.input,
            expected: tc.output,
            output: evalRes.output,
            passed: evalRes.passed,
            isHidden: false
         });
      });

      // Evaluate Hidden Cases (Inputs/outputs omitted for security)
      hiddenCases.forEach((tc) => {
         const evalRes = evaluateSubmission(language, code, tc.input, tc.output, pId);
         if (evalRes.passed) passedCount++;
         testResults.push({
            passed: evalRes.passed,
            isHidden: true
         });
      });

      const totalCount = sampleCases.length + hiddenCases.length;
      const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
      const isPassed = totalCount > 0 && passedCount === totalCount && score === 100;

      const { data: subRaw, error } = await supabase
         .from('submissions')
         .insert([{
            challenge_id: String(pId),
            user_id: String(user.id),
            code: code || '',
            status: isPassed ? 'Accepted' : 'Wrong Answer',
            passed_tests: passedCount,
            total_tests: totalCount,
            output: isPassed ? 'All test cases passed successfully!' : `${passedCount}/${totalCount} test cases passed.`
         }])
         .select()
         .single();

      if (error || !subRaw) throw error || new Error('Failed to record submission');

      const submission = formatSubmission(subRaw);
      submission.language = language || 'python';
      submission.score = score;

      res.json({
         success: true,
         submission,
         runResult: {
            testResults,
            score,
            compilationError: null
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
      let reqQuery = supabase
         .from('submissions')
         .select('*')
         .eq('user_id', String(req.user.id));

      if (challengeId) {
         reqQuery = reqQuery.eq('challenge_id', String(challengeId));
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
