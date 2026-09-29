// 404 for unknown routes
function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central error handler: any error passed to next(err) ends up here
function errorHandler(err, req, res, next) {
  // Mongoose validation error (e.g. missing title)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({ message });
  }
  // Invalid ObjectId in the URL
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id' });
  }
  // Two sign-ups with the same email at the same time
  if (err.code === 11000) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on the server' });
}

module.exports = { notFound, errorHandler };
