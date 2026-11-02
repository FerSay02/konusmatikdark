import { useEffect, useEffectEvent, useRef, useState } from 'react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
const scriptUrl = 'https://accounts.google.com/gsi/client';
let activeFlow = false;

function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${scriptUrl}"]`);
    if (script?.dataset.failed) { script.remove(); script = null; }
    if (!script) {
      script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      document.head.appendChild(script);
    }
    const timer = window.setTimeout(() => finish(false), 8000);
    function finish(ok) {
      window.clearTimeout(timer);
      script.removeEventListener('load', loaded);
      script.removeEventListener('error', failed);
      if (!ok) script.dataset.failed = 'true';
      ok ? resolve() : reject(new Error('SDK_UNAVAILABLE'));
    }
    const loaded = () => finish(Boolean(window.google?.accounts?.id));
    const failed = () => finish(false);
    script.addEventListener('load', loaded);
    script.addEventListener('error', failed);
  });
}

export default function GoogleSignInButton({ language = 'tr', onPrepare, onCredential, onError, theme = 'outline', enabled = false, busy = false, autoPrepare = false, showCancel = true }) {
  const host = useRef(null);
  const cleanup = useRef(null);
  const mounted = useRef(true);
  const generation = useRef(0);
  const expiry = useRef(null);
  const [stage, setStage] = useState('idle');
  const en = language === 'en';
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; generation.current += 1; window.clearTimeout(expiry.current); cleanup.current?.(); }; }, []);

  const end = () => {
    generation.current += 1;
    window.clearTimeout(expiry.current);
    cleanup.current?.();
    cleanup.current = null;
    if (mounted.current) setStage('idle');
  };

  const start = async () => {
    if (activeFlow || busy || stage !== 'idle') return;
    if (!navigator.locks) { onError?.('LOCK_UNAVAILABLE'); return; }
    activeFlow = true;
    const run = ++generation.current;
    setStage('loading');
    let release;
    const held = new Promise((resolve) => { release = resolve; });
    cleanup.current = () => { release(); activeFlow = false; };
    try {
      let grant;
      const acquired = new Promise((resolve) => { grant = resolve; });
      navigator.locks.request('konusmatik-google-auth', { ifAvailable: true }, async (lock) => {
        grant(Boolean(lock));
        if (lock) await held;
      }).catch(() => grant(false));
      if (!await acquired) throw new Error('FLOW_BUSY');
      if (!mounted.current || generation.current !== run) return;
      const { nonce } = await onPrepare();
      if (!nonce) throw new Error('INVALID_NONCE');
      if (!mounted.current || generation.current !== run) return;
      await loadGoogle();
      if (!mounted.current || generation.current !== run) return;
      let used = false;
      window.google.accounts.id.initialize({
        client_id: clientId, ux_mode: 'popup', nonce, auto_select: false,
        callback: async (result) => {
          if (!mounted.current || generation.current !== run || used) return;
          used = true;
          window.clearTimeout(expiry.current);
          setStage('verifying');
          try { await onCredential(result?.credential); } finally { end(); }
        },
        error_callback: () => { if (generation.current === run) { onError?.('CANCELLED'); end(); } },
      });
      setStage('ready');
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      if (!mounted.current || generation.current !== run || !host.current) return;
      host.current.replaceChildren();
      const targetWidth = Math.max(240, Math.min(Math.round(host.current.clientWidth || 320), 400));
      window.google.accounts.id.renderButton(host.current, {
        type: 'standard',
        theme,
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: targetWidth,
        locale: language === 'en' ? 'en' : 'tr',
      });
      expiry.current = window.setTimeout(() => { onError?.('EXPIRED'); end(); }, 290000);
    } catch (error) {
      if (generation.current === run) { onError?.(error?.status || error?.message || 'FAILED'); end(); }
    }
  };

  useEffect(() => {
    if (stage === 'ready' && host.current && window.google?.accounts?.id?.renderButton) {
      host.current.replaceChildren();
      const targetWidth = Math.max(240, Math.min(Math.round(host.current.clientWidth || 320), 400));
      window.google.accounts.id.renderButton(host.current, {
        type: 'standard',
        theme,
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: targetWidth,
        locale: language === 'en' ? 'en' : 'tr',
      });
    }
  }, [language, theme, stage]);

  const prepareAutomatically = useEffectEvent(() => { if (autoPrepare && enabled && clientId && !busy) start(); });
  useEffect(() => {
    const timer = window.setTimeout(() => prepareAutomatically(), 0);
    return () => window.clearTimeout(timer);
  }, [autoPrepare, enabled, busy]);

  if (!enabled || !clientId || !onPrepare || !onCredential) return <div className="google-sign-in-disabled">
    <button type="button" disabled>{en ? 'Continue with Google' : 'Google ile devam et'}</button>
    <p>{en ? 'Google sign-in will be available after secure server verification is connected.' : 'Güvenli sunucu doğrulaması bağlandığında Google ile giriş kullanılabilir olacak.'}</p>
  </div>;
  return <div className="google-sign-in" aria-busy={busy || stage === 'loading' || stage === 'verifying'}>
    {stage === 'idle' && (
      <button
        type="button"
        className="google-sign-in-retry"
        disabled={busy}
        onClick={start}
        aria-label={en ? 'Sign in with Google' : 'Google ile giriş yap (Google ile devam edin)'}
      >
        <svg className="google-icon-svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '8px' }}>
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.665-5.17 3.665-9.14Z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.13C3.25 21.31 7.31 24 12 24Z"/>
          <path fill="#FBBC05" d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.27C.46 8.21 0 10.05 0 12s.46 3.79 1.27 5.41l4.01-3.13Z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.59l4.01 3.13c.95-2.83 3.6-4.97 6.72-4.97Z"/>
        </svg>
        <span>{en ? 'Sign in with Google' : 'Google ile giriş yap'}</span>
      </button>
    )}
    {stage === 'loading' && (
      <div className="google-sign-in-loading-skeleton" role="status" aria-live="polite">
        <span className="google-loading-spinner" aria-hidden="true" />
        <span>{en ? 'Preparing Google sign-in…' : 'Google girişi hazırlanıyor…'}</span>
      </div>
    )}
    {stage === 'verifying' && (
      <div className="google-sign-in-loading-skeleton" role="status" aria-live="polite">
        <span className="google-loading-spinner" aria-hidden="true" />
        <span>{en ? 'Verifying session…' : 'Doğrulanıyor…'}</span>
      </div>
    )}
    <div
      ref={host}
      className="google-btn-rendered-host"
      style={{ display: stage === 'ready' ? 'flex' : 'none', justifyContent: 'center', width: '100%' }}
      aria-label={en ? 'Sign in with Google' : 'Google ile giriş yap'}
    />
    {stage === 'ready' && showCancel && <button className="google-sign-in-cancel" type="button" onClick={() => { onError?.('CANCELLED'); end(); }}>{en ? 'Cancel' : 'Vazgeç'}</button>}
  </div>;
}
