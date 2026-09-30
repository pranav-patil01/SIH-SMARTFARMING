/**
 * src/i18n/index.ts
 * Lightweight, fast client-side i18n hook supporting English, Hindi (हिंदी), and Marathi (मराठी).
 */

import { create } from 'zustand';
import en from './en.json';
import hi from './hi.json';
import mr from './mr.json';

export type SupportedLocale = 'en' | 'hi' | 'mr';

const translations: Record<SupportedLocale, typeof en> = {
  en,
  hi: hi as typeof en,
  mr: mr as typeof en,
};

interface I18nStore {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  cycleLocale: () => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

export const useI18n = create<I18nStore>((set, get) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),
  cycleLocale: () => {
    const order: SupportedLocale[] = ['en', 'hi', 'mr'];
    const curIdx = order.indexOf(get().locale);
    const nextLocale = order[(curIdx + 1) % order.length];
    set({ locale: nextLocale });
  },
  t: (keyPath: string, params?: Record<string, string | number>): string => {
    const locale = get().locale;
    const dict = translations[locale] || translations.en;
    const keys = keyPath.split('.');
    
    let current: any = dict;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English if missing
        let fallback: any = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return keyPath;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      });
    }

    return result;
  },
}));
