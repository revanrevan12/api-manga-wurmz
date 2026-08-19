import express from 'express'
import chapterController from '../controllers/chapterController.js'

const router = express.Router()

router.get('/:slug', (req, res, next) => chapterController.getDetail(req, res, next))
router.get('/:slug/pages', (req, res, next) => chapterController.getPages(req, res, next))

export default router
