/**
 * RASH EduHub — Supabase Database Seed Script (v2.0)
 * Seeds the Supabase PostgreSQL database with initial courses, detailed notes, and code challenges.
 *
 * Usage: node seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const { supabase } = require('./supabaseHelper');
const { COURSE_NOTES_DATA } = require('../js/services/notesData');
const bcrypt = require('bcryptjs');

async function seedSupabase() {
   console.log('⏳ Starting Supabase database seeding...');

   try {
      const hashedPassword = await bcrypt.hash('password123', 10);

      // 1. Seed Users
      const sampleUsers = [
         {
            name: 'Harsh Singh',
            email: 'harsh@eduhub.com',
            password: hashedPassword,
            role: 'teacher',
            avatar: 'images/pic-1.jpg',
            title: 'Senior Full-Stack Architect',
            experience: '8+ Years',
            rating: 4.9,
            students_count: 15400,
            courses_count: 4,
            bio: 'Passionate software engineer and educator with expertise in modern Web Tech, React, and Microservices.'
         },
         {
            name: 'SV Sir',
            email: 'sv@eduhub.com',
            password: hashedPassword,
            role: 'teacher',
            avatar: 'images/pic-3.jpg',
            title: 'UI/UX & CSS Specialist',
            experience: '6+ Years',
            rating: 4.8,
            students_count: 11200,
            courses_count: 1,
            bio: 'Crafting beautiful digital experiences and teaching frontend wizardry to thousands worldwide.'
         },
         {
            name: 'Adarsh Sir',
            email: 'adarsh@eduhub.com',
            password: hashedPassword,
            role: 'teacher',
            avatar: 'images/pic-5.jpg',
            title: 'AI & Data Science Instructor',
            experience: '7+ Years',
            rating: 4.9,
            students_count: 18900,
            courses_count: 1,
            bio: 'Machine Learning specialist, AI researcher, and mentor helping students master Python and AI.'
         },
         {
            name: 'Rishi Student',
            email: 'rishi@eduhub.com',
            password: hashedPassword,
            role: 'student',
            avatar: 'images/pic-2.jpg',
            bio: 'Learner at RASH EduHub',
            xp: 350,
            coins: 80,
            streak: 3
         },
         {
            name: 'Admin User',
            email: 'admin@eduhub.com',
            password: hashedPassword,
            role: 'admin',
            avatar: 'images/pic-1.jpg',
            bio: 'RASH EduHub Platform Administrator'
         }
      ];

      for (const u of sampleUsers) {
         const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', u.email)
            .maybeSingle();

         if (!existing) {
            await supabase.from('users').insert([u]);
            console.log(` ✅ Created user: ${u.name} (${u.role})`);
         } else {
            console.log(` ℹ️ User already exists: ${u.email}`);
         }
      }

      // Get teacher Users
      const { data: harshTeacher } = await supabase
         .from('users')
         .select('id, name, avatar, title')
         .eq('email', 'harsh@eduhub.com')
         .single();

      const { data: adarshTeacher } = await supabase
         .from('users')
         .select('id, name, avatar, title')
         .eq('email', 'adarsh@eduhub.com')
         .single();

      const { data: svTeacher } = await supabase
         .from('users')
         .select('id, name, avatar, title')
         .eq('email', 'sv@eduhub.com')
         .single();

      if (harshTeacher) {
         const sampleCourses = [
            {
               title: 'Complete Modern Web Development 2026',
               description: 'Master HTML5, CSS3, JavaScript, Flexbox, CSS Grid, and responsive frontend architecture from scratch with full interactive lecture notes.',
               tutor_name: harshTeacher.name,
               tutor_avatar: harshTeacher.avatar,
               tutor_title: harshTeacher.title,
               tutor_id: harshTeacher.id,
               category: 'Development',
               thumb: 'images/thumb-1.png',
               date: '2026-01-15',
               status: 'active',
               enrolled_count: 8450,
               lessons_count: 3,
               rating: 4.9,
               playlists: [
                  {
                     _id: 'lesson_1',
                     id: 'lesson_1',
                     title: '01. HTML5 Semantic Layouts & Best Practices',
                     description: 'Learn structure and semantic HTML tags.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_1']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c1&lessonId=lesson_1',
                     duration: '14:20',
                     order: 1
                  },
                  {
                     _id: 'lesson_2',
                     id: 'lesson_2',
                     title: '02. Modern CSS3 Flexbox & Glassmorphism Design',
                     description: 'Master flex properties and sleek glass UI.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_2']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c1&lessonId=lesson_2',
                     duration: '22:15',
                     order: 2
                  },
                  {
                     _id: 'lesson_3',
                     id: 'lesson_3',
                     title: '03. JavaScript ES6+ Fundamentals & DOM Manipulation',
                     description: 'Deep dive into JS variables, arrow functions, and DOM events.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_3']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c1&lessonId=lesson_3',
                     duration: '35:40',
                     order: 3
                  }
               ]
            },
            {
               title: 'Advanced React & Next.js Full-Stack Masterclass',
               description: 'Build enterprise-grade full-stack web applications with Next.js, Server Components, and Supabase backend with complete notes.',
               tutor_name: harshTeacher.name,
               tutor_avatar: harshTeacher.avatar,
               tutor_title: harshTeacher.title,
               tutor_id: harshTeacher.id,
               category: 'Development',
               thumb: 'images/thumb-2.png',
               date: '2026-02-01',
               status: 'active',
               enrolled_count: 6200,
               lessons_count: 2,
               rating: 4.8,
               playlists: [
                  {
                     _id: 'lesson_101',
                     id: 'lesson_101',
                     title: '01. Next.js 14 App Router Architecture',
                     description: 'Understanding Server vs Client Components.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_101']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c2&lessonId=lesson_101',
                     duration: '28:10',
                     order: 1
                  },
                  {
                     _id: 'lesson_102',
                     id: 'lesson_102',
                     title: '02. Supabase Authentication & Database Integration',
                     description: 'Hooking up Supabase OAuth and Row Level Security.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_102']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c2&lessonId=lesson_102',
                     duration: '40:00',
                     order: 2
                  }
               ]
            },
            {
               title: 'Data Structures & Algorithms in Java & C++',
               description: 'Master Big O notation, Arrays, Linked Lists, Trees, and Graph Traversals (BFS/DFS) with detailed algorithmic notes.',
               tutor_name: harshTeacher.name,
               tutor_avatar: harshTeacher.avatar,
               tutor_title: harshTeacher.title,
               tutor_id: harshTeacher.id,
               category: 'DSA',
               thumb: 'images/thumb-3.png',
               date: '2026-01-10',
               status: 'active',
               enrolled_count: 9800,
               lessons_count: 3,
               rating: 4.9,
               playlists: [
                  {
                     _id: 'lesson_201',
                     id: 'lesson_201',
                     title: '01. Arrays, String Manipulation & Dynamic Memory',
                     description: 'Big O analysis, two pointer technique, and memory management.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_201']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c3&lessonId=lesson_201',
                     duration: '25:30',
                     order: 1
                  },
                  {
                     _id: 'lesson_202',
                     id: 'lesson_202',
                     title: '02. Linked Lists, Stacks & Queue Data Structures',
                     description: 'Node pointers, LIFO Stacks, and FIFO Queues.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_202']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c3&lessonId=lesson_202',
                     duration: '31:15',
                     order: 2
                  },
                  {
                     _id: 'lesson_203',
                     id: 'lesson_203',
                     title: '03. Binary Search Trees & Graph Traversal (BFS & DFS)',
                     description: 'BST invariants, Tree traversals, BFS and DFS algorithms.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_203']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c3&lessonId=lesson_203',
                     duration: '42:00',
                     order: 3
                  }
               ]
            },
            {
               title: 'Python Data Science & Machine Learning Bootcamp',
               description: 'Complete hands-on Python data science course with NumPy, Pandas, Scikit-Learn machine learning pipelines and lecture notes.',
               tutor_name: adarshTeacher ? adarshTeacher.name : harshTeacher.name,
               tutor_avatar: adarshTeacher ? adarshTeacher.avatar : harshTeacher.avatar,
               tutor_title: adarshTeacher ? adarshTeacher.title : harshTeacher.title,
               tutor_id: adarshTeacher ? adarshTeacher.id : harshTeacher.id,
               category: 'Python',
               thumb: 'images/thumb-4.png',
               date: '2026-01-22',
               status: 'active',
               enrolled_count: 11400,
               lessons_count: 3,
               rating: 4.9,
               playlists: [
                  {
                     _id: 'lesson_301',
                     id: 'lesson_301',
                     title: '01. Python Fundamentals & Data Structures',
                     description: 'Lists, Tuples, Dicts, List Comprehensions, and OOP in Python.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_301']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c4&lessonId=lesson_301',
                     duration: '20:10',
                     order: 1
                  },
                  {
                     _id: 'lesson_302',
                     id: 'lesson_302',
                     title: '02. NumPy & Pandas for Data Manipulation',
                     description: 'Array vectorization, DataFrame filtering, GroupBy and Aggregations.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_302']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c4&lessonId=lesson_302',
                     duration: '34:20',
                     order: 2
                  },
                  {
                     _id: 'lesson_303',
                     id: 'lesson_303',
                     title: '03. Scikit-Learn Machine Learning Models',
                     description: 'Supervised Learning, Random Forests, train-test splits, and evaluation metrics.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_303']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c4&lessonId=lesson_303',
                     duration: '45:00',
                     order: 3
                  }
               ]
            },
            {
               title: 'UI/UX Design Masterclass & Glassmorphism Systems',
               description: 'Learn modern visual hierarchy, typography design tokens, Figma prototyping, and glassmorphism styling.',
               tutor_name: svTeacher ? svTeacher.name : harshTeacher.name,
               tutor_avatar: svTeacher ? svTeacher.avatar : harshTeacher.avatar,
               tutor_title: svTeacher ? svTeacher.title : harshTeacher.title,
               tutor_id: svTeacher ? svTeacher.id : harshTeacher.id,
               category: 'Design',
               thumb: 'images/thumb-5.png',
               date: '2026-02-10',
               status: 'active',
               enrolled_count: 5300,
               lessons_count: 2,
               rating: 4.8,
               playlists: [
                  {
                     _id: 'lesson_401',
                     id: 'lesson_401',
                     title: '01. Visual Hierarchy, Typography & Design Tokens',
                     description: 'Design principles, typography pairing, and CSS design tokens.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_401']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c5&lessonId=lesson_401',
                     duration: '18:45',
                     order: 1
                  },
                  {
                     _id: 'lesson_402',
                     id: 'lesson_402',
                     title: '02. Figma Prototyping & Modern Glassmorphism',
                     description: 'Figma Auto Layout 5.0 and Glassmorphism CSS design system.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_402']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c5&lessonId=lesson_402',
                     duration: '26:30',
                     order: 2
                  }
               ]
            },
            {
               title: 'Full-Stack Node.js, Express & PostgreSQL Database Architecture',
               description: 'Build robust REST APIs with Express.js middleware, security headers, PostgreSQL schema design, and Supabase pooling.',
               tutor_name: harshTeacher.name,
               tutor_avatar: harshTeacher.avatar,
               tutor_title: harshTeacher.title,
               tutor_id: harshTeacher.id,
               category: 'Development',
               thumb: 'images/thumb-6.png',
               date: '2026-02-15',
               status: 'active',
               enrolled_count: 7600,
               lessons_count: 2,
               rating: 4.9,
               playlists: [
                  {
                     _id: 'lesson_501',
                     id: 'lesson_501',
                     title: '01. Express REST API Design & Middleware',
                     description: 'Routing, middleware pipelines, JWT auth guards, and error handling.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_501']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c6&lessonId=lesson_501',
                     duration: '29:40',
                     order: 1
                  },
                  {
                     _id: 'lesson_502',
                     id: 'lesson_502',
                     title: '02. PostgreSQL Schema, Queries & Supabase Integration',
                     description: 'Relational DB design, foreign keys, SQL JOINs, and Supabase integration.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     notes: COURSE_NOTES_DATA['lesson_502']?.content || '',
                     pdfAttachment: 'notes.html?courseId=c6&lessonId=lesson_502',
                     duration: '37:15',
                     order: 2
                  }
               ]
            }
         ];

         for (const c of sampleCourses) {
            const { data: existingCourse } = await supabase
               .from('courses')
               .select('id')
               .eq('title', c.title)
               .maybeSingle();

            if (!existingCourse) {
               await supabase.from('courses').insert([c]);
               console.log(` ✅ Created course: ${c.title}`);
            } else {
               // Update existing course to ensure latest playlists & notes are populated
               await supabase.from('courses').update({ playlists: c.playlists, videos: c.playlists, description: c.description }).eq('id', existingCourse.id);
               console.log(` 🔄 Updated course notes & lessons: ${c.title}`);
            }
         }
      }

      // Seed 5 Standard Code Arena DSA Challenges
      const { CODE_CHALLENGES_SEED } = require('./codeChallengesSeed');

      for (const ch of CODE_CHALLENGES_SEED) {
         const combinedTestCases = [
            ...(ch.sample_test_cases || []).map(t => ({ input: t.input, output: t.output, isHidden: false })),
            ...(ch.hidden_test_cases || []).map(t => ({ input: t.input, output: t.output, isHidden: true }))
         ];

         const challengeRecord = {
            title: `[${ch.id}] ${ch.title}`,
            difficulty: ch.difficulty || 'Easy',
            category: ch.category || 'Algorithms',
            description: ch.description,
            constraints: ch.constraints || [],
            languages: ch.supported_languages || ['python', 'java', 'cpp', 'javascript'],
            starter_code: {},
            test_cases: combinedTestCases
         };

         const { data: existingList } = await supabase
            .from('code_challenges')
            .select('id, title')
            .ilike('title', `%${ch.id}%`);

         if (!existingList || existingList.length === 0) {
            await supabase.from('code_challenges').insert([challengeRecord]);
            console.log(` ✅ Created Code Arena challenge: [${ch.id}] ${ch.title}`);
         } else {
            await supabase.from('code_challenges').update(challengeRecord).eq('id', existingList[0].id);
            console.log(` 🔄 Updated Code Arena challenge: [${ch.id}] ${ch.title}`);
         }
      }

      console.log('🎉 Supabase database seeding complete!');
   } catch (err) {
      console.error('❌ Seeding error:', err.message);
   }
}

if (require.main === module) {
   seedSupabase().then(() => process.exit(0));
}

module.exports = seedSupabase;
