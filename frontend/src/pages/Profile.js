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
    try {
      setLoading(true);
      const data = await listingsAPI.getUserListings(user.id);
      setMyListings(data);
    } catch (error) {
      console.error('Error loading listings:', error);
      setMyListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/');
    }
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="container-sm">
          <div className="auth-required">
            <i className="fas fa-lock"></i>
            <h2>Authentication Required</h2>
            <p>You need to be logged in to view your profile.</p>
            <Link to="/login" className="btn btn-primary">
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-container">
        <div className="container">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-info">
              <div className="profile-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="profile-details">
                <h1 className="profile-name">{user.name}</h1>
                <p className="profile-email">{user.email}</p>
                <p className="profile-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {user.location}
                </p>
                <p className="profile-phone">
                  <i className="fas fa-phone"></i>
                  {user.phone}
                </p>
              </div>
            </div>
            
            <div className="profile-actions">
              <Link to="/create-listing" className="btn btn-primary">
                <i className="fas fa-plus"></i>
                Create Listing
              </Link>
              <button onClick={handleLogout} className="btn btn-outline">
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat-card">
              <span className="stat-number">{myListings.length}</span>
              <span className="stat-label">Active Listings</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">
                {user.created_at ? new Date(user.created_at).getFullYear() : 'N/A'}
              </span>
              <span className="stat-label">Member Since</span>
            </div>
          </div>

          {/* My Listings */}
          <div className="my-listings-section">
            <div className="section-header">
              <h2>My Listings</h2>
              <Link to="/create-listing" className="btn btn-secondary">
                <i className="fas fa-plus"></i>
                Add New
              </Link>
            </div>

            {loading ? (
              <div className="loading-section">
                <div className="spinner"></div>
                <p>Loading your listings...</p>
              </div>
            ) : myListings.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-list"></i>
                <h3>No listings yet</h3>
                <p>Create your first listing to get started!</p>
                <Link to="/create-listing" className="btn btn-primary">
                  <i className="fas fa-plus"></i>
                  Create Listing
                </Link>
              </div>
            ) : (
              <div className="listings-grid">
                {myListings.map((listing) => (
                  <Link 
                    to={`/listing/${listing.id || listing._id}`} 
                    key={listing.id || listing._id} 
                    className="profile-listing-card"
                  >
                    <div className="listing-image">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} />
                      ) : (
                        <div className="listing-placeholder">
                          <i className="fas fa-image"></i>
                        </div>
                      )}
                      <div className="listing-category">
                        {listing.category}
                      </div>
                    </div>
                    
                    <div className="listing-content">
                      <div className="listing-header">
                        <h3 className="listing-title">{listing.title}</h3>
                        <span className="listing-price">${listing.price}</span>
                      </div>
                      
                      <p className="listing-description">
                        {listing.description}
                      </p>
                      
                      <div className="listing-footer">
                        <span className="listing-date">
                          {new Date(listing.created_at).toLocaleDateString()}
                        </span>
                        <span className={`listing-status ${listing.is_active ? 'active' : 'inactive'}`}>
                          {listing.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;