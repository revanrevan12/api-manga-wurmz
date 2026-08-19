import fs from 'fs'
import path from 'path'
import HealthCheckService from '../services/healthCheckService.js'
import SelectorRedetectionService from '../services/selectorRedetectionService.js'
import GitHubAutoCommitService from '../services/githubAutoCommitService.js'
import WebhookNotificationService from '../services/webhookNotificationService.js'
import WebsiteFetcher from '../fetchers/websiteFetcher.js'
import PresetManager from '../utils/presetManager.js'
import config from '../config/config.js'

// FASE 3 — daily health check script (run by the GitHub Actions workflow or
// manually via `npm run health-check`). Runs the self-healing flow, commits
// repaired selectors to GitHub, updates the preset + history, and sends a
// webhook notification if a selector stays broken.
async function runHealthCheck() {
  console.log('Starting health check for', config.siteName || 'Wurmz')
  try {
    const healthCheck = new HealthCheckService(config.baseUrl, config.selectors, config.sampleUrls)
    const result = await healthCheck.runHealthCheck()
    console.log('Health check result:', JSON.stringify(result, null, 2))

    // Save a local health report.
    const reportPath = path.join(process.cwd(), 'presets', 'health-report.json')
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2))

    // Self-heal when a field is broken.
    if (result.needsRedetection) {
      console.log('Broken fields detected, attempting re-detection...')
      const fetcher = new WebsiteFetcher(config.baseUrl)
      const sampleUrl = config.sampleUrls[0] || config.selectors.popularUrl
      const html = await fetcher.fetch(sampleUrl)
      const redetector = new SelectorRedetectionService(config.baseUrl, config.sampleUrls)
      const redetection = await redetector.redetectSelectors(html)

      if (redetection.success && redetection.confidence >= 70) {
        console.log('New selectors validated, committing to GitHub...')
        if (config.github.token && config.github.owner && config.github.repo) {
          const github = new GitHubAutoCommitService(
            config.github.token, config.github.owner, config.github.repo, config.github.branch,
          )
          const dateTag = new Date().toISOString().split('T')[0]
          const message = `auto: perbaiki selector ${config.siteName} ${dateTag}`
          await github.updateSelectors('src/config/selectors.json', redetection.newSelectors, message)

          // Update preset + history.
          const preset = PresetManager.loadPreset(config.sourceSlug) || {}
          preset.selectors = redetection.newSelectors
          preset.version = bumpVersion(preset.version)
          preset.lastVerified = new Date().toISOString()
          preset.health = result
          PresetManager.saveSitePreset(config.sourceSlug, preset)
          PresetManager.addToHistory(config.sourceSlug, {
            version: preset.version,
            date: dateTag,
            changes: result.failedFields.map((f) => `perbaiki selector ${f}`),
          })
          result.autoFixed = true
        } else {
          console.log('GitHub credentials not set — skipping auto-commit.')
        }
      } else {
        console.log('Auto-fix failed:', redetection.error || 'confidence too low')
        await sendNotifications(result)
      }
    }

    console.log('Health check completed')
    process.exit(0)
  } catch (e) {
    console.error('Health check failed:', e)
    process.exit(1)
  }
}

function bumpVersion(v) {
  const parts = String(v || '1.0.0').split('.').map((n) => parseInt(n, 10) || 0)
  while (parts.length < 3) parts.push(0)
  parts[2] += 1
  return parts.join('.')
}

async function sendNotifications(result) {
  const notifier = new WebhookNotificationService()
  const payload = {
    siteName: config.siteName,
    status: result.status,
    failedFields: result.failedFields,
    errors: result.failedFields.map((f) => `Field '${f}' failed 3 times`),
  }
  if (config.notifications.discordWebhook) {
    await notifier.sendDiscordNotification(config.notifications.discordWebhook, payload)
  }
  if (config.notifications.telegramBotToken && config.notifications.telegramChatId) {
    await notifier.sendTelegramNotification(
      config.notifications.telegramBotToken, config.notifications.telegramChatId, payload,
    )
  }
}

runHealthCheck()
