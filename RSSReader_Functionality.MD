# RSS Reader — Functionality Summary

**As of October 2026 (build 338).** A single-file Progressive Web App RSS reader for phone and desktop, with cloud sync between devices. It opens on **Today**, a live brief of your unread stories from the last 24 hours, grouped by your own folders. Every change since build 264 is recorded in `MajorRevisions/Modern-Tabs-Redesign.md`.

---

## Getting Started

1. Open the app (sdautovic-gh.github.io/RSSReader), or add it to your phone's home screen.
2. Sign in with your email and password. The app needs an account: the sign-in window stays until you sign in, and from then on feeds and read marks follow you between devices.
3. Add feeds: **Following** › the **pencil** (Edit feeds) › Add feed, or import an OPML file there.
4. Read in **Today**.

---

## Finding Your Way

### On the phone
The bottom bar has **Today** and **Following**, plus a separate **Search** button. The Today tab shows how many stories are unread.

Both screens have the same header: the app logo, a title with a small status line under it, and buttons on the right.
- **Today:** "Thu, Oct 8" and "Updated just now • 3 new", with the **headphones** button to listen.
- **Following:** "Following" and its status, with **Edit feeds** (pencil), **Add feed** (+) and **Settings** (gear).

Opening a story covers the screen. Tap **Today** in the tab bar to go back to the same place. Swipe to move between stories. While you scroll down a story, the tab bar slides away; scroll up a little and it comes back.

### On the desktop
- **Left:** the sidebar, with Today, Unread, Read Later, Saved, History and your folders.
- **Middle:** Today, or a list. Drag its edge to resize it; the width is saved.
- **Right:** the story you are reading. Today stays open beside it.

Double-click the story's top bar for full screen (just the story). Use the arrow keys to move between stories, and Esc to leave.

---

## Today

Today shows the unread stories from the last 24 hours in the folders you include:

- **Top Stories:** the five strongest stories across your folders, the ones from the most authoritative outlets or covered by several.
- **Your folders:** one section per folder, in your Following order. Each shows up to your **Stories per Category** (Settings › Today).
- **One card per story:** when several outlets cover the same story, you get one card, from the most authoritative outlet, with "Also from …".
- **Pictures:** a small picture beside a story, and a large one on the first Top Story. Turn them off in Settings › Today › Show images.
- **Folder pills (phone):** the row of pills under the header jumps to a folder.

### Reading and marking
- Tap a story's headline or summary to read it. Read stories leave Today.
- **Mark N read** at the end of a section marks the stories still showing there. The next section slides up, and **Undo** appears at the bottom for 5 seconds.
- **Mark All Read in Folders** is at the very end.
- When everything is read, Today says **"You're all caught up."** On the phone it adds **"Pull down to refresh."**

### New stories
Today stays still while you read: new stories never appear under your finger, and nothing jumps by itself. When there are new ones, the status line counts them ("3 new"), and a **"N new stories"** pill appears. Tap it to see them at the top.

### Refresh
- **Phone:** pull down on Today.
- **Desktop:** the refresh button in the sidebar header.
- Feeds also refresh by themselves every 30 minutes (Settings › Refresh & Sync).

### Choosing what's in Today
Following › pencil: each folder has an **In Today** switch.

### Listen
The headphones button reads the stories showing in Today aloud. The player above the tab bar has Pause/Resume and Stop.

---

## Following

- **Unread:** every unread story. It also shows how many are older than today.
- **Read Later:** stories you put aside to read soon.
- **Saved:** stories you want to keep. They stay even if you remove the feed.
- **History:** stories you have read, from the last 30 days (Settings › General › History window).
- **Folders:** tap a folder or a feed to see its stories. Folders with nothing unread are hidden unless you turn on Settings › General › Show empty category folders.

### The feed manager (the pencil)
- Feeds are grouped by folder. Each folder has **In Today** and **Rename**.
- Each feed shows when it was last checked and how new its newest story is, or that it isn't loading.
- **Edit** changes a feed's name, address or folder. **Remove** deletes it (you confirm first). **Retry** tries a feed that isn't loading.
- **Add feed:** paste an RSS/Atom address, a Bluesky profile, a Mastodon RSS address or a YouTube playlist feed.
- **OPML:** import or export your whole list.

### Right-click (desktop)
- **A feed:** Refresh Feed, Mark All Read.
- **A folder:** Mark All Read, Collapse Folder, Collapse All Folders, Rename.

---

## Lists

Unread, folders, feeds, Read Later, Saved and History all show stories as a list:
- Each card shows the source, how long ago it was published, the headline, a preview and buttons.
- **Phone:** swipe left to mark read or unread, and swipe right for Read Later. Long-press for more.
- **Right-click or long-press** a story: Mark Above Read, Read Later, Save, Mark Read/Unread, Mark Below Read.
- **Order:** oldest first by default; change it in Settings › General › Sort Order.
- **De-duplicate** (on by default) keeps one copy of a story published by several sources.
- **Density (desktop):** the top bar switches between Standard Stream and Compact Wire.

---

## Reading a Story

- **At the top:** the source (tap it to see that feed's stories), the headline, then the author and date. On the desktop the author is left out when it would only repeat the source.
- **Full articles:** when a feed sends only a short excerpt, the app fetches the full article.
- **Pictures:** tap one to enlarge it; pinch or double-tap to zoom.
- **Podcasts:** podcast episodes get an audio player.
- **Moving on:** j/k or ↑/↓ on the desktop, swipes on the phone. You move through the brief or list the story came from.

### Story buttons
- **Desktop:** list cards, Today cards and the reader all have the same row: **Read · Read Later · Save · Open original · Share**. Hover for each button's name. A button turns blue when it's on: unread, in Read Later, or saved.
- **Phone, Today cards:** Read, Read Later, Save, Open in Reader, Open original, Share.
- **Phone, reader:** Read, Read Later, Save, Open original, Listen, Share.
- **Phone, list cards:** Open in Reader, Save, Open original. Swipes handle read and Read Later.

---

## Search

Tap **Search** (or press `/` on the desktop) and type. Results appear as you type. Buttons jump to Unread, Read Later or Saved. On the desktop you can also limit the search to one folder, and to unread or read stories.

---

## Settings Reference (the gear)

| Section | Setting | What it does |
|---|---|---|
| Account | | Shows that you are signed in (tap for the email); Sign Out |
| Appearance | Theme | Light or dark |
| | App Zoom | Makes everything bigger or smaller (each device keeps its own) |
| Refresh & Sync | Auto-Refresh Interval | Off, every 15 minutes, every 30 minutes, every hour. Timed refreshes are skipped while the app is in the background or on Data Saver |
| General | Sort Order | Oldest or newest published first, in lists |
| | History window | How far back History goes: 7, 30, 60 or 90 days |
| | Show empty category folders | Shows folders with nothing unread |
| | Deduplicate articles by title | One copy per story, favouring well-known sources |
| | Font | The font used throughout |
| Today | Show images | Pictures in Today |
| | Stories per Category | How many stories each folder shows: 5 to 50, or All |
| Muted words | | Stories with these words in the headline or summary are hidden and not counted. Today offers "N muted · Show" |
| Sidebar | Folder Size | Size of the folder and feed names in Following |
| | Row Spacing | Space between those rows |
| Article List | Title Size | Headlines in lists, and in Today a little smaller |
| | Preview Text Size | Preview text in lists and summaries in Today |
| | Line Height | Line spacing of those headlines and previews |
| | Source Name Size | Source names in lists, Today and above a story's headline |
| | Preview Lines | How many lines of preview to show |
| | Social Preview Lines | The same for Bluesky and Mastodon posts |
| Article Reader | Title Size | A story's headline, and Today's heading on a computer |
| | Body Text Size | A story's text |
| | Line Height | A story's line spacing |
| | Author & Date Size | The line under a story's headline |
| | Reset text sizes | Puts every size and spacing back to its default (keeps theme, font, sort order, auto-refresh, de-duplicate, history window and zoom) |

Text sizes are kept separately for the phone and the desktop, except Folder Size, Row Spacing and Source Name Size.

---

## Keyboard Shortcuts (desktop)

| Key | Action |
|---|---|
| `j` / `↓` | Next story |
| `k` / `↑` | Previous story |
| `r` | Mark read / unread |
| `b` | Back to Today (from a Today story), otherwise Read Later |
| `o` | Open the original |
| `t` | Today |
| `/` | Search |
| `?` | All shortcuts |
| `Esc` | Leave full screen, close a dialog |
| `→` / `←`, `↓` / `↑` | In full screen: next / previous story, scroll |

---

## Cloud Sync

**What follows you between devices:**
- your feeds and folders;
- what you have read;
- Read Later and Saved;
- your folder order and the desktop's middle-column width;
- auto-refresh, which folders are in Today, and muted words.

**What each device keeps for itself:** text sizes, theme, font, sort order, show images, Stories per Category, show empty folders, de-duplicate and the history window.

Read marks from all your devices are combined. **Sign Out** (Settings › Account) asks you to confirm, then shows the sign-in window again; what is stored in the browser stays.

---

## Notifications

- **Short messages at the top** confirm actions ("Saved", "Added to Read Later", "Link copied to clipboard") and report problems, shown in red.
- **"Marked N read · Undo"** floats at the bottom for 5 seconds. It takes no room, so nothing moves when it goes.

---

## Technical Notes

- **One file:** everything is in `index.html`, published to GitHub Pages by `/sync-rssreader`.
- **Privacy:** no analytics or tracking. Your data stays in your browser, and in your own Firebase account once you sign in.
- **Storage:** stories, feeds, read marks, History, Read Later and Saved are kept in the browser's IndexedDB. Your unread stories stay until you read them or they are 4 days old.
- **Feeds:** fetched through the app's own Cloudflare Worker, with allorigins.win as a fallback. Bluesky profiles come from Bluesky's public API.
- **Offline:** stories already loaded can be read without a connection once the app is open. The app itself needs a connection to load, since it has no offline cache of its own code.
