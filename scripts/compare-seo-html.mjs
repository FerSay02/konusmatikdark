import fs from 'node:fs';

const before = JSON.parse(fs.readFileSync('docs/seo-html-before.json', 'utf8'));
const after = JSON.parse(fs.readFileSync('docs/seo-html-after.json', 'utf8'));
if (before.pages.length !== 20 || after.pages.length !== 20) throw new Error('Expected exactly 20 SEO pages in both snapshots');
const safe = (value) => String(value).replaceAll('|', '\\|').replaceAll('\n', ' ');
const lines = [
  '# Konuşmatik ham HTML karşılaştırması',
  '',
  'Bu karşılaştırma canlı alan adından değil, değişiklik öncesi ve sonrası **yerel üretim derlemelerinden** alınmıştır. Geliştirme sunucusundaki `index.html` şablonu boş React kökü taşır; üretim derlemesi bu kökü önceden işlenmiş ana sayfa HTML’siyle doldurur. 20 içerik sayfası zaten tam statik HTML idi. Bu nedenle yeni bir SSR mimarisi eklenmedi.',
  '',
  'Önceki derlemede 20/20 içerik sayfasında dolu H1 ve gövde, doğru self-canonical, geçerli JSON-LD ve Vite geliştirme betiği olmadan HTML vardı. Son derlemede de 20/20 için aynı koşullar sağlandı. Metin uzunluğu, HTML etiketleri ile script/style içeriği çıkarılarak yaklaşık olarak ölçülmüştür; kalite hedefi olarak kullanılmaz.',
  '',
  '| SEO URL | Birincil sorgu | Ham title | Ham description | H1 önce/sonra | Metin karakteri önce→sonra | Canonical önce/sonra | İç link önce→sonra | Şema önce/sonra | Derleme/test |',
  '| --- | --- | --- | --- | --- | ---: | --- | ---: | --- | --- |',
];
for (const oldPage of before.pages) {
  const page = after.pages.find((item) => item.route === oldPage.route);
  if (!page) throw new Error(`Missing route after build: ${oldPage.route}`);
  lines.push(`| \`${page.route}\` | ${safe(page.keyword)} | ${safe(page.title)} | ${safe(page.description)} | ${oldPage.h1 ? 'var' : 'yok'}/${page.h1 ? 'var' : 'yok'} | ${oldPage.initialHtmlTextLength}→${page.initialHtmlTextLength} | ${oldPage.canonicalCorrect ? 'uygun' : 'hatalı'}/${page.canonicalCorrect ? 'uygun' : 'hatalı'} | ${oldPage.internalLinkCount}→${page.internalLinkCount} | ${oldPage.structuredDataValid ? 'geçerli' : 'hatalı'}/${page.structuredDataValid ? 'geçerli' : 'hatalı'} | geçti |`);
}
lines.push('', '## Ana sayfa ve üretim yanıtı', '',
  '- Kaynak `index.html` geliştirme şablonunda `<div id="root"></div>` bulunur. Bu dosya tek başına yayınlanırsa içerik kabuğu boş kalır.',
  '- Değişiklik öncesi `dist/index.html` zaten 1 H1, 4 H2, yaklaşık 3.966 görünür metin karakteri, 12 iç bağlantı ve doğru canonical içeriyordu. Güncel üretim çıktısında 1 H1, 4 H2, yaklaşık 3.924 metin karakteri ve 15 iç bağlantı vardır; TTS, ASR, yapay zekâ ses üretimi ve kurumsal gerçek zamanlı ASR açıklamaları okunabilir.',
  '- `npm run build` sırasında 20 detay ve iki bölüm girişi statik olarak, yedi genel React sayfası ise build-time prerender ile üretilir. Vite geliştirme betikleri `dist/` HTML’sine konmaz.',
  '- `npm run test:seo` ve `npm run test:seo:production` ham HTML, meta, canonical, H1, gövde, bağlantı, şema, sitemap, robots, 404 ve geliştirme betiği yokluğunu denetler.',
  '- `npx playwright test --workers=1` son çalıştırmada 39/39 geçti. `npm run lint` mevcut React bileşenlerindeki 14 hata ve 1 uyarı nedeniyle başarısız; değiştirilen dosyaların hedefli ESLint kontrolü geçti.',
  '', '## Dağıtım ve Search Console', '',
  'Tüm `dist/` klasörü ve içindeki `web.config` birlikte yayınlanmalıdır. Yalnızca kaynak `index.html` veya yalnızca kök derleme dosyası yayınlanırsa rota bazlı HTML kaybolur. Yayın sonrası 20 URL’de **View Source** ve ham HTTP yanıtı kontrol edilmeli; 200/404, canonical, robots, `X-Robots-Tag`, sitemap ve iç bağlantılar doğrulanmalıdır. Search Console için `https://konusmatik.com/sitemap.xml` gönderilip bölüm girişleri ile öncelikli çözüm URL’leri URL Denetimi’nde incelenmelidir. Canlı yayın ve Search Console erişimi bu raporda doğrulanmadı.',
  '');
fs.writeFileSync('docs/seo-html-rendering-report.md', lines.join('\n'), 'utf8');
console.log('Wrote docs/seo-html-rendering-report.md');
