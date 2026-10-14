/** Careers pages: one active vacancy, email applications, no form or backend. */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { activeVacancies, vacancies } from '../assets/js/vacancies.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === '.git') return [];
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

function norm(value) {
  return value
    .replace(/&rsquo;|&#8217;|&apos;|&#39;|\u2019/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

const job = vacancies.find((item) => item.slug === 'sales-representative');

test('the only active vacancy is Sales Representative', () => {
  assert.ok(job);
  assert.equal(job.status, 'active');
  assert.deepEqual(activeVacancies().map((item) => item.slug), ['sales-representative']);
  assert.equal(vacancies.filter((item) => item.status === 'active').length, 1);
});

test('sales representative fields match the approved copy', () => {
  assert.equal(job.title, 'Sales Representative');
  assert.equal(job.department, 'Sales & Business Development');
  assert.equal(job.employmentType, 'Full-time');
  assert.equal(job.workArrangement, 'Field-based');
  assert.equal(job.location, 'Nairobi, Kenya / assigned sales territory');
  assert.equal(
    job.summary,
    'We are looking for a proactive, confident and results-oriented Sales Representative to help us grow our customer base, develop business relationships and expand our reach in the furniture fittings and upholstery supplies market.',
  );
  assert.deepEqual(job.about, [
    'Omuwenga Suppliers is a furniture fittings and upholstery supplies business based in Gikomba, Nairobi. We serve furniture makers, upholsterers, carpenters, workshops, manufacturers, retailers, resellers and wholesalers with furniture fittings and accessories.',
    'We are looking for a proactive, confident and results-oriented Sales Representative to help us grow our customer base, strengthen customer relationships and expand our market reach.',
  ]);
  assert.deepEqual(job.responsibilities, [
    'Identify and approach potential customers, including furniture workshops, manufacturers, upholsterers, retailers and resellers.',
    "Conduct field visits to introduce the company's products and develop new business relationships.",
    'Understand customer needs and recommend relevant products.',
    'Build and maintain strong relationships with new and existing customers.',
    'Follow up on enquiries, negotiate with customers and convert sales opportunities.',
    'Generate repeat business through consistent customer engagement.',
    'Identify new markets and business development opportunities within the assigned territory.',
    'Gather customer feedback and monitor competitor activity.',
    'Prepare regular sales activity reports.',
    'Coordinate with the internal team to support customer enquiries and order fulfilment.',
  ]);
  assert.deepEqual(job.requirements, [
    'Strong communication and interpersonal skills.',
    'Confidence in approaching customers and presenting products.',
    'Good persuasion, negotiation and relationship-building skills.',
    'A proactive, self-motivated and results-oriented attitude.',
    'Willingness to work in the field and visit customers.',
    'Good organisation, follow-up and reporting skills.',
    'Basic smartphone and digital communication skills.',
    'Honesty, professionalism and a customer-focused mindset.',
  ]);
  assert.deepEqual(job.requirementNotes, [
    'Previous experience in field sales, business development, retail sales or selling to furniture makers, hardware businesses, workshops or retailers will be an advantage.',
    'An interest in learning about furniture fittings and upholstery products is important.',
  ]);
  assert.equal(
    job.offer,
    "An opportunity to contribute to the growth of a business serving Kenya's furniture-making and upholstery industry, develop customer relationships and explore new market opportunities.",
  );
  assert.equal(job.apply.email, 'omegaomegageneralsuppliers@gmail.com');
  assert.equal(job.apply.subject, 'Application \u2013 Sales Representative');
  assert.equal(job.apply.intro, 'Interested candidates should send their updated CV and a brief application letter to:');
  assert.equal(
    job.apply.include,
    'Please include your full name, phone number, relevant sales experience and a short explanation of why you are suitable for the role.',
  );
  assert.equal(job.apply.only, 'Only applications sent to the email address above will be considered.');
  assert.equal(JSON.stringify(job).includes('salary'), false);
  assert.equal(JSON.stringify(job).includes('commission'), false);
});

test('the job page shows the approved description and email instructions', () => {
  const html = norm(read('careers/sales-representative/index.html').replace(/<wbr>/g, ''));
  assert.match(html, /data-slug="sales-representative"/);
  for (const line of [
    ...job.about,
    ...job.responsibilities,
    ...job.requirements,
    ...job.requirementNotes,
    job.offer,
    job.apply.intro,
    job.apply.include,
    job.apply.only,
    `Email subject: ${job.apply.subject}`,
  ]) {
    assert.ok(html.includes(line), line);
  }
  assert.equal(html.includes(job.apply.email), true);
  assert.match(html, /How to Apply/);
  assert.doesNotMatch(html, /<form/i);
  assert.doesNotMatch(html, /type="file"/i);
});

test('the careers listing introduces the open role', () => {
  const html = norm(read('careers/index.html'));
  assert.match(html, /<h1>Careers at Omuwenga Suppliers<\/h1>/);
  assert.ok(html.includes("Looking to grow your career in sales? Join Omuwenga Suppliers and become part of a business serving Kenya's furniture-making and upholstery industry. Explore our current opportunity and find out how to apply."));
  assert.ok(html.includes(job.summary));
  assert.ok(html.includes('View Job Details'));
  assert.ok(html.includes('sales-representative/'));
  assert.doesNotMatch(html, /<form/i);
  assert.doesNotMatch(html, /type="file"/i);
});

test('every page uses the same main navigation', () => {
  const pages = htmlFiles(root);
  assert.ok(pages.length >= 16);
  const expected = ['Products', 'Trade', 'About', 'Location', 'Guides', 'Blog', 'FAQ', 'Careers', 'Contact'];
  for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    const header = html.match(/<header class="site-header">[\s\S]*?<\/header>/);
    assert.ok(header, path.relative(root, file));
    const nav = header[0].match(/<nav class="main-nav"[\s\S]*?<\/nav>/);
    assert.ok(nav, path.relative(root, file));
    assert.deepEqual([...nav[0].matchAll(/>([^<]+)<\/a>/g)].map((match) => match[1]), expected);
    assert.match(header[0], /class="button button-small header-whatsapp"/);
  }
});

test('sitemap includes the careers URLs', () => {
  const xml = read('sitemap.xml');
  assert.match(xml, /<loc>https:\/\/example\.co\.ke\/careers\/<\/loc>/);
  assert.match(xml, /<loc>https:\/\/example\.co\.ke\/careers\/sales-representative\/<\/loc>/);
});
