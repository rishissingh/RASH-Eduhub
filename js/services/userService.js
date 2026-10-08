/**
 * RASH EduHub - User Service
 * Provides profile updates, student learning progress, and teacher analytics.
 * Connected to Node/Express backend.
 */

const UserService = {
   /**
    * Get user profile details from backend
    */
   async getUserProfile(userId) {
      try {
         const data = await EduHubDB.api(`/users/${userId}`);
         return data.success ? data.user : null;
      } catch (err) {
         console.error(`Failed to get user profile for ${userId}:`, err);
         return null;
      }
   },

   /**
    * Update profile details for current user
    */
   async updateProfile(updateData) {
      try {
         const data = await EduHubDB.api('/users/profile', {
            method: 'PUT',
            body: updateData
         });

         if (data.success && data.user) {
            localStorage.setItem(EduHubDB.STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
            return { success: true, user: data.user };
         }
         return { success: false, message: data.message || 'Profile update failed.' };
      } catch (err) {
         return { success: false, message: err.message };
      }
   },

   /**
    * Get analytics data for a student
    */
   async getStudentStats() {
      try {
         const data = await EduHubDB.api('/users/student/stats');
         return data.success ? data.stats : null;
      } catch (err) {
         console.error('Failed to get student stats:', err);
         return null;
      }
   },

   /**
    * Get analytics data for a teacher
    */
   async getTeacherStats() {
      try {
         const data = await EduHubDB.api('/users/teacher/stats');
         return data.success ? data.stats : null;
      } catch (err) {
         console.error('Failed to get teacher stats:', err);
         return null;
      }
   }
};

window.UserService = UserService;
