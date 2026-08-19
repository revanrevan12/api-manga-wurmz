// bookmarkManager.js — Bookmark & Reading History (FASE 5)
//
// Persists bookmarks and reading history to localStorage so any website
// embedding the client SDK can offer "continue reading" and a favorites list
// without a backend. History is capped at 50 entries.

class BookmarkManager {
  constructor(storageKey = 'manga_bookmarks') {
    this.storageKey = storageKey
    this.historyKey = 'manga_history'
  }

  addBookmark(manga) {
    const bookmarks = this.getBookmarks()
    if (bookmarks.some((b) => b.slug === manga.slug)) return
    bookmarks.push({
      slug: manga.slug,
      title: manga.title,
      cover: manga.cover,
      addedAt: new Date().toISOString()
    })
    this.saveBookmarks(bookmarks)
  }

  removeBookmark(slug) {
    this.saveBookmarks(this.getBookmarks().filter((b) => b.slug !== slug))
  }

  getBookmarks() {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  isBookmarked(slug) {
    return this.getBookmarks().some((b) => b.slug === slug)
  }

  saveBookmarks(list) {
    localStorage.setItem(this.storageKey, JSON.stringify(list))
  }

  addToHistory(manga, chapter) {
    const history = this.getHistory()
    const existing = history.find((h) => h.slug === manga.slug)
    if (existing) {
      existing.lastChapter = chapter.slug
      existing.lastChapterTitle = chapter.title
      existing.lastRead = new Date().toISOString()
    } else {
      history.push({
        slug: manga.slug,
        title: manga.title,
        cover: manga.cover,
        lastChapter: chapter.slug,
        lastChapterTitle: chapter.title,
        lastRead: new Date().toISOString()
      })
    }
    history.sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))
    history.splice(50)
    localStorage.setItem(this.historyKey, JSON.stringify(history))
  }

  getHistory() {
    try {
      const data = localStorage.getItem(this.historyKey)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  getLastChapter(slug) {
    const item = this.getHistory().find((h) => h.slug === slug)
    return item ? item.lastChapter : null
  }

  clearHistory() {
    localStorage.removeItem(this.historyKey)
  }
}

if (typeof window !== 'undefined') {
  window.BookmarkManager = BookmarkManager
}

export default BookmarkManager
