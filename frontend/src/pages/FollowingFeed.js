import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FollowButton } from '../components/FollowSystem';
import axios from 'axios';
import './FollowingFeed.css';

const FollowingFeed = () => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadFollowingFeed();
    }
  }, [user]);

  const loadFollowingFeed = async () => {
    try {
      setLoading(true);
      setError('');
      
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.get(`${backendURL}/api/feed/following?current_user_id=${user.id}`);
      setFeedItems(response.data);
    } catch (error) {
      console.error('Failed to load following feed:', error);
      setError('Failed to load your following feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const calculateFreshness = (laidDate) => {
    if (!laidDate) return '';
    
    const today = new Date();
    const collectionDate = new Date(laidDate);
    const diffTime = Math.abs(today - collectionDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Fresh Today!';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return `${Math.ceil(diffDays / 7)} weeks ago`;
  };

  if (!user) {
    return (
      <div className="following-feed-page">
        <div className="container">
          <div className="login-required">
            <i className="fas fa-user-lock"></i>
            <h2>Login Required</h2>
            <p>Please log in to see updates from sellers you follow.</p>
            <Link to="/login" className="btn btn-primary">
              <i className="fas fa-sign-in-alt"></i>
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="following-feed-page">
      <div className="feed-header">
        <div className="container">
          <h1 className="page-title">
            <i className="fas fa-stream"></i>
            Following Feed
          </h1>
          <p className="page-subtitle">
            Latest listings from sellers you follow
          </p>
        </div>
      </div>

      <div className="feed-content">
        <div className="container">
          {loading ? (
            <div className="loading-section">
              <div className="spinner"></div>
              <p>Loading your feed...</p>
            </div>
          ) : error ? (
            <div className="error-section">
              <i className="fas fa-exclamation-triangle"></i>
              <h3>Error Loading Feed</h3>
              <p>{error}</p>
              <button onClick={loadFollowingFeed} className="btn btn-primary">
                <i className="fas fa-redo"></i>
                Try Again
              </button>
            </div>
          ) : feedItems.length === 0 ? (
            <div className="empty-feed">
              <i className="fas fa-rss"></i>
              <h3>Your Feed is Empty</h3>
              <p>
                Start following sellers to see their latest listings here. 
                Discover great sellers by browsing the marketplace!
              </p>
              <div className="empty-feed-actions">
                <Link to="/browse" className="btn btn-primary">
                  <i className="fas fa-search"></i>
                  Browse Marketplace
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="feed-info">
                <h2>{feedItems.length} recent listing{feedItems.length !== 1 ? 's' : ''} from your followed sellers</h2>
                <button onClick={loadFollowingFeed} className="refresh-btn">
                  <i className="fas fa-sync-alt"></i>
                  Refresh
                </button>
              </div>
              
              <div className="feed-grid">
                {feedItems.map((item) => (
                  <div key={item._id || item.id} className="feed-item">
                    <div className="feed-item-header">
                      <div className="seller-info">
                        <div className="seller-avatar">
                          <i className="fas fa-user"></i>
                        </div>
                        <div className="seller-details">
                          <h4 className="seller-name">{item.seller_name}</h4>
                          <p className="seller-location">
                            <i className="fas fa-map-marker-alt"></i>
                            {item.seller_location}
                          </p>
                        </div>
                      </div>
                      <div className="post-time">
                        <i className="fas fa-clock"></i>
                        {formatDate(item.created_at)}
                      </div>
                    </div>

                    <Link to={`/listing/${item._id || item.id}`} className="listing-link">
                      <div className="listing-image">
                        {item.images && item.images.length > 0 ? (
                          <img src={item.images[0]} alt={item.title} />
                        ) : (
                          <div className="listing-placeholder">
                            <i className="fas fa-image"></i>
                            <span>No Image</span>
                          </div>
                        )}
                        <div className="listing-category">
                          {item.category}
                        </div>
                      </div>
                      
                      <div className="listing-content">
                        <div className="listing-header">
                          <h3 className="listing-title">{item.title}</h3>
                          <span className="listing-price">${item.price}</span>
                        </div>
                        
                        <p className="listing-description">
                          {item.description}
                        </p>
                        
                        <div className="listing-details">
                          {/* Category-specific details */}
                          {item.category === 'eggs' && item.laid_date && (
                            <span className="listing-detail freshness">
                              <i className="fas fa-calendar-day"></i>
                              {calculateFreshness(item.laid_date)}
                            </span>
                          )}
                          
                          {item.category === 'eggs' && item.feed_type && (
                            <span className="listing-detail feed-type">
                              <i className="fas fa-seedling"></i>
                              {item.feed_type}
                            </span>
                          )}
                          
                          {item.category === 'poultry' && item.breed && (
                            <span className="listing-detail">
                              <i className="fas fa-paw"></i>
                              {item.breed}
                            </span>
                          )}
                          
                          {item.category === 'poultry' && item.age && (
                            <span className="listing-detail">
                              <i className="fas fa-clock"></i>
                              {item.age}
                            </span>
                          )}
                          
                          {(item.category === 'coop' || item.category === 'cage') && item.size && (
                            <span className="listing-detail">
                              <i className="fas fa-expand-arrows-alt"></i>
                              {item.size}
                            </span>
                          )}
                        </div>
                        
                        <div className="listing-footer">
                          <span className="listing-location">
                            <i className="fas fa-map-marker-alt"></i>
                            {item.location}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="feed-item-actions">
                      <FollowButton 
                        userId={item.user_id}
                        userName={item.seller_name}
                        initialFollowState={true}
                      />
                      <Link to={`/listing/${item._id || item.id}`} className="btn btn-outline view-btn">
                        <i className="fas fa-eye"></i>
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowingFeed;