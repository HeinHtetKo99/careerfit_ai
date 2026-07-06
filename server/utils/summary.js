const MAX_SUMMARY_LEN = 500;

function sanitizeSummary(value) {
  if (typeof value !== 'string') return '';

  let summary = value.trim().replace(/\s+/g, ' ');

  if (!summary) return '';

  summary = summary.replace(/,?\s+(?:and|or|with)\s*,?\s*$/i, '');
  summary = summary.replace(/,\s*$/g, '');
  summary = summary.replace(/\s+(?:and|or)\s*$/i, '');

  return summary.slice(0, MAX_SUMMARY_LEN);
}

function extractSummaryFromText(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) return '';

  const sectionMatch = rawText.match(
    /(?:professional\s+)?(?:summary|profile|objective)\s*[:\-]?\s*([\s\S]{20,800}?)(?:\n\s*\n|\n(?:experience|education|skills|work history|employment|projects|certifications)\b)/i
  );

  if (sectionMatch?.[1]) {
    const candidate = sanitizeSummary(sectionMatch[1].replace(/\n+/g, ' '));
    if (candidate.length >= 20) return candidate;
  }

  const lineMatch = rawText.match(
    /(?:summary|profile|objective)\s*[:\-]\s*([^\n]{20,400})/i
  );
  if (lineMatch?.[1]) {
    const candidate = sanitizeSummary(lineMatch[1]);
    if (candidate.length >= 20) return candidate;
  }

  return '';
}

function buildProfileSummary(skills = [], language = 'en') {
  const topSkills = skills.filter(Boolean).slice(0, 5);
  if (topSkills.length === 0) {
    return language === 'my'
      ? 'အတွေ့အကြုံရှိ ဆော့ဖ်ဝဲဖွံ့ဖြိုးရေးသူတစ်ဦး။'
      : 'Experienced software professional.';
  }

  const skillList = topSkills.join(', ');
  if (language === 'my') {
    return `${skillList} စသည့် နည်းပညာများတွင် အတွေ့အကြုံရှိသော ဆော့ဖ်ဝဲဖွံ့ဖြိုးရေးသူ။`;
  }

  return `Software professional with hands-on experience in ${skillList}.`;
}

function resolveSummaryText({ extracted = '', skills = [], language = 'en' } = {}) {
  const cleaned = sanitizeSummary(extracted);
  if (cleaned.length >= 20) return cleaned;
  return buildProfileSummary(skills, language);
}

module.exports = {
  MAX_SUMMARY_LEN,
  sanitizeSummary,
  extractSummaryFromText,
  buildProfileSummary,
  resolveSummaryText,
};
