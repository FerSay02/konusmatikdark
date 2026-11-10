import './Footer.theme.css';
import './Footer.interactive.css';
import { corporatePhoneDisplay, corporatePhoneHref } from '../data/companyContact';
import { openPreferences } from '../lib/cookieConsent';
import { getPathForPage } from '../seo';

export function Footer({ onNavigate, appLanguage = 'tr' }) {
  const t = (tr, en) => (appLanguage === 'en' ? en : tr);
  const handleNav = (event, page) => {
    if (typeof onNavigate === 'function') {
      event.preventDefault();
      onNavigate(page);
    }
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <a href={getPathForPage('home')} onClick={(event) => handleNav(event, 'home')} aria-label={t('Ana sayfaya git', 'Go to homepage')}>
              <img className="brand-mark brand-mark--footer" src="/images/logo-new.png" alt="Konuşmatik" />
              <span className="footer-brand-name">Konuşmatik</span>
            </a>
          </div>
          <p className="footer-desc">{t(
            'Yapay zeka destekli seslendirme ve deşifre platformu. Bulutta kullanın; kurumlar için local/on-prem kurulumla kendi altyapınızda çalıştırın.',
            'AI-powered text-to-speech and transcription platform. Use it in the cloud or run it on your own infrastructure with local/on-prem setup.'
          )}</p>
          <div className="social-links">
            <a className="social-icon footer-contact-icon" href={corporatePhoneHref} aria-label={`${t('Ara', 'Call')}: ${corporatePhoneDisplay}`} title={corporatePhoneDisplay}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5.4 3.8h3.1l1.6 4.1-2 1.7a15.2 15.2 0 0 0 6.3 6.3l1.7-2 4.1 1.6v3.1a1.8 1.8 0 0 1-1.9 1.8A16.5 16.5 0 0 1 3.6 5.7a1.8 1.8 0 0 1 1.8-1.9Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a className="social-icon" href="https://www.linkedin.com/company/deepzeka" target="_blank" rel="noreferrer" aria-label="DeepZeka LinkedIn">in</a>
            <a className="social-icon" href="https://www.instagram.com/deepzeka?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D" target="_blank" rel="noreferrer" aria-label="DeepZeka Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
              </svg>
            </a>
            <a className="social-icon footer-contact-icon" href="https://www.deepzeka.com/" target="_blank" rel="noopener noreferrer" aria-label={t('DeepZeka web sitesi', 'DeepZeka website')} title="www.deepzeka.com">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M3.5 12h17M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21c-2.2-2.4-3.3-5.4-3.3-9S9.8 5.4 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </a>
          </div>
          <p className="footer-copyright">
            {t(`© ${new Date().getFullYear()} Konuşmatik. Tüm hakları saklıdır.`, `© ${new Date().getFullYear()} Konusmatik. All rights reserved.`)}
          </p>
        </div>
        <div className="footer-col">
          <h3>{t('Menü', 'Menu')}</h3>
          <ul>
            <li><a href={getPathForPage('home')} onClick={(e) => handleNav(e, 'home')}>{t('Ana Sayfa', 'Home')}</a></li>
            <li><a href="/rehber/">{t('Rehber', 'Guides')}</a></li>
            <li><a href="/cozumler/">{t('Çözümler', 'Solutions')}</a></li>
            <li><a href={getPathForPage('tts')} onClick={(e) => handleNav(e, 'tts')}>{t('Seslendirme', 'Text to Speech')}</a></li>
            <li><a href={getPathForPage('asr')} onClick={(e) => handleNav(e, 'asr')}>{t('Deşifre', 'Transcription')}</a></li>
            <li><a href={getPathForPage('corporate')} onClick={(e) => handleNav(e, 'corporate')}>{t('Kurumsal', 'Enterprise')}</a></li>
            <li><a href="/api-dokumantasyon" onClick={(e) => handleNav(e, 'api-docs')}>{t('API Dokümantasyonu', 'API Documentation')}</a></li>
            <li><a href={getPathForPage('contact')} onClick={(e) => handleNav(e, 'contact')}>{t('İletişim', 'Contact')}</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>{t('Şirket', 'Company')}</h3>
          <ul>
            <li><a href={getPathForPage('corporate')} onClick={(e) => handleNav(e, 'corporate')}>{t('Hakkımızda', 'About Us')}</a></li>
            <li><a href={getPathForPage('contact')} onClick={(e) => handleNav(e, 'contact')}>{t('İletişim', 'Contact')}</a></li>
            <li><a href="/gizlilik-politikasi/" onClick={(e) => handleNav(e, 'privacy')}>{t('Gizlilik Politikası', 'Privacy Policy')}</a></li>
            <li><a href="/kullanim-kosullari/" onClick={(e) => handleNav(e, 'terms')}>{t('Kullanım Koşulları', 'Terms of Use')}</a></li>
            <li><a href="/kvkk-aydinlatma-metni/" onClick={(e) => handleNav(e, 'kvkk')}>{t('KVKK Aydınlatma Metni', 'KVKK Notice')}</a></li>
            <li><a href="/cerez-politikasi/" onClick={(e) => handleNav(e, 'cookies')}>{t('Çerez Politikası', 'Cookie Policy')}</a></li>
            <li><button type="button" className="footer-cookie-preferences" onClick={openPreferences}>{t('Çerez Tercihlerini Yönet', 'Cookie Preferences')}</button></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
