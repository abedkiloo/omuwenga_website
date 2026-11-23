/** Home featured fittings: top six only; full range in the catalogue. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  featuredProductCardHtml,
  HOME_FEATURED_PAGE_SIZE,
  homeFeaturedHasMore,
} from '../assets/js/cms-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = readFileSync(path.join(root, 'assets/js/live.js'), 'utf8');
const home = readFileSync(path.join(root, 'index.html'), 'utf8');

test('unit: featured page size stays at six', () => {
  assert.equal(HOME_FEATURED_PAGE_SIZE, 6);
});

test('integration: live home loader fetches one capped page only', () => {
  assert.match(live, /HOME_FEATURED_PAGE_SIZE/);
  assert.match(live, /featuredProductCardHtml/);
  assert.match(live, /page:\s*1/);
  assert.match(live, /page_size:\s*HOME_FEATURED_PAGE_SIZE/);
  assert.match(live, /\.slice\(0,\s*HOME_FEATURED_PAGE_SIZE\)/);
  assert.doesNotMatch(live, /IntersectionObserver/);
  assert.doesNotMatch(live, /data-home-products-sentinel/);
});

test('module: has-more stays false so home never infinite-scrolls', () => {
  assert.equal(homeFeaturedHasMore({ next: 'https://api.omuwenga.com/x?page=2' }), false);
  assert.equal(homeFeaturedHasMore({ next: '' }), false);
  assert.equal(homeFeaturedHasMore(null), false);
});

test('corrected functionality: featured card escapes names and links WhatsApp', () => {
  const html = featuredProductCardHtml({
    name: 'Webbing "50mm"',
    price: 90,
    subcategory: { name: 'Webbing' },
    image_url: 'https://cdn.example/w.jpg',
  });
  assert.match(html, /Webbing &quot;50mm&quot;/);
  assert.match(html, /href="https:\/\/wa\.me\/254718515142\?text=/);
  assert.doesNotMatch(html, /name="50mm"/);
});

test('corrected functionality: home shows top six and points to catalogue', () => {
  assert.match(home, /data-home-products-list/);
  assert.match(home, /Browse the catalogue/);
  assert.match(home, /href="catalogue\/"/);
  assert.match(home, /Showing our top six fittings/);
  assert.match(home, /See the full catalogue/);
  assert.doesNotMatch(home, /data-home-products-sentinel/);
  assert.doesNotMatch(home, /Scroll for more fittings/);
});

test('stress: many featured cards stay bounded HTML fragments', () => {
  const chunk = Array.from({ length: 60 }, (_, i) =>
    featuredProductCardHtml({
      id: i + 1,
      name: `Item ${i}`,
      price: i * 10,
      category: { name: 'Hardware' },
    }),
  ).join('');
  assert.equal((chunk.match(/luxe-product-card/g) || []).length, 60);
  assert.ok(chunk.length < 120_000);
});

test('security: featured card drops javascript image URLs', () => {
  const html = featuredProductCardHtml({
    name: 'Safe',
    image_url: 'javascript:alert(1)',
    images: [{ url: 'javascript:alert(2)', is_featured: true }],
  });
  assert.doesNotMatch(html, /javascript:/i);
  assert.match(html, /luxe-product-fallback/);
});

test('security: home catalogue CTA stays same-origin path', () => {
  assert.match(home, /href="catalogue\/"/);
  assert.doesNotMatch(home, /href="https?:\/\/[^"]*catalogue/);
  assert.doesNotMatch(home, /javascript:/i);
});
