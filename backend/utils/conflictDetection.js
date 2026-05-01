const Reservation = require('../models/Reservation');
/**
 * Parse "HH:MM" or "HH:MM AM/PM" into total minutes since midnight.
 */
const toMinutes = (timeStr) => {
  if (!timeStr) return NaN;

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

/**
 * Returns the first conflicting reservation, or null if the slot is free.
 *
 * Overlap rule (standard interval overlap):
 *   existing.start < newEnd  AND  existing.end > newStart
 *
 * @param {string}  hall        - Hall name (String field in the schema)
 * @param {string}  date        - "YYYY-MM-DD"
 * @param {string}  startTime   - "HH:MM" or "HH:MM AM/PM"
 * @param {string}  endTime     - "HH:MM" or "HH:MM AM/PM"
 * @param {string}  [excludeId] - Reservation _id or requestId to skip (for edits)
 * @returns {Promise<object|null>}
 */
const hasScheduleConflict = async (hall, date, startTime, endTime, excludeId = null) => {
  const newStart = toMinutes(startTime);
  const newEnd   = toMinutes(endTime);

  if (isNaN(newStart) || isNaN(newEnd)) {
    throw new Error('hasScheduleConflict received unparseable time values');
  }

  // Pull all active reservations for this hall on this date
  const existing = await Reservation.find({
    hall,
    date,
    status: { $in: ['Pending', 'Approved'] },
  }).lean();

  for (const res of existing) {
    // Skip the reservation being edited
    if (excludeId) {
      const idStr = String(excludeId);
      if (String(res._id) === idStr || res.requestId === idStr) continue;
    }

    const exStart = toMinutes(res.startTime);
    const exEnd   = toMinutes(res.endTime);

    if (exStart < newEnd && exEnd > newStart) {
      return res;
    }
  }

  return null;
};

module.exports = { hasScheduleConflict };
