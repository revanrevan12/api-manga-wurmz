import WebsiteFetcher from '../fetchers/websiteFetcher.js'
import MangaParser from '../parsers/mangaParser.js'
import MangaNormalizer from '../normalizers/mangaNormalizer.js'
import CacheManager from '../cache/cacheManager.js'
import AppError from '../errors/AppError.js'
import config from '../config/config.js'

class MangaService {
  constructor() {
    this.fetcher = new WebsiteFetcher(config.baseUrl)
    this.parser = new MangaParser(config.selectors)
    this.normalizer = new MangaNormalizer(config.baseUrl)
    this.cache = new CacheManager(config.cache.maxSize)
    this.selectors = config.selectors
    this.baseUrl = config.baseUrl
  }

  async _getList(urlTemplate, { page, limit }, cacheKey) {
    // Fresh cache hit.
    const cached = this.cache.get(cacheKey, false)
    if (cached) return cached.data
    try {
      const url = this.buildUrl(urlTemplate, { page, limit })
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
      // FASE 3: never 500 — serve stale cache when available.
      const stale = this.cache.get(cacheKey, true)
      if (stale && stale.stale) {
        return { ...stale.data, stale: true }
      }
      if (error instanceof AppError) throw error
      throw AppError.network('Failed to get manga list', error.message)
    }
  }

  async getPopular(page = 1, limit = 20) {
    return this._getList(this.selectors.popularUrl, { page, limit }, `popular:${page}:${limit}`)
  }

  async getLatest(page = 1, limit = 20) {
    return this._getList(this.selectors.latestUrl, { page, limit }, `latest:${page}:${limit}`)
  }

  async getDetail(slug) {
    if (!slug) throw AppError.invalidInput('Slug is required')
    const cacheKey = `detail:${slug}`
    const cached = this.cache.get(cacheKey, false)
    if (cached) return cached.data
    try {
      const url = this.buildUrl(this.selectors.detailUrl, { slug })
      const html = await this.fetcher.fetch(url)
      const raw = this.parser.parseDetail(html, url)
      const data = this.normalizer.normalize(raw)
      const response = { status: true, data }
      this.cache.set(cacheKey, response, config.cache.ttl.detail)
      return response
    } catch (error) {
      const stale = this.cache.get(cacheKey, true)
      if (stale && stale.stale) return { ...stale.data, stale: true }
      if (error instanceof AppError) throw error
      throw AppError.network('Failed to get manga detail', error.message)
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

export default MangaService
