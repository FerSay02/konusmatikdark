export function googleErrorMessage(code, language = 'tr', linking = false) {
  const en = language === 'en';
  const messages = {
    401: linking
      ? ['Şifre veya doğrulama geçersiz. Lütfen tekrar deneyin.', 'Password or verification is invalid. Please retry.']
      : ['Google doğrulaması geçersiz veya süresi dolmuş. Lütfen tekrar deneyin.', 'Google verification is invalid or expired. Please retry.'],
    403: ['Güvenlik kontrolü başarısız oldu. Sayfayı yenileyip tekrar deneyin.', 'Security check failed. Refresh the page and try again.'],
    409: linking
      ? ['Bu Google hesabı bağlanamıyor.', 'This Google account cannot be linked.']
      : ['Mevcut hesabınızla giriş yapıp Google hesabınızı profilinizden bağlayabilirsiniz.', 'Sign in with your existing account and link Google from your profile.'],
    429: ['Çok fazla deneme yapıldı. Lütfen biraz bekleyip tekrar deneyin.', 'Too many attempts. Wait a moment and try again.'],
    503: ['Google ile giriş şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.', 'Google sign-in is currently unavailable. Try again later.'],
    CANCELLED: ['Google ile giriş işlemi iptal edildi. Tekrar deneyebilirsiniz.', 'Google sign-in was cancelled. You can try again.'],
    EXPIRED: ['Doğrulama süresi doldu. Lütfen tekrar deneyin.', 'Verification expired. Please try again.'],
    FLOW_BUSY: ['Devam eden başka bir Google işlemi bulunuyor.', 'Another Google operation is in progress.'],
    LOCK_UNAVAILABLE: ['Tarayıcınız güvenli Google girişini desteklemiyor.', 'This browser does not support secure Google sign-in.'],
    SDK_UNAVAILABLE: ['Google hizmetine bağlanılamadı. Reklam engelleyicinizi kontrol edin veya sayfayı yenileyin.', 'Could not connect to Google services. Please check your ad blocker or refresh the page.'],
  };
  const pair = messages[code] || ['Google ile giriş tamamlanamadı. Bağlantınızı kontrol edip tekrar deneyin.', 'Google sign-in could not be completed. Check your connection and try again.'];
  return pair[en ? 1 : 0];
}
