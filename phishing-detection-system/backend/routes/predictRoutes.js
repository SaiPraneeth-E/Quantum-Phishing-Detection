const express = require('express');
const {
  predict,
  getHistory,
  getUserStats,
  deleteHistoryItem,
  bulkPredict,
} = require('../controllers/predictController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect);
router.post('/', predict);
router.post('/bulk', bulkPredict);
router.get('/history', getHistory);
router.get('/stats', getUserStats);
router.delete('/history/:id', deleteHistoryItem);

module.exports = router;
