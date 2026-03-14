const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
    {
        tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
        bookingDate: { type: Date, required: true },
        startTime: { type: String, required: true }, // "10:00"
        endTime: { type: String, required: true },   // "10:30"
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no_show'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },
        totalAmount: { type: Number, required: true },
        currency: { type: String, default: 'INR' },
        notes: { type: String },
        cancellationReason: { type: String },
        bookingRef: { type: String, unique: true }, // e.g., BK-20240314-XXXX
    },
    { timestamps: true }
);

bookingSchema.index({ tenantId: 1, bookingDate: 1 });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ staffId: 1, bookingDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
