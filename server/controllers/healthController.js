const config = require('../config');

const getHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
};

const getGeminiHealth = async (req, res) => {
  if (!config.geminiApiKey) {
    return res.status(503).json({
      success: false,
      message: 'AI analysis is not configured',
    });
  }

  const model = config.geminiModels[0];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Return JSON: {"ok":true}' }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            maxOutputTokens: 32,
          },
        }),
      }
    );

    const body = await response.text();

    if (!response.ok) {
      console.error(`Gemini health check failed (${response.status}):`, body.slice(0, 300));
      return res.status(503).json({
        success: false,
        message: 'AI analysis is temporarily unavailable',
      });
    }

    res.status(200).json({
      success: true,
      message: 'AI analysis is available',
    });
  } catch (err) {
    console.error('Gemini health check error:', err.message);
    res.status(503).json({
      success: false,
      message: 'AI analysis is temporarily unavailable',
    });
  }
};

module.exports = { getHealth, getGeminiHealth };
