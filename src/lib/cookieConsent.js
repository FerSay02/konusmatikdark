export const COOKIE_CONSENT_KEY = 'konusmatik_cookie_consent';
export const COOKIE_CONSENT_VERSION = import.meta.env.VITE_COOKIE_CONSENT_VERSION || '1';
const renewalDays = Number(import.meta.env.VITE_COOKIE_CONSENT_RENEW_DAYS || 0);
const changeEvent = 'konusmatik:cookie-consent-change';
const openEvent = 'konusmatik:cookie-preferences-open';
const optionalKeys = ['functional', 'analytics', 'marketing'];

const defaults = () => ({ necessary: true, functional: false, analytics: false, marketing: false, hasDecision: false });
let memoryConsent = null;

export function getConsent() {
  let saved;
  try { saved = JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY) || 'null') || memoryConsent; } catch { saved = memoryConsent; }
  if (!saved || saved.consentVersion !== COOKIE_CONSENT_VERSION || !saved.updatedAt) return defaults();
  const timestamp = Date.parse(saved.updatedAt);
  if (!Number.isFinite(timestamp) || timestamp > Date.now()) return defaults();
  if (Number.isFinite(renewalDays) && renewalDays > 0 && Date.now() - timestamp > renewalDays * 86400000) return defaults();
  return {
    necessary: true,
    ...Object.fromEntries(optionalKeys.map((key) => [key, saved.selectedCategories?.[key] === true])),
    hasDecision: true,
    updatedAt: saved.updatedAt,
  };
}

export function setConsent(preferences) {
  const selectedCategories = { necessary: true, ...Object.fromEntries(optionalKeys.map((key) => [key, preferences?.[key] === true])) };
  const record = { consentVersion: COOKIE_CONSENT_VERSION, selectedCategories, updatedAt: new Date().toISOString() };
  memoryConsent = record;
  try { localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(record)); } catch { /* Keep this page's preference in memory. */ }
  // TODO(BACKEND): If consent evidence is required, store version, categories and server timestamp without turning missing consent into acceptance.
  // TODO(BACKEND): Reconcile authenticated users' preferences and withdrawal records without exposing cross-device state as a frontend guarantee.
  window.dispatchEvent(new CustomEvent(changeEvent, { detail: getConsent() }));
  return getConsent();
}

export const acceptAll = () => setConsent({ functional: true, analytics: true, marketing: true });
export const rejectOptional = () => setConsent({ functional: false, analytics: false, marketing: false });
export const withdrawConsent = () => rejectOptional();
export const openPreferences = () => window.dispatchEvent(new Event(openEvent));
export const consentEvents = { changeEvent, openEvent };

// TODO(BACKEND): Inventory Set-Cookie names, flags and lifetimes; the browser cannot remove HttpOnly or third-party-domain cookies.
// TODO(BACKEND): Verify this frontend storage list against session, payment and third-party service cookie inventories before legal publication.
// TODO(BACKEND): Coordinate provider-supported cleanup on withdrawal before any optional analytics/marketing service is introduced.
