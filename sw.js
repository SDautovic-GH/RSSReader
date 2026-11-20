const CACHE_NAME = 'rss-reader-v582';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.webmanifest',
    './apple-touch-icon.png?v=578',
    './favicon-64x64.png?v=578',
    './favicon-32x32.png?v=578',
    './favicon.svg?v=578',
    './favicon.ico?v=578',
    './icon-192.png?v=578',
    './icon-512.png?v=578'
];
const APP_SHELL_SET = new Set(APP_SHELL);
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Readability/0.5.0/Readability.min.js',
    'https://unpkg.com/@phosphor-icons/web',
    'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];
const STATIC_CDN_HOSTS = new Set([
    'cdn.jsdelivr.net',
    'cdnjs.cloudflare.com',
    'unpkg.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
]);

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                [...APP_SHELL, ...EXTERNAL_ASSETS].map(url =>
                    fetch(url, APP_SHELL_SET.has(url) ? { cache: 'no-cache' } : undefined)
                        .then(res => { if (res && res.ok) return cache.put(url, res); })
                        .catch(() => { })
                )
            );
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME && k.startsWith('rss-reader-'))
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Only cache same-origin app shell / static files and explicit static CDN hosts.
    // All RSS feeds, proxies, Bluesky, Firebase, Supabase, and media go straight to network.
    const isSameOrigin = url.origin === self.location.origin;
    const isStaticCdn = STATIC_CDN_HOSTS.has(url.hostname);
    if (!isSameOrigin && !isStaticCdn) return;

    // Navigation / HTML: Network-first bypassing HTTP cache, with cached shell fallback
    if (isSameOrigin && (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html'))) {
        event.respondWith(
            fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
                if (res && res.ok && !res.redirected) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, clone));
                }
                if (res && res.redirected) return Response.redirect(res.url, 302);
                return res;
            }).catch(() => caches.match(req).then(r => r || caches.match('./index.html') || caches.match('./')))
        );
        return;
    }

    // Static app shell & CDN assets: Stale-while-revalidate
    event.respondWith(
        caches.match(req).then(cached => {
            const networkFetch = fetch(req).then(res => {
                if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then(c => c.put(req, clone));
                }
                return res;
            }).catch(() => cached);
            return cached || networkFetch;
        })
    );
});
