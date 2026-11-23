/** Luxury footer CTA and About stall photography + location. */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'tests', 'scripts', '.git']);
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

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
  assert.match(css, /\.stall-mosaic\{/);
  assert.match(css, /border-radius:18px/);
});

test('integration: every page ships the luxury footer visit CTA', () => {
  for (const page of pages) {
    assert.match(page.html, /class="footer-cta"/, page.rel);
    assert.match(page.html, /Visit the go-to stall/, page.rel);
    assert.match(page.html, /Open Google Maps/, page.rel);
    assert.match(page.html, /maps\.google\.com\/\?q=Gikomba\+Market\+Nairobi/, page.rel);
  }
});

test('module: about positions the three stall photos in hero, story and mosaic', () => {
  const about = read('about/index.html');
  assert.match(about, /omuwenga-stall-wide\.jpg/);
  assert.match(about, /omuwenga-stall-counter\.jpg/);
  assert.match(about, /omuwenga-stall-hardware\.jpg/);
  assert.match(about, /class="stall-mosaic"/);
  assert.match(about, /class="stall-feature"/);
  assert.match(about, /Inside the stall/);
  for (const name of [
    'omuwenga-stall-wide.jpg',
    'omuwenga-stall-counter.jpg',
    'omuwenga-stall-hardware.jpg',
  ]) {
    assert.ok(existsSync(path.join(root, 'assets/images', name)), name);
  }
});

test('corrected functionality: about location block stays map-first and clear', () => {
  const about = read('about/index.html');
  const visit = about.match(/id="visit"[\s\S]*?<\/section>/)[0];
  assert.match(visit, /class="map-stage"/);
  assert.match(visit, /maps\?q=Gikomba%20Market%20Nairobi/);
  assert.match(visit, /Gikomba Market, Nairobi/);
  assert.match(visit, /8:00am–6:00pm|8:00am&ndash;6:00pm|8:00am/);
  assert.match(visit, /Open Google Maps/);
  assert.match(visit, /Location &amp; delivery/);
});

test('stress: footer CTA + grid links remain present across the whole site', () => {
  assert.ok(pages.length >= 20);
  for (const page of pages) {
    assert.match(page.html, /footer-grid/, page.rel);
    assert.match(page.html, /Location &amp; map|location\//, page.rel);
    assert.match(page.html, /across East Africa/, page.rel);
  }
});

test('security: stall image paths stay local assets; map iframes stay on Google', () => {
  const about = read('about/index.html');
  const imgs = [...about.matchAll(/<(?:img)\s[^>]*src="([^"]+\.jpg)"/g)].map((m) => m[1]);
  assert.ok(imgs.length >= 3);
  for (const src of imgs) {
    assert.doesNotMatch(src, /^https?:/i, src);
    const target = path.resolve(path.join(root, 'about'), src);
    assert.ok(existsSync(target), src);
  }
  for (const page of pages) {
    for (const [, src] of page.html.matchAll(/<iframe[^>]+src="([^"]+)"/g)) {
      assert.match(src, /^https:\/\/www\.google\.com\/maps/, `${page.rel} ${src}`);
    }
    assert.doesNotMatch(page.html, /javascript:/i, page.rel);
  }
});
