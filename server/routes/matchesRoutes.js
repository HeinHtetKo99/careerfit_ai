const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');
const {
  listMatchesByUser,
  getMatch,
  deleteAllMatchesByUser,
} = require('../controllers/matchController');

const router = express.Router();

router.get('/detail/:matchId', authenticateToken, getMatch);
router.delete('/:userId', authenticateToken, deleteAllMatchesByUser);
router.get('/:userId', authenticateToken, listMatchesByUser);

module.exports = router;
