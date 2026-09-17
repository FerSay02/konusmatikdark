import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Pricing.theme.css';
import '../application-light-theme.css';

import { apiJson } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import StudioHero from '../components/StudioHero';
import { pricingHeroContent, pricingSteps } from '../data/studioContent';

const PLAN_ENDPOINT = '/api/v1/plans';

function formatMoney(value, language = 'tr') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR', {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function extractPlansResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.plans)) return payload.plans;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function normalizePlanType(plan) {
  const rawType = String(plan.type || plan.service_type || plan.product_type || plan.kind || '').toLowerCase();
  if (['tts', 'text_to_speech', 'text-to-speech', 'text to speech', 'seslendirme'].includes(rawType)) return 'tts';
  if (['asr', 'stt', 'speech_to_text', 'speech-to-text', 'speech to text', 'transcription', 'desifre', 'deşifre'].includes(rawType)) return 'asr';
  if (rawType.includes('voice') || rawType.includes('ses klonlama')) return 'voice_cloning';
  return rawType;
}

function normalizeAudience(plan) {
  const rawAudience = String(plan.audience || plan.customer_type || plan.segment || plan.plan_type || 'individual').toLowerCase();
  if (['enterprise', 'corporate', 'kurumsal'].includes(rawAudience)) return 'enterprise';
  if (['sme', 'kobi', 'kobı', 'business'].includes(rawAudience)) return 'sme';
  return 'individual';
}

function parsePlanNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const compact = value.trim().replace(/[^\d,.-]/g, '');
  if (!compact) return 0;

  const lastComma = compact.lastIndexOf(',');
  const lastDot = compact.lastIndexOf('.');
  let normalized = compact;

  if (lastComma > -1 && lastDot > -1) {
    normalized = lastComma > lastDot
      ? compact.replace(/\./g, '').replace(',', '.')
      : compact.replace(/,/g, '');
  } else if (lastComma > -1) {
    const decimals = compact.length - lastComma - 1;
    normalized = decimals === 2 ? compact.replace(/\./g, '').replace(',', '.') : compact.replace(/,/g, '');
  } else if (lastDot > -1) {
    const decimals = compact.length - lastDot - 1;
    normalized = decimals === 2 ? compact : compact.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function numberFromPlan(plan, fields) {
  for (const field of fields) {
    const value = parsePlanNumber(plan[field]);
    if (value > 0) return value;
  }
  return 0;
}

function normalizePlan(plan, language = 'tr') {
  const type = normalizePlanType(plan);
  const audience = normalizeAudience(plan);
  const price = numberFromPlan(plan, ['price_without_vat', 'net_price', 'base_price', 'price', 'amount_without_vat']);
  const priceWithVat = numberFromPlan(plan, ['price_with_vat', 'gross_price', 'total_price', 'amount_with_vat']);
  const quota = numberFromPlan(plan, ['quota_amount', 'quota', 'credits', 'amount']);
  const quotaUnit = String(plan.quota_unit || plan.unit || '').toLowerCase();
  const isTts = type === 'tts';
  const isVoiceCloning = type === 'voice_cloning';
  const isCreditBased = ['credit', 'credits', 'kredi'].includes(quotaUnit);
  const isMinuteBased = ['minute', 'minutes', 'dakika', 'min'].includes(quotaUnit);
  const displayAmount = isTts || isMinuteBased || isVoiceCloning ? quota : quota / 60;
  const numberLocale = language === 'en' ? 'en-US' : 'tr-TR';
  const amount = new Intl.NumberFormat(numberLocale, { maximumFractionDigits: 0 }).format(displayAmount);
  const unit = isTts
    ? (language === 'en' ? 'Characters' : 'Karakter')
    : isVoiceCloning
      ? (language === 'en' ? 'Voice Slot' : 'Ses Hakkı')
      : (language === 'en' ? 'Minutes' : 'Dakika');
  const perUnitBase = Math.max(isTts ? quota / 1000 : isVoiceCloning ? quota : displayAmount, 1);
  const perUnitLabel = isTts
    ? (language === 'en' ? '1,000 Characters' : '1.000 Karakter')
    : isVoiceCloning
      ? (language === 'en' ? 'Voice Slot' : 'Ses Hakkı')
      : (language === 'en' ? 'Minute' : 'Dakika');

  return {
    planId: plan.id,
    productCode: plan.code || plan.product_code,
    productName: plan.name || plan.title,
    sortOrder: Number(plan.sort_order || 0),
    type,
    audience,
    amount,
    unit,
    voiceCloningEnabled: Boolean(plan.voice_cloning_enabled),
    voiceSlotLimit: Number(plan.voice_slot_limit || 0),
    price,
    priceWithVat: priceWithVat || (price > 0 ? Math.round(price * 1.2 * 100) / 100 : 0),
    perUnit: `${formatMoney(price / perUnitBase, language)} TL / ${perUnitLabel}`,
  };
}

function freeTrialPlan(type, language = 'tr') {
  const isTts = type === 'tts';
  return {
    planId: '',
    productCode: isTts ? 'FREE_TTS_TRIAL' : 'FREE_ASR_TRIAL',
    productName: isTts ? 'Ücretsiz deneme seslendirme' : 'Ücretsiz deneme deşifre',
    sortOrder: -1,
    type,
    audience: 'individual',
    amount: isTts ? '3.500' : '10',
    unit: isTts
      ? (language === 'en' ? 'Characters' : 'Karakter')
      : (language === 'en' ? 'Minutes' : 'Dakika'),
    price: 0,
    priceWithVat: 0,
    perUnit: isTts
      ? (language === 'en' ? 'Free trial characters' : 'Ücretsiz deneme karakteri')
      : (language === 'en' ? 'Free trial characters' : 'Ücretsiz deneme karakteri'),
    isFreeTrial: true,
  };
}

function planNameFor(plan, language = 'tr') {
  if (!plan) return '';
  if (language !== 'en') return restoreTurkishUiText(plan.productName || `${plan.amount} ${plan.unit}`);
  const service = plan.type === 'tts'
    ? 'Text-to-Speech'
    : plan.type === 'voice_cloning'
      ? 'Voice Cloning'
      : 'Audio-to-Text Transcription';
  const prefix = plan.audience === 'enterprise' ? 'Enterprise ' : plan.audience === 'sme' ? 'SME ' : '';
  return `${prefix}${plan.amount} ${plan.unit} ${service}`;
}

function statusFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const state = params.get('payment');
  if (state === 'success') return { tone: 'success', textTr: 'Ödeme başarıyla tamamlandı.', textEn: 'Payment completed successfully.' };
  if (state === 'failed') return { tone: 'error', textTr: 'Ödeme tamamlanamadı. Lütfen tekrar deneyin.', textEn: 'Payment could not be completed. Please try again.' };
  return null;
}

function initialAudience() {
  try {
    const stored = sessionStorage.getItem('konusmatik_pricing_audience');
    sessionStorage.removeItem('konusmatik_pricing_audience');
    return ['individual', 'sme', 'enterprise'].includes(stored) ? stored : 'individual';
  } catch {
    return 'individual';
  }
}

function AnimatedPrice({ value, label, language }) {
  const [display, setDisplay] = useState(value);
  const previousValue = useRef(value);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;

    if (from === to) {
      setDisplay(to);
      return undefined;
    }

    const duration = 500;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  if (label) return <span className="anim-price free-glow">{label}</span>;

  return (
    <span className="anim-price">
      {display.toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')}
      <span className="anim-currency"> TL</span>
    </span>
  );
}

export default function Pricing({ currentUser, onNavigate, onCheckout, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = useCallback((tr, en) => (isEnglish ? en : restoreTurkishUiText(tr)), [isEnglish]);
  const [audience, setAudience] = useState(() => initialAudience());
  const [ttsIndex, setTtsIndex] = useState(0);
  const [asrIndex, setAsrIndex] = useState(0);
  const [backendPlans, setBackendPlans] = useState([]);
  const [isPlansLoading, setIsPlansLoading] = useState(true);
  const [planLoadErrorKey, setPlanLoadErrorKey] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [queryStatus, setQueryStatus] = useState(() => statusFromQuery());

  useEffect(() => {
    let isMounted = true;

    apiJson(PLAN_ENDPOINT)
      .then((payload) => {
        if (!isMounted) return;
        const plans = extractPlansResponse(payload).filter((plan) => plan?.is_active !== false);
        setBackendPlans(plans);
        setPlanLoadErrorKey(plans.length ? '' : 'empty');
      })
      .catch(() => {
        if (isMounted) setPlanLoadErrorKey('load');
      })
      .finally(() => {
        if (isMounted) setIsPlansLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!queryStatus) return;
    const params = new URLSearchParams(window.location.search);
    params.delete('payment');
    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`;
    window.history.replaceState({}, '', url);
  }, [queryStatus]);

  const ttsPlans = useMemo(() => backendPlans
    .filter((plan) => normalizePlanType(plan) === 'tts' && normalizeAudience(plan) === audience)
    .map((plan) => normalizePlan(plan, language))
    .sort((a, b) => a.sortOrder - b.sortOrder), [audience, backendPlans, language]);

  const asrPlans = useMemo(() => backendPlans
    .filter((plan) => normalizePlanType(plan) === 'asr' && normalizeAudience(plan) === audience)
    .map((plan) => normalizePlan(plan, language))
    .sort((a, b) => a.sortOrder - b.sortOrder), [audience, backendPlans, language]);

  const ttsPlansForUi = useMemo(() => (
    audience === 'individual' && !isPlansLoading
      ? [freeTrialPlan('tts', language), ...ttsPlans]
      : ttsPlans
  ), [audience, isPlansLoading, language, ttsPlans]);

  const asrPlansForUi = useMemo(() => (
    audience === 'individual' && !isPlansLoading
      ? [freeTrialPlan('asr', language), ...asrPlans]
      : asrPlans
  ), [audience, asrPlans, isPlansLoading, language]);

  const ttsEffectiveIndex = Math.min(ttsIndex, Math.max(ttsPlansForUi.length - 1, 0));
  const asrEffectiveIndex = Math.min(asrIndex, Math.max(asrPlansForUi.length - 1, 0));
  const tts = ttsPlansForUi[ttsEffectiveIndex] || null;
  const asr = asrPlansForUi[asrEffectiveIndex] || null;
  const planLoadError = planLoadErrorKey === 'empty'
    ? t('Aktif paket bulunamadı.', 'No active packages were found.')
    : planLoadErrorKey === 'load'
      ? t('Paket bilgileri alınamadı. Lütfen daha sonra tekrar deneyin.', 'Package information could not be loaded. Please try again later.')
      : '';

  const changeAudience = (nextAudience) => {
    setAudience(nextAudience);
    setTtsIndex(0);
    setAsrIndex(0);
    setPaymentError('');
  };

  const startPayment = (plan) => {
    if (isPlansLoading || !plan) return;
    if (plan.isFreeTrial) {
      onNavigate?.(plan.type === 'tts' ? 'tts' : 'asr');
      return;
    }
    if (plan.price <= 0) return;
    if (!currentUser) {
      setPaymentError(t('Satın alma işlemi için önce giriş yapmalısınız.', 'You need to log in before purchasing.'));
      onNavigate?.('login');
      return;
    }
    if (!plan.planId) {
      setPaymentError(t('Bu paket için ödeme bilgisi henüz hazır değil. Lütfen paket listesinin yüklenmesini bekleyin.', 'Payment information is not ready for this package yet. Please wait for the package list to load.'));
      return;
    }
    setQueryStatus(null);
    setPaymentError('');
    onCheckout?.({ ...plan, productName: planNameFor(plan, language) });
  };

  const audienceTitle = audience === 'individual'
    ? t('Bireysel paketler', 'Individual packages')
    : audience === 'sme'
      ? t('KOBİ paket görünümü', 'SME package view')
      : t('Kurumsal API paketleri', 'Enterprise API packages');

  const introCopy = audience === 'enterprise'
    ? t('Kurumsal paketler API kullanımı, kurumsal fatura ve yüksek hacimli üretim için hazırlanır. Daha büyük hacim ve local kurulum için teklif alabilirsiniz.', 'Enterprise packages are prepared for API use, corporate invoicing, and high-volume production. You can request an offer for larger volume and local setup.')
    : t('Türkçe odaklı, güvenilir ve yerli ses teknolojisi. Kurumlar için local kurulum; bireysel ve KOBİ kullanımı için sade paket seçenekleri.', 'Turkish-focused, reliable, local voice technology. Local setup for organizations; simple package options for individual and SME use.');

  const renderPriceCard = ({ type, tone, plan, plans, selectedIndex, onSelect }) => {
    const noPlan = !isPlansLoading && !plan;
    const isTts = type === 'tts';
    const serviceTitle = isTts ? t('Metni Sese Çevirme', 'Text to Speech') : t('Sesi Yazıya Çevirme', 'Speech to Text');
    const buttonLabel = isPlansLoading
      ? t('Paketler yükleniyor...', 'Packages are loading...')
      : plan?.isFreeTrial
        ? t('Ücretsiz Başla', 'Start Free')
        : t('Hemen Satın Al', 'Buy Now');

    return (
      <div className="pricing-card-v2">
        <div className={`pc-top ${tone}`}>
          <div className="pc-top-row">
            <span className="pc-badge">{serviceTitle}</span>
          </div>
          <div className="pc-price-area">
            <AnimatedPrice
              value={plan?.price || 0}
              label={isPlansLoading ? t('Yükleniyor...', 'Loading...') : noPlan ? t('Paket yok', 'No package') : plan?.isFreeTrial ? t('Ücretsiz', 'Free') : ''}
              language={language}
            />
            {plan?.price > 0 && <span className="pc-tax">+ {t('KDV', 'VAT')}</span>}
          </div>
          <p className="pc-amount">{plan ? `${plan.amount} ${plan.unit}` : isPlansLoading ? t('Paketler yükleniyor...', 'Packages are loading...') : t('Paket bulunamadı', 'No package found')}</p>
          {(plan?.price > 0 || plan?.isFreeTrial) && <p className="pc-per-unit">{plan.perUnit}</p>}
        </div>
        <div className="pc-body">
          <div className="pricing-option-label">
            {t('Paket Boyutu', 'Package Size')}
            <span>{plan ? `${plan.amount} ${plan.unit}` : '-'}</span>
          </div>
          <div className="pricing-option-grid">
            {plans.map((item, index) => (
              <button
                key={item.planId || `${item.amount}-${item.unit}`}
                type="button"
                className={`pricing-option ${index === selectedIndex ? `active ${tone}` : ''}`}
                onClick={() => onSelect(index)}
              >
                <strong>{item.amount}</strong>
                <span>{item.unit}</span>
              </button>
            ))}
          </div>
          <ul className="pc-features">
            {isTts ? (
              <>
                <li>{t('HD kalite ses çıktıları', 'HD quality audio outputs')}</li>
                <li>{t('Türkçe odaklı seslendirme', 'Turkish-focused text-to-speech')}</li>
                <li>{audience === 'enterprise' ? t('API key ile kurumsal kullanım', 'Enterprise use with API key') : t('MP3 / WAV indirme', 'MP3 / WAV download')}</li>
              </>
            ) : (
              <>
                <li>{t('Yüksek doğruluk oranı', 'High accuracy rate')}</li>
                <li>{t('Türkçe deşifre', 'Turkish transcription')}</li>
                <li>{audience === 'enterprise' ? t('API key ile kurumsal kullanım', 'Enterprise use with API key') : t('Uzun kayıt desteği', 'Long recording support')}</li>
              </>
            )}
          </ul>
          <button className={`btn-pricing ${tone === 'purple' ? 'purple-btn' : 'pink-btn'}`} disabled={isPlansLoading || !plan || (!plan.isFreeTrial && plan.price <= 0)} onClick={() => startPayment(plan)}>
            {buttonLabel}
          </button>
        </div>
      </div>
    );
  };


  return (
    <div className="studio-page pricing-page">
      <StudioHero
        title={pricingHeroContent.title}
        titleEn={pricingHeroContent.titleEn}
        description={pricingHeroContent.description}
        descriptionEn={pricingHeroContent.descriptionEn}
        steps={pricingSteps}
        allStepsActive
        className="pricing-hero"
        appLanguage={language}
      />

      <div className="studio-content">
        <div className="pricing-audience-tabs" role="tablist" aria-label={t('Paket türü', 'Package type')}>
          <button type="button" className={audience === 'individual' ? 'active' : ''} onClick={() => changeAudience('individual')}>
            <strong>{t('Bireysel', 'Individual')}</strong>
            <span>{t('Kişisel projeler ve üreticiler', 'Personal projects and creators')}</span>
          </button>
          <button type="button" className={audience === 'sme' ? 'active' : ''} onClick={() => changeAudience('sme')}>
            <strong>{t('KOBİ', 'SME')}</strong>
            <span>{t('0-20 çalışanlı ekipler', 'Teams of 0-20 employees')}</span>
          </button>
          <button type="button" className={audience === 'enterprise' ? 'active' : ''} onClick={() => changeAudience('enterprise')}>
            <strong>{t('Kurumsal', 'Enterprise')}</strong>
            <span>{t('API paketleri ve özel teklif', 'API packages and custom offers')}</span>
          </button>
        </div>

        {queryStatus && <div className={`payment-status ${queryStatus.tone}`}>{t(queryStatus.textTr, queryStatus.textEn)}</div>}
        {planLoadError && <div className="payment-status error">{planLoadError}</div>}
        {paymentError && <div className="payment-status error">{paymentError}</div>}

        <div className="pricing-section-head">
          <span>{audienceTitle}</span>
          <h2>{t('İhtiyacınız kadar karakter veya dakika seçin.', 'Choose as many characters or minutes as you need.')}</h2>
          <p>{introCopy}</p>
        </div>

        <div className="pricing-grid">
          {renderPriceCard({
            type: 'tts',
            tone: 'purple',
            plan: tts,
            plans: ttsPlansForUi,
            selectedIndex: ttsEffectiveIndex,
            onSelect: setTtsIndex,
          })}
          {renderPriceCard({
            type: 'asr',
            tone: 'pink',
            plan: asr,
            plans: asrPlansForUi,
            selectedIndex: asrEffectiveIndex,
            onSelect: setAsrIndex,
          })}
        </div>

        <div className="pricing-national-note">
          <strong>{t('Yerli altyapı, Türkçe odak', 'Local infrastructure, Turkish focus')}</strong>
          <span>{audience === 'enterprise'
            ? t('Kurumsal satın alma tamamlandıktan sonra API key profil sayfasından oluşturulur; özel hacim, SLA veya local kurulum ihtiyaçları için teklif akışını kullanabilirsiniz.', 'After an enterprise purchase is completed, the API key is created from the profile page; you can use the offer flow for custom volume, SLA, or local setup needs.')
            : t('Seslendirme ve deşifre süreçlerinde yerel ihtiyaçları, Türkçe telaffuzu ve kurumların veri hassasiyetini merkeze alıyoruz; isteyen kurumlarda sistem kurum içinde çalışabilir.', 'We center local needs, Turkish pronunciation, and organizational data sensitivity in text-to-speech and transcription workflows; for organizations that want it, the system can run internally.')}</span>
        </div>
      </div>
    </div>
  );
}
