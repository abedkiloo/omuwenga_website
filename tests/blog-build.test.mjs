import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  SAFE_SLUG,
  renderBlogList,
  renderPostPage,
  renderSitemapEntries,
  replaceBetween,
} from '../scripts/blog-build-lib.mjs';

const template = readFileSync(new URL('../blog/post/index.html', import.meta.url), 'utf8');
const SITE = 'https://example.co.ke';
const post = {
  slug: 'choose-sofa-stand',
  title: 'Choosing a sofa stand',
  meta_title: 'How to choose a sofa stand',
  meta_description: 'Height, load & finish — costs $& more',
  excerpt: 'Short',
  body: '## Height\nPick **carefully**.',
  tags: ['sofa stands'],
  published_at: '2026-09-01T08:00:00Z',
  updated_at: '2026-09-05T08:00:00Z',
  reading_minutes: 2,
  author_name: 'Omuwenga Suppliers',
  cover_image_url: 'https://pos.example.co.ke/media/blog/c.jpg',
};

test('replaceBetween swaps content and requires markers', () => {
  assert.equal(replaceBetween('a<!--s-->old<!--e-->b', '<!--s-->', '<!--e-->', 'new'), 'a<!--s-->new<!--e-->b');
  assert.throws(() => replaceBetween('nothing', '<!--s-->', '<!--e-->', 'x'));
});

test('renderPostPage fills SEO head, canonical and article body', () => {
  const html = renderPostPage(template, post, SITE);
  assert.match(html, /<title>How to choose a sofa stand \| Omuwenga<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/example.co.ke\/blog\/choose-sofa-stand\/">/);
  assert.match(html, /<meta name="description" content="Height, load &amp; finish — costs \$&amp; more">/);
  assert.match(html, /property="og:image" content="https:\/\/pos.example.co.ke\/media\/blog\/c.jpg"/);
  assert.match(html, /"@type":"BlogPosting"/);
  assert.match(html, /data-blog-post data-prerendered="true"/);
  assert.match(html, /<h2>Height<\/h2>/);
  assert.match(html, /<h1>Choosing a sofa stand<\/h1>/);
  assert.doesNotMatch(html, /Loading article/);
  assert.doesNotMatch(html, /<!--post-head-->/);
  assert.equal((html.match(/<title>/g) || []).length, 1);
});

test('renderBlogList links to pre-rendered folders', () => {
  assert.match(renderBlogList([post]), /href="choose-sofa-stand\/"/);
});

test('renderSitemapEntries lists posts with lastmod', () => {
  const xml = renderSitemapEntries([post], SITE);
  assert.match(xml, /<loc>https:\/\/example.co.ke\/blog\/choose-sofa-stand\/<\/loc><lastmod>2026-09-05<\/lastmod>/);
  assert.equal(renderSitemapEntries([], SITE).trim(), '');
});

test('SAFE_SLUG rejects path tricks', () => {
  assert.ok(SAFE_SLUG.test('webbing-101'));
  assert.ok(!SAFE_SLUG.test('../etc'));
  assert.ok(!SAFE_SLUG.test('a/b'));
  assert.ok(!SAFE_SLUG.test(''));
});
