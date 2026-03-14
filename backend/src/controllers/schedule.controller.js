const Schedule = require('../models/Schedule.model');
const Booking = require('../models/Booking.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { generateTimeSlots } = require('../utils/generateSlots');
const catchAsync = require('../utils/catchAsync');


// GET /api/schedules
const getSchedules = catchAsync(async (req, res, next) => {
    const { staffId } = req.query;
    const query = { tenantId: req.user?.tenantId || req.query.tenantId };
    if (staffId) query.staffId = staffId;
    const schedules = await Schedule.find(query).populate('staffId', 'name email avatar');
    return sendSuccess(res, 200, 'Schedules fetched', schedules);
});

// POST /api/schedules
const createSchedule = catchAsync(async (req, res, next) => {
    const { staffId, dayOfWeek, startTime, endTime, slotDuration, breakStart, breakEnd } = req.body;
    if (!staffId || dayOfWeek === undefined || !startTime || !endTime) {
        return res.status(400).json({ success: false, message: 'staffId, dayOfWeek, startTime, endTime are required' });
    }
    const schedule = await Schedule.create({
        tenantId: req.user.tenantId, staffId, dayOfWeek, startTime, endTime, slotDuration, breakStart, breakEnd,
    });
    return sendSuccess(res, 201, 'Schedule created', schedule);
});

// PUT /api/schedules/:id
const updateSchedule = catchAsync(async (req, res, next) => {
    const schedule = await Schedule.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId },
        req.body,
        { new: true }
    );
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    return sendSuccess(res, 200, 'Schedule updated', schedule);
});

// DELETE /api/schedules/:id
const deleteSchedule = catchAsync(async (req, res, next) => {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!schedule) return res.status(404).json({ success: false, message: 'Schedule not found' });
    return sendSuccess(res, 200, 'Schedule deleted');
});

// GET /api/schedules/available-slots?staffId=&serviceId=&date=&tenantId=
const getAvailableSlots = catchAsync(async (req, res, next) => {
    const { staffId, date, tenantId } = req.query;
    if (!staffId || !date) return res.status(400).json({ success: false, message: 'staffId and date are required' });

    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();

    const schedule = await Schedule.findOne({ tenantId, staffId, dayOfWeek, isActive: true });
    if (!schedule) return sendSuccess(res, 200, 'No schedule for this day', { slots: [] });

    // Get existing bookings for that day
    const startOfDay = new Date(bookingDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(bookingDate.setHours(23, 59, 59, 999));
    const existingBookings = await Booking.find({
        tenantId,
        staffId,
        bookingDate: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['pending', 'confirmed'] },
    }).select('startTime endTime');

    const slots = generateTimeSlots(
        schedule.startTime,
        schedule.endTime,
        schedule.slotDuration || 30,
        schedule.breakStart,
        schedule.breakEnd,
        existingBookings
    );

    return sendSuccess(res, 200, 'Available slots fetched', { slots, schedule });
});

module.exports = { getSchedules, createSchedule, updateSchedule, deleteSchedule, getAvailableSlots };
