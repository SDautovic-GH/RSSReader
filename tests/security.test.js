
const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');

// Simple mock of the environment for testing the esc and escJs functions
const escMatch = html.match(/window\.esc = \(str\) => \{(.*?)\};/s);
const escJsMatch = html.match(/window\.escJs = \(str\) => \{(.*?)\};/s);

if (!escMatch || !escJsMatch) {
    console.error("Could not find window.esc or window.escJs in index.html");
    process.exit(1);
}

const esc = new Function('str', escMatch[1]);
// escJs depends on window.esc
global.window = { esc: esc };
const escJs = new Function('str', escJsMatch[1]);

console.log("Testing escaping functions...");

// Test esc
assert.strictEqual(esc("<script>"), "&lt;script&gt;");
assert.strictEqual(esc("O'Reilly"), "O&#39;Reilly");
assert.strictEqual(esc(null), "");

// Test escJs
assert.strictEqual(escJs("O'Reilly"), "O\\&#39;Reilly");
assert.strictEqual(escJs('<img src="x">'), "&lt;img src=\\&quot;x\\&quot;&gt;");

console.log("Escaping functions tests passed!");

// Check for regressions in index.html (ensure we use escJs where needed)
const checks = [
    { name: 'buildArticleCard saId', pattern: /const saId\s*=\s*escJs\(a\.id\);/ },
    { name: 'renderFeeds sCat', pattern: /const sCat\s*=\s*escJs\(cat\);/ },
    { name: 'renderFeeds sfName', pattern: /const sfName\s*=\s*escJs\(f\.name\);/ },
    { name: 'renderFeeds sfId', pattern: /const sfId\s*=\s*escJs\(f\.id\);/ },
    { name: 'renderFeeds sfUrl', pattern: /const sfUrl\s*=\s*escJs\(f\.url\);/ },
    { name: 'localList sfId', pattern: /const sfId\s*=\s*escJs\(f\.id\);/ },
    { name: 'showArticleContextMenu sid', pattern: /const sid\s*=\s*escJs\(id\);/ }
];

console.log("Checking for escJs usage in event handlers...");
checks.forEach(c => {
    if (c.pattern.test(html)) {
        console.log(`OK: ${c.name} is using escJs.`);
    } else {
        console.error(`FAIL: ${c.name} is NOT using escJs.`);
        process.exit(1);
    }
});

console.log("Security and regression verification complete!");
