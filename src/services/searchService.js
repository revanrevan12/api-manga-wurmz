import WebsiteFetcher from '../fetchers/websiteFetcher.js'
import MangaParser from '../parsers/mangaParser.js'
import MangaNormalizer from '../normalizers/mangaNormalizer.js'
import CacheManager from '../cache/cacheManager.js'
import AppError from '../errors/AppError.js'
import config from '../config/config.js'

class SearchService {
  constructor() {
    this.fetcher = new WebsiteFetcher(config.baseUrl)
    this.parser = new MangaParser(config.selectors)
    this.normalizer = new MangaNormalizer(config.baseUrl)
    this.cache = new CacheManager(config.cache.maxSize)
    this.selectors = config.selectors
  }

  async search(q, page = 1, limit = 20) {
    if (!q || q.length < 2) {
      throw AppError.invalidInput('Query too short', 'Minimum 2 characters')
    }
    const cacheKey = `search:${q}:${page}:${limit}`
    const cached = this.cache.get(cacheKey, false)
    if (cached) return cached.data
    try {
      const url = this.buildUrl(this.selectors.searchUrl, { q, page, limit })
      const html = await this.fetcher.fetch(url)
      const raw = this.parser.parseList(html)
      const manga = this.normalizer.normalizeList(raw)
      const response = {
        status: true,
        data: manga,
        pagination: this.normalizer.normalizePagination(page, limit, manga.length * 5),
      }
      this.cache.set(cacheKey, response, config.cache.ttl.list)
      return response
    } catch (error) {
      const stale = this.cache.get(cacheKey, true)
      if (stale && stale.stale) return { ...stale.data, stale: true }
      if (error instanceof AppError) throw error
      throw AppError.network('Failed to search manga', error.message)
    }
  }

  buildUrl(template, params) {
    let url = template || ''
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(new RegExp(`{${key}}`, 'g'), encodeURIComponent(value))
    }
    return url
  }
}

export default SearchService
