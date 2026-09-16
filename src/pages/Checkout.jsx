import { useCallback, useMemo, useState } from 'react';

import { apiJson } from '../lib/api';
import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';

function formatMoney(value, language = 'tr') {
  return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0));
}

const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

const documents = {
  distance: {
    title: 'Mesafeli Satış Sözleşmesi',
    content: [
      '[MESAFELİ SATIŞ SÖZLEŞMESİ]',
      'MADDE 1 - TARAFLAR',
      'SATICI: DEEPZEKA BİLİŞİM YAZILIM TEKNOLOJİ SANAYİ VE TİCARET ANONİM ŞİRKETİ',
      '(Vergi Dairesi: İvedik, Vergi No: 2721187142, Ticaret Sicil No: 470614, Adres: ASBU SOSYOKENT TEKNOLOJİ GELİŞTİRME BÖLGESİ, HACI BAYRAM MAH. MAHMUT ATALAY SK. L BLOK NO: 6 İÇ KAPI NO: 205 ALTINDAĞ/ ANKARA, Telefon: 0505 855 87 27, E-posta: info@deepzeka.com)',
      'ALICI: Konuşmatik platformu üzerinden sipariş veren, ödeme adımında bilgilerini form aracılığıyla beyan eden gerçek veya tüzel kişi.',
      'MADDE 2 - SÖZLEŞMENİN KONUSU',
      'İşbu sözleşmenin konusu, ALICI\'nın SATICI\'ya ait platformdan elektronik ortamda siparişini yaptığı dijital hizmetin/yazılım kullanım hakkının satışı ve ifası ile ilgili hak ve yükümlülüklerin saptanmasıdır.',
      'MADDE 3 - HİZMETİN KULLANIM KOŞULLARI',
      '3.1. SATICI, ALICI\'ya ödeme karşılığında Konuşmatik platformuna (metni sese çevirme, sesi yazıya çevirme, transkript ve ses işleme altyapısına) erişim lisansı sağlar.',
      '3.2. ALICI, sistemi T.C. yasalarına ve uluslararası mevzuata uygun kullanacağını, sisteme yüklediği veri ve içeriklerin hukuki sorumluluğunun tamamen kendisine ait olduğunu kabul eder.',
      'MADDE 4 - ÖDEME VE GÜVENLİK',
      'Ödemeler, PayTR ödeme sistemi aracılığıyla 3D Secure ve SSL güvencesiyle alınmaktadır. Kredi kartı bilgileri SATICI sunucularında saklanmaz.',
      'MADDE 5 - CAYMA HAKKI VE İADE',
      'Dijital ürünler (Yazılım, SaaS, API kullanımları) "anında ifa edilen hizmetler" kapsamında olduğundan lisans aktivasyonu sonrası iade ve iptal işlemi yapılamaz.',
      'MADDE 6 - YETKİLİ MAHKEME',
      'İşbu sözleşmeden doğabilecek uyuşmazlıklarda, T.C. sınırları içerisindeki işlemlerde Ankara Mahkemeleri ve İcra Daireleri yetkilidir.',
      '1. SATICI BİLGİLERİ',
      'Ünvanı: DEEPZEKA BİLİŞİM YAZILIM TEKNOLOJİ SANAYİ VE TİCARET ANONİM ŞİRKETİ',
      'Adresi: ASBU SOSYOKENT TEKNOLOJİ GELİŞTİRME BÖLGESİ, HACI BAYRAM MAH. MAHMUT ATALAY SK. L BLOK NO: 6 İÇ KAPI NO: 205 ALTINDAĞ/ ANKARA',
      'E-posta: info@deepzeka.com',
      'Telefon: 0505 855 87 27',
      '2. KONU',
      'İşbu formun konusu, ALICI\'nın SATICI\'ya ait Konuşmatik platformu üzerinden elektronik ortamda satın aldığı dijital hizmetin satışı ve ifası ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince bilgilendirilmesidir.',
      '3. SÖZLEŞME KONUSU HİZMET VE FİYAT',
      'Hizmetin Adı: Konuşmatik Pro / Abonelik Paketi (Yapay Zeka Destekli Ses ve Metin İşleme Sistemi)',
      'Kullanım Şekli: Bulut tabanlı (SaaS) dijital erişim.',
      'Fiyat: Ödeme sayfasında seçilen paket süresi ve tutarı doğrultusunda tahsil edilecek tutardır (Tüm vergiler dahildir).',
      '4. TESLİMAT VE İFA ŞEKLİ',
      'Hizmet, dijital bir ürün olup ödemenin PayTR ödeme altyapısı üzerinden başarıyla gerçekleşmesiyle birlikte ALICI\'nın belirttiği e-posta adresine veya kullanıcı hesabına anında tanımlanarak teslim edilmiş sayılır. Fiziksel bir teslimat yoktur.',
      '5. CAYMA HAKKI',
      'Mesafeli Sözleşmeler Yönetmeliği\'nin 15. maddesinin (ğ) bendi uyarınca, "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallara ilişkin sözleşmeler" cayma hakkının istisnaları kapsamındadır. Bu sebeple satın alınan dijital lisans veya abonelik başlatıldıktan sonra cayma hakkı kullanılamaz ve ücret iadesi yapılamaz. Kurumsal (B2B) alımlarda Tüketici Kanunu hükümleri geçerli değildir.',
    ],
  },
  kvkk: {
    title: 'KVKK Aydınlatma Metni',
    content: [
      '[KİŞİSEL VERİLERİN KORUNMASI (KVKK) AYDINLATMA METNİ]',
      '1. Veri Sorumlusu',
      '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla DEEPZEKA BİLİŞİM YAZILIM TEKNOLOJİ SANAYİ VE TİCARET ANONİM ŞİRKETİ tarafından işlenmektedir.',
      '2. İşlenen Kişisel Veriler ve İşlenme Amacı',
      '- Kimlik ve İletişim Verileri: (Ad, soyad, e-posta, telefon, TCKN/VKN) Üyelik oluşturma, fatura kesimi, finansal süreçlerin yürütülmesi ve destek hizmetleri sunmak amacıyla işlenmektedir.',
      '- İşlem Güvenliği ve Finansal Veriler: (IP adresi, log kayıtları, maskelenmiş kart bilgileri) Sistemin güvenliğini sağlamak ve PayTR aracılığıyla ödeme alabilmek için işlenmektedir.',
      '- Metin ve Ses Verileri: Konuşmatik platformuna sizin tarafınızdan yüklenen metinler ve ses kayıtları; metni sese çevirme, sesi yazıya çevirme, transkript oluşturma ve yapay zeka destekli ses işleme hizmetlerinin (SaaS ürününün) ifa edilebilmesi amacıyla analiz edilmekte ve işlenmektedir.',
      '3. Kişisel Verilerin Aktarımı',
      'Verileriniz, hukuki yükümlülüklerimizin yerine getirilmesi amacıyla e-fatura entegratörlerine, ödeme süreçleri için PayTR\'ye, hizmetin sağlanması için altyapı hizmeti aldığımız güvenli bulut sunucu sağlayıcılarına ve yetkili kamu kurumlarına aktarılabilir.',
      '4. İlgili Kişinin Hakları',
      'KVKK 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme haklarına sahipsiniz. Taleplerinizi info@deepzeka.com adresi üzerinden bize iletebilirsiniz.',
    ],
  },
  consent: {
    title: 'Açık Rıza Beyanı',
    content: [
      '[AÇIK RIZA BEYANI]',
      'DEEPZEKA BİLİŞİM YAZILIM TEKNOLOJİ SANAYİ VE TİCARET ANONİM ŞİRKETİ tarafından tarafıma sunulan Konuşmatik Kişisel Verilerin Korunması Aydınlatma Metni\'ni okudum ve anladım.',
      'Bu kapsamda;',
      'Konuşmatik platformunu kullanımım sırasında sisteme yükleyeceğim veya işlenmesini talep edeceğim metinler ile ses kayıtlarımın;',
      '* Metni sese çevirme ve sesi yazıya çevirme yapay zeka algoritmalarından geçirilmesine,',
      '* Otomatik transkript oluşturulması ve ses işleme amaçlarıyla analiz edilmesine,',
      '* Bu işlemlerin gerçekleştirilebilmesi için DEEPZEKA BİLİŞİM YAZILIM TEKNOLOJİ SANAYİ VE TİCARET ANONİM ŞİRKETİ\'nin yurt içi/yurt dışı bulut altyapılarında hizmet süresi boyunca güvenli bir şekilde saklanmasına ve işlenmesine,',
      'Özgür irademle, açık rıza gösterdiğimi kabul ve beyan ederim.',
    ],
  },
};

const documentsEn = {
  distance: {
    title: 'Distance Sales Agreement',
    content: [
      '[DISTANCE SALES AGREEMENT]',
      '1. PARTIES',
      'Seller: DEEPZEKA BILISIM YAZILIM TEKNOLOJI SANAYI VE TICARET ANONIM SIRKETI.',
      'Buyer: The real or legal person placing an order through the Konusmatik platform and submitting billing information during checkout.',
      '2. SUBJECT',
      'This agreement covers the sale and delivery of the digital service or software usage right selected by the Buyer on the Konusmatik platform.',
      '3. SERVICE TERMS',
      'The Seller provides access to Konusmatik text-to-speech, speech-to-text, transcript, and audio processing services after payment is completed.',
      'The Buyer accepts responsibility for using the service in accordance with applicable laws and for all uploaded content.',
      '4. PAYMENT AND SECURITY',
      'Payments are collected through PayTR with 3D Secure and SSL protection. Card details are not stored on Seller servers.',
      '5. RIGHT OF WITHDRAWAL AND REFUNDS',
      'Digital services are delivered electronically and may be activated immediately after payment. After activation, cancellation and refund requests may not be available under applicable digital-service exceptions.',
      '6. JURISDICTION',
      'For transactions within Turkey, Ankara courts and enforcement offices are authorized for disputes arising from this agreement.',
      '[PRELIMINARY INFORMATION FORM]',
      'The selected service, price, taxes, payment method, and delivery method are shown on this checkout page before payment confirmation.',
      'The service is delivered digitally after successful payment and is associated with the Buyer account or email address.',
    ],
  },
  kvkk: {
    title: 'Privacy Notice',
    content: [
      '[PERSONAL DATA PROTECTION PRIVACY NOTICE]',
      'Data Controller: DEEPZEKA BILISIM YAZILIM TEKNOLOJI SANAYI VE TICARET ANONIM SIRKETI.',
      'Identity and contact data such as name, email, phone number, TCKN/VKN, billing details, IP address, and transaction records may be processed for account, billing, payment, security, support, and legal obligations.',
      'Text and audio data uploaded to the Konusmatik platform may be processed to provide text-to-speech, speech-to-text, transcription, and audio processing services.',
      'Data may be shared with e-invoice providers, PayTR, secure infrastructure providers, and authorized public institutions where necessary.',
      'You may contact info@deepzeka.com to exercise applicable rights regarding your personal data.',
    ],
  },
  consent: {
    title: 'Explicit Consent Statement',
    content: [
      '[EXPLICIT CONSENT STATEMENT]',
      'I confirm that I have read and understood the Konusmatik Personal Data Protection Privacy Notice.',
      'I consent to the processing of text and audio files that I upload or request to be processed on the Konusmatik platform for the following purposes:',
      '* Running text-to-speech and speech-to-text artificial intelligence services.',
      '* Creating transcripts and analyzing audio for service delivery.',
      '* Securely storing and processing these files on DEEPZEKA BILISIM YAZILIM TEKNOLOJI SANAYI VE TICARET ANONIM SIRKETI infrastructure for the service period.',
      'I give this consent freely and knowingly.',
    ],
  },
};

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
    'Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu kutucuğu seçilmedi.': 'Please accept the Distance Sales Agreement and Preliminary Information Form.',
    'KVKK Aydınlatma Metni ve Açık Rıza Beyanı kutucuğu seçilmedi.': 'Please accept the Privacy Notice and Explicit Consent Statement.',
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
  const [agreements, setAgreements] = useState({ distance: false, kvkk: false });
  const [activeDocument, setActiveDocument] = useState(null);
  const [warning, setWarning] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [iframeToken, setIframeToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const activeDocuments = isEnglish ? documentsEn : documents;

  const payTRFrameUrl = useMemo(() => {
    if (!iframeToken) return '';
    return `https://www.paytr.com/odeme/guvenli/${iframeToken}`;
  }, [iframeToken]);

  const subtotal = Number(selectedPlan?.price || 0);
  const total = Number(selectedPlan?.priceWithVat || subtotal * 1.2);
  const tax = Math.max(total - subtotal, 0);
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

    const billingWarning = validateBillingForm();
    if (billingWarning) {
      setWarning(billingWarning);
      return;
    }

    if (!agreements.distance || !agreements.kvkk) {
      setWarning(!agreements.distance
        ? t('Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu kutucuğu seçilmedi.', 'Please accept the Distance Sales Agreement and Preliminary Information Form.')
        : t('KVKK Aydınlatma Metni ve Açık Rıza Beyanı kutucuğu seçilmedi.', 'Please accept the Privacy Notice and Explicit Consent Statement.'));
      return;
    }

    setIsLoading(true);
    setPaymentError('');
    try {
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
            <span>SSL + 3D Secure</span>
            <h2>{t('Fatura ve Ödeme Bilgileri', 'Billing and Payment Information')}</h2>
            <p>{t('Fatura için gerekli bilgileri burada alıyoruz. Kart bilgileri bir sonraki adımda PayTR güvenli ödeme sayfasında girilecek.', 'We collect the required billing details here. Card details will be entered on the secure PayTR payment page in the next step.')}</p>
          </div>
          <button type="button" className="checkout-back-btn" onClick={() => onNavigate?.('pricing')}>{t('Fiyatlara Dön', 'Back to Pricing')}</button>
        </header>

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
            <div><dt>{t('Vergi %20', 'Tax 20%')}</dt><dd>{formatMoney(tax, language)} TL</dd></div>
          </dl>
          <div className="summary-total">
            <span>{t('KDV dahil ödenecek toplam tutar', 'Total amount including VAT')}</span>
            <strong>{formatMoney(total, language)} TL</strong>
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
          <p className="checkout-form-note checkout-wide">{t('Bu bilgiler sadece faturalandırma, yasal yükümlülük ve destek süreçleri için kullanılır.', 'This information is used only for billing, legal obligations, and support processes.')}</p>
        </section>

        <section className="checkout-agreements">
          <label>
            <input type="checkbox" checked={agreements.distance} onChange={(event) => setAgreements({ ...agreements, distance: event.target.checked })} />
            <span>
              {isEnglish ? (
                <>
                  I have read and approve the <button type="button" onClick={() => setActiveDocument('distance')}>Distance Sales Agreement</button> and <button type="button" onClick={() => setActiveDocument('distance')}>Preliminary Information Form</button>.
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setActiveDocument('distance')}>Mesafeli Satış Sözleşmesi</button> ve <button type="button" onClick={() => setActiveDocument('distance')}>Ön Bilgilendirme Formu</button>'nu okudum, onaylıyorum.
                </>
              )}
            </span>
          </label>
          <label>
            <input type="checkbox" checked={agreements.kvkk} onChange={(event) => setAgreements({ ...agreements, kvkk: event.target.checked })} />
            <span>
              {isEnglish ? (
                <>
                  I have read the <button type="button" onClick={() => setActiveDocument('kvkk')}>Privacy Notice</button> and accept the <button type="button" onClick={() => setActiveDocument('consent')}>Explicit Consent Statement</button> regarding the processing of my audio and text data.
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setActiveDocument('kvkk')}>KVKK Aydınlatma Metni</button>'ni okudum, ses ve metin verilerimin işlenmesine ilişkin <button type="button" onClick={() => setActiveDocument('consent')}>Açık Rıza Beyanı</button>'nı kabul ediyorum.
                </>
              )}
            </span>
          </label>
        </section>

        <button type="submit" className="checkout-pay-btn" disabled={isLoading}>
          {isLoading ? t('Hazırlanıyor...', 'Preparing...') : t('Şimdi Güvenli Satın Al', 'Securely Buy Now')}
        </button>
      </form>

      {activeDocument && (
        <div className="legal-overlay" role="dialog" aria-modal="true" aria-label={activeDocuments[activeDocument].title}>
          <article className="legal-modal">
            <header>
              <h3>{activeDocuments[activeDocument].title}</h3>
              <button type="button" onClick={() => setActiveDocument(null)}>{t('Kapat', 'Close')}</button>
            </header>
            <div className="legal-content">
              {activeDocuments[activeDocument].content.map((line) => <p key={line}>{line}</p>)}
            </div>
          </article>
        </div>
      )}

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
