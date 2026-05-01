const { hasScheduleConflict } = require('../utils/conflictDetection');


const isValidTimeStr = (v) => {
  if (!v || typeof v !== 'string') return false;
  return /^\d{1,2}:\d{2}$/.test(v) || /^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(v);
};

const isPastDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
};

const toMinutes = (timeStr) => {
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

// NEU operating hours: 7:00 AM – 8:00 PM
const OPEN_MINUTES  = 7 * 60;
const CLOSE_MINUTES = 20 * 60;

const validateReservation = async (req, res, next) => {
  const { eventName, hall, date, startTime, endTime, attendees, organization } = req.body;
  const errors = [];

  // ── 1. Required field presence ───────────────────────────────────────────
  if (!eventName || eventName.trim().length < 3) {
    errors.push('Event name is required and must be at least 3 characters');
  }
  if (!hall || !hall.trim()) {
    errors.push('Hall is required');
  }
  if (!date || !date.trim()) {
    errors.push('Date is required');
  }
  if (!startTime) {
    errors.push('Start time is required');
  }
  if (!endTime) {
    errors.push('End time is required');
  }
  if (attendees === undefined || attendees === null || attendees === '') {
    errors.push('Number of attendees is required');
  } else if (!Number.isInteger(Number(attendees)) || Number(attendees) < 1) {
    errors.push('Attendees must be a positive whole number');
  }

  // Organization: required for non-Student-Org roles via body
  if (req.user?.role !== 'Student Org' && !organization?.trim()) {
    errors.push('Organization is required');
  }

  // Return early if basic fields are missing — time checks below would throw
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // ── 2. Date validation ───────────────────────────────────────────────────
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    errors.push('Date must be a valid date string (YYYY-MM-DD)');
  } else if (isPastDate(date)) {
    errors.push('Reservation date cannot be in the past');
  }

  // ── 3. Time format validation ────────────────────────────────────────────
  if (!isValidTimeStr(startTime)) {
    errors.push('Start time must be in HH:MM or HH:MM AM/PM format');
  }
  if (!isValidTimeStr(endTime)) {
    errors.push('End time must be in HH:MM or HH:MM AM/PM format');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // ── 4. Time logic validation ─────────────────────────────────────────────
  const startMins = toMinutes(startTime);
  const endMins   = toMinutes(endTime);

  if (endMins <= startMins) {
    errors.push('End time must be after start time');
  }
  if (startMins < OPEN_MINUTES || endMins > CLOSE_MINUTES) {
    errors.push('Reservations must be within operating hours (7:00 AM – 10:00 PM)');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // ── 5. Schedule conflict detection ───────────────────────────────────────
  try {
    const excludeId = req.params?.id || null;

    const conflict = await hasScheduleConflict(
      hall.trim(),
      date.trim(),
      startTime.trim(),
      endTime.trim(),
      excludeId
    );

    if (conflict) {
      return res.status(409).json({
        error: 'Schedule conflict',
        message: `"${conflict.eventName}" is already booked in ${conflict.hall} on ${conflict.date} from ${conflict.startTime} to ${conflict.endTime}`,
        conflictingReservation: {
          requestId: conflict.requestId,
          eventName: conflict.eventName,
          date: conflict.date,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          status: conflict.status,
        },
      });
    }
  } catch (err) {
    console.error('Conflict detection error:', err);
    return res.status(500).json({ error: 'Unable to check for scheduling conflicts' });
  }

  next();
};

module.exports = { validateReservation };
