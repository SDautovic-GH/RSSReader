# Today (formerly RSS Reader) — Product Requirements Document

| Metadata | Value |
| :--- | :--- |
| **Document Version** | v3.0 (Build 368) |
| **Date** | October 2026 |
| **Status** | Live in Production (`today.dautovic.com`) |
| **Primary Repository** | `SDautovic-GH/RSSReader` |
| **Desktop Companion** | `ScriptLibrary/PROJECTS/RSSReader` |
| **Changelog Reference** | `MajorRevisions/Modern-Tabs-Redesign.md` |

---

## 1. Product Overview

### Vision
A fast, private, single-file RSS reader and newsletter briefing tool that operates as a Progressive Web App on mobile and desktop, backed by multi-device cloud synchronization. Reading centers on **Today**: a live, calm briefing of the last 24 hours' unread stories and newsletters, grouped strictly by the reader's own chosen folders. No native server, no complex framework build step, and no behavioral telemetry.

### Guiding Principles
- **Single-File Delivery:** All HTML, CSS, and application logic live directly inside `index.html`.
- **Today First:** Opens immediately on Today on both mobile and desktop. Lists (Following, folders, feeds, unread) are one tap away.
- **Calm Reading:** Content on screen never shifts or jumps except in direct response to reader interaction. Background polling never reshuffles open views.
- **Folders as Ground Truth:** Sections in Today mirror the user's Following folders; the app does not invent synthetic topics.
- **Inbound Newsletter Synthesis:** Inbound email newsletters are transformed via serverless bridge into clean RSS feeds, keeping inbox clutter out of traditional email clients.
- **Zero Configuration Discovery:** Readers can paste plain website URLs or user handles (`@handle.bsky.social`, `substack:name`, `medium:user`, `youtube:channel`) without hunting down exact XML endpoints.
- **No Ads, No Tracking, Full Privacy.**

---

## 2. User Personas

### Primary: The Daily Briefing Reader
- Subscribes to 50–150 sources spanning news, tech, newsletters, and social channels (Bluesky, Mastodon).
- Reads primarily on an iPhone (Safari at 115% zoom) and a multi-monitor desktop.
- Consumes Today from top to bottom, triaging or marking sections read as they proceed.
- Requires absolute visual stability: zero layout shifts while reading.

### Secondary: The Triage & Deep-Dive Reader
- Focuses on deep dives into specific subject folders or newsletter digests.
- Actively triages backlogs using "Mark older than 24 hours" to prevent unread count anxiety.

---

## 3. Core Feature Requirements

### 3.1 Navigation and Layout

| Surface | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Mobile Tab Bar** | Glass pill at screen bottom | Houses **Today** and **Following**, plus a standalone **Search** icon. Unread count badge caps at 99+. Selected tab displays filled glyph. |
| **Mobile Header** | Adaptive single-row header | Logo, title (Today: date, e.g. "Saturday, Oct 25"; Following: "Following"), 11px status line ("Updated just now • 3 new"), and 40px action buttons (Listen, Edit Feeds, Add Feed, Settings). |
| **Mobile Reader** | Full-screen reading overlay | Opens cleanly over Today or active list. Tab bar slides away on downward scroll, returns on upward scroll. Horizontal swipes navigate adjacent stories. |
| **Desktop Layout** | Three-column workspace | Collapsible Following sidebar (left), resizable middle list/Today column (default 440px), and expansive article reader pane (right). |
| **Desktop Full Screen** | Distraction-free reading | Double-clicking reader top bar isolates story. Arrow keys navigate and scroll; `Esc` exits. |

### 3.2 Today Engine

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Content Scope** | 24-Hour window | Unread stories published within the trailing 24 hours from folders flagged "In Today". |
| **Top Stories** | Highlighted consensus | Up to 5 most significant stories across all folders (ranked by source authority, multi-outlet consensus, and recency). |
| **Folder Sections** | Following order | Rendered in user-defined folder sequence. Cap of 5–50 stories or "All" per category. Top 5 in category prioritized by importance, remaining in chronological sort order. |
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
| **Full Content Extraction** | Truncation bypass | Automatic full-text extraction through proxy for truncated feed summaries. Repeated page title headers are cleanly stripped. |
| **Sanitization** | Security guarantee | DOMPurify 3.1.6 sanitization on all inbound HTML elements and styling attributes. |
| **Typography & Sizing** | Device-specific customization | Granular App Zoom, title sizing, line height, preview lengths, and custom typography configurable per device. |

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
  └── localStorage (device prefs, zoom, layouts)
          │
          ▼
[Cloud Synchronization]
  └── Firebase 11.6.1 (Auth + Firestore multi-tenant isolation per UID)
```

### 4.2 Multi-User Tenant Separation
1. **Local Mode:** Independent IndexedDB databases per browser profile/device.
2. **Cloud Mode:** Firestore records partitioned under `artifacts/{APP_ID}/users/{uid}/*` ensuring complete data boundary separation.
3. **Newsletter Bridge:** Partitionable via Cloudflare email routing and recipient-based KV keys (`newsletter_items:${user}`).

### 4.3 Deployment Pipeline
- Code updates committed to `SDautovic-GH/RSSReader` via `SyncGit-macOS-RSSReader.ps1` (or Windows counterpart).
- Automated build pipeline bumps service worker cache version and pushes to GitHub `main`.
- Cloudflare Workers Builds automatically detects git push, builds, and deploys globally to `today.dautovic.com` in ~20 seconds.
