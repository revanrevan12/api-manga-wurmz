import express from 'express'
import mangaRoutes from './manga.js'
import chapterRoutes from './chapter.js'
import searchRoutes from './search.js'
import imageRoutes from './image.js'
import healthRoutes from './health.js'

const router = express.Router()

router.use('/health', healthRoutes)
router.use('/popular', mangaRoutes.popular)
router.use('/latest', mangaRoutes.latest)
router.use('/search', searchRoutes)
router.use('/manga', mangaRoutes.detail)
router.use('/chapter', chapterRoutes)
router.use('/img', imageRoutes)

export default () => router
