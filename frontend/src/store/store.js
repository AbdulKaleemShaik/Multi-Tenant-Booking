import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import tenantReducer from './tenantSlice';
import bookingReducer from './bookingSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tenant: tenantReducer,
        booking: bookingReducer,
    },
});
