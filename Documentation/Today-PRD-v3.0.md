# Today (formerly RSS Reader) — Product Requirements Document

| Metadata | Value |
| :--- | :--- |
| **Document Version** | v3.33 (Build 505) |
| **Date** | November 2, 2026 |
| **Status** | Live in Production (`today.dautovic.com`) |
| **Primary Repository** | `SDautovic-GH/RSSReader` |
| **Desktop Companion** | `ScriptLibrary/PROJECTS/RSSReader` |
| **Changelog Reference** | `Documentation/Redesign-Plan-Two-Pane.md` |

---

## 1. Product Overview

### Vision
A fast, private, single-file RSS reader and newsletter reader that operates as a Progressive Web App on mobile and desktop, backed by multi-device cloud synchronization. Reading centers on **Today**: a live, calm intelligence workspace of the last 24 hours' unread coverage and newsletters, grouped strictly by the reader's own chosen folders. No native server, no complex framework build step, and no behavioral telemetry.

### Guiding Principles
- **Single-File Delivery:** All HTML, CSS, and application logic live directly inside `index.html`.
- **Today First:** Opens immediately into Today on both mobile and desktop, in this device's layout from the first paint (a script as the body opens sets the saved Cards columns, wide layout and collapsed sidebar; build 505, before which signed-in start-ups showed the 2-column default for a moment); with feeds but no stories cached, Today opens as the first refresh brings them, unless you clicked or typed meanwhile (build 482). Feed management and triage lists (Following, folders, feeds, unread) are one tap or click away.
- **Cards:** Today is a rich, responsive magazine card deck of clustered coverage, in 1, 2 or 3 columns, with a Category Jump Bar. The AI features (the Gemini Briefing view and its Briefing / Cards switcher, Category Recaps, TL;DR and the 5 AM Morning Briefing) were removed in build 492; the app sends nothing to an AI service.
- **Unified 2-Pane Workstation Architecture (All Views):**
  - The legacy 3-pane layout (Sidebar + Timeline article list + Reader pane + resizer) is completely retired.
  - Every view on desktop — **Unread** (Today's view: since build 501 one sidebar row, labelled Unread, opens Today with all its features; the separate Unread list is gone), **Personal Hub** (`Read Later`, `Saved`, `History`), **Subscription Folders**, and **Single Feeds** — operates as a dedicated **2-pane workstation**: **Sidebar (280px) + Centered Cards Grid/Canvas (`#today-column`)**.
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
- Begins each day in Today's Cards, working down from Top Stories through the folders.
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
| **Mobile Tab Bar** | YouTube floating glass capsule | Detached floating capsule (42px compact height, 340px max-width, `-webkit-backdrop-filter: blur(20px) saturate(180%)`, fill `rgba(18, 18, 22, 0.25)` in dark mode) hovering just above the home indicator bar. Houses 4 icon tabs: **Today** (`#icon-sun` + live unread badge, smart tap to scroll to the top), **Library** (pure Subscriptions & Folders manager), **Bookmarks** (`#icon-bookmark` with sticky 3-way segmented Personal Hub for `[ 🔖 Read Later ] [ ⭐ Saved ] [ ⏱️ History ]`), and **Search** (`#mob-tab-search`). Active tab displays an elevated inner translucent capsule highlight with pure bright white icon (`#ffffff`). Zero text labels. |
| **Mobile Header** | Adaptive single-row header | Logo, title (Today: date, e.g. "Saturday, Oct 31"; Following: "Following"), status line ("Updated just now • 3 new"), and action buttons (Listen, Edit Feeds, Add Feed, Settings). |
| **Mobile Reader** | Full-screen reading overlay | Opens cleanly over Today or active list. Tab bar slides away on downward scroll, returns on upward scroll. Horizontal swipes navigate adjacent stories. |
| **Desktop: Today Cards** | 2-pane wide magazine deck | Sidebar (left) + Wide magazine grid (`desktop-today-cards-wide`). Configurable in 1, 2, or 3 columns via App Settings (per device, with the Wide Screen Layout, since build 493). `#viewer-pane` is hidden. |
| **Desktop: Personal Hub** | 2-pane durable cards workstation | Sidebar (left) + Wide magazine grid in `#today-column` for `Read Later`, `Saved`, and `History`, chosen in the sidebar (the desktop's 3-way switcher in `#timeline-header` was retired in build 496 as a duplicate of the sidebar; the phone keeps its sticky switcher). Stories remain permanently visible and are never auto-hidden when read. |
| **Desktop: Folders & Feeds** | 2-pane cards workstation | Sidebar (left) + Wide magazine grid in `#today-column`. (Unread is Today's view since build 501.) Folders group by publication source with Outlet Jump Bars (`[Ars Technica] [The Verge]...`). Single feeds render as a clean story stream. Legacy 3-pane split retired. |
| **Desktop: Story Reader** | 2-pane focused reader | Clicking any story opens in a 2-pane reading canvas (`desktop-today-story`), centered at 760px with dynamic back button (`< Source`) in header. Pressing Back, `b`, or `Escape` returns to Cards at the exact scroll position. |
| **Desktop: Reading Beside the List** | Opt-in list + reader | Settings → Stories → Open stories → `Beside the list` (`newsreader_story_open`, per device) adds `body.story-beside`: story mode then keeps `#timeline-pane` (resizable, `#resizer`, `newsreader_pane_width`) beside the reader, with the deck in one column. The clicked card keeps its screen height on opening; `j`/`k` scroll the list only when the next card starts out of view. Stories read while it is open stay listed, dimmed (`brief-card-seen`), and leave when the reader closes. |
| **Keyboard Triage in Cards** | Desktop triage without the mouse | With a card view on screen and no story open (`desktop-today-cards-wide`), `j`/`k` move a highlight (`brief-card-cursor`, shown under `body.kbd-nav`, cleared by a mouse press); `Enter` opens, `r` marks read and moves on, `s` saves, `l` toggles Read Later, `o` opens the original, `Esc` lets go (`cardCursorKey`). Headlines (and social posts' text) are focusable (`tabindex="0" role="link"`, `Enter` opens) with a focus ring; focus moves the highlight. `s`/`l` in a story run its Save / Read Later. |
| **Sidebar & Buttons (builds 494-503)** | A lighter, floating sidebar | **Today and Unread are one row** (build 501): the first smart list, labelled Unread with the unread count (`#feed-btn-today`, `openToday()`), opens Today's view with all its features (Top Stories, sections, jump bar, Mark Read); the separate Unread list row (`#feed-btn-all`) is gone. The smart lists are floating rounded rows with no boxes or divider lines; subscriptions and folders are 38px pill rows with round 24px folder toggles, 16px from the sidebar's edges, with no lines between folders on the desktop (build 505; the phone's Library list keeps its dividers). Refresh and Settings moved from the sidebar header to the bottom dock. Every text button is a borderless ghost pill, 38px tall. The header's status line shows on the phone only. |
| **Collapsible Sidebar Rail** | Navigation always on screen | `[` or the logo button (`#sidebar-toggle`, panel icon on hover) toggles `body.sidebar-collapsed` (`newsreader_sidebar_collapsed`, per device): a 72px rail with the smart lists as icons and short labels under them (Unread's count as a badge on the icon's shoulder; Read Later and Saved have no count and dim when empty, the Read Later state counted from the durable bucket) plus Refresh and Settings in the dock pinned to the sidebar's bottom (`#sidebar-rail-actions`, labelled on the rail; the same dock when the sidebar is open). With the rail, the app name stays at the top left as a link to Today. `--sidebar-w` (280px, the rail's 72px) feeds the centring, so the rail and the deck are centred together. Desktop only; the phone ignores it. |
| **Desktop Layout at Any Width** | Zero collapse on resize | A mouse device gets the desktop layout (sidebar, headers, cards) at every window width; the phone layout (tab bar, phone headers) is for touch devices up to 900px. CSS and JS share that one test: phone CSS is `@media (max-width: 900px) and (hover: none), (max-width: 900px) and (pointer: coarse)`, desktop CSS is `@media (min-width: 901px), (hover: hover) and (pointer: fine)`, and `isMobile()` is false whenever `isDesktopDevice()` is true. At 1000px and below the cards deck is one column. |
| **Wide Screen Layout & Centered Controls** | Ergonomic centered controls & full bleed | On wide/ultrawide displays, the app container remains 100% full-bleed edge-to-edge chrome seamlessly merging into the browser window (zero artificial outer letterboxing or flanking black borders). Header controls are bound inside `.timeline-header-inner` and `.viewer-header-inner` to mathematically align with the exact margins of the reading canvas (`1240px` cards, `760px` story). Eliminates disjointed multi-thousand-pixel chasms between controls while maintaining edge-to-edge chrome. The sidebar keeps one position per window width in every view (centred on the Cards View Columns deck width, `--deck-w`), so opening a story never slides it; the story canvas centres where the cards were. Configurable via Settings $\rightarrow$ Appearance (`Centered Content (Recommended)` vs `Full Width Stretch`, which keeps the sidebar at the left and lets the cards fill the pane). |
| **One Accent** | One house blue | `--accent` / `--accent-rgb` (`#3d6bb0` light, `#4d7cc7` dark) is the only blue: every hard-coded blue points at it, and Tailwind's blue scale (`--color-blue-50`…`950`) is remapped to it on the root, so utilities such as `text-blue-500` follow. |
| **Unified Workstation Canvas** | Single surface, borderless junction | Sidebar and content pane share a single unified background surface (`#0d1117` in dark mode, `#ffffff` in light mode). Vertical dividing border between sidebar and right pane is eliminated (`border-r: none`), creating a continuous, calm workstation workspace. |
| **Continuous Edge-to-Edge Hairline Border** | Full-width horizontal divider | Header border extends across the entire browser width (0px to 100vw) via `#app-container::before` and `#sidebar-header::before` anchored at `top: 73px`, presenting an uninterrupted hairline divider across both panes. |
| **Equal 24px Top Padding Alignment** | Synchronous content alignment | Both the sidebar navigation list (`#sidebar-pane > .overflow-y-auto`) and right pane content (`.brief-header`) share identical `1.5rem` (24px) top padding below the 73px header border. |
| **Native Dark-Mode Scrollbars** | Translucent floating pill scrollbars | Configured via `<meta name="color-scheme" content="light dark">` and `color-scheme: dark/light` on `html`. Replaces opaque solid black scrollbar tracks with native macOS floating gray translucent pills anchored at the edge of the viewport. |
| **Desktop Full Screen** | Distraction-free reading | Double-clicking reader top bar isolates story. Arrow keys navigate and scroll; `Esc` exits. |

### 3.2 Today Engine & Intelligence Modes

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **▣ Cards View (Category Cards)** | Unified category deck with immediate unread-only triage | Each folder/category renders as a **single unified Category Card** (`.brief-cat-section`) containing its stories in clean list rows with subtle dividers, eliminating the visual clutter of dozens of isolated boxes. Stories feature inline action controls: `Mark Read` (checkmark button with smooth collapse animation), `Save` (star button), and `...` More options. Supports 1, 2, or 3 columns (`--today-cards-cols`) configured via App Settings (`760px`, `1240px`, `1680px`). |
| **Calm Empty States (builds 487-490)** | Quiet when everything is read | "All caught up" with "No unread stories." ("No unread stories in/from <name>." in a folder or feed), text only, centred in the space (`.brief-all-read-note`, `.brief-empty-state`); the header's meta line, Listen button and divider and the footer's Mark All Read go with it. While a refresh runs an empty Today reads "Checking for stories…" instead, and the start-up refresh starts before the first render (489). |
| **Article Tidy-up (build 491)** | Stories without publisher clutter | `tidyArticle`, the web-page counterpart of `tidyEmail`, removes publisher furniture from fetched articles (Google Preferred Source / News follows, ad slots and adhesion bars, newsletter sign-ups, inline recirculation, share bars), picture boxes and captions whose picture is missing or failed, stray photo credits, and blocks left empty; it never removes prose containers. |
| **Email Newsletters Fit the Reader** | No newsletter cut off on the phone | A newsletter story (`isNewsletterStory`: a feed URL with "newsletter", or a bridge link) marks the story body `is-email`. Its tables go to 100% width (`table-layout: auto`), cells lose their fixed widths, boxes with an inline width take the width they're given, and long links wrap (`overflow-wrap: anywhere`). Email layouts are fixed tables for 600-700px windows; on a 339px phone they ran up to half their width off the right edge (build 483). Buttons set never to wrap (`white-space: nowrap`; Substack's "Give the gift of Paul Krugman's Substack", about 350px) held a real Substack email at 357px in 311px: in newsletters their text wraps (build 485, found with that newsletter's HTML in WebKit at 339px). Never scaled down: the text stays full size (Samir's call; a zoom-to-fit was tried and dropped). Build 484 wrapped wide table rows instead, a guess from a made-up sample; it wrapped nothing in the real email and was removed in 485. Also in 485, the email's furniture goes (`tidyEmail`, after `stripPageChrome`): Substack's like / comment / share bars (`.email-ufi-2-*`, empty since the bridge drops their icons), subscribe and upgrade widgets (`.subscribe-widget`, `.post-cta`), "Forwarded this email?", the hidden preview text and the footer; then any `p`, `figure`, `li`, `tr`, `table` or `div` left with no text or picture. Buttons the author put in the post stay. Lists show bullets, quoted tweets are visible cards (`.twitter-embed`), pictures get no story-picture margin (it made a tweet's 40px avatar an 88px row), Substack sections' top padding goes from 32px to 12px and dividers get a faint line. Real Chartbook issue: 10,284px to 8,792px tall. Other stories keep their tables as they are. |
| **Jump Bar Highlight & Arrows** | It shows the section you're in | The tapped pill stays highlighted through its own smooth scroll (held until the scroll reaches its target, or 1.5s); a scroll by hand then highlights the section in view (the last one whose top has passed 180px below the pane's top) and slides the bar to it; within 40px of the top the first pill is highlighted (build 504; 482's clear-on-hand-scroll replaced). When the pills overflow the bar, ‹ › arrows at its ends scroll it (`scrollBriefJumpBar`, shown by `updateBriefJumpNav` only when there is more that way), and a mouse wheel scrolls it sideways. |
| **Back to the Top after a Jump** | One tap back from a section | A jump-bar pill that scrolls you down more than 40px (`briefJumpTo`) shows a Top button (`.jump-top-btn`, one button in the cards pane) at the pane's bottom right. Desktop (build 480): the collapsed rail's Refresh / Settings look (22px chevron, 6px padding, `--color-gray-500`, the hover tint) on the pane's colour, 16px from the bottom as Settings is, and beside the cards column (build 481): as far right of `.brief-container` as the rail's buttons are left of it (sidebar open: the rail's 32px half-width plus the column's inset), or 6px inside the pane's scrollbar when that's off the pane (`placeJumpTop`, on show, scroll and resize). Phone: an "↑ Top" pill in the Undo bar's glass, 14px in and above the tab bar, stepping above the Undo bar while it shows (`:has(#brief-undo-bar.is-on)`) and above the Listen player. A tap scrolls the pane to the top and highlights the first pill. It goes when you're back within 40px of the top by any route; only a scroll up can hide it, so the jump's own scroll down can't. A pinned jump bar was built and dropped (build 479, before release): more code, the new-stories pill sat on it, and in the desktop's column deck "the section you're in" is ambiguous. |
| **Card Anatomy: Source First** | Who it's from before what it says | Every story card and list card opens with the source / author line (favicon, name, time; on the phone the time is compact, "19h" / "3d" / "now" (`storyTime`), with no " • " before it, and `…` is 26px wide, so the name has up to 225px of a 339px phone's 311px line, 72%, where it had ~184px; build 486) carrying Mark Read and `…` at its right, on every card (Today's and the lists', phone and desktop; build 477). Both are 21% over their build-476 size (10% in 477, 10% more in 478): Mark Read 31.46px with a 16.94px icon (phone 26.62px), `…` 36.3×26.62 with a 24.2px icon; negative block margins keep the extra out of the line's height, so no card grows. On the phone they are 7px apart, each touch area (`::after`) 44 tall and reaching halfway into the gap, so the areas meet without overlapping; Mark Read leaves with Undo on the phone and, since build 482, on the desktop too (click or `r`), as the swipe does: the grouped copies go read with it and the next card slides up (`markBriefCardRead`; a list card's button and swipe share `listCardAct`). Read Later is in the `…` menu (and long-press, right-click), which leaves out Mark Read wherever the source line shows it; a repost note ("Reposted by …") sits just above it. Then the headline and summary, a Small thumbnail floating beside them or a Large picture under them, and "Also from …". `normalizeBriefDOM` puts the line first on every render; `placeBriefThumb` puts a thumbnail right after it. |
| **Immediate Read Disappearance** | Strict unread-only presentation | Marking a story read immediately hides it (`display: none !important`), smoothly collapsing the row. Opening a story in the reader automatically hides it upon return via `< Today`, `b`, or `Escape`, ensuring only unread stories remain visible. Categories with zero unread stories cleanly disappear; when all stories are read, "You're all caught up" displays. |
| **Space Between Sections** | One rhythm for Today's deck | Sections are 20px apart, set by the deck alone (`.brief-deck-col` and grid gap; their own bottom margin is 0 on the desktop, build 505), and the Mark-read row has 4px below its button: 36px from a section's Mark-read button to the next heading (was ~52px). |
| **Top Stories Band & Balanced Deck** | No holes between cards | In Cards, Top Stories spans the deck with its stories flowing down the deck's columns (CSS columns). The folder cards below are placed by `balanceTodayDeck()` into column wrappers (`.brief-deck-col`), each into the shortest column in order. Placement runs after a render and when the CSS grid's column count changes, never when a card shrinks; a column count seen before gets its earlier placement back (`data-deck-col<N>`). |
| **Floating Centered Jump Bar** | Clean pill navigation | Jump bar capsules (`.brief-jump-bar`) are vertically centered between the top hairline border and category story cards (`padding: 20px 0; margin: 0`). Bottom border under the jump bar buttons is removed for a floating, lightweight feel. |
| **Socials Repost Attribution & Context** | Standard repost pattern & context card | A Bluesky repost reads as on Bluesky and X: a top line with the repost icon (two arrows in a loop, `#icon-repost`) and "Reposted by **<feed>**" (the reposter's name medium weight), then the source line naming the post's own author (`bskyOriginalAuthor`), with the feed's favicon. The icon has the favicon's size and gap, so it sits right above it; the note is the source line's size (`--list-source-size`, the phone's `--mob-feed-name-size`, from Text size & zoom) and its muted colour (`--text-3`). The source element keeps the feed name in `data-source` for the card clean-up's feed lookup. Replies and quotes feature embedded parent post context with self-reply thread suppression. |
| **Card View Action Spacing** | Comfortable triage breathing room | `.brief-footer` features a generous 36px top margin (`margin-top: 36px !important;`), guaranteeing "Mark All Read" never crowds against category card borders. |
| **Top Stories** | Highlighted consensus | Up to 5 most significant stories across all folders (ranked by source authority, multi-outlet consensus, and recency). |
| **Story Clustering** | Duplicate consolidation | Multi-outlet coverage of identical events is clustered into a single master card led by the most authoritative source, with an "Also from..." footer. |
| **Calm Updates** | Zero jump guarantee | Background sync never repositions elements on screen. New incoming stories display a floating `"N new stories"` banner that only refreshes upon user tap. |
| **Listen Mode** | Speech synthesis | Persistent floating player (speed, queue) reads Today or a story aloud. On the phone (`isMobile()`) through an `<audio>` element fed by the translate TTS endpoint, which plays even in iOS Silent Mode, with Web Speech as the offline fallback; on desktop through Web Speech (the computer's voices), so no story text leaves the device. |

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
| **Global Mark Read** | End-of-Today clear | "Mark All Read in Folders" pill at the conclusion of Today marks all of Today's folders read with immediate 5-second undo support. |
| **Smart Lists** | Structured views | Unread (Today's view, build 501), Read Later, Saved (starred), and History (up to 90 days retention). |

### 3.5 Reader & Content Rendering

| Feature | Requirement | Implementation Detail |
| :--- | :--- | :--- |
| **Today Push-and-Return** | Focused 2-column reading | Opening a card from Today Cards activates `desktop-today-story` in a centered 760px canvas with `< Today` back button. Back lands the next unread card at once at the height the opened card had (`_returnToBriefState.cardTop`, recorded on open); reading beside the list, where the open story's card is at that moment, so nothing moves (build 482; until then it glided the card to the middle). The phone's Today tab does the same (`returnToBrief`). |
| **Full Content Extraction** | Truncation bypass | Automatic full-text extraction through proxy for truncated feed summaries. Repeated page title headers and bylines are cleanly stripped. |
| **Sanitization** | Security guarantee | DOMPurify 3.1.6 sanitization on all inbound HTML elements and styling attributes. |
| **Page Chrome Removal** | No dead controls in stories | `stripPageChrome()` runs on extracted pages before they are cached and on every displayed body: removes buttons and form fields (a `<form>` is unwrapped), SVGs with nothing to draw (sprite icons that point at the site's own sheet render as empty 300×150 boxes), and player tool menus / embed-code overlays (`PAGE_CHROME_CLASS`). Links, audio and video stay. |
| **Typography & Sizing** | Device-specific customization | Granular App Zoom, title sizing, line height, preview lengths, Cards View Columns (1, 2, or 3), and custom typography configurable per device. |
| **Pictures** | Large / Small / None | Settings → Today → Pictures (`newsreader_today_pictures`; the old `newsreader_today_images = '0'` reads as None). Small (`body.today-pictures-small`) draws every picture as the 88px thumbnail: a card with a thumbnail is flow content (`:has(> .brief-thumb)`, not the flex column, which ignores float), so it floats top right beside the headline and summary and the source line clears below the taller of the two; None (`today-no-images`) also stops picture downloads. |

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
  └── localStorage (device prefs, zoom, layouts, cards columns)
          │
          ▼
[Cloud Synchronization]
  └── Firebase 11.6.1 (Auth + Firestore multi-tenant isolation per UID)
```

### 4.2 Workstation Mode Classes & Pane Matrix

| State | Active Body Class | `#sidebar-pane` | `#timeline-pane` | `#viewer-pane` | Header Switcher |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Today: Cards** | `desktop-today-cards-wide` | Visible (280px) | `display: flex` (100%) | `display: none` | None (the Briefing / Cards switcher went with the AI, build 492) |
| **Today: Story** | `desktop-today-story` | Visible (280px) | `display: none` | `display: flex` (100%) | Hidden (`< Today` back button shown) |
| **Story beside the list** | `desktop-today-story` + `story-beside` | Visible (280px; 72px rail when collapsed) | `display: flex` (440px default, resizable) | `display: flex` (rest) | Back button closes the reader |
| **Unread / Feeds / Personal Hub** | `desktop-today-cards-wide` | Visible (280px) | `display: flex` (100%) | `display: none` | Mark Read (the Personal Hub switcher retired on desktop, build 496) |

### 4.3 Deployment Pipeline
- Code updates committed to `SDautovic-GH/RSSReader` via `SyncGit-macOS-RSSReader.ps1` (or Windows counterpart).
- Automated build pipeline bumps service worker cache version and pushes to GitHub `main`.
- Cloudflare Workers Builds automatically detects git push, builds, and deploys globally to `today.dautovic.com` in ~20 seconds.

---

## 5. Mistakes, Pitfalls & Guardrails (DO NOT REPEAT)

- ⚠️ **Do not bulk-remove `!important` from the stylesheet (analysed 2026-11-02, build 471).** Of the main stylesheet's 1,272 `!important` declarations, 722 changed nothing when switched off one at a time in 36 views (desktop 1400px and 800px, phone 339px, light and dark; Today Cards, keyboard highlight and story menu, story page, full screen, beside the list, Unread, a folder, History, Settings, search, shortcuts, rail with small pictures). Only **8** are provably safe in every state: each of the other 714 competes with a rule that only applies in states those views don't reach (hover, `brief-held`, `tabbar-tucked`, Pictures None and the like), and 518 of them also sit on properties scripts set as normal-priority inline styles (swipes, drags, pull-to-refresh, the search sheet's placement), where the `!important` is what keeps the stylesheet's value. They resolve real conflicts between the phone and desktop layouts and against state classes; removing them buys no visible gain and risks regressions in the calm-Today and gesture behaviour. Keep them, write new rules to need as few as possible, and don't retry the cut without a check that also covers every state class and every script-set inline style.
  - Method, if it is ever revisited: map each source rule to its CSSOM rule (index path + selector); per view, rewrite one rule's declaration block from the source without one `!important` (never `setProperty` on a shorthand, which clobbers later longhands in the same block) and compare the computed longhands of every element it matches; then, statically, list each free declaration's possible winners once it is normal (an `!important` rule it used to beat, or a normal rule at least as specific, on a compatible rightmost compound) and require each to have been seen on the same elements in a tested view.
- ⚠️ **A stray `}` drops the rule after it.** Under current CSS parsing it becomes part of the next rule's selector, which is then invalid (build 448's dropped the `.brief-thumb, .brief-hero` base rule until build 470; build 504's, a duplicated half-rule in the sidebar dock's styles, closed the desktop media block early and dropped Small pictures' `display: flow-root` until build 505). Check the stylesheet's brace balance after editing it.
- ⚠️ **Find a Today card's actions-bar buttons inside `.brief-story-actions`.** In builds 474-476 the source line's small Read Later (`.brief-story-ctrls .brief-act-later`, removed in 477) came first in the card, so `card.querySelector('.brief-act-later')` in `updateBriefStoryActionButtons` restyled it as the bar's 32px `icon-act` with a 19px icon beside the 14px check, and the hidden bar's button (pressed by menus) never showed its state (fixed in build 474). A card-wide `querySelector` finds whichever button comes first.
- ⚠️ **Every build updates the change log and this PRD, on either machine.** Builds 491-504 (the Mac, 2026-11-05/06) shipped with commit messages alone, and the PRD and user guide went on describing the AI Briefing removed in 492 until the docs caught up at 504. The desktop app is built from this page and its docs, so a gap here reaches its Intune package too.
- ⚠️ **Phone CSS and `isMobile()` must agree.** Phone CSS is `@media (max-width: 900px) and (hover: none), (max-width: 900px) and (pointer: coarse)`; desktop CSS is `@media (min-width: 901px), (hover: hover) and (pointer: fine)`. A rule keyed on width alone (`max-width: 900px`) gives a mouse device the phone layout in a narrow window while the JavaScript stays on desktop, which left no navigation at all before build 470.

