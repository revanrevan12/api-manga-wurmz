import express from 'express'
import dotenv from 'dotenv'
import corsHandler from './middleware/corsHandler.js'
import rateLimitHandler from './middleware/rateLimitHandler.js'
import errorHandler from './middleware/errorHandler.js'
import createRoutes from './routes/index.js'
import config from './config/config.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(corsHandler)
app.use(rateLimitHandler)
app.use(express.json())

// Routes
app.use('/api', createRoutes())

// Root health (outside /api prefix for quick checks)
app.get('/health', (_req, res) => {
  res.json({ status: true, message: 'Wurmz API is running', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ status: false, error: 'NOT_FOUND', message: 'Endpoint not found' })
})

// Centralized error handler (must be last)
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`[Wurmz] API running on port ${PORT}`)
})

export default app
