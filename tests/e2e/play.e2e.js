#!/usr/bin/env node
/**
 * Test e2e në shfletues real (Playwright): hap aplikacionin nga server.js, zgjedh kanale që health-check
 * i ka shënuar online (Kosovë/Shqipëri/fqinjë + disa ndërkombëtarë + radio) dhe verifikon që
 * video.currentTime ecën brenda 20 sekondave. Shtetet e tjera ngarkohen lazy gjatë testit.
 *
 *   npm i -D playwright && npx playwright install chromium
 *   node tests/e2e/play.e2e.js [--n=20] [--timeout=20000] [--port=3105] [--browser=msedge|chrome|chromium]
 *
 * Shënim: Chromium i Playwright nuk ka kodekë H.264/AAC; ndaj përdoret Edge/Chrome i instaluar
 * (channel) dhe vetëm si rezervë Chromium. Raporti shkruhet te e2e-report.md.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const N = Number(args.n) || 20;
const TIMEOUT = Number(args.timeout) || 20000;
const PORT = Number(args.port) || 3105;
const PREFERRED = ['xk', 'al', 'mk', 'rs', 'gr', 'me', 'tr', 'uk', 'de', 'it', 'fr', 'us', 'radio'];

function pickChannels() {
  const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
  const picks = [];
  for (const code of PREFERRED) {
    const hp = path.join(ROOT, 'data', 'health', `${code}.json`);
    const cp = path.join(ROOT, 'data', 'countries', `${code}.json`);
    if (!fs.existsSync(hp) || !fs.existsSync(cp)) continue;
    const results = readJson(hp).results || {};
    const good = readJson(cp).channels.filter((c) => c.sources.some((s) => results[s.url] && results[s.url].s === 'online'));
    // dy për shtet (një për radio/shtetet ndërkombëtare); shtetet lokale marrin përparësi
    const take = ['xk', 'al'].includes(code) ? 3 : (['mk', 'rs', 'gr'].includes(code) ? 2 : 1);
    // shpërndarje: mos merr vetëm kanalet e para
    const step = Math.max(1, Math.floor(good.length / take));
    for (let i = 0; i < take && i * step < good.length; i++) picks.push({ code, ch: good[i * step] });
  }
  return picks.slice(0, N);
}

async function waitForServer(url, ms = 8000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { const r = await fetch(url); if (r.ok) return; } catch { /* ende s'është gati */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Serveri nuk u ngrit te ${url}`);
}

async function launch(playwright) {
  const order = args.browser ? [args.browser] : ['msedge', 'chrome', 'chromium'];
  let lastErr;
  for (const b of order) {
    try {
      const opts = { headless: true, args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] };
      if (b !== 'chromium') opts.channel = b;
      return { browser: await playwright.chromium.launch(opts), name: b };
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

(async () => {
  const picks = pickChannels();
  if (!picks.length) {
    console.error('Nuk ka kanale online te data/health/*.json. Nise: node tools/check-channels.js');
    process.exit(2);
  }
  const server = spawn(process.execPath, ['server.js', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  const base = `http://127.0.0.1:${PORT}`;
  let browser;
  const rows = [];
  try {
    await waitForServer(`${base}/data/index.json`);
    const playwright = require('playwright');
    const launched = await launch(playwright);
    browser = launched.browser;
    console.log(`Shfletuesi: ${launched.name}; kanale: ${picks.length}; timeout ${TIMEOUT}ms`);
    const page = await (await browser.newContext()).newPage();
    const consoleErrors = [];
    page.on('pageerror', (e) => consoleErrors.push(String(e.message || e)));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.miniIptv && window.miniIptv.ui, null, { timeout: 15000 });

    await page.evaluate(() => {
      window.miniIptv.player.addEventListener('state', (e) => { if (e.detail.attempt) window.__via = e.detail.attempt.via; });
    });

    for (const { code, ch } of picks) {
      const t0 = Date.now();
      const out = await page.evaluate(async ({ id, code: cc, timeout }) => {
        const app = window.miniIptv;
        if (!app.ui.catalog.loaded.has(cc)) await app.ui.setCountry(cc);
        const c = app.ui.all.find((x) => x.id === id);
        if (!c) return { ok: false, why: 'kanali nuk u gjet pas ngarkimit të shtetit' };
        window.__via = '';
        app.ui.playChannel(c);
        const media = c.type === 'radio' ? document.getElementById('audio') : document.getElementById('video');
        const start = performance.now();
        let last = '';
        while (performance.now() - start < timeout) {
          if (media.currentTime > 1.5 && !media.paused) {
            const s = app.player.stats();
            return { ok: true, t: Math.round(performance.now() - start), via: window.__via || '', height: s.height || 0 };
          }
          last = document.getElementById('overlayText').textContent;
          await new Promise((r) => setTimeout(r, 250));
        }
        return { ok: false, why: `pa progres brenda ${timeout / 1000}s; ${document.getElementById('statusText').textContent}; ${last}` };
      }, { id: ch.id, code, timeout: TIMEOUT });
      rows.push({ code, name: ch.name, type: ch.type, url: ch.sources[0].url, ...out, ms: Date.now() - t0 });
      console.log(`${out.ok ? 'OK  ' : 'FAIL'} [${code}] ${ch.name}${out.ok ? ` (${out.t}ms, ${out.via || '?'}, ${out.height || '-'}p)` : ` :: ${out.why}`}`);
    }
    rows.consoleErrors = consoleErrors;
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }

  const ok = rows.filter((r) => r.ok).length;
  const md = [
    '# Raporti e2e (Playwright)', '',
    `Gjeneruar: ${new Date().toISOString()}`, '',
    `Kanale të provuara: **${rows.length}**, luajtën: **${ok}**, dështuan: **${rows.length - ok}**`, '',
    '| Shteti | Kanali | Lloji | Rezultati | Detaje |', '|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.code} | ${String(r.name).replace(/\|/g, '\\|')} | ${r.type} | ${r.ok ? 'OK' : 'DËSHTOI'} | ${r.ok ? `${r.t}ms, ${r.via || '?'}, ${r.height || '-'}p` : String(r.why).replace(/\|/g, '\\|')} |`),
    '', rows.consoleErrors && rows.consoleErrors.length ? `Gabime JS në faqe: ${rows.consoleErrors.length}\n\n${[...new Set(rows.consoleErrors)].slice(0, 5).map((e) => `- ${e}`).join('\n')}` : 'Pa gabime JS në faqe.', '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'e2e-report.md'), md);
  console.log(`\nLuajtën ${ok}/${rows.length}. Raporti: e2e-report.md`);
  process.exit(ok >= Math.ceil(rows.length * 0.5) ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(2); });
