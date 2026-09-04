// RSS Reader CORS proxy - Deno Deploy (https://<your-name>.deno.dev/?url=<encoded>)
//
// WHY THIS EXISTS (2026-09-04). The app's primary proxy is a Cloudflare Worker
// (still-shadow-1ebe.sdfyix.workers.dev). Cloudflare stamps every Worker
// subrequest with a `cf-worker` header that cannot be removed, and some sites'
// Cloudflare configuration rejects it: bleepingcomputer.com returns
// "error code: 1106" (17 bytes) for BOTH its feed and its article pages, while
// the same Worker fetches cnbc.com fine. Proven not to be a User-Agent problem -
// a direct fetch sending the Worker's own UA returns the full 87KB article.
// Deno Deploy is not Cloudflare Workers, so it carries no such stamp.
//
// Contract is identical to the Worker's (?url=<encoded>) so it drops straight
// into both proxy chains in index.html.
//
// Deploy: https://dash.deno.com -> New Playground -> paste this -> Save & Deploy.

const ALLOWED_ORIGINS = new Set([
    "https://sdautovic-gh.github.io",
]);

function corsHeaders(origin: string | null): Headers {
    // An unknown browser origin gets "null" (refused); a header-less client such
    // as curl gets "*" so the proxy stays testable from a terminal.
    const allowed = !origin || ALLOWED_ORIGINS.has(origin);
    return new Headers({
        "Access-Control-Allow-Origin": allowed ? (origin ?? "*") : "null",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Vary": "Origin",
    });
}

Deno.serve(async (req: Request) => {
    const base = corsHeaders(req.headers.get("origin"));

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: base });
    if (req.method !== "GET") return new Response("GET only", { status: 405, headers: base });

    const target = new URL(req.url).searchParams.get("url");
    if (!target) return new Response("Missing url param", { status: 400, headers: base });

    let dest: URL;
    try { dest = new URL(target); } catch { return new Response("Malformed url", { status: 400, headers: base }); }
    if (dest.protocol !== "https:" && dest.protocol !== "http:") {
        return new Response("Only http(s) targets", { status: 400, headers: base });
    }

    try {
        const upstream = await fetch(dest, {
            redirect: "follow",
            signal: AbortSignal.timeout(15000),
            headers: {
                // Deliberately NOT a browser string. Sites running bot detection
                // block a "Mozilla/5.0 ..." claim that lacks a real browser
                // fingerprint (measured: Chrome UA -> 403 on bleepingcomputer.com)
                // while serving an honest client UA normally (curl/8.0 -> 200).
                "User-Agent": "RSSReader/1.0 (+https://sdautovic-gh.github.io/RSSReader)",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.9",
            },
        });

        const headers = new Headers(base);
        // Stream the bytes through untouched and keep the UPSTREAM Content-Type, so
        // a feed declaring e.g. windows-1250 still decodes correctly in the browser.
        // (The Worker decodes to text and hardcodes charset=utf-8, which would
        // mojibake any non-UTF-8 feed.)
        headers.set("Content-Type", upstream.headers.get("content-type") ?? "application/octet-stream");
        headers.set("Cache-Control", "no-store");
        // Propagate the REAL status. The Worker answers 200 while passing a block
        // page through as the body, which is why a block looked like an "empty
        // article" instead of an error; the app's `if (!res.ok) continue` can only
        // work if the status is honest. CORS headers are set on failures too - the
        // missing-ACAO-on-error behaviour is exactly what makes allorigins'
        // failures surface as an unreadable CORS error in the console.
        return new Response(upstream.body, { status: upstream.status, headers });
    } catch (e) {
        const headers = new Headers(base);
        headers.set("Content-Type", "text/plain; charset=utf-8");
        return new Response(`Proxy error: ${(e as Error).name}`, { status: 502, headers });
    }
});
