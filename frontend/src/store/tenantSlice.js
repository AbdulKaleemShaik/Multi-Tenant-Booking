import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    tenant: null,
    loading: false,
};

const tenantSlice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
        setTenant: (state, action) => { state.tenant = action.payload; },
        clearTenant: (state) => { state.tenant = null; },
        setLoading: (state, action) => { state.loading = action.payload; },
    },
});

export const { setTenant, clearTenant, setLoading } = tenantSlice.actions;
export default tenantSlice.reducer;
