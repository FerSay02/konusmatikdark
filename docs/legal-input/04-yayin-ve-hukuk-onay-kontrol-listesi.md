# Konuşmatik — Hukuki ve teknik yayın kontrol listesi

## A. Bulabildiğimiz, teyit gerektiren kurumsal bilgiler

- Kurumsal e-posta `info@deepzeka.com`; güncel kurumsal telefon `+90 312 577 17 15` proje sahibi tarafından bildirildi. Konuşmatik KVKK talepleri için doğru başvuru kanalı olup olmadığı ayrıca teyit edilecek.
- Çalışma ofisi: resmî sitenin farklı sayfalarında iki farklı adres biçimi/ayrıntısı var. **Ticaret sicilindeki merkez/tebligat adresi yetkilice teyit edilmeli.**
- Marka DeepZeka / Konuşmatik: hukuki veri sorumlusu olan şirket unvanı yetkilice doğrulanacak.

## B. Şirket içinde tamamlanacak alanlar

| Alan | Gereken kesin bilgi | Sorumlu | Durum |
|---|---|---|---|
| Ticaret unvanı | Veri sorumlusu ve hizmet sağlayıcının tam yasal unvanı | Yönetim/hukuk | BEKLİYOR |
| Resmî adres | Tebligat/merkez adresi ve gerekiyorsa KEP | Yönetim/hukuk | BEKLİYOR |
| Veri kategorileri | Giriş, TTS, ASR, dosya, log, cookie vb. gerçek envanter | Backend/ürün | BEKLİYOR |
| Ses/metin saklama | Kalıcı mı, geçici mi, kaç gün, kullanıcı silme/yedek süresi | Backend/ürün | BEKLİYOR |
| Model eğitimi | Kullanıcı girdileri/çıktıları eğitime dahil mi? | Ürün/AI ekibi | BEKLİYOR |
| Tedarikçiler | Hosting, depolama, e-posta, ödeme, izleme ve Google | Teknik ekip | BEKLİYOR |
| Yurt dışı aktarım | Aktarım var mı, hangi alıcı/ülke/hukuki mekanizma | Teknik/hukuk | BEKLİYOR |
| İşleme amaçları | Her kategori için somut amaç | Ürün/hukuk | BEKLİYOR |
| Hukuki sebepler | Her amaç için KVKK m.5/m.6 dayanağı | Hukuk | BEKLİYOR |
| Saklama ve imha | Veri türüne göre süre ve silme tetikleyicileri | Backend/hukuk | BEKLİYOR |
| Çerezler/analitik | Tarayıcıda gerçek script/cookie envanteri | Frontend/teknik | BEKLİYOR |
| Kullanım modeli | Ücretsiz/ücretli, abonelik, iade/fatura, hedef kitle | Ürün/ticari/hukuk | BEKLİYOR |
| Pazarlama | İYS/ileti tercihi/ret mekanizması gerçek süreç | Pazarlama/hukuk | BEKLİYOR |
| Kullanıcı hesap kapatma | Başvuru, kapanış, veri silme süreçleri | Backend/hukuk | BEKLİYOR |
| Son onay | Üç metnin hukuki onayı ve yürürlük tarihi | Yönetim/hukuk | BEKLİYOR |

## C. Codex'te kapanabilecek teknik işler

- `LegalPage.jsx` taslak içerikleri onaylanmış veriyle değiştirilince 3 sayfayı tekrar prerender et.
- Henüz onaylanmayan metinleri nihai yasal metin gibi gösterme; yayın engeli olarak raporla.
- `npm run lint`, `npm run build`, `npm test`, `npx playwright test`, `npm run test:seo:production` çalıştır.
- Dinamik sitemap kümesi; önceki yerel sayı 32, son build çıktısına göre yeniden hesaplanacak.
- Tam `dist` içeriğinden yeni zip, `.htaccess` dahil; eski HOLD paketini otomatik yayımlama.
- cPanel web kökü daha önce benzersiz test TXT içeriğinin alan adında görüntülenmesiyle kısmen doğrulandı; cPanel Domain Root ile gerçek yol tekrar teyit edilmeli.
- Canlıya alındıktan sonra JS devre dışı ham HTML, 20 SEO rotası, legal rotalar, kurumsal, 404, asset ve sitemap testleri tamamlanmalı.
- Google backend hazır değilse gerçek Google girişi kapalı; asla sahte başarılı login verme.

## D. Google Auth Platform (backend olmadan hazırlanabilen)

- Google Cloud projesi ve Google Auth Platform Branding ayarları; ürün adı ve destek e-postası.
- Search Console üzerinden `konusmatik.com` alan adı sahipliği doğrulaması.
- Privacy URL: `https://konusmatik.com/gizlilik-politikasi/` ancak **onaylanıp canlı yayımlandıktan sonra**.
- Terms URL: `https://konusmatik.com/kullanim-kosullari/` ancak **onaylanıp canlı yayımlandıktan sonra**.
- Web OAuth Client için production origin: `https://konusmatik.com` (www kullanılıyorsa ayrıca); dev origin yalnızca gerçekten kullanılan localhost.
- Public Client ID `VITE_GOOGLE_CLIENT_ID`; Client Secret istemciye/repoya konulmaz.
- Google yalnızca oturum açma için kullanılacaksa Gmail okuma izinleri istenmez.
- Gerçek credential doğrulama, hesap bağlama ve güvenli oturum açma backend tamamlanmadan etkinleştirilmez.

## Başvuru kaynakları

- KVKK aydınlatma: https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu-
- KVKK ayrı aydınlatma/rıza: https://www.kvkk.gov.tr/Icerik/4132/aydinlatma-yukumlulugunun-yerine-getirilmesinde-uyulacak-usul-ve-esaslar-hakkinda-teblig
- Google OAuth policy: https://developers.google.com/identity/verification/authentication-policy-compliance
- Google Cloud verification: https://support.google.com/cloud/answer/13464321?hl=en
- DeepZeka iletişim: https://www.deepzeka.com/iletisim/iletisim.html
- DeepZeka ana site: https://www.deepzeka.com/
- Ticari ileti/İYS: https://ticaret.gov.tr/ic-ticaret/ticari-elektronik-iletiler/ileti-yonetim-sistemi-iys
