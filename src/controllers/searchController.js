import SearchService from '../services/searchService.js'

const service = new SearchService()

class SearchController {
  async search(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query
      res.json(await service.search(q, parseInt(page), parseInt(limit)))
    } catch (e) { next(e) }
  }
}

export default new SearchController()
