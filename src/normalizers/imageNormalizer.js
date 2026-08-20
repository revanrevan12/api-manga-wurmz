class ImageNormalizer {
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

  normalize(rawUrls) {
    return rawUrls.map((imageUrl, i) => ({
      id: `page-${i + 1}`,
      number: i + 1,
      imageUrl: this.normalizeUrl(imageUrl),
      source: 'wurmz',
    }))
  }
}

export default ImageNormalizer
