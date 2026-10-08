/**
 * Authentication Middleware — JWT verification and role-based access control using Supabase
 */

const jwt = require('jsonwebtoken');
const { supabase, formatUser } = require('../supabaseHelper');

/**
 * Protect routes — Verify JWT token and fetch current user from Supabase
 */
const protect = async (req, res, next) => {
   let token;

   if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
   }

   if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
   }

   try {
      const secret = process.env.JWT_SECRET || 'default_rash_eduhub_secret';
      const decoded = jwt.verify(token, secret);

      const { data: user, error } = await supabase
         .from('users')
         .select('*')
         .eq('id', decoded.id)
         .maybeSingle();

      if (error || !user) {
         return res.status(401).json({ success: false, message: 'User not found.' });
      }

      req.user = formatUser(user);
      next();
   } catch (err) {
      return res.status(401).json({ success: false, message: 'Not authorized. Token invalid or expired.' });
   }
};

/**
 * Role-based authorization
 * @param  {...string} roles - Allowed roles (e.g., 'teacher', 'admin')
 */
const authorize = (...roles) => {
   return (req, res, next) => {
      if (!req.user) {
         return res.status(401).json({ success: false, message: 'Not authorized.' });
      }

      if (!roles.includes(req.user.role)) {
         return res.status(403).json({
            success: false,
            message: `Access denied. Role '${req.user.role}' is not authorized for this action.`
         });
      }

      next();
   };
};

module.exports = { protect, authorize };
