/**
 * Live content from the CompleteBytePOS backend: product catalog, blog list,
 * blog post and home-page teasers. Each block only activates when its
 * container exists on the page, and fails quietly back to the static content.
 */
import {
  announceProductLineHtml,
  ANNOUNCE_PRODUCT_PAGE_SIZE,
  ANNOUNCE_ROTATE_MS,
  apiUrl,
  articleHtml,
  blogPostingJsonLd,
  buildEnquiryPayload,
  enquiryFollowUpError,
  enquiryMessage,
  escapeHtml,
  featuredProductCardHtml,
  HOME_FEATURED_PAGE_SIZE,
  nextAnnounceIndex,
  nextProductSliderScrollLeft,
  postCardHtml,
  postHref,
  PRODUCT_SLIDER_AUTO_MS,
  productCardHtml,
  shuffleProducts,
  whatsappLink,
  zoomDialogEnquiryLinks,
} from './cms-core.js?v=18';

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
  const match = (root.dataset.catalogMatch || '')
    .split(',')
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);
  const state = { category: '', search: '', page: 1, loading: false };
  let timer;

  function matches(item) {
    if (!match.length) return true;
    const hay = `${item.name || ''} ${item.category?.name || ''} ${item.subcategory?.name || ''}`.toLowerCase();
    return match.some((word) => hay.includes(word));
  }

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
      const items = (data.results || []).filter(matches);
      const html = items.map(productCardHtml).join('');
      grid.innerHTML = append ? grid.innerHTML + html : html;
      bindProductImageSliders(grid);
      setStatus(status, items.length || append ? '' : 'No products match.');
      if (more) more.hidden = match.length ? true : !data.next;
      root.hidden = false;
    } catch {
      if (!append) {
        grid.innerHTML = '';
        setStatus(status, 'Products could not be loaded.');
      }
      if (more) more.hidden = true;
    } finally {
      state.loading = false;
    }
  }

  function renderChips(categories) {
    if (!chips) return;
    const all = [{ id: '', name: 'All products' }, ...categories];
    chips.innerHTML = all
      .map((c) => `<button type="button" class="chip${String(c.id) === state.category ? ' active' : ''}" data-id="${escapeHtml(c.id)}">${escapeHtml(c.name)}${c.product_count ? ` <span>${c.product_count}</span>` : ''}</button>`)
      .join('');
  }

  if (chips) {
    chips.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;
      state.category = btn.dataset.id;
      state.page = 1;
      chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('active', c === btn));
      load();
    });
    getJson('categories/').then(renderChips).catch(() => renderChips([]));
  }

  if (search) {
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial && initial.trim()) {
      search.value = initial.trim();
      state.search = initial.trim();
    }
    search.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.search = search.value.trim();
        state.page = 1;
        load();
      }, 300);
    });
  }

  if (more) {
    more.addEventListener('click', () => {
      state.page += 1;
      load({ append: true });
    });
  }

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

/**
 * Rotate random shop products in the home announce bar.
 *
 * @param {HTMLElement} root Element with [data-announce-products].
 * @returns {Promise<void>} Resolves after the first paint or silent fallback.
 */
async function initAnnounceProducts(root) {
  const live = root.querySelector('[data-announce-live]');
  const fallback = root.querySelector('[data-announce-static]');
  if (!live) return;

  try {
    const data = await getJson('products/', {
      page: 1,
      page_size: ANNOUNCE_PRODUCT_PAGE_SIZE,
    });
    const products = shuffleProducts(data.results || []).filter((item) => String(item?.name || '').trim());
    if (!products.length) return;

    let index = 0;
    const paint = () => {
      const html = announceProductLineHtml(products[index]);
      if (!html) return;
      live.classList.remove('is-on');
      window.setTimeout(() => {
        live.innerHTML = html;
        live.hidden = false;
        if (fallback) fallback.hidden = true;
        live.classList.add('is-on');
      }, 220);
    };

    paint();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || products.length < 2) return;

    window.setInterval(() => {
      index = nextAnnounceIndex(index, products.length);
      paint();
    }, ANNOUNCE_ROTATE_MS);
  } catch {
    /* keep static wholesale / delivery line */
  }
}

async function initHomeProducts(section) {
  const list = section.querySelector('[data-home-products-list]');
  const status = section.querySelector('[data-home-products-status]');
  setStatus(status, 'Loading fittings…');
  try {
    const data = await getJson('products/', {
      page: 1,
      page_size: HOME_FEATURED_PAGE_SIZE,
    });
    const items = (data.results || []).slice(0, HOME_FEATURED_PAGE_SIZE);
    if (!items.length) {
      setStatus(status, 'The shop list is empty right now. Browse the catalogue, or send an enquiry.');
      section.hidden = false;
      return;
    }
    list.innerHTML = items.map(featuredProductCardHtml).join('');
    setStatus(status, '');
    section.hidden = false;
  } catch {
    setStatus(status, 'The shop list is not available right now. Use the catalogue, or send an enquiry.');
    section.hidden = false;
  }
}

/* ---------- Contact form + product Enquiry dialog ---------- */

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

async function submitEnquiryFields(fields, { onSuccess, onError } = {}) {
  const error = enquiryFollowUpError(fields);
  if (error) {
    if (onError) onError(error);
    return false;
  }
  const payload = buildEnquiryPayload(fields);
  try {
    const res = await fetch(apiUrl(config.apiBase, 'enquiries/'), {
      method: 'POST',
      headers: apiHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    if (onSuccess) onSuccess(payload);
    return true;
  } catch {
    if (onError) onError('We could not save that just now. WhatsApp is open so the message is not lost.');
    window.open(whatsappLink(enquiryMessage(payload)), '_blank', 'noopener');
    return false;
  }
}

function initEnquiryForm(form) {
  const result = form.parentElement.querySelector('[data-enquiry-result]');
  fillEnquiryFromQuery(form);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    const ok = await submitEnquiryFields(fields, {
      onSuccess: () => {
        form.hidden = true;
        if (result) {
          result.hidden = false;
          result.innerHTML = `We have your enquiry and will call you back. <a href="${escapeHtml(whatsappLink(enquiryMessage(fields)))}">Continue on WhatsApp</a> if you want a reply now.`;
        }
      },
      onError: (message) => {
        if (button) button.disabled = false;
        if (result) {
          result.hidden = false;
          result.textContent = message;
        }
      },
    });
    if (!ok && button) button.disabled = false;
  });
}

/**
 * Product Enquiry dialog: phone, amount, and items → shop inbox for follow-up.
 *
 * Returns the open function used by card and zoom Enquiry buttons.
 */
function initEnquiryDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'enquiry-dialog';
  dialog.innerHTML = `<form method="dialog" class="enquiry-dialog-form" data-enquiry-dialog-form>
    <div class="enquiry-dialog-head">
      <h2>Send an enquiry</h2>
      <button type="button" data-enquiry-close aria-label="Close">Close</button>
    </div>
    <p class="enquiry-dialog-lead">Leave your number, the amount, and the items. The shop will follow up.</p>
    <label>Your phone<input type="tel" name="phone" autocomplete="tel" required placeholder="07xx xxx xxx"></label>
    <label>Amount / quantity<input type="text" name="quantity" required maxlength="80" placeholder="e.g. 20 metres, 4 pieces"></label>
    <label>Items you want<textarea name="interest" rows="3" required maxlength="200" placeholder="Product names and sizes"></textarea></label>
    <label>Extra details (optional)<textarea name="message" rows="3" maxlength="500" placeholder="Colour, delivery town, timing"></textarea></label>
    <label>Your name (optional)<input type="text" name="name" autocomplete="name" maxlength="120"></label>
    <input type="hidden" name="product_id" value="">
    <label class="hp">Leave this empty<input type="text" name="company_website" tabindex="-1" autocomplete="off"></label>
    <p class="enquiry-dialog-error" data-enquiry-dialog-error hidden></p>
    <div class="enquiry-dialog-actions">
      <button type="submit" class="button">Send enquiry</button>
      <button type="button" class="button button-outline" data-enquiry-close>Cancel</button>
    </div>
  </form>`;
  document.body.append(dialog);
  const form = dialog.querySelector('[data-enquiry-dialog-form]');
  const errorEl = dialog.querySelector('[data-enquiry-dialog-error]');
  dialog.querySelectorAll('[data-enquiry-close]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    errorEl.hidden = true;
    const ok = await submitEnquiryFields(fields, {
      onSuccess: () => {
        dialog.close();
        form.reset();
        window.alert('Enquiry sent. The shop will call you on the number you left.');
      },
      onError: (message) => {
        errorEl.hidden = false;
        errorEl.textContent = message;
      },
    });
    if (button) button.disabled = false;
    if (!ok) return;
  });

  function openEnquiry(seed = {}) {
    form.reset();
    errorEl.hidden = true;
    if (form.elements.interest) form.elements.interest.value = seed.interest || '';
    if (form.elements.message) form.elements.message.value = seed.message || '';
    if (form.elements.product_id) form.elements.product_id.value = seed.productId || '';
    if (form.elements.quantity) form.elements.quantity.value = seed.quantity || '';
    if (!dialog.open) dialog.showModal();
    form.elements.phone?.focus();
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.order-enquiry, [data-zoom-enquiry]');
    if (!trigger) return;
    event.preventDefault();
    event.stopPropagation();
    const card = trigger.closest('.product-card');
    const interest = trigger.dataset.enquiryName
      || card?.querySelector('[data-zoom-name]')?.dataset.zoomName
      || trigger.getAttribute('aria-label')?.replace(/^Enquiry ·\s*/i, '')
      || '';
    openEnquiry({
      interest: interest.trim(),
      productId: trigger.dataset.enquiryProduct || '',
      message: interest.trim() ? `Enquiry for ${interest.trim()}` : '',
    });
  });

  return openEnquiry;
}

/**
 * Auto-advance multi-photo product card sliders while they are on screen.
 * Pauses on hover, focus, reduced motion, and when off-screen.
 *
 * @param {ParentNode} [root=document]
 * @returns {number} Count of newly bound sliders (0–200).
 */
function bindProductImageSliders(root = document) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sliders = [...(root.querySelectorAll?.('.product-slider') || [])].slice(0, 200);
  let bound = 0;

  sliders.forEach((slider, index) => {
    if (slider.dataset.autoBound === '1') return;
    const track = slider.querySelector('.product-slider-track');
    const slides = track ? [...track.querySelectorAll('.product-open')] : [];
    if (!track || slides.length < 2) return;

    slider.dataset.autoBound = '1';
    bound += 1;

    let timer = 0;
    let paused = reduceMotion;
    let inView = true;

    const stop = () => window.clearInterval(timer);

    const tick = () => {
      const width = track.clientWidth || 1;
      const next = nextProductSliderScrollLeft(track.scrollLeft, width, slides.length);
      track.scrollTo({ left: next, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    const start = () => {
      stop();
      if (paused || !inView || slides.length < 2) return;
      timer = window.setInterval(tick, PRODUCT_SLIDER_AUTO_MS);
    };

    const pause = () => {
      paused = true;
      stop();
    };

    const resume = () => {
      if (reduceMotion) return;
      paused = false;
      start();
    };

    slider.addEventListener('mouseenter', pause);
    slider.addEventListener('mouseleave', resume);
    slider.addEventListener('focusin', pause);
    slider.addEventListener('focusout', (event) => {
      if (!slider.contains(event.relatedTarget)) resume();
    });
    slider.addEventListener('pointerdown', (event) => {
      if (event.target.closest('[data-slider-step], .product-open')) {
        pause();
        window.setTimeout(resume, PRODUCT_SLIDER_AUTO_MS);
      }
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          inView = entries.some((entry) => entry.isIntersecting);
          if (inView) start();
          else stop();
        },
        { threshold: 0.2 },
      );
      observer.observe(slider);
    }

    window.setTimeout(start, (index % 5) * 400);
  });

  return bound;
}

function initProductZoom() {
  const dialog = document.createElement('dialog');
  dialog.className = 'zoom-view';
  dialog.setAttribute('aria-label', 'Product photo');
  dialog.innerHTML = `<div class="zoom-shell">
  <div class="zoom-bar">
    <p class="zoom-title"></p>
    <div class="zoom-controls">
      <button type="button" data-zoom-out aria-label="Zoom out">−</button>
      <button type="button" data-zoom-in aria-label="Zoom in">+</button>
      <button type="button" data-zoom-close aria-label="Close">Close</button>
    </div>
  </div>
  <div class="zoom-actions">
    <button type="button" class="button button-small" data-zoom-enquiry>Enquiry</button>
    <a class="button button-small button-outline" data-zoom-ask href="#" hidden>Ask on WhatsApp</a>
    <span class="zoom-hint">Tap the photo to zoom · Esc to close</span>
  </div>
  <div class="zoom-views" hidden></div>
  <div class="zoom-stage-wrap">
    <button type="button" class="zoom-stage-nav prev" data-zoom-prev aria-label="Previous photo" hidden>‹</button>
    <button type="button" class="zoom-stage-nav next" data-zoom-next aria-label="Next photo" hidden>›</button>
    <div class="zoom-stage"><img alt=""></div>
  </div>
</div>`;
  document.body.append(dialog);
  const title = dialog.querySelector('.zoom-title');
  const enquiryBtn = dialog.querySelector('[data-zoom-enquiry]');
  const askLink = dialog.querySelector('[data-zoom-ask]');
  const stage = dialog.querySelector('.zoom-stage');
  const views = dialog.querySelector('.zoom-views');
  const prevBtn = dialog.querySelector('[data-zoom-prev]');
  const nextBtn = dialog.querySelector('[data-zoom-next]');
  const img = stage.querySelector('img');
  const view = { scale: 1, x: 0, y: 0, drag: null, moved: false, gallery: [], index: 0 };

  function syncGalleryChrome() {
    const many = view.gallery.length > 1;
    prevBtn.hidden = !many;
    nextBtn.hidden = !many;
    views.hidden = !many;
    views.querySelectorAll('[data-zoom-pick]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.zoomPick === view.gallery[view.index]);
    });
  }

  function showGallery(index) {
    if (!view.gallery.length) return;
    view.index = (index + view.gallery.length) % view.gallery.length;
    img.src = view.gallery[view.index];
    syncGalleryChrome();
    reset();
  }

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
  prevBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    showGallery(view.index - 1);
  });
  nextBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    showGallery(view.index + 1);
  });
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
  dialog.addEventListener('keydown', (event) => {
    if (!dialog.open) return;
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      showGallery(view.index - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      showGallery(view.index + 1);
    }
  });
  stage.addEventListener('click', (event) => {
    if (view.moved) {
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
    // Enquiry / WhatsApp must win over zoom — never open the lightbox for those.
    if (event.target.closest('a.order-enquiry, a.ask-link, a.luxe-add, [data-zoom-enquiry], [data-zoom-ask]')) {
      return;
    }
    const step = event.target.closest('[data-slider-step]');
    if (step) {
      event.preventDefault();
      const track = step.closest('.product-slider')?.querySelector('.product-slider-track');
      if (track) {
        const width = track.clientWidth || 1;
        track.scrollBy({ left: Number(step.dataset.sliderStep) * width, behavior: 'smooth' });
      }
      return;
    }
    const opener = event.target.closest('[data-zoom-src]');
    if (!opener) return;
    title.textContent = opener.dataset.zoomName || '';
    img.alt = opener.dataset.zoomName || '';
    img.src = opener.dataset.zoomSrc;
    const card = opener.closest('.product-card');
    const links = zoomDialogEnquiryLinks({
      enquiryHref: '/contact/',
      askHref: card?.querySelector('a.ask-link')?.getAttribute('href') || '',
      productName: opener.dataset.zoomName || '',
    });
    enquiryBtn.dataset.enquiryName = opener.dataset.zoomName || '';
    enquiryBtn.dataset.enquiryProduct = card?.querySelector('[data-enquiry-product]')?.dataset.enquiryProduct || '';
    enquiryBtn.setAttribute('aria-label', links.label);
    if (links.askHref) {
      askLink.href = links.askHref;
      askLink.hidden = false;
    } else {
      askLink.removeAttribute('href');
      askLink.hidden = true;
    }
    const sources = card
      ? [...card.querySelectorAll('[data-zoom-src]')].map((node) => node.dataset.zoomSrc).filter(Boolean)
      : [opener.dataset.zoomSrc];
    const unique = [...new Set(sources)].slice(0, 4);
    view.gallery = unique;
    view.index = Math.max(0, unique.indexOf(opener.dataset.zoomSrc));
    views.innerHTML = unique.length > 1
      ? unique.map((src) => `<button type="button" data-zoom-pick="${src}"><img src="${src}" alt="" width="56" height="56"></button>`).join('')
      : '';
    views.querySelectorAll('[data-zoom-pick]').forEach((button) => {
      button.addEventListener('click', () => {
        const next = view.gallery.indexOf(button.dataset.zoomPick);
        showGallery(next >= 0 ? next : view.index);
      });
    });
    syncGalleryChrome();
    reset();
    if (!dialog.open) dialog.showModal();
  });
}

initProductZoom();
bindProductImageSliders(document);

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
const announceProducts = document.querySelector('[data-announce-products]');
if (announceProducts) initAnnounceProducts(announceProducts);
initEnquiryDialog();
const enquiryForm = document.querySelector('[data-whatsapp-form]');
if (enquiryForm) initEnquiryForm(enquiryForm);
