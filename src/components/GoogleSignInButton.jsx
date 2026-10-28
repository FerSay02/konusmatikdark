import { useEffect, useRef, useState } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
const scriptUrl = 'https://accounts.google.com/gsi/client';

// The backend owner supplies onCredential after defining a verified token exchange.
// Never create a session or persist the Google credential in this component.
export default function GoogleSignInButton({ language = 'tr', onCredential, onError, theme = 'outline', enabled = false, busy = false }) {
  const hostRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const available = Boolean(enabled && clientId && onCredential);

  useEffect(() => {
    if (!available) return undefined;
    let active = true;
    const render = () => {
      if (!active || !hostRef.current) return;
      if (!window.google?.accounts?.id) {
        setStatus('error');
        onError?.('SDK_UNAVAILABLE');
        return;
      }
      try {
        hostRef.current.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: clientId, ux_mode: 'popup',
          callback: (response) => { if (active) onCredential(response?.credential); },
          auto_select: false,
        });
        window.google.accounts.id.renderButton(hostRef.current, {
          type: 'standard', theme, size: 'large', text: 'continue_with',
          shape: 'rectangular', width: Math.min(hostRef.current.clientWidth || 320, 400), locale: language,
        });
        setStatus('ready');
      } catch {
        setStatus('error');
        onError?.('SDK_RENDER_FAILED');
      }
    };
    if (window.google?.accounts?.id) {
      render();
    } else {
      let script = document.querySelector(`script[src="${scriptUrl}"]`);
      if (!script) {
        script = document.createElement('script');
        script.src = scriptUrl;
        script.async = true;
        document.head.appendChild(script);
      }
      const fail = () => { if (active) { setStatus('error'); onError?.('SDK_UNAVAILABLE'); } };
      const timeout = window.setTimeout(() => {
        if (active && !window.google?.accounts?.id) fail();
      }, 8000);
      script.addEventListener('load', render);
      script.addEventListener('error', fail);
      return () => {
        active = false;
        window.clearTimeout(timeout);
        script.removeEventListener('load', render);
        script.removeEventListener('error', fail);
      };
    }
    return () => { active = false; };
  }, [available, language, onCredential, onError, theme]);

  if (!available) return (
    <div className="google-sign-in-disabled" aria-label={language === 'en' ? 'Google sign-in unavailable' : 'Google ile giriş kullanılamıyor'}>
      <button type="button" disabled>{language === 'en' ? 'Continue with Google' : 'Google ile devam et'}</button>
      <p>{language === 'en' ? 'Google sign-in will be available after secure server verification is connected.' : 'Güvenli sunucu doğrulaması bağlandığında Google ile giriş kullanılabilir olacak.'}</p>
    </div>
  );
  return <div className="google-sign-in" aria-busy={busy || status === 'loading'}>
    <div ref={hostRef} role="group" aria-label={language === 'en' ? 'Continue with Google' : 'Google ile devam et'} />
    {status === 'loading' && <p role="status">{language === 'en' ? 'Loading Google sign-in…' : 'Google ile giriş yükleniyor…'}</p>}
    {busy && <p role="status">{language === 'en' ? 'Verifying your account…' : 'Hesabınız doğrulanıyor…'}</p>}
    {status === 'error' && <p role="alert">{language === 'en' ? 'Google sign-in could not load. Please try again later.' : 'Google ile giriş yüklenemedi. Lütfen daha sonra tekrar deneyin.'}</p>}
  </div>;
}
