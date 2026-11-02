import { useState } from 'react';

export default function GoogleRegistrationOnboarding({ language = 'tr', termsVersion, busy, onComplete, onCancel, onOpenLegal }) {
  const [accepted, setAccepted] = useState(false);
  const en = language === 'en';
  return <section className="google-onboarding" aria-labelledby="google-onboarding-title">
    <h2 id="google-onboarding-title">{en ? 'Complete your registration' : 'Kaydınızı tamamlayın'}</h2>
    <p>{en ? 'Review the current terms and privacy notice before continuing.' : 'Devam etmeden önce güncel koşulları ve gizlilik politikasını inceleyin.'}</p>
    <label><input type="checkbox" checked={accepted} disabled={busy} onChange={(event) => setAccepted(event.target.checked)} /> <span>{en ? 'I have read and accept the ' : ''}<a href="/kullanim-kosullari/" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onOpenLegal('terms'); }}>{en ? 'Terms of Use' : 'Kullanım Koşulları'}</a>{en ? '.' : "'nı okudum ve kabul ediyorum."}</span></label>
    <p className="google-terms-version">{en ? 'Terms version' : 'Koşullar sürümü'}: {termsVersion}</p>
    <p><a href="/gizlilik-politikasi/" onClick={(event) => { event.preventDefault(); onOpenLegal('privacy'); }}>{en ? 'Privacy Policy' : 'Gizlilik Politikası'}</a></p>
    <button className="google-onboarding-complete" type="button" disabled={!accepted || busy} onClick={() => onComplete(termsVersion)}>{en ? 'Complete registration' : 'Kaydı Tamamla'}</button>
    <button className="google-onboarding-cancel" type="button" disabled={busy} onClick={onCancel}>{en ? 'Cancel' : 'Vazgeç'}</button>
  </section>;
}
