# Today (formerly RSS Reader) — Product Requirements Document

| Metadata | Value |
| :--- | :--- |
| **Document Version** | v3.13 (Build 458) |
| **Date** | November 1, 2026 |
| **Status** | Live in Production (`today.dautovic.com`) |
| **Primary Repository** | `SDautovic-GH/RSSReader` |
| **Desktop Companion** | `ScriptLibrary/PROJECTS/RSSReader` |
| **Changelog Reference** | `Documentation/Redesign-Plan-Two-Pane.md` |

---

## 1. Product Overview

### Vision
A fast, private, single-file RSS reader and newsletter briefing tool that operates as a Progressive Web App on mobile and desktop, backed by multi-device cloud synchronization. Reading centers on **Today**: a live, calm intelligence workspace of the last 24 hours' unread coverage and newsletters, grouped strictly by the reader's own chosen folders. No native server, no complex framework build step, and no behavioral telemetry.

### Guiding Principles
- **Single-File Delivery:** All HTML, CSS, and application logic live directly inside `index.html`.
- **Today First:** Opens immediately into Today on both mobile and desktop. Feed management and triage lists (Following, folders, feeds, unread) are one tap or click away.
- **Dual Intelligence Presentation:** Today provides two complementary views via a unified header switcher:
  - **✦ Briefing View:** An executive, AI-synthesized daily briefing powered by Gemini Flash that summarizes unread coverage by section with bold lead-ins and direct `#N` source citations.
  - **▣ Cards View:** A rich, responsive magazine card deck displaying clustered coverage with customizable column density (1, 2, or 3 columns) and sticky Category Jump Bars.
- **Unified 2-Pane Workstation Architecture (All Views):**
  - The legacy 3-pane layout (Sidebar + Timeline article list + Reader pane + resizer) is completely retired.
  - Every view on desktop — **Today**, **Unread**, **Personal Hub** (`Read Later`, `Saved`, `History`), **Subscription Folders**, and **Single Feeds** — operates as a dedicated **2-pane workstation**: **Sidebar (240px) + Centered Cards Grid/Canvas (`#today-column`)**.
  - Clicking any card in any view opens the story in a focused 2-pane reader canvas (`desktop-today-story`), centered at 760px with a dynamic back button (`< Unread`, `< Technology`, `< Ars Technica`, `< Saved`, etc.).
  - Returning via Back, `b`, or `Escape` immediately restores the cards grid and smoothly centers and pulses the read card.
- **Durable Personal Hub Preservation:** Stories in `Read Later`, `Saved`, and `History` are durable collections; read stories are never auto-hidden by inbox sweeps.
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
- Operates primarily in the **Unread** and **Folder** cards workstations to rapid-fire triage incoming articles (`j`/`k`, `r` for mark read) using Category and Outlet Jump Bars.
- Actively triages backlogs using "Mark older than 24 hours" to prevent unread count anxiety.

---

## 3. Core Feature Requirements

### 3.1 Navigation and Layout Architecture

| Surface | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Mobile Tab Bar** | YouTube floating glass capsule | Detached floating capsule (42px compact height, 340px max-width, `-webkit-backdrop-filter: blur(20px) saturate(180%)`, fill `rgba(18, 18, 22, 0.25)` in dark mode) hovering just above the home indicator bar. Houses 4 icon tabs: **Today** (`#icon-sun` + live unread badge, smart tap to scroll to top then toggle Cards/Briefing), **Library** (pure Subscriptions & Folders manager), **Bookmarks** (`#icon-bookmark` with sticky 3-way segmented Personal Hub for `[ 🔖 Read Later ] [ ⭐ Saved ] [ ⏱️ History ]`), and **Search** (`#mob-tab-search`). Active tab displays an elevated inner translucent capsule highlight with pure bright white icon (`#ffffff`). Zero text labels. |
| **Mobile Header** | Adaptive single-row header | Logo, title (Today: date, e.g. "Saturday, Oct 31"; Following: "Following"), status line ("Updated just now • 3 new"), and action buttons (Listen, Edit Feeds, Add Feed, Settings). |
| **Mobile Reader** | Full-screen reading overlay | Opens cleanly over Today or active list. Tab bar slides away on downward scroll, returns on upward scroll. Horizontal swipes navigate adjacent stories. |
| **Desktop: Today Briefing** | 2-pane executive canvas | Sidebar (left) + Centered 760px editorial reading canvas (`desktop-today-briefing`). `#timeline-pane` is hidden. Header switcher mathematically centered at `50%`. |
| **Desktop: Today Cards** | 2-pane wide magazine deck | Sidebar (left) + Wide magazine grid (`desktop-today-cards-wide`). Configurable in 1, 2, or 3 columns via App Settings. `#viewer-pane` is hidden. Header switcher centered at `50%`. |
| **Desktop: Personal Hub** | 2-pane durable cards workstation | Sidebar (left) + Wide magazine grid in `#today-column` for `Read Later`, `Saved`, and `History`. Anchored with centered 3-way segmented switcher in `#timeline-header`. Stories remain permanently visible and are never auto-hidden when read. |
| **Desktop: Unread & Feeds** | 2-pane cards workstation | Sidebar (left) + Wide magazine grid in `#today-column`. Unread groups by folder with Category Jump Bars; Folders group by publication source with Outlet Jump Bars (`[Ars Technica] [The Verge]...`). Single feeds render as a clean story stream. Legacy 3-pane split retired. |
| **Desktop: Story Reader** | 2-pane focused reader | Clicking any story opens in a 2-pane reading canvas (`desktop-today-story`), centered at 760px with dynamic back button (`< Source`) in header. Pressing Back, `b`, or `Escape` returns to Cards at the exact scroll position. |
| **Persistent Headers** | Zero collapse on resize | Desktop headers (`#timeline-header`, `#viewer-header`) persist at all viewport widths via `@media (hover: hover) and (pointer: fine)` and JS `isDesktopDevice()`. Mobile tab bar stays hidden on desktop. Mobile personal hub bar stays hidden on desktop to avoid duplicate headers. |
| **Wide Screen Layout & Centered Controls** | Ergonomic centered controls & full bleed | On wide/ultrawide displays, the app container remains 100% full-bleed edge-to-edge chrome seamlessly merging into the browser window (zero artificial outer letterboxing or flanking black borders). Header controls are bound inside `.timeline-header-inner` and `.viewer-header-inner` to mathematically align with the exact margins of the reading canvas (`1240px` cards, `760px` briefing/story). Eliminates disjointed multi-thousand-pixel chasms between controls while maintaining edge-to-edge chrome. Configurable via Settings $\rightarrow$ Appearance (`Centered Content (Recommended)` vs `Full Width Stretch`). |
| **Desktop Full Screen** | Distraction-free reading | Double-clicking reader top bar isolates story. Arrow keys navigate and scroll; `Esc` exits. |

### 3.2 Today Engine & Intelligence Modes

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **✦ AI Morning Briefing** | Executive synthesis | Powered by Gemini Flash (`gemini-2.5-flash`). Synthesizes unread coverage into an executive brief broken down by folder section with bold topic headlines and numbered citations (`#1`, `#2`) that link directly to full articles. Automatically prepped at 5:00 AM local time or generated on-demand. |
| **▣ Cards View (Category Cards)** | Unified category deck with immediate unread-only triage | Each folder/category renders as a **single unified Category Card** (`.brief-cat-section`) containing its stories in clean list rows with subtle dividers, eliminating the visual clutter of dozens of isolated boxes. Stories feature inline action controls: `Mark Read` (checkmark button with smooth collapse animation), `Save` (star button), and `...` More options. Supports 1, 2, or 3 columns (`--today-cards-cols`) configured via App Settings (`760px`, `1240px`, `1680px`). |
| **Immediate Read Disappearance** | Strict unread-only presentation | Marking a story read immediately hides it (`display: none !important`), smoothly collapsing the row. Opening a story in the reader automatically hides it upon return via `< Today`, `b`, or `Escape`, ensuring only unread stories remain visible. Categories with zero unread stories cleanly disappear; when all stories are read, "You're all caught up" displays. |
| **View Switcher** | Instant seamless toggle | Unified segmented control (`✦ Briefing` and `▣ Cards`) anchored in the active desktop header bar. Keyboard shortcuts `1` (Briefing) and `2` (Cards). Obsolete inline briefing banner slots and compact wire toggle removed in favor of clean dedicated views. |
| **Category Recaps** | Individual section drilldown | AI-powered section synthesis (`generateCategoryRecap`) available directly from each folder section heading in Today Cards view. |
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
