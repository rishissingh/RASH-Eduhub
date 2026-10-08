/**
 * User Routes — Profile, Student Stats, Teacher Stats, Teachers List & Teacher Reviews
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatUser, formatCourse, formatReview } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');

// GET /api/users/teachers — List all teachers (public)
router.get('/teachers', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('users')
         .select('*')
         .eq('role', 'teacher');

      if (error) throw error;

      const teachers = (data || []).map(formatUser).map(u => {
         delete u.password;
         return u;
      });

      res.json({ success: true, count: teachers.length, teachers });
   } catch (err) {
      next(err);
   }
});

// GET /api/users/teachers/:id/reviews — Get overall reviews for courses taught by teacher
router.get('/teachers/:id/reviews', async (req, res, next) => {
   try {
      const teacherId = req.params.id;
      const { data: courses } = await supabase
         .from('courses')
         .select('id')
         .eq('tutor_id', teacherId);

      const courseIds = (courses || []).map(c => c.id);

      if (courseIds.length === 0) {
         return res.json({ success: true, count: 0, reviews: [] });
      }

      const { data: reviewsData, error } = await supabase
         .from('reviews')
         .select('*')
         .in('course_id', courseIds)
         .order('created_at', { ascending: false });

      if (error) throw error;

      const reviews = (reviewsData || []).map(formatReview);
      res.json({ success: true, count: reviews.length, reviews });
   } catch (err) {
      next(err);
   }
});

// GET /api/users/student/stats — Student learning stats
router.get('/student/stats', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const enrolledIds = user.enrolledCourses || [];

      let enrolledCourses = [];
      if (enrolledIds.length > 0) {
         const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .in('id', enrolledIds);
         enrolledCourses = (coursesData || []).map(formatCourse);
      }

      let totalLessons = 0;
      const completedLessons = user.completedLessons ? user.completedLessons.length : 0;

      enrolledCourses.forEach(c => {
         totalLessons += (c.playlist ? c.playlist.length : 0);
      });

      const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      res.json({
         success: true,
         stats: {
            enrolledCount: enrolledCourses.length,
            bookmarksCount: user.bookmarks ? user.bookmarks.length : 0,
            completedLessons,
            totalLessons,
            overallProgress,
            certificatesCount: Math.floor(completedLessons / 4),
            enrolledCourses
         }
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/users/teacher/stats — Teacher analytics
router.get('/teacher/stats', protect, async (req, res, next) => {
   try {
      const { data: teacherCoursesData } = await supabase
         .from('courses')
         .select('*')
         .eq('tutor_id', req.user.id);

      const teacherCourses = (teacherCoursesData || []).map(formatCourse);

      let totalStudents = 0;
      let totalLessons = 0;

      teacherCourses.forEach(c => {
         totalStudents += c.studentsCount || 0;
         totalLessons += c.playlist ? c.playlist.length : 0;
      });

      const totalRevenue = totalStudents * 49;

      res.json({
         success: true,
         stats: {
            coursesCount: teacherCourses.length,
            totalStudents,
            totalLessons,
            totalRevenue: `$${totalRevenue.toLocaleString()}`,
            courses: teacherCourses
         }
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/users/:id — Get user profile by ID
router.get('/:id', async (req, res, next) => {
   try {
      const { data: rawUser } = await supabase
         .from('users')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!rawUser) {
         return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const user = formatUser(rawUser);
      delete user.password;

      res.json({ success: true, user });
   } catch (err) {
      next(err);
   }
});

// PUT /api/users/profile — Update current user profile
router.put('/profile', protect, async (req, res, next) => {
   try {
      const allowedFields = ['name', 'email', 'bio', 'avatar', 'title', 'experience'];
      const updates = {};

      for (const field of allowedFields) {
         if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
         }
      }

      // Check email uniqueness if email is being updated
      if (updates.email && updates.email.toLowerCase() !== req.user.email.toLowerCase()) {
         const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', updates.email.toLowerCase())
            .maybeSingle();

         if (existing && existing.id !== req.user.id) {
            return res.status(400).json({ success: false, message: 'Email address is already in use.' });
         }
         updates.email = updates.email.toLowerCase();
      }

      updates.updated_at = new Date().toISOString();

      const { data: updatedRaw, error } = await supabase
         .from('users')
         .update(updates)
         .eq('id', req.user.id)
         .select()
         .single();

      if (error || !updatedRaw) throw error || new Error('Failed to update profile');

      const user = formatUser(updatedRaw);
      delete user.password;

      res.json({ success: true, user });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
