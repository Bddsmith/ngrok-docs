import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { listingsAPI, userAPI } from '../services/api';
import { RatingDisplay, RatingForm, RatingsList } from '../components/RatingSystem';
import { FollowButton } from '../components/FollowSystem';
import './ListingDetail.css';

const ListingDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [sellerRating, setSellerRating] = useState(null);

  useEffect(() => {
    if (id) {
      loadListing();
    }
  }, [id]);

  // Load seller rating when seller info is available
  useEffect(() => {
    if (seller?.id) {
      loadSellerRating();
    }
  }, [seller]);

  const loadSellerRating = async () => {
    try {
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendURL}/api/sellers/${seller.id}/rating-summary`);
      if (response.ok) {
        const ratingData = await response.json();
        setSellerRating(ratingData);
      }
    } catch (error) {
      console.error('Failed to load seller rating:', error);
    }
  };

  const loadListing = async () => {
    try {
      setLoading(true);
      const listingData = await listingsAPI.getById(id);
      setListing(listingData);
      
      // Load seller info
      const sellerData = await userAPI.getProfile(listingData.user_id);
      setSeller(sellerData);
    } catch (error) {
      console.error('Error loading listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSeller = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    navigate(`/chat/${listing.id}/${listing.user_id}`);
  };

  const handleRateSeller = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.id === listing.user_id) {
      alert('You cannot rate your own listing');
      return;
    }

    setShowRatingForm(true);
  };

  const handleRatingSubmitted = (newRating) => {
    setShowRatingForm(false);
    // Reload seller rating to show updated info
    loadSellerRating();
    alert('Thank you for your rating!');
  };

  const handleRatingFormCancel = () => {
    setShowRatingForm(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="listing-detail-page">
        <div className="container">
          <div className="loading-section">
            <div className="spinner"></div>
            <p>Loading listing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!listing || !seller) {
    return (
      <div className="listing-detail-page">
        <div className="container">
          <div className="error-section">
            <i className="fas fa-exclamation-triangle"></i>
            <h2>Listing not found</h2>
            <p>This listing may have been removed or doesn't exist.</p>
            <Link to="/browse" className="btn btn-primary">
              <i className="fas fa-arrow-left"></i>
              Back to Browse
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnListing = user?.id === listing.user_id;
  const hasImages = listing.images && listing.images.length > 0;

  return (
    <div className="listing-detail-page">
      <div className="container">
        <div className="listing-detail-container">
          {/* Back Button */}
          <div className="back-navigation">
            <button onClick={() => navigate(-1)} className="back-btn">
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
          </div>

          <div className="listing-detail-content">
            {/* Images Section */}
            <div className="listing-images">
              {hasImages ? (
                <div className="image-gallery">
                  <div className="main-image">
                    <img 
                      src={listing.images[currentImageIndex]} 
                      alt={listing.title}
                    />
                    {listing.images.length > 1 && (
                      <>
                        <button 
                          className="image-nav prev" 
                          onClick={() => setCurrentImageIndex(
                            currentImageIndex === 0 ? listing.images.length - 1 : currentImageIndex - 1
                          )}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </button>
                        <button 
                          className="image-nav next" 
                          onClick={() => setCurrentImageIndex(
                            currentImageIndex === listing.images.length - 1 ? 0 : currentImageIndex + 1
                          )}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </button>
                        <div className="image-counter">
                          {currentImageIndex + 1} / {listing.images.length}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {listing.images.length > 1 && (
                    <div className="image-thumbnails">
                      {listing.images.map((image, index) => (
                        <button
                          key={index}
                          className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img src={image} alt={`Thumbnail ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-images">
                  <i className="fas fa-image"></i>
                  <span>No images available</span>
                </div>
              )}
            </div>

            {/* Listing Information */}
            <div className="listing-info">
              <div className="listing-header">
                <div className="title-section">
                  <span className="category-badge">{listing.category}</span>
                  <h1 className="listing-title">{listing.title}</h1>
                  <div className="price-section">
                    <span className="price">${listing.price}</span>
                  </div>
                </div>
              </div>

              <div className="listing-description">
                <h3>Description</h3>
                <p>{listing.description}</p>
              </div>

              <div className="listing-details">
                <h3>Details</h3>
                <div className="details-grid">
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{listing.location}</span>
                  </div>
                  
                  <div className="detail-item">
                    <i className="fas fa-calendar"></i>
                    <span className="detail-label">Posted:</span>
                    <span className="detail-value">{formatDate(listing.created_at)}</span>
                  </div>

                  {listing.breed && (
                    <div className="detail-item">
                      <i className="fas fa-paw"></i>
                      <span className="detail-label">Breed:</span>
                      <span className="detail-value">{listing.breed}</span>
                    </div>
                  )}

                  {listing.age && (
                    <div className="detail-item">
                      <i className="fas fa-clock"></i>
                      <span className="detail-label">Age:</span>
                      <span className="detail-value">{listing.age}</span>
                    </div>
                  )}

                  {listing.health_status && (
                    <div className="detail-item">
                      <i className="fas fa-heart"></i>
                      <span className="detail-label">Health:</span>
                      <span className="detail-value">{listing.health_status}</span>
                    </div>
                  )}

                  {listing.size && (
                    <div className="detail-item">
                      <i className="fas fa-expand-arrows-alt"></i>
                      <span className="detail-label">Size:</span>
                      <span className="detail-value">{listing.size}</span>
                    </div>
                  )}

                  {listing.material && (
                    <div className="detail-item">
                      <i className="fas fa-hammer"></i>
                      <span className="detail-label">Material:</span>
                      <span className="detail-value">{listing.material}</span>
                    </div>
                  )}

                  {listing.condition && (
                    <div className="detail-item">
                      <i className="fas fa-star"></i>
                      <span className="detail-label">Condition:</span>
                      <span className="detail-value">{listing.condition}</span>
                    </div>
                  )}

                  {/* Eggs-specific fields */}
                  {listing.egg_type && (
                    <div className="detail-item">
                      <i className="fas fa-egg"></i>
                      <span className="detail-label">Egg Type:</span>
                      <span className="detail-value">{listing.egg_type}</span>
                    </div>
                  )}

                  {listing.laid_date && (
                    <div className="detail-item freshness-highlight">
                      <i className="fas fa-calendar-day"></i>
                      <span className="detail-label">Collection Date:</span>
                      <span className="detail-value">{formatDate(listing.laid_date)} 
                        <span className="freshness-indicator">
                          ({calculateFreshness(listing.laid_date)})
                        </span>
                      </span>
                    </div>
                  )}

                  {listing.feed_type && (
                    <div className="detail-item health-highlight">
                      <i className="fas fa-seedling"></i>
                      <span className="detail-label">Feed Type:</span>
                      <span className="detail-value">{listing.feed_type}</span>
                    </div>
                  )}

                  {listing.quantity_available && (
                    <div className="detail-item">
                      <i className="fas fa-weight"></i>
                      <span className="detail-label">Quantity:</span>
                      <span className="detail-value">{listing.quantity_available}</span>
                    </div>
                  )}

                  {listing.farm_practices && (
                    <div className="detail-item certification-highlight">
                      <i className="fas fa-certificate"></i>
                      <span className="detail-label">Farm Practices:</span>
                      <span className="detail-value">{listing.farm_practices}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Information */}
              <div className="seller-info">
                <h3>Seller Information</h3>
                <div className="seller-card">
                  <div className="seller-details">
                    <div className="seller-avatar">
                      <i className="fas fa-user"></i>
                    </div>
                    <div className="seller-content">
                      <h4 className="seller-name">{seller.name}</h4>
                      <p className="seller-location">
                        <i className="fas fa-map-marker-alt"></i>
                        {seller.location}
                      </p>
                      <p className="seller-phone">
                        <i className="fas fa-phone"></i>
                        {seller.phone}
                      </p>
                      
                      {/* Seller Rating Display */}
                      {sellerRating && (
                        <div className="seller-rating">
                          <RatingDisplay 
                            averageRating={sellerRating.average_rating}
                            totalRatings={sellerRating.total_ratings}
                            showBreakdown={sellerRating.total_ratings > 0}
                            ratingBreakdown={sellerRating.rating_breakdown}
                          />
                        </div>
                      )}
                      
                      {/* Follow Button */}
                      <div className="seller-follow">
                        <FollowButton 
                          userId={seller.id}
                          userName={seller.name}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {!isOwnListing && (
                    <div className="contact-actions">
                      <button 
                        onClick={handleContactSeller}
                        className="btn btn-primary contact-btn"
                      >
                        <i className="fas fa-comment"></i>
                        Contact Seller
                      </button>
                      <a 
                        href={`tel:${seller.phone}`} 
                        className="btn btn-outline call-btn"
                      >
                        <i className="fas fa-phone"></i>
                        Call
                      </a>
                      <button 
                        onClick={handleRateSeller}
                        className="btn btn-secondary rate-btn"
                      >
                        <i className="fas fa-star"></i>
                        Rate Seller
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller Reviews */}
              {seller && sellerRating && sellerRating.total_ratings > 0 && (
                <div className="seller-reviews">
                  <h3>Seller Reviews</h3>
                  <RatingsList sellerId={seller.id} limit={5} />
                </div>
              )}

              {isOwnListing && (
                <div className="owner-actions">
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle"></i>
                    This is your listing
                  </div>
                  <Link to="/profile" className="btn btn-outline">
                    <i className="fas fa-edit"></i>
                    Manage Listings
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Rating Form Modal */}
      {showRatingForm && listing && (
        <RatingForm 
          sellerId={listing.user_id}
          listingId={listing.id}
          onRatingSubmitted={handleRatingSubmitted}
          onCancel={handleRatingFormCancel}
        />
      )}
    </div>
  );
};

export default ListingDetail;