import './LegalPage.css';
import './LegalPage.polish.css';
import SpecularButton from '../components/SpecularButton';

import { legalPageDocuments, legalPageSections } from './legalContent';

export default function LegalPage({ documentType, appLanguage = 'tr' }) {
  const document = legalPageDocuments[documentType];
  const index = appLanguage === 'en' ? 1 : 0;
  const sections = legalPageSections[documentType];
  if (!document) return null;
  return <main className="legal-page">
    <div className="legal-shell">
      <nav aria-label={index ? 'Breadcrumb' : 'İçerik yolu'} className="legal-breadcrumb"><a href="/">{index ? 'Home' : 'Ana sayfa'}</a><span aria-hidden="true">/</span><span>{document.title[index]}</span></nav>
      <header className="legal-header"><h1>{document.title[index]}</h1><p>{document.intro[index]}</p></header>
      <div className="legal-layout"><nav className="legal-toc" aria-label={index ? 'On this page' : 'Bu sayfada'}><strong>{index ? 'Contents' : 'İçindekiler'}</strong>{sections.map((section, sectionIndex) => <a href={`#bolum-${sectionIndex + 1}`} key={section[0]}>{section[index]}</a>)}</nav><div className="policy-body">{sections.map((section, sectionIndex) => <section id={`bolum-${sectionIndex + 1}`} key={section[0]}><h2>{section[index]}</h2><p>{section[index + 2]}</p></section>)}</div></div>
      <nav className="legal-related" aria-label={index ? 'Other legal documents' : 'Diğer yasal belgeler'}><h2>{index ? 'Related documents' : 'Diğer belgeler'}</h2><div>{Object.entries(legalPageDocuments).filter(([key]) => key !== documentType).map(([key, value]) => <SpecularButton href={value.path} canvasLight={false} className="legal-related-card" size="sm" radius={14} tint="#9b78df" tintOpacity={0.08} textColor="var(--legal-link-text)" key={key}>{value.title[index]} <span aria-hidden="true">↗</span></SpecularButton>)}<SpecularButton href="/" canvasLight={false} className="legal-related-card" size="sm" radius={14} tint="#9b78df" tintOpacity={0.08} textColor="var(--legal-link-text)">{index ? 'Back to home' : 'Ana sayfaya dön'} <span aria-hidden="true">↗</span></SpecularButton></div></nav>
    </div>
  </main>;
}
