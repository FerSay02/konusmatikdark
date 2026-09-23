export const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://konusmatik.com').replace(/\/$/, '');

export const pageRoutes = {
  home: '/',
  tts: '/seslendirme',
  asr: '/desifre',
  pricing: '/fiyatlar',
  corporate: '/kurumsal',
  'api-docs': '/api-dokumantasyon',
  contact: '/iletisim',
  login: '/giris',
  profile: '/profile',
  admin: '/admin',
  checkout: '/checkout',
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
      'Konuşmatik ile metinleri doğal Türkçe sese dönüştürün, ses ve video kayıtlarını deşifre edin, bulut veya kurum içi local kullanım seçeneklerinden yararlanın.',
    descriptionEn: 'Convert text into natural speech, transcribe audio and video, and use Konusmatik in the cloud or on-premise.',
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
  pricing: {
    title: 'Fiyatlar | Konuşmatik TTS ve ASR Paketleri',
    titleEn: 'Pricing | Konusmatik TTS and ASR Plans',
    description:
      'Konuşmatik fiyatlarını inceleyin; metinden sese karakter paketleri, sesten metne dakika paketleri ve kurumsal local kurulum seçenekleri hakkında bilgi alın.',
    descriptionEn: 'Compare Konusmatik text-to-speech, transcription, and enterprise local deployment plans.',
  },
  corporate: {
    title: 'Kurumsal | Local Kurulum ve Türkçe Ses Teknolojileri',
    titleEn: 'Enterprise | Local Deployment and Voice Technology',
    description:
      'Konuşmatik kurumsal çözümleri; kapalı ağ, kendi sunucunuzda local kurulum, API entegrasyonu, KVKK odaklı kullanım ve Türkçe ses teknolojileri sunar.',
    descriptionEn: 'Deploy Konusmatik on-premise or in an air-gapped network with enterprise API integration and data privacy.',
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
      'Konuşmatik için demo, local kurulum, API entegrasyonu, kurumsal teklif ve teknik görüşme talepleriniz için DeepZeka ekibiyle iletişime geçin.',
    descriptionEn: 'Contact DeepZeka for Konusmatik demos, local deployment, API integration, and enterprise quotes.',
  },
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
  checkout: {
    title: 'Konuşmatik Ödeme',
    titleEn: 'Konusmatik Checkout',
    description: 'Konuşmatik paket satın alma ve ödeme akışı.',
    descriptionEn: 'Konusmatik plan purchase and checkout.',
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
