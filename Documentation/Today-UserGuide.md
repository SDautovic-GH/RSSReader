# Today — User Guide

| Metadata | Value |
| :--- | :--- |
| **Product** | Today (formerly RSS Reader) |
| **Live App** | [today.dautovic.com](https://today.dautovic.com) |
| **Build Target** | Build 457+ |
| **Documentation Type** | Comprehensive User Manual |
| **Last Updated** | November 1, 2026 |

---

## 1. Welcome to Today

**Today** is a private, calm RSS reader and newsletter briefing tool designed for mobile and desktop workstations. Instead of forcing you to swim through endless unread lists, Today presents a structured daily intelligence workspace of unread stories published in the last 24 hours, categorized strictly by your chosen folders.

Today offers two distinct intelligence experiences via a single-click switcher:
1. **✦ Briefing View:** An AI-synthesized executive summary highlighting the most critical news and market movements, broken down by folder section with bold headlines and direct `#N` source links.
2. **▣ Cards View:** A visual magazine card deck clustering multi-outlet coverage into clean cards, customizable in 1, 2, or 3 columns.

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

### 2.3 Setting up the AI Morning Briefing
To enable the **✦ Briefing** view:
1. Open **Settings** (gear icon) $\rightarrow$ **AI & Briefings**.
2. Enter your **Google Gemini API Key** (free from [Google AI Studio](https://aistudio.google.com)).
3. Enable **Morning Briefing** if you would like your briefing prepared automatically at 5:00 AM local time.
4. You can also generate or refresh your briefing on demand at any time by clicking **✦ Briefing** in the header.

---

## 3. Navigating Today

### 3.1 The Unified 2-Pane Workstation Experience (Desktop)

Today replaces the cramped 3-pane layout entirely with a unified, modern **2-Pane Workstation Architecture** across all folders, feeds, and smart views:

```
+---------------------------------------------------------------------------------------+
|  UNIFIED 2-PANE WORKSTATION (Today, Unread, Personal Hub, Folders & Feeds)            |
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

#### Dual Intelligence Views: Briefing vs. Cards
* **✦ Briefing View:** 
  Presents a concise, executive memo generated from your unread stories. Each bullet point begins with a bold takeaway and concludes with a clickable `#N` reference tag linking directly to the full story.
* **▣ Cards View (Category Cards):** 
  Presents your stories grouped into **unified Category Cards** (one clean card container per folder), eliminating the visual noise of dozens of fragmented boxes.
  - **Inline Story Controls:** Each story row features direct quick controls on its source line: **Mark Read** (checkmark icon with a smooth dismiss collapse animation), **Save** (star icon), and **More options** (`...`).
  - **Immediate Unread-Only Triage:** As soon as you mark a story read in Today or Unread, it animates and immediately vanishes from view so only unread stories are visible.
  - **Auto-Disappear on Return:** When you open a story in the reader and return via Back, `b`, or `Escape`, the story you just read disappears immediately, automatically landing on the next unread item. Categories with zero unread stories cleanly hide.
  - **Columns:** Choose between 1, 2, or 3 columns in **Settings → Reading & Display**.
* **Instant Switching:** 
  Use the segmented button in the top bar or press `1` for Briefing and `2` for Cards.

#### Personal Hub Cards Workstation (`Read Later`, `Saved`, `History`)
* Clicking `Read Later`, `Saved`, or `History` in the sidebar opens into the full-width cards workstation in `#today-column`.
* Features an absolute-centered 3-way segmented switcher in the timeline header: `[ 🔖 Read Later ] [ ⭐ Saved ] [ ⏱️ History ]`.
* **Durable Story Preservation:** Unlike the unread inbox, stories in your Personal Hub are permanent reading lists and archives. Stories remain visible regardless of read state and are never auto-hidden by background sweeps.

#### Unread, Subscription Folders & Single Feeds
* **Unread (`'all'`):** Renders all unread stories across subscriptions in the cards workstation, grouped by category folder with Category Jump Bar pills (`[Top Stories] [Technology]...`).
* **Subscription Folders (`setCategoryFilter`):** Opening any folder (e.g., `Technology`) partitions the stories by **Publication Source** (`Ars Technica`, `The Verge`, `Wired`), complete with Outlet Jump Bars to hop directly between news sources.
* **Single Feeds (`setSourceFilter`):** Displays a focused cards stream for that publication with *"Mark Feed Read"*.

#### Push-and-Return Story Flow
* When you click any card in any view, the story opens in a focused 2-pane reader canvas (`desktop-today-story`), centered at 760px with a prominent `< Source` back button in the header reflecting where you came from (`< Unread`, `< Technology`, `< Ars Technica`, `< Saved`, etc.).
* Tap Back, press `b`, or press `Escape` to return to Cards view. The read card is centered smoothly and pulses gently into place.

#### Persistent Simultaneous Centering
* As you resize your desktop browser window (e.g. side-by-side split screen or tiling next to your code editor):
  * The top bar switcher and the body content below it remain **mathematically locked to the exact center** (`50%` of the pane width).
  * The header **never disappears or collapses**, and the mobile phone tab bar never intrudes on desktop.

#### Wide Screen & Ultrawide Layout
* On wide or ultrawide monitors ($> 1720px$ width, such as 1440p, 4K, or 34-inch/49-inch ultrawides), Today integrates seamlessly with the browser window at 100% full bleed—without artificial outer letterboxing bars or black margins.
* Rather than scattering header controls across multiple thousands of pixels, Today centers the header controls directly above the content reading canvas:
  * **Today Cards View:** `Mark Read` aligns with the left edge of card column 1, the `Briefing / Cards` switcher sits in the horizontal center, and `Search` aligns with the right edge of the card deck.
  * **Today Briefing & Story View:** Back button aligns with the left margin of the reading text, the switcher sits in the center, and the article toolbar actions align with the right margin.
* This eliminates the neck-straining "tennis match" effect where controls are stranded thousands of pixels away from the reading column.
* You can switch between **Centered Content (Recommended)** and **Full Width Stretch** under **Settings → Appearance → Wide Screen Layout**.

### 3.2 Mobile Interface
* **The Floating Bottom Tab Bar:** A detached floating glass capsule (YouTube-style, 42px compact height) with four pure-icon tabs:
  * **Today:** Your curated 24-hour brief with a live unread badge counter. **Smart Tap:** When scrolled down into cards or briefing, tapping Today smoothly scrolls you to the top; tapping again toggles between Cards and Briefing view.
  * **Library:** Dedicated exclusively to managing your Folders & Subscriptions (clutter-free, without redundant smart feed lists).
  * **Bookmarks (Personal Hub):** 1-tap access to your reading queue with a sticky 3-way segmented control at the top of the timeline: `[ 🔖 Read Later ]  [ ⭐ Saved ]  [ ⏱️ History ]`. Tapping the Bookmarks tab cycles between these views or scrolls to the top.
  * **Search:** Instant full-text search across all saved, unread, and archived stories.
  * **Visual Style:** YouTube-style ultra-translucent frosted glass capsule (`-webkit-backdrop-filter: blur(20px) saturate(180%)`) with GPU acceleration, a soft translucent tint (`rgba(18, 18, 22, 0.25)`), an elevated inner capsule highlight around the active tab, and a pure bright white icon (`#ffffff`). Zero text clutter.
* **Header Controls:**
  * **Headphones Icon:** Tap to have Today read your brief aloud using text-to-speech.
  * **Status Line:** Displays synchronization status (e.g., "Updated just now • 4 new").
  * **New Stories Pill:** When new stories arrive during reading, a blue pill appears ("3 new stories"). Tap it to refresh without interrupting your current scroll position.

---

## 4. Keyboard Shortcuts Reference

| Shortcut | Context | Function |
| :---: | :--- | :--- |
| `1` | Anywhere in Today | Switch to **✦ Briefing View** |
| `2` | Anywhere in Today | Switch to **▣ Cards View** |
| `t` / `T` | Anywhere | Jump directly to Today |
| `j` / `↓` | Today Cards / Reader | Move to next story |
| `k` / `↑` | Today Cards / Reader | Move to previous story |
| `b` / `B` | While reading a story | Return to Today Cards / Briefing |
| `Escape` | While reading a story | Close story and return to Today Cards / Briefing |
| `r` / `R` | Story open | Toggle read / unread status |
| `o` / `O` | Story open | Open original source article in new tab |
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

### 6.1 The Today Briefing
* **Top Stories:** When "Rank stories" is enabled in Settings, the 5 most authoritative and consensus-driven stories appear at the top.
* **Folder Sections:** Your folders follow in the exact order you set in Following.
* **Story Clustering:** When multiple outlets cover the exact same event, Today groups them into one clean card with an "Also from..." footer.

### 6.2 Progressive Mark Read & Immediate Story Triage
* **Inline Story Mark Read:** Click the checkmark icon directly on any story row to dismiss it immediately with a smooth collapse animation.
* **Auto-Disappear on Return:** Reading any story in the reader automatically marks it read and dismisses it from Today Cards when you return, keeping your view focused strictly on remaining unread news.
* **Category Mark Read:** Tap the checkmark in any Category Card header to mark the entire category read and dismiss the card.
* **Mark N Read:** At the bottom of each folder section, tap **Mark N Read** to mark the visible cards read and smoothly reveal the next section.
* **Mark All Read in Folders:** Tap the blue pill at the very bottom of Today when you've finished your briefing.
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
* **AI & Briefings:** Configure your Gemini API key, customize briefing synthesis, and enable automatic 5:00 AM Morning Briefing preparation.
* **Appearance & Theme:** Switch between Dark and Light mode, or choose your preferred font.
* **Text Size & Zoom:** Adjust App Zoom, Section Heading Size, Article List title size, and reader line spacing independently for your phone and desktop.
* **Today Controls:** Toggle article images, adjust the number of stories per category (5 to 50, or All), and enable/disable importance ranking.
* **Muted Words:** Filter out topics you wish to avoid; muted articles are silently excluded from unread counts and briefings.
