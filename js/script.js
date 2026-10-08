/**
 * RASH EduHub — Global UI Event Handlers & Mobile Responsiveness
 */

document.addEventListener('DOMContentLoaded', () => {
   // Theme toggle synchronization
   if (window.ThemeManager) {
      window.ThemeManager.updateIcons();
   }

   // Mobile menu & sidebar toggling delegation
   document.addEventListener('click', (e) => {
      const menuBtn = e.target.closest('#menu-btn');
      const closeBtn = e.target.closest('#close-btn');
      const sideBar = document.querySelector('.side-bar');
      const body = document.body;

      if (menuBtn && sideBar) {
         sideBar.classList.toggle('active');
         body.classList.toggle('active');
      }

      if (closeBtn && sideBar) {
         sideBar.classList.remove('active');
         body.classList.remove('active');
      }
   });

   // Close popups & sidebar on scroll for small screens
   window.addEventListener('scroll', () => {
      const profile = document.querySelector('.header .flex .profile');
      const search = document.querySelector('.header .flex .search-form');
      const notifPopup = document.querySelector('#notif-popup');
      const sideBar = document.querySelector('.side-bar');
      const body = document.body;

      if (profile) profile.classList.remove('active');
      if (search) search.classList.remove('active');
      if (notifPopup) notifPopup.classList.remove('active');

      if (window.innerWidth < 1200 && sideBar) {
         sideBar.classList.remove('active');
         body.classList.remove('active');
      }
   });
});