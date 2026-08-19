import { Octokit } from '@octokit/rest'
import AppError from '../errors/AppError.js'

// FASE 3.2 — GitHub auto-commit.
// When the self-healing flow repairs a selector, this service commits the
// updated selectors.json + preset back to the source's GitHub repository
// and appends a history entry. The token is read from env (never embedded
// in generated source).
class GitHubAutoCommitService {
  constructor(token, owner, repo, branch = 'main') {
    if (!token) throw AppError.network('GITHUB_TOKEN not set', 'Set GITHUB_TOKEN in .env')
    this.octokit = new Octokit({ auth: token })
    this.owner = owner
    this.repo = repo
    this.branch = branch
  }

  async _getSha(path) {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref: this.branch,
      })
      return data.sha || null
    } catch {
      return null
    }
  }

  async updateSelectors(filePath, newSelectors, message) {
    const currentSha = await this._getSha(filePath)
    const newContent = JSON.stringify(newSelectors, null, 2)
    // Detect no-change to avoid empty commits.
    if (currentSha) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner, repo: this.repo, path: filePath, ref: this.branch,
        })
        const current = Buffer.from(data.content, 'base64').toString()
        if (current === newContent) return { success: true, changed: false }
      } catch {
        /* ignore */
      }
    }
    const response = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: filePath,
      message,
      content: Buffer.from(newContent).toString('base64'),
      sha: currentSha || undefined,
      branch: this.branch,
    })
    return { success: true, changed: true, commit: response.data.commit.sha, message }
  }

  async updatePreset(presetPath, preset, message) {
    const content = JSON.stringify(preset, null, 2)
    const sha = await this._getSha(presetPath)
    const response = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: presetPath,
      message: message || `update: preset ${presetPath}`,
      content: Buffer.from(content).toString('base64'),
      sha: sha || undefined,
      branch: this.branch,
    })
    return { success: true, commit: response.data.commit.sha }
  }

  async addHistory(historyPath, entry) {
    let history = []
    const sha = await this._getSha(historyPath)
    if (sha) {
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner, repo: this.repo, path: historyPath, ref: this.branch,
        })
        history = JSON.parse(Buffer.from(data.content, 'base64').toString())
      } catch {
        history = []
      }
    }
    history.unshift(entry)
    history = history.slice(0, 50)
    const response = await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path: historyPath,
      message: `history: add entry to ${historyPath}`,
      content: Buffer.from(JSON.stringify(history, null, 2)).toString('base64'),
      sha: sha || undefined,
      branch: this.branch,
    })
    return { success: true, commit: response.data.commit.sha }
  }
}

export default GitHubAutoCommitService
