import './Footer.theme.css';

export function Footer({ onNavigate, appLanguage = 'tr' }) {
  const t = (tr, en) => (appLanguage === 'en' ? en : tr);
  const handleNav = (event, page) => {
    event.preventDefault();
    if (typeof onNavigate === 'function') onNavigate(page);
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-col brand-col">
          <div className="footer-logo">
            <a href="#" onClick={(event) => handleNav(event, 'home')} aria-label={t('Ana sayfaya git', 'Go to homepage')}>
              <img className="brand-mark brand-mark--footer" src="/images/logo-new.png" alt="Konuşmatik" />
              <span className="footer-brand-name">Konuşmatik</span>
            </a>
          </div>
          <p className="footer-desc">{t(
            'Yapay zeka destekli seslendirme ve deşifre platformu. Bulutta kullanın; kurumlar için local/on-prem kurulumla kendi altyapınızda çalıştırın.',
            'AI-powered text-to-speech and transcription platform. Use it in the cloud or run it on your own infrastructure with local/on-prem setup.'
          )}</p>
          <div className="social-links">
            <a className="social-icon" href="https://www.linkedin.com/company/deepzeka" target="_blank" rel="noreferrer" aria-label="DeepZeka LinkedIn">in</a>
            <a className="social-icon" href="https://www.instagram.com/deepzeka?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw%3D%3D" target="_blank" rel="noreferrer" aria-label="DeepZeka Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
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
            <li><a href="#" onClick={(e) => handleNav(e, 'home')}>{t('Keşfet', 'Explore')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'tts')}>{t('Seslendirme', 'Text to Speech')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'asr')}>{t('Deşifre', 'Transcription')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'pricing')}>{t('Fiyatlar', 'Pricing')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'corporate')}>{t('Kurumsal', 'Enterprise')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'api-docs')}>{t('API Dokümantasyonu', 'API Documentation')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'contact')}>{t('İletişim', 'Contact')}</a></li>
          </ul>
        </div>
        <div className="footer-col">
          <h3>{t('Şirket', 'Company')}</h3>
          <ul>
            <li><a href="#" onClick={(e) => handleNav(e, 'corporate')}>{t('Hakkımızda', 'About Us')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'pricing')}>{t('Fiyatlandırma', 'Pricing')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'corporate')}>{t('Local Kurulum', 'Local Setup')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'api-docs')}>{t('Geliştirici API', 'Developer API')}</a></li>
            <li><a href="#" onClick={(e) => handleNav(e, 'contact')}>{t('İletişim', 'Contact')}</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
