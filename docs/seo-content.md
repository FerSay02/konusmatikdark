# Konuşmatik SEO içerik altyapısı

> Bu belge ilk 12 detay sayfasının altyapı denetimini kaydeder. Güncel toplam 20 detay sayfası, 2 bölüm girişi ve 111 aday sorgudur. Yeni sayfalar, rakip araştırması, güncel doğrulama ve dağıtım listesi için [SEO genişletme raporuna](seo-expansion.md) bakın.

## Öncelikli teknik denetim

1. **Yüksek — mevcut uygulama sayfalarının ilk HTML çıktısı boştu; düzeltildi.** Vite + React `createRoot` uygulaması ana sayfa, seslendirme, deşifre, fiyatlar, kurumsal, API ve iletişim içeriğini tarayıcıda oluşturuyordu. `src/components/Seo.jsx` başlık, açıklama ve canonical etiketlerini de çalışma anında ekliyordu. `scripts/prerender-app.mjs` artık derlemeden sonra bu yedi rotayı React ile HTML'ye önceden işler ve rota bazlı meta veriyi dosyaya yazar. Tarayıcıdaki mevcut React etkileşimi korunur. Yeni `/rehber/` ve `/cozumler/` rotaları da derleme zamanında tam statik HTML olarak üretilir.
2. **Yüksek — eski sitemap güncel değildi.** `public/sitemap.xml` içindeki `/analiz` rotası `src/seo.js` içinde yoktu. Sitemap artık derlemede, mevcut genel uygulama rotaları ve 14 yeni içerik rotası için üretiliyor; `/analiz` çıkarıldı.
3. **Orta — hreflang gerçeği yansıtmıyordu.** Dil seçimi URL değiştirmediği halde eski `Seo.jsx` Türkçe ve `x-default` alternatifleri ekliyordu. Ayrı dil URL'leri bulunmadığı için bu etiketler kaldırıldı.
4. **Orta — yapılandırılmış veri fazla geneldi.** Eski SPA her sayfaya, özel hesap sayfaları dahil, `SoftwareApplication` ve fiyatı olmayan `Offer` ekliyordu. `Offer` kaldırıldı; yazılım şeması yalnızca ilgili genel uygulama sayfalarında kullanılıyor, iletişim ve hesap sayfalarında kullanılmıyor. Yeni içerikte rehberler `Article`, çözüm sayfaları `SoftwareApplication`, hepsi `BreadcrumbList` ve `Organization` kullanıyor.
5. **Düzeltildi — bilinmeyen rotaların HTTP durumu.** Eski SPA geri dönüşü bilinmeyen yollar için ana sayfayı HTTP 200 ile verebiliyordu. Üretim önizlemesi ve IIS kuralı artık bilinmeyen sayfalarda 404 döndürür; tanımlı ürün rotaları korunur. Canlı hostta bu davranış yayın sonrası ayrıca doğrulanmalıdır.
6. **Düşük — robots.txt doğru sitemap adresini gösteriyordu.** Mevcut `robots.txt` herkese açık rotalara izin verir; hesap/ödeme alanlarını kapatır. Yeni içerik yolları için ek engel yoktur. İçerik sayfalarında `index, follow` bulunur.
7. **Düzeltildi — geliştirme proxy'si API doküman sayfasını yakalıyordu.** `/api` öneki `/api-dokumantasyon` yolunu da eşleştiriyordu. Proxy yalnızca `/api` ve `/api/...` isteklerine sınırlandı; mevcut doküman rotası yeniden açılıyor.

## İlk içerik mimarisi ve rota listesi

`content/seo-pages.mjs` her yazının başlık, açıklama, anahtar sözcük, destekleyici terimler, H1, giriş, H2 bölümleri, örnek ve CTA alanlarını içerir. Yeni bir öğe eklendiğinde Vite eklentisi otomatik olarak `dist/<bölüm>/<slug>/index.html` üretir, bağlantıları doğrular ve sitemap'e ekler. URL'lerin kanonik biçimi sonunda `/` taşır. `/rehber` ve `/cozumler` isteği kanonik URL'ye yönlendirilir.

| URL | Arama niyeti / ana terim |
| --- | --- |
| `/rehber/turkce-metni-sese-cevirme/` | İşlem rehberi: Türkçe metni sese çevirme |
| `/rehber/sesi-metne-cevirme/` | İşlem rehberi: sesi metne çevirme |
| `/rehber/yapay-zeka-ses-uretimi/` | Kavramsal açıklama: yapay zekâ ses üretimi |
| `/rehber/ses-kaydi-desifre-etme/` | Kontrol listesi: ses kaydı deşifre etme |
| `/rehber/videoya-altyazi-hazirlama/` | İş akışı: videoya altyazı hazırlama |
| `/rehber/tts-asr-farki/` | Karşılaştırma: TTS ve ASR farkı |
| `/rehber/on-premise-ses-teknolojileri/` | Değerlendirme: on-premise ses teknolojileri |
| `/rehber/turkce-transkript-duzeltme/` | Düzenleme rehberi: Türkçe transkript düzeltme |
| `/cozumler/turkce-seslendirme/` | Ürün kullanım alanı: Türkçe seslendirme |
| `/cozumler/toplanti-desifre/` | Ürün kullanım alanı: toplantı deşifresi |
| `/cozumler/ivr-seslendirme/` | Ürün kullanım alanı: IVR seslendirme |
| `/cozumler/kurumsal-konusma-tanima/` | Kurumsal değerlendirme: konuşma tanıma |

Her sayfanın tam title, meta description, destekleyici terimler ve H1 değeri kaynak dosyada bulunur. Başlık ve açıklamalar benzersiz olmalıdır; derleme bu koşulu denetler. Bölüm girişleri `/rehber/` ve `/cozumler/` altında ayrıca statik olarak üretilir. İçerik sayfaları birbirlerine ve mevcut gerçek ürün sayfalarına bağlanır. Uygulama üst menüsüne içerik sekmesi eklenmedi; mevcut alt menüden iki bölüme erişilir. Kök HTML'deki `noscript` bağlantıları JavaScript kapalı ziyaretçilere de iki bölüm girişini gösterir.

## Ürün doğrulaması ve yazım sınırları

- `src/pages/TTS.jsx`: metin girişi, ses seçimi ve uygun motorda MP3/WAV indirme akışı görüldü. Klonlama hesabın ve paketin koşullarına bağlı olduğundan içerikte genel vaat olarak kullanılmadı.
- `src/pages/ASR.jsx`: arayüz MP3, WAV ve M4A yüklemeyi; metni kopyalamayı ve TXT indirmeyi destekliyor. Videoya altyazı rehberi, video sesinin önce desteklenen ses biçimine çıkarılmasını ve zaman kodlu SRT/VTT işleminin ayrı araçta yapılmasını açıkça belirtiyor.
- `src/pages/Corporate.jsx` ve `src/pages/ApiDocs.jsx`: kurumsal local kurulum ve API seçenekleri tanıtılıyor. İçerik belirli SLA, donanım, uyumluluk veya entegrasyon garantisi vermiyor; bunların görüşme ve teknik belgelerle doğrulanmasını öneriyor.
- Ücret, ücretsiz hak, hız/başarım rakamı, müşteri yorumu veya desteklenen diller için yeni iddia eklenmedi.

## Derleme ve dağıtım

Bu çalışma için değişen dosyalar: `content/seo-pages.mjs` (12 sayfalık yapılandırılmış içerik), `scripts/seo-content.mjs` (statik içerik, sitemap ve rota üretimi), `scripts/prerender-app.mjs` (mevcut React sayfalarını ön işleme), `scripts/verify-seo.mjs` (HTML denetimi), `public/seo-content.css` (içerik tasarımı), `vite.config.js` (üretici ve API proxy sınırı), `package.json` (derleme ve test komutları), `public/web.config` (IIS rota kuralları), `index.html` (JavaScript kapalıyken içerik bağlantıları), `src/components/Footer.jsx` (bölüm girişleri), `src/components/Seo.jsx` (şema ve alternatif dil düzeltmesi), `tests/i18n-toggle.spec.js` (güncel görünür gezinme seçicileri) ve bu belge. Eski `public/sitemap.xml` kaldırıldı; artık derlemede üretiliyor. Çalışma alanında önceden bulunan `package-lock.json`, `src/App.jsx`, `src/components/PillNav.jsx` ve `src/index.css` değişiklikleri bu SEO çalışmasına ait değildir.

`npm run build` Vite uygulamasını, 22 statik içerik rotasını ve yedi genel uygulama rotasının ön işlenmiş HTML dosyalarını `dist/` içine üretir. Hesap ve ödeme rotaları için ayrıca `noindex` içeren kabuk HTML hazırlanır. `public/seo-content.css`, `robots.txt`, `web.config` ve görseller aynı çıktıya kopyalanır. `dist/sitemap.xml` derlemede üretilir. Dağıtımda **tüm `dist/` klasörü** yayınlanmalıdır; yalnızca kök `index.html` yayınlanırsa rota bazlı HTML çalışmaz.

IIS için `public/web.config`, içerik rotalarında kanonik son eğik çizgi yönlendirmesini, uygulama rotalarında eğik çizgisiz URL'lerin ilgili ön işlenmiş dosyaya yazılmasını ve bilinmeyen içerik yolları için 404 yanıtını içerir. Başka bir host kullanılıyorsa bu yönlendirme ve dosya eşleştirmeleri SPA geri dönüş kuralından önce kurulmalıdır. Bilinmeyen içerik rotaları ana sayfa HTML'sine düşmemelidir. Sunucu tarafında UTF-8 `text/html` sunumu ve XML sitemap MIME türü korunmalıdır.

## Doğrulama ve Search Console

1. `npm run build`, ardından `npm run test:seo` ve `npm run test:seo:production` çalıştırın. Testler 22 içerik ve yedi genel uygulama rotası için ön işlenmiş H1, canonical, şema, sitemap ve bağlantıları; özel rotalar için `noindex` değerini doğrular. `npm run test:i18n` ve `npm run test:i18n:e2e` mevcut dil kontrolleridir.
2. Yayından sonra tarayıcıda ve `curl` ile `/rehber/`, `/cozumler/` ve örnek detay sayfalarının HTTP 200 döndüğünü; kaynak HTML'de başlık, H1 ve canonical bulunduğunu kontrol edin. Eğik çizgisiz adreslerin yönlenmesini, bilinmeyen bir içerik adresinin 404 döndürülmesini doğrulayın.
3. Google Search Console'da alan adı mülkü doğrulanmadıysa DNS TXT yöntemiyle doğrulayın. `https://konusmatik.com/sitemap.xml` adresini **Site Haritaları** bölümüne ekleyin. **URL Denetimi** ile bölüm girişlerini ve birkaç örnek yazıyı inceleyip canlı testi çalıştırın; erişim ve canonical sorunlarını giderin. İndeksleme veya sıralama garanti edilemez.

Son stabilizasyon kontrolünde `npm run lint` başarılıdır; önceki 14 hata ve 1 uyarı giderildi.
