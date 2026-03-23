import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration/401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Avoid redirecting on the login page itself
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

/* --- Authentication --- */
export const register = async (fullname, email, password) => {
    const response = await api.post('/auth/register', { fullname, email, password });
    return response.data;
};

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
};

export const getMe = async () => {
    const response = await api.get('/auth/me');
    return response.data;
};

/* --- Scans --- */
export const getScans = async () => {
    const response = await api.get('/scans/');
    return response.data; // Expected output format: array or object holding an array
};

export const getScanDetails = async (id) => {
    const response = await api.get(`/scans/${id}`);
    return response.data;
};

export const startScan = async (url, scanType) => {
    const response = await api.post('/scans/', { url, scanType });
    return response.data;
};

export const deleteScan = async (id) => {
    const response = await api.delete(`/scans/${id}`);
    return response.data;
};

export default api;
