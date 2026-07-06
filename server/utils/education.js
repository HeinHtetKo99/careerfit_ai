const MONTH_PREFIX =
  /^(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i;

const EDUCATION_PATTERNS = [
  /\b(?:Bachelor(?:'s)?(?:\s+of)?|B\.?\s*Sc(?:\.|ience)?|B\.?\s*A(?:\.|rts)?|B\.?\s*E(?:\.|ng)?|B\.?\s*Tech)\b[^.!\n]{0,100}/i,
  /\b(?:Master(?:'s)?(?:\s+of)?|M\.?\s*Sc(?:\.|ience)?|M\.?\s*E(?:\.|ng)?|MBA)\b[^.!\n]{0,100}/i,
  /\bM\.?\s*A\.?\s+(?:in|of)\s+[^.!\n]{3,80}/i,
  /\b(?:Ph\.?\s*D|Doctorate|Doctor\s+of)\b[^.!\n]{0,100}/i,
  /\b(?:Associate|Diploma|High\s+School|GED|HND|Foundation)\b[^.!\n]{0,100}/i,
  /\b(?:University|College|Institute|Polytechnic)\s+of\s+[^.!\n]{3,80}/i,
  /(?:တက္ကသိုလ်|ဘွဲ့|ဒီပလိုမာ)[^\n.!]{0,80}/,
];

function isLikelyInvalidEducation(value) {
  const trimmed = typeof value === 'string' ? value.trim() : '';
  if (!trimmed) return true;
  if (trimmed.length < 8) return true;
  if (MONTH_PREFIX.test(trimmed)) return true;
  if (/^(?:b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?|ph\.?d\.?)$/i.test(trimmed)) return true;
  return false;
}

function sanitizeEducation(value) {
  const trimmed = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  if (isLikelyInvalidEducation(trimmed)) return '';
  return trimmed.slice(0, 300);
}

function extractEducationFromText(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) return '';

  for (const pattern of EDUCATION_PATTERNS) {
    const match = rawText.match(pattern);
    if (!match) continue;
    const candidate = sanitizeEducation(match[0]);
    if (candidate) return candidate;
  }

  return '';
}

module.exports = {
  extractEducationFromText,
  isLikelyInvalidEducation,
  sanitizeEducation,
};
