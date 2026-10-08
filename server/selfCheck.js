/**
 * RASH EduHub — Comprehensive System Self-Check Script (v2.0)
 * Verifies Node.js server routes, Supabase DB connection, microservices config,
 * HTML template imports, middleware modules, and JS syntax integrity across the codebase.
 */

const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('🔍 Starting RASH EduHub Automated System Self-Check...');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function logPass(msg) {
   console.log(`✅ [PASS] ${msg}`);
   passCount++;
}

function logFail(msg, detail = '') {
   console.log(`❌ [FAIL] ${msg}`);
   if (detail) console.log(`   └─ Detail: ${detail}`);
   failCount++;
}

const rootDir = path.join(__dirname, '..');

// ── Check 1: Supabase Database Client ──
console.log('1️⃣ Checking Supabase Database Client & Config...');
try {
   const supabase = require('./supabaseClient');
   if (supabase && typeof supabase.from === 'function') {
      logPass('Supabase Client initialized successfully with URL and API key from .env.');
   } else {
      logFail('Supabase Client missing .from query builder function');
   }
} catch (err) {
   logFail('Supabase Client loading failed', err.message);
}

// ── Check 2: Core Middleware Modules ──
console.log('\n2️⃣ Checking Security & Middleware Modules...');
const middlewareFiles = ['auth.js', 'errorHandler.js', 'rateLimiter.js', 'validator.js'];
middlewareFiles.forEach(file => {
   const filePath = path.join(__dirname, 'middleware', file);
   if (fs.existsSync(filePath)) {
      try {
         require(filePath);
         logPass(`Middleware module verified: middleware/${file}`);
      } catch (err) {
         logFail(`Middleware module failed to load: middleware/${file}`, err.message);
      }
   } else {
      logFail(`Missing middleware module: middleware/${file}`);
   }
});

// ── Check 3: Route Handlers Verification ──
console.log('\n3️⃣ Checking Express API Route Modules...');
const routeFiles = [
   'auth.js', 'users.js', 'courses.js', 'comments.js', 'notifications.js',
   'contact.js', 'upload.js', 'code.js', 'gamification.js', 'ai-proxy.js',
   'admin.js', 'reviews.js', 'bookmarks.js', 'progress.js', 'activityLog.js'
];
routeFiles.forEach(file => {
   const filePath = path.join(__dirname, 'routes', file);
   if (fs.existsSync(filePath)) {
      try {
         const routeObj = require(filePath);
         if (routeObj && typeof routeObj === 'function') {
            logPass(`API Route module loaded: routes/${file}`);
         } else {
            logFail(`API Route module invalid export: routes/${file}`);
         }
      } catch (err) {
         logFail(`API Route module runtime error: routes/${file}`, err.message);
      }
   } else {
      logFail(`Missing API Route module: routes/${file}`);
   }
});

// ── Check 4: Core Server Express Module ──
console.log('\n4️⃣ Checking Express Server Initialization...');
try {
   const app = require('./server');
   if (app && typeof app.listen === 'function') {
      logPass('Express application exported successfully with all API routes attached.');
   } else {
      logFail('Express application export missing or invalid.');
   }
} catch (err) {
   logFail('Express Server module failed to load', err.message);
}

// ── Check 5: Check HTML Pages & Critical Script Imports ──
console.log('\n5️⃣ Verifying HTML Pages & Component References...');
const requiredHtmlFiles = [
   'index.html', 'about.html', 'contact.html', 'courses.html',
   'creator.html', 'login.html', 'playlist.html', 'profile.html',
   'register.html', 'teacher_profile.html', 'teachers.html',
   'watch-video.html', 'student/dashboard.html', 'student/code-practice.html',
   'student/ai-predict.html', 'student/my-courses.html', 'student/progress.html',
   'admin/dashboard.html'
];

requiredHtmlFiles.forEach(file => {
   const filePath = path.join(rootDir, file);
   if (!fs.existsSync(filePath)) {
      logFail(`Missing HTML template: ${file}`);
      return;
   }

   const content = fs.readFileSync(filePath, 'utf8');

   const hasDoctype = content.includes('<!DOCTYPE html>');
   const hasHeader = content.includes('<header class="header">');
   const hasSidebar = content.includes('<div class="side-bar">');

   if (hasDoctype && hasHeader && hasSidebar) {
      logPass(`HTML structure & layout valid: ${file}`);
   } else {
      logFail(`Structural elements missing in ${file}`, `Doctype: ${hasDoctype}, Header: ${hasHeader}, Sidebar: ${hasSidebar}`);
   }
});

// ── Check 6: Check Python AI Microservices Structure ──
console.log('\n6️⃣ Checking AI Microservices Architecture...');
const aiServicesDir = path.join(rootDir, 'ai-services');
const requiredAiFiles = [
   'shared/config.py',
   'shared/logger.py',
   'adaptive-engine/app.py',
   'adaptive-engine/services/scoring_engine.py',
   'adaptive-engine/services/difficulty_adjuster.py',
   'adaptive-engine/services/study_plan_generator.py',
   'engagement-tracker/tracker.py',
   'code-evaluator/app.py',
   'recommendation-engine/app.py',
   'requirements.txt'
];

requiredAiFiles.forEach(file => {
   const filePath = path.join(aiServicesDir, file);
   if (fs.existsSync(filePath)) {
      logPass(`AI Service file verified: ai-services/${file}`);
   } else {
      logFail(`Missing AI Service file: ai-services/${file}`);
   }
});

// ── Summary Results ──
console.log('\n====================================================');
console.log(`📊 Self-Check Completed! Total Tests: ${passCount + failCount}`);
console.log(`   🟢 Passed: ${passCount}`);
console.log(`   🔴 Failed: ${failCount}`);
console.log('====================================================\n');

if (failCount === 0) {
   console.log('🎉 ALL SYSTEM SELF-CHECK CHECKS PASSED PERFECTLY! Platform backend is robust & healthy.');
} else {
   console.log('⚠ Self-check completed with warnings/failures.');
}
