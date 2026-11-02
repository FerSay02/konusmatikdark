import { useCallback, useEffect, useRef, useState } from 'react';
import { apiJson } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import GoogleSignInButton from '../components/GoogleSignInButton';
import GoogleRegistrationOnboarding from '../components/GoogleRegistrationOnboarding';
import { beginGoogleSignIn, completeGoogleRegistration, emailRegistrationEnabled, getGoogleRegistrationTerms, getRegistrationTerms, googleAuthConfigured, registerWithEmail, signInWithEmail, signInWithGoogle } from '../lib/authAdapter';
import { googleErrorMessage } from '../lib/googleMessages';
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
  const [emailTermsVersion, setEmailTermsVersion] = useState('');
  const [emailTermsStatus, setEmailTermsStatus] = useState('idle');
  const [emailTermsChanged, setEmailTermsChanged] = useState(false);
  const emailTermsRequest = useRef(0);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [googleFlow, setGoogleFlow] = useState('idle');
  const [googleBusy, setGoogleBusy] = useState(false);
  const googleBusyRef = useRef(false);
  const [googleError, setGoogleError] = useState('');
  const [googleTermsVersion, setGoogleTermsVersion] = useState('');
  const [googleTermsChanged, setGoogleTermsChanged] = useState(false);
  const [googleTermsAttempt, setGoogleTermsAttempt] = useState(0);
  const googleTermsRequest = useRef(0);
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

  const loadEmailTerms = useCallback(async (changed = false) => {
    const request = ++emailTermsRequest.current;
    setTermsAccepted(false);
    setEmailTermsVersion('');
    setEmailTermsStatus('loading');
    setEmailTermsChanged(changed);
    try {
      const version = await getRegistrationTerms();
      if (request !== emailTermsRequest.current) return;
      setEmailTermsVersion(version);
      setEmailTermsStatus('ready');
    } catch {
      if (request !== emailTermsRequest.current) return;
      setEmailTermsStatus('unavailable');
    }
  }, []);

  useEffect(() => () => { emailTermsRequest.current += 1; }, []);

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
    emailTermsRequest.current += 1;
    setEmailTermsVersion('');
    setEmailTermsStatus('idle');
    setEmailTermsChanged(false);
    if (nextMode === 'register') loadEmailTerms();
    setMarketingConsent(false);
    setGoogleFlow('idle');
    googleTermsRequest.current += 1;
    setGoogleTermsVersion('');
    setGoogleTermsChanged(false);
    setGoogleError('');
  };

  const loadGoogleTerms = useCallback(async (changed = false) => {
    const request = ++googleTermsRequest.current;
    setGoogleTermsAttempt((value) => value + 1);
    setGoogleTermsVersion('');
    setGoogleTermsChanged(changed);
    setGoogleError('');
    setGoogleFlow('terms_loading');
    try {
      const version = await getGoogleRegistrationTerms();
      if (request !== googleTermsRequest.current) return;
      setGoogleTermsVersion(version);
      setGoogleFlow('onboarding');
    } catch {
      if (request !== googleTermsRequest.current) return;
      setGoogleFlow('terms_unavailable');
    }
  }, []);

  const cancelGoogleTerms = () => {
    googleTermsRequest.current += 1;
    setGoogleTermsVersion('');
    setGoogleTermsChanged(false);
    setGoogleError('');
    setGoogleFlow('idle');
  };

  const handleGoogleCredential = useCallback(async (credential, consent = null) => {
    if (googleBusyRef.current) return;
    googleBusyRef.current = true;
    setGoogleBusy(true);
    setGoogleError('');
    try {
      const result = await signInWithGoogle(credential, consent);
      if (result.state === 'authenticated') {
        onAuthenticated?.(result.user);
      } else if (result.state === 'account_link_required') {
        setGoogleFlow('account_link_required');
      }
    } catch (err) {
      if (err?.status === 428 && err?.detail?.code === 'terms_acceptance_required') await loadGoogleTerms(false);
      else if (err?.status === 409 && err?.detail?.code === 'terms_version_mismatch') await loadGoogleTerms(true);
      else if (err?.status === 409) { setGoogleFlow('account_link_required'); setMode('login'); }
      else if (err?.status) setGoogleError(googleErrorMessage(err.status, language));
      else if (err?.code === 'BACKEND_NOT_CONFIGURED') setGoogleError(t('Google ile giriş henüz kullanılamıyor.', 'Google sign-in is not available yet.'));
      else if (err?.code === 'INVALID_CREDENTIAL') setGoogleError(t('Google doğrulaması tamamlanmadı. Tekrar deneyin.', 'Google verification did not finish. Please retry.'));
      else if (err?.code === 'ACCOUNT_LINK_REQUIRED') setGoogleFlow('account_link_required');
      else setGoogleError(t('Google ile giriş tamamlanamadı. Tekrar deneyin.', 'Google sign-in could not be completed. Please retry.'));
    } finally {
      googleBusyRef.current = false;
      setGoogleBusy(false);
    }
  }, [onAuthenticated, t, language, loadGoogleTerms]);

  const handleGoogleCompletion = async (termsVersion) => {
    if (googleBusyRef.current) return;
    googleBusyRef.current = true;
    setGoogleBusy(true);
    setGoogleError('');
    try {
      const result = await completeGoogleRegistration(termsVersion);
      if (!result?.user) throw new Error('Invalid response');
      onAuthenticated?.(result.user);
    } catch (err) {
      if (err?.status === 409 && err?.detail?.code === 'terms_version_mismatch') await loadGoogleTerms(true);
      else if (err?.status === 428) await loadGoogleTerms(false);
      else if (err?.status === 401) {
        setGoogleFlow('idle');
        setGoogleError(t('Google doğrulamasının süresi doldu. Lütfen Google ile tekrar giriş yapın.', 'Google verification expired. Please sign in with Google again.'));
      } else if (err?.status === 409) { setGoogleFlow('account_link_required'); setMode('login'); }
      else setGoogleError(t('Kayıt tamamlanamadı. Lütfen tekrar deneyin.', 'Registration could not be completed. Please try again.'));
    } finally {
      googleBusyRef.current = false;
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
          setSuccess(t('Doğrulama kodu e-posta adresinize gönderildi.', 'A verification code has been sent to your email address.'));
        } else if (forgotStep === 'code') {
          const data = await apiJson('/api/v1/auth/password-reset/verify', {
            method: 'POST',
            body: JSON.stringify({ email, code: resetCode }),
          });
          setResetToken(data.reset_token);
          setForgotStep('password');
          setSuccess(t('Kod doğrulandı. Yeni şifrenizi belirleyebilirsiniz.', 'Code verified. You can now set your new password.'));
        } else {
          if (password.length < 8) {
            setError(t('Şifre en az 8 karakter olmalıdır.', 'Password must be at least 8 characters.'));
            return;
          }

          if (password !== passwordConfirm) {
            setError(t('Şifreler eşleşmiyor.', 'Passwords do not match.'));
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
          setSuccess(t('Şifreniz güncellendi. Giriş yapabilirsiniz.', 'Your password has been updated. You can now log in.'));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t('Şifre sıfırlama işlemi tamamlanamadı.', 'Password reset could not be completed.'));
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
      if (emailTermsStatus !== 'ready' || !emailTermsVersion) {
        setError(t('Güncel koşullar alınamadı. Lütfen tekrar deneyin.', 'Current terms could not be loaded. Please try again.'));
        return;
      }
      if (!isPhoneValid) {
        setError(t('Telefon formatı yanlış girildi.', 'The phone number format is incorrect.'));
        return;
      }

      if (password.length < 8) {
        setError(t('Şifre en az 8 karakter olmalıdır.', 'Password must be at least 8 characters.'));
        return;
      }

      if (password !== passwordConfirm) {
        setError(t('Şifreler eşleşmiyor.', 'Passwords do not match.'));
        return;
      }

      setIsLoading(true);

      try {
        await registerWithEmail({ email, password, full_name: fullName, phone, termsAccepted, termsVersion: emailTermsVersion });
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
        setSuccess(t('Kayıt tamamlandı. Giriş yapabilirsiniz.', 'Registration is complete. You can log in.'));
      } catch (err) {
        if (err?.status === 428 && err?.detail?.code === 'terms_acceptance_required') {
          setTermsAccepted(false);
          setError(t('Kullanım Koşulları kabul edilmelidir.', 'Please accept the Terms of Use.'));
        } else if (err?.status === 409 && err?.detail?.code === 'terms_version_mismatch') {
          setError('');
          await loadEmailTerms(true);
        } else if (err?.status === 503) {
          emailTermsRequest.current += 1;
          setTermsAccepted(false);
          setEmailTermsVersion('');
          setEmailTermsStatus('unavailable');
          setError(t('Kayıt hizmeti şu anda kullanılamıyor. Lütfen tekrar deneyin.', 'Registration is temporarily unavailable. Please try again.'));
        } else {
          setError(t('Kayıt oluşturulamadı. Bilgilerinizi kontrol edip tekrar deneyin.', 'Registration could not be completed. Check your details and try again.'));
        }
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
      setError(err instanceof Error ? err.message : t('Giriş yapılamadı.', 'Login failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  const title = isForgotMode
    ? t('Şifrenizi sıfırlayın', 'Reset your password')
    : isRegisterMode
      ? t('Yeni hesap oluşturun', 'Create a new account')
      : t('Hesabınıza giriş yapın', 'Log in to your account');
  const subtitle = isForgotMode
    ? forgotStep === 'email'
      ? t('Hesabınıza bağlı e-posta adresini girin, doğrulama kodunu gönderelim.', 'Enter the email address linked to your account and we will send a verification code.')
      : forgotStep === 'code'
        ? t('E-postanıza gelen 6 haneli doğrulama kodunu girin.', 'Enter the 6-digit verification code sent to your email.')
        : t('Yeni şifrenizi belirleyin ve hesabınıza güvenle dönün.', 'Set your new password and return to your account safely.')
    : isRegisterMode
      ? t('Kayıt bilgilerinizi doldurun, hesabınızı oluşturmaya başlayın.', 'Fill in your registration information to create your account.')
      : t('E-posta adresiniz ve şifreniz ile panele erişin.', 'Access the panel with your email address and password.');

  return (
    <main className="login-page">
      <section className="login-visual">
        <div className="login-copy">
          <h1>{t('Projelerinizi kaldığınız yerden kolayca yönetin.', 'Manage your projects easily from where you left off.')}</h1>
          <p>{t('Seslendirme, deşifre ve paket kullanımını tek panelden takip edin.', 'Track text-to-speech, transcription, and package usage from one panel.')}</p>
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
        <div className={`login-card ${isForgotMode ? 'login-card--forgot' : ''} ${['onboarding', 'terms_loading', 'terms_unavailable'].includes(googleFlow) ? 'login-card--google-consent' : ''}`}>
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

          {!isForgotMode && <div className="login-mode-tabs" role="group" aria-label={t('Giriş veya kayıt seçimi', 'Login or registration selection')}>
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
              {t('Giriş Yap', 'Log In')}
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} disabled={!emailRegistrationEnabled}>
              {t('Kayıt Ol', 'Register')}
            </button>
          </div>}
          {!isForgotMode && !emailRegistrationEnabled && <p className="login-registration-hold" role="status">{t('Yeni kayıtlar, Kullanım Koşulları yasal olarak onaylanana kadar kapalıdır. Mevcut hesabınızla giriş yapabilirsiniz.', 'New registrations are unavailable until the Terms of Use receive legal approval. Existing users can still sign in.')}</p>}

          <form className={`login-form ${isRegisterMode ? 'login-form--register' : ''} ${isForgotMode ? 'login-form--forgot' : ''}`} onSubmit={handleSubmit}>
            {isRegisterMode && (
              <>
                <label className="login-register-wide">
                  {t('Ad Soyad', 'Full Name')}
                  <input type="text" placeholder={t('Adınız Soyadınız', 'Your full name')} autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
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
                    title={t('Telefon numarası 5 ile başlayan 10 haneli formatta olmalıdır.', 'The phone number must be 10 digits and start with 5.')}
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
                {t('Doğrulama Kodu', 'Verification Code')}
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
              {t('Şifre', 'Password')}
              <span className="login-password-field">
                <input type={showPassword ? 'text' : 'password'} placeholder={isForgotMode ? t('Yeni şifreniz', 'Your new password') : t('Şifreniz', 'Your password')} autoComplete={isRegisterMode || isForgotMode ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required />
                <button type="button" title={showPassword ? t('Şifreyi gizle', 'Hide password') : t('Şifreyi göster', 'Show password')} aria-label={showPassword ? t('Şifreyi gizle', 'Hide password') : t('Şifreyi göster', 'Show password')} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>
                  <PasswordVisibilityIcon visible={showPassword} />
                </button>
              </span>
            </label>}

            {(isRegisterMode || (isForgotMode && forgotStep === 'password')) && (
              <>
                <label>
                  {t('Şifre Tekrarı', 'Confirm Password')}
                  <span className="login-password-field">
                    <input type={showPasswordConfirm ? 'text' : 'password'} placeholder={t('Şifrenizi tekrar girin', 'Enter your password again')} autoComplete="new-password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} required />
                    <button type="button" title={showPasswordConfirm ? t('Şifreyi gizle', 'Hide password') : t('Şifreyi göster', 'Show password')} aria-label={showPasswordConfirm ? t('Şifreyi gizle', 'Hide password') : t('Şifreyi göster', 'Show password')} aria-pressed={showPasswordConfirm} onClick={() => setShowPasswordConfirm((value) => !value)}>
                      <PasswordVisibilityIcon visible={showPasswordConfirm} />
                    </button>
                  </span>
                </label>

                <div className="login-password-status">
                  <div className="login-password-notes">
                    <span>{t('En az 8 karakter olmalıdır', 'Must be at least 8 characters')}</span>
                    {passwordConfirm && <span className={passwordsMatch ? 'match' : 'mismatch'}>{passwordsMatch ? t('Şifreler eşleşiyor', 'Passwords match') : t('Şifreler eşleşmiyor', 'Passwords do not match')}</span>}
                  </div>
                </div>
              </>
            )}

            {error && <p className="login-help-text login-register-wide" role="alert">{error}</p>}
            {success && <p className="login-help-text login-register-wide" role="status">{success}</p>}
            {!error && !success && !isRegisterMode && (
              <p className="login-help-text">
                {isForgotMode ? t('E-posta gelmezse spam klasörünü kontrol edin veya destek ekibimizle iletişime geçin.', 'If the email does not arrive, check your spam folder or contact support.') : t('Kurumsal hesabınız varsa yöneticinizin tanımladığı e-posta ile giriş yapın.', 'If you have an enterprise account, log in with the email assigned by your administrator.')}
              </p>
            )}

            {isRegisterMode && <div className="login-consents">
              <div className="login-consent"><input id="login-terms-accepted" type="checkbox" checked={termsAccepted} disabled={emailTermsStatus !== 'ready' || isLoading} onChange={(event) => setTermsAccepted(event.target.checked)} required /> <span><label htmlFor="login-terms-accepted">{t('Kullanım Koşulları metnini kabul ediyorum:', 'I accept the Terms of Use:')}</label> <button type="button" className="login-legal-trigger" onClick={() => setLegalDialogType('terms')}>{t('Kullanım Koşulları', 'Terms of Use')}</button></span></div>
              {emailTermsStatus === 'loading' && <p className="login-disclosure" role="status">{t('Güncel koşullar yükleniyor…', 'Loading current terms…')}</p>}
              {emailTermsStatus === 'unavailable' && <p className="login-disclosure" role="alert">{t('Güncel koşullar alınamadı.', 'Current terms could not be loaded.')} <button type="button" className="login-legal-trigger" onClick={() => { setError(''); loadEmailTerms(emailTermsChanged); }}>{t('Tekrar dene', 'Try again')}</button></p>}
              {emailTermsChanged && emailTermsStatus === 'ready' && <p className="login-disclosure" role="status">{t('Koşullar güncellendi. Lütfen yeniden inceleyip kabul edin.', 'The terms have changed. Please review and accept them again.')}</p>}
              {emailTermsVersion && <p className="login-disclosure">{t('Koşullar sürümü', 'Terms version')}: {emailTermsVersion}</p>}
              <p className="login-disclosure">{t('Kişisel veriler hakkında bilgi:', 'Information about personal data:')} <button type="button" className="login-legal-trigger" onClick={() => setLegalDialogType('kvkk')}>{t('KVKK Aydınlatma Metni', 'KVKK Notice')}</button> · <button type="button" className="login-legal-trigger" onClick={() => setLegalDialogType('privacy')}>{t('Gizlilik Politikası', 'Privacy Policy')}</button></p>
              <label className="login-consent"><input type="checkbox" checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} /> <span>{t('İsteğe bağlı pazarlama iletileri almak istiyorum.', 'I would like to receive optional marketing messages.')}</span></label>
              <p className="login-disclosure">{t('Pazarlama tercihi kayıt için gerekli değildir. Tercihin sunucuya kaydı entegrasyon sonrası sağlanacaktır.', 'Marketing is optional. Saving this preference requires backend integration.')}</p>
            </div>}

            {!isRegisterMode && !isForgotMode && (
              <div className="login-options">
                <label className="remember-row">
                  <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                  {t('Beni Hatırla', 'Remember me')}
                </label>
                <a href="#" onClick={openForgotPassword}>{t('Şifremi Unuttum', 'Forgot password')}</a>
              </div>
            )}

            {isForgotMode ? (
              <div className="login-form-actions">
                <button type="button" className="login-back-btn" onClick={() => switchMode('login')}>
                  {t('Girişe dön', 'Back to login')}
                </button>
                <button type="submit" className="btn-login-submit" disabled={isLoading}>
                  {isLoading ? t('Yükleniyor...', 'Loading...') : forgotStep === 'email' ? t('Kod Gönder', 'Send Code') : forgotStep === 'code' ? t('Kodu Doğrula', 'Verify Code') : t('Şifreyi Güncelle', 'Update Password')}
                </button>
              </div>
            ) : (
              <button type="submit" className="btn-login-submit" disabled={isLoading || (isRegisterMode && emailTermsStatus !== 'ready')}>
                {isLoading ? t('Yükleniyor...', 'Loading...') : isRegisterMode ? t('Kayıt Ol', 'Register') : t('Giriş Yap', 'Log In')}
              </button>
            )}
          </form>
          {!isForgotMode && <div className="login-google">
            <p className="login-google-label">{t('veya', 'or')}</p>
            {googleFlow !== 'onboarding' && googleFlow !== 'terms_loading' && googleFlow !== 'terms_unavailable' && <GoogleSignInButton language={language} theme={appTheme === 'dark' ? 'filled_black' : 'outline'} enabled={googleAuthConfigured} busy={googleBusy} autoPrepare showCancel={false} onPrepare={beginGoogleSignIn} onCredential={handleGoogleCredential} onError={(code) => setGoogleError(googleErrorMessage(code, language))} />}
            {googleError && <p className="login-google-error" role="alert">{googleError}</p>}
            {googleFlow === 'account_link_required' && <div className="google-account-link" role="status">
              <p>{t('Bu e-posta için mevcut bir hesap bulundu. Hesapları güvenli biçimde bağlamak için önce e-posta ile giriş yapın.', 'An account already exists for this email. Sign in with email first to link accounts securely.')}</p>
              <button type="button" onClick={() => switchMode('login')}>{t('E-posta ile Giriş Yap', 'Sign in with email')}</button>
            </div>}
            {googleFlow === 'terms_loading' && <div role="status">{t('Güncel koşullar yükleniyor…', 'Loading current terms…')}</div>}
            {googleFlow === 'terms_unavailable' && <div role="alert"><p>{t('Güncel koşullar alınamadı. Kayıt için tekrar deneyin.', 'Current terms could not be loaded. Please retry registration.')}</p><button type="button" onClick={() => loadGoogleTerms(googleTermsChanged)}>{t('Tekrar dene', 'Try again')}</button></div>}
            {googleFlow === 'onboarding' && <>
              {googleTermsChanged && <p role="status">{t('Koşullar güncellendi. Lütfen tekrar inceleyip onaylayın.', 'The terms have changed. Please review and accept them again.')}</p>}
              <GoogleRegistrationOnboarding key={googleTermsAttempt} language={language} termsVersion={googleTermsVersion} busy={googleBusy} onComplete={handleGoogleCompletion} onCancel={cancelGoogleTerms} onOpenLegal={setLegalDialogType} />
            </>}
            {(googleFlow === 'terms_loading' || googleFlow === 'terms_unavailable') && <button type="button" onClick={cancelGoogleTerms}>{t('Vazgeç', 'Cancel')}</button>}
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
