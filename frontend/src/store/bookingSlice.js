import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    bookings: [],
    currentBooking: null,
    selectedService: null,
    selectedStaff: null,
    selectedDate: null,
    selectedSlot: null,
};

const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        setBookings: (state, action) => { state.bookings = action.payload; },
        setCurrentBooking: (state, action) => { state.currentBooking = action.payload; },
        setSelectedService: (state, action) => { state.selectedService = action.payload; },
        setSelectedStaff: (state, action) => { state.selectedStaff = action.payload; },
        setSelectedDate: (state, action) => { state.selectedDate = action.payload; },
        setSelectedSlot: (state, action) => { state.selectedSlot = action.payload; },
        resetBookingFlow: (state) => {
            state.selectedService = null; state.selectedStaff = null;
            state.selectedDate = null; state.selectedSlot = null;
            state.currentBooking = null;
        },
    },
});

export const {
    setBookings, setCurrentBooking, setSelectedService,
    setSelectedStaff, setSelectedDate, setSelectedSlot, resetBookingFlow,
} = bookingSlice.actions;
export default bookingSlice.reducer;
