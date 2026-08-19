import axios from 'axios'
import AppError from '../errors/AppError.js'
import config from '../config/config.js'

class WebsiteFetcher {
  constructor(baseUrl) {
    this.baseUrl = (baseUrl || config.baseUrl).replace(/\/+$/, '')
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36',
    ]
    this.requestQueue = []
    this.maxConcurrent = config.fetcher.maxConcurrent
    this.activeRequests = 0
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)]
  }

  fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject })
      this.processQueue()
    })
  }

  processQueue() {
    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const { url, options, resolve, reject } = this.requestQueue.shift()
      this.activeRequests++
      this.fetchWithRetry(url, options)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          this.activeRequests--
          this.processQueue()
        })
    }
  }

  async fetchWithRetry(url, options = {}, attempt = 1) {
    const maxRetries = config.fetcher.maxRetries
    const delays = [1000, 2000, 4000]

    try {
      const response = await axios.get(url, {
        timeout: options.timeout || config.fetcher.timeout,
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          Referer: this.baseUrl,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          DNT: '1',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers,
        },
        validateStatus: () => true,
        responseType: 'text',
      })

      if (response.status === 200) return response.data

      if (response.status === 429 || response.status === 403) {
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, delays[attempt - 1] || 4000))
          return this.fetchWithRetry(url, options, attempt + 1)
        }
        throw AppError.network(
          `HTTP ${response.status}`,
          `Website returned ${response.status} after ${attempt} attempts: ${url}`,
        )
      }

      if (response.status === 404) {
        throw AppError.notFound('Page not found', `URL returned 404: ${url}`)
      }

      throw AppError.network(`HTTP ${response.status}`, `Failed to fetch: ${url}`)
    } catch (error) {
      if (error instanceof AppError) throw error
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, delays[attempt - 1] || 4000))
        return this.fetchWithRetry(url, options, attempt + 1)
      }
      throw AppError.network('Network error', error.message)
    }
  }
}

export default WebsiteFetcher
