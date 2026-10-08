/**
 * RASH EduHub - Student Dashboard Controller
 * Manages student metrics, continue learning progress, certificates, enrolled courses, profile,
 * and integrates with all 4 Python AI microservices:
 *   1. Adaptive Engine (composite scores, difficulty recalibration, weekly study plan)
 *   2. Multimodal Engagement Tracker (camera focus state, session sync)
 *   3. AI Career & Practice Recommendations
 */

document.addEventListener('DOMContentLoaded', async () => {
   // Enforce Student Role Access Guard
   if (!await AuthService.guardRoute(['student'])) return;

   const user = AuthService.getCurrentUser();
   const stats = await UserService.getStudentStats();

   await renderStudentOverview(user, stats);
   renderContinueLearning(stats.enrolledCourses);
   renderMyCourses(stats.enrolledCourses);
   await renderProgressAndCertificates(stats);
   renderStudentProfile(user, stats);
   initWeeklyActivityChart();

   // Initialize AI Core Microservices Panels
   initAdaptiveEnginePanel(user);
   initEngagementTrackerWidget(user);
   initCareerRecommendations(user);
});

/**
 * Render Student Overview Header & Stat Counters
 */
async function renderStudentOverview(user, stats) {
   const gStats = window.GamificationService ? await GamificationService.getStats() : { xp: 1750, coins: 50, streak: 7, rank: 3, level: 6 };

   const welcomeContainer = document.querySelector('#student-welcome-banner');
   if (welcomeContainer) {
      welcomeContainer.innerHTML = `
         <div class="glass-card" style="padding: 3rem; background: var(--main-gradient); color: #fff; border-radius: 2.4rem; position: relative; overflow: hidden;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 2rem;">
               <div>
                  <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
                     <span class="badge" style="background: rgba(255,255,255,0.2); color: #fff; border: none;">Student Workspace</span>
                     <span class="badge" style="background: rgba(255,140,0,0.3); color: #fff;"><i class="fas fa-fire" style="color: var(--orange);"></i> ${gStats.streak} Day Streak!</span>
                     <span class="badge" style="background: rgba(30,144,255,0.3); color: #fff;"><i class="fas fa-coins" style="color: gold;"></i> ${gStats.coins} Coins</span>
                  </div>
                  <h1 style="font-size: 3.2rem; color: #fff; margin-bottom: 0.5rem;">Welcome back, ${user.name}! 👋</h1>
                  <p style="font-size: 1.6rem; opacity: 0.95;">Level ${gStats.level} Learner &bull; <strong>${gStats.xp} XP</strong> &bull; You have completed <strong>${stats.overallProgress}%</strong> of your course goals.</p>
               </div>
               
               <div class="flex-btn" style="width: auto; gap: 1rem;">
                  <a href="code-practice.html" class="btn" style="background: #fff; color: var(--main-color); width: auto; font-weight: 700;">
                     <i class="fas fa-terminal"></i> Code Sandbox
                  </a>
                  <a href="ai-predict.html" class="option-btn" style="background: rgba(255,255,255,0.2); color: #fff; border: 1px solid rgba(255,255,255,0.4); width: auto;">
                     <i class="fas fa-brain"></i> Marks Predictor
                  </a>
               </div>
            </div>
         </div>
      `;
   }

   const statsContainer = document.querySelector('#student-stats-grid');
   if (statsContainer) {
      statsContainer.innerHTML = `
         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-bolt" style="font-size: 3rem; color: var(--main-color); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; margin-bottom: 0.3rem; color: var(--black);">${gStats.xp}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">Total XP Points</p>
         </div>

         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-book-open" style="font-size: 3rem; color: var(--accent-color); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; margin-bottom: 0.3rem; color: var(--black);">${stats.enrolledCount}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">Enrolled Courses</p>
         </div>

         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-circle-check" style="font-size: 3rem; color: var(--green); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; margin-bottom: 0.3rem; color: var(--black);">${stats.completedLessons}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">Lessons Completed</p>
         </div>

         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-trophy" style="font-size: 3rem; color: var(--orange); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; margin-bottom: 0.3rem; color: var(--black);">#${gStats.rank}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">Global Rank</p>
         </div>
      `;
   }
}

/**
 * Module 1: Adaptive Learning Engine Panel Initialization
 */
async function initAdaptiveEnginePanel(user) {
   const diffBadge = document.querySelector('#adaptive-diff-badge');
   const scoreVal = document.querySelector('#adaptive-score-val');
   const recalibrateBtn = document.querySelector('#btn-recalibrate-diff');
   const generatePlanBtn = document.querySelector('#btn-generate-plan');
   const planOutput = document.querySelector('#study-plan-output');
   const planDaysList = document.querySelector('#study-plan-days');

   if (!diffBadge || !scoreVal) return;

   // Load user's adaptive profile
   const profileData = await AIService.getAdaptiveProfile(user._id || user.id || 'user-1');
   const profile = profileData.profile || {};
   const scores = profileData.scores || {};

   diffBadge.textContent = profile.current_difficulty || 'Beginner';
   scoreVal.textContent = `${Math.round((scores.composite_score || 0.68) * 100)}%`;

   if (recalibrateBtn) {
      recalibrateBtn.addEventListener('click', async () => {
         if (window.Toast) window.Toast.info('Recalibrating performance metrics & difficulty...', 'Adaptive Engine');
         const res = await AIService.recalibrateDifficulty(user._id || user.id || 'user-1');
         if (res.success && res.difficulty_adjustment) {
            const adj = res.difficulty_adjustment;
            diffBadge.textContent = adj.new_level || profile.current_difficulty;
            scoreVal.textContent = `${Math.round((res.scores?.composite_score || 0.70) * 100)}%`;

            if (window.Toast) {
               window.Toast.success(adj.reason || 'Difficulty recalibrated successfully!', 'Recalibration Complete');
            }
         }
      });
   }

   if (generatePlanBtn) {
      generatePlanBtn.addEventListener('click', async () => {
         if (window.Toast) window.Toast.info('Generating personalized study plan...', 'AI Engine');
         const res = await AIService.generateStudyPlan(user._id || user.id || 'user-1', 7);
         
         if (res.success && res.study_plan) {
            const plan = res.study_plan;
            planOutput.style.display = 'block';

            planDaysList.innerHTML = (plan.daily_plans || []).map(dp => `
               <div style="background: var(--light-bg); padding: 1.2rem 1.5rem; border-radius: 1rem; font-size: 1.3rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                     <strong style="color: var(--black);">${dp.day_name} (Day ${dp.day_number})</strong>
                     <span class="badge badge-primary">${dp.total_minutes} mins</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                     ${(dp.activities || []).map(act => `
                        <div style="color: var(--light-color); display: flex; align-items: center; gap: 0.8rem;">
                           <span>${act.icon || '📖'}</span>
                           <span>${act.description} (${act.duration_minutes}m)</span>
                        </div>
                     `).join('')}
                  </div>
               </div>
            `).join('');

            if (window.Toast) window.Toast.success('Personalized weekly study plan generated!', 'Study Plan Ready');
         }
      });
   }
}

/**
 * Module 2: Real-Time Multimodal Engagement Tracker Widget
 */
function initEngagementTrackerWidget(user) {
   const statusTag = document.querySelector('#tracker-status-tag');
   const statusText = document.querySelector('#tracker-status-text');
   const toggleBtn = document.querySelector('#btn-toggle-tracker');

   if (!statusTag || !statusText || !toggleBtn) return;

   let isTracking = false;
   let trackingInterval = null;
   let localMediaStream = null;
   let pollTimeoutId = null;

   const container = document.querySelector('#webcam-container');
   const loader = document.querySelector('#webcam-loader');
   const loaderMsg = document.querySelector('#webcam-loader-msg');
   const webcamFeed = document.querySelector('#webcam-feed');
   const webcamVideo = document.querySelector('#webcam-video');

   toggleBtn.addEventListener('click', async () => {
      isTracking = !isTracking;

      if (isTracking) {
         if (container) container.style.display = 'block';
         if (loader) loader.style.display = 'flex';
         if (loaderMsg) loaderMsg.textContent = 'Opening webcam & loading AI models...';
         if (webcamFeed) {
            webcamFeed.style.display = 'none';
            webcamFeed.src = '';
         }

         // Step 1: Open native client camera immediately as zero-latency instant preview
         try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
               localMediaStream = await navigator.mediaDevices.getUserMedia({
                  video: { width: { ideal: 640 }, height: { ideal: 480 } }
               });
               if (webcamVideo && localMediaStream) {
                  webcamVideo.srcObject = localMediaStream;
                  webcamVideo.style.display = 'block';
                  if (loader) loader.style.display = 'none';
               }
            }
         } catch (camErr) {
            console.warn('[Webcam Monitor] Native getUserMedia failed or restricted:', camErr);
         }

         // Step 2: Start Python AI engagement tracker process
         try {
            await fetch('/api/ai/engagement/tracker/start', { method: 'POST' });
         } catch (e) {
            console.error('Failed to start Python tracker backend:', e);
         }

         // Step 3: Poll for backend AI model readiness
         let attempts = 0;
         const maxAttempts = 30; // 15 seconds

         const checkTrackerReady = async () => {
            if (!isTracking) return;
            attempts++;
            try {
               const res = await fetch('/api/ai/engagement/tracker/status');
               const data = await res.json();

               if (data && data.running && data.ready) {
                  // AI model and stream ready! Attach MJPEG stream
                  if (webcamFeed) {
                     webcamFeed.src = `http://localhost:5005/video_feed?t=${Date.now()}`;
                     webcamFeed.style.display = 'block';

                     webcamFeed.onload = () => {
                        if (loader) loader.style.display = 'none';
                        if (webcamVideo) webcamVideo.style.display = 'none';
                     };

                     webcamFeed.onerror = () => {
                        console.warn('[Webcam Monitor] Stream error, keeping native video active.');
                        if (webcamVideo && localMediaStream) {
                           webcamVideo.style.display = 'block';
                        }
                        if (loader) loader.style.display = 'none';
                     };
                  }
                  if (loader) loader.style.display = 'none';
                  return;
               }
            } catch (err) {
               // Port 5005 still booting up
            }

            if (attempts < maxAttempts && isTracking) {
               pollTimeoutId = setTimeout(checkTrackerReady, 500);
            } else if (isTracking) {
               // Attempt direct connect to video_feed as last resort
               if (webcamFeed) {
                  webcamFeed.src = `http://localhost:5005/video_feed?t=${Date.now()}`;
                  webcamFeed.style.display = 'block';
               }
               if (loader) loader.style.display = 'none';
            }
         };

         pollTimeoutId = setTimeout(checkTrackerReady, 1000);

         toggleBtn.innerHTML = `<i class="fas fa-video-slash"></i> Stop Camera Focus Tracking`;
         toggleBtn.classList.replace('inline-btn', 'delete-btn');
         statusTag.className = 'badge badge-success';
         statusTag.innerHTML = `<i class="fas fa-circle-dot"></i> Camera Tracking Active`;
         statusText.textContent = 'Focused (Local MediaPipe Processing Active)';

         if (window.Toast) window.Toast.success('Real-time engagement tracker active!', 'Camera Tracker');

         // Engagement sync ping
         trackingInterval = setInterval(() => {
            AIService.sendEngagementStatus(user._id || 'user-1', [{
               timestamp: Date.now() / 1000,
               status: 'Focused',
               gaze_centered: true,
               pose_normal: true,
               is_active: true,
               lookaway_duration: 0
            }]);
         }, 30000);

      } else {
         // Stop tracking
         if (pollTimeoutId) clearTimeout(pollTimeoutId);
         if (trackingInterval) clearInterval(trackingInterval);

         // Stop native camera tracks
         if (localMediaStream) {
            try {
               localMediaStream.getTracks().forEach(t => t.stop());
            } catch (e) {}
            localMediaStream = null;
         }
         if (webcamVideo) {
            webcamVideo.srcObject = null;
            webcamVideo.style.display = 'none';
         }

         // Stop Python AI tracker
         try {
            await fetch('/api/ai/engagement/tracker/stop', { method: 'POST' });
         } catch (e) {
            console.error('Failed to stop tracker', e);
         }

         if (webcamFeed) {
            webcamFeed.src = '';
            webcamFeed.style.display = 'none';
         }
         if (container) container.style.display = 'none';
         if (loader) loader.style.display = 'none';

         toggleBtn.innerHTML = `<i class="fas fa-video"></i> Start Camera Focus Tracking`;
         toggleBtn.classList.replace('delete-btn', 'inline-btn');
         statusTag.className = 'badge badge-primary';
         statusTag.innerHTML = `<i class="fas fa-check-circle"></i> Focused`;
         statusText.textContent = 'Focused (Tracking Paused)';
      }
   });
}

/**
 * Module 4: AI Career Roadmaps & Practice Recommendations
 */
async function initCareerRecommendations(user) {
   const container = document.querySelector('#career-recommendations-list');
   if (!container) return;

   const recData = await AIService.getCareerRecommendations(user._id || 'user-1');
   const roadmaps = Array.isArray(recData.roadmaps) ? recData.roadmaps : [];
   const notice = recData.message ? `<div style="margin-bottom: 1rem; padding: 1rem 1.2rem; border-radius: 1rem; background: #f8f9fa; color: #333; border: 1px solid #d2d6dc; font-size: 0.95rem;">${recData.message}</div>` : '';

   if (roadmaps.length === 0) {
      container.innerHTML = `${notice}<div class="glass-card" style="padding: 1.5rem; text-align: center; font-size: 1.2rem; color: var(--light-color);">No career recommendations are available at the moment. Please try again later.</div>`;
      return;
   }

   container.innerHTML = `${notice}${roadmaps.map(rm => `
      <div style="background: var(--light-bg); padding: 1.5rem; border-radius: 1.2rem; font-size: 1.3rem; margin-bottom: 1rem;">
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; gap: 1rem; flex-wrap: wrap;">
            <strong style="color: var(--black); font-size: 1.45rem;">${rm.title}</strong>
            <span class="badge badge-success">${rm.match_score_percentage}% Match</span>
         </div>
         <p style="color: var(--light-color); font-size: 1.25rem; margin-bottom: 0.8rem;">
            Readiness: <strong>${rm.readiness_percentage}%</strong> &bull; Target Skills to master: ${Array.isArray(rm.missing_skills) && rm.missing_skills.length ? rm.missing_skills.join(', ') : 'None'}
         </p>
         ${rm.recommended_courses && rm.recommended_courses.length ? `
            <div style="display: flex; align-items: center; justify-content: space-between; background: var(--card-bg); padding: 0.8rem 1.2rem; border-radius: 0.8rem; border: var(--border); margin-bottom: 0.8rem;">
               <span style="color: var(--black);"><i class="fas fa-graduation-cap" style="color: var(--main-color);"></i> ${rm.recommended_courses[0].title}</span>
               <a href="../courses.html" style="color: var(--main-color); font-weight: 700;">Explore &rarr;</a>
            </div>
         ` : ''}
         ${rm.recommended_readings && rm.recommended_readings.length ? `
            <div style="display: grid; gap: 0.4rem; font-size: 1rem; color: var(--light-color);">
               <strong style="color: var(--black);">Recommended Reading</strong>
               ${rm.recommended_readings.slice(0, 2).map(reading => `<span>• ${reading}</span>`).join('')}
            </div>
         ` : ''}
      </div>
   `).join('')}`;
}

/**
 * Render Continue Learning Cards on Student Dashboard
 */
function renderContinueLearning(enrolledCourses) {
   const container = document.querySelector('#continue-learning-container');
   if (!container) return;

   if (!enrolledCourses || enrolledCourses.length === 0) {
      container.innerHTML = `
         <div class="glass-card" style="padding: 3rem; text-align: center; width: 100%;">
            <p style="font-size: 1.6rem; color: var(--light-color); margin-bottom: 1.5rem;">You are not enrolled in any courses yet.</p>
            <a href="../courses.html" class="inline-btn">Explore Course Catalog</a>
         </div>
      `;
      return;
   }

   const user = AuthService.getCurrentUser();
   const completed = user?.completedLessons || [];

   container.innerHTML = enrolledCourses.map(c => {
      const lessons = c.playlist || [];
      const completedCount = lessons.filter(l => completed.includes(l.id)).length;
      const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
      const nextLesson = lessons.find(l => !completed.includes(l.id)) || lessons[0];

      return `
         <div class="box glass-card hover-lift" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
               <div class="thumb" style="margin-bottom: 1.5rem; border-radius: 1rem; overflow: hidden; height: 16rem; position: relative;">
                  <img src="../${c.thumbnail}" alt="${c.title}" style="width: 100%; height: 100%; object-fit: cover;">
                  <span style="position: absolute; bottom: 1rem; right: 1rem; background: rgba(0,0,0,0.7); color: #fff; padding: 0.4rem 0.8rem; border-radius: 0.6rem; font-size: 1.2rem;">
                     ${percent}% Done
                  </span>
               </div>
               <h3 class="title" style="font-size: 1.8rem; margin-bottom: 1rem; color: var(--black);">${c.title}</h3>
               <p style="font-size: 1.4rem; color: var(--light-color); margin-bottom: 1rem;">
                  Instructor: <strong>${c.teacherName}</strong>
               </p>
               
               <div class="progress-bar-container">
                  <div class="progress-bar-fill" style="width: ${percent}%;"></div>
               </div>
               <p style="font-size: 1.2rem; color: var(--light-color); text-align: right; margin-top: 0.4rem;">${completedCount} of ${lessons.length} lessons</p>
            </div>

            <a href="watch-video.html?courseId=${c.id}&videoId=${nextLesson?.id || ''}" class="btn" style="margin-top: 1.5rem;">
               <i class="fas fa-play-circle"></i> ${percent === 100 ? 'Review Course' : 'Continue Lesson'}
            </a>
         </div>
      `;
   }).join('');
}

function renderMyCourses(enrolledCourses) {
   const container = document.querySelector('#my-courses-grid');
   if (!container) return;

   if (!enrolledCourses || enrolledCourses.length === 0) {
      container.innerHTML = `
         <div class="glass-card" style="padding: 4rem; text-align: center; width: 100%;">
            <i class="fas fa-book-open" style="font-size: 4rem; color: var(--light-color); margin-bottom: 1.5rem;"></i>
            <h3 style="font-size: 2.2rem; margin-bottom: 0.8rem;">No Enrolled Courses Found</h3>
            <a href="../courses.html" style="color: var(--main-color); font-size: 1.6rem; font-weight: 600;">Browse Catalog</a>
         </div>
      `;
      return;
   }

   container.innerHTML = enrolledCourses.map(c => `
      <div class="box glass-card hover-lift">
         <div class="tutor">
            <img src="../${c.teacherAvatar}" alt="${c.teacherName}">
            <div class="info">
               <h3>${c.teacherName}</h3>
               <span>Updated ${c.updatedAt}</span>
            </div>
         </div>
         <div class="thumb" style="height: 18rem; overflow: hidden; border-radius: 1rem; margin-bottom: 1.5rem;">
            <img src="../${c.thumbnail}" alt="${c.title}" style="width: 100%; height: 100%; object-fit: cover;">
         </div>
         <h3 class="title" style="font-size: 1.8rem; color: var(--black);">${c.title}</h3>
         <a href="watch-video.html?courseId=${c.id}" class="inline-btn" style="width: 100%; text-align: center; margin-top: 1rem;">
            Watch Videos & Notes
         </a>
      </div>
   `).join('');
}

async function renderProgressAndCertificates(stats) {
   const user = AuthService.getCurrentUser();
   const gStats = window.GamificationService ? await GamificationService.getStats() : { xp: 1750, coins: 50, streak: 7, badges: [] };

   const streakVal = document.querySelector('#progress-streak');
   const xpVal = document.querySelector('#progress-xp');
   const badgeVal = document.querySelector('#progress-badges');
   const certVal = document.querySelector('#progress-certs');

   if (streakVal) streakVal.textContent = `${gStats.streak} Days`;
   if (xpVal) xpVal.textContent = `${gStats.xp.toLocaleString()} XP`;
   if (badgeVal) badgeVal.textContent = `${gStats.badges.length} Badges`;

   const badgesGrid = document.querySelector('#badges-grid');
   if (badgesGrid && gStats.badges) {
      badgesGrid.innerHTML = gStats.badges.map(b => `
         <div class="glass-card text-center hover-lift" style="padding: 2rem 1.5rem; display: flex; flex-direction: column; align-items: center; justify-content: center;">
            <i class="fas ${b.icon}" style="font-size: 3rem; color: ${b.color}; margin-bottom: 1rem;"></i>
            <h4 style="font-size: 1.5rem; color: var(--black); margin-bottom: 0.2rem;">${b.name}</h4>
            <span style="font-size: 1.15rem; color: var(--light-color);">Unlocked</span>
         </div>
      `).join('');
   }

   const certContainer = document.querySelector('#certificates-container');
   if (certContainer) {
      const completed = user?.completedLessons || [];
      const enrolled = stats.enrolledCourses || [];
      const completedCourses = enrolled.filter(c => {
         const lessons = c.playlist || [];
         return lessons.length > 0 && lessons.every(l => completed.includes(l.id));
      });

      if (certVal) certVal.textContent = completedCourses.length;

      if (completedCourses.length === 0) {
         certContainer.innerHTML = `
            <div class="glass-card" style="padding: 4rem; text-align: center; grid-column: 1 / -1; width: 100%;">
               <i class="fas fa-certificate" style="font-size: 4rem; color: var(--light-color); margin-bottom: 1.5rem; opacity: 0.5;"></i>
               <h3 style="font-size: 2rem; margin-bottom: 0.8rem; color: var(--black);">No Certificates Unlocked Yet</h3>
               <p style="font-size: 1.4rem; color: var(--light-color);">Complete all lessons in a course to receive your official certificate.</p>
            </div>
         `;
         return;
      }

      certContainer.innerHTML = completedCourses.map(c => `
         <div class="glass-card text-center hover-lift" style="padding: 3rem 2rem;">
            <i class="fas fa-award" style="font-size: 4.5rem; color: var(--orange); margin-bottom: 1.5rem;"></i>
            <h3 style="font-size: 2rem; margin-bottom: 0.8rem; color: var(--black);">Certificate of Achievement</h3>
            <p style="font-size: 1.4rem; color: var(--light-color); margin-bottom: 2rem;">
               Awarded to <strong>${user.name}</strong> for successfully completing 100% of course: <strong>${c.title}</strong> on RASH EduHub.
            </p>
            <button class="inline-btn" style="width: 100%;" onclick="downloadCertificate('${user.name}', '${c.title}')">
               <i class="fas fa-download"></i> Download Official Certificate
            </button>
         </div>
      `).join('');
   }
}

window.downloadCertificate = function(studentName, courseTitle) {
   if (window.Toast) {
      window.Toast.success('Generating official PDF certificate...', 'Success');
   }
   
   setTimeout(() => {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
         <html>
            <head>
               <title>RASH EduHub Certificate of Completion</title>
               <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
               <style>
                  body { font-family: 'Outfit', sans-serif; text-align: center; background: #fafafa; padding: 40px; }
                  .border-pattern { border: 15px double #2563eb; padding: 40px; background: #fff; max-width: 800px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
                  .title { font-size: 42px; color: #0f172a; margin-bottom: 10px; font-weight: 700; }
                  .subtitle { font-size: 16px; text-transform: uppercase; letter-spacing: 3px; color: #64748b; margin-bottom: 40px; }
                  .name { font-size: 32px; color: #2563eb; border-bottom: 2px solid #e2e8f0; display: inline-block; padding-bottom: 5px; margin-bottom: 30px; font-weight: 700; }
                  .desc { font-size: 18px; color: #475569; line-height: 1.6; max-width: 600px; margin: 0 auto 40px; }
                  .footer-meta { display: flex; justify-content: space-between; max-width: 600px; margin: 40px auto 0; font-size: 14px; color: #64748b; }
                  .signature { border-top: 1px solid #cbd5e1; padding-top: 5px; width: 180px; }
               </style>
            </head>
            <body onload="window.print()">
               <div class="border-pattern">
                  <div class="title">Certificate of Completion</div>
                  <div class="subtitle">RASH EduHub EdTech Platform</div>
                  <p style="font-size: 16px; color: #64748b; margin-bottom: 10px;">THIS CERTIFICATE IS PROUDLY PRESENTED TO</p>
                  <div class="name">${studentName}</div>
                  <div class="desc">
                     for successfully completing and mastering all lesson curriculum, assignments, and quizzes for the course: <br>
                     <strong style="color: #0f172a;">"${courseTitle}"</strong>
                  </div>
                  <div class="footer-meta">
                     <div>
                        <p>Date: ${new Date().toLocaleDateString()}</p>
                        <p>ID: CERT-${Date.now().toString().slice(-6)}</p>
                     </div>
                     <div class="signature">
                        <strong style="color:#2563eb; font-size:18px;">Harsh Singh</strong>
                        <p>Platform Director</p>
                     </div>
                  </div>
               </div>
            </body>
         </html>
      `);
      printWindow.document.close();
   }, 1500);
};

function renderStudentProfile(user, stats) {
   const profileForm = document.querySelector('#student-profile-form');
   if (!profileForm) return;

   profileForm.querySelector('[name="name"]').value = user.name;
   profileForm.querySelector('[name="email"]').value = user.email;
   if (profileForm.querySelector('[name="bio"]')) {
      profileForm.querySelector('[name="bio"]').value = user.bio || '';
   }

   profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updatedName = profileForm.querySelector('[name="name"]').value;
      const updatedBio = profileForm.querySelector('[name="bio"]')?.value || '';

      const res = await UserService.updateProfile({ name: updatedName, bio: updatedBio });
      if (res.success) {
         if (window.Toast) window.Toast.success('Profile updated successfully!', 'Profile Saved');
         setTimeout(() => {
            window.location.reload();
         }, 800);
      } else {
         if (window.Toast) window.Toast.error(res.message || 'Profile update failed.', 'Error');
      }
   });
}

function initWeeklyActivityChart() {
   const ctx = document.getElementById('weeklyActivityChart');
   if (!ctx) return;

   const isDark = document.body.classList.contains('dark');
   const textColor = isDark ? '#94a3b8' : '#64748b';
   const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(0, 0, 0, 0.04)';

   new Chart(ctx, {
      type: 'line',
      data: {
         labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
         datasets: [{
            label: 'Study Hours',
            data: [1.5, 2.8, 1.2, 3.5, 0.8, 4.2, 2.0],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.08)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#2563eb',
            pointHoverRadius: 7
         }]
      },
      options: {
         responsive: true,
         maintainAspectRatio: false,
         plugins: { legend: { display: false } },
         scales: {
            y: { grid: { color: gridColor }, ticks: { color: textColor } },
            x: { grid: { display: false }, ticks: { color: textColor } }
         }
      }
   });
}
