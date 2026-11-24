/** Product card photo sliders auto-advance while on screen. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  nextProductSliderScrollLeft,
  PRODUCT_SLIDER_AUTO_MS,
  productCardHtml,
} from '../assets/js/cms-core.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const live = readFileSync(path.join(root, 'assets/js/live.js'), 'utf8');
const products = readFileSync(path.join(root, 'products/index.html'), 'utf8');

test('unit: auto interval stays in a calm 2.5–8s band', () => {
  assert.equal(PRODUCT_SLIDER_AUTO_MS, 4000);
  assert.ok(PRODUCT_SLIDER_AUTO_MS >= 2500);
  assert.ok(PRODUCT_SLIDER_AUTO_MS <= 8000);
});

test('unit: next scroll wraps through each slide then back to start', () => {
  assert.equal(nextProductSliderScrollLeft(0, 300, 3), 300);
  assert.equal(nextProductSliderScrollLeft(300, 300, 3), 600);
  assert.equal(nextProductSliderScrollLeft(600, 300, 3), 0);
});

test('unit: next scroll tolerates bad widths and empty counts', () => {
  assert.equal(nextProductSliderScrollLeft(-10, 0, 0), 0);
  assert.equal(nextProductSliderScrollLeft('x', 'y', 2), 1);
  assert.equal(nextProductSliderScrollLeft(0, 200, 1), 0);
});

test('integration: live binds auto-scroll after catalog paint', () => {
  assert.match(live, /bindProductImageSliders/);
  assert.match(live, /PRODUCT_SLIDER_AUTO_MS/);
  assert.match(live, /nextProductSliderScrollLeft/);
  assert.match(live, /bindProductImageSliders\(grid\)/);
  assert.match(live, /prefers-reduced-motion/);
  assert.match(live, /IntersectionObserver/);
});

test('module: multi-image product cards still expose a slider track', () => {
  const html = productCardHtml({
    name: 'Castor set',
    images: [
      { url: 'https://cdn.example/a.jpg', is_featured: true },
      { url: 'https://cdn.example/b.jpg', is_featured: false },
    ],
  });
  assert.match(html, /product-slider/);
  assert.match(html, /product-slider-track/);
  assert.match(html, /data-slider-step/);
  assert.equal((html.match(/product-open/g) || []).length >= 2, true);
});

test('stress: advancing 500 times stays on the slide grid', () => {
  let left = 0;
  const width = 240;
  const count = 4;
  for (let i = 0; i < 500; i += 1) {
    left = nextProductSliderScrollLeft(left, width, count);
    assert.equal(left % width, 0);
    assert.ok(left >= 0);
    assert.ok(left < width * count);
  }
  assert.equal(left, ((500 % count) * width));
});

test('corrected functionality: product pages load the auto-scrolling live module', () => {
  assert.match(products, /data-catalog/);
  assert.match(products, /live\.js\?v=19/);
  assert.match(live, /dataset\.autoBound/);
  assert.match(live, /scrollTo/);
});

test('security: auto-scroll helpers never emit scripted image URLs', () => {
  const html = productCardHtml({
    name: 'Safe slider',
    images: [
      { url: 'javascript:alert(1)', is_featured: true },
      { url: 'https://cdn.example/ok.jpg', is_featured: false },
    ],
  });
  assert.doesNotMatch(html, /javascript:/i);
  assert.match(html, /cdn\.example\/ok\.jpg/);
  assert.equal(nextProductSliderScrollLeft(0, 100, 99), 100);
});
