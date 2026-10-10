/**
 * RASH EduHub - Sidebar Component
 * Dynamically renders navigation links based on user role (Student, Teacher, Admin, Guest).
 */

const SidebarComponent = {
   init() {
      const sidebarEl = document.querySelector('.side-bar');
      if (!sidebarEl) return;

      const user = AuthService.getCurrentUser();
      const relativeRoot = AuthService.getRelativePath('');

      const avatarPath = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : relativeRoot + user.avatar) : relativeRoot + 'images/pic-1.jpg';
      const roleBadgeClass = user?.role === 'teacher' ? 'badge-teacher' : (user?.role === 'admin' ? 'badge-admin' : 'badge-student');

      // Build Navigation Items according to user role
      let navLinksHTML = `
         <a href="${relativeRoot}index.html"><i class="fas fa-home"></i><span>Home</span></a>
         <a href="${relativeRoot}courses.html"><i class="fas fa-graduation-cap"></i><span>Explore Courses</span></a>
      `;

      if (user?.role === 'student') {
         navLinksHTML += `
            <a href="${relativeRoot}student/dashboard.html"><i class="fas fa-chart-line"></i><span>Student Dashboard</span></a>
            <a href="${relativeRoot}student/code-practice.html"><i class="fas fa-terminal" style="color: var(--accent-color);"></i><span>Code Grader Practice</span></a>
            <a href="${relativeRoot}student/ai-predict.html"><i class="fas fa-brain" style="color: var(--main-color);"></i><span>AI Marks Predictor</span></a>
            <a href="${relativeRoot}student/my-courses.html"><i class="fas fa-book-open"></i><span>My Courses</span></a>
            <a href="${relativeRoot}student/progress.html"><i class="fas fa-certificate"></i><span>Progress & Badges</span></a>
            <a href="${relativeRoot}student/profile.html"><i class="fas fa-user-gear"></i><span>My Profile</span></a>
         `;
      } else if (user?.role === 'teacher') {
         navLinksHTML += `
            <a href="${relativeRoot}teacher/dashboard.html"><i class="fas fa-chalkboard-user"></i><span>Teacher Studio</span></a>
            <a href="${relativeRoot}teacher/create-course.html"><i class="fas fa-folder-plus"></i><span>Create Course</span></a>
            <a href="${relativeRoot}teacher/upload-video.html"><i class="fas fa-video"></i><span>Upload Video & Notes</span></a>
            <a href="${relativeRoot}teacher/manage-course.html"><i class="fas fa-tasks"></i><span>Manage Courses</span></a>
            <a href="${relativeRoot}teacher/analytics.html"><i class="fas fa-chart-pie"></i><span>Analytics</span></a>
            <a href="${relativeRoot}teacher/profile.html"><i class="fas fa-user-gear"></i><span>Teacher Profile</span></a>
         `;
      } else if (user?.role === 'admin') {
         navLinksHTML += `
            <a href="${relativeRoot}admin/dashboard.html"><i class="fas fa-user-shield"></i><span>Admin Command</span></a>
         `;
      }

      navLinksHTML += `
         <a href="${relativeRoot}teachers.html"><i class="fas fa-chalkboard-teacher"></i><span>Our Teachers</span></a>
         <a href="${relativeRoot}about.html"><i class="fas fa-circle-info"></i><span>About Us</span></a>
         <a href="${relativeRoot}contact.html"><i class="fas fa-headset"></i><span>Contact Support</span></a>
      `;

      sidebarEl.innerHTML = `
         <div class="sidebar-top-brand" style="display: flex; align-items: center; justify-content: space-between; padding: 2rem 2.2rem 1.4rem; border-bottom: 1px solid rgba(226, 232, 240, 0.4);">
            <a href="${relativeRoot}index.html" style="display: flex; align-items: center; gap: 1rem; text-decoration: none;">
               <span class="logo-icon-badge" style="width: 3.6rem; height: 3.6rem; padding: 0.2rem;">
                  <img src="${relativeRoot}images/logo-icon.png" alt="RASH EduHub" class="logo-img">
               </span>
               <span style="font-family: 'Outfit', sans-serif; font-size: 1.75rem; font-weight: 800; color: var(--black);">RASH <span style="color: var(--main-color);">EduHub</span></span>
            </a>
            <div id="close-btn" role="button" tabindex="0" aria-label="Close navigation sidebar" title="Close" style="position: static; font-size: 1.8rem; color: var(--black); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 3.2rem; height: 3.2rem; border-radius: 50%; background: var(--light-bg);">
               <i class="fas fa-times"></i>
            </div>
         </div>

         <div class="profile" style="padding-top: 1.8rem;">
            ${user ? `
               <img src="${avatarPath}" class="image" alt="${user.name}" referrerpolicy="no-referrer">
               <h3 class="name">${user.name}</h3>
               <p class="role"><span class="badge ${roleBadgeClass}">${user.role.toUpperCase()}</span></p>
               <a href="${user.role === 'teacher' ? relativeRoot + 'teacher/profile.html' : relativeRoot + 'student/profile.html'}" class="btn" style="margin-top: 1.2rem;">Profile</a>
            ` : `
               <img src="${relativeRoot}images/pic-1.jpg" class="image" alt="Guest">
               <h3 class="name">Guest Visitor</h3>
               <p class="role"><span class="badge badge-outline">Guest</span></p>
               <a href="${relativeRoot}login.html" class="btn" style="margin-top: 1.2rem;">Sign In</a>
            `}
         </div>

         <nav class="navbar">
            ${navLinksHTML}
         </nav>
      `;

      // Automatically highlight current active page
      const currentPath = window.location.pathname;
      const navLinks = sidebarEl.querySelectorAll('.navbar a');
      navLinks.forEach(link => {
         // Normalize paths
         const linkPath = new URL(link.href, window.location.origin).pathname;
         if (currentPath === linkPath || (currentPath.endsWith('/') && linkPath.endsWith('index.html'))) {
            link.classList.add('active');
         }
      });

      this.bindEvents();
   },

   ensureOverlay() {
      let overlay = document.querySelector('.sidebar-overlay');
      if (!overlay) {
         overlay = document.createElement('div');
         overlay.className = 'sidebar-overlay';
         overlay.setAttribute('aria-hidden', 'true');
         document.body.appendChild(overlay);
         overlay.addEventListener('click', () => {
            this.close();
         });
      }
      return overlay;
   },

   open() {
      const sidebar = document.querySelector('.side-bar');
      const overlay = this.ensureOverlay();
      const menuBtn = document.querySelector('#menu-btn');
      if (sidebar) sidebar.classList.add('active');
      if (overlay) overlay.classList.add('active');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
   },

   close() {
      const sidebar = document.querySelector('.side-bar');
      const overlay = document.querySelector('.sidebar-overlay');
      const menuBtn = document.querySelector('#menu-btn');
      if (sidebar) sidebar.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
   },

   toggle() {
      const sidebar = document.querySelector('.side-bar');
      if (sidebar && sidebar.classList.contains('active')) {
         this.close();
      } else {
         this.open();
      }
   },

   bindEvents() {
      this.ensureOverlay();

      // Guard against duplicate listener binding
      if (this._eventsBound) return;
      this._eventsBound = true;

      // Document-level event delegation for menu toggle & close buttons
      document.addEventListener('click', (e) => {
         const menuBtn = e.target.closest('#menu-btn');
         if (menuBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
            return;
         }

         const closeBtn = e.target.closest('#close-btn');
         if (closeBtn) {
            e.preventDefault();
            e.stopPropagation();
            this.close();
            return;
         }

         // Close sidebar if clicking outside when open
         const sidebar = document.querySelector('.side-bar');
         if (sidebar && sidebar.classList.contains('active')) {
            if (!sidebar.contains(e.target) && !e.target.closest('#menu-btn')) {
               this.close();
            }
         }
      });

      // Close sidebar when clicking any navigation link inside it
      document.addEventListener('click', (e) => {
         const navLink = e.target.closest('.side-bar .navbar a, .side-bar .profile a');
         if (navLink) {
            this.close();
         }
      });

      // Keyboard accessibility
      document.addEventListener('keydown', (e) => {
         if (e.key === 'Escape') {
            this.close();
         }

         if (e.key === 'Enter' || e.key === ' ') {
            const closeBtn = e.target.closest('#close-btn');
            if (closeBtn) {
               e.preventDefault();
               this.close();
            }
         }
      });
   }
};

document.addEventListener('DOMContentLoaded', () => {
   SidebarComponent.init();
});

window.SidebarComponent = SidebarComponent;
