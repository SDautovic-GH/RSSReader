#!/usr/bin/env node
import fs from 'node:fs';
import vm from 'node:vm';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const indexPath = path.join(root, 'index.html');
const swPath = path.join(root, 'sw.js');

const args = new Set(process.argv.slice(2));
const doBump = args.has('--bump');
const doSmoke = args.has('--smoke');

let html = fs.readFileSync(indexPath, 'utf8');
let sw = fs.readFileSync(swPath, 'utf8');

if (doBump) {
    const htmlMatch = html.match(/window\.APP_BUILD\s*=\s*(\d+)\s*;/);
    const swMatch = sw.match(/const\s+CACHE_NAME\s*=\s*['"]rss-reader-v(\d+)['"]\s*;/);
    if (!htmlMatch || !swMatch) {
        console.error('Could not locate APP_BUILD or CACHE_NAME to bump.');
        process.exit(1);
    }
    const next = Math.max(Number(htmlMatch[1]), Number(swMatch[1])) + 1;
    html = html.replace(/window\.APP_BUILD\s*=\s*\d+\s*;/, `window.APP_BUILD = ${next};`);
    sw = sw.replace(/const\s+CACHE_NAME\s*=\s*['"]rss-reader-v\d+['"]\s*;/, `const CACHE_NAME = 'rss-reader-v${next}';`);
    fs.writeFileSync(indexPath, html, 'utf8');
    fs.writeFileSync(swPath, sw, 'utf8');
    console.log(`Bumped APP_BUILD and CACHE_NAME to ${next}`);
}

// 1. Verify APP_BUILD and CACHE_NAME match
const appBuild = html.match(/window\.APP_BUILD\s*=\s*(\d+)\s*;/)?.[1];
const swCache = sw.match(/const\s+CACHE_NAME\s*=\s*['"]rss-reader-v(\d+)['"]\s*;/)?.[1];
if (!appBuild || appBuild !== swCache) {
    console.error(`Build mismatch: index.html APP_BUILD=${appBuild}, sw.js CACHE_NAME=v${swCache}`);
    process.exit(1);
}

// 2. CSS brace balance
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
for (let i = 0; i < styles.length; i++) {
    let depth = 0;
    for (const ch of styles[i][1]) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        if (depth < 0) throw new Error(`Unmatched } in <style> #${i}`);
    }
    if (depth !== 0) throw new Error(`Unclosed { in <style> #${i} (depth=${depth})`);
}

// 3. JS syntax checks
const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
for (let i = 0; i < scripts.length; i++) {
    const attrs = scripts[i][1];
    const code = scripts[i][2];
    if (/\bsrc\s*=/.test(attrs) || !code.trim()) continue;
    if (/type\s*=\s*["']module["']/i.test(attrs)) {
        const cleaned = code.replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["']\s*;?/gm, '');
        new vm.Script(cleaned, { filename: `module-${i}.js` });
    } else {
        new vm.Script(code, { filename: `script-${i}.js` });
    }
}
new vm.Script(sw, { filename: 'sw.js' });

// 4. Static Tailwind SVG utility audit
const tw = (html.match(/<style id="tailwind-static">([\s\S]*?)<\/style>/) || ['', ''])[1];
const missingSvgClasses = new Set();
for (const m of html.matchAll(/<svg([^>]*)>/gi)) {
    const cls = (m[1].match(/\bclass\s*=\s*["']([^"']+)["']/) || [])[1];
    if (!cls) continue;
    for (const c of cls.split(/\s+/)) {
        if (!/^(w-|h-|opacity-)/.test(c)) continue;
        const twName = '.' + c.replace(/([.:/[\]%])/g, '\\$1');
        if (!tw.includes(`${twName}{`) && !tw.includes(`${twName} `) && !tw.includes(`${twName}:`) && !tw.includes(`${twName},`)) {
            missingSvgClasses.add(c);
        }
    }
}
if (missingSvgClasses.size > 0) {
    console.error('SVG classes missing from #tailwind-static:', [...missingSvgClasses]);
    process.exit(1);
}

console.log(`ALL SYNTAX, CSS, BUILD (${appBuild}), & SVG TAILWIND CHECKS PASSED`);

// 5. Optional headless Chrome viewport smoke check
if (doSmoke) {
    const chromeBin = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    if (!fs.existsSync(chromeBin)) {
        console.error('Google Chrome not found at', chromeBin);
        process.exit(1);
    }
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rss-smoke-'));
    const port = 9231;
    const chrome = spawn(chromeBin, [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${tmpDir}`,
        `--remote-debugging-port=${port}`,
        'about:blank'
    ], { stdio: 'ignore' });

    const getWsUrl = () => new Promise((resolve, reject) => {
        const start = Date.now();
        (function poll() {
            http.get(`http://127.0.0.1:${port}/json/list`, res => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => {
                    try {
                        const page = JSON.parse(data).find(t => t.type === 'page');
                        if (page?.webSocketDebuggerUrl) return resolve(page.webSocketDebuggerUrl);
                    } catch {}
                    if (Date.now() - start > 5000) return reject(new Error('Timeout waiting for Chrome'));
                    setTimeout(poll, 100);
                });
            }).on('error', () => {
                if (Date.now() - start > 5000) return reject(new Error('Timeout connecting to Chrome'));
                setTimeout(poll, 100);
            });
        })();
    });

    try {
        const ws = new WebSocket(await getWsUrl());
        await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
        let id = 0;
        const pending = new Map();
        ws.onmessage = ev => {
            const msg = JSON.parse(ev.data);
            if (msg.id && pending.has(msg.id)) {
                const { res, rej } = pending.get(msg.id);
                pending.delete(msg.id);
                if (msg.error) rej(new Error(msg.error.message));
                else res(msg.result);
            }
        };
        const send = (method, params = {}) => new Promise((res, rej) => {
            const mid = ++id;
            pending.set(mid, { res, rej });
            ws.send(JSON.stringify({ id: mid, method, params }));
        });
        await send('Page.enable');
        await send('Runtime.enable');
        await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 2, mobile: false });
        await send('Page.navigate', { url: `file://${indexPath}` });
        await new Promise(r => setTimeout(r, 1200));

        const cases = [
            ['desktop-dark-collapsed', false, true],
            ['desktop-light-collapsed', false, false],
            ['mobile-dark', true, true],
            ['mobile-light', true, false],
        ];
        for (const [label, mobile, dark] of cases) {
            await send('Emulation.setDeviceMetricsOverride', { width: mobile ? 390 : 1280, height: mobile ? 844 : 800, deviceScaleFactor: 2, mobile });
            await send('Runtime.evaluate', {
                expression: `document.documentElement.classList.toggle('dark', ${dark}); document.body.classList.toggle('sidebar-collapsed', ${!mobile});`
            });
            await new Promise(r => setTimeout(r, 150));
            const { result } = await send('Runtime.evaluate', {
                returnByValue: true,
                expression: `(() => {
                    const overflow = document.documentElement.scrollWidth > window.innerWidth;
                    const bigSvgs = [...document.querySelectorAll('svg')].filter(s => {
                        const r = s.getBoundingClientRect();
                        return r.width > 64 || r.height > 64;
                    }).map(s => ({ id: s.id, cls: s.getAttribute('class'), w: Math.round(s.getBoundingClientRect().width), h: Math.round(s.getBoundingClientRect().height) }));
                    const activeBtn = document.querySelector('body.sidebar-collapsed #smart-feeds-card .smart-feed-btn.active-item');
                    const railInfo = activeBtn ? {
                        btnBg: getComputedStyle(activeBtn).backgroundColor,
                        beforeW: getComputedStyle(activeBtn, '::before').width,
                        beforeH: getComputedStyle(activeBtn, '::before').height,
                        beforeRadius: getComputedStyle(activeBtn, '::before').borderRadius
                    } : null;
                    return { label: '${label}', overflow, bigSvgs, railInfo };
                })()`
            });
            const v = result.value;
            if (v.overflow || v.bigSvgs.length > 0) {
                console.error('SMOKE CHECK FAILED:', JSON.stringify(v));
                process.exitCode = 1;
            } else {
                console.log('SMOKE OK:', JSON.stringify(v));
            }
        }
        ws.close();
    } finally {
        chrome.kill('SIGKILL');
        fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}
