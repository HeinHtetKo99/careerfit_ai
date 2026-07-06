const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadResumeOptional } = require('../middleware/uploadResume');
const { analyze } = require('../controllers/analyzeController');

const router = express.Router();

router.post('/', authenticateToken, uploadResumeOptional, analyze);

module.exports = router;
