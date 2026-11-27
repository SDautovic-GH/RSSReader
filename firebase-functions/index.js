import crypto from 'node:crypto';
import { onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import { XMLParser } from 'fast-xml-parser';

initializeApp();
const db = getFirestore();

const APP_ID = 'rss-reader-fyi';
const BLOCKED_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[::1\]|.*\.local$|.*\.internal$)/i;
const OG_JUNK_RE = /logo|sprite|default|placeholder|avatar|blank|fallback|site_upload|banner|missing/i;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    trimValues: true,
    parseTagValue: false,
});

function isSafeHttpUrl(raw) {
    try {
        const u = new URL(raw);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        if (BLOCKED_HOST_RE.test(u.hostname)) return false;
        return true;
    } catch {
        return false;
    }
}

function absolutizeUrls(root, baseUrl) {
    for (const el of root.querySelectorAll('[src], [href], [data-src]')) {
        for (const attr of ['src', 'href', 'data-src']) {
            const val = el.getAttribute(attr);
            if (!val || /^(?:https?:|mailto:|tel:|#|data:)/i.test(val)) continue;
            try {
                const abs = new URL(val, baseUrl).href;
                if (/^https?:\/\//i.test(abs)) el.setAttribute(attr, abs);
            } catch {}
        }
    }
}

function stripTags(html) {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function storyIdFromLink(link) {
    return crypto.createHash('sha256').update(String(link)).digest('hex').slice(0, 24);
}

async function extractArticleHtml(targetUrl, timeoutMs = 9000) {
    const t0 = Date.now();
    const upstream = await fetch(targetUrl, {
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
            'User-Agent': UA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        },
    });
    if (!upstream.ok) return { ok: false, status: 502, error: `Upstream HTTP ${upstream.status}`, ms: Date.now() - t0 };

    const html = await upstream.text();
    if (!html || html.length < 500) {
        return { ok: false, status: 502, error: 'Upstream returned empty/blocked body', ms: Date.now() - t0 };
    }

    const finalUrl = upstream.url || targetUrl;
    const { document } = parseHTML(html);

    let ogImage = '';
    try {
        const metaSels = [
            'meta[property="og:image:secure_url"]',
            'meta[property="og:image:url"]',
            'meta[property="og:image"]',
            'meta[name="og:image"]',
            'meta[name="twitter:image"]',
        ];
        for (const sel of metaSels) {
            const c = document.querySelector(sel)?.getAttribute('content')?.trim();
            if (c && !OG_JUNK_RE.test(c)) {
                const abs = new URL(c, finalUrl).href;
                if (/^https?:\/\//i.test(abs)) {
                    ogImage = abs;
                    break;
                }
            }
        }
    } catch {}

    absolutizeUrls(document, finalUrl);

    const reader = new Readability(document, { charThreshold: 120 });
    const parsed = reader.parse();
    if (!parsed || !parsed.content) {
        return { ok: false, status: 422, error: 'Readability could not extract article', ms: Date.now() - t0 };
    }

    const wordCount = (parsed.textContent || '').trim().split(/\s+/).filter(Boolean).length;
    return {
        ok: true,
        title: parsed.title || '',
        byline: parsed.byline || '',
        content: parsed.content,
        wordCount,
        ogImage,
        ms: Date.now() - t0,
    };
}

// Phase 1: On-demand server-side Readability extractor (Tier B)
export const extractArticle = onRequest(
    {
        region: 'us-central1',
        memory: '512MiB',
        timeoutSeconds: 15,
        minInstances: 0,
        maxInstances: 2,
        cors: true,
    },
    async (req, res) => {
        if (req.method !== 'POST' && req.method !== 'GET') {
            res.status(405).json({ ok: false, error: 'Method not allowed' });
            return;
        }

        const authHeader = req.get('Authorization') || '';
        const match = authHeader.match(/^Bearer\s+(.+)$/i);
        if (!match) {
            res.status(401).json({ ok: false, error: 'Missing Authorization token' });
            return;
        }
        try {
            await getAuth().verifyIdToken(match[1]);
        } catch {
            res.status(401).json({ ok: false, error: 'Invalid Authorization token' });
            return;
        }

        const targetUrl = String(req.method === 'POST' ? (req.body?.url || '') : (req.query?.url || '')).trim();
        if (!isSafeHttpUrl(targetUrl)) {
            res.status(400).json({ ok: false, error: 'Invalid or disallowed URL' });
            return;
        }

        try {
            const result = await extractArticleHtml(targetUrl, 9000);
            if (!result.ok) {
                res.status(result.status || 502).json({ ok: false, error: result.error, ms: result.ms });
                return;
            }
            res.set('Cache-Control', 'private, max-age=300');
            res.json(result);
        } catch (err) {
            res.status(502).json({ ok: false, error: err?.name || String(err) });
        }
    }
);

function textOf(val) {
    if (val == null) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') return String(val['#text'] ?? val['__cdata'] ?? '');
    return '';
}

function parseFeedXml(xmlText, feed) {
    const doc = xmlParser.parse(xmlText);
    const items = [];
    const now = Date.now();
    const cutoff = now - 72 * 3600 * 1000;

    // RSS 2.0 / RDF
    const rssItems = doc?.rss?.channel?.item || doc?.['rdf:RDF']?.item;
    if (rssItems) {
        const arr = Array.isArray(rssItems) ? rssItems : [rssItems];
        for (const it of arr.slice(0, 15)) {
            const link = textOf(it.link || it.guid).trim();
            if (!isSafeHttpUrl(link)) continue;
            const pubRaw = textOf(it.pubDate || it['dc:date']);
            const publishedAt = pubRaw ? Date.parse(pubRaw) || now : now;
            if (publishedAt < cutoff) continue;
            const body = textOf(it['content:encoded'] || it.description);
            const excerpt = stripTags(textOf(it.description) || body).slice(0, 320);
            let image = '';
            const enc = it.enclosure?.['@_url'] || it['media:content']?.['@_url'] || it['media:thumbnail']?.['@_url'];
            if (enc && isSafeHttpUrl(enc)) image = enc;
            else {
                const imgM = body.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
                if (imgM) image = imgM[1];
            }
            items.push({
                id: storyIdFromLink(link),
                link,
                title: stripTags(textOf(it.title)) || 'Untitled',
                source: feed.name || 'Feed',
                feedUrl: feed.url,
                category: feed.category || 'Uncategorized',
                author: stripTags(textOf(it['dc:creator'] || it.author)),
                excerpt,
                body,
                image,
                publishedAt,
            });
        }
        return items;
    }

    // Atom (including YouTube)
    const atomEntries = doc?.feed?.entry;
    if (atomEntries) {
        const arr = Array.isArray(atomEntries) ? atomEntries : [atomEntries];
        for (const en of arr.slice(0, 15)) {
            let link = '';
            if (Array.isArray(en.link)) {
                const alt = en.link.find(l => l['@_rel'] === 'alternate' || !l['@_rel']);
                link = String(alt?.['@_href'] || en.link[0]?.['@_href'] || '').trim();
            } else if (en.link && typeof en.link === 'object') {
                link = String(en.link['@_href'] || '').trim();
            } else {
                link = textOf(en.link).trim();
            }
            if (!isSafeHttpUrl(link)) continue;
            const pubRaw = textOf(en.published || en.updated);
            const publishedAt = pubRaw ? Date.parse(pubRaw) || now : now;
            if (publishedAt < cutoff) continue;
            const body = textOf(en.content || en.summary || en['media:group']?.['media:description']);
            const excerpt = stripTags(textOf(en.summary) || body).slice(0, 320);
            const thumb = en['media:group']?.['media:thumbnail']?.['@_url'] || en['media:thumbnail']?.['@_url'] || '';
            items.push({
                id: storyIdFromLink(link),
                link,
                title: stripTags(textOf(en.title)) || 'Untitled',
                source: feed.name || 'Feed',
                feedUrl: feed.url,
                category: feed.category || 'Uncategorized',
                author: stripTags(textOf(en.author?.name || en.author)),
                excerpt,
                body,
                image: isSafeHttpUrl(thumb) ? thumb : '',
                publishedAt,
            });
        }
    }
    return items;
}

function isClientOnlyFeed(url) {
    const u = String(url || '').toLowerCase();
    return u.includes('bsky.app') || u.includes('bsky.social') || u.includes('today-newsletter-bridge') || u.startsWith('@');
}

// Phase 2: Scheduled 15-min tick that honors each user's App Settings autoRefresh interval
// (e.g., 15 / 30 / 60 min, or 0 = Manual/Off) + Tier A pre-extraction for non-social feeds.
export const pollFeeds = onSchedule(
    {
        schedule: 'every 15 minutes',
        region: 'us-central1',
        memory: '512MiB',
        timeoutSeconds: 180,
        minInstances: 0,
        maxInstances: 1,
    },
    async () => {
        const usersCol = db.collection(`artifacts/${APP_ID}/users`);
        const userRefs = await usersCol.listDocuments();
        const now = Date.now();
        const expireAt = Timestamp.fromMillis(now + 7 * 86400000);

        for (const userRef of userRefs) {
            // Respect user's App Settings Auto-Refresh interval (state/uiPrefs.autoRefresh, in minutes)
            const [prefsSnap, metaSnap] = await db.getAll(
                userRef.collection('state').doc('uiPrefs'),
                userRef.collection('state').doc('pollMeta')
            );
            const rawInterval = prefsSnap.exists ? prefsSnap.data()?.autoRefresh : undefined;
            const intervalMins = rawInterval !== undefined && rawInterval !== '' ? parseInt(rawInterval, 10) : 30;
            if (!Number.isNaN(intervalMins) && intervalMins <= 0) {
                console.log(`[pollFeeds] user=${userRef.id} skipped (autoRefresh=0 / manual)`);
                continue;
            }
            const effectiveMins = Math.max(15, Number.isNaN(intervalMins) ? 30 : intervalMins);
            const lastPolledAt = metaSnap.exists ? (metaSnap.data()?.lastPolledAt || 0) : 0;
            // 2-minute tolerance prevents scheduler jitter from pushing a 60m interval out to 75m
            if (lastPolledAt && (now - lastPolledAt) < (effectiveMins - 2) * 60000) {
                continue;
            }

            const feedsSnap = await userRef.collection('feeds').get();
            if (feedsSnap.empty) continue;

            const feeds = [];
            feedsSnap.forEach(d => {
                const f = d.data();
                if (f?.url && isSafeHttpUrl(f.url) && !isClientOnlyFeed(f.url)) {
                    feeds.push(f);
                }
            });
            if (!feeds.length) continue;

            const storiesCol = userRef.collection('stories');
            let newCount = 0;
            let preExtractedCount = 0;

            // Bounded concurrency pool of 8 feeds at a time
            let idx = 0;
            async function worker() {
                while (idx < feeds.length) {
                    const feed = feeds[idx++];
                    try {
                        const res = await fetch(feed.url, {
                            redirect: 'follow',
                            signal: AbortSignal.timeout(8000),
                            headers: { 'User-Agent': UA, 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
                        });
                        if (!res.ok) continue;
                        const xml = await res.text();
                        if (!xml || !xml.trim().startsWith('<')) continue;

                        const parsedItems = parseFeedXml(xml, feed);
                        if (!parsedItems.length) continue;

                        // Batch existence check to avoid rewriting existing stories
                        const refs = parsedItems.map(it => storiesCol.doc(it.id));
                        const existingSnaps = await db.getAll(...refs);
                        const batch = db.batch();
                        let batchOps = 0;

                        for (let i = 0; i < parsedItems.length; i++) {
                            if (existingSnaps[i].exists) continue;
                            const item = parsedItems[i];
                            let body = item.body || '';
                            let bodyExtracted = false;
                            let image = item.image || '';

                            // Tier A: Pre-extract truncated stories for all non-social/non-newsletter feeds unless opted out (preExtract === false)
                            const rssWords = stripTags(body).split(/\s+/).filter(Boolean).length;
                            const isYouTube = /youtube\.com|youtu\.be/i.test(feed.url || '');
                            if (feed.preExtract !== false && !isYouTube && rssWords < 250) {
                                try {
                                    const ext = await extractArticleHtml(item.link, 8000);
                                    if (ext.ok && ext.content && ext.wordCount > 100 && ext.wordCount > rssWords + 80) {
                                        body = ext.content;
                                        bodyExtracted = true;
                                        if (!image && ext.ogImage) image = ext.ogImage;
                                        preExtractedCount++;
                                    }
                                } catch {}
                            }

                            // Cap stored body size to keep Firestore docs lean
                            if (body.length > 200000) body = body.slice(0, 200000);

                            batch.set(refs[i], {
                                id: item.id,
                                link: item.link,
                                title: item.title,
                                source: item.source,
                                feedUrl: item.feedUrl,
                                category: item.category,
                                author: item.author || '',
                                excerpt: item.excerpt || '',
                                body,
                                bodyExtracted,
                                image,
                                publishedAt: item.publishedAt,
                                fetchedAt: Date.now(),
                                expireAt,
                            });
                            batchOps++;
                            newCount++;
                        }

                        if (batchOps > 0) await batch.commit();
                    } catch {
                        // Individual feed errors never stop the batch
                    }
                }
            }

            await Promise.all(Array.from({ length: Math.min(8, feeds.length) }, () => worker()));
            await userRef.collection('state').doc('pollMeta').set({ lastPolledAt: now, intervalMins: effectiveMins }, { merge: true });
            console.log(`[pollFeeds] user=${userRef.id} interval=${effectiveMins}m feeds=${feeds.length} new=${newCount} preExtracted=${preExtractedCount}`);
        }
    }
);
