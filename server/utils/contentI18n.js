const { normalizeRoadmap } = require('./roadmap');
const { sanitizeEducation } = require('./education');
const { sanitizeSummary } = require('./summary');

const MAX_EDUCATION_LEN = 300;
const MAX_SUMMARY_LEN = 500;
const MAX_FEEDBACK_LEN = 2000;

function emptyContentBlock() {
  return {
    education: '',
    summary: '',
    improvements: [],
    feedback: '',
    roadmap: { goal: '', phases: [] },
  };
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
}

function normalizeContentBlock(block) {
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return emptyContentBlock();
  }

  return {
    education: sanitizeEducation(block.education),
    summary: sanitizeSummary(block.summary),
    improvements: normalizeStringArray(block.improvements),
    feedback:
      typeof block.feedback === 'string' ? block.feedback.trim().slice(0, MAX_FEEDBACK_LEN) : '',
    roadmap: normalizeRoadmap(block.roadmap),
  };
}

function normalizeContentI18n(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { en: emptyContentBlock(), my: emptyContentBlock() };
  }

  return {
    en: normalizeContentBlock(value.en),
    my: normalizeContentBlock(value.my),
  };
}

function hasContentBlock(block) {
  if (!block || typeof block !== 'object') return false;
  return Boolean(
    block.feedback ||
      block.improvements?.length > 0 ||
      block.roadmap?.phases?.length > 0 ||
      block.education ||
      block.summary
  );
}

function pickContentForLocale(contentI18n, locale, legacy = {}) {
  const lang = locale === 'my' ? 'my' : 'en';
  const block = normalizeContentBlock(contentI18n?.[lang]);
  const hasContent =
    block.feedback ||
    block.improvements.length > 0 ||
    block.roadmap.phases.length > 0 ||
    block.education ||
    block.summary;

  if (hasContent) return block;

  const legacyExp = legacy.parsed_experience ?? {};
  return {
    education: legacyExp.education || '',
    summary: legacyExp.summary || '',
    improvements: Array.isArray(legacy.improvements) ? legacy.improvements : [],
    feedback: typeof legacy.ai_feedback === 'string' ? legacy.ai_feedback : '',
    roadmap: normalizeRoadmap(legacy.roadmap),
  };
}

module.exports = {
  emptyContentBlock,
  hasContentBlock,
  normalizeContentBlock,
  normalizeContentI18n,
  pickContentForLocale,
};
