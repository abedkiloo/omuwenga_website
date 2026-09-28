import {
  articleHtml,
  blogPostingJsonLd,
  escapeHtml,
  postCardHtml,
} from '../assets/js/cms-core.mjs';

export const SAFE_SLUG = /^[a-z0-9][a-z0-9_-]*$/i;

export function replaceBetween(source, startMarker, endMarker, content) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(`Markers ${startMarker} / ${endMarker} not found`);
  }
  return source.slice(0, start + startMarker.length) + content + source.slice(end);
}

export function postUrl(siteUrl, slug) {
  return `${siteUrl.replace(/\/+$/, '')}/blog/${encodeURIComponent(slug)}/`;
}

export function renderPostPage(template, post, siteUrl) {
  const url = postUrl(siteUrl, post.slug);
  const title = escapeHtml(`${post.meta_title || post.title} | Omuwenga`);
  const description = escapeHtml(post.meta_description || post.excerpt || '');
  const image = post.cover_image_url || `${siteUrl.replace(/\/+$/, '')}/assets/images/african-sofa-artisan-hero.jpg`;
  const head = [
    '<meta name="robots" content="index,follow,max-image-preview:large">',
    '<meta name="theme-color" content="#075b9d">',
    '<link rel="icon" href="../../assets/images/omuwenga-logo.jpg" type="image/jpeg">',
    '<meta property="og:type" content="article">',
    '<meta property="og:site_name" content="Omuwenga">',
    '<meta property="og:locale" content="en_KE">',
    `<meta property="og:title" content="${escapeHtml(post.meta_title || post.title)}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:url" content="${escapeHtml(url)}">`,
    `<meta property="og:image" content="${escapeHtml(image)}">`,
    post.published_at ? `<meta property="article:published_time" content="${escapeHtml(post.published_at)}">` : '',
    '<meta name="twitter:card" content="summary_large_image">',
    `<script type="application/ld+json">${blogPostingJsonLd(post, url, siteUrl)}</script>`,
  ].join('');

  // Function replacers so "$&"-style sequences in post text are kept literally.
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, () => `<meta name="description" content="${description}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, () => `<link rel="canonical" href="${escapeHtml(url)}">`)
    .replace('<!--post-head-->', () => head)
    .replace('data-blog-post>', () => 'data-blog-post data-prerendered="true">');
  html = replaceBetween(html, '<!--post:start-->', '<!--post:end-->', articleHtml(post));
  return html;
}

export function renderBlogList(posts) {
  return posts.map((p) => postCardHtml(p, `${encodeURIComponent(p.slug)}/`)).join('\n');
}

export function renderSitemapEntries(posts, siteUrl) {
  if (!posts.length) return '\n  ';
  const rows = posts.map((p) => {
    const lastmod = (p.updated_at || p.published_at || '').slice(0, 10);
    return `  <url><loc>${escapeHtml(postUrl(siteUrl, p.slug))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<priority>0.7</priority></url>`;
  });
  return `\n${rows.join('\n')}\n  `;
}
