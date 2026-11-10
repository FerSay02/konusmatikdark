/**
 * Service status checker and readiness classifier for backend readiness.
 * Pure ES module without React or import.meta at module level so it can run
 * seamlessly under Node.js test runners and in browser environments.
 */

/**
 * Classifies the readiness payload into 'up', 'down', or 'unknown'.
 * 'up' only if the response arrived, HTTP status is 200, and body.status === "ok"
 * with all reported services 'ok'.
 * 'unknown' for any 4xx client errors (404, 401, 403, 429, etc.).
 * Everything else (network error, timeout, non-JSON body, 5xx, 503 degraded,
 * any service not "ok") is 'down'.
 *
 * @param {Object} [params]
 * @param {boolean} [params.ok]
 * @param {number} [params.status]
 * @param {any} [params.body]
 * @param {any} [params.error]
 * @returns {'up' | 'down' | 'unknown'}
 */
export function classifyReadiness({ ok, status, body, error } = {}) {
  if (error) return 'down';
  const statusCode = Number(status);
  if (Number.isFinite(statusCode) && statusCode >= 400 && statusCode < 500) {
    return 'unknown';
  }
  if (ok === false || status !== 200) return 'down';
  if (!body || typeof body !== 'object') return 'down';
  if (body.status !== 'ok') return 'down';

  if (body.services && typeof body.services === 'object') {
    const serviceEntries = Object.values(body.services);
    for (const service of serviceEntries) {
      if (typeof service === 'string') {
        if (service.toLowerCase() !== 'ok') return 'down';
      } else if (service && typeof service === 'object') {
        if (service.status && String(service.status).toLowerCase() !== 'ok') {
          return 'down';
        }
      }
    }
  }

  return 'up';
}

/**
 * Fetches the backend /ready endpoint and returns 'up', 'down', or 'unknown'.
 * Always safe; never throws.
 *
 * @param {Object} [options]
 * @param {string} [options.baseUrl]
 * @param {typeof fetch} [options.fetchImpl]
 * @param {number} [options.timeoutMs]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<'up' | 'down' | 'unknown'>}
 */
export async function fetchServiceStatus({
  baseUrl = '',
  fetchImpl = fetch,
  timeoutMs = 8000,
  signal: externalSignal,
} = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let onExternalAbort = null;
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timer);
      return 'down';
    }
    onExternalAbort = () => controller.abort();
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const normalizedBase = (baseUrl || '').replace(/\/+$/, '');
    const url = `${normalizedBase}/ready`;
    const response = await fetchImpl(url, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });

    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    return classifyReadiness({
      ok: response.ok,
      status: response.status,
      body,
    });
  } catch {
    return 'down';
  } finally {
    clearTimeout(timer);
    if (externalSignal && onExternalAbort) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Creates a pure, framework-free status monitor controller.
 * Manages readiness polling, confirmation delays, visibility changes,
 * and request cancellation / deduplication.
 *
 * @param {Object} options
 * @param {(context?: { signal?: AbortSignal }) => Promise<'up' | 'down' | 'unknown'>} options.check
 * @param {(callback: () => void, delayMs: number) => any} [options.setTimer]
 * @param {(timerId: any) => void} [options.clearTimer]
 * @param {() => boolean} [options.isVisible]
 * @param {(visible: boolean) => void} [options.onChange]
 * @param {number} [options.confirmDelayMs]
 * @param {number} [options.pollMs]
 * @returns {{ start: () => void, stop: () => void, onVisibilityChange: () => void, isNoticeVisible: () => boolean }}
 */
export function createStatusMonitor({
  check = async () => 'up',
  setTimer = (fn, delay) => setTimeout(fn, delay),
  clearTimer = (id) => clearTimeout(id),
  isVisible = () => (typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true),
  onChange = () => {},
  confirmDelayMs = 10000,
  pollMs = 60000,
} = {}) {
  let started = false;
  let isNoticeVisible = false;
  let activeTimerId = null;
  let currentCheckId = 0;
  let activeAbortController = null;

  const clearScheduledCheck = () => {
    if (activeTimerId != null) {
      clearTimer(activeTimerId);
      activeTimerId = null;
    }
  };

  const abortInFlight = () => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    currentCheckId++;
  };

  const scheduleTimer = (fn, delayMs) => {
    clearScheduledCheck();
    if (!started) return;
    if (isVisible && !isVisible()) return;
    activeTimerId = setTimer(() => {
      activeTimerId = null;
      fn();
    }, delayMs);
  };

  const runCheck = async (isRetry = false) => {
    if (!started) return;
    if (isVisible && !isVisible()) {
      // Document visibility check: if tab is hidden, do not initiate checks.
      return;
    }

    clearScheduledCheck();
    abortInFlight();

    const checkId = ++currentCheckId;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    activeAbortController = controller;

    let result;
    try {
      result = await check({ signal: controller?.signal });
    } catch {
      result = 'down';
    }

    // Discard result if monitor was stopped, check was superseded, or controller was aborted
    if (!started) return;
    if (checkId !== currentCheckId) return;
    if (controller && controller.signal.aborted) return;

    // Review note 4: a result that arrives while the tab is hidden is dropped;
    // the next visible event will trigger an immediate re-check.
    if (isVisible && !isVisible()) {
      return;
    }

    if (activeAbortController === controller) {
      activeAbortController = null;
    }

    if (result !== 'down') {
      if (isNoticeVisible) {
        isNoticeVisible = false;
        onChange(false);
      }
      scheduleTimer(() => {
        runCheck(false);
      }, pollMs);
    } else {
      // result === 'down'
      if (isNoticeVisible) {
        // Notice is already shown; keep showing and schedule next regular poll
        scheduleTimer(() => {
          runCheck(false);
        }, pollMs);
      } else if (isRetry) {
        // Second check also failed; show notice and schedule regular poll
        isNoticeVisible = true;
        onChange(true);
        scheduleTimer(() => {
          runCheck(false);
        }, pollMs);
      } else {
        // First down check: confirm after confirmDelayMs without flashing notice yet
        scheduleTimer(() => {
          runCheck(true);
        }, confirmDelayMs);
      }
    }
  };

  const start = () => {
    if (started) return;
    started = true;
    if (isVisible && !isVisible()) {
      // Tab is currently hidden; wait for visibilitychange event
      return;
    }
    runCheck(false);
  };

  const stop = () => {
    started = false;
    clearScheduledCheck();
    abortInFlight();
  };

  const onVisibilityChange = () => {
    if (!started) return;
    const visible = isVisible ? isVisible() : true;
    if (!visible) {
      // Tab became hidden: pause polling and cancel in-flight check
      clearScheduledCheck();
      abortInFlight();
    } else {
      // Tab became visible: resume with an immediate check
      clearScheduledCheck();
      abortInFlight();
      runCheck(false);
    }
  };

  return {
    start,
    stop,
    onVisibilityChange,
    isNoticeVisible: () => isNoticeVisible,
  };
}
