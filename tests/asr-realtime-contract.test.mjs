import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  ASR_LANGUAGE,
  ASR_MODEL_DISPLAY_NAME,
  ASR_MODEL_ID,
  buildRealtimeStartMessage,
  buildRealtimeUpdateMessage,
  buildSrt,
  buildTimestampGranularities,
  buildVtt,
  formatTimestamp,
} from '../src/lib/asrSupport.js';

console.log('--- Testing ASR model, language and timestamp contract ---');

// 1. One model id, the canonical id of the backend registry (app/core/asr_models.py)
assert.strictEqual(ASR_MODEL_ID, 'konusmatik-asr-v2');
assert.strictEqual(ASR_MODEL_DISPLAY_NAME, 'Konuşmatik ASR');
assert.strictEqual(ASR_LANGUAGE, 'tr');
console.log('✓ model constants');

// 2. "Include timestamps" / "Include word timestamps" -> timestamp_granularities
assert.deepStrictEqual(buildTimestampGranularities(false, false), []);
assert.deepStrictEqual(buildTimestampGranularities(false, true), [], 'word timestamps need timestamps on');
assert.deepStrictEqual(buildTimestampGranularities(true, false), ['segment']);
assert.deepStrictEqual(buildTimestampGranularities(true, true), ['segment', 'word']);
console.log('✓ granularities');

// 3. Realtime messages: the registry model id and Turkish audio, whatever language the UI is in
const start = buildRealtimeStartMessage({ includeTimestamps: true, includeWordTimestamps: true });
assert.deepStrictEqual(start, {
  type: 'session.start',
  model: 'konusmatik-asr-v2',
  encoding: 'pcm_s16le',
  sample_rate: 16000,
  language: 'tr',
  timestamp_granularities: ['segment', 'word'],
});
assert.deepStrictEqual(buildRealtimeStartMessage({ includeTimestamps: false, includeWordTimestamps: true }).timestamp_granularities, []);
assert.deepStrictEqual(buildRealtimeUpdateMessage(true, false), { type: 'session.update', timestamp_granularities: ['segment'] });
console.log('✓ realtime messages');

// 4. Time formatting is exact to the millisecond (no truncation of 4.3 -> 4.299, no 1000 ms)
const cases = [
  [0, '00:00:00.000'],
  [4.3, '00:00:04.300'],
  [1.001, '00:00:01.001'],
  [1.0006, '00:00:01.001'],
  [59.9996, '00:01:00.000'],
  [3599.9996, '01:00:00.000'],
  [3661.123, '01:01:01.123'],
  [36000.5, '10:00:00.500'],
];
for (const [seconds, expected] of cases) {
  assert.strictEqual(formatTimestamp(seconds, true), expected, `formatTimestamp(${seconds})`);
}
assert.strictEqual(formatTimestamp(4.3), '00:04.300');
assert.strictEqual(formatTimestamp(null), '00:00.000');
console.log('✓ formatTimestamp');

// 5. SRT / VTT cues equal the source timestamps
const segments = [
  { start: 0, end: 1.5, text: 'bir' },
  { start: 4.3, end: 59.9996, text: 'iki' },
  { start: 3661.123, end: 3661.9, text: 'üç' },
];
assert.strictEqual(
  buildSrt(segments),
  '1\n00:00:00,000 --> 00:00:01,500\nbir\n\n2\n00:00:04,300 --> 00:01:00,000\niki\n\n3\n01:01:01,123 --> 01:01:01,900\nüç\n'
);
assert.strictEqual(
  buildVtt(segments),
  'WEBVTT\n\n1\n00:00:00.000 --> 00:00:01.500\nbir\n\n2\n00:00:04.300 --> 00:01:00.000\niki\n\n3\n01:01:01.123 --> 01:01:01.900\nüç\n'
);
console.log('✓ SRT / VTT');

// 6. The product is called Konuşmatik ASR: no engine/library name in user-facing sources
for (const file of ['../src/pages/ASR.jsx', '../src/lib/asrSupport.js']) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.ok(!/whisper/i.test(source), `${file} must not mention the underlying engine name`);
}
console.log('✓ branding');

// 7. Public API docs show the current model and the language rule, never the retired model id
for (const file of ['../src/data/apiDocsV2.js', '../src/data/apiDocsWebhooks.js']) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8');
  assert.ok(!source.includes('konusmatik-asr-v1'), `${file} must use konusmatik-asr-v2`);
  assert.ok(!/whisper/i.test(source), `${file} must not mention the underlying engine name`);
}
const docs = readFileSync(new URL('../src/data/apiDocsV2.js', import.meta.url), 'utf8');
assert.ok(docs.includes('unsupported_language'), 'the language parameter docs must state that only Turkish is supported');
console.log('✓ API docs');

console.log('All ASR contract tests passed successfully!');
