# RSS Reader — Functionality Summary

A single-file Progressive Web App RSS reader. Works on desktop and mobile. No installation required beyond opening `index.html` in a browser. Optional cloud sync via Firebase.

---

## Getting Started

1. Open `index.html` in a browser (or add to home screen on mobile)
2. Go to **Settings → Feeds** and add RSS feed URLs, or import an OPML file
3. Click any feed in the sidebar to read articles from it
4. Click **All Unread** at the top of the sidebar to see everything

---

## Reading

### Navigating Articles
- Click an article in the list to open it in the reader pane
- Use **↑ / ↓** arrow buttons (or **j / k** on keyboard) to move between articles
- Keyboard shortcut **o** opens the current article in a new browser tab

### Read State
- Opening an article marks it as read automatically
- The **MARK UNREAD** button in the reader header lets you undo this
- Blue dot in the article list = unread; empty = read
- **r** on the keyboard toggles read/unread on the current article

### Read Later
- Click **READ LATER** in the reader header (or **b** on keyboard) to bookmark an article
- Bookmarked articles appear in the **Read Later** smart feed in the sidebar
- The button shows **SAVED TO READ LATER** when active; click again to remove

### Mark All Read
- Click the **"N UNREAD"** text in the article list header to mark everything in the current view as read
- Right-click a category or feed for the same option scoped to that folder

---

## Smart Feeds

The top of the sidebar has three built-in views:

| Feed | Shows |
|---|---|
| **All Unread** | Every unread article across all feeds |
| **Today** | Unread articles published in the last 24 hours |
| **Read Later** | All bookmarked articles |

Unread counts appear next to each smart feed. The badge disappears when the count reaches zero.

---

## Feeds & Organization

### Adding Feeds
1. Click the **Settings (⚙)** button
2. Go to the **Feeds** tab
3. Paste an RSS/Atom URL and optionally assign a category
4. For Bluesky: enter `@handle.bsky.social` as the URL

### Categories
- Feeds are grouped into collapsible categories in the sidebar
- Drag feeds to reorder within a category; drag categories to reorder them
- Right-click a category to rename, delete, or mark all its articles as read

### OPML
- **Import**: Settings → Feeds → Import OPML — paste or upload a `.opml` file to bulk-add feeds
- **Export**: Settings → Feeds → Export OPML — downloads your current subscription list

### Refresh
- Feeds refresh automatically on a configurable interval (Settings → Preferences)
- Click **↻** in the sidebar header to refresh all feeds immediately
- Right-click a feed → **Refresh Feed** to refresh just that one

---

## Article View

### Full Article Loading
Short RSS excerpts automatically trigger a full-content fetch in the background. The **FULL ARTICLE** button forces this on demand.

### Reading Time
"~N min read" is shown in the article header, calculated from word count.

### Text-to-Speech
Click **LISTEN** to have the article read aloud. Click **STOP** to end. Uses the browser's built-in speech synthesis.

### Images
- Click any image to open it in a full-screen lightbox
- Broken or tiny images are automatically hidden

### Share
**SHARE** uses the native share sheet on mobile, or copies the link to clipboard on desktop. A toast confirms the result.

---

## Desktop Layout

### Three Panes
- **Sidebar** (left, 328px): Feed list, smart feeds, settings access
- **Article List** (middle, resizable): Current feed's articles
- **Article Reader** (right): Full article content

All three pane headers are the same height and match their pane's background color.

Drag the divider between the article list and reader to resize. The width is saved automatically.

### Fullscreen Mode
Double-click any pane header, or use the **EXIT FULL SCREEN** button, to toggle the reader to full width (hiding the sidebar and article list). Double-click again or click the button to exit.

### View Mode
The **LIST** button in the reader header toggles between compact list and card layout in the article list.

### Dark Mode
Click the **🌙** moon icon in the sidebar header to switch between dark and light themes.

### Keyboard Shortcuts

| Key | Action |
|---|---|
| `j` / `↓` | Next article |
| `k` / `↑` | Previous article |
| `r` | Toggle read/unread |
| `b` | Toggle read later (bookmark) |
| `o` | Open in browser |
| `?` | Show all shortcuts |

---

## Mobile Experience

### Navigation
The bottom tab bar has four tabs:
1. **Feeds** — sidebar with all feeds and categories
2. **Articles** — article list for the selected feed
3. **Reader** — full article view
4. **⛶** — toggle fullscreen mode

### Mobile Reader Bar
Below the article on mobile, an action bar provides:
**Prev | Read | All Read | Later | Share | Next**

All buttons are 16px for easy tap targets.

### Fullscreen Mode
Tap the fullscreen tab or the **⛶** button to enter fullscreen. In this mode:
- All navigation chrome is hidden
- A floating **topbar** appears at the top:
  - In the article list: shows unread count and mark-all-read
  - In the reader: shows reading progress and open-in-browser
- Fixed buttons in the corners let you exit or return to feeds
- A back **Articles** pill at the bottom returns to the article list
- Tap the **✕** button to exit fullscreen

### Pull to Refresh
Swipe down from the top of the article list to refresh the current feed.

### Start in Fullscreen
Settings → Preferences → **Mobile Fullscreen Default** — automatically enters fullscreen when the app opens on mobile.

### Add to Home Screen
The app is a fully installable PWA. Use your browser's "Add to Home Screen" option to install it as a standalone app with its own icon.

---

## Deduplication

When enabled (Settings → Preferences → **Deduplication**), articles with the same title from multiple sources are grouped. The most authoritative source (ranked using Memeorandum source scores) is shown first; duplicates are collapsed under it.

The **DEDUPED** badge appears in the article list header when deduplication is active.

---

## Cloud Sync

### Signing In
Settings → sign-in area → enter your email and password (or register a new account).

### What Syncs
- Feed list and category order
- Read / unread state (up to 5000 recent links)
- Read Later bookmarks
- All typography and preference settings
- Desktop pane width

### Sync Behavior
- Changes sync to the cloud automatically after each action
- On sign-in, cloud state merges with local state (read links are combined; preferences from cloud take precedence)
- Everything works offline; the cloud is an optional enhancement

### Sign Out
Settings → **Sign Out**. Local data is preserved.

---

## Settings Reference

Settings are in two tabs:

### Feeds Tab
- Add, edit, delete individual feeds
- Set feed name, URL, and category
- OPML import and export

### Preferences Tab

| Setting | What it does |
|---|---|
| Font Family | Font used throughout the app |
| Feed Name Size | Size of feed names in the sidebar |
| List Title Size | Size of article titles in the list |
| List Preview Size | Size of article preview text |
| Folder/Category Size | Size of category labels |
| Article Body Size | Size of article body text |
| Article Title Size | Size of the article title in the reader |
| Article Metadata Size | Size of author/date metadata |
| Line Height | Spacing between body text lines |
| Preview Lines | How many lines of preview text to show (2–15) |
| Sort Order | Newest first or oldest first |
| Auto-Refresh Interval | How often feeds automatically refresh |
| Deduplication | Group articles with identical titles by source rank |
| Show Empty Categories | Show/hide categories with no unread articles |
| Mobile Zoom | Overall zoom level on mobile (80–130%) |
| Mobile Fullscreen Default | Start in fullscreen mode on mobile |

---

## Notifications (Toasts)

Brief status messages appear at the top of the screen after most actions:
- ✓ Marked Read / Marked Unread
- 🔖 Saved for Later / Removed from Later
- Refreshing feeds... / Updated
- Link copied to clipboard
- Import/export results
- Error messages (red background)

Toasts queue up if multiple actions fire quickly, and always appear above all other UI including fullscreen overlays.

---

## Technical Notes

- **Single file**: Everything — HTML, CSS, JS, icons — is in `index.html`. No server, no build step, no dependencies to install.
- **Privacy**: No analytics, no tracking. Data stays in your browser unless you enable cloud sync.
- **Storage**: Uses `localStorage` for all local data. The app stores up to 500 articles and 5000 read-link records.
- **CORS Proxies**: Feed fetching uses `corsproxy.io` and `allorigins.win` as fallbacks for cross-origin requests. Both need to be reachable for feed refresh to work.
- **Offline**: Once loaded, the app's Service Worker caches all assets. You can read cached articles without an internet connection; feed refresh requires connectivity.
