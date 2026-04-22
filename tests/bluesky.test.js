const assert = require('assert');
const fs = require('fs');

/**
 * The function to be tested, extracted from index.html
 */
function isBlueskyFeed(url) {
    return /bsky\.app\/profile\/.+\/rss/.test(url) ||
           /api\.bsky\.app\/authorFeed/.test(url);
}

function extractBlueskyActor(url) {
    const m = url.match(/bsky\.app\/profile\/([^/?#]+)/) ||
              url.match(/api\.bsky\.app\/authorFeed(?:Articles)?\/([^/?#]+)/);
    return m ? m[1] : null;
}

const testCases = [
    {
        url: 'https://bsky.app/profile/jules.bsky.social/rss',
        expected: true,
        description: 'Valid Bluesky RSS URL'
    },
    {
        url: 'https://api.bsky.app/authorFeed/jules.bsky.social',
        expected: true,
        description: 'Valid Bluesky API Author Feed URL'
    },
    {
        url: 'https://api.bsky.app/authorFeedArticles/jules.bsky.social',
        expected: true,
        description: 'Valid Bluesky API Author Feed Articles URL'
    },
    {
        url: 'https://example.com/rss',
        expected: false,
        description: 'Non-Bluesky RSS URL'
    },
    {
        url: 'https://bsky.app/profile/jules.bsky.social',
        expected: false,
        description: 'Bluesky profile URL (not an RSS feed)'
    },
    {
        url: 'https://api.bsky.app/otherEndpoint',
        expected: false,
        description: 'Other Bluesky API endpoint'
    },
    {
        url: 'malformed-url',
        expected: false,
        description: 'Malformed URL'
    },
    {
        url: '',
        expected: false,
        description: 'Empty string'
    }
];

let passed = 0;
let failed = 0;

console.log('🧪 Running tests for isBlueskyFeed...');

testCases.forEach((tc) => {
    try {
        const result = isBlueskyFeed(tc.url);
        assert.strictEqual(result, tc.expected, tc.description);
        console.log(`✅ PASS: ${tc.description} (${tc.url})`);
        passed++;
    } catch (err) {
        console.error(`❌ FAIL: ${tc.description} (${tc.url})`);
        console.error(`   Expected ${tc.expected}, but got ${!tc.expected}`);
        failed++;
    }
});

console.log('\n🧪 Running tests for extractBlueskyActor...');

const extractBlueskyActorTestCases = [
    {
        url: 'https://bsky.app/profile/jules.bsky.social/rss',
        expected: 'jules.bsky.social',
        description: 'Valid Bluesky RSS URL'
    },
    {
        url: 'https://bsky.app/profile/jules.bsky.social',
        expected: 'jules.bsky.social',
        description: 'Valid Bluesky profile URL'
    },
    {
        url: 'https://api.bsky.app/authorFeed/jules.bsky.social',
        expected: 'jules.bsky.social',
        description: 'Valid Bluesky API Author Feed URL'
    },
    {
        url: 'https://api.bsky.app/authorFeedArticles/jules.bsky.social',
        expected: 'jules.bsky.social',
        description: 'Valid Bluesky API Author Feed Articles URL'
    },
    {
        url: 'https://bsky.app/profile/user.name/rss?query=123',
        expected: 'user.name',
        description: 'URL with query string'
    },
    {
        url: 'https://bsky.app/profile/user.name#hash',
        expected: 'user.name',
        description: 'URL with hash fragment'
    },
    {
        url: 'https://example.com/rss',
        expected: null,
        description: 'Non-Bluesky URL'
    },
    {
        url: 'malformed-url',
        expected: null,
        description: 'Malformed URL'
    },
    {
        url: '',
        expected: null,
        description: 'Empty string'
    }
];

extractBlueskyActorTestCases.forEach((tc) => {
    try {
        const result = extractBlueskyActor(tc.url);
        assert.strictEqual(result, tc.expected, tc.description);
        console.log(`✅ PASS: ${tc.description} (${tc.url})`);
        passed++;
    } catch (err) {
        console.error(`❌ FAIL: ${tc.description} (${tc.url})`);
        console.error(`   Expected ${tc.expected}, but got ${err.actual}`);
        failed++;
    }
});

console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed.`);

// ---------------------------------------------------------
// Dynamically Extract and Test bskyEsc from index.html
// ---------------------------------------------------------

const html = fs.readFileSync('index.html', 'utf8');
const bskyEscMatch = html.match(/function bskyEsc\(str\) \{(.*?)\}/s);

if (!bskyEscMatch) {
    console.error("Could not find bskyEsc in index.html");
    process.exit(1);
}

const bskyEsc = new Function('str', bskyEscMatch[1]);

console.log('\n🧪 Running tests for bskyEsc...');

let bskyEscPassed = 0;
let bskyEscFailed = 0;

const bskyEscTestCases = [
    {
        input: 'normal text',
        expected: 'normal text',
        description: 'Normal string without special characters'
    },
    {
        input: 'text with & ampersand',
        expected: 'text with &amp; ampersand',
        description: 'String with ampersand'
    },
    {
        input: 'text with < > tags',
        expected: 'text with &lt; &gt; tags',
        description: 'String with angle brackets'
    },
    {
        input: 'text with "quotes"',
        expected: 'text with &quot;quotes&quot;',
        description: 'String with double quotes'
    },
    {
        input: '<a href="https://example.com/?a=1&b=2">Link</a>',
        expected: '&lt;a href=&quot;https://example.com/?a=1&amp;b=2&quot;&gt;Link&lt;/a&gt;',
        description: 'Combined HTML characters'
    },
    {
        input: null,
        expected: '',
        description: 'Null value'
    },
    {
        input: undefined,
        expected: '',
        description: 'Undefined value'
    },
    {
        input: '',
        expected: '',
        description: 'Empty string'
    }
];

bskyEscTestCases.forEach((tc) => {
    try {
        const result = bskyEsc(tc.input);
        assert.strictEqual(result, tc.expected, tc.description);
        console.log(`✅ PASS: ${tc.description}`);
        bskyEscPassed++;
    } catch (err) {
        console.error(`❌ FAIL: ${tc.description}`);
        console.error(`   Input:    ${tc.input}`);
        console.error(`   Expected: ${tc.expected}`);
        console.error(`   Got:      ${err.actual}`);
        bskyEscFailed++;
    }
});

console.log(`\n📊 bskyEsc Test Summary: ${bskyEscPassed} passed, ${bskyEscFailed} failed.`);

if (failed > 0 || bskyEscFailed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
