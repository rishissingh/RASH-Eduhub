/**
 * RASH EduHub - Robust HTML5 Video Player & Real Groq AI Teacher Assistant
 * Directly binds lesson.video to HTML5 Video Player src via VideoStorageService.
 */

let currentCourse = null;
let currentVideo = null;

document.addEventListener('DOMContentLoaded', async () => {
   const urlParams = new URLSearchParams(window.location.search);
   const courseId = urlParams.get('courseId') || 'c1';
   const videoId = urlParams.get('videoId');

   currentCourse = await CourseService.getCourseById(courseId);
   if (!currentCourse) {
      alert('Course not found.');
      window.location.href = '../courses.html';
      return;
   }

   const playlist = currentCourse.playlist || currentCourse.lessons || [];
   if (playlist.length === 0) {
      alert('No video lessons found for this course.');
      return;
   }

   if (videoId) {
      currentVideo = playlist.find(v => (v.id === videoId || v.lessonId === videoId));
   }
   if (!currentVideo) {
      currentVideo = playlist[0];
   }

   await initVideoPlayerControls();
   renderPlaylistSidebar();
   renderLessonDetails();
   await renderComments();
   initAITeacherChat();
   initTabSwitching();
});

/**
 * 100% Direct Data-Bound HTML5 Video Player Controller
 */
async function initVideoPlayerControls() {
   const container = document.querySelector('#video-player-container');
   if (!container) return;

   const activeLessonId = currentVideo.lessonId || currentVideo.id;
   const user = AuthService.getCurrentUser();
   const isCompleted = user?.completedLessons?.includes(activeLessonId);

   // Retrieve exact video source URL (IndexedDB Blob URL or uploaded URL string)
   const rawVideoSrc = currentVideo.video || currentVideo.videoUrl || '';
   const videoSourceUrl = await VideoStorageService.getVideoUrl(activeLessonId, rawVideoSrc);

   container.innerHTML = `
      <div class="glass-card" style="padding: 1.5rem; border-radius: 2rem; overflow: hidden; position: relative;">
         
         <!-- Direct Video Source Binding -->
         <video id="main-video" src="${videoSourceUrl}" controls preload="metadata" poster="../${currentCourse.thumbnail}" style="width: 100%; border-radius: 1.4rem; max-height: 55rem; background: #000; outline: none;">
            Your browser does not support HTML5 Video.
         </video>

         <!-- Custom Control Bar -->
         <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; margin-top: 1.5rem; padding: 0 1rem;">
            <div>
               <h2 style="font-size: 2.2rem; color: var(--black); margin-bottom: 0.4rem;">${currentVideo.title}</h2>
               <p style="font-size: 1.4rem; color: var(--light-color);">
                  Course: <strong>${currentCourse.title}</strong> &bull; By ${currentCourse.teacherName}
               </p>
            </div>

            <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
               <!-- Speed Selector -->
               <select id="video-speed-select" class="form-input" style="width: auto; padding: 0.6rem 1rem; font-size: 1.3rem;">
                  <option value="0.75">0.75x Speed</option>
                  <option value="1.0" selected>1.0x Speed</option>
                  <option value="1.25">1.25x Speed</option>
                  <option value="1.5">1.5x Speed</option>
                  <option value="2.0">2.0x Speed</option>
               </select>

               <!-- Picture in Picture (PIP) Button -->
               <button id="pip-btn" class="option-btn" style="width: auto; font-size: 1.3rem; padding: 0.6rem 1.2rem;" title="Picture in Picture">
                  <i class="fas fa-window-restore"></i> PIP Mode
               </button>

               <!-- Mark Complete Button -->
               <button id="toggle-complete-btn" class="${isCompleted ? 'option-btn' : 'btn'}" style="width: auto; font-size: 1.3rem; padding: 0.6rem 1.4rem;">
                  <i class="fas ${isCompleted ? 'fa-check-circle' : 'fa-circle'}"></i> ${isCompleted ? 'Completed' : 'Mark Complete'}
               </button>
            </div>
         </div>
      </div>
   `;

   const videoEl = container.querySelector('#main-video');
   const speedSelect = container.querySelector('#video-speed-select');
   const pipBtn = container.querySelector('#pip-btn');
   const toggleBtn = container.querySelector('#toggle-complete-btn');

   if (videoSourceUrl) {
      videoEl.src = videoSourceUrl;
      videoEl.load();
      videoEl.play().catch(err => console.log('Autoplay handled by browser policy:', err));
   }

   // Resume saved time AFTER metadata has loaded
   videoEl.addEventListener('loadedmetadata', () => {
      const savedTime = localStorage.getItem(`vid_time_${activeLessonId}`);
      if (savedTime && parseFloat(savedTime) > 0 && parseFloat(savedTime) < videoEl.duration) {
         videoEl.currentTime = parseFloat(savedTime);
      }
   });

   // Remember Time & Check Auto-Completion at 90%
   videoEl.addEventListener('timeupdate', () => {
      if (videoEl.currentTime > 0) {
         localStorage.setItem(`vid_time_${activeLessonId}`, videoEl.currentTime);
      }

      if (videoEl.duration > 0 && (videoEl.currentTime / videoEl.duration) >= 0.9) {
         const currentUser = AuthService.getCurrentUser();
         if (!currentUser?.completedLessons?.includes(activeLessonId)) {
            CourseService.toggleLessonComplete(activeLessonId).then(() => {
               toggleBtn.className = 'option-btn';
               toggleBtn.innerHTML = '<i class="fas fa-check-circle"></i> Completed';
               renderPlaylistSidebar();
            });
         }
      }
   });

   // Auto-Next Video on Ended
   videoEl.addEventListener('ended', () => {
      const playlist = currentCourse.playlist || currentCourse.lessons || [];
      const currentIndex = playlist.findIndex(v => (v.id === activeLessonId || v.lessonId === activeLessonId));
      if (currentIndex > -1 && currentIndex < playlist.length - 1) {
         const nextVideo = playlist[currentIndex + 1];
         const nextId = nextVideo.lessonId || nextVideo.id;
         if (window.Toast) {
            window.Toast.info(`Lesson Completed! Advancing to: ${nextVideo.title}`, 'Next Lesson');
         }
         setTimeout(() => {
            window.location.href = `watch-video.html?courseId=${currentCourse.id}&videoId=${nextId}`;
         }, 1500);
      }
   });

   // Playback Speed Handler
   if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
         videoEl.playbackRate = parseFloat(e.target.value);
      });
   }

   // Picture in Picture Handler
   if (pipBtn && document.pictureInPictureEnabled) {
      pipBtn.addEventListener('click', async () => {
         try {
            if (document.pictureInPictureElement) {
               await document.exitPictureInPicture();
            } else {
               await videoEl.requestPictureInPicture();
            }
         } catch (err) {
            console.warn('PIP failed:', err);
         }
      });
   }

   // Manual Toggle Button
   if (toggleBtn) {
      toggleBtn.addEventListener('click', async () => {
         const nowDone = await CourseService.toggleLessonComplete(activeLessonId);
         toggleBtn.className = nowDone ? 'option-btn' : 'btn';
         toggleBtn.innerHTML = `<i class="fas ${nowDone ? 'fa-check-circle' : 'fa-circle'}"></i> ${nowDone ? 'Completed' : 'Mark Complete'}`;
         renderPlaylistSidebar();
      });
   }

   // Keyboard Shortcuts
   document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.code === 'Space') {
         e.preventDefault();
         videoEl.paused ? videoEl.play() : videoEl.pause();
      } else if (e.code === 'KeyF') {
         e.preventDefault();
         if (videoEl.requestFullscreen) videoEl.requestFullscreen();
      } else if (e.code === 'KeyM') {
         e.preventDefault();
         videoEl.muted = !videoEl.muted;
      } else if (e.code === 'ArrowRight') {
         videoEl.currentTime += 5;
      } else if (e.code === 'ArrowLeft') {
         videoEl.currentTime -= 5;
      }
   });
}

/**
 * Render Playlist Sidebar with Active Lesson Highlight
 */
function renderPlaylistSidebar() {
   const container = document.querySelector('#playlist-sidebar-container');
   if (!container) return;

   const playlist = currentCourse.playlist || currentCourse.lessons || [];
   const user = AuthService.getCurrentUser();
   const completed = user?.completedLessons || [];

   const activeLessonId = currentVideo.lessonId || currentVideo.id;

   container.innerHTML = `
      <div class="glass-card" style="padding: 2rem;">
         <h3 style="font-size: 2rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: var(--border);">
            Course Playlist (${playlist.length} Lessons)
         </h3>
         <div style="display: flex; flex-direction: column; gap: 1.2rem; max-height: 50rem; overflow-y: auto;">
            ${playlist.map((v) => {
               const lId = v.lessonId || v.id;
               const isActive = lId === activeLessonId;
               const isDone = completed.includes(lId);

               return `
                  <a href="watch-video.html?courseId=${currentCourse.id}&videoId=${lId}" 
                     class="glass-card" 
                     style="padding: 1.2rem 1.5rem; display: flex; align-items: center; justify-content: space-between; text-decoration: none; border-left: 4px solid ${isActive ? 'var(--main-color)' : 'transparent'}; background: ${isActive ? 'rgba(252,90%,65%,0.15)' : 'var(--white)'};">
                     <div style="display: flex; align-items: center; gap: 1.2rem;">
                        <i class="fas ${isDone ? 'fa-check-circle' : (isActive ? 'fa-circle-play' : 'fa-play-circle')}" style="font-size: 1.8rem; color: ${isDone ? 'var(--green)' : (isActive ? 'var(--main-color)' : 'var(--light-color)')};"></i>
                        <div>
                           <h4 style="font-size: 1.4rem; color: var(--black); margin: 0;">${v.title}</h4>
                           <span style="font-size: 1.2rem; color: var(--light-color);">${v.duration}</span>
                        </div>
                     </div>
                     ${isActive ? '<span class="badge badge-accent" style="font-size: 1rem;">Playing</span>' : (isDone ? '<span class="badge badge-primary" style="font-size: 1rem;">Done</span>' : '')}
                  </a>
               `;
            }).join('')}
         </div>
      </div>
   `;
}

/**
 * Initialize ChatGPT-Style AI Teacher Assistant
 */
function initAITeacherChat() {
   const chatContainer = document.querySelector('#ai-chat-messages');
   const inputEl = document.querySelector('#ai-chat-input');
   const sendBtn = document.querySelector('#ai-send-btn');
   const chipBtns = document.querySelectorAll('.ai-prompt-chip');
   const exportBtn = document.querySelector('#ai-export-btn');
   const clearBtn = document.querySelector('#ai-clear-btn');
   const regenerateBtn = document.querySelector('#ai-regenerate-btn');

   const keyInput = document.querySelector('#groq-key-input');
   const saveKeyBtn = document.querySelector('#save-groq-key-btn');

   if (keyInput) {
      keyInput.value = AIService.getApiKey();
   }

   if (saveKeyBtn && keyInput) {
      saveKeyBtn.addEventListener('click', () => {
         const key = keyInput.value.trim();
         AIService.setApiKey(key);
         if (window.Toast) {
            if (key) {
               window.Toast.success('Groq API Key Saved! Real AI streaming active.', 'Key Configured');
            } else {
               window.Toast.info('Groq API Key cleared.', 'Key Cleared');
            }
         }
      });
   }

   if (!chatContainer) return;

   const activeLessonId = currentVideo.lessonId || currentVideo.id;
   const historyKey = `ai_chat_${activeLessonId}`;
   let chatHistory = JSON.parse(localStorage.getItem(historyKey) || '[]');

   const renderMessageHTML = (role, text) => {
      const isAI = role === 'ai';
      const parsedMarkdown = parseSimpleMarkdown(text);

      return `
         <div style="display: flex; gap: 1.2rem; margin-bottom: 1.8rem; align-items: flex-start; ${isAI ? '' : 'flex-direction: row-reverse;'}">
            <div style="height: 4rem; width: 4rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${isAI ? 'var(--main-gradient)' : 'var(--accent-gradient)'}; color: #fff; font-size: 1.6rem; flex-shrink: 0;">
               <i class="fas ${isAI ? 'fa-robot' : 'fa-user'}"></i>
            </div>
            <div class="glass-card" style="padding: 1.5rem 2rem; border-radius: 1.6rem; max-width: 85%; line-height: 1.7; font-size: 1.4rem; background: ${isAI ? 'var(--white)' : 'rgba(252,90%,65%,0.1)'};">
               <strong style="display: block; font-size: 1.2rem; color: var(--light-color); margin-bottom: 0.4rem;">${isAI ? 'AI Teacher Assistant' : 'You'}</strong>
               <div>${parsedMarkdown}</div>
            </div>
         </div>
      `;
   };

   const displayChatHistory = () => {
      if (chatHistory.length === 0) {
         chatContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: var(--light-color);">
               <i class="fas fa-robot" style="font-size: 3.5rem; color: var(--main-color); margin-bottom: 1rem;"></i>
               <p style="font-size: 1.5rem;">Hello! Ask me any programming question about <strong>${currentVideo.title}</strong>.</p>
               <p style="font-size: 1.3rem;">Type any question (e.g., "What is HTML?", "What is Time Complexity?", "What is CSS?") or click a prompt below!</p>
            </div>
         `;
      } else {
         chatContainer.innerHTML = chatHistory.map(m => renderMessageHTML(m.role, m.text)).join('');
         chatContainer.scrollTop = chatContainer.scrollHeight;
      }
   };

   displayChatHistory();

   const handleUserSubmit = (userText) => {
      if (!userText.trim()) return;

      chatHistory.push({ role: 'user', text: userText });
      localStorage.setItem(historyKey, JSON.stringify(chatHistory));
      displayChatHistory();

      if (inputEl) inputEl.value = '';

      const tempAiMsg = { role: 'ai', text: 'Thinking...' };
      chatHistory.push(tempAiMsg);
      displayChatHistory();

      AIService.askTeacherAssistant({
         courseTitle: currentCourse.title,
         lessonTitle: currentVideo.title,
         lessonDescription: currentVideo.description,
         userQuery: userText,
         chatHistory: chatHistory.slice(0, -1),
         onChunk: (chunkText) => {
            chatHistory[chatHistory.length - 1].text = chunkText;
            chatContainer.innerHTML = chatHistory.map(m => renderMessageHTML(m.role, m.text)).join('');
            chatContainer.scrollTop = chatContainer.scrollHeight;
         },
         onComplete: (finalText) => {
            chatHistory[chatHistory.length - 1].text = finalText;
            localStorage.setItem(historyKey, JSON.stringify(chatHistory));
         }
      });
   };

   if (sendBtn && inputEl) {
      sendBtn.addEventListener('click', () => handleUserSubmit(inputEl.value));
      inputEl.addEventListener('keypress', (e) => {
         if (e.key === 'Enter') handleUserSubmit(inputEl.value);
      });
   }

   chipBtns.forEach(chip => {
      chip.addEventListener('click', () => {
         handleUserSubmit(chip.dataset.prompt);
      });
   });

   if (clearBtn) {
      clearBtn.addEventListener('click', () => {
         chatHistory = [];
         localStorage.removeItem(historyKey);
         displayChatHistory();
      });
   }

   if (regenerateBtn) {
      regenerateBtn.addEventListener('click', () => {
         const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
         if (lastUserMsg) {
            handleUserSubmit(lastUserMsg.text);
         } else {
            alert('No previous user message to regenerate.');
         }
      });
   }

   if (exportBtn) {
      exportBtn.addEventListener('click', () => {
         if (chatHistory.length === 0) {
            alert('No chat history to export.');
            return;
         }
         const textContent = chatHistory.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n\n---\n\n');
         const blob = new Blob([textContent], { type: 'text/plain' });
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `AI_Study_Notes_${currentVideo.title.replace(/\s+/g, '_')}.txt`;
         a.click();
      });
   }
}

/**
 * Parse Markdown syntax to clean HTML with copy code button
 */
function parseSimpleMarkdown(mdText) {
   let html = mdText
      .replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
         return `<div style="position: relative; margin: 1rem 0;">
            <button onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); if(window.Toast) { window.Toast.success('Code copied to clipboard!', 'Copied'); } else { alert('Code copied!'); }" style="position: absolute; top: 0.8rem; right: 0.8rem; background: var(--main-color); color: #fff; padding: 0.4rem 0.8rem; border-radius: 0.4rem; font-size: 1.1rem; cursor: pointer; border: none;">Copy</button>
            <pre style="background: var(--light-bg); padding: 1.4rem; border-radius: 1rem; overflow-x: auto; font-family: monospace; font-size: 1.3rem; border: var(--border);"><code>${code.trim()}</code></pre>
         </div>`;
      })
      .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.08); padding: 0.2rem 0.6rem; border-radius: 0.4rem; font-family: monospace;">$1</code>')
      .replace(/^#### (.*$)/gim, '<h5 style="font-size: 1.5rem; color: var(--main-color); margin: 1rem 0 0.4rem 0;">$1</h5>')
      .replace(/^### (.*$)/gim, '<h4 style="font-size: 1.7rem; color: var(--black); margin: 1.2rem 0 0.5rem 0; font-weight: 700;">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\* (.*$)/gim, '<li style="margin-left: 1.5rem; margin-bottom: 0.3rem;">$1</li>');
   return html;
}

/**
 * Render Lesson Details Tabs
 */
function renderLessonDetails() {
   const descContainer = document.querySelector('#tab-overview-content');
   if (descContainer) {
      descContainer.innerHTML = `
         <p style="font-size: 1.6rem; line-height: 1.8; color: var(--light-color); margin-bottom: 2rem;">
            ${currentVideo.description || currentCourse.description}
         </p>
      `;
   }

   const notesContainer = document.querySelector('#tab-notes-content');
   if (notesContainer) {
      const activeLessonId = currentVideo.lessonId || currentVideo.id;
      const notesData = window.CourseNotesService ? window.CourseNotesService.getNotesByLessonId(activeLessonId) : null;
      const summaryText = notesData ? notesData.summary : `Official lecture cheat sheet and comprehensive study notes for ${currentVideo.title}.`;
      const notesUrl = `notes.html?courseId=${currentCourse.id || currentCourse._id}&lessonId=${activeLessonId}`;

      notesContainer.innerHTML = `
         <div style="padding: 2.5rem; background: var(--light-bg); border-radius: 1.6rem; border: var(--border);">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1.5rem; margin-bottom: 2rem;">
               <div style="display: flex; align-items: center; gap: 1.5rem;">
                  <i class="fas fa-book-bookmark" style="font-size: 3.5rem; color: var(--main-color);"></i>
                  <div>
                     <h4 style="font-size: 1.8rem; margin-bottom: 0.3rem; color: var(--black);">Official Lecture Notes & Revision Guide</h4>
                     <span style="font-size: 1.35rem; color: var(--light-color);">Curated study material for <strong>${currentVideo.title}</strong></span>
                  </div>
               </div>
               
               <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                  <a href="${notesUrl}" class="btn" style="width: auto; font-size: 1.35rem; padding: 0.9rem 1.8rem;">
                     <i class="fas fa-book-open"></i> Open Interactive Notes
                  </a>
                  <a href="${notesUrl}" target="_blank" class="option-btn" style="width: auto; font-size: 1.35rem; padding: 0.9rem 1.6rem;">
                     <i class="fas fa-download"></i> Print / Save PDF
                  </a>
               </div>
            </div>

            <p style="font-size: 1.45rem; color: var(--light-color); line-height: 1.7; background: var(--card-bg); padding: 1.5rem 1.8rem; border-radius: 1.2rem; margin: 0; border: var(--border);">
               <strong>💡 Notes Overview:</strong> ${summaryText}
            </p>
         </div>
      `;
   }
}

/**
 * Render Video Comments
 */
async function renderComments() {
   const container = document.querySelector('#comments-list');
   if (!container) return;

   const activeLessonId = currentVideo.lessonId || currentVideo.id;
   const comments = await CourseService.getComments(activeLessonId);

   if (comments.length === 0) {
      container.innerHTML = `<p style="font-size: 1.4rem; color: var(--light-color);">No student comments yet.</p>`;
   } else {
      container.innerHTML = comments.map(c => `
         <div style="display: flex; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: var(--border);">
            <img src="../${c.userAvatar}" alt="${c.userName}" style="height: 4.5rem; width: 4.5rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--main-color);">
            <div>
               <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.4rem;">
                  <h4 style="font-size: 1.5rem; color: var(--black); font-weight: 700;">${c.userName}</h4>
                  <span style="font-size: 1.2rem; color: var(--light-color);">${c.date}</span>
               </div>
               <p style="font-size: 1.4rem; color: var(--light-color); line-height: 1.6;">${c.text}</p>
            </div>
         </div>
      `).join('');
   }
}

/**
 * Handle Tab Switching
 */
function initTabSwitching() {
   const tabBtns = document.querySelectorAll('.tab-btn');
   const tabContents = document.querySelectorAll('.tab-content');

   tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
         tabBtns.forEach(b => b.classList.remove('active'));
         tabContents.forEach(c => c.style.display = 'none');

         btn.classList.add('active');
         const target = document.querySelector(`#${btn.dataset.target}`);
         if (target) target.style.display = 'block';
      });
   });
}
