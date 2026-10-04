# Brief-First Redesign Plan (RSS Reader v2)

| Key | Value |
| :--- | :--- |
| Goal | Make the brief layout (grouped, deduplicated, ranked) the default way to read feeds |
| Reference Style | Apple News (Today header, glass tab pill, separate search) + Google News (editorial sections, consensus clustering) |
| Target File | `RSSReader/index.html` |
| Current State | **Active — Build 283** deployed to production (Phase 5 complete, plus follow-ups; automatic briefs removed) |
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

### Phase 5: Desktop Layout & Consolidated Actions (Builds 268–274)
- **Today in the middle column (268):** on desktop the brief renders in `#today-column` (a sibling of `#article-list` in `#timeline-pane`) instead of the reader, so stories open beside it rather than replacing it. Unread, a folder or a feed in the sidebar swaps the plain list back; Today (sidebar or `t`) brings the brief back. Prev/next (`j`/`k`, chevrons) walk the brief's stories; the open story's card is highlighted and read cards are dimmed in place (no reshuffle). The column is emptied, not just hidden, when it is replaced, so brief ids exist once in the document. Mobile is unchanged: Today stays a full-screen "article" in the viewer.
- **Reader bar (269–271):** mobile bar moved below the status bar (it had been rendering under the clock/Dynamic Island); desktop gets `< Today`, which closes the story and scrolls Today to its card (Escape and `b` do the same); the Back button is text-style (its `dark:bg-blue-950/40` class was never compiled, leaving a near-white pill); on desktop the bar is padded to the article column's edges (md 2rem / lg 3.5rem + 42rem).
- **Consolidated actions (272–273):** top bar = Back · prev/next · Listen · Standard Stream. Per-item actions live on the item: under the headline in the reader (Read · Later · Save · Share · Open original) and on every brief card (Read · Later · Save · Share · Open in Reader · Open original), built by `buildBriefStoryActions()` in `normalizeBriefDOM`, so stored briefs get the same row. Borderless `.icon-act` buttons; ON = the filled glyph in the accent (`setActBtn`). Read is a dot (filled = unread); Standard Stream / Compact Wire use row-density icons.
- **Single navigator on desktop (274):** the category pill bar is hidden in the desktop Today column; the sidebar's folders are the navigator there. Mobile keeps the pills, which slide to centre the tapped pill (270).

### Follow-ups (Builds 275–283)
- **Mobile bar (275–276):** tab labels 13px (were 11px), reader Back 15px with an 18px chevron. The selected tab shows a filled glyph (Today's sun disc, Following's folder; Search stays an outline), all tab icons use a 1.75 stroke, and Today in the sidebar, the Today tab and Light in Settings share one sun (`#icon-sun`, Lucide geometry, no fill/stroke-width on the symbol). The long-press Mark-all-read popover, orphaned since the Articles/Topics tab was removed, is retired; desktop right-click menus are untouched.
- **Pull-to-refresh on Today (277):** the Following pull gesture now also works on the mobile Today brief. On release the brief steps down for a spinner until the refresh (and any pass queued behind one already running) finishes, then Today is rebuilt with the new stories.
- **Read stories leave the brief (278):** a story marked read by any path disappears from every brief on screen (Today and stored briefs), via `syncBriefCards()`; the story open beside the desktop Today column stays until you move on. Emptied sections, their pills and the pill bar go too, counts follow what is left, and Back / return-to-Today land on the next unread story. Prev/next walks only what is left.
- **Mark-read row (278):** one short line at the end of every section ("Mark N read") marks the stories still showing above it plus the other outlets' copies grouped under them (`data-cov`), then shows "Marked N read · Undo" for 5 seconds. The heading check still marks the whole folder.
- **A story's copies go with it (279):** marking a single brief story read (opening it, its Read dot, the reader's Read button, a list swipe) also marks the other outlets' copies grouped under it, so none returns as a "new" story in the next Today. Copies are registered from each card's `data-cov` when a brief is shown (`window._briefCopies`); marking the story unread puts back only the copies its read mark took along. The section row marks its copies explicitly and keeps its own exact Undo.
- **Swipes, settings, speed (280):** a sideways swipe never navigates from a brief (on Today it used to open the first story of the Unread list) and never when it starts on something that scrolls sideways (the pill bar, a wide table). Stories per Category has a last step, All (every unread story). Generated briefs are built from unread stories only. Folder unread counts for all sections are computed in one pass (they re-ran the folder matcher per section per article on every refresh), and `normalizeBriefDOM` uses lookup maps instead of a linear search per card. "Mark N read" is 0.95em.
- **Automatic briefs removed (281, on request):** with Today live, the scheduled Morning / Midday / Afternoon / Evening briefs were Today cut to a fixed window. Removed: generation (`checkAndGenerateBriefs`, `generateBrief`, the ET slot schedule and its once-a-minute timer), the on-demand "Generate Brief Now" bar, the Briefs folder and its badge, the Briefs segment next to Saved / Read Later, and the Enable Briefs switch. Settings' section is now "Today" (Stories per Category). Startup empties the old `briefs` IndexedDB store on existing installs. Kept for Today: `composeSlotBrief`, `buildStoryClusters`, `getETParts`, and the source rankings, which `runFullRefresh` now refreshes (24h cache) since the generator used to.
- **Regular-weight titles (282, on request):** Today's story titles are weight 400 (were 600), like the category pills; they still stand out from the excerpt by size and colour.
- **Next pill + heading size (283, on request):** reading a story opened from Today on mobile, a "Next" pill sits bottom right just above the tab bar (tab-bar glass, 44px target) and opens the brief's next story in one tap; after the last story it reads "Back to Today". It replaced the floating Save star and "Back to Brief" pill, which the headline row and the top bar's Back already cover. The mobile Today heading now follows Article Reader > Title Size (`--mob-article-title-size`) like desktop; it was a fixed 1.15em.
- **Reader bar alignment (278):** build 271 assumed the article column had `md:ml-4` / `lg:ml-8`, but those classes are not in the compiled CSS. The bar is now padded to the column's real edges (1rem / 1.5rem + 42rem). Category pills are regular weight.

---

## 4. Phase Status & Roadmap

| Phase | Description | Status |
| :--- | :--- | :--- |
| **0. Engine Split** | Modularize `buildStoryClusters` and `renderBriefSectionsHtml` | **Completed** (Build 264) |
| **1. Today Brief** | 24h rolling brief, Top Stories, Jump Rail, sidebar button | **Completed** (Build 265) |
| **2. Full Coverage** | Popover sheet for external coverage | **Dropped** (User curated feeds only) |
| **3. Mobile Navigation** | 3-action bottom bar, reader push/back header, launch default | **Completed** (Build 266) |
| **4. Folder Categories** | Strict adoption of Following folders, cache persistence | **Completed** (Build 267) |
| **5. Desktop Layout** | Brief column + reader pane integration, consolidated actions | **Completed** (Builds 268–274) |
| **6. Imagery Refinements** | Hero image presentation for lead stories | Planned |

---

## 5. Architectural Decisions Record

1. **User Curated Coverage:** Skipped third-party Full Coverage popovers. Multi-outlet consensus is communicated directly via card metadata (`• Also: [source]`).
2. **Tab Redundancy:** Removed planned standalone "Topics" and "Saved" bottom tabs. Topics are represented directly by the folder sections and jump pills inside Today; Saved feeds remain readily accessible in the Following sidebar.
3. **Launch Priority:** Today brief is the default view on launch.
4. **Folder Ground Truth:** Sidebar folder names under Following are the single source of truth for story classification. Synthetic/inferred topics are forbidden.
5. **Brief Beside the Reader (desktop):** Today lives in the middle column on desktop so reading a story never replaces the brief. Mobile keeps the full-screen push/back flow.
6. **Actions Live on the Item:** Read, Later, Save and Share belong to each story (reader row under the headline, brief card rows), not to the top bar. The top bar keeps navigation and view controls only.
7. **One Navigator per Platform:** on desktop the sidebar folders navigate and the brief has no pill bar; a pill and a same-named folder doing different things was the confusion being removed. Mobile, with no sidebar on screen, keeps the pills.
8. **Read Means Gone:** a read story leaves the brief rather than dimming in place, so what remains is what is left to read. Bulk marking marks only what you have scrolled past (plus its grouped copies), never unseen stories, and always offers Undo in place. Stories per Category goes up to 50 or All (Settings, saved per device), so a section can hold a whole folder's day.
9. **Bottom Bar Stays at Three Tabs:** Today, Following, Search. Actions (refresh, listen, mark read) and occasional places (Saved, Read Later, History) stay out of it.
10. **Today Is the Only Brief (281):** scheduled briefs were a time-boxed, frozen subset of Today with their own folder, badge, generator and timer. Once Today was live, unread-only and hid read stories, they added cost and a second kind of brief without adding anything Today lacks, so they were removed rather than kept behind a switch.
