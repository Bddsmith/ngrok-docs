import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './FollowSystem.css';

const FollowButton = ({ userId, userName, initialFollowState = null, onFollowChange }) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowState);
  const [isLoading, setIsLoading] = useState(false);
  const [followStats, setFollowStats] = useState({ followers_count: 0, following_count: 0 });

  useEffect(() => {
    if (user && userId && userId !== user.id) {
      loadFollowStats();
    }
  }, [userId, user]);

  const loadFollowStats = async () => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.get(
        `${backendURL}/api/users/${userId}/follow-stats?current_user_id=${user.id}`
      );
      setFollowStats(response.data);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error('Failed to load follow stats:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!user) {
      alert('Please login to follow users');
      return;
    }

    if (userId === user.id) {
      alert('You cannot follow yourself');
      return;
    }

    setIsLoading(true);
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      
      if (isFollowing) {
        // Unfollow
        await axios.delete(`${backendURL}/api/users/${userId}/follow?current_user_id=${user.id}`);
        setIsFollowing(false);
        setFollowStats(prev => ({ ...prev, followers_count: prev.followers_count - 1 }));
      } else {
        // Follow
        await axios.post(`${backendURL}/api/users/${userId}/follow?current_user_id=${user.id}`);
        setIsFollowing(true);
        setFollowStats(prev => ({ ...prev, followers_count: prev.followers_count + 1 }));
      }

      if (onFollowChange) {
        onFollowChange(isFollowing);
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      alert('Failed to update follow status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show follow button for own profile
  if (!user || userId === user.id) {
    return null;
  }

  return (
    <div className="follow-button-container">
      <button 
        onClick={handleFollowToggle}
        disabled={isLoading}
        className={`follow-btn ${isFollowing ? 'following' : 'not-following'} ${isLoading ? 'loading' : ''}`}
      >
        {isLoading ? (
          <>
            <div className="spinner"></div>
            {isFollowing ? 'Unfollowing...' : 'Following...'}
          </>
        ) : (
          <>
            <i className={`fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}`}></i>
            {isFollowing ? `Following ${userName}` : `Follow ${userName}`}
          </>
        )}
      </button>
      
      {followStats.followers_count > 0 && (
        <div className="follow-stats">
          <span className="followers-count">
            <i className="fas fa-users"></i>
            {followStats.followers_count} follower{followStats.followers_count !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};

const FollowStats = ({ userId, showDetailed = true }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ followers_count: 0, following_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const currentUserId = user?.id || '';
      const response = await axios.get(
        `${backendURL}/api/users/${userId}/follow-stats?current_user_id=${currentUserId}`
      );
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load follow stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="follow-stats loading">
        <div className="spinner-small"></div>
      </div>
    );
  }

  if (!showDetailed) {
    return (
      <div className="follow-stats compact">
        <span className="stat-item">
          <i className="fas fa-users"></i>
          {stats.followers_count}
        </span>
      </div>
    );
  }

  return (
    <div className="follow-stats detailed">
      <div className="stat-item">
        <span className="stat-number">{stats.followers_count}</span>
        <span className="stat-label">Follower{stats.followers_count !== 1 ? 's' : ''}</span>
      </div>
      <div className="stat-divider">•</div>
      <div className="stat-item">
        <span className="stat-number">{stats.following_count}</span>
        <span className="stat-label">Following</span>
      </div>
    </div>
  );
};

const FollowersList = ({ userId, isVisible, onClose }) => {
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible && userId) {
      loadFollowers();
    }
  }, [isVisible, userId]);

  const loadFollowers = async () => {
    setLoading(true);
    setError('');
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.get(`${backendURL}/api/users/${userId}/followers`);
      setFollowers(response.data);
    } catch (error) {
      console.error('Failed to load followers:', error);
      setError('Failed to load followers');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="followers-modal">
      <div className="followers-content">
        <div className="followers-header">
          <h3>Followers</h3>
          <button onClick={onClose} className="close-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="followers-list">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading followers...</p>
            </div>
          )}
          
          {error && (
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          )}
          
          {!loading && !error && followers.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-users"></i>
              <p>No followers yet</p>
            </div>
          )}
          
          {followers.map((follow) => (
            <div key={follow._id || follow.id} className="follower-item">
              <div className="follower-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="follower-info">
                <h4>{follow.follower.name}</h4>
                <p className="follower-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {follow.follower.location}
                </p>
                <p className="follow-date">
                  Followed on {new Date(follow.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FollowingList = ({ userId, isVisible, onClose }) => {
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isVisible && userId) {
      loadFollowing();
    }
  }, [isVisible, userId]);

  const loadFollowing = async () => {
    setLoading(true);
    setError('');
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.get(`${backendURL}/api/users/${userId}/following`);
      setFollowing(response.data);
    } catch (error) {
      console.error('Failed to load following:', error);
      setError('Failed to load following');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="following-modal">
      <div className="following-content">
        <div className="following-header">
          <h3>Following</h3>
          <button onClick={onClose} className="close-btn">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="following-list">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading following...</p>
            </div>
          )}
          
          {error && (
            <div className="error-state">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          )}
          
          {!loading && !error && following.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-user-friends"></i>
              <p>Not following anyone yet</p>
            </div>
          )}
          
          {following.map((follow) => (
            <div key={follow._id || follow.id} className="following-item">
              <div className="following-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div className="following-info">
                <h4>{follow.following.name}</h4>
                <p className="following-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {follow.following.location}
                </p>
                <p className="follow-date">
                  Following since {new Date(follow.created_at).toLocaleDateString()}
                </p>
              </div>
              <FollowButton 
                userId={follow.following._id || follow.following.id}
                userName={follow.following.name}
                initialFollowState={true}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { FollowButton, FollowStats, FollowersList, FollowingList };