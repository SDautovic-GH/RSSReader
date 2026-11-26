import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

initializeApp();

const BLOCKED_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0|\[::1\]|.*\.local$|.*\.internal$)/i;
const OG_JUNK_RE = /logo|sprite|default|placeholder|avatar|blank|fallback|site_upload|banner|missing/i;

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

        // Verify Firebase Auth ID token so only signed-in Today users can invoke this endpoint
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

        const t0 = Date.now();
        try {
            const upstream = await fetch(targetUrl, {
                redirect: 'follow',
                signal: AbortSignal.timeout(9000),
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                },
            });

            if (!upstream.ok) {
                res.status(502).json({ ok: false, error: `Upstream HTTP ${upstream.status}`, ms: Date.now() - t0 });
                return;
            }

            const html = await upstream.text();
            if (!html || html.length < 500) {
                res.status(502).json({ ok: false, error: 'Upstream returned empty/blocked body', ms: Date.now() - t0 });
                return;
            }

            const finalUrl = upstream.url || targetUrl;
            const { document } = parseHTML(html);

            // Extract og:image backstop before Readability mutates the DOM
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
                res.status(422).json({ ok: false, error: 'Readability could not extract article', ms: Date.now() - t0 });
                return;
            }

            const wordCount = (parsed.textContent || '').trim().split(/\s+/).filter(Boolean).length;
            res.set('Cache-Control', 'private, max-age=300');
            res.json({
                ok: true,
                title: parsed.title || '',
                byline: parsed.byline || '',
                content: parsed.content,
                wordCount,
                ogImage,
                ms: Date.now() - t0,
            });
        } catch (err) {
            res.status(502).json({ ok: false, error: err?.name || String(err), ms: Date.now() - t0 });
        }
    }
);
