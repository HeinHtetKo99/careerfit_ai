import { resolveCvSummary } from './summary';

export function hasContentBlock(block) {
  if (!block || typeof block !== 'object') return false;
  return Boolean(
    block.feedback ||
      block.improvements?.length > 0 ||
      block.roadmap?.phases?.length > 0 ||
      block.education ||
      block.summary
  );
}

export function secondaryLocaleFor(analyzeLanguage) {
  return analyzeLanguage === 'my' ? 'en' : 'my';
}

export function isSecondaryContentReady(match) {
  const analyzeLanguage = match?.language === 'my' ? 'my' : 'en';
  const secondary = secondaryLocaleFor(analyzeLanguage);
  return hasContentBlock(match?.content_i18n?.[secondary]);
}

function isInvalidEducation(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return true;
  if (trimmed.length < 8) return true;
  if (/^mar(?:ch)?$/i.test(trimmed)) return true;
  if (
    /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(
      trimmed
    ) &&
    trimmed.length < 20
  ) {
    return true;
  }
  return false;
}

export function resolveCvEducation(match, contentEducation = '') {
  const profileEducation = match?.resume_profile?.parsed_experience?.education?.trim() || '';
  const localizedEducation = typeof contentEducation === 'string' ? contentEducation.trim() : '';

  if (profileEducation && !isInvalidEducation(profileEducation)) return profileEducation;
  if (localizedEducation && !isInvalidEducation(localizedEducation)) return localizedEducation;
  return profileEducation || localizedEducation || '';
}

export function resolveMatchContent(match, locale) {
  const lang = locale === 'my' ? 'my' : 'en';
  const i18n = match?.content_i18n?.[lang];
  const legacyExp = match?.resume_profile?.parsed_experience ?? {};

  if (i18n) {
    const hasContent =
      i18n.feedback ||
      i18n.improvements?.length > 0 ||
      i18n.roadmap?.phases?.length > 0 ||
      i18n.education ||
      i18n.summary;

    if (hasContent) {
      return {
        education: resolveCvEducation(match, i18n.education),
        summary: resolveCvSummary(match, locale, i18n.summary),
        improvements: i18n.improvements ?? [],
        feedback: i18n.feedback ?? '',
        roadmap: i18n.roadmap ?? { goal: '', phases: [] },
      };
    }
  }

  return {
    education: resolveCvEducation(match, legacyExp.education),
    summary: resolveCvSummary(match, locale, legacyExp.summary),
    improvements: match?.improvements ?? [],
    feedback: match?.ai_feedback ?? '',
    roadmap: match?.roadmap ?? { goal: '', phases: [] },
  };
}
