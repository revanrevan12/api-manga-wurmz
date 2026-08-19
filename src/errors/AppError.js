class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.name = 'AppError'
  }

  static NETWORK = 'NETWORK_ERROR'
  static PARSE = 'PARSE_ERROR'
  static NOT_FOUND = 'NOT_FOUND'
  static RATE_LIMIT = 'RATE_LIMIT'
  static INVALID_INPUT = 'INVALID_INPUT'
  static CACHE_ERROR = 'CACHE_ERROR'
  static INTERNAL = 'INTERNAL_ERROR'

  static network(message, details) {
    return new AppError(this.NETWORK, message, 503, details)
  }
  static parse(message, details) {
    return new AppError(this.PARSE, message, 400, details)
  }
  static notFound(message, details) {
    return new AppError(this.NOT_FOUND, message, 404, details)
  }
  static rateLimit(message, details) {
    return new AppError(this.RATE_LIMIT, message, 429, details)
  }
  static invalidInput(message, details) {
    return new AppError(this.INVALID_INPUT, message, 400, details)
  }
  static cache(message, details) {
    return new AppError(this.CACHE_ERROR, message, 500, details)
  }

  toJSON() {
    return {
      status: false,
      error: this.code,
      message: this.message,
      details: this.details,
    }
  }
}

export default AppError
