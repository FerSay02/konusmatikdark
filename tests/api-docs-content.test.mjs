import assert from 'node:assert';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('--- Testing API Docs Content (T21 / 1.29.0) ---');

// 1. Verify docExamples.js constants match backend example files byte-for-byte
const examplesDir = process.env.BACKEND_EXAMPLES_DIR || resolve(__dirname, '../.work/T21-assets/examples');
const docExamples = await import('../src/data/docExamples.js');

const EXAMPLE_FILES = {
  errorsRetry: 'errors_retry.py',
  modelsList: 'models_list.py',
  modelsRetrieve: 'models_retrieve.py',
  sttJson: 'stt_json.py',
  sttSrt: 'stt_srt.py',
  sttVerboseWords: 'stt_verbose_words.py',
  ttsMp3Speed: 'tts_mp3_speed.py',
  ttsPcmStream: 'tts_pcm_stream.py',
  ttsWav: 'tts_wav.py',
};

for (const [constName, fileName] of Object.entries(EXAMPLE_FILES)) {
  const filePath = resolve(examplesDir, fileName);
  const expectedContent = readFileSync(filePath, 'utf8');
  const actualContent = docExamples[constName];

  assert.ok(actualContent !== undefined, `docExamples.${constName} must be exported`);
  assert.strictEqual(
    Buffer.from(actualContent, 'utf8').compare(Buffer.from(expectedContent, 'utf8')),
    0,
    `docExamples.${constName} must equal ${fileName} byte for byte`
  );
}
console.log('✓ docExamples constants match example files byte-for-byte');

// 2. Verify model IDs and model cards
const apiDocs = await import('../src/data/apiDocsV2.js');

// 2a. Realtime (OpenAI-compatible) code examples must use konusmatik-asr-v1 and not konusmatik-asr-v2
for (const [lang, code] of Object.entries(apiDocs.openAiRealtimeCodeExamples || {})) {
  assert.ok(
    !code.includes('konusmatik-asr-v2'),
    `openAiRealtimeCodeExamples.${lang} must not contain konusmatik-asr-v2`
  );
  assert.ok(
    code.includes('konusmatik-asr-v1'),
    `openAiRealtimeCodeExamples.${lang} must contain konusmatik-asr-v1`
  );
}

for (const [lang, code] of Object.entries(apiDocs.realtimeCodeExamples || {})) {
  assert.ok(
    !code.includes('konusmatik-asr-v2'),
    `realtimeCodeExamples.${lang} must not contain konusmatik-asr-v2`
  );
  assert.ok(
    code.includes('konusmatik-asr-v1'),
    `realtimeCodeExamples.${lang} must contain konusmatik-asr-v1`
  );
}

// 2b. Realtime event table / descriptions for OpenAI-compatible endpoint
const openAiRealtimeDesc = JSON.stringify(apiDocs.realtimeEventTable || {});
assert.ok(
  !openAiRealtimeDesc.includes('konusmatik-asr-v2'),
  'realtimeEventTable for OpenAI endpoint must not reference konusmatik-asr-v2'
);
assert.ok(
  openAiRealtimeDesc.includes('konusmatik-asr-v1'),
  'realtimeEventTable for OpenAI endpoint must reference konusmatik-asr-v1'
);

// 2c. Model catalog cards
const v1Card = apiDocs.modelsData?.find((m) => m.name === 'Konuşmatik ASR v1');
assert.ok(v1Card, 'Card named "Konuşmatik ASR v1" must exist');
assert.strictEqual(v1Card.id, 'konusmatik-asr-v1', 'The "Konuşmatik ASR v1" card must have id konusmatik-asr-v1');

const v2Card = apiDocs.modelsData?.find((m) => m.id === 'konusmatik-asr-v2');
assert.ok(v2Card, 'Card with id konusmatik-asr-v2 must exist');

const ttsCard = apiDocs.modelsData?.find((m) => m.id === 'konusmatik-tts');
assert.ok(ttsCard, 'Card with id konusmatik-tts must exist');

// TTS parameters default model must match konusmatik-tts
const ttsModelParam = apiDocs.ttsParameters?.find((p) => p.name === 'model');
assert.ok(ttsModelParam, 'TTS model parameter must exist');
assert.strictEqual(ttsModelParam.defaultVal, 'konusmatik-tts', 'TTS model parameter default must be konusmatik-tts');

// 2d. Python code blocks on the page use docExamples constants directly (no second copy)
assert.strictEqual(apiDocs.modelsCodeExamples?.python, docExamples.modelsList, 'modelsCodeExamples.python must use docExamples.modelsList');
assert.strictEqual(apiDocs.modelsRetrieveCodeExamples?.python, docExamples.modelsRetrieve, 'modelsRetrieveCodeExamples.python must use docExamples.modelsRetrieve');
assert.strictEqual(apiDocs.ttsCodeExamples?.python, docExamples.ttsWav, 'ttsCodeExamples.python must use docExamples.ttsWav');
assert.strictEqual(apiDocs.ttsSpeedCodeExamples?.python, docExamples.ttsMp3Speed, 'ttsSpeedCodeExamples.python must use docExamples.ttsMp3Speed');
assert.strictEqual(apiDocs.streamingTtsCodeExamples?.python, docExamples.ttsPcmStream, 'streamingTtsCodeExamples.python must use docExamples.ttsPcmStream');
assert.strictEqual(apiDocs.asrCodeExamples?.python, docExamples.sttJson, 'asrCodeExamples.python must use docExamples.sttJson');
assert.strictEqual(apiDocs.asrVerboseWordsCodeExamples?.python, docExamples.sttVerboseWords, 'asrVerboseWordsCodeExamples.python must use docExamples.sttVerboseWords');
assert.strictEqual(apiDocs.asrSrtCodeExamples?.python, docExamples.sttSrt, 'asrSrtCodeExamples.python must use docExamples.sttSrt');
assert.strictEqual(apiDocs.retryWithBackoffExample?.python, docExamples.errorsRetry, 'retryWithBackoffExample.python must use docExamples.errorsRetry');

console.log('✓ Model IDs correctly set (v1/v2 ASR models, konusmatik-tts)');

// 3. Presence checks
// 3a. Native endpoint section exists
assert.ok(
  apiDocs.nativeRealtimeSpecs || apiDocs.nativeRealtimeEventTable || apiDocs.realtimeComparisonTable,
  'Native realtime documentation structures must exist in apiDocsV2.js'
);

const apiDocsSource = readFileSync(resolve(__dirname, '../src/pages/ApiDocs.jsx'), 'utf8');
assert.ok(
  apiDocsSource.includes('/realtime/transcriptions'),
  'ApiDocs.jsx must reference the native realtime endpoint /realtime/transcriptions'
);
assert.ok(
  apiDocsSource.includes('session.start'),
  'ApiDocs.jsx must describe session.start for native realtime'
);

// 3b. TTS format list exists (wav, mp3, opus, aac, flac, pcm) and note that wav is default
const allDocsText = JSON.stringify(apiDocs) + apiDocsSource;
assert.ok(allDocsText.includes('audio/wav') && allDocsText.includes('audio/mpeg'), 'TTS formats and MIME types must be documented');
assert.ok(allDocsText.includes('opus') && allDocsText.includes('flac') && allDocsText.includes('aac'), 'TTS formats opus, flac, aac must be documented');
assert.ok(allDocsText.includes('X-Audio-Sample-Rate'), 'X-Audio-Sample-Rate header must be documented');

// 3c. 413 file_too_large and Retry-After notes exist
assert.ok(allDocsText.includes('413') && allDocsText.includes('file_too_large'), '413 file_too_large must be documented');
assert.ok(allDocsText.includes('Retry-After'), 'Retry-After notes must exist');

console.log('✓ Presence checks passed (native endpoint, TTS formats, 413, Retry-After)');

// 4. Server VAD ranges check (silence_duration_ms 200–3000, prefix_padding_ms 0–1000, threshold accepted but not applied)
assert.ok(allDocsText.includes('200–3000') || allDocsText.includes('200-3000'), 'silence_duration_ms range 200–3000 must be documented');
assert.ok(allDocsText.includes('0–1000') || allDocsText.includes('0-1000'), 'prefix_padding_ms range 0–1000 must be documented');
assert.ok(
  (allDocsText.includes('kabul edilir ancak uygulanmaz') || allDocsText.includes('kabul edilir uygulanmaz') || allDocsText.includes('kabul edilir, uygulanmaz')) &&
  allDocsText.includes('accepted but not applied'),
  'threshold accepted but not applied must be documented in TR and EN'
);
console.log('✓ Server VAD parameter ranges documented');

// 5. Realtime events check (transcription_session.update, input_audio_buffer.committed, input_audio_buffer.cleared)
const eventNames = (apiDocs.realtimeEventTable || []).map((e) => e.event).join(' ');
assert.ok(eventNames.includes('transcription_session.update'), 'transcription_session.update must be documented in realtimeEventTable');
assert.ok(eventNames.includes('input_audio_buffer.committed'), 'input_audio_buffer.committed must be documented in realtimeEventTable');
assert.ok(eventNames.includes('input_audio_buffer.cleared'), 'input_audio_buffer.cleared must be documented in realtimeEventTable');
console.log('✓ Realtime events (transcription_session.update, committed, cleared) present');

// 6. Realtime error event shape and examples
assert.ok(
  allDocsText.includes('{"type":"error","error":{"type","code","message","param"}}') ||
  allDocsText.includes('{"type": "error", "error": {"type", "code", "message", "param"}}'),
  'Error event shape {"type":"error","error":{"type","code","message","param"}} must be documented'
);
const requiredErrorExamples = [
  'invalid_value',
  'invalid_base64',
  'input_audio_buffer_commit_empty',
  'model_mismatch',
  'realtime_engine_unsupported',
  'quota_exceeded',
  'idle_timeout',
];
for (const errCode of requiredErrorExamples) {
  assert.ok(allDocsText.includes(errCode), `Error example ${errCode} must be documented`);
}
assert.ok(
  allDocsText.includes('exact field path') || allDocsText.includes('param = tam alan yolu') || allDocsText.includes('exact field'),
  'invalid_value param description must indicate exact field path'
);
console.log('✓ Realtime error event shape and code examples documented');

// 7. turn_detection: null client-controlled ending details
assert.ok(allDocsText.includes('turn_detection: null') || allDocsText.includes('"turn_detection": null'), 'turn_detection: null must be documented');
assert.ok(allDocsText.includes('speech_started') && allDocsText.includes('speech_stopped'), 'speech_started/stopped omission must be documented');
assert.ok(
  allDocsText.includes('all audio goes to the engine') || allDocsText.includes('tüm ses motora'),
  'Prose stating all audio goes to the engine must exist'
);
assert.ok(
  allDocsText.includes('server never ends a turn by itself') || allDocsText.includes('sunucu söz sırasını kendiliğinden bitirmez'),
  'Prose stating server never ends a turn by itself must exist'
);
assert.ok(
  allDocsText.includes('connection stays open') || allDocsText.includes('bağlantı açık kalır'),
  'Prose stating connection stays open after commit must exist'
);
assert.ok(
  allDocsText.includes('next audio is a new item') || allDocsText.includes('sonraki ses yeni bir öğe') || allDocsText.includes('sonraki ses yeni bir'),
  'Prose stating next audio is a new item must exist'
);
assert.ok(
  allDocsText.includes('input_audio_buffer_commit_empty'),
  'input_audio_buffer_commit_empty on empty buffer commit must be documented'
);
console.log('✓ turn_detection: null prose details documented');

// 8. Service-wide concurrency limit for konusmatik-asr-v2 (no "hesap başına" / "per account")
assert.ok(
  allDocsText.includes('at most 3 concurrent sessions (service-wide)') &&
  allDocsText.includes('en fazla 3 eşzamanlı oturum (servis genelinde)'),
  'Concurrency limit must state "at most 3 concurrent sessions (service-wide)" / "en fazla 3 eşzamanlı oturum (servis genelinde)"'
);
assert.ok(
  !apiDocsSource.includes('hesap başına en fazla 3'),
  'ApiDocs.jsx must not say "hesap başına en fazla 3"'
);
assert.ok(
  !JSON.stringify(apiDocs.nativeRealtimeSpecs).includes('hesap başına'),
  'nativeRealtimeSpecs must not say "hesap başına"'
);
console.log('✓ Service-wide concurrency limit documented without per-account phrasing');

// 9. Plain string ASR_V1_ID in docExamples.js
const docExamplesSource = readFileSync(resolve(__dirname, '../src/data/docExamples.js'), 'utf8');
assert.strictEqual(docExamples.ASR_V1_ID, 'konusmatik-asr-v1', 'ASR_V1_ID must be konusmatik-asr-v1');
assert.ok(!docExamplesSource.includes('.join('), 'docExamples.js should use plain string for ASR_V1_ID instead of .join()');
console.log('✓ docExamples.js uses plain string for ASR_V1_ID');

// 10. upstream_unavailable connection column
const upstreamRow = apiDocs.realtimeErrorCodesTable?.find((r) => r.code === 'upstream_unavailable');
assert.ok(upstreamRow, 'upstream_unavailable row must exist in realtimeErrorCodesTable');
assert.strictEqual(
  upstreamRow.connEn,
  'closed (1011) / open (OpenAI-compatible, null mode)',
  'upstream_unavailable connEn must be "closed (1011) / open (OpenAI-compatible, null mode)"'
);
console.log('✓ upstream_unavailable connection column correctly documented');

console.log('All API docs content tests passed successfully!');
