require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('./src/models/Booking.model');
const Payment = require('./src/models/Payment.model');
const User = require('./src/models/User.model');

async function testAnalytics() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // Find a tenant-admin to simulate
        const admin = await User.findOne({ role: 'tenant_admin' });
        if (!admin) {
            console.log('No tenant admin found to test with');
            process.exit(1);
        }

        const tenantId = admin.tenantId;
        console.log(`Testing for Tenant ID: ${tenantId}`);

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const results = await Promise.all([
            Booking.countDocuments({ tenantId }),
            Booking.countDocuments({ tenantId, status: 'confirmed' }),
            Booking.countDocuments({ tenantId, status: 'cancelled' }),
            Booking.countDocuments({ tenantId, createdAt: { $gte: startOfMonth } }),
            Booking.countDocuments({ tenantId, createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }),
            Payment.aggregate([
                { $match: { tenantId, status: 'succeeded', createdAt: { $gte: startOfMonth } } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
            Booking.distinct('customerId', { tenantId }),
            Booking.aggregate([
                { $match: { tenantId, status: { $in: ['confirmed', 'completed'] } } },
                { $group: { _id: '$serviceId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 5 },
                { $lookup: { from: 'services', localField: '_id', foreignField: '_id', as: 'service' } },
                { $unwind: '$service' },
                { $project: { name: '$service.name', color: '$service.color', count: 1 } },
            ]),
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
            Booking.aggregate([
                { $match: { tenantId, status: { $in: ['confirmed', 'completed'] } } },
                { $group: { _id: '$staffId', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
                { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'staff' } },
                { $unwind: '$staff' },
                { $project: { name: '$staff.name', count: 1, revenue: 1 } },
                { $sort: { count: -1 } }
            ]),
            Booking.aggregate([
                { $match: { tenantId, couponId: { $ne: null } } },
                { $group: { _id: null, totalDiscount: { $sum: '$discountAmount' }, count: { $sum: 1 } } }
            ]),
        ]);

        console.log('--- RAW RESULTS ---');
        results.forEach((r, i) => console.log(`Result ${i}:`, JSON.stringify(r)));

        const [
            totalBookings, confirmedBookings, cancelledBookings,
            thisMonthBookings, lastMonthBookings,
            revenueData, totalCustomers, topServices, bookingsByDay,
            staffPerformance, couponStatsRaw
        ] = results;

        const monthlyRevenue = (revenueData && revenueData[0]) ? revenueData[0].total : 0;
        const couponStats = (couponStatsRaw && couponStatsRaw[0]) ? couponStatsRaw[0] : { totalDiscount: 0, count: 0 };
        const bookingGrowth = lastMonthBookings > 0
            ? (((thisMonthBookings - lastMonthBookings) / lastMonthBookings) * 100).toFixed(1)
            : 100;

        const finalStats = {
            totalBookings,
            confirmedBookings,
            cancelledBookings,
            thisMonthBookings,
            lastMonthBookings,
            bookingGrowth: Number(bookingGrowth),
            monthlyRevenue,
            totalCustomers: totalCustomers.length,
        };

        console.log('--- TEST RESULTS ---');
        console.log('STATS_JSON:', JSON.stringify(finalStats));
        console.log('COUPON_STATS_JSON:', JSON.stringify(couponStats));
        console.log('--- END TEST ---');

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testAnalytics();
