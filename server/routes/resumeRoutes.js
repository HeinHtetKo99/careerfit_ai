const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const { uploadResume: uploadResumeMiddleware } = require('../middleware/uploadResume');
const { uploadResume, getPrimary } = require('../controllers/resumeController');

const router = express.Router();

router.get('/primary', authenticateToken, getPrimary);

router.post(
  '/upload',
  authenticateToken,
  uploadResumeMiddleware,
  uploadResume
);

module.exports = router;
