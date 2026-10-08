/**
 * Bookmarks Routes — Saved/Favorite Courses Management
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatCourse, formatUser } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');

// GET /api/bookmarks — Get all bookmarked courses for logged-in user
router.get('/', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const bookmarkIds = user.bookmarks || [];

      if (bookmarkIds.length === 0) {
         return res.json({ success: true, count: 0, courses: [] });
      }

      const { data, error } = await supabase
         .from('courses')
         .select('*')
         .in('id', bookmarkIds);

      if (error) throw error;

      const courses = (data || []).map(formatCourse);
      res.json({ success: true, count: courses.length, courses });
   } catch (err) {
      next(err);
   }
});

// POST /api/bookmarks/:courseId — Toggle bookmark status for a course
router.post('/:courseId', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const { courseId } = req.params;

      const { data: courseRaw } = await supabase
         .from('courses')
         .select('id')
         .eq('id', courseId)
         .maybeSingle();

      if (!courseRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      let bookmarks = user.bookmarks ? user.bookmarks.map(String) : [];
      const isBookmarked = bookmarks.includes(String(courseId));

      if (isBookmarked) {
         bookmarks = bookmarks.filter(id => id !== String(courseId));
      } else {
         bookmarks = [...bookmarks, String(courseId)];
      }

      await supabase
         .from('users')
         .update({ bookmarks })
         .eq('id', user.id);

      const { data: updatedUserRaw } = await supabase
         .from('users')
         .select('*')
         .eq('id', user.id)
         .single();

      const updatedUser = formatUser(updatedUserRaw);

      res.json({
         success: true,
         bookmarked: !isBookmarked,
         message: !isBookmarked ? 'Course saved to bookmarks.' : 'Course removed from bookmarks.',
         bookmarks: updatedUser.bookmarks
      });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/bookmarks/:courseId — Explicitly remove bookmark
router.delete('/:courseId', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const { courseId } = req.params;

      let bookmarks = user.bookmarks ? user.bookmarks.map(String) : [];
      bookmarks = bookmarks.filter(id => id !== String(courseId));

      await supabase
         .from('users')
         .update({ bookmarks })
         .eq('id', user.id);

      const { data: updatedUserRaw } = await supabase
         .from('users')
         .select('*')
         .eq('id', user.id)
         .single();

      const updatedUser = formatUser(updatedUserRaw);

      res.json({
         success: true,
         bookmarked: false,
         message: 'Course removed from bookmarks.',
         bookmarks: updatedUser.bookmarks
      });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
