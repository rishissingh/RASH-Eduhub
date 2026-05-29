document.addEventListener('DOMContentLoaded', () => {
   const coursesGrid = document.getElementById('courses-grid');

   // --- LOAD CUSTOM COURSES FROM STORAGE ---
   const customCourses = JSON.parse(localStorage.getItem('custom-courses') || '[]');
   if (coursesGrid && customCourses.length > 0) {
      customCourses.forEach(course => {
         const box = document.createElement('div');
         box.className = 'box';
         box.setAttribute('data-category', course.category);
         box.innerHTML = `
            <div class="tutor">
               <img src="${course.tutorPic}" alt="">
               <div class="info">
                  <h3>${course.tutorName}</h3>
                  <span>${course.date}</span>
               </div>
            </div>
            <div class="thumb">
               <img src="${course.thumbUrl}" alt="">
               <span>${course.videoCount}</span>
            </div>
            <h3 class="title">${course.title}</h3>
            <a href="playlist.html" class="inline-btn">view playlist</a>
         `;
         coursesGrid.insertBefore(box, coursesGrid.firstChild);
      });
   }
});
