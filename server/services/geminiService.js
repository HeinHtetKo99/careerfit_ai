const config = require('../config');
const localParser = require('./localParser');

const RESUME_SYSTEM_INSTRUCTION =
  'You are a resume parser. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.';

const JOB_SYSTEM_INSTRUCTION =
  'You are a job description parser. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.';

const MATCH_SYSTEM_INSTRUCTION =
  'You are a resume-to-job skill matcher. Return ONLY valid JSON with no markdown formatting, no code fences, and no extra text.';

const ANALYZE_SYSTEM_INSTRUCTION =
  'You are an expert career coach. Return ONLY valid JSON matching the required schema. Keep arrays concise.';

function getAnalyzeSystemInstruction(language = 'en') {
  if (language === 'my') {
    return `${ANALYZE_SYSTEM_INSTRUCTION} CRITICAL: Write summary, improvements, and feedback entirely in natural Burmese (Myanmar script). Use clear, conversational Myanmar — not literal English transliteration. Keep standard technical skill names in English (e.g. React, Python).`;
  }

  return `${ANALYZE_SYSTEM_INSTRUCTION} CRITICAL: Write summary, improvements, and feedback entirely in English.`;
}

const ANALYZE_RESPONSE_SCHEMA = {
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
  },
  required: [
    'skills',
    'match_score',
    'matched_skills',
    'missing_skills',
    'improvements',
    'feedback',
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

  const languageNote =
    language === 'my'
      ? '\n\nOUTPUT LANGUAGE (MANDATORY): Burmese/Myanmar script only for summary, improvements, and feedback. Use natural spoken Myanmar. Do not transliterate English words like "resume" — use CV or ကိုယ်ရေးရာဇဝင် where appropriate.'
      : '\n\nOUTPUT LANGUAGE (MANDATORY): English only for summary, improvements, and feedback.';

  const titleLine = jobTitle?.trim() ? `Job title: ${jobTitle.trim()}\n` : '';
  const trimmedResume = resumeText.slice(0, 3000);
  const trimmedJob = jobDescription.slice(0, 2500);

  return `Compare this resume to the job. Return compact JSON only.

Limits: skills max 10 items, matched_skills max 8, missing_skills max 8, improvements exactly 3 short strings, feedback max 2 sentences, summary max 20 words.
${languageNote}

${titleLine}
Job description:
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

function parseRetryDelayMs(errorBody) {
  try {
    const parsed = JSON.parse(errorBody);
    const retryInfo = parsed?.error?.details?.find(
      (detail) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo'
    );
    const seconds = Number.parseFloat(retryInfo?.retryDelay?.replace('s', ''));
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(Math.ceil(seconds * 1000) + 500, 60000);
    }
  } catch {
    // Ignore parse errors.
  }
  return 5000;
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
      return await callGeminiOnce(model, userPrompt, systemInstruction, options);
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

async function withGeminiOrFallback(taskName, geminiFn, fallbackFn, ...args) {
  try {
    const result = await geminiFn(...args);
    return { ...result, used_fallback: false };
  } catch (err) {
    if (!config.geminiFallbackEnabled) {
      console.error(`Gemini unavailable for ${taskName}:`, err.message);
      throw createGeminiError(taskName, err);
    }

    console.warn(`Gemini unavailable for ${taskName}. Using local fallback.`, err.message);
    const result = fallbackFn(...args);
    return { ...result, used_fallback: true };
  }
}

async function parseResumeText(rawText) {
  return withGeminiOrFallback(
    'parse resume',
    async (text) => {
      let lastError;

      for (const strict of [false, true]) {
        try {
          const responseText = await callGemini(
            buildResumePrompt(text, strict),
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
            education: typeof parsed.education === 'string' ? parsed.education : '',
            summary: typeof parsed.summary === 'string' ? parsed.summary : '',
          };
        } catch (err) {
          lastError = err;
        }
      }

      throw lastError || new Error('invalid JSON response');
    },
    localParser.parseResumeText,
    rawText
  );
}

async function extractJobSkills(description) {
  return withGeminiOrFallback(
    'extract job skills',
    async (text) => {
      let lastError;

      for (const strict of [false, true]) {
        try {
          const responseText = await callGemini(
            buildJobSkillsPrompt(text, strict),
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
    },
    (text) => ({ required_skills: localParser.extractJobSkills(text) }),
    description
  );
}

async function scoreSkillMatch(resumeSkills, jobSkills) {
  return withGeminiOrFallback(
    'score skill match',
    async (resume, job) => {
      let lastError;

      for (const strict of [false, true]) {
        try {
          const responseText = await callGemini(
            buildMatchPrompt(resume, job, strict),
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
    },
    localParser.scoreSkillMatch,
    resumeSkills,
    jobSkills
  );
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
}

function parseFullAnalyzeResult(parsed) {
  if (typeof parsed.match_score !== 'number' || Number.isNaN(parsed.match_score)) {
    throw new SyntaxError('Missing or invalid "match_score" number');
  }

  const match_score = Math.min(100, Math.max(0, parsed.match_score));
  const skills = normalizeStringArray(parsed.skills);

  return {
    skills,
    years_experience: typeof parsed.years_experience === 'number' ? parsed.years_experience : 0,
    education: typeof parsed.education === 'string' ? parsed.education : '',
    summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    match_score,
    matched_skills: normalizeStringArray(parsed.matched_skills),
    missing_skills: normalizeStringArray(parsed.missing_skills),
    improvements: normalizeStringArray(parsed.improvements),
    feedback: typeof parsed.feedback === 'string' ? parsed.feedback.trim() : '',
  };
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
  return withGeminiOrFallback(
    'analyze resume',
    async () => {
      let lastError;
      const analyzeOptions = {
        jsonMode: true,
        maxOutputTokens: 4096,
        schema: ANALYZE_RESPONSE_SCHEMA,
      };

      for (const model of config.geminiModels) {
        for (const strict of [false, true]) {
          try {
            const responseText = await callGeminiOnce(
              model,
              buildAnalyzePrompt(resumeText, jobTitle, jobDescription, strict, language),
              getAnalyzeSystemInstruction(language),
              analyzeOptions
            );
            const parsed = parseFullAnalyzeResult(parseGeminiJson(responseText));
            console.log(`Gemini analyze succeeded with ${model}`);
            return {
              parsed_skills: parsed.skills,
              parsed_experience: {
                years_experience: parsed.years_experience,
                education: parsed.education,
                summary: parsed.summary,
              },
              match_score: parsed.match_score,
              matched_skills: parsed.matched_skills,
              missing_skills: parsed.missing_skills,
              improvements: parsed.improvements,
              feedback: parsed.feedback,
            };
          } catch (err) {
            lastError = err;
            console.warn(`Analyze attempt failed [${model}]: ${err.message.slice(0, 160)}`);
          }
        }
      }

      throw lastError || new Error('All Gemini models failed for analyze');
    },
    (text, title, description, lang = 'en') => {
      const parsed = localParser.parseResumeText(text);
      const parsedExperience = {
        years_experience: parsed.years_experience,
        education: parsed.education,
        summary: parsed.summary,
      };
      const analysis = localParser.analyzeResumeMatch(
        text,
        parsedExperience,
        parsed.skills,
        title,
        description,
        lang
      );
      return {
        parsed_skills: parsed.skills,
        parsed_experience: parsedExperience,
        ...analysis,
      };
    },
    resumeText,
    jobTitle,
    jobDescription,
    language
  );
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

  return withGeminiOrFallback(
    'analyze resume match',
    async () => {
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
    },
    localParser.analyzeResumeMatch,
    resumeText,
    experience,
    skills,
    jobTitle,
    jobDescription
  );
}

module.exports = {
  parseResumeText,
  extractJobSkills,
  scoreSkillMatch,
  analyzeResumeMatch,
  analyzeFull,
};
