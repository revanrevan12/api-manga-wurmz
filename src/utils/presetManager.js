import fs from 'fs'
import path from 'path'

// FASE 3.6 — Preset management.
// Persists per-site presets (selectors + health + version) and a rolling
// history of selector changes to the presets/ directory inside the repo.
class PresetManager {
  static presetsDir() {
    return path.join(process.cwd(), 'presets')
  }

  static saveSitePreset(siteName, preset) {
    const dir = this.presetsDir()
    fs.mkdirSync(dir, { recursive: true })
    const presetPath = path.join(dir, `${siteName}.json`)
    fs.writeFileSync(presetPath, JSON.stringify(preset, null, 2))
    return presetPath
  }

  static addToHistory(siteName, entry) {
    const dir = path.join(this.presetsDir(), siteName)
    fs.mkdirSync(dir, { recursive: true })
    const historyPath = path.join(dir, 'history.json')
    let history = []
    if (fs.existsSync(historyPath)) {
      try { history = JSON.parse(fs.readFileSync(historyPath, 'utf8')) } catch { history = [] }
    }
    history.unshift(entry)
    history = history.slice(0, 50)
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2))
    return historyPath
  }

  static loadPreset(siteName) {
    const presetPath = path.join(this.presetsDir(), `${siteName}.json`)
    if (!fs.existsSync(presetPath)) return null
    return JSON.parse(fs.readFileSync(presetPath, 'utf8'))
  }

  static loadHistory(siteName) {
    const historyPath = path.join(this.presetsDir(), siteName, 'history.json')
    if (!fs.existsSync(historyPath)) return []
    try { return JSON.parse(fs.readFileSync(historyPath, 'utf8')) } catch { return [] }
  }
}

export default PresetManager
