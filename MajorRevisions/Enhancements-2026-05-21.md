# RSS Reader UI/UX Enhancements — Replay Script

**Date applied:** 2026-05-21
**Target file:** `index.html`
**Purpose:** Mechanical replay of the visual/UX overhaul applied 2026-05-21 onto another copy of this app. Each item lists WHAT / WHERE / BEFORE / AFTER / WHY. Line numbers will drift between versions — locate by the BEFORE snippet, not by line.

Apply in order. Items 9 and 12 modify code touched by item 3; items 14a and 14b modify code touched by item 9 and the original pane setup. Doing them out of order works but requires re-reading the file between edits.

---

## 1. Empty-state contradiction

**Bug:** When no feeds exist, the article-list pane shows "All caught up — You've read everything" while the viewer pane shows "Welcome to RSS Reader — Add your first feed." These messages contradict.

**Where:** `function renderTimelineEmptyState()`

**BEFORE:**
```js
function renderTimelineEmptyState() {
    const inFolder = !!window.currentCategoryFilter;
    const inSource = !!window.currentSourceFilter;
    const isReadLater = window.currentSmartFeed === 'read-later';
    const isToday = window.currentSmartFeed === 'today';
    const isRecentlyRead = window.currentSmartFeed === 'recently-read';
    let headline, subtext;
    if (isRecentlyRead) {
        ...
    } else {
        headline = 'All caught up';
        subtext = "You've read everything. Pull down to refresh.";
    }
    return `
        <div class="flex flex-col items-center justify-center text-center px-6" ...>
            ...
            <h2 ...>${esc(headline)}</h2>
            <p ...>${esc(subtext)}</p>
            <button onclick="refreshAll()" ...>
                <svg ...><use href="#icon-refresh"/></svg>
                Refresh
            </button>
        </div>
    `;
}
```

**AFTER:** Add a `!hasFeeds` branch ahead of all the others, and conditionally hide the Refresh button:

```js
function renderTimelineEmptyState() {
    const hasFeeds = (window.feeds || []).length > 0;
    const inFolder = !!window.currentCategoryFilter;
    const inSource = !!window.currentSourceFilter;
    const isReadLater = window.currentSmartFeed === 'read-later';
    const isToday = window.currentSmartFeed === 'today';
    const isRecentlyRead = window.currentSmartFeed === 'recently-read';
    let headline, subtext, showRefresh = true;
    if (!hasFeeds) {
        headline = 'No feeds yet';
        subtext = 'Add your first feed from Settings → Feeds to get started.';
        showRefresh = false;
    } else if (isRecentlyRead) {
        ...
    } else {
        headline = 'All caught up';
        subtext = "You've read everything. Pull down to refresh.";
    }
    const refreshBtn = showRefresh ? `
            <button onclick="refreshAll()" ...>
                <svg ...><use href="#icon-refresh"/></svg>
                Refresh
            </button>` : '';
    return `
        <div ...>
            ...
            <h2 ...>${esc(headline)}</h2>
            <p ...>${esc(subtext)}</p>
            ${refreshBtn}
        </div>
    `;
}
```

**Why:** When `feeds.length === 0`, the "Welcome / Add first feed" card already handles the viewer pane. The list pane should match that state, not claim the user has "read everything."

---

## 2. Rename "✓ N" badge to "Mark Read · N" + dynamic update fix

**Three sub-changes.**

### 2a. Rename initial button text

**Where:** Element `#timeline-count` in the markup (the button in the timeline-pane header that calls `markAllRead()`).

**BEFORE:**
```html
<button id="timeline-count" onclick="markAllRead()" title="Mark All Read" class="mr-2 hover:text-blue-500 transition-colors whitespace-nowrap text-[15px] font-semibold tabular-nums">✓ 0</button>
```

**AFTER:**
```html
<button id="timeline-count" onclick="markAllRead()" title="Mark All Read" class="mr-2 hover:text-blue-500 transition-colors whitespace-nowrap text-[15px] font-semibold tabular-nums">Mark Read · 0</button>
```

### 2b. Update the dynamic textContent setter inside `renderTimeline`

**BEFORE:**
```js
const unreadCount = filtered.filter(a => a.unread).length;
document.getElementById('timeline-count').textContent = `✓ ${unreadCount}`;
```

**AFTER:**
```js
const unreadCount = filtered.filter(a => a.unread).length;
document.getElementById('timeline-count').textContent = `Mark Read · ${unreadCount}`;
```

### 2c. Fix counter not updating after background fetch

**Bug:** `fetchAllStaggered` in background mode (auto-refresh, init fetch, OPML import) never triggered a timeline re-render, so the badge stayed stale until the user took a UI action.

**Where:** `async function fetchAllStaggered(...)`.

**BEFORE:**
```js
async function fetchAllStaggered(feeds, maxItems = null, isBackground = false, delayMs = 30) {
    const promises = [];
    for (let i = 0; i < feeds.length; i++) {
        promises.push(fetchRecentArticles(feeds[i].url, feeds[i].name, maxItems, isBackground));
        if (i < feeds.length - 1) await new Promise(r => setTimeout(r, delayMs));
    }
    await Promise.allSettled(promises);
}
```

**AFTER:**
```js
async function fetchAllStaggered(feeds, maxItems = null, isBackground = false, delayMs = 30) {
    const promises = [];
    for (let i = 0; i < feeds.length; i++) {
        promises.push(fetchRecentArticles(feeds[i].url, feeds[i].name, maxItems, isBackground));
        if (i < feeds.length - 1) await new Promise(r => setTimeout(r, delayMs));
    }
    await Promise.allSettled(promises);
    // Background fetches don't trigger a full timeline/sidebar refresh per-feed
    // (only the visible source filter re-renders inside fetchRecentArticles).
    // After the batch completes, refresh once so the header counter and sidebar
    // badges reflect newly-arrived unread articles. preserveLayout=true keeps
    // the user's scroll position.
    if (isBackground) refreshUI();
}
```

**Why:** "Mark Read" without a separator reads as "Mark Read 27" — visually ambiguous (is 27 part of the verb?). The `·` matches the date format used elsewhere. Counter update after fetch is a real correctness bug.

---

## 3. Active article card — 3px blue left stripe via dedicated CSS class

**Goal:** When an article is selected, its card in the list shows a clean 3px blue left stripe (no background tint).

### 3a. Add the CSS class

**Where:** In the `<style>` block, near other `#article-list` rules.

**ADD:**
```css
/* Active (currently selected) article card — 3px blue left stripe only.
   Defined as a single class so DOM mutations don't have to juggle multiple Tailwind classes.
   The .dark override at `.dark #article-list > div` (border-color !important, specificity 1,1,1)
   would otherwise repaint our stripe dark gray in dark mode. The second selector here matches
   that specificity (1,2,0) and wins on class count, keeping the stripe blue. */
#article-list .is-active-card,
.dark #article-list > .is-active-card {
    border-left: 3px solid #3b82f6 !important;
    border-left-color: #3b82f6 !important;
}
```

**Specificity gotcha:** If the target file has a rule like `.dark #article-list > div { border-color: #...; !important }` (most copies do, for GitHub-style separators), a plain `#article-list .is-active-card` selector loses the specificity battle in dark mode — the stripe gets painted but in the override's dark gray, making it invisible against the dark background. The two-selector form above defends against this.

### 3b. Use the class in `buildArticleCard`

**BEFORE:**
```js
function buildArticleCard(a) {
    const favicon = getFavicon(a.source);
    const selected = window.currentArticle?.id === a.id;
    const selCls = selected ? 'border-l-4 border-l-blue-500' : '';
    const selStyle = selected ? 'style="background-color: rgba(23,37,84,0.45);"' : '';
    ...
    if (window._viewMode === 'card') {
        return `<div data-id="..." onclick="..." oncontextmenu="..." ${selStyle} class="article-card cursor-pointer hover:bg-blue-950/30 transition-colors ${selCls}">
            ...
    }
    ...
    return `<div data-id="..." onclick="..." oncontextmenu="..." ${selStyle} class="relative px-4 py-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-blue-950/30 transition-colors ${selCls}">
```

**AFTER:** Remove the `selStyle` variable, change `selCls`, drop both `${selStyle}` from the templates, and change `py-4` to `py-3` on the list-view template (covers item 11):

```js
function buildArticleCard(a) {
    const favicon = getFavicon(a.source);
    const selected = window.currentArticle?.id === a.id;
    const selCls = selected ? 'is-active-card' : '';
    ...
    if (window._viewMode === 'card') {
        return `<div data-id="..." onclick="..." oncontextmenu="..." class="article-card cursor-pointer hover:bg-blue-950/30 transition-colors ${selCls}">
            ...
    }
    ...
    return `<div data-id="..." onclick="..." oncontextmenu="..." class="relative px-4 py-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-blue-950/30 transition-colors ${selCls}">
```

### 3c. Use the class in `selectArticle`'s in-place DOM mutation

**Where:** Inside `window.selectArticle`, the block that updates the previous/new selected card without re-rendering.

**BEFORE:**
```js
const listEl = document.getElementById('article-list');
if (listEl) {
    const prevSelected = listEl.querySelector('.border-l-blue-500');
    if (prevSelected) {
        prevSelected.classList.remove('border-l-4', 'border-l-blue-500');
        prevSelected.style.backgroundColor = '';
    }
    const newSelected = listEl.querySelector(`[data-id="${id}"]`);
    if (newSelected) {
        newSelected.classList.add('border-l-4', 'border-l-blue-500');
        newSelected.style.backgroundColor = 'rgba(23,37,84,0.45)';
        ...
    }
}
```

**AFTER:**
```js
const listEl = document.getElementById('article-list');
if (listEl) {
    const prevSelected = listEl.querySelector('.is-active-card');
    if (prevSelected) {
        prevSelected.classList.remove('is-active-card');
    }
    const newSelected = listEl.querySelector(`[data-id="${id}"]`);
    if (newSelected) {
        newSelected.classList.add('is-active-card');
        ...
    }
}
```

**Why:** The previous `border-l-4 + inline bg` combination was visually muddy — the bg tint dominated and the stripe got lost. Using a single CSS class with `!important` guarantees the stripe paints regardless of specificity, and dropping the tint makes the selected state read crisply.

---

## 4. Reduce reader content's left margin

**Goal:** On wide screens, push the reader content close to the list (where the user's eye is coming from) instead of centering it inside the viewer pane with large left+right dead space.

**Where:** The inner content wrapper inside `#reader-view`.

**BEFORE:**
```html
<div id="reader-view" class="absolute inset-0 overflow-y-auto overflow-x-hidden p-2 md:p-4 lg:p-6">
    <div class="max-w-2xl mx-auto">
```

**AFTER:**
```html
<div id="reader-view" class="absolute inset-0 overflow-y-auto overflow-x-hidden p-2 md:p-4 lg:p-6">
    <div class="max-w-2xl mr-auto md:ml-4 lg:ml-8">
```

**Why:** `mx-auto` centers the content, splitting the left/right whitespace evenly. On a wide window, that creates ~300px of dead space between the article list and the article body. Left-aligning closes the gap; reading width (`max-w-2xl`) is preserved.

---

## 5. Header action buttons → icons with tooltips

**Goal:** Replace all-caps text labels (`SHARE`, `LISTEN`, `MARK READ`, `READ LATER`, `LIST`) in the viewer-pane header with icons + `title`/`aria-label` tooltips, so the toolbar reads as a single coherent strip instead of a wall of text chips.

### 5a. Add new icon `<symbol>` definitions

**Where:** Inside the global `<defs>` `<svg>` block, alongside existing icons like `#icon-rss`, `#icon-check`, etc. Add **just before** the closing `</defs>`:

```html
<symbol id="icon-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/>
</symbol>
<symbol id="icon-headphones" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z"/>
</symbol>
<symbol id="icon-stop" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <rect x="6" y="6" width="12" height="12" rx="1"/>
</symbol>
<symbol id="icon-mark-unread" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="9"/>
</symbol>
<symbol id="icon-bookmark-filled" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
</symbol>
<symbol id="icon-bookmark-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/><path d="M9 8l6 6M15 8l-6 6"/>
</symbol>
<symbol id="icon-list" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
</symbol>
<symbol id="icon-grid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
</symbol>
```

If the target file already has any of these (e.g. existing `icon-bookmark`), skip duplicates.

### 5b. Replace text labels in viewer-header buttons

**Where:** The button cluster inside `#viewer-header` containing `#share-btn`, `#tts-btn`, `#unread-action-btn`, `#read-later-action-btn`, and `#view-density-toggle`.

**BEFORE:**
```html
<div class="flex items-center space-x-3">
    <div class="flex space-x-2 mr-2">
        <button id="share-btn" onclick="shareArticle()" class="hidden px-2 py-1 text-[10px] font-bold text-gray-500 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            SHARE
        </button>
        <button id="tts-btn" onclick="toggleTTS()" class="hidden text-[10px] font-bold px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            LISTEN
        </button>
        <button id="unread-action-btn" onclick="toggleUnreadManual()" class="hidden text-[10px] font-bold px-2 py-1 rounded-md border transition-colors">
            MARK READ
        </button>
        <button id="read-later-action-btn" onclick="handleReadLaterAction()" class="hidden text-[10px] font-bold px-2 py-1 rounded-md border transition-colors">
            READ LATER
        </button>
    </div>
    <button onclick="toggleViewMode()" id="view-density-toggle" class="text-[10px] font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md" title="Toggle List/Card view">LIST</button>
</div>
```

**AFTER:**
```html
<div class="flex items-center space-x-3">
    <div class="flex space-x-2 mr-2">
        <button id="share-btn" onclick="shareArticle()" title="Share" aria-label="Share" class="hidden p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-4 h-4"><use href="#icon-share"/></svg>
        </button>
        <button id="tts-btn" onclick="toggleTTS()" title="Listen" aria-label="Listen" class="hidden p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-4 h-4"><use href="#icon-headphones"/></svg>
        </button>
        <button id="unread-action-btn" onclick="toggleUnreadManual()" title="Mark Read" aria-label="Mark Read" class="hidden p-1.5 rounded-md border transition-colors">
            <svg class="w-4 h-4"><use href="#icon-check"/></svg>
        </button>
        <button id="read-later-action-btn" onclick="handleReadLaterAction()" title="Read Later" aria-label="Read Later" class="hidden p-1.5 rounded-md border transition-colors">
            <svg class="w-4 h-4"><use href="#icon-bookmark"/></svg>
        </button>
    </div>
    <button onclick="toggleViewMode()" id="view-density-toggle" title="Toggle List/Card view" aria-label="Toggle List/Card view" class="p-1.5 rounded-md text-gray-500 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
        <svg class="w-4 h-4"><use href="#icon-list"/></svg>
    </button>
</div>
```

### 5c. Update `window.updateActionButton`

**Where:** The function that toggles unread/read-later button text based on article state.

**BEFORE:**
```js
window.updateActionButton = () => {
    const b = document.getElementById('read-later-action-btn');
    const shareBtn = document.getElementById('share-btn');
    const ttsBtn = document.getElementById('tts-btn');
    const unreadBtn = document.getElementById('unread-action-btn');
    const hasArticle = !!window.currentArticle;
    [b, shareBtn, ttsBtn, unreadBtn].forEach(el => el?.classList.toggle('hidden', !hasArticle));
    if (!hasArticle) return;

    const BASE = 'text-[10px] font-bold px-2 py-1 rounded-md border transition-colors cursor-pointer';
    if (window.currentArticle.unread) {
        unreadBtn.textContent = 'MARK READ';
        unreadBtn.className = `${BASE} border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30`;
    } else {
        unreadBtn.textContent = 'MARK UNREAD';
        unreadBtn.className = `${BASE} border-gray-400 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700`;
    }
    if (window.currentSmartFeed === 'read-later') {
        b.textContent = "REMOVE FROM READ LATER";
        b.className = `${BASE} border-red-500 text-red-500 hover:bg-red-50`;
    } else if (window.currentArticle.readLater) {
        b.textContent = "SAVED TO READ LATER";
        b.className = `${BASE} border-green-500 text-green-500 bg-green-50`;
    } else {
        b.textContent = "READ LATER";
        b.className = `${BASE} border-gray-400 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700`;
    }
};
```

**AFTER:**
```js
window.updateActionButton = () => {
    const b = document.getElementById('read-later-action-btn');
    const shareBtn = document.getElementById('share-btn');
    const ttsBtn = document.getElementById('tts-btn');
    const unreadBtn = document.getElementById('unread-action-btn');
    const hasArticle = !!window.currentArticle;
    [b, shareBtn, ttsBtn, unreadBtn].forEach(el => el?.classList.toggle('hidden', !hasArticle));
    if (!hasArticle) return;

    const BASE = 'p-1.5 rounded-md border transition-colors cursor-pointer';
    if (window.currentArticle.unread) {
        unreadBtn.title = 'Mark Read';
        unreadBtn.setAttribute('aria-label', 'Mark Read');
        unreadBtn.innerHTML = '<svg class="w-4 h-4"><use href="#icon-check"/></svg>';
        unreadBtn.className = `${BASE} border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30`;
    } else {
        unreadBtn.title = 'Mark Unread';
        unreadBtn.setAttribute('aria-label', 'Mark Unread');
        unreadBtn.innerHTML = '<svg class="w-4 h-4"><use href="#icon-mark-unread"/></svg>';
        unreadBtn.className = `${BASE} border-gray-400 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700`;
    }
    if (window.currentSmartFeed === 'read-later') {
        b.title = 'Remove from Read Later';
        b.setAttribute('aria-label', 'Remove from Read Later');
        b.innerHTML = '<svg class="w-4 h-4"><use href="#icon-bookmark-x"/></svg>';
        b.className = `${BASE} border-red-500 text-red-500 hover:bg-red-50`;
    } else if (window.currentArticle.readLater) {
        b.title = 'Saved to Read Later';
        b.setAttribute('aria-label', 'Saved to Read Later');
        b.innerHTML = '<svg class="w-4 h-4"><use href="#icon-bookmark-filled"/></svg>';
        b.className = `${BASE} border-green-500 text-green-500 bg-green-50`;
    } else {
        b.title = 'Read Later';
        b.setAttribute('aria-label', 'Read Later');
        b.innerHTML = '<svg class="w-4 h-4"><use href="#icon-bookmark"/></svg>';
        b.className = `${BASE} border-gray-400 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700`;
    }
};
```

### 5d. Update `updateTTSButton`

**BEFORE:**
```js
function updateTTSButton() {
    const btn = document.getElementById('tts-btn');
    if (!btn) return;
    btn.textContent = window._ttsActive ? 'STOP' : 'LISTEN';
    btn.className = window._ttsActive
        ? 'text-[10px] font-bold px-2 py-1 rounded-md border border-red-400 text-red-500 hover:bg-red-50 transition-colors'
        : 'text-[10px] font-bold px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
```

**AFTER:**
```js
function updateTTSButton() {
    const btn = document.getElementById('tts-btn');
    if (!btn) return;
    const icon = window._ttsActive ? 'icon-stop' : 'icon-headphones';
    const label = window._ttsActive ? 'Stop' : 'Listen';
    btn.innerHTML = `<svg class="w-4 h-4"><use href="#${icon}"/></svg>`;
    btn.title = label;
    btn.setAttribute('aria-label', label);
    btn.className = window._ttsActive
        ? 'p-1.5 rounded-md border border-red-400 text-red-500 hover:bg-red-50 transition-colors'
        : 'p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
```

### 5e. Update `window.toggleViewMode`

**BEFORE:**
```js
window.toggleViewMode = () => {
    window._viewMode = window._viewMode === 'list' ? 'card' : 'list';
    document.getElementById('view-density-toggle').textContent = window._viewMode === 'card' ? 'CARD' : 'LIST';
    renderTimeline();
    try { localStorage.setItem('newsreader_viewmode', window._viewMode); } catch(e) { console.warn('Storage error:', e.message); }
};
```

**AFTER:**
```js
window.toggleViewMode = () => {
    window._viewMode = window._viewMode === 'list' ? 'card' : 'list';
    const btn = document.getElementById('view-density-toggle');
    if (btn) {
        const icon = window._viewMode === 'card' ? 'icon-grid' : 'icon-list';
        const label = window._viewMode === 'card' ? 'Card view (switch to List)' : 'List view (switch to Card)';
        btn.innerHTML = `<svg class="w-4 h-4"><use href="#${icon}"/></svg>`;
        btn.title = label;
        btn.setAttribute('aria-label', label);
    }
    renderTimeline();
    try { localStorage.setItem('newsreader_viewmode', window._viewMode); } catch(e) { console.warn('Storage error:', e.message); }
};
```

### 5f. Update init-time restore for view-mode

**Where:** The init block that restores `newsreader_viewmode` from localStorage.

**BEFORE:**
```js
const vm = localStorage.getItem('newsreader_viewmode');
if (vm === 'card') {
    window._viewMode = 'card';
    const btn = document.getElementById('view-density-toggle');
    if (btn) btn.textContent = 'CARD';
```

**AFTER:**
```js
const vm = localStorage.getItem('newsreader_viewmode');
if (vm === 'card') {
    window._viewMode = 'card';
    const btn = document.getElementById('view-density-toggle');
    if (btn) {
        btn.innerHTML = '<svg class="w-4 h-4"><use href="#icon-grid"/></svg>';
        btn.title = 'Card view (switch to List)';
        btn.setAttribute('aria-label', 'Card view (switch to List)');
    }
```

Watch the closing braces — the original is a single-line `if (btn) btn.textContent = 'CARD';`, the replacement is a multi-line block. Make sure the outer `if (vm === 'card') { ... }` block is still properly closed.

**Why:** Text labels in a toolbar are noisier than icons. Tooltips on hover give equivalent discoverability without the chrome weight. Dynamic state (Mark Read ↔ Mark Unread, Read Later ↔ Saved ↔ Remove, Listen ↔ Stop, List ↔ Card) is conveyed by swapping the icon + tooltip in sync.

---

## 6. Reader date format

**Goal:** Article byline shows `May 19, 2026 · 1:11 PM` instead of `5/19/2026, 1:11 PM`.

**Where:** The `dateEl.textContent = ...` assignment inside the function that populates the reader (`selectArticle` or its helper).

**BEFORE:**
```js
dateEl.textContent = new Date(article.timestamp).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
```

**AFTER:**
```js
const _d = new Date(article.timestamp);
const _datePart = _d.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric', year: 'numeric' });
const _timePart = _d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', hour12: true });
dateEl.textContent = `${_datePart} · ${_timePart}`;
```

**Why:** `toLocaleString` returns the combined form `"5/19/2026, 1:11 PM"` with a comma separator. Splitting into `toLocaleDateString` (long month) and `toLocaleTimeString` lets us join with `·`, which matches the same separator used in the header badge after item 2.

---

## 7. Source label / timestamp color differentiation on article cards

**Goal:** Source labels read more clearly than timestamps in the list (better hierarchy, easier scanning).

**Where:** Two locations inside `buildArticleCard` — the card-view template (`window._viewMode === 'card'`) and the list-view template (default).

### 7a. List view

**BEFORE:**
```html
<span class="list-source-label font-bold text-blue-500 uppercase truncate mr-2 flex-1 min-w-0">${favicon}${esc(sourceLabel)}</span>
<span class="list-date-label text-[11px] text-gray-400 flex-shrink-0">${getRelativeTime(a.timestamp)}</span>
```

**AFTER:**
```html
<span class="list-source-label font-bold text-blue-400 dark:text-blue-300 uppercase truncate mr-2 flex-1 min-w-0">${favicon}${esc(sourceLabel)}</span>
<span class="list-date-label text-[11px] text-gray-500 dark:text-gray-500 flex-shrink-0">${getRelativeTime(a.timestamp)}</span>
```

### 7b. Card view

**BEFORE:**
```html
<div class="flex items-center text-[10px] text-gray-400 mb-1">
    ${a.unread ? '<span class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 flex-shrink-0"></span>' : ''}
    ${favicon}<span class="font-bold uppercase truncate">${esc(a.source)}</span>
    <span class="ml-auto flex-shrink-0">${getRelativeTime(a.timestamp)}</span>
</div>
```

**AFTER:**
```html
<div class="flex items-center text-[10px] mb-1">
    ${a.unread ? '<span class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 flex-shrink-0"></span>' : ''}
    ${favicon}<span class="font-bold uppercase truncate text-blue-400 dark:text-blue-300">${esc(a.source)}</span>
    <span class="ml-auto flex-shrink-0 text-gray-500 dark:text-gray-500">${getRelativeTime(a.timestamp)}</span>
</div>
```

**Why:** Source labels and timestamps were both rendered in roughly the same muted shade, so they blurred together while scanning. Bumping the source slightly toward bright blue (light-on-dark) and dimming the timestamp creates clear hierarchy: scan source first, then read time.

---

## 8. Article body breathing room

**Goal:** Equal, visible vertical gap on both sides of the horizontal divider line that separates the byline from the article body.

### 8a. Byline div: add ID, drop the inline `pb-`, bump `mb-`

The Tailwind `pb-` utility gets compressed by app-zoom; we move the padding to an explicit CSS rule (keyed off a stable ID) so the value is in absolute pixels. Keep `mb-12` because that's the gap *below* the bordered byline div (before the next sibling, the body), which is now explicit-padding-controlled too.

**Where:** The `<div>` containing `#article-author` and `#article-date` inside `#article-header-card`.

**BEFORE:**
```html
<div class="flex items-center text-xs text-gray-500 mb-8 pb-4 border-b border-gray-100 dark:border-gray-800">
    <span id="article-author" class="font-semibold"></span><span class="mx-2">•</span><span id="article-date"></span>
</div>
```

**AFTER:**
```html
<div id="article-byline" class="flex items-center text-xs text-gray-500 mb-12 border-b border-gray-100 dark:border-gray-800">
    <span id="article-author" class="font-semibold"></span><span class="mx-2">•</span><span id="article-date"></span>
</div>
```

Note: `pb-5` (or any `pb-*`) is intentionally removed; the padding-bottom is set in CSS in §8b.

### 8b. Symmetric byline/body padding in CSS

**Where:** In the `<style>` block, near other `#article-body` rules.

**ADD:**
```css
/* Guarantee breathing room around the byline border line — both above
   (between the byline text and the border) and below (between the border
   and the first paragraph of the body). Pixel values are immune to
   app-zoom rem scaling that was visually compressing Tailwind utilities. */
#article-byline { padding-bottom: 14px; }
#article-body { padding-top: 14px; }
```

**Why:** Same intent as the original `mb-12 pb-5` approach, but app-zoom was visually compressing rem-based Tailwind utilities. Explicit pixel padding on both sides (matched at 14px) gives a balanced, predictable gap. The value was tuned empirically: 28px felt too generous (made the article header feel detached from the body), 14px gives clear separation without dead space.

---

## 9. List/reader divider — resizer background with header-band exclusion

**Goal:** A visible vertical separator between the article list and the reader pane, but only **below** the 74px header band (so the top of the app reads as one continuous toolbar).

**Where:** The `#resizer` rule in the `<style>` block.

**BEFORE:**
```css
#resizer {
    width: 4px;
    cursor: col-resize;
    background-color: transparent;
    z-index: 50;
    flex-shrink: 0;
    transition: background-color 0.2s;
}
#resizer:hover, .resizing #resizer {
    background-color: #3b82f6;
}
```

**AFTER:**
```css
#resizer {
    width: 4px;
    cursor: col-resize;
    /* Transparent inside the 74px header band so the top reads as one
       unified bar; subtle divider color below. */
    background: linear-gradient(to bottom, transparent 0, transparent 74px, rgba(255, 255, 255, 0.06) 74px);
    z-index: 50;
    flex-shrink: 0;
    transition: background-color 0.2s, background 0.2s;
}
:root:not(.dark) #resizer {
    background: linear-gradient(to bottom, transparent 0, transparent 74px, rgba(0, 0, 0, 0.08) 74px);
}
#resizer:hover, .resizing #resizer {
    background: #3b82f6;
}
```

**Why:** The resizer was previously transparent. Adding a faint background turns it into a visible divider — but only starting below the header, so it doesn't poke up through the top toolbar.

---

## 10. Suppress sidebar/timeline pane `border-r` within header band

**Goal:** Same intent as item 9, applied to the other vertical divider (between sidebar and article list, and the right edge of the timeline pane).

**Where:** Add new CSS rules in the `<style>` block.

**ADD:**
```css
/* Suppress the sidebar/timeline pane border-r within the header band
   and re-draw it as a pseudo-element starting below the 74px header,
   so the top of the app reads as one continuous toolbar instead of
   three boxed segments. */
#sidebar-pane, #timeline-pane {
    border-right: none !important;
}
#sidebar-pane::after, #timeline-pane::after {
    content: '';
    position: absolute;
    top: 74px;
    bottom: 0;
    right: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.05);
    pointer-events: none;
    z-index: 5;
}
:root:not(.dark) #sidebar-pane::after,
:root:not(.dark) #timeline-pane::after {
    background: rgba(0, 0, 0, 0.1);
}
```

**Precondition:** `#sidebar-pane` and `#timeline-pane` must have `position: relative` for `::after` absolute positioning to anchor correctly. Both already do in the base template — verify before applying. If not, add `position: relative` to each pane.

**Why:** Pane borders that extend full-height fragment the top of the app into three visible boxes. Suppressing them inside the 74px header band and re-drawing below makes the header read as one continuous toolbar.

---

## 11. Floating Prev/Next nav reposition

**Goal:** After item 4, the reader content is left-aligned, but the floating prev/next chevrons stayed pinned to the pane's right edge — leaving them floating in dead space far from the article. Move them next to the article column instead.

**Where:** The `#desk-nav-float` rule in the `<style>` block.

**BEFORE:**
```css
#desk-nav-float {
    position: absolute;
    bottom: 24px;
    right: 28px;
    z-index: 20;
    flex-direction: column;
    gap: 5px;
}
```

**AFTER:**
```css
/* ===== DESKTOP FLOATING ARTICLE NAV =====
   Positioned to sit just to the right of the reader content column
   (max-w-2xl = 42rem, left-anchored with lg:ml-8 + lg:p-6 padding),
   so the buttons feel attached to the article instead of floating off
   in dead space on wide screens. */
#desk-nav-float {
    position: absolute;
    bottom: 24px;
    left: calc(1.5rem + 2rem + 42rem + 1rem); /* lg:p-6 + lg:ml-8 + max-w-2xl + gap */
    right: auto;
    z-index: 20;
    flex-direction: column;
    gap: 5px;
}
@media (max-width: 1023px) {
    #desk-nav-float {
        left: calc(1rem + 1rem + 42rem + 1rem); /* md:p-4 + md:ml-4 + max-w-2xl + gap */
    }
}
```

**Note:** The constants must match item 4's content container values. If you used different padding/margin classes there, recompute the `calc()`.

**Why:** Floating UI should feel attached to the content it acts on, not parked at the window edge.

---

## 12. Updated default slider preferences

**Goal:** Make the App Settings sliders default to the values that match the final intended look. The HTML `value=` attribute on each `<input type="range">` is the default for fresh installs / after a localStorage clear. Three sliders ship with values that don't match the current look-and-feel; update them.

**Where:** The slider markup inside `#settings-modal` (the Preferences tab). Each `<input>` has a distinctive `id=`.

| Slider id | BEFORE `value=` | AFTER `value=` | Display change |
|---|---|---|---|
| `shared-folder-slider` | `23` | `22` | Folder Size 1.15em → 1.1em |
| `feed-spacing-slider` | `4` | `6` | Row Spacing 0.20rem → 0.30rem |
| `shared-article-title-slider` | `11` | `13` | Reader Title Size 1.1em → 1.3em |

**BEFORE / AFTER** (only the `value=` attribute changes; everything else on each line stays):

```html
<input type="range" min="12" max="28" value="23" id="shared-folder-slider" ...>
<input type="range" min="2"  max="10" value="4"  id="feed-spacing-slider" ...>
<input type="range" min="4"  max="22" value="11" id="shared-article-title-slider" ...>
```

becomes:

```html
<input type="range" min="12" max="28" value="22" id="shared-folder-slider" ...>
<input type="range" min="2"  max="10" value="6"  id="feed-spacing-slider" ...>
<input type="range" min="4"  max="22" value="13" id="shared-article-title-slider" ...>
```

**Caveat:** This only affects new users / fresh installs / users who clear localStorage. Existing users keep whatever values are persisted in `localStorage` under the `newsreader_*` typography keys. If you want to force-reset, document that the user must clear those keys.

**Why:** The visible default sliders should match the intended visual identity of the app. Three sliders had defaults that produced slightly different sizes than the design intent (folder rows too tight, row spacing too cramped, reader title too small).

---

## 13. Mobile UI refinements

A cluster of mobile-specific (and one shared) tweaks. Some apply only on mobile (gated by `@media (max-width: 900px)`); others change shared sidebar markup that benefits both.

### 13a. Read Later count: amber instead of blue

**Goal:** "Saved for later" is semantically different from "unread." Using the same blue accent for both flattens the visual hierarchy.

**Where:** `#badge-read-later` span inside the smart-feeds card.

**BEFORE:**
```html
<span id="badge-read-later" class="feed-badge mob-unread-count text-blue-400 hidden">0</span>
```

**AFTER:**
```html
<span id="badge-read-later" class="feed-badge mob-saved-count text-amber-500 dark:text-amber-400 hidden">0</span>
```

Note also the class rename `mob-unread-count` → `mob-saved-count` — semantic, no current CSS depends on either, but signals intent.

### 13b. Hide refresh button on mobile

**Goal:** Pull-to-refresh is the canonical iOS/Android gesture for refreshing a list. The explicit refresh button is desktop-only convenience.

**Where:** Add an `id` to the existing refresh button in the sidebar header, then hide it in the mobile media query.

**Markup BEFORE:**
```html
<button onclick="refreshAll()" class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Refresh Feeds">
    <svg class="h-[22px] w-[22px]"><use href="#icon-refresh"/></svg>
</button>
```

**Markup AFTER:**
```html
<button id="header-refresh-btn" onclick="refreshAll()" class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Refresh Feeds">
    <svg class="h-[22px] w-[22px]"><use href="#icon-refresh"/></svg>
</button>
```

**CSS ADD:** Inside the existing `@media (max-width: 900px) { ... }` block:
```css
/* On mobile, pull-to-refresh replaces the explicit refresh button. */
#header-refresh-btn { display: none !important; }
/* Recently Read count adds noise on mobile where vertical space is at a
   premium and the row already reads clearly without it. Keep on desktop. */
#badge-recently-read { display: none !important; }
```

### 13c. Add Feed (+) icon in the sidebar header

**Goal:** Surface the most common new-user action (add a feed) one tap away, instead of buried in Settings.

**Where:** Insert a new button between refresh and settings in the sidebar header. Wires to the existing `openAddFeedModal()` function which is independent of the settings modal.

**ADD** (right after the refresh button, before the settings button):
```html
<button id="header-add-feed-btn" onclick="openAddFeedModal()" class="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500" title="Add Feed" aria-label="Add Feed">
    <svg class="h-[22px] w-[22px]"><use href="#icon-plus"/></svg>
</button>
```

The `#icon-plus` symbol should already exist in the project's icon `<defs>`. If not, add a minimal `<symbol id="icon-plus" viewBox="0 0 24 24" ...><path d="M12 5v14M5 12h14"/></symbol>`.

### 13d. Dim the "Today" row when redundant

**Goal:** When `todayCount === allUnreadCount`, the Today smart feed shows the same number as All Unread — informationally redundant. De-emphasize the row without hiding it.

**Where:** Inside `function updateBadges()`. Also a new CSS class.

**CSS ADD** (near other `.smart-feed-btn` rules):
```css
/* Smart-feed row marked redundant (e.g. Today == All Unread) — visually
   de-emphasized without hiding, so the user still knows the row exists. */
.smart-feed-btn.is-redundant { opacity: 0.45; }
.smart-feed-btn.is-redundant:hover { opacity: 0.7; }
.smart-feed-btn.is-redundant.active-item { opacity: 1; }
```

**JS** — at the end of `updateBadges()`, just before `document.title = ...`, ADD:
```js
// Dim the Today row when its count equals All Unread (i.e. everything unread
// is also from today) — in that case Today is informationally redundant with
// All Unread, so we de-emphasize it without hiding the row.
const todayBtn = document.getElementById('feed-btn-today');
if (todayBtn) {
    const redundant = todayCount > 0 && todayCount === allUnread;
    todayBtn.classList.toggle('is-redundant', redundant);
}
```

### 13e. Recently Read count badge

**Goal:** The "Recently Read" smart feed row had no count, making it look half-finished. Show the size of the 30-day read-archive cache.

**Where:** Two parts — the badge element in the sidebar markup, and an async primer that loads the count from IDB on startup.

**Markup BEFORE:**
```html
<button id="feed-btn-recently-read" ...>
    <span class="flex items-center">...Recently Read</span>
</button>
```

**Markup AFTER:** Add a badge span at the end of the button (mirrors the other smart-feed buttons):
```html
<button id="feed-btn-recently-read" ...>
    <span class="flex items-center">...Recently Read</span>
    <span id="badge-recently-read" class="feed-badge mob-archive-count text-gray-500 dark:text-gray-500 hidden">0</span>
</button>
```

**Updates inside `function updateBadges()`** — add to the variable list at the top:
```js
const recentlyReadCount = Array.isArray(window._readArchiveCache) ? window._readArchiveCache.length : null;
```

Add the lookup and conditional update (alongside the other badge updates):
```js
const badgeRecently = document.getElementById('badge-recently-read');
if (badgeRecently) {
    if (recentlyReadCount === null || recentlyReadCount === 0) {
        badgeRecently.classList.add('hidden');
    } else {
        badgeRecently.textContent = recentlyReadCount;
        badgeRecently.classList.remove('hidden');
    }
}
```

**Async primer** — `window._readArchiveCache` is normally loaded on first search-open or login-restore, but for a fresh page load we want the badge to show without waiting for the user to interact. ADD this IIFE next to `updateBadges()`:
```js
// Async refresher: on first load, the in-memory _readArchiveCache may not be
// populated yet. Pull the 30-day count from IDB once and call updateBadges so
// the Recently Read pill appears without waiting for the user to open search.
(function primeRecentlyReadCount() {
    const tryLoad = () => {
        if (!window.appDB || typeof window.appDB.getRecentlyRead !== 'function') {
            return setTimeout(tryLoad, 500);
        }
        window.appDB.getRecentlyRead(30).then(list => {
            if (Array.isArray(list)) {
                if (!Array.isArray(window._readArchiveCache)) window._readArchiveCache = list;
                if (typeof window.updateBadges === 'function') window.updateBadges();
            }
        }).catch(() => {});
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(tryLoad, 400));
    } else {
        setTimeout(tryLoad, 400);
    }
})();
```

The `30` should match the readArchive retention window (see the 30-day prune behavior added separately).

### 13f. Sidebar header drop shadow

**Goal:** Visual elevation cue so the header reads as fixed chrome above the scrolling card content below.

**Where:** Give the sidebar header a stable id, then add a soft drop-shadow in CSS.

**Markup BEFORE:**
```html
<div class="px-4 h-[74px] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
```

**Markup AFTER:**
```html
<div id="sidebar-header" class="px-4 h-[74px] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
```

**CSS ADD:**
```css
/* Sidebar header — small drop shadow below the existing border so the
   header reads as elevated chrome above the scrolling card content. */
#sidebar-header {
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.04), 0 4px 8px -4px rgba(0, 0, 0, 0.18);
    position: relative;
    z-index: 1;
}
.dark #sidebar-header {
    box-shadow: 0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 10px -4px rgba(0, 0, 0, 0.6);
}
```

### 13g. (Reverted) Per-category colored dots

**Status: do NOT apply.** This was tried, then removed.

The idea was to inject a small colored dot before each category name (hashed from category name → fixed palette of 10 colors). In practice it produced visual confetti without aiding scanning: hash collisions made unrelated categories share a color, and the colors carried no semantic meaning. Live test showed the dots created more cognitive overhead than they removed.

Documented here so the same idea doesn't get reinvented. Keep category rows as plain `chevron + name + count`.

---

## 15. Social (Bluesky/Mastodon) Preview Lines — independent line-clamp

**Goal:** The list-card excerpt clamp should be tight for news articles (3-4 lines) but generous for social posts (10+ lines) so microposts can be read in full from the list. Currently one global `Preview Lines` slider controls both.

### 15a. Add a second CSS variable and matching class

**CSS — root vars.** Change the default `--list-preview-lines` from 10 to 4 and add the new social vars. **BEFORE:**
```css
--list-preview-lines: 10;
--mob-list-preview-lines: 10;
```

**AFTER:**
```css
--list-preview-lines: 4;
--mob-list-preview-lines: 4;
--list-preview-lines-social: 10;
--mob-list-preview-lines-social: 10;
```

**CSS — line-clamp classes.** Existing `.line-clamp-custom` stays as-is (uses the regular var). ADD a parallel `.line-clamp-social`:
```css
/* Social (Bluesky / Mastodon) posts use a separate preview-lines var
   so the list can show a small clamp for news articles (4-ish lines)
   while still revealing full microposts. */
.line-clamp-social {
    display: -webkit-box;
    -webkit-line-clamp: var(--list-preview-lines-social, 10);
    line-clamp: var(--list-preview-lines-social, 10);
    -webkit-box-orient: vertical;
    overflow: hidden;
}
```

Inside the mobile media query, mirror the same pattern next to the existing `.line-clamp-custom` override:
```css
.line-clamp-social {
    -webkit-line-clamp: var(--mob-list-preview-lines-social, 10);
    line-clamp: var(--mob-list-preview-lines-social, 10);
}
```

### 15b. Swap class in `buildArticleCard` based on `isBsky`

**Where:** Inside `buildArticleCard`, the `previewCls` ternary.

**BEFORE:**
```js
const previewCls = isBsky
    ? 'text-gray-900 dark:text-white leading-relaxed line-clamp-custom dynamic-list-preview'
    : 'text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-custom dynamic-list-preview';
```

**AFTER:**
```js
const previewCls = isBsky
    ? 'text-gray-900 dark:text-white leading-relaxed line-clamp-social dynamic-list-preview'
    : 'text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-custom dynamic-list-preview';
```

### 15c. Add the second slider to App Settings

**Where:** Right after the existing `Preview Lines` row in the Article List settings section.

The regular `Preview Lines` slider's default `value=` also changes from `10` to `4` (and its label text from `"10 Lines"` to `"4 Lines"`).

**BEFORE:**
```html
<div class="settings-row settings-row-stacked">
    <div class="flex justify-between items-center">
        <span class="settings-item-label">Preview Lines</span>
        <span class="settings-value" id="lines-val">10 Lines</span>
    </div>
    <input type="range" min="2" max="15" value="10" id="lines-slider" class="settings-range" oninput="updateLines(this.value)">
</div>
```

**AFTER:**
```html
<div class="settings-row settings-row-stacked">
    <div class="flex justify-between items-center">
        <span class="settings-item-label">Preview Lines</span>
        <span class="settings-value" id="lines-val">4 Lines</span>
    </div>
    <input type="range" min="2" max="15" value="4" id="lines-slider" class="settings-range" oninput="updateLines(this.value)">
</div>
<div class="settings-row settings-row-stacked">
    <div class="flex justify-between items-center">
        <span class="settings-item-label">Social Preview Lines (Bluesky/Mastodon)</span>
        <span class="settings-value" id="lines-social-val">10 Lines</span>
    </div>
    <input type="range" min="2" max="20" value="10" id="lines-social-slider" class="settings-range" oninput="updateLinesSocial(this.value)">
</div>
```

### 15d. Add `updateLinesSocial` function

**Where:** Next to the existing `updateLines` function.

**ADD:**
```js
// Social (Bluesky / Mastodon) preview lines — independent slider so
// microposts can show fully while news articles stay compact.
window.updateLinesSocial = (v) => {
    const cssVar = isMobile() ? '--mob-list-preview-lines-social' : '--list-preview-lines-social';
    document.documentElement.style.setProperty(cssVar, v);
    const label = document.getElementById('lines-social-val');
    if (label) label.textContent = `${v} Lines`;
    renderTimeline();
    saveTypographyPrefs();
};
```

### 15e. Persistence in `saveTypographyPrefs` / `restoreTypographyPrefs`

**`saveTypographyPrefs` — ADD** the splitSave call alongside `previewLines`:
```js
const previewLinesSoc = splitSave('lines-social-slider',              'previewLinesSocialDesktop','previewLinesSocialMobile');
```
and spread it into the JSON payload alongside `...previewLines,`:
```js
...previewLines,
...previewLinesSoc,
```

**`restoreTypographyPrefs` — ADD** after the existing previewLines restore block:
```js
// Social preview lines — independent per-device value, same shape as above.
const linesSocDesk = prefs.previewLinesSocialDesktop;
const linesSocMob  = prefs.previewLinesSocialMobile;
if (linesSocDesk) root.style.setProperty('--list-preview-lines-social', linesSocDesk);
if (linesSocMob)  root.style.setProperty('--mob-list-preview-lines-social', linesSocMob);
const activeLinesSoc = mob ? linesSocMob : linesSocDesk;
if (activeLinesSoc) {
    const el = document.getElementById('lines-social-slider'); if (el) el.value = activeLinesSoc;
    const lb = document.getElementById('lines-social-val');    if (lb) lb.textContent = `${activeLinesSoc} Lines`;
}
```

### 15f. PER_DEVICE_SLIDER_CONFIG entry

**ADD** right below the existing `lines-slider` entry:
```js
{ sliderId: 'lines-social-slider',            labelId: 'lines-social-val',            deskKey: 'previewLinesSocialDesktop',mobKey: 'previewLinesSocialMobile',fmt: v => `${v} Lines`,                         apply: v => updateLinesSocial(v) },
```

**Why:** One global preview-line setting forced a tradeoff: tight clamp meant Bluesky posts got truncated; generous clamp meant news cards filled the screen. Splitting into two settings respects the structural difference between long-form articles (3-4 lines of excerpt is enough to decide) and microposts (often the whole point is to read the whole post in the list).

---

## 16. Mobile Articles tab: stable label, unread badge, long-press menu

**Goal:** Three intertwined changes that fix the overloaded Reader tab and surface Mark All Read in a discoverable place on mobile.

The original design used `updateReaderTabMode()` to mutate the **Reader tab's label** to show `✓ N` (unread count) when viewing the Articles pane, and tapping the Reader tab from the Articles pane invoked `markAllRead()`. Both were undiscoverable — tap targets shouldn't mutate their labels, and the action wasn't where users would look for it.

### 16a. Restore "Reader" as a stable label; reuse `updateReaderTabMode` to feed the Articles badge

**Where:** `function updateReaderTabMode()`.

**BEFORE:**
```js
function updateReaderTabMode() {
    const btn = document.getElementById('mob-tab-reader');
    const label = document.getElementById('mob-tab-reader-label');
    if (!btn || !label) return;
    btn.classList.remove('reader-progress');
    if (window._mobilePane === 'timeline') {
        const n = (window.currentTimeline || window.articles || []).filter(a => a.unread).length;
        label.textContent = n > 0 ? `✓ ${n}` : '✓ Read';
    } else if (window._mobilePane === 'viewer') {
        // ... category-unread count, also written into label.textContent ...
    } else {
        label.textContent = 'Reader';
    }
}
```

**AFTER:**
```js
function updateReaderTabMode() {
    const btn = document.getElementById('mob-tab-reader');
    const label = document.getElementById('mob-tab-reader-label');
    if (!btn || !label) return;
    btn.classList.remove('reader-progress');
    // Reader tab label is stable — it's a navigation target, not a counter.
    // Mark-all-read lives on the Articles tab via long-press now; per-view
    // unread counts surface as a badge on the Articles tab icon instead.
    label.textContent = 'Reader';
    // Keep the Articles tab unread badge in sync from the same update path.
    const artBadge = document.getElementById('mob-tab-articles-badge');
    if (artBadge) {
        const n = (window.currentTimeline || window.articles || []).filter(a => a.unread).length;
        if (n > 0) {
            artBadge.textContent = n > 99 ? '99+' : String(n);
            artBadge.classList.remove('hidden');
        } else {
            artBadge.classList.add('hidden');
        }
    }
}
```

### 16b. Remove the markAllRead invocation from `onReaderTabClick`

**Where:** The timeline branch of `window.onReaderTabClick`.

**BEFORE:**
```js
window.onReaderTabClick = () => {
    const pane = window._mobilePane;
    if (pane === 'timeline') {
        // Single-tap Mark Read from Articles → mark all + go Home + show Undo toast
        window.markAllRead({ withUndo: true });
        return;
    }
    // ... viewer branch unchanged ...
};
```

**AFTER:**
```js
window.onReaderTabClick = () => {
    const pane = window._mobilePane;
    if (pane === 'timeline') {
        // From Articles, single-tap Reader returns to the viewer pane.
        // Mark-all-read moved to long-press on the Articles tab.
        setMobilePane('viewer');
        return;
    }
    // ... viewer branch unchanged ...
};
```

### 16c. Add the unread-count badge to the Articles tab icon

**Where:** The Articles tab button markup. Wrap the icon in `.tab-ico-wrap` to anchor the absolute-positioned badge, and add the badge span.

**BEFORE:**
```html
<button id="mob-tab-articles" type="button" class="tab-btn" onclick="onArticlesTabClick()">
    <svg class="tab-ico" ...><path d="..."/></svg>
    <span class="tab-label">Articles</span>
</button>
```

**AFTER:**
```html
<button id="mob-tab-articles" type="button" class="tab-btn" onclick="onArticlesTabClick()">
    <span class="tab-ico-wrap">
        <svg class="tab-ico" ...><path d="..."/></svg>
        <span id="mob-tab-articles-badge" class="tab-icon-badge hidden" aria-hidden="true">0</span>
    </span>
    <span class="tab-label">Articles</span>
</button>
```

**CSS — ADD** near the other tab-bar rules:
```css
/* Articles tab unread badge — iOS-style pill on the icon corner.
   Wrap positions the badge relative to the icon (not the full button). */
.tab-ico-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
.tab-icon-badge {
    position: absolute;
    top: -6px;
    right: -10px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    background: #3b82f6;
    color: #fff;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    line-height: 18px;
    text-align: center;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.9);
    pointer-events: none;
}
```

### 16d. Long-press popover on the Articles tab

**HTML — ADD** at the same level as `</nav>` closing the tab bar (right after `</nav>`):
```html
<!-- Articles long-press popover menu (mobile). Triggered by holding the
     Articles tab. Contains Mark-All-Read for now; structured to add more
     actions later (Mark Today Read, etc.) without restructuring. -->
<div id="mob-articles-menu-scrim" onclick="closeArticlesMenu()"></div>
<div id="mob-articles-menu" role="menu" aria-label="Articles actions">
    <button type="button" onclick="closeArticlesMenu(); markAllRead();">
        <svg class="menu-icon" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>Mark all read</span>
    </button>
</div>
```

**CSS — ADD** alongside the tab-icon-badge styles:
```css
/* Articles long-press menu — small popover that floats above the tab bar
   when the user long-presses the Articles tab. */
#mob-articles-menu {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(env(safe-area-inset-bottom, 0px) + 96px);
    background: rgba(28, 28, 32, 0.96);
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 14px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.55);
    padding: 6px;
    min-width: 220px;
    z-index: 9500;
    display: none;
    animation: pop-in 0.14s ease-out;
}
#mob-articles-menu.is-open { display: block; }
#mob-articles-menu button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    border-radius: 10px;
    background: transparent;
    color: #fff;
    font-size: 15px;
    font-weight: 500;
    text-align: left;
}
#mob-articles-menu button:active { background: rgba(59, 130, 246, 0.22); }
#mob-articles-menu .menu-icon { width: 18px; height: 18px; flex-shrink: 0; opacity: 0.85; }
@keyframes pop-in {
    from { opacity: 0; transform: translateX(-50%) scale(0.95); }
    to   { opacity: 1; transform: translateX(-50%) scale(1); }
}
#mob-articles-menu-scrim {
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: 9499;
    display: none;
}
#mob-articles-menu-scrim.is-open { display: block; }
```

**JS — ADD** open/close helpers and long-press binding next to the Articles-tab click handler. Also patch `onArticlesTabClick` to swallow the click that follows a long-press:

```js
// Patch onArticlesTabClick to swallow the synthetic click that follows
// a long-press menu open. Add this as the first lines of the function.
if (window._mobArticlesMenuJustOpened) {
    window._mobArticlesMenuJustOpened = false;
    return;
}

// --- Articles tab long-press menu ---
// Holding the Articles tab opens a small popover with Mark All Read.
// 500ms hold threshold; finger movement > ~10px cancels (so a scroll
// gesture started near the tab doesn't accidentally trigger the menu).
window.openArticlesMenu = () => {
    const menu = document.getElementById('mob-articles-menu');
    const scrim = document.getElementById('mob-articles-menu-scrim');
    if (!menu || !scrim) return;
    menu.classList.add('is-open');
    scrim.classList.add('is-open');
    window._mobArticlesMenuJustOpened = true;
    if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) {} }
};
window.closeArticlesMenu = () => {
    const menu = document.getElementById('mob-articles-menu');
    const scrim = document.getElementById('mob-articles-menu-scrim');
    if (menu) menu.classList.remove('is-open');
    if (scrim) scrim.classList.remove('is-open');
};
(function bindArticlesTabLongPress() {
    const btn = document.getElementById('mob-tab-articles');
    if (!btn) return;
    let timer = null;
    let startX = 0, startY = 0;
    const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const onStart = (e) => {
        const t = e.touches ? e.touches[0] : e;
        startX = t.clientX; startY = t.clientY;
        cancel();
        timer = setTimeout(() => {
            timer = null;
            window.openArticlesMenu();
        }, 500);
    };
    const onMove = (e) => {
        if (!timer) return;
        const t = e.touches ? e.touches[0] : e;
        if (Math.hypot(t.clientX - startX, t.clientY - startY) > 10) cancel();
    };
    btn.addEventListener('touchstart', onStart, { passive: true });
    btn.addEventListener('touchmove',  onMove,  { passive: true });
    btn.addEventListener('touchend',   cancel,  { passive: true });
    btn.addEventListener('touchcancel', cancel, { passive: true });
    // Desktop testing convenience: right-click also opens the menu.
    btn.addEventListener('contextmenu', (e) => { e.preventDefault(); window.openArticlesMenu(); });
})();
```

**Why:** Mobile users had no labeled, discoverable way to Mark All Read — the only path was the cryptic `✓ N` label on the Reader tab. Moving the action to a long-press on the Articles tab puts it where users would semantically look ("operate on this tab's content"), uses standard iOS gesture vocabulary, and the popover gives room to grow with more Article actions later.

---

## 16.5. Remove Undo for Mark All Read (subsequent cleanup)

**Goal:** The Undo-Mark-All-Read flow was removed after live testing. Users found it unused — once they tap Mark All Read, they actually mean it. The flow's two helper functions (`restoreMarkedSnapshot` and `showToastWithAction`), the snapshot capture inside `markAllRead`, and the `_toastActionTimer` state all become dead code.

**Apply this section AFTER §16 if you're starting from a fresh fork that already had the Undo flow.**

### 16.5a. `markAllRead` — drop `opts.withUndo` branch, `markedSnapshot`, `filterCtx`, and the trailing `return`

**Where:** `window.markAllRead = (opts = {}) => { ... }`.

**BEFORE** (the parts being removed):
```js
// Capture filter context BEFORE marking, so undo can restore the same view
const filterCtx = {
    smart: window.currentSmartFeed,
    category: window.currentCategoryFilter,
    source: window.currentSourceFilter,
};
// ... toMark assignment unchanged ...
const markedSnapshot = toMark.filter(a => a.unread).map(a => ({ id: a.id, link: a.link }));
toMark.forEach(...);
// ... refreshUI, isSmartFeedWithFetch, etc., unchanged ...
// Undo flow: navigate to sidebar and show a sticky toast with an Undo button.
if (opts.withUndo && markedSnapshot.length > 0) {
    if (isMobile()) setMobilePane('sidebar');
    const snap = markedSnapshot;
    window.showToastWithAction(
        `Marked ${snap.length} read`,
        'Undo',
        () => window.restoreMarkedSnapshot(snap, filterCtx),
        6000
    );
    return markedSnapshot;
}
// ... rest of function ...
return markedSnapshot;
```

**AFTER:** Delete `filterCtx`, `markedSnapshot`, the entire `if (opts.withUndo ...)` block, and both `return markedSnapshot;` statements. The function returns `undefined` now (no caller uses the return value).

### 16.5b. Remove `window.restoreMarkedSnapshot`

**Where:** Function defined right above the `--- TYPOGRAPHY HANDLERS ---` comment block.

Delete the entire function — ~20 lines starting at `window.restoreMarkedSnapshot = (snapshot, filterCtx) => {` and ending at its closing `};`.

### 16.5c. Remove `window.showToastWithAction`

**Where:** Inside the `// --- TOAST QUEUE ---` block, between `window.showToast` and `window.hideToast`.

Delete the entire function (~30 lines starting at `// Show a toast with an inline action button (e.g. Undo).` and ending at its closing `};`).

### 16.5d. Remove orphaned `_toastActionTimer` state

**Where:** Two places.

1. **In the TOAST QUEUE init block** — remove the `window._toastActionTimer = null;` line that sits alongside `_toastQueue`, `_toastBusy`, `_toastSticky`.
2. **Inside `hideToast`** — remove the line `if (window._toastActionTimer) { clearTimeout(window._toastActionTimer); window._toastActionTimer = null; }`.

### 16.5e. Update the long-press menu binding

**Where:** Inside the Articles long-press popover HTML markup (from §16d).

**BEFORE:**
```html
<button type="button" onclick="closeArticlesMenu(); markAllRead({ withUndo: true });">
```

**AFTER:**
```html
<button type="button" onclick="closeArticlesMenu(); markAllRead();">
```

**Why:** Users in practice never invoked Undo. Removing it deletes ~70 lines of dead code, two `window.*` global functions, one orphan timer field, and simplifies `markAllRead`'s contract. The "Marked all read — fetching new items..." acknowledgment toast (already present in the non-undo branch) is sufficient feedback.

---

## 17. Service-worker cache version bump

**Goal:** After applying any visible HTML/CSS/JS changes, bump the SW cache name so users get the new app shell on next load instead of the stale cached one.

**Where:** Near the top of the inline `<script>` block that registers the service worker. Look for `CACHE_NAME`.

**BEFORE:**
```js
const CACHE_NAME = 'rss-reader-v62';
```

**AFTER:** Increment the suffix by one (`v63`, then `v64`, etc., once per release):
```js
const CACHE_NAME = 'rss-reader-v63';
```

The activate handler later in the SW (`event.waitUntil(caches.keys().then(...))`) reads the new name and evicts every cache that doesn't match it. Clients pick the new SW up on the next page load (sometimes requires one extra reload depending on the SW lifecycle).

**Why:** Without bumping the version, browsers keep serving the stale cached HTML and ignore any of the changes above.

---

## Apply order quick reference

1. Empty state contradiction (§1)
2. Badge rename + counter fix (§2a, §2b, §2c)
3. Active card stripe + card padding (§3a, §3b, §3c) — covers padding `py-4 → py-3` from old item 11
4. Reader margin (§4)
5. Header buttons → icons (§5a–§5f)
6. Date format (§6)
7. Source/timestamp colors (§7a, §7b)
8. Article body breathing room (§8a, §8b) — final values: 14px each side, via `#article-byline` ID
9. Resizer divider with header exclusion (§9)
10. Sidebar/timeline border-r suppressed in header (§10)
11. Prev/Next reposition (§11)
12. Default slider preferences (§12)
13. Mobile UI refinements (§13a–§13f). Skip §13g (reverted).
14. Social Preview Lines (§15a–§15f).
15. Mobile Articles tab — stable Reader label, unread badge, long-press menu (§16a–§16d).
16. Bump `CACHE_NAME` (§17) — last step, every time.

## Verification checklist

After applying, sanity-check in a browser:

**Desktop**

- [ ] Open with no feeds → middle pane shows "No feeds yet" (not "All caught up"); no Refresh button on the empty state.
- [ ] With feeds, no unread → middle pane shows "All caught up — You've read everything" with Refresh button.
- [ ] Header badge reads "Mark Read · N" and N matches the count of unread articles in the current filter.
- [ ] Wait for auto-refresh (or trigger one) → badge updates without user interaction.
- [ ] Click an article → cleanly visible 3px blue stripe on the left edge of the active card, no background tint.
- [ ] Article cards: source label noticeably brighter blue than the timestamp gray.
- [ ] On a wide window: reader content sits close to the article list; no large dead space on the left of the reader.
- [ ] Header action buttons are icons, not text. Hover gives tooltip. Mark Read/Mark Unread, Read Later/Saved/Remove, Listen/Stop, List/Card all swap icon + tooltip correctly.
- [ ] Reader date format: `May 19, 2026 · 1:11 PM` (long month, middot separator).
- [ ] Equal 14px gap above and below the byline horizontal line (between byline text → line, and line → first paragraph).
- [ ] Top of app reads as one continuous toolbar — no vertical "ticks" sticking up from pane dividers into the header.
- [ ] Pane dividers visible only below the 74px header.
- [ ] Prev/Next chevrons sit just to the right of the article column, not floating off at the window edge.
- [ ] Open App Settings → Preferences: defaults read Folder Size 1.1em, Row Spacing 0.30rem, Reader Title Size 1.3em (after a localStorage clear — existing users keep their saved values).

**Mobile**

- [ ] Sidebar header has only **two** icons (+ and gear) — no refresh icon visible.
- [ ] Tap the + icon → Add Feed modal opens.
- [ ] Read Later badge is amber/gold (not blue).
- [ ] Recently Read row does **not** show a count on mobile (count is desktop-only; row is plain on mobile).
- [ ] Reader tab label always says "Reader" — never mutates to "✓ N".
- [ ] Articles tab icon shows a small blue badge with the unread count when > 0; hidden when 0.
- [ ] Long-press the Articles tab → popover appears with "Mark all read" option; tap outside dismisses.
- [ ] App Settings → Article List shows two preview-lines sliders: "Preview Lines" (default 4) and "Social Preview Lines (Bluesky/Mastodon)" (default 10).
- [ ] News article cards in the list show ~4 lines of excerpt; Bluesky cards show ~10 lines (or whatever the social slider is set to).
- [ ] When Today count equals All Unread count, the Today row is visibly dimmer than the others (unless it's the active filter).
- [ ] Sidebar header has a subtle drop shadow separating it from the scrolling cards.
