const CACHE_NAME = 'rss-reader-v516';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',
    './apple-touch-icon.png',
    './icon-192.png',
    './icon-512.png',
    './favicon.png'
];
const EXTERNAL_ASSETS = [
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
    'https://cdn.jsdelivr.net/npm/dompurify@3.0.6/dist/purify.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Readability/0.5.0/Readability.min.js',
    'https://unpkg.com/@phosphor-icons/web',
    'https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                [...APP_SHELL, ...EXTERNAL_ASSETS].map(url =>
                    fetch(url)
                        .then(res => { if (res && res.ok) return cache.put(url, res); })
                        .catch(() => {})
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

    // Let Supabase REST/Auth/Realtime API calls go straight to network
    if (url.hostname.includes('supabase.co')) return;

    // Navigation / HTML: Network-first with cached shell fallback
    if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
        event.respondWith(
            fetch(req).then(res => {
                const clone = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(req, clone));
                return res;
            }).catch(() => caches.match(req).then(r => r || caches.match('./index.html') || caches.match('./')))
        );
        return;
    }

    // Static assets, fonts, icons: Stale-while-revalidate
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
