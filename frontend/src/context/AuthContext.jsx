import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fairshare_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fairshare_token') || null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('fairshare_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('fairshare_user', JSON.stringify(res.data.user));
          }
        } catch (error) {
          console.error('Session expired or invalid:', error);
          logout(false);
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('fairshare_token', res.data.token);
        localStorage.setItem('fairshare_user', JSON.stringify(res.data.user));
        showToast('Đăng nhập thành công! Chào mừng bạn trở lại.', 'success');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const register = async (name, email, password, avatar) => {
    try {
      const res = await api.post('/auth/register', { name, email, password, avatar });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('fairshare_token', res.data.token);
        localStorage.setItem('fairshare_user', JSON.stringify(res.data.user));
        showToast('Tạo tài khoản thành công! Khám phá FairShare ngay.', 'success');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const logout = (showNotice = true) => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('fairshare_token');
    localStorage.removeItem('fairshare_user');
    if (showNotice) {
      showToast('Đã đăng xuất thành công', 'info');
    }
  };

  const updateProfile = async (userData) => {
    try {
      const res = await api.put('/auth/profile', userData);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('fairshare_user', JSON.stringify(res.data.user));
        showToast('Cập nhật hồ sơ thành công', 'success');
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Cập nhật thất bại';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
