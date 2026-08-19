class ChapterNormalizer {
  constructor(baseUrl) {
    this.baseUrl = (baseUrl || '').replace(/\/+$/, '')
  }

  normalizeUrl(url) {
    if (!url) return null
    if (/^https?:\/\//i.test(url)) return url
    if (url.startsWith('//')) return 'https:' + url
    if (url.startsWith('/')) return this.baseUrl + url
    return this.baseUrl + '/' + url
  }

  normalize(raw) {
    return {
      id: raw.slug || String(raw.number),
      slug: raw.slug || String(raw.number),
      mangaSlug: raw.mangaSlug || null,
      number: raw.number || 0,
      title: raw.title || '',
      url: this.normalizeUrl(raw.url),
      source: 'Wurmz',
    }
  }

  normalizeList(rawList) {
    return rawList.map((r) => this.normalize(r))
  }

  normalizePagination(page, limit, total) {
    const p = parseInt(page) || 1
    const l = parseInt(limit) || 50
    const t = parseInt(total) || 0
    return { page: p, limit: l, total: t, pages: Math.ceil(t / l) || 0 }
  }
}

export default ChapterNormalizer
