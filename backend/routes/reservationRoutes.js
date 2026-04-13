const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createReservation,
  getReservations,
  deleteReservation,
} = require('../controllers/reservationController');

router.post('/', protect, createReservation);
router.get('/', protect, getReservations);
router.delete('/:id', protect, deleteReservation);

module.exports = router;
