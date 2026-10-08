/**
 * Course Routes — CRUD, Search, Enroll, Lesson Completion
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatCourse, formatUser } = require('../supabaseHelper');
const { protect, authorize } = require('../middleware/auth');

// GET /api/courses — List all courses with optional search/filter/sort
router.get('/', async (req, res, next) => {
   try {
      const { query, category, level, price, sortBy } = req.query;
      let reqQuery = supabase.from('courses').select('*');

      if (category && category !== 'All') {
         reqQuery = reqQuery.ilike('category', `%${category}%`);
      }

      if (query) {
         reqQuery = reqQuery.or(`title.ilike.%${query}%,category.ilike.%${query}%,tutor_name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (sortBy === 'rating') {
         reqQuery = reqQuery.order('rating', { ascending: false });
      } else if (sortBy === 'newest') {
         reqQuery = reqQuery.order('created_at', { ascending: false });
      } else {
         reqQuery = reqQuery.order('enrolled_count', { ascending: false });
      }

      const { data, error } = await reqQuery;
      if (error) throw error;

      let courses = (data || []).map(formatCourse);

      // In-memory filter for price if provided
      if (price === 'Free') {
         courses = courses.filter(c => c.price === 'Free' || c.isFree);
      } else if (price === 'Paid') {
         courses = courses.filter(c => c.price !== 'Free' && !c.isFree);
      }

      res.json({ success: true, count: courses.length, courses });
   } catch (err) {
      next(err);
   }
});

// GET /api/courses/teacher/:teacherId — Get courses by teacher
router.get('/teacher/:teacherId', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('courses')
         .select('*')
         .eq('tutor_id', req.params.teacherId);

      if (error) throw error;

      const courses = (data || []).map(formatCourse);
      res.json({ success: true, courses });
   } catch (err) {
      next(err);
   }
});

// GET /api/courses/:id — Get single course
router.get('/:id', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('courses')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (error || !data) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      const course = formatCourse(data);
      res.json({ success: true, course });
   } catch (err) {
      next(err);
   }
});

// POST /api/courses — Create new course (teacher only)
router.post('/', protect, authorize('teacher', 'admin'), async (req, res, next) => {
   try {
      const user = req.user;
      const data = req.body;

      const lessons = (data.lessons || data.playlist || []).map((l, idx) => ({
         _id: `lesson_${Date.now()}_${idx}`,
         id: `lesson_${Date.now()}_${idx}`,
         title: l.title || `Lesson ${idx + 1}`,
         description: l.description || '',
         video: l.video || l.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
         videoUrl: l.video || l.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
         notes: l.notes || l.pdfAttachment || '',
         pdfAttachment: l.notes || l.pdfAttachment || '',
         duration: l.duration || '10:00',
         order: idx + 1
      }));

      const todayStr = new Date().toISOString().split('T')[0];

      const { data: newCourseRaw, error } = await supabase
         .from('courses')
         .insert([{
            title: data.title || 'Untitled Course',
            description: data.description || 'Comprehensive course by expert instructor.',
            tutor_name: user.name,
            tutor_avatar: user.avatar || 'images/pic-1.jpg',
            tutor_title: user.title || 'Instructor',
            tutor_id: user.id,
            category: data.category || 'Development',
            thumb: data.thumbnail || data.thumb || 'images/thumb-1.png',
            date: todayStr,
            status: 'active',
            enrolled_count: 0,
            lessons_count: lessons.length,
            rating: 5.0,
            playlists: lessons,
            videos: lessons
         }])
         .select()
         .single();

      if (error || !newCourseRaw) throw error || new Error('Failed to create course');

      // Update teacher's course count in users table
      const newCoursesCount = (user.coursesCount || 0) + 1;
      await supabase
         .from('users')
         .update({ courses_count: newCoursesCount })
         .eq('id', user.id);

      const course = formatCourse(newCourseRaw);
      res.status(201).json({ success: true, course });
   } catch (err) {
      next(err);
   }
});

// PUT /api/courses/:id — Update course (teacher only)
router.put('/:id', protect, authorize('teacher', 'admin'), async (req, res, next) => {
   try {
      const { data: existingRaw } = await supabase
         .from('courses')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!existingRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      const existingCourse = formatCourse(existingRaw);

      if (existingCourse.tutorId !== req.user.id && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to edit this course.' });
      }

      const data = req.body;
      const updates = {};

      if (data.title) updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description;
      if (data.category) updates.category = data.category;
      if (data.thumbnail || data.thumb) updates.thumb = data.thumbnail || data.thumb;

      if (data.lessons || data.playlist) {
         const rawLessons = data.lessons || data.playlist;
         const formattedLessons = rawLessons.map((l, idx) => ({
            _id: l._id || l.id || `lesson_${Date.now()}_${idx}`,
            id: l._id || l.id || `lesson_${Date.now()}_${idx}`,
            title: l.title,
            description: l.description || '',
            video: l.video || l.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
            videoUrl: l.video || l.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
            notes: l.notes || l.pdfAttachment || '',
            pdfAttachment: l.notes || l.pdfAttachment || '',
            duration: l.duration || '10:00',
            order: idx + 1
         }));
         updates.playlists = formattedLessons;
         updates.videos = formattedLessons;
         updates.lessons_count = formattedLessons.length;
      }

      updates.updated_at = new Date().toISOString();

      const { data: updatedRaw, error } = await supabase
         .from('courses')
         .update(updates)
         .eq('id', req.params.id)
         .select()
         .single();

      if (error || !updatedRaw) throw error || new Error('Failed to update course');

      const course = formatCourse(updatedRaw);
      res.json({ success: true, course });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/courses/:id — Delete course (teacher only)
router.delete('/:id', protect, authorize('teacher', 'admin'), async (req, res, next) => {
   try {
      const { data: existingRaw } = await supabase
         .from('courses')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!existingRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      const existingCourse = formatCourse(existingRaw);

      if (existingCourse.tutorId !== req.user.id && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to delete this course.' });
      }

      await supabase
         .from('courses')
         .delete()
         .eq('id', req.params.id);

      // Decrement teacher's course count
      if (existingCourse.tutorId) {
         const { data: teacherUser } = await supabase
            .from('users')
            .select('courses_count')
            .eq('id', existingCourse.tutorId)
            .maybeSingle();

         if (teacherUser) {
            const count = Math.max(0, (teacherUser.courses_count || 1) - 1);
            await supabase
               .from('users')
               .update({ courses_count: count })
               .eq('id', existingCourse.tutorId);
         }
      }

      res.json({ success: true, message: 'Course deleted.' });
   } catch (err) {
      next(err);
   }
});

// POST /api/courses/:id/enroll — Enroll student
router.post('/:id/enroll', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const courseId = req.params.id;

      const { data: courseRaw } = await supabase
         .from('courses')
         .select('*')
         .eq('id', courseId)
         .maybeSingle();

      if (!courseRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      const enrolled = user.enrolledCourses || [];
      if (enrolled.includes(courseId)) {
         return res.json({ success: true, enrolled: true, message: 'Already enrolled.' });
      }

      const newEnrolled = [...enrolled, courseId];

      await supabase
         .from('users')
         .update({ enrolled_courses: newEnrolled })
         .eq('id', user.id);

      const newStudentCount = (courseRaw.enrolled_count || 0) + 1;
      await supabase
         .from('courses')
         .update({ enrolled_count: newStudentCount })
         .eq('id', courseId);

      const { data: updatedUserRaw } = await supabase
         .from('users')
         .select('*')
         .eq('id', user.id)
         .single();

      const updatedUser = formatUser(updatedUserRaw);
      delete updatedUser.password;

      res.json({ success: true, enrolled: true, user: updatedUser });
   } catch (err) {
      next(err);
   }
});

// POST /api/courses/lessons/:lessonId/complete — Toggle lesson completion
router.post('/lessons/:lessonId/complete', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const lessonId = req.params.lessonId;

      let completed = user.completedLessons || [];
      const isCompleted = completed.includes(lessonId);

      if (isCompleted) {
         completed = completed.filter(id => id !== lessonId);
      } else {
         completed = [...completed, lessonId];
      }

      await supabase
         .from('users')
         .update({ completed_lessons: completed })
         .eq('id', user.id);

      const { data: updatedUserRaw } = await supabase
         .from('users')
         .select('*')
         .eq('id', user.id)
         .single();

      const updatedUser = formatUser(updatedUserRaw);
      delete updatedUser.password;

      res.json({
         success: true,
         completed: !isCompleted,
         completedLessons: updatedUser.completedLessons,
         user: updatedUser
      });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
