import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../services/api';
import './Messages.css';

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const data = await messagesAPI.getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) {
    return (
      <div className="messages-page">
        <div className="container">
          <div className="login-prompt">
            <div className="login-prompt-icon">👤</div>
            <h2 className="login-prompt-title">Login Required</h2>
            <p className="login-prompt-text">Please log in to view your messages</p>
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
    <div className="messages-page">
      <div className="container">
        <div className="messages-container">
          <div className="messages-header">
            <h1 className="page-title">Messages</h1>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length > 0 ? (
            <div className="conversations-list">
              {conversations.map((conversation) => {
                const [listingId, otherUserId] = conversation.id.split('_');
                
                return (
                  <div key={conversation.id} className="conversation-card">
                    <div className="conversation-avatar">
                      👤
                      {conversation.unread_count > 0 && (
                        <span className="unread-badge">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </span>
                      )}
                    </div>
                    
                    <div className="conversation-content">
                      <div className="conversation-header">
                        <h3 className="conversation-user">{conversation.other_user_name}</h3>
                        <span className="conversation-time">
                          {formatTime(conversation.last_message_time)}
                        </span>
                      </div>
                      
                      <p className="conversation-listing">
                        {conversation.listing_title}
                      </p>
                      
                      <p className={`conversation-message ${
                        conversation.unread_count > 0 ? 'unread' : ''
                      }`}>
                        {conversation.last_message}
                      </p>
                    </div>
                    
                    <div className="conversation-arrow">
                      →
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">💬</div>
              <h3 className="empty-state-title">No Messages Yet</h3>
              <p className="empty-state-text">
                Start a conversation by contacting a seller from their listing
              </p>
              <Link to="/browse" className="btn btn-primary">
                Browse Listings
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;