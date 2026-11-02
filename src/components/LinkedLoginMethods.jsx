import { useEffect, useState } from 'react';
import GoogleSignInButton from './GoogleSignInButton';
import { beginGoogleLink, completeGoogleLink, getIdentities, googleAuthConfigured } from '../lib/authAdapter';
import { googleErrorMessage } from '../lib/googleMessages';

export default function LinkedLoginMethods({ language, t }) {
  const [identities, setIdentities] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [initiated, setInitiated] = useState(false);

  useEffect(() => {
    let active = true;
    getIdentities().then((data) => { if (active) setIdentities(data); }).catch(() => { if (active) setError(t('Giriş yöntemleri yüklenemedi.', 'Sign-in methods could not be loaded.')); });
    return () => { active = false; };
  }, [t]);

  const linked = identities?.providers?.some((item) => item.provider === 'google' && item.linked);
  const prepare = async () => {
    setInitiated(true);
    setError('');
    setSuccess('');
    try { return await beginGoogleLink(password); }
    finally { setPassword(''); setConfirm(false); }
  };
  const complete = async (credential) => {
    setBusy(true);
    try {
      await completeGoogleLink(credential);
      setIdentities(await getIdentities());
      setSuccess(t('Hesap bağlama başarılı.', 'Account linked successfully.'));
      setOpen(false);
    } catch (err) { setError(googleErrorMessage(err.status, language, true)); }
    finally { setPassword(''); setBusy(false); setInitiated(false); }
  };

  return <section className="corp-block linked-methods" aria-labelledby="linked-methods-title">
    <div className="contact-section-heading"><h2 id="linked-methods-title">{t('Bağlı Giriş Yöntemleri', 'Linked sign-in methods')}</h2><p>{t('Hesabınıza giriş yapmak için kullandığınız yöntemleri yönetin.', 'Manage the methods you use to sign in to your account.')}</p></div>
    <div className="linked-methods-card">
      {!identities && !error && <p role="status">{t('Yükleniyor…', 'Loading…')}</p>}
      {identities && <>
        <div className="linked-methods-status">
          <div className="linked-methods-row"><div><strong>Google</strong><p>{linked ? t('Google hesabınızla giriş yapabilirsiniz.', 'You can sign in with your Google account.') : t('Google hesabınızı bağlayarak daha hızlı giriş yapın.', 'Link your Google account for faster sign-in.')}</p></div><span className={`linked-methods-badge${linked ? ' is-linked' : ''}`}>{linked ? t('Google Bağlı', 'Google linked') : t('Bağlı değil', 'Not linked')}</span></div>
          <div className="linked-methods-row"><div><strong>{t('Şifre', 'Password')}</strong><p>{identities.has_password ? t('Şifreli giriş kullanılabilir.', 'Password sign-in is available.') : t('Şifreli giriş bulunmuyor.', 'Password sign-in is not available.')}</p></div><span className={`linked-methods-badge${identities.has_password ? ' is-linked' : ''}`}>{identities.has_password ? t('Aktif', 'Active') : t('Kullanılamıyor', 'Unavailable')}</span></div>
        </div>
        {!linked && identities.has_password && googleAuthConfigured && !open && <button type="button" className="profile-primary-btn linked-methods-open" onClick={() => setOpen(true)}>{t('Google Hesabını Bağla', 'Link Google account')}</button>}
        {!linked && !identities.has_password && <p>{t('Bu hesap için Google bağlama henüz desteklenmiyor.', 'Google linking is not yet supported for this account.')}</p>}
        {open && !linked && <div className="linked-methods-verify">
          <div className="linked-methods-verify-heading"><h3>{t('Yeniden Şifre Doğrulaması', 'Re-enter your password')}</h3><p>{initiated ? t('Devam etmek için Google hesabınızı seçin.', 'Choose your Google account to continue.') : t('Güvenliğiniz için mevcut şifrenizi girin ve bağlantıyı onaylayın.', 'For your security, enter your current password and confirm the link.')}</p></div>
          {!initiated && <>
            <label className="linked-methods-password">{t('Mevcut şifre', 'Current password')}<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
            <label className="linked-methods-confirm"><input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} /><span>{t('Google hesabımı bağlamak istiyorum.', 'I want to link my Google account.')}</span></label>
          </>}
          {((password && confirm) || initiated) && <div className="linked-methods-google"><GoogleSignInButton language={language} enabled={!busy} showCancel={false} onPrepare={prepare} onCredential={complete} onError={(code) => { setPassword(''); setConfirm(false); setInitiated(false); setError(googleErrorMessage(code, language, true)); }} /></div>}
          <button type="button" className="profile-secondary-btn linked-methods-cancel" disabled={busy} onClick={() => { setPassword(''); setConfirm(false); setInitiated(false); setOpen(false); }}>{t('Vazgeç', 'Cancel')}</button>
        </div>}
      </>}
      {error && <p className="profile-alert error" role="alert">{error}</p>}
      {success && <p className="profile-alert success" role="status">{success}</p>}
    </div>
  </section>;
}
