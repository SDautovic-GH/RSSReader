# Brief-First Redesign Plan (RSS Reader v2)

| Key | Value |
| :--- | :--- |
| Goal | Make the brief layout (grouped, deduplicated, ranked) the default way to read feeds |
| Reference Style | Apple News (Today header, glass tab pill, separate search) + Google News (editorial sections, consensus clustering) |
| Target File | `RSSReader/index.html` |
| Current State | **Active — Build 323** deployed to production (Phase 5 complete, plus follow-ups; automatic briefs removed) |
| Last Updated | 2026-10-08 |

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

### Follow-ups (Builds 275–323)
- **Mobile bar (275–276):** tab labels 13px (were 11px), reader Back 15px with an 18px chevron. The selected tab shows a filled glyph (Today's sun disc, Following's folder; Search stays an outline), all tab icons use a 1.75 stroke, and Today in the sidebar, the Today tab and Light in Settings share one sun (`#icon-sun`, Lucide geometry, no fill/stroke-width on the symbol). The long-press Mark-all-read popover, orphaned since the Articles/Topics tab was removed, is retired; desktop right-click menus are untouched.
- **Pull-to-refresh on Today (277):** the Following pull gesture now also works on the mobile Today brief. On release the brief steps down for a spinner until the refresh (and any pass queued behind one already running) finishes, then Today is rebuilt with the new stories.
- **Read stories leave the brief (278):** a story marked read by any path disappears from every brief on screen (Today and stored briefs), via `syncBriefCards()`; the story open beside the desktop Today column stays until you move on. Emptied sections, their pills and the pill bar go too, counts follow what is left, and Back / return-to-Today land on the next unread story. Prev/next walks only what is left.
- **Mark-read row (278):** one short line at the end of every section ("Mark N read") marks the stories still showing above it plus the other outlets' copies grouped under them (`data-cov`), then shows "Marked N read · Undo" for 5 seconds. The heading check still marks the whole folder.
- **A story's copies go with it (279):** marking a single brief story read (opening it, its Read dot, the reader's Read button, a list swipe) also marks the other outlets' copies grouped under it, so none returns as a "new" story in the next Today. Copies are registered from each card's `data-cov` when a brief is shown (`window._briefCopies`); marking the story unread puts back only the copies its read mark took along. The section row marks its copies explicitly and keeps its own exact Undo.
- **Swipes, settings, speed (280):** a sideways swipe never navigates from a brief (on Today it used to open the first story of the Unread list) and never when it starts on something that scrolls sideways (the pill bar, a wide table). Stories per Category has a last step, All (every unread story). Generated briefs are built from unread stories only. Folder unread counts for all sections are computed in one pass (they re-ran the folder matcher per section per article on every refresh), and `normalizeBriefDOM` uses lookup maps instead of a linear search per card. "Mark N read" is 0.95em.
- **Automatic briefs removed (281, on request):** with Today live, the scheduled Morning / Midday / Afternoon / Evening briefs were Today cut to a fixed window. Removed: generation (`checkAndGenerateBriefs`, `generateBrief`, the ET slot schedule and its once-a-minute timer), the on-demand "Generate Brief Now" bar, the Briefs folder and its badge, the Briefs segment next to Saved / Read Later, and the Enable Briefs switch. Settings' section is now "Today" (Stories per Category). Startup empties the old `briefs` IndexedDB store on existing installs. Kept for Today: `composeSlotBrief`, `buildStoryClusters`, `getETParts`, and the source rankings, which `runFullRefresh` now refreshes (24h cache) since the generator used to.
- **Regular-weight titles (282, on request):** Today's story titles are weight 400 (were 600), like the category pills; they still stand out from the excerpt by size and colour.
- **Next pill + heading size (283, on request):** reading a story opened from Today on mobile, a "Next" pill sits bottom right just above the tab bar (tab-bar glass, 44px target) and opens the brief's next story in one tap; after the last story it reads "Back to Today". It replaced the floating Save star and "Back to Brief" pill, which the headline row and the top bar's Back already cover. The mobile Today heading now follows Article Reader > Title Size (`--mob-article-title-size`) like desktop; it was a fixed 1.15em.
- **Next fixed, on desktop too; full screen (284, on request):** the 283 pill never appeared: its wrapper carried Tailwind's `hidden`, which is a layered `!important` that no unlayered rule can override (the old "Back to Brief" FAB had never shown either). Next (`#brief-next`) is now driven by `#viewer-pane.has-brief-next` and shows on desktop too (bottom right of the article column, Today column included). Full screen: a top-bar button (or double-click the bar) shows the open story alone in a centred column, with no sidebar, list, top bar or tab bar, plus browser full screen on desktop. Exit is the bottom-left button or Esc. Next stays available, and full screen ends when the story closes or Today returns.
- **Following holds your stories and feeds; Today is the one place to refresh (323, on request; step 1 of 2):**
  - **The decision (2026-10-08):** you read only in Today, so Following becomes the place for your saved stories and your feeds, like Apple News's Following tab (Saved Stories and History sit there, with the channels you follow and an Edit button). Keep the name Following and the tab bar Today | Following | Search; a "Library" tab was considered and dropped (neither Apple News nor Google News has one). Keep Unread rather than a new "Missed" list.
  - **Following on the phone:** Unread, Read Later, Saved, History, then your folders. The Today row (it repeated the tab) is hidden on the phone and stays on desktop. Unread shows "N older than today": unread stories older than Today's 24 hours, which are kept for 4 days and appear only here (`#unread-older-note`, counted in `updateBadges`, muted ones left out).
  - **One refresh place:** Today's pull, alongside the automatic ones (on open, on return after 5 minutes, the timer). Removed: Following's pull (`#ptr-indicator`), its "Tap or pull to refresh" circle (`#ptr-hint`, `_setHintRefreshing`), the lists' own pull, and the empty list's Refresh button. The phone header's styles now select `#sidebar-header` by id; they used `div:nth-of-type(2)` from when the pull indicator was the first div. The desktop header's refresh button stays, as desktop has no pull.
  - **Today's pull is calm:** when the refresh ends (~20 s later), Today is rebuilt with what came in only if you are still at the top. If you scrolled down to read, nothing moves: the spinner's space closes off screen, made up for by `keepTodayInPlace`, and new stories wait behind the pill. Before, Today was rebuilt either way and the scroll was put back a frame later.
  - **Checked at 339px:** Following shows the four rows and no refresh controls, the header keeps its styles, and a pull on Following starts nothing. Today's pull at the top refreshes and then rebuilds; pulling and then scrolling down gives no rebuild, and the story on screen stays at 141px.
  - **Next (step 2):** the feed manager behind an Edit button in Following's header: health per feed, the "in Today" switch per folder, and add, rename, move and remove. On the phone, editing a feed is unreachable today (the long-press menu was retired).
- **A calm Today: it moves only when you touch it, and never later (322, on request: "the worst effect is the jump about 3-5 seconds after I tap mark read - that is the Undo time ... if the jump happened right away to slide up that would be more tolerable ... Surely there is something that can be done to enable calmer use of the app"):**
  - **Your taps act at once:** `syncBriefCards(root, { now: true })`. That covers Mark N read, the Read dot, the folder check, Mark all read, desktop Back, fresh renders, and the return from a story.
    - **Mark N read:** the whole section leaves at the tap, and the next section slides up into its place. It lands where the section began, or at Today's top line (the scroller's top padding) if the section began above the screen.
    - **Undo:** a bar floats over the page above the tab bar (`showBriefUndo`, `#brief-undo-bar`, placed like the Listen player). Nothing moves when it goes after 5 seconds, and Undo puts the screen back exactly as it was.
    - **What 321 did instead:** it kept the heading and a "Marked N read · Undo" row in the page for 5 seconds and then removed them, so the page moved again after you had moved on.
    - **The slide:** the Read dot and folder check slide what follows up too (`briefSlideUp`, now Web Animations, because `.brief-story-card { transition: background 0.15s !important }` made cards snap instead of slide).
  - **Anything automatic waits while you can see it:** a refresh, another device's read marks, a picture that turns out broken or small. Whatever has to go while on screen waits where it is: `brief-held`, with a read story dimmed to 0.45; pictures use `data-pending`, broken ones hidden in their box. It goes when a later pass finds it off the screen, at the latest 250ms after scrolling stops (setting the scroll mid-fling would stop an iOS fling). `keepTodayInPlace` makes up for it there, so nothing on screen moves. The hide rules exclude `.brief-held`.
  - **Never rebuilt under you:**
    - **New stories after a refresh:** always the "N new stories" pill. The idle rebuild at Today's top (306) is gone.
    - **At launch:** Today was rebuilt up to three times a second or two after every open, each time at its top, because the cloud feed snapshot and the cloud settings (Folders in Today, muted words) re-applied unchanged lists. Each now rebuilds only when its list really changed.
  - **Status line of its own:** "Updated 5m ago • 3 new since 8:47 AM" (`.brief-header-status`) is always one line tall. It used to share the badge's wrapping row, so it could never move the page, even at the top.
  - **The return from a story:** the kept page gets its scroll first and is then brought up to date, so stories leaving above your place are made up for exactly. `returnToBrief` lands it before it is drawn, with no late +60ms correction and no rAF re-assert on the kept path.
  - **Removed:** `briefKeepInPlace` (unused since 321), the in-page Undo row and its `is-just-marked` state and styles, and the `prebuilt` brief parameters.
  - **Checked at 339px:**
    - Mark N read: all movement is the slide, finished by ~320ms, and nothing moves at the 5-second mark.
    - Undo: the screen is identical to before the tap.
    - Another device's read on screen: it dims in place, and goes after scrolling with the screen held, apart from sub-pixel rounding.
    - Status line and same-list cloud settings at the top: nothing moves.
    - A broken picture on screen: it waits, and goes off-screen with nothing moving.
    - Read dot: it slides.
    - Story → Today: in place on the first frame.
- **"Mark N read" closes up instead of jumping (321, on request: "jumping after tapping Mark X Read ... it is annoying"):**
  - **Measured at 339px:** the row was held under your finger (`briefKeepInPlace(end)`) while the stories above it left. The page scrolled back 1,094px in one frame, so everything above the row became the previous section's stories, ones already passed. 5 seconds later, when the emptied section went, `briefKeepInPlace(next)` held the next section and older stories slid in at the top again (87px).
  - **Now it closes up toward the top:** the section's heading moves to where Today's first line sits at rest. That is the scroller's top padding, below the status bar on the phone; the section's `scroll-mt-20` isn't in the compiled Tailwind and gives 0. "Marked N read · Undo" sits under the heading, and what follows slides up beneath (`briefSlideUp`: a 0.24s transform, skipped for Reduce Motion). When the 5 seconds end, the next section closes up under whatever is above it. Undo puts the screen back exactly as it was before the tap.
  - **`keepTodayInPlace` anchors** (the 320 rule) are now the first section heading, story card or Mark-read row on screen. They used to be story cards only, so when a heading or row at the top went, the rule held the next section's first card and pulled older content in above. Today's own header is never the anchor, since its growth is what must be absorbed.
  - **Checked at 339px:** with the test "does anything that was above the screen come back?", five cases passed: a long section, a short section fully on screen, the folder check in a heading, the first section near the top, and a single Read dot. The only exception is a sliver under the status bar above the landed heading. The 320 checks still pass: header growth, a story leaving above, the return trace. The folder check and the Read dot close up instantly, with no slide.
- **Today holds still after you come back (320, on request: "a jump 3-5 seconds after coming back"):**
  - **Reproduced first:** the app was driven at phone width (headless Edge over the DevTools protocol, a throwaway profile with the 65 followed feeds, scripts in the session scratchpad). It recorded every change to `#article-body`, every scroll and every write to the reader's scroll position, from the Today tap for 10-15 seconds.
  - **Bug in 317-319:** leaving Today read the reader's scroll AFTER detaching the page, when the empty reader scrolls to 0. So Today came back at the top for ~130ms until `returnToBrief` moved it into place (traced). The scroll is now read first, and the page is back in place on the first frame.
  - **The 3-5 second jump:** at the iPhone's width (339px CSS at 115% Page Zoom), the header's status line wraps to a second row when "• Updating…" becomes "• Updated just now". Measured: the header grows from 107 to 126px and every story moves down 19px, at the end of a refresh, which in the usual flow (open the app, read a story, come back) lands a few seconds after the return. "N new since" and the once-a-minute "Updated 1m ago" can do the same.
  - **One rule for all of it:** `keepTodayInPlace(fn)` keeps the first story card on screen at the same height across any change. It holds only if the page isn't at the very top, and lets go when that card itself leaves, so a story read on screen still closes up. `syncBriefCards` (stories leaving, counts, "N new"), `updateTodayStatus` and the late-picture handlers (`briefImgLoaded` / `briefImgFailed`) all run through it. Native scroll anchoring is still off for briefs, and iOS Safari has none.
  - **Checked at 339px:** the header grew 107→126px and the first story stayed put (scroll compensated by 19px). A 198px story leaving above the screen: first story stayed put. A story marked read on screen: the next one moved up into its place, as before. At the top: nothing held.
- **Faster refresh on open; a database that stops growing (319, on request):**
  - **Measured first (2026-10-06):** 65 followed feeds (34 RSS, 31 Bluesky) timed through the Worker from the PC: every feed answers in 0.5–1.4s, except BleepingComputer, which the Worker cannot reach (Cloudflare `error code: 1106`, 0.6s) and whose allorigins fallback then times out (7.6s), on every refresh. Simulated on those times, the phone (3 at a time) took about 28s and the desktop (6 at a time) about 18s.
  - **Slow lane:** feeds flagged slow no longer wait at the back of the queue, where their timeouts were added to the end of every refresh. One extra worker takes them from the start, beside the normal pool; pool workers help with any left, and the lane never takes a healthy feed. Simulated: phone about 21s, desktop about 11s.
  - **One save per refresh:** `fetchBlueskyArticles` no longer saves the whole article store after each feed (31 extra full saves per refresh). The batch saves once at its end, as it already did for RSS.
  - **Fetch at once on open:** the startup fetch no longer waits 1.5s for the Firestore snapshot. The local feed list is the synced list from the last visit, and the snapshot still fetches again only when it brings different feeds (the first open after changing feeds on another device).
  - **Database v6:** Edge's copy was 121 MB. Read from a copy of its files: 1,139 articles took 1.8 MB, History (943 read articles, 30 days) 4.6 MB, but ~416,000 stale entries in the articles store's `timestamp` and `feedUrl` indexes took 87 MB, and 27 MB was old copies awaiting compaction. Nothing read those indexes (`unread` / `readLater` held nothing: booleans are not index keys). The upgrade deletes all four, and the retired `briefs` store with them (`clearRetiredBriefs` is gone). An open connection now closes and reloads when a newer build upgrades the database (`onversionchange`), and a blocked upgrade asks you to close other tabs. Safari stores IndexedDB differently, so the phone is not expected to have the same build-up; the new Storage line shows it.
  - **Storage line:** the Settings footer reads "RSS Reader · build N · X MB stored" (`navigator.storage.estimate()`), updated each time Settings opens.
  - **Feed health record:** keeps only followed feeds (it kept removed feeds for good).
  - **Found, not changed:** the service worker never registers. Browsers reject a `blob:` script URL for a service worker, and Edge has no registration or cache for the site, so the app has no offline cache (and none to clean up).
- **No new-story dot (318, on request):** the accent dot before a new story's source (313) is removed, with its CSS and the card's `is-new` class. Today's heading still says "N new since <time>", counted by `syncBriefCards` from each card's `data-first`.
- **The Today tab returns to your place every time (317, on request: it "failed half the time"):**
  - **The cause:** returning to Today rebuilt the whole page and set the scroll about 60ms later. Every rebuilt picture then finished loading at its own moment and changed the layout: a top picture too small for the hero became a thumbnail (about 150px shorter), and broken or tiny ones were removed. Whether you landed in place was a race. A second tap during the slow rebuild then went through `openToday`, which starts at the top.
  - **Today stays alive:** opening a story from Today on the phone detaches Today's page as it is (`window._todayKept`: the nodes, the brief object, the scroll). Coming back puts the same page back at the same scroll (`_todayRestored`). Nothing reloads and nothing moves. `syncBriefCards`, `updateBriefStoryActionButtons` and `updateBriefMarkReadButtons` bring it up to date, so the stories you read leave and the next unread sits where the tapped story was. The same-height adjustment from build 301 still runs and is now exact. It is usually 0px, and moves only when stories above the tapped one left too (you swiped back to them). Today is rendered afresh only when its brief object changed meanwhile (`openToday`, a rebuild).
  - **Pictures drawn in their final form:** `briefImgLoaded` / `briefImgFailed` record each picture's verdict by URL (`window._briefImgVerdict`: bad, thumb, ok). A rebuilt Today leaves out known-bad pictures and never makes a known-small one the hero, so a rebuild no longer shifts as pictures load.
  - **A quick second tap:** within a second of the return, a second tap on Today is ignored. Before, it threw your place away.
- **Listen player with Pause / Resume (316, on request):**
  - **The player:** the floating control became a player (`#tts-player`): "Listening" / "Paused", ⏸ Pause or ▶ Resume, and ■ Stop. It is visible for the whole session.
  - **Pause and resume:** they are the app's own. `_ttsIndex` follows the sentence-sized piece being spoken (utterance `onstart`); Pause cancels the queue, and Resume re-queues from that piece. `speechSynthesis.pause()` is unreliable on iOS. A run token makes a cancelled queue's late events harmless.
  - **Phone:** locking or leaving the app pauses (no longer stops), and it stays paused on return.
  - **Wake lock:** held only while playing.
- **Stop listening control; no restart after locking (315, on request):**
  - **Stop control:** while Listen speaks, a "■ Stop listening" pill (`#tts-stop-pill`, `body.tts-on`) floats at the bottom center. On desktop it is fixed; on the phone it is absolute in the pixel-locked body just above the tab bar, and stays when the bar slides away.
  - **Phone, hide ends Listen:** on the phone, hiding the app (side button, app switch) now ends Listen. iOS only paused it, so unlocking restarted it.
  - **Desktop:** keeps reading in the background.
- **Screen stays awake while Listening (314, on request):** iOS stops the app's speech when the screen auto-locks. A Screen Wake Lock (`ttsSetAwake`, driven from `updateTTSButton` after every start, end, error and stop) is held only while Listen speaks, and re-taken on return if the browser dropped it while the page was hidden. A manual lock (side button) still stops speech. Continuous playback while locked would need real audio from a TTS service, which was not added (no new services).
- **New since your last visit (313, on request):**
  - **First-seen stamp:** every article now carries `_firstSeen`, the time this device first fetched it. It is carried across refreshes by link and saved with the article.
  - **The visit boundary:** `_visitBoundary` is when you last left the app (saved on every hide and on pagehide). It moves on when you return after more than 5 minutes.
  - **What counts as new:** a Today story whose earliest copy arrived after the boundary (`data-first` = the minimum over its grouped copies, so an outlet joining an old story does not make it new).
  - **What shows:** a small accent dot before the source (removed in 318), and Today's heading says "N new since 9:14 AM". Both are maintained by `syncBriefCards`, so they update without a rebuild.
  - **First session:** articles cached before 313 have no stamp and never count as new.
- **Listen on the phone, and Listen to Today (312, on request):**
  - **Phone:** gets a Listen button in the story row under the headline (`#listen-action-btn`, before Share; desktop keeps the top-bar one).
  - **Listen to Today:** Today's heading has a Listen button on both devices. It reads the stories Today is showing now (`todaySpokenText()` reads the page, so read and muted stories are left out). The composed `spokenText` it used kept stories read since.
  - **Speech:** queued in sentence-sized pieces (`ttsChunks`, no regex lookbehind for older iOS Safari). Every Listen button reflects the state.
  - **No interruptions:** a Today rebuild no longer stops Listen to Today, and the auto-rebuild after a refresh waits (pill instead) while Today is being read.
  - **iOS limit:** speech stops when the screen locks.
- **Muted words (311, on request):** Settings > Muted words (add / remove chips; synced via `uiPrefs`).
  - **What is hidden:** a story whose headline or first 300 summary characters contain a muted word or phrase (whole words, any case, Unicode-aware; `mutedTerm()` / `isMuted()`, cached per article per list version) is hidden from Today and from the Unread / folder / feed lists, and left out of every unread count: the total and badges, feed counts, and folder counts.
  - **Where it still shows:** Saved, Read Later, History and Search.
  - **Not silent:** Today's heading shows "N muted · Show"; Show reveals them for the session, tagged "Muted: word" on the card.
- **Folders in Today (310, on request):** Settings > Today > Folders in Today shows one chip per folder; tapping one leaves it out of Today (`window._todayExcluded`, `buildTodayBrief` skips its articles), and it stays under Following. Saved per account: localStorage plus the cloud `uiPrefs` doc, whose save is now a merge so fields added later are never wiped by a save that omits them.
- **Same-story matching uses summaries and pairs (309, on request):** with 55 unread stories nothing was grouped, and outlets reword headlines. Measured on 347 live headlines from 19 outlets (2026-10-05):
  - **Old matcher:** 8 cross-outlet stories, no wrong merges. It missed rewordings, and groups split by arrival order because an article joined the first group whose lead headline matched.
  - **New rule:** two articles also match when they are within 24h, share 2+ headline names, and their headline plus the first ~40 summary words share at least `BRIEF_SUMMARY_JACCARD` = 0.25 of their words. Stories are groups of connected pairs (union-find), and the lead is the most authoritative outlet, then the newest.
  - **Result:** 10 cross-outlet stories (Hastert 10 articles from 7 outlets, Supreme Court climate 5, Verge + MacRumors), no wrong merges. 0.20 began merging different stories. The shipped function was re-run on the same data and gave the same 10.
- **Stories grouped across folders; "Also from" readable; larger icons (308, on request):**
  - **Grouping:** `buildStoryClusters` now clusters the whole pool at once (it was per folder, so one event in Headlines and Business showed twice and never as one multi-outlet story). Each story is filed under its lead outlet's folder. `isSameStory` is only tried against clusters whose lead shares a proper noun (`byProper` index), since it needs two shared proper nouns anyway; the matches are the same as an all-pairs test without the quadratic cost. Doc-frequencies are now over the whole pool.
  - **"Also from":** the note now has its own line under the summary ("Also from Reuters, AP", up to 4 names + "and N more", wraps). It sat at the end of the source line, where its intended `max-w-[160px]` was never compiled, so it was squeezed to a few letters.
  - **Icons:** story action icons are 18px in 32px buttons (were 15px in 26/30px). Share is last in both the card row and the reader row.
- **Desktop Today follows App Zoom (307, on request):** `#today-column` took its base size from the reader's Body Size (`--view-font-size`, since 268), so App Zoom did nothing to desktop Today and Body Size resized all of it. It now uses `calc(16px * var(--app-zoom))`, like the phone's Today in `#reader-view`. Article Title Size, Preview Text Size and the source size scale from that base on both devices, and a brief never follows Body Size.
- **Today knows how current it is (306, on request):** at launch Today showed the cached stories, the startup refresh fetched in the background, and Today was never rebuilt with what it brought. Nothing on the Today screen said whether it was current.
  - **Heading line:** Today's heading now shows "• Updating…" while any refresh runs and "• Updated 5m ago" after (`updateTodayStatus`, `[data-today-status]`; ticks every minute).
  - **New stories:** after the last queued pass of every refresh, `checkTodayForNewStories()` builds Today afresh and counts stories whose lead and grouped copies are all absent from the current Today.
  - **Not reading yet** (Today on screen, scrolled under 40px, no story open): Today is rebuilt in place.
  - **Reading:** a "↑ N new stories" pill (`.today-new-pill`, hosted by `#timeline-pane` on desktop or `#viewer-pane` on the phone) appears at the top of Today; tapping it rebuilds Today and goes to the top. Every rebuild clears the count.
- **Cloud read marks kept on the device (305):** each launch showed e.g. 17 unread, then 2 about 20 seconds later, every launch. Read state from other devices arrives as hashes (`_readHashes`) in the Firestore snapshot and was held only in memory. A link matched by hash was rehydrated into `_readLinks` in memory but never saved. So every launch started from the device's own read list, until the snapshot landed. Build 303 widened this, because the restore now keeps unread articles up to 4 days old (by the local read list). `persistReadHashes()` now saves the hash set to IndexedDB metadata `readHashes` (debounced) after every snapshot that adds marks, and `initApp` loads it before the article cache is restored and counted.
- **Desktop Refresh shows its result (304, on request):** the header Refresh button ran a full refresh with no visible sign: no spinner, refresh toasts are off by preference, and the Today column was never rebuilt because `refreshUI` leaves an open brief alone. `refreshAll()` now spins the button until the refresh and any queued pass finish, then rebuilds the Today column in place (`renderTodayColumn`, scroll and open story kept), like the phone's pull-to-refresh. The automatic refresh still leaves Today untouched, so nothing reshuffles while you read.
- **Unread kept for 4 days (303, on request):** `RETAIN_UNREAD_MS` is 4 days. `restoreArticleCache` keeps unread articles to the same horizon (read ones still 2 days, Read Later always), so a restart no longer cuts retention short. Today's own window stays 24 hours.
- **Unread stories kept for 48 hours (302, on request):** each refresh replaced a feed's articles with what the feed serves now (newest 20 for RSS, the current page for Bluesky), so unread stories from busy feeds vanished from Today, Unread, the folders and the badge before they were seen. Swiping onto one in an open Today gave "Article not found in local cache".
  - **Retention:** `retainedUnread()` / `restoreRetained()` in both fetch paths keep an unread story until it is read or turns 48 hours old, the same horizon the startup restore already used.
  - **Store mirrors memory:** the `articles` IndexedDB store had never been pruned. It held every article fetched since install, startup read all of it to keep 2 days' worth, and dropped stories reappeared for a session after each restart. `bulkPutArticles` now deletes stored articles not in the saved set (only after a successful restore, `_articleCacheRestored`). The saved set is the 2000 newest plus every unread or Read Later article.
  - **Navigation:** Today navigation steps over stories no longer in the app; those can now only be read ones whose feed moved on. `readerNext()` counts only stories that exist, and `readerArticleById()` is shared with `openArticleInReader`.
- **Tabs replace the phone's reader top bar (301, on request):** the phone (≤900px) has no reader top bar; its only control was Back.
  - **Today tab** from a story opened in Today calls `returnToBrief()`, which now lands the next unread story at the same screen height as the tapped one (`cardTop` in `_returnToBriefState`; it was centred). Today again rebuilds Today at the top.
  - **Following tab**, one level per tap: story opened from a list → that list at the article (`setMobilePane('timeline')`) → folders → their top. Back from a list story used to jump straight to the folders.
  - **Automatic full screen:** stories start just below the status bar. While a story scrolls down, the tab bar slides off (`body.tabbar-tucked`, transform only, so the bar's pixel-locked anchor is untouched). A scroll up of more than 8px, being near the top or reaching the end brings it back.
  - **Full screen with the exit button** is now desktop-only (double-click the bar); crossing to phone width leaves it.
  - **Removed:** the phone double-tap detector, the phone bar and Back-size rules, the in-bar hide list, the phone full-screen rules, and the mobile branch of `onViewerBackClick`. Desktop is unchanged.
- **Tighter story header (300, on request, everywhere not only full screen):** title → author 24 → 12px, author → action row 10 → 6px, action row → divider 14 → 8px, divider → first paragraph 28 → 16px (empty space 76 → 42px). Above the story: desktop 24 → 16px, phone 14 → 8px below the top bar (status bar + 8px in full screen). The 32px action buttons, the source → title 8px and the title's line spacing (follows Line Height) are unchanged.
- **Phone list starts below the status bar again (299):** Following → a folder or Unread showed the first card with its source line and title hidden under the clock. Build 264 moved the list's status-bar offset onto a category chip bar above it and cut `#timeline-pane.mobile-active #article-list` padding to 8px; build 266 removed that bar but left the 8px. The list's own `max(safe area, 50px) + 16px` (the pre-redesign value) is restored.
- **Bottom bar 56px (298, on request):** 52px (296) was too small. The pill is now 56px tall with 5px / 4px padding; icons stay 20px and labels 13px. That is about 64pt under the 115% page zoom and 56pt at 100%, with 46px tap targets. Offsets that clear the bar now sit 6px below their originals:
  - List and reader end room: 90px.
  - Shared end room: 94px.
  - Search sheet: 64px.
  - Today end room: 114px.
- **‹ › buttons removed everywhere (297, on request):** the Previous / Next buttons (`#reader-nav`, builds 283–289) are gone, in normal reading too (294 had only taken them out of full screen). Moving between stories: swipes on the phone, j/k and Up/Down on desktop, Left/Right in full screen (Right still returns to Today after a brief's last story, via `readerNext()` / `readerNextOrBack()`). Code that only served the buttons went with them: `readerHasPrev`, `updateBriefReturnUI` (selectArticle now calls `syncBriefCards` directly), `hideBriefReturnUI` and its six callers, and their CSS and end-room padding. The full-screen exit button stays, now styled on its own.
- **Shorter bottom bar (296, on request):** the pill is 52px tall (was 62), with 4px padding (was 6) and 20px icons (was 22); labels stay 13px. That is about 60pt under the 115% page zoom and 52pt at 100%, still above the classic 49pt tab bar, with 44px tap targets. Every offset that clears the bar moved down by the same 10px:
  - List, reader and sidebar end room: 96/100 → 86/90px.
  - ‹ › controls: 90 → 80px.
  - Search sheet: 70 → 60px.
  - Story and Today end room: 150/120 → 140/110px.
- **Arrow keys in full screen (295, on request):** ↑ / ↓ scroll the story (48px steps on `#reader-view`, which the browser default would not scroll) instead of moving between stories; ← / → move to previous / next. The shortcuts sheet lists it.
- **One full screen, no arrows (294, on request):** full screen is now only the clean mode. Double-tap or double-click the top bar to enter; inside are the story and the exit button (bottom left), with no ‹ › arrows. Esc, arrow keys and swipes work as before. Removed: the top-bar full-screen icon (`#fullscreen-btn`, `icon-expand`), `toggleReadingFullScreen`, the `fs-clean` variant, and the full-screen unread badge on › (287), which had no host without the arrows. Outside full screen the ‹ › buttons and the Today tab badge are unchanged.
- **Clean full screen (293, on request):** double-tapping (phone, timed taps on the bar's empty part) or double-clicking (desktop) the top bar enters full screen without the ‹ › arrows (`body.fs-clean`). The exit button stays bottom left, since the bar is hidden in full screen; arrow keys and swipes still move between stories. The top-bar icon still gives full screen with the arrows.
- **Dead-code cleanup (292, on request):** about 670 lines removed after a scripted scan. The scan listed JS names nothing references, CSS ids and classes no element can carry, and lookups of ids that never exist; each candidate was then checked by hand. Removed:
  - **JS:** `renderTopicsBar` / `renderSavedBar` (their bars no longer exist), the `getCategoryUnreadCount` wrapper, the `markCategoryFolderRead` / `markAllBriefCategoriesRead` / `onTopicsTabClick` / `onArticlesTabClick` / `onSavedTabClick` aliases, and the sticky-toast path (`hideToast`, `_toastSticky`; no caller passes `sticky`).
  - **Never visible:** the in-article "Back to Brief" banner and footer with `syncBriefArticleActionButtons` (hidden on mobile, never set on desktop), and the old `#mobile-reader-bar` (always hidden; ‹ › replaced it).
  - **CSS:** 41 rules for removed or never-existing elements, dead selectors trimmed from 16 shared rules, 2 emptied `@media` blocks, and their orphaned comments.
  - **Kept (not dead):** `warmPrimaryProxy` / `lockMobileLayoutHeight` (self-running), `opml-import` (opened from markup), `settings-panel-*` (dynamic ids). The compiled Tailwind block was left as built.
- **Icon-only ‹ › (289, on request):** Next is a round › like Previous. After a brief's last story it shows the Today tab's sun and returns to Today. In full screen the unread total is a badge on its corner, in the Today tab badge's style. Titles and aria-labels carry the words.
- **Previous + arrow keys (288, on request):** a round Previous button (‹) sits left of Next (`#reader-nav` holds the pair; `readerHasPrev()`, `navigateArticle(-1)`), on phone and desktop, shown only when there is something before the open story in its brief or list. In full screen, Right arrow = Next (including Back to Today) and Left arrow = Previous; the shortcuts sheet lists both and Esc.
- **Unread count in Next (287, on request):** in full screen the Next pill reads "Next · 41" (or "Back to Today · 12"): the same total unread as the Today tab badge, which full screen hides. `updateBadges()` now drives both the badge and this count (it runs after every read-state change, opening a story included); the badge's own updater, which only ran on list renders, was removed.
- **Next for any story (286):** Next (`#reader-next`, `readerNext()`) now follows the same choice as j/k / `navigateArticle()`: the brief's next story when the story came from Today ("Back to Today" after the last), else the next article of the list it came from (Unread, a folder, Saved, Read Later, History), hidden on the list's last article. Stories opened from a list had no Next, which in full screen (list hidden) left only j/k.
- **Unread badge on Today (285, on request):** the total-unread badge moved from the Following tab to the Today tab (same count, same 99+ cap).
- **Reader bar alignment (278):** build 271 assumed the article column had `md:ml-4` / `lg:ml-8`, but those classes are not in the compiled CSS. The bar is now padded to the column's real edges (1rem / 1.5rem + 42rem). Category pills are regular weight.

### Phase 6: Imagery (Builds 290–291)
- **Thumbnails:** every Today story with a picture shows a 72px square thumbnail on the right (cropped to fill), with the text wrapping beside it; stories without one stay full-width text. The picture is the story's `article.image` (feed attachment, media:thumbnail/content, or first body image), else one from the grouped copies (`briefStoryImage()`).
- **Placement (291, on request):** the thumbnail sits after the source / time line, so that line keeps the full width (it had been squeezed and the source name cut). The picture sits beside the headline and summary. A hero demoted to a thumbnail moves there too.
- **Hero:** the first story with a picture in the first section (Top Stories) gets a full-width 16:9 image above its headline.
- **Guardrails:**
  - Images are lazy, so they load only near the screen.
  - Boxes are reserved with a faint fill, so nothing jumps.
  - A failed or tiny picture (<100x60: icons, emoji, tracking pixels) removes its box.
  - A hero under 600px wide becomes a thumbnail.
  - Avatar URLs are never used, which covers profile pictures from Bluesky, Mastodon and Gravatar.
  - Tapping a picture opens the story; the reader's image lightbox ignores Today pictures.
  - On a phone, `!important` sizing beats `.article-content img`.
- **Setting:** Settings > Today > Show images (on by default, per device, `newsreader_today_images`). Off hides the boxes, and hidden lazy images are never fetched.

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
| **6. Imagery Refinements** | Story thumbnails + hero image for the lead Top Story | **Completed** (Build 290) |

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
