# Konuşmatik üretim SEO ve HTML kaynak denetimi

**Tarih:** 23 Ekim 2026. **Dağıtım yapılmadı.** Bu rapor ilk HTTP yanıtlarını inceler; JavaScript ile sonradan oluşan DOM'u SEO kanıtı saymaz.

## Ortam karşılaştırması

| Ortam | Ana sayfa | Örnek rehber | Gözlem |
| --- | --- | --- | --- |
| Vite dev | 200, boş `#root`, `/@vite/client`, React Refresh | 200, başlık ve metin içeren statik HTML | Uygulama rotaları için beklenen geliştirme davranışı. İçerik rotalarını Vite eklentisi doğrudan HTML olarak sunuyor. |
| Build + preview | 200, ön işlenmiş HTML | 200, ön işlenmiş HTML | Ana sayfa ve tüm 20 içerik rotası sayfaya özgü ilk yanıt veriyor. |
| Canlı LiteSpeed | 200, boş `#root` | 200, aynı genel kabuk | Üretim dosyaları güncel değil veya yayın kökü yanlış; canlı SEO hedefi sağlanmıyor. |

## Ham HTML yanıtlarından seçili kanıt

**Geliştirme ana sayfası:** `/@vite/client` ve React Refresh var; `<div id="root"></div>` boş. Bu bir üretim SEO hatası değil.

**Yerel üretim ana sayfası** (tam dosya: `dist/index.html`):

```html
<title>Konuşmatik | Türkçe Seslendirme ve Deşifre Platformu</title>
<link rel="canonical" href="https://konusmatik.com/">
<div id="root">…ön işlenmiş sayfa işaretlemesi ve tek H1…</div>
```

**Yerel üretim örnek rehber** (tam dosya: `dist/rehber/turkce-metni-sese-cevirme/index.html`):

```html
<title>Türkçe Metni Sese Çevirme Rehberi | Konuşmatik</title>
<link rel="canonical" href="https://konusmatik.com/rehber/turkce-metni-sese-cevirme/">
<h1>Türkçe metni sese çevirme: iyi sonuç için adımlar</h1>
```

**Canlı ana sayfa ve aynı rehber URL'si:** ikisi de genel `<title>Konuşmatik | Türkçe Seslendirme ve Deşifre Platformu</title>` ve `<div id="root"></div>` döndürüyor; canonical, H1 ve H2 yok.

## 20 SEO URL'si

Yerel production preview'de **20/20** sayfa 200 döndü. Her biri benzersiz title ve description, tek H1, en az sekiz H2, okunabilir metin, dahili bağlantılar, doğru self-canonical, Organization + BreadcrumbList + sayfa türü JSON-LD ve sitemap kaydı içeriyor. Aşağıdaki `H2/H3` sütunu başlık sayılarını gösterir. Canlıdaki 20 URL'nin tümü aynı boş React kabuğuyla 200 dönüyor; canlı sitemap hiçbirini içermiyor.

| URL | Yerel 200; H2/H3 | Metin karakteri | JSON-LD türü | Canlı |
| --- | ---: | ---: | --- | --- |
| `/rehber/turkce-metni-sese-cevirme/` | 200; 8/0 | 3035 | Article | 200; boş kabuk |
| `/rehber/sesi-metne-cevirme/` | 200; 8/0 | 2914 | Article | 200; boş kabuk |
| `/rehber/yapay-zeka-ses-uretimi/` | 200; 8/0 | 2923 | Article | 200; boş kabuk |
| `/rehber/ses-kaydi-desifre-etme/` | 200; 8/0 | 2914 | Article | 200; boş kabuk |
| `/rehber/videoya-altyazi-hazirlama/` | 200; 8/0 | 2834 | Article | 200; boş kabuk |
| `/rehber/tts-asr-farki/` | 200; 8/0 | 2560 | Article | 200; boş kabuk |
| `/rehber/on-premise-ses-teknolojileri/` | 200; 8/0 | 2892 | Article | 200; boş kabuk |
| `/rehber/turkce-transkript-duzeltme/` | 200; 8/0 | 2736 | Article | 200; boş kabuk |
| `/cozumler/turkce-seslendirme/` | 200; 8/0 | 2844 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/toplanti-desifre/` | 200; 8/0 | 2828 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/ivr-seslendirme/` | 200; 8/0 | 2888 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/kurumsal-konusma-tanima/` | 200; 8/0 | 2981 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/yapay-zeka-seslendirme/` | 200; 10/2 | 3254 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/sesten-metne/` | 200; 9/2 | 2965 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/ses-kaydi-desifre/` | 200; 9/1 | 2797 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/video-desifre/` | 200; 9/1 | 2817 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/otomatik-altyazi/` | 200; 9/1 | 2849 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/egitim-seslendirme/` | 200; 10/1 | 3052 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/podcast-desifre/` | 200; 9/1 | 2772 | SoftwareApplication | 200; boş kabuk |
| `/cozumler/on-premise-tts/` | 200; 9/1 | 2953 | SoftwareApplication | 200; boş kabuk |

Yerel ana sayfa: 200, tek H1, dört H2, 3977 okunabilir metin karakteri, 16 dahili bağlantı, doğru canonical ve sitemap. `/kurumsal` mevcut rota üzerinden ön işleniyor; WebPage ve ItemList şemalarıyla ve sitemap kaydıyla 200 dönüyor. Bu denetimde Kurumsal tasarımı değiştirilmedi.

## Canlı farkın kanıtı ve neden

- Canlı yanıt `server: LiteSpeed`; ana HTML `Last-Modified: Wed, 23 Sep 2026 08:54:01 GMT`. Kaynak HTML eski `/assets/index-DlcXo91g.js` dosyasına işaret ediyor; yeni yerel build `/assets/index-DpKzjmyL.js` üretiyor.
- Canlı `sitemap.xml` 8 URL; yerel `dist/sitemap.xml` 29 URL içeriyor. Canlı `robots.txt` 200, `Allow: /` ve doğru sitemap adresi taşıyor, fakat sitemap eski.
- Canlı `/rehber/turkce-metni-sese-cevirme/index.html` ile `/seo-content.css` dahi 200 `text/html` genel kabuğa düşüyor. Bilinmeyen `/rehber/yok/` da 200. Canlıdaki gerçek prerender dosyaları yayın kökünde bulunmuyor veya erişilemiyor; genel SPA fallback bunları gizliyor.
- Yerel SEO içerik üreticisi ve prerender betikleri Git çalışma ağacında henüz izlenmeyen dosyalar. Depodan otomatik yayın yapılıyorsa bunlar commit/push edilmeden canlı pakete giremez. Hangi yayın sürecinin kullanıldığına dair sunucu erişimi yok.
- Yanıtlarda `Age` veya `Cache-Control` bulunmuyor. Sadece bu verilerle CDN önbelleği kanıtlanamaz. Eski sitemap, eski varlık karması ve eski Last-Modified birlikte eski dağıtımı gösteriyor.

## Uygulanan düzeltme

`public/.htaccess` (build ile `dist/.htaccess` olarak kopyalanıyor) LiteSpeed/Apache için güncellendi. Mevcut dosyaları öncelikli sunuyor; uygulama rotalarını eğik çizgisiz, SEO rotalarını eğik çizgili kanonik biçime yönlendiriyor; bulunmayan SEO yollarını 404 yapıyor. Diğer SPA fallback korunuyor. IIS `web.config` ve SEO üretim hattı değiştirilmedi. LiteSpeed kuralları yerel Vite preview tarafından çalıştırılamaz; gerçek host davranışı yayın sonrasında HTTP ile yeniden doğrulanmalı.

## Testler

- `npm run lint`: geçti, 0 ESLint hatası/uyarısı.
- `npm run build`: geçti; 22 içerik dizini, yedi genel uygulama rotası, `dist/.htaccess`, 29 URL'lik sitemap üretildi. Mevcut büyük bundle ve Vite HMR WebSocket portu uyarıları build'i engellemedi.
- `npm test`: geçti; i18n ve SEO, 22 içerik rotası, yedi genel uygulama rotası ve 111 sorgu eşlemesi.
- `npx playwright test`: 40/40 geçti. Production HTML, metadata, 404 ve mobil kontrolü içeriyor.

## Yayın gereksinimi

Tam `dist/` klasörünü, içindeki `.htaccess`, tüm rota `index.html` dosyaları, `seo-content.css`, `robots.txt`, `sitemap.xml` ve `assets/` ile birlikte LiteSpeed yayın köküne alın. Sunucu düzeyinde başka rewrite varsa dosya/dizin önceliğini doğrulayın. Ardından ana sayfa, 20 URL, `/kurumsal`, eksik SEO yolu, slash yönlendirmeleri, robots ve sitemap için ilk HTTP yanıtlarını yeniden ölçün. Eski yanıt sürüyorsa yayın dizini ve önbellek/CDN katmanı kontrol edilmeli. Google Search Console erişimi ve URL Denetleme sonucu olmadığından gerçek indekslenme doğrulanmadı.
