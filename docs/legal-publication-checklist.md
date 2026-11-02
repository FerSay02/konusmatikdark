# Legal page publication checklist

## Cookie policy HOLD (2026-10-28 technical review)

`/cerez-politikasi/` is a fourth public HOLD page. It is prerendered with canonical and `noindex, nofollow`, and is absent from the sitemap. Its current copy is a technical draft, not a legally approved cookie policy. Frontend inventory found a first-party localStorage consent record, user interface preferences, sessionStorage plan/audience records and two Google Maps iframes. The iframes now wait for functional consent. No GA4, GTM, Ads or other analytics/marketing script is present in the current frontend. Before legal approval and publication, verify backend `Set-Cookie` names, purposes, lifetimes, flags, consent evidence and withdrawal handling; inspect Google's actual third-party storage/network behavior; and approve the company/controller statement, legal basis, recipients, transfers and Turkish/English copy. Adding a tracker later requires consent-gated loading and a consent version review.

The three pages in `src/pages/LegalPage.jsx` currently show a public **HOLD** explanation built from frontend-observable facts. Editorial TODO notes are not rendered into their first HTML. They are prerendered with canonical metadata but `noindex, nofollow` and omitted from the sitemap until legal approval. The five files in `docs/legal-input/` have now been reviewed; all three proposed policies explicitly identify themselves as unapproved drafts. **Do not mark these drafts legally approved or submit the privacy URL for Google OAuth verification until the facts below are confirmed and counsel approves the final text.**

Production new-account registration is disabled by default as well as payment. Existing users may still sign in. After approval, registration requires the `VITE_EMAIL_REGISTRATION_ENABLED` and `VITE_EMAIL_CONSENT_ENABLED` feature gates plus an approved server-configured terms version and verified backend persistence. `VITE_TERMS_VERSION` is no longer the registration version source; see [email-registration-terms.md](email-registration-terms.md). These switches are technical gates, not a substitute for legal approval.

## Draft-to-frontend reconciliation

| Draft | Verified and reflected in the HOLD pages | Requires company, backend or legal approval |
|---|---|---|
| `01-gizlilik-politikasi-TASLAK.md` | Registration fields, session requests with credentials, TTS text and settings, ASR audio upload/transcript, voice reference upload, browser preferences, PayTR iframe, Google Maps iframe and disabled Google sign-in. | Data controller and contact channel; actual Google claims/scopes after activation; server cookies/logs; recipients, countries, legal bases, retention/deletion, model training, security measures and request procedure. The draft's proposed audio/**video** category must not imply verified video support. |
| `02-kvkk-aydinlatma-TASLAK.md` | UI collection methods, billing fields, separate notice link and optional marketing choice. | Each processing activity's precise purpose and legal basis; controller identity/address, recipients and transfer purpose, retention, verified rights-request channel. The draft table contains placeholders and is not suitable as public notice. |
| `03-kullanim-kosullari-TASLAK.md` | Visible TTS/ASR, account, plans and checkout flows; Google sign-in remains disabled until backend verification. | Contracting entity, actual service scope, output rights, voice-cloning policy, age rules, pricing/tax/renewal, cancellation/refund, service levels, violations, account closure and dispute terms. The draft is not a binding agreement. |

`04-yayin-ve-hukuk-onay-kontrol-listesi.md` and `05-codex-uygulama-komutu.md` were reviewed as work instructions, not as publishable policy text. Their DeepZeka email, phone and office references do **not** establish Konuşmatik’s approved data-controller identity or KVKK request channel.

## Company confirmation needed

- The project owner supplied the public corporate phone `+90 312 577 17 15`; it is used in contact/footer and Organization schema. This does not by itself establish the controller's formal KVKK request channel.
- The newly named `00-sirket-bilgileri.md`, `05-backend-gelistiricisine-devir.md` and `06-codex-uygulama-promtu.md` were not present in `docs/legal-input/` during this pass. Do not transfer company, bank or personal-contact claims from an unavailable document into public copy. Reconcile these three files when they are provided.
- Confirm the exact contracting entity and data controller for Konuşmatik, registered trade name, address and request/contact channel. `src/pages/Checkout.jsx` and `src/pages/Contact.jsx` mention DeepZeka and contact details, but this repository alone cannot verify that those details govern every Konuşmatik account, TTS/ASR workflow and Google sign-in.
- Inventory actual data fields collected in email and Google registration, sessions, logs, TTS text, ASR audio, support and payment flows.
- For each processing activity, document its concrete purpose, collection method and applicable KVKK legal basis; separately identify any activity requiring explicit consent.
- Identify processors, recipient categories, international transfers, security measures, retention periods, deletion practices and data-subject request procedure from actual contracts and infrastructure.
- Approve service scope, output rights, fees, cancellation, refund, renewal, service-level and dispute terms.
- Assign an approved Terms version and publication/update date. Configure the backend's shared terms version only after approval; retain the document version and server-side acceptance timestamp.
- Confirm marketing communication channels and consent language. Keep the separate marketing checkbox optional and unchecked by default.
- Review Turkish and English text together; record legal approval for both languages.
- The former `src/pages/Checkout.jsx` combined KVKK notice and mandatory general consent; that checkbox and the embedded unverified seller, retention, transfer and no-refund assertions have been removed. Checkout now links to the HOLD KVKK notice without requiring a general consent. Production payment is disabled by default. Do not enable it until an approved, transaction-specific preliminary information form and distance-sales/service agreement, verified seller identity/contact details, tax-inclusive total, duration/renewal, withdrawal/refund terms and durable acceptance records are implemented and tested. The Terms of Use link does not replace those purchase documents. The legal team must determine whether a separate consent is needed for any specific activity; the frontend cannot infer this.
- Confirm which ASR file types the backend actually accepts. The picker lists audio extensions, while drag-and-drop currently does not validate extension or MIME type. Do not assert video support from the drafts.

## Publication check

After approval, replace the HOLD content in `LegalPage.jsx` with the approved policy/notice/terms, remove `noindex` from the three `src/seo.js` records, add the three URLs to `scripts/seo-content.mjs` sitemap routes, update the legal HOLD tests and the checkout disclosures, then rebuild. Check all three first HTTP HTML responses, links, sitemap, robots and canonical URLs on the actual host. The live server currently serves the older empty SPA HTML and 8-URL sitemap; local prerender alone is not proof of public publication.
