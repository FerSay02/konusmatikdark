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
