document.addEventListener('DOMContentLoaded', () => {
   const uploadForm = document.getElementById('course-upload-form');

   uploadForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('course-title').value.trim();
      const desc = document.getElementById('course-desc').value.trim();
      const category = document.getElementById('course-category').value;
      const tutorName = document.getElementById('tutor-name-input').value.trim();
      const videoCount = document.getElementById('video-count').value;
      const thumbUrl = document.getElementById('course-thumb').value;

      if (!title || !desc || !tutorName || !videoCount) {
         alert("Please fill in all required fields!");
         return;
      }

      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

      // Set default tutor profile pictures based on names or random assignments
      const tutorPics = [
         "images/pic-2.jpg",
         "images/pic-3.jpg",
         "images/pic-4.jpg",
         "images/pic-5.jpg",
         "images/pic-6.jpg",
         "images/pic-7.jpg",
         "images/pic-8.jpg"
      ];
      const randomTutorPic = tutorPics[Math.floor(Math.random() * tutorPics.length)];

      const newCourse = {
         id: `custom-course-${Date.now()}`,
         title: title,
         desc: desc,
         category: category,
         tutorName: tutorName,
         tutorPic: randomTutorPic,
         videoCount: `${videoCount} videos`,
         thumbUrl: thumbUrl,
         date: formattedDate
      };

      // Retrieve existing custom courses
      const customCourses = JSON.parse(localStorage.getItem('custom-courses') || '[]');
      customCourses.unshift(newCourse);
      localStorage.setItem('custom-courses', JSON.stringify(customCourses));

      alert(`"${title}" has been successfully uploaded to RASH EduHub!`);
      uploadForm.reset();
      
      // Redirect to courses page
      window.location.href = 'courses.html';
   });
});
