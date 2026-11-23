#!/usr/bin/env python3
"""Apply the information-site header, footer and new pages. One contact set."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WA = "https://wa.me/254718515142?text=Hello%20Omuwenga%2C%20I%20would%20like%20to%20ask%20about%20a%20fitting."
EMAIL = "info@omuwenga.com"
NAV = [
    ("home", "", "Home"),
    ("about", "about/", "About Us"),
    ("products", "products/", "Products"),
    ("catalogue", "catalogue/", "Catalogue"),
    ("work", "work/", "Our Work"),
    ("guides", "guides/", "Guides"),
    ("careers", "careers/", "Careers"),
    ("contact", "contact/", "Contact"),
]
SUBS = [
    ("products/zippers/", "Zippers and sliders"),
    ("products/sofa-stands/", "Sofa stands"),
    ("products/piping/", "Piping and lipping"),
    ("products/hook-and-loop/", "Hook and loop"),
    ("products/webbing/", "Webbing"),
    ("products/hardware/", "Handles and castors"),
]


def prefix_for(rel: str) -> str:
    if rel == "404.html":
        return "/"
    return "../" * rel.count("/")


def url(prefix: str, path: str) -> str:
    if prefix == "/":
        return "/" + path if path else "/"
    if not path:
        return prefix or "./"
    return prefix + path


def header(prefix: str, current: str) -> str:
    def link(key, path, label):
        current_attr = ' aria-current="page"' if key == current else ""
        return f'<a href="{url(prefix, path)}"{current_attr}>{label}</a>'

    subs = "".join(f'<a href="{url(prefix, path)}">{label}</a>' for path, label in SUBS)
    items = []
    for key, path, label in NAV:
        if key == "products":
            items.append(
                f'<div class="nav-item">{link(key, path, label)}<div class="nav-sub">{subs}</div></div>'
            )
        else:
            items.append(link(key, path, label))
    logo = url(prefix, "assets/images/omuwenga-logo.jpg")
    return f'''<a class="skip" href="#content">Skip to content</a>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="{url(prefix, "")}"><span class="logo-chip"><img class="brand-logo" src="{logo}" alt="Omuwenga logo" width="54" height="54"></span><span class="brand-name"><strong>OMUWENGA</strong><small>The Furniture Maker&rsquo;s Supply Partner</small></span></a>
<button type="button" class="menu-toggle" aria-label="Open navigation" aria-expanded="false"><span></span><span></span><span></span></button>
<nav class="main-nav" aria-label="Main navigation">{"".join(items)}</nav>
<a class="button button-small header-whatsapp" href="{WA}">Get in Touch</a>
</div></header>'''


def footer(prefix: str) -> str:
    logo = url(prefix, "assets/images/omuwenga-logo.jpg")
    home = url(prefix, "")
    pdf = url(prefix, "assets/catalogue/omuwenga-suppliers-catalogue.pdf")
    maps = "https://maps.google.com/?q=Gikomba+Market+Nairobi"
    return f'''<footer class="site-footer">
<div class="footer-cta"><div class="container footer-cta-inner">
<div><p class="footer-cta-kicker">Visit the go-to stall</p><h2>Gikomba Market, Nairobi</h2><p>Monday to Saturday, 8:00am–6:00pm · Call or WhatsApp 0718 515 142 for directions.</p></div>
<div class="button-row"><a class="button" href="{maps}">Open Google Maps</a><a class="button button-outline" href="{WA}">Get in Touch</a></div>
</div></div>
<div class="container footer-grid">
<div><a class="brand" href="{home}"><span class="logo-chip"><img class="brand-logo" src="{logo}" alt="Omuwenga logo" width="54" height="54"></span><span class="brand-name"><strong>OMUWENGA</strong><small>The Furniture Maker&rsquo;s Supply Partner</small></span></a>
<p>Kenya&rsquo;s go-to furniture and upholstery fittings supplier — wholesale and retail for workshops, manufacturers, upholsterers and resellers across East Africa.</p>
<p><a href="{pdf}">Product catalogue (PDF)</a></p></div>
<div><h2>Company</h2><p><a href="{url(prefix, "about/")}">About</a><br><a href="{url(prefix, "contact/")}">Contact</a><br><a href="{url(prefix, "careers/")}">Careers</a><br><a href="{url(prefix, "work/")}">Our Work</a><br><a href="{url(prefix, "catalogue/")}">Catalogue</a><br><a href="{url(prefix, "faq/")}">FAQ</a><br><a href="{url(prefix, "blog/")}">Blog</a></p></div>
<div><h2>Contact</h2><p><a href="mailto:{EMAIL}">{EMAIL}</a><br><a href="tel:+254718515142">0718 515 142</a><br><a href="{WA}">WhatsApp</a><br>Gikomba Market, Nairobi<br>Mon–Sat, 8:00am–6:00pm</p></div>
<div><h2>Visit</h2><p>Omuwenga Suppliers<br>Gikomba Market, Nairobi, Kenya<br>Collect in Gikomba, or ask about a courier across Kenya.<br><a href="{url(prefix, "location/")}">Location &amp; map</a></p></div>
</div><div class="container footer-bottom"><span>© <span data-year></span> Omuwenga Suppliers</span><a href="{url(prefix, "privacy/")}">Privacy Policy</a><a href="{url(prefix, "terms/")}">Terms</a></div></footer>
<a class="whatsapp-float" href="{WA}" aria-label="Get in Touch"><span class="whatsapp-float-label">Get in Touch</span></a>'''


def current_key(rel: str) -> str:
    if rel == "index.html":
        return "home"
    if rel.startswith("about/"):
        return "about"
    if rel.startswith("catalogue/"):
        return "catalogue"
    if rel.startswith("products/"):
        return "products"
    if rel.startswith("work/"):
        return "work"
    if rel.startswith("guides/") or rel.startswith("blog/"):
        return "guides"
    if rel.startswith("contact/"):
        return "contact"
    return ""


def apply_chrome(rel: str, html: str) -> str:
    prefix = prefix_for(rel)
    html = re.sub(r'<div class="topbar"><div class="container">.*?</div></div>\s*', "", html, count=1, flags=re.S)
    chrome = header(prefix, current_key(rel))
    if "<header class=\"site-header\">" in html:
        html = re.sub(r'<header class="site-header">.*?</header>', chrome.split("\n", 1)[1], html, count=1, flags=re.S)
    if 'class="skip"' not in html:
        html = html.replace("<body>", "<body>\n" + chrome.split("\n", 1)[0], 1)
        html = html.replace("<body class=\"home\">", "<body class=\"home\">\n" + chrome.split("\n", 1)[0], 1)
    html = re.sub(r'<footer class="site-footer">.*?</footer>\s*(?:<a class="whatsapp-float"[\s\S]*?</a>)?', footer(prefix), html, count=1, flags=re.S)
    if "info.css" not in html:
        html = html.replace('styles.css?v=11"', 'styles.css?v=11"><link rel="stylesheet" href="' + url(prefix, "assets/css/info.css?v=1") + '"')
        html = html.replace('styles.css"', 'styles.css"><link rel="stylesheet" href="' + url(prefix, "assets/css/info.css?v=1") + '"')
    html = html.replace("live.js?v=11", "live.js?v=12")
    html = re.sub(r'<main(?![^>]*\bid=)', '<main id="content"', html, count=1)
    return html


HEAD = '''<!DOCTYPE html><html lang="en-KE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{title}</title><meta name="description" content="{desc}"><link rel="canonical" href="{canon}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#075b9d"><link rel="icon" href="{icon}" type="image/jpeg"><meta property="og:type" content="website"><meta property="og:site_name" content="Omuwenga"><meta property="og:locale" content="en_KE"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{canon}"><meta property="og:image" content="https://omuwenga.com/assets/catalogue/tiles/flower-stand.jpg"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="{css}"><link rel="stylesheet" href="{info}"><script type="application/ld+json">{ld}</script></head><body>
{header}<main id="content">{body}</main>
{footer}<script src="{js}" defer></script></body></html>'''


def page(rel, title, desc, canon, crumbs, body, current):
    prefix = prefix_for(rel)
    ld = '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[' + ",".join(
        '{"@type":"ListItem","position":%d,"name":"%s","item":"%s"}' % (i + 1, name, item)
        for i, (name, item) in enumerate(crumbs)
    ) + ']}'
    html = HEAD.format(
        title=title, desc=desc, canon=canon,
        icon=url(prefix, "assets/images/omuwenga-logo.jpg"),
        css=url(prefix, "assets/css/styles.css?v=11"),
        info=url(prefix, "assets/css/info.css?v=1"),
        ld=ld, header=header(prefix, current), body=body, footer=footer(prefix),
        js=url(prefix, "assets/js/main.js"),
    )
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(html)
    print("wrote", rel)


def category(slug, title, desc, intro, stock, blocks, photos, guide):
    bits = [f'<p class="crumbs"><a href="../../">Home</a> / <a href="../">Products</a> / {title.split("|")[0].strip()}</p><h1>{title.split("|")[0].strip()}</h1><p>{intro}</p>']
    bits.append("<h2>What is stocked</h2><ul class=\"feature-list\">" + "".join(f"<li>{item}</li>" for item in stock) + "</ul>")
    bits.append('<div class="numbered">' + "".join(f"<article><h2>{h}</h2><p>{p}</p></article>" for h, p in blocks) + "</div>")
    if photos:
        bits.append('<div class="square-row">' + "".join(
            f'<figure><img src="../../assets/catalogue/tiles/{src}" alt="{alt}" width="320" height="300"><figcaption>{cap}</figcaption></figure>'
            for src, alt, cap in photos
        ) + "</div>")
    bits.append(f'<p><a href="../../guides/{guide}">Read the related guide</a> · <a href="../">See the current product list</a></p>')
    bits.append(f'<section class="close-band"><div class="container"><h2>Questions about a part?</h2><p>Send the name, the size and a photo. The shop confirms what is in stock before you pay.</p><a class="button" href="{WA}">Get in Touch</a></div></section>')
    page(
        f"products/{slug}/index.html", title, desc, f"https://omuwenga.com/products/{slug}/",
        [("Home", "https://omuwenga.com/"), ("Products", "https://omuwenga.com/products/"), (title.split("|")[0].strip(), f"https://omuwenga.com/products/{slug}/")],
        "".join(bits), "products",
    )


def main():
    for path in ROOT.rglob("*.html"):
        rel = str(path.relative_to(ROOT))
        if rel.startswith("products/") and path.parent.name != "products":
            continue
        html = apply_chrome(rel, path.read_text())
        path.write_text(html)
        print("chrome", rel)

    category(
        "zippers", "Zippers and Sliders | Omuwenga",
        "Nylon zippers and matching sliders from Omuwenga in Gikomba, including No. 5, No. 7, No. 8 and No. 10.",
        "Omuwenga stocks nylon zippers and the sliders that run on them. The sizes named in the shop list are No. 5, No. 7, No. 8 and No. 10.",
        ["No. 5 zipper", "No. 7 zipper", "No. 8 sliders", "No. 10 zipper", "No. 10 sliders", "No. 5 sliders"],
        [("Sizes and types", "Zipper numbers are a general way to talk about chain size. A slider has to match the chain. The guide explains how No. 5, No. 7, No. 8 and No. 10 are usually used, and the shop confirms the piece you need."),
         ("Matched to the job", "Send a photo of the chain and the slider, or bring the old piece to Gikomba. That is how the size is checked."),
         ("Available in quantity", "You can ask for one piece or a larger quantity. The price is confirmed before you pay.")],
        [], "zipper-sizes/",
    )
    category(
        "sofa-stands", "Sofa Stands and Legs | Omuwenga",
        "Sofa stands from Omuwenga in Gikomba: carrot, trophy, flower, Y-stand, round and spiral shapes.",
        "The shop list names carrot, trophy, flower, Y-stand, yam, round and spiral stands, in sizes such as 4 inch, 5 inch and 6 inch.",
        ["Carrot stands", "Trophy stands", "Flower stands", "Y-stands", "Round stands", "Spiral stands"],
        [("Sizes and types", "Stand height changes the finished seat height. Measure the frame and the cushion together, then compare with the inch size on the product name."),
         ("Matched to the job", "A photo of the underside, including the plate and the holes, is the useful check when you are replacing a stand."),
         ("Available in quantity", "Workshops and manufacturers can ask for a quantity. Availability is confirmed from the shop.")],
        [("flower-stand.jpg", "Gold flower sofa stand from the Omuwenga catalogue", "Flower stand, 5 inches, from the catalogue"),
         ("round-sofa-leg.jpg", "Gold round sofa leg from the Omuwenga catalogue", "Round sofa leg, 5 inches, from the catalogue")],
        "choose-sofa-stand/",
    )
    category(
        "piping", "Piping and Lipping | Omuwenga",
        "PVC lipping and related finishing from Omuwenga Suppliers in Gikomba Market, Nairobi.",
        "The shop list includes plastic lipping and PVC in widths such as 3/4 inch, 1 inch and 2 inch. Colours named there include gold.",
        ["Plastic lipping", "PVC, including 1 inch PVC gold", "2 inch PVC"],
        [("Sizes and types", "Lipping and PVC are sold by the type printed on the product name. Bring a sample if you need a match."),
         ("Matched to the job", "A short offcut, or a photo against a ruler, shows the width."),
         ("Available in quantity", "Ask for the length or the number of rolls. The shop confirms the price.")],
        [], "upholstery-materials/",
    )
    category(
        "hook-and-loop", "Hook and Loop | Omuwenga",
        "Hook and loop from Omuwenga in Gikomba, in 25 mm and 50 mm widths.",
        "The shop list names 25 mm and 50 mm hook and loop. It can be asked for by the metre or by the roll.",
        ["25 mm hook and loop", "50 mm hook and loop"],
        [("Sizes and types", "The width is the main difference named in the shop. 25 mm and 50 mm are both listed."),
         ("Matched to the job", "A photo of the tape on the cover shows which width you are replacing."),
         ("Available in quantity", "Say whether you need metres or a roll. The shop confirms what is in stock.")],
        [], "upholstery-materials/",
    )
    category(
        "webbing", "Webbing and Straps | Omuwenga",
        "50 mm webbing from Omuwenga Suppliers in Gikomba, for sofa seats and backs.",
        "The shop list includes 50 mm webbing. It is the width named for seat and back support.",
        ["50 mm webbing"],
        [("Sizes and types", "Webbing width is named in millimetres. The listed width is 50 mm."),
         ("Matched to the job", "If you are replacing a strap, measure the old one or send a photo against a ruler."),
         ("Available in quantity", "Ask for the length you need. The shop confirms availability and the price.")],
        [], "upholstery-materials/",
    )
    category(
        "hardware", "Handles and Castors | Omuwenga",
        "Handles, carpet castors, sofa buttons and rim from Omuwenga in Gikomba.",
        "The shop list includes handles marked 96–150 mm, carpet castors, sofa buttons and sofa rim. The catalogue shows handles at 5.5 inches, castors in silver and gold, buttons at 25, 28 and 30 mm, and rim in silver and gold.",
        ["Handles 96–150 mm", "Carpet castors", "Sofa buttons, 25, 28 and 30 mm in the catalogue", "Sofa rim, silver and gold in the catalogue"],
        [("Sizes and types", "Handle length, button diameter and finish are the details printed in the catalogue and on the product names."),
         ("Matched to the job", "A photo of the old fitting, with a ruler if you can, is enough to start the check."),
         ("Available in quantity", "Retail and wholesale quantities are both quoted by the shop before you pay.")],
        [("handles.jpg", "Gold and silver furniture handle from the Omuwenga catalogue", "Handle, 5.5 inches, from the catalogue"),
         ("carpet-castors.jpg", "Gold and black carpet castor from the Omuwenga catalogue", "Carpet castor, silver and gold, from the catalogue"),
         ("sofa-buttons.jpg", "Silver and gold sofa buttons from the Omuwenga catalogue", "Sofa buttons, 25, 28 and 30 mm, from the catalogue"),
         ("sofa-rim.jpg", "Gold sofa rim from the Omuwenga catalogue", "Sofa rim, silver and gold, from the catalogue")],
        "upholstery-materials/",
    )

    page(
        "work/index.html", "Our Work | Omuwenga Suppliers",
        "Omuwenga does not publish customer furniture on this site. See the fittings catalogue and the product list.",
        "https://omuwenga.com/work/",
        [("Home", "https://omuwenga.com/"), ("Our Work", "https://omuwenga.com/work/")],
        f'<p class="crumbs"><a href="../">Home</a> / Our Work</p><h1>Our work</h1><p>Omuwenga supplies the fittings furniture makers use every day — zippers, stands, piping, webbing and hardware. See the current shop list and the picture catalogue for what is available.</p><p><a href="../catalogue/">Open the fittings catalogue</a> · <a href="../products/">See products in the shop</a></p><section class="close-band"><div class="container"><h2>Questions about a part?</h2><p>Send the name, the size and a photo.</p><a class="button" href="{WA}">Get in Touch</a></div></section>',
        "work",
    )
    page(
        "privacy/index.html", "Privacy Policy | Omuwenga",
        "What Omuwenga Suppliers does with a name, phone number or message sent from this website.",
        "https://omuwenga.com/privacy/",
        [("Home", "https://omuwenga.com/"), ("Privacy Policy", "https://omuwenga.com/privacy/")],
        f'<p class="crumbs"><a href="../">Home</a> / Privacy</p><h1>Privacy Policy</h1><p>If you use the enquiry form, the shop receives your name, phone number and message so it can reply. The form is stored for the shop to review. WhatsApp messages are handled by WhatsApp.</p><p>This site does not add third-party tracking scripts. The pages ask the shop system for product names and photos.</p><p>To ask about a message you sent, use <a href="mailto:{EMAIL}">{EMAIL}</a> or WhatsApp 0718 515 142.</p>',
        "",
    )
    page(
        "terms/index.html", "Terms of Supply | Omuwenga",
        "How an order from Omuwenga Suppliers in Gikomba is confirmed, paid and collected or sent.",
        "https://omuwenga.com/terms/",
        [("Home", "https://omuwenga.com/"), ("Terms", "https://omuwenga.com/terms/")],
        '<p class="crumbs"><a href="../">Home</a> / Terms</p><h1>Terms of supply</h1><p>A listing on this site is not a confirmed order. The shop confirms the item, the quantity and the price before you pay.</p><p>Payment methods the shop accepts are M-Pesa, bank transfer and cash. You can collect in Gikomba Market, or ask for a Nairobi rider or a courier across Kenya. The delivery charge depends on the destination and the size.</p><p>Hours are Monday to Saturday, 8:00am–6:00pm.</p>',
        "",
    )


HOME = '''<main id="content">
<section class="hero">
<img class="hero-photo" src="assets/catalogue/tiles/flower-stand.jpg" alt="Gold flower sofa stand from the Omuwenga catalogue" width="325" height="296">
<div class="hero-shade"></div>
<div class="container hero-copy">
<p class="hero-facts">Gikomba, Nairobi · Wholesale and retail · Delivery across Kenya</p>
<h1>Upholstery supplies for furniture makers.</h1>
<p>Zippers, sofa stands, piping, webbing and finishing hardware from Omuwenga Suppliers in Gikomba Market, Nairobi.</p>
<div class="button-row"><a class="button" href="products/">Browse Products</a><a class="button button-outline" href="{wa}">Get in Touch</a></div>
</div>
<a class="scroll-cue" href="#supply">Scroll down</a>
</section>
<section class="band" id="about"><div class="container about-grid">
<div><span class="eyebrow">About the shop</span><h2>A fittings shop in Gikomba.</h2>
<p>Omuwenga Suppliers stocks furniture and upholstery fittings for workshops, manufacturers, upholsterers and resellers. The stall is in Gikomba Market, Nairobi, Monday to Saturday, 8:00am to 6:00pm.</p>
<p><a href="about/">Learn more</a></p></div>
<div class="about-photo"><img src="assets/catalogue/tiles/handles.jpg" alt="Gold and silver furniture handle from the Omuwenga catalogue" width="326" height="296"><span class="loc-chip">Gikomba, Nairobi</span></div>
</div></section>
<section class="band" id="supply"><div class="container">
<span class="eyebrow">What we supply</span><h2>Six groups of fittings.</h2>
<article class="supply-row"><div class="supply-photo"><img src="assets/catalogue/tiles/flower-stand.jpg" alt="Gold flower sofa stand from the Omuwenga catalogue" width="325" height="296"></div><div class="supply-copy"><p class="kicker">Stands</p><h3>Sofa stands and legs</h3><p>Carrot, trophy, flower, Y-stand, round and spiral stands are named in the shop list, including 4 inch, 5 inch and 6 inch sizes.</p><p><a href="products/sofa-stands/">Learn more</a></p></div></article>
<article class="supply-row reverse"><div class="supply-photo"><img src="assets/catalogue/tiles/zipper-no5.jpg" alt="Nylon zipper from the Omuwenga catalogue" width="325" height="296"></div><div class="supply-copy"><p class="kicker">Closures</p><h3>Zippers and sliders</h3><p>Nylon zippers and matching sliders. The sizes named in the shop are No. 5, No. 7, No. 8 and No. 10.</p><p><a href="products/zippers/">Learn more</a></p></div></article>
<article class="supply-row"><div class="supply-photo"><img src="assets/catalogue/tiles/handles.jpg" alt="Furniture handle from the Omuwenga catalogue" width="326" height="296"></div><div class="supply-copy"><p class="kicker">Hardware</p><h3>Handles, castors and finishing</h3><p>Handles are listed from 96 mm to 150 mm. The catalogue shows handles, carpet castors, sofa buttons and sofa rim.</p><p><a href="products/hardware/">Learn more</a></p></div></article>
<article class="supply-row reverse"><div class="supply-photo"><img src="assets/catalogue/tiles/hook-and-loop.jpg" alt="Hook and loop tape from the Omuwenga catalogue" width="325" height="296"></div><div class="supply-copy"><p class="kicker">Tape</p><h3>Hook and loop</h3><p>25 mm and 50 mm hook and loop are named in the shop list, by the metre or by the roll.</p><p><a href="products/hook-and-loop/">Learn more</a></p></div></article>
<article class="supply-row"><div class="supply-photo"><img src="assets/catalogue/tiles/webbing.jpg" alt="Upholstery webbing from the Omuwenga catalogue" width="326" height="296"></div><div class="supply-copy"><p class="kicker">Support</p><h3>Webbing and straps</h3><p>50 mm webbing is the width named in the shop list for seats and backs.</p><p><a href="products/webbing/">Learn more</a></p></div></article>
<article class="supply-row reverse"><div class="supply-photo"><img src="assets/catalogue/tiles/piping-white.jpg" alt="Piping and lipping from the Omuwenga catalogue" width="325" height="296"></div><div class="supply-copy"><p class="kicker">Edge</p><h3>Piping and lipping</h3><p>Plastic lipping and PVC, including the inch widths named on the product list.</p><p><a href="products/piping/">Learn more</a></p></div></article>
</div></section>
<section class="band"><div class="container"><span class="eyebrow">How to get what you need</span><h2>Four steps.</h2>
<ol class="steps"><li><strong>Send or bring the piece.</strong> A photo, a sample, or the old fitting is enough to start.</li><li><strong>The size and type are checked.</strong> Zipper number, stand shape, tape width or handle length.</li><li><strong>Availability is confirmed.</strong> The shop says what is in stock and the price before you pay.</li><li><strong>Collect or send.</strong> Collect in Gikomba, or ask for a Nairobi rider or a courier across Kenya.</li></ol>
</div></section>
<section class="band" id="find"><div class="container"><span class="eyebrow">Find the stall</span><h2>Gikomba Market, Nairobi.</h2>
<p>Omuwenga Suppliers, Gikomba Market. Monday to Saturday, 8:00am–6:00pm. Call or WhatsApp 0718 515 142 before you travel and the shop will direct you.</p>
<div class="map-embed"><iframe title="Map showing Gikomba Market in Nairobi" src="https://www.google.com/maps?q=Gikomba%20Market%20Nairobi&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
</div></section>
<section class="close-band"><div class="container"><h2>Questions about a part?</h2><p>Send the name, the size and a photo. Wholesale and retail are both quoted before you pay.</p><a class="button" href="{wa}">Get in Touch</a></div></section>
</main>'''


def rewrite_home():
    path = ROOT / "index.html"
    html = path.read_text()
    html = html.replace("<body>", '<body class="home">', 1)
    html = re.sub(r'<main id="content"[\s\S]*?</main>', HOME.format(wa=WA), html, count=1)
    # Keep one telephone in the visible site. The second published number is unverified.
    html = html.replace('"+254718515142", "+254180154352"', '"+254718515142"')
    path.write_text(html)
    print("home")


def rewrite_about():
    path = ROOT / "about/index.html"
    html = path.read_text()
    body = f'''<section class="page-hero"><div class="container narrow"><p class="crumbs"><a href="../">Home</a> / About</p><h1>About Omuwenga Suppliers</h1>
<p>Omuwenga Suppliers is a furniture and upholstery fittings shop in Gikomba Market, Nairobi. The hours are Monday to Saturday, 8:00am–6:00pm.</p></div></section>
<section class="band"><div class="container"><h2>What is stocked</h2><p>Zippers and sliders, sofa stands and legs, piping and lipping, webbing, hook and loop, handles, castors and finishing hardware. Wholesale and retail. Payment is M-Pesa, bank transfer or cash, confirmed before you pay.</p>
<h2>How we work</h2><p>Bring a sample, a photo or the old fitting. The shop matches the size and type, confirms what is in stock, and quotes before you pay. Collect in Gikomba, or ask about a Nairobi rider or a courier across Kenya.</p>
<p><a href="../location/">Location and delivery</a> · <a href="../catalogue/">Catalogue</a></p></div></section>
<section class="close-band"><div class="container"><h2>Questions about a part?</h2><p>WhatsApp 0718 515 142, or email {EMAIL}.</p><a class="button" href="{WA}">Get in Touch</a></div></section>'''
    html = re.sub(r'<main id="content"[\s\S]*?</main>', '<main id="content">' + body + '</main>', html, count=1)
    path.write_text(html)
    print("about")


def rewrite_contact():
    path = ROOT / "contact/index.html"
    html = path.read_text()
    form = re.search(r'<form class="contact-form"[\s\S]*?</form>\s*<p class="form-result"[\s\S]*?</p>', html)
    form_html = form.group(0) if form else ""
    body = f'''<section class="page-hero"><div class="container"><p class="crumbs"><a href="../">Home</a> / Contact</p><h1>Contact the shop</h1>
<p>Ask about a size, a colour or a quantity. The shop replies on WhatsApp, by phone or by email.</p></div></section>
<section class="band"><div class="container contact-blocks">
<article><h2>Telephone</h2><p><a href="tel:+254718515142">0718 515 142</a></p><p>Call during shop hours for sizes, stock and directions.</p></article>
<article><h2>WhatsApp</h2><p><a class="button" href="{WA}">Get in Touch</a></p><p>The message starts with a short note you can edit.</p></article>
<article><h2>Email</h2><p><a href="mailto:{EMAIL}">{EMAIL}</a></p><p>For trade enquiries and written quotes.</p></article>
<article><h2>Address</h2><p>Omuwenga Suppliers<br>Gikomba Market, Nairobi, Kenya</p><p>Monday to Saturday, 8:00am–6:00pm. Call or WhatsApp when you are nearby and we will guide you to the stall.</p></article>
</div></section>
<section class="band" id="find"><div class="container"><h2>Find the stall</h2>
<p>Omuwenga Suppliers is in Gikomba Market, Nairobi. Open Monday to Saturday, 8:00am–6:00pm. Call or WhatsApp 0718 515 142 before you travel and the shop will direct you.</p>
<div class="map-embed"><iframe title="Map showing Gikomba Market in Nairobi" src="https://www.google.com/maps?q=Gikomba%20Market%20Nairobi&amp;output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
<div class="contact-grid"><div>{form_html}</div></div>
</div></section>
<section class="close-band"><div class="container"><h2>Questions about a part?</h2><p>Send the name, the size and a photo.</p><a class="button" href="{WA}">Get in Touch</a></div></section>'''
    html = re.sub(r'<main id="content"[\s\S]*?</main>', '<main id="content">' + body + '</main>', html, count=1)
    path.write_text(html)
    print("contact", bool(form_html))


if __name__ == "__main__":
    main()
    rewrite_home()
    rewrite_about()
    rewrite_contact()
