# RSS Reader — Product Requirements Document

**Version:** October 2026 (build 349)  
**Status:** Live at sdautovic-gh.github.io/RSSReader; maintained and refined build by build  
**Change history and decisions:** `MajorRevisions/Modern-Tabs-Redesign.md` records every build from 264 (the Today redesign) onward, with the reasons and measurements.

---

## 1. Product Overview

### Vision
A fast, private, single-file RSS reader that works as a Progressive Web App on phone and desktop, with cloud sync between devices. Reading starts in **Today**: a live brief of the last 24 hours' unread stories, grouped by the reader's own folders. No server of its own, no build step, no tracking.

### Guiding Principles
- **Single-file delivery:** all HTML, CSS and JavaScript are inline in `index.html`.
- **Today first:** the app opens on Today, on both phone and desktop. Lists (Unread, folders, feeds) are one tap away under Following.
- **Calm reading:** nothing on Today moves except in direct response to the reader's tap. Background refreshes never reshuffle, shrink or jump the page.
- **The reader's folders are the ground truth:** Today's sections are the Following folders, never topics the app makes up.
- **Mobile-first, desktop-grade:** full-featured on both, with one navigator per platform (tab bar on the phone, sidebar on the desktop).
- **No ads, no telemetry.**

---

## 2. User Personas

### Primary: the daily Today reader
- Follows 50–100 feeds across news, technology, sport and social (Bluesky, Mastodon).
- Reads mostly on an iPhone (Safari at 115% page zoom), and on a Windows desktop.
- Reads in Today, top to bottom, marking sections read as they go. Uses Read Later and Saved to keep stories.
- Wants the page still while reading, and as much content on screen as possible.

### Secondary: the occasional list reader
- Opens a folder or feed under Following, reads a few stories, marks the rest read.

---

## 3. Feature Requirements

### 3.1 Navigation and layout

| Requirement | Detail |
|---|---|
| Phone tab bar | A glass pill with **Today** and **Following**, plus a separate **Search** button. The Today tab carries the unread badge (99+ cap). The selected tab shows a filled glyph. |
| Phone header | Today and Following share one header: the app logo, a title (Today: the date, e.g. "Thu, Oct 8"; Following: "Following") with an 11px status line under it ("Updated just now • 3 new"), and 40px icon buttons at the right (Today: Listen; Following: edit feeds, add feed, settings). Logos sit 12px under the iPhone's clock strip on both. |
| Phone reader | Opens over Today or a list. No top bar; the Today tab returns to Today at the story's place. Swipes move between stories. The tab bar slides away while a story scrolls down and returns on scroll up. |
| Desktop layout | Three panes: sidebar (Following), a middle column (Today or a list, 440px by default, resizable, width synced) and the reader. Today stays in the middle column while a story is open beside it. |
| Desktop full screen | Double-click the reader's top bar: the story alone. Arrow keys move between stories, Up/Down scroll, Esc leaves. |
| Side margins (phone) | 14px everywhere (≈16pt at 115% zoom, the iOS layout margin). |

### 3.2 Today

| Requirement | Detail |
|---|---|
| Content | Unread stories from the last 24 hours, from folders included in Today (each folder's In Today switch in the feed manager). Muted stories are left out. |
| Top Stories | The five strongest stories across folders (authority rank, then multi-outlet consensus, then recency), lifted out of their folders. Each folder then fills back up to Stories per Category. Shown only while Rank stories is on. |
| Sections | One per folder, in the Following order. Stories per Category: 5–50 or All (Settings, per device). With Rank stories on, the most important stories are chosen; in the section, the 5 most important come first (whatever feed), then all the rest in Sort Order (oldest or newest first), whatever feed. A folder made only of feeds with no importance ranking is in Sort Order throughout. Top Stories stays in order of importance. |
| Importance | Memeorandum's live source leaderboard (fetched at most daily through the proxy, over a built-in list of 220 sources), with a bonus for each extra outlet covering the story. With Learn from what I open on, your reading adjusts it: per source, the share of its stories you open against your share overall (0.5×–2×, once 10 of its stories have been dealt with), from all your devices, over 30 days. A source Memeorandum does not rank gets a rank from your reading alone. |
| Order | **Sort Order** (Settings › Stories: oldest or newest first) is the one direction for the lists and Today. **Rank stories** (Settings › Today, on by default): Top Stories, then each folder's 5 most important stories, and the rest in Sort Order. Off: no ranking and no Top Stories; each folder takes its first stories in Sort Order. Oldest first reads like a queue, its oldest stories first; newest first shows its latest. |
| Learning from what you open | Opening a story in the reader counts as opened. Marking a story read without opening it counts as passed over, if it was shown to you as a card. Grouped copies taken along don't count, nor do read marks from another device. Stored per device for 30 days, with tallies shared through the cloud. Settings › Today › Learn from what I open (on by default), with Forget what I've opened (all devices). Changes show the next time Today is built. |
| Story clustering | Articles about the same story from several outlets become one card, led by the most authoritative outlet (with no ranking, the first to publish), with "Also from …". |
| Story card | Source name (as the feed writes it, full width), time, headline (medium weight, 0.95 × Article List title size), summary (Article List preview size, line height and lines), a 72px thumbnail beside the text, and a "…" at the end of the source line (phone; desktop: an action row shown on hover). Section headings are Title Size × 1.25 (22px by default), in the headline colour, with the folder icon in the accent. The first Top Story with a large enough picture gets a 16:9 hero. |
| Folder pills (phone) | A row of folder pills under the header jumps to a section. They show the folder's name only; the section heading has the count. The desktop has none: the sidebar's folders navigate. |
| Mark read | A story leaves Today once read. "Mark N read" (an outlined grey pill, on the right) at the end of each section marks the stories still showing there (and their grouped copies) at the tap. The next section slides up and a floating Undo bar appears. "Mark All Read in Folders" sits at the very end, centred: the same pill shape, size and spacing, filled in the logo's blue (grey "All Folders Read" once everything is read). |
| New stories | After a refresh, new stories never appear under the reader. The status line counts them ("3 new"), and a "N new stories" pill (the logo's blue) rebuilds Today at its top when tapped. When Today has no unread story showing (all caught up), it shows them at once instead: after a refresh, and on coming back from a story (`showNewTodayIfBlank`). |
| Refresh | Pull down on Today (phone); the header refresh button (desktop); auto-refresh in the background. |
| All caught up | "You're all caught up." On the phone it adds "Pull down to refresh."; the desktop, which has no pull, says "No unread stories from the last 24 hours." |
| Return to place | Back from a story lands on the next unread story at the same screen height. The page is kept, not rebuilt. |
| Calm rules | Taps act at once. Automatic changes to something on screen (a story read on another device, a picture that fails) wait until scrolling stops with it off screen. Height changes keep the first card on screen still. |
| Listen to Today | Reads the stories showing aloud, through the Listen player. |

### 3.3 Following

| Requirement | Detail |
|---|---|
| Smart lists | **Unread** (with "N older than today"), **Read Later**, **Saved**, **History** (read stories within the History window). The desktop sidebar also has **Today**. |
| Folders | Collapsible folders of feeds with unread counts. Folders with nothing unread are hidden unless "Show empty folders" is on. |
| Feed manager | The pencil (Edit) opens Settings › Feeds. Feeds are grouped by folder; each folder has an In Today switch and Rename. Each feed has a status line ("Checked 5m ago · newest story 2h ago", "Not loading since …", "Not checked yet"), Edit (name, URL, folder), Remove (with confirmation) and, for a feed that isn't loading, Retry. Add feed, and OPML import and export. |
| Right-click (desktop) | Feed: Refresh Feed, Mark All Read. Folder: Mark All Read, Collapse Folder, Collapse All Folders, Rename. |

### 3.4 Article list (Unread, folders, feeds, Read Later, Saved, History)

| Requirement | Detail |
|---|---|
| Card | Source name (as the feed writes it), relative date, headline, preview text, and an action row. Bluesky/Mastodon posts show the post text instead of a headline. |
| Sort order | Oldest published first (default) or newest first. |
| Deduplication | Optional (on by default): keeps one copy per story, favouring sources ranked by Memeorandum. |
| Pinning | A story opened from Unread stays in the list, dimmed, until the view changes. |
| Density | Standard Stream or Compact Wire (desktop top bar). |
| Phone gestures | Swipe left: toggle read. Swipe right: toggle Read Later. Long-press: context menu. |
| Right-click / long-press menu | Mark Above Read, Read Later, Save, Mark Read/Unread, Mark Below Read. |

### 3.5 Reader

| Requirement | Detail |
|---|---|
| Header | One source line: logo, name and time ("The Verge · Oct 10, 8:00 AM"; the logo stays level with the first line when the name wraps). Then the headline (Article Reader > Title Size, 1.5 by default; weight 500; line spacing 0.84 × Line Height), then the author only when it isn't the source. |
| Full content | Short feed excerpts trigger a full-article fetch through the proxy chain. |
| Sanitising | All article HTML is sanitised with DOMPurify before it is shown. |
| Media | Image lightbox (pinch or double-tap to zoom); tiny and broken images hidden; responsive embeds; an inline audio player for podcast items. |
| Navigation | j/k or ↑/↓ (and the reader's Next) move through the brief the story came from, or through the list it came from. |

### 3.6 Story actions

| Surface | Buttons |
|---|---|
| Desktop: list cards, Today cards, reader | One row everywhere: **Read · Read Later · Save · Open original · Share**. Icon buttons with tooltips, 32px with 18px icons, 4px apart, the first icon on the text edge, grey off and blue on. |
| Phone: Today cards | No row. The "…" on the source line, or a long-press on the card, opens a menu: **Mark as Read · Read Later · Save · Share… · Open Original** (labels follow the story's state). It is the lists' context menu; its items press the card's hidden buttons. Tapping the card opens the story. A touch or click outside any context menu only closes it (as on iOS); the tap does nothing else. |
| Desktop: Today column | The row above, shown on hover, keyboard focus or the open story; its space stays reserved, so nothing moves. |
| Phone: reader | **Save · Listen · Share** and a "…" for **Mark as Read / Unread · Read Later · Open Original** (the same menu as Today's, pressing the row's hidden buttons) |
| Phone: list cards | Open in Reader · Save · Open original (swipes handle read and Read Later) |

### 3.7 Search

| Requirement | Detail |
|---|---|
| Search sheet | Opened from the Search button or `/`. Searches stories as you type. Shortcuts to Unread, Read Later and Saved. |
| Filters (desktop) | Scope (All folders or one folder) and read state (All, Unread, Read). |

### 3.8 Listen (text to speech)

| Requirement | Detail |
|---|---|
| Listen | Reads a story, or Today, aloud with the browser's speech synthesis. |
| Player | Floats above the tab bar while listening: "Listening" / "Paused", Pause or Resume, Stop. Keeps the screen awake while playing. |
| Buttons | Today: the header's headphones button (phone), the details line (desktop). Story: the reader row (phone), the top bar (desktop). The icon becomes Stop while playing. |

### 3.9 Settings

Settings has two panels: **Settings** (the gear) and **Feeds** (the pencil). The gear's panel has a second page, **Text Size & Zoom**, opened from its last row and left with ‹ in the header. Each setting's description is one short line under its name (12.5px); menus sit on their setting's own line.

| Section | Settings |
|---|---|
| Account | The signed-in account (tap for its email) and Sign Out |
| Refresh | Auto-Refresh: Off, 15 minutes, 30 minutes (default), 1 hour. A timed refresh is skipped while the app is in the background or on Data Saver; coming back to the app refreshes. |
| Today | Show images (per device); Stories per Category (5–50, All); Rank stories; Learn from what I open; Forget what I've opened |
| Stories | Sort Order (oldest or newest first, for the lists and Today); Deduplicate by title; Muted words (words or phrases; stories with them in the headline or summary are hidden and not counted, and Today offers "N muted · Show") |
| Following | Show empty folders; History (7, 30, 60 or 90 days) |
| Appearance | Theme (Light / Dark); Font; Text size & zoom › |

**Text Size & Zoom** page:

| Section | Settings |
|---|---|
| (top) | App Zoom (per device) |
| Following | Folder Size (also the sidebar's feed names), Row Spacing |
| Article List | Title Size (lists, Today's stories a little smaller, and Today's section headings at 1.25×), Preview Text Size (default 0.9), Line Height, Source Name Size (lists, Today, the reader's source line; default 0.8), Preview Lines, Social Preview Lines (Bluesky/Mastodon) |
| Article Reader | Title Size (stories, and Today's heading on a computer; default 1.5), Body Text Size, Line Height, Author & Date Size |
| Reset text sizes to defaults | Puts every size and spacing back to its default. Theme, font, sort order, auto-refresh, de-duplicate, history window and app zoom are kept. |

Text sizes are saved per device (phone and desktop separately), except Folder Size, Row Spacing and Source Name Size, which are shared.

### 3.10 Feeds and fetching

| Requirement | Detail |
|---|---|
| Feed types | RSS and Atom; Bluesky profiles (public Bluesky API, `public.api.bsky.app`); Mastodon RSS; YouTube playlist feeds. |
| Fetching | Through a Cloudflare Worker proxy, with allorigins.win as the fallback. corsproxy.io was removed (build 199; it now needs an API key). Slow feeds get their own lane, so they don't hold up the rest. |
| Favicons | Per feed, cached; Google's favicon service as a fallback. Dark-on-transparent icons are inverted in dark mode. |
| Feed health | Each feed's last successful load and error count, shown in the feed manager. |
| Article retention | A refresh replaces each feed's articles with what it serves now. Unread articles are kept until read or 4 days old. |

### 3.11 Cloud sync

| Requirement | Detail |
|---|---|
| Sign-in | Firebase email and password (register, sign in, forgot password, sign out with confirmation). Required: without a signed-in user the sign-in window stays up. On `localhost` a local test user stands in, and nothing syncs. |
| What syncs | Feeds and folders; read state (as link hashes, up to 30,000, merged with arrayUnion); Read Later and Saved (full article snapshots, so they outlive feed removal); folder order, the desktop middle column's width, auto-refresh, folders in Today, muted words, and each device's tally of what you open and pass over. |
| What stays on the device | Text sizes, theme, font, sort order, show images, Stories per Category, Rank stories, Learn from what I open (and its log of stories), show empty folders, de-duplicate, history window. |
| Merge | Read marks are a union of all devices. A changed list (muted words, folders in Today) from another device applies only when it differs, so Today is not rebuilt for nothing. |

### 3.12 Keyboard (desktop)

| Key | Action |
|---|---|
| `j` / `↓` | Next story |
| `k` / `↑` | Previous story |
| `→` / `←`, `↓` / `↑` | In full screen: next / previous story, scroll |
| `r` | Toggle read |
| `b` | Back to Today from one of its stories; otherwise Read Later |
| `o` | Open the original |
| `t` | Open Today |
| `/` | Search |
| `?` | Shortcuts |
| `Esc` | Leave full screen, close dialogs |

### 3.13 Notifications

| Requirement | Detail |
|---|---|
| Toasts | Short messages for actions and errors (red for failures), queued, above everything. |
| Undo bar | "Marked N read · Undo" floats over the page above the tab bar for 5 seconds. It takes no room, so nothing moves when it goes. |

---

## 4. Non-Functional Requirements

### Stability (calm)
- Background refreshes never rebuild Today under the reader, and never move what is on screen.
- `keepTodayInPlace()` keeps the first card on screen still through every height change, because iOS Safari has no scroll anchoring.
- The Today tab brings Today back on a still scroller (`stillReader()`). Today and a story share `#reader-view` on the phone, and the tab bar sits outside it, so a tab tap doesn't stop a fling there. Overflow is hidden first, Today returns two frames later, and scrolling comes back 150ms after.
- With Reduce Motion on, transitions are off (`transition: none`), not shortened to 0.01ms: a 0.01ms duration made every style change land a frame late.
- Status text changes ("Updating…" → "Updated just now • 3 new") sit on fixed-height lines that cannot wrap.

### Performance
- The article list is built as HTML strings, and its re-render is skipped when nothing changed (`_lastTimelineKey`).
- Refresh: slow feeds run in their own lane, with one article-store save per batch.
- Today's clustering runs once per build. Refilling folders after Top Stories reruns only the per-folder selection.

### Security
- All article HTML goes through DOMPurify with an explicit allowlist.
- Firebase manages the sign-in tokens; no credentials are stored by the app.

### Storage
- IndexedDB `RSSReaderDB` version 6. The `articles` store has no indexes: their stale entries had grown the database to 121 MB. The live data is small (articles about 2 MB, History about 5 MB).
- Read marks: up to 50,000 kept locally, 30,000 in the cloud.

### Compatibility
- Evergreen browsers (Safari on iOS, Edge, Chrome, Firefox). The main device is an iPhone at 115% Safari page zoom, a 339px-wide CSS viewport.

---

## 5. Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| Markup | HTML5, one file (`index.html`) |
| Styling | Tailwind CSS v4, compiled and inline (no CDN, so only classes already used exist), plus hand-written CSS |
| Scripting | Vanilla JavaScript, no framework |
| Sanitising | DOMPurify 3.1.6 (cdnjs) |
| Auth and cloud | Firebase 11.6.1 (Auth, Firestore), ES module imports |
| Offline | Articles, feeds and read state are in IndexedDB, so the app reads offline. An inline service worker is defined, but browsers reject its `blob:` URL, so it never registers and there is no asset cache. |
| Deploy | `SyncGit-RSSReader.ps1` (`/sync-rssreader`) commits, bumps the cache version and build number, and pushes to GitHub Pages. |

### Data flow
```
Feed URL
  → Cloudflare Worker proxy (allorigins.win fallback) / public Bluesky API
  → parse (DOMParser) → article objects → window.articles → IndexedDB 'articles'
  → Today: buildTodayBrief() → buildStoryClusters() → composeSlotBrief() → normalizeBriefDOM()
  → Lists: renderTimeline() · Reader: selectArticle()
  → read marks → IndexedDB + Firestore state/readState (hashes)
```

### IndexedDB stores

| Store | Contents |
|---|---|
| `articles` | The article cache (key: id) |
| `feeds` | Followed feeds (key: url) |
| `metadata` | Read state, Read Later links, the reading log (`readingLog`: what you opened or passed over, 30 days) and other small values |
| `favicons` | Cached site icons |
| `readArchive` | History: read stories (key: link, index readAt) |
| `readLaterItems`, `savedItems` | Local mirrors of the Read Later and Saved buckets |

### Firestore (per user: `artifacts/{APP_ID}/users/{uid}/…`)

| Path | Contents |
|---|---|
| `feeds` (collection) | Feeds and folders |
| `readLater`, `saved` (collections) | Article snapshots |
| `state/readState` | `readHashes`, `readLaterLinks` |
| `state/uiPrefs` | `paneWidth`, `categoryOrder`, `autoRefresh`, `todayExcluded`, `muteWords`, `readingTally` (per device: `{at, t: {source: [dealt, opened]}}`), `learnResetAt` (merge writes) |

### localStorage keys

| Key | Contents |
|---|---|
| `newsreader_prefs` | Text sizes (per device), font, sort order, auto-refresh, de-duplicate, history window |
| `newsreader_theme` | Light or dark |
| `newsreader_today_images` | Show images in Today |
| `newsreader_today_rank` | Rank stories (`0` = off). Build 339's `newsreader_today_order` is carried over into it and Sort Order once, then removed |
| `newsreader_learn_opens` | Learn from what I open (`0` = off) |
| `newsreader_device_id` | This device's key for its reading tally in the cloud |
| `newsreader_today_excluded` | Folders left out of Today |
| `newsreader_brief_stories_per_cat` | Stories per Category |
| `newsreader_mute_words` | Muted words |
| `newsreader_showemptycats` | Show empty category folders |
| `newsreader_catorder` | Folder order |
| `newsreader_collapsed_categories`, `newsreader_folders_section_collapsed` | Collapsed folders |
| `newsreader_pane_width` | Desktop middle column width |
| `newsreader_viewmode` | Standard Stream or Compact Wire |
| `newsreader_feed_health` | Per-feed load history |
| `newsreader_last_seen_at` | The last visit, for "N new since …" |
| `newsreader_read`, `newsreader_readlater` | Legacy read and Read Later lists |
| `favicon_…` | Legacy cached favicon URLs |

---

## 6. Out of Scope

- Native apps (App Store / Google Play)
- A server or API of its own
- Shared or multi-user feed lists
- Feed discovery or recommendations
- Topics the app infers on its own (Today uses the reader's folders only)
- Scheduled briefs (removed in build 281; Today is the only brief)

---

## 7. Known Constraints

- **Proxy dependency:** feeds load through the Cloudflare Worker. If it and allorigins.win are both unavailable, refresh fails.
- **Firebase dependency:** the app needs a signed-in Firebase account; without one it shows only the sign-in window. On `localhost` it runs as a local test user and does not sync.
- **No offline asset cache:** the app needs a connection to load. Its data is local, but its code isn't cached.
- **Single-file maintenance:** all code is in one file of about 14,600 lines (build 342).
- **Comments say why, not when:** a comment in the code gives the reason or the constraint behind it, briefly. Build numbers, dates, requests and what the code used to do belong in `MajorRevisions/Modern-Tabs-Redesign.md`, not in the code.
- **Tailwind stays minified:** the compiled Tailwind block is the single line Tailwind wrote. Don't run a formatter over `index.html`: a reformat on 2026-10-03 spread that line over 2,270 lines.
- **Compiled Tailwind:** a utility class not already in the compiled block has no effect. New styling needs hand-written CSS.
