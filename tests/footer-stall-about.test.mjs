/** Luxury footer CTA and precise map links site-wide. */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'tests', 'scripts', '.git']);
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const MAP = 'https://maps.app.goo.gl/NaAHLbMCyyg8Dcfu5';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const pages = htmlFiles(root).map((file) => ({
  rel: path.relative(root, file),
  html: readFileSync(file, 'utf8'),
}));

test('unit: footer CSS uses deep brand field and gold CTA accents', () => {
  const css = read('assets/css/info.css');
  assert.match(css, /\.site-footer\{[\s\S]*#071824/);
  assert.match(css, /\.footer-cta\{/);
});

test('integration: every page ships the luxury footer visit CTA with precise map', () => {
  for (const page of pages) {
    assert.match(page.html, /class="footer-cta"/, page.rel);
    assert.match(page.html, /Open Google Maps/, page.rel);
    assert.match(page.html, new RegExp(MAP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), page.rel);
  }
});

test('module: about keeps stall photography in heritage and close sections', () => {
  const about = read('about/index.html');
  assert.match(about, /omuwenga-stall-wide\.jpg/);
  assert.match(about, /omuwenga-stall-counter\.jpg/);
  assert.match(about, /omuwenga-stall-hardware\.jpg/);
  for (const name of [
    'omuwenga-stall-wide.jpg',
    'omuwenga-stall-counter.jpg',
    'omuwenga-stall-hardware.jpg',
  ]) {
    assert.ok(existsSync(path.join(root, 'assets/images', name)), name);
  }
});

test('corrected functionality: about visit block uses precise pin and embed', () => {
  const about = read('about/index.html');
  const visit = about.match(/id="visit"[\s\S]*?<\/section>/)[0];
  assert.match(visit, /class="map-stage"/);
  assert.match(visit, /ftid=0x182f1129d8148173:0x3ab45ae9c290147b/);
  assert.match(visit, /Gikomba Market, Nairobi/);
  assert.match(visit, /Open precise location|Open Google Maps/);
  assert.match(visit, /Location &amp; delivery/);
  assert.match(visit, new RegExp(MAP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('stress: footer CTA + grid links remain present across the whole site', () => {
  assert.ok(pages.length >= 20);
  for (const page of pages) {
    assert.match(page.html, /footer-grid/, page.rel);
    assert.match(page.html, /Location &amp; map|location\//, page.rel);
    assert.match(page.html, /across East Africa/, page.rel);
  }
});

test('security: map iframes stay on Google; no javascript URLs', () => {
  for (const page of pages) {
    for (const [, src] of page.html.matchAll(/<iframe[^>]+src="([^"]+)"/g)) {
      assert.match(src, /^https:\/\/www\.google\.com\/maps/, `${page.rel} ${src}`);
    }
    assert.doesNotMatch(page.html, /javascript:/i, page.rel);
  }
});
