# Auth frontend integration contract

The current email/password login, registration, password reset, session lookup and profile routes remain unchanged. The frontend does not persist an acceptance record and does not create a Google session.

## Google Identity Services

- Set `VITE_GOOGLE_CLIENT_ID` to the **public web OAuth client ID**. Never expose the client secret in Vite variables or the browser bundle.
- `GoogleSignInButton` renders Google's official GIS button only when a credential handler is supplied. It currently stays disabled because no verified backend exchange exists.
- The backend should define a CSRF-safe endpoint that verifies the Google ID token signature, issuer, audience, expiry and nonce if used. Return the existing session format or an explicit `needs_legal_acceptance` state. The frontend should call `onAuthenticated` only after this endpoint confirms a session.
- On first Google registration, show `GoogleRegistrationOnboarding`. Complete registration only after the backend stores the terms version, acceptance timestamp, and separate optional marketing preference. Do not treat reading the KVKK notice as explicit consent.

## Email registration

- The UI requires a Terms of Use checkbox. Marketing remains optional and unchecked by default. KVKK notice and privacy policy are separate links.
- The existing `/api/v1/auth/register` payload has not been changed to avoid breaking its current contract. The backend owner must extend the contract and server-side validation to record terms acceptance and marketing preference separately, with document versions and timestamps. The current checkbox state alone is **not** a durable legal record.

## Publication checklist

- Company/legal team must replace every visible TODO in the legal drafts with verified company identity, contact and request channel, concrete processing purposes and legal bases, recipient categories, transfer status, retention periods, and commercial terms. Record an approved publication date.
- Deploy the prerendered legal pages and verify the public `https://konusmatik.com/gizlilik-politikasi/` URL before submitting Google OAuth verification.
