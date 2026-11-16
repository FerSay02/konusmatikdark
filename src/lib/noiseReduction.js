export function isNoiseReductionAvailable(capabilities) {
  return Boolean(
    capabilities?.features?.noise_reduction === true &&
      capabilities?.noise_reduction?.consent_version
  );
}

export function noiseReductionBlockedReason(capabilities, durationSeconds) {
  if (typeof durationSeconds !== 'number' || !Number.isFinite(durationSeconds)) {
    return null;
  }
  const max = capabilities?.noise_reduction?.max_duration_seconds;
  if (typeof max === 'number' && Number.isFinite(max) && durationSeconds > max) {
    return 'duration';
  }
  return null;
}

export function appendNoiseReductionFields(formData, enabled) {
  if (enabled === true && formData && typeof formData.append === 'function') {
    formData.append('noise_reduction', 'true');
    formData.append('noise_reduction_consent', 'true');
  }
}

export function shouldFallbackToSync(error, noiseReductionEnabled) {
  return Boolean(error?.status === 503 && !noiseReductionEnabled);
}

export function noiseReductionView(result) {
  const status = result?.noise_reduction?.status;
  if (status === 'applied' || status === 'failed') {
    return status;
  }
  return 'none';
}

export function consentText(capabilities, isEnglish) {
  if (isEnglish) {
    return capabilities?.noise_reduction?.consent_text_en || '';
  }
  return capabilities?.noise_reduction?.consent_text_tr || '';
}

export function pickPlaybackSource({ variant, localObjectUrl, mediaUrls } = {}) {
  if (variant === 'original') {
    return localObjectUrl || mediaUrls?.original || null;
  }
  if (variant === 'denoised') {
    return mediaUrls?.denoised || null;
  }
  return null;
}

export function mediaErrorKind(httpStatus) {
  if (httpStatus === 410) {
    return 'expired';
  }
  if (httpStatus === 404) {
    return 'missing';
  }
  return 'other';
}

export function noiseReductionDbLabel(result, isEnglish) {
  const db =
    typeof result?.noise_reduction?.noise_reduction_db === 'number'
      ? result.noise_reduction.noise_reduction_db
      : typeof result?.noise_reduction_db === 'number'
        ? result.noise_reduction_db
        : null;

  if (db === null || !Number.isFinite(db)) {
    return '';
  }

  const x = Math.round(db * 10) / 10;
  return isEnglish ? `Noise reduced by ${x} dB` : `Gürültü ${x} dB azaltıldı`;
}

export function initialPlaybackVariant(view) {
  return view === 'applied' ? 'denoised' : 'original';
}

export function variantAfterMediaError(variant, kind, options = {}) {
  const otherFailed = typeof options === 'boolean' ? options : Boolean(options?.otherFailed);
  if (kind === 'expired') {
    return { variant, showSwitch: false, expired: true };
  }
  if (otherFailed) {
    return { variant: null, showSwitch: false, expired: false, unplayable: true };
  }
  if (variant === 'denoised') {
    return { variant: 'original', showSwitch: false, expired: false };
  }
  return { variant: 'denoised', showSwitch: false, expired: false };
}

export function shouldFetchMedia({ view, variant, hasLocalBlob } = {}) {
  if (view !== 'applied') {
    return false;
  }
  if (variant === 'denoised') {
    return true;
  }
  if (variant === 'original') {
    return !hasLocalBlob;
  }
  return false;
}

export function shouldRefetchResultOnReopen(prefill) {
  return Boolean(prefill?.jobId && !('noise_reduction' in (prefill || {})));
}

export function shouldApplyPrefillResult(prefill) {
  return noiseReductionView(prefill) === 'applied';
}

export function isMediaUnplayable({
  hasLocalBlob = false,
  denoisedUrl = null,
  denoisedFailed = false,
  originalFailed = false,
} = {}) {
  const canPlayOriginal = Boolean(hasLocalBlob) || !originalFailed;
  const canPlayDenoised = Boolean(denoisedUrl) && !denoisedFailed;
  return !canPlayOriginal && !canPlayDenoised;
}
