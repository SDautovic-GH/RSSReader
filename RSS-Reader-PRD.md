# Product Requirements Document
## RSS Reader — Personal News Aggregator
**Version:** 1.1  
**Author:** Samir Dautovic  
**Last Updated:** April 2, 2026  
**Status:** Active Development

---

## 1. Overview

RSS Reader is a personal, self-hosted news aggregation web application delivered as a single HTML file. It aggregates RSS and Atom feeds from multiple sources, provides a structured reading experience across desktop and mobile, and syncs user data across devices via Firebase.

The application is hosted on GitHub Pages with feed fetching routed through a dedicated Cloudflare Worker proxy. No backend infrastructure is required beyond Firebase Authentication, Firestore for cloud sync, and the Cloudflare Worker.

---

## 2. Goals

- Provide a fast, distraction-free reading experience for curated RSS/Atom feeds
- Support full cross-device sync (desktop browser, iPhone, PWA) via Firebase
- Deliver fresh feed content within 20–30 minutes of publication
- Require no build tools, no server, no dependencies beyond a browser
- Keep hosting permanently free with no usage limits or suspension risk

---

## 3. Non-Goals

- Not a multi-user platform — designed exclusively for personal use
- No social features (sharing, commenting, following)
- No native mobile app — PWA only
- No server-side feed parsing or caching beyond the Cloudflare Worker fetch

---

## 4. Target Users

Single user: Samir Dautovic, IT Administrator at WilmerHale, using the app across Windows desktop (browser + PWA), iPhone (Safari PWA), and MacBook.

---

## 5. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Single HTML file — Tailwind CSS (CDN), DOMPurify 3.1.6 |
| Auth & Sync | Firebase 11.6.1 — Email/Password Auth + Firestore |
| Feed Proxy | Cloudflare Worker — `still-shadow-1ebe.sdfyix.workers.dev` |
| Proxy Fallbacks | allorigins.win (cache-busted) → corsproxy.io |
| Hosting | GitHub Pages — `sdautovic-gh.github.io/RSSReader` |
| PWA | Inline service worker, Web App Manifest |
| Local Repo | `C:\.ScriptLibrary\RSS Reader` — synced via `Sync-Git.ps1` |
| Firebase Project | `rss-reader-fyi` |

---

## 6. Architecture

The application is entirely client-side. On load:

1. localStorage is read to restore feeds, read state, typography preferences, and category order
2. Firebase Auth signs the user in with email/password
3. Firestore `onSnapshot` fires, cancels the local fallback fetch timer, loads feeds, and triggers a staggered RSS fetch (500ms between each feed)
4. Each feed is fetched via the Cloudflare Worker proxy with fallback to allorigins.win and corsproxy.io
5. Firestore read state is pulled and re-applied to all in-memory articles
6. UI renders — sidebar, article list, article viewer

All data is persisted to both localStorage (device-local) and Firestore (cloud sync).

---

## 7. Layout

### Desktop (>900px) — Three-pane layout
| Pane | Content |
|---|---|
| Sidebar (264px) | Smart Feeds, category folders, feed items, sync status |
| Timeline (336px, resizable) | Article list with search, sort, mark all read |
| Viewer (flex-1) | Article reader with toolbar, progress bar, TTS, full article |

### Mobile (≤900px) — Single-pane with bottom tab bar
| Tab | Content |
|---|---|
| Feeds | Sidebar — smart feeds, categories, feed sources |
| Articles | Article list |
| Reader | Article viewer |
| Full | Fullscreen toggle — hides all chrome |

---

## 8. Features

### 8.1 Feed Management
- OPML import — staggered fetch of 2 articles per feed on import
- Manual feed add — title, URL, category selector with new category option
- Feed removal — per feed via Settings → Feeds tab
- Category folder management — create, rename (right-click/long-press), delete folder + all feeds, drag to reorder
- Category folders sorted alphabetically by default; manual drag-reorder persists to localStorage
- Feed drag-and-drop — move feeds between category folders
- Feed health indicators — amber dot (stale >7 days), red dot (3+ consecutive errors)
- Show/hide empty category folders toggle (Settings → Preferences)
- Auto-favicon via Google S2 favicon service

### 8.2 Article List
- Unread-only view by default (All Unread smart feed)
- Smart feeds: All Unread, Today, Read Later — with unread badges; font size matches category folders
- Category and per-feed filtering
- Full-text search (title + excerpt + source, toggle in settings)
- Sort: Oldest First / Newest First
- List and Card view modes
- Right-click / long-press (500ms) context menu: Mark Read/Unread, Save for Later, Mark Above Read, Mark Below Read
- Relative timestamps, auto-updated every 60 seconds
- Lazy-loaded thumbnails
- Configurable preview line count
- Articles replaced (not appended) on each fetch — max 20 per feed

### 8.3 Article Viewer
- Reading progress bar (top of pane)
- Estimated read time
- TTS (text-to-speech) via Web Speech API
- Full Article fetch via proxy chain
- Web view toggle (iframe)
- Share via Web Share API with clipboard fallback
- Prev/Next navigation — toolbar buttons (desktop), action bar (mobile), footer arrows, keyboard shortcuts (↑↓, j/k), swipe left/right (mobile, 25px / 250ms threshold)
- Mark Read/Unread toggle
- Save for Later toggle
- Open in browser
- Sky-blue (#60a5fa) feed name label; article title matches body text color

### 8.4 Mobile-Specific
- Bottom tab bar: Feeds / Articles / Reader / Full
- Mobile reader action bar: Prev / Read / Later / Share / Next
- Fullscreen mode — hides all chrome, attempts native browser fullscreen
- Floating ✕ exit button (bottom-right) visible only in fullscreen
- Long-press (500ms) on article cards and category folders for context menus
- Swipe left/right in viewer pane (25px threshold, 250ms window)
- Independent mobile typography settings (separate from desktop)

### 8.5 Sync & Persistence
- Firebase Email/Password authentication with Forgot Password flow
- Firestore real-time sync for feeds (onSnapshot, first snapshot only to prevent double-fetch)
- Firestore on-demand sync for read state and read-later state
- Read state re-applied to in-memory articles after Firestore load
- 4-second deferred local fetch — cancelled if Firebase syncs first
- localStorage keys: `newsreader_feeds`, `newsreader_read`, `newsreader_readlater`, `newsreader_prefs`, `newsreader_viewmode`, `newsreader_fullsearch`, `newsreader_catorder`, `newsreader_showemptycats`
- OPML export (grouped by category)
- Read state export (JSON)

### 8.6 Settings — Feeds Tab
- Import OPML
- Add Manual Feed (with category selector and new category creation)
- Feed list with Remove buttons

### 8.7 Settings — Preferences Tab

**Refresh & Sync**
- Auto-refresh interval: Off / 15 (default) / 30 / 60 minutes
- New articles banner on background refresh

**Desktop**
- Sort order (Oldest / Newest First)
- Search excerpt & source toggle
- Show empty category folders toggle
- List font / View font (Inter, Roboto, Georgia/Lora)
- Article List Title Size: 0.7–1.2em (default 1.0em)
- Timeline Preview Size: 0.5–1.4em (default 1.0em)
- Article Body Size: 0.7–1.4em (default 1.0em)
- Article Title Size: 0.9–1.8em (default 1.0em)
- Category Folder Size: 0.5–1.2em (default 0.8em)
- Preview Lines: 2–20 (default 10)

**Mobile**
- Article List Title Size: 0.9–1.8em (default 1.0em)
- Article Body Size: 0.5–1.5em (default 1.0em)
- Author / Date Size: 0.4–1.2em (default 0.7em)
- List Preview Text Size: 0.4–1.2em (default 0.7em)
- Feed Name Size (viewer): 0.4–1.2em (default 0.7em)
- Article Title Size (viewer): 0.8–2.5em (default 1.1em)

All typography settings use `em` units consistently. All preferences persist to localStorage.

---

## 9. Visual Design

- Dark mode default, light mode toggle
- Color palette: gray-900 background, sky-400 (#60a5fa) links, feed name labels, and accents
- Article text (dark mode): #f1f5f9 list titles, #cbd5e1 previews, #e2e8f0 body and article title, #94a3b8 dates
- No underlines on any links globally
- Fonts: Inter (default), Roboto, Georgia/Lora (view font options)
- All typography controlled via CSS custom properties

---

## 10. Feed Fetching

Feeds are fetched via a three-proxy fallback chain with a 10-second timeout per proxy:

1. **Cloudflare Worker** (`still-shadow-1ebe.sdfyix.workers.dev`) — primary; dedicated worker, no rate limits, no caching, returns raw XML with CORS headers. ~6,720 requests/day at 70 feeds × 15-min refresh = 6.7% of 100,000/day free limit.
2. **allorigins.win** — fallback; cache-busted with `_=timestamp` parameter
3. **corsproxy.io** — last resort

Feeds fetched with 500ms stagger. On each fetch, old articles from that source are replaced, capped at 20 per feed. RSS and Atom formats supported via native DOMParser. BOM stripping applied before XML validation.

### Cloudflare Worker Source
```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing url param', { status: 400 });
    const res = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (RSS Reader)' }
    });
    const body = await res.text();
    return new Response(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }
}
```

---

## 11. PWA Configuration

- Inline service worker registered via blob URL
- Web App Manifest with `standalone` display mode
- Apple touch icon (inline SVG)
- Tab title shows unread count: `(N) RSS Reader`
- Hard refresh required after deploy to clear service worker cache

---

## 12. Security

- DOMPurify sanitization on all innerHTML (article body, proxy responses)
- `crypto.randomUUID()` for all entity IDs
- Firebase Firestore rules: users can only read/write their own data at `/artifacts/rss-reader-fyi/users/{userId}/`
- No API keys exposed beyond Firebase public config (standard practice)

---

## 13. Deployment

| Target | URL | Method |
|---|---|---|
| Production | `https://sdautovic-gh.github.io/RSSReader/` | Push via `Sync-Git.ps1` or edit on GitHub |
| Local testing | `http://localhost:5500` | VS Code Live Server |
| Feed proxy | `https://still-shadow-1ebe.sdfyix.workers.dev` | Cloudflare Workers dashboard |

GitHub Pages serves from the `main` branch root. `Sync-Git.ps1` auto-commits and pushes `C:\.ScriptLibrary\RSS Reader` as a secondary repo sync after the main `.ScriptLibrary` sync. The `RSS Reader/` folder is excluded from the parent `.ScriptLibrary` repo via `.gitignore`.

---

## 14. Known Limitations

- Corporate network (WilmerHale) blocks all proxy requests via firewall (303 redirect to `10.14.160.4/UserCheck`) — feeds only load on non-corporate networks or mobile data
- Service worker caches aggressively — hard refresh or SW unregister required after deploys on same device
- Some feed sources (Bluesky, paywalled sites) may still fail all three proxies
- Read state sync is eventual — articles read on one device appear as unread briefly on another until Firestore re-applies state on next load
- No offline support beyond service worker static asset cache

---

## 15. Future Considerations

- Full-text article caching for offline reading
- Push notifications for new articles (Web Push API)
- Tag/label system beyond categories
- Multiple account support
- Keyboard shortcut reference modal
