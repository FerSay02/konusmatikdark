import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';

const resultContent = {
  success: {
    tone: 'success',
    eyebrow: 'Ödeme tamamlandı',
    eyebrowEn: 'Payment completed',
    title: 'Paketiniz hazır.',
    titleEn: 'Your package is ready.',
    text: 'Satın alma işleminiz başarıyla tamamlandı. Kullanım haklarınız kısa süre içinde profilinizde görünür.',
    textEn: 'Your purchase has been completed successfully. Your usage allowances will appear in your profile shortly.',
    primaryLabel: 'Profilimi Gör',
    primaryLabelEn: 'View My Profile',
    primaryPage: 'profile',
    secondaryLabel: 'Seslendirmeye Git',
    secondaryLabelEn: 'Go to Text-to-Speech',
    secondaryPage: 'tts',
  },
  fail: {
    tone: 'fail',
    eyebrow: 'Ödeme tamamlanamadı',
    eyebrowEn: 'Payment could not be completed',
    title: 'İşlem başarısız oldu.',
    titleEn: 'The transaction failed.',
    text: 'Ödeme onayı alınamadı. Kart bilgilerinizi, banka onayını veya 3D Secure adımını kontrol ederek tekrar deneyebilirsiniz.',
    textEn: 'Payment approval could not be received. Check your card details, bank approval, or 3D Secure step and try again.',
    primaryLabel: 'Paketlere Dön',
    primaryLabelEn: 'Back to Packages',
    primaryPage: 'pricing',
    secondaryLabel: 'Destek Al',
    secondaryLabelEn: 'Get Support',
    secondaryPage: 'contact',
  },
};

function ResultIcon({ tone }) {
  if (tone === 'success') {
    return (
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M7 12.5l3.2 3.2L17 8.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export default function PaymentResult({ status, onNavigate, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const t = (tr, en) => (language === 'en' ? en : restoreTurkishUiText(tr));
  const content = resultContent[status] || resultContent.fail;

  return (
    <main className={`payment-result-page ${content.tone}`}>
      <section className="payment-result-panel" aria-labelledby="payment-result-title">
        <div className="payment-result-icon">
          <ResultIcon tone={content.tone} />
        </div>
        <span className="payment-result-eyebrow">{t(content.eyebrow, content.eyebrowEn)}</span>
        <h1 id="payment-result-title">{t(content.title, content.titleEn)}</h1>
        <p>{t(content.text, content.textEn)}</p>

        <div className="payment-result-actions">
          <button type="button" className="payment-result-primary" onClick={() => onNavigate?.(content.primaryPage)}>
            {t(content.primaryLabel, content.primaryLabelEn)}
          </button>
          <button type="button" className="payment-result-secondary" onClick={() => onNavigate?.(content.secondaryPage)}>
            {t(content.secondaryLabel, content.secondaryLabelEn)}
          </button>
        </div>
      </section>
    </main>
  );
}
