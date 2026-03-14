const mongoose = require('mongoose');
const Coupon = require('./src/models/Coupon.model');
const Tenant = require('./src/models/Tenant.model');
require('dotenv').config();

const seedCoupon = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const tenant = await Tenant.findOne({ slug: 'demo' });
        if (!tenant) {
            console.log('Demo tenant not found. Please run seed.js first.');
            process.exit(1);
        }

        await Coupon.deleteMany({ code: 'SAVE20', tenantId: tenant._id });

        const coupon = await Coupon.create({
            code: 'SAVE20',
            type: 'percentage',
            value: 20,
            minBookingAmount: 100,
            expiryDate: new Date('2026-12-31'),
            usageLimit: 100,
            tenantId: tenant._id,
            isActive: true
        });

        console.log('✅ Seeded coupon:', coupon.code);
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedCoupon();
