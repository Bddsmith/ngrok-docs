import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAuth = () => {
      const adminAuth = localStorage.getItem('admin_authenticated');
      const loginTime = localStorage.getItem('admin_login_time');
      
      if (adminAuth === 'true' && loginTime) {
        // Check if session is still valid (24 hours)
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          setIsAuthenticated(true);
        } else {
          // Session expired
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_username');
          localStorage.removeItem('admin_login_time');
          setIsAuthenticated(false);
          navigate('/admin-login');
        }
      } else {
        setIsAuthenticated(false);
        navigate('/admin-login');
      }
      
      setLoading(false);
    };

    checkAdminAuth();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_login_time');
    setIsAuthenticated(false);
    navigate('/admin-login');
  };

  return { isAuthenticated, loading, logout };
};

export const getAdminUsername = () => {
  return localStorage.getItem('admin_username') || 'Admin';
};