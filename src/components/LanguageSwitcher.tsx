"use client";

import { useState, useRef, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { locales, localeNames, localeFlags, LOCALE_COOKIE, type Locale } from '@/i18n/config';
import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('language');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    // Set cookie for locale preference
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
    setIsOpen(false);
    // Refresh the page to apply new locale
    router.refresh();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
        aria-label={t('select')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-base">{localeFlags[locale]}</span>
        <span className="hidden sm:inline">{localeNames[locale]}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50"
          role="listbox"
          aria-label={t('select')}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => handleLocaleChange(loc)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                loc === locale 
                  ? 'bg-blue-50 text-blue-700 font-medium' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              role="option"
              aria-selected={loc === locale}
            >
              <span className="text-lg">{localeFlags[loc]}</span>
              <span>{localeNames[loc]}</span>
              {loc === locale && (
                <svg className="w-4 h-4 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact version for mobile or footer
export function LanguageSwitcherCompact() {
  const locale = useLocale() as Locale;
  const router = useRouter();

  const handleLocaleChange = (newLocale: string) => {
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  };

  return (
    <select
      value={locale}
      onChange={(e) => handleLocaleChange(e.target.value)}
      className="px-3 py-2 text-sm bg-gray-800 text-gray-200 border border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Select language"
    >
      {locales.map((loc) => (
        <option key={loc} value={loc}>
          {localeFlags[loc]} {localeNames[loc]}
        </option>
      ))}
    </select>
  );
}
