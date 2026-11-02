import { expect, test } from '@playwright/test';

const json = (data, status = 200) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(data),
});

const defaultUser = {
  id: 'user-uuid-1',
  role: 'user',
  email: 'test@konusmatik.com',
  full_name: 'Test Kullanıcı',
  phone: '5551234567',
  file_retention_days: 7,
};

const mockOperations = [
  {
    id: 'op-tts-1',
    type: 'tts',
    status: 'completed',
    created_at: '2026-10-30T10:00:00Z',
    original_filename: null,
    audio_duration_seconds: null,
    character_count: 145,
    has_downloadable_file: true,
    is_file_expired: false,
    expires_at: '2026-11-06T10:00:00Z',
  },
  {
    id: 'op-asr-active',
    type: 'asr',
    status: 'completed',
    created_at: '2026-10-30T09:30:00Z',
    original_filename: 'interview_audio.wav',
    audio_duration_seconds: 120,
    character_count: null,
    has_downloadable_file: true,
    is_file_expired: false,
    expires_at: '2026-11-06T09:30:00Z',
  },
  {
    id: 'op-asr-1',
    type: 'asr',
    status: 'completed',
    created_at: '2026-10-29T14:30:00Z',
    original_filename: 'toplanti_kaydi.mp3',
    audio_duration_seconds: 185,
    character_count: null,
    has_downloadable_file: false,
    is_file_expired: true, // EXPIRED: files deleted, text retained!
    expires_at: '2026-10-30T00:00:00Z',
  },
  {
    id: 'op-tts-failed',
    type: 'tts',
    status: 'failed',
    created_at: '2026-10-28T09:00:00Z',
    original_filename: null,
    audio_duration_seconds: null,
    character_count: 50,
    has_downloadable_file: false,
    is_file_expired: false,
    expires_at: null,
  },
];

function setupBaseRoutes(page, overrides = {}) {
  let retentionDays = overrides.initialRetention || 7;
  const requests = [];

  page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();
    requests.push({ path, method, url: request.url() });

    if (path === '/api/v1/auth/me') return route.fulfill(json(defaultUser));
    if (path === '/api/v1/me/entitlements') return route.fulfill(json({ tts: { remaining: 50000, quota_unit: 'character', download_enabled: true }, asr: { remaining: 3600, quota_unit: 'second', download_enabled: true } }));
    if (path === '/api/v1/me/entitlements/list') return route.fulfill(json([]));
    if (path === '/api/v1/me/usage') return route.fulfill(json({ tts: { committed: 0, reserved: 0, usage_unit: 'character' }, asr: { committed: 0, reserved: 0, usage_unit: 'second' } }));
    if (path === '/api/v1/plans') return route.fulfill(json([]));
    if (path === '/api/v1/me/api-keys') return route.fulfill(json([]));
    if (path === '/api/v1/auth/identities') return route.fulfill(json({ has_password: true, providers: [] }));

    // Storage Preferences
    if (path === '/api/v1/me/storage-preferences') {
      if (method === 'GET') {
        return route.fulfill(json({
          retention_days: retentionDays,
          available_options: [1, 7, 30, 90],
        }));
      }
      if (method === 'PATCH') {
        const body = request.postDataJSON();
        if (overrides.failStorageUpdate) {
          return route.fulfill(json({ detail: 'Geçersiz saklama süresi tercihi.' }, 400));
        }
        retentionDays = body.retention_days;
        return route.fulfill(json({
          retention_days: retentionDays,
          available_options: [1, 7, 30, 90],
          message: 'Dosya saklama tercihiniz güncellendi. Yeni tercih yalnızca bundan sonra oluşturulacak dosyalara uygulanacaktır.',
        }));
      }
    }

    // Operations List
    if (path === '/api/v1/me/operations') {
      const type = url.searchParams.get('type') || 'all';
      const status = url.searchParams.get('status') || 'all';

      let items = [...mockOperations];
      if (type !== 'all') items = items.filter((op) => op.type === type);
      if (status !== 'all') items = items.filter((op) => op.status === status);

      if (overrides.emptyOperations) items = [];
      if (overrides.failOperations) return route.fulfill(json({ detail: 'İşlem listesi sunucu hatası.' }, 500));

      return route.fulfill(json({
        total: items.length,
        page: 1,
        page_size: 10,
        items,
      }));
    }

    // Operation Detail
    if (path === '/api/v1/me/operations/op-tts-1') {
      return route.fulfill(json({
        id: 'op-tts-1',
        type: 'tts',
        status: 'completed',
        created_at: '2026-10-30T10:00:00Z',
        completed_at: '2026-10-30T10:00:05Z',
        source: 'web',
        has_downloadable_file: true,
        is_file_expired: false,
        expires_at: '2026-11-06T10:00:00Z',
        input_text: 'Yapay zeka seslendirme teknolojisi ile oluşturulan metin.',
        character_count: 145,
        original_filename: null,
        audio_duration_seconds: null,
        output_text: null,
        files: [{ format: 'audio', filename: 'tts_op-tts-1.mp3', size_bytes: 52400, is_expired: false }],
      }));
    }

    if (path === '/api/v1/me/operations/op-asr-active') {
      return route.fulfill(json({
        id: 'op-asr-active',
        type: 'asr',
        status: 'completed',
        created_at: '2026-10-30T09:30:00Z',
        completed_at: '2026-10-30T09:31:00Z',
        source: 'web',
        has_downloadable_file: true,
        is_file_expired: false,
        expires_at: '2026-11-06T09:30:00Z',
        input_text: null,
        character_count: null,
        original_filename: 'interview_audio.wav',
        audio_duration_seconds: 120,
        output_text: 'Deşifre edilen konuşma metni.',
        files: [
          { format: 'audio', filename: 'interview_audio.wav', size_bytes: 1048576, download_url: '/api/v1/me/operations/op-asr-active/download?format=audio' },
          { format: 'txt', filename: 'interview_audio.txt', size_bytes: 512, download_url: '/api/v1/me/operations/op-asr-active/download?format=txt' },
        ],
      }));
    }

    if (path === '/api/v1/me/operations/op-asr-1') {
      return route.fulfill(json({
        id: 'op-asr-1',
        type: 'asr',
        status: 'completed',
        created_at: '2026-10-29T14:30:00Z',
        completed_at: '2026-10-29T14:31:00Z',
        source: 'web',
        has_downloadable_file: false,
        is_file_expired: true, // EXPIRED BUT TEXT PRESERVED
        expires_at: '2026-10-30T00:00:00Z',
        input_text: null,
        character_count: null,
        original_filename: 'toplanti_kaydi.mp3',
        audio_duration_seconds: 185,
        output_text: 'Bu toplantı kaydının tam deşifre metnidir. Dosyalar silinse de metin korunur.',
        files: [],
      }));
    }

    if (path === '/api/v1/me/operations/op-not-found') {
      return route.fulfill(json({ detail: 'İşlem bulunamadı.' }, 404));
    }

    // Download URL
    if (path.includes('/download')) {
      if (path.includes('op-asr-1')) {
        return route.fulfill(json({ detail: 'Bu işlemin dosyaları, saklama süresi dolduğu için silinmiştir. Metin içeriği korunmaktadır.' }, 410));
      }
      if (path.includes('op-asr-active')) {
        const fmt = url.searchParams.get('format') || 'audio';
        const fn = fmt === 'audio' ? 'interview_audio.wav' : `interview_audio.${fmt}`;
        return route.fulfill(json({
          url: `https://storage.konusmatik.com/download/${fn}`,
          filename: fn,
          content_type: fmt === 'audio' ? 'audio/wav' : 'text/plain',
          format: fmt,
        }));
      }
      return route.fulfill(json({
        url: 'https://storage.konusmatik.com/download/test-audio.mp3',
        expires_in: 3600,
        format: 'audio',
        filename: 'test-audio.mp3',
      }));
    }

    return route.fulfill(json({ ok: true }));
  });

  return { requests };
}

test.describe('İşlem Geçmişim ve Dosya Saklama Tercihleri', () => {
  test('İşlem geçmişi ve saklama tercihleri bölümleri profilde görüntülenir', async ({ page }) => {
    setupBaseRoutes(page);
    await page.goto('/profile');

    await expect(page.getByRole('heading', { name: 'İşlem Geçmişim' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dosya Saklama Tercihlerim' })).toBeVisible();

    // Check information notices in storage preferences
    await expect(page.getByText('Saklama süresinde yaptığınız değişiklikler yalnızca bundan sonra oluşturacağınız dosyalar için geçerlidir.')).toBeVisible();
    await expect(page.getByText('Saklama süresi dolduğunda yüklenen ses/video dosyaları ve oluşturulan çıktı dosyaları silinir. STT transkriptleriniz, TTS için girdiğiniz metinler ve işlem geçmişiniz korunur.')).toBeVisible();
  });

  test('Saklama tercihi varsayılan olarak 7 gün gelir ve kullanıcı 30 güne güncelleyebilir', async ({ page }) => {
    setupBaseRoutes(page);
    await page.goto('/profile');

    const defaultOption = page.getByRole('radio', { name: /7 Gün/i });
    await expect(defaultOption).toBeVisible();
    await expect(defaultOption).toHaveClass(/is-selected/);

    // Save button should initially be disabled because no change made
    const saveBtn = page.getByRole('button', { name: 'Değişiklikleri Kaydet' });
    await expect(saveBtn).toBeDisabled();

    // Select 30 days
    const thirtyDayOption = page.getByRole('radio', { name: /30 Gün/i });
    await thirtyDayOption.click();
    await expect(thirtyDayOption).toHaveClass(/is-selected/);
    await expect(saveBtn).toBeEnabled();

    // Click Save
    await saveBtn.click();
    await expect(page.getByText('Dosya saklama tercihiniz güncellendi.')).toBeVisible();
  });

  test('Saklama tercihi güncelleme hatasında önceki tercih korunur ve hata mesajı gösterilir', async ({ page }) => {
    setupBaseRoutes(page, { failStorageUpdate: true });
    await page.goto('/profile');

    const thirtyDayOption = page.getByRole('radio', { name: /30 Gün/i });
    await thirtyDayOption.click();

    const saveBtn = page.getByRole('button', { name: 'Değişiklikleri Kaydet' });
    await saveBtn.click();

    await expect(page.getByText('Geçersiz saklama süresi tercihi.')).toBeVisible();
  });

  test('İşlem geçmişi başarılı şekilde listelenir, filtreler çalışır', async ({ page }) => {
    setupBaseRoutes(page);
    await page.goto('/profile');

    // Desktop view shows table with operations
    await expect(page.locator('.profile-operations-table')).toBeVisible();
    const rows = page.locator('.profile-operations-table tbody tr');
    await expect(rows).toHaveCount(4);

    // Filter by type: ASR
    await page.locator('#filter-type').selectOption('asr');
    await expect(page.locator('.profile-operations-table tbody tr')).toHaveCount(2);
    await expect(page.locator('.profile-operations-table .cell-content', { hasText: 'toplanti_kaydi.mp3' })).toBeVisible();

    // Reset filter
    await page.locator('#filter-type').selectOption('all');
    await expect(page.locator('.profile-operations-table tbody tr')).toHaveCount(4);

    // Filter by status: Failed
    await page.locator('#filter-status').selectOption('failed');
    await expect(page.locator('.profile-operations-table tbody tr')).toHaveCount(1);
    await expect(page.locator('.profile-operations-table .op-status-badge.status-failed')).toBeVisible();
  });

  test('Boş işlem geçmişinde kullanıcı dostu mesaj gösterilir', async ({ page }) => {
    setupBaseRoutes(page, { emptyOperations: true });
    await page.goto('/profile');

    await expect(page.getByText('Henüz bir işlem geçmişiniz bulunmuyor.')).toBeVisible();
    await expect(page.getByText('Konuşmatik ile ses oluşturduğunuzda veya ses dosyalarını metne dönüştürdüğünüzde işlemleriniz burada görüntülenecek.')).toBeVisible();
  });

  test('Aktif TTS işlem detayı açılır, metin kopyalanabilir ve indirme yapılabilir', async ({ page }) => {
    setupBaseRoutes(page);
    await page.goto('/profile');

    // Click "Detay Gör" on the first row (op-tts-1)
    const detailButtons = page.locator('.profile-operations-table .detail-btn');
    await detailButtons.first().click();

    // Modal opens
    const modal = page.locator('.profile-op-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Ses Sentezleme Detayı' })).toBeVisible();
    await expect(modal.getByText('Yapay zeka seslendirme teknolojisi ile oluşturulan metin.')).toBeVisible();

    // Copy text button
    const copyBtn = modal.locator('.copy-text-btn');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toHaveText(/Kopyala/i);

    // Download button available
    const dlBtn = modal.locator('.download-format-btn');
    await expect(dlBtn).toBeVisible();
    await expect(dlBtn).toBeEnabled();

    // Close modal
    await modal.locator('.tts-package-close').click({ force: true });
    await expect(modal).not.toBeVisible();
  });

  test('Süresi dolan STT işleminde transkript metni eksiksiz korunur ve indirme pasiftir', async ({ page }) => {
    setupBaseRoutes(page);
    await page.goto('/profile');

    // Row for op-asr-1 (expired)
    const rows = page.locator('.profile-operations-table tbody tr');
    const expiredRow = rows.filter({ hasText: 'toplanti_kaydi.mp3' });
    await expect(expiredRow.locator('.file-status-badge.is-expired')).toBeVisible();

    // The download button in table is disabled
    const deletedBtn = expiredRow.locator('.profile-op-action-btn.download-btn.disabled');
    await expect(deletedBtn).toBeVisible();
    await expect(deletedBtn).toBeDisabled();

    // Open detail for expired ASR
    await expiredRow.locator('.detail-btn').click();

    const modal = page.locator('.profile-op-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Deşifre İşlemi Detayı' })).toBeVisible();

    // CRITICAL: Text transcript is permanently retained!
    await expect(modal.getByText('Bu toplantı kaydının tam deşifre metnidir. Dosyalar silinse de metin korunur.')).toBeVisible();

    // Expiry notice is shown in the modal
    await expect(modal.getByText('Bu işlemin dosyaları, belirlediğiniz saklama süresi dolduğu için otomatik olarak silinmiştir. İşlem metinlerinizi görüntülemeye devam edebilirsiniz.')).toBeVisible();

    // Download notice explains retention expiry
    await expect(modal.getByText('Dosyaların saklama süresi dolmuştur. Yeni indirme yapılamaz.')).toBeVisible();
  });

  test('Aktif STT işleminde orijinal medya dosyası (WAV) adı ve formatıyla indirilebilir', async ({ page }) => {
    setupBaseRoutes(page);
    await page.goto('/profile');

    // Click detail for op-asr-active
    const asrRow = page.locator('.profile-operations-table tbody tr').filter({ hasText: 'interview_audio.wav' });
    await expect(asrRow).toBeVisible();
    await asrRow.locator('.detail-btn').click();

    const modal = page.locator('.profile-op-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { name: 'Deşifre İşlemi Detayı' })).toBeVisible();

    // Verify original filename in metadata
    await expect(modal.locator('.detail-meta-item').filter({ hasText: 'Orijinal Dosya' })).toContainText('interview_audio.wav');

    // Verify download buttons include original file with filename
    const originalDlBtn = modal.locator('.download-format-btn').filter({ hasText: 'interview_audio.wav' });
    await expect(originalDlBtn).toBeVisible();
    await expect(originalDlBtn).toBeEnabled();

    // Verify txt download button is also available
    const txtBtn = modal.locator('.download-format-btn').filter({ hasText: '.txt' });
    await expect(txtBtn).toBeVisible();
  });
});
