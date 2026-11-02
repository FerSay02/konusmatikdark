# Kayıt koşulları: frontend entegrasyonu

Normal e-posta kaydı ve Google ile ilk kayıt, `GET /api/v1/auth/registration-terms` yanıtındaki `terms_version` değerini kullanır. Normal kayıt formu açıldığında sürüm alınır; sunucu yanıtı yoksa kayıt ve kabul devre dışı kalır. Gösterilen sürüme açık kabulden sonra normal kayıt isteği `terms_accepted: true` ve aynı `terms_version` ile gönderilir. 428 yanıtında kabul sıfırlanır; `terms_version_mismatch` 409 yanıtında sürüm yeniden alınır ve yeniden açık kabul istenir. `terms_unavailable` veya diğer 503 yanıtlarında kayıt durur.

Google ile mevcut kullanıcı girişi koşul kabulü istemez. Yeni Google kullanıcısı için 428 sonrasında aynı ortak endpointten sürüm alınır; ayrı kabul ve yeni nonce/credential gerekir. Google hesap bağlama akışı koşul kabulü istemez.

`VITE_TERMS_VERSION` geriye dönük ortam uyumluluğu için kalabilir ancak artık gösterilen veya gönderilen sürüm değildir. `VITE_EMAIL_REGISTRATION_ENABLED` ve `VITE_EMAIL_CONSENT_ENABLED` production için mevcut feature gate'lerdir; bunların açılması dağıtım ve ürün/hukuk süreçlerinden bağımsız bir onay değildir. Backend'de `GOOGLE_REGISTRATION_TERMS_VERSION` ortak sürüm olarak ayarlanmalıdır. Sunucu sürümü, yayımlanan onaylı metnin değişmez arşiviyle eşleşmelidir.

Gizlilik politikası bilgilendirmesi koşul kabulünden ayrı gösterilir. İsteğe bağlı pazarlama tercihi şu an backend'de saklanmamaktadır; koşul kabulüyle birleştirilmez ve bu entegrasyonla gönderilmez.
