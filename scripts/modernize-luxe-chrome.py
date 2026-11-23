#!/usr/bin/env python3
"""Inject luxury fonts + CSS cache bumps on every HTML page. Does not rewrite page bodies."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FONTS = """<link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">"""
SKIP_BODY = {"index.html"}  # home keeps class="home"


def html_files():
    for path in ROOT.rglob("*.html"):
        rel = str(path.relative_to(ROOT))
        if rel.startswith(("node_modules/", "tests/", "scripts/")):
            continue
        yield path, rel


def bump_css(html: str, prefix: str) -> str:
    html = re.sub(r'(assets/css/styles\.css)\?v=\d+', r'\1?v=14', html)
    html = re.sub(r'(assets/css/info\.css)\?v=\d+', r'\1?v=12', html)
    # bare href without query
    html = html.replace(f'{prefix}assets/css/styles.css"', f'{prefix}assets/css/styles.css?v=14"')
    html = html.replace(f'{prefix}assets/css/info.css"', f'{prefix}assets/css/info.css?v=12"')
    # absolute root 404
    html = html.replace('href="/assets/css/styles.css"', 'href="/assets/css/styles.css?v=14"')
    html = html.replace('href="/assets/css/info.css"', 'href="/assets/css/info.css?v=12"')
    return html


def inject_fonts(html: str) -> str:
    if "fonts.googleapis.com" in html:
        return html
    # insert before first stylesheet
    m = re.search(r'<link rel="stylesheet"', html)
    if not m:
        return html
    return html[: m.start()] + FONTS + "\n  " + html[m.start() :]


def ensure_atelier_body(html: str, rel: str) -> str:
    if rel in SKIP_BODY or 'class="home"' in html[:800]:
        return html
    if re.search(r'<body\s+class="atelier"', html):
        return html
    if re.search(r"<body>", html):
        return html.replace("<body>", '<body class="atelier">', 1)
    if re.search(r"<body\s*>", html):
        return re.sub(r"<body\s*>", '<body class="atelier">', html, count=1)
    # body with other classes
    return re.sub(r'<body(\s+class="([^"]*)")?', lambda m: f'<body class="atelier {m.group(2)}">' if m.group(2) and "atelier" not in m.group(2) else (m.group(0) if m.group(2) and "atelier" in m.group(2) else '<body class="atelier">'), html, count=1)


def enhance_products(html: str) -> str:
    if 'class="products-luxe-hero"' in html:
        return html
    needle = '<section class="section catalog-section"'
    if needle not in html:
        return html
    hero = '''<section class="products-luxe-hero"><div class="container"><p class="crumbs"><a href="../">Home</a> / Products</p><h1>Products</h1><p>Current shop fittings from Omuwenga in Gikomba — search by name or filter by category.</p></div></section>
'''
    # products page has visually-hidden h1 — replace that with visible hero
    html = re.sub(
        r'<h1 class="visually-hidden">Products</h1>\s*',
        "",
        html,
        count=1,
    )
    return html.replace(needle, hero + needle, 1)


def enhance_catalogue(html: str) -> str:
    if "catalogue-hero" not in html:
        return html
    if "<h1" in html and "visually-hidden" in html:
        html = html.replace(
            '<h1 class="visually-hidden">Catalogue</h1>',
            '<p class="crumbs"><a href="../">Home</a> / Catalogue</p><p class="atelier-kicker" style="color:var(--blue)">Picture catalogue</p><h1>Furniture fittings catalogue</h1><p>Seven pages of stands, hardware, piping, webbing and zippers from Omuwenga Suppliers.</p>',
            1,
        )
    return html


def main():
    for path, rel in html_files():
        html = path.read_text()
        prefix = "../" * rel.count("/")
        if rel == "404.html":
            prefix = "/"
        html = inject_fonts(html)
        html = bump_css(html, prefix if prefix != "/" else "/")
        html = ensure_atelier_body(html, rel)
        if rel == "products/index.html":
            html = enhance_products(html)
        if rel == "catalogue/index.html":
            html = enhance_catalogue(html)
        # add sitemap hint once
        if 'rel="sitemap"' not in html and rel != "404.html":
            html = html.replace(
                '<meta name="twitter:card" content="summary_large_image">',
                '<meta name="twitter:card" content="summary_large_image"><link rel="sitemap" type="application/xml" title="Sitemap" href="https://omuwenga.com/sitemap.xml">',
                1,
            )
        path.write_text(html)
        print("ok", rel)


if __name__ == "__main__":
    main()
