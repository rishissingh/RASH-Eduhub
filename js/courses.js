document.addEventListener('DOMContentLoaded', () => {
   const coursesGrid = document.getElementById('courses-grid');
   const filterChips = document.getElementById('filter-chips');
   const headerSearchInput = document.querySelector('.header .flex .search-form input[name="search_box"]');

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

   // --- FILTERING LOGIC ---
   let activeCategory = 'all';
   let searchQuery = '';

   function applyFilters() {
      const boxes = coursesGrid.querySelectorAll('.box');
      boxes.forEach(box => {
         const boxCategory = box.getAttribute('data-category').toLowerCase();
         const titleText = box.querySelector('.title').textContent.toLowerCase();
         const tutorName = box.querySelector('.tutor h3').textContent.toLowerCase();

         const matchesCategory = (activeCategory === 'all' || boxCategory === activeCategory);
         const matchesSearch = (titleText.includes(searchQuery) || tutorName.includes(searchQuery));

         if (matchesCategory && matchesSearch) {
            box.style.display = 'flex'; // Use flex since styles are styled for cards
         } else {
            box.style.display = 'none';
         }
      });
   }

   // Parse URL parameters for cross-page search redirection
   const urlParams = new URLSearchParams(window.location.search);
   const urlSearchQuery = urlParams.get('search_box');
   if (urlSearchQuery && headerSearchInput) {
      headerSearchInput.value = urlSearchQuery;
      searchQuery = urlSearchQuery.toLowerCase().trim();
      applyFilters();
   }

   // Bind chip clicks
   if (filterChips) {
      const chips = filterChips.querySelectorAll('.chip');
      chips.forEach(chip => {
         chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeCategory = chip.getAttribute('data-category').toLowerCase();
            applyFilters();
         });
      });
   }

   // Bind header search keyup
   if (headerSearchInput) {
      // Prevent standard form submission from reloading page if we're already on courses.html
      const searchForm = headerSearchInput.closest('form');
      if (searchForm) {
         searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
         });
      }

      headerSearchInput.addEventListener('input', (e) => {
         searchQuery = e.target.value.toLowerCase().trim();
         applyFilters();
      });
   }
});
