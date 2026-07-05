import en from './en';
import my from './my';

const translations = { en, my };

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

export function translate(locale, key, vars = {}) {
  const text =
    getNestedValue(translations[locale], key) ??
    getNestedValue(translations.en, key) ??
    key;

  return Object.entries(vars).reduce(
    (result, [name, value]) => result.replaceAll(`{{${name}}}`, String(value)),
    text
  );
}

export const supportedLocales = ['en', 'my'];
