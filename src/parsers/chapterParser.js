import * as cheerio from 'cheerio'
import AppError from '../errors/AppError.js'

class ChapterParser {
  constructor(selectors) {
    this.selectors = selectors
  }

  parseChapters(html, mangaSlug) {
    try {
      const $ = cheerio.load(html)
      const out = []
      const container = this.selectors.chapter
      if (!container) return out
      const cards = $(container)
      if (cards.length === 0) {
        throw AppError.parse('No chapters found', `Selector '${container}' returned 0 elements`)
      }
      cards.each((_, el) => {
        const $el = $(el)
        const url = this.firstAttr($el, this.selectors.chapterUrl, ['href'])
        const title = this.firstText($el, this.selectors.chapterTitle)
        const numText = this.firstText($el, this.selectors.chapterNumber) || (url || title || '')
        const match = numText.match(/[\d.]+/)
        const number = match ? parseFloat(match[0]) : 0
        out.push({ mangaSlug, url, title, number, slug: this.slugify(url, number) })
      })
      return out
    } catch (error) {
      if (error instanceof AppError) throw error
      throw AppError.parse('Parse chapters error', error.message)
    }
  }

  parseChapterDetail(html, url) {
    try {
      const $ = cheerio.load(html)
      const first = $(this.selectors.chapter).first()
      const title = this.selectors.chapterTitle?.length
        ? first.find(this.selectors.chapterTitle[0]).text().trim()
        : first.text().trim()
      const match = (title || url || '').match(/[\d.]+/)
      return { title, number: match ? parseFloat(match[0]) : 0, url }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw AppError.parse('Parse chapter detail error', error.message)
    }
  }

  firstText($ctx, selectorArray) {
    if (!Array.isArray(selectorArray) || selectorArray.length === 0) return null
    for (const selector of selectorArray) {
      if (!selector || selector === '&') {
        const t = $ctx.text().replace(/\s+/g, ' ').trim()
        if (t) return t
        continue
      }
      const $el = $ctx.find(selector).first()
      if ($el.length === 0) continue
      const t = $el.text().replace(/\s+/g, ' ').trim()
      if (t) return t
    }
    return null
  }

  firstAttr($ctx, selectorArray, attrs) {
    if (!Array.isArray(selectorArray) || selectorArray.length === 0) return null
    for (const selector of selectorArray) {
      const $el = selector === '&' ? $ctx : $ctx.find(selector).first()
      if ($el.length === 0) continue
      for (const attr of attrs) {
        const v = $el.attr(attr)
        if (v) return v
      }
    }
    return null
  }

  slugify(url, number) {
    if (url) {
      try {
        const u = new URL(url, 'http://example.com')
        const parts = u.pathname.split('/').filter(Boolean)
        const last = parts[parts.length - 1]
        if (last) return last.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
      } catch {
        // fall through
      }
    }
    return String(number || '')
  }
}

export default ChapterParser
