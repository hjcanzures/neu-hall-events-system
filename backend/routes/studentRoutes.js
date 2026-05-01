const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { getStudents } = require('../controllers/userController');

router.get('/', protect, requireRole('Admin'), getStudents);

module.exports = router;
