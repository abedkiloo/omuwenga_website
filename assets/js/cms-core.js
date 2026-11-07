/**
 * Pure helpers shared by the browser pages and scripts/build-blog.mjs.
 * No DOM access here so everything can be tested with `node --test`.
 */

export const BUSINESS = {
  name: 'Omuwenga',
  legalName: 'Omuwenga Suppliers',
  tagline: "The Furniture Maker's Supply Partner",
  whatsapp: '254718515142',
  phones: ['+254718515142', '+254180154352'],
  email: 'omegaomegageneralsuppliers@gmail.com',
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

export function productCardHtml(product) {
  const name = escapeHtml(product.name);
  const category = product.subcategory?.name || product.category?.name || '';
  const description = product.description ? escapeHtml(product.description).slice(0, 140) : '';
  const imageUrl = escapeHtml(product.image_url || '');
  const image = imageUrl
    ? `<button type="button" class="product-open" data-zoom-src="${imageUrl}" data-zoom-name="${name}" aria-label="Enlarge ${name}"><img src="${imageUrl}" alt="${name}" loading="lazy" width="400" height="300"></button>`
    : `<span class="product-card-fallback" aria-hidden="true">${escapeHtml(initials(product.name))}</span>`;
  const price = formatPrice(product.price);
  const stock = product.in_stock
    ? '<span class="stock-badge in">Available</span>'
    : '<span class="stock-badge out">Ask for restock</span>';
  return `<article class="product-card">
  <div class="product-card-media">${image}</div>
  <div class="product-card-body">
    ${category ? `<span class="product-card-category">${escapeHtml(category)}</span>` : ''}
    <h3>${imageUrl ? `<button type="button" class="product-open" data-zoom-src="${imageUrl}" data-zoom-name="${name}">${name}</button>` : name}</h3>
    ${description ? `<p>${description}</p>` : ''}
    <div class="product-card-meta">${stock}${price ? `<strong class="product-price">${price}</strong>` : ''}</div>
    <div class="product-card-actions">
      <a class="order-wa" href="${escapeHtml(whatsappLink(productEnquiry(product)))}"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.44 1.34 4.94L2 22l5.39-1.41a10.1 10.1 0 0 0 4.65 1.13h.01c5.46 0 9.89-4.4 9.89-9.83C21.94 6.4 17.5 2 12.04 2zm5.76 13.9c-.24.68-1.2 1.24-1.96 1.4-.52.11-1.2.2-3.48-.75-2.92-1.21-4.8-4.18-4.95-4.37-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.26-.29.58-.36.77-.36h.55c.18 0 .42-.07.66.5.24.58.83 2 .9 2.15.07.14.12.32.02.51-.1.2-.14.32-.28.49-.14.17-.3.38-.42.51-.14.14-.28.29-.12.56.16.27.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.17-.2.7-.81.88-1.09.19-.28.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.46.21.53.32.07.12.07.68-.17 1.36z"/></svg>Order on WhatsApp</a>
      <a class="order-enquiry" href="${escapeHtml(enquiryPageHref(product))}">Enquiry</a>
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
