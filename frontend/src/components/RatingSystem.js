import React, { useState } from 'react';
import axios from 'axios';
import './RatingSystem.css';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'medium' }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (star) => {
    if (!readonly && onRatingChange) {
      onRatingChange(star);
    }
  };

  const handleMouseEnter = (star) => {
    if (!readonly) {
      setHoverRating(star);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  return (
    <div className={`star-rating ${size} ${readonly ? 'readonly' : 'interactive'}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star ${star <= (hoverRating || rating) ? 'filled' : 'empty'}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <i className="fas fa-star"></i>
        </button>
      ))}
    </div>
  );
};

const RatingDisplay = ({ averageRating, totalRatings, showBreakdown = false, ratingBreakdown = null }) => {
  return (
    <div className="rating-display">
      <div className="rating-summary">
        <StarRating rating={averageRating} readonly size="small" />
        <span className="rating-text">
          {averageRating > 0 ? averageRating.toFixed(1) : 'No ratings'}
        </span>
        {totalRatings > 0 && (
          <span className="rating-count">
            ({totalRatings} review{totalRatings !== 1 ? 's' : ''})
          </span>
        )}
      </div>

      {showBreakdown && ratingBreakdown && totalRatings > 0 && (
        <div className="rating-breakdown">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="breakdown-row">
              <span className="stars-label">{stars} stars</span>
              <div className="breakdown-bar">
                <div 
                  className="breakdown-fill"
                  style={{ 
                    width: `${totalRatings > 0 ? (ratingBreakdown[stars] / totalRatings) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <span className="breakdown-count">({ratingBreakdown[stars]})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RatingForm = ({ sellerId, listingId, onRatingSubmitted, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Get current user ID from localStorage (you might have this stored differently)
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const backendURL = process.env.REACT_APP_BACKEND_URL || '';
      const response = await axios.post(`${backendURL}/api/ratings`, {
        seller_id: sellerId,
        listing_id: listingId,
        rating: rating,
        review: review.trim() || null
      }, {
        params: { buyer_id: user.id }
      });

      if (onRatingSubmitted) {
        onRatingSubmitted(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rating-form-modal">
      <div className="rating-form-content">
        <h3>Rate This Seller</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="rating-input-section">
            <label>Your Rating</label>
            <StarRating 
              rating={rating} 
              onRatingChange={setRating}
              size="large"
            />
            <p className="rating-help">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Poor - Had issues"}
              {rating === 2 && "Fair - Below expectations"}
              {rating === 3 && "Good - Met expectations"}
              {rating === 4 && "Great - Exceeded expectations"}
              {rating === 5 && "Excellent - Outstanding experience"}
            </p>
          </div>

          <div className="review-input-section">
            <label htmlFor="review">Your Review (Optional)</label>
            <textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Tell others about your experience with this seller..."
              rows={4}
              maxLength={500}
            />
            <div className="character-count">
              {review.length}/500 characters
            </div>
          </div>

          {error && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}

          <div className="rating-form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-star"></i>
                  Submit Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RatingsList = ({ sellerId, limit = 10 }) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const loadRatings = async () => {
      try {
        const backendURL = process.env.REACT_APP_BACKEND_URL || '';
        const response = await axios.get(`${backendURL}/api/sellers/${sellerId}/ratings?limit=${limit}`);
        setRatings(response.data);
      } catch (error) {
        setError('Failed to load ratings');
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      loadRatings();
    }
  }, [sellerId, limit]);

  if (loading) {
    return (
      <div className="ratings-loading">
        <div className="spinner"></div>
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div className="ratings-error">
        <i className="fas fa-exclamation-triangle"></i>
        {error}
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="no-ratings">
        <i className="fas fa-star-o"></i>
        No reviews yet
      </div>
    );
  }

  return (
    <div className="ratings-list">
      {ratings.map((rating) => (
        <div key={rating.id} className="rating-item">
          <div className="rating-header">
            <StarRating rating={rating.rating} readonly size="small" />
            <span className="rating-date">
              {new Date(rating.created_at).toLocaleDateString()}
            </span>
          </div>
          {rating.review && (
            <p className="rating-review">{rating.review}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export { StarRating, RatingDisplay, RatingForm, RatingsList };