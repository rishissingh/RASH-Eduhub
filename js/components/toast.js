/**
 * RASH EduHub - Toast Notification Component
 * Handles creation, rendering, queueing, and dismissal of premium toast notifications.
 */

const Toast = {
   container: null,

   init() {
      // Create toast container if it doesn't exist
      if (!document.getElementById('toast-container')) {
         this.container = document.createElement('div');
         this.container.id = 'toast-container';
         this.container.className = 'toast-container';
         document.body.appendChild(this.container);
      } else {
         this.container = document.getElementById('toast-container');
      }
   },

   /**
    * Show a toast message
    * @param {Object} options - Toast options { title, message, type: 'success'|'error'|'warning'|'info', duration: 4000 }
    */
   show({ title = '', message = '', type = 'info', duration = 4000 }) {
      if (!this.container) {
         this.init();
      }

      const toast = document.createElement('div');
      toast.className = `toast toast-${type}`;
      toast.style.setProperty('--toast-duration', `${duration}ms`);

      let iconClass = 'fa-info-circle';
      if (type === 'success') iconClass = 'fa-check-circle';
      else if (type === 'error') iconClass = 'fa-times-circle';
      else if (type === 'warning') iconClass = 'fa-exclamation-triangle';

      toast.innerHTML = `
         <div class="toast-icon">
            <i class="fas ${iconClass}"></i>
         </div>
         <div class="toast-body">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            <div class="toast-message">${message}</div>
         </div>
         <button class="toast-close"><i class="fas fa-times"></i></button>
         <div class="toast-progress"></div>
      `;

      this.container.appendChild(toast);

      // Setup close button handler
      const closeBtn = toast.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => this.dismiss(toast));

      // Auto dismiss
      const timer = setTimeout(() => {
         this.dismiss(toast);
      }, duration);

      // Save timer on element
      toast.dataset.timerId = timer;
   },

   dismiss(toast) {
      if (toast.dataset.timerId) {
         clearTimeout(parseInt(toast.dataset.timerId, 10));
      }

      toast.classList.add('removing');
      toast.addEventListener('animationend', (e) => {
         if (e.animationName === 'toastSlideOut') {
            toast.remove();
         }
      });
   },

   // Convenience helpers
   success(message, title = 'Success') {
      this.show({ title, message, type: 'success' });
   },

   error(message, title = 'Error') {
      this.show({ title, message, type: 'error' });
   },

   warning(message, title = 'Warning') {
      this.show({ title, message, type: 'warning' });
   },

   info(message, title = 'Info') {
      this.show({ title, message, type: 'info' });
   }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
   Toast.init();
});

window.Toast = Toast;
