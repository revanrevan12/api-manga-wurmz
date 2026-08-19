import AppError from '../errors/AppError.js'

export default function errorHandler(err, _req, res, _next) {
  if (err && typeof err.toJSON === 'function') {
    return res.status(err.statusCode || 500).json(err.toJSON())
  }
  console.error('[API] unhandled error:', err)
  res.status(500).json({
    status: false,
    error: AppError.INTERNAL,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  })
}
