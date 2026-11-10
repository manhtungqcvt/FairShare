import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor để tự động gắn Authorization Header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fairshare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý lỗi 401 hết hạn phiên
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Nếu không phải trang auth, xóa token và chuyển về trang login
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('fairshare_token');
        localStorage.removeItem('fairshare_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
