const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const { listMatchesByUser, getMatch } = require('../controllers/matchController');

const router = express.Router();

router.get('/detail/:matchId', authenticateToken, getMatch);
router.get('/:userId', listMatchesByUser);

module.exports = router;
