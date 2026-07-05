const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const resumeRoutes = require('./resumeRoutes');
const analyzeRoutes = require('./analyzeRoutes');
const matchesRoutes = require('./matchesRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/analyze', analyzeRoutes);
router.use('/matches', matchesRoutes);

module.exports = router;
