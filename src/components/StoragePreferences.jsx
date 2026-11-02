import { useEffect, useState } from 'react';
import { getStoragePreferences, updateStoragePreferences } from '../lib/api';

const DEFAULT_OPTIONS = [1, 7, 30, 90];

export default function StoragePreferences({ t }) {
  const [retentionDays, setRetentionDays] = useState(7);
  const [savedRetentionDays, setSavedRetentionDays] = useState(7);
  const [availableOptions, setAvailableOptions] = useState(DEFAULT_OPTIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getStoragePreferences()
      .then((data) => {
        if (!active) return;
        if (data && typeof data.retention_days === 'number') {
          setRetentionDays(data.retention_days);
          setSavedRetentionDays(data.retention_days);
        }
        if (data && Array.isArray(data.available_options) && data.available_options.length) {
          setAvailableOptions(data.available_options);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : t('Saklama tercihleri yüklenemedi.', 'File retention preferences could not be loaded.')
        );
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [t]);

  const handleSelect = (days) => {
    setRetentionDays(days);
    setMessage('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (retentionDays === savedRetentionDays || isSaving) return;

    setIsSaving(true);
    setMessage('');
    setError('');

    try {
      const res = await updateStoragePreferences(retentionDays);
      setSavedRetentionDays(res.retention_days);
      setRetentionDays(res.retention_days);
      setMessage(
        res.message ||
          t(
            'Dosya saklama tercihiniz güncellendi. Yeni tercih yalnızca bundan sonra oluşturulacak dosyalara uygulanacaktır.',
            'Your file retention preference has been updated. The new setting applies only to files created from now on.'
          )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('Saklama tercihi kaydedilemedi.', 'Failed to update file retention preference.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanged = retentionDays !== savedRetentionDays;

  return (
    <section className="corp-block profile-retention-block" aria-labelledby="profile-retention-title">
      <div className="contact-section-heading">
        <h2 id="profile-retention-title">{t('Dosya Saklama Tercihlerim', 'File Retention Preferences')}</h2>
        <p>
          {t(
            'Konuşmatik üzerinde yüklediğiniz ses dosyalarının ve oluşturulan çıktı dosyalarının ne kadar süre saklanacağını belirleyebilirsiniz.',
            'You can specify how long audio files you upload and output files generated on Konuşmatik will be retained.'
          )}
        </p>
      </div>

      <div className="contact-card profile-retention-card">
        {isLoading ? (
          <div className="profile-alert" role="status">
            {t('Saklama tercihleri yükleniyor...', 'Loading retention preferences...')}
          </div>
        ) : (
          <form onSubmit={handleSave} className="profile-retention-form">
            <div className="profile-retention-options" role="radiogroup" aria-label={t('Saklama Süresi', 'Retention Period')}>
              {availableOptions.map((days) => {
                const isSelected = retentionDays === days;
                const isDefault = days === 7;
                return (
                  <button
                    key={days}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`profile-retention-option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => handleSelect(days)}
                  >
                    <span className="profile-retention-option-days">
                      {days} {t('Gün', 'Days')}
                    </span>
                    {isDefault && (
                      <span className="profile-retention-option-badge">
                        {t('Varsayılan', 'Default')}
                      </span>
                    )}
                    <span className="profile-retention-radio-indicator" aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <div className="profile-retention-notices">
              <div className="profile-retention-notice-item">
                <span className="profile-retention-notice-icon" aria-hidden="true">ℹ</span>
                <p>
                  <strong>{t('Önemli:', 'Important:')} </strong>
                  {t(
                    'Saklama süresinde yaptığınız değişiklikler yalnızca bundan sonra oluşturacağınız dosyalar için geçerlidir. Daha önce oluşturulan dosyaların silinme tarihleri değişmez.',
                    'Changes to your retention period apply only to files created after the change. Deletion dates for previously created files will not be altered.'
                  )}
                </p>
              </div>

              <div className="profile-retention-notice-item">
                <span className="profile-retention-notice-icon" aria-hidden="true">✓</span>
                <p>
                  <strong>{t('Metin Güvencesi:', 'Text Protection:')} </strong>
                  {t(
                    'Saklama süresi dolduğunda yüklenen ses/video dosyaları ve oluşturulan çıktı dosyaları silinir. STT transkriptleriniz, TTS için girdiğiniz metinler ve işlem geçmişiniz korunur.',
                    'When retention expires, uploaded media files and generated output files are deleted. Your STT transcripts, TTS prompt texts, and operation history are permanently retained.'
                  )}
                </p>
              </div>
            </div>

            {message && <div className="profile-alert success" role="status">{message}</div>}
            {error && <div className="profile-alert error" role="alert">{error}</div>}

            <div className="profile-retention-actions">
              <button
                type="submit"
                className="profile-primary-btn"
                disabled={!hasChanged || isSaving}
              >
                {isSaving
                  ? t('Kaydediliyor...', 'Saving...')
                  : t('Değişiklikleri Kaydet', 'Save Changes')}
              </button>
              {hasChanged && (
                <button
                  type="button"
                  className="profile-secondary-btn"
                  onClick={() => {
                    setRetentionDays(savedRetentionDays);
                    setMessage('');
                    setError('');
                  }}
                  disabled={isSaving}
                >
                  {t('Vazgeç', 'Cancel')}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
