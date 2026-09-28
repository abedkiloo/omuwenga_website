# Omuwenga website — The Furniture Maker's Supply Partner

Plain HTML, CSS and JavaScript website. Static pages carry the core SEO content; the product catalog and blog are loaded live from the CompleteBytePOS backend.

## Preview locally

1. Start the backend (`CompleteBytePOS/be`) on `127.0.0.1:8000`.
2. From the `website` folder:

```bash
npm run serve        # python3 -m http.server 8080
```

Open `http://localhost:8080`. Without the backend the site still works — the live sections simply stay hidden or show a friendly message.

## Live content from the backend

| What | Where it is managed | Public API used by the site |
| --- | --- | --- |
| Products (name, photo, category, availability) | POS → Products (upload the product image there) | `/api/public/website/products/` |
| Categories | POS → Categories | `/api/public/website/categories/` |
| Blog posts | POS → Website → Blog posts | `/api/public/website/blog/` |

The public API never exposes cost, stock counts or suppliers. Prices are hidden unless the backend sets `WEBSITE_SHOW_PRICES=true`.

### Configuration

- `assets/js/config.js` — set `apiBase` to the backend's public address (leave empty if the backend is served from the same domain under `/api/`), and `siteUrl` to the website's address.
- Backend `.env` — add the website address to `WEBSITE_PUBLIC_ORIGINS` (comma-separated) so browsers may call the API, e.g. `WEBSITE_PUBLIC_ORIGINS=https://omuwenga.co.ke`.

### Blog SEO: pre-render posts

Search engines index static HTML best. After publishing or editing posts, run:

```bash
API_BASE=https://your-backend SITE_URL=https://your-website npm run build:blog
```

This writes `blog/<slug>/index.html` for every published post (with title, description, canonical URL, Open Graph and `BlogPosting` structured data), fills the blog list, updates `sitemap.xml`, and removes pages for unpublished posts. Upload the updated `blog/` folder and `sitemap.xml`. Posts that are not yet pre-rendered still open at `blog/post/?slug=…`.

## Tests

```bash
npm test
```

Covers the safe Markdown renderer, product/blog cards, the pre-render output, and whole-site checks (SEO tags, branding, contacts, blog link and internal links on every page).

## Before publishing

Replace `https://example.co.ke` with the production address in all `.html` files, `robots.txt`, `sitemap.xml` and `assets/js/config.js`. Replace the Google Maps query in `location/index.html` and `contact/index.html` with the real Business Profile/map pin.

## Edit content

- Home: `index.html`
- Product categories and live catalog: `products/index.html`
- Blog list / post template: `blog/index.html`, `blog/post/index.html`
- Wholesale information: `wholesale/index.html`
- Business story: `about/index.html`
- FAQs: `faq/index.html`
- Guides: `guides/`
- Contact information: `contact/index.html`
- Colours and layout: `assets/css/styles.css`

## Contact form

The current form opens the visitor's email application. For direct website submissions, connect it to the chosen static host's form service or a service such as Formspree.

## Analytics

Analytics is intentionally not installed. Add the approved Google Analytics tag only after the account ID and cookie/privacy approach are confirmed.
