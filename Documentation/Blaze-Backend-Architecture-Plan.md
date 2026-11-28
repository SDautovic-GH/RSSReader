# Today — Firebase Blaze Backend Architecture Plan

| Key | Value |
| :--- | :--- |
| **Project** | Today — RSS Reader Web Application (`today.dautovic.com`) |
| **Document** | Architecture & Rollout Plan: Server-Side Extraction, Scheduled Polling & Cross-Device History |
| **Target Platform** | Firebase Blaze (Cloud Firestore + Cloud Functions v2 in `firebase-functions/` + Cloud Scheduler + Firestore TTL) |
| **Current Build** | Build 635 (`1ae5917` / functions `bafd845`) |
| **Date** | 2026-11-27 |
| **Status** | Phases 0–3 live in production; Phase 4 optional open tasks remain |

---

## 1. Executive Summary & Goals

Today currently runs as a client-heavy single-file PWA (`index.html`) hosted on Cloudflare Workers Builds (`today.dautovic.com`), using Firebase Spark strictly for multi-device sync of feeds, read state, UI preferences, `Saved`, and `Read Later`. All feed polling, XML parsing, and full-article extraction happen in the browser through CORS proxies (`still-shadow-1ebe.sdfyix.workers.dev` and `allorigins.win`).

Upgrading the Firebase project to the **Blaze (pay-as-you-go)** plan unlocks Cloud Functions v2 (with outbound HTTP access), Cloud Scheduler, and Firestore TTL while retaining the full Spark free tier. This plan targets **three high-value improvements** tailored specifically to actual reading habits:

1. **Fastest Possible Story Opens (Two-Tier Server-Side Extraction):** Pre-extract full articles in the background for user-selected priority/Top Stories sources (0 ms open), and use a fast server-side `@mozilla/readability` Cloud Function for everything else (~300–800 ms, no CORS proxy hops).
2. **Scheduled Server-Side Feed Polling:** Poll feeds every 20 minutes from Google's servers so opening Today on iPhone or desktop is instant and avoids mobile battery/memory churn and flaky public proxies.
3. **Cross-Device Reading History with 90-Day TTL:** Sync lightweight reading history across devices via Firestore and let Firestore TTL automatically purge entries older than 90 days.

**What stays untouched:**
- **Web hosting (`today.dautovic.com`)** remains on Cloudflare Workers Builds.
- **Inbound Newsletter Bridge (`newsletters@dautovic.com`)** remains on Cloudflare Email Routing + `today-newsletter-bridge` Worker + KV.
- **Single-file client delivery (`index.html`)** and **local IndexedDB cache** remain intact, with existing proxy extraction retained as an offline/fallback path during rollout.

---

## 2. Reading Habits & Workload Profile

This design is shaped directly around observed usage so compute, storage, and egress are never wasted:

| Dimension | Profile | Design Implication |
| :--- | :--- | :--- |
| **Feed Volume** | 50–150 feeds (news, tech, newsletters, Bluesky, YouTube) | Single scheduled poller every 20 min (72 runs/day) handles all feeds comfortably. |
| **Daily Story Volume** | 200–400 new stories/day (including small social posts) | Use delta sync (`fetchedAt > lastSync`) so devices only read newly arrived items. |
| **Read Ratio** | < 1/3 of stories opened (~60–120/day; ~20–50 truncated news articles) | Do **not** eagerly extract all 400 stories. Pre-extract only selected priority sources; extract the rest on demand. |
| **Cross-Device Re-opens** | Very rare to open the same story on multiple devices | Cache on-demand (Tier B) extractions in **local IndexedDB only** — do not write them back to Firestore. |
| **Priority Sources** | Top Stories sources & favorite truncated outlets are most likely to be read | Add a per-feed **`Pre-fetch full text`** toggle in Feed Manager (plus optional Top Stories folder boost) for 0 ms opens. |

---

## 3. Target Architecture

```
[Content Sources]
  ├── Standard RSS / Atom / YouTube Feeds
  ├── Bluesky Public API (already full-text; Tier C skip)
  └── Inbound Newsletters (Cloudflare Email Routing -> KV -> /feed; Tier C skip)
          │
          ▼
[Firebase Blaze Backend (us-central1)]
  ├── Cloud Scheduler (1 job, every 20 min)
  │     └── Function 1: pollFeeds (Cloud Functions v2, 512 MiB, minInstances: 0, maxInstances: 2)
  │           ├── Fetches user feeds directly (no CORS proxy)
  │           ├── Deduplicates & writes new items to Firestore (7-day TTL)
  │           └── Tier A: Runs @mozilla/readability on feeds with preExtract: true
  │
  └── Function 2: extractArticle (HTTPS Callable / Auth-verified, 512 MiB, minInstances: 0, maxInstances: 2)
        └── Tier B: On-demand @mozilla/readability + linkedom extraction
              └── Returns clean HTML to client (cached in local IndexedDB only)
          │
          ▼
[Cloud Firestore (artifacts/{APP_ID}/users/{uid}/*)]
  ├── feeds/{feedId}          (existing + preExtract: boolean)
  ├── state/readState         (existing)
  ├── state/uiPrefs           (existing)
  ├── saved/{linkId}          (existing, durable)
  ├── readLater/{linkId}      (existing, durable)
  ├── stories/{storyId}       (NEW: polled items + Tier A extracted body; expireAt: +7d TTL)
  └── history/{linkId}        (NEW: lightweight read log; expireAt: +90d TTL)
          │
          ▼
[Client PWA: today.dautovic.com (index.html)]
  ├── Delta syncs stories (where fetchedAt > lastSync) into IndexedDB
  ├── Tier A stories open in 0 ms (body already present)
  ├── Tier B stories call extractArticle() -> store in local IndexedDB
  └── Syncs opened stories (metadata only) to history/{linkId}
```

### 3.1 Three-Tier Extraction Strategy

| Tier | Which Sources | When Extracted | Where Cached | Expected Open Time |
| :--- | :--- | :--- | :--- | :--- |
| **Tier A (Priority Pre-Extract)** | Feeds toggled `Pre-fetch full text` in Feed Manager (e.g., Top Stories outlets, ESPN Soccer, favorite news/tech feeds) | Automatically during the 20-min `pollFeeds` run (only for new/truncated items) | Firestore `stories/{id}` (7-day TTL) + local IndexedDB | **0 ms (instant)** |
| **Tier B (Fast On-Demand)** | All other truncated RSS/Atom feeds | On tap when opening the story in Reader, via `extractArticle` Cloud Function | **Local IndexedDB only** (no Firestore write, since cross-device re-opens are rare) | **~300–800 ms** |
| **Tier C (Skip)** | Bluesky/social feeds & `today-newsletter-bridge` newsletters | Never (full content already in feed payload) | Standard feed cache | **0 ms (instant)** |

### 3.2 Client UI Additions (Minimal)

- **Feed Manager:** Add a **`Pre-fetch full text`** toggle switch beside each feed (or folder-level quick toggle), mirroring the existing `In Today` toggle styling. Persisted as `preExtract: true | false` on each feed document in `users/{uid}/feeds/{feedId}`.
- **Reader Fallback:** `extractArticle()` calls the Blaze Cloud Function first when signed in; if offline or if the function fails, falls back gracefully to the existing client-side proxy extraction pipeline.

---

## 4. Firestore Data Model & Security

All new collections follow the existing multi-tenant UID isolation path under `artifacts/{APP_ID}/users/{uid}/`:

### 4.1 `stories/{storyId}` (7-Day TTL)
```json
{
  "id": "sha256_or_link_hash",
  "link": "https://example.com/article",
  "title": "Headline",
  "source": "ESPN Soccer",
  "feedUrl": "https://...",
  "category": "Sports",
  "excerpt": "Short summary...",
  "body": "<p>Clean Readability HTML (Tier A only, else empty)</p>",
  "bodyExtracted": true,
  "image": "https://...",
  "publishedAt": 1795600000000,
  "fetchedAt": 1795600120000,
  "expireAt": "Timestamp (+7 days)"
}
```
- **TTL Policy:** Configured on `stories.expireAt` so Firestore automatically purges stories older than 7 days.
- **Delta Query:** Client queries `stories` where `fetchedAt > lastSyncTs` ordered by `fetchedAt`, keeping reads proportional to *new* stories only.

### 4.2 `history/{linkId}` (90-Day TTL)
```json
{
  "link": "https://example.com/article",
  "title": "Headline",
  "source": "ESPN Soccer",
  "feedUrl": "https://...",
  "excerpt": "Short summary...",
  "readAt": 1795601000000,
  "expireAt": "Timestamp (+90 days)"
}
```
- **Lightweight by design:** ~1 KB/document (no full HTML body).
- **TTL Policy:** Configured on `history.expireAt` (+90 days).

### 4.3 Security & Abuse Prevention
- **Firestore Security Rules:** Every collection under `artifacts/{APP_ID}/users/{uid}/` enforces `request.auth != null && request.auth.uid == uid`. `stories` is writable by the server Admin SDK (`pollFeeds`) and read-only for the owning client; `history` is read/write for the owning client with field-size validation.
- **Cloud Function Auth:** `extractArticle` verifies the caller's Firebase Auth ID token (`request.auth != null`) and rejects non-HTTP(S) or private-IP URLs (SSRF protection).
- **Concurrency Caps:** Both functions enforce `minInstances: 0` (zero idle cost) and `maxInstances: 2` (prevents runaway spend).

---

## 5. Monthly Cost & Quota Planning

Modeled at the **high end** of actual habits: **400 stories/day** (including social), **~80 Tier A pre-extractions/day**, **~30–50 Tier B on-demand extractions/day**, **~100 History writes/day**, and **2–3 devices**.

| Resource | Est. Monthly / Daily Usage | Blaze Free Tier | % Used | Est. Monthly Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Firestore Reads** | ~1,500–3,000 / day *(delta sync)* | 50,000 / day | 3–6% | **\$0.00** |
| **Firestore Writes** | ~500 / day *(stories + history + feeds)* | 20,000 / day | 2.5% | **\$0.00** |
| **Firestore Deletes (TTL)** | ~450 / day *(7d stories + 90d history)* | 20,000 / day | 2.3% | **\$0.00** |
| **Firestore Storage** | ~35–50 MB total | 1,024 MB (1 GiB) | 4–5% | **\$0.00** |
| **Cloud Functions Invocations** | ~3,700 / month *(2,160 polls + ~1,500 extracts)* | 2,000,000 / month | 0.2% | **\$0.00** |
| **Cloud Functions Compute** | ~20,000 GiB-s / month | 360,000–400,000 GiB-s | ~5% | **\$0.00** |
| **Cloud Scheduler** | 1 job *(20-min poller)* | 3 jobs / month | 33% | **\$0.00** |
| **Outbound Egress** | ~0.5–1.0 GB / month | 10 GiB (Firestore) + 5 GB (Functions) | < 10% | **\$0.00** |
| **Artifact Registry (v2 images)** | < 0.5 GiB *(with cleanup policy)* | 0.5 GiB / month | < 100% | **\$0.00 – \$0.15** |

- **Expected steady-state monthly bill:** **\$0.00 – \$0.25 / month**
- **Optional Firestore Automated Backups / PITR:** ~\$0.05 – \$0.15 / month for ~50 MB of data.
- **Required Billing Guardrails (before deploying any function):**
  1. Set a **Google Cloud Billing Budget Alert** at **\$5/month** (notifications at 50%, 90%, 100%).
  2. Configure an **Artifact Registry cleanup policy** to automatically delete old untagged container images (keeping only the latest 1–2 versions).
  3. Keep `minInstances: 0` and `maxInstances: 2` on all Cloud Functions.

---

## 6. Phased Rollout Plan

### Phase 0 — Blaze Activation & Guardrails (No Code Changes)
- Upgrade `rss-reader-fyi` to the Firebase Blaze plan.
- Set a **\$5/month** Billing Budget Alert in Google Cloud Billing.
- Configure an Artifact Registry cleanup policy for Cloud Functions v2 images.
- Verify existing app continues running identically with \$0 spend.

### Phase 1 — On-Demand Server-Side Extraction (`#3`, Tier B) — *Immediate Speed Win*
- Initialize `functions/` workspace (Node 20+, Cloud Functions v2, `@mozilla/readability`, `linkedom`, `dompurify`/sanitization).
- Deploy `extractArticle` (`minInstances: 0`, `maxInstances: 2`, Firebase Auth required, SSRF URL validation, 8s upstream timeout).
- Wire `index.html` to call `extractArticle` first for truncated stories, cache result in local IndexedDB, and fall back to existing proxy extraction if unavailable.
- **Verification:** Benchmark open time on ESPN Soccer, NYT, and Ars Technica on iPhone & desktop; confirm clean HTML and zero CORS/block regressions.

### Phase 2 — Scheduled Feed Poller + Priority Pre-Extraction (`#1`, Tier A) — *0 ms Opens*
- Add `preExtract` boolean field to feed documents and a **`Pre-fetch full text`** toggle in Feed Manager.
- Deploy `pollFeeds` scheduled Cloud Function (every 20 minutes via Cloud Scheduler) that fetches feeds, writes new stories to `stories/{storyId}` with `expireAt` (+7 days), and runs Readability for feeds with `preExtract: true`.
- Enable Firestore TTL policy on `stories.expireAt`.
- Update `index.html` to delta-sync `stories` (`fetchedAt > lastSync`) on startup while keeping manual Refresh functional.
- **Verification:** Confirm `Today` opens with fresh stories immediately and Tier A stories open with zero extraction spinner.

### Phase 3 — Cross-Device Reading History with 90-Day TTL (`#2`)
- Add `history/{linkId}` Firestore bucket (metadata only, `expireAt` = +90 days) mirroring `savedBucket` / `readLaterBucket` patterns.
- Enable Firestore TTL policy on `history.expireAt`.
- Merge remote history into IndexedDB `recently-read` so History stays consistent across iPhone and desktop.
- **Verification:** Open a story on iPhone, confirm it appears in desktop History within seconds, and verify `expireAt` is set to +90 days.

### Phase 4 — Open Tasks (Optional, After 1–2 Weeks of Soaking)
- [ ] **Billing sanity check:** Confirm spend at https://console.firebase.google.com/project/rss-reader-fyi/usage/details stays at ~\$0.00/mo under 15-minute `pollFeeds` + `304` `ETag`/`If-Modified-Since` caching.
- [ ] **Optional backups / PITR:** Decide whether to enable scheduled Firestore backups or Point-in-Time Recovery (~\$0.05–\$0.15/mo for `feeds`, `saved`, and `readLater`).
- [ ] **Retire `allorigins.win` fallback:** Remove `allorigins.win` once `extractArticle` and `pollFeeds` prove stable over 2+ weeks.
- [ ] **Update `Today-PRD-v3.0.md`:** Record the Blaze backend topology and unified `#16191f` dark theme when ready.

### Deployed Implementation Notes (Phases 0–3)
- **Cloudflare Pages compatibility:** Functions live in `firebase-functions/` (not root `functions/`, which Cloudflare Pages compiles as Pages Functions and fails deploys).
- **Scheduler & `304` caching:** `pollFeeds` runs on a 15-minute Cloud Scheduler tick, honors each user's `state/uiPrefs.autoRefresh` interval (e.g., 15 / 30 / 60 min or 0 = Manual), and caches `ETag` / `If-Modified-Since` validators in `state/pollMeta.feedValidators` to skip unchanged `304` feeds.
- **Default-on Tier A pre-fetch:** All non-social, non-newsletter, non-YouTube feeds pre-extract full text by default (`feed.preExtract !== false`), with a blue `⚡` opt-out toggle per feed in **Edit Feeds**.
- **Calm parallel startup:** On background startup (`isBackground: true`), `runFullRefresh()` runs `pullCloudStories()` in parallel with client-only feeds (Bluesky + Newsletters) and paints `Today` once when both complete.
- **Guardrails active:** \$5/month hard spend cap on Cloud Run Functions; 1-day Artifact Registry image cleanup policy; `minInstances: 0`; `maxInstances: 2` (`extractArticle`) / `1` (`pollFeeds`); Firestore TTL policies active on `stories.expireAt` (7d) and `history.expireAt` (90d).
