/**
 * RASH EduHub - Theme Handler (Dark/Light mode)
 */

const ThemeManager = {
   init() {
      const savedTheme = localStorage.getItem('eduhub_theme') || 'light';
      if (savedTheme === 'dark') {
         document.body.classList.add('dark');
      } else {
         document.body.classList.remove('dark');
      }
      this.bindToggle();
   },

   toggle() {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('eduhub_theme', isDark ? 'dark' : 'light');
      this.updateIcons();
   },

   bindToggle() {
      document.addEventListener('click', (e) => {
         const toggleBtn = e.target.closest('#toggle-btn');
         if (toggleBtn) {
            this.toggle();
         }
      });
      this.updateIcons();
   },

   updateIcons() {
      const toggleBtns = document.querySelectorAll('#toggle-btn');
      const isDark = document.body.classList.contains('dark');

      toggleBtns.forEach(btn => {
         if (isDark) {
            btn.classList.remove('fa-sun');
            btn.classList.add('fa-moon');
         } else {
            btn.classList.remove('fa-moon');
            btn.classList.add('fa-sun');
         }
      });
   }
};

document.addEventListener('DOMContentLoaded', () => {
   ThemeManager.init();
});

window.ThemeManager = ThemeManager;
