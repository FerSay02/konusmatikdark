import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';
import Home from './pages/Home';
import TTS from './pages/TTS';
import ASR from './pages/ASR';
import Pricing from './pages/Pricing';
import Corporate from './pages/Corporate';
import ApiDocs from './pages/ApiDocs';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import Checkout from './pages/Checkout';
import PaymentResult from './pages/PaymentResult';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { Footer } from './components/Footer';
import PillNav from './components/PillNav';
import StarBorder from './components/StarBorder';
import { Seo } from './components/Seo';
import { apiJson, resetAuthState } from './lib/api';
import { useLanguagePreference } from './lib/language';
import { applyTheme, getInitialTheme, THEME_STORAGE_KEY } from './lib/theme';
import { getPageForPath, getPathForPage } from './seo';
import './application-light-theme.css';

function readStoredCheckoutPlan() {
  try {
    const stored = sessionStorage.getItem('konusmatik_checkout_plan');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function App() {
  const initialPage = useMemo(() => {
    const paymentState = new URLSearchParams(window.location.search).get('payment');
    const path = window.location.pathname;
    if (path === '/payment/success' || paymentState === 'success') return 'payment-success';
    if (path === '/payment/fail' || paymentState === 'failed' || paymentState === 'fail') return 'payment-fail';
    const pageFromPath = getPageForPath(path);
    if (pageFromPath) return pageFromPath;
    return paymentState ? 'pricing' : 'home';
  }, []);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [theme, setTheme] = useState(() => getInitialTheme());
  const [currentUser, setCurrentUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(() => readStoredCheckoutPlan());
  const [ttsPrefill, setTtsPrefill] = useState({
    engineVersion: 'v1',
    voiceId: 'woman',
    text: '',
    format: 'mp3',
  });
  const [useTtsPrefill, setUseTtsPrefill] = useState(false);
  const [asrPrefill, setAsrPrefill] = useState({
    file: null,
    fileName: '',
    jobName: '',
    punctuation: true,
    slangFilter: true,
  });
  const [useAsrPrefill, setUseAsrPrefill] = useState(false);
  const authRequestIdRef = useRef(0);
  const { language, isEnglish, toggleLanguage } = useLanguagePreference();
  const t = (tr, en) => (language === 'en' ? en : tr);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    let hasManualTheme = false;
    try {
      hasManualTheme = Boolean(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      // Fall back to the current theme when storage is unavailable.
    }
    if (hasManualTheme) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemTheme = (event) => setTheme(event.matches ? 'light' : 'dark');
    media.addEventListener?.('change', handleSystemTheme);
    return () => media.removeEventListener?.('change', handleSystemTheme);
  }, []);

  const toggleTheme = () => setTheme((currentTheme) => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // Keep the active theme in memory when storage is unavailable.
    }
    return nextTheme;
  });

  const goToPage = useCallback((page, { replace = false } = {}) => {
    setMobileMenuOpen(false);
    if (page !== 'tts') setUseTtsPrefill(false);
    if (page !== 'asr') setUseAsrPrefill(false);
    const nextPath = getPathForPage(page);
    if (nextPath && window.location.pathname !== nextPath) {
      const method = replace ? 'replaceState' : 'pushState';
      window.history[method]({ page }, '', nextPath);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handlePopState = () => {
      const paymentState = new URLSearchParams(window.location.search).get('payment');
      if (window.location.pathname === '/payment/success' || paymentState === 'success') {
        setCurrentPage('payment-success');
        return;
      }
      if (window.location.pathname === '/payment/fail' || paymentState === 'failed' || paymentState === 'fail') {
        setCurrentPage('payment-fail');
        return;
      }
      setCurrentPage(getPageForPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const requestId = ++authRequestIdRef.current;

    apiJson('/api/v1/auth/me', { skipAuthExpiredEvent: true })
      .then((user) => {
        if (isMounted && requestId === authRequestIdRef.current) setCurrentUser(user);
      })
      .catch(() => {
        if (isMounted && requestId === authRequestIdRef.current) setCurrentUser(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAuthenticated = (user) => {
    resetAuthState();
    authRequestIdRef.current += 1;
    setCurrentUser(user);
    goToPage('home');
  };

  const handleUserUpdated = useCallback((user) => {
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const protectedPages = new Set(['profile', 'admin', 'checkout']);
    const handleAuthExpired = () => {
      if (import.meta.env.DEV) {
        console.warn('[AUTH_LOGOUT]', {
          reason: 'auth-expired-event',
          pathname: window.location.pathname,
          authState: currentUser ? 'authenticated' : 'unauthenticated',
          userRole: currentUser?.role || null,
          hasAccessToken: false,
          hasRefreshToken: false,
        });
      }
      setCurrentUser(null);
      if (currentUser || protectedPages.has(currentPage)) {
        goToPage('login');
      }
    };

    window.addEventListener('konusmatik:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('konusmatik:auth-expired', handleAuthExpired);
  }, [currentPage, currentUser, goToPage]);

  const handleLogout = async () => {
    if (import.meta.env.DEV) {
      console.warn('[AUTH_LOGOUT]', {
        reason: 'manual-logout',
        pathname: window.location.pathname,
        authState: currentUser ? 'authenticated' : 'unauthenticated',
        userRole: currentUser?.role || null,
        hasAccessToken: false,
        hasRefreshToken: false,
      });
    }
    await apiJson('/api/v1/auth/logout', { method: 'POST' }).catch(() => null);
    setCurrentUser(null);
    goToPage('home');
  };

  const currentUserRole = String(currentUser?.role || '').toLowerCase();
  const isAdminUser = currentUserRole === 'admin' || currentUser?.is_admin === true || currentUser?.isAdmin === true;
  const showProfileNavLink = Boolean(currentUser) && !isAdminUser;

  const openTtsFromHome = (prefill) => {
    setTtsPrefill(prefill);
    setUseTtsPrefill(true);
    setCurrentPage('tts');
  };

  const openAsrFromHome = (prefill) => {
    setAsrPrefill(prefill);
    setUseAsrPrefill(true);
    setCurrentPage('asr');
  };

  const openCheckout = (plan) => {
    setCheckoutPlan(plan);
    sessionStorage.setItem('konusmatik_checkout_plan', JSON.stringify(plan));
    goToPage('checkout');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onGoTts={openTtsFromHome} onGoAsr={openAsrFromHome} onNavigate={goToPage} appLanguage={language} />;
      case 'tts':
        return <TTS prefill={useTtsPrefill ? ttsPrefill : null} onNavigate={goToPage} appLanguage={language} />;
      case 'asr':
        return <ASR prefill={useAsrPrefill ? asrPrefill : null} onNavigate={goToPage} appLanguage={language} />;
      case 'pricing':
        return <Pricing currentUser={currentUser} onNavigate={goToPage} onCheckout={openCheckout} appLanguage={language} />;
      case 'checkout':
        return <Checkout currentUser={currentUser} selectedPlan={checkoutPlan} onNavigate={goToPage} appLanguage={language} />;
      case 'corporate':
        return <Corporate onNavigate={goToPage} appLanguage={language} />;
      case 'api-docs':
        return <ApiDocs onNavigate={goToPage} appLanguage={language} />;
      case 'contact':
        return <Contact appLanguage={language} />;
      case 'login':
        return <Login onAuthenticated={handleAuthenticated} appLanguage={language} />;
      case 'profile':
        return <Profile currentUser={currentUser} onUserUpdated={handleUserUpdated} onNavigate={goToPage} appLanguage={language} />;
      case 'admin':
        return <Admin currentUser={currentUser} onNavigate={goToPage} appLanguage={language} />;
      case 'payment-success':
        return <PaymentResult status="success" onNavigate={goToPage} appLanguage={language} />;
      case 'payment-fail':
        return <PaymentResult status="fail" onNavigate={goToPage} appLanguage={language} />;
      default:
        return <NotFound onGoHome={() => goToPage('home')} appLanguage={language} />;
    }
  };

  return (
    <>
      <Seo page={currentPage} appLanguage={language} />
      <nav className={`navbar${mobileMenuOpen ? ' menu-open' : ''}`}>
        <StarBorder as="div" className="navbar-star-border" color="#d21784" speed="5s" thickness={2} backgroundColor="#ffffff" borderColor="rgba(108, 60, 233, 0.18)">
        <PillNav
          logo="/images/logo-new.png"
          logoAlt="Konuşmatik"
          items={[
            { page: 'home', href: getPathForPage('home'), label: t('Keşfet', 'Explore') },
            { page: 'tts', href: getPathForPage('tts'), label: t('Seslendirme', 'Text to Speech') },
            { page: 'asr', href: getPathForPage('asr'), label: t('Deşifre', 'Transcription') },
            { page: 'pricing', href: getPathForPage('pricing'), label: t('Fiyatlar', 'Pricing') },
            { page: 'corporate', href: getPathForPage('corporate'), label: t('Kurumsal', 'Enterprise') },
            { page: 'api-docs', href: getPathForPage('api-docs'), label: 'API' },
            { page: 'contact', href: getPathForPage('contact'), label: t('İletişim', 'Contact') },
            ...(showProfileNavLink ? [{ page: 'profile', href: getPathForPage('profile'), label: t('Profil', 'Profile') }] : []),
          ]}
          activeHref={getPathForPage(currentPage)}
          onNavigate={goToPage}
          className="konusmatik-pill-nav"
          ease="power2.out"
          baseColor="#ffffff"
          pillColor="#ffffff"
          hoveredPillTextColor="#6c3ce9"
          pillTextColor="#1e1b4b"
          initialLoadAnimation
          rightContent={(
            <div className="navbar-account-actions">
              <button
                type="button"
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
                title={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
              >
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5 8.5 8.5 0 1 0 20.5 14.6Z" /></svg>
                )}
              </button>
              <div className="nav-language">
                <button type="button" className="language-toggle" onClick={toggleLanguage} aria-label={isEnglish ? 'Switch to Turkish' : 'İngilizceye geç'}>
                  <span className={language === 'tr' ? 'active' : ''}>TR</span>
                  <span className={language === 'en' ? 'active' : ''}>EN</span>
                </button>
              </div>
              <div className="nav-actions">
                {currentUser ? (
                  <>
                    {isAdminUser && <button type="button" className={`nav-action-link ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => goToPage('admin')}>Admin</button>}
                    <button type="button" className={`nav-user-name nav-user-button${currentPage === 'profile' ? ' active' : ''}`} onClick={() => goToPage('profile')}>{currentUser.full_name || currentUser.email}</button>
                    <button type="button" className="btn-nav-login" onClick={handleLogout}>{t('Çıkış Yap', 'Log Out')}</button>
                  </>
                ) : (
                  <button type="button" className={`btn-nav-login${currentPage === 'login' ? ' active' : ''}`} onClick={() => goToPage('login')}>{t('Giriş Yap', 'Log In')}</button>
                )}
              </div>
            </div>
          )}
        />
        </StarBorder>
        <div className="nav-container">
          <a
            href={getPathForPage('home')}
            className="logo logo--brand"
            onClick={(event) => {
              event.preventDefault();
              goToPage('home');
            }}
            aria-label={t('Konuşmatik ana sayfa', 'Konusmatik home page')}
          >
            <img className="brand-mark brand-mark--header" src="/images/logo-new.png" alt="" aria-hidden="true" />
          </a>
          <button
            type="button"
            className="nav-menu-toggle"
            aria-expanded={mobileMenuOpen}
            aria-controls="primary-navigation"
            aria-label={mobileMenuOpen ? t('Menüyü kapat', 'Close menu') : t('Menüyü aç', 'Open menu')}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <div id="primary-navigation" className="nav-mobile-panel">
            <ul className="nav-links">
              <li><button type="button" className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} onClick={() => goToPage('home')}>{t('Keşfet', 'Explore')}</button></li>
              <li><button type="button" className={`nav-item ${currentPage === 'tts' ? 'active' : ''}`} onClick={() => goToPage('tts')}>{t('Seslendirme', 'Text to Speech')}</button></li>
              <li><button type="button" className={`nav-item ${currentPage === 'asr' ? 'active' : ''}`} onClick={() => goToPage('asr')}>{t('Deşifre', 'Transcription')}</button></li>
              <li><button type="button" className={`nav-item ${currentPage === 'pricing' ? 'active' : ''}`} onClick={() => goToPage('pricing')}>{t('Fiyatlar', 'Pricing')}</button></li>
              <li><button type="button" className={`nav-item ${currentPage === 'corporate' ? 'active' : ''}`} onClick={() => goToPage('corporate')}>{t('Kurumsal', 'Enterprise')}</button></li>
              <li><button type="button" className={`nav-item ${currentPage === 'api-docs' ? 'active' : ''}`} onClick={() => goToPage('api-docs')}>API</button></li>
              <li><button type="button" className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`} onClick={() => goToPage('contact')}>{t('İletişim', 'Contact')}</button></li>
              {showProfileNavLink && <li><button type="button" className={`nav-item ${currentPage === 'profile' ? 'active' : ''}`} onClick={() => goToPage('profile')}>{t('Profil', 'Profile')}</button></li>}
            </ul>
            <div className="nav-mobile-footer">
              <div className="nav-language">
                <button type="button" className="language-toggle" onClick={toggleLanguage} aria-label={isEnglish ? 'Switch to Turkish' : 'İngilizceye geç'}>
                  <span className={language === 'tr' ? 'active' : ''}>TR</span>
                  <span className={language === 'en' ? 'active' : ''}>EN</span>
                </button>
              </div>
              <div className="nav-actions">
                {currentUser ? (
                  <>
                    {isAdminUser && <button type="button" className={`nav-action-link ${currentPage === 'admin' ? 'active' : ''}`} onClick={() => goToPage('admin')}>Admin</button>}
                    <button type="button" className={`nav-user-name nav-user-button${currentPage === 'profile' ? ' active' : ''}`} onClick={() => goToPage('profile')}>{currentUser.full_name || currentUser.email}</button>
                    <button type="button" className="btn-nav-login" onClick={handleLogout}>{t('Çıkış Yap', 'Log Out')}</button>
                  </>
                ) : (
                  <button type="button" className={`btn-nav-login${currentPage === 'login' ? ' active' : ''}`} onClick={() => goToPage('login')}>{t('Giriş Yap', 'Log In')}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      {renderPage()}
      <Footer onNavigate={goToPage} appLanguage={language} />
    </>
  );
}

export default App;
