#!/usr/bin/env node
/**
 * Pre-render published blog posts into static pages for search engines.
 *
 *   API_BASE=https://pos.example.co.ke SITE_URL=https://example.co.ke node scripts/build-blog.mjs
 *
 * Writes blog/<slug>/index.html, blog/prerendered.json, fills the blog list
 * and refreshes the blog section of sitemap.xml. Re-run after publishing.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiUrl } from '../assets/js/cms-core.mjs';
import {
  SAFE_SLUG,
  renderBlogList,
  renderPostPage,
  renderSitemapEntries,
  replaceBetween,
} from './blog-build-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8000';
const SITE_URL = process.env.SITE_URL || 'https://example.co.ke';

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  return res.json();
}

async function fetchAllPosts() {
  const summaries = [];
  let url = apiUrl(API_BASE, 'blog/', { page_size: 100 });
  while (url) {
    const data = await getJson(url);
    summaries.push(...(data.results || []));
    url = data.next;
  }
  const posts = [];
  for (const s of summaries) {
    if (!SAFE_SLUG.test(s.slug)) {
      console.warn(`Skipping post with unsafe slug: ${s.slug}`);
      continue;
    }
    posts.push(await getJson(apiUrl(API_BASE, `blog/${encodeURIComponent(s.slug)}/`)));
  }
  return posts;
}

async function readPrevious(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8')).slugs || [];
  } catch {
    return [];
  }
}

async function main() {
  const blogDir = path.join(root, 'blog');
  const manifest = path.join(blogDir, 'prerendered.json');
  const posts = await fetchAllPosts();
  const template = await readFile(path.join(blogDir, 'post', 'index.html'), 'utf8');

  for (const post of posts) {
    const dir = path.join(blogDir, post.slug);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), renderPostPage(template, post, SITE_URL));
  }

  const current = new Set(posts.map((p) => p.slug));
  for (const old of await readPrevious(manifest)) {
    if (!current.has(old) && SAFE_SLUG.test(old) && old !== 'post') {
      await rm(path.join(blogDir, old), { recursive: true, force: true });
    }
  }
  await writeFile(manifest, `${JSON.stringify({ slugs: [...current] }, null, 2)}\n`);

  const listFile = path.join(blogDir, 'index.html');
  const list = await readFile(listFile, 'utf8');
  await writeFile(listFile, replaceBetween(list, '<!--blog-list:start-->', '<!--blog-list:end-->', renderBlogList(posts)));

  const sitemapFile = path.join(root, 'sitemap.xml');
  const sitemap = await readFile(sitemapFile, 'utf8');
  await writeFile(sitemapFile, replaceBetween(sitemap, '<!-- blog:start -->', '<!-- blog:end -->', renderSitemapEntries(posts, SITE_URL)));

  console.log(`Pre-rendered ${posts.length} post(s) from ${API_BASE}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
