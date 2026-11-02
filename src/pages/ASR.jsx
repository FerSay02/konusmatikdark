import { useEffect, useMemo, useRef, useState } from 'react';
import './StudioReveal.css';
import './ASR.unified.css';
import '../application-light-theme.css';
import {
  apiJson,
  getASRCapabilities,
  uploadASRMediaWithProgress,
  getASRDownloadInfo,
  downloadFileFromUrl,
  adaptASRResult,
  DEFAULT_ASR_CAPABILITIES,
  API_BASE_URL,
} from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';
import {
  ASR_LANGUAGE,
  ASR_MODEL_DISPLAY_NAME,
  buildRealtimeStartMessage,
  buildRealtimeUpdateMessage,
  buildSrt,
  buildTimestampGranularities,
  buildVtt,
  formatTimestamp,
  normalizeSegmentsForDisplay,
} from '../lib/asrSupport';
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

function formatDuration(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const pad = (n) => String(n).padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

function isVideoFile(fileName, mimeType) {
  const videoExts = ['.mp4', '.mov', '.mkv', '.webm'];
  const lowerName = (fileName || '').toLowerCase();
  const hasVideoExt = videoExts.some((ext) => lowerName.endsWith(ext));
  const isVideoMime = (mimeType || '').toLowerCase().startsWith('video/');
  return hasVideoExt || isVideoMime;
}

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

  // Dynamic Capabilities
  const [capabilities, setCapabilities] = useState(DEFAULT_ASR_CAPABILITIES);

  const initialFile = prefill?.file || null;
  const [selectedFile, setSelectedFile] = useState(initialFile);
  const [fileName, setFileName] = useState(initialFile?.name || prefill?.fileName || '');
  const [fileSize, setFileSize] = useState(initialFile?.size || 0);
  const [mediaType, setMediaType] = useState(
    initialFile ? (isVideoFile(initialFile.name, initialFile.type) ? 'video' : 'audio') : 'audio'
  );
  const [mediaDuration, setMediaDuration] = useState(null);
  const [mediaObjectUrl, setMediaObjectUrl] = useState(null);
  const [playbackUnsupported, setPlaybackUnsupported] = useState(false);

  // Job & Transcription State
  const [jobName, setJobName] = useState(typeof prefill?.jobName === 'string' ? prefill.jobName : '');
  const [jobId, setJobId] = useState(prefill?.jobId || null);
  const [jobStatus, setJobStatus] = useState('idle'); // idle | uploading | queued | processing | completed | failed
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transcriptText, setTranscriptText] = useState(prefill?.text || prefill?.transcriptText || '');
  const [segments, setSegments] = useState(Array.isArray(prefill?.segments) ? prefill.segments : []);
  const [words, setWords] = useState(Array.isArray(prefill?.words) ? prefill.words : []);
  const [viewMode, setViewMode] = useState('segments'); // 'segments' | 'text'
  const [showWordTimestamps, setShowWordTimestamps] = useState(false);

  // Mode Selection: 'file' | 'realtime'
  const [asrMode, setAsrMode] = useState('file');

  // File Upload Timestamp Granularity Preferences (default: off)
  const [enableTimestamps, setEnableTimestamps] = useState(false);
  const [enableWordTimestamps, setEnableWordTimestamps] = useState(false);

  // Realtime WebSocket ASR State
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState('idle'); // idle | connecting | connected | listening | error
  const [realtimeError, setRealtimeError] = useState('');
  const [enableRealtimeTimestamps, setEnableRealtimeTimestamps] = useState(false);
  const [enableRealtimeWordTimestamps, setEnableRealtimeWordTimestamps] = useState(false);
  const [partialTranscript, setPartialTranscript] = useState({ text: '', segments: null, words: null });
  const [finalTurns, setFinalTurns] = useState([]);

  // Realtime Audio & WebSocket References
  const realtimeWsRef = useRef(null);
  const audioContextRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // UI & Feedback State
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [showPackagePopup, setShowPackagePopup] = useState(false);
  const [packageMessage, setPackageMessage] = useState({
    tr: 'Desifre islemi icin giris yapmali ve yeterli ucretsiz ya da paket hakkina sahip olmalisiniz.',
    en: 'You must log in and have sufficient free or paid allowance to transcribe this file.',
  });

  const fileInputRef = useRef(null);
  const mediaRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch Capabilities on Mount
  useEffect(() => {
    let active = true;
    getASRCapabilities().then((caps) => {
      if (active && caps) {
        setCapabilities(caps);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Handle escape on modal
  useEffect(() => {
    if (!showPackagePopup) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowPackagePopup(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPackagePopup]);

  // Derived accepted formats
  const acceptAttribute = useMemo(() => {
    const audios = capabilities.audio_extensions || [];
    const videos = capabilities.video_extensions || [];
    return [...audios, ...videos].join(',');
  }, [capabilities]);

  const maxUploadBytes = capabilities.max_upload_bytes || 104857600;

  const currentStep = !selectedFile ? 1 : !transcriptText ? 2 : 3;

  const wordCount = useMemo(() => {
    if (!transcriptText) return 0;
    return transcriptText.split(/\s+/).filter(Boolean).length;
  }, [transcriptText]);

  // Engine segments of adjacent chunks can overlap and the last one can outlast the audio: show/export ordered copies.
  const displaySegments = useMemo(() => normalizeSegmentsForDisplay(segments, mediaDuration), [segments, mediaDuration]);

  // Active segment detection based on current media playback time
  const activeSegmentIndex = useMemo(() => {
    if (!displaySegments || displaySegments.length === 0) return -1;
    return displaySegments.findIndex((s) => currentTime >= s.start && currentTime < s.end);
  }, [displaySegments, currentTime]);

  // File Selection and Metadata Inspection
  const handleSelectFile = (file) => {
    if (!file) return;

    if (mediaObjectUrl) {
      URL.revokeObjectURL(mediaObjectUrl);
      setMediaObjectUrl(null);
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (file.size > maxUploadBytes) {
      setSelectedFile(null);
      setFileName('');
      setFileSize(0);
      setMediaDuration(null);
      setTranscriptText('');
      setSegments([]);
      setWords([]);
      setErrorText(
        t(
          `Dosya boyutu en fazla ${formatFileSize(maxUploadBytes)} olabilir.`,
          `The file size can be at most ${formatFileSize(maxUploadBytes)}.`
        )
      );
      return;
    }

    // Format check against capabilities
    const fileExt = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isAudio = (capabilities.audio_extensions || []).includes(fileExt);
    const isVideo = (capabilities.video_extensions || []).includes(fileExt);
    const isAllowedMime = (capabilities.allowed_content_types || []).includes(file.type);

    if (!isAudio && !isVideo && !isAllowedMime) {
      setErrorText(
        t(
          `Desteklenmeyen dosya formati (${fileExt || file.type || 'bilinmeyen'}). Lutfen desteklenen bir ses veya video dosyasi yukleyin.`,
          `Unsupported file format (${fileExt || file.type || 'unknown'}). Please upload a supported audio or video file.`
        )
      );
      return;
    }

    const detectedType = isVideo || isVideoFile(file.name, file.type) ? 'video' : 'audio';

    setSelectedFile(file);
    setFileName(file.name);
    setFileSize(file.size);
    setMediaType(detectedType);
    setMediaDuration(null);
    setPlaybackUnsupported(false);
    if (!jobName) setJobName(file.name.replace(/\.[^/.]+$/, ''));
    setTranscriptText('');
    setSegments([]);
    setWords([]);
    setJobId(null);
    setJobStatus('idle');
    setUploadProgress(0);
    setErrorText('');
    setIsPlaying(false);
    setCurrentTime(0);

    // Try creating object URL for native playback preview & duration probing
    try {
      const url = URL.createObjectURL(file);
      setMediaObjectUrl(url);

      const probeElement = document.createElement(detectedType === 'video' ? 'video' : 'audio');
      probeElement.preload = 'metadata';
      probeElement.src = url;
      probeElement.onloadedmetadata = () => {
        if (!isNaN(probeElement.duration) && probeElement.duration > 0) {
          setMediaDuration(probeElement.duration);
        }
      };
      probeElement.onerror = () => {
        setPlaybackUnsupported(true);
      };
    } catch {
      setPlaybackUnsupported(true);
    }
  };

  const handleFileChange = (event) => {
    handleSelectFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    handleSelectFile(event.dataTransfer.files?.[0]);
  };

  // Player controls
  const togglePlayback = async () => {
    const el = mediaRef.current;
    if (!el || playbackUnsupported) return;
    try {
      if (el.paused) {
        await el.play();
        setIsPlaying(true);
      } else {
        el.pause();
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const handleSeek = (e) => {
    const el = mediaRef.current;
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    if (el) {
      el.currentTime = nextTime;
    }
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    if (mediaRef.current) {
      mediaRef.current.volume = val;
      mediaRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!mediaRef.current) return;
    if (isMuted) {
      mediaRef.current.muted = false;
      setIsMuted(false);
    } else {
      mediaRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const seekToTimestamp = (seconds) => {
    const el = mediaRef.current;
    const target = Math.max(0, seconds);
    setCurrentTime(target);
    if (el && !playbackUnsupported) {
      el.currentTime = target;
      if (el.paused) {
        el.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    if (!transcriptText) return;
    await navigator.clipboard.writeText(transcriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Multi-format Downloads (TXT, JSON, SRT, VTT)
  const handleDownload = async (format = 'txt') => {
    if (!transcriptText && segments.length === 0) return;
    const safeBaseName = (jobName || fileName || 'desifre')
      .replace(/\.[^/.]+$/, '')
      .split('')
      .map((char) => (char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? '_' : char))
      .join('')
      .trim() || 'desifre';

    const normalizedFormat = format.toLowerCase();
    const downloadFilename = `${safeBaseName}.${normalizedFormat}`;
    setDownloadingFormat(normalizedFormat);

    try {
      // 1. Try server-side download endpoint if jobId exists
      if (jobId) {
        try {
          const downloadInfo = await getASRDownloadInfo(jobId, normalizedFormat);
          if (downloadInfo?.url) {
            await downloadFileFromUrl(downloadInfo.url, downloadFilename);
            setDownloadingFormat(null);
            return;
          }
        } catch (serverErr) {
          // If server-side download fails or job not in DB, fallback to client synthesis
          console.warn('Server download endpoint fallback:', serverErr);
        }
      }

      // 2. Client-side fallback if server URL not reachable
      let content = '';
      let mimeType = 'text/plain;charset=utf-8';

      if (normalizedFormat === 'json') {
        content = JSON.stringify(
          {
            job_id: jobId,
            filename: fileName,
            media_type: mediaType,
            duration_seconds: mediaDuration,
            text: transcriptText,
            segments,
            words,
          },
          null,
          2
        );
        mimeType = 'application/json;charset=utf-8';
      } else if (normalizedFormat === 'srt') {
        if (segments && segments.length > 0) {
          content = buildSrt(segments, mediaDuration);
        } else {
          content = `1\n00:00:00,000 --> 00:00:10,000\n${transcriptText}\n`;
        }
        mimeType = 'application/x-subrip;charset=utf-8';
      } else if (normalizedFormat === 'vtt') {
        if (segments && segments.length > 0) {
          content = buildVtt(segments, mediaDuration);
        } else {
          content = `WEBVTT\n\n1\n00:00:00.000 --> 00:00:10.000\n${transcriptText}\n`;
        }
        mimeType = 'text/vtt;charset=utf-8';
      } else {
        content = transcriptText;
      }

      const textBlob = new Blob([content], { type: mimeType });
      const blobUrl = URL.createObjectURL(textBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      setErrorText(err instanceof Error ? err.message : 'Indirme basarisiz oldu.');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Polling helper for async ASR jobs
  const startPollingJob = (id) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const job = await apiJson(`/api/v1/asr/jobs/${id}`, { skipAuthExpiredEvent: true });
        if (job.status === 'completed') {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setJobStatus('completed');
          setIsLoading(false);

          // Fetch full result payload (segments, words, srt, vtt)
          const result = await apiJson(`/api/v1/asr/jobs/${id}/result`, { skipAuthExpiredEvent: true });
          const adapted = adaptASRResult(result);
          if (adapted) {
            setTranscriptText(adapted.text);
            setSegments(adapted.segments);
            setWords(adapted.words);
            if (adapted.duration_seconds && !mediaDuration) {
              setMediaDuration(adapted.duration_seconds);
            }
            setViewMode(adapted.segments && adapted.segments.length > 0 ? 'segments' : 'text');
        setShowWordTimestamps(enableWordTimestamps);
          }
        } else if (job.status === 'failed') {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setJobStatus('failed');
          setIsLoading(false);
          setErrorText(job.error_message || t('Desifre islemi basarisiz oldu.', 'Transcription job failed.'));
        } else {
          setJobStatus(job.status || 'processing');
        }
      } catch (err) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setJobStatus('failed');
        setIsLoading(false);
        setErrorText(err instanceof Error ? err.message : 'Durum sorgulanamadi.');
      }
    }, 1500);
  };


  // Realtime WebSocket & Audio Streaming Handlers
  const stopRealtimeRecording = () => {
    try {
      if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (realtimeWsRef.current) {
        if (realtimeWsRef.current.readyState === WebSocket.OPEN) {
          try {
            realtimeWsRef.current.send(JSON.stringify({ type: 'session.stop' }));
          } catch {
            // the socket may already be closing: the close below still runs
          }
          realtimeWsRef.current.close();
        }
        realtimeWsRef.current = null;
      }
    } catch (err) {
      console.warn('Realtime cleanup error:', err);
    }
    setIsRealtimeActive(false);
    setRealtimeStatus('idle');
  };

  // Cleanup object URLs, polling timers and realtime audio on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (mediaObjectUrl) URL.revokeObjectURL(mediaObjectUrl);
      stopRealtimeRecording();
    };
  }, [mediaObjectUrl]);

  const startRealtimeRecording = async () => {
    setRealtimeError('');
    setRealtimeStatus('connecting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      const loc = window.location;
      const isHttps = loc.protocol === 'https:';
      const wsProtocol = isHttps ? 'wss:' : 'ws:';
      let wsUrl = `${wsProtocol}//${loc.host}/api/v1/realtime/transcriptions`;
      if (API_BASE_URL) {
        const wsBase = API_BASE_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
        wsUrl = `${wsBase}/api/v1/realtime/transcriptions`;
      }

      const ws = new WebSocket(wsUrl);
      realtimeWsRef.current = ws;

      ws.onopen = () => {
        setRealtimeStatus('connected');
        ws.send(
          JSON.stringify(
            buildRealtimeStartMessage({
              includeTimestamps: enableRealtimeTimestamps,
              includeWordTimestamps: enableRealtimeWordTimestamps,
            })
          )
        );
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'session.ready') {
            setRealtimeStatus('listening');
            setIsRealtimeActive(true);

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioCtx({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (ws.readyState !== WebSocket.OPEN) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
              }
              ws.send(pcm16.buffer);
            };

            source.connect(processor);
            processor.connect(audioCtx.destination);
          } else if (data.type === 'transcript.partial') {
            setPartialTranscript({
              text: data.text || '',
              segments: data.segments || null,
              words: data.words || null,
            });
          } else if (data.type === 'transcript.final') {
            const finalTxt = (data.text || '').trim();
            if (finalTxt) {
              setFinalTurns((prev) => [
                ...prev,
                {
                  id: Date.now() + Math.random(),
                  text: finalTxt,
                  segments: data.segments || null,
                  words: data.words || null,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                },
              ]);
            }
            setPartialTranscript({ text: '', segments: null, words: null });
          } else if (data.type === 'error') {
            setRealtimeError(data.error?.message || t('Realtime ASR sunucu hatasi', 'Realtime ASR server error'));
          }
        } catch (parseErr) {
          console.warn('Realtime message parse error:', parseErr);
        }
      };

      ws.onerror = () => {
        setRealtimeError(t('WebSocket baglanti hatasi olustu.', 'WebSocket connection error.'));
        setRealtimeStatus('error');
      };

      ws.onclose = () => {
        setIsRealtimeActive(false);
        if (realtimeStatus !== 'error') {
          setRealtimeStatus('idle');
        }
      };
    } catch (err) {
      setRealtimeError(
        err.name === 'NotAllowedError'
          ? t('Mikrofon erisim izni verilmedi.', 'Microphone access permission was denied.')
          : err.message || t('Mikrofon baslatilamadi.', 'Could not initialize microphone.')
      );
      setRealtimeStatus('error');
      setIsRealtimeActive(false);
    }
  };

  const updateRealtimeGranularities = (newTimestamps, newWords) => {
    setEnableRealtimeTimestamps(newTimestamps);
    setEnableRealtimeWordTimestamps(newWords);
    if (realtimeWsRef.current && realtimeWsRef.current.readyState === WebSocket.OPEN) {
      realtimeWsRef.current.send(JSON.stringify(buildRealtimeUpdateMessage(newTimestamps, newWords)));
    }
  };

  // Start Transcription (Async with real upload progress + sync fallback)
  const handleStart = async () => {
    if (!selectedFile || isLoading) return;
    setIsLoading(true);
    setJobStatus('uploading');
    setUploadProgress(0);
    setErrorText('');
    setTranscriptText('');
    setSegments([]);
    setWords([]);

    const formData = new FormData();
    formData.append('file', selectedFile);
    // The audio language, not the interface language: the engine decodes Turkish only.
    formData.append('language', ASR_LANGUAGE);
    formData.append('task', 'transcribe');

    if (enableTimestamps) {
      formData.append(
        'timestamp_granularities',
        JSON.stringify(buildTimestampGranularities(enableTimestamps, enableWordTimestamps))
      );
    }

    try {
      // 1. First attempt: Async Job Creation (/api/v1/asr/jobs) with XHR upload progress
      let created = null;
      let usedSync = false;

      try {
        created = await uploadASRMediaWithProgress('/api/v1/asr/jobs', formData, {
          onProgress: (percent) => setUploadProgress(percent),
        });
      } catch (asyncErr) {
        // If async endpoint returns 503 (e.g. celery worker unavailable in dev), try sync endpoint fallback
        if (asyncErr.status === 503) {
          usedSync = true;
          created = await uploadASRMediaWithProgress('/api/v1/asr/jobs/sync', formData, {
            onProgress: (percent) => setUploadProgress(percent),
          });
        } else {
          throw asyncErr;
        }
      }

      setUploadProgress(100);

      if (usedSync || created?.status === 'completed' || created?.text) {
        // Sync response returned result directly
        const adapted = adaptASRResult(created);
        setJobId(adapted.job_id);
        setJobStatus('completed');
        setIsLoading(false);
        setTranscriptText(adapted.text);
        setSegments(adapted.segments);
        setWords(adapted.words);
        if (adapted.duration_seconds && !mediaDuration) {
          setMediaDuration(adapted.duration_seconds);
        }
        setViewMode(adapted.segments && adapted.segments.length > 0 ? 'segments' : 'text');
        setShowWordTimestamps(enableWordTimestamps);
      } else {
        // Async job created, start polling
        const id = created.id || created.job_id;
        setJobId(id);
        setJobStatus('queued');
        startPollingJob(id);
      }
    } catch (error) {
      setIsLoading(false);
      setJobStatus('failed');

      if (error instanceof Error && (error.message.includes('401') || error.message.includes('Not authenticated') || error.status === 401)) {
        setPackageMessage({
          tr: 'Desifre islemini baslatmak icin giris yapmalisiniz.',
          en: 'You must log in to start transcription.',
        });
        setShowPackagePopup(true);
        return;
      }
      if (error instanceof Error && (error.message.includes('402') || error.message.includes('Insufficient') || error.status === 402)) {
        setPackageMessage({
          tr: 'Bu dosyayi desifre etmek icin yeterli ucretsiz ASR hakkiniz veya aktif ASR paketiniz olmali.',
          en: 'You need enough free ASR allowance or an active ASR plan to transcribe this file.',
        });
        setShowPackagePopup(true);
        return;
      }
      setErrorText(error instanceof Error ? error.message : t('Beklenmeyen hata olustu.', 'An unexpected error occurred.'));
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
          {/* Mode Switch: File Transcription vs Realtime ASR */}
          <div className="asr-main-mode-toggle-wrap">
            <div className="asr-main-mode-toggle">
              <button
                type="button"
                className={`asr-main-mode-btn ${asrMode === 'file' ? 'active' : ''}`}
                onClick={() => setAsrMode('file')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>{t('Dosya Deşifre', 'File Transcription')}</span>
              </button>
              <button
                type="button"
                className={`asr-main-mode-btn ${asrMode === 'realtime' ? 'active' : ''}`}
                onClick={() => setAsrMode('realtime')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
                <span>{t('Canlı Deşifre (Realtime)', 'Live Transcription (Realtime)')}</span>
              </button>
            </div>
          </div>

          {asrMode === 'file' ? (
          <div className="studio-grid-v2">
            <div className="studio-main-v2">
              {/* Media Upload Area */}
              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>{t('Medya Dosyasi (Ses veya Video)', 'Media File (Audio or Video)')}</h3>
                </div>
                <div
                  className={`asr-drop-zone ${fileName ? 'has-file' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                >
                  {fileName ? (
                    <div className="asr-file-info">
                      <div className="asr-file-icon">
                        {mediaType === 'video' ? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2.18" ry="2.18" />
                            <line x1="7" y1="2" x2="7" y2="6" />
                            <line x1="17" y1="2" x2="17" y2="6" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <line x1="2" y1="7" x2="7" y2="7" />
                            <line x1="2" y1="17" x2="7" y2="17" />
                            <line x1="17" y1="17" x2="22" y2="17" />
                            <line x1="17" y1="7" x2="22" y2="7" />
                          </svg>
                        ) : (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18V5l12-2v13" />
                            <circle cx="6" cy="18" r="3" />
                            <circle cx="18" cy="16" r="3" />
                          </svg>
                        )}
                      </div>
                      <div className="asr-file-details">
                        <strong>{fileName}</strong>
                        <div className="asr-media-badges">
                          <span className={`asr-media-badge ${mediaType}`}>
                            {mediaType === 'video' ? t('Video', 'Video') : t('Ses', 'Audio')}
                          </span>
                          <span className="asr-media-badge duration">{formatFileSize(fileSize)}</span>
                          {mediaDuration ? (
                            <span className="asr-media-badge duration">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                              {formatDuration(mediaDuration)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="asr-drop-content">
                      <div className="asr-drop-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p>{t('Ses veya video dosyasini surukleyip birakin ya da tiklayip secin', 'Drag and drop an audio or video file or click to select')}</p>
                      <div className="asr-format-tags">
                        <span className="asr-format-tag asr-size-tag">
                          {t(`Maks. ${formatFileSize(maxUploadBytes)}`, `Max ${formatFileSize(maxUploadBytes)}`)}
                        </span>
                        <span className="asr-format-tag">WAV, MP3, FLAC, M4A, OGG, Opus...</span>
                        <span className="asr-format-tag">MP4, MOV, MKV, WebM</span>
                      </div>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    id="asr-file-input"
                    type="file"
                    accept={acceptAttribute}
                    onChange={handleFileChange}
                    className="hidden-file-input"
                  />
                </div>

                {/* Upload & Polling Progress Bar */}
                {isLoading && (
                  <div className="asr-progress-container">
                    <div className="asr-progress-bar" style={{ width: `${uploadProgress}%` }} />
                    <div className="asr-progress-status">
                      <span>
                        {jobStatus === 'uploading'
                          ? t(`Dosya yukleniyor... (%${uploadProgress})`, `Uploading file... (${uploadProgress}%)`)
                          : jobStatus === 'queued'
                          ? t('Is siraya alindi, bekleniyor...', 'Job queued, waiting...')
                          : t('Desifre ediliyor, yapay zeka cozumlemede...', 'Transcribing with AI...')}
                      </span>
                      <span>{uploadProgress}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Media Player (Audio & Video) */}
              {mediaObjectUrl && (
                <div className="studio-section">
                  <div className="studio-section-header">
                    <h3>
                      {mediaType === 'video'
                        ? t('Video Oynatici & Onizleme', 'Video Player & Preview')
                        : t('Ses Oynatici & Onizleme', 'Audio Player & Preview')}
                    </h3>
                  </div>

                  {playbackUnsupported ? (
                    <div className="asr-unsupported-banner" role="alert">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <div>
                        <strong>{t('Tarayici Oynatma Bildirimi', 'Browser Playback Notice')}: </strong>
                        {t(
                          'Bu dosya formati tarayiciniz tarafindan dogrudan oynatilamiyor (orn. WMA / ozel codec). Ancak dosyaniz basariyla yuklenebilir ve desifre sonuclari tam olarak uretilir.',
                          'This file format cannot be played natively by your browser (e.g., WMA / custom codec). However, your file can be transcribed and full results are generated normally.'
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="asr-player-card">
                      {mediaType === 'video' ? (
                        <div className="asr-video-wrapper">
                          <video
                            ref={mediaRef}
                            src={mediaObjectUrl}
                            className="asr-video-element"
                            playsInline
                            onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
                            onLoadedMetadata={() => {
                              if (mediaRef.current?.duration) setMediaDuration(mediaRef.current.duration);
                            }}
                            onError={() => setPlaybackUnsupported(true)}
                            onEnded={() => setIsPlaying(false)}
                          />
                        </div>
                      ) : (
                        <audio
                          ref={mediaRef}
                          src={mediaObjectUrl}
                          onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
                          onLoadedMetadata={() => {
                            if (mediaRef.current?.duration) setMediaDuration(mediaRef.current.duration);
                          }}
                          onError={() => setPlaybackUnsupported(true)}
                          onEnded={() => setIsPlaying(false)}
                        />
                      )}

                      <div className="asr-player-controls">
                        <button
                          type="button"
                          className="asr-player-btn"
                          onClick={togglePlayback}
                          aria-label={isPlaying ? t('Duraklat', 'Pause') : t('Oynat', 'Play')}
                        >
                          {isPlaying ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="6" y="4" width="4" height="16" rx="1" />
                              <rect x="14" y="4" width="4" height="16" rx="1" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                          )}
                        </button>

                        <span className="asr-player-time">
                          {formatDuration(currentTime)} / {formatDuration(mediaDuration || 0)}
                        </span>

                        <input
                          type="range"
                          min="0"
                          max={mediaDuration || Math.max(currentTime, 1)}
                          step="0.05"
                          value={currentTime}
                          onChange={handleSeek}
                          className="asr-player-slider"
                          aria-label={t('Medya ilerleme', 'Media progress')}
                        />

                        <div className="asr-volume-control">
                          <button
                            type="button"
                            className="asr-volume-btn"
                            onClick={toggleMute}
                            aria-label={isMuted ? t('Sesi Ac', 'Unmute') : t('Sesi Kapat', 'Mute')}
                          >
                            {isMuted || volume === 0 ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="1" y1="1" x2="23" y2="23" />
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
                                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0a7 7 0 0 1-.11 1.23" />
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                              </svg>
                            )}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="asr-volume-slider"
                            aria-label={t('Ses seviyesi', 'Volume level')}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Job Name */}
              <div className="studio-section">
                <div className="studio-section-header">
                  <h3>{t('Calisma Adi', 'Job Name')}</h3>
                </div>
                <input
                  type="text"
                  className="asr-job-input"
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder={t('Orn: Haftalik ekip toplantisi', 'Example: Weekly team meeting')}
                />
              </div>

              {/* Transcription Result Area */}
              <div className="studio-section">
                <div className="studio-section-header asr-transcript-header">
                  <h3>{t('Desifre Metni & Zaman Damgalari', 'Transcript & Timestamps')}</h3>

                  {segments && segments.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <label className="asr-words-toggle">
                        <input
                          type="checkbox"
                          checked={showWordTimestamps}
                          onChange={(e) => setShowWordTimestamps(e.target.checked)}
                        />
                        <span>{t('Kelime Zamanlari', 'Word Timestamps')}</span>
                      </label>

                      <div className="asr-view-modes">
                        <button
                          type="button"
                          className={`asr-view-tab ${viewMode === 'segments' ? 'active' : ''}`}
                          onClick={() => setViewMode('segments')}
                        >
                          {t('Zaman Damgali', 'Segments')}
                        </button>
                        <button
                          type="button"
                          className={`asr-view-tab ${viewMode === 'text' ? 'active' : ''}`}
                          onClick={() => setViewMode('text')}
                        >
                          {t('Duz Metin', 'Plain Text')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="asr-transcript-wrapper">
                  {/* Segmented View */}
                  {viewMode === 'segments' && segments && segments.length > 0 ? (
                    <div className="asr-segments-container" role="feed" aria-label={t('Transkripsiyon segmentleri', 'Transcription segments')}>
                      {displaySegments.map((seg, idx) => {
                        const isActive = idx === activeSegmentIndex;
                        return (
                          <div
                            key={seg.id || idx}
                            className={`asr-segment-item ${isActive ? 'active' : ''}`}
                            onClick={() => seekToTimestamp(seg.start)}
                            title={t('Bu saniyeye git', 'Seek to this time')}
                          >
                            <div className="asr-segment-meta">
                              <span className="asr-segment-timestamp">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                {formatTimestamp(seg.start, true)} &ndash; {formatTimestamp(seg.end, true)}
                              </span>
                              {isActive && (
                                <span className="asr-segment-active-indicator">
                                  <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#e8356d' }} />
                                  {t('Oynatiliyor', 'Playing')}
                                </span>
                              )}
                            </div>

                            <p className="asr-segment-content">{seg.text}</p>

                            {/* Optional Word Timestamps */}
                            {showWordTimestamps && seg.words && seg.words.length > 0 && (
                              <div className="asr-word-tokens-box">
                                {seg.words.map((w, wIdx) => (
                                  <span key={wIdx} className="asr-word-token">
                                    {w.word}
                                    <small>{formatTimestamp(w.start)}</small>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    /* Plain Text View (Default for legacy or text toggle) */
                    <textarea
                      readOnly
                      rows={9}
                      value={transcriptText}
                      placeholder={t('Desifre metni burada gorunecektir...', 'Transcribed text will appear here...')}
                      className="asr-transcript"
                      style={{ resize: 'none' }}
                    />
                  )}

                  {errorText && <p style={{ marginTop: '8px', color: '#b91c1c' }}>{errorText}</p>}
                </div>

                {/* Actions: Copy & Multi-Format Subtitle Downloads */}
                <div className="asr-transcript-actions-outer">
                  <div className="asr-download-btn-group">
                    <button
                      type="button"
                      className="asr-format-download-btn"
                      onClick={() => handleDownload('txt')}
                      disabled={!transcriptText || downloadingFormat === 'txt'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      TXT
                    </button>

                    <button
                      type="button"
                      className="asr-format-download-btn"
                      onClick={() => handleDownload('json')}
                      disabled={!transcriptText || downloadingFormat === 'json'}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6" />
                        <polyline points="8 6 2 12 8 18" />
                      </svg>
                      JSON
                    </button>

                    <button
                      type="button"
                      className="asr-format-download-btn"
                      onClick={() => handleDownload('srt')}
                      disabled={!transcriptText || downloadingFormat === 'srt'}
                      title={t('SRT Altyazi Dosyasi', 'SRT Subtitle File')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      SRT
                    </button>

                    <button
                      type="button"
                      className="asr-format-download-btn"
                      onClick={() => handleDownload('vtt')}
                      disabled={!transcriptText || downloadingFormat === 'vtt'}
                      title={t('VTT Web Altyazi Dosyasi', 'VTT Web Subtitle File')}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      VTT
                    </button>

                    <button
                      type="button"
                      className="asr-copy-btn"
                      onClick={handleCopy}
                      disabled={!transcriptText}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      {copied ? t('Kopyalandi!', 'Copied!') : t('Kopyala', 'Copy')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Features & File Details */}
            <aside className="studio-side-v2">
              <div className="studio-side-card-v2">
                <div className="studio-side-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>{t('Desifre Ozellikleri', 'Transcription Features')}</span>
                </div>
                <div className="tts-usage-stats">
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Islem Hizi', 'Processing Speed')}</span>
                    <span className="tts-usage-value" style={{ color: '#E8356D' }}>
                      {t('Gercek Zamandan Hizli', 'Faster Than Real Time')}
                    </span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Dil', 'Language')}</span>
                    <span className="tts-usage-value">{language === 'en' ? 'English (EN)' : 'Turkce (TR)'}</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Boyut Limiti', 'Size Limit')}</span>
                    <span className="tts-usage-value">{formatFileSize(maxUploadBytes)}</span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Desteklenen Ses', 'Supported Audio')}</span>
                    <span className="tts-usage-value" title="WAV, MP3, FLAC, M4A, AAC, OGG, Opus, AIFF, WMA">
                      WAV, MP3, FLAC, M4A...
                    </span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Desteklenen Video', 'Supported Video')}</span>
                    <span className="tts-usage-value" title="MP4, MOV, MKV, WebM">
                      MP4, MOV, MKV, WebM
                    </span>
                  </div>
                  <div className="tts-usage-item">
                    <span className="tts-usage-label">{t('Altyazi / Cikti', 'Subtitles / Export')}</span>
                    <span className="tts-usage-value">TXT, JSON, SRT, VTT</span>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="studio-side-card-v2">
                  <div className="studio-side-card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <span>{t('Secili Dosya', 'Selected File')}</span>
                  </div>
                  <div className="tts-usage-stats">
                    <div className="tts-usage-item">
                      <span className="tts-usage-label" style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={fileName}>
                        {fileName}
                      </span>
                      <span className="tts-usage-value">{formatFileSize(fileSize)}</span>
                    </div>
                    <div className="tts-usage-item">
                      <span className="tts-usage-label">{t('Tur', 'Type')}</span>
                      <span className="tts-usage-value" style={{ textTransform: 'capitalize' }}>
                        {mediaType === 'video' ? t('Video Dosyasi', 'Video File') : t('Ses Dosyasi', 'Audio File')}
                      </span>
                    </div>
                    {mediaDuration ? (
                      <div className="tts-usage-item">
                        <span className="tts-usage-label">{t('Sure', 'Duration')}</span>
                        <span className="tts-usage-value">{formatDuration(mediaDuration)}</span>
                      </div>
                    ) : null}
                    {wordCount > 0 && (
                      <div className="tts-usage-item">
                        <span className="tts-usage-label">{t('Kelime Sayisi', 'Word Count')}</span>
                        <span className="tts-usage-value">{wordCount}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Timestamp Options Card */}
              <div className="studio-side-card-v2 asr-timestamp-card">
                <div className="studio-side-card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{t('Zaman Damgası Seçenekleri', 'Timestamp Options')}</span>
                </div>
                <div className="asr-timestamp-options-body">
                  <label className="asr-checkbox-row">
                    <input
                      type="checkbox"
                      checked={enableTimestamps}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setEnableTimestamps(val);
                        if (!val) setEnableWordTimestamps(false);
                      }}
                    />
                    <div className="asr-checkbox-text">
                      <span className="asr-checkbox-title">{t('Zaman damgalarını dahil et', 'Include timestamps')}</span>
                      <small className="asr-checkbox-hint">
                        {t('Segment başlangıç ve bitiş sürelerini üretir.', 'Generates segment start and end timings.')}
                      </small>
                    </div>
                  </label>
                  <label className={`asr-checkbox-row ${!enableTimestamps ? 'disabled' : ''}`}>
                    <input
                      type="checkbox"
                      checked={enableWordTimestamps}
                      disabled={!enableTimestamps}
                      onChange={(e) => setEnableWordTimestamps(e.target.checked)}
                    />
                    <div className="asr-checkbox-text">
                      <span className="asr-checkbox-title">{t('Kelime zamanlarını dahil et', 'Include word timestamps')}</span>
                      <small className="asr-checkbox-hint">
                        {t('Her kelimenin kesin zamanı ve güven skorunu ekler.', 'Adds exact timing and confidence score for each word.')}
                      </small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="studio-side-actions">
                <button
                  className="asr-btn-start"
                  type="button"
                  disabled={!selectedFile || isLoading}
                  onClick={handleStart}
                >
                  {isLoading
                    ? jobStatus === 'uploading'
                      ? t(`Yukleniyor (%${uploadProgress})...`, `Uploading (${uploadProgress}%)...`)
                      : t('Desifre ediliyor...', 'Transcribing...')
                    : t('Desifreyi Baslat', 'Start Transcription')}
                </button>
              </div>
            </aside>
          </div>
          ) : (
            <div className="asr-realtime-grid">
              <div className="asr-realtime-main">
                {/* Realtime Stream Control Banner */}
                <div className="studio-section asr-realtime-banner">
                  <div className="asr-realtime-controls-row">
                    <div className="asr-realtime-info">
                      <div className="asr-realtime-status-badge-wrap">
                        <span className={`asr-status-dot ${isRealtimeActive ? 'active' : ''}`} />
                        <span className="asr-status-text">
                          {realtimeStatus === 'idle' && t('Hazır – Mikrofon Bekleniyor', 'Ready – Microphone Idle')}
                          {realtimeStatus === 'connecting' && t('Bağlanıyor...', 'Connecting...')}
                          {realtimeStatus === 'connected' && t('Hazırlanıyor...', 'Initializing...')}
                          {realtimeStatus === 'listening' && t('Canlı Dinleniyor (Konuşun...)', 'Listening Live (Speak now...)')}
                          {realtimeStatus === 'error' && t('Bağlantı Hatası', 'Connection Error')}
                        </span>
                      </div>
                      <p className="asr-realtime-desc">
                        {t(
                          'Mikrofonunuzdan alınan ses anlık olarak Konuşmatik ASR motoruna iletilir ve canlı olarak yazıya dökülür.',
                          'Audio from your microphone is streamed directly to the Konuşmatik ASR engine and transcribed live.'
                        )}
                      </p>
                    </div>

                    <div className="asr-realtime-btn-wrap">
                      {isRealtimeActive ? (
                        <button
                          type="button"
                          className="asr-mic-btn asr-mic-btn-stop"
                          onClick={stopRealtimeRecording}
                        >
                          <span className="asr-mic-icon-stop" />
                          <span>{t('Mikrofonu Durdur', 'Stop Microphone')}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="asr-mic-btn asr-mic-btn-start"
                          onClick={startRealtimeRecording}
                          disabled={realtimeStatus === 'connecting'}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                          </svg>
                          <span>{realtimeStatus === 'connecting' ? t('Bağlanıyor...', 'Connecting...') : t('Mikrofonu Başlat', 'Start Microphone')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {realtimeError && (
                    <div className="asr-realtime-error-box" role="alert">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{realtimeError}</span>
                    </div>
                  )}
                </div>

                {/* Live Drafting / Partial Box */}
                <div className="studio-section asr-partial-section">
                  <div className="studio-section-header">
                    <div className="asr-header-with-badge">
                      <h3>{t('Canlı Taslak (Anlık Akış)', 'Live Draft (Realtime Stream)')}</h3>
                      {isRealtimeActive && (
                        <span className="asr-live-indicator">
                          <span className="asr-pulsing-dot" />
                          {t('CANLI', 'LIVE')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="asr-partial-box">
                    {partialTranscript.text ? (
                      <div className="asr-partial-content">
                        <p className="asr-partial-text">{partialTranscript.text}</p>
                        {partialTranscript.words && partialTranscript.words.length > 0 && (
                          <div className="asr-word-tokens-box">
                            {partialTranscript.words.map((w, wIdx) => (
                              <span key={wIdx} className="asr-word-token">
                                {w.word}
                                <small>{formatTimestamp(w.start)}</small>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="asr-partial-placeholder">
                        {isRealtimeActive
                          ? t('Konuşmaya başlayın, algılanan kelimeler anlık taslak olarak burada belirecek...', 'Start speaking, recognized words will appear here live...')
                          : t('Mikrofonu başlattığınızda anlık konuşma akışı burada görünecektir.', 'When you start the microphone, the live stream will appear here.')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Finalized Turns */}
                <div className="studio-section asr-finals-section">
                  <div className="studio-section-header asr-transcript-header">
                    <h3>
                      {t('Tamamlanan Cümleler', 'Finalized Sentences')}
                      {finalTurns.length > 0 && ` (${finalTurns.length})`}
                    </h3>
                    {finalTurns.length > 0 && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="asr-copy-btn"
                          onClick={() => {
                            const full = finalTurns.map((f) => f.text).join('\n');
                            navigator.clipboard.writeText(full);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          {copied ? t('Kopyalandı!', 'Copied!') : t('Tümünü Kopyala', 'Copy All')}
                        </button>
                        <button
                          type="button"
                          className="asr-clear-btn"
                          onClick={() => setFinalTurns([])}
                        >
                          {t('Temizle', 'Clear')}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="asr-finals-list">
                    {finalTurns.length === 0 ? (
                      <div className="asr-empty-finals">
                        <p>{t('Henüz tamamlanmış bir cümle bulunmuyor.', 'No completed sentences yet.')}</p>
                      </div>
                    ) : (
                      finalTurns.map((turn, tIdx) => (
                        <div key={turn.id || tIdx} className="asr-final-card">
                          <div className="asr-final-header">
                            <span className="asr-final-time">{turn.time}</span>
                            {turn.segments && turn.segments.length > 0 && (
                              <span className="asr-segment-timestamp">
                                [{formatTimestamp(turn.segments[0].start)} &ndash; {formatTimestamp(turn.segments[turn.segments.length - 1].end)}]
                              </span>
                            )}
                          </div>
                          <p className="asr-final-text">{turn.text}</p>
                          {turn.words && turn.words.length > 0 && (
                            <div className="asr-word-tokens-box" style={{ marginTop: '8px' }}>
                              {turn.words.map((w, wIdx) => (
                                <span key={wIdx} className="asr-word-token" title={`${formatTimestamp(w.start)} - ${formatTimestamp(w.end)}${typeof w.probability === 'number' ? ` (${Math.round(w.probability * 100)}%)` : ''}`}>
                                  {w.word}
                                  <small>{formatTimestamp(w.start)}</small>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Realtime Sidebar */}
              <aside className="studio-side-v2 asr-realtime-side">
                {/* Live Timestamp Granularities Card */}
                <div className="studio-side-card-v2 asr-timestamp-card">
                  <div className="studio-side-card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{t('Canlı Zaman Damgası', 'Live Timestamps')}</span>
                  </div>
                  <div className="asr-timestamp-options-body">
                    <label className="asr-checkbox-row">
                      <input
                        type="checkbox"
                        checked={enableRealtimeTimestamps}
                        onChange={(e) => {
                          const val = e.target.checked;
                          updateRealtimeGranularities(val, val ? enableRealtimeWordTimestamps : false);
                        }}
                      />
                      <div className="asr-checkbox-text">
                        <span className="asr-checkbox-title">{t('Zaman damgalarını dahil et', 'Include timestamps')}</span>
                        <small className="asr-checkbox-hint">
                          {t('Segment başlangıç ve bitiş sürelerini anlık iletir.', 'Streams segment boundaries live.')}
                        </small>
                      </div>
                    </label>
                    <label className={`asr-checkbox-row ${!enableRealtimeTimestamps ? 'disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={enableRealtimeWordTimestamps}
                        disabled={!enableRealtimeTimestamps}
                        onChange={(e) => {
                          updateRealtimeGranularities(enableRealtimeTimestamps, e.target.checked);
                        }}
                      />
                      <div className="asr-checkbox-text">
                        <span className="asr-checkbox-title">{t('Kelime zamanlarını dahil et', 'Include word timestamps')}</span>
                        <small className="asr-checkbox-hint">
                          {t('Her kelimenin kesin zamanını ve güvenini canlı iletir.', 'Streams live word timings and probabilities.')}
                        </small>
                      </div>
                    </label>
                  </div>
                  <div className="asr-live-tip">
                    <small>
                      ℹ {t('Ayarlar yayın sırasında anlık olarak güncellenir (session.update).', 'Preferences update instantly mid-session (session.update).')}
                    </small>
                  </div>
                </div>

                {/* Engine Info Card */}
                <div className="studio-side-card-v2">
                  <div className="studio-side-card-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>{t('Canlı ASR Parametreleri', 'Realtime Parameters')}</span>
                  </div>
                  <div className="tts-usage-stats">
                    <div className="tts-usage-item">
                      <span className="tts-usage-label">{t('Model', 'Model')}</span>
                      <span className="tts-usage-value" style={{ color: '#E8356D' }}>{ASR_MODEL_DISPLAY_NAME} V2</span>
                    </div>
                    <div className="tts-usage-item">
                      <span className="tts-usage-label">{t('Ses Kodlaması', 'Audio Encoding')}</span>
                      <span className="tts-usage-value">16 kHz PCM 16-bit</span>
                    </div>
                    <div className="tts-usage-item">
                      <span className="tts-usage-label">{t('Protokol', 'Protocol')}</span>
                      <span className="tts-usage-value">WebSocket Duplex</span>
                    </div>
                    <div className="tts-usage-item">
                      <span className="tts-usage-label">{t('İşlem Gecikmesi', 'Latency')}</span>
                      <span className="tts-usage-value">~150ms Chunk</span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="studio-features service-features asr-features">
          <div className="service-features-intro">
            <h3>{t('Neden Konusmatik Desifre?', 'Why Konusmatik Transcription?')}</h3>
            <p className="studio-features-lead">
              {t(
                'Kapali ag, hassas toplanti kayitlari ve kurum ici arsivler icin local desifre mimarisi planlanabilir.',
                'A local transcription architecture can be planned for closed networks, sensitive meeting recordings, and internal archives.'
              )}
            </p>
          </div>
          <div className="studio-features-grid">
            {asrFeatures.map((f, index) => (
              <StarBorder
                as="div"
                key={f.title}
                className="service-feature-star"
                color={index % 2 === 0 ? '#6c3ce9' : '#d21784'}
                speed="6s"
                thickness={2}
                backgroundColor="transparent"
                borderColor="transparent"
              >
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
            <button className="tts-package-close" type="button" aria-label={t('Uyarayi kapat', 'Close warning')} onClick={() => setShowPackagePopup(false)}>
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
            <h3 id="asr-package-title">{t('Once paket satin almaniz gerek', 'You need to purchase a plan first')}</h3>
            <p>{t(packageMessage.tr, packageMessage.en)}</p>
            <button
              className="tts-package-confirm"
              type="button"
              onClick={() => {
                setShowPackagePopup(false);
                onNavigate?.('pricing');
              }}
            >
              {t('Paketler sayfasina git', 'Go to Plans')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
