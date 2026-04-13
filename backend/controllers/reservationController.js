const Reservation = require('../models/Reservation');

const createReservation = async (req, res) => {
  try {
    const {
      eventName,
      organization,
      hall,
      date,
      startTime,
      endTime,
      attendees,
      status,
      priority,
    } = req.body;

    if (!eventName || !organization || !hall || !date || !startTime || !endTime || !attendees) {
      return res.status(400).json({ error: 'Missing required reservation fields.' });
    }

    const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const reservation = new Reservation({
      requestId,
      eventName,
      organization,
      hall,
      date,
      startTime,
      endTime,
      attendees,
      status: status || 'Pending',
      priority: priority || 'Low',
    });

    await reservation.save();

    return res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Reservation ID conflict. Please retry.' });
    }
    return res.status(500).json({ error: 'Unable to save reservation.' });
  }
};

const getReservations = async (_req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });
    return res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    return res.status(500).json({ error: 'Unable to load reservations.' });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reservation.findOneAndDelete({
      $or: [{ _id: id }, { requestId: id }],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    return res.json({ message: 'Reservation deleted.' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    return res.status(500).json({ error: 'Unable to delete reservation.' });
  }
};

module.exports = {
  createReservation,
  getReservations,
  deleteReservation,
};
