import express from 'express'
import imageController from '../controllers/imageController.js'

const router = express.Router()

router.get('/', (req, res, next) => imageController.proxy(req, res, next))

export default router
