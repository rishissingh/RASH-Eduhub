/**
 * Review Routes — Course Rating & Review System
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatReview } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');
const { reviewValidation } = require('../middleware/validator');

/**
 * Helper to recalculate course rating in Supabase
 */
async function recalculateCourseRating(courseId) {
   try {
      const { data: reviews } = await supabase
         .from('reviews')
         .select('rating')
         .eq('course_id', String(courseId));

      const reviewsList = reviews || [];
      const reviewsCount = reviewsList.length;
      let avgRating = 5.0;

      if (reviewsCount > 0) {
         const total = reviewsList.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
         avgRating = Math.round((total / reviewsCount) * 10) / 10;
      }

      await supabase
         .from('courses')
         .update({ rating: avgRating })
         .eq('id', courseId);
   } catch (err) {
      console.error('Failed to recalculate course rating:', err.message);
   }
}

// GET /api/reviews/:courseId — Get all reviews for a course
router.get('/:courseId', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('reviews')
         .select('*')
         .eq('course_id', String(req.params.courseId))
         .order('created_at', { ascending: false });

      if (error) throw error;

      const reviews = (data || []).map(formatReview);
      res.json({ success: true, count: reviews.length, reviews });
   } catch (err) {
      next(err);
   }
});

// POST /api/reviews — Post or update review for a course
router.post('/', protect, reviewValidation, async (req, res, next) => {
   try {
      const { courseId, rating, text, comment } = req.body;
      const reviewText = text || comment || '';
      const user = req.user;

      const { data: courseRaw } = await supabase
         .from('courses')
         .select('id')
         .eq('id', courseId)
         .maybeSingle();

      if (!courseRaw) {
         return res.status(404).json({ success: false, message: 'Course not found.' });
      }

      const { data: existing } = await supabase
         .from('reviews')
         .select('*')
         .eq('course_id', String(courseId))
         .eq('user_id', String(user.id))
         .maybeSingle();

      let reviewRaw;
      if (existing) {
         const { data: updatedRaw } = await supabase
            .from('reviews')
            .update({
               rating: Number(rating),
               comment: reviewText.trim()
            })
            .eq('id', existing.id)
            .select()
            .single();

         reviewRaw = updatedRaw;
      } else {
         const { data: insertedRaw } = await supabase
            .from('reviews')
            .insert([{
               course_id: String(courseId),
               user_id: String(user.id),
               user_name: user.name,
               user_avatar: user.avatar || 'images/pic-2.jpg',
               rating: Number(rating),
               comment: reviewText.trim()
            }])
            .select()
            .single();

         reviewRaw = insertedRaw;
      }

      await recalculateCourseRating(courseId);

      const review = formatReview(reviewRaw);
      res.status(201).json({ success: true, review });
   } catch (err) {
      next(err);
   }
});

// PUT /api/reviews/:id — Edit own review
router.put('/:id', protect, async (req, res, next) => {
   try {
      const { data: reviewRaw } = await supabase
         .from('reviews')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!reviewRaw) {
         return res.status(404).json({ success: false, message: 'Review not found.' });
      }

      if (reviewRaw.user_id !== String(req.user.id) && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to edit this review.' });
      }

      const { rating, text, comment } = req.body;
      const updates = {};
      if (rating !== undefined) updates.rating = Number(rating);
      if (text !== undefined || comment !== undefined) updates.comment = (text || comment || '').trim();

      const { data: updatedRaw } = await supabase
         .from('reviews')
         .update(updates)
         .eq('id', req.params.id)
         .select()
         .single();

      await recalculateCourseRating(reviewRaw.course_id);

      const review = formatReview(updatedRaw);
      res.json({ success: true, review });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/reviews/:id — Delete review
router.delete('/:id', protect, async (req, res, next) => {
   try {
      const { data: reviewRaw } = await supabase
         .from('reviews')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!reviewRaw) {
         return res.status(404).json({ success: false, message: 'Review not found.' });
      }

      if (reviewRaw.user_id !== String(req.user.id) && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to delete this review.' });
      }

      const courseId = reviewRaw.course_id;

      await supabase
         .from('reviews')
         .delete()
         .eq('id', req.params.id);

      await recalculateCourseRating(courseId);

      res.json({ success: true, message: 'Review deleted.' });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
