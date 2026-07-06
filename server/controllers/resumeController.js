const pool = require('../db');
const { UPLOAD_FIELD } = require('../middleware/uploadResume');
const { parseResumeText } = require('../services/geminiService');
const { formatResumeProfile, upsertPrimaryResume } = require('../services/resumeService');
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

    const parsed = await parseResumeText(rawText);

    const parsedSkills = Array.isArray(parsed.skills)
      ? parsed.skills.filter((skill) => typeof skill === 'string' && skill.trim())
      : [];

    const parsedExperience = {
      years_experience: Number(parsed.years_experience) || 0,
      education: typeof parsed.education === 'string' ? parsed.education : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
    };

    const resumeRow = await upsertPrimaryResume(
      req.user.id,
      fileUrl,
      rawText,
      parsedSkills,
      parsedExperience,
      req.file.originalname
    );

    res.status(201).json({
      success: true,
      resume: formatResumeProfile(resumeRow),
      id: resumeRow.id,
      raw_text: rawText,
      parsed_skills: parsedSkills,
      parsed_experience: parsedExperience,
    });
  } catch (err) {
    await removeFile(filePath);
    next(err);
  }
};

const getPrimary = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, file_url, file_name, parsed_skills, parsed_experience, created_at
       FROM resumes
       WHERE user_id = $1 AND is_primary = true
       LIMIT 1`,
      [req.user.id]
    );

    const resume = result.rows[0];

    if (!resume) {
      return res.status(200).json({ success: true, resume: null });
    }

    res.status(200).json({
      success: true,
      resume: formatResumeProfile(resume),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadResume, getPrimary };
