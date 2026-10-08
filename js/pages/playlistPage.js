/**
 * RASH EduHub - Playlist Page Controller
 * Dynamically loads course playlist details, tutor profile, and video lesson list.
 */

document.addEventListener('DOMContentLoaded', async () => {
   const urlParams = new URLSearchParams(window.location.search);
   const courseId = urlParams.get('courseId') || urlParams.get('get_id') || 'course-1';

   const course = await CourseService.getCourseById(courseId) || (await CourseService.getAllCourses())[0];

   if (!course) {
      document.querySelector('.playlist-details').innerHTML = `
         <div class="glass-card" style="padding: 4rem; text-align: center; margin: 3rem auto; max-width: 60rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 4rem; color: var(--red); margin-bottom: 1.5rem;"></i>
            <h2 style="font-size: 2.4rem;">Course Not Found</h2>
            <p style="font-size: 1.5rem; color: var(--light-color); margin: 1rem 0 2rem 0;">The requested course playlist could not be located.</p>
            <a href="courses.html" class="inline-btn">Browse Catalog</a>
         </div>
      `;
      return;
   }

   renderPlaylistDetails(course);
   renderPlaylistVideos(course);
});

function renderPlaylistDetails(course) {
   const detailsSection = document.querySelector('.playlist-details');
   if (!detailsSection) return;

   const user = AuthService.getCurrentUser();
   const isEnrolled = user && ((user.enrolledCourses || []).includes(course.id) || (user.enrolledCourses || []).includes(course._id));

   const formatDate = (dateStr) => {
      if (!dateStr) return 'Recently';
      try {
         const d = new Date(dateStr);
         if (isNaN(d.getTime())) return dateStr;
         return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
         return dateStr;
      }
   };

   detailsSection.innerHTML = `
      <h1 class="heading">Playlist Details</h1>

      <div class="row glass-card" style="padding: 3rem; border-radius: 2.4rem;">
         <div class="column">
            <div class="save-playlist">
               <button onclick="handleBookmarkCourse('${course.id || course._id}')">
                  <i class="far fa-bookmark"></i>
                  <span>Bookmark Course</span>
               </button>
            </div>

            <div class="thumb img-zoom" style="position: relative; overflow: hidden; border-radius: 1.6rem; margin-bottom: 2rem; height: 26rem;">
               <img src="${course.thumbnail}" alt="${course.title}" style="width: 100%; height: 100%; object-fit: cover;">
               <span style="position: absolute; bottom: 1.5rem; right: 1.5rem; background: rgba(0,0,0,0.8); color: #fff; padding: 0.6rem 1.2rem; border-radius: 0.8rem; font-size: 1.3rem;">
                  <i class="fas fa-play-circle"></i> ${(course.playlist || []).length} videos
               </span>
            </div>
         </div>

         <div class="column">
            <div class="tutor" style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
               <img src="${course.teacherAvatar}" alt="${course.teacherName}" style="height: 6rem; width: 6rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--main-color);">
               <div>
                  <h3 style="font-size: 2rem; color: var(--black); margin-bottom: 0.3rem;">${course.teacherName}</h3>
                  <span style="font-size: 1.3rem; color: var(--light-color);">Updated ${formatDate(course.updatedAt)}</span>
               </div>
            </div>

            <div class="details">
               <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap;">
                  <span class="badge badge-accent">${course.category || 'Development'}</span>
                  <span class="badge badge-primary">${course.difficulty || 'All Skill Levels'}</span>
                  <strong style="font-size: 2rem; color: var(--main-color); margin-left: auto;">${course.price || 'Free'}</strong>
               </div>

               <h2 style="font-size: 2.8rem; color: var(--black); margin-bottom: 1.2rem; line-height: 1.3;">${course.title}</h2>
               <p style="font-size: 1.5rem; color: var(--light-color); line-height: 1.7; margin-bottom: 2.5rem;">${course.description}</p>
               
               <div class="flex-btn" style="gap: 1.5rem;">
                  <a href="teacher_profile.html?teacherId=${course.teacherId || ''}" class="inline-btn" style="text-align: center;">
                     <i class="fas fa-user"></i> View Instructor
                  </a>
                  ${isEnrolled ? `
                     <a href="student/watch-video.html?courseId=${course.id || course._id}" class="btn" style="text-align: center;">
                        <i class="fas fa-play"></i> Watch Playlist Videos
                     </a>
                  ` : `
                     <button class="btn" onclick="handlePlaylistEnroll('${course.id || course._id}')">
                        <i class="fas fa-graduation-cap"></i> Enroll & Start Learning
                     </button>
                  `}
               </div>
            </div>
         </div>
      </div>
   `;
}

function renderPlaylistVideos(course) {
   const videosSection = document.querySelector('.playlist-videos');
   if (!videosSection) return;

   const lessons = course.playlist || [];

   if (lessons.length === 0) {
      videosSection.innerHTML = `
         <h1 class="heading">Playlist Videos</h1>
         <div class="glass-card text-center" style="padding: 4rem;">
            <p style="font-size: 1.6rem; color: var(--light-color);">No video lessons uploaded for this course yet.</p>
         </div>
      `;
      return;
   }

   videosSection.innerHTML = `
      <h1 class="heading">Playlist Videos (${lessons.length})</h1>

      <div class="box-container" style="grid-template-columns: repeat(auto-fit, minmax(30rem, 1fr)); gap: 2rem;">
         ${lessons.map((lesson, idx) => `
            <a class="box glass-card hover-lift" href="student/watch-video.html?courseId=${course.id || course._id}&videoId=${lesson.id}" style="padding: 2rem; display: flex; flex-direction: column; justify-content: space-between;">
               <div>
                  <div style="position: relative; overflow: hidden; border-radius: 1.2rem; height: 16rem; margin-bottom: 1.5rem;" class="img-zoom">
                     <img src="${lesson.thumbnail || course.thumbnail}" alt="${lesson.title}" style="width: 100%; height: 100%; object-fit: cover;">
                     <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 3.5rem;">
                        <i class="fas fa-play-circle" style="filter: drop-shadow(0 4px 12px rgba(0,0,0,0.5));"></i>
                     </div>
                     <span style="position: absolute; bottom: 1rem; right: 1rem; background: rgba(0,0,0,0.8); color: #fff; padding: 0.3rem 0.8rem; border-radius: 0.6rem; font-size: 1.2rem;">
                        ${lesson.duration || '10:00'}
                     </span>
                  </div>
                  <span style="font-size: 1.3rem; color: var(--main-color); font-weight: 700;">Lesson ${idx + 1}</span>
                  <h3 class="title" style="font-size: 1.7rem; color: var(--black); margin-top: 0.4rem;">${lesson.title}</h3>
               </div>
            </a>
         `).join('')}
      </div>
   `;
}

window.handlePlaylistEnroll = async function(courseId) {
   const user = AuthService.getCurrentUser();
   if (!user) {
      if (window.Toast) window.Toast.warning('Please sign in to enroll.', 'Auth Required');
      setTimeout(() => window.location.href = 'login.html', 1000);
      return;
   }

   const res = await CourseService.enrollStudent(courseId);
   if (res.success) {
      if (window.Toast) window.Toast.success('Successfully enrolled!', 'Enrolled');
      setTimeout(() => window.location.reload(), 800);
   } else {
      if (window.Toast) window.Toast.error(res.message, 'Enrollment Failed');
   }
};
