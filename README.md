# 🎓 RASH EduHub 2.0 — AI-Powered LMS & Interactive Learning Platform

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Version](https://img.shields.io/badge/Version-2.0.0-green.svg)
![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-brightgreen)
![Database](https://img.shields.io/badge/Database-Supabase%20Cloud%20PostgreSQL-3ECF8E)
![AI Services](https://img.shields.io/badge/AI%20Microservices-Python%20%7C%20PyTorch%20%7C%20MediaPipe-blue)
![UI Theme](https://img.shields.io/badge/Design-Glassmorphic%20Dark%20Mode-purple)

**RASH EduHub 2.0** is an enterprise-grade, full-stack, AI-powered Learning Management System (LMS) and interactive developer learning platform. It seamlessly combines real-time video learning, interactive code sandbox evaluation, a real-time gamification engine (XP, Coins, Badges, Heatmap, Leaderboards), Python AI microservices for adaptive learning and computer-vision focus tracking, and a Supabase Cloud PostgreSQL database.

---

## 🌟 Key Features Overview

### 1. 🎓 Student Learning Portal
- **Interactive Video Player**: Dynamic lesson streaming with order tracking, video timestamps, and downloadable PDF notes.
- **Progress Tracking & Analytics**: Automatic course completion percentage, weekly activity charts, and auto-generated verifiable certificates upon course completion.
- **Saved Bookmarks & Favorites**: Save and organize courses for quick access.
- **Review & Rating System**: Post course reviews, rate instructors from 1 to 5 stars, and update ratings in real-time.

### 2. 👨‍🏫 Teacher & Creator Studio
- **Course Studio**: Full CRUD functionality to create, update, publish, or archive courses with custom video playlists and lesson metadata.
- **Analytics Dashboard**: Real-time instructor metrics including total enrolled students, total video lessons, and calculated course revenue.
- **Instructor Profiles**: Dedicated public tutor pages featuring total students taught, average course rating, and student feedback.

### 3. 🛡️ Admin Command Center
- **System Metrics Overview**: Platform-wide user metrics (students, teachers, admins), total enrollments, submission counters, and system uptime.
- **User Role Management**: Promote/demote users between Student, Teacher, and Admin roles or remove accounts with audit controls.
- **Content Moderation**: Review and delete courses or moderate user comments and contact form submissions.
- **System Activity Log**: Full audit log tracking platform interactions, action tags, and IP logs.

### 4. 💻 Interactive Code Practice Sandbox
- **In-Browser Code Execution**: Interactive coding environment supporting JavaScript algorithms and multi-language script testing.
- **Automated Test-Case Evaluation**: Instant pass/fail score calculations, hidden test cases, and simulated Docker execution logs.
- **Submission History**: Detailed history of past submissions, passed test counts, and solution scores.

### 5. 🏆 Real-Time Gamification Engine
- **XP & Coin Economy**: Earn XP and coins by watching video lessons, solving code challenges, and maintaining login streaks.
- **Streak & Level System**: Dynamic level calculation formula (`Lvl = Math.floor(XP / 300) + 1`) and daily streak tracker.
- **Global Leaderboard**: Live ranking of top learners featuring **🥇 Gold**, **🥈 Silver**, and **🥉 Bronze** tier badges.
- **90-Day Activity Heatmap**: Interactive GitHub-style activity grid visualizing learning consistency over time.
- **Achievement Badges Catalog**: Unlock badges (*First Steps*, *Fast Learner*, *Code Warrior*, *Streak Master*, *Night Owl*, *Certificate Master*).

### 6. 🤖 Python AI Microservices Ecosystem
- **Adaptive Learning Engine**: Evaluates student performance, dynamically adjusts exercise difficulty, and generates custom study plans.
- **Code Evaluator**: Performs AST (Abstract Syntax Tree) parsing, calculates cyclomatic complexity, checks code style, and provides NLP improvement feedback.
- **Computer Vision Engagement Tracker**: Real-time webcam focus tracking using OpenCV, MediaPipe Face Landmarker, and YOLOv8 to estimate eye gaze, head pose, and student engagement scores.
- **Recommendation Engine**: Cosine similarity skill-gap analysis generating personalized career roadmaps and course recommendations.

### 7. ☁️ Cloud Database & Security Architecture
- **Supabase Cloud PostgreSQL**: Production schema with table mappers (`supabaseHelper.js`) for snake_case to camelCase payload transformation.
- **Google OAuth 2.0**: Native Google Identity Services token verification and sign-in flow.
- **JWT Session Protection**: Secure token-based API authentication and role-based access control (`student`, `teacher`, `admin`).

---

## 📂 Detailed Project Directory Structure

```text
RASH EduHub 1/
│
├── 📄 index.html                      # Main Homepage & Platform Dashboard Overview
├── 📄 about.html                      # Platform Vision, Features, & Team Overview
├── 📄 contact.html                    # Contact Form with Backend API Submission
├── 📄 courses.html                    # Course Catalog with Category, Level, & Search Filters
├── 📄 creator.html                    # Creator Overview & Tutor Registration Page
├── 📄 login.html                      # Unified Login Form (Email/Password + Google OAuth)
├── 📄 register.html                   # Account Registration Page (Student / Teacher Role)
├── 📄 playlist.html                   # Course Playlist View & Lesson Breakdown
├── 📄 profile.html                    # User Profile Settings & Profile Card
├── 📄 update.html                     # Profile Edit & Password Change Form
├── 📄 watch-video.html                # Video Player Page with Lessons & Comments Section
├── 📄 teacher_profile.html            # Public Tutor Profile & Course Listings
├── 📄 teachers.html                   # Directory of Expert Instructors
├── 📄 favicon.ico                     # Platform Favicon Icon
├── 📄 README.md                       # Comprehensive Project Documentation
├── 📄 PRODUCTION_REQUIREMENTS.md      # Production Deployment Checklist & Environment Guide
├── 📄 .gitignore                      # Git Ignore Rules (.env, node_modules, .venv, logs)
│
├── 📁 admin/                          # Admin Command Center Views
│   └── 📄 dashboard.html              # Admin Platform Management & Analytics UI
│
├── 📁 student/                        # Student Portal Views
│   ├── 📄 dashboard.html              # Student Overview, Gamification & Quick Stats
│   ├── 📄 my-courses.html             # Student Enrolled Courses View
│   ├── 📄 progress.html               # Learning Progress, Analytics Charts & Certificates
│   ├── 📄 code-practice.html          # Interactive Code Challenge Sandbox
│   ├── 📄 ai-predict.html             # AI Performance & Engagement Predictor
│   ├── 📄 profile.html                # Student Profile View
│   └── 📄 watch-video.html            # Student Customized Video Player
│
├── 📁 teacher/                        # Instructor Portal Views
│   ├── 📄 dashboard.html              # Teacher Analytics & Course Quick Overview
│   ├── 📄 create-course.html          # New Course Creator Studio
│   ├── 📄 edit-course.html            # Course Edit & Lesson Manager
│   ├── 📄 manage-course.html          # Course Content & Video List Management
│   ├── 📄 upload-video.html           # Video Upload & Lesson Manager
│   ├── 📄 analytics.html              # Revenue & Student Analytics Dashboard
│   └── 📄 profile.html                # Instructor Profile Management
│
├── 📁 css/                            # Global & Component Stylesheets
│   ├── 📄 style.css                   # Core CSS Styles, Design System Tokens & Layout Grid
│   ├── 📄 components.css              # Glassmorphic UI Components, Buttons & Cards
│   └── 📄 animations.css              # Micro-interactions, Hover Effects & Transitions
│
├── 📁 js/                             # Modular Frontend JavaScript Architecture
│   ├── 📄 script.js                   # Navigation Header, Sidebar & Dark Mode Controller
│   ├── 📄 theme.js                    # Global Theme Switcher & Storage Manager
│   ├── 📄 contact.js                  # Contact Form Submission Handler
│   ├── 📁 components/                 # Reusable UI Components
│   │   ├── 📄 navbar.js               # Dynamic Header Bar Component
│   │   ├── 📄 sidebar.js              # Dynamic Collapsible Navigation Sidebar
│   │   └── 📄 toast.js                # Toast Notification Popup System
│   ├── 📁 services/                   # API Integration Services
│   │   ├── 📄 authService.js          # Authentication & Google OAuth Service
│   │   ├── 📄 userService.js          # User Profile & Stats API Service
│   │   ├── 📄 courseService.js        # Course Catalog & Enrollment API Service
│   │   ├── 📄 codeGraderService.js    # Code Sandbox API Service
│   │   ├── 📄 gamificationService.js  # XP, Badges & Leaderboard API Service
│   │   ├── 📄 notificationService.js  # Notification Feed API Service
│   │   ├── 📄 aiService.js            # Python AI Proxy Integration Service
│   │   ├── 📄 googleConfig.js         # Google Identity Services Configuration
│   │   └── 📄 db.js                   # Client Data Utility Functions
│   └── 📁 pages/                      # Page-Specific Logic Scripts
│       ├── 📄 home.js                 # Home Page Dynamic Data Loader
│       ├── 📄 coursesPage.js          # Courses Filter & Search Handler
│       ├── 📄 playlistPage.js         # Playlist & Lesson List Loader
│       ├── 📄 watchVideo.js           # Video Player & Comments Controller
│       ├── 📄 authPage.js             # Login/Register Form Controller
│       ├── 📄 profilePage.js          # Profile Stats & Update Handler
│       ├── 📄 studentDashboard.js     # Student Dashboard Controller
│       ├── 📄 teacherDashboard.js     # Teacher Dashboard Controller
│       └── 📄 aiPredict.js            # AI Prediction Interface Handler
│
├── 📁 server/                         # Express.js REST API Backend
│   ├── 📄 server.js                   # Core Express Application Server & Health Check
│   ├── 📄 supabaseClient.js           # Supabase JS SDK Instance Initialization
│   ├── 📄 supabaseHelper.js           # DB Field Mappers & Formatters (snake_case <-> camelCase)
│   ├── 📄 schema.sql                  # PostgreSQL Tables Schema & RLS Permissions Grant Script
│   ├── 📄 seed.js                     # Supabase Seed Script for Initial Users, Courses & Challenges
│   ├── 📄 selfCheck.js                # 49-Test System Self-Check Script
│   ├── 📄 package.json                # Server Dependencies & NPM Scripts
│   ├── 📄 .env                        # Active Environment Variables (Git Ignored)
│   ├── 📄 .env.example                # Environment Variables Configuration Template
│   ├── 📁 middleware/                 # Express Security & Auth Middleware
│   │   ├── 📄 auth.js                 # JWT Verification & Role Authorization Middleware
│   │   ├── 📄 errorHandler.js         # Global Centralized Error Handling Middleware
│   │   ├── 📄 rateLimiter.js          # API & Auth Rate Limiting Middleware
│   │   └── 📄 validator.js            # Request Body Sanitization & Input Validators
│   ├── 📁 routes/                     # API Route Endpoints
│   │   ├── 📄 auth.js                 # POST /google, GET /me, PUT /change-password
│   │   ├── 📄 users.js                # GET /teachers, GET /student/stats, PUT /profile
│   │   ├── 📄 courses.js              # GET /, POST /, PUT /:id, DELETE /:id, POST /enroll
│   │   ├── 📄 comments.js             # GET /:videoId, POST /, DELETE /:id, POST /:id/like
│   │   ├── 📄 notifications.js        # GET /, PUT /read-all, DELETE /clear-all
│   │   ├── 📄 contact.js              # POST /, GET /
│   │   ├── 📄 upload.js               # POST / (Multer File Upload Handler)
│   │   ├── 📄 code.js                 # GET /challenges, POST /run, POST /submit
│   │   ├── 📄 gamification.js         # GET /stats, GET /leaderboard, POST /award-xp
│   │   ├── 📄 admin.js                # GET /stats, GET /users, PUT /users/:id/role
│   │   ├── 📄 reviews.js              # GET /:courseId, POST /, DELETE /:id
│   │   ├── 📄 bookmarks.js            # GET /, POST /:courseId, DELETE /:courseId
│   │   ├── 📄 progress.js             # GET /overview, GET /course/:id, GET /weekly
│   │   ├── 📄 activityLog.js          # GET /, POST /
│   │   └── 📄 ai-proxy.js             # Express Proxy forwarding to Python AI Microservices
│   └── 📁 uploads/                    # Local Upload Directory for Avatars & Thumbnails
│
├── 📁 ai-services/                    # Python AI Microservices Architecture
│   ├── 📄 requirements.txt            # Python Package Dependencies (FastAPI, PyTorch, MediaPipe)
│   ├── 📁 shared/                     # Shared Python Utilities
│   │   ├── 📄 config.py               # Microservices Configuration Settings
│   │   └── 📄 logger.py               # Centralized Python Logger
│   ├── 📁 adaptive-engine/            # Adaptive Learning & Scoring Service
│   │   ├── 📄 app.py                  # FastAPI Entrypoint (Port 8001)
│   │   └── 📁 services/               # Scoring, Difficulty Adjuster & Study Plan Generator
│   ├── 📁 code-evaluator/             # Code Complexity & AST Analysis Service
│   │   ├── 📄 app.py                  # FastAPI Entrypoint (Port 8003)
│   │   └── 📁 analyzers/              # AST Analyzer, Complexity Calculator & Style Checker
│   ├── 📁 engagement-tracker/         # Real-Time Focus & Engagement Tracker
│   │   ├── 📄 tracker.py              # OpenCV + MediaPipe + YOLOv8 Gaze & Pose Tracker
│   │   └── 📁 pipeline/               # Gaze Estimator, Pose Estimator & Decision Engine
│   └── 📁 recommendation-engine/      # Career Roadmap & Course Recommendation Service
│       ├── 📄 app.py                  # FastAPI Entrypoint (Port 8004)
│       └── 📁 services/               # Skill Gap Analyzer & Similarity Engine
│
└── 📁 images/                         # Static Platform Assets, Avatars & UI Thumbnails
```

---

## 🗄️ Supabase Database Architecture

The backend operates on a Supabase Cloud PostgreSQL database defined in `server/schema.sql`:

| Table Name | Description | Key Fields |
| :--- | :--- | :--- |
| **`users`** | Student, Teacher & Admin user accounts | `id`, `name`, `email`, `password`, `role`, `avatar`, `xp`, `coins`, `streak`, `enrolled_courses`, `completed_lessons`, `bookmarks` |
| **`courses`** | Course catalog and playlist lessons | `id`, `title`, `description`, `tutor_id`, `tutor_name`, `category`, `thumb`, `playlists`, `enrolled_count`, `rating` |
| **`comments`** | Discussion comments on course videos | `id`, `course_id`, `user_id`, `user_name`, `text`, `video_id`, `likes`, `liked_by` |
| **`notifications`** | User notification feed items | `id`, `user_id`, `type`, `title`, `message`, `read`, `link` |
| **`contact_messages`** | Support & inquiry messages | `id`, `name`, `email`, `number`, `msg`, `status` |
| **`code_challenges`** | Coding problems catalog | `id`, `title`, `description`, `difficulty`, `category`, `starter_code`, `test_cases`, `points` |
| **`submissions`** | Student code submission attempts | `id`, `user_id`, `challenge_id`, `code`, `status`, `passed_tests`, `total_tests` |
| **`reviews`** | Course rating reviews | `id`, `course_id`, `user_id`, `user_name`, `rating`, `comment` |
| **`activity_logs`** | Platform system audit logs | `id`, `user_id`, `action`, `details`, `ip` |
| **`badges`** | Achievement badges unlocked by users | `id`, `user_id`, `badge_name`, `icon` |

---

## ⚡ API Endpoint Reference

| Endpoint Namespace | HTTP Methods | Description |
| :--- | :--- | :--- |
| `/api/auth` | `POST`, `GET`, `PUT`, `DELETE` | Google OAuth authentication, `/me` profile, password change, account deletion |
| `/api/users` | `GET`, `PUT` | Teacher list, student stats, teacher analytics, profile updates |
| `/api/courses` | `GET`, `POST`, `PUT`, `DELETE` | Course catalog filtering, course creation/editing, student enrollment, lesson completion |
| `/api/comments` | `GET`, `POST`, `PUT`, `DELETE` | Video comments, editing, deletion, and comment liking/unliking |
| `/api/notifications` | `GET`, `POST`, `PUT`, `DELETE` | Unread notifications count, mark as read, clear all notifications |
| `/api/code` | `GET`, `POST` | List coding challenges, run code sandbox, submit solution, view submission history |
| `/api/gamification` | `GET`, `POST` | Gamification stats, XP award engine, global leaderboard, 90-day heatmap |
| `/api/admin` | `GET`, `PUT`, `DELETE` | Platform metrics summary, user role management, content moderation, audit logs |
| `/api/reviews` | `GET`, `POST`, `PUT`, `DELETE` | Course review management and automatic instructor rating recalculation |
| `/api/bookmarks` | `GET`, `POST`, `DELETE` | Bookmarked course list management and toggle handlers |
| `/api/progress` | `GET` | Granular student progress overview, course progress lists, weekly activity charts |
| `/api/activity` | `GET`, `POST` | User activity timeline logging |

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js** v18.0.0 or higher
- **Python** v3.10.0 or higher (for AI microservices)
- **Supabase Account** with Cloud PostgreSQL instance

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/rishissingh/RASH-Eduhub.git
cd RASH-Eduhub
```

### Step 2: Configure Environment Variables
Create a `.env` file in the `server/` directory:
```bash
cp server/.env.example server/.env
```
Fill in your credentials in `server/.env`:
```env
PORT=5000
JWT_SECRET=your_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
UPLOAD_DIR=uploads
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

SUPABASE_URL=https://your_project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Step 3: Initialize Database & Run Seed Script
Execute database seeding to populate sample users, courses, and coding challenges into Supabase:
```bash
cd server
npm install
node seed.js
```

### Step 4: Run Platform System Self-Check
Verify server routing, database connectivity, and microservices configuration:
```bash
node selfCheck.js
```
*Output: `🎉 ALL SYSTEM SELF-CHECK CHECKS PASSED PERFECTLY! (49/49 Passed)`*

### Step 5: Start Node.js Backend Server
```bash
npm start
```
*API server will start on: `http://localhost:5000`*

### Step 6: Start Python AI Microservices (Optional)
To run the computer vision engagement tracker:
```bash
pip install -r ai-services/requirements.txt
python ai-services/engagement-tracker/tracker.py --camera 0
```

---

## 🛠️ Security & Production Deployment

1. **Supabase Schema Permissions**:
   Before deploying to production, execute `server/schema.sql` in your Supabase SQL Editor to grant table privileges to API roles.
2. **Environment Protection**:
   Ensure `server/.env` is never committed to source control (protected via `.gitignore`).
3. **CORS & Security**:
   For production deployments, configure allowed domain origins in `server/server.js`.

---

## 📜 License & Acknowledgments

This project is open-source under the **MIT License**.  
Built with ❤️ for learners, educators, and developers worldwide.
