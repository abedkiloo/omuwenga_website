# Gikomba Upholstery Supplies website

Plain HTML, CSS and JavaScript brochure website. It has no framework, database, cart, pricing, stock integration or checkout.

## Preview locally

From the `website` folder:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Upload the entire folder to shared hosting, GitHub Pages, Netlify or another static host.

## Before publishing

Search and replace these placeholders across all `.html`, `robots.txt` and `sitemap.xml` files:

- `Gikomba Upholstery Supplies` — real business name
- `+254 700 000 000` and `254700000000` — real phone/WhatsApp number
- `hello@example.co.ke` — real email
- `Placeholder Shop` — exact shop/stall and landmark
- `https://example.co.ke` — production website address

Replace the Google Maps query in `location/index.html` and `contact/index.html` with the real Business Profile/map pin.

## Edit content

- Home: `index.html`
- Product categories: `products/index.html`
- Wholesale information: `wholesale/index.html`
- Business story: `about/index.html`
- FAQs: `faq/index.html`
- Guides: `guides/`
- Contact information: `contact/index.html`
- Colours and layout: `assets/css/styles.css`

Images currently use compressed placeholder URLs from Unsplash. Replace each image `src`, keep meaningful `alt` text, and ideally use WebP images under `assets/images/`.

## Contact form

The current form opens the visitor's email application. For direct website submissions, connect it to the chosen static host's form service or a service such as Formspree.

## Analytics

Analytics is intentionally not installed. Add the approved Google Analytics tag only after the account ID and cookie/privacy approach are confirmed.
