/**
 * Live content from the CompleteBytePOS backend: product catalog, blog list,
 * blog post and home-page teasers. Each block only activates when its
 * container exists on the page, and fails quietly back to the static content.
 */
import {
  apiUrl,
  articleHtml,
  blogPostingJsonLd,
  enquiryMessage,
  escapeHtml,
  postCardHtml,
  postHref,
  productCardHtml,
  whatsappLink,
} from './cms-core.mjs';

const config = window.OMUWENGA_CONFIG || { apiBase: '', siteUrl: '' };

async function getJson(path, params) {
  const res = await fetch(apiUrl(config.apiBase, path, params), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function loadPrerendered(root) {
  try {
    const res = await fetch(`${root}prerendered.json`, { cache: 'no-cache' });
    if (!res.ok) return new Set();
    const data = await res.json();
    return new Set(Array.isArray(data.slugs) ? data.slugs : []);
  } catch {
    return new Set();
  }
}

function setStatus(el, text) {
  if (!el) return;
  el.textContent = text;
  el.hidden = !text;
}

/* ---------- Product catalog (products page) ---------- */

function initCatalog(root) {
  const grid = root.querySelector('[data-catalog-grid]');
  const status = root.querySelector('[data-catalog-status]');
  const chips = root.querySelector('[data-catalog-categories]');
  const search = root.querySelector('[data-catalog-search]');
  const more = root.querySelector('[data-catalog-more]');
  const state = { category: '', search: '', page: 1, loading: false };
  let timer;

  async function load({ append = false } = {}) {
    if (state.loading) return;
    state.loading = true;
    if (!append) setStatus(status, 'Loading products…');
    try {
      const data = await getJson('products/', {
        page: state.page,
        page_size: 24,
        category: state.category,
        search: state.search,
      });
      const items = data.results || [];
      const html = items.map(productCardHtml).join('');
      grid.innerHTML = append ? grid.innerHTML + html : html;
      setStatus(status, items.length || append ? '' : 'No products match your search yet — ask us on WhatsApp, we may still have it.');
      more.hidden = !data.next;
      root.hidden = false;
    } catch {
      if (!append) {
        grid.innerHTML = '';
        setStatus(status, 'Live stock is not available right now. Browse the categories below or ask us on WhatsApp.');
      }
      more.hidden = true;
    } finally {
      state.loading = false;
    }
  }

  function renderChips(categories) {
    const all = [{ id: '', name: 'All products' }, ...categories];
    chips.innerHTML = all
      .map((c) => `<button type="button" class="chip${String(c.id) === state.category ? ' active' : ''}" data-id="${escapeHtml(c.id)}">${escapeHtml(c.name)}${c.product_count ? ` <span>${c.product_count}</span>` : ''}</button>`)
      .join('');
  }

  chips.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (!btn) return;
    state.category = btn.dataset.id;
    state.page = 1;
    chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === btn));
    load();
  });

  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = search.value.trim();
      state.page = 1;
      load();
    }, 300);
  });

  more.addEventListener('click', () => {
    state.page += 1;
    load({ append: true });
  });

  getJson('categories/').then(renderChips).catch(() => renderChips([]));
  load();
}

/* ---------- Blog list ---------- */

async function initBlogList(list) {
  const status = document.querySelector('[data-blog-status]');
  const prerendered = await loadPrerendered('./');
  try {
    const data = await getJson('blog/', { page_size: 50 });
    const posts = data.results || [];
    if (!posts.length) {
      if (!list.children.length) setStatus(status, 'New articles are on the way. Meanwhile, read our workshop guides.');
      return;
    }
    list.innerHTML = posts.map((p) => postCardHtml(p, postHref(p.slug, prerendered))).join('');
    setStatus(status, '');
  } catch {
    if (!list.children.length) setStatus(status, 'Articles could not be loaded right now. Please try again shortly.');
  }
}

/* ---------- Single blog post (client-rendered fallback page) ---------- */

function setMeta(selector, attr, value) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta');
    const m = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

async function initBlogPost(container) {
  if (container.dataset.prerendered === 'true') return;
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) {
    window.location.replace('../');
    return;
  }
  try {
    const post = await getJson(`blog/${encodeURIComponent(slug)}/`);
    const prerendered = await loadPrerendered('../');
    const site = (config.siteUrl || window.location.origin).replace(/\/+$/, '');
    const pageUrl = prerendered.has(slug)
      ? `${site}/blog/${encodeURIComponent(slug)}/`
      : `${site}/blog/post/?slug=${encodeURIComponent(slug)}`;
    document.title = `${post.meta_title} | Omuwenga`;
    setMeta('meta[name="description"]', 'content', post.meta_description);
    setMeta('link[rel="canonical"]', 'href', pageUrl);
    setMeta('meta[property="og:title"]', 'content', post.meta_title);
    setMeta('meta[property="og:description"]', 'content', post.meta_description);
    setMeta('meta[property="og:url"]', 'content', pageUrl);
    setMeta('meta[property="og:type"]', 'content', 'article');
    if (post.cover_image_url) setMeta('meta[property="og:image"]', 'content', post.cover_image_url);
    const ld = document.createElement('script');
    ld.type = 'application/ld+json';
    ld.textContent = blogPostingJsonLd(post, pageUrl, site);
    document.head.appendChild(ld);
    container.innerHTML = articleHtml(post);
  } catch {
    container.innerHTML = '<div class="container narrow article-missing"><h1>Article not found</h1><p>It may have been moved or unpublished.</p><a class="button" href="../">See all articles</a></div>';
  }
}

/* ---------- Home page teasers ---------- */

async function initHomePosts(section) {
  const list = section.querySelector('[data-home-posts-list]');
  const prerendered = await loadPrerendered('blog/');
  try {
    const data = await getJson('blog/', { page_size: 3 });
    const posts = data.results || [];
    if (!posts.length) return;
    list.innerHTML = posts.map((p) => postCardHtml(p, postHref(p.slug, prerendered, 'blog/'))).join('');
    section.hidden = false;
  } catch {
    /* keep hidden */
  }
}

async function initHomeProducts(section) {
  const list = section.querySelector('[data-home-products-list]');
  try {
    const data = await getJson('products/', { page_size: 4, has_image: 1 });
    const items = data.results || [];
    if (!items.length) return;
    list.innerHTML = items.map(productCardHtml).join('');
    section.hidden = false;
  } catch {
    /* keep hidden */
  }
}

/* ---------- Contact form → WhatsApp ---------- */

function initEnquiryForm(form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form).entries());
    window.open(whatsappLink(enquiryMessage(fields)), '_blank', 'noopener');
  });
}

const catalog = document.querySelector('[data-catalog]');
if (catalog) initCatalog(catalog);
const blogList = document.querySelector('[data-blog-list]');
if (blogList) initBlogList(blogList);
const blogPost = document.querySelector('[data-blog-post]');
if (blogPost) initBlogPost(blogPost);
const homePosts = document.querySelector('[data-home-posts]');
if (homePosts) initHomePosts(homePosts);
const homeProducts = document.querySelector('[data-home-products]');
if (homeProducts) initHomeProducts(homeProducts);
const enquiryForm = document.querySelector('[data-whatsapp-form]');
if (enquiryForm) initEnquiryForm(enquiryForm);
