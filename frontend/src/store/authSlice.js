import { createSlice } from '@reduxjs/toolkit';

const stored = localStorage.getItem('user');
const initialState = {
    user: stored ? JSON.parse(stored) : null,
    accessToken: localStorage.getItem('accessToken') || null,
    isAuthenticated: !!localStorage.getItem('accessToken'),
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, accessToken, refreshToken } = action.payload;
            state.user = user;
            state.accessToken = accessToken;
            state.isAuthenticated = true;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.isAuthenticated = false;
            localStorage.clear();
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            localStorage.setItem('user', JSON.stringify(state.user));
        },
    },
});

export const { setCredentials, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
