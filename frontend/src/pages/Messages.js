import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Messages = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page-container">
        <div className="container-sm">
          <div className="auth-required">
            <i className="fas fa-lock"></i>
            <h2>Authentication Required</h2>
            <p>You need to be logged in to view your messages.</p>
            <Link to="/login" className="btn btn-primary">
              Login to Continue
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            Communicate with buyers and sellers
          </p>
        </div>

        <div className="empty-state">
          <i className="fas fa-comments"></i>
          <h3>No messages yet</h3>
          <p>
            Start a conversation by contacting a seller from their listing page.
          </p>
          <Link to="/browse" className="btn btn-primary">
            <i className="fas fa-search"></i>
            Browse Listings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Messages;