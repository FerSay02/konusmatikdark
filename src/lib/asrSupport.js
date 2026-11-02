// Pure ASR helpers shared by the ASR screens (kept free of React so they can be tested with plain node).

// Canonical public model id of the backend model registry (backend: app/core/asr_models.py).
// Aliases such as "konusmatik-asr" are accepted by the API but are not used here, so first-party traffic
// does not show up as alias usage in the backend metrics.
export const ASR_MODEL_ID = 'konusmatik-asr-v2';
export const ASR_MODEL_DISPLAY_NAME = 'Konuşmatik ASR';

// The engine decodes Turkish only. This is the language of the audio, not the language of the interface.
export const ASR_LANGUAGE = 'tr';

// "Include timestamps" and "Include word timestamps" -> timestamp_granularities (word timings need segments on).
export function buildTimestampGranularities(includeTimestamps, includeWordTimestamps) {
  if (!includeTimestamps) return [];
  return includeWordTimestamps ? ['segment', 'word'] : ['segment'];
}

export function buildRealtimeStartMessage({ includeTimestamps, includeWordTimestamps }) {
  return {
    type: 'session.start',
    model: ASR_MODEL_ID,
    encoding: 'pcm_s16le',
    sample_rate: 16000,
    language: ASR_LANGUAGE,
    timestamp_granularities: buildTimestampGranularities(includeTimestamps, includeWordTimestamps),
  };
}

export function buildRealtimeUpdateMessage(includeTimestamps, includeWordTimestamps) {
  return {
    type: 'session.update',
    timestamp_granularities: buildTimestampGranularities(includeTimestamps, includeWordTimestamps),
  };
}

// HH:MM:SS.mmm (or MM:SS.mmm). Works on whole milliseconds, so nothing is truncated and 999.6 ms rolls over cleanly.
// Rounding to a millisecond happens here, for display and export only; stored values keep full precision.
export function formatTimestamp(seconds, forceHours = false) {
  if (seconds == null || Number.isNaN(Number(seconds)) || seconds < 0) return '00:00.000';
  const totalMs = Math.round(Number(seconds) * 1000);
  const hrs = Math.floor(totalMs / 3600000);
  const mins = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  const pad = (n, z = 2) => String(n).padStart(z, '0');
  if (hrs > 0 || forceHours) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
  }
  return `${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`;
}

// Segments safe to show and export: ordered, never overlapping, never past the end of the audio. The engine's
// segments of adjacent chunks can overlap by seconds, and the last segment of a short file can outlast the audio.
// A segment is cut where the next one starts; non-overlapping segments are returned unchanged. Returns copies:
// the stored/API values are never modified.
export function normalizeSegmentsForDisplay(segments, durationSeconds = null) {
  if (!Array.isArray(segments)) return [];
  const copies = segments.map((seg) => ({ ...seg }));
  for (let i = 0; i < copies.length - 1; i += 1) {
    if (copies[i].end > copies[i + 1].start) {
      copies[i].end = Math.max(copies[i].start, copies[i + 1].start);
    }
  }
  if (typeof durationSeconds === 'number' && durationSeconds > 0) {
    copies.forEach((seg) => {
      seg.end = Math.max(seg.start, Math.min(seg.end, durationSeconds));
    });
  }
  return copies;
}

function cues(segments, decimalSeparator, durationSeconds) {
  return normalizeSegmentsForDisplay(segments, durationSeconds)
    .map((seg, i) => {
      const start = formatTimestamp(seg.start, true).replace('.', decimalSeparator);
      const end = formatTimestamp(seg.end, true).replace('.', decimalSeparator);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join('\n');
}

export function buildSrt(segments, durationSeconds = null) {
  return cues(segments, ',', durationSeconds);
}

export function buildVtt(segments, durationSeconds = null) {
  return `WEBVTT

${cues(segments, '.', durationSeconds)}`;
}
