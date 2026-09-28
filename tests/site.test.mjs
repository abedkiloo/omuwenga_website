/** Whole-site checks: every page is SEO-ready, branded and links resolve. */
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
const isPostTemplate = (p) => p.rel === path.join('blog', 'post', 'index.html');

test('found the site pages', () => {
  assert.ok(pages.length >= 14, `only ${pages.length} pages`);
});

for (const page of pages) {
  test(`${page.rel}: branding and contacts`, () => {
    assert.doesNotMatch(page.html, /Placeholder/);
    assert.doesNotMatch(page.html, /700000000|700&nbsp;000/);
    assert.match(page.html, /wa\.me\/254718515142/);
    assert.match(page.html, /class="whatsapp-float"/);
  });

  test(`${page.rel}: SEO head`, () => {
    assert.equal((page.html.match(/<title>/g) || []).length, 1);
    assert.match(page.html, /<meta name="description" content="[^"]{20,}">/);
    assert.match(page.html, /<link rel="canonical" href="https:\/\/[^"]+">/);
    assert.match(page.html, /<html lang="en-KE">/);
    if (!isPostTemplate(page)) {
      for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) {
        assert.equal((page.html.match(new RegExp(`property="${prop}"`, 'g')) || []).length, 1, prop);
      }
      assert.match(page.html, /name="twitter:card"/);
    }
  });

  test(`${page.rel}: brand positioning and no launch placeholders`, () => {
    assert.match(page.html, /<strong>OMUWENGA<\/strong><small>The Furniture Maker&rsquo;s Supply Partner<\/small>/);
    assert.match(page.html, /across East Africa/);
    assert.doesNotMatch(page.html, /must be replaced|Replace this|placeholder story|This website is informational/i);
  });

  test(`${page.rel}: title and description lengths suit search results`, () => {
    const decode = (s) => s.replace(/&[a-z#0-9]+;/gi, 'x');
    const title = decode(page.html.match(/<title>(.*?)<\/title>/)[1]);
    const desc = decode(page.html.match(/<meta name="description" content="([^"]*)">/)[1]);
    assert.ok(title.length <= 62, `title ${title.length}: ${title}`);
    assert.ok(desc.length <= 165, `description ${desc.length}`);
  });

  test(`${page.rel}: structured data is valid JSON`, () => {
    for (const [, body] of page.html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      assert.doesNotThrow(() => JSON.parse(body));
    }
  });

  test(`${page.rel}: navigation includes the blog`, () => {
    assert.match(page.html, /<nav class="main-nav"[^>]*>.*>Blog<\/a>.*<\/nav>/s);
  });

  test(`${page.rel}: internal links and assets exist`, () => {
    const refs = [...page.html.matchAll(/(?:href|src)="([^"#?]+)(?:[?#][^"]*)?"/g)].map((m) => m[1]);
    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|data:|\/\/)/.test(ref)) continue;
      const target = ref.startsWith('/') ? path.join(root, ref) : path.resolve(path.dirname(page.file), ref);
      const exists = existsSync(target) && (statSync(target).isFile() || existsSync(path.join(target, 'index.html')));
      assert.ok(exists, `${page.rel} → ${ref}`);
    }
  });
}

test('pages with live content load config before the module', () => {
  for (const rel of ['index.html', 'products/index.html', 'blog/index.html', 'blog/post/index.html']) {
    const html = readFileSync(path.join(root, rel), 'utf8');
    const cfg = html.indexOf('assets/js/config.js');
    const mod = html.indexOf('assets/js/live.mjs');
    assert.ok(cfg > -1 && mod > cfg, rel);
    assert.match(html, /type="module" src="[./]*assets\/js\/live\.mjs"/);
  }
});

const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((m) => JSON.parse(m[1]));

test('home page declares the organisation, slogan and service area', () => {
  const graph = jsonLd(read('index.html'))[0]['@graph'];
  const org = graph.find((n) => n['@type'] === 'Organization');
  assert.equal(org.slogan, "The Furniture Maker's Supply Partner");
  assert.deepEqual(org.areaServed.map((a) => a.name), ['Kenya']);
  assert.ok(graph.some((n) => n['@type'] === 'Store'));
});

test('inner pages carry breadcrumbs; guides carry Article data', () => {
  for (const page of pages) {
    if (['index.html', '404.html'].includes(page.rel) || isPostTemplate(page)) continue;
    const types = jsonLd(page.html).map((d) => d['@type']);
    assert.ok(types.includes('BreadcrumbList'), page.rel);
    if (/^guides[\\/].+[\\/]index\.html$/.test(page.rel)) assert.ok(types.includes('Article'), page.rel);
  }
});

test('FAQ structured data matches the visible questions', () => {
  const html = read('faq/index.html');
  const visible = [...html.matchAll(/<summary>(.*?)<\/summary>/g)].map((m) => m[1]);
  const faq = jsonLd(html).find((d) => d['@type'] === 'FAQPage');
  assert.deepEqual(faq.mainEntity.map((q) => q.name), visible);
});

test('contact form sends enquiries through WhatsApp', () => {
  const html = read('contact/index.html');
  assert.match(html, /<form class="contact-form"[^>]*data-whatsapp-form/);
  assert.match(html, /name="business"/);
  assert.match(html, /type="module" src="\.\.\/assets\/js\/live\.mjs"/);
});

test('404 page is branded and kept out of the index', () => {
  const html = read('404.html');
  assert.match(html, /content="noindex,follow"/);
  assert.match(html, /href="\/products\/#catalog"/);
});

test('sitemap lists the blog and keeps build markers', () => {
  const xml = readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
  assert.match(xml, /<loc>https:\/\/example.co.ke\/blog\/<\/loc>/);
  assert.match(xml, /<!-- blog:start -->[\s\S]*<!-- blog:end -->/);
});
