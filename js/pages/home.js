/**
 * RASH EduHub - Home Page Controller
 * Handles dynamic rendering of featured courses, counter animations, FAQ accordions, and hero CTA interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
   if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 800, once: true, offset: 50 });
   }
   renderFeaturedCourses();
   renderTopTeachers();
   initCounters();
   initFAQ();
   initInteractiveTerminal();
});

/**
 * Render Top 3 Featured Courses dynamically from CourseService
 */
async function renderFeaturedCourses() {
   const container = document.querySelector('#featured-courses-container');
   if (!container) return;

   const courses = (await CourseService.getAllCourses()).slice(0, 3);

   if (courses.length === 0) {
      container.innerHTML = '<p class="empty-text">No courses available right now.</p>';
      return;
   }

   const formatDate = (dateStr) => {
      if (!dateStr) return '';
      try {
         const d = new Date(dateStr);
         if (isNaN(d.getTime())) return dateStr;
         return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {
         return dateStr;
      }
   };

   container.innerHTML = courses.map(c => `
      <div class="box glass-card card-interactive" data-aos="fade-up" style="border-radius: 2rem; overflow: hidden; padding: 2.2rem;">
         <div class="thumb" style="border-radius: 1.4rem; overflow: hidden; margin-bottom: 1.5rem; position: relative;">
            <img src="${c.thumbnail}" alt="${c.title}" style="transition: transform 0.4s ease; width: 100%; height: 18rem; object-fit: cover;">
            <span class="lesson-badge">
               <i class="fas fa-play-circle" style="color: #38bdf8;"></i> ${c.lessonsCount} lessons
            </span>
         </div>
         <div class="tutor" style="display: flex; align-items: center; gap: 1.2rem; margin-bottom: 1.2rem;">
            <img src="${c.teacherAvatar}" alt="${c.teacherName}" style="width: 3.8rem; height: 3.8rem; border-radius: 50%; object-fit: cover; border: 2px solid var(--main-color);">
            <div class="info">
               <h3 style="font-size: 1.45rem; font-weight: 700; color: var(--black); margin: 0;">${c.teacherName}</h3>
               <span style="font-size: 1.2rem; color: var(--light-color);">${formatDate(c.updatedAt)}</span>
            </div>
         </div>
         <h3 class="title" style="font-size: 1.8rem; font-weight: 700; line-height: 1.35; margin-bottom: 1.4rem; color: var(--black);">${c.title}</h3>
         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.8rem; padding-top: 1rem; border-top: 1px solid rgba(226, 232, 240, 0.7);">
            <span class="badge" style="background: rgba(37, 99, 235, 0.08); color: var(--main-color); border: 1px solid rgba(37, 99, 235, 0.18); border-radius: var(--radius-pill); font-weight: 700; padding: 0.4rem 1.2rem;">${c.category}</span>
            <span style="font-size: 1.8rem; font-weight: 800; color: var(--main-color);">${c.price}</span>
         </div>
         <a href="courses.html?id=${c.id}" class="btn btn-hero-primary btn-shimmer" style="width: 100%; text-align: center; justify-content: center; border-radius: var(--radius-pill); font-weight: 700; padding: 1.2rem 2rem;">
            Start Learning <i class="fas fa-arrow-right"></i>
         </a>
      </div>
   `).join('');
}

/**
 * Render Top Teachers dynamically
 */
function renderTopTeachers() {
   const container = document.querySelector('#top-teachers-container');
   if (!container) return;

   const teachers = [
      {
         name: 'Harsh Singh',
         role: 'Senior Web Architect',
         experience: '8+ Yrs Exp',
         rating: 4.9,
         avatar: 'images/pic-1.jpg',
         courses: 6
      },
      {
         name: 'SV Sir',
         role: 'UI/UX & CSS Guru',
         experience: '6+ Yrs Exp',
         rating: 4.8,
         avatar: 'images/pic-3.jpg',
         courses: 4
      },
      {
         name: 'Rashmi Patel',
         role: 'Python & AI Specialist',
         experience: '5+ Yrs Exp',
         rating: 4.9,
         avatar: 'images/pic-5.jpg',
         courses: 5
      }
   ];

   container.innerHTML = teachers.map(t => `
      <div class="box glass-card card-interactive" data-aos="fade-up" style="border-radius: 2rem; padding: 2.5rem; text-align: center;">
         <div style="position: relative; display: inline-block; margin-bottom: 1.5rem;">
            <img src="${t.avatar}" alt="${t.name}" style="width: 9rem; height: 9rem; border-radius: 50%; object-fit: cover; border: 3px solid var(--main-color); box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);">
            <span style="position: absolute; bottom: 0; right: 0; background: var(--main-gradient); color: #fff; width: 2.8rem; height: 2.8rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: 2px solid #fff;">
               <i class="fas fa-check"></i>
            </span>
         </div>
         <h3 style="font-size: 1.9rem; font-weight: 800; color: var(--black); margin-bottom: 0.5rem;">${t.name}</h3>
         <p style="font-size: 1.35rem; color: var(--main-color); font-weight: 600; margin-bottom: 1.2rem;">${t.role}</p>
         <div style="display: flex; justify-content: center; gap: 1.5rem; font-size: 1.3rem; color: var(--light-color); margin-bottom: 1.8rem; padding: 1rem 0; border-top: 1px solid rgba(226, 232, 240, 0.7); border-bottom: 1px solid rgba(226, 232, 240, 0.7);">
            <span><i class="fas fa-briefcase" style="color: var(--accent-color);"></i> ${t.experience}</span>
            <span><i class="fas fa-star" style="color: #f59e0b;"></i> ${t.rating}</span>
            <span><i class="fas fa-book" style="color: var(--main-color);"></i> ${t.courses} Courses</span>
         </div>
         <a href="teachers.html" class="btn btn-hero-glass" style="width: 100%; border-radius: var(--radius-pill); font-weight: 600; padding: 1rem;">View Profile</a>
      </div>
   `).join('');
}

/**
 * Animated number counter for statistics section
 */
function initCounters() {
   const counters = document.querySelectorAll('.stat-number');
   if (counters.length === 0) return;

   const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
         if (entry.isIntersecting) {
            const counter = entry.target;
            const target = +counter.getAttribute('data-target');
            let count = 0;
            const speed = target / 50;

            const updateCount = () => {
               count += speed;
               if (count < target) {
                  counter.innerText = Math.ceil(count).toLocaleString();
                  setTimeout(updateCount, 30);
               } else {
                  counter.innerText = target.toLocaleString();
               }
            };
            updateCount();
            observer.unobserve(counter);
         }
      });
   }, { threshold: 0.5 });

   counters.forEach(c => observer.observe(c));
}

/**
 * Interactive FAQ Accordion
 */
function initFAQ() {
   const faqBoxes = document.querySelectorAll('.faq-box');
   faqBoxes.forEach(box => {
      const question = box.querySelector('.faq-question');
      const answer = box.querySelector('.faq-answer');
      if (question && answer) {
         question.addEventListener('click', () => {
            const isOpen = answer.style.display === 'block';
            answer.style.display = isOpen ? 'none' : 'block';
            const icon = question.querySelector('i');
            if (icon) {
               icon.classList.toggle('fa-chevron-down', isOpen);
               icon.classList.toggle('fa-chevron-up', !isOpen);
            }
         });
      }
   });
}

/**
 * Interactive Hero Sandbox Terminal
 */
function initInteractiveTerminal() {
   const tabs = document.querySelectorAll('.terminal-tab-btn');
   const codeDisplay = document.getElementById('terminal-code-display');
   const runBtn = document.getElementById('terminal-run-btn');
   const statusText = document.getElementById('terminal-status-text');
   const statusIcon = document.getElementById('terminal-status-icon');
   const statusMetrics = document.getElementById('terminal-status-metrics');

   if (!tabs.length || !codeDisplay) return;

   const snippets = {
      python: {
         code: [
            { num: 1, text: '<span class="tok-comment"># RASH EduHub Intelligent Skill Gap Analyzer</span>' },
            { num: 2, text: '<span class="tok-kw">def</span> <span class="tok-fn">build_learning_path</span>(student_skills, target_role):' },
            { num: 3, text: '&nbsp;&nbsp;&nbsp;&nbsp;gaps = <span class="tok-fn">evaluate_competency</span>(student_skills)' },
            { num: 4, text: '&nbsp;&nbsp;&nbsp;&nbsp;recommendations = <span class="tok-fn">rank_modules</span>(gaps, level=<span class="tok-str">"Mastery"</span>)' },
            { num: 5, text: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-kw">return</span> { <span class="tok-str">"accuracy"</span>: <span class="tok-num">0.994</span>, <span class="tok-str">"plan"</span>: recommendations }' }
         ],
         testPassed: 'All 14 Automated Tests Passed · 22ms',
         metrics: 'Memory: 14.2 MB · Score: 100%'
      },
      react: {
         code: [
            { num: 1, text: '<span class="tok-comment">// Real-time Collaborative Code Arena Stream</span>' },
            { num: 2, text: '<span class="tok-kw">export function</span> <span class="tok-fn">CodeArena</span>({ roomId, studentId }: <span class="tok-fn">ArenaProps</span>) {' },
            { num: 3, text: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-kw">const</span> { session, syncCode } = <span class="tok-fn">usePeerEngine</span>(roomId);' },
            { num: 4, text: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-kw">const</span> [metrics] = <span class="tok-fn">useAIEvaluator</span>(studentId);' },
            { num: 5, text: '&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-kw">return</span> &lt;<span class="tok-fn">Sandbox</span> runtime=<span class="tok-str">"wasm"</span> onPass={() =&gt; <span class="tok-fn">awardXP</span>(<span class="tok-num">150</span>)} /&gt;;' }
         ],
         testPassed: 'Component Virtual DOM Synced · 16ms',
         metrics: 'Render: 60 FPS · State: Pristine'
      },
      sql: {
         code: [
            { num: 1, text: '<span class="tok-comment">-- Dynamic Skill Mastery Percentile Ranker</span>' },
            { num: 2, text: '<span class="tok-kw">SELECT</span> student_id, <span class="tok-fn">DENSE_RANK</span>() <span class="tok-kw">OVER</span> (' },
            { num: 3, text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-kw">ORDER BY</span> xp_points <span class="tok-kw">DESC</span>) <span class="tok-kw">AS</span> global_rank,' },
            { num: 4, text: '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="tok-fn">ROUND</span>(<span class="tok-fn">AVG</span>(code_score), <span class="tok-num">2</span>) <span class="tok-kw">AS</span> mastery_rating' },
            { num: 5, text: '<span class="tok-kw">FROM</span> student_submissions <span class="tok-kw">WHERE</span> cohort = <span class="tok-num">2026</span> <span class="tok-kw">GROUP BY</span> student_id;' }
         ],
         testPassed: 'Query Plan Optimized (Index Scan) · 9ms',
         metrics: 'Cost: 0.04 · Rows Scanned: 25,400'
      }
   };

   let currentTab = 'python';

   function renderCode(tabKey) {
      currentTab = tabKey;
      const snippet = snippets[tabKey];
      if (!snippet) return;

      codeDisplay.innerHTML = snippet.code.map(line => `
         <div class="code-line">
            <span class="code-num">${line.num}</span>
            <span>${line.text}</span>
         </div>
      `).join('');

      if (statusText) statusText.innerText = snippet.testPassed;
      if (statusMetrics) statusMetrics.innerText = snippet.metrics;
      if (statusIcon) {
         statusIcon.className = 'fas fa-circle-check';
         statusIcon.style.color = '#10b981';
      }
   }

   tabs.forEach(tab => {
      tab.addEventListener('click', () => {
         tabs.forEach(t => t.classList.remove('active'));
         tab.classList.add('active');
         renderCode(tab.dataset.tab);
      });
   });

   if (runBtn) {
      runBtn.addEventListener('click', () => {
         const originalHTML = runBtn.innerHTML;
         runBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Running...';
         runBtn.disabled = true;

         if (statusIcon) {
            statusIcon.className = 'fas fa-spinner fa-spin';
            statusIcon.style.color = '#38bdf8';
         }
         if (statusText) statusText.innerText = 'Compiling sandbox in WebAssembly container...';
         if (statusMetrics) statusMetrics.innerText = 'Analyzing AST syntax & memory...';

         setTimeout(() => {
            runBtn.innerHTML = '<i class="fas fa-check"></i> Passed';
            runBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';

            const activeSnippet = snippets[currentTab];
            if (statusIcon) {
               statusIcon.className = 'fas fa-circle-check';
               statusIcon.style.color = '#10b981';
            }
            if (statusText) statusText.innerText = '✔ ' + activeSnippet.testPassed;
            if (statusMetrics) statusMetrics.innerText = activeSnippet.metrics + ' · Status: 200 OK';

            setTimeout(() => {
               runBtn.innerHTML = originalHTML;
               runBtn.disabled = false;
            }, 1800);
         }, 550);
      });
   }
}
