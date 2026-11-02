import { useEffect, useState } from 'react';
import {
  downloadFileFromUrl,
  getOperationDetails,
  getOperationDownloadUrl,
  getOperationHistory,
} from '../lib/api';

function formatDateTime(isoString, language = 'tr') {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'tr-TR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return isoString;
  }
}

function formatDuration(seconds, language = 'tr') {
  if (typeof seconds !== 'number' || seconds <= 0) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) {
    return `${secs} ${language === 'en' ? 'sec' : 'sn'}`;
  }
  return `${mins} ${language === 'en' ? 'min' : 'dk'} ${secs} ${language === 'en' ? 'sec' : 'sn'}`;
}

function formatTimestamp(seconds) {
  if (seconds == null || isNaN(seconds) || seconds < 0) return '00:00.000';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  const pad = (n, z = 2) => String(n).padStart(z, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
  }
  return `${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}

function CopyIcon({ copied = false }) {
  return copied ? (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export default function OperationHistory({ language = 'tr', t }) {
  const [operations, setOperations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Detail Modal State
  const [selectedOpId, setSelectedOpId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [textCopied, setTextCopied] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showHistoryTimestamps, setShowHistoryTimestamps] = useState(false);

  useEffect(() => {
    let active = true;
    getOperationHistory({
      page,
      page_size: pageSize,
      type: typeFilter,
      status: statusFilter,
    })
      .then((data) => {
        if (!active) return;
        setOperations(Array.isArray(data?.items) ? data.items : []);
        setTotal(typeof data?.total === 'number' ? data.total : 0);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : t('İşlem geçmişi yüklenemedi.', 'Failed to load operation history.')
        );
        setOperations([]);
        setTotal(0);
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, typeFilter, statusFilter, t]);

  const openDetail = async (opId) => {
    setSelectedOpId(opId);
    setDetailData(null);
    setDetailError('');
    setDownloadError('');
    setTextCopied(false);
    setShowHistoryTimestamps(false);
    setIsLoadingDetail(true);

    try {
      const details = await getOperationDetails(opId);
      setDetailData(details);
    } catch (err) {
      setDetailError(
        err?.status === 404
          ? t('İşlem bulunamadı.', 'Operation not found.')
          : (err instanceof Error ? err.message : t('İşlem detayları alınamadı.', 'Failed to load operation details.'))
      );
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedOpId(null);
    setDetailData(null);
    setDetailError('');
    setDownloadError('');
    setTextCopied(false);
    setShowHistoryTimestamps(false);
  };

  const handleDownload = async (opId, format = 'audio') => {
    setDownloadError('');
    setIsDownloading(true);
    try {
      const dlInfo = await getOperationDownloadUrl(opId, format);
      if (dlInfo?.url) {
        let targetFilename = dlInfo.filename;
        if (!targetFilename) {
          const currentOp = (detailData?.id === opId ? detailData : null) || operations.find((o) => o.id === opId);
          if (format === 'audio') {
            if (currentOp?.original_filename) {
              targetFilename = currentOp.original_filename;
            } else if (currentOp?.type === 'asr') {
              targetFilename = `desifre_${opId}.wav`;
            } else {
              targetFilename = `seslendirme_${opId}.mp3`;
            }
          } else {
            const base = currentOp?.original_filename
              ? currentOp.original_filename.replace(/\.[^/.]+$/, '')
              : `islem_${opId}`;
            targetFilename = `${base}.${format}`;
          }
        }
        await downloadFileFromUrl(dlInfo.url, targetFilename);
      } else {
        throw new Error(t('İndirme bağlantısı alınamadı.', 'Could not obtain download link.'));
      }
    } catch (err) {
      if (err?.status === 410) {
        setDownloadError(
          t(
            'Bu işlemin dosyaları, belirlediğiniz saklama süresi dolduğu için otomatik olarak silinmiştir. İşlem metinlerinizi görüntülemeye devam edebilirsiniz.',
            'The files for this operation have been automatically deleted because your retention period expired. You can continue to view your operation text.'
          )
        );
      } else if (err?.status === 404) {
        setDownloadError(t('İstenen dosya bulunamadı.', 'The requested file was not found.'));
      } else {
        setDownloadError(
          err instanceof Error
            ? err.message
            : t('Dosya indirilirken bir hata oluştu.', 'An error occurred while downloading the file.')
        );
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const copyText = async (content) => {
    if (!content) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      }
      setTextCopied(true);
      window.setTimeout(() => setTextCopied(false), 2000);
    } catch {
      setTextCopied(true);
      window.setTimeout(() => setTextCopied(false), 2000);
    }
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const typeBadgeLabel = (type) => {
    if (type === 'tts') return t('Ses Sentezleme', 'Text-to-Speech');
    if (type === 'asr') return t('Sesten Metne', 'Transcription');
    return type?.toUpperCase() || '-';
  };

  const statusBadgeInfo = (status) => {
    switch (status) {
      case 'completed':
        return { label: t('Tamamlandı', 'Completed'), cls: 'status-completed' };
      case 'processing':
        return { label: t('İşleniyor', 'Processing'), cls: 'status-processing' };
      case 'pending':
        return { label: t('Bekliyor', 'Pending'), cls: 'status-pending' };
      case 'failed':
        return { label: t('Başarısız', 'Failed'), cls: 'status-failed' };
      default:
        return { label: status || '-', cls: '' };
    }
  };

  return (
    <section className="corp-block profile-operations-block" aria-labelledby="profile-operations-title">
      <div className="contact-section-heading">
        <h2 id="profile-operations-title">{t('İşlem Geçmişim', 'Operation History')}</h2>
        <p>
          {t(
            'Web arayüzünden gerçekleştirdiğiniz seslendirme (TTS) ve deşifre (STT) işlemlerinizi inceleyin, saklanan dosyalarınızı indirin.',
            'Review your Text-to-Speech (TTS) and Transcription (STT) operations performed via the web interface and download your stored files.'
          )}
        </p>
      </div>

      <div className="contact-card profile-operations-card">
        {/* Filters */}
        <div className="profile-operations-filters">
          <div className="profile-operations-filter-group">
            <label htmlFor="filter-type">
              <span>{t('İşlem Türü', 'Operation Type')}</span>
            </label>
            <select
              id="filter-type"
              value={typeFilter}
              onChange={(e) => {
                setIsLoading(true);
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="profile-operations-select"
            >
              <option value="all">{t('Tüm İşlemler', 'All Operations')}</option>
              <option value="tts">{t('Ses Sentezleme (TTS)', 'Text-to-Speech (TTS)')}</option>
              <option value="asr">{t('Sesten Metne (STT)', 'Transcription (STT)')}</option>
            </select>
          </div>

          <div className="profile-operations-filter-group">
            <label htmlFor="filter-status">
              <span>{t('Durum', 'Status')}</span>
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setIsLoading(true);
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="profile-operations-select"
            >
              <option value="all">{t('Tüm Durumlar', 'All Statuses')}</option>
              <option value="completed">{t('Tamamlandı', 'Completed')}</option>
              <option value="processing">{t('İşleniyor', 'Processing')}</option>
              <option value="pending">{t('Bekliyor', 'Pending')}</option>
              <option value="failed">{t('Başarısız', 'Failed')}</option>
            </select>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && <div className="profile-alert error" role="alert">{error}</div>}

        {/* Loading State */}
        {isLoading ? (
          <div className="profile-alert" role="status">
            {t('İşlemler yükleniyor...', 'Loading operations...')}
          </div>
        ) : operations.length === 0 ? (
          /* Empty State */
          <div className="profile-no-package profile-operations-empty">
            <strong>{t('Henüz bir işlem geçmişiniz bulunmuyor.', 'You do not have any operation history yet.')}</strong>
            <p>
              {t(
                'Konuşmatik ile ses oluşturduğunuzda veya ses dosyalarını metne dönüştürdüğünüzde işlemleriniz burada görüntülenecek.',
                'When you create audio or transcribe audio files with Konuşmatik, your operations will appear here.'
              )}
            </p>
          </div>
        ) : (
          /* Operations List */
          <>
            {/* Desktop Table View */}
            <div className="profile-operations-table-wrap">
              <table className="profile-operations-table">
                <thead>
                  <tr>
                    <th>{t('Tarih', 'Date')}</th>
                    <th>{t('İşlem Türü', 'Type')}</th>
                    <th>{t('Durum', 'Status')}</th>
                    <th>{t('İçerik / Dosya', 'Content / File')}</th>
                    <th>{t('Dosya Durumu', 'File Status')}</th>
                    <th className="th-actions">{t('Aksiyonlar', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((op) => {
                    const st = statusBadgeInfo(op.status);
                    return (
                      <tr key={op.id}>
                        <td className="cell-date">{formatDateTime(op.created_at, language)}</td>
                        <td>
                          <span className={`op-type-badge op-type-${op.type}`}>
                            {typeBadgeLabel(op.type)}
                          </span>
                        </td>
                        <td>
                          <span className={`op-status-badge ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="cell-content">
                          {op.type === 'tts'
                            ? (op.character_count ? `${op.character_count} ${t('karakter', 'chars')}` : '-')
                            : (op.original_filename || (op.audio_duration_seconds ? formatDuration(op.audio_duration_seconds, language) : '-'))}
                        </td>
                        <td>
                          {op.is_file_expired ? (
                            <span className="file-status-badge is-expired" title={t('Dosyalar silindi, metin korundu', 'Files deleted, text preserved')}>
                              {t('Süresi Doldu', 'Expired')}
                            </span>
                          ) : op.has_downloadable_file ? (
                            <span className="file-status-badge is-active">
                              {t('Aktif', 'Active')}
                            </span>
                          ) : (
                            <span className="file-status-badge is-none">
                              {t('Dosya Yok', 'No File')}
                            </span>
                          )}
                        </td>
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="profile-op-action-btn detail-btn"
                            onClick={() => openDetail(op.id)}
                          >
                            {t('Detay Gör', 'View Details')}
                          </button>
                          {op.has_downloadable_file && !op.is_file_expired && (
                            <button
                              type="button"
                              className="profile-op-action-btn download-btn"
                              onClick={() => handleDownload(op.id, 'audio')}
                              disabled={isDownloading}
                            >
                              {t('İndir', 'Download')}
                            </button>
                          )}
                          {op.is_file_expired && (
                            <button
                              type="button"
                              className="profile-op-action-btn download-btn disabled"
                              disabled
                              title={t('Saklama süresi dolduğu için dosya silindi.', 'File deleted due to retention expiry.')}
                            >
                              {t('Silindi', 'Deleted')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="profile-operations-mobile-list">
              {operations.map((op) => {
                const st = statusBadgeInfo(op.status);
                return (
                  <article key={op.id} className="profile-op-card">
                    <div className="profile-op-card-header">
                      <span className={`op-type-badge op-type-${op.type}`}>
                        {typeBadgeLabel(op.type)}
                      </span>
                      <span className={`op-status-badge ${st.cls}`}>{st.label}</span>
                    </div>

                    <div className="profile-op-card-body">
                      <div className="profile-op-card-row">
                        <span className="label">{t('Tarih', 'Date')}:</span>
                        <span className="value">{formatDateTime(op.created_at, language)}</span>
                      </div>

                      {op.type === 'tts' ? (
                        <div className="profile-op-card-row">
                          <span className="label">{t('Karakter', 'Characters')}:</span>
                          <span className="value">{op.character_count ? `${op.character_count} ${t('karakter', 'chars')}` : '-'}</span>
                        </div>
                      ) : (
                        <>
                          {op.original_filename && (
                            <div className="profile-op-card-row">
                              <span className="label">{t('Dosya', 'File')}:</span>
                              <span className="value file-name">{op.original_filename}</span>
                            </div>
                          )}
                          {op.audio_duration_seconds && (
                            <div className="profile-op-card-row">
                              <span className="label">{t('Süre', 'Duration')}:</span>
                              <span className="value">{formatDuration(op.audio_duration_seconds, language)}</span>
                            </div>
                          )}
                        </>
                      )}

                      <div className="profile-op-card-row">
                        <span className="label">{t('Dosya Durumu', 'File Status')}:</span>
                        <span className="value">
                          {op.is_file_expired ? (
                            <span className="file-status-badge is-expired">
                              {t('Süresi Doldu (Metin Korundu)', 'Expired (Text Preserved)')}
                            </span>
                          ) : op.has_downloadable_file ? (
                            <span className="file-status-badge is-active">
                              {t('Aktif', 'Active')}
                            </span>
                          ) : (
                            <span className="file-status-badge is-none">
                              {t('Dosya Yok', 'No File')}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="profile-op-card-actions">
                      <button
                        type="button"
                        className="profile-op-action-btn detail-btn"
                        onClick={() => openDetail(op.id)}
                      >
                        {t('Detay Gör', 'View Details')}
                      </button>
                      {op.has_downloadable_file && !op.is_file_expired && (
                        <button
                          type="button"
                          className="profile-op-action-btn download-btn"
                          onClick={() => handleDownload(op.id, 'audio')}
                          disabled={isDownloading}
                        >
                          {t('İndir', 'Download')}
                        </button>
                      )}
                      {op.is_file_expired && (
                        <button
                          type="button"
                          className="profile-op-action-btn download-btn disabled"
                          disabled
                        >
                          {t('Silindi', 'Deleted')}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="profile-operations-pagination">
                <button
                  type="button"
                  className="profile-secondary-btn"
                  disabled={page <= 1}
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                >
                  &larr; {t('Önceki', 'Previous')}
                </button>
                <span className="pagination-info">
                  {t('Sayfa', 'Page')} {page} / {totalPages} ({total} {t('işlem', 'operations')})
                </span>
                <button
                  type="button"
                  className="profile-secondary-btn"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setIsLoading(true);
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                >
                  {t('Sonraki', 'Next')} &rarr;
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Operation Detail Modal */}
      {selectedOpId && (
        <div
          className="tts-package-overlay profile-op-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="op-modal-title"
          onClick={closeDetail}
        >
          <div
            className="tts-package-modal profile-op-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="tts-package-close"
              type="button"
              aria-label={t('Pencereyi kapat', 'Close modal')}
              onClick={closeDetail}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {isLoadingDetail ? (
              <div className="profile-alert" role="status">
                {t('Detaylar yükleniyor...', 'Loading details...')}
              </div>
            ) : detailError ? (
              <div className="profile-alert error" role="alert">{detailError}</div>
            ) : detailData ? (
              <div className="profile-op-detail-content">
                <div className="profile-op-detail-header">
                  <div className="profile-op-detail-badges">
                    <span className={`op-type-badge op-type-${detailData.type}`}>
                      {typeBadgeLabel(detailData.type)}
                    </span>
                    <span className={`op-status-badge ${statusBadgeInfo(detailData.status).cls}`}>
                      {statusBadgeInfo(detailData.status).label}
                    </span>
                  </div>
                  <h3 id="op-modal-title">
                    {detailData.type === 'tts'
                      ? t('Ses Sentezleme Detayı', 'Text-to-Speech Details')
                      : t('Deşifre İşlemi Detayı', 'Transcription Details')}
                  </h3>
                  <small className="detail-date">{formatDateTime(detailData.created_at, language)}</small>
                </div>

                {/* Expiry notice if file is expired */}
                {detailData.is_file_expired && (
                  <div className="profile-retention-notice-item modal-expired-notice">
                    <span className="profile-retention-notice-icon">ℹ</span>
                    <p>
                      {t(
                        'Bu işlemin dosyaları, belirlediğiniz saklama süresi dolduğu için otomatik olarak silinmiştir. İşlem metinlerinizi görüntülemeye devam edebilirsiniz.',
                        'The files for this operation have been automatically deleted because your retention period expired. You can continue to view your operation text.'
                      )}
                    </p>
                  </div>
                )}

                {downloadError && (
                  <div className="profile-alert error" role="alert">{downloadError}</div>
                )}

                {/* Metadata Fields */}
                <div className="detail-meta-grid">
                  {detailData.type === 'tts' ? (
                    <div className="detail-meta-item">
                      <span className="meta-label">{t('Karakter Sayısı', 'Character Count')}</span>
                      <strong className="meta-value">{detailData.character_count || '-'}</strong>
                    </div>
                  ) : (
                    <>
                      <div className="detail-meta-item">
                        <span className="meta-label">{t('Orijinal Dosya', 'Original File')}</span>
                        <strong className="meta-value">{detailData.original_filename || '-'}</strong>
                      </div>
                      <div className="detail-meta-item">
                        <span className="meta-label">{t('Ses Süresi', 'Audio Duration')}</span>
                        <strong className="meta-value">{formatDuration(detailData.audio_duration_seconds, language)}</strong>
                      </div>
                    </>
                  )}
                  <div className="detail-meta-item">
                    <span className="meta-label">{t('Dosya Durumu', 'File Status')}</span>
                    <strong className="meta-value">
                      {detailData.is_file_expired
                        ? t('Süresi Doldu (Metin Korundu)', 'Expired (Text Preserved)')
                        : detailData.has_downloadable_file
                          ? t('Aktif / İndirilebilir', 'Active / Downloadable')
                          : t('Mevcut Değil', 'Not Available')}
                    </strong>
                  </div>
                </div>

                {/* Content Box (CRITICAL: Never deleted even if files expired) */}
                <div className="detail-text-section">
                  <div className="detail-text-header">
                    <h4>
                      {detailData.type === 'tts'
                        ? t('Seslendirilen Metin', 'Synthesized Text')
                        : t('Transkript Metni', 'Transcription Text')}
                    </h4>
                    <div className="detail-text-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {detailData.type === 'asr' && (
                        <button
                          type="button"
                          className={`history-timestamp-toggle-btn${showHistoryTimestamps ? ' active' : ''}`}
                          onClick={() => setShowHistoryTimestamps(!showHistoryTimestamps)}
                          title={showHistoryTimestamps ? t('Metin Görünümü', 'Plain Text View') : t('Zaman Damgalarını Göster', 'Show Timestamps')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span>{showHistoryTimestamps ? t('Metin Görünümü', 'Plain Text') : t('Zaman Damgaları', 'Timestamps')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className={`copy-text-btn${textCopied ? ' copied' : ''}`}
                        onClick={() => copyText(detailData.type === 'tts' ? detailData.input_text : detailData.output_text)}
                        title={textCopied ? t('Kopyalandı', 'Copied') : t('Metni Kopyala', 'Copy Text')}
                      >
                        <CopyIcon copied={textCopied} />
                        <span>{textCopied ? t('Kopyalandı', 'Copied') : t('Kopyala', 'Copy')}</span>
                      </button>
                    </div>
                  </div>
                  {showHistoryTimestamps && detailData.type === 'asr' ? (
                    detailData.segments && detailData.segments.length > 0 ? (
                      <div className="detail-segments-container">
                        {detailData.segments.map((seg, idx) => (
                          <div key={idx} className="detail-segment-card">
                            <div className="detail-segment-header">
                              <span className="detail-segment-badge">
                                [{formatTimestamp(seg.start)} &rarr; {formatTimestamp(seg.end)}]
                              </span>
                            </div>
                            <div className="detail-segment-text">{seg.text}</div>
                            {seg.words && seg.words.length > 0 && (
                              <div className="detail-words-chips">
                                {seg.words.map((w, wIdx) => (
                                  <span
                                    key={wIdx}
                                    className="detail-word-chip"
                                    title={`${formatTimestamp(w.start)} - ${formatTimestamp(w.end)}${typeof w.probability === 'number' ? ` (${Math.round(w.probability * 100)}%)` : ''}`}
                                  >
                                    <span className="detail-word-label">{w.word}</span>
                                    <span className="detail-word-chip-time">{formatTimestamp(w.start)}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="detail-text-box">
                        <p className="detail-text-body text-empty">
                          {t('Bu işlem için zaman damgası bilgisi bulunmuyor.', 'No timestamp information is available for this operation.')}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="detail-text-box">
                      <p className="detail-text-body">
                        {(detailData.type === 'tts' ? detailData.input_text : detailData.output_text) || (
                          <span className="text-empty">{t('Bu işlem için metin içeriği bulunmuyor.', 'No text content for this operation.')}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Available Download Formats */}
                <div className="detail-download-section">
                  <h4>{t('İndirme Seçenekleri', 'Download Options')}</h4>
                  {detailData.is_file_expired ? (
                    <p className="download-disabled-notice">
                      {t('Dosyaların saklama süresi dolmuştur. Yeni indirme yapılamaz.', 'The retention period for files has expired. Downloads are no longer available.')}
                    </p>
                  ) : detailData.has_downloadable_file ? (
                    <div className="detail-download-buttons">
                      {detailData.type === 'tts' ? (
                        <button
                          type="button"
                          className="profile-primary-btn download-format-btn"
                          onClick={() => handleDownload(detailData.id, 'audio')}
                          disabled={isDownloading}
                        >
                          {t('Ses Dosyasını İndir (.mp3)', 'Download Audio (.mp3)')}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="profile-primary-btn download-format-btn"
                            onClick={() => handleDownload(detailData.id, 'audio')}
                            disabled={isDownloading}
                          >
                            {detailData.original_filename
                              ? `${t('Orijinal Dosyayı İndir', 'Download Original File')} (${detailData.original_filename})`
                              : t('Orijinal Medya Dosyasını İndir', 'Download Original Media File')}
                          </button>
                          <button
                            type="button"
                            className="profile-secondary-btn download-format-btn"
                            onClick={() => handleDownload(detailData.id, 'txt')}
                            disabled={isDownloading}
                          >
                            {t('Metin (.txt)', 'Text (.txt)')}
                          </button>
                          <button
                            type="button"
                            className="profile-secondary-btn download-format-btn"
                            onClick={() => handleDownload(detailData.id, 'srt')}
                            disabled={isDownloading}
                          >
                            {t('Altyazı (.srt)', 'Subtitle (.srt)')}
                          </button>
                          <button
                            type="button"
                            className="profile-secondary-btn download-format-btn"
                            onClick={() => handleDownload(detailData.id, 'vtt')}
                            disabled={isDownloading}
                          >
                            {t('Altyazı (.vtt)', 'Subtitle (.vtt)')}
                          </button>
                          <button
                            type="button"
                            className="profile-secondary-btn download-format-btn"
                            onClick={() => handleDownload(detailData.id, 'json')}
                            disabled={isDownloading}
                          >
                            JSON
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="download-disabled-notice">
                      {t('Bu işlem için indirilebilir dosya üretilmedi.', 'No downloadable file was generated for this operation.')}
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
