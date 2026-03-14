require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const tenantRoutes = require('./src/routes/tenant.routes');
const serviceRoutes = require('./src/routes/service.routes');
const staffRoutes = require('./src/routes/staff.routes');
const scheduleRoutes = require('./src/routes/schedule.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const couponRoutes = require('./src/routes/coupon.routes');
const reviewRoutes = require('./src/routes/review.routes');
const absenceRoutes = require('./src/routes/staffAbsence.routes');
const waitlistRoutes = require('./src/routes/waitlist.routes');
const roleRoutes = require('./src/routes/role.routes');
const seedRoles = require('./src/utils/seedRoles');

const app = express();

const compression = require('compression');

// HTTP Request Logging
console.log('📝 Initializing API Request Logging...');
app.use(morgan('dev'));
app.use(compression()); // Compress all responses

// 1. Connect DB
connectDB().then(() => {
    seedRoles();
});

// 2. Stripe webhook needs raw body — must come BEFORE express.json
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// 3. Security & Global middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

app.use(express.json()); // Body parser, reading data from body into req.body
app.use(express.urlencoded({ extended: true }));

// 4. Routes
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/roles', roleRoutes);

// 5. Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 6. 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

const globalErrorHandler = require('./src/controllers/error.controller');

// 7. Global error handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
