const pool = require('../db');
const { UPLOAD_FIELD } = require('../middleware/uploadResume');
const { analyzeFull, enrichSecondaryLanguage } = require('../services/geminiService');
const {
  formatResumeProfile,
  getPrimaryResume,
  upsertPrimaryResume,
  updatePrimaryResumeParseData,
} = require('../services/resumeService');
const { normalizeRoadmap } = require('../utils/roadmap');
const { normalizeContentI18n } = require('../utils/contentI18n');
const { sanitizeEducation } = require('../utils/education');
const { sanitizeSummary } = require('../utils/summary');
const { extractPdfText, removeFile } = require('../utils/pdf');

async function persistSecondaryContent(matchId, resumeText, jobTitle, jobDescription, primaryLang, primaryAnalyze) {
  try {
    const started = Date.now();
    const { lang, block } = await enrichSecondaryLanguage(
      resumeText,
      jobTitle,
      jobDescription,
      primaryLang,
      primaryAnalyze
    );

    await pool.query(
      `UPDATE matches
       SET content_i18n = jsonb_set(COALESCE(content_i18n, '{}'::jsonb), $2::text[], $3::jsonb, true)
       WHERE id = $1`,
      [matchId, `{${lang}}`, JSON.stringify(block)]
    );

    console.log(
      `Secondary content [${lang}] saved for match ${matchId} in ${Date.now() - started}ms`
    );
  } catch (err) {
    console.error(`Failed secondary enrich for match ${matchId}:`, err.message);
  }
}

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function formatMatch(row, resumeProfile = null) {
  return {
    id: row.id,
    resume_id: row.resume_id,
    job_title: row.job_title,
    job_description: row.job_description,
    match_score: Number(row.match_score),
    matched_skills: row.matched_skills ?? [],
    missing_skills: row.missing_skills ?? [],
    improvements: row.improvements ?? [],
    roadmap: row.roadmap ? normalizeRoadmap(row.roadmap) : { goal: '', phases: [] },
    content_i18n: normalizeContentI18n(row.content_i18n),
    ai_feedback: row.ai_feedback,
    language: row.language === 'my' ? 'my' : 'en',
    created_at: row.created_at,
    resume_profile: resumeProfile,
  };
}

function normalizeParsedExperience(parsedExperience) {
  return {
    years_experience: Number(parsedExperience?.years_experience) || 0,
    education: sanitizeEducation(parsedExperience?.education),
    summary: sanitizeSummary(parsedExperience?.summary),
  };
}

const analyze = async (req, res, next) => {
  const jobDescription =
    typeof req.body.job_description === 'string' ? req.body.job_description.trim() : '';
  const jobTitle =
    typeof req.body.job_title === 'string' ? req.body.job_title.trim() : '';
  const language = req.body.language === 'my' ? 'my' : 'en';
  const useSavedResume = req.body.use_saved_resume === 'true' || req.body.use_saved_resume === true;

  if (!jobDescription || jobDescription.length < 50) {
    if (req.file) await removeFile(req.file.path);
    return next(
      createHttpError(400, 'Job description is required (at least 50 characters)')
    );
  }

  if (!req.file && !useSavedResume) {
    return next(
      createHttpError(
        400,
        `Upload a PDF in "${UPLOAD_FIELD}" or set use_saved_resume=true to analyze your saved resume`
      )
    );
  }

  const filePath = req.file?.path;

  try {
    let rawText;
    let fileUrl = null;
    let resumeRow = null;

    if (req.file) {
      try {
        rawText = await extractPdfText(filePath);
      } catch {
        await removeFile(filePath);
        return next(
          createHttpError(
            400,
            'Could not read PDF. The file may be corrupted or password-protected.'
          )
        );
      }

      if (!rawText) {
        await removeFile(filePath);
        return next(createHttpError(422, 'No text could be extracted from the PDF'));
      }

      fileUrl = `/uploads/${req.file.filename}`;
    } else {
      resumeRow = await getPrimaryResume(req.user.id);

      if (!resumeRow?.raw_text) {
        return next(createHttpError(404, 'No saved resume found. Please upload your resume first.'));
      }

      rawText = resumeRow.raw_text;
      fileUrl = resumeRow.file_url;
    }

    const {
      content_i18n_pending: contentI18nPending = false,
      primaryLang,
      primaryAnalyze,
      ...analyzeResult
    } = await analyzeFull(rawText, jobTitle, jobDescription, language);

    const parsedSkills = analyzeResult.parsed_skills ?? [];
    const parsedExperience = normalizeParsedExperience(analyzeResult.parsed_experience);

    if (req.file) {
      resumeRow = await upsertPrimaryResume(
        req.user.id,
        fileUrl,
        rawText,
        parsedSkills,
        parsedExperience,
        req.file.originalname
      );
    } else {
      resumeRow = await updatePrimaryResumeParseData(
        resumeRow.id,
        parsedSkills,
        parsedExperience
      );
    }

    const resumeId = resumeRow.id;
    const resumeProfile = formatResumeProfile(resumeRow);
    const contentI18n = normalizeContentI18n(analyzeResult.content_i18n);
    const primary = language === 'my' ? contentI18n.my : contentI18n.en;
    const roadmap = normalizeRoadmap(primary.roadmap);

    const matchResult = await pool.query(
      `INSERT INTO matches (
         resume_id,
         job_title,
         job_description,
         match_score,
         matched_skills,
         missing_skills,
         improvements,
         roadmap,
         ai_feedback,
         language,
         content_i18n
       )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, $11::jsonb)
       RETURNING id, resume_id, job_title, job_description, match_score,
                 matched_skills, missing_skills, improvements, roadmap, ai_feedback, language, content_i18n, created_at`,
      [
        resumeId,
        jobTitle || null,
        jobDescription,
        analyzeResult.match_score,
        JSON.stringify(analyzeResult.matched_skills),
        JSON.stringify(analyzeResult.missing_skills),
        JSON.stringify(primary.improvements),
        JSON.stringify(roadmap),
        primary.feedback,
        language,
        JSON.stringify(contentI18n),
      ]
    );

    const matchId = matchResult.rows[0].id;

    if (contentI18nPending && primaryAnalyze && primaryLang) {
      setImmediate(() => {
        persistSecondaryContent(
          matchId,
          rawText,
          jobTitle,
          jobDescription,
          primaryLang,
          primaryAnalyze
        );
      });
    }

    res.status(201).json({
      success: true,
      match: formatMatch(matchResult.rows[0], resumeProfile),
      resume_id: resumeId,
      content_i18n_pending: contentI18nPending,
    });
  } catch (err) {
    if (filePath) await removeFile(filePath);
    next(err);
  }
};

module.exports = { analyze };
