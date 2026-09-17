import { useEffect, useState } from 'react';
import WebThreads from '../components/WebThreads';
import VoiceModelShowcase from '../components/VoiceModelShowcase';
import SpotlightCard from '../components/SpotlightCard';
import BorderGlow from '../components/BorderGlow';
import StarBorder from '../components/StarBorder';
import ShinyText from '../components/ShinyText';
import '../home-hero-theme.css';
import '../home-light-theme.css';

const GUEST_TTS_MAX_CHARS = 200;

const solutionItems = [
  {
    title: 'Metinden Sese (TTS)',
    titleEn: 'Text to Speech (TTS)',
    description: 'Yazılı metinlerinizi doğal, akıcı ve stüdyo kalitesinde Türkçe ses dosyalarına dönüştürün.',
    descriptionEn: 'Convert your written text into natural, fluent, studio-quality audio.',
    icon: 'speaker',
    action: 'tts',
  },
  {
    title: 'Sesten Metne (ASR)',
    titleEn: 'Speech to Text (ASR)',
    description: 'Toplantı, ders ve medya kayıtlarınızı yüksek doğrulukla yazılı metne çevirip düzenleyin.',
    descriptionEn: 'Convert meeting, lecture, and media recordings into editable text with high accuracy.',
    icon: 'transcript',
    action: 'asr',
  },
  {
    title: 'Eğitim & E-Öğrenme',
    titleEn: 'Education & E-Learning',
    description: 'Ders notları, e-öğrenme modülleri ve sunum metinleri için net seslendirmeler hazırlayın.',
    descriptionEn: 'Create clear voiceovers for lecture notes, e-learning modules, and presentations.',
    icon: 'guide',
    action: 'tts',
  },
  {
    title: 'Web & Blog Seslendirme',
    titleEn: 'Web & Blog Voiceovers',
    description: 'Makaleleri, haber bültenlerini ve sayfa metinlerini dinlenebilir sesli içeriklere çevirin.',
    descriptionEn: 'Turn articles, newsletters, and web copy into listenable audio content.',
    icon: 'web',
    action: 'tts',
  },
  {
    title: 'Video & Altyazı Deşifresi',
    titleEn: 'Video & Subtitle Transcription',
    description: 'Video kayıtlarından okunabilir metin çıkarın, altyazı ve arşiv işlerinizi hızlandırın.',
    descriptionEn: 'Extract readable text from video and speed up subtitle and archive workflows.',
    icon: 'caption',
    action: 'asr',
  },
  {
    title: 'Podcast & Medya Arşivi',
    titleEn: 'Podcast & Media Archive',
    description: 'Uzun ses kayıtlarını aranabilir, paylaşılabilir ve düzenlenebilir metne dönüştürün.',
    descriptionEn: 'Convert long recordings into searchable, shareable, and editable text.',
    icon: 'podcast',
    action: 'asr',
  },
  {
    title: 'Kurumsal Santral & IVR',
    titleEn: 'Enterprise IVR',
    description: 'Markanızın santral karşılamaları, duyuruları ve kampanya metinleri için tutarlı sesler üretin.',
    descriptionEn: 'Create consistent voices for IVR greetings, announcements, and campaign messages.',
    icon: 'briefcase',
    action: 'corporate',
  },
  {
    title: 'Online Dikte & Not Alma',
    titleEn: 'Online Dictation & Notes',
    description: 'Konuşarak anında not alın, toplantı özetlerini ve görüşme detaylarını yazılı hale getirin.',
    descriptionEn: 'Take notes by speaking and turn meeting summaries and interview details into text.',
    icon: 'dictation',
    action: 'asr',
  },
];

function SolutionIcon({ type }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  switch (type) {
    case 'transcript':
      return <svg {...common}><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M8 13h8" /><path d="M8 17h6" /></svg>;
    case 'guide':
      return <svg {...common}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" /><path d="M8 7h7" /><path d="M8 11h5" /></svg>;
    case 'web':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" /></svg>;
    case 'caption':
      return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 11h3" /><path d="M14 11h3" /><path d="M7 15h10" /></svg>;
    case 'podcast':
      return <svg {...common}><path d="M12 3a7 7 0 0 1 7 7" /><path d="M5 10a7 7 0 0 1 7-7" /><path d="M8 14a4 4 0 0 1 8 0" /><circle cx="12" cy="14" r="2" /><path d="M10 21l2-5 2 5" /></svg>;
    case 'briefcase':
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /><path d="M12 12v2" /></svg>;
    case 'dictation':
      return <svg {...common}><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" /><path d="M19 10v1a7 7 0 0 1-14 0v-1" /><path d="M12 18v3" /><path d="M8 21h8" /></svg>;
    case 'speaker':
    default:
      return <svg {...common}><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 8.5a5 5 0 0 1 0 7" /><path d="M18.5 6a9 9 0 0 1 0 12" /></svg>;
  }
}

export default function Home({ onGoTts, onGoAsr, onNavigate, appLanguage }) {
  const language = appLanguage || 'tr';
  const t = (tr, en) => (language === 'en' ? en : tr);
  const [asrFileName, setAsrFileName] = useState('');
  const [asrFile, setAsrFile] = useState(null);
  const [ttsText, setTtsText] = useState('');
  const [homeVoice, setHomeVoice] = useState('woman');
  const [jobName, setJobName] = useState('');
  const [isPageBottom, setIsPageBottom] = useState(false);
  const [isHeroCueVisible, setIsHeroCueVisible] = useState(true);
  const [isScrollOrbVisible, setIsScrollOrbVisible] = useState(false);
  const [isStoryVisible, setIsStoryVisible] = useState(false);
  const [isEfficiencyVisible, setIsEfficiencyVisible] = useState(false);
  const [isSolutionsVisible, setIsSolutionsVisible] = useState(false);

  useEffect(() => {
    let previousScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const bottomDistance = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      setIsPageBottom(bottomDistance < 80);
      setIsScrollOrbVisible(currentScrollY > 40);
      if (currentScrollY <= 12) setIsHeroCueVisible(true);
      else if (currentScrollY > previousScrollY + 2) setIsHeroCueVisible(false);
      else if (currentScrollY < previousScrollY - 2) setIsHeroCueVisible(true);
      previousScrollY = currentScrollY;
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    const sections = [
      ['.home-efficiency', setIsEfficiencyVisible],
      ['.home-solutions', setIsSolutionsVisible],
    ];
    const observers = [];

    sections.forEach(([selector, setVisible]) => {
      const section = document.querySelector(selector);
      if (!section || typeof IntersectionObserver === 'undefined') {
        section?.classList.add('is-visible');
        return;
      }

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      }, { threshold: 0.14 });
      observer.observe(section);
      observers.push(observer);
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  useEffect(() => {
    const storySection = document.querySelector('.home-story');
    if (!storySection || typeof IntersectionObserver === 'undefined') {
      storySection?.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsStoryVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.18 });

    observer.observe(storySection);
    return () => observer.disconnect();
  }, []);

  const handleAsrFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAsrFile(file);
    setAsrFileName(file.name);
  };

  const goToTts = () => {
    const prefill = {
      voiceId: homeVoice,
      text: ttsText.slice(0, GUEST_TTS_MAX_CHARS),
      format: 'mp3',
    };
    if (typeof onGoTts === 'function') onGoTts(prefill);
  };

  const goToAsr = () => {
    const prefill = {
      file: asrFile,
      fileName: asrFileName,
      jobName,
    };
    if (typeof onGoAsr === 'function') onGoAsr(prefill);
  };

  const scrollToNextSection = () => {
    if (isPageBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sections = Array.from(document.querySelectorAll('.home-container > .banner, .home-container > section'));
    const currentY = window.scrollY + 120;
    const nextSection = sections.find((section) => section.offsetTop > currentY);
    const targetTop = nextSection?.offsetTop ?? document.documentElement.scrollHeight;
    window.scrollTo({ top: Math.max(targetTop - 78, 0), behavior: 'smooth' });
  };

  const scrollToStudioActions = () => {
    setIsHeroCueVisible(false);
    document.getElementById('home-studio-actions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="home-container">
      <div className="banner home-banner-split">
        <div className="home-web-threads" aria-hidden="true">
          <WebThreads
            color1="#d21784"
            color2="#280781"
            color3="#280781"
            speed={0.25}
            threadCount={8}
            frequency={8}
            spread={0.18}
            taper={0.5}
            position={0.55}
            fanMode="center"
            glow={0.02}
            falloff={0.63}
            thickness={1.1}
            brightness={0.6}
            opacity={0.8}
            mirror={true}
            shimmer={false}
            grain={true}
            grainIntensity={0.05}
            mouseInteraction
            mouseStrength={0.3}
          />
        </div>

        <div className="banner-content split-top">
          <div className="banner-col split-headline">
            <h1><ShinyText text={t('Konuşmatik', 'Konusmatik')} speed={7} delay={2} color="var(--hero-title-start)" shineColor="#d21784" spread={120} direction="left" yoyo={false} pauseOnHover={false} /></h1>
            <p>{t('Seslendirme ve deşifre işlerinizi bulutta kullanın; kurumlar için aynı altyapıyı local sistem olarak da konumlandırın.', 'Use text-to-speech and transcription in the cloud, or deploy the same infrastructure locally for your organization.')}</p>
          </div>
          <button type="button" className={`home-hero-scroll-cue ${isHeroCueVisible ? 'is-visible' : 'is-hidden'}`} onClick={scrollToStudioActions} aria-label={t('Çalışma alanını keşfet', 'Explore the workspace')}>
            <span className="home-hero-scroll-cue-icon"><i /><b /></span>
            <span className="home-hero-scroll-cue-label">{t('Keşfet', 'Explore')}</span>
          </button>
        </div>

      </div>

      <section id="home-studio-actions" className="split-cards home-workspace-section" aria-label={t('Seslendirme ve Deşifre hızlı işlemleri', 'Text-to-speech and transcription quick actions')}>
          <div className="home-workspace-heading">
            <span>{t('Çalışma alanınızı seçin', 'Choose your workspace')}</span>
            <h2>{t('Ses ve metin işlemlerinize hemen başlayın.', 'Start your audio and text workflows instantly.')}</h2>
          </div>
          <div className="split-cards-grid">
            <BorderGlow className="workspace-border-glow" edgeSensitivity={30} glowColor="40 80 80" backgroundColor="#120F17" borderRadius={28} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#c084fc', '#f472b6', '#38bdf8']}>
            <SpotlightCard className="workspace-spotlight-card" spotlightColor="rgba(108, 60, 233, 0.34)">
            <div className="action-card split-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div className="split-card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>{t('Seslendirme', 'Text to Speech')}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{t('Metninizi kadın veya erkek sesle doğal şekilde seslendirin.', 'Create natural speech from your text with a female or male voice.')}</p>
              </div>

              <div className="home-voice-row" role="group" aria-label={t('Ses tipi seçimi', 'Voice type selection')} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: 0 }}>
                <button
                  type="button"
                  className={`home-voice-chip ${homeVoice === 'woman' ? 'active' : ''}`}
                  onClick={() => setHomeVoice('woman')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', borderRadius: '10px', margin: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none" style={{ color: 'currentColor' }}>
                    <circle cx="16" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M10 11c0-1 1.5-5 6-5s6 4 6 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    <path d="M8 28c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                  </svg>
                  {t('Kadın Ses', 'Female Voice')}
                </button>
                <button
                  type="button"
                  className={`home-voice-chip ${homeVoice === 'man' ? 'active' : ''}`}
                  onClick={() => setHomeVoice('man')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem', borderRadius: '10px', margin: 0 }}
                >
                  <svg width="16" height="16" viewBox="0 0 32 32" fill="none" style={{ color: 'currentColor' }}>
                    <circle cx="16" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M8 28c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <rect x="12" y="5" width="8" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </svg>
                  {t('Erkek Ses', 'Male Voice')}
                </button>
              </div>
              <textarea
                className="tts-textarea"
                placeholder={t('Seslendirmek istediğiniz metni buraya yazın...', 'Write the text you want to voice...')}
                rows="4"
                value={ttsText}
                maxLength={GUEST_TTS_MAX_CHARS}
                onChange={(e) => setTtsText(e.target.value.slice(0, GUEST_TTS_MAX_CHARS))}
              />
              <div className="studio-char-count" style={{ alignSelf: 'flex-end', marginTop: '-0.75rem' }}>
                {ttsText.length.toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')} / {GUEST_TTS_MAX_CHARS.toLocaleString(language === 'en' ? 'en-US' : 'tr-TR')}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button className="tts-btn-download" onClick={goToTts} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px' }}>
                  {t('Seslendirme Ekranına Git', 'Go to Text-to-Speech')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
            </SpotlightCard>
            </BorderGlow>

            <BorderGlow className="workspace-border-glow" edgeSensitivity={30} glowColor="340 80 80" backgroundColor="#120F17" borderRadius={28} glowRadius={40} glowIntensity={1} coneSpread={25} animated={false} colors={['#f472b6', '#c084fc', '#38bdf8']}>
            <SpotlightCard className="workspace-spotlight-card" spotlightColor="rgba(210, 23, 132, 0.34)">
            <div className="action-card split-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div className="split-card-header" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fdf2f8', color: '#E8356D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text)' }}>{t('Deşifre', 'Transcription')}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>{t('Ses dosyanızı yükleyip yüksek doğrulukla metne dönüştürün.', 'Upload an audio file and convert it into text with high accuracy.')}</p>
              </div>

              <div
                className={`asr-drop-zone ${asrFileName ? 'has-file' : ''}`}
                onClick={() => document.getElementById('home-asr-file')?.click()}
                style={{ padding: '1.5rem 1rem', cursor: 'pointer', flexShrink: 0 }}
              >
                {asrFileName ? (
                  <div className="asr-file-info" style={{ pointerEvents: 'none' }}>
                    <div className="asr-file-icon" style={{ width: '36px', height: '36px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div className="asr-file-details">
                      <strong style={{ fontSize: '0.82rem' }}>{asrFileName}</strong>
                      <span style={{ fontSize: '0.75rem' }}>{t('Değiştirmek için tıklayın', 'Click to change')}</span>
                    </div>
                  </div>
                ) : (
                  <div className="asr-drop-content" style={{ pointerEvents: 'none', gap: '0.5rem' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8356D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>{t('Ses dosyası yüklemek için tıklayın', 'Click to upload an audio file')}</p>
                  </div>
                )}
                <input
                  id="home-asr-file"
                  className="hidden-file-input"
                  type="file"
                  accept=".mp3,.wav,.m4a"
                  onChange={handleAsrFileChange}
                />
              </div>

              <div>
                <input
                  className="asr-job-input"
                  type="text"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder={t('Çalışma adı (örn: Toplantı - 14 Mayıs)', 'Job name (e.g. Meeting - May 14)')}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                <button className="asr-btn-start" onClick={goToAsr} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px' }}>
                  {t('Deşifre Ekranına Git', 'Go to Transcription')}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px' }}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </button>
              </div>
            </div>
            </SpotlightCard>
            </BorderGlow>
          </div>
        </section>


      <section className={`home-story${isStoryVisible ? ' is-visible' : ''}`} aria-labelledby="home-story-title">
        <div className="home-story-points" aria-label={t('Konuşmatik avantajları', 'Konusmatik advantages')}>
          <div className="story-step-card">
            <span className="step-num">01</span>
            <div className="step-copy">
              <strong>{t('İçeriğinizi Belirleyin', 'Choose Your Content')}</strong>
              <span>{t('Metninizi yazın veya ses/video dosyanızı sisteme yükleyin.', 'Write your text or upload an audio or video file.')}</span>
            </div>
          </div>
          <div className="story-step-card">
            <span className="step-num">02</span>
            <div className="step-copy">
              <strong>{t('Yapay Zeka İşleme', 'AI Processing')}</strong>
              <span>{t('Türkçe ses ve konuşma tanıma motorlarımız saniyeler içinde işlesin.', 'Our voice and speech-recognition engines process it in seconds.')}</span>
            </div>
          </div>
          <div className="story-step-card">
            <span className="step-num">03</span>
            <div className="step-copy">
              <strong>{t('Sonucu Alın & Dışa Aktarın', 'Get & Export the Result')}</strong>
              <span>{t('HD ses dosyanızı indirin, altyazı veya deşifre metnini doğrudan kopyalayın.', 'Download your HD audio or copy the subtitle or transcript directly.')}</span>
            </div>
          </div>
        </div>

        <div className="home-story-copy">
          <h2 id="home-story-title">{t('Ses ve metin işlerinizi tek akışta toparlayın.', 'Bring your audio and text workflows into one flow.')}</h2>
          <p>
            {t('Metni sese çevirin, ses ve video kayıtlarını deşifre edin. İçerik üreticileri, eğitim ekipleri ve kurum içi/local kullanım senaryoları için hızlı, temiz ve yönetilebilir bir deneyim sunar.', 'Convert text into speech and transcribe audio or video. Get a fast, clean, manageable experience for creators, education teams, and internal or local enterprise use cases.')}
          </p>
        </div>
      </section>

      <section className={`home-efficiency${isEfficiencyVisible ? ' is-visible' : ''}`} aria-labelledby="home-efficiency-title">
        <div className="home-efficiency-copy">
          <h2 id="home-efficiency-title">{t('Modellerimizi Deneyin', 'Try Our Voice Models')}</h2>
          <p>
            {t('Türkçe için özel eğitilmiş Sıla, Taha ve Deniz ses modellerimizin telaffuz ve tonlama yeteneklerini farklı türdeki hikayeler üzerinden canlı dinleyin.', 'Listen to the pronunciation and intonation of our Sıla, Taha, and Deniz voice models across different types of stories.')}
          </p>
        </div>

        <VoiceModelShowcase appLanguage={language} />
      </section>


      <section className={`home-solutions${isSolutionsVisible ? ' is-visible' : ''}`} aria-labelledby="home-solutions-title">
        <div className="home-solutions-head">
          <h2 id="home-solutions-title">{t('Seslendirme ve deşifre için yerli, local kurulabilir çözüm alanları', 'Locally deployable text-to-speech and transcription solutions')}</h2>
          <p>
            {t('Türkçe modellerimizi bulutta kullanın veya kurum içi (on-premise) sunucularınızda kapalı ağ mimarisiyle bağımsız çalıştırın.', 'Use our Turkish models in the cloud or run them independently on your own on-premise servers in an air-gapped architecture.')}
          </p>
        </div>

        <div className="home-solutions-grid">
          {solutionItems.map((item) => {
            const handleClick =
              item.action === 'tts'
                ? goToTts
                : item.action === 'asr'
                ? goToAsr
                : () => onNavigate?.('corporate');

            return (
              <StarBorder as="div" key={item.title} className="solution-star-card" color={item.action === 'asr' ? '#d21784' : item.action === 'corporate' ? '#0d9488' : '#6c3ce9'} speed="6s" thickness={2} backgroundColor="transparent" borderColor="transparent">
                <div
                  className="home-solution-card"
                  onClick={handleClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
                >
                  <div className="home-solution-icon">
                    <SolutionIcon type={item.icon} />
                  </div>
                  <div className="home-solution-copy">
                    <strong>{t(item.title, item.titleEn)}</strong>
                    <p>{t(item.description, item.descriptionEn)}</p>
                  </div>
                </div>
              </StarBorder>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        className={`home-scroll-orb ${isPageBottom ? 'is-bottom' : ''} ${isScrollOrbVisible ? 'is-visible' : ''}`}
        onClick={scrollToNextSection}
        aria-label={isPageBottom ? t('Sayfanın en üstüne çık', 'Back to top') : t('Sonraki bölüme in', 'Go to next section')}
      >
        <span></span>
      </button>
    </div>
  );
}
