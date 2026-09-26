import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import Translator from 'flarum/common/Translator';
import yaml from 'js-yaml';

export function loadTranslations(locale: string): Record<string, string> {
  const catalogue = yaml.load(
    readFileSync(fileURLToPath(new URL(`../../locale/${locale}.yml`, import.meta.url)), 'utf8')
  );
  const translations: Record<string, string> = {};

  function flatten(value: unknown, prefix = '') {
    if (typeof value === 'string') {
      translations[prefix] = value;
    } else if (value && typeof value === 'object') {
      Object.entries(value).forEach(([key, child]) => flatten(child, prefix ? `${prefix}.${key}` : key));
    } else {
      throw new Error(`Invalid translation: ${prefix}`);
    }
  }

  flatten(catalogue);
  return translations;
}

export function useLocale(translator: Translator, locale: string) {
  translator.setLocale(locale);
  translator.addTranslations(loadTranslations(locale));
}
