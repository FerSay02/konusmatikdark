import { useCallback, useEffect, useMemo, useState } from 'react';
import './Admin.theme.css';
import { apiJson, isAuthError } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';

const tabs = [
  { id: 'overview', tr: 'Ozet', en: 'Overview' },
  { id: 'users', tr: 'Kullanicilar', en: 'Users' },
  { id: 'plans', tr: 'Paketler', en: 'Packages' },
  { id: 'payments', tr: 'Odemeler', en: 'Payments' },
  { id: 'jobs', tr: 'Isler', en: 'Jobs' },
  { id: 'usage', tr: 'Kullanim', en: 'Usage' },
];

const emptyEntitlement = {
  userId: '',
  planId: '',
  type: 'tts',
  quotaAmount: '',
  downloadEnabled: true,
};

function formatDate(value, language = 'tr') {
  if (!value) return '-';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatNumber(value, language = 'tr') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR').format(Number(value || 0));
}

function statusLabel(value, language = 'tr') {
  if (!value) return '-';
  if (value === 'ok') return language === 'en' ? 'OK' : 'Çalışıyor';
  if (language !== 'en') return value;
  if (value === 'aktif' || value === 'active') return 'Active';
  if (value === 'pasif' || value === 'passive') return 'Inactive';
  if (value === 'pending') return 'Pending';
  if (value === 'completed') return 'Completed';
  if (value === 'failed') return 'Failed';
  if (value === 'cancelled' || value === 'canceled') return 'Cancelled';
  return value;
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

function planName(value, language = 'tr') {
  if (!value || language !== 'en') return value;
  return value
    .replace(/Kurumsal/g, 'Enterprise')
    .replace(/Bireysel/g, 'Individual')
    .replace(/Karakter/g, 'Character')
    .replace(/Dakika/g, 'Minute')
    .replace(/Audioi.*?evirme/gi, 'Audio-to-Text Transcription')
    .replace(/Yaziya Cevirme/gi, 'Transcription')
    .replace(/Seslendirme/g, 'Text-to-Speech')
    .replace(/Desifre/g, 'Transcription');
}

function adminJson(path, options = {}) {
  return apiJson(path, {
    ...options,
  });
}

export default function Admin({ currentUser, onNavigate, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = useCallback((tr, en) => (isEnglish ? en : restoreTurkishUiText(tr)), [isEnglish]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [ttsJobs, setTtsJobs] = useState([]);
  const [asrJobs, setAsrJobs] = useState([]);
  const [usageLogs, setUsageLogs] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [planDrafts, setPlanDrafts] = useState({});
  const [entitlementForm, setEntitlementForm] = useState(emptyEntitlement);

  const normalizedRole = String(currentUser?.role || '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || currentUser?.is_admin === true || currentUser?.isAdmin === true;

  const stats = useMemo(() => ({
    users: users.length,
    activePlans: plans.filter((plan) => plan.is_active).length,
    ttsJobs: ttsJobs.length,
    asrJobs: asrJobs.length,
    usageLogs: usageLogs.length,
    orders: orders.length,
    payments: payments.length,
  }), [users, plans, ttsJobs, asrJobs, usageLogs, orders, payments]);

  const activePlans = useMemo(() => plans.filter((plan) => plan.is_active), [plans]);
  const selectedEntitlementPlan = useMemo(
    () => activePlans.find((plan) => plan.id === entitlementForm.planId),
    [activePlans, entitlementForm.planId],
  );

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const [healthData, usersData, plansData, ttsData, asrData, usageData, ordersData, paymentsData] = await Promise.all([
        adminJson('/api/v1/admin/health/services'),
        adminJson('/api/v1/admin/users?limit=100'),
        adminJson('/api/v1/admin/plans?include_inactive=true'),
        adminJson('/api/v1/admin/tts/jobs?limit=100'),
        adminJson('/api/v1/admin/asr/jobs?limit=100'),
        adminJson('/api/v1/admin/usage?limit=100'),
        adminJson('/api/v1/admin/orders?limit=100'),
        adminJson('/api/v1/admin/payments?limit=100'),
      ]);

      setHealth(healthData);
      setUsers(usersData);
      setPlans(plansData);
      setTtsJobs(ttsData);
      setAsrJobs(asrData);
      setUsageLogs(usageData);
      setOrders(ordersData);
      setPayments(paymentsData);
      setPlanDrafts(Object.fromEntries(plansData.map((plan) => [plan.id, {
        name: plan.name,
        price_without_vat: plan.price_without_vat,
        vat_rate: plan.vat_rate,
        price_with_vat: plan.price_with_vat,
        quota_amount: plan.quota_amount,
        download_enabled: plan.download_enabled,
        is_active: plan.is_active,
      }])));
    } catch (err) {
      if (isAuthError(err)) {
        onNavigate?.('login');
        return;
      }
      setError(err instanceof Error ? err.message : t('Admin verileri alinamadi.', 'Admin data could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, [onNavigate, t]);

  useEffect(() => {
    if (!isAdmin) return;
    queueMicrotask(() => {
      loadAdminData();
    });
  }, [isAdmin, loadAdminData]);

  const updatePlanDraft = (planId, field, value) => {
    setPlanDrafts((current) => ({
      ...current,
      [planId]: {
        ...current[planId],
        [field]: value,
      },
    }));
  };

  const savePlan = async (planId) => {
    setMessage('');
    setError('');

    try {
      const draft = planDrafts[planId];
      await adminJson(`/api/v1/admin/plans/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: draft.name,
          quota_amount: Number(draft.quota_amount),
          price_without_vat: Number(draft.price_without_vat),
          vat_rate: Number(draft.vat_rate),
          price_with_vat: Number(draft.price_with_vat),
          download_enabled: Boolean(draft.download_enabled),
          is_active: Boolean(draft.is_active),
        }),
      });
      setMessage(t('Paket guncellendi.', 'Package updated.'));
      await loadAdminData();
    } catch (err) {
      if (isAuthError(err)) {
        onNavigate?.('login');
        return;
      }
      setError(err instanceof Error ? err.message : t('Paket guncellenemedi.', 'Package could not be updated.'));
    }
  };

  const deactivatePlan = async (planId) => {
    setMessage('');
    setError('');

    try {
      await adminJson(`/api/v1/admin/plans/${planId}`, { method: 'DELETE' });
      setMessage(t('Paket pasife alindi.', 'Package deactivated.'));
      await loadAdminData();
    } catch (err) {
      if (isAuthError(err)) {
        onNavigate?.('login');
        return;
      }
      setError(err instanceof Error ? err.message : t('Paket pasife alinamadi.', 'Package could not be deactivated.'));
    }
  };

  const selectEntitlementPlan = (planId) => {
    const plan = activePlans.find((item) => item.id === planId);
    if (!plan) {
      setEntitlementForm((current) => ({ ...current, planId: '' }));
      return;
    }

    setEntitlementForm((current) => ({
      ...current,
      planId: plan.id,
      type: plan.type,
      quotaAmount: String(plan.quota_amount),
      downloadEnabled: Boolean(plan.download_enabled),
    }));
  };

  const selectEntitlementUser = (userId) => {
    setEntitlementForm((current) => ({ ...current, userId }));
  };

  const grantEntitlement = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await adminJson(`/api/v1/admin/users/${entitlementForm.userId}/entitlements`, {
        method: 'POST',
        body: JSON.stringify({
          type: entitlementForm.type,
          quota_unit: entitlementForm.type === 'tts' ? 'character' : 'second',
          quota_amount: Number(entitlementForm.quotaAmount),
          download_enabled: Boolean(entitlementForm.downloadEnabled),
          plan_id: entitlementForm.planId || null,
        }),
      });
      setEntitlementForm(emptyEntitlement);
      setMessage(t('Kullaniciya paket/hak tanimlandi.', 'Package/credit assigned to user.'));
      await loadAdminData();
    } catch (err) {
      if (isAuthError(err)) {
        onNavigate?.('login');
        return;
      }
      setError(err instanceof Error ? err.message : t('Hak tanimlanamadi.', 'Credit could not be assigned.'));
    }
  };

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <section className="admin-empty-state">
          <h1>{t('Admin erisimi gerekli', 'Admin access required')}</h1>
          <p>{t('Bu sayfayi kullanmak icin admin yetkisine sahip bir hesapla giris yapmalisiniz.', 'You must log in with an admin account to use this page.')}</p>
          <button type="button" className="admin-primary-btn" onClick={() => onNavigate?.('login')}>{t('Giris ekranina don', 'Return to login screen')}</button>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="admin-kicker">{t('Yonetim Paneli', 'Admin Panel')}</span>
          <h1>{t('Konusmatik Admin', 'Konusmatik Admin')}</h1>
          <p>{t('Kullanıcılar, paketler, işlem kayıtları ve servis durumunu buradan yönetin.', 'Manage users, packages, activity logs, and service status here.')}</p>
        </div>
        <button type="button" className="admin-secondary-btn" onClick={loadAdminData}>{t('Yenile', 'Refresh')}</button>
      </header>

      {error && <div className="admin-alert error">{error}</div>}
      {message && <div className="admin-alert success">{message}</div>}

      <nav className="admin-tabs" aria-label={t('Admin bolumleri', 'Admin sections')}>
        {tabs.map((tab) => (
          <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)}>
            {t(tab.tr, tab.en)}
          </button>
        ))}
      </nav>

      {isLoading ? <div className="admin-loading">{t('Admin verileri yukleniyor...', 'Admin data is loading...')}</div> : null}

      {!isLoading && activeTab === 'overview' && (
        <section className="admin-section">
          <div className="admin-stat-grid">
            <article><strong>{stats.users}</strong><span>{t('Kullanici', 'Users')}</span></article>
            <article><strong>{stats.activePlans}</strong><span>{t('Aktif paket', 'Active Packages')}</span></article>
            <article><strong>{stats.ttsJobs}</strong><span>{t('TTS işi', 'TTS Jobs')}</span></article>
            <article><strong>{stats.asrJobs}</strong><span>{t('ASR işi', 'ASR Jobs')}</span></article>
            <article><strong>{stats.usageLogs}</strong><span>{t('Kullanım Kayıtları', 'Usage Logs')}</span></article>
            <article><strong>{stats.orders}</strong><span>{t('Sipariş', 'Orders')}</span></article>
            <article><strong>{stats.payments}</strong><span>{t('Ödeme', 'Payments')}</span></article>
          </div>

          <div className="admin-panel">
            <h2>{t('Servis sağlığı', 'Service Health')}</h2>
            <div className="admin-service-grid">
              {health?.services && Object.entries(health.services).map(([name, state]) => (
                <div key={name} className="admin-service-row">
                  <span>{name}</span>
                  <strong className={state === 'ok' ? 'ok' : 'bad'}>{statusLabel(state, language)}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!isLoading && activeTab === 'users' && (
        <section className="admin-section admin-grid-2">
          <div className="admin-panel">
            <h2>{t('Kullanicilar', 'Users')}</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>{t('E-posta', 'Email')}</th><th>{t('Rol', 'Role')}</th><th>{t('Durum', 'Status')}</th><th>{t('TTS kalan', 'TTS remaining')}</th><th>{t('ASR paket', 'ASR package')}</th><th>{t('ASR ucretsiz', 'Free ASR')}</th><th>{t('Kayit', 'Created')}</th><th>ID</th><th>{t('Islem', 'Action')}</th></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{user.is_active ? t('aktif', 'active') : t('pasif', 'passive')}</td>
                      <td>{formatNumber(user.tts_remaining, language)} {t('karakter', 'characters')}</td>
                      <td>{formatNumber(user.asr_remaining, language)} {t('sn', 'sec')}</td>
                      <td>{formatNumber(user.asr_free_remaining, language)} {t('sn', 'sec')}</td>
                      <td>{formatDate(user.created_at, language)}</td>
                      <td className="admin-mono">{user.id}</td>
                      <td><button type="button" className="admin-secondary-btn admin-small-btn" onClick={() => selectEntitlementUser(user.id)}>{t('Paket tanimla', 'Assign package')}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form className="admin-panel admin-form" onSubmit={grantEntitlement}>
            <h2>{t('Paket / hak tanimla', 'Assign package / credit')}</h2>
            <label>{t('Kullanici', 'User')}
              <select value={entitlementForm.userId} onChange={(event) => setEntitlementForm({ ...entitlementForm, userId: event.target.value })} required>
                <option value="">{t('Kullanici secin', 'Select user')}</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.email}</option>
                ))}
              </select>
            </label>
            <label>{t('Paket', 'Package')}
              <select value={entitlementForm.planId} onChange={(event) => selectEntitlementPlan(event.target.value)}>
                <option value="">{t('Paket secmeden manuel hak', 'Manual credit without selecting a package')}</option>
                {activePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>[{audienceLabel(plan.audience, language)}] {planName(plan.name, language)} - {formatNumber(plan.quota_amount, language)} {plan.quota_unit}</option>
                ))}
              </select>
            </label>
            {selectedEntitlementPlan && (
              <div className="admin-plan-selection-note">
                <strong>{audienceLabel(selectedEntitlementPlan.audience, language)} {t('paket secildi.', 'package selected.')}</strong>
                <span>{t('Tip, kota, indirme ve gecerlilik degerleri backend tarafinda bu paketten otomatik tanimlanir.', 'Type, quota, download, and validity values are assigned automatically from this package by the backend.')}</span>
              </div>
            )}
            <label>{t('Hak tipi', 'Credit type')}
              <select value={entitlementForm.type} onChange={(event) => setEntitlementForm({ ...entitlementForm, type: event.target.value, planId: '' })} disabled={Boolean(entitlementForm.planId)}>
                <option value="tts">{t('TTS karakter', 'TTS characters')}</option>
                <option value="asr">{t('ASR saniye', 'ASR seconds')}</option>
              </select>
            </label>
            <label>{t('Miktar', 'Amount')}
              <input type="number" min="1" value={entitlementForm.quotaAmount} onChange={(event) => setEntitlementForm({ ...entitlementForm, quotaAmount: event.target.value, planId: '' })} disabled={Boolean(entitlementForm.planId)} required />
            </label>
            <label className="admin-check-row">
              <input type="checkbox" checked={entitlementForm.downloadEnabled} onChange={(event) => setEntitlementForm({ ...entitlementForm, downloadEnabled: event.target.checked })} disabled={Boolean(entitlementForm.planId)} />
              {t('Indirme hakki acik', 'Download permission enabled')}
            </label>
            <button type="submit" className="admin-primary-btn">{t('Kullaniciya tanimla', 'Assign to user')}</button>
          </form>
        </section>
      )}

      {!isLoading && activeTab === 'plans' && (
        <section className="admin-section">
          <div className="admin-plan-list">
            {plans.map((plan) => {
              const draft = planDrafts[plan.id] || {};
              return (
                <article key={plan.id} className="admin-plan-card">
                  <div className="admin-plan-head">
                    <div><strong>{plan.code}</strong><span>{plan.type.toUpperCase()} / {plan.quota_unit}</span></div>
                    <span className={plan.is_active ? 'admin-badge active' : 'admin-badge'}>{plan.is_active ? t('aktif', 'active') : t('pasif', 'passive')}</span>
                  </div>
                  <div className="admin-plan-fields">
                    <label>{t('Ad', 'Name')}<input value={draft.name || ''} onChange={(event) => updatePlanDraft(plan.id, 'name', event.target.value)} /></label>
                    <label>{t('Kota', 'Quota')}<input type="number" value={draft.quota_amount || ''} onChange={(event) => updatePlanDraft(plan.id, 'quota_amount', event.target.value)} /></label>
                    <label>{t('KDV haric', 'Excl. VAT')}<input type="number" step="0.01" value={draft.price_without_vat || ''} onChange={(event) => updatePlanDraft(plan.id, 'price_without_vat', event.target.value)} /></label>
                    <label>{t('KDV %', 'VAT %')}<input type="number" step="0.01" value={draft.vat_rate || ''} onChange={(event) => updatePlanDraft(plan.id, 'vat_rate', event.target.value)} /></label>
                    <label>{t('KDV dahil', 'Incl. VAT')}<input type="number" step="0.01" value={draft.price_with_vat || ''} onChange={(event) => updatePlanDraft(plan.id, 'price_with_vat', event.target.value)} /></label>
                  </div>
                  <div className="admin-plan-actions">
                    <label className="admin-check-row"><input type="checkbox" checked={Boolean(draft.download_enabled)} onChange={(event) => updatePlanDraft(plan.id, 'download_enabled', event.target.checked)} />{t('Indirme', 'Download')}</label>
                    <label className="admin-check-row"><input type="checkbox" checked={Boolean(draft.is_active)} onChange={(event) => updatePlanDraft(plan.id, 'is_active', event.target.checked)} />{t('Aktif', 'Active')}</label>
                    <button type="button" className="admin-primary-btn" onClick={() => savePlan(plan.id)}>{t('Kaydet', 'Save')}</button>
                    <button type="button" className="admin-danger-btn" onClick={() => deactivatePlan(plan.id)}>{t('Pasife al', 'Deactivate')}</button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {!isLoading && activeTab === 'payments' && (
        <section className="admin-section admin-grid-2">
          <div className="admin-panel">
            <h2>{t('Siparisler', 'Orders')}</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>{t('Durum', 'Status')}</th><th>{t('Kullanici', 'User')}</th><th>{t('Paket', 'Package')}</th><th>{t('Tutar', 'Amount')}</th><th>OID</th><th>{t('Odeme tarihi', 'Payment date')}</th></tr></thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>{statusLabel(order.status, language)}</td>
                      <td>{order.user_email || order.user_id}</td>
                      <td>{planName(order.plan_name || order.plan_id, language)}</td>
                      <td>{formatNumber(order.amount_with_vat, language)} {order.currency}</td>
                      <td className="admin-mono">{order.merchant_oid}</td>
                      <td>{formatDate(order.paid_at || order.created_at, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-panel">
            <h2>{t('PayTR odemeleri', 'PayTR payments')}</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>{t('Durum', 'Status')}</th><th>{t('Tip', 'Type')}</th><th>{t('Taksit', 'Installment')}</th><th>{t('Dogrulama', 'Verification')}</th><th>{t('Kullanici', 'User')}</th><th>{t('Tutar', 'Amount')}</th><th>{t('Tarih', 'Date')}</th></tr></thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{statusLabel(payment.status, language)}</td>
                      <td>{payment.payment_type || '-'}</td>
                      <td>{payment.installment_count || '-'}</td>
                      <td>{payment.hash_verified ? 'hash ok' : t('hash yok', 'no hash')}</td>
                      <td>{payment.user_email || payment.user_id || '-'}</td>
                      <td>{payment.amount_with_vat ? `${formatNumber(payment.amount_with_vat, language)} ${payment.currency}` : '-'}</td>
                      <td>{formatDate(payment.created_at, language)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {!isLoading && activeTab === 'jobs' && (
        <section className="admin-section admin-grid-2">
          <JobTable title={t('TTS isleri', 'TTS jobs')} jobs={ttsJobs} columns={[['character_count', t('Karakter', 'Characters')], ['voice', t('Ses', 'Voice')]]} language={language} t={t} />
          <JobTable title={t('ASR isleri', 'ASR jobs')} jobs={asrJobs} columns={[['audio_duration_seconds', t('Sure sn', 'Duration sec')], ['language', t('Dil', 'Language')]]} language={language} t={t} />
        </section>
      )}

      {!isLoading && activeTab === 'usage' && (
        <section className="admin-section admin-panel">
          <h2>{t('Kullanim loglari', 'Usage logs')}</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>{t('Tip', 'Type')}</th><th>{t('Kaynak', 'Source')}</th><th>{t('Durum', 'Status')}</th><th>{t('Miktar', 'Amount')}</th><th>{t('Kullanici', 'User')}</th><th>{t('Tarih', 'Date')}</th></tr></thead>
              <tbody>
                {usageLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{log.job_type}</td>
                    <td>{log.source}</td>
                    <td>{statusLabel(log.status, language)}</td>
                    <td>{formatNumber(log.amount_used, language)} {log.usage_unit}</td>
                    <td className="admin-mono">{log.user_id || '-'}</td>
                    <td>{formatDate(log.created_at, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function JobTable({ title, jobs, columns, language, t }) {
  return (
    <div className="admin-panel">
      <h2>{title}</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>{t('Durum', 'Status')}</th><th>{t('Kullanici', 'User')}</th>{columns.map(([, label]) => <th key={label}>{label}</th>)}<th>{t('Tarih', 'Date')}</th></tr></thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{statusLabel(job.status, language)}</td>
                <td className="admin-mono">{job.user_id || '-'}</td>
                {columns.map(([key]) => <td key={key}>{job[key] ?? '-'}</td>)}
                <td>{formatDate(job.created_at, language)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
