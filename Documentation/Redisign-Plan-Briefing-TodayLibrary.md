# Redesign Plan: Briefing & Today Library (RSS Reader v2.5)

| Key | Value |
| :--- | :--- |
| Project | RSS Reader Web Application (`today.dautovic.com`) |
| Document | Redesign Plan & Implementation Record — Briefing & Today Library |
| Target File | `/Users/samirdautovic/Developer/RSSReader/index.html` |
| Current State | **Active — Build 448** deployed to production via Cloudflare Workers CI |
| Date | 2026-11-01 |
| Status | Complete & Deployed |

---

## 1. Executive Summary & Design Vision

The **Briefing & Today Library Redesign** transforms the user's daily reading experience by establishing a clear distinction between **Today** (a focused, executive 2-column workspace for daily intelligence) and **Unread** (the traditional 3-column workstation for feed triage).

### Core Principles
1. **Today as a Focused 2-Column Workspace:**
   Today is never split into three cramped columns. It offers two distinct views via a unified header switcher:
   - **✦ Briefing View:** An editorial, AI-synthesized daily briefing rendered in a clean, centered 760px canvas.
   - **▣ Cards View:** A responsive, multi-column magazine card deck (customizable in 1, 2, or 3 columns).
2. **Push-and-Return Story Flow:**
   Clicking any card in Today Cards slides in the reader pane in a full 2-column view (`desktop-today-story`), centered at 760px with a `< Today` back button in the header. Pressing `< Today`, `b`, or `Escape` immediately returns to Today Cards at the exact card scroll position.
3. **Three-Column View Reserved for Unread:**
   The classic 3-column triage layout (Sidebar + Timeline article list + Reader pane) is exclusively preserved for the **Unread** folder (`#feed-btn-all`) and feed lists, eliminating the visual clutter of having Today Cards squeeze into a 440px middle column.
4. **Simultaneous Mathematical Centering:**
   The active header switcher (`✦ Briefing   ▣ Cards`) and the body content below it share the exact same `50%` horizontal centerline at all times, moving synchronously during window resizing with zero drift.
5. **Persistent Desktop Headers:**
   Resizing the desktop browser window (e.g. split screen, window tiling) never causes the header to disappear or the mobile bottom tab bar to appear.

---

## 2. Workstation Layout Architecture

```
+---------------------------------------------------------------------------------------+
|  TODAY MODE (2 Columns: Sidebar + Dedicated Reading Workspace)                        |
+-------------------+-------------------------------------------------------------------+
|                   |  [Top Bar]               [✦ Briefing  ▣ Cards]             [Acts] |
|                   +-------------------------------------------------------------------+
|  Sidebar          |                                                                   |
|  - Today (Active) |                      Centered Editorial Content                   |
|  - Unread         |                     (Briefing Canvas: max-w-760px                 |
|  - Read Later     |                      Cards Deck: 1, 2, or 3 columns)              |
|  - Saved          |                                                                   |
|  - History        |                                                                   |
|  > Subscriptions  |                                                                   |
+-------------------+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
|  UNREAD MODE (3 Columns: Sidebar + Timeline List + Reader Pane)                       |
+-------------------+-------------------------+-----------------------------------------+
|  Sidebar          |  [Mark Read]     [Find] |  [< Back]               [Nav]  [Listen] |
|  - Today          +-------------------------+-----------------------------------------+
|  - Unread (Active)|  Story 1                |  Full Article Reader                    |
|  - Read Later     |  Story 2 (Selected) --> |  Title, Byline, Hero Image, Content     |
|  - Saved          |  Story 3                |                                         |
|  > Subscriptions  |  Story 4                |                                         |
+-------------------+-------------------------+-----------------------------------------+
```

| Mode | Active Body Class | Pane 1 (Sidebar) | Pane 2 (Timeline) | Pane 3 (Viewer) | Column Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Today: Briefing** | `desktop-today-briefing` | Visible (240px) | `display: none` | Full width (`flex: 1`) | **2 Columns** |
| **Today: Cards** | `desktop-today-cards-wide` | Visible (240px) | Full width (`flex: 1`) | `display: none` | **2 Columns** |
| **Today: Story** | `desktop-today-story` | Visible (240px) | `display: none` | Full width (`flex: 1`) | **2 Columns** |
| **Unread / Feeds** | *(none)* | Visible (240px) | Visible (440px / resizable) | Visible (`flex: 1`) | **3 Columns** |

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
| **449** | Pending | **Category Cards Architecture & Immediate Unread-Only Triage:**<br>• Consolidated Today Cards so each folder/category is a single unified Category Card (`.brief-cat-section`) with its stories rendered as clean list rows separated by subtle dividers, eliminating the visual noise of dozens of isolated boxes.<br>• Equipped each story row with inline action controls on its source line: `Mark Read` (checkmark button with smooth 180ms collapse dismiss animation), `Save` (star button with active amber highlight), and `...` More options.<br>• Enforced strict unread-only card presentation: marking a story read immediately hides it (`display: none !important`).<br>• Opening a story in the reader automatically hides it upon return via `< Today`, `b`, or `Escape`, cleanly landing on the next unread story.<br>• Empty categories automatically collapse and hide (`.brief-section-empty`); when all stories are read, "You're all caught up" displays. |

---

## 5. Keyboard Navigation Map

| Key | Context | Action |
| :---: | :--- | :--- |
| `1` | Anywhere in Today | Switch immediately to **✦ Briefing View** |
| `2` | Anywhere in Today | Switch immediately to **▣ Cards View** |
| `t` / `T` | Anywhere in App | Jump to Today |
| `j` / `↓` | Today Cards / Reader | Next article in queue |
| `k` / `↑` | Today Cards / Reader | Previous article in queue |
| `b` / `B` | While reading Today story | Return to Today Cards / Briefing |
| `Escape` | While reading Today story | Close story and return to Today Cards / Briefing |
| `r` / `R` | Story open | Toggle read / unread status |
| `/` | Anywhere | Open full-text search palette |

---

## 6. Verification & Quality Assurance Matrix

| Test Case | Scenario / Steps | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **Header Centering** | Toggle between Briefing and Cards mode. | Switcher sits exactly above the centerline of the body content. | PASS |
| **Dynamic Resizing** | Drag desktop window border from 1600px down to 700px. | Header and body content shift simultaneously with zero horizontal drift. | PASS |
| **Header Persistence** | Resize desktop window to `< 900px` (e.g. split screen). | Headers (`#viewer-header`, `#timeline-header`) remain visible (`display: flex`); mobile tab bar stays hidden. | PASS |
| **Column Isolation** | Click an article card from Today Cards. | Opens in 2-column reader (`desktop-today-story`); `#timeline-pane` is hidden; never splits into 3 columns. | PASS |
| **Return Flow** | Click `< Today` or press `Escape` / `b`. | Closes story, restores full-width Cards mode, and scrolls to the read card. | PASS |
| **Unread 3-Column** | Click **Unread** in sidebar. | Cleanly displays all 3 columns (Sidebar, Timeline list, Reader pane). | PASS |
| **Column Preference** | Change Cards View Columns to 1, 2, or 3 in Settings. | Cards grid and `.brief-container` immediately resize to match selected setting. | PASS |
| **Personal Hub 3-Way** | Tap Bookmarks tab on mobile. | Segmented switcher cleanly toggles between Read Later, Saved, and History. | PASS |
| **Today Smart Tap** | Tap Today button while scrolled down; tap again at top. | First tap scrolls smoothly to top; second tap toggles between Cards and Briefing view. | PASS |
| **Frosted Translucency** | Observe floating tab bar over scrolling images/text. | Content softly blurs beneath the pill with true YouTube glass translucency. | PASS |
| **Dead Code Elimination** | Verify absence of legacy briefing slot and compact wire code. | Zero console errors, -326 lines removed, clean code execution. | PASS |
| **Ultrawide Seamless Full-Bleed** | Open app on display $> 1720px$ width. | App container fills browser edge-to-edge with zero letterboxing or dark bars; sidebar is anchored left; header controls align cleanly with the centered reading/cards content. | PASS |
| **Ultrawide Toggle** | Switch Wide Screen Layout in Settings to "Full Width Stretch". | Header controls expand edge-to-edge; preference persists across reload. | PASS |
| **Category Cards Layout** | Open Today in Cards view. | Each category displays as a single unified card container with its stories listed inside; no visual noise of isolated card boxes. | PASS |
| **Story Mark Read Dismiss** | Click inline checkmark on any story row in Today Cards. | Row animates dismiss collapse (180ms) and vanishes completely from view; remaining stories stay interactive. | PASS |
| **Return From Reader Dismiss** | Open a story from Today Cards and press `< Today`, `b`, or `Escape`. | Closes reader and returns to Today Cards; the opened story has vanished, landing on the next unread item. | PASS |
| **Line 37 Invariant** | Inspect line 37 of `index.html`. | `<style id="tailwind-static">/*! tailwindcss v4` remains intact. | PASS |
| **Syntax Validation** | Execute Node VM syntax audit across all scripts. | 100% valid JavaScript with zero syntax errors. | PASS |

