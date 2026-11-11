import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './ApiDocs.theme.css';
import '../application-light-theme.css';
import { createPortal } from 'react-dom';
import { readStoredLanguage } from '../lib/language';
import StudioHero from '../components/StudioHero';
import { apiHeroContent, apiSteps } from '../data/studioContent';
import {
  API_BASE_REALTIME_WS,
  API_BASE_REST,
  asrCodeExamples,
  asrLongFilesNote,
  asrParameters,
  asrSpeedTip,
  asrSrtCodeExamples,
  asrSupportedFormats,
  asrVerboseWordsCodeExamples,
  capacityTableData,
  corporateAsrJobParameters,
  corporateAsrPollingExample,
  corporateTtsJobParameters,
  corporateTtsPollingExample,
  errorStatusTable,
  modelsCodeExamples,
  modelsData,
  modelsRetrieveCodeExamples,
  nativeRealtimeCodeExamples,
  nativeRealtimeEventTable,
  nativeRealtimeParameters,
  openAiRealtimeParameters,
  quickStartSteps,
  realtimeClientCommitExamples,
  realtimeCodeExamples,
  realtimeComparisonTable,
  realtimeErrorCodesTable,
  realtimeEventTable,
  retryWithBackoffExample,
  sdkSetupExamples,
  streamingTtsCodeExamples,
  streamingTtsParameters,
  streamingTtsResponseHeaders,
  ttsCodeExamples,
  ttsParameters,
  ttsSpeedCodeExamples,
  ttsSupportedFormatsTable,
  ttsVoicesData,
} from '../data/apiDocsV2';
import {
  corporateAsrResultFields,
  corporateAsrSyncExample,
  corporateAsrUrlExample,
  corporateAsrUrlParameters,
  webhookEndpointsTable,
  webhookErrorCodes,
  webhookEventExamples,
  webhookHeadersTable,
  webhookManagementExample,
  webhookRetrySchedule,
  webhookVerifyExample,
} from '../data/apiDocsWebhooks';

const codeLanguageLabels = {
  curl: 'cURL',
  python: 'Python',
  node: 'Node.js',
  completed: 'asr.job.completed',
  failed: 'asr.job.failed',
};

function CopyButton({ textToCopy, language = 'tr' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = textToCopy;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      className={`api-copy-icon-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      title={copied ? (language === 'en' ? 'Copied' : 'Kopyalandı') : (language === 'en' ? 'Copy code' : 'Kodu kopyala')}
      aria-label={language === 'en' ? 'Copy code' : 'Kodu kopyala'}
    >
      {copied ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
    </button>
  );
}

function CodeConsole({ examples, language, defaultLanguage }) {
  const keys = ['python', 'node', 'curl', 'completed', 'failed'].filter((key) => examples[key]);
  const initial = defaultLanguage && examples[defaultLanguage] ? defaultLanguage : keys[0];
  const [activeLanguage, setActiveLanguage] = useState(() => {
    try {
      const stored = localStorage.getItem('konusmatik_api_docs_code_language');
      return stored && keys.includes(stored) ? stored : initial;
    } catch {
      return initial;
    }
  });
  const activeCode = examples[activeLanguage] || examples[initial];

  const selectLanguage = (key) => {
    setActiveLanguage(key);
    if (!['python', 'node', 'curl'].includes(key)) return;
    try {
      localStorage.setItem('konusmatik_api_docs_code_language', key);
    } catch {
      // Code tabs still work when storage is unavailable.
    }
  };

  return (
    <div className="api-console">
      <div className="api-console-head">
        <div className="api-lang-tabs" role="tablist" aria-label={language === 'en' ? 'Code language' : 'Kod dili'}>
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={activeLanguage === key}
              className={`api-lang-tab ${activeLanguage === key ? 'active' : ''}`}
              onClick={() => selectLanguage(key)}
            >
              {codeLanguageLabels[key] || key}
            </button>
          ))}
        </div>
        <CopyButton textToCopy={activeCode} language={language} />
      </div>
      <pre data-no-translate="true"><code data-no-translate="true">{activeCode.split('\n').map((line, index) => <span className="api-code-line" key={`${activeLanguage}-${index}`}>{line || ' '}</span>)}</code></pre>
    </div>
  );
}

function SectionIntro({ title, description, headingLevel = 'h2' }) {
  const Heading = headingLevel;
  return (
    <div className="api-v2-section-head">
      <Heading>{title}</Heading>
      {description && <p>{description}</p>}
    </div>
  );
}

function EndpointHeader({ id, method, path, description }) {
  return (
    <div id={id} className={`api-v2-endpoint-head${path === '/audio/speech' ? ' api-v2-endpoint-head--wav' : ''}`}>
      <div className="api-route-badge-left">
        <span className={`api-http-method ${method.toLowerCase()}`}>{method}</span>
        <code className="api-route-path">{path}</code>
      </div>
      {description && <p>{description}</p>}
    </div>
  );
}

function ParametersTable({ parameters, language, t }) {
  return (
    <div className="api-v2-table-wrap">
      <table className="api-v2-table">
        <thead>
          <tr>
            <th>{t('Parametre', 'Parameter')}</th>
            <th>{t('Tür', 'Type')}</th>
            <th>{t('Zorunlu', 'Required')}</th>
            <th>{t('Açıklama', 'Description')}</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((parameter) => (
            <tr key={parameter.name}>
              <td><code>{parameter.name}</code></td>
              <td><code>{parameter.type}</code></td>
              <td><span className={`api-required-badge ${parameter.required ? 'yes' : 'no'}`}>{parameter.required ? t('Evet', 'Yes') : t('Hayır', 'No')}</span></td>
              <td>{language === 'en' ? parameter.descEn : parameter.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DocCallout({ variant = 'note', title, children, guideLink, guideText }) {
  return (
    <div className={`api-doc-callout api-doc-callout--${variant}`}>
      <div className="api-doc-callout-icon" aria-hidden="true">
        {variant === 'warning' ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
        )}
      </div>
      <div className="api-doc-callout-content">
        {title && <strong className="api-doc-callout-title">{title}</strong>}
        <span className="api-doc-callout-body">{children}</span>
        {guideLink && (
          <a href={guideLink} className="api-doc-callout-link">
            {guideText || 'Ayrıntılar →'}
          </a>
        )}
      </div>
    </div>
  );
}

export default function ApiDocs({ onNavigate, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const t = (tr, en) => (language === 'en' ? en : tr);
  const local = (item, key) => (language === 'en' ? item[`${key}En`] || item[key] : item[key]);
  const shellRef = useRef(null);
  const sidebarRef = useRef(null);
  const navRef = useRef(null);
  const ctaRef = useRef(null);
  const mobileNavRef = useRef(null);
  const [navPlacement, setNavPlacement] = useState({ mode: 'static', left: 0, top: 96 });
  const [activeSection, setActiveSection] = useState('quick-start');
  const [mobileSectionOpen, setMobileSectionOpen] = useState(false);

  useEffect(() => {
    const updatePageNavigation = () => {
      if (window.innerWidth > 900) {
        const sidebarRect = sidebarRef.current?.getBoundingClientRect();
        const ctaBottom = ctaRef.current?.getBoundingClientRect().bottom;
        const navHeight = navRef.current?.getBoundingClientRect().height ?? 0;
        const hasReachedStickyTop = (sidebarRect?.top ?? 0) + 48 <= 96;
        const nextPlacement = hasReachedStickyTop
          ? {
              mode: 'fixed',
              left: sidebarRect?.left ?? 0,
              top: Math.min(96, (ctaBottom ?? Number.POSITIVE_INFINITY) - navHeight),
            }
          : { mode: 'static', left: 0, top: 96 };

        setNavPlacement((current) => (
          current.mode === nextPlacement.mode
          && Math.abs(current.left - nextPlacement.left) < 0.5
          && Math.abs(current.top - nextPlacement.top) < 0.5
            ? current
            : nextPlacement
        ));
      } else {
        setNavPlacement((current) => (current.mode === 'static' ? current : { mode: 'static', left: 0, top: 96 }));
      }

      const sections = Array.from(shellRef.current?.querySelectorAll('.api-v2-content > .api-section, .api-v2-corporate-service') || []);
      const activationLine = Math.min(280, Math.max(170, window.innerHeight * 0.32));
      const isAtPageBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
      let current = isAtPageBottom
        ? sections.at(-1)
        : sections.reduce((selected, section) => {
            return section.getBoundingClientRect().top <= activationLine ? section : selected;
          }, sections[0]);

      if (!isAtPageBottom) {
        const serviceActivationLine = Math.min(420, Math.max(260, window.innerHeight * 0.45));
        const corporateServices = sections.filter((section) => section.classList.contains('api-v2-corporate-service'));
        const visibleService = corporateServices.reduce((selected, section) => {
          const rect = section.getBoundingClientRect();
          return rect.top <= serviceActivationLine && rect.bottom > serviceActivationLine ? section : selected;
        }, null);
        if (visibleService) current = visibleService;
      }
      if (current?.id) setActiveSection(current.id);
    };
    updatePageNavigation();
    window.addEventListener('scroll', updatePageNavigation, { passive: true });
    window.addEventListener('resize', updatePageNavigation);
    const contentResizeObserver = new ResizeObserver(updatePageNavigation);
    if (shellRef.current) contentResizeObserver.observe(shellRef.current);
    return () => {
      window.removeEventListener('scroll', updatePageNavigation);
      window.removeEventListener('resize', updatePageNavigation);
      contentResizeObserver.disconnect();
    };
  }, []);

  useLayoutEffect(() => {
    if (navPlacement.mode !== 'fixed') return undefined;

    const frame = window.requestAnimationFrame(() => {
      const navBottom = navRef.current?.getBoundingClientRect().bottom;
      const ctaBottom = ctaRef.current?.getBoundingClientRect().bottom;
      if (navBottom == null || ctaBottom == null || ctaBottom > 96 + (navRef.current?.getBoundingClientRect().height ?? 0)) return;

      const difference = ctaBottom - navBottom;
      if (Math.abs(difference) > 0.25) {
        setNavPlacement((current) => ({ ...current, top: current.top + difference }));
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [navPlacement]);

  useEffect(() => {
    if (!mobileSectionOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileSectionOpen(false);
    };
    const closeOnOutsideClick = (event) => {
      if (!mobileNavRef.current?.contains(event.target)) setMobileSectionOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOnOutsideClick);
    };
  }, [mobileSectionOpen]);

  const openEnterpriseContact = () => {
    onNavigate?.('contact');
  };

  const navGroups = [
    {
      items: [['quick-start', t('Hızlı Başlangıç', 'Quick Start')]],
    },
    {
      id: 'openai-sdk',
      label: 'OpenAI Python SDK Compatible API',
      items: [
        ['tts-api', t('OpenAI SDK ile Konuşmatik TTS', 'Konuşmatik TTS with OpenAI SDK')],
        ['streaming-tts', t('OpenAI SDK ile Konuşmatik Streaming TTS', 'Konuşmatik Streaming TTS with OpenAI SDK')],
        ['asr-api', t('OpenAI SDK ile Konuşmatik ASR', 'Konuşmatik ASR with OpenAI SDK')],
        ['openai-realtime', t('OpenAI SDK ile Konuşmatik Realtime ASR', 'Konuşmatik Realtime ASR with OpenAI SDK')],
        ['models', t('OpenAI SDK ile Konuşmatik Modelleri', 'Konuşmatik Models with OpenAI SDK')],
      ],
    },
    {
      id: 'corporate-api',
      label: t('Konuşmatik Asenkron API', 'Konuşmatik Async API'),
      items: [
        ['corporate-asr', 'Konuşmatik Asenkron ASR'],
        ['corporate-webhooks', t('Webhook Bildirimleri', 'Webhook Notifications')],
        ['corporate-tts', 'Konuşmatik Asenkron TTS'],
        ['realtime-api', t('Yerel Realtime ASR (WebSocket)', 'Native Realtime ASR (WebSocket)')],
      ],
    },
    {
      items: [
        ['guides', t('Kılavuzlar', 'Guides')],
        ['capacity', t('Limitler', 'Limits')],
        ['errors', t('Hatalar', 'Errors')],
      ],
    },
  ];

  const navigationOptions = navGroups.flatMap((group, groupIndex) => [
    ...(group.label && group.id ? [{ id: group.id, label: group.label, groupIndex, isGroup: true }] : []),
    ...group.items.map(([id, label]) => ({ id, label, groupIndex, isGroup: false })),
  ]);
  const activeNavigationOption = navigationOptions.find((option) => option.id === activeSection) || navigationOptions[0];
  const handleSectionNavigate = (event, sectionId) => {
    event.preventDefault();
    setMobileSectionOpen(false);
    navRef.current && Array.from(navRef.current.querySelectorAll('a'))
      .find((link) => link.getAttribute('href') === `#${sectionId}`)
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
  };

  const pageNavigation = (
    <>
      <div ref={mobileNavRef} className={`api-v2-mobile-nav${mobileSectionOpen ? ' is-open' : ''}`}>
        <button
          type="button"
          className="api-v2-mobile-nav-trigger"
          aria-expanded={mobileSectionOpen}
          aria-controls="api-v2-mobile-section-list"
          onClick={() => setMobileSectionOpen((open) => !open)}
        >
          <span>{t('Bölüm', 'Section')}: {activeNavigationOption?.label}</span>
          <span className="api-v2-mobile-nav-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
        <div id="api-v2-mobile-section-list" className="api-v2-mobile-section-list" role="listbox" aria-label={t('API bölümü seç', 'Choose API section')}>
          {navigationOptions.map((option) => {
            const isActive = activeSection === option.id || (option.id === 'corporate-asr' && activeSection === 'corporate-api');
            return (
              <a
                key={`${option.id}-${option.groupIndex}`}
                href={`#${option.id}`}
                role="option"
                aria-selected={isActive}
                className={`${isActive ? 'active ' : ''}${option.isGroup ? 'is-group' : ''}`}
                onClick={(event) => handleSectionNavigate(event, option.id)}
              >
                {option.label}
              </a>
            );
          })}
        </div>
      </div>
      <nav
      ref={navRef}
      className={`api-v2-nav ${navPlacement.mode === 'fixed' ? 'is-fixed' : ''}`}
      style={{ '--api-nav-left': `${navPlacement.left}px`, '--api-nav-top': `${navPlacement.top}px` }}
      aria-label={t('API dokümantasyonu bölümleri', 'API documentation sections')}
    >
      {navGroups.map((group, groupIndex) => (
        <div key={group.id || groupIndex} className="api-v2-nav-group">
          {group.label && (
            <a href={`#${group.id}`} className={`api-v2-nav-group-title${activeSection === group.id && group.id !== 'corporate-api' ? ' active' : ''}`} onClick={(event) => handleSectionNavigate(event, group.id)}>
              {group.label}
            </a>
          )}
          {group.items.map(([id, label]) => {
            const isActive = activeSection === id || (id === 'corporate-asr' && activeSection === 'corporate-api');
            return (
              <a key={id} href={`#${id}`} className={`${isActive ? 'active ' : ''}${group.label ? 'api-v2-nav-subitem' : ''}`} aria-current={isActive ? 'location' : undefined} onClick={(event) => handleSectionNavigate(event, id)}>
                {label}
              </a>
            );
          })}
        </div>
      ))}
      </nav>
    </>
  );

  return (
    <div className="studio-page api-v2-page">
      <StudioHero
        title={apiHeroContent.title}
        titleEn={apiHeroContent.titleEn}
        description={apiHeroContent.description}
        descriptionEn={apiHeroContent.descriptionEn}
        steps={apiSteps}
        allStepsActive
        className="api-hero"
        appLanguage={language}
      />

      <div ref={shellRef} className="api-v2-shell">
        <aside ref={sidebarRef} className="api-v2-sidebar">
          {navPlacement.mode === 'fixed' ? createPortal(pageNavigation, document.body) : pageNavigation}
        </aside>

        <main className="studio-content api-content-wrap api-v2-content">
          {/* 1. HIZLI BAŞLANGIÇ */}
          <section id="quick-start" className="api-section">
            <SectionIntro
              eyebrow="REST & SDK"
              title={t('Hızlı Başlangıç & Kimlik Doğrulama', 'Quick Start & Authentication')}
              description={t('Konuşmatik API servislerine doğrudan REST uç noktaları veya OpenAI Python SDK üzerinden bağlanabilirsiniz.', 'Connect to Konuşmatik API services via REST endpoints or using the OpenAI Python SDK.')}
            />

            <div className="api-v2-quick-grid">
              {quickStartSteps.map((step) => (
                <article key={step.num} className="api-v2-quick-card">
                  <span>{step.num}</span>
                  <h3>{local(step, 'title')}</h3>
                  <p>{local(step, 'desc')}</p>
                </article>
              ))}
            </div>

            <div className="api-v2-base-grid">
              <article className="api-v2-base-card">
                <span>REST API</span>
                <strong>{t('Production Base URL', 'Production Base URL')}</strong>
                <code>{API_BASE_REST}</code>
                <CopyButton textToCopy={API_BASE_REST} language={language} />
              </article>
              <article className="api-v2-base-card">
                <span>WebSocket API</span>
                <strong>{t('Realtime Stream URL', 'Realtime Stream URL')}</strong>
                <code>{API_BASE_REALTIME_WS}</code>
                <CopyButton textToCopy={API_BASE_REALTIME_WS} language={language} />
              </article>
            </div>

            <div className="api-endpoint-card api-v2-auth-card">
              <div className="api-endpoint-details">
                <h3>{t('Kimlik Doğrulama (Bearer Token)', 'Authentication (Bearer Token)')}</h3>
                <p>{t('Tüm API isteklerinizi HTTP Authorization başlığı altında API anahtarınız ile gönderin.', 'Send all API requests with your API key under the HTTP Authorization header.')}</p>
              </div>
              <div className="api-console">
                <div className="api-console-head">
                  <span className="api-console-label">HTTP Header</span>
                  <CopyButton textToCopy="Authorization: Bearer $KONUSMATIK_API_KEY" language={language} />
                </div>
                <pre data-no-translate="true"><code data-no-translate="true">Authorization: Bearer $KONUSMATIK_API_KEY</code></pre>
              </div>
            </div>
          </section>

          {/* 2. OPENAI PYTHON SDK */}
          <section id="openai-sdk" className="api-section">
            <SectionIntro
              eyebrow="OpenAI SDK Compatible"
              title={t('OpenAI Python SDK Compatible API', 'OpenAI Python SDK Compatible API')}
              description={t('Mevcut OpenAI SDK entegrasyonunuzda yalnızca base_url, API anahtarı ve Konuşmatik model adını tanımlayın. ASR, TTS ve model listeleme işlemlerini standart SDK metotlarıyla çağırın.', 'Set the base_url, API key, and Konuşmatik model name in your existing OpenAI SDK integration. Call ASR, TTS, and model listing through standard SDK methods.')}
            />

            <div className="api-endpoint-card">
              <div className="api-endpoint-details">
                <h3>{t('Kurulum ve İstemci Tanımı', 'Installation and Client Setup')}</h3>
                <p>{t('Resmi openai paketini kurarak başlayın:', 'Get started by installing the official openai package:')}</p>
              </div>
              <div className="api-endpoint-console-wrap">
                <CodeConsole examples={sdkSetupExamples} language={language} defaultLanguage="python" />
              </div>
            </div>

          </section>

          {/* 3. TEXT TO SPEECH (TTS) */}
          <section id="tts-api" className="api-section">
            <SectionIntro
              eyebrow="Doğal Ses Sentezi"
              title={t('OpenAI SDK ile Konuşmatik TTS', 'Konuşmatik TTS with OpenAI SDK')}
              description={t(
                'Konuşmatik TTS, Türkçe metinleri doğal ve akıcı biçimde seslendirir (48 kHz, 16-bit, mono). Sesin tamamı oluşturulduktan sonra seçilen formatta ses verisi döner.',
                'Konuşmatik TTS converts Turkish text into natural, fluent speech (48 kHz, 16-bit, mono). After the entire audio output has been generated, it is returned in the chosen format.',
              )}
            />
            <div className="api-endpoint-card">
              <EndpointHeader method="POST" path="/audio/speech" description={t('Metinleri doğal ve akıcı Türkçe seslendirir (48 kHz / 16-bit / mono WAV, MP3, Opus, AAC veya FLAC).', 'Synthesizes Turkish text into natural speech (48 kHz / 16-bit / mono WAV, MP3, Opus, AAC, or FLAC).')} />

              <div className="api-v2-subsection">
                <h3>{t('Parametreler', 'Parameters')}</h3>
                <ParametersTable parameters={ttsParameters} language={language} t={t} />
              </div>

              <div className="api-v2-subsection">
                <h3>{t('Sesler', 'Voices')}</h3>
                <div className="api-v2-table-wrap">
                  <table className="api-v2-table">
                    <thead>
                      <tr>
                        <th>{t('Ses Adı', 'Voice')}</th>
                        <th>{t('Cinsiyet', 'Gender')}</th>
                        <th>{t('Tarz', 'Style')}</th>
                        <th>{t('Açıklama & OpenAI Eşlemesi', 'Description & OpenAI Aliases')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ttsVoicesData.map((voice) => (
                        <tr key={voice.id}>
                          <td><code>{voice.id}</code> ({voice.name})</td>
                          <td>{local(voice, 'gender')}</td>
                          <td>{local(voice, 'style')}</td>
                          <td>{local(voice, 'desc')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="api-v2-subsection">
                <h3>{t('Yanıt (Desteklenen Formatlar)', 'Response (Supported Formats)')}</h3>
                <div className="api-v2-table-wrap">
                  <table className="api-v2-table">
                    <thead>
                      <tr>
                        <th>{t('Format', 'Format')}</th>
                        <th>{t('İçerik Türü (MIME)', 'Content-Type')}</th>
                        <th>{t('Varsayılan', 'Default')}</th>
                        <th>{t('Açıklama', 'Description')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ttsSupportedFormatsTable.map((f) => (
                        <tr key={f.format}>
                          <td><code>{f.format}</code></td>
                          <td><code>{f.mime}</code></td>
                          <td><span className={`api-required-badge ${f.isDefault ? 'yes' : 'no'}`}>{f.isDefault ? t('Varsayılan (WAV)', 'Default (WAV)') : '-'}</span></td>
                          <td>{language === 'en' ? f.descEn : f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('WAV Örneği (Varsayılan)', 'WAV Example (Default)')}</h4>
                <CodeConsole examples={ttsCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('MP3 Formatı ve Hız (speed) Örneği', 'MP3 Format & Speed Example')}</h4>
                <CodeConsole examples={ttsSpeedCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <DocCallout variant="note" title={t('Not', 'Note')} guideLink="#guide-audio-formats" guideText={t('Ses formatları kılavuzu →', 'Audio formats guide →')}>
                {t('Konuşmatik varsayılan çıktı formatı wav olup 48 kHz / 16-bit / mono kalitesindedir (OpenAI varsayılanı mp3\'tür). MP3 için response_format="mp3" belirtilmelidir.', 'Konuşmatik default output format is wav (48 kHz / 16-bit / mono); OpenAI default is mp3. Set response_format="mp3" explicitly for mp3.')}
              </DocCallout>
            </div>
          </section>

          {/* 4. STREAMING TEXT TO SPEECH (TTS) */}
          <section id="streaming-tts" className="api-section">
            <SectionIntro
              title={t('OpenAI SDK ile Konuşmatik Streaming TTS', 'Konuşmatik Streaming TTS with OpenAI SDK')}
              description={t(
                'Konuşmatik Streaming TTS, sesin tamamının oluşturulmasını beklemeden üretilen ses verisini istemciye aktarmaya başlar.',
                'Konuşmatik Streaming TTS starts transferring generated audio data to the client without waiting for the entire audio output to be completed.',
              )}
            />

            <div className="api-endpoint-card">
              <EndpointHeader
                method="POST"
                path="/audio/speech"
                description={t('Sesin tamamlanmasını beklemeden ham PCM ses verisini parça parça istemciye aktarır.', 'Streams raw PCM audio chunks incrementally without waiting for complete generation.')}
              />

              <div className="api-v2-subsection">
                <h3>{t('Parametreler', 'Parameters')}</h3>
                <ParametersTable parameters={streamingTtsParameters} language={language} t={t} />
              </div>

              <div className="api-v2-subsection">
                <h3>{t('Yanıt Başlıkları', 'Response Headers')}</h3>
                <div className="api-console">
                  <div className="api-console-head">
                    <span className="api-console-label">HTTP Headers</span>
                    <CopyButton textToCopy={streamingTtsResponseHeaders} language={language} />
                  </div>
                  <pre data-no-translate="true"><code data-no-translate="true">{streamingTtsResponseHeaders}</code></pre>
                </div>
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('Python SDK Örneği', 'Python SDK Example')}</h4>
                <CodeConsole examples={streamingTtsCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <DocCallout variant="note" title={t('Not', 'Note')} guideLink="#guide-audio-formats" guideText={t('Ses formatları kılavuzu →', 'Audio formats guide →')}>
                {t('Streaming isteklerinde response_format="pcm" zorunludur ve speed parametresi uygulanmaz. Chunk boyutları değişken olabilir.', 'Streaming requests require response_format="pcm" and speed parameter is not applied. Chunk sizes may vary.')}
              </DocCallout>
            </div>
          </section>

          {/* 5. SPEECH TO TEXT (ASR) */}
          <section id="asr-api" className="api-section">
            <SectionIntro
              eyebrow="Konuşma Tanıma"
              title={t('OpenAI SDK ile Konuşmatik ASR', 'Konuşmatik ASR with OpenAI SDK')}
              description={t('100 MB boyuta ve 3 saate kadar ses dosyalarını yüksek doğrulukla Türkçe metne dönüştürün.', 'Transcribe audio files up to 100 MB and 3 hours into accurate Turkish text.')}
            />
            <div className="api-endpoint-card">
              <EndpointHeader method="POST" path="/audio/transcriptions" description={t('Ses veya video dosyasını multipart/form-data ile yükleyerek metne dönüştürür (Maks. 100 MB, 3 saat).', 'Transcribes audio/video files via multipart/form-data into text (Max 100 MB, 3 hours).')} />

              <div className="api-v2-subsection">
                <h3>{t('Parametreler', 'Parameters')}</h3>
                <ParametersTable parameters={asrParameters} language={language} t={t} />
              </div>

              <div className="api-v2-subsection">
                <h3>{t('Yanıt (Desteklenen Formatlar)', 'Response (Supported Formats)')}</h3>
                <div className="api-v2-format-row">
                  <strong>{t('Desteklenen Çıktı Formatları', 'Supported Output Formats')}</strong>
                  <div className="api-v2-format-list">
                    {asrSupportedFormats.map((format) => <span key={format}>{format}</span>)}
                  </div>
                </div>
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('Temel Deşifre Örneği (JSON)', 'Basic Transcription Example (JSON)')}</h4>
                <CodeConsole examples={asrCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('Kelime Seviyesinde Zaman Damgaları (verbose_json)', 'Word-level Timestamps (verbose_json)')}</h4>
                <CodeConsole examples={asrVerboseWordsCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('Altyazı Çıktısı (SRT)', 'Subtitle Output (SRT)')}</h4>
                <CodeConsole examples={asrSrtCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <DocCallout variant="note" title={t('İpucu', 'Tip')} guideLink="#guide-long-files" guideText={t('Uzun dosyalar kılavuzu →', 'Long files guide →')}>
                {t('Dosyayı yüklemeden önce 16 kHz mono formatına dönüştürmek süreyi %47 kısaltır. Cloudflare 100 saniye sınırı için kurumsal asenkron API önerilir.', 'Converting audio to 16 kHz mono pre-upload accelerates processing by 47%. For Cloudflare 100s limit, use corporate async API.')}
              </DocCallout>
            </div>
          </section>

          {/* 6. OPENAI SDK REALTIME */}
          <section id="openai-realtime" className="api-section">
            <SectionIntro
              title={t('OpenAI SDK ile Konuşmatik Realtime ASR', 'Konuşmatik Realtime ASR with OpenAI SDK')}
              description={t('AsyncOpenAI istemcisiyle mikrofonunuzdan PCM16 ses gönderin ve canlı deşifre olaylarını doğrudan dinleyin (Yalnızca konusmatik-asr-v1 modeli desteklenir).', 'Stream PCM16 microphone audio with the AsyncOpenAI client and receive live transcription events directly (Only konusmatik-asr-v1 is supported).')}
            />
            <div className="api-endpoint-card">
              <EndpointHeader method="WSS" path="/realtime" description={t('OpenAI Python SDK uyumlu gerçek zamanlı WebSocket deşifre bağlantısı (model=konusmatik-asr-v1).', 'OpenAI Python SDK-compatible realtime WebSocket transcription connection (model=konusmatik-asr-v1).')} />

              <div className="api-v2-subsection">
                <h3>{t('Parametreler (session.update)', 'Parameters (session.update)')}</h3>
                <ParametersTable parameters={openAiRealtimeParameters} language={language} t={t} />
              </div>

              <div className="api-v2-subsection">
                <h3>{t('Olaylar', 'Events')}</h3>
                <div className="api-v2-table-wrap">
                  <table className="api-v2-table api-v2-events-table">
                    <thead><tr><th>{t('Yön', 'Direction')}</th><th>{t('Olay (Event)', 'Event')}</th><th>{t('Açıklama', 'Description')}</th></tr></thead>
                    <tbody>{realtimeEventTable.map((row) => <tr key={`${row.dir}-${row.event}`}><td>{local(row, 'dir')}</td><td><code>{row.event}</code></td><td>{local(row, 'desc')}</td></tr>)}</tbody>
                  </table>
                </div>
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('Python SDK Örneği (Server VAD)', 'Python SDK Example (Server VAD)')}</h4>
                <CodeConsole examples={realtimeCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('İstemci kontrollü commit örneği', 'Client-controlled commit example')}</h4>
                <CodeConsole examples={realtimeClientCommitExamples} language={language} defaultLanguage="python" />
              </div>

              <DocCallout variant="warning" title={t('Önemli', 'Important')} guideLink="#guide-realtime-turns" guideText={t('Söz sırası ve VAD kılavuzu →', 'Realtime turns & VAD guide →')}>
                {t('Bu uç noktada yalnızca konusmatik-asr-v1 desteklenir. Cümle birleştirme ve turn_detection: null ayrıntıları için kılavuza bakın.', 'Only konusmatik-asr-v1 is supported on this endpoint. See the guide for utterance merging and turn_detection: null details.')}
              </DocCallout>
            </div>
          </section>

          {/* 7. MODELLER */}
          <section id="models" className="api-section">
            <SectionIntro
              eyebrow={t('Model Kataloğu', 'Model Catalog')}
              title={t('OpenAI SDK ile Konuşmatik Modelleri', 'Konuşmatik Models with OpenAI SDK')}
              description={t('Konuşmatik servisleri kamuya açık resmi model kimlikleriyle çalışır.', 'Konuşmatik services operate with official public model identifiers.')}
            />
            <div className="api-v2-model-grid">
              {modelsData.map((model) => (
                <article key={model.id} className="api-v2-model-card">
                  <div className="api-v2-model-top"><code>{model.id}</code></div>
                  <h3>{model.name}</h3>
                  <strong>{local(model, 'type')}</strong>
                  <p>{local(model, 'description')}</p>
                  <dl>
                    <div><dt>{t('Girdi', 'Input')}</dt><dd>{local(model, 'inputFormat')}</dd></div>
                    <div><dt>{t('Çıktı', 'Output')}</dt><dd>{local(model, 'outputFormat')}</dd></div>
                    <div><dt>{t('Kapasite', 'Capacity')}</dt><dd>{local(model, 'latency')}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
            <div className="api-endpoint-card">
              <EndpointHeader method="GET" path="/models" description={t('Aktif üretim modellerini listeler.', 'Lists active production models.')} />
              <div className="api-endpoint-console-wrap">
                <h4>{t('Model Listeleme Örneği', 'List Models Example')}</h4>
                <CodeConsole examples={modelsCodeExamples} language={language} defaultLanguage="python" />
              </div>
            </div>
            <div className="api-endpoint-card">
              <EndpointHeader method="GET" path="/models/{model}" description={t('Belirtilen modelin detay bilgilerini döndürür.', 'Retrieves details for a specific model.')} />
              <div className="api-endpoint-console-wrap">
                <h4>{t('Model Detayı Örneği', 'Retrieve Model Example')}</h4>
                <CodeConsole examples={modelsRetrieveCodeExamples} language={language} defaultLanguage="python" />
              </div>
            </div>
          </section>

          {/* 8. ASENKRON API */}
          <section id="corporate-api" className="api-section">
            <SectionIntro
              eyebrow="Yüksek Hacimli Toplu İşleme"
              title={t('Konuşmatik Asenkron API', 'Konuşmatik Async API')}
              description={t('Kurumsal API, yüksek hacimli toplu ASR ve TTS işleri için job tabanlı asenkron kuyruk modeli sunar. POST istekleri inference bitimini beklemez; anında HTTP 201 Created ve job_id döndürür.', 'The corporate API provides an asynchronous queue-based job model for large-scale ASR and TTS workloads. POST requests return HTTP 201 Created immediately without blocking.')}
            />

            {/* ASR Corporate */}
            <div id="corporate-asr" className="api-v2-corporate-service api-v2-nav-target">
              <SectionIntro
                headingLevel="h3"
                title="Konuşmatik Asenkron ASR"
                description={t('Ses dosyasını kuyruğa ekleyin, işi tamamlanana kadar takip edin ve transkripsiyon sonucunu alın.', 'Queue the audio file, poll the job until completion, and retrieve the transcription result.')}
              />
              <div className="api-endpoint-card">
                <div className="api-v2-corporate-routes">
                  <EndpointHeader id="corporate-create-job" method="POST" path="/corporate/asr/jobs" description={t('Yeni bir asenkron ASR işi kuyruğa ekler ve hemen job_id döndürür.', 'Enqueues an async ASR job and returns job_id immediately.')} />
                  <EndpointHeader id="corporate-polling" method="GET" path="/corporate/asr/jobs/{id}" description={t('İş durumunu sorgular (pending, processing, completed, failed).', 'Polls job status (pending, processing, completed, failed).')} />
                  <EndpointHeader id="corporate-result" method="GET" path="/corporate/asr/jobs/{id}/result" description={t('Tamamlanan işin transkripsiyon metnini, zaman damgalarını (segment/word) ve altyazılarını (srt/vtt) döndürür.', 'Retrieves final transcription text, timestamps (segment/word), and subtitle outputs (srt/vtt).')} />
                </div>
                <div className="api-v2-subsection">
                  <h3>{t('Parametreler', 'Parameters')}</h3>
                  <ParametersTable parameters={corporateAsrJobParameters} language={language} t={t} />
                </div>
                <div className="api-endpoint-console-wrap">
                  <h4>{t('İş Oluşturma, Polling ve Sonuç Alma', 'Create Job, Polling, and Result')}</h4>
                  <CodeConsole examples={corporateAsrPollingExample} language={language} defaultLanguage="python" />
                </div>
                <div className="api-v2-subsection">
                  <h3>{t('URL ile ASR İşi (Dosya Yüklemeden)', 'ASR Job from URL (No Upload)')}</h3>
                  <EndpointHeader id="corporate-asr-url" method="POST" path="/corporate/asr/jobs/url" description={t("Dosyayı sunucu tarafında indirip kuyruğa alarak asenkron ASR işi oluşturur (HTTP 202 Accepted).", 'Downloads the file server-side and queues an async ASR job (HTTP 202 Accepted).')} />
                  <ParametersTable parameters={corporateAsrUrlParameters} language={language} t={t} />
                  <CodeConsole examples={corporateAsrUrlExample} language={language} defaultLanguage="python" />
                </div>
                <div className="api-v2-subsection">
                  <h3>{t('Zaman Damgaları ve Sonuç Alanları', 'Timestamps & Result Fields')}</h3>
                  <EndpointHeader method="GET" path="/corporate/asr/jobs/{id}/download" description={t('Sonuç dosyası için süreli indirme bağlantısı döndürür (url, expires_in_seconds).', 'Returns a time-limited download link for the result file (url, expires_in_seconds).')} />
                  <ParametersTable parameters={corporateAsrResultFields} language={language} t={t} />
                </div>
                <div className="api-v2-subsection">
                  <h3>{t('Senkron ASR', 'Synchronous ASR')}</h3>
                  <EndpointHeader id="corporate-asr-sync" method="POST" path="/corporate/asr/jobs/sync" description={t('Kısa dosyalar için kuyruk beklemeden sonucu aynı istekte döndürür (HTTP 201).', 'For short files, returns the result in the same request without polling (HTTP 201).')} />
                  <CodeConsole examples={corporateAsrSyncExample} language={language} defaultLanguage="python" />
                </div>
                <DocCallout variant="note" title={t('Not', 'Note')} guideLink="#guide-long-files" guideText={t('Uzun dosyalar kılavuzu →', 'Long files guide →')}>
                  {t('Senkron HTTP istekleri Cloudflare 100 saniye sınırına tabidir; uzun kayıtlar için asenkron iş kuyruğu kullanın.', 'Synchronous requests are subject to Cloudflare 100s timeout. Use asynchronous job queue for long recordings.')}
                </DocCallout>
              </div>
            </div>

            {/* Webhooks */}
            <div id="corporate-webhooks" className="api-v2-corporate-service api-v2-nav-target">
              <SectionIntro
                headingLevel="h3"
                title={t('Webhook Bildirimleri', 'Webhook Notifications')}
                description={t("Polling yapmak yerine, ASR işi tamamlandığında veya başarısız olduğunda Konuşmatik'in HTTPS adresinize imzalı bir olay göndermesini sağlayın.", 'Instead of polling, have Konuşmatik send a signed event to your HTTPS URL when an ASR job completes or fails.')}
              />
              <div className="api-endpoint-card">
                <div className="api-v2-subsection">
                  <h3>{t('Uç Nokta Yönetimi', 'Endpoint Management')}</h3>
                  <div className="api-v2-table-wrap">
                    <table className="api-v2-table">
                      <thead><tr><th>{t('Metod', 'Method')}</th><th>{t('Yol', 'Path')}</th><th>{t('Açıklama', 'Description')}</th></tr></thead>
                      <tbody>
                        {webhookEndpointsTable.map((row) => (
                          <tr key={`${row.method}-${row.path}`}>
                            <td><span className={`api-http-method ${row.method.toLowerCase()}`}>{row.method}</span></td>
                            <td><code>{row.path}</code></td>
                            <td>{local(row, 'desc')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p>{t('İşe bağlamak için ASR iş oluştururken webhook_id gönderin. Uç nokta HTTPS olmalıdır; özel ağ adresleri reddedilir ve yönlendirmeler (redirect) takip edilmez.', 'Pass webhook_id when creating an ASR job to attach it. The endpoint must be HTTPS; private network addresses are rejected and redirects are not followed.')}</p>
                  <CodeConsole examples={webhookManagementExample} language={language} defaultLanguage="python" />
                </div>

                <div className="api-v2-subsection">
                  <h3>{t('Olay Türleri ve Gövde', 'Event Types & Payload')}</h3>
                  <p>{t('Desteklenen olaylar: asr.job.completed ve asr.job.failed. Her istek POST + application/json olarak gelir.', 'Supported events: asr.job.completed and asr.job.failed. Each request is a POST with application/json.')}</p>
                  <CodeConsole examples={webhookEventExamples} language={language} defaultLanguage="completed" />
                  <div className="api-v2-table-wrap">
                    <table className="api-v2-table">
                      <thead><tr><th>{t('Hata Kodu', 'Error Code')}</th><th>{t('Açıklama', 'Description')}</th></tr></thead>
                      <tbody>{webhookErrorCodes.map((row) => <tr key={row.code}><td><code>{row.code}</code></td><td>{local(row, 'desc')}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>

                <div className="api-v2-subsection">
                  <h3>{t('İstek Başlıkları ve İmza Doğrulama', 'Headers & Signature Verification')}</h3>
                  <p>{t('İmza, HMAC_SHA256(secret, "{timestamp}." + ham_gövde) değerinin hex karşılığıdır. İmzayı ham gövde üzerinden, sabit zamanlı karşılaştırmayla doğrulayın ve 5 dakikadan eski zaman damgalarını reddedin.', 'The signature is the hex of HMAC_SHA256(secret, "{timestamp}." + raw_body). Verify it over the raw body with a constant-time comparison and reject timestamps older than 5 minutes.')}</p>
                  <div className="api-v2-table-wrap">
                    <table className="api-v2-table">
                      <thead><tr><th>{t('Başlık', 'Header')}</th><th>{t('Örnek', 'Example')}</th><th>{t('Açıklama', 'Description')}</th></tr></thead>
                      <tbody>{webhookHeadersTable.map((row) => <tr key={row.name}><td><code>{row.name}</code></td><td><code>{row.value}</code></td><td>{local(row, 'desc')}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <CodeConsole examples={webhookVerifyExample} language={language} defaultLanguage="python" />
                </div>

                <div className="api-v2-subsection">
                  <h3>{t('Yeniden Deneme Politikası', 'Retry Policy')}</h3>
                  <p>{t('2xx yanıtı başarılı sayılır. 408, 429 ve 5xx yanıtları ile ağ hataları toplam 6 denemeye kadar üstel bekleme ile tekrarlanır; diğer 4xx yanıtlar kalıcı hata sayılır ve tekrar denenmez. Başarısız teslimatlar deliveries kaydında dead_letter durumuna geçer. Yanıtınızı 10 saniye içinde döndürün.', '2xx is success. 408, 429, 5xx and network errors are retried with exponential backoff up to 6 attempts total; other 4xx responses are permanent failures and are not retried. Failed deliveries move to dead_letter in the deliveries log. Respond within 10 seconds.')}</p>
                  <div className="api-v2-table-wrap">
                    <table className="api-v2-table">
                      <thead><tr><th>{t('Deneme', 'Attempt')}</th><th>{t('Bekleme', 'Delay')}</th></tr></thead>
                      <tbody>{webhookRetrySchedule.map((row) => <tr key={row.attempt}><td><code>{row.attempt}</code></td><td>{local(row, 'delay')}</td></tr>)}</tbody>
                    </table>
                  </div>
                </div>

                <DocCallout variant="warning" title={t('Önemli', 'Important')}>
                  {t('Uç nokta HTTPS olmalı, yanıt 10 saniye içinde dönmeli ve imzalar sabit zamanlı karşılaştırmayla doğrulanmalıdır.', 'Endpoint must be HTTPS, respond within 10 seconds, and signatures verified with constant-time comparison.')}
                </DocCallout>
              </div>
            </div>

            {/* TTS Corporate */}
            <div id="corporate-tts" className="api-v2-corporate-service api-v2-nav-target">
              <SectionIntro
                headingLevel="h3"
                title="Konuşmatik Asenkron TTS"
                description={t(
                  'Yüksek hacimli ve toplu seslendirme işleri için kuyruk tabanlı asenkron TTS.',
                  'Queue-based asynchronous TTS for high-volume and batch speech generation workloads.',
                )}
              />
              <div className="api-endpoint-card">
                <div className="api-v2-corporate-routes">
                  <EndpointHeader method="POST" path="/corporate/tts/jobs" description={t('Toplu asenkron TTS sentez işi oluşturur ve job_id döndürür.', 'Creates an asynchronous TTS job and returns job_id.')} />
                  <EndpointHeader method="GET" path="/corporate/tts/jobs/{id}" description={t('TTS iş durumunu sorgular (pending, processing, completed, failed).', 'Polls TTS job status (pending, processing, completed, failed).')} />
                  <EndpointHeader method="GET" path="/corporate/tts/jobs/{id}/stream" description={t('Üretilen kayıpsız WAV ses akışını indirir.', 'Streams the synthesized lossless WAV audio.')} />
                </div>
                <div className="api-v2-subsection">
                  <h3>{t('Parametreler', 'Parameters')}</h3>
                  <ParametersTable parameters={corporateTtsJobParameters} language={language} t={t} />
                </div>
                <div className="api-endpoint-console-wrap">
                  <h4>{t('İş Oluşturma, Polling ve WAV İndirme', 'Create Job, Polling, and WAV Download')}</h4>
                  <CodeConsole examples={corporateTtsPollingExample} language={language} defaultLanguage="python" />
                </div>
                <DocCallout variant="note" title={t('Not', 'Note')} guideLink="#guide-audio-formats" guideText={t('Ses formatları kılavuzu →', 'Audio formats guide →')}>
                  {t('İşlem arka planda tamamlandıktan sonra üretilen ses tek bir kayıpsız WAV dosyası olarak indirilebilir.', 'After background completion, synthesized audio can be downloaded as a single lossless WAV file.')}
                </DocCallout>
              </div>
            </div>

            {/* Realtime */}
            <div id="realtime-api" className="api-v2-corporate-service api-v2-nav-target">
              <SectionIntro
                headingLevel="h3"
                eyebrow="Canlı Akış (WebSocket)"
                title={t('Yerel Realtime ASR (WebSocket)', 'Native Realtime ASR (WebSocket)')}
                description={t('Doğrudan binary PCM akışı alan yerel /realtime/transcriptions uç noktası.', 'Native binary PCM /realtime/transcriptions live transcription endpoint.')}
              />

              <div className="api-endpoint-card">
                <EndpointHeader method="WSS" path="/realtime/transcriptions" description={t('16 kHz 16-bit mono binary PCM akışı için yerel WebSocket canlı deşifre bağlantısı.', 'Native WebSocket connection for 16 kHz 16-bit mono binary PCM live transcription.')} />

                <div className="api-v2-subsection">
                  <h3>{t('Parametreler (session.start)', 'Parameters (session.start)')}</h3>
                  <ParametersTable parameters={nativeRealtimeParameters} language={language} t={t} />
                </div>

                <div className="api-v2-subsection">
                  <h3>{t('Olaylar', 'Events')}</h3>
                  <div className="api-v2-table-wrap">
                    <table className="api-v2-table api-v2-events-table">
                      <thead><tr><th>{t('Yön', 'Direction')}</th><th>{t('Olay (Event)', 'Event')}</th><th>{t('Açıklama', 'Description')}</th></tr></thead>
                      <tbody>{nativeRealtimeEventTable.map((row) => <tr key={`${row.dir}-${row.event}`}><td>{local(row, 'dir')}</td><td><code>{row.event}</code></td><td>{local(row, 'desc')}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <div style={{ marginTop: '8px' }}><a href="#realtime-errors" className="api-doc-callout-link">{t('Realtime hata kodları listesi →', 'Realtime error codes list →')}</a></div>
                </div>

                <div className="api-endpoint-console-wrap">
                  <h4>{t('Yerel Uç Nokta Python Örneği', 'Native Endpoint Python Example')}</h4>
                  <CodeConsole examples={nativeRealtimeCodeExamples} language={language} defaultLanguage="python" />
                </div>

                <DocCallout variant="warning" title={t('Önemli', 'Important')} guideLink="#guide-realtime-turns" guideText={t('Söz sırası ve VAD kılavuzu →', 'Realtime turns & VAD guide →')}>
                  {t('konusmatik-asr-v2 için servis genelinde en fazla 3 eşzamanlı oturum desteklenir. 60 saniye ses gelmediğinde oturum otomatik kapanır (idle_timeout).', 'Allows at most 3 concurrent sessions (service-wide) for konusmatik-asr-v2. Closes after 60s without audio (idle_timeout).')}
                </DocCallout>
              </div>
            </div>
          </section>

          {/* KILAVUZLAR */}
          <section id="guides" className="api-section">
            <SectionIntro
              eyebrow={t('Teknik Kılavuzlar', 'Technical Guides')}
              title={t('Kılavuzlar', 'Guides')}
              description={t('Ses formatları, uzun dosyalar ve gerçek zamanlı söz sırası yönetimi hakkında teknik ayrıntılar.', 'Technical details on audio formats, long file handling, and realtime turn management.')}
            />

            <article id="guide-audio-formats" className="api-v2-guide-card">
              <h3>{t('Ses Formatları ve Akış Mimarisi', 'Audio Formats & Streaming Architecture')}</h3>
              <p>{t(
                'Konuşmatik varsayılan ses formatı wav olup 48 kHz / 16-bit / mono kalitesinde kayıpsız ses döner. OpenAI varsayılanı mp3 formatıdır; mp3 almak için response_format="mp3" parametresi açıkça gönderilmelidir. Desteklenen tüm formatlar ve MIME türleri: wav (audio/wav), mp3 (audio/mpeg), opus (audio/ogg), aac (audio/aac), flac (audio/flac) ve pcm (audio/pcm - yalnızca streaming).',
                'Konuşmatik default audio format is wav (48 kHz / 16-bit / mono lossless). OpenAI default is mp3; specify response_format="mp3" explicitly to obtain mp3 output. Supported formats and MIME types: wav (audio/wav), mp3 (audio/mpeg), opus (audio/ogg), aac (audio/aac), flac (audio/flac), and pcm (audio/pcm - streaming only).'
              )}</p>
              <div className="api-v2-table-wrap" style={{ margin: '16px 0' }}>
                <table className="api-v2-table">
                  <thead>
                    <tr>
                      <th>{t('Format', 'Format')}</th>
                      <th>{t('İçerik Türü (MIME)', 'Content-Type')}</th>
                      <th>{t('Varsayılan / Kullanım', 'Default / Usage')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td><code>wav</code></td><td><code>audio/wav</code></td><td>{t('Varsayılan format (48 kHz / 16-bit / mono)', 'Default format (48 kHz / 16-bit / mono)')}</td></tr>
                    <tr><td><code>mp3</code></td><td><code>audio/mpeg</code></td><td>{t('Sıkıştırılmış ses (OpenAI varsayılanı)', 'Compressed audio (OpenAI default)')}</td></tr>
                    <tr><td><code>opus</code></td><td><code>audio/ogg</code></td><td>{t('Opus codec, Ogg kapsayıcısında', 'Opus codec in an Ogg container')}</td></tr>
                    <tr><td><code>aac</code></td><td><code>audio/aac</code></td><td>{t('AAC (Advanced Audio Coding)', 'AAC (Advanced Audio Coding)')}</td></tr>
                    <tr><td><code>flac</code></td><td><code>audio/flac</code></td><td>{t('Kayıpsız sıkıştırılmış ses', 'Lossless compressed audio')}</td></tr>
                    <tr><td><code>pcm</code></td><td><code>audio/pcm</code></td><td>{t('Streaming PCM (speed uygulanmaz)', 'Streaming PCM (speed not applied)')}</td></tr>
                  </tbody>
                </table>
              </div>
              <p>{t(
                'Konuşma hızı çarpanı (speed: 0.25–4.0, varsayılan 1.0) wav, mp3, opus, aac ve flac formatlarında uygulanır; pcm streaming akışında uygulanmaz (normal hızda akar). PCM streaming yanıt başlıkları Content-Type: audio/pcm, X-Audio-Sample-Rate: 48000, X-Audio-Channels: 1, X-Audio-Format: pcm_s16le içerir. Format dönüştürme kapasitesi dolduğunda 503 transcode_capacity ve Retry-After dönebilir (bu durumda faturalandırma yapılmaz). TTS kapasitesi dolduğunda ise 429 tts_capacity_saturated ve Retry-After döner.',
                'Speed multiplier (speed: 0.25–4.0, default 1.0) applies to wav, mp3, opus, aac, and flac; not applied for pcm streaming (flows at normal speed). PCM streaming response headers include Content-Type: audio/pcm, X-Audio-Sample-Rate: 48000, X-Audio-Channels: 1, X-Audio-Format: pcm_s16le. When transcode capacity saturates, 503 transcode_capacity with Retry-After is returned (no billing occurs). When TTS capacity is full, 429 tts_capacity_saturated with Retry-After is returned.'
              )}</p>
            </article>

            <article id="guide-long-files" className="api-v2-guide-card">
              <h3>{t('Uzun Dosyalar ve Hızlı İşleme', 'Long Files & Fast Processing')}</h3>
              <p>{t(
                'Hız İpucu (16 kHz Mono Dönüştürme): Ses dosyasını yüklemeden önce 16 kHz mono formatına dönüştürmek işlem süresini belirgin biçimde kısaltır (uzun kayıtlarda %47 hızlanma ölçülmüştür):',
                'Speed Tip (16 kHz Mono Pre-conversion): Converting audio to 16 kHz mono before upload noticeably shortens processing time (a 47% speedup was measured on long recordings):'
              )}</p>
              <div className="api-console" style={{ margin: '12px 0' }}>
                <div className="api-console-head">
                  <span className="api-console-label">FFmpeg</span>
                  <CopyButton textToCopy={asrSpeedTip.command} language={language} />
                </div>
                <pre data-no-translate="true"><code data-no-translate="true">{asrSpeedTip.command}</code></pre>
              </div>
              <p>{t(
                'Dosya ve Süre Sınırları: Senkron ASR için maksimum dosya boyutu 100 MB ve maksimum süre 3 saat (10.800 saniye). Sınırlar aşıldığında HTTP 413 file_too_large hatası döner.',
                'File & Duration Limits: For synchronous ASR, maximum file size is 100 MB and maximum duration is 3 hours (10,800s). Exceeding limits returns HTTP 413 file_too_large.'
              )}</p>
              <p>{local(asrLongFilesNote, 'desc')}</p>
              <p>{t(
                'Asenkron ASR işlerinde dosya yüklemek yerine HTTPS audio_url gönderilebilir (HTTP 202 Accepted). Sonuç alırken timestamp_granularities[] ile segment ve/veya word seçildiğinde çıktı metinle birlikte srt ve vtt altyazılarını da içerir.',
                'In async ASR jobs, an HTTPS audio_url can be sent instead of uploading (HTTP 202 Accepted). When retrieving results with timestamp_granularities[] (segment and/or word), the output includes text along with srt and vtt subtitles.'
              )}</p>
            </article>

            <article id="guide-realtime-turns" className="api-v2-guide-card">
              <h3>{t('Gerçek Zamanlı Söz Sırası ve VAD Yönetimi', 'Realtime Turn & VAD Management')}</h3>
              <p>{t(
                'Konuşmatik canlı deşifre için iki WebSocket uç noktası sunar: OpenAI SDK uyumlu /realtime (yalnızca konusmatik-asr-v1) ve yerel binary PCM akışı alan /realtime/transcriptions (v1 ve v2).',
                'Konuşmatik provides two WebSocket endpoints for live transcription: OpenAI SDK-compatible /realtime (only konusmatik-asr-v1) and native binary PCM /realtime/transcriptions (v1 and v2).'
              )}</p>
              <div className="api-v2-table-wrap" style={{ margin: '16px 0' }}>
                <table className="api-v2-table">
                  <thead>
                    <tr>
                      <th>{t('Özellik', 'Feature')}</th>
                      <th>{t('OpenAI Uyumlu Realtime', 'OpenAI-Compatible Realtime')}</th>
                      <th>{t('Yerel Realtime (Native)', 'Native Realtime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realtimeComparisonTable.map((row) => (
                      <tr key={row.feature}>
                        <td><strong>{language === 'en' ? row.featureEn : row.feature}</strong></td>
                        <td><code>{row.openai}</code></td>
                        <td><code>{row.native}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h4>{t('Yerel Realtime Oturum Akışı', 'Native Realtime Session Sequence')}</h4>
              <ol className="api-v2-sequence-list">
                <li>{t('Authorization: Bearer başlığı ile WebSocket bağlantısı kurulur.', 'Establish WebSocket connection with Authorization: Bearer header.')}</li>
                <li>{t('İstemci oturum parametrelerini içeren session.start mesajını gönderir.', 'Client sends session.start with session parameters.')}</li>
                <li>{t('Sunucu oturumun hazır olduğunu session.ready ile doğrular.', 'Server confirms session readiness with session.ready.')}</li>
                <li>{t('İstemci 16 kHz 16-bit mono binary PCM ses çerçeveleri iletir (ara sonuçlar transcript.partial ile döner).', 'Client streams 16 kHz 16-bit mono binary PCM frames (deltas returned via transcript.partial).')}</li>
                <li>{t('İstemci oturumu sonlandırmak için session.stop mesajı gönderir.', 'Client sends session.stop to conclude the session.')}</li>
                <li>{t('Sunucu nihai transcript.final, oturum özeti session.stats ve kapanış session.closed olaylarını iletir.', 'Server returns final transcript.final, session.stats summary, and session.closed.')}</li>
              </ol>
              <p>{t(
                'Sunucu VAD ve Cümle Birleştirme: turn_detection: {"type":"server_vad","silence_duration_ms":750,"prefix_padding_ms":300}. Parametre aralıkları: silence_duration_ms 200–3000 (varsayılan 750), prefix_padding_ms 0–1000 (varsayılan 300); threshold kabul edilir ancak uygulanmaz. Kısa duraklamalarda tek bir konuşma cümlesi birden fazla completed olayına bölünebilir (ölçümlerde ortalama ~1.3 completed). Önerilen yaklaşım: completed metinlerini toplayın ve son parçadan sonra 0.5–0.7 saniye yeni bir completed gelmezse cümleyi tamamlandı kabul edin. Alternatif olarak silence_duration_ms değerini 1000–1200 ms aralığına yükseltebilirsiniz.',
                'Server-side VAD & Utterance Merging: turn_detection: {"type":"server_vad","silence_duration_ms":750,"prefix_padding_ms":300}. Parameter ranges: silence_duration_ms 200–3000 (default 750), prefix_padding_ms 0–1000 (default 300); threshold is accepted but not applied. A single utterance may arrive as several completed events (averaging ~1.3 per utterance). Recommended merge strategy: collect completed texts; if no new completed arrives for 0.5–0.7 s after the last one, treat the utterance as finished. Alternatively, increase silence_duration_ms to 1000–1200 ms.'
              )}</p>
              <p>{t(
                'İstemci kontrollü bitirme (turn_detection: null): session.update (veya transcription_session.update) ile turn_detection: null gönderildiğinde sunucu söz sırasını kendiliğinden bitirmez ve hiçbir speech_started veya speech_stopped olayı gönderilmez; tüm ses motora iletilir. Cümle bitiminde input_audio_buffer.commit gönderildiğinde input_audio_buffer.committed ve tek bir completed döner. Bağlantı açık kalır ve sonraki ses yeni bir öğe olarak işlenir. Boş tamponda commit çağrısı yapılırsa input_audio_buffer_commit_empty hatası döner.',
                'Client-controlled ending (turn_detection: null): when turn_detection: null is passed via session.update (or transcription_session.update), the server never ends a turn by itself and no speech_started or speech_stopped events are sent; all audio goes to the engine. At the end of an utterance, send input_audio_buffer.commit to receive input_audio_buffer.committed and one completed event. The connection stays open, and the next audio is treated as a new item. Committing on an empty buffer triggers input_audio_buffer_commit_empty.'
              )}</p>
              <p>{t(
                'Giriş ses formatı: session.audio.input.format = {"type": "audio/pcm", "rate": 16000}. 16 kHz formatında gönderilen sesler yeniden örneklenmeden doğrudan işlenir. 16000, 24000 (varsayılan), 44100 ve 48000 Hz hızları desteklenir. Yerel uç noktada (/realtime/transcriptions) istemci VAD için en az 1000 ms sessizlik süresi önerilir (600 ms cümle içi duraklamalarda erken kesilmelere sebep olabilir).',
                'Input audio format: session.audio.input.format = {"type": "audio/pcm", "rate": 16000}. 16 kHz audio is processed directly without resampling. 16000, 24000 (default), 44100, and 48000 Hz are supported. On the native endpoint (/realtime/transcriptions), client VAD silence timeout of 1000 ms or longer is recommended (600 ms cuts sentences at natural pauses).'
              )}</p>
            </article>
          </section>

          {/* 8. KAPASİTE VE LİMİTLER */}
          <section id="capacity" className="api-section">
            <SectionIntro
              eyebrow={t('Kapasite Yönetimi', 'Capacity Management')}
              title={t('Kapasite, Eşzamanlılık ve Hız Sınırları', 'Capacity, Concurrency & Rate Limits')}
              description={t('Konuşmatik altyapısı üç bağımsız koruma katmanıyla donanım kararlılığını garanti altına alır.', 'Konuşmatik applies three independent layers to guarantee hardware stability.')}
            />

            <div className="api-v2-quick-grid" style={{ marginBottom: '24px' }}>
              <article className="api-v2-quick-card">
                <span>01</span>
                <h3>{t('Rate Limit (İstek Hızı)', 'Rate Limit')}</h3>
                <p>{t('Belirli bir zaman aralığında (60s) gönderilebilecek maksimum HTTP istek sayısıdır.', 'Maximum HTTP requests allowed within a 60-second window.')}</p>
              </article>
              <article className="api-v2-quick-card">
                <span>02</span>
                <h3>{t('Outstanding (Açık İşler)', 'Outstanding Jobs')}</h3>
                <p>{t('Henüz tamamlanmamış (pending + processing) kuyrukta bekleyen toplam iş tavanıdır.', 'Maximum pending or processing jobs allowed concurrently in queue.')}</p>
              </article>
              <article className="api-v2-quick-card">
                <span>03</span>
                <h3>{t('Active GPU (Aktif İnference)', 'Active GPU Inference')}</h3>
                <p>{t('Donanım/GPU üzerinde aynı anda çalışan gerçek yapay zeka çıkarım limitidir (ASR: 14, TTS: 32).', 'Maximum number of AI inference jobs that can run concurrently on the available GPUs (ASR: 14, TTS: 32).')}</p>
              </article>
            </div>

            <div className="api-v2-table-wrap">
              <table className="api-v2-table">
                <thead>
                  <tr>
                    <th>{t('Paket / Katman', 'Tier / Layer')}</th>
                    <th>{t('İş Yükü', 'Workload')}</th>
                    <th>{t('Hesap Başına Açık İş', 'Outstanding / Account')}</th>
                    <th>{t('Aktif GPU İnference', 'Concurrent GPU Inference')}</th>
                    <th>{t('İstek Limiti', 'Rate Limit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {capacityTableData.map((row) => (
                    <tr key={`${row.tier}-${row.workload}`}>
                      <td><strong>{local(row, 'tier')}</strong></td>
                      <td>{local(row, 'workload')}</td>
                      <td><code>{local(row, 'outstanding')}</code></td>
                      <td><code>{local(row, 'active')}</code></td>
                      <td><code>{local(row, 'rate')}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 9. HTTP 429 VE HATA YÖNETİMİ */}
          <section id="errors" className="api-section">
            <SectionIntro
              eyebrow="Dayanıklılık"
              title={t('HTTP 429 & Hata Yönetimi', 'HTTP 429 & Error Handling')}
              description={t('Kapasite dolduğunda deterministik HTTP 429 Too Many Requests ve Retry-After başlığı döner.', 'When capacity saturates, the API returns deterministic HTTP 429 Too Many Requests with Retry-After.')}
            />

            <div className="api-endpoint-card">
              <div className="api-endpoint-details">
                <h3>{t('Standart OpenAI Hata Yanıt Yapısı', 'Standard OpenAI Error Object')}</h3>
                <p>{t(
                  'Tüm OpenAI uyumlu uç noktalar standart OpenAI hata objesini döndürür: {"error": {"message": "...", "type": "...", "param": "...", "code": "..."}}. WebSocket bağlantılarında ise {"type":"error","error":{"type","code","message","param"}} hata yapısı döner. Örnek hata kodları: invalid_value (param = tam alan yolu / exact field path), invalid_base64, input_audio_buffer_commit_empty, model_mismatch, realtime_engine_unsupported, quota_exceeded, idle_timeout.',
                  'All OpenAI-compatible endpoints return the standard OpenAI error format: {"error": {"message": "...", "type": "...", "param": "...", "code": "..."}}. WebSocket streams return {"type":"error","error":{"type","code","message","param"}}. Example codes: invalid_value (param = exact field path), invalid_base64, input_audio_buffer_commit_empty, model_mismatch, realtime_engine_unsupported, quota_exceeded, idle_timeout.'
                )}</p>
                <h3 style={{ marginTop: '16px' }}>{t('Retry-After Başlığı ile Yeniden Deneme', 'Client Retry with Retry-After Header')}</h3>
                <p>{t('Kapasite aşımlarında (asr_capacity_saturated, tts_capacity_saturated) veya servis meşguliyetinde (503 transcode_capacity) sunucunun belirttiği Retry-After süresi kadar bekleyerek yeniden deneyin:', 'When capacity saturates (asr_capacity_saturated, tts_capacity_saturated) or format transcoding is full (503 transcode_capacity), wait for the seconds specified in the Retry-After header:')}</p>
              </div>
              <div className="api-endpoint-console-wrap">
                <CodeConsole examples={retryWithBackoffExample} language={language} defaultLanguage="python" />
              </div>
            </div>

            <div id="realtime-errors" className="api-v2-subsection" style={{ marginTop: '24px' }}>
              <h3>{t('Realtime Hata Kodları', 'Realtime Error Codes')}</h3>
              <div className="api-v2-table-wrap">
                <table className="api-v2-table">
                  <thead>
                    <tr>
                      <th>{t('Hata Kodu', 'Error Code')}</th>
                      <th>{t('Açıklama / Anlam', 'Meaning / Description')}</th>
                      <th>{t('Bağlantı Durumu', 'Connection Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {realtimeErrorCodesTable.map((row) => (
                      <tr key={row.code}>
                        <td><code>{row.code}</code></td>
                        <td>{language === 'en' ? row.meaningEn : row.meaning}</td>
                        <td>{language === 'en' ? row.connEn : row.conn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="api-v2-table-wrap api-v2-raised-table" style={{ marginTop: '24px' }}>
              <table className="api-v2-table api-errors-table">
                <thead>
                  <tr>
                    <th>{t('HTTP Durumu', 'HTTP Status')}</th>
                    <th>{t('Hata Türü / Kodu', 'Error Type / Code')}</th>
                    <th>{t('Açıklama', 'Description')}</th>
                  </tr>
                </thead>
                <tbody>
                  {errorStatusTable.map((error) => (
                    <tr key={error.code}>
                      <td className="api-error-status-col"><strong>{error.code}</strong></td>
                      <td><code>{error.type}</code></td>
                      <td>{local(error, 'desc')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA BANNER */}
          <section ref={ctaRef} className="corp-cta-card api-cta-banner">
            <div className="corp-cta-copy">
              <h2>{t('Konuşmatik API ile geliştirmeye başlayın.', 'Start building with the Konuşmatik API.')}</h2>
              <p>{t('Profilinizden API anahtarınızı oluşturun; TTS, ASR ve Realtime servislerini uygulamanıza entegre edin.', 'Create an API key from your profile and integrate TTS, ASR, and Realtime services into your application.')}</p>
              <div className="corp-cta-actions">
                <button type="button" className="corp-btn-primary" onClick={() => onNavigate?.('profile')}>{t('API Anahtarı Oluştur', 'Create API Key')}</button>
                <button type="button" className="corp-btn-secondary" onClick={openEnterpriseContact}>{t('İletişime Geçin', 'Contact Us')}</button>
                <button type="button" className="corp-btn-secondary" onClick={() => onNavigate?.('contact')}>{t('Teknik Destek', 'Technical Support')}</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
