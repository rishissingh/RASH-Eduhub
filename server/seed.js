/**
 * RASH EduHub — Supabase Database Seed Script (v2.0)
 * Seeds the Supabase PostgreSQL database with initial data.
 *
 * Usage: node seed.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const { supabase } = require('./supabaseHelper');
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
            courses_count: 2,
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
            courses_count: 2,
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

      // Get teacher ID for courses
      const { data: teacherUser } = await supabase
         .from('users')
         .select('id, name, avatar, title')
         .eq('email', 'harsh@eduhub.com')
         .single();

      if (teacherUser) {
         const sampleCourses = [
            {
               title: 'Complete Modern Web Development 2026',
               description: 'Master HTML5, CSS3, JavaScript, Flexbox, CSS Grid, and responsive frontend architecture from scratch.',
               tutor_name: teacherUser.name,
               tutor_avatar: teacherUser.avatar,
               tutor_title: teacherUser.title,
               tutor_id: teacherUser.id,
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
                     title: '01. HTML5 Semantic Layouts & Best Practices',
                     description: 'Learn structure and semantic HTML tags.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     duration: '14:20',
                     order: 1
                  },
                  {
                     _id: 'lesson_2',
                     title: '02. Modern CSS3 Flexbox & Glassmorphism Design',
                     description: 'Master flex properties and sleek glass UI.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     duration: '22:15',
                     order: 2
                  },
                  {
                     _id: 'lesson_3',
                     title: '03. JavaScript ES6+ Fundamentals & DOM Manipulation',
                     description: 'Deep dive into JS variables, arrow functions, and DOM events.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     duration: '35:40',
                     order: 3
                  }
               ]
            },
            {
               title: 'Advanced React & Next.js Full-Stack Masterclass',
               description: 'Build enterprise-grade full-stack web applications with Next.js, Server Components, and Supabase backend.',
               tutor_name: teacherUser.name,
               tutor_avatar: teacherUser.avatar,
               tutor_title: teacherUser.title,
               tutor_id: teacherUser.id,
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
                     title: '01. Next.js 14 App Router Architecture',
                     description: 'Understanding Server vs Client Components.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     duration: '28:10',
                     order: 1
                  },
                  {
                     _id: 'lesson_102',
                     title: '02. Supabase Authentication & Database Integration',
                     description: 'Hooking up Supabase OAuth and Row Level Security.',
                     video: 'https://vjs.zencdn.net/v/oceans.mp4',
                     duration: '40:00',
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
            }
         }
      }

      // Seed Code Challenges
      const sampleChallenges = [
         {
            title: 'Two Sum Problem',
            description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.',
            difficulty: 'Easy',
            category: 'Algorithms',
            starter_code: 'function twoSum(nums, target) {\n   // Write your code here\n}',
            test_cases: [
               { input: '[2, 7, 11, 15], target = 9', expected: '[0, 1]', isHidden: false },
               { input: '[3, 2, 4], target = 6', expected: '[1, 2]', isHidden: false },
               { input: '[3, 3], target = 6', expected: '[0, 1]', isHidden: true }
            ],
            points: 50
         },
         {
            title: 'Reverse a String',
            description: 'Write a function that reverses a given string in-place or returns a reversed string.',
            difficulty: 'Easy',
            category: 'Strings',
            starter_code: 'function reverseString(str) {\n   return str.split("").reverse().join("");\n}',
            test_cases: [
               { input: '"hello"', expected: '"olleh"', isHidden: false },
               { input: '"EduHub"', expected: '"buhUdE"', isHidden: false }
            ],
            points: 40
         }
      ];

      for (const ch of sampleChallenges) {
         const { data: existingCh } = await supabase
            .from('code_challenges')
            .select('id')
            .eq('title', ch.title)
            .maybeSingle();

         if (!existingCh) {
            await supabase.from('code_challenges').insert([ch]);
            console.log(` ✅ Created code challenge: ${ch.title}`);
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
