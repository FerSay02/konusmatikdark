import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './ApiDocs.theme.css';
import { createPortal } from 'react-dom';
import { readStoredLanguage } from '../lib/language';
import StudioHero from '../components/StudioHero';
import { apiHeroContent, apiSteps } from '../data/studioContent';
import {
  API_BASE_REALTIME_WS,
  API_BASE_REST,
  asrCodeExamples,
  asrParameters,
  asrSupportedFormats,
  capacityTableData,
  corporateAsrPollingExample,
  corporateTtsPollingExample,
  errorStatusTable,
  modelsCodeExamples,
  modelsData,
  openAiRealtimeCodeExamples,
  quickStartSteps,
  realtimeAudioSpec,
  realtimeCodeExamples,
  realtimeEventTable,
  retryWithBackoffExample,
  sdkSetupExamples,
  streamingTtsCodeExamples,
  streamingTtsResponseHeaders,
  streamingTtsSpecs,
  ttsCodeExamples,
  ttsParameters,
  ttsVoicesData,
} from '../data/apiDocsV2';

const codeLanguageLabels = {
  curl: 'cURL',
  python: 'Python',
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
  const keys = ['python', 'curl'].filter((key) => examples[key]);
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
    <div id={id} className="api-v2-endpoint-head">
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
            <th>{t('Varsayılan', 'Default')}</th>
            <th>{t('Açıklama', 'Description')}</th>
          </tr>
        </thead>
        <tbody>
          {parameters.map((parameter) => (
            <tr key={parameter.name}>
              <td><code>{parameter.name}</code></td>
              <td><code>{parameter.type}</code></td>
              <td><span className={`api-required-badge ${parameter.required ? 'yes' : 'no'}`}>{parameter.required ? t('Evet', 'Yes') : t('Hayır', 'No')}</span></td>
              <td><code>{parameter.defaultVal}</code></td>
              <td>{language === 'en' ? parameter.descEn : parameter.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MiniSpecGrid({ items, language }) {
  return (
    <dl className="api-v2-spec-grid">
      {items.map((item) => (
        <div key={`${item.title || item.label}-${item.value}`}>
          <dt>{language === 'en' ? item.titleEn || item.labelEn : item.title || item.label}</dt>
          <dd>
            <strong>{language === 'en' ? item.valueEn || item.value : item.value}</strong>
            {item.detail && <p>{language === 'en' ? item.detailEn : item.detail}</p>}
          </dd>
        </div>
      ))}
    </dl>
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
  const [navPlacement, setNavPlacement] = useState({ mode: 'static', left: 0, top: 96 });
  const [activeSection, setActiveSection] = useState('quick-start');

  useEffect(() => {
    const updatePageNavigation = () => {
      if (window.innerWidth > 900) {
        const sidebarRect = sidebarRef.current?.getBoundingClientRect();
        const ctaBottom = ctaRef.current?.getBoundingClientRect().bottom;
        const navHeight = navRef.current?.offsetHeight ?? 0;
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
      if (navBottom == null || ctaBottom == null || ctaBottom > 96 + (navRef.current?.offsetHeight ?? 0)) return;

      const difference = ctaBottom - navBottom;
      if (Math.abs(difference) > 0.25) {
        setNavPlacement((current) => ({ ...current, top: current.top + difference }));
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, [navPlacement]);

  const openEnterprisePricing = () => {
    try {
      sessionStorage.setItem('konusmatik_pricing_audience', 'enterprise');
    } catch {
      // The page can still navigate when storage is unavailable.
    }
    onNavigate?.('pricing');
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
        ['corporate-tts', 'Konuşmatik Asenkron TTS'],
        ['realtime-api', t('Konuşmatik Asenkron Realtime ASR', 'Konuşmatik Async Realtime ASR')],
      ],
    },
    {
      items: [
        ['capacity', t('Limitler', 'Limits')],
        ['errors', t('Hatalar', 'Errors')],
      ],
    },
  ];

  const pageNavigation = (
    <nav
      ref={navRef}
      className={`api-v2-nav ${navPlacement.mode === 'fixed' ? 'is-fixed' : ''}`}
      style={{ '--api-nav-left': `${navPlacement.left}px`, '--api-nav-top': `${navPlacement.top}px` }}
      aria-label={t('API dokümantasyonu bölümleri', 'API documentation sections')}
    >
      {navGroups.map((group, groupIndex) => (
        <div key={group.id || groupIndex} className="api-v2-nav-group">
          {group.label && (
            <a href={`#${group.id}`} className={`api-v2-nav-group-title${activeSection === group.id && group.id !== 'corporate-api' ? ' active' : ''}`}>
              {group.label}
            </a>
          )}
          {group.items.map(([id, label]) => {
            const isActive = activeSection === id || (id === 'corporate-asr' && activeSection === 'corporate-api');
            return (
              <a key={id} href={`#${id}`} className={`${isActive ? 'active ' : ''}${group.label ? 'api-v2-nav-subitem' : ''}`} aria-current={isActive ? 'location' : undefined}>
                {label}
              </a>
            );
          })}
        </div>
      ))}
    </nav>
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
                'Konuşmatik TTS, Türkçe metinleri doğal ve akıcı biçimde seslendirir. Sesin tamamı oluşturulduktan sonra üretilen ses verisi istemciye tek bir kayıpsız WAV dosyası olarak döner. Bu yapı özellikle ses dosyası oluşturma, arşivleme ve tamamlanmış içeriğin sonradan oynatıldığı uygulamalar için uygundur.',
                'Konuşmatik TTS converts Turkish text into natural, fluent speech. After the entire audio output has been generated, it is returned to the client as a single lossless WAV file. It is designed for audio file creation, archiving, and applications that play completed content later.',
              )}
            />
            <div className="api-endpoint-card">
              <EndpointHeader method="POST" path="/audio/speech" description={t('Sesin tamamı üretildikten sonra başarılı yanıt tek bir audio/wav binary içeriği döndürür. (WAV-Only)', 'After the entire audio output has been generated, a successful response returns a single audio/wav binary payload. (WAV-Only)')} />

              <div className="api-v2-subsection">
                <h3>{t('Doğal Türkçe Sesler', 'Native Turkish Voices')}</h3>
                <div className="api-v2-voice-grid">
                  {ttsVoicesData.map((voice) => (
                    <article key={voice.id} className="api-v2-voice-card">
                      <div className="api-v2-voice-head">
                        <h4>{voice.name}</h4>
                      </div>
                      <div className="api-v2-voice-meta">
                        <span>{local(voice, 'gender')}</span>
                        <span>{local(voice, 'style')}</span>
                      </div>
                      <p>{local(voice, 'desc')}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div className="api-v2-subsection">
                <h3>{t('İstek Parametreleri', 'Request Parameters')}</h3>
                <ParametersTable parameters={ttsParameters} language={language} t={t} />
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('Kod Örnekleri', 'Code Examples')}</h4>
                <CodeConsole examples={ttsCodeExamples} language={language} defaultLanguage="python" />
              </div>
            </div>
          </section>

          {/* 4. STREAMING TEXT TO SPEECH (TTS) */}
          <section id="streaming-tts" className="api-section">
            <SectionIntro
              title={t('OpenAI SDK ile Konuşmatik Streaming TTS', 'Konuşmatik Streaming TTS with OpenAI SDK')}
              description={t(
                'Konuşmatik Streaming TTS, sesin tamamının oluşturulmasını beklemeden üretilen ses verisini istemciye aktarmaya başlar. Bu yapı özellikle gerçek zamanlı ses oynatma, sesli asistanlar ve düşük gecikmeli uygulamalar için uygundur.',
                'Konuşmatik Streaming TTS starts transferring generated audio data to the client without waiting for the entire audio output to be completed. It is designed for real-time playback, voice assistants, and low-latency applications.',
              )}
            />

            <div className="api-endpoint-card">
              <EndpointHeader
                method="POST"
                path="/audio/speech"
                description={t('PCM ses verisini parça parça aktarır.', 'Streams PCM audio data incrementally.')}
              />

              <MiniSpecGrid items={streamingTtsSpecs} language={language} />

              <div className="api-endpoint-console-wrap">
                <h4>{t('Python SDK Örneği', 'Python SDK Example')}</h4>
                <CodeConsole examples={streamingTtsCodeExamples} language={language} defaultLanguage="python" />
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>Response Headers</h4>
                <div className="api-console">
                  <div className="api-console-head">
                    <span className="api-console-label">HTTP Headers</span>
                    <CopyButton textToCopy={streamingTtsResponseHeaders} language={language} />
                  </div>
                  <pre data-no-translate="true"><code data-no-translate="true">{streamingTtsResponseHeaders}</code></pre>
                </div>
              </div>

              <div className="api-endpoint-details">
                <h3>{t('Streaming veri sözleşmesi', 'Streaming data contract')}</h3>
                <p>{t(
                  'Ses verileri stream üzerinden parça parça iletilir. Chunk boyutları sabit değildir ve istemci uygulamaları chunk sınırlarına bağlı bir mantık oluşturmamalıdır. Gelen PCM verileri sırasıyla oynatılabilir, kaydedilebilir veya farklı bir ses formatında işlenebilir.',
                  'Audio data is delivered incrementally through the stream. Chunk sizes are not fixed, and client applications must not build logic that depends on chunk boundaries. Incoming PCM data can be played in sequence, saved, or processed into another audio format.',
                )}</p>
              </div>
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
              <EndpointHeader method="POST" path="/audio/transcriptions" description={t('İstek gövdesi multipart/form-data olarak gönderilmelidir.', 'Send the request body as multipart/form-data.')} />

              <div className="api-v2-format-row">
                <strong>{t('Desteklenen formatlar', 'Supported formats')}</strong>
                <div className="api-v2-format-list">
                  {asrSupportedFormats.map((format) => <span key={format}>{format}</span>)}
                </div>
              </div>

              <div className="api-v2-subsection">
                <h3>{t('İstek Parametreleri', 'Request Parameters')}</h3>
                <ParametersTable parameters={asrParameters} language={language} t={t} />
              </div>

              <div className="api-endpoint-console-wrap">
                <h4>{t('Kod Örnekleri', 'Code Examples')}</h4>
                <CodeConsole examples={asrCodeExamples} language={language} defaultLanguage="python" />
              </div>
            </div>
          </section>

          {/* 6. OPENAI SDK REALTIME */}
          <section id="openai-realtime" className="api-section">
            <SectionIntro
              title={t('OpenAI SDK ile Konuşmatik Realtime ASR', 'Konuşmatik Realtime ASR with OpenAI SDK')}
              description={t('AsyncOpenAI istemcisiyle mikrofonunuzdan PCM16 ses gönderin ve canlı deşifre olaylarını doğrudan dinleyin.', 'Stream PCM16 microphone audio with the AsyncOpenAI client and receive live transcription events directly.')}
            />
            <div className="api-endpoint-card">
              <EndpointHeader method="WSS" path="/realtime" description={t('OpenAI Python SDK uyumlu gerçek zamanlı deşifre bağlantısı.', 'OpenAI Python SDK-compatible realtime transcription connection.')} />
              <div className="api-endpoint-console-wrap">
                <h4>{t('Python Örneği', 'Python Example')}</h4>
                <CodeConsole examples={openAiRealtimeCodeExamples} language={language} defaultLanguage="python" />
              </div>
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
                <h4>{t('Kod Örnekleri', 'Code Examples')}</h4>
                <CodeConsole examples={modelsCodeExamples} language={language} defaultLanguage="python" />
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
                  <EndpointHeader id="corporate-create-job" method="POST" path="/corporate/asr/jobs" description={t('Yeni bir ASR işi kuyruğa ekler ve hemen job_id döndürür.', 'Enqueues a new ASR job and returns job_id immediately.')} />
                  <EndpointHeader id="corporate-polling" method="GET" path="/corporate/asr/jobs/{id}" description={t('İş durumunu sorgular (pending, processing, completed, failed).', 'Polls job status.')} />
                  <EndpointHeader id="corporate-result" method="GET" path="/corporate/asr/jobs/{id}/result" description={t('Tamamlanan işin transkripsiyon metnini döndürür.', 'Retrieves final transcribed text.')} />
                </div>
                <div className="api-endpoint-console-wrap">
                  <h4>{t('İş Oluşturma, Polling ve Sonuç Alma', 'Create Job, Polling, and Result')}</h4>
                  <CodeConsole examples={corporateAsrPollingExample} language={language} defaultLanguage="python" />
                </div>
              </div>
            </div>

            {/* TTS Corporate */}
            <div id="corporate-tts" className="api-v2-corporate-service api-v2-nav-target">
              <SectionIntro
                headingLevel="h3"
                title="Konuşmatik Asenkron TTS"
                description={t(
                  'Konuşmatik Asenkron TTS, ses sentezi isteğini kuyruğa alır ve sesin oluşturulmasını beklemeden istemciye bir job_id döner. İşlem arka planda tamamlandıktan sonra durum job_id ile takip edilebilir ve üretilen ses tek bir kayıpsız WAV dosyası olarak indirilebilir. Bu yapı özellikle yüksek hacimli, toplu veya uzun süren ses üretim işleri için uygundur.',
                  'Konuşmatik Async TTS queues the speech synthesis request and returns a job_id without waiting for the audio to be generated. After processing completes in the background, the job can be tracked using its job_id and the generated audio can be downloaded as a single lossless WAV file. It is designed for high-volume, batch, or long-running speech generation workloads.',
                )}
              />
              <div className="api-endpoint-card">
                <div className="api-v2-corporate-routes">
                  <EndpointHeader method="POST" path="/corporate/tts/jobs" description={t('Toplu TTS sentez işi oluşturur.', 'Creates an asynchronous TTS job.')} />
                  <EndpointHeader method="GET" path="/corporate/tts/jobs/{id}" description={t('İş durumunu sorgular.', 'Polls job status.')} />
                  <EndpointHeader method="GET" path="/corporate/tts/jobs/{id}/stream" description={t('Üretilen WAV ses akışını indirir.', 'Streams the synthesized WAV audio.')} />
                </div>
                <div className="api-endpoint-console-wrap">
                  <h4>{t('İş Oluşturma, Polling ve WAV İndirme', 'Create Job, Polling, and WAV Download')}</h4>
                  <CodeConsole examples={corporateTtsPollingExample} language={language} defaultLanguage="python" />
                </div>
              </div>
            </div>

            {/* Realtime */}
            <div id="realtime-api" className="api-v2-corporate-service api-v2-nav-target">
              <SectionIntro
                headingLevel="h3"
                eyebrow="Canlı Akış (WebSocket)"
                title={t('Konuşmatik Asenkron Realtime ASR', 'Konuşmatik Async Realtime ASR')}
                description={t('PCM16 ses akışını WebSocket üzerinden gerçek zamanlı gönderin; sunucu tabanlı VAD ile kelime kelime veya tam cümle transkriptlerini anlık alın.', 'Stream PCM16 audio over WebSocket with server VAD for real-time delta and complete sentence events.')}
              />
              <div className="api-endpoint-card">
                <EndpointHeader method="WSS" path="/realtime" description={API_BASE_REALTIME_WS} />
                <div className="api-v2-subsection">
                  <h3>{t('Ses Akışı Standartları', 'Audio Stream Standards')}</h3>
                  <MiniSpecGrid items={realtimeAudioSpec} language={language} />
                </div>
                <div className="api-v2-table-wrap">
                  <table className="api-v2-table api-v2-events-table">
                    <thead><tr><th>{t('Yön', 'Direction')}</th><th>{t('Olay (Event)', 'Event')}</th><th>{t('Açıklama', 'Description')}</th></tr></thead>
                    <tbody>{realtimeEventTable.map((row) => <tr key={`${row.dir}-${row.event}`}><td>{local(row, 'dir')}</td><td><code>{row.event}</code></td><td>{local(row, 'desc')}</td></tr>)}</tbody>
                  </table>
                </div>
                <div className="api-endpoint-console-wrap">
                  <h4>{t('Canlı Akış Python & cURL Örneği', 'Live Streaming Python & cURL Example')}</h4>
                  <CodeConsole examples={realtimeCodeExamples} language={language} defaultLanguage="python" />
                </div>
              </div>
            </div>
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
                <h3>{t('Retry-After Başlığı ile Yeniden Deneme', 'Client Retry with Retry-After Header')}</h3>
                <p>{t('Kapasite aşımlarında (asr_capacity_saturated, tts_capacity_saturated) sunucunun belirttiği saniye kadar bekleyerek yeniden deneyin:', 'When capacity saturates, wait for the seconds specified in the Retry-After header:')}</p>
              </div>
              <div className="api-endpoint-console-wrap">
                <CodeConsole examples={retryWithBackoffExample} language={language} defaultLanguage="python" />
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
                <button type="button" className="corp-btn-secondary" onClick={openEnterprisePricing}>{t('Kurumsal Paketler', 'Enterprise Plans')}</button>
                <button type="button" className="corp-btn-secondary" onClick={() => onNavigate?.('contact')}>{t('Teknik Destek', 'Technical Support')}</button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
