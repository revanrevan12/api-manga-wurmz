# Client Integration — api-manga-wurmz

Drop-in client for the generated Manga API. Paste these files into any website
to consume every endpoint without writing fetch logic.

## Files

| File | Purpose |
|------|---------|
| `client.js` | MangaAPIClient SDK — fetch + in-memory cache for all endpoints |
| `reader.js` | MangaReader — long-strip reader with keyboard nav, slider, fullscreen |
| `bookmarkManager.js` | Bookmark & reading history (localStorage, capped at 50) |
| `styles.css` | Dark/light, mobile-first styles for the reader |
| `example.html` | Minimal integration example |

## Quick start

```html
<script type="module">
  import MangaAPIClient from './client.js'
  import MangaReader from './reader.js'
  import BookmarkManager from './bookmarkManager.js'

  const api = new MangaAPIClient('https://your-api-host.example.com')
  const reader = new MangaReader('manga-reader', api, 'chapter-1')
  const bookmarks = new BookmarkManager()
</script>
```

## Endpoints

`getPopular(page, limit)` · `getLatest(page, limit)` · `search(q, page, limit)` ·
`getManga(slug)` · `getChapters(slug, page, limit)` · `getChapter(slug)` ·
`getPages(slug)` · `getImageUrl(url, referer)`

## Reader controls

- **left / right** — previous / next page
- **f** — toggle fullscreen
- Page slider + progress bar in the footer
- Lazy-loaded images with 3-image preload ahead of scroll
