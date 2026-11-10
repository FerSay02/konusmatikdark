import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { seoPages } from '../content/seo-pages.mjs';
import { sitemapXml } from './seo-content.mjs';

const root = path.resolve('dist');
const routes = ['/rehber', '/cozumler', ...seoPages.map((page) => `/${page.section}/${page.slug}`)];
const knownRoutes = new Set(['/', '/seslendirme', '/desifre', '/kurumsal', '/api-dokumantasyon', '/iletisim', ...routes]);
const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const robots = fs.readFileSync(path.join(root, 'robots.txt'), 'utf8');
const titles = new Set();
const descriptions = new Set();
const copyFingerprints = new Set();
const pageShingles = [];
const shingles = (value) => {
  const words = value.toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().split(/\s+/);
  return new Set(words.slice(0, -4).map((_, index) => words.slice(index, index + 5).join(' ')));
};

function checkMetadata(html, route) {
  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"\s*\/?\s*>/)?.[1];
  assert.ok(title && description, `${route}: title and description`);
  assert.ok(!titles.has(title), `${route}: unique title`);
  assert.ok(!descriptions.has(description), `${route}: unique description`);
  assert.equal((html.match(/<title>/g) || []).length, 1, `${route}: exactly one title`);
  assert.equal((html.match(/<meta\s+name="description"/g) || []).length, 1, `${route}: exactly one description`);
  assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1, `${route}: exactly one canonical`);
  assert.ok(!html.includes('/@vite/client') && !html.includes('/src/main.jsx'), `${route}: no development scripts`);
  titles.add(title);
  descriptions.add(description);
}

for (const route of routes) {
  const html = fs.readFileSync(path.join(root, route.slice(1), 'index.html'), 'utf8');
  checkMetadata(html, route);
  const url = `https://konusmatik.com${route}/`;
  assert.match(html, /<html lang="tr">/);
  assert.match(html, /<h1>[^<]+<\/h1>/);
  assert.ok(!html.includes('<div id="root"></div>'), `${route}: no empty React shell`);
  assert.ok((html.match(/<p>/g) || []).length >= 5, `${route}: meaningful body paragraphs`);
  assert.equal((html.match(/<h1>/g) || []).length, 1, `${route}: one H1`);
  if (route !== '/rehber' && route !== '/cozumler') assert.ok((html.match(/<h2>/g) || []).length >= 3, `${route}: useful H2 structure`);
  assert.match(html, /<meta name="description" content="[^"]+">/);
  assert.match(html, /<meta name="robots" content="index, follow">/);
  assert.ok(html.includes(`<link rel="canonical" href="${url}">`), `${route}: canonical`);
  assert.ok(html.includes(`<meta property="og:url" content="${url}">`), `${route}: OG URL`);
  assert.ok(html.includes('"@type":"BreadcrumbList"'), `${route}: breadcrumbs schema`);
  assert.ok(sitemap.includes(`<loc>${url}</loc>`), `${route}: sitemap`);
  assert.ok(!robots.split(/\r?\n/).filter((line) => line.startsWith('Disallow: ')).some((line) => route.startsWith(line.slice(10).trim())), `${route}: robots allowed`);
  if (route !== '/rehber' && route !== '/cozumler') {
    const page = seoPages.find((item) => `/${item.section}/${item.slug}` === route);
    if (page.faq?.length) assert.ok((html.match(/<h3>/g) || []).length >= page.faq.length, `${route}: FAQ H3 headings`);
    const fingerprint = [page.intro, ...page.sections.flatMap((section) => section.paragraphs), page.example].join(' ').toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim();
    assert.ok(!copyFingerprints.has(fingerprint), `${route}: duplicate body copy`);
    copyFingerprints.add(fingerprint);
    assert.ok(fingerprint.length > 900, `${route}: substantial unique copy`);
    const currentShingles = shingles(fingerprint);
    for (const [otherRoute, otherShingles] of pageShingles) {
      const shared = [...currentShingles].filter((item) => otherShingles.has(item)).length;
      const overlap = shared / Math.min(currentShingles.size, otherShingles.size);
      assert.ok(overlap < 0.65, `${route}: near-duplicate copy with ${otherRoute} (${overlap.toFixed(2)})`);
    }
    pageShingles.push([route, currentShingles]);
    if (page.audioSample) assert.ok(fs.existsSync(path.join(root, page.audioSample.src.slice(1))), `${route}: audio sample exists`);
  }
  for (const [, href] of html.matchAll(/href="(\/[^"#?]+)"/g)) {
    const normalized = href.replace(/\/$/, '') || '/';
    if (normalized === '/seo-content.css' || normalized.startsWith('/images/')) continue;
    assert.ok(knownRoutes.has(normalized), `${route}: broken link ${href}`);
  }
  if (route.startsWith('/rehber/') && route !== '/rehber') assert.ok(html.includes('"@type":"Article"'), `${route}: Article schema`);
  if (route.startsWith('/cozumler/') && route !== '/cozumler') assert.ok(html.includes('"@type":"SoftwareApplication"'), `${route}: SoftwareApplication schema`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map((match) => JSON.parse(match[1]));
  const organization = schemas.find((item) => item['@type'] === 'Organization');
  const breadcrumbs = schemas.find((item) => item['@type'] === 'BreadcrumbList');
  assert.ok(organization?.name && organization?.url, `${route}: Organization fields`);
  assert.ok(breadcrumbs?.itemListElement?.every((item, index) => item.position === index + 1 && item.name && item.item), `${route}: BreadcrumbList fields`);
  if (route.startsWith('/rehber/') && route !== '/rehber') assert.ok(schemas.some((item) => item['@type'] === 'Article' && item.headline && item.mainEntityOfPage && item.publisher), `${route}: Article fields`);
  if (route.startsWith('/cozumler/') && route !== '/cozumler') assert.ok(schemas.some((item) => item['@type'] === 'SoftwareApplication' && item.name && item.url && item.description), `${route}: SoftwareApplication fields`);
}

assert.equal(sitemap, sitemapXml(), 'sitemap matches current approved indexable routes');
assert.ok(!sitemap.includes('/analiz'), 'remove stale route');
assert.ok(robots.includes('Sitemap: https://konusmatik.com/sitemap.xml'));
const registry = fs.readFileSync(path.resolve('content/keyword-registry.csv'), 'utf8');
const mappedUrls = [...registry.matchAll(/"(https:\/\/konusmatik\.com\/[^"\n]+)"/g)].map((match) => match[1]);
assert.ok(mappedUrls.length >= 100, 'at least 100 keyword candidates');
for (const url of mappedUrls) assert.ok(knownRoutes.has(new URL(url).pathname.replace(/\/$/, '') || '/'), `registry target exists: ${url}`);
assert.equal(new Set(registry.split(/\r?\n/).slice(1).filter(Boolean).map((row) => row.split('","')[0])).size, mappedUrls.length, 'no duplicate keyword phrases');
for (const route of ['/', '/seslendirme', '/desifre', '/kurumsal', '/api-dokumantasyon', '/iletisim', '/gizlilik-politikasi/', '/kullanim-kosullari/', '/kvkk-aydinlatma-metni/', '/cerez-politikasi/']) {
  const target = route === '/' ? path.join(root, 'index.html') : path.join(root, route.slice(1), 'index.html');
  const html = fs.readFileSync(target, 'utf8');
  checkMetadata(html, route);
  assert.equal((html.match(/<h1/g) || []).length, 1, `${route}: prerendered H1`);
  assert.ok(html.includes(`<link rel="canonical" href="https://konusmatik.com${route}">`), `${route}: prerendered canonical`);
  if (route === '/kurumsal') {
    for (const product of [
      ['DOCULYSIS', 'https://doculysis.com/'],
      ['DEEPPOINT', 'https://deeppointai.com/'],
      ['CLEAR VOICE', 'https://clearvoice.com.tr/'],
    ]) {
      assert.ok(html.includes(product[0]), `corporate: ${product[0]} in source`);
      assert.ok(html.includes(`href="${product[1]}"`), `corporate: ${product[0]} destination`);
    }
    assert.ok(html.includes('https://deepzeka.com/'), 'corporate: DeepZeka destination');
    assert.ok(html.includes('target="_blank" rel="noopener noreferrer"'), 'corporate: safe external links');
    assert.ok(html.includes('"@type":"WebPage"'), 'corporate: WebPage schema');
    assert.ok(html.includes('"@type":"ItemList"'), 'corporate: ItemList schema');
    assert.ok(html.includes('Yapay zekâ destekli OCR'), 'corporate: product descriptions in source');
    assert.ok(sitemap.includes('<loc>https://konusmatik.com/kurumsal</loc>'), 'corporate: sitemap');
  }
  if (route === '/') {
    assert.ok(!html.includes('<div id="root"></div>'), 'homepage: prerendered React content');
    for (const href of ['/cozumler/turkce-seslendirme/', '/cozumler/sesten-metne/', '/cozumler/on-premise-tts/']) assert.ok(html.includes(`href="${href}"`), `homepage: semantic link ${href}`);
    assert.ok(html.includes('Türkçe yapay zekâ seslendirme'), 'homepage: meaningful Turkish intro');
  }
  assert.ok(html.includes(`<meta property="og:url" content="https://konusmatik.com${route}">`), `${route}: OG URL`);
  const legalHold = ['/gizlilik-politikasi/', '/kullanim-kosullari/', '/kvkk-aydinlatma-metni/', '/cerez-politikasi/'].includes(route);
  assert.ok(html.includes(legalHold ? 'content="noindex, nofollow"' : 'content="index, follow"'), `${route}: robots policy`);
  if (legalHold) {
    const approvalPending = route === '/cerez-politikasi/'
      ? html.includes('hukuki onay bekleyen bir taslaktır')
      : html.includes('hukuki inceleme sonrasında yayımlanacaktır');
    assert.ok(approvalPending && !html.includes('TODO'), `${route}: review hold without public TODO`);
    assert.ok(!sitemap.includes(`<loc>https://konusmatik.com${route}</loc>`), `${route}: hold omitted from sitemap`);
  }
  assert.ok(html.includes('"@type":"Organization"'), `${route}: organization schema`);
  if (route !== '/iletisim' && !legalHold) assert.ok(html.includes('"@type":"SoftwareApplication"'), `${route}: app schema`);
}
for (const route of ['/giris', '/profile', '/admin', '/payment/success', '/payment/fail']) {
  const html = fs.readFileSync(path.join(root, route.slice(1), 'index.html'), 'utf8');
  assert.ok(html.includes('noindex, nofollow'), `${route}: private noindex`);
}
const report = { status: 'passed', contentRoutes: routes.length, appRoutes: 10, keywordCandidates: mappedUrls.length, checks: ['unique titles and descriptions', 'H1 and H2 structure', 'canonical and OG URL', 'structured data fields', 'internal links and audio samples', 'exact and near-duplicate body copy', 'sitemap coverage', 'robots access', 'keyword mapping'] };
fs.writeFileSync(path.join(root, 'seo-validation-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`SEO verification passed: ${routes.length} content routes, 10 prerendered app routes, ${mappedUrls.length} keyword candidates, metadata, schema, sitemap and links.`);
