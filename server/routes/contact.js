/**
 * Contact Routes — Contact form message submission
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const { supabase, formatContactMessage } = require('../supabaseHelper');

// POST /api/contact — Submit contact form
router.post('/', async (req, res, next) => {
   try {
      const { name, email, message, number, msg } = req.body;
      const messageText = message || msg;

      if (!name || !email || !messageText) {
         return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      const { data: contactRaw, error } = await supabase
         .from('contact_messages')
         .insert([{
            name: name.trim(),
            email: email.trim().toLowerCase(),
            number: number || '',
            msg: messageText.trim(),
            status: 'unread'
         }])
         .select()
         .single();

      if (error || !contactRaw) throw error || new Error('Failed to save contact message');

      const contact = formatContactMessage(contactRaw);

      res.status(201).json({
         success: true,
         message: `Thank you, ${name}! Your message has been sent successfully. Our support team will respond shortly.`,
         contact
      });
   } catch (err) {
      next(err);
   }
});

// GET /api/contact — Get all contact messages (admin only)
router.get('/', async (req, res, next) => {
   try {
      const { data, error } = await supabase
         .from('contact_messages')
         .select('*')
         .order('created_at', { ascending: false });

      if (error) throw error;

      const messages = (data || []).map(formatContactMessage);
      res.json({ success: true, messages });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
