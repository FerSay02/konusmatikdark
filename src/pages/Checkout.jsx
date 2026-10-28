import { useCallback, useMemo, useState } from 'react';

import { apiJson } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';

function formatMoney(value, language = 'tr') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
}

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');
// Keep local payment integration testable. Production builds require an explicit opt-in.
const paymentEnabled = import.meta.env.DEV || import.meta.env.VITE_CHECKOUT_PAYMENT_ENABLED === 'true';

function checkoutMessage(value, language = 'tr') {
  if (language !== 'en' || !value) return value;
  const messages = {
    'Fatura e-postası eksik.': 'Billing email is missing.',
    'Telefon numarası eksik.': 'Phone number is missing.',
    'Fatura adresi en az 5 karakter olmalı.': 'Billing address must be at least 5 characters.',
    'Kurum unvanı eksik.': 'Company title is missing.',
    'Kurumsal fatura için 10 haneli VKN girilmeli.': 'Enter a 10-digit tax number for corporate invoice.',
    'Vergi dairesi eksik.': 'Tax office is missing.',
    'Ad soyad bilgisi eksik.': 'Full name is missing.',
    'Bireysel fatura için 11 haneli TCKN girilmeli.': 'Enter an 11-digit Turkish ID number for individual invoice.',
    'Kullanım Koşulları kabul edilmedi.': 'Please accept the Terms of Use.',
    'Ödeme başlatılamadı.': 'Payment could not be started.',
  };
  return messages[value] || value;
}

function checkoutPlanName(plan, language = 'tr') {
  if (!plan) return '';
  if (language !== 'en') return restoreTurkishUiText(plan.productName || `${plan.amount} ${plan.unit}`);
  if (plan.productName && !/[ğĞüÜşŞıİöÖçÇ]|Seslendirme|Yazıya|Deşifre|Dakika|Karakter|Kurumsal|KOBİ/.test(plan.productName)) {
    return plan.productName;
  }
  const type = plan.type === 'tts' ? 'Text-to-Speech' : 'Audio-to-Text Transcription';
  const amount = String(plan.amount || '').replace(/\./g, ',');
  const unit = plan.unit === 'Karakter' ? 'Characters' : plan.unit === 'Dakika' ? 'Minutes' : plan.unit;
  const prefix = plan.audience === 'enterprise' ? 'Enterprise ' : plan.audience === 'sme' ? 'SME ' : '';
  return `${prefix}${amount} ${unit} ${type}`;
}

export default function Checkout({ currentUser, selectedPlan, onNavigate, appLanguage }) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = useCallback((tr, en) => (isEnglish ? en : restoreTurkishUiText(tr)), [isEnglish]);
  const [form, setForm] = useState({
    invoiceType: selectedPlan?.audience && selectedPlan.audience !== 'individual' ? 'corporate' : 'individual',
    customerName: currentUser?.full_name || '',
    billingEmail: currentUser?.email || '',
    customerPhone: currentUser?.phone || '',
    identityNumber: '',
    companyTitle: '',
    taxOffice: '',
    customerAddress: '',
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [warning, setWarning] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [iframeToken, setIframeToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const payTRFrameUrl = useMemo(() => {
    if (!iframeToken) return '';
    return `https://www.paytr.com/odeme/guvenli/${iframeToken}`;
  }, [iframeToken]);

  const subtotal = Number(selectedPlan?.price || 0);
  // TODO(BACKEND): Recompute the selected plan, tax and payable amount server-side; never trust this browser/sessionStorage total as the charge authority.
  const total = Number(selectedPlan?.priceWithVat || 0);
  const hasTaxInclusiveTotal = Number.isFinite(total) && total > 0;
  const tax = hasTaxInclusiveTotal ? Math.max(total - subtotal, 0) : null;
  const requiresCorporateInvoice = selectedPlan?.audience && selectedPlan.audience !== 'individual';
  const isCorporateInvoice = form.invoiceType === 'corporate';

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const fieldValidationProps = {
    onInvalid: (event) => {
      const message = event.currentTarget.validity.valueMissing
        ? t('Lütfen bu alanı doldurun.', 'Please fill out this field.')
        : t('Lütfen geçerli bir değer girin.', 'Please enter a valid value.');
      event.currentTarget.setCustomValidity(message);
    },
    onInput: (event) => {
      event.currentTarget.setCustomValidity('');
    },
  };

  const validateBillingForm = () => {
    const identifier = digitsOnly(form.identityNumber);
    if (!form.billingEmail.trim()) return t('Fatura e-postası eksik.', 'Billing email is missing.');
    if (!form.customerPhone.trim()) return t('Telefon numarası eksik.', 'Phone number is missing.');
    if (!form.customerAddress.trim() || form.customerAddress.trim().length < 5) return t('Fatura adresi en az 5 karakter olmalı.', 'Billing address must be at least 5 characters.');

    if (isCorporateInvoice) {
      if (!form.companyTitle.trim()) return t('Kurum unvanı eksik.', 'Company title is missing.');
      if (identifier.length !== 10) return t('Kurumsal fatura için 10 haneli VKN girilmeli.', 'Enter a 10-digit tax number for corporate invoice.');
      if (!form.taxOffice.trim()) return t('Vergi dairesi eksik.', 'Tax office is missing.');
      return '';
    }

    if (!form.customerName.trim()) return t('Ad soyad bilgisi eksik.', 'Full name is missing.');
    if (identifier.length !== 11) return t('Bireysel fatura için 11 haneli TCKN girilmeli.', 'Enter an 11-digit Turkish ID number for individual invoice.');
    return '';
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    if (!selectedPlan) return;
    if (!paymentEnabled) return;
    if (!hasTaxInclusiveTotal) {
      setWarning(t('Vergiler dahil toplam fiyat doğrulanmadı.', 'The tax-inclusive total price has not been confirmed.'));
      return;
    }

    const billingWarning = validateBillingForm();
    if (billingWarning) {
      setWarning(billingWarning);
      return;
    }

    if (!termsAccepted) {
      setWarning(t('Kullanım Koşulları kabul edilmedi.', 'Please accept the Terms of Use.'));
      return;
    }

    setIsLoading(true);
    setPaymentError('');
    try {
      // TODO(BACKEND): Verify the authoritative price and approved purchase-document acceptance before issuing a PayTR iframe token; persist order and callback status securely.
      const response = await apiJson('/api/v1/payments/paytr/token', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: selectedPlan.planId,
          customer_name: isCorporateInvoice ? form.companyTitle : form.customerName,
          customer_phone: form.customerPhone,
          customer_address: form.customerAddress,
          billing_email: form.billingEmail,
          invoice_type: form.invoiceType,
          identity_number: isCorporateInvoice ? null : digitsOnly(form.identityNumber),
          tax_number: isCorporateInvoice ? digitsOnly(form.identityNumber) : null,
          tax_office: isCorporateInvoice ? form.taxOffice : null,
          company_title: isCorporateInvoice ? form.companyTitle : null,
          billing_details: {
            type: form.invoiceType,
            full_name: form.customerName || null,
            email: form.billingEmail,
            phone: form.customerPhone,
            address: form.customerAddress,
            tckn: isCorporateInvoice ? null : digitsOnly(form.identityNumber),
            vkn: isCorporateInvoice ? digitsOnly(form.identityNumber) : null,
            tax_office: isCorporateInvoice ? form.taxOffice : null,
            company_title: isCorporateInvoice ? form.companyTitle : null,
          },
        }),
      });
      setIframeToken(response.iframe_token);
    } catch (err) {
      setPaymentError(checkoutMessage(err instanceof Error ? err.message : 'Ödeme başlatılamadı.', language));
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedPlan) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty">
          <h2>{t('Seçili paket bulunamadı', 'No selected package found')}</h2>
          <p>{t('Ödeme bilgilerine geçmek için önce fiyatlar ekranından bir paket seçmelisin.', 'Choose a package from the pricing page before continuing to payment details.')}</p>
          <button type="button" onClick={() => onNavigate?.('pricing')}>{t('Fiyatlara Dön', 'Back to Pricing')}</button>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <form className="checkout-shell" onSubmit={submitPayment}>
        <header className="checkout-page-head">
          <div>
            <span>PayTR</span>
            <h2>{t('Fatura ve Ödeme Bilgileri', 'Billing and Payment Information')}</h2>
            <p>{t('Fatura için gerekli bilgileri burada alıyoruz. Kart bilgileri bir sonraki adımda PayTR güvenli ödeme sayfasında girilecek.', 'We collect the required billing details here. Card details will be entered on the secure PayTR payment page in the next step.')}</p>
          </div>
          <button type="button" className="checkout-back-btn" onClick={() => onNavigate?.('pricing')}>{t('Fiyatlara Dön', 'Back to Pricing')}</button>
        </header>

        {!paymentEnabled && <div className="checkout-release-status" role="status">
          <strong>{t('Ödeme şu anda kullanılamıyor', 'Payment is currently unavailable')}</strong>
          <p>{t('Satıcı bilgileri, ön bilgilendirme ve satış koşulları onaylanana kadar ödeme başlatılamaz.', 'Payment cannot start until seller details, pre-contract information and sales terms are approved.')}</p>
        </div>}

        {paymentError && <div className="payment-status error">{paymentError}</div>}

        <section className="checkout-summary">
          <div className="summary-title-row">
            <div>
              <span>{t('Seçilen Paket', 'Selected Package')}</span>
              <strong>{checkoutPlanName(selectedPlan, language)}</strong>
            </div>
            <strong>{formatMoney(subtotal, language)} TL</strong>
          </div>
          <dl>
            <div><dt>{t('Ara Toplam', 'Subtotal')}</dt><dd>{formatMoney(subtotal, language)} TL</dd></div>
            {hasTaxInclusiveTotal && <div><dt>{t('Gösterilen vergi farkı', 'Displayed tax difference')}</dt><dd>{formatMoney(tax, language)} TL</dd></div>}
          </dl>
          <div className="summary-total">
            <span>{t('KDV dahil ödenecek toplam tutar', 'Total amount including VAT')}</span>
            <strong>{hasTaxInclusiveTotal ? `${formatMoney(total, language)} TL` : t('Doğrulama bekliyor', 'Awaiting confirmation')}</strong>
          </div>
          {requiresCorporateInvoice && (
            <p className="checkout-corporate-api-note">
              {t('Kurumsal satın alma tamamlandıktan sonra API key profil sayfasından oluşturulur ve kurumsal haklar API üzerinden kullanılabilir.', 'After the enterprise purchase is completed, the API key is created from the profile page and enterprise credits can be used through the API.')}
            </p>
          )}
        </section>

        <section className="checkout-form-grid">
          <div className="checkout-form-head checkout-wide">
            <div>
              <span>{t('Fatura Bilgileri', 'Billing Details')}</span>
              <h3>{isCorporateInvoice ? t('Kurumsal fatura', 'Corporate invoice') : t('Bireysel fatura', 'Individual invoice')}</h3>
            </div>
            <div className="invoice-type-switch" role="group" aria-label={t('Fatura tipi', 'Invoice type')}>
              <button type="button" className={form.invoiceType === 'individual' ? 'active' : ''} onClick={() => updateForm('invoiceType', 'individual')} disabled={requiresCorporateInvoice}>
                T.C.
              </button>
              <button type="button" className={form.invoiceType === 'corporate' ? 'active' : ''} onClick={() => updateForm('invoiceType', 'corporate')}>
                {t('Kurum', 'Company')}
              </button>
            </div>
          </div>

          {isCorporateInvoice ? (
            <>
              <label className="checkout-wide">{t('Kurum Unvanı', 'Company Title')}
                <input value={form.companyTitle} onChange={(event) => updateForm('companyTitle', event.target.value)} maxLength={255} required {...fieldValidationProps} />
              </label>
              <label>{t('Vergi Kimlik No', 'Tax ID Number')}
                <input value={form.identityNumber} onChange={(event) => updateForm('identityNumber', digitsOnly(event.target.value).slice(0, 10))} inputMode="numeric" maxLength={10} required {...fieldValidationProps} />
              </label>
              <label>{t('Vergi Dairesi', 'Tax Office')}
                <input value={form.taxOffice} onChange={(event) => updateForm('taxOffice', event.target.value)} maxLength={120} required {...fieldValidationProps} />
              </label>
              <label>{t('Yetkili Ad Soyad', 'Authorized Full Name')}
                <input value={form.customerName} onChange={(event) => updateForm('customerName', event.target.value)} maxLength={255} />
              </label>
            </>
          ) : (
            <>
              <label>{t('Ad Soyad', 'Full Name')}
                <input value={form.customerName} onChange={(event) => updateForm('customerName', event.target.value)} maxLength={255} required {...fieldValidationProps} />
              </label>
              <label>{t('T.C. Kimlik No', 'Turkish ID Number')}
                <input value={form.identityNumber} onChange={(event) => updateForm('identityNumber', digitsOnly(event.target.value).slice(0, 11))} inputMode="numeric" maxLength={11} required {...fieldValidationProps} />
              </label>
            </>
          )}
          <label>{t('Fatura E-postası', 'Billing Email')}
            <input value={form.billingEmail} onChange={(event) => updateForm('billingEmail', event.target.value)} type="email" maxLength={255} required {...fieldValidationProps} />
          </label>
          <label>{t('Telefon', 'Phone')}
            <input value={form.customerPhone} onChange={(event) => updateForm('customerPhone', event.target.value)} inputMode="tel" required {...fieldValidationProps} />
          </label>
          <label className="checkout-wide">{t('Adres', 'Address')}
            <textarea value={form.customerAddress} onChange={(event) => updateForm('customerAddress', event.target.value)} minLength={5} maxLength={500} required {...fieldValidationProps} />
          </label>
          <p className="checkout-form-note checkout-wide">{t('Bu formda girilen bilgiler ödeme isteğiyle uygulama API’sine gönderilir. Veri işleme ayrıntıları için KVKK Aydınlatma Metni’ni inceleyin.', 'The details entered here are sent to the application API with the payment request. Review the KVKK notice for data-processing information.')}</p>
        </section>

        <section className="checkout-agreements">
          <label>
            <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} required />
            <span>{t('Kullanım Koşulları metnini kabul ediyorum:', 'I accept the Terms of Use:')} <a href="/kullanim-kosullari/" target="_blank" rel="noopener noreferrer">{t('Kullanım Koşulları', 'Terms of Use')}</a></span>
          </label>
          <p>{t('Kişisel veriler hakkında bilgi:', 'Information about personal data:')} <a href="/kvkk-aydinlatma-metni/" target="_blank" rel="noopener noreferrer">{t('KVKK Aydınlatma Metni', 'KVKK Notice')}</a> · <a href="/gizlilik-politikasi/" target="_blank" rel="noopener noreferrer">{t('Gizlilik Politikası', 'Privacy Policy')}</a></p>
          <p className="checkout-legal-note">{t('Ön bilgilendirme ve mesafeli satış metinleri henüz hukuki onay bekliyor. Kullanım Koşulları bu belgelerin yerine geçmez.', 'Pre-contract information and distance sales terms still await legal approval. The Terms of Use do not replace those documents.')}</p>
        </section>

        <button type="submit" className="checkout-pay-btn" disabled={isLoading || !paymentEnabled || !hasTaxInclusiveTotal}>
          {isLoading ? t('Hazırlanıyor...', 'Preparing...') : paymentEnabled && hasTaxInclusiveTotal ? t('Ödeme yükümlülüğü doğuran sipariş ver', 'Place order with obligation to pay') : t('Ödeme kapalı', 'Payment unavailable')}
        </button>
      </form>

      {warning && (
        <div className="legal-overlay" role="alertdialog" aria-modal="true" aria-label={t('Eksik Onay', 'Missing Approval')}>
          <article className="approval-warning">
            <h3>{t('Eksik Bilgi', 'Missing Information')}</h3>
            <p>{warning}</p>
            <button type="button" onClick={() => setWarning('')}>{t('Tamam', 'OK')}</button>
          </article>
        </div>
      )}

      {iframeToken && (
        <div className="paytr-overlay" role="dialog" aria-modal="true" aria-label={t('PayTR ödeme ekranı', 'PayTR payment screen')}>
          <div className="paytr-modal">
            <div className="paytr-modal-header">
              <h3>{t('Güvenli Ödeme', 'Secure Payment')}</h3>
              <button type="button" onClick={() => setIframeToken('')}>{t('Kapat', 'Close')}</button>
            </div>
            <iframe title={t('PayTR Ödeme', 'PayTR Payment')} src={payTRFrameUrl} className="paytr-iframe" allow="payment" />
          </div>
        </div>
      )}
    </main>
  );
}
