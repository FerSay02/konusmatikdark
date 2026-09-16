import { readStoredLanguage, restoreTurkishUiText } from '../lib/language';

export default function StudioHero({
  title,
  titleEn,
  description,
  descriptionEn,
  steps = [],
  currentStep = 1,
  allStepsActive = false,
  className = '',
  appLanguage,
}) {
  const language = appLanguage || readStoredLanguage();
  const isEnglish = language === 'en';
  const t = (tr, en) => (isEnglish ? en : restoreTurkishUiText(tr));

  return (
    <div className={`studio-hero ${className}`}>
      <div className="studio-hero-bg">
        <div className="studio-hero-orb orb-1" />
        <div className="studio-hero-orb orb-2" />
        <div className="studio-hero-orb orb-3" />
      </div>
      <div className="studio-hero-content">
        <h1>{t(title, titleEn)}</h1>
        {description && <p>{t(description, descriptionEn)}</p>}
      </div>

      {Array.isArray(steps) && steps.length > 0 && (
        <div className="studio-steps">
          {steps.map((s) => (
            <div
              key={s.num}
              className={`studio-step ${allStepsActive || currentStep >= s.num ? 'active' : ''} ${!allStepsActive && currentStep === s.num ? 'current' : ''}`}
            >
              <div className="studio-step-num">{s.num}</div>
              <div className="studio-step-info">
                <strong>{t(s.label, s.labelEn)}</strong>
                <span>{t(s.desc, s.descEn)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
