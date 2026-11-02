import assert from 'node:assert';
import {
  DEFAULT_ASR_CAPABILITIES,
  adaptASRResult,
} from '../src/lib/api.js';

console.log('--- Testing Unified ASR Frontend Module ---');

// 1. Verify Default Capabilities
assert.strictEqual(DEFAULT_ASR_CAPABILITIES.max_upload_bytes, 104857600, 'Max upload bytes should be 100 MiB');
assert.ok(DEFAULT_ASR_CAPABILITIES.audio_extensions.includes('.flac'), 'Should support FLAC');
assert.ok(DEFAULT_ASR_CAPABILITIES.audio_extensions.includes('.m4a'), 'Should support M4A');
assert.ok(DEFAULT_ASR_CAPABILITIES.audio_extensions.includes('.opus'), 'Should support Opus');
assert.ok(DEFAULT_ASR_CAPABILITIES.audio_extensions.includes('.wma'), 'Should support WMA');
assert.ok(DEFAULT_ASR_CAPABILITIES.video_extensions.includes('.mp4'), 'Should support MP4 video');
assert.ok(DEFAULT_ASR_CAPABILITIES.video_extensions.includes('.mov'), 'Should support MOV video');
assert.ok(DEFAULT_ASR_CAPABILITIES.video_extensions.includes('.mkv'), 'Should support MKV video');
assert.ok(DEFAULT_ASR_CAPABILITIES.video_extensions.includes('.webm'), 'Should support WebM video');
console.log('✓ Default capabilities test passed');

// 2. Verify adaptASRResult with Full Modern Result
const modernResult = {
  job_id: '123e4567-e89b-12d3-a456-426614174000',
  status: 'completed',
  text: 'Merhaba dunya, Konusmatik video ve ses destegi test ediliyor.',
  media_type: 'video',
  original_filename: 'presentation.mp4',
  duration_seconds: 15.5,
  language: 'tr',
  segments: [
    {
      id: 0,
      start: 0.5,
      end: 4.2,
      text: 'Merhaba dunya',
      words: [
        { start: 0.5, end: 1.8, word: 'Merhaba' },
        { start: 1.9, end: 4.2, word: 'dunya' },
      ],
    },
    {
      id: 1,
      start: 4.3,
      end: 15.5,
      text: 'Konusmatik video ve ses destegi test ediliyor.',
      words: [],
    },
  ],
  words: [
    { start: 0.5, end: 1.8, word: 'Merhaba' },
    { start: 1.9, end: 4.2, word: 'dunya' },
  ],
  srt: '1\n00:00:00,500 --> 00:00:04,200\nMerhaba dunya\n',
  vtt: 'WEBVTT\n\n1\n00:00:00.500 --> 00:00:04.200\nMerhaba dunya\n',
};

const adaptedModern = adaptASRResult(modernResult);
assert.strictEqual(adaptedModern.job_id, '123e4567-e89b-12d3-a456-426614174000');
assert.strictEqual(adaptedModern.media_type, 'video');
assert.strictEqual(adaptedModern.segments.length, 2);
assert.strictEqual(adaptedModern.segments[0].words.length, 2);
assert.strictEqual(adaptedModern.words.length, 2);
assert.strictEqual(adaptedModern.duration_seconds, 15.5);
console.log('✓ Modern segment/word timestamp adaptation test passed');

// 3. Verify adaptASRResult with Legacy Record (Backward Compatibility)
const legacyResult = {
  id: 'legacy-999',
  output_text: 'Eski sistem kaydi sadece text donduruyor.',
  audio_duration_seconds: 30,
  filename: 'old_meeting.wav',
};

const adaptedLegacy = adaptASRResult(legacyResult);
assert.strictEqual(adaptedLegacy.job_id, 'legacy-999');
assert.strictEqual(adaptedLegacy.text, 'Eski sistem kaydi sadece text donduruyor.');
assert.strictEqual(adaptedLegacy.duration_seconds, 30);
assert.strictEqual(adaptedLegacy.media_type, 'audio');
assert.deepStrictEqual(adaptedLegacy.segments, []);
assert.deepStrictEqual(adaptedLegacy.words, []);
assert.strictEqual(adaptedLegacy.status, 'completed');
console.log('✓ Legacy backward compatibility adaptation test passed');

// 4. Verify Empty / Null Safety
assert.strictEqual(adaptASRResult(null), null);
assert.strictEqual(adaptASRResult(undefined), null);
const emptyAdapted = adaptASRResult({});
assert.strictEqual(emptyAdapted.text, '');
assert.deepStrictEqual(emptyAdapted.segments, []);
assert.deepStrictEqual(emptyAdapted.words, []);
console.log('✓ Null and empty safety test passed');

console.log('All unified ASR unit tests passed successfully!');
