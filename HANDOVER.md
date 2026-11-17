# Handover

Contacts live in `assets/js/config.js`. The HTML was generated from the same values. If you change a number, change it in `config.js` and in the header and footer (or run `python3 scripts/apply-info-chrome.py` only after reading that script, because it rewrites every page header).

WhatsApp: 0718 515 142. Email: omegaomegageneralsuppliers@gmail.com. Address: Gikomba Market, Nairobi. Hours: Monday to Saturday, 8:00am–6:00pm. The logo file is `assets/images/omuwenga-logo.jpg` and is not modified.

## Needs from the owner

- Confirm the second telephone. The site used to show +254 180 154 352. A printed image showed 0180 154 32. Neither is published now.
- A branded email on your own domain, when you have one. The Gmail address stays until then.
- Stall number and a landmark inside Gikomba.
- Any social accounts that are actually yours. None are linked.
- Years trading, or any other figure, only if you want a numbers band. It is hidden.
- A short silent stall video, if you want that band. It is hidden.
- Customer work: a photo, the place, and written permission to name the maker. The Our Work page says none of this is published.
- A response time for enquiries, if you want one stated on the contact form. None is stated.

## Real photos needed

Shoot in daylight, early morning or late afternoon. Plain backdrop. Include a ruler where size matters. Keep a landscape frame and a square frame of each subject.

- Hero: wide stall front, or hands matching a zipper. The current hero is the catalogue flower stand, cropped full-screen.
- Zippers and sliders, No. 5 to No. 10, square, plain backdrop.
- Hook and loop, 25 mm and 50 mm, same backdrop.
- 50 mm webbing, with a ruler.
- PVC lipping and piping, with a ruler.
- Find the stall: street approach, landmark, entrance, counter. Four photos.
- About: the stall, and fittings on the counter. No stand-in people.

Catalogue photos already used, and labelled as catalogue photos: flower stand, round sofa leg, handles, carpet castors, sofa buttons, sofa rim.

## Technical notes to verify

These follow ordinary trade descriptions and the names already in the shop. Please correct any line that does not match what you sell.

- Zipper numbers No. 5, No. 7, No. 8 and No. 10 describe chain size. The slider must match the chain.
- Stand height changes finished seat height. Shapes named in the shop: carrot, trophy, flower, Y-stand, round, spiral.
- Hook and loop widths named in the shop: 25 mm and 50 mm.
- Webbing width named in the shop: 50 mm.
- Handle lengths named in the shop: 96–150 mm. Catalogue handle photo is marked 5.5 inches. Buttons in the catalogue are marked 25, 28 and 30 mm.

## What changed

- Homepage follows a full-height opening, an about band, category rows, four steps, a map and one closing band.
- Header: logo on a white chip, six sections, product groups in a menu, one Get in Touch button that opens WhatsApp with a short message.
- Category pages for the six groups. Our Work, Privacy and Terms are real pages.
- The second, unverified phone is not shown.
- Customer stories, partner logos, a numbers band and a video are omitted because there is nothing confirmed to put there.
- The product list, catalogue PDF, guides, FAQ, careers email application and enquiry form are still there.

## How to add something

- A product: add it in the shop. The products page reads https://api.omuwenga.com. The website key in `config.js` must match `WEBSITE_API_KEY` on the server.
- A guide: add a folder under `guides/` with `index.html`, using the same header and footer, and add the URL to `sitemap.xml`.
- A project: only after you have a photo and permission. Put it on `work/index.html`. Do not invent a client name.

## Host

To make unknown addresses return 404, the site config should use `try_files $uri $uri/ =404;` and `error_page 404 /404.html;`. Falling back to `index.html` shows the homepage for a missing page.

## 90 days

- Week 1: confirm the second phone, the stall landmark, and replace the four “photo needed” slots you can shoot.
- Weeks 2–4: one guide a week only if it answers a question you already get (zipper size, stand height, webbing width).
- After that: watch which pages are opened and which WhatsApp clicks happen. No extra tracking script is installed. If you add a privacy-friendly counter, record the pages, the guide reading time, and clicks on WhatsApp, the phone, the email and the map.

## Not verified

Lighthouse scores were not run. The live server’s 404 status was not checked from here. Upload `assets/css/info.css`, the HTML pages, `sitemap.xml` and `assets/js/config.js` before the public site changes.
