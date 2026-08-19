import express from 'express'
import searchController from '../controllers/searchController.js'

const router = express.Router()

router.get('/', (req, res, next) => searchController.search(req, res, next))

export default router
