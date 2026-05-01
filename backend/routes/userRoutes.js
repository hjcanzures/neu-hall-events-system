const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getUsers } = require('../controllers/userController');

router.get('/', protect, requireRole('Admin'), getUsers);

module.exports = router;
