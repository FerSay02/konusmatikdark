// Keep product copy and destination URLs together for the page and SEO schema.
export const corporateProducts = [
  {
    id: 'doculysis',
    name: 'DOCULYSIS',
    url: 'https://doculysis.com/',
    category: { tr: 'YAPAY ZEKÂ BELGE ANALİZİ', en: 'AI DOCUMENT INTELLIGENCE' },
    headline: { tr: 'Belgelerdeki bilgiyi harekete geçirin.', en: 'Turn documents into usable knowledge.' },
    description: {
      tr: 'Yapay zekâ destekli OCR ve doküman analizi, belgelerdeki içeriği işlenebilir dijital veriye dönüştürmeye yardımcı olur. Veri ve metaveri çıkarımıyla belge işleme akışlarına daha net bir başlangıç sağlar.',
      en: 'AI powered OCR and document analysis help turn document content into usable digital data. Data and metadata extraction give document workflows a clearer starting point.',
    },
    features: {
      tr: ['OCR', 'Doküman analizi', 'Metaveri çıkarımı', 'Akıllı belge işleme'],
      en: ['OCR', 'Document analysis', 'Metadata extraction', 'Intelligent processing'],
    },
  },
  {
    id: 'deeppoint',
    name: 'DEEPPOINT',
    url: 'https://deeppointai.com/',
    category: { tr: 'GÖRÜŞME VE DUYGU ANALİZİ', en: 'CONVERSATION & EMOTION INTELLIGENCE' },
    headline: { tr: 'Görüşmelerden daha derin içgörüler.', en: 'Find deeper insights in conversations.' },
    description: {
      tr: 'Yapay zekâ destekli görüşme analizi, ses ve iletişim verilerindeki duygu sinyallerini değerlendirmeye yardımcı olur. Müşteri etkileşimleri ile satış ve performans süreçlerine ilişkin içgörüler sunar.',
      en: 'AI powered conversation analysis helps evaluate emotional signals in voice and communication data. It provides insight into customer interactions, sales, and performance.',
    },
    features: {
      tr: ['Duygu analizi', 'Görüşme analitiği', 'Müşteri içgörüleri', 'Performans'],
      en: ['Emotion analysis', 'Conversation analytics', 'Customer insights', 'Performance'],
    },
  },
  {
    id: 'clearvoice',
    name: 'CLEAR VOICE',
    url: 'https://clearvoice.com.tr/',
    category: { tr: 'YAPAY ZEKÂ SES İYİLEŞTİRME', en: 'AI AUDIO ENHANCEMENT' },
    headline: { tr: 'Sesin özünü daha net duyun.', en: 'Hear every voice more clearly.' },
    description: {
      tr: 'Yapay zekâ, ses kayıtlarındaki arka plan gürültüsünü azaltarak konuşmaların anlaşılmasını kolaylaştırır. Podcast, toplantı ve röportaj kayıtları için daha temiz bir dinleme deneyimi sunar.',
      en: 'AI reduces background noise in audio recordings to make speech easier to understand. It creates a cleaner listening experience for podcasts, meetings, and interviews.',
    },
    features: {
      tr: ['Gürültü azaltma', 'Ses iyileştirme', 'Konuşma netliği', 'Kayıt temizleme'],
      en: ['Noise reduction', 'Audio enhancement', 'Speech clarity', 'Recording cleanup'],
    },
  },
];

export const corporateSchemas = (seo, language = 'tr') => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${seo.canonical}#webpage`,
    url: seo.canonical,
    name: seo.title,
    description: seo.description,
    inLanguage: language === 'en' ? 'en-US' : 'tr-TR',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: language === 'en' ? 'DeepZeka AI products' : 'DeepZeka AI ürünleri',
    itemListElement: corporateProducts.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.name,
      url: product.url,
    })),
  },
];
