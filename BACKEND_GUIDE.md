# ⚙️ RASH EduHub — Backend & Database Architecture Guide

This document provides a comprehensive, step-by-step technical breakdown of the **RASH EduHub Backend & Database Architecture**, detailing the role of every Node.js module, Express middleware, API route handler, Supabase database client, SQL schema file, and Python AI microservice.

Use this guide to understand **how the backend operates** and **what happens when you modify any specific backend or database file**.

---

## 🏗️ 1. Overall Backend & Database Architecture

RASH EduHub backend follows a high-performance **Node.js + Express + Supabase Cloud PostgreSQL** architecture:
- **Express.js API Layer (`server/server.js`)**: Serves RESTful API endpoints under `/api/*`, applies security headers, rate limiting, body sanitization, and global error handling.
- **Supabase Cloud Database Layer (`server/supabaseClient.js`)**: Operates on PostgreSQL using `@supabase/supabase-js`. Bypasses Row Level Security via `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_ANON_KEY`.
- **Database Data Mapper (`server/supabaseHelper.js`)**: Automatically transforms PostgreSQL `snake_case` column names (`tutor_name`, `enrolled_count`, `completed_lessons`) into `camelCase` & `_id`-compatible JavaScript objects expected by the frontend.
- **Authentication & Authorization (`server/middleware/auth.js`)**: Verifies JWT tokens, verifies Google OAuth ID tokens, and enforces role-based access control (`student`, `teacher`, `admin`).
- **Python AI Microservices Proxy (`server/routes/ai-proxy.js`)**: Forwards AI requests to Python microservices for adaptive learning, code AST analysis, camera engagement tracking, and career roadmap generation.

---

## 🗺️ 2. File Impact & Dependency Map ("If I Change X, What Happens?")

### ⚙️ Server Core & Configuration Files

| File Path | Primary Role & Function | Dependent Components | What Happens If Modified? |
| :--- | :--- | :--- | :--- |
| [`server/server.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/server.js) | Main entry point for the Node.js Express server. Initializes CORS, Helmet headers, body parsers, rate limiters, static file servers, mounts API routes, health check `/api/health`, and starts server listener on port 5000. | All Express routes, frontend API calls | **Core Server Impact**: Changes global CORS policies, Express middleware, server port, upload static paths, route mounting, or `/api/health` status response. |
| [`server/supabaseClient.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/supabaseClient.js) | Initializes the `@supabase/supabase-js` SDK client using `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` from `.env`. | `supabaseHelper.js`, middleware/auth.js, all route handlers | **Database Connection Impact**: Affects database connection settings, API keys used, or Supabase client options across the **entire** backend. |
| [`server/supabaseHelper.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/supabaseHelper.js) | Centralized data transformation helper. Contains formatter functions (`formatUser`, `formatCourse`, `formatComment`, `formatNotification`, `formatCodeChallenge`, `formatSubmission`, `formatReview`, `formatActivityLog`) to map PostgreSQL DB columns into frontend JavaScript properties. | All route files (`auth.js`, `users.js`, `courses.js`, etc.) | **Data Formatting Impact**: Alters the structure of JSON responses returned to the frontend. Modify this when adding new columns to Supabase tables. |
| [`server/schema.sql`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/schema.sql) | SQL script containing table definitions (`users`, `courses`, `comments`, `notifications`, `contact_messages`, `code_challenges`, `submissions`, `reviews`, `activity_logs`, `badges`) and privilege grant commands (`GRANT ALL TO service_role, anon`). | Supabase Cloud Database | **Database Schema Impact**: Defines table structure in Supabase when executed in SQL Editor. Modify when creating new database tables or columns. |
| [`server/seed.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/seed.js) | Database seeding script (`node seed.js`) that populates initial teachers, students, courses, and coding challenges into Supabase. | Supabase Database | **Seed Data Impact**: Changes initial data populated when setting up a fresh database instance. |
| [`server/selfCheck.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/selfCheck.js) | Automated 49-test system check verifying route exports, middleware, HTML templates, Supabase client initialization, and Python AI files. | Terminal self-check command (`node selfCheck.js`) | **Self-Check Impact**: Modifies automated verification test suite. |
| [`server/.env`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/.env) | Environment variable file containing `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `GOOGLE_CLIENT_ID`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. | Entire Backend Server | **Environment Security Impact**: Changes secret keys, port, Supabase credentials, or OAuth IDs. *(Git ignored for security)*. |

---

### 🛡️ Security & Middleware Modules (`server/middleware/`)

| Middleware File Path | Role & Function | What Happens If Modified? |
| :--- | :--- | :--- |
| [`server/middleware/auth.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/middleware/auth.js) | Implements `protect` (verifies Bearer JWT token & fetches user from Supabase) and `authorize(...roles)` (enforces student/teacher/admin role access). | **Authentication Impact**: Modifies how tokens are decoded, session user attached to `req.user`, or how role permissions are enforced across protected routes. |
| [`server/middleware/errorHandler.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/middleware/errorHandler.js) | Global Express error handler that catches unhandled errors, formats JSON error responses, and returns HTTP status codes. | **Error Response Impact**: Changes error formatting, stack trace inclusion in development mode, or HTTP status codes returned during exceptions. |
| [`server/middleware/rateLimiter.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/middleware/rateLimiter.js) | Rate limiters using `express-rate-limit` for global `/api` routes (100 reqs / 15 min) and `/api/auth` login routes (15 reqs / 15 min). | **Rate Limit Impact**: Changes request quotas, lockout durations, or rate-limit error messages. |
| [`server/middleware/validator.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/middleware/validator.js) | Express-validator chains sanitizing request bodies, validating email formats, comment length, and password change payloads. | **Input Validation Impact**: Changes input validation rules, character limits, or field requirements for API requests. |

---

### 📡 API Route Handlers (`server/routes/`)

| Route File Path | Endpoints Handled | Supabase Tables Used | What Happens If Modified? |
| :--- | :--- | :--- | :--- |
| [`server/routes/auth.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/auth.js) | `POST /google`<br>`GET /me`<br>`PUT /change-password`<br>`DELETE /delete-account` | `users` | **Auth Flow Impact**: Modifies Google OAuth verification, user creation on sign-in, JWT generation, password updates, or account deletion logic. |
| [`server/routes/users.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/users.js) | `GET /teachers`<br>`GET /teachers/:id/reviews`<br>`GET /student/stats`<br>`GET /teacher/stats`<br>`GET /:id`<br>`PUT /profile` | `users`, `courses`, `reviews` | **User Profile Impact**: Modifies public teacher listings, student/teacher analytics calculation formulas, user profile fetching, or profile updates. |
| [`server/routes/courses.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/courses.js) | `GET /`<br>`GET /teacher/:teacherId`<br>`GET /:id`<br>`POST /`<br>`PUT /:id`<br>`DELETE /:id`<br>`POST /:id/enroll`<br>`POST /lessons/:id/complete` | `courses`, `users` | **Course CRUD Impact**: Modifies course catalog search/filtering, course creation, updating playlists, course deletion, student enrollment, or lesson completion toggles. |
| [`server/routes/comments.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/comments.js) | `GET /:videoId`<br>`POST /`<br>`PUT /:id`<br>`DELETE /:id`<br>`POST /:id/like` | `comments` | **Comments Impact**: Modifies video comments loading, editing, deleting, or comment like/unlike logic. |
| [`server/routes/notifications.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/notifications.js) | `GET /`<br>`GET /unread-count`<br>`POST /`<br>`PUT /:id/read`<br>`PUT /read-all`<br>`DELETE /:id`<br>`DELETE /clear-all` | `notifications` | **Notifications Impact**: Modifies user notification fetching, unread count badge, marking read, or clearing notification feeds. |
| [`server/routes/code.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/code.js) | `GET /challenges`<br>`GET /challenges/:id`<br>`POST /run`<br>`POST /submit`<br>`GET /submissions` | `code_challenges`, `submissions` | **Code Practice Impact**: Modifies coding challenge fetching, sandbox code execution simulation, solution test case scoring, or submission recording. |
| [`server/routes/gamification.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/gamification.js) | `GET /stats`<br>`GET /leaderboard`<br>`POST /award-xp`<br>`GET /badges`<br>`GET /heatmap` | `users`, `badges`, `submissions` | **Gamification Impact**: Modifies XP/Coins scoring formulas, level boundaries, global leaderboard calculation, badge unlocking logic, or heatmap data generation. |
| [`server/routes/admin.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/admin.js) | `GET /stats`<br>`GET /users`<br>`PUT /users/:id/role`<br>`DELETE /users/:id`<br>`GET /courses`<br>`DELETE /courses/:id`<br>`GET /contacts`<br>`PUT /contacts/:id/status`<br>`GET /activity` | `users`, `courses`, `submissions`, `contact_messages`, `activity_logs`, `reviews` | **Admin Dashboard Impact**: Modifies platform metrics overview calculations, user role promotion/demotion, course moderation, contact message management, or audit logs. |
| [`server/routes/reviews.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/reviews.js) | `GET /:courseId`<br>`POST /`<br>`PUT /:id`<br>`DELETE /:id` | `reviews`, `courses` | **Reviews Impact**: Modifies course review fetching, submitting reviews, review editing/deletion, or automatic course rating recalculation. |
| [`server/routes/bookmarks.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/bookmarks.js) | `GET /`<br>`POST /:courseId`<br>`DELETE /:courseId` | `users`, `courses` | **Bookmarks Impact**: Modifies user saved course bookmarks retrieval or toggle add/remove logic. |
| [`server/routes/progress.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/progress.js) | `GET /overview`<br>`GET /course/:courseId`<br>`GET /weekly`<br>`GET /certificates` | `courses`, `users`, `submissions` | **Progress Analytics Impact**: Modifies student analytics calculations, course progress breakdown, weekly chart distribution, or auto-generated certificate criteria. |
| [`server/routes/activityLog.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/activityLog.js) | `GET /`<br>`GET /all`<br>`POST /` | `activity_logs` | **Activity Audit Impact**: Modifies system activity logging function `logActivity()` or user activity timeline retrieval. |
| [`server/routes/upload.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/upload.js) | `POST /` | Local disk (`server/uploads/`) | **Upload Handler Impact**: Modifies Multer file size limits, allowed MIME types (JPEG, PNG, WEBP), or image filename generation. |
| [`server/routes/ai-proxy.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/ai-proxy.js) | `/api/ai/*` | Python AI Services | **AI Proxy Impact**: Modifies Express forwarding calls to Python FastAPI microservices. |

---

### 🤖 Python AI Microservices (`ai-services/`)

| File / Folder Path | Microservice & Port | Primary Function | What Happens If Modified? |
| :--- | :--- | :--- | :--- |
| [`ai-services/adaptive-engine/app.py`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/ai-services/adaptive-engine/app.py) | **Adaptive Engine** (Port 8001) | Calculates performance scores, dynamically adjusts exercise difficulty, and generates custom study plans. | Modifies student skill scoring formulas or automated study plan generation. |
| [`ai-services/code-evaluator/app.py`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/ai-services/code-evaluator/app.py) | **Code Evaluator** (Port 8003) | Parses Python/JS AST, estimates cyclomatic complexity, checks code style, and provides NLP improvement advice. | Modifies code complexity analysis or automated code quality suggestions. |
| [`ai-services/engagement-tracker/tracker.py`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/ai-services/engagement-tracker/tracker.py) | **Engagement Tracker** (Desktop / OpenCV) | Webcam computer vision pipeline estimating eye gaze direction, head pose pitch/yaw, and student focus percentage score. | Modifies computer vision gaze detection threshold, head posture monitoring, or engagement score formulas. |
| [`ai-services/recommendation-engine/app.py`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/ai-services/recommendation-engine/app.py) | **Recommendation Engine** (Port 8004) | Cosine similarity ranker evaluating student skill gap matrices and generating personalized career roadmaps. | Modifies course recommendation ranking algorithms or career path mapping. |

---

## 🗄️ 3. Supabase Cloud Database Table Specifications

Below is the database table schema overview managed in Supabase:

```sql
users (id UUID, name TEXT, email TEXT, password TEXT, role TEXT, avatar TEXT, xp INT, coins INT, streak INT, enrolled_courses TEXT[], completed_lessons TEXT[], bookmarks TEXT[])
courses (id UUID, title TEXT, description TEXT, tutor_id TEXT, tutor_name TEXT, category TEXT, thumb TEXT, playlists JSONB, enrolled_count INT, rating NUMERIC)
comments (id UUID, course_id TEXT, user_id TEXT, user_name TEXT, text TEXT, video_id TEXT, likes INT, liked_by TEXT[])
notifications (id UUID, user_id TEXT, type TEXT, title TEXT, message TEXT, read BOOLEAN, link TEXT)
contact_messages (id UUID, name TEXT, email TEXT, number TEXT, msg TEXT, status TEXT)
code_challenges (id UUID, title TEXT, description TEXT, difficulty TEXT, category TEXT, starter_code TEXT, test_cases JSONB, points INT)
submissions (id UUID, user_id TEXT, challenge_id TEXT, code TEXT, status TEXT, passed_tests INT, total_tests INT)
reviews (id UUID, course_id TEXT, user_id TEXT, user_name TEXT, rating NUMERIC, comment TEXT)
activity_logs (id UUID, user_id TEXT, action TEXT, details JSONB, ip TEXT)
badges (id UUID, user_id TEXT, badge_name TEXT, icon TEXT)
```

### Data Mapping Mechanism (`server/supabaseHelper.js`)
When Supabase returns PostgreSQL rows:
```javascript
// Database Row in PostgreSQL:
{ tutor_id: "123", tutor_name: "Harsh Singh", enrolled_count: 8450, playlists: [...] }

// Formatted by formatCourse() for JavaScript Frontend:
{ _id: "123", id: "123", teacherId: "123", teacherName: "Harsh Singh", studentsCount: 8450, playlist: [...] }
```

---

## 💡 4. Practical Backend Editing Examples

### Scenario 1: Adding a new field (e.g. `githubProfile`) to User Account
1. **Edit Supabase Table**: Run SQL in Supabase SQL Editor:
   ```sql
   ALTER TABLE users ADD COLUMN github_profile TEXT DEFAULT '';
   ```
2. **Edit `server/supabaseHelper.js`**: Update `formatUser(u)` to include the new property:
   ```javascript
   githubProfile: u.github_profile || ''
   ```
3. **Edit `server/routes/users.js`**: Allow `githubProfile` in `PUT /api/users/profile` allowed fields array.

---

### Scenario 2: Changing JWT Expiration Time
1. **Edit `server/.env`**: Modify `JWT_EXPIRES_IN`:
   ```env
   JWT_EXPIRES_IN=30d
   ```
2. **Restart Server**: Re-run `npm start` in `server/`. All new tokens will remain valid for 30 days.

---

### Scenario 3: Creating a New Express API Endpoint
1. **Create/Open Route File** (e.g. `server/routes/courses.js`).
2. **Add Express Handler**:
   ```javascript
   router.get('/featured', async (req, res, next) => {
      try {
         const { data } = await supabase.from('courses').select('*').gt('rating', 4.5);
         res.json({ success: true, courses: data.map(formatCourse) });
      } catch (err) { next(err); }
   });
   ```
3. **Test with Self-Check**: Run `node server/selfCheck.js`.

---

*File generated for RASH EduHub backend documentation.*
