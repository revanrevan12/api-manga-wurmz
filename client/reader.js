// reader.js — Manga Reader Component (FASE 5, long-strip mode)
//
// Self-contained long-strip manga reader: all chapter pages stacked
// vertically with lazy loading, keyboard nav (left/right/f), page slider,
// progress bar, fullscreen toggle, and 3-image preload ahead of scroll.
// Requires client.js (MangaAPIClient) + styles.css.

class MangaReader {
  constructor(containerId, apiClient, chapterSlug) {
    this.container = document.getElementById(containerId)
    this.apiClient = apiClient
    this.chapterSlug = chapterSlug
    this.pages = []
    this.currentPage = 0
    this.isLoading = false
    this.isFullscreen = false
    this.preloadDistance = 3
    this.init()
  }

  async init() {
    this.render()
    await this.loadPages()
  }

  render() {
    this.container.innerHTML = `
      <div class="manga-reader">
        <div class="reader-header">
          <button class="btn-prev-chapter" title="Chapter Sebelumnya">← Prev</button>
          <div class="chapter-info">
            <span class="chapter-title">Loading...</span>
            <span class="page-counter">0/0</span>
          </div>
          <button class="btn-next-chapter" title="Chapter Berikutnya">Next →</button>
          <button class="btn-fullscreen" title="Fullscreen">⛶</button>
        </div>
        <div class="reader-container">
          <div class="pages-container"></div>
          <div class="reader-loading" style="display: none;">
            <div class="spinner"></div>
          </div>
        </div>
        <div class="reader-footer">
          <div class="progress-bar"><div class="progress-fill"></div></div>
          <div class="footer-controls">
            <button class="btn-prev-page">← Prev Page</button>
            <input type="range" class="page-slider" min="0" max="0" value="0">
            <button class="btn-next-page">Next Page →</button>
          </div>
        </div>
      </div>
    `
    this.attachEventListeners()
  }

  attachEventListeners() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevPage()
      if (e.key === 'ArrowRight') this.nextPage()
      if (e.key === 'f') this.toggleFullscreen()
    })
    this.container.querySelector('.btn-prev-page').addEventListener('click', () => this.prevPage())
    this.container.querySelector('.btn-next-page').addEventListener('click', () => this.nextPage())
    this.container.querySelector('.btn-fullscreen').addEventListener('click', () => this.toggleFullscreen())
    this.container.querySelector('.page-slider').addEventListener('change', (e) => {
      this.goToPage(parseInt(e.target.value, 10))
    })
    this.container.querySelector('.reader-container').addEventListener('scroll', () => this.handleScroll())
  }

  async loadPages() {
    try {
      this.showLoading(true)
      const response = await this.apiClient.getPages(this.chapterSlug)
      if (!response.status) throw new Error(response.message || 'Gagal memuat halaman')
      this.pages = response.data || []
      this.updatePageCounter()
      this.renderPages()
      this.preloadPages()
    } catch (error) {
      this.showError(error.message)
    } finally {
      this.showLoading(false)
    }
  }

  renderPages() {
    const container = this.container.querySelector('.pages-container')
    container.innerHTML = ''
    this.pages.forEach((page, index) => {
      const img = document.createElement('img')
      img.src = page.imageUrl
      img.alt = `Page ${index + 1}`
      img.className = 'manga-page'
      img.loading = 'lazy'
      img.dataset.index = index
      img.addEventListener('load', () => img.classList.add('loaded'))
      img.addEventListener('error', () => {
        img.classList.add('error')
        img.alt = 'Failed to load image'
      })
      container.appendChild(img)
    })
    const slider = this.container.querySelector('.page-slider')
    slider.max = Math.max(0, this.pages.length - 1)
  }

  preloadPages() {
    const start = Math.max(0, this.currentPage - this.preloadDistance)
    const end = Math.min(this.pages.length, this.currentPage + this.preloadDistance + 1)
    for (let i = start; i < end; i++) {
      const img = new Image()
      img.src = this.pages[i].imageUrl
    }
  }

  nextPage() {
    if (this.currentPage < this.pages.length - 1) this.goToPage(this.currentPage + 1)
  }

  prevPage() {
    if (this.currentPage > 0) this.goToPage(this.currentPage - 1)
  }

  goToPage(index) {
    this.currentPage = Math.max(0, Math.min(index, this.pages.length - 1))
    this.updatePageCounter()
    this.preloadPages()
    const img = this.container.querySelector(`[data-index="${this.currentPage}"]`)
    if (img) img.scrollIntoView({ behavior: 'smooth', block: 'center' })
    this.container.querySelector('.page-slider').value = this.currentPage
  }

  updatePageCounter() {
    const counter = this.container.querySelector('.page-counter')
    counter.textContent = `${this.currentPage + 1}/${this.pages.length}`
    const progress = this.pages.length ? ((this.currentPage + 1) / this.pages.length) * 100 : 0
    this.container.querySelector('.progress-fill').style.width = `${progress}%`
  }

  toggleFullscreen() {
    const container = this.container.querySelector('.manga-reader')
    if (!this.isFullscreen) {
      if (container.requestFullscreen) container.requestFullscreen()
      else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen()
      this.isFullscreen = true
      container.classList.add('fullscreen')
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
      this.isFullscreen = false
      container.classList.remove('fullscreen')
    }
  }

  handleScroll() {
    const container = this.container.querySelector('.reader-container')
    const max = container.scrollHeight - container.clientHeight
    const pct = max > 0 ? (container.scrollTop / max) * 100 : 0
    if (pct > 80) this.preloadPages()
    const imgs = this.container.querySelectorAll('.manga-page')
    for (let i = 0; i < imgs.length; i++) {
      const rect = imgs[i].getBoundingClientRect()
      if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
        this.currentPage = i
        this.updatePageCounter()
        this.container.querySelector('.page-slider').value = i
        break
      }
    }
  }

  showLoading(show) {
    this.container.querySelector('.reader-loading').style.display = show ? 'flex' : 'none'
  }

  showError(message) {
    const container = this.container.querySelector('.pages-container')
    container.innerHTML = `
      <div class="error-message">
        <p>❌ ${message}</p>
        <button onclick="location.reload()">Coba Lagi</button>
      </div>
    `
  }
}

if (typeof window !== 'undefined') {
  window.MangaReader = MangaReader
}

export default MangaReader
