/**
 * Generate available time slots from a staff schedule for a given date.
 * @param {string} startTime - "09:00"
 * @param {string} endTime - "17:00"
 * @param {number} slotDuration - in minutes
 * @param {string} breakStart - "13:00" or null
 * @param {string} breakEnd - "14:00" or null
 * @param {Array} existingBookings - [{ startTime: "10:00", endTime: "10:30" }]
 * @returns {Array} - ["09:00","09:30",...]
 */
const generateTimeSlots = (startTime, endTime, slotDuration, breakStart, breakEnd, existingBookings = []) => {
    const slots = [];
    const toMinutes = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };
    const toTime = (mins) => {
        const h = Math.floor(mins / 60).toString().padStart(2, '0');
        const m = (mins % 60).toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    let current = toMinutes(startTime);
    const end = toMinutes(endTime);
    const bStart = breakStart ? toMinutes(breakStart) : null;
    const bEnd = breakEnd ? toMinutes(breakEnd) : null;

    const bookedRanges = existingBookings.map((b) => ({
        start: toMinutes(b.startTime),
        end: toMinutes(b.endTime),
    }));

    while (current + slotDuration <= end) {
        const slotEnd = current + slotDuration;

        // Skip break time
        if (bStart && bEnd && current < bEnd && slotEnd > bStart) {
            current = bEnd;
            continue;
        }

        // Check if overlaps with existing booking
        const isBooked = bookedRanges.some((r) => current < r.end && slotEnd > r.start);

        if (!isBooked) {
            slots.push(toTime(current));
        }

        current += slotDuration;
    }

    return slots;
};

module.exports = { generateTimeSlots };
