import * as cheerio from 'cheerio'
import AppError from '../errors/AppError.js'

const IMG_ATTRS = ['src', 'data-src', 'data-lazy-src', 'data-original', 'srcset']

class MangaParser {
  constructor(selectors) {
    this.selectors = selectors
  }

  parseList(html) {
    try {
      const $ = cheerio.load(html)
      const manga = []
      const cardSelector = this.selectors.card
      if (!cardSelector) {
        throw AppError.parse('No card selector configured', 'selectors.card is empty')
      }
      const cards = $(cardSelector)
      if (cards.length === 0) {
        throw AppError.parse('No manga cards found', `Selector '${cardSelector}' returned 0 elements`)
      }

      cards.each((_, card) => {
        const $card = $(card)
        const title = this.extractText($card, this.selectors.title)
        const cover = this.extractAttr($card, this.selectors.cover, IMG_ATTRS)
        const url = this.extractAttr($card, this.selectors.link, ['href'])
        if (!title && !url) return
        manga.push({ title, cover, url, slug: this.generateSlug(url, title) })
      })

      if (manga.length === 0) {
        throw AppError.parse('No valid manga extracted', 'All cards failed to extract required fields')
      }
      return manga
    } catch (error) {
      if (error instanceof AppError) throw error
      throw AppError.parse('Parse error', error.message)
    }
  }

  parseDetail(html, url) {
    try {
      const $ = cheerio.load(html)
      const detail = {
        title: this.extractText($, this.selectors.title),
        cover: this.extractAttr($, this.selectors.cover, IMG_ATTRS),
        author: this.extractText($, this.selectors.author),
        artist: this.extractText($, this.selectors.artist),
        status: this.extractText($, this.selectors.status),
        synopsis: this.extractText($, this.selectors.synopsis),
        genres: this.extractGenres($, this.selectors.genres),
        url,
        slug: this.generateSlug(url, this.extractText($, this.selectors.title)),
      }
      return detail
    } catch (error) {
      if (error instanceof AppError) throw error
      throw AppError.parse('Parse detail error', error.message)
    }
  }

  // Try each selector in the fallback array; return first non-empty text.
  extractText($ctx, selectorArray) {
    if (!Array.isArray(selectorArray) || selectorArray.length === 0) return null
    for (const selector of selectorArray) {
      if (!selector || selector === '&') {
        // '&' convention: the context element itself.
        const text = $ctx.text().replace(/\s+/g, ' ').trim()
        if (text) return text
        continue
      }
      const $el = $ctx.find(selector).first()
      if ($el.length === 0) continue
      const text = $el.text().replace(/\s+/g, ' ').trim()
      if (text) return text
    }
    return null
  }

  // Try each selector; return first non-empty attribute from the attr list.
  extractAttr($ctx, selectorArray, attrs) {
    if (!Array.isArray(selectorArray) || selectorArray.length === 0) return null
    for (const selector of selectorArray) {
      const $el = selector === '&' ? $ctx : $ctx.find(selector).first()
      if ($el.length === 0) continue
      for (const attr of attrs) {
        let value = $el.attr(attr)
        if (!value) continue
        if (attr === 'srcset') value = value.split(',')[0].trim().split(/\s+/)[0]
        if (value && !value.startsWith('data:')) return value
      }
    }
    return null
  }

  extractGenres($, selectorArray) {
    const genres = []
    if (!Array.isArray(selectorArray) || selectorArray.length === 0) return genres
    for (const selector of selectorArray) {
      $(selector).each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim()
        if (text && text.length < 40 && !genres.includes(text)) genres.push(text)
      })
      if (genres.length > 0) break
    }
    return genres
  }

  generateSlug(url, title) {
    if (url) {
      try {
        const urlObj = new URL(url, this.selectors.detailUrl || 'http://example.com')
        const parts = urlObj.pathname.split('/').filter(Boolean)
        const path = parts[parts.length - 1] || parts[parts.length - 2]
        if (path) return path.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
      } catch {
        // fall through
      }
    }
    if (title) {
      return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
    }
    return null
  }
}

export default MangaParser
