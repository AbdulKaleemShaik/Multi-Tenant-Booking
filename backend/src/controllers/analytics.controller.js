const mongoose = require('mongoose');
const Booking = require('../models/Booking.model');
const Payment = require('../models/Payment.model');
const User = require('../models/User.model');
const Service = require('../models/Service.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');


// GET /api/analytics/overview
const getOverview = catchAsync(async (req, res, next) => {
    const tenantId = new mongoose.Types.ObjectId(req.user.tenantId);
    const { startDate, endDate, staffId, status } = req.query;

    const now = new Date();
    // Default to last 30 days if no range provided
    const startObj = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    const endObj = endDate ? new Date(endDate) : new Date();

    // Growth comparison period (previous period of same length)
    const periodMs = endObj.getTime() - startObj.getTime();
    const prevStart = new Date(startObj.getTime() - periodMs);
    const prevEnd = new Date(startObj.getTime() - 1);

    const baseQuery = { tenantId, createdAt: { $gte: startObj, $lte: endObj } };
    if (staffId) baseQuery.staffId = new mongoose.Types.ObjectId(staffId);
    if (status) baseQuery.status = status;

    const [
        totalBookings, confirmedBookings, cancelledBookings, completedBookings,
        thisPeriodBookings, lastPeriodBookings,
        revenueData, totalCustomers, topServices, bookingsByDay,
        staffPerformance, couponStatsRaw, missedBookings
    ] = await Promise.all([
        Booking.countDocuments(baseQuery),
        Booking.countDocuments({ ...baseQuery, status: 'confirmed' }),
        Booking.countDocuments({ ...baseQuery, status: 'cancelled' }),
        Booking.countDocuments({ ...baseQuery, status: 'completed' }),

        Booking.countDocuments({ tenantId, createdAt: { $gte: startObj, $lte: endObj } }),
        Booking.countDocuments({ tenantId, createdAt: { $gte: prevStart, $lte: prevEnd } }),

        // Revenue this period
        Payment.aggregate([
            { $match: { tenantId, status: 'succeeded', createdAt: { $gte: startObj, $lte: endObj } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),

        // Unique customers
        Booking.distinct('customerId', baseQuery),

        // Top services
        Booking.aggregate([
            { $match: { ...baseQuery, status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: '$serviceId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
            { $unwind: '$service' },
            { $project: { name: '$service.name', color: '$service.color', count: 1 } },
        ]),

        // Bookings per day
        Booking.aggregate([
            {
                $match: {
                    tenantId,
                    bookingDate: { $gte: startObj, $lte: endObj },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$bookingDate' } },
                    count: { $sum: 1 },
                    revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmount', 0] } },
                },
            },
            { $sort: { _id: 1 } },
        ]),

        // Staff Performance - Detailed
        Booking.aggregate([
            { $match: { ...baseQuery } },
            { 
                $group: { 
                    _id: '$staffId', 
                    totalBookings: { $sum: 1 }, 
                    revenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                    missed: { 
                        $sum: { 
                            $cond: [
                                { 
                                    $and: [
                                        { $lt: ['$bookingDate', now] },
                                        { $in: ['$status', ['pending', 'confirmed']] }
                                    ] 
                                }, 
                                1, 0
                            ] 
                        } 
                    }
                } 
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
            { $unwind: '$staff' },
            { 
                $project: { 
                    name: '$staff.name', 
                    email: '$staff.email',
                    totalBookings: 1, 
                    revenue: 1, 
                    completed: 1, 
                    missed: 1,
                    reliabilityScore: {
                        $cond: [
                            { $gt: ['$totalBookings', 0] },
                            { $multiply: [{ $divide: ['$completed', '$totalBookings'] }, 100] },
                            0
                        ]
                    }
                } 
            },
            { $sort: { revenue: -1 } }
        ]),

        // Coupon Usage Statistics
        Booking.aggregate([
            { $match: { ...baseQuery, couponId: { $ne: null } } },
            { $group: { _id: null, totalDiscount: { $sum: '$discountAmount' }, count: { $sum: 1 } } }
        ]),

        // Missed Appointments
        Booking.countDocuments({
            ...baseQuery,
            bookingDate: { $lt: now },
            status: { $in: ['pending', 'confirmed'] }
        })
    ]);

    const monthlyRevenue = revenueData[0]?.total || 0;
    const couponStats = couponStatsRaw[0] || { totalDiscount: 0, count: 0 };

    const bookingGrowth = lastPeriodBookings > 0
        ? (((thisPeriodBookings - lastPeriodBookings) / lastPeriodBookings) * 100).toFixed(1)
        : 100;

    return sendSuccess(res, 200, 'Analytics fetched', {
        stats: {
            totalBookings: totalBookings || 0,
            confirmedBookings: confirmedBookings || 0,
            cancelledBookings: cancelledBookings || 0,
            completedBookings: completedBookings || 0,
            missedBookings: missedBookings || 0,
            thisPeriodBookings: thisPeriodBookings || 0,
            lastPeriodBookings: lastPeriodBookings || 0,
            bookingGrowth: Number(bookingGrowth) || 0,
            monthlyRevenue: monthlyRevenue || 0,
            totalCustomers: (totalCustomers || []).length,
        },
        topServices: topServices || [],
        bookingsByDay: bookingsByDay || [],
        staffPerformance: staffPerformance || [],
        couponStats: couponStats || { totalDiscount: 0, count: 0 },
    });
});

module.exports = { getOverview };
