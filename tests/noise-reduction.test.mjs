import assert from 'node:assert';
import {
  isNoiseReductionAvailable,
  noiseReductionBlockedReason,
  appendNoiseReductionFields,
  shouldFallbackToSync,
  noiseReductionView,
  consentText,
} from '../src/lib/noiseReduction.js';
import {
  DEFAULT_ASR_CAPABILITIES,
  adaptASRResult,
} from '../src/lib/api.js';

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
console.log('All ClearVoice noise reduction unit tests passed successfully!');
