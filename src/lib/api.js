const rawBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || '';

// Local Vite development uses the same-origin /api proxy so HttpOnly cookies
// are handled by the development host. Production keeps the configured API.
export const API_BASE_URL = import.meta.env.DEV ? '' : rawBaseUrl.replace(/\/$/, '');

// Several protected pages load their data in parallel. Keep one refresh in
// flight so rotating refresh tokens cannot invalidate each other.
let refreshPromise = null;
let authExpiredDispatched = false;

function authTrace(label, details) {
  if (import.meta.env.DEV) {
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
    throw error;
  }
  return data;
}

export function isAuthError(error) {
  if (!error) return false;
  const message = String(error.message || error.detail || '').toLowerCase();
  return error.status === 401 || message.includes('not authenticated') || message.includes('unauthenticated');
}
