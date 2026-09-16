import { useCallback, useEffect, useMemo, useState } from 'react';
import './Profile.theme.css';

import { apiJson, isAuthError } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import StudioHero from '../components/StudioHero';

const profileSteps = [
  { num: 1, label: 'Hesap Bilgileri', labelEn: 'Account Details', desc: 'Profilinizi yönetin', descEn: 'Manage your profile' },
  { num: 2, label: 'Kullanım Hakları', labelEn: 'Usage Allowances', desc: 'Bakiyenizi takip edin', descEn: 'Track your balance' },
  { num: 3, label: 'API Erişimi', labelEn: 'API Access', desc: 'Anahtarları yönetin', descEn: 'Manage your keys' },
];

function formatNumber(value, language = 'tr') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 0 }).format(Number(value || 0));
}

function formatQuota(value, unit, language = 'tr') {
  const amount = Number(value || 0);
  if (unit === 'second') {
    if (amount < 60) return `${formatNumber(amount, language)} ${language === 'en' ? 'seconds' : 'saniye'}`;
    const minutes = new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR', { maximumFractionDigits: 1 }).format(amount / 60);
    return `${minutes} ${language === 'en' ? 'minutes' : 'dakika'}`;
  }
  return `${formatNumber(amount, language)} ${language === 'en' ? 'characters' : 'karakter'}`;
}

function formatDate(value, language = 'tr') {
  if (!value) return language === 'en' ? 'No expiration' : 'Süresiz';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', { dateStyle: 'medium' }).format(new Date(value));
}

function serviceLabel(type, language = 'tr') {
  if (language === 'en') return type === 'tts' ? 'Text-to-Speech' : 'Transcription';
  return type === 'tts' ? 'Seslendirme' : 'Deşifre';
}

function audienceLabel(audience, language = 'tr') {
  if (language === 'en') {
    if (audience === 'enterprise') return 'Enterprise';
    if (audience === 'sme') return 'SME';
    return 'Individual';
  }
  if (audience === 'enterprise') return 'Kurumsal';
  if (audience === 'sme') return 'KOBI';
  return 'Bireysel';
}

function quotaAmountLabel(value, unit, language = 'tr') {
  const amount = Number(value || 0);
  const formatted = formatNumber(unit === 'second' ? amount / 60 : amount, language);
  if (unit === 'second') return `${formatted} ${language === 'en' ? 'Minute' : 'Dakika'}`;
  return `${formatted} ${language === 'en' ? 'Character' : 'Karakter'}`;
}

function cleanPlanName(value) {
  if (!value) return value;
  return value
    .replace(/YazÄ±ya Ã‡evirme/g, 'Yaziya Cevirme')
    .replace(/YazÃ„Â±ya Ãƒâ€¡evirme/g, 'Yaziya Cevirme')
    .replace(/YazÄ±ya.*?evirme/g, 'Yaziya Cevirme')
    .replace(/Yaz.*?ya.*?evirme/g, 'Yaziya Cevirme')
    .replace(/Audioi/g, 'Audio')
    .replace(/Audioi/gi, 'Audio')
    .replace(/DeÅŸifre/g, 'Desifre')
    .replace(/Deşifre/g, 'Desifre')
    .replace(/DeÃ…Å¸ifre/g, 'Desifre');
}

function englishPlanName(value) {
  if (!value) return value;
  return cleanPlanName(value)
    .replace(/Kurumsal/g, 'Enterprise')
    .replace(/Bireysel/g, 'Individual')
    .replace(/Karakter/g, 'Character')
    .replace(/Dakika/g, 'Minute')
    .replace(/Audioi.*?evirme/gi, 'Audio-to-Text Transcription')
    .replace(/Audio.*?Yaziya.*?Cevirme/gi, 'Audio-to-Text Transcription')
    .replace(/Yaz.*?evirme/gi, 'Transcription')
    .replace(/Yaziya Cevirme/gi, 'Transcription')
    .replace(/Seslendirme Paketi/g, 'Text-to-Speech Package')
    .replace(/Desifre Paketi/g, 'Transcription Package')
    .replace(/Seslendirme/g, 'Text-to-Speech')
    .replace(/Desifre/g, 'Transcription');
}

function turkishPlanName(value) {
  if (!value) return value;
  return cleanPlanName(value)
    .replace(/Audio Yaziya Cevirme/gi, 'Ses Kaydini Yaziya Cevirme')
    .replace(/Yaziya Cevirme/gi, 'Yaziya Cevirme')
    .replace(/Desifre Paketi/g, 'Desifre Paketi');
}

function planNameFor(entitlement, planMap, language = 'tr') {
  const plan = entitlement.plan_id ? planMap.get(entitlement.plan_id) : null;
  const fallback = entitlement.type === 'tts' ? 'Seslendirme Paketi' : 'Deşifre Paketi';
  const name = plan?.name || fallback;
  if (entitlement.type === 'asr' && plan?.quota_amount) {
    const amount = quotaAmountLabel(plan.quota_amount, plan.quota_unit || entitlement.quota_unit, language);
    const prefix = plan.audience === 'enterprise'
      ? (language === 'en' ? 'Enterprise ' : 'Kurumsal ')
      : '';
    return language === 'en'
      ? `${prefix}${amount} Audio-to-Text Transcription`
      : `${prefix}${amount} Ses Kaydını Yazıya Çevirme`;
  }
  if (entitlement.type === 'tts' && plan?.quota_amount) {
    const amount = quotaAmountLabel(plan.quota_amount, plan.quota_unit || entitlement.quota_unit, language);
    const prefix = plan.audience === 'enterprise'
      ? (language === 'en' ? 'Enterprise ' : 'Kurumsal ')
      : '';
    return language === 'en'
      ? `${prefix}${amount} Text-to-Speech`
      : `${prefix}${amount} Text-to-Speech`;
  }
  return language === 'en' ? englishPlanName(name) : turkishPlanName(name);
}

function statusLabel(status, language = 'tr') {
  if (language !== 'en') return status;
  if (status === 'active') return 'Active';
  if (status === 'revoked') return 'Revoked';
  return status;
}

function profileMessage(value, language = 'tr') {
  if (language !== 'en' || !value) return value;
  const clean = value.toLowerCase();
  if (clean.includes('profil') && clean.includes('alinamadi')) return 'Profile information could not be loaded.';
  if (clean.includes('profil') && clean.includes('guncellenemedi')) return 'Profile could not be updated.';
  if (clean.includes('api key') && clean.includes('olustur')) return 'API key could not be created.';
  if (clean.includes('api key') && clean.includes('iptal')) return 'API key could not be revoked.';
  return value;
}

function EntitlementCard({ entitlement, planMap, language, t }) {
  const initial = Number(entitlement.initial_quota || 0);
  const remaining = Number(entitlement.remaining_quota || 0);
  const plan = entitlement.plan_id ? planMap.get(entitlement.plan_id) : null;
  const isCorporate = plan && ['sme', 'enterprise'].includes(plan.audience);

  return (
    <article className="contact-card profile-preview-plan-v3">
      <span className="profile-preview-plan-service-v3">{serviceLabel(entitlement.type, language)}</span>
      <h3>{planNameFor(entitlement, planMap, language)}</h3>
      {plan && (
        <div className="profile-preview-plan-type-v3">
          <span>{audienceLabel(plan.audience, language)} {t('paket', 'package')}</span>
          {isCorporate && <span>{t('Kurumsal API kullanımına uygun', 'Eligible for Enterprise API usage')}</span>}
        </div>
      )}
      <strong>{formatQuota(remaining, entitlement.quota_unit, language)}</strong>
      <dl className="profile-preview-plan-details-v3">
        <div><dt>{t('Başlangıç', 'Initial allowance')}</dt><dd>{formatQuota(initial, entitlement.quota_unit, language)}</dd></div>
        <div><dt>{t('Bitiş', 'Expiry')}</dt><dd>{formatDate(entitlement.expires_at, language)}</dd></div>
        <div>
          <dt>{t('İndirme', 'Download')}</dt>
          <dd>{entitlement.download_enabled ? t('Açık', 'Enabled') : t('Kapalı', 'Disabled')}</dd>
        </div>
      </dl>
    </article>
  );
}

function CopyIcon({ copied = false }) {
  return copied ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ApiKeyRow({ apiKey, onRevoke, language, t }) {
  const isActive = apiKey.status === 'active';
  return (
    <article>
      <div className="profile-preview-key-info-v3">
        <strong>{apiKey.name}</strong>
        <small>{t('Son kullanım', 'Last used')}: {apiKey.last_used_at ? formatDate(apiKey.last_used_at, language) : t('Henüz kullanılmadı', 'Never used')}</small>
      </div>
      <code className="profile-preview-key-value-v3">{apiKey.key_prefix}••••••••</code>
      <div className="profile-preview-key-actions-v3">
        <span>{statusLabel(apiKey.status, language)}</span>
        {isActive && (
          <button type="button" onClick={() => onRevoke(apiKey.id)}>
            {t('Anahtarı İptal Et', 'Revoke Key')}
          </button>
        )}
      </div>
    </article>
  );
}

export default function Profile({ currentUser, onUserUpdated, onNavigate, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = useCallback((tr, en) => (isEnglish ? en : restoreTurkishUiText(tr)), [isEnglish]);
  const [profile, setProfile] = useState(currentUser);
  const [form, setForm] = useState({
    full_name: currentUser?.full_name || '',
    phone: currentUser?.phone || '',
  });
  const [entitlements, setEntitlements] = useState(null);
  const [entitlementList, setEntitlementList] = useState([]);
  const [usage, setUsage] = useState(null);
  const [plans, setPlans] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeyName, setApiKeyName] = useState('');
  const [createdApiKey, setCreatedApiKey] = useState(null);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const planMap = useMemo(() => new Map(plans.map((plan) => [String(plan.id), plan])), [plans]);
  const corporateEntitlements = useMemo(() => entitlementList.filter((entitlement) => {
    const plan = entitlement.plan_id ? planMap.get(entitlement.plan_id) : null;
    return plan && ['sme', 'enterprise'].includes(plan.audience);
  }), [entitlementList, planMap]);
  const hasCorporateEntitlement = corporateEntitlements.some((entitlement) => Number(entitlement.remaining_quota || 0) > 0);
  const corporateTtsRemaining = corporateEntitlements
    .filter((entitlement) => entitlement.type === 'tts')
    .reduce((total, entitlement) => total + Number(entitlement.remaining_quota || 0), 0);
  const corporateAsrRemaining = corporateEntitlements
    .filter((entitlement) => entitlement.type === 'asr')
    .reduce((total, entitlement) => total + Number(entitlement.remaining_quota || 0), 0);

  const fetchOptionalJson = async (path, options = {}) => apiJson(path, {
    skipAuthExpiredEvent: true,
    ...options,
  });

  const refreshApiKeys = async () => {
    try {
      const keyList = await fetchOptionalJson('/api/v1/me/api-keys');
      setApiKeys(Array.isArray(keyList) ? keyList : []);
    } catch {
      setApiKeys([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError('');
      try {
        const user = await apiJson('/api/v1/auth/me');
        const [summary, activeEntitlements, usageSummary, planList, keyList] = await Promise.all([
          fetchOptionalJson('/api/v1/me/entitlements').catch(() => null),
          fetchOptionalJson('/api/v1/me/entitlements/list').catch(() => []),
          fetchOptionalJson('/api/v1/me/usage').catch(() => null),
          fetchOptionalJson('/api/v1/plans').catch(() => []),
          fetchOptionalJson('/api/v1/me/api-keys').catch(() => []),
        ]);

        if (!isMounted) return;
        setProfile(user);
        setForm({
          full_name: user.full_name || '',
          phone: user.phone || '',
        });
        setEntitlements(summary);
        setEntitlementList(Array.isArray(activeEntitlements) ? activeEntitlements : []);
        setUsage(usageSummary);
        setPlans(Array.isArray(planList) ? planList : []);
        setApiKeys(Array.isArray(keyList) ? keyList : []);
        onUserUpdated?.(user);
      } catch (err) {
        if (!isMounted) return;
        if (isAuthError(err)) {
          onUserUpdated?.(null);
          onNavigate?.('login');
          return;
        }
        setError(err instanceof Error ? err.message : t('Profil bilgileri alinamadi.', 'Profile information could not be loaded.'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [onNavigate, onUserUpdated, t]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === 'phone' ? value.replace(/\D/g, '').slice(0, 10) : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const updated = await apiJson('/api/v1/auth/me', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setProfile(updated);
      onUserUpdated?.(updated);
      setMessage(t('Profil bilgileriniz guncellendi.', 'Profile information updated.'));
    } catch (err) {
      if (isAuthError(err)) {
        onUserUpdated?.(null);
        onNavigate?.('login');
        return;
      }
      setError(err instanceof Error ? err.message : t('Profil guncellenemedi.', 'Profile could not be updated.'));
    } finally {
      setIsSaving(false);
    }
  };

  const createApiKey = async (event) => {
    event.preventDefault();
    if (!hasCorporateEntitlement) return;
    setIsCreatingApiKey(true);
    setApiKeyError('');
    setCreatedApiKey(null);

    try {
      const created = await apiJson('/api/v1/me/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: apiKeyName.trim() || 'Enterprise API Key' }),
      });
      setCreatedApiKey(created);
      setApiKeyCopied(false);
      setApiKeyName('');
      await refreshApiKeys();
    } catch (err) {
      if (isAuthError(err)) {
        onUserUpdated?.(null);
        onNavigate?.('login');
        return;
      }
      setApiKeyError(err instanceof Error ? err.message : t('API key olusturulamadi.', 'API key could not be created.'));
    } finally {
      setIsCreatingApiKey(false);
    }
  };

  const copyCreatedApiKey = async () => {
    if (!createdApiKey?.api_key) return;
    try {
      await navigator.clipboard.writeText(createdApiKey.api_key);
      setApiKeyCopied(true);
      window.setTimeout(() => setApiKeyCopied(false), 1800);
    } catch {
      setApiKeyError(t('API key kopyalanamadı.', 'API key could not be copied.'));
    }
  };

  const revokeApiKey = async (apiKeyId) => {
    setApiKeyError('');

    try {
      await apiJson(`/api/v1/me/api-keys/${apiKeyId}`, {
        method: 'DELETE',
      });
      await refreshApiKeys();
    } catch (err) {
      if (isAuthError(err)) {
        onUserUpdated?.(null);
        onNavigate?.('login');
        return;
      }
      setApiKeyError(err instanceof Error ? err.message : t('API key iptal edilemedi.', 'API key could not be revoked.'));
    }
  };

  const openEnterprisePricing = () => {
    try {
      sessionStorage.setItem('konusmatik_pricing_audience', 'enterprise');
    } catch {
      // Navigation should still work if storage is unavailable.
    }
    onNavigate?.('pricing');
  };

  if (!currentUser && !isLoading) {
    return (
      <main className="profile-page">
        <section className="profile-empty">
          <h1>{t('Profilinizi görüntülemek için giriş yapın.', 'Log in to view your profile.')}</h1>
          <p>{t('Hesap bilgilerinize, paketlerinize ve kalan kullanım haklarınıza giriş yaptıktan sonra ulaşabilirsiniz.', 'After logging in, you can access your account information, packages, and remaining usage rights.')}</p>
          <button type="button" className="profile-primary-btn" onClick={() => onNavigate?.('login')}>{t('Giriş Yap', 'Log In')}</button>
        </section>
      </main>
    );
  }

  return (
    <div className="studio-page profile-preview-v3 profile-page-v4">
      <StudioHero
        title="Profil ve Kullanım Hakları"
        titleEn="Profile and Usage Allowances"
        description="Hesap bilgilerinizi, aktif paketlerinizi ve API erişiminizi tek yerden yönetin."
        descriptionEn="Manage your account details, active plans, and API access in one place."
        steps={profileSteps}
        allStepsActive
        className="profile-preview-studio-hero"
        appLanguage={language}
      />

      <main className="studio-content corp-content-wrap profile-preview-content-v3">
        {isLoading && <div className="profile-alert">{t('Profil yükleniyor...', 'Profile is loading...')}</div>}
        {message && <div className="profile-alert success">{profileMessage(message, language)}</div>}
        {error && <div className="profile-alert error">{profileMessage(error, language)}</div>}

        <section className="contact-grid profile-preview-stats-v3" aria-label={t('Kalan haklar', 'Remaining credits')}>
          <article className="contact-card profile-preview-stat-v3">
            <span>{t('Seslendirme', 'Text-to-Speech')}</span>
            <strong>{formatQuota(entitlements?.tts?.remaining, entitlements?.tts?.quota_unit || 'character', language)}</strong>
            <p className={entitlements?.tts?.download_enabled ? 'profile-download-status is-enabled' : 'profile-download-status'}>{entitlements?.tts?.download_enabled ? t('İndirme yetkisi aktif', 'Download permission active') : t('İndirme yetkisi yok', 'No download permission')}</p>
          </article>
          <article className="contact-card profile-preview-stat-v3">
            <span>{t('Deşifre', 'Transcription')}</span>
            <strong>{formatQuota(entitlements?.asr?.remaining, entitlements?.asr?.quota_unit || 'second', language)}</strong>
            <p>{t('Ücretli deşifre hakkı', 'Paid transcription credit')}</p>
          </article>
          <article className="contact-card profile-preview-stat-v3">
            <span>{t('Kurumsal API TTS', 'Enterprise API TTS')}</span>
            <strong>{formatQuota(corporateTtsRemaining, 'character', language)}</strong>
            <p>{t('API key ile kullanılabilir karakter', 'Characters available via API key')}</p>
          </article>
          <article className="contact-card profile-preview-stat-v3">
            <span>{t('Kurumsal API ASR', 'Enterprise API ASR')}</span>
            <strong>{formatQuota(corporateAsrRemaining, 'second', language)}</strong>
            <p>{t('API key ile kullanılabilir dakika', 'Minutes available via API key')}</p>
          </article>
        </section>

        <section className="corp-block" aria-labelledby="profile-account-title">
          <div className="contact-section-heading">
            <h2 id="profile-account-title">{t('Hesabınızı güncel tutun', 'Keep your account up to date')}</h2>
            <p>{t('İletişim bilgilerinizi düzenleyin ve son kullanım toplamlarınızı inceleyin.', 'Edit your contact information and review your latest usage totals.')}</p>
          </div>
          <div className="profile-preview-account-grid-v3">
            <form className="contact-card profile-preview-form-v3" onSubmit={handleSubmit}>
              <div className="profile-preview-card-heading-v3">
                <h2>{profile?.full_name || profile?.email}</h2>
                <p>{profile?.email}</p>
              </div>
              <label>{t('Ad Soyad', 'Full Name')}<input name="full_name" value={form.full_name} onChange={handleChange} minLength="1" maxLength="255" required /></label>
              <label>{t('Telefon', 'Phone')}<input name="phone" value={form.phone} onChange={handleChange} minLength="10" maxLength="10" inputMode="numeric" required /></label>
              <button type="submit" className="profile-primary-btn" disabled={isSaving}>{isSaving ? t('Kaydediliyor...', 'Saving...') : t('Bilgileri Kaydet', 'Save Changes')}</button>
            </form>

            <article className="contact-card profile-preview-usage-v3">
              <div className="profile-preview-card-heading-v3">
                <h2>{t('Son kullanım toplamları', 'Latest usage totals')}</h2>
                <p>{t('Mevcut paketlerinizdeki tüketim ve rezervasyon bilgileri.', 'Consumption and reservation details for your current plans.')}</p>
              </div>
              <dl>
                <div><dt>{t('Seslendirme kullanıldı', 'Text-to-Speech used')}</dt><dd>{formatQuota(usage?.tts?.committed, usage?.tts?.usage_unit || 'character', language)}</dd></div>
                <div><dt>{t('Deşifre kullanıldı', 'Transcription used')}</dt><dd>{formatQuota(usage?.asr?.committed, usage?.asr?.usage_unit || 'second', language)}</dd></div>
                <div><dt>{t('Seslendirme rezerve', 'Text-to-Speech reserved')}</dt><dd>{formatQuota(usage?.tts?.reserved, usage?.tts?.usage_unit || 'character', language)}</dd></div>
                <div><dt>{t('Deşifre rezerve', 'Transcription reserved')}</dt><dd>{formatQuota(usage?.asr?.reserved, usage?.asr?.usage_unit || 'second', language)}</dd></div>
              </dl>
            </article>
          </div>
        </section>

        <section className="corp-block" aria-labelledby="profile-plans-title">
          <div className="profile-preview-section-row-v3">
            <div className="contact-section-heading"><h2 id="profile-plans-title">{t('Sahip olduğunuz paketler', 'Your plans')}</h2></div>
            <button type="button" className="profile-secondary-btn" onClick={() => onNavigate?.('pricing')}>{t('Yeni Paket Al', 'Purchase New Plan')}</button>
          </div>
          {entitlementList.length ? (
            <div className="profile-preview-plan-grid-v3">
              {entitlementList.map((entitlement) => <EntitlementCard key={entitlement.id} entitlement={entitlement} planMap={planMap} language={language} t={t} />)}
            </div>
          ) : (
            <div className="profile-no-package">
              <strong>{t('Aktif ücretli paket bulunmuyor.', 'No active paid package found.')}</strong>
              <p>{t('Ücretsiz haklarınızla deneyebilir veya ihtiyacınıza uygun bir paket satın alabilirsiniz.', 'You can try it with your free credits or purchase a package that fits your needs.')}</p>
            </div>
          )}
        </section>

        <section className="corp-block profile-preview-api-v3" aria-labelledby="profile-api-title">
          <div className="profile-preview-section-row-v3">
            <div className="contact-section-heading">
              <h2 id="profile-api-title">{t('API erişiminizi güvenle yönetin', 'Manage your API access securely')}</h2>
              <p>{t('Uygulamalarınız için yeni anahtar oluşturun, kullanım durumunu takip edin veya erişimi iptal edin.', 'Create keys for your applications, track their usage status, or revoke access.')}</p>
            </div>
            <button type="button" className="profile-secondary-btn" onClick={() => onNavigate?.('api-docs')}>{t('API Dokümantasyonu', 'API Documentation')}</button>
          </div>

          <div className="contact-card profile-preview-key-manager-v3">
            <div className="profile-preview-key-manager-head-v3">
              <div>
                <h3>{t('API Anahtarları', 'API Keys')}</h3>
                <p>{t('Anahtarlarınızı yalnızca güvendiğiniz uygulamalarda kullanın.', 'Use your keys only in applications you trust.')}</p>
              </div>
            </div>

            {!hasCorporateEntitlement && (
              <div className="profile-no-package">
                <strong>{t('API key oluşturmak için aktif kurumsal paket gerekir.', 'An active enterprise package is required to create an API key.')}</strong>
                <p>{t('Kurumsal paket satın aldıktan veya admin tarafından tanımlandıktan sonra API key oluşturabilirsiniz.', 'After purchasing an enterprise package or having one assigned by an admin, you can create an API key.')}</p>
                <button type="button" className="profile-primary-btn" onClick={openEnterprisePricing}>{t('Kurumsal Paket Al', 'Get Enterprise Package')}</button>
              </div>
            )}

            {hasCorporateEntitlement && (
              <form onSubmit={createApiKey}>
                <label><span>{t('Anahtar adı', 'Key name')}</span><input value={apiKeyName} onChange={(event) => setApiKeyName(event.target.value)} maxLength="120" placeholder="Production API" /></label>
                <button type="submit" className="profile-primary-btn" disabled={isCreatingApiKey}>{isCreatingApiKey ? t('Oluşturuluyor...', 'Creating...') : t('Yeni API Key Oluştur', 'Create New API Key')}</button>
              </form>
            )}

            {createdApiKey && (
              <div className="profile-preview-created-v3">
                <div>
                  <strong>{t('Yeni anahtarınız hazır', 'Your new key is ready')}</strong>
                  <p>{t('Bu değer yalnızca bir kez gösterilir.', 'This value is shown only once.')}</p>
                </div>
                <div className="profile-preview-created-value-v3">
                  <code>{createdApiKey.api_key}</code>
                  <button type="button" className={`profile-preview-copy-icon-v3${apiKeyCopied ? ' copied' : ''}`} onClick={copyCreatedApiKey} aria-label={apiKeyCopied ? t('Kopyalandı', 'Copied') : t('Kopyala', 'Copy')} title={apiKeyCopied ? t('Kopyalandı', 'Copied') : t('Kopyala', 'Copy')}>
                    <CopyIcon copied={apiKeyCopied} />
                  </button>
                </div>
              </div>
            )}

            {apiKeyError && <div className="profile-alert error">{profileMessage(apiKeyError, language)}</div>}

            <div className="profile-preview-key-list-v3">
              {apiKeys.length ? apiKeys.map((apiKey) => <ApiKeyRow key={apiKey.id} apiKey={apiKey} onRevoke={revokeApiKey} language={language} t={t} />) : (
                <div className="profile-no-package">
                  <strong>{t('Henüz API key yok.', 'No API key yet.')}</strong>
                  <p>{t('Kurumsal paketinizi API ile kullanmak için yeni bir key oluşturun.', 'Create a new key to use your enterprise package with the API.')}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
