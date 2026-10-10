/**
 * Auth Routes — Google OAuth Login/Register, Current User, Change Password, Delete Account
 * Integrated with Supabase PostgreSQL Database
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase, formatUser } = require('../supabaseHelper');
const { protect } = require('../middleware/auth');
const { passwordChangeValidation } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * Generate JWT Token
 */
function generateToken(userId) {
   const secret = process.env.JWT_SECRET || 'default_rash_eduhub_secret';
   return jwt.sign({ id: userId }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
   });
}

/**
 * Sanitize user object for response (remove password)
 */
function sanitizeUser(user) {
   const obj = { ...user };
   delete obj.password;
   return obj;
}

/**
 * Verify Google ID Token by calling Google's tokeninfo endpoint
 */
async function verifyGoogleToken(idToken) {
   try {
      const response = await fetch(
         `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );

      if (!response.ok) {
         console.error('Google token verification failed:', response.status);
         return null;
      }

      const payload = await response.json();

      const expectedClientId = process.env.GOOGLE_CLIENT_ID;
      if (expectedClientId && payload.aud !== expectedClientId) {
         console.error('Google token audience mismatch. Expected:', expectedClientId, 'Got:', payload.aud);
         return null;
      }

      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && parseInt(payload.exp) < now) {
         console.error('Google token has expired');
         return null;
      }

      if (payload.email_verified !== 'true' && payload.email_verified !== true) {
         console.error('Google email not verified');
         return null;
      }

      return {
         email: payload.email,
         name: payload.name || payload.email.split('@')[0],
         picture: payload.picture || null,
         googleId: payload.sub
      };
   } catch (err) {
      console.error('Error verifying Google token:', err);
      return null;
   }
}

// POST /api/auth/login — Email and password login
router.post('/login', authLimiter, async (req, res, next) => {
   try {
      const { email, password } = req.body;
      if (!email || !password) {
         return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const { data: userRaw } = await supabase
         .from('users')
         .select('*')
         .eq('email', email.toLowerCase())
         .maybeSingle();

      if (!userRaw) {
         return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      let isMatch = false;
      if (userRaw.password) {
         if (userRaw.password.startsWith('$2a$') || userRaw.password.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(password, userRaw.password);
         } else {
            isMatch = (userRaw.password === password);
         }
      }

      if (!isMatch) {
         return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }

      const user = formatUser(userRaw);
      const token = generateToken(user.id);
      res.json({ success: true, token, user: sanitizeUser(user) });
   } catch (err) {
      next(err);
   }
});

// POST /api/auth/dev-login — Quick developer & test role login
router.post('/dev-login', async (req, res, next) => {
   try {
      const { role = 'student', email } = req.body;
      let query = supabase.from('users').select('*');
      if (email) {
         query = query.eq('email', email.toLowerCase());
      } else {
         query = query.eq('role', role);
      }
      const { data: userRaw } = await query.limit(1).maybeSingle();
      if (!userRaw) {
         return res.status(404).json({ success: false, message: 'User not found.' });
      }
      const user = formatUser(userRaw);
      const token = generateToken(user.id);
      res.json({ success: true, token, user: sanitizeUser(user) });
   } catch (err) {
      next(err);
   }
});

// POST /api/auth/google — Authenticate with Google ID token
router.post('/google', authLimiter, async (req, res, next) => {
   try {
      const { idToken, role } = req.body;

      if (!idToken) {
         return res.status(400).json({ success: false, message: 'Google ID token is required.' });
      }

      const googleUser = await verifyGoogleToken(idToken);
      if (!googleUser) {
         return res.status(401).json({ success: false, message: 'Invalid or expired Google token. Please try again.' });
      }

      // Check if user exists in Supabase
      const { data: existingUser } = await supabase
         .from('users')
         .select('*')
         .eq('email', googleUser.email.toLowerCase())
         .maybeSingle();

      if (existingUser) {
         let updatedAvatar = existingUser.avatar;
         const isDefaultAvatar = !existingUser.avatar || existingUser.avatar.startsWith('images/pic-');
         if (googleUser.picture && (isDefaultAvatar || existingUser.avatar.startsWith('http'))) {
            updatedAvatar = googleUser.picture;
            await supabase
               .from('users')
               .update({ avatar: updatedAvatar })
               .eq('id', existingUser.id);
         }

         const userObj = formatUser({ ...existingUser, avatar: updatedAvatar });
         const token = generateToken(userObj.id);
         return res.json({ success: true, token, user: sanitizeUser(userObj), isNew: false });
      }

      // New user registration
      const selectedRole = (role === 'teacher' || role === 'student') ? role : 'student';
      const defaultAvatar = googleUser.picture || (selectedRole === 'teacher' ? 'images/pic-1.jpg' : 'images/pic-2.jpg');
      const bioText = `${selectedRole === 'teacher' ? 'Instructor' : 'Learner'} at RASH EduHub`;

      const { data: newUser, error: insertErr } = await supabase
         .from('users')
         .insert([{
            name: googleUser.name,
            email: googleUser.email.toLowerCase(),
            password: `google_oauth_${googleUser.googleId}_${Date.now()}`,
            role: selectedRole,
            avatar: defaultAvatar,
            bio: bioText,
            xp: selectedRole === 'student' ? 250 : 0,
            coins: selectedRole === 'student' ? 50 : 0,
            streak: 1
         }])
         .select()
         .single();

      if (insertErr || !newUser) {
         throw new Error(insertErr ? insertErr.message : 'Failed to create user in Supabase');
      }

      const userObj = formatUser(newUser);
      const token = generateToken(userObj.id);

      res.status(201).json({ success: true, token, user: sanitizeUser(userObj), isNew: true });
   } catch (err) {
      next(err);
   }
});

// GET /api/auth/me — Get current user profile
router.get('/me', protect, async (req, res, next) => {
   try {
      if (!req.user) {
         return res.status(404).json({ success: false, message: 'User not found.' });
      }
      res.json({ success: true, user: sanitizeUser(req.user) });
   } catch (err) {
      next(err);
   }
});

// PUT /api/auth/change-password — Change password securely
router.put('/change-password', protect, passwordChangeValidation, async (req, res, next) => {
   try {
      const { currentPassword, newPassword } = req.body;

      const { data: userRaw } = await supabase
         .from('users')
         .select('password')
         .eq('id', req.user.id)
         .maybeSingle();

      if (!userRaw || !userRaw.password) {
         return res.status(400).json({ success: false, message: 'Current password mismatch.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, userRaw.password);
      if (!isMatch) {
         return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      await supabase
         .from('users')
         .update({ password: hashedPassword })
         .eq('id', req.user.id);

      res.json({ success: true, message: 'Password updated successfully.' });
   } catch (err) {
      next(err);
   }
});

// DELETE /api/auth/delete-account — Self delete account
router.delete('/delete-account', protect, async (req, res, next) => {
   try {
      await supabase
         .from('users')
         .delete()
         .eq('id', req.user.id);

      res.json({ success: true, message: 'Your account has been deleted.' });
   } catch (err) {
      next(err);
   }
});

module.exports = router;
