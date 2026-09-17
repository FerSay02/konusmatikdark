import { useEffect, useState } from 'react';
import StudioHero from '../components/StudioHero';
import '../application-light-theme.css';
import { corporateHeroContent, corporateSteps } from '../data/studioContent';

const stats = [
  { eyebrow: 'Erişilebilirlik', eyebrowEn: 'Availability', value: '%99.9', label: 'Kurumsal SLA', labelEn: 'Enterprise SLA', desc: 'Kesintisiz operasyon ve yüksek erişilebilirlik garantisi.', descEn: 'Guaranteed continuous operation and high availability.' },
  { eyebrow: 'Altyapı', eyebrowEn: 'Infrastructure', value: 'On-Premise', label: 'Kapalı Ağ & Local', labelEn: 'Air-Gapped & Local', desc: 'Tamamen kurum içi sunucularda veri izolasyonu.', descEn: 'Complete data isolation on on-premise servers.' },
  { eyebrow: 'Uyumluluk', eyebrowEn: 'Compliance', value: 'KVKK & GDPR', label: 'Veri Güvenliği', labelEn: 'Data Security', desc: 'Üçüncü taraflara sıfır veri aktarımı güvencesi.', descEn: 'Guaranteed zero data transfer to third parties.' },
];

const architectures = [
  {
    eyebrow: 'Local Kurulum',
    eyebrowEn: 'Local Setup',
    title: 'On-Premise Altyapı',
    titleEn: 'On-Premise Infrastructure',
    lead: 'Veri hassasiyeti yüksek kurumlar için tamamen kapalı ağda (air-gapped), kurum içi sunucularda çalışan bağımsız sistem.',
    leadEn: 'An independent system running entirely on air-gapped, on-premise servers for data-sensitive organizations.',
    features: [
      'İnternet bağlantısı gerektirmeyen kapalı ağ mimarisi',
      'Tüm ses ve metin verileri %100 kurum içinde kalır',
      'Özel donanım optimizasyonu (NVIDIA GPU / CPU desteği)',
      'Kurum içi Active Directory ve LDAP entegrasyonu',
    ],
    featuresEn: [
      'Air-gapped architecture that requires no internet connection',
      'All audio and text data remains fully inside the organization',
      'Custom hardware optimization with NVIDIA GPU and CPU support',
      'On-premise Active Directory and LDAP integration',
    ],
  },
  {
    eyebrow: 'Özel Bulut',
    eyebrowEn: 'Private Cloud',
    title: 'Hibrit Mimari',
    titleEn: 'Hybrid Architecture',
    lead: 'Kurumunuza özel tahsis edilmiş izole GPU kümesiyle yüksek hacimli seslendirme ve deşifre işleme kapasitesi.',
    leadEn: 'High-volume text-to-speech and transcription capacity through an isolated GPU cluster dedicated to your organization.',
    features: [
      'VPC Peering ve IP kısıtlama ile güvenli bağlantı',
      'Kurumsal SSO / SAML yetkilendirme entegrasyonu',
      'Otomatik ölçekleme ve 7/24 kesintisiz operasyon izleme',
      'Esnek kapasite yönetimi ve yedekli altyapı',
    ],
    featuresEn: [
      'Secure connectivity through VPC peering and IP restrictions',
      'Enterprise SSO and SAML authorization integration',
      'Automatic scaling and continuous 24/7 operations monitoring',
      'Flexible capacity management and redundant infrastructure',
    ],
  },
  {
    eyebrow: 'REST API',
    title: 'Kurumsal Entegrasyon',
    titleEn: 'Enterprise Integration',
    lead: 'Mevcut CRM, ERP, arşiv ve çağrı merkezi yazılımlarınıza doğrudan bağlanabilen yüksek hızlı kurumsal REST API.',
    leadEn: 'A high-speed enterprise REST API that connects directly to your existing CRM, ERP, archive, and call-center software.',
    features: [
      'TTS ve ASR için anlık (sync) ve asenkron (async) uçlar',
      'Departman bazlı alt anahtar (API Key) ve kota yönetimi',
      'Kapsamlı SDK, kod örnekleri ve teknik dokümantasyon',
      'Kurumsal faturalandırma ve resmi sözleşme desteği',
    ],
    featuresEn: [
      'Synchronous and asynchronous endpoints for TTS and ASR',
      'Department-level API keys and quota management',
      'Comprehensive SDKs, code samples, and technical documentation',
      'Enterprise billing and formal contract support',
    ],
  },
];

const enterpriseSolutions = [
  {
    eyebrow: 'Seslendirme',
    eyebrowEn: 'Text to Speech',
    title: 'Kurumsal İletişim & Santral',
    titleEn: 'Enterprise Communications & IVR',
    desc: 'IVR sistemleri, çağrı merkezleri ve bilgilendirme anonsları için tutarlı, net ve doğal kurumsal Türkçe seslendirme.',
    descEn: 'Consistent, clear, and natural enterprise voiceovers for IVR systems, call centers, and announcements.',
  },
  {
    eyebrow: 'Deşifre',
    eyebrowEn: 'Transcription',
    title: 'Yönetim & Toplantı Deşifresi',
    titleEn: 'Executive & Meeting Transcription',
    desc: 'Yönetim kurulu, müşteri görüşmeleri ve toplantı ses kayıtlarının yüksek doğrulukla arşivlenebilir metne dönüştürülmesi.',
    descEn: 'High-accuracy conversion of board meetings, customer interviews, and meeting recordings into archival text.',
  },
  {
    eyebrow: 'Özel Model',
    eyebrowEn: 'Custom Model',
    title: 'Markaya Özel Ses Kimliği',
    titleEn: 'Custom Brand Voice',
    desc: 'Kurum sözcüsü veya marka yüzüne özel eğitilmiş, telif hakkı kurumunuza ait kurumsal yapay zeka ses modelleri.',
    descEn: 'Custom-trained enterprise AI voice models owned by your organization and based on your spokesperson or brand ambassador.',
  },
  {
    eyebrow: 'Arşivleme',
    eyebrowEn: 'Archiving',
    title: 'Kurumsal Arşiv & Dokümantasyon',
    titleEn: 'Enterprise Archive & Documentation',
    desc: 'Saatlerce süren ses ve video arşivlerini aranabilir, indekslenebilir ve raporlanabilir metin veri tabanına çevirme.',
    descEn: 'Convert hours of audio and video archives into a searchable, indexable, and reportable text database.',
  },
];

const securityPillars = [
  {
    eyebrow: 'Gizlilik',
    eyebrowEn: 'Privacy',
    title: 'Sıfır Veri Sızıntısı Garantisi',
    titleEn: 'Zero Data Leakage Guarantee',
    desc: 'Kurumsal ses ve metin verileriniz asla genel model eğitiminde kullanılmaz ve hiçbir üçüncü tarafla paylaşılmaz.',
    descEn: 'Your enterprise audio and text data is never used to train general models or shared with third parties.',
  },
  {
    eyebrow: 'Denetim',
    eyebrowEn: 'Auditing',
    title: 'Denetim İzi ve Loglama',
    titleEn: 'Audit Trail and Logging',
    desc: 'Tüm kullanıcı işlemleri, API çağrıları ve sistem operasyonları kurumsal güvenlik standartlarına uygun denetim loglarıyla saklanır.',
    descEn: 'All user actions, API calls, and system operations are stored in audit logs that meet enterprise security standards.',
  },
  {
    eyebrow: 'Taahhüt',
    eyebrowEn: 'Commitment',
    title: 'Hizmet Seviyesi Taahhüdü (SLA)',
    titleEn: 'Service Level Agreement (SLA)',
    desc: 'Belirlenmiş müdahale ve çözüm süreleri, 7/24 teknik altyapı izleme ve adanmış kurumsal müşteri temsilcisi.',
    descEn: 'Defined response and resolution times, 24/7 infrastructure monitoring, and a dedicated enterprise account manager.',
  },
  {
    eyebrow: 'Optimizasyon',
    eyebrowEn: 'Optimization',
    title: 'Sektörel Terminoloji İnce Ayarı',
    titleEn: 'Industry Terminology Fine-Tuning',
    desc: 'Kurumunuza ve sektörünüze özel teknik terimler, jargon, kısaltmalar ve özel kelime dağarcığı için model ince ayarı.',
    descEn: 'Model fine-tuning for technical terms, jargon, abbreviations, and custom vocabulary specific to your organization and industry.',
  },
];

export default function Corporate({ onNavigate, appLanguage }) {
  const language = appLanguage || 'tr';
  const t = (tr, en) => (language === 'en' ? en : tr);
  const [visibleSections, setVisibleSections] = useState({});

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.corporate-reveal'));
    if (typeof IntersectionObserver === 'undefined') {
      sections.forEach((section) => section.classList.add('is-visible'));
      return undefined;
    }

    const observers = sections.map((section) => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setVisibleSections((current) => ({ ...current, [section.dataset.reveal]: true }));
          observer.disconnect();
        }
      }, { threshold: 0.14 });
      observer.observe(section);
      return observer;
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);
  const openEnterprisePricing = () => {
    try {
      sessionStorage.setItem('konusmatik_pricing_audience', 'enterprise');
    } catch {
      // Ignore storage failures
    }
    onNavigate?.('pricing');
  };

  return (
    <div className="studio-page corporate-page-shell">
      <StudioHero
        title={corporateHeroContent.title}
        titleEn={corporateHeroContent.titleEn}
        description={corporateHeroContent.description}
        descriptionEn={corporateHeroContent.descriptionEn}
        steps={corporateSteps}
        allStepsActive
        className="corporate-hero"
        appLanguage={language}
      />

      <div className="studio-content corp-content-wrap">
        {/* Enterprise Metrics Bar */}
        <section className={`contact-grid corporate-reveal${visibleSections.stats ? ' is-visible' : ''}`} data-reveal="stats" aria-label={t('Kurumsal Standartlar', 'Enterprise Standards')}>
          {stats.map((item) => (
            <article className="contact-card" key={item.label}>
              <span>{t(item.eyebrow, item.eyebrowEn)}</span>
              <h2>{item.value}</h2>
              <p><strong>{t(item.label, item.labelEn)}</strong> — {t(item.desc, item.descEn)}</p>
            </article>
          ))}
        </section>

        {/* Deployment Architectures */}
        <section className={`corp-block corporate-reveal${visibleSections.architecture ? ' is-visible' : ''}`} data-reveal="architecture" aria-labelledby="corp-arch-title">
          <div className="contact-section-heading">
            <h2 id="corp-arch-title">{t('İhtiyacınıza Uygun Kurumsal Kurulum Modelleri', 'Enterprise Deployment Models for Your Needs')}</h2>
            <p>{t('Veri gizliliği standartlarınıza ve operasyonel büyüklüğünüze göre esnek mimari seçenekleri.', 'Flexible architecture options based on your data-privacy standards and operational scale.')}</p>
          </div>

          <div className="contact-grid">
            {architectures.map((arch) => (
              <article className="contact-card corp-arch-contact-card" key={arch.title}>
                <span>{t(arch.eyebrow, arch.eyebrowEn)}</span>
                <h2>{t(arch.title, arch.titleEn)}</h2>
                <p>{t(arch.lead, arch.leadEn)}</p>
                <ul className="corp-contact-list">
                  {(language === 'en' ? arch.featuresEn : arch.features).map((feat) => (
                    <li key={feat}>{feat}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Core Enterprise Solutions */}
        <section className={`corp-block corporate-reveal${visibleSections.solutions ? ' is-visible' : ''}`} data-reveal="solutions" aria-labelledby="corp-sol-title">
          <div className="contact-section-heading">
            <h2 id="corp-sol-title">{t('Kurum İçi İş Akışları İçin Optimize Edilmiş Ses Teknolojileri', 'Voice Technologies Optimized for Internal Workflows')}</h2>
            <p>{t('Santralden toplantı deşifresine, eğitim modüllerinden özel ses modellerine kadar tüm kurumsal ihtiyaçlar.', 'Enterprise solutions ranging from IVR and meeting transcription to training modules and custom voice models.')}</p>
          </div>

          <div className="corp-4-grid">
            {enterpriseSolutions.map((sol) => (
              <article className="contact-card" key={sol.title}>
                <span>{t(sol.eyebrow, sol.eyebrowEn)}</span>
                <h2>{t(sol.title, sol.titleEn)}</h2>
                <p>{t(sol.desc, sol.descEn)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Security & Compliance */}
        <section className={`corp-block corp-security-section corporate-reveal${visibleSections.security ? ' is-visible' : ''}`} data-reveal="security" aria-labelledby="corp-sec-title">
          <div className="contact-section-heading">
            <h2 id="corp-sec-title">{t('Kurumsal Düzeyde Güvenlik ve Veri Gizliliği Standartları', 'Enterprise-Grade Security and Data Privacy Standards')}</h2>
            <p>{t('Hassas kurumsal verilerin korunması ve regülasyonlara tam uyum, ürün mimarimizin temelindedir.', 'Protecting sensitive enterprise data and meeting regulatory requirements are fundamental to our architecture.')}</p>
          </div>

          <div className="corp-4-grid">
            {securityPillars.map((pillar) => (
              <article className="contact-card" key={pillar.title}>
                <span>{t(pillar.eyebrow, pillar.eyebrowEn)}</span>
                <h2>{t(pillar.title, pillar.titleEn)}</h2>
                <p>{t(pillar.desc, pillar.descEn)}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Enterprise CTA Card */}
        <section className={`corp-cta-card corporate-reveal${visibleSections.cta ? ' is-visible' : ''}`} data-reveal="cta" aria-label={t('Kurumsal Demo ve İletişim', 'Enterprise Demo and Contact')}>
          <div className="corp-cta-copy">
            <h2>{t('Kurumunuz için mimariyi birlikte planlayalım.', 'Let us plan the right architecture for your organization.')}</h2>
            <p>
              {t('Local kurulum donanım gereksinimleri, kurumsal API kotaları ve teknik demo talepleriniz için mühendislik ekibimizle doğrudan görüşün.', 'Talk directly with our engineering team about local setup hardware requirements, enterprise API quotas, and technical demos.')}
            </p>
            <div className="corp-cta-actions">
              <button type="button" className="corp-btn-primary" onClick={() => onNavigate?.('contact')}>
                {t('Kurumsal Demo & Teklif Talep Et', 'Request Enterprise Demo & Quote')}
              </button>
              <button type="button" className="corp-btn-secondary" onClick={() => onNavigate?.('api-docs')}>
                {t('API Dokümantasyonu', 'API Documentation')}
              </button>
              <button type="button" className="corp-btn-secondary" onClick={openEnterprisePricing}>
                {t('Kurumsal Paketler', 'Enterprise Plans')}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
