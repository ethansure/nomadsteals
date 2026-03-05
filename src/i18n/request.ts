import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { defaultLocale, isValidLocale, LOCALE_COOKIE, type Locale } from './config';

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  
  let locale: Locale = defaultLocale;
  
  if (localeCookie && isValidLocale(localeCookie)) {
    locale = localeCookie;
  } else {
    // Try to detect from Accept-Language header
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    
    if (acceptLanguage) {
      // Parse Accept-Language header
      const languages = acceptLanguage
        .split(',')
        .map(lang => {
          const [code, qValue] = lang.trim().split(';q=');
          return {
            code: code.trim(),
            q: qValue ? parseFloat(qValue) : 1,
          };
        })
        .sort((a, b) => b.q - a.q);
      
      // Try to match a supported locale
      for (const { code } of languages) {
        // Try exact match first
        if (isValidLocale(code)) {
          locale = code;
          break;
        }
        
        // Try base language match (e.g., 'zh' -> 'zh-CN')
        const baseLang = code.split('-')[0];
        if (baseLang === 'zh') {
          // Default to Simplified Chinese for generic 'zh'
          locale = 'zh-CN';
          break;
        }
        if (isValidLocale(baseLang)) {
          locale = baseLang as Locale;
          break;
        }
      }
    }
  }
  
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
