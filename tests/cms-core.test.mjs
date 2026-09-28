import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  apiUrl,
  blogPostingJsonLd,
  enquiryMessage,
  escapeHtml,
  formatPrice,
  postCardHtml,
  postHref,
  productCardHtml,
  productEnquiry,
  renderMarkdown,
  safeUrl,
  whatsappLink,
} from '../assets/js/cms-core.mjs';

test('enquiryMessage lists filled fields in order and skips blanks', () => {
  const msg = enquiryMessage({ message: '20 m webbing', name: ' Amina ', business: 'Reseller / distributor', location: '' });
  assert.equal(msg, 'Hello Omuwenga, I have an enquiry.\nName: Amina\nBusiness: Reseller / distributor\nMessage: 20 m webbing');
  assert.equal(enquiryMessage(undefined), 'Hello Omuwenga, I have an enquiry.');
});

test('escapeHtml neutralises markup', () => {
  assert.equal(escapeHtml('<b a="1">&\'</b>'), '&lt;b a=&quot;1&quot;&gt;&amp;&#39;&lt;/b&gt;');
  assert.equal(escapeHtml(null), '');
});

test('safeUrl allows web, mail, tel and relative links only', () => {
  assert.equal(safeUrl('https://x.co'), 'https://x.co');
  assert.equal(safeUrl('/products/'), '/products/');
  assert.equal(safeUrl('tel:+254718515142'), 'tel:+254718515142');
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,hi'), '');
});

test('renderMarkdown supports headings, lists, quotes and inline formatting', () => {
  const html = renderMarkdown([
    '# Big', '## Section', '### Sub', '',
    'Some **bold** and *italic* with [a link](https://example.com).', '',
    '- one', '- two', '', '1. first', '2. second', '', '> quoted',
  ].join('\n'));
  assert.match(html, /<h2>Big<\/h2>/);
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /<h3>Sub<\/h3>/);
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<em>italic<\/em>/);
  assert.match(html, /<a href="https:\/\/example.com" rel="noopener" target="_blank">a link<\/a>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
  assert.match(html, /<blockquote>quoted<\/blockquote>/);
});

test('renderMarkdown escapes raw HTML and drops unsafe links', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1)) ![y](javascript:1)');
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /href="javascript/);
  assert.doesNotMatch(html, /<img/);
});

test('renderMarkdown joins wrapped lines into one paragraph', () => {
  assert.equal(renderMarkdown('line one\nline two\n\nnext'), '<p>line one line two</p>\n<p>next</p>');
});

test('apiUrl builds public endpoints and skips empty params', () => {
  assert.equal(
    apiUrl('http://localhost:8000/', 'products/', { page: 2, search: '', category: 5 }),
    'http://localhost:8000/api/public/website/products/?page=2&category=5',
  );
  assert.equal(apiUrl('', '/blog/'), '/api/public/website/blog/');
});

test('formatPrice and WhatsApp links', () => {
  assert.equal(formatPrice('1250.00'), 'KSh 1,250');
  assert.equal(formatPrice(undefined), '');
  assert.equal(whatsappLink('Hi & bye'), 'https://wa.me/254718515142?text=Hi%20%26%20bye');
  assert.match(productEnquiry({ name: 'No. 5 zipper', sku: 'Z5' }), /No\. 5 zipper \(Z5\)/);
});

test('productCardHtml escapes data, shows stock, price and fallback image', () => {
  const html = productCardHtml({
    name: '<Stand>', sku: 'S1', category: { name: 'Stands' }, in_stock: false,
    image_url: null, description: 'Strong', price: '400.00',
  });
  assert.match(html, /&lt;Stand&gt;/);
  assert.doesNotMatch(html, /<Stand>/);
  assert.match(html, /Ask for restock/);
  assert.match(html, /KSh 400/);
  assert.match(html, /product-card-fallback/);
  assert.match(html, /wa\.me\/254718515142\?text=/);

  const withImage = productCardHtml({ name: 'Zip', in_stock: true, image_url: 'https://x/y.jpg', subcategory: { name: 'No. 5' } });
  assert.match(withImage, /<img src="https:\/\/x\/y.jpg" alt="Zip"/);
  assert.match(withImage, /Available/);
  assert.match(withImage, /No\. 5/);
  assert.doesNotMatch(withImage, /product-price/);
});

test('postHref prefers pre-rendered pages', () => {
  assert.equal(postHref('a-b', new Set(['a-b'])), 'a-b/');
  assert.equal(postHref('a-b', new Set()), 'post/?slug=a-b');
  assert.equal(postHref('a-b', new Set(), 'blog/'), 'blog/post/?slug=a-b');
});

test('postCardHtml renders title, tag, date and reading time', () => {
  const html = postCardHtml({
    title: 'Zippers', excerpt: 'Sizes', tags: ['zippers'], published_at: '2026-09-01T08:00:00Z', reading_minutes: 3,
  }, 'zippers/');
  assert.match(html, /href="zippers\/"/);
  assert.match(html, /post-card-tag">zippers/);
  assert.match(html, /3 min read/);
  assert.match(html, /<time datetime="2026-09-01T08:00:00Z">/);
});

test('blogPostingJsonLd is valid JSON and cannot close the script tag', () => {
  const json = blogPostingJsonLd(
    { title: '</script><b>', published_at: '2026-01-01', tags: ['a', 'b'], cover_image_url: 'https://x/c.jpg' },
    'https://example.co.ke/blog/x/',
    'https://example.co.ke',
  );
  assert.doesNotMatch(json, /<\/script>/);
  const data = JSON.parse(json);
  assert.equal(data['@type'], 'BlogPosting');
  assert.equal(data.headline, '</script><b>');
  assert.deepEqual(data.image, ['https://x/c.jpg']);
  assert.equal(data.keywords, 'a, b');
});
