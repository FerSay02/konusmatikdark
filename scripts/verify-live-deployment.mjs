import assert from 'node:assert/strict';
import { seoPages } from '../content/seo-pages.mjs';
import { sitemapXml } from './seo-content.mjs';

const originArg = process.argv.indexOf('--origin');
const origin = (originArg < 0 ? 'https://konusmatik.com' : process.argv[originArg + 1])?.replace(/\/$/, '');
if (!origin || !/^https?:\/\//.test(origin)) throw new Error('Usage: node scripts/verify-live-deployment.mjs [--origin https://host]');

const failures = [];
const checked = [];
const base = 'https://konusmatik.com';
const fetchPage = async (pathname, redirect = 'follow') => {
  const response = await fetch(new URL(pathname, origin), { redirect, headers: { 'user-agent': 'Konusmatik-Deployment-Verification/1.0' } });
  return { response, body: await response.text() };
};
const check = (label, condition, detail = '') => {
  if (!condition) failures.push(`${label}${detail ? `: ${detail}` : ''}`);
};
const metadata = (html) => ({
  title: html.match(/<title>([^<]+)<\/title>/i)?.[1],
  description: html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1],
  canonical: html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1],
});
const cleanText = (html) => html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const uniqueTitles = new Set();
const uniqueDescriptions = new Set();

async function checkHtml(pathname, expectedTitle, expectedH1, minimumText = 250, legalHold = false) {
  const { response, body } = await fetchPage(pathname);
  const tag = pathname || '/';
  checked.push({ url: tag, status: response.status });
  check(`${tag} HTTP`, response.status === 200, `${response.status}`);
  check(`${tag} content-type`, /text\/html/i.test(response.headers.get('content-type') || ''));
  check(`${tag} raw HTML`, !body.includes('<div id="root"></div>') && !body.includes('/@vite/client'));
  const noindex = /noindex/i.test(response.headers.get('x-robots-tag') || '') || /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(body);
  check(`${tag} robots policy`, legalHold ? noindex : !noindex);
  if (legalHold) {
    const approvalPending = pathname === '/cerez-politikasi/'
      ? body.includes('hukuki onay bekleyen bir taslaktır')
      : body.includes('hukuki inceleme sonrasında yayımlanacaktır');
    check(`${tag} legal approval pending`, approvalPending && !body.includes('TODO'));
  }
  const { title, description, canonical } = metadata(body);
  check(`${tag} title`, Boolean(title) && (!expectedTitle || title === expectedTitle));
  check(`${tag} description`, Boolean(description) && description.length >= 40);
  check(`${tag} unique title`, !uniqueTitles.has(title));
  check(`${tag} unique description`, !uniqueDescriptions.has(description));
  uniqueTitles.add(title);
  uniqueDescriptions.add(description);
  check(`${tag} canonical`, canonical === `${base}${pathname}`);
  check(`${tag} one H1`, (body.match(/<h1\b/gi) || []).length === 1 && (!expectedH1 || body.includes(`<h1>${expectedH1}</h1>`)));
  check(`${tag} H2`, /<h2\b/i.test(body));
  check(`${tag} readable copy`, cleanText(body).length >= minimumText);
  check(`${tag} internal link`, /href="\/(?:rehber|cozumler|kurumsal|seslendirme|desifre)/i.test(body));
  const schemas = [...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  check(`${tag} JSON-LD`, schemas.length > 0 && schemas.every((match) => { try { JSON.parse(match[1]); return true; } catch { return false; } }));
  return { body, response };
}

try {
  const sitemap = await fetchPage('/sitemap.xml');
  checked.push({ url: '/sitemap.xml', status: sitemap.response.status });
  check('sitemap HTTP', sitemap.response.status === 200);
  const sitemapUrls = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedUrls = [...sitemapXml().matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  check('sitemap URL count', sitemapUrls.length === expectedUrls.length, `expected ${expectedUrls.length}, received ${sitemapUrls.length}`);
  check('sitemap URL set', expectedUrls.every((url) => sitemapUrls.includes(url)) && sitemapUrls.every((url) => expectedUrls.includes(url)));
  const robots = await fetchPage('/robots.txt');
  checked.push({ url: '/robots.txt', status: robots.response.status });
  check('robots HTTP', robots.response.status === 200);
  check('robots sitemap declaration', robots.body.includes(`Sitemap: ${base}/sitemap.xml`));
  const home = await checkHtml('/', undefined, undefined, 500);
  const corporate = await checkHtml('/kurumsal', undefined, undefined, 500);
  check('corporate sitemap', sitemapUrls.includes(`${base}/kurumsal`));
  check('corporate ecosystem', ['DOCULYSIS', 'DEEPPOINT', 'CLEAR VOICE'].every((name) => corporate.body.includes(name)));
  for (const route of ['/gizlilik-politikasi/', '/kullanim-kosullari/', '/kvkk-aydinlatma-metni/', '/cerez-politikasi/']) {
    await checkHtml(route, undefined, undefined, 300, true);
    check(`${route} omitted from sitemap during HOLD`, !sitemapUrls.includes(`${base}${route}`));
  }
  for (const page of seoPages) {
    const route = `/${page.section}/${page.slug}/`;
    const { body } = await checkHtml(route, page.title, page.h1, 900);
    check(`${route} sitemap`, sitemapUrls.includes(`${base}${route}`));
    check(`${route} article H2`, body.includes(`<h2>${page.sections[0].h2}</h2>`));
  }
  for (const [source, target] of [
    ['/kurumsal/', '/kurumsal'],
    [`/${seoPages[0].section}/${seoPages[0].slug}`, `/${seoPages[0].section}/${seoPages[0].slug}/`],
    ['/fiyatlar', '/'],
    ['/fiyatlar/', '/'],
    ['/checkout', '/'],
    ['/checkout/', '/'],
  ]) {
    const { response } = await fetchPage(source, 'manual');
    checked.push({ url: source, status: response.status });
    check(`${source} redirect`, [301, 308].includes(response.status) && new URL(response.headers.get('location') || '', origin).pathname === target, `${response.status} ${response.headers.get('location') || ''}`);
  }
  for (const route of ['/rehber/bilinmeyen-seo-sayfasi/', '/cozumler/bilinmeyen-seo-sayfasi/']) {
    const { response } = await fetchPage(route);
    checked.push({ url: route, status: response.status });
    check(`${route} 404`, response.status === 404, `${response.status}`);
  }
  const assets = new Set([...home.body.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)].map((match) => match[1]));
  assets.add('/seo-content.css');
  check('hashed CSS and JS references', [...assets].some((asset) => asset.endsWith('.js')) && [...assets].some((asset) => asset.endsWith('.css')));
  for (const asset of assets) {
    const { response } = await fetchPage(asset);
    checked.push({ url: asset, status: response.status });
    check(`${asset} HTTP`, response.status === 200);
    check(`${asset} MIME`, asset.endsWith('.css') ? /text\/css/i.test(response.headers.get('content-type') || '') : /(?:javascript|ecmascript)/i.test(response.headers.get('content-type') || ''));
  }
  for (const route of ['/seslendirme', '/desifre']) {
    const { response, body } = await fetchPage(route);
    checked.push({ url: route, status: response.status });
    check(`${route} app shell`, response.status === 200 && body.includes('<div id="root">') && /<h1\b/i.test(body));
    check(`${route} canonical`, metadata(body).canonical === `${base}${route}`);
  }
} catch (error) {
  failures.push(`Request failure: ${error.message}`);
}

console.log(JSON.stringify({ origin, result: failures.length ? 'FAIL' : 'PASS', checked, failures, note: 'TTS/ASR route HTML and assets checked. Authenticated synthesis/transcription needs credentialed functional smoke testing.' }, null, 2));
if (failures.length) process.exitCode = 1;
