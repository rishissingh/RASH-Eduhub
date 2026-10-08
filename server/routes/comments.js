/**
 * Comment Routes — Get, post, edit, delete, and like video comments
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatComment } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');
const { commentValidation } = require('../middleware/validator');

// GET /api/comments/:videoId — Get comments for a video
router.get('/:videoId', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('comments')
         .select('*')
         .eq('video_id', String(req.params.videoId))
         .order('created_at', { ascending: false });

      if (error) throw error;

      const comments = (data || []).map(formatComment);
      res.json({ success: true, count: comments.length, comments });
   } catch (err) {
      next(err);
   }
});

// POST /api/comments — Post a new comment
router.post('/', protect, commentValidation, async (req, res, next) => {
   try {
      const { videoId, text } = req.body;

      const { data: commentRaw, error } = await supabase
         .from('comments')
         .insert([{
            video_id: String(videoId),
            user_id: req.user.id,
            user_name: req.user.name,
            user_avatar: req.user.avatar || 'images/pic-2.jpg',
            user_role: req.user.role || 'student',
            text: text.trim(),
            likes: 0,
            liked_by: []
         }])
         .select()
         .single();

      if (error || !commentRaw) throw error || new Error('Failed to create comment');

      const comment = formatComment(commentRaw);
      res.status(201).json({ success: true, comment });
   } catch (err) {
      next(err);
   }
});

// PUT /api/comments/:id — Edit own comment
router.put('/:id', protect, async (req, res, next) => {
   try {
      const { text } = req.body;
      if (!text || text.trim().length === 0) {
         return res.status(400).json({ success: false, message: 'Comment text cannot be empty.' });
      }

      const { data: commentRaw } = await supabase
         .from('comments')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!commentRaw) {
         return res.status(404).json({ success: false, message: 'Comment not found.' });
      }

      if (commentRaw.user_id !== req.user.id && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to edit this comment.' });
      }

      const { data: updatedRaw, error } = await supabase
         .from('comments')
         .update({ text: text.trim() })
         .eq('id', req.params.id)
         .select()
         .single();

      if (error || !updatedRaw) throw error || new Error('Failed to update comment');

      const comment = formatComment(updatedRaw);
      res.json({ success: true, comment });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/comments/:id — Delete comment (author or admin)
router.delete('/:id', protect, async (req, res, next) => {
   try {
      const { data: commentRaw } = await supabase
         .from('comments')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!commentRaw) {
         return res.status(404).json({ success: false, message: 'Comment not found.' });
      }

      if (commentRaw.user_id !== req.user.id && req.user.role !== 'admin') {
         return res.status(403).json({ success: false, message: 'Not authorized to delete this comment.' });
      }

      await supabase
         .from('comments')
         .delete()
         .eq('id', req.params.id);

      res.json({ success: true, message: 'Comment deleted successfully.' });
   } catch (err) {
      next(err);
   }
});

// POST /api/comments/:id/like — Like or unlike a comment
router.post('/:id/like', protect, async (req, res, next) => {
   try {
      const { data: commentRaw } = await supabase
         .from('comments')
         .select('*')
         .eq('id', req.params.id)
         .maybeSingle();

      if (!commentRaw) {
         return res.status(404).json({ success: false, message: 'Comment not found.' });
      }

      const userIdStr = String(req.user.id);
      let likedBy = commentRaw.liked_by || [];
      const hasLiked = likedBy.includes(userIdStr);
      let newLikes = commentRaw.likes || 0;

      if (hasLiked) {
         likedBy = likedBy.filter(id => id !== userIdStr);
         newLikes = Math.max(0, newLikes - 1);
      } else {
         likedBy = [...likedBy, userIdStr];
         newLikes = newLikes + 1;
      }

      const { data: updatedRaw, error } = await supabase
         .from('comments')
         .update({ liked_by: likedBy, likes: newLikes })
         .eq('id', req.params.id)
         .select()
         .single();

      if (error || !updatedRaw) throw error || new Error('Failed to update comment likes');

      const comment = formatComment(updatedRaw);

      res.json({
         success: true,
         liked: !hasLiked,
         likes: comment.likes,
         comment
      });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
