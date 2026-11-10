import fs from 'node:fs';
import path from 'node:path';
import { seoPages } from '../content/seo-pages.mjs';
import { corporatePhoneE164 } from '../src/data/companyContact.js';

const siteUrl = 'https://konusmatik.com';
const sections = {
  rehber: { title: 'Rehber', description: 'Türkçe seslendirme, deşifre ve ses teknolojileri için uygulanabilir rehberler.', intro: 'Metinden sese ve sesten metne iş akışlarını hazırlama, kontrol etme ve doğru yerde kullanma üzerine pratik yazılar.' },
  cozumler: { title: 'Çözümler', description: 'Konuşmatik seslendirme ve deşifre kullanım alanlarını, kurumsal senaryoları ve ilgili ürün akışlarını inceleyin.', intro: 'Seslendirme ve konuşma tanımayı gerçek iş ihtiyaçlarına bağlayan kullanım senaryoları.' },
};
// Unapproved legal drafts remain reachable but are not submitted for indexing.
const appPaths = ['/', '/seslendirme', '/desifre', '/kurumsal', '/api-dokumantasyon', '/iletisim'];
const privateAppPaths = ['/giris', '/profile', '/admin', '/payment/success', '/payment/fail'];
const legalPaths = new Set(['/gizlilik-politikasi', '/kullanim-kosullari', '/kvkk-aydinlatma-metni', '/cerez-politikasi']);
const contentPaths = new Set(['/rehber', '/cozumler', ...seoPages.map((page) => `/${page.section}/${page.slug}`)]);
const validPaths = new Set([...appPaths, ...legalPaths, ...contentPaths]);

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const canonicalPath = (value) => (contentPaths.has(value) || legalPaths.has(value)) ? `${value}/` : value;
const jsonLd = (value) => JSON.stringify(value).replace(/</g, '\\u003c');
const inline = (value) => escapeHtml(value).replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, (_match, label, href) => `<a href="${escapeHtml(canonicalPath(href))}">${label}</a>`);
const headingId = (index) => `bolum-${index + 1}`;

function validate() {
  if (new Set(seoPages.map((page) => `/${page.section}/${page.slug}`)).size !== seoPages.length) throw new Error('Duplicate SEO route');
  if (new Set(seoPages.map((page) => page.title)).size !== seoPages.length) throw new Error('Duplicate SEO title');
  if (new Set(seoPages.map((page) => page.description)).size !== seoPages.length) throw new Error('Duplicate SEO description');
  for (const page of seoPages) {
    if (!sections[page.section] || !/^[a-z0-9-]+$/.test(page.slug)) throw new Error(`Invalid route: ${page.slug}`);
    for (const field of ['title', 'description', 'keyword', 'h1', 'intro', 'example', 'cta']) if (!page[field]) throw new Error(`Missing ${field}: ${page.slug}`);
    if (!Array.isArray(page.terms) || page.terms.length < 2 || !Array.isArray(page.sections) || page.sections.length < 2) throw new Error(`Thin structure: ${page.slug}`);
    const copy = [page.intro, ...page.sections.flatMap((section) => [section.h2, ...(section.paragraphs || [])])].join(' ');
    for (const [, href] of copy.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g)) if (!validPaths.has(href)) throw new Error(`Broken link ${href} in ${page.slug}`);
    if (!validPaths.has(page.cta.href)) throw new Error(`Broken CTA in ${page.slug}`);
  }
}

function layout({ title, description, pathname, type, body, breadcrumbs, schema }) {
  const url = `${siteUrl}${canonicalPath(pathname)}`;
  const image = `${siteUrl}/images/logo-new.png`;
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.label, item: `${siteUrl}${canonicalPath(crumb.href)}` })),
  };
  const organization = { '@context': 'https://schema.org', '@type': 'Organization', name: 'DeepZeka', url: siteUrl, logo: image, telephone: corporatePhoneE164 };
  const schemas = [organization, breadcrumbSchema, schema].filter(Boolean);
  const crumbHtml = breadcrumbs.map((crumb, index) => index === breadcrumbs.length - 1 ? `<span aria-current="page">${escapeHtml(crumb.label)}</span>` : `<a href="${escapeHtml(canonicalPath(crumb.href))}">${escapeHtml(crumb.label)}</a>`).join('<span aria-hidden="true">/</span>');
  return `<!doctype html>
<html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index, follow">
<link rel="canonical" href="${url}"><link rel="icon" type="image/png" href="/images/logo-new.png">
<meta property="og:site_name" content="Konuşmatik"><meta property="og:type" content="${type}"><meta property="og:locale" content="tr_TR">
<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${image}">
<link rel="stylesheet" href="/seo-content.css">
<script>(()=>{try{const saved=localStorage.getItem('konusmatik-theme');document.documentElement.dataset.theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark')}catch{document.documentElement.dataset.theme='dark'}})()</script>
${schemas.map((entry) => `<script type="application/ld+json">${jsonLd(entry)}</script>`).join('\n')}
</head><body>
<a class="skip-link" href="#main">İçeriğe geç</a>
<header class="seo-header"><div class="seo-header-inner"><a class="seo-brand" href="/" aria-label="Konuşmatik ana sayfa"><img src="/images/logo-new.png" width="58" height="58" alt=""><span>Konuşmatik</span></a><nav aria-label="Ana gezinme"><a href="/seslendirme">Seslendirme</a><a href="/desifre">Deşifre</a><a href="/kurumsal">Kurumsal</a></nav></div></header>
<main id="main" class="seo-main"><nav class="breadcrumbs" aria-label="İçerik yolu">${crumbHtml}</nav>${body}</main>
  <footer class="seo-footer"><div><a class="seo-footer-brand" href="/">Konuşmatik</a><p>Türkçe seslendirme ve deşifre için bilgi ve ürün akışları.</p></div><nav aria-label="Alt gezinme"><a href="/rehber/">Rehber</a><a href="/cozumler/">Çözümler</a><a href="/seslendirme">Seslendirme</a><a href="/desifre">Deşifre</a><a href="/api-dokumantasyon">API Dokümantasyonu</a><a href="/iletisim">İletişim</a></nav></footer>
</body></html>`;
}

function renderHub(section) {
  const config = sections[section];
  const pages = seoPages.filter((page) => page.section === section);
  const body = `<section class="seo-hero"><p class="eyebrow">Konuşmatik / ${config.title}</p><h1>${config.title}</h1><p class="lead">${config.intro}</p></section><section aria-label="${config.title} içerikleri" class="seo-grid">${pages.map((page) => `<article class="seo-card"><span>${section === 'rehber' ? 'Rehber' : 'Kullanım alanı'}</span><h2><a href="/${section}/${page.slug}/">${escapeHtml(page.h1)}</a></h2><p>${escapeHtml(page.description)}</p><a class="card-more" href="/${section}/${page.slug}/">İçeriği oku <span aria-hidden="true">→</span></a></article>`).join('')}</section><p class="seo-hub-switch">${section === 'rehber' ? '<a href="/cozumler/">Ürün kullanım alanlarını inceleyin →</a>' : '<a href="/rehber/">Pratik rehberleri inceleyin →</a>'}</p>`;
  return layout({ title: `${config.title} | Konuşmatik`, description: config.description, pathname: `/${section}`, type: 'website', body, breadcrumbs: [{ label: 'Ana Sayfa', href: '/' }, { label: config.title, href: `/${section}` }], schema: { '@context': 'https://schema.org', '@type': 'CollectionPage', name: config.title, url: `${siteUrl}/${section}/`, description: config.description } });
}

function renderPage(page) {
  const pathname = `/${page.section}/${page.slug}`;
  const toc = `${page.sections.map((section, index) => `<li><a href="#${headingId(index)}">${escapeHtml(section.h2)}</a></li>`).join('')}<li><a href="#uygulama-ornegi">Uygulama örneği</a></li>${page.faq?.length ? '<li><a href="#sikca-sorulan-sorular">Sıkça sorulan sorular</a></li>' : ''}`;
  const article = `${page.sections.map((section, index) => `<section id="${headingId(index)}"><h2>${escapeHtml(section.h2)}</h2>${section.paragraphs.map((paragraph) => `<p>${inline(paragraph)}</p>`).join('')}</section>`).join('')}<section id="uygulama-ornegi"><h2>Uygulama örneği</h2><p>${escapeHtml(page.example)}</p></section>${page.faq?.length ? `<section id="sikca-sorulan-sorular"><h2>Sıkça sorulan sorular</h2>${page.faq.map((item) => `<h3>${escapeHtml(item.question)}</h3><p>${escapeHtml(item.answer)}</p>`).join('')}</section>` : ''}`;
  const mentionedPaths = new Set(page.sections.flatMap((section) => section.paragraphs).join(' ').match(/\]\((\/[^)]+)\)/g)?.map((match) => match.slice(2, -1)) || []);
  const related = [
    ...seoPages.filter((candidate) => candidate !== page && mentionedPaths.has(`/${candidate.section}/${candidate.slug}`)),
    ...seoPages.filter((candidate) => candidate !== page && candidate.section === page.section && !mentionedPaths.has(`/${candidate.section}/${candidate.slug}`)),
  ].slice(0, 3);
  const sample = page.audioSample ? `<section class="seo-audio-sample" aria-label="Ses örneği"><h2>Türkçe ses örneği</h2><p>${escapeHtml(page.audioSample.label)}</p><audio controls preload="none" aria-label="${escapeHtml(page.audioSample.label)}"><source src="${escapeHtml(page.audioSample.src)}" type="audio/wav">Tarayıcınız ses oynatmayı desteklemiyor.</audio></section>` : '';
  const body = `<div class="seo-article-layout"><article class="seo-article"><header class="seo-hero"><p class="eyebrow">${page.section === 'rehber' ? 'Rehber' : 'Çözüm'} · ${escapeHtml(page.keyword)}</p><h1>${escapeHtml(page.h1)}</h1><p class="lead">${escapeHtml(page.intro)}</p></header>${sample}<div class="seo-mobile-toc"><h2>Bu sayfada</h2><ol>${toc}</ol></div><div class="seo-prose">${article}</div><div class="seo-cta"><h2>Sonraki adım</h2><p>İhtiyacınıza uygun ürün akışını inceleyin; çıktıyı kullanmadan önce kendi bağlamınızda kontrol edin.</p><a href="${escapeHtml(canonicalPath(page.cta.href))}">${escapeHtml(page.cta.label)} <span aria-hidden="true">→</span></a></div><section class="seo-related"><h2>İlgili içerikler</h2><ul>${related.map((candidate) => `<li><a href="/${candidate.section}/${candidate.slug}/">${escapeHtml(candidate.h1)}</a></li>`).join('')}</ul></section></article><aside class="seo-sidebar"><div class="seo-toc"><h2>Bu sayfada</h2><ol>${toc}</ol></div><a href="/${page.section}/">Tüm ${page.section === 'rehber' ? 'rehberler' : 'çözümler'} →</a></aside></div>`;
  const schema = page.section === 'rehber'
    ? { '@context': 'https://schema.org', '@type': 'Article', headline: page.h1, description: page.description, inLanguage: 'tr-TR', mainEntityOfPage: `${siteUrl}${pathname}/`, author: { '@type': 'Organization', name: 'DeepZeka' }, publisher: { '@type': 'Organization', name: 'DeepZeka', logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo-new.png` } } }
    : { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'Konuşmatik', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: siteUrl, description: page.description, publisher: { '@type': 'Organization', name: 'DeepZeka' } };
  return layout({ title: page.title, description: page.description, pathname, type: page.section === 'rehber' ? 'article' : 'website', body, breadcrumbs: [{ label: 'Ana Sayfa', href: '/' }, { label: sections[page.section].title, href: `/${page.section}` }, { label: page.h1, href: pathname }], schema });
}

export function renderSeoRoute(urlPath) {
  const normalized = urlPath.replace(/\/$/, '') || '/';
  if (sections[normalized.slice(1)]) return renderHub(normalized.slice(1));
  const page = seoPages.find((item) => `/${item.section}/${item.slug}` === normalized);
  return page ? renderPage(page) : null;
}

export function sitemapXml() {
  const urls = [...appPaths, ...[...contentPaths].sort()].map((pathname) => `<url><loc>${siteUrl}${canonicalPath(pathname)}</loc></url>`).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>\n`;
}

export function generateSeoPages(outDir) {
  validate();
  for (const pathname of contentPaths) {
    const target = path.join(outDir, pathname.slice(1), 'index.html');
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, renderSeoRoute(pathname), 'utf8');
  }
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml(), 'utf8');
}

export function seoContentPlugin() {
  const rejectUnknownSeoPath = (req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if ((pathname.startsWith('/rehber/') || pathname.startsWith('/cozumler/')) && !contentPaths.has(pathname.replace(/\/$/, ''))) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Sayfa bulunamadı');
      return;
    }
    next();
  };
  const redirectCanonical = (req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (contentPaths.has(pathname) || legalPaths.has(pathname)) {
      res.statusCode = 308;
      res.setHeader('Location', `${pathname}/${new URL(req.url, 'http://localhost').search}`);
      res.end();
      return;
    }
    next();
  };
  const rejectUnknownDocumentPath = (req, res, next) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const normalized = pathname.replace(/\/$/, '') || '/';
    if (normalized === '/' || validPaths.has(normalized) || privateAppPaths.includes(normalized) || normalized.startsWith('/api/') || normalized === '/api' || normalized.startsWith('/@') || normalized.startsWith('/__vite') || normalized.startsWith('/src/') || normalized.startsWith('/node_modules/') || /\.[^/]+$/.test(normalized)) return next();
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Sayfa bulunamadı');
  };
  return {
    name: 'konusmatik-seo-content',
    configureServer(server) {
      server.middlewares.use(redirectCanonical);
      server.middlewares.use(rejectUnknownSeoPath);
      server.middlewares.use(rejectUnknownDocumentPath);
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        const html = renderSeoRoute(pathname);
        if (!html) return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(html);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirectCanonical);
      server.middlewares.use(rejectUnknownSeoPath);
      server.middlewares.use(rejectUnknownDocumentPath);
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url, 'http://localhost').pathname;
        const appRoute = [...appPaths.slice(1), ...legalPaths, ...privateAppPaths].find((route) => route === pathname || `${route}/` === pathname);
        if (!appRoute) return next();
        if (pathname.endsWith('/') && !legalPaths.has(appRoute)) {
          res.statusCode = 308;
          res.setHeader('Location', appRoute);
          res.end();
          return;
        }
        const target = path.resolve('dist', appRoute.slice(1), 'index.html');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(fs.readFileSync(target));
      });
    },
    writeBundle(options) { generateSeoPages(options.dir || path.resolve('dist')); },
  };
}
