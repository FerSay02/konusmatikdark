import { useCallback, useEffect, useRef, useState } from 'react';
import { apiJson } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GoogleRegistrationOnboarding from '../components/GoogleRegistrationOnboarding';
import { completeGoogleRegistration, emailRegistrationEnabled, googleAuthConfigured, googleOnboardingConfigured, registerWithEmail, signInWithEmail, signInWithGoogle, termsVersion } from '../lib/authAdapter';
import { legalPageDocuments, legalPageSections } from './legalContent';
import './Login.polish.css';
import './Login.legal-dialog.css';

const rememberedEmailKey = 'konusmatik_remembered_email';

function PasswordVisibilityIcon({ visible }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.1 12s3.6-7 9.9-7 9.9 7 9.9 7-3.6 7-9.9 7-9.9-7-9.9-7Z" />
      <circle cx="12" cy="12" r="3" />
      {visible && <path d="m3 3 18 18" />}
    </svg>
  );
}

export default function Login({ onAuthenticated, appLanguage, appTheme }) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = useCallback((tr, en) => (isEnglish ? en : restoreTurkishUiText(tr)), [isEnglish]);
  const [mode, setMode] = useState('login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(() => localStorage.getItem(rememberedEmailKey) || '');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem(rememberedEmailKey)));
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [forgotStep, setForgotStep] = useState('email');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [googleFlow, setGoogleFlow] = useState('idle');
  const [googleBusy, setGoogleBusy] = useState(false);
  const googleBusyRef = useRef(false);
  const [googleError, setGoogleError] = useState('');
  const [legalDialogType, setLegalDialogType] = useState(null);
  const legalDialogRef = useRef(null);

  useEffect(() => {
    const dialog = legalDialogRef.current;
    if (!dialog) return;
    if (legalDialogType && !dialog.open) dialog.showModal();
    else if (!legalDialogType && dialog.open) dialog.close();
  }, [legalDialogType]);

  const isRegisterMode = mode === 'register';
  const isForgotMode = mode === 'forgot';
  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm;
  const isPhoneValid = /^5\d{9}$/.test(phone);

  const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
  };

  const switchMode = (nextMode) => {
    if (nextMode === 'register' && !emailRegistrationEnabled) return;
    setMode(nextMode);
    setFullName('');
    setPhone('');
    setEmail(nextMode === 'login' ? localStorage.getItem(rememberedEmailKey) || '' : '');
    setError('');
    setSuccess('');
    setPassword('');
    setPasswordConfirm('');
    setForgotStep('email');
    setResetCode('');
    setResetToken('');
    setRememberMe(nextMode === 'login' ? Boolean(localStorage.getItem(rememberedEmailKey)) : false);
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setTermsAccepted(false);
    setMarketingConsent(false);
    setGoogleFlow('idle');
    setGoogleError('');
  };

  const handleGoogleCredential = useCallback(async (credential) => {
    if (googleBusyRef.current) return;
    googleBusyRef.current = true;
    setGoogleBusy(true);
    setGoogleError('');
    try {
      const result = await signInWithGoogle(credential);
      if (result.state === 'authenticated') {
        onAuthenticated?.(result.user);
      } else if (result.state === 'needs_legal_acceptance') {
        if (googleOnboardingConfigured) setGoogleFlow('onboarding');
        else setGoogleError(t('Kayıt onayı sunucuda henüz yapılandırılmadı.', 'Registration consent is not yet configured on the server.'));
      } else if (result.state === 'account_link_required') {
        setGoogleFlow('account_link_required');
      }
    } catch (err) {
      if (err?.code === 'BACKEND_NOT_CONFIGURED') setGoogleError(t('Google ile giriş henüz kullanılamıyor.', 'Google sign-in is not available yet.'));
      else if (err?.code === 'INVALID_CREDENTIAL') setGoogleError(t('Google doğrulaması tamamlanmadı. Tekrar deneyin.', 'Google verification did not finish. Please retry.'));
      else if (err?.code === 'ACCOUNT_LINK_REQUIRED') setGoogleFlow('account_link_required');
      else setGoogleError(t('Google ile giriş tamamlanamadı. Tekrar deneyin.', 'Google sign-in could not be completed. Please retry.'));
    } finally {
      googleBusyRef.current = false;
      setGoogleBusy(false);
    }
  }, [onAuthenticated, t]);

  const handleGoogleOnboarding = async (consent) => {
    setGoogleBusy(true);
    setGoogleError('');
    try {
      const user = await completeGoogleRegistration(consent);
      onAuthenticated?.(user);
    } catch {
      setGoogleError(t('Kayıt tamamlanamadı. Lütfen tekrar deneyin.', 'Registration could not be completed. Please retry.'));
    } finally {
      setGoogleBusy(false);
    }
  };

  const openForgotPassword = (event) => {
    event.preventDefault();
    switchMode('forgot');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (isForgotMode) {
      setIsLoading(true);

      try {
        if (forgotStep === 'email') {
          await apiJson('/api/v1/auth/password-reset/request', {
            method: 'POST',
            body: JSON.stringify({ email, language }),
          });
          setForgotStep('code');
          setSuccess(t('Dogrulama kodu e-posta adresinize gonderildi.', 'Verification code was sent to your email address.'));
        } else if (forgotStep === 'code') {
          const data = await apiJson('/api/v1/auth/password-reset/verify', {
            method: 'POST',
            body: JSON.stringify({ email, code: resetCode }),
          });
          setResetToken(data.reset_token);
          setForgotStep('password');
          setSuccess(t('Kod dogrulandi. Yeni sifrenizi belirleyebilirsiniz.', 'Code verified. You can set your new password.'));
        } else {
          if (password.length < 8) {
            setError(t('Parola en az 8 karakter olmali.', 'Password must be at least 8 characters.'));
            return;
          }

          if (password !== passwordConfirm) {
            setError(t('Parolalar eslesmiyor.', 'Passwords do not match.'));
            return;
          }

          await apiJson('/api/v1/auth/password-reset/confirm', {
            method: 'POST',
            body: JSON.stringify({
              reset_token: resetToken,
              password,
              password_confirm: passwordConfirm,
            }),
          });
          switchMode('login');
          setSuccess(t('Sifreniz guncellendi, giris yapabilirsiniz.', 'Your password has been updated. You can log in now.'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('Sifre sifirlama islemi tamamlanamadi.', 'Password reset could not be completed.'));
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (isRegisterMode) {
      if (!emailRegistrationEnabled) {
        setError(t('Yeni kayıtlar hukuki onay tamamlanana kadar kapalıdır.', 'New registrations are unavailable until legal approval is complete.'));
        return;
      }
      if (!termsAccepted) {
        setError(t('Kullanım Koşulları kabul edilmelidir.', 'Please accept the Terms of Use.'));
        return;
      }
      if (!isPhoneValid) {
        setError(t('Telefon formati yanlis girildi.', 'The phone number format is incorrect.'));
        return;
      }

      if (password.length < 8) {
        setError(t('Parola en az 8 karakter olmali.', 'Password must be at least 8 characters.'));
        return;
      }

      if (password !== passwordConfirm) {
        setError(t('Parolalar eslesmiyor.', 'Passwords do not match.'));
        return;
      }

      setIsLoading(true);

      try {
        await registerWithEmail({ email, password, full_name: fullName, phone, termsAccepted, marketingConsent });
        setMode('login');
        setFullName('');
        setPhone('');
        setPassword('');
        setPasswordConfirm('');
        setRememberMe(false);
        setTermsAccepted(false);
        setMarketingConsent(false);
        setShowPassword(false);
        setShowPasswordConfirm(false);
        setSuccess(t('Kayit tamamlandi. Giris yapabilirsiniz.', 'Registration is complete. You can log in.'));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('Kayit olusturulamadi.', 'Registration could not be created.'));
      } finally {
        setIsLoading(false);
      }

      return;
    }

    setIsLoading(true);

    try {
      const data = await signInWithEmail({ email, password });
      if (!data?.user) throw new Error(t('Oturum doğrulanamadı.', 'Session could not be verified.'));
      if (rememberMe) {
        localStorage.setItem(rememberedEmailKey, email);
      } else {
        localStorage.removeItem(rememberedEmailKey);
      }
      onAuthenticated?.(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('Giris yapilamadi.', 'Login failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const title = isForgotMode
    ? t('Şifrenizi sıfırlayın', 'Reset your password')
    : isRegisterMode
      ? t('Yeni hesap olusturun', 'Create a new account')
      : t('Hesabiniza giris yapin', 'Log in to your account');
  const subtitle = isForgotMode
    ? forgotStep === 'email'
      ? t('Hesabiniza bagli e-posta adresini girin, dogrulama kodunu gonderelim.', 'Enter the email address linked to your account and we will send a verification code.')
      : forgotStep === 'code'
        ? t('E-postaniza gelen 6 haneli dogrulama kodunu girin.', 'Enter the 6-digit verification code sent to your email.')
        : t('Yeni sifrenizi belirleyin ve hesabiniza guvenle donun.', 'Set your new password and return to your account safely.')
    : isRegisterMode
      ? t('Kayit bilgilerinizi doldurun, hesabinizi olusturmaya baslayin.', 'Fill in your registration information to create your account.')
      : t('E-posta adresiniz ve sifreniz ile panele erisin.', 'Access the panel with your email address and password.');

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-copy">
          <h1>{t('Projelerinizi kaldiginiz yerden kolayca yonetin.', 'Manage your projects easily from where you left off.')}</h1>
          <p>{t('Seslendirme, desifre ve paket kullanimini tek panelden takip edin.', 'Track text-to-speech, transcription, and package usage from one panel.')}</p>
        </div>

        <svg className="login-voice-art" viewBox="0 0 560 330" role="img" aria-label={t('Yapay zekâ ses dalgası illüstrasyonu', 'AI voice wave illustration')}>
          <defs><linearGradient id="voice-grad" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a480ff"/><stop offset=".55" stopColor="#d21784"/><stop offset="1" stopColor="#ffc7e9"/></linearGradient><radialGradient id="voice-glow"><stop stopColor="#bd78ff" stopOpacity=".7"/><stop offset="1" stopColor="#bd78ff" stopOpacity="0"/></radialGradient></defs>
          <ellipse cx="280" cy="165" rx="245" ry="150" fill="url(#voice-glow)" opacity=".45"/>
          <g className="voice-orbit" fill="none" stroke="url(#voice-grad)"><ellipse cx="280" cy="165" rx="225" ry="115" strokeWidth="1.5" opacity=".55"/><ellipse cx="280" cy="165" rx="186" ry="82" strokeWidth="2" opacity=".75"/><path d="M50 165c80-65 140 65 230 0s150-65 230 0" strokeWidth="3" opacity=".8"/></g>
          <g className="voice-bars" fill="url(#voice-grad)">{[24,46,80,126,172,112,66,36,24,56,104,148,188,148,104,56,24,36,66,112,172,126,80,46,24].map((height, index) => <rect key={index} x={75 + index * 17} y={165-height/2} width="8" height={height} rx="4" />)}</g>
          <circle cx="280" cy="165" r="8" fill="#fff"/><circle cx="280" cy="165" r="22" fill="none" stroke="#fff" opacity=".4"/>
        </svg>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <div className={`login-card ${isForgotMode ? 'login-card--forgot' : ''}`}>
          {isForgotMode && (
            <button type="button" className="login-top-back" onClick={() => switchMode('login')} aria-label={t('Giriş ekranına dön', 'Back to login')}>
              <span aria-hidden="true">←</span>
              {t('Geri', 'Back')}
            </button>
          )}
          <div className="login-card-header">
            <h2 id="login-title">{title}</h2>
            <p>{subtitle}</p>
          </div>

          {!isForgotMode && <div className="login-mode-tabs" role="group" aria-label={t('Giris veya kayit secimi', 'Login or registration selection')}>
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
              {t('Giris Yap', 'Log In')}
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} disabled={!emailRegistrationEnabled}>
              {t('Kayit Ol', 'Register')}
            </button>
          </div>}
          {!isForgotMode && !emailRegistrationEnabled && <p className="login-registration-hold" role="status">{t('Yeni kayıtlar, Kullanım Koşulları hukuken onaylanana kadar kapalıdır. Mevcut hesabınızla giriş yapabilirsiniz.', 'New registrations are unavailable until the Terms of Use receive legal approval. Existing users can still sign in.')}</p>}

          <form className={`login-form ${isRegisterMode ? 'login-form--register' : ''} ${isForgotMode ? 'login-form--forgot' : ''}`} onSubmit={handleSubmit}>
            {isRegisterMode && (
              <>
                <label className="login-register-wide">
                  {t('Ad Soyad', 'Full Name')}
                  <input type="text" placeholder={t('Adiniz Soyadiniz', 'Your full name')} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                </label>

                <label>
                  {t('Telefon', 'Phone')}
                  <input
                    type="tel"
                    placeholder="5xxxxxxxxx"
                    autoComplete="tel"
                    inputMode="numeric"
                    minLength="10"
                    maxLength="10"
                    pattern="5[0-9]{9}"
                    title={t('Telefon numarasi 5 ile baslayan 10 haneli formatta olmalidir.', 'The phone number must be 10 digits and start with 5.')}
                    value={phone}
                    onChange={handlePhoneChange}
                    required
                  />
                </label>
              </>
            )}

            {(!isForgotMode || forgotStep !== 'password') && <label className={isForgotMode ? 'login-register-wide' : ''}>
              {t('E-posta', 'Email')}
              <input type="email" placeholder="ornek@konusmatik.com" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} readOnly={isForgotMode && forgotStep === 'code'} required />
            </label>}

            {isForgotMode && forgotStep === 'code' && (
              <label className="login-register-wide">
                {t('Dogrulama Kodu', 'Verification Code')}
                <input
                  type="text"
                  placeholder="123456"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  minLength="6"
                  maxLength="6"
                  pattern="[0-9]{6}"
                  value={resetCode}
                  onChange={(event) => setResetCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
              </label>
            )}

            {(!isForgotMode || forgotStep === 'password') && <label>
              {t('Parola', 'Password')}
              <span className="login-password-field">
                <input type={showPassword ? 'text' : 'password'} placeholder={isForgotMode ? t('Yeni parolaniz', 'Your new password') : t('Parolaniz', 'Your password')} autoComplete={isRegisterMode || isForgotMode ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" title={showPassword ? t('Parolayi gizle', 'Hide password') : t('Parolayi goster', 'Show password')} aria-label={showPassword ? t('Parolayi gizle', 'Hide password') : t('Parolayi goster', 'Show password')} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
                  <PasswordVisibilityIcon visible={showPassword} />
                </button>
              </span>
            </label>}

            {(isRegisterMode || (isForgotMode && forgotStep === 'password')) && (
              <>
                <label>
                  {t('Parola Tekrar', 'Confirm Password')}
                  <span className="login-password-field">
                    <input type={showPasswordConfirm ? 'text' : 'password'} placeholder={t('Parolanizi tekrar girin', 'Enter your password again')} autoComplete="new-password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} required />
                    <button type="button" title={showPasswordConfirm ? t('Parolayi gizle', 'Hide password') : t('Parolayi goster', 'Show password')} aria-label={showPasswordConfirm ? t('Parolayi gizle', 'Hide password') : t('Parolayi goster', 'Show password')} aria-pressed={showPasswordConfirm} onClick={() => setShowPasswordConfirm((value) => !value)}>
                      <PasswordVisibilityIcon visible={showPasswordConfirm} />
                    </button>
                  </span>
                </label>

                <div className="login-password-status">
                  <div className="login-password-notes">
                    <span>{t('Minimum 8 karakter olmali', 'Must be at least 8 characters')}</span>
                    {passwordConfirm && <span className={passwordsMatch ? 'match' : 'mismatch'}>{passwordsMatch ? t('Parolalar eslesiyor', 'Passwords match') : t('Parolalar eslesmiyor', 'Passwords do not match')}</span>}
                  </div>
                </div>
              </>
            )}

            {error && <p className="login-help-text login-register-wide" role="alert">{error}</p>}
            {success && <p className="login-help-text login-register-wide" role="status">{success}</p>}
            {!error && !success && !isRegisterMode && (
              <p className="login-help-text">
                {isForgotMode ? t('E-posta gelmezse spam klasörünü kontrol edin veya destek ekibimizle iletişime geçin.', 'If the email does not arrive, check your spam folder or contact support.') : t('Kurumsal hesabiniz varsa yoneticinizin tanimladigi e-posta ile giris yapin.', 'If you have an enterprise account, log in with the email assigned by your administrator.')}
              </p>
            )}

            {isRegisterMode && <div className="login-consents">
              <div className="login-consent"><input id="login-terms-accepted" type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required /> <span><label htmlFor="login-terms-accepted">{t('Kullanım Koşulları metnini kabul ediyorum:', 'I accept the Terms of Use:')}</label> <button type="button" className="login-legal-trigger" onClick={() => setLegalDialogType('terms')}>{t('Kullanım Koşulları', 'Terms of Use')}</button></span></div>
              {termsVersion && <p className="login-disclosure">{t('Koşullar sürümü', 'Terms version')}: {termsVersion}</p>}
              <p className="login-disclosure">{t('Kişisel veriler hakkında bilgi:', 'Information about personal data:')} <button type="button" className="login-legal-trigger" onClick={() => setLegalDialogType('kvkk')}>{t('KVKK Aydınlatma Metni', 'KVKK Notice')}</button> · <button type="button" className="login-legal-trigger" onClick={() => setLegalDialogType('privacy')}>{t('Gizlilik Politikası', 'Privacy Policy')}</button></p>
              <label className="login-consent"><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} /> <span>{t('İsteğe bağlı pazarlama iletileri almak istiyorum.', 'I would like to receive optional marketing messages.')}</span></label>
              <p className="login-disclosure">{t('Pazarlama tercihi kayıt için gerekli değildir. Tercihin sunucuya kaydı entegrasyon sonrası sağlanacaktır.', 'Marketing is optional. Saving this preference requires backend integration.')}</p>
            </div>}

            {!isRegisterMode && !isForgotMode && (
              <div className="login-options">
                <label className="remember-row">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                  {t('Beni hatirla', 'Remember me')}
                </label>
                <a href="#" onClick={openForgotPassword}>{t('Sifremi unuttum', 'Forgot password')}</a>
              </div>
            )}

            {isForgotMode ? (
              <div className="login-form-actions">
                <button type="button" className="login-back-btn" onClick={() => switchMode('login')}>
                  {t('Girişe dön', 'Back to login')}
                </button>
                <button type="submit" className="btn-login-submit" disabled={isLoading}>
                  {isLoading ? t('İşleniyor...', 'Processing...') : forgotStep === 'email' ? t('Kod Gönder', 'Send Code') : forgotStep === 'code' ? t('Kodu Doğrula', 'Verify Code') : t('Şifreyi Güncelle', 'Update Password')}
                </button>
              </div>
            ) : (
              <button type="submit" className="btn-login-submit" disabled={isLoading}>
                {isLoading ? t('Isleniyor...', 'Processing...') : isRegisterMode ? t('Kayit Ol', 'Register') : t('Giris Yap', 'Log In')}
              </button>
            )}
          </form>
          {!isForgotMode && <div className="login-google">
            <p className="login-google-label">{t('veya', 'or')}</p>
            <GoogleSignInButton language={language} theme={appTheme === 'dark' ? 'filled_black' : 'outline'} enabled={googleAuthConfigured} busy={googleBusy} onCredential={handleGoogleCredential} />
            {googleError && <p className="login-google-error" role="alert">{googleError}</p>}
            {googleFlow === 'account_link_required' && <div className="google-account-link" role="status">
              <p>{t('Bu e-posta için mevcut bir hesap bulundu. Hesapları güvenli biçimde bağlamak için önce e-posta ile giriş yapın.', 'An account already exists for this email. Sign in with email first to link accounts securely.')}</p>
              <button type="button" onClick={() => switchMode('login')}>{t('E-posta ile giriş', 'Sign in with email')}</button>
            </div>}
            {googleFlow === 'onboarding' && <GoogleRegistrationOnboarding language={language} termsVersion={termsVersion} busy={googleBusy} error={googleError} onComplete={handleGoogleOnboarding} onCancel={() => setGoogleFlow('idle')} onOpenLegal={setLegalDialogType} />}
          </div>}
        </div>
      </section>
      <dialog ref={legalDialogRef} className="login-legal-dialog" aria-labelledby="login-legal-dialog-title" onClose={() => setLegalDialogType(null)} onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        {legalDialogType && (() => {
          const document = legalPageDocuments[legalDialogType];
          const index = isEnglish ? 1 : 0;
          return <div className="login-legal-dialog__scroll">
            <header className="login-legal-dialog__header"><div><span>{t('Yasal bilgilendirme', 'Legal information')}</span><h2 id="login-legal-dialog-title">{document.title[index]}</h2></div><button type="button" className="login-legal-dialog__close" aria-label={t('Kapat', 'Close')} onClick={() => legalDialogRef.current?.close()}>×</button></header>
            <p className="login-legal-dialog__intro">{document.intro[index]}</p>
            <div className="login-legal-dialog__sections">{legalPageSections[legalDialogType].map((section) => <section key={section[0]}><h3>{section[index]}</h3><p>{section[index + 2]}</p></section>)}</div>
          </div>;
        })()}
      </dialog>
    </main>
  );
}
