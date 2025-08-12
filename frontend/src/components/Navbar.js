import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            🐔 Poultry Marketplace
          </Link>

          {/* Desktop Navigation */}
          <div className="navbar-nav desktop-nav">
            <Link 
              to="/browse" 
              className={`nav-link ${isActive('/browse') ? 'active' : ''}`}
            >
              Browse Listings
            </Link>
            <Link 
              to="/create-listing" 
              className={`nav-link ${isActive('/create-listing') ? 'active' : ''}`}
            >
              Create Listing
            </Link>
            {user && (
              <Link 
                to="/messages" 
                className={`nav-link ${isActive('/messages') ? 'active' : ''}`}
              >
                Messages
              </Link>
            )}
          </div>

          {/* User Menu */}
          <div className="navbar-user desktop-nav">
            {user ? (
              <div className="user-menu">
                <Link to="/profile" className="user-profile">
                  <span className="user-avatar">👤</span>
                  <span className="user-name">{user.name}</span>
                </Link>
                <button onClick={handleLogout} className="btn btn-outline btn-sm">
                  Logout
                </button>
              </div>
            ) : (
              <div className="auth-links">
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="mobile-nav">
            <Link 
              to="/browse" 
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Listings
            </Link>
            <Link 
              to="/create-listing" 
              className="mobile-nav-link"
              onClick={() => setIsMenuOpen(false)}
            >
              Create Listing
            </Link>
            {user && (
              <Link 
                to="/messages" 
                className="mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Messages
              </Link>
            )}
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="mobile-nav-link mobile-logout"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="mobile-nav-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;