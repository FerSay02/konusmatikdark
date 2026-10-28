import { useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { corporateProducts } from '../data/corporateProducts';
import './Corporate.css';
import './Corporate.polish.css';

const copy = {
  tr: {
    heroTitle: 'Farklı teknolojiler. Tek bir inovasyon ekosistemi.',
    heroDescription: 'Ses teknolojilerinden akıllı doküman işlemeye, görüşme analizinden ses iyileştirmeye kadar geliştirdiğimiz yapay zekâ çözümlerini keşfedin.',
    explore: 'Ürünlerimizi Keşfedin',
    productsEyebrow: 'ÜRÜNLERİMİZ',
    productsTitle: 'Her ihtiyaca ayrı bir bakış açısı.',
    productsDescription: 'DeepZeka ekosistemindeki ürünler, farklı veri türlerini anlamlandırmak için tasarlandı.',
    discover: 'Ürünü Keşfet',
    newTab: 'yeni sekmede açılır',
    ecosystemEyebrow: 'EKOSİSTEM',
    ecosystemTitle: 'Birbirini tamamlayan yapay zekâ teknolojileri.',
    ecosystemDescription: 'Dört uzmanlık alanı, insan iletişiminden belgelere uzanan ihtiyaçlara odaklanır. Çizgiler teknik entegrasyonları temsil etmez.',
    conceptual: 'KAVRAMSAL GÖSTERİM',
    eyebrow: 'DEEPZEKA YAPAY ZEKÂ EKOSİSTEMİ',
    heroNote: 'SES · BELGE · GÖRÜŞME · SES İYİLEŞTİRME',
    sceneLabels: ['YAPAY ZEKÂ SES', 'BELGE ZEKÂSI', 'GÖRÜŞME ANALİZİ', 'SES İYİLEŞTİRME'],
    sceneFootnote: 'DÖRT UZMANLIK · TEK EKOSİSTEM',
    sceneAria: 'Yapay zekâ ses, belge zekâsı, görüşme analizi ve ses iyileştirme',
    documentData: 'BELGE → YAPILANDIRILMIŞ VERİ', metadata: 'ÜST VERİ',
    signalInsight: 'SİNYAL / İÇGÖRÜ', conversationAnalysis: 'GÖRÜŞME ANALİZİ', signalStudy: 'SİNYAL İNCELEMESİ',
    signalTags: ['DUYGU', 'ETKİLEŞİM', 'PERFORMANS'], audioClarity: 'SES / NETLİK', audioPanelTitle: 'CLEAR VOICE / SES',
    before: 'Önce', after: 'Sonra', noisy: 'Gürültülü kayıt', clean: 'Net konuşma', toggleLabel: 'Önce ve sonra ses çizimi',
    ecosystem: [
      { name: 'KONUŞMATİK', type: 'SES TEKNOLOJİLERİ', description: 'Metinden sese ve sesten metne çözümlerle içeriği erişilebilir kılar.' },
      { name: 'DOCULYSIS', type: 'BELGE ZEKÂSI', description: 'Belgelerdeki bilgiyi çıkarır ve işlenebilir hâle getirir.' },
      { name: 'DEEPPOINT', type: 'GÖRÜŞME ANALİZİ', description: 'Görüşmelerdeki duygu ve etkileşim sinyallerini değerlendirir.' },
      { name: 'CLEAR VOICE', type: 'SES İYİLEŞTİRME', description: 'Kayıtlardaki gürültüyü azaltır, konuşmayı netleştirir.' },
    ],
    ctaEyebrow: 'DEEPZEKA İLE TANIŞIN',
    ctaTitle: 'Yapay zekâ ile iş süreçlerinizi dönüştürün.',
    ctaDescription: 'Farklı ihtiyaçlar için geliştirilen DeepZeka yapay zekâ çözümlerini yakından tanıyın.',
    cta: "DeepZeka'yı Keşfet",
  },
  en: {
    heroTitle: 'Different technologies. One innovation ecosystem.',
    heroDescription: 'Explore our AI solutions spanning voice technology, intelligent document processing, conversation analysis, and audio enhancement.',
    explore: 'Explore Our Products',
    productsEyebrow: 'OUR PRODUCTS',
    productsTitle: 'A distinct perspective for every need.',
    productsDescription: 'Products in the DeepZeka ecosystem are designed to make sense of different kinds of data.',
    discover: 'Explore Product',
    newTab: 'opens in a new tab',
    ecosystemEyebrow: 'ECOSYSTEM',
    ecosystemTitle: 'AI technologies that complement each other.',
    ecosystemDescription: 'Four areas of expertise address needs across communication and documents. The lines do not represent technical integrations.',
    conceptual: 'CONCEPTUAL PREVIEW',
    eyebrow: 'DEEPZEKA AI ECOSYSTEM',
    heroNote: 'VOICE · DOCUMENT · CONVERSATION · AUDIO',
    sceneLabels: ['VOICE AI', 'DOCUMENT INTELLIGENCE', 'CONVERSATION ANALYTICS', 'AUDIO ENHANCEMENT'],
    sceneFootnote: 'FOUR DOMAINS · ONE ECOSYSTEM',
    sceneAria: 'Voice AI, Document Intelligence, Conversation Analytics, Audio Enhancement',
    documentData: 'DOCUMENT → STRUCTURED DATA', metadata: 'METADATA',
    signalInsight: 'SIGNAL / INSIGHT', conversationAnalysis: 'CONVERSATION ANALYSIS', signalStudy: 'SIGNAL STUDY',
    signalTags: ['EMOTION', 'INTERACTION', 'PERFORMANCE'], audioClarity: 'AUDIO / CLARITY', audioPanelTitle: 'CLEAR VOICE / AUDIO',
    before: 'Before', after: 'After', noisy: 'Noisy recording', clean: 'Clear speech', toggleLabel: 'Before and after audio illustration',
    ecosystem: [
      { name: 'KONUŞMATİK', type: 'VOICE TECHNOLOGY', description: 'Text to speech and speech to text make content more accessible.' },
      { name: 'DOCULYSIS', type: 'DOCUMENT INTELLIGENCE', description: 'Extracts information from documents and makes it usable.' },
      { name: 'DEEPPOINT', type: 'CONVERSATION ANALYSIS', description: 'Evaluates emotional and interaction signals in conversations.' },
      { name: 'CLEAR VOICE', type: 'AUDIO ENHANCEMENT', description: 'Reduces recording noise and makes speech clearer.' },
    ],
    ctaEyebrow: 'MEET DEEPZEKA',
    ctaTitle: 'Transform your workflows with AI.',
    ctaDescription: 'Get to know DeepZeka AI solutions built for a range of needs.',
    cta: 'Explore DeepZeka',
  },
};

function ArrowIcon() {
  return <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ExternalLink({ href, label, ariaLabel, className = '' }) {
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel}>{label}<ArrowIcon /></a>;
}

function ProductVisual({ id, content, active }) {
  if (id === 'doculysis') return (
    <div className={`eco-visual eco-visual--doculysis${active ? ' is-active' : ''}`} aria-hidden="true">
      <div className="eco-doc-grid" />
      <div className="eco-document">
        <span className="eco-doc-mark">D /</span><span className="eco-doc-rule eco-doc-rule--wide" /><span className="eco-doc-rule" />
        <div className="eco-doc-highlight"><span /><span /><span /></div><span className="eco-doc-scan" />
        <span className="eco-doc-rule eco-doc-rule--wide" /><span className="eco-doc-rule eco-doc-rule--short" />
      </div>
      <div className="eco-extract"><span className="eco-extract-dot" />{content.conceptual}<span className="eco-extract-check">✓</span><span className="eco-extract-field">01 / OCR</span><span className="eco-extract-field">02 / {content.metadata}</span></div>
      <div className="eco-visual-caption">{content.documentData} · {content.conceptual}</div>
    </div>
  );
  if (id === 'deeppoint') return (
    <div className={`eco-visual eco-visual--deeppoint${active ? ' is-active' : ''}`} aria-hidden="true">
      <div className="eco-visual-caption">{content.signalInsight} · {content.conceptual}</div>
      <div className="eco-deeppoint-panel">
        <div className="eco-panel-top"><span>{content.conversationAnalysis}</span><span className="eco-panel-status">● {content.signalStudy}</span></div>
        <svg className="eco-waveform" viewBox="0 0 500 120" preserveAspectRatio="none"><path d="M0 60h500" stroke="currentColor" opacity=".16"/><path d="M0 60 L16 60 23 45 30 79 38 53 46 63 57 34 66 89 76 61 91 56 103 75 111 36 120 81 131 57 143 59 154 47 164 71 175 56 186 60 197 29 209 93 221 56 233 66 245 40 256 79 268 58 282 62 293 43 305 76 319 58 331 60 342 34 353 86 367 59 380 52 392 71 406 57 420 60 433 39 445 78 456 58 470 63 484 52 500 60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span className="eco-wave-scan" />
        <div className="eco-signal-tags">{content.signalTags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
      <div className="eco-orbit eco-orbit--one" /><div className="eco-orbit eco-orbit--two" />
    </div>
  );
  return <ClearVoiceScene content={content} active={active} />;
}

const noisyWave = 'M0 58 9 71 18 23 28 88 38 49 49 76 60 10 71 96 83 47 94 66 106 26 118 91 130 47 142 73 154 14 166 101 178 45 190 77 202 29 214 87 226 51 238 69 250 15 262 99 274 44 286 78 298 21 310 91 322 48 334 74 346 12 358 98 370 43 382 77 394 26 406 89 418 49 430 72 442 18 454 95 466 44 478 76 490 28 500 58';
const cleanWave = 'M0 58h34l9-4 8 9 9-16 11 22 10-30 12 39 12-27 10 15 10-8h42l9-4 8 10 10-18 12 25 10-34 12 43 11-28 11 16 10-9h42l9-4 9 10 10-19 12 27 11-37 13 45 11-29 11 17 10-10h46';
function ClearVoiceScene({ content, active }) {
  const [after, setAfter] = useState(false);
  return <div className={`eco-visual eco-visual--clearvoice${active ? ' is-active' : ''}`}>
    <div className="eco-visual-caption">{content.audioClarity} · {content.conceptual}</div><div className="eco-audio-panel"><div className="eco-panel-top"><span>{content.audioPanelTitle}</span><span>∿</span></div>
      <div className="eco-audio-toggle" role="group" aria-label={content.toggleLabel}><button type="button" className={!after ? 'is-selected' : ''} aria-pressed={!after} onClick={() => setAfter(false)}>{content.before}</button><button type="button" className={after ? 'is-selected' : ''} aria-pressed={after} onClick={() => setAfter(true)}>{content.after}</button></div>
      <div className={`eco-audio-wave${after ? ' is-clean' : ''}`} role="img" aria-label={`${after ? content.clean : content.noisy}. ${content.conceptual}`}><svg viewBox="0 0 500 116" preserveAspectRatio="none" aria-hidden="true"><path className="eco-audio-baseline" d="M0 58h500" /><path className="eco-audio-noisy" d={noisyWave} /><path className="eco-audio-clean" d={cleanWave} /></svg></div>
      <div className="eco-audio-status"><span className="eco-status-light" />{after ? content.clean : content.noisy}</div></div>
  </div>;
}

function HeroScene({ reduced, content }) {
  const nodes = [
    ['voice', content.sceneLabels[0], '∿'], ['document', content.sceneLabels[1], '▤'],
    ['conversation', content.sceneLabels[2], '◉'], ['audio', content.sceneLabels[3], '≋'],
  ];
  return <div className={`eco-hero-scene${reduced ? '' : ' is-animated'}`} role="img" aria-label={content.sceneAria}>
    <svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <defs><linearGradient id="eco-connect-gradient"><stop stopColor="#49dce9" /><stop offset=".52" stopColor="#a58bff" /><stop offset="1" stopColor="#72e5bb" /></linearGradient></defs>
      <path className="eco-hero-connection" d="M116 107 C184 131 171 197 260 221 M475 106 C413 126 428 190 348 220 M116 350 C187 326 177 260 260 237 M475 350 C409 326 426 263 348 237" />
      <path className="eco-hero-pulse eco-hero-pulse--1" d="M116 107 C184 131 171 197 260 221" /><path className="eco-hero-pulse eco-hero-pulse--2" d="M475 106 C413 126 428 190 348 220" /><path className="eco-hero-pulse eco-hero-pulse--3" d="M116 350 C187 326 177 260 260 237" /><path className="eco-hero-pulse eco-hero-pulse--4" d="M475 350 C409 326 426 263 348 237" />
      <circle className="eco-core-ring" cx="304" cy="229" r="83" /><circle className="eco-core-ring eco-core-ring--inner" cx="304" cy="229" r="65" />
      <path className="eco-core-wave" d="M237 229h21l8-15 10 36 11-65 11 88 10-99 11 79 11-39 8 15h32" />
    </svg>
    <div className="eco-core-label">DEEPZEKA <small>{content.ecosystemEyebrow}</small></div>
    {nodes.map(([id, label, symbol]) => <div className={`eco-scene-node eco-scene-node--${id}`} key={id}><span>{symbol}</span><strong>{label}</strong></div>)}
    <span className="eco-scene-footnote">{content.sceneFootnote}</span>
  </div>;
}

function CorporateHero({ content, reduced, language }) {
  const ref = useRef(null);
  const active = useInView(ref, { margin: '0px 0px -10% 0px' });
  return <section ref={ref} className={`eco-hero${active && !reduced ? ' is-active' : ''}`} aria-labelledby="eco-title"><div className="eco-container eco-hero-inner"><div className="eco-hero-copy">
    <div className="eco-eyebrow"><span className="eco-eyebrow-line" /> {content.eyebrow}</div>
    <h1 id="eco-title">{language === 'tr' ? <>Farklı teknolojiler.<br /><em>Tek bir inovasyon ekosistemi.</em></> : <>Different technologies.<br /><em>One innovation ecosystem.</em></>}</h1>
    <p>{content.heroDescription}</p><a className="eco-hero-link" href="#products">{content.explore}<ArrowIcon /></a>
    <span className="eco-hero-note">{content.heroNote}</span></div>
    <HeroScene reduced={reduced || !active} content={content} />
  </div></section>;
}

function ProductShowcase({ product, index, language, content, reduced }) {
  const ref = useRef(null);
  const active = useInView(ref, { margin: '0px 0px -12% 0px' });
  return <motion.section ref={ref} className={`eco-product eco-product--${product.id}`} aria-labelledby={`eco-${product.id}`} initial={reduced ? false : { opacity: .88, y: 18 }} whileInView={reduced ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .16 }} transition={{ duration: .56, delay: index * .07, ease: 'easeOut' }}>
    <div className={`eco-product-layout${index === 1 ? ' eco-product-layout--reverse' : ''}`}>
      <ProductVisual id={product.id} content={content} active={active && !reduced} />
      <div className="eco-product-copy"><span className="eco-product-index">0{index + 1} / 03</span><div className="eco-category">{product.category[language]}</div>
        <h3 id={`eco-${product.id}`} className="eco-product-name">{product.name}</h3>
        <p className="eco-product-headline">{product.headline[language]}</p>
        <p className="eco-product-description">{product.description[language]}</p>
        <ul className="eco-features">{product.features[language].map((feature) => <li key={feature}>{feature}</li>)}</ul>
        <ExternalLink className="eco-product-link" href={product.url} label={content.discover} ariaLabel={`${product.name}: ${content.discover} (${content.newTab})`} />
      </div>
    </div>
  </motion.section>;
}

function EcosystemSection({ content, reduced }) {
  const [selected, setSelected] = useState(0);
  const ref = useRef(null);
  const active = useInView(ref, { margin: '0px 0px -12% 0px' });
  return <section ref={ref} className={`eco-network${active && !reduced ? ' is-active' : ''}`} aria-labelledby="eco-network-title"><div className="eco-container">
    <span className="eco-section-label">{content.ecosystemEyebrow}</span><h2 id="eco-network-title">{content.ecosystemTitle}</h2><p className="eco-section-intro">{content.ecosystemDescription}</p>
    <div className="eco-network-layout"><div className="eco-network-map"><svg viewBox="0 0 600 390" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path className="eco-network-line" d="M300 197 Q185 158 112 85 M300 197 Q408 132 489 85 M300 197 Q196 261 112 316 M300 197 Q409 261 489 316" /><path className="eco-network-pulse" d="M300 197 Q185 158 112 85 M300 197 Q408 132 489 85 M300 197 Q196 261 112 316 M300 197 Q409 261 489 316" /><circle className="eco-network-ring" cx="300" cy="197" r="53" /></svg><span className="eco-network-center">DEEPZEKA</span>
      {content.ecosystem.map((item, index) => <button key={item.name} type="button" className={`eco-network-node eco-network-node--${index}${selected === index ? ' is-selected' : ''}`} aria-pressed={selected === index} onMouseEnter={() => setSelected(index)} onFocus={() => setSelected(index)} onClick={() => setSelected(index)}><span>0{index + 1}</span><strong>{item.name}</strong><small>{item.type}</small></button>)}</div>
      <div className="eco-network-detail" aria-live="polite"><span>0{selected + 1} / 04</span><small>{content.ecosystem[selected].type}</small><h3>{content.ecosystem[selected].name}</h3><p>{content.ecosystem[selected].description}</p><i /></div></div>
  </div></section>;
}

function CorporateCTA({ content, reduced }) {
  const ref = useRef(null);
  const active = useInView(ref, { margin: '0px 0px -10% 0px' });
  return <section ref={ref} className={`eco-closing${active && !reduced ? ' is-active' : ''}`} aria-labelledby="eco-closing-title"><div className="eco-container eco-closing-inner">
    <span className="eco-section-label">{content.ctaEyebrow}</span><h2 id="eco-closing-title">{content.ctaTitle}</h2><p>{content.ctaDescription}</p>
    <ExternalLink className="eco-closing-link" href="https://deepzeka.com/" label={content.cta} ariaLabel={`${content.cta} (${content.newTab})`} />
  </div></section>;
}

export default function Corporate({ appLanguage = 'tr' }) {
  const language = appLanguage === 'en' ? 'en' : 'tr';
  const content = copy[language];
  const reduced = useReducedMotion();
  return <main className="ecosystem-page"><CorporateHero content={content} language={language} reduced={reduced} />
    <section className="eco-products eco-container" id="products" aria-labelledby="eco-products-title">
      <div className="eco-products-heading"><span className="eco-section-label">{content.productsEyebrow}</span><h2 id="eco-products-title">{content.productsTitle}</h2><p>{content.productsDescription}</p></div>
      {corporateProducts.map((product, index) => <ProductShowcase key={product.id} product={product} index={index} language={language} content={content} reduced={reduced} />)}
    </section><EcosystemSection content={content} reduced={reduced} /><CorporateCTA content={content} reduced={reduced} />
  </main>;
}
