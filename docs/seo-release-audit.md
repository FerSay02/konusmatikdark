# Konuşmatik üretim SEO sürüm denetimi

Tarih: 22 Ekim 2026. Kapsam: 20 detay sayfası, iki bölüm girişi, yedi genel uygulama rotası. **Bu sürüm canlıya alınmadı.** Aşağıdaki 200 yanıtları ve HTTP başlıkları `dist/` üretim önizlemesine aittir. Canlı `konusmatik.com` SEO URL'leri bu çalışma ortamındaki ağ araçlarıyla açılamadı; canlı durum ve Search Console sonucu bilinmiyor.

## Öncelikli denetim bulguları

1. **Yüksek, düzeltildi:** Bilinmeyen yolların SPA ana sayfasına 200 ile düşmesi. `public/web.config` ve Vite üretim önizlemesi bilinmeyen belge yollarını 404 döndürüyor. `/rehber/yok/`, `/cozumler/yok/` ve `/olmayan-sayfa` önizlemede 404; tanımlı rotalar korunuyor. Canlı IIS davranışı yayın sonrası doğrulanmalı.
2. **Orta, düzeltildi:** Ana sayfa meta açıklaması video dosyasının doğrudan deşifresini ima ediyordu; mevcut deşifre seçicisi MP3/WAV/M4A ses dosyaları kabul ediyor. Meta açıklaması ses kaydı olarak düzeltildi. Ses üretimi rehberindeki gereksiz klonlama ifadesi çıkarıldı.
3. **Orta, izlenecek:** Rehber ile çözüm sayfalarında yakın sorgular var: Türkçe metni sese çevirme/Türkçe seslendirme, sesi metne çevirme/sesten metne, ses kaydı kontrol listesi/ses kaydı çözümü, altyazı rehberi/otomatik altyazı çözümü. İçerik işlevleri ayrı; gerçek sorgu bazlı kanibalizasyon yalnız Search Console verisiyle değerlendirilebilir. Aynı birincil sözcük iki detay sayfasında kullanılmıyor. Beş sözcüklü metin parçalarıyla en yüksek karşılıklı örtüşme yaklaşık %2,8; bu ölçüm anlamsal benzerliğin yerine geçmez.
4. **Düzeltildi:** React bileşenlerindeki 14 ESLint hatası ve 1 uyarı giderildi. `npm run lint` artık başarılı.
5. **Canlı doğrulama bekliyor:** Alan adı için gerçek HTTP 200/404, canonical, `X-Robots-Tag`, CDN/hosting yönlendirmeleri, mobil davranış ve Search Console indeks kapsamı bu aşamada doğrulanmadı.

## 20 sayfa denetim tablosu

Tablodaki **200**, **uygun**, **HTML** ve **var** değerleri yalnızca yerel üretim önizlemesinde doğrulandı. Her sayfada tek ve benzersiz H1, benzersiz title ve description, kendine işaret eden canonical, ilk yanıtta anlamlı gövde metni, `index, follow`, BreadcrumbList ve uygun Article/SoftwareApplication şeması bulundu. Tüm iç bağlantılar üretim önizlemesinde 200 döndü. Canlı sütunların tamamı yayın sonrasına kadar **bekliyor**.

| URL | Birincil sorgu | HTTP | Canonical | Meta/H1 | HTML | Sitemap | Konu/olası sorun |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/rehber/turkce-metni-sese-cevirme/` | Türkçe metni sese çevirme | 200 | uygun | uygun | var | var | Çözüm sayfasıyla sorgu ayrımı izlenecek |
| `/rehber/sesi-metne-cevirme/` | sesi metne çevirme | 200 | uygun | uygun | var | var | Sesten metne çözümüyle ayrım izlenecek |
| `/rehber/yapay-zeka-ses-uretimi/` | yapay zekâ ses üretimi | 200 | uygun | uygun | var | var | Çözüm sayfasıyla ayrım izlenecek |
| `/rehber/ses-kaydi-desifre-etme/` | ses kaydı deşifre etme | 200 | uygun | uygun | var | var | Kontrol listesi niyeti korunuyor |
| `/rehber/videoya-altyazi-hazirlama/` | videoya altyazı hazırlama | 200 | uygun | uygun | var | var | SRT ayrı araç gerektirir, metinde açık |
| `/rehber/tts-asr-farki/` | TTS ve ASR farkı | 200 | uygun | uygun | var | var | Kavramsal karşılaştırma |
| `/rehber/on-premise-ses-teknolojileri/` | on-premise ses teknolojileri | 200 | uygun | uygun | var | var | Kurulum koşulları teklif aşamasında doğrulanmalı |
| `/rehber/turkce-transkript-duzeltme/` | Türkçe transkript düzeltme | 200 | uygun | uygun | var | var | Editoryal kontrol niyeti |
| `/cozumler/turkce-seslendirme/` | Türkçe seslendirme | 200 | uygun | uygun | var | var | Genel TTS çözümünün yetkili URL'si |
| `/cozumler/toplanti-desifre/` | toplantı deşifresi | 200 | uygun | uygun | var | var | Toplantı bağlamı ayrı |
| `/cozumler/ivr-seslendirme/` | IVR seslendirme | 200 | uygun | uygun | var | var | Telefon altyapısı ayrıca test edilmeli |
| `/cozumler/kurumsal-konusma-tanima/` | kurumsal konuşma tanıma | 200 | uygun | uygun | var | var | “Kurumsal ASR” aynı URL'ye eşli |
| `/cozumler/yapay-zeka-seslendirme/` | yapay zekâ seslendirme | 200 | uygun | uygun | var | var | Yayın iş akışı; rehberden ayrı |
| `/cozumler/sesten-metne/` | sesten metne | 200 | uygun | uygun | var | var | Ses dosyası girdi/çıktı çözümü |
| `/cozumler/ses-kaydi-desifre/` | ses kaydı deşifre | 200 | uygun | uygun | var | var | Röportaj/görüşme yayın akışı |
| `/cozumler/video-desifre/` | video deşifre | 200 | uygun | uygun | var | var | Video ses izi önce çıkarılmalı |
| `/cozumler/otomatik-altyazi/` | otomatik altyazı | 200 | uygun | uygun | var | var | Doğrudan SRT vaadi yok; niyet uyumu izlenecek |
| `/cozumler/egitim-seslendirme/` | eğitim içeriği seslendirme | 200 | uygun | uygun | var | var | Ders sürümü ve telaffuz bağlamı ayrı |
| `/cozumler/podcast-desifre/` | podcast deşifre | 200 | uygun | uygun | var | var | Bölüm yayını bağlamı ayrı |
| `/cozumler/on-premise-tts/` | on-premise TTS | 200 | uygun | uygun | var | var | Teknik kapsam teklif aşamasında doğrulanmalı |

Kaynak: `content/seo-pages.mjs`, `content/seo-expansion.mjs`, `dist/<rota>/index.html`, `dist/sitemap.xml`, `dist/robots.txt`, `dist/seo-validation-report.json` ve üretim önizlemesi. CSS içinde gizli anahtar kelime bloğu bulunmadı; mobil ve masaüstü içindekiler gezinmesinin farklı görünmesi olağan arayüz davranışıdır.

## Üretim çıktısı ve kalite kapısı

- `npm run build`: başarılı; 20 detay + iki giriş sayfası statik HTML, yedi genel uygulama sayfası ön işlenmiş HTML olarak üretildi.
- `npm run test:seo`: başarılı; meta, canonical, şema alanları, sitemap, robots, bağlantılar ve kopya içerik denetimi.
- `npm run test:seo:production`: başarılı; 20 rotanın gerçek HTTP yanıtı, `X-Robots-Tag`, HTML kaynağı, tüm iç bağlantılar, 404 ve örnek mobil görünüm.
- `npm run test`: başarılı; i18n ve SEO doğrulamaları birlikte çalışıyor. `npx playwright test --workers=1`: 39/39 başarılı.
- `npm run lint`: başarılı; önceki 14 hata ve 1 uyarı, kuralları kapatmadan giderildi.
- Üretim önizlemesinde 20 detay rotası 200, 20 ayrı canonical ve 20 sitemap girdisi doğrulandı. Ana sayfa, `/seslendirme` ve `/desifre` JavaScript ile açıldığında hydration hatası görülmedi.
- `/cozumler/metinden-sese/` mevcut bir içerik sayfası değildir ve 404 döner. Depoda bu rotaya giden iç bağlantı bulunmadı; geçmiş dış bağlantı veya indekslenme bilgisi ancak canlı analitik ve Search Console erişimiyle doğrulanabilir.

Depoda ayrı bir CI veya yayın komutu bulunmadı. Mevcut dağıtım yapılandırması `public/web.config` ile IIS statik barındırmayı hedefliyor. Yayın paketi `dist/` klasörünün **tamamıdır**; kök `index.html` tek başına yeterli değildir. DNS, ortam sırları veya hosting ayarları değiştirilmedi. Bu dosyanın hazırlanması yayın yetkisi sayılmaz; dağıtım yapılmadı.

## Yayın sonrası doğrulama

1. Canlı alan adında yukarıdaki 20 URL ve `/rehber/`, `/cozumler/` için 200; bilinmeyen SEO ve genel yollar için 404 doğrulayın. Eğik çizgisiz içerik URL'sinin kanonik eğik çizgili URL'ye yönlendiğini ve döngü olmadığını kontrol edin.
2. Her URL için sunucudan dönen HTML'de title, description, tek H1, açıklayıcı metin, self-canonical, robots, OG URL ve JSON-LD bulunduğunu kontrol edin. `X-Robots-Tag` içinde `noindex`/`nofollow` olmamalı.
3. `https://konusmatik.com/sitemap.xml` ve `https://konusmatik.com/robots.txt` yanıtlarını kontrol edin. Sitemap'teki 20 detay URL'si kanonik URL'lerle aynı olmalı; robots bu yolları engellememeli.
4. Bağlantıları ve iki örnek sayfanın mobil taşmasını canlıda test edin. CDN önbelleği, yönlendirme veya IIS varsayılan belge davranışı yerel önizlemeden farklıysa önce bunları düzeltin.

## Search Console hazırlığı

- Sitemap gönderim URL'si: `https://konusmatik.com/sitemap.xml`.
- Öncelikli URL Denetimi: `/rehber/`, `/cozumler/`, `/cozumler/turkce-seslendirme/`, `/cozumler/sesten-metne/`, `/cozumler/yapay-zeka-seslendirme/`, `/cozumler/otomatik-altyazi/`, `/cozumler/on-premise-tts/`, `/rehber/turkce-metni-sese-cevirme/`, `/rehber/tts-asr-farki/`. Yeni sekiz çözüm URL'sinin tamamı ardından örneklenmeli.
- Dizin kapsamı: URL Denetimi'nde canlı erişim, Google'ın seçtiği canonical, tarama izni, keşif kaynağı, dizine ekleme durumu ve hariç tutulma gerekçesini kaydedin. “Tarandı ama dizine eklenmedi” gibi durumlarda önce niyet ve içerik kalitesini değerlendirin; otomatik olarak yeni kopya URL üretmeyin.
- Performans planı: İlk ay haftalık, sonrasında aylık olarak sayfa ve sorgu kırılımında gösterim, tıklama, TO ve ortalama konumu izleyin. Tarih ve ülke karşılaştırmalarını aynı filtrelerle yapın; düşük hacimli sorgularda kısa dönem oynaklığına aşırı tepki vermeyin.
- Kanibalizasyon planı: Aynı sorguda birden fazla Konuşmatik URL'si gösterim alıyorsa niyet, tıklama ve seçilen canonical'ı karşılaştırın. Özellikle yukarıdaki rehber/çözüm çiftlerini izleyin. İç bağlantı ve başlıkları netleştirmek ilk adımdır; birleştirme veya yönlendirme yalnız veriyle desteklenirse düşünülür.

Search Console mülkü, indekslenme veya sıralama bu çalışmada doğrulanmadı ve garanti edilemez.
