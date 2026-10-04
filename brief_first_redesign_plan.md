# Brief-First Redesign Plan (RSS Reader v2)

| Key | Value |
| :--- | :--- |
| Goal | Make the brief layout (grouped, deduplicated, ranked) the default way to read feeds |
| Reference Style | Apple News (Today header, glass tab pill, separate search) + Google News (editorial sections, consensus clustering) |
| Target File | `RSSReader/index.html` |
| Current State | **Active — Build 267** (`af9f45e`) deployed to production |
| Last Updated | 2026-10-04 |

---

## 1. Core Architecture & Philosophy

The redesign transforms the Brief from a periodic scheduled summary into the **primary reading experience**:
- **Today as the Lens:** Launching the app opens directly into a live, rolling brief of unread stories from the past 24 hours.
- **Strict Folder Adoption:** Category sections in Today are strictly determined by the user's curated folders under **Following**. No synthetic or hallucinated topics are created.
- **Clustering & Consensus:** Stories from multiple outlets covering the same event are grouped into a single card with `• Also: [source]` metadata.
- **Push Reader Flow:** Reading an individual article overlays/pushes the reader pane with a dedicated `< Today` back button that preserves brief scroll position. Reader is not a persistent bottom tab.

---

## 2. Navigation Architecture (Current Implementation)

Following user feedback to eliminate redundant timeline sub-bars and unused tabs, the mobile interface is focused into three primary controls:

| Control | Position | Role & Action |
| :--- | :--- | :--- |
| ☀️ **Today** | Pill Left | Default landing view. Live rolling 24h brief clustered by user folders, with jump-rail filter pills and folder mark-as-read controls. |
| 📁 **Following** | Pill Right | Full feed and folder management (sidebar pane). Displays live unread badge. Contains curated folders, smart feeds (Saved, Read Later, History), and feed health indicators. |
| 🔍 **Search** | Separate Circle | Opens the full-text search overlay and date/scope filter sheet. |

### Reader Navigation
- Tapping any story from the Today brief slides in the full reader pane (`setMobilePane('viewer')`).
- The reader header displays a prominent `< Today` back button on the left, plus complete action tools on the right (Share, Read Later, Save/Star, Mark Read).
- Tapping `< Today` returns straight to the brief at the exact card position.

---

## 3. Implemented Components (Builds 264–267)

### Phase 0: Engine Modularization (Build 264)
- Extracted `buildStoryClusters(pool, opts)` from the legacy slot generator. Supports arbitrary article pools, deduplication tokens, source ranking, and custom grouping.
- Extracted `renderBriefSectionsHtml(categorySections, opts)` for consistent markup across slot briefs and live briefs.

### Phase 1: Live Today Brief Engine (Build 265)
- Added `buildTodayBrief()`: Re-clusters unread stories from the last 24 hours across all feeds.
- Added cross-folder **Top Stories** section for high-consensus / high-authority news.
- Added fast Jump Rail with category pills and folder-level mark-as-read checkmarks.
- Added sidebar smart feed button `feed-btn-today` with sun icon.

### Phase 3 (Streamlined): Mobile Bar & Header Flow (Build 266)
- Redesigned `#mobile-tab-bar` to a 2-segment glass pill (☀️ Today, 📁 Following) + separate 🔍 Search button.
- Defaulted app launch to **Today** on both mobile and desktop.
- Polished typography and touch targets:
  - Section headings enlarged to `1.35em` (`font-weight: 800`, letter-spacing `-0.015em`).
  - Jump-rail pills enlarged by 15% with comfortable touch padding.
- Restored reader action buttons (Share, Read Later, Save, Mark Read) alongside the `< Today` back pill.

### Category Folder Integration & Cache Fix (Build 267)
- **Strict Folder Matching:** Updated `getCategoryForArticle()` to map directly to `feed.category` and `feed.folder` from the user's Following folders via URL, source, and domain matching.
- **Local Feed Persistence:** Fixed boot race condition by calling `saveLocalFeeds()` when cloud feeds arrive, caching folders in IndexedDB so categories load synchronously on launch.
- **Live Re-clustering:** When cloud sync updates feed folders, any open Today view automatically re-clusters into the user's named folders.

---

## 4. Phase Status & Roadmap

| Phase | Description | Status |
| :--- | :--- | :--- |
| **0. Engine Split** | Modularize `buildStoryClusters` and `renderBriefSectionsHtml` | **Completed** (Build 264) |
| **1. Today Brief** | 24h rolling brief, Top Stories, Jump Rail, sidebar button | **Completed** (Build 265) |
| **2. Full Coverage** | Popover sheet for external coverage | **Dropped** (User curated feeds only) |
| **3. Mobile Navigation** | 3-action bottom bar, reader push/back header, launch default | **Completed** (Build 266) |
| **4. Folder Categories** | Strict adoption of Following folders, cache persistence | **Completed** (Build 267) |
| **5. Desktop Layout** | Rail + brief column + reader pane integration | Planned |
| **6. Imagery Refinements** | Hero image presentation for lead stories | Planned |

---

## 5. Architectural Decisions Record

1. **User Curated Coverage:** Skipped third-party Full Coverage popovers. Multi-outlet consensus is communicated directly via card metadata (`• Also: [source]`).
2. **Tab Redundancy:** Removed planned standalone "Topics" and "Saved" bottom tabs. Topics are represented directly by the folder sections and jump pills inside Today; Saved feeds remain readily accessible in the Following sidebar.
3. **Launch Priority:** Today brief is the default view on launch.
4. **Folder Ground Truth:** Sidebar folder names under Following are the single source of truth for story classification. Synthetic/inferred topics are forbidden.
