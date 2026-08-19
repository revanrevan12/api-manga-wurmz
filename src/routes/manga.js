import express from 'express'
import mangaController from '../controllers/mangaController.js'

// /api/popular and /api/latest are mounted directly, so they need their own
// routers here. /api/manga is mounted at /manga and carries the detail route.
const popular = express.Router()
popular.get('/', (req, res, next) => mangaController.getPopular(req, res, next))

const latest = express.Router()
latest.get('/', (req, res, next) => mangaController.getLatest(req, res, next))

const detail = express.Router()
detail.get('/:slug', (req, res, next) => mangaController.getDetail(req, res, next))
detail.get('/:slug/chapters', (req, res, next) => {
  // Forwarded to chapterController via the /chapter mount in routes/index.js
  // but /api/manga/:slug/chapters is part of the spec, so wire it here too.
  import('../controllers/chapterController.js').then(({ default: c }) =>
    c.getChapters(req, res, next),
  )
})

export default { popular, latest, detail }
