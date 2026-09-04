// PRIMARY proxy for the RSS Reader, deployed at
// https://still-shadow-1ebe.sdfyix.workers.dev/?url=<encoded>
//
// Kept here ONLY as a record of what is deployed - editing this file changes
// nothing by itself; the live code lives in the Cloudflare dashboard
// (dash.cloudflare.com -> Workers & Pages -> still-shadow-1ebe -> Edit Code).
// It is checked in because 2026-09-04's debugging stalled on the source being
// invisible from the repo.
//
// KNOWN LIMIT - do NOT try to fix this with headers: Cloudflare stamps Worker
// subrequests with a `cf-worker` header that cannot be removed, and hosts whose
// Cloudflare config rejects it answer with "error code: 1106" (17 bytes).
// Measured on bleepingcomputer.com for both its feed and its articles, while
// cnbc.com works fine. A direct fetch sending this exact User-Agent returns the
// full article, so the UA is not the discriminator - the egress network is.
// The workaround is proxy/deno-proxy.ts, which is not on Cloudflare Workers.

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing url param', { status: 400 });

    const res = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0 (RSS Reader)' }
    });
    const body = await res.text();

    return new Response(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }
}
