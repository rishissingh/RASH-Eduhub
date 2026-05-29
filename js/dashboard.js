document.addEventListener('DOMContentLoaded', () => {
   // --- READ USER STATS ---
   const savedPlaylistsCount = document.getElementById('saved-playlists-count');
   const likedVideosCount = document.getElementById('liked-videos-count');
   const commentCountDisplay = document.getElementById('comment-count-display');
   
   // Saved playlists
   const baseSaved = 4;
   savedPlaylistsCount.textContent = baseSaved;

   // Likes count
   const likedVideosObj = JSON.parse(localStorage.getItem('liked-videos') || '{}');
   const extraLikes = Object.keys(likedVideosObj).length;
   likedVideosCount.textContent = 33 + extraLikes;

   // Comments count
   // Count how many custom comments have been added by Harsh Singh
   let totalComments = 12;
   for (let key in localStorage) {
      if (key.startsWith('comments-')) {
         const list = JSON.parse(localStorage.getItem(key) || '[]');
         const myComments = list.filter(c => c.name === "Harsh Singh");
         // Since Harsh Singh is already a default commenter in one of the files, let's only add the net additions
         myComments.forEach(c => {
            // Default comment from Harsh Singh has text "this is a comment form Harsh Singh"
            if (c.text !== "this is a comment form Harsh Singh" && c.id > 10) {
               totalComments++;
            }
         });
      }
   }
   commentCountDisplay.textContent = totalComments;

   // --- RENDER DYNAMIC COURSE PROGRESS CIRCLES ---
   const progressData = [
      { id: 'html', percentage: 100 },
      { id: 'css', percentage: 60 },
      { id: 'js', percentage: 20 }
   ];

   progressData.forEach(course => {
      const circle = document.getElementById(`${course.id}-progress-circle`);
      const text = document.getElementById(`${course.id}-progress-text`);
      if (circle && text) {
         circle.style.setProperty('--p', `${course.percentage}%`);
         // Apply conic-gradient style dynamically
         circle.style.background = `conic-gradient(var(--main-color) 0% ${course.percentage}%, var(--white) ${course.percentage}% 100%)`;
         text.textContent = `${course.percentage}%`;
      }
   });

   // --- ACHIEVEMENTS / BADGES UNLOCK ---
   const badgeHtmlMaster = document.getElementById('badge-html-master');
   const badgeQuizWizard = document.getElementById('badge-quiz-wizard');
   const badgeWordsmith = document.getElementById('badge-top-commenter');
   const claimCertBtn = document.getElementById('claim-cert-btn');

   // Badge HTML Master: unlocked because HTML progress is 100%
   badgeHtmlMaster.classList.add('unlocked');
   // Show claim certificate button if HTML is completed
   claimCertBtn.style.display = 'inline-block';

   // Badge Quiz Wizard
   const quizQuizWizardUnlocked = localStorage.getItem('achievement-quiz-wizard') === 'unlocked';
   if (quizQuizWizardUnlocked) {
      badgeQuizWizard.classList.add('unlocked');
   }

   // Badge Wordsmith
   const wordsmithUnlocked = localStorage.getItem('achievement-wordsmith') === 'unlocked';
   if (wordsmithUnlocked) {
      badgeWordsmith.classList.add('unlocked');
   }

   // --- CERTIFICATE MODAL LOGIC ---
   const certOverlay = document.getElementById('certificate-modal-overlay');
   const closeModalBtn = document.getElementById('close-modal-btn');
   const certStudentName = document.getElementById('cert-student-name');
   const certDate = document.getElementById('cert-date');

   claimCertBtn.addEventListener('click', () => {
      // Set student name from localStorage if updated, otherwise use default
      const storedName = localStorage.getItem('user-name') || "Harsh Singh";
      certStudentName.textContent = storedName;
      
      // Set dynamic date
      const today = new Date();
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      certDate.textContent = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

      certOverlay.classList.add('active');
   });

   closeModalBtn.addEventListener('click', () => {
      certOverlay.classList.remove('active');
   });

   certOverlay.addEventListener('click', (e) => {
      if (e.target === certOverlay) {
         certOverlay.classList.remove('active');
      }
   });
});
