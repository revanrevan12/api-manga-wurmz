import MangaService from '../services/mangaService.js'

const service = new MangaService()

class MangaController {
  async getPopular(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query
      res.json(await service.getPopular(parseInt(page), parseInt(limit)))
    } catch (e) { next(e) }
  }

  async getLatest(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query
      res.json(await service.getLatest(parseInt(page), parseInt(limit)))
    } catch (e) { next(e) }
  }

  async getDetail(req, res, next) {
    try {
      res.json(await service.getDetail(req.params.slug))
    } catch (e) { next(e) }
  }
}

export default new MangaController()
