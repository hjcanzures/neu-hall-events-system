const express = require('express');
const router = express.Router();
const {
  createReservation,
  getReservations,
  deleteReservation,
} = require('../controllers/reservationController');

router.post('/', createReservation);
router.get('/', getReservations);
router.delete('/:id', deleteReservation);

module.exports = router;