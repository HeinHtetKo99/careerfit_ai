export function sanitizeSummary(value) {
  if (typeof value !== 'string') return '';

  let summary = value.trim().replace(/\s+/g, ' ');

  if (!summary) return '';

  summary = summary.replace(/,?\s+(?:and|or|with)\s*,?\s*$/i, '');
  summary = summary.replace(/,\s*$/g, '');
  summary = summary.replace(/\s+(?:and|or)\s*$/i, '');

  return summary.slice(0, 500);
}

export function resolveCvSummary(match, locale, i18nSummary = '') {
  const lang = locale === 'my' ? 'my' : 'en';
  const localized = sanitizeSummary(i18nSummary);
  if (localized) return localized;

  if (lang === 'en') {
    return sanitizeSummary(match?.resume_profile?.parsed_experience?.summary || '');
  }

  return '';
}
