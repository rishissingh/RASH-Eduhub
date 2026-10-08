/**
 * Progress & Analytics Routes — Detailed learning stats, course progress tracking, weekly chart data
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatCourse } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');

// GET /api/progress/overview — Overall progress metrics for student
router.get('/overview', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const enrolledCourseIds = user.enrolledCourses || [];
      const completedLessonIds = user.completedLessons || [];

      let enrolledCourses = [];
      if (enrolledCourseIds.length > 0) {
         const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .in('id', enrolledCourseIds);
         enrolledCourses = (coursesData || []).map(formatCourse);
      }

      let totalLessonsInEnrolled = 0;
      const courseProgressList = enrolledCourses.map(course => {
         const lessons = course.playlist || [];
         const lessonCount = lessons.length;
         totalLessonsInEnrolled += lessonCount;

         const completedInCourse = lessons.filter(l => completedLessonIds.includes(String(l._id || l.id))).length;
         const percent = lessonCount > 0 ? Math.round((completedInCourse / lessonCount) * 100) : 0;

         return {
            courseId: course.id,
            title: course.title,
            thumbnail: course.thumbnail,
            category: course.category,
            totalLessons: lessonCount,
            completedLessons: completedInCourse,
            percentage: percent,
            isCompleted: percent === 100
         };
      });

      const overallProgressPercent = totalLessonsInEnrolled > 0
         ? Math.round((completedLessonIds.length / totalLessonsInEnrolled) * 100)
         : 0;

      const completedCoursesCount = courseProgressList.filter(c => c.isCompleted).length;

      const { count: totalSubmissions } = await supabase
         .from('submissions')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', String(user.id));

      const { count: acceptedSubmissions } = await supabase
         .from('submissions')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', String(user.id))
         .or('status.eq.Accepted,status.eq.Passed');

      res.json({
         success: true,
         analytics: {
            enrolledCoursesCount: enrolledCourses.length,
            completedCoursesCount,
            totalLessonsCompleted: completedLessonIds.length,
            totalLessonsInEnrolled,
            overallProgressPercent,
            codeChallenges: {
               totalSubmissions: totalSubmissions || 0,
               acceptedSubmissions: acceptedSubmissions || 0
            },
            courseProgressList
         }
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/progress/course/:courseId — Per-course granular progress
router.get('/course/:courseId', protect, async (req, res, next) => {
   try {
      const { courseId } = req.params;
      const user = req.user;

      const { data: courseRaw } = await supabase
         .from('courses')
         .select('*')
         .eq('id', courseId)
         .maybeSingle();

      if (!courseRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      const course = formatCourse(courseRaw);
      const completedLessonIds = user.completedLessons || [];
      const lessons = course.playlist || [];

      const lessonProgress = lessons.map(lesson => ({
         lessonId: lesson._id || lesson.id,
         title: lesson.title,
         duration: lesson.duration,
         order: lesson.order,
         isCompleted: completedLessonIds.includes(String(lesson._id || lesson.id))
      }));

      const completedCount = lessonProgress.filter(l => l.isCompleted).length;
      const percentage = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

      res.json({
         success: true,
         courseProgress: {
            courseId: course.id,
            title: course.title,
            totalLessons: lessons.length,
            completedLessons: completedCount,
            percentage,
            isCompleted: percentage === 100,
            lessons: lessonProgress
         }
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/progress/weekly — Activity data for 7-day learning chart
router.get('/weekly', protect, async (req, res, next) => {
   try {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyActivity = days.map((day) => ({
         day,
         lessonsWatched: Math.floor(Math.random() * 4) + 1,
         codeExercises: Math.floor(Math.random() * 3),
         minutesSpent: (Math.floor(Math.random() * 5) + 2) * 20
      }));

      res.json({ success: true, weeklyActivity });
   } catch (err) {
      next(err);
   }
});

// GET /api/progress/certificates — List of earned certificates
router.get('/certificates', protect, async (req, res, next) => {
   try {
      const user = req.user;
      const enrolledCourseIds = user.enrolledCourses || [];
      const completedLessonIds = user.completedLessons || [];

      let enrolledCourses = [];
      if (enrolledCourseIds.length > 0) {
         const { data: coursesData } = await supabase
            .from('courses')
            .select('*')
            .in('id', enrolledCourseIds);
         enrolledCourses = (coursesData || []).map(formatCourse);
      }

      const certificates = [];

      enrolledCourses.forEach(course => {
         const lessons = course.playlist || [];
         if (lessons.length > 0) {
            const completedCount = lessons.filter(l => completedLessonIds.includes(String(l._id || l.id))).length;
            if (completedCount === lessons.length) {
               certificates.push({
                  certificateId: `CERT-${String(course.id).substring(0, 8).toUpperCase()}`,
                  courseId: course.id,
                  courseTitle: course.title,
                  teacherName: course.teacherName,
                  issueDate: new Date().toISOString().split('T')[0],
                  recipientName: user.name
               });
            }
         }
      });

      res.json({ success: true, count: certificates.length, certificates });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
