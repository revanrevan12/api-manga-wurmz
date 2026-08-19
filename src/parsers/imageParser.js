import * as cheerio from 'cheerio'
import AppError from '../errors/AppError.js'

const IMG_ATTRS = ['src', 'data-src', 'data-lazy-src', 'data-original', 'srcset']

class ImageParser {
  constructor(selectors) {
    this.selectors = selectors
  }

  parsePages(html) {
    try {
      const $ = cheerio.load(html)
      const out = []
      const sel = this.selectors.pages || ['img']
      const list = Array.isArray(sel) ? sel : [sel]
      for (const s of list) {
        $(s).each((_, el) => {
          const $el = $(el)
          for (const attr of IMG_ATTRS) {
            let v = $el.attr(attr)
            if (!v) continue
            if (attr === 'srcset') v = v.split(',')[0].trim().split(/\s+/)[0]
            if (v && !v.startsWith('data:') && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(v)) {
              out.push(v)
            }
          }
        })
        if (out.length > 0) break
      }
      return out
    } catch (error) {
      if (error instanceof AppError) throw error
      throw AppError.parse('Parse pages error', error.message)
    }
  }
}

export default ImageParser
