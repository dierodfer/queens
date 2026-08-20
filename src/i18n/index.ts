import { MESSAGES } from './messages';
import type { Lang, LocaleDict } from '../types/i18n';

export type { BlindLevel, GameMode, Lang } from '../types/i18n';

/** Flattens the catalogue into the `key -> text` dictionary one language needs. */
function localeFor(lang: Lang): LocaleDict {
  return Object.fromEntries(
    Object.entries(MESSAGES).map(([key, translations]) => [key, translations[lang]]),
  );
}

export const I18N: Record<Lang, LocaleDict> = {
  en: localeFor('en'),
  es: localeFor('es'),
};
