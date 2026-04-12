# RSS Reader — Product Requirements Document

**Version:** April 2026  
**Status:** Feature-Complete (maintenance & refinement mode)

---

## 1. Product Overview

### Vision
A fast, private, single-file RSS reader that works as a Progressive Web App on both desktop and mobile, with optional cloud sync. No server dependency, no build step, no third-party tracking.

### Guiding Principles
- **Single-file delivery**: All HTML, CSS, and JS inline — install by dropping one file anywhere
- **Offline-first**: All data persists locally; cloud sync is an enhancement, not a requirement
- **Mobile-first UX, desktop-grade power**: Full-featured on both form factors without compromise
- **Zero ads, zero telemetry**: User data never leaves the device unless the user opts into cloud sync

---

## 2. User Personas

### Primary: The Power Reader
- Follows 20–100+ RSS feeds across categories (news, blogs, social)
- Reads daily on both desktop and mobile
- Values speed, keyboard navigation, and read-state persistence across devices
- Uses Read Later to triage content for later deep-reading

### Secondary: The Casual Follower
- Follows 5–20 feeds
- Reads mostly on mobile, occasionally desktop
- Wants a clean, distraction-free reading experience
- Values fullscreen mobile mode and TTS for passive consumption

---

## 3. Feature Requirements

### 3.1 Feed Management

| Requirement | Detail |
|---|---|
| Add feeds | Manual URL entry with optional category assignment |
| Edit feeds | Rename, change URL, change category |
| Delete feeds | With confirmation dialog |
| Organize into categories | Hierarchical sidebar: category → feeds |
| Drag-and-drop reorder | Reorder feeds within categories; reorder categories |
| OPML import | Parse XML subscription list and create feeds |
| OPML export | Download current subscription list as valid OPML XML |
| Bluesky support | `@actor.bsky.social` handles resolved via public Bluesky API |
| Favicon display | Auto-fetched and cached per feed; falls back to Google Favicons API |
| CORS proxy chain | `corsproxy.io` → `allorigins.win` fallback for cross-origin fetches |
| Auto-refresh | Configurable interval: Off, 5, 10, 15, 30, 60 minutes |
| Manual refresh | Per-feed, per-category, or global refresh button |

### 3.2 Article List

| Requirement | Detail |
|---|---|
| Smart feeds | **All Unread**, **Today** (last 24h), **Read Later** |
| Feed/category filter | Click feed or category → filter timeline |
| Unread counts | Per-feed and per-category badges; hidden when zero |
| Unread indicator | Blue dot per article; removed on open |
| Sort order | Newest-first or oldest-first (configurable) |
| Deduplication | Optional: group articles with identical titles, show highest-ranked source via Memeorandum scores |
| Article pinning | Top N articles always shown even after being read; cleared on filter change |
| List / Card view | Toggle between compact list and card layout |
| Preview text | Configurable preview line count (2–15 lines, default 5) |
| Thumbnail images | Inline article thumbnail when available |
| Relative timestamps | "2 min ago", "3 hours ago", "Yesterday" |
| Mark all read | Click "N UNREAD" header button or via context menu |
| Pull-to-refresh | Swipe down ≥120px on mobile to trigger refresh |
| Long-press context menu | Hold article card on mobile for contextual actions |

### 3.3 Article Viewer

| Requirement | Detail |
|---|---|
| Full-content loading | Proxy-based extraction for short RSS excerpts |
| Reading time estimate | Word count ÷ 200 wpm, displayed as "~N min read" |
| Reading progress | Scroll-based progress bar at top of article |
| Article navigation | Prev/Next buttons and keyboard shortcuts (j/k, ↑/↓) |
| DOMPurify sanitization | All HTML content sanitized with allowlist before render |
| Image lightbox | Click image to expand to full-screen overlay |
| Broken image suppression | Images <60px or 1×1 hidden; empty ancestor containers collapsed |
| Responsive embeds | Videos, audio, iframes rendered full-width |
| Linkify | Bare URLs in plain-text content converted to clickable links |
| MARK READ / MARK UNREAD | Button in viewer header; state persists and syncs |
| READ LATER | Toggle bookmark; article appears in Read Later smart feed |
| SHARE | Native Web Share API with clipboard fallback |
| TTS | Web Speech API playback of article body text |
| FULL ARTICLE | Button to attempt full-body proxy extraction on demand |
| WEB | Open article in external browser tab |
| Double-click header | Toggle desktop fullscreen (article fills entire viewport) |

### 3.4 Typography & Preferences

| Setting | Detail |
|---|---|
| Font family | Selector for system/web fonts |
| Feed name size | Sidebar feed label size |
| List title size | Article list title size (desktop + mobile) |
| List preview size | Preview text size |
| Category/folder size | Sidebar category label size |
| Article body size | Viewer body text size |
| Article title size | Viewer article title size |
| Article metadata size | Author, date metadata size |
| Line height | Viewer body line spacing |
| Preview lines | Number of lines shown in article list preview (2–15) |
| Sort order | Newest-first / Oldest-first |
| Auto-refresh interval | Off / 5 / 10 / 15 / 30 / 60 minutes |
| Deduplication | Toggle Memeorandum-ranked dedup ON/OFF |
| Show empty categories | Show/hide categories with no unread articles |
| Mobile zoom | 80–130% viewport scaling (default 105%) |
| Mobile fullscreen default | Auto-enter fullscreen on mobile app launch |

### 3.5 Cloud Sync

| Requirement | Detail |
|---|---|
| Authentication | Firebase email/password (register, sign in, forgot password, sign out) |
| Feeds sync | Stored in Firestore; replaces local on load |
| Read state sync | Up to 5000 most-recent read links synced bidirectionally |
| Read Later sync | Bookmarked article links synced |
| Preferences sync | All typography/preference settings synced |
| Pane width sync | Desktop timeline pane width synced |
| Category order sync | Drag-drop ordering synced |
| Merge strategy | Read links: union of cloud + local. Preferences: cloud overrides local |
| Local fallback | All features work offline; sync is additive |
| Sync status | Header shows "Local Only" or "☁ user@email.com" |

### 3.6 Mobile Experience

| Requirement | Detail |
|---|---|
| Responsive layout | Single-pane on ≤900px; three-pane on desktop |
| Bottom tab bar | Feeds / Articles / Reader / Fullscreen tabs |
| Mobile reader action bar | Prev, Read, All Read, Later, Share, Next — all 16px labels |
| Fullscreen mode | Hides all chrome; floating topbar pills for navigation |
| Article List topbar (fullscreen) | Unread count, dupes count, Mark All Read — 16px |
| Article View topbar (fullscreen) | Reading progress text, Open in Browser button — 16px |
| Articles button (fullscreen) | Back to article list pill button — 16px |
| Exit / Feeds buttons | Fixed corner buttons to exit or return to feeds |
| Pull-to-refresh | Swipe-down gesture on article list |
| Haptic feedback | Vibration on long-press context menu trigger |
| Touch gestures | Tap, long-press, swipe detection with 6px movement threshold |
| PWA install | Manifest + Service Worker for add-to-home-screen |
| Offline support | Service Worker cache-first strategy for app assets |
| Apple PWA metadata | apple-mobile-web-app-capable, status bar, touch icon |

### 3.7 Desktop Layout

| Requirement | Detail |
|---|---|
| Three-pane layout | Sidebar (328px) + Timeline (336px, resizable) + Viewer (flex) |
| Aligned header heights | All three pane headers are identical height (h-14 / 56px) |
| Consistent header color | Each header matches its pane background color |
| Resizable timeline | Drag divider to resize; width persisted to localStorage |
| Desktop fullscreen | Hides sidebar + timeline; double-click header or button to toggle |
| Dark mode | Deep dark theme with custom color palette (#13131a / #15151c / #18181f) |
| Light/Dark toggle | Moon icon in sidebar header |
| Keyboard shortcuts | j/k navigation, r=read, b=bookmark, o=open, ?=help |
| Shortcuts modal | Full shortcut reference triggered by `?` key |

### 3.8 Context Menus

| Context | Actions |
|---|---|
| Article (right-click / long-press) | Mark Read/Unread, Save/Remove Later, Mark Above Read, Mark Below Read |
| Feed (right-click) | Refresh Feed, Edit Feed, Delete Feed |
| Category (right-click / long-press) | Mark Folder Read, Edit Category, Delete Category |
| Smart Feed (right-click) | Mark All Read (triggers background fetch for All/Today) |

### 3.9 Notifications

| Requirement | Detail |
|---|---|
| Toast notifications | Brief overlay messages for all actions (mark read, save later, refresh, errors) |
| Toast queue | Sequential display; never overlap |
| Toast z-index | Always above all UI elements including fullscreen topbars (z-index 300) |
| Toast position | top: 16px in all modes; renders above fullscreen topbars |
| Error toasts | Red background for failures (import error, share failure, etc.) |

---

## 4. Non-Functional Requirements

### Performance
- Article list renders via string-concatenation innerHTML for speed (no virtual DOM)
- Timeline re-render skipped if render key unchanged (`_lastTimelineKey` guard)
- Article body cached in `_bodyCache` to avoid re-extraction
- Favicons lazy-loaded and cached in localStorage
- Read state debounced 2000ms before writing to localStorage

### Security
- All article HTML sanitized via DOMPurify with explicit tag/attribute allowlist
- No eval, no inline script injection
- Firebase Auth tokens managed by Firebase SDK
- No user credentials stored locally

### Storage
- Articles: 500 most-recent cached in `newsreader_articles`
- Read links: 5000 most-recent in `newsreader_read`
- Unread state: Correctly persists mark-unread actions (loaded articles' links removed from stored set before merge)

### Compatibility
- Modern evergreen browsers (Chrome, Safari, Firefox, Edge)
- iOS Safari (PWA): apple-mobile-web-app-capable
- No IE support required

---

## 5. Technical Architecture

### Stack
| Layer | Technology |
|---|---|
| Markup | HTML5 (single file) |
| Styling | Tailwind CSS v3 CDN (JIT) |
| Scripting | Vanilla ES2020+ JavaScript (no framework) |
| Sanitization | DOMPurify CDN |
| Auth + DB | Firebase v9 SDK (ES module import) |
| Offline | Inline Service Worker (Blob URL registration) |
| PWA | Inline data URI manifest |

### Data Flow
```
RSS Feed URL
    → CORS Proxy (corsproxy.io / allorigins.win)
    → XML Parse (DOMParser)
    → Article Objects → window.articles
    → renderTimeline() → innerHTML
    → selectArticle() → viewer pane
    → saveReadState() [debounced 2s] → localStorage + Firestore
```

### State Management
All state is global on `window`:
- `window.articles` — full article array
- `window.feeds` — feed configuration
- `window.currentArticle` — open article
- `window.currentTimeline` — filtered article list
- `window._readLinks` — Set of read article URLs
- `window._readLaterLinks` — Set of bookmarked URLs
- `window._pinnedArticleIds` — Set of pinned article IDs
- `window.currentSmartFeed` / `currentCategoryFilter` / `currentSourceFilter`

### localStorage Keys
| Key | Contents |
|---|---|
| `newsreader_feeds` | Feed array (JSON) |
| `newsreader_articles` | Article cache (JSON, 500 items) |
| `newsreader_read` | Read link URLs (JSON array, 5000 items) |
| `newsreader_readlater` | Read Later link URLs (JSON array) |
| `newsreader_prefs` | Typography + preferences (JSON) |
| `newsreader_catorder` | Category order (JSON array) |
| `newsreader_viewmode` | 'list' or 'card' |
| `newsreader_showemptycats` | Boolean |
| `newsreader_defaultfullscreen` | Boolean |
| `newsreader_pane_width` | Desktop timeline pane width (px) |
| `favicon_[feedUrl]` | Cached favicon URL per feed |
| `newsreader_memo_ranks` | Memeorandum source rankings cache |

---

## 6. Out of Scope

- Native mobile apps (iOS App Store / Google Play)
- Server-side rendering or API backend
- Multi-user / shared feed lists
- Podcast/video feed support (audio/video embeds render but no dedicated player)
- Feed discovery or recommendation engine
- Comment threading or social features

---

## 7. Known Constraints

- CORS proxy dependency: Feed fetching requires third-party CORS proxies (corsproxy.io, allorigins.win). If both are unavailable, feed refresh fails.
- Firebase dependency: Cloud sync requires Firebase project; local-only mode is always available as fallback.
- localStorage quota: ~5–10MB per browser; large article caches may hit limits on some browsers.
- Single-file maintenance: All code in one file; no module bundling or tree-shaking.
