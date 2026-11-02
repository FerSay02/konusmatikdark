# Google authentication: frontend/backend handoff

> Historical handoff: the endpoint and feature-flag details below predate the current implementation. For the current contract and server-owned terms version, see [email-registration-terms.md](email-registration-terms.md).

Status: frontend integration boundary prepared. Google login is disabled until the backend exchange, onboarding and approved legal version are configured and tested. No real Google session has been verified.

## Public configuration

Use only a **Web OAuth Client ID** in `VITE_GOOGLE_CLIENT_ID`. Register the actual HTTPS origin in Google Cloud. Never put a Client Secret in a `VITE_` variable or frontend bundle. Set `VITE_GOOGLE_AUTH_ENABLED=true` only after the backend is live. Backend owner supplies same-origin `/api/v1/...` paths in `VITE_GOOGLE_AUTH_ENDPOINT` and `VITE_GOOGLE_ONBOARDING_ENDPOINT`; the frontend does not assume an endpoint name. Set `VITE_TERMS_VERSION` to the legally approved published version. Keep `VITE_EMAIL_CONSENT_ENABLED=false` until the current registration endpoint accepts and stores the consent fields.

The frontend renders the official Google Identity Services button with `google.accounts.id.initialize` and `renderButton` in popup mode. The callback receives `response.credential`, sends it directly to `signInWithGoogle(credential)`, and never stores or logs it. SDK load/render errors are shown without creating a session. Closing the Google popup leaves the page unauthenticated; the user may retry.

## Adapter contract

`src/lib/authAdapter.js` exports `signInWithGoogle(credential)`, `signInWithEmail(payload)`, `registerWithEmail(payload)`, `getCurrentUser()`, `signOut()`, and `completeGoogleRegistration(consent)`. Existing email/login/session URLs stay unchanged. Google calls throw `BACKEND_NOT_CONFIGURED` when the flag, public Client ID or endpoint is absent. Configured endpoints must be same-origin `/api/v1/...` paths. Requests use the existing `apiJson` client and `credentials: include`.

Proposed Google exchange request (actual path supplied by backend): `POST {VITE_GOOGLE_AUTH_ENDPOINT}` with JSON `{ "credential": "<Google ID token>" }`. Successful responses must be one of:

- `{ "user": { ...existing user fields... } }` — a verified HttpOnly server session exists; only then may the frontend call `onAuthenticated`.
- `{ "state": "needs_legal_acceptance" }` — backend holds a short-lived, server-side pending enrollment associated with an HttpOnly cookie. No authenticated access yet.
- `{ "state": "account_link_required" }` — show email sign-in guidance. Never link accounts solely by matching email in the browser.

The frontend rejects any other success body. Backend errors should be JSON `{ "code": "STABLE_ERROR_CODE", "detail": "safe user message" }` with appropriate 4xx/5xx statuses. Suggested stable codes: `INVALID_GOOGLE_CREDENTIAL`, `GOOGLE_ACCOUNT_DISABLED`, `ACCOUNT_LINK_REQUIRED`, `RATE_LIMITED`, `LEGAL_ACCEPTANCE_REQUIRED`, `SESSION_UNAVAILABLE`. A 409 `ACCOUNT_LINK_REQUIRED` is also handled. Do not return the submitted ID token in any response.

On first registration, `POST {VITE_GOOGLE_ONBOARDING_ENDPOINT}` receives `{ "terms_accepted": true, "terms_version": "<approved version>", "marketing_consent": false|true }` using the pending HttpOnly cookie. Return `{ "user": { ... } }` only after persisting the legal record and establishing the normal session. Failed or canceled onboarding must not authenticate the user. Pending enrollment expiry and retry rules belong to the backend.

For existing email registration, the frontend currently preserves the four-field request `{email,password,full_name,phone}`. Once the backend confirms support, setting `VITE_EMAIL_CONSENT_ENABLED=true` appends `terms_accepted`, `terms_version`, and `marketing_consent`. Backend must validate and store document version and server timestamp; the browser's checkbox is not a durable record. KVKK disclosure and optional marketing consent remain separate.

Production email registration is disabled by default while the linked Terms are HOLD. It requires `VITE_EMAIL_REGISTRATION_ENABLED=true`, `VITE_EMAIL_CONSENT_ENABLED=true` and an approved nonempty `VITE_TERMS_VERSION` at build time. The login and password-reset routes remain available. The registration flag is a technical gate; legal approval and backend evidence of acceptance must precede enablement.

## Security and account policy

Verify Google token signature, issuer, audience, expiry, and nonce if used; bind users by Google's immutable `sub`. Define explicit account linking with a separately authenticated existing account, not automatic email merging. Review CSRF protection for the JSON credential exchange and cookie-based onboarding, `Origin` checks, SameSite/Secure/HttpOnly cookie attributes, and allowed CORS origins. Existing `VITE_API_BASE_URL` can point to an API origin; if it differs from the site origin, the backend must configure credentialed CORS and cookie domain/SameSite policy. The endpoint **path** remains `/api/v1/...`; the existing API client prepends the configured API origin. Do not use tokens in URL, localStorage, sessionStorage or console output. Existing logout must invalidate the server session; call GIS `disableAutoSelect` if future One Tap or auto-select is enabled.

## Backend developer checklist

- [ ] Confirm Google Cloud Web Client ID and authorized site origins.
- [ ] Choose and document exchange/onboarding paths, request and response schemas, and stable error codes.
- [ ] Verify Google ID tokens server-side; enforce CSRF, origin, rate limits and secure cookies.
- [ ] Decide existing-account linking and pending-enrollment expiry/retry behavior.
- [ ] Persist Terms version, server timestamp, optional marketing preference, and evidence of notice version separately.
- [ ] Extend email registration to persist consent fields before enabling `VITE_EMAIL_CONSENT_ENABLED`.
- [ ] Test sign-in, first signup, account-link-required, invalid/expired token, canceled popup, backend outage, onboarding denial/expiry, logout and session refresh.
- [ ] Confirm legal approval and public privacy URL before enabling Google auth.

Test mocks in `tests/` only prove the frontend callback and states. They do not prove a real Google login or server token verification.

## Checkout agreement records

Checkout now links to the KVKK notice without demanding a general processing consent. The old hard-coded distance-sales and pre-contract text was removed because seller and refund claims were unverified. Production payment defaults to disabled through `VITE_CHECKOUT_PAYMENT_ENABLED=false`; enabling this switch alone does not make purchase terms legally complete. Before payment launch, the backend owner must define how the approved transaction-specific preliminary information, distance-sales/service agreement version, selected plan, authoritative tax-inclusive total and acceptance timestamp are recorded. Registration Terms acceptance and any optional marketing choice remain separate records; neither substitutes for the purchase documents.
