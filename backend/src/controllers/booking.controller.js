const Booking = require('../models/Booking.model');
const Service = require('../models/Service.model');
const User = require('../models/User.model');
const Tenant = require('../models/Tenant.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { sendBookingConfirmation, sendBookingCancellation } = require('../services/email.service');
const catchAsync = require('../utils/catchAsync');


const generateRef = () => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `BK-${Date.now().toString(36).toUpperCase()}-${rand}`;
};

// POST /api/bookings
// POST /api/bookings
const createBooking = catchAsync(async (req, res, next) => {
    const { serviceId, staffId, bookingDate, startTime, tenantId, notes } = req.body;
    if (!serviceId || !staffId || !bookingDate || !startTime) {
        return res.status(400).json({ success: false, message: 'serviceId, staffId, bookingDate, and startTime are required' });
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    // Calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const endMins = h * 60 + m + service.duration;
    const endTime = `${String(Math.floor(endMins / 60)).padStart(2, '0')}:${String(endMins % 60).padStart(2, '0')}`;

    // Check for conflict
    const conflict = await Booking.findOne({
        tenantId, staffId,
        bookingDate: new Date(bookingDate),
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
        ],
    });
    if (conflict) return res.status(409).json({ success: false, message: 'This time slot is already booked' });

    const bookingRef = generateRef();
    const booking = await Booking.create({
        tenantId, customerId: req.user._id, staffId, serviceId,
        bookingDate: new Date(bookingDate), startTime, endTime,
        totalAmount: service.price, currency: service.currency,
        notes, bookingRef, status: 'pending', paymentStatus: 'unpaid',
    });

    // Send confirmation email asynchronously
    try {
        const [staff, tenant] = await Promise.all([
            User.findById(staffId).select('name'),
            Tenant.findById(tenantId).select('name'),
        ]);
        await sendBookingConfirmation({
            to: req.user.email,
            customerName: req.user.name,
            serviceName: service.name,
            staffName: staff?.name,
            bookingDate, startTime,
            bookingRef,
            tenantName: tenant?.name,
        });
    } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
    }

    const populated = await booking.populate([
        { path: 'serviceId', select: 'name duration price' },
        { path: 'staffId', select: 'name email' },
    ]);
    return sendSuccess(res, 201, 'Booking created', populated);
});

// GET /api/bookings
// GET /api/bookings
const getBookings = catchAsync(async (req, res, next) => {
    const { status, from, to, staffId, page = 1, limit = 20 } = req.query;
    const query = {};

    if (req.user.role === 'customer') {
        query.customerId = req.user._id;
    } else if (req.user.role === 'staff') {
        query.staffId = req.user._id;
        query.tenantId = req.user.tenantId;
    } else {
        query.tenantId = req.user.tenantId;
    }

    if (status) query.status = status;
    if (staffId && req.user.role !== 'staff') query.staffId = staffId;
    if (from || to) {
        query.bookingDate = {};
        if (from) query.bookingDate.$gte = new Date(from);
        if (to) query.bookingDate.$lte = new Date(to);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
        Booking.find(query)
            .populate('serviceId', 'name duration price color')
            .populate('staffId', 'name email avatar')
            .populate('customerId', 'name email phone')
            .sort({ bookingDate: -1, startTime: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Booking.countDocuments(query),
    ]);

    return res.status(200).json({ success: true, data: bookings, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
});

// GET /api/bookings/:id
// GET /api/bookings/:id
const getBooking = catchAsync(async (req, res, next) => {
    const booking = await Booking.findById(req.params.id)
        .populate('serviceId', 'name duration price')
        .populate('staffId', 'name email')
        .populate('customerId', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    return sendSuccess(res, 200, 'Booking fetched', booking);
});

// PUT /api/bookings/:id/status
// PUT /api/bookings/:id/status
const updateBookingStatus = catchAsync(async (req, res, next) => {
    const { status, cancellationReason } = req.body;
    const validTransitions = {
        pending: ['confirmed', 'cancelled'],
        confirmed: ['completed', 'cancelled', 'no_show'],
    };

    const booking = await Booking.findOne({ _id: req.params.id });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (!validTransitions[booking.status]?.includes(status)) {
        return res.status(400).json({ success: false, message: `Cannot transition from '${booking.status}' to '${status}'` });
    }

    booking.status = status;
    if (cancellationReason) booking.cancellationReason = cancellationReason;
    await booking.save();

    // Send cancellation email
    if (status === 'cancelled') {
        try {
            const [customer, tenant] = await Promise.all([
                User.findById(booking.customerId).select('name email'),
                Tenant.findById(booking.tenantId).select('name'),
            ]);
            await sendBookingCancellation({ to: customer.email, customerName: customer.name, bookingRef: booking.bookingRef, tenantName: tenant?.name, reason: cancellationReason });
        } catch (_) { }
    }

    return sendSuccess(res, 200, 'Booking status updated', booking);
});

module.exports = { createBooking, getBookings, getBooking, updateBookingStatus };
