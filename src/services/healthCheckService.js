import * as cheerio from 'cheerio'
import WebsiteFetcher from '../fetchers/websiteFetcher.js'
import config from '../config/config.js'
import AppError from '../errors/AppError.js'

const IMG_ATTRS = ['src', 'data-src', 'data-lazy-src', 'data-original', 'srcset']

// FASE 3.1 — Self-healing health check.
// Scrapes up to 3 sample URLs (list, detail, reader), tests every configured
// field selector, computes a per-field success rate, and tracks consecutive
// failures. A field that fails 3 times in a row flags needsRedetection so
// the re-detection service can repair it.
class HealthCheckService {
  constructor(baseUrl, selectors, sampleUrls) {
    this.fetcher = new WebsiteFetcher(baseUrl || config.baseUrl)
    this.selectors = selectors || config.selectors
    this.sampleUrls = sampleUrls?.length ? sampleUrls : config.sampleUrls || []
    this.failureCount = {}
  }

  async runHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      fields: {},
      failedFields: [],
      needsRedetection: false,
      siteName: config.siteName || 'Wurmz',
    }

    // Resolve sample pages: index 0 = list, 1 = detail, 2 = reader.
    const samples = await this.fetchSamples()
    if (samples.length === 0) {
      results.status = 'unhealthy'
      results.error = 'Tidak bisa mengambil sample URL manapun'
      return results
    }

    for (const [field, selectorArray] of Object.entries(this.selectors)) {
      // Skip URL templates (string, not array) and the card container.
      if (!Array.isArray(selectorArray)) continue
      if (field.endsWith('Url')) continue

      const fr = await this.testField(field, selectorArray, samples)
      results.fields[field] = fr

      if (fr.successRate < 60) {
        this.failureCount[field] = (this.failureCount[field] || 0) + 1
        if (this.failureCount[field] >= 3) {
          results.failedFields.push(field)
          results.needsRedetection = true
        }
      } else {
        this.failureCount[field] = 0
      }
    }

    if (results.failedFields.length > 0) results.status = 'unhealthy'
    return results
  }

  async fetchSamples() {
    const out = []
    const urls = this.sampleUrls.slice(0, 3)
    for (const url of urls) {
      try {
        const html = await this.fetcher.fetch(url)
        out.push({ url, html })
      } catch (e) {
        out.push({ url, html: null, error: e.message })
      }
    }
    return out
  }

  async testField(field, selectorArray, samples) {
    const results = { field, tested: 0, success: 0, failed: 0, successRate: 0, errors: [] }
    for (const sample of samples) {
      if (!sample.html) {
        results.tested++
        results.failed++
        results.errors.push(`No HTML for ${sample.url}`)
        continue
      }
      try {
        const $ = cheerio.load(sample.html)
        const value = this.extractField($, selectorArray, field)
        results.tested++
        if (value && (Array.isArray(value) ? value.length > 0 : String(value).length > 0)) {
          results.success++
        } else {
          results.failed++
          results.errors.push(`Empty result from ${sample.url}`)
        }
      } catch (e) {
        results.tested++
        results.failed++
        results.errors.push(`Error: ${e.message}`)
      }
    }
    results.successRate = results.tested > 0
      ? Math.round((results.success / results.tested) * 100)
      : 0
    return results
  }

  extractField($, selectorArray, field) {
    for (const selector of selectorArray) {
      if (!selector || selector === '&') {
        const text = $.root().text().replace(/\s+/g, ' ').trim()
        if (text) return text
        continue
      }
      const $el = $(selector).first()
      if ($el.length === 0) continue
      if (field === 'cover' || field === 'pages') {
        for (const attr of IMG_ATTRS) {
          let v = $el.attr(attr)
          if (!v) continue
          if (attr === 'srcset') v = v.split(',')[0].trim().split(/\s+/)[0]
          if (v && !v.startsWith('data:')) return v
        }
      } else if (field === 'link' || field === 'chapterUrl') {
        const v = $el.attr('href')
        if (v) return v
      } else if (field === 'genres') {
        const items = []
        $(selector).each((_, el) => {
          const t = $(el).text().trim()
          if (t && t.length < 40) items.push(t)
        })
        if (items.length) return items
      } else {
        const text = $el.text().replace(/\s+/g, ' ').trim()
        if (text) return text
      }
    }
    return null
  }
}

export default HealthCheckService
