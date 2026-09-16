import { useEffect, useMemo, useRef, useState } from 'react';

export const LANGUAGE_STORAGE_KEY = 'konusmatik_language';
const LANGUAGE_CHANGE_EVENT = 'konusmatik:language-change';

export const languages = { tr: 'TR', en: 'EN' };

export function readStoredLanguage() {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'tr';
  } catch {
    return 'tr';
  }
}

// Legacy API values can contain ASCII Turkish. This only normalizes Turkish
// source copy; it does not translate content or inspect the DOM.
const turkishUiTextFixes = [
  [/Yonetim/g, 'Yönetim'], [/Kullanicilar/g, 'Kullanıcılar'], [/Kullanici/g, 'Kullanıcı'],
  [/Kullanim/g, 'Kullanım'], [/kayitlari/g, 'kayıtları'], [/Kayitlari/g, 'Kayıtları'],
  [/kayit/g, 'kayıt'], [/Kayit/g, 'Kayıt'], [/islem/g, 'işlem'], [/Islem/g, 'İşlem'],
  [/Isler/g, 'İşler'], [/isi/g, 'işi'], [/sagligi/g, 'sağlığı'], [/Ozet/g, 'Özet'],
  [/Odemeler/g, 'Ödemeler'], [/Odeme/g, 'Ödeme'], [/Siparis/g, 'Sipariş'],
  [/Giris/g, 'Giriş'], [/giris/g, 'giriş'], [/don/g, 'dön'], [/erisimi/g, 'erişimi'],
  [/sayfayi/g, 'sayfayı'], [/icin/g, 'için'], [/yapmalisiniz/g, 'yapmalısınız'],
  [/yonetin/g, 'yönetin'], [/secin/g, 'seçin'], [/secil/g, 'seçil'],
  [/tanimla/g, 'tanımla'], [/tanimlandi/g, 'tanımlandı'], [/tanimlanamadi/g, 'tanımlanamadı'],
  [/tanimlanir/g, 'tanımlanır'], [/olustur/g, 'oluştur'], [/Olustur/g, 'Oluştur'],
  [/olusturuldu/g, 'oluşturuldu'], [/olusturulamadi/g, 'oluşturulamadı'],
  [/guncelle/g, 'güncelle'], [/guncellendi/g, 'güncellendi'], [/guncellenemedi/g, 'güncellenemedi'],
  [/satin/g, 'satın'], [/aldiktan/g, 'aldıktan'], [/tarafindan/g, 'tarafından'],
  [/erisim/g, 'erişim'], [/anahtarlariniz/g, 'anahtarlarınız'], [/Anahtar Adi/g, 'Anahtar Adı'],
  [/Key adi/g, 'Key adı'], [/adiniz/g, 'adınız'], [/Adi/g, 'Adı'],
  [/Sifren/g, 'Şifren'], [/Sifre/g, 'Şifre'], [/sifre/g, 'şifre'],
  [/Parolayi/g, 'Parolayı'], [/parolaniz/g, 'parolanız'], [/Parolanizi/g, 'Parolanızı'],
  [/esles/g, 'eşleş'], [/Dogrulama/g, 'Doğrulama'], [/dogrulama/g, 'doğrulama'],
  [/Dogrula/g, 'Doğrula'], [/dogrulandi/g, 'doğrulandı'], [/gonder/g, 'gönder'],
  [/Gonder/g, 'Gönder'], [/Telefon formati/g, 'Telefon formatı'], [/yanlis/g, 'yanlış'],
  [/olmali/g, 'olmalı'], [/Beni hatirla/g, 'Beni hatırla'], [/hatirla/g, 'hatırla'],
  [/Isleniyor/g, 'İşleniyor'], [/Islenen/g, 'İşlenen'],
  [/erisebilirligi/g, 'erişilebilirliği'], [/erisilebilirligi/g, 'erişilebilirliği'],
  [/kaldiginiz/g, 'kaldığınız'], [/Desifre/g, 'Deşifre'], [/desifre/g, 'deşifre'],
  [/ucretli/g, 'ücretli'], [/Ucretli/g, 'Ücretli'], [/Ucretsiz/g, 'Ücretsiz'],
  [/ucretsiz/g, 'ücretsiz'], [/ihtiyaciniza/g, 'ihtiyacınıza'], [/haklariniz/g, 'haklarınız'],
  [/toplamlariniz/g, 'toplamlarınız'], [/kullanildi/g, 'kullanıldı'],
  [/kullanilabilir/g, 'kullanılabilir'], [/Henuz/g, 'Henüz'], [/kullanilmadi/g, 'kullanılmadı'],
  [/Iptal/g, 'İptal'], [/Indirme/g, 'İndirme'], [/acik/g, 'açık'], [/kapali/g, 'kapalı'],
  [/Baslangic/g, 'Başlangıç'], [/Bitis/g, 'Bitiş'], [/Sure/g, 'Süre'],
];

export function restoreTurkishUiText(value) {
  if (!value || typeof value !== 'string') return value;
  return turkishUiTextFixes.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

export function useLanguagePreference() {
  const [language, setLanguage] = useState(() => readStoredLanguage());
  const didInitializeStorage = useRef(false);
  const isEnglish = language === 'en';

  const toggleLanguage = useMemo(
    () => () => setLanguage((current) => (current === 'en' ? 'tr' : 'en')),
    []
  );

  useEffect(() => {
    const syncLanguage = (nextLanguage) => setLanguage(nextLanguage === 'en' ? 'en' : 'tr');
    const handleLanguageChange = (event) => syncLanguage(event.detail?.language);
    const handleStorage = (event) => {
      if (event.key === LANGUAGE_STORAGE_KEY) syncLanguage(event.newValue);
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The visible session language still works when storage is unavailable.
    }

    document.documentElement.lang = language;
    if (didInitializeStorage.current) {
      window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: { language } }));
      return;
    }
    didInitializeStorage.current = true;
  }, [language]);

  return { language, isEnglish, toggleLanguage };
}
