// client.js — Manga API Client SDK (FASE 5)
//
// A tiny, dependency-free client for the generated Manga API. Paste this
// file into any website, point it at the API base URL, and call any of the
// endpoints. Includes an in-memory cache with per-endpoint TTLs.

class MangaAPIClient {
  constructor(apiUrl) {
    this.apiUrl = String(apiUrl || '').replace(/\/+$/, '')
    this.cache = new Map()
    this.cacheTTL = {
      list: 10 * 60 * 1000,
      detail: 60 * 60 * 1000,
      chapter: 24 * 60 * 60 * 1000
    }
  }

  async getPopular(page = 1, limit = 20) {
    const cacheKey = `popular:${page}:${limit}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    const response = await this.fetch(`/api/popular?page=${page}&limit=${limit}`)
    this.setCache(cacheKey, response, this.cacheTTL.list)
    return response
  }

  async getLatest(page = 1, limit = 20) {
    const cacheKey = `latest:${page}:${limit}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    const response = await this.fetch(`/api/latest?page=${page}&limit=${limit}`)
    this.setCache(cacheKey, response, this.cacheTTL.list)
    return response
  }

  async search(query, page = 1, limit = 20) {
    if (!query || query.length < 2) {
      throw new Error('Query minimal 2 karakter')
    }
    const cacheKey = `search:${query}:${page}:${limit}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    const response = await this.fetch(`/api/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)
    this.setCache(cacheKey, response, this.cacheTTL.list)
    return response
  }

  async getManga(slug) {
    const cacheKey = `manga:${slug}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    const response = await this.fetch(`/api/manga/${slug}`)
    this.setCache(cacheKey, response, this.cacheTTL.detail)
    return response
  }

  async getChapters(slug, page = 1, limit = 50) {
    const cacheKey = `chapters:${slug}:${page}:${limit}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    const response = await this.fetch(`/api/manga/${slug}/chapters?page=${page}&limit=${limit}`)
    this.setCache(cacheKey, response, this.cacheTTL.chapter)
    return response
  }

  async getChapter(slug) {
    const cacheKey = `chapter:${slug}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    const response = await this.fetch(`/api/chapter/${slug}`)
    this.setCache(cacheKey, response, this.cacheTTL.chapter)
    return response
  }

  async getPages(slug) {
    const cacheKey = `pages:${slug}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    const response = await this.fetch(`/api/chapter/${slug}/pages`)
    this.setCache(cacheKey, response, this.cacheTTL.chapter)
    return response
  }

  // Build a proxied image URL (bypasses hotlink protection on the source site).
  getImageUrl(url, referer = null) {
    const params = new URLSearchParams({ url })
    if (referer) params.append('referer', referer)
    return `${this.apiUrl}/api/img?${params}`
  }

  async fetch(endpoint) {
    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        headers: { Accept: 'application/json' }
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      throw new Error(`Failed to fetch ${endpoint}: ${error.message}`)
    }
  }

  getFromCache(key) {
    const item = this.cache.get(key)
    if (!item) return null
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }

  setCache(key, data, ttl) {
    this.cache.set(key, { data, expiresAt: Date.now() + ttl })
  }

  clearCache() {
    this.cache.clear()
  }
}

if (typeof window !== 'undefined') {
  window.MangaAPIClient = MangaAPIClient
}

export default MangaAPIClient
