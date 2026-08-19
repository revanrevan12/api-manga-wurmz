import express from 'express'

const router = express.Router()

router.get('/', (_req, res) => {
  res.json({
    status: true,
    message: 'Wurmz API is running',
    timestamp: new Date().toISOString(),
  })
})

export default router
