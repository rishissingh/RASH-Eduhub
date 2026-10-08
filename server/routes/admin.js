/**
 * Admin Routes — Platform Overview, User Management, Course Moderation, System Analytics
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatUser, formatCourse, formatContactMessage, formatActivityLog, formatReview } = require('../supabaseHelper');
const { protect, authorize } = require('../middleware/auth');

// Apply admin protection to all routes in this file
router.use(protect, authorize('admin'));

// GET /api/admin/stats — Overall platform metrics
router.get('/stats', async (req, res, next) => {
   try {
      const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true });
      const { count: studentsCount } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student');
      const { count: teachersCount } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher');
      const { count: adminsCount } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'admin');

      const { count: totalCourses } = await supabase.from('courses').select('id', { count: 'exact', head: true });
      const { count: totalSubmissions } = await supabase.from('submissions').select('id', { count: 'exact', head: true });
      const { count: totalContactMsgs } = await supabase.from('contact_messages').select('id', { count: 'exact', head: true });
      const { count: totalReviews } = await supabase.from('reviews').select('id', { count: 'exact', head: true });

      const { data: coursesData } = await supabase.from('courses').select('enrolled_count');
      let totalEnrolled = 0;
      (coursesData || []).forEach(c => {
         totalEnrolled += (c.enrolled_count || 0);
      });

      const { data: recentSignupsRaw } = await supabase
         .from('users')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(5);

      const recentSignups = (recentSignupsRaw || []).map(formatUser).map(u => {
         delete u.password;
         return u;
      });

      res.json({
         success: true,
         stats: {
            users: {
               total: totalUsers || 0,
               students: studentsCount || 0,
               teachers: teachersCount || 0,
               admins: adminsCount || 0
            },
            courses: {
               total: totalCourses || 0,
               totalEnrollments: totalEnrolled
            },
            submissions: totalSubmissions || 0,
            contactMessages: totalContactMsgs || 0,
            reviews: totalReviews || 0,
            platformUptime: '99.9%'
         },
         recentSignups
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/admin/users — List all users with search & role filter
router.get('/users', async (req, res, next) => {
   try {
      const { role, query } = req.query;
      let reqQuery = supabase.from('users').select('*');

      if (role && role !== 'All') {
         reqQuery = reqQuery.eq('role', role.toLowerCase());
      }

      if (query) {
         reqQuery = reqQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
      }

      const { data, error } = await reqQuery.order('created_at', { ascending: false });
      if (error) throw error;

      const users = (data || []).map(formatUser).map(u => {
         delete u.password;
         return u;
      });

      res.json({ success: true, count: users.length, users });
   } catch (err) {
      next(err);
   }
});

// PUT /api/admin/users/:id/role — Update user role
router.put('/users/:id/role', async (req, res, next) => {
   try {
      const { role } = req.body;
      if (!['student', 'teacher', 'admin'].includes(role)) {
         return res.status(400).json({ success: false, message: 'Invalid role specified.' });
      }

      const { data: updatedRaw, error } = await supabase
         .from('users')
         .update({ role, updated_at: new Date().toISOString() })
         .eq('id', req.params.id)
         .select()
         .maybeSingle();

      if (error || !updatedRaw) {
         return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const user = formatUser(updatedRaw);
      delete user.password;

      res.json({ success: true, message: `User role updated to ${role}.`, user });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/admin/users/:id — Delete user
router.delete('/users/:id', async (req, res, next) => {
   try {
      if (req.params.id === String(req.user.id)) {
         return res.status(400).json({ success: false, message: 'Cannot delete your own admin account.' });
      }

      const { error } = await supabase
         .from('users')
         .delete()
         .eq('id', req.params.id);

      if (error) {
         return res.status(404).json({ success: false, message: 'User not found.' });
      }

      res.json({ success: true, message: 'User deleted successfully.' });
   } catch (err) {
      next(err);
   }
});

// GET /api/admin/courses — All courses for admin moderation
router.get('/courses', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('courses')
         .select('*')
         .order('created_at', { ascending: false });

      if (error) throw error;

      const courses = (data || []).map(formatCourse);
      res.json({ success: true, count: courses.length, courses });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/admin/courses/:id — Delete course by admin
router.delete('/courses/:id', async (req, res, next) => {
   try {
      const { data: courseRaw } = await supabase
         .from('courses')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!courseRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      const course = formatCourse(courseRaw);

      await supabase
         .from('courses')
         .delete()
         .eq('id', req.params.id);

      if (course.tutorId) {
         const { data: teacherUser } = await supabase
            .from('users')
            .select('courses_count')
            .eq('id', course.tutorId)
            .maybeSingle();

         if (teacherUser) {
            const count = Math.max(0, (teacherUser.courses_count || 1) - 1);
            await supabase
               .from('users')
               .update({ courses_count: count })
               .eq('id', course.tutorId);
         }
      }

      res.json({ success: true, message: 'Course deleted by admin.' });
   } catch (err) {
      next(err);
   }
});

// GET /api/admin/contacts — All contact form messages
router.get('/contacts', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('contact_messages')
         .select('*')
         .order('created_at', { ascending: false });

      if (error) throw error;

      const messages = (data || []).map(formatContactMessage);
      res.json({ success: true, count: messages.length, messages });
   } catch (err) {
      next(err);
   }
});

// PUT /api/admin/contacts/:id/status — Mark contact message status
router.put('/contacts/:id/status', async (req, res, next) => {
   try {
      const { status } = req.body;
      const { data: updatedRaw, error } = await supabase
         .from('contact_messages')
         .update({ status: status || 'read' })
         .eq('id', req.params.id)
         .select()
         .maybeSingle();

      if (error || !updatedRaw) {
         return res.status(404).json({ success: false, message: 'Contact message not found.' });
      }

      const contact = formatContactMessage(updatedRaw);
      res.json({ success: true, contact });
   } catch (err) {
      next(err);
   }
});

// GET /api/admin/activity — System activity logs
router.get('/activity', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('activity_logs')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(100);

      if (error) throw error;

      const logs = (data || []).map(formatActivityLog);
      res.json({ success: true, count: logs.length, logs });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
