const express = require('express');
const {
  getUsers,
  getPredictions,
  getAnalytics,
  manageUser,
  getAdmins,
  promoteToAdmin,
  removeAdmin,
} = require('../controllers/adminController');
const { protect, adminOnly, rootAdminOnly } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, adminOnly);
router.get('/users', getUsers);
router.get('/predictions', getPredictions);
router.get('/analytics', getAnalytics);
router.patch('/users/:id', manageUser);
router.get('/admins', rootAdminOnly, getAdmins);
router.post('/admins', rootAdminOnly, promoteToAdmin);
router.delete('/admins/:id', rootAdminOnly, removeAdmin);

module.exports = router;
