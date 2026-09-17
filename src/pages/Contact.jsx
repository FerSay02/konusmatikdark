import StudioHero from '../components/StudioHero';
import './Contact.theme.css';
import '../application-light-theme.css';
import { contactHeroContent, contactSteps } from '../data/studioContent';

const officeMapUrls = {
  workOffice:
    'https://www.google.com/maps?q=%C3%87ak%C4%B1ro%C4%9Flu%20Be%C5%9Ftepe%2C%20B%20Blok%2C%20Be%C5%9Ftepe%20Mah.%2031.%20Sok.%20No%3A2%2C%20%C4%B0%C3%A7%20Kap%C4%B1%20No%3A%2062%2C%20Yenimahalle%20%2F%20Ankara&output=embed',
  rdOffice:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3058.947294454545!2d32.85376147638422!3d39.94256858436139!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4082074000000001%3A0xa84c9ff3730a97cc!2sAsbu%20Sosyokent%20Teknoloji%20Geli%C5%9Ftirme%20B%C3%B6lgesi!5e0!3m2!1str!2str!4v1786606020107!5m2!1str!2str',
};

const contactCards = [
  {
    eyebrow: 'Ticari Ünvan',
    eyebrowEn: 'Registered Name',
    title: 'DEEPZEKA BİLİŞİM A.Ş.',
    text: 'Kurumsal iş birlikleri ve resmi süreçler için kayıtlı ünvanımız.',
    textEn: 'Our registered company name for enterprise partnerships and official processes.',
    href: 'https://deepzeka.com',
  },
  {
    eyebrow: 'E-posta',
    eyebrowEn: 'Email',
    title: 'info@deepzeka.com',
    text: 'Local kurulum, kurumsal demo ve teklif talepleriniz için bize yazın.',
    textEn: 'Contact us for local setup, enterprise demos, and quote requests.',
    href: 'mailto:info@deepzeka.com',
  },
  {
    eyebrow: 'Çalışma Saatleri',
    eyebrowEn: 'Business Hours',
    title: '09:00 - 18:00',
    text: 'Pazartesi - Cuma arasında ekiplerimizle iletişime geçebilirsiniz.',
    textEn: 'You can reach our teams from Monday through Friday.',
  },
];

const offices = [
  {
    type: 'Operasyon',
    typeEn: 'Operations',
    title: 'Çalışma Ofisi',
    titleEn: 'Operations Office',
    address: 'Çakıroğlu Beştepe, B Blok, Beştepe Mah. 31. Sok. No:2, İç Kapı No: 62 Yenimahalle / Ankara',
    mapTitle: 'DEEPZEKA Çalışma Ofisi Harita',
    mapTitleEn: 'DEEPZEKA Operations Office Map',
    mapUrl: officeMapUrls.workOffice,
  },
  {
    type: 'Ar-Ge',
    typeEn: 'R&D',
    title: 'Ar-Ge Ofisi',
    titleEn: 'R&D Office',
    address:
      'ASBU SOSYOKENT Teknoloji Geliştirme Bölgesi, Hacı Bayram Mah. Mahmut Atalay Sk. L Blok No: 6 İç Kapı No: 205 Altındağ / Ankara',
    mapTitle: 'DEEPZEKA Ar-Ge Ofisi Harita',
    mapTitleEn: 'DEEPZEKA R&D Office Map',
    mapUrl: officeMapUrls.rdOffice,
  },
];

export default function Contact({ appLanguage }) {
  const language = appLanguage || 'tr';
  const t = (tr, en) => (language === 'en' ? en : tr);
  return (
    <div className="studio-page contact-page">
      <StudioHero
        title={contactHeroContent.title}
        titleEn={contactHeroContent.titleEn}
        description={contactHeroContent.description}
        descriptionEn={contactHeroContent.descriptionEn}
        steps={contactSteps}
        allStepsActive
        className="contact-hero-banner"
        appLanguage={language}
      />

      <div className="studio-content">
        <section className="contact-grid" aria-label={t('İletişim bilgileri', 'Contact information')}>
          {contactCards.map((card) => (
            <article className="contact-card" key={card.eyebrow}>
              <span>{t(card.eyebrow, card.eyebrowEn)}</span>
              <h2>{card.href ? <a href={card.href}>{card.title}</a> : card.title}</h2>
              <p>{t(card.text, card.textEn)}</p>
            </article>
          ))}
        </section>

        <section className="contact-locations" id="contact-locations" aria-label={t('Ofis konumları', 'Office locations')}>
          <div className="contact-section-heading">
            <span>{t('Konumlar', 'Locations')}</span>
            <h2>{t("Ankara'daki ofislerimiz", 'Our offices in Ankara')}</h2>
            <p>{t('Çalışma ve Ar-Ge ofislerimizin konumlarını harita üzerinden inceleyebilirsiniz.', 'View the locations of our operations and R&D offices on the map.')}</p>
          </div>

          <div className="contact-maps">
            {offices.map((office) => (
              <article className="map-card" key={office.title}>
                <div className="map-card-info">
                  <span>{t(office.type, office.typeEn)}</span>
                  <h3>{t(office.title, office.titleEn)}</h3>
                  <p>{office.address}</p>
                </div>
                <div className="map-frame-wrap">
                  <iframe
                    title={t(office.mapTitle, office.mapTitleEn)}
                    src={office.mapUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
