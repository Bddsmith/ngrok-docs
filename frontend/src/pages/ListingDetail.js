import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, messagesAPI } from '../services/api';
import './ListingDetail.css';

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadListing();
  }, [id]);

  const loadListing = async () => {
    try {
      setLoading(true);
      const data = await listingsAPI.getById(id);
      setListing(data);
    } catch (error) {
      console.error('Error loading listing:', error);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (!messageText.trim()) {
      return;
    }

    setSendingMessage(true);
    try {
      await messagesAPI.send({
        receiver_id: listing.user_id,
        listing_id: listing.id,
        content: messageText.trim(),
      }, user.id);
      
      setMessageText('');
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCallSeller = () => {
    if (listing.phone) {
      window.open(`tel:${listing.phone}`, '_self');
    } else {
      alert('Phone number not available');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="listing-detail-page">
        <div className="container">
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading listing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="listing-detail-page">
        <div className="container">
          <div className="error-state">
            <div className="error-icon">❌</div>
            <h2 className="error-title">Listing Not Found</h2>
            <p className="error-text">
              {error || 'The listing you are looking for does not exist.'}
            </p>
            <button onClick={() => navigate('/browse')} className="btn btn-primary">
              Browse Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && user.id === listing.user_id;

  return (
    <div className="listing-detail-page">
      <div className="container">
        <div className="listing-detail-container">
          {/* Back Button */}
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>

          {/* Listing Header */}
          <div className="listing-header">
            <div className="listing-title-section">
              <h1 className="listing-title">{listing.title}</h1>
              <div className="listing-meta">
                <span className="category-badge">
                  {listing.category}
                </span>
                <span className="listing-date">
                  Posted on {formatDate(listing.created_at)}
                </span>
              </div>
            </div>
            <div className="listing-price">
              ${listing.price}
            </div>
          </div>

          {/* Listing Content */}
          <div className="listing-content">
            {/* Images */}
            {listing.images && listing.images.length > 0 && (
              <div className="listing-images">
                <div className="image-gallery">
                  {listing.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${listing.title} - Image ${index + 1}`}
                      className="listing-image"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="listing-description">
              <h3 className="section-title">Description</h3>
              <p className="description-text">{listing.description}</p>
            </div>

            {/* Details */}
            <div className="listing-details">
              <h3 className="section-title">Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Category:</span>
                  <span className="detail-value">{listing.category}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">📍 {listing.location}</span>
                </div>
                
                {/* Category-specific details */}
                {listing.breed && (
                  <div className="detail-item">
                    <span className="detail-label">Breed:</span>
                    <span className="detail-value">{listing.breed}</span>
                  </div>
                )}
                {listing.age && (
                  <div className="detail-item">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{listing.age}</span>
                  </div>
                )}
                {listing.health_status && (
                  <div className="detail-item">
                    <span className="detail-label">Health Status:</span>
                    <span className="detail-value">{listing.health_status}</span>
                  </div>
                )}
                {listing.size && (
                  <div className="detail-item">
                    <span className="detail-label">Size:</span>
                    <span className="detail-value">{listing.size}</span>
                  </div>
                )}
                {listing.material && (
                  <div className="detail-item">
                    <span className="detail-label">Material:</span>
                    <span className="detail-value">{listing.material}</span>
                  </div>
                )}
                {listing.condition && (
                  <div className="detail-item">
                    <span className="detail-label">Condition:</span>
                    <span className="detail-value">{listing.condition}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Seller */}
            {!isOwner && (
              <div className="contact-seller">
                <h3 className="section-title">Contact Seller</h3>
                
                <div className="contact-actions">
                  <button onClick={handleCallSeller} className="btn btn-secondary">
                    📞 Call Seller
                  </button>
                </div>

                <form onSubmit={handleSendMessage} className="message-form">
                  <div className="form-group">
                    <label htmlFor="message" className="form-label">
                      Send a Message
                    </label>
                    <textarea
                      id="message"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      className="form-input form-textarea"
                      placeholder="Hi, I'm interested in your listing..."
                      rows="4"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingMessage || !messageText.trim()}
                  >
                    {sendingMessage ? 'Sending...' : '💬 Send Message'}
                  </button>
                </form>

                {!user && (
                  <div className="login-prompt-small">
                    <p>
                      <button 
                        onClick={() => navigate('/login')}
                        className="auth-link"
                      >
                        Login
                      </button>
                      {' '}or{' '}
                      <button 
                        onClick={() => navigate('/register')}
                        className="auth-link"
                      >
                        Sign up
                      </button>
                      {' '}to contact the seller
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="owner-actions">
                <h3 className="section-title">Your Listing</h3>
                <p className="owner-note">
                  This is your listing. You can edit or delete it from your profile.
                </p>
                <button 
                  onClick={() => navigate('/profile')}
                  className="btn btn-outline"
                >
                  Go to Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail;