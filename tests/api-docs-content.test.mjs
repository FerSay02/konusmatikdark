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
  nativeRealtime: 'native_realtime.py',
  realtimeClientCommit: 'realtime_client_commit.py',
  realtimeServerVad: 'realtime_server_vad.py',
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

for (const [lang, code] of Object.entries(apiDocs.realtimeClientCommitExamples || {})) {
  assert.ok(
    !code.includes('konusmatik-asr-v2'),
    `realtimeClientCommitExamples.${lang} must not contain konusmatik-asr-v2`
  );
  assert.ok(
    code.includes('konusmatik-asr-v1'),
    `realtimeClientCommitExamples.${lang} must contain konusmatik-asr-v1`
  );
}

assert.ok(
  apiDocs.nativeRealtimeCodeExamples?.python?.includes('konusmatik-asr-v2'),
  'nativeRealtimeCodeExamples.python must contain konusmatik-asr-v2'
);

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
assert.strictEqual(apiDocs.realtimeCodeExamples?.python, docExamples.realtimeServerVad, 'realtimeCodeExamples.python must use docExamples.realtimeServerVad');
assert.ok(apiDocs.realtimeClientCommitExamples, 'realtimeClientCommitExamples must be exported');
assert.strictEqual(apiDocs.realtimeClientCommitExamples?.python, docExamples.realtimeClientCommit, 'realtimeClientCommitExamples.python must use docExamples.realtimeClientCommit');
assert.ok(apiDocs.nativeRealtimeCodeExamples, 'nativeRealtimeCodeExamples must be exported');
assert.strictEqual(apiDocs.nativeRealtimeCodeExamples?.python, docExamples.nativeRealtime, 'nativeRealtimeCodeExamples.python must use docExamples.nativeRealtime');

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
assert.ok(
  apiDocsSource.includes('realtimeClientCommitExamples'),
  'ApiDocs.jsx must use realtimeClientCommitExamples'
);
assert.ok(
  apiDocsSource.includes('nativeRealtimeCodeExamples'),
  'ApiDocs.jsx must use nativeRealtimeCodeExamples'
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
if (apiDocs.nativeRealtimeSpecs) {
  assert.ok(
    !JSON.stringify(apiDocs.nativeRealtimeSpecs).includes('hesap başına'),
    'nativeRealtimeSpecs must not say "hesap başına"'
  );
}
console.log('✓ Service-wide concurrency limit documented without per-account phrasing');

// 9. Plain string ASR_V1_ID in docExamples.js
const docExamplesSource = readFileSync(resolve(__dirname, '../src/data/docExamples.js'), 'utf8');
assert.strictEqual(docExamples.ASR_V1_ID, 'konusmatik-asr-v1', 'ASR_V1_ID must be konusmatik-asr-v1');
const asrV1Decl = docExamplesSource.match(/export const ASR_V1_ID\s*=[^;\n]+/)?.[0] || '';
assert.ok(!asrV1Decl.includes('.join('), 'docExamples.js should use plain string for ASR_V1_ID instead of .join()');
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

// 11. Guides section and guide anchors
assert.ok(
  apiDocsSource.includes('id="guides"') || apiDocsSource.includes("id='guides'"),
  'Guides section with id="guides" must exist'
);
assert.ok(
  apiDocsSource.includes('id="guide-audio-formats"') || apiDocsSource.includes("id='guide-audio-formats'"),
  'Guide anchor guide-audio-formats must exist'
);
assert.ok(
  apiDocsSource.includes('id="guide-long-files"') || apiDocsSource.includes("id='guide-long-files'"),
  'Guide anchor guide-long-files must exist'
);
assert.ok(
  apiDocsSource.includes('id="guide-realtime-turns"') || apiDocsSource.includes("id='guide-realtime-turns'"),
  'Guide anchor guide-realtime-turns must exist'
);

// realtime-errors inside errors section
const errorsSectionMatch = apiDocsSource.match(/<section[^>]*id=["']errors["'][\s\S]*?<\/section>/);
assert.ok(errorsSectionMatch, 'Section with id="errors" must exist');
assert.ok(
  errorsSectionMatch[0].includes('realtime-errors'),
  'realtime-errors anchor must exist inside the errors section'
);
console.log('✓ Guides section, anchors and realtime-errors documented');

// 12. /realtime reference appears only once as an EndpointHeader with path "/realtime"
const endpointHeaderMatches = apiDocsSource.match(/<EndpointHeader[\s\S]*?\/>/g) || [];
const realtimeEndpointHeaders = endpointHeaderMatches.filter((tag) => /path=["']\/realtime["']/.test(tag));
assert.strictEqual(
  realtimeEndpointHeaders.length,
  1,
  `EndpointHeader with path="/realtime" must appear exactly once (found ${realtimeEndpointHeaders.length})`
);
console.log('✓ /realtime appears only once as an EndpointHeader');

// 13. Nav label for realtime-api no longer contains Asenkron / Async
const navGroupSource = apiDocsSource.match(/navGroups\s*=\s*\[[\s\S]*?\];/)?.[0] || '';
assert.ok(navGroupSource, 'navGroups array must be found in ApiDocs.jsx');
const realtimeApiNavEntry = navGroupSource.match(/\['realtime-api'[^\]]*\]/)?.[0] || '';
assert.ok(realtimeApiNavEntry, 'nav item for realtime-api must exist');
assert.ok(
  !realtimeApiNavEntry.includes('Asenkron') && !realtimeApiNavEntry.includes('Async'),
  'realtime-api nav label must not contain "Asenkron" or "Async"'
);

// Also guides in nav
assert.ok(
  navGroupSource.includes("'guides'") || navGroupSource.includes('"guides"'),
  'guides must be added to navigation'
);
console.log('✓ Navigation labels updated correctly');

// 14. No EndpointHeader description longer than 160 characters (TR and EN)
for (const headerTag of endpointHeaderMatches) {
  const descAttr = headerTag.match(/description=\{t\(\s*('(?:\\.|[^'])*?'|"(?:\\.|[^"])*?")\s*,\s*('(?:\\.|[^'])*?'|"(?:\\.|[^"])*?")\s*\)\}/);
  if (descAttr) {
    const trStr = (0, eval)(descAttr[1]);
    const enStr = (0, eval)(descAttr[2]);
    assert.ok(
      trStr.length <= 160,
      `EndpointHeader TR description exceeds 160 characters (${trStr.length}): "${trStr}"`
    );
    assert.ok(
      enStr.length <= 160,
      `EndpointHeader EN description exceeds 160 characters (${enStr.length}): "${enStr}"`
    );
  } else {
    const plainDesc = headerTag.match(/description=(?:\{["'](.*?)["']\}|["'](.*?)["'])/);
    if (plainDesc) {
      const descVal = plainDesc[1] || plainDesc[2] || '';
      assert.ok(
        descVal.length <= 160,
        `EndpointHeader description exceeds 160 characters (${descVal.length}): "${descVal}"`
      );
    }
  }
}
console.log('✓ EndpointHeader descriptions are all <= 160 characters');

// 15. DocCallout used at most once per endpoint block
assert.ok(apiDocsSource.includes('DocCallout'), 'DocCallout component must be used');
const endpointIds = [
  'tts-api',
  'streaming-tts',
  'asr-api',
  'openai-realtime',
  'models',
  'corporate-asr',
  'corporate-webhooks',
  'corporate-tts',
  'realtime-api',
];
for (const epId of endpointIds) {
  const epRegex = new RegExp(`id=["']${epId}["'][\\s\\S]*?(?=(?:id=["'](?:${endpointIds.join('|')}|guides|capacity|errors)["'])|<\\/main>)`);
  const epBlock = apiDocsSource.match(epRegex)?.[0] || '';
  const calloutCount = (epBlock.match(/<DocCallout/g) || []).length;
  assert.ok(
    calloutCount <= 1,
    `Endpoint block "${epId}" has more than 1 DocCallout (${calloutCount})`
  );
}
console.log('✓ DocCallout used at most once per endpoint block');

// 16. Round 2: #openai-realtime block renders realtimeCodeExamples & realtimeClientCommitExamples, not openAiRealtimeCodeExamples
const openAiRealtimeBlock = apiDocsSource.match(/id=["']openai-realtime["'][\s\S]*?(?=(?:id=["'](?:models|corporate-api|guides|capacity|errors)["'])|<\/main>)/)?.[0] || '';
assert.ok(
  openAiRealtimeBlock.includes('examples={realtimeCodeExamples}'),
  '#openai-realtime block must render realtimeCodeExamples'
);
assert.ok(
  openAiRealtimeBlock.includes('examples={realtimeClientCommitExamples}'),
  '#openai-realtime block must render realtimeClientCommitExamples'
);
assert.ok(
  !openAiRealtimeBlock.includes('openAiRealtimeCodeExamples'),
  '#openai-realtime block must not render openAiRealtimeCodeExamples'
);
console.log('✓ #openai-realtime renders realtimeCodeExamples and realtimeClientCommitExamples');

// 17. Round 2: Voices reference is inside #tts-api and not in #guide-audio-formats
const ttsApiBlock = apiDocsSource.match(/id=["']tts-api["'][\s\S]*?(?=(?:id=["'](?:streaming-tts|asr-api|guides)["'])|<\/main>)/)?.[0] || '';
const guideAudioFormatsBlock = apiDocsSource.match(/id=["']guide-audio-formats["'][\s\S]*?(?=(?:id=["'](?:guide-long-files|guide-realtime-turns)["'])|<\/section>)/)?.[0] || '';
assert.ok(
  ttsApiBlock.includes('ttsVoicesData'),
  '#tts-api block must render ttsVoicesData'
);
assert.ok(
  !guideAudioFormatsBlock.includes('ttsVoicesData'),
  '#guide-audio-formats must not contain ttsVoicesData'
);
console.log('✓ TTS voice cards moved back to #tts-api');

// 18. Round 2: guide-audio-formats lists all format -> MIME type mappings
assert.ok(guideAudioFormatsBlock.includes('audio/wav'), 'guide-audio-formats must list audio/wav');
assert.ok(guideAudioFormatsBlock.includes('audio/mpeg'), 'guide-audio-formats must list audio/mpeg');
assert.ok(guideAudioFormatsBlock.includes('audio/ogg'), 'guide-audio-formats must list audio/ogg');
assert.ok(guideAudioFormatsBlock.includes('audio/aac'), 'guide-audio-formats must list audio/aac');
assert.ok(guideAudioFormatsBlock.includes('audio/flac'), 'guide-audio-formats must list audio/flac');
assert.ok(guideAudioFormatsBlock.includes('audio/pcm'), 'guide-audio-formats must list audio/pcm');
console.log('✓ guide-audio-formats lists all format MIME types');

// 19. Round 2: GET /corporate/asr/jobs/{id}/download mentions url and expires_in_seconds
const downloadEndpointMatch = apiDocsSource.match(/<EndpointHeader[^>]*path=["']\/corporate\/asr\/jobs\/\{id\}\/download["'][^>]*\/>/)?.[0] || '';
assert.ok(
  downloadEndpointMatch.includes('expires_in_seconds') && downloadEndpointMatch.includes('url'),
  'GET /corporate/asr/jobs/{id}/download EndpointHeader must mention url and expires_in_seconds'
);
console.log('✓ /corporate/asr/jobs/{id}/download specifies url and expires_in_seconds');

// 20. Round 2: No free-standing <p> prose inside endpoint card blocks
const standardEndpointIds = [
  'tts-api',
  'streaming-tts',
  'asr-api',
  'openai-realtime',
  'corporate-asr',
  'corporate-tts',
  'realtime-api',
];
for (const epId of standardEndpointIds) {
  const epRegex = new RegExp(`id=["']${epId}["'][\\s\\S]*?(?=(?:id=["'](?:${endpointIds.join('|')}|guides|capacity|errors)["'])|<\\/main>)`);
  const epBlock = apiDocsSource.match(epRegex)?.[0] || '';
  const cardMatch = epBlock.match(/<div className="api-endpoint-card">([\s\S]*?)<\/div>\s*<\/(?:div|section)>/);
  assert.ok(cardMatch, `Card match for ${epId} must exist`);
  const cardBody = cardMatch[1];
  assert.ok(
    !/<p[\s>]/.test(cardBody),
    `Endpoint block "${epId}" must not contain <p> tags inside api-endpoint-card`
  );
}
console.log('✓ No free-standing <p> prose directly inside endpoint blocks');

// 21. Round 2: Native realtime connection / session sequence stated compactly
assert.ok(
  apiDocsSource.includes('session.start') &&
  apiDocsSource.includes('session.ready') &&
  apiDocsSource.includes('session.stop') &&
  apiDocsSource.includes('transcript.final') &&
  apiDocsSource.includes('session.stats') &&
  apiDocsSource.includes('session.closed'),
  'Native realtime session lifecycle must be documented'
);
console.log('✓ Native realtime session lifecycle sequence documented');

// 22. Round 2: No mixed language in TR cells
const thresholdParam = apiDocs.openAiRealtimeParameters?.find((p) => p.name === 'turn_detection.threshold');
assert.ok(thresholdParam, 'turn_detection.threshold parameter must exist');
assert.ok(
  !thresholdParam.desc.includes('(accepted but not applied)'),
  'turn_detection.threshold TR desc must not contain English text "(accepted but not applied)"'
);
assert.strictEqual(
  thresholdParam.descEn,
  'accepted but not applied.',
  'turn_detection.threshold descEn must be English'
);
console.log('✓ No mixed language in TR cells');

// 23. Round 2: Unused exports removed
assert.strictEqual(
  apiDocs.openAiRealtimeCodeExamples,
  undefined,
  'openAiRealtimeCodeExamples export should be removed'
);
assert.strictEqual(
  apiDocs.nativeRealtimeSpecs,
  undefined,
  'nativeRealtimeSpecs export should be removed'
);
assert.strictEqual(
  apiDocs.realtimeAudioSpec,
  undefined,
  'realtimeAudioSpec export should be removed'
);
console.log('✓ Unused exports removed');

// 24. Round 3: Format descriptions for batch formats (opus, aac, flac) must not imply streaming or latency
const batchFormats = ['opus', 'aac', 'flac'];
const forbiddenTerms = ['akış', 'stream', 'gecikme', 'latency'];

// 24a. src/data/apiDocsV2.js (ttsSupportedFormatsTable)
for (const fmt of batchFormats) {
  const row = apiDocs.ttsSupportedFormatsTable?.find((r) => r.format === fmt);
  assert.ok(row, `ttsSupportedFormatsTable must contain ${fmt}`);
  const combinedDataDesc = `${row.desc} ${row.descEn}`.toLowerCase();
  for (const term of forbiddenTerms) {
    assert.ok(
      !combinedDataDesc.includes(term.toLowerCase()),
      `ttsSupportedFormatsTable description for ${fmt} must not contain "${term}" (found: "${row.desc}" / "${row.descEn}")`
    );
  }
}

// 24b. src/pages/ApiDocs.jsx (guide-audio-formats table)
for (const fmt of batchFormats) {
  const rowRegex = new RegExp(`<tr><td><code>${fmt}</code></td><td><code>[^<]+</code></td><td>([\\s\\S]*?)</td></tr>`);
  const match = guideAudioFormatsBlock.match(rowRegex);
  assert.ok(match, `guide-audio-formats table must have a row for ${fmt}`);
  const tableRowText = match[1].toLowerCase();
  for (const term of forbiddenTerms) {
    assert.ok(
      !tableRowText.includes(term.toLowerCase()),
      `guide-audio-formats table description for ${fmt} must not contain "${term}" (found: "${match[1]}")`
    );
  }
}

// 24c. Check exact wording
const opusRow = apiDocs.ttsSupportedFormatsTable?.find((r) => r.format === 'opus');
assert.strictEqual(opusRow?.desc, 'Opus codec, Ogg kapsayıcısında', 'opus TR desc must match');
assert.strictEqual(opusRow?.descEn, 'Opus codec in an Ogg container', 'opus EN desc must match');

const aacRow = apiDocs.ttsSupportedFormatsTable?.find((r) => r.format === 'aac');
assert.strictEqual(aacRow?.desc, 'AAC (Advanced Audio Coding)', 'aac TR desc must match');
assert.strictEqual(aacRow?.descEn, 'AAC (Advanced Audio Coding)', 'aac EN desc must match');

const flacRow = apiDocs.ttsSupportedFormatsTable?.find((r) => r.format === 'flac');
assert.strictEqual(flacRow?.desc, 'Kayıpsız sıkıştırılmış ses', 'flac TR desc must match');
assert.strictEqual(flacRow?.descEn, 'Lossless compressed audio', 'flac EN desc must match');

console.log('✓ Batch audio formats (opus, aac, flac) descriptions contain no streaming/latency wording');

console.log('All API docs content tests passed successfully!');
