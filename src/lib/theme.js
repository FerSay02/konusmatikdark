export const THEME_STORAGE_KEY = 'konusmatik-theme';

export function getSystemTheme() {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const domTheme = document.documentElement.dataset.theme;
  if (domTheme === 'light' || domTheme === 'dark') return domTheme;
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  } catch {
    // Storage can be unavailable in privacy-restricted contexts.
  }
  return getSystemTheme();
}

export function applyTheme(theme) {
  const nextTheme = theme === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  return nextTheme;
}
