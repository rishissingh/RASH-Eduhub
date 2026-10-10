/**
 * Instructors Routes — List Instructors, View Instructor Details & Published Courses
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatUser, formatCourse } = require('../supabaseHelper');

/**
 * GET /api/instructors — List eligible active instructors with at least one published course
 */
router.get('/', async (req, res, next) => {
   try {
      // 1. Fetch all teachers
      const { data: teachers, error: teachersErr } = await supabase
         .from('users')
         .select('id, name, email, avatar, title, experience, bio, rating, students_count, courses_count')
         .eq('role', 'teacher');

      if (teachersErr) throw teachersErr;

      // 2. Fetch all published courses to calculate verified course counts per instructor
      const { data: courses, error: coursesErr } = await supabase
         .from('courses')
         .select('id, teacher_id, students_count, rating');

      if (coursesErr) throw coursesErr;

      const courseCountMap = {};
      const studentCountMap = {};
      const ratingsMap = {};

      (courses || []).forEach(c => {
         const tId = c.teacher_id;
         if (tId) {
            courseCountMap[tId] = (courseCountMap[tId] || 0) + 1;
            studentCountMap[tId] = (studentCountMap[tId] || 0) + (Number(c.students_count) || 0);
            if (!ratingsMap[tId]) ratingsMap[tId] = [];
            if (c.rating) ratingsMap[tId].push(Number(c.rating));
         }
      });

      // 3. Format and filter only instructors with at least 1 published course
      const instructors = (teachers || [])
         .map(t => {
            const publishedCount = courseCountMap[t.id] || 0;
            const computedStudents = studentCountMap[t.id] || t.students_count || 0;
            const avgRating = ratingsMap[t.id]?.length
               ? (ratingsMap[t.id].reduce((a, b) => a + b, 0) / ratingsMap[t.id].length).toFixed(1)
               : (t.rating || 4.9);

            return {
               id: t.id,
               _id: t.id,
               name: t.name,
               email: t.email,
               avatar: t.avatar || 'images/pic-1.jpg',
               title: t.title || 'Course Instructor',
               specialization: t.title || 'Course Instructor',
               experience: t.experience || '',
               bio: t.bio || 'Verified course instructor providing structured lectures and study notes on RASH EduHub.',
               rating: Number(avgRating),
               studentsCount: computedStudents,
               coursesCount: publishedCount
            };
         })
         .filter(t => t.coursesCount > 0)
         .sort((a, b) => b.coursesCount - a.coursesCount);

      res.json({
         success: true,
         count: instructors.length,
         instructors
      });
   } catch (err) {
      next(err);
   }
});

/**
 * GET /api/instructors/:id — Get instructor profile and statistics
 */
router.get('/:id', async (req, res, next) => {
   try {
      const instructorId = req.params.id;

      const { data: teacher, error: teacherErr } = await supabase
         .from('users')
         .select('id, name, email, avatar, title, experience, bio, rating, students_count, courses_count')
         .eq('id', instructorId)
         .eq('role', 'teacher')
         .maybeSingle();

      if (teacherErr || !teacher) {
         return res.status(404).json({ success: false, message: 'Instructor not found.' });
      }

      // Fetch published courses for this instructor
      const { data: courses, error: coursesErr } = await supabase
         .from('courses')
         .select('*, lessons(*)')
         .eq('teacher_id', instructorId)
         .order('created_at', { ascending: false });

      if (coursesErr) throw coursesErr;

      const formattedCourses = (courses || []).map(formatCourse);
      const totalStudents = formattedCourses.reduce((acc, c) => acc + (c.studentsCount || 0), 0);

      const instructor = {
         id: teacher.id,
         _id: teacher.id,
         name: teacher.name,
         email: teacher.email,
         avatar: teacher.avatar || 'images/pic-1.jpg',
         title: teacher.title || 'Course Instructor',
         specialization: teacher.title || 'Course Instructor',
         experience: teacher.experience || '',
         bio: teacher.bio || 'Experienced software mentor dedicated to practical tech education.',
         rating: Number(teacher.rating) || 4.9,
         studentsCount: totalStudents || teacher.students_count || 0,
         coursesCount: formattedCourses.length,
         courses: formattedCourses
      };

      res.json({
         success: true,
         instructor
      });
   } catch (err) {
      next(err);
   }
});

/**
 * GET /api/instructors/:id/courses — List published courses for a specific instructor
 */
router.get('/:id/courses', async (req, res, next) => {
   try {
      const instructorId = req.params.id;

      // 1. Verify instructor
      const { data: teacher } = await supabase
         .from('users')
         .select('id, name, avatar, title, experience, bio')
         .eq('id', instructorId)
         .maybeSingle();

      // 2. Query published courses with lessons
      const { data: coursesRaw, error: coursesErr } = await supabase
         .from('courses')
         .select('*, lessons(*)')
         .eq('teacher_id', instructorId)
         .order('created_at', { ascending: false });

      if (coursesErr) throw coursesErr;

      const courses = (coursesRaw || []).map(formatCourse);

      res.json({
         success: true,
         count: courses.length,
         instructor: teacher ? {
            id: teacher.id,
            name: teacher.name,
            avatar: teacher.avatar || 'images/pic-1.jpg',
            title: teacher.title || 'Course Instructor',
            experience: teacher.experience || '',
            bio: teacher.bio || ''
         } : null,
         courses
      });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
