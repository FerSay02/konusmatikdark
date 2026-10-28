# Codex — Konuşmatik kalan hukuki ve release hazırlık işleri

Project: `C:\Users\xertm\Desktop\konusmatikdark`

Bu paket ile verilen üç Markdown metni yalnızca **hukuki/operasyonel taslaktır**. Eksik bilgileri varsayarak yayımlama. Önce mevcut `docs/legal-publication-checklist.md`, `src/pages/LegalPage.jsx`, `docs/google-auth-backend-handoff.md` ve auth adapter'ını incele. Taslakları mevcut gerçek akışlarla karşılaştır.

## Görevler

1. Önce mevcut yasal metinlere ait TODO listesini üç taslak belgeyle eşleştir. Şirket tarafından doğrulanan bölümleri düzenli ve anlaşılır biçimde üç sayfaya aktar; doğrulanmamış bilgiler için yalnızca `docs/legal-publication-checklist.md` içinde işaretlenmiş eksik listesi tut. **Onay yoksa canlıda tamamlanmış yasal politika gibi yayımlama.** Gerekirse legal sayfaları feature flag ile erişime kapalı tut; ama Google Branding'e sahte/eksik politika URL'si bildirme.
2. Gerçek çerez ve üçüncü taraf script envanterini koddan çıkar. `Analytics`, Google GIS, dosya depolama, ödeme vb. entegrasyonları yalnızca gerçekten var olduğu ölçüde işle. Hukuki metinler için listeyi oluştur.
3. Kullanıcı içerikleri (TTS input, ASR audio/video, transkriptler), eğitim amaçlı kullanım, silme ve saklama işleyişi repodan doğrulanabiliyorsa belgele; backend olmadan doğrulanamayan noktaları backend ekibine soru listesi olarak bırak.
4. Google frontend'inin güvenli biçimde devre dışı kaldığını tekrar kontrol et; Client ID ve backend flag yokken oturum üretme. API endpointi ve secrets uydurma.
5. Hukuki onaydan sonra yayımlanacak HTML için `LegalPage` i18n ve theme düzeni, erişilebilir bağlantılar, prerender, canonical ve sitemap testlerini koru.
6. `npm run lint`, `npm run build`, `npm test`, `npx playwright test`, `npm run test:seo:production` testlerini çalıştır; başarısızlıkları onar.
7. `docs/litespeed-dist-manifest.txt` ve `scripts/verify-live-deployment.mjs` son build ile tutarlı olsun. 32 URL sayısını sabit kabul etme. Yeni ZIP üretilebilir; **deploy/commit/push yapma**. Paket `HOLD` statüsünde kalmalı.
8. `docs/legal-publication-checklist.md` içinde gerçek tamamlananlar ve şirket/hukuk/backend bekleyenler ayrışsın. Frontend/SEO/Ctrl+U sorunu için yerel üretim ve canlıya geçiş ayrı raporlansın.

## Çıktı

- Doğrulanmış veriler / eksik şirket bilgileri matrisi
- 3 yasal sayfa taslağı ve hukuk onayı bekleyenler
- Google Cloud'da kullanıcının manuel tamamlayacağı ayarlar
- Son test sonuçları
- Son manifest / release ZIP path
- Yeni canlı yayın olmadan Ctrl+U'nun değişmeyeceği açıklaması
- `SAFE_TO_DEPLOY` yalnızca hukuk ve hosting onayı ardından değerlendirilsin
