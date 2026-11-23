# Handover

Contacts live in `assets/js/config.js`. The HTML was generated from the same values. If you change a number, change it in `config.js` and in the header and footer (or run `python3 scripts/apply-info-chrome.py` only after reading that script, because it rewrites every page header).

WhatsApp: 0718 515 142. Email: info@omuwenga.com. Careers / CV: jobs@omuwenga.com. Address: Gikomba Market, Nairobi. Hours: Monday to Saturday, 8:00am–6:00pm. The logo file is `assets/images/omuwenga-logo.jpg` and is not modified.

## Optional details (not on the public site yet)

Reply with any of these if you want them added:

- Second phone number (only if it is a real Kenyan mobile you want published)
- Stall number and a landmark inside Gikomba (for Contact / Location)
- Years trading, certificates, or a short team / stall story for About
- Social account URLs that are actually yours
- Customer work photos with written permission to name the maker (for Our Work)
- A response-time note for the contact form, if you want one stated

## Real photos (optional upgrades)

The site already uses the logo, artisan photos and catalogue tiles. Extra daylight shots of the stall approach, entrance and counter would strengthen Location / Contact if you have them.

## Deploy

- Static files under this folder are the site.
- Live products and blog come from `api.omuwenga.com` via `assets/js/config.js`.
- After changing `info.css` or `live.js`, bump the `?v=` query on pages that load them if the host caches aggressively.

## Careers

- Applications go to `jobs@omuwenga.com`.
- Vacancy copy lives in `assets/js/vacancies.js` and `careers/sales-representative/`.
