import { useEffect } from 'react';
import { getSeoForPage, siteUrl } from '../seo';

function upsertMeta(selector, attrs) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertLink(rel, href, hreflang) {
  const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    if (hreflang) element.setAttribute('hreflang', hreflang);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function setJsonLd(id, data) {
  let element = document.getElementById(id);
  if (!element) {
    element = document.createElement('script');
    element.id = id;
    element.type = 'application/ld+json';
    document.head.appendChild(element);
  }
  element.textContent = JSON.stringify(data);
}

export function Seo({ page, appLanguage = 'tr' }) {
  useEffect(() => {
    const seo = getSeoForPage(page, appLanguage);
    const robots = seo.noindex ? 'noindex, nofollow' : 'index, follow';

    document.title = seo.title;
    upsertMeta('meta[name="description"]', { name: 'description', content: seo.description });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: seo.canonical });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: seo.image });
    upsertMeta('meta[property="og:locale"]', { property: 'og:locale', content: appLanguage === 'en' ? 'en_US' : 'tr_TR' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description });
    upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: seo.image });
    upsertLink('canonical', seo.canonical);
    upsertLink('alternate', seo.canonical, 'tr');
    upsertLink('alternate', `${siteUrl}/`, 'x-default');

    setJsonLd('organization-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'DeepZeka',
      url: siteUrl,
      logo: `${siteUrl}/images/logo.png`,
      email: 'info@deepzeka.com',
      sameAs: ['https://www.deepzeka.com/'],
    });

    setJsonLd('software-jsonld', {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Konuşmatik',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      description: seo.description,
      publisher: {
        '@type': 'Organization',
        name: 'DeepZeka',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'TRY',
        availability: 'https://schema.org/InStock',
      },
    });
  }, [page, appLanguage]);

  return null;
}
