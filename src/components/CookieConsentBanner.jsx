import { useEffect, useRef, useState } from 'react';
import { acceptAll, consentEvents, openPreferences, rejectOptional, setConsent, withdrawConsent } from '../lib/cookieConsent';
import './CookieConsentBanner.css';
import './CookieConsentBanner.mobile.css';

const categories = [
  ['functional', 'İşlevsel', 'Functional', 'Google Maps gibi isteğe bağlı özellikler.', 'Optional features such as Google Maps.'],
  ['analytics', 'Analitik', 'Analytics', 'Ziyaret istatistikleri. Şu anda analitik sağlayıcısı yüklü değil.', 'Visit statistics. No analytics provider is currently loaded.'],
  ['marketing', 'Pazarlama', 'Marketing', 'Reklam ve yeniden hedefleme. Şu anda reklam sağlayıcısı yüklü değil.', 'Advertising and retargeting. No ad provider is currently loaded.'],
];

export default function CookieConsentBanner({ consent, appLanguage = 'tr' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ functional: false, analytics: false, marketing: false });
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const t = (tr, en) => appLanguage === 'en' ? en : tr;

  useEffect(() => {
    const handleOpen = () => {
      triggerRef.current = document.activeElement;
      setDraft({ functional: consent.functional, analytics: consent.analytics, marketing: consent.marketing });
      setEditing(true);
    };
    window.addEventListener(consentEvents.openEvent, handleOpen);
    return () => window.removeEventListener(consentEvents.openEvent, handleOpen);
  }, [consent]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (editing && dialog && !dialog.open) dialog.showModal();
    if (!editing && dialog?.open) dialog.close();
  }, [editing]);

  const close = () => {
    setEditing(false);
    requestAnimationFrame(() => triggerRef.current?.focus?.());
  };
  const choose = (action) => { action(); close(); };

  return <>
    {!consent.hasDecision && <aside className="cookie-banner" aria-label={t('Çerez tercihleri', 'Cookie choices')}>
      <div><strong>{t('Gizlilik tercihleri', 'Privacy choices')}</strong><p>{t('Zorunlu depolama siteyi çalıştırır. Google Maps yalnızca işlevsel izninizle açılır. Analitik ve pazarlama araçları şu anda kullanılmıyor.', 'Essential storage keeps the site working. Google Maps loads only with functional consent. Analytics and marketing tools are not currently used.')}</p><a href="/cerez-politikasi/">{t('Çerez politikası', 'Cookie policy')}</a></div>
      <div className="cookie-actions"><button type="button" onClick={() => choose(acceptAll)}>{t('Tümünü Kabul Et', 'Accept All')}</button><button type="button" onClick={() => choose(rejectOptional)}>{t('İsteğe Bağlıları Reddet', 'Reject Optional')}</button><button type="button" onClick={openPreferences}>{t('Tercihleri Yönet', 'Manage Preferences')}</button></div>
    </aside>}
    <dialog ref={dialogRef} className="cookie-dialog" aria-labelledby="cookie-dialog-title" onClose={close}>
      <div className="cookie-dialog-inner">
        <button type="button" className="cookie-close" onClick={close} aria-label={t('Kapat', 'Close')}>×</button>
        <h2 id="cookie-dialog-title">{t('Çerez tercihleri', 'Cookie preferences')}</h2>
        <p>{t('İsteğe bağlı kategorileri ayrı ayrı seçebilirsiniz. Kararınızı istediğiniz zaman değiştirebilirsiniz.', 'Choose optional categories individually. You can change your decision at any time.')}</p>
        <div className="cookie-category"><div><strong>{t('Zorunlu', 'Essential')}</strong><p>{t('Tercih kaydı, tema, dil ve oturum işlevleri. Her zaman açık.', 'Preference records, theme, language and session functions. Always active.')}</p></div><input type="checkbox" checked disabled aria-label={t('Zorunlu: her zaman açık', 'Essential: always active')} /></div>
        {categories.map(([key, tr, en, descTr, descEn]) => <label className="cookie-category" key={key}><span><strong>{t(tr, en)}</strong><span>{t(descTr, descEn)}</span></span><input type="checkbox" checked={draft[key]} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.checked }))} /></label>)}
        <a href="/cerez-politikasi/">{t('Çerez politikası ve ayrıntılar', 'Cookie policy and details')}</a>
        <div className="cookie-dialog-actions"><button type="button" onClick={() => choose(() => setConsent(draft))}>{t('Seçimlerimi kaydet', 'Save choices')}</button><button type="button" onClick={() => choose(acceptAll)}>{t('Tümünü kabul et', 'Accept all')}</button><button type="button" onClick={() => choose(rejectOptional)}>{t('Tümünü reddet', 'Reject all')}</button>{consent.hasDecision && <button type="button" onClick={() => choose(withdrawConsent)}>{t('İzni geri çek', 'Withdraw consent')}</button>}</div>
      </div>
    </dialog>
  </>;
}
