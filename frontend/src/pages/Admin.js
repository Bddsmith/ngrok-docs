import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdminAuth, getAdminUsername } from '../hooks/useAdminAuth';
import './Admin.css';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      
      // Load both users and stats
      const [usersResponse, statsResponse] = await Promise.all([
        axios.get(`${backendURL}/api/admin/users`),
        axios.get(`${backendURL}/api/admin/stats`)
      ]);
      
      setUsers(usersResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Failed to load admin data. Please check if the backend is running.');
    } finally {
      setLoading(false);
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
          <h1 className="admin-title">
            <i className="fas fa-cog"></i>
            Admin Dashboard
          </h1>
          <p className="admin-subtitle">
            Manage your Poultry Marketplace
          </p>
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