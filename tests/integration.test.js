import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const visualizerDir = path.dirname(__dirname);

test('Production build output directory contains compiled assets', () => {
  const outDir = path.join(visualizerDir, 'out');
  assert.equal(fs.existsSync(outDir), true, 'out/ directory must exist');

  const indexHtml = path.join(outDir, 'index.html');
  assert.equal(fs.existsSync(indexHtml), true, 'out/index.html must exist');

  const assetsDir = path.join(outDir, 'assets');
  assert.equal(fs.existsSync(assetsDir), true, 'out/assets directory must exist');

  const files = fs.readdirSync(assetsDir);
  const hasJs = files.some((f) => f.endsWith('.js'));
  const hasCss = files.some((f) => f.endsWith('.css'));

  assert.equal(hasJs, true, 'out/assets must contain bundled JS');
  assert.equal(hasCss, true, 'out/assets must contain bundled CSS');
});

test('HTML source contains no known tracking scripts', () => {
  const indexHtml = fs.readFileSync(path.join(visualizerDir, 'index.html'), 'utf-8');

  // Verify no tracking scripts, analytics, or external API calls
  assert.equal(indexHtml.includes('google-analytics.com'), false);
  assert.equal(indexHtml.includes('doubleclick.net'), false);
  assert.equal(indexHtml.includes('segment.com'), false);
  assert.equal(indexHtml.includes('mixpanel.com'), false);
  assert.equal(indexHtml.includes('sentry.io'), false);

  // Verify privacy indicator badge is present in DOM
  assert.match(indexHtml, /CSV contents stay in this browser/);
});

test('Source code privacy guarantee: Zero unprompted network calls in JS modules', () => {
  const jsDir = path.join(visualizerDir, 'src', 'js');
  const jsFiles = fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'));

  for (const file of jsFiles) {
    const content = fs.readFileSync(path.join(jsDir, file), 'utf-8');
    // Ensure no fetch(), XMLHttpRequest, navigator.sendBeacon, or WebSocket
    assert.equal(content.includes('fetch('), false, `No fetch() allowed in ${file}`);
    assert.equal(content.includes('XMLHttpRequest'), false, `No XMLHttpRequest allowed in ${file}`);
    assert.equal(content.includes('sendBeacon'), false, `No sendBeacon allowed in ${file}`);
    assert.equal(content.includes('new WebSocket'), false, `No WebSocket allowed in ${file}`);
  }
});

test('Index.html contains required semantic sections and fixtures', () => {
  const indexHtml = fs.readFileSync(path.join(visualizerDir, 'index.html'), 'utf-8');

  assert.match(indexHtml, /BETWEEN PAYCHECKS/);
  assert.match(indexHtml, /Understand the month/);
  assert.match(indexHtml, /id="sankeyContainer"/);
  assert.match(indexHtml, /id="historyContainer"/);
  assert.match(indexHtml, /id="drilldownContainer"/);
  assert.match(indexHtml, /id="ledgerContainer"/);
  assert.match(indexHtml, /id="ingest-modal"/);
  assert.match(indexHtml, /id="kpi-gap-card"/);
});
