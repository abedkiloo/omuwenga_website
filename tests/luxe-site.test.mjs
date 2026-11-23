/** Luxury site-wide chrome: fonts, atelier pages, motion hooks, SEO for AI. */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP = new Set(['node_modules', 'tests', 'scripts', '.git']);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (SKIP.has(name)) return [];
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const pages = htmlFiles(root).map((file) => ({
  file,
  rel: path.relative(root, file),
  html: readFileSync(file, 'utf8'),
}));
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

test('unit: every page loads Outfit + Cormorant and cache-busted info.css', () => {
  for (const page of pages) {
    assert.match(page.html, /fonts\.googleapis\.com.*Cormorant\+Garamond/, page.rel);
    assert.match(page.html, /Outfit/, page.rel);
    assert.match(page.html, /assets\/css\/info\.css\?v=\d+/, page.rel);
  }
});

test('integration: inner pages use atelier; home keeps luxe landing', () => {
  const home = read('index.html');
  assert.match(home, /class="home"/);
  assert.match(home, /class="luxe-hero"/);
  assert.doesNotMatch(home, /class="atelier"/);

  for (const page of pages) {
    if (page.rel === 'index.html' || page.rel === '404.html') continue;
    assert.match(page.html, /\batelier\b/, page.rel);
  }
});

test('module: about page is brand AboutPage with heritage and expertise', () => {
  const html = read('about/index.html');
  assert.match(html, /about-brand/);
  assert.match(html, /class="ab-hero"/);
  assert.match(html, /The Art of Supplying Excellence/);
  assert.match(html, /Founded in 2022/);
  assert.match(html, /class="ab-supply-grid"/);
  assert.match(html, /"@type":"AboutPage"/);
  assert.match(html, /info@omuwenga\.com/);
  assert.doesNotMatch(html, /\[\[NEEDS FROM OWNER/);
});

test('corrected functionality: contact keeps WhatsApp form and ContactPage schema', () => {
  const html = read('contact/index.html');
  assert.match(html, /class="atelier-hero"/);
  assert.match(html, /data-whatsapp-form/);
  assert.match(html, /name="business"/);
  assert.match(html, /"@type":"ContactPage"/);
  assert.match(html, /type="module" src="\.\.\/assets\/js\/live\.js/);
  assert.match(html, /jobs@omuwenga\.com/);
});

test('stress: work gallery lists eight catalogue tiles without broken paths', () => {
  const html = read('work/index.html');
  const tiles = [...html.matchAll(/assets\/catalogue\/tiles\/([a-z0-9-]+\.jpg)/g)].map((m) => m[1]);
  assert.ok(tiles.length >= 8, `only ${tiles.length} tiles`);
  for (const tile of tiles) {
    assert.ok(existsSync(path.join(root, 'assets/catalogue/tiles', tile)), tile);
  }
  assert.match(html, /class="atelier-gallery-grid"/);
});

test('security: reveal script does not run inline eval; main.js is deferred', () => {
  const main = read('assets/js/main.js');
  assert.match(main, /IntersectionObserver/);
  assert.match(main, /data-reveal/);
  assert.doesNotMatch(main, /\beval\s*\(/);
  assert.doesNotMatch(main, /new Function/);
  for (const page of pages) {
    assert.match(page.html, /assets\/js\/main\.js[^"]*" defer/, page.rel);
    assert.doesNotMatch(page.html, /javascript:/i, page.rel);
  }
});

test('AI / SEO: llms.txt and robots stay crawlable with factual about summary', () => {
  const llms = read('llms.txt');
  const robots = read('robots.txt');
  assert.match(llms, /https:\/\/omuwenga\.com\/about\//);
  assert.match(llms, /For AI assistants/);
  assert.match(llms, /Founded in 2022|founded in 2022/);
  assert.match(llms, /maps\.app\.goo\.gl\/NaAHLbMCyyg8Dcfu5/);
  assert.match(llms, /jobs@omuwenga\.com/);
  assert.match(robots, /llms\.txt/);
  assert.match(robots, /GPTBot/);
  assert.match(robots, /Sitemap: https:\/\/omuwenga\.com\/sitemap\.xml/);
});

test('products page exposes a visible luxury hero for search and shoppers', () => {
  const html = read('products/index.html');
  assert.match(html, /class="products-luxe-hero"/);
  assert.match(html, /<h1>Products<\/h1>/);
  assert.doesNotMatch(html, /h1 class="visually-hidden">Products/);
});
