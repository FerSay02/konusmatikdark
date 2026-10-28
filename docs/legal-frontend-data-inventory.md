# Konuşmatik frontend veri akışı envanteri — hukuki inceleme girdisi

Bu envanter yalnızca `src/` ve `index.html` içindeki çalışan tarayıcı kodundan çıkarılmıştır. Backend veritabanı, loglar, saklama/silme süresi, model eğitimi, alt işleyenler ve yurt dışına aktarım hakkında kanıt sağlamaz. Yasal metinlerde bu konular kesin iddia olarak kullanılmamalıdır.

| Akış | Frontend kodunda görülen veri ve hedef | Durum / sınır |
|---|---|---|
| E-posta hesabı | `Login.jsx` kayıt formu ad soyad, telefon, e-posta ve parola toplar; `authAdapter.js` mevcut `/api/v1/auth/register` isteğine dört alanı gönderir. Giriş e-posta/parolayı `/api/v1/auth/login` yoluna gönderir. | Çalışan arayüz; sunucunun kaydı ve saklama politikası bilinmiyor. Koşul kabulü ve ayrı pazarlama tercihi formda var; backend onay alanlarını kabul edene kadar mevcut istekte kalıcı kayıt yok. |
| Şifre sıfırlama | `Login.jsx` e-posta, doğrulama kodu ve yeni parolayı mevcut üç reset API adımına gönderir. | Çalışan arayüz; mesaj iletim sağlayıcısı ve sunucu saklaması bilinmiyor. |
| Oturum ve profil | `api.js` her API isteğinde `credentials: include` kullanır; `/auth/me`, çıkış ve refresh çağrıları var. `Profile.jsx` ad/telefonu görüntüler ve PATCH ile günceller; kullanım, paket ve API anahtarları yollarını çağırır. | HttpOnly/SameSite/Secure cookie ayarları ve sunucu oturum süresi backend tarafından doğrulanmalı. API anahtarlarının sunucu saklaması ayrıca incelenmeli. |
| Google ile giriş | `GoogleSignInButton.jsx` resmi GIS SDK URL'sini yalnızca yapılandırma etkinse yükler; callback credential'ı `authAdapter.js` sınırına verir. | Varsayılan olarak devre dışı. Client ID, backend token doğrulaması, hesap eşleştirme ve gerçek Google oturumu henüz doğrulanmadı. Token tarayıcı depolarına yazılmıyor. |
| TTS | `TTS.jsx` girilen metni, ses/model seçimini ve sentez ayarlarını önizleme veya paket API'sine POST eder; dönen sesi `Blob`/geçici object URL ile çalar veya indirir. Klon ses özelliği seçilen referans ses dosyasını ve ses adını `FormData` ile `/api/v1/voices` yoluna gönderir. | Frontend gönderimi doğrulandı; metin, ses dosyası ve çıktıların sunucu tarafındaki yaşam döngüsü bilinmiyor. Klonlama onayı UI'da var; backend kayıt kanıtı ve kullanım yetkisi doğrulanmalı. |
| ASR | `ASR.jsx` seçilen dosyayı, dili ve `transcribe` görevini `FormData` ile `/api/v1/asr/jobs/sync` yoluna gönderir. Dosya seçici `.mp3,.wav,.m4a` filtreler; 100 MB üstü dosyalar frontend tarafından reddedilir. Sürükle-bırak akışında uzantı/tür doğrulaması yoktur; video işleme desteği buradan çıkarılamaz. Gelen transkript ekranda tutulur, panoya kopyalanabilir veya tarayıcıda oluşturulan `.txt` dosyası olarak indirilebilir. | Dosya/transkript saklama ve silme süresi bilinmiyor. Backend'in desteklediği formatlar ve boyut sınırı doğrulanmalı. |
| Ödeme | `Checkout.jsx` fatura adı, e-posta, telefon, adres ve bireysel/kurumsal vergi kimlik alanlarını `/api/v1/payments/paytr/token` isteğine gönderir. Dönen token ile PayTR iframe'i açar. | PayTR üçüncü taraf ödeme akışı kodda mevcut. Kart verisinin işlenme biçimi, alıcı/aktarım ayrıntıları ve satıcı şirket bilgileri backend/ödeme sözleşmesiyle doğrulanmalı. |
| Harita ve diğer dış içerik | `Contact.jsx` Google Maps iframe'i içerir. `corporateProducts.js` ürünlerin dış sitelerine bağlantılar verir. | Harita açıldığında tarayıcı Google alan adına bağlanabilir. Ürün bağlantılarının hedef sitelerindeki veri işlemleri Konuşmatik frontend kodundan çıkarılamaz. |

## Tarayıcıda saklananlar

- `localStorage`: arayüz teması (`konusmatik-theme`), dil tercihi, API dokümanı kod dili ve “beni hatırla” seçilirse **yalnızca e-posta adresi** (`konusmatik_remembered_email`). Parola ve Google ID token burada saklanmaz.
- `sessionStorage`: seçilen ödeme paketi ve fiyatlandırma hedef kitlesi. Bunlar sunucu oturumuna veya ödeme kaydına eşdeğer değildir.
- Geçici `Blob` URL'leri: ses önizlemesi, TTS indirmesi ve ASR transkript indirmesi için kullanılır; bazı akışlarda URL'ler işlem sonrasında geri bırakılır.
- `konusmatik_cookie_consent` birinci taraf `localStorage` kaydıdır: izin sürümü, dört kategori ve seçim zamanı. Zorunlu kategori açık, diğerleri varsayılan kapalıdır. `VITE_COOKIE_CONSENT_VERSION` değişirse yeniden seçim istenir; `VITE_COOKIE_CONSENT_RENEW_DAYS` isteğe bağlıdır ve 0 iken kendiliğinden zaman aşımı uygulanmaz.
- `Contact.jsx` içindeki iki Google Maps iframe'i yalnızca işlevsel izinle oluşturulur; geri çekilince kaldırılır. Google tarafındaki olası çerez isimleri ve süreleri doğrulanmamıştır.
- Kodda `document.cookie` ile doğrudan çerez yazımı veya analitik/reklam izleme SDK'sı tespit edilmedi. Bu, sunucu veya yüklenen üçüncü tarafların çerez kullanmadığını kanıtlamaz.
- `api.js` oturum isteklerinde `credentials: include` kullanır. Backend `Set-Cookie` isimleri, süreleri, Secure/HttpOnly/SameSite ve silme davranışları ayrıca incelenmelidir. Google Identity Services yalnızca doğrulanmış entegrasyon etkinleştirilirse SDK yükler; üretimde devre dışıdır.

## Backend/ürün ekibine sorular

1. Her akışın gerçek veri sorumlusu, veri işleyeni, sunucu bölgesi ve alıcı grupları kimlerdir? Ödeme, Google Maps ve Google GIS için alıcı/aktarım değerlendirmesi nedir?
2. Kayıt, oturum, log, TTS metni/sesi, klon referans sesi, ASR dosyası/transkripti, profil, API anahtarı ve ödeme/fatura kayıtları ne kadar tutuluyor, nasıl siliniyor?
3. Kullanıcı girdileri veya çıktıları model eğitimi, kalite incelemesi veya başka amaçlarla kullanılıyor mu? Varsa hangi koşullarda?
4. Her faaliyet için somut amaç, toplama yöntemi ve KVKK işleme şartı nedir? Hangisi gerçekten ayrı açık rıza gerektiriyor?
5. Güvenlik, erişim yetkileri, olay bildirimi, veri sahibi başvuru kanalı ve saklama kanıtları nasıl yönetiliyor?
6. Onaylanan belge sürümü ve sunucu zamanı email, Google onboarding, ses klonlama ve ödeme akışlarında nasıl tutuluyor?

Bu yanıtlar alınmadan `LegalPage.jsx` metinleri hukuken onaylı politika veya aydınlatma metni olarak yayımlanmamalıdır.
