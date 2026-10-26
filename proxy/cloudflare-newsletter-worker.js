/**
 * Cloudflare Email Routing Worker: Newsletter-to-RSS Bridge
 * 
 * Production-grade MIME parser, RFC 2047 header decoder,
 * Quoted-Printable & Base64 decoders, HTML cleaner, and clean RSS 2.0 generator.
 */

export default {
  // 1. Inbound email handler (triggered by Cloudflare Email Routing)
  async email(message, env, ctx) {
    try {
      const rawFromHeader = message.from || message.headers.get('from') || 'Unknown Sender';
      const rawFrom = decodeMimeHeader(rawFromHeader);
      const to = message.to || '';
      const subject = decodeMimeHeader(message.headers.get('subject') || 'Untitled Issue');
      const dateHeader = message.headers.get('date');
      const timestamp = dateHeader ? new Date(dateHeader).getTime() : Date.now();

      // Automatically filter out unsubscribe receipts so they never clutter the reading feed
      if (/you['’]re unsubscribed|successfully unsubscribed|unsubscribe confirmation/i.test(subject)) {
        console.log('Filtered out unsubscribe notification email:', subject);
        return;
      }

      // Read raw MIME payload
      const rawText = await new Response(message.raw).text();

      // Parse MIME multipart recursively (handles nested multipart/alternative, quoted-printable, base64)
      const parsed = parseMimePayload(rawText);

      // Clean HTML for reader pane: extract <body>, strip <style>, <script>, 1px tracking pixels
      let finalHtml = '';
      if (parsed.html) {
        finalHtml = cleanEmailHtml(parsed.html);
      } else if (parsed.text) {
        // Format plain text with paragraphs and line breaks
        finalHtml = parsed.text
          .split(/\r?\n\r?\n/)
          .map(para => `<p>${escapeHtml(para.trim()).replace(/\r?\n/g, '<br>')}</p>`)
          .join('\n');
      }

      // Clean snippet for article card list
      const cleanSnippetText = (parsed.text || stripHtml(finalHtml))
        .replace(/\s+/g, ' ')
        .trim();
      const snippet = cleanSnippetText.substring(0, 300);

      // Extract publication display name from "Name <email@address>"
      const publicationName = extractDisplayName(rawFrom);

      const issue = {
        id: crypto.randomUUID(),
        title: subject,
        from: publicationName,
        rawFrom,
        to,
        snippet,
        body: finalHtml,
        timestamp,
        dateIso: new Date(timestamp).toISOString(),
        dateRfc822: new Date(timestamp).toUTCString()
      };

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

      // Prepend latest issue (capped at 60)
      items.unshift(issue);
      if (items.length > 60) {
        items = items.slice(0, 60);
      }

      await KV.put('newsletter_items', JSON.stringify(items));
    } catch (err) {
      console.error('Failed to process incoming newsletter email:', err);
    }
  },

  // 2. HTTP endpoints (RSS feed, article reader & maintenance)
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
      return new Response('Configuration Error: NEWSLETTER_KV is not bound.', { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Endpoint: /clear -> Wipes existing newsletter items (e.g. test verification emails)
    if (url.pathname === '/clear') {
      await KV.put('newsletter_items', JSON.stringify([]));
      return new Response('Newsletter items cleared successfully. Refresh Today to see an empty newsletter feed.', {
        headers: { 
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*' 
        }
      });
    }

    // Endpoint: /item/:id -> Standalone clean HTML article view for browser / reader fallback
    if (url.pathname.startsWith('/item/')) {
      const id = url.pathname.replace('/item/', '').trim();
      const items = (await KV.get('newsletter_items', { type: 'json' })) || [];
      const item = items.find(i => i.id === id);
      if (!item) {
        return new Response('Article not found', { status: 404 });
      }
      const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(item.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 680px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
    h1 { font-size: 1.8rem; margin-bottom: 0.3rem; }
    .meta { color: #666; font-size: 0.9rem; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.8rem; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>${escapeHtml(item.title)}</h1>
  <div class="meta">${escapeHtml(item.from)} · ${escapeHtml(item.dateRfc822)}</div>
  <div class="content">${item.body}</div>
</body>
</html>`;
      return new Response(pageHtml, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Default: /feed -> Render RSS 2.0 XML
    const items = (await KV.get('newsletter_items', { type: 'json' })) || [];

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
        'Cache-Control': 'public, max-age=30',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};

/* ==========================================================================
   MIME & Content Parsing Utilities
   ========================================================================== */

/**
 * Decodes RFC 2047 encoded-word headers (e.g. =?UTF-8?Q?You=E2=80=99re_unsubscribed.?=)
 */
function decodeMimeHeader(headerStr) {
  if (!headerStr) return '';
  const collapsed = String(headerStr).replace(/\?=\s+=\?/g, '?==?');
  return collapsed.replace(/=\?([^?]+)\?([QBqb])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    const enc = encoding.toUpperCase();
    if (enc === 'Q') {
      const qp = text.replace(/_/g, ' ');
      return decodeQuotedPrintable(qp);
    } else if (enc === 'B') {
      return decodeBase64Utf8(text);
    }
    return text;
  });
}

/**
 * Recursively parses raw MIME payload into decoded HTML and plain text parts.
 */
function parseMimePayload(rawText) {
  let foundHtml = '';
  let foundText = '';

  function processPart(headersText, bodyText) {
    const contentTypeMatch = headersText.match(/content-type:\s*([^;\r\n]+)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].toLowerCase().trim() : 'text/plain';

    const encodingMatch = headersText.match(/content-transfer-encoding:\s*([^\s;\r\n]+)/i);
    const encoding = encodingMatch ? encodingMatch[1].toLowerCase().trim() : '7bit';

    const boundaryMatch = headersText.match(/boundary="?([^";\r\n]+)"?/i);

    // If this part is itself a multipart container, recurse
    if (contentType.startsWith('multipart/') && boundaryMatch) {
      parseMultipart(bodyText, boundaryMatch[1]);
      return;
    }

    // Decode transfer encoding
    let decoded = bodyText;
    if (encoding === 'quoted-printable') {
      decoded = decodeQuotedPrintable(bodyText);
    } else if (encoding === 'base64') {
      decoded = decodeBase64Utf8(bodyText);
    }

    if (contentType === 'text/html' && !foundHtml) {
      foundHtml = decoded;
    } else if (contentType === 'text/plain' && !foundText) {
      foundText = decoded;
    }
  }

  function parseMultipart(payload, boundary) {
    const rawParts = payload.split('--' + boundary);
    for (const rawPart of rawParts) {
      const part = rawPart.trim();
      if (!part || part === '--') continue;
      const splitIdx = rawPart.search(/\r?\n\r?\n/);
      if (splitIdx === -1) continue;
      const headers = rawPart.substring(0, splitIdx);
      const body = rawPart.substring(splitIdx).replace(/^[\r\n]+/, '').replace(/--$/, '');
      processPart(headers, body);
    }
  }

  // Check top-level boundary
  const topBoundaryMatch = rawText.match(/boundary="?([^";\r\n]+)"?/i);
  if (topBoundaryMatch) {
    parseMultipart(rawText, topBoundaryMatch[1]);
  } else {
    // Single-part email
    const splitIdx = rawText.search(/\r?\n\r?\n/);
    if (splitIdx !== -1) {
      processPart(rawText.substring(0, splitIdx), rawText.substring(splitIdx).replace(/^[\r\n]+/, ''));
    } else {
      foundText = rawText;
    }
  }

  return { html: foundHtml, text: foundText };
}

/**
 * Decodes Quoted-Printable strings to valid UTF-8.
 */
function decodeQuotedPrintable(str) {
  // 1. Remove soft line breaks (= at end of line)
  const unsoft = str.replace(/=[\r\n]+/g, '');
  // 2. Decode =XX hex pairs using TextDecoder to handle multi-byte UTF-8 sequences
  const bytes = [];
  for (let i = 0; i < unsoft.length; i++) {
    if (unsoft[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(unsoft.substr(i + 1, 2))) {
      bytes.push(parseInt(unsoft.substr(i + 1, 2), 16));
      i += 2;
    } else {
      bytes.push(unsoft.charCodeAt(i));
    }
  }
  try {
    return new TextDecoder('utf-8').decode(new Uint8Array(bytes));
  } catch {
    return unsoft.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }
}

/**
 * Decodes Base64 to UTF-8 string.
 */
function decodeBase64Utf8(base64Str) {
  try {
    const clean = base64Str.replace(/\s+/g, '');
    const binStr = atob(clean);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try {
      return atob(base64Str.replace(/\s+/g, ''));
    } catch {
      return base64Str;
    }
  }
}

/**
 * Cleans email HTML so it renders cleanly in Today's reader pane.
 */
function cleanEmailHtml(html) {
  let clean = html;

  // Extract contents of <body> if full HTML envelope is present
  const bodyMatch = clean.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    clean = bodyMatch[1];
  } else {
    clean = clean
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  }

  // Strip <style> and <script> tags so email CSS doesn't corrupt Today's UI
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Strip invisible 1px tracking beacons (e.g. Substack p.gif)
  clean = clean.replace(/<img[^>]+(?:width=['"]?1['"]?|height=['"]?1['"]?|p\.gif)[^>]*>/gi, '');

  // Strip hardcoded dark/light colors and backgrounds from inline styles so newsletters adapt to reader themes
  clean = clean.replace(/style=(["'])(.*?)\1/gi, (match, quote, styleContent) => {
    const cleaned = styleContent
      .replace(/(?:^|;)\s*(?:color|background|background-color)\s*:[^;]+/gi, '')
      .replace(/^;+|;+$/g, '')
      .trim();
    return cleaned ? `style=${quote}${cleaned}${quote}` : '';
  });
  clean = clean.replace(/\s+(?:color|bgcolor)=(["']).*?\1/gi, '');

  return clean.trim();
}

/**
 * Extracts publication / sender name from "Publication Name <email@example.com>"
 */
function extractDisplayName(rawFrom) {
  const match = String(rawFrom || '').match(/^"?([^"<]+)"?\s*<[^>]+>/);
  if (match && match[1].trim()) {
    return match[1].trim();
  }
  const emailMatch = String(rawFrom || '').match(/<([^>]+)>/) || String(rawFrom || '').match(/([^\s@]+@[^\s@]+)/);
  if (emailMatch) {
    return emailMatch[1].split('@')[0];
  }
  return rawFrom || 'Newsletters';
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
