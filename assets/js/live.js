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
} from './cms-core.js?v=10';

const config = window.OMUWENGA_CONFIG || { apiBase: '', siteUrl: '', websiteKey: '' };

function apiHeaders(extra) {
  const headers = { Accept: 'application/json', ...(extra || {}) };
  const key = String(config.websiteKey || '').trim();
  if (key) headers.Authorization = `Bearer ${key}`;
  return headers;
}

async function getJson(path, params) {
  const res = await fetch(apiUrl(config.apiBase, path, params), { headers: apiHeaders() });
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
        page_size: 100,
        category: state.category,
        search: state.search,
      });
      const items = data.results || [];
      const html = items.map(productCardHtml).join('');
      grid.innerHTML = append ? grid.innerHTML + html : html;
      setStatus(status, items.length || append ? '' : 'No products match.');
      more.hidden = !data.next;
      root.hidden = false;
    } catch {
      if (!append) {
        grid.innerHTML = '';
        setStatus(status, 'Products could not be loaded.');
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
  const status = section.querySelector('[data-home-products-status]');
  try {
    const data = await getJson('products/', { page_size: 12 });
    const items = data.results || [];
    if (!items.length) {
      setStatus(status, 'The shop list is empty right now. The picture catalogue above is still here, or send an enquiry.');
      return;
    }
    list.innerHTML = items.map(productCardHtml).join('');
    const pictured = items.filter((item) => item.image_url).length;
    setStatus(status, pictured
      ? `${items.length} items from the shop, ${pictured} with a photo.`
      : `${items.length} items from the shop. Photos appear here when a product has one.`);
    section.hidden = false;
  } catch {
    setStatus(status, 'The shop list is not available right now. Use the picture catalogue above, or send an enquiry.');
  }
}

/* ---------- Contact form → WhatsApp ---------- */

function fillEnquiryFromQuery(form) {
  const params = new URLSearchParams(window.location.search);
  const interest = (params.get('interest') || '').trim();
  const product = (params.get('product') || '').trim();
  if (product && form.elements.product_id) form.elements.product_id.value = product;
  if (!interest || !form.elements.interest) return;
  const field = form.elements.interest;
  if (field.tagName === 'SELECT') {
    const exists = [...field.options].some((option) => option.value === interest);
    if (!exists) {
      const option = document.createElement('option');
      option.value = interest;
      option.textContent = interest;
      field.append(option);
    }
  }
  field.value = interest;
}

function initEnquiryForm(form) {
  const result = form.parentElement.querySelector('[data-enquiry-result]');
  fillEnquiryFromQuery(form);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    const payload = {
      name: fields.name || '',
      phone: fields.phone || '',
      business: fields.business || '',
      location: fields.location || '',
      interest: fields.interest || '',
      message: fields.message || '',
      product_id: fields.product_id ? Number(fields.product_id) : null,
      company_website: fields.company_website || '',
    };
    try {
      const res = await fetch(apiUrl(config.apiBase, 'enquiries/'), {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.hidden = true;
      if (result) {
        result.hidden = false;
        result.innerHTML = `We have your enquiry and will review it. <a href="${escapeHtml(whatsappLink(enquiryMessage(fields)))}">Continue on WhatsApp</a> if you want a reply now.`;
      }
    } catch {
      if (button) button.disabled = false;
      if (result) {
        result.hidden = false;
        result.textContent = 'We could not save that just now. WhatsApp is open so the message is not lost.';
      }
      window.open(whatsappLink(enquiryMessage(fields)), '_blank', 'noopener');
    }
  });
}

function initProductZoom() {
  const dialog = document.createElement('dialog');
  dialog.className = 'zoom-view';
  dialog.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;max-width:100vw;max-height:100vh;margin:0;padding:0;border:0;background:#111;color:#fff;overflow:hidden';
  dialog.innerHTML = `<div class="zoom-bar" style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 12px;background:#1c2430"><p class="zoom-title" style="margin:0;font-weight:700"></p><div class="zoom-controls" style="display:flex;gap:8px"><button type="button" data-zoom-out aria-label="Zoom out">−</button><button type="button" data-zoom-in aria-label="Zoom in">+</button><button type="button" data-zoom-close aria-label="Close">Close</button></div></div><div class="zoom-stage" style="height:calc(100% - 56px);display:grid;place-items:center;overflow:hidden"><img alt="" style="max-width:100%;max-height:100%;object-fit:contain"></div>`;
  document.body.append(dialog);
  const title = dialog.querySelector('.zoom-title');
  const stage = dialog.querySelector('.zoom-stage');
  const img = stage.querySelector('img');
  const view = { scale: 1, x: 0, y: 0, drag: null, moved: false };

  function paint() {
    img.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
    stage.classList.toggle('is-zoomed', view.scale > 1);
  }

  function reset() {
    view.scale = 1;
    view.x = 0;
    view.y = 0;
    paint();
  }

  function clampScale(value) {
    return Math.min(4, Math.max(1, value));
  }

  dialog.querySelector('[data-zoom-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-zoom-in]').addEventListener('click', () => {
    view.scale = clampScale(view.scale + 0.5);
    paint();
  });
  dialog.querySelector('[data-zoom-out]').addEventListener('click', () => {
    view.scale = clampScale(view.scale - 0.5);
    if (view.scale === 1) reset();
    else paint();
  });
  dialog.addEventListener('close', reset);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  stage.addEventListener('click', (event) => {
    if (event.target.closest('button') || view.moved) {
      view.moved = false;
      return;
    }
    if (view.scale > 1) {
      reset();
      return;
    }
    const rect = stage.getBoundingClientRect();
    view.scale = 2.5;
    view.x = (rect.width / 2 - (event.clientX - rect.left)) * 0.6;
    view.y = (rect.height / 2 - (event.clientY - rect.top)) * 0.6;
    paint();
  });
  stage.addEventListener('wheel', (event) => {
    event.preventDefault();
    view.scale = clampScale(view.scale + (event.deltaY < 0 ? 0.25 : -0.25));
    if (view.scale === 1) reset();
    else paint();
  }, { passive: false });
  stage.addEventListener('pointerdown', (event) => {
    if (view.scale <= 1 || event.target.closest('button')) return;
    view.drag = { id: event.pointerId, x: event.clientX - view.x, y: event.clientY - view.y };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', (event) => {
    if (!view.drag || view.drag.id !== event.pointerId) return;
    const nextX = event.clientX - view.drag.x;
    const nextY = event.clientY - view.drag.y;
    if (Math.abs(nextX - view.x) + Math.abs(nextY - view.y) > 3) view.moved = true;
    view.x = nextX;
    view.y = nextY;
    paint();
  });
  stage.addEventListener('pointerup', () => {
    view.drag = null;
  });

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-zoom-src]');
    if (!opener) return;
    title.textContent = opener.dataset.zoomName || '';
    img.alt = opener.dataset.zoomName || '';
    img.src = opener.dataset.zoomSrc;
    reset();
    if (!dialog.open) dialog.showModal();
  });
}

initProductZoom();

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
