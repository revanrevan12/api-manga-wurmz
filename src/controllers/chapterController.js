import ChapterService from '../services/chapterService.js'

const service = new ChapterService()

class ChapterController {
  async getChapters(req, res, next) {
    try {
      const { page = 1, limit = 50 } = req.query
      res.json(await service.getChapters(req.params.slug, parseInt(page), parseInt(limit)))
    } catch (e) { next(e) }
  }

  async getDetail(req, res, next) {
    try {
      res.json(await service.getChapterDetail(req.params.slug))
    } catch (e) { next(e) }
  }

  async getPages(req, res, next) {
    try {
      res.json(await service.getPages(req.params.slug))
    } catch (e) { next(e) }
  }
}

export default new ChapterController()
