import WebsiteFetcher from '../fetchers/websiteFetcher.js'
import ChapterParser from '../parsers/chapterParser.js'
import ChapterNormalizer from '../normalizers/chapterNormalizer.js'
import ImageParser from '../parsers/imageParser.js'
import ImageNormalizer from '../normalizers/imageNormalizer.js'
import CacheManager from '../cache/cacheManager.js'
import AppError from '../errors/AppError.js'
import config from '../config/config.js'

class ChapterService {
  constructor() {
    this.fetcher = new WebsiteFetcher(config.baseUrl)
    this.chapterParser = new ChapterParser(config.selectors)
    this.chapterNormalizer = new ChapterNormalizer(config.baseUrl)
    this.imageParser = new ImageParser(config.selectors)
    this.imageNormalizer = new ImageNormalizer(config.baseUrl)
    this.cache = new CacheManager(config.cache.maxSize)
    this.selectors = config.selectors
    this.baseUrl = config.baseUrl
  }

  async _withStale(cacheKey, ttl, fn, errLabel) {
    const cached = this.cache.get(cacheKey, false)
    if (cached) return cached.data
    try {
      const response = await fn()
      this.cache.set(cacheKey, response, ttl)
      return response
    } catch (error) {
      const stale = this.cache.get(cacheKey, true)
      if (stale && stale.stale) return { ...stale.data, stale: true }
      if (error instanceof AppError) throw error
      throw AppError.network(errLabel, error.message)
    }
  }

  async getChapters(slug, page = 1, limit = 50) {
    if (!slug) throw AppError.invalidInput('Slug is required')
    const cacheKey = `chapters:${slug}:${page}:${limit}`
    return this._withStale(cacheKey, config.cache.ttl.chapter, async () => {
      const url = this.buildUrl(this.selectors.chapterUrl, { slug })
      const html = await this.fetcher.fetch(url)
      const raw = this.chapterParser.parseChapters(html, slug)
      const chapters = this.chapterNormalizer.normalizeList(raw)
      const start = (page - 1) * limit
      const slice = chapters.slice(start, start + limit)
      return {
        status: true,
        data: slice,
        pagination: this.chapterNormalizer.normalizePagination(page, limit, chapters.length),
      }
    }, 'Failed to get chapters')
  }

  async getChapterDetail(slug) {
    if (!slug) throw AppError.invalidInput('Slug is required')
    const cacheKey = `chapter:${slug}`
    return this._withStale(cacheKey, config.cache.ttl.chapter, async () => {
      const url = this.buildUrl(this.selectors.readerUrl, { slug })
      const html = await this.fetcher.fetch(url)
      const raw = this.chapterParser.parseChapterDetail(html, url)
      const data = this.chapterNormalizer.normalize({ ...raw, slug })
      return { status: true, data }
    }, 'Failed to get chapter detail')
  }

  async getPages(slug) {
    if (!slug) throw AppError.invalidInput('Slug is required')
    const cacheKey = `pages:${slug}`
    return this._withStale(cacheKey, config.cache.ttl.chapter, async () => {
      const url = this.buildUrl(this.selectors.readerUrl, { slug })
      const html = await this.fetcher.fetch(url)
      const raw = this.imageParser.parsePages(html)
      const pages = this.imageNormalizer.normalize(raw)
      return { status: true, data: pages }
    }, 'Failed to get pages')
  }

  buildUrl(template, params) {
    let url = template || ''
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value))
    }
    return url
  }
}

export default ChapterService
