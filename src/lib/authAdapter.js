import { apiJson } from './api';

/** @typedef {{ email: string, password: string }} EmailSignInPayload */
/** @typedef {EmailSignInPayload & { full_name: string, phone: string, termsAccepted: boolean, marketingConsent: boolean }} EmailRegistrationPayload */
/** @typedef {{ state: 'authenticated', user: object } | { state: 'needs_legal_acceptance' } | { state: 'account_link_required' }} GoogleAuthResult */

export class AuthIntegrationError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'AuthIntegrationError';
    this.code = code;
  }
}

const googleEndpoint = import.meta.env.VITE_GOOGLE_AUTH_ENDPOINT?.trim() || '';
// TODO(BACKEND): Supply the Google credential-verification endpoint and validate ID-token signature, issuer, audience and expiry on the server.
const googleOnboardingEndpoint = import.meta.env.VITE_GOOGLE_ONBOARDING_ENDPOINT?.trim() || '';
const googleEnabled = import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true';
export const termsVersion = import.meta.env.VITE_TERMS_VERSION?.trim() || '';
const emailConsentEnabled = import.meta.env.VITE_EMAIL_CONSENT_ENABLED === 'true';
// New accounts must not be created against the unapproved HOLD Terms in production.
export const emailRegistrationEnabled = import.meta.env.DEV || Boolean(
  import.meta.env.VITE_EMAIL_REGISTRATION_ENABLED === 'true' && emailConsentEnabled && termsVersion,
);

function isApiPath(path) {
  return /^\/api\/v1\/[a-z0-9/_-]+$/i.test(path);
}

export const googleAuthConfigured = Boolean(
  googleEnabled && import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() && isApiPath(googleEndpoint),
);

export const googleOnboardingConfigured = googleAuthConfigured && isApiPath(googleOnboardingEndpoint) && Boolean(termsVersion);

/** @param {string} credential @returns {Promise<GoogleAuthResult>} */
export async function signInWithGoogle(credential) {
  if (!googleAuthConfigured) throw new AuthIntegrationError('BACKEND_NOT_CONFIGURED');
  if (typeof credential !== 'string' || !credential.trim()) throw new AuthIntegrationError('INVALID_CREDENTIAL');
  // TODO(BACKEND): Match an existing account by Google's immutable `sub`; define explicit account linking, never merge by email in this adapter.
  // TODO(BACKEND): Establish an HttpOnly Secure session only after verification and enforce CSRF/Origin checks plus credentialed CORS if the API is cross-origin.
  const result = await apiJson(googleEndpoint, {
    method: 'POST',
    body: JSON.stringify({ credential }),
    skipAuthRefresh: true,
    skipAuthExpiredEvent: true,
  });
  if (result?.user) return { state: 'authenticated', user: result.user };
  if (result?.state === 'needs_legal_acceptance') return { state: 'needs_legal_acceptance' };
  if (result?.state === 'account_link_required') return { state: 'account_link_required' };
  throw new AuthIntegrationError('INVALID_BACKEND_RESPONSE');
}

export async function completeGoogleRegistration(consent) {
  if (!googleOnboardingConfigured) throw new AuthIntegrationError('BACKEND_NOT_CONFIGURED');
  if (consent?.termsAccepted !== true || consent?.termsVersion !== termsVersion) throw new AuthIntegrationError('LEGAL_ACCEPTANCE_REQUIRED');
  // TODO(BACKEND): Finish first-user enrollment server-side; persist the approved Terms version, server timestamp and optional marketing choice separately before creating a session.
  const result = await apiJson(googleOnboardingEndpoint, {
    method: 'POST',
    body: JSON.stringify({
      terms_accepted: true,
      terms_version: consent.termsVersion,
      marketing_consent: Boolean(consent.marketingConsent),
    }),
    skipAuthRefresh: true,
    skipAuthExpiredEvent: true,
  });
  if (!result?.user) throw new AuthIntegrationError('INVALID_BACKEND_RESPONSE');
  return result.user;
}

/** @param {EmailSignInPayload} payload */
export function signInWithEmail(payload) {
  // TODO(BACKEND): Return a verified user only after the server has created the normal HttpOnly session; protect cookie mutations against CSRF.
  return apiJson('/api/v1/auth/login', { method: 'POST', body: JSON.stringify(payload) });
}

/** @param {EmailRegistrationPayload} payload */
export function registerWithEmail(payload) {
  if (!emailRegistrationEnabled) throw new AuthIntegrationError('LEGAL_APPROVAL_REQUIRED');
  const { email, password, full_name, phone, termsAccepted, marketingConsent } = payload;
  if (!termsAccepted) throw new AuthIntegrationError('LEGAL_ACCEPTANCE_REQUIRED');
  if (emailConsentEnabled && !termsVersion) throw new AuthIntegrationError('BACKEND_NOT_CONFIGURED');
  // TODO(BACKEND): Record the legally approved Terms version and acceptance timestamp on the server before enabling production registration.
  return apiJson('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email, password, full_name, phone,
      ...(emailConsentEnabled ? {
        terms_accepted: true,
        terms_version: termsVersion,
        marketing_consent: Boolean(marketingConsent),
      } : {}),
    }),
  });
}

export function getCurrentUser() {
  // TODO(BACKEND): Expose an authenticated account-deletion workflow and confirm deletion/retention handling before adding a profile deletion control.
  return apiJson('/api/v1/auth/me', { skipAuthExpiredEvent: true });
}

export function signOut() {
  return apiJson('/api/v1/auth/logout', { method: 'POST' });
}
