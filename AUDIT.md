# Audit of omuwenga.com

Reviewed from the site in this project on 11 Nov 2026, which is the copy last prepared for https://omuwenga.com. The reference site https://furnitureinternational.co.ke/ was opened in a browser for layout only. Nothing from that site was copied.

## Contact

- WhatsApp 0718 515 142 (`+254718515142`) is the number used on the pages and in `wa.me` links.
- A second number, `+254 180 154 352`, was in the header and in the page data. A printed image has been described as `0180 154 32`. Those two do not match, and neither is a normal Kenyan mobile. That second number is no longer printed.
- Email on every page was `omegaomegageneralsuppliers@gmail.com`. It is a real inbox and a different name from the shop. It stays until a domain address exists.
- Address everywhere that was checked: Gikomba Market, Nairobi. No stall number or landmark is published.
- Hours that were published: Monday to Saturday, 8:00am–6:00pm.

## SEO and metadata

- Local pages already used `https://omuwenga.com` for canonical and Open Graph URLs. `example.co.ke` was not in the page HTML. It remains only inside the blog-build test fixture.
- Titles, descriptions and JSON-LD were present. The homepage declared the organisation, the slogan and Kenya as the area served.
- `sitemap.xml` and `robots.txt` existed. New category, work, privacy and terms URLs are now in the sitemap.
- Unknown addresses: `404.html` exists and is `noindex`. Whether the live server returns HTTP 404, or serves the homepage, depends on the host rule. The nginx example that was shared used `try_files` back to `index.html`, which does not return 404.

## Content

- The homepage was a shop grid: catalogue tiles, live products, category links and a closing band. It was more catalogue than explanation.
- Guides on zipper sizes, sofa stands, materials and buying in Gikomba are real articles and stay.
- No owner-supplied years, client names, testimonials, certificates or project photos were on the site. Those sections are omitted rather than filled.
- Product names and photos come from the shop API. Prices stay off unless the shop turns them on.

## Navigation

- The old header had ten links: Products, Catalogue, Trade, About, Location, Guides, Blog, FAQ, Careers, Contact, plus a WhatsApp button.
- The new header is Home, About Us, Products (six categories), Our Work, Guides, Contact, and one Get in Touch button. Catalogue, careers, FAQ and the blog remain in the footer.

## Performance and accessibility

- The old stylesheet and the product script are still loaded, so the first download is not as small as a page built from nothing. The new sheet is `assets/css/info.css`.
- A skip link, 16px-or-larger type, and 48px targets on the menu and the Get in Touch button are in the new layout.
- Lighthouse was not run in this pass. Scores are not claimed.

## What changed after the audit

The homepage is now a full-height photo with text in the page, then the shop, the six groups, the four steps, the map, and one closing band. Numbers, video, customer work and testimonials are not shown.
