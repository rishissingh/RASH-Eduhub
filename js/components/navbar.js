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

      const user = AuthService.getCurrentUser();

      const avatarPath = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : relativeRoot + user.avatar) : relativeRoot + 'images/pic-1.jpg';
      const roleBadgeClass = user?.role === 'teacher' ? 'badge-teacher' : (user?.role === 'admin' ? 'badge-admin' : 'badge-student');

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
               <div id="search-btn" class="fas fa-search header-icon-btn" title="Search"></div>
               <div id="toggle-btn" class="fas fa-sun header-icon-btn" title="Toggle Theme"></div>
               <div id="notif-btn" class="fas fa-bell notification-bell header-icon-btn" title="Notifications"></div>
               
               ${user ? `
                  <div id="user-btn" class="nav-user-chip" title="${user.name}">
                     <img src="${avatarPath}" alt="${user.name}" class="nav-user-avatar">
                     <span class="nav-user-name">${user.name.split(' ')[0]}</span>
                     <i class="fas fa-chevron-down" style="font-size: 1.1rem; opacity: 0.6;"></i>
                  </div>
               ` : `
                  <div class="guest-nav-actions">
                     <a href="${relativeRoot}login.html" class="nav-signin-link">Sign In</a>
                     <a href="${relativeRoot}register.html" class="nav-signup-pill btn-shimmer">
                        <span>Get Started</span>
                        <i class="fas fa-arrow-right"></i>
                     </a>
                  </div>
                  <div id="user-btn" class="fas fa-user header-icon-btn" style="display: none;"></div>
               `}

               <div id="menu-btn" class="fas fa-bars menu-drawer-toggle header-icon-btn" title="Menu"></div>
            </div>

            <!-- Notification Popup Dropdown -->
            <div class="profile notif-popup" id="notif-popup" style="width: 36rem;">
               <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: var(--border); padding-bottom: 1rem;">
                  <h3 style="font-size: 1.6rem; margin: 0; color: var(--black);">Notifications</h3>
                  <button id="mark-all-read-btn" style="background: none; font-size: 1.3rem; color: var(--main-color); cursor: pointer; font-weight: 600;">Mark all read</button>
               </div>
               <div id="notif-popup-list" style="max-height: 25rem; overflow-y: auto; text-align: left; display: flex; flex-direction: column; gap: 1rem;">
                  <!-- Dynamically rendered -->
               </div>
               <div style="margin-top: 1.5rem; text-align: center; border-top: var(--border); padding-top: 1rem;">
                  <a href="${user ? (user.role === 'teacher' ? relativeRoot + 'teacher/dashboard.html' : relativeRoot + 'student/dashboard.html') : relativeRoot + 'login.html'}" style="font-size: 1.3rem; color: var(--main-color); font-weight: 600;">View Dashboard</a>
               </div>
            </div>

            <div class="profile">
               ${user ? `
                  <img src="${avatarPath}" class="image" alt="${user.name}" referrerpolicy="no-referrer">
                  <h3 class="name">${user.name}</h3>
                  <p class="role"><span class="badge ${roleBadgeClass}">${user.role.toUpperCase()}</span></p>
                  <a href="${user.role === 'teacher' ? relativeRoot + 'teacher/profile.html' : relativeRoot + 'student/profile.html'}" class="btn">View Profile</a>
                  <div class="flex-btn" style="margin-top: 1rem;">
                     <button id="logout-btn" class="delete-btn">Logout</button>
                  </div>
               ` : `
                  <p class="role" style="margin-bottom: 1.5rem;">Welcome Guest</p>
                  <div class="flex-btn">
                     <a href="${relativeRoot}login.html" class="option-btn">Login</a>
                     <a href="${relativeRoot}register.html" class="btn">Register</a>
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
      const profilePopup = document.querySelector('.header .flex .profile:not(.notif-popup)');
      const notifPopup = document.querySelector('#notif-popup');
      const userBtn = document.querySelector('#user-btn');
      const notifBtn = document.querySelector('#notif-btn');
      const searchBtn = document.querySelector('#search-btn');
      const searchForm = document.querySelector('.header .flex .search-form');
      const logoutBtn = document.querySelector('#logout-btn');
      const markAllReadBtn = document.querySelector('#mark-all-read-btn');

      if (userBtn && profilePopup) {
         userBtn.addEventListener('click', () => {
            profilePopup.classList.toggle('active');
            if (searchForm) searchForm.classList.remove('active');
            if (notifPopup) notifPopup.classList.remove('active');
         });
      }

      if (notifBtn && notifPopup) {
         notifBtn.addEventListener('click', () => {
            notifPopup.classList.toggle('active');
            if (searchForm) searchForm.classList.remove('active');
            if (profilePopup) profilePopup.classList.remove('active');
            
            if (notifPopup.classList.contains('active')) {
               this.renderNotificationsList();
            }
         });
      }

      if (searchBtn && searchForm) {
         searchBtn.addEventListener('click', () => {
            searchForm.classList.toggle('active');
            if (profilePopup) profilePopup.classList.remove('active');
            if (notifPopup) notifPopup.classList.remove('active');
         });
      }

      if (logoutBtn) {
         logoutBtn.addEventListener('click', () => {
            AuthService.logout();
         });
      }

      if (markAllReadBtn) {
         markAllReadBtn.addEventListener('click', () => {
            if (window.NotificationService) {
               window.NotificationService.markAllAsRead();
               this.renderNotificationsList();
            }
         });
      }

      // Close popups on outside click
      document.addEventListener('click', (e) => {
         if (!e.target.closest('#user-btn') && !e.target.closest('.profile:not(.notif-popup)')) {
            if (profilePopup) profilePopup.classList.remove('active');
         }
         if (!e.target.closest('#notif-btn') && !e.target.closest('#notif-popup')) {
            if (notifPopup) notifPopup.classList.remove('active');
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
