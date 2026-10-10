/**
 * RASH EduHub - Navbar Component
 * Renders header dynamically and handles search submission & profile popup.
 */

const NavbarComponent = {
   ensureScriptLoaded(url, globalVarName) {
      return new Promise((resolve) => {
         if (window[globalVarName]) {
            resolve();
            return;
         }
         const script = document.createElement('script');
         script.src = url;
         script.onload = () => resolve();
         script.onerror = () => {
            console.error(`Failed to load dependency: ${url}`);
            resolve();
         };
         document.head.appendChild(script);
      });
   },

   async init() {
      const headerEl = document.querySelector('header.header');
      if (!headerEl) return;

      const relativeRoot = AuthService.getRelativePath('');
      
      // Ensure Toast and NotificationService are loaded before rendering navbar
      await this.ensureScriptLoaded(relativeRoot + 'js/components/toast.js', 'Toast');
      await this.ensureScriptLoaded(relativeRoot + 'js/services/notificationService.js', 'NotificationService');

      let user = AuthService.getCurrentUser();
      if (!user && localStorage.getItem('eduhub_jwt_token') && typeof AuthService.ensureCurrentUser === 'function') {
         try {
            user = await AuthService.ensureCurrentUser();
         } catch (e) {
            console.warn('Could not auto-fetch current user profile:', e);
         }
      }

      const avatarPath = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : relativeRoot + user.avatar) : relativeRoot + 'images/pic-1.jpg';
      const roleBadgeClass = user?.role === 'teacher' ? 'badge-teacher' : (user?.role === 'admin' ? 'badge-admin' : 'badge-student');
      const roleName = (user?.role || 'student').toUpperCase();
      const displayName = user?.name || 'User';
      const shortName = displayName.split(' ')[0];

      headerEl.innerHTML = `
         <section class="flex">
            <div style="display: flex; align-items: center; gap: 3rem;">
               <a href="${relativeRoot}index.html" class="logo brand-logo">
                  <span class="logo-icon-badge">
                     <img src="${relativeRoot}images/logo-icon.png" alt="RASH EduHub" class="logo-img">
                  </span>
                  <span class="logo-title">RASH <span class="logo-accent">EduHub</span></span>
               </a>

               <nav class="desktop-main-nav">
                  <a href="${relativeRoot}courses.html" class="desktop-nav-link"><i class="fas fa-compass"></i> Explore</a>
                  <a href="${relativeRoot}student/code-practice.html" class="desktop-nav-link"><i class="fas fa-terminal"></i> Code Arena</a>
                  <a href="${relativeRoot}teachers.html" class="desktop-nav-link"><i class="fas fa-chalkboard-user"></i> Mentors</a>
                  <a href="${relativeRoot}about.html" class="desktop-nav-link"><i class="fas fa-shield-halved"></i> About</a>
               </nav>
            </div>

            <form action="${relativeRoot}courses.html" method="get" class="search-form modern-search">
               <i class="fas fa-search search-lens"></i>
               <input type="text" name="search_box" placeholder="Search courses, skills, teachers..." maxlength="100">
               <span class="search-kbd">⌘K</span>
            </form>

            <div class="icons header-actions">
               <div id="search-btn" class="fas fa-search header-icon-btn" title="Search" role="button" tabindex="0" aria-label="Search courses"></div>
               <div id="toggle-btn" class="fas fa-sun header-icon-btn" title="Toggle Theme" role="button" tabindex="0" aria-label="Toggle theme"></div>
               <div id="notif-btn" class="fas fa-bell notification-bell header-icon-btn" title="Notifications" role="button" tabindex="0" aria-label="Notifications" aria-haspopup="true" aria-expanded="false" aria-controls="notif-popup"></div>
               
               ${user ? `
                  <div id="user-btn" class="nav-user-chip" title="${displayName}" role="button" tabindex="0" aria-haspopup="true" aria-expanded="false" aria-controls="profile-dropdown" aria-label="User profile menu">
                     <img src="${avatarPath}" alt="${displayName}" class="nav-user-avatar">
                     <span class="nav-user-name">${shortName}</span>
                     <i class="fas fa-chevron-down nav-user-arrow" style="font-size: 1.1rem; opacity: 0.6; transition: transform 0.25s ease;"></i>
                  </div>
               ` : `
                  <div class="guest-nav-actions">
                     <a href="${relativeRoot}login.html" class="nav-signin-link">Sign In</a>
                     <a href="${relativeRoot}register.html" class="nav-signup-pill btn-shimmer">
                        <span>Get Started</span>
                        <i class="fas fa-arrow-right"></i>
                     </a>
                  </div>
                  <div id="user-btn" class="fas fa-user header-icon-btn" style="display: none;" role="button" tabindex="0" aria-label="User menu"></div>
               `}

               <div id="menu-btn" class="fas fa-bars menu-drawer-toggle header-icon-btn" title="Menu" role="button" tabindex="0" aria-label="Toggle navigation menu" aria-haspopup="true" aria-expanded="false" aria-controls="side-bar"></div>
            </div>

            <!-- Notification Popup Dropdown -->
            <div class="profile notif-popup" id="notif-popup" role="region" aria-label="Notifications Panel">
               <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: var(--border); padding-bottom: 1rem;">
                  <h3 style="font-size: 1.6rem; margin: 0; color: var(--black);">Notifications</h3>
                  <button id="mark-all-read-btn" style="background: none; border: none; font-size: 1.3rem; color: var(--main-color); cursor: pointer; font-weight: 600;">Mark all read</button>
               </div>
               <div id="notif-popup-list" style="max-height: 25rem; overflow-y: auto; text-align: left; display: flex; flex-direction: column; gap: 1rem;">
                  <!-- Dynamically rendered -->
               </div>
               <div style="margin-top: 1.5rem; text-align: center; border-top: var(--border); padding-top: 1rem;">
                  <a href="${user ? (user.role === 'teacher' ? relativeRoot + 'teacher/dashboard.html' : relativeRoot + 'student/dashboard.html') : relativeRoot + 'login.html'}" style="font-size: 1.3rem; color: var(--main-color); font-weight: 600;">View Dashboard</a>
               </div>
            </div>

            <!-- Profile Dropdown Menu -->
            <div class="profile" id="profile-dropdown" role="region" aria-label="User Account Menu">
               ${user ? `
                  <div class="profile-header-info">
                     <img src="${avatarPath}" class="image" alt="${displayName}" referrerpolicy="no-referrer">
                     <h3 class="name">${displayName}</h3>
                     <p class="email">${user.email || ''}</p>
                     <p class="role"><span class="badge ${roleBadgeClass}">${roleName}</span></p>
                  </div>

                  <nav class="profile-nav-menu" aria-label="Account navigation">
                     ${user.role === 'teacher' ? `
                        <a href="${relativeRoot}teacher/dashboard.html" class="profile-menu-item">
                           <i class="fas fa-chalkboard-user"></i>
                           <span>Teacher Studio</span>
                        </a>
                        <a href="${relativeRoot}teacher/profile.html" class="profile-menu-item">
                           <i class="fas fa-user-circle"></i>
                           <span>Teacher Profile</span>
                        </a>
                        <a href="${relativeRoot}teacher/create-course.html" class="profile-menu-item">
                           <i class="fas fa-folder-plus"></i>
                           <span>Create Course</span>
                        </a>
                        <a href="${relativeRoot}teacher/manage-course.html" class="profile-menu-item">
                           <i class="fas fa-tasks"></i>
                           <span>Manage Courses</span>
                        </a>
                     ` : user.role === 'student' ? `
                        <a href="${relativeRoot}student/dashboard.html" class="profile-menu-item">
                           <i class="fas fa-chart-line"></i>
                           <span>Student Dashboard</span>
                        </a>
                        <a href="${relativeRoot}student/profile.html" class="profile-menu-item">
                           <i class="fas fa-user-circle"></i>
                           <span>My Profile</span>
                        </a>
                        <a href="${relativeRoot}student/my-courses.html" class="profile-menu-item">
                           <i class="fas fa-book-open"></i>
                           <span>My Courses</span>
                        </a>
                        <a href="${relativeRoot}student/code-practice.html" class="profile-menu-item">
                           <i class="fas fa-terminal"></i>
                           <span>Code Arena</span>
                        </a>
                     ` : `
                        <a href="${relativeRoot}admin/dashboard.html" class="profile-menu-item">
                           <i class="fas fa-user-shield"></i>
                           <span>Admin Command</span>
                        </a>
                     `}
                     <a href="${relativeRoot}update.html" class="profile-menu-item">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                     </a>
                  </nav>

                  <div class="profile-dropdown-footer">
                     <button id="logout-btn" class="delete-btn profile-logout-btn" type="button">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                     </button>
                  </div>
               ` : `
                  <div style="padding-bottom: 1.5rem; border-bottom: var(--border); margin-bottom: 1.5rem;">
                     <p class="role" style="font-size: 1.5rem; font-weight: 600; color: var(--black); margin-bottom: 0.5rem;">Welcome Guest</p>
                     <p style="font-size: 1.3rem; color: var(--light-color);">Sign in to access your dashboard & courses</p>
                  </div>
                  <div class="flex-btn">
                     <a href="${relativeRoot}login.html" class="option-btn" style="flex: 1; text-align: center;">Login</a>
                     <a href="${relativeRoot}register.html" class="btn" style="flex: 1; text-align: center;">Register</a>
                  </div>
               `}
            </div>
         </section>
      `;

      if (window.NotificationService) {
         window.NotificationService.updateUIBadge();
      }

      this.bindEvents();
   },

   bindEvents() {
      const profilePopup = document.querySelector('#profile-dropdown');
      const notifPopup = document.querySelector('#notif-popup');
      const userBtn = document.querySelector('#user-btn');
      const notifBtn = document.querySelector('#notif-btn');
      const menuBtn = document.querySelector('#menu-btn');
      const searchBtn = document.querySelector('#search-btn');
      const searchForm = document.querySelector('.header .flex .search-form');
      const logoutBtn = document.querySelector('#logout-btn');
      const markAllReadBtn = document.querySelector('#mark-all-read-btn');

      // Helper to close profile dropdown
      const closeProfile = () => {
         if (profilePopup) {
            profilePopup.classList.remove('active');
         }
         if (userBtn) {
            userBtn.classList.remove('active');
            userBtn.setAttribute('aria-expanded', 'false');
         }
      };

      // Helper to open profile dropdown
      const openProfile = () => {
         if (profilePopup) {
            profilePopup.classList.add('active');
         }
         if (userBtn) {
            userBtn.classList.add('active');
            userBtn.setAttribute('aria-expanded', 'true');
         }
         closeNotif();
         if (searchForm) searchForm.classList.remove('active');
      };

      // Helper to toggle profile dropdown
      const toggleProfile = () => {
         if (profilePopup && profilePopup.classList.contains('active')) {
            closeProfile();
         } else {
            openProfile();
         }
      };

      // Helper to close notifications popup
      const closeNotif = () => {
         if (notifPopup) {
            notifPopup.classList.remove('active');
         }
         if (notifBtn) {
            notifBtn.setAttribute('aria-expanded', 'false');
         }
      };

      // Helper to toggle notifications popup
      const toggleNotif = () => {
         if (notifPopup && notifPopup.classList.contains('active')) {
            closeNotif();
         } else {
            if (notifPopup) notifPopup.classList.add('active');
            if (notifBtn) notifBtn.setAttribute('aria-expanded', 'true');
            closeProfile();
            if (searchForm) searchForm.classList.remove('active');
            this.renderNotificationsList();
         }
      };

      // User profile button click & keyboard handlers
      if (userBtn && profilePopup) {
         userBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleProfile();
         });

         userBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               e.stopPropagation();
               toggleProfile();
            }
         });
      }

      // Close profile dropdown when clicking any navigation link inside it
      if (profilePopup) {
         profilePopup.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link) {
               closeProfile();
            }
         });
      }

      // Hamburger menu button click & keyboard handlers
      if (menuBtn) {
         menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeProfile();
            closeNotif();
            if (searchForm) searchForm.classList.remove('active');

            if (window.SidebarComponent && typeof window.SidebarComponent.toggle === 'function') {
               window.SidebarComponent.toggle();
            } else {
               const sidebar = document.querySelector('.side-bar');
               const overlay = document.querySelector('.sidebar-overlay');
               if (sidebar) sidebar.classList.toggle('active');
               if (overlay) overlay.classList.toggle('active');
            }
         });

         menuBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               e.stopPropagation();
               menuBtn.click();
            }
         });
      }

      // Notifications button click & keyboard handlers
      if (notifBtn && notifPopup) {
         notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleNotif();
         });

         notifBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
               e.preventDefault();
               e.stopPropagation();
               toggleNotif();
            }
         });
      }

      // Search button toggle
      if (searchBtn && searchForm) {
         searchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            searchForm.classList.toggle('active');
            closeProfile();
            closeNotif();
         });
      }

      // Logout handler
      if (logoutBtn) {
         logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeProfile();
            AuthService.logout();
         });
      }

      // Mark all read button
      if (markAllReadBtn) {
         markAllReadBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.NotificationService) {
               window.NotificationService.markAllAsRead();
               this.renderNotificationsList();
            }
         });
      }

      // Outside click handler to close popups
      document.addEventListener('click', (e) => {
         if (!e.target.closest('#user-btn') && !e.target.closest('#profile-dropdown')) {
            closeProfile();
         }
         if (!e.target.closest('#notif-btn') && !e.target.closest('#notif-popup')) {
            closeNotif();
         }
         if (!e.target.closest('#search-btn') && !e.target.closest('.header .flex .search-form')) {
            if (searchForm) searchForm.classList.remove('active');
         }
      });

      // Escape key to close any open dropdowns
      document.addEventListener('keydown', (e) => {
         if (e.key === 'Escape') {
            closeProfile();
            closeNotif();
            if (searchForm) searchForm.classList.remove('active');
         }
      });
   },

   renderNotificationsList() {
      const listEl = document.querySelector('#notif-popup-list');
      if (!listEl || !window.NotificationService) return;

      const notifications = window.NotificationService.getNotifications();
      if (notifications.length === 0) {
         listEl.innerHTML = `
            <div style="text-align: center; padding: 2rem 1rem; color: var(--light-color); font-size: 1.3rem;">
               <i class="fas fa-bell-slash" style="font-size: 2.2rem; margin-bottom: 0.8rem; opacity: 0.5;"></i>
               <p>No new notifications</p>
            </div>
         `;
         return;
      }

      listEl.innerHTML = notifications.map(n => `
         <div class="activity-item stagger-1" style="padding: 1rem; border-radius: 0.8rem; background: ${n.read ? 'transparent' : 'var(--light-bg)'}; border-left: 3px solid ${n.type === 'success' ? 'var(--green)' : n.type === 'error' ? 'var(--red)' : 'var(--main-color)'}; margin-bottom: 0.5rem; transition: background 0.2s;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
               <h4 style="font-size: 1.35rem; color: var(--black); font-weight: 700; margin-bottom: 0.2rem;">${n.title}</h4>
               ${!n.read ? `<span style="width: 8px; height: 8px; border-radius: 50%; background: var(--main-color); display: inline-block;" title="New"></span>` : ''}
            </div>
            <p style="font-size: 1.2rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">${n.message}</p>
            <span style="font-size: 1rem; color: var(--light-color); display: block; margin-top: 0.3rem;">${this.formatTimeAgo(n.createdAt)}</span>
         </div>
      `).join('');
   },

   formatTimeAgo(isoString) {
      const date = new Date(isoString);
      const seconds = Math.floor((new Date() - date) / 1000);
      if (seconds < 60) return 'Just now';
      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      return date.toLocaleDateString();
   }
};

document.addEventListener('DOMContentLoaded', () => {
   NavbarComponent.init();
});

window.NavbarComponent = NavbarComponent;
