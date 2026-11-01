# Today — User Guide

| Metadata | Value |
| :--- | :--- |
| **Product** | Today (formerly RSS Reader) |
| **Live App** | [today.dautovic.com](https://today.dautovic.com) |
| **Build Target** | Build 435+ |
| **Documentation Type** | Comprehensive User Manual |
| **Last Updated** | October 31, 2026 |

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

### 3.1 The Desktop Workstation Experience

Today features dedicated workstation layouts tailored for focus:

```
+---------------------------------------------------------------------------------------+
|  TODAY MODE (2 Columns: Focused Reading Workspace)                                    |
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
|  UNREAD MODE (3 Columns: Triage Workstation)                                          |
+-------------------+-------------------------+-----------------------------------------+
|  Sidebar          |  [Mark Read]     [Find] |  [< Back]               [Nav]  [Listen] |
|  - Today          +-------------------------+-----------------------------------------+
|  - Unread (Active)|  Story 1                |  Full Article Reader                    |
|  - Read Later     |  Story 2 (Selected) --> |  Title, Byline, Hero Image, Content     |
|  - Saved          |  Story 3                |                                         |
|  > Subscriptions  |  Story 4                |                                         |
+-------------------+-------------------------+-----------------------------------------+
```

#### Dual Intelligence Views: Briefing vs. Cards
* **✦ Briefing View:** 
  Presents a concise, executive memo generated from your unread stories. Each bullet point begins with a bold takeaway and concludes with a clickable `#N` reference tag linking directly to the full story.
* **▣ Cards View:** 
  Presents your stories as a magazine card deck. Choose between 1, 2, or 3 columns in **Settings → Reading & Display**.
* **Instant Switching:** 
  Use the segmented button in the top bar or press `1` for Briefing and `2` for Cards.

#### Dedicated 2-Column Today Workspace
* Unlike feed lists, **Today operates exclusively as a 2-column workspace** (Sidebar + Content). 
* **Reading Stories:** When you click any card in Today Cards, the story opens in a full 2-column reader canvas (`desktop-today-story`) with a prominent `< Today` back button in the header.
* **Returning to Cards:** Tap `< Today`, press `b`, or press `Escape` to immediately return to Today Cards. Your scroll position is preserved so you pick up right where you left off.
* Today never squeezes into three cramped columns.

#### 3-Column Workstation in Unread
* When you click **Unread** (`#feed-btn-all`) or any feed in your sidebar, Today switches to the classic **3-column triage workstation**:
  1. **Left Sidebar:** Folders, feeds, and smart lists.
  2. **Middle Timeline:** Article list with unread counters and fast mark-read actions.
  3. **Right Reader Pane:** Full text of the selected article.

#### Persistent Simultaneous Centering
* As you resize your desktop browser window (e.g. side-by-side split screen or tiling next to your code editor):
  * The top bar switcher and the body content below it remain **mathematically locked to the exact center** (`50%` of the pane width).
  * The header **never disappears or collapses**, and the mobile phone tab bar never intrudes on desktop.

### 3.2 Mobile Interface
* **The Floating Bottom Tab Bar:** A detached floating glass capsule (YouTube-style, 54px tall) with four pure-icon tabs:
  * **Today:** Your curated 24-hour brief with a live unread badge counter.
  * **Library:** Your complete hierarchy of folders, feeds, and subscriptions.
  * **Saved / Read Later:** 1-tap access to your reading queue. Tapping it opens Read Later; tapping again smoothly toggles to Saved. A sticky segmented control (`[ 🔖 Read Later ]  [ ⭐️ Saved ]`) sits at the top of the timeline for effortless 1-tap switching.
  * **Search:** Instant full-text search across all saved, unread, and archived stories.
  * **Visual Style:** Deep translucent dark glass with an elevated inner capsule highlight around the active tab and a pure bright white icon (`#ffffff`). Zero text clutter.
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

### 6.2 Progressive Mark Read
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
* **Cards View Columns (Desktop):** Select between **1 Column** (focused reading), **2 Columns** (magazine layout), or **3 Columns** (ultra-wide monitor layout).
* **AI & Briefings:** Configure your Gemini API key, customize briefing synthesis, and enable automatic 5:00 AM Morning Briefing preparation.
* **Appearance & Theme:** Switch between Dark and Light mode, or choose your preferred font.
* **Text Size & Zoom:** Adjust App Zoom, Section Heading Size, Article List title size, and reader line spacing independently for your phone and desktop.
* **Today Controls:** Toggle article images, adjust the number of stories per category (5 to 50, or All), and enable/disable importance ranking.
* **Muted Words:** Filter out topics you wish to avoid; muted articles are silently excluded from unread counts and briefings.
