# Today (formerly RSS Reader) — Product Requirements Document

| Metadata | Value |
| :--- | :--- |
| **Document Version** | v3.5 (Build 435) |
| **Date** | October 31, 2026 |
| **Status** | Live in Production (`today.dautovic.com`) |
| **Primary Repository** | `SDautovic-GH/RSSReader` |
| **Desktop Companion** | `ScriptLibrary/PROJECTS/RSSReader` |
| **Changelog Reference** | `Documentation/Redisign-Plan-Briefing-TodayLibrary.md` |

---

## 1. Product Overview

### Vision
A fast, private, single-file RSS reader and newsletter briefing tool that operates as a Progressive Web App on mobile and desktop, backed by multi-device cloud synchronization. Reading centers on **Today**: a live, calm intelligence workspace of the last 24 hours' unread coverage and newsletters, grouped strictly by the reader's own chosen folders. No native server, no complex framework build step, and no behavioral telemetry.

### Guiding Principles
- **Single-File Delivery:** All HTML, CSS, and application logic live directly inside `index.html`.
- **Today First:** Opens immediately into Today on both mobile and desktop. Feed management and triage lists (Following, folders, feeds, unread) are one tap or click away.
- **Dual Intelligence Presentation:** Today provides two complementary views via a unified header switcher:
  - **✦ Briefing View:** An executive, AI-synthesized daily briefing powered by Gemini Flash that summarizes unread coverage by section with bold lead-ins and direct `#N` source citations.
  - **▣ Cards View:** A rich, responsive magazine card deck displaying clustered coverage with customizable column density (1, 2, or 3 columns).
- **Workspace Separation (2-Column Today vs. 3-Column Unread):**
  - **Today** is strictly a **2-column focused reading workspace** (Sidebar + Dedicated Content Canvas). Clicking a card in Cards mode opens the story in a full 2-column reader canvas (`desktop-today-story`) with a `< Today` back button that returns directly to Cards. Today is never split into three cramped columns.
  - **Unread** (`#feed-btn-all`) and feed lists retain the classic **3-column triage workstation** (Sidebar + Timeline article list + Reader pane).
- **Simultaneous Mathematical Centering:** The active header switcher and the body content below it share the exact same `50%` horizontal centerline at all times, moving synchronously during window resizing with zero drift.
- **Calm Reading & Visual Stability:** Content on screen never shifts or jumps except in direct response to reader interaction. Background polling never reshuffles open views.
- **Folders as Ground Truth:** Sections in Today mirror the user's Following folders; the app does not invent synthetic topics.
- **Zero Configuration Discovery:** Readers can paste plain website URLs or user handles (`@handle.bsky.social`, `substack:name`, `medium:user`, `youtube:channel`) without hunting down exact XML endpoints.
- **No Ads, No Tracking, Full Privacy.**

---

## 2. User Personas

### Primary: The Executive Intelligence Reader
- Subscribes to 50–150 sources spanning news, tech, newsletters, and social channels.
- Reads primarily on an iPhone (Safari at 115% zoom) and a multi-monitor desktop workstation.
- Begins each day with the **✦ Briefing** view for an executive overview, then switches to **▣ Cards** view (`1` or `2` shortcut) to drill into specific stories.
- Requires absolute visual stability: zero layout shifts, persistent desktop headers on window resize, and synchronized header-to-content alignment.

### Secondary: The Triage & Deep-Dive Reader
- Focuses on deep triage of specific subject folders or newsletter digests.
- Operates primarily in the 3-column **Unread** workspace to rapid-fire triage incoming articles (`j`/`k`, `r` for mark read).
- Actively triages backlogs using "Mark older than 24 hours" to prevent unread count anxiety.

---

## 3. Core Feature Requirements

### 3.1 Navigation and Layout Architecture

| Surface | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Mobile Tab Bar** | Glass pill at screen bottom | Houses **Today** and **Following**, plus a standalone **Search** icon. Unread count badge caps at 99+. Selected tab displays filled glyph. |
| **Mobile Header** | Adaptive single-row header | Logo, title (Today: date, e.g. "Saturday, Oct 31"; Following: "Following"), status line ("Updated just now • 3 new"), and action buttons (Listen, Edit Feeds, Add Feed, Settings). |
| **Mobile Reader** | Full-screen reading overlay | Opens cleanly over Today or active list. Tab bar slides away on downward scroll, returns on upward scroll. Horizontal swipes navigate adjacent stories. |
| **Desktop: Today Briefing** | 2-column executive canvas | Sidebar (left) + Centered 760px editorial reading canvas (`desktop-today-briefing`). `#timeline-pane` is hidden. Header switcher mathematically centered at `50%`. |
| **Desktop: Today Cards** | 2-column wide magazine deck | Sidebar (left) + Wide magazine grid (`desktop-today-cards-wide`). Configurable in 1, 2, or 3 columns via App Settings. `#viewer-pane` is hidden. Header switcher centered at `50%`. |
| **Desktop: Today Story** | 2-column focused reader | Clicking a story from Today Cards opens in a 2-column reading canvas (`desktop-today-story`) with `< Today` back button in header. Pressing `< Today`, `b`, or `Escape` returns to Cards at the exact scroll position. |
| **Desktop: Unread & Feeds** | 3-column triage workstation | Collapsible sidebar (left), resizable timeline article list (default 440px), and expansive reader pane (right). Active only when browsing Unread or feed lists. |
| **Persistent Headers** | Zero collapse on resize | Desktop headers (`#timeline-header`, `#viewer-header`) persist at all viewport widths via `@media (hover: hover) and (pointer: fine)` and JS `isDesktopDevice()`. Mobile tab bar stays hidden on desktop. |
| **Desktop Full Screen** | Distraction-free reading | Double-clicking reader top bar isolates story. Arrow keys navigate and scroll; `Esc` exits. |

### 3.2 Today Engine & Intelligence Modes

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **✦ AI Morning Briefing** | Executive synthesis | Powered by Gemini Flash (`gemini-2.5-flash`). Synthesizes unread coverage into an executive brief broken down by folder section with bold topic headlines and numbered citations (`#1`, `#2`) that link directly to full articles. Automatically prepped at 5:00 AM local time or generated on-demand. |
| **▣ Cards View** | Multi-column magazine deck | Clustered cards categorized by Following folders. Supports 1, 2, or 3 columns (`--today-cards-cols`) configured via App Settings with responsive container scaling (`760px`, `1240px`, `1680px`). |
| **View Switcher** | Instant seamless toggle | Unified segmented control (`✦ Briefing` and `▣ Cards`) anchored in the active desktop header bar. Keyboard shortcuts `1` (Briefing) and `2` (Cards). |
| **Top Stories** | Highlighted consensus | Up to 5 most significant stories across all folders (ranked by source authority, multi-outlet consensus, and recency). |
| **Story Clustering** | Duplicate consolidation | Multi-outlet coverage of identical events is clustered into a single master card led by the most authoritative source, with an "Also from..." footer. |
| **Calm Updates** | Zero jump guarantee | Background sync never repositions elements on screen. New incoming stories display a floating `"N new stories"` banner that only refreshes upon user tap. |
| **Listen Mode** | Speech synthesis | Web Speech API integration with persistent floating player controls to read Today's briefing aloud. |

### 3.3 Feed Management & Discovery

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Website Autodiscovery** | Plain URL resolution | Pasting standard website URLs (e.g. `daringfireball.net`, `arstechnica.com`) automatically queries the page via proxy and extracts `<link rel="alternate" type="application/rss+xml">` or Atom endpoints. |
| **Social & Platform Shortcuts** | Rapid subscription prefixes | Add Feed parser resolves shorthand handles: <br>• `@handle.bsky.social` $\rightarrow$ Bluesky public API <br>• `substack:publication` $\rightarrow$ `publication.substack.com/feed` <br>• `medium:username` $\rightarrow$ `medium.com/feed/@username` <br>• `youtube:channel_id` $\rightarrow$ YouTube XML playlist feed. |
| **Inbound Email Bridge** | Newsletter-to-RSS | Dedicated Cloudflare Worker (`today-newsletter-bridge`) converts inbound emails to `newsletters@dautovic.com` into an RSS 2.0 feed stored in Cloudflare KV. |
| **OPML Import / Export** | Universal portability | Full import/export of folder hierarchies and feed metadata via Settings $\rightarrow$ Feeds. |

### 3.4 Triage & Read State Management

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Mark Older Than 24h** | Targeted backlog triage | Available in timeline header button (`#timeline-count`) and folder context menus. Clears stale backlogs while preserving today's active unread stories. |
| **Section Mark Read** | Progressive consumption | "Mark N Read" button at the end of each folder section marks visible cards and advances smoothly to the next section. |
| **Global Mark Read** | End-of-briefing clear | "Mark All Read in Folders" pill at the conclusion of Today marks all active briefing folders read with immediate 5-second undo support. |
| **Smart Lists** | Structured views | Dedicated views for Unread, Read Later, Saved (starred), and History (up to 90 days retention). |

### 3.5 Reader & Content Rendering

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Today Push-and-Return** | Focused 2-column reading | Opening a card from Today Cards activates `desktop-today-story` in a centered 760px canvas with `< Today` back button. Returning smoothly restores Cards at the exact card scroll height. |
| **Full Content Extraction** | Truncation bypass | Automatic full-text extraction through proxy for truncated feed summaries. Repeated page title headers and bylines are cleanly stripped. |
| **Sanitization** | Security guarantee | DOMPurify 3.1.6 sanitization on all inbound HTML elements and styling attributes. |
| **Typography & Sizing** | Device-specific customization | Granular App Zoom, title sizing, line height, preview lengths, Cards View Columns (1, 2, or 3), and custom typography configurable per device. |

---

## 4. Technical Architecture

### 4.1 System Topology
```
[Content Sources]
  ├── Standard RSS / Atom Feeds
  ├── Website HTML Pages (Autodiscovery)
  ├── Social Handles (@bsky, Substack, Medium, YouTube)
  └── Inbound Emails (Cloudflare Email Routing -> today-newsletter-bridge Worker -> KV)
          │
          ▼
[Network Layer]
  ├── Direct Fetch (today-newsletter-bridge, dautovic.com)
  └── CORS Proxy (still-shadow-1ebe.sdfyix.workers.dev -> allorigins.win fallback)
          │
          ▼
[Client Application: today.dautovic.com]
  ├── HTML5 / Vanilla JS / Compiled Tailwind v4 in single index.html
  ├── IndexedDB (RSSReaderDB v6: articles, feeds, favicons, history)
  ├── localStorage (device prefs, zoom, layouts, cards columns)
  └── Gemini 2.5 Flash API (Streaming Executive Briefing synthesis)
          │
          ▼
[Cloud Synchronization]
  └── Firebase 11.6.1 (Auth + Firestore multi-tenant isolation per UID)
```

### 4.2 Workstation Mode Classes & Pane Matrix

| State | Active Body Class | `#sidebar-pane` | `#timeline-pane` | `#viewer-pane` | Header Switcher |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Today: Briefing** | `desktop-today-briefing` | Visible (240px) | `display: none` | `display: flex` (100%) | `#viewer-today-switcher` (Centered at 50%) |
| **Today: Cards** | `desktop-today-cards-wide` | Visible (240px) | `display: flex` (100%) | `display: none` | `#desk-today-switcher` (Centered at 50%) |
| **Today: Story** | `desktop-today-story` | Visible (240px) | `display: none` | `display: flex` (100%) | Hidden (`< Today` back button shown) |
| **Unread / Feeds** | *(none)* | Visible (240px) | Visible (440px / resizable) | `display: flex` | Standard timeline controls |

### 4.3 Deployment Pipeline
- Code updates committed to `SDautovic-GH/RSSReader` via `SyncGit-macOS-RSSReader.ps1` (or Windows counterpart).
- Automated build pipeline bumps service worker cache version and pushes to GitHub `main`.
- Cloudflare Workers Builds automatically detects git push, builds, and deploys globally to `today.dautovic.com` in ~20 seconds.
