/** Premium product cards, About story, go-to positioning, clear maps. */
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

test('unit: product cards use premium 20px radius and soft media well', () => {
  assert.match(css, /\.product-grid \.product-card\{[\s\S]*border-radius:20px/);
  assert.match(css, /\.product-grid \.product-card-media\{[\s\S]*aspect-ratio:1/);
  assert.match(css, /\.luxe-product-card\{[\s\S]*border-radius:20px/);
  assert.match(css, /\.map-stage\{/);
  assert.match(css, /min-height:420px/);
});

test('integration: products and home pages load the upgraded info stylesheet', () => {
  assert.match(products, /info\.css\?v=14/);
  assert.match(home, /info\.css\?v=14/);
  assert.match(about, /info\.css\?v=14/);
  assert.match(location, /info\.css\?v=14/);
  assert.match(contact, /info\.css\?v=14/);
});

test('module: about page tells the humble-beginnings story without invented years', () => {
  assert.match(about, /Humble beginnings/);
  assert.match(about, /story-timeline/);
  assert.match(about, /A fittings stall in Gikomba/);
  assert.match(about, /go-to supply partner|go-to fittings partner/i);
  assert.doesNotMatch(about, /founded in 19|established in 19|since 19\d\d/i);
  assert.doesNotMatch(about, /\[\[NEEDS FROM OWNER/);
});

test('corrected functionality: location and about show a clear map stage', () => {
  for (const html of [location, about, home, contact]) {
    assert.match(html, /class="map-stage"/);
    assert.match(html, /maps\?q=Gikomba%20Market%20Nairobi/);
    assert.match(html, /Open Google Maps/);
  }
  assert.match(location, /"@type":"LocalBusiness"/);
  assert.match(location, /hasMap/);
});

test('stress: home visit band keeps map iframe and three location facts', () => {
  const band = home.match(/class="visit-band"[\s\S]*?<\/section>/)[0];
  assert.match(band, /<iframe[^>]+Gikomba/);
  assert.equal((band.match(/map-stage-facts/g) || []).length, 1);
  assert.ok((band.match(/<li>/g) || []).length >= 3);
  assert.match(home, /go-to/i);
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
