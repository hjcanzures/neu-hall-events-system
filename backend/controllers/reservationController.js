const Reservation = require('../models/Reservation');

const createReservation = async (req, res) => {
  try {
    const {
      eventName,
      hall,
      date,
      startTime,
      endTime,
      attendees,
      status,
      priority,
    } = req.body;

    const organization = (req.body.organization || req.user.organization || '').trim();

    const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const reservation = new Reservation({
      requestId,
      eventName: eventName.trim(),
      organization: organization.trim(),
      hall: hall.trim(),
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      attendees: Number(attendees),
      status: status || 'Pending',
      priority: priority || 'Low',
      createdBy: req.user.email,
    });

    await reservation.save();
    return res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);

    // Duplicate requestId (extremely rare — random collision)
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Reservation ID conflict. Please retry.' });
    }

    // Mongoose schema-level validation errors (second safety net after middleware)
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Validation error', details: messages });
    }

    return res.status(500).json({ error: 'Unable to save reservation.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/reservations
// Student Org users see only their own org's reservations.
// Admins/staff see all.
// ---------------------------------------------------------------------------
const getReservations = async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'Student') {
      query.createdBy = req.user.email;
    }

    const reservations = await Reservation.find(query).sort({ createdAt: -1 });
    return res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    return res.status(500).json({ error: 'Unable to load reservations.' });
  }
};

// ---------------------------------------------------------------------------
// DELETE /api/reservations/:id
// Accepts either the Mongo _id or the human-readable requestId.
// ---------------------------------------------------------------------------
const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findOneAndDelete({
      $or: [{ _id: id }, { requestId: id }],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    return res.json({ message: 'Reservation deleted.', requestId: reservation.requestId });
  } catch (error) {
    console.error('Delete reservation error:', error);
    return res.status(500).json({ error: 'Unable to delete reservation.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/reservations/:id
// validateReservation middleware handles conflict check (excludes self).
// ---------------------------------------------------------------------------
const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = ['eventName', 'hall', 'date', 'startTime', 'endTime', 'attendees', 'priority', 'status', 'organization'];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string'
          ? req.body[field].trim()
          : req.body[field];
      }
    }

    const reservation = await Reservation.findOneAndUpdate(
      { $or: [{ _id: id }, { requestId: id }] },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    return res.json(reservation);
  } catch (error) {
    console.error('Update reservation error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ error: 'Validation error', details: messages });
    }

    return res.status(500).json({ error: 'Unable to update reservation.' });
  }
};

module.exports = {
  createReservation,
  getReservations,
  deleteReservation,
  updateReservation,
};
