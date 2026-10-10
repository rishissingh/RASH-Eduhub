/**
 * RASH EduHub - Courses Catalog & Live Search Controller
 * Controls dynamic course searching, multi-criteria filtering, chips, sorting, and enrollment.
 * Includes simulated API request with premium skeleton loaders and toast feedbacks.
 */

let currentFilters = {
   query: '',
   category: 'All',
   level: 'All',
   price: 'All',
   sortBy: 'popular'
};

document.addEventListener('DOMContentLoaded', () => {
   // Read search query parameter from URL (e.g. ?search_box=python or ?category=Python)
   const urlParams = new URLSearchParams(window.location.search);
   const queryParam = urlParams.get('search_box');
   const categoryParam = urlParams.get('category');

   if (queryParam) currentFilters.query = queryParam;
   if (categoryParam) currentFilters.category = categoryParam;

   initSearchControls();
   renderCoursesWithSkeleton();
});

/**
 * Initialize search inputs, category chips, and filter selectors
 */
function initSearchControls() {
   const searchInput = document.querySelector('#course-search-input');
   if (searchInput) {
      searchInput.value = currentFilters.query;
      searchInput.addEventListener('input', (e) => {
         currentFilters.query = e.target.value;
         renderCoursesWithSkeleton();
      });
   }

   const categoryChips = document.querySelectorAll('.category-chip');
   categoryChips.forEach(chip => {
      if (chip.dataset.category === currentFilters.category) {
         categoryChips.forEach(c => c.classList.remove('active'));
         chip.classList.add('active');
      }

      chip.addEventListener('click', () => {
         categoryChips.forEach(c => c.classList.remove('active'));
         chip.classList.add('active');
         currentFilters.category = chip.dataset.category;
         renderCoursesWithSkeleton();
      });
   });

   const levelSelect = document.querySelector('#filter-level');
   if (levelSelect) {
      levelSelect.addEventListener('change', (e) => {
         currentFilters.level = e.target.value;
         renderCoursesWithSkeleton();
      });
   }

   const priceSelect = document.querySelector('#filter-price');
   if (priceSelect) {
      priceSelect.addEventListener('change', (e) => {
         currentFilters.price = e.target.value;
         renderCoursesWithSkeleton();
      });
   }

   const sortSelect = document.querySelector('#filter-sort');
   if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
         currentFilters.sortBy = e.target.value;
         renderCoursesWithSkeleton();
      });
   }
}

/**
 * Render catalog with simulated network latency to show skeleton cards
 */
let renderTimeout = null;
function renderCoursesWithSkeleton() {
   const container = document.querySelector('#courses-catalog-grid');
   if (!container) return;

   // Render skeleton templates immediately
   container.innerHTML = Array(3).fill(0).map(() => `
      <div class="box glass-card skeleton-card">
         <div style="display: flex; gap: 1.2rem; padding: 2rem 2rem 0; align-items: center;">
            <div class="skeleton skeleton-avatar"></div>
            <div style="flex: 1;">
               <div class="skeleton skeleton-text" style="width: 50%;"></div>
               <div class="skeleton skeleton-text-sm" style="width: 30%;"></div>
            </div>
         </div>
         <div style="padding: 1.5rem 2rem;">
            <div class="skeleton skeleton-thumb" style="height: 16rem;"></div>
            <div class="skeleton skeleton-title" style="margin-top: 1.5rem;"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text-sm"></div>
         </div>
      </div>
   `).join('');

   // Clear previous timeout to debounce fast inputs
   if (renderTimeout) clearTimeout(renderTimeout);

   renderTimeout = setTimeout(() => {
      renderCourses();
   }, 350);
}

/**
 * Render filtered courses grid
 */
async function renderCourses() {
   const container = document.querySelector('#courses-catalog-grid');
   if (!container) return;

   const courses = await CourseService.searchCourses(currentFilters);
   const user = AuthService.getCurrentUser();
   const enrolledIds = user?.enrolledCourses || [];

   if (courses.length === 0) {
      container.innerHTML = `
         <div class="glass-card" style="padding: 6rem; text-align: center; grid-column: 1 / -1; width: 100%;">
            <i class="fas fa-search" style="font-size: 4.5rem; color: var(--light-color); margin-bottom: 1.5rem; opacity: 0.6;"></i>
            <h3 style="font-size: 2.2rem; margin-bottom: 0.8rem; color: var(--black);">No Matching Courses Found</h3>
            <p style="font-size: 1.5rem; color: var(--light-color);">Try adjusting your search terms or filter selections.</p>
         </div>
       `;
      return;
   }

   const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
         const d = new Date(dateStr);
         if (isNaN(d.getTime())) return dateStr;
         return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
         return dateStr;
      }
   };

   container.innerHTML = courses.map((c, index) => {
      const isEnrolled = enrolledIds.includes(c.id) || enrolledIds.includes(c._id);

      return `
         <div class="box glass-card hover-lift fade-in stagger-${(index % 4) + 1}" style="display: flex; flex-direction: column; justify-content: space-between;">
            <div>
               <div class="tutor">
                  <img src="${c.teacherAvatar}" alt="${c.teacherName}">
                  <div class="info">
                     <h3>${c.teacherName}</h3>
                     <span>Updated ${formatDate(c.updatedAt)}</span>
                  </div>
               </div>

               <div class="thumb img-zoom">
                  <img src="${c.thumbnail}" alt="${c.title}">
                  <span><i class="fas fa-play-circle"></i> ${c.lessonsCount} lessons</span>
               </div>

               <div class="course-meta">
                  <span class="badge badge-accent">${c.category}</span>
                  <span style="font-size: 1.8rem; font-weight: 800; color: var(--main-color);">${c.price}</span>
               </div>

               <h3 class="title">${c.title}</h3>
               <p style="font-size: 1.35rem; color: var(--text-secondary); padding: 0 2rem; margin-bottom: 1.5rem; line-height: 1.6;">
                  ${c.description.substring(0, 95)}...
               </p>
            </div>

            <div style="padding: 0 2rem 2rem;">
               <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 1.3rem; color: var(--light-color); border-top: var(--border); padding-top: 1.2rem;">
                  <span><i class="fas fa-star" style="color: var(--orange);"></i> ${c.rating} (${c.reviewsCount})</span>
                  <span><i class="fas fa-user-graduate"></i> ${c.studentsCount} Students</span>
               </div>

               <div class="flex-btn" style="gap: 1rem;">
                  <a href="notes.html?courseId=${c.id || c._id}" class="option-btn" style="text-align: center;" title="View Course Notes">
                     <i class="fas fa-book-open"></i> Notes
                  </a>
                  ${isEnrolled ? `
                     <a href="student/watch-video.html?courseId=${c.id || c._id}" class="btn" style="text-align: center;">
                        <i class="fas fa-play"></i> Watch
                     </a>
                  ` : `
                     <button class="btn" onclick="handleEnroll('${c.id || c._id}')">
                        <i class="fas fa-graduation-cap"></i> Enroll
                     </button>
                  `}
               </div>
            </div>
         </div>
      `;
   }).join('');
}

/**
 * Handle Student Course Enrollment Button
 */
window.handleEnroll = async function(courseId) {
   const user = AuthService.getCurrentUser();
   if (!user) {
      if (window.Toast) window.Toast.warning('Please sign in or register to enroll in courses.', 'Authentication Required');
      setTimeout(() => {
         window.location.href = 'login.html';
      }, 1200);
      return;
   }

   const res = await CourseService.enrollStudent(courseId);
   if (res.success) {
      if (window.Toast) window.Toast.success('Enrollment Successful! Welcome to the course.', 'Enrolled');
      
      const course = await CourseService.getCourseById(courseId);
      
      // Send platform-wide announcement/notification
      if (window.NotificationService) {
         await window.NotificationService.send({
            userId: user.id || user._id,
            title: 'Successfully Enrolled! 📚',
            message: `You are now enrolled in course: ${course?.title || 'New Course'}. Start watching today!`,
            type: 'success',
            link: `student/watch-video.html?courseId=${courseId}`
         });
      }

      setTimeout(() => {
         window.location.href = `student/watch-video.html?courseId=${courseId}`;
      }, 1000);
   } else {
      if (window.Toast) window.Toast.error(res.message, 'Enrollment Failed');
   }
};
