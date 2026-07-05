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
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModels: parseModelList(
    process.env.GEMINI_MODEL,
    'gemini-2.0-flash,gemini-1.5-flash,gemini-2.5-flash'
  ),
  geminiFallbackEnabled: process.env.GEMINI_FALLBACK === 'true',
  uploadsDir: path.join(__dirname, '..', 'uploads'),
};
