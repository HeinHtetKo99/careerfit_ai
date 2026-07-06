const pool = require('../db');

function displayFileName(row) {
  if (row?.file_name?.trim()) return row.file_name.trim();
  if (row?.file_url) {
    const name = row.file_url.split('/').pop();
    if (name) return name;
  }
  return 'resume.pdf';
}

function formatResumeProfile(row) {
  if (!row) return null;

  const parsedExperience = row.parsed_experience ?? {};
  const experience =
    typeof parsedExperience === 'object' && !Array.isArray(parsedExperience)
      ? parsedExperience
      : {};

  return {
    id: row.id,
    file_url: row.file_url,
    file_name: displayFileName(row),
    parsed_skills: row.parsed_skills ?? [],
    parsed_experience: {
      years_experience: Number(experience.years_experience) || 0,
      education: typeof experience.education === 'string' ? experience.education : '',
      summary: typeof experience.summary === 'string' ? experience.summary : '',
    },
    created_at: row.created_at,
  };
}

async function getPrimaryResume(userId) {
  const result = await pool.query(
    `SELECT id, file_url, file_name, raw_text, parsed_skills, parsed_experience, created_at
     FROM resumes
     WHERE user_id = $1 AND is_primary = true
     LIMIT 1`,
    [userId]
  );

  return result.rows[0] ?? null;
}

async function upsertPrimaryResume(
  userId,
  fileUrl,
  rawText,
  parsedSkills,
  parsedExperience,
  fileName = null
) {
  const existing = await getPrimaryResume(userId);
  const safeFileName =
    typeof fileName === 'string' && fileName.trim() ? fileName.trim() : null;

  if (existing) {
    const result = await pool.query(
      `UPDATE resumes
       SET file_url = $1,
           file_name = COALESCE($2, file_name),
           raw_text = $3,
           parsed_skills = $4::jsonb,
           parsed_experience = $5::jsonb
       WHERE id = $6
       RETURNING id, file_url, file_name, parsed_skills, parsed_experience, created_at`,
      [
        fileUrl,
        safeFileName,
        rawText,
        JSON.stringify(parsedSkills),
        JSON.stringify(parsedExperience),
        existing.id,
      ]
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `INSERT INTO resumes (user_id, file_url, file_name, raw_text, parsed_skills, parsed_experience, is_primary)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, true)
     RETURNING id, file_url, file_name, parsed_skills, parsed_experience, created_at`,
    [
      userId,
      fileUrl,
      safeFileName,
      rawText,
      JSON.stringify(parsedSkills),
      JSON.stringify(parsedExperience),
    ]
  );

  return result.rows[0];
}

async function updatePrimaryResumeParseData(resumeId, parsedSkills, parsedExperience) {
  const result = await pool.query(
    `UPDATE resumes
     SET parsed_skills = $1::jsonb,
         parsed_experience = $2::jsonb
     WHERE id = $3
     RETURNING id, file_url, file_name, parsed_skills, parsed_experience, created_at`,
    [JSON.stringify(parsedSkills), JSON.stringify(parsedExperience), resumeId]
  );

  return result.rows[0];
}

module.exports = {
  displayFileName,
  formatResumeProfile,
  getPrimaryResume,
  upsertPrimaryResume,
  updatePrimaryResumeParseData,
};
