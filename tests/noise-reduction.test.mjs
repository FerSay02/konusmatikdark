import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  isNoiseReductionAvailable,
  noiseReductionBlockedReason,
  appendNoiseReductionFields,
  shouldFallbackToSync,
  noiseReductionView,
  consentText,
  pickPlaybackSource,
  mediaErrorKind,
  noiseReductionDbLabel,
  initialPlaybackVariant,
  variantAfterMediaError,
  shouldFetchMedia,
  shouldRefetchResultOnReopen,
  shouldApplyPrefillResult,
  isMediaUnplayable,
  formatExtensionList,
} from '../src/lib/noiseReduction.js';
import {
  DEFAULT_ASR_CAPABILITIES,
  adaptASRResult,
  getASRMedia,
  asrMediaPath,
} from '../src/lib/api.js';
import { restoreTurkishUiText } from '../src/lib/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Testing ClearVoice Noise Reduction Module ---');

// 1. isNoiseReductionAvailable
const availableCaps = {
  features: { noise_reduction: true },
  noise_reduction: {
    consent_version: 'clearvoice-consent-v1',
    consent_text_tr: 'Metin TR',
    consent_text_en: 'Text EN',
    max_duration_seconds: 3600,
  },
};

assert.strictEqual(isNoiseReductionAvailable(availableCaps), true, 'flag true + block should be available');
assert.strictEqual(
  isNoiseReductionAvailable({ ...availableCaps, features: { noise_reduction: false } }),
  false,
  'flag false should not be available'
);
assert.strictEqual(
  isNoiseReductionAvailable({ features: { noise_reduction: true } }),
  false,
  'flag true without block should not be available'
);
assert.strictEqual(
  isNoiseReductionAvailable({ features: { noise_reduction: true }, noise_reduction: null }),
  false,
  'flag true with null block should not be available'
);
assert.strictEqual(
  isNoiseReductionAvailable({ features: { noise_reduction: true }, noise_reduction: {} }),
  false,
  'flag true with empty block (no consent_version) should not be available'
);
assert.strictEqual(isNoiseReductionAvailable(undefined), false, 'undefined should not be available');
assert.strictEqual(isNoiseReductionAvailable(null), false, 'null should not be available');
assert.strictEqual(isNoiseReductionAvailable(DEFAULT_ASR_CAPABILITIES), false, 'DEFAULT_ASR_CAPABILITIES should not be available');
console.log('✓ isNoiseReductionAvailable test passed');

// 2. noiseReductionBlockedReason
assert.strictEqual(noiseReductionBlockedReason(availableCaps, 3600), null, '3600s with max 3600s should not be blocked');
assert.strictEqual(noiseReductionBlockedReason(availableCaps, 3601), 'duration', '3601s with max 3600s should be blocked with duration');
assert.strictEqual(noiseReductionBlockedReason(availableCaps, null), null, 'null duration should return null');
assert.strictEqual(noiseReductionBlockedReason(availableCaps, NaN), null, 'NaN duration should return null');
assert.strictEqual(noiseReductionBlockedReason(availableCaps, undefined), null, 'undefined duration should return null');
assert.strictEqual(noiseReductionBlockedReason({}, 3601), null, 'no capabilities block should return null');
assert.strictEqual(noiseReductionBlockedReason(null, 3601), null, 'null capabilities should return null');
console.log('✓ noiseReductionBlockedReason test passed');

// 3. appendNoiseReductionFields
const enabledCalls = [];
const fakeFormEnabled = {
  append(key, val) {
    enabledCalls.push([key, val]);
  },
};
appendNoiseReductionFields(fakeFormEnabled, true);
assert.deepStrictEqual(
  enabledCalls,
  [
    ['noise_reduction', 'true'],
    ['noise_reduction_consent', 'true'],
  ],
  'enabled === true should append both fields'
);

const disabledCalls = [];
const fakeFormDisabled = {
  append(key, val) {
    disabledCalls.push([key, val]);
  },
};
appendNoiseReductionFields(fakeFormDisabled, false);
assert.strictEqual(disabledCalls.length, 0, 'enabled === false should not append anything');
console.log('✓ appendNoiseReductionFields test passed');

// 4. shouldFallbackToSync
assert.strictEqual(shouldFallbackToSync({ status: 503 }, false), true, 'status 503 and not enabled should fallback to sync');
assert.strictEqual(shouldFallbackToSync({ status: 503 }, true), false, 'status 503 and enabled should not fallback to sync');
assert.strictEqual(shouldFallbackToSync({ status: 500 }, false), false, 'status 500 should not fallback to sync');
assert.strictEqual(shouldFallbackToSync(null, false), false, 'null error should not fallback to sync');
console.log('✓ shouldFallbackToSync test passed');

// 5. noiseReductionView
assert.strictEqual(noiseReductionView({ noise_reduction: { status: 'applied' } }), 'applied', 'applied status maps to applied');
assert.strictEqual(noiseReductionView({ noise_reduction: { status: 'failed' } }), 'failed', 'failed status maps to failed');
assert.strictEqual(noiseReductionView({ noise_reduction: { status: 'pending' } }), 'none', 'pending status maps to none');
assert.strictEqual(noiseReductionView({ noise_reduction: { status: 'submitted' } }), 'none', 'submitted status maps to none');
assert.strictEqual(noiseReductionView({}), 'none', 'missing noise_reduction maps to none');
assert.strictEqual(noiseReductionView(null), 'none', 'null result maps to none');
assert.strictEqual(noiseReductionView(undefined), 'none', 'undefined result maps to none');
console.log('✓ noiseReductionView test passed');

// 6. consentText
assert.strictEqual(consentText(availableCaps, true), 'Text EN', 'consentText en should return consent_text_en');
assert.strictEqual(consentText(availableCaps, false), 'Metin TR', 'consentText tr should return consent_text_tr');
assert.strictEqual(consentText({}, true), '', 'missing caps should return empty string');
assert.strictEqual(consentText(null, false), '', 'null caps should return empty string');
assert.strictEqual(consentText({ noise_reduction: {} }, true), '', 'missing fields in caps should return empty string');
console.log('✓ consentText test passed');

// 7. adaptASRResult
const adaptedApplied = adaptASRResult({
  id: 'test-1',
  text: 'Hello world',
  noise_reduction: { status: 'applied', noise_reduction_db: 12.5 },
});
assert.deepStrictEqual(
  adaptedApplied.noise_reduction,
  { status: 'applied', noise_reduction_db: 12.5 },
  'adaptASRResult should pass through noise_reduction'
);

const adaptedNone = adaptASRResult({
  id: 'test-2',
  text: 'Without denoise',
});
assert.strictEqual(adaptedNone.noise_reduction, null, 'adaptASRResult without noise_reduction should be null');
console.log('✓ adaptASRResult noise_reduction passthrough test passed');

// 8. pickPlaybackSource
// - original with a local blob -> the blob
assert.strictEqual(
  pickPlaybackSource({
    variant: 'original',
    localObjectUrl: 'blob:http://localhost/local-blob-1',
    mediaUrls: { original: 'https://cdn.example.com/remote-orig.mp3' },
  }),
  'blob:http://localhost/local-blob-1',
  'original with local blob should return the local blob'
);

// - original without a blob -> mediaUrls.original
assert.strictEqual(
  pickPlaybackSource({
    variant: 'original',
    localObjectUrl: null,
    mediaUrls: { original: 'https://cdn.example.com/remote-orig.mp3' },
  }),
  'https://cdn.example.com/remote-orig.mp3',
  'original without blob should return mediaUrls.original'
);

// - denoised with a blob present -> mediaUrls.denoised (never the blob)
assert.strictEqual(
  pickPlaybackSource({
    variant: 'denoised',
    localObjectUrl: 'blob:http://localhost/local-blob-1',
    mediaUrls: { denoised: 'https://cdn.example.com/remote-denoised.mp3' },
  }),
  'https://cdn.example.com/remote-denoised.mp3',
  'denoised with local blob should return mediaUrls.denoised, never the blob'
);

// - denoised missing -> null
assert.strictEqual(
  pickPlaybackSource({
    variant: 'denoised',
    localObjectUrl: 'blob:http://localhost/local-blob-1',
    mediaUrls: { original: 'https://cdn.example.com/remote-orig.mp3' },
  }),
  null,
  'denoised missing should return null'
);
assert.strictEqual(
  pickPlaybackSource({
    variant: 'denoised',
    localObjectUrl: null,
    mediaUrls: {},
  }),
  null,
  'denoised missing in empty mediaUrls should return null'
);

// - mediaUrls undefined -> null / the blob
assert.strictEqual(
  pickPlaybackSource({
    variant: 'original',
    localObjectUrl: 'blob:http://localhost/local-blob-1',
    mediaUrls: undefined,
  }),
  'blob:http://localhost/local-blob-1',
  'original with local blob and mediaUrls undefined should return blob'
);
assert.strictEqual(
  pickPlaybackSource({
    variant: 'original',
    localObjectUrl: null,
    mediaUrls: undefined,
  }),
  null,
  'original without blob and mediaUrls undefined should return null'
);
assert.strictEqual(
  pickPlaybackSource({
    variant: 'denoised',
    localObjectUrl: 'blob:http://localhost/local-blob-1',
    mediaUrls: undefined,
  }),
  null,
  'denoised with mediaUrls undefined should return null'
);
console.log('✓ pickPlaybackSource tests passed');

// 9. mediaErrorKind: 410, 404, 500, undefined
assert.strictEqual(mediaErrorKind(410), 'expired', '410 should map to expired');
assert.strictEqual(mediaErrorKind(404), 'missing', '404 should map to missing');
assert.strictEqual(mediaErrorKind(500), 'other', '500 should map to other');
assert.strictEqual(mediaErrorKind(undefined), 'other', 'undefined should map to other');
assert.strictEqual(mediaErrorKind(null), 'other', 'null should map to other');
assert.strictEqual(mediaErrorKind(503), 'other', '503 should map to other');
console.log('✓ mediaErrorKind tests passed');

// 10. noiseReductionDbLabel
// - 12.345 -> "12.3" in both languages
assert.strictEqual(
  noiseReductionDbLabel({ noise_reduction: { noise_reduction_db: 12.345 } }, true),
  'Noise reduced by 12.3 dB',
  '12.345 EN label should be Noise reduced by 12.3 dB'
);
assert.strictEqual(
  noiseReductionDbLabel({ noise_reduction: { noise_reduction_db: 12.345 } }, false),
  'Gürültü 12.3 dB azaltıldı',
  '12.345 TR label should be Gürültü 12.3 dB azaltıldı'
);
// - direct noise_reduction_db object property support
assert.strictEqual(
  noiseReductionDbLabel({ noise_reduction_db: 12.345 }, true),
  'Noise reduced by 12.3 dB',
  'direct noise_reduction_db 12.345 EN label'
);
assert.strictEqual(
  noiseReductionDbLabel({ noise_reduction_db: 12.345 }, false),
  'Gürültü 12.3 dB azaltıldı',
  'direct noise_reduction_db 12.345 TR label'
);
// - missing -> ''
assert.strictEqual(noiseReductionDbLabel({}, true), '', 'missing should return empty string');
assert.strictEqual(noiseReductionDbLabel(null, false), '', 'null should return empty string');
assert.strictEqual(noiseReductionDbLabel(undefined, true), '', 'undefined should return empty string');
assert.strictEqual(noiseReductionDbLabel({ noise_reduction: {} }, true), '', 'missing db should return empty string');
assert.strictEqual(noiseReductionDbLabel({ noise_reduction: { noise_reduction_db: null } }, true), '', 'null db should return empty string');
// - 0 -> label with 0
assert.strictEqual(
  noiseReductionDbLabel({ noise_reduction: { noise_reduction_db: 0 } }, true),
  'Noise reduced by 0 dB',
  '0 EN label should be Noise reduced by 0 dB'
);
assert.strictEqual(
  noiseReductionDbLabel({ noise_reduction: { noise_reduction_db: 0 } }, false),
  'Gürültü 0 dB azaltıldı',
  '0 TR label should be Gürültü 0 dB azaltıldı'
);
console.log('✓ noiseReductionDbLabel tests passed');

// 11. asrMediaPath and getASRMedia
assert.strictEqual(
  asrMediaPath('job-42', 'original'),
  '/api/v1/asr/jobs/job-42/media?variant=original',
  'asrMediaPath should build correct original path'
);
assert.strictEqual(
  asrMediaPath('job-42', 'denoised'),
  '/api/v1/asr/jobs/job-42/media?variant=denoised',
  'asrMediaPath should build correct denoised path'
);
assert.strictEqual(
  asrMediaPath('job/42 with space', 'denoised'),
  '/api/v1/asr/jobs/job%2F42%20with%20space/media?variant=denoised',
  'asrMediaPath should encode job ID and variant'
);

// getASRMedia fetch integration
const originalFetch = globalThis.fetch;
try {
  // Test 1: successful fetch
  globalThis.fetch = async (url) => {
    assert.strictEqual(url, '/api/v1/asr/jobs/job-100/media?variant=denoised');
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          url: 'https://cdn.example.com/audio.mp3',
          expires_in_seconds: 3600,
          variant: 'denoised',
          media_type: 'audio',
          content_type: 'audio/mpeg',
        };
      },
    };
  };
  const mediaResult = await getASRMedia('job-100', 'denoised');
  assert.strictEqual(mediaResult.url, 'https://cdn.example.com/audio.mp3');
  assert.strictEqual(mediaResult.variant, 'denoised');

  // Test 2: 404 propagates error.status = 404
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    async json() {
      return { detail: 'media_not_found' };
    },
  });
  let err404 = null;
  try {
    await getASRMedia('job-100', 'denoised');
  } catch (err) {
    err404 = err;
  }
  assert.ok(err404, '404 should throw error');
  assert.strictEqual(err404.status, 404, 'error.status should be 404');

  // Test 3: 410 propagates error.status = 410
  globalThis.fetch = async () => ({
    ok: false,
    status: 410,
    async json() {
      return { detail: 'file_expired' };
    },
  });
  let err410 = null;
  try {
    await getASRMedia('job-100', 'original');
  } catch (err) {
    err410 = err;
  }
  assert.ok(err410, '410 should throw error');
  assert.strictEqual(err410.status, 410, 'error.status should be 410');
} finally {
  globalThis.fetch = originalFetch;
}
console.log('✓ asrMediaPath and getASRMedia tests passed');

// 12. initialPlaybackVariant
assert.strictEqual(initialPlaybackVariant('applied'), 'denoised', 'applied view should initialize to denoised');
assert.strictEqual(initialPlaybackVariant('none'), 'original', 'none view should initialize to original');
assert.strictEqual(initialPlaybackVariant('failed'), 'original', 'failed view should initialize to original');
assert.strictEqual(initialPlaybackVariant(null), 'original', 'null view should initialize to original');
assert.strictEqual(initialPlaybackVariant(undefined), 'original', 'undefined view should initialize to original');
console.log('✓ initialPlaybackVariant tests passed');

// 13. variantAfterMediaError
assert.deepStrictEqual(
  variantAfterMediaError('denoised', 'missing'),
  { variant: 'original', showSwitch: false, expired: false },
  'denoised missing should fallback to original without switch'
);
assert.deepStrictEqual(
  variantAfterMediaError('denoised', 'other'),
  { variant: 'original', showSwitch: false, expired: false },
  'denoised other should fallback to original without switch'
);
assert.deepStrictEqual(
  variantAfterMediaError('denoised', 'expired'),
  { variant: 'denoised', showSwitch: false, expired: true },
  'denoised expired should set expired true'
);
assert.deepStrictEqual(
  variantAfterMediaError('original', 'expired'),
  { variant: 'original', showSwitch: false, expired: true },
  'original expired should set expired true'
);
assert.deepStrictEqual(
  variantAfterMediaError('original', 'missing'),
  { variant: 'denoised', showSwitch: false, expired: false },
  'original missing should fallback to denoised without switch'
);
assert.deepStrictEqual(
  variantAfterMediaError('original', 'other'),
  { variant: 'denoised', showSwitch: false, expired: false },
  'original other should fallback to denoised without switch'
);
assert.deepStrictEqual(
  variantAfterMediaError('original', 'missing', { otherFailed: true }),
  { variant: null, showSwitch: false, expired: false, unplayable: true },
  'original missing when other also failed should be unplayable'
);
assert.deepStrictEqual(
  variantAfterMediaError('denoised', 'missing', { otherFailed: true }),
  { variant: null, showSwitch: false, expired: false, unplayable: true },
  'denoised missing when other also failed should be unplayable'
);
assert.deepStrictEqual(
  variantAfterMediaError('original', 'other', { otherFailed: true }),
  { variant: null, showSwitch: false, expired: false, unplayable: true },
  'original other when other also failed should be unplayable'
);
assert.deepStrictEqual(
  variantAfterMediaError('original', 'expired', { otherFailed: true }),
  { variant: 'original', showSwitch: false, expired: true },
  'expired takes precedence over otherFailed'
);
console.log('✓ variantAfterMediaError tests passed');

// 14. shouldFetchMedia
assert.strictEqual(
  shouldFetchMedia({ view: 'none', variant: 'original', hasLocalBlob: false }),
  false,
  'plain job should not fetch original'
);
assert.strictEqual(
  shouldFetchMedia({ view: 'none', variant: 'denoised', hasLocalBlob: false }),
  false,
  'plain job should not fetch denoised'
);
assert.strictEqual(
  shouldFetchMedia({ view: 'failed', variant: 'original', hasLocalBlob: false }),
  false,
  'failed view should not fetch original'
);
assert.strictEqual(
  shouldFetchMedia({ view: 'failed', variant: 'denoised', hasLocalBlob: false }),
  false,
  'failed view should not fetch denoised'
);
assert.strictEqual(
  shouldFetchMedia({ view: 'applied', variant: 'denoised', hasLocalBlob: true }),
  true,
  'applied view should fetch denoised even with local blob'
);
assert.strictEqual(
  shouldFetchMedia({ view: 'applied', variant: 'denoised', hasLocalBlob: false }),
  true,
  'applied view should fetch denoised without local blob'
);
assert.strictEqual(
  shouldFetchMedia({ view: 'applied', variant: 'original', hasLocalBlob: true }),
  false,
  'applied view should not fetch original when local blob exists'
);
assert.strictEqual(
  shouldFetchMedia({ view: 'applied', variant: 'original', hasLocalBlob: false }),
  true,
  'applied view should fetch original when local blob does not exist'
);
console.log('✓ shouldFetchMedia tests passed');

// 15. shouldRefetchResultOnReopen
assert.strictEqual(
  shouldRefetchResultOnReopen({ jobId: 'job-123' }),
  true,
  'prefill with jobId and no noise_reduction should refetch result'
);
assert.strictEqual(
  shouldRefetchResultOnReopen({ jobId: 'job-123', noise_reduction: { status: 'applied' } }),
  false,
  'prefill with noise_reduction applied should not refetch result'
);
assert.strictEqual(
  shouldRefetchResultOnReopen({ jobId: 'job-123', noise_reduction: null }),
  false,
  'prefill with noise_reduction key (null) should not refetch result'
);
assert.strictEqual(
  shouldRefetchResultOnReopen({ jobId: 'job-123', noise_reduction: undefined }),
  false,
  'prefill with noise_reduction key (undefined) should not refetch result'
);
assert.strictEqual(
  shouldRefetchResultOnReopen({}),
  false,
  'prefill without jobId should not refetch result'
);
assert.strictEqual(
  shouldRefetchResultOnReopen(null),
  false,
  'null prefill should not refetch result'
);
assert.strictEqual(
  shouldRefetchResultOnReopen(undefined),
  false,
  'undefined prefill should not refetch result'
);
console.log('✓ shouldRefetchResultOnReopen tests passed');

// 16. Blocker scenario: after a reset, pickPlaybackSource returns local blob
assert.strictEqual(
  pickPlaybackSource({
    variant: initialPlaybackVariant('none'),
    localObjectUrl: 'blob:x',
    mediaUrls: null,
  }),
  'blob:x',
  'after reset, pickPlaybackSource with initialPlaybackVariant(none) should return local blob'
);
console.log('✓ Blocker reset scenario test passed');

// 17. shouldApplyPrefillResult
assert.strictEqual(
  shouldApplyPrefillResult({ noise_reduction: { status: 'applied' } }),
  true,
  'prefill with noise_reduction status applied should return true'
);
assert.strictEqual(
  shouldApplyPrefillResult({ noise_reduction: { status: 'failed' } }),
  false,
  'prefill with noise_reduction status failed should return false'
);
assert.strictEqual(
  shouldApplyPrefillResult({ noise_reduction: { status: 'none' } }),
  false,
  'prefill with noise_reduction status none should return false'
);
assert.strictEqual(
  shouldApplyPrefillResult({ jobId: 'job-123', transcriptText: 'sample text' }),
  false,
  'plain prefill without noise_reduction should return false'
);
assert.strictEqual(
  shouldApplyPrefillResult(null),
  false,
  'null prefill should return false'
);
assert.strictEqual(
  shouldApplyPrefillResult(undefined),
  false,
  'undefined prefill should return false'
);
assert.strictEqual(
  shouldApplyPrefillResult({}),
  false,
  'empty object prefill should return false'
);
console.log('✓ shouldApplyPrefillResult tests passed');

// 18. isMediaUnplayable
// (a) history re-open, no local blob, the denoised fetch succeeds, the original fetch fails -> false (denoised plays)
assert.strictEqual(
  isMediaUnplayable({
    hasLocalBlob: false,
    denoisedUrl: 'https://example.com/denoised.mp3',
    denoisedFailed: false,
    originalFailed: true,
  }),
  false,
  '(a) history re-open: denoised fetch succeeds, original fails -> false (denoised plays)'
);

// (b) both failed, no blob -> true
assert.strictEqual(
  isMediaUnplayable({
    hasLocalBlob: false,
    denoisedUrl: null,
    denoisedFailed: true,
    originalFailed: true,
  }),
  true,
  '(b) both failed, no blob -> true'
);
assert.strictEqual(
  isMediaUnplayable({
    hasLocalBlob: false,
    denoisedUrl: 'https://example.com/denoised.mp3',
    denoisedFailed: true,
    originalFailed: true,
  }),
  true,
  '(b) both failed, even if url is lingering but failed -> true'
);

// (c) denoised failed + local blob -> false
assert.strictEqual(
  isMediaUnplayable({
    hasLocalBlob: true,
    denoisedUrl: null,
    denoisedFailed: true,
    originalFailed: false,
  }),
  false,
  '(c) denoised failed + local blob -> false'
);
assert.strictEqual(
  isMediaUnplayable({
    hasLocalBlob: true,
    denoisedUrl: null,
    denoisedFailed: true,
    originalFailed: true,
  }),
  false,
  '(c) denoised failed + local blob with originalFailed true -> false'
);

// (d) denoised already known from earlier + original failed -> false
assert.strictEqual(
  isMediaUnplayable({
    hasLocalBlob: false,
    denoisedUrl: 'https://example.com/known-denoised.mp3',
    denoisedFailed: false,
    originalFailed: true,
  }),
  false,
  '(d) denoised already known from earlier + original failed -> false'
);

// Additional edge cases
assert.strictEqual(
  isMediaUnplayable({
    hasLocalBlob: false,
    denoisedUrl: null,
    denoisedFailed: false,
    originalFailed: false,
  }),
  false,
  'neither failed -> false'
);
assert.strictEqual(
  isMediaUnplayable({}),
  false,
  'empty options -> false'
);
console.log('✓ isMediaUnplayable tests passed');

// 19. restoreTurkishUiText for ClearVoice noise reduction strings
const unchangedStrings = [
  'ClearVoice teknolojisi ile gürültü giderme',
  'Gürültü giderme onayı',
  'Gürültüsü giderilmiş',
  'Orijinal',
  'Gürültü giderme uygulanamadı; transkript orijinal sesten üretildi.',
  'Medya şu anda yüklenemiyor.',
  'Gürültü giderme en fazla 60 dakikalık dosyalarda kullanılabilir.',
  'Deşifre Özellikleri',
  'İşlem Hızı',
  'Gerçek Zamandan Hızlı',
  'Türkçe (TR)',
  'Altyazı / Çıktı',
  'Seçili Dosya',
  'Tür',
  'Video Dosyası',
  'Ses Dosyası',
  'Süre',
  'Video Oynatıcı & Önizleme',
  'Ses Oynatıcı & Önizleme',
];

for (const str of unchangedStrings) {
  assert.strictEqual(
    restoreTurkishUiText(str),
    str,
    `restoreTurkishUiText should leave "${str}" unchanged`
  );
}
assert.strictEqual(
  restoreTurkishUiText('kisisel'),
  'kişisel',
  'restoreTurkishUiText should still convert "kisisel" to "kişisel"'
);
console.log('✓ restoreTurkishUiText noise reduction UI strings test passed');

// 20. Consent dialog title styling
const asrSource = readFileSync(resolve(__dirname, '../src/pages/ASR.jsx'), 'utf8');
assert.ok(
  asrSource.includes('id="asr-noise-consent-title"'),
  'ASR.jsx must contain id="asr-noise-consent-title" (checks the source text only)'
);
assert.ok(
  !/<h3\s+id="asr-noise-consent-title"[^>]*style=\{\{[^}]*color/.test(asrSource),
  'asr-noise-consent-title must not have inline color (checks the source text only)'
);
assert.ok(
  !asrSource.includes('#1a1a2e'),
  'ASR.jsx must not contain #1a1a2e (checks the source text only)'
);
assert.ok(
  !asrSource.includes("t('Secili Dosya'"),
  'ASR.jsx must not contain t(\'Secili Dosya\') (checks the source text only)'
);
assert.ok(
  !asrSource.includes("t('Tur', 'Type')"),
  'ASR.jsx must not contain t(\'Tur\', \'Type\') (checks the source text only)'
);
assert.ok(
  !asrSource.includes("t('Video Dosyasi'"),
  'ASR.jsx must not contain t(\'Video Dosyasi\') (checks the source text only)'
);
assert.ok(
  !asrSource.includes("t('Ses Dosyasi'"),
  'ASR.jsx must not contain t(\'Ses Dosyasi\') (checks the source text only)'
);
assert.ok(
  !asrSource.includes("t('Sure', 'Duration')"),
  'ASR.jsx must not contain t(\'Sure\', \'Duration\') (checks the source text only)'
);
assert.ok(
  !asrSource.includes("t('Video Oynatici & Onizleme'"),
  'ASR.jsx must not contain t(\'Video Oynatici & Onizleme\') (checks the source text only)'
);
assert.ok(
  !asrSource.includes("t('Ses Oynatici & Onizleme'"),
  'ASR.jsx must not contain t(\'Ses Oynatici & Onizleme\') (checks the source text only)'
);
assert.ok(
  asrSource.includes('formatExtensionList(capabilities?.video_extensions, DEFAULT_ASR_CAPABILITIES.video_extensions)'),
  'ASR.jsx must call formatExtensionList for video with fallback DEFAULT_ASR_CAPABILITIES.video_extensions'
);
console.log('✓ consent dialog title styling check passed (checks the source text only)');

// 21. formatExtensionList
const defaultFormatted = formatExtensionList(DEFAULT_ASR_CAPABILITIES.audio_extensions);
for (const ext of DEFAULT_ASR_CAPABILITIES.audio_extensions) {
  const clean = ext.replace(/^\./, '');
  const expectedToken = clean.toLowerCase() === 'opus' ? 'Opus' : clean.toLowerCase() === 'webm' ? 'WebM' : clean.toUpperCase();
  assert.ok(
    defaultFormatted.includes(expectedToken),
    `formatExtensionList(defaults) must include "${expectedToken}"`
  );
}
assert.ok(!defaultFormatted.includes('...'), 'formatExtensionList(defaults) must not contain "..."');

// Empty or missing list falls back to defaults
assert.strictEqual(
  formatExtensionList(),
  defaultFormatted,
  'formatExtensionList() should fall back to defaults'
);
assert.strictEqual(
  formatExtensionList(null),
  defaultFormatted,
  'formatExtensionList(null) should fall back to defaults'
);
assert.strictEqual(
  formatExtensionList(undefined),
  defaultFormatted,
  'formatExtensionList(undefined) should fall back to defaults'
);
assert.strictEqual(
  formatExtensionList([]),
  defaultFormatted,
  'formatExtensionList([]) should fall back to defaults'
);

// Unknown extensions are upper-cased and special cases Opus / WebM are preserved
assert.strictEqual(
  formatExtensionList(['.xyz', 'foo', '.opus', '.webm', 'bar']),
  'XYZ, FOO, Opus, WebM, BAR',
  'formatExtensionList should upper-case unknown extensions and keep special-cased Opus / WebM'
);

assert.strictEqual(
  formatExtensionList(DEFAULT_ASR_CAPABILITIES.video_extensions),
  'MP4, MOV, MKV, WebM',
  'formatExtensionList should format video extensions correctly'
);

// Missing video list and empty video list both fall back to video defaults when passed as fallback
assert.strictEqual(
  formatExtensionList(undefined, DEFAULT_ASR_CAPABILITIES.video_extensions),
  'MP4, MOV, MKV, WebM',
  'formatExtensionList(undefined, video_extensions) should fall back to video defaults'
);
assert.strictEqual(
  formatExtensionList([], DEFAULT_ASR_CAPABILITIES.video_extensions),
  'MP4, MOV, MKV, WebM',
  'formatExtensionList([], video_extensions) should fall back to video defaults'
);

// Trimming whitespace and filtering empty/null elements
assert.strictEqual(
  formatExtensionList([' .mp3 ', '', null]),
  'MP3',
  'formatExtensionList([\' .mp3 \', \'\', null]) should return \'MP3\''
);
console.log('✓ formatExtensionList tests passed');

console.log('All ClearVoice noise reduction unit tests passed successfully!');
