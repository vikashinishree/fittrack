import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use(c => {
  const t = localStorage.getItem('token');
  if (t) c.headers.Authorization = 'Bearer ' + t;
  return c;
});
export const day = (d = new Date()) => d.toLocaleDateString('en-CA'); // local YYYY-MM-DD
export const sum = (a, k) => a.reduce((n, x) => n + (x[k] || 0), 0);
export const errMsg = e => e.response?.data?.message || 'Something went wrong. Try again.';
export default api;
