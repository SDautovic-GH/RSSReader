# Today — User Guide

| Metadata | Value |
| :--- | :--- |
| **Product** | Today (formerly RSS Reader) |
| **Live App** | [today.dautovic.com](https://today.dautovic.com) |
| **Build Target** | Build 471+ |
| **Documentation Type** | Comprehensive User Manual |
| **Last Updated** | November 2, 2026 |

---

## 1. Welcome to Today

**Today** is a private, calm RSS reader and newsletter reader designed for mobile and desktop workstations. Instead of forcing you to swim through endless unread lists, Today presents a structured daily intelligence workspace of unread stories published in the last 24 hours, categorized strictly by your chosen folders.

Today is a visual magazine card deck that clusters multi-outlet coverage into clean cards, in 1, 2 or 3 columns. Nothing you read is sent to an AI service.

---

## 2. Getting Started

### 2.1 Opening & Installing
* **In the Browser:** Visit [today.dautovic.com](https://today.dautovic.com).
* **Install on iPhone / iPad:** Tap Safari's **Share** button $\rightarrow$ **Add to Home Screen**.
* **Install on Desktop (Edge/Chrome/Safari):** Click the install icon in the address bar $\rightarrow$ **Install Today**.

### 2.2 Accounts & Multi-Device Sync
1. Open the app and sign in with your email and password.
2. If you are a new user, click **Create Account**. Your account gets an independent, private space in the cloud.
3. Once signed in, all your feeds, folders, read states, and starred stories synchronize seamlessly between your phone, tablet, and desktop.

---

## 3. Navigating Today

### 3.1 The Unified 2-Pane Workstation Experience (Desktop)

Today replaces the cramped 3-pane layout entirely with a unified, modern **2-Pane Workstation Architecture** across all folders, feeds, and smart views:

```
+---------------------------------------------------------------------------------------+
|  UNIFIED 2-PANE WORKSTATION (Unread, Personal Hub, Folders & Feeds)                   |
+-------------------+-------------------------------------------------------------------+
|                   |  [Action/Mark Read]      [Centered Switcher / Count]       [Acts] |
|                   +-------------------------------------------------------------------+
|  Sidebar (240px)  |                                                                   |
|  - Today (Active) |                      Centered Cards Grid / Canvas                 |
|  - Unread         |                     (Jump Bar: Categories or Feeds)               |
|  - Read Later     |                     (Cards Deck: 1, 2, or 3 columns)              |
|  - Saved          |                                                                   |
|  - History        |                                                                   |
|  > Subscriptions  |                                                                   |
+-------------------+-------------------------------------------------------------------+

+---------------------------------------------------------------------------------------+
|  FOCUSED STORY READING MODE (Sidebar + Centered Reading Canvas)                       |
+-------------------+-------------------------------------------------------------------+
|  Sidebar (240px)  |  [< Back to Source]                         [Nav]  [Share] [Star] |
|  - Today          +-------------------------------------------------------------------+
|  - Unread         |                                                                   |
|  - Read Later     |                      Full Article Reader                          |
|  - Saved          |                  (Centered Editorial Canvas: 760px)               |
|  > Subscriptions  |                  Title, Byline, Hero Image, Clean Content         |
+-------------------+-------------------------------------------------------------------+
```

#### Today's Cards
* **Category Cards:** 
  Presents your stories grouped into **unified Category Cards** (one clean card container per folder), eliminating the visual noise of dozens of fragmented boxes.
  - **Inline Story Controls:** Each story row features direct quick controls on its source line: **Mark Read** (checkmark icon with a smooth dismiss collapse animation) and **More options** (`...`), which has Read Later, Save, Share and Open Original.
  - **Immediate Unread-Only Triage:** As soon as you mark a story read in Today or Unread, it animates and immediately vanishes from view so only unread stories are visible.
  - **Auto-Disappear on Return:** When you open a story in the reader and return via Back, `b`, or `Escape`, the story you just read disappears immediately, and the next unread story takes its place at the same height on the screen. Categories with zero unread stories cleanly hide.
  - **Columns:** Choose between 1, 2, or 3 columns in **Settings → Reading & Display**.

#### Personal Hub Cards Workstation (`Read Later`, `Saved`, `History`)
* Clicking `Read Later`, `Saved`, or `History` in the sidebar opens into the full-width cards workstation in `#today-column`.
* On a computer you move between them in the sidebar; on the phone a sticky 3-way switcher sits at the top: `[ 🔖 Read Later ] [ ⭐ Saved ] [ ⏱️ History ]`.
* **Durable Story Preservation:** Unlike the unread inbox, stories in your Personal Hub are permanent reading lists and archives. Stories remain visible regardless of read state and are never auto-hidden by background sweeps.

#### Unread, Subscription Folders & Single Feeds
* **Unread:** Today and Unread are one view. Unread at the top of the sidebar opens Today: Top Stories first, then your folders' unread stories, with the Category Jump Bar (`[Top Stories] [Technology]...`), Mark Read and Undo.
* **Subscription Folders (`setCategoryFilter`):** Opening any folder (e.g., `Technology`) partitions the stories by **Publication Source** (`Ars Technica`, `The Verge`, `Wired`), complete with Outlet Jump Bars to hop directly between news sources.
* **Single Feeds (`setSourceFilter`):** Displays a focused cards stream for that publication with *"Mark Feed Read"*.

#### Push-and-Return Story Flow
* When you click any card in any view, the story opens in a focused 2-pane reader canvas (`desktop-today-story`), centered at 760px with a prominent `< Source` back button in the header reflecting where you came from (`< Unread`, `< Technology`, `< Ars Technica`, `< Saved`, etc.).
* Tap Back, press `b`, or press `Escape` to return to Cards view. The read card is centered smoothly and pulses gently into place.
* Story pages leave out the original site's own buttons and player menus (for example NPR's "Toggle more options", Download and Embed); a Listen link to the audio stays.

#### Reading Beside the List
* Under **Settings → Stories → Open stories**, choose **Beside the list** to read with the list still on screen: the story opens to the right and the list keeps its width (drag the divider between them to change it).
* The card you clicked stays where it was on the screen. Stories you read while the reader is open stay in the list, dimmed, so nothing moves under the pointer; they leave when you close the reader (Back, `b` or `Escape`).
* `j` / `k` open the next or previous story in the list; the list scrolls only when that story's card starts out of view.
* **Full page** (the default) opens each story on its own, as before.

#### Collapsing the Sidebar
* Press `[`, or click the app logo at the top left (it shows a panel icon when you point at it), to fold the sidebar into a narrow rail. The rail keeps Unread, Read Later, Saved and History as icons with short labels under them, and Refresh and Settings stay at the bottom, where they also sit when the sidebar is open; press `[` or click the logo again to open it.
* Unread keeps its count on the rail, as a small badge under the icon. Read Later and Saved show no count; they dim when empty.
* Today remembers the choice on each device.

#### The Jump Bar (Desktop)
* The jump bar under Today's heading takes you straight to a section. When its categories don't all fit, ‹ › arrows at its ends scroll it, or scroll it with the mouse wheel.
* The highlighted category is the one you're reading: it follows you as you scroll.

#### Triage from the Keyboard (Desktop)
* In any card view (Unread, a folder or feed, Read Later, Saved, History), press `j` / `k` to move a highlight from card to card; the page scrolls only when the card isn't fully on screen.
* On the highlighted card: `Enter` opens it, `r` marks it read (the highlight moves to the next card), `s` saves it, `l` adds it to Read Later, `o` opens the original site. `Esc` lets go of the highlight.
* `Tab` also reaches every headline; `Enter` on a focused headline opens it. The highlight shows only while you use the keyboard and goes when you use the mouse.
* After a story, Back (`b` or `Esc`) returns the highlight to the card Today lands on.

#### Cards: Top Stories and Balanced Columns
* **Top Stories** runs across the full width of the deck, its stories flowing down the columns.
* The folder cards below fill the columns in order, each going to the shorter column, so a short folder beside a long one leaves no empty block. They keep their places while you read; they are laid out again only when the number of columns changes (window width, Cards View Columns, or opening a story beside the list).

#### Persistent Simultaneous Centering
* As you resize your desktop browser window (e.g. side-by-side split screen or tiling next to your code editor):
  * The top bar switcher and the body content below it remain **mathematically locked to the exact center** (`50%` of the pane width).
  * The header **never disappears or collapses**, and the mobile phone tab bar never intrudes on desktop.
  * With a mouse, the desktop layout (sidebar and headers) stays at every window width, down to a narrow half-screen window; at 1000px and below the cards drop to one column.
  * The sidebar keeps the same place in every view, so opening a story never slides it sideways.

#### Wide Screen & Ultrawide Layout
* On wide or ultrawide monitors ($> 1720px$ width, such as 1440p, 4K, or 34-inch/49-inch ultrawides), Today integrates seamlessly with the browser window at 100% full bleed—without artificial outer letterboxing bars or black margins.
* Rather than scattering header controls across multiple thousands of pixels, Today centers the header controls directly above the content reading canvas:
  * **Today Cards View:** `Mark Read` aligns with the left edge of card column 1, and `Search` aligns with the right edge of the card deck.
  * **Story View:** Back button aligns with the left margin of the reading text, and the article toolbar actions align with the right margin.
* This eliminates the neck-straining "tennis match" effect where controls are stranded thousands of pixels away from the reading column.
* You can switch between **Centered Content (Recommended)** and **Full Width Stretch** (the sidebar stays at the left and the cards fill the window) under **Settings → Appearance → Wide Screen Layout**.

#### Unified Workstation Canvas & Visual Rhythm
* **Single Surface Canvas:** The left sidebar and right cards/reading canvas share an uninterrupted single background color (`#0d1117` in dark mode, `#ffffff` in light mode). Vertical dividing lines between panes are eliminated, yielding a calm, unified digital workstation.
* **Continuous Hairline Divider:** A subtle horizontal hairline divider spans edge-to-edge (0px to 100vw) across the full width of both the sidebar and content pane directly beneath the 73px header.
* **Synchronous 24px Top Padding:** Both the sidebar list items and the main cards grid align with identical `1.5rem` (24px) top padding beneath the header hairline, delivering optical harmony across panes.
* **Floating Centered Jump Bar:** Category navigation capsules float vertically centered between the header hairline and the category cards, with the bottom border divider removed for a lighter, distraction-free appearance.
* **Native macOS Scrollbars:** Dark mode communicates native color schemes (`color-scheme: dark`) to the browser, rendering native macOS translucent gray floating scroll pills anchored to the far right screen edge.
* **Socials Repost Attribution & Context:** A Bluesky repost starts with a repost icon and "Reposted by" the account you follow; the line under it names the person who wrote the post. Both lines are the same size, set by Text size & zoom. Quoted posts and replies display parent context cards directly below the post.
* **Triage Breathing Room:** Category cards feature generous vertical separation, and the "Mark All Read" action maintains a 36px top margin to prevent visual crowding against cards.

### 3.2 Mobile Interface
* **The Floating Bottom Tab Bar:** A detached floating glass capsule (YouTube-style, 42px compact height) with four pure-icon tabs:
  * **Today:** Your curated 24-hour brief with a live unread badge counter. **Smart Tap:** When scrolled down, tapping Today smoothly scrolls you to the top.
  * **Library:** Dedicated exclusively to managing your Folders & Subscriptions (clutter-free, without redundant smart feed lists).
  * **Bookmarks (Personal Hub):** 1-tap access to your reading queue with a sticky 3-way segmented control at the top of the timeline: `[ 🔖 Read Later ]  [ ⭐ Saved ]  [ ⏱️ History ]`. Tapping the Bookmarks tab cycles between these views or scrolls to the top.
  * **Search:** Instant full-text search across all saved, unread, and archived stories.
  * **Visual Style:** YouTube-style ultra-translucent frosted glass capsule (`-webkit-backdrop-filter: blur(20px) saturate(180%)`) with GPU acceleration, a soft translucent tint (`rgba(18, 18, 22, 0.25)`), an elevated inner capsule highlight around the active tab, and a pure bright white icon (`#ffffff`). Zero text clutter.
* **Back to the Top:** After you tap a category in the jump bar, a **Top** button appears at the bottom right (on a computer, an up arrow just right of the stories, mirroring the sidebar's Settings button on their left). Tap it to go back to the top; it goes away once you're at the top. The jump bar highlights the category you're reading as you scroll.
* **The Source Line:** On the phone each story starts with its source or author and a short time ("19h", "3d", "now"), leaving the name as much room as possible; on a computer the time reads "19h ago".
* **Mark Read on Every Story:** The checkmark sits on each story's source line next to `...`, in Today and in lists. Tap it to mark a story read (Undo appears for 5 seconds, as after a swipe). Read Later, Save, Share and Open Original are in the `...` menu. Swiping still works.
* **Header Controls:**
  * **Headphones Icon:** Tap to have Today read your brief aloud using text-to-speech. On the phone it plays through the speaker even in Silent Mode; on a computer it uses the computer's own voices, so the text stays on your device.
  * **Status Line:** Displays synchronization status (e.g., "Updated just now • 4 new").
  * **New Stories Pill:** When new stories arrive during reading, a blue pill appears ("3 new stories"). Tap it to refresh without interrupting your current scroll position.

---

## 4. Keyboard Shortcuts Reference

| Shortcut | Context | Function |
| :---: | :--- | :--- |
| `t` / `T` | Anywhere | Jump directly to Today |
| `[` | Desktop | Show or hide the sidebar (rail) |
| `j` / `↓` | Cards / Reader | Cards: highlight the next card; Reader: next story |
| `k` / `↑` | Cards / Reader | Cards: highlight the previous card; Reader: previous story |
| `Enter` | Cards | Open the highlighted story |
| `b` / `B` | While reading a story | Return to Today |
| `Escape` | While reading a story | Close the story and return to Today |
| `r` / `R` | Cards / Story | Mark the highlighted card read, or toggle the open story's read status |
| `s` / `S` | Cards / Story | Save or unsave |
| `l` / `L` | Cards / Story | Add to or remove from Read Later |
| `o` / `O` | Cards / Story | Open the original article in a new tab |
| `/` | Anywhere | Open search palette |
| `?` | Anywhere | View all keyboard shortcuts modal |

---

## 5. Subscribing to Feeds & Newsletters

Today makes adding subscriptions effortless—no more hunting for obscure `.xml` or `.rss` feed URLs.

### 5.1 Adding by Website URL (Autodiscovery)
1. Tap **Following** $\rightarrow$ the **+** button (or **Edit Feeds** $\rightarrow$ **Add Feed**).
2. Simply paste the standard website URL (e.g., `https://daringfireball.net` or `arstechnica.com`).
3. Today automatically scans the website and discovers its official RSS or Atom feed.

### 5.2 Using Social & Platform Shortcuts
You can paste platform shortcuts directly into the URL field:
* **Bluesky:** Type `@handle.bsky.social` (e.g., `@jay.bsky.social`) to subscribe to a public Bluesky account.
* **Substack:** Type `substack:publication` (e.g., `substack:platformer`) to subscribe directly to any Substack publication.
* **Medium:** Type `medium:username` (e.g., `medium:ev`) to follow Medium writers.
* **YouTube:** Type `youtube:channel_id` to subscribe to a YouTube channel's video feed.

### 5.3 Inbound Email Newsletters
Keep your primary email inbox clean by sending newsletters straight to Today:
1. When subscribing to an email newsletter (Axios, Morning Brew, Substack, etc.), enter:
   ```
   newsletters@dautovic.com
   ```
2. In Today, your **Newsletters** folder receives the incoming issues as clean, formatted feed articles with all images and full text intact.

---

## 6. Calm Reading & Backlog Triage

### 6.1 Today
* **Top Stories:** When "Rank stories" is enabled in Settings, the 5 most authoritative and consensus-driven stories appear at the top.
* **Folder Sections:** Your folders follow in the exact order you set in Following.
* **Story Clustering:** When multiple outlets cover the exact same event, Today groups them into one clean card with an "Also from..." footer.

### 6.2 Progressive Mark Read & Immediate Story Triage
* **Inline Story Mark Read:** Click the checkmark icon on any story row to mark it read; the next story slides up and **Undo** appears for 5 seconds.
* **Auto-Disappear on Return:** Reading any story in the reader automatically marks it read and dismisses it from Today Cards when you return, keeping your view focused strictly on remaining unread news.
* **Category Mark Read:** Tap the checkmark in any Category Card header to mark the entire category read and dismiss the card.
* **Mark N Read:** At the bottom of each folder section, tap **Mark N Read** to mark the visible cards read and smoothly reveal the next section.
* **Mark All Read in Folders:** Tap the blue pill at the very bottom of Today when you've finished Today.
* **5-Second Undo:** Accidental taps can be undone immediately using the floating Undo bar.

### 6.3 Triaging Backlogs ("Older than 24 Hours")
If you have been away from your reader and want to eliminate unread anxiety without losing today's fresh news:
* **In the Timeline Header:** Click or tap the count button at the top of any list (`N unread`) $\rightarrow$ select **Mark Older than 24h Read**.
* **On any Folder (Desktop):** Right-click the folder in the sidebar $\rightarrow$ **Mark Older than 24h Read**.
* **On any Folder (Mobile):** Long-press the folder in Following $\rightarrow$ **Mark Older than 24h Read**.

All stale backlog stories are marked read immediately, leaving you with only today's actionable news.

---

## 7. Customization & Settings

Open **Settings** (gear icon) to tailor your experience:
* **Wide Screen Layout (Desktop):** Toggle between **Centered Content (Recommended)** (centers header controls directly above the content reading column) and **Full Width Stretch**.
* **Cards View Columns (Desktop):** Select between **1 Column** (focused reading), **2 Columns** (magazine layout), or **3 Columns** (ultra-wide monitor layout).
* **Open stories (Desktop, Settings → Stories):** **Full page** or **Beside the list** (see 3.1).
* **Appearance & Theme:** Switch between Dark and Light mode, or choose your preferred font.
* **Text Size & Zoom:** Adjust App Zoom, Section Heading Size, Article List title size, and reader line spacing independently for your phone and desktop.
* **Today Controls:** **Pictures** (**Large**: a wide picture under each story; **Small**: a square at its right, so more stories fit on the screen; **None**: no pictures and no picture downloads), the number of stories per category (5 to 50, or All), and importance ranking on or off.
* **Muted Words:** Filter out topics you wish to avoid; muted articles are silently excluded from unread counts and Today.
