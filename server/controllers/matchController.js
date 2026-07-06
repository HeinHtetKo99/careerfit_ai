const pool = require('../db');
const { normalizeRoadmap } = require('../utils/roadmap');
const { normalizeContentI18n } = require('../utils/contentI18n');
const { formatResumeProfile } = require('../services/resumeService');

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

const listMatchesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (String(req.user.id) !== String(userId)) {
      throw createHttpError(403, 'You can only view your own analysis history');
    }

    const result = await pool.query(
      `SELECT
         m.id,
         m.resume_id,
         m.job_title,
         m.job_description,
         m.match_score,
         m.matched_skills,
         m.missing_skills,
         m.improvements,
         m.ai_feedback,
         m.created_at
       FROM matches m
       INNER JOIN resumes r ON r.id = m.resume_id
       WHERE r.user_id = $1
       ORDER BY m.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      matches: result.rows.map((row) => formatMatch(row)),
    });
  } catch (err) {
    next(err);
  }
};

const getMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    if (!/^\d+$/.test(matchId)) {
      throw createHttpError(400, 'Invalid analysis id');
    }

    const result = await pool.query(
      `SELECT
         m.id,
         m.resume_id,
         m.job_title,
         m.job_description,
         m.match_score,
         m.matched_skills,
         m.missing_skills,
         m.improvements,
         m.roadmap,
         m.ai_feedback,
         m.language,
         m.content_i18n,
         m.created_at,
         r.file_url,
         r.file_name,
         r.parsed_skills,
         r.parsed_experience
       FROM matches m
       INNER JOIN resumes r ON r.id = m.resume_id
       WHERE m.id = $1 AND r.user_id = $2`,
      [matchId, userId]
    );

    const row = result.rows[0];

    if (!row) {
      throw createHttpError(404, 'Analysis not found');
    }

    const resumeProfile = formatResumeProfile(row);

    res.status(200).json({
      success: true,
      match: formatMatch(row, resumeProfile),
    });
  } catch (err) {
    next(err);
  }
};

const deleteAllMatchesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (String(req.user.id) !== String(userId)) {
      throw createHttpError(403, 'You can only delete your own analysis history');
    }

    const result = await pool.query(
      `DELETE FROM matches m
       USING resumes r
       WHERE m.resume_id = r.id AND r.user_id = $1`,
      [userId]
    );

    res.status(200).json({
      success: true,
      deleted_count: result.rowCount,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listMatchesByUser, getMatch, deleteAllMatchesByUser };
