import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <i className="fas fa-feather"></i>
          <span>Poultry Marketplace</span>
        </Link>

        <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`}>
          <div className="navbar-nav">
            <Link 
              to="/" 
              className={`nav-link ${isActivePath('/') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/browse" 
              className={`nav-link ${isActivePath('/browse') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Browse
            </Link>
            <Link 
              to="/following-feed" 
              className={`nav-link ${isActivePath('/following-feed') ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Following
            </Link>
            {user && (
              <>
                <Link 
                  to="/create-listing" 
                  className={`nav-link ${isActivePath('/create-listing') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sell
                </Link>
                <Link 
                  to="/messages" 
                  className={`nav-link ${isActivePath('/messages') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                <Link 
                  to="/admin" 
                  className={`nav-link ${isActivePath('/admin') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              </>
            )}
          </div>

          <div className="navbar-actions">
            {user ? (
              <div className="user-menu">
                <Link 
                  to="/profile" 
                  className={`nav-link user-link ${isActivePath('/profile') ? 'active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fas fa-user"></i>
                  <span className="user-name">{user.name}</span>
                </Link>
                <button className="btn btn-outline logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to="/login" 
                  className="btn btn-outline"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn btn-primary"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;