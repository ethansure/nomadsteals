// i18n configuration

export const locales = ['en', 'zh-CN', 'zh-TW', 'es', 'ja', 'ko'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'es': 'Español',
  'ja': '日本語',
  'ko': '한국어',
};

export const localeFlags: Record<Locale, string> = {
  'en': '🇺🇸',
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  'es': '🇪🇸',
  'ja': '🇯🇵',
  'ko': '🇰🇷',
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Cookie name for storing locale preference
export const LOCALE_COOKIE = 'NEXT_LOCALE';
