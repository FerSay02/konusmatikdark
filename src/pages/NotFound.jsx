export default function NotFound({ onGoHome, appLanguage = 'tr' }) {
  const t = (tr, en) => (appLanguage === 'en' ? en : tr);
  return (
    <main className="not-found-page" role="main" aria-labelledby="not-found-title">
      <div className="not-found-card">
        <p className="not-found-code">404</p>
        <h1 id="not-found-title">{t('Aradığınız sayfa bulunamadı', 'Page not found')}</h1>
        <p>{t('Sayfa kaldırılmış, adı değişmiş veya geçersiz bir bağlantı kullanılmış olabilir.', 'The page may have been removed, renamed, or reached through an invalid link.')}</p>
        <button type="button" className="btn-submit" onClick={onGoHome}>{t('Ana Sayfaya Dön', 'Return to Home')}</button>
      </div>
    </main>
  );
}
