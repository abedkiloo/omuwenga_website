/** Home announce bar rotates shop products instead of the hiring line. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  announceProductLineHtml,
  ANNOUNCE_PRODUCT_PAGE_SIZE,
  ANNOUNCE_ROTATE_MS,
  nextAnnounceIndex,
  shuffleProducts,
} from '../assets/js/cms-core.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = readFileSync(path.join(root, 'assets/js/live.js'), 'utf8');
const home = readFileSync(path.join(root, 'index.html'), 'utf8');

test('unit: announce page size and rotate interval stay in bounds', () => {
  assert.ok(ANNOUNCE_PRODUCT_PAGE_SIZE >= 1 && ANNOUNCE_PRODUCT_PAGE_SIZE <= 48);
  assert.ok(ANNOUNCE_ROTATE_MS >= 2000 && ANNOUNCE_ROTATE_MS <= 12000);
  assert.equal(nextAnnounceIndex(0, 3), 1);
  assert.equal(nextAnnounceIndex(2, 3), 0);
  assert.equal(nextAnnounceIndex(0, 0), 0);
});

test('unit: shuffle keeps every product and drops empties', () => {
  const rows = [{ name: 'A' }, null, { name: 'B' }, { name: 'C' }];
  const shuffled = shuffleProducts(rows);
  assert.equal(shuffled.length, 3);
  assert.deepEqual(new Set(shuffled.map((r) => r.name)), new Set(['A', 'B', 'C']));
  assert.deepEqual(shuffleProducts([]), []);
  assert.deepEqual(shuffleProducts(null), []);
});

test('integration: live.js wires the announce rotator to the products API', () => {
  assert.match(live, /initAnnounceProducts/);
  assert.match(live, /data-announce-products/);
  assert.match(live, /ANNOUNCE_PRODUCT_PAGE_SIZE/);
  assert.match(live, /announceProductLineHtml/);
  assert.match(live, /shuffleProducts/);
  assert.match(home, /data-announce-products/);
  assert.match(home, /data-announce-static/);
  assert.match(home, /data-announce-live/);
});

test('module: announce line links into products and escapes names', () => {
  const html = announceProductLineHtml({
    name: 'No. 5 <zipper>',
    category: { name: 'Zippers & "sliders"' },
  });
  assert.match(html, /In stock/);
  assert.match(html, /href="products\/"/);
  assert.match(html, /No\. 5 &lt;zipper&gt;/);
  assert.match(html, /Zippers &amp; &quot;sliders&quot;/);
  assert.equal(announceProductLineHtml({}), '');
  assert.equal(announceProductLineHtml(null), '');
});

test('corrected functionality: hiring copy left the announce bar', () => {
  assert.doesNotMatch(home, /Now hiring: Sales Representative/);
  assert.doesNotMatch(home, /View the role/);
  assert.match(home, /Wholesale/);
  assert.match(home, /Browse products/);
  assert.match(home, /class="luxe-careers"/);
});

test('stress: large catalogue shuffle stays capped and stable', () => {
  const many = Array.from({ length: 300 }, (_, i) => ({ name: `Item ${i}` }));
  const shuffled = shuffleProducts(many);
  assert.equal(shuffled.length, 200);
  assert.equal(new Set(shuffled.map((r) => r.name)).size, 200);
});

test('security: announce HTML escapes script payloads in product names', () => {
  const html = announceProductLineHtml({
    name: '<script>alert(1)</script>',
    category: { name: '"><img src=x onerror=alert(1)>' },
  });
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img\s/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&quot;&gt;&lt;img src=x onerror=alert\(1\)&gt;/);
});
