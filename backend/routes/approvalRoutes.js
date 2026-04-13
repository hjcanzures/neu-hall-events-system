const express = require('express');
const mongoose = require('mongoose');
const { protect, requireRole } = require('../middleware/authMiddleware');
const Reservation = require('../models/Reservation');
const router = express.Router();

const buildApprovalQuery = (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return { $or: [{ requestId: id }, { _id: id }] };
  }

  return { requestId: id };
};

const updateStatus = async (req, res, status) => {
  try {
    const { id } = req.params;
    const query = buildApprovalQuery(id);
    const reservation = await Reservation.findOneAndUpdate(query, { status }, { returnDocument: 'after' });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    return res.json(reservation);
  } catch (error) {
    console.error('Update reservation status error:', error);
    return res.status(500).json({ error: 'Unable to update reservation status.' });
  }
};

// Approve reservation
router.put('/:id/approve', protect, requireRole('Admin'), async (req, res) => updateStatus(req, res, 'Approved'));

// Reject reservation
router.put('/:id/reject', protect, requireRole('Admin'), async (req, res) => updateStatus(req, res, 'Rejected'));

module.exports = router;
