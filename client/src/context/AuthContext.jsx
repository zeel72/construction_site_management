import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../api/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('csms_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('csms_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('csms_token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.error || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      localStorage.setItem('csms_token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      const data = error.response?.data;
      let msg = data?.error || 'Registration failed';
      
      // Extract specific validation messages if they exist
      if (data?.errors && data.errors.length > 0) {
        msg = data.errors.map(err => err.message).join(', ');
      }
      
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('csms_token');
    setUser(null);
    toast.info('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
