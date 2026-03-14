const Booking = require('../models/Booking.model');
const Payment = require('../models/Payment.model');
const User = require('../models/User.model');
const Service = require('../models/Service.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');


// GET /api/analytics/overview
const getOverview = catchAsync(async (req, res, next) => {
    const tenantId = req.user.tenantId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
        totalBookings, confirmedBookings, cancelledBookings,
        thisMonthBookings, lastMonthBookings,
        revenueData, totalCustomers, topServices, bookingsByDay
    ] = await Promise.all([
        Booking.countDocuments({ tenantId }),
        Booking.countDocuments({ tenantId, status: 'confirmed' }),
        Booking.countDocuments({ tenantId, status: 'cancelled' }),
        Booking.countDocuments({ tenantId, createdAt: { $gte: startOfMonth } }),
        Booking.countDocuments({ tenantId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),

        // Revenue this month
        Payment.aggregate([
            { $match: { tenantId, status: 'succeeded', createdAt: { $gte: startOfMonth } } },
            { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),

        // Unique customers
        Booking.distinct('customerId', { tenantId }),

        // Top services
        Booking.aggregate([
            { $match: { tenantId, status: { $in: ['confirmed', 'completed'] } } },
            { $group: { _id: '$serviceId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
            { $unwind: '$service' },
            { $project: { name: '$service.name', color: '$service.color', count: 1 } },
        ]),

        // Bookings per day last 30 days
        Booking.aggregate([
            {
                $match: {
                    tenantId,
                    bookingDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
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
    ]);

    const monthlyRevenue = revenueData[0]?.total || 0;
    const bookingGrowth = lastMonthBookings > 0
        ? (((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(1)
        : 100;

    return sendSuccess(res, 200, 'Analytics fetched', {
        stats: {
            totalBookings,
            confirmedBookings,
            cancelledBookings,
            thisMonthBookings,
            lastMonthBookings,
            bookingGrowth: Number(bookingGrowth),
            monthlyRevenue,
            totalCustomers: totalCustomers.length,
        },
        topServices,
        bookingsByDay,
    });
});

module.exports = { getOverview };
