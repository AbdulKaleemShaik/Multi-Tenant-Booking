const mongoose = require('mongoose');
const Review = require('../models/Review.model');
const Booking = require('../models/Booking.model');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

// Create a review
// POST /api/reviews
exports.createReview = catchAsync(async (req, res, next) => {
    const { bookingId, rating, comment } = req.body;
    const customerId = req.user.id;

    // 1. Verify booking exists and belongs to user
    const booking = await Booking.findOne({ _id: bookingId, customerId });
    if (!booking) {
        return sendError(res, 404, 'Booking not found or unauthorized');
    }

    // 2. Verify booking is completed (or confirmed if we allow early reviews)
    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
        return sendError(res, 400, 'You can only review completed or confirmed bookings');
    }

    // 3. Check if review already exists
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
        return sendError(res, 400, 'You have already reviewed this booking');
    }

    // 4. Create review
    const review = await Review.create({
        bookingId,
        tenantId: booking.tenantId,
        customerId,
        serviceId: booking.serviceId,
        staffId: booking.staffId,
        rating,
        comment
    });

    return sendSuccess(res, 201, 'Review submitted successfully', review);
});

// Get reviews for a tenant
// GET /api/reviews/tenant/:tenantId
exports.getTenantReviews = catchAsync(async (req, res, next) => {
    const { tenantId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
        return sendError(res, 400, 'Invalid tenant ID');
    }

    const reviews = await Review.find({ tenantId, isPublic: true })
        .populate('customerId', 'name')
        .populate('serviceId', 'name')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total = await Review.countDocuments({ tenantId, isPublic: true });

    // Calculate average rating
    const stats = await Review.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), isPublic: true } },
        { $group: { _id: null, averageRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    return sendSuccess(res, 200, 'Reviews fetched', {
        reviews,
        pagination: { total, page, limit, pages: Math.ceil(total / Number(limit)) },
        stats: stats[0] || { averageRating: 0, count: 0 }
    });
});
