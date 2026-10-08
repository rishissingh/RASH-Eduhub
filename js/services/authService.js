/**
 * RASH EduHub - Authentication Service & Route Guard
 * Google-only OAuth authentication via Google Identity Services.
 * Manages Google login, role verification, and route protection.
 */

const AuthService = {
   /**
    * Get currently logged-in user (cached synchronously for UI)
    */
   getCurrentUser() {
      const userStr = localStorage.getItem(EduHubDB.STORAGE_KEYS.CURRENT_USER);
      return userStr ? JSON.parse(userStr) : null;
   },

   /**
    * Fetch fresh current user data from server
    */
   async fetchCurrentUser() {
      try {
         const data = await EduHubDB.api('/auth/me');
         if (data.success && data.user) {
            localStorage.setItem(EduHubDB.STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
            return data.user;
         }
      } catch (err) {
         console.warn('Failed to fetch current user profile:', err);
      }
      return this.getCurrentUser();
   },

   /**
    * Google OAuth Login / Register
    * Sends the Google ID token and optional role to the backend for verification.
    * The backend verifies with Google, finds or creates the user, and returns a JWT.
    *
    * @param {string} idToken - The credential JWT returned by Google Identity Services
    * @param {string} role - Optional role for first-time registration ('student' or 'teacher')
    * @returns {Object} { success, user, isNew, message }
    */
   async googleLogin(idToken, role = 'student') {
      try {
         const data = await EduHubDB.api('/auth/google', {
            method: 'POST',
            body: { idToken, role }
         });

         if (data.success && data.token) {
            localStorage.setItem('eduhub_jwt_token', data.token);
            localStorage.setItem(EduHubDB.STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
            return { success: true, user: data.user, isNew: data.isNew || false };
         }
         return { success: false, message: data.message || 'Google login failed.' };
      } catch (err) {
         return { success: false, message: err.message || 'Server error during Google login.' };
      }
   },

   /**
    * Logout user
    */
   logout() {
      localStorage.removeItem('eduhub_jwt_token');
      localStorage.removeItem(EduHubDB.STORAGE_KEYS.CURRENT_USER);

      // Revoke Google session if GIS is loaded
      if (window.google && window.google.accounts) {
         google.accounts.id.disableAutoSelect();
      }

      window.location.href = this.getRelativePath('login.html');
   },

   /**
    * Ensure the client has a valid current user if a token exists.
    * If the cached user is missing but a token is stored, fetch the profile.
    */
   async ensureCurrentUser() {
      const user = this.getCurrentUser();
      if (user) {
         return user;
      }

      const token = localStorage.getItem('eduhub_jwt_token');
      if (!token) {
         return null;
      }

      const freshUser = await this.fetchCurrentUser();
      if (!freshUser) {
         this.logout();
      }
      return freshUser;
   },

   /**
    * Helper to compute correct relative root path for subfolders vs root
    */
   getRelativePath(targetPath) {
      const pathname = window.location.pathname;
      const isSubFolder = pathname.includes('/student/') || pathname.includes('/teacher/') || pathname.includes('/admin/');
      return isSubFolder ? '../' + targetPath : './' + targetPath;
   },

   /**
    * Route Guard: Restrict page access based on required role
    */
   async guardRoute(allowedRoles = []) {
      let user = this.getCurrentUser();
      if (!user) {
         user = await this.ensureCurrentUser();
      }

      if (allowedRoles.length > 0) {
         if (!user) {
            alert('Please login to access this page.');
            window.location.href = this.getRelativePath('login.html');
            return false;
         }

         if (!allowedRoles.includes(user.role)) {
            alert(`Access Denied: ${user.role.toUpperCase()} cannot access this page.`);
            if (user.role === 'student') {
               window.location.href = this.getRelativePath('student/dashboard.html');
            } else if (user.role === 'teacher') {
               window.location.href = this.getRelativePath('teacher/dashboard.html');
            } else if (user.role === 'admin') {
               window.location.href = this.getRelativePath('admin/dashboard.html');
            }
            return false;
         }
      }

      return true;
   }
};

window.AuthService = AuthService;
