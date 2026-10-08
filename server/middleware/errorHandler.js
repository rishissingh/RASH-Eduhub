/**
 * Global Error Handler Middleware
 */

const errorHandler = (err, req, res, next) => {
   console.error('❌ Error:', err.message);

   // Mongoose bad ObjectId
   if (err.name === 'CastError') {
      return res.status(400).json({ success: false, message: 'Invalid resource ID format.' });
   }

   // Mongoose duplicate key
   if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({ success: false, message: `Duplicate value for field: ${field}` });
   }

   // Mongoose validation error
   if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
   }

   // JWT errors
   if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
   }

   if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
   }

   // Default server error
   res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal Server Error'
   });
};

module.exports = { errorHandler };
