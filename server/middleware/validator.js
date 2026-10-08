/**
 * RASH EduHub — Input Validation & Sanitization Middleware
 * Uses express-validator for request validation rules.
 */

const { body, param, validationResult } = require('express-validator');

/**
 * Middleware that checks for validation errors and returns a 400 response if any
 */
const handleValidation = (req, res, next) => {
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      const messages = errors.array().map(e => e.msg);
      return res.status(400).json({
         success: false,
         message: messages.join(' '),
         errors: errors.array()
      });
   }
   next();
};

/**
 * Sanitize string to prevent XSS — strips HTML tags
 */
function sanitizeString(str) {
   if (typeof str !== 'string') return str;
   return str
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();
}

/**
 * Middleware to sanitize all string fields in req.body
 */
const sanitizeBody = (req, res, next) => {
   if (req.body && typeof req.body === 'object') {
      for (const key of Object.keys(req.body)) {
         if (typeof req.body[key] === 'string') {
            req.body[key] = sanitizeString(req.body[key]);
         }
      }
   }
   next();
};

// ── Validation Rules ──

const registerValidation = [
   body('name')
      .trim()
      .notEmpty().withMessage('Name is required.')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters.'),
   body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email address.'),
   body('password')
      .notEmpty().withMessage('Password is required.')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
   body('role')
      .optional()
      .isIn(['student', 'teacher']).withMessage('Role must be student or teacher.'),
   handleValidation
];

const loginValidation = [
   body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email address.'),
   body('password')
      .notEmpty().withMessage('Password is required.'),
   handleValidation
];

const courseValidation = [
   body('title')
      .trim()
      .notEmpty().withMessage('Course title is required.')
      .isLength({ min: 3, max: 150 }).withMessage('Title must be 3-150 characters.'),
   body('description')
      .optional()
      .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters.'),
   body('category')
      .optional()
      .isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters.'),
   handleValidation
];

const commentValidation = [
   body('videoId')
      .notEmpty().withMessage('Video ID is required.'),
   body('text')
      .trim()
      .notEmpty().withMessage('Comment text is required.')
      .isLength({ min: 1, max: 1000 }).withMessage('Comment must be 1-1000 characters.'),
   handleValidation
];

const contactValidation = [
   body('name')
      .trim()
      .notEmpty().withMessage('Name is required.'),
   body('email')
      .trim()
      .notEmpty().withMessage('Email is required.')
      .isEmail().withMessage('Please provide a valid email address.'),
   body('message')
      .trim()
      .notEmpty().withMessage('Message is required.')
      .isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters.'),
   handleValidation
];

const reviewValidation = [
   body('courseId')
      .notEmpty().withMessage('Course ID is required.'),
   body('rating')
      .notEmpty().withMessage('Rating is required.')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5.'),
   body('text')
      .optional()
      .isLength({ max: 1000 }).withMessage('Review text cannot exceed 1000 characters.'),
   handleValidation
];

const passwordChangeValidation = [
   body('currentPassword')
      .notEmpty().withMessage('Current password is required.'),
   body('newPassword')
      .notEmpty().withMessage('New password is required.')
      .isLength({ min: 6 }).withMessage('New password must be at least 6 characters.')
      .custom((value, { req }) => {
         if (value === req.body.currentPassword) {
            throw new Error('New password must be different from current password.');
         }
         return true;
      }),
   handleValidation
];

module.exports = {
   handleValidation,
   sanitizeString,
   sanitizeBody,
   registerValidation,
   loginValidation,
   courseValidation,
   commentValidation,
   contactValidation,
   reviewValidation,
   passwordChangeValidation
};
