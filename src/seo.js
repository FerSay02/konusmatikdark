import { corporatePhoneDisplay } from './data/companyContact';

export const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://konusmatik.com').replace(/\/$/, '');

export const pageRoutes = {
  home: '/',
  tts: '/seslendirme',
  asr: '/desifre',
  corporate: '/kurumsal',
  'api-docs': '/api-dokumantasyon',
  contact: '/iletisim',
  login: '/giris',
  privacy: '/gizlilik-politikasi/',
  terms: '/kullanim-kosullari/',
  kvkk: '/kvkk-aydinlatma-metni/',
  cookies: '/cerez-politikasi/',
  profile: '/profile',
  admin: '/admin',
  'payment-success': '/payment/success',
  'payment-fail': '/payment/fail',
};

export const pathPages = Object.fromEntries(Object.entries(pageRoutes).map(([page, path]) => [path, page]));

export const defaultSeo = {
  title: 'Konuşmatik | Türkçe Seslendirme ve Deşifre Platformu',
  titleEn: 'Konusmatik | Text-to-Speech and Transcription Platform',
  description:
    'Konuşmatik; Türkçe odaklı metinden sese, sesten metne, deşifre ve kurumsal local kurulum seçenekleri sunan yerli yapay zeka ses teknolojisi platformudur.',
  descriptionEn: 'Konusmatik is an AI voice platform for text-to-speech, transcription, and enterprise local deployment.',
  image: '/images/logo-new.png',
};

export const seoPages = {
  home: {
    title: 'Konuşmatik | Türkçe Seslendirme ve Deşifre Platformu',
    titleEn: 'Konusmatik | Text-to-Speech and Transcription Platform',
    description:
      'Konuşmatik ile metinleri doğal Türkçe sese dönüştürün, ses kayıtlarını deşifre edin, bulut veya kurum içi local kullanım seçeneklerinden yararlanın.',
    descriptionEn: 'Convert text into natural speech, transcribe audio recordings, and use Konusmatik in the cloud or on-premise.',
  },
  tts: {
    title: 'Metni Sese Çevir | Türkçe AI Seslendirme',
    titleEn: 'Convert Text to Speech | AI Voiceover',
    description:
      'Konuşmatik metinden sese teknolojisiyle Türkçe içerikleri kadın veya erkek ses modeliyle MP3 ve WAV formatlarında doğal ses çıktısına dönüştürün.',
    descriptionEn: 'Turn text into natural MP3 or WAV speech using Konusmatik AI voice models.',
  },
  asr: {
    title: 'Sesi Metne Çevir | Türkçe Deşifre ve Transkript',
    titleEn: 'Convert Audio to Text | Transcription',
    description:
      'Konuşmatik deşifre aracıyla toplantı, ders, röportaj ve medya kayıtlarını Türkçe metne çevirin; transkriptleri kopyalayın, indirin ve arşivleyin.',
    descriptionEn: 'Transcribe meetings, lectures, interviews, and media recordings; copy, download, and archive the results.',
  },
  corporate: {
    title: 'Kurumsal Yapay Zekâ Çözümleri | Konuşmatik & DeepZeka',
    titleEn: 'Enterprise AI Solutions | Konusmatik & DeepZeka',
    description:
      'DeepZeka yapay zekâ ekosistemini keşfedin. Konuşmatik, Doculysis, DeePoint ve Clear Voice ile ses, belge ve görüşme analizi çözümlerini inceleyin.',
    descriptionEn: 'Explore the DeepZeka AI ecosystem. Discover voice, document and conversation intelligence solutions from Konusmatik, Doculysis, DeePoint and Clear Voice.',
  },
  'api-docs': {
    title: 'API Dokümantasyonu | Konuşmatik Kurumsal TTS ve ASR',
    titleEn: 'API Documentation | Konusmatik Enterprise TTS and ASR',
    description:
      'Konuşmatik kurumsal API dokümantasyonu ile TTS ve ASR endpointlerini, API key kullanımını, hata kodlarını ve örnek istekleri inceleyin.',
    descriptionEn: 'Explore Konusmatik enterprise TTS and ASR endpoints, API key usage, error codes, and sample requests.',
  },
  contact: {
    title: 'İletişim | Konuşmatik Demo ve Kurumsal Teklif',
    titleEn: 'Contact | Konusmatik Demo and Enterprise Quote',
    description:
      `Konuşmatik demo, local kurulum, API entegrasyonu ve kurumsal teklif talepleri için DeepZeka ekibini ${corporatePhoneDisplay} numarasından arayın.`,
    descriptionEn: `Call DeepZeka at ${corporatePhoneDisplay} for Konusmatik demos, local deployment, API integration, and enterprise quotes.`,
  },
  privacy: { title: 'Gizlilik Politikası — Yayın Hazırlığı | Konuşmatik', titleEn: 'Privacy Policy — Pending Review | Konusmatik', description: 'Konuşmatik gizlilik sayfası yayına hazırlık aşamasındadır; doğrulanabilen frontend veri akışları ve hukuki inceleme durumu.', descriptionEn: 'Konusmatik privacy page pending company verification and legal review.', noindex: true },
  terms: { title: 'Kullanım Koşulları — Yayın Hazırlığı | Konuşmatik', titleEn: 'Terms of Use — Pending Review | Konusmatik', description: 'Konuşmatik kullanım koşulları hukuki inceleme aşamasındadır; mevcut hizmet arayüzü ve yayın durumu hakkında bilgi.', descriptionEn: 'Konusmatik terms of use pending company verification and legal review.', noindex: true },
  kvkk: { title: 'KVKK Aydınlatma Metni — Yayın Hazırlığı | Konuşmatik', titleEn: 'KVKK Notice — Pending Review | Konusmatik', description: 'Konuşmatik KVKK aydınlatma sayfası hukuki inceleme aşamasındadır; doğrulanabilen veri girişleri ve eksik onay durumu.', descriptionEn: 'Konusmatik KVKK notice pending company verification and legal review.', noindex: true },
  cookies: { title: 'Çerez Politikası — Yayın Hazırlığı | Konuşmatik', titleEn: 'Cookie Policy — Pending Review | Konusmatik', description: 'Konuşmatik çerez tercihleri, tarayıcı depolaması ve işlevsel harita izni hakkında doğrulanabilir teknik bilgiler.', descriptionEn: 'Technical information about Konusmatik cookie choices, browser storage and functional map consent. Pending legal review.', noindex: true },
  login: {
    title: 'Konuşmatik Giriş',
    titleEn: 'Konusmatik Log In',
    description: 'Konuşmatik kullanıcı hesabınıza giriş yapın.',
    descriptionEn: 'Log in to your Konusmatik account.',
    noindex: true,
  },
  profile: {
    title: 'Konuşmatik Profil',
    titleEn: 'Konusmatik Profile',
    description: 'Konuşmatik profil ve kullanım bilgileri.',
    descriptionEn: 'Your Konusmatik profile and usage information.',
    noindex: true,
  },
  admin: {
    title: 'Konuşmatik Admin',
    titleEn: 'Konusmatik Admin',
    description: 'Konuşmatik yönetim paneli.',
    descriptionEn: 'Konusmatik administration panel.',
    noindex: true,
  },
  'payment-success': {
    title: 'Konuşmatik Ödeme Başarılı',
    titleEn: 'Konusmatik Payment Successful',
    description: 'Konuşmatik ödeme sonucu.',
    descriptionEn: 'Konusmatik payment result.',
    noindex: true,
  },
  'payment-fail': {
    title: 'Konuşmatik Ödeme Başarısız',
    titleEn: 'Konusmatik Payment Failed',
    description: 'Konuşmatik ödeme sonucu.',
    descriptionEn: 'Konusmatik payment result.',
    noindex: true,
  },
};

export function getPageForPath(pathname) {
  return pathPages[pathname] || 'home';
}

export function getPathForPage(page) {
  return pageRoutes[page] || '/';
}

export function getSeoForPage(page, language = 'tr') {
  const seo = {
    ...defaultSeo,
    ...(seoPages[page] || {}),
  };
  const pathname = getPathForPage(page);
  return {
    ...seo,
    title: language === 'en' ? seo.titleEn : seo.title,
    description: language === 'en' ? seo.descriptionEn : seo.description,
    canonical: `${siteUrl}${pathname}`,
    image: seo.image.startsWith('http') ? seo.image : `${siteUrl}${seo.image}`,
  };
}
