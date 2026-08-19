import * as cheerio from 'cheerio'
import WebsiteFetcher from '../fetchers/websiteFetcher.js'
import config from '../config/config.js'

const IMG_ATTRS = ['src', 'data-src', 'data-lazy-src', 'data-original']

// FASE 3.1 — Selector re-detection.
// When the health check flags a field as broken 3x in a row, this service
// re-derives selectors from a fresh scrape of the source and validates them
// against the sample URLs before they are accepted.
class SelectorRedetectionService {
  constructor(baseUrl, sampleUrls) {
    this.baseUrl = (baseUrl || config.baseUrl).replace(/\/+$/, '')
    this.sampleUrls = sampleUrls?.length ? sampleUrls : config.sampleUrls || []
    this.fetcher = new WebsiteFetcher(this.baseUrl)
  }

  async redetectSelectors(html) {
    try {
      const $ = cheerio.load(html)
      const newSelectors = {}

      // Detect card container: the most repeated element class on the page.
      const cardSel = this.detectCard($)
      if (cardSel) newSelectors.card = cardSel

      const $cards = $(cardSel)
      if ($cards.length === 0) {
        return { success: false, error: 'No manga cards detected', newSelectors: null }
      }

      // Detect field selectors from the first few cards.
      $cards.slice(0, 5).each((i, card) => {
        const $card = $(card)
        if (i === 0) {
          const title = this.detectTitle($, $card)
          const cover = this.detectCover($, $card)
          const link = this.detectLink($, $card)
          if (title) newSelectors.title = [title]
          if (cover) newSelectors.cover = [cover]
          if (link) newSelectors.link = [link]
        }
      })

      const validation = await this.validateNewSelectors(newSelectors)
      return {
        success: validation.success,
        newSelectors,
        validation,
        confidence: validation.confidence,
      }
    } catch (e) {
      return { success: false, error: e.message, newSelectors: null }
    }
  }

  detectCard($) {
    const counts = {}
    $('div, ul, li, article, section, a').each((_, el) => {
      const cls = ($(el).attr('class') || '').trim()
      if (!cls) return
      const first = cls.split(/\s+/)[0]
      const sel = `.${first}`
      const n = $(sel).length
      if (n >= 5) counts[sel] = (counts[sel] || 0) + n
    })
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return top ? top[0] : null
  }

  detectTitle($, $card) {
    const candidates = ['h2', 'h3', 'h4', '.title', '[class*="title"]', 'a']
    for (const c of candidates) {
      const $el = $card.find(c).first()
      if ($el.length && $el.text().trim()) return c
    }
    return null
  }

  detectCover($, $card) {
    const $img = $card.find('img').first()
    if ($img.length) return 'img'
    return null
  }

  detectLink($, $card) {
    const $a = $card.find('a[href]').first()
    if ($a.length) return 'a[href]'
    return null
  }

  async validateNewSelectors(selectors) {
    const validation = { success: true, confidence: 0, results: {} }
    let total = 0
    let count = 0
    for (const [field, selectorArray] of Object.entries(selectors)) {
      if (field === 'card') {
        validation.results[field] = { selector: selectorArray, confidence: 90 }
        total += 90
        count++
        continue
      }
      const sel = Array.isArray(selectorArray) ? selectorArray[0] : selectorArray
      const rate = await this.validateSelector(sel, field)
      validation.results[field] = { selector: sel, confidence: rate }
      if (rate < 50) validation.success = false
      total += rate
      count++
    }
    validation.confidence = count > 0 ? Math.round(total / count) : 0
    return validation
  }

  async validateSelector(selector, field) {
    let ok = 0
    let tested = 0
    for (const url of this.sampleUrls.slice(0, 3)) {
      try {
        const html = await this.fetcher.fetch(url)
        const $ = cheerio.load(html)
        const $el = $(selector).first()
        tested++
        if ($el.length) {
          if (field === 'cover') {
            const v = IMG_ATTRS.map((a) => $el.attr(a)).find(Boolean)
            if (v) ok++
          } else if (field === 'link') {
            if ($el.attr('href')) ok++
          } else if ($el.text().trim()) {
            ok++
          }
        }
      } catch {
        tested++
      }
    }
    return tested > 0 ? Math.round((ok / tested) * 100) : 0
  }
}

export default SelectorRedetectionService
