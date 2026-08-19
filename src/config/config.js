import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const selectorsPath = path.join(__dirname, 'selectors.json')
const selectors = JSON.parse(fs.readFileSync(selectorsPath, 'utf8'))

const config = {
  siteName: process.env.SITE_NAME || 'Wurmz',
  sourceSlug: 'wurmz',
  baseUrl: (process.env.SOURCE_URL || 'https://wurmz.net').replace(/\/+$/, ''),
  selectors,
  sampleUrls: (process.env.SAMPLE_URLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  github: {
    token: process.env.GITHUB_TOKEN || '',
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    branch: process.env.GITHUB_BRANCH || 'main',
  },
  notifications: {
    discordWebhook: process.env.DISCORD_WEBHOOK || '',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  cache: {
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '500'),
    ttl: {
      list: parseInt(process.env.CACHE_TTL_LIST || '600'),
      detail: parseInt(process.env.CACHE_TTL_DETAIL || '3600'),
      chapter: parseInt(process.env.CACHE_TTL_CHAPTER || '86400'),
    },
  },
  fetcher: {
    timeout: parseInt(process.env.API_TIMEOUT || '10000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
    maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '3'),
  },
}

export default config
