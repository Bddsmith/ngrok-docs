import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for saved token on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const savedToken = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('user_data');
      
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.post(`${backendURL}/api/auth/login`, {
        email,
        password,
      });

      const { token: authToken, user_id } = response.data;

      // Get user details
      const userResponse = await axios.get(`${backendURL}/api/users/${user_id}`);
      const userData = userResponse.data;

      // Save to storage
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_data', JSON.stringify(userData));

      setToken(authToken);
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.post(`${backendURL}/api/auth/register`, userData);

      const { token: authToken, user_id } = response.data;

      // Get user details
      const userResponse = await axios.get(`${backendURL}/api/users/${user_id}`);
      const newUserData = userResponse.data;

      // Save to storage
      localStorage.setItem('auth_token', authToken);
      localStorage.setItem('user_data', JSON.stringify(newUserData));

      setToken(authToken);
      setUser(newUserData);

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Registration failed' 
      };
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};