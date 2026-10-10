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

function formatLesson(l) {
   if (!l) return null;
   return {
      _id: l.id,
      id: l.id,
      courseId: l.course_id,
      title: l.title,
      duration: l.duration || '15:00',
      video: l.video_url || 'https://vjs.zencdn.net/v/oceans.mp4',
      videoUrl: l.video_url || 'https://vjs.zencdn.net/v/oceans.mp4',
      notes: l.notes || '',
      pdfAttachment: l.pdf_attachment || '',
      description: l.description || '',
      order: l.sort_order || 1,
      sortOrder: l.sort_order || 1,
      createdAt: l.created_at
   };
}

function formatCourse(c) {
   if (!c) return null;
   let rawLessons = Array.isArray(c.lessons) && c.lessons.length > 0 
      ? c.lessons 
      : (Array.isArray(c.playlists) && c.playlists.length > 0 
         ? c.playlists 
         : (Array.isArray(c.videos) ? c.videos : []));

   const lessonsList = rawLessons.map(l => {
      // If it's already formatted or a lessons row
      return {
         _id: l.id || l._id,
         id: l.id || l._id,
         title: l.title,
         duration: l.duration || '15:00',
         video: l.video_url || l.video || 'https://vjs.zencdn.net/v/oceans.mp4',
         videoUrl: l.video_url || l.video || 'https://vjs.zencdn.net/v/oceans.mp4',
         notes: l.notes || '',
         pdfAttachment: l.pdf_attachment || l.pdfAttachment || '',
         description: l.description || '',
         order: l.sort_order || l.order || 1,
         sortOrder: l.sort_order || l.order || 1
      };
   });

   const thumb = c.thumbnail || c.thumb || 'images/thumb-1.png';
   const teacherName = c.teacher_name || c.tutor_name || 'Instructor';
   const teacherAvatar = c.teacher_avatar || c.tutor_avatar || 'images/pic-1.jpg';
   const teacherId = c.teacher_id || c.tutor_id || '';
   const studentsCount = Number(c.students_count || c.students_enrolled || c.enrolled_count || 0);

   return {
      _id: c.id,
      id: c.id,
      title: c.title,
      description: c.description || '',
      teacherId,
      tutorId: teacherId,
      teacherName,
      tutorName: teacherName,
      teacherAvatar,
      tutorAvatar: teacherAvatar,
      teacherTitle: c.teacher_title || c.tutor_title || '',
      tutorTitle: c.teacher_title || c.tutor_title || '',
      category: c.category || 'General',
      thumbnail: thumb,
      thumb: thumb,
      date: c.date || (c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-01-15'),
      status: c.status || 'active',
      price: c.price || 'Free',
      isFree: c.is_free !== undefined ? c.is_free : (c.price === 'Free' || !c.price),
      level: c.level || c.difficulty || 'All Levels',
      difficulty: c.difficulty || c.level || 'All Levels',
      studentsCount,
      enrolledCount: studentsCount,
      lessonsCount: c.lessons_count || lessonsList.length,
      rating: Number(c.rating) || 5.0,
      playlist: lessonsList,
      playlists: lessonsList,
      lessons: lessonsList,
      videos: lessonsList,
      requirements: c.requirements || [],
      whatYouWillLearn: c.what_you_will_learn || [],
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

   const topics = Array.isArray(ch.topic) ? ch.topic : (ch.category ? [ch.category] : ['Algorithms']);
   const sampleCases = Array.isArray(ch.sample_test_cases) && ch.sample_test_cases.length > 0 
      ? ch.sample_test_cases 
      : (Array.isArray(ch.test_cases) ? ch.test_cases.filter(t => !t.isHidden) : []);

   const match = (ch.title || '').match(/\[(CA\d+)\]/i);
   const codeId = match ? match[1] : (ch.code_id || ch.id);
   const cleanTitle = (ch.title || '').replace(/^\[CA\d+\]\s*/i, '');

   return {
      _id: codeId,
      id: codeId,
      dbId: ch.id,
      codeId: codeId,
      title: cleanTitle || ch.title,
      description: ch.description,
      difficulty: ch.difficulty || 'Easy',
      topic: topics,
      category: topics.join(' · '),
      inputFormat: ch.input_format || ch.inputFormat || 'Standard input format (stdin).',
      outputFormat: ch.output_format || ch.outputFormat || 'Standard output format (stdout).',
      constraints: Array.isArray(ch.constraints) ? ch.constraints : [],
      sampleTestCases: sampleCases,
      // IMPORTANT: hidden_test_cases and reference solutions are omitted from public API responses
      starterCode: {},
      supportedLanguages: ch.languages || ch.supported_languages || ["python", "java", "cpp", "javascript"],
      points: ch.points || 100,
      createdAt: ch.created_at
   };
}

function formatSubmission(s) {
   if (!s) return null;
   const resObj = (typeof s.result === 'object' && s.result !== null) ? s.result : {};
   const total = resObj.total !== undefined ? resObj.total : (s.total_tests || 0);
   const passed = resObj.passed !== undefined ? resObj.passed : (s.passed_tests || 0);
   const isAccepted = s.status === 'Accepted' && total > 0 && passed === total;
   const score = resObj.score !== undefined ? resObj.score : (isAccepted ? 100 : (total > 0 ? Math.round((passed / total) * 100) : 0));
   const maxScore = resObj.maxScore !== undefined ? resObj.maxScore : 100;
   const output = resObj.output || s.output || '';

   return {
      _id: s.id,
      id: s.id,
      userId: s.user_id,
      challengeId: s.challenge_id,
      language: s.language || 'python',
      code: s.code,
      status: s.status,
      output: output,
      passedTests: passed,
      totalTests: total,
      score: score,
      maxScore: maxScore,
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
   formatLesson,
   formatComment,
   formatNotification,
   formatContactMessage,
   formatCodeChallenge,
   formatSubmission,
   formatReview,
   formatActivityLog,
   formatBadge
};
