const pool = require('../db');

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

const listMatchesByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

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
      matches: result.rows.map(formatMatch),
    });
  } catch (err) {
    next(err);
  }
};

const getMatch = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

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
       WHERE m.id = $1 AND r.user_id = $2`,
      [matchId, userId]
    );

    const match = result.rows[0];

    if (!match) {
      throw createHttpError(404, 'Analysis not found');
    }

    res.status(200).json({
      success: true,
      match: formatMatch(match),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { listMatchesByUser, getMatch };
