import { useState, useRef, useEffect } from 'react';
import ElasticSlider from './ElasticSlider';

const VOICE_MODELS = [
  {
    id: 'sila',
    name: 'Sıla',
    title: 'Kadın Ses',
    badge: 'Kadın Ses',
    tone: 'Yumuşak & Doğal',
    toneEn: 'Soft & Natural',
    desc: 'Sıcak, akıcı ve berrak Türkçe tonlama.',
    themeColor: '#e8356d',
    gradient: 'linear-gradient(135deg, #e8356d 0%, #ff6b8b 100%)',
    avatarBg: 'rgba(232, 53, 109, 0.15)',
    avatarBorder: 'rgba(232, 53, 109, 0.4)',
    audioNamePart: 'sila',
  },
  {
    id: 'taha',
    name: 'Taha',
    title: 'Erkek Ses',
    badge: 'Erkek Ses',
    tone: 'Tok & Güçlü',
    toneEn: 'Deep & Strong',
    desc: 'Kararlı, derin ve doğal tonlama.',
    themeColor: '#3b82f6',
    gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    avatarBg: 'rgba(59, 130, 246, 0.15)',
    avatarBorder: 'rgba(59, 130, 246, 0.4)',
    audioNamePart: 'taha',
  },
  {
    id: 'deniz',
    name: 'Deniz',
    title: 'Dengeli Ses',
    badge: 'Dengeli Ses',
    tone: 'Modern & Temiz',
    toneEn: 'Modern & Clear',
    desc: 'Dinamik, akıcı ve çağdaş tonlama.',
    themeColor: '#10b981',
    gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    avatarBg: 'rgba(16, 185, 129, 0.15)',
    avatarBorder: 'rgba(16, 185, 129, 0.4)',
    audioNamePart: 'deniz',
  },
];

const STORIES = [
  {
    id: 'gunes',
    title: 'Güneş Bilimsel Belgeseli',
    titleEn: 'The Sun: Scientific Documentary',
    genre: 'Bilimsel Anlatım',
    genreEn: 'Scientific Narrative',
    icon: 'sun',
    filePart: 'bilimsel_gunes',
    sentences: [
      "Güneş, Güneş Sistemi'nin merkezinde bulunan ve büyük ölçüde plazmadan oluşan bir yıldızdır.",
      "Kütlesinin yaklaşık yüzde 73'ünü hidrojen, yüzde 25'ini helyum oluşturur.",
      "Geri kalan küçük bölümde ise oksijen, karbon, neon ve demir gibi daha ağır elementler bulunur.",
      "Güneş'in çekirdeğinde sıcaklık yaklaşık 15 milyon dereceye ulaşır.",
      "Bu bölgede hidrojen çekirdekleri nükleer füzyon yoluyla birleşerek helyuma dönüşür ve çok büyük miktarda enerji açığa çıkar.",
      "Güneş'in çapı yaklaşık 1 milyon 392 bin kilometredir.",
      "Dünya ile Güneş arasındaki ortalama mesafe ise yaklaşık 150 milyon kilometredir.",
      "Güneş'ten çıkan ışığın Dünya'ya ulaşması yaklaşık 8 dakika 20 saniye sürer.",
      "Güneş, Güneş Sistemi'ndeki toplam kütlenin yaklaşık yüzde 99,86'sını tek başına oluşturur."
    ],
  },
  {
    id: 'hayvan',
    title: 'Tavşan Pofuduk ve Misket',
    titleEn: 'Pofuduk the Rabbit and Misket',
    genre: 'Çocuk & Masal',
    genreEn: 'Children & Story',
    icon: 'story',
    filePart: 'hikaye_hayvan',
    sentences: [
      "Bir sabah tavşan Pofuduk, ormanda dolaşırken küçük kaplumbağa Misket ile karşılaştı.",
      "Pofuduk çok hızlı koştuğu için sürekli onunla övünüyordu.",
      "Misket ise yavaş ama dikkatli yürüyordu.",
      "İkisi büyük çınar ağacına kadar yarışmaya karar verdi.",
      "Pofuduk hızla öne geçti ve biraz dinlenmek için çimenlerin üzerine uzandı.",
      "Misket hiç durmadan yoluna devam etti.",
      "Bir süre sonra Pofuduk uyuyakaldı.",
      "Misket ise yavaş yavaş çınar ağacına ulaştı.",
      "Uyandığında yarışı kaybettiğini gören Pofuduk çok şaşırdı.",
      "O günden sonra hızlı olmanın yanında sabırlı ve kararlı olmanın da önemli olduğunu öğrendi."
    ],
  },
];

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function VoiceModelShowcase({ appLanguage = 'tr' }) {
  const t = (tr, en) => (appLanguage === 'en' ? en : tr);
  const [selectedVoiceId, setSelectedVoiceId] = useState('sila');
  const [selectedStoryId, setSelectedStoryId] = useState('gunes');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [volume, setVolume] = useState(70);

  const audioRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  const activeSentenceRef = useRef(null);

  const currentVoice = VOICE_MODELS.find((v) => v.id === selectedVoiceId) || VOICE_MODELS[0];
  const currentStory = STORIES.find((s) => s.id === selectedStoryId) || STORIES[0];

  const audioSrc = `/konusmatik-tts-story/${currentVoice.audioNamePart}_${currentStory.filePart}.wav`;

  const progressRatio = duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;
  const activeSentenceIndex = Math.min(
    Math.floor(progressRatio * currentStory.sentences.length),
    currentStory.sentences.length - 1
  );

  useEffect(() => {
    if (isPlaying && activeSentenceRef.current && transcriptContainerRef.current) {
      activeSentenceRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeSentenceIndex, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = audioSrc;
    audio.load();
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);

    const onCanPlay = () => {
      setIsLoading(false);
      if (isPlaying) {
        audio.play().catch(() => setIsPlaying(false));
      }
    };

    audio.addEventListener('canplay', onCanPlay);
    return () => {
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [audioSrc]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Playback error:', err);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = newProgress * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="vms-studio-deck">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* LEFT PANEL: MODEL & STORY SWITCHER */}
      <div className="vms-hub">
        {/* Voice Selection */}
        <div className="vms-hub-section">
          <div className="vms-section-label">
            <span>{t('Ses Modeli', 'Voice Model')}</span>
          </div>

          <div className="vms-voice-list">
            {VOICE_MODELS.map((voice) => {
              const isSelected = voice.id === selectedVoiceId;
              return (
                <button
                  key={voice.id}
                  type="button"
                  className={`vms-voice-item ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedVoiceId(voice.id)}
                  style={{
                    '--voice-accent': voice.themeColor,
                    '--voice-grad': voice.gradient,
                  }}
                >
                  <div className="vms-voice-info">
                    <div className="vms-voice-top-line">
                      <strong>{voice.name}</strong>
                    </div>
                    <span className="vms-voice-tone-text">{t(voice.tone, voice.toneEn)}</span>
                  </div>

                  {isSelected && (
                    <div className="vms-item-active-pill">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Story Selection */}
        <div className="vms-hub-section">
          <div className="vms-section-label">
            <span>{t('Metin / Hikaye', 'Text / Story')}</span>
          </div>

          <div className="vms-story-tabs">
            {STORIES.map((story) => {
              const isSelected = story.id === selectedStoryId;
              return (
                <button
                  key={story.id}
                  type="button"
                  className={`vms-story-tab ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedStoryId(story.id)}
                >
                  <div className="vms-story-tab-header">
                    <strong>{t(story.title, story.titleEn)}</strong>
                  </div>
                  <span className="vms-story-genre-tag">{t(story.genre, story.genreEn)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: IMMERSIVE TELEPROMPTER & AUDIO DECK */}
      <div className="vms-stage">
        {/* Stage Header */}
        <div className="vms-stage-top">
          <h3 className="vms-live-title">{t(currentStory.title, currentStory.titleEn)}</h3>
        </div>

        {/* Live Reader / Teleprompter */}
        <div className="vms-reader" ref={transcriptContainerRef}>
          <div className="vms-reader-content">
            {currentStory.sentences.map((sentence, index) => {
              const isActive = isPlaying && index === activeSentenceIndex;
              const isPast = isPlaying && index < activeSentenceIndex;
              return (
                <span
                  key={index}
                  ref={isActive ? activeSentenceRef : null}
                  className={`vms-reader-sentence ${isActive ? 'active' : ''} ${isPast ? 'past' : ''}`}
                >
                  {sentence}{' '}
                </span>
              );
            })}
          </div>
        </div>

        {/* Stage Player Bar */}
        <div className="vms-player-bar">
          <button
            type="button"
            className={`vms-stage-play-btn voice-${currentVoice.id} ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            style={{ background: currentVoice.gradient }}
            aria-label={isPlaying ? t('Durdur', 'Pause') : t('Oynat', 'Play')}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="vms-loader"></span>
            ) : isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '3px' }}>
                <path d="M7 4v16l13-8z" />
              </svg>
            )}
          </button>

          <div className="vms-stage-scrub">
            <div className="vms-scrub-info">
              <div className="vms-time-label">
                <span>{formatTime(currentTime)}</span>
                <span className="vms-time-sep">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div
              className="vms-timeline"
              onClick={handleSeek}
              role="slider"
              aria-label={t('Ses ilerleme çubuğu', 'Audio progress')}
              aria-valuemin="0"
              aria-valuemax={duration || 100}
              aria-valuenow={currentTime}
              tabIndex="0"
            >
              <div className="vms-timeline-track">
                <div
                  className="vms-timeline-fill"
                  style={{
                    width: `${progressRatio * 100}%`,
                    background: currentVoice.gradient,
                  }}
                >
                  <span className="vms-timeline-pin"></span>
                </div>
              </div>
            </div>
          </div>
          <ElasticSlider
            className="vms-volume-control"
            value={volume}
            onChange={setVolume}
            step={10}
            leftIcon="−"
            rightIcon="+"
          />
        </div>
      </div>
    </div>
  );
}
