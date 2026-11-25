/** Product photo zoom lightbox fits the viewport and keeps chrome out of the image. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  productCardHtml,
  zoomDialogEnquiryLinks,
} from '../assets/js/cms-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = readFileSync(path.join(root, 'assets/js/live.js'), 'utf8');
const styles = readFileSync(path.join(root, 'assets/css/styles.css'), 'utf8');
const products = readFileSync(path.join(root, 'products/index.html'), 'utf8');

function nextZoomIndex(index, delta, length) {
  if (!length) return 0;
  return (index + delta + length) % length;
}

test('unit: zoom dialog uses a full-viewport shell without cramped inline sizing', () => {
  assert.match(live, /class="zoom-shell"/);
  assert.match(live, /class="zoom-stage-wrap"/);
  assert.match(live, /class="zoom-stage-nav prev"/);
  assert.doesNotMatch(live, /max-height:min\(72vh/);
  assert.doesNotMatch(live, /width:min\(520px/);
  assert.match(styles, /\.zoom-view\[open\]/);
  assert.match(styles, /height:min\(92dvh/);
  assert.match(styles, /\.zoom-stage img\{[^}]*max-height:100%/);
});

test('unit: gallery wrap math stays in range', () => {
  assert.equal(nextZoomIndex(0, -1, 4), 3);
  assert.equal(nextZoomIndex(3, 1, 4), 0);
  assert.equal(nextZoomIndex(1, 1, 1), 0);
  assert.equal(nextZoomIndex(2, 1, 0), 0);
});

test('integration: zoom chrome separates zoom controls from gallery nav', () => {
  assert.match(live, /data-zoom-out/);
  assert.match(live, /data-zoom-in/);
  assert.match(live, /data-zoom-close/);
  assert.match(live, /syncGalleryChrome/);
  assert.match(live, /ArrowLeft/);
  assert.match(live, /ArrowRight/);
  assert.match(live, /prevBtn\.hidden/);
  assert.match(live, /views\.hidden/);
});

test('module: multi-image cards still feed zoom sources', () => {
  const html = productCardHtml({
    name: '4" TROPHY STAND',
    images: [
      { url: 'https://cdn.example/gold.jpg', is_featured: true },
      { url: 'https://cdn.example/rose.jpg', is_featured: false },
      { url: 'https://cdn.example/silver.jpg', is_featured: false },
    ],
  });
  assert.match(html, /data-zoom-src="https:\/\/cdn\.example\/gold\.jpg"/);
  assert.match(html, /data-zoom-src="https:\/\/cdn\.example\/rose\.jpg"/);
  assert.match(html, /data-zoom-src="https:\/\/cdn\.example\/silver\.jpg"/);
  assert.ok((html.match(/data-zoom-src=/g) || []).length >= 3);
});

test('stress: wrapping through a long gallery stays bounded', () => {
  let index = 0;
  const length = 7;
  for (let i = 0; i < 1000; i += 1) {
    index = nextZoomIndex(index, i % 2 === 0 ? 1 : -1, length);
    assert.ok(index >= 0);
    assert.ok(index < length);
  }
});

test('corrected functionality: products page loads zoom CSS/JS cache busts', () => {
  assert.match(products, /styles\.css\?v=15/);
  assert.match(products, /live\.js\?v=22/);
  assert.match(live, /initProductZoom/);
  assert.match(styles, /\.zoom-view::backdrop/);
  assert.match(styles, /rgba\(8,12,18,\.78\)/);
});

test('security: zoom enquiry helper keeps WhatsApp links non-scripted', () => {
  const links = zoomDialogEnquiryLinks({
    enquiryHref: '/contact/',
    askHref: 'javascript:alert(1)',
    productName: 'Trophy',
  });
  assert.equal(links.askHref, '');
  assert.match(links.label, /Trophy/);
  const safe = zoomDialogEnquiryLinks({
    enquiryHref: '/contact/',
    askHref: 'https://wa.me/254718515142?text=Trophy',
    productName: 'Trophy',
  });
  assert.match(safe.askHref, /^https:\/\/wa\.me\//);
});
