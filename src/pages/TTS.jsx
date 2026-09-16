import { useState, useRef, useEffect } from 'react';
import './StudioReveal.css';
import { apiFetch, apiJson } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import StudioHero from '../components/StudioHero';
import StarBorder from '../components/StarBorder';
import { ttsHeroContent, ttsSteps, ttsFeatures } from '../data/studioContent';

const voiceOptions = [
  {
    id: 'woman',
    title: 'Kadın Ses',
    titleEn: 'Female Voice',
    description: 'Yumuşak, sıcak ve net ton',
    descriptionEn: 'Soft, warm, and clear tone',
    gender: 'woman',
    language: 'tr',
    icon: 'woman',
  },
  {
    id: 'man',
    title: 'Erkek Ses',
    titleEn: 'Male Voice',
    description: 'Tok, doğal ve güçlü ton',
    descriptionEn: 'Deep, natural, and strong tone',
    gender: 'man',
    language: 'tr',
    icon: 'man',
  },
  {
    id: 'deniz',
    title: 'Deniz',
    titleEn: 'Deniz',
    description: 'Dengeli, temiz ve modern ton',
    descriptionEn: 'Balanced, clean, and modern tone',
    gender: 'neutral',
    language: 'tr',
    icon: 'woman',
  },
];

const engineOptions = [
  { id: 'v1', title: 'Versiyon 1', titleEn: 'Version 1', description: 'Mevcut ses motoru', descriptionEn: 'Current voice engine' },
  { id: 'v2', title: 'Versiyon 2', titleEn: 'Version 2', description: 'Yeni ses motoru', descriptionEn: 'New voice engine' },
  { id: 'clone', title: 'Klonlanmış Ses', titleEn: 'Cloned Voice', description: 'Kendi sesinizi kullanın', descriptionEn: 'Use your own voice' },
];

function getVoiceDisplayCopy(voice, engineVersion) {
  if (engineVersion === 'v2') {
    if (voice.id === 'woman') {
      return {
        title: 'Sıla',
        titleEn: 'Sila',
        description: voice.description,
        descriptionEn: voice.descriptionEn,
      };
    }

    if (voice.id === 'man') {
      return {
        title: 'Taha',
        titleEn: 'Taha',
        description: voice.description,
        descriptionEn: voice.descriptionEn,
      };
    }

    if (voice.id === 'deniz') {
      return {
        title: 'Deniz',
        titleEn: 'Deniz',
        description: voice.description,
        descriptionEn: voice.descriptionEn,
      };
    }
  }

  return {
    title: voice.title,
    titleEn: voice.titleEn,
    description: voice.description,
    descriptionEn: voice.descriptionEn,
  };
}

function getAvailableVoiceOptions(engineVersion) {
  if (engineVersion === 'v2') return voiceOptions;
  return voiceOptions.filter((voice) => voice.id !== 'deniz');
}

function getVoiceCloningSummary(entitlements) {
  const summary = entitlements?.voice_cloning || entitlements?.tts || {};
  return {
    enabled: Boolean(summary.enabled ?? summary.voice_cloning_enabled),
    voiceSlotLimit: Number(summary.voice_slot_limit ?? 0),
    activeVoiceCount: Number(summary.active_voice_count ?? 0),
    availableVoiceSlots: Number(summary.available_voice_slots ?? 0),
    source: String(summary.source || ''),
  };
}

function getCloneEngineCopy(canUseCloneEngine) {
  if (canUseCloneEngine) {
    return {
      title: 'Klonlanmış Ses',
      titleEn: 'Cloned Voice',
      description: 'Kendi sesinizi kullanın',
      descriptionEn: 'Use your own voice',
    };
  }

  return {
    title: 'Klonlanmış Ses',
    titleEn: 'Cloned Voice',
    description: 'Premium özellik',
    descriptionEn: 'Premium feature',
  };
}

function normalizeVoiceStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function getVoiceStatusLabel(status, language = 'tr') {
  const normalized = normalizeVoiceStatus(status);
  if (normalized === 'ready') return language === 'en' ? 'Ready' : 'Hazır';
  if (normalized === 'failed') return language === 'en' ? 'Failed' : 'Oluşturulamadı';
  if (normalized === 'deleted') return language === 'en' ? 'Deleted' : 'Silindi';
  if (normalized === 'processing' || normalized === 'pending') return language === 'en' ? 'Preparing...' : 'Hazırlanıyor...';
  return language === 'en' ? 'Unknown' : 'Bilinmiyor';
}

function formatVoiceDate(value, language = 'tr') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function extractVoicesResponse(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.voices)) return payload.voices;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function formatCreditValue(value, language = 'tr') {
  return Number(Number(value || 0).toLocaleString(language === 'en' ? 'en-US' : 'tr-TR'));
}

function VoiceIcon({ type }) {
  if (type === 'woman') {
    return (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
        <path d="M10 11c0-1 1.5-5 6-5s6 4 6 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        <path d="M8 28c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="16" cy="11" r="1.5" fill="currentColor" opacity="0" />
      </svg>
    );
  }

  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M8 28c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="12" y="5" width="8" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function FeatureIcon({ type }) {
  const icons = {
    quality: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
    speed: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    format: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    turkish: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  };

  return icons[type] || null;
}

const waveformHeights = [14, 22, 18, 24, 16];
const GUEST_TTS_MAX_CHARS = 200;
const AUTHENTICATED_TTS_MAX_CHARS = 10000;
const VOICE_REFERENCE_MAX_BYTES = 20 * 1024 * 1024;
const VOICE_REFERENCE_ACCEPT = '.wav,.mp3,.m4a,.mp4,.webm,.ogg,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/mp4,audio/webm,audio/ogg';

function parseCreditRate(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function getEngineCreditRate(pricingRates, engineVersion) {
  if (engineVersion === 'clone') {
    return parseCreditRate(pricingRates?.voice_clone?.credit_cost);
  }

  return engineVersion === 'v2'
    ? parseCreditRate(pricingRates?.v2?.credit_cost)
    : parseCreditRate(pricingRates?.v1?.credit_cost);
}

function getEstimatedCredits(charCount, engineRate) {
  if (!Number.isFinite(charCount) || charCount <= 0) return 0;
  return Math.ceil(charCount * parseCreditRate(engineRate));
}

function getCreditLimitedMaxChars(remainingCredits, engineRate) {
  if (!Number.isFinite(remainingCredits) || remainingCredits <= 0) return GUEST_TTS_MAX_CHARS;
  const byCredits = Math.floor(remainingCredits / parseCreditRate(engineRate));
  return Math.max(Math.min(byCredits, AUTHENTICATED_TTS_MAX_CHARS), 0);
}

function MiniWaveform({ isPlaying }) {
  return (
    <div className={`tts-mini-waveform ${isPlaying ? 'playing' : ''}`}>
      {waveformHeights.map((height, i) => (
        <span key={i} className="tts-wave-bar" style={{ animationDelay: `${i * 0.12}s`, height: `${height}px` }} />
      ))}
    </div>
  );
}

function formatAudioTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export default function TTS({ prefill, onNavigate, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = (tr, en) => (isEnglish ? en : restoreTurkishUiText(tr));

  const [engineVersion, setEngineVersion] = useState(
    prefill?.engineVersion === 'clone' ? 'v1' : (prefill?.engineVersion || 'v1')
  );
  const [voiceId, setVoiceId] = useState(prefill?.voiceId || voiceOptions[0].id);
  const [text, setText] = useState(typeof prefill?.text === 'string' ? prefill.text : '');
  const [format, setFormat] = useState(prefill?.format || 'mp3');
  const [audioUrl, setAudioUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showPackagePopup, setShowPackagePopup] = useState(false);
  const [packagePopupTitle, setPackagePopupTitle] = useState('Önce paket satın almanız gerek');
  const [packagePopupButtonLabel, setPackagePopupButtonLabel] = useState('Paketler sayfasına git');
  const [packagePopupTarget, setPackagePopupTarget] = useState('pricing');
  const [packageMessage, setPackageMessage] = useState('TTS çıktısı indirebilmek için aktif TTS paketiniz olmalı.');
  const [ttsCharacterLimit, setTtsCharacterLimit] = useState(GUEST_TTS_MAX_CHARS);
  const [ttsRemainingCredits, setTtsRemainingCredits] = useState(null);
  const [ttsVoiceCloningEnabled, setTtsVoiceCloningEnabled] = useState(false);
  const [ttsVoiceSlotLimit, setTtsVoiceSlotLimit] = useState(0);
  const [ttsActiveVoiceCount, setTtsActiveVoiceCount] = useState(0);
  const [ttsAvailableVoiceSlots, setTtsAvailableVoiceSlots] = useState(0);
  const [pricingRates, setPricingRates] = useState(null);
  const [userVoices, setUserVoices] = useState([]);
  const [voiceListLoading, setVoiceListLoading] = useState(false);
  const [voiceListError, setVoiceListError] = useState('');
  const [selectedCloneVoiceId, setSelectedCloneVoiceId] = useState('');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceName, setVoiceName] = useState('');
  const [voiceAudioFile, setVoiceAudioFile] = useState(null);
  const [voiceConsentConfirmed, setVoiceConsentConfirmed] = useState(false);
  const [voiceFormError, setVoiceFormError] = useState('');
  const [voiceFormMessage, setVoiceFormMessage] = useState('');
  const [voiceNotice, setVoiceNotice] = useState('');
  const [voiceSubmitting, setVoiceSubmitting] = useState(false);
  const [deletingVoiceId, setDeletingVoiceId] = useState('');
  const [advancedEnabled, setAdvancedEnabled] = useState(false);
  const [advancedSettings, setAdvancedSettings] = useState({
    speed: 1,
    pitch: 1,
    volume: 1,
    sampleRate: 22050,
    denoise: true,
  });
  const audioRef = useRef(null);

  const availableEngineOptions = engineOptions.filter((engine) => engine.id !== 'clone');
  const availableVoiceOptions = getAvailableVoiceOptions(engineVersion);
  const selectedVoice = availableVoiceOptions.find((voice) => voice.id === voiceId) || availableVoiceOptions[0] || voiceOptions[0];
  const selectedVoiceDisplay = getVoiceDisplayCopy(selectedVoice, engineVersion);
  const normalizedUserVoices = userVoices
    .map((voice) => ({
      ...voice,
      status: normalizeVoiceStatus(voice.status),
    }))
    .filter((voice) => voice.id);
  const selectedCloneVoice = normalizedUserVoices.find((voice) => voice.id === selectedCloneVoiceId) || null;
  const readyCloneVoices = normalizedUserVoices.filter((voice) => voice.status === 'ready');
  const canUseCloneEngine = Boolean(ttsVoiceCloningEnabled && ttsVoiceSlotLimit > 0);
  const canCreateCloneVoice = canUseCloneEngine && ttsAvailableVoiceSlots > 0;
  const activeCloneVoices = normalizedUserVoices.filter((voice) => ['pending', 'processing', 'ready'].includes(voice.status));
  const cloneEngineDisplay = getCloneEngineCopy(canUseCloneEngine);
  const selectedEngineCopy = engineVersion === 'clone' ? cloneEngineDisplay : availableEngineOptions.find((engine) => engine.id === engineVersion) || availableEngineOptions[0];
  const isCloneVoiceReady = !selectedCloneVoice || selectedCloneVoice.status !== 'ready' ? false : true;
  const charCount = text.length;
  const estimatedSeconds = Math.max(2, Math.round(charCount / 14));
  const engineCreditRate = getEngineCreditRate(pricingRates, engineVersion);
  const estimatedCredits = getEstimatedCredits(charCount, engineCreditRate);
  const maxChars = ttsCharacterLimit;
  const voiceEnrollmentCreditCost = Number(pricingRates?.voice_enrollment?.credit_cost || 0) || null;
  const cloneUsageCreditRate = Number(pricingRates?.voice_clone?.credit_cost || 0) || null;
  const advancedLocked = !advancedEnabled;
  const currentStep = !text.trim() ? 1 : !audioUrl ? 2 : 3;
  const showInlineAudioPreview = false;

  async function loadVoiceList() {
    setVoiceListLoading(true);
    setVoiceListError('');
    try {
      const payload = await apiJson('/api/v1/voices', { skipAuthExpiredEvent: true });
      const voices = extractVoicesResponse(payload);
      setUserVoices(voices);
    } catch {
      setUserVoices([]);
      setVoiceListError('');
    } finally {
      setVoiceListLoading(false);
    }
  }

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioCurrentTime(audio.duration || audio.currentTime || 0);
    };
    const handleLoadedMetadata = () => setAudioDuration(audio.duration || 0);
    const handleTimeUpdate = () => setAudioCurrentTime(audio.currentTime || 0);

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [audioUrl]);

  const toggleAudioPlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
      return;
    }

    audio.pause();
  };

  const handleAudioSeek = (event) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Number(event.target.value);
    audio.currentTime = nextTime;
    setAudioCurrentTime(nextTime);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadPricingRates() {
      try {
        const pricing = await apiJson('/api/v1/tts/pricing', { skipAuthExpiredEvent: true });
        if (isMounted) setPricingRates(pricing);
      } catch {
        if (isMounted) setPricingRates(null);
      }
    }

    async function loadTtsLimit() {
      try {
        const entitlements = await apiJson('/api/v1/me/entitlements', { skipAuthExpiredEvent: true });
        if (!isMounted) return;

        const remainingCredits = Number(entitlements?.tts?.remaining_credits ?? entitlements?.tts?.remaining ?? 0);
        const voiceCloningSummary = getVoiceCloningSummary(entitlements);
        setTtsRemainingCredits(remainingCredits);
        setTtsVoiceCloningEnabled(voiceCloningSummary.enabled);
        setTtsVoiceSlotLimit(voiceCloningSummary.voiceSlotLimit);
        setTtsActiveVoiceCount(voiceCloningSummary.activeVoiceCount);
        setTtsAvailableVoiceSlots(voiceCloningSummary.availableVoiceSlots);
        setAdvancedEnabled(remainingCredits > 0);
      } catch {
        if (!isMounted) return;
        setTtsRemainingCredits(null);
        setTtsCharacterLimit(GUEST_TTS_MAX_CHARS);
        setAdvancedEnabled(false);
        setTtsVoiceCloningEnabled(false);
        setTtsVoiceSlotLimit(0);
        setTtsActiveVoiceCount(0);
        setTtsAvailableVoiceSlots(0);
      }
    }

    loadPricingRates();
    loadTtsLimit();
    loadVoiceList();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (ttsRemainingCredits === null) {
      setTtsCharacterLimit(GUEST_TTS_MAX_CHARS);
      return;
    }

    setTtsCharacterLimit(getCreditLimitedMaxChars(ttsRemainingCredits, engineCreditRate));
  }, [engineCreditRate, ttsRemainingCredits]);

  useEffect(() => {
    if (engineVersion === 'clone') {
      setEngineVersion('v1');
      return;
    }

    const isVoiceAvailable = availableVoiceOptions.some((voice) => voice.id === voiceId);
    if (!isVoiceAvailable) {
      setVoiceId('woman');
    }
  }, [availableVoiceOptions, engineVersion, voiceId]);

  useEffect(() => {
    if (engineVersion !== 'clone') return;
    const normalized = userVoices.map((voice) => ({
      ...voice,
      status: normalizeVoiceStatus(voice.status),
    })).filter((voice) => voice.id);
    const currentVoice = normalized.find((voice) => voice.id === selectedCloneVoiceId) || null;
    if (currentVoice && currentVoice.status === 'ready') return;

    const nextReadyVoice = normalized.find((voice) => voice.status === 'ready') || normalized[0] || null;
    if (nextReadyVoice?.id && nextReadyVoice.id !== selectedCloneVoiceId) {
      setSelectedCloneVoiceId(nextReadyVoice.id);
    }
  }, [engineVersion, userVoices, selectedCloneVoiceId]);

  useEffect(() => {
    const normalized = userVoices.map((voice) => ({
      ...voice,
      status: normalizeVoiceStatus(voice.status),
    }));
    const hasProcessingVoice = normalized.some((voice) => ['pending', 'processing'].includes(voice.status));
    if (!hasProcessingVoice) return undefined;

    const timer = window.setInterval(() => {
      loadVoiceList();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [userVoices]);

  useEffect(() => {
    if (text.length > maxChars) {
      queueMicrotask(() => {
        setText((current) => current.slice(0, maxChars));
      });
    }
  }, [maxChars, text.length]);

  useEffect(() => {
    if (engineVersion !== 'v1' && format === 'mp3') {
      setFormat('wav');
    }
  }, [engineVersion, format]);

  useEffect(() => {
    if (!showPackagePopup) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowPackagePopup(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPackagePopup]);

  useEffect(() => {
    if (showPackagePopup) return;

    queueMicrotask(() => {
      setPackagePopupTitle('Önce paket satın almanız gerek');
      setPackagePopupButtonLabel('Paketler sayfasına git');
      setPackagePopupTarget('pricing');
    });
  }, [showPackagePopup]);

  useEffect(() => {
    if (!error || !error.toLowerCase().includes('too many preview request')) return;

    queueMicrotask(() => {
      setError('');
      setPackagePopupTitle('Önizleme hakkınız bitti');
      setPackageMessage('Daha fazla seslendirme işlemi için giriş yapıp paketlerimizi inceleyebilirsiniz.');
      setPackagePopupButtonLabel('Giriş Yap');
      setPackagePopupTarget('login');
      setShowPackagePopup(true);
    });
  }, [error]);

  const updateAdvancedSetting = (key, value) => {
    setAdvancedSettings((current) => ({ ...current, [key]: value }));
  };

  const openVoiceModal = () => {
    if (!canUseCloneEngine) {
      setPackagePopupTitle('Klonlanmış Ses');
      setPackageMessage('Ses klonlama özelliği yalnızca uygun paketlerde kullanılabilir.');
      setPackagePopupButtonLabel('Paketleri İncele');
      setPackagePopupTarget('pricing');
      setShowPackagePopup(true);
      return;
    }

    if (ttsAvailableVoiceSlots <= 0) {
      setVoiceFormError('Ses oluşturma limitinize ulaştınız.');
      return;
    }

    setVoiceFormError('');
    setVoiceFormMessage('');
    setVoiceName('');
    setVoiceAudioFile(null);
    setVoiceConsentConfirmed(false);
    setShowVoiceModal(true);
  };

  const closeVoiceModal = () => {
    if (voiceSubmitting) return;
    setShowVoiceModal(false);
    setVoiceFormError('');
    setVoiceFormMessage('');
    setVoiceName('');
    setVoiceAudioFile(null);
    setVoiceConsentConfirmed(false);
  };

  const handleVoiceFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    setVoiceFormError('');

    if (!nextFile) {
      setVoiceAudioFile(null);
      return;
    }

    if (nextFile.size > VOICE_REFERENCE_MAX_BYTES) {
      setVoiceAudioFile(null);
      setVoiceFormError('Referans ses dosyası çok büyük. Lütfen daha küçük bir dosya yükleyin.');
      return;
    }

    const supportedTypes = new Set([
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
    ]);

    if (nextFile.type && !supportedTypes.has(nextFile.type)) {
      setVoiceAudioFile(null);
      setVoiceFormError('Lütfen desteklenen bir ses dosyası yükleyin.');
      return;
    }

    setVoiceAudioFile(nextFile);
  };

  async function submitVoiceEnrollment(event) {
    event.preventDefault();
    if (voiceSubmitting) return;

    const trimmedName = voiceName.trim();
    if (!trimmedName) {
      setVoiceFormError('Lütfen ses için bir ad girin.');
      return;
    }

    if (!voiceAudioFile) {
      setVoiceFormError('Lütfen bir referans ses dosyası seçin.');
      return;
    }

    if (!voiceConsentConfirmed) {
      setVoiceFormError('Devam etmek için kullanım ve klonlama onayını vermeniz gerekir.');
      return;
    }

    if (ttsRemainingCredits !== null && typeof voiceEnrollmentCreditCost === 'number' && ttsRemainingCredits < voiceEnrollmentCreditCost) {
      setVoiceFormError('Yetersiz karakter hakkı.');
      return;
    }

    setVoiceSubmitting(true);
    setVoiceFormError('');
    setVoiceFormMessage('');

    try {
      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('consentConfirmed', 'true');
      formData.append('audio', voiceAudioFile);

      const response = await apiFetch('/api/v1/voices', {
        method: 'POST',
        skipAuthExpiredEvent: true,
        body: formData,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || 'Ses oluşturma işlemi başarısız oldu.');
      }

      setVoiceNotice('Sesiniz oluşturulmak üzere işleme alındı.');
      closeVoiceModal();
      await loadVoiceList();
      const refreshedEntitlements = await apiJson('/api/v1/me/entitlements', { skipAuthExpiredEvent: true }).catch(() => null);
      if (refreshedEntitlements?.tts || refreshedEntitlements?.voice_cloning) {
        const voiceCloningSummary = getVoiceCloningSummary(refreshedEntitlements);
        setTtsRemainingCredits(Number(refreshedEntitlements.tts?.remaining_credits ?? refreshedEntitlements.tts?.remaining ?? 0));
        setTtsVoiceCloningEnabled(voiceCloningSummary.enabled);
        setTtsVoiceSlotLimit(voiceCloningSummary.voiceSlotLimit);
        setTtsActiveVoiceCount(voiceCloningSummary.activeVoiceCount);
        setTtsAvailableVoiceSlots(voiceCloningSummary.availableVoiceSlots);
      }
    } catch (err) {
      setVoiceFormError(err instanceof Error ? err.message : 'Ses oluşturma sırasında hata oluştu.');
    } finally {
      setVoiceSubmitting(false);
    }
  }

  async function handleDeleteVoice(voice) {
    const label = voice?.name || 'Bu ses';
    if (!window.confirm(`"${label}" adlı klonlanmış sesi silmek istediğinize emin misiniz?`)) {
      return;
    }

    setDeletingVoiceId(String(voice.id));
    try {
      const response = await apiFetch(`/api/v1/voices/${voice.id}`, {
        method: 'DELETE',
        skipAuthExpiredEvent: true,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || 'Ses silinemedi.');
      }

      if (selectedCloneVoiceId === voice.id) {
        setSelectedCloneVoiceId('');
      }
      await loadVoiceList();
      const refreshedEntitlements = await apiJson('/api/v1/me/entitlements', { skipAuthExpiredEvent: true }).catch(() => null);
      if (refreshedEntitlements?.tts || refreshedEntitlements?.voice_cloning) {
        const voiceCloningSummary = getVoiceCloningSummary(refreshedEntitlements);
        setTtsRemainingCredits(Number(refreshedEntitlements.tts?.remaining_credits ?? refreshedEntitlements.tts?.remaining ?? 0));
        setTtsVoiceCloningEnabled(voiceCloningSummary.enabled);
        setTtsVoiceSlotLimit(voiceCloningSummary.voiceSlotLimit);
        setTtsActiveVoiceCount(voiceCloningSummary.activeVoiceCount);
        setTtsAvailableVoiceSlots(voiceCloningSummary.availableVoiceSlots);
      }
    } catch (err) {
      setVoiceListError(err instanceof Error ? err.message : 'Ses silinirken hata oluştu.');
    } finally {
      setDeletingVoiceId('');
    }
  }

  const buildSynthesisOptions = () => ({
    speed: Number(advancedSettings.speed),
    pitch: Number(advancedSettings.pitch),
    volume: Number(advancedSettings.volume),
    format,
    sample_rate: Number(advancedSettings.sampleRate),
    denoise: Boolean(advancedSettings.denoise),
  });

  async function synthesize() {
    const cleanText = text.trim();
    if (!cleanText) {
      setError('Lütfen seslendirmek için bir metin girin.');
      return;
    }

    if (!advancedEnabled && cleanText.length > GUEST_TTS_MAX_CHARS) {
      setError(`Önizleme en fazla ${GUEST_TTS_MAX_CHARS} karakter olabilir. Daha uzun metinleri paket hakkınızla indirebilirsiniz.`);
      return;
    }

    const selected = availableVoiceOptions.find((item) => item.id === voiceId) || { id: 'woman', language: 'tr' };
    const cloneVoice = normalizedUserVoices.find((item) => item.id === selectedCloneVoiceId) || null;
    if (engineVersion === 'clone') {
      if (!canUseCloneEngine) {
        setPackagePopupTitle('Klonlanmış Ses');
        setPackageMessage('Ses klonlama özelliği yalnızca uygun paketlerde kullanılabilir.');
        setPackagePopupButtonLabel('Paketleri İncele');
        setPackagePopupTarget('pricing');
        setShowPackagePopup(true);
        return;
      }

      if (!cloneVoice || cloneVoice.status !== 'ready') {
        setError('Lütfen klonlanmış bir ses seçin.');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      let response;

      const requestBody = {
        engine_version: engineVersion,
        text: cleanText,
        synthesis_options: buildSynthesisOptions(),
      };

      if (engineVersion === 'clone') {
        requestBody.user_voice_id = cloneVoice.id;
      } else {
        requestBody.voice = selected.id;
        requestBody.language = selected.language;
      }

      if (engineVersion === 'clone') {
        const entitlements = await apiJson('/api/v1/me/entitlements', { skipAuthExpiredEvent: true });
        const remainingCredits = Number(entitlements?.tts?.remaining_credits ?? entitlements?.tts?.remaining ?? 0);
        const requiredCredits = getEstimatedCredits(cleanText.length, engineCreditRate);
        setTtsRemainingCredits(remainingCredits);
        setAdvancedEnabled(remainingCredits > 0);

        if (remainingCredits < requiredCredits) {
          setPackageMessage(engineVersion === 'clone'
            ? 'Bu metni klonlanmış sesle seslendirebilmek için yeterli karakter hakkınız olmalı.'
            : 'Bu metni önizleyebilmek için yeterli TTS karakter hakkınız olmalı.');
          setShowPackagePopup(true);
          return;
        }

        response = await apiFetch('/api/v1/tts/jobs/download-sync-file', {
          method: 'POST',
          skipAuthExpiredEvent: true,
          body: JSON.stringify(requestBody),
        });
      } else {
        response = await apiFetch('/api/v1/public/tts/preview', {
          method: 'POST',
          body: JSON.stringify({
            engine_version: engineVersion,
            text: cleanText,
            voice: selected.id,
            language: selected.language,
          }),
        });
      }

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || `TTS seslendirme başarısız (${response.status})`);
      }

      const audioBlob = await response.blob();
      const nextAudioUrl = URL.createObjectURL(audioBlob);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setIsPlaying(false);
      setAudioCurrentTime(0);
      setAudioDuration(0);
      setAudioUrl(nextAudioUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seslendirme sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }

  async function downloadWithPackage() {
    const cleanText = text.trim();
    if (!cleanText) {
      setError('Lütfen seslendirmek için bir metin girin.');
      return;
    }

    const cloneVoice = normalizedUserVoices.find((item) => item.id === selectedCloneVoiceId) || null;
    if (engineVersion === 'clone') {
      if (!canUseCloneEngine) {
        setPackagePopupTitle('Klonlanmış Ses');
        setPackageMessage('Ses klonlama özelliği yalnızca uygun paketlerde kullanılabilir.');
        setPackagePopupButtonLabel('Paketleri İncele');
        setPackagePopupTarget('pricing');
        setShowPackagePopup(true);
        return;
      }

      if (!cloneVoice || cloneVoice.status !== 'ready') {
        setError('Lütfen klonlanmış bir ses seçin.');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const entitlements = await apiJson('/api/v1/me/entitlements', { skipAuthExpiredEvent: true });
      const ttsEntitlement = entitlements?.tts;
      const remainingCredits = Number(ttsEntitlement?.remaining_credits ?? ttsEntitlement?.remaining ?? 0);
      const requiredCredits = getEstimatedCredits(cleanText.length, engineCreditRate);
      setTtsRemainingCredits(remainingCredits);
      const canDownload = Boolean(ttsEntitlement?.download_enabled) && remainingCredits >= requiredCredits;

      if (!canDownload) {
        setPackageMessage(
          remainingCredits > 0 && !ttsEntitlement?.download_enabled
            ? 'TTS indirme için indirme yetkisi açık bir paket gerekir.'
            : 'Bu metni indirebilmek için yeterli TTS karakter hakkınız olmalı.'
        );
        setShowPackagePopup(true);
        return;
      }

      const selected = availableVoiceOptions.find((item) => item.id === voiceId) || { id: 'woman', language: 'tr' };
      const requestBody = {
        engine_version: engineVersion,
        text: cleanText,
        synthesis_options: buildSynthesisOptions(),
      };
      if (engineVersion === 'clone') {
        requestBody.user_voice_id = cloneVoice.id;
      } else {
        requestBody.voice = selected.id;
        requestBody.language = selected.language;
      }

      const response = await apiFetch('/api/v1/tts/jobs/download-sync-file', {
        method: 'POST',
        skipAuthExpiredEvent: true,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.detail || `İndirme başarısız (${response.status})`);
      }

      const audioBlob = await response.blob();
      const objectUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `konusmatik-tts.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('Not authenticated'))) {
        setPackageMessage('TTS çıktısı indirebilmek için giriş yapmalı ve aktif TTS paketine sahip olmalısınız.');
        setShowPackagePopup(true);
        return;
      }

      if (err instanceof Error && (err.message.includes('402') || err.message.includes('Insufficient'))) {
        setPackageMessage('Bu metni indirebilmek için yeterli TTS karakter hakkınız olmalı.');
        setShowPackagePopup(true);
        return;
      }

      setError(err instanceof Error ? err.message : 'İndirme sırasında bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  }

  const audioPreviewSection = audioUrl ? (
    <div className="studio-section tts-preview-section">
      <div className="studio-section-header">
        <h3>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          {t('Ses Önizleme', 'Audio Preview')}
        </h3>
      </div>
      <div className="tts-audio-player">
        <MiniWaveform isPlaying={isPlaying} />
        <div className="tts-custom-player">
          <button className="tts-player-toggle" type="button" onClick={toggleAudioPlayback} aria-label={isPlaying ? t('Sesi duraklat', 'Pause audio') : t('Sesi oynat', 'Play audio')}>
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <span className="tts-player-time">{formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration || estimatedSeconds)}</span>
          <input
            className="tts-player-range"
            type="range"
            min="0"
            max={audioDuration || Math.max(audioCurrentTime, estimatedSeconds)}
            step="0.1"
            value={audioCurrentTime}
            onChange={handleAudioSeek}
            aria-label={t('Ses ilerleme', 'Audio progress')}
          />
        </div>
        <audio ref={audioRef} preload="metadata" onContextMenu={(event) => event.preventDefault()} src={audioUrl} />
      </div>
    </div>
  ) : null;

  return (
    <div className="studio-page">
      <StudioHero
        title={ttsHeroContent.title}
        titleEn={ttsHeroContent.titleEn}
        description={ttsHeroContent.description}
        descriptionEn={ttsHeroContent.descriptionEn}
        steps={ttsSteps}
        currentStep={currentStep}
        className="tts-hero"
        appLanguage={language}
      />

      <div className="studio-content">
        <div className="studio-workspace">
          <div className="studio-grid-v2">
            <div className="studio-main-v2">
              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </svg>
                    {t('Motor Versiyonu', 'Engine Version')}
                  </h3>
                </div>
                <div className="tts-engine-cards" role="radiogroup" aria-label={t('Motor versiyonu seçimi', 'Engine version selection')}>
                  {availableEngineOptions.map((engine) => (
                    <button
                      key={engine.id}
                      type="button"
                      className={`tts-engine-card ${engineVersion === engine.id ? 'active' : ''}`}
                      onClick={() => {
                        setEngineVersion(engine.id);
                      }}
                      aria-pressed={engineVersion === engine.id}
                    >
                      <div className="tts-engine-card-info">
                        <strong>{t(engine.title, engine.titleEn)}</strong>
                        <span>{t(engine.description, engine.descriptionEn)}</span>
                      </div>
                      <div className="tts-engine-card-check">
                        {engineVersion === engine.id && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    {t('Ses Modeli Seçin', 'Choose Voice Model')}
                  </h3>
                </div>
                <div className="tts-voice-cards">
                  {availableVoiceOptions.map((voice) => {
                    const voiceDisplay = getVoiceDisplayCopy(voice, engineVersion);

                    return (
                      <button
                        key={voice.id}
                        type="button"
                        className={`tts-voice-card ${voiceId === voice.id ? 'active' : ''}`}
                        onClick={() => setVoiceId(voice.id)}
                      >
                        <div className="tts-voice-card-icon">
                          <VoiceIcon type={voice.icon} />
                        </div>
                        <div className="tts-voice-card-info">
                          <strong>{t(voiceDisplay.title, voiceDisplay.titleEn)}</strong>
                          <span>{t(voiceDisplay.description, voiceDisplay.descriptionEn)}</span>
                        </div>
                        <div className="tts-voice-card-check">
                          {voiceId === voice.id && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {engineVersion === 'clone' && (
                  <div className="tts-clone-panel">
                    <div className="tts-clone-summary">
                      <div className="tts-clone-summary-item">
                        <span>{t('Ses Hakları', 'Voice Slots')}</span>
                        <strong>{ttsActiveVoiceCount} / {ttsVoiceSlotLimit}</strong>
                      </div>
                      <div className="tts-clone-summary-item">
                        <span>{t('Kalan Karakter', 'Remaining Characters')}</span>
                        <strong>{ttsRemainingCredits === null ? '-' : ttsRemainingCredits.toLocaleString('tr-TR')}</strong>
                      </div>
                      <div className="tts-clone-summary-item">
                        <span>{t('Klon Kullanımı', 'Clone Usage')}</span>
                        <strong>{cloneUsageCreditRate ? `${Number(cloneUsageCreditRate).toLocaleString('tr-TR')} / karakter` : t('Yükleniyor...', 'Loading...')}</strong>
                      </div>
                    </div>

                    {!canUseCloneEngine && (
                      <div className="tts-clone-lock">
                        <strong>{t('Klonlanmış Ses', 'Cloned Voice')}</strong>
                        <span>{t('Premium özellik', 'Premium feature')}</span>
                      </div>
                    )}

                    <label className="tts-clone-select-label">
                      <span>{t('Ses seçin', 'Select voice')}</span>
                      <select
                        value={selectedCloneVoiceId}
                        onChange={(event) => setSelectedCloneVoiceId(event.target.value)}
                        disabled={voiceListLoading || normalizedUserVoices.length === 0}
                      >
                        <option value="">{t('Bir ses seçin', 'Choose a voice')}</option>
                        {normalizedUserVoices.map((voice) => (
                          <option key={voice.id} value={voice.id} disabled={voice.status !== 'ready'}>
                            {voice.name} - {getVoiceStatusLabel(voice.status, language)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="tts-clone-actions">
                      <button type="button" className="tts-clone-create-btn" onClick={openVoiceModal} disabled={!canCreateCloneVoice}>
                        + {t('Yeni Ses Oluştur', 'Create New Voice')}
                      </button>
                      {!canCreateCloneVoice && (
                        <span className="tts-clone-note">
                          {ttsVoiceSlotLimit > 0
                            ? t('Ses oluşturma limitinize ulaştınız.', 'You have reached your voice creation limit.')
                            : t('Bu paket ses klonlama için uygun değil.', 'This package does not support voice cloning.')}
                        </span>
                      )}
                    </div>

                    {voiceListLoading && <div className="tts-clone-status">{t('Sesler yükleniyor...', 'Loading voices...')}</div>}
                    {voiceListError && <div className="tts-error-msg">{voiceListError}</div>}
                    {voiceNotice && <div className="tts-success-msg">{voiceNotice}</div>}

                    <div className="tts-clone-list">
                      {normalizedUserVoices.length === 0 ? (
                        <div className="tts-clone-empty">
                          {t('Henüz oluşturulmuş bir sesiniz yok.', 'You do not have a created voice yet.')}
                        </div>
                      ) : (
                        normalizedUserVoices.map((voice) => {
                          const status = getVoiceStatusLabel(voice.status, language);
                          const isReady = voice.status === 'ready';
                          const isActive = selectedCloneVoiceId === voice.id;

                          return (
                            <div
                              key={voice.id}
                              className={`tts-clone-voice-row ${isActive ? 'active' : ''} ${!isReady ? 'locked' : ''}`}
                              role="button"
                              tabIndex={isReady ? 0 : -1}
                              onClick={() => {
                                if (isReady) setSelectedCloneVoiceId(voice.id);
                              }}
                              onKeyDown={(event) => {
                                if (isReady && (event.key === 'Enter' || event.key === ' ')) {
                                  event.preventDefault();
                                  setSelectedCloneVoiceId(voice.id);
                                }
                              }}
                            >
                              <div className="tts-clone-voice-main">
                                <span className="tts-clone-voice-avatar">{voice.name?.slice(0, 1)?.toUpperCase() || 'V'}</span>
                                <div>
                                  <strong>{voice.name}</strong>
                                  <span>{status}{voice.created_at || voice.createdAt ? ` • ${formatVoiceDate(voice.created_at || voice.createdAt, language)}` : ''}</span>
                                </div>
                              </div>
                              <div className="tts-clone-voice-actions">
                                <span className={`tts-clone-status-pill ${voice.status}`}>{status}</span>
                                <button
                                  type="button"
                                  className="tts-clone-delete-btn"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteVoice(voice);
                                  }}
                                  disabled={deletingVoiceId === String(voice.id)}
                                >
                                  {deletingVoiceId === String(voice.id) ? t('Siliniyor...', 'Deleting...') : t('Sil', 'Delete')}
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    {t('Metin Girişi', 'Text Input')}
                  </h3>
                  <span className="studio-char-count">{charCount.toLocaleString('tr-TR')} / {maxChars.toLocaleString('tr-TR')}</span>
                </div>
                <div className="tts-textarea-wrapper">
                  <textarea
                    rows="8"
                    value={text}
                    onChange={(event) => setText(event.target.value.slice(0, maxChars))}
                    placeholder={t('Seslendirmek istediğiniz metni buraya yazın...\n\nÖrnek: Merhaba, bu kayıt Konuşmatik platformunda hazırlanmıştır. Yapay zeka destekli seslendirme hizmetimizle metinlerinizi doğal sese dönüştürün.', 'Write the text you want to voice here...\n\nExample: Hello, this recording was prepared on the Konusmatik platform. Convert your text into natural speech with our AI-powered text-to-speech service.')}
                    className="tts-textarea"
                  />
                </div>
              </div>

              {showInlineAudioPreview && audioUrl && (
                <div className="studio-section tts-preview-section">
                  <div className="studio-section-header">
                    <h3>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      {t('Ses Önizleme', 'Audio Preview')}
                    </h3>
                  </div>
                  <div className="tts-audio-player">
                    <MiniWaveform isPlaying={isPlaying} />
                    <div className="tts-custom-player">
                      <button className="tts-player-toggle" type="button" onClick={toggleAudioPlayback} aria-label={isPlaying ? t('Sesi duraklat', 'Pause audio') : t('Sesi oynat', 'Play audio')}>
                        {isPlaying ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </button>
                      <span className="tts-player-time">{formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration || estimatedSeconds)}</span>
                      <input
                        className="tts-player-range"
                        type="range"
                        min="0"
                        max={audioDuration || Math.max(audioCurrentTime, estimatedSeconds)}
                        step="0.1"
                        value={audioCurrentTime}
                        onChange={handleAudioSeek}
                        aria-label={t('Ses ilerleme', 'Audio progress')}
                      />
                    </div>
                    <audio ref={audioRef} preload="metadata" onContextMenu={(event) => event.preventDefault()} src={audioUrl} />
                  </div>
                </div>
              )}
            </div>

            <aside className="studio-side-v2">
              <div className="studio-side-card-v2 tts-voice-info-card">
                <div className="studio-side-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>{t('Seçili Ses', 'Selected Voice')}</span>
                </div>
                {engineVersion === 'clone' ? (
                  <div className="tts-selected-voice">
                    <div className="tts-selected-voice-icon">
                      <span className="tts-clone-voice-avatar">{selectedCloneVoice?.name?.slice(0, 1)?.toUpperCase() || 'V'}</span>
                    </div>
                    <strong>{selectedCloneVoice?.name || t('Ses seçin', 'Select a voice')}</strong>
                    <span>{selectedCloneVoice ? getVoiceStatusLabel(selectedCloneVoice.status, language) : t('Klonlanmış bir ses seçin.', 'Select a cloned voice.')}</span>
                  </div>
                ) : (
                  <div className="tts-selected-voice">
                    <div className="tts-selected-voice-icon">
                      <VoiceIcon type={selectedVoice.icon} />
                    </div>
                    <strong>{t(selectedVoiceDisplay.title, selectedVoiceDisplay.titleEn)}</strong>
                    <span>{t(selectedVoiceDisplay.description, selectedVoiceDisplay.descriptionEn)}</span>
                  </div>
                )}
              </div>

              <div className="studio-side-card-v2">
                <div className="studio-side-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>{t('Çıktı Formatı', 'Output Format')}</span>
                </div>
                <div className="tts-format-options">
                  {engineVersion === 'v1' && (
                    <label className={`tts-format-option ${format === 'mp3' ? 'active' : ''}`}>
                      <input type="radio" name="audio-format" value="mp3" checked={format === 'mp3'} onChange={(event) => setFormat(event.target.value)} />
                      <div className="tts-format-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 18V5l12-2v13" />
                          <circle cx="6" cy="18" r="3" />
                          <circle cx="18" cy="16" r="3" />
                        </svg>
                        MP3
                      </div>
                      <span className="tts-format-desc">{t('Sıkıştırılmış, küçük boyut', 'Compressed, small size')}</span>
                    </label>
                  )}
                  <label className={`tts-format-option ${format === 'wav' ? 'active' : ''}`}>
                    <input type="radio" name="audio-format" value="wav" checked={format === 'wav'} onChange={(event) => setFormat(event.target.value)} />
                    <div className="tts-format-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      WAV
                    </div>
                    <span className="tts-format-desc">{t('Kayıpsız, yüksek kalite', 'Lossless, high quality')}</span>
                  </label>
                </div>
              </div>

              {engineVersion === 'v1' && (
                <div className="studio-side-card-v2">
                  <div className="studio-side-card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20v-6" />
                      <path d="M6 20V10" />
                      <path d="M18 20V4" />
                      <circle cx="12" cy="10" r="2" />
                      <circle cx="6" cy="6" r="2" />
                      <circle cx="18" cy="14" r="2" />
                    </svg>
                    <span>{t('Gelişmiş Ayarlar', 'Advanced Settings')}</span>
                  </div>
                  {advancedLocked && (
                    <div className="tts-advanced-lock">
                      <strong>{t('Paket kullanıcılarına özel', 'For package users')}</strong>
                      <button type="button" onClick={() => onNavigate?.('pricing')}>{t('Paketleri Gör', 'View Packages')}</button>
                    </div>
                  )}
                  <fieldset className="tts-advanced-controls" disabled={advancedLocked}>
                    <label className="tts-advanced-range">
                      <span>{t('Hız', 'Speed')} <strong>{Number(advancedSettings.speed).toFixed(2)}x</strong></span>
                      <input type="range" min="0.5" max="2" step="0.05" value={advancedSettings.speed} onChange={(event) => updateAdvancedSetting('speed', event.target.value)} />
                    </label>
                    <label className="tts-advanced-range">
                      <span>{t('Perde', 'Pitch')} <strong>{Number(advancedSettings.pitch).toFixed(2)}x</strong></span>
                      <input type="range" min="0.5" max="2" step="0.05" value={advancedSettings.pitch} onChange={(event) => updateAdvancedSetting('pitch', event.target.value)} />
                    </label>
                    <label className="tts-advanced-range">
                      <span>{t('Ses', 'Volume')} <strong>{Number(advancedSettings.volume).toFixed(2)}x</strong></span>
                      <input type="range" min="0.1" max="2" step="0.05" value={advancedSettings.volume} onChange={(event) => updateAdvancedSetting('volume', event.target.value)} />
                    </label>
                    <label className="tts-advanced-select">
                      <span>{t('Örnekleme', 'Sample Rate')}</span>
                      <select value={advancedSettings.sampleRate} onChange={(event) => updateAdvancedSetting('sampleRate', event.target.value)}>
                        <option value="22050">22.05 kHz</option>
                        <option value="44100">44.1 kHz</option>
                        <option value="48000">48 kHz</option>
                      </select>
                    </label>
                    <label className="tts-advanced-toggle">
                      <input type="checkbox" checked={advancedSettings.denoise} onChange={(event) => updateAdvancedSetting('denoise', event.target.checked)} />
                      <span>Denoise</span>
                    </label>
                  </fieldset>
                </div>
              )}

              <div className="studio-side-card-v2">
                <div className="studio-side-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                  <span>{t('Kullanım Özeti', 'Usage Summary')}</span>
                </div>
                <div className="tts-usage-stats">
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Karakter', 'Characters')}</span>
                    <span className="tts-usage-value">{charCount.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{ttsRemainingCredits === null ? t('Misafir Limit', 'Guest Limit') : t('Kalan Karakter', 'Remaining Characters')}</span>
                    <span className="tts-usage-value">{ttsRemainingCredits === null ? maxChars.toLocaleString('tr-TR') : ttsRemainingCredits.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Tahmini Karakter', 'Estimated Characters')}</span>
                    <span className="tts-usage-value">{estimatedCredits.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Tahmini Süre', 'Estimated Duration')}</span>
                    <span className="tts-usage-value">{estimatedSeconds} sn</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Format', 'Format')}</span>
                    <span className="tts-usage-value">{format.toUpperCase()}</span>
                  </div>
                </div>
                {error && (
                  <div className="tts-error-msg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                  </div>
                )}
              </div>

              <div className="studio-side-actions">
                <button className="tts-btn-preview" type="button" disabled={isLoading || !text.trim() || (engineVersion === 'clone' && (!canUseCloneEngine || !selectedCloneVoice || selectedCloneVoice.status !== 'ready'))} onClick={synthesize}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  {isLoading ? t('Hazırlanıyor...', 'Preparing...') : t('Önizleme', 'Preview')}
                </button>
                <button className="tts-btn-download" type="button" disabled={isLoading || !text.trim() || (engineVersion === 'clone' && (!canUseCloneEngine || !selectedCloneVoice || selectedCloneVoice.status !== 'ready'))} onClick={downloadWithPackage}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {isLoading ? t('Hazırlanıyor...', 'Preparing...') : t('Seslendir ve İndir', 'Voice and Download')}
                </button>
              </div>
            </aside>
          </div>
          {audioPreviewSection}
        </div>

        <div className="studio-features service-features tts-features">
          <div className="service-features-intro">
            <h3>{t('Neden Konuşmatik Seslendirme?', 'Why Konusmatik Text-to-Speech?')}</h3>
            <p className="studio-features-lead">{t('Kurumsal ihtiyaçlarda metinden sese altyapısı kurum içi ağda, kontrollü erişimle ve veri kurum dışına çıkmadan konumlandırılabilir.', 'For enterprise needs, text-to-speech infrastructure can be positioned on an internal network with controlled access and without data leaving the organization.')}</p>
          </div>
          <div className="studio-features-grid">
            {ttsFeatures.map((feature, index) => (
              <StarBorder as="div" key={feature.title} className="service-feature-star" color={index % 2 === 0 ? '#6c3ce9' : '#d21784'} speed="6s" thickness={2} backgroundColor="transparent" borderColor="transparent">
              <div className="studio-feature-card">
                <div className="studio-feature-icon tts-feature-icon">
                  <FeatureIcon type={feature.icon} />
                </div>
                <strong>{t(feature.title, feature.titleEn)}</strong>
                <p>{t(feature.desc, feature.descEn)}</p>
              </div>
              </StarBorder>
            ))}
          </div>
        </div>
      </div>

      {showVoiceModal && (
        <div className="tts-package-overlay" role="dialog" aria-modal="true" aria-labelledby="tts-voice-modal-title" onClick={closeVoiceModal}>
          <div className="tts-voice-modal" onClick={(event) => event.stopPropagation()}>
            <button className="tts-package-close" type="button" aria-label={t('Pencereyi kapat', 'Close modal')} onClick={closeVoiceModal}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="tts-package-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 0 0-4 4v5a4 4 0 0 0 8 0V6a4 4 0 0 0-4-4z" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <path d="M12 18v4" />
                <path d="M8 22h8" />
              </svg>
            </div>
            <h3 id="tts-voice-modal-title">{t('Yeni Ses Oluştur', 'Create New Voice')}</h3>
            <p>
              {voiceEnrollmentCreditCost !== null
                ? t(`Bu işlem ${Number(voiceEnrollmentCreditCost).toLocaleString('tr-TR')} karakter kullanacaktır.`, `This operation will use ${Number(voiceEnrollmentCreditCost).toLocaleString('en-US')} characters.`)
                : t('Ses oluşturma bedeli şu anda alınamıyor.', 'The voice creation fee is currently unavailable.')}
            </p>
            <div className="tts-voice-modal-meta">
              <span>{t('Kalan Karakter', 'Remaining Characters')}: {ttsRemainingCredits === null ? '-' : ttsRemainingCredits.toLocaleString('tr-TR')}</span>
              <span>{t('Ses Hakları', 'Voice Slots')}: {ttsActiveVoiceCount} / {ttsVoiceSlotLimit}</span>
            </div>
            {voiceFormError && <div className="tts-error-msg">{voiceFormError}</div>}
            <form className="tts-voice-form" onSubmit={submitVoiceEnrollment}>
              <label className="tts-voice-field">
                <span>{t('Ses Adı', 'Voice Name')}</span>
                <input value={voiceName} onChange={(event) => setVoiceName(event.target.value)} placeholder={t('Örn. Anka', 'e.g. Anka')} />
              </label>
              <label className="tts-voice-field">
                <span>{t('Referans Ses', 'Reference Audio')}</span>
                <input type="file" accept={VOICE_REFERENCE_ACCEPT} onChange={handleVoiceFileChange} />
                <small>{t('Desteklenen format: WAV, MP3, M4A, MP4, WEBM, OGG', 'Supported formats: WAV, MP3, M4A, MP4, WEBM, OGG')} · {t('Maksimum dosya boyutu: 20 MB', 'Maximum file size: 20 MB')}</small>
              </label>
              <label className="tts-voice-consent">
                <input type="checkbox" checked={voiceConsentConfirmed} onChange={(event) => setVoiceConsentConfirmed(event.target.checked)} />
                <span>{t('Bu sesin kullanımı ve klonlama iznine sahip olduğumu onaylıyorum.', 'I confirm that I have permission to use and clone this voice.')}</span>
              </label>
              <div className="tts-voice-actions">
                <button type="button" className="tts-clone-create-btn secondary" onClick={closeVoiceModal} disabled={voiceSubmitting}>
                  {t('Vazgeç', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="tts-clone-create-btn"
                  disabled={voiceSubmitting || !voiceConsentConfirmed || !voiceAudioFile || !voiceName.trim() || voiceEnrollmentCreditCost === null || (ttsRemainingCredits !== null && voiceEnrollmentCreditCost !== null && ttsRemainingCredits < voiceEnrollmentCreditCost)}
                >
                  {voiceSubmitting ? t('Gönderiliyor...', 'Submitting...') : t('Sesimi Oluştur', 'Create Voice')}
                </button>
              </div>
              {ttsRemainingCredits !== null && voiceEnrollmentCreditCost !== null && (
                <div className="tts-voice-modal-footnote">
                  {ttsRemainingCredits < voiceEnrollmentCreditCost
                    ? t('Yetersiz karakter hakkı. Paketleri inceleyebilirsiniz.', 'Insufficient character quota. You can review packages.')
                    : t('Ses oluşturma işlemi işlemeye alındığında sesiniz listede görünür.', 'Your voice will appear in the list once processing starts.')}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {showPackagePopup && (
        <div className="tts-package-overlay" role="dialog" aria-modal="true" aria-labelledby="tts-package-title" onClick={() => setShowPackagePopup(false)}>
          <div className="tts-package-modal" onClick={(event) => event.stopPropagation()}>
            <button className="tts-package-close" type="button" aria-label={t('Uyarıyı kapat', 'Close warning')} onClick={() => setShowPackagePopup(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="tts-package-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
                <path d="M2 7h20v5H2z" />
                <path d="M12 22V7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
            </div>
            <h3 id="tts-package-title">{packagePopupTitle}</h3>
            <p>{packageMessage}</p>
            <button
              className="tts-package-confirm"
              type="button"
              onClick={() => {
                setShowPackagePopup(false);
                onNavigate?.(packagePopupTarget);
              }}
            >
              {packagePopupButtonLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}





