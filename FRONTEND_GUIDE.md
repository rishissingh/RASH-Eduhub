# 🎨 RASH EduHub — Frontend Architecture & File Modification Guide

This document provides a comprehensive, step-by-step breakdown of the **RASH EduHub Frontend Architecture**, detailing the role of every HTML template, CSS stylesheet, JavaScript component, page script, and API service file.

Use this guide to understand **how the frontend works** and **what happens when you modify any specific file**.

---

## 🏛️ 1. Overall Frontend Architecture & Key Roles

RASH EduHub uses a **modular Vanilla JS + HTML5 + CSS3 Glassmorphism** architecture:
- **No heavy framework build step**: Pages render instantly in any browser.
- **Service Layer Pattern (`js/services/`)**: Centralizes API communication with the Node.js Express backend and Supabase.
- **Dynamic Component Injection (`js/components/`)**: Header (`navbar.js`), Sidebar (`sidebar.js`), and Toast alerts (`toast.js`) are dynamically injected across all views so navigation stays consistent.
- **Role-Based Portals**:
  1. 🌐 **Public Portal** (`/` root): Marketing, course discovery, tutor listings, authentication.
  2. 🎓 **Student Portal** (`/student/`): Personalized dashboard, enrolled courses, progress analytics, code practice, AI predictor.
  3. 👨‍🏫 **Teacher Portal** (`/teacher/`): Course creator studio, lesson manager, video uploader, revenue analytics.
  4. 🛡️ **Admin Portal** (`/admin/`): Platform metrics, user role management, content moderation, activity logs.

---

## 🗺️ 2. File Impact & Dependency Map ("If I Change X, What Happens?")

### 🎨 Stylesheets & Design System (`css/`)

| File Path | Primary Role & Function | What Happens If Modified? |
| :--- | :--- | :--- |
| [`css/style.css`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/css/style.css) | Core stylesheet housing CSS root variables (`--main-color`, `--black`, `--white`, `--light-bg`), typography, dark mode rules, base layout grid, and header/sidebar structural styles. | **Global Impact**: Changes colors, fonts, background schemes, layout spacing, dark/light mode appearance, header, sidebar, and page layouts across **ALL** pages. |
| [`css/components.css`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/css/components.css) | Styles reusable UI components: Glassmorphic cards, action buttons, form inputs, badges, modals, and progress bars. | **UI Component Impact**: Changes the visual look of buttons, course cards, login forms, gamification badges, modal dialogs, and progress bars across the entire platform. |
| [`css/animations.css`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/css/animations.css) | Houses CSS keyframe micro-animations (`pulse`, `fadeIn`, `slideIn`, `shimmer` loading effects) and smooth hover transitions. | **Animation Impact**: Alters visual motion, loading skeleton animations, button hover effects, card scaling, and transition speeds. |

---

### 🧱 Reusable UI Components (`js/components/`) & Theme Controller

| File Path | Primary Role & Function | What Happens If Modified? |
| :--- | :--- | :--- |
| [`js/components/navbar.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/components/navbar.js) | Dynamically renders and updates the top navigation header bar (Logo, Search box, Profile icon, Notification bell, Theme toggle, Login/Logout buttons). | **Header Impact**: Changes header navigation links, user profile popup menu, notification bell behavior, or search box functionality across **ALL** pages. |
| [`js/components/sidebar.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/components/sidebar.js) | Dynamically renders the collapsible sidebar menu based on user role (`student`, `teacher`, `admin`, `guest`). | **Navigation Impact**: Modifies sidebar links, icons, user profile summary block, or role-specific navigation menu items. |
| [`js/components/toast.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/components/toast.js) | Provides a floating notification alert function (`showToast(msg, type)`). | **Alerts Impact**: Changes the appearance, duration, positioning, or behavior of toast feedback popups (success, error, warning). |
| [`js/theme.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/theme.js) | Manages Dark/Light mode theme switching and persists preference in `localStorage`. | **Theme Impact**: Alters how theme toggling works or changes default theme persistence behavior. |
| [`js/script.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/script.js) | Global utility script initializing header search, sidebar collapse toggling, and page event listeners. | **Global Interaction Impact**: Affects sidebar open/close toggle buttons, header profile dropdown toggle, and window scroll handlers. |

---

### 🌐 Public Portal Templates (Root Directory)

| File Path | Role & View Purpose | Linked JS Scripts | What Happens If Modified? |
| :--- | :--- | :--- | :--- |
| [`index.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/index.html) | Homepage showcasing quick options, popular categories, top tutors, featured courses, and gamification preview. | `js/pages/home.js`, `js/script.js` | Modifies homepage layout, hero section banner, category grid, or featured course cards. |
| [`about.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/about.html) | About Us page featuring platform mission, platform statistics, and student reviews/testimonials slider. | `js/script.js` | Modifies the About page layout, mission statement, or student feedback cards. |
| [`courses.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/courses.html) | Main course catalog listing all courses with category dropdown, level filter, price filter, and search input. | `js/pages/coursesPage.js`, `js/services/courseService.js` | Modifies course catalog layout, search filter layout, or pagination grid. |
| [`playlist.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/playlist.html) | Course overview page showing instructor bio, course description, total duration, enrollment button, and lesson list. | `js/pages/playlistPage.js`, `js/services/courseService.js` | Modifies course overview details page, lesson list layout, or enrollment trigger button. |
| [`watch-video.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/watch-video.html) | Video streaming page featuring main video player, lesson list sidebar, downloadable PDF notes, and comments section. | `js/pages/watchVideo.js`, `js/services/courseService.js` | Modifies video player layout, lesson switching, video comments, or PDF notes section. |
| [`login.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/login.html) | Login page with Email/Password form and Google OAuth 2.0 Sign-In button. | `js/pages/authPage.js`, `js/services/authService.js` | Modifies login form fields, Google sign-in button layout, or login error messages. |
| [`register.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/register.html) | Registration page allowing new users to sign up as Student or Teacher. | `js/pages/authPage.js`, `js/services/authService.js` | Modifies registration form fields, role selection toggle, or validation messages. |
| [`profile.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/profile.html) | User profile summary card displaying user avatar, role, bio, XP/Coins stats, and quick links. | `js/pages/profilePage.js`, `js/services/userService.js` | Modifies profile card display, bio section, or action buttons. |
| [`update.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/update.html) | Profile editing page to update Name, Email, Bio, Avatar image, and Change Password. | `js/pages/profilePage.js`, `js/services/userService.js` | Modifies profile edit form, password change inputs, or avatar upload trigger. |
| [`teachers.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teachers.html) | Tutors directory listing all active instructors with rating, student count, and course counts. | `js/script.js` | Modifies instructor directory grid or tutor card layout. |
| [`teacher_profile.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teacher_profile.html) | Individual teacher profile view showing bio, experience, average rating, student reviews, and courses taught. | `js/script.js` | Modifies public instructor profile page layout or instructor courses list. |
| [`contact.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/contact.html) | Contact Us page with contact details card and interactive contact message form. | `js/contact.js` | Modifies contact form inputs, support info details, or submission feedback message. |
| [`creator.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/creator.html) | Content Creator onboarding page explaining teacher benefits and registration steps. | `js/script.js` | Modifies creator studio landing page or instructor registration promo banner. |

---

### 🎓 Student Portal Templates (`student/`)

| File Path | Role & View Purpose | Linked JS Scripts | What Happens If Modified? |
| :--- | :--- | :--- | :--- |
| [`student/dashboard.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/student/dashboard.html) | Personalized Student Dashboard featuring level badge, XP/Coins counter, daily streak, active course progress, and quick action tiles. | `js/pages/studentDashboard.js`, `js/services/gamificationService.js` | Modifies student main dashboard layout, gamification stats widget, or course progress cards. |
| [`student/my-courses.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/student/my-courses.html) | Grid view of all courses currently enrolled by the logged-in student. | `js/services/courseService.js` | Modifies student enrolled courses page layout or course progress badges. |
| [`student/progress.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/student/progress.html) | Detailed analytics view showing 7-day weekly study chart, course completion percentages, and earned certificates. | `js/services/userService.js` | Modifies student learning progress charts, analytics counters, or certificate display list. |
| [`student/code-practice.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/student/code-practice.html) | Interactive Code Sandbox UI with problem description, code editor, language selector, Run Code button, Submit button, and test-case results log. | `js/services/codeGraderService.js` | Modifies coding sandbox layout, code editor box, execution log terminal, or test-case pass/fail display. |
| [`student/ai-predict.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/student/ai-predict.html) | AI Performance Predictor & Focus Engagement dashboard connected to Python AI services. | `js/pages/aiPredict.js`, `js/services/aiService.js` | Modifies AI prediction charts, study plan generator interface, or engagement focus score widget. |

---

### 👨‍🏫 Teacher Portal Templates (`teacher/`)

| File Path | Role & View Purpose | Linked JS Scripts | What Happens If Modified? |
| :--- | :--- | :--- | :--- |
| [`teacher/dashboard.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teacher/dashboard.html) | Teacher Main Dashboard displaying total courses created, total enrolled students, total lessons, and estimated revenue. | `js/pages/teacherDashboard.js`, `js/services/userService.js` | Modifies teacher dashboard metrics grid, course summary cards, or quick action links. |
| [`teacher/create-course.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teacher/create-course.html) | Course Creation form to input course title, category, description, price, thumbnail, and lesson list. | `js/services/courseService.js` | Modifies new course creation form fields or lesson input builder. |
| [`teacher/edit-course.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teacher/edit-course.html) | Course Editing interface to modify existing course details, reorder lessons, or edit playlist links. | `js/services/courseService.js` | Modifies course edit form inputs or playlist lesson management UI. |
| [`teacher/manage-course.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teacher/manage-course.html) | Course Management overview showing published courses list with status toggles (Active/Draft) and Delete action. | `js/services/courseService.js` | Modifies teacher course management table or course status controls. |
| [`teacher/upload-video.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teacher/upload-video.html) | Video & Lesson Upload form to add new video lessons with title, description, video URL, and PDF notes attachments. | `js/services/courseService.js` | Modifies video uploader inputs, lesson duration input, or PDF attachment form fields. |
| [`teacher/analytics.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/teacher/analytics.html) | Detailed instructor revenue breakdown, student enrollment charts, and course performance analytics. | `js/services/userService.js` | Modifies instructor revenue charts, student enrollment metrics, or performance tables. |

---

### 🛡️ Admin Portal Templates (`admin/`)

| File Path | Role & View Purpose | Linked JS Scripts | What Happens If Modified? |
| :--- | :--- | :--- | :--- |
| [`admin/dashboard.html`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/admin/dashboard.html) | Platform Admin Command Center featuring total users stats, user role management table, course moderation list, contact messages view, and system audit logs. | `js/services/userService.js`, `js/services/courseService.js` | Modifies admin platform metrics layout, user role edit table, course deletion panel, or audit activity log viewer. |

---

### ⚡ API Integration Services (`js/services/`)

| Service File Path | Backend API Connection | What Happens If Modified? |
| :--- | :--- | :--- |
| [`js/services/authService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/authService.js) | `/api/auth/google`, `/api/auth/me`, `/api/auth/change-password` | **Authentication Impact**: Modifies how users log in, sign up, handle Google OAuth tokens, or store JWT tokens in `localStorage`. |
| [`js/services/courseService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/courseService.js) | `/api/courses`, `/api/courses/:id/enroll`, `/api/comments`, `/api/reviews` | **Course Data Impact**: Modifies how courses are loaded, searched, filtered, enrolled, or how comments and reviews are submitted. |
| [`js/services/userService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/userService.js) | `/api/users/profile`, `/api/users/student/stats`, `/api/users/teacher/stats`, `/api/admin/*` | **User Profile & Admin Impact**: Modifies profile updates, student/teacher stats fetching, and admin management requests. |
| [`js/services/gamificationService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/gamificationService.js) | `/api/gamification/stats`, `/api/gamification/leaderboard`, `/api/gamification/award-xp` | **Gamification Impact**: Modifies XP/Coins awards, streak updates, badge fetching, or leaderboard ranking displays. |
| [`js/services/codeGraderService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/codeGraderService.js) | `/api/code/challenges`, `/api/code/run`, `/api/code/submit`, `/api/code/submissions` | **Code Practice Impact**: Modifies how coding challenges are loaded, executed in sandbox, or scored. |
| [`js/services/notificationService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/notificationService.js) | `/api/notifications`, `/api/notifications/unread-count`, `/api/notifications/read-all` | **Notification Feed Impact**: Modifies how notification bell badges and unread notification lists behave. |
| [`js/services/aiService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/aiService.js) | `/api/ai/*` (FastAPI Proxy to Python AI microservices) | **AI Integration Impact**: Modifies communication with Python AI services (Adaptive Learning, Code Complexity, Skill Gap Analysis). |
| [`js/services/googleConfig.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/googleConfig.js) | Google Identity Services SDK (`https://accounts.google.com/gsi/client`) | **Google Auth Config Impact**: Modifies Google OAuth Client ID setting and initialization properties. |

---

## 💡 Practical Examples of Making Changes

### Scenario 1: You want to change the primary button color or main brand theme
- **File to Edit**: [`css/style.css`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/css/style.css)
- **Lines to Edit**: Change `--main-color` under `:root`:
  ```css
  :root {
     --main-color: #8e44ad; /* Change to your preferred hex color */
  }
  ```
- **Result**: All primary buttons, progress bars, active icons, and badges automatically adapt to the new color across the entire platform.

---

### Scenario 2: You want to add a new menu item to the sidebar navigation
- **File to Edit**: [`js/components/sidebar.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/components/sidebar.js)
- **Edit Action**: Add a new link item into `renderSidebar()`:
  ```javascript
  `<a href="new-page.html"><i class="fas fa-star"></i><span>New Page</span></a>`
  ```
- **Result**: The new menu item instantly appears in the sidebar on every page for logged-in users.

---

### Scenario 3: You want to modify how XP and Coins are awarded to students
- **File to Edit**: [`js/services/gamificationService.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/js/services/gamificationService.js) and backend [`server/routes/gamification.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/routes/gamification.js)
- **Edit Action**: Adjust `awardXp(amount, coins, reason)` parameters.
- **Result**: Changes the amount of XP and Coins students earn when completing lessons or code challenges.

---

*File generated for RASH EduHub project documentation.*
