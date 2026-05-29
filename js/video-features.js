document.addEventListener('DOMContentLoaded', () => {
   const videoPlayer = document.getElementById('video-player');
   const videoTitle = document.getElementById('video-title').textContent.trim();
   
   // --- TAB CONTROLS ---
   const tabNotes = document.getElementById('tab-notes');
   const tabQuiz = document.getElementById('tab-quiz');
   const notesSection = document.getElementById('notes-section');
   const quizSection = document.getElementById('quiz-section');

   tabNotes.addEventListener('click', () => {
      tabNotes.classList.add('active');
      tabQuiz.classList.remove('active');
      notesSection.style.display = 'block';
      quizSection.style.display = 'none';
   });

   tabQuiz.addEventListener('click', () => {
      tabQuiz.classList.add('active');
      tabNotes.classList.remove('active');
      quizSection.style.display = 'block';
      notesSection.style.display = 'none';
      loadQuiz();
   });

   // --- NOTE TAKING SYSTEM ---
   const noteInput = document.getElementById('note-input');
   const addNoteBtn = document.getElementById('add-note-btn');
   const currentTimeDisplay = document.getElementById('current-time-display');
   const notesList = document.getElementById('notes-list');

   // Update timestamp display on button during video playback
   videoPlayer.addEventListener('timeupdate', () => {
      const currentSecs = Math.floor(videoPlayer.currentTime);
      currentTimeDisplay.textContent = formatTime(currentSecs);
   });

   function formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
   }

   // Load existing notes from localStorage
   function getNotes() {
      const notesJson = localStorage.getItem(`notes-${videoTitle}`);
      return notesJson ? JSON.parse(notesJson) : [];
   }

   function saveNotes(notes) {
      localStorage.setItem(`notes-${videoTitle}`, JSON.stringify(notes));
   }

   function renderNotes() {
      const notes = getNotes();
      notesList.innerHTML = '';
      
      if (notes.length === 0) {
         notesList.innerHTML = '<p class="description" style="text-align:center; padding: 2rem 0;">No notes added yet. Type below to add notes at the current video timestamp!</p>';
         return;
      }

      notes.forEach((note, index) => {
         const noteDiv = document.createElement('div');
         noteDiv.className = 'note-item';
         noteDiv.innerHTML = `
            <div class="note-header">
               <span class="note-timestamp" data-time="${note.seconds}"><i class="fas fa-play"></i> ${note.timeText}</span>
               <div class="note-actions">
                  <i class="fas fa-trash delete-note-btn" data-index="${index}"></i>
               </div>
            </div>
            <div class="note-content">${note.text}</div>
         `;
         notesList.appendChild(noteDiv);
      });

      // Bind note timestamp clicks
      document.querySelectorAll('.note-timestamp').forEach(item => {
         item.addEventListener('click', () => {
            const time = parseInt(item.getAttribute('data-time'), 10);
            videoPlayer.currentTime = time;
            videoPlayer.play();
         });
      });

      // Bind note delete button clicks
      document.querySelectorAll('.delete-note-btn').forEach(btn => {
         btn.addEventListener('click', (e) => {
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            let notes = getNotes();
            notes.splice(idx, 1);
            saveNotes(notes);
            renderNotes();
         });
      });
   }

   addNoteBtn.addEventListener('click', () => {
      const text = noteInput.value.trim();
      if (!text) return;

      const seconds = Math.floor(videoPlayer.currentTime);
      const timeText = formatTime(seconds);
      
      const newNote = { text, seconds, timeText };
      const notes = getNotes();
      notes.push(newNote);
      // Sort notes chronologically by timestamp
      notes.sort((a, b) => a.seconds - b.seconds);
      
      saveNotes(notes);
      noteInput.value = '';
      renderNotes();
   });

   renderNotes();


   // --- QUIZ ASSESSMENT SYSTEM ---
   const quizQuestion = document.getElementById('quiz-question');
   const quizOptions = document.getElementById('quiz-options');
   const quizActionBtn = document.getElementById('quiz-action-btn');

   const quizData = [
      {
         question: "What does HTML stand for?",
         options: [
            "HyperText Markup Language",
            "HighText Machine Language",
            "HyperTransfer Markup Language",
            "HyperText Markdown Language"
         ],
         answer: 0
      },
      {
         question: "Which HTML tag is used for the largest heading?",
         options: ["&lt;heading&gt;", "&lt;h6&gt;", "&lt;h1&gt;", "&lt;head&gt;"],
         answer: 2
      },
      {
         question: "What is the correct HTML tag for inserting a line break?",
         options: ["&lt;break&gt;", "&lt;br&gt;", "&lt;lb&gt;", "&lt;hr&gt;"],
         answer: 1
      }
   ];

   let currentQuestionIndex = 0;
   let selectedOption = null;
   let isAnswered = false;
   let quizScore = 0;

   function loadQuiz() {
      // Check if already completed quiz
      const isCompleted = localStorage.getItem(`quiz-completed-${videoTitle}`);
      if (isCompleted) {
         quizQuestion.innerHTML = "Assessment Completed!";
         quizOptions.innerHTML = `<div class="description" style="text-align:center; padding: 1.5rem 0;">You have already passed this course assessment! <br><strong>Score: ${localStorage.getItem(`quiz-score-${videoTitle}`)}/3</strong></div>`;
         quizActionBtn.style.display = 'none';
         return;
      }

      isAnswered = false;
      selectedOption = null;
      quizActionBtn.style.display = 'block';
      quizActionBtn.textContent = "Submit Answer";
      
      const currentQ = quizData[currentQuestionIndex];
      quizQuestion.textContent = `${currentQuestionIndex + 1}. ${currentQ.question}`;
      
      quizOptions.innerHTML = '';
      currentQ.options.forEach((opt, idx) => {
         const div = document.createElement('div');
         div.className = 'quiz-option';
         div.innerHTML = `<span>${opt}</span><i class="far fa-circle"></i>`;
         div.addEventListener('click', () => {
            if (isAnswered) return;
            document.querySelectorAll('.quiz-option').forEach(el => el.className = 'quiz-option');
            div.className = 'quiz-option selected';
            div.querySelector('i').className = 'far fa-check-circle';
            selectedOption = idx;
         });
         quizOptions.appendChild(div);
      });
   }

   quizActionBtn.addEventListener('click', () => {
      if (selectedOption === null) {
         alert("Please select an answer first!");
         return;
      }

      const currentQ = quizData[currentQuestionIndex];

      if (!isAnswered) {
         isAnswered = true;
         const options = document.querySelectorAll('.quiz-option');
         
         if (selectedOption === currentQ.answer) {
            options[selectedOption].classList.add('correct');
            options[selectedOption].querySelector('i').className = 'fas fa-check-circle';
            quizScore++;
         } else {
            options[selectedOption].classList.add('wrong');
            options[selectedOption].querySelector('i').className = 'fas fa-times-circle';
            
            options[currentQ.answer].classList.add('correct');
            options[currentQ.answer].querySelector('i').className = 'fas fa-check-circle';
         }

         quizActionBtn.textContent = currentQuestionIndex < quizData.length - 1 ? "Next Question" : "Finish Quiz";
      } else {
         if (currentQuestionIndex < quizData.length - 1) {
            currentQuestionIndex++;
            loadQuiz();
         } else {
            // End of Quiz
            localStorage.setItem(`quiz-completed-${videoTitle}`, 'true');
            localStorage.setItem(`quiz-score-${videoTitle}`, quizScore);
            
            // Set achievement check
            localStorage.setItem('achievement-quiz-wizard', 'unlocked');
            
            quizQuestion.innerHTML = "Assessment Completed!";
            quizOptions.innerHTML = `<div class="description" style="text-align:center; padding: 1.5rem 0;">Congratulations on completing the quiz!<br><strong>Score: ${quizScore}/3</strong></div>`;
            quizActionBtn.style.display = 'none';
         }
      }
   });


   // --- DYNAMIC COMMENTS SYSTEM ---
   const addCommentForm = document.getElementById('add-comment-form');
   const commentInput = document.getElementById('comment-input');
   const commentCount = document.getElementById('comment-count');
   const commentsList = document.getElementById('comments-list');

   const defaultComments = [
      { id: 1, name: "Harsh Singh", date: "22-10-2022", text: "this is a comment from Harsh Singh", avatar: "images/pic-1.jpg", likes: 2, likedByMe: false },
      { id: 2, name: "john deo", date: "22-10-2022", text: "awesome tutorial!\nkeep going!", avatar: "images/pic-2.jpg", likes: 8, likedByMe: false },
      { id: 3, name: "HK Singh", date: "22-10-2022", text: "amazing way of teaching!\nthank you so much!", avatar: "images/pic-3.jpg", likes: 15, likedByMe: false },
      { id: 4, name: "AD Tiwari", date: "22-10-2022", text: "loved it, thanks for the tutorial!", avatar: "images/pic-4.jpg", likes: 1, likedByMe: false },
      { id: 5, name: "Harsh", date: "22-10-2022", text: "this is what I have been looking for! thank you so much!", avatar: "images/pic-5.jpg", likes: 6, likedByMe: false },
      { id: 6, name: "Rishi", date: "22-10-2022", text: "thanks for the tutorial!\n\nhow to download source code file?", avatar: "images/pic-2.jpg", likes: 4, likedByMe: false }
   ];

   function getComments() {
      const data = localStorage.getItem(`comments-${videoTitle}`);
      if (!data) {
         localStorage.setItem(`comments-${videoTitle}`, JSON.stringify(defaultComments));
         return defaultComments;
      }
      return JSON.parse(data);
   }

   function saveComments(comments) {
      localStorage.setItem(`comments-${videoTitle}`, JSON.stringify(comments));
      
      // Track top commenter badge
      const userCommentsCount = comments.filter(c => c.name === "Harsh Singh").length;
      if (userCommentsCount >= 3) {
         localStorage.setItem('achievement-wordsmith', 'unlocked');
      }
   }

   function renderComments() {
      const comments = getComments();
      commentCount.textContent = comments.length;
      commentsList.innerHTML = '';

      comments.forEach(comment => {
         const box = document.createElement('div');
         box.className = 'box';

         const isCurrentUser = comment.name === "Harsh Singh";
         const editDeleteBtns = isCurrentUser ? `
            <form action="" class="flex-btn" style="margin-top:1.5rem;">
               <button class="inline-delete-btn delete-comment-btn" data-id="${comment.id}">delete comment</button>
            </form>
         ` : '';

         box.innerHTML = `
            <div class="user">
               <img src="${comment.avatar}" alt="">
               <div>
                  <h3>${comment.name}</h3>
                  <span>${comment.date}</span>
               </div>
            </div>
            <div class="comment-box">${comment.text}</div>
            <div class="comment-actions">
               <button class="like-cmt-btn ${comment.likedByMe ? 'liked' : ''}" data-id="${comment.id}">
                  <i class="fas fa-thumbs-up"></i> <span>${comment.likes}</span>
               </button>
            </div>
            ${editDeleteBtns}
         `;
         commentsList.appendChild(box);
      });

      // Bind like comment events
      document.querySelectorAll('.like-cmt-btn').forEach(btn => {
         btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            let comments = getComments();
            comments = comments.map(c => {
               if (c.id === id) {
                  if (c.likedByMe) {
                     c.likes--;
                     c.likedByMe = false;
                  } else {
                     c.likes++;
                     c.likedByMe = true;
                  }
               }
               return c;
            });
            saveComments(comments);
            renderComments();
         });
      });

      // Bind delete events
      document.querySelectorAll('.delete-comment-btn').forEach(btn => {
         btn.addEventListener('click', (e) => {
            e.preventDefault();
            const id = parseInt(btn.getAttribute('data-id'), 10);
            let comments = getComments();
            comments = comments.filter(c => c.id !== id);
            saveComments(comments);
            renderComments();
         });
      });
   }

   addCommentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = commentInput.value.trim();
      if (!val) return;

      const today = new Date();
      const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

      const comments = getComments();
      const newComment = {
         id: Date.now(),
         name: "Harsh Singh",
         date: formattedDate,
         text: val,
         avatar: "images/pic-1.jpg",
         likes: 0,
         likedByMe: false
      };

      comments.unshift(newComment);
      saveComments(comments);
      commentInput.value = '';
      renderComments();
   });

   renderComments();


   // --- LIKE VIDEO BUTTON ACTION ---
   const likeVideoBtn = document.getElementById('like-video-btn');
   const likesNumber = document.getElementById('likes-number');

   function updateLikeButton() {
      const likedVideos = JSON.parse(localStorage.getItem('liked-videos') || '{}');
      const isLiked = likedVideos[videoTitle] === true;
      const heartIcon = likeVideoBtn.querySelector('i');
      
      if (isLiked) {
         heartIcon.className = 'fas fa-heart';
         likeVideoBtn.querySelector('span').textContent = 'liked';
         likeVideoBtn.style.background = 'var(--main-gradient)';
         likeVideoBtn.style.color = '#fff';
         likeVideoBtn.querySelector('i').style.color = '#fff';
      } else {
         heartIcon.className = 'far fa-heart';
         likeVideoBtn.querySelector('span').textContent = 'like';
         likeVideoBtn.style.background = 'var(--light-bg)';
         likeVideoBtn.style.color = 'var(--black)';
         likeVideoBtn.querySelector('i').style.color = 'var(--black)';
      }
   }

   likeVideoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const likedVideos = JSON.parse(localStorage.getItem('liked-videos') || '{}');
      let likesVal = parseInt(likesNumber.textContent, 10);

      if (likedVideos[videoTitle]) {
         delete likedVideos[videoTitle];
         likesVal--;
      } else {
         likedVideos[videoTitle] = true;
         likesVal++;
      }

      localStorage.setItem('liked-videos', JSON.stringify(likedVideos));
      likesNumber.textContent = likesVal;
      updateLikeButton();
   });

   updateLikeButton();
});
