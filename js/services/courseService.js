/**
 * RASH EduHub - Centralized Course Service Layer
 * Single source of truth for all course CRUD, video lesson management, notes attachments, and publishing.
 * Connected to Node/Express backend.
 */

const CourseService = {
   /**
    * Get all courses from backend
    */
   async getAllCourses() {
      try {
         const data = await EduHubDB.api('/courses');
         return data.success ? data.courses : [];
      } catch (err) {
         console.error('Failed to get all courses:', err);
         return [];
      }
   },

   /**
    * Get single course by ID
    */
   async getCourseById(courseId) {
      try {
         const data = await EduHubDB.api(`/courses/${courseId}`);
         return data.success ? data.course : null;
      } catch (err) {
         console.error(`Failed to get course with ID ${courseId}:`, err);
         return null;
      }
   },

   /**
    * Get courses owned by a specific teacher
    */
   async getTeacherCourses(teacherId) {
      try {
         const data = await EduHubDB.api(`/courses/teacher/${teacherId}`);
         return data.success ? data.courses : [];
      } catch (err) {
         console.error(`Failed to get courses for teacher ${teacherId}:`, err);
         return [];
      }
   },

   /**
    * Filter courses with search query, category, level, price, and sorting
    */
   async searchCourses({ query = '', category = 'All', level = 'All', price = 'All', sortBy = 'popular' } = {}) {
      try {
         const queryParams = new URLSearchParams({ query, category, level, price, sortBy }).toString();
         const data = await EduHubDB.api(`/courses?${queryParams}`);
         return data.success ? data.courses : [];
      } catch (err) {
         console.error('Failed to search courses:', err);
         return [];
      }
   },

   /**
    * Publish / Create a new Course
    */
   async createCourse(courseData) {
      try {
         return await EduHubDB.api('/courses', {
            method: 'POST',
            body: courseData
         });
      } catch (err) {
         return { success: false, message: err.message };
      }
   },

   /**
    * Update an existing Course (Teacher Action)
    */
   async updateCourse(courseId, updatedFields) {
      try {
         return await EduHubDB.api(`/courses/${courseId}`, {
            method: 'PUT',
            body: updatedFields
         });
      } catch (err) {
         return { success: false, message: err.message };
      }
   },

   /**
    * Delete course (Teacher Action)
    */
   async deleteCourse(courseId) {
      try {
         return await EduHubDB.api(`/courses/${courseId}`, {
            method: 'DELETE'
         });
      } catch (err) {
         return { success: false, message: err.message };
      }
   },

   /**
    * Enroll Student in Course
    */
   async enrollStudent(courseId) {
      try {
         const data = await EduHubDB.api(`/courses/${courseId}/enroll`, {
            method: 'POST'
         });

         if (data.success && data.user) {
            localStorage.setItem(EduHubDB.STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
            return { success: true, enrolled: true };
         }
         return { success: false, message: data.message || 'Enrollment failed.' };
      } catch (err) {
         return { success: false, message: err.message };
      }
   },

   /**
    * Toggle lesson completion for current student
    */
   async toggleLessonComplete(lessonId) {
      try {
         const data = await EduHubDB.api(`/courses/lessons/${lessonId}/complete`, {
            method: 'POST'
         });

         if (data.success && data.user) {
            localStorage.setItem(EduHubDB.STORAGE_KEYS.CURRENT_USER, JSON.stringify(data.user));
            return data.completed;
         }
      } catch (err) {
         console.error('Failed to toggle lesson complete:', err);
      }
      return false;
   },

   /**
    * Get video comments
    */
   async getComments(videoId) {
      try {
         const data = await EduHubDB.api(`/comments/${videoId}`);
         return data.success ? data.comments : [];
      } catch (err) {
         console.error(`Failed to get comments for video ${videoId}:`, err);
         return [];
      }
   },

   /**
    * Post new comment on a video
    */
   async addComment(videoId, text) {
      try {
         return await EduHubDB.api('/comments', {
            method: 'POST',
            body: { videoId, text }
         });
      } catch (err) {
         return { success: false, message: err.message };
      }
   }
};

window.CourseService = CourseService;
