const pool = require('../db');
const { UPLOAD_FIELD } = require('../middleware/uploadResume');
const { parseResumeText } = require('../services/geminiService');
const { extractPdfText, removeFile } = require('../utils/pdf');

function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

const uploadResume = async (req, res, next) => {
  if (!req.file) {
    return next(
      createHttpError(
        400,
        `No PDF file uploaded. Send the file in multipart field "${UPLOAD_FIELD}".`
      )
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
      return next(
        createHttpError(422, 'No text could be extracted from the PDF')
      );
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const result = await pool.query(
      `INSERT INTO resumes (user_id, file_url, raw_text)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [req.user.id, fileUrl, rawText]
    );

    const resumeId = result.rows[0].id;
    const parsed = await parseResumeText(rawText);

    const parsedSkills = Array.isArray(parsed.skills)
      ? parsed.skills.filter((skill) => typeof skill === 'string' && skill.trim())
      : [];

    const parsedExperience = {
      years_experience: Number(parsed.years_experience) || 0,
      education: typeof parsed.education === 'string' ? parsed.education : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };

    await pool.query(
      `UPDATE resumes
       SET parsed_skills = $1::jsonb, parsed_experience = $2::jsonb
       WHERE id = $3`,
      [JSON.stringify(parsedSkills), JSON.stringify(parsedExperience), resumeId]
    );

    res.status(201).json({
      success: true,
      id: resumeId,
      raw_text: rawText,
      parsed_skills: parsedSkills,
      parsed_experience: parsedExperience,
      used_fallback: parsed.used_fallback ?? false,
    });
  } catch (err) {
    await removeFile(filePath);
    next(err);
  }
};

module.exports = { uploadResume };
