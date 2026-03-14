import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});

// Attach access token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
    failedQueue = [];
};

api.interceptors.response.use(
    (res) => res,
    async (error) => {
        const originalRequest = error.config;

        // Skip refresh logic for auth endpoints or if no retry needed
        const isAuthEndpoint = originalRequest.url?.includes('/auth/');
        const hasRefreshToken = !!localStorage.getItem('refreshToken');

        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !isAuthEndpoint &&
            hasRefreshToken
        ) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const { data } = await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/auth/refresh`, { refreshToken });
                localStorage.setItem('accessToken', data.data.accessToken);
                localStorage.setItem('refreshToken', data.data.refreshToken);
                processQueue(null, data.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                localStorage.clear();
                // Only redirect if not already on the login page
                if (!window.location.pathname.includes('/login')) {
                    window.location.href = '/login';
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default api;
