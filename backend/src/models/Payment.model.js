const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        stripePaymentIntentId: { type: String },
        stripeChargeId: { type: String },
        amount: { type: Number, required: true },
        currency: { type: String, default: 'inr' },
        status: {
            type: String,
            enum: ['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'],
            default: 'pending',
        },
        refundAmount: { type: Number },
        refundReason: { type: String },
        metadata: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

paymentSchema.index({ tenantId: 1 });
paymentSchema.index({ bookingId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
