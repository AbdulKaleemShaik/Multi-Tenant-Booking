const Booking = require('../models/Booking.model');
const Service = require('../models/Service.model');
const User = require('../models/User.model');
const Tenant = require('../models/Tenant.model');
const Coupon = require('../models/Coupon.model');
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
    let { serviceId, staffId, bookingDate, startTime, tenantId, notes, selectedAddons: addonNames } = req.body;
    if (!serviceId || !staffId || !bookingDate || !startTime) {
        return res.status(400).json({ success: false, message: 'serviceId, staffId, bookingDate, and startTime are required' });
    }

    // Force tenant isolation (users can only book in their own tenant context)
    if (req.user.role?.name !== 'super_admin') {
        tenantId = req.user.tenantId;
    }

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });

    // Handle addons
    let extraDuration = 0;
    let extraPrice = 0;
    const selectedAddons = [];

    if (addonNames && Array.isArray(addonNames)) {
        addonNames.forEach(name => {
            const addon = service.addons.find(a => a.name === name);
            if (addon) {
                selectedAddons.push({ name: addon.name, price: addon.price });
                extraPrice += addon.price;
                extraDuration += (addon.duration || 0);
            }
        });
    }

    // Calculate end time
    const [h, m] = startTime.split(':').map(Number);
    const buffer = service.bufferTime || 0;
    const totalDuration = service.duration + extraDuration + buffer;
    const endMins = h * 60 + m + totalDuration;
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
    let totalAmount = service.price + extraPrice;
    let discountAmount = 0;
    let couponId = null;

    // Apply coupon if provided
    if (req.body.couponCode) {
        const coupon = await Coupon.findOne({ 
            code: req.body.couponCode.toUpperCase(), 
            tenantId, 
            isActive: true 
        });

        if (coupon && new Date() <= coupon.expiryDate && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) && totalAmount >= coupon.minBookingAmount) {
            discountAmount = coupon.type === 'percentage' ? (totalAmount * coupon.value) / 100 : coupon.value;
            discountAmount = Math.min(discountAmount, totalAmount);
            couponId = coupon._id;
            
            // Increment coupon usage
            coupon.usedCount += 1;
            await coupon.save();
        }
    }

    const { recurrence } = req.body;
    let initialBooking;
    const isRecurring = recurrence?.isRecurring && recurrence?.count > 1 && recurrence?.frequency;

    if (isRecurring) {
        const bookingsToCreate = [];
        const baseDate = new Date(bookingDate);
        const firstBookingRef = generateRef();

        for (let i = 0; i < recurrence.count; i++) {
            const currentDate = new Date(baseDate);
            if (recurrence.frequency === 'weekly') {
                currentDate.setDate(baseDate.getDate() + (i * 7));
            } else if (recurrence.frequency === 'monthly') {
                currentDate.setMonth(baseDate.getMonth() + i);
            }

            // Check for conflict per date
            const conflict = await Booking.findOne({
                tenantId, staffId,
                bookingDate: currentDate,
                status: { $in: ['pending', 'confirmed'] },
                $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
            });

            if (conflict) {
                return res.status(409).json({ 
                    success: false, 
                    message: `Slot conflict on ${currentDate.toDateString()}. Please choose a different sequence or date.` 
                });
            }

            bookingsToCreate.push({
                tenantId, customerId: req.user._id, staffId, serviceId,
                bookingDate: currentDate, startTime, endTime,
                totalAmount, discountAmount, currency: service.currency,
                notes, bookingRef: i === 0 ? firstBookingRef : generateRef(), 
                status: 'pending', paymentStatus: 'unpaid',
                couponId, selectedAddons, intakeResponses: req.body.intakeResponses,
                recurrence: {
                    isRecurring: true,
                    frequency: recurrence.frequency,
                    count: recurrence.count,
                    parentBookingId: null // We'll link these after first one is created if needed, but for now BK ref links them
                }
            });
        }

        const created = await Booking.insertMany(bookingsToCreate);
        initialBooking = created[0];
    } else {
        initialBooking = await Booking.create({
            tenantId, customerId: req.user._id, staffId, serviceId,
            bookingDate: new Date(bookingDate), startTime, endTime,
            totalAmount, discountAmount, currency: service.currency,
            notes, bookingRef, status: 'pending', paymentStatus: 'unpaid',
            couponId, selectedAddons, intakeResponses: req.body.intakeResponses
        });
    }

    // Send confirmation email asynchronously (only for the first one for now to avoid spam)
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
            bookingRef: initialBooking.bookingRef,
            tenantName: tenant?.name,
        });
    } catch (emailErr) {
        console.error('Email send failed:', emailErr.message);
    }

    const populated = await initialBooking.populate([
        { path: 'serviceId', select: 'name duration price' },
        { path: 'staffId', select: 'name email' },
    ]);
    return sendSuccess(res, 201, isRecurring ? 'Recurring bookings created' : 'Booking created', populated);
});

// GET /api/bookings
// GET /api/bookings
const getBookings = catchAsync(async (req, res, next) => {
    const { status, from, to, staffId, page = 1, limit = 20 } = req.query;
    const query = {};

    const { getUserPoolCriteria } = require('../utils/userUtils');
    const poolCriteria = await getUserPoolCriteria(req.user);
    
    query.tenantId = req.user.tenantId;

    if (req.user.role?.name === 'customer') {
        query.customerId = req.user._id;
    } else {
        if (poolCriteria) {
            query.staffId = poolCriteria;
        }
        // If a specific staffId is requested, ensure it's within the allowed pool
        if (staffId) {
            if (poolCriteria) {
                const poolArray = Array.isArray(poolCriteria) ? poolCriteria : [poolCriteria];
                if (poolArray.includes(staffId) || (poolCriteria.$in && poolCriteria.$in.map(id => id.toString()).includes(staffId))) {
                     query.staffId = staffId;
                } else {
                     query.staffId = new require('mongoose').Types.ObjectId(); // Ensure empty result
                }
            } else {
                query.staffId = staffId;
            }
        }
    }
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
    const booking = await Booking.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
        .populate('serviceId', 'name duration price')
        .populate('staffId', 'name email')
        .populate('customerId', 'name email phone');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Customer check
    if (req.user.role?.name === 'customer' && booking.customerId._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    // Staff/Manager check
    if (['staff', 'manager'].includes(req.user.role?.name)) {
        const { getUserPoolCriteria } = require('../utils/userUtils');
        const poolCriteria = await getUserPoolCriteria(req.user);
        const poolArray = Array.isArray(poolCriteria) ? poolCriteria : (poolCriteria?.$in || [poolCriteria]);
        if (poolCriteria && !poolArray.map(id => id.toString()).includes(booking.staffId._id.toString())) {
            return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
        }
    }

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

    const booking = await Booking.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Customer check
    if (req.user.role?.name === 'customer' && booking.customerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
    }

    // Staff/Manager check
    if (['staff', 'manager'].includes(req.user.role?.name)) {
        const { getUserPoolCriteria } = require('../utils/userUtils');
        const poolCriteria = await getUserPoolCriteria(req.user);
        const poolArray = Array.isArray(poolCriteria) ? poolCriteria : (poolCriteria?.$in || [poolCriteria]);
        if (poolCriteria && !poolArray.map(id => id.toString()).includes(booking.staffId.toString())) {
            return res.status(403).json({ success: false, message: 'Not authorized to update this booking' });
        }
    }

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
            
            // Waitlist Notification Logic
            const Waitlist = require('../models/Waitlist.model');
            const waitlistEntries = await Waitlist.find({
                tenantId: booking.tenantId,
                staffId: booking.staffId,
                date: booking.bookingDate,
                status: 'waiting'
            }).populate('customerId', 'name email');

            if (waitlistEntries.length > 0) {
                console.log(`🔔 Notifying ${waitlistEntries.length} waitlist users about opening on ${booking.bookingDate}`);
                await Waitlist.updateMany(
                    { _id: { $in: waitlistEntries.map(e => e._id) } },
                    { status: 'notified', notifiedAt: new Date() }
                );
                // Here you would normally send an email to each:
                // waitlistEntries.forEach(e => sendWaitlistAlert(e.customerId.email, ...))
            }
        } catch (err) {
            console.error('Cancellation/Waitlist error:', err.message);
        }
    }

    return sendSuccess(res, 200, 'Booking status updated', booking);
});

module.exports = { createBooking, getBookings, getBooking, updateBookingStatus, generateRef };
