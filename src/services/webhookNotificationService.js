// FASE 3.3 — Webhook notifications.
// Sends a Discord and/or Telegram alert when a selector stays broken after
// a self-healing attempt. Configured via env: DISCORD_WEBHOOK,
// TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID. Failures are logged but never
// thrown — notifications are best-effort.
class WebhookNotificationService {
  async sendDiscordNotification(webhookUrl, data) {
    if (!webhookUrl) return { success: false, error: 'no webhook configured' }
    try {
      const embed = {
        title: '🚨 Manga API Health Alert',
        color: 16711680,
        fields: [
          { name: 'Site', value: data.siteName || 'Unknown', inline: true },
          { name: 'Status', value: data.status || 'unhealthy', inline: true },
          { name: 'Failed Fields', value: (data.failedFields || []).join(', ') || 'None', inline: false },
          { name: 'Errors', value: (data.errors || []).slice(0, 3).join('\n') || 'None', inline: false },
        ],
        timestamp: new Date().toISOString(),
      }
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      })
      return { success: res.ok, status: res.status }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }

  async sendTelegramNotification(botToken, chatId, data) {
    if (!botToken || !chatId) return { success: false, error: 'no telegram config' }
    try {
      const message = [
        '🚨 *Manga API Health Alert*',
        '',
        `*Site:* ${data.siteName || 'Unknown'}`,
        `*Status:* ${data.status || 'unhealthy'}`,
        `*Failed Fields:* ${(data.failedFields || []).join(', ') || 'None'}`,
        '',
        '*Errors:*',
        ...(data.errors || []).slice(0, 3).map((e) => `• ${e}`),
        '',
        `*Time:* ${new Date().toISOString()}`,
      ].join('\n')
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
      })
      return { success: res.ok, status: res.status }
    } catch (e) {
      return { success: false, error: e.message }
    }
  }
}

export default WebhookNotificationService
