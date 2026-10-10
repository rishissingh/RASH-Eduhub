/**
 * Course Routes — CRUD, Search, Enroll, Lesson Completion, Notes API
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatCourse, formatUser, formatLesson } = require('../supabaseHelper');
const { protect, authorize } = require('../middleware/auth');

// GET /api/courses — List all courses with optional search/filter/sort
router.get('/', async (req, res, next) => {
   try {
      const { query, category, level, price, sortBy, teacherId, teacher_id } = req.query;
      let reqQuery = supabase.from('courses').select('*, lessons(*)');

      if (category && category !== 'All') {
         reqQuery = reqQuery.ilike('category', `%${category}%`);
      }

      if (query) {
         reqQuery = reqQuery.or(`title.ilike.%${query}%,category.ilike.%${query}%,teacher_name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      const filterTeacherId = teacherId || teacher_id;
      if (filterTeacherId) {
         reqQuery = reqQuery.eq('teacher_id', filterTeacherId);
      }

      if (sortBy === 'rating') {
         reqQuery = reqQuery.order('rating', { ascending: false });
      } else if (sortBy === 'newest') {
         reqQuery = reqQuery.order('created_at', { ascending: false });
      } else {
         reqQuery = reqQuery.order('students_count', { ascending: false });
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
         .select('*, lessons(*)')
         .eq('teacher_id', req.params.teacherId)
         .order('created_at', { ascending: false });

      if (error) throw error;

      const courses = (data || []).map(formatCourse);
      res.json({ success: true, count: courses.length, courses });
   } catch (err) {
      next(err);
   }
});

// GET /api/courses/:id/notes — Retrieve accessible notes and lessons for a course
router.get('/:id/notes', async (req, res, next) => {
   try {
      const courseId = req.params.id;

      // 1. Fetch course details
      const { data: courseRaw, error: courseErr } = await supabase
         .from('courses')
         .select('id, title, category, teacher_id, teacher_name, teacher_avatar, thumbnail, description, level')
         .eq('id', courseId)
         .maybeSingle();

      if (courseErr || !courseRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      // 2. Query lessons with study notes for this course
      const { data: lessonsRaw, error: lessonsErr } = await supabase
         .from('lessons')
         .select('*')
         .eq('course_id', courseId)
         .order('sort_order', { ascending: true });

      if (lessonsErr) throw lessonsErr;

      const notes = (lessonsRaw || []).map(l => ({
         id: l.id,
         _id: l.id,
         courseId: l.course_id,
         title: l.title,
         duration: l.duration || '15:00',
         videoUrl: l.video_url,
         video: l.video_url,
         notes: l.notes || '',
         pdfAttachment: l.pdf_attachment || '',
         description: l.description || '',
         sortOrder: l.sort_order || 1,
         order: l.sort_order || 1,
         createdAt: l.created_at,
         updatedAt: l.created_at
      }));

      res.json({
         success: true,
         count: notes.length,
         course: {
            id: courseRaw.id,
            title: courseRaw.title,
            category: courseRaw.category,
            teacherId: courseRaw.teacher_id,
            teacherName: courseRaw.teacher_name,
            teacherAvatar: courseRaw.teacher_avatar || 'images/pic-1.jpg',
            thumbnail: courseRaw.thumbnail,
            description: courseRaw.description,
            level: courseRaw.level
         },
         notes
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/courses/:id — Get single course with lessons and notes
router.get('/:id', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('courses')
         .select('*, lessons(*)')
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
      const rawLessons = data.lessons || data.playlist || [];

      const { data: newCourseRaw, error } = await supabase
         .from('courses')
         .insert([{
            title: data.title || 'Untitled Course',
            description: data.description || 'Comprehensive course by expert instructor.',
            teacher_name: user.name,
            teacher_avatar: user.avatar || 'images/pic-1.jpg',
            teacher_id: user.id,
            category: data.category || 'Development',
            thumbnail: data.thumbnail || data.thumb || 'images/thumb-1.png',
            level: data.level || 'All Levels',
            difficulty: data.level || 'All Levels',
            price: data.price || 'Free',
            is_free: data.isFree !== undefined ? data.isFree : (data.price === 'Free' || !data.price),
            students_count: 0,
            lessons_count: rawLessons.length,
            rating: 5.0
         }])
         .select()
         .single();

      if (error || !newCourseRaw) throw error || new Error('Failed to create course');

      // Insert lessons into lessons table if provided
      if (rawLessons.length > 0) {
         const lessonsToInsert = rawLessons.map((l, idx) => ({
            course_id: newCourseRaw.id,
            title: l.title || `Lesson ${idx + 1}`,
            duration: l.duration || '15:00',
            video_url: l.video || l.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
            notes: l.notes || '',
            pdf_attachment: l.pdfAttachment || l.pdf_attachment || '',
            description: l.description || '',
            sort_order: idx + 1
         }));
         await supabase.from('lessons').insert(lessonsToInsert);
      }

      // Update teacher's course count in users table
      const newCoursesCount = (user.coursesCount || 0) + 1;
      await supabase
         .from('users')
         .update({ courses_count: newCoursesCount })
         .eq('id', user.id);

      // Fetch newly created course with joined lessons
      const { data: completeCourse } = await supabase
         .from('courses')
         .select('*, lessons(*)')
         .eq('id', newCourseRaw.id)
         .single();

      const course = formatCourse(completeCourse || newCourseRaw);
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

      if (existingCourse.teacherId !== req.user.id && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to edit this course.' });
      }

      const data = req.body;
      const updates = {};

      if (data.title) updates.title = data.title;
      if (data.description !== undefined) updates.description = data.description;
      if (data.category) updates.category = data.category;
      if (data.thumbnail || data.thumb) updates.thumbnail = data.thumbnail || data.thumb;
      if (data.level) {
         updates.level = data.level;
         updates.difficulty = data.level;
      }
      if (data.price !== undefined) {
         updates.price = data.price;
         updates.is_free = data.price === 'Free' || !data.price;
      }

      const rawLessons = data.lessons || data.playlist;
      if (rawLessons && Array.isArray(rawLessons)) {
         updates.lessons_count = rawLessons.length;
         // Delete and recreate lessons for simplicity and clean ordering
         await supabase.from('lessons').delete().eq('course_id', req.params.id);
         if (rawLessons.length > 0) {
            const lessonsToInsert = rawLessons.map((l, idx) => ({
               course_id: req.params.id,
               title: l.title || `Lesson ${idx + 1}`,
               duration: l.duration || '15:00',
               video_url: l.video || l.videoUrl || 'https://vjs.zencdn.net/v/oceans.mp4',
               notes: l.notes || '',
               pdf_attachment: l.pdfAttachment || l.pdf_attachment || '',
               description: l.description || '',
               sort_order: idx + 1
            }));
            await supabase.from('lessons').insert(lessonsToInsert);
         }
      }

      updates.updated_at = new Date().toISOString();

      const { error } = await supabase
         .from('courses')
         .update(updates)
         .eq('id', req.params.id);

      if (error) throw error;

      // Re-fetch updated course with lessons
      const { data: updatedRaw } = await supabase
         .from('courses')
         .select('*, lessons(*)')
         .eq('id', req.params.id)
         .single();

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

      if (existingCourse.teacherId !== req.user.id && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to delete this course.' });
      }

      // Delete child lessons first
      await supabase.from('lessons').delete().eq('course_id', req.params.id);

      // Delete course
      await supabase
         .from('courses')
         .delete()
         .eq('id', req.params.id);

      // Decrement teacher's course count
      if (existingCourse.teacherId) {
         const { data: teacherUser } = await supabase
            .from('users')
            .select('courses_count')
            .eq('id', existingCourse.teacherId)
            .maybeSingle();

         if (teacherUser) {
            const count = Math.max(0, (teacherUser.courses_count || 1) - 1);
            await supabase
               .from('users')
               .update({ courses_count: count })
               .eq('id', existingCourse.teacherId);
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

      const newStudentCount = (courseRaw.students_count || 0) + 1;
      await supabase
         .from('courses')
         .update({ students_count: newStudentCount })
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
