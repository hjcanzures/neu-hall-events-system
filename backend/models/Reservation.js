const mongoose = require('mongoose');

/**
 * Parse "HH:MM" or "HH:MM AM/PM" into total minutes since midnight.
 */
const toMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const h24 = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1], 10) * 60 + parseInt(h24[2], 10);
  const h12 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (h12) {
    let hrs = parseInt(h12[1], 10);
    const mins = parseInt(h12[2], 10);
    const period = h12[3].toUpperCase();
    if (period === 'AM' && hrs === 12) hrs = 0;
    if (period === 'PM' && hrs !== 12) hrs += 12;
    return hrs * 60 + mins;
  }
  return NaN;
};

const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const reservationSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: [true, 'Request ID is required'],
      unique: true,
      trim: true,
    },
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      minlength: [3, 'Event name must be at least 3 characters'],
      maxlength: [100, 'Event name must not exceed 100 characters'],
    },
    organization: {
      type: String,
      required: [true, 'Organization is required'],
      trim: true,
      minlength: [2, 'Organization name must be at least 2 characters'],
    },
    hall: {
      type: String,
      required: [true, 'Hall is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      trim: true,
      validate: [
        {
          validator(v) { return parseDate(v) !== null; },
          message: 'Date must be a valid date (YYYY-MM-DD)',
        },
        {
          validator(v) {
            const d = parseDate(v);
            if (!d) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            d.setHours(0, 0, 0, 0);
            return d >= today;
          },
          message: 'Reservation date cannot be in the past',
        },
      ],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      trim: true,
      validate: {
        validator(v) { return !isNaN(toMinutes(v)); },
        message: 'Start time must be a valid time',
      },
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      trim: true,
      validate: [
        {
          validator(v) { return !isNaN(toMinutes(v)); },
          message: 'End time must be a valid time',
        },
        {
          validator(v) { return toMinutes(v) > toMinutes(this.startTime); },
          message: 'End time must be after start time',
        },
      ],
    },
    attendees: {
      type: Number,
      required: [true, 'Number of attendees is required'],
      min: [1, 'At least 1 attendee is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    // ✅ MOVED: createdBy is now correctly inside the Schema object
    createdBy: {
      type: String,
      required: true, 
      trim: true,
    }
  },
  { timestamps: true } // Correctly placed as the second argument
);

reservationSchema.index({ hall: 1, date: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);