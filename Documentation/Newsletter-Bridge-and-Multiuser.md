# Today — Inbound Newsletter Bridge & Multi-User Architecture

| Metadata | Value |
| :--- | :--- |
| **System** | Today (formerly RSS Reader) |
| **Build Target** | Build 368+ |
| **Status** | Active / Live in Production |
| **Primary Domain** | `today.dautovic.com` |
| **Worker Endpoint** | `https://today-newsletter-bridge.sdfyix.workers.dev/feed` |
| **KV Namespace** | `NEWSLETTER_KV` (ID: `9ee3a7cf49a54a72adab99f481358dbb`) |
| **Inbound Email** | `newsletters@dautovic.com` |

---

## 1. Executive Summary

**Today** includes a serverless, inbound email-to-RSS bridge that transforms email newsletters into clean, readable feed items without requiring a traditional mail server or third-party newsletter aggregator. Furthermore, Today supports multi-tenant isolation, allowing multiple independent users to maintain distinct feeds, read states, and personal newsletter inboxes.

This document details the architectural implementation, the proxy bypass rules, and the multi-user extension procedure.

---

## 2. Inbound Newsletter Bridge Architecture

The bridge is powered entirely by Cloudflare Email Routing, a Cloudflare Worker, and Cloudflare Workers KV.

```
Incoming Email
  │ (e.g. Substack, Axios, Morning Brew sent to newsletters@dautovic.com)
  ▼
Cloudflare Email Routing (Domain: dautovic.com)
  │ Rule: Match recipient -> Send to Worker
  ▼
Cloudflare Worker: today-newsletter-bridge
  │ (cloudflare-newsletter-worker.js)
  │ 1. Parse MIME payload (postal-mime parser or fallback regex)
  │ 2. Extract Subject, Sender, Date, and HTML/Text body
  │ 3. Store serialized item in Cloudflare KV (NEWSLETTER_KV)
  ▼
KV Store (Key: 'newsletter_items')
  │ Capped at 50 most recent newsletter issues
  ▼
HTTP GET /feed Request from Today
  │ Direct fetch (bypassing CORS proxy)
  ▼
Worker Generates RSS 2.0 XML
  │ Returns Content-Type: application/rss+xml; charset=utf-8
  │ Returns Access-Control-Allow-Origin: *
  ▼
Today App (index.html)
  │ Parses XML into standard article objects in the 'Newsletters' folder
```

### 2.1 Component Specifications

1. **Email Routing Rule (Cloudflare Dashboard):**
   * **Domain:** `dautovic.com`
   * **Custom Address:** `newsletters@dautovic.com`
   * **Action:** Send to Worker `today-newsletter-bridge`

2. **Cloudflare Worker (`today-newsletter-bridge`):**
   * Located at `proxy/cloudflare-newsletter-worker.js`.
   * Bound to KV namespace `NEWSLETTER_KV` via variable name `NEWSLETTER_KV`.
   * Implements two core handlers:
     * `async email(message, env, ctx)`: Handles raw inbound email events from Cloudflare Email Routing. Extracts plain text and HTML content, normalizes the sender name, generates unique GUIDs, and persists up to 50 items in KV.
     * `async fetch(request, env, ctx)`: Serves `/feed` as standard RSS 2.0 XML with full post bodies in `<content:encoded>` tags, and `/clear` (with basic token protection) for maintenance.

3. **Proxy Bypass Rule in `index.html`:**
   * Normally, Today routes cross-origin feeds through a CORS proxy worker (`still-shadow-1ebe.sdfyix.workers.dev`).
   * Cloudflare security prevents a Worker from calling another Worker on the same Cloudflare account via standard proxying (Cloudflare Error 1042: Worker subrequest loop).
   * In `fetchWithProxyFallback()`, any request to `*.workers.dev` or `dautovic.com` bypasses the CORS proxy and executes a direct browser `fetch()`, as `today-newsletter-bridge` already supplies explicit `Access-Control-Allow-Origin: *` headers.

---

## 3. Multi-User Architecture & Isolation

Today is designed so multiple individuals can use the application simultaneously without their reading data, feeds, or preferences colliding.

### 3.1 Three Tiers of Isolation

| Isolation Tier | Scope | Storage Mechanism | Collision Risk |
| :--- | :--- | :--- | :--- |
| **Tier 1: Guest / Device Mode** | Single Browser / Device | IndexedDB `RSSReaderDB` + `localStorage` | Zero. Data is completely local to the device. |
| **Tier 2: Firebase Auth Cloud Sync** | User Account across Devices | Firestore: `artifacts/{APP_ID}/users/{uid}/*` | Zero. Firestore security rules and path keys isolate each `uid`. |
| **Tier 3: Inbound Newsletter Bridge** | Shared Worker / Dedicated KV Keys | KV: `newsletter_items:${user}` | Isolated when partitioned by recipient address or token. |

### 3.2 Tier 1: Local / Guest Mode
If a user accesses `today.dautovic.com` without signing into Firebase (or on an isolated browser profile), the application uses local storage only:
* Feeds, folders, and settings live in `localStorage` and IndexedDB `RSSReaderDB`.
* No remote network sync occurs.
* Each person on their own device has a 100% private library.

### 3.3 Tier 2: Cloud Multi-Tenancy (Firebase Auth)
Today includes native user account management via Firebase Authentication:
* When a second user clicks **Account** $\rightarrow$ **Register** with their email and password, Firebase creates an independent user record with a unique `uid`.
* All user collections are strictly isolated by UID:
  * Feeds & Folders: `users/${uid}/feeds`
  * Read Hashes: `users/${uid}/state/readState`
  * UI Preferences: `users/${uid}/state/uiPrefs`
  * Saved / Read Later Snapshots: `users/${uid}/saved` and `users/${uid}/readLater`
* A newly registered user automatically starts with a clean set of default starter feeds (`The Verge`, `Ars Technica`, `BBC News`, `NPR News`) and has no access to another user's feeds or history.

### 3.4 Tier 3: Partitioning the Newsletter Bridge for Multiple Users

By default, the bridge uses a single key (`newsletter_items`) for `newsletters@dautovic.com`. If a second user (e.g. `bob` or `alice`) desires their own email newsletter inbox, the bridge can be partitioned as follows:

#### Step 1: Cloudflare Email Routing
Add an additional email routing address in the Cloudflare dashboard:
* **Custom address:** `alice@dautovic.com` (or `alice-newsletters@dautovic.com`)
* **Action:** Send to Worker `today-newsletter-bridge`

#### Step 2: Recipient Partitioning in `cloudflare-newsletter-worker.js`
Update the email handler to key items by recipient:
```javascript
// In async email(message, env, ctx):
const recipient = (message.to || '').split('@')[0].toLowerCase();
const kvKey = `newsletter_items:${recipient}`;

const raw = await env.NEWSLETTER_KV.get(kvKey);
let items = raw ? JSON.parse(raw) : [];
items.unshift(newItem);
if (items.length > 50) items = items.slice(0, 50);
await env.NEWSLETTER_KV.put(kvKey, JSON.stringify(items));
```

#### Step 3: Parametric Feed Generation in `cloudflare-newsletter-worker.js`
Update the HTTP fetch handler to read the user parameter:
```javascript
// In async fetch(request, env, ctx):
const url = new URL(request.url);
const user = url.searchParams.get('user') || 'newsletters';
const kvKey = `newsletter_items:${user.toLowerCase()}`;

const raw = await env.NEWSLETTER_KV.get(kvKey);
const items = raw ? JSON.parse(raw) : [];
// Generate RSS XML for user-specific items...
```

#### Step 4: Subscription in Today
* Primary user subscribes to: `https://today-newsletter-bridge.sdfyix.workers.dev/feed`
* Second user subscribes to: `https://today-newsletter-bridge.sdfyix.workers.dev/feed?user=alice`

---

## 4. Runbook: Adding a Newsletter to Today

1. Navigate to the desired newsletter subscription page (e.g., Substack, Beehiiv, Axios).
2. Enter the dedicated bridge email address (`newsletters@dautovic.com` or your partitioned address).
3. Confirm the subscription if a confirmation link is sent (check Today or run a temporary email forwarding rule).
4. In **Today**, open **Following** $\rightarrow$ **Edit feeds** $\rightarrow$ **Add Feed**.
5. Ensure the feed URL `https://today-newsletter-bridge.sdfyix.workers.dev/feed` is present in your **Newsletters** folder.
6. Subsequent issues appear in Today with full styling, original images, and publication headings.
