class CacheManager {
  constructor(maxSize = 500) {
    this.cache = new Map()
    this.ttls = new Map()
    // Stale fallback store — keeps the last good value after the TTL
    // expires so the API can still serve data (flagged stale) when the
    // upstream selector is broken. FASE 3: never return 500.
    this.staleCache = new Map()
    this.maxSize = maxSize
  }

  set(key, value, ttlSeconds) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
      this.ttls.delete(firstKey)
    }

    this.cache.set(key, value)
    // Always keep a stale copy of the last good value.
    this.staleCache.set(key, value)

    if (ttlSeconds) {
      const expiresAt = Date.now() + ttlSeconds * 1000
      this.ttls.set(key, expiresAt)
      setTimeout(() => {
        if (this.ttls.get(key) === expiresAt) {
          this.cache.delete(key)
          this.ttls.delete(key)
        }
      }, ttlSeconds * 1000).unref?.()
    }
  }

  // Returns { data, stale } or null. When allowStale is true and the fresh
  // entry has expired (or is missing), the last good value is returned with
  // stale: true so callers can flag the response instead of erroring.
  get(key, allowStale = false) {
    const expiresAt = this.ttls.get(key)
    const fresh = this.cache.get(key)
    if (fresh && (!expiresAt || Date.now() <= expiresAt)) {
      return { data: fresh, stale: false }
    }
    // Fresh entry missing/expired — clear it.
    if (expiresAt && Date.now() > expiresAt) {
      this.cache.delete(key)
      this.ttls.delete(key)
    }
    if (allowStale) {
      const stale = this.staleCache.get(key)
      if (stale) return { data: stale, stale: true }
    }
    return null
  }

  has(key) {
    return this.get(key) !== null
  }

  delete(key) {
    this.cache.delete(key)
    this.ttls.delete(key)
  }

  clear() {
    this.cache.clear()
    this.ttls.clear()
    this.staleCache.clear()
  }

  static TTL = {
    LIST: 10 * 60,       // 10 minutes
    DETAIL: 60 * 60,     // 1 hour
    CHAPTER: 24 * 60 * 60, // 24 hours
  }
}

export default CacheManager
