import axios from 'axios';

export const TOKEN_KEY = 'formly_access_token';

const api = axios.create({
    baseURL: '/api',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export function validationErrors(error) {
    return error.response?.data?.errors ?? {};
}

export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
    return error.response?.data?.message ?? fallback;
}

export default api;
