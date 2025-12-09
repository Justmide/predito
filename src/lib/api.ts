export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://predito-middleware.onrender.com/api/v1';
export const AUTH_API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL || `${API_BASE_URL}/auth`;

export default {
  API_BASE_URL,
  AUTH_API_BASE_URL,
};
// 'http://localhost:4000/api/v1'||