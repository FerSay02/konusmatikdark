import {
  ASR_V1_ID,
  errorsRetry,
  modelsList,
  modelsRetrieve,
  sttJson,
  sttSrt,
  sttVerboseWords,
  ttsMp3Speed,
  ttsPcmStream,
  ttsWav,
} from './docExamples.js';

export const API_BASE_REST = 'https://api.konusmatik.com/api/v1';
export const API_BASE_REALTIME_WS = 'wss://api.konusmatik.com/api/v1/realtime';
export const API_BASE_NATIVE_REALTIME_WS = 'wss://api.konusmatik.com/api/v1/realtime/transcriptions';

export const quickStartSteps = [
  { num: '01', title: 'API Anahtarınızı Edinin', titleEn: 'Get Your API Key', desc: 'Konuşmatik web panelinizden (Profil / API Anahtarları) bir anahtar oluşturun ve KONUSMATIK_API_KEY ortam değişkeninde saklayın.', descEn: 'Create an API key from your profile (Profile / API Keys) and store it in the KONUSMATIK_API_KEY environment variable.' },
  { num: '02', title: 'OpenAI SDK veya REST Seçin', titleEn: 'Choose OpenAI SDK or REST', desc: 'Canonical uç noktalar resmi OpenAI Python SDK ve cURL istekleriyle doğrudan uyumludur. Yüksek hacimli toplu işler için Kurumsal Asenkron API kullanın.', descEn: 'Canonical endpoints are directly compatible with the OpenAI Python SDK and cURL requests. For large batch processing, use the Corporate Async API.' },
  { num: '03', title: 'Üretim Modelleriyle Çalışın', titleEn: 'Work with Production Models', desc: `Resmi model isimleri: ${ASR_V1_ID}, konusmatik-asr-v2 ve konusmatik-tts. TTS sesleri: sila, deniz, taha.`, descEn: `Official model names: ${ASR_V1_ID}, konusmatik-asr-v2, and konusmatik-tts. Native TTS voices: sila, deniz, taha.` },
];

export const sdkSetupExamples = {
  python: `pip install openai

# Linux / macOS
export KONUSMATIK_API_KEY="km_live_..."

# Windows PowerShell
$env:KONUSMATIK_API_KEY="km_live_..."

# Windows CMD
set KONUSMATIK_API_KEY=km_live_...`,
  javascript: `npm install openai

# Linux / macOS
export KONUSMATIK_API_KEY="km_live_..."

# Windows PowerShell
$env:KONUSMATIK_API_KEY="km_live_..."

# Windows CMD
set KONUSMATIK_API_KEY=km_live_...`,
  curl: `# Linux / macOS
export KONUSMATIK_API_KEY="km_live_..."

# Windows PowerShell
$env:KONUSMATIK_API_KEY="km_live_..."

# Windows CMD
set KONUSMATIK_API_KEY=km_live_...`,
};

export const openaiSdkAsrExample = {
  python: sttJson,
  javascript: `import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({
  apiKey: process.env.KONUSMATIK_API_KEY,
  baseURL: "${API_BASE_REST}",
});

const transcript = await client.audio.transcriptions.create({
  model: "konusmatik-asr-v2",
  file: fs.createReadStream("audio.wav"),
});

console.log("Deşifre:", transcript.text);`,
};

export const openaiSdkTtsExample = {
  python: ttsWav,
  javascript: `import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({
  apiKey: process.env.KONUSMATIK_API_KEY,
  baseURL: "${API_BASE_REST}",
});

const speech = await client.audio.speech.create({
  model: "konusmatik-tts",
  voice: "sila",
  input: "Merhaba, Konuşmatik API servisi.",
  response_format: "wav",
});

const buffer = Buffer.from(await speech.arrayBuffer());
await fs.promises.writeFile("output.wav", buffer);`,
};

export const modelsData = [
  {
    id: ASR_V1_ID,
    name: 'Konuşmatik ASR v1',
    type: 'Konuşma Tanıma (STT)',
    typeEn: 'Speech to Text (ASR)',
    description: 'Ses dosyalarını ve canlı akışları yüksek doğrulukla Türkçe metne dönüştürür. OpenAI uyumlu realtime uç noktasında desteklenen üretim modelidir.',
    descriptionEn: 'Transcribes audio files and live streams into accurate Turkish text. The supported production model on the OpenAI-compatible realtime endpoint.',
    inputFormat: 'multipart/form-data (WAV, MP3, M4A, WEBM, OGG, FLAC) · WebSocket PCM16',
    inputFormatEn: 'multipart/form-data (WAV, MP3, M4A, WEBM, OGG, FLAC) · WebSocket PCM16',
    outputFormat: 'json, text, verbose_json, srt, vtt',
    outputFormatEn: 'json, text, verbose_json, srt, vtt',
    latency: '14 Eşzamanlı GPU İnference',
    latencyEn: '14 concurrent GPU inferences',
  },
  {
    id: 'konusmatik-asr-v2',
    name: 'Konuşmatik ASR v2',
    type: 'Konuşma Tanıma (STT)',
    typeEn: 'Speech to Text (ASR)',
    description: 'Gelişmiş mimari ile ses ve video dosyalarını yüksek doğruluk ve kelime/segment zaman damgalarıyla Türkçe metne dönüştürür. REST ve yerel realtime uç noktalarında kullanılır.',
    descriptionEn: 'Transcribes audio and video files with high accuracy and word/segment timestamps. Used on REST and native realtime endpoints.',
    inputFormat: 'multipart/form-data (WAV, MP3, M4A, WEBM, OGG, FLAC) · WebSocket PCM16',
    inputFormatEn: 'multipart/form-data (WAV, MP3, M4A, WEBM, OGG, FLAC) · WebSocket PCM16',
    outputFormat: 'json, text, verbose_json, srt, vtt',
    outputFormatEn: 'json, text, verbose_json, srt, vtt',
    latency: '14 Eşzamanlı GPU İnference',
    latencyEn: '14 concurrent GPU inferences',
  },
  {
    id: 'konusmatik-tts',
    name: 'Konuşmatik TTS',
    type: 'Doğal Ses Sentezi (TTS)',
    typeEn: 'Text to Speech (TTS)',
    description: 'Türkçe metinleri doğal ve akıcı seslendirerek 48 kHz 16-bit mono WAV, MP3, Opus, AAC, FLAC veya streaming PCM çıktısı üretir.',
    descriptionEn: 'Synthesizes natural Turkish speech into 48 kHz 16-bit mono WAV, MP3, Opus, AAC, FLAC, or streaming PCM output.',
    inputFormat: 'JSON body (max 10.000 karakter)',
    inputFormatEn: 'JSON body (max 10,000 chars)',
    outputFormat: 'audio/wav, audio/mpeg, audio/ogg, audio/aac, audio/flac, audio/pcm',
    outputFormatEn: 'audio/wav, audio/mpeg, audio/ogg, audio/aac, audio/flac, audio/pcm',
    latency: '32 Eşzamanlı GPU İnference',
    latencyEn: '32 concurrent GPU inferences',
  },
];

export const modelsCodeExamples = {
  python: modelsList,
  curl: `curl "${API_BASE_REST}/models" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"`,
  javascript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.KONUSMATIK_API_KEY,
  baseURL: "${API_BASE_REST}",
});

const models = await client.models.list();
console.log(models.data.map(m => m.id));`,
};

export const modelsRetrieveCodeExamples = {
  python: modelsRetrieve,
  curl: `curl "${API_BASE_REST}/models/${ASR_V1_ID}" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"`,
};

export const ttsVoicesData = [
  { id: 'sila', name: 'Sıla', gender: 'Kadın', genderEn: 'Female', style: 'Doğal & Akıcı', styleEn: 'Natural & Fluent', desc: 'Asistan, müşteri deneyimi, eğitim ve uzun anlatımlar için dengeli doğal kadın sesi. OpenAI eşlemeleri: alloy, nova, shimmer, woman, kadin.', descEn: 'Balanced natural female voice for assistants, customer experience, and education. Mapped aliases: alloy, nova, shimmer, woman, kadin.' },
  { id: 'deniz', name: 'Deniz', gender: 'Kadın', genderEn: 'Female', style: 'Kurumsal & Net', styleEn: 'Corporate & Clear', desc: 'Haber bültenleri, kurumsal duyurular ve resmi açıklamalar için net kadın sesi. OpenAI eşlemeleri: echo, onyx, fable.', descEn: 'Clear professional female voice for corporate announcements and media. Mapped aliases: echo, onyx, fable.' },
  { id: 'taha', name: 'Taha', gender: 'Erkek', genderEn: 'Male', style: 'Dinamik & Güçlü', styleEn: 'Dynamic & Strong', desc: 'Diyaloglar, kısa bilgilendirmeler ve dinamik içerikler için modern erkek sesi. OpenAI eşlemeleri: man, erkek.', descEn: 'Modern dynamic male voice for dialogues, notifications, and media. Mapped aliases: man, erkek.' },
];

export const ttsParameters = [
  { name: 'model', type: 'string', required: true, defaultVal: 'konusmatik-tts', desc: 'Üretim TTS model adı: konusmatik-tts', descEn: 'Production TTS model ID: konusmatik-tts' },
  { name: 'input', type: 'string', required: true, defaultVal: '-', desc: 'Seslendirilecek metin (Maksimum 10.000 karakter).', descEn: 'Text to synthesize (Maximum 10,000 characters).' },
  { name: 'voice', type: 'string', required: true, defaultVal: 'sila', desc: 'Ses seçimi: sila (Kadın), deniz (Kadın), taha (Erkek). OpenAI eşlemeleri: alloy, nova, shimmer -> sila; echo, onyx, fable -> deniz; woman/kadin -> sila; man/erkek -> taha.', descEn: 'Voice selection: sila (Female), deniz (Female), taha (Male). Mapped aliases: alloy, nova, shimmer -> sila; echo, onyx, fable -> deniz; woman/kadin -> sila; man/erkek -> taha.' },
  { name: 'response_format', type: 'string', required: false, defaultVal: 'wav', desc: 'Desteklenen formatlar: wav (varsayılan), mp3, opus (Ogg kapsayıcısında), aac, flac, pcm (yalnızca streaming). Dikkat: OpenAI varsayılanı mp3 iken Konuşmatik varsayılanı wav formatıdır; mp3 için açıkça response_format="mp3" belirtilmelidir.', descEn: 'Supported formats: wav (default), mp3, opus (in Ogg), aac, flac, pcm (streaming only). Note: Konuşmatik default is wav (OpenAI default is mp3); specify response_format="mp3" explicitly if mp3 is desired.' },
  { name: 'speed', type: 'number', required: false, defaultVal: '1.0', desc: 'Konuşma hızı çarpanı (0.25 - 4.0). wav, mp3, opus, aac ve flac formatlarında uygulanır; pcm streaming akışında uygulanmaz.', descEn: 'Speech speed multiplier (0.25 - 4.0). Applied for wav, mp3, opus, aac, flac; not applied for pcm streaming.' },
  { name: 'instructions', type: 'string', required: false, defaultVal: '-', desc: 'Genişletilmiş talimat alanı; parametre kabul edilir ancak işleme uygulanmaz.', descEn: 'Extended instructions parameter; accepted, but not applied.' },
];

export const ttsSupportedFormatsTable = [
  { format: 'wav', mime: 'audio/wav', isDefault: true, desc: 'Varsayılan format. 48 kHz / 16-bit / mono kayıpsız ses çıktısı. OpenAI varsayılanı mp3 iken Konuşmatik varsayılanı wav formatıdır.', descEn: 'Default format. 48 kHz / 16-bit / mono lossless audio. Konuşmatik default is wav (OpenAI default is mp3).' },
  { format: 'mp3', mime: 'audio/mpeg', isDefault: false, desc: 'Sıkıştırılmış MP3 ses akışı. OpenAI varsayılanıdır; Konuşmatik için açıkça istenmelidir.', descEn: 'Compressed MP3 audio. OpenAI default; must be explicitly requested in Konuşmatik.' },
  { format: 'opus', mime: 'audio/ogg', isDefault: false, desc: 'Ogg kapsayıcısı içinde düşük gecikmeli Opus ses akışı.', descEn: 'Low-latency Opus audio in an Ogg container.' },
  { format: 'aac', mime: 'audio/aac', isDefault: false, desc: 'Gelişmiş ses kodlaması (AAC) akışı.', descEn: 'Advanced Audio Coding (AAC) stream.' },
  { format: 'flac', mime: 'audio/flac', isDefault: false, desc: 'Kayıpsız sıkıştırılmış FLAC ses akışı.', descEn: 'Lossless compressed FLAC audio stream.' },
  { format: 'pcm', mime: 'audio/pcm', isDefault: false, desc: 'Ham 16-bit little-endian PCM ses verisi (48 kHz mono). Yalnızca streaming ile kullanılır; speed parametresi uygulanmaz.', descEn: 'Raw 16-bit little-endian PCM (48 kHz mono). Only used with streaming; speed parameter is not applied.' },
];

export const ttsCodeExamples = {
  python: ttsWav,
  curl: `curl -X POST "${API_BASE_REST}/audio/speech" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "konusmatik-tts",
    "voice": "sila",
    "input": "Merhaba, Konuşmatik'e hoş geldiniz.",
    "response_format": "wav"
  }' \\
  --output merhaba.wav`,
};

export const ttsSpeedCodeExamples = {
  python: ttsMp3Speed,
  curl: `curl -X POST "${API_BASE_REST}/audio/speech" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "konusmatik-tts",
    "voice": "sila",
    "input": "Merhaba, Konuşmatik'e hoş geldiniz.",
    "response_format": "mp3",
    "speed": 1.25
  }' \\
  --output merhaba.mp3`,
};

export const streamingTtsSpecs = [
  { title: 'Model', titleEn: 'Model', value: 'konusmatik-tts' },
  { title: 'Desteklenen sesler', titleEn: 'Supported voices', value: 'sila · deniz · taha' },
  { title: 'Çıktı formatı', titleEn: 'Output format', value: '48 kHz / 16-bit / mono (PCM16LE)' },
  {
    title: 'Gerekli parametre',
    titleEn: 'Required parameter',
    value: 'response_format="pcm"',
    detail: 'Streaming TTS isteklerinde response_format değeri pcm olmalıdır. Düşük gecikme için önerilir.',
    detailEn: 'For Streaming TTS requests, response_format must be set to pcm. Recommended for low latency.',
  },
  {
    title: 'Hız kuralı',
    titleEn: 'Speed rule',
    value: 'speed uygulanmaz',
    valueEn: 'speed not applied',
    detail: 'PCM streaming çıktısı normal hızda üretilir; speed parametresi bu modda işletilmez.',
    detailEn: 'PCM streaming output is produced at normal speed; speed parameter is not applied in this mode.',
  },
];

export const streamingTtsCodeExamples = {
  python: ttsPcmStream,
};

export const streamingTtsResponseHeaders = `Content-Type: audio/pcm
X-Audio-Sample-Rate: 48000
X-Audio-Channels: 1
X-Audio-Format: pcm_s16le
X-Request-ID: <request_id>`;

export const asrParameters = [
  { name: 'file', type: 'file', required: true, defaultVal: '-', desc: 'Ses veya video dosyası (Maksimum 100 MB, Maksimum 3 saat / 10.800s. Daha büyük dosyalar HTTP 413 file_too_large hatası döner).', descEn: 'Audio or video file (Max 100 MB, Max 3 hours / 10,800s. Larger files return HTTP 413 file_too_large).' },
  { name: 'model', type: 'string', required: true, defaultVal: 'konusmatik-asr-v2', desc: `Üretim ASR model kimliği: ${ASR_V1_ID} veya konusmatik-asr-v2. Her iki model de aynı şemayı döndürür.`, descEn: `Production ASR model ID: ${ASR_V1_ID} or konusmatik-asr-v2. Both return the same schema.` },
  { name: 'language', type: 'string', required: false, defaultVal: 'tr', desc: 'Ses dili (Varsayılan: tr). Konuşmatik Türkçe için optimize edilmiştir; diğer dil kodları reddedilmez ve Türkçe olarak işlenir (warn politikası; yerel WebSocket uç noktasında katı politika durumunda unsupported_language).', descEn: 'Audio language (Default: tr). Other language codes are not rejected and transcribed as Turkish (warn policy; unsupported_language under strict native policy).' },
  { name: 'response_format', type: 'string', required: false, defaultVal: 'json', desc: 'Çıktı formatı: json (varsayılan), text, verbose_json, srt, vtt.', descEn: 'Output format: json (default), text, verbose_json, srt, vtt.' },
  { name: 'timestamp_granularities[]', type: 'array', required: false, defaultVal: '-', desc: 'Zaman damgası kırılımı: ["segment"], ["word"] veya her ikisi. verbose_json ile birlikte uygulanır; json formatında yoksayılır.', descEn: 'Timestamp granularities: ["segment"], ["word"], or both. Applies with verbose_json; ignored with json.' },
  { name: 'prompt', type: 'string', required: false, defaultVal: '-', desc: 'İsteğe bağlı istem metni; parametre kabul edilir ancak çıkarıma uygulanmaz.', descEn: 'Optional prompt text; accepted, but not applied.' },
  { name: 'temperature', type: 'number', required: false, defaultVal: '0', desc: 'Örnekleme sıcaklığı; parametre kabul edilir ancak çıkarıma uygulanmaz.', descEn: 'Sampling temperature; accepted, but not applied.' },
];

export const asrSupportedFormats = ['WAV', 'MP3', 'M4A', 'WEBM', 'OGG', 'FLAC'];

export const asrCodeExamples = {
  python: sttJson,
  curl: `curl -X POST "${API_BASE_REST}/audio/transcriptions" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -F "model=konusmatik-asr-v2" \\
  -F "file=@ornek.wav"`,
};

export const asrVerboseWordsCodeExamples = {
  python: sttVerboseWords,
};

export const asrSrtCodeExamples = {
  python: sttSrt,
};

export const asrSpeedTip = {
  title: 'Hız İpucu (16 kHz Mono Dönüştürme)',
  titleEn: 'Speed Tip (16 kHz Mono Pre-conversion)',
  desc: 'Ses dosyasını yüklemeden önce 16 kHz mono formatına dönüştürmek işlem süresini belirgin biçimde kısaltır (uzun kayıtlarda %47 hızlanma ölçülmüştür):',
  descEn: 'Converting audio to 16 kHz mono before upload noticeably shortens processing time (a 47% speedup was measured on long recordings):',
  command: 'ffmpeg -i girdi.mp3 -ac 1 -ar 16000 cikti.wav',
};

export const asrLongFilesNote = {
  title: 'Uzun Dosyalar ve Cloudflare 100 Saniye Limiti',
  titleEn: 'Long Files & Cloudflare 100-Second Limit',
  desc: 'Senkron HTTP istekleri Cloudflare\'in 100 saniye zaman aşımı sınırına tabidir. Uzun kayıtlar için asenkron kurumsal iş akışını kullanın: POST /api/v1/corporate/asr/jobs (dosya) veya /asr/jobs/url (URL) -> GET .../jobs/{id} durum takibi -> GET .../jobs/{id}/result ile sonuç alma; isteğe bağlı webhook bildirimi (/api/v1/corporate/webhooks).',
  descEn: 'Synchronous HTTP requests pass through Cloudflare\'s 100-second timeout limit. For long recordings use the asynchronous job path: POST /api/v1/corporate/asr/jobs (file) or /asr/jobs/url (URL) -> GET .../jobs/{id} for status -> GET .../jobs/{id}/result; optionally with webhooks (/api/v1/corporate/webhooks).',
};

export const realtimeComparisonTable = [
  {
    feature: 'Bağlantı Adresi',
    featureEn: 'Endpoint Address',
    openai: `wss://api.konusmatik.com/api/v1/realtime?model=${ASR_V1_ID}`,
    native: 'wss://api.konusmatik.com/api/v1/realtime/transcriptions',
  },
  {
    feature: 'İstemci Desteği',
    featureEn: 'Client Support',
    openai: 'openai SDK client.realtime.connect(...)',
    native: 'Tüm standart WebSocket istemcileri (any WebSocket client)',
  },
  {
    feature: 'Desteklenen Modeller',
    featureEn: 'Supported Models',
    openai: `Yalnızca ${ASR_V1_ID} (v2 seçilirse realtime_engine_unsupported)`,
    native: `${ASR_V1_ID}, konusmatik-asr-v2`,
  },
  {
    feature: 'Ses Giriş Formatı',
    featureEn: 'Audio Input Format',
    openai: 'JSON içinde base64 PCM16 (input_audio_buffer.append), varsayılan 24 kHz (16, 24, 44.1, 48 kHz seçilebilir)',
    native: 'Binary PCM16 LE, 16 kHz mono WebSocket çerçeveleri',
  },
  {
    feature: 'Söz Sırası Bitişi',
    featureEn: 'Turn Ending',
    openai: 'Sunucu VAD (Server VAD) veya istemci commit',
    native: 'İstemci VAD / session.stop mesajı',
  },
  {
    feature: 'Sonuç Olayları',
    featureEn: 'Result Events',
    openai: '...input_audio_transcription.delta / .completed',
    native: 'transcript.partial / transcript.final',
  },
];

export const corporateAsrPollingExample = {
  python: `import os
import time
import requests

API_KEY = os.environ["KONUSMATIK_API_KEY"]
BASE_URL = "${API_BASE_REST}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

def transcribe_audio_corporate_async(file_path: str) -> str:
    # 1. İşi Oluştur (HTTP 201 Created döner, bağlantı inference süresince açık kalmaz)
    with open(file_path, "rb") as f:
        resp = requests.post(
            f"{BASE_URL}/corporate/asr/jobs",
            headers=HEADERS,
            files={"file": (os.path.basename(file_path), f, "audio/wav")},
            data={"language": "tr"}
        )
    resp.raise_for_status()
    job_id = resp.json()["id"]
    print(f"İş başarıyla kabul edildi. Job ID: {job_id}")

    # 2. Polling ile Durumu Sorgula (2-3 saniyelik makul aralık)
    while True:
        poll_resp = requests.get(f"{BASE_URL}/corporate/asr/jobs/{job_id}", headers=HEADERS)
        poll_resp.raise_for_status()
        job_data = poll_resp.json()
        status = job_data["status"]

        if status == "completed":
            print("İş tamamlandı!")
            break
        elif status == "failed":
            raise RuntimeError(f"İş başarısız oldu: {job_data.get('error_message')}")

        print(f"Mevcut durum: {status}... Bekleniyor.")
        time.sleep(2.5)

    # 3. Sonucu Al
    result_resp = requests.get(f"{BASE_URL}/corporate/asr/jobs/{job_id}/result", headers=HEADERS)
    result_resp.raise_for_status()
    return result_resp.json()["text"]

if __name__ == "__main__":
    text = transcribe_audio_corporate_async("toplanti_kaydi.wav")
    print("\\nTranskripsiyon Sonucu:\\n", text)`,
  httpx: `import os
import time
import httpx

API_KEY = os.environ["KONUSMATIK_API_KEY"]
BASE_URL = "${API_BASE_REST}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

with httpx.Client(base_url=BASE_URL, headers=HEADERS, timeout=120) as client:
    # 1. Create job
    with open("toplanti.wav", "rb") as audio_file:
        response = client.post(
            "/corporate/asr/jobs",
            files={"file": ("toplanti.wav", audio_file, "audio/wav")},
            data={"language": "tr"},
        )
    response.raise_for_status()
    job_id = response.json()["id"]

    # 2. Polling
    while True:
        job = client.get(f"/corporate/asr/jobs/{job_id}").json()
        if job["status"] == "completed":
            break
        if job["status"] == "failed":
            raise RuntimeError(job.get("error_message"))
        time.sleep(2.5)

    # 3. Result
    result = client.get(f"/corporate/asr/jobs/{job_id}/result")
    result.raise_for_status()
    print(result.json()["text"])`,
  curl: `# 1. İş Oluşturma (Anında 201 Created döner)
curl -X POST "${API_BASE_REST}/corporate/asr/jobs" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -F "file=@toplanti.wav" \\
  -F "language=tr"

# 2. Durum Sorgulama (Polling)
curl "${API_BASE_REST}/corporate/asr/jobs/JOB_ID_BURAYA" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"

# 3. Metin Sonucunu Alma
curl "${API_BASE_REST}/corporate/asr/jobs/JOB_ID_BURAYA/result" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"`,
};

export const corporateTtsPollingExample = {
  python: `import os
import time
import requests

API_KEY = os.environ["KONUSMATIK_API_KEY"]
BASE_URL = "${API_BASE_REST}"
HEADERS = {"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"}

def synthesize_corporate_async(text: str, output_path: str = "output.wav"):
    # 1. İşi Oluştur (Anında 201 Created döner)
    resp = requests.post(
        f"{BASE_URL}/corporate/tts/jobs",
        headers=HEADERS,
        json={
            "text": text,
            "voice": "deniz",
            "synthesis_options": {"format": "wav", "speed": 1.0}
        }
    )
    resp.raise_for_status()
    job_id = resp.json()["id"]
    print(f"TTS İşi oluşturuldu. Job ID: {job_id}")

    # 2. Polling ile Takip Et
    while True:
        poll_resp = requests.get(f"{BASE_URL}/corporate/tts/jobs/{job_id}", headers={"Authorization": f"Bearer {API_KEY}"})
        poll_resp.raise_for_status()
        job_data = poll_resp.json()
        status = job_data["status"]

        if status == "completed":
            print("Ses sentezi tamamlandı!")
            break
        elif status == "failed":
            raise RuntimeError(f"Hata: {job_data.get('error_message')}")

        time.sleep(2.0)

    # 3. Sesi İndir (Stream veya Signed Download URL)
    stream_resp = requests.get(f"{BASE_URL}/corporate/tts/jobs/{job_id}/stream", headers={"Authorization": f"Bearer {API_KEY}"})
    stream_resp.raise_for_status()
    with open(output_path, "wb") as f:
        f.write(stream_resp.content)
    print(f"WAV Ses dosyası kaydedildi: {output_path}")

if __name__ == "__main__":
    synthesize_corporate_async("Kurumsal toplu seslendirme sistemi.")`,
  httpx: `import os
import time
import httpx

API_KEY = os.environ["KONUSMATIK_API_KEY"]
BASE_URL = "${API_BASE_REST}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

with httpx.Client(base_url=BASE_URL, headers=HEADERS, timeout=120) as client:
    # 1. Create job
    response = client.post(
        "/corporate/tts/jobs",
        json={
            "text": "Kurumsal toplu seslendirme sistemi.",
            "voice": "deniz",
            "synthesis_options": {"format": "wav", "speed": 1.0},
        },
    )
    response.raise_for_status()
    job_id = response.json()["id"]

    # 2. Polling
    while True:
        job = client.get(f"/corporate/tts/jobs/{job_id}").json()
        if job["status"] == "completed":
            break
        if job["status"] == "failed":
            raise RuntimeError(job.get("error_message"))
        time.sleep(2)

    # 3. Download
    audio = client.get(f"/corporate/tts/jobs/{job_id}/stream")
    audio.raise_for_status()
    with open("kurumsal_ses.wav", "wb") as output_file:
        output_file.write(audio.content)`,
  curl: `# 1. TTS İşi Oluşturma
curl -X POST "${API_BASE_REST}/corporate/tts/jobs" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"Kurumsal ses sentezi","voice":"deniz","synthesis_options":{"format":"wav","speed":1.0}}'

# 2. Durum Sorgulama
curl "${API_BASE_REST}/corporate/tts/jobs/JOB_ID_BURAYA" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"

# 3. Ses Akışını İndirme (WAV)
curl "${API_BASE_REST}/corporate/tts/jobs/JOB_ID_BURAYA/stream" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  --output kurumsal_ses.wav`,
};

export const realtimeAudioSpec = [
  { label: 'Format & Kodlama', labelEn: 'Encoding', value: 'PCM16 Little-Endian', valueEn: 'PCM16 Little-Endian' },
  { label: 'Örnekleme Hızı', labelEn: 'Sample Rate', value: '24 kHz (16 kHz, 44.1 kHz, 48 kHz seçilebilir; 16 kHz yeniden örneklenmeden işlenir)', valueEn: '24 kHz (16 kHz, 44.1 kHz, 48 kHz selectable; 16 kHz processed without resampling)' },
  { label: 'Kanal', labelEn: 'Channels', value: '1 (Mono)', valueEn: '1 (Mono)' },
  { label: 'Aktarım', labelEn: 'Transport', value: 'WebSocket Base64 JSON Chunk', valueEn: 'WebSocket Base64 JSON chunks' },
  { label: 'VAD (Ses Algılama)', labelEn: 'Voice Activity Detection', value: 'Server VAD (turn_detection: silence_duration_ms 200–3000 varsayılan 750, prefix_padding_ms 0–1000 varsayılan 300; threshold kabul edilir ancak uygulanmaz) veya İstemci Commit (turn_detection: null)', valueEn: 'Server VAD (turn_detection: silence_duration_ms 200–3000 default 750, prefix_padding_ms 0–1000 default 300; threshold accepted but not applied) or Client Commit (turn_detection: null)' },
];

export const realtimeEventTable = [
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'session.created', desc: 'Bağlantı kabul edilince varsayılan oturum objesi döner.', descEn: 'Returned after connection with the default session object.' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'session.update / transcription_session.update', desc: `Model (${ASR_V1_ID}), ses formatı ve VAD ayarlarını yapılandırır (server_vad: silence_duration_ms 200–3000 varsayılan 750, prefix_padding_ms 0–1000 varsayılan 300, threshold kabul edilir ancak uygulanmaz; veya turn_detection: null).`, descEn: `Configures model (${ASR_V1_ID}), audio format, and VAD settings (server_vad: silence_duration_ms 200–3000 default 750, prefix_padding_ms 0–1000 default 300, threshold accepted but not applied; or turn_detection: null).` },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'session.updated / transcription_session.updated', desc: 'Güncellenen oturum yapılandırmasını onaylar.', descEn: 'Confirms the updated session configuration.' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'input_audio_buffer.append', desc: 'Base64 PCM16 ses parçasını gönderir.', descEn: 'Sends a Base64 PCM16 audio chunk.' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'input_audio_buffer.commit', desc: 'Mevcut tamponu kapatır; committed ve completed olaylarını tetikler (boş tamponda commit input_audio_buffer_commit_empty hatası verir).', descEn: 'Commits current buffer; triggers committed and completed events (calling commit on an empty buffer triggers input_audio_buffer_commit_empty).' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'input_audio_buffer.committed', desc: 'Tamponun işlenmek üzere kapatıldığını onaylar.', descEn: 'Confirms that the audio buffer has been committed for processing.' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'input_audio_buffer.clear', desc: 'Tampondaki bekleyen ses verilerini temizler.', descEn: 'Clears pending audio data in buffer.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'input_audio_buffer.cleared', desc: 'Tampondaki ses verilerinin temizlendiğini onaylar.', descEn: 'Confirms that the pending audio buffer has been cleared.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'conversation.item.input_audio_transcription.delta', desc: 'Canlı transkripsiyon parçasını (kelime/hece) döner.', descEn: 'Returns real-time transcription deltas.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'conversation.item.input_audio_transcription.completed', desc: 'Server VAD sessizlik tespit ettiğinde veya commit sonrasında nihai cümleyi döner.', descEn: 'Returns the completed sentence after server-side VAD detects silence or after commit.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'error', desc: '{"type":"error","error":{"type","code","message","param"}} hata yapısı. Örnek kodlar: invalid_value (param = tam alan yolu), invalid_base64, input_audio_buffer_commit_empty, model_mismatch, realtime_engine_unsupported, quota_exceeded, idle_timeout.', descEn: '{"type":"error","error":{"type","code","message","param"}} error event shape. Example codes: invalid_value (param = exact field path), invalid_base64, input_audio_buffer_commit_empty, model_mismatch, realtime_engine_unsupported, quota_exceeded, idle_timeout.' },
];

export const openAiRealtimeCodeExamples = {
  python: `import asyncio
import base64
import os

import sounddevice as sd
from openai import AsyncOpenAI

SAMPLE_RATE = 24000
CHANNELS = 1
BLOCK_SIZE = 2400  # 100 ms


async def main():
    client = AsyncOpenAI(
        api_key=os.environ["KONUSMATIK_API_KEY"],
        base_url="${API_BASE_REST}",
    )

    audio_queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    def audio_callback(indata, frames, time, status):
        if status:
            print(status)

        loop.call_soon_threadsafe(
            audio_queue.put_nowait,
            bytes(indata),
        )

    async with client.realtime.connect(
        model="${ASR_V1_ID}",
    ) as connection:
        await connection.session.update(
            session={
                "input_audio_format": "pcm16",
                "turn_detection": {
                    "type": "server_vad",
                    "silence_duration_ms": 750,
                    "prefix_padding_ms": 300,
                },
            }
        )

        async def send_audio():
            while True:
                pcm_chunk = await audio_queue.get()
                audio_b64 = base64.b64encode(pcm_chunk).decode("ascii")

                await connection.input_audio_buffer.append(
                    audio=audio_b64,
                )

        async def receive_events():
            async for event in connection:
                if event.type == "conversation.item.input_audio_transcription.delta":
                    print(event.delta, end="", flush=True)

                elif event.type == "conversation.item.input_audio_transcription.completed":
                    print(f"\\nFinal: {event.transcript}")

                elif event.type == "error":
                    print(f"\\nHata: {event}")

        with sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype="int16",
            blocksize=BLOCK_SIZE,
            callback=audio_callback,
        ):
            print("Dinleniyor... Ctrl+C ile çıkabilirsiniz.")

            await asyncio.gather(
                send_audio(),
                receive_events(),
            )


if __name__ == "__main__":
    asyncio.run(main())`,
};

export const realtimeCodeExamples = {
  python: `import asyncio
import base64
import json
import os
import sys
import sounddevice as sd
import websockets

API_KEY = os.environ.get("KONUSMATIK_API_KEY")
if not API_KEY:
    print("HATA: 'KONUSMATIK_API_KEY' ortam değişkeni bulunamadı.")
    print("PowerShell'de ayarlamak için: $env:KONUSMATIK_API_KEY = 'API_ANAHTARINIZ'")
    sys.exit(1)

WS_URL = "${API_BASE_REALTIME_WS}"
SAMPLE_RATE = 24000  # Konuşmatik Realtime PCM16 varsayılan örnekleme hızı (24 kHz)
CHANNELS = 1          # Mono
BLOCK_SIZE = 2400     # Her 100ms için 2400 örnek (4800 byte)

async def main():
    headers = {"Authorization": f"Bearer {API_KEY}"}
    audio_queue = asyncio.Queue()
    loop = asyncio.get_running_loop()

    # Mikrofon geri çağırma fonksiyonu (ayrı ses thread'inden çalışır)
    def audio_callback(indata, frames, time_info, status):
        if status:
            print(f"[Ses Uyarısı]: {status}", file=sys.stderr)
        loop.call_soon_threadsafe(audio_queue.put_nowait, bytes(indata))

    print("Konuşmatik Realtime API'ye bağlanılıyor...")
    async with websockets.connect(WS_URL, additional_headers=headers) as ws:
        # 1. Oturum Yapılandırması
        await ws.send(json.dumps({
            "type": "session.update",
            "session": {
                "model": "${ASR_V1_ID}",
                "input_audio_format": "pcm16",
                "language": "tr",
                "turn_detection": {"type": "server_vad", "silence_duration_ms": 750, "prefix_padding_ms": 300}
            }
        }))

        # 2. Mikrofondan Ses Gönderme Görevi
        async def send_audio():
            try:
                while True:
                    data = await audio_queue.get()
                    audio_b64 = base64.b64encode(data).decode("ascii")
                    await ws.send(json.dumps({
                        "type": "input_audio_buffer.append",
                        "audio": audio_b64
                    }))
            except asyncio.CancelledError:
                pass

        # 3. Sunucudan Gelen Yanıtları Dinleme Görevi
        async def receive_events():
            try:
                async for message in ws:
                    event = json.loads(message)
                    event_type = event.get("type", "")

                    if event_type == "session.updated":
                        print("Mikrofon aktif! Konuşmaya başlayabilirsiniz (Çıkmak için Ctrl+C)...")
                        print("------------------------------------------------------------------")
                    elif event_type == "conversation.item.input_audio_transcription.delta":
                        print(event.get("delta", ""), end="", flush=True)
                    elif event_type == "conversation.item.input_audio_transcription.completed":
                        transcript = event.get("transcript", "")
                        print(f"\\n[Nihai Cümle]: {transcript}\\n")
                    elif event_type == "error":
                        print(f"\\n[Sunucu Hatası]: {event.get('error', event)}")
            except asyncio.CancelledError:
                pass

        # Mikrofon akışını başlat (sounddevice)
        stream = sd.RawInputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype="int16",
            blocksize=BLOCK_SIZE,
            callback=audio_callback
        )

        with stream:
            send_task = asyncio.create_task(send_audio())
            receive_task = asyncio.create_task(receive_events())
            try:
                # İki görevi aynı anda çalıştır
                await asyncio.gather(send_task, receive_task)
            except asyncio.CancelledError:
                pass
            finally:
                send_task.cancel()
                receive_task.cancel()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\\n\\nProgram kullanıcı tarafından durduruldu.")`,
  curl: `# WebSocket bağlantısı ve kimlik doğrulama kontrolü
# Canlı PCM16 mikrofon akışı için yukarıdaki Python örneğini kullanın.
curl --http1.1 --include --no-buffer \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Connection: Upgrade" \\
  -H "Upgrade: websocket" \\
  -H "Sec-WebSocket-Version: 13" \\
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \\
  "${API_BASE_REALTIME_WS}?model=${ASR_V1_ID}"`,
  javascript: `import WebSocket from "ws";

const ws = new WebSocket("${API_BASE_REALTIME_WS}", {
  headers: { Authorization: \`Bearer \${process.env.KONUSMATIK_API_KEY}\` },
});

ws.on("open", () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      model: "${ASR_V1_ID}",
      input_audio_format: "pcm16",
      turn_detection: { type: "server_vad" },
    },
  }));
});

ws.on("message", (data) => {
  const event = JSON.parse(data.toString());
  if (event.type === "conversation.item.input_audio_transcription.delta") {
    process.stdout.write(event.delta);
  } else if (event.type === "conversation.item.input_audio_transcription.completed") {
    console.log("\\nTam Cümle:", event.transcript);
  }
});`,
};

export const nativeRealtimeSpecs = [
  { label: 'Uç Nokta', labelEn: 'Endpoint', value: API_BASE_NATIVE_REALTIME_WS },
  { label: 'Girdi Formatı', labelEn: 'Input Format', value: 'Binary PCM16 LE, 16 kHz Mono (örn. 100 ms = 3200 bayt / çerçeve)', valueEn: 'Binary PCM16 LE, 16 kHz Mono (e.g. 100 ms = 3200 bytes / frame)' },
  { label: 'Desteklenen Modeller', labelEn: 'Models', value: `${ASR_V1_ID}, konusmatik-asr-v2` },
  { label: 'Eşzamanlı Oturum Sınırı', labelEn: 'Concurrency Limit', value: 'konusmatik-asr-v2 için en fazla 3 eşzamanlı oturum (servis genelinde)', valueEn: 'At most 3 concurrent sessions (service-wide) for konusmatik-asr-v2' },
  { label: 'Hareketsizlik Zaman Aşımı', labelEn: 'Idle Timeout', value: '60 saniye ses gelmediğinde otomatik kapanır (idle_timeout)', valueEn: 'Closes after 60 seconds without audio (idle_timeout)' },
];

export const nativeRealtimeEventTable = [
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'session.start', desc: 'Oturumu başlatır: model, language (tr), encoding (pcm_s16le), sample_rate (16000), timestamp_granularities ["segment","word"].', descEn: 'Starts the session: model, language (tr), encoding (pcm_s16le), sample_rate (16000), timestamp_granularities ["segment","word"].' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'session.ready', desc: 'Oturumun hazır olduğunu doğrular (session_id, model).', descEn: 'Confirms session readiness (session_id, model).' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: '[Binary Frame]', desc: '16 kHz 16-bit mono PCM ses verisi binary frame olarak iletilir.', descEn: 'Streams 16 kHz 16-bit mono PCM audio as binary frames.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'transcript.partial', desc: 'Ara transkripsiyon parçası (text, sequence).', descEn: 'Partial transcription delta (text, sequence).' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'transcript.final', desc: 'Nihai cümle ve seçilmişse segment / word zaman damgaları (words: [{word, start, end, probability}]).', descEn: 'Final sentence and optional segment / word timestamps (words: [{word, start, end, probability}]).' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'session.stop', desc: 'Oturum sonlandırma isteği.', descEn: 'Session termination request.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'session.stats', desc: 'Toplam işlenen ses süresi ve istatistikleri döner.', descEn: 'Returns processed audio duration and session statistics.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'session.closed', desc: 'Oturumun başarıyla kapandığını bildirir.', descEn: 'Notifies session has been cleanly closed.' },
];

export const realtimeErrorCodesTable = [
  { code: 'invalid_api_key', meaning: 'Geçersiz veya eksik API anahtarı', meaningEn: 'Missing or invalid API key', conn: 'Kapatılır (1008)', connEn: 'Closed (1008)' },
  { code: 'rate_limit_exceeded', meaning: 'Çok fazla bağlantı denemesi', meaningEn: 'Too many connection attempts', conn: 'Kapatılır (1013)', connEn: 'Closed (1013)' },
  { code: 'concurrency_limit / realtime_capacity_saturated', meaning: 'Eşzamanlı oturum limiti dolu (v2 için sınır: 3)', meaningEn: 'Session limit reached (v2 limit: 3)', conn: 'Kapatılır (1013)', connEn: 'Closed (1013)' },
  { code: 'quota_exceeded', meaning: 'Hesap kotası tükendi', meaningEn: 'Quota exhausted', conn: 'Kapatılır (1008)', connEn: 'Closed (1008)' },
  { code: 'model_not_found', meaning: 'Bilinmeyen model kimliği', meaningEn: 'Unknown model ID', conn: 'Kapatılır (1008)', connEn: 'Closed (1008)' },
  { code: 'model_mismatch', meaning: '?model= parametresi ile mesajdaki model uyuşmazlığı', meaningEn: '?model= query param and message model mismatch', conn: 'Kapalı (native) / Açık (OpenAI)', connEn: 'Closed (native) / Open (OpenAI)' },
  { code: 'realtime_engine_unsupported', meaning: 'OpenAI uyumlu uç noktada v2 kullanımı (v2 reddedilir)', meaningEn: 'v2 requested on OpenAI-compatible endpoint (rejected)', conn: 'Bağlantıda kapalı (1013) / session.update\'te açık', connEn: 'Closed on connect (1013) / Open on session.update' },
  { code: 'unsupported_language', meaning: 'Türkçe harici dil kodu (yerel uç noktada reddedilir)', meaningEn: 'Language other than Turkish (rejected on native endpoint)', conn: 'Kapatılır (1008)', connEn: 'Closed (1008)' },
  { code: 'invalid_audio_format', meaning: 'Desteklenmeyen ses kodlaması veya örnekleme hızı', meaningEn: 'Unsupported audio encoding or sample rate', conn: 'Kapalı (native) / Açık (OpenAI)', connEn: 'Closed (native) / Open (OpenAI)' },
  { code: 'invalid_payload / invalid_value / invalid_base64', meaning: 'Hatalı JSON mesaj yapısı veya geçersiz parametre değeri', meaningEn: 'Malformed JSON payload or invalid parameter value', conn: 'Açık kalır', connEn: 'Stays open' },
  { code: 'payload_too_large / audio_backpressure', meaning: 'WebSocket çerçevesi çok büyük veya oturum ses limiti aşıldı', meaningEn: 'Frame too large or session audio buffer backpressure', conn: 'Açık / Kapatılır (1008)', connEn: 'Open / Closed (1008)' },
  { code: 'idle_timeout', meaning: '60 saniye boyunca ses çerçevesi iletilmedi', meaningEn: '60 seconds elapsed without audio input', conn: 'Kapatılır (1000)', connEn: 'Closed (1000)' },
  { code: 'upstream_unavailable', meaning: 'Arka plan çıkarım motoruna ulaşılamadı', meaningEn: 'Inference engine unreachable', conn: 'closed (1011) / open (OpenAI-compatible, null mode)', connEn: 'closed (1011) / open (OpenAI-compatible, null mode)' },
];

export const retryWithBackoffExample = {
  python: errorsRetry,
  curl: `curl --request POST "${API_BASE_REST}/audio/speech" \\
  --header "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  --header "Content-Type: application/json" \\
  --data '{"model":"konusmatik-tts","voice":"sila","input":"Merhaba","response_format":"wav"}' \\
  --retry 3 \\
  --retry-all-errors \\
  --fail-with-body \\
  --output output.wav`,
};

export const capacityTableData = [
  { tier: 'Standart', tierEn: 'Standard', workload: 'TTS (Ses Sentezi)', workloadEn: 'TTS (Speech Synthesis)', outstanding: '32 açık iş', outstandingEn: '32 outstanding jobs', active: '32 eşzamanlı inference', activeEn: '32 concurrent inferences', rate: '120 istek / dk', rateEn: '120 req / min' },
  { tier: 'Standart', tierEn: 'Standard', workload: 'ASR (Deşifre)', workloadEn: 'ASR (Transcription)', outstanding: '20 açık iş', outstandingEn: '20 outstanding jobs', active: '14 eşzamanlı inference', activeEn: '14 concurrent inferences', rate: '60 istek / dk', rateEn: '60 req / min' },
  { tier: 'Kurumsal', tierEn: 'Enterprise', workload: 'TTS (Ses Sentezi)', workloadEn: 'TTS (Speech Synthesis)', outstanding: '128 açık iş / hesap (Global: 256)', outstandingEn: '128 outstanding jobs / account (Global: 256)', active: '32 eşzamanlı inference', activeEn: '32 concurrent inferences', rate: '300 istek / dk', rateEn: '300 req / min' },
  { tier: 'Kurumsal', tierEn: 'Enterprise', workload: 'ASR (Deşifre)', workloadEn: 'ASR (Transcription)', outstanding: '100 açık iş / hesap (Global: 200)', outstandingEn: '100 outstanding jobs / account (Global: 200)', active: '14 eşzamanlı inference', activeEn: '14 concurrent inferences', rate: '120 istek / dk', rateEn: '120 req / min' },
  { tier: 'Realtime Canlı', tierEn: 'Realtime', workload: 'Realtime ASR', workloadEn: 'Realtime ASR', outstanding: '-', outstandingEn: '-', active: '50 eşzamanlı canlı oturum', activeEn: '50 concurrent live sessions', rate: '60 istek / dk', rateEn: '60 req / min' },
];

export const errorStatusTable = [
  { code: '400 Bad Request', type: 'invalid_request', desc: 'Geçersiz parametre veya istek yapısı. param alanı hataya sebep olan alanı belirtir.', descEn: 'Invalid parameter or request structure. The param field specifies the culprit parameter.' },
  { code: '401 Unauthorized', type: 'invalid_api_key', desc: 'API anahtarı eksik, geçersiz veya iptal edilmiş.', descEn: 'Missing, invalid, or revoked API key.' },
  { code: '404 Not Found', type: 'model_not_found / not_found', desc: 'Belirtilen model veya kaynak bulunamadı.', descEn: 'Requested model or resource could not be found.' },
  { code: '405 Method Not Allowed', type: 'method_not_allowed', desc: 'Uç nokta için desteklenmeyen HTTP metodu.', descEn: 'HTTP method not supported for this endpoint.' },
  { code: '413 Payload Too Large', type: 'file_too_large', desc: 'Dosya 100 MB veya 3 saat (10.800s) sınırını aştı.', descEn: 'Audio file exceeded 100 MB or 3-hour (10,800s) limit.' },
  { code: '422 Unprocessable Entity', type: 'validation_error', desc: 'Eksik veya hatalı form / JSON alanları.', descEn: 'One or more form or JSON fields failed validation.' },
  { code: '429 Too Many Requests', type: 'tts_capacity_saturated / asr_capacity_saturated / rate_limit_exceeded', desc: 'Kapasite doldu veya hız sınırı aşıldı. Yanıt Retry-After başlığı içerir.', descEn: 'Capacity full or rate limit exceeded. Response includes Retry-After header.' },
  { code: '503 Service Unavailable', type: 'service_unavailable / transcode_capacity', desc: 'Geçici servis kesintisi veya format dönüştürme kapasitesi doldu. Retry-After başlığı içerir. Format dönüştürme beklemelerinde faturalandırma yapılmaz.', descEn: 'Temporary service unavailability or transcode capacity full. Includes Retry-After header. No billing occurs during transcode capacity waits.' },
  { code: '504 Gateway Timeout', type: 'transcode_timeout', desc: 'Format dönüştürme işlemi zaman aşımına uğradı.', descEn: 'Audio transcoding operation timed out.' },
];
