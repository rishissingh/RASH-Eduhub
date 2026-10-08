/**
 * Activity Log Routes & Helper
 * Tracks user actions across the platform in Supabase activity_logs table.
 */

const express = require('express');
const router = express.Router();
const { supabase, formatActivityLog } = require('../supabaseHelper');
const { protect, authorize } = require('../middleware/auth');

/**
 * Internal helper to log user activity into Supabase
 */
async function logActivity(userId, action, details = {}, ip = '') {
   try {
      await supabase
         .from('activity_logs')
         .insert([{
            user_id: userId ? String(userId) : 'anonymous',
            action,
            details: details || {},
            ip
         }]);
   } catch (err) {
      console.error('Failed to log activity:', err.message);
   }
}

// GET /api/activity — Get current user's activity history
router.get('/', protect, async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('activity_logs')
         .select('*')
         .eq('user_id', String(req.user.id))
         .order('created_at', { ascending: false })
         .limit(30);

      if (error) throw error;

      const logs = (data || []).map(formatActivityLog);
      res.json({ success: true, count: logs.length, logs });
   } catch (err) {
      next(err);
   }
});

// GET /api/activity/all — Admin route to get all system activity
router.get('/all', protect, authorize('admin'), async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('activity_logs')
         .select('*')
         .order('created_at', { ascending: false })
         .limit(100);

      if (error) throw error;

      const logs = (data || []).map(formatActivityLog);
      res.json({ success: true, count: logs.length, logs });
   } catch (err) {
      next(err);
   }
});

// POST /api/activity — Client-side activity logging endpoint
router.post('/', protect, async (req, res, next) => {
   try {
      const { action, details } = req.body;
      if (!action) {
         return res.status(400).json({ success: false, message: 'Action is required.' });
      }

      await logActivity(req.user.id, action, details || {}, req.ip);

      res.status(201).json({ success: true, message: 'Activity logged.' });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
module.exports.logActivity = logActivity;
