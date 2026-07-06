const config = require('../config');
const { normalizeRoadmap } = require('../utils/roadmap');
const {
  emptyContentBlock,
  normalizeContentBlock,
  normalizeContentI18n,
} = require('../utils/contentI18n');
const { sanitizeEducation } = require('../utils/education');
const { sanitizeSummary, resolveSummaryText } = require('../utils/summary');

const RESUME_SYSTEM_INSTRUCTION =
  'You are a resume parser. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.';

const JOB_SYSTEM_INSTRUCTION =
  'You are a job description parser. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.';

const MATCH_SYSTEM_INSTRUCTION =
  'You are a resume-to-job skill matcher. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.';

const ANALYZE_SYSTEM_INSTRUCTION =
  'You are an expert career coach. Return ONLY valid JSON matching the required schema. Keep arrays concise.';

const ANALYZE_RESUME_MAX_CHARS = 2000;
const ANALYZE_JOB_MAX_CHARS = 1500;
const ANALYZE_MAX_OUTPUT_TOKENS = 2400;
const TRANSLATE_MAX_OUTPUT_TOKENS = 1600;

function getAnalyzeSystemInstruction(language = 'en') {
  if (language === 'my') {
    return `${ANALYZE_SYSTEM_INSTRUCTION} CRITICAL: Write education, summary, improvements, feedback, and roadmap entirely in natural Burmese (Myanmar Unicode). Use conversational Myanmar — not English sentences or romanized Burmese. Keep technical skill names in English (React, Python).`;
  }

  return `${ANALYZE_SYSTEM_INSTRUCTION} CRITICAL: Write education, summary, improvements, feedback, and roadmap entirely in English.`;
}

function getAnalyzeLanguageBlock(language = 'en') {
  if (language === 'my') {
    return `OUTPUT (MYANMAR): education (degree + major only), summary (one complete sentence in Myanmar — not English), improvements (3), feedback (max 2 sentences), roadmap (goal + 3 phases, 2 tasks each). Durations: "ဒီအပတ်", "၂–၄ ပတ်", "ပြီးပါက ထပ်မံစစ်ဆေးပါ".`;
  }

  return `OUTPUT (ENGLISH): education (degree + field only — no dates), summary (one complete sentence, 25-40 words, must end cleanly — no trailing "and" or commas), improvements (3), feedback (max 2 sentences), roadmap (goal + 3 phases, 2 tasks each). Durations: "This week", "2-4 weeks", "When ready".`;
}

const ROADMAP_PHASE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    duration: { type: 'STRING' },
    tasks: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: ['title', 'duration', 'tasks'],
};

const CONTENT_BLOCK_SCHEMA = {
  type: 'OBJECT',
  properties: {
    education: { type: 'STRING' },
    summary: { type: 'STRING' },
    improvements: { type: 'ARRAY', items: { type: 'STRING' } },
    feedback: { type: 'STRING' },
    roadmap: {
      type: 'OBJECT',
      properties: {
        goal: { type: 'STRING' },
        phases: { type: 'ARRAY', items: ROADMAP_PHASE_SCHEMA },
      },
      required: ['goal', 'phases'],
    },
  },
  required: ['education', 'summary', 'improvements', 'feedback', 'roadmap'],
};

const SINGLE_LANG_ANALYZE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    skills: { type: 'ARRAY', items: { type: 'STRING' } },
    years_experience: { type: 'NUMBER' },
    education: { type: 'STRING' },
    summary: { type: 'STRING' },
    match_score: { type: 'NUMBER' },
    matched_skills: { type: 'ARRAY', items: { type: 'STRING' } },
    missing_skills: { type: 'ARRAY', items: { type: 'STRING' } },
    improvements: { type: 'ARRAY', items: { type: 'STRING' } },
    feedback: { type: 'STRING' },
    roadmap: {
      type: 'OBJECT',
      properties: {
        goal: { type: 'STRING' },
        phases: { type: 'ARRAY', items: ROADMAP_PHASE_SCHEMA },
      },
      required: ['goal', 'phases'],
    },
  },
  required: [
    'skills',
    'match_score',
    'matched_skills',
    'missing_skills',
    'improvements',
    'feedback',
    'roadmap',
  ],
};

function buildResumePrompt(rawText, strict = false) {
  const strictNote = strict
    ? '\n\nIMPORTANT: Your previous response was not valid JSON. Respond with raw JSON only — no markdown, no ``` fences, no explanation.'
    : '';

  return `Extract the following from this resume and return a JSON object with exactly these keys:
- "skills": array of skill strings
- "years_experience": number (total years of professional experience; use 0 if unclear)
- "education": string (highest or most relevant education)
- "summary": string (one sentence professional summary)

Resume text:
${rawText}${strictNote}`;
}

function buildMatchPrompt(resumeSkills, jobSkills, strict = false) {
  const strictNote = strict
    ? '\n\nIMPORTANT: Your previous response was not valid JSON. Respond with raw JSON only — no markdown, no ``` fences, no explanation.'
    : '';

  return `Compare the candidate's resume skills against the job's required skills and return a JSON object with exactly these keys:
- "match_score": number from 0 to 100 (how well the resume skills fit the job requirements)
- "missing_skills": array of skill strings the candidate lacks for this job
- "feedback": string (one short paragraph of actionable feedback)

Resume skills:
${JSON.stringify(resumeSkills)}

Job required skills:
${JSON.stringify(jobSkills)}${strictNote}`;
}

function buildAnalyzePrompt(resumeText, jobTitle, jobDescription, strict = false, language = 'en') {
  const strictNote = strict
    ? '\n\nIMPORTANT: Your previous response was not valid JSON. Respond with raw JSON only — no markdown, no ``` fences, no explanation.'
    : '';

  const languageNote = getAnalyzeLanguageBlock(language);
  const titleLine = jobTitle?.trim() ? `Job title: ${jobTitle.trim()}\n` : '';
  const trimmedResume = resumeText.slice(0, ANALYZE_RESUME_MAX_CHARS);
  const trimmedJob = jobDescription.slice(0, ANALYZE_JOB_MAX_CHARS);

  return `Compare resume to job. Compact JSON only. skills max 10, matched_skills max 8, missing_skills max 8. summary: one complete professional sentence.
${languageNote}

${titleLine}Job description:
${trimmedJob}

Resume:
${trimmedResume}${strictNote}`;
}

function buildJobSkillsPrompt(description, strict = false) {
  const strictNote = strict
    ? '\n\nIMPORTANT: Your previous response was not valid JSON. Respond with raw JSON only — no markdown, no ``` fences, no explanation.'
    : '';

  return `Extract the required technical and professional skills from this job description and return a JSON object with exactly this key:
- "required_skills": array of skill strings

Job description:
${description}${strictNote}`;
}

function stripMarkdownFences(text) {
  let cleaned = text.trim();

  const fencedMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  if (fencedMatch) {
    cleaned = fencedMatch[1].trim();
  }

  return cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryDelayMs(errorBody, maxDelayMs = 12000) {
  try {
    const parsed = JSON.parse(errorBody);
    const retryInfo = parsed?.error?.details?.find(
      (detail) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    );
    const seconds = Number.parseFloat(retryInfo?.retryDelay?.replace('s', ''));
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(Math.ceil(seconds * 1000) + 500, maxDelayMs);
    }
  } catch {
    // Ignore parse errors.
  }
  return Math.min(5000, maxDelayMs);
}

function isQuotaError(status, errorBody = '') {
  if (status === 429) return true;
  return /RESOURCE_EXHAUSTED|quota exceeded/i.test(errorBody);
}

function geminiUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function callGeminiOnce(model, userPrompt, systemInstruction, options = {}) {
  const { jsonMode = false, maxOutputTokens = 1024, schema = null } = options;

  const generationConfig = {
    temperature: 0.1,
    maxOutputTokens,
  };

  if (jsonMode) {
    generationConfig.responseMimeType = 'application/json';
    if (schema) {
      generationConfig.responseSchema = schema;
    }
  }

  const response = await fetch(`${geminiUrl(model)}?key=${config.geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig,
    }),
  });

  const errorBody = response.ok ? '' : await response.text();

  if (!response.ok) {
    const err = new Error(
      `Gemini API request failed (${response.status}) [${model}]: ${errorBody || response.statusText}`
    );
    err.status = response.status;
    err.errorBody = errorBody;
    err.isQuotaError = isQuotaError(response.status, errorBody);
    throw err;
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;

  if (!text?.trim()) {
    const reason = candidate?.finishReason || 'NO_CONTENT';
    throw new Error(`Gemini empty response [${model}] (${reason})`);
  }

  return text;
}

async function callGeminiOnceWithRetry(
  model,
  userPrompt,
  systemInstruction,
  options = {},
  maxRetries = 1
) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await callGeminiOnce(model, userPrompt, systemInstruction, options);
    } catch (err) {
      lastError = err;
      if (err.isQuotaError && attempt < maxRetries) {
        const delay = parseRetryDelayMs(err.errorBody || '');
        console.warn(
          `Gemini rate limit on ${model}, retrying in ${delay}ms (${attempt + 1}/${maxRetries})`
        );
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error(`Gemini request failed on ${model}`);
}

async function callGemini(
  userPrompt,
  systemInstruction = RESUME_SYSTEM_INSTRUCTION,
  options = {}
) {
  if (!config.geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  let lastError;

  for (const model of config.geminiModels) {
    try {
      return await callGeminiOnceWithRetry(model, userPrompt, systemInstruction, options);
    } catch (err) {
      lastError = err;
      console.warn(`Gemini failed on ${model}: ${err.message.slice(0, 160)}`);
    }
  }

  throw lastError || new Error('All configured Gemini models failed');
}

function parseGeminiJson(text) {
  const cleaned = stripMarkdownFences(text).trim();
  if (!cleaned) {
    throw new SyntaxError('Empty JSON response');
  }
  return JSON.parse(cleaned);
}

function createGeminiError(taskName, err) {
  const isQuota =
    err.isQuotaError || /429|RESOURCE_EXHAUSTED|quota exceeded/i.test(err.message || '');
  const isUnavailable = /503|UNAVAILABLE|high demand/i.test(err.message || '');

  let message;
  let code;

  if (isQuota) {
    message = 'AI analysis is temporarily unavailable. Please try again later.';
    code = 'GEMINI_QUOTA';
  } else if (isUnavailable) {
    message = 'AI analysis is busy right now. Please try again in a few minutes.';
    code = 'GEMINI_UNAVAILABLE';
  } else if (!config.geminiApiKey) {
    message = 'AI analysis is currently unavailable. Please try again later.';
    code = 'GEMINI_NOT_CONFIGURED';
  } else {
    message = 'AI analysis could not be completed. Please try again.';
    code = 'GEMINI_ERROR';
  }

  const error = new Error(message);
  error.statusCode = 503;
  error.code = code;
  return error;
}

async function withGemini(taskName, geminiFn) {
  try {
    return await geminiFn();
  } catch (err) {
    console.error(`Gemini unavailable for ${taskName}:`, err.message);
    throw createGeminiError(taskName, err);
  }
}

async function parseResumeText(rawText) {
  return withGemini('parse resume', async () => {
      let lastError;

      for (const strict of [false, true]) {
        try {
          const responseText = await callGemini(
            buildResumePrompt(rawText, strict),
            RESUME_SYSTEM_INSTRUCTION
          );
          const parsed = parseGeminiJson(responseText);

          if (!Array.isArray(parsed.skills)) {
            throw new SyntaxError('Missing or invalid "skills" array');
          }

          if (typeof parsed.years_experience !== 'number') {
            throw new SyntaxError('Missing or invalid "years_experience" number');
          }

          return {
            skills: parsed.skills,
            years_experience: parsed.years_experience,
            education: sanitizeEducation(parsed.education),
            summary: sanitizeSummary(parsed.summary),
          };
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('invalid JSON response');
  });
}

async function extractJobSkills(description) {
  return withGemini('extract job skills', async () => {
      let lastError;

      for (const strict of [false, true]) {
        try {
          const responseText = await callGemini(
            buildJobSkillsPrompt(description, strict),
            JOB_SYSTEM_INSTRUCTION
          );
          const parsed = parseGeminiJson(responseText);

          if (!Array.isArray(parsed.required_skills)) {
            throw new SyntaxError('Missing or invalid "required_skills" array');
          }

          return {
            required_skills: parsed.required_skills.filter(
              (skill) => typeof skill === 'string' && skill.trim()
            ),
          };
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('invalid JSON response');
  });
}

async function scoreSkillMatch(resumeSkills, jobSkills) {
  return withGemini('score skill match', async () => {
      let lastError;

      for (const strict of [false, true]) {
        try {
          const responseText = await callGemini(
            buildMatchPrompt(resumeSkills, jobSkills, strict),
            MATCH_SYSTEM_INSTRUCTION
          );
          const parsed = parseGeminiJson(responseText);

          if (typeof parsed.match_score !== 'number' || Number.isNaN(parsed.match_score)) {
            throw new SyntaxError('Missing or invalid "match_score" number');
          }

          if (!Array.isArray(parsed.missing_skills)) {
            throw new SyntaxError('Missing or invalid "missing_skills" array');
          }

          if (typeof parsed.feedback !== 'string') {
            throw new SyntaxError('Missing or invalid "feedback" string');
          }

          const matchScore = Math.min(100, Math.max(0, parsed.match_score));
          const missingSkills = parsed.missing_skills.filter(
            (skill) => typeof skill === 'string' && skill.trim()
          );

          return {
            match_score: matchScore,
            missing_skills: missingSkills,
            feedback: parsed.feedback.trim(),
          };
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('invalid JSON response');
  });
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
}

function toContentBlock(parsed) {
  return {
    education: sanitizeEducation(parsed.education),
    summary: sanitizeSummary(parsed.summary),
    improvements: normalizeStringArray(parsed.improvements),
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '',
    roadmap: normalizeRoadmap(parsed.roadmap),
  };
}

function parseSingleLangAnalyzeResult(parsed) {
  if (typeof parsed.match_score !== 'number' || Number.isNaN(parsed.match_score)) {
    throw new SyntaxError('Missing or invalid "match_score" number');
  }

  const match_score = Math.min(100, Math.max(0, parsed.match_score));

  return {
    skills: normalizeStringArray(parsed.skills),
    years_experience: typeof parsed.years_experience === 'number' ? parsed.years_experience : 0,
    education: sanitizeEducation(parsed.education),
    summary: sanitizeSummary(parsed.summary),
    match_score,
    matched_skills: normalizeStringArray(parsed.matched_skills),
    missing_skills: normalizeStringArray(parsed.missing_skills),
    improvements: normalizeStringArray(parsed.improvements),
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '',
    roadmap: normalizeRoadmap(parsed.roadmap),
  };
}

async function runAnalyzeForLanguage(resumeText, jobTitle, jobDescription, language) {
  const analyzeOptions = {
    jsonMode: true,
    maxOutputTokens: ANALYZE_MAX_OUTPUT_TOKENS,
    schema: SINGLE_LANG_ANALYZE_SCHEMA,
  };

  let lastError;

  for (const model of config.geminiModels) {
    for (const strict of [false, true]) {
      try {
        const responseText = await callGeminiOnceWithRetry(
          model,
          buildAnalyzePrompt(resumeText, jobTitle, jobDescription, strict, language),
          getAnalyzeSystemInstruction(language),
          analyzeOptions
        );
        const parsed = parseSingleLangAnalyzeResult(parseGeminiJson(responseText));
        console.log(`Gemini analyze [${language}] succeeded with ${model}`);
        return parsed;
      } catch (err) {
        lastError = err;
        if (err.isQuotaError) break;
        if (!strict) continue;
        console.warn(
          `Analyze [${language}] failed [${model}]: ${err.message.slice(0, 120)}`
        );
      }
    }
  }

  throw lastError || new Error(`All Gemini models failed for analyze (${language})`);
}

function mergeBilingualAnalyze(en, my, language = 'en') {
  const content_i18n = normalizeContentI18n({
    en: toContentBlock(en),
    my: toContentBlock(my),
  });
  const primary = language === 'my' ? content_i18n.my : content_i18n.en;

  return {
    parsed_skills: en.skills,
    parsed_experience: {
      years_experience: en.years_experience,
      education: primary.education || en.education,
      summary: primary.summary || en.summary,
    },
    match_score: en.match_score,
    matched_skills: en.matched_skills,
    missing_skills: en.missing_skills,
    content_i18n,
    improvements: primary.improvements,
    feedback: primary.feedback,
    roadmap: primary.roadmap,
    content_i18n_pending: false,
  };
}

function mergePrimaryAnalyze(primary, primaryLang) {
  const block = toContentBlock(primary);
  const content_i18n = normalizeContentI18n({
    en: primaryLang === 'en' ? block : emptyContentBlock(),
    my: primaryLang === 'my' ? block : emptyContentBlock(),
  });
  const active = primaryLang === 'my' ? content_i18n.my : content_i18n.en;

  return {
    parsed_skills: primary.skills,
    parsed_experience: {
      years_experience: primary.years_experience,
      education: active.education || primary.education,
      summary: active.summary || primary.summary,
    },
    match_score: primary.match_score,
    matched_skills: primary.matched_skills,
    missing_skills: primary.missing_skills,
    content_i18n,
    improvements: active.improvements,
    feedback: active.feedback,
    roadmap: active.roadmap,
    content_i18n_pending: true,
    primaryLang,
    primaryAnalyze: primary,
  };
}

function getTranslateSystemInstruction(targetLanguage) {
  if (targetLanguage === 'my') {
    return 'You translate career coaching text into natural Burmese (Myanmar Unicode). Keep technical skill names in English. Return ONLY valid JSON.';
  }

  return 'You translate career coaching text into clear English. Return ONLY valid JSON.';
}

function buildTranslatePrompt(sourceBlock, targetLanguage) {
  const target =
    targetLanguage === 'my'
      ? 'natural Burmese (Myanmar Unicode, conversational — not romanized)'
      : 'English';

  return `Translate the following career analysis content into ${target}. Preserve meaning. Keep skill names like React and Python in English.

Source JSON:
${JSON.stringify(sourceBlock)}`;
}

async function translateAnalyzeBlock(sourceBlock, targetLanguage) {
  const translateOptions = {
    jsonMode: true,
    maxOutputTokens: TRANSLATE_MAX_OUTPUT_TOKENS,
    schema: CONTENT_BLOCK_SCHEMA,
  };

  let lastError;

  for (const model of config.geminiModels) {
    for (const strict of [false, true]) {
      try {
        const responseText = await callGeminiOnceWithRetry(
          model,
          buildTranslatePrompt(sourceBlock, targetLanguage) +
            (strict
              ? '\n\nIMPORTANT: Respond with raw JSON only — no markdown, no fences.'
              : ''),
          getTranslateSystemInstruction(targetLanguage),
          translateOptions
        );
        const parsed = normalizeContentBlock(parseGeminiJson(responseText));
        console.log(`Gemini translate [${targetLanguage}] succeeded with ${model}`);
        return parsed;
      } catch (err) {
        lastError = err;
        if (err.isQuotaError) break;
        if (!strict) continue;
        console.warn(
          `Translate [${targetLanguage}] failed [${model}]: ${err.message.slice(0, 120)}`
        );
      }
    }
  }

  throw lastError || new Error(`All Gemini models failed for translate (${targetLanguage})`);
}

async function enrichSecondaryLanguage(
  resumeText,
  jobTitle,
  jobDescription,
  primaryLang,
  primaryAnalyze
) {
  const secondaryLang = primaryLang === 'my' ? 'en' : 'my';
  const sourceBlock = toContentBlock(primaryAnalyze);

  try {
    return {
      lang: secondaryLang,
      block: await translateAnalyzeBlock(sourceBlock, secondaryLang),
    };
  } catch (translateErr) {
    console.warn(
      `Translate to ${secondaryLang} failed, running full analyze:`,
      translateErr.message.slice(0, 120)
    );
    const full = await runAnalyzeForLanguage(
      resumeText,
      jobTitle,
      jobDescription,
      secondaryLang
    );
    return { lang: secondaryLang, block: toContentBlock(full) };
  }
}

function parseAnalyzeResult(parsed) {
  if (typeof parsed.match_score !== 'number' || Number.isNaN(parsed.match_score)) {
    throw new SyntaxError('Missing or invalid "match_score" number');
  }

  const match_score = Math.min(100, Math.max(0, parsed.match_score));

  return {
    match_score,
    matched_skills: normalizeStringArray(parsed.matched_skills),
    missing_skills: normalizeStringArray(parsed.missing_skills),
    improvements: normalizeStringArray(parsed.improvements),
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '',
  };
}

async function analyzeFull(resumeText, jobTitle, jobDescription, language = 'en') {
  return withGemini('analyze resume', async () => {
    const primaryLang = language === 'my' ? 'my' : 'en';
    const started = Date.now();
    const primary = await runAnalyzeForLanguage(
      resumeText,
      jobTitle,
      jobDescription,
      primaryLang
    );
    console.log(`Gemini primary analyze [${primaryLang}] finished in ${Date.now() - started}ms`);
    return mergePrimaryAnalyze(primary, primaryLang);
  });
}

async function analyzeResumeMatch(
  resumeText,
  parsedExperience,
  resumeSkills,
  jobTitle,
  jobDescription
) {
  const experience = parsedExperience ?? {};
  const skills = resumeSkills ?? [];

  return withGemini('analyze resume match', async () => {
      let lastError;

      for (const strict of [false, true]) {
        try {
          const responseText = await callGemini(
            buildAnalyzePrompt(
              resumeText,
              experience,
              skills,
              jobTitle,
              jobDescription,
              strict
            ),
            ANALYZE_SYSTEM_INSTRUCTION
          );
          return parseAnalyzeResult(parseGeminiJson(responseText));
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('invalid JSON response');
  });
}

module.exports = {
  parseResumeText,
  extractJobSkills,
  scoreSkillMatch,
  analyzeResumeMatch,
  analyzeFull,
  enrichSecondaryLanguage,
};
