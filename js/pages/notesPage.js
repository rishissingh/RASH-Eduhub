/**
 * RASH EduHub - Interactive Course Notes & PDF Viewer Controller
 * Dynamically loads lecture notes from database API, renders Markdown/HTML,
 * supports download, printing/saving as PDF, and lesson switching.
 */

document.addEventListener('DOMContentLoaded', async () => {
   const urlParams = new URLSearchParams(window.location.search);
   let courseId = urlParams.get('courseId');
   let lessonId = urlParams.get('lessonId');
   const action = urlParams.get('action');

   // 1. Fetch course details
   let currentCourse = null;
   if (courseId) {
      currentCourse = await CourseService.getCourseById(courseId);
   }

   if (!currentCourse) {
      const allCourses = await CourseService.getAllCourses();
      if (allCourses.length > 0) {
         currentCourse = allCourses[0];
         courseId = currentCourse.id || currentCourse._id;
      }
   }

   if (!currentCourse) {
      renderNotFound();
      return;
   }

   // 2. Fetch notes directly from database API: GET /api/courses/:id/notes
   const notesRes = await CourseService.getCourseNotes(courseId);
   const dbNotesList = (notesRes && notesRes.success && notesRes.notes) ? notesRes.notes : [];

   // Merge DB lessons and notes
   const lessons = (dbNotesList.length > 0) ? dbNotesList : (currentCourse.playlist || currentCourse.lessons || []);

   if (lessons.length === 0) {
      renderEmptyNotes(currentCourse);
      return;
   }

   // 3. Identify active lesson
   let activeLesson = null;
   if (lessonId) {
      activeLesson = lessons.find(l => l.id === lessonId || l._id === lessonId || l.lessonId === lessonId);
   }
   if (!activeLesson) {
      activeLesson = lessons[0];
      lessonId = activeLesson.id || activeLesson._id;
   }

   // 4. Resolve rich note content (from DB or fallback data provider)
   let fallbackData = window.CourseNotesService ? window.CourseNotesService.getNotesByLessonId(lessonId) : null;
   if (!fallbackData && window.CourseNotesService) {
      fallbackData = window.CourseNotesService.getFallbackNotes(activeLesson.title, currentCourse.title);
   }

   const resolvedNote = {
      id: activeLesson.id || activeLesson._id,
      title: activeLesson.title,
      duration: activeLesson.duration || '15 min read',
      category: currentCourse.category || 'Development',
      author: currentCourse.teacherName || 'Instructor',
      teacherAvatar: currentCourse.teacherAvatar || 'images/pic-1.jpg',
      teacherId: currentCourse.teacherId || '',
      summary: activeLesson.description || fallbackData?.summary || `Executive study outline for ${activeLesson.title}.`,
      content: activeLesson.notes || fallbackData?.content || `<p>${activeLesson.description || 'Lecture notes content.'}</p>`,
      keyTakeaways: fallbackData?.keyTakeaways || [
         `Master the fundamental architecture of ${activeLesson.title}.`,
         'Review code examples and syntax cheat sheets.',
         'Execute hands-on exercises in the Code Sandbox.'
      ],
      codeSnippets: fallbackData?.codeSnippets || [],
      pdfAttachment: activeLesson.pdfAttachment || activeLesson.pdf_attachment || ''
   };

   // 5. Render UI sections
   renderNotesHeader(currentCourse, activeLesson, resolvedNote);
   renderNotesContent(resolvedNote);
   renderLessonsSidebar(currentCourse, lessons, activeLesson.id || activeLesson._id);
   initToolbarButtons(currentCourse, activeLesson, resolvedNote);

   // Auto-trigger print if requested
   if (action === 'print') {
      setTimeout(() => window.print(), 600);
   }
});

/**
 * Render Header Banner & Back Controls
 */
function renderNotesHeader(course, lesson, notes) {
   const catBadge = document.querySelector('#notes-category-badge');
   const authorTag = document.querySelector('#notes-author-tag');
   const courseTitle = document.querySelector('#notes-course-title');
   const lessonTitle = document.querySelector('#notes-lesson-title');
   const watchVideoBtn = document.querySelector('#notes-watch-video-btn');
   const backCourseBtn = document.querySelector('#notes-back-course-btn');

   if (catBadge) catBadge.textContent = course.category || notes.category || 'Development';
   if (authorTag) {
      authorTag.innerHTML = `
         <i class="fas fa-chalkboard-user"></i> Instructor: <strong>${escapeHTML(course.teacherName || notes.author)}</strong>
      `;
   }
   if (courseTitle) courseTitle.textContent = course.title;
   if (lessonTitle) lessonTitle.innerHTML = `<i class="fas fa-book-open"></i> ${escapeHTML(lesson.title)}`;

   const isStudentSubdir = window.location.pathname.includes('/student/');
   const cId = course.id || course._id;
   const lId = lesson.id || lesson._id || '';

   if (watchVideoBtn) {
      const watchUrl = isStudentSubdir 
         ? `watch-video.html?courseId=${cId}&videoId=${lId}`
         : `student/watch-video.html?courseId=${cId}&videoId=${lId}`;
      watchVideoBtn.href = watchUrl;
   }

   if (backCourseBtn) {
      const courseUrl = isStudentSubdir ? `../playlist.html?courseId=${cId}` : `playlist.html?courseId=${cId}`;
      backCourseBtn.href = courseUrl;
      backCourseBtn.innerHTML = `<i class="fas fa-arrow-left"></i> Course Playlist`;
   }
}

/**
 * Render Main Notes Content, Markdown/HTML, and Code Snippets
 */
function renderNotesContent(notes) {
   const summaryText = document.querySelector('#notes-summary-text');
   const mainBody = document.querySelector('#notes-main-body');
   const takeawaysList = document.querySelector('#notes-takeaways-list');

   if (summaryText) {
      summaryText.textContent = notes.summary || 'Comprehensive study outline and cheat sheet for this lesson.';
   }

   if (mainBody) {
      let contentHTML = renderMarkdownOrHTML(notes.content);

      // Render code snippets if present
      let snippetsHTML = '';
      if (Array.isArray(notes.codeSnippets) && notes.codeSnippets.length > 0) {
         snippetsHTML = notes.codeSnippets.map(snip => `
            <div style="margin: 2.5rem 0;">
               <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
                  <h4 style="font-size: 1.6rem; color: var(--black); margin: 0; font-weight: 700;">
                     <i class="fas fa-code" style="color: var(--main-color);"></i> ${escapeHTML(snip.title)}
                  </h4>
                  <span class="badge" style="font-size: 1.1rem; text-transform: uppercase;">${snip.language || 'Code'}</span>
               </div>
               <div style="position: relative;">
                  <button onclick="copySnippetCode(this)" style="position: absolute; top: 1rem; right: 1rem; background: var(--main-color); color: #fff; padding: 0.5rem 1rem; border-radius: 0.6rem; font-size: 1.2rem; border: none; cursor: pointer; font-weight: 600;">
                     <i class="fas fa-copy"></i> Copy
                  </button>
                  <pre style="background: var(--light-bg); padding: 1.8rem; border-radius: 1.4rem; overflow-x: auto; font-family: monospace; font-size: 1.35rem; border: var(--border); color: var(--black); line-height: 1.6;"><code>${escapeHTML(snip.code)}</code></pre>
               </div>
            </div>
         `).join('');
      }

      // PDF Attachment Download Widget
      let attachmentHTML = '';
      if (notes.pdfAttachment) {
         attachmentHTML = `
            <div class="glass-card no-print" style="margin-top: 3rem; padding: 2rem 2.5rem; border-radius: 1.6rem; border-left: 5px solid var(--accent-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem; background: rgba(139, 92, 246, 0.08);">
               <div>
                  <h4 style="font-size: 1.7rem; color: var(--black); margin-bottom: 0.4rem;">
                     <i class="fas fa-file-pdf" style="color: var(--accent-color);"></i> Official PDF Study Attachment
                  </h4>
                  <p style="font-size: 1.35rem; color: var(--light-color); margin: 0;">Verified supplementary reading document uploaded by instructor.</p>
               </div>
               <a href="${escapeHTML(notes.pdfAttachment)}" target="_blank" class="btn" style="width: auto; padding: 0.8rem 1.8rem; font-size: 1.35rem;">
                  <i class="fas fa-download"></i> Open Document
               </a>
            </div>
         `;
      }

      mainBody.innerHTML = contentHTML + snippetsHTML + attachmentHTML;
   }

   if (takeawaysList) {
      const list = notes.keyTakeaways || [];
      if (list.length === 0) {
         takeawaysList.innerHTML = `<li>Review the code snippets and summary above to revise core principles.</li>`;
      } else {
         takeawaysList.innerHTML = list.map(t => `
            <li style="margin-bottom: 1rem;">
               <i class="fas fa-check-circle" style="color: var(--green); margin-right: 0.8rem;"></i> ${escapeHTML(t)}
            </li>
         `).join('');
      }
   }
}

/**
 * Render Sidebar with Lessons Switcher and Search
 */
function renderLessonsSidebar(course, lessons, activeLessonId) {
   const container = document.querySelector('#notes-lessons-sidebar');
   if (!container) return;

   const isStudentSubdir = window.location.pathname.includes('/student/');
   const baseUrl = isStudentSubdir ? 'notes.html' : 'notes.html';

   const renderList = (items) => {
      if (items.length === 0) {
         return `<p style="font-size: 1.3rem; color: var(--light-color); text-align: center; padding: 2rem;">No matching notes found.</p>`;
      }
      return items.map((l, idx) => {
         const lId = l.id || l._id;
         const isActive = lId === activeLessonId;

         return `
            <a href="${baseUrl}?courseId=${course.id || course._id}&lessonId=${lId}" 
               class="glass-card hover-lift" 
               style="padding: 1.2rem 1.5rem; display: flex; align-items: center; justify-content: space-between; text-decoration: none; border-radius: 1.2rem; border-left: 4px solid ${isActive ? 'var(--main-color)' : 'transparent'}; background: ${isActive ? 'rgba(37,99,235,0.1)' : 'var(--white)'};">
               <div style="display: flex; align-items: center; gap: 1rem; overflow: hidden;">
                  <i class="fas ${isActive ? 'fa-book-open-reader' : 'fa-file-lines'}" style="font-size: 1.6rem; color: ${isActive ? 'var(--main-color)' : 'var(--light-color)'}; flex-shrink: 0;"></i>
                  <div style="overflow: hidden;">
                     <h4 style="font-size: 1.35rem; color: var(--black); margin: 0; font-weight: ${isActive ? '700' : '500'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHTML(l.title)}</h4>
                     <span style="font-size: 1.15rem; color: var(--light-color);">${l.duration || 'Study Note'}</span>
                  </div>
               </div>
               ${isActive ? '<span class="badge badge-accent" style="font-size: 0.95rem; margin-left: 0.5rem; flex-shrink: 0;">Active</span>' : ''}
            </a>
         `;
      }).join('');
   };

   // Add search input inside sidebar
   container.innerHTML = `
      <div style="margin-bottom: 1.2rem;">
         <input type="text" id="sidebar-notes-search" placeholder="Filter notes..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 0.8rem; border: var(--border); background: var(--light-bg); font-size: 1.3rem; color: var(--black); outline: none;">
      </div>
      <div id="sidebar-notes-list" style="display: flex; flex-direction: column; gap: 0.8rem;">
         ${renderList(lessons)}
      </div>
   `;

   const searchInput = document.querySelector('#sidebar-notes-search');
   const listContainer = document.querySelector('#sidebar-notes-list');

   if (searchInput && listContainer) {
      searchInput.addEventListener('input', (e) => {
         const q = e.target.value.toLowerCase().trim();
         const filtered = lessons.filter(l => (l.title || '').toLowerCase().includes(q) || (l.description || '').toLowerCase().includes(q));
         listContainer.innerHTML = renderList(filtered);
      });
   }
}

/**
 * Initialize Toolbar Actions: Print, Copy, Download Note File
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
         const titleText = `${course.title} - ${lesson.title}\n\n`;
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

   // Inject dedicated "Download Note (.md)" button if not present
   const toolbarDiv = printBtn?.parentElement;
   if (toolbarDiv && !document.querySelector('#btn-download-notes-file')) {
      const downloadBtn = document.createElement('button');
      downloadBtn.id = 'btn-download-notes-file';
      downloadBtn.className = 'btn';
      downloadBtn.style.cssText = 'width: auto; padding: 0.8rem 1.6rem; font-size: 1.3rem; background: var(--green);';
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Note';
      downloadBtn.addEventListener('click', () => {
         const cleanContent = notes.content.replace(/<[^>]*>?/gm, '');
         const mdContent = `# ${course.title}\n## ${lesson.title}\n\n### Summary\n${notes.summary}\n\n### Content\n${cleanContent}\n\n### Key Takeaways\n${(notes.keyTakeaways || []).map(t => `- ${t}`).join('\n')}\n`;
         downloadNoteFile(`${course.title}_${lesson.title}`, mdContent, 'md');
      });
      toolbarDiv.insertBefore(downloadBtn, printBtn);
   }

   if (askAIBtn) {
      askAIBtn.addEventListener('click', () => {
         const isStudentSubdir = window.location.pathname.includes('/student/');
         const cId = course.id || course._id;
         const lId = lesson.id || lesson._id;
         const targetUrl = isStudentSubdir 
            ? `watch-video.html?courseId=${cId}&videoId=${lId}`
            : `student/watch-video.html?courseId=${cId}&videoId=${lId}`;
         window.location.href = targetUrl;
      });
   }
}

/**
 * Download text/markdown file locally
 */
function downloadNoteFile(filename, content, ext = 'md') {
   const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.${ext}`;
   document.body.appendChild(a);
   a.click();
   document.body.removeChild(a);
   URL.revokeObjectURL(url);

   if (window.Toast) {
      window.Toast.success('Note file downloaded successfully!', 'Downloaded');
   }
}

window.copySnippetCode = function(buttonEl) {
   const codeBlock = buttonEl.nextElementSibling?.querySelector('code');
   if (codeBlock) {
      navigator.clipboard.writeText(codeBlock.innerText);
      if (window.Toast) {
         window.Toast.success('Code copied to clipboard!', 'Copied');
      } else {
         alert('Code copied!');
      }
   }
};

/**
 * Render HTML or simple Markdown safely
 */
function renderMarkdownOrHTML(content) {
   if (!content) return '<p>No written notes content recorded for this lesson.</p>';

   // If already formatted HTML
   if (content.includes('<h') || content.includes('<p>') || content.includes('<div>') || content.includes('<ul>')) {
      return content;
   }

   let html = escapeHTML(content);
   // Code blocks
   html = html.replace(/```([\s\S]*?)```/g, '<pre style="background:var(--light-bg); padding:1.5rem; border-radius:1rem; overflow-x:auto;"><code>$1</code></pre>');
   // Inline code
   html = html.replace(/`([^`]+)`/g, '<code style="background:var(--light-bg); padding:0.2rem 0.6rem; border-radius:0.4rem; font-family:monospace;">$1</code>');
   // Headers
   html = html.replace(/^### (.*$)/gim, '<h3 style="font-size:2rem; color:var(--main-color); margin:2rem 0 1rem 0;">$1</h3>');
   html = html.replace(/^## (.*$)/gim, '<h2 style="font-size:2.4rem; color:var(--black); margin:2rem 0 1rem 0;">$1</h2>');
   html = html.replace(/^# (.*$)/gim, '<h1 style="font-size:2.8rem; color:var(--black); margin:2rem 0 1rem 0;">$1</h1>');
   // Bold & Italic
   html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
   html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
   // Bullet points
   html = html.replace(/^\- (.*$)/gim, '<li style="margin-bottom:0.6rem;">$1</li>');
   html = html.replace(/(<li[\s\S]*?<\/li>)/gim, '<ul style="margin:1rem 0 1.5rem 2rem;">$1</ul>');
   // Paragraph linebreaks
   html = html.replace(/\n\n/g, '</p><p style="margin-bottom:1.5rem; line-height:1.7;">');

   return `<p style="margin-bottom:1.5rem; line-height:1.7;">${html}</p>`;
}

function escapeHTML(str) {
   if (!str) return '';
   return String(str)
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
         <div class="glass-card" style="padding: 5rem 2rem; text-align: center; max-width: 60rem; margin: 4rem auto; border-left: 5px solid var(--red);">
            <i class="fas fa-triangle-exclamation" style="font-size: 4rem; color: var(--red); margin-bottom: 1.5rem;"></i>
            <h2 style="font-size: 2.4rem;">Course Notes Not Found</h2>
            <p style="font-size: 1.5rem; color: var(--light-color); margin: 1rem 0 2rem 0;">The requested course notes could not be located in the database.</p>
            <a href="courses.html" class="inline-btn">Browse All Courses</a>
         </div>
      `;
   }
}

function renderEmptyNotes(course) {
   const mainContainer = document.querySelector('section');
   if (mainContainer) {
      mainContainer.innerHTML = `
         <div class="glass-card" style="padding: 5rem 2rem; text-align: center; max-width: 60rem; margin: 4rem auto;">
            <i class="fas fa-book-open" style="font-size: 4rem; color: var(--light-color); margin-bottom: 1.5rem;"></i>
            <h2 style="font-size: 2.4rem;">No Notes Available Yet</h2>
            <p style="font-size: 1.5rem; color: var(--light-color); margin: 1rem 0 2rem 0;">The instructor has not uploaded written notes for ${escapeHTML(course.title)}.</p>
            <a href="playlist.html?courseId=${course.id || course._id}" class="inline-btn">Back to Playlist</a>
         </div>
      `;
   }
}
