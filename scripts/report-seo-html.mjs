import fs from 'node:fs';
import path from 'node:path';
import { seoPages } from '../content/seo-pages.mjs';

const out = process.argv[2];
if (!out) throw new Error('Usage: node scripts/report-seo-html.mjs <output.json>');
const rows = seoPages.map((page) => {
  const route = `/${page.section}/${page.slug}/`;
  const html = fs.readFileSync(path.resolve('dist', route.slice(1), 'index.html'), 'utf8');
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
  const visibleText = body.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  const description = html.match(/<meta name="description" content="([^"]+)"/i)?.[1] || '';
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || '';
  const h1 = html.match(/<h1>([^<]+)<\/h1>/i)?.[1] || '';
  const internalLinks = [...body.matchAll(/<a\s+[^>]*href="(\/[^"#?]+)"/g)].map((match) => match[1]);
  return {
    route, keyword: page.keyword, title, description, h1,
    initialHtmlTextLength: visibleText.length,
    internalLinkCount: internalLinks.length,
    canonical,
    canonicalCorrect: canonical === `https://konusmatik.com${route}`,
    structuredDataValid: schemas.some((item) => item['@type'] === 'BreadcrumbList') && schemas.some((item) => item['@type'] === (page.section === 'rehber' ? 'Article' : 'SoftwareApplication')),
    hasDevScripts: html.includes('/@vite/client') || html.includes('/src/main.jsx'),
    emptyContentShell: !h1 || visibleText.length < 800 || html.includes('<div id="root"></div>'),
  };
});
fs.writeFileSync(path.resolve(out), JSON.stringify({ source: 'local production build, not the live domain', pages: rows }, null, 2) + '\n');
console.log(`Recorded raw HTML metrics for ${rows.length} SEO pages in ${out}`);
