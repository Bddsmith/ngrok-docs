import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMyListings();
    }
  }, [user]);

  const loadMyListings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await listingsAPI.getUserListings(user.id);
      setMyListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <div className="login-prompt">
            <div className="login-prompt-icon">👤</div>
            <h2 className="login-prompt-title">Login Required</h2>
            <p className="login-prompt-text">Please log in to view your profile</p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              Log In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-container">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              👤
            </div>
            
            <div className="profile-info">
              <h1 className="profile-name">{user.name}</h1>
              <p className="profile-email">{user.email}</p>
              <div className="profile-location">
                <span className="location-icon">📍</span>
                <span>{user.location}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-number">{myListings.length}</div>
              <div className="stat-label">Active Listings</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-number">
                {formatDate(user.created_at)}
              </div>
              <div className="stat-label">Member Since</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="profile-actions">
            <h2 className="section-title">Quick Actions</h2>
            
            <div className="action-list">
              <Link to="/create-listing" className="action-item">
                <div className="action-icon">➕</div>
                <div className="action-content">
                  <h3 className="action-title">Create New Listing</h3>
                  <p className="action-description">List your poultry, coops, or cages</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>

              <Link to="/messages" className="action-item">
                <div className="action-icon">💬</div>
                <div className="action-content">
                  <h3 className="action-title">Messages</h3>
                  <p className="action-description">View your conversations</p>
                </div>
                <div className="action-arrow">→</div>
              </Link>

              <button onClick={handleLogout} className="action-item logout-action">
                <div className="action-icon">🚪</div>
                <div className="action-content">
                  <h3 className="action-title">Logout</h3>
                  <p className="action-description">Sign out of your account</p>
                </div>
                <div className="action-arrow">→</div>
              </button>
            </div>
          </div>

          {/* My Listings */}
          <div className="profile-listings">
            <div className="section-header">
              <h2 className="section-title">My Listings</h2>
              <button onClick={loadMyListings} className="refresh-button">
                🔄
              </button>
            </div>
            
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading your listings...</p>
              </div>
            ) : myListings.length > 0 ? (
              <div className="listings-grid">
                {myListings.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/listing/${listing.id}`}
                    className="listing-card"
                  >
                    <div className="listing-header">
                      <span className="category-badge">
                        {listing.category}
                      </span>
                      <span className="price">${listing.price}</span>
                    </div>
                    
                    <h3 className="listing-title">{listing.title}</h3>
                    <p className="listing-description">
                      {listing.description}
                    </p>
                    
                    <div className="listing-footer">
                      <span className="listing-date">
                        Posted {formatDate(listing.created_at)}
                      </span>
                      <span className={`status-badge ${listing.is_active ? 'active' : 'inactive'}`}>
                        {listing.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3 className="empty-state-title">No Listings Yet</h3>
                <p className="empty-state-text">Create your first listing to get started</p>
                <Link to="/create-listing" className="btn btn-primary">
                  Create Listing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;