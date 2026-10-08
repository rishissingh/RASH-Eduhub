/**
 * RASH EduHub - Notification Service
 * Manages user notifications, read states, system announcements, and real-time triggers.
 * Connected to Node/Express backend.
 */

const NotificationService = {
   /**
    * Get all notifications for current user from backend
    */
   async getNotifications() {
      try {
         const data = await EduHubDB.api('/notifications');
         return data.success ? data.notifications : [];
      } catch (err) {
         console.error('Failed to get notifications:', err);
         return [];
      }
   },

   /**
    * Get unread notifications count from backend
    */
   async getUnreadCount() {
      try {
         const data = await EduHubDB.api('/notifications/unread-count');
         return data.success ? data.count : 0;
      } catch (err) {
         console.error('Failed to get unread count:', err);
         return 0;
      }
   },

   /**
    * Send/Create a new notification
    */
   async send({ userId, title, message, type = 'info', link = '#' }) {
      try {
         const data = await EduHubDB.api('/notifications', {
            method: 'POST',
            body: { userId, title, message, type, link }
         });

         if (data.success && data.notification) {
            // Trigger standard toast notification
            if (window.Toast) {
               window.Toast.show({ title, message, type });
            }
            await this.updateUIBadge();
            return data.notification;
         }
      } catch (err) {
         console.error('Failed to send notification:', err);
      }
      return null;
   },

   /**
    * Mark a notification as read
    */
   async markAsRead(notificationId) {
      try {
         const data = await EduHubDB.api(`/notifications/${notificationId}/read`, {
            method: 'PUT'
         });
         
         if (data.success) {
            await this.updateUIBadge();
            return true;
         }
      } catch (err) {
         console.error(`Failed to mark notification ${notificationId} as read:`, err);
      }
      return false;
   },

   /**
    * Mark all user notifications as read
    */
   async markAllAsRead() {
      try {
         const data = await EduHubDB.api('/notifications/read-all', {
            method: 'PUT'
         });
         
         if (data.success) {
            await this.updateUIBadge();
            return true;
         }
      } catch (err) {
         console.error('Failed to mark all notifications as read:', err);
      }
      return false;
   },

   /**
    * Update the header notification bell icon badge
    */
   async updateUIBadge() {
      const count = await this.getUnreadCount();
      const bellBtn = document.getElementById('notif-btn') || document.querySelector('.fa-bell');
      
      if (!bellBtn) return;

      // Ensure bell button has container/badge setup
      let badge = bellBtn.querySelector('.notification-badge');
      
      if (count > 0) {
         if (!badge) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            bellBtn.appendChild(badge);
            bellBtn.style.position = 'relative';
         }
         badge.textContent = count;
      } else {
         if (badge) {
            badge.remove();
         }
      }
   }
};

// Initialize notification service UI updates
document.addEventListener('DOMContentLoaded', () => {
   // Wait a tiny bit for DB/Auth service setup to settle
   setTimeout(() => {
      if (AuthService.getCurrentUser()) {
         NotificationService.updateUIBadge();
      }
   }, 300);
});

window.NotificationService = NotificationService;
