import { API_BASE_REST } from './apiDocsV2';

export const corporateAsrUrlParameters = [
  { name: 'audio_url', type: 'string', required: true, defaultVal: '-', desc: 'Doğrudan erişilebilir HTTPS ses veya video adresi. Özel/iç ağ adresleri engellenir (SSRF koruması). Maksimum 100 MB.', descEn: 'Directly reachable HTTPS audio or video URL. Private/internal network addresses are blocked (SSRF protection). Max 100 MB.' },
  { name: 'language', type: 'string', required: false, defaultVal: 'tr', desc: 'Ses dili. Şu an yalnızca Türkçe (tr) desteklenir; diğer değerler 400 unsupported_language döner.', descEn: 'Audio language. Only Turkish (tr) is supported for now; other values return 400 unsupported_language.' },
  { name: 'timestamp_granularities', type: 'string[]', required: false, defaultVal: '-', desc: '"segment" ve/veya "word". Sonuçta zaman damgalı segment ve kelime listesi döner.', descEn: '"segment" and/or "word". The result includes timestamped segments and words.' },
  { name: 'webhook_id', type: 'uuid', required: false, defaultVal: '-', desc: 'Kayıtlı ve aktif bir webhook uç noktasının kimliği. İş bitince olay bu adrese gönderilir.', descEn: 'ID of a registered, active webhook endpoint. The completion event is delivered to it.' },
];

export const corporateAsrUrlExample = {
  python: `import os
import requests

API_KEY = os.environ["KONUSMATIK_API_KEY"]
BASE_URL = "${API_BASE_REST}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

# Dosya yüklemeden, uzak bir URL'den asenkron ASR işi başlat (HTTP 202 Accepted)
resp = requests.post(
    f"{BASE_URL}/corporate/asr/jobs/url",
    headers=HEADERS,
    json={
        "audio_url": "https://cdn.example.com/kayitlar/toplanti.mp3",
        "language": "tr",
        "timestamp_granularities": ["segment", "word"],
        "webhook_id": "WEBHOOK_ID_BURAYA",  # opsiyonel
    },
)
resp.raise_for_status()
job_id = resp.json()["job_id"]
print("Job ID:", job_id)

# Sonuç: segments, words, srt ve vtt alanlarını içerir
result = requests.get(
    f"{BASE_URL}/corporate/asr/jobs/{job_id}/result",
    headers=HEADERS,
    params={"timestamp_granularities[]": ["segment", "word"]},
).json()
for word in result["words"][:5]:
    print(word["word"], word["start"], word["end"])`,
  curl: `# URL'den asenkron ASR işi (202 Accepted)
curl -X POST "${API_BASE_REST}/corporate/asr/jobs/url" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "audio_url": "https://cdn.example.com/kayitlar/toplanti.mp3",
    "language": "tr",
    "timestamp_granularities": ["segment", "word"],
    "webhook_id": "WEBHOOK_ID_BURAYA"
  }'

# Zaman damgalı sonuç
curl -G "${API_BASE_REST}/corporate/asr/jobs/JOB_ID_BURAYA/result" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  --data-urlencode "timestamp_granularities[]=segment" \\
  --data-urlencode "timestamp_granularities[]=word"

# Sonuç dosyası için geçici indirme bağlantısı
curl "${API_BASE_REST}/corporate/asr/jobs/JOB_ID_BURAYA/download" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"`,
};

export const corporateAsrResultFields = [
  { name: 'job_id', type: 'uuid', required: true, defaultVal: '-', desc: 'İş kimliği.', descEn: 'Job ID.' },
  { name: 'status', type: 'string', required: true, defaultVal: '-', desc: 'pending, processing, completed veya failed.', descEn: 'pending, processing, completed or failed.' },
  { name: 'text', type: 'string', required: false, defaultVal: 'null', desc: 'Tam transkripsiyon metni.', descEn: 'Full transcription text.' },
  { name: 'segments', type: 'array', required: false, defaultVal: '[]', desc: 'Her biri id, start, end, text içeren zaman damgalı cümleler.', descEn: 'Timestamped sentences with id, start, end, text.' },
  { name: 'words', type: 'array', required: false, defaultVal: '[]', desc: 'Her biri word, start, end ve opsiyonel probability içeren kelime zamanları.', descEn: 'Word timings with word, start, end and optional probability.' },
  { name: 'srt / vtt', type: 'string', required: false, defaultVal: 'null', desc: 'Hazır altyazı çıktıları.', descEn: 'Ready-made subtitle outputs.' },
  { name: 'error', type: 'string', required: false, defaultVal: 'null', desc: 'İş başarısız olduysa hata mesajı.', descEn: 'Error message if the job failed.' },
];

export const corporateAsrSyncExample = {
  python: `import os
import requests

API_KEY = os.environ["KONUSMATIK_API_KEY"]
BASE_URL = "${API_BASE_REST}"

# Kısa dosyalar için: sonuç aynı istekte döner (HTTP 201)
with open("kisa_kayit.wav", "rb") as f:
    resp = requests.post(
        f"{BASE_URL}/corporate/asr/jobs/sync",
        headers={"Authorization": f"Bearer {API_KEY}"},
        files={"file": ("kisa_kayit.wav", f, "audio/wav")},
        data={"language": "tr", "timestamp_granularities[]": ["segment", "word"]},
    )
resp.raise_for_status()
print(resp.json()["text"])`,
  curl: `curl -X POST "${API_BASE_REST}/corporate/asr/jobs/sync" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -F "file=@kisa_kayit.wav" \\
  -F "language=tr" \\
  -F "timestamp_granularities[]=segment" \\
  -F "timestamp_granularities[]=word"`,
};

export const webhookEndpointsTable = [
  { method: 'POST', path: '/corporate/webhooks', desc: 'Yeni webhook uç noktası kaydeder. Yanıttaki secret (whsec_...) imza doğrulaması için saklanmalıdır.', descEn: 'Registers a webhook endpoint. Store the returned secret (whsec_...) for signature verification.' },
  { method: 'GET', path: '/corporate/webhooks', desc: 'Hesabınıza ait tüm webhook uç noktalarını listeler.', descEn: 'Lists all webhook endpoints of your account.' },
  { method: 'GET', path: '/corporate/webhooks/{id}', desc: 'Tek bir uç noktanın ayrıntılarını döndürür.', descEn: 'Returns details of a single endpoint.' },
  { method: 'PATCH', path: '/corporate/webhooks/{id}', desc: 'url, description veya is_active alanlarını günceller (PUT da desteklenir).', descEn: 'Updates url, description or is_active (PUT is also supported).' },
  { method: 'DELETE', path: '/corporate/webhooks/{id}', desc: 'Uç noktayı siler. 204 No Content döner.', descEn: 'Deletes the endpoint. Returns 204 No Content.' },
  { method: 'POST', path: '/corporate/webhooks/{id}/rotate-secret', desc: 'Yeni secret üretir; eski secret 24 saat daha geçerli kalır (kesintisiz geçiş).', descEn: 'Generates a new secret; the old one stays valid for 24 more hours (zero-downtime rotation).' },
  { method: 'POST', path: '/corporate/webhooks/{id}/ping', desc: 'Adresinize anında test olayı gönderir ve yanıt durumunu döndürür.', descEn: 'Sends an immediate test event to your URL and returns the response status.' },
  { method: 'GET', path: '/corporate/webhooks/{id}/deliveries', desc: 'Son 100 teslimat kaydını (durum, deneme sayısı, hata kodu) listeler.', descEn: 'Lists the last 100 delivery records (status, attempts, error code).' },
];

export const webhookManagementExample = {
  python: `import os
import requests

API_KEY = os.environ["KONUSMATIK_API_KEY"]
BASE_URL = "${API_BASE_REST}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

# 1. Uç nokta kaydet (yalnızca HTTPS)
ep = requests.post(
    f"{BASE_URL}/corporate/webhooks",
    headers=HEADERS,
    json={"url": "https://api.sirketiniz.com/hooks/konusmatik", "description": "Üretim"},
).json()
print("Webhook ID:", ep["id"])
print("Secret:", ep["secret"])  # whsec_... güvenli saklayın

# 2. Erişilebilirliği test et
print(requests.post(f"{BASE_URL}/corporate/webhooks/{ep['id']}/ping", headers=HEADERS).json())

# 3. ASR işine bağla
requests.post(
    f"{BASE_URL}/corporate/asr/jobs/url",
    headers=HEADERS,
    json={"audio_url": "https://cdn.example.com/a.mp3", "webhook_id": ep["id"]},
)

# 4. Teslimat geçmişi
for d in requests.get(f"{BASE_URL}/corporate/webhooks/{ep['id']}/deliveries", headers=HEADERS).json():
    print(d["event_type"], d["status"], d["attempt_count"])

# 5. Secret rotasyonu (eski secret 24 saat geçerli)
new = requests.post(f"{BASE_URL}/corporate/webhooks/{ep['id']}/rotate-secret", headers=HEADERS).json()
print(new["secret"], new["secret_previous_expires_at"])`,
  curl: `# Uç nokta kaydet
curl -X POST "${API_BASE_REST}/corporate/webhooks" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://api.sirketiniz.com/hooks/konusmatik", "description": "Üretim"}'

# Test olayı gönder
curl -X POST "${API_BASE_REST}/corporate/webhooks/WEBHOOK_ID/ping" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"

# Uç noktayı devre dışı bırak
curl -X PATCH "${API_BASE_REST}/corporate/webhooks/WEBHOOK_ID" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"is_active": false}'

# Teslimat geçmişi
curl "${API_BASE_REST}/corporate/webhooks/WEBHOOK_ID/deliveries" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"

# Secret rotasyonu
curl -X POST "${API_BASE_REST}/corporate/webhooks/WEBHOOK_ID/rotate-secret" \\
  -H "Authorization: Bearer $KONUSMATIK_API_KEY"`,
};

export const webhookHeadersTable = [
  { name: 'X-Konusmatik-Event', value: 'asr.job.completed', desc: 'Olay türü.', descEn: 'Event type.' },
  { name: 'X-Konusmatik-Event-ID', value: 'evt_...', desc: 'Benzersiz olay kimliği; tekrar teslimatlarda aynıdır (idempotency için kullanın).', descEn: 'Unique event ID, identical across retries (use it for idempotency).' },
  { name: 'X-Konusmatik-Timestamp', value: '1767225600', desc: 'İmza zamanı (Unix saniye).', descEn: 'Signature time (Unix seconds).' },
  { name: 'X-Konusmatik-Signature', value: 'v1=<hex>[,v1=<hex>]', desc: 'HMAC-SHA256 imzası. Secret rotasyonu sırasında iki imza birlikte gelir.', descEn: 'HMAC-SHA256 signature. Two signatures are sent during secret rotation.' },
];

export const webhookEventExamples = {
  completed: `{
  "event_id": "evt_3f9a1c...",
  "event_type": "asr.job.completed",
  "event_version": "1",
  "created_at": "2026-11-02T10:15:30Z",
  "data": {
    "job_id": "8c1f6a52-...",
    "status": "completed",
    "result_url": "https://api.konusmatik.com/api/v1/corporate/asr/jobs/8c1f6a52-.../result"
  }
}`,
  failed: `{
  "event_id": "evt_a71b02...",
  "event_type": "asr.job.failed",
  "event_version": "1",
  "created_at": "2026-11-02T10:15:30Z",
  "data": {
    "job_id": "8c1f6a52-...",
    "status": "failed",
    "error": { "code": "AUDIO_DOWNLOAD_FAILED", "message": "..." }
  }
}`,
};

export const webhookErrorCodes = [
  { code: 'INSUFFICIENT_QUOTA', desc: 'Kota yetersiz.', descEn: 'Insufficient quota.' },
  { code: 'AUDIO_DOWNLOAD_FAILED', desc: 'audio_url indirilemedi.', descEn: 'audio_url could not be downloaded.' },
  { code: 'SECURITY_VIOLATION', desc: 'URL güvenlik politikası tarafından engellendi.', descEn: 'URL blocked by security policy.' },
  { code: 'TIMEOUT_EXCEEDED', desc: 'İşlem zaman aşımına uğradı.', descEn: 'Processing timed out.' },
  { code: 'INVALID_AUDIO_FORMAT', desc: 'Desteklenmeyen ses/video formatı.', descEn: 'Unsupported audio/video format.' },
  { code: 'ASR_PROCESSING_FAILED', desc: 'Genel işleme hatası.', descEn: 'Generic processing failure.' },
];

export const webhookVerifyExample = {
  python: `import hashlib
import hmac
import time

from flask import Flask, request, abort

app = Flask(__name__)
SECRET = "whsec_..."  # kayıt sırasında aldığınız secret
TOLERANCE_SECONDS = 300
seen_event_ids = set()  # üretimde kalıcı bir depo kullanın

def verify(raw_body: bytes, signature_header: str, timestamp: str) -> bool:
    if abs(time.time() - int(timestamp)) > TOLERANCE_SECONDS:
        return False  # replay koruması
    signed = f"{timestamp}.".encode() + raw_body
    expected = hmac.new(SECRET.encode(), signed, hashlib.sha256).hexdigest()
    for part in signature_header.split(","):
        part = part.strip()
        if part.startswith("v1=") and hmac.compare_digest(part[3:], expected):
            return True
    return False

@app.post("/hooks/konusmatik")
def konusmatik_hook():
    raw = request.get_data()  # JSON parse etmeden önce HAM gövdeyi kullanın
    if not verify(raw, request.headers["X-Konusmatik-Signature"], request.headers["X-Konusmatik-Timestamp"]):
        abort(401)

    event = request.get_json()
    if event["event_id"] in seen_event_ids:
        return "", 200  # tekrar teslimat
    seen_event_ids.add(event["event_id"])

    if event["event_type"] == "asr.job.completed":
        print("Sonuç hazır:", event["data"]["result_url"])
    elif event["event_type"] == "asr.job.failed":
        print("Hata:", event["data"]["error"]["code"])
    return "", 200  # 2xx dönün, aksi halde yeniden denenir`,
  node: `import crypto from 'node:crypto';
import express from 'express';

const SECRET = process.env.KONUSMATIK_WEBHOOK_SECRET; // whsec_...
const app = express();

// İmza ham gövde üzerinden hesaplanır
app.post('/hooks/konusmatik', express.raw({ type: 'application/json' }), (req, res) => {
  const timestamp = req.header('X-Konusmatik-Timestamp');
  const signatures = req.header('X-Konusmatik-Signature').split(',').map((p) => p.trim());
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return res.sendStatus(401);

  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(\`\${timestamp}.\`)
    .update(req.body)
    .digest('hex');

  const ok = signatures.some((s) => {
    if (!s.startsWith('v1=')) return false;
    const a = Buffer.from(s.slice(3));
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  });
  if (!ok) return res.sendStatus(401);

  const event = JSON.parse(req.body.toString('utf8'));
  console.log(event.event_type, event.data.job_id);
  res.sendStatus(200);
});`,
};

export const webhookRetrySchedule = [
  { attempt: '1', delay: 'Anında', delayEn: 'Immediate' },
  { attempt: '2', delay: '~30 saniye', delayEn: '~30 seconds' },
  { attempt: '3', delay: '~2 dakika', delayEn: '~2 minutes' },
  { attempt: '4', delay: '~10 dakika', delayEn: '~10 minutes' },
  { attempt: '5', delay: '~30 dakika', delayEn: '~30 minutes' },
  { attempt: '6', delay: '~2 saat', delayEn: '~2 hours' },
];
