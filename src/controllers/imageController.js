import axios from 'axios'
import AppError from '../errors/AppError.js'

const DEFAULT_REFERER = 'https://wurmz.net'

class ImageController {
  async proxy(req, res, next) {
    try {
      const { url, referer } = req.query
      if (!url) throw AppError.invalidInput('url query param is required')
      if (!/^https?:\/\//i.test(url)) {
        throw AppError.invalidInput('Invalid url', 'Must be an absolute http(s) URL')
      }
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Referer: referer || DEFAULT_REFERER,
          Accept: 'image/*,*/*;q=0.8',
        },
        validateStatus: () => true,
      })
      if (response.status !== 200) {
        throw AppError.network(`HTTP ${response.status}`, `Image fetch failed: ${url}`)
      }
      const contentType = response.headers['content-type'] || 'image/jpeg'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'public, max-age=86400')
      res.send(Buffer.from(response.data))
    } catch (e) { next(e) }
  }
}

export default new ImageController()
