const rawBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim() || '';

// Local Vite development uses the same-origin /api proxy so HttpOnly cookies
// are handled by the development host. Production keeps the configured API.
export const API_BASE_URL = import.meta.env?.DEV ? '' : rawBaseUrl.replace(/\/$/, '');

// Several protected pages load their data in parallel. Keep one refresh in
// flight so rotating refresh tokens cannot invalidate each other.
let refreshPromise = null;
let authExpiredDispatched = false;

function authTrace(label, details) {
  if (import.meta.env?.DEV) {
    console.warn(`[${label}]`, details);
  }
}

export function resetAuthState() {
  authExpiredDispatched = false;
}

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        if (response.ok) authExpiredDispatched = false;
        return response;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const {
    skipAuthRefresh = false,
    skipAuthExpiredEvent = false,
    _retryAfterRefresh = false,
    ...fetchOptions
  } = options;
  const headers = options.body instanceof FormData
    ? { ...(options.headers || {}) }
    : { 'Content-Type': 'application/json', ...(options.headers || {}) };

  // TODO(BACKEND): Validate Origin/CSRF for credentialed mutations and configure allowed CORS origins plus Secure/SameSite/HttpOnly cookie attributes on the API.
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...fetchOptions,
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    authTrace('API_RESPONSE_ERROR', {
      method: fetchOptions.method || 'GET',
      url: path,
      status: response.status,
      isRetry: Boolean(_retryAfterRefresh),
      refreshInProgress: Boolean(refreshPromise),
      hasAuthorizationHeader: Boolean(headers.Authorization || headers.authorization),
      credentials: fetchOptions.credentials || 'include',
    });
  }

  if (
    response.status !== 401 ||
    skipAuthRefresh ||
    _retryAfterRefresh ||
    path === '/api/v1/auth/refresh' ||
    path === '/api/v1/auth/logout'
  ) {
    return response;
  }

  const refreshResponse = await refreshSession();
  authTrace('AUTH_REFRESH', {
    status: refreshResponse.status,
    ok: refreshResponse.ok,
    requestUrl: '/api/v1/auth/refresh',
  });

  if (refreshResponse.ok) {
    return apiFetch(path, { ...options, _retryAfterRefresh: true });
  }

  if (!skipAuthExpiredEvent && !authExpiredDispatched) {
    authExpiredDispatched = true;
    window.dispatchEvent(new CustomEvent('konusmatik:auth-expired'));
  }
  return response;
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.detail || `API isteği başarısız (${response.status})`);
    error.status = response.status;
    error.detail = data?.detail;
    error.code = data?.code;
    throw error;
  }
  return data;
}

export function isAuthError(error) {
  if (!error) return false;
  const message = String(error.message || error.detail || '').toLowerCase();
  return error.status === 401 || message.includes('not authenticated') || message.includes('unauthenticated');
}


export const DEFAULT_ASR_CAPABILITIES = {
  max_upload_bytes: 104857600,
  max_duration_seconds: 7200,
  audio_extensions: ['.wav', '.mp3', '.flac', '.m4a', '.aac', '.ogg', '.oga', '.opus', '.webm', '.aiff', '.aif', '.wma'],
  video_extensions: ['.mp4', '.mov', '.mkv', '.webm'],
  allowed_content_types: [
    'audio/wav', 'audio/x-wav', 'audio/wave',
    'audio/mpeg', 'audio/mp3',
    'audio/flac', 'audio/x-flac',
    'audio/mp4', 'audio/m4a', 'audio/x-m4a',
    'audio/aac', 'audio/x-aac',
    'audio/ogg', 'audio/vorbis',
    'audio/opus',
    'audio/webm',
    'audio/aiff', 'audio/x-aiff',
    'audio/x-ms-wma', 'video/x-ms-asf',
    'video/mp4',
    'video/quicktime',
    'video/x-matroska',
    'video/webm',
    'application/octet-stream',
  ],
  features: {
    segment_timestamps: true,
    word_timestamps: true,
    srt: true,
    vtt: true,
  },
};

export async function getASRCapabilities() {
  try {
    const res = await apiFetch('/api/v1/asr/capabilities', { skipAuthExpiredEvent: true });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.audio_extensions)) {
        return data;
      }
    }
  } catch {
    // fallback to alias endpoint
  }

  try {
    const res = await apiFetch('/api/v1/asr/jobs/capabilities', { skipAuthExpiredEvent: true });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.audio_extensions)) {
        return data;
      }
    }
  } catch {
    // fallback to default
  }

  return DEFAULT_ASR_CAPABILITIES;
}

export function uploadASRMediaWithProgress(path, formData, { onProgress } = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${path}`);
    xhr.withCredentials = true;

    if (xhr.upload && typeof onProgress === 'function') {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = null;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const message = data?.detail || `ASR istegi basarisiz (${xhr.status})`;
        const err = new Error(message);
        err.status = xhr.status;
        err.detail = data?.detail;
        reject(err);
      }
    };

    xhr.onerror = () => {
      reject(new Error('Ag baglanti hatasi olustu.'));
    };

    xhr.send(formData);
  });
}

export async function getASRDownloadInfo(jobId, format = 'txt') {
  return apiJson(`/api/v1/asr/jobs/${jobId}/download?format=${encodeURIComponent(format.toLowerCase())}`, {
    skipAuthExpiredEvent: true,
  });
}

export async function downloadFileFromUrl(url, filename) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Download failed');

    let resolvedFilename = filename;
    if (!resolvedFilename) {
      const disposition = res.headers.get('content-disposition');
      if (disposition) {
        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match && utf8Match[1]) {
          resolvedFilename = decodeURIComponent(utf8Match[1].trim());
        } else {
          const match = disposition.match(/filename="?([^";]+)"?/i);
          if (match && match[1]) {
            resolvedFilename = match[1].trim();
          }
        }
      }
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = resolvedFilename || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    if (filename) a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

export function adaptASRResult(raw) {
  if (!raw) return null;
  const segments = Array.isArray(raw.segments)
    ? raw.segments.map((s, idx) => ({
        id: s.id ?? idx,
        start: typeof s.start === 'number' ? s.start : 0,
        end: typeof s.end === 'number' ? s.end : 0,
        text: (s.text || '').trim(),
        words: Array.isArray(s.words)
          ? s.words.map((w) => ({
              start: typeof w.start === 'number' ? w.start : 0,
              end: typeof w.end === 'number' ? w.end : 0,
              word: (w.word || '').trim(),
              probability: typeof w.probability === 'number' ? w.probability : null,
            }))
          : [],
      }))
    : [];

  const words = Array.isArray(raw.words)
    ? raw.words.map((w) => ({
        start: typeof w.start === 'number' ? w.start : 0,
        end: typeof w.end === 'number' ? w.end : 0,
        word: (w.word || '').trim(),
        probability: typeof w.probability === 'number' ? w.probability : null,
      }))
    : segments.flatMap((s) => s.words || []);

  const text = (raw.text || raw.output_text || segments.map((s) => s.text).join(' ')).trim();

  return {
    job_id: raw.job_id || raw.id || null,
    status: raw.status || 'completed',
    text,
    segments,
    words,
    media_type: raw.media_type || 'audio',
    original_filename: raw.original_filename || raw.filename || '',
    duration_seconds: raw.duration_seconds || raw.audio_duration_seconds || 0,
    language: raw.language || 'tr',
    srt: raw.srt || null,
    vtt: raw.vtt || null,
    error: raw.error || raw.error_message || null,
  };
}

export async function getOperationHistory({ page = 1, page_size = 20, type = 'all', status = 'all' } = {}) {
  const params = new URLSearchParams();
  if (page) params.set('page', String(page));
  if (page_size) params.set('page_size', String(page_size));
  if (type && type !== 'all') params.set('type', type);
  if (status && status !== 'all') params.set('status', status);
  const query = params.toString();
  return apiJson(`/api/v1/me/operations${query ? `?${query}` : ''}`, { skipAuthExpiredEvent: true });
}

export async function getOperationDetails(operationId) {
  return apiJson(`/api/v1/me/operations/${encodeURIComponent(operationId)}`, { skipAuthExpiredEvent: true });
}

export async function getOperationDownloadUrl(operationId, format = 'audio') {
  return apiJson(`/api/v1/me/operations/${encodeURIComponent(operationId)}/download?format=${encodeURIComponent(format)}`, {
    skipAuthExpiredEvent: true,
  });
}

export async function getStoragePreferences() {
  return apiJson('/api/v1/me/storage-preferences', { skipAuthExpiredEvent: true });
}

export async function updateStoragePreferences(retentionDays) {
  return apiJson('/api/v1/me/storage-preferences', {
    method: 'PATCH',
    body: JSON.stringify({ retention_days: Number(retentionDays) }),
  });
}
