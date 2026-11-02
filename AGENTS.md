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
| **[Documentation/Redesign-Plan-Two-Pane.md](Documentation/Redesign-Plan-Two-Pane.md)** | Architectural plan, build log, and design decisions for the 2-Pane workstation layout. |

---

## 2. Non-Negotiable Repository Invariants

| Invariant | Rule |
| :--- | :--- |
| **Line 37 Static Tailwind Tag** | Line 37 of `index.html` must remain exactly: `    <style id="tailwind-static">/*! tailwindcss v4.2.4 | MIT License | https://tailwindcss.com */`. Never delete, modify, or shift this line. |
| **Standalone RSS Repo** | `~/Developer/RSSReader` (Windows: `C:\.Developer\RSSReader\`) is a standalone repository for the web app. Never touch `PROJECTS\RSSReader\` in `ScriptLibrary` during web app work (the desktop companion only reads `index.html`). |
| **Pure Markdown Documentation** | Documentation files use pure Markdown tables (`\| Key \| Value \|`), never YAML front-matter (`--- ... ---`). File naming follows hyphenated conventions (`<Name>-<Type>-v<X.Y>.md`). |
| **Cross-OS Sync & Deploy Pipeline** | Synchronization between dev workstations (macOS local clone in `~/Developer/RSSReader`, Windows in `C:\.Developer\RSSReader\`) runs through `SyncGit-macOS-RSSReader.ps1` and `SyncGit-RSSReader.ps1`. Pushing to `origin/main` automatically triggers Cloudflare Workers Builds to deploy globally to `today.dautovic.com` in ~20 seconds. Never edit in cloud drive mirrors. To override local state with remote commits, execute: `git fetch origin main && git reset --hard origin/main && git clean -fd`. |
| **The "Calm App" Mandate** | In Today and card views, nothing on screen may move unexpectedly. Elements only move upon the user's direct, instantaneous action. Never introduce delayed shifts (e.g. 3–5 seconds later after undo or cloud sync). Automatic updates must wait off-screen via `keepTodayInPlace` and the "N new stories" pill. Transient UI (such as undo toasts) floats over the page and never reserves layout space that collapses later. |
| **Source-First Card Anatomy** | Every story card across Today, Unread, folders, and personal hub must lead with: `[Repost attribution]` -> `[Source / Author + Timestamp + Triage Actions: Mark Read, Read Later, …]` -> `[Title & Excerpt]` -> `[Floating Thumbnail top-right]`. Re-ordering during renders is managed by `normalizeBriefDOM` and `placeBriefThumb`. |
| **Device Detection vs CSS Consistency** | Phone CSS must be scoped to `@media (max-width: 900px) and (hover: none), (max-width: 900px) and (pointer: coarse)`. Desktop CSS must be scoped to `@media (min-width: 901px), (hover: hover) and (pointer: fine)`. Never use raw width-only media queries for desktop layouts, as mouse devices in narrow split-screen windows must retain desktop navigation. |
| **No Blind `!important` Removal** | The Build 471 empirical audit proved 714 of 1,272 `!important` declarations resolve real priority races against runtime script-set inline styles (swipes, drags, sheet placements). Never bulk-strip `!important` without a complete CSSOM-to-source mapping and multi-view state verification. |
| **Comment & Code Hygiene ("Why, Not When")** | Comments in `index.html` state the reason or invariant in 1–3 lines. Never include build numbers, dates, user quotes, or historical narration ("it used to be X") in code comments; that context belongs in `Documentation/Today-PRD-v3.0.md` and `Redesign-Plan-Two-Pane.md`. Delete replaced code and obsolete comments in the same change. |
| **Design System & Palette** | Use CSS design tokens `--accent` and `--accent-rgb` for interactive actions. Do not introduce hardcoded ad-hoc blue hex values. Maintain neutral surface tones per the WilmerHale design system. |
| **Build Versioning on Production Push** | Any deployable update to `index.html` must increment `window.APP_BUILD` and match `const CACHE_NAME = 'rss-reader-v<N>'`. |

---

## 3. Platform Pitfalls & Critical Guardrails (DO NOT REPEAT)

| Pitfall / Hazard | Root Cause & Mandate |
| :--- | :--- |
| **Desktop Companion Anchors** | `PROJECTS/RSSReader/Sync-WebUI.py` (in `ScriptLibrary`) generates the desktop Python companion by searching for exact comment anchors in `index.html`: `<!-- FIREBASE MODULE -->` and `<!-- PWA Service Worker...-->`. **Never rename, move, or delete these anchor comments**, or the desktop companion build will break silently. |
| **Temporal Dead Zone (TDZ) Crash** | `index.html` runs as a monolithic script block. `let _isMobileCache` and `isMobile()` are declared late in the script (~line 7,600). **Top-level code or IIFEs added earlier must NEVER invoke `isMobile()`** or any `let`/`const` declared later. A TDZ `ReferenceError` aborts the entire script block before `initApp()` executes, blanking the application. Standard `node -c` syntax checks cannot catch this execution order bug. |
| **Tailwind `@layer` Cascade Reversal & `.hidden`** | In the CSS cascade, layered `!important` declarations (inside `<style id="tailwind-static">`) reverse order and defeat unlayered `!important` rules regardless of selector specificity. Furthermore, `.hidden { display: none !important }` resides inside `@layer utilities` and cannot be overridden by CSS rules; always toggle visibility in JavaScript by adding/removing the `hidden` class or using parent state classes. When overriding compiled utilities, patch the CSSOM rule directly in JS rather than piling on CSS selectors. |
| **iPhone Safari 115% Zoom & Viewport Deception** | The user runs Safari Page Zoom at 115% by choice (`visualViewport.scale = 1.15`). Under this zoom, iOS WebKit frequently under-reports `innerHeight`, `dvh`, and `visualViewport.height` during relayouts. Fixed bottom bars and overlays must never rely on live viewport calculations; they must respect the established `lockMobileLayoutHeight()` body lock. Never suggest disabling the 115% zoom. |
| **Single-Tap Mark Read with Immediate Collapse** | On mobile, marking a story read must immediately collapse the card and surface a floating Undo toast. Never introduce a double-tap requirement or delayed timers (e.g. 3–5 seconds) that shift layout under the user's thumb. |

---

## 4. Operational Verification Protocol

Before declaring any task, bugfix, or refactoring complete:

1. **Syntax & AST Validation:**
   Run automated JavaScript syntax checks on all inline script blocks (`node -e` parsing) and verify CSS brace balancing.
2. **Empirical Measurement:**
   Never assume layout fixes work by theory alone. Measure actual rendered coordinates, verify bounding rects, and test split-screen / narrow resize states.
3. **Clean Git State:**
   Ensure `git status` reports only the intended files modified, with zero stray temporary files or unvetted diffs.
