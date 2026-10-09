# RASH EduHub — Production Readiness Checklist & User Inputs

This document provides a detailed step-by-step checklist of information, credentials, and settings needed to complete the production hardening of **RASH EduHub**.

---

## 📋 Summary of Required Inputs from You

To enable full production deployment, here is the list of details to provide:

| # | Item Required | Description & Example |
| :--- | :--- | :--- |
| **1** | **Production Domain URL** | Your live website domain (e.g., `https://eduhub.com` or `https://rash-eduhub.vercel.app`). Needed for CORS security. |
| **2** | **Production JWT Secret** | A strong 64-character secret key for signing user sessions in production. |
| **3** | **Google OAuth Production URI** | Your production domain added to Google Cloud Console authorized JavaScript origins. |
| **4** | **Cloud Media Storage (Optional)** | If you want file uploads stored in the cloud (Cloudinary / AWS S3 / Supabase Storage) instead of local disk. |
| **5** | **Custom Brand Details (Optional)** | Site Title, Tagline, Support Email (`support@eduhub.com`), and Social preview image URL. |

---

## 🛠️ Step-by-Step Instructions

### Step 1: Provide Production URLs & Domain
- **What to provide**: Your live production domain name (e.g. `https://eduhub.com`).
- **Why**: Allows us to lock down CORS in `server.js` so unauthorized websites cannot call your API.

---

### Step 2: Google OAuth Configuration
- **What to do**:
  1. Go to [Google Cloud Console](https://console.cloud.google.com/).
  2. Navigate to **APIs & Services** -> **Credentials**.
  3. Edit your OAuth 2.0 Client ID.
  4. Add your live domain to **Authorized JavaScript origins** (e.g. `https://eduhub.com`).
- **What to provide**: Confirmation that your production domain is authorized in Google Console.

---

### Step 3: Database Indexing & RLS Setup in Supabase
- **What to do**:
  Open your **Supabase Dashboard** -> **SQL Editor** and run the following script:
  ```sql
  -- Create performance indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_courses_tutor ON courses(tutor_id);
  CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_course ON reviews(course_id);
  CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id);

  -- Grant full privileges to service_role, anon, authenticated
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role, anon, authenticated;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role, anon, authenticated;
  ```

---

### Step 4: Production Media Storage Selection
- **Option A (Default)**: Server Local Disk Storage (`server/uploads/`).
- **Option B (Recommended for Vercel/Render)**: Supabase Storage Bucket or Cloudinary API Keys:
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

---

### Step 5: SEO & OpenGraph Meta Details
Provide the following branding text to customize your social media preview cards:
- **Site Title**: `RASH EduHub — Modern Interactive Learning Platform`
- **Description**: `Master Web Development, Data Science, and AI with interactive code practice, gamified rewards, and expert instructors.`
- **Support Email**: `support@eduhub.com`
- **Social Preview Image**: URL to your logo/banner image.

---

## 🤖 What Will Be Built Automatically Once You Provide These Details

1. **Security Layer**:
   - `helmet` security headers added to Express backend.
   - Strict CORS policy restricting requests to your domain.
   - `compression` middleware enabled for fast gzipped asset delivery.

2. **Advanced Health Check**:
   - `/api/health` endpoint updated to perform live Supabase pings, measure response latency, and monitor process memory.

3. **Process & Deployment Files**:
   - `Dockerfile` & `docker-compose.yml` generated for containerized hosting.
   - `ecosystem.config.js` generated for PM2 cluster deployment.

4. **PWA & Mobile Ready**:
   - `manifest.json` and Service Worker generated for installable mobile/desktop app support.
   - OpenGraph and Twitter meta tags embedded across all HTML templates.

---

*File generated for RASH EduHub project root.*
