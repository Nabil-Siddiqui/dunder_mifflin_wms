import axios from 'axios';

// ============================================================
// API Service
// ============================================================
// Central Axios instance used by the entire frontend. Handles:
//   - base URL (relative "/api", forwarded to the backend by
//     the Vite dev server proxy configured in vite.config.js)
//   - automatically attaching the JWT to every outgoing request
//   - automatically logging the user out if the token is
//     rejected/expired (401 response)
// ============================================================

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- Request interceptor: attach token from localStorage, if present ---
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('dm_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Response interceptor: handle expired/invalid tokens globally ---
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('dm_token');
            localStorage.removeItem('dm_user');
            // Redirect to login. A full reload here is intentional and
            // simple: it guarantees all in-memory app state is cleared.
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;