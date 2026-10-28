import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seoPages } from '../content/seo-pages.mjs';
import { sitemapXml } from './seo-content.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');
const target = path.join(projectRoot, 'docs', 'litespeed-dist-manifest.txt');
const excluded = new Set(['seo-validation-report.json']);

function filesIn(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relative = [prefix, entry.name].filter(Boolean).join('/');
    return entry.isDirectory() ? filesIn(path.join(directory, entry.name), relative) : [relative];
  });
}

if (!fs.existsSync(distRoot)) throw new Error('dist/ is missing; run npm run build first');
const files = filesIn(distRoot).filter((item) => !excluded.has(item)).sort();
const fileSet = new Set(files);
const required = [
  '.htaccess', 'index.html', 'robots.txt', 'sitemap.xml', 'seo-content.css',
  'kurumsal/index.html', 'gizlilik-politikasi/index.html',
  'kullanim-kosullari/index.html', 'kvkk-aydinlatma-metni/index.html', 'cerez-politikasi/index.html',
  ...seoPages.map((page) => `${page.section}/${page.slug}/index.html`),
];
for (const file of required) if (!fileSet.has(file)) throw new Error(`Missing deployment file: ${file}`);
for (const file of ['gizlilik-politikasi/index.html', 'kullanim-kosullari/index.html', 'kvkk-aydinlatma-metni/index.html', 'cerez-politikasi/index.html']) {
  const html = fs.readFileSync(path.join(distRoot, file), 'utf8');
  const approvalPending = file === 'cerez-politikasi/index.html'
    ? html.includes('hukuki onay bekleyen bir taslaktır')
    : html.includes('hukuki inceleme sonrasında yayımlanacaktır');
  if (!approvalPending || !html.includes('content="noindex, nofollow"') || html.includes('TODO')) {
    throw new Error(`Legal HOLD policy missing or editorial TODO exposed: ${file}`);
  }
}
if (!files.some((file) => /^assets\/[^/]+\.js$/.test(file))) throw new Error('Missing built JavaScript asset');
if (!files.some((file) => /^assets\/[^/]+\.css$/.test(file))) throw new Error('Missing built CSS asset');
const liveSitemap = fs.readFileSync(path.join(distRoot, 'sitemap.xml'), 'utf8');
if (liveSitemap !== sitemapXml()) throw new Error('Built sitemap does not match route source');
const sitemapCount = [...liveSitemap.matchAll(/<loc>/g)].length;
fs.writeFileSync(target, `${files.join('\n')}\n`, 'utf8');
console.log(`Deployment manifest: ${files.length} files, ${sitemapCount} sitemap URLs, ${seoPages.length} SEO pages. Root: dist/ contents, including .htaccess.`);
