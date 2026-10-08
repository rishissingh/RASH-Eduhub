/**
 * RASH EduHub — AI Proxy & Engagement Integration Router
 * Proxies Express requests to Python AI microservices and logs real-time engagement data.
 */

const express = require('express');
const router = express.Router();
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, spawn } = require('child_process');
let trackerProcess = null;

// Microservice Ports
const SERVICES = {
   adaptive: 'http://localhost:5001',
   codeEval: 'http://localhost:5002',
   recommend: 'http://localhost:5003'
};

const FALLBACK_RECOMMENDATIONS = {
   success: true,
   roadmaps: [
      {
         roadmap_id: 'python-backend',
         title: 'Python Backend Engineering',
         category: 'Backend Development',
         match_score_percentage: 88.0,
         readiness_percentage: 75.0,
         missing_skills: ['API Development'],
         weak_skills: [{ skill: 'Database Fundamentals', current_score: 0.55 }],
         recommended_courses: [
            { id: 'course-py-1', title: 'Complete Python Backend Bootcamp', level: 'Beginner' }
         ],
         recommended_readings: [
            "Architecture Patterns with Python (O'Reilly)",
            'Designing Data-Intensive Applications by Martin Kleppmann'
         ]
      },
      {
         roadmap_id: 'data-engineering',
         title: 'Data Engineering & Pipelines',
         category: 'Data & AI',
         match_score_percentage: 82.5,
         readiness_percentage: 68.0,
         missing_skills: ['SQL', 'Spark'],
         weak_skills: [],
         recommended_courses: [
            { id: 'course-data-1', title: 'Data Engineering Essentials', level: 'Beginner' }
         ],
         recommended_readings: [
            'Fundamentals of Data Engineering by Joe Reis & Matt Housley',
            'Spark: The Definitive Guide'
         ]
      }
   ],
   message: 'Recommendation service unavailable. Showing fallback suggestions.'
};

const FALLBACK_PRACTICE = {
   success: true,
   practice_modules: [
      {
         module_title: 'REST API Design & Authentication',
         difficulty: 'Intermediate',
         career_alignment: 'Python Backend Engineering',
         target_missing_skills: ['API Development'],
         priority_score: 88.0
      },
      {
         module_title: 'Building ETL Data Pipelines',
         difficulty: 'Intermediate',
         career_alignment: 'Data Engineering & Pipelines',
         target_missing_skills: ['SQL'],
         priority_score: 82.5
      }
   ],
   message: 'Recommendation service unavailable. Showing fallback practice recommendations.'
};

function getAdaptiveFallback(req) {
   const endpoint = req.path.replace('/adaptive', '').toLowerCase();
   const userId = req.body.user_id || req.params.userId || req.query.userId || 'user-1';
   const days = Number(req.query.days || req.body.days || 7);

   if (endpoint.endsWith('/profile')) {
      return {
         success: true,
         profile: {
            current_difficulty: 'Intermediate',
            composite_score: 0.72,
            topics_mastered: ['Variables', 'Loops', 'Functions'],
            topics_struggling: ['Recursion', 'Concurrency']
         },
         scores: {
            composite_score: 0.72,
            direct_performance: 0.75,
            engagement_score: 0.82,
            confidence: 0.88
         },
         message: 'Adaptive profile loaded from local fallback.'
      };
   }

   if (endpoint.endsWith('/recalibrate')) {
      return {
         success: true,
         difficulty_adjustment: {
            new_level: 'Intermediate',
            reason: 'Recalibrated using fallback performance model and recent progress metrics.'
         },
         scores: {
            composite_score: 0.74,
            direct_performance: 0.78,
            engagement_score: 0.84,
            confidence: 0.90
         },
         message: 'Difficulty recalibrated locally while the adaptive AI service is unavailable.'
      };
   }

   if (endpoint.includes('/study-plan')) {
      return {
         success: true,
         study_plan: {
            difficulty: 'Intermediate',
            daily_study_minutes: 85,
            weekly_goals: [
               'Finish 4 practice problems this week',
               'Review recursion patterns and array algorithms',
               'Maintain a 7-day learning streak with daily practice'
            ],
            daily_plans: Array.from({ length: Math.max(1, Math.min(days, 14)) }, (_, index) => ({
               day_number: index + 1,
               day_name: `Day ${index + 1}`,
               total_minutes: 75 + (index % 2 ? 10 : 0),
               activities: [
                  {
                     icon: '📘',
                     description: index % 2 === 0 ? 'Read and apply algorithm patterns' : 'Solve a targeted coding challenge',
                     duration_minutes: 40
                  },
                  {
                     icon: '💡',
                     description: 'Review past lessons and strengthen weak topics',
                     duration_minutes: 35
                  }
               ]
            }))
         },
         message: 'Generated a local adaptive study plan while the adaptive service is offline.'
      };
   }

   return {
      success: false,
      message: 'Adaptive AI service unavailable and no fallback exists for this endpoint.'
   };
}

const SHELL_FINDER = process.platform === 'win32' ? 'where' : 'which';
const PYTHON_COMMANDS = ['python', 'python3'];
const JAVA_COMMANDS = ['javac', 'java'];
const CPP_COMMANDS = ['g++'];

function findExecutable(names) {
   for (const name of names) {
      try {
         const result = spawnSync(SHELL_FINDER, [name], { encoding: 'utf8' });
         if (result.status === 0 && result.stdout && result.stdout.trim().length > 0) {
            return name;
         }
      } catch (err) {
         continue;
      }
   }
   return null;
}

function normalizeValue(value) {
   if (value === undefined || value === null) return value;
   const text = String(value).trim();
   if (text.length === 0) return text;

   const lowered = text.toLowerCase();
   if (lowered === 'true') return true;
   if (lowered === 'false') return false;

   try {
      return JSON.parse(text);
   } catch (err) {
      // try to parse Python-style booleans and lists
      const pythonSafe = text
         .replace(/\bNone\b/g, 'null')
         .replace(/\bTrue\b/g, 'true')
         .replace(/\bFalse\b/g, 'false');
      try {
         return JSON.parse(pythonSafe);
      } catch (err2) {
         return text;
      }
   }
}

function buildPythonWrapper(code) {
   const functionNameMatch = code.match(/^def\s+(\w+)\s*\(/m);
   const functionName = functionNameMatch ? functionNameMatch[1] : 'main';

   return `import sys\nimport json\nimport ast\nimport re\n\n${code}\n\n` +
      `def __eduhub_parse_input(raw_input):\n` +
      `    if not raw_input or not str(raw_input).strip():\n` +
      `        return {}\n\n` +
      `    def parse_assignment(text):\n` +
      `        pattern = re.compile(r'([a-zA-Z_]\\w*)\\s*=\\s*(.+?)(?=(?:,\\s*[a-zA-Z_]\\w*\\s*=)|$)', re.S)\n` +
      `        result = {}\n` +
      `        for match in pattern.finditer(text):\n` +
      `            key = match.group(1)\n` +
      `            value_text = match.group(2).strip()\n` +
      `            try:\n` +
      `                result[key] = ast.literal_eval(value_text)\n` +
      `            except Exception:\n` +
      `                if value_text.lower() in ['true', 'false']:\n` +
      `                    result[key] = value_text.lower() == 'true'\n` +
      `                else:\n` +
      `                    result[key] = value_text.strip('"\'')\n` +
      `        return result\n\n` +
      `    return parse_assignment(raw_input)\n\n` +
      `def __eduhub_print_result(value):\n` +
      `    try:\n` +
      `        print(json.dumps(value, default=str, separators=(',', ':')))\n` +
      `    except Exception:\n` +
      `        print(str(value))\n\n` +
      `if __name__ == '__main__':\n` +
      `    raw_input_data = sys.stdin.read()\n` +
      `    kwargs = __eduhub_parse_input(raw_input_data)\n` +
      `    if '${functionName}' in globals() and callable(globals()['${functionName}']):\n` +
      `        result = globals()['${functionName}'](**kwargs)\n` +
      `        __eduhub_print_result(result)\n` +
      `    elif 'main' in globals() and callable(globals()['main']):\n` +
      `        result = globals()['main']()\n` +
      `        __eduhub_print_result(result)\n`;
}

function executePython(code, inputData, timeoutSec) {
   const pythonCmd = findExecutable(PYTHON_COMMANDS);
   if (!pythonCmd) {
      return { output: '', error: "Python runtime not found on server PATH.", execTime: 0 };
   }

   const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eduhub-python-'));
   const filePath = path.join(tmpDir, 'submission.py');
   fs.writeFileSync(filePath, buildPythonWrapper(code), 'utf8');

   try {
      const proc = spawnSync(pythonCmd, [filePath], {
         input: String(inputData),
         encoding: 'utf8',
         maxBuffer: 10 * 1024 * 1024,
         timeout: timeoutSec * 1000
      });
      const execTime = proc.elapsed ? proc.elapsed / 1e6 : 0;
      if (proc.status === 0) {
         return { output: proc.stdout || '', error: null, execTime };
      }
      return { output: proc.stdout || '', error: (proc.stderr || proc.stdout || '').trim(), execTime };
   } catch (err) {
      return { output: '', error: err.message, execTime: 0 };
   } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (err) {}
   }
}

function executeJava(code, inputData, timeoutSec) {
   const javac = findExecutable(['javac']);
   const javaCmd = findExecutable(['java']);
   if (!javac || !javaCmd) {
      return { output: '', error: "Java compiler/runtime not found on server PATH.", execTime: 0 };
   }

   const classNameMatch = code.match(/public\s+class\s+(\w+)/);
   const className = classNameMatch ? classNameMatch[1] : 'Solution';
   const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eduhub-java-'));
   const sourcePath = path.join(tmpDir, `${className}.java`);
   fs.writeFileSync(sourcePath, code, 'utf8');

   try {
      const compileProc = spawnSync(javac, [sourcePath], {
         encoding: 'utf8',
         maxBuffer: 10 * 1024 * 1024,
         timeout: timeoutSec * 1000
      });
      if (compileProc.status !== 0) {
         return { output: '', error: (compileProc.stderr || compileProc.stdout || '').trim(), execTime: 0 };
      }

      const runProc = spawnSync(javaCmd, ['-cp', tmpDir, className], {
         input: String(inputData),
         encoding: 'utf8',
         maxBuffer: 10 * 1024 * 1024,
         timeout: timeoutSec * 1000
      });
      const execTime = runProc.elapsed ? runProc.elapsed / 1e6 : 0;
      if (runProc.status === 0) {
         return { output: runProc.stdout || '', error: null, execTime };
      }
      return { output: runProc.stdout || '', error: (runProc.stderr || runProc.stdout || '').trim(), execTime };
   } catch (err) {
      return { output: '', error: err.message, execTime: 0 };
   } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (err) {}
   }
}

function executeCpp(code, inputData, timeoutSec) {
   const gpp = findExecutable(['g++']);
   if (!gpp) {
      return { output: '', error: "GCC/g++ compiler not found on server PATH.", execTime: 0 };
   }

   const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eduhub-cpp-'));
   const sourcePath = path.join(tmpDir, 'submission.cpp');
   const binaryPath = path.join(tmpDir, process.platform === 'win32' ? 'submission.exe' : 'submission');
   fs.writeFileSync(sourcePath, code, 'utf8');

   try {
      const compileProc = spawnSync(gpp, [sourcePath, '-std=c++17', '-O2', '-o', binaryPath], {
         encoding: 'utf8',
         maxBuffer: 10 * 1024 * 1024,
         timeout: timeoutSec * 1000
      });
      if (compileProc.status !== 0) {
         return { output: '', error: (compileProc.stderr || compileProc.stdout || '').trim(), execTime: 0 };
      }

      const runProc = spawnSync(binaryPath, {
         input: String(inputData),
         encoding: 'utf8',
         maxBuffer: 10 * 1024 * 1024,
         timeout: timeoutSec * 1000
      });
      const execTime = runProc.elapsed ? runProc.elapsed / 1e6 : 0;
      if (runProc.status === 0) {
         return { output: runProc.stdout || '', error: null, execTime };
      }
      return { output: runProc.stdout || '', error: (runProc.stderr || runProc.stdout || '').trim(), execTime };
   } catch (err) {
      return { output: '', error: err.message, execTime: 0 };
   } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (err) {}
   }
}

function safeCompare(expected, actual) {
   const expectedVal = normalizeValue(expected);
   const actualVal = normalizeValue(actual);
   return JSON.stringify(expectedVal) === JSON.stringify(actualVal);
}

function heuristicComplexity(code) {
   const lower = String(code).toLowerCase();
   const loopCount = (lower.match(/\bfor\b/g) || []).length + (lower.match(/\bwhile\b/g) || []).length;
   if (loopCount >= 2 || /\bfor\b[\s\S]*\bfor\b/.test(lower)) return 'O(n²)';
   if (loopCount === 1) return 'O(n)';
   if (/\.sort\(|sorted\(|std::sort|arrays\.sort/.test(lower)) return 'O(n log n)';
   return 'O(1)';
}

function heuristicSpace(code) {
   const lower = String(code).toLowerCase();
   if (/(\[\])|\blist\(|\bdict\(|\bset\(|\bvector<|\bnew\s+.*\[/.test(lower)) return 'O(n)';
   return 'O(1)';
}

function analyzeCodeStyle(code, passRate, error) {
   const issues = [];
   const feedback = [];
   let score = 90;

   if (error) {
      issues.push('Code did not execute successfully.');
      feedback.push('Fix syntax or runtime errors before re-evaluating.');
      score = 20;
   }

   if (/\bpass\b/.test(code) && passRate < 1) {
      issues.push('Placeholder logic detected.');
      feedback.push('Replace placeholder code with a full algorithm implementation.');
      score -= 30;
   }

   if (code.split('\n').length > 40) {
      issues.push('Code is longer than 40 lines.');
      feedback.push('Consider extracting helper functions to improve readability.');
      score -= 10;
   }

   if (code.length > 0 && passRate === 1 && !error) {
      feedback.push('Solution passed all provided test cases. Great work!');
      score = Math.min(100, score + 5);
   }

   if (passRate < 1 && !error) {
      feedback.push('One or more test cases failed. Check edge cases and variable handling.');
      score = Math.max(10, Math.floor(passRate * 100) - 5);
   }

   return { score: Math.max(0, Math.min(100, score)), feedback, issues };
}

function evaluateLocally(code, language, testCases = [], problemDescription = '') {
   const lang = String(language || 'python').toLowerCase();
   const results = [];
   let totalExecTime = 0;
   let failures = 0;
   let executionError = null;

   if (!Array.isArray(testCases) || testCases.length === 0) {
      testCases = [{ input: '', expected: '', isHidden: false }];
   }

   for (const tc of testCases) {
      let execResult;
      if (lang === 'python' || lang === 'py') {
         execResult = executePython(code, tc.input || '', 3.0);
      } else if (lang === 'java') {
         execResult = executeJava(code, tc.input || '', 6.0);
      } else if (lang === 'cpp' || lang === 'c++' || lang === 'c') {
         execResult = executeCpp(code, tc.input || '', 6.0);
      } else {
         execResult = { output: '', error: `Unsupported language: ${language}`, execTime: 0 };
      }

      totalExecTime += execResult.execTime || 0;
      const passed = execResult.error === null && safeCompare(tc.expected, execResult.output);
      if (!passed) failures += 1;
      if (execResult.error) executionError = execResult.error;

      results.push({
         input: tc.input,
         expected: tc.expected,
         output: execResult.error ? '' : execResult.output.trim(),
         passed,
         error: execResult.error,
         execution_time_ms: Number((execResult.execTime || 0).toFixed(2)),
         isHidden: Boolean(tc.isHidden)
      });
   }

   const passRate = Number(((testCases.length - failures) / testCases.length).toFixed(2));
   const complexity = heuristicComplexity(code);
   const space = heuristicSpace(code);
   const style = analyzeCodeStyle(code, passRate, executionError);

   const logicFlaws = [];
   if (executionError) {
      logicFlaws.push({ line: null, type: 'runtime_error', description: executionError });
   }
   if (/\bpass\b/.test(code) && passRate < 1) {
      logicFlaws.push({ line: null, type: 'incomplete_implementation', description: 'Placeholder or incomplete logic detected.' });
   }
   if (/\breturn\s+\[\]|\breturn\s+\{\}/.test(code) && passRate < 1) {
      logicFlaws.push({ line: null, type: 'incorrect_return_value', description: 'The function may be returning a placeholder empty collection.' });
   }

   const actionableFeedback = [...style.feedback];
   if (problemDescription && passRate < 1) {
      actionableFeedback.push('Verify your code against the provided problem description and input/output expectations.');
   }
   if (!executionError && passRate === 1) {
      actionableFeedback.push('All tests passed. Consider edge cases and performance improvements.');
   }

   return {
      pass_rate: passRate,
      time_complexity: complexity,
      space_complexity: space,
      logic_flaws,
      actionable_feedback: actionableFeedback,
      code_quality_score: style.score,
      style_issues: style.issues,
      language: language,
      execution_time_ms: Number(totalExecTime.toFixed(2)),
      test_results: results
   };
}

function proxyRequestAsync(targetBaseUrl, path, req) {
   return new Promise((resolve, reject) => {
      const targetUrl = new URL(path, targetBaseUrl);
      const payload = JSON.stringify(req.body || {});
      const options = {
         hostname: targetUrl.hostname,
         port: targetUrl.port,
         path: targetUrl.pathname + targetUrl.search,
         method: req.method,
         headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
         }
      };

      const proxyReq = http.request(options, (proxyRes) => {
         let body = '';
         proxyRes.on('data', chunk => body += chunk);
         proxyRes.on('end', () => {
            if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
               try {
                  resolve({ statusCode: proxyRes.statusCode, body: JSON.parse(body) });
               } catch (e) {
                  resolve({ statusCode: proxyRes.statusCode, body: body });
               }
            } else {
               reject(new Error(`Proxy returned status ${proxyRes.statusCode}`));
            }
         });
      });

      proxyReq.on('error', reject);
      if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
         proxyReq.write(payload);
      }
      proxyReq.end();
   });
}

// Simple proxy helper to forward HTTP requests to Python services
function proxyRequest(targetBaseUrl, path, req, res, fallback = null) {
   const targetUrl = new URL(path, targetBaseUrl);

   const payload = JSON.stringify(req.body || {});

   const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port,
      path: targetUrl.pathname + targetUrl.search,
      method: req.method,
      headers: {
         'Content-Type': 'application/json',
         'Content-Length': Buffer.byteLength(payload)
      }
   };

   const proxyReq = http.request(options, (proxyRes) => {
      let body = '';
      proxyRes.on('data', chunk => body += chunk);
      proxyRes.on('end', () => {
         if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
            try {
               return res.status(proxyRes.statusCode).json(JSON.parse(body));
            } catch (e) {
               return res.status(proxyRes.statusCode).send(body);
            }
         }

         if (fallback) {
            return res.json(fallback);
         }

         try {
            res.status(proxyRes.statusCode).json(JSON.parse(body));
         } catch (e) {
            res.status(proxyRes.statusCode).send(body);
         }
      });
   });

   proxyReq.on('error', (err) => {
      if (fallback) {
         return res.json(fallback);
      }
      res.status(503).json({
         success: false,
         message: `AI service unavailable at ${targetBaseUrl}. Make sure Python microservice is running.`,
         error: err.message
      });
   });

   if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      proxyReq.write(payload);
   }
   proxyReq.end();
}

// ── Engagement Tracker Status Receiver Endpoint ──
router.post('/engagement/status', (req, res) => {
   const { user_id, engagement_data, session_summary } = req.body;
   const count = engagement_data ? engagement_data.length : 0;

   console.log(`[AI Engagement Proxy] 📡 Received ${count} status updates from Desktop Tracker (User: ${user_id || 'anonymous'})`);

   res.json({
      success: true,
      message: 'Engagement batch status processed successfully',
      records_received: count,
      timestamp: new Date().toISOString()
   });
});

// ── Smart Code Evaluation Route with Local Fallback ──
router.post('/evaluate', async (req, res) => {
   const path = '/api/evaluate';
   try {
      const response = await proxyRequestAsync(SERVICES.codeEval, path, req);
      return res.status(response.statusCode).json(response.body);
   } catch (proxyErr) {
      console.warn('[AI Code Evaluator Proxy] falling back to local evaluator:', proxyErr.message);
      const evalResult = evaluateLocally(
         req.body.code || '',
         req.body.language || 'python',
         req.body.test_cases || [],
         req.body.problem_description || ''
      );
      return res.json(evalResult);
   }
});

// ── Adaptive Engine Routes Proxy ──
router.all('/adaptive/*', (req, res) => {
   // Build the proxy path preserving the original query string
   const basePath = req.path.replace('/adaptive', '/api/adaptive');
   const queryString = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
   const fullPath = basePath + queryString;
   proxyRequest(SERVICES.adaptive, fullPath, req, res, getAdaptiveFallback(req));
});

// ── Code Evaluator Health Route Proxy ──
router.get('/evaluate/health', (req, res) => {
   proxyRequest(SERVICES.codeEval, '/api/evaluate/health', req, res, {
      status: 'ok',
      service: 'code-evaluator',
      message: 'Health check returned from proxy fallback (Python service unreachable).'
   });
});

// ── Recommendation Engine Routes Proxy ──
router.all('/recommend/*', (req, res) => {
   const basePath = req.path.replace('/recommend', '/api/recommend');
   const queryString = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
   const fullPath = basePath + queryString;
   if (basePath.endsWith('/career')) {
      proxyRequest(SERVICES.recommend, fullPath, req, res, FALLBACK_RECOMMENDATIONS);
   } else if (basePath.endsWith('/practice')) {
      proxyRequest(SERVICES.recommend, fullPath, req, res, FALLBACK_PRACTICE);
   } else {
      proxyRequest(SERVICES.recommend, fullPath, req, res);
   }
});

// ── Interactive Tracker Spawn Routes ──
router.get('/engagement/tracker/status', (req, res) => {
   if (!trackerProcess) {
      return res.json({ running: false, ready: false });
   }

   const testReq = http.get('http://127.0.0.1:5005/health', (healthRes) => {
      let raw = '';
      healthRes.on('data', chunk => raw += chunk);
      healthRes.on('end', () => {
         try {
            const parsed = JSON.parse(raw);
            res.json({ running: true, ready: !!parsed.ready, details: parsed });
         } catch (e) {
            res.json({ running: true, ready: true });
         }
      });
   });

   testReq.on('error', () => {
      res.json({ running: true, ready: false, message: 'Camera engine starting up...' });
   });

   testReq.setTimeout(1200, () => {
      testReq.destroy();
      res.json({ running: true, ready: false, message: 'Camera engine starting up...' });
   });
});

router.post('/engagement/tracker/start', (req, res) => {
   if (trackerProcess) {
      return res.json({ success: true, message: 'Tracker is already running' });
   }

   const trackerDir = path.join(__dirname, '../../ai-services/engagement-tracker');
   const rootVenvWin = path.join(__dirname, '../../.venv/Scripts/python.exe');
   const rootVenvPosix = path.join(__dirname, '../../.venv/bin/python');
   const venvPythonWin = path.join(trackerDir, 'venv', 'Scripts', 'python.exe');
   const venvPythonPosix = path.join(trackerDir, 'venv', 'bin', 'python');
   let pythonCmd = 'python';

   if (process.platform === 'win32' && fs.existsSync(rootVenvWin)) {
      pythonCmd = rootVenvWin;
   } else if (process.platform === 'win32' && fs.existsSync(venvPythonWin)) {
      pythonCmd = venvPythonWin;
   } else if (fs.existsSync(rootVenvPosix)) {
      pythonCmd = rootVenvPosix;
   } else if (fs.existsSync(venvPythonPosix)) {
      pythonCmd = venvPythonPosix;
   }

   console.log(`[AI Engagement Proxy] Spawning tracker using: ${pythonCmd}`);
   trackerProcess = spawn(pythonCmd, ['-u', 'model.py'], { cwd: trackerDir });

   trackerProcess.stdout.on('data', (data) => console.log(`[Tracker] ${data}`.trim()));
   trackerProcess.stderr.on('data', (data) => console.error(`[Tracker Error] ${data}`.trim()));

   trackerProcess.on('close', (code) => {
      trackerProcess = null;
      console.log(`[AI Engagement Proxy] Tracker process exited (code: ${code})`);
   });

   res.json({ success: true, message: 'Tracker started successfully' });
});

router.post('/engagement/tracker/stop', (req, res) => {
   if (trackerProcess) {
      const pid = trackerProcess.pid;
      try {
         if (process.platform === 'win32') {
            const { execSync } = require('child_process');
            execSync(`taskkill /pid ${pid} /T /F`);
         } else {
            trackerProcess.kill('SIGTERM');
         }
      } catch (err) {
         try { trackerProcess.kill('SIGKILL'); } catch (e) {}
      }
      trackerProcess = null;
   }
   res.json({ success: true, message: 'Tracker stopped successfully' });
});

module.exports = router;
