/** Premium product cards, go-to positioning, clear precise maps. */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const css = read('assets/css/info.css');
const about = read('about/index.html');
const location = read('location/index.html');
const home = read('index.html');
const products = read('products/index.html');
const contact = read('contact/index.html');
const MAP = 'https://maps.app.goo.gl/NaAHLbMCyyg8Dcfu5';

test('unit: product cards use premium 20px radius and soft media well', () => {
  assert.match(css, /\.product-grid \.product-card\{[\s\S]*border-radius:20px/);
  assert.match(css, /\.product-grid \.product-card-media\{[\s\S]*aspect-ratio:1/);
  assert.match(css, /\.luxe-product-card\{[\s\S]*border-radius:20px/);
  assert.match(css, /\.map-stage\{/);
  assert.match(css, /min-height:420px/);
});

test('integration: products and home pages load the upgraded info stylesheet', () => {
  for (const [name, html] of [
    ['products', products],
    ['home', home],
    ['about', about],
    ['location', location],
    ['contact', contact],
  ]) {
    assert.match(html, /info\.css\?v=1[456]/, name);
  }
});

test('module: about brand page carries founding year and signature', () => {
  assert.match(about, /Founded in 2022/);
  assert.match(about, /The Art of Supplying Excellence/);
  assert.match(about, /about-brand/);
  assert.doesNotMatch(about, /\[\[NEEDS FROM OWNER/);
});

test('corrected functionality: location and about show precise Omuwenga map', () => {
  for (const html of [location, about, home, contact]) {
    assert.match(html, /class="map-stage"/);
    assert.match(html, /ftid=0x182f1129d8148173:0x3ab45ae9c290147b/);
    assert.match(html, new RegExp(MAP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(location, /"@type":"LocalBusiness"/);
  assert.match(location, /hasMap/);
  assert.match(location, /NaAHLbMCyyg8Dcfu5/);
});

test('stress: home visit band keeps map iframe and three location facts', () => {
  const band = home.match(/class="visit-band"[\s\S]*?<\/section>/)[0];
  assert.match(band, /<iframe[^>]+Omuwenga/);
  assert.equal((band.match(/map-stage-facts/g) || []).length, 1);
  assert.ok((band.match(/<li>/g) || []).length >= 3);
});

test('security: map embeds stay on Google Maps and WhatsApp links stay wa.me', () => {
  for (const html of [location, about, home, contact]) {
    const iframes = [...html.matchAll(/<iframe[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    for (const src of iframes) {
      assert.match(src, /^https:\/\/www\.google\.com\/maps/);
      assert.doesNotMatch(src, /javascript:/i);
    }
  }
  assert.match(location, /wa\.me\/254718515142/);
  assert.doesNotMatch(about, /omegaomegageneralsuppliers@gmail\.com/);
});
