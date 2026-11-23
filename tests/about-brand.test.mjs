/** About brand redesign: approved copy, expertise grid, precise map. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const about = read('about/index.html');
const css = read('assets/css/info.css');
const MAP = 'https://maps.app.goo.gl/NaAHLbMCyyg8Dcfu5';

test('unit: about brand tokens and section classes exist in CSS', () => {
  assert.match(css, /--ab-navy:#101D35/);
  assert.match(css, /--ab-gold:#D4AF37/);
  assert.match(css, /--ab-ivory:#F4F0E8/);
  assert.match(css, /\.ab-hero\{/);
  assert.match(css, /\.ab-supply-grid\{/);
  assert.match(css, /\.ab-values-list\{/);
});

test('integration: about keeps nav, footer, products and contact links', () => {
  assert.match(about, /about-brand/);
  assert.match(about, /<nav class="main-nav"/);
  assert.match(about, /footer-cta/);
  assert.match(about, /href="\.\.\/products\/"/);
  assert.match(about, /href="\.\.\/catalogue\/"/);
  assert.match(about, /href="\.\.\/contact\/"/);
  assert.match(about, /wa\.me\/254718515142/);
});

test('module: approved vision, mission, values and philosophy are verbatim', () => {
  assert.match(about, /The Art of Supplying Excellence\./);
  assert.match(about, /Every Detail Matters\. Every Partnership Counts\./);
  assert.match(
    about,
    /To shape a more connected and distinguished furniture industry through exceptional supply, thoughtful partnerships and an uncompromising commitment to excellence\./,
  );
  assert.match(
    about,
    /To simplify sourcing for the furniture trade through a carefully curated product range, reliable service and a deep understanding of our customers/,
  );
  for (const value of ['Excellence', 'Integrity', 'Partnership', 'Heritage', 'Progress']) {
    assert.match(about, new RegExp(`<h3>${value}<\\/h3>`));
  }
  assert.match(about, /Founded in 2022/);
  assert.match(about, /over four years/);
});

test('corrected functionality: eight expertise cards link to real catalogue paths', () => {
  const cards = [...about.matchAll(/class="ab-supply-card" href="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(cards.length, 8);
  for (const href of cards) {
    const target = path.resolve(path.join(root, 'about'), href);
    assert.ok(
      existsSync(target) || existsSync(path.join(target, 'index.html')),
      href,
    );
  }
  assert.match(about, /Sofa Stands &amp; Legs/);
  assert.match(about, /Zippers &amp; Sliders/);
});

test('stress: about page ships hero through close CTA without owner placeholders', () => {
  for (const cls of [
    'ab-hero',
    'ab-heritage',
    'ab-supply',
    'ab-philosophy-band',
    'ab-vm',
    'ab-values',
    'ab-customers',
    'ab-outlook',
    'ab-visit',
    'ab-close',
  ]) {
    assert.match(about, new RegExp(`class="${cls}"`));
  }
  assert.doesNotMatch(about, /\[\[NEEDS FROM OWNER/);
  assert.doesNotMatch(about, /number one supplier|market leader|nationwide branches/i);
});

test('security: precise map link and Google embed stay trusted; images local', () => {
  assert.match(about, new RegExp(MAP.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(about, /ftid=0x182f1129d8148173:0x3ab45ae9c290147b/);
  for (const [, src] of about.matchAll(/<iframe[^>]+src="([^"]+)"/g)) {
    assert.match(src, /^https:\/\/www\.google\.com\/maps/);
  }
  for (const [, src] of about.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    assert.doesNotMatch(src, /^https?:/i);
    assert.ok(existsSync(path.resolve(path.join(root, 'about'), src)), src);
  }
  assert.doesNotMatch(about, /javascript:/i);
});
