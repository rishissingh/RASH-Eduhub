/**
 * RASH EduHub — Supabase Database Helper
 * Provides mappers and utilities for clean interaction with Supabase Postgres tables.
 */

const supabase = require('./supabaseClient');

// ── Formatters ──

function formatUser(u) {
   if (!u) return null;
   return {
      _id: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role || 'student',
      avatar: u.avatar || 'images/pic-2.jpg',
      title: u.title || '',
      experience: u.experience || '',
      rating: Number(u.rating) || 0,
      studentsCount: u.students_count || 0,
      coursesCount: u.courses_count || 0,
      bio: u.bio || '',
      enrolledCourses: u.enrolled_courses || [],
      bookmarks: u.bookmarks || [],
      completedLessons: u.completed_lessons || [],
      xp: u.xp || 0,
      coins: u.coins || 0,
      streak: u.streak || 0,
      lastLoginDate: u.last_login_date,
      createdAt: u.created_at,
      updatedAt: u.updated_at
   };
}

function formatCourse(c) {
   if (!c) return null;
   const lessonsList = Array.isArray(c.playlists) && c.playlists.length > 0 ? c.playlists : (Array.isArray(c.videos) ? c.videos : []);
   return {
      _id: c.id,
      id: c.id,
      title: c.title,
      description: c.description || '',
      teacherId: c.tutor_id,
      tutorId: c.tutor_id,
      teacherName: c.tutor_name,
      tutorName: c.tutor_name,
      teacherAvatar: c.tutor_avatar || 'images/pic-1.jpg',
      tutorAvatar: c.tutor_avatar || 'images/pic-1.jpg',
      teacherTitle: c.tutor_title || '',
      tutorTitle: c.tutor_title || '',
      category: c.category || 'General',
      thumbnail: c.thumb || 'images/thumb-1.png',
      thumb: c.thumb || 'images/thumb-1.png',
      date: c.date,
      status: c.status || 'active',
      studentsCount: c.enrolled_count || 0,
      enrolledCount: c.enrolled_count || 0,
      lessonsCount: c.lessons_count || (lessonsList ? lessonsList.length : 0),
      rating: Number(c.rating) || 5.0,
      playlist: lessonsList,
      videos: c.videos || [],
      playlists: c.playlists || [],
      quizzes: c.quizzes || [],
      assignments: c.assignments || [],
      createdAt: c.created_at,
      updatedAt: c.updated_at
   };
}

function formatComment(cm) {
   if (!cm) return null;
   return {
      _id: cm.id,
      id: cm.id,
      courseId: cm.course_id,
      userId: cm.user_id,
      userName: cm.user_name,
      userAvatar: cm.user_avatar || 'images/pic-2.jpg',
      userRole: cm.user_role || 'student',
      text: cm.text,
      videoId: cm.video_id,
      likes: cm.likes || 0,
      likedBy: cm.liked_by || [],
      createdAt: cm.created_at
   };
}

function formatNotification(n) {
   if (!n) return null;
   return {
      _id: n.id,
      id: n.id,
      userId: n.user_id,
      type: n.type || 'info',
      title: n.title,
      message: n.message,
      read: !!n.read,
      link: n.link || '#',
      createdAt: n.created_at
   };
}

function formatContactMessage(c) {
   if (!c) return null;
   return {
      _id: c.id,
      id: c.id,
      name: c.name,
      email: c.email,
      number: c.number || '',
      message: c.msg || c.message || '',
      msg: c.msg || c.message || '',
      status: c.status || 'unread',
      createdAt: c.created_at
   };
}

function formatCodeChallenge(ch) {
   if (!ch) return null;
   return {
      _id: ch.id,
      id: ch.id,
      title: ch.title,
      description: ch.description,
      difficulty: ch.difficulty || 'Easy',
      category: ch.category || 'JavaScript',
      starterCode: ch.starter_code || '',
      testCases: ch.test_cases || [],
      solution: ch.solution || '',
      points: ch.points || 50,
      createdAt: ch.created_at
   };
}

function formatSubmission(s) {
   if (!s) return null;
   return {
      _id: s.id,
      id: s.id,
      userId: s.user_id,
      challengeId: s.challenge_id,
      code: s.code,
      status: s.status,
      output: s.output || '',
      passedTests: s.passed_tests || 0,
      totalTests: s.total_tests || 0,
      score: (s.status === 'Accepted' || s.status === 'Passed') ? 100 : 0,
      createdAt: s.created_at
   };
}

function formatReview(r) {
   if (!r) return null;
   return {
      _id: r.id,
      id: r.id,
      courseId: r.course_id,
      userId: r.user_id,
      userName: r.user_name,
      userAvatar: r.user_avatar || 'images/pic-2.jpg',
      rating: Number(r.rating) || 5.0,
      text: r.comment || '',
      comment: r.comment || '',
      createdAt: r.created_at
   };
}

function formatActivityLog(a) {
   if (!a) return null;
   return {
      _id: a.id,
      id: a.id,
      userId: a.user_id,
      action: a.action,
      details: a.details || {},
      ip: a.ip || '',
      timestamp: a.created_at,
      createdAt: a.created_at
   };
}

function formatBadge(b) {
   if (!b) return null;
   return {
      _id: b.id,
      id: b.id,
      userId: b.user_id,
      badgeName: b.badge_name,
      icon: b.icon,
      unlockedAt: b.unlocked_at
   };
}

module.exports = {
   supabase,
   formatUser,
   formatCourse,
   formatComment,
   formatNotification,
   formatContactMessage,
   formatCodeChallenge,
   formatSubmission,
   formatReview,
   formatActivityLog,
   formatBadge
};
