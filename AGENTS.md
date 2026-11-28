# AGENTS.md

Universal AI agent operating instructions for `RSSReader` (`today.dautovic.com`).
This file governs autonomous AI coding assistants across all platforms (Google Antigravity, Anthropic Claude Code, Gemini, OpenAI Codex, Cursor, GitHub Copilot).

---

## 1. System Navigation & Sources of Truth

Always consult the project documentation before modifying any code:

| Document | Purpose |
| :--- | :--- |
| **[Documentation/Today-PRD-v3.0.md](Documentation/Today-PRD-v3.0.md)** | Product Requirements Document: feature catalog, workstation mode classes, pane matrix, and non-negotiable guardrails (Section 5). |
| **[Documentation/Today-UserGuide.md](Documentation/Today-UserGuide.md)** | Comprehensive user manual, view switcher behavior, keyboard triage reference, and gestures. |
| **[Documentation/Blaze-Backend-Architecture-Plan.md](Documentation/Blaze-Backend-Architecture-Plan.md)** | Firebase Blaze backend architecture (`extractArticle`, `pollFeeds`, 7d/90d Firestore TTL), cost guardrails, and Phase 4 open tasks. |
| **[Documentation/Dark-Theme-Colors-Proposal.md](Documentation/Dark-Theme-Colors-Proposal.md)** | Unified `#16191f` dark paper canvas (panes + sidebar) and `#5d8cd7` story link contrast decision. |
| **[Documentation/Newsletter-Bridge-and-Multiuser.md](Documentation/Newsletter-Bridge-and-Multiuser.md)** | Cloudflare Email Routing + `today-newsletter-bridge` Worker + KV newsletter-to-RSS bridge and multi-tenant isolation. |
| **[Documentation/Redesign-Plan-Two-Pane.md](Documentation/Redesign-Plan-Two-Pane.md)** | Architectural plan, build log, and design decisions for the 2-Pane workstation layout. |

---

## 2. Non-Negotiable Repository Invariants

| Invariant | Rule |
| :--- | :--- |
| **Line 37 Static Tailwind Tag** | `<style id="tailwind-static">/*! tailwindcss v4.2.4 \| MIT License \| https://tailwindcss.com */` is a frozen compiled utility snapshot. Never delete or corrupt it, and never rely on newly invented Tailwind classes without verifying they exist in `#tailwind-static` (checked by `scripts/check-rss.mjs`). |
| **Standalone RSS Repo** | `~/Developer/RSSReader` (Windows: `C:\.Developer\RSSReader\`) is a standalone repository for the web app. Never touch `APPS\RSSReader\` in `ScriptLibrary` during web app work (the desktop companion only reads `index.html`). |
| **Firebase Functions Folder (`firebase-functions/`)** | **Never name the Firebase Functions folder `functions/` at the repo root.** Cloudflare Pages automatically compiles any root `functions/` directory as Cloudflare Pages Functions, failing deploys and silently freezing `today.dautovic.com` on the previous build. Keep Firebase Functions in `firebase-functions/` (`firebase.json` `"source": "firebase-functions"`). |
| **Pure Markdown Documentation** | Documentation files use pure Markdown tables (`\| Key \| Value \|`), never YAML front-matter (`--- ... ---`). File naming follows hyphenated conventions (`<Name>-<Type>-v<X.Y>.md`). |
| **Cross-OS Sync & Deploy Pipeline** | Pushing to `origin/main` automatically deploys `today.dautovic.com` via Cloudflare Pages in ~20 seconds. Deploy Firebase Cloud Functions separately via `npx -y firebase-tools@latest deploy --only functions --project rss-reader-fyi`. Never edit in cloud drive mirrors. |
| **The "Calm App" Mandate** | In Today and card views, nothing on screen may move unexpectedly. Elements only move upon the user's direct, instantaneous action. On background startup, `runFullRefresh()` runs `pullCloudStories()` in parallel with client-only feeds (Bluesky + Newsletters) and paints `Today` **once** when both finish — never paint mid-refresh and silently reshuffle later. |
| **Source-First Card Anatomy** | Every story card across Today, Unread, folders, and personal hub must lead with: `[Repost attribution]` -> `[Source / Author + Timestamp + Triage Actions: Mark Read, Read Later, …]` -> `[Title & Excerpt]` -> `[Floating Thumbnail top-right]`. Re-ordering during renders is managed by `normalizeBriefDOM` and `placeBriefThumb`. |
| **Device Detection vs CSS Consistency** | Phone CSS must be scoped to `@media (max-width: 900px) and (hover: none), (max-width: 900px) and (pointer: coarse)`. Desktop CSS must be scoped to `@media (min-width: 901px), (hover: hover) and (pointer: fine)`. Never use raw width-only media queries for desktop layouts. |
| **No Blind `!important` Removal** | The Build 471 empirical audit proved 714 of 1,272 `!important` declarations resolve real priority races against runtime script-set inline styles. Never bulk-strip `!important` without CSSOM-to-source verification. |
| **Comment & Code Hygiene ("Why, Not When")** | Comments in `index.html` state the reason or invariant in 1–3 lines. Never include build numbers, dates, user quotes, or historical narration in code comments; track history in PRDs/docs. Delete replaced code in the same change. |
| **Design System & Dark Palette** | Unified `#16191f` across desktop dark panes **and** sidebar (never `#0b0d10` on the sidebar — Build 622 proved it creates an unwanted dark stripe). Use `--accent: #4d7cc7` (`#3d6bb0` light) for buttons and active rail items, and `#5d8cd7` for dark-mode story link text (`5.20:1` on `#16191f`). Collapsed rail indicates selection with filled + `var(--accent)` icon & label (no active background pill). |
| **Build Versioning on Production Push** | Any deployable update to `index.html` must increment `window.APP_BUILD` and match `const CACHE_NAME = 'rss-reader-v<N>'` in `sw.js` (automated via `node scripts/check-rss.mjs --bump --smoke`). |

---

## 3. Firebase Blaze Backend Architecture (`rss-reader-fyi`)

- **`extractArticle` (`us-central1`, Node 22, 512 MiB, `minInstances: 0`, `maxInstances: 2`):** HTTPS v2 function verifying Firebase Auth ID tokens (`Authorization: Bearer`), blocking SSRF/private IPs, running `@mozilla/readability` + `linkedom`. Client calls it first in `attemptFullContentLoad()`, caches Tier B results in **local IndexedDB only**, and falls back to the CORS proxy loop on failure.
- **`pollFeeds` (`us-central1`, Node 22, 512 MiB, `minInstances: 0`, `maxInstances: 1`):** 15-minute Cloud Scheduler tick honoring each user's `state/uiPrefs.autoRefresh` interval (with 2-min jitter tolerance) and `ETag` / `If-Modified-Since` (`304` skip persisted in `state/pollMeta.feedValidators`). Writes new RSS/Atom stories to `users/{uid}/stories` (7-day TTL on `expireAt`) and pre-extracts full text by default (`feed.preExtract !== false`) for all non-social, non-newsletter, non-YouTube feeds.
- **`history` (`users/{uid}/history`, 90-day TTL on `expireAt`):** Lightweight metadata-only (~1 KB/doc) cross-device Reading History synced via `syncCloudHistory()` into local IndexedDB `readArchive`.
- **Billing & Ops Guardrails:** \$5/month hard spend cap on Cloud Run Functions; 1-day Artifact Registry image cleanup policy; **never** set `minInstances > 0`; Firestore TTL policies active on `stories.expireAt` and `history.expireAt`.

---

## 4. Platform Pitfalls & Dead Ends (DO NOT REPEAT)

| Pitfall / Dead End | Root Cause & Mandate |
| :--- | :--- |
| **Root `functions/` Breaks Cloudflare Pages** | Cloudflare Pages mistakes `functions/` for Pages Functions. Always keep Firebase Functions in `firebase-functions/`. |
| **Missing `#tailwind-static` Classes Blow Up SVGs** | Utility classes absent from `<style id="tailwind-static">` (e.g., `w-8`, `h-8`, `opacity-35`) silently no-op, leaving `<svg>` at `300×150`. Always verify with `node scripts/check-rss.mjs --smoke`. |
| **`todayOnScreen()` Overwriting `Later`/`Saved`/`History`** | `window._todayInColumn` is `true` for all desktop card views, not just Today. `todayOnScreen()` must check that Today is actually active, or status/refresh passes overwrite `Later`/`Saved`/`History` with Today. |
| **Double-Background Specificity on Collapsed Rail** | `#smart-feeds-card .smart-feed-btn.active-item` (ID specificity) overrides `body.sidebar-collapsed .smart-feed-btn.active-item` (class specificity). Always include `#smart-feeds-card` in collapsed-rail overrides. |
| **Dark `#0b0d10` Sidebar Stripe** | Tested in Build 622 and rejected; keep desktop dark sidebar unified with `#16191f` reading panes. |
| **Pre-Paint Two-Column Split Flash** | `desktop-today-cards-wide` must be applied synchronously in the pre-paint `<script>` right after `<body>` on desktop so `#viewer-pane` never flashes before `openToday()` runs. |
| **Desktop Companion Anchors** | `APPS/RSSReader/Sync-WebUI.py` searches for `<!-- FIREBASE MODULE -->` and `<!-- PWA Service Worker...-->`. Never rename, move, or delete these comments. |
| **Temporal Dead Zone (TDZ) Crash** | `let _isMobileCache` and `isMobile()` are declared late in `index.html`. Top-level code added earlier must never call `isMobile()`. |
| **Tailwind `@layer` Cascade Reversal & `.hidden`** | Layered `!important` inside `#tailwind-static` beats unlayered `!important`. Toggle `.hidden` in JS rather than overriding with CSS; patch CSSOM in JS when overriding compiled utilities. |
| **iPhone Safari 115% Zoom & Viewport Deception** | User runs Safari Page Zoom at 115%. Fixed bottom bars/overlays must respect `lockMobileLayoutHeight()` — never suggest disabling 115% zoom. |

---

## 5. Operational Verification Protocol

Before declaring any task, bugfix, or deploy complete:

1. **Run `scripts/check-rss.mjs`:**
   - Use `node scripts/check-rss.mjs --bump --smoke` (or `--smoke` without `--bump` when checking without a version increment).
   - Verifies `APP_BUILD` ↔ `sw.js` `CACHE_NAME` sync, CSS `{`/`}` brace balance, `vm.Script` JS parsing (classic, ES module, `sw.js`), static-Tailwind SVG utility coverage, and 4 headless Chrome viewports (`desktop-dark-collapsed`, `desktop-light-collapsed`, `mobile-dark`, `mobile-light`) for zero overflow and zero oversized SVGs.
2. **Clean Git State:**
   Ensure `git status` reports only intended files modified, with zero stray temp files or unvetted diffs.
