# 🚀 RASH EduHub — Live Deployment Guide (Frontend & Backend from GitHub)

This guide provides step-by-step instructions for hosting and running both the **Node.js Express Backend** and **Frontend Web Application** live on the internet directly from your GitHub repository ([`rishissingh/RASH-Eduhub`](https://github.com/rishissingh/RASH-Eduhub)).

---

## 🌟 Architecture Overview

Because your Node.js server ([`server/server.js`](file:///c:/Users/rishi/OneDrive/Desktop/RASH%20EduHub%201/RASH%20EduHub%201/server/server.js)) is configured to serve API routes under `/api/*` **AND** serve static frontend files (`index.html`, `courses.html`, `css/`, `js/`), you can host **both Frontend and Backend together under 1 free web service**!

| Component | Hosted On | Cost |
| :--- | :--- | :--- |
| **Backend & Frontend App** | [Render.com](https://render.com) (Node.js Web Service) | **Free** |
| **Database** | [Supabase Cloud PostgreSQL](https://supabase.com) | **Free** |
| **Alternative Frontend Only** | [Vercel](https://vercel.com) / GitHub Pages | **Free** |

---

## 🚀 Recommended Method: Deploying Everything on Render (Free & 1-Click)

Render connects directly to your GitHub repository and automatically deploys your app whenever you push code updates.

### Step 1: Create a Free Account on Render
1. Go to [Render.com](https://render.com/).
2. Click **Get Started** -> Sign up with your **GitHub account (`rishissingh`)**.

---

### Step 2: Create a New Web Service
1. On your Render Dashboard, click **New +** -> Select **Web Service**.
2. Select **Build and deploy from a Git repository** -> Click **Next**.
3. Choose your repository: **`rishissingh/RASH-Eduhub`** (Click *Connect*).

---

### Step 3: Configure Build & Runtime Settings
Fill in the following fields on Render:

| Field Name | Value to Enter |
| :--- | :--- |
| **Name** | `rash-eduhub` |
| **Language** | `Node` |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** |

---

### Step 4: Add Environment Variables on Render
Scroll down to the **Environment Variables** section on Render and add your secret keys:

| Environment Variable Key | Value |
| :--- | :--- |
| `PORT` | `5000` |
| `JWT_SECRET` | `rash_eduhub_jwt_super_secret_key_2026` |
| `JWT_EXPIRES_IN` | `7d` |
| `UPLOAD_DIR` | `uploads` |
| `GOOGLE_CLIENT_ID` | `837078721619-6mqtv7fu6n76u29cc1b8bh4ghg0evdn0.apps.googleusercontent.com` |
| `SUPABASE_URL` | `https://jqwzufadvkwwrcuukhkr.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxd3p1ZmFkdmt3d3JjdXVraGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NzMzNzIsImV4cCI6MjEwNzA0OTM3Mn0.Bz-HvkmsKTj12G9hE6gUTEYrTaTxXrWIM7dpFNTVH-c` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxd3p1ZmFkdmt3d3JjdXVraGtyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTQ3MzM3MiwiZXhwIjoyMTA3MDQ5MzcyfQ.HYvkGbyvnU7LNoegl5SyshsTO1pTIA4vvTgpJKkoQUE` |

---

### Step 5: Click "Create Web Service"
- Render will start pulling code from your GitHub repository, running `npm install`, and starting `server.js`.
- In 1–2 minutes, Render will output your live URL:  
  🌐 **`https://rash-eduhub.onrender.com`**

Anyone can visit this URL to use your application frontend, browse courses, log in, practice code, and interact with Supabase database!

---

## ⏰ Keeping Render Server Awake 24/7 with Uptime Robot

Render's free tier Web Service spins down (goes to sleep) after 15 minutes of inactivity. Pinging your site every 5 minutes prevents it from going to sleep.

### Uptime Robot Configuration Settings:
1. Log into [UptimeRobot.com](https://uptimerobot.com/).
2. Click **+ Add New Monitor**.
3. Configure the monitor:
   - **Monitor Type**: `HTTP(s)`
   - **Friendly Name**: `RASH EduHub Keep-Alive`
   - **URL (or IP)**: `https://rash-eduhub.onrender.com/ping` (or `https://rash-eduhub.onrender.com/health`)
   - **Monitoring Interval**: `Every 5 minutes`
4. Click **Create Monitor**.

---

## ⚡ Alternative Option: Host Frontend on Vercel & Backend on Render

If you want your frontend hosted separately on Vercel:

1. **Host Backend on Render**:
   Follow the steps above to deploy `server/` on Render. Your backend API base URL will be:  
   `https://rash-eduhub.onrender.com/api`

2. **Host Frontend on Vercel**:
   - Log into [Vercel.com](https://vercel.com) using GitHub.
   - Click **Add New Project** -> Select `rishissingh/RASH-Eduhub`.
   - Set Root Directory to `./` (root).
   - Click **Deploy**.
   - Your frontend will be live at `https://rash-eduhub.vercel.app`!

---

*File generated for RASH EduHub deployment documentation.*
