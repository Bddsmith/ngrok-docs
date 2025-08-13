import React, { useState, useEffect } from 'react';
import { useAdminAuth, getAdminUsername } from '../hooks/useAdminAuth';
import { adminAPI, flagAPI } from '../services/api';
import './Admin.css';

const Admin = () => {
  const { isAuthenticated, loading: authLoading, logout } = useAdminAuth();
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [flagsSummary, setFlagsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [listingsFilter, setListingsFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Load all admin data
      const [usersData, statsData, notificationsData, flagsData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getStats(),
        adminAPI.getNotifications(),
        adminAPI.getFlagsSummary()
      ]);
      
      setUsers(usersData);
      setStats(statsData);
      setNotifications(notificationsData);
      setFlagsSummary(flagsData);
      
      // Load listings if on listings tab
      if (activeTab === 'listings') {
        await loadListings();
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const loadListings = async () => {
    try {
      const listingsData = await adminAPI.getListings(listingsFilter, null, searchTerm);
      setListings(listingsData);
    } catch (error) {
      console.error('Error loading listings:', error);
      setError('Failed to load listings');
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'listings' && listings.length === 0) {
      await loadListings();
    }
  };

  const handleListingAction = async (listingId, action, reason, notes = '') => {
    try {
      await adminAPI.listingAction(listingId, action, reason, notes);
      // Reload listings and stats
      await loadListings();
      await loadAdminData();
      alert(`Listing ${action}d successfully!`);
    } catch (error) {
      console.error('Error performing listing action:', error);
      alert(`Failed to ${action} listing: ${error.message}`);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await adminAPI.markNotificationRead(notificationId);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Authenticating...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="admin-unauthorized">
        <div className="auth-message">
          <h2>🔒 Unauthorized Access</h2>
          <p>Admin authentication required to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading admin data...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        {/* Admin Header */}
        <div className="admin-header">
          <div className="admin-title-section">
            <h1>🛡️ Admin Dashboard</h1>
            <p>Welcome back, <strong>{getAdminUsername()}</strong></p>
          </div>
          
          {/* Notification Alert Box */}
          {stats?.admin_alerts && (
            <div className="notification-alerts">
              <div className="alert-item urgent">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{stats.admin_alerts.high_priority_notifications} urgent items</span>
              </div>
              <div className="alert-item flags">
                <i className="fas fa-flag"></i>
                <span>{stats.admin_alerts.unreviewed_flags} flagged listings</span>
              </div>
              <div className="alert-item notifications">
                <i className="fas fa-bell"></i>
                <span>{stats.admin_alerts.unread_notifications} unread notifications</span>
              </div>
            </div>
          )}
          
          <button onClick={logout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>

        {error && (
          <div className="admin-error">
            <i className="fas fa-exclamation-circle"></i>
            {error}
            <button onClick={loadAdminData} className="retry-btn">
              <i className="fas fa-refresh"></i>
              Retry
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="admin-nav">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            <i className="fas fa-chart-bar"></i>
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => handleTabChange('listings')}
          >
            <i className="fas fa-list"></i>
            Listings Management
            {stats?.admin_alerts?.unreviewed_flags > 0 && (
              <span className="badge">{stats.admin_alerts.unreviewed_flags}</span>
            )}
          </button>
          <button 
            className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => handleTabChange('notifications')}
          >
            <i className="fas fa-bell"></i>
            Notifications
            {stats?.admin_alerts?.unread_notifications > 0 && (
              <span className="badge">{stats.admin_alerts.unread_notifications}</span>
            )}
          </button>
          <button 
            className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => handleTabChange('users')}
          >
            <i className="fas fa-users"></i>
            Users
          </button>
        </div>

        {/* Tab Content */}
        <div className="admin-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && stats && (
            <div className="overview-tab">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.total_users}</h3>
                    <p>Total Users</p>
                    <small>{stats.recent_users} new this month</small>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-list"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.active_listings}</h3>
                    <p>Active Listings</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-comments"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.total_messages}</h3>
                    <p>Total Messages</p>
                  </div>
                </div>
                
                <div className="stat-card alert">
                  <div className="stat-icon">
                    <i className="fas fa-flag"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.admin_alerts?.unreviewed_flags || 0}</h3>
                    <p>Flagged Listings</p>
                    <small>Need Review</small>
                  </div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="category-breakdown">
                <h2>📊 Listings by Category</h2>
                <div className="category-stats">
                  <div className="category-item">
                    <span className="category-icon">🐔</span>
                    <div className="category-info">
                      <strong>Poultry</strong>
                      <span>{stats.listings_by_category.poultry}</span>
                    </div>
                  </div>
                  <div className="category-item featured">
                    <span className="category-icon">🥚</span>
                    <div className="category-info">
                      <strong>Fresh Local Eggs</strong>
                      <span>{stats.listings_by_category.eggs}</span>
                    </div>
                  </div>
                  <div className="category-item">
                    <span className="category-icon">🏠</span>
                    <div className="category-info">
                      <strong>Coops</strong>
                      <span>{stats.listings_by_category.coop}</span>
                    </div>
                  </div>
                  <div className="category-item">
                    <span className="category-icon">🔲</span>
                    <div className="category-info">
                      <strong>Cages</strong>
                      <span>{stats.listings_by_category.cage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flags Summary */}
              {flagsSummary && (
                <div className="flags-summary">
                  <h2>🚩 Flags Summary</h2>
                  <div className="flags-stats">
                    <div className="flag-stat total">
                      <span className="number">{flagsSummary.total_unreviewed_flags}</span>
                      <span className="label">Total Unreviewed</span>
                    </div>
                    <div className="flag-stat weekly">
                      <span className="number">{flagsSummary.recent_flags_this_week}</span>
                      <span className="label">This Week</span>
                    </div>
                  </div>
                  {flagsSummary.flags_by_reason && Object.keys(flagsSummary.flags_by_reason).length > 0 && (
                    <div className="flags-by-reason">
                      <h3>By Reason:</h3>
                      {Object.entries(flagsSummary.flags_by_reason).map(([reason, count]) => (
                        <div key={reason} className="reason-item">
                          <span className="reason">{reason}</span>
                          <span className="count">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Listings Management Tab */}
          {activeTab === 'listings' && (
            <ListingsManagement 
              listings={listings}
              onAction={handleListingAction}
              onFilterChange={(filter) => {
                setListingsFilter(filter);
                loadListings();
              }}
              onSearchChange={(search) => {
                setSearchTerm(search);
                loadListings();
              }}
              currentFilter={listingsFilter}
              searchTerm={searchTerm}
            />
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <NotificationsTab 
              notifications={notifications}
              onMarkRead={markNotificationRead}
              onRefresh={loadAdminData}
            />
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <UsersTab users={users} formatDate={formatDate} />
          )}
        </div>
      </div>
    </div>
  );
};
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Verifying admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, the useAdminAuth hook will redirect to login
  if (!isAuthenticated) {
    return null;
  }

  const renderOverview = () => (
    <div className="admin-overview">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.total_users || 0}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-list"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.active_listings || 0}</h3>
            <p>Active Listings</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-comments"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.total_messages || 0}</h3>
            <p>Total Messages</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.recent_users || 0}</h3>
            <p>New Users (30 days)</p>
          </div>
        </div>
      </div>

      <div className="category-stats">
        <h3>Listings by Category</h3>
        <div className="category-grid">
          <div className="category-stat">
            <span className="category-icon">🐔</span>
            <div>
              <h4>Poultry</h4>
              <p>{stats?.listings_by_category?.poultry || 0} listings</p>
            </div>
          </div>
          <div className="category-stat">
            <span className="category-icon">🥚</span>
            <div>
              <h4>Fresh Eggs</h4>
              <p>{stats?.listings_by_category?.eggs || 0} listings</p>
            </div>
          </div>
          <div className="category-stat">
            <span className="category-icon">🏠</span>
            <div>
              <h4>Coops</h4>
              <p>{stats?.listings_by_category?.coop || 0} listings</p>
            </div>
          </div>
          <div className="category-stat">
            <span className="category-icon">🔲</span>
            <div>
              <h4>Cages</h4>
              <p>{stats?.listings_by_category?.cage || 0} listings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="users-section">
      <div className="section-header">
        <h3>All Registered Users ({users.length})</h3>
        <button onClick={loadAdminData} className="refresh-btn">
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Joined</th>
              <th>Listings</th>
              <th>Messages</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="user-name">
                  <div className="user-avatar">
                    <i className="fas fa-user"></i>
                  </div>
                  <span>{user.name}</span>
                </td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.location}</td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <span className="stat-badge">{user.listing_count}</span>
                </td>
                <td>
                  <span className="stat-badge">{user.message_count}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="empty-state">
          <i className="fas fa-users"></i>
          <h3>No users found</h3>
          <p>No users have registered yet.</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Loading admin data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="container">
          <div className="error-section">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>Error Loading Admin Data</h2>
            <p>{error}</p>
            <button onClick={loadAdminData} className="btn btn-primary">
              <i className="fas fa-retry"></i>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="container">
          <div className="admin-title-section">
            <h1 className="admin-title">
              <i className="fas fa-cog"></i>
              Admin Dashboard
            </h1>
            <p className="admin-subtitle">
              Manage your Poultry Marketplace
            </p>
          </div>
          <div className="admin-user-section">
            <span className="admin-user-info">
              <i className="fas fa-user-shield"></i>
              Welcome, {getAdminUsername()}
            </span>
            <button onClick={logout} className="admin-logout-btn">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="admin-tabs">
          <button
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-bar"></i>
            Overview
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            Users ({users.length})
          </button>
        </div>

        <div className="admin-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
        </div>
      </div>
    </div>
  );
};

export default Admin;