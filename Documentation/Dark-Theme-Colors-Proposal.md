# Dark Theme Colors: Proposal

| Key | Value |
| :--- | :--- |
| Project | RSS Reader Web Application (`today.dautovic.com`) |
| Document | Proposal: dark-theme background and link colors |
| Target File | `index.html` |
| Measured On | Build 531 (commit `38741cd`) |
| Date | 2026-11-23 |
| Status | Proposed, not applied |

---

## 1. Why

The dark theme draws every pane on `#0d1117`, a near-black with a blue tint (GitHub's dark canvas). Light text on near-black has the strongest possible contrast, and over long reading it glows: letters seem to bleed into the background (halation), more so for readers with astigmatism. A reading page compared side by side (Dave Winer's Markdown web page) uses a dark grey, `#1a1c1f`, and reads noticeably softer. Apple's and Google's dark themes use grey backgrounds for the same reason.

The proposal lifts the stories' panes to the house dark "paper" color, keeps the sidebar darker so the step in color separates the panes without a divider line, and adjusts the one color that the change pushes below the contrast minimum.

House tokens (`ScriptLibrary\DesignSystem\README.md`): dark canvas `#0b0d10`, dark paper `#16191f`, dark accent `#4d7cc7`, dark accent hover `#5d8cd7`.

## 2. Replacements

### 2.1 Pane backgrounds

Where: `.dark body`, `.dark #app-container`, `.dark #timeline-pane`, `.dark #viewer-pane` (the "DEEP DARK THEME" block, about line 2318); `--surface-sheet` in the `html.dark` tokens (line 459); `.dark .brief-jump-bar` (line 5408); `.jump-top-btn` on the desktop (line 4412).

replace:
`#0d1117` with `#16191f`

### 2.2 Sidebar

Where: `.dark #sidebar-pane` and `.dark #sidebar-pane .p-4` (lines 2329-2336); the sidebar's `dark:bg-[#0d1117]` class (line 8131); the unread badge's ring fallback `var(--bg, #0d1117)` (line 3797), which sits on the sidebar.

replace:
`#0d1117` with `#0b0d10`

### 2.3 Link text in stories (dark theme only)

replace:
`#4d7cc7` with `#5d8cd7`

Required by 2.1, not a matter of taste: the current link blue passes the 4.5:1 minimum for body text on `#0d1117` by a hair (4.53:1) and fails on `#16191f` (4.21:1). Buttons keep `#4d7cc7`, because white text on `#5d8cd7` would fall to 3.39:1.

### 2.4 Kept as they are

| Element | Color | On `#0d1117` (now) | On `#16191f` (proposed) |
| :--- | :--- | :--- | :--- |
| Headlines | `#f0f6fc` | 17.39:1 | 16.17:1 |
| Summaries (`--text-2`) | `#ccd2d8` | 12.42:1 | 11.55:1 |
| Source, time, counts (`--text-3`) | `#8b949e` | 6.15:1 | 5.72:1 |
| Link blue (current) | `#4d7cc7` | 4.53:1 | 4.21:1 (fails; see 2.3) |
| Link blue (proposed) | `#5d8cd7` | n/a | 5.20:1 |

Contrast is WCAG 2 relative luminance. The headlines are already semibold (600) and the summaries already a bright grey, so neither needs a change; what makes them look dim today is the near-black background.

## 3. Checks Before Publishing

- Line numbers are from build 531; re-find each rule by its selector before editing. `#0d1117` appears 15 times in `index.html` (some in comments, which should be updated to match).
- Light theme is untouched.
- Screenshots before and after, desktop dark: Today, a folder, an open story (full page and beside the list), the collapsed rail, Settings. Phone dark keeps its own black and is out of scope unless asked.
- Look for anything else painted `#0d1117` to blend with the pane (sticky headers, masks, the new-stories pill's backing) and move it with the pane, or it shows as a dark strip on `#16191f`.
- Record the change in `Today-PRD-v3.0.md` once applied.
- The desktop app (`ScriptLibrary\APPS\RSSReader`) takes the change on its next `Sync-WebUI.py` run; nothing to do there.
