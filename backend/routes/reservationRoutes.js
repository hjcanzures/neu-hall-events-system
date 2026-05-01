const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { validateReservation } = require('../middleware/validateReservation');
const {
  createReservation,
  getReservations,
  deleteReservation,
  updateReservation,
} = require('../controllers/reservationController');

router.post('/',     protect, validateReservation, createReservation);

router.get('/',      protect, getReservations);

router.put('/:id',   protect, validateReservation, updateReservation);

router.delete('/:id', protect, deleteReservation);

module.exports = router;
