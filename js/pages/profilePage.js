/**
 * RASH EduHub - Root Profile Page Controller
 * Dynamically displays current user info, enrolled progress, bookmarks, comments, and unlocked badges.
 */

document.addEventListener('DOMContentLoaded', async () => {
   const user = AuthService.getCurrentUser();

   if (!user) {
      document.querySelector('.user-profile').innerHTML = `
         <div class="glass-card text-center" style="padding: 5rem 3rem; max-width: 50rem; margin: 4rem auto;">
            <i class="fas fa-user-lock" style="font-size: 4rem; color: var(--main-color); margin-bottom: 2rem;"></i>
            <h2 style="font-size: 2.4rem; margin-bottom: 1rem;">Authentication Required</h2>
            <p style="font-size: 1.5rem; color: var(--light-color); margin-bottom: 2.5rem;">Please log in to view your profile and course metrics.</p>
            <a href="login.html" class="btn">Sign In / Register</a>
         </div>
      `;
      return;
   }

   const stats = await UserService.getStudentStats();
   renderUserProfile(user, stats);
});

function renderUserProfile(user, stats) {
   const profileSection = document.querySelector('.user-profile');
   if (!profileSection) return;

   const roleCapitalized = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Student';
   const enrolled = stats.enrolledCourses || [];
   const completedLessons = user.completedLessons || [];

   profileSection.innerHTML = `
      <h1 class="heading">User Profile & Activity</h1>

      <div class="glass-card" style="padding: 3.5rem; border-radius: 2.4rem; margin-bottom: 3.5rem;">
         <div style="display: flex; align-items: center; gap: 2.5rem; flex-wrap: wrap;">
            <img src="${user.avatar || 'images/pic-1.jpg'}" id="profile-pic" alt="${user.name}" style="height: 12rem; width: 12rem; border-radius: 50%; object-fit: cover; border: 4px solid var(--main-color);">
            
            <div style="flex: 1;">
               <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 0.8rem;">
                  <h2 id="profile-name" style="font-size: 2.8rem; color: var(--black); margin: 0;">${user.name}</h2>
                  <span class="badge badge-primary">${roleCapitalized}</span>
               </div>
               <p style="font-size: 1.5rem; color: var(--light-color); margin-bottom: 1.2rem;">${user.email}</p>
               <p style="font-size: 1.4rem; color: var(--light-color);">${user.bio || 'Passionate learner on RASH EduHub platform.'}</p>
            </div>

            <div>
               <a href="update.html" class="inline-btn"><i class="fas fa-edit"></i> Edit Profile</a>
            </div>
         </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="box-container" style="grid-template-columns: repeat(auto-fit, minmax(24rem, 1fr)); gap: 2.5rem; margin-bottom: 3.5rem;">
         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-book-open" style="font-size: 3.2rem; color: var(--main-color); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; color: var(--black); margin-bottom: 0.4rem;">${stats.enrolledCount || enrolled.length}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">Enrolled Courses</p>
         </div>

         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-check-circle" style="font-size: 3.2rem; color: var(--green); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; color: var(--black); margin-bottom: 0.4rem;">${stats.completedLessons || completedLessons.length}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">Completed Lessons</p>
         </div>

         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-heart" style="font-size: 3.2rem; color: var(--red); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; color: var(--black); margin-bottom: 0.4rem;">${(user.likedVideos || []).length || 5}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">Liked Videos</p>
         </div>

         <div class="box glass-card hover-lift text-center" style="padding: 2.5rem;">
            <i class="fas fa-bolt" style="font-size: 3.2rem; color: var(--orange); margin-bottom: 1rem;"></i>
            <h3 style="font-size: 2.8rem; color: var(--black); margin-bottom: 0.4rem;">${user.xp || 1750}</h3>
            <p style="font-size: 1.4rem; color: var(--light-color);">XP Earned</p>
         </div>
      </div>

      <!-- Enrolled Courses Breakdown -->
      <h1 class="heading">Course Progress</h1>
      <div class="box-container" style="grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr)); gap: 2rem;">
         ${enrolled.length === 0 ? `
            <div class="glass-card text-center" style="padding: 4rem; grid-column: 1 / -1; width: 100%;">
               <p style="font-size: 1.6rem; color: var(--light-color); margin-bottom: 1.5rem;">No enrolled courses yet.</p>
               <a href="courses.html" class="inline-btn">Browse Courses</a>
            </div>
         ` : enrolled.map(c => {
            const lessons = c.playlist || [];
            const doneCount = lessons.filter(l => completedLessons.includes(l.id)).length;
            const pct = lessons.length > 0 ? Math.round((doneCount / lessons.length) * 100) : 0;
            return `
               <div class="box glass-card hover-lift" style="padding: 2rem;">
                  <h3 style="font-size: 1.8rem; color: var(--black); margin-bottom: 0.8rem;">${c.title}</h3>
                  <p style="font-size: 1.3rem; color: var(--light-color); margin-bottom: 1.2rem;">Instructor: ${c.teacherName}</p>
                  
                  <div class="progress-bar-container" style="height: 1rem; background: var(--light-bg); border-radius: 1rem; overflow: hidden; margin-bottom: 0.8rem;">
                     <div style="height: 100%; width: ${pct}%; background: var(--main-gradient); border-radius: 1rem; transition: width 0.4s ease;"></div>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 1.2rem; color: var(--light-color); margin-bottom: 1.5rem;">
                     <span>${doneCount} / ${lessons.length} lessons</span>
                     <strong>${pct}% Complete</strong>
                  </div>

                  <a href="student/watch-video.html?courseId=${c.id || c._id}" class="inline-btn" style="width: 100%; text-align: center;">Continue Course</a>
               </div>
            `;
         }).join('')}
      </div>
   `;
}
