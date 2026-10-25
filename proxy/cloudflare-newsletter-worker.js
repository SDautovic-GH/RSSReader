/**
 * Cloudflare Email Routing Worker: Newsletter-to-RSS Bridge
 * 
 * SETUP INSTRUCTIONS:
 * 1. Cloudflare Dashboard -> Workers & Pages -> Create Worker: "newsletter-rss-bridge"
 * 2. Paste this code into the Worker editor.
 * 3. In Worker Settings -> Variables:
 *    - KV Namespace Bindings: Bind a KV namespace named "NEWSLETTER_KV".
 *    - Environment Variables (Optional): "FEED_TOKEN" = "your-private-secret-token"
 * 4. In Cloudflare Dashboard -> your domain (e.g. dautovic.com) -> Email Routing -> Routing Rules:
 *    - Create rule: Custom address (e.g. newsletters@dautovic.com) -> Action: Send to Worker -> select "newsletter-rss-bridge".
 * 5. Add the feed to Today:
 *    - URL: https://<your-worker>.workers.dev/feed?token=your-private-secret-token
 *    - Folder: Newsletters
 */

export default {
  // 1. Inbound email handler (triggered by Cloudflare Email Routing)
  async email(message, env, ctx) {
    try {
      const from = message.from || 'Unknown Sender';
      const to = message.to || '';
      const subject = message.headers.get('subject') || 'Untitled Issue';
      const dateHeader = message.headers.get('date');
      const timestamp = dateHeader ? new Date(dateHeader).getTime() : Date.now();

      // Read raw MIME body
      const rawStream = message.raw;
      const rawText = await new Response(rawStream).text();

      // Simple MIME multipart body extractor (plain text / HTML)
      let htmlContent = '';
      let textContent = '';

      const boundaryMatch = message.headers.get('content-type')?.match(/boundary="?([^";]+)"?/i) 
        || rawText.match(/boundary="?([^";\r\n]+)"?/i);

      if (boundaryMatch) {
        const boundary = boundaryMatch[1];
        const parts = rawText.split('--' + boundary);
        for (const part of parts) {
          if (/content-type:\s*text\/html/i.test(part)) {
            const bodySplit = part.split(/\r?\n\r?\n/);
            if (bodySplit.length > 1) {
              htmlContent = bodySplit.slice(1).join('\n').replace(/--$/, '').trim();
            }
          } else if (/content-type:\s*text\/plain/i.test(part) && !textContent) {
            const bodySplit = part.split(/\r?\n\r?\n/);
            if (bodySplit.length > 1) {
              textContent = bodySplit.slice(1).join('\n').replace(/--$/, '').trim();
            }
          }
        }
      }

      // Fallback if not multipart
      if (!htmlContent && !textContent) {
        const bodySplit = rawText.split(/\r?\n\r?\n/);
        textContent = bodySplit.length > 1 ? bodySplit.slice(1).join('\n').trim() : rawText;
      }

      const finalHtml = htmlContent || `<pre>${escapeHtml(textContent)}</pre>`;
      const snippet = (textContent || stripHtml(finalHtml)).substring(0, 300);

      const issue = {
        id: crypto.randomUUID(),
        title: subject,
        from,
        to,
        snippet,
        body: finalHtml,
        timestamp,
        dateIso: new Date(timestamp).toISOString(),
        dateRfc822: new Date(timestamp).toUTCString()
      };

      // Retrieve existing items list from KV
      const KV = env.NEWSLETTER_KV;
      if (!KV) {
        console.error('Missing NEWSLETTER_KV binding');
        return;
      }

      let items = [];
      const rawList = await KV.get('newsletter_items', { type: 'json' });
      if (Array.isArray(rawList)) {
        items = rawList;
      }

      // Keep latest 60 issues
      items.unshift(issue);
      if (items.length > 60) {
        items = items.slice(0, 60);
      }

      await KV.put('newsletter_items', JSON.stringify(items));
    } catch (err) {
      console.error('Failed to process incoming newsletter email:', err);
    }
  },

  // 2. HTTP feed endpoint (subscribed in Today)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Optional token auth check
    const requiredToken = env.FEED_TOKEN;
    if (requiredToken) {
      const userToken = url.searchParams.get('token');
      if (userToken !== requiredToken) {
        return new Response('Unauthorized. Please provide ?token=...', { status: 401 });
      }
    }

    const KV = env.NEWSLETTER_KV;
    if (!KV) {
      return new Response('Configuration Error: NEWSLETTER_KV is not bound.', { status: 500 });
    }

    const items = (await KV.get('newsletter_items', { type: 'json' })) || [];

    // Render RSS 2.0 XML
    const feedXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Today Newsletters</title>
    <link>${escapeHtml(url.origin)}</link>
    <description>Inbound newsletter bridge for Today</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>Today-Cloudflare-Email-Bridge</generator>
    ${items.map(item => `
    <item>
      <title>${escapeHtml(item.title)}</title>
      <link>${escapeHtml(url.origin)}/item/${item.id}</link>
      <guid isPermaLink="false">${item.id}</guid>
      <dc:creator>${escapeHtml(item.from)}</dc:creator>
      <pubDate>${item.dateRfc822}</pubDate>
      <description>${escapeHtml(item.snippet)}</description>
      <content:encoded><![CDATA[${item.body}]]></content:encoded>
    </item>`).join('\n')}
  </channel>
</rss>`;

    return new Response(feedXml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
