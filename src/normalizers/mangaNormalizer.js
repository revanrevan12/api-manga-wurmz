class MangaNormalizer {
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
      id: raw.slug || raw.url || null,
      slug: raw.slug || null,
      title: raw.title || 'Unknown',
      cover: this.normalizeUrl(raw.cover),
      author: raw.author || null,
      artist: raw.artist || null,
      status: this.normalizeStatus(raw.status),
      synopsis: raw.synopsis || '',
      genres: Array.isArray(raw.genres) ? raw.genres : [],
      url: raw.url || null,
      source: 'Wurmz',
      updatedAt: new Date().toISOString(),
    }
  }

  normalizeList(rawList) {
    return rawList.map((r) => this.normalize(r))
  }

  normalizeStatus(status) {
    if (!status) return 'Unknown'
    const s = status.toLowerCase()
    if (s.includes('ongoing')) return 'Ongoing'
    if (s.includes('complet')) return 'Completed'
    if (s.includes('hiatus')) return 'Hiatus'
    if (s.includes('dropp')) return 'Dropped'
    return status
  }

  normalizePagination(page, limit, total) {
    const p = parseInt(page) || 1
    const l = parseInt(limit) || 20
    const t = parseInt(total) || 0
    return { page: p, limit: l, total: t, pages: Math.ceil(t / l) || 0 }
  }
}

export default MangaNormalizer
