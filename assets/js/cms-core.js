/**
 * Pure helpers shared by the browser pages and scripts/build-blog.mjs.
 * No DOM access here so everything can be tested with `node --test`.
 */

export const BUSINESS = {
  name: 'Omuwenga',
  legalName: 'Omuwenga Suppliers',
  tagline: "The Furniture Maker's Supply Partner",
  whatsapp: '254718515142',
  phones: ['+254718515142'],
  email: 'info@omuwenga.com',
};

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

/** Only allow link/image targets that cannot run script. Input is already HTML-escaped. */
export function safeUrl(url) {
  const trimmed = String(url ?? '').trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#|\.\.?\/)/i.test(trimmed)) return trimmed;
  return '';
}

function inline(text) {
  return text
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, url) => {
      const href = safeUrl(url);
      return href ? `<img src="${href}" alt="${alt}" loading="lazy">` : alt;
    })
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, url) => {
      const href = safeUrl(url);
      if (!href) return label;
      const external = /^https?:\/\//i.test(href);
      return `<a href="${href}"${external ? ' rel="noopener" target="_blank"' : ''}>${label}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

/**
 * Small, safe Markdown subset: headings, paragraphs, lists, quotes, bold,
 * italic, links and images. All raw HTML is escaped first.
 */
export function renderMarkdown(source) {
  const lines = escapeHtml(source).replace(/\r\n?/g, '\n').split('\n');
  const out = [];
  let paragraph = [];
  let list = null;

  const flushParagraph = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    let m;
    if (!line) {
      flushParagraph();
      flushList();
    } else if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flushParagraph();
      flushList();
      const level = m[1].length === 3 ? 3 : 2;
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
    } else if ((m = line.match(/^[-*]\s+(.*)$/)) || (m = line.match(/^\d+[.)]\s+(.*)$/))) {
      flushParagraph();
      const tag = /^\d/.test(line) ? 'ol' : 'ul';
      if (!list || list.tag !== tag) {
        flushList();
        list = { tag, items: [] };
      }
      list.items.push(m[1]);
    } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
      flushParagraph();
      flushList();
      out.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();
  return out.join('\n');
}

export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Nairobi' });
}

export function formatPrice(value) {
  const n = Number(value);
  if (value === undefined || value === null || value === '' || Number.isNaN(n)) return '';
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export function apiUrl(base, path, params = {}) {
  const root = String(base || '').replace(/\/+$/, '');
  const query = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  ).toString();
  return `${root}/api/public/website/${path.replace(/^\/+/, '')}${query ? `?${query}` : ''}`;
}

export function whatsappLink(message, number = BUSINESS.whatsapp) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/**
 * Build the prefilled WhatsApp quote for one product.
 *
 * Args:
 *   product (object): Catalog row. Uses `name` (string). Blank or missing
 *     names become "this item". Whitespace is collapsed and the name is
 *     capped at 120 characters.
 *
 * Returns:
 *   string: One sentence naming the product and leaving `[ ]` for the
 *     quantity. A normal name keeps the whole message under 200 characters.
 *
 * Raises:
 *   Nothing. A missing product is treated as an unnamed item.
 */
export function productEnquiry(product) {
  const raw = String(product?.name || '').replace(/\s+/g, ' ').trim();
  const name = raw.slice(0, 120) || 'this item';
  return `Hi Omuwenga, I am looking at the ${name} on your website and would like a quote for [ ] pieces.`;
}

export function enquiryPageHref(product) {
  const params = new URLSearchParams();
  if (product?.name) params.set('interest', product.name);
  if (product?.id) params.set('product', String(product.id));
  const query = params.toString();
  return query ? `/contact/?${query}` : '/contact/';
}

const ENQUIRY_FIELDS = [
  ['name', 'Name'],
  ['phone', 'Phone'],
  ['business', 'Business'],
  ['location', 'Location'],
  ['interest', 'Interested in'],
  ['message', 'Message'],
];

/** Turn contact-form fields into a WhatsApp-ready message, skipping blanks. */
export function enquiryMessage(fields) {
  const lines = ENQUIRY_FIELDS.map(([key, label]) => {
    const value = String(fields?.[key] ?? '').trim();
    return value ? `${label}: ${value}` : '';
  }).filter(Boolean);
  return ['Hello Omuwenga, I have an enquiry.', ...lines].join('\n');
}

function initials(name) {
  return String(name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** Featured photo first, then the other views. At most four safe image URLs. */
export function productImageUrls(product) {
  const rows = Array.isArray(product?.images) ? product.images.slice(0, 8) : [];
  const urls = [];
  const push = (value) => {
    const safe = safeUrl(value);
    if (!safe || urls.includes(safe) || urls.length >= 4) return;
    urls.push(safe);
  };
  const featured = rows.find((row) => row && row.is_featured);
  push(featured?.url || product?.image_url);
  rows
    .slice()
    .sort((a, b) => Number(a?.slot || 99) - Number(b?.slot || 99))
    .forEach((row) => push(row?.url));
  push(product?.image_url);
  return urls;
}

/** Home featured grid: top products only; full range lives in the catalogue. */
export const HOME_FEATURED_PAGE_SIZE = 6;

/** Milliseconds between automatic product-card photo advances (2500–8000). */
export const PRODUCT_SLIDER_AUTO_MS = 4000;

/**
 * Next scrollLeft for a multi-photo product card track.
 *
 * @param {number} scrollLeft Current track.scrollLeft (px); negatives treated as 0.
 * @param {number} width Visible slide width in px; coerced to >= 1.
 * @param {number} slideCount Number of slides; coerced to >= 1. Max meaningful 8.
 * @returns {number} Pixel offset for the next slide, wrapping to 0 after the last.
 */
export function nextProductSliderScrollLeft(scrollLeft, width, slideCount) {
  const w = Math.max(1, Number(width) || 1);
  const count = Math.min(8, Math.max(1, Math.floor(Number(slideCount) || 1)));
  const current = Math.round(Math.max(0, Number(scrollLeft) || 0) / w) % count;
  return ((current + 1) % count) * w;
}

/** Products fetched for the home announce-bar rotator (1–48). */
export const ANNOUNCE_PRODUCT_PAGE_SIZE = 24;

/** Milliseconds between announce-bar product swaps (2000–12000). */
export const ANNOUNCE_ROTATE_MS = 4500;

/**
 * Fisher–Yates shuffle of a product list for random announce rotation.
 *
 * @param {Array<object|null|undefined>} items Product rows from the API.
 * @returns {Array<object>} Shuffled copy; empty when items is empty or not an array. Max 200 items processed.
 */
export function shuffleProducts(items) {
  const list = (Array.isArray(items) ? items : []).filter(Boolean).slice(0, 200);
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

/**
 * Next index for the announce rotator, wrapping at the end.
 *
 * @param {number} current Zero-based index; negatives treated as 0.
 * @param {number} length List length; must be >= 0. Returns 0 when length is 0.
 * @returns {number} Next index in [0, length).
 */
export function nextAnnounceIndex(current, length) {
  const len = Math.max(0, Number(length) || 0);
  if (len === 0) return 0;
  const cur = Math.max(0, Number(current) || 0);
  return (cur + 1) % len;
}

/**
 * One announce-bar line: product name, optional category, link into the shop.
 *
 * @param {object|null|undefined} product Shop product row.
 * @returns {string} Safe HTML fragment, or empty string when name is missing.
 */
export function announceProductLineHtml(product) {
  const name = String(product?.name || '').trim();
  if (!name) return '';
  const category = String(product?.subcategory?.name || product?.category?.name || '').trim();
  const label = category ? `${escapeHtml(name)} · ${escapeHtml(category)}` : escapeHtml(name);
  return `In stock · <a href="products/">${label}</a> · <a href="products/">See all fittings</a>`;
}

/**
 * Compact featured card for the home landing grid.
 *
 * @param {object} product
 * @returns {string}
 */
export function featuredProductCardHtml(product) {
  const name = escapeHtml(product.name);
  const notes = escapeHtml(product.subcategory?.name || product.category?.name || '');
  const gallery = productImageUrls(product);
  const imageUrl = escapeHtml(gallery[0] || '');
  const image = imageUrl
    ? `<img src="${imageUrl}" alt="${name}" loading="lazy" width="400" height="400">`
    : `<span class="luxe-product-fallback" aria-hidden="true">${escapeHtml(initials(product.name))}</span>`;
  const price = formatPrice(product.price);
  const enquire = escapeHtml(whatsappLink(productEnquiry(product)));
  return `<article class="luxe-product-card">
  <div class="luxe-product-media">${image}</div>
  <div class="luxe-product-body">
    <h3>${name}</h3>
    ${notes ? `<p class="luxe-product-notes">${notes}</p>` : ''}
    <div class="luxe-product-meta">
      ${price ? `<strong class="luxe-product-price">${price}</strong>` : '<span></span>'}
      <a class="luxe-add" href="${enquire}" aria-label="Ask about ${name} on WhatsApp">+</a>
    </div>
  </div>
</article>`;
}

/**
 * Home no longer infinite-scrolls; kept for callers that still check paging.
 *
 * @param {{ next?: string | null } | null | undefined} page
 * @returns {boolean} Always false — home shows at most HOME_FEATURED_PAGE_SIZE items.
 */
export function homeFeaturedHasMore(page) {
  void page;
  return false;
}

export function productCardHtml(product) {
  const name = escapeHtml(product.name);
  const category = product.subcategory?.name || product.category?.name || '';
  const description = product.description ? escapeHtml(product.description).slice(0, 140) : '';
  const gallery = productImageUrls(product);
  const imageUrl = escapeHtml(gallery[0] || '');
  const slides = gallery.map((url, index) => {
    const src = escapeHtml(url);
    const label = index === 0 ? `Enlarge ${name}` : `View ${index + 1} of ${name}`;
    return `<button type="button" class="product-open" data-zoom-src="${src}" data-zoom-name="${name}" aria-label="${label}"><img src="${src}" alt="${index === 0 ? name : ''}" loading="lazy" width="400" height="300"></button>`;
  }).join('');
  const controls = gallery.length > 1
    ? `<button type="button" class="product-slider-nav prev" data-slider-step="-1" aria-label="Previous photo">‹</button><button type="button" class="product-slider-nav next" data-slider-step="1" aria-label="Next photo">›</button>`
    : '';
  const image = gallery.length
    ? `<div class="product-slider">${controls}<div class="product-slider-track">${slides}</div></div>`
    : `<span class="product-card-fallback" aria-hidden="true">${escapeHtml(initials(product.name))}</span>`;
  const price = formatPrice(product.price);
  const stock = product.in_stock
    ? '<span class="stock-badge in">Available</span>'
    : '<span class="stock-badge out">Ask for restock</span>';
  return `<article class="product-card">
  <div class="product-card-media">${image}</div>
  <div class="product-card-body">
    ${category ? `<span class="product-card-category">${escapeHtml(category)}</span>` : ''}
    <h3>${imageUrl ? `<button type="button" class="product-open" data-zoom-src="${imageUrl}" data-zoom-name="${name}" style="border:0;background:transparent;padding:0;font:inherit;color:inherit">${name}</button>` : name}</h3>
    ${description ? `<p>${description}</p>` : ''}
    <div class="product-card-meta"><span class="stock-row">${stock}<a class="button button-small button-outline order-enquiry" style="display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;background:#fff;border:2px solid #075b9d;color:#075b9d;font-size:.72rem;font-weight:800;text-decoration:none" href="${escapeHtml(enquiryPageHref(product))}">Enquiry</a></span>${price ? `<strong class="product-price">${price}</strong>` : ''}</div>
    <div class="product-card-actions">
      <a class="ask-link" href="${escapeHtml(whatsappLink(productEnquiry(product)))}">Ask about this</a>
    </div>
  </div>
</article>`;
}

export function postHref(slug, prerendered = new Set(), prefix = '') {
  const safe = encodeURIComponent(slug);
  return prerendered.has(slug) ? `${prefix}${safe}/` : `${prefix}post/?slug=${safe}`;
}

export function postCardHtml(post, href) {
  const title = escapeHtml(post.title);
  const cover = post.cover_image_url
    ? `<img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.cover_image_alt || post.title)}" loading="lazy" width="600" height="340">`
    : '<span class="post-card-fallback" aria-hidden="true">Omuwenga</span>';
  const tag = post.tags?.[0] ? `<span class="post-card-tag">${escapeHtml(post.tags[0])}</span>` : '';
  const date = formatDate(post.published_at);
  return `<article class="post-card">
  <a class="post-card-media" href="${escapeHtml(href)}" tabindex="-1" aria-hidden="true">${cover}</a>
  <div class="post-card-body">
    ${tag}
    <h3><a href="${escapeHtml(href)}">${title}</a></h3>
    <p>${escapeHtml(post.excerpt || '')}</p>
    <small>${date ? `<time datetime="${escapeHtml(post.published_at)}">${date}</time> · ` : ''}${Number(post.reading_minutes) || 1} min read</small>
  </div>
</article>`;
}

export function blogPostingJsonLd(post, pageUrl, siteUrl) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || '',
    datePublished: post.published_at,
    dateModified: post.updated_at || post.published_at,
    mainEntityOfPage: pageUrl,
    author: { '@type': 'Organization', name: post.author_name || BUSINESS.name },
    publisher: {
      '@type': 'Organization',
      name: BUSINESS.name,
      logo: { '@type': 'ImageObject', url: `${siteUrl.replace(/\/+$/, '')}/assets/images/omuwenga-logo.jpg` },
    },
    keywords: (post.tags || []).join(', '),
  };
  if (post.cover_image_url) data.image = [post.cover_image_url];
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function articleHtml(post) {
  const date = formatDate(post.published_at);
  const cover = post.cover_image_url
    ? `<figure class="article-cover"><img src="${escapeHtml(post.cover_image_url)}" alt="${escapeHtml(post.cover_image_alt || post.title)}" width="1200" height="630"></figure>`
    : '';
  const tags = (post.tags || []).map((t) => `<span>${escapeHtml(t)}</span>`).join('');
  return `<header class="article-header"><div class="container narrow">
  <a class="text-link" href="../">← All articles</a>
  <h1>${escapeHtml(post.title)}</h1>
  <p class="article-meta">${date ? `<time datetime="${escapeHtml(post.published_at)}">${date}</time> · ` : ''}${Number(post.reading_minutes) || 1} min read · ${escapeHtml(post.author_name || BUSINESS.name)}</p>
  ${tags ? `<div class="tag-list">${tags}</div>` : ''}
</div></header>
<div class="container narrow">${cover}<div class="article-body blog-body">${renderMarkdown(post.body)}</div>
<aside class="article-cta"><h2>Need any of these supplies?</h2><p>Send the item, size and quantity — or a clear photo — and we will confirm what is in the shop.</p><a class="button button-whatsapp" href="${escapeHtml(whatsappLink(`Hello Omuwenga Suppliers, I read "${post.title}" and would like to ask about supplies.`))}">Ask on WhatsApp</a></aside></div>`;
}
