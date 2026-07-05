const pool = require('../db');
const { UPLOAD_FIELD } = require('../middleware/uploadResume');
const { analyzeFull } = require('../services/geminiService');
const { extractPdfText, removeFile } = require('../utils/pdf');

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function formatMatch(row) {
  return {
    id: row.id,
    resume_id: row.resume_id,
    job_title: row.job_title,
    job_description: row.job_description,
    match_score: Number(row.match_score),
    matched_skills: row.matched_skills ?? [],
    missing_skills: row.missing_skills ?? [],
    improvements: row.improvements ?? [],
    ai_feedback: row.ai_feedback,
    created_at: row.created_at,
  };
}

const analyze = async (req, res, next) => {
  if (!req.file) {
    return next(
      createHttpError(
        400,
        `No PDF file uploaded. Send the file in multipart field "${UPLOAD_FIELD}".`
      )
    );
  }

  const jobDescription =
    typeof req.body.job_description === 'string' ? req.body.job_description.trim() : '';
  const jobTitle =
    typeof req.body.job_title === 'string' ? req.body.job_title.trim() : '';
  const language = req.body.language === 'my' ? 'my' : 'en';

  if (!jobDescription || jobDescription.length < 50) {
    await removeFile(req.file.path);
    return next(
      createHttpError(400, 'Job description is required (at least 50 characters)')
    );
  }

  const filePath = req.file.path;

  try {
    let rawText;

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

    const fileUrl = `/uploads/${req.file.filename}`;
    const result = await analyzeFull(rawText, jobTitle, jobDescription, language);

    const parsedSkills = result.parsed_skills ?? [];
    const parsedExperience = result.parsed_experience ?? {
      years_experience: 0,
      education: '',
      summary: '',
    };

    const resumeResult = await pool.query(
      `INSERT INTO resumes (user_id, file_url, raw_text, parsed_skills, parsed_experience)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb)
       RETURNING id`,
      [
        req.user.id,
        fileUrl,
        rawText,
        JSON.stringify(parsedSkills),
        JSON.stringify(parsedExperience),
      ]
    );

    const resumeId = resumeResult.rows[0].id;

    const matchResult = await pool.query(
      `INSERT INTO matches (
         resume_id,
         job_title,
         job_description,
         match_score,
         matched_skills,
         missing_skills,
         improvements,
         ai_feedback
       )
       VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8)
       RETURNING id, resume_id, job_title, job_description, match_score,
                 matched_skills, missing_skills, improvements, ai_feedback, created_at`,
      [
        resumeId,
        jobTitle || null,
        jobDescription,
        result.match_score,
        JSON.stringify(result.matched_skills),
        JSON.stringify(result.missing_skills),
        JSON.stringify(result.improvements),
        result.feedback,
      ]
    );

    res.status(201).json({
      success: true,
      match: formatMatch(matchResult.rows[0]),
      resume_id: resumeId,
      used_fallback: result.used_fallback ?? false,
    });
  } catch (err) {
    await removeFile(filePath);
    next(err);
  }
};

module.exports = { analyze };
