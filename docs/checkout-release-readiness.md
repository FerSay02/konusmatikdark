# Checkout release readiness — HOLD

`Checkout.jsx` no longer renders the unverified seller/contract/KVKK/consent text that was embedded in the old modal. KVKK notice and Privacy Policy are separate direct links. A general processing consent is not demanded at checkout. Terms acceptance is a separate control; the linked Terms page remains HOLD and is **not** a substitute for transaction-specific pre-contract information or a distance-sales/service agreement.

The production build defaults to payment **off** unless `VITE_CHECKOUT_PAYMENT_ENABLED=true` is set at build time. Vite development keeps the existing PayTR token request testable. This flag is only a technical switch; enabling it does **not** constitute legal approval. The frontend still sends the same fields to `/api/v1/payments/paytr/token` and uses the same PayTR iframe after a valid response. No backend or provider setting was changed.

## Purchase information audit

| Item | Current frontend evidence | Release requirement |
|---|---|---|
| Seller identity and contact | Former hard-coded details were unverified and removed from the customer-facing modal. | Company confirms contracting entity, registered name, address, phone and contact channel; display in approved purchase documents. |
| Package and term | Selected plan name and quota are shown. Duration and automatic renewal are absent from the normalized plan. | Product/backend confirms term, renewal and exact service scope per plan. |
| Tax-inclusive total | Pricing uses backend gross-price fields when present. The former 20% fallback has been removed; payment button stays disabled if the gross total is absent. | Backend is authoritative for price/tax, and checkout verifies the chosen plan and payable total with the server before payment. |
| Pre-contract information and distance-sales agreement | Old hard-coded text included categorical no-refund and legal conclusions; it was removed. No approved replacements exist yet. | Legal/commercial team supplies transaction-specific, bilingual, versioned documents with applicable withdrawal/refund rules and delivery/fulfilment details. Display before payment and record durable evidence server-side. |
| Consent and notice | KVKK notice and Privacy Policy have direct links. No mandatory general open-consent checkbox remains. No marketing checkbox exists in checkout. | Counsel maps each processing activity to its legal basis; add a separate optional consent only if a specific activity actually requires it. |
| Order submission | Button uses explicit payment-obligation wording when available. Production defaults to a disabled payment state with a clear explanation. | Test real backend and PayTR flow in an approved environment; release only after legal, product and payment-owner sign-off. |

The email and Google registration UIs also separate Terms acceptance from the KVKK/Privacy links and optional, unchecked marketing preference. Backend must persist approved document version and acceptance timestamp. Google sign-in remains disabled until server verification and approved onboarding are available.

Primary references: [KVKK 2026/347 announcement](https://www.kvkk.gov.tr/Icerik/8710/veri-sorumlulari-tarafindan-acik-riza-ve-aydinlatma-metinlerinin-ayri-ayri-duzenlenmesi-gerektigi-hakkinda-kisisel-verileri-koruma-kurulunun-18-02-2026-tarihli-ve-2026-347-sayili-ilke-kararina-iliskin-kamuoyu-duyurusu) and [Ministry of Trade distance-contract information](https://tuketici.ticaret.gov.tr/yayinlar/tuketici-bilgi-rehberi/mesafeli-sozlesmeler-hakkinda-bilgilendirme).
