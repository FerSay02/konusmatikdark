export const API_BASE_REST = 'https://api.konusmatik.com/api/v1';
export const API_BASE_REALTIME_WS = 'wss://api.konusmatik.com/api/v1/realtime';

export const quickStartSteps = [
  { num: '01', title: 'API Anahtarınızı Edinin', titleEn: 'Get Your API Key', desc: 'Konuşmatik web panelinizden (Profil / API Anahtarları) bir anahtar oluşturun ve KONUSMATIK_API_KEY ortam değişkeninde saklayın.', descEn: 'Create an API key from your profile (Profile / API Keys) and store it in the KONUSMATIK_API_KEY environment variable.' },
  { num: '02', title: 'OpenAI SDK veya REST Seçin', titleEn: 'Choose OpenAI SDK or REST', desc: 'Canonical uç noktalar resmi OpenAI Python SDK ve cURL istekleriyle doğrudan uyumludur. Yüksek hacimli toplu işler için Kurumsal Asenkron API kullanın.', descEn: 'Canonical endpoints are directly compatible with the OpenAI Python SDK and cURL requests. For large batch processing, use the Corporate Async API.' },
  { num: '03', title: 'Üretim Modelleriyle Çalışın', titleEn: 'Work with Production Models', desc: 'Resmi model isimleri: konusmatik-asr-v1 ve konusmatik-tts-v2. TTS sesleri: sila, deniz, taha.', descEn: 'Official model names: konusmatik-asr-v1 and konusmatik-tts-v2. Native TTS voices: sila, deniz, taha.' },
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
  python: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="${API_BASE_REST}",
)

with open("audio.wav", "rb") as audio_file:
    transcript = client.audio.transcriptions.create(
        model="konusmatik-asr-v1",
        file=audio_file,
    )

print("Deşifre:", transcript.text)`,
  javascript: `import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({
  apiKey: process.env.KONUSMATIK_API_KEY,
  baseURL: "${API_BASE_REST}",
});

const transcript = await client.audio.transcriptions.create({
  model: "konusmatik-asr-v1",
  file: fs.createReadStream("audio.wav"),
});

console.log("Deşifre:", transcript.text);`,
};

export const openaiSdkTtsExample = {
  python: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="${API_BASE_REST}",
)

with client.audio.speech.with_streaming_response.create(
    model="konusmatik-tts-v2",
    voice="sila",
    input="Merhaba, Konuşmatik API testine hoş geldiniz.",
    response_format="wav",
) as response:
    response.stream_to_file("output.wav")

print("Ses kaydedildi: output.wav")`,
  javascript: `import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({
  apiKey: process.env.KONUSMATIK_API_KEY,
  baseURL: "${API_BASE_REST}",
});

const speech = await client.audio.speech.create({
  model: "konusmatik-tts-v2",
  voice: "sila",
  input: "Merhaba, Konuşmatik API servisi.",
  response_format: "wav",
});

const buffer = Buffer.from(await speech.arrayBuffer());
await fs.promises.writeFile("output.wav", buffer);`,
};

export const modelsData = [
  { id: 'konusmatik-asr-v1', name: 'Konuşmatik ASR v1', type: 'Konuşma Tanıma (STT)', typeEn: 'Speech to Text (ASR)', description: 'Ses dosyalarını yüksek doğrulukla Türkçe metne dönüştürür.', descriptionEn: 'Transcribes audio files into accurate Turkish text.', inputFormat: 'multipart/form-data (MP3, WAV, M4A, WEBM, OGG)', inputFormatEn: 'multipart/form-data (MP3, WAV, M4A, WEBM, OGG)', outputFormat: 'json, text, verbose_json', outputFormatEn: 'json, text, verbose_json', latency: '14 Eşzamanlı GPU İnference', latencyEn: '14 concurrent GPU inferences' },
  { id: 'konusmatik-tts-v2', name: 'Konuşmatik TTS v1', type: 'Doğal Ses Sentezi (TTS)', typeEn: 'Text to Speech (TTS)', description: 'Türkçe metinleri doğal ve akıcı seslendirerek kayıpsız WAV ses çıktısı üretir.', descriptionEn: 'Generates natural-sounding Turkish speech as lossless WAV audio.', inputFormat: 'JSON body (max 10.000 karakter)', inputFormatEn: 'JSON body (max 10,000 chars)', outputFormat: 'audio/wav (RIFF/WAVE Binary)', outputFormatEn: 'audio/wav (RIFF/WAVE Binary)', latency: '32 Eşzamanlı GPU İnference', latencyEn: '32 concurrent GPU inferences' },
];

export const modelsCodeExamples = {
  curl: `curl "${API_BASE_REST}/models" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"`,
  python: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="${API_BASE_REST}",
)

models = client.models.list()
for model in models.data:
    print("Model ID:", model.id)`,
  javascript: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.KONUSMATIK_API_KEY,
  baseURL: "${API_BASE_REST}",
});

const models = await client.models.list();
console.log(models.data.map(m => m.id));`,
};

export const ttsVoicesData = [
  { id: 'sila', name: 'Sıla', gender: 'Kadın', genderEn: 'Female', style: 'Doğal & Akıcı', styleEn: 'Natural & Fluent', desc: 'Asistan, müşteri deneyimi, eğitim ve uzun anlatımlar için dengeli doğal kadın sesi.', descEn: 'Balanced natural female voice for assistants, customer experience, and education.' },
  { id: 'deniz', name: 'Deniz', gender: 'Kadın', genderEn: 'Female', style: 'Kurumsal & Net', styleEn: 'Corporate & Clear', desc: 'Haber bültenleri, kurumsal duyurular ve resmi açıklamalar için net kadın sesi.', descEn: 'Clear professional female voice for corporate announcements and media.' },
  { id: 'taha', name: 'Taha', gender: 'Erkek', genderEn: 'Male', style: 'Dinamik & Güçlü', styleEn: 'Dynamic & Strong', desc: 'Diyaloglar, kısa bilgilendirmeler ve dinamik içerikler için modern erkek sesi.', descEn: 'Modern dynamic male voice for dialogues, notifications, and media.' },
];

export const ttsParameters = [
  { name: 'model', type: 'string', required: true, defaultVal: 'konusmatik-tts-v2', desc: 'Üretim TTS model adı: konusmatik-tts-v2', descEn: 'Production TTS model ID: konusmatik-tts-v2' },
  { name: 'input', type: 'string', required: true, defaultVal: '-', desc: 'Seslendirilecek metin (Maksimum 10.000 karakter).', descEn: 'Text to synthesize (Maximum 10,000 characters).' },
  { name: 'voice', type: 'string', required: true, defaultVal: 'sila', desc: 'Ses seçimi: sila (Kadın), deniz (Kadın), taha (Erkek).', descEn: 'Voice selection: sila (Female), deniz (Female), taha (Male).' },
  { name: 'response_format', type: 'string', required: false, defaultVal: 'wav', desc: 'Üretim standardı gereği WAV-only format desteklenir. (audio/wav)', descEn: 'Lossless WAV-only format is supported. (audio/wav)' },
  { name: 'speed', type: 'number', required: false, defaultVal: '1.0', desc: 'Konuşma hızı çarpanı (0.25 - 4.0).', descEn: 'Speech speed multiplier (0.25 - 4.0).' },
];

export const ttsCodeExamples = {
  python: `import os
from pathlib import Path
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="${API_BASE_REST}",
)

speech_file_path = Path("speech.wav")

with client.audio.speech.with_streaming_response.create(
    model="konusmatik-tts-v2",
    voice="sila",
    input="Merhaba, Konuşmatik API testine hoş geldiniz.",
    response_format="wav",
) as response:
    response.stream_to_file(speech_file_path)

print(f"Ses dosyası kaydedildi: {speech_file_path}")`,
  curl: `curl -X POST "${API_BASE_REST}/audio/speech" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "konusmatik-tts-v2",
    "voice": "sila",
    "input": "Merhaba, Konuşmatik API ile WAV ses üretiyorum.",
    "response_format": "wav"
  }' \\
  --output speech.wav`,
};

export const streamingTtsSpecs = [
  { title: 'Model', titleEn: 'Model', value: 'konusmatik-streaming-tts-v2' },
  { title: 'Desteklenen sesler', titleEn: 'Supported voices', value: 'sila · deniz · taha' },
  { title: 'Çıktı formatı', titleEn: 'Output format', value: 'PCM16LE' },
  {
    title: 'Gerekli parametre',
    titleEn: 'Required parameter',
    value: 'response_format="pcm"',
    detail: 'Streaming TTS isteklerinde response_format değeri pcm olmalıdır.',
    detailEn: 'For Streaming TTS requests, response_format must be set to pcm.',
  },
];

export const streamingTtsCodeExamples = {
  python: `import asyncio
import os
from openai import AsyncOpenAI
import openai.helpers.local_audio_player as lap
from openai.helpers import LocalAudioPlayer

lap.SAMPLE_RATE = 48000

openai = AsyncOpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="${API_BASE_REST}",
)

async def main() -> None:
    async with openai.audio.speech.with_streaming_response.create(
        model="konusmatik-streaming-tts-v2",
        voice="deniz",
        input="Merhaba, Konuşmatik Streaming TTS ile ses gerçek zamanlı olarak oluşturulmaktadır.",
        response_format="pcm",
    ) as response:
        await LocalAudioPlayer().play(response)

if __name__ == "__main__":
    asyncio.run(main())`,
};

export const streamingTtsResponseHeaders = `Content-Type: audio/pcm
X-Audio-Sample-Rate: <sample_rate>
X-Audio-Channels: <channels>
X-Audio-Format: pcm_s16le
X-Request-ID: <request_id>`;

export const asrParameters = [
  { name: 'file', type: 'file', required: true, defaultVal: '-', desc: 'Ses dosyası (Maksimum 100 MB, Maksimum 3 saat / 10.800s).', descEn: 'Audio file (Max 100 MB, Max 3 hours / 10,800s).' },
  { name: 'model', type: 'string', required: true, defaultVal: 'konusmatik-asr-v1', desc: 'Üretim ASR model adı: konusmatik-asr-v1', descEn: 'Production ASR model ID: konusmatik-asr-v1' },
  { name: 'language', type: 'string', required: false, defaultVal: 'tr', desc: 'Dil kodu (Varsayılan: tr).', descEn: 'Language code (Default: tr).' },
  { name: 'response_format', type: 'string', required: false, defaultVal: 'json', desc: 'json, text veya verbose_json.', descEn: 'json, text, or verbose_json.' },
];

export const asrSupportedFormats = ['WAV', 'MP3', 'M4A', 'WEBM', 'OGG'];

export const asrCodeExamples = {
  python: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["KONUSMATIK_API_KEY"],
    base_url="${API_BASE_REST}",
)

with open("ses_kaydi.wav", "rb") as audio_file:
    transcription = client.audio.transcriptions.create(
        model="konusmatik-asr-v1",
        file=audio_file,
        language="tr",
        response_format="json",
    )

print("Deşifre Metni:", transcription.text)`,
  curl: `curl -X POST "${API_BASE_REST}/audio/transcriptions" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -F "model=konusmatik-asr-v1" \\
  -F "file=@ses_kaydi.wav" \\
  -F "language=tr"`,
};

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
  { label: 'Örnekleme Hızı', labelEn: 'Sample Rate', value: '24 kHz (veya 16 kHz)', valueEn: '24 kHz (or 16 kHz)' },
  { label: 'Kanal', labelEn: 'Channels', value: '1 (Mono)', valueEn: '1 (Mono)' },
  { label: 'Aktarım', labelEn: 'Transport', value: 'WebSocket Base64 JSON Chunk', valueEn: 'WebSocket Base64 JSON chunks' },
  { label: 'VAD (Ses Algılama)', labelEn: 'Voice Activity Detection', value: 'Sunucu Taraflı Server VAD (Client VAD gerekmez)', valueEn: 'Server-side VAD (no client-side VAD required)' },
];

export const realtimeEventTable = [
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'session.created', desc: 'Bağlantı kabul edilince varsayılan oturum objesi döner.', descEn: 'Returned after connection with the default session object.' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'session.update', desc: 'Model (konusmatik-asr-v1), ses formatı ve VAD ayarlarını yapılandırır.', descEn: 'Configures model, audio format, and VAD settings.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'session.updated', desc: 'Güncellenen oturum yapılandırmasını onaylar.', descEn: 'Confirms the updated session configuration.' },
  { dir: 'Client -> Server', dirEn: 'Client -> Server', event: 'input_audio_buffer.append', desc: 'Base64 PCM16 ses parçasını gönderir.', descEn: 'Sends a Base64 PCM16 audio chunk.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'conversation.item.input_audio_transcription.delta', desc: 'Canlı transkripsiyon parçasını (kelime/hece) döner.', descEn: 'Returns real-time transcription deltas.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'conversation.item.input_audio_transcription.completed', desc: 'Server VAD sessizlik tespit ettiğinde nihai cümleyi döner.', descEn: 'Returns the completed sentence after server-side VAD detects silence.' },
  { dir: 'Server -> Client', dirEn: 'Server -> Client', event: 'error', desc: 'Kapasite aşımı, yetki veya biçim hatalarını bildirir.', descEn: 'Reports capacity, auth, or payload errors.' },
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
        model="konusmatik-asr-v1",
    ) as connection:
        await connection.session.update(
            session={
                "input_audio_format": "pcm16",
                "turn_detection": {
                    "type": "server_vad",
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
                "model": "konusmatik-asr-v1",
                "input_audio_format": "pcm16",
                "language": "tr",
                "turn_detection": {"type": "server_vad"}
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
  "${API_BASE_REALTIME_WS}"`,
  javascript: `import WebSocket from "ws";

const ws = new WebSocket("${API_BASE_REALTIME_WS}", {
  headers: { Authorization: \`Bearer \${process.env.KONUSMATIK_API_KEY}\` },
});

ws.on("open", () => {
  ws.send(JSON.stringify({
    type: "session.update",
    session: {
      model: "konusmatik-asr-v1",
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

export const retryWithBackoffExample = {
  python: `import time
import requests

def request_with_retry_after(url, headers, payload, max_retries=3):
    for attempt in range(max_retries):
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 429:
            # Backend'den dönen Retry-After başlığına uyun (Varsayılan 3 saniye)
            retry_after = int(response.headers.get("Retry-After", 3))
            print(f"Kapasite dolu (429). {retry_after}s sonra tekrar deneniyor... (Deneme {attempt+1}/{max_retries})")
            time.sleep(retry_after)
            continue
            
        return response
    raise RuntimeError("Maksimum yeniden deneme sınırına ulaşıldı.")`,
  curl: `curl --request POST "${API_BASE_REST}/audio/speech" \\
  --header "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  --header "Content-Type: application/json" \\
  --data '{"model":"konusmatik-tts-v2","voice":"sila","input":"Merhaba","response_format":"wav"}' \\
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
  { code: '400 Bad Request', type: 'invalid_request_error', desc: 'Geçersiz model, ses adı, parametre veya desteklenmeyen format (WAV dışında format talebi).', descEn: 'Invalid model, voice, parameter, or unsupported format (non-WAV request).' },
  { code: '401 Unauthorized', type: 'authentication_error', desc: 'API anahtarı eksik, geçersiz veya iptal edilmiş.', descEn: 'Missing, invalid, or revoked API key.' },
  { code: '402 Payment Required', type: 'insufficient_corporate_quota', desc: 'Hesap paketindeki kredi veya saniye kotası tükendi.', descEn: 'Insufficient credit or seconds quota.' },
  { code: '404 Not Found', type: 'resource_not_found', desc: 'Belirtilen job_id bulunamadı veya başka bir müşteriye ait.', descEn: 'Specified job_id not found or belongs to another tenant.' },
  { code: '413 Payload Too Large', type: 'invalid_request_error', desc: '100 MB ses yükleme veya 10.000 karakter metin sınırı aşıldı.', descEn: '100 MB file upload or 10,000 character limit exceeded.' },
  { code: '422 Unprocessable Entity', type: 'validation_error', desc: 'Eksik veya hatalı form / JSON alanları.', descEn: 'One or more form or JSON fields failed validation.' },
  { code: '429 Too Many Requests', type: 'capacity_error / rate_limit_error', desc: 'Kapasite doldu veya hız sınırı aşıldı. Retry-After başlığı içerir (asr_capacity_saturated, tts_capacity_saturated).', descEn: 'Capacity full or rate limit exceeded. Includes Retry-After header.' },
  { code: '500 / 503', type: 'server_error', desc: 'Geçici sunucu veya kuyruk servis kesintisi.', descEn: 'Temporary service or worker queue unavailability.' },
];
