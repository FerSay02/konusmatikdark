import { useEffect, useMemo, useRef, useState } from 'react';
import './StudioReveal.css';
import { apiFetch } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import StudioHero from '../components/StudioHero';
import StarBorder from '../components/StarBorder';
import { asrHeroContent, asrSteps, asrFeatures } from '../data/studioContent';

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

const MAX_ASR_FILE_SIZE_BYTES = 100 * 1024 * 1024;

function FeatureIcon({ type }) {
  const icons = {
    accuracy: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
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

export default function ASR({ prefill, onNavigate, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = (tr, en) => (isEnglish ? en : restoreTurkishUiText(tr));
  const initialFile = prefill?.file || null;
  const [selectedFile, setSelectedFile] = useState(initialFile);
  const [fileName, setFileName] = useState(initialFile?.name || prefill?.fileName || '');
  const [fileSize, setFileSize] = useState(initialFile?.size || 0);
  const [jobName, setJobName] = useState(typeof prefill?.jobName === 'string' ? prefill.jobName : '');
  const [transcriptText, setTranscriptText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPackagePopup, setShowPackagePopup] = useState(false);
  const [packageMessage, setPackageMessage] = useState({
    tr: 'Deşifre işlemi için giriş yapmalı ve yeterli ücretsiz ya da paket hakkına sahip olmalısınız.',
    en: 'You must log in and have sufficient free or paid allowance to transcribe this file.',
  });
  const fileInputRef = useRef(null);

  const currentStep = !selectedFile ? 1 : !transcriptText ? 2 : 3;

  const wordCount = useMemo(() => {
    if (!transcriptText) return 0;
    return transcriptText.split(/\s+/).filter(Boolean).length;
  }, [transcriptText]);

  useEffect(() => {
    if (!isLoading) {
      queueMicrotask(() => setProgress(0));
      return undefined;
    }

    queueMicrotask(() => setProgress(6));
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const shouldPause = Math.random() < 0.45;
        if (shouldPause) return prev;
        const jump = Math.floor(Math.random() * 7) + 2;
        return Math.min(prev + jump, 92);
      });
    }, 650);

    return () => clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (!showPackagePopup) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowPackagePopup(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPackagePopup]);

  const handleSelectFile = (f) => {
    if (!f) return;
    if (f.size > MAX_ASR_FILE_SIZE_BYTES) {
      setSelectedFile(null);
      setFileName('');
      setFileSize(0);
      setTranscriptText('');
      setErrorText(t('Dosya boyutu en fazla 10 MB olabilir.', 'The file size can be at most 10 MB.'));
      return;
    }
    setSelectedFile(f);
    setFileName(f.name);
    setFileSize(f.size);
    if (!jobName) setJobName(f.name.replace(/\.[^/.]+$/, ''));
    setTranscriptText('');
    setErrorText('');
  };

  const handleFileChange = (event) => {
    handleSelectFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleSelectFile(event.dataTransfer.files?.[0]);
  };

  const handleCopy = async () => {
    if (!transcriptText) return;
    await navigator.clipboard.writeText(transcriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!transcriptText) return;
    const textBlob = new Blob([transcriptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(textBlob);
    const a = document.createElement('a');
    const safeBaseName = (jobName || fileName || 'desifre')
      .replace(/\.[^/.]+$/, '')
      .split('')
      .map((char) => (char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? '_' : char))
      .join('')
      .trim();
    a.href = url;
    a.download = `${safeBaseName || 'desifre'}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleStart = async () => {
    if (!selectedFile || isLoading) return;
    setIsLoading(true);
    setErrorText('');
    setTranscriptText('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('language', language);
      formData.append('task', 'transcribe');

      const response = await apiFetch('/api/v1/asr/jobs/sync', {
        method: 'POST',
        skipAuthExpiredEvent: true,
        body: formData,
      });

      const created = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(created?.detail || `ASR istegi basarisiz (${response.status})`);
      }
      const text = typeof created?.text === 'string' ? created.text.trim() : '';
      if (!text) throw new Error('ASR bos metin d�nd�rd�.');
      setTranscriptText(text);
    } catch (error) {
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Not authenticated'))) {
        setPackageMessage({ tr: 'Deşifre işlemini başlatmak için giriş yapmalısınız.', en: 'You must log in to start transcription.' });
        setShowPackagePopup(true);
        return;
      }
      if (error instanceof Error && (error.message.includes('402') || error.message.includes('Insufficient'))) {
        setPackageMessage({
          tr: 'Bu dosyayı deşifre etmek için yeterli ücretsiz ASR hakkınız veya aktif ASR paketiniz olmalı.',
          en: 'You need enough free ASR allowance or an active ASR plan to transcribe this file.',
        });
        setShowPackagePopup(true);
        return;
      }
      setErrorText(error instanceof Error ? error.message : 'Beklenmeyen hata olustu.');
    } finally {
      setProgress(100);
      setIsLoading(false);
    }
  };
  return (
    <div className="studio-page">
      <StudioHero
        title={asrHeroContent.title}
        titleEn={asrHeroContent.titleEn}
        description={asrHeroContent.description}
        descriptionEn={asrHeroContent.descriptionEn}
        steps={asrSteps}
        currentStep={currentStep}
        className="asr-hero"
        appLanguage={language}
      />

      <div className="studio-content">
        <div className="studio-workspace">
          <div className="studio-grid-v2">
            <div className="studio-main-v2">
              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>{t('Ses Dosyası', 'Audio File')}</h3>
                </div>
                <div
                  className={`asr-drop-zone ${fileName ? 'has-file' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {fileName ? (
                    <div className="asr-file-info">
                      <div className="asr-file-details">
                        <strong>{fileName}</strong>
                        <span>{formatFileSize(fileSize)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="asr-drop-content">
                      <p>{t('Ses dosyasını sürükleyip bırakın veya tıklayıp seçin', 'Drag and drop an audio file or click to select')}</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="asr-file-input"
                    type="file"
                    accept=".mp3,.wav,.m4a"
                    onChange={handleFileChange}
                    className="hidden-file-input"
                  />
                </div>
              </div>

              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>{t('Çalışma Adı', 'Job Name')}</h3>
                </div>
                <input
                  type="text"
                  className="asr-job-input"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder={t('Örn: Haftalık ekip toplantısı', 'Example: Weekly team meeting')}
                />
              </div>

              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>{t('Deşifre Sonucu', 'Transcription Result')}</h3>
                  {transcriptText && <span className="asr-word-count">{wordCount} {t('kelime', 'words')}</span>}
                </div>
                {isLoading && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #E8356D 0%, #C62A8C 100%)',
                          transition: 'width 380ms ease',
                        }}
                      />
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                      {t('İşleniyor...', 'Processing...')} %{progress}
                    </div>
                  </div>
                )}
                <div className="asr-transcript-wrapper">
                  <textarea
                    rows="10"
                    readOnly
                    value={transcriptText}
                    placeholder={t('Deşifre başlatıldığında metin çıkar.', 'The transcript will appear after processing starts.')}
                    className="asr-transcript"
                    style={{ resize: 'none' }}
                  />
                  {errorText && <p style={{ marginTop: '8px', color: '#b91c1c' }}>{errorText}</p>}
                </div>
                <div className="asr-transcript-actions-outer">
                  <button type="button" className="asr-copy-btn" onClick={handleDownload} disabled={!transcriptText}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    {t('İndir', 'Download')}
                  </button>
                  <button type="button" className="asr-copy-btn" onClick={handleCopy} disabled={!transcriptText}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    {copied ? t('Kopyalandı!', 'Copied!') : t('Kopyala', 'Copy')}
                  </button>
                </div>
              </div>
            </div>

            <aside className="studio-side-v2">
              <div className="studio-side-card-v2">
                <div className="studio-side-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>{t('Deşifre Özellikleri', 'Transcription Features')}</span>
                </div>
                <div className="tts-usage-stats">
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('İşlem Hızı', 'Processing Speed')}</span>
                    <span className="tts-usage-value" style={{color: '#E8356D'}}>{t('Gerçek Zamandan Hızlı', 'Faster Than Real Time')}</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Dil', 'Language')}</span>
                    <span className="tts-usage-value">{language === 'en' ? 'English (EN)' : 'Türkçe (TR)'}</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Boyut Limiti', 'Size Limit')}</span>
                    <span className="tts-usage-value">100 MB</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Formatlar', 'Formats')}</span>
                    <span className="tts-usage-value">MP3, WAV, M4A</span>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="studio-side-card-v2">
                  <div className="studio-side-card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    <span>{t('Seçili Dosya', 'Selected File')}</span>
                  </div>
                  <div className="tts-usage-stats">
                    <div className="tts-usage-item">
                      <span className="tts-usage-label" style={{maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={fileName}>{fileName}</span>
                      <span className="tts-usage-value">{formatFileSize(fileSize)}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="studio-side-actions">
                <button className="asr-btn-start" type="button" disabled={!selectedFile || isLoading} onClick={handleStart}>
                  {isLoading ? t('Deşifre ediliyor...', 'Transcribing...') : t('Deşifreyi Başlat', 'Start Transcription')}
                </button>
              </div>
            </aside>
          </div>
        </div>

        {/* Features Section */}
        <div className="studio-features service-features asr-features">
          <div className="service-features-intro">
            <h3>{t('Neden Konuşmatik Deşifre?', 'Why Konusmatik Transcription?')}</h3>
            <p className="studio-features-lead">{t('Kapalı ağ, hassas toplantı kayıtları ve kurum içi arşivler için local deşifre mimarisi planlanabilir.', 'A local transcription architecture can be planned for closed networks, sensitive meeting recordings, and internal archives.')}</p>
          </div>
          <div className="studio-features-grid">
            {asrFeatures.map((f, index) => (
              <StarBorder as="div" key={f.title} className="service-feature-star" color={index % 2 === 0 ? '#6c3ce9' : '#d21784'} speed="6s" thickness={2} backgroundColor="transparent" borderColor="transparent">
              <div className="studio-feature-card">
                <div className="studio-feature-icon asr-feature-icon">
                  <FeatureIcon type={f.icon} />
                </div>
                <strong>{t(f.title, f.titleEn)}</strong>
                <p>{t(f.desc, f.descEn)}</p>
              </div>
              </StarBorder>
            ))}
          </div>
        </div>
      </div>
      {showPackagePopup && (
        <div className="tts-package-overlay" role="dialog" aria-modal="true" aria-labelledby="asr-package-title" onClick={() => setShowPackagePopup(false)}>
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
            <h3 id="asr-package-title">{t('Önce paket satın almanız gerek', 'You need to purchase a plan first')}</h3>
            <p>{t(packageMessage.tr, packageMessage.en)}</p>
            <button
              className="tts-package-confirm"
              type="button"
              onClick={() => {
                setShowPackagePopup(false);
                onNavigate?.('pricing');
              }}
            >
              {t('Paketler sayfasına git', 'Go to Plans')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
