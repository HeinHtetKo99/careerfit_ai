const express = require('express');
const { getHealth, getGeminiHealth } = require('../controllers/healthController');

const router = express.Router();

router.get('/', getHealth);
router.get('/gemini', getGeminiHealth);

module.exports = router;
