import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/api';
import { createStatusMonitor, fetchServiceStatus } from '../lib/serviceStatus';
import './MaintenanceNotice.css';

/**
 * Custom hook to monitor backend readiness.
 * - Checks on mount.
 * - If the first check is "down", checks again after 10s and only shows the notice
 *   if that second check is also "down" (no flash on a single blip).
 * - While shown or hidden, re-checks every 60s; hides as soon as a check is "up".
 * - Pauses the interval while document.visibilityState === "hidden" and checks
 *   immediately when the tab becomes visible again.
 * - Cleans up timers and aborts in-flight requests on unmount.
 *
 * @param {Object} [options]
 * @param {string} [options.baseUrl]
 * @param {number} [options.firstRetryDelayMs]
 * @param {number} [options.checkIntervalMs]
 * @returns {boolean} isNoticeVisible
 */
function useMaintenanceNotice({
  baseUrl = API_BASE_URL,
  firstRetryDelayMs = 10000,
  checkIntervalMs = 60000,
} = {}) {
  const [isNoticeVisible, setIsNoticeVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const monitor = createStatusMonitor({
      check: ({ signal }) => {
        if (cancelled) return Promise.resolve('down');
        return fetchServiceStatus({ baseUrl, signal });
      },
      onChange: (visible) => {
        if (!cancelled) {
          setIsNoticeVisible(visible);
        }
      },
      confirmDelayMs: firstRetryDelayMs,
      pollMs: checkIntervalMs,
    });

    monitor.start();

    const handleVisibilityChange = () => {
      if (!cancelled) {
        monitor.onVisibilityChange();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      cancelled = true;
      monitor.stop();
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [baseUrl, firstRetryDelayMs, checkIntervalMs]);

  return isNoticeVisible;
}

export default function MaintenanceNotice({ appLanguage, language, t: tProp }) {
  const isNoticeVisible = useMaintenanceNotice();
  const activeLang = appLanguage || language || 'tr';
  const t = typeof tProp === 'function' ? tProp : (tr, en) => (activeLang === 'en' ? en : tr);

  if (!isNoticeVisible) {
    return null;
  }

  const title = t('Bakım Çalışması', 'Maintenance in Progress');
  const message = t(
    'Hizmetlerimizi size daha iyi sunabilmek için şu anda bakım çalışması yürütüyoruz. Bu süre içinde seslendirme ve deşifre hizmetlerimize erişimde geçici kesintiler yaşanabilir. En kısa sürede yeniden hizmetinizde olacağız; anlayışınız için teşekkür ederiz.',
    'We are currently carrying out maintenance to serve you better. Text-to-speech and transcription services may be temporarily unavailable during this time. We will be back at your service as soon as possible. Thank you for your understanding.'
  );

  return (
    <div className="maintenance-notice-wrapper">
      <aside
        className="maintenance-notice"
        role="status"
        aria-live="polite"
      >
        <div className="maintenance-notice-icon-wrap" aria-hidden="true">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <div className="maintenance-notice-content">
          <h2 className="maintenance-notice-title">{title}</h2>
          <p className="maintenance-notice-text">{message}</p>
        </div>
      </aside>
    </div>
  );
}
