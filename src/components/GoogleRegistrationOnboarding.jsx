import { useState } from 'react';

// Shown only when a future verified backend response requires legal onboarding.
export default function GoogleRegistrationOnboarding({ language = 'tr', termsVersion, busy = false, error = '', onComplete, onCancel, onOpenLegal }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const en = language === 'en';
  return <section className="google-onboarding" aria-labelledby="google-onboarding-title">
    <h2 id="google-onboarding-title">{en ? 'Complete your registration' : 'Kaydınızı tamamlayın'}</h2>
    <p>{en ? 'Review the documents before activating your account.' : 'Hesabınız etkinleşmeden önce belgeleri inceleyin.'}</p>
    <label><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required /> <span>{en ? 'I accept the ' : ''}<a href="/kullanim-kosullari/" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onOpenLegal?.('terms'); }}>{en ? 'Terms of Use' : 'Kullanım Koşulları'}</a>{en ? '.' : ' metnini kabul ediyorum.'}</span></label>
    {termsVersion && <p className="google-terms-version">{en ? 'Terms version' : 'Koşullar sürümü'}: {termsVersion}</p>}
    <p>{en ? 'Read the ' : ''}<a href="/kvkk-aydinlatma-metni/" onClick={(event) => { event.preventDefault(); onOpenLegal?.('kvkk'); }}>{en ? 'KVKK notice' : 'KVKK Aydınlatma Metni'}</a>{en ? ' and ' : ' ve '}<a href="/gizlilik-politikasi/" onClick={(event) => { event.preventDefault(); onOpenLegal?.('privacy'); }}>{en ? 'Privacy Policy' : 'Gizlilik Politikası'}</a>.</p>
    <label><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} /> <span>{en ? 'I would like to receive optional marketing messages.' : 'İsteğe bağlı pazarlama iletileri almak istiyorum.'}</span></label>
    {error && <p role="alert">{error}</p>}
    <button type="button" disabled={!termsAccepted || !termsVersion || !onComplete || busy} onClick={() => onComplete({ termsAccepted, termsVersion, marketingConsent })}>{busy ? (en ? 'Completing…' : 'Tamamlanıyor…') : (en ? 'Complete registration' : 'Kaydı tamamla')}</button>
    {onCancel && <button type="button" disabled={busy} onClick={onCancel}>{en ? 'Cancel' : 'Vazgeç'}</button>}
  </section>;
}
