import { useCallback, useState } from 'react';
import { apiJson } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import Lightfall from '../components/Lightfall';

const rememberedEmailKey = 'konusmatik_remembered_email';
const loginLightfallColors = ['#6c3ce9', '#d21784', '#f9a8d4'];

function PasswordVisibilityIcon({ visible }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.1 12s3.6-7 9.9-7 9.9 7 9.9 7-3.6 7-9.9 7-9.9-7-9.9-7Z" />
      <circle cx="12" cy="12" r="3" />
      {visible && <path d="m3 3 18 18" />}
    </svg>
  );
}

export default function Login({ onAuthenticated, appLanguage }) {
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

  const isRegisterMode = mode === 'register';
  const isForgotMode = mode === 'forgot';
  const passwordsMatch = passwordConfirm.length > 0 && password === passwordConfirm;
  const isPhoneValid = /^5\d{9}$/.test(phone);

  const handlePhoneChange = (event) => {
    setPhone(event.target.value.replace(/\D/g, '').slice(0, 10));
  };

  const switchMode = (nextMode) => {
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
        await apiJson('/api/v1/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            full_name: fullName,
            phone,
          }),
        });
        setMode('login');
        setFullName('');
        setPhone('');
        setPassword('');
        setPasswordConfirm('');
        setRememberMe(false);
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
      const data = await apiJson('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
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
      <Lightfall
        className="login-lightfall"
        colors={loginLightfallColors}
        backgroundColor="transparent"
        speed={1}
        streakCount={8}
        glow={1}
        density={1}
        opacity={0.82}
        mouseInteraction
        mouseStrength={1}
        mouseRadius={0.6}
      />
      <section className="login-visual">
        <div className="login-copy">
          <h1>{t('Projelerinizi kaldiginiz yerden kolayca yonetin.', 'Manage your projects easily from where you left off.')}</h1>
          <p>{t('Seslendirme, desifre ve paket kullanimini tek panelden takip edin.', 'Track text-to-speech, transcription, and package usage from one panel.')}</p>
        </div>

        <div className="login-metrics" aria-label={t('Hesap ozeti', 'Account summary')}>
          <div>
            <strong>10M+</strong>
            <span>{t('Islenen karakter', 'Processed characters')}</span>
          </div>
          <div>
            <strong>%99,5</strong>
            <span>{t('Servis erisilebilirligi', 'Service availability')}</span>
          </div>
        </div>
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

          {!isForgotMode && <div className="login-mode-tabs" role="tablist" aria-label={t('Giris veya kayit secimi', 'Login or registration selection')}>
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>
              {t('Giris Yap', 'Log In')}
            </button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>
              {t('Kayit Ol', 'Register')}
            </button>
          </div>}

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

            {error && <p className="login-help-text" style={{ color: '#b91c1c' }}>{error}</p>}
            {success && <p className="login-help-text" style={{ color: '#047857' }}>{success}</p>}
            {!error && !success && (
              <p className="login-help-text">
                {isForgotMode ? t('E-posta gelmezse spam klasörünü kontrol edin veya destek ekibimizle iletişime geçin.', 'If the email does not arrive, check your spam folder or contact support.') : isRegisterMode ? t('Kayit sonrasi paket secerek seslendirme ve desifre islemlerine baslayabilirsiniz.', 'After registration, choose a package to start text-to-speech and transcription.') : t('Kurumsal hesabiniz varsa yoneticinizin tanimladigi e-posta ile giris yapin.', 'If you have an enterprise account, log in with the email assigned by your administrator.')}
              </p>
            )}

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
        </div>
      </section>
    </main>
  );
}
