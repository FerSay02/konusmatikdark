import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';
import { corporatePhoneE164 } from '../src/data/companyContact.js';

const outDir = path.resolve('dist');
const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
const storage = { getItem: () => null, setItem: () => {} };

// Rendering existing React pages at build time keeps their first HTML response
// crawlable without changing their client-side routing or interactive behavior.
globalThis.localStorage = storage;
globalThis.sessionStorage = storage;
globalThis.window = {
  location: { pathname: '/', search: '' },
  localStorage: storage,
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
};
globalThis.document = { documentElement: { dataset: { theme: 'dark' } }, querySelectorAll: () => [] };

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });

try {
  const { default: App } = await server.ssrLoadModule('/src/App.jsx');
  const { pageRoutes, getSeoForPage } = await server.ssrLoadModule('/src/seo.js');
  const { corporateSchemas } = await server.ssrLoadModule('/src/data/corporateProducts.js');
  for (const [page, pathname] of Object.entries(pageRoutes)) {
    window.location.pathname = pathname;
    const seo = getSeoForPage(page);
    const legalPage = ['privacy', 'terms', 'kvkk', 'cookies'].includes(page);
    const markup = seo.noindex && !legalPage ? '' : renderToString(React.createElement(App));
    const organization = { '@context': 'https://schema.org', '@type': 'Organization', name: 'DeepZeka', url: 'https://konusmatik.com', logo: 'https://konusmatik.com/images/logo-new.png', telephone: corporatePhoneE164 };
    const application = { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Konuşmatik', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: 'https://konusmatik.com', description: seo.description, publisher: { '@type': 'Organization', name: 'DeepZeka' } };
    const tags = `<link rel="canonical" href="${escapeHtml(seo.canonical)}">
<meta property="og:title" content="${escapeHtml(seo.title)}"><meta property="og:description" content="${escapeHtml(seo.description)}"><meta property="og:url" content="${escapeHtml(seo.canonical)}">
<meta name="twitter:title" content="${escapeHtml(seo.title)}"><meta name="twitter:description" content="${escapeHtml(seo.description)}"><meta name="twitter:image" content="${escapeHtml(seo.image)}">
<script id="organization-jsonld" type="application/ld+json">${jsonLd(organization)}</script>
${seo.noindex || ['contact', 'privacy', 'terms', 'kvkk', 'cookies'].includes(page) ? '' : `<script id="software-jsonld" type="application/ld+json">${jsonLd(application)}</script>`}
${page === 'corporate' ? corporateSchemas(seo).map((schema, index) => `<script id="corporate-${index}-jsonld" type="application/ld+json">${jsonLd(schema)}</script>`).join('\n') : ''}`;
    const html = template
      .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(seo.title)}</title>`)
      .replace(/<meta\s+name="description"\s+content="[\s\S]*?"\s*\/>/, `<meta name="description" content="${escapeHtml(seo.description)}" />`)
      .replace(/<meta name="robots" content="[^"]+" \/>/, `<meta name="robots" content="${seo.noindex ? 'noindex, nofollow' : 'index, follow'}" />`)
      .replace('<meta property="og:image" content="/images/logo-new.png" />', `<meta property="og:image" content="${escapeHtml(seo.image)}" />`)
      .replace('</head>', `${tags}\n  </head>`)
      .replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
    const target = pathname === '/' ? path.join(outDir, 'index.html') : path.join(outDir, pathname.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, html, 'utf8');
  }
  console.log('Prerendered 11 public app routes and emitted noindex shells for account routes.');
} finally {
  await server.close();
}
