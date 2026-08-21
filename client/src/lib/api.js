import axios from 'axios';
import { getToken, clearSession } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // A dead session should never leave the user staring at a broken screen.
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (window.location.pathname !== '/') window.location.replace('/');
    }
    return Promise.reject(error);
  },
);

/** Pulls the message out of the API's { error: { message } } envelope. */
export const errorMessage = (error, fallback = 'Something went wrong') => {
  const data = error?.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.error?.message || error?.message || fallback;
};

export default api;
