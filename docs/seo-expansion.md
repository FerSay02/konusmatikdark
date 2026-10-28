# Konuşmatik SEO genişletme raporu

Bu rapor 22 Ekim 2026 tarihinde incelenen kaynaklar ve yerel kod tabanı için hazırlanmıştır. Arama hacmi, zorluk, sıralama ve Google indeks durumu doğrulanmamıştır. Rakip içerikleri konu kapsamı için kullanıldı; metinleri kopyalanmadı.

## Rakip sayfalarında gözlenen yapı

| Kaynak | Erişilebilen görünen içerik | Konuşmatik için uygulanabilir ders | Doğrulama sınırı |
| --- | --- | --- | --- |
| [Narakeet Türkçe metin seslendirme](https://www.narakeet.com/languages/metin-seslendirme/) | Dil odaklı `/languages/.../` yolu; “Metin seslendirme” H1, metni sese çevirme, yapay zekâ seslendirme ve sesli okuma H2'leri; sayfa içi deneme ve kullanım örnekleri. | Türkçe seslendirme tek bir yetkili çözüm URL'sinde toplandı; işlem rehberi ayrı kaldı. | Ham `<head>` alınamadı; title, meta description, canonical, robots ve JSON-LD doğrulanmadı. |
| [ElevenLabs Turkish TTS](https://elevenlabs.io/text-to-speech/turkish) | `/text-to-speech/turkish` dil yolu; Türkçe TTS H1, ses örnekleri, üç aşamalı kullanım açıklaması ve diğer ürünlere bağlantılar. | Mevcut Konuşmatik WAV ses örnekleri iki uygun sayfada `audio` öğesiyle gösterildi. | Ham `<head>` alınamadı; meta ve şema doğrulanmadı. |
| [Transkriptor Türkçe ana sayfa](https://transkriptor.com/tr/) | Sesten metne H1; MP3, MP4, WAV gibi format ve kullanım yollarına bağlantılar; açıklayıcı H2'ler. | Konuşmatik'te MP3/WAV/M4A kabulü açıklandı; MP4 yükleme iddiasından kaçınıldı. | Ham `<head>` alınamadı; meta ve şema doğrulanmadı. |
| [Transkriptor Türkçe transkripsiyon](https://transkriptor.com/tr/turkce-transkripsiyon/) | Ayrı dil/işlem yolu, “Türkçe Transkripsiyon” H1, adım adım kullanım, özellik ve kullanım alanları. | Deşifre çözümleri kayıt, video ve podcast niyetlerine göre ayrıldı; çıktının TXT olduğu belirtildi. | Ham `<head>` alınamadı; meta ve şema doğrulanmadı. |
| [Voiser SSS](https://voiser.net/sikca-sorulan-sorular) | Arama önbelleğinde hesap, paket, telaffuz, çıktı ve deşifre sorularıyla geniş SSS içerikleri görüldü. | Yeni sayfalara yalnızca yanıtı doğrulanabilen kısa SSS'ler eklendi. | Doğrudan açma 404 döndürdü; yalnız arama önbelleği içeriği gözlendi. Ham HTML ve tüm meta alanları doğrulanmadı. |

Yerel ham HTML isteği beş adreste de ağ erişimi nedeniyle başarısız oldu. Bu nedenle rakip title, meta description, canonical, robots, JSON-LD ve gerçek HTTP indekslenebilirlik durumuna ilişkin kesin bir karşılaştırma yapılmadı. Yukarıdaki H1/H2 ve bağlantı gözlemleri erişilebilen sayfa metinleriyle sınırlıdır.

## Anahtar kelime ve URL haritası

[`content/keyword-registry.csv`](../content/keyword-registry.csv) 10 kümede 111 Türkçe ve İngilizce sorgu adayı içerir. Her satırda niyet, küme, ana/ikincil rol, kanonik URL, hedef bölüm, ilgili terimler ve uygulama durumu vardır. Birincil terimler yayımlanmış sayfanın ana hedefidir; ikincil adaylar editoryal inceleme için eşlenmiştir. Tüm metrikler `unverified` olarak işaretlidir. `npm run seo:keywords` kaydı yeniden üretir.

Önerilen yakın anlamlı yollar için karar:

| Öneri | Karar ve kanonik hedef |
| --- | --- |
| `/cozumler/metinden-sese`, `/cozumler/turkce-tts` | Yeni kopya sayfa açılmadı; [Türkçe seslendirme](/cozumler/turkce-seslendirme/) ana çözüm. İşlem anlatımı [rehberde](/rehber/turkce-metni-sese-cevirme/). |
| `/cozumler/ivr-seslendirme` | Mevcut, yeterince ayrı IVR sayfası korundu. |
| `/cozumler/kurumsal-asr` | Mevcut [kurumsal konuşma tanıma](/cozumler/kurumsal-konusma-tanima/) kanonik hedefi kullanıldı. |
| Yapay zekâ seslendirme ve ses üretimi rehberi | Çözüm sayfası yayın iş akışı; rehber teknoloji ve editörlük açıklaması sunar. |
| Sesten metne ve sesi metne çevirme rehberi | Çözüm sayfası ürün girdi/çıktısına; rehber yöntem ve kontrol adımlarına odaklanır. |
| Ses kaydı deşifre ve kontrol listesi | Çözüm sayfası röportaj/görüşme yayın akışına; rehber kontrol listesine odaklanır. |

Eklenen sekiz kanonik çözüm yolu: `/cozumler/yapay-zeka-seslendirme/`, `/cozumler/sesten-metne/`, `/cozumler/ses-kaydi-desifre/`, `/cozumler/video-desifre/`, `/cozumler/otomatik-altyazi/`, `/cozumler/egitim-seslendirme/`, `/cozumler/podcast-desifre/`, `/cozumler/on-premise-tts/`. Mevcut 12 içerikle toplam 20 detay sayfası ve iki bölüm girişi vardır. Her sayfanın benzersiz title, meta description, H1, giriş, H2, örnek, bağlamsal bağlantı ve CTA alanı yapılandırılmış içerikte yer alır; yeni sayfalarda görünür SSS ve H3 de bulunur.

## Ürün iddialarının dayanağı

- `src/pages/ASR.jsx` dosya seçicisi MP3, WAV ve M4A kabul eder. TXT indirme ve kopyalama arayüzü vardır. Video dosyası, SRT/VTT çıktısı veya otomatik konuşmacı etiketlemesi vaat edilmez.
- `src/pages/TTS.jsx` metin, ses seçimi ve uygun akışlarda ses çıktısı sunar. Var olan Türkçe demo dosyaları `public/konusmatik-tts-story/` altındadır; iki yeni sayfada bunlar yeniden kullanılır.
- `src/pages/Corporate.jsx` local/on-premise kurulumdan bahseder. On-premise TTS sayfası bu seçeneği değerlendirme çerçevesi olarak anlatır; donanım, SLA ve uyumluluk garantisi vermez.
- API dokümantasyonu yoluna görünür bağlantı yalnızca footer'da tutulur; önceki gezinme kararı korunur.

## Teknik uygulama ve dağıtım

Yeni sayfalar `content/seo-expansion.mjs` içinde düzenlenir ve `content/seo-pages.mjs` listesine eklenir. Mevcut Vite üreticisi her sayfayı `dist/cozumler/<slug>/index.html` olarak ön işler. Kanonik URL, Open Graph, Organization, BreadcrumbList ve uygun SoftwareApplication şeması aynı HTML'de bulunur. Yeni sayfalar çözüm bölüm girişinden ve ilgili içeriklerden taranabilir bağlantı alır. Üst gezinme değişmez.

`npm run build` ardından `npm run test:seo` çalıştırın. Test benzersiz başlık/açıklama, H1/H2, iç bağlantı, içerik benzerliği, şema alanları, sitemap, robots ve dosya örneklerini kontrol eder. Makinece okunur sonuç `dist/seo-validation-report.json` içindedir. Dağıtımda tüm `dist/` klasörü yayınlanmalıdır. IIS için `public/web.config` mevcut rota ve kanonik yönlendirmelerini uygular; farklı barındırma ortamında aynı kurallar ayrıca kurulmalıdır. Yerel ön işleme başarılı olması canlı HTTP 200, canonical başlığı veya arama motoru indekslemesinin kanıtı değildir.

## Search Console yayın kontrolü

1. Canlıda yeni bir çözüm URL'sinin ve iki bölüm girişinin HTTP 200 yanıtını, HTML kaynakta H1/title/canonical/JSON-LD bulunmasını doğrulayın. Eğik çizgisiz yolun kanonik yola yönlendiğini ve bilinmeyen çözüm yolunun 404 döndüğünü kontrol edin.
2. `https://konusmatik.com/robots.txt` ile `https://konusmatik.com/sitemap.xml` dosyalarını açın; yeni sekiz URL'nin sitemap'te olduğundan ve engellenmediğinden emin olun.
3. Search Console alan mülkünü DNS yöntemiyle doğrulayın veya mevcut yetkili mülkü kullanın. Sitemap'i gönderin. Bölüm girişleri ve birkaç yeni URL için URL Denetimi canlı testini uygulayın; seçilen canonical ve tarama erişimini inceleyin.
4. Gerçek sorgu verileri oluştukça CSV'deki ikincil adayları arama niyeti ve gösterim verisiyle gözden geçirin. Yakın niyetler için yeni kopya URL açmayın. Sıralama veya indeksleme garanti edilmez.

## Değişen dosyalar ve kalan işler

Bu genişletme `content/seo-pages.mjs`, yeni `content/seo-expansion.mjs`, yeni `content/keyword-registry.csv`, yeni `scripts/generate-keyword-registry.mjs`, `scripts/seo-content.mjs`, `scripts/verify-seo.mjs`, `public/seo-content.css`, `package.json` ve bu belgeyi değiştirir. Önceki SEO altyapısı ve uygulama değişiklikleri korunur. Canlı sunucuda HTTP/kanonik doğrulaması ve Search Console mülkü için erişim gereklidir. Rakiplerin ham `<head>` karşılaştırması ağ erişimi sağlandığında tamamlanabilir. Son stabilizasyon kontrolünde `npm run lint` başarılıdır.
