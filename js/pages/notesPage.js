/**
 * RASH EduHub - Interactive Course Notes & PDF Viewer Controller
 * Dynamically loads lecture notes, cheat sheets, code snippets, and lesson switchers.
 */

document.addEventListener('DOMContentLoaded', async () => {
   const urlParams = new URLSearchParams(window.location.search);
   let courseId = urlParams.get('courseId');
   let lessonId = urlParams.get('lessonId');

   // Fallback to first course if no courseId provided
   const allCourses = await CourseService.getAllCourses();
   let currentCourse = null;

   if (courseId) {
      currentCourse = await CourseService.getCourseById(courseId);
   }
   if (!currentCourse && allCourses.length > 0) {
      currentCourse = allCourses[0];
      courseId = currentCourse.id || currentCourse._id;
   }

   if (!currentCourse) {
      renderNotFound();
      return;
   }

   const playlist = currentCourse.playlist || currentCourse.lessons || [];
   let currentLesson = null;

   if (lessonId) {
      currentLesson = playlist.find(l => l.id === lessonId || l._id === lessonId || l.lessonId === lessonId);
   }
   if (!currentLesson && playlist.length > 0) {
      currentLesson = playlist[0];
      lessonId = currentLesson.id || currentLesson._id || currentLesson.lessonId;
   }

   // Fetch notes data
   let notesData = window.CourseNotesService ? window.CourseNotesService.getNotesByLessonId(lessonId) : null;

   if (!notesData) {
      const lessonTitle = currentLesson ? currentLesson.title : 'Lecture Notes';
      notesData = window.CourseNotesService ? window.CourseNotesService.getFallbackNotes(lessonTitle, currentCourse.title) : {
         courseTitle: currentCourse.title,
         lessonTitle: lessonTitle,
         category: currentCourse.category || 'Development',
         author: currentCourse.teacherName || 'Instructor',
         summary: `Comprehensive study guide and cheat sheet for ${lessonTitle}.`,
         keyTakeaways: [
            `Understand core principles of ${lessonTitle}.`,
            'Review syntax cheat sheets and best practices.',
            'Apply concepts in the interactive code sandbox.'
         ],
         content: `<p>${currentLesson?.description || currentCourse.description}</p>`,
         codeSnippets: []
      };
   }

   renderNotesHeader(currentCourse, currentLesson, notesData);
   renderNotesContent(notesData);
   renderLessonsSidebar(currentCourse, lessonId);
   initToolbarButtons(currentCourse, currentLesson, notesData);
});

/**
 * Render Header Banner
 */
function renderNotesHeader(course, lesson, notes) {
   const catBadge = document.querySelector('#notes-category-badge');
   const authorTag = document.querySelector('#notes-author-tag');
   const courseTitle = document.querySelector('#notes-course-title');
   const lessonTitle = document.querySelector('#notes-lesson-title');
   const watchVideoBtn = document.querySelector('#notes-watch-video-btn');

   if (catBadge) catBadge.textContent = course.category || notes.category || 'Development';
   if (authorTag) authorTag.innerHTML = `<i class="fas fa-user-graduate"></i> Instructor: ${course.teacherName || notes.author || 'Instructor'}`;
   if (courseTitle) courseTitle.textContent = course.title;
   if (lessonTitle) lessonTitle.innerHTML = `<i class="fas fa-book-open"></i> ${lesson ? lesson.title : notes.lessonTitle}`;

   const activeLessonId = lesson ? (lesson.id || lesson._id || lesson.lessonId) : '';
   const isStudentSubdir = window.location.pathname.includes('/student/');
   const watchUrl = isStudentSubdir 
      ? `watch-video.html?courseId=${course.id || course._id}&videoId=${activeLessonId}`
      : `student/watch-video.html?courseId=${course.id || course._id}&videoId=${activeLessonId}`;

   if (watchVideoBtn) {
      watchVideoBtn.href = watchUrl;
   }
}

/**
 * Render Main Notes Content & Code Blocks
 */
function renderNotesContent(notes) {
   const summaryText = document.querySelector('#notes-summary-text');
   const mainBody = document.querySelector('#notes-main-body');
   const takeawaysList = document.querySelector('#notes-takeaways-list');

   if (summaryText) {
      summaryText.textContent = notes.summary || 'Study notes and cheat sheet for this lesson.';
   }

   if (mainBody) {
      let snippetsHTML = '';
      if (Array.isArray(notes.codeSnippets) && notes.codeSnippets.length > 0) {
         snippetsHTML = notes.codeSnippets.map(snip => `
            <div style="margin: 2.5rem 0;">
               <h4 style="font-size: 1.7rem; color: var(--black); margin-bottom: 1rem; font-weight: 700;">
                  <i class="fas fa-code" style="color: var(--main-color);"></i> ${snip.title}
               </h4>
               <div style="position: relative;">
                  <button onclick="navigator.clipboard.writeText(this.nextElementSibling.innerText); if(window.Toast) { window.Toast.success('Code copied to clipboard!', 'Copied'); } else { alert('Code copied!'); }" style="position: absolute; top: 1rem; right: 1rem; background: var(--main-color); color: #fff; padding: 0.5rem 1rem; border-radius: 0.6rem; font-size: 1.2rem; border: none; cursor: pointer; font-weight: 600;">Copy Code</button>
                  <pre style="background: var(--light-bg); padding: 1.8rem; border-radius: 1.4rem; overflow-x: auto; font-family: monospace; font-size: 1.35rem; border: var(--border); color: var(--black); line-height: 1.6;"><code>${escapeHTML(snip.code)}</code></pre>
               </div>
            </div>
         `).join('');
      }

      mainBody.innerHTML = (notes.content || '') + snippetsHTML;
   }

   if (takeawaysList) {
      const list = notes.keyTakeaways || [];
      if (list.length === 0) {
         takeawaysList.innerHTML = `<li>Review the code snippets and summary above to revise core concepts.</li>`;
      } else {
         takeawaysList.innerHTML = list.map(t => `
            <li style="margin-bottom: 1rem;"><i class="fas fa-check-circle" style="color: var(--green); margin-right: 0.8rem;"></i> ${t}</li>
         `).join('');
      }
   }
}

/**
 * Render Sidebar with Course Playlist Lessons
 */
function renderLessonsSidebar(course, activeLessonId) {
   const container = document.querySelector('#notes-lessons-sidebar');
   if (!container) return;

   const playlist = course.playlist || course.lessons || [];

   if (playlist.length === 0) {
      container.innerHTML = `<p style="font-size: 1.3rem; color: var(--light-color);">No lessons found.</p>`;
      return;
   }

   const isStudentSubdir = window.location.pathname.includes('/student/');
   const baseUrl = isStudentSubdir ? 'notes.html' : 'notes.html';

   container.innerHTML = playlist.map((l, idx) => {
      const lId = l.id || l._id || l.lessonId;
      const isActive = lId === activeLessonId;

      return `
         <a href="${baseUrl}?courseId=${course.id || course._id}&lessonId=${lId}" 
            class="glass-card" 
            style="padding: 1.2rem 1.5rem; display: flex; align-items: center; justify-content: space-between; text-decoration: none; border-left: 4px solid ${isActive ? 'var(--main-color)' : 'transparent'}; background: ${isActive ? 'rgba(37,99,235,0.1)' : 'var(--white)'};">
            <div style="display: flex; align-items: center; gap: 1rem;">
               <i class="fas ${isActive ? 'fa-book-open-reader' : 'fa-file-lines'}" style="font-size: 1.6rem; color: ${isActive ? 'var(--main-color)' : 'var(--light-color)'};"></i>
               <div>
                  <h4 style="font-size: 1.35rem; color: var(--black); margin: 0; font-weight: ${isActive ? '700' : '500'};">${l.title}</h4>
                  <span style="font-size: 1.15rem; color: var(--light-color);">${l.duration || 'Notes Ready'}</span>
               </div>
            </div>
            ${isActive ? '<span class="badge badge-accent" style="font-size: 0.95rem;">Active</span>' : ''}
         </a>
      `;
   }).join('');
}

/**
 * Toolbar Actions
 */
function initToolbarButtons(course, lesson, notes) {
   const printBtn = document.querySelector('#btn-print-notes');
   const copyBtn = document.querySelector('#btn-copy-notes');
   const askAIBtn = document.querySelector('#btn-ask-ai-notes');

   if (printBtn) {
      printBtn.addEventListener('click', () => {
         window.print();
      });
   }

   if (copyBtn) {
      copyBtn.addEventListener('click', () => {
         const titleText = `${course.title} - ${lesson ? lesson.title : notes.lessonTitle}\n\n`;
         const summaryText = `SUMMARY:\n${notes.summary || ''}\n\n`;
         const takeawaysText = `KEY TAKEAWAYS:\n` + (notes.keyTakeaways || []).map(t => `- ${t}`).join('\n') + '\n\n';
         const textToCopy = titleText + summaryText + takeawaysText;

         navigator.clipboard.writeText(textToCopy);
         if (window.Toast) {
            window.Toast.success('Lesson notes copied to clipboard!', 'Copied');
         } else {
            alert('Notes copied to clipboard!');
         }
      });
   }

   if (askAIBtn) {
      askAIBtn.addEventListener('click', () => {
         const activeLessonId = lesson ? (lesson.id || lesson._id || lesson.lessonId) : '';
         const isStudentSubdir = window.location.pathname.includes('/student/');
         const targetUrl = isStudentSubdir 
            ? `watch-video.html?courseId=${course.id || course._id}&videoId=${activeLessonId}`
            : `student/watch-video.html?courseId=${course.id || course._id}&videoId=${activeLessonId}`;
         
         window.location.href = targetUrl;
      });
   }
}

function escapeHTML(str) {
   if (!str) return '';
   return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
}

function renderNotFound() {
   const mainContainer = document.querySelector('section');
   if (mainContainer) {
      mainContainer.innerHTML = `
         <div class="glass-card" style="padding: 5rem; text-align: center; max-width: 60rem; margin: 4rem auto;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: var(--red); margin-bottom: 1.5rem;"></i>
            <h2 style="font-size: 2.4rem;">Notes Not Found</h2>
            <p style="font-size: 1.5rem; color: var(--light-color); margin: 1rem 0 2rem 0;">The requested course notes could not be located.</p>
            <a href="courses.html" class="inline-btn">Browse All Courses</a>
         </div>
      `;
   }
}
