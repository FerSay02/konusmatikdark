import { apiJson } from './api';

/** @typedef {{ email: string, password: string }} EmailSignInPayload */
/** @typedef {EmailSignInPayload & { full_name: string, phone: string, termsAccepted: boolean, termsVersion: string }} EmailRegistrationPayload */
/** @typedef {{ state: 'authenticated', user: object } | { state: 'needs_legal_acceptance' } | { state: 'account_link_required' }} GoogleAuthResult */

export class AuthIntegrationError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'AuthIntegrationError';
    this.code = code;
  }
}

const googleEndpoint = '/api/v1/auth/google';
// TODO(BACKEND): Supply the Google credential-verification endpoint and validate ID-token signature, issuer, audience and expiry on the server.
const googleEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';
const emailConsentEnabled = import.meta.env.VITE_EMAIL_CONSENT_ENABLED === 'true';
// New accounts must not be created against the unapproved HOLD Terms in production.
export const emailRegistrationEnabled = import.meta.env.DEV || Boolean(
  import.meta.env.VITE_EMAIL_REGISTRATION_ENABLED === 'true' && emailConsentEnabled,
);

function isApiPath(path) {
  return /^\/api\/v1\/[a-z0-9/_-]+$/i.test(path);
}

export const googleAuthConfigured = Boolean(
  googleEnabled && import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() && isApiPath(googleEndpoint) &&
  (import.meta.env.DEV || import.meta.env.VITE_GOOGLE_CONSENT_BACKEND_READY === 'true'),
);

const googleHeaders = { 'X-Requested-With': 'XMLHttpRequest' };
const googleRequest = (path, body) => apiJson(path, {
  method: 'POST', headers: googleHeaders, body: JSON.stringify(body),
  skipAuthRefresh: true, skipAuthExpiredEvent: true,
});

export const beginGoogleSignIn = () => googleRequest('/api/v1/auth/google/nonce', {});
export const completeGoogleRegistration = (termsVersion) => googleRequest('/api/v1/auth/google/complete-registration', { terms_accepted: true, terms_version: termsVersion });
export const beginGoogleLink = (password) => googleRequest('/api/v1/auth/google/link/init', { password, confirm: true });
export const completeGoogleLink = (credential) => googleRequest('/api/v1/auth/google/link', { credential });
export const getIdentities = () => apiJson('/api/v1/auth/identities', { skipAuthExpiredEvent: true });

export async function getRegistrationTerms() {
  const result = await apiJson('/api/v1/auth/registration-terms', { skipAuthRefresh: true, skipAuthExpiredEvent: true, cache: 'no-store' });
  if (typeof result?.terms_version !== 'string' || !result.terms_version.trim() || result.terms_version.length > 100) {
    throw new AuthIntegrationError('INVALID_TERMS_VERSION');
  }
  return result.terms_version;
}

export const getGoogleRegistrationTerms = getRegistrationTerms;

/** @param {string} credential @returns {Promise<GoogleAuthResult>} */
export async function signInWithGoogle(credential, consent = null) {
  if (!googleAuthConfigured) throw new AuthIntegrationError('BACKEND_NOT_CONFIGURED');
  if (typeof credential !== 'string' || !credential.trim()) throw new AuthIntegrationError('INVALID_CREDENTIAL');
  // TODO(BACKEND): Match an existing account by Google's immutable `sub`; define explicit account linking, never merge by email in this adapter.
  // TODO(BACKEND): Establish an HttpOnly Secure session only after verification and enforce CSRF/Origin checks plus credentialed CORS if the API is cross-origin.
  if (consent && (consent.termsAccepted !== true || typeof consent.termsVersion !== 'string' || !consent.termsVersion)) {
    throw new AuthIntegrationError('LEGAL_ACCEPTANCE_REQUIRED');
  }
  const result = await googleRequest(googleEndpoint, {
    credential,
    ...(consent ? { terms_accepted: true, terms_version: consent.termsVersion } : {}),
  });
  if (result?.user) return { state: 'authenticated', user: result.user };
  if (result?.state === 'needs_legal_acceptance') return { state: 'needs_legal_acceptance' };
  if (result?.state === 'account_link_required') return { state: 'account_link_required' };
  throw new AuthIntegrationError('INVALID_BACKEND_RESPONSE');
}

/** @param {EmailSignInPayload} payload */
export function signInWithEmail(payload) {
  // TODO(BACKEND): Return a verified user only after the server has created the normal HttpOnly session; protect cookie mutations against CSRF.
  return apiJson('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

/** @param {EmailRegistrationPayload} payload */
export function registerWithEmail(payload) {
  if (!emailRegistrationEnabled) throw new AuthIntegrationError('LEGAL_APPROVAL_REQUIRED');
  const { email, password, full_name, phone, termsAccepted, termsVersion } = payload;
  if (termsAccepted !== true) throw new AuthIntegrationError('LEGAL_ACCEPTANCE_REQUIRED');
  if (typeof termsVersion !== 'string' || !termsVersion.trim()) throw new AuthIntegrationError('BACKEND_NOT_CONFIGURED');
  return apiJson('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email, password, full_name, phone, terms_accepted: true, terms_version: termsVersion,
    }),
    skipAuthRefresh: true,
    skipAuthExpiredEvent: true,
  });
}

export function getCurrentUser() {
  // TODO(BACKEND): Expose an authenticated account-deletion workflow and confirm deletion/retention handling before adding a profile deletion control.
  return apiJson('/api/v1/auth/me', { skipAuthExpiredEvent: true });
}

export function signOut() {
  return apiJson('/api/v1/auth/logout', { method: 'POST' });
}
