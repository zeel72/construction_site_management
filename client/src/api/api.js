import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Auto-fix if user forgot to append /api in their deployment environment variables
if (baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}
if (!baseURL.endsWith('/api')) {
  baseURL += '/api';
}

// Create an Axios instance with base URL
const api = axios.create({
  baseURL,
});

// Add a request interceptor to attach the JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('csms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
