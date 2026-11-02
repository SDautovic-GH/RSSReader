# Redesign Plan: Unified Two-Pane Workstation (RSS Reader v2.5)

| Key | Value |
| :--- | :--- |
| Project | RSS Reader Web Application (`today.dautovic.com`) |
| Document | Redesign Plan & Implementation Record — Unified Two-Pane Workstation |
| Target File | `/Users/samirdautovic/Developer/RSSReader/index.html` |
| Current State | **Active — Build 466** deployed to production via Cloudflare Workers CI |
| Date | 2026-11-01 |
| Status | Complete & Deployed |

---

## 1. Executive Summary & Design Vision

The **Briefing & Today Library Redesign** transforms the user's reading experience by eliminating the cramped, legacy 3-pane layout entirely across desktop, unifying the entire application under a modern, focused **2-Pane Workstation Architecture**:
**Sidebar (328px) + Centered Cards Grid/Canvas (`#today-column`)**.

### Core Principles
1. **Total Elimination of the 3-Pane Design:**
   The legacy 3-pane split (Sidebar + Timeline article list + Reader pane + resizer) is completely retired. Every folder, feed, personal hub, and unread view renders as a spacious, centered cards workstation canvas in `#today-column`.
2. **Push-and-Return Story Flow Across All Views:**
   Clicking any card in Today, Personal Hub, Unread, or Folders opens the story in the centered 760px reader canvas (`desktop-today-story`) with a dynamic back button (`< Today`, `< Unread`, `< Technology`, `< Ars Technica`, `< Saved`, etc.). Pressing Back, `b`, or `Escape` immediately returns to the cards grid, centers the read card, and pulses it into place.
3. **Today as a Focused Intelligence Workspace:**
   Today offers two distinct views via a mathematically centered header switcher:
   - **✦ Briefing View:** An editorial, AI-synthesized daily briefing rendered in a clean, centered 760px canvas.
   - **▣ Cards View:** A responsive magazine card deck (customizable in 1, 2, or 3 columns) with sticky Category Jump Bars.
4. **Personal Hub Cards Workstation (`Read Later`, `Saved`, `History`):**
   Adopts Today's cards grid with Category and Date Jump Bars and an absolute-centered 3-way segmented switcher (`[Read Later | Saved | History]`) in `#timeline-header`. Stories in Personal Hub are durable collections and are never auto-hidden by unread sweeps.
5. **Smart Partitioning in Folders & Feeds:**
   - **Unread (`'all'`):** Grouped by category folder with Category Jump Bars (`[Top Stories] [Technology]...`).
   - **Subscription Folders (`setCategoryFilter`):** Grouped by **Publication Source** with Outlet Jump Bars (`[Ars Technica] [The Verge]...`) allowing direct jumps to each news outlet in the folder.
   - **Single Feeds (`setSourceFilter`):** Single unified story stream with *"Mark Feed Read"*.
6. **Simultaneous Mathematical Centering:**
   Active header switchers and the body content below them share the exact same `50%` horizontal centerline at all times, moving synchronously during window resizing with zero drift.
7. **Persistent Desktop Headers:**
   Resizing the desktop browser window (e.g. split screen, window tiling) never causes the header to disappear or the mobile bottom tab bar to appear.

---

## 2. Workstation Layout Architecture

```
+---------------------------------------------------------------------------------------+
|  UNIFIED 2-PANE WORKSTATION LAYOUT (All Folders, Feeds & Personal Hub)                |
+-------------------+-------------------------------------------------------------------+
|                   |  [Action/Mark Read]      [Centered Switcher / Count]       [Acts] |
|                   +-------------------------------------------------------------------+
|  Sidebar (328px)  |                                                                   |
|  - Today          |                      Centered Cards Grid / Canvas                 |
|  - Unread         |                     (Jump Bar: Categories or Feeds)               |
|  - Read Later     |                     (Cards Deck: 1, 2, or 3 columns)              |
|  - Saved          |                                                                   |
|  - History        |                                                                   |
|  > Subscriptions  |                                                                   |
+-------------------+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
|  STORY READING MODE (2-Pane: Sidebar + Centered Reader Canvas)                       |
+-------------------+-------------------------------------------------------------------+
|  Sidebar (328px)  |  [< Back to Source]                         [Nav]  [Share] [Star] |
|  - Today          +-------------------------------------------------------------------+
|  - Unread         |                                                                   |
|  - Read Later     |                      Full Article Reader                          |
|  - Saved          |                  (Centered Editorial Canvas: 760px)               |
|  > Subscriptions  |                  Title, Byline, Hero Image, Clean Content         |
+-------------------+-------------------------------------------------------------------+
```

| Mode | Active Body Class | Pane 1 (Sidebar) | Pane 2 (`#today-column` Cards) | Pane 3 (`#viewer-pane` Reader) | Column Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Today: Briefing** | `desktop-today-briefing` | Visible (328px) | `display: none` | Full width (`flex: 1`), centered 760px | **2 Panes** |
| **Today: Cards** | `desktop-today-cards-wide` | Visible (328px) | Full width (`flex: 1`), centered grid | `display: none` | **2 Panes** |
| **Personal Hub** | `desktop-today-cards-wide` | Visible (328px) | Full width (`flex: 1`), centered grid | `display: none` | **2 Panes** |
| **Unread / Folders** | `desktop-today-cards-wide` | Visible (328px) | Full width (`flex: 1`), centered grid | `display: none` | **2 Panes** |
| **Story Reading** | `desktop-today-story` | Visible (328px) | `display: none` | Full width (`flex: 1`), centered 760px | **2 Panes** |

---

## 3. Key Technical Innovations & Solutions

### A. Mathematical Simultaneous Centering (Build 435)
* **The Problem:** 
  In Briefing mode, `#viewer-header` had asymmetric right padding (`max(1.5rem, calc(100% - 43.5rem))`) originally intended for left-aligned text, pushing the switcher hundreds of pixels to the left. In Cards mode, `#timeline-header` had an empty `flex-1` div that shoved `#desk-today-switcher` far to the right.
* **The Solution:**
  1. Set `#timeline-header` and `#viewer-header` to `position: relative !important;` with symmetric padding (`0 1.5rem !important;`).
  2. Anchored `#viewer-today-switcher` and `#desk-today-switcher` with:
     ```css
     position: absolute !important;
     left: 50% !important;
     top: 50% !important;
     transform: translate(-50%, -50%) !important;
     z-index: 20 !important;
     ```
  3. Because `.brief-container` in both modes uses `margin: 0 auto;`, both the header switcher and the body content below it are locked to `x = 50% * pane_width`. When the user resizes the window, both move simultaneously with zero horizontal discrepancy.

### B. Header Persistence on Window Resize (Build 435)
* **The Problem:** 
  Legacy mobile media queries (`@media (max-width: 900px)`) applied `display: none !important;` to `#viewer-header` and `#timeline-header`. When a user resized their desktop browser window (e.g. snapping to half-screen on a Mac laptop at 720–756px), the top headers vanished and the mobile tab bar popped up.
* **The Solution:**
  1. Elevated all desktop workstation rules out of `@media (min-width: 901px)` so they apply unconditionally whenever workstation classes are active.
  2. Implemented fine-pointer desktop protection in CSS:
     ```css
     @media (hover: hover) and (pointer: fine) {
         body:not(.is-fullscreen) #timeline-header,
         body:not(.is-fullscreen) #viewer-header {
             display: flex !important;
         }
         #mobile-tab-bar {
             display: none !important;
         }
     }
     ```
  3. Added `isDesktopDevice()` detection in JavaScript:
     ```javascript
     function isDesktopDevice() {
         return !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
     }
     function isMobile() {
         if (isDesktopDevice()) return false;
         return _isMobileCache;
     }
     ```
     This prevents browser resizing on desktop from ever triggering mobile fallback or tearing down desktop layouts.

### C. 3-Column View Exclusively in Unread Folder (Build 435)
* **The Problem:**
  Previously, clicking a card from Today Cards shrunk the card deck into a cramped 440px middle column and opened the article in the viewer beside it, creating an awkward 3-column split inside Today.
* **The Solution:**
  1. Introduced `desktop-today-story`: When a card is clicked from Today Cards, `#timeline-pane` is hidden (`display: none !important;`) and `#viewer-pane` takes the full width beside the sidebar.
  2. The story displays in a centered 760px canvas with a `< Today` back button in `#viewer-header`.
  3. Clicking `< Today`, pressing `b`, or pressing `Escape` triggers `closeStoryToTodayColumn()`, removing `desktop-today-story`, restoring `desktop-today-cards-wide`, and smoothly scrolling back to the card.
  4. Selecting the **Unread** folder (`feed-btn-all`) or any feed list calls `showTodayColumn(false)`, stripping all Today workstation classes and cleanly displaying the standard 3-column workstation.

### D. Customizable Cards View Columns (Build 434)
* **The Feature:**
  Under **Settings → Reading & Display**, added a new control: **Cards View Columns** (`1 Column`, `2 Columns`, `3 Columns`, default `2 Columns`).
* **Implementation:**
  * Saved to `localStorage` (`newsreader_cards_cols`).
  * Sets `data-cards-cols="1|2|3"` on `<body>` and updates CSS variable `--today-cards-cols`.
  * Responsive container scaling:
    * **1 Column:** `.brief-container { max-width: 760px; }` (single column focus).
    * **2 Columns:** `.brief-container { max-width: 1240px; }` (balanced magazine view).
    * **3 Columns:** `.brief-container { max-width: 1680px; }` (ultra-wide power reading).

---

## 4. Chronological Build Log (October 31, 2026)

| Build | Commit | Milestone & Key Changes |
| :---: | :---: | :--- |
| **430** | `e4bf7c4` | **Streamlined Briefing Check:** Removed "Open Today briefing first to generate..." toast check. Allowed instant generation. |
| **431** | `ce22b91` | **Header Cleanup:** Removed redundant desktop AI TL/DR sparkle button (`#tldr-desk-btn`) from the top header bar now that the Briefing/Cards switcher is primary. |
| **432** | `9bcf643` | **Workstation Desktop Layouts:** Implemented `desktop-today-briefing` (centered 760px canvas) and `desktop-today-cards-wide` (magazine grid). Added keyboard shortcuts `1` and `2`. |
| **433** | `f194919` | **Single Header Switcher:** Removed inline middle bar switcher (`.today-view-switcher { display: none !important; }`). Prevented duplicate switcher from appearing in both timeline and viewer headers. |
| **434** | `4058596` | **Cards View Columns Preference:** Added App Settings option for 1, 2, and 3 columns with real-time responsive grid resizing (`760px`, `1240px`, `1680px`). |
| **435** | `40b662c` | **Centering Alignment, Persistence & 3-Column Isolation:**<br>• Absolute center lock (`left: 50%; transform: translate(-50%, -50%)`) for simultaneous header/body centering.<br>• Header persistence across all browser resize widths (`@media (hover: hover) and (pointer: fine)` + `isDesktopDevice()`).<br>• Restricted 3-column view strictly to the **Unread** folder; Today is exclusively 2 columns with `desktop-today-story` push-and-return navigation. |
| **436** | `b33c22e` | **YouTube Floating Glass Capsule Bottom Bar & Idea A Switcher:**<br>• Initial 4-tab floating capsule and Read Later / Saved segmented switcher. |
| **437** | `1517a7a` | **YouTube Capsule Height & Bottom Offset Calibration + Today Switcher Styling:**<br>• Calibrated capsule height to compact `42px` (matching YouTube's slim proportion, down from 54px).<br>• Calibrated bottom offset to `max(8px, env(safe-area-inset-bottom) - 20px)` so the pill rests just above the home indicator line.<br>• Applied the signature Today Briefing/Cards button styling (`.today-segmented`) to the Read Later / Saved switcher: transparent background, 16px gap, and active accent text (`#2563eb` / `#60a5fa`). |
| **438** | `efaf410` | **Capsule Ergonomics & Padding:** Extended capsule max-width (`340px`) and adjusted vertical padding/icon scaling for thumb ergonomics. |
| **439** | `aafa11a` | **Desktop Timeline Header Polish:** Aligned `#desk-search-trigger` and cleaned timeline header spacing. |
| **440** | `f376eb4` | **Mobile Default Open View:** Explicitly ensured mobile sessions open into Cards view by default rather than Briefing view. |
| **441** | `bd2193f` | **Desktop Duplication Fix:** Hid mobile `#saved-readlater-bar` on desktop (`@media (min-width: 901px)`), preventing duplicate switcher pills and overlap with deduplication badges. |
| **442** | `9d0ea8e` | **Mobile Library Tab Architecture:** Added `desk-only` to `#smart-feeds-card`, establishing the mobile Library tab as a pure Subscriptions and Folders manager. |
| **444** | `0c0e21f` | **Unified Personal Hub & Smart Today Tap:**<br>• Evolved Bookmarks tab into a 3-way personal hub: `[ 🔖 Read Later ] [ ⭐ Saved ] [ ⏱️ History ]`.<br>• Smart Today button tap: first tap scrolls smoothly to top; subsequent tap toggles between Cards and Briefing views. |
| **445** | `5a34a83` | **YouTube Frosted Glass Translucency Tuning:**<br>• Reduced dark tint from `rgba(18, 18, 22, 0.72)` to `rgba(18, 18, 22, 0.25)`.<br>• Applied `-webkit-backdrop-filter: blur(20px) saturate(180%)` and GPU layer promotion (`translate3d(0, 0, 0)`, `will-change: transform, backdrop-filter`). |
| **446** | `a808b23` | **Comprehensive Dead Code & Superseded Feature Removal:**<br>• Removed dead CSS selectors (`.brief-briefing-btn`, `.source-favicon-sidebar`, `.ai-bullet-dot`, etc.).<br>• Removed unused SVG symbols (`#icon-mark-unread`, `#icon-bookmark-x`, `#icon-rows-2`, etc.).<br>• Removed dormant `#timeline-today-title` span and `window.jumpToBriefCategoryFromAi()`.<br>• Removed legacy inline briefing slot (Feature 1: `.today-ai-briefing-slot`, `getTodayBriefingSlots`, `dismissTodayBriefing`).<br>• Removed Compact Wire density mode (Feature 3: `#view-density-toggle`, `window._viewMode`, `toggleViewMode()`).<br>• Preserved Category Recaps (Feature 2: `generateCategoryRecap`). Net reduction: **-326 lines**. |
| **447** | `e3663c7` | **Ultrawide Centered App Frame (Experimental):**<br>• Initial test centering `#app-container` with outer framing on monitors $> 1720px$. Added settings toggle. Replaced by Build 448 after user preferred seamless full-bleed browser integration. |
| **448** | `7d3aa2c` | **Seamless Full-Bleed Browser Integration & Centered Header Controls:**<br>• Replaced outer letterboxing with centered page elements: `#app-container` remains 100% full-bleed edge-to-edge chrome seamlessly merging into the browser window.<br>• Bound header controls (`Mark Read`, `Today Switcher`, `Search` in Cards; `Back to Today`, `Switcher`, actions in Briefing/Story) inside `.timeline-header-inner` and `.viewer-header-inner`.<br>• Controls mathematically align with the exact left and right margins of the content canvas (`max-w-[1240px]` cards, `max-w-[760px]` briefing/story) across all viewports.<br>• Updated Wide Screen Layout setting to `Centered Content (Recommended)` vs `Full Width Stretch`. |
| **449** | `83f5e58` | **Category Cards Architecture & Immediate Unread-Only Triage:**<br>• Consolidated Today Cards so each folder/category is a single unified Category Card (`.brief-cat-section`) with its stories rendered as clean list rows separated by subtle dividers, eliminating the visual noise of dozens of isolated boxes.<br>• Equipped each story row with inline action controls on its source line: `Mark Read` (checkmark button with smooth 180ms collapse dismiss animation), `Save` (star button with active amber highlight), and `...` More options.<br>• Enforced strict unread-only card presentation: marking a story read immediately hides it (`display: none !important`).<br>• Opening a story in the reader automatically hides it upon return via `< Today`, `b`, or `Escape`, cleanly landing on the next unread story.<br>• Empty categories automatically collapse and hide (`.brief-section-empty`); when all stories are read, "You're all caught up" displays. |
| **450** | `fcb57c6` | **Sidebar Active Item Color & Typography Harmonization:**<br>• Replaced high-contrast solid blue with WilmerHale house style accent blue (`#3d6bb0` in light mode, `#4d7cc7` in dark mode) for active navigation items.<br>• Refined typography hierarchy across desktop and mobile navigation. |
| **451** | `741489e` | **Briefing AI Bullet Story Context Menu Styling:**<br>• Corrected popup context menu item styling and typography when right-clicking or long-pressing bullet citations. |
| **452** | `f777787` | **Briefing Story Summaries Control:**<br>• Tuned length constraints and token slice thresholds for Gemini-generated executive briefings. |
| **453** | `b66459d` | **Category Jump Bar Enablement in Cards View:**<br>• Removed `#today-column .brief-jump-bar { display: none; }`, enabling sticky Jump Bar navigation across both Briefing and Cards desktop views. |
| **454** | `fdbcae6` | **Gemini AI Briefing Snippet Calibration:**<br>• Calibrated article snippet slice from 450 to 350 characters in `makeBriefingPrompt` for punchier, more concise summaries. |
| **455** | `908b06e` | **Phase 1 of Unified Workstation Architecture — Personal Hub Cards:**<br>• Converted `Read Later`, `Saved`, and `History` from legacy 3-pane list into Today's cards grid in `#today-column`.<br>• Implemented centered `#desk-saved-switcher` (`[Read Later | Saved | History]`) with mathematical simultaneous centering in `#timeline-header`.<br>• Extended `readerArticleById` to locate articles across all personal buckets (`_savedArticles`, `_readLaterArticles`, `_recentlyReadArticles`). |
| **456** | `664d7ff` | **Phase 2 Complete — Total 3-Pane Layout Retirement & Unified Workstation Architecture:**<br>• Converted `Unread` (`setSmartFeed('all')`), `Subscription Folders` (`setCategoryFilter(cat)`), and `Single Feeds` (`setSourceFilter(source)`) to Today's full-width cards layout in `#today-column`.<br>• Unread features Category Jump Bars (`[Top Stories] [Technology]...`).<br>• Subscription Folders partition stories by publication source with Outlet Jump Bars (`[Ars Technica] [The Verge]...`).<br>• Fixed Personal Hub blank body bug: prevented `syncBriefCards` from treating durable personal collections as unread inbox items.<br>• Updated reader Back button (`updateViewerBackBtn`) to dynamically reflect the originating view (`< Unread`, `< Technology`, `< Ars Technica`, `< Saved`, etc.).<br>• Styled `.ai-menu-item` and external source links to eliminate the bright white hover rectangle and preserve house style glass aesthetics. |
| **457** | `3d8d693` | **Socials Embedded Parent Context & Repost Attribution:**<br>• Added embedded card (`brief-social-parent`, `list-social-parent`) rendering quoted/replied author, avatar, handle, and text directly beneath posts in Cards, Timeline, and Reader.<br>• Added initial Bluesky repost badge (`↻ Reposted from [Author]`) in Cards view.<br>• Extended `_persistSnapshot` schema to preserve `socialParent`. |
| **458** | `4a00ae3` | **Socials Thread Self-Reply Suppression & Category Card First Story Spacing:**<br>• Omitted redundant parent context box when author replies to themselves in a thread.<br>• Calibrated first story optical spacing inside unified Category Cards. |
| **459** | `fb2cd8b` | **Story Card Excerpt Clamping:**<br>• Tuned line-clamp and hero image container constraints for balanced card deck rhythm. |
| **460** | `d7d8729` | **Optical Alignment Polish:**<br>• Category section header padding and icon alignments. |
| **461** | `351a56c` | **Ultrawide Layout Centering Refinement:**<br>• Centered `[Sidebar + Deck]` together with zero gap (`margin-left: max(0px, calc((100vw - ...)/2))`), docking native vertical scrollbar natively at the screen edge. |
| **462** | `bf208d0` | **Unified Workstation Canvas & Native Dark Scrollbars:**<br>• Unified left and right pane backgrounds to single `#0d1117` surface (dark) and `#ffffff` (light); removed sidebar dividing border (`border-r: none`).<br>• Added `<meta name="color-scheme" content="light dark">` and dynamic `color-scheme: dark/light` CSS rule on `html` for native macOS translucent floating pill scrollbar.<br>• Expanded `brief-footer` top margin to 36px so "Mark All Read" maintains generous breathing room. |
| **463** | `97af9bb` | **Edge-to-Edge Hairline Border & 24px Top Padding Alignment:**<br>• Extended header divider border across full browser width (0px to 100vw) via `#app-container::before` and `#sidebar-header::before`.<br>• Aligned sidebar list items and right pane content at identical 24px (`1.5rem`) top padding below header.<br>• Styled repost badge in regular font weight with muted tertiary text color (`var(--text-3)`). |
| **464** | `b5ffc3e` | **Repost Attribution Placement:**<br>• Moved `↻ Reposted from [Author]` from top of post to a dedicated line directly above the post author byline. |
| **465** | `b2bf39d` | **Floating Centered Jump Bar:**<br>• Removed bottom border divider under jump bar buttons (`border-bottom: none !important;`).<br>• Centered jump bar vertically between header hairline and category story cards (`padding: 20px 0; margin: 0`). |
| **466** | `6fb627d` | **Repost Attribution Typography Polish:**<br>• Increased repost badge font size slightly from `0.75rem` (12px) to `0.85rem` (~13.5px) with `line-height: 1.35` for optimal readability. |
| **470** | *(2026-11-02)* | **Desktop Layout Fixes (found reviewing the desktop companion's refresh):**<br>• **No navigation in a narrow desktop window:** at 900px and below, a mouse device lost both the sidebar and the tab bar (CSS switched to the phone layout by width while `isMobile()` stayed false by device, and build 435 hid the tab bar). The 31 phone and 17 desktop media queries now use the same device test as `isMobile()`, so a mouse device keeps the desktop layout at any width; the phone is unchanged. The duplicate Briefing/Cards switcher under 900px went with it.<br>• **Sidebar slid 116px when a story opened** (at 1400px; 240px on ultrawide): each view centred a different total width. One rule now centres `[sidebar + deck]` from the Cards View Columns width (`--deck-w`) in every view; briefing and story canvases centre where the cards were.<br>• **Full Width Stretch did nothing:** no rule checked it. It now keeps the sidebar at the left and lets the cards fill the pane.<br>• **Second card 20px lower than the first:** cards in the grid now take no top margin (the grid gap spaces them).<br>• **One column at 1000px and below:** the 768px rule never applied (the per-setting rule outranked it).<br>• **Stray `}` from build 448** dropped the `.brief-thumb, .brief-hero` base rule (position, clipping, placeholder); restored.<br>• Search sheet placement uses `isMobile()` instead of the raw width.<br>• **Reading beside the list** (Settings → Stories → Open stories): `body.story-beside` lays story mode out as list + resizer + reader; the clicked card keeps its height on opening, stories read meanwhile stay listed dimmed (`brief-card-seen`) until the reader closes. The resizer now measures from the list's own left edge (it ignored the centring offset).<br>• **Collapsible sidebar rail:** `[` or the logo (`#sidebar-toggle`) folds the sidebar to a 64px rail with the smart lists, Refresh and Settings; `--sidebar-w` feeds the centring.<br>• **Top Stories band and balanced deck:** Top Stories spans the deck, its stories in CSS columns; `balanceTodayDeck()` places folder cards shortest-column-first in `.brief-deck-col` wrappers, only after a render or a column-count change.<br>• **Pictures: Large / Small / None** replaces the Show images switch; Small is a CSS grid card with an 88px square picture.<br>• **Page chrome removed from stories** (`stripPageChrome`): buttons, form fields, empty sprite SVGs (NPR's player left 300×150 gaps), player tool menus and embed-code overlays.<br>• **One accent:** `--accent` / `--accent-rgb` replace 14 shades of hard-coded blue (about 135 uses); Tailwind's blue scale is remapped to it; `theme-color` is the house blue.<br>• **Clean-up:** 29 always-true `typeof isMobile === 'function'` guards removed; the layout-settings sync is one function (`syncLayoutPrefControls`) instead of three copies (one sat in the Morning Briefing switch); the dead `ultrawide-stretch` selectors went; 45 comments lost their build numbers and "on request" (comments-only change proven with TypeScript's comment-free print). A static scan found no CSS selector that can never match. `!important` was not cut: only 2 of 1,273 are provably redundant by property, and the rest need a per-view cascade check.<br>• The status line's bullet has a space before it (`Updated just now • 3 new`). |
| **471** | *(2026-11-02)* | **Keyboard Triage, Desktop Voices, Rail Counts:**<br>• **Keyboard triage in the card views:** `j`/`k` move a highlight (`brief-card-cursor`, keyboard use only via `body.kbd-nav`); `Enter` opens, `r` marks read and moves on, `s` saves, `l` Read Later, `o` the original, `Esc` lets go. Before, `j` in Cards opened the first story on screen. Headlines and social posts' text are focusable (`tabindex`, `role="link"`, `Enter`) with a focus ring; Enter on a focused control is left to it, so nothing opens twice. `s`/`l` also work in an open story.<br>• **Listen on desktop uses the computer's voices** (Web Speech); the `<audio>` route through the translate TTS endpoint stays on the phone, where it plays in Silent Mode.<br>• **Rail counts:** Unread and Read Later badges under their icons on the collapsed rail, every row 48px. |

---

## 5. Keyboard Navigation Map

| Key | Context | Action |
| :---: | :--- | :--- |
| `1` | Anywhere in Today | Switch immediately to **✦ Briefing View** |
| `2` | Anywhere in Today | Switch immediately to **▣ Cards View** |
| `t` / `T` | Anywhere in App | Jump to Today |
| `[` | Desktop | Show or hide the sidebar (rail) |
| `j` / `↓` | Cards / Reader | Cards: highlight the next card; Reader: next article |
| `k` / `↑` | Cards / Reader | Cards: highlight the previous card; Reader: previous article |
| `Enter` | Cards | Open the highlighted story |
| `s` / `l` | Cards / Story | Save / Read Later |
| `b` / `B` | While reading any story | Return to originating Cards view |
| `Escape` | While reading any story | Close story and return to originating Cards view |
| `r` / `R` | Cards / Story | Mark the highlighted card read / toggle the open story's read status |
| `/` | Anywhere | Open full-text search palette |

---

## 6. Verification & Quality Assurance Matrix

| Test Case | Scenario / Steps | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **Header Centering** | Toggle between Briefing and Cards mode. | Switcher sits exactly above the centerline of the body content. | PASS |
| **Dynamic Resizing** | Drag desktop window border from 1600px down to 700px. | Header and body content shift simultaneously with zero horizontal drift. | PASS |
| **Header Persistence** | Resize desktop window to `< 900px` (e.g. split screen). | Sidebar, headers (`#viewer-header`, `#timeline-header`) and one switcher stay visible; mobile tab bar stays hidden; cards in one column. | PASS (470) |
| **Unified 2-Pane Workstation** | Switch across Today, Unread, Folders, Feeds, and Personal Hub. | All views render as spacious centered cards in `#today-column`; 3-pane layout never appears. | PASS |
| **Return Flow** | Click `< Source` or press `Escape` / `b`. | Closes story, restores full-width Cards mode, and scrolls to the read card. | PASS |
| **Personal Hub Preservation** | Open Read Later, Saved, or History in cards view. | Stories remain permanently visible; read stories are never hidden. | PASS |
| **Folder Outlet Jump Bar** | Click a subscription folder (e.g. Technology). | Displays outlets as Jump Bar pills (`[Ars Technica] [The Verge]...`); clicking jumps directly to that publication. | PASS |
| **AI Menu Hover** | Hover over items or external links in Briefing context menu. | Dark glass tint with white text in dark mode; no blinding white rectangles. | PASS |
| **Column Preference** | Change Cards View Columns to 1, 2, or 3 in Settings. | Cards grid and `.brief-container` immediately resize to match selected setting. | PASS |
| **Personal Hub 3-Way** | Tap Bookmarks tab on mobile. | Segmented switcher cleanly toggles between Read Later, Saved, and History. | PASS |
| **Today Smart Tap** | Tap Today button while scrolled down; tap again at top. | First tap scrolls smoothly to top; second tap toggles between Cards and Briefing view. | PASS |
| **Frosted Translucency** | Observe floating tab bar over scrolling images/text. | Content softly blurs beneath the pill with true YouTube glass translucency. | PASS |
| **Dead Code Elimination** | Verify absence of legacy resizer and dormant pane logic. | Zero console errors, clean code execution. | PASS |
| **Ultrawide Seamless Full-Bleed** | Open app on display $> 1720px$ width. | App container fills browser edge-to-edge with zero letterboxing or dark bars; sidebar is anchored left; header controls align cleanly with the centered reading/cards content. | PASS |
| **Story Mark Read Dismiss** | Click inline checkmark on any story row in Today or Unread. | Row animates dismiss collapse (180ms) and vanishes completely from view; remaining stories stay interactive. | PASS |
| **Socials Original Post Context** | View replies (e.g. Jay Rosen) or quote posts on Bluesky/Socials in Cards, Timeline, and Reader. | Renders original post author, avatar, handle, and text in an embedded card right below the response/repost. | PASS |
| **First Story Optical Spacing** | Inspect space above first story headline under category header vs subsequent stories. | Spacing above first story title (~30px) matches inter-story rhythm (~28px) with zero cramping. | PASS |
| **Hero Image Excerpt Integrity** | View stories containing large 16:9 hero images. | Story card height expands naturally without fixed 500px clamping; excerpt text is never sliced horizontally. | PASS |
| **Socials Thread Self-Reply Suppression (Build 458)** | View multi-part posts/threads where author replies to themselves (e.g. Mohamed A. El-Erian). | Redundant parent box is omitted, showing context strictly for external replies/quotes. | PASS |
| **Category Card First Story Spacing (Build 458)** | Inspect space above first story headline in Category Card vs subsequent stories. | Spacing above first story title (~22px) matches inter-story rhythm (~28px) with zero cramping. | PASS |
| **Native Browser Scrollbar Edge (Build 458)** | View Cards and Briefing view on wide / ultrawide displays. | App spans edge-to-edge; vertical scrollbar rests natively at the far right edge of the browser window. | PASS |
| **Unified Workstation Canvas (Build 462)** | Inspect sidebar and cards deck in dark and light modes. | Single background color (`#0d1117` / `#ffffff`) with zero vertical dividing border between panes. | PASS |
| **Native macOS Floating Scrollbar (Build 462)** | Inspect browser scrollbar in dark mode. | Browser renders native translucent gray floating pill scrollbar instead of solid black track. | PASS |
| **Card View Action Breathing Room (Build 462)** | Scroll to end of Cards view. | "Mark All Read" button maintains 36px separation from story card borders. | PASS |
| **Continuous Edge-to-Edge Hairline Border (Build 463)** | Inspect header divider border on wide display. | Hairline divider spans continuously from 0px to 100vw across both left and right panes. | PASS |
| **Equal 24px Top Padding Alignment (Build 463)** | Compare top offset of sidebar navigation items vs right pane cards. | Both panes start at identical 24px (`1.5rem`) vertical offset beneath the 73px header. | PASS |
| **Repost Attribution Placement & Typography (Build 464-466)** | View reposted Bluesky story in Cards view. | Attribution rendered on new line above post author in regular 0.85rem font with muted tone (`var(--text-3)`). | PASS |
| **Floating Centered Jump Bar (Build 465)** | View Jump Bar in Cards view. | Jump pills vertically centered between top hairline and category cards with bottom border removed. | PASS |
| **Line 37 Invariant** | Inspect line 37 of `index.html`. | `<style id="tailwind-static">/*! tailwindcss v4` remains intact. | PASS |
| **Syntax Validation** | Execute Node VM syntax audit across all scripts. | 100% valid JavaScript with zero syntax errors. | PASS |

