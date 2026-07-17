const path = require('path');

require('dotenv').config();

function parseModelList(value, fallback) {
  const models = (value || fallback)
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  return [...new Set(models)];
}

module.exports = {
  port: process.env.PORT || 5001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  clientUrl: process.env.CLIENT_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModels: parseModelList(
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash'
  ),
  persistUploads: process.env.PERSIST_UPLOADS !== 'false',
  uploadsDir:
    process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'),
};
