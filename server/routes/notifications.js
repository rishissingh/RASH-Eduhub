/**
 * Notification Routes — Get, mark read, mark all read, delete, and clear all notifications
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatNotification } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');

// GET /api/notifications — Get current user's notifications
router.get('/', protect, async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('notifications')
         .select('*')
         .eq('user_id', req.user.id)
         .order('created_at', { ascending: false });

      if (error) throw error;

      const notifications = (data || []).map(formatNotification);
      res.json({ success: true, count: notifications.length, notifications });
   } catch (err) {
      next(err);
   }
});

// GET /api/notifications/unread-count
router.get('/unread-count', protect, async (req, res, next) => {
   try {
      const { count, error } = await supabase
         .from('notifications')
         .select('id', { count: 'exact', head: true })
         .eq('user_id', req.user.id)
         .eq('read', false);

      if (error) throw error;

      res.json({ success: true, count: count || 0 });
   } catch (err) {
      next(err);
   }
});

// POST /api/notifications — Create notification (internal/admin use)
router.post('/', protect, async (req, res, next) => {
   try {
      const { userId, title, message, type, link } = req.body;

      const { data: notifRaw, error } = await supabase
         .from('notifications')
         .insert([{
            user_id: userId || String(req.user.id),
            title,
            message,
            type: type || 'info',
            link: link || '#',
            read: false
         }])
         .select()
         .single();

      if (error || !notifRaw) throw error || new Error('Failed to create notification');

      const notification = formatNotification(notifRaw);
      res.status(201).json({ success: true, notification });
   } catch (err) {
      next(err);
   }
});

// PUT /api/notifications/:id/read — Mark single notification as read
router.put('/:id/read', protect, async (req, res, next) => {
   try {
      const { data: notifRaw, error } = await supabase
         .from('notifications')
         .update({ read: true })
         .eq('id', req.params.id)
         .select()
         .maybeSingle();

      if (error || !notifRaw) {
         return res.status(404).json({ success: false, message: 'Notification not found.' });
      }

      const notification = formatNotification(notifRaw);
      res.json({ success: true, notification });
   } catch (err) {
      next(err);
   }
});

// PUT /api/notifications/read-all — Mark all user notifications as read
router.put('/read-all', protect, async (req, res, next) => {
   try {
      const userIdStr = String(req.user.id);
      await supabase
         .from('notifications')
         .update({ read: true })
         .or(`user_id.eq.${userIdStr},user_id.eq.all`);

      res.json({ success: true, message: 'All notifications marked as read.' });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/notifications/:id — Delete single notification
router.delete('/:id', protect, async (req, res, next) => {
   try {
      const { error } = await supabase
         .from('notifications')
         .delete()
         .eq('id', req.params.id);

      if (error) {
         return res.status(404).json({ success: false, message: 'Notification not found.' });
      }

      res.json({ success: true, message: 'Notification deleted.' });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/notifications/clear-all — Clear all notifications for user
router.delete('/clear-all', protect, async (req, res, next) => {
   try {
      const userIdStr = String(req.user.id);
      await supabase
         .from('notifications')
         .delete()
         .eq('user_id', userIdStr);

      res.json({ success: true, message: 'All notifications cleared.' });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
