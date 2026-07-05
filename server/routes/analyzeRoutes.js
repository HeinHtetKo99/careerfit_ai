const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadResume: uploadResumeMiddleware } = require('../middleware/uploadResume');
const { analyze } = require('../controllers/analyzeController');

const router = express.Router();

router.post('/', authenticateToken, uploadResumeMiddleware, analyze);

module.exports = router;
